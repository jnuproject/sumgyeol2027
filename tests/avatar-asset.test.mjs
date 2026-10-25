import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {FBXLoader} from '../dist/vendor/FBXLoader.js';
const loader=new FBXLoader();
function load(name){const b=fs.readFileSync(new URL('../dist/assets/characters/sumgyeol/'+name+'.fbx',import.meta.url));return loader.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
test('CC0 character rig accepts idle/run/jump clips without animation root translation through walls',()=>{
 const model=load('character'),mixer=new THREE.AnimationMixer(model);let skinned=0;model.traverse(o=>{if(o.isSkinnedMesh)skinned++;});assert.equal(skinned,1);
 for(const name of ['idle','run','jump']){
  const source=load(name),clip=source.animations.find(c=>c.name.toLowerCase().endsWith('|'+name))?.clone();assert.ok(clip);assert.ok(clip.duration>.1);
  clip.tracks=clip.tracks.filter(t=>model.getObjectByName(t.name.slice(0,t.name.lastIndexOf('.'))));assert.ok(clip.tracks.length>10);
  const action=mixer.clipAction(clip).play();for(let i=0;i<30;i++){mixer.update(1/60);model.updateMatrixWorld(true);model.traverse(o=>{for(const value of o.matrixWorld.elements)assert.ok(Number.isFinite(value));});}action.stop();
  assert.ok(model.getObjectByName('Root').position.length()<.001);
 }
});
test('edited source clothing keeps the original CC0 license and uses a local SVG texture',()=>{
 const svg=fs.readFileSync(new URL('../dist/assets/characters/sumgyeol/sumgyeol-skin.svg',import.meta.url),'utf8'),license=fs.readFileSync(new URL('../dist/assets/characters/sumgyeol/KENNEY-LICENSE.txt',import.meta.url),'utf8');
 assert.ok(license.includes('CC0'));assert.ok(svg.includes('viewBox="0 0 1024 1024"'));assert.ok(svg.includes('#48ABD2'));assert.ok(!svg.includes('http://')||svg.includes('http://www.w3.org/2000/svg'));
});
