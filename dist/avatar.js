import * as THREE from './three.module.js';
import {createMascotPopulation} from './mascot-population.js?v=friends-r53';

export async function loadSumgyeolAvatar(scene,{style='wind'}={}){
 const brandImage=await new THREE.ImageLoader().loadAsync('./assets/sumgyeol_symbol_blue.png');
 const symbolTexture=new THREE.Texture(brandImage);symbolTexture.colorSpace=THREE.SRGBColorSpace;symbolTexture.needsUpdate=true;
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 return createMascotPopulation(scene,{symbolTexture,symbolImage:brandImage,kind:style,motionPreference:()=>preference.matches});
}
