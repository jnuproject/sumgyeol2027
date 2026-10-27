import {createSeatedPose} from './seated-pose.js?v=ground-r44';
import * as THREE from './three.module.js';
import {FBXLoader} from './vendor/FBXLoader.js';

// Kenney Animated Characters Protagonists, CC0. The source rig and motion are
// retained. Clothing is an edited CC0 SVG, with an independent breath motif.
export async function loadSumgyeolAvatar(scene){
 const base='./assets/characters/sumgyeol/',loader=new FBXLoader();
 const [model,idle,run,jump,skinImage,brandImage]=await Promise.all([
  loader.loadAsync(base+'character.fbx'),loader.loadAsync(base+'idle.fbx'),
  loader.loadAsync(base+'run.fbx'),loader.loadAsync(base+'jump.fbx'),
  new THREE.ImageLoader().loadAsync(base+'sumgyeol-skin.svg'),
  new THREE.ImageLoader().loadAsync('./assets/sumgyeol_symbol_blue.png')
 ]);
 const shirtCanvas=document.createElement('canvas');shirtCanvas.width=shirtCanvas.height=1024;const shirt=shirtCanvas.getContext('2d');shirt.drawImage(skinImage,0,0,1024,1024);
 // Original transparent symbol, kept in its native proportions on both badges.
 const markH=60,markW=markH*brandImage.width/brandImage.height;
 for(const y of [601,801]){
  shirt.fillStyle='#ffffff';shirt.beginPath();shirt.roundRect(279,y,84,76,10);shirt.fill();
  if(y===601){shirt.save();shirt.translate(321+markW/2,y+8+markH);shirt.scale(-1,-1);shirt.drawImage(brandImage,0,0,markW,markH);shirt.restore();}
  else shirt.drawImage(brandImage,321-markW/2,y+8,markW,markH);
 }
 const skin=new THREE.CanvasTexture(shirtCanvas);
 skin.colorSpace=THREE.SRGBColorSpace;skin.anisotropy=4;
 const material=new THREE.MeshStandardMaterial({map:skin,roughness:.9,metalness:0});
 model.traverse(o=>{if(o.isMesh){o.material=material;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
 model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=1.78/size.y;
 model.scale.multiplyScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
 const player=new THREE.Group(),body=new THREE.Group();body.add(model);player.add(body);scene.add(player);
 const mixer=new THREE.AnimationMixer(model),actions={},metadata={asset:'Kenney Animated Characters Protagonists',license:'CC0-1.0',style:'sumgyeol-sky-blue',logo:'original-sumgyeol-symbol-front-and-back',heightMeters:1.78,ready:true,animation:'idle'};
 for(const [name,source]of[['idle',idle],['run',run],['jump',jump]]){
  const clip=source.animations.find(c=>c.name.toLowerCase().endsWith('|'+name))?.clone();if(!clip)throw new Error('Missing character animation: '+name);
  clip.name=name;
  clip.tracks=clip.tracks.filter(t=>model.getObjectByName(t.name.slice(0,t.name.lastIndexOf('.'))));
  // Keep movement in the existing collision controller; never translate the
  // avatar through a wall using animation root motion.
  for(const track of clip.tracks)if(/(?:^|\|)(?:Root|root)\.position$/.test(track.name))for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}
  actions[name]=mixer.clipAction(clip);
 }
 actions.jump.setLoop(THREE.LoopOnce,1);actions.jump.clampWhenFinished=true;
 let current='idle';actions.idle.play();
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.48,32),new THREE.MeshBasicMaterial({color:'#263f31',opacity:.15,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;player.add(shadow);
 function update(dt,{speed,grounded,reducedMotion=false}){
  const next=!grounded?'jump':speed>.15?'run':'idle';
  if(next!==current){actions[current].fadeOut(.16);const action=actions[next];action.reset().setEffectiveWeight(1).fadeIn(.16).play();current=next;metadata.animation=next;}
  actions.run.timeScale=THREE.MathUtils.clamp(speed/7,.55,1.8);
  mixer.update(Math.min(dt,.12));
 }
 // Companions share meshes/textures but have independent bones and idle clocks.
 const studentMaterials=new Map();
 function studentMaterial(variant){
  const colors=['#718672','#d0b18b','#8a7b9d','#b87062','#6487a2','#b9a65f','#686b80','#b990a7'],key=variant%colors.length;
  if(studentMaterials.has(key))return studentMaterials.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');ctx.drawImage(skinImage,0,0,1024,1024);
  const pixels=ctx.getImageData(0,0,1024,1024),target=new THREE.Color(colors[key]).convertLinearToSRGB();
  // Recolour the blue cloth only. Skin/hair retain the original artwork and
  // background students do not wear the policy NPC's branded name badge.
  for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];if(b>r*1.12&&g>r*.98&&b>45){const shade=Math.min(1.2,(r+g+b)/370);pixels.data[i]=Math.min(255,target.r*255*shade);pixels.data[i+1]=Math.min(255,target.g*255*shade);pixels.data[i+2]=Math.min(255,target.b*255*shade);}}
  ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const result=new THREE.MeshStandardMaterial({map:texture,roughness:.94});studentMaterials.set(key,result);return result;
 }
 function createCompanion(scene,{student=false,variant=0,seated=false}={}){
  const root=body.clone(true),lookup=new Map(),original=[],copies=[];
  body.traverse(o=>original.push(o));root.traverse(o=>copies.push(o));
  original.forEach((o,i)=>lookup.set(o,copies[i]));
  for(const source of original)if(source.isSkinnedMesh){const copy=lookup.get(source);copy.skeleton=source.skeleton.clone();copy.skeleton.bones=source.skeleton.bones.map(b=>lookup.get(b));copy.bind(copy.skeleton,source.bindMatrix);}
  if(student)root.traverse(o=>{if(o.isMesh)o.material=studentMaterial(variant);});
  root.visible=true;root.position.y=0;
  const group=new THREE.Group();group.add(root);scene.add(group);if(student)group.scale.setScalar([.96,1.02,.98,1.04][variant%4]);
  const idleMixer=new THREE.AnimationMixer(root),idleAction=idleMixer.clipAction(actions.idle.getClip()),walkAction=idleMixer.clipAction(actions.run.getClip());idleAction.play();walkAction.timeScale=.36;
  const head=root.getObjectByName('Head'),headPoint=new THREE.Vector3(),offset=new THREE.Vector3();let walking=false;
  idleMixer.update(0);const seatPose=seated?createSeatedPose(root):null;
  function update(dt){idleMixer.update(dt);seatPose?.apply();}
  function setWalking(value){if(seated||walking===value)return;walking=value;const from=value?idleAction:walkAction,to=value?walkAction:idleAction;from.fadeOut(.25);to.reset().fadeIn(.25).play();}
  function facePosition(){group.updateMatrixWorld(true);if(head){head.getWorldPosition(headPoint);offset.set(0,.12,.045).applyAxisAngle(new THREE.Vector3(0,1,0),root.rotation.y);headPoint.add(offset);}else headPoint.copy(group.position).add(new THREE.Vector3(0,1.63,0));return headPoint.toArray();}
  return {group,body:root,update,setWalking,facePosition,setSeat:options=>seatPose?.setSurface(options),seatDiagnostics:()=>seatPose?.diagnostics()};
 }
 return {player,body,legs:[],arms:[],shadow,update,metadata,createCompanion,symbolImage:brandImage};
}
