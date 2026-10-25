import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {createCampusTerrain} from '../dist/terrain.js';
import {addCampusObservedDetails} from '../dist/campus-observed-details.js';
import {observedMassParts,BUILDING_PROFILES,foldedRoofParts} from '../dist/observed-campus.js';
import {createSceneScope} from '../dist/scene-scope.js';
import {insidePolygon} from '../dist/navigation.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
const meta=JSON.parse(fs.readFileSync(new URL('../dist/terrain-data/terrain.json',import.meta.url)));
const raw=fs.readFileSync(new URL('../dist/terrain-data/elevations.f32',import.meta.url));
const heights=Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4));
test('observed sports pad is level without modifying source height samples or spawn datum',()=>{
 const original=heights.slice(),t=createCampusTerrain(meta,heights,data),samples=[];
 for(let x=-268;x<=-204;x+=8)for(let z=-95;z<=5;z+=10)samples.push(t.heightAt(x,z));
 assert.ok(Math.max(...samples)-Math.min(...samples)<.001);assert.deepEqual(heights,original);assert.ok(Math.abs(t.heightAt(...data.spawn))<1e-9);assert.equal(t.metadata.verticalExaggeration,1);assert.ok(t.metadata.localObservedGrading[0].changedSamples>0);
});
function fixture(visibleAt=()=>true){
 const scene=new THREE.Scene(),terrain=createCampusTerrain(meta,heights,data),collisions=[],obstacles=[];
 const make=()=>new THREE.MeshStandardMaterial();const surfaces={asphalt:make(),paving:make(),grass:make()};
 function box(x,y,z,w,h,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),make());m.position.set(x,terrain.heightAt(x,z)+y,z);scene.add(m);return m;}
 const result=addCampusObservedDetails({scene,data,terrain,environment:{polygon(){},segment(){},heightAt:terrain.heightAt},surfaces,box,collisionMeshes:collisions,obstacles,visibleAt});return {scene,terrain,result};
}
test('stairs height sampler matches their generated treads, including downhill approaches',()=>{
 const {result}=fixture();assert.equal(result.stairways.length,3);
 for(const s of result.stairways){let last=-Infinity;for(let i=0;i<s.steps;i++){const d=s.depth-(i+.5)*s.depth/s.steps,x=s.cx+s.nx*d,z=s.cz+s.nz*d,expected=s.start+s.rise*(i+1)/s.steps+.012;const h=result.heightAt(x,z);assert.ok(Math.abs(h-expected)<.02);assert.ok(h>=last);last=h;}}
});
test('parked vehicles stay fully inside mapped parking polygons',()=>{
 const {result}=fixture();assert.ok(result.stats.parkedCars>=15);assert.ok(result.stats.parkedCars<=42);
 for(const [x,z,ux,uz] of result.carLocations){const corners=[-2,2].flatMap(a=>[-.9,.9].map(b=>[x+ux*a-uz*b,z+uz*a+ux*b]));assert.ok(data.areas.filter(a=>a.tags.amenity==='parking').some(a=>corners.every(p=>insidePolygon(...p,a.points))));}
});
test('student hall retains its footprint while using two distinct roof levels',()=>{
 const b=data.buildings.find(b=>b.id==='471697621'),parts=observedMassParts(b,BUILDING_PROFILES[b.id].height);
 assert.equal(parts.length,2);assert.deepEqual(parts[0].points,b.points);assert.equal(parts[0].height,8.4);assert.equal(parts[1].height+8.4,BUILDING_PROFILES[b.id].height);assert.ok(parts[1].points.every(p=>p[1]>=1-1e-8));
});
test('new details and folded roof vertices are finite',()=>{
 const {scene}=fixture();scene.traverse(o=>{if(o.isMesh)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});const b=data.buildings.find(b=>b.id==='741724817');for(const p of foldedRoofParts(b.points,14.2,1.8,0,1))assert.ok(p.positions.every(Number.isFinite));
});

test('focused scene never leaves parked vehicles floating outside rendered ground',()=>{
 const scope=createSceneScope(data),visibleAt=(x,z)=>scope.outsideDistance(x,z)<5;
 const {result}=fixture(visibleAt),unfiltered=fixture().result;assert.ok(unfiltered.stats.parkedCars>0);assert.ok(result.stats.parkedCars<unfiltered.stats.parkedCars);assert.ok(unfiltered.carLocations.some(([x,z])=>!visibleAt(x,z)));
 for(const [x,z,ux,uz] of result.carLocations)for(const a of[-2,2])for(const b of[-1,1])assert.ok(visibleAt(x+ux*a-uz*b,z+uz*a+ux*b));
});
