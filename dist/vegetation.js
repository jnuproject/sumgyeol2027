import {insideFocusClearance} from './focus-details.js?v=surroundings-r25d';
import * as THREE from './three.module.js';
import {insidePolygon,segmentDistance} from './navigation.js';
import {insideEntranceOffice} from './entrance-observed.js?v=surroundings-r25d';
import {roadWidth,roadWidthAt} from './road-profile.js?v=surroundings-r25d';

// OSM supplies the woodland/park extents. Individual trees, canopy sizes and
// the photo-informed entrance avenue remain a deterministic visual reconstruction.

function seededRandom(seed){let state=seed;return()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);}
function edgeDistance(x,z,points){let distance=Infinity;for(let i=0,j=points.length-1;i<points.length;j=i++)distance=Math.min(distance,segmentDistance(x,z,points[j],points[i]));return distance;}

export function generateVegetationLayout(data){
 const random=seededRandom(580021),points=[],buckets=new Map(),cell=7.2;
 const forestAreas=data.areas.filter(a=>a.tags.natural==='wood'||a.tags.landuse==='forest');
 const parkAreas=data.areas.filter(a=>a.tags.leisure==='park'||a.tags.landuse==='grass');
 const openAreas=data.areas.filter(a=>a.tags.natural==='water'||['pitch','track','playground'].includes(a.tags.leisure)||a.tags.amenity==='parking');
 const roads=data.roads.flatMap(r=>{
  const width=roadWidth(r);
  const clearance=width/2+(r.id==='286085067'?3.5:2.2);
  return r.points.slice(1).map((b,i)=>({a:r.points[i],b,clearance,width,main:r.id==='286085067',road:r}));
 });
 const buildings=data.buildings.map(b=>({points:b.points,minX:Math.min(...b.points.map(p=>p[0])),maxX:Math.max(...b.points.map(p=>p[0])),minZ:Math.min(...b.points.map(p=>p[1])),maxZ:Math.max(...b.points.map(p=>p[1]))}));
 const pitch=data.areas.find(a=>a.id==='286070859');
 const sportsCenter=pitch?[(Math.min(...pitch.points.map(p=>p[0]))+Math.max(...pitch.points.map(p=>p[0])))/2,(Math.min(...pitch.points.map(p=>p[1]))+Math.max(...pitch.points.map(p=>p[1])))/2]:null;
 const blocked=(x,z,h,type)=>{
  if(insideFocusClearance(x,z,data))return true;
  if(insideEntranceOffice(x,z,data,Math.max(4,h*.4)))return true;
  if(sportsCenter&&Math.hypot(x-sportsCenter[0],Math.max(0,Math.abs(z-sportsCenter[1])-42.2))<50.5)return true;
  if(Math.hypot(x-data.spawn[0],z-data.spawn[1])<9)return true;
  if(roads.some(r=>segmentDistance(x,z,r.a,r.b)<(type==='avenue'&&r.main?roadWidthAt(r.road,x,z)/2+.65:r.main?roadWidthAt(r.road,x,z)/2+3.5:r.clearance)))return true;
  if(openAreas.some(a=>insidePolygon(x,z,a.points)))return true;
  // Keep crown-sized clearance from walls, as well as collision clearance.
  const margin=Math.max(3.5,h*.30);
  return buildings.some(b=>x>b.minX-margin&&x<b.maxX+margin&&z>b.minZ-margin&&z<b.maxZ+margin&&(insidePolygon(x,z,b.points)||edgeDistance(x,z,b.points)<margin));
 };
 function add(x,z,h,type,areaId=null){
  if(points.length>=3300||blocked(x,z,h,type))return false;
  const bx=Math.floor(x/cell),bz=Math.floor(z/cell),spacing=type==='avenue'?7.2:type==='forest'?6.1:6.8;
  for(let ix=bx-1;ix<=bx+1;ix++)for(let iz=bz-1;iz<=bz+1;iz++)for(const p of buckets.get(ix+','+iz)||[])if(Math.hypot(p.x-x,p.z-z)<spacing)return false;
  const p={x,z,h,variation:random(),type,areaId};points.push(p);
  const key=bx+','+bz;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(p);return true;
 }
 // Two foreground branching trees frame the new student hall in the dated
 // March2026 Roadview. Positions/heights are estimates, outside access routes.
 add(-89.5,-35.2,11.2,'deciduous');
 add(-89.5,-10.4,10.4,'deciduous');
 // Preserve the existing photograph-informed double avenue. Its exact tree
 // positions were not surveyed; the road centreline remains the original OSM line.
 const avenue=data.roads.find(r=>r.id==='286085067');
 if(avenue)for(let i=1;i<avenue.points.length;i++){
  const a=avenue.points[i-1],b=avenue.points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(len<.01||Math.min(a[1],b[1])>30)continue;
  for(let d=8;d<len;d+=10.5)for(const side of[-1,1]){
   const px=a[0]+dx*d/len,pz=a[1]+dz*d/len;
   const offset=roadWidthAt(avenue,px,pz)/2+1.1+random()*.35;
   add(a[0]+dx*d/len+side*dz/len*offset,a[1]+dz*d/len-side*dx/len*offset,11.2+random()*2.2,'avenue');
  }
 }
 // The photographed park beside the student approach includes a small dark,
 // conical evergreen group. The OSM park bounds constrain this estimated row.
 const studentPark=data.areas.find(a=>a.id==='969694343');
 if(studentPark)for(const [i,z]of[-70,-61,-52].entries())if(insidePolygon(-106,z,studentPark.points))add(-106,z,6.8+i*.35,'conifer',studentPark.id);
 for(const area of forestAreas){
  const xs=area.points.map(p=>p[0]),zs=area.points.map(p=>p[1]),step=8.2;
  for(let z=Math.min(...zs)+step*.5;z<Math.max(...zs);z+=step)for(let x=Math.min(...xs)+step*.5;x<Math.max(...xs);x+=step){
   const px=x+(random()-.5)*6,pz=z+(random()-.5)*6;
   if(insidePolygon(px,pz,area.points)&&insidePolygon(px,pz,data.boundary))add(px,pz,11+random()*5,'forest',area.id);
  }
 }
 // Parks stay open: sparse trees are restricted to the park perimeter, never
 // scattered across mapped sports fields, water or parking areas.
 for(const area of parkAreas){
  const xs=area.points.map(p=>p[0]),zs=area.points.map(p=>p[1]),step=18;
  for(let z=Math.min(...zs)+4;z<Math.max(...zs);z+=step)for(let x=Math.min(...xs)+4;x<Math.max(...xs);x+=step){
   const px=x+(random()-.5)*5,pz=z+(random()-.5)*5;
   if(insidePolygon(px,pz,area.points)&&edgeDistance(px,pz,area.points)<10)add(px,pz,7.5+random()*3,'park',area.id);
  }
 }
 return points;
}

// Low evergreen groundcover belongs to mapped woodland, not open lawns or the
// courts. Current entrance Roadview shows this lower planting layer beneath
// mature trees. Species and individual clumps are reconstructed, not surveyed.
export function generateUnderstoryLayout(data,visibleAt=()=>true){
 const random=seededRandom(447019),result=[];
 const roads=data.roads.flatMap(r=>r.points.slice(1).map((b,i)=>({road:r,a:r.points[i],b})));
 const excluded=data.areas.filter(a=>a.tags.natural==='water'||a.tags.amenity==='parking'||['pitch','track','playground'].includes(a.tags.leisure));
 for(const area of data.areas.filter(a=>a.tags.natural==='wood'||a.tags.landuse==='forest')){
  const xs=area.points.map(p=>p[0]),zs=area.points.map(p=>p[1]);
  for(let z=Math.min(...zs)+2;z<Math.max(...zs);z+=4.1)for(let x=Math.min(...xs)+2;x<Math.max(...xs);x+=4.1){
   const px=x+(random()-.5)*2.4,pz=z+(random()-.5)*2.4;
   if(!visibleAt(px,pz)||!insidePolygon(px,pz,area.points)||!insidePolygon(px,pz,data.boundary)||insideFocusClearance(px,pz,data)||insideEntranceOffice(px,pz,data,3))continue;
   if(excluded.some(a=>insidePolygon(px,pz,a.points)))continue;
   if(roads.some(r=>segmentDistance(px,pz,r.a,r.b)<roadWidthAt(r.road,px,pz)/2+(r.road.id==='286085067'?4.7:2.5)))continue;
   if(data.buildings.some(b=>insidePolygon(px,pz,b.points)||edgeDistance(px,pz,b.points)<2.5))continue;
   result.push({x:px,z:pz,radius:1.15+random()*.65,height:.18+random()*.32,variation:random(),areaId:area.id});
  }
 }
 return result;
}

export function addVegetation(scene,data,heightAt=()=>0,visibleAt=()=>true){
 const points=generateVegetationLayout(data).filter(p=>visibleAt(p.x,p.z)),random=seededRandom(980109),obstacles=[];
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 for(let branch=0;branch<16;branch++){
  const angle=random()*Math.PI*2,length=42+random()*61,bx=128+Math.cos(angle)*length,by=128+Math.sin(angle)*length;
  ctx.strokeStyle='#4a4930';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(128,140);ctx.quadraticCurveTo(128+Math.cos(angle)*length*.6,128,bx,by);ctx.stroke();
  for(let j=0;j<36;j++){
   const q=random(),spread=5+21*q,x=128+(bx-128)*q+(random()-.5)*spread*2,y=135+(by-135)*q+(random()-.5)*spread*2;
   ctx.fillStyle=`hsl(${85+random()*22} 28% ${25+random()*23}%)`;ctx.beginPath();ctx.ellipse(x,y,2+random()*3.5,1+random()*2,random()*Math.PI,0,Math.PI*2);ctx.fill();
  }
 }
 const leafTexture=new THREE.CanvasTexture(canvas);leafTexture.colorSpace=THREE.SRGBColorSpace;leafTexture.anisotropy=4;
 const leavesMaterial=new THREE.MeshStandardMaterial({map:leafTexture,alphaTest:.42,side:THREE.DoubleSide,roughness:.95,emissive:'#25391d',emissiveIntensity:.08});
 const leavesPerTree=p=>p.type==='deciduous'?0:p.type==='avenue'?160:p.type==='conifer'?80:p.type==='park'?64:58;
 const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leavesMaterial,points.reduce((n,p)=>n+leavesPerTree(p),0));
 // Layered alpha-tested leaf sprays form the canopy. There is no opaque inner
 // sphere: gaps and twig-shaped silhouettes remain visible from the road.
 const barkCanvas=document.createElement('canvas');barkCanvas.width=256;barkCanvas.height=512;const bark=barkCanvas.getContext('2d');bark.fillStyle='#747369';bark.fillRect(0,0,256,512);
 for(let i=0;i<210;i++){const x=(i*31.17)%256,shade=55+(i*17%55);bark.strokeStyle=`rgb(${shade+8},${shade+7},${shade})`;bark.lineWidth=.4+(i%5)*.35;bark.beginPath();for(let y=0;y<=512;y+=16){const xx=x+Math.sin(y*.018+i*2)*2.3;y?bark.lineTo(xx,y):bark.moveTo(xx,y);}bark.stroke();}
 const barkTexture=new THREE.CanvasTexture(barkCanvas);barkTexture.colorSpace=THREE.SRGBColorSpace;barkTexture.wrapS=barkTexture.wrapT=THREE.RepeatWrapping;barkTexture.repeat.set(2,3);barkTexture.anisotropy=4;
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.19,.30,1,8),new THREE.MeshStandardMaterial({map:barkTexture,color:'#bebaa8',roughness:1,bumpMap:barkTexture,bumpScale:.035}),points.reduce((n,p)=>n+(p.type==='deciduous'?61:22),0));
 const o=new THREE.Object3D(),color=new THREE.Color();let li=0,ti=0;
 for(const p of points){
  const {x,z,h,variation:r}=p,ground=heightAt(x,z);
  if(!Number.isFinite(ground))throw new Error('Non-finite vegetation terrain height');
  const trunkRadius=p.type==='park'?.20:p.type==='avenue'?.34:.25;obstacles.push([x,z,trunkRadius]);
  const mature=p.type==='avenue',conifer=p.type==='conifer',deciduous=p.type==='deciduous',trunkHeight=h*(conifer?.28:mature?.29:deciduous?.25:.40);
  o.position.set(x,ground+trunkHeight*.5,z);o.scale.set(mature?1.14:.75,trunkHeight,mature?1.14:.75);o.rotation.set(0,r*6,0);o.updateMatrix();trunks.setMatrixAt(ti++,o.matrix);
  function branch(start,end,radius){const delta=end.clone().sub(start);o.position.copy(start).addScaledVector(delta,.5);o.scale.set(radius,delta.length(),radius);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.updateMatrix();trunks.setMatrixAt(ti++,o.matrix);}
  if(deciduous){
   // Layered branch topology reproduces the winter-bare silhouette visible in
   // March2026; evergreen filler is not substituted for these foreground trees.
   for(let k=0;k<4;k++){
    const a=r*6+k*Math.PI/2,start=new THREE.Vector3(x,ground+trunkHeight*(.65+k*.06),z);
    const end=new THREE.Vector3(x+Math.sin(a)*h*.19,ground+h*(.51+k*.025),z+Math.cos(a)*h*.19);branch(start,end,.55);
    for(const side of[-1,1]){const aa=a+side*.39,tip=new THREE.Vector3(x+Math.sin(aa)*h*.34,ground+h*(.71+side*.025),z+Math.cos(aa)*h*.34);branch(start.clone().lerp(end,.65),tip,.20);
     for(const fork of[-1,1]){const aaa=aa+fork*.28,twig=new THREE.Vector3(x+Math.sin(aaa)*h*.45,ground+h*(.84+fork*.035),z+Math.cos(aaa)*h*.45);branch(end.clone().lerp(tip,.55),twig,.065);
      for(const fine of[-1,1]){const aaaa=aaa+fine*.23,leafEnd=new THREE.Vector3(x+Math.sin(aaaa)*h*.51,ground+h*(.92+fine*.03),z+Math.cos(aaaa)*h*.51);branch(tip.clone().lerp(twig,.65),leafEnd,.025);}
     }
    }
   }
  }else for(let k=0;k<3;k++){
   const a=k*Math.PI*2/3+r*6,start=new THREE.Vector3(x,ground+trunkHeight*(.72+k*.05),z),end=new THREE.Vector3(x+Math.sin(a)*h*(mature?.18:.10),ground+h*(.65+k*.025),z+Math.cos(a)*h*(mature?.18:.10));
   branch(start,end,mature?.40:.25);
   for(const side of[-1,1]){const angle=a+side*.55,tip=new THREE.Vector3(x+Math.sin(angle)*h*(mature?.36:.24),ground+h*(.69+side*.035),z+Math.cos(angle)*h*(mature?.36:.24));branch(start.clone().lerp(end,.67),tip,mature?.12:.085);
    for(const fork of[-1,1]){const aa=angle+fork*.31,end2=new THREE.Vector3(x+Math.sin(aa)*h*(mature?.43:.30),ground+h*(.76+fork*.055),z+Math.cos(aa)*h*(mature?.43:.30));branch(end.clone().lerp(tip,.6),end2,.04);}
   }
  }
  for(let j=0;j<leavesPerTree(p);j++){
   const tier=Math.floor(j/10),a=conifer?(j%10)*Math.PI/5+tier*.38:random()*Math.PI*2,radius=conifer?h*.29*(1-tier/9)*(.7+random()*.3):Math.sqrt(random())*h*(mature?.43:.35);
   const inward=mature?(x<-78?1:-1)*h*.08:0;
   o.position.set(x+Math.cos(a)*radius+inward,ground+h*(conifer?.25+tier*.085+random()*.04:mature?.49+random()*.30:.46+random()*.34),z+Math.sin(a)*radius);
   const size=conifer?h*(.32*(1-tier/10)+.04):h*(.27+random()*.12);o.scale.set(size,conifer?size*.68:size,1);o.rotation.set(conifer?-.25+random()*.55:(random()-.5)*1.6,conifer?a+Math.PI/2:random()*Math.PI*2,(random()-.5)*.9);o.updateMatrix();leaves.setMatrixAt(li,o.matrix);
   color.setHSL(conifer?.28:.22+random()*.035,conifer?.2:.08+random()*.12,conifer?.62:.73+random()*.16);leaves.setColorAt(li++,color);
  }
 }
 trunks.count=ti;
 for(const [mesh,name]of [[trunks,'campus-tree-trunks'],[leaves,'campus-tree-leaves']]){
  mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);
 }
 const understory=generateUnderstoryLayout(data,visibleAt);
 const groundLeaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leavesMaterial,understory.length*12);let gi=0;
 for(const p of understory)for(let i=0;i<12;i++){
  const a=i*Math.PI*.618+p.variation*6,r=Math.sqrt((i+.5)/12)*p.radius,px=p.x+Math.cos(a)*r,pz=p.z+Math.sin(a)*r;
  o.position.set(px,heightAt(px,pz)+p.height*.5,pz);o.scale.set(1.4,1.4,1);o.rotation.set(-Math.PI/2+(i%3-1)*.22,a,.1);o.updateMatrix();groundLeaves.setMatrixAt(gi,o.matrix);color.setHSL(.22,.1,.62+(i%4)*.045);groundLeaves.setColorAt(gi++,color);
 }
 groundLeaves.name='Mapped woodland low evergreen groundcover';groundLeaves.castShadow=false;groundLeaves.receiveShadow=true;groundLeaves.computeBoundingSphere();scene.add(groundLeaves);
 return {treeCount:points.length,obstacles,counts:{forest:points.filter(p=>p.type==='forest').length,park:points.filter(p=>p.type==='park').length,avenue:points.filter(p=>p.type==='avenue').length,conifer:points.filter(p=>p.type==='conifer').length,deciduous:points.filter(p=>p.type==='deciduous').length,understory:understory.length},placementNotes:'OSM forest/wood/park extents and March2026 Roadview silhouettes; reconstructed tree density, heights, foreground student-hall trunks and woodland groundcover; terrain-grounded, with road and building clearance.'};
}
