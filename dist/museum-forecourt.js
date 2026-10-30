import * as THREE from './three.module.js';
import {insidePolygon} from './navigation.js';
import {MAIN_AVENUE_WIDTH,MAIN_AVENUE_SIDEWALK_WIDTH} from './road-profile.js?v=realism-r51';

// Three user-supplied March2026 Roadview screenshots. Dimensions are estimated;
// phone controls, advertisement and miniature map are not scene features.
export const MUSEUM_WALKS=[{id:'museum-front-entrance',width:4.8,surface:'red',points:[[-70.2,-420],[-58,-419.4],[-45,-418.8],[-25,-418]]}];
export const MUSEUM_TREES=[[-66,-437,12],[-64,-430,10.8],[-58,-408,12.5],[-61,-393,11.5],[-43,-439,11],[-41,-402,9.5],[-33,-430,8.8]].map(([x,z,h])=>({x,z,h,type:'park',areaId:'museum-reference'}));
export function addMuseumPhotoFacade({b,height,panel,box}){
 let windows=0;
 for(let i=1;i<b.points.length;i++){
  const a=b.points[i-1],e=b.points[i],dx=e[0]-a[0],dz=e[1]-a[1],length=Math.hypot(dx,dz);if(length<2)continue;
  const nx=dz/length,nz=-dx/length,out=insidePolygon((a[0]+e[0])/2+nx*.3,(a[1]+e[1])/2+nz*.3,b.points)?-1:1;
  const p=(t,y,w,h,d,c,offset=.2)=>panel(a,e,t,y,w,h,d,c,offset*out);
  const west=nx*out<-.8;
  for(let y=.9;y<height;y+=1.3)p(.5,y,length,.025,.12,'#665c58',.065);
  for(let t=.1;t<1;t+=Math.max(.08,5.5/length))p(t,height/2,.035,height,.13,'#6a605b',.075);
  if(west){
   const count=Math.max(2,Math.floor(length/6.4));
   for(const y of[3.0,7.8,12.7])for(let n=0;n<count;n++){
    const t=(n+.5)/count;p(t,y,1.55,2.08,.20,'#3b403b',.16);p(t,y,1.29,1.82,.25,'#a3b5af',.22);p(t,y-1.1,1.8,.16,.65,'#aaa99e',.35);windows++;
   }
   p(.5,height+.15,length+.5,.25,.9,'#665f59',.2);
  }
 }
 // The photographed entrance sits behind the broad pedestrian approach.
 const x=-24.75,z=-418;
 box(x-.16,2.15,z,.24,4.1,5.7,'#263d38');
 for(const dz of[-2.5,-1.25,0,1.25,2.5])box(x-.31,2.15,z+dz,.18,4.18,.09,'#b5bab0');
 box(x-1.1,4.48,z,2.5,.32,6.6,'#605e55');
 box(x-.40,1.05,z+3.2,.3,2.1,.45,'#b6baad');
 return {windows,source:'user Roadview screenshots2026-03'};
}
export function addMuseumForecourt({scene,data,terrain,environment,surfaces,box,obstacles}){
 const axis=data.renderRoadCorrections?.mainAvenue?.axisX??data.spawn[0],edge=axis+MAIN_AVENUE_WIDTH/2;
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.93});
 const basalt=mat('#555e53'),paint=mat('#e3e3d7');
 // Red sidewalk and entrance crossing visible in all three reference views.
 environment.polygon([[edge,-446],[edge+MAIN_AVENUE_SIDEWALK_WIDTH,-446],[edge+MAIN_AVENUE_SIDEWALK_WIDTH,-386],[edge,-386]],surfaces.redPaving,.16,'road');
 environment.polygon([[axis-9,-422],[axis+9,-422],[axis+9,-418],[axis-9,-418]],surfaces.redPaving,.096,'road');
 for(let dx=-8.2;dx<8.4;dx+=1.4)environment.polygon([[axis+dx,-421.7],[axis+dx+.65,-421.7],[axis+dx+.65,-418.3],[axis+dx,-418.3]],paint,.112,'road');
 // Shallow basalt seats follow the sides of the walk, leaving its centre open.
 for(const x of[-59,-50,-41])for(const z of[-424,-413.4]){
  box(x,.25,z,1.5,.50,.58,'#4d554b');for(const dx of[-.46,.46])box(x+dx,.14,z,.21,.28,.40,'#434a40');
  obstacles.push([x,z,.76]);
 }
 let bollards=0;
 for(const z of[-439,-434,-429,-425,-415,-410,-405,-400]){
  const x=edge+.75;box(x,.45,z,.12,.9,.12,'#344c5a');box(x,.79,z,.15,.11,.15,'#cdb45c');box(x,.92,z,.20,.09,.20,'#424b47');obstacles.push([x,z,.16]);bollards++;
 }
 // Broad, low tree pits and dark basalt blocks sit under the mature crowns.
 for(const p of MUSEUM_TREES){
  const ring=Array.from({length:18},(_,i)=>[p.x+Math.cos(i*Math.PI/9)*1.15,p.z+Math.sin(i*Math.PI/9)*1.15]);
  for(let i=0;i<ring.length;i++)environment.segment(ring[i],ring[(i+1)%ring.length],.16,basalt,.13);
 }
 const markerX=-62,markerZ=-410.5;
 box(markerX,.72,markerZ,.62,1.44,2.2,'#7a8073');box(markerX,.15,markerZ,1.15,.30,2.7,'#666e61');
 const plaque=box(markerX-.34,1.05,markerZ,.10,.97,1.68,'#d3d6c6');
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=512;c.height=384;const ctx=c.getContext('2d');ctx.fillStyle='#d8dbce';ctx.fillRect(0,0,512,384);
  const xs=data.boundary.map(p=>p[0]),zs=data.boundary.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),scale=210/Math.max(maxX-minX,maxZ-minZ);
  ctx.strokeStyle='#536b54';ctx.lineWidth=4;ctx.beginPath();data.boundary.forEach((p,i)=>{const x=140+(p[0]-minX)*scale,y=35+(p[1]-minZ)*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.stroke();ctx.fillStyle='#455848';ctx.font='500 33px sans-serif';ctx.textAlign='center';ctx.fillText('제주대학교 박물관',256,329);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.68,.97),new THREE.MeshStandardMaterial({map:tex,roughness:1}));face.position.set(markerX-.405,terrain.heightAt(markerX,markerZ)+1.05,markerZ);face.rotation.y=-Math.PI/2;face.name='Museum stone information plaque';scene.add(face);
 }
 obstacles.push([markerX,markerZ,1.1]);
 // Groundcover among the stone seats, with no recolouring of the open lawns.
 const plants=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat('#3d5539'),36),o=new THREE.Object3D();
 for(let i=0;i<36;i++){const x=-67+(i%9)*3.7,z=i<18?-438+Math.floor(i/9)*2.5:-399+Math.floor((i-18)/9)*2.3;o.position.set(x,terrain.heightAt(x,z)+.24,z);o.scale.set(.55,.25,.5);o.rotation.y=i*.71;o.updateMatrix();plants.setMatrixAt(i,o.matrix);}plants.receiveShadow=true;plants.name='Museum low groundcover';scene.add(plants);
 return {seats:6,bollards,informationStone:1,treeCandidates:MUSEUM_TREES.length,redWalk:true,crossing:true,source:'user museum forecourt screenshots2026-03',dimensionsEstimated:true};
}
