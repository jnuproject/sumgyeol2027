import {addObservedPeriphery} from './periphery.js?v=identity-r24g';
import {createSceneScope} from './scene-scope.js?v=identity-r24g';
import {FOCUS_BUILDING_PROFILES,createFocusWallMaterials,addFocusFacade} from './focus-architecture.js?v=identity-r24g';
import {addFocusDetails} from './focus-details.js?v=identity-r24g';
import {addCampusObservedDetails} from './campus-observed-details.js?v=identity-r24g';
import {addObservedEntrance} from './entrance-observed.js?v=identity-r24g';
import {BUILDING_PROFILES,addObservedFacade,observedMassParts} from './observed-campus.js?v=identity-r24g';
import {addSportsGrounds} from './sports-ground.js?v=identity-r24g';
import * as THREE from './three.module.js';
import { insidePolygon, segmentDistance } from './navigation.js';
import { loadCampusMaterials, glassMaterial } from './materials.js?v=identity-r24g';
import { addVegetation } from './vegetation.js?v=identity-r24g';
import { loadCampusTerrain } from './terrain.js?v=identity-r24g';
import { addCampusEnvironment } from './environment.js?v=identity-r24g';

export async function createCampus(scene,data) {
const [surfaces,terrain]=await Promise.all([loadCampusMaterials(),loadCampusTerrain(data)]);const glass=glassMaterial();
const sceneScope=createSceneScope(data),visibleData=sceneScope.visibleData;
const environment=addCampusEnvironment(scene,visibleData,terrain,surfaces,sceneScope);
const focusWallMaterials=createFocusWallMaterials();
let foundationBase=null;const buildingBases=new Map();
const baseAt=(x,z)=>foundationBase??terrain.heightAt(x,z);
const unitBox=new THREE.BoxGeometry(1,1,1);
// Independently drawn horizontal basalt courses, observed on the entrance piers.
const basaltCanvas=document.createElement('canvas');basaltCanvas.width=basaltCanvas.height=512;
const basaltContext=basaltCanvas.getContext('2d');basaltContext.fillStyle='#303732';basaltContext.fillRect(0,0,512,512);
for(let row=0;row<8;row++)for(let col=-1;col<3;col++){const shade=58+((row*19+col*13+71)%12);const x=col*256+(row%2)*128;basaltContext.fillStyle=`rgb(${shade},${shade+4},${shade+2})`;basaltContext.fillRect(x+1,row*64+2,254,60);for(let dot=0;dot<110;dot++){const n=(dot*37+row*61+col*43+8192)%8192;basaltContext.fillStyle=dot%3?'#424b45':'#68716a';basaltContext.fillRect(x+(n%252),row*64+(n*17%58)+3,1,1);}}
const basalt=surfaces.stone.clone();basalt.color.set('#c0c7c0');basalt.map=new THREE.CanvasTexture(basaltCanvas);basalt.map.colorSpace=THREE.SRGBColorSpace;basalt.map.wrapS=basalt.map.wrapT=THREE.RepeatWrapping;basalt.normalMap=null;basalt.bumpMap=basalt.map;basalt.bumpScale=.03;basalt.onBeforeCompile=surfaces.stone.onBeforeCompile;basalt.customProgramCacheKey=()=>surfaces.stone.customProgramCacheKey()+'-observed-basalt';

const mats={};
const surfaceColors={'#afbba0':surfaces.grass,'#9cac83':surfaces.grass,'#7c956b':surfaces.grass,'#83a67e':surfaces.grass,'#68756d':surfaces.asphalt,'#d0c5a9':surfaces.paving,'#4d5350':basalt,'#62685c':basalt,'#aa8277':surfaces.redPaving};
function mat(c){if(surfaceColors[c])return surfaceColors[c];if(['#64817e','#537e84','#465959','#364d4e','#243b3a'].includes(c))return glass;return mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.78}));}
const collisions=[],collisionMeshes=[environment.terrainMesh],obstacles=[];
function box(x,y,z,w,h,d,c,parent=scene){const o=new THREE.Mesh(unitBox,mat(c));o.position.set(x,y+(parent===scene?baseAt(x,z):0),z);o.scale.set(w,h,d);o.userData.batch=true;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function label() {}
function footprint(points,height,color,y=0){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,mat(color));mesh.position.y=y+(foundationBase??0);mesh.receiveShadow=true;mesh.castShadow=height>1;if(height>1)collisionMeshes.push(mesh);scene.add(mesh);return mesh}
// Ground, OSM areas, roads and sidewalks share the measured terrain mesh.
const observedModels=new Set(['471490497','471697017']);
function panelAlong(a,b,t,y,w,h,depth,color,offset=0){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);const nx=dz/len,nz=-dx/len;const o=box(a[0]+dx*t+nx*offset,y,a[1]+dz*t+nz*offset,w,h,depth,color);o.rotation.y=-Math.atan2(dz,dx);return o}
function edgesDetail(b,levels,glass,trim,spacing=4){for(let i=1;i<b.points.length;i++){const a=b.points[i-1],e=b.points[i],len=Math.hypot(e[0]-a[0],e[1]-a[1]);if(len<4)continue;const count=Math.max(1,Math.floor(len/spacing));for(let n=0;n<count;n++){const t=(n+.5)/count;for(let floor=0;floor<levels;floor++)panelAlong(a,e,t,2.4+floor*4,Math.min(2.3,len/count*.65),2.4,.22,glass);panelAlong(a,e,t,6,.35,10,.4,trim);}}}
for(const b of visibleData.buildings){
 foundationBase=terrain.heightAt(b.center[0],b.center[1]);buildingBases.set(b.id,foundationBase);
 // A simple foundation closes the downhill gap without warping the preserved building.
 const low=Math.min(...b.points.map(p=>terrain.heightAt(p[0],p[1])));
 if(foundationBase-low>.12){const saved=foundationBase;foundationBase=low;footprint(b.points,saved-low+.2,'#a1a397');foundationBase=saved;}
 const main=b.id==='471490497',museum=b.id==='471697017';const profile=FOCUS_BUILDING_PROFILES[b.id]??BUILDING_PROFILES[b.id];const h=profile?.height??(museum?18:b.height);
 const palette=['#e6e9e4','#e9e7df','#dce3e0','#e5e9e7'];const color=profile?.wall??(museum?'#79545d':b.tags.building==='dormitory'?'#d1c9bd':palette[Number(b.id)%4]);
 for(const part of observedMassParts(b,h)){const wall=footprint(part.points,part.height,color,part.y);wall.name='focus-building-'+b.id;if(!museum)wall.material=focusWallMaterials[b.id]??new THREE.MeshStandardMaterial({color,roughness:.88});footprint(part.points,.3,profile?.roof??(museum?'#655b59':'#7db6a0'),part.y+part.height);}collisions.push(b.points);
 for(let i=1;i<b.points.length;i++){
  const a=b.points[i-1],e=b.points[i],l=Math.hypot(e[0]-a[0],e[1]-a[1]);if(l<1)continue;
  const edgeHeight=b.id==='471697621'&&(a[1]+e[1])*.5<1?8.4:h;
  panelAlong(a,e,.5,edgeHeight+.65,l,.45,.28,museum?'#605b5c':'#b2b5b1');
  panelAlong(a,e,.5,.6,l,.8,.28,'#abaeaa');
 }

 if(main){addObservedFacade({scene,b,height:h,panel:panelAlong,box,base:foundationBase});
 }else if(museum){
 // West-facing burgundy-stone facade and blue-green curtain glazing observed in the entrance photograph.
 const a=b.points[0],e=b.points[1],L=Math.hypot(e[0]-a[0],e[1]-a[1]);
 panelAlong(a,e,.53,15.2,L*.74,3.6,.4,'#537e84',-.27);
 panelAlong(a,e,.5,18.15,L+1.4,.35,2.1,'#696d6b',-.35);
 panelAlong(a,e,.45,.22,15,.16,10,'#aa8277',-4.7);
 for(let t of[.18,.39,.6,.81]){
  const nx=(e[1]-a[1])/L,nz=-(e[0]-a[0])/L;
  for(const [y,h]of [[3.1,6.2],[15.4,5.2]]){const column=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,h,16),mat('#936a68'));column.position.set(a[0]+(e[0]-a[0])*t-nx*.67,y+foundationBase,a[1]+(e[1]-a[1])*t-nz*.67);column.castShadow=true;column.receiveShadow=true;scene.add(column);}
 }
 panelAlong(a,e,.53,9.3,L*.68,6.1,.35,'#537e84',-.2);panelAlong(a,e,.53,12.65,L*.74,.45,2,'#597774',-.4);
 for(let i=0;i<=12;i++)panelAlong(a,e,.19+i*.056,9.3,.12,6.1,.5,'#353f3b',-.35);
 for(let y of[6.3,8.4,10.5,12.3])panelAlong(a,e,.53,y,L*.68,.12,.5,'#414a44',-.35);
 for(let t of[.18,.39,.6,.81]){panelAlong(a,e,t,3.1,.8,6.2,.85,'#795557',-.45);panelAlong(a,e,t,15.4,.8,5.2,.85,'#936a68',-.45)}
 panelAlong(a,e,.45,2.5,6.8,4.8,.4,'#243b3a',-.45);panelAlong(a,e,.45,5.2,8,.6,3.5,'#b1b7ae',-1.4);
 for(let i=1;i<b.points.length;i++){const p=b.points[i-1],q=b.points[i];for(let t of[.12,.88])panelAlong(p,q,t,8,1.3,3,.3,'#aab9b5')}
 label('제주대학교 박물관 · 사진 참고',b.center[0],h+5,b.center[1],1.15);
 }else { if(!addFocusFacade({scene,b,height:h,panel:panelAlong,box,base:foundationBase})&&!addObservedFacade({scene,b,height:h,panel:panelAlong,box,base:foundationBase}))genericFacade(b,h); }
 foundationBase=null;
}
// The main roadway stays open: paired basalt piers frame SIDEWALKS, never an invented road-spanning arch.
const gateX=data.spawn[0],gateZ=data.spawn[1];
function stonePillar(x,z,h,w=1.7){box(x,h/2,z,w,h,1.65,'#4d5350');box(x,h+.07,z,w+.15,.17,1.8,'#62685c');obstacles.push([x,z,w*.65]);}
function disc(x,y,z,r,c){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.14,20),mat(c));o.rotation.x=Math.PI/2;o.position.set(x,y+baseAt(x,z),z);scene.add(o)}

for(const side of[-1,1]){
 const inner=gateX+side*10,outer=gateX+side*18;
 stonePillar(inner,gateZ,7.4,1.7);stonePillar(outer,gateZ,4.8,1.6);
 // Re-observed in dated Kakao Roadview2026-03: a low, shallow connector.
 // Older news photographs and their inferred pitched roof are excluded.
 box(gateX+side*14,4.25,gateZ,7.3,.30,1.1,'#62685c');
 box(gateX+side*14,4.43,gateZ,7.6,.12,1.4,'#9c9e94');

 box(inner,.16,gateZ,2.1,.32,2.0,'#8d9487');box(outer,.16,gateZ,2.0,.32,1.95,'#8d9487');
 for(let y of[5.05,5.95,6.85]){disc(inner,y,gateZ-.88,.31,'#7f8982');disc(inner,y,gateZ-.97,.24,'#adb4ad');disc(inner,y,gateZ-1.06,.17,'#6f817d');}
 box(inner,2.6,gateZ-.9,.36,2,.08,'#546857');
 // No dolharubang at this entrance in the current Roadview; user confirms removal.
 for(const y of[3.38,3.88,4.38]){disc(outer,y,gateZ-.88,.12,'#a4aba1');disc(outer,y,gateZ-.97,.08,'#626c62');}
}

label('제주대학교 정문 · 사진 참고',gateX,11,gateZ,1.1);
const boundaryLine=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(data.boundary.map(p=>new THREE.Vector3(p[0],terrain.heightAt(p[0],p[1])+.04,p[1]))),new THREE.LineBasicMaterial({color:'#73866b'}));// The full-campus source outline is deliberately omitted from the focused scene.
const extentPoints=[...data.boundary,...data.roads.flatMap(r=>r.points)];
const bounds={minX:Math.max(terrain.worldBounds.minX+.5,Math.min(...extentPoints.map(p=>p[0]))-10),maxX:Math.min(terrain.worldBounds.maxX-.5,Math.max(...extentPoints.map(p=>p[0]))+10),minZ:Math.max(terrain.worldBounds.minZ+.5,Math.min(...extentPoints.map(p=>p[1]))-10),maxZ:Math.min(terrain.worldBounds.maxZ-.5,Math.max(...extentPoints.map(p=>p[1]))+10)};

const observedEntrance=addObservedEntrance({scene,data,terrain,environment,box,basalt,collisions,collisionMeshes,obstacles,surfaces});
const vegetation=addVegetation(scene,data,terrain.heightAt,sceneScope.treeVisible);obstacles.push(...vegetation.obstacles);
addEntranceDetails();
const observedDetails=addCampusObservedDetails({scene,data:visibleData,terrain,environment,surfaces,box,collisionMeshes,obstacles,visibleAt:(x,z)=>sceneScope.renderDistance(x,z)<20});
const focusDetails=addFocusDetails({scene,data:visibleData,terrain,environment,surfaces,box,collisionMeshes,obstacles,fallbackHeightAt:observedDetails.heightAt});const periphery=addObservedPeriphery({scene,data:visibleData,terrain,environment,surfaces,box,obstacles,collisionMeshes});environment.flush();

// Instance static details by material to keep the scene responsive.
scene.updateMatrixWorld(true);
const batches=new Map(),originals=[];
scene.traverse(o=>{if(o.isMesh&&o.userData.batch){const key=o.material.uuid+':'+o.castShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);originals.push(o);}});
for(const objects of batches.values()){
 const batch=new THREE.InstancedMesh(unitBox,objects[0].material,objects.length);
 objects.forEach((o,i)=>batch.setMatrixAt(i,o.matrixWorld));batch.castShadow=objects[0].castShadow;batch.receiveShadow=true;scene.add(batch);
}
originals.forEach(o=>o.removeFromParent());

function genericFacade(b,h){
 for(let i=1;i<b.points.length;i++){
  const a=b.points[i-1],e=b.points[i],length=Math.hypot(e[0]-a[0],e[1]-a[1]);
  if(length<5)continue;
  const nx=(e[1]-a[1])/length,nz=-(e[0]-a[0])/length;
  const outward=insidePolygon((a[0]+e[0])/2+nx*.3,(a[1]+e[1])/2+nz*.3,b.points)?-1:1;
  const count=Math.floor(length/3.6),levels=Math.max(1,Math.min(5,Math.round(h/3.5)));
  for(let n=0;n<count;n++)for(let floor=0;floor<levels;floor++){
   const t=(n+.5)/count,y=2.2+floor*3.5;
   panelAlong(a,e,t,y,2.02,1.95,.2,'#656d70',.12*outward);
   panelAlong(a,e,t,y,1.8,1.72,.25,'#64817e',.16*outward);
   panelAlong(a,e,t,y,.075,1.82,.31,'#b8bebc',.2*outward);
   panelAlong(a,e,t,y-.96,2.2,.12,.5,'#c9ccc7',.2*outward);
  }
 }
}
function sign(text,x,y,z,w,h,bg='#254d61',fg='#f4f5ef'){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;ctx.font='500 88px Pretendard, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.6,side:THREE.DoubleSide}));mesh.position.set(x,y+baseAt(x,z),z);mesh.rotation.y=Math.PI;scene.add(mesh);return mesh;
}
function addEntranceDetails(){
 // Entrance fixtures retained; the separate Roadview pass adds the observed canopy, median and roadside office.
 for(const side of[-1,1]){
  environment.polygon([[gateX+side*14-3,gateZ-4.5],[gateX+side*14+3,gateZ-4.5],[gateX+side*14+3,gateZ+2.5],[gateX+side*14-3,gateZ+2.5]],surfaces.paving,.055);
  for(let z=gateZ+26;z<-150;z+=47){
   const x=gateX+side*10.0;foundationBase=terrain.heightAt(x,z);
   box(x,4.1,z,.12,8.2,.12,'#646c6d');box(x-side*.9,8.14,z,1.9,.12,.12,'#646c6d');box(x-side*1.7,8.08,z,.65,.14,.35,'#d8dcda');obstacles.push([x,z,.4]);foundationBase=null;
  }
 }
 for(const side of[-1,1]){
  const plaque=document.createElement('canvas');plaque.width=128;plaque.height=512;const g=plaque.getContext('2d');g.fillStyle='#4e6557';g.fillRect(0,0,128,512);g.fillStyle='#e8e9d8';g.font='500 64px Pretendard,sans-serif';g.textAlign='center';[...'제주대학교'].forEach((letter,i)=>g.fillText(letter,64,90+i*85));
  const t=new THREE.CanvasTexture(plaque);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(.32,1.8),new THREE.MeshStandardMaterial({map:t,roughness:.8}));m.position.set(gateX+side*10,2.6+terrain.heightAt(gateX+side*10,gateZ),gateZ-.96);m.rotation.y=Math.PI;scene.add(m);
 }
 // A restrained, photo-informed central island. Exact dimensions are estimated.
 foundationBase=terrain.heightAt(gateX,gateZ+35);
 box(gateX,.35,gateZ+34,1.6,.42,8,'#d5b94f');
 box(gateX,1.8,gateZ+35,1.35,2.8,3.4,'#e1dfd6');
 box(gateX,3.3,gateZ+35,1.7,.25,3.8,'#535d63');
 box(gateX,2.25,gateZ+33.27,1.15,1.3,.05,'#64817e');obstacles.push([gateX,gateZ+35,2.2]);
 box(gateX-.7,2.2,gateZ+35,.06,1.25,2.7,'#64817e');box(gateX+.7,2.2,gateZ+35,.06,1.25,2.7,'#64817e');
 sign('출입관리',gateX,2.65,gateZ+33.2,1.15,.27,'#315c78');foundationBase=null;
 // Museum paving and panel seams.
 const museum=visibleData.buildings.find(b=>b.id==='471697017');
 if(museum){foundationBase=buildingBases.get(museum.id);const a=museum.points[0],b=museum.points[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let y=1;y<18;y+=1.15)panelAlong(a,b,.5,y,len,.024,.06,'#674c52',-.18);
  for(let t=.03;t<1;t+=.048)panelAlong(a,b,t,9,.025,18,.06,'#674c52',-.18);
  const dx=b[0]-a[0],dz=b[1]-a[1];const museumSign=sign('JEJU NATIONAL UNIVERSITY MUSEUM',a[0]+dx*.53-dz/len*.6,6.3,a[1]+dz*.53+dx/len*.6,len*.62,.64,'#516b75');museumSign.rotation.y=-Math.atan2(dz,dx);foundationBase=null;
 }

}
return {bounds,visibleData,renderedBuildingIds:visibleData.buildings.map(b=>b.id),periphery:periphery.stats,entrySpawn:observedEntrance.entrySpawn,observedEntrance,observedDetails:observedDetails.stats,focusDetails:focusDetails.stats,focusRoutes:focusDetails.routes,walkCollisionPolygons:collisions,collisionMeshes,cameraCollisionMeshes:collisionMeshes.filter(o=>!o.userData.campusTerrain),treeCount:vegetation.treeCount,obstacles,heightAt:terrain.heightAt,walkHeightAt:focusDetails.heightAt,groundHeightAt:terrain.heightAt,terrain,environmentStats:environment.stats,buildingBases,vegetationStats:vegetation};
}

export function makeAvatar(scene){
 const player=new THREE.Group(),body=new THREE.Group();player.add(body);scene.add(player);player.scale.setScalar(.74);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.85});
 function mesh(geo,color,x,y,z,parent=body){const o=new THREE.Mesh(geo,material(color));o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
 mesh(new THREE.CapsuleGeometry(.4,.55,3,8),'#5f9fba',0,1.3,0);
 mesh(new THREE.SphereGeometry(.39,12,8),'#e3b28b',0,2.12,0);
 const cap=mesh(new THREE.SphereGeometry(.42,12,6,0,Math.PI*2,0,Math.PI/2),'#315f75',0,2.17,0);
 mesh(new THREE.BoxGeometry(.75,.09,.6),'#315f75',0,2.2,.27);
 mesh(new THREE.BoxGeometry(.61,.68,.3),'#c1c8c4',0,1.35,-.42);
 mesh(new THREE.BoxGeometry(.42,.25,.08),'#66e1ff',0,1.25,-.61);
 for(const x of [-.14,.14])mesh(new THREE.SphereGeometry(.035,6,4),'#263a31',x,2.1,.36);
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.21,.9,0);body.add(leg);legs.push(leg);
  mesh(new THREE.CapsuleGeometry(.15,.46,2,6),'#436773',0,-.34,0,leg);mesh(new THREE.BoxGeometry(.32,.18,.5),'#f2ebd5',0,-.76,.1,leg);
  const arm=new THREE.Group();arm.position.set(side*.47,1.6,0);body.add(arm);arms.push(arm);mesh(new THREE.CapsuleGeometry(.12,.44,2,6),'#e3b28b',0,-.28,0,arm);
 }
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.85,24),new THREE.MeshBasicMaterial({color:'#263f31',opacity:.12,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.27;player.add(shadow);
 return {player,body,legs,arms,shadow};
}
