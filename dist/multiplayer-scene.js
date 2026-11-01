import {remoteEmote} from './emotes.js?v=emote-r59';
import {createEmoteEffects} from './emote-effects.js?v=emote-r59';
import {createRemoteCrowd} from './remote-crowd.js?v=capacity-r56';
import * as THREE from './three.module.js';
import {remoteTarget} from './remote-motion.js?v=capacity-r56';
import {createMultiplayer} from './multiplayer.js?v=emote-r59';
export function createMultiplayerScene({scene,avatar,player,camera,mobile,canStand=()=>true,heightAt=()=>-Infinity,networkFactory=createMultiplayer}){
 const motionPreference=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
 const badge=document.createElement('div');badge.id='onlineCount';badge.setAttribute('role','status');badge.title='최근 20초 내 함께 산책 중인 화면 수 · 나 포함. 혼잡할 때는 혼자 산책할 수 있어요.';document.body.append(badge);
 const net=networkFactory({appearance:avatar.metadata?.speciesIndex??0,onStatus:({state,count})=>{badge.dataset.state=state;badge.textContent=state==='connected'?`접속 ${count}명`:state==='crowded'?`접속 ${count}명 · 혼잡`:state==='connecting'?'접속 중…':'혼자 산책 중';}}),pool=[],assigned=new Map(),crowd=createRemoteCrowd(scene),effects=createEmoteEffects(scene);
 function make(species){const companion=avatar.createCompanion(scene,{remotePlayer:true}),canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#e7fcff';ctx.beginPath();ctx.roundRect(0,0,256,64,30);ctx.fill();ctx.fillStyle='#067a9b';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('● 함께 산책 중',128,43);const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.scale.set(1.7,.425,1);label.position.y=2.4;companion.group.add(label);companion.group.traverse(o=>{if(o.isMesh)o.castShadow=false;});return {companion,label,id:null,species};}
 const hide=()=>{net.disconnect();for(const a of pool)a.companion.group.visible=false;crowd.update([],0,false);effects.update([]);},show=()=>net.reconnect();
 const visibility=()=>document.hidden?hide():show();document.addEventListener?.('visibilitychange',visibility);
 addEventListener('pagehide',hide);addEventListener('pageshow',show);addEventListener('offline',hide);addEventListener('online',show);
 let last=null;
 function update(dt,{mode,grounded,emote={id:0,seq:0,age:0}}){
  const p=player.position,speed=last?Math.min(30,Math.hypot(p.x-last.x,p.z-last.z)/Math.max(dt,.001)):0;last={x:p.x,z:p.z};
  net.update({x:p.x,y:p.y,z:p.z,yaw:avatar.body.rotation.y,speed,emote:emote.id,emoteSeq:emote.seq,active:mode==='walk'&&!document.hidden});
  const visible=[...net.peers.values()].filter(a=>a.active&&performance.now()-a.receivedAt<5000).map(a=>({...a,distance:Math.hypot(a.x-camera.position.x,a.z-camera.position.z)})).filter(a=>a.distance<(mobile?110:180)).sort((a,b)=>a.distance-b.distance),detailed=visible.slice(0,mobile?16:28),compact=visible.slice(mobile?16:28),ids=new Set(detailed.map(a=>a.id));
  crowd.update(compact.map(p=>({...remoteTarget(p,performance.now(),{canStand,heightAt}),yaw:p.yaw})),dt,mode!=='welcome');
  const reactionEntries=mode==='walk'&&emote.id?[{key:'local',...p,id:emote.id,age:emote.age}]:[];
  for(const peer of visible){const e=remoteEmote(peer,performance.now());if(e.id&&mode!=='welcome')reactionEntries.push({key:peer.id,x:peer.x,y:Math.max(peer.y,heightAt(peer.x,peer.z)),z:peer.z,...e});}
  effects.update(reactionEntries,{reducedMotion:motionPreference?.matches??false});
  for(const [id,a]of assigned)if(!ids.has(id)){a.id=null;a.companion.group.visible=false;assigned.delete(id);}
  for(const p of detailed){const species=0;let a=assigned.get(p.id);if(a&&a.species!==species){a.id=null;a.companion.group.visible=false;assigned.delete(p.id);a=null;}if(!a){a=pool.find(a=>!a.id&&a.species===species);if(!a){a=make(species);pool.push(a);}a.id=p.id;assigned.set(p.id,a);a.companion.group.position.set(p.x,p.y,p.z);a.companion.body.rotation.y=p.yaw;}
   const c=a.companion,g=c.group,target=remoteTarget(p,performance.now(),{canStand,heightAt});g.visible=mode!=='welcome';const blend=1-Math.exp(-dt*18);if(Math.hypot(g.position.x-target.x,g.position.z-target.z)>15)g.position.set(target.x,target.y,target.z);else g.position.lerp(new THREE.Vector3(target.x,target.y,target.z),blend);c.body.rotation.y+=Math.atan2(Math.sin(p.yaw-c.body.rotation.y),Math.cos(p.yaw-c.body.rotation.y))*blend;const reaction=remoteEmote(p,performance.now());c.setEmote?.(reaction.id,reaction.age);c.setDetail?.(p.distance<25||reaction.id>0);c.setWalking(target.walking);c.update(dt);a.label.visible=!reaction.id&&p.distance<(visible.length>8?8:25);
  }
 }
 return {update,metadata:()=>({...net.metadata(),reactions:effects.metadata(),rendered:assigned.size+crowd.metadata().rendered,detailed:assigned.size,compact:crowd.metadata(),appearances:Array(assigned.size+crowd.metadata().rendered).fill(0)}),dispose(){net.dispose();crowd.dispose();effects.dispose();for(const a of pool){a.companion.group.removeFromParent();a.label.material.map.dispose();a.label.material.dispose();}badge.remove();document.removeEventListener?.('visibilitychange',visibility);removeEventListener('pagehide',hide);removeEventListener('pageshow',show);removeEventListener('offline',hide);removeEventListener('online',show);}};
}
