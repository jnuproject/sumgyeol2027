import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {conversationShot} from '../dist/conversation-camera.js';
import {createCampusLife} from '../dist/campus-life.js';
import {applySatelliteLayout} from '../dist/satellite-layout.js';
import {applyStudentHallReference} from '../dist/student-hall-garden.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
import {createFocusWalkArea} from '../dist/walk-area.js';
import {walkable,segmentDistance} from '../dist/navigation.js';
import {isWalkingRoad,roadWidthAt} from '../dist/road-profile.js';
test('conversation camera centres the face above the text for different approach directions and screen shapes',()=>{
 for(const aspect of [16/9,9/16])for(let a=0;a<Math.PI*2;a+=Math.PI/4){
  const face=[-96.9,26.9,-18],player=[face[0]+Math.cos(a)*3,25.27,face[2]+Math.sin(a)*3];
  const shot=conversationShot(face,player,{aspect}),camera=new THREE.PerspectiveCamera(58,aspect,.12,100);
  camera.position.fromArray(shot.position);camera.lookAt(new THREE.Vector3(...shot.target));camera.updateMatrixWorld(true);
  const projected=new THREE.Vector3(...face).project(camera);
  assert.ok(Math.abs(projected.x)<1e-10);assert.ok(projected.y>.05&&projected.y<.3,'face remains above centre and clear of the bottom panel');
  assert.ok(Math.hypot(shot.position[0]-face[0],shot.position[2]-face[2])<1.8);
  assert.ok(shot.position.every(Number.isFinite));
 }
 const close=conversationShot([0,1.6,0],[0,0,0]);assert.ok(close.position.every(Number.isFinite));
 const blocked=conversationShot([0,1.6,0],[0,0,3],{canStand:(x,z)=>z<=1.3});assert.ok(blocked.position[2]<=1.3);
});
test('living scenes keep furniture and walking students out of carriageways and building walls',()=>{
 const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)))))),area=createFocusWalkArea(data),obstacles=[];
 const canStand=(x,z)=>area.contains(x,z)&&walkable(x,z,data.buildings)&&obstacles.every(p=>Math.hypot(x-p[0],z-p[1])>p[2]+.4);
 const avatar={createCompanion(scene){const group=new THREE.Group(),body=new THREE.Group();group.add(body);scene.add(group);return {group,body,update(){},setWalking(){}};}};
 const scene=new THREE.Scene(),life=createCampusLife({scene,data,avatar,groundAt:()=>0,canStand,obstacles,cameraCollisionMeshes:[],anchors:[[-72.55,-476.403],[-47,87.6],[-96.9,-18]]});
 const result=life.metadata();assert.ok(result.students>=70,'population extends beyond the three original encounters');assert.ok(result.seated>=10);assert.ok(result.walkers>=25);assert.ok(result.brandedElements>=20);assert.ok(result.fixtures.some(f=>f.kind==='sumgyeol-shelter'));assert.ok(result.fixtures.some(f=>f.kind==='sumgyeol-message'));
 assert.ok(result.passersBy.some(p=>p.path[0][1]<-350)&&result.passersBy.some(p=>p.path[1][1]>100),'pedestrians occupy the connecting avenue, not just NPC corners');
 assert.ok(result.fixtures.filter(f=>f.position[0]>-68&&f.position[0]<-25&&f.position[1]>86&&f.position[1]<88.65).length>=2,'economics furniture stays on paving in front of the observed hedge');
 for(const f of result.fixtures){assert.ok(walkable(...f.position,data.buildings));assert.ok(!data.roads.some(r=>!isWalkingRoad(r)&&r.points.some((p,i)=>i&&segmentDistance(...f.position,r.points[i-1],p)<roadWidthAt(r,...f.position)/2)));}
 const attendant=life.takeBoothAttendant('student-hall');assert.ok(attendant,'student forecourt booth has an attendant');assert.ok(attendant.center[0]<-106.5&&attendant.center[0]>-112);assert.ok(attendant.position[0]<attendant.center[0]&&attendant.front[0]>attendant.center[0],'staff is behind the counter and player approaches its front');assert.equal(life.takeBoothAttendant('student-hall'),null,'attendant can be promoted only once');assert.equal(attendant.person.group.parent,scene);
 const walking=[];scene.traverse(o=>{if(o.name==='Student walking on pedestrian route')walking.push(o);if(o.name==='Student chatting')for(const p of [[-72.55,-483.403],[-44,87.6],[-96.9,-21]])assert.ok(Math.hypot(o.position.x-p[0],o.position.z-p[1])>1.5,'background students leave player spawns clear');});const initial=walking.map(o=>o.position.clone());
 for(let i=0;i<600;i++){
  life.update(1/30,{mode:'walk',focus:new THREE.Vector3(-70,0,-150),player:new THREE.Vector3(-250,0,-250)});
  for(const person of walking){assert.ok(walkable(person.position.x,person.position.z,data.buildings));assert.ok(area.contains(person.position.x,person.position.z));}
 }
 assert.ok(walking.some((o,i)=>o.position.distanceTo(initial[i])>1),'at least one passer-by really moves');
 assert.ok(life.metadata().visibleStudents<=life.metadata().visibleLimit,'the enlarged population respects the render budget');
});
