// Face-to-face framing. The face stays centred horizontally and above the
// dialogue panel; the player's walking yaw, pitch and zoom are never changed.
export function conversationShot(face,player,{aspect=16/9,canStand=()=>true,groundAt=()=>-Infinity}={}){
 let dx=player[0]-face[0],dz=player[2]-face[2],length=Math.hypot(dx,dz);
 if(length<.1){dx=0;dz=1;length=1;}dx/=length;dz/=length;
 const preferred=aspect<.8?1.7:1.5;
 let point;
 for(const distance of [preferred,preferred*.85,1.05]){
  const x=face[0]+dx*distance,z=face[2]+dz*distance;
  if(canStand(x,z)){point=[x,Math.max(face[1]+.025,groundAt(x,z)+1.25),z];break;}
 }
 point??=[face[0]+dx,face[1]+.025,face[2]+dz];
 return {position:point,target:[face[0],face[1]-.12,face[2]],facing:Math.atan2(dx,dz)};
}
