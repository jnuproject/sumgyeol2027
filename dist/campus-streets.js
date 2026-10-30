import {satellitePoint} from './satellite-layout.js?v=player-r54';
import {roadWidthAt} from './road-profile.js?v=player-r54';
import {segmentDistance,walkable} from './navigation.js';

// Crossing stations traced in the user's north/centre aerial screenshots.
// Keep the user-confirmed straight avenue; only the along-road station comes
// from the imagery. Width, tactile pads and drainage dimensions are estimates.
export const CROSSING_REFERENCES=[
 {id:'science',frame:'north',pixel:[670,493]},
 {id:'museum-garden',frame:'north',pixel:[670,663]},
 {id:'north-lawn',frame:'centre',pixel:[744,53]},
 {id:'gym',frame:'centre',pixel:[744,473]},
 {id:'administration',frame:'centre',pixel:[744,756]},
 {id:'social-sciences',frame:'centre',pixel:[744,1045]},
 {id:'student-south',frame:'centre',pixel:[744,1177]}
];
export function campusCrossings(data){
 const main=data.roads.find(r=>r.id==='286085067');if(!main)return [];
 return CROSSING_REFERENCES.flatMap(ref=>{
  const z=satellitePoint(ref.frame,ref.pixel)[1];
  for(let i=1;i<main.points.length;i++){
   const a=main.points[i-1],b=main.points[i];if(Math.abs(b[1]-a[1])<.01||z<Math.min(a[1],b[1])||z>Math.max(a[1],b[1]))continue;
   const x=a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]);return [{...ref,x,z,width:roadWidthAt(main,x,z),depth:3.5}];
  }return [];
 });
}
export function inCrossingApproach(x,z,crossings){return crossings.some(c=>Math.abs(z-c.z)<c.depth/2+.6&&Math.abs(x-c.x)<c.width/2+1);}

export function avenueFixtures(data){
 const main=data.roads.find(r=>r.id==='286085067');if(!main)return [];
 const crossings=campusCrossings(data),fixtures=[],x=data.renderRoadCorrections?.mainAvenue?.axisX??data.spawn[0];
 const ends=[...main.points,...(data.roads.find(r=>r.id==='93690444')?.points??[]).filter(p=>p[1]<=82.744)].map(p=>p[1]),minZ=Math.max(data.spawn[1]+26,Math.min(...ends)),maxZ=Math.max(...ends)-8;
 for(let z=minZ;z<maxZ;z+=36)for(const side of [-1,1]){
  const width=roadWidthAt(main,x,z),px=x+side*(width/2+1.25);
  if(inCrossingApproach(x,z,crossings)||!walkable(px,z,data.buildings,.8))continue;
  if(data.roads.some(r=>!['286085067','93690444'].includes(r.id)&&!['path','steps','footway','pedestrian'].includes(r.tags.highway)&&r.points.some((b,i)=>i&&segmentDistance(px,z,r.points[i-1],b)<roadWidthAt(r,px,z)/2+1.5)))continue;
  fixtures.push({x:px,z,side,drainX:x+side*(width/2-.45)});
 }return fixtures;
}

// Break painted lane dividers at each zebra crossing. Other roads/parking
// markings are unaffected. Returns disjoint pieces of the original segment.
export function splitCrossingMarking(a,b,crossings){
 let pieces=[[a,b]];
 for(const c of crossings){
  pieces=pieces.flatMap(([p,q])=>{
   if(Math.max(Math.abs(p[0]-c.x),Math.abs(q[0]-c.x))>c.width/2+.3)return [[p,q]];
   const lo=c.z-c.depth/2-.25,hi=c.z+c.depth/2+.25,dz=q[1]-p[1];
   if(Math.abs(dz)<1e-8)return p[1]>=lo&&p[1]<=hi?[]:[[p,q]];
   const v=[(lo-p[1])/dz,(hi-p[1])/dz].sort((a,b)=>a-b),start=Math.max(0,v[0]),end=Math.min(1,v[1]);
   if(start>=end)return [[p,q]];
   const at=t=>[p[0]+(q[0]-p[0])*t,p[1]+dz*t],out=[];
   if(start>0)out.push([p,at(start)]);if(end<1)out.push([at(end),q]);return out;
  });
 }return pieces;
}

export function addCampusCrossings({data,environment,paint,tactile}){
 const crossings=campusCrossings(data),rect=(x,z,w,d,material,y)=>environment.polygon([[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]],material,y,'road');
 for(const c of crossings){
  const count=Math.floor((c.width-1.2)/1.35),spacing=(c.width-1.2)/count;
  for(let i=0;i<count;i++)rect(c.x-c.width/2+.6+(i+.5)*spacing,c.z,.62,c.depth,paint,.112);
  for(const side of [-1,1]){
   // Stop bars occupy the approaching half, not a bar across both directions.
   rect(c.x+side*c.width/4,c.z-side*(c.depth/2+2),c.width/2-.65,.32,paint,.113);
   rect(c.x+side*(c.width/2+.65),c.z,.6,c.depth,tactile,.155);
   // Small grooves give the warning pad a visible texture without new textures.
   for(let d=-c.depth/2+.18;d<c.depth/2;d+=.25)environment.segment([c.x+side*(c.width/2+.42),c.z+d],[c.x+side*(c.width/2+.88),c.z+d],.025,paint,.16);
  }
 }return crossings;
}
