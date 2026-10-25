import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {addCampusEnvironment} from '../dist/environment.js';
import {addObservedEntrance} from '../dist/entrance-observed.js';

function rawPolygon(points,offset=0){
 const positions=points.flatMap(([x,z])=>[x,offset,z]),indices=[];
 for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
 return {positions:Float32Array.from(positions),indices:Uint32Array.from(indices)};
}
function fixture(withEntrance=false){
 const terrain={heightAt:()=>0,geometry:rawPolygon([[-100,-550],[100,-550],[100,-300],[-100,-300]]),drapeConvexPolygon:rawPolygon,drapeRoadSegment(a,b,width,offset){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),x=(b[1]-a[1])/length*width/2,z=-(b[0]-a[0])/length*width/2;
  return rawPolygon([[a[0]-x,a[1]-z],[b[0]-x,b[1]-z],[b[0]+x,b[1]+z],[a[0]+x,a[1]+z]],offset);
 }};
 const data={spawn:[0,-480],areas:[],roads:[{id:'286085067',points:[[0,-480],[0,-440],[0,-410]],tags:{highway:'service'}},{id:'crossing',points:[[-25,-440],[25,-440]],tags:{highway:'service'}}]};
 if(withEntrance)data.roads[0].points.reverse(); // Real main way ends at the outer entrance.
 const scene=new THREE.Scene(),surfaces=Object.fromEntries(['grass','asphalt','paving','redPaving'].map(name=>[name,new THREE.MeshStandardMaterial({name,side:THREE.DoubleSide})]));
 const environment=addCampusEnvironment(scene,data,terrain,surfaces);
 if(withEntrance){
  const box=(x,y,z,w,h,d,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
  addObservedEntrance({scene,data,terrain,environment,surfaces,box,basalt:surfaces.paving,collisions:[],collisionMeshes:[],obstacles:[]});environment.flush();
 }
 scene.updateMatrixWorld(true);
 function renderedHeight(x,z){const ray=new THREE.Raycaster(new THREE.Vector3(x,5,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(scene.children,true)[0];assert.ok(hit,'rendered surface exists');return {height:hit.point.y,material:hit.object.material};}
 return {environment,renderedHeight,surfaces};
}
test('raised sidewalks and node caps do not cover main asphalt or a connecting vehicle road',()=>{
 const {environment,renderedHeight,surfaces}=fixture();
 for(const [x,z]of[[0,-460],[3,-455],[0,-483],[11,-440],[-11,-440]]){
  const hit=renderedHeight(x,z);assert.ok(hit.material===surfaces.asphalt,`vehicle road remains asphalt at ${x},${z}`);assert.ok(Math.abs(hit.height-.08)<1e-6);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,'walking sampler matches rendered road');
 }
});
test('sidewalk, visible planting strip, solid kerb and annular cap heights match their walking surface',()=>{
 const {environment,renderedHeight}=fixture();
 for(const [x,z,expected]of[[12,-460,.14],[9.9,-460,.15],[8.91,-460,.18],[0,-491.7,.14]]){
  const hit=renderedHeight(x,z);assert.ok(Math.abs(hit.height-expected)<1e-6,`rendered height at ${x},${z}`);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,`walking surface at ${x},${z}`);
 }
});
test('actual entrance extension keeps asphalt and sidewalk visible with matching walking heights',()=>{
 const {environment,renderedHeight,surfaces}=fixture(true);
 for(const z of[-483,-486,-489,-491.7,-496,-500])for(const x of[0,3,-3]){
  const hit=renderedHeight(x,z);assert.ok(hit.material===surfaces.asphalt,`approach lane remains asphalt at ${x},${z}`);assert.ok(Math.abs(hit.height-.08)<1e-6);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,'approach walking height follows asphalt');
 }
 for(const x of[-11,11])for(const z of[-486,-491.7,-497]){
  const hit=renderedHeight(x,z);assert.ok(hit.material===surfaces.redPaving,`approach sidewalk remains paving at ${x},${z}`);assert.ok(Math.abs(hit.height-.14)<1e-6);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,'approach sidewalk height matches paving');
 }
});
