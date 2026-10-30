import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {createMascotPopulation} from '../dist/mascot-population.js';
import {createWindMascotFactory,MASCOT_KINDS} from '../dist/wind-mascot.js';

test('all population roles use five distinct nonhuman species, including legacy student options',()=>{
 const scene=new THREE.Scene(),population=createMascotPopulation(scene,{kind:'citrus'}),species=new Set();
 assert.equal(population.metadata.species,'citrus');
 for(let i=0;i<20;i++){const a=population.createCompanion(scene,{student:true,variant:i,seated:i%3===0});species.add(a.metadata.species);assert.equal(a.metadata.humanoid,false);a.group.traverse(o=>assert.ok(!o.isSkinnedMesh));}
 assert.equal(species.size,5);assert.equal(population.populationMetadata().humanCharacters,0);
 assert.equal(population.createCompanion(scene,{speciesIndex:2}).metadata.species,'stone');
 assert.equal(createMascotPopulation(new THREE.Scene(),{kind:'human'}).metadata.species,'wind');
});
test('each species sits on the actual bench seat with feet ahead of it, above the floor',()=>{
 for(const {id}of MASCOT_KINDS){const a=createWindMascotFactory({kind:id}).create(new THREE.Scene(),{seated:true});
  for(const size of [.9,1,1.1])for(const yaw of [0,Math.PI/2,Math.PI]){
   a.group.position.set(4,25,-8);a.group.scale.setScalar(size);a.body.rotation.y=yaw;a.setSeat({seatY:25.34,floorY:25});a.setWalking(true);
   for(let i=0;i<20;i++){a.update(.05);const d=a.seatDiagnostics();assert.ok(Math.abs(d.hipY-25.34)<1e-8,id+' body rests on seat');assert.equal(a.metadata.animation,'seated');for(const p of d.feet){assert.ok(p[1]>25.1&&p[1]<25.5);const forward=(p[0]-4)*Math.sin(yaw)+(p[2]+8)*Math.cos(yaw);assert.ok(forward>.48,id+' feet beyond seat front');}}
  }
 }
});
test('far-away characters share a one-draw coloured LOD and restore their animated faces',()=>{
 for(const {id}of MASCOT_KINDS){const f=createWindMascotFactory({kind:id}),a=f.create(new THREE.Scene()),b=f.create(new THREE.Scene());a.setDetail(false);b.setDetail(false);a.update(.1);b.update(.1);
  const visible=[];a.body.traverseVisible(o=>{if(o.isMesh)visible.push(o);});assert.equal(visible.length,1);assert.ok(visible[0].geometry.attributes.color);
  assert.equal(a.body.children[1].geometry,b.body.children[1].geometry);assert.equal(a.shadow.visible,false);
  a.setDetail(true);assert.equal(a.body.getObjectByName('Blinking eyes').parent.visible,true);assert.equal(a.body.children[1].visible,false);
 }
});
test('every species keeps animation in the visual rig and finite geometry',()=>{
 for(const {id}of MASCOT_KINDS){const a=createWindMascotFactory({kind:id}).create(new THREE.Scene());a.group.position.set(2,7,3);
  for(let i=0;i<100;i++){a.update(.03,{speed:16,grounded:i%3!==0});assert.deepEqual(a.group.position.toArray(),[2,7,3]);a.group.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(a.body).min.y>=6.99);}
  a.body.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
 }
});
