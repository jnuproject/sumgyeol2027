import * as THREE from './three.module.js';

// Original Sumgyeol wind-droplet, built as real geometry. +Z is the face.
// Static coloured parts are merged; instances share geometry and materials.
const WIND_COLORS={sky:'#9bd9ed',light:'#c8edf4',blue:'#32afd5',deep:'#188fbd',cream:'#fff8e9',ink:'#352e36',pink:'#f0a2a9'};
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

export const MASCOT_KINDS=[
 {id:'wind',name:'바람방울',description:'제주 바람을 닮은 작은 친구. 통통 걷고 반갑게 손을 흔들어요.',face:[0,1.135,.405],tilt:-.44,height:1.78,colors:{}},
 {id:'citrus',name:'귤요정',description:'햇살을 머금은 동그란 귤. 초록 잎을 달고 캠퍼스를 종종 걸어요.',face:[0,1.04,.458],tilt:-.24,height:1.54,colors:{sky:'#ff9d32',light:'#ffe2a0',cream:'#fff0c6',blue:'#69b7a9',deep:'#359888'}},
 {id:'stone',name:'꼬마 돌하르방',description:'동글동글 든든한 제주 친구. 돌모자와 파란 목도리가 잘 어울려요.',face:[0,1.13,.407],tilt:0,height:1.68,colors:{sky:'#a8b7b4',light:'#d2dbd5',cream:'#dce3d8',blue:'#42a9ca',deep:'#2484a5'}},
 {id:'cloud',name:'구름송이',description:'포근한 구름이 내려왔어요. 별 하나와 보라색 가방을 챙긴 산책 친구.',face:[0,1.13,.438],tilt:-.28,height:1.73,colors:{sky:'#f4f5ff',light:'#ffffff',cream:'#fef9f1',blue:'#b6a5e4',deep:'#9382c9'}},
 {id:'sprout',name:'새싹콩',description:'머리 위 두 잎이 쫑긋. 햇살 좋은 잔디광장을 좋아하는 작은 콩이에요.',face:[0,1.04,.398],tilt:-.26,height:1.76,colors:{sky:'#b6d993',light:'#d9ebba',cream:'#f6f3cb',blue:'#e6be68',deep:'#b78e43'}}
];

function speciesParts(kind,C){
 const scarf=radius=>[{geometry:new THREE.TorusGeometry(radius,.05,8,28),color:C.blue,position:[0,.79,0],rotation:[Math.PI/2,0,0]}, {...ellipsoid(C.blue,[-.28,.65,.42],[.075,.17,.035]),rotation:[0,0,-.2]}];
 if(kind==='citrus')return [
  ellipsoid(C.sky,[0,.79,0],[.55,.62,.50]),ellipsoid(C.cream,[0,.51,.437],[.28,.25,.10]),
  {geometry:tube([[0,1.36,0],[.02,1.49,0],[.07,1.54,0]],.037),color:'#698e49'},
  {...ellipsoid('#70ad59',[-.14,1.51,0],[.25,.065,.105]),rotation:[0,0,.22]},
  {geometry:tube([[-.34,1.47,.03],[-.14,1.51,.05],[.02,1.54,.02]],.009),color:'#c0d788'},
  ...scarf(.502)
 ];
 if(kind==='stone'){
  const parts=[{geometry:new THREE.LatheGeometry([[0,.17],[.29,.17],[.42,.25],[.455,.55],[.44,1.18],[.35,1.39],[0,1.42]].map(p=>new THREE.Vector2(...p)),24),color:C.sky},
   ellipsoid('#8b9f9f',[0,1.43,0],[.51,.105,.43]),ellipsoid('#9eafad',[0,1.53,-.02],[.39,.25,.34]),
   ellipsoid('#bcc7c0',[0,1.075,.46],[.078,.105,.085]),
   {...ellipsoid('#7e9392',[-.16,1.27,.405],[.09,.025,.035]),rotation:[0,0,.12]},
   {...ellipsoid('#7e9392',[.16,1.27,.405],[.09,.025,.035]),rotation:[0,0,-.12]},...scarf(.447)];
  for(const [x,y,z,r]of [[-.32,1.19,.32,.02],[.33,.97,.32,.025],[-.29,.51,.35,.025],[.26,.42,.36,.018],[-.17,1.58,.30,.018],[.18,1.48,.36,.021]])parts.push(ellipsoid('#859996',[x,y,z],[r,r*.7,.012]));return parts;
 }
 if(kind==='cloud')return [
  ellipsoid(C.sky,[0,.81,0],[.53,.64,.48]),
  ellipsoid(C.sky,[-.30,1.32,-.035],[.28,.29,.35]),ellipsoid(C.sky,[.30,1.35,-.035],[.28,.29,.35]),ellipsoid(C.sky,[0,1.53,-.04],[.28,.29,.32]),
  ellipsoid(C.cream,[0,.49,.42],[.29,.23,.11]),...scarf(.51),
  {...ellipsoid('#f3cd75',[-.39,1.42,.24],[.105,.036,.035]),rotation:[0,0,-.28]},
  {...ellipsoid('#f3cd75',[-.39,1.42,.24],[.036,.105,.035]),rotation:[0,0,-.28]}
 ];
 return [ellipsoid(C.sky,[0,.78,0],[.47,.61,.44]),ellipsoid(C.cream,[0,.51,.385],[.28,.25,.10]),
  {geometry:tube([[0,1.34,0],[0,1.49,0],[.02,1.57,0]],.035),color:'#639653'},
  {...ellipsoid('#77b867',[-.17,1.59,0],[.12,.31,.07]),rotation:[0,0,.60]},
  {...ellipsoid('#96cb75',[.19,1.62,0],[.12,.31,.07]),rotation:[0,0,-.60]},
  ...scarf(.445)
 ];
}
function mergeColored(geometries){
 const result=new THREE.BufferGeometry();
 for(const key of ['position','normal','color']){const values=[];for(const g of geometries)values.push(...g.attributes[key].array);result.setAttribute(key,new THREE.Float32BufferAttribute(values,3));}
 for(const g of geometries)g.dispose();result.computeBoundingSphere();return result;
}

export function createWindMascotFactory({symbolTexture=null,motionPreference=()=>false,kind='wind'}={}){
 const spec=MASCOT_KINDS.find(s=>s.id===kind)??MASCOT_KINDS[0];kind=spec.id;const C={...WIND_COLORS,...spec.colors};
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:0});
 const profile=[[0,.17],[.25,.17],[.40,.24],[.49,.40],[.52,.64],[.50,.88],[.43,1.14],[.33,1.36],[.19,1.51],[.08,1.56],[0,1.57]];
 const parts=[...(kind==='wind'?[{geometry:new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),32),color:C.sky},
  // A short wind curl, not a separate horn.
  {geometry:tube([[.06,1.48,0],[-.12,1.58,0],[-.25,1.72,0],[-.19,1.84,0],[-.05,1.83,0],[.015,1.73,0],[-.05,1.69,0]],.075),color:C.sky},
  ellipsoid(C.cream,[0,.54,.425],[.35,.32,.145]),
  // Scarf wraps the whole body; its ends sit over the belly.
  {geometry:new THREE.TorusGeometry(.467,.055,8,40),color:C.blue,position:[0,.845,0],scale:[1,.98,1],rotation:[Math.PI/2,0,0]},
  ellipsoid(C.deep,[-.30,.81,.36],[.09,.085,.07]),
  {...ellipsoid(C.blue,[-.29,.66,.47],[.085,.18,.035]),rotation:[0,0,-.2]},
  {...ellipsoid(C.blue,[-.17,.72,.47],[.065,.13,.035]),rotation:[0,0,.3]}]:speciesParts(kind,C)),
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
 const scale=1.78/1.915,lodGeometries=new Map();
 function create(scene,{seated=false,phase=0}={}){
  const player=new THREE.Group(),body=new THREE.Group(),motion=new THREE.Group();body.add(motion);player.add(body);scene.add(player);motion.scale.setScalar(scale);
  player.name=spec.name;body.name='Mascot facing';motion.name='Mascot motion';
  const mesh=(geometry,parent=motion)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  mesh(bodyGeometry).name='Wind droplet, scarf and backpack';
  const face=new THREE.Group();face.position.set(...spec.face);face.rotation.x=spec.tilt;motion.add(face);mesh(faceDetails,face);const eyes=mesh(eyeGeometry,face);eyes.name='Blinking eyes';
  const mouth=mesh(mouthGeometry,face);mouth.position.y=kind==='stone'?-.22:-.105;mouth.position.z=kind==='stone'?.05:0;mouth.name='Talking mouth';
  const hands=[-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(side*.455,.77,0);const h=mesh(handGeometry,pivot);h.scale.x=side;pivot.rotation.z=side*.22;motion.add(pivot);return pivot;});
  const feet=[-1,1].map(side=>{const m=mesh(footGeometry);m.position.set(side*.20,.145,.05);return m;});
  if(badgeMaterial){const badge=new THREE.Mesh(badgeGeometry,badgeMaterial);badge.position.set(0,.54,-.654);badge.rotation.y=Math.PI;motion.add(badge);}
  const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;player.add(shadow);
  let time=phase,gait=phase,walking=false,talking=false,greeting=false,seat=null,detail=true;
  // The LOD retains vertex colours and silhouette; build it once per species.
  let lodGeometry=seated?null:lodGeometries.get('standing');
  if(!lodGeometry&&!seated){const parts=[];motion.updateMatrixWorld(true);const inverse=motion.matrixWorld.clone().invert();motion.traverse(o=>{if(o.isMesh&&o.material===material)parts.push(o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));});lodGeometry=mergeColored(parts);lodGeometries.set('standing',lodGeometry);}
  const low=lodGeometry?new THREE.Mesh(lodGeometry,material):null;if(low){low.visible=false;body.add(low);low.scale.setScalar(scale);}
  const detailedParts=[...motion.children];
  const metadata={asset:'Original procedural Sumgyeol mascot',style:'sumgyeol-'+kind,species:kind,name:spec.name,heightMeters:spec.height,humanoid:false,ready:true,animation:'idle',expression:'smile'};
  function update(dt,{speed=walking?2:0,grounded=true,reducedMotion=motionPreference()}={}){
   dt=Number.isFinite(dt)?THREE.MathUtils.clamp(dt,0,.1):0;speed=Number.isFinite(speed)?Math.max(0,speed):0;time+=dt;
   const moving=!seated&&speed>.15,air=!seated&&!grounded;gait+=dt*(moving?Math.min(17,6+speed*.55):4);
   metadata.animation=seated?'seated':air?'jump':moving?(speed>10?'run':'walk'):greeting?'wave':'idle';metadata.expression=talking?'talk':'smile';
   const stride=moving&&!air?Math.sin(gait):0,bounce=moving?Math.abs(Math.sin(gait))*.04:Math.sin(time*2.2)*.009+.009;
   motion.position.y=reducedMotion?0:(air?.035:bounce);
   motion.rotation.set(0,0,reducedMotion||air?0:stride*.035);
   const breath=reducedMotion||moving||air||seated?0:Math.sin(time*2.2)*.008;motion.scale.set(scale*(1-breath*.5),scale*(1+breath),scale*(1-breath*.5));
   feet.forEach((foot,i)=>{const s=i?1:-1;foot.position.set(s*.20,.145+(air?.10:Math.max(0,stride*s)*.10),.05+stride*s*.10);foot.rotation.x=air?-.3:stride*s*.20;});
   const wave=!seated&&!reducedMotion&&!air&&!moving&&greeting&&time%4<2.3;
   hands.forEach((hand,i)=>{const s=i?1:-1;hand.rotation.set(air?-1.0:stride*s*.45,0,s*(air?1.2:.22));});
   if(wave)hands[1].rotation.z=2.35+Math.sin(time*10)*.22;
   const blink=!reducedMotion&&time%4.4>4.23;eyes.scale.y=blink?.08:1;
   mouth.scale.y=talking&&!reducedMotion?1.2+Math.sin(time*15)*.45:1;
   if(seated&&seat){
    const seatScale=.74;motion.scale.setScalar(seatScale);motion.rotation.set(0,0,0);
    // Flat underside rests on the seat; little feet hang beyond its front edge.
    motion.position.set(0,(seat.seatY-player.position.y)/player.scale.y-.17*seatScale,.18);
    feet.forEach((foot,i)=>{foot.position.set(i?.20:-.20,.145,.51);foot.rotation.x=-.25;});
    hands.forEach((hand,i)=>{hand.rotation.set(-.5,0,(i?1:-1)*.12);});
   }
   if(low){low.visible=!detail;low.position.copy(motion.position);low.rotation.copy(motion.rotation);low.scale.copy(motion.scale);}
  }
  function facePosition(){player.updateMatrixWorld(true);return face.getWorldPosition(new THREE.Vector3()).toArray();}
  update(0);
  return {player,group:player,body,legs:[],arms:[],shadow,update,metadata,facePosition,setWalking:value=>{walking=!seated&&Boolean(value);},setTalking:value=>{talking=Boolean(value);},setGreeting:value=>{greeting=Boolean(value);},setDetail:value=>{detail=seated||Boolean(value);shadow.visible=detail;detailedParts.forEach(p=>{p.visible=detail;});if(low)low.visible=!detail;},setSeat:options=>{seat={...options};update(0);},seatDiagnostics:()=>{if(!seat)return null;player.updateMatrixWorld(true);return {species:kind,seatY:seat.seatY,hipY:motion.localToWorld(new THREE.Vector3(0,.17,0)).y,floorY:seat.floorY,feet:feet.map(f=>f.getWorldPosition(new THREE.Vector3()).toArray())};}};
 }
 return {create,resources};
}
