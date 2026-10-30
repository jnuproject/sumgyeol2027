import * as THREE from './three.module.js';

// Original Sumgyeol wind-droplet, built as real geometry. +Z is the face.
// Static coloured parts are merged; instances share geometry and materials.
const C={sky:'#9bd9ed',light:'#c8edf4',blue:'#32afd5',deep:'#188fbd',cream:'#fff8e9',ink:'#352e36',pink:'#f0a2a9'};
function merged(parts){
 const arrays={position:[],normal:[],color:[]};
 for(const {geometry,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]} of parts){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));g.applyMatrix4(matrix);
  arrays.position.push(...g.attributes.position.array);arrays.normal.push(...g.attributes.normal.array);
  const c=new THREE.Color(color);for(let i=0;i<g.attributes.position.count;i++)arrays.color.push(c.r,c.g,c.b);g.dispose();geometry.dispose();
 }
 const result=new THREE.BufferGeometry();for(const key of Object.keys(arrays))result.setAttribute(key,new THREE.Float32BufferAttribute(arrays[key],3));result.computeBoundingSphere();return result;
}
const sphere=()=>new THREE.SphereGeometry(1,16,12);
const ellipsoid=(color,position,scale)=>({geometry:sphere(),color,position,scale});
const tube=(points,radius)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,radius,8,false);

export function createWindMascotFactory({symbolTexture=null,motionPreference=()=>false}={}){
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:0});
 const profile=[[0,.17],[.25,.17],[.40,.24],[.49,.40],[.52,.64],[.50,.88],[.43,1.14],[.33,1.36],[.19,1.51],[.08,1.56],[0,1.57]];
 const parts=[{geometry:new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),32),color:C.sky},
  // A short wind curl, not a separate horn.
  {geometry:tube([[.06,1.48,0],[-.12,1.58,0],[-.25,1.72,0],[-.19,1.84,0],[-.05,1.83,0],[.015,1.73,0],[-.05,1.69,0]],.075),color:C.sky},
  ellipsoid(C.cream,[0,.54,.425],[.35,.32,.145]),
  // Scarf wraps the whole body; its ends sit over the belly.
  {geometry:new THREE.TorusGeometry(.467,.055,8,40),color:C.blue,position:[0,.845,0],scale:[1,.98,1],rotation:[Math.PI/2,0,0]},
  ellipsoid(C.deep,[-.30,.81,.36],[.09,.085,.07]),
  {...ellipsoid(C.blue,[-.29,.66,.47],[.085,.18,.035]),rotation:[0,0,-.2]},
  {...ellipsoid(C.blue,[-.17,.72,.47],[.065,.13,.035]),rotation:[0,0,.3]},
  // Soft backpack and two visible straps, all part of one static draw.
  ellipsoid(C.deep,[0,.65,-.43],[.32,.35,.16]),
  ellipsoid(C.blue,[0,.65,-.53],[.29,.31,.11]),
  ellipsoid(C.light,[0,.53,-.625],[.22,.16,.026]),
  {geometry:tube([[-.23,.43,-.32],[-.29,.77,-.39],[-.22,1.02,-.25]],.034),color:C.blue},
  {geometry:tube([[.23,.43,-.32],[.29,.77,-.39],[.22,1.02,-.25]],.034),color:C.blue},
  {geometry:tube([[-.09,.94,-.48],[-.08,1.01,-.48],[.08,1.01,-.48],[.09,.94,-.48]],.026),color:C.deep}
 ];
 const bodyGeometry=merged(parts);
 // Face coordinates lie on a tilted plane tangent to the rounded forehead.
 const faceDetails=merged([ellipsoid(C.pink,[-.245,-.095,.005],[.073,.038,.012]),ellipsoid(C.pink,[.245,-.095,.005],[.073,.038,.012])]);
 const eyeGeometry=merged([ellipsoid(C.ink,[-.155,0,0],[.055,.083,.034]),ellipsoid(C.ink,[.155,0,0],[.055,.083,.034]),ellipsoid('#ffffff',[-.17,.031,.031],[.017,.023,.009]),ellipsoid('#ffffff',[.14,.031,.031],[.017,.023,.009])]);
 const mouthGeometry=merged([ellipsoid(C.ink,[0,0,0],[.043,.028,.015]),ellipsoid(C.pink,[0,-.012,.014],[.025,.010,.004])]);
 const handGeometry=merged([ellipsoid(C.sky,[0,-.10,0],[.105,.18,.105]),ellipsoid(C.light,[.055,-.17,.025],[.055,.065,.065])]);
 const footGeometry=merged([ellipsoid(C.blue,[0,0,.045],[.145,.12,.20]),ellipsoid(C.light,[0,-.06,.06],[.143,.055,.185])]);
 const badgeGeometry=new THREE.PlaneGeometry(.22*(symbolTexture?.image?.width??1)/(symbolTexture?.image?.height??1),.22);
 const badgeMaterial=symbolTexture?new THREE.MeshBasicMaterial({map:symbolTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}):null;
 const resources={bodyGeometry,faceDetails,eyeGeometry,mouthGeometry,handGeometry,footGeometry};
 const shadowGeometry=new THREE.CircleGeometry(.49,24),shadowMaterial=new THREE.MeshBasicMaterial({color:'#304f52',transparent:true,opacity:.16,depthWrite:false});
 const scale=1.78/1.915;
 function create(scene){
  const player=new THREE.Group(),body=new THREE.Group(),motion=new THREE.Group();body.add(motion);player.add(body);scene.add(player);motion.scale.setScalar(scale);
  player.name='바람방울';body.name='Wind mascot facing';motion.name='Wind mascot motion';
  const mesh=(geometry,parent=motion)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  mesh(bodyGeometry).name='Wind droplet, scarf and backpack';
  const face=new THREE.Group();face.position.set(0,1.135,.405);face.rotation.x=-.44;motion.add(face);mesh(faceDetails,face);const eyes=mesh(eyeGeometry,face);eyes.name='Blinking eyes';
  const mouth=mesh(mouthGeometry,face);mouth.position.y=-.105;mouth.name='Talking mouth';
  const hands=[-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(side*.455,.77,0);const h=mesh(handGeometry,pivot);h.scale.x=side;pivot.rotation.z=side*.22;motion.add(pivot);return pivot;});
  const feet=[-1,1].map(side=>{const m=mesh(footGeometry);m.position.set(side*.20,.145,.05);return m;});
  if(badgeMaterial){const badge=new THREE.Mesh(badgeGeometry,badgeMaterial);badge.position.set(0,.54,-.654);badge.rotation.y=Math.PI;motion.add(badge);}
  const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;player.add(shadow);
  let time=0,gait=0,walking=false,talking=false,greeting=false;
  const metadata={asset:'Original procedural Sumgyeol wind droplet',style:'sumgyeol-wind',heightMeters:1.78,ready:true,animation:'idle',expression:'smile'};
  function update(dt,{speed=walking?2:0,grounded=true,reducedMotion=motionPreference()}={}){
   dt=Number.isFinite(dt)?THREE.MathUtils.clamp(dt,0,.1):0;speed=Number.isFinite(speed)?Math.max(0,speed):0;time+=dt;
   const moving=speed>.15,air=!grounded;gait+=dt*(moving?Math.min(17,6+speed*.55):4);
   metadata.animation=air?'jump':moving?(speed>10?'run':'walk'):greeting?'wave':'idle';metadata.expression=talking?'talk':'smile';
   const stride=moving&&!air?Math.sin(gait):0,bounce=moving?Math.abs(Math.sin(gait))*.04:Math.sin(time*2.2)*.009+.009;
   motion.position.y=reducedMotion?0:(air?.035:bounce);
   motion.rotation.set(0,0,reducedMotion||air?0:stride*.035);
   const breath=reducedMotion||moving||air?0:Math.sin(time*2.2)*.008;motion.scale.set(scale*(1-breath*.5),scale*(1+breath),scale*(1-breath*.5));
   feet.forEach((foot,i)=>{const s=i?1:-1;foot.position.set(s*.20,.145+(air?.10:Math.max(0,stride*s)*.10),.05+stride*s*.10);foot.rotation.x=air?-.3:stride*s*.20;});
   const wave=!reducedMotion&&!air&&!moving&&greeting&&time%4<2.3;
   hands.forEach((hand,i)=>{const s=i?1:-1;hand.rotation.set(air?-1.0:stride*s*.45,0,s*(air?1.2:.22));});
   if(wave)hands[1].rotation.z=2.35+Math.sin(time*10)*.22;
   const blink=!reducedMotion&&time%4.4>4.23;eyes.scale.y=blink?.08:1;
   mouth.scale.y=talking&&!reducedMotion?1.2+Math.sin(time*15)*.45:1;
  }
  function facePosition(){player.updateMatrixWorld(true);return face.getWorldPosition(new THREE.Vector3()).toArray();}
  update(0);
  return {player,group:player,body,legs:[],arms:[],shadow,update,metadata,facePosition,setWalking:value=>{walking=Boolean(value);},setTalking:value=>{talking=Boolean(value);},setGreeting:value=>{greeting=Boolean(value);}};
 }
 return {create,resources};
}
