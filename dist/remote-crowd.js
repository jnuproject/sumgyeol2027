import * as THREE from './three.module.js';
// Compact wind silhouettes keep every nearby participant visible in one draw.
export function createRemoteCrowd(scene,capacity=200){
 const parts=[];
 function part(g,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){const geometry=g.index?g.toNonIndexed():g.clone();g.dispose();geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));const c=new THREE.Color(color),colors=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(geometry);}
 const oval=(c,p,s)=>part(new THREE.SphereGeometry(1,8,5),c,p,s);
 part(new THREE.LatheGeometry([[0,.17],[.28,.17],[.46,.35],[.52,.65],[.45,1.1],[.25,1.46],[0,1.58]].map(p=>new THREE.Vector2(...p)),10),'#9bd9ed');
 part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[.02,1.49,0],[-.2,1.7,0],[-.16,1.83,0],[.01,1.8,0],[-.04,1.7,0]].map(p=>new THREE.Vector3(...p))),10,.07,4,false),'#9bd9ed');
 oval('#fff8e9',[0,.53,.42],[.34,.31,.14]);oval('#32afd5',[0,.65,-.5],[.3,.34,.15]);
 part(new THREE.TorusGeometry(.46,.055,4,12),'#32afd5',[0,.84,0],[1,1,1],[Math.PI/2,0,0]);
 for(const side of [-1,1]){oval('#352e36',[side*.15,1.13,.42],[.055,.08,.035]);oval('#9bd9ed',[side*.5,.6,0],[.10,.18,.10]);oval('#32afd5',[side*.2,.145,.09],[.14,.12,.19]);}
 const geometry=new THREE.BufferGeometry();for(const key of ['position','normal','color']){const a=[];for(const g of parts)a.push(...g.attributes[key].array);geometry.setAttribute(key,new THREE.Float32BufferAttribute(a,3));}for(const p of parts)p.dispose();geometry.scale(1.78/1.915,1.78/1.915,1.78/1.915);geometry.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),mesh=new THREE.InstancedMesh(geometry,material,capacity),dummy=new THREE.Object3D();mesh.name='Nearby players, compact wind avatars';mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);let time=0;
 return {update(poses,dt,visible=true){time+=dt;mesh.visible=visible;mesh.count=Math.min(poses.length,capacity);for(let i=0;i<mesh.count;i++){const p=poses[i];dummy.position.set(p.x,p.y+(p.walking?Math.abs(Math.sin(time*8+i))*.025:0),p.z);dummy.rotation.set(0,p.yaw,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;},metadata:()=>({rendered:mesh.visible?mesh.count:0,trianglesPerPlayer:geometry.attributes.position.count/3}),dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
