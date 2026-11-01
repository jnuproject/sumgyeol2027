import * as THREE from './three.module.js';
import {EMOTES,EMOTE_MS} from './emotes.js?v=emote-r59';
// Four shared textures, sprites allocated only for currently reacting visitors.
export function createEmoteEffects(scene){
 const textures=new Map(),active=new Map(),pool=[];
 function texture(id){
  if(textures.has(id))return textures.get(id);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.roundRect(5,5,118,108,36);ctx.fill();ctx.beginPath();ctx.moveTo(51,107);ctx.lineTo(64,126);ctx.lineTo(77,107);ctx.fill();
  ctx.font='68px "Apple Color Emoji","Segoe UI Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(EMOTES[id-1].emoji,64,62);
  const result=new THREE.CanvasTexture(canvas);result.colorSpace=THREE.SRGBColorSpace;textures.set(id,result);return result;
 }
 return {
  update(entries,{reducedMotion=false}={}){
   const ids=new Set(entries.map(e=>e.key));for(const [key,sprite]of active)if(!ids.has(key)){sprite.visible=false;active.delete(key);pool.push(sprite);}
   for(const e of entries){if(!e.id||e.age>=EMOTE_MS)continue;let sprite=active.get(e.key);if(!sprite){sprite=pool.pop()??new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:true}));scene.add(sprite);active.set(e.key,sprite);}
    sprite.material.map=texture(e.id);sprite.material.opacity=Math.min(1,(EMOTE_MS-e.age)/300);sprite.visible=true;
    const size=reducedMotion?1:1+Math.sin(Math.min(1,e.age/250)*Math.PI)*.12;sprite.scale.setScalar(.95*size);sprite.position.set(e.x,e.y+2.3+(reducedMotion?0:Math.sin(e.age/450)*.05),e.z);
   }
  },
  metadata:()=>({visible:active.size,textures:textures.size}),
  dispose(){for(const s of [...active.values(),...pool]){s.removeFromParent();s.material.dispose();}for(const t of textures.values())t.dispose();active.clear();pool.length=0;}
 };
}
