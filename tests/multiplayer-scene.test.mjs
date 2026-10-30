import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from '../dist/three.module.js';import {createMultiplayerScene} from '../dist/multiplayer-scene.js';
test('remote people are pooled, interpolated, labelled, culled, and removed on departure',()=>{
 const previous={document:globalThis.document,addEventListener:globalThis.addEventListener,removeEventListener:globalThis.removeEventListener};
 const context={beginPath(){},roundRect(){},fill(){},fillText(){}};const elements=[];
 globalThis.document={hidden:false,body:{append(e){elements.push(e);}},createElement(tag){return {dataset:{},setAttribute(){},remove(){},getContext:()=>context};}};globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
 const scene=new THREE.Scene(),player={position:new THREE.Vector3()},camera={position:new THREE.Vector3()},peers=new Map();let created=0;
 const avatar={body:new THREE.Group(),createCompanion(scene){created++;const group=new THREE.Group(),body=new THREE.Group();group.add(body);scene.add(group);return {group,body,update(){},setWalking(v){this.walking=v;}};}};
 const net={peers,update(){},disconnect(){},reconnect(){},dispose(){},metadata:()=>({connected:true,count:2})};
 try{const system=createMultiplayerScene({scene,avatar,player,camera,mobile:true,networkFactory:({onStatus})=>{onStatus({state:'connected',count:2});return net;}});
 peers.set('one',{id:'one',x:3,y:2,z:1,yaw:0,speed:2,active:true,receivedAt:performance.now()});system.update(.1,{mode:'walk'});assert.equal(created,1);assert.equal(system.metadata().rendered,1);assert.equal(scene.children[0].position.x,3);assert.equal(elements[0].textContent,'접속 2명');
 peers.get('one').x=5;system.update(.05,{mode:'walk'});assert(scene.children[0].position.x>3&&scene.children[0].position.x<5);
 peers.clear();system.update(.1,{mode:'walk'});assert.equal(scene.children[0].visible,false);assert.equal(system.metadata().rendered,0);
 peers.set('two',{id:'two',x:4,y:1,z:1,yaw:0,speed:0,active:true,receivedAt:performance.now()});system.update(.1,{mode:'walk'});assert.equal(created,1);
 peers.get('two').x=500;system.update(.1,{mode:'walk'});assert.equal(system.metadata().rendered,0);system.dispose();assert.equal(scene.children.length,0);
 }finally{Object.assign(globalThis,previous);}
});
