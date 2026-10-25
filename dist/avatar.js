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
  new THREE.ImageLoader().loadAsync('./assets/sumgyeol_wordmark_blue.png')
 ]);
 const shirtCanvas=document.createElement('canvas');shirtCanvas.width=shirtCanvas.height=1024;const shirt=shirtCanvas.getContext('2d');shirt.drawImage(skinImage,0,0,1024,1024);
 // The same original Sumgyeol artwork used by the navigation, not recreated text.
 // White cloth badges preserve its native blue without recoloring the logo.
 for(const y of [601,801]){shirt.fillStyle='#ffffff';shirt.beginPath();shirt.roundRect(265,y,112,76,8);shirt.fill();if(y===601){shirt.save();shirt.translate(369,y+61);shirt.scale(-1,-1);shirt.drawImage(brandImage,0,0,96,52);shirt.restore();}else shirt.drawImage(brandImage,273,y+9,96,52);}
 const skin=new THREE.CanvasTexture(shirtCanvas);
 skin.colorSpace=THREE.SRGBColorSpace;skin.anisotropy=4;
 const material=new THREE.MeshStandardMaterial({map:skin,roughness:.9,metalness:0});
 model.traverse(o=>{if(o.isMesh){o.material=material;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
 model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=1.78/size.y;
 model.scale.multiplyScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
 const player=new THREE.Group(),body=new THREE.Group();body.add(model);player.add(body);scene.add(player);
 const mixer=new THREE.AnimationMixer(model),actions={},metadata={asset:'Kenney Animated Characters Protagonists',license:'CC0-1.0',style:'sumgyeol-sky-blue',logo:'original-sumgyeol-wordmark-front-and-back',heightMeters:1.78,ready:true,animation:'idle'};
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
 return {player,body,legs:[],arms:[],shadow,update,metadata};
}
