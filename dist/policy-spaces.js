import {festivalLayout} from './festival-layout.js?v=festival-r61';
import * as THREE from './three.module.js';
import {batchStaticMeshes} from './static-mesh-batches.js?v=player-r54';
import {segmentDistance} from './navigation.js';
import {isWalkingRoad,roadWidthAt} from './road-profile.js?v=player-r54';
export const POLICY_SPACE_TYPES={lounge:['복합휴식 라운지','#83b8b0'],fitness:['운동기구 교체','#7799b9'],interview:['AI 면접 스튜디오','#939cc6'],'public-tumbler':['공공텀블러','#77ab86'],'meal-price':['학식 단가인하','#c8a36c'],council:['JNU 상생협의체','#77aab9'],bookcamp:['북캠핑 IN ARA','#91aa79'],'student-zone':['대동제 재학생존','#56b2cb']};
// Compact policy preview exhibits, not surveyed existing buildings or promised facilities.
export function policySpacePlacements({data,anchors,canStand,heightAt}){
 const festival=festivalLayout(data),result=[],roads=data.roads.filter(r=>!isWalkingRoad(r));
 for(const a of anchors){if(!POLICY_SPACE_TYPES[a.id])continue;let chosen;
  for(const scale of [1,.65]){for(const radius of [4.5,6,8,10,12]){for(let step=0;step<16;step++){
   const angle=step*Math.PI/8,x=a.npc[0]+Math.cos(angle)*radius,z=a.npc[1]+Math.sin(angle)*radius;
   if(anchors.some(b=>Math.hypot(x-b.npc[0],z-b.npc[1])<3.2)||result.some(b=>Math.hypot(x-b.x,z-b.z)<4.5))continue;
   if(festival?.connector.some((p,i)=>i&&segmentDistance(x,z,festival.connector[i-1],p)<2.4+2.2*scale))continue;
   if(roads.some(r=>r.points.some((p,i)=>i&&segmentDistance(x,z,r.points[i-1],p)<roadWidthAt(r,x,z)/2+2.2*scale)))continue;
   const grid=[[x,z],...Array.from({length:16},(_,i)=>[x+Math.cos(i*Math.PI/8)*2.2*scale,z+Math.sin(i*Math.PI/8)*2.2*scale])];if(!grid.every(p=>canStand(...p)))continue;
   const ys=grid.map(p=>heightAt(...p));if(Math.max(...ys)-Math.min(...ys)>.75)continue;
   chosen={id:a.id,scale,x,z,y:Math.max(...ys)+.06,npc:a.npc};break;
  }if(chosen)break;}if(chosen)break;}if(chosen)result.push(chosen);
 }return result;
}
export function createPolicySpaces({scene,data,anchors,canStand,heightAt,obstacles,cameraCollisionMeshes}){
 const root=new THREE.Group();root.name='Owner-approved policy preview spaces';scene.add(root);const materials=new Map();
 const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c);};
 const placements=policySpacePlacements({data,anchors,canStand,heightAt});
 function label(p,title,color){let m=material(color);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=768;c.height=224;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,768,224);g.fillStyle='#fff';g.textAlign='center';g.font='bold 52px "Apple SD Gothic Neo",sans-serif';g.fillText(title,384,90,720);g.font='28px "Apple SD Gothic Neo",sans-serif';g.fillText('숨결 · 정책 미리보기',384,158);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;m=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,toneMapped:false});}const s=new THREE.Mesh(new THREE.PlaneGeometry(3,.85),m);s.position.set(0,2.7,-1.1);p.add(s);}
 for(const p of placements){const group=new THREE.Group(),[title,color]=POLICY_SPACE_TYPES[p.id];group.position.set(p.x,p.y,p.z);group.scale.setScalar(p.scale);group.rotation.y=Math.atan2(p.npc[0]-p.x,p.npc[1]-p.z);root.add(group);
  const box=(x,y,z,w,h,d,c)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;};
  const cyl=(x,y,z,r,h,c)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),material(c));o.position.set(x,y,z);group.add(o);return o;};
  const base=(p.y-Math.min(...Array.from({length:16},(_,i)=>heightAt(p.x+Math.cos(i*Math.PI/8)*2.2*p.scale,p.z+Math.sin(i*Math.PI/8)*2.2*p.scale))))/p.scale+.04;box(0,-base/2,0,3.2,base,2.8,'#d6ddd4');for(const x of [-1.4,1.4])box(x,1.4,-1.15,.08,2.8,.08,'#a9b9b8');label(group,title,color);
  const chair=(x,z)=>{box(x,.48,z,.65,.18,.65,color);box(x,.85,z-.27,.65,.65,.14,color);for(const dx of [-.23,.23])for(const dz of [-.23,.23])box(x+dx,.22,z+dz,.07,.44,.07,'#a7b9b6');};
  const table=(x,z,w=1.2)=>{box(x,.75,z,w,.12,.7,'#cfb792');box(x,.35,z,.15,.7,.5,'#a7b9b6');};
  if(p.id==='lounge'){box(0,3.05,-.1,3.2,.12,2.8,'#e3efea');chair(-.95,.1);chair(.95,.1);table(0,.5,.8);box(0,1.1,-.95,.9,1.6,.35,'#cbb68f');for(let i=0;i<5;i++)box(-.3+i*.15,1.18,-.71,.10,.35,.18,i%2?color:'#e8c684');}
  if(p.id==='fitness'){box(-.8,.22,.1,.65,.18,1.7,'#43586a');for(const x of [-1.08,-.52])box(x,.85,-.55,.06,1.3,.06,'#82949c');box(-.8,1.3,-.55,.6,.3,.28,'#263f50');box(.7,.48,.1,.48,.18,1.35,color);box(.7,.2,.1,.12,.4,1.1,'#526775');const bar=cyl(.7,1.02,-.3,.045,1.1,'#71858c');bar.rotation.z=Math.PI/2;for(const x of [.25,1.15]){const weight=cyl(x,1.02,-.3,.18,.12,'#354856');weight.rotation.z=Math.PI/2;}}
  if(p.id==='interview'){box(-1.45,1.15,-.1,.10,2.3,2.1,color);box(1.45,1.15,-.1,.10,2.3,2.1,color);box(0,1.15,-1.12,2.8,2.3,.08,'#d2dce6');table(0,-.3,2);box(0,1.2,-.42,.8,.5,.08,'#263d51');box(0,1.5,-.41,.12,.08,.09,'#112a3b');chair(0,.65);}
  if(p.id==='public-tumbler'){box(0,.75,-.25,2.3,1.5,.65,'#e0eee2');box(0,1.05,.1,.8,.25,.04,'#527b70');for(let i=0;i<6;i++){cyl(-.85+i*.34,1.65,-.25,.10,.30,i%2?color:'#f3eee1');}box(.95,.3,.55,.6,.6,.5,color);}
  if(p.id==='meal-price'){table(0,0,2.5);for(const x of [-.8,0,.8]){box(x,.85,0,.55,.06,.4,'#dbe4df');cyl(x,.94,0,.13,.12,'#f0dfb6');}box(0,1.65,-1.03,1.8,.8,.08,'#f3eee0');}
  if(p.id==='council'){cyl(0,.77,0,.68,.12,'#cfb792');cyl(0,.37,0,.10,.74,'#7c969b');chair(-1,0);chair(1,0);box(0,.85,0,.4,.02,.28,'#f3f4e9');}
  if(p.id==='bookcamp'){const roof=new THREE.Mesh(new THREE.ConeGeometry(1.35,1.8,4),material(color));roof.rotation.y=Math.PI/4;roof.position.set(-.45,.9,-.15);group.add(roof);box(.85,.03,.65,.75,.06,.7,'#dfc58e');for(let i=0;i<3;i++)box(.8,.12+i*.08,.6,.45,.07,.3,i%2?color:'#e5dcba');}
  if(p.id==='student-zone'){for(const x of [-1,1]){cyl(x,.65,.45,.07,1.3,'#a5b7bf');cyl(x,.04,.45,.25,.08,'#a5b7bf');}box(0,1.08,.45,2,.13,.045,color);box(0,.04,-.4,2.3,.08,.8,'#87b9b8');}
  // Keep a collision envelope around each exhibit; NPC and approach remain outside it.
  obstacles.push([p.x,p.z,2.2*p.scale]);group.updateMatrixWorld(true);group.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height>1)cameraCollisionMeshes.push(o);});
 }
 const batching=batchStaticMeshes(root,80);return {metadata:()=>({count:placements.length,placements,previewOnly:true,batching})};
}
