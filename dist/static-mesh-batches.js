import * as THREE from './three.module.js';
// Batch static render meshes by material and nearby cells. Collision meshes keep
// their original, already-computed world matrices for the existing raycasters.
export function batchStaticMeshes(scene,cellSize=96){
 scene.updateMatrixWorld(true);const groups=new Map();let originals=0,batches=0;
 scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||Array.isArray(o.material)||o.userData.campusTerrain||!o.visible||!o.geometry?.attributes.position)return;const box=new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(o.matrixWorld),size=box.getSize(new THREE.Vector3());if(Math.max(size.x,size.z)>180)return;const p=box.getCenter(new THREE.Vector3()),layout=Object.entries(o.geometry.attributes).map(([n,a])=>n+':'+a.itemSize+':'+a.normalized+':'+a.array.constructor.name).sort().join('/'),key=[o.material.uuid,o.castShadow,o.receiveShadow,Math.floor(p.x/cellSize),Math.floor(p.z/cellSize),layout].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
 for(const list of groups.values()){
  if(list.length<2)continue;const geometries=list.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrixWorld);}),merged=new THREE.BufferGeometry();
  for(const [name,first] of Object.entries(geometries[0].attributes)){const array=new first.array.constructor(geometries.reduce((n,g)=>n+g.attributes[name].array.length,0));let at=0;for(const g of geometries){array.set(g.attributes[name].array,at);at+=g.attributes[name].array.length;}merged.setAttribute(name,new THREE.BufferAttribute(array,first.itemSize,first.normalized));}
  merged.computeBoundingBox();merged.computeBoundingSphere();const mesh=new THREE.Mesh(merged,list[0].material);mesh.castShadow=list[0].castShadow;mesh.receiveShadow=list[0].receiveShadow;mesh.name='Mobile static geometry batch';scene.add(mesh);for(const o of list)o.removeFromParent();for(const g of geometries)g.dispose();originals+=list.length;batches++;
 }
 return {originalMeshes:originals,renderBatches:batches,drawCallsSaved:originals-batches,geometryRemoved:false};
}
