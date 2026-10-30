import * as THREE from './three.module.js';
import {createMultiplayer} from './multiplayer.js';
export function createMultiplayerScene({scene,avatar,player,camera,mobile,networkFactory=createMultiplayer}){
 const badge=document.createElement('div');badge.id='onlineCount';badge.setAttribute('role','status');badge.title='현재 연결된 게임 화면 수 · 나 포함';document.body.append(badge);
 const net=networkFactory({onStatus:({state,count})=>{badge.dataset.state=state;badge.textContent=state==='connected'?`접속 ${count}명`:state==='connecting'?'접속 중…':'연결 재시도 중';}}),pool=[],assigned=new Map();
 function make(){const companion=avatar.createCompanion(scene),canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#e7fcff';ctx.beginPath();ctx.roundRect(0,0,256,64,30);ctx.fill();ctx.fillStyle='#067a9b';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('● 함께 산책 중',128,43);const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.scale.set(1.7,.425,1);label.position.y=2.4;companion.group.add(label);companion.group.traverse(o=>{if(o.isMesh)o.castShadow=false;});return {companion,label,id:null};}
 const hide=()=>{net.disconnect();for(const a of pool)a.companion.group.visible=false;},show=()=>net.reconnect();
 addEventListener('pagehide',hide);addEventListener('pageshow',show);addEventListener('offline',hide);addEventListener('online',show);
 let last=null;
 function update(dt,{mode,grounded}){
  const p=player.position,speed=last?Math.min(30,Math.hypot(p.x-last.x,p.z-last.z)/Math.max(dt,.001)):0;last={x:p.x,z:p.z};
  net.update({x:p.x,y:p.y,z:p.z,yaw:avatar.body.rotation.y,speed,active:mode==='walk'&&!document.hidden});
  const visible=[...net.peers.values()].filter(a=>a.active&&performance.now()-a.receivedAt<5000).map(a=>({...a,distance:Math.hypot(a.x-camera.position.x,a.z-camera.position.z)})).filter(a=>a.distance<(mobile?110:180)).sort((a,b)=>a.distance-b.distance).slice(0,mobile?16:28),ids=new Set(visible.map(a=>a.id));
  for(const [id,a]of assigned)if(!ids.has(id)){a.id=null;a.companion.group.visible=false;assigned.delete(id);}
  for(const p of visible){let a=assigned.get(p.id);if(!a){a=pool.find(a=>!a.id);if(!a){a=make();pool.push(a);}a.id=p.id;assigned.set(p.id,a);a.companion.group.position.set(p.x,p.y,p.z);a.companion.body.rotation.y=p.yaw;}
   const c=a.companion,g=c.group;g.visible=mode!=='welcome';const blend=1-Math.exp(-dt*12);if(Math.hypot(g.position.x-p.x,g.position.z-p.z)>15)g.position.set(p.x,p.y,p.z);else g.position.lerp(new THREE.Vector3(p.x,p.y,p.z),blend);c.body.rotation.y+=Math.atan2(Math.sin(p.yaw-c.body.rotation.y),Math.cos(p.yaw-c.body.rotation.y))*blend;c.setWalking(p.speed>.4&&performance.now()-p.receivedAt<600);c.update(dt);a.label.visible=p.distance<25;
  }
 }
 return {update,metadata:()=>({...net.metadata(),rendered:assigned.size}),dispose(){net.dispose();for(const a of pool){a.companion.group.removeFromParent();a.label.material.map.dispose();a.label.material.dispose();}badge.remove();removeEventListener('pagehide',hide);removeEventListener('pageshow',show);removeEventListener('offline',hide);removeEventListener('online',show);}};
}
