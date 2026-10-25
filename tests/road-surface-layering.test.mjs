import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {addCampusEnvironment} from '../dist/environment.js';
import {addObservedEntrance} from '../dist/entrance-observed.js';
import {roadWidthAt} from '../dist/road-profile.js';

function rawPolygon(points,offset=0){
 const positions=points.flatMap(([x,z])=>[x,offset,z]),indices=[];
 for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
 return {positions:Float32Array.from(positions),indices:Uint32Array.from(indices)};
}
function fixture(withEntrance=false,widthTag){
 const terrain={heightAt:()=>0,geometry:rawPolygon([[-100,-550],[100,-550],[100,-300],[-100,-300]]),drapeConvexPolygon:rawPolygon,drapeRoadSegment(a,b,width,offset){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),x=(b[1]-a[1])/length*width/2,z=-(b[0]-a[0])/length*width/2;
  return rawPolygon([[a[0]-x,a[1]-z],[b[0]-x,b[1]-z],[b[0]+x,b[1]+z],[a[0]+x,a[1]+z]],offset);
 }};
 const data={spawn:[0,-480],areas:[],roads:[{id:'286085067',points:[[0,-480],[0,-440],[0,-410],[0,-350]],tags:{highway:'service'}},{id:'crossing',points:[[-25,-440],[25,-440]],tags:{highway:'service'}}]};
 if(widthTag)data.roads[0].tags.width=widthTag;
 if(withEntrance)data.roads[0].points.reverse(); // Real main way ends at the outer entrance.
 const scene=new THREE.Scene(),surfaces=Object.fromEntries(['grass','asphalt','paving','redPaving'].map(name=>[name,new THREE.MeshStandardMaterial({name,side:THREE.DoubleSide})]));
 const environment=addCampusEnvironment(scene,data,terrain,surfaces);
 let entrance;
 if(withEntrance){
  const box=(x,y,z,w,h,d,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
  entrance=addObservedEntrance({scene,data,terrain,environment,surfaces,box,basalt:surfaces.paving,collisions:[],collisionMeshes:[],obstacles:[]});environment.flush();
 }
 scene.updateMatrixWorld(true);
 function renderedHeight(x,z){const ray=new THREE.Raycaster(new THREE.Vector3(x,5,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(scene.children,true)[0];assert.ok(hit,'rendered surface exists');return {height:hit.point.y,material:hit.object.material};}
 return {environment,renderedHeight,surfaces,scene,entrance,halfWidth:roadWidthAt(data.roads[0],0,-460)/2};
}
test('raised sidewalks and node caps do not cover main asphalt or a connecting vehicle road',()=>{
 const {environment,renderedHeight,surfaces}=fixture();
 for(const [x,z]of[[0,-460],[3,-455],[0,-483],[11,-440],[-11,-440]]){
  const hit=renderedHeight(x,z);assert.ok(hit.material===surfaces.asphalt,`vehicle road remains asphalt at ${x},${z}`);assert.ok(Math.abs(hit.height-.08)<1e-6);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,'walking sampler matches rendered road');
 }
});
test('paved sidewalk, solid kerb and annular cap heights match their walking surface',()=>{
 const {environment,renderedHeight,halfWidth:h}=fixture();
 for(const [x,z,expected]of[[h+3.25,-460,.14],[h+1.15,-460,.14],[h+.16,-460,.18],[0,-480-h-2.95,.14]]){
  const hit=renderedHeight(x,z);assert.ok(Math.abs(hit.height-expected)<1e-6,`rendered height at ${x},${z}`);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,`walking surface at ${x},${z}`);
 }
});
test('actual entrance extension keeps asphalt and sidewalk visible with matching walking heights',()=>{
 const {environment,renderedHeight,surfaces,halfWidth:h,entrance}=fixture(true);
 for(const z of[-483,-486,-489,-491.7,-496,-500])for(const x of[-h*.75,-h*.25,h*.25,h*.75]){
  const hit=renderedHeight(x,z);assert.ok(hit.material===surfaces.asphalt,`approach lane remains asphalt at ${x},${z}`);assert.ok(Math.abs(hit.height-.08)<1e-6);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,'approach walking height follows asphalt');
 }
 for(const x of[-h-2.25,h+2.25])for(const z of[-486,-491.7,-497]){
  const hit=renderedHeight(x,z);assert.ok(hit.material===surfaces.redPaving,`approach sidewalk remains paving at ${x},${z}`);assert.ok(Math.abs(hit.height-.14)<1e-6);assert.ok(Math.abs(environment.heightAt(x,z)-hit.height)<1e-6,'approach sidewalk height matches paving');
 }
 const [sx,sz]=entrance.entrySpawn,hit=renderedHeight(sx,sz);
 assert.ok(Math.abs(sx)>h&&Math.abs(sx)<h+4.2,'entrance spawn stays on the roadside sidewalk');
 assert.ok(hit.material===surfaces.redPaving,'entrance spawn has a rendered sidewalk');
 assert.ok(Math.abs(hit.height-.14)<1e-6&&Math.abs(environment.heightAt(sx,sz)-hit.height)<1e-6,'spawn walking height matches rendered sidewalk');
});
test('main avenue renders four lanes with two internal dashed dividers and two outer edge lines',()=>{
 // An explicit width tag changes physical width, not the confirmed lane count.
 for(const widthTag of[undefined,'9','17.5']){
  const {scene,halfWidth:h}=fixture(false,widthTag),seen=new Set();let whiteMeshes=0,yellowVertices=0;
  scene.traverse(mesh=>{
   if(mesh.isMesh&&mesh.material.color?.getHexString()==='cfb45d'){
    const p=mesh.geometry.attributes.position;
    for(let i=0;i<p.count;i++){assert.ok(Math.abs(p.getX(i))<.25,'yellow line separates opposing traffic at the centre');yellowVertices++;}
   }
   if(!mesh.isMesh||mesh.material.color?.getHexString()!=='e4e4d8')return;
   whiteMeshes++;const p=mesh.geometry.attributes.position,indices=mesh.geometry.index.array;
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),edge=Math.abs(Math.abs(x)-(h-.22))<=.061,divider=Math.abs(Math.abs(x)-h/2)<=.076;
    assert.ok(edge||divider,`white paint must be at the two edges or internal lane divisions (width ${h*2})`);
    seen.add((edge?'edge':'divider')+Math.sign(x));
   }
   for(let i=0;i<indices.length;i+=3){
    const vertices=[indices[i],indices[i+1],indices[i+2]];
    if(!vertices.every(v=>Math.abs(Math.abs(p.getX(v))-h/2)<=.076))continue;
    const zs=vertices.map(v=>p.getZ(v));
    assert.ok(Math.max(...zs)-Math.min(...zs)<=3.01,'internal lane divisions remain short dashes');
   }
  });
  assert.ok(whiteMeshes>0);assert.ok(yellowVertices>0,'yellow centre line is rendered');assert.deepEqual([...seen].sort(),['divider-1','divider1','edge-1','edge1']);
 }
});
