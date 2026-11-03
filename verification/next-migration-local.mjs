import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.PGLITE_MODULE??'/tmp/campus-capacity-pg/node_modules/@electric-sql/pglite/dist/index.js');
const db=new PGlite();
try {
 await db.exec('create role anon; create role authenticated;');
 const sql=await fs.readFile(new URL('../supabase/migrations/20261103033616_next_campus_walk_paused.sql',import.meta.url),'utf8');
 await db.exec(sql.split('-- Private cleanup job')[0]);
 const scope='test-'+crypto.randomUUID();
 const pose={id:crypto.randomUUID(),token:crypto.randomUUID(),scope,seq:1,x:0,y:1,z:0,yaw:0,speed:3,active:true,emote:1,emoteSeq:1};
 async function call(p){await db.exec('set role anon');try{return (await db.query('select public.campus_walk_sync_emotes($1::jsonb) as s',[JSON.stringify(p)])).rows[0].s;}finally{await db.exec('reset role');}}
 await assert.rejects(()=>call(pose),/permission denied/);
 await db.exec('grant execute on function public.campus_walk_sync_emotes(jsonb) to anon');
 await assert.rejects(()=>call(pose),/paused/);
 await db.query("update campus_walk_live.access_control set test_scope=$1,test_expires_at=now()+interval '10 minutes'",[scope]);
 await assert.rejects(()=>call({...pose,scope:'public'}),/paused/);
 assert.equal((await call(pose)).count,1);
 const other={...pose,id:crypto.randomUUID(),token:crypto.randomUUID()};
 const s=await call(other);assert.equal(s.peers.length,1);assert.equal(s.peers[0].emote,1);
 await assert.rejects(()=>call({...pose,token:crypto.randomUUID(),seq:2}),/Invalid session/);
 await assert.rejects(()=>call({...pose,x:null}),/Invalid game state/);
 await assert.rejects(()=>call({...pose,scope:null}),/Invalid session/);
 await assert.rejects(()=>call({...pose,chat:'no'}),/Invalid game state/);
 await db.exec('set role anon');
 await assert.rejects(()=>db.query('select * from campus_walk_live.sessions'),/permission denied/);
 await db.exec('reset role');
 await call({...pose,active:false});
 assert.equal((await db.query('select count(*)::int as n from campus_walk_live.reactions')).rows[0].n,1);
 await db.exec("update campus_walk_live.access_control set test_expires_at=now()-interval '1 second'");
 await assert.rejects(()=>call(other),/paused/);
 console.log(JSON.stringify({migration:true,publicClosed:true,testScopeExpires:true,emotes:true,capabilityProtection:true,nullRejected:true,privateTables:true,cascadeCleanup:true,productionLoadTest:false}));
} finally {await db.close();}
