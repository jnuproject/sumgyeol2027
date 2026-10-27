import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCampusWalkArea,createFocusWalkArea,safeFocusPosition} from '../dist/walk-area.js';
import {walkable} from '../dist/navigation.js';
import {advancePlanarMotion,walkSpeed} from '../dist/movement.js';
import {simulationDelta} from '../dist/mobile-performance.js';
import {createTouchInput} from '../dist/touch-input.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url))),bounds={minX:-550,maxX:530,minZ:-600,maxZ:450};

test('free exploration crosses the former tour boundary while still rejecting walls and invalid map coordinates',()=>{
 const focus=createFocusWalkArea(data),campus=createCampusWalkArea(bounds);
 for(const p of [[-235,-45],[-79,400],[300,-200]]){assert.equal(focus.contains(...p),false);assert.equal(campus.contains(...p),true);}
 assert.equal(campus.restricted,false);assert.deepEqual(campus.outline(),[]);
 assert.equal(campus.contains(NaN,0),false);assert.equal(campus.contains(0,Infinity),false);assert.equal(campus.contains(-550,0),false);
 const b=data.buildings.find(b=>b.id==='953564621');assert.equal(campus.contains(...b.center),true);assert.equal(walkable(...b.center,data.buildings),false,'building collision still blocks an otherwise open area');
 const start=safeFocusPosition([-235,-45],campus,(x,z)=>walkable(x,z,data.buildings));assert.ok(start&&campus.contains(...start)&&walkable(...start,data.buildings));
});

test('phone walking and running cover the same distance at 5fps and 60fps, including acceleration and release',()=>{
 for(const running of [false,true]){
  const distances=[];
  for(const fps of [5,10,15,30,60]){
   let v={x:0,z:0},distance=0;const touch=createTouchInput();touch.beginMove(1,0,.55);const speed=walkSpeed({touch:true,running});
   for(let i=0;i<fps*3;i++){const moving=i<fps*2,target={x:0,z:moving?touch.state.y*speed:0},m=advancePlanarMotion(v,target,simulationDelta(1/fps),moving);v=m;distance+=m.dz;}
   distances.push(distance);assert.ok(distance>(running?38:17),'new rate remains brisk after starting/stopping');
  }
  assert.ok(Math.max(...distances)-Math.min(...distances)<1e-7,'render frame rate cannot change traversal distance');
 }
 assert.equal(walkSpeed({touch:true}),9);assert.equal(walkSpeed({touch:true,running:true}),20);assert.equal(walkSpeed(),7);assert.equal(walkSpeed({running:true}),16);
});
