import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {applySatelliteLayout,satellitePoint} from '../dist/satellite-layout.js';
import {applyStudentHallReference} from '../dist/student-hall-garden.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
import {campusCrossings,splitCrossingMarking,inCrossingApproach,avenueFixtures,addCampusCrossings} from '../dist/campus-streets.js';
import {identityFace,IDENTIFIED_BUILDINGS} from '../dist/campus-identity.js';
import {createFocusWalkArea} from '../dist/walk-area.js';
import {addWalkBoundary} from '../dist/walk-boundary.js';
import {insidePolygon,walkable,segmentDistance} from '../dist/navigation.js';
import {roadWidthAt,isWalkingRoad} from '../dist/road-profile.js';
const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url))))));

test('seven aerial crossing stations follow the straight four-lane avenue and remain traversable',()=>{
 const crossings=campusCrossings(data),area=createFocusWalkArea(data);assert.equal(crossings.length,7);
 for(const c of crossings){assert.equal(c.x,-85);assert.equal(c.width,18);assert.equal(c.z,satellitePoint(c.frame,c.pixel)[1]);
  for(let x=c.x-13;x<=c.x+13;x+=.5){assert(area.contains(x,c.z));assert(walkable(x,c.z,data.buildings));}
 }
 const polygons=[];addCampusCrossings({data,environment:{polygon(points,material,offset,kind){polygons.push({points,offset,kind});},segment(){}},paint:{},tactile:{}});
 assert(polygons.length>80);for(const p of polygons){assert(p.points.flat().every(Number.isFinite));assert.equal(p.kind,'road');assert(p.offset>.08&&p.offset<=.16);}
});
test('lane dividers have real gaps at crossings in both travel directions without erasing side-road paint',()=>{
 const crossings=campusCrossings(data);
 for(const [a,b]of[[[-85,-460],[-85,60]],[[-85,60],[-85,-460]]]){
  const segments=splitCrossingMarking(a,b,crossings);assert.equal(segments.length,8);
  for(const [p,q]of segments)for(let i=1;i<20;i++){const z=p[1]+(q[1]-p[1])*i/20;assert(crossings.every(c=>Math.abs(z-c.z)>=c.depth/2+.249));}
 }
 assert.deepEqual(splitCrossingMarking([0,-460],[0,60],crossings),[[[0,-460],[0,60]]]);
 assert.deepEqual(splitCrossingMarking([-86,crossings[0].z],[-84,crossings[0].z],crossings),[]);
});
test('avenue lamps avoid buildings, side streets and crossing approaches and continue beyond the gym',()=>{
 const fixtures=avenueFixtures(data),crossings=campusCrossings(data);assert(fixtures.length>15);assert(fixtures.some(p=>p.z>30));
 for(const p of fixtures){assert(walkable(p.x,p.z,data.buildings,.8));assert(!inCrossingApproach(-85,p.z,crossings));assert(Math.abs(p.drainX+85)<9);
  for(const r of data.roads.filter(r=>!['286085067','93690444'].includes(r.id)&&!isWalkingRoad(r)))for(let i=1;i<r.points.length;i++)assert(segmentDistance(p.x,p.z,r.points[i-1],r.points[i])>=roadWidthAt(r,p.x,p.z)/2+1.5);
 }
});
test('building names face away from their footprint toward the avenue or library forecourt',()=>{
 const targets=data.buildings.filter(b=>IDENTIFIED_BUILDINGS.has(b.id));assert.equal(targets.length,12);
 for(const b of targets){const face=identityFace(b,12);assert(face,b.name);assert(!insidePolygon(face.x,face.z,b.points),b.name);assert(Object.values(face).every(Number.isFinite));assert(face.width>=4);}
});
test('boundary guide drapes onto terrain and only appears during walking',()=>{
 const scene=new THREE.Scene(),area=createFocusWalkArea(data),guide=addWalkBoundary(scene,area,(x,z)=>z*.03+x*.01),line=scene.children[0];
 assert.equal(area.restricted,true);assert.equal(line.visible,false);assert(guide.edges.length>100);
 const p=line.geometry.attributes.position;for(let i=0;i<p.count;i++)assert(Math.abs(p.getY(i)-(p.getZ(i)*.03+p.getX(i)*.01+.065))<.00001);
 guide.update(-97,-200,true);assert.equal(line.visible,true);assert.deepEqual(line.material.uniforms.walker.value.toArray(),[-97,-200]);guide.update(0,0,false);assert.equal(line.visible,false);
});
