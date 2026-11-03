import test from 'node:test';
import assert from 'node:assert/strict';
import {bindPresenceLifecycle} from '../dist/presence-lifecycle.js';
import {createNearbyMultiplayer} from '../dist/nearby-multiplayer.js';
function setup(callbacks={}){
 const doc=new EventTarget(),win=new EventTarget(),timers=new Map(),events=[];
 let time=0,serial=0,focused=true;doc.hidden=false;doc.hasFocus=()=>focused;win.navigator={onLine:true};
 const lifecycle=bindPresenceLifecycle({doc,win,onEnter:()=>{events.push('enter');callbacks.enter?.();},onLeave:()=>{events.push('leave');callbacks.leave?.();},setTimer:(fn,ms)=>{timers.set(++serial,{at:time+ms,fn});return serial;},clearTimer:id=>timers.delete(id)});
 return {doc,win,lifecycle,events,fire(target,type){if(type==='blur')focused=false;if(type==='focus')focused=true;target.dispatchEvent(new Event(type));},advance(ms){time+=ms;for(const [id,t]of timers)if(t.at<=time){timers.delete(id);t.fn();}},timers};
}
test('hidden tab leaves immediately; network restoration cannot reconnect it',()=>{
 const f=setup();assert.equal(f.lifecycle.active,true);f.doc.hidden=true;f.fire(f.doc,'visibilitychange');assert.equal(f.lifecycle.active,false);
 f.fire(f.win,'offline');f.fire(f.win,'online');f.fire(f.win,'pageshow');assert.deepEqual(f.events,['enter','leave']);
 f.doc.hidden=false;f.fire(f.doc,'visibilitychange');assert.deepEqual(f.events,['enter','leave','enter']);f.lifecycle.dispose();
});
test('other window leaves after five seconds, brief focus changes do not disconnect',()=>{
 const f=setup();f.fire(f.win,'blur');f.advance(4999);assert.equal(f.lifecycle.active,true);
 f.fire(f.win,'focus');f.advance(10000);assert.deepEqual(f.events,['enter']);
 f.fire(f.win,'blur');f.advance(5000);assert.equal(f.lifecycle.active,false);
 f.fire(f.win,'online');assert.deepEqual(f.events,['enter','leave']);
 f.fire(f.win,'focus');assert.equal(f.lifecycle.active,true);f.lifecycle.dispose();
});
test('page eviction and freezing disconnect, cleanup prevents late callbacks',()=>{
 const f=setup();f.fire(f.win,'pagehide');f.fire(f.win,'online');assert.equal(f.lifecycle.active,false);
 f.fire(f.win,'pageshow');assert.equal(f.lifecycle.active,true);
 f.fire(f.doc,'freeze');assert.equal(f.lifecycle.active,false);f.fire(f.doc,'resume');assert.equal(f.lifecycle.active,true);
 f.fire(f.win,'blur');f.lifecycle.dispose();const count=f.events.length;f.advance(10000);f.fire(f.win,'focus');assert.equal(f.events.length,count);assert.equal(f.timers.size,0);
});
test('background render updates send no position polls, then reconnect at the current position',async()=>{
 let t=0;const bodies=[];
 const net=createNearbyMultiplayer({config:{url:'https://example.invalid/realtime/v1',key:'test'},now:()=>t,fetchFn:async(url,options)=>{bodies.push(JSON.parse(options.body).p);return {ok:true,json:async()=>({count:1,peers:[],room:'campus',crowded:false,intervalMs:200})};}});
 const f=setup({enter:()=>net.reconnect(),leave:()=>net.disconnect()});
 const flush=()=>new Promise(r=>setImmediate(r));
 const tick=async(x=5)=>{t+=250;net.update({x,y:1,z:2,yaw:0,speed:0,active:f.lifecycle.active});await flush();};
 await tick();assert.equal(bodies.filter(p=>p.active).length,1);
 f.fire(f.win,'blur');f.advance(5000);await tick();const stopped=bodies.length;
 for(let i=0;i<20;i++)await tick();assert.equal(bodies.length,stopped);
 assert.equal(bodies.at(-1).active,false);
 f.fire(f.win,'focus');await tick(8);assert.equal(bodies.at(-1).active,true);assert.equal(bodies.at(-1).x,8);
 f.lifecycle.dispose();net.dispose();await flush();
});
