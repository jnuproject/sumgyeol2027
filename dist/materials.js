import * as THREE from './three.module.js';

// Photo-based CC0 textures, kept local. UVs are measured in world metres,
// including instanced geometry, so a large road never stretches one tiny tile.
export async function loadCampusMaterials({mobile=false}={}){
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
  const [map,normalMap=null,roughnessMap=null]=await Promise.all((mobile?['diff']:['diff','nor_gl','rough']).map(kind=>localTexture(`./assets/materials/${name}_${kind}_1k.jpg`)));
  map.colorSpace=THREE.SRGBColorSpace;
  for(const t of [map,normalMap,roughnessMap].filter(Boolean)){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=mobile?4:8;}
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
  m.onBeforeCompile=shader=>{compile(shader);if(name==='grass_ground')shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat campusLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(campusLuma*.85,campusLuma*1.20,campusLuma*.68),.65);');if(name==='dark_brick_wall')shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),diffuseColor.rgb,.08)*1.35;');};
  m.customProgramCacheKey=()=>`world-metre-${name}-${metres}`;return m;
 }
 // Original interlocking pavers reconstructed from the current roadside views.
 function interlockingPaving(color){
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#5e635d';g.fillRect(0,0,512,512);
  for(let row=-1;row<17;row++)for(let col=-1;col<9;col++){
   const x=col*64+(row%2)*32,y=row*32,n=Math.sin(row*37+col*13)*9,shade=171+n;
   g.fillStyle=`rgb(${shade},${shade+2},${shade-4})`;g.beginPath();g.moveTo(x+2,y+3);g.lineTo(x+23,y+3);g.lineTo(x+27,y+7);g.lineTo(x+39,y+7);g.lineTo(x+43,y+3);g.lineTo(x+62,y+3);g.lineTo(x+62,y+29);g.lineTo(x+43,y+29);g.lineTo(x+39,y+33);g.lineTo(x+27,y+33);g.lineTo(x+23,y+29);g.lineTo(x+2,y+29);g.closePath();g.fill();g.strokeStyle='rgba(235,236,223,.32)';g.lineWidth=1;g.stroke();
  }
  for(let i=0;i<14000;i++){g.fillStyle=i%2?'rgba(25,35,25,.045)':'rgba(235,230,210,.08)';g.fillRect(i*47%512,(i*103+Math.floor(i/512)*29)%512,1,1);}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  const m=surface('concrete_pavement',color,1.6,.25);m.map=map;m.normalMap=null;m.roughnessMap=null;m.bumpMap=mobile?null:map;m.bumpScale=.012;m.customProgramCacheKey=()=>`original-interlocking-pavers-${color}`;return m;
 }
 return {asphalt:surface('clean_asphalt','#e5e7e2',4,.4),grass:surface('grass_ground','#acb18b',3.8,.55),stone:surface('dark_brick_wall','#ffffff',2.1,.65),paving:interlockingPaving('#d3d3ca'),redPaving:interlockingPaving('#ad7c6c'),wall:surface('concrete_pavement','#e9e4d9',5,.12)};
}

export function glassMaterial(){
 // An original neutral sky reflection, used only for material response.
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
 const gradient=g.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#6195bd');gradient.addColorStop(.44,'#d5e5eb');gradient.addColorStop(.54,'#89978d');gradient.addColorStop(1,'#39443c');g.fillStyle=gradient;g.fillRect(0,0,512,256);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;
 const material=new THREE.MeshStandardMaterial({color:'#667879',roughness:.16,metalness:.12,envMap:texture,envMapIntensity:.85});material.userData.campusGlass=true;return material;
}
