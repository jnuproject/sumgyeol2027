import {STUDENT_GARDEN_PATHS} from './student-hall-garden.js';
import {segmentDistance,insidePolygon} from './navigation.js';
// Photo-informed pedestrian connections. They retain the established pitch,
// pond and building footprints; path widths and height profiles are estimates.
export const CAMPUS_CONNECTIONS=[
 {id:'student-stadium-bank',width:3.6,points:[[-177,28],[-177,-31],[-177,-81],[-177,-89]]},
 {id:'student-pond-approach',width:2.8,points:[[-113,-33],[-124,-34],[-143,-34.5],[-161,-32],[-177,-31]]},
 {id:'gym-bank-junction',width:3.2,points:[[-177,-81.1],[-167.829,-81.1]]},
 {id:'student-south-approach',width:2.8,points:[[-177,28],[-174,34],[-164,35],[-117,34],[-99,33]]},
 ...STUDENT_GARDEN_PATHS.map((r,i)=>({id:'garden-bank-'+i,width:r.width,points:[[-177,r.points[0][1]],r.points[0]]}))
];
export function nearCampusConnection(x,z,margin=0){return CAMPUS_CONNECTIONS.some(r=>r.points.some((p,i)=>i&&segmentDistance(x,z,r.points[i-1],p)<r.width/2+margin));}

export function gradeCampusConnections(xs,zs,heights,data){
 if(!data.studentHallReference)return {changedSamples:0};
 const before=Float64Array.from(heights),cols=xs.length;
 const index=(axis,v)=>{let lo=0,hi=axis.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(axis[m]>v)hi=m;else lo=m;}return Math.min(axis.length-2,lo);};
 const sample=(x,z)=>{const col=index(xs,x),row=index(zs,z),u=(x-xs[col])/(xs[col+1]-xs[col]),v=(z-zs[row])/(zs[row+1]-zs[row]),i=row*cols+col;return before[i]*(1-u)*(1-v)+before[i+1]*u*(1-v)+before[i+cols]*(1-u)*v+before[i+cols+1]*u*v;};
 const north=sample(-177,-89),south=sample(-177,28),bank=z=>north+(south-north)*(z+89)/117;
 // Short garden joins inherit the already-graded bank, rather than lifting
 // their endpoints back to the obsolete courtyard height.
 const profiles=CAMPUS_CONNECTIONS.filter(r=>!r.id.startsWith('garden-bank-')).map(r=>{
  const lengths=[0];for(let i=1;i<r.points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(r.points[i][0]-r.points[i-1][0],r.points[i][1]-r.points[i-1][1]));
  const start=r.id==='student-pond-approach'?sample(...r.points[0]):bank(r.points[0][1]),end=r.id==='student-pond-approach'||r.id==='student-stadium-bank'?bank(r.points.at(-1)[1]):sample(...r.points.at(-1));
  return {...r,lengths,levels:r.points.map((p,i)=>start+(end-start)*lengths[i]/lengths.at(-1))};
 });
 const pond=data.areas.find(a=>a.id==='969694342'),student=data.buildings.find(b=>b.id==='471697621');let changedSamples=0;
 for(let row=0;row<zs.length;row++)for(let col=0;col<xs.length;col++){
  const x=xs[col],z=zs[row];if(x<-190||x>-105||z<-99||z>44)continue;
  // Preserve the pond's horizontal water datum and the building's level base.
  if(pond&&(insidePolygon(x,z,pond.points)||pond.points.some((p,i)=>i&&segmentDistance(x,z,pond.points[i-1],p)<5.5))||student&&insidePolygon(x,z,student.points))continue;
  let best=0,target=0;
  for(const r of profiles)for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t),u=Math.max(0,Math.min(1,(10-d)/(10-r.width/2-1.8))),blend=u*u*(3-2*u);
   if(blend>best){best=blend;target=r.levels[i-1]+(r.levels[i]-r.levels[i-1])*t;}
  }
  if(best){const i=row*cols+col;heights[i]=before[i]*(1-best)+target*best;changedSamples++;}
 }
 return {feature:'학생회관–연못–운동장 보행 연결',changedSamples,source:'Owner aerial and Roadview references; inferred continuous path grades',operation:'locally blended pedestrian profiles; existing pond and building footprints preserved',dimensionsEstimated:true};
}
