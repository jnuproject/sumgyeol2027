import test from 'node:test';import assert from 'node:assert/strict';import {remoteTarget} from '../dist/remote-motion.js';
const p={x:0,y:1,z:0,speed:20,receivedAt:1000,velocity:{x:20,y:0,z:0},transitMs:50};
test('short prediction follows movement while remaining bounded over packet loss',()=>{assert.ok(remoteTarget(p,1050).x>0);assert.ok(remoteTarget(p,999999).x<=3);assert.equal(remoteTarget(p,999999).walking,false);assert.equal(remoteTarget({...p,speed:0},1200).x,0);});
test('predicted characters cannot enter a blocked surface or sink below terrain',()=>{assert.equal(remoteTarget(p,1100,{canStand:()=>false}).x,0);assert.equal(remoteTarget(p,1100,{heightAt:()=>4}).y,4);});
