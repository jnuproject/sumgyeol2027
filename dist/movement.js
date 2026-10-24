// World-space vertical motion: terrain following and airborne velocity are separate.
export function advanceVertical(state, floor, dt, gravity=20) {
  if (![state.y,state.velocity,floor,dt].every(Number.isFinite) || dt<0) throw new Error('Invalid vertical state');
  if (state.grounded) return {y:floor,velocity:0,grounded:true};
  const y=state.y+state.velocity*dt-.5*gravity*dt*dt;
  const velocity=state.velocity-gravity*dt;
  return y<=floor+1e-7 ? {y:floor,velocity:0,grounded:true} : {y,velocity,grounded:false};
}

// Sample the same terrain surface along the short chase-camera segment.
// 0.5m steps are finer than the ~4m delivered raster grid; bisection locates contact.
export function terrainCameraDistance(origin,direction,maxDistance,heightAt,clearance=.4){
  const above=t=>origin.y+direction.y*t-heightAt(origin.x+direction.x*t,origin.z+direction.z*t)-clearance;
  let last=0;
  for(let t=Math.min(.5,maxDistance);t<=maxDistance;){
    if(above(t)<=0){let lo=last,hi=t;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(above(mid)>0)lo=mid;else hi=mid;}return Math.max(.6,hi-.12);}
    if(t===maxDistance)break;
    last=t;t=Math.min(maxDistance,t+.5);
  }
  return maxDistance;
}
