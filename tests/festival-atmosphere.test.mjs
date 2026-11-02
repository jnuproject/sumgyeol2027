import test from 'node:test';import assert from 'node:assert/strict';import {createFestivalAtmosphere} from '../dist/festival-atmosphere.js';
const layout={center:[-237,-45]};
function settle(state,args,seconds=6,dt=1/60){let value;for(let i=0;i<seconds/dt;i++)value=state.update(dt,args);return value;}
test('entering the stadium fades to festival night and leaving restores daytime without changing the manual preference',()=>{
 const a=createFestivalAtmosphere(layout),outside={position:{x:-170,z:-89}},inside={position:{x:-210,z:-89}};
 assert.equal(settle(a,outside).nightMix,0);const first=a.update(.016,inside);assert.equal(first.active,true);assert.ok(first.nightMix>0&&first.nightMix<.1);
 assert.ok(settle(a,inside).nightMix>.99);assert.equal(a.sample().entries,1);const exit=a.update(.016,outside);assert.equal(exit.active,false);assert.ok(exit.nightMix>.9);assert.ok(settle(a,outside).nightMix<.01);
});
test('gate hysteresis prevents jitter and the north/south oval caps do not trigger outside the stadium',()=>{
 const a=createFestivalAtmosphere(layout);a.update(.1,{position:{x:-186,z:-45}});for(let i=0;i<100;i++)assert.equal(a.update(.016,{position:{x:-237+54+(i%2),z:-45}}).active,true);assert.equal(a.sample().entries,1);
 assert.equal(a.update(.1,{position:{x:-178,z:-45}}).active,false);assert.equal(a.update(.1,{position:{x:-182,z:-45}}).active,false);
 assert.equal(a.update(.1,{position:{x:-237,z:60}}).active,false);assert.equal(a.update(.1,{position:{x:-237,z:35}}).active,true);
});
test('manual evening survives a festival visit and menu or invalid locations release the automatic override',()=>{
 const a=createFestivalAtmosphere(layout),inside={position:{x:-237,z:-45},manualNight:true};settle(a,inside);const exit=settle(a,{position:{x:0,z:0},manualNight:true});assert.equal(exit.active,false);assert.ok(exit.mix<.01);assert.equal(exit.nightMix,1);
 a.update(.1,inside);assert.equal(a.update(.1,{...inside,walking:false}).active,false);assert.equal(a.update(.1,{position:{x:NaN,z:0}}).active,false);assert.equal(createFestivalAtmosphere(null).update(.1,inside).active,false);
});
test('transition is frame-rate independent and reduced motion shortens the fade without flashing',()=>{
 const args={position:{x:-237,z:-45}},fast=createFestivalAtmosphere(layout),slow=createFestivalAtmosphere(layout);
 const a=settle(fast,args,2,1/60),b=settle(slow,args,2,.2);assert.ok(Math.abs(a.mix-b.mix)<.001);
 const reduced=settle(createFestivalAtmosphere(layout),{...args,reducedMotion:true},1,1/60);assert.ok(reduced.mix>.97);assert.ok(a.mix<.9);
});
