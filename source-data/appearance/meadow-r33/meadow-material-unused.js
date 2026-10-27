import * as THREE from './three.module.js';

// Reference photographs show muted olive/grey turf, dry patches and darker
// tree margins. Reconstruct those at world scale using existing local CC0
// grass textures; the map screenshots are never used as ground textures.
export function createMeadowMaterial(grass,points){
 const repeat=texture=>{if(!texture)return null;const copy=texture.clone();copy.repeat.set(1/2.8,1/2.8);return copy;};
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',map:repeat(grass.map),normalMap:repeat(grass.normalMap),roughnessMap:repeat(grass.roughnessMap),normalScale:new THREE.Vector2(.22,.22),roughness:1});
 const ring=points.slice();if(ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
 const boundary=Array.from({length:20},(_,i)=>new THREE.Vector2(...ring[Math.min(i,ring.length-1)]));
 material.name='Reference meadow: textured grey-olive turf';
 material.userData.appearance='reference-meadow-r33';
 material.onBeforeCompile=shader=>{
  shader.uniforms.meadowBoundary={value:boundary};shader.uniforms.meadowEdgeCount={value:ring.length};
  shader.uniforms.meadowGreen={value:new THREE.Color('#737a62')};
  shader.uniforms.meadowDry={value:new THREE.Color('#8b856d')};
  shader.uniforms.meadowSoil={value:new THREE.Color('#777062')};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vMeadowWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvMeadowWorld=(modelMatrix*vec4(transformed,1.0)).xz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec2 vMeadowWorld;
uniform vec2 meadowBoundary[20];uniform int meadowEdgeCount;
uniform vec3 meadowGreen;uniform vec3 meadowDry;uniform vec3 meadowSoil;
float meadowHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float meadowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(meadowHash(i),meadowHash(i+vec2(1,0)),f.x),mix(meadowHash(i+vec2(0,1)),meadowHash(i+vec2(1,1)),f.x),f.y);}
float meadowEdge(vec2 p){float d=10000.0;for(int i=0;i<20;i++){if(i>=meadowEdgeCount)break;int j=i+1;if(j==meadowEdgeCount)j=0;vec2 a=meadowBoundary[i],v=meadowBoundary[j]-a;float t=clamp(dot(p-a,v)/max(dot(v,v),.0001),0.0,1.0);d=min(d,length(p-a-v*t));}return d;}
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
vec2 lawnP=vMeadowWorld;
float broad=meadowNoise(lawnP*.047+vec2(9.3,21.1));
float lawnPatch=meadowNoise(lawnP*.16+vec2(broad*2.5));
float fine=meadowNoise(lawnP*1.7);
float dry=.50+.50*smoothstep(.22,.77,broad*.65+lawnPatch*.35);
vec3 turf=mix(meadowGreen,meadowDry,dry);
float wear=smoothstep(.65,.86,meadowNoise(lawnP*.31+vec2(32.7,7.4)))*.32;
turf=mix(turf,meadowSoil,wear);
float edge=1.0-smoothstep(1.3,7.5+lawnPatch*4.0,meadowEdge(lawnP));
turf=mix(turf,meadowGreen*.76,edge*(.28+lawnPatch*.32));
#ifdef USE_MAP
float grassDetail=dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722));
turf*=mix(.88,1.06,smoothstep(.025,.32,grassDetail));
#endif
diffuseColor.rgb=turf*(.94+fine*.12);
`);
 };
 // Each field has different boundaries; clones used for scene fading retain
 // the shader and uniforms without sharing a compiled boundary by accident.
 material.customProgramCacheKey=()=>`reference-meadow-r33-${ring.map(p=>p.join(',')).join(';')}`;
 return material;
}
