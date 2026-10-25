import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {roadWidth,roadWidthAt,roadRenderPoints} from '../dist/road-profile.js';
import {segmentDistance} from '../dist/navigation.js';
import {createCampusTerrain} from '../dist/terrain.js';
import {addObservedPeriphery} from '../dist/periphery.js';
import {createSceneScope} from '../dist/scene-scope.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url))),meta=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url))),raw=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url));
const heights=Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4));
test('entire main avenue retains four-lane width and every original OSM bend',()=>{
 const road=data.roads.find(r=>r.id==='286085067'),before=JSON.stringify(road);
 // The user's latest correction is four total lanes. 14.4m is a visual
 // estimate, not a surveyed width; do not restore the old width taper.
 assert.equal(roadWidth(road),14.4);
 for(let z=-500;z<=30;z+=.5)assert.ok(Math.abs(roadWidthAt(road,-79,z)-14.4)<1e-9,`four-lane width at z=${z}`);
 const points=roadRenderPoints(road);let lastIndex=-1;
 for(const original of road.points){const index=points.findIndex((p,i)=>i>lastIndex&&p[0]===original[0]&&p[1]===original[1]);assert.ok(index>lastIndex,'original turn retained in order');lastIndex=index;}
 for(const p of points)assert.ok(road.points.some((q,i)=>i&&segmentDistance(...p,road.points[i-1],q)<1e-8),'rendered centreline remains on original OSM way');
 assert.equal(JSON.stringify(road),before);const supplied={...road,tags:{...road.tags,width:'9'}};assert.equal(roadWidthAt(supplied,0,0),9);
});
test('nearby woodland and pond remain visible while remote dormitory and engineering terrain stay hidden',()=>{
 const scope=createSceneScope(data);for(const p of[[-145,200],[-147,-65],[-153,175],[-103,300]])assert.equal(scope.alphaAt(...p),1);
 for(const p of[[-440,350],[360,-220]])assert.equal(scope.alphaAt(...p),0);
 const t=createCampusTerrain(meta,heights,data),pond=data.areas.find(a=>a.id==='969694342'),ys=pond.points.map(p=>t.heightAt(...p));assert.ok(Math.max(...ys)-Math.min(...ys)<.001);
 const court=[220,224,228].map(z=>t.heightAt(-104,z));assert.ok(Math.max(...court)-Math.min(...court)<.001);
});
test('observed street furniture is finite, within the surrounding scene and clear of all chosen spawn points',()=>{
 const scene=new THREE.Scene(),terrain=createCampusTerrain(meta,heights,data),obstacles=[],arrows=[],scope=createSceneScope(data),surfaces={paving:new THREE.MeshStandardMaterial(),redPaving:new THREE.MeshStandardMaterial()};
 const box=(x,y,z,w,h,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial());m.position.set(x,terrain.heightAt(x,z)+y,z);scene.add(m);return m;};
 const result=addObservedPeriphery({scene,data,terrain,environment:{segment(){},polygon(points,material,offset){if(material.color.getHexString()==='e2e1d2'&&offset===.116)arrows.push(points);}},surfaces,box,obstacles,collisionMeshes:[]});assert.equal(result.stats.busShelters,1);assert.equal(result.stats.roadArrows,8);assert.ok(result.stats.basaltStones>100);
 const main=data.roads.find(r=>r.id==='286085067');assert.equal(arrows.length,8);
 for(const z of[-135,-55]){
  const i=main.points.findIndex((p,i)=>i&&z>=Math.min(p[1],main.points[i-1][1])&&z<=Math.max(p[1],main.points[i-1][1])),a=main.points[i-1],b=main.points[i],cx=a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]),width=roadWidthAt(main,cx,z);
  const atStation=arrows.filter(points=>points.every(p=>Math.abs(p[1]-z)<=1.51));assert.equal(atStation.length,4,'one arrow in each of four lanes');
  const offsets=atStation.map(points=>(Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2-cx).sort((a,b)=>a-b);
  for(let n=0;n<4;n++)assert.ok(Math.abs(offsets[n]-width*[-.375,-.125,.125,.375][n])<1e-8,'direction arrow is centred in its lane, not on a divider');
 }
 scene.traverse(o=>{if(!o.isMesh)return;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));assert.ok(o.position.toArray().every(Number.isFinite));});
 for(const [x,z,r]of obstacles){assert.ok(scope.alphaAt(x,z)>.98);for(const p of[[-67,-460],[-44,87.6],[-104,224],[-87.8,-21]])assert.ok(Math.hypot(x-p[0],z-p[1])>r+.55);}
});
