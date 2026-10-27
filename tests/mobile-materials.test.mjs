import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {loadCampusMaterials} from '../dist/materials.js';

test('phone startup loads four colour textures and keeps visible surfaces while omitting eight costly detail maps',async()=>{
 const original=THREE.TextureLoader.prototype.loadAsync,previous=globalThis.document,requests=[];
 const context=new Proxy({},{get:()=>()=>{}});
 globalThis.document={getElementById:()=>null,createElement:()=>({width:0,height:0,getContext:()=>context})};
 THREE.TextureLoader.prototype.loadAsync=async url=>{requests.push(url);return new THREE.Texture();};
 try{
  const phone=await loadCampusMaterials({mobile:true});assert.equal(requests.length,4);assert(requests.every(s=>s.endsWith('_diff_1k.jpg')));
  for(const name of ['grass','asphalt','stone','wall','paving','redPaving']){assert(phone[name].map?.isTexture);assert.equal(phone[name].normalMap,null);assert.equal(phone[name].roughnessMap,null);}
  requests.length=0;const desktop=await loadCampusMaterials();assert.equal(requests.length,12);assert(desktop.grass.normalMap?.isTexture);assert(desktop.grass.roughnessMap?.isTexture);
 }finally{THREE.TextureLoader.prototype.loadAsync=original;globalThis.document=previous;}
});

import fs from 'node:fs';
import {addVegetation} from '../dist/vegetation.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
test('phone tree geometry uses fewer trunk triangles without losing planted trees, leaves or collision positions',()=>{
 const previous=globalThis.document,context=new Proxy({},{get:()=>()=>{}});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 try{
  const data=prepareCampusRoads(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)))),a=new THREE.Scene(),b=new THREE.Scene(),visible=(_x,z)=>z>-230&&z<-180;
  const desktop=addVegetation(a,data,()=>0,visible),phone=addVegetation(b,data,()=>0,visible,{mobile:true});assert.ok(phone.treeCount>0);assert.equal(phone.treeCount,desktop.treeCount);assert.deepEqual(phone.obstacles,desktop.obstacles);
  const budget=scene=>{let trunks=0,leaves=0;scene.traverse(o=>{if(o.name.startsWith('campus-tree-trunks'))trunks+=o.geometry.index.count/3*o.count;if(o.name.startsWith('campus-tree-leaves'))leaves+=o.count;});return {trunks,leaves};};
  const small=budget(b),full=budget(a);assert.equal(small.leaves,full.leaves);assert.ok(small.trunks<full.trunks*.7);
 }finally{globalThis.document=previous;}
});
