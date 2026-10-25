import {cropSceneGeometry} from './scene-scope.js?v=identity-r24g';
import * as THREE from './three.module.js';
import { insidePolygon, segmentDistance } from './navigation.js';

// OSM centre lines and area outlines are retained. Widths, kerbs and markings
// remain visual estimates; the elevation source is a coarse terrain product.
import {roadWidth,roadWidthAt,roadRenderPoints,isWalkingRoad as isWalking} from './road-profile.js?v=identity-r24g';
export {roadWidth};

function geometryFrom(raw){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(raw.positions,3));
 geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(raw.indices),1));
 if(raw.colors)geometry.setAttribute('color',new THREE.BufferAttribute(raw.colors,4));
 if(raw.normals)geometry.setAttribute('normal',new THREE.Float32BufferAttribute(raw.normals,3));else geometry.computeVertexNormals();
 const uv=new Float32Array(raw.positions.length/3*2);
 for(let i=0;i<raw.positions.length/3;i++){uv[i*2]=raw.positions[i*3];uv[i*2+1]=raw.positions[i*3+2];}
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.computeBoundingSphere();return geometry;
}

export function addCampusEnvironment(scene,data,terrain,surfaces,scope=null){
 const scopedMaterials=new Map();
 function scopedMaterial(material){
  if(!scope)return material;
  if(!scopedMaterials.has(material)){
   const copy=material.clone();
   copy.onBeforeCompile=shader=>{
    material.onBeforeCompile(shader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
#if defined(USE_COLOR_ALPHA) && defined(USE_FOG)
// Blend the diorama edge into the same atmospheric colour as the sky.
gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,pow(1.0-vColor.a,.6));
#endif`);
   };
   copy.customProgramCacheKey=()=>material.customProgramCacheKey()+'-scene-alpha-fog';
   // Keep opaque depth ordering: transparent terrain would cover roads drawn above it.
   copy.vertexColors=true;copy.transparent=false;copy.alphaHash=false;copy.alphaTest=.015;copy.depthWrite=true;
   scopedMaterials.set(material,copy);
  }
  return scopedMaterials.get(material);
 }
 const terrainMesh=new THREE.Mesh(geometryFrom(scope?cropSceneGeometry(terrain.geometry,scope):terrain.geometry),scopedMaterial(surfaces.grass));
 terrainMesh.name='AWS terrain at original campus coordinates';terrainMesh.userData.campusTerrain=true;terrainMesh.receiveShadow=true;scene.add(terrainMesh);
 const chunks=new Map(),walkRegions=[];
 const materialCache=new Map();
 function colored(base,color){const key=base.uuid+color;if(!materialCache.has(key)){const material=base.clone();material.color.set(color);material.onBeforeCompile=base.onBeforeCompile;material.customProgramCacheKey=base.customProgramCacheKey;materialCache.set(key,material);}return materialCache.get(key);}
 const areaMaterials={wood:colored(surfaces.grass,'#6e8d57'),grass:colored(surfaces.grass,'#a8bc80'),park:colored(surfaces.grass,'#8da876'),pitch:colored(surfaces.grass,'#88a171'),tennis:new THREE.MeshStandardMaterial({color:'#5e8590',roughness:1}),parking:colored(surfaces.asphalt,'#c9cdca'),water:new THREE.MeshStandardMaterial({color:'#789fa9',roughness:.35,metalness:.12})};
 for(const material of Object.values(areaMaterials)){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;}
 const paintYellow=new THREE.MeshStandardMaterial({color:'#cfb45d',roughness:.9});
 const paintWhite=new THREE.MeshStandardMaterial({color:'#e4e4d8',roughness:.9});
 const roadShoulder=new THREE.MeshStandardMaterial({color:'#777b74',roughness:1});
 const kerb=new THREE.MeshStandardMaterial({color:'#bcc0b6',roughness:.95});
 const stats={roads:data.roads.length,areas:data.areas.length,roadSegments:0,roadTriangles:0,areaTriangles:0,source:'AWS Terrain Tiles / OSM',widthsAreEstimates:true};
 function append(raw,material,kind){if(scope)raw=cropSceneGeometry(raw,scope);if(!raw.positions.length)return;if(!chunks.has(material))chunks.set(material,[]);chunks.get(material).push(raw);if(kind==='road')stats.roadTriangles+=raw.indices.length/3;else stats.areaTriangles+=raw.indices.length/3;}
 function convex(points,material,offset,kind='road'){append(terrain.drapeConvexPolygon(points,offset),material,kind);}
 function polygon(points,material,offset,kind='area'){
  const ring=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);
  if(ring.length>2&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
  if(ring.length<3)return;
  walkRegions.push({points:ring,offset,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minZ:Math.min(...ring.map(p=>p[1])),maxZ:Math.max(...ring.map(p=>p[1]))});
  const triangles=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]);
  for(const tri of triangles)convex(tri.map(i=>ring[i]),material,offset,kind);
 }
 function segment(a,b,width,material,offset){append(terrain.drapeRoadSegment(a,b,width,offset),material,'road');}
 function circle(p,radius,material,offset){const points=[];for(let i=0;i<16;i++){const angle=i*Math.PI/8;points.push([p[0]+Math.cos(angle)*radius,p[1]+Math.sin(angle)*radius]);}convex(points,material,offset);}
 for(const a of data.areas){const tags=a.tags;const key=tags.amenity==='parking'?'parking':tags.natural==='water'?'water':tags.sport==='tennis'?'tennis':tags.leisure==='pitch'?'pitch':tags.landuse==='forest'||tags.natural==='wood'?'wood':tags.leisure==='park'?'park':'grass';polygon(a.points,areaMaterials[key],.024);}

 // Parking outlines are original OSM. Bay spacing/alignment is a visual reconstruction.
 for(const area of data.areas.filter(a=>a.tags.amenity==='parking')){
  let edge=[area.points[0],area.points[1]],longest=0;
  for(let i=1;i<area.points.length;i++){const a=area.points[i-1],b=area.points[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>longest){longest=l;edge=[a,b];}}
  const [a,b]=edge,ux=(b[0]-a[0])/longest,uz=(b[1]-a[1])/longest,vx=-uz,vz=ux;
  const uv=area.points.map(p=>[(p[0]-a[0])*ux+(p[1]-a[1])*uz,(p[0]-a[0])*vx+(p[1]-a[1])*vz]);
  const minU=Math.min(...uv.map(p=>p[0])),maxU=Math.max(...uv.map(p=>p[0])),minV=Math.min(...uv.map(p=>p[1])),maxV=Math.max(...uv.map(p=>p[1]));
  const world=(u,v)=>[a[0]+ux*u+vx*v,a[1]+uz*u+vz*v];
  for(let v=minV+2;v<maxV-5;v+=16)for(let u=minU+2;u<maxU-2;u+=2.6){
   const p=world(u,v),q=world(u,v+4.8),mid=world(u,v+2.4);
   if([p,q,mid].every(p=>insidePolygon(p[0],p[1],area.points)))segment(p,q,.10,paintWhite,.046);
  }
 }
 const roads=data.roads.map(r=>({...r,points:roadRenderPoints(r),width:roadWidth(r),walking:isWalking(r)}));
 function atJunction(x,z,exclude){return roads.some(r=>r.id!==exclude&&!r.walking&&r.points.some((p,i)=>i&&segmentDistance(x,z,r.points[i-1],p)<r.width*.5+1.2));}
 for(const r of roads){
  const main=r.id==='286085067',pavement=main?4.2:0,material=r.walking?surfaces.paving:surfaces.asphalt,height=r.walking?.09:.08;
  if(pavement)for(const p of r.points)circle(p,roadWidthAt(r,...p)/2+pavement,p[1]<-409?surfaces.redPaving:surfaces.paving,.055);
  for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.01)continue;stats.roadSegments++;
   const nx=dz/len,nz=-dx/len,wa=roadWidthAt(r,...a),wb=roadWidthAt(r,...b),midZ=(a[1]+b[1])/2;
   const parallel=(oa,ob=oa,start=0,end=1)=>[[a[0]+dx*start+nx*(oa+(ob-oa)*start),a[1]+dz*start+nz*(oa+(ob-oa)*start)],[a[0]+dx*end+nx*(oa+(ob-oa)*end),a[1]+dz*end+nz*(oa+(ob-oa)*end)]];
   const band=(offsetA,offsetB,widthA,widthB,mat,lift)=>{const [p,q]=parallel(offsetA-widthA/2,offsetB-widthB/2),[v,u]=parallel(offsetA+widthA/2,offsetB+widthB/2);convex([p,q,u,v],mat,lift);};
   if(!r.walking&&!main)segment(a,b,r.width+.5,roadShoulder,.06);
   if(pavement){
    band(0,0,wa+pavement*2,wb+pavement*2,midZ<-409?surfaces.redPaving:surfaces.paving,.055);
    for(const side of[-1,1])band(side*(wa/2+1.15),side*(wb/2+1.15),1.55,1.55,areaMaterials.wood,.072);
   }
   band(0,0,wa,wb,material,height);
   if(main){
    if(midZ>-230)segment(a,b,.12,paintYellow,.094);
    else if(!(midZ>=data.spawn[1]&&midZ<=data.spawn[1]+69))for(const side of[-1,1])segment(...parallel(side*.17),.12,paintYellow,.094);
    for(const side of[-1,1]){
     band(side*(wa/2-.22),side*(wb/2-.22),.12,.12,paintWhite,.094);
     for(let start=0;start<len;start+=3){const end=Math.min(len,start+3),t=(start+end)/2/len,w=wa+(wb-wa)*t,x=a[0]+dx*t+nx*side*(w/2+.13),z=a[1]+dz*t+nz*side*(w/2+.13);if(!atJunction(x,z,r.id))segment(...parallel(side*(wa/2+.13),side*(wb/2+.13),start/len,end/len),.25,kerb,.13);}
    }
    if((wa+wb)/2>14)for(let d=4;d<len-4;d+=9)for(const side of[-1,1])segment(...parallel(side*4.4,side*4.4,(d-1.5)/len,(d+1.5)/len),.15,paintWhite,.095);
   }
  }
  if(!r.walking&&!main)for(const p of r.points)circle(p,r.width/2+.25,roadShoulder,.06);
  for(const p of r.points)circle(p,roadWidthAt(r,...p)/2,material,height);
 }
 function flush(){for(const [material,list] of chunks){
  const vertexCount=list.reduce((n,c)=>n+c.positions.length/3,0),indexCount=list.reduce((n,c)=>n+c.indices.length,0);
  const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),colors=new Float32Array(vertexCount*4),indices=new Uint32Array(indexCount);let vertex=0,index=0;
  for(const part of list){positions.set(part.positions,vertex*3);if(part.normals)normals.set(part.normals,vertex*3);if(part.colors)colors.set(part.colors,vertex*4);else colors.fill(1,vertex*4,(vertex+part.positions.length/3)*4);for(let i=0;i<part.indices.length;i++)indices[index+i]=part.indices[i]+vertex;vertex+=part.positions.length/3;index+=part.indices.length;}
  const mesh=new THREE.Mesh(geometryFrom({positions,indices,normals,colors:scope?colors:undefined}),scopedMaterial(material));mesh.name='Terrain-draped campus surface';mesh.receiveShadow=true;scene.add(mesh);
 }chunks.clear();}
 flush();
 function surfaceOffset(x,z){
  let offset=0;for(const a of walkRegions)if(x>=a.minX&&x<=a.maxX&&z>=a.minZ&&z<=a.maxZ&&insidePolygon(x,z,a.points))offset=Math.max(offset,a.offset);
  for(const road of roads){
   for(let i=1;i<road.points.length;i++){
    const d=segmentDistance(x,z,road.points[i-1],road.points[i]),width=roadWidthAt(road,x,z);
    if(d<=width*.5)offset=Math.max(offset,road.walking?.09:.08);
    else if(road.id==='286085067'&&d<=width*.5+4.2){offset=Math.max(offset,.055);if(Math.abs(d-(width*.5+.13))<=.125&&!atJunction(x,z,road.id))offset=Math.max(offset,.13);}
   }
  }
  return offset;
 }
 return {terrainMesh,stats,heightAt:(x,z)=>terrain.heightAt(x,z)+surfaceOffset(x,z),groundHeightAt:terrain.heightAt,polygon,segment,flush};
}
