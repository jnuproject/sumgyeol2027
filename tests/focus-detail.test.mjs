import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {createCampusTerrain} from '../dist/terrain.js';
import {makeStairRoute,stairRouteHeight,addFocusDetails,insideFocusClearance} from '../dist/focus-details.js';
import {FOCUS_BUILDING_PROFILES,addFocusFacade} from '../dist/focus-architecture.js';
import {generateVegetationLayout} from '../dist/vegetation.js';
import {walkable} from '../dist/navigation.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
const meta=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url)));
const raw=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url));
const source=new Float32Array(raw.buffer,raw.byteOffset,raw.byteLength/4),terrain=createCampusTerrain(meta,source,data);
test('ascent has monotone, usable treads and matching sampled top surfaces throughout',()=>{
 const r=data.roads.find(r=>r.id==='471489721'),route=makeStairRoute(r.points[0],r.points.at(-1),terrain.heightAt);
 let previous=terrain.heightAt(...r.points[0])+.32;
 for(const t of route.treads){assert.ok(t.height>=previous-1e-6);assert.ok(t.height-previous<.35);previous=t.height;
  const d=(t.from+t.to)/2,x=route.a[0]+route.ux*d,z=route.a[1]+route.uz*d;
  assert.ok(walkable(x,z,data.buildings));assert.ok(Math.abs(stairRouteHeight(route,x,z)-t.height-.012)<1e-7);
 }
 assert.equal(stairRouteHeight(route,route.a[0]+20,route.a[1]+20),null);
});
test('detailed environment remains finite and new access stairs use the same walking heights as meshes',()=>{
 const scene=new THREE.Scene(),collisionMeshes=[],obstacles=[],surfaces={paving:new THREE.MeshStandardMaterial(),asphalt:new THREE.MeshStandardMaterial()},unit=new THREE.BoxGeometry(1,1,1);
 const box=(x,y,z,w,h,d,c)=>{const m=new THREE.Mesh(unit,new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y+terrain.heightAt(x,z),z);m.scale.set(w,h,d);scene.add(m);return m;};
 const details=addFocusDetails({scene,data,terrain,surfaces,box,collisionMeshes,obstacles,environment:{segment(){},polygon(){}},fallbackHeightAt:terrain.heightAt});
 for(const route of details.routes)for(const t of route.treads){const d=(t.from+t.to)/2,x=route.a[0]+route.ux*d,z=route.a[1]+route.uz*d;assert.equal(details.heightAt(x,z),t.height+.012);assert.ok(obstacles.every(o=>Math.hypot(o[0]-x,o[1]-z)>o[2]+.4));}
 scene.traverse(o=>{if(o.isMesh){for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));for(const v of o.matrix.elements)assert.ok(Number.isFinite(v));}});
 assert.equal(details.stats.studentAccessFlights,2);
});
test('reconstructed vegetation keeps the selected stairs and low courts clear',()=>{
 const trees=generateVegetationLayout(data);
 assert.ok(trees.length>100);
 for(const p of trees)assert.equal(insideFocusClearance(p.x,p.z,data),false);
});
test('four independent focus facades preserve original footprints and produce finite geometry',()=>{
 const before=JSON.stringify(data.buildings);
 for(const [id,profile]of Object.entries(FOCUS_BUILDING_PROFILES)){
  const b=data.buildings.find(b=>b.id===id),scene=new THREE.Scene();let panels=0;
  const box=(x,y,z,w,h,d,c)=>{for(const v of[x,y,z,w,h,d])assert.ok(Number.isFinite(v));assert.ok(w>0&&h>0&&d>0);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));scene.add(m);return m;};
  assert.equal(addFocusFacade({scene,b,height:profile.height,base:terrain.heightAt(...b.center),box,panel(a,e,t,y,w,h,d,c){panels++;return box(a[0]+(e[0]-a[0])*t,y,a[1]+(e[1]-a[1])*t,w,h,d,c);}}),true);assert.ok(panels>50);
 }
 assert.equal(JSON.stringify(data.buildings),before);
});
