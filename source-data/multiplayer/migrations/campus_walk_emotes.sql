-- Optional v2 exchange. Existing position-only clients and RPC remain unchanged.
-- One ephemeral fixed reaction per session; no messages or additional polling.
create table campus_walk_live.reactions (
 id uuid primary key references campus_walk_live.sessions(id) on delete cascade,
 kind smallint not null check(kind between 0 and 4),
 seq bigint not null check(seq between 0 and 9007199254740991),
 started_at timestamptz not null
);
alter table campus_walk_live.reactions enable row level security;
revoke all on campus_walk_live.reactions from public, anon, authenticated;
create function public.campus_walk_sync_emotes(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 snapshot jsonb; kind integer; sequence bigint; sid uuid; peers jsonb;
 t timestamptz := clock_timestamp();
begin
 if jsonb_typeof(p) is distinct from 'object'
 or jsonb_typeof(p->'emote') is distinct from 'number'
 or jsonb_typeof(p->'emoteSeq') is distinct from 'number' then
  raise exception 'Invalid reaction' using errcode='22023';
 end if;
 if (p->>'emote')::numeric not between 0 and 4 or (p->>'emote')::numeric<>trunc((p->>'emote')::numeric)
 or (p->>'emoteSeq')::numeric not between 0 and 9007199254740991 or (p->>'emoteSeq')::numeric<>trunc((p->>'emoteSeq')::numeric) then
  raise exception 'Invalid reaction' using errcode='22023';
 end if;
 -- The original RPC enforces exact keys, bounds, capability, scope and capacity.
 snapshot := public.campus_walk_sync(p - 'emote' - 'emoteSeq');
 if (snapshot->>'room') is null then return snapshot; end if;
 sid := (p->>'id')::uuid; kind := (p->>'emote')::integer; sequence := (p->>'emoteSeq')::bigint;
 insert into campus_walk_live.reactions as r (id,kind,seq,started_at)
 values(sid,kind,sequence,case when kind=0 then t-interval '3 seconds' else t end)
 on conflict(id) do update set kind=excluded.kind,seq=excluded.seq,
  started_at=case when excluded.kind=0 then r.started_at else t end
 where excluded.seq>r.seq and (excluded.kind=0 or t-r.started_at>=interval '3 seconds');
 select coalesce(jsonb_agg(peer || jsonb_build_object(
  'emote',case when r.kind>0 and t-r.started_at<interval '3 seconds' then r.kind else 0 end,
  'emoteAge',case when r.kind>0 then least(3000,greatest(0,extract(epoch from (t-r.started_at))*1000)) else 0 end,
  'emoteSeq',coalesce(r.seq,0))),'[]'::jsonb) into peers
 from jsonb_array_elements(snapshot->'peers') peer
 left join campus_walk_live.reactions r on r.id=(peer->>'id')::uuid;
 return jsonb_set(snapshot,'{peers}',peers);
end $$;
revoke all on function public.campus_walk_sync_emotes(jsonb) from public;
grant execute on function public.campus_walk_sync_emotes(jsonb) to anon, authenticated;
comment on function public.campus_walk_sync_emotes(jsonb) is 'Fixed 3s reactions with capability-protected game state, server cooldown and session expiry; no free text.';
