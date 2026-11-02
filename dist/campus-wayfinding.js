import * as THREE from './three.module.js';
import {insidePolygon,segmentDistance} from './navigation.js';
import {roadWidthAt,isWalkingRoad} from './road-profile.js';
import {batchStaticMeshes} from './static-mesh-batches.js';
export const CAMPUS_WAYFINDING=[
 {id:'gate',x:-52,z:-445,title:'아라캠퍼스',lines:['↑ 학생회관 · 대운동장','↑ 중앙도서관']},
 {id:'north-lawns',x:-66,z:-265,title:'캠퍼스 산책',lines:['↑ 학생회관 · 중앙도서관','↓ 박물관 · 정문']},
 {id:'gym-crossing',x:-66,z:-144,title:'대운동장 가는 길',lines:['← 체육관 · 대운동장','↑ 학생회관 · 연못']},
 {id:'student-front',x:-66,z:-8,title:'학생회관',lines:['← 학생회관 · 연못','↑ 경상대학 · 중앙도서관']},
 {id:'economics',x:-64,z:82,title:'경상대학',lines:['↑ 중앙도서관','↓ 학생회관 · 정문']},
 {id:'library-ascent',x:-68,z:177,title:'중앙도서관',lines:['↑ 도서관 올라가는 길','↓ 경상대학 · 학생회관']},
 {id:'bank-junction',x:-172,z:-84.5,title:'대운동장',lines:['← 축제장 입구','↓ 연못 · 학생회관']},
 {id:'pond-junction',x:-169,z:-29,title:'연못 산책길',lines:['← 대운동장','→ 학생회관 입구']}
];
export function wayfindingPlacements(data,heightAt,obstacles=[],anchors=[]){
 return CAMPUS_WAYFINDING.filter(s=>{
  if(data.buildings.some(b=>insidePolygon(s.x,s.z,b.points)||b.points.some((p,i)=>i&&segmentDistance(s.x,s.z,b.points[i-1],p)<1.3)))return false;
  if(data.roads.some(r=>!isWalkingRoad(r)&&r.points.some((p,i)=>i&&segmentDistance(s.x,s.z,r.points[i-1],p)<roadWidthAt(r,s.x,s.z)/2+.65)))return false;
  return Number.isFinite(heightAt(s.x,s.z))&&obstacles.every(o=>Math.hypot(s.x-o[0],s.z-o[1])>o[2]+.8)&&anchors.every(a=>Math.hypot(s.x-a[0],s.z-a[1])>3.5);
 });
}
export function createCampusWayfinding({scene,data,heightAt,avatar,obstacles=[],cameraCollisionMeshes=[],anchors=[]}){
 const placements=wayfindingPlacements(data,heightAt,obstacles,anchors),root=new THREE.Group();root.name='Campus wayfinding';scene.add(root);
 const steel=new THREE.MeshStandardMaterial({color:'#4d625f',roughness:.85}),stone=new THREE.MeshStandardMaterial({color:'#737b70',roughness:1});
 // All sign faces share one atlas and one material; no individual texture loads.
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256*Math.max(1,placements.length);const g=canvas.getContext('2d');
 placements.forEach((s,i)=>{const y=i*256;g.fillStyle='#edf0e5';g.fillRect(0,y,1024,256);g.fillStyle='#00a7cd';g.fillRect(0,y,15,256);if(avatar?.symbolImage)g.drawImage(avatar.symbolImage,42,y+30,80,80);g.fillStyle='#22565f';g.font='700 49px Pretendard,sans-serif';g.fillText(s.title,150,y+72);g.font='36px Pretendard,sans-serif';s.lines.forEach((line,j)=>g.fillText(line,150,y+145+j*59));});
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;const faceMat=new THREE.MeshStandardMaterial({map:texture,roughness:.9,side:THREE.DoubleSide});
 placements.forEach((s,i)=>{const y=heightAt(s.x,s.z),yaw=-Math.PI/2;
  for(const dz of[-.64,.64]){const p=new THREE.Mesh(new THREE.BoxGeometry(.07,1.65,.07),steel);p.position.set(s.x,y+.825,s.z+dz);root.add(p);}
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,1.7),stone);foot.position.set(s.x,y+.07,s.z);root.add(foot);
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.9,.58,.08),steel);board.position.set(s.x,y+1.56,s.z);board.rotation.y=yaw;root.add(board);
  const geo=new THREE.PlaneGeometry(1.84,.53),uv=geo.attributes.uv;for(let v=0;v<uv.count;v++)uv.setY(v,1-(i+1-uv.getY(v))/Math.max(1,placements.length));
  const face=new THREE.Mesh(geo,faceMat);face.position.set(s.x-.045,y+1.56,s.z);face.rotation.y=yaw;root.add(face);obstacles.push([s.x,s.z,.95]);
 });
 const batching=batchStaticMeshes(root,512);root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh)cameraCollisionMeshes.push(o);});return {count:placements.length,placements:placements.map(({id,x,z})=>({id,x,z})),batching};
}
