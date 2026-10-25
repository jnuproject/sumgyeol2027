import * as THREE from './three.module.js';
import {insidePolygon} from './navigation.js';

// Original geometry from public Roadview observations. Dimensions are estimates.
export const FOCUS_BUILDING_PROFILES={
 '471297909':{kind:'economics1',height:12.3,wall:'#d7d8d1',roof:'#9b9e98',floors:3},
 '471297922':{kind:'economics2',height:11.7,wall:'#deded0',roof:'#d0c5a5',floors:3},
 '286237890':{kind:'library',height:14.5,wall:'#b9a47b',roof:'#9d9686',floors:3},
 '471697621':{kind:'student',height:13.8,wall:'#e0e0d4',roof:'#a4a8a0',floors:4}
};
export function createFocusWallMaterials(){
 const result={};
 for(const [id,p] of Object.entries(FOCUS_BUILDING_PROFILES)){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');c.fillStyle=p.wall;c.fillRect(0,0,512,512);
  const tile=p.kind==='student'?32:p.kind==='library'?32:128;
  for(let row=0;row<512/tile;row++)for(let col=-1;col<512/(p.kind==='library'?tile/2:tile);col++){
   const cellWidth=p.kind==='library'?tile/2:tile;const x=col*cellWidth+(p.kind==='library'&&row%2?cellWidth/2:0),y=row*tile;
   c.strokeStyle=p.kind==='library'?'#94896e':p.kind==='student'?'#bfc3b9':'#b3b8b1';c.lineWidth=p.kind==='student'?1:2;c.strokeRect(x,y,p.kind==='library'?tile/2:tile,tile);
   c.fillStyle='rgba(255,255,255,.045)';c.fillRect(x+2,y+2,tile-4,2);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(p.kind==='economics1'?.28:p.kind==='student'?.55:p.kind==='library'?.45:.2,p.kind==='economics1'?.28:p.kind==='student'?.55:p.kind==='library'?.45:.2);map.anisotropy=4;
  result[id]=new THREE.MeshStandardMaterial({map,color:'#ffffff',roughness:.91});
 }
 return result;
}
export function addFocusFacade({scene,b,height,panel,box,base}){
 const profile=FOCUS_BUILDING_PROFILES[b.id];if(!profile)return false;
 const kind=profile.kind,glass='#64817e',frame='#d8ded7',navy='#505e68';
 for(let i=1;i<b.points.length;i++){
  const a=b.points[i-1],e=b.points[i],dx=e[0]-a[0],dz=e[1]-a[1],length=Math.hypot(dx,dz);if(length<2)continue;
  const nx=dz/length,nz=-dx/length,out=insidePolygon((a[0]+e[0])/2+nx*.3,(a[1]+e[1])/2+nz*.3,b.points)?-1:1;
  const p=(t,y,w,h,d,color,offset=.2)=>panel(a,e,t,y,w,h,d,color,offset*out);
  const north=Math.abs(dz)<Math.abs(dx)*.15&&(a[1]+e[1])*.5<Math.min(...b.points.map(p=>p[1]))+2;
  if(kind==='economics1'){
   const count=Math.max(1,Math.floor(length/4.4));
   for(let floor=0;floor<3;floor++)for(let n=0;n<count;n++){
    const t=(n+.5)/count,y=2.0+floor*3.55;
    p(t,y,2.95,1.95,.16,'#424c4a',.13);p(t,y-.04,2.52,1.55,.2,glass,.24);
    p(t,y,.09,1.63,.35,frame,.34);p(t,y-.88,3.06,.13,.5,'#b7bdb7',.38);
    if(floor===2&&n%2===0)p(t+.35/count,8.7,1.0,3.9,.32,'#849397',.4);
   }
   if(length>20){
    p(.5,5.6,length,.45,.4,'#68787c',.3);
    for(let y=5.47;y<5.8;y+=.09)p(.5,y,length,.025,.48,'#b1b9b6',.4);
   }
   if(north&&length>40){
    for(const t of[.045,.955]){
     p(t,7.0,4.8,14.0,.85,'#4d5350',.6);
     for(let y=0;y<14;y+=.33)p(t,y,4.8,.055,.9,'#2e3834',.66);
     for(const y of[3.1,6.6,10.1]){p(t,y,.72,2.0,.95,'#d7d9d0',.7);p(t,y,.45,1.72,1.0,glass,.8);}
    }
   }
   p(.5,height+.12,length+.3,.28,.75,'#afb4ac',.25);
  }else if(kind==='economics2'){
   const count=Math.max(1,Math.floor(length/3.6));
   for(let floor=0;floor<3;floor++){
    const y=1.9+floor*3.3;
    p(.5,y,length-.45,2.05,.18,navy,.19);
    for(let n=0;n<count;n++){
     const t=(n+.5)/count;p(t,y,2.38,1.73,.22,glass,.3);
     p(t,y,.08,1.8,.4,'#c6d0cb',.4);p((n+1)/count,y,1.0,2.1,.5,profile.wall,.4);
     if(floor<2)p(t,y+1.75,.6,.55,.12,'#c2c4b6',.15);
    }
    p(.5,y-1.05,length,.22,.45,navy,.4);
   }
   for(const t of[.035,.965])p(t,height/2,.42,height,.7,'#bdc4bc',.5);
   p(.5,height+.15,length+1.3,.55,1.4,'#d8ccaa',.6);
  }else if(kind==='library'){
   const count=Math.max(1,Math.floor(length/4.4));
   for(const [y,h]of[[1.5,1.7],[6.25,2.0],[10.6,1.85]]){
    p(.5,y,length-.7,h,.22,glass,.2);
    for(let n=0;n<=count;n++)p(n/count,y,.13,h+.12,.4,frame,.34);
    p(.5,y,length-.7,.07,.42,'#9caaa5',.4);
   }
   p(.5,13.15,length,2.65,.55,'#b6a17a',.38);
   for(let y=12.0;y<14.45;y+=.24)p(.5,y,length,.035,.62,'#8e866d',.43);
   if(north&&length>25){
    for(let n=0;n<=count;n++){p(n/count,5.65,.40,9.55,.62,'#e6e5d7',.48);p(n/count,10.35,.72,.32,.95,'#e6e5d7',.54);}
    p(.95,7.7,5.2,15.4,.85,'#4d5350',.6);for(const y of[2.1,6.7,11.3]){p(.95,y,.75,1.85,1.0,'#d5d6c9',.75);p(.95,y,.48,1.6,1.05,glass,.85);}
    p(.5,4.2,11.6,3.35,.65,glass,.6);
    for(const t of[.435,.467,.5,.533,.565])p(t,4.2,.1,3.45,.78,'#d3d8cf',.76);
   }
   p(.5,11.55,length,.22,.8,'#c0b28e',.5);
  }else{
   const low=(a[1]+e[1])*.5<1,faceHeight=low?8.4:height,levels=low?2:4,count=Math.max(1,Math.floor(length/3.1));
   for(let floor=0;floor<levels;floor++){
    const y=1.9+floor*3.15;
    p(.5,y,length-.5,1.9,.17,glass,.2);
    for(let n=0;n<=count;n++)p(n/count,y,.12,1.96,.4,'#d3dcd4',.38);
    p(.5,y-.96,length,.13,.43,'#e9eadd',.36);
    p(.5,y+1.43,length,.14,.45,'#bc684d',.4);
   }
   p(.5,faceHeight+.15,length,.36,.7,'#d9dcd2',.4);
   if(!low&&length>20){
    for(let n=0;n<=count;n+=2)p(n/count,1.8,.45,3.6,.75,'#e4e4d6',.55);
   }
   if(low&&Math.abs((a[0]+e[0])/2+117.4)<2&&length>8){
    p(.5,1.9,5.5,3.3,.45,glass,.5);for(const t of[.27,.5,.73])p(t,1.9,.1,3.4,.65,'#d7ded3',.65);
   }
   // Glazed stair core at the junction of the low and taller eastern wings.
   if(Math.abs(dx)<1&&Math.abs((a[0]+e[0])/2+114)<2){
    p(.5,7.4,Math.min(5.8,length),14.0,.5,glass,.45);
    for(let y=.6;y<14;y+=1.6)p(.5,y,Math.min(5.8,length),.1,.68,'#c8d4ce',.63);
    for(const t of[.12,.5,.88])p(t,7.4,.10,14.0,.72,'#b9c9c4',.66);
   }
  }
 }
 if(kind==='library')box(b.center[0],height+1.35,b.center[1],8,2.6,5.5,'#b9b8aa');
 return true;
}
