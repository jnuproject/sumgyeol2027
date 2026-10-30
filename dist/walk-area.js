import {MAIN_AVENUE_WIDTH,MAIN_AVENUE_SIDEWALK_WIDTH} from './road-profile.js?v=player-r54';
import {segmentDistance} from './navigation.js';

// Free exploration uses the complete displayed map. The focus corridors below
// still describe tours/scenery, but no longer act as invisible player walls.
export function createCampusWalkArea(bounds){
 const contains=(x,z,radius=.55)=>Number.isFinite(x)&&Number.isFinite(z)&&x>=bounds.minX+radius&&x<=bounds.maxX-radius&&z>=bounds.minZ+radius&&z<=bounds.maxZ-radius;
 return {bounds,restricted:false,contains,containsRaw:(x,z)=>contains(x,z,0),outline:()=>[]};
}

// Gameplay boundaries, not real fences or a change to the source map.
export function createFocusWalkArea(data){
 const regions=[];
 const box=(id,minX,maxX,minZ,maxZ)=>regions.push({id,type:'box',minX,maxX,minZ,maxZ});
 const road=(id,halfWidth,points)=>{
  const source=points??data.roads.find(r=>r.id===id)?.points;
  if(!source)throw Error('Walking connection missing: '+id);
  regions.push({id,type:'corridor',halfWidth,points:source});
 };
 const buildings=ids=>ids.map(id=>{const b=data.buildings.find(b=>b.id===id);if(!b)throw Error('Focus building missing: '+id);return b;});
 const extent=bs=>{const p=bs.flatMap(b=>b.points);return {minX:Math.min(...p.map(p=>p[0])),maxX:Math.max(...p.map(p=>p[0])),minZ:Math.min(...p.map(p=>p[1])),maxZ:Math.max(...p.map(p=>p[1]))};};
 const [gx,gz]=data.spawn;
 box('gate',gx-30,gx+30,gz-12,gz+28);
 const student=extent(buildings(['471697621']));
 box('student-hall',student.minX-10,student.maxX+13,student.minZ-10,student.maxZ+12);
 const economics=extent(buildings(['471297909','471297922']));
 box('economics',economics.minX-12,economics.maxX+13,economics.minZ-15,economics.maxZ+13);
 const library=extent(buildings(['286237890']));
 box('central-library',library.minX-10,library.maxX+12,212,library.maxZ+5);
 road('286085067',MAIN_AVENUE_WIDTH/2+MAIN_AVENUE_SIDEWALK_WIDTH+.7);
 const connector=data.roads.find(r=>r.id==='93690444');
 road('economics-connection',7.2,connector?.points.filter(p=>p[1]<=83));
 road('471694209',5.8);
 road('471489721',5.5);
 const containsRaw=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&regions.some(r=>r.type==='box'
  ?x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ
  :r.points.some((p,i)=>i&&segmentDistance(x,z,r.points[i-1],p)<=r.halfWidth));
 function contains(x,z,radius=.55){
  if(!containsRaw(x,z))return false;
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;if(!containsRaw(x+Math.cos(angle)*radius,z+Math.sin(angle)*radius))return false;}
  return true;
 }
 const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
 for(const r of regions){const p=r.type==='box'?[[r.minX,r.minZ],[r.maxX,r.maxZ]]:r.points,h=r.halfWidth??0;
  bounds.minX=Math.min(bounds.minX,...p.map(p=>p[0]-h));bounds.maxX=Math.max(bounds.maxX,...p.map(p=>p[0]+h));bounds.minZ=Math.min(bounds.minZ,...p.map(p=>p[1]-h));bounds.maxZ=Math.max(bounds.maxZ,...p.map(p=>p[1]+h));
 }
 function outline(step=1.5){
  const minX=Math.floor(bounds.minX/step)*step-step,minZ=Math.floor(bounds.minZ/step)*step-step;
  const cols=Math.ceil((bounds.maxX-minX)/step)+2,rows=Math.ceil((bounds.maxZ-minZ)/step)+2,mask=new Uint8Array(cols*rows),edges=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)mask[row*cols+col]=containsRaw(minX+(col+.5)*step,minZ+(row+.5)*step)?1:0;
  const inside=(col,row)=>col>=0&&row>=0&&col<cols&&row<rows&&mask[row*cols+col];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)if(inside(col,row)){
   const x=minX+col*step,z=minZ+row*step;
   if(!inside(col-1,row))edges.push([[x,z],[x,z+step]]);
   if(!inside(col+1,row))edges.push([[x+step,z],[x+step,z+step]]);
   if(!inside(col,row-1))edges.push([[x,z],[x+step,z]]);
   if(!inside(col,row+1))edges.push([[x,z+step],[x+step,z+step]]);
  }
  return edges;
 }
 return {regions,bounds,restricted:true,contains,containsRaw,outline};
}

export function safeFocusPosition(point,area,canStand){
 const valid=p=>area.contains(...p)&&canStand(...p);
 if(valid(point))return point.slice();
 for(let radius=.75;radius<=24;radius+=.75)for(let i=0;i<32;i++){
  const angle=i*Math.PI/16,p=[point[0]+Math.cos(angle)*radius,point[1]+Math.sin(angle)*radius];if(valid(p))return p;
 }
 return null;
}
