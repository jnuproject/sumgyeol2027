import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/three.module.js';
import {addMuseumForecourt,MUSEUM_WALKS} from '../dist/museum-forecourt.js';
import {applySatelliteLayout} from '../dist/satellite-layout.js';
import {prepareCampusRoads} from '../dist/road-clearance.js';
import {MAIN_AVENUE_SIDEWALK_WIDTH,roadSidewalkWidthAt} from '../dist/road-profile.js';
import {segmentDistance,walkable} from '../dist/navigation.js';
const data=prepareCampusRoads(applySatelliteLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url)))));
test('museum entrance approach remains open between its benches, sign and bollards',()=>{
 const scene=new THREE.Scene(),obstacles=[],terrain={heightAt:(x,z)=>x*.012+z*.01},surfaces={redPaving:new THREE.MeshStandardMaterial()};
 const box=(x,y,z,w,h,d,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y+terrain.heightAt(x,z),z);scene.add(m);return m;};
 const result=addMuseumForecourt({scene,data,terrain,environment:{polygon(){},segment(){}},surfaces,box,obstacles});
 assert.equal(result.seats,6);assert.equal(result.informationStone,1);assert.equal(result.bollards,8);
 const points=MUSEUM_WALKS[0].points;
 for(let i=1;i<points.length;i++)for(let j=0;j<=30;j++){
  const t=j/30,x=points[i-1][0]*(1-t)+points[i][0]*t,z=points[i-1][1]*(1-t)+points[i][1]*t;
  if(x>-26.5)continue;
  assert.ok(walkable(x,z,data.buildings));assert.ok(obstacles.every(o=>Math.hypot(x-o[0],z-o[1])>o[2]+.55));
 }
 scene.traverse(o=>{if(o.isMesh){assert.ok(o.position.toArray().every(Number.isFinite));assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));}});
});
test('wider sidewalks retain the straight four-lane avenue and keep entry obstacles outside the carriageway',()=>{
 const main=data.roads.find(r=>r.id==='286085067');assert.equal(MAIN_AVENUE_SIDEWALK_WIDTH,5.8);
 for(const p of main.points){assert.equal(p[0],-85);assert.equal(roadSidewalkWidthAt(main,...p),5.8);}
 assert.equal(roadSidewalkWidthAt(data.roads.find(r=>r.id==='93690444'),-85,82),5.8);
});
