import * as THREE from './three.module.js';
import {insidePolygon} from './navigation.js';

// Identity checked against the photographed campus guide and named ground photos.
// Heights/spacing are modelling estimates, not surveyed dimensions.
export const BUILDING_PROFILES={
 '471490497':{kind:'administration',height:14.5,wall:'#e5e5dc',roof:'#b7bcb6',floors:3},
 '286237890':{kind:'library',height:14.5,wall:'#b8a486',roof:'#a5a49b',floors:3},
 '471697621':{kind:'student',height:13.8,wall:'#e1dfd2',roof:'#aaaead',floors:4},
 '471377428':{kind:'law',height:12.4,wall:'#c6c4b4',roof:'#b26c4d',floors:3},
 '953564967':{kind:'music',height:12.2,wall:'#bc9138',roof:'#505b60',floors:3},
 '953564621':{kind:'digital',height:10.5,wall:'#e6e7df',roof:'#b7bcb6',floors:2},
 '953546804':{kind:'faculty',height:14.7,wall:'#d5d9d5',roof:'#adb5b1',floors:3},
 '741724817':{kind:'residenceBrick',height:14.2,wall:'#b49c83',roof:'#868b77',floors:4},
 '964181122':{kind:'dorm',height:18.2,wall:'#eeeee6',roof:'#b6b8a9',floors:5},
 '286070813':{kind:'gym',height:12.5,wall:'#c8ccbf',roof:'#6c7b7e',floors:1}
};
function clip(points,axis,at,less){
 const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ia=less?a[axis]<=at:a[axis]>=at,ib=less?b[axis]<=at:b[axis]>=at;if(ia)out.push(a);if(ia!==ib){const t=(at-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;
}
export function observedMassParts(b,height){
 if(b.id!=='471697621')return [{points:b.points,height,y:.2}];
 return [{points:b.points,height:8.4,y:.2},{points:clip(b.points,1,1,false),height:height-8.4,y:8.6}];
}
export function foldedRoofParts(points,height,rise,axis=1,ridges=1){
 const ring=points.slice();if(ring.length>1&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
 const low=Math.min(...ring.map(p=>p[axis])),high=Math.max(...ring.map(p=>p[axis])),span=(high-low)/ridges,parts=[];
 for(let j=0;j<ridges;j++){const a=low+j*span,b=a+span,m=(a+b)/2;let strip=clip(clip(ring,axis,a,false),axis,b,true);for(const side of[true,false]){const poly=clip(strip,axis,m,side);if(poly.length<3)continue;const triangles=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(...p)),[]);const positions=poly.flatMap(p=>[p[0],height+.4+rise*(1-Math.abs(p[axis]-m)/(span*.5)),p[1]]);parts.push({positions,indices:triangles.flat()});}}
 return parts;
}
export function addObservedFacade({scene,b,height,panel,box,base}){
 const profile=BUILDING_PROFILES[b.id];if(!profile)return false;
 const kind=profile.kind,glass='#64817e',trim=kind==='music'?'#526067':'#d4d7ce';
 const archMaterial=new THREE.MeshStandardMaterial({color:'#526a6f',roughness:.4,metalness:.16,side:THREE.DoubleSide});
 for(let i=1;i<b.points.length;i++){
  const a=b.points[i-1],e=b.points[i],dx=e[0]-a[0],dz=e[1]-a[1],length=Math.hypot(dx,dz);if(length<4)continue;
  const nx=dz/length,nz=-dx/length,out=insidePolygon((a[0]+e[0])/2+nx*.3,(a[1]+e[1])/2+nz*.3,b.points)?-1:1;
  const p=(t,y,w,h,d,color,offset=.2)=>panel(a,e,t,y,w,h,d,color,offset*out);
  if(kind==='gym'){
   p(.5,height-1.9,length-1.2,1.8,.25,glass);p(.5,.9,length,.8,.3,'#8c9590');continue;
  }
  if(['faculty','digital','dorm','residenceBrick'].includes(kind)){
   const count=Math.max(1,Math.floor(length/(kind==='digital'?3.0:3.4)));
   for(let floor=0;floor<profile.floors;floor++){
    const y=kind==='dorm'?(floor?4.6+(floor-1)*3.1:1.6):2.2+floor*(kind==='faculty'?4.2:kind==='residenceBrick'?3.3:4.0);
    if(kind==='dorm'&&floor===0){p(.5,y,length-.5,2.2,.25,'#455452');for(let n=0;n<count;n++)p((n+.5)/count,1.4,.38,2.8,.5,'#dadbd1',.4);continue;}
    for(let n=0;n<count;n++){
     const t=(n+.5)/count;p(t,y,kind==='dorm'?1.5:2.25,kind==='digital'?2.35:1.75,.25,glass,.24);
     p(t,y,.075,kind==='digital'?2.42:1.82,.4,'#d9ded8',.36);
     if(kind==='faculty'||kind==='residenceBrick')p(t,y-1.03,3.0,.24,.45,'#c1c7c2');
    }
   }
   p(.5,height-.1,length,.52,.5,profile.wall,.35);
   const front=(a[1]+e[1])*.5>Math.max(...b.points.map(p=>p[1]))-2&&length>20;
   if(kind==='digital'&&front){
    const width=Math.min(30,length*.49);p(.5,6.65,width,4.8,.35,glass,.5);
    p(.5,9.65,width+1.0,.7,1.1,'#c5a94a',.8);p(.5,3.85,width+1.0,.65,1.1,'#c5a94a',.8);
    for(const t of[.5-width/(2*length),.5+width/(2*length)])p(t,6.65,.65,6.1,1.0,'#c5a94a',.8);
    for(let dx=-width/2;dx<=width/2;dx+=2.2)p(.5+dx/length,6.65,.09,4.8,.5,'#70888c',.9);
    for(const y of[5.5,7.8])p(.5,y,width,.09,.5,'#70888c',.9);
    p(.5,1.9,9,3.2,.4,glass,.45);
   }
   if(kind==='faculty'&&front){p(.48,height*.53,5.8,height+1.1,.75,'#aab3b1',.5);p(.54,1.9,12,3.5,.5,glass,.5);p(.54,3.9,13,.5,2.2,'#d1d5d0',1.0);}
   if(kind==='dorm'&&length>20){p(.5,height*.52,5,height*.97,.5,'#bfa64e',.5);for(let y=4.7;y<height-1;y+=3.1){p(.5,y,3.8,1.4,.6,'#495953',.7);p(.5,y-.45,4.0,.1,.85,'#dadbd0',1.0);}}
   if(kind==='residenceBrick'){for(let y=3.2;y<height;y+=3.3)p(.5,y,length,.24,.4,'#c9c4ad',.3);if(nx*out>.8&&length>25){p(.5,height*.53,7,height*.85,.4,glass,.4);p(.5,3.4,11,.5,3.6,'#c6ac49',1.5);}}
   continue;
  }
  const faceHeight=kind==='student'&&(a[1]+e[1])*.5<1?8.4:height;
  const count=Math.max(1,Math.floor(length/(kind==='music'?3.1:3.8))),levels=kind==='student'&&faceHeight<10?2:profile.floors;
  for(let floor=0;floor<levels;floor++){
   const y=1.8+floor*(faceHeight-2)/levels;
   if(kind==='student'||kind==='administration'||kind==='library')p(.5,y,length-.9,kind==='student'?2.05:1.85,.25,glass);
   if(kind==='student')p(.5,y+1.3,length,.18,.3,'#ba6247');
   for(let n=0;n<count;n++){
    const t=(n+.5)/count;
    if(kind==='administration'&&floor===levels-1){
     const width=Math.min(2.5,length/count*.76),h=3.4,r=width/2;const shape=new THREE.Shape();shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,h-r);shape.absarc(0,h-r,r,0,Math.PI,false);shape.lineTo(-r,0);
     const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,12),archMaterial);mesh.position.set(a[0]+dx*t+nx*.33*out,base+height-4.35,a[1]+dz*t+nz*.33*out);mesh.rotation.y=-Math.atan2(dz,dx);scene.add(mesh);
    }else if(kind==='music'){
     p(t,y,.72,2.4,.26,glass);p(t,y-.05,.98,2.65,.10,'#4e5c62',.1);
    }else if(kind==='law'){
     const front=(a[1]+e[1])*.5>173&&length>25;
     if(front&&floor===levels-1){
      const shape=new THREE.Shape();shape.moveTo(-.9,0);shape.lineTo(.9,0);shape.lineTo(.9,1.8);shape.absarc(0,1.8,.9,0,Math.PI,false);shape.lineTo(-.9,0);
      const arch=new THREE.Mesh(new THREE.ShapeGeometry(shape,14),archMaterial);arch.position.set(a[0]+dx*t+nx*.29*out,base+y-1.1,a[1]+dz*t+nz*.29*out);arch.rotation.y=-Math.atan2(dz,dx);scene.add(arch);
     }else p(t,y,1.8,2.2,.22,glass);p(t,y-1.2,2.2,.18,.4,'#e2dfd0');
    }else p(t,y,.12,2.05,.36,trim,.35);
   }
  }
  if(kind==='library'){
   p(.5,height-1.35,length,2.5,.5,'#b6a183');
   for(let n=0;n<count;n++)p((n+.5)/count,height*.41,.32,height*.77,.48,'#ecece1',.45);
   if(length>25)p(.055,height*.47,4.6,height*.91,.36,'#53615e',.23);
  }
  if(kind==='music'){p(.5,height+.05,length+.8,.48,1.0,'#4f5b60');p(.5,3.6,length,.58,.42,'#566167');}
  if(kind==='administration')p(.5,height+.1,length+.2,.32,.8,'#c8ccc3');
 }
 if(kind==='law'){
  // South-facing classical portico and gables observed in the2023 campus photograph.
  const cx=-153.5,cz=181.3;
  const stone=new THREE.MeshStandardMaterial({color:'#cbc6b5',roughness:.9});
  for(const x of[-4.4,-1.5,1.5,4.4]){
   const column=new THREE.Mesh(new THREE.CylinderGeometry(.43,.49,9.6,16),stone);column.position.set(cx+x,base+5.3,cz);column.castShadow=true;scene.add(column);
   box(cx+x,10.25,cz,1.1,.45,1.1,'#8b8d83');box(cx+x,.55,cz,1.2,.5,1.2,'#8b8d83');
  }
  for(const [x,z,w]of[[cx,182.3,13],[-181.5,176.1,10],[-130.5,177,10]]){
   const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,2.7);shape.closePath();
   const g=new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:false}),pediment=new THREE.Mesh(g,stone);pediment.position.set(x,base+12.3,z);pediment.castShadow=true;scene.add(pediment);
   box(x,11.3,z,w+.4,1.6,.95,'#cbc6b5');box(x,12.22,z,w+.8,.30,1.15,'#777f7b');box(x,10.5,z,w+.8,.30,1.15,'#999d94');
  }
 }
 if(kind==='residenceBrick'){
  const sections=[{points:clip(b.points,1,343,true),axis:1},{points:clip(clip(b.points,1,377,false),0,-460,true),axis:1},{points:clip(clip(b.points,1,343,false),1,377,true),axis:0}];
  const material=new THREE.MeshStandardMaterial({color:profile.roof,roughness:.95,side:THREE.DoubleSide});
  for(const section of sections)for(const part of foldedRoofParts(section.points,height,1.8,section.axis,1)){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));geo.setIndex(part.indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.position.y=base;mesh.castShadow=true;scene.add(mesh);}
 }
 if(kind==='law'||kind==='gym'){
  const parts=foldedRoofParts(b.points,height,kind==='law'?3.1:2.7,kind==='law'?1:0,kind==='law'?1:3);
  const material=new THREE.MeshStandardMaterial({color:profile.roof,roughness:.92,side:THREE.DoubleSide});
  for(const part of parts){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));g.setIndex(part.indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.position.y=base;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
 }
 // Low service/stair volume: visual mass only, safely inside the footprint.
 if(kind==='library'||kind==='student'){
  const c=b.center;if(insidePolygon(c[0],c[1],b.points))box(c[0],height+1.4,c[1],5,2.2,4,profile.wall);
 }
 return true;
}
