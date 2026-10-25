import {addCurrentPlantingBeds} from './observed-planting.js?v=lanes-r26b';
import * as THREE from './three.module.js';
import {roadWidthAt} from './road-profile.js?v=lanes-r26b';

// Roadview-visible street furniture, independently modelled. Source road/park
// outlines anchor placement; dimensions and exact prop positions are estimates.
export function addObservedPeriphery({scene,data,terrain,environment,surfaces,box,obstacles,collisionMeshes}){
 const stats={busShelters:0,woodFenceSegments:0,roadArrows:0,basaltStones:0};
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.88});
 const dark=mat('#3f4b47'),glass=new THREE.MeshStandardMaterial({color:'#96aaa0',roughness:.24,transparent:true,opacity:.35,side:THREE.DoubleSide});
 const absolute=(x,y,z,w,h,d,c)=>box(x,y-terrain.heightAt(x,z),z,w,h,d,c);
 const libraryRoad=data.roads.find(r=>r.id==='93690429');
 if(libraryRoad){
  // North-side wooded sidewalk and shelter, next to the recorded library road.
  environment.segment([-200,201.3],[-69,201.3],2.35,surfaces.redPaving,.13);
  environment.segment([-199,202.6],[-70,202.6],.22,mat('#a4aaa0'),.17);
  environment.segment([-198,207.5],[-70,208.0],.13,mat('#d7b854'),.105);
  const x=-143,z=199.9,base=terrain.heightAt(x,z);
  absolute(x,base+.07,z,5.2,.14,2.15,'#a3aaa0');
  const roof=absolute(x,base+2.85,z,5.25,.16,2.35,'#38413f');roof.rotation.z=-.018;
  for(const dx of[-2.35,2.35])for(const dz of[-.86,.86]){
   const p=absolute(x+dx,base+1.42,z+dz,.065,2.8,.065,'#495b52');obstacles.push([x+dx,z+dz,.12]);collisionMeshes.push(p);
  }
  function pane(px,pz,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,2.35,d),glass);m.position.set(px,base+1.5,pz);m.receiveShadow=true;scene.add(m);collisionMeshes.push(m);}
  pane(x,z-.9,4.65,.025);pane(x-2.35,z,.025,1.8);pane(x+2.35,z,.025,1.8);
  absolute(x,base+.51,z-.35,3.9,.13,.46,'#8d7a61');
  for(const dx of[-1.5,1.5])absolute(x+dx,base+.27,z-.35,.075,.48,.4,'#46564c');
  absolute(x,base+1.78,z-.86,1.2,1.3,.06,'#c8d2c5');
  for(let i=0;i<6;i++)absolute(x,base+2.19-i*.15,z-.81,.91,.025,.035,'#8d9d90');
  stats.busShelters=1;
 }
 // Brown park railing seen near the student-hall approach. The park boundary is OSM.
 const park=data.areas.find(a=>a.id==='969694343');
 if(park){const x=-99.2;for(let z=-71;z<-38;z+=2.6){
  const h=terrain.heightAt(x,z);absolute(x,h+.58,z,.17,1.16,.17,'#6a5541');
  for(const y of[.43,1.0]){const ha=terrain.heightAt(x,z),hb=terrain.heightAt(x,z+2.6),beam=absolute(x,(ha+hb)/2+y,z+1.3,.12,.13,2.65,'#79634b');beam.rotation.x=-Math.atan2(hb-ha,2.6);}
  obstacles.push([x,z,.15]);stats.woodFenceSegments++;
 }}
 const paint=mat('#e2e1d2');paint.polygonOffset=true;paint.polygonOffsetFactor=-3;paint.polygonOffsetUnits=-3;
 function arrow(x,z,side){
  const at=(u,v)=>[x+u,z+side*v];
  environment.polygon([at(-.12,1.5),at(.12,1.5),at(.12,-.2),at(.78,-.2),at(0,-1.45),at(-.78,-.2),at(-.12,-.2)],paint,.116);stats.roadArrows++;
 }
 const main=data.roads.find(r=>r.id==='286085067');
 if(main)for(const z of[-135,-55]){
  const i=main.points.findIndex((p,i)=>i&&z>=Math.min(p[1],main.points[i-1][1])&&z<=Math.max(p[1],main.points[i-1][1]));
  if(i<1)continue;const a=main.points[i-1],b=main.points[i],x=a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]),w=roadWidthAt(main,x,z);
  for(const side of[-1,1])for(const lane of[.125,.375]){
   arrow(x+side*w*lane,z,side);
   const points=[[0,-1.3],[.65,0],[0,1.3],[-.65,0],[0,-1.3]].map(([u,v])=>[x+side*w*lane+u,z+8+v]);for(let n=1;n<points.length;n++)environment.segment(points[n-1],points[n],.12,paint,.116);
  }
 }
 // Irregular low basalt wall along economics1, instead of repeated square blocks.
 const rocks=[],rockGeo=new THREE.IcosahedronGeometry(1,1);
 for(let x=-67;x<-3;x+=.64)for(let row=0;row<2;row++){
  const z=89.24+row*.12,noise=Math.sin(x*37.1+row*19.3),h=terrain.heightAt(x,z);
  rocks.push({x:x+noise*.12,y:h+.16+row*.24,z,w:.29+noise*.055,h:.15+Math.abs(noise)*.06,d:.23});
 }
 const stones=new THREE.InstancedMesh(rockGeo,mat('#666e62'),rocks.length),o=new THREE.Object3D(),color=new THREE.Color();
 rocks.forEach((r,i)=>{o.position.set(r.x,r.y,r.z);o.scale.set(r.w,r.h,r.d);o.rotation.set(i*.31,i*.73,i*.17);o.updateMatrix();stones.setMatrixAt(i,o.matrix);color.setHSL(.18,.05,.36+(i%7)*.018);stones.setColorAt(i,color);});stones.castShadow=true;stones.receiveShadow=true;scene.add(stones);stats.basaltStones=rocks.length;
 Object.assign(stats,addCurrentPlantingBeds({scene,terrain,environment,surfaces,box,obstacles}));
 return {stats};
}
