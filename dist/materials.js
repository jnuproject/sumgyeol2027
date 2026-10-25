import * as THREE from './three.module.js';

// Photo-based CC0 textures, kept local. UVs are measured in world metres,
// including instanced geometry, so a large road never stretches one tiny tile.
export async function loadCampusMaterials(){
 const manager=new THREE.LoadingManager();manager.onProgress=(_url,loaded,total)=>{const status=document.getElementById('loadingStatus');if(status)status.textContent=`표면 재질을 불러오고 있어요 · ${loaded} / ${total}`;};
 const loader=new THREE.TextureLoader(manager),sets={};
 async function localTexture(url){
  try{return await loader.loadAsync(url);}
  catch(firstError){
   // Retry a failed cached image once with a fresh request; keep the filename in errors.
   try{return await loader.loadAsync(`${url}?reload=${Date.now()}`);}
   catch{throw new Error(`Campus texture could not be decoded or loaded: ${url}`);}
  }
 }
 await Promise.all(['clean_asphalt','grass_ground','dark_brick_wall','concrete_pavement'].map(async name=>{
  const [map,normalMap,roughnessMap]=await Promise.all(['diff','nor_gl','rough'].map(kind=>localTexture(`./assets/materials/${name}_${kind}_1k.jpg`)));
  map.colorSpace=THREE.SRGBColorSpace;
  for(const t of [map,normalMap,roughnessMap]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}
  sets[name]={map,normalMap,roughnessMap};
 }));
 function surface(name,color,metres=3,normal=.35){
  const m=new THREE.MeshStandardMaterial({...sets[name],color,roughness:1,normalScale:new THREE.Vector2(normal,normal)});
  m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
vec4 worldTexPosition=vec4(position,1.0);vec3 worldTexNormal=normal;
#ifdef USE_INSTANCING
worldTexPosition=instanceMatrix*worldTexPosition;worldTexNormal=mat3(instanceMatrix)*worldTexNormal;
#endif
worldTexPosition=modelMatrix*worldTexPosition;worldTexNormal=normalize(mat3(modelMatrix)*worldTexNormal);
vec3 worldAxes=abs(worldTexNormal);vec2 worldUV=worldAxes.y>max(worldAxes.x,worldAxes.z)?worldTexPosition.xz:(worldAxes.x>worldAxes.z?worldTexPosition.zy:worldTexPosition.xy);
worldUV/=${metres.toFixed(3)};
#ifdef USE_MAP
vMapUv=worldUV;
#endif
#ifdef USE_NORMALMAP
vNormalMapUv=worldUV;
#endif
#ifdef USE_ROUGHNESSMAP
vRoughnessMapUv=worldUV;
#endif`);};
  const compile=m.onBeforeCompile;
  m.onBeforeCompile=shader=>{compile(shader);if(name==='dark_brick_wall')shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),diffuseColor.rgb,.08)*1.35;');};
  m.customProgramCacheKey=()=>`world-metre-${name}-${metres}`;return m;
 }
 return {asphalt:surface('clean_asphalt','#eeeeee',4,.4),grass:surface('grass_ground','#a8c58b',3.8,.55),stone:surface('dark_brick_wall','#ffffff',2.1,.65),paving:surface('concrete_pavement','#dfd8cd',3.5,.4),redPaving:surface('concrete_pavement','#aa8277',3.5,.3),wall:surface('concrete_pavement','#e9e4d9',5,.12)};
}

export function glassMaterial(){
 // An original neutral sky reflection, used only for material response.
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
 const gradient=g.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#6195bd');gradient.addColorStop(.44,'#d5e5eb');gradient.addColorStop(.54,'#89978d');gradient.addColorStop(1,'#39443c');g.fillStyle=gradient;g.fillRect(0,0,512,256);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;
 const material=new THREE.MeshStandardMaterial({color:'#667879',roughness:.16,metalness:.12,envMap:texture,envMapIntensity:.85});material.userData.campusGlass=true;return material;
}
