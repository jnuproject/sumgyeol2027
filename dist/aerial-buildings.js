import {insidePolygon} from './navigation.js';
import {OBSERVED_GROUND_PATCHES} from './spatial-layout.js?v=realism-r51';

// Shapes are independently modelled from the displayed aerial image.
// Heights, exact counts and placements remain estimates. No image is a texture.
export const AERIAL_ROOF_LAYOUTS={
 '286070805':{services:[[-172,-391,4,3,1.8],[-125,-391,4,3,1.8]],solar:[[-149,-379.5,35]]},
 '286070815':{services:[],solar:[[-175,-263,7],[-175,-273,7],[-175,-283,7]]},
 'sat-pharmacy-west':{services:[],solar:[[-219,-277,13]]},
 '953800279':{services:[],solar:[[59,-355.5,33]]},
 '953800624':{services:[],solar:[[63,-299,23]]},
 '953546128':{services:[],solar:[]},
 '471297909':{services:[[-49,104,5,4,2.0]],solar:[[-22,94.5,8],[-18,102,18],[-55,110,4],[-38,110,4],[-10,110,11],[3.5,121,3],[3.5,129,3]]},
 '286237890':{services:[[-111,245.4,7,4.4,1.2],[-101,255.2,7,5,2.1],[-111,272,7.5,5.5,1.3]],solar:[]},
 '471697621':{services:[[-145,13,6,4,1.4],[-127,17,5,4,1.8]],solar:[]}
};
export function addAerialRoofDetails({scene,b,height,base,box}){
 const layout=AERIAL_ROOF_LAYOUTS[b.id];if(!layout)return {services:0,panels:0};
 const valid=(x,z,w,d)=>[[-w/2,-d/2],[-w/2,d/2],[w/2,-d/2],[w/2,d/2]].every(([dx,dz])=>insidePolygon(x+dx,z+dz,b.points));
 let services=0,panels=0;
 for(const [x,z,w,d,h]of layout.services){
  if(!valid(x,z,w,d))continue;
  box(x,height+h/2+.35,z,w,h,d,'#b9c3b6');box(x,height+h+.42,z,w+.12,.14,d+.12,'#4e806b');services++;
 }
 for(const [cx,z,columns]of layout.solar)for(let i=0;i<columns;i++){
  const x=cx+(i-(columns-1)/2)*1.95,w=1.8,d=2.45;if(!valid(x,z,w,d))continue;
  box(x,height+.45,z,w+.10,.14,d+.10,'#8f9c98');
  box(x,height+.54,z,w,.08,d,'#253d45');
  for(const dx of[-.6,0,.6])box(x+dx,height+.586,z,.018,.012,d,'#8b9da0');
  for(const dz of[-.8,0,.8])box(x,height+.586,z+dz,w,.012,.018,'#789398');panels++;
 }
 return {services,panels};
}
export function addAerialGroundDetails({environment,surfaces}){
 for(const patch of OBSERVED_GROUND_PATCHES){
  environment.polygon(patch.points,surfaces.asphalt,.075);
  for(const row of patch.bayRows)for(let x=row.from;x<row.to;x+=2.65){
   // Lower row follows the actual forest edge; all extents are approximate.
   environment.segment([x,row.z-2.25],[x,row.z+2.25],.10,surfaces.aerialParkingPaint,.10);
  }
 }
}
