import {createWindMascotFactory,MASCOT_KINDS} from './wind-mascot.js?v=player-r54';

// One species registry for the player, policy guides, seated friends and peers.
export function createMascotPopulation(scene,{symbolTexture=null,symbolImage=null,motionPreference=()=>false}={}){
 const npcKinds=MASCOT_KINDS;
 const factories=new Map();let serial=0;const counts=Object.fromEntries(MASCOT_KINDS.map(s=>[s.id,0]));
 function make(target,{kind:requested,variant,seated=false,remotePlayer=false,player=false}={}){
  const index=Math.abs(Math.trunc(Number.isFinite(variant)?variant:serial++))%npcKinds.length;
  const spec=player||remotePlayer?MASCOT_KINDS[0]:(npcKinds.find(s=>s.id===requested)??npcKinds[index]);
  if(!factories.has(spec.id))factories.set(spec.id,createWindMascotFactory({kind:spec.id,symbolTexture,motionPreference}));
  const a=factories.get(spec.id).create(target,{seated,phase:(counts[spec.id]++*.73)%4.4});a.metadata.speciesIndex=MASCOT_KINDS.indexOf(spec);return a;
 }
 const player=make(scene,{player:true});
 return {...player,symbolImage,createCompanion:make,populationMetadata:()=>({species:{...counts},humanCharacters:0})};
}
