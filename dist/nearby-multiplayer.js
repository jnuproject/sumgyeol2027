import {validEmote,EMOTE_MS} from './emotes.js?v=emote-r59';
import {multiplayerConfig} from './multiplayer-config.js?v=capacity-r56';
export function validPose(p){
 if(!p||Object.keys(p).sort().join(',')!=='active,id,seq,speed,x,y,yaw,z')return false;
 return typeof p.id==='string'&&/^[a-f0-9-]{36}$/.test(p.id)&&Number.isSafeInteger(p.seq)&&p.seq>=0&&typeof p.active==='boolean'&&['x','y','z','yaw','speed'].every(k=>Number.isFinite(p[k]))&&Math.abs(p.x)<3000&&Math.abs(p.z)<3000&&Math.abs(p.y)<1000&&Math.abs(p.yaw)<100&&p.speed>=0&&p.speed<=30;
}
function snapshotValid(s){return s&&Number.isInteger(s.count)&&s.count>=0&&s.count<=200&&typeof s.crowded==='boolean'&&(s.room===null||typeof s.room==='string'&&s.room==='campus')&&Array.isArray(s.peers)&&s.peers.length<=199&&s.peers.every(p=>{const {sampledAt,emote,emoteAge,emoteSeq,...pose}=p;return (emote===undefined||(validEmote(emote)&&Number.isFinite(emoteAge)&&emoteAge>=0&&emoteAge<=EMOTE_MS&&Number.isSafeInteger(emoteSeq)&&emoteSeq>=0))&&validPose(pose)&&Number.isFinite(sampledAt)&&sampledAt>0&&sampledAt<1e14;});}
export function createNearbyMultiplayer({config=multiplayerConfig,id=crypto.randomUUID(),token=crypto.randomUUID(),fetchFn=fetch,now=()=>performance.now(),onStatus=()=>{}}={}){
 const peers=new Map(),endpoint=config.url.replace(/\/realtime\/v1\/?$/,'')+'/rest/v1/rpc/campus_walk_sync_emotes';
 let reaction={emote:0,emoteSeq:0};
 let disposed=false,paused=false,pending=false,connected=false,count=null,room=null,latest=null,seq=0,nextAt=0,generation=0,failures=0,controller=null,lastStatus='',rttMs=0,crowded=false,requests=0;
 function report(state){connected=state==='connected';const signature=state+':'+count+':'+room;if(signature!==lastStatus){lastStatus=signature;onStatus({state,count,room});}}
 function body(active){return {p:{...latest,...reaction,id,token,scope:config.scope??'public',seq:++seq,active}};}
 const headers={'Content-Type':'application/json',apikey:config.key};
 function start(){
  if(pending||disposed||paused||!latest?.active||now()<nextAt)return;
  pending=true;const epoch=generation,started=now(),request=body(true);const requestController=new AbortController();controller=requestController;const timer=setTimeout(()=>requestController.abort(),4000);requests++;
  Promise.resolve().then(()=>fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(request),signal:requestController.signal})).then(async response=>{if(!response.ok)throw Error('Sync '+response.status);const data=await response.json();if(!snapshotValid(data))throw Error('Invalid game snapshot');return data;}).then(data=>{
   if(epoch!==generation||disposed)return;failures=0;rttMs=Math.max(0,now()-started);count=data.count;room=data.room;crowded=data.crowded;
   if(crowded){peers.clear();report('crowded');nextAt=now()+15000;return;}
   const present=new Set();
   for(const p of data.peers){if(p.id===id)continue;present.add(p.id);const old=peers.get(p.id);if(old&&p.seq<=old.seq)continue;
    const seconds=old?(p.sampledAt-old.sampledAt)/1000:0;let velocity=null;
    if(old&&seconds>=.08&&seconds<2&&p.speed>.15){const vx=(p.x-old.x)/seconds,vz=(p.z-old.z)/seconds;if(Math.hypot(vx,vz)<=30)velocity={x:vx,y:Math.max(-10,Math.min(10,(p.y-old.y)/seconds)),z:vz};}
    peers.set(p.id,{...p,species:0,velocity,transitMs:Math.min(120,rttMs/2),receivedAt:now()});
   }
   for(const key of peers.keys())if(!present.has(key))peers.delete(key);
   report('connected');nextAt=Math.max(started+Math.max(200,Math.min(1000,data.intervalMs??200)),now()+25);
  }).catch(()=>{if(epoch!==generation||disposed)return;failures++;count=null;room=null;peers.clear();report('offline');nextAt=now()+Math.min(15000,500*2**Math.min(failures,5))*(.85+Math.random()*.3);}).finally(()=>{clearTimeout(timer);if(epoch===generation){pending=false;controller=null;}});
 }
 function disconnect(){paused=true;generation++;pending=false;controller?.abort();controller=null;peers.clear();connected=false;count=null;room=null;report('offline');
  if(latest){const data=body(false);try{Promise.resolve(fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(data),keepalive:true})).catch(()=>{});}catch{}}
 }
 report('connecting');
 return {id,peers,update(p){if(disposed)return;if(validEmote(p.emote)&&Number.isSafeInteger(p.emoteSeq)&&p.emoteSeq>=0)reaction={emote:p.emote,emoteSeq:p.emoteSeq};const candidate={id,seq:0,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),yaw:+p.yaw.toFixed(3),speed:Math.min(30,Math.max(0,p.speed)),active:!!p.active};if(!validPose(candidate))return;const wasActive=latest?.active;const {id:unused,seq:ignored,...pose}=candidate;latest=pose;if(wasActive&&!pose.active)disconnect();if(pose.active&&!wasActive){paused=false;nextAt=0;}if(pose.active&&!paused)start();},disconnect,reconnect(){if(disposed)return;paused=false;nextAt=0;start();},dispose(){if(disposed)return;disconnect();disposed=true;},metadata:()=>({transport:'nearby-snapshot',connected,count,room,peers:peers.size,crowded,rttMs:Math.round(rttMs),requests,sharedCampus:true,admissionLimit:200})};
}
