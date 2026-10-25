import * as THREE from './three.module.js';

// Capture our own reconstructed scene. No street-view pixels or external imagery
// are sampled. Local probes approximate nearby glazing, not survey-grade optics.
export function createCampusReflections({renderer,scene,heightAt,anchors,hidden=[],lightweight=false}){
 if(lightweight)return {stats:{enabled:false,probeCount:0,resolution:0,active:'lightweight sky reflection',bakeMilliseconds:0,source:'existing local sky material; no six-direction scene captures on mobile'},update(){},dispose(){}};
 const glass=new Set();scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.userData?.campusGlass)glass.add(m);});
 const original=new Map([...glass].map(m=>[m,m.envMap])),probes=[];
 const resolution=renderer.capabilities.isWebGL2?128:64;
 const type=renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;
 const started=performance.now(),oldEnvironment=scene.environment,oldEnvironmentIntensity=scene.environmentIntensity;
 const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.shadowMap.autoUpdate,visibility=hidden.map(o=>[o,o.visible]);
 const sun=[];scene.traverse(o=>{if(o.isDirectionalLight&&o.castShadow)sun.push({light:o,position:o.position.clone(),target:o.target.position.clone()});});
 try{
  for(const [o]of visibility)o.visible=false;scene.environment=null;renderer.shadowMap.autoUpdate=false;
  for(const anchor of anchors){
   const position=new THREE.Vector3(anchor.position[0],heightAt(...anchor.position)+2.7,anchor.position[1]);
   for(const s of sun){s.light.position.set(position.x-100,position.y+160,position.z-70);s.light.target.position.copy(position);s.light.target.updateMatrixWorld();}
   const target=new THREE.WebGLCubeRenderTarget(resolution,{type,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter});
   const cube=new THREE.CubeCamera(.35,300,target);cube.position.copy(position);cube.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;
   cube.update(renderer,scene);probes.push({name:anchor.name,position,target});
  }
 }catch(error){for(const p of probes)p.target.dispose();probes.length=0;console.warn('Local window reflections unavailable; retaining sky reflection.',error);}
 finally{
  for(const [o,visible]of visibility)o.visible=visible;
  for(const s of sun){s.light.position.copy(s.position);s.light.target.position.copy(s.target);s.light.target.updateMatrixWorld();}
  renderer.setRenderTarget(oldTarget);renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=true;
  scene.environment=oldEnvironment;scene.environmentIntensity=oldEnvironmentIntensity;
 }
 const stats={enabled:probes.length===anchors.length,probeCount:probes.length,resolution,bakeMilliseconds:Math.round(performance.now()-started),active:null,source:'six-direction renders of this independent local game scene'};
 let active=null;
 function update(x,z,{night=false,quality='balanced',dt=.016}={}){
  if(!probes.length)return;
  let nearest=probes[0];for(const p of probes)if(Math.hypot(p.position.x-x,p.position.z-z)<Math.hypot(nearest.position.x-x,nearest.position.z-z))nearest=p;
  const chosen=quality==='low'?null:nearest;
  if(chosen!==active){active=chosen;for(const m of glass){m.envMap=chosen?.target.texture??original.get(m);m.needsUpdate=true;}scene.environment=chosen?.target.texture??oldEnvironment;stats.active=chosen?.name??'sky fallback';}
  const mix=1-Math.exp(-dt*2);
  for(const m of glass)m.envMapIntensity+=((night?.18:1.05)-m.envMapIntensity)*mix;
  scene.environmentIntensity+=((night?.035:.20)-scene.environmentIntensity)*mix;
 }
 return {stats,update,dispose(){for(const p of probes)p.target.dispose();for(const m of glass)m.envMap=original.get(m);scene.environment=oldEnvironment;scene.environmentIntensity=oldEnvironmentIntensity;}};
}
