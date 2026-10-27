import * as THREE from './three.module.js';
import {insidePolygon} from './navigation.js';

// Independently traced from the user's student-hall aerial screenshot.
// Existing west roof edge and north/south junctions anchor approximate metres.
export const studentPhotoPoint=([x,y])=>[-165.728+(x-80)*.182,-78.258+(y-339)*.174];
const ring=p=>{const out=p.map(studentPhotoPoint);return [...out,[...out[0]]];};
export const STUDENT_GARDEN_BOUNDARY=ring([[32,369],[46,352],[100,350],[190,357],[275,351],[366,352],[401,363],[419,392],[427,422],[408,474],[394,517],[387,557],[366,583],[308,596],[243,590],[186,582],[123,580],[66,601],[34,605]]);
// Dark reed/water outline instead of the small, bright blue OSM oval.
export const STUDENT_POND=ring([[90,465],[115,451],[149,447],[183,452],[211,461],[224,478],[256,484],[288,494],[309,512],[306,531],[286,546],[252,555],[219,548],[191,538],[163,527],[134,520],[112,507],[99,489]]);
const smooth=points=>{
 const out=[],p=points.map(studentPhotoPoint);
 for(let i=0;i<p.length-1;i++)for(let k=0;k<5;k++){
  const t=k/5,t2=t*t,t3=t2*t,a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],d=p[Math.min(p.length-1,i+2)];
  out.push([0,1].map(axis=>.5*((2*b[axis])+(-a[axis]+c[axis])*t+(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t2+(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t3)));
 }
 out.push(p.at(-1));return out;
};
export const STUDENT_GARDEN_PATHS=[
 {id:'student-pond-north-loop',width:1.7,points:smooth([[39,424],[88,418],[132,423],[182,433],[229,440],[260,431],[284,406],[327,388],[374,391],[409,418]])},
 {id:'student-pond-south-loop',width:1.8,points:smooth([[39,590],[81,566],[126,556],[176,562],[219,575],[263,574],[306,559],[330,535],[337,508],[323,481],[292,463],[251,451],[229,440]])},
 {id:'student-pond-north-entry',width:1.7,points:smooth([[40,370],[70,356],[114,358],[160,369],[201,385],[228,410],[229,440]])}
];
export const STUDENT_GARDEN_TREES=[
 [46,385,10.5],[85,374,8.4],[132,386,9.3],[191,359,10.4],[248,367,8.3],[304,359,8.6],[350,363,7.5],
 [48,452,10.8],[61,504,9.8],[51,553,10.4],[83,584,9.5],[126,588,7.7],[175,593,8.2],[236,593,8.4],[288,584,8.8],
 [365,438,8.4],[360,474,8.1],[355,551,8.7],[393,593,9.3],[427,754,10.5],[440,805,9.9]
].map(([x,y,h])=>{const p=studentPhotoPoint([x,y]);return {x:p[0],z:p[1],h,type:'park',areaId:'student-hall-reference'};});
export const insideStudentGarden=(x,z)=>insidePolygon(x,z,STUDENT_GARDEN_BOUNDARY);
export function applyStudentHallReference(source){
 if(source.studentHallReference)return source;
 const areas=source.areas.map(a=>a.id==='969694342'?{...a,points:STUDENT_POND,tags:{...a.tags,'surface:appearance':'reed_pond'}}:a.id==='969694343'?{...a,points:STUDENT_GARDEN_BOUNDARY,tags:{...a.tags,'surface:appearance':'existing_grass'}}:a);
 return {...source,areas,studentHallReference:{version:'student-r35',source:'user aerial screenshot received2026-10-26',garden:'curved pond paths, reed margin, planted north garden and paved forecourt',existingGrassRetained:true,measurementsEstimated:true}};
}
export function addStudentHallGarden({scene,data,terrain,environment,surfaces,box,obstacles}){
 if(!data.studentHallReference)return null;
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.96});
 const stone=mat('#69715f'),reed=mat('#5c6850'),curb=mat('#9ca393'),paving=surfaces.paving.clone();paving.color.set('#a3a79b');paving.onBeforeCompile=surfaces.paving.onBeforeCompile;paving.customProgramCacheKey=surfaces.paving.customProgramCacheKey;
 const at=studentPhotoPoint;
 const court=ring([[422,398],[457,435],[457,548],[438,580],[439,618],[459,663],[463,708],[443,735],[400,753],[370,727],[354,683],[350,631],[366,587],[388,550],[399,511],[400,470]]);
 // Existing focus stairs remain above this approach surface.
 environment.polygon(court,surfaces.asphalt,.075,'road');
 const entranceCourt=ring([[368,632],[406,625],[435,648],[435,690],[410,722],[371,722],[350,682]]);
 environment.polygon(entranceCourt,paving,.085,'road');
 // Low, irregular basalt/reed shore: only an annulus, no new lawn colour.
 const c=STUDENT_POND.slice(0,-1).reduce((v,p)=>[v[0]+p[0]/(STUDENT_POND.length-1),v[1]+p[1]/(STUDENT_POND.length-1)],[0,0]);
 const outer=STUDENT_POND.map(p=>{const dx=p[0]-c[0],dz=p[1]-c[1],l=Math.hypot(dx,dz);return [p[0]+dx/l*.65,p[1]+dz/l*.65];});
 for(let i=1;i<outer.length;i++)environment.polygon([outer[i-1],outer[i],STUDENT_POND[i],STUDENT_POND[i-1]],stone,.042);
 const tuft=new THREE.InstancedMesh(new THREE.ConeGeometry(.22,.75,5),reed,(outer.length-1)*3),o=new THREE.Object3D();let ti=0;
 for(let i=1;i<outer.length;i++)for(let j=0;j<3;j++){
  const t=(j+.5)/3,p=[outer[i-1][0]*(1-t)+outer[i][0]*t,outer[i-1][1]*(1-t)+outer[i][1]*t];
  o.position.set(p[0],terrain.heightAt(...p)+.31,p[1]);o.scale.set(.8+(i%3)*.2,.7+(i%4)*.12,.8);o.rotation.set(0,i*1.7+j,0);o.updateMatrix();tuft.setMatrixAt(ti++,o.matrix);
 }
 tuft.name='Student hall pond reed margin';tuft.receiveShadow=true;scene.add(tuft);
 // Rounded planted island at the street-side edge of the photographed court.
 const island=ring([[450,496],[486,496],[510,509],[511,536],[489,551],[463,546],[447,529]]).map(([x,z])=>[x-7.2,z]);
 for(let i=1;i<island.length;i++)environment.segment(island[i-1],island[i],.24,curb,.17);
 environment.polygon(island,surfaces.grass,.13);
 const painted=mat('#d7d9cc');
 for(const [x,y] of [[413,589],[422,606],[436,621],[424,733]]){
  const p=at([x,y]),q=at([x+13,y+3]);environment.segment(p,q,.10,painted,.095);
 }
 // Paving joins and benches on the north garden, outside the walking paths.
 for(const [x,y]of [[76,399],[295,378],[303,580]]){
  const p=at([x,y]);box(p[0],.46,p[1],2.1,.13,.48,'#736b53');
  for(const dx of[-.76,.76])box(p[0]+dx,.22,p[1],.09,.43,.36,'#626c63');
 }
 const student=data.buildings.find(b=>b.id==='471697621');let skylight=false;
 if(student){const cx=-143,cz=-6,w=8.1,d=7.0;
  if([[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].every(([x,z])=>insidePolygon(cx+x,cz+z,student.points))){
   const roof=terrain.heightAt(...student.center)+8.94;
   const absolute=(x,y,z,w,h,d,c)=>box(x,y-terrain.heightAt(x,z),z,w,h,d,c);
   absolute(cx,roof+.22,cz,w+.4,.45,d+.4,'#7f9d87');absolute(cx,roof+.48,cz,w,.10,d,'#718c80');
   for(let x=-w/2;x<=w/2+.01;x+=w/5)absolute(cx+x,roof+.55,cz,.065,.055,d,'#b0b9a3');
   for(let z=-d/2;z<=d/2+.01;z+=d/4)absolute(cx,roof+.55,cz+z,w,.055,.065,'#b0b9a3');skylight=true;
  }
 }
 return {curvedPaths:STUDENT_GARDEN_PATHS.length,pondShoreSegments:outer.length-1,treeCandidates:STUDENT_GARDEN_TREES.length,forecourt:true,skylight,source:'user student-hall aerial reference',estimated:true};
}
