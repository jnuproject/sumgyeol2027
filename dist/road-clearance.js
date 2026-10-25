import * as THREE from './three.module.js';

// Display-only alignment estimates; the downloaded OSM source stays immutable.
// The widened avenue must pass WEST of the administration wing, not through it.
const fields=[
 {id:'administration-avenue',x:[-123,-94,-70,-42],z:[-166,-126,-87,-51],dx:-9,dz:0},
 {id:'dormitory-north-edge',x:[-420,-396,-342,-314],z:[370,378,384,391],dx:0,dz:-2.5},
 {id:'marine3-north-edge',x:[160,182,248,265],z:[-282,-276,-268,-260],dx:0,dz:-1.6},
 {id:'translation-north-edge',x:[120,140,223,240],z:[-198,-190,-181,-172],dx:0,dz:-2},
 {id:'social-sciences-access',x:[-20,0,32,50],z:[32,42,56,66],dx:0,dz:4}
];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function weight(v,[a,b,c,d]){return smooth((v-a)/(b-a))*smooth((d-v)/(d-c));}
function adjusted(p){let x=p[0],z=p[1];for(const f of fields){const w=weight(p[0],f.x)*weight(p[1],f.z);x+=w*f.dx;z+=w*f.dz;}return[x,z];}
export function prepareCampusRoads(source){
 if(source.renderRoadCorrections)return source;
 const changed=[];
 const roads=source.roads.map(road=>{
  const points=[];
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],near=fields.some(f=>Math.max(a[0],b[0])>f.x[0]&&Math.min(a[0],b[0])<f.x[3]&&Math.max(a[1],b[1])>f.z[0]&&Math.min(a[1],b[1])<f.z[3]);
   const n=near?Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4)):1;
   for(let k=0;k<n;k++)points.push(adjusted([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]));
  }
  points.push(adjusted(road.points.at(-1)));
  if(road.id==='93690444'){const b=points.at(-1),a=points.at(-2),l=Math.hypot(b[0]-a[0],b[1]-a[1]);points[points.length-1]=[b[0]+(a[0]-b[0])*Math.min(4.4/l,.9),b[1]+(a[1]-b[1])*Math.min(4.4/l,.9)];}
  if(points.length!==road.points.length||points.some((p,i)=>!road.points[i]||Math.hypot(p[0]-road.points[i][0],p[1]-road.points[i][1])>.001))changed.push(road.id);
  return {...road,points};
 });
 return {...source,roads,renderRoadCorrections:{version:'clearance-r29',estimated:true,changedRoadIds:changed,fields:fields.map(f=>({id:f.id,offset:[f.dx,f.dz]})),buildingFootprintsUnchanged:true,minimumSurfaceSetback:.6}};
}
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0)/2;
export const polygonArea=p=>Math.abs(signedArea(p));
const bounds=p=>({minX:Math.min(...p.map(p=>p[0])),maxX:Math.max(...p.map(p=>p[0])),minZ:Math.min(...p.map(p=>p[1])),maxZ:Math.max(...p.map(p=>p[1]))});
const intersects=(a,b)=>a.minX<b.maxX&&a.maxX>b.minX&&a.minZ<b.maxZ&&a.maxZ>b.minZ;
function clip(poly,a,b,sign,inside=true){
 const value=p=>((b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*sign*(inside?1:-1),out=[];
 for(let i=0;i<poly.length;i++){const c=poly[i],d=poly[(i+1)%poly.length],vc=value(c),vd=value(d),ic=vc>=-1e-8,id=vd>=-1e-8;if(ic)out.push(c);if(ic!==id){const t=vc/(vc-vd);out.push(c.map((n,j)=>n+(d[j]-n)*t));}}
 return out;
}
export function createRoadClearance(buildings,margin=.6){
 const obstacles=buildings.map(b=>{const ring=b.points.slice();if(ring.length>1&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();const triangles=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]).map(t=>t.map(i=>ring[i]));if(margin>0)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l>.00001){const nx=dz/l*margin,nz=-dx/l*margin;triangles.push([[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz],[a[0]+nx,a[1]+nz]]);}triangles.push(Array.from({length:8},(_,j)=>[a[0]+Math.cos(j*Math.PI/4)*margin,a[1]+Math.sin(j*Math.PI/4)*margin]));}return{bounds:bounds(triangles.flat()),triangles};});
 const stats={margin,affectedTriangles:0,sourceBuildings:buildings.length};
 function trim(raw){
  if(!raw.positions.length||!obstacles.length)return raw;
  const candidateBounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};for(let i=0;i<raw.positions.length;i+=3){candidateBounds.minX=Math.min(candidateBounds.minX,raw.positions[i]);candidateBounds.maxX=Math.max(candidateBounds.maxX,raw.positions[i]);candidateBounds.minZ=Math.min(candidateBounds.minZ,raw.positions[i+2]);candidateBounds.maxZ=Math.max(candidateBounds.maxZ,raw.positions[i+2]);}const candidates=obstacles.filter(o=>intersects(candidateBounds,o.bounds));if(!candidates.length)return raw;
  const pos=[],normals=[],indices=[],hasNormals=!!raw.normals;
  for(let i=0;i<raw.indices.length;i+=3){
   const ids=Array.from(raw.indices.slice(i,i+3)),subject=ids.map(n=>[raw.positions[n*3],raw.positions[n*3+1],raw.positions[n*3+2],...(hasNormals?Array.from(raw.normals.slice(n*3,n*3+3)):[])]),bb=bounds(subject.map(p=>[p[0],p[2]]));let parts=[subject],changed=false;
   for(const obstacle of candidates){if(!intersects(bb,obstacle.bounds))continue;
    for(const triangle of obstacle.triangles){if(!parts.length)break;const next=[],sign=Math.sign(signedArea(triangle))||1;
     for(const part of parts){let inner=part;const outside=[];for(let edge=0;edge<triangle.length&&inner.length;edge++){const a=triangle[edge],b=triangle[(edge+1)%triangle.length],piece=clip(inner,a,b,sign,false);if(piece.length>=3&&polygonArea(piece.map(p=>[p[0],p[2]]))>1e-8)outside.push(piece);inner=clip(inner,a,b,sign,true);}if(inner.length>=3&&polygonArea(inner.map(p=>[p[0],p[2]]))>1e-8){changed=true;next.push(...outside);}else next.push(part);}
     parts=next;
    }
   }
   if(changed)stats.affectedTriangles++;
   for(const part of parts){const start=pos.length/3;for(const p of part){pos.push(...p.slice(0,3));if(hasNormals)normals.push(...p.slice(3,6));}for(let j=1;j<part.length-1;j++)if(polygonArea([part[0],part[j],part[j+1]].map(p=>[p[0],p[2]]))>1e-8)indices.push(start,start+j,start+j+1);}
  }
  return {positions:Float32Array.from(pos),indices:Uint32Array.from(indices),normals:hasNormals?Float32Array.from(normals):undefined};
 }
 function contains(x,z){return obstacles.some(o=>x>=o.bounds.minX&&x<=o.bounds.maxX&&z>=o.bounds.minZ&&z<=o.bounds.maxZ&&o.triangles.some(poly=>{const sign=Math.sign(signedArea(poly))||1;return poly.every((a,i)=>{const b=poly[(i+1)%poly.length];return((b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0]))*sign>=-1e-8;});}));}
 return {trim,stats,contains};
}
