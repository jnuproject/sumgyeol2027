import {generateVegetationLayout} from '../dist/vegetation.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from '../dist/three.module.js';
import {festivalLayout} from '../dist/festival-layout.js';import {createCampusFestival} from '../dist/campus-festival.js';import {createFocusWalkArea} from '../dist/walk-area.js';
import {walkable,segmentDistance} from '../dist/navigation.js';import {prepareCampusRoads} from '../dist/road-clearance.js';import {applySatelliteLayout} from '../dist/satellite-layout.js';import {applyStudentHallReference} from '../dist/student-hall-garden.js';import {createCampusTerrain} from '../dist/terrain.js';
const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url))))));
const meta=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url))),raw=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url));
const heights=new Float32Array(raw.length/4);for(let i=0;i<heights.length;i++)heights[i]=raw.readFloatLE(i*4);const terrain=createCampusTerrain(meta,heights,data);
function setup(){const scene=new THREE.Scene(),collisionPolygons=[],obstacles=[],cameraCollisionMeshes=[];const f=createCampusFestival({scene,data,terrain,avatar:null,collisionPolygons,obstacles,cameraCollisionMeshes});return {f,scene,collisionPolygons,obstacles};}
test('festival uses the original sports field and retains a clear gym-to-field connection',()=>{
 const trees=generateVegetationLayout(data);const l=festivalLayout(data),area=createFocusWalkArea(data),{collisionPolygons,obstacles}=setup();assert.ok(area.contains(...l.center));
 for(let i=1;i<l.connector.length;i++){const a=l.connector[i-1],b=l.connector[i],length=Math.hypot(a[0]-b[0],a[1]-b[1]);for(let t=0;t<=length;t+=.4){const p=[a[0]+(b[0]-a[0])*t/length,a[1]+(b[1]-a[1])*t/length];assert.ok(trees.every(t=>Math.hypot(t.x-p[0],t.z-p[1])>4.4));assert.ok(area.contains(...p));assert.ok(walkable(...p,[...data.buildings,...collisionPolygons]),JSON.stringify(p));assert.ok(obstacles.every(o=>Math.hypot(o[0]-p[0],o[1]-p[1])>o[2]+.4));}}
 const zone=l.studentZone;assert.ok(l.audience.every(p=>p.x>zone.minX&&p.x<zone.maxX&&p.z>zone.minZ&&p.z<zone.maxZ));
 assert.ok(!walkable(zone.maxX,l.center[1]+15,collisionPolygons));assert.ok(walkable(zone.maxX,l.center[1],collisionPolygons));
 const [sx,sz]=l.stage;assert.ok(!walkable(sx+22,sz+9,collisionPolygons));assert.ok(!walkable(sx+14,sz,collisionPolygons));
 for(let x=sx+28;x<zone.maxX+4;x+=.5){assert.ok(walkable(x,sz,collisionPolygons));assert.ok(obstacles.every(o=>Math.hypot(x-o[0],sz-o[1])>o[2]+.4));}
 for(const b of l.booths)assert.ok(!walkable(b.x,b.z,collisionPolygons));assert.ok(walkable(...l.spawn,collisionPolygons));
 assert.equal(area.contains(300,-200),false);assert.equal(area.contains(-400,250),false);
});
test('photo-informed festival has bounded geometry, seated instanced spectators and no dynamic light budget',()=>{
 const {f,scene}=setup(),m=f.metadata();assert.equal(m.booths,8);assert.equal(m.screenCount,3);assert.equal(m.staticAudience,24);assert.equal(m.liveLights,0);assert.ok(m.batching.drawCallsSaved>500);
 let instances=0,triangles=0,draws=0;scene.traverse(o=>{if(o.isInstancedMesh)instances+=o.count;if(o.isMesh){assert.ok(ArrayBuffer.isView(o.geometry.attributes.position.array));for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);draws++;}});assert.equal(instances,24);assert.ok(triangles<300000, `festival triangles: ${triangles}`);assert.ok(draws<80, `festival draws: ${draws}`);
 f.update(.016,{focus:{x:500,z:500}});assert.equal(f.root.visible,false);assert.equal(f.metadata().animatedFrames,0);f.update(.016,{focus:{x:-237,z:-45},night:true,reducedMotion:true});assert.equal(f.root.visible,true);
});
test('maintenance entrypoints and public bootstrap stay closed while the preview is loopback-only',()=>{
 for(const name of ['index.html','walk.html']){const s=fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');assert.match(s,/data-service="paused"/);assert.doesNotMatch(s,/<script/);}
 assert.match(fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8'),/location.replace/);
 assert.match(fs.readFileSync(new URL('../verification/festival-preview.py',import.meta.url),'utf8'),/127\.0\.0\.1/);
});
