import * as THREE from './three.module.js';
import {segmentDistance} from './navigation.js';

// OSM anchors are exact source points. Flight counts/widths/rises are a visual
// reconstruction; the coarse elevation source is not a stair survey.
export function makeStairRoute(a,b,heightAt,{width=5.4,flights=7,steps=12,landing=2.1}={}){
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length;
 const flightLength=(length-landing*(flights-1))/flights,treads=[];
 const pos=d=>[a[0]+ux*d,a[1]+uz*d];let d=0,start=heightAt(...a)+.32;
 for(let f=0;f<flights;f++){
  const end=d+flightLength,next=f===flights-1?end:end+landing;
  const finish=heightAt(...pos(next))+.32;
  for(let i=0;i<steps;i++)treads.push({from:d+i*flightLength/steps,to:d+(i+1)*flightLength/steps,height:start+(finish-start)*(i+1)/steps,landing:false});
  if(f<flights-1)treads.push({from:end,to:next,height:finish,landing:true});
  start=finish;d=next;
 }
 return {a,b,ux,uz,length,width,flights,steps,treads};
}
export function stairRouteHeight(route,x,z){
 const dx=x-route.a[0],dz=z-route.a[1],d=dx*route.ux+dz*route.uz,side=-dx*route.uz+dz*route.ux;
 if(d<0||d>route.length||Math.abs(side)>route.width/2)return null;
 return (route.treads.find(t=>d<=t.to+1e-7)??route.treads.at(-1)).height+.012;
}
export function insideFocusClearance(x,z,data){
 if(x>-126&&x<-87&&z>-34&&z<-12)return true;
 if(x>-137&&x<-73&&z>212&&z<241)return true;
 const r=data.roads.find(r=>r.id==='471489721');
 return Boolean(r&&segmentDistance(x,z,r.points[0],r.points.at(-1))<4.2);
}
export function addFocusDetails({scene,data,terrain,environment,surfaces,box,collisionMeshes,obstacles,fallbackHeightAt}){
 const routes=[],ramps=[],stats={ascentFlights:0,ascentTreads:0,studentAccessFlights:0,handrailSegments:0,topiaryGroups:0};
 const railMeshes=[],railGeometry=new THREE.CylinderGeometry(1,1,1,6);
 const materials=new Map(),mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return materials.get(color);};
 const absBox=(x,y,z,w,h,d,c)=>box(x,y-terrain.heightAt(x,z),z,w,h,d,c);
 function rail(a,b,color='#788782',radius=.045){
  const v=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(v);if(delta.length()<.001)return;
  const m=new THREE.Mesh(railGeometry,mat(color));m.position.copy(v).addScaledVector(delta,.5);m.scale.set(radius,delta.length(),radius);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());m.castShadow=true;scene.add(m);railMeshes.push(m);stats.handrailSegments++;
 }
 function stairs(route,color='#b5b8ae',wood=false){
  routes.push(route);
  for(const [i,t] of route.treads.entries()){
   const d=(t.from+t.to)/2,x=route.a[0]+route.ux*d,z=route.a[1]+route.uz*d,bottom=Math.min(terrain.heightAt(x,z)-.6,t.height-.18);
   const m=absBox(x,(t.height+bottom)/2,z,route.width,t.height-bottom,t.to-t.from+.025,i%4===0?'#bfc1b8':color);m.rotation.y=Math.atan2(route.ux,route.uz);m.userData.batch=false;collisionMeshes.push(m);
   const edge=absBox(x,t.height+.015,z,route.width,.035,.055,'#d1d1c4');edge.rotation.y=m.rotation.y;
  }
  for(const side of[-1,1]){
   const samples=[];for(let d=0;d<=route.length+.01;d+=2.4){
    const dd=Math.min(route.length,d),x=route.a[0]+route.ux*dd-route.uz*side*(route.width/2+.12),z=route.a[1]+route.uz*dd+route.ux*side*(route.width/2+.12);
    const h=stairRouteHeight(route,route.a[0]+route.ux*dd,route.a[1]+route.uz*dd)??terrain.heightAt(x,z);
    rail([x,h-.15,z],[x,h+1.03,z],wood?'#615447':'#7d8982',wood?.065:.04);samples.push([x,h+.98,z]);
    obstacles.push([x,z,.07]);
   }
   for(let i=1;i<samples.length;i++){
    rail(samples[i-1],samples[i],wood?'#6a5947':'#8c9992',wood?.075:.045);
    rail(samples[i-1].map((v,j)=>j===1?v-.43:v),samples[i].map((v,j)=>j===1?v-.43:v),wood?'#796650':'#8c9992',.035);
   }
  }
 }
 const sourceStairs=data.roads.find(r=>r.id==='471489721');
 if(sourceStairs){const route=makeStairRoute(sourceStairs.points[0],sourceStairs.points.at(-1),terrain.heightAt);stairs(route);stats.ascentFlights=route.flights;stats.ascentTreads=route.flights*route.steps;}
 // Observed small paver walk and tactile line outside the north face of economics1.
 environment.segment([-67,87.6],[2,87.6],2.5,surfaces.paving,.12);
 environment.segment([-66,87.6],[1,87.6],.28,mat('#d1b14f'),.145);
 for(let x=-65;x<0;x+=3.4)environment.segment([x,86.4],[x,88.8],.035,mat('#7c8178'),.14);
 // Low planted edge and rough stone retaining courses seen beneath the facade.
 for(let x=-61;x<-4;x+=7.0){
  const h=terrain.heightAt(x,89.8);absBox(x,h+.29,89.8,5.8,.58,.7,'#606b5b');
  for(let course=0;course<3;course++)absBox(x,h+.09+course*.18,89.35,5.8,.025,.08,'#343f35');
 }
 const shrubGeo=new THREE.SphereGeometry(1,10,6),shrubs=[];
 const shrub=(x,z,w,h,d,ground=terrain.heightAt(x,z),color='#43583c')=>{shrubs.push({x,z,w,h,d,ground,color});};
 for(const x of[-62,-48,-34,-20,-7])shrub(x,90.1,1.2,.9,.7);
 // Library approach: broad asphalt court, paired clipped shrubs and handrails.
 const lib=data.buildings.find(b=>b.id==='286237890');
 if(lib){
  const x=-104.6,z=240.8,base=terrain.heightAt(...lib.center);
  environment.polygon([[x-29,214],[x+29,214],[x+29,z],[x-29,z]],surfaces.asphalt,.10);
  for(const side of[-1,1]){
   for(const [i,zz] of[232.5,236.2,239.2].entries()){
    const xx=x+side*(13.8+i*.75),ground=terrain.heightAt(xx,zz);
    absBox(xx,ground+.35,zz,3.4,.7,3.4,'#525e50');
    shrub(xx,zz,2.05,.78,1.65,ground+.7);shrub(xx,zz,1.5,.65,1.25,ground+1.7);shrub(xx,zz,.95,.55,.9,ground+2.45);stats.topiaryGroups++;
   }
   const lower=terrain.heightAt(x+side*9,232.4)+.18;
   for(let d=0;d<=8.4;d+=2.1){const y=lower+(base+2.5-lower)*d/8.4;rail([x+side*9,y,232.4+d],[x+side*9,y+1.0,232.4+d]);}
   rail([x+side*9,lower+1.0,232.4],[x+side*9,base+3.5,240.8]);
  }
  // The taper is an independent canopy shape; no photographed banner is reused.
  const footprint=[[x-9,z+.1],[x+9,z+.1],[x+12,z-5.4],[x-12,z-5.4]],positions=[];
  for(const y of[base+5.65,base+6.05])for(const p of footprint)positions.push(p[0],y,p[1]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex([0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0]);g.computeVertexNormals();
  const canopy=new THREE.Mesh(g,mat('#a8aaa0'));canopy.castShadow=true;canopy.receiveShadow=true;scene.add(canopy);collisionMeshes.push(canopy);
  for(const dx of[-7.8,7.8])absBox(x+dx,base+4.15,z-3.6,.38,3.3,.38,'#c4c7bc');
  absBox(x,base+2.45,z-1.3,18,.18,2.6,'#c9cbbf');
 }
 // Roadview shows a lower student-hall court, stairs and guarded access.
 const student=data.buildings.find(b=>b.id==='471697621');
 if(student){
  environment.polygon([[-125,-31],[-95,-31],[-95,-13],[-116,-13],[-125,-20]],surfaces.paving,.12);
  const access=makeStairRoute([-91,-21],[-111,-21],terrain.heightAt,{width:4.6,flights:2,steps:7,landing:2.4});stairs(access,'#a5aaa0',true);stats.studentAccessFlights=2;
  const a=[-91,-29],b=[-113,-29],ha=terrain.heightAt(...a)+.15,hb=terrain.heightAt(...b)+.15;
  const positions=[a[0],ha,a[1]-1.1,a[0],ha,a[1]+1.1,b[0],hb,b[1]-1.1,b[0],hb,b[1]+1.1];
  for(const [x,z]of[[a[0],a[1]-1.1],[a[0],a[1]+1.1],[b[0],b[1]-1.1],[b[0],b[1]+1.1]])positions.push(x,Math.min(ha,hb,terrain.heightAt(x,z))-.2,z);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex([0,2,1,1,2,3,0,4,6,0,6,2,1,3,7,1,7,5,0,1,5,0,5,4,2,6,7,2,7,3]);geometry.computeVertexNormals();
  const ramp=new THREE.Mesh(geometry,mat('#bfc4b8'));ramp.receiveShadow=true;scene.add(ramp);collisionMeshes.push(ramp);ramps.push({a,b,ha,hb,width:2.2});
  for(const side of[-1,1]){const z=-29+side*1.2;rail([a[0],ha+1,z],[b[0],hb+1,z]);for(let x=-92;x>-113;x-=3){const y=ha+(hb-ha)*(x-a[0])/(b[0]-a[0]);rail([x,y,z],[x,y+1,z]);obstacles.push([x,z,.06]);}}
  for(const p of[[-121,-29],[-123,-18],[-104,-12.4]]){
   const [x,z]=p,h=terrain.heightAt(x,z);absBox(x,h+.18,z,2.8,.36,1.8,'#8c9684');absBox(x,h+.39,z,2.5,.1,1.5,'#5f6950');
   for(const dx of[-.65,0,.65])shrub(x+dx,z,.68,.66,.65,h+.4);
  }
  const base=terrain.heightAt(...student.center);const canopy=absBox(-116.0,base+4.0,-15.2,9,.35,3.4,'#d1d7cb');canopy.rotation.y=2.33;
 }
 // Original clumps, instanced. Planting positions are reconstructed, not surveyed.
 if(shrubs.length){const mesh=new THREE.InstancedMesh(shrubGeo,mat('#ffffff'),shrubs.length),o=new THREE.Object3D(),c=new THREE.Color();
  shrubs.forEach((s,i)=>{o.position.set(s.x,s.ground+s.h/2,s.z);o.scale.set(s.w,s.h,s.d);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,c.set(s.color));});mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
 // Refine the photographed security-office porch without blocking the sidewalk.
 const gx=data.spawn[0],gz=data.spawn[1],ox=gx+24,oz=gz+2,base=terrain.heightAt(ox,oz);
 for(let i=0;i<3;i++)absBox(ox-4.7-i*.32,base+.12+(2-i)*.11,oz, .34,.22+(2-i)*.22,3.5,'#acb0a7');
 absBox(ox-5.05,base+3.17,oz,1.2,.22,4.3,'#c9cbbf');
 for(const dz of[-1.7,1.7])absBox(ox-5.2,base+1.55,oz+dz,.12,3.1,.12,'#c4cbc1');
 // Batch the many thin handrail tubes into a few instanced draw calls.
 scene.updateMatrixWorld(true);const grouped=new Map();
 for(const m of railMeshes){const k=m.material.uuid;if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(m);}
 for(const list of grouped.values()){const batch=new THREE.InstancedMesh(railGeometry,list[0].material,list.length);list.forEach((m,i)=>batch.setMatrixAt(i,m.matrixWorld));batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);list.forEach(m=>m.removeFromParent());}
 return {stats,routes,ramps,heightAt(x,z){
  for(const route of routes){const h=stairRouteHeight(route,x,z);if(h!==null)return h;}
  for(const r of ramps)if(Math.abs(z-r.a[1])<=r.width/2&&x<=r.a[0]&&x>=r.b[0])return r.ha+(r.hb-r.ha)*(x-r.a[0])/(r.b[0]-r.a[0])+.012;
  return fallbackHeightAt(x,z);
 }};
}
