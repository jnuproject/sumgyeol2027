import {MUSEUM_WALKS,MUSEUM_TREES} from './museum-forecourt.js?v=ground-r44';
import {STUDENT_GARDEN_PATHS,STUDENT_GARDEN_TREES} from './student-hall-garden.js?v=ground-r44';
import {SATELLITE_LAWNS} from './satellite-layout.js?v=ground-r44';
// Independent reconstruction after viewing Kakao Skyview's selected latest
// mosaic on 2026-10-26 KST. Displayed image date is not certified per pixel.
// Boundaries/crowns are visual estimates tied to existing OSM landmarks.
import * as THREE from './three.module.js';
import {insidePolygon} from './navigation.js';
export const AERIAL_MEADOW_AREA_IDS=new Set(['471490294','471697071','471697103']);
export const AERIAL_OPEN_LAWNS=[
 {id:'administration-central-lawn',points:[[-61,-66],[25,-66],[25,-19],[-61,-19]]},
 {id:'north-rectangular-meadow',points:[[-59,-254],[22,-254],[22,-157],[-59,-157]]},
 {id:'outdoor-stage-open-field',points:[[48,-244],[99,-244],[99,-159],[48,-159]]}
];
export const AERIAL_GROVES=[
 {id:'library-east-woodland',points:[[-63,226],[16,226],[25,251],[13,279],[-61,279]],spacing:7.4,height:[9,14]},
 {id:'economics-south-wooded-bank',points:[[-56,147],[103,147],[120,175],[93,194],[-42,193],[-64,175]],spacing:8.5,height:[8,13]},
 {id:'student-pond-west-cluster',points:[[-173,-72],[-160,-75],[-159,-40],[-171,-33]],spacing:8.5,height:[7,10]}
];
export const MANAGED_AREA_IDS=new Set(['471490294','471697071','471697103','471697043','471697061','471697097','969694343']);
// Approximate specimen positions, not individual surveyed trees. Formal lawns
// retain empty centres; irregular northern lawns have separated crown groups.
const rows=(a,b,n,h,type='park')=>Array.from({length:n},(_,i)=>({x:a[0]+(b[0]-a[0])*i/(n-1),z:a[1]+(b[1]-a[1])*i/(n-1),h,type,areaId:'aerial-observed'}));
// Uneven crown spacing around, rather than across, the two photographed lawns.
// Small deterministic offsets avoid an ornamental hedge-like regular row.
const edgeRow=(a,b,n)=>Array.from({length:n},(_,i)=>({x:a[0]+(b[0]-a[0])*i/(n-1)+Math.sin(i*2.37)*1.1,z:a[1]+(b[1]-a[1])*i/(n-1)+Math.sin(i*1.81)*1.2,h:8.4+(i%4)*.85,type:'park',areaId:'lawn-edge-observed'}));
export const AERIAL_LAWN_EDGE_TREES=[
 ...edgeRow([-61,-247],[-61,-161],12),...edgeRow([23,-248],[23,-160],11),
 ...edgeRow([-52,-258],[16,-258],9),...edgeRow([-53,-151],[16,-151],9),
 ...edgeRow([-62,-65],[-62,-22],6),...edgeRow([26,-65],[26,-23],6),
 ...edgeRow([-53,-69],[18,-69],9)
];
export const AERIAL_SPECIMEN_TREES=[
 ...MUSEUM_TREES,
 ...STUDENT_GARDEN_TREES,
 ...rows([-67,-66],[-67,-20],5,9),...rows([31,-66],[31,-18],5,9.5),...rows([-61,-12],[24,-12],10,8.5),
 ...rows([-58,-141],[20,-141],9,10),...rows([-68,-250],[-68,-161],8,9.5),...rows([29,-251],[29,-156],9,9),
 ...rows([-50,-270],[18,-270],8,9),...rows([107,-242],[107,-159],8,8),
 ...[[ -55,-394],[-35,-388],[-16,-377],[4,-361],[15,-341],[-39,-352],[-61,-347],[-65,-316],[-7,-307],[-51,-293],
 [-181,-284],[-162,-277],[-140,-291],[-118,-274],[-161,-250],[-134,-238],[-109,-222],[-177,-218],
 [-147,-196],[-124,-185],[-104,-171],[-163,-165],[-108,-345],[-122,-367],[-146,-375],[-188,-366],
 [-160,-58],[-121,-70],[-103,-50],[-158,-39],[-110,-35],[-149,-76],[-135,-76],
 [-130,219],[-117,222],[-89,221],[-61,296],[-45,291]]
 .map(([x,z],i)=>({x,z,h:7.5+(i%4)*.8,type:'park',areaId:'aerial-observed'}))
];
export const AERIAL_PATHS=[
 ...MUSEUM_WALKS,
 ...STUDENT_GARDEN_PATHS,
 {id:'library-east-garden-edge',width:2.1,points:[[-64,237],[-62,252],[-62,269],[-58,283],[-34,286]]}
];
export function insideAerialOpenLawn(x,z){return [...SATELLITE_LAWNS.slice(0,3),...AERIAL_OPEN_LAWNS].some(a=>insidePolygon(x,z,a.points));}
export function addAerialLandscape({scene,environment,surfaces}){
 // Tint the existing OSM meadow surface in environment.js; do not stack a
 // near-coplanar second lawn sheet (it flickers at overview distances).
 const path=surfaces.paving.clone();path.color.set('#c4c9b9');path.onBeforeCompile=surfaces.paving.onBeforeCompile;path.customProgramCacheKey=surfaces.paving.customProgramCacheKey;path.name='Aerial-observed independent garden paths';
 // Each short quad follows the same terrain sampler as roads and walking.
 for(const p of AERIAL_PATHS)for(let i=1;i<p.points.length;i++){const a=p.points[i-1],b=p.points[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=dz/l*p.width/2,nz=-dx/l*p.width/2;environment.polygon([[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz],[a[0]+nx,a[1]+nz]],p.surface==='red'?surfaces.redPaving:path,.065,'area');}
 return {openLawns:AERIAL_OPEN_LAWNS.length,groves:AERIAL_GROVES.length,observedTreeCandidates:AERIAL_SPECIMEN_TREES.length,gardenPaths:AERIAL_PATHS.length,positionsAreSurveyed:false,source:'Kakao Skyview selected latest mosaic, visually observed2026-10-26 KST; independent geometry, no imagery texture reuse'};
}
