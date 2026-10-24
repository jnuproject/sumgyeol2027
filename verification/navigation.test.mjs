import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {insidePolygon,segmentDistance,walkable,safePosition} from '../dist/navigation.js';
const square=[[0,0],[10,0],[10,10],[0,10],[0,0]];
test('polygon containment keeps interior walls solid',()=>{
 assert.equal(insidePolygon(5,5,square),true);assert.equal(insidePolygon(-2,5,square),false);
 assert.equal(walkable(5,5,[square]),false);
});
test('player radius rejects edges and corners without blocking distant paths',()=>{
 assert.equal(walkable(-.3,5,[square]),false);assert.equal(walkable(-1,5,[square]),true);
 assert.equal(walkable(-.3,-.3,[square]),false);assert.equal(walkable(-1,-1,[square]),true);
});
test('degenerate segments remain safe and finite',()=>{
 assert.equal(segmentDistance(3,4,[0,0],[0,0]),5);
 assert.equal(segmentDistance(5,5,[0,0],[10,0]),5);
});
test('recovery never spawns a player inside a building',()=>{
 const safe=safePosition([5,5],[square]);assert.ok(safe);assert.equal(walkable(...safe,[square]),true);
 assert.deepEqual(safePosition([-4,-4],[square]),[-4,-4]);
});
test('all three original landmark spawn points are collision-safe',()=>{
 const d=JSON.parse(readFileSync(new URL('../dist/campus-data.json',import.meta.url),'utf8'));
 assert.equal(d.buildings.length,59);assert.equal(d.roads.length,91);assert.equal(d.areas.length,35);
 for(const landmark of d.landmarks){const safe=safePosition(landmark.position,d.buildings);assert.ok(safe);assert.equal(walkable(...safe,d.buildings),true);}
});
