// OSM road type is preserved. Widths without OSM width tags are visual estimates,
// revised after the user's confirmation that the campus network is mostly roads.
export const isWalkingRoad=road=>['footway','path','steps','pedestrian'].includes(road.tags.highway);
export function roadWidth(road){
 const supplied=parseFloat(road.tags.width);if(supplied>0)return supplied;
 if(road.id==='286085067')return 17.5;
 if(road.tags.service==='parking_aisle')return 4.8;
 return {footway:2.5,path:2,steps:2,pedestrian:5,service:6.5,residential:7,unclassified:7,tertiary:9,secondary:12,primary:14}[road.tags.highway]??6.5;
}

// Ground photos show a wide entrance and a two-lane internal avenue near the student hall.
// Widths and taper endpoints remain visual estimates, not measured lane widths.
export function roadWidthAt(road,x,z){
 if(road.id!=='286085067'||parseFloat(road.tags.width)>0)return roadWidth(road);
 const t=Math.max(0,Math.min(1,(z+390)/160));return 17.5+(7.4-17.5)*t;
}

export function roadRenderPoints(road){
 if(road.id!=='286085067')return road.points;
 const result=[];
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i];if(i===1)result.push(a);
  const splits=[-390,-230].map(z=>({z,t:(z-a[1])/(b[1]-a[1])})).filter(p=>p.t>0&&p.t<1).sort((a,b)=>a.t-b.t);
  for(const p of splits)result.push([a[0]+(b[0]-a[0])*p.t,p.z]);result.push(b);
 }
 return result;
}
