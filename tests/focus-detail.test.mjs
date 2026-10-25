import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {createCampusTerrain} from '../dist/terrain.js';
import {makeStairRoute,stairRouteHeight,addFocusDetails,insideFocusClearance} from '../dist/focus-details.js';
import {FOCUS_BUILDING_PROFILES,addFocusFacade} from '../dist/focus-architecture.js';
import {generateVegetationLayout} from '../dist/vegetation.js';
import {walkable} from '../dist/navigation.js';
import {segmentDistance} from '../dist/navigation.js';
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
 for(const route of details.routes)for(const t of route.treads){const d=(t.from+t.to)/2,side=route.split?route.width*.22:0,x=route.a[0]+route.ux*d-route.uz*side,z=route.a[1]+route.uz*d+route.ux*side;assert.equal(details.heightAt(x,z),t.height+.012);assert.ok(obstacles.every(o=>Math.hypot(o[0]-x,o[1]-z)>o[2]+.4));}
 scene.traverse(o=>{if(o.isMesh){for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));for(const v of o.matrix.elements)assert.ok(Number.isFinite(v));}});
 const marker=scene.getObjectByName('Library marker stone'),positions=marker.geometry.attributes.position,edges=new Map();
 const key=i=>[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>v.toFixed(5)).join(',');
 for(let i=0;i<positions.count;i+=3)for(const [a,b]of[[i,i+1],[i+1,i+2],[i+2,i]]){const edge=[key(a),key(b)].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}
 assert.ok([...edges.values()].every(count=>count===2),'marker stone must be a closed surface without separated triangles');marker.geometry.computeBoundingBox();assert.ok(Math.abs(marker.position.y+marker.geometry.boundingBox.min.y-terrain.heightAt(marker.position.x,marker.position.z))<1e-6,'marker base meets ground');
 assert.equal(details.stats.studentAccessFlights,2);
});
test('reconstructed vegetation keeps the selected stairs and low courts clear',()=>{
 const trees=generateVegetationLayout(data);
 assert.ok(trees.length>100);
 for(const p of trees)assert.equal(insideFocusClearance(p.x,p.z,data),false);
 for(const p of trees)assert.ok(segmentDistance(p.x,p.z,[-99,-21],[-73,-21])>=4.2,'student deck approach must not be blocked by avenue trunks');
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

test('student approach has a short descending staircase and a lower court',()=>{
 const scene=new THREE.Scene(),obstacles=[],unit=new THREE.BoxGeometry(1,1,1),make=()=>new THREE.MeshStandardMaterial();
 const box=(x,y,z,w,h,d)=>{const m=new THREE.Mesh(unit,make());m.position.set(x,terrain.heightAt(x,z)+y,z);m.scale.set(w,h,d);scene.add(m);return m;};
 const details=addFocusDetails({scene,data,terrain,surfaces:{paving:make(),asphalt:make()},box,collisionMeshes:[],obstacles,environment:{polygon(){},segment(){}},fallbackHeightAt:terrain.heightAt});
 const access=details.routes.find(r=>r.a[0]===-91&&r.a[1]===-21);
 assert.equal(access.length,8);assert.equal(access.width,3.2);assert.equal(access.treads.filter(t=>!t.landing).length,14);
 let previous=details.heightAt(-87.8,-21);const street=previous,court=terrain.heightAt(-111,-21);
 assert.ok(street-court>1.5&&street-court<2.8);
 for(const t of access.treads){assert.ok(t.height<=previous+.02);assert.ok(previous-t.height<.30);if(!t.landing)assert.ok(t.to-t.from>=.3&&t.to-t.from<=.5);const d=(t.from+t.to)/2,x=access.a[0]+access.ux*d,z=access.a[1]+access.uz*d;assert.ok(t.height>=terrain.heightAt(x,z)-.015,'treads must not disappear beneath the bank');previous=t.height;}
 assert.ok(Math.abs(previous-court-.12)<1e-6);
});
