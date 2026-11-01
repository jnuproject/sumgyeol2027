import assert from 'node:assert/strict';import {multiplayerConfig as config} from '../dist/multiplayer-config.js';
const endpoint=config.url.replace(/\/realtime\/v1\/?$/,'')+'/rest/v1/rpc/';
const scope='test-'+crypto.randomUUID(),a=pose(),b=pose();
function pose(){return {id:crypto.randomUUID(),token:crypto.randomUUID(),scope,seq:1,x:-85,y:2,z:-450,yaw:0,speed:0,active:true,emote:0,emoteSeq:0};}
async function call(p,legacy=false){const response=await fetch(endpoint+(legacy?'campus_walk_sync':'campus_walk_sync_emotes'),{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p})});if(!response.ok)throw Error('RPC status '+response.status);return response.json();}
try{
 await call(a);await call(b);a.emote=1;a.emoteSeq=1;a.seq++;await call(a);let seen=(await call(b)).peers.find(p=>p.id===a.id);assert.equal(seen.emote,1);
 await new Promise(r=>setTimeout(r,200));const again=(await call(b)).peers.find(p=>p.id===a.id);assert.ok(again.emoteAge>seen.emoteAge);
 b.emote=2;b.emoteSeq=1;b.seq++;await call(b);assert.equal((await call(a)).peers.find(p=>p.id===b.id).emote,2);
 await assert.rejects(()=>call({...a,emote:'hello'}));await assert.rejects(()=>call({...a,token:crypto.randomUUID()}));
 const {emote,emoteSeq,...old}=b;assert.equal((await call(old,true)).peers.find(p=>p.id===a.id).emote,undefined);
 await new Promise(r=>setTimeout(r,3100));assert.equal((await call(b)).peers.find(p=>p.id===a.id).emote,0);
 console.log(JSON.stringify({twoLiveClients:true,bidirectional:true,serverAgeAdvances:true,expiresAfter3Seconds:true,invalidReactionRejected:true,wrongCapabilityRejected:true,legacyCompatible:true}));
}finally{await Promise.allSettled([call({...a,active:false}),call({...b,active:false})]);}
