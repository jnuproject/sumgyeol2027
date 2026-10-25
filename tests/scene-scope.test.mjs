import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSceneScope,cropSceneGeometry,VISIBLE_BUILDING_IDS,CONTEXT_BUILDING_IDS} from '../dist/scene-scope.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)));
test('three focus zones retain only their four named immediate neighbours, without mutating source data',()=>{
 const before=JSON.stringify(data),s=createSceneScope(data);
 assert.deepEqual(s.visibleData.buildings.map(b=>b.id).sort(),[...VISIBLE_BUILDING_IDS,...CONTEXT_BUILDING_IDS].sort());
 assert.equal(s.visibleData.areas.some(a=>a.tags.sport||['pitch','track'].includes(a.tags.leisure)),false);
 assert.equal(JSON.stringify(data),before);
});
test('all playable ground remains fully opaque while unselected distant campus geometry is discarded',()=>{
 const s=createSceneScope(data);
 for(const p of[[-67,-460],[-44,87.6],[-107.5,160],[-104,224],[-110,-21]])assert.equal(s.alphaAt(...p),1);
 for(const p of[[-400,350],[360,-220]])assert.equal(s.alphaAt(...p),0);
 const raw={positions:new Float32Array([-400,0,350,-395,0,350,-400,0,355,-107,1,160,-105,1,160,-107,1,163]),indices:new Uint32Array([0,1,2,3,4,5])};
 const before=raw.positions.slice(),cropped=cropSceneGeometry(raw,s);assert.deepEqual(raw.positions,before);assert.equal(cropped.indices.length,3);assert.equal(cropped.positions.length,9);assert.ok([...cropped.colors].every(n=>n===1));
});
test('render margins fade continuously and trees stay out of hidden parts',()=>{
 const s=createSceneScope(data),r=s.area.regions.find(r=>r.id==='gate'),z=r.minZ+5;
 const values=[0,35,45,55,65,75,85].map(offset=>s.alphaAt(r.minX-offset,z));
 assert.equal(values[0],1);assert.equal(values.at(-1),0);for(let i=1;i<values.length;i++)assert.ok(values[i]<=values[i-1]);
 assert.equal(s.treeVisible(-400,350),false);
});
