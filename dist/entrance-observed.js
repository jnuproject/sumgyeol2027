import * as THREE from './three.module.js';
import {segmentDistance} from './navigation.js';
import {roadWidth,MAIN_AVENUE_WIDTH,MAIN_AVENUE_LANES,MAIN_AVENUE_SIDEWALK_WIDTH} from './road-profile.js?v=together-r49';

// Independently constructed from the public Kakao Roadview, labelled2026-03.
// Presence/arrangement are observed; all dimensions and local offsets are estimates.
export function entranceRoadX(data,z){const road=data.roads.find(r=>r.id==='286085067');if(!road)return data.spawn[0];for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i];if(z>=Math.min(a[1],b[1])&&z<=Math.max(a[1],b[1])){const t=(z-a[1])/(b[1]-a[1]);return a[0]+(b[0]-a[0])*t;}}return data.spawn[0];}
export function entranceLayout(data){
 const [x,z]=data.spawn;
 const main=data.roads.find(r=>r.id==='286085067'),width=main?roadWidth(main):MAIN_AVENUE_WIDTH,half=width/2;
 return {x,z,roadWidth:width,lanes:MAIN_AVENUE_LANES,office:{x:x+half+15.25,z:z+2,w:8.8,d:6},canopy:{x:entranceRoadX(data,z+38)+width/4,z:z+38},entrySpawn:[x+half+3.45,z-7],medianEnd:z+69};
}
export function insideEntranceOffice(x,z,data,margin=0){const o=entranceLayout(data).office;return Math.abs(x-o.x)<o.w/2+margin&&Math.abs(z-o.z)<o.d/2+margin;}
export function addObservedEntrance({scene,data,terrain,environment,box,basalt,collisions,collisionMeshes,obstacles,surfaces=null}){
 const layout=entranceLayout(data),{x,z,office:o,canopy:c}=layout;
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.85});
 // The OSM way stops at the campus boundary. A short, explicitly reconstructed
 // approach keeps the before-gate spawn on paving rather than unsupported grass.
 const main=data.roads.find(r=>r.id==='286085067'),end=main?.points.at(-1);
 if(end){
  const prior=main.points.at(-2),dz=end[1]-prior[1],ratio=Math.abs(dz)>.01?(z-22-end[1])/dz:0;
  const front=[end[0]+(end[0]-prior[0])*ratio,z-22],width=layout.roadWidth;
  const ring=w=>[[end[0]-w/2,end[1]],[end[0]+w/2,end[1]],[front[0]+w/2,front[1]],[front[0]-w/2,front[1]]];
  const paving=surfaces?.redPaving??material('#a3877a');
  environment.polygon(ring(width+MAIN_AVENUE_SIDEWALK_WIDTH*2),paving,.055);
  for(const side of[-1,1]){const inner=side*width/2,outer=side*(width/2+MAIN_AVENUE_SIDEWALK_WIDTH);environment.polygon([[end[0]+inner,end[1]],[end[0]+outer,end[1]],[front[0]+outer,front[1]],[front[0]+inner,front[1]]],paving,.14);}
  environment.polygon(ring(width),surfaces?.asphalt??material('#656d68'),.08);
  for(const side of[-1,1]){environment.segment([end[0]+side*.17,end[1]],[front[0]+side*.17,front[1]],.12,material('#cfb45d'),.095);environment.segment([end[0]+side*(width/2-.25),end[1]],[front[0]+side*(width/2-.25),front[1]],.12,material('#e4e4d8'),.095);}
  const length=Math.hypot(front[0]-end[0],front[1]-end[1]);
  for(let d=4;d<length-2;d+=9)for(const side of[-1,1]){const at=t=>[end[0]+(front[0]-end[0])*t+side*width/4,end[1]+(front[1]-end[1])*t];environment.segment(at((d-1.5)/length),at((d+1.5)/length),.15,material('#e4e4d8'),.095);}
 }

 const steel=material('#c6c6b5'),dark=material('#615950'),rim=material('#ab8c67'),yellow=material('#d7b347');
 const roofMat=new THREE.MeshStandardMaterial({color:'#84715b',roughness:.9,side:THREE.DoubleSide});
 function tube(a,b,r=.06,mat=steel){const delta=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),mat);m.position.copy(a).addScaledVector(delta,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());m.castShadow=true;scene.add(m);return m;}
 const v=(x,y,z)=>new THREE.Vector3(x,terrain.heightAt(x,z)+y,z);
 const flatBase=terrain.heightAt(c.x,c.z);
 const cv=(x,y,z)=>new THREE.Vector3(x,flatBase+y,z);
 // Paired curved sheets over the outbound vehicle lanes; roof top and underside
 // are original geometry, never panorama image textures.
 for(let sheet=0;sheet<2;sheet++){
  const left=entranceRoadX(data,c.z)+.2+sheet*layout.roadWidth/4,width=layout.roadWidth/4-.35,front=c.z-5,back=c.z+5;
  const roofAt=(u,t)=>[left+width*u,6.05+.72*Math.sin(u*Math.PI)+.22*t+(sheet?.25:0),front+(back-front)*t];
  const positions=[],indices=[];
  for(let row=0;row<=8;row++)for(let col=0;col<=20;col++){const p=roofAt(col/20,row/8);positions.push(p[0],flatBase+p[1],p[2]);}
  for(let row=0;row<8;row++)for(let col=0;col<20;col++){const a=row*21+col,b=a+1,d=a+21;indices.push(a,d,b,b,d,d+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,roofMat);mesh.name='Roadview-observed paired curved entrance canopy';mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);collisionMeshes.push(mesh);
  for(const t of[0,1])for(let i=0;i<20;i++){const a=roofAt(i/20,t),b=roofAt((i+1)/20,t);tube(cv(...a),cv(...b),.055,rim);}
  for(const t of[.15,.4,.65,.9])for(let i=0;i<20;i++){const a=roofAt(i/20,t),b=roofAt((i+1)/20,t);a[1]-=.11;b[1]-=.11;tube(cv(...a),cv(...b),.025,dark);}
 }
 for(const side of[-1,1])for(const dz of[-3.9,3.9]){
  const px=c.x+side*(layout.roadWidth/4+.15),pz=c.z+dz;
  tube(v(px,0,pz),cv(px,9.1,pz),.075);obstacles.push([px,pz,.22]);
  tube(cv(px,8.65,pz),cv(c.x+side*.2,6.7,pz),.025);
  tube(cv(px,8.65,pz),cv(px,6.3,c.z-dz),.025);
 }
 // Narrow hatched median and reflective posts observed before/after the control point.
 const paint=material('#ccaf55');paint.polygonOffset=true;paint.polygonOffsetFactor=-3;paint.polygonOffsetUnits=-3;
 for(let pz=z+2;pz<layout.medianEnd;pz+=2)for(const side of[-1,1])environment.segment([entranceRoadX(data,pz)+side*.72,pz],[entranceRoadX(data,Math.min(pz+2,layout.medianEnd))+side*.72,Math.min(pz+2,layout.medianEnd)],.11,paint,.101);
 for(let pz=z+5;pz<layout.medianEnd;pz+=3.2){
  if(Math.abs(pz-(z+35))<4.5)continue;
  environment.segment([entranceRoadX(data,pz-.8)-.66,pz-.8],[entranceRoadX(data,pz+.8)+.66,pz+.8],.10,paint,.103);
  for(const side of[-1,1]){
   const px=entranceRoadX(data,pz)+side*.55;
   box(px,.41,pz,.13,.82,.13,'#b2673d');
   box(px,.67,pz,.15,.085,.15,'#e3d6b0');box(px,.48,pz,.15,.07,.15,'#dfd7b8');box(px,.85,pz,.18,.08,.18,'#343d3a');
   obstacles.push([px,pz,.13]);
  }
 }
 // Vehicle-control hardware on the outer lane edge, without an invented closed gate.
 for(const px of[entranceRoadX(data,c.z)+layout.roadWidth/2,entranceRoadX(data,c.z)+layout.roadWidth/4]){
  box(px,.1,c.z, .75,.2,6.5,'#a2a28e');box(px,.8,c.z-1,.55,1.5,.55,'#858e8a');box(px,1.38,c.z-1,.59,.18,.6,'#d2ad45');box(px,1.65,c.z+1.4,.65,3.1,.5,'#9ba29b');box(px,2.15,c.z+1.12,.42,.42,.06,'#3d5055');obstacles.push([px,c.z-1,.5]);obstacles.push([px,c.z+1.4,.5]);
 }
 // Roadside security office: low dark-stone wing with pale windowed front.
 const ring=[[o.x-o.w/2,o.z-o.d/2],[o.x+o.w/2,o.z-o.d/2],[o.x+o.w/2,o.z+o.d/2],[o.x-o.w/2,o.z+o.d/2],[o.x-o.w/2,o.z-o.d/2]];
 collisions.push(ring);
 const officeBody=box(o.x,1.55,o.z,o.w,3.1,o.d,'#d3d0be');officeBody.userData.batch=false;collisionMeshes.push(officeBody);
 box(o.x,3.19,o.z,o.w+.6,.25,o.d+.5,'#dddcd1');
 const officeStone=box(o.x-2.0,1.60,o.z-o.d/2-.05,1.25,3.2,.16,'#434b46');officeStone.material=basalt;officeStone.userData.batch=false;
 for(const dx of[.05,1.5,2.95]){box(o.x+dx,1.95,o.z-o.d/2-.13,1.25,1.42,.13,'#64817e');box(o.x+dx,1.18,o.z-o.d/2-.16,1.38,.12,.24,'#d3d6cd');}
 const east=o.x-o.w/2-.04;
 box(east,1.74,o.z,.13,2.05,o.d*.86,'#c9cbbc');
 for(let i=0;i<4;i++){const pz=o.z-o.d*.38+i*o.d*.25;box(east-.08,1.9,pz,.12,1.35,1.1,'#64817e');box(east-.14,1.9,pz+.56,.12,1.5,.07,'#d5d7cb');}
 box(east-.08,.13,o.z,.95,.26,o.d*.9,'#a0a395');
 box(east-.60,3.02,o.z,1.6,.27,o.d+.5,'#dddcd1');
 for(const pz of[o.z-2.7,o.z,o.z+2.7])box(east-.98,1.52,pz,.11,2.95,.11,'#c9cbc0');
 environment.polygon([[o.x-5.2,o.z-4.3],[o.x+6.1,o.z-4.3],[o.x+6.1,o.z+4.3],[o.x-5.2,o.z+4.3]],material('#7c7770'),.065);
 // Low planted borders alongside the red sidewalks. Gaps follow mapped paths/junctions.
 const hedgeGeo=new THREE.IcosahedronGeometry(1,2),hedgeMat=material('#475d3e'),hedges=[];
 for(const side of[-1,1])for(let pz=z+7;pz<z+108;pz+=1.2){
  const px=x+side*(layout.roadWidth/2+5.95);
  if(insideEntranceOffice(px,pz,data,2))continue;
  if(data.roads.some(r=>r.id!=='286085067'&&r.points.some((b,i)=>i&&segmentDistance(px,pz,r.points[i-1],b)<roadWidth(r)/2+2)))continue;
  hedges.push([px,pz]);
 }
 const hedge=new THREE.InstancedMesh(hedgeGeo,hedgeMat,hedges.length),obj=new THREE.Object3D();
 hedges.forEach(([px,pz],i)=>{obj.position.set(px,terrain.heightAt(px,pz)+.46,pz);obj.scale.set(.76,.44,.86);obj.rotation.y=0;obj.updateMatrix();hedge.setMatrixAt(i,obj.matrix);});hedge.name='Observed low entrance planting border';hedge.castShadow=true;hedge.receiveShadow=true;scene.add(hedge);
 return {entrySpawn:layout.entrySpawn,source:'Kakao Roadview2026-03; lane count corrected by user2026-10-25',referenceCapture:'2026-03',dolharubang:0,lanes:layout.lanes,roadWidthEstimate:layout.roadWidth,geometryEstimated:true,hedgeSegments:hedges.length};
}
