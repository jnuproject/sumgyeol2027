import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {applySatelliteLayout,SATELLITE_LAWNS,satellitePoint} from '../dist/satellite-layout.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
import {createCampusTerrain} from '../dist/terrain.js';
import {generateVegetationLayout} from '../dist/vegetation.js';
import {insidePolygon,segmentDistance,walkable} from '../dist/navigation.js';
import {resolveFocusStops} from '../dist/focus-route.js';
import {addSportsGrounds} from '../dist/sports-ground.js';
const original=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
const data=prepareCampusRoads(applySatelliteLayout(original));
test('reference correction preserves downloaded data and is idempotent',()=>{
 const before=JSON.stringify(original),result=applySatelliteLayout(original);
 assert.equal(JSON.stringify(original),before);assert.strictEqual(applySatelliteLayout(result),result);
 assert.equal(result.buildings.length,65);assert.equal(result.areas.length,41);assert.equal(result.roads.length,94);
 assert.equal(new Set(result.buildings.map(b=>b.id)).size,result.buildings.length);
 assert.deepEqual(satellitePoint('north',[670,493]),[-78.034,-409.99]);
});
test('traced outlines have closed finite rings and corrected foundation anchors stay inside their buildings',()=>{
 for(const b of data.buildings){assert.deepEqual(b.points[0],b.points.at(-1));assert.ok(b.points.flat().every(Number.isFinite));}
 for(const id of data.satelliteLayout.correctedBuildingIds){const b=data.buildings.find(b=>b.id===id);assert.ok(insidePolygon(...b.center,b.points));}
 for(const stop of resolveFocusStops(data)){assert.ok(walkable(...stop.visitPosition,data.buildings));}
});
test('lawn centres and parking stay clear while observed crowns occupy only lawn margins',()=>{
 const trees=generateVegetationLayout(data);assert.ok(trees.length>1000);
 assert.ok(trees.filter(p=>p.areaId==='lawn-edge-observed').length>=30);
 const parking=data.areas.filter(a=>a.id.startsWith('sat-')&&a.tags.amenity==='parking');
 for(const tree of trees){
  assert.ok(!parking.some(a=>insidePolygon(tree.x,tree.z,a.points)));
  for(const a of SATELLITE_LAWNS.slice(0,3))if(insidePolygon(tree.x,tree.z,a.points)){
   const edge=Math.min(...a.points.slice(1).map((q,i)=>segmentDistance(tree.x,tree.z,a.points[i],q)));
   assert.equal(tree.areaId,'lawn-edge-observed');assert.ok(edge<6.5);
  }
 }
});
test('restored oval, lane marks and recreation courts drape onto the same playable terrain',()=>{
 const metadata=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url)));
 const binary=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url));
 const heights=Array.from({length:binary.length/4},(_,i)=>binary.readFloatLE(i*4));
 const terrain=createCampusTerrain(metadata,heights,data),calls=[];
 const environment={polygon(points,mat,lift){calls.push({points,lift});},segment(a,b,width,mat,lift){calls.push({points:[a,b],lift});}};
 const scene=new THREE.Scene(),sports=addSportsGrounds(scene,data,terrain,environment);
 assert.equal(sports.recreationCourts,2);assert.ok(calls.length>800);
 for(const c of calls)for(const [x,z] of c.points)assert.ok(Number.isFinite(terrain.heightAt(x,z)+c.lift));
 const samples=[[-265,-90],[-205,-90],[-265,5],[-205,5]].map(p=>terrain.heightAt(...p));assert.ok(Math.max(...samples)-Math.min(...samples)<.001);
 scene.traverse(o=>{if(o.isMesh)assert.ok(o.position.toArray().every(Number.isFinite));});
});
