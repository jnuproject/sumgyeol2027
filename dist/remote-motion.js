// Extrapolate a short, bounded distance only between validated moving samples.
export function remoteTarget(p,now,{canStand=()=>true,heightAt=()=>-Infinity}={}){
 const age=Math.max(0,now-p.receivedAt),v=p.velocity;
 let x=p.x,y=p.y,z=p.z;
 if(v&&p.speed>.15){const seconds=Math.min(.22,(age+Math.min(120,p.transitMs??0))/1000),distance=Math.hypot(v.x,v.z)*seconds,factor=distance>3?3/distance:1;
  const nx=x+v.x*seconds*factor,nz=z+v.z*seconds*factor;
  if(canStand(nx,nz)){x=nx;z=nz;y+=Math.max(-10,Math.min(10,v.y))*seconds;}
 }
 y=Math.max(y,heightAt(x,z));return {x,y,z,walking:p.speed>.4&&age<600};
}
