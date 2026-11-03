// Explicitly authorized, bounded live test on NEXT. Never auto-enables access.
// Test scope comes from a private local file and expires server-side.
import fs from 'node:fs/promises';
import {multiplayerConfig as config} from '../dist/multiplayer-config.js';
const {scope}=JSON.parse(await fs.readFile('/tmp/jeju-next-loadtest-private.json','utf8'));
if(!/^test-[a-f0-9-]{36}$/.test(scope)||!config.url.startsWith('https://sqqyvdpsalclqczqsyrk.supabase.co/'))throw Error('Wrong target');
const endpoint=config.url.replace('/realtime/v1','/rest/v1/rpc/campus_walk_sync_emotes');
const headers={apikey:config.key,'Content-Type':'application/json'};
const result={startedAt:new Date().toISOString(),project:'sqqyvdpsalclqczqsyrk',scenario:'all participants within 150m, moving with reactions',limits:{maxParticipants:200,maxSeconds:360,maxDecodedBytes:100*1024*1024,phaseSeconds:30},phases:[],realPhoneTest:false,appWorkflowsTested:false};
const quantile=(a,q)=>a.length?[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*q))]:null;
const round=x=>x===null?null:Math.round(x);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let stop=null,totalBytes=0,totalRequests=0,consecutiveErrors=0,stageErrors=0;
const began=performance.now();
process.on('SIGINT',()=>{stop='operator_stop';});process.on('SIGTERM',()=>{stop='operator_stop';});
const users=[];
function pose(i){return {id:crypto.randomUUID(),token:crypto.randomUUID(),scope,seq:0,x:-85+i*.1,y:1,z:-450,yaw:0,speed:3,active:true,emote:0,emoteSeq:0};}
async function call(p,track=true){
 const t=performance.now();totalRequests++;
 const r=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({p}),signal:AbortSignal.timeout(2500)});
 const text=await r.text();totalBytes+=Buffer.byteLength(text);
 if(!r.ok)throw Error('HTTP '+r.status);
 const body=JSON.parse(text),ms=performance.now()-t;
 if(track&&(body.crowded||body.room!=='campus'||!Array.isArray(body.peers)))throw Error('Invalid or crowded snapshot');
 return {body,ms};
}
const sentinel={...pose(999),active:false};
const baseline=[];
async function probe(){sentinel.seq++;return (await call({...sentinel},false)).ms;}
try {
 // Public scope must remain blocked even while test scope is temporarily enabled.
 const r=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({p:{...pose(0),scope:'public'}}),signal:AbortSignal.timeout(2500)});
 const denial=await r.json();
 result.publicScopeBlocked=[401,403].includes(r.status)&&denial.code==='42501'&&denial.message==='Campus walk is paused';
 if(!result.publicScopeBlocked)throw Error('Public scope was not blocked');
 for(let i=0;i<12;i++){baseline.push(await probe());await sleep(200);}
 result.baseline={p50Ms:round(quantile(baseline,.5)),p95Ms:round(quantile(baseline,.95))};
 const probeLimit=Math.max(500,quantile(baseline,.95)*3);
 result.limits.probeStopMs=round(probeLimit);
 console.log(JSON.stringify({event:'baseline',...result.baseline,publicScopeBlocked:true}));
 for(const count of [5,20,50,100,150,200]) {
  if(stop)break;
  while(users.length<count)users.push(pose(users.length));
  // Smooth admission instead of an artificial synchronized connection burst.
  for(const user of users){user.seq++;await call({...user});await sleep(10);}
  const started=performance.now(),end=started+result.limits.phaseSeconds*1000;
  const rtts=[],probes=[],steady=[],peers=[],counts=[];let phaseBytes=totalBytes,phaseRequests=totalRequests,slowProbes=0;stageErrors=0;
  console.log(JSON.stringify({event:'phase-start',participants:count}));
  const workers=users.map(async(user,i)=>{
   await sleep((i*37)%200);
   while(!stop&&performance.now()<end){
    const t=performance.now();user.seq++;user.x=-85+i*.1+Math.sin(t/1000)*2;user.z=-450+Math.cos(t/1000)*2;user.yaw=(t/1000)%6.28;
    if(user.seq%25===0){user.emoteSeq++;user.emote=(user.emote+1)%5;}
    let interval=200;
    try{const {body,ms}=await call({...user});rtts.push(ms);consecutiveErrors=0;interval=body.intervalMs;
     if(t-started>5000){steady.push(ms);peers.push(body.peers.length);counts.push(body.count);}
    }catch{stageErrors++;consecutiveErrors++;if(consecutiveErrors>=3||stageErrors>=3)stop='request_errors';}
    if(totalBytes>result.limits.maxDecodedBytes)stop='transfer_budget';
    if(performance.now()-began>result.limits.maxSeconds*1000)stop='time_budget';
    await sleep(Math.max(25,interval-(performance.now()-t)));
   }
  });
  const monitoring=(async()=>{while(!stop&&performance.now()<end){
   try{const ms=await probe();probes.push(ms);slowProbes=ms>probeLimit?slowProbes+1:0;if(slowProbes>=3)stop='database_probe_slow';}
   catch{stop='database_probe_failed';}
   await sleep(1000);
  }})();
  await Promise.all([...workers,monitoring]);
  const elapsed=(performance.now()-started)/1000;
  const phase={participants:count,elapsedSeconds:+elapsed.toFixed(1),successfulRequests:rtts.length,errors:stageErrors,p50Ms:round(quantile(steady,.5)),p95Ms:round(quantile(steady,.95)),p99Ms:round(quantile(steady,.99)),probeP95Ms:round(quantile(probes,.95)),requestsPerSecond:+((totalRequests-phaseRequests)/elapsed).toFixed(1),decodedMB:+((totalBytes-phaseBytes)/1e6).toFixed(2),minSteadyPeers:peers.length?Math.min(...peers):null,maxSteadyPeers:peers.length?Math.max(...peers):null,minSteadyCount:counts.length?Math.min(...counts):null,stopReason:stop};
  if(!stop&&phase.p95Ms>800)stop='phase_p95_over_800ms';
  if(!stop&&peers.some(n=>n!==count-1))stop='missing_nearby_peers';
  phase.stopReason=stop;result.phases.push(phase);
  await fs.writeFile(new URL('./next-loadtest-result.json',import.meta.url),JSON.stringify(result,null,2));
  console.log(JSON.stringify({event:'phase-result',...phase}));
  await sleep(2000);
 }
}catch(error){stop='test_error: '+error.message;}
finally{
 // Sequential, bounded cleanup; only UUID-capability-protected test participants.
 let cleaned=0;for(const user of users){try{await call({...user,seq:++user.seq,active:false},false);cleaned++;}catch{}}
 result.cleanedParticipants=cleaned;result.stopReason=stop;result.totalRequests=totalRequests;result.totalDecodedMB=+(totalBytes/1e6).toFixed(2);result.finishedAt=new Date().toISOString();
 await fs.writeFile(new URL('./next-loadtest-result.json',import.meta.url),JSON.stringify(result,null,2));
 console.log(JSON.stringify({event:'finished',stopReason:stop,cleanedParticipants:cleaned,totalDecodedMB:result.totalDecodedMB}));
}
