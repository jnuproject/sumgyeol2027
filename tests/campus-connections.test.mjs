import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from '../dist/three.module.js';
import {createCampusTerrain} from '../dist/terrain.js';import {prepareCampusRoads} from '../dist/road-clearance.js';import {applySatelliteLayout} from '../dist/satellite-layout.js';import {applyStudentHallReference,STUDENT_POND} from '../dist/student-hall-garden.js';
import {CAMPUS_CONNECTIONS} from '../dist/campus-connections.js';import {addCampusWalkDetails} from '../dist/campus-walk-details.js';import {addStadiumSurroundings} from '../dist/stadium-surroundings.js';import {createCampusFestival} from '../dist/campus-festival.js';import {createFocusWalkArea} from '../dist/walk-area.js';import {generateVegetationLayout} from '../dist/vegetation.js';import {walkable,insidePolygon} from '../dist/navigation.js';import {wayfindingPlacements} from '../dist/campus-wayfinding.js';
const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)))))),raw=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url)),heights=Float32Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4)),meta=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url))),terrain=createCampusTerrain(meta,heights,data);
function setup(){const scene=new THREE.Scene(),obstacles=generateVegetationLayout(data).map(t=>[t.x,t.z,.8]),polys=[...data.buildings],cameraCollisionMeshes=[];addStadiumSurroundings({scene,data,terrain,collisionPolygons:polys,obstacles,cameraCollisionMeshes});createCampusFestival({scene,data,terrain,avatar:null,collisionPolygons:polys,obstacles,cameraCollisionMeshes});const mat=new THREE.MeshStandardMaterial(),details=addCampusWalkDetails({scene,terrain,obstacles,cameraCollisionMeshes,environment:{segment(){},polygon(){}},surfaces:{paving:mat}});return {scene,obstacles,polys,details};}
test('student hall, pond and stadium routes stay traversable with scenery in place',()=>{
 const {obstacles,polys}=setup(),area=createFocusWalkArea(data);
 for(const r of CAMPUS_CONNECTIONS)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=0;d<=len;d+=.35){const x=a[0]+(b[0]-a[0])*d/len,z=a[1]+(b[1]-a[1])*d/len;assert.ok(area.contains(x,z),r.id+' outside');assert.ok(walkable(x,z,polys),r.id+' building/structure '+[x,z]);assert.ok(obstacles.every(o=>Math.hypot(o[0]-x,o[1]-z)>o[2]+.45),r.id+' furniture/tree '+[x,z]);assert.ok(!insidePolygon(x,z,STUDENT_POND),r.id+' pond');}}
 assert.equal(area.contains(300,-200),false);assert.equal(area.contains(-400,250),false);
});
test('local grading removes steep path breaks without modifying the source raster or remote terrain',()=>{
 const saved=Array.from(heights),original=createCampusTerrain(meta,heights,{...data,studentHallReference:null});assert.deepEqual(Array.from(heights),saved);
 let maxGrade=0;
 for(const r of CAMPUS_CONNECTIONS)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=.5;d<len;d+=.5){const at=d=>terrain.heightAt(a[0]+(b[0]-a[0])*d/len,a[1]+(b[1]-a[1])*d/len);maxGrade=Math.max(maxGrade,Math.abs(at(d)-at(d-.5))/.5);}}
 assert.ok(maxGrade<.38,'maximum route grade '+maxGrade);
 for(const p of[[100,100],[-100,250],[200,-200],data.spawn])assert.ok(Math.abs(terrain.heightAt(...p)-original.heightAt(...p))<1e-8);
 const water=[];for(let x=-160;x<-125;x+=2)for(let z=-58;z<-42;z+=2)if(insidePolygon(x,z,STUDENT_POND))water.push(terrain.heightAt(x,z));assert.ok(Math.max(...water)-Math.min(...water)<.15,'pond remains level');
});
test('campus fixtures are bounded and signposts keep roads and NPC approaches clear',()=>{
 const {scene,obstacles,details}=setup();assert.equal(details.benches,3);assert.ok(details.batching.renderBatches<=16);
 const anchors=[[-66,-265]],places=wayfindingPlacements(data,terrain.heightAt,obstacles,anchors);assert.ok(places.length>=5);assert.ok(!places.some(s=>s.id==='north-lawns'));
 for(const s of places)assert.ok(obstacles.every(o=>Math.hypot(s.x-o[0],s.z-o[1])>o[2]+.8));
 scene.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
});
