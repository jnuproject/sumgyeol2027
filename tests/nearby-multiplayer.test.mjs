import test from 'node:test';import assert from 'node:assert/strict';
import {createNearbyMultiplayer} from '../dist/nearby-multiplayer.js';
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const pose={x:1,y:2,z:3,yaw:0,speed:4,active:true};
const peer=(seq=1,x=2,sampledAt=1000)=>({id:other,seq,x,y:2,z:3,yaw:0,speed:4,active:true,sampledAt});
const snap=(peers=[])=>({count:2,peers,room:'campus',crowded:false,intervalMs:200});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(handler=()=>snap()){
 let t=0;const calls=[],status=[];const n=createNearbyMultiplayer({id,token:id,config:{url:'https://example.invalid/realtime/v1',key:'public',scope:'public'},now:()=>t,onStatus:s=>status.push(s),fetchFn:async(url,options)=>{calls.push({url,...options});return {ok:true,json:async()=>handler(calls.length,JSON.parse(options.body))};}});
 return {n,calls,status,advance:ms=>{t+=ms;},async tick(ms=0,p=pose){t+=ms;n.update(p);await flush();}};
}
test('one batched request per interval, bounded position-only body, peers sampled without text',async()=>{
 const f=setup(()=>snap([peer()]));await f.tick();assert.equal(f.n.metadata().connected,true);assert.equal(f.n.peers.size,1);assert.equal(f.calls.length,1);
 for(let i=0;i<19;i++)await f.tick(10);assert.equal(f.calls.length,1);await f.tick(10);assert.equal(f.calls.length,2);
 const p=JSON.parse(f.calls[0].body).p;assert.deepEqual(Object.keys(p).sort(),['active','id','scope','seq','speed','token','x','y','yaw','z']);assert.equal(f.n.metadata().count,2);f.n.dispose();
});
test('moving samples infer bounded velocity; stale order cannot replace a newer pose; departures clear peers',async()=>{
 let data=snap([peer()]);const f=setup(()=>data);await f.tick();data=snap([peer(2,2.8,1200)]);await f.tick(200);assert.ok(Math.abs(f.n.peers.get(other).velocity.x-4)<.001);
 data=snap([peer(1,99,1000)]);await f.tick(200);assert.equal(f.n.peers.get(other).x,2.8);data=snap();await f.tick(200);assert.equal(f.n.peers.size,0);f.n.dispose();
});
test('malformed server text, unbounded neighbours or coordinates trigger backoff',async()=>{
 for(const data of [snap([{...peer(),chat:'hello'}]),snap(Array.from({length:200},()=>peer())),snap([{...peer(),x:Infinity}]),{...snap(),count:90000}]){const f=setup(()=>data);await f.tick();assert.equal(f.n.metadata().connected,false);assert.equal(f.n.peers.size,0);await f.tick(100);assert.equal(f.calls.length,1);f.n.dispose();}
});
test('crowding leaves game available and retries slowly, without falling back to global broadcasting',async()=>{
 const f=setup(()=>({count:200,peers:[],room:null,crowded:true}));await f.tick();assert.equal(f.n.metadata().crowded,true);for(let i=0;i<100;i++)await f.tick(100);assert.equal(f.calls.length,1);f.n.dispose();
});
test('leaving sends a capability-protected release; resuming exploration starts a new poll',async()=>{
 const f=setup();await f.tick();await f.tick(100,{...pose,active:false});assert.equal(JSON.parse(f.calls.at(-1).body).p.active,false);assert.equal(f.calls.at(-1).keepalive,true);await f.tick(100,pose);assert.equal(f.n.metadata().connected,true);f.n.dispose();
});
test('only one HTTP operation is in flight; late responses cannot revive a disconnected session',async()=>{
 let complete;let calls=0;const n=createNearbyMultiplayer({id,token:id,config:{url:'https://example.invalid/realtime/v1',key:'public'},fetchFn:()=>{calls++;return new Promise(resolve=>{complete=()=>resolve({ok:true,json:async()=>snap([peer()])});});}});
 for(let i=0;i<100;i++)n.update(pose);await flush();assert.equal(calls,1);const first=complete;n.disconnect();first();await flush();assert.equal(n.metadata().connected,false);assert.equal(n.peers.size,0);n.dispose();
});

test('a shared campus snapshot accepts all 99 nearby participants without a room or display-count cutoff',async()=>{
 const people=Array.from({length:99},(_,i)=>({...peer(),id:(i+100).toString(16).padStart(8,'0')+'-0000-4000-8000-000000000000'}));const f=setup(()=>({...snap(people),count:100}));await f.tick();assert.equal(f.n.peers.size,99);assert.equal(f.n.metadata().room,'campus');assert.equal(f.n.metadata().sharedCampus,true);f.n.dispose();
});
