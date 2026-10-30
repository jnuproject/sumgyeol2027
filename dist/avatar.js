import * as THREE from './three.module.js';
import {createMascotPopulation} from './mascot-population.js?v=npc-r55';

export async function loadSumgyeolAvatar(scene){
 const brandImage=await new THREE.ImageLoader().loadAsync('./assets/sumgyeol_symbol_blue.png');
 const symbolTexture=new THREE.Texture(brandImage);symbolTexture.colorSpace=THREE.SRGBColorSpace;symbolTexture.needsUpdate=true;
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 return createMascotPopulation(scene,{symbolTexture,symbolImage:brandImage,motionPreference:()=>preference.matches});
}
