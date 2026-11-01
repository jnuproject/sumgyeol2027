// Local PostgreSQL-in-WASM check only. Never connects to Supabase.
// Run: PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node --experimental-default-type=module verification/capacity-local.mjs
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.PGLITE_MODULE??'/tmp/campus-capacity-pg/node_modules/@electric-sql/pglite/dist/index.js');
const db=new PGlite();
try{
 await db.exec('create role anon; create role authenticated;');
 const sql=(await fs.readFile(new URL('../source-data/multiplayer/migrations/campus_walk_nearby.sql',import.meta.url),'utf8')).split('-- Expire even the last session')[0];
 await db.exec(sql);
 const scope='test-'+crypto.randomUUID(),users=[];let maxPeers=0;const started=performance.now();
 async function call(p,asAnon=true){if(asAnon)await db.exec('set role anon');try{return (await db.query('select public.campus_walk_sync($1::jsonb) as snapshot',[JSON.stringify(p)])).rows[0].snapshot;}finally{if(asAnon)await db.exec('reset role');}}
 const pose=i=>({id:crypto.randomUUID(),token:crypto.randomUUID(),scope,seq:1,x:-85,y:1,z:-450,yaw:0,speed:4,active:true});
 for(let i=0;i<100;i++){const p=pose(i);users.push(p);const s=await call(p);assert.equal(s.count,i+1);assert.ok(s.peers.length<=11);maxPeers=Math.max(maxPeers,s.peers.length);}
 const rooms=(await db.query('select room,count(*)::int n from campus_walk_live.sessions group by room')).rows;assert.ok(rooms.every(r=>r.n<=12));assert.equal(rooms.length,9);
 const first=users[0];await assert.rejects(()=>call({...first,token:crypto.randomUUID(),seq:2}),/Invalid session/);await assert.rejects(()=>call({...first,chat:'hello'}),/Invalid game state/);await assert.rejects(()=>call({...first,x:4000}),/Invalid coordinates/);
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from campus_walk_live.sessions'),/permission denied/);await db.exec('reset role');
 // Count and admission remain atomic/bounded in this sequential SQL check.
 for(let i=100;i<200;i++){const p=pose(i);users.push(p);await call(p);}const full=await call(pose(200));assert.equal(full.crowded,true);assert.equal(full.count,200);
 await call({...first,active:false,seq:2});assert.equal((await call(pose(201))).crowded,false);
 await db.exec("update campus_walk_live.sessions set touched_at=clock_timestamp()-interval '30 seconds'");const fresh=await call(pose(202));assert.equal(fresh.count,1);assert.equal(fresh.peers.length,0);
 console.log(JSON.stringify({engine:'local PGlite PostgreSQL',virtualSessions:200,roomsAt100:rooms.length,maxPeers,capacityGuard:true,tokenProtection:true,anonymousTableAccessDenied:true,chatRejected:true,expiredSessionsRemoved:true,elapsedMs:Math.round(performance.now()-started),productionLoadTest:false,cronTested:false}));
}finally{await db.close();}
