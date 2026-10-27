import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {addObservedEntrance,entranceLayout} from '../dist/entrance-observed.js';
import {walkable} from '../dist/navigation.js';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
function sceneFixture(){
 const scene=new THREE.Scene(),collisions=[],collisionMeshes=[],obstacles=[],terrain={heightAt:(x,z)=>x*.025+z*.045};
 function box(x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));m.position.set(x,y+terrain.heightAt(x,z),z);scene.add(m);return m;}
 const result=addObservedEntrance({scene,data,terrain,environment:{polygon(){},segment(){}},box,basalt:new THREE.MeshStandardMaterial(),collisions,collisionMeshes,obstacles});scene.updateMatrixWorld(true);
 return {scene,collisions,collisionMeshes,obstacles,terrain,result};
}
test('new entrance geometry is finite and canopy maintains walking headroom on a slope',()=>{
 const {scene,terrain}=sceneFixture();let roofCount=0;
 scene.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(const value of p.array)assert.ok(Number.isFinite(value));if(o.name.includes('paired curved')){roofCount++;for(let i=0;i<p.count;i++)assert.ok(p.getY(i)-terrain.heightAt(p.getX(i),p.getZ(i))>5.5);}});
 assert.equal(roofCount,2);
});
test('sidewalk spawn and continuous100m walk avoid new office, control hardware and posts',()=>{
 const {collisions,obstacles,result}=sceneFixture(),[x,z]=result.entrySpawn;
 for(let step=0;step<=100;step+=.25){const pz=z+step;assert.ok(walkable(x,pz,[...data.buildings,...collisions]));assert.ok(obstacles.every(p=>Math.hypot(x-p[0],pz-p[1])>=p[2]+.4));}
});
test('roadside office blocks walking through its wall while vehicle lanes remain open',()=>{
 const {collisions,obstacles}=sceneFixture(),layout=entranceLayout(data);
 assert.equal(walkable(layout.office.x,layout.office.z,collisions),false);
 for(const dx of[-6.5,-2.5,2.5,6.5]){
  const x=layout.x+dx,z=layout.z+18;
  assert.ok(walkable(x,z,collisions));assert.ok(obstacles.every(p=>Math.hypot(x-p[0],z-p[1])>=p[2]+.4));
 }
});
