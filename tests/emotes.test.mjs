import test from 'node:test';import assert from 'node:assert/strict';
import {createEmoteState,remoteEmote,EMOTES} from '../dist/emotes.js';
import {createWindMascotFactory} from '../dist/wind-mascot.js';import * as THREE from '../dist/three.module.js';
test('fixed reactions expire, cancellation does not bypass cooldown, sequence never repeats',()=>{
 let now=0;const e=createEmoteState(()=>now);assert.equal(e.play('hello'),false);assert.equal(e.play(5),false);assert.equal(e.play(1),true);assert.equal(e.sample().seq,1);
 now=200;e.cancel();assert.equal(e.sample().id,0);assert.equal(e.play(2),false);now=3000;assert.equal(e.play(2),true);assert.equal(e.sample().seq,3);now=6000;assert.equal(e.sample().id,0);assert.equal(e.sample().seq,4);
});
test('remote reactions use server age and transit, and cannot replay stale snapshots forever',()=>{
 const p={emote:3,emoteAge:2200,receivedAt:1000,transitMs:100};assert.equal(remoteEmote(p,1200).id,3);assert.equal(remoteEmote(p,1800).id,0);assert.equal(remoteEmote({...p,emote:99},1000).id,0);
});
test('all four motions remain in place, reset cleanly, respect reduced motion and movement',()=>{
 const a=createWindMascotFactory().create(new THREE.Scene());a.player.position.set(7,12,-3);
 for(const e of EMOTES){for(let i=0;i<180;i++){a.setEmote(e.id,i*1000/60);a.update(1/60);assert.equal(a.metadata.animation,e.motion);assert.deepEqual(a.player.position.toArray(),[7,12,-3]);a.player.updateMatrixWorld(true);a.body.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}
 a.setEmote(e.id,1000);a.update(0,{reducedMotion:true});a.player.updateMatrixWorld(true);const before=a.body.children[0].matrixWorld.elements.slice();a.setEmote(e.id,1400);a.update(.1,{reducedMotion:true});a.player.updateMatrixWorld(true);assert.deepEqual(a.body.children[0].matrixWorld.elements,before);
 a.update(.1,{speed:9});assert.equal(a.metadata.animation,'walk');a.setEmote(0);a.update(.1);assert.equal(a.metadata.animation,'idle');assert.equal(a.body.children[0].rotation.x,0);
 }
});
