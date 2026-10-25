import * as THREE from './three.module.js';
import {segmentDistance} from './navigation.js';

// OSM anchors are exact source points. Flight counts/widths/rises are a visual
// reconstruction; the coarse elevation source is not a stair survey.
export function makeStairRoute(a,b,heightAt,{width=5.4,flights=7,steps=12,landing=2.1,surfaceOffset=.32,startHeight=null,endHeight=null}={}){
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length;
 const flightLength=(length-landing*(flights-1))/flights,treads=[];
 const pos=d=>[a[0]+ux*d,a[1]+uz*d],linear=Number.isFinite(startHeight)&&Number.isFinite(endHeight);let d=0,start=linear?startHeight:heightAt(...a)+surfaceOffset;
 for(let f=0;f<flights;f++){
  const end=d+flightLength,next=f===flights-1?end:end+landing;
  const finish=linear?startHeight+(endHeight-startHeight)*next/length:heightAt(...pos(next))+surfaceOffset;
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
 // The photographed deck access and its road-side approach are open. Keep
 // procedural avenue trunks out of this continuous walking/camera corridor.
 if(segmentDistance(x,z,[-99,-21],[-73,-21])<4.2)return true;
 if(x>-137&&x<-73&&z>212&&z<241)return true;
 const r=data.roads.find(r=>r.id==='471489721');
 return Boolean(r&&segmentDistance(x,z,r.points[0],r.points.at(-1))<4.2);
}
export function addFocusDetails({scene,data,terrain,environment,surfaces,box,collisionMeshes,obstacles,fallbackHeightAt}){
 const routes=[],ramps=[],platforms=[],stats={ascentFlights:0,ascentTreads:0,studentAccessFlights:0,handrailSegments:0,topiaryGroups:0};
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
   const m=absBox(x,(t.height+bottom)/2,z,route.width,t.height-bottom,t.to-t.from+.025,i%4===0?(wood?'#a29075':'#bfc1b8'):color);m.rotation.y=Math.atan2(route.ux,route.uz);m.userData.batch=false;collisionMeshes.push(m);
   const edge=absBox(x,t.height+.015,z,route.width,.035,.055,wood?'#b4a083':'#d1d1c4');edge.rotation.y=m.rotation.y;
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

 const shrubGeo=new THREE.SphereGeometry(1,20,12),shrubs=[],clippedShrubs=[];
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
    //2026-03 front Roadview shows thick rounded hedge masses rising along
    // the stairs, not four discs stacked vertically at every planting location.
    // Keep existing six positions and player clearances; heights are estimates.
    const pedestal=.58+i*.55,crownHeight=1.15+i*.075;
    absBox(xx,ground+pedestal/2,zz,3.4,pedestal,3.4,'#525e50');
    clippedShrubs.push({x:xx,z:zz,w:1.95-i*.09,h:crownHeight,d:1.65,ground:ground+pedestal,color:i===1?'#4b5936':'#3e5037'});
    obstacles.push([xx,zz,1.7]);stats.topiaryGroups++;
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
 if(lib){
  const x=-136.5,z=220,base=terrain.heightAt(x,z),geometry=new THREE.IcosahedronGeometry(1,1),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=1+.08*Math.sin(x*17+y*11+z*23);p.setXYZ(i,x*1.55*v,Math.max(-1.0,y*1.7*v),z*v);}geometry.computeVertexNormals();
  const stone=new THREE.Mesh(geometry,mat('#84937b'));stone.name='Library marker stone';stone.position.set(x,base+1.0,z);stone.castShadow=true;scene.add(stone);collisionMeshes.push(stone);obstacles.push([x,z,1.6]);
  if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#3d4842';g.fillRect(0,0,512,128);g.fillStyle='#d7dfce';g.font='48px serif';g.textAlign='center';g.fillText('中央圖書館',256,87);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.52),new THREE.MeshStandardMaterial({map:t,roughness:.9}));sign.position.set(x,base+1.5,z-1.0);sign.rotation.y=Math.PI;scene.add(sign);}
 }
 // Roadview shows a lower student-hall court, stairs and guarded access.
 const student=data.buildings.find(b=>b.id==='471697621');
 if(student){
  environment.polygon([[-125,-31],[-95,-31],[-95,-13],[-116,-13],[-125,-20]],surfaces.asphalt,.10);
  const courtBase=terrain.heightAt(-111,-21),deckHeight=Math.max(...[[-91,-23.4],[-91,-18.6],[-86.5,-23.4],[-86.5,-18.6]].map(p=>terrain.heightAt(...p)))+.07;
  // Photo comparison: the street deck is ABOVE the front court, not below it.
  const access=makeStairRoute([-91,-21],[-99,-21],terrain.heightAt,{width:3.2,flights:2,steps:7,landing:2.4,surfaceOffset:.12,startHeight:deckHeight,endHeight:courtBase+.12});stairs(access,'#8c7a61',true);stats.studentAccessFlights=2;
  environment.segment([-99,-21],[-111.5,-21],3.2,surfaces.paving,.12);
  for(let x=-90.98;x<-86.5;x+=.16)absBox(x,deckHeight-.065,-21,.145,.13,4.8,'#76644f');
  platforms.push({cx:-88.75,cz:-21,ux:1,uz:0,nx:0,nz:1,width:4.5,depth:4.8,height:deckHeight+.012});
  absBox(-87.15,deckHeight+.015,-21,.5,.03,4.75,'#d5bd4d');
  const dots=new THREE.InstancedMesh(new THREE.CylinderGeometry(.014,.017,.007,6),mat('#ddc957'),5*67),dot=new THREE.Object3D();let di=0;
  for(let row=0;row<5;row++)for(let col=0;col<67;col++){dot.position.set(-87.33+row*.09,deckHeight+.0335,-23.28+col*.07);dot.updateMatrix();dots.setMatrixAt(di++,dot.matrix);}dots.receiveShadow=true;scene.add(dots);
  for(const zz of[-23.52,-18.48]){for(const xx of[-90.9,-88.8,-86.7]){rail([xx,deckHeight,zz],[xx,deckHeight+1.08,zz],'#6d5945',.075);obstacles.push([xx,zz,.08]);}for(const h of[.48,.99])rail([-91,deckHeight+h,zz],[-86.5,deckHeight+h,zz],'#7c674f',.065);}
  stats.studentCourtBelowStreet=true;stats.studentCourtDrop=deckHeight-courtBase;
  const a=[-91,-29],b=[-113,-29],ha=terrain.heightAt(...a)+.15,hb=terrain.heightAt(...b)+.15;
  const positions=[a[0],ha,a[1]-1.1,a[0],ha,a[1]+1.1,b[0],hb,b[1]-1.1,b[0],hb,b[1]+1.1];
  for(const [x,z]of[[a[0],a[1]-1.1],[a[0],a[1]+1.1],[b[0],b[1]-1.1],[b[0],b[1]+1.1]])positions.push(x,Math.min(ha,hb,terrain.heightAt(x,z))-.2,z);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex([0,2,1,1,2,3,0,4,6,0,6,2,1,3,7,1,7,5,0,1,5,0,5,4,2,6,7,2,7,3]);geometry.computeVertexNormals();
  const ramp=new THREE.Mesh(geometry,mat('#bfc4b8'));ramp.receiveShadow=true;scene.add(ramp);collisionMeshes.push(ramp);ramps.push({a,b,ha,hb,width:2.2});
  for(const side of[-1,1]){const z=-29+side*1.2;rail([a[0],ha+1,z],[b[0],hb+1,z]);for(let x=-92;x>-113;x-=3){const y=ha+(hb-ha)*(x-a[0])/(b[0]-a[0]);rail([x,y,z],[x,y+1,z]);obstacles.push([x,z,.06]);}}
  for(const p of[[-121,-29],[-123,-18],[-104,-12.4]]){
   const [x,z]=p,h=terrain.heightAt(x,z);absBox(x,h+.18,z,2.8,.36,1.8,'#8c9684');absBox(x,h+.39,z,2.5,.1,1.5,'#5f6950');
   for(const dx of[-.65,0,.65])shrub(x+dx,z,.68,.66,.65,h+.4);obstacles.push([x,z,1.35]);
  }
  const islandX=-104.5,islandZ=-16,islandBase=terrain.heightAt(islandX,islandZ);
  const island=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.22,28),mat('#949c8c'));island.position.set(islandX,islandBase+.11,islandZ);island.scale.set(2.5,1,1.6);island.receiveShadow=true;scene.add(island);collisionMeshes.push(island);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.025,28),mat('#536249'));soil.position.set(islandX,islandBase+.235,islandZ);soil.scale.set(2.28,1,1.38);scene.add(soil);
  for(const dx of[-1.15,0,1.15]){shrub(islandX+dx,islandZ,.82,.56,.75,islandBase+.25);obstacles.push([islandX+dx,islandZ,.88]);}
  const base=terrain.heightAt(...student.center),center=[-117.4,-13.7],nx=.726,nz=-.688,ux=.688,uz=.726,angle=-Math.atan2(uz,ux);
  const at=(u,n)=>[center[0]+ux*u+nx*n,center[1]+uz*u+nz*n];
  const position=at(0,1.9),gallery=absBox(position[0],base+6.2,position[1],14.5,3.9,3.8,'#e0e0d4');gallery.rotation.y=angle;
  const front=at(0,3.85);
  for(const [y,h,c]of[[5.95,1.9,'#64817e'],[4.75,.12,'#bc684d'],[7.6,.12,'#bc684d'],[4.32,.45,'#e3e3d7'],[8.15,.3,'#d5d8cd']]){const m=absBox(front[0],base+y,front[1],14.6,h,.15,c);m.rotation.y=angle;}
  for(let u=-7;u<=7;u+=1.1){const p=at(u,3.96),m=absBox(p[0],base+5.95,p[1],.10,2.0,.22,'#465b5e');m.rotation.y=angle;}
  for(let y=4.5;y<8.2;y+=.22){const m=absBox(front[0],base+y,front[1],14.6,.015,.08,'#bfc4b8');m.rotation.y=angle;}
  for(const u of[-5.7,0,5.7]){const p=at(u,3.0),column=new THREE.Mesh(new THREE.CylinderGeometry(.23,.26,3.4,16),mat('#e1e3d7'));column.position.set(p[0],base+2.6,p[1]);column.castShadow=true;scene.add(column);collisionMeshes.push(column);obstacles.push([p[0],p[1],.27]);}
  const landing=at(0,2.5),slab=absBox(landing[0],base+.78,landing[1],14.3,.24,3.0,'#c4c7ba');slab.rotation.y=angle;platforms.push({cx:landing[0],cz:landing[1],ux,uz,nx,nz,width:14.3,depth:3,height:base+.912});
  const entryA=at(0,7.0),entryB=at(0,4.0),length=3,entry={a:entryA,b:entryB,ux:-nx,uz:-nz,length,width:14.0,flights:1,steps:6,split:true,treads:[]},bottom=terrain.heightAt(...entryA)+.10;
  for(let i=0;i<6;i++)entry.treads.push({from:i*.5,to:(i+1)*.5,height:bottom+(base+.9-bottom)*(i+1)/6,landing:false});stairs(entry,'#b6b8ad');
  for(let d=0;d<3;d+=.5){const p=at(0,7-d),y=bottom+(base+.9-bottom)*d/3;const m=absBox(p[0],y+.42,p[1],.24,.84,.53,'#c4c8ba');m.rotation.y=angle;obstacles.push([p[0],p[1],.14]);}
  stats.studentPorchColumns=3;stats.studentEntryTreads=6;

 }
 // Original clumps, instanced. Planting positions are reconstructed, not surveyed.
 if(shrubs.length||clippedShrubs.length){
  const shrubMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.97});
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,128,128);
   for(let i=0;i<4200;i++){const n=170+(i*37%74);ctx.fillStyle=`rgb(${n},${n},${n})`;ctx.beginPath();ctx.ellipse(i*31%128,(i*73+Math.floor(i/128)*17)%128,.8+(i%4)*.25,.5+(i%3)*.2,i*.71,0,Math.PI*2);ctx.fill();}
   const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(4,2);texture.anisotropy=4;shrubMaterial.map=texture;shrubMaterial.bumpMap=texture;shrubMaterial.bumpScale=.035;
  }
  const instanceClumps=(geometry,list,name)=>{
   if(!list.length)return;
   const mesh=new THREE.InstancedMesh(geometry,shrubMaterial,list.length),o=new THREE.Object3D(),c=new THREE.Color();
   list.forEach((s,i)=>{o.position.set(s.x,s.ground+s.h/2,s.z);o.scale.set(s.w,s.h/2,s.d);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,c.set(s.color));});mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  };
  instanceClumps(shrubGeo,shrubs,'Low reconstructed planting clumps');
  if(clippedShrubs.length){
   const rounded=new THREE.BoxGeometry(2,2,2,6,4,6),positions=rounded.attributes.position;
   const inset=new THREE.Vector3(),point=new THREE.Vector3();
   const roundPoint=p=>{inset.copy(p).clampScalar(-.72,.72);return p.sub(inset).normalize().multiplyScalar(.28).add(inset);};
   for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i);roundPoint(point);positions.setXYZ(i,point.x,point.y,point.z);}rounded.computeVertexNormals();
   instanceClumps(rounded,clippedShrubs,'Roadview2026 library rounded hedge masses');
   // Small original leaf surfaces break the smooth solid silhouette. These are
   // reconstructed foliage, not sampled image pixels or additional plant sites.
   const perCrown=220,leaves=new THREE.InstancedMesh(new THREE.CircleGeometry(1,5),new THREE.MeshStandardMaterial({color:'#fff',roughness:1,side:THREE.DoubleSide}),clippedShrubs.length*perCrown),leaf=new THREE.Object3D(),color=new THREE.Color(),normal=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1);
   const rand=n=>{const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);};
   let next=0;
   for(const [ci,crown]of clippedShrubs.entries())for(let j=0;j<perCrown;j++){
    const seed=ci*perCrown+j,face=j%5,u=rand(seed+17)*2-1,v=rand(seed+71)*2-1;
    point.set(face<2?(face===0?-1:1):u,face===4?1:v,face===2?-1:face===3?1:face===4?v:u);roundPoint(point);
    inset.copy(point).clampScalar(-.72,.72);normal.copy(point).sub(inset).normalize();
    leaf.position.set(crown.x+point.x*crown.w+normal.x*.018,crown.ground+crown.h/2+point.y*crown.h/2+normal.y*.018,crown.z+point.z*crown.d+normal.z*.018);
    leaf.quaternion.setFromUnitVectors(forward,normal);leaf.rotateZ(rand(seed+91)*Math.PI);const size=.038+rand(seed+31)*.032;leaf.scale.set(size,size*.56,1);leaf.updateMatrix();leaves.setMatrixAt(next,leaf.matrix);
    color.set(crown.color).multiplyScalar(.82+rand(seed+101)*.43);leaves.setColorAt(next++,color);
   }
   leaves.name='Fine leaves on clipped library planting';leaves.receiveShadow=true;scene.add(leaves);
  }
 }

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
  for(const p of platforms){const dx=x-p.cx,dz=z-p.cz;if(Math.abs(dx*p.ux+dz*p.uz)<=p.width/2&&Math.abs(dx*p.nx+dz*p.nz)<=p.depth/2)return p.height;}
  return fallbackHeightAt(x,z);
 }};
}
