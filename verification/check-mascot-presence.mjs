// Optional live check in an isolated test scope. Creates and releases two temporary game sessions.
import assert from 'node:assert/strict';
import {createMultiplayer} from '../dist/multiplayer.js';
import {multiplayerConfig} from '../dist/multiplayer-config.js';
const config={...multiplayerConfig,scope:'test-'+crypto.randomUUID(),transport:'nearby'};
const a=createMultiplayer({config,appearance:0}),b=createMultiplayer({config,appearance:0});
try{
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){
  a.update({x:1,y:0,z:1,yaw:0,speed:0,active:true});b.update({x:2,y:0,z:2,yaw:0,speed:0,active:true});
  if(a.peers.get(b.id)?.species===0&&b.peers.get(a.id)?.species===0)break;
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.equal(a.peers.get(b.id)?.species,0);assert.equal(b.peers.get(a.id)?.species,0);
 assert.equal(a.metadata().count,2);assert.equal(b.metadata().count,2);
 console.log('Live two-client check: Nearby snapshot check: two wind players see each other; count 2.');
}finally{a.dispose();b.dispose();}
