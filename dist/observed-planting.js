import * as THREE from './three.module.js';

// Economics1 north facade, directly observed Kakao Roadview2026-03.
// Bed, ivy and ornamental trees follow the visible spatial order. All offsets
// and plant dimensions are independent estimates, not surveyed positions.
export function addCurrentPlantingBeds({scene,terrain,environment,surfaces,box,obstacles}){
 const clusters=[],wood=[],ground=(x,z)=>terrain.heightAt(x,z),unit=new THREE.Object3D(),color=new THREE.Color();
 const green=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1});
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#959e88';ctx.fillRect(0,0,128,128);
  for(let i=0;i<2400;i++){const x=i*37%128,y=(i*53+Math.floor(i/128)*13)%128;ctx.fillStyle=i%3?'#a4ac98':'#6e7c60';ctx.beginPath();ctx.ellipse(x,y,1.7,1.1,i*.7,0,Math.PI*2);ctx.fill();}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,2);green.map=texture;green.bumpMap=texture;green.bumpScale=.002;
 }
 const cluster=(x,y,z,rx,ry,rz,c)=>clusters.push({x,y,z,rx,ry,rz,c});
 environment.polygon([[-67,89.0],[2,89.0],[2,90.95],[-67,90.95]],new THREE.MeshStandardMaterial({color:'#666b4d',roughness:1}),.075);
 for(let x=-66.6,i=0;x<2;x+=.54,i++){
  const y=ground(x,90.05),v=Math.sin(i*7.31);
  cluster(x,y+.64,90.05,.57,.44+v*.055,.77,'#807c62');
  for(let j=0;j<3;j++)cluster(x+j*.12-.12,ground(x,89.25)+.17+j*.13,89.17,.22,.19,.22,j%2?'#48583e':'#596648');
 }
 // Small ornamental crowns stand behind the hedge without occupying the pavers.
 for(const [i,x]of[-61,-49,-36,-23,-9].entries()){
  const z=90.0,y=ground(x,z),h=3.6+(i%2)*.35;wood.push({x,y:y+h*.30,z,h:h*.60,r:.065});obstacles.push([x,z,.13]);
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5+i*.3;cluster(x+Math.cos(a)*.52,y+h-.42+(k%2)*.2,z+Math.sin(a)*.26,.85,.63,.64,'#40543a');}
 }
 // Ivy and hedge use many small overlapping forms rather than exposed boulder rows.
 const mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),green,clusters.length);
 clusters.forEach((p,i)=>{unit.position.set(p.x,p.y,p.z);unit.scale.set(p.rx*.83,p.ry*.83,p.rz*.83);unit.rotation.set(0,i*.61,0);unit.updateMatrix();mesh.setMatrixAt(i,unit.matrix);mesh.setColorAt(i,color.set(p.c));});mesh.name='Economics observed continuous hedge and ivy';mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 // Independent small leaf sprays break the silhouette; no photographed foliage.
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.strokeStyle='#8d8b70';g.lineWidth=1.3;
  for(let b=0;b<5;b++){const ex=18+b*23,ey=12+(b%2)*13;g.beginPath();g.moveTo(64,123);g.lineTo(ex,ey);g.stroke();
   for(let j=1;j<7;j++){const t=j/7,cx=64+(ex-64)*t,cy=123+(ey-123)*t;for(const side of[-1,1]){g.fillStyle=j%2?'#c8cbbb':'#929e80';g.beginPath();g.ellipse(cx+side*5,cy-3,3.7,7,side*.75,0,Math.PI*2);g.fill();}}
  }
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const leafMaterial=new THREE.MeshStandardMaterial({map:texture,alphaTest:.4,side:THREE.DoubleSide,roughness:1});
  const sprays=clusters.flatMap((p,i)=>Array.from({length:p.rx>.8?70:18},(_,j)=>({p,i,j,count:p.rx>.8?70:18})));
  const foliage=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMaterial,sprays.length);
  sprays.forEach(({p,i,j,count},index)=>{const u=(j+.5)/count,v=j*2.39996+i*.41,sy=1-2*u,rr=Math.sqrt(1-sy*sy),nx=Math.cos(v)*rr,nz=Math.sin(v)*rr;
   unit.position.set(p.x+nx*p.rx,p.y+sy*p.ry,p.z+nz*p.rz);unit.rotation.set(sy*.7,v,j*.61);const size=p.rx>.8?.55:p.rx>.4?.36:.20;unit.scale.set(size,size,1);unit.updateMatrix();foliage.setMatrixAt(index,unit.matrix);foliage.setColorAt(index,color.set(p.c).multiplyScalar(1.12+(j%3)*.04));
  });foliage.name='Economics original leaf and twig sprays';foliage.castShadow=true;foliage.receiveShadow=true;scene.add(foliage);
 }
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.8,1,1,8),new THREE.MeshStandardMaterial({color:'#747467',roughness:1}),wood.length);
 wood.forEach((p,i)=>{unit.position.set(p.x,p.y,p.z);unit.rotation.set(0,0,0);unit.scale.set(p.r,p.h,p.r);unit.updateMatrix();trunks.setMatrixAt(i,unit.matrix);});trunks.name='Economics observed small ornamental trunks';trunks.castShadow=true;scene.add(trunks);
 // A road-facing sign is visible in the2026 reference; its pin is estimated.
 const signX=-51,signZ=89.05,base=ground(signX,signZ);
 box(signX,1.13,signZ,.055,2.26,.055,'#bfc6be');
 const sign=new THREE.Mesh(new THREE.CircleGeometry(.29,32),new THREE.MeshStandardMaterial({color:'#37679d',roughness:.7}));sign.position.set(signX,base+2.12,signZ-.035);sign.rotation.y=Math.PI;scene.add(sign);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.29,.028,6,32),new THREE.MeshStandardMaterial({color:'#b94f49',roughness:.8}));rim.position.copy(sign.position);rim.rotation.y=Math.PI;scene.add(rim);
 const slash=box(signX,2.12,signZ-.055,.49,.045,.025,'#b94f49');slash.rotation.z=-.7;obstacles.push([signX,signZ,.12]);
 return {economicsHedgeClusters:clusters.length,economicsOrnamentalTrees:wood.length};
}
