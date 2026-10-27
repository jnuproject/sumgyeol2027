import * as THREE from './three.module.js';

// Calibrate from the actual rig, rather than assuming human-sized legs or
// rotating around a guessed local axis. Targets are in world metres.
export function createSeatedPose(root){
 const hip=root.getObjectByName('Hips'),v=()=>new THREE.Vector3(),q=()=>new THREE.Quaternion();
 root.updateWorldMatrix(true,true);const origin=root.getWorldPosition(v()),rootQ=root.getWorldQuaternion(q()),legs=[];
 for(const side of ['Left','Right']){
  const upper=root.getObjectByName(side+'UpLeg'),lower=root.getObjectByName(side+'Leg'),foot=root.getObjectByName(side+'Foot');if(!upper||!lower||!foot)continue;
  const a=upper.getWorldPosition(v()),b=lower.getWorldPosition(v()),c=foot.getWorldPosition(v());
  legs.push({upper,lower,foot,upperRest:upper.quaternion.clone(),lowerRest:lower.quaternion.clone(),footRest:foot.quaternion.clone(),thigh:a.distanceTo(b),shin:b.distanceTo(c),sole:Math.max(.04,Math.min(.14,c.y-origin.y)),flat:rootQ.clone().invert().multiply(foot.getWorldQuaternion(q()))});
 }
 let surface=null,diagnostic=null;
 function worldRotation(bone,worldQ){bone.quaternion.copy(bone.parent.getWorldQuaternion(q()).invert().multiply(worldQ));bone.updateWorldMatrix(false,true);}
 function aim(bone,child,target){const at=bone.getWorldPosition(v()),from=child.getWorldPosition(v()).sub(at).normalize(),to=target.clone().sub(at).normalize();worldRotation(bone,new THREE.Quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(q())));}
 function apply(){
  if(!surface||!hip||legs.length!==2)return;
  for(const l of legs){l.upper.quaternion.copy(l.upperRest);l.lower.quaternion.copy(l.lowerRest);l.foot.quaternion.copy(l.footRest);}
  root.updateWorldMatrix(true,true);const scale=root.parent.getWorldScale(v()).y,hipTarget=surface.seatY+.075*scale;
  root.position.y+=(hipTarget-hip.getWorldPosition(v()).y)/scale;root.updateWorldMatrix(true,true);
  const facing=v().set(0,0,1).applyQuaternion(root.getWorldQuaternion(q()));facing.y=0;facing.normalize();
  for(const l of legs){
   const h=l.upper.getWorldPosition(v()),kneeY=surface.floorY+l.sole+l.shin,dy=Math.max(-l.thigh*.85,Math.min(l.thigh*.85,kneeY-h.y)),forward=Math.sqrt(l.thigh*l.thigh-dy*dy);
   const knee=h.clone().addScaledVector(facing,forward);knee.y=h.y+dy;aim(l.upper,l.lower,knee);
   const ankle=knee.clone();ankle.y-=l.shin;aim(l.lower,l.foot,ankle);worldRotation(l.foot,root.getWorldQuaternion(q()).multiply(l.flat));
  }
  root.updateWorldMatrix(true,true);diagnostic={hipY:hip.getWorldPosition(v()).y,seatY:surface.seatY,floorY:surface.floorY,feet:legs.map(l=>l.foot.getWorldPosition(v()).toArray())};
 }
 return {apply,setSurface:options=>{surface=options;apply();},diagnostics:()=>diagnostic};
}
