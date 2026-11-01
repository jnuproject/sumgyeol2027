-- Isolated, short-lived in-game state. No account data or position history.
create schema if not exists campus_walk_live;
revoke all on schema campus_walk_live from public, anon, authenticated;
create table if not exists campus_walk_live.sessions (
 id uuid primary key, secret uuid not null, scope text not null,
 seq bigint not null, x double precision not null, y double precision not null,
 z double precision not null, yaw double precision not null, speed double precision not null,
 cell_x integer not null, cell_z integer not null, room integer not null,
 touched_at timestamptz not null default clock_timestamp()
);
alter table campus_walk_live.sessions enable row level security;
revoke all on campus_walk_live.sessions from public, anon, authenticated;
create index if not exists campus_walk_expiry on campus_walk_live.sessions(touched_at);
create index if not exists campus_walk_room on campus_walk_live.sessions(scope,cell_x,cell_z,room,touched_at);

create or replace function public.campus_walk_sync(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 t timestamptz := clock_timestamp(); cutoff timestamptz := t - interval '20 seconds';
 sid uuid; skey uuid; scope_key text; sequence bigint; px double precision; py double precision;
 pz double precision; heading double precision; pace double precision; enabled boolean;
 previous campus_walk_live.sessions%rowtype; cx integer; cz integer; instance integer;
 total integer; neighbours jsonb; is_new boolean;
begin
 if jsonb_typeof(p) <> 'object' or exists(select 1 from jsonb_object_keys(p) k where k <> all(array['id','token','scope','seq','x','y','z','yaw','speed','active'])) then
  raise exception 'Invalid game state' using errcode='22023';
 end if;
 if jsonb_typeof(p->'active') <> 'boolean' or not(p ?& array['id','token','scope','seq','x','y','z','yaw','speed','active']) then
  raise exception 'Invalid game state' using errcode='22023';
 end if;
 sid := (p->>'id')::uuid; skey := (p->>'token')::uuid; scope_key := p->>'scope';
 if scope_key <> 'public' and scope_key !~ '^test-[a-f0-9-]{36}$' then raise exception 'Invalid scope' using errcode='22023'; end if;
 if exists(select 1 from unnest(array['seq','x','y','z','yaw','speed']) k where jsonb_typeof(p->k)<>'number') then raise exception 'Invalid game state' using errcode='22023'; end if;
 if (p->>'seq')::numeric < 0 or (p->>'seq')::numeric > 9007199254740991 or (p->>'seq')::numeric <> trunc((p->>'seq')::numeric) then raise exception 'Invalid sequence' using errcode='22023'; end if;
 sequence := (p->>'seq')::bigint; px := (p->>'x')::double precision; py := (p->>'y')::double precision;
 pz := (p->>'z')::double precision; heading := (p->>'yaw')::double precision; pace := (p->>'speed')::double precision; enabled := (p->>'active')::boolean;
 if not(abs(px)<3000 and abs(pz)<3000 and abs(py)<1000 and abs(heading)<100 and pace>=0 and pace<=30) then raise exception 'Invalid coordinates' using errcode='22023'; end if;
 select * into previous from campus_walk_live.sessions where id=sid for update;
 is_new := not found;
 if not is_new and (previous.secret<>skey or previous.scope<>scope_key) then raise exception 'Invalid session' using errcode='28000'; end if;
 if not enabled then
  delete from campus_walk_live.sessions where id=sid and secret=skey;
  select count(*) into total from campus_walk_live.sessions where scope=scope_key and touched_at>cutoff;
  return jsonb_build_object('count',total,'peers','[]'::jsonb,'room',null,'crowded',false);
 end if;
 cx:=floor(px/180); cz:=floor(pz/180);
 -- 20m hysteresis prevents room changes while walking along a cell edge.
 if not is_new and px between previous.cell_x*180-20 and (previous.cell_x+1)*180+20 and pz between previous.cell_z*180-20 and (previous.cell_z+1)*180+20 then cx:=previous.cell_x;cz:=previous.cell_z;end if;
 if is_new or previous.touched_at<=cutoff or cx<>previous.cell_x or cz<>previous.cell_z then
  -- Serialize admission only; routine position updates do not take this lock.
  perform pg_advisory_xact_lock(728214553);
  delete from campus_walk_live.sessions where id in (select id from campus_walk_live.sessions where touched_at<=cutoff for update skip locked);
  select count(*) into total from campus_walk_live.sessions;
  if (is_new or previous.touched_at<=cutoff) and total>=200 then
   select count(*) into total from campus_walk_live.sessions where scope=scope_key;
   return jsonb_build_object('count',total,'peers','[]'::jsonb,'room',null,'crowded',true,'retryMs',15000);
  end if;
  select candidate into instance from generate_series(0,199) candidate
   where (select count(*) from campus_walk_live.sessions s where s.scope=scope_key and s.cell_x=cx and s.cell_z=cz and s.room=candidate and s.id<>sid and s.touched_at>cutoff)<12
   order by candidate limit 1;
 else instance:=previous.room;
 end if;
 if is_new or (sequence>previous.seq and t-previous.touched_at>=interval '100 milliseconds') then
  insert into campus_walk_live.sessions values(sid,skey,scope_key,sequence,px,py,pz,heading,pace,cx,cz,instance,t)
  on conflict(id) do update set seq=excluded.seq,x=excluded.x,y=excluded.y,z=excluded.z,yaw=excluded.yaw,speed=excluded.speed,cell_x=excluded.cell_x,cell_z=excluded.cell_z,room=excluded.room,touched_at=excluded.touched_at where campus_walk_live.sessions.secret=excluded.secret and campus_walk_live.sessions.scope=excluded.scope;
  if not found then raise exception 'Invalid session' using errcode='28000'; end if;
 end if;
 select count(*) into total from campus_walk_live.sessions where scope=scope_key and touched_at>cutoff;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'seq',s.seq,'x',s.x,'y',s.y,'z',s.z,'yaw',s.yaw,'speed',s.speed,'active',true,'sampledAt',extract(epoch from s.touched_at)*1000)),'[]'::jsonb) into neighbours
 from (select * from campus_walk_live.sessions where scope=scope_key and cell_x=cx and cell_z=cz and room=instance and id<>sid and touched_at>cutoff and (x-px)^2+(z-pz)^2<22500 order by (x-px)^2+(z-pz)^2 limit 11) s;
 return jsonb_build_object('count',total,'peers',neighbours,'room',cx||':'||cz||':'||instance,'crowded',false,'intervalMs',case when total>120 then 400 else 200 end);
end $$;
revoke all on function public.campus_walk_sync(jsonb) from public;
grant execute on function public.campus_walk_sync(jsonb) to anon, authenticated;
comment on function public.campus_walk_sync(jsonb) is 'Bounded anonymous game-state exchange; UUID capability, 20s lease, 12-person cells, no history or chat.';
-- Expire even the last session when nobody else opens the game.
select cron.schedule('campus_walk_expiry','* * * * *', $job$delete from campus_walk_live.sessions where touched_at < now()-interval '45 seconds'$job$)
where not exists(select 1 from cron.job where jobname='campus_walk_expiry');
