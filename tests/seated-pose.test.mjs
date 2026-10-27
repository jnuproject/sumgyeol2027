import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {FBXLoader} from '../dist/vendor/FBXLoader.js';
import {createSeatedPose} from '../dist/seated-pose.js';
const parse=name=>{const b=fs.readFileSync(new URL('../dist/assets/characters/sumgyeol/'+name+'.fbx',import.meta.url));return new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
test('actual animated character sits above seat with bent knees and grounded feet at varying rotations and heights',()=>{
 const model=parse('character'),idle=parse('idle');model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),scale=1.78/bounds.getSize(new THREE.Vector3()).y;model.scale.multiplyScalar(scale);model.position.y=-bounds.min.y*scale;
 const body=new THREE.Group(),group=new THREE.Group();body.add(model);group.add(body);
 const mixer=new THREE.AnimationMixer(body),clip=idle.animations.find(c=>c.name.toLowerCase().endsWith('|idle')).clone();clip.tracks=clip.tracks.filter(t=>body.getObjectByName(t.name.slice(0,t.name.lastIndexOf('.'))));mixer.clipAction(clip).play();mixer.update(0);const pose=createSeatedPose(body);
 for(const size of [.96,1,1.04])for(const yaw of [0,Math.PI/2,Math.PI]){group.scale.setScalar(size);group.position.set(4,25,-8);body.rotation.y=yaw;pose.setSurface({seatY:25.34,floorY:25});
  for(let i=0;i<90;i++){mixer.update(1/30);pose.apply();const d=pose.diagnostics();assert.ok(Math.abs(d.hipY-25.34-.075*size)<1e-6);for(const foot of d.feet)assert.ok(foot[1]>25.04&&foot[1]<25.15,'ankles above floor');
   for(const side of ['Left','Right']){const a=body.getObjectByName(side+'UpLeg').getWorldPosition(new THREE.Vector3()),knee=body.getObjectByName(side+'Leg').getWorldPosition(new THREE.Vector3()),foot=body.getObjectByName(side+'Foot').getWorldPosition(new THREE.Vector3());assert.ok((knee.z-a.z)*Math.cos(yaw)+(knee.x-a.x)*Math.sin(yaw)>.16,'knees point forward');assert.ok(Math.abs(knee.x-foot.x)<.025&&Math.abs(knee.z-foot.z)<.025,'shins hang vertically');}
  }
 }
});
