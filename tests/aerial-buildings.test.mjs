import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {addAerialRoofDetails} from '../dist/aerial-buildings.js';
import {OBSERVED_GROUND_PATCHES} from '../dist/spatial-layout.js';
import {insidePolygon} from '../dist/navigation.js';
import {createSceneScope} from '../dist/scene-scope.js';
import {generateVegetationLayout} from '../dist/vegetation.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
test('whole-campus visibility restores every source building while retaining the original walking boundary',()=>{
 const before=JSON.stringify(data),s=createSceneScope(data,{allBuildings:true}),focused=createSceneScope(data);
 assert.equal(s.visibleData.buildings.length,data.buildings.length);
 assert.deepEqual(s.visibleData.buildings.map(b=>b.id),data.buildings.map(b=>b.id));
 for(const p of [[-440,350],[360,-220],[-67,-460],[-104,224]])assert.equal(s.alphaAt(...p),1);
 for(const p of [[-440,350],[-67,-460],[-104,224]])assert.equal(s.area.contains(...p),focused.area.contains(...p));
 assert.equal(JSON.stringify(data),before);
});
test('new rooftop equipment stays on its source roof and cannot alter a walking path',()=>{
 let count=0;
 for(const id of ['471297909','286237890','471697621']){
  const b=data.buildings.find(b=>b.id===id),pieces=[];
  const result=addAerialRoofDetails({scene:{},b,height:14,base:0,box(x,y,z,w,h,d){
   for(const n of [x,y,z,w,h,d])assert.ok(Number.isFinite(n));assert.ok(y>14);
   for(const [dx,dz]of [[-w/2,-d/2],[-w/2,d/2],[w/2,-d/2],[w/2,d/2]])assert.ok(insidePolygon(x+dx,z+dz,b.points));pieces.push([x,z]);
  }});count+=result.panels;assert.ok(pieces.length>0);
 }
 assert.ok(count>30);
});
test('reconstructed parking aprons remain free of generated forest trunks',()=>{
 const trees=generateVegetationLayout(data);
 for(const p of trees)assert.ok(!OBSERVED_GROUND_PATCHES.some(a=>insidePolygon(p.x,p.z,a.points)));
});
