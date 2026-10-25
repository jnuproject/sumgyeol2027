import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {prepareCampusRoads,createRoadClearance} from '../dist/road-clearance.js';
import {roadWidthAt,isWalkingRoad} from '../dist/road-profile.js';
const source=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
function intersection(subject,clip){
 const sign=Math.sign(clip.reduce((s,a,i)=>{const b=clip[(i+1)%clip.length];return s+a[0]*b[1]-a[1]*b[0];},0))||1;
 for(let i=0;i<clip.length&&subject.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],value=p=>((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*sign,next=[];
  for(let j=0;j<subject.length;j++){const c=subject[j],d=subject[(j+1)%subject.length],u=value(c),v=value(d);if(u>=0)next.push(c);if((u>=0)!==(v>=0)){const t=u/(u-v);next.push([c[0]+(d[0]-c[0])*t,c[1]+(d[1]-c[1])*t]);}}
  subject=next;
 }
 return subject;
}
const box=p=>[Math.min(...p.map(p=>p[0])),Math.max(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[1]))];
const overlaps=(a,b)=>a[0]<b[1]&&a[1]>b[0]&&a[2]<b[3]&&a[3]>b[2];
test('display alignment keeps source footprints, original map file geometry and confirmed four-lane width intact',()=>{
 const before=JSON.stringify(source),data=prepareCampusRoads(source);
 assert.equal(JSON.stringify(source),before);assert.equal(data.buildings,source.buildings);assert.equal(data.roads.length,source.roads.length);
 const main=data.roads.find(r=>r.id==='286085067');assert.ok(main.points.some(p=>p[0]<-84&&p[1]>-124&&p[1]<-88));
 for(const p of main.points)assert.equal(roadWidthAt(main,...p),18);
 assert.deepEqual(main.points.at(-1),source.roads.find(r=>r.id===main.id).points.at(-1));
 assert.equal(prepareCampusRoads(data),data);
});
test('all rendered vehicle-road ribbons and round caps have zero footprint overlap across59 buildings',()=>{
 const data=prepareCampusRoads(source),guard=createRoadClearance(data.buildings,.6),buildings=data.buildings.map(b=>{const p=b.points.slice(0,-1);return {box:box(p),triangles:THREE.ShapeUtils.triangulateShape(p.map(p=>new THREE.Vector2(...p)),[]).map(t=>t.map(i=>p[i]))};});let tested=0;
 function check(poly){
  const raw={positions:Float32Array.from(poly.flatMap(p=>[p[0],0,p[1]])),indices:Uint32Array.from(Array.from({length:poly.length-2},(_,i)=>[0,i+1,i+2]).flat())},trimmed=guard.trim(raw);
  for(const n of trimmed.positions)assert.ok(Number.isFinite(n));
  for(let i=0;i<trimmed.indices.length;i+=3){const t=Array.from(trimmed.indices.slice(i,i+3),n=>[trimmed.positions[n*3],trimmed.positions[n*3+2]]),bb=box(t);for(const b of buildings){if(!overlaps(bb,b.box))continue;for(const bt of b.triangles)assert.ok(area(intersection(t,bt))<.005,'road triangle must remain outside the building footprint');}tested++;}
 }
 for(const r of data.roads.filter(r=>!isWalkingRoad(r))){for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<.01)continue;const nx=dz/l,nz=-dx/l,wa=roadWidthAt(r,...a)/2,wb=roadWidthAt(r,...b)/2;check([[a[0]-nx*wa,a[1]-nz*wa],[b[0]-nx*wb,b[1]-nz*wb],[b[0]+nx*wb,b[1]+nz*wb],[a[0]+nx*wa,a[1]+nz*wa]]);}for(const p of r.points){const w=roadWidthAt(r,...p)/2;check(Array.from({length:16},(_,i)=>[p[0]+Math.cos(i*Math.PI/8)*w,p[1]+Math.sin(i*Math.PI/8)*w]));}}
 assert.ok(tested>1000);assert.ok(guard.stats.affectedTriangles>0);
});
test('surface guard covers the building edge without distant miter spikes and retains sloped elevations',()=>{
 const b={points:[[0,0],[4,0],[4,4],[0,4],[0,0]]},guard=createRoadClearance([b],.6);
 assert.equal(guard.contains(.2,.2),true);assert.equal(guard.contains(-.3,2),true);assert.equal(guard.contains(-2,2),false);assert.equal(guard.contains(-100,100),false);
 const raw={positions:Float32Array.from([-2,-1,2,6,3,2,6,3,3,-2,-1,3]),indices:Uint32Array.from([0,1,2,0,2,3])},trim=guard.trim(raw);
 for(let i=0;i<trim.positions.length;i+=3)assert.ok(Math.abs(trim.positions[i+1]-trim.positions[i]*.5)<1e-6);
});

test('buffer clipping handles rectangular and octagonal edge polygons without dropping their final edges',()=>{const guard=createRoadClearance([{points:[[0,0],[4,0],[4,4],[0,4],[0,0]]}],.6);const raw={positions:Float32Array.from([-2,0,-2,6,0,-2,6,0,6,-2,0,6]),indices:Uint32Array.from([0,1,2,0,2,3])},trim=guard.trim(raw);for(let i=0;i<trim.indices.length;i+=3){let x=0,z=0;for(const n of trim.indices.slice(i,i+3)){x+=trim.positions[n*3]/3;z+=trim.positions[n*3+2]/3;}assert(!guard.contains(x,z),'trimmed triangle centroid stays outside the complete setback');}});
