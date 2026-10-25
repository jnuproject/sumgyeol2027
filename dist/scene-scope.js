import {createFocusWalkArea} from './walk-area.js';
import {segmentDistance} from './navigation.js';

export const VISIBLE_BUILDING_IDS=['471297909','471297922','286237890','471697621'];
// Only directly adjacent, previously observed landmarks. Not a full-campus restore.
export const CONTEXT_BUILDING_IDS=['471697017','471490497','471377428','953564621'];
export function createSceneScope(data){
 const area=createFocusWalkArea(data);
 function outsideDistance(x,z){
  let nearest=Infinity;
  for(const r of area.regions){
   if(r.type==='box')nearest=Math.min(nearest,Math.hypot(Math.max(r.minX-x,0,x-r.maxX),Math.max(r.minZ-z,0,z-r.maxZ)));
   else for(let i=1;i<r.points.length;i++)nearest=Math.min(nearest,Math.max(0,segmentDistance(x,z,r.points[i-1],r.points[i])-r.halfWidth));
  }
  return nearest;
 }
 const context=data.buildings.filter(b=>CONTEXT_BUILDING_IDS.includes(b.id));
 const contextBounds=context.map(b=>({minX:Math.min(...b.points.map(p=>p[0])),maxX:Math.max(...b.points.map(p=>p[0])),minZ:Math.min(...b.points.map(p=>p[1])),maxZ:Math.max(...b.points.map(p=>p[1]))}));
 function renderDistance(x,z){let d=outsideDistance(x,z);for(const r of contextBounds)d=Math.min(d,Math.hypot(Math.max(r.minX-x,0,x-r.maxX),Math.max(r.minZ-z,0,z-r.maxZ)));return d;}
 function alphaAt(x,z){const t=Math.max(0,Math.min(1,(75-renderDistance(x,z))/40));return t*t*(3-2*t);}
 const visibleData={...data,buildings:data.buildings.filter(b=>[...VISIBLE_BUILDING_IDS,...CONTEXT_BUILDING_IDS].includes(b.id)),
  areas:data.areas.filter(a=>!a.tags.sport&&!['pitch','track','playground'].includes(a.tags.leisure))};
 return {area,visibleData,outsideDistance,renderDistance,alphaAt,treeVisible:(x,z)=>renderDistance(x,z)<32};
}

// Crop render geometry only. Original coordinates and physics height samples stay intact.
export function cropSceneGeometry(raw,scope){
 const positions=[],normals=[],colors=[],indices=[],remap=new Map(),alpha=new Map();
 const opacity=i=>{if(!alpha.has(i))alpha.set(i,scope.alphaAt(raw.positions[i*3],raw.positions[i*3+2]));return alpha.get(i);};
 function vertex(old){
  if(remap.has(old))return remap.get(old);
  const index=positions.length/3;remap.set(old,index);positions.push(...raw.positions.slice(old*3,old*3+3));
  if(raw.normals)normals.push(...raw.normals.slice(old*3,old*3+3));colors.push(1,1,1,opacity(old));return index;
 }
 for(let i=0;i<raw.indices.length;i+=3){const triangle=[raw.indices[i],raw.indices[i+1],raw.indices[i+2]];if(triangle.every(v=>opacity(v)<=.01))continue;indices.push(...triangle.map(vertex));}
 return {positions:Float32Array.from(positions),normals:raw.normals?Float32Array.from(normals):undefined,colors:Float32Array.from(colors),indices:Uint32Array.from(indices)};
}
