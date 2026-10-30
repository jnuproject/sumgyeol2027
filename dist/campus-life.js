import {batchStaticMeshes} from './static-mesh-batches.js?v=mascot-r52';
import * as THREE from './three.module.js';
import {segmentDistance} from './navigation.js';
import {isWalkingRoad,roadWidthAt} from './road-profile.js?v=mascot-r52';

// Small fictional everyday scenes, not claims that these fixtures were surveyed.
// Keep furniture off vehicle lanes, preserve through routes and existing trees.
export function createCampusLife({scene,data,avatar,groundAt,canStand,obstacles,cameraCollisionMeshes,anchors,mobile=false}){
 const root=new THREE.Group();root.name='Campus everyday life';scene.add(root);const decor=new THREE.Group(),crowd=new THREE.Group();root.add(decor,crowd);
 const materials=new Map(),mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.9}));return materials.get(c);};
 const students=[],fixtures=[],reservations=[],boothStaff=new Map();let variant=0,animationFrame=0;const visibleLimit=mobile?22:42;
 const protectedPoints=[...anchors,[anchors[0][0],anchors[0][1]-7],[-44,87.6],[anchors[2][0],-21],[-104,224],[-110.8,114]];
 const carriageway=(x,z,margin=.6)=>data.roads.some(r=>!isWalkingRoad(r)&&r.points.some((b,i)=>i&&segmentDistance(x,z,r.points[i-1],b)<roadWidthAt(r,x,z)/2+margin));
 const available=(x,z)=>!(Math.abs(x+107.7)<1.6&&z>104&&z<215)&&!(x>-68&&x<3&&z>88.65&&z<92.5)&&canStand(x,z)&&!carriageway(x,z)&&protectedPoints.every(p=>Math.hypot(x-p[0],z-p[1])>1.5)&&reservations.every(o=>Math.hypot(x-o[0],z-o[1])>o[2]+.7);
 function fit(wish,width,depth,yaw=0,accept=()=>true){
  const cs=Math.cos(yaw),sn=Math.sin(yaw);
  for(const radius of [0,.8,1.6,2.4,3.2])for(let j=0;j<(radius?12:1);j++){
   const x=wish[0]+Math.cos(j*Math.PI/6)*radius,z=wish[1]+Math.sin(j*Math.PI/6)*radius;
   if(!accept([x,z]))continue;
   const points=[[-width/2,-depth/2],[width/2,-depth/2],[-width/2,depth/2],[width/2,depth/2],[0,0]].map(([u,v])=>[x+u*cs+v*sn,z-u*sn+v*cs]);
   if(points.every(p=>available(...p)&&students.every(s=>!s.path||segmentDistance(...p,s.path[0],s.path[1])>.85))&&Math.max(...points.map(p=>groundAt(...p)))-Math.min(...points.map(p=>groundAt(...p)))<.60)return [x,z];
  }
  return null;
 }
 function box(parent,x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function student(position,yaw,{seated=false,team=false}={}){
  const person=avatar.createCompanion(scene,{student:!team,variant:variant++,seated});crowd.add(person.group);person.group.name=seated?'Student resting on bench':'Student chatting';person.group.position.set(position[0],groundAt(...position),position[1]);person.body.rotation.y=yaw;person.group.traverse(o=>{if(o.isMesh)o.castShadow=false;});students.push({person,position,seated,team});return students.at(-1);
 }
 function bench(wish,yaw,people=1){
  const p=fit(wish,2.5,.95,yaw);if(!p)return;
  const group=new THREE.Group();group.name='Bench with students';group.position.set(p[0],groundAt(...p),p[1]);group.rotation.y=yaw;decor.add(group);
  for(const x of [-.85,.85]){const foot=groundAt(p[0]+x*Math.cos(yaw),p[1]-x*Math.sin(yaw))-group.position.y;box(group,x,(.29+foot)/2,0,.10,Math.max(.10,.29-foot),.60,'#424f50');box(group,x,.58,-.28,.07,.55,.07,'#424f50');}
  for(let i=0;i<4;i++)box(group,0,.295,-.25+i*.17,2.25,.09,.14,'#9e8060');
  for(const y of [.63,.85])box(group,0,y,-.29,2.25,.15,.075,'#a58a6b');
  const cs=Math.cos(yaw),sn=Math.sin(yaw);
  for(const u of people===2?[-.55,.55]:[-.45]){const seated=student([p[0]+u*cs+.1*sn,p[1]-u*sn+.1*cs],yaw,{seated:true});seated.person.group.position.y=group.position.y;seated.person.setSeat?.({seatY:group.position.y+.34,floorY:group.position.y});}
  // A backpack left on the spare seat, plus a book and a drink.
  if(people===1){box(group,.57,.51,.05,.34,.38,.20,'#667d8a');box(group,.57,.72,.05,.18,.07,.10,'#405864');}
  box(group,-.1,.37,.05,.27,.025,.19,'#ede4ca');box(group,-.1,.387,.05,.24,.009,.17,'#5593a1');
  for(const u of [-.75,0,.75]){const o=[p[0]+u*cs,p[1]-u*sn,.65];obstacles.push(o);reservations.push(o);}
  group.updateMatrixWorld(true);group.traverse(o=>{if(o.isMesh)cameraCollisionMeshes.push(o);});fixtures.push({kind:'bench',position:p,yaw});
 }
 function table(wish,yaw=0){
  const p=fit(wish,1.5,1.1,yaw);if(!p)return;
  const g=new THREE.Group();g.name='Everyday campus notice table';g.position.set(p[0],groundAt(...p),p[1]);g.rotation.y=yaw;decor.add(g);
  box(g,0,.77,0,1.25,.09,.72,'#b9a68b');for(const x of [-.48,.48])for(const z of [-.24,.24])box(g,x,.38,z,.045,.76,.045,'#59676c');
  for(let i=0;i<3;i++){box(g,-.38+i*.30,.833+i*.008,.04,.24,.015,.32,['#e1e9dc','#e9dcc9','#d3e8ed'][i]);}
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.055,.04,.14,10),mat('#f4f2e7'));cup.position.set(.48,.88,-.18);g.add(cup);
  // Low notice board on the table's back, with independent campus-life artwork.
  box(g,0,1.22,-.31,.93,.72,.06,'#627b80');
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;const c=canvas.getContext('2d');c.fillStyle='#f6f2e8';c.fillRect(0,0,512,384);c.fillStyle='#3884a1';c.font='600 43px Pretendard,sans-serif';c.textAlign='center';c.fillText('잠깐 쉬어가요',256,87);c.fillStyle='#778b8e';c.font='26px Pretendard,sans-serif';c.fillText('함께하는 캠퍼스',256,140);for(let i=0;i<3;i++){c.fillStyle=['#d6e5d8','#e9d9c2','#cbe6ef'][i];c.fillRect(40+i*148,190,132,145);c.fillStyle='#8ba8ac';c.fillRect(54+i*148,213,104,7);c.fillRect(54+i*148,237,70,5);}
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const face=new THREE.Mesh(new THREE.PlaneGeometry(.87,.65),new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}));face.position.set(0,1.22,-.273);g.add(face);
  }
  const o=[p[0],p[1],.82];obstacles.push(o);reservations.push(o);g.updateMatrixWorld(true);g.traverse(o=>{if(o.isMesh)cameraCollisionMeshes.push(o);});fixtures.push({kind:'table',position:p,yaw});
 }
 function chat(wish,yaw){const p=fit(wish,1.1,1.1);if(p){student(p,yaw);reservations.push([p[0],p[1],.35]);}}
 function walker(path,phase=0){
  if(path.length<2)return;
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=0;d<=length;d+=.45){const t=length?d/length:0,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if(!available(x,z)||anchors.some(p=>Math.hypot(x-p[0],z-p[1])<1.15))return;}}
  const a=path[0],b=path[1],p=[a[0]+(b[0]-a[0])*phase,a[1]+(b[1]-a[1])*phase],entry=student(p,Math.atan2(b[0]-a[0],b[1]-a[1]));entry.path=path;entry.segment=0;entry.t=phase;entry.direction=variant%2?1:-1;entry.speed=.84+(variant%5)*.08;entry.pause=0;entry.person.group.name='Student walking on pedestrian route';
 }
 const gate=anchors[0];
 bench([gate[0]+6.5,gate[1]+14],-.35,2);table([gate[0]+5,gate[1]+8],Math.PI);chat([gate[0]+7,gate[1]+6],-1.0);walker([[gate[0]+.8,gate[1]+10],[gate[0]+.8,gate[1]+28]],.3);
 bench([-53,88.1],Math.PI,1);table([-39,88.0],Math.PI);chat([-40.8,87.6],Math.PI/2);chat([-36.5,87.6],-Math.PI/2);walker([[-68,87],[-56,87]],.45);
 bench([-110,-24],.15,1);bench([-118,-27],Math.PI/2,1);table([-99.7,-13.4],Math.PI/2);chat([-98.6,-15.6],-2.6);chat([-100.3,-17.8],.6);
 walker([[-95.1,-36],[-95.1,-12]],.23);walker([[-104.6,-30],[-104.6,-18.5]],.55);
 // Small groups beside destinations and intermediate parts of the walk.
 for(const [x,z,yaw]of [[-97,-43,0],[-97,-120,.2],[-97,-185,0],[-97,-260,0],[-73,-315,Math.PI],[-73,-380,Math.PI],[-112,218,0],[-102,220,Math.PI],[-124,225,.6],[-109,226,.6],[-100,227,-.6],[-118,-34,1.2],[-105,-31,-.5],[-100,-28,2.5],[-61,78,Math.PI],[-35,78,Math.PI]]){
  chat([x,z],yaw);chat([x+1.8,z+.3],yaw+Math.PI);if(x<-105||z===78)chat([x+.8,z+1.8],yaw+1.8);
 }
 for(const [x,z,yaw]of [[-117,218,0],[-98,221,Math.PI],[-126,219,.3],[-97,-62,Math.PI/2],[-73,-210,-Math.PI/2],[-73,-338,-Math.PI/2],[-97,-285,Math.PI/2]])bench([x,z],yaw,2);
 for(const [x,z,yaw]of [[-113,216,0],[-102,-29,Math.PI/2],[-61,77.7,Math.PI]])table([x,z],yaw);
 const brandMaterials=new Map();
 function brandMaterial(kind,aspect){
  const key=kind+aspect.toFixed(3);if(brandMaterials.has(key))return brandMaterials.get(key);
  if(typeof document==='undefined')return mat('#00b9e8');
  const c=document.createElement('canvas');c.width=kind==='banner'?512:1024;c.height=Math.round(c.width/aspect);const g=c.getContext('2d');
  g.fillStyle='#ffffff';g.fillRect(0,0,c.width,c.height);g.fillStyle='#dff6fc';g.fillRect(0,c.height-42,c.width,42);
  const symbol=avatar.symbolImage,compact=c.height<280,h=kind==='banner'?360:Math.min(230,c.height*.70),w=symbol?h*symbol.width/symbol.height:h;
  if(symbol)g.drawImage(symbol,kind==='banner'?(512-w)/2:32,kind==='banner'?75:(c.height-h)/2,w,h);
  g.fillStyle='#008dcc';g.textAlign=kind==='banner'?'center':'left';g.font=kind==='banner'?'700 104px Pretendard,sans-serif':compact?'700 50px Pretendard,sans-serif':'700 67px Pretendard,sans-serif';
  if(kind==='banner'){g.fillText('숨결',256,650);g.font='42px Pretendard,sans-serif';g.fillText('우리의 캠퍼스',256,815);g.fillText('함께 걸어요',256,892);}
  else{const x=compact?215:340;g.fillText(kind==='message'?'숨결 메시지월':kind==='photo'?'숨결과 함께':'숨결 이야기 쉼터',x,c.height*.37,c.width-x-25);g.font=(compact?'28':'35')+'px Pretendard,sans-serif';g.fillStyle='#56839a';g.fillText(kind==='message'?'오늘도 수고했어 · 같이 걸을래?':'잠깐 쉬고, 이야기해요',x,c.height*.56,c.width-x-25);if(kind==='message')for(let i=0;i<4;i++){g.fillStyle=['#d6edf7','#e7ead9','#f4e6d5','#e2e4f4'][i];g.fillRect(340+i*145,c.height*.65,126,c.height*.21);}}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide});brandMaterials.set(key,m);return m;
 }
 function panel(parent,w,h,y,z,kind){const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),brandMaterial(kind,w/h));plane.position.set(0,y,z);parent.add(plane);return plane;}
 function branded(wish,yaw,kind,{key=null,accept=()=>true}={}){
  const large=kind==='shelter',width=large?3.2:kind==='banner'?.32:1.9,depth=large?2.3:kind==='banner'?.32:.65,p=fit(wish,width,depth,yaw,accept);if(!p)return false;
  const g=new THREE.Group();g.position.set(p[0],groundAt(...p),p[1]);g.rotation.y=yaw;g.name='Sumgyeol '+kind;decor.add(g);
  if(kind==='banner'){
   box(g,0,1.7,0,.055,3.4,.055,'#78929c');box(g,.37,3.22,0,.8,.045,.045,'#78929c');const face=panel(g,.72,2.03,2.13,.015,'banner');face.position.x=.35;
  }else if(large){
   for(const x of [-1.42,1.42])for(const z of [-.95,.95])box(g,x,1.3,z,.065,2.6,.065,'#c4d8df');
   box(g,0,2.67,0,3.2,.16,2.3,'#00a9dd');box(g,0,2.48,1.14,3.2,.3,.065,'#f4fcff');panel(g,2.75,.55,2.48,1.18,'shelter');
   box(g,0,.51,.22,2.5,1.02,.62,'#ddf4fc');box(g,0,1.05,.22,2.7,.08,.79,'#e6e4d8');panel(g,2.28,.73,.53,.545,'shelter');
   for(let i=0;i<3;i++)box(g,-.8+i*.65,1.12,.27,.38,.04,.28,['#e5e9d4','#c4e7f3','#e9d9d0'][i]);
   const staff=[p[0]-.8*Math.sin(yaw),p[1]-.8*Math.cos(yaw)];if(canStand(...staff)&&!carriageway(...staff)){const entry=student(staff,yaw,{team:true});if(avatar.metadata?.style==='sumgyeol-wind'){box(g,0,.16,-.8,.90,.32,.72,'#b6a282');entry.person.group.position.y=g.position.y+.32;}if(key)boothStaff.set(key,{entry,position:staff,front:[p[0]+2.05*Math.sin(yaw),p[1]+2.05*Math.cos(yaw)],yaw,center:p});}
  }else{
   for(const x of [-.79,.79])box(g,x,1.05,0,.055,2.1,.055,'#7a959e');box(g,0,1.35,0,1.85,1.22,.09,'#8ab3c7');panel(g,1.76,1.12,1.35,.052,kind);
  }
  const radius=large?1.4:kind==='banner'?.16:.73,o=[p[0],p[1],radius];obstacles.push(o);reservations.push(o);g.updateMatrixWorld(true);g.traverse(o=>{if(o.isMesh)cameraCollisionMeshes.push(o);});fixtures.push({kind:'sumgyeol-'+kind,position:p,yaw});return true;
 }
 // Blue/white symbol banners run through the whole avenue, not only NPC spots.
 for(let z=-451;z<=215;z+=38){branded([-99.1,z],Math.PI/2,'banner');branded([-70.8,z+13],-Math.PI/2,'banner');}
 for(const z of [119,151,183])branded([-112,z],Math.PI/2,'banner');
 branded([-107.8,-21],Math.PI/2,'shelter',{key:'student-hall',accept:p=>p[0]<-106.5&&p[0]>-112&&p[1]>-24&&p[1]<-18});
 if(!branded([-115,228],Math.PI,'shelter'))branded([-116,219],Math.PI,'shelter');
 branded([-65,-463],Math.PI,'shelter');
 for(const [x,z,yaw]of [[-100,-25,Math.PI/2],[-100,219,Math.PI],[-96.9,-190,Math.PI/2],[-73,-345,-Math.PI/2]])branded([x,z],yaw,'message');
 for(const [x,z,yaw]of [[-113,-33,0],[-123,217,Math.PI]])branded([x,z],yaw,'photo');
 // Populate the full connecting avenue in independent, walkable runs.
 // Split at crossroads/trees rather than sending people through obstacles.
 for(const x of [-95.1,-98.3,-71.7,-74.4]){
  let start=null,last=null;
  const finish=()=>{if(start!==null&&last-start>=8){const n=Math.min(3,Math.max(1,Math.floor((last-start)/18)));for(let k=0;k<n;k++)walker([[x,start],[x,last]],(k+.5)/n);}start=last=null;};
  for(let z=-465;z<=215;z+=1.2){if(available(x,z)){if(start===null)start=z;last=z;}else finish();}finish();
 }
 const batching=batchStaticMeshes(decor);
 function update(dt,{mode,focus,player}){
  root.visible=mode!=='welcome';animationFrame++;
  const ranked=students.map(s=>({s,d:Math.hypot(s.person.group.position.x-focus.x,s.person.group.position.z-focus.z)})).sort((a,b)=>a.d-b.d);
  for(const [rank,{s,d}]of ranked.entries()){
   const g=s.person.group;g.visible=rank<visibleLimit&&d<135;if(!g.visible)continue;
   if(s.path){
    const a=s.path[0],b=s.path[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),speed=s.speed??.9;s.pause=Math.max(0,s.pause-dt);
    const t=Math.max(0,Math.min(1,s.t+s.direction*speed*dt/length)),x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
    const approaching=students.some(other=>other!==s&&other.path&&other.person.group.visible&&Math.hypot(x-other.person.group.position.x,z-other.person.group.position.z)<1.65);
    const nx=(b[1]-a[1])/length,nz=-(b[0]-a[0])/length,targetAvoid=approaching ? .4*s.direction : 0;
    s.avoid=(s.avoid??0)+(targetAvoid-(s.avoid??0))*Math.min(1,dt*7);
    let px=x+nx*s.avoid,pz=z+nz*s.avoid;if(!available(px,pz)){px=x;pz=z;s.avoid=0;}
    let stopped=s.pause>0||Math.hypot(px-player.x,pz-player.z)<1.2;
    if(!stopped&&students.some(other=>other!==s&&other.path&&other.person.group.visible&&Math.hypot(px-other.person.group.position.x,pz-other.person.group.position.z)<.55)){s.direction*=-1;s.pause=.45;stopped=true;}
    if(!stopped){s.t=t;g.position.set(px,groundAt(px,pz),pz);s.person.body.rotation.y=Math.atan2((b[0]-a[0])*s.direction,(b[1]-a[1])*s.direction);if(t===0||t===1){s.direction*=-1;s.pause=1.8;}}

    s.person.setWalking(!stopped);
   }
   const smoothCount=mobile?6:12;if(rank<smoothCount||animationFrame%3===0)s.person.update(rank<smoothCount?dt:dt*3);
  }
 }

 function takeBoothAttendant(key){const staff=boothStaff.get(key);if(!staff)return null;boothStaff.delete(key);const i=students.indexOf(staff.entry);if(i>=0)students.splice(i,1);scene.add(staff.entry.person.group);return {...staff,person:staff.entry.person};}
 return {update,takeBoothAttendant,metadata:()=>({students:students.length,volunteers:students.filter(s=>s.team).length,seated:students.filter(s=>s.seated).length,seatChecks:students.filter(s=>s.seated).map(s=>s.person.seatDiagnostics?.()).filter(Boolean),walkers:students.filter(s=>s.path).length,fixtures,brandedElements:fixtures.filter(f=>f.kind.startsWith('sumgyeol-')).length,visibleStudents:students.filter(s=>s.person.group.visible).length,visibleLimit,batching,passersBy:students.filter(s=>s.path).map(s=>({path:s.path,position:s.person.group.position.toArray()}))})};
}
