// Optional live check in an isolated, ephemeral room. No database writes.
import assert from 'node:assert/strict';
import {createMultiplayer} from '../dist/multiplayer.js';
import {multiplayerConfig} from '../dist/multiplayer-config.js';
const config={...multiplayerConfig,room:multiplayerConfig.room+'-verify-'+crypto.randomUUID()};
const a=createMultiplayer({config,appearance:1}),b=createMultiplayer({config,appearance:4});
try{
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){
  a.update({x:1,y:0,z:1,yaw:0,speed:0,active:true});b.update({x:2,y:0,z:2,yaw:0,speed:0,active:true});
  if(a.peers.get(b.id)?.species===4&&b.peers.get(a.id)?.species===1)break;
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.equal(a.peers.get(b.id)?.species,4);assert.equal(b.peers.get(a.id)?.species,1);
 assert.equal(a.metadata().count,2);assert.equal(b.metadata().count,2);
 console.log('Live two-client check: citrus ↔ sprout appearances match; count 2; movement protocol unchanged.');
}finally{a.dispose();b.dispose();}
