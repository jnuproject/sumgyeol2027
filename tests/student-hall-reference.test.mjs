import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {applySatelliteLayout} from '../dist/satellite-layout.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
import {applyStudentHallReference,addStudentHallGarden,STUDENT_POND,STUDENT_GARDEN_BOUNDARY,STUDENT_GARDEN_PATHS} from '../dist/student-hall-garden.js';
import {insidePolygon,walkable} from '../dist/navigation.js';
import {entranceLayout} from '../dist/entrance-observed.js';
import {createFocusWalkArea} from '../dist/walk-area.js';
const source=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(source)));
test('main avenue, gate and shared junctions align to one straight axis without mutating source geometry',()=>{
 const before=JSON.stringify(source);prepareCampusRoads(source);assert.equal(JSON.stringify(source),before);
 const main=data.roads.find(r=>r.id==='286085067'),axis=data.renderRoadCorrections.mainAvenue.axisX;
 assert.ok(main.points.every(p=>p[0]===axis));assert.equal(data.spawn[0],axis);
 assert.equal(entranceLayout(data).x,axis);
 const connector=data.roads.find(r=>r.id==='93690444');assert.ok(connector.points.filter(p=>p[1]<=82.744).every(p=>p[0]===axis));
 assert.ok(!data.renderRoadCorrections.fields.some(f=>f.id==='administration-avenue'));
 const keys=new Set(source.roads.find(r=>r.id===main.id).points.map(p=>p.join(',')));
 for(const original of source.roads.filter(r=>r.id!==main.id))for(const [i,p]of original.points.entries())if(keys.has(p.join(','))){
  const road=data.roads.find(r=>r.id===original.id);assert.ok(road.points.some(q=>Math.abs(q[1]-p[1])<.001&&q[0]===axis),`disconnected junction ${road.id}/${i}`);
 }
});
test('photo garden contains the pond, keeps curving paths out of water and preserves green grass',()=>{
 assert.strictEqual(applyStudentHallReference(data),data);
 for(const p of STUDENT_POND)assert.ok(insidePolygon(...p,STUDENT_GARDEN_BOUNDARY));
 for(const path of STUDENT_GARDEN_PATHS){assert.ok(path.points.length>20);for(const p of path.points)assert.ok(!insidePolygon(...p,STUDENT_POND));}
 const garden=data.areas.find(a=>a.id==='969694343');assert.equal(garden.tags['surface:appearance'],'existing_grass');
 const area=createFocusWalkArea(data);for(const p of [entranceLayout(data).entrySpawn,[-87.8,-21]]){assert.ok(area.contains(...p));assert.ok(walkable(...p,data.buildings));}
});
test('student forecourt and roof details are finite and keep the vehicle carriageway clear',()=>{
 const scene=new THREE.Scene(),terrain={heightAt:(x,z)=>.01*z},surfaces={paving:new THREE.MeshStandardMaterial(),asphalt:new THREE.MeshStandardMaterial(),grass:new THREE.MeshStandardMaterial()};
 const polygons=[],environment={polygon(points,material,offset,kind){polygons.push({points,material,kind});},segment(){}};
 const box=(x,y,z,w,h,d,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y+terrain.heightAt(x,z),z);scene.add(m);return m;};
 const result=addStudentHallGarden({scene,data,terrain,environment,surfaces,box,obstacles:[]});assert.equal(result.curvedPaths,3);assert.ok(result.forecourt);assert.ok(result.skylight);
 for(const poly of polygons){assert.ok(poly.points.flat().every(Number.isFinite));assert.ok(poly.points.every(p=>p[0]<-94),'garden must stay west of the vehicle lanes');}
 scene.traverse(o=>{if(o.isMesh){assert.ok(o.position.toArray().every(Number.isFinite));assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));}});
});
