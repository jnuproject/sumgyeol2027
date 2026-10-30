import test from 'node:test';import assert from 'node:assert/strict';import {validPose,createMultiplayer} from '../dist/multiplayer.js';
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const pose={id:other,seq:1,x:1,y:2,z:3,yaw:0,speed:4,active:true};
test('network payload accepts only bounded numeric movement, never text/chat',()=>{assert(validPose(pose));for(const bad of [{...pose,chat:'hello'},{...pose,x:NaN},{...pose,speed:Infinity},{...pose,x:3001},{...pose,id:'<script>'},{...pose,seq:-1},null])assert.equal(validPose(bad),false);});
function fake(){const handlers={},sent=[],tracked=[];let subscription;const channel={state:{[id]:[{protocol:1}],[other]:[{protocol:1}]},on(type,{event},fn){handlers[type+event]=fn;return this;},subscribe(fn){subscription=fn;return this;},track:async p=>{tracked.push(p);},presenceState(){return this.state;},send:async p=>{sent.push(p);}};class Client{channel(){return channel;}removeChannel(){return Promise.resolve();}disconnect(){}}return {Client,channel,handlers,sent,tracked,subscribe:()=>subscription('SUBSCRIBED')};}
test('presence counts peers, rejects out-of-order and unknown senders, removes departed players',async()=>{const f=fake(),n=createMultiplayer({Client:f.Client,id});await f.subscribe();f.handlers.presencesync();assert.equal(n.metadata().count,2);f.handlers.broadcastpose({payload:pose});assert.equal(n.peers.get(other).x,1);f.handlers.broadcastpose({payload:{...pose,seq:0,x:9}});assert.equal(n.peers.get(other).x,1);delete f.channel.state[other];f.handlers.presencesync();assert.equal(n.peers.size,0);f.handlers.broadcastpose({payload:pose});assert.equal(n.peers.size,0);n.disconnect();assert.equal(n.metadata().count,null);n.dispose();});
test('movement sends are capped and idle snapshots remain infrequent',async()=>{const f=fake();let t=0;const n=createMultiplayer({Client:f.Client,id,now:()=>t});await f.subscribe();for(t=0;t<2000;t+=10)n.update({...pose,x:t/100});assert.equal(f.sent.filter(p=>p.event==='pose').length,10);n.dispose();});

test('species is bounded presence metadata; movement packets stay backwards compatible and text-free',async()=>{
 const f=fake(),n=createMultiplayer({Client:f.Client,id,appearance:3});await f.subscribe();assert.deepEqual(f.tracked[0],{protocol:1,species:3});
 f.channel.state[other]=[{protocol:1,species:1}];f.handlers.presencesync();f.handlers.broadcastpose({payload:pose});assert.equal(n.peers.get(other).species,1);
 f.channel.state[other]=[{protocol:1,species:99}];f.handlers.presencesync();assert.equal(n.peers.get(other).species,0);
 f.channel.state[other]=[{protocol:1,species:'hello'}];f.handlers.presencesync();assert.equal(n.peers.get(other).species,0);
 n.update(pose);assert.ok(validPose(f.sent.find(p=>p.event==='pose').payload));n.dispose();
 const invalid=fake(),bad=createMultiplayer({Client:invalid.Client,id,appearance:'chat'});await invalid.subscribe();assert.equal(invalid.tracked[0].species,0);bad.dispose();
});
