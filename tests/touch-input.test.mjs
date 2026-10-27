import test from 'node:test';import assert from 'node:assert/strict';import {createTouchInput} from '../dist/touch-input.js';
test('move and run fingers stay independent of camera/jump release',()=>{const t=createTouchInput();assert(t.beginMove(3,1,0));assert(!t.beginMove(5));assert(t.beginRun(4));t.end(8);assert.equal(t.state.movePointer,3);assert(t.state.running);t.end(4);assert(!t.state.running);assert.equal(t.state.x,1);t.end(3);assert.equal(t.state.x,0);assert.equal(t.state.movePointer,null);});
test('dead zone and diagonal normalization prevent drift or faster diagonals',()=>{const t=createTouchInput();t.beginMove(1,.04,.05);assert.equal(t.state.x,0);assert.equal(t.state.y,0);t.move(1,2,2);assert(Math.abs(Math.hypot(t.state.x,t.state.y)-1)<1e-10);assert(!t.move(2,0,0));});
test('cancel/blur/menu reset releases all held inputs',()=>{const t=createTouchInput();t.beginMove(1,.8,0);t.beginRun(2);t.reset();assert.deepEqual(t.state,{movePointer:null,runPointer:null,x:0,y:0,running:false});});

test('a comfortable half throw gives almost full walking speed without losing fine control near centre',()=>{
 const t=createTouchInput();t.beginMove(1,0,.5);assert(Math.hypot(t.state.x,t.state.y)>.88);t.move(1,0,.55);assert.equal(t.state.y,1);t.move(1,.2,0);assert(t.state.x>0&&t.state.x<.3);t.move(1,.04,.04);assert.equal(Math.hypot(t.state.x,t.state.y),0);
});

test('tap-to-run stays on when movement/camera fingers lift and clears on menu or blur',()=>{
 const t=createTouchInput();assert.equal(t.toggleRun(),true);t.beginMove(7,0,.55);t.end(8);t.end(7);assert.equal(t.state.running,true);assert.equal(t.state.y,0);t.beginMove(9,0,.55);assert.equal(t.state.running,true);assert.equal(t.toggleRun(),false);assert.equal(t.state.y,1);t.toggleRun();t.reset();assert.equal(t.state.running,false);assert.equal(t.state.movePointer,null);
});
