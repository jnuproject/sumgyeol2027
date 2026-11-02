import * as THREE from './three.module.js';
import {batchStaticMeshes} from './static-mesh-batches.js';
import {festivalLayout} from './festival-layout.js';

// Owner-supplied March 2026 Roadview: sunken track, curved concrete terraces,
// east grassy bank, three flagpoles and floodlight towers. Dimensions and exact
// fixture positions are estimates; the OSM pitch and measured terrain stay put.
export function addStadiumSurroundings({scene,data,terrain,collisionPolygons=[],obstacles=[],cameraCollisionMeshes=[]}){
 const layout=festivalLayout(data);if(!layout)return null;
 const [cx,cz]=layout.center,level=terrain.heightAt(cx,cz),root=new THREE.Group();root.name='Roadview stadium terraces and east bank';scene.add(root);
 const materials=new Map(),unit=new THREE.BoxGeometry(1,1,1),steel=new THREE.CylinderGeometry(1,1,1,8);
 const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.86}));return materials.get(c);};
 function box(x,y,z,w,h,d,c,angle=0){const m=new THREE.Mesh(unit,material(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=angle;m.receiveShadow=true;root.add(m);return m;}
 function rod(a,b,r=.065,c='#aeb8b7'){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),v=bb.clone().sub(aa),m=new THREE.Mesh(steel,material(c));m.position.copy(aa).add(bb).multiplyScalar(.5);m.scale.set(r,v.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());root.add(m);return m;}
 const footprint=(x,z,w,d)=>[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
 const fixtureBases=[];
 function foundation(x,z,w,d,rise=.15){const heights=footprint(x,z,w,d).map(p=>terrain.heightAt(...p)),bottom=Math.min(...heights)-.12,top=Math.max(...heights)+rise;box(x,(top+bottom)/2,z,w,top-bottom,d,'#c9ceca');fixtureBases.push({x,z,bottom,top});return top;}
 // One common horizontal tread level for each continuous bank, including the
 // higher southern terrain. Foundations extend below the terrain at every edge.
 const banks=[];
 for(const side of [-1,1]){
  const sections=[];for(let i=0;i<36;i++){
   const a=i*Math.PI/36,b=(i+1)*Math.PI/36;
   // Clear the gym entrance at the northeast end of the running track.
   if(side===-1&&i<4)continue;
   sections.push({point:(r,t)=>[cx+Math.cos(t)*r,cz+side*(42.2+Math.sin(t)*r)],a,b});
  }banks.push(sections);
 }
 // Leave the west central covered stand / festival main-stage access open.
 for(const sign of[-1,1]){const sections=[];for(let z=20;z<42;z+=2)sections.push({point:(r,t)=>[cx-r,cz+sign*t],a:z,b:z+2});banks.push(sections);}
 let terraces=0,clearance=Infinity;const standFootprints=[];
 for(const sections of banks){
  let base=level+.85;
  for(const s of sections)for(let row=0;row<7;row++)for(const r of[50.6+row*.8,51.4+row*.8])for(const t of[s.a,(s.a+s.b)/2,s.b]){const p=s.point(r,t);base=Math.max(base,terrain.heightAt(...p)+.18-row*.48);}
  for(const s of sections){
   const outside=[s.point(50.6,s.a),s.point(56.2,s.a),s.point(56.2,s.b),s.point(50.6,s.b)];collisionPolygons.push(outside);standFootprints.push(outside);
   for(let row=0;row<7;row++){
    const r0=50.6+row*.8,r1=r0+.8,top=base+row*.48,points=[s.point(r0,s.a),s.point(r1,s.a),s.point(r1,s.b),s.point(r0,s.b)];
    const ground=points.map(p=>terrain.heightAt(...p));clearance=Math.min(clearance,...ground.map(h=>top-h));
    const bottom=Math.min(...ground,level)-.15,shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false});g.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(g,material(row%2?'#b8b9ad':'#c9c9bc'));mesh.position.y=bottom;mesh.receiveShadow=true;root.add(mesh);terraces++;
    const a=points[0],b=points[3],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
    box((a[0]+b[0])/2,top+.018,(a[1]+b[1])/2,len,.045,.10,'#e0e2d9',angle);
    if(row===0){const colors=['#5da3b9','#9fcfc3','#d4bb8d','#c88389','#b9b0ca'];const index=Math.round((s.a+s.b)*11)%colors.length;box((a[0]+b[0])/2,base-.40,(a[1]+b[1])/2,len*.96,.62,.06,colors[index],angle);}
    if(row===6){const a=points[1],b=points[2],len=Math.hypot(b[0]-a[0],b[1]-a[1]);box((a[0]+b[0])/2,top+.35,(a[1]+b[1])/2,len+.03,.7,.22,'#e0e2d9',-Math.atan2(b[1]-a[1],b[0]-a[0]));}
   }
  }
 }
 // Flagpoles sit on the open eastern bank, above the track. Keep the field
 // entrance at z=-44 and the temporary booth fronts clear.
 const fx=cx+54.5,fz=cz+2,fy=foundation(fx,fz,3.2,7.6);
 for(let step=0;step<3;step++)box(fx,fy+.11+step*.22,fz,3.2-step*.55,.22,7.6-step*.55,'#e5e8e1');
 for(const dz of[-2.4,0,2.4]){rod([fx,fy+.66,fz+dz],[fx,fy+12.5,fz+dz],.055);box(fx,fy+.72,fz+dz,.28,.12,.28,'#b6bebc');}
 collisionPolygons.push(footprint(fx,fz,3.4,7.8));
 // Slender laddered floodlights with lamp crowns, not additional realtime lights.
 const towers=[[cx+40,cz-85],[cx+40,cz+85]];
 for(const [x,z]of towers){const y=foundation(x,z,1.6,1.6,.25);rod([x,y,z],[x,y+19,z],.15,'#bcc7c6');obstacles.push([x,z,1.1]);
  for(const dx of[-.23,.23])rod([x+dx,y+.4,z-.26],[x+dx,y+18.6,z-.26],.028);
  for(let h=.6;h<18.8;h+=.45)rod([x-.23,y+h,z-.26],[x+.23,y+h,z-.26],.022);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,px=x+Math.cos(a)*.65,pz=z+Math.sin(a)*.65;rod([x,y+18.3,z],[px,y+19,pz],.05);box(px,y+19.2,pz,.42,.50,.26,'#4e5b5e',-a);box(px+Math.cos(a)*.15,y+19.2,pz+Math.sin(a)*.15,.37,.41,.05,'#eef0de',Math.PI/2-a);}
 }
 // Low clipped hedge on the upper east bank. Break it at the gym approach;
 // the existing green slope and road remain visible between the facilities.
 for(let dz=-31;dz<=33;dz+=2.6){const x=cx+57.8,z=cz+dz,y=terrain.heightAt(x,z);box(x,y+.43,z,1.05,.86,2.35,'#3f6240');}
 for(const dz of[-20,24]){const x=cx+54,z=cz+dz,y=foundation(x,z,1.25,3.4,.10);for(const ox of[-.42,.42])for(const oz of[-1.25,1.25])box(x+ox,y+.22,z+oz,.09,.44,.09,'#4d5f59');for(let j=0;j<4;j++)box(x-.48+j*.3,y+.47,z,.25,.12,3.2,'#958469');collisionPolygons.push(footprint(x,z,1.5,3.6));}
 // Railing follows the existing sloped entrance instead of adding stairs over
 // the roadway. The 4.8 m walking surface remains unobstructed.
 const ra=[cx+61,cz-44.2],rb=[cx+50,cz-44.2];
 for(const side of[-1,1]){const z=ra[1]+side*2.85;for(let x=rb[0];x<ra[0];x+=1.8){const ex=Math.min(x+1.8,ra[0]),ya=terrain.heightAt(x,z),yb=terrain.heightAt(ex,z);rod([x,ya,z],[x,ya+1.0,z],.045);rod([x,ya+1,z],[ex,yb+1,z],.045);rod([x,ya+.5,z],[ex,yb+.5,z],.035);}collisionPolygons.push(footprint((ra[0]+rb[0])/2,z,11,.12));}
 const batching=batchStaticMeshes(root,512);
 root.updateMatrixWorld(true);
 // Raycast merged geometry rather than every terrace lip and ladder rung.
 root.traverse(o=>{if(o.isMesh)cameraCollisionMeshes.push(o);});
 return {source:'Owner photographs IMG_0497–IMG_0501, Kakao Roadview 2026-03',dimensionsEstimated:true,terraceRows:7,terraceSections:terraces/7,flagpoles:3,floodlightTowers:2,liveLights:0,bankBenches:2,eastBank:'existing green sloped terrain with low hedge and open gym approach',minimumTreadClearance:clearance,fixtureBases,standFootprints,batching};
}
