// Bounded production smoke check, NOT a capacity/load guarantee. Only our test scope.
import assert from 'node:assert/strict';
import {multiplayerConfig as config} from '../dist/multiplayer-config.js';
const endpoint=config.url.replace(/\/realtime\/v1\/?$/,'/rest/v1/rpc/campus_walk_sync');
const scope='test-'+crypto.randomUUID(),users=Array.from({length:20},(_,i)=>({id:crypto.randomUUID(),token:crypto.randomUUID(),scope,seq:0,x:-85+i*.4,y:1,z:-450,yaw:0,speed:1,active:true})),rtts=[];
async function call(p){const t=performance.now(),r=await fetch(endpoint,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p}),signal:AbortSignal.timeout(6000)});const body=await r.json();assert(r.ok,`HTTP ${r.status}: ${JSON.stringify(body)}`);rtts.push(performance.now()-t);return body;}
try{
 let latest;
 for(let round=0;round<15;round++){
  latest=await Promise.all(users.map(p=>{p.seq++;p.x+=.15;return call({...p});}));
  assert(latest.every(s=>s.room==='campus'&&!s.crowded));
  if(round>0)assert(latest.every(s=>s.count===20&&s.peers.length===19));
  await new Promise(r=>setTimeout(r,300));
 }
 const sorted=rtts.slice().sort((a,b)=>a-b);
 console.log(JSON.stringify({productionSmokeTest:true,simultaneousClients:20,peersPerClient:19,requests:rtts.length,medianMs:Math.round(sorted[Math.floor(sorted.length*.5)]),p95Ms:Math.round(sorted[Math.floor(sorted.length*.95)]),realPhoneTest:false,capacityGuarantee:false}));
}finally{await Promise.allSettled(users.map(p=>call({...p,seq:p.seq+1,active:false})));}
