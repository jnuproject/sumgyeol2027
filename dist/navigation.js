export function insidePolygon(x,z,points) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i],b=points[j];
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
export function segmentDistance(x,z,a,b) {
  const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
}
export function walkable(x,z,buildings,radius=.65) {
  for(const b of buildings) {
    const points=b.points??b;
    if(insidePolygon(x,z,points))return false;
    for(let i=1;i<points.length;i++)if(segmentDistance(x,z,points[i-1],points[i])<radius)return false;
  }
  return true;
}
export function safePosition(point,buildings) {
  if(walkable(...point,buildings))return point.slice();
  for(let radius=2;radius<=24;radius+=2)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8){
    const p=[point[0]+Math.cos(angle)*radius,point[1]+Math.sin(angle)*radius];
    if(walkable(...p,buildings))return p;
  }
  return null;
}
