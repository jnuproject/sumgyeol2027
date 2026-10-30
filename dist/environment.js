import {AERIAL_MEADOW_AREA_IDS} from './aerial-landscape.js?v=realism-r51';
import {campusCrossings,inCrossingApproach,splitCrossingMarking} from './campus-streets.js?v=realism-r51';
import {createRoadClearance} from './road-clearance.js?v=realism-r51';
import {cropSceneGeometry} from './scene-scope.js?v=realism-r51';
import * as THREE from './three.module.js';
import { insidePolygon, segmentDistance } from './navigation.js';

// OSM centre lines and area outlines are retained. Widths, kerbs and markings
// remain visual estimates; the elevation source is a coarse terrain product.
import {roadWidth,roadWidthAt,roadRenderPoints,roadSidewalkWidthAt,isMainAvenueRoad,isWalkingRoad as isWalking} from './road-profile.js?v=realism-r51';
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
 for(const [name,material] of Object.entries(surfaces))if(material?.isMaterial)material.name='surface-'+name;
 const terrainMesh=new THREE.Mesh(geometryFrom(scope?cropSceneGeometry(terrain.geometry,scope):terrain.geometry),scopedMaterial(surfaces.grass));
 terrainMesh.name='AWS terrain at original campus coordinates';terrainMesh.userData.campusTerrain=true;terrainMesh.receiveShadow=true;scene.add(terrainMesh);
 const chunks=new Map(),walkRegions=[],kerbBlocks=[],roadClearance=createRoadClearance(data.buildings??[]);
 const materialCache=new Map();
 function colored(base,color){const key=base.uuid+color;if(!materialCache.has(key)){const material=base.clone();material.color.set(color);material.onBeforeCompile=base.onBeforeCompile;material.customProgramCacheKey=base.customProgramCacheKey;materialCache.set(key,material);}return materialCache.get(key);}
 const areaMaterials={reedWater:new THREE.MeshStandardMaterial({color:'#435b50',roughness:.78}),wood:colored(surfaces.grass,'#6e8d57'),grass:colored(surfaces.grass,'#a8bc80'),park:colored(surfaces.grass,'#8da876'),pitch:colored(surfaces.grass,'#88a171'),tennis:new THREE.MeshStandardMaterial({color:'#5e8590',roughness:1}),parking:colored(surfaces.asphalt,'#c9cdca'),water:new THREE.MeshStandardMaterial({color:'#789fa9',roughness:.35,metalness:.12})};
 for(const [name,material] of Object.entries(areaMaterials)){material.name="area-"+name;material.polygonOffset=false;}
 const crossings=campusCrossings(data);
 const paintYellow=new THREE.MeshStandardMaterial({color:'#cfb45d',roughness:.9});
 const paintWhite=new THREE.MeshStandardMaterial({color:'#e4e4d8',roughness:.9});
 const roadShoulder=new THREE.MeshStandardMaterial({color:'#777b74',roughness:1});
 const kerb=new THREE.MeshStandardMaterial({color:'#bcc0b6',roughness:.95});
 const stats={roads:data.roads.length,areas:data.areas.length,roadSegments:0,roadTriangles:0,areaTriangles:0,source:'AWS Terrain Tiles / OSM',widthsAreEstimates:true,roadClearance:roadClearance.stats};
 function append(raw,material,kind){if(kind==='road')raw=roadClearance.trim(raw);if(scope)raw=cropSceneGeometry(raw,scope);if(!raw.positions.length)return;if(!chunks.has(material))chunks.set(material,[]);chunks.get(material).push(raw);if(kind==='road')stats.roadTriangles+=raw.indices.length/3;else stats.areaTriangles+=raw.indices.length/3;}
 function convex(points,material,offset,kind='road'){append(terrain.drapeConvexPolygon(points,offset),material,kind);}
 function polygon(points,material,offset,kind='area'){
  const ring=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);
  if(ring.length>2&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
  if(ring.length<3)return;
  walkRegions.push({points:ring,offset,kind,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minZ:Math.min(...ring.map(p=>p[1])),maxZ:Math.max(...ring.map(p=>p[1]))});
  const triangles=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]);
  for(const tri of triangles)convex(tri.map(i=>ring[i]),material,offset,kind);
 }
 function segment(a,b,width,material,offset){
  const pieces=material===paintWhite||material===paintYellow?splitCrossingMarking(a,b,crossings):[[a,b]];
  for(const [p,q] of pieces)append(terrain.drapeRoadSegment(p,q,width,offset),material,'road');
 }
 function circle(p,radius,material,offset){const points=[];for(let i=0;i<16;i++){const angle=i*Math.PI/8;points.push([p[0]+Math.cos(angle)*radius,p[1]+Math.sin(angle)*radius]);}convex(points,material,offset);}
 for(const a of data.areas){
  const tags=a.tags;
  // Keep lawn outlines for tree placement only. The existing terrain grass
  // remains exposed, with no separate colour, texture or coplanar lawn layer.
  if(tags['surface:appearance']==='existing_grass'||tags['surface:appearance']==='dry_meadow'||AERIAL_MEADOW_AREA_IDS.has(a.id))continue;
  const key=tags['surface:appearance']==='reed_pond'?'reedWater':tags.amenity==='parking'?'parking':tags.natural==='water'?'water':tags.sport==='tennis'?'tennis':tags.leisure==='pitch'?'pitch':tags.landuse==='forest'||tags.natural==='wood'?'wood':tags.leisure==='park'?'park':'grass';
  polygon(a.points,areaMaterials[key],.024);
 }

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
 const onVehicleRoad=(x,z,margin=.025)=>roads.some(r=>!r.walking&&r.points.some((p,i)=>i&&segmentDistance(x,z,r.points[i-1],p)<=roadWidthAt(r,x,z)*.5+margin));
 function raisedPavement(points,material,offset){
  // Small cells are conservatively omitted at intersecting vehicle roads.
  // The low underlay remains below asphalt; it cannot cover a junction.
  const samples=[...points,points.reduce((p,q)=>[p[0]+q[0]/points.length,p[1]+q[1]/points.length],[0,0])];
  for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];samples.push([(p[0]+q[0])/2,(p[1]+q[1])/2]);}
  if(samples.some(p=>onVehicleRoad(...p)))return;
  polygon(points,material,offset,'road');
 }
 for(const r of roads){
  const main=isMainAvenueRoad(r),pavement=roadSidewalkWidthAt(r,0,-999),material=r.walking?surfaces.paving:surfaces.asphalt,height=r.walking?.09:.08;
  if(pavement)for(const p of r.points){
   const pavement=roadSidewalkWidthAt(r,...p);if(!pavement)continue;
   const inner=roadWidthAt(r,...p)/2,outer=inner+pavement,mat=p[1]<-409?surfaces.redPaving:surfaces.paving;
   circle(p,outer,mat,.055);
   // entrance-observed extends the final OSM point into the approach road.
   // Its side quads supply the raised pavement; a radial cap would cross that
   // extension because it is not part of this module's OSM vehicle footprint.
   if(p===r.points.at(-1))continue;
   // Annular caps, never raised disks across the road centre. Slightly expand
   // the inner radius so each chord also stays outside the asphalt radius.
   const radius=(inner+.035)/Math.cos(Math.PI/32);
   for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16,at=(angle,d)=>[p[0]+Math.cos(angle)*d,p[1]+Math.sin(angle)*d];raisedPavement([at(a,radius),at(b,radius),at(b,outer),at(a,outer)],mat,.14);}
  }
  const normalAtNode=index=>{const p=r.points[index],before=r.points[Math.max(0,index-1)],after=r.points[Math.min(r.points.length-1,index+1)],normal=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;return[dz/l,-dx/l];};if(index===0)return normal(p,after);if(index===r.points.length-1)return normal(before,p);const a=normal(before,p),b=normal(p,after),x=a[0]+b[0],z=a[1]+b[1],l=Math.hypot(x,z)||1,n=[x/l,z/l],m=Math.min(1.8,1/Math.max(.1,n[0]*b[0]+n[1]*b[1]));return[n[0]*m,n[1]*m];};
  let arc=0;
  for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],pavement=roadSidewalkWidthAt(r,(a[0]+b[0])/2,(a[1]+b[1])/2),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.01)continue;stats.roadSegments++;
   const nx=dz/len,nz=-dx/len,wa=roadWidthAt(r,...a),wb=roadWidthAt(r,...b),midZ=(a[1]+b[1])/2;
   const na=normalAtNode(i-1),nb=normalAtNode(i);
   const parallel=(oa,ob=oa,start=0,end=1)=>{const p=[a[0]+na[0]*oa,a[1]+na[1]*oa],q=[b[0]+nb[0]*ob,b[1]+nb[1]*ob];return[[p[0]+(q[0]-p[0])*start,p[1]+(q[1]-p[1])*start],[p[0]+(q[0]-p[0])*end,p[1]+(q[1]-p[1])*end]];};
   const band=(offsetA,offsetB,widthA,widthB,mat,lift)=>{const [p,q]=parallel(offsetA-widthA/2,offsetB-widthB/2),[v,u]=parallel(offsetA+widthA/2,offsetB+widthB/2);convex([p,q,u,v],mat,lift);};
   if(!r.walking&&!main)segment(a,b,r.width+.5,roadShoulder,.06);
   if(pavement){
    const pavingMaterial=midZ<-409?surfaces.redPaving:surfaces.paving;
    band(0,0,wa+pavement*2,wb+pavement*2,pavingMaterial,.055);
    for(const side of[-1,1])for(let d=0;d<len;d+=1.5){
     const start=d/len,end=Math.min(len,d+1.5)/len;
     const cell=(near,far)=>{const [p,q]=parallel(side*(wa/2+near),side*(wb/2+near),start,end),[v,u]=parallel(side*(wa/2+far),side*(wb/2+far),start,end);return[p,q,u,v];};
     raisedPavement(cell(.035,pavement),pavingMaterial,.14);
     // Ordinary sidewalks remain paving. Student-hall timber geometry is
     // already supplied by focus-details; areaMaterials.wood means woodland,
     // not a timber material, so do not paint a green band over the deck.
    }
   }
   band(0,0,wa,wb,material,height);
   if(main){
    const cuts=[0,1];for(const z of[data.spawn[1],data.spawn[1]+69]){const t=(z-a[1])/dz;if(t>0&&t<1)cuts.push(t);}cuts.sort((a,b)=>a-b);for(let j=1;j<cuts.length;j++){const lo=cuts[j-1],hi=cuts[j],zz=a[1]+dz*(lo+hi)/2;if(zz>=data.spawn[1]&&zz<=data.spawn[1]+69)continue;if(zz>-230)segment(...parallel(0,0,lo,hi),.12,paintYellow,.094);else for(const side of[-1,1])segment(...parallel(side*.17,side*.17,lo,hi),.12,paintYellow,.094);}
    for(const side of[-1,1]){
     band(side*(wa/2-.22),side*(wb/2-.22),.12,.12,paintWhite,.094);
     for(let start=0;start<len;start+=1.5){const end=Math.min(len,start+1.5),t=(start+end)/2/len,w=wa+(wb-wa)*t,x=a[0]+dx*t+nx*side*(w/2+.16),z=a[1]+dz*t+nz*side*(w/2+.16);if(!atJunction(x,z,r.id)&&!inCrossingApproach(x,z,crossings)){const [p,q]=parallel(side*(wa/2+.16),side*(wb/2+.16),start/len,end/len),l=Math.hypot(q[0]-p[0],q[1]-p[1]),ox=(q[1]-p[1])/l*.125,oz=-(q[0]-p[0])/l*.125,ring=[[p[0]-ox,p[1]-oz],[q[0]-ox,q[1]-oz],[q[0]+ox,q[1]+oz],[p[0]+ox,p[1]+oz]];if(ring.some(p=>onVehicleRoad(...p)))continue;polygon(ring,kerb,.18,'road');kerbBlocks.push([p,q]);}}
    }
    // One dashed divider per direction: two uphill + two downhill lanes.
    if(r.id==='286085067'||Math.min(wa,wb)>=14)for(let d=Math.floor((arc-5.5)/9)*9+4;d<arc+len+1.5;d+=9){const start=Math.max(0,(d-1.5-arc)/len),end=Math.min(1,(d+1.5-arc)/len);if(end<=start)continue;for(const side of[-1,1])segment(...parallel(side*wa/4,side*wb/4,start,end),.15,paintWhite,.095);}
   }
   arc+=len;
  }
  if(!r.walking&&!main)for(const p of r.points)circle(p,r.width/2+.25,roadShoulder,.06);
  for(const p of r.points)circle(p,roadWidthAt(r,...p)/2,material,height);
 }
 // Solid kerb faces give the observed road/sidewalk edge a visible step.
 const visibleKerbs=kerbBlocks.filter(([a,b])=>!scope||scope.alphaAt((a[0]+b[0])/2,(a[1]+b[1])/2)>.95);
 if(visibleKerbs.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.25,.18,1),kerb,visibleKerbs.length),o=new THREE.Object3D(),axis=new THREE.Vector3(0,0,1);
  visibleKerbs.forEach(([a,b],i)=>{const va=new THREE.Vector3(a[0],terrain.heightAt(...a)+.09,a[1]),vb=new THREE.Vector3(b[0],terrain.heightAt(...b)+.09,b[1]),delta=vb.clone().sub(va);o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(axis,delta.clone().normalize());o.scale.set(1,1,Math.max(.01,delta.length()-.025));o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.name='Observed solid roadside kerbs';mesh.receiveShadow=true;mesh.castShadow=true;scene.add(mesh);stats.kerbBlocks=visibleKerbs.length;
 }
 function flush(){for(const [material,list] of chunks){
  const vertexCount=list.reduce((n,c)=>n+c.positions.length/3,0),indexCount=list.reduce((n,c)=>n+c.indices.length,0);
  const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),colors=new Float32Array(vertexCount*4),indices=new Uint32Array(indexCount);let vertex=0,index=0;
  for(const part of list){positions.set(part.positions,vertex*3);if(part.normals)normals.set(part.normals,vertex*3);if(part.colors)colors.set(part.colors,vertex*4);else colors.fill(1,vertex*4,(vertex+part.positions.length/3)*4);for(let i=0;i<part.indices.length;i++)indices[index+i]=part.indices[i]+vertex;vertex+=part.positions.length/3;index+=part.indices.length;}
  const mesh=new THREE.Mesh(geometryFrom({positions,indices,normals,colors:scope?colors:undefined}),scopedMaterial(material));mesh.name='Terrain-draped campus surface';mesh.receiveShadow=true;scene.add(mesh);
 }chunks.clear();}
 flush();
 function surfaceOffset(x,z){
  let offset=0;const clipped=roadClearance.contains(x,z);for(const a of walkRegions)if((!clipped||a.kind!=='road')&&x>=a.minX&&x<=a.maxX&&z>=a.minZ&&z<=a.maxZ&&insidePolygon(x,z,a.points))offset=Math.max(offset,a.offset);
  for(const road of roads){
   if(clipped)continue;
   for(let i=1;i<road.points.length;i++){
    const d=segmentDistance(x,z,road.points[i-1],road.points[i]),width=roadWidthAt(road,x,z);
    if(d<=width*.5)offset=Math.max(offset,road.walking?.09:.08);
    else if(roadSidewalkWidthAt(road,x,z)>0&&d<=width*.5+roadSidewalkWidthAt(road,x,z))offset=Math.max(offset,.055);
   }
  }
  return offset;
 }
 return {terrainMesh,stats,heightAt:(x,z)=>terrain.heightAt(x,z)+surfaceOffset(x,z),groundHeightAt:terrain.heightAt,polygon,segment,flush};
}
