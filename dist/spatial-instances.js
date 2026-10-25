import * as THREE from './three.module.js';
// Preserve every instance and its material/colour. Only split the draw bounds
// so the GPU can cull distant woodland instead of drawing the whole campus.
export function spatialInstanceBatches(source,cellSize=88){
 const cells=new Map(),m=new THREE.Matrix4(),c=new THREE.Color();
 for(let i=0;i<source.count;i++){source.getMatrixAt(i,m);const x=m.elements[12],z=m.elements[14],key=Math.floor(x/cellSize)+','+Math.floor(z/cellSize);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);}
 return [...cells].map(([key,indices])=>{const mesh=new THREE.InstancedMesh(source.geometry,source.material,indices.length);indices.forEach((id,i)=>{source.getMatrixAt(id,m);mesh.setMatrixAt(i,m);if(source.instanceColor){source.getColorAt(id,c);mesh.setColorAt(i,c);}});mesh.name=source.name+' / cell '+key;mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.frustumCulled=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();return mesh;});
}
