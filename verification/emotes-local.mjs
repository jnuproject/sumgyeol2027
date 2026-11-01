// Isolated PostgreSQL validation; no production connection.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.PGLITE_MODULE??'/tmp/campus-capacity-pg/node_modules/@electric-sql/pglite/dist/index.js');
const db=new PGlite();
try{
 await db.exec('create role anon; create role authenticated;');
 await db.exec((await fs.readFile('source-data/multiplayer/migrations/campus_walk_nearby.sql','utf8')).split('-- Expire even the last session')[0]);
 await db.exec(await fs.readFile('source-data/multiplayer/migrations/campus_walk_emotes.sql','utf8'));
 const scope='test-'+crypto.randomUUID(),pose=()=>({id:crypto.randomUUID(),token:crypto.randomUUID(),scope,seq:1,x:1,y:2,z:3,yaw:0,speed:0,active:true,emote:0,emoteSeq:0});
 const a=pose(),b=pose();
 async function call(p,legacy=false){await db.exec('set role anon');try{return(await db.query(`select public.${legacy?'campus_walk_sync':'campus_walk_sync_emotes'}($1::jsonb) as snapshot`,[JSON.stringify(p)])).rows[0].snapshot;}finally{await db.exec('reset role');}}
 await call(a);await call(b);a.emote=1;a.emoteSeq=1;await call(a);let seen=(await call(b)).peers[0];assert.equal(seen.emote,1);assert.equal(seen.emoteSeq,1);
 const start=(await db.query('select started_at from campus_walk_live.reactions where id=$1',[a.id])).rows[0].started_at;
 await call(a);assert.deepEqual((await db.query('select started_at from campus_walk_live.reactions where id=$1',[a.id])).rows[0].started_at,start);
 await call({...a,emote:3,emoteSeq:2});assert.equal((await call(b)).peers[0].emote,1);
 await call({...a,emote:0,emoteSeq:3});assert.equal((await call(b)).peers[0].emote,0);
 await call({...a,emote:2,emoteSeq:4});assert.equal((await call(b)).peers[0].emote,0);
 await db.exec("update campus_walk_live.reactions set started_at=clock_timestamp()-interval '4 seconds'");
 await call({...a,emote:4,emoteSeq:4});assert.equal((await call(b)).peers[0].emote,4);
 await db.exec("update campus_walk_live.reactions set started_at=clock_timestamp()-interval '4 seconds'");assert.equal((await call(b)).peers[0].emote,0);
 for(const patch of [{emote:5},{emote:'hello'},{emote:null},{emoteSeq:1.2},{emoteSeq:null},{chat:'hello'}])await assert.rejects(()=>call({...a,...patch}));
 await assert.rejects(()=>call({...a,token:crypto.randomUUID()}),/Invalid session/);
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from campus_walk_live.reactions'),/permission denied/);await db.exec('reset role');
 const {emote,emoteSeq,...old}=b;assert.equal((await call(old,true)).peers[0].emote,undefined);
 await call({...a,active:false});assert.equal((await db.query('select count(*)::int as n from campus_walk_live.reactions where id=$1',[a.id])).rows[0].n,0);
 console.log('PASS: two-way fixed reactions; 3s expiry/cooldown; no replay; cancellation; capability; no text; private table; legacy compatibility; cascade cleanup');
}finally{await db.close();}
