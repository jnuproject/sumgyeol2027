import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FOCUS_SCOPE,resolveFocusStops} from '../dist/focus-route.js';
import {safePosition,walkable} from '../dist/navigation.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
test('focused walking starts and library arrival stay outside preserved building walls',()=>{
 const snapshot=JSON.stringify(data);const stops=resolveFocusStops(data,[-67.135,-460.403]);
 for(const stop of stops){
  for(const p of [stop.walkPosition,stop.visitPosition,...(stop.arrival?[stop.arrival.position]:[])]){
   assert.equal(walkable(...p,data.buildings),true,stop.id+' walking start inside building');
   assert.deepEqual(safePosition(p,data.buildings),p);
   assert.ok(p[0]>=FOCUS_SCOPE.mapBounds.minX&&p[0]<=FOCUS_SCOPE.mapBounds.maxX);
   assert.ok(p[1]>=FOCUS_SCOPE.mapBounds.minZ&&p[1]<=FOCUS_SCOPE.mapBounds.maxZ);
  }
 }
 assert.equal(JSON.stringify(data),snapshot,'focus selection must not alter source geometry');
});
test('the ascent highlights source streets and the recorded stair connection',()=>{
 for(const id of FOCUS_SCOPE.roadIds)assert.ok(data.roads.some(r=>r.id===id));
 const stairs=data.roads.find(r=>r.id==='471489721');assert.equal(stairs.tags.highway,'steps');
 for(const id of FOCUS_SCOPE.buildingIds)assert.ok(data.buildings.some(b=>b.id===id));
 assert.throws(()=>resolveFocusStops({...data,buildings:[]}),/Missing focus building/);
});
