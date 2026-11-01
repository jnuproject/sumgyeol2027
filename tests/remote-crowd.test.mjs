import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from '../dist/three.module.js';import {createRemoteCrowd} from '../dist/remote-crowd.js';
test('100 compact players stay individually positioned and visible in one lightweight instanced draw',()=>{
 const scene=new THREE.Scene(),crowd=createRemoteCrowd(scene),poses=Array.from({length:100},(_,i)=>({x:i,y:2,z:5,yaw:i*.01,walking:false}));crowd.update(poses,.016);const mesh=scene.children[0];assert.ok(mesh.isInstancedMesh);assert.equal(mesh.count,100);assert.equal(crowd.metadata().rendered,100);assert.ok(crowd.metadata().trianglesPerPlayer<1500);
 const matrix=new THREE.Matrix4();for(let i=0;i<100;i++){mesh.getMatrixAt(i,matrix);const p=new THREE.Vector3().setFromMatrixPosition(matrix);assert.ok(Math.abs(p.x-i)<.001);assert.equal(p.y,2);}
 for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));crowd.update([],0,false);assert.equal(crowd.metadata().rendered,0);crowd.dispose();assert.equal(scene.children.length,0);
});
