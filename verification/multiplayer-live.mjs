import assert from 'node:assert/strict';
import {createMultiplayer} from '../dist/multiplayer.js';
import {multiplayerConfig} from '../dist/multiplayer-config.js';
const config={...multiplayerConfig,room:'sumgyeol-verification-'+crypto.randomUUID()},a=createMultiplayer({config}),b=createMultiplayer({config});
const pose=x=>({x,y:2,z:4,yaw:1,speed:3,active:true});
const wait=async predicate=>{for(let i=0;i<150;i++){if(predicate())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out '+JSON.stringify({a:a.metadata(),b:b.metadata()}));};
const timer=setInterval(()=>{a.update(pose(1));b.update(pose(9));},210);
try{await wait(()=>a.metadata().count===2&&b.metadata().count===2);await wait(()=>a.peers.has(b.id)&&b.peers.has(a.id));assert.equal(a.peers.get(b.id).x,9);assert.equal(b.peers.get(a.id).x,1);b.disconnect();await wait(()=>a.metadata().count===1);b.reconnect();await wait(()=>a.metadata().count===2&&b.metadata().count===2);await wait(()=>a.peers.has(b.id));console.log('PASS real server: two clients, bidirectional position, 2→1→2 presence and reconnect.');}finally{clearInterval(timer);a.dispose();b.dispose();}
