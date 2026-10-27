import * as THREE from './three.module.js';

// Soccer footprint is OSM. The enclosing eight-lane oval is reconstructed
// from the public aerial/model/ground photograph; its dimensions are estimates.
export function addSportsGrounds(scene,data,terrain,environment){
 const field=data.areas.find(a=>a.id==='286070859');if(!field)return;
 const pts=field.points,cx=(Math.min(...pts.map(p=>p[0]))+Math.max(...pts.map(p=>p[0])))/2,cz=(Math.min(...pts.map(p=>p[1]))+Math.max(...pts.map(p=>p[1])))/2;
 const angle=.009,co=Math.cos(angle),si=Math.sin(angle),at=(x,z)=>[cx+co*x+si*z,cz-si*x+co*z];
 const track=new THREE.MeshStandardMaterial({color:'#a56457',roughness:.96,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const grass=new THREE.MeshStandardMaterial({color:'#638466',roughness:1,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
 const paint=new THREE.MeshStandardMaterial({color:'#e0e3d5',roughness:.9,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
 function oval(radius,straight=84.4){const p=[];for(let i=0;i<=48;i++){const a=i*Math.PI/48;p.push(at(Math.cos(a)*radius,straight/2+Math.sin(a)*radius));}for(let i=0;i<=48;i++){const a=Math.PI+i*Math.PI/48;p.push(at(Math.cos(a)*radius,-straight/2+Math.sin(a)*radius));}return p;}
 function line(points,width=.12,offset=.078){for(let i=1;i<points.length;i++)environment.segment(points[i-1],points[i],width,paint,offset);}
 function closed(points,width=.12,offset=.078){line([...points,points[0]],width,offset);}
 const apron=new THREE.MeshStandardMaterial({color:'#a3aaa0',roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 environment.polygon(oval(50),apron,.035);
 environment.polygon(oval(46.26),track,.044);
 environment.polygon(oval(36.5),grass,.058);
 for(let lane=0;lane<=8;lane++)closed(oval(36.5+lane*1.22),.085,.064);
 closed(field.points,.14,.079);line([at(-34,0),at(34,0)],.12);
 closed(Array.from({length:64},(_,i)=>at(Math.cos(i*Math.PI/32)*9.15,Math.sin(i*Math.PI/32)*9.15)),.12);
 for(const side of[-1,1]){
  closed([at(-20.16,side*54),at(-20.16,side*37.5),at(20.16,side*37.5),at(20.16,side*54)],.12);
  closed([at(-9.16,side*54),at(-9.16,side*48.5),at(9.16,side*48.5),at(9.16,side*54)],.12);
  const material=new THREE.MeshStandardMaterial({color:'#e1e2d8',roughness:.6});
  function pole(a,b){const delta=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,delta.length(),7),material);mesh.position.copy(a).addScaledVector(delta,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;scene.add(mesh);}
  const p=at(-3.66,side*54.3),q=at(3.66,side*54.3),y=terrain.heightAt(cx,cz+side*54.3)+.08;
  pole(new THREE.Vector3(p[0],y,p[1]),new THREE.Vector3(p[0],y+2.44,p[1]));pole(new THREE.Vector3(q[0],y,q[1]),new THREE.Vector3(q[0],y+2.44,q[1]));pole(new THREE.Vector3(p[0],y+2.44,p[1]),new THREE.Vector3(q[0],y+2.44,q[1]));
 }
 // Two small recreation courts occupy the south infield in the reference.
 for(const cx of [-12,12]){
  closed([at(cx-10,58),at(cx+10,58),at(cx+10,70),at(cx-10,70)],.10,.082);
  line([at(cx,58),at(cx,70)],.10,.082);
  closed(Array.from({length:32},(_,i)=>at(cx+Math.cos(i*Math.PI/16)*2,64+Math.sin(i*Math.PI/16)*2)),.10,.082);
  for(const side of [-1,1])closed([at(cx+side*10,61),at(cx+side*6,61),at(cx+side*6,67),at(cx+side*10,67)],.10,.082);
 }
 return {recreationCourts:2,id:field.id,center:[cx,cz],source:'OSM pitch outline, observed enclosing oval',trackDimensionsEstimated:true};
}
