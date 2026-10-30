import {batchStaticMeshes} from './static-mesh-batches.js?v=player-r54';
import * as THREE from './three.module.js';
import {segmentDistance} from './navigation.js';
import {isWalkingRoad,roadWidthAt} from './road-profile.js?v=player-r54';

// A game preview of the user's installation policy, not an existing facility.
export function escalatorLayout(data){
 const road=data.roads.find(r=>r.id==='471489721');if(!road)return null;
 const sourceA=road.points[0],sourceB=road.points.at(-1),length=Math.hypot(sourceB[0]-sourceA[0],sourceB[1]-sourceA[1]),ux=(sourceB[0]-sourceA[0])/length,uz=(sourceB[1]-sourceA[1])/length;
 const at=d=>[sourceA[0]+ux*d,sourceA[1]+uz*d];
 const clear=p=>data.roads.every(r=>isWalkingRoad(r)||r.points.every((b,i)=>!i||segmentDistance(...p,r.points[i-1],b)>roadWidthAt(r,...p)/2+3.1));
 let begin=0,end=length;while(begin<length&&!clear(at(begin)))begin+=.2;while(end>begin&&!clear(at(end)))end-=.2;
 // Reserve the flat end platforms inside the safe area as well.
 begin+=1.7;end-=1.7;
 return {a:at(begin),b:at(end),ux,uz,nx:-uz,nz:ux,length:end-begin,width:5.4,lanes:[{side:-1.92,direction:1},{side:-.64,direction:-1}],stairs:{side:1.46,width:2.22},landing:1.6};
}
export function createCampusEscalator({scene,data,terrain,collisionMeshes,obstacles}){
 const layout=escalatorLayout(data);if(!layout)return null;
 const {a,ux,uz,nx,nz,length}=layout,group=new THREE.Group();group.name='Policy preview: covered campus escalators';scene.add(group);
 const at=(d,u=0)=>[a[0]+ux*d+nx*u,a[1]+uz*d+nz*u];
 // The slope also rises sideways. A centre-line sample lets its uphill side
 // cover the far lane. Fit one shared elevation to the whole structure width,
 // including the ground underneath the front/back of every moving tread.
 const intervals=Math.ceil(length/.5),sampleStep=length/intervals,profile=[];
 for(let i=0;i<=intervals;i++){
  const d=i*sampleStep;let highest=-Infinity;
  for(const along of [-.5,-.25,0,.25,.5])for(let side=0;side<=24;side++)highest=Math.max(highest,terrain.heightAt(...at(d+along,-2.8+5.6*side/24)));
  profile.push(highest+.24);
 }
 const h=d=>{const t=THREE.MathUtils.clamp(d,0,length)/sampleStep,i=Math.min(intervals-1,Math.floor(t));return THREE.MathUtils.lerp(profile[i],profile[i+1],t-i);};
 const steel=new THREE.MeshStandardMaterial({color:'#91a3a8',roughness:.55,metalness:.32}),dark=new THREE.MeshStandardMaterial({color:'#263238',roughness:.7}),yellow=new THREE.MeshStandardMaterial({color:'#d9bb51',roughness:.8}),glass=new THREE.MeshStandardMaterial({color:'#9fc6d0',transparent:true,opacity:.35,roughness:.23,side:THREE.DoubleSide}),white=new THREE.MeshStandardMaterial({color:'#e0e8e7',roughness:.7});
 const cube=new THREE.BoxGeometry(1,1,1),tubeGeo=new THREE.CylinderGeometry(1,1,1,8);let elapsed=0;const speed=1.15,treadCount=Math.ceil(length/.38),pitch=length/treadCount,lanes=[],landings=[];
 function box(x,y,z,w,ht,d,material,angle=0,collision=false){const m=new THREE.Mesh(cube,material);m.position.set(x,y,z);m.scale.set(w,ht,d);m.rotation.y=angle;m.receiveShadow=true;group.add(m);if(collision)collisionMeshes.push(m);return m;}
 function line(v1,v2,r,material){const delta=new THREE.Vector3(...v2).sub(new THREE.Vector3(...v1)),m=new THREE.Mesh(tubeGeo,material);m.position.copy(new THREE.Vector3(...v1)).addScaledVector(delta,.5);m.scale.set(r,delta.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(m);return m;}
 function ribbon(u,y,width,material){const vertices=[],indices=[];for(let d=0;d<=length+1;d+=1){d=Math.min(length,d);const p=at(d,u);vertices.push(p[0]-nx*width/2,h(d)+y,p[1]-nz*width/2,p[0]+nx*width/2,h(d)+y,p[1]+nz*width/2);if(d===length)break;}for(let i=0;i<vertices.length/6-1;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;group.add(m);}
 // A continuous opaque base also closes the narrow gaps beside and between
 // the moving lanes, so hillside grass cannot show inside the balustrades.
 ribbon(-1.275,-.15,2.75,steel);
 for(const lane of layout.lanes){
  const treads=new THREE.InstancedMesh(cube,steel,treadCount),edges=new THREE.InstancedMesh(cube,yellow,treadCount);treads.name=`Escalator ${lane.direction>0?'up':'down'} moving treads`;group.add(treads,edges);lanes.push({...lane,treads,edges});
  for(const side of [-.57,.57]){
   const u=lane.side+side;
   for(let d=0;d<length;d+=2){const end=Math.min(length,d+2),p=at(d,u),q=at(end,u);line([p[0],h(d)+.92,p[1]],[q[0],h(end)+.92,q[1]],.065,dark);line([p[0],h(d)+.12,p[1]],[q[0],h(end)+.12,q[1]],.065,steel);}
   const verts=[];for(let d=0;d<=Math.ceil(length);d++){const v=Math.min(d,length),p=at(v,u);verts.push(p[0],h(v)+.15,p[1],p[0],h(v)+.86,p[1]);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));const ids=[];for(let i=0;i<verts.length/6-1;i++){const k=i*2;ids.push(k,k+2,k+1,k+1,k+2,k+3);}geo.setIndex(ids);geo.computeVertexNormals();group.add(new THREE.Mesh(geo,glass));
  }
 }
 // Canopy over the paired escalators; ordinary stairs remain open beside it.
 for(let d=0;d<=length;d+=8){for(const u of [-2.65,.1]){const p=at(d,u);line([p[0],terrain.heightAt(...p)-.1,p[1]],[p[0],h(d)+2.75,p[1]],.065,white);obstacles.push([p[0],p[1],.10]);}const p=at(d,-2.65),q=at(d,.1);line([p[0],h(d)+2.75,p[1]],[q[0],h(d)+2.75,q[1]],.07,white);}
 for(let d=0;d<length;d+=4){const end=Math.min(length,d+4),p=at(d,-1.275),q=at(end,-1.275),mid=[(p[0]+q[0])/2,(p[1]+q[1])/2];const roof=box(mid[0],(h(d)+h(end))/2+2.81,mid[1],2.95,.08,end-d,glass,Math.atan2(ux,uz));roof.rotation.x=-Math.atan2(h(end)-h(d),end-d);}
 // Graded end platforms meet the surrounding path at their outer edge. Their
 // inner part stays level with the escalator, without raising the road itself.
 for(const end of [0,length]){
  const start=end===0?-layout.landing:length,rows=8,cols=24,depth=layout.landing,values=[],vertices=[],indices=[];
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
   const d=start+depth*row/rows,u=-2.7+5.4*col/cols,p=at(d,u),floor=terrain.heightAt(...p)+.065;
   const outside=end===0?-d:d-length,blend=THREE.MathUtils.clamp((1-outside/depth)/.65,0,1),y=THREE.MathUtils.lerp(floor,Math.max(floor,h(end)),blend);
   values.push(y);vertices.push(p[0],y,p[1]);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const a=row*(cols+1)+col,b=a+1,c=a+cols+1,e=c+1;indices.push(a,b,c,b,e,c);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
  const platform=new THREE.Mesh(geo,white);platform.name=end===0?'Escalator lower graded landing':'Escalator upper graded landing';platform.receiveShadow=true;group.add(platform);collisionMeshes.push(platform);
  const surface=(d,u)=>{const v=THREE.MathUtils.clamp((d-start)/depth*rows,0,rows),w=THREE.MathUtils.clamp((u+2.7)/5.4*cols,0,cols),row=Math.min(rows-1,Math.floor(v)),col=Math.min(cols-1,Math.floor(w)),t=v-row,s=w-col,a=row*(cols+1)+col,h00=values[a],h10=values[a+1],h01=values[a+cols+1],h11=values[a+cols+2];return s+t<=1?h00+(h10-h00)*s+(h01-h00)*t:h11+(h01-h11)*(1-s)+(h10-h11)*(1-t);};
  landings.push({start,end:start+depth,surface});
  for(const lane of layout.lanes){const d=end===0?-.3:length+.3,p=at(d,lane.side);box(p[0],surface(d,lane.side)+.014,p[1],.9,.025,.22,yellow,Math.atan2(ux,uz));}
 }
 // Close the raised sides down to the hillside instead of leaving a floating
 // underside when the cross-slope requires one lane to be lifted.
 for(const u of [-2.7,2.7]){
  const vertices=[],indices=[],count=Math.ceil(length);
  for(let i=0;i<=count;i++){const d=length*i/count,p=at(d,u);vertices.push(p[0],terrain.heightAt(...p)-.12,p[1],p[0],h(d)-.02,p[1]);if(i<count){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const wallMaterial=white.clone();wallMaterial.side=THREE.DoubleSide;const wall=new THREE.Mesh(geo,wallMaterial);group.add(wall);
 }
 const object=new THREE.Object3D(),rotation=Math.atan2(ux,uz);
 function update(dt){elapsed+=dt;for(const lane of lanes)for(let i=0;i<treadCount;i++){const d=(((i+.5)*pitch+elapsed*speed*lane.direction)%length+length)%length,p=at(d,lane.side);object.position.set(p[0],h(d)-.08,p[1]);object.rotation.set(0,rotation,0);object.scale.set(.98,.16,pitch+.015);object.updateMatrix();lane.treads.setMatrixAt(i,object.matrix);const front=at(d+pitch*.42,lane.side);object.position.set(front[0],h(d)+.012,front[1]);object.scale.set(.98,.025,.035);object.updateMatrix();lane.edges.setMatrixAt(i,object.matrix);}for(const lane of lanes){lane.treads.instanceMatrix.needsUpdate=true;lane.edges.instanceMatrix.needsUpdate=true;}}
 function project(x,z){const dx=x-a[0],dz=z-a[1];return {d:dx*ux+dz*uz,u:dx*nx+dz*nz};}
 function heightAt(x,z){const {d,u}=project(x,z);if(d< -1.6||d>length+1.6)return null;if(d<0||d>length){const platform=landings.find(p=>d>=p.start-1e-8&&d<=p.end+1e-8);return platform&&Math.abs(u)<=2.7?platform.surface(d,u)+.012:null;}for(const lane of lanes)if(Math.abs(u-lane.side)<.53){const phase=elapsed*speed*lane.direction,p=Math.floor((d-phase)/pitch)*pitch+phase+pitch/2;return h(THREE.MathUtils.clamp(p,0,length))+.012;}return null;}
 function conveyorAt(x,z){const {d,u}=project(x,z);if(d<0||d>length)return null;const lane=lanes.find(l=>Math.abs(u-l.side)<.48);return lane?{x:ux*speed*lane.direction,z:uz*speed*lane.direction}:null;}
 update(0);const batching=batchStaticMeshes(group);return {layout,update,heightAt,conveyorAt,profileAt:h,at,stats:{policyPreview:true,coveredEscalators:2,ordinaryStairWidth:layout.stairs.width,bottom:layout.a,top:layout.b,carriagewayIntrusion:false,batching}};
}
