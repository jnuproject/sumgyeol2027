import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {escalatorLayout,createCampusEscalator} from '../dist/campus-escalator.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
import {applySatelliteLayout} from '../dist/satellite-layout.js';
import {applyStudentHallReference} from '../dist/student-hall-garden.js';
import {isWalkingRoad,roadWidthAt} from '../dist/road-profile.js';
import {segmentDistance} from '../dist/navigation.js';
const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url))))));
const vehicles=data.roads.filter(r=>!isWalkingRoad(r));
const clearance=(x,z)=>Math.min(...vehicles.flatMap(r=>r.points.slice(1).map((b,i)=>segmentDistance(x,z,r.points[i],b)-roadWidthAt(r,x,z)/2)));
test('both end platforms, stair edges and canopy remain outside every vehicle carriageway',()=>{
 const l=escalatorLayout(data);assert.ok(l.length>65&&l.length<90);
 for(let d=-l.landing;d<=l.length+l.landing;d+=.25)for(const u of [-2.75,2.75]){const x=l.a[0]+l.ux*d+l.nx*u,z=l.a[1]+l.uz*d+l.nz*u;assert.ok(clearance(x,z)>.5,`road clearance ${clearance(x,z)} at ${x},${z}`);}
});
test('moving treads carry passengers in opposite directions while ordinary stairs and landings remain still',()=>{
 const scene=new THREE.Scene(),e=createCampusEscalator({scene,data,terrain:{heightAt:(x,z)=>z*.12},collisionMeshes:[],obstacles:[]});
 const up=e.at(12,e.layout.lanes[0].side),down=e.at(12,e.layout.lanes[1].side),stairs=e.at(12,e.layout.stairs.side);
 assert.ok(e.conveyorAt(...up).z>1);assert.ok(e.conveyorAt(...down).z< -1);assert.equal(e.conveyorAt(...stairs),null);assert.equal(e.conveyorAt(...e.at(-.8,-1.92)),null);
 const instanced=[];scene.traverse(o=>{if(o.isInstancedMesh)instanced.push(o);});const before=instanced[0].instanceMatrix.array.slice();e.update(.25);assert.notDeepEqual(instanced[0].instanceMatrix.array,before);
 for(const p of [up,down,e.at(-.8),e.at(e.layout.length+.8)])assert.ok(Number.isFinite(e.heightAt(...p)));assert.equal(e.heightAt(...stairs),null);
});

// Use the shipped terrain as well as the prepared map. A straight synthetic
// slope cannot reveal the sideways hillside that covered one escalator lane.
import {createCampusTerrain} from '../dist/terrain.js';
import {addFocusDetails} from '../dist/focus-details.js';
const meta=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url)));
const raw=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url));
const actualTerrain=createCampusTerrain(meta,new Float32Array(raw.buffer,raw.byteOffset,raw.byteLength/4),data);

test('both actual moving tread surfaces clear the hillside across their full width and depth at every animation phase',()=>{
 const scene=new THREE.Scene(),e=createCampusEscalator({scene,data,terrain:actualTerrain,collisionMeshes:[],obstacles:[]}),treads=[];
 scene.traverse(o=>{if(o.name.endsWith('moving treads'))treads.push(o);});assert.equal(treads.length,2);
 const matrix=new THREE.Matrix4(),point=new THREE.Vector3();let minimum=Infinity;
 for(const phase of [0,.07,.13,.19,.28]){
  e.update(phase);
  for(const mesh of treads)for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);
   for(const x of [-.5,0,.5])for(const z of [-.5,0,.5]){point.set(x,.5,z).applyMatrix4(matrix);const gap=point.y-actualTerrain.heightAt(point.x,point.z);minimum=Math.min(minimum,gap);assert.ok(gap>.12,`buried tread at ${point.toArray()}, clearance ${gap}`);}
   point.set(0,.5,0).applyMatrix4(matrix);assert.ok(Math.abs(e.heightAt(point.x,point.z)-point.y-.012)<.001,'walking height follows the visible moving tread');
  }
 }
 assert.ok(minimum>.12);
});

test('graded landings match rendered triangles and meet the surrounding ground without a tall end step',()=>{
 const scene=new THREE.Scene(),collisions=[],e=createCampusEscalator({scene,data,terrain:actualTerrain,collisionMeshes:collisions,obstacles:[]});scene.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 for(const d of [-1.59,-1.3,-.8,-.2,e.layout.length+.2,e.layout.length+.8,e.layout.length+1.3,e.layout.length+1.59])for(const u of [-2.5,-1.92,-.64,1.46,2.5]){
  const [x,z]=e.at(d,u),floor=actualTerrain.heightAt(x,z);ray.set(new THREE.Vector3(x,200,z),down);const hit=ray.intersectObjects(collisions)[0];assert.ok(hit,'landing has a visible upper face');assert.ok(hit.point.y-floor>.03,'terrain stays below platform');assert.ok(Math.abs(e.heightAt(x,z)-hit.point.y-.012)<2e-5,'physics and graded landing mesh agree');
  if(d< -1.5||d>e.layout.length+1.5)assert.ok(hit.point.y-floor<.1,'outer edge joins path at a low kerb');
 }
});

test('ordinary stairs beside the escalators also clear the actual hillside throughout each tread',()=>{
 const scene=new THREE.Scene(),unit=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial(),box=(x,y,z,w,h,d)=>{const m=new THREE.Mesh(unit,material);m.position.set(x,y+actualTerrain.heightAt(x,z),z);m.scale.set(w,h,d);scene.add(m);return m;};
 const details=addFocusDetails({scene,data,terrain:actualTerrain,environment:{polygon(){},segment(){}},surfaces:{paving:material,asphalt:material},box,collisionMeshes:[],obstacles:[],fallbackHeightAt:actualTerrain.heightAt}),route=details.routes.find(r=>r.id==='library-ascent');assert.ok(route);
 for(const tread of route.treads)for(const d of [tread.from,(tread.from+tread.to)/2,tread.to])for(const u of [-route.width/2,0,route.width/2]){const x=route.a[0]+route.ux*d-route.uz*u,z=route.a[1]+route.uz*d+route.ux*u;assert.ok(tread.height-actualTerrain.heightAt(x,z)>.12,'ordinary stair remains visible above slope');}
});

test('an upward-facing continuous base closes the gaps between the lanes above the hillside',()=>{
 const scene=new THREE.Scene(),e=createCampusEscalator({scene,data,terrain:actualTerrain,collisionMeshes:[],obstacles:[]}),steel=[];scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(o.isMesh&&o.material.color?.getHexString()==='91a3a8')steel.push(o);});
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 for(let d=1;d<e.layout.length-1;d+=.7)for(const u of [-2.55,-1.28,-.01]){const [x,z]=e.at(d,u);ray.set(new THREE.Vector3(x,e.profileAt(d)-.06,z),down);const hit=ray.intersectObjects(steel)[0];assert.ok(hit,'base has an upper face even between tread lanes');assert.ok(hit.point.y-actualTerrain.heightAt(x,z)>.03,'base stays above grass');}
});
