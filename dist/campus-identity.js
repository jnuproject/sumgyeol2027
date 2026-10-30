import * as THREE from './three.module.js';
import {insidePolygon} from './navigation.js';

// OSM building identities, with earlier user/reference corrections retained.
// Sign mounting positions and dimensions are visual estimates, not surveyed.
export const IDENTIFIED_BUILDINGS=new Set(['286070805','286070813','286070815','286085051','286237890','471297909','471297922','471377429','471490497','471697017','482676134','953800279']);
export function identityFace(b,height){
 const target=b.id==='286237890'?[b.center[0],212]:[-85,b.center[1]],edges=[];
 for(let i=1;i<b.points.length;i++){
  const a=b.points[i-1],p=b.points[i],dx=p[0]-a[0],dz=p[1]-a[1],length=Math.hypot(dx,dz);if(length<9)continue;
  const x=(a[0]+p[0])/2,z=(a[1]+p[1])/2;let nx=dz/length,nz=-dx/length;
  if(insidePolygon(x+nx*.25,z+nz*.25,b.points)){nx=-nx;nz=-nz;}
  const vx=target[0]-x,vz=target[1]-z,facing=(nx*vx+nz*vz)/(Math.hypot(vx,vz)||1);if(facing<.35)continue;
  edges.push({x:x+nx*.46,z:z+nz*.46,y:height-.95,yaw:Math.atan2(nx,nz),width:Math.min(length*.75,Math.max(4,b.name.length*.63)),score:facing*length});
 }return edges.sort((a,b)=>b.score-a.score)[0]??null;
}
export function createBuildingIdentity(data){
 const buildings=data.buildings.filter(b=>IDENTIFIED_BUILDINGS.has(b.id)&&b.name),size=1024,row=128,canvas=document.createElement('canvas');canvas.width=size;canvas.height=2048;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,size,2048);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 68px Pretendard, sans-serif';ctx.fillStyle='#263d42';
 buildings.forEach((b,i)=>ctx.fillText(b.name.replace('제주대학교 ',''),size/2,i*row+row/2,960));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const signs=[];
 return {signs,add(scene,b,height,base){
  const index=buildings.findIndex(v=>v.id===b.id);if(index<0)return;const face=identityFace(b,height);if(!face)return;
  const geometry=new THREE.PlaneGeometry(face.width,.8),uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setY(i,1-(index+1-uv.getY(i))*row/2048);
  const sign=new THREE.Mesh(geometry,material);sign.name='Building name · '+b.name;sign.position.set(face.x,base+face.y,face.z);sign.rotation.y=face.yaw;scene.add(sign);signs.push({id:b.id,name:b.name,...face});
 }};
}
