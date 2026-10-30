import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {createWindMascotFactory} from '../dist/wind-mascot.js';

test('wind mascot is finite lightweight geometry at human-compatible world scale',()=>{
 const factory=createWindMascotFactory(),a=factory.create(new THREE.Scene());a.update(0,{reducedMotion:true});
 const bounds=new THREE.Box3().setFromObject(a.body),size=bounds.getSize(new THREE.Vector3());
 assert.ok(size.y>1.7&&size.y<1.85);assert.ok(bounds.min.y>=0);assert.ok(size.x<1.25);
 let meshes=0,triangles=0;a.body.traverse(o=>{if(o.isMesh&&o.visible){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
 assert.ok(meshes<=9);assert.ok(triangles<12000);
 const face=a.facePosition();assert.ok(face[1]>1&&face[1]<1.3);assert.ok(face[2]>.3);
});
test('walk, run and jump never move the collision root or sink feet through flat ground',()=>{
 const a=createWindMascotFactory().create(new THREE.Scene());a.player.position.set(3,8,-4);
 for(const speed of [0,3,9,20])for(const reducedMotion of [false,true])for(let frame=0;frame<180;frame++){
  a.update(1/60,{speed,grounded:true,reducedMotion});
  assert.deepEqual(a.player.position.toArray(),[3,8,-4]);
  a.player.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(a.body).min.y>=7.99);
 }
 a.update(.1,{speed:20,grounded:false});assert.equal(a.metadata.animation,'jump');
 a.update(.1,{speed:3,grounded:true});assert.equal(a.metadata.animation,'walk');
 a.update(.1,{speed:16,grounded:true});assert.equal(a.metadata.animation,'run');
});
test('companions share resources but blinking, walking and expressions are independent',()=>{
 const factory=createWindMascotFactory(),scene=new THREE.Scene(),a=factory.create(scene),b=factory.create(scene);
 assert.equal(a.body.children[0].children[0].geometry,b.body.children[0].children[0].geometry);
 a.setTalking(true);a.setGreeting(true);a.update(.08);b.setWalking(true);b.update(.08);
 assert.equal(a.metadata.animation,'wave');assert.equal(a.metadata.expression,'talk');assert.equal(b.metadata.animation,'walk');assert.equal(b.metadata.expression,'smile');
 assert.notEqual(a.body.getObjectByName('Talking mouth').scale.y,b.body.getObjectByName('Talking mouth').scale.y);
 a.body.rotation.y=Math.PI/2;a.player.position.set(5,3,9);const face=a.facePosition();assert.ok(face[0]>5.3);assert.ok(face[1]>4);assert.ok(Math.abs(face[2]-9)<.01);
});
test('reduced motion holds idle pose and malformed frame times stay finite',()=>{
 const a=createWindMascotFactory().create(new THREE.Scene());a.setGreeting(true);a.setTalking(true);a.update(0,{reducedMotion:true});a.player.updateMatrixWorld(true);
 const matrices=[];a.body.traverse(o=>matrices.push(o.matrixWorld.elements.slice()));
 for(const dt of [1/60,1,-2,NaN,Infinity])a.update(dt,{reducedMotion:true});a.player.updateMatrixWorld(true);
 let i=0;a.body.traverse(o=>assert.deepEqual(o.matrixWorld.elements,matrices[i++]));
});
