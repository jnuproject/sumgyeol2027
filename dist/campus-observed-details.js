import * as THREE from './three.module.js';
import {insidePolygon,segmentDistance} from './navigation.js';
import {roadWidth} from './road-profile.js';

// Original geometry based on the named Roadview observations in campus-survey.json.
// Positions and dimensions are approximations anchored to existing OSM footprints.
export function addCampusObservedDetails({scene,data,terrain,environment,surfaces,box,collisionMeshes,obstacles,visibleAt=()=>true}){
 const stairways=[],carLocations=[],stats={stairways:0,forecourts:0,parkedCars:0,observedCrossings:0};
 const material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.92});
 const paint=material('#e1dfcd'),hump=material('#c6ad54');for(const m of[paint,hump]){m.polygonOffset=true;m.polygonOffsetFactor=-3;m.polygonOffsetUnits=-3;}
 const rect=(cx,cz,w,d,mat,offset=.105)=>{environment.polygon([[cx-w/2,cz-d/2],[cx+w/2,cz-d/2],[cx+w/2,cz+d/2],[cx-w/2,cz+d/2]],mat,offset);};
 function front(b,side){
  const edges=b.points.slice(1).map((p,i)=>{const a=b.points[i],length=Math.hypot(p[0]-a[0],p[1]-a[1]);return {a,b:p,length,z:(p[1]+a[1])/2};}).filter(e=>Math.abs(e.b[0]-e.a[0])>Math.abs(e.b[1]-e.a[1])*2&&e.length>8);
  edges.sort((a,b)=>side==='north'?a.z-b.z:b.z-a.z);const e=edges[0],ux=(e.b[0]-e.a[0])/e.length,uz=(e.b[1]-e.a[1])/e.length;let nx=uz,nz=-ux;
  const cx=(e.a[0]+e.b[0])/2,cz=e.z;if(insidePolygon(cx+nx,cz+nz,b.points)){nx=-nx;nz=-nz;}
  return {cx,cz,ux,uz,nx,nz,length:e.length};
 }
 function stairs({cx,cz,ux=1,uz=0,nx=0,nz=-1,width,depth,top,steps}){
  const start=terrain.heightAt(cx+nx*depth,cz+nz*depth)+.1,rise=top-start;
  if(rise<=0)return;
  const step=depth/steps;
  for(let i=0;i<steps;i++){
   const d=depth-(i+.5)*step,px=cx+nx*d,pz=cz+nz*d,level=start+rise*(i+1)/steps,bottom=Math.min(start,terrain.heightAt(px,pz))-.2;
   const mesh=box(px,(level+bottom)*.5-terrain.heightAt(px,pz),pz,width,level-bottom,step+.025,'#b9beb5');mesh.rotation.y=-Math.atan2(uz,ux);mesh.userData.batch=false;collisionMeshes.push(mesh);
  }
  stairways.push({cx,cz,ux,uz,nx,nz,width,depth,start,rise,steps});stats.stairways++;
 }
 const library=data.buildings.find(b=>b.id==='286237890');
 if(library){const f=front(library,'north'),base=terrain.heightAt(...library.center);
  rect(f.cx,f.cz+f.nz*10,Math.min(58,f.length),20,surfaces.asphalt);stats.forecourts++;
  stairs({...f,width:18,depth:8.5,top:base+2.5,steps:15});
  // The observed tapered canopy and columns are added by focus-details.js.
 }
 const digital=data.buildings.find(b=>b.id==='953564621');
 if(digital){const f=front(digital,'south'),base=terrain.heightAt(...digital.center);rect(f.cx,f.cz+8,Math.min(60,f.length),16,surfaces.paving);stats.forecourts++;
  stairs({...f,width:15,depth:3.2,top:Math.max(base+.25,terrain.heightAt(f.cx,f.cz+3.2)+.7),steps:4});
  for(let x=f.cx-25;x<f.cx-8;x+=2.6)environment.segment([x,f.cz+8],[x,f.cz+13],.1,paint,.12);
 }
 const engineering=data.buildings.find(b=>b.id==='953546804');
 if(engineering){const f=front(engineering,'south');rect(f.cx,f.cz+13,54,26,surfaces.asphalt);stats.forecourts++;
  rect(f.cx-20,f.cz+4,7,7,surfaces.grass,.13);
  for(let x=f.cx-24;x<=f.cx+24;x+=2.65)environment.segment([x,f.cz+18],[x,f.cz+23],.11,paint,.12);
 }
 // A photographed crossing and yellow/white raised-table treatment at the
 // first academic junction. Exact centre/rise is approximate, not a traffic survey.
 const main=data.roads.find(r=>r.id==='286085067');
 if(main){const z=-285;let x=data.spawn[0];for(let i=1;i<main.points.length;i++){const a=main.points[i-1],b=main.points[i];if(z>=Math.min(a[1],b[1])&&z<=Math.max(a[1],b[1])){const t=(z-a[1])/(b[1]-a[1]);x=a[0]+(b[0]-a[0])*t;break;}}
  for(let dx=-8;dx<=8;dx+=1.45)rect(x+dx,z,.72,3.5,paint,.13);
  rect(x,z+7.5,17,3.3,hump,.135);
  for(let dx=-7;dx<=7;dx+=1.6)environment.segment([x+dx-.6,z+6],[x+dx+.6,z+9],.5,paint,.145);
  stats.observedCrossings++;
 }
 // West grandstand visible across the track: simple low tiers, not a scanned model.
 const pitch=data.areas.find(a=>a.id==='286070859');
 if(pitch){const cx=(Math.min(...pitch.points.map(p=>p[0]))+Math.max(...pitch.points.map(p=>p[0])))/2,cz=(Math.min(...pitch.points.map(p=>p[1]))+Math.max(...pitch.points.map(p=>p[1])))/2;
  const px=cx-50.8,pz=cz,base=terrain.heightAt(px,pz);
  stairs({cx:px-9,cz:pz,ux:0,uz:1,nx:1,nz:0,width:72,depth:9,top:base+3.0,steps:6});
  for(let row=0;row<6;row++)box(px-row*1.5,base+.5+row*.5-terrain.heightAt(px-row*1.5,pz),pz,.45,.12,70,'#66969e');
  for(const dz of[-2,0,2]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,9,8),material('#b6bcb5'));m.position.set(cx+51,terrain.heightAt(cx+51,cz+dz)+4.5,cz+dz);scene.add(m);}
 }
 // Parked cars in mapped parking areas are original generic geometry. Their
 // number, spacing and colours are reconstructed; they are never live vehicles.
 function car(x,z,ux,uz,index){
  const angle=-Math.atan2(uz,ux),color=['#c5c9c5','#46555b','#d7d6cc','#526675','#9b9a90'][index%5];
  for(const [y,w,h,d,c]of[[.65,3.8,.65,1.7,color],[1.17,1.9,.5,1.5,'#5b7176'],[1.47,1.65,.11,1.47,color]]){const m=box(x,y,z,w,h,d,c);m.rotation.y=angle;}
  for(const along of[-1.2,1.2])for(const side of[-.82,.82]){const px=x+ux*along-uz*side,pz=z+uz*along+ux*side,m=box(px,.36,pz,.5,.55,.24,'#343b39');m.rotation.y=angle;}
  for(const along of[-1.05,1.05])obstacles.push([x+ux*along,z+uz*along,.85]);carLocations.push([x,z,ux,uz]);stats.parkedCars++;
 }
 for(const area of data.areas.filter(a=>a.tags.amenity==='parking')){
  let edge=[area.points[0],area.points[1]],length=0;
  for(let i=1;i<area.points.length;i++){const l=Math.hypot(area.points[i][0]-area.points[i-1][0],area.points[i][1]-area.points[i-1][1]);if(l>length){length=l;edge=[area.points[i-1],area.points[i]];}}
  const a=edge[0],ux=(edge[1][0]-a[0])/length,uz=(edge[1][1]-a[1])/length,vx=-uz,vz=ux;
  const uv=area.points.map(p=>[(p[0]-a[0])*ux+(p[1]-a[1])*uz,(p[0]-a[0])*vx+(p[1]-a[1])*vz]);
  for(let v=Math.min(...uv.map(p=>p[1]))+4;v<Math.max(...uv.map(p=>p[1]))-3;v+=16)for(let u=3;u<length-3;u+=7.8){
   if(stats.parkedCars>=42)break;
   const x=a[0]+ux*u+vx*v,z=a[1]+uz*u+vz*v;
   if(![[x,z],...[-2,2].flatMap(along=>[-.9,.9].map(side=>[x+vx*along+ux*side,z+vz*along+uz*side]))].every(p=>insidePolygon(...p,area.points)))continue;
   if(![[-2,-1],[-2,1],[2,-1],[2,1]].every(([u,v])=>visibleAt(x+vx*u+ux*v,z+vz*u+uz*v)))continue;
   if(data.roads.some(r=>r.points.some((p,i)=>i&&segmentDistance(x,z,r.points[i-1],p)<roadWidth(r)/2+2)))continue;
   car(x,z,vx,vz,stats.parkedCars);
  }
 }
 function heightAt(x,z){let height=environment.heightAt(x,z);for(const s of stairways){const dx=x-s.cx,dz=z-s.cz,u=dx*s.ux+dz*s.uz,d=dx*s.nx+dz*s.nz;if(Math.abs(u)<=s.width/2&&d>=0&&d<=s.depth){const step=Math.min(s.steps-1,Math.floor((s.depth-d)/s.depth*s.steps));height=Math.max(height,s.start+s.rise*(step+1)/s.steps+.012);}}return height;}
 return {heightAt,stats,stairways,carLocations};
}
