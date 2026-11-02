import * as THREE from './three.module.js';
import {CAMPUS_CONNECTIONS} from './campus-connections.js?v=connection-r65';
import {segmentDistance} from './navigation.js';
import {batchStaticMeshes} from './static-mesh-batches.js';
export const CONNECTION_REST_POINTS=[[-172,-68],[-172,-44],[-172,-12]];

// Quiet physical detail: continuous paths and a few places to pause, without
// extra popups, animated crowds or realtime lights.
export function addCampusWalkDetails({scene,terrain,environment,surfaces,obstacles=[],cameraCollisionMeshes=[]}){
 const root=new THREE.Group();root.name='Student hall to stadium promenade';scene.add(root);
 const mats=new Map(),unit=new THREE.BoxGeometry(1,1,1),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.9}));return mats.get(c);};
 function box(x,y,z,w,h,d,c){const m=new THREE.Mesh(unit,mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;root.add(m);return m;}
 function rail(a,b,c='#536260',radius=.04){const v=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,v.length(),6),mat(c));m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());root.add(m);}
 const paving=surfaces.paving.clone();paving.color.set('#b7b8a9');paving.onBeforeCompile=surfaces.paving.onBeforeCompile;paving.customProgramCacheKey=surfaces.paving.customProgramCacheKey;
 const edge=mat('#a5ab9d'),drain=mat('#4f5c57');
 for(const r of CAMPUS_CONNECTIONS)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len;
  environment.segment(a,b,r.width,paving,.105);
  for(const side of[-1,1])for(let d=0;d<len;d+=.75){
   const end=Math.min(len,d+.75),offset=side*(r.width/2-.1),point=t=>[a[0]+dx*t/len+nx*offset,a[1]+dz*t/len+nz*offset],mid=point((d+end)/2);
   const junction=CAMPUS_CONNECTIONS.some(q=>q.points.some((p,j)=>j&&!(q.id===r.id&&j===i)&&segmentDistance(...mid,q.points[j-1],p)<q.width/2+.3));
   if(!junction)environment.segment(point(d),point(end),.18,edge,.12);
  }
  for(let d=5;d<len-3;d+=18){const x=a[0]+dx*d/len+nx*(r.width/2-.38),z=a[1]+dz*d/len+nz*(r.width/2-.38);environment.segment([x-nx*.23,z-nz*.23],[x+nx*.23,z+nz*.23],.38,drain,.125);}
 }
 // Filled corner pads join short curve segments without gaps in the paving.
 for(const r of CAMPUS_CONNECTIONS)for(const [x,z]of r.points){const ring=Array.from({length:16},(_,i)=>[x+Math.cos(i*Math.PI/8)*r.width/2,z+Math.sin(i*Math.PI/8)*r.width/2]);environment.polygon(ring,paving,.107);}
 for(const [x,z]of CONNECTION_REST_POINTS){
  environment.polygon([[x-3.3,z-2.4],[x+1.2,z-2.4],[x+1.2,z+2.4],[x-3.3,z+2.4]],paving,.108);
  const y=Math.max(...[-.6,.6].flatMap(dx=>[-1.5,1.5].map(dz=>terrain.heightAt(x+dx,z+dz))))+.12;
  // Timber slats face the field; feet extend to their own sampled ground.
  for(const dx of[-.4,.4])for(const dz of[-1.1,1.1]){const ground=terrain.heightAt(x+dx,z+dz);box(x+dx,(ground+y+.42)/2,z+dz,.08,y+.42-ground,.1,'#4d5a55');}
  for(let n=0;n<4;n++)box(x-.45+n*.27,y+.46,z,.22,.10,2.8,'#9b8869');
  for(const h of[.79,1.02])box(x+.48,y+h,z,.10,.16,2.8,'#9b8869');
  for(const dz of[-1.1,1.1])box(x+.48,y+.71,z+dz,.08,.72,.08,'#4d5a55');obstacles.push([x,z,1.6]);
  // Small basalt-edged planting pocket beside, not on, the path.
  const px=x+.35,pz=z+3.3,py=terrain.heightAt(px,pz);box(px,py+.26,pz,1.7,.52,1.3,'#5e6860');box(px,py+.55,pz,1.55,.12,1.15,'#6a7b56');
  for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,0),mat(i%2?'#6c8756':'#4c6e4c'));m.position.set(px+(i%3-1)*.42,py+.75,pz+(Math.floor(i/3)-.5)*.43);m.scale.y=.8;root.add(m);}obstacles.push([px,pz,1.1]);
 }
 // Upper-bank rail follows the graded surface and leaves both junctions open.
 for(let z=-74;z<23;z+=3){if(Math.abs(z+31)<4)continue;const x=-179.25,b=Math.min(z+3,23),y=terrain.heightAt(x,z),yb=terrain.heightAt(x,b);rail([x,y+.1,z],[x,y+1.05,z]);rail([x,y+1.05,z],[x,yb+1.05,b]);}
 // Low bollard fixtures add human scale; luminous caps use no dynamic lights.
 for(const z of[-78,-54,-26,-16,8]){const x=-174.6,y=terrain.heightAt(x,z);box(x,y+.48,z,.16,.96,.16,'#53635f');box(x,y+.87,z,.19,.10,.19,'#d5dfc7');obstacles.push([x,z,.3]);}
 const batching=batchStaticMeshes(root,512);root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh)cameraCollisionMeshes.push(o);});
 return {connections:CAMPUS_CONNECTIONS.map(r=>({id:r.id,width:r.width,points:r.points})),restPoints:CONNECTION_REST_POINTS,benches:3,bollards:5,estimated:true,batching};
}
