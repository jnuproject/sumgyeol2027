// The track is a capsule, not the entire unlocked rectangular walking area.
// Separate enter/exit thresholds prevent flicker when standing at the gate.
export function createFestivalAtmosphere(layout){
 let active=false,mix=0,nightMix=0,entries=0;
 const sample=()=>({active,mix,nightMix,entries});
 return {sample,update(dt,{position,walking=true,manualNight=false,reducedMotion=false}={}){
  const valid=layout&&walking&&Number.isFinite(position?.x)&&Number.isFinite(position?.z);
  const radius=valid?Math.hypot(position.x-layout.center[0],Math.max(0,Math.abs(position.z-layout.center[1])-42.2)):Infinity;
  const next=valid&&radius<(active?58:52);
  if(next&&!active)entries++;active=!!next;
  const step=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.25)),blend=1-Math.exp(-step/(reducedMotion?.28:1.15));
  mix+=((active?1:0)-mix)*blend;nightMix+=((manualNight||active?1:0)-nightMix)*blend;
  if(Math.abs(mix-(active?1:0))<.001)mix=active?1:0;
  if(Math.abs(nightMix-(manualNight||active?1:0))<.001)nightMix=manualNight||active?1:0;
  return sample();
 }};
}
