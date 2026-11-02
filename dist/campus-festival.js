import * as THREE from './three.module.js';
import {festivalLayout} from './festival-layout.js?v=night-r63';
import {batchStaticMeshes} from './static-mesh-batches.js?v=player-r54';
import {createWindMascotFactory,MASCOT_KINDS} from './wind-mascot.js?v=emote-r59';

export function createCampusFestival({scene,data,terrain,avatar,collisionPolygons,obstacles,cameraCollisionMeshes,pathMaterial=null,mobile=false}){
 const layout=festivalLayout(data);if(!layout)return {update(){},metadata:()=>({enabled:false})};
 const root=new THREE.Group();root.name='Ara Daedongje — photo-informed festival';scene.add(root);
 const decor=new THREE.Group(),nightDecor=new THREE.Group();root.add(decor,nightDecor);const materials=new Map(),textures=[],screenPrograms=[],glowMaterials=[];
 const mat=(color,glow=false)=>{const key=color+glow;if(!materials.has(key))materials.set(key,glow?new THREE.MeshBasicMaterial({color,toneMapped:false}):new THREE.MeshStandardMaterial({color,roughness:.78}));const m=materials.get(key);if(glow&&!glowMaterials.some(g=>g.material===m))glowMaterials.push({material:m,color:new THREE.Color(color)});return m;};
 const ground=(x,z)=>terrain.heightAt(x,z),[cx,cz]=layout.center,[sx,sz]=layout.stage;
 const local=(u,y,v)=>new THREE.Vector3(sx+v,y,sz+u),screenMeshes=[],lights=[],beams=[];
 function box(x,y,z,w,h,d,c,parent=decor){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function pole(a,b,r=.055,c='#b7c6cc',parent=decor){const d=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),6),mat(c));o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(o);return o;}
 function footprint(id,x,z,w,d){collisionPolygons.push({id,points:[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2],[x-w/2,z-d/2]]});}
 function panel(text,sub,w,h,color='#0b9ac1',dark=false){
  if(typeof document==='undefined')return mat(color);
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const g=c.getContext('2d'),H=c.height;
  g.fillStyle=dark?'#071f3c':color;g.fillRect(0,0,1024,H);
  g.strokeStyle=dark?'#168ba2':'#ffffff35';g.lineWidth=H*.06;
  for(let i=0;i<3;i++){g.beginPath();g.arc(1000,H*.5,H*(.42+i*.17),0,Math.PI*2);g.stroke();}
  g.fillStyle='#ffffff';g.textAlign='center';g.font=`800 ${Math.min(105,H*.33)}px "Apple SD Gothic Neo",sans-serif`;g.fillText(text,512,H*.47,940);
  g.font=`500 ${Math.min(40,H*.16)}px "Apple SD Gothic Neo",sans-serif`;g.fillStyle='#d5f8ff';g.fillText(sub,512,H*.75,920);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);if(dark){const base=document.createElement('canvas');base.width=c.width;base.height=c.height;base.getContext('2d').drawImage(c,0,0);screenPrograms.push({g,c,base,texture:t});}return new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,toneMapped:false});
 }
 function sign(text,sub,x,y,z,w,h,yaw=0,color='#0b9ac1',dark=false){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),panel(text,sub,w,h,color,dark));o.position.set(x,y,z);o.rotation.y=yaw;decor.add(o);return o;}
 function floorRect(x,z,w,d,color){const o=box(x,ground(x,z)+.09,z,w,.06,d,color);o.castShadow=false;return o;}
 const walkway=pathMaterial?pathMaterial.clone():mat('#b8bcb0');if(pathMaterial){walkway.color.set('#b7b8a9');walkway.onBeforeCompile=pathMaterial.onBeforeCompile;walkway.customProgramCacheKey=pathMaterial.customProgramCacheKey;}
 for(let i=1;i<layout.connector.length;i++){
  const a=layout.connector[i-1],b=layout.connector[i];const raw=terrain.drapeRoadSegment?.(a,b,4.8,.16);if(raw){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(raw.positions,3));if(raw.normals)g.setAttribute('normal',new THREE.Float32BufferAttribute(raw.normals,3));if(raw.indices)g.setIndex(new THREE.Uint32BufferAttribute(raw.indices,1));if(!raw.normals)g.computeVertexNormals();const uv=[];for(let j=0;j<raw.positions.length;j+=3)uv.push(raw.positions[j],raw.positions[j+2]);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const m=new THREE.Mesh(g,walkway);m.receiveShadow=true;decor.add(m);}
 }
 const washes=new Map();
 function wash(x,z,r,color){
  if(!washes.has(color))washes.set(color,new THREE.ShaderMaterial({uniforms:{tint:{value:new THREE.Color(color)},strength:{value:0}},transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform vec3 tint;uniform float strength;void main(){float a=1.-smoothstep(.05,.5,length(vUv-.5));gl_FragColor=vec4(tint,a*a*strength);#include <colorspace_fragment>}'.replace(';#include',';\n#include')}));
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),washes.get(color));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,ground(x,z)+.18,z);nightDecor.add(mesh);
 }
 function luminousBox(x,y,z,w,h,d,color,parent=decor){const o=box(x,y,z,w,h,d,color,parent);o.material=mat(color,true);o.castShadow=false;return o;}
 const level=Math.max(...[-16,16].flatMap(u=>[-8,9].map(v=>ground(sx+v,sz+u))))+.08;
 const deckY=level+1.4;
 // Stepped stand behind the performance deck, with the broad white cantilever canopy in the reference.
 for(let tier=0;tier<5;tier++)box(sx-7-tier*1.2,level+.18+tier*.29,sz,1.3,.36+tier*.58,33,'#bac3c3');
 box(sx+1,level+.7,sz,16,1.4,32,'#202c37');footprint('festival-stage',sx+1,sz,16,32);
 // Wide main stage with a long central thrust into the audience. No second crossbar at the tip.
 box(sx+17,level+.7,sz,16,1.4,6,'#24313d');footprint('festival-thrust',sx+17,sz,16,6);footprint('festival-t-steps',sx+26.1,sz,2.2,4.2);
 luminousBox(sx+25.04,deckY-.05,sz,.08,.08,6,'#73deff');
 for(const side of [-1,1])luminousBox(sx+17,deckY-.05,sz+side*3.01,16,.08,.08,'#b7adff');
 for(let i=0;i<6;i++)box(sx+25.2+i*.35,level+(.7-i*.105),sz,.37,1.4-i*.21,4.2,'#76828b');
 for(const u of [-17,-8.5,0,8.5,17]){
  pole(local(u,level,-9),local(u,level+9,-7),.22,'#dce5e6');
  pole(local(u,level+8.1,-7),local(u,level+9.5,8),.16,'#dce5e6');
  box(sx-.3,level+9.05,sz+u,17.2,.12,.15,u<0?'#45b6b0':'#269bcc');
 }
 const canopy=box(sx-.5,level+9.2,sz,18,.20,36,'#e4eded');canopy.rotation.z=.065;
 const central=sign('아라대동제','숨결과 함께, 우리의 캠퍼스',sx+1.2,deckY+3.3,sz,25,4.6,Math.PI/2,'#11b5ce',true);screenMeshes.push(central);
 luminousBox(sx+9.09,level+1.30,sz,.07,.07,31,'#73deff');
 luminousBox(sx+8.50,level+8.7,sz,.10,.10,32,'#b7adff');
 for(const u of [-12,0,12])wash(sx+28,sz+u,7,u===0?'#b891f5':'#49bbd7');
 sign('숨결 · 아라대동제','JEJU NATIONAL UNIVERSITY',sx+9.05,level+.73,sz,30,1.2,Math.PI/2);
 // Two real-world-inspired scaffold towers, LED wings and line-array speaker stacks.
 for(const side of [-1,1]){
  const u=side*23;
  for(const du of [-4,4])for(const v of [-1,4])pole(local(u+du,level,v),local(u+du,level+8.5,v));
  for(const y of [0,2.8,5.6,8.4]){pole(local(u-4,level+y,4),local(u+4,level+y,4));pole(local(u-4,level+y,-1),local(u+4,level+y,-1));}
  for(let j=0;j<3;j++)for(const v of [-1,4]){pole(local(u-4,level+j*2.8,v),local(u+4,level+(j+1)*2.8,v),.035);pole(local(u+4,level+j*2.8,v),local(u-4,level+(j+1)*2.8,v),.035);}
  const screen=sign('SUMGYEOL','LIVE  •  ARA CAMPUS',sx+4.1,level+5.6,sz+u,6.5,4.0,Math.PI/2,'#42badb',true);screenMeshes.push(screen);
  for(let j=0;j<7;j++){const o=box(sx+5,level+7.4-j*.52,sz+u-side*5,1.1,.48,.95,'#15232c');o.rotation.z=-.10;}
  for(let j=0;j<5;j++)box(sx+8,level+.45,sz+u-3+j*1.5,1.2,.9,1.25,'#17242e');
  footprint('festival-screen-'+side,sx+2,sz+u,7,9);
 }
 for(let u=-15;u<=15;u+=3){
  pole(local(u,level+8.7,6),local(u,level+8.2,6),.04,'#182d38');box(sx+6,level+8.0,sz+u,.42,.4,.42,'#172632');
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.18,8,5),mat(u%2?'#98ddff':'#eab9ff',true));lamp.position.copy(local(u,level+7.85,6));decor.add(lamp);lights.push(lamp);
 }
 // Soft light columns instead of costly realtime shadow-casting spotlights.
 for(let i=0;i<4;i++){
  const g=new THREE.ConeGeometry(2.2,17,12,1,true);g.translate(0,-8.5,0);
  const m=new THREE.MeshBasicMaterial({color:i%2?'#c79cf2':'#7adfff',transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  const beam=new THREE.Mesh(g,m);beam.position.copy(local(-12+i*8,level+8,6));beam.rotation.z=1.0;root.add(beam);beams.push(beam);
 }
 function fence(a,b,open=false,studentZone=false){
  const length=a.distanceTo(b);for(let d=0;d<length;d+=2.2){if(open&&d>length*.4&&d<length*.6)continue;const p=a.clone().lerp(b,d/length),q=a.clone().lerp(b,Math.min(1,(d+2)/length)),y=ground(p.x,p.z);pole(new THREE.Vector3(p.x,y,p.z),new THREE.Vector3(p.x,y+1.05,p.z),.025,'#aebfc5');for(const h of [.25,.95])pole(new THREE.Vector3(p.x,y+h,p.z),new THREE.Vector3(q.x,y+h,q.z),.025,'#aebfc5');if(studentZone){luminousBox((p.x+q.x)/2,y+.98,(p.z+q.z)/2,Math.abs(q.x-p.x)+.05,.13,Math.abs(q.z-p.z)+.05,'#4cc6df');footprint('festival-zone-rail-'+collisionPolygons.length,(p.x+q.x)/2,(p.z+q.z)/2,Math.abs(q.x-p.x)+.12,Math.abs(q.z-p.z)+.12);}for(let t=.2;t<1;t+=.2){const v=p.clone().lerp(q,t);pole(new THREE.Vector3(v.x,y+.25,v.z),new THREE.Vector3(v.x,y+.95,v.z),.014,'#aebfc5');}obstacles.push([p.x,p.z,.15]);}}
 const zone=layout.studentZone;
 for(const x of [zone.minX,zone.maxX])for(const side of [-1,1])fence(new THREE.Vector3(x,0,sz+side*5),new THREE.Vector3(x,0,sz+side*32),false,true);
 for(const z of [zone.minZ,zone.maxZ]){for(const [a,b]of [[zone.minX,cx-2],[cx+5,zone.maxX]])fence(new THREE.Vector3(a,0,z),new THREE.Vector3(b,0,z),false,true);}
 // Large gate and repeated side markers make the actual viewing area readable from every approach.
 const zx=zone.maxX,zy=ground(zx,sz);
 for(const side of [-1,1]){box(zx,zy+2.1,sz+side*5.2,.13,4.2,.13,'#b3dce0');sign('재학생존','대동제 · 정책 미리보기',zx+.1,zy+3.8,sz+side*9,5.8,1.5,Math.PI/2,'#087d9c');}
 sign('재학생존','이곳에서 함께 즐겨요 · 정책 미리보기',zx+.12,zy+4.2,sz,10.5,1.5,Math.PI/2,'#087d9c');
 luminousBox(zx+.15,zy+3.4,sz,.08,.08,10.5,'#74e2ef');
 for(const side of [-1,1]){const o=sign('재학생존','관람 구역 · 정책 미리보기',cx+14,ground(cx+14,sz+side*14)+.20,sz+side*14,10,3.2,0,'#137f97');o.rotation.set(-Math.PI/2,0,-Math.PI/2);}

 // Clear 6m east-west audience aisle, with cone-marked edges and picnic islands.
 const mats=['#71b7be','#e4c897','#a0bc8e','#b9b0d5'];
 for(let i=0;i<layout.audience.length;i++){const p=layout.audience[i];if(Math.abs(p.z-cz)<4)continue;floorRect(p.x,p.z,3.6,2.7,mats[i%4]);box(p.x+1.2,ground(p.x,p.z)+.27,p.z+.7,.36,.36,.3,'#d0ad79');}
 for(let x=cx-13;x<cx+31;x+=7)for(const z of [cz-4,cz+4]){
  const y=ground(x,z);box(x,y+.04,z,.42,.08,.42,'#344750');const o=new THREE.Mesh(new THREE.ConeGeometry(.17,.65,8),mat('#e77c42'));o.position.set(x,y+.38,z);decor.add(o);
 }
 function tent(p,index){
  const y=ground(p.x,p.z),w=6,d=6.5,group=new THREE.Group();group.position.set(p.x,y,p.z);decor.add(group);
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(x,1.45,z,.065,2.9,.065,'#c8d5d5',group);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.5,2,4),mat('#f3f0e5'));roof.rotation.y=Math.PI/4;roof.scale.z=d/w;roof.position.y=3.8;group.add(roof);
  box(0,2.85,0,w,.25,d,index%2?'#45b8c7':'#75b7cf',group);
  luminousBox(-2.85,2.68,0,.10,.08,6.0,'#ffe4a6',group);wash(p.x-3.8,p.z,3.8,'#edbb77');
  box(-1.27,.46,0,.06,.7,4.6,index%2?'#248da6':'#397ca1',group);
  for(let j=0;j<5;j++){const flag=new THREE.Mesh(new THREE.ConeGeometry(.19,.38,3),mat(j%2?'#f2c68d':'#77d2d6'));flag.position.set(-2.94,2.31,-2.2+j*1.1);flag.rotation.z=Math.PI;group.add(flag);}
  box(2.9,1.35,0,.06,2.7,d,'#e4e8df',group);box(0,.8,0,2.5,.16,4.8,'#dec7a0',group);
  for(const z of [-1.7,1.7])box(0,.4,z,2.0,.8,.09,'#bca684',group);
  sign(p.label,'숨결 · 같이 즐겨요',p.x-3.04,y+2.55,p.z,5.8,.68,-Math.PI/2,index%2?'#168da4':'#2499ba');
  for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.CylinderGeometry(.12,.08,.25,8),mat(index%2?'#f2a35b':'#e7f2e6'));c.position.set(p.x-.8,y+1,p.z-1.2+i*.65);decor.add(c);}
  footprint('festival-booth-'+index,p.x,p.z,5.8,6.3);
 }
 layout.booths.forEach(tent);
 // Gate and wayfinding on the east-side access, leaving the middle walkable.
 const [ex,ez]=layout.entry,ey=ground(ex,ez);
 for(const z of [-4.6,4.6]){box(ex,ey+2.5,ez+z,.6,5,.7,'#e5f1ef');sign('숨결','',ex+.32,ey+2.6,ez+z,.5,2.8,Math.PI/2);obstacles.push([ex,ez+z,.45]);}
 sign('아라대동제','별빛 아래, 우리의 축제',ex+.32,ey+4.9,ez,10.5,1.5,Math.PI/2);box(ex,ey+5.1,ez,.6,1.6,10.5,'#1498bb');luminousBox(ex+.34,ey+4.1,ez,.08,.08,10.5,'#a2e9ff');
 // A photo frame and festival seating at the quieter south end.
 const [px,pz]=layout.photo,py=ground(px,pz);
 for(const x of [-2,2])box(px+x,py+1.65,pz,.16,3.3,.18,'#e6f7ef');box(px,py+3.3,pz,4.2,.18,.18,'#e6f7ef');
 sign('오늘도, 함께','SUMGYEOL CAMPUS',px,py+2.9,pz-.11,3.7,.5,Math.PI,'#1b9cba');
 for(let j=0;j<4;j++){
  const x=cx-18+j*10,z=cz+58,y=ground(x,z);box(x,y+.78,z,5,.13,1.8,'#c6a877');for(const side of [-1,1]){box(x,y+.42,z+side*1.35,5,.13,.55,'#c6a877');for(const dx of [-1.7,1.7])box(x+dx,y+.2,z+side*1.35,.12,.4,.4,'#536b68');}for(const dx of [-1.7,1.7])box(x+dx,y+.4,z,.15,.8,1.2,'#536b68');footprint('festival-table-'+j,x,z,5,3.2);
 }
 // Temporary cable lights along the booth aisle, instanced-looking small bulbs, no point lights.
 for(let row=0;row<3;row++){
  const z=cz-18+row*23;for(const x of [cx+29,cx+42]){pole(new THREE.Vector3(x,ground(x,z),z),new THREE.Vector3(x,ground(x,z)+4.8,z),.055,'#566b73');obstacles.push([x,z,.15]);}
  for(let j=0;j<13;j++){const x=cx+29+j,z2=z,y=ground(x,z)+4.8-Math.sin(j/12*Math.PI)*.7;if(j<12)pole(new THREE.Vector3(x,y,z2),new THREE.Vector3(x+1,ground(x+1,z)+4.8-Math.sin((j+1)/12*Math.PI)*.7,z2),.012,'#586773');const bulb=new THREE.Mesh(new THREE.SphereGeometry(.085,6,4),mat('#ffe6ae',true));bulb.position.set(x,y-.1,z2);decor.add(bulb);}
 }
 // Stage equipment gives the performance deck a purpose without streaming music.
 box(sx+6,deckY+.65,sz,1.3,1.3,4.2,'#143b4e');sign('숨결','LIVE',sx+6.66,deckY+.8,sz,3.8,.9,Math.PI/2);
 for(const u of [-6,6]){pole(local(u,deckY,7),local(u,deckY+1.5,7),.025,'#283b45');box(sx+7.05,deckY+1.5,sz+u,.24,.12,.12,'#182730');}
 decor.updateMatrixWorld(true);decor.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height>1)cameraCollisionMeshes.push(o);});
 const batching=batchStaticMeshes(decor,512);batchStaticMeshes(nightDecor,80);
 // Just two animated performers. Audience models are static instanced geometry, no AI/pathfinding.
 const performers=[];
 if(avatar)for(let i=0;i<2;i++){const a=avatar.createCompanion(root,{kind:i?'citrus':'wind'});a.group.position.set(sx+7,deckY+.03,sz+(i?-5:5));a.body.rotation.y=Math.PI/2;performers.push(a);}
 const audiences=[];
 for(let kind=0;kind<5;kind++){
  const holder=new THREE.Group(),factory=createWindMascotFactory({kind:MASCOT_KINDS[kind].id}),sample=factory.create(holder,{seated:true});sample.setSeat({seatY:.10,floorY:0});sample.update(0,{reducedMotion:true});batchStaticMeshes(holder,80);
  const low=holder.children.find(o=>o.isMesh&&o.material.vertexColors);const positions=layout.audience.flatMap(p=>[{x:p.x,z:p.z-.65},{x:p.x,z:p.z+.65}]).filter((p,i)=>i%5===kind);
  const mesh=new THREE.InstancedMesh(low.geometry,low.material,positions.length),dummy=new THREE.Object3D();mesh.name='Festival seated mascot group';mesh.castShadow=false;mesh.receiveShadow=true;
  positions.forEach((p,i)=>{dummy.position.set(p.x,ground(p.x,p.z),p.z);dummy.rotation.y=-Math.PI/2;dummy.scale.setScalar(1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.computeBoundingSphere();root.add(mesh);audiences.push(mesh);
 }
 let elapsed=0,animated=0,screenElapsed=1,nightStrength=0,screenUpdates=0,lastScreenReduced=null;
 return {layout,root,update(dt,{focus,night=false,nightAmount=night?1:0,reducedMotion=false}={}){
  const distance=focus?Math.hypot(focus.x-cx,focus.z-cz):0;root.visible=distance<400;if(distance>180)return;
  elapsed+=dt;animated++;nightStrength=Math.min(1,Math.max(0,nightAmount));nightDecor.visible=nightStrength>.01;
  for(const m of washes.values())m.uniforms.strength.value=nightStrength*.26;
  for(const g of glowMaterials)g.material.color.copy(g.color).multiplyScalar(.40+nightStrength*.75);
  screenElapsed+=dt;if(screenElapsed>=(mobile?.25:.125)&&(!reducedMotion||lastScreenReduced!==reducedMotion)){
   screenElapsed=0;screenUpdates++;lastScreenReduced=reducedMotion;for(const p of screenPrograms){const {g,c,base,texture}=p;g.drawImage(base,0,0);const H=c.height,t=reducedMotion?0:elapsed;
    for(let j=0;j<32;j++){const h=(.025+.045*(.5+.5*Math.sin(j*.65+t*.85)))*H;g.fillStyle=j%3?'#54c9df':'#c0a5ef';g.fillRect(j*32,H-h,23,h);}
    texture.needsUpdate=true;
   }
  }
  for(let i=0;i<performers.length;i++){performers[i].setEmote(3,((elapsed+i*.4)%2.5+.15)*1000);performers[i].update(dt,{reducedMotion});}
  beams.forEach((b,i)=>{b.visible=nightStrength>.01;b.material.opacity=.12*nightStrength;b.rotation.z=1.0+(reducedMotion?0:Math.sin(elapsed*.45+i)*.14);b.rotation.x=reducedMotion?0:Math.sin(elapsed*.32+i)*.30;});
 },metadata:()=>({enabled:true,center:layout.center,entry:layout.entry,stage:layout.stage,stageShape:'main-stage-with-central-thrust',studentZone:layout.studentZone,booths:layout.booths.length,screenCount:screenMeshes.length,performers:performers.length,staticAudience:audiences.reduce((n,m)=>n+m.count,0),liveLights:0,nightStrength,screenUpdates,animatedFrames:animated,batching,photoInformed:true,layoutMeasured:false})};
}
