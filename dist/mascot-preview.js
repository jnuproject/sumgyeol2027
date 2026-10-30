import * as THREE from './three.module.js';
import {createWindMascotFactory} from './wind-mascot.js?v=mascot-r52';
const canvas=document.querySelector('#mascot'),stage=document.querySelector('#stage');
try{
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(1.8,1.55,4.5);camera.lookAt(0,.9,0);
 scene.add(new THREE.HemisphereLight('#f2fcff','#c4b9a0',2.4));const sun=new THREE.DirectionalLight('#fff4dd',3);sun.position.set(-3,6,5);scene.add(sun);const fill=new THREE.DirectionalLight('#a6e2fa',1.4);fill.position.set(4,3,-3);scene.add(fill);
 const texture=await new THREE.TextureLoader().loadAsync('./assets/sumgyeol_symbol_blue.png');texture.colorSpace=THREE.SRGBColorSpace;
 const mascot=createWindMascotFactory({symbolTexture:texture}).create(scene);mascot.body.rotation.y=-.1;
 // A soft radial contact shadow, separate from the model's geometry.
 mascot.shadow.visible=false;const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(72,103,106,.24)');gradient.addColorStop(.45,'rgba(72,103,106,.12)');gradient.addColorStop(1,'rgba(72,103,106,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.75,1.35),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.002;scene.add(shadow);
 let action='idle',time=0,last=performance.now(),drag=null;
 document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{action=button.dataset.action;time=0;document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();mascot.body.rotation.y+=e.key==='ArrowLeft'?-.3:.3;}});
 canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;mascot.body.rotation.y+=(e.clientX-drag.x)*.012;drag.x=e.clientX;});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;});
 const resize=()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.set(1.8,1.55,4.5).multiplyScalar(width<height*.8?1.12:1);camera.lookAt(0,.9,0);camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(stage);resize();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!document.hidden){time+=dt;const jump=action==='jump'&&time<.85,phase=Math.min(time/.85,1);mascot.player.position.y=jump?Math.sin(phase*Math.PI)*.6:0;mascot.setGreeting(action==='wave');mascot.setTalking(action==='talk');mascot.update(dt,{speed:action==='run'?16:action==='walk'?3:0,grounded:!jump,reducedMotion:reduced.matches});shadow.material.opacity=1-mascot.player.position.y*.65;renderer.render(scene,camera);canvas.dataset.state=JSON.stringify({...mascot.metadata,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}catch(error){console.error(error);document.querySelector('#error').hidden=false;}
