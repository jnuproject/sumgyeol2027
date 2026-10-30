import {createCampusEscalator} from './campus-escalator.js?v=together-r49';
import {MAIN_AVENUE_WIDTH,MAIN_AVENUE_SIDEWALK_WIDTH} from './road-profile.js?v=together-r49';
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
 const escalator=createCampusEscalator({scene,data,terrain,collisionMeshes,obstacles});
 if(escalator){
  const {layout,at,profileAt}=escalator;
  environment.polygon([at(-4.2,-2.7),at(-4.2,4.4),at(0,4.4),at(0,-2.7)],surfaces.paving,.035);
  const sharedHeight=(x,z)=>profileAt((x-layout.a[0])*layout.ux+(z-layout.a[1])*layout.uz);
  const route=makeStairRoute(at(0,layout.stairs.side),at(layout.length,layout.stairs.side),sharedHeight,{width:layout.stairs.width,surfaceOffset:0});
  // Each horizontal tread must clear the hillside beneath its entire depth,
  // rather than sharing only the centre-line height at the end of a flight.
  for(const t of route.treads){for(let d=t.from;d<t.to;d+=.15)t.height=Math.max(t.height,profileAt(d));t.height=Math.max(t.height,profileAt(t.to));}
  route.id='library-ascent';stairs(route);stats.ascentFlights=route.flights;stats.ascentTreads=route.flights*route.steps;stats.escalator=escalator.stats;
 }
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
  const streetShift=data.renderRoadCorrections?.mainAvenue?data.renderRoadCorrections.mainAvenue.axisX-MAIN_AVENUE_WIDTH/2-MAIN_AVENUE_SIDEWALK_WIDTH/2+88.75:0,sx=x=>x+streetShift;
  environment.polygon([[-125,-31],[-95,-31],[-95,-13],[-116,-13],[-125,-20]],surfaces.asphalt,.10);
  // A compact half-round timber deck sits against the roadside. Its short
  // access stair stops beside it; the forecourt has no cross-court ramp.
  const cx=sx(-91.85),cz=-21,radius=3.3,clip=3.0;
  const courtBase=terrain.heightAt(cx-4.8,cz),deckHeight=terrain.heightAt(sx(-88.75),cz)+.06;
  const outline=Array.from({length:49},(_,i)=>{const a=-Math.PI/2+i*Math.PI/48;return [Math.max(cx-clip,cx-Math.cos(a)*radius),cz+Math.sin(a)*radius];});
  const shape=new THREE.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const deckGeometry=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false});deckGeometry.rotateX(-Math.PI/2);
  const deck=new THREE.Mesh(deckGeometry,mat('#8b7960'));deck.position.y=deckHeight-.22;deck.receiveShadow=true;deck.castShadow=true;deck.name='Student hall half-round roadside deck';scene.add(deck);collisionMeshes.push(deck);
  platforms.push({type:'semicircle',cx,cz,radius,clip,height:deckHeight+.012});
  for(let z=cz-radius+.15;z<cz+radius;z+=.16){const dx=Math.min(clip,Math.sqrt(radius*radius-(z-cz)**2));rail([cx-dx,deckHeight+.004,z],[cx,deckHeight+.004,z],'#a08b70',.009);}
  const access=makeStairRoute([cx-clip,cz],[cx-clip-1.8,cz],terrain.heightAt,{width:2.5,flights:1,steps:4,landing:0,startHeight:deckHeight,endHeight:courtBase+.12});stairs(access,'#8c7a61',true);
  access.id='student-deck-access';stats.studentAccessFlights=1;
  for(let i=1;i<outline.length;i++){
   const a=outline[i-1],b=outline[i];if(Math.abs((a[1]+b[1])/2-cz)<1.4)continue;
   for(const h of[.5,1.0])rail([a[0],deckHeight+h,a[1]],[b[0],deckHeight+h,b[1]],'#7c674f',.045);
   if(i%5===0){rail([b[0],deckHeight,b[1]],[b[0],deckHeight+1.05,b[1]],'#6d5945',.06);obstacles.push([b[0],b[1],.07]);}
  }
  stats.studentDeck={shape:'semicircle',center:[cx,cz],radius,clip,stairLength:access.length,stairTreads:4,crossCourtRamp:false};
  stats.studentCourtBelowStreet=true;stats.studentCourtDrop=deckHeight-courtBase;
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
  for(const [y,h,c]of[[5.95,1.9,'#445451'],[4.75,.09,'#bd7459'],[7.6,.09,'#bd7459'],[4.32,.45,'#e3e3d7'],[8.15,.3,'#d5d8cd']]){const m=absBox(front[0],base+y,front[1],14.6,h,.15,c);m.rotation.y=angle;}
  for(let u=-7;u<=7;u+=1.1){const p=at(u,3.96),m=absBox(p[0],base+5.95,p[1],.075,2.0,.22,'#2e3734');m.rotation.y=angle;}
  for(let y=4.5;y<8.2;y+=.22){const m=absBox(front[0],base+y,front[1],14.6,.015,.08,'#bfc4b8');m.rotation.y=angle;}
  for(const u of[-5.7,0,5.7]){const p=at(u,3.0),column=new THREE.Mesh(new THREE.CylinderGeometry(.23,.26,3.4,16),mat('#e1e3d7'));column.position.set(p[0],base+2.6,p[1]);column.castShadow=true;scene.add(column);collisionMeshes.push(column);obstacles.push([p[0],p[1],.27]);}
  const landing=at(0,2.0),slab=absBox(landing[0],base+.38,landing[1],12.0,.18,3.0,'#c4c7ba');slab.rotation.y=angle;platforms.push({cx:landing[0],cz:landing[1],ux,uz,nx,nz,width:12,depth:3,height:base+.482});
  const entryA=at(0,4.7),entryB=at(0,3.5),length=1.2,entry={a:entryA,b:entryB,ux:-nx,uz:-nz,length,width:10.2,flights:1,steps:3,split:false,treads:[]},bottom=terrain.heightAt(...entryA)+.10;
  for(let i=0;i<3;i++)entry.treads.push({from:i*.4,to:(i+1)*.4,height:bottom+(base+.47-bottom)*(i+1)/3,landing:false});stairs(entry,'#b6b8ad');
  const doors=at(0,.20),glazing=absBox(doors[0],base+2.2,doors[1],10,3.4,.12,'#344b4b');glazing.rotation.y=angle;
  for(const u of[-4.5,-3,-1.5,0,1.5,3,4.5]){const p=at(u,.31),m=absBox(p[0],base+2.2,p[1],.06,3.4,.10,'#afbab4');m.rotation.y=angle;}
  // Entrance photo: tiled parapet and name, round blue stair head and
  // an open paved forecourt beneath the three white columns.
  const parapet=at(0,3.96),nameBacking=absBox(parapet[0],base+8.65,parapet[1],14.8,.78,.22,'#e0e0d4');nameBacking.rotation.y=angle;
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,768,128);ctx.fillStyle='#354b55';ctx.font='500 74px Pretendard,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('학 생 회 관',384,66);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const name=new THREE.Mesh(new THREE.PlaneGeometry(5,.58),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.8,side:THREE.DoubleSide}));const p=at(0,4.10);name.position.set(p[0],base+8.68,p[1]);name.rotation.y=Math.atan2(nx,nz);name.name='Student hall entrance name';scene.add(name);
  }
  const stairHead=new THREE.Mesh(new THREE.CylinderGeometry(2.05,2.05,2.8,32),mat('#748f98'));stairHead.position.set(-138.7,base+9.9,-26.5);stairHead.castShadow=true;stairHead.receiveShadow=true;stairHead.name='Student hall round glazed stair head';scene.add(stairHead);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(2.14,2.14,.22,32),mat('#c6cdc7'));cap.position.set(-138.7,base+11.4,-26.5);scene.add(cap);
  for(let i=0;i<14;i++){const a=i*Math.PI/7,px=-138.7+Math.cos(a)*2.065,pz=-26.5+Math.sin(a)*2.065;absBox(px,base+9.9,pz,.065,2.7,.065,'#415754');}
  stats.photoEntrance=true;
  stats.studentPorchColumns=3;stats.studentEntryTreads=3;

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
 return {stats,routes,ramps,update:dt=>escalator?.update(dt),conveyorAt:(x,z)=>escalator?.conveyorAt(x,z),heightAt(x,z){
  const transportHeight=escalator?.heightAt(x,z);if(transportHeight!=null)return Math.max(transportHeight,fallbackHeightAt(x,z));
  for(const route of routes){const h=stairRouteHeight(route,x,z);if(h!==null)return h;}
  for(const r of ramps)if(Math.abs(z-r.a[1])<=r.width/2&&x<=r.a[0]&&x>=r.b[0])return r.ha+(r.hb-r.ha)*(x-r.a[0])/(r.b[0]-r.a[0])+.012;
  for(const p of platforms){const dx=x-p.cx,dz=z-p.cz;if(p.type==='semicircle'){if(dx<=0&&dx>=-p.clip&&dx*dx+dz*dz<=p.radius*p.radius)return p.height;continue;}if(Math.abs(dx*p.ux+dz*p.uz)<=p.width/2&&Math.abs(dx*p.nx+dz*p.nz)<=p.depth/2)return p.height;}
  return fallbackHeightAt(x,z);
 }};
}
