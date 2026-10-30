import {RealtimeClient} from './vendor/realtime.js';
import {multiplayerConfig} from './multiplayer-config.js';
export function validPose(p){
 if(!p||Object.keys(p).sort().join(',')!=='active,id,seq,speed,x,y,yaw,z')return false;
 return typeof p.id==='string'&&/^[a-f0-9-]{36}$/.test(p.id)&&Number.isSafeInteger(p.seq)&&p.seq>=0&&typeof p.active==='boolean'&&['x','y','z','yaw','speed'].every(k=>Number.isFinite(p[k]))&&Math.abs(p.x)<3000&&Math.abs(p.z)<3000&&Math.abs(p.y)<1000&&Math.abs(p.yaw)<100&&p.speed>=0&&p.speed<=30;
}
export function createMultiplayer({config=multiplayerConfig,Client=RealtimeClient,id=crypto.randomUUID(),now=()=>performance.now(),onStatus=()=>{},appearance=0}={}){
 const client=new Client(config.url,{params:{apikey:config.key},timeout:10000,heartbeatIntervalMs:20000}),peers=new Map(),appearances=new Map();
 const species=Number.isInteger(appearance)&&appearance>=0&&appearance<5?appearance:0;
 let channel=null,members=new Set(),connected=false,disposed=false,latest=null,seq=0,lastSent=-Infinity,lastSignature='',requestAt=-Infinity;
 function status(state){connected=state==='connected';if(!connected){members.clear();peers.clear();appearances.clear();}onStatus({state,count:connected?members.size:null});}
 function send(force=false){if(!connected||!latest)return;const t=now(),signature=JSON.stringify(latest);if(t-lastSent<200||(!force&&signature===lastSignature&&t-lastSent<2000))return;lastSent=t;lastSignature=signature;channel.send({type:'broadcast',event:'pose',payload:{...latest,id,seq:++seq}}).catch(()=>{});}
 function sync(){
  members=new Set(Object.entries(channel.presenceState()).filter(([key,values])=>/^[a-f0-9-]{36}$/.test(key)&&values.some(v=>v.protocol===1)).map(([key])=>key));
  appearances.clear();for(const [key,values]of Object.entries(channel.presenceState())){const entry=values.find(v=>v.protocol===1&&Number.isInteger(v.species)&&v.species>=0&&v.species<5);appearances.set(key,entry?.species??0);if(peers.has(key))peers.get(key).species=entry?.species??0;}
  for(const key of peers.keys())if(!members.has(key))peers.delete(key);
  onStatus({state:connected?'connected':'connecting',count:connected?members.size:null});
  if(connected&&now()-requestAt>1000){requestAt=now();channel.send({type:'broadcast',event:'snapshot',payload:{}}).catch(()=>{});}
 }
 function connect(){if(disposed||channel)return;status('connecting');
  channel=client.channel(config.room,{config:{broadcast:{self:false,ack:false},presence:{key:id}}});
  const current=channel;
  channel.on('presence',{event:'sync'},sync).on('broadcast',{event:'snapshot'},()=>send(true)).on('broadcast',{event:'pose'},({payload:p})=>{
   if(!validPose(p)||p.id===id||!members.has(p.id))return;const old=peers.get(p.id);if(old&&p.seq<=old.seq)return;peers.set(p.id,{...p,species:appearances.get(p.id)??0,receivedAt:now()});
  }).subscribe(async state=>{if(disposed||channel!==current)return;if(state==='SUBSCRIBED'){status('connected');try{await current.track({protocol:1,species});if(channel===current)send(true);}catch{if(channel===current)status('offline');}}else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(state))status('offline');});
 }
 function disconnect(){const old=channel;channel=null;status('offline');if(old)client.removeChannel(old).catch(()=>{});}
 connect();
 return {id,peers,update(p){latest={x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),yaw:+p.yaw.toFixed(3),speed:Math.min(30,Math.max(0,p.speed)),active:!!p.active};send();for(const [key,p]of peers)if(now()-p.receivedAt>15000)peers.delete(key);},disconnect,reconnect(){if(!disposed)connect();},dispose(){disposed=true;disconnect();client.disconnect();},metadata:()=>({connected,count:connected?members.size:null,peers:peers.size})};
}
