import {createWindMascotFactory,MASCOT_KINDS} from './wind-mascot.js?v=friends-r53';

// One species registry for the player, policy guides, seated friends and peers.
export function createMascotPopulation(scene,{symbolTexture=null,symbolImage=null,kind='wind',motionPreference=()=>false}={}){
 const factories=new Map();let serial=0;const counts=Object.fromEntries(MASCOT_KINDS.map(s=>[s.id,0]));
 function make(target,{kind:requested,variant,speciesIndex,seated=false}={}){
  const index=Number.isInteger(speciesIndex)&&speciesIndex>=0&&speciesIndex<MASCOT_KINDS.length?speciesIndex:Math.abs(Math.trunc(Number.isFinite(variant)?variant:serial++))%MASCOT_KINDS.length;
  const spec=MASCOT_KINDS.find(s=>s.id===requested)??MASCOT_KINDS[index];
  if(!factories.has(spec.id))factories.set(spec.id,createWindMascotFactory({kind:spec.id,symbolTexture,motionPreference}));
  const a=factories.get(spec.id).create(target,{seated,phase:(counts[spec.id]++*.73)%4.4});a.metadata.speciesIndex=MASCOT_KINDS.indexOf(spec);return a;
 }
 const player=make(scene,{kind:MASCOT_KINDS.some(s=>s.id===kind)?kind:'wind'});
 return {...player,symbolImage,createCompanion:make,populationMetadata:()=>({species:{...counts},humanCharacters:0})};
}
