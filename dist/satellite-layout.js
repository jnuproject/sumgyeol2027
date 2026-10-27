// Independent tracing of the three user-supplied aerial screenshots.
// Metres are calibrated to existing campus junctions; heights are NOT recovered
// from overhead imagery. Source OSM and the elevation raster remain immutable.
const frames={
 north:{pixel:[670,493],world:[-78.034,-409.990],metresPerPixel:.249},
 centre:{pixel:[744,526],world:[-76.446,-135.877],metresPerPixel:.249},
 south:{pixel:[821,425],world:[-80.914,82.744],metresPerPixel:.249}
};
export function satellitePoint(frame,[x,y]){const f=frames[frame];return [f.world[0]+(x-f.pixel[0])*f.metresPerPixel,f.world[1]+(y-f.pixel[1])*f.metresPerPixel];}
const ring=(frame,p)=>{const points=p.map(v=>satellitePoint(frame,v));return [...points,[...points[0]]];};
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const traces=[
 {id:'sat-pharmacy-west',name:'약학대학 2호관',frame:'north',pixels:[[25,1020],[154,1020],[154,1039],[221,1039],[221,1109],[25,1109]],height:12,roof:'#619c85'},
 {id:'sat-post-office',name:'제주대학교 우편취급국',frame:'centre',pixels:rect(140,200,45,101),height:4,roof:'#bfc9bf'},
 {id:'sat-museum-annex',name:'박물관 북쪽 부속동',frame:'north',pixels:[[762,251],[813,248],[819,327],[761,327]],height:4,roof:'#dedbc5'},
 {id:'sat-agriculture-annex',name:'생명자원과학대학 실습동',frame:'north',pixels:rect(1116,548,62,55),height:5,roof:'#b7c3bd'},
 {id:'sat-greenhouse-east',name:'농업 실험 온실',frame:'north',pixels:rect(1279,541,82,72),height:4,roof:'#b8cbc6',type:'greenhouse'},
 {id:'sat-greenhouse-west',name:'농업 실험 온실 부속동',frame:'north',pixels:rect(1048,576,55,58),height:3,roof:'#b8cbc6',type:'greenhouse'}
];
const lawns=[
 {id:'471490294',frame:'centre',pixels:[[791,782],[1158,782],[1165,977],[1139,1009],[803,1009],[778,986],[778,808]]},
 {id:'471697071',frame:'centre',pixels:[[817,53],[1122,53],[1146,84],[1146,421],[1114,454],[820,454],[794,424],[794,82]]},
 {id:'471697103',frame:'centre',pixels:[[1233,47],[1425,47],[1452,78],[1452,427],[1425,459],[1236,459],[1221,432],[1221,73]]},
 {id:'471697043',frame:'north',pixels:[[709,504],[821,536],[951,653],[1053,808],[1090,897],[1090,1006],[729,1006],[707,930]]},
 {id:'471697061',frame:'north',pixels:[[345,935],[613,931],[632,978],[632,1156],[350,1156]]},
 {id:'471697097',frame:'centre',pixels:[[363,294],[682,225],[698,373],[553,384],[549,447],[429,452],[431,487],[357,487]]}
];
const parkings=[
 {id:'sat-natural-sciences-parking',frame:'north',pixels:rect(61,508,116,143)},
 {id:'sat-pharmacy-north-parking',frame:'north',pixels:rect(61,793,120,80)},
 {id:'sat-gym-east-parking',frame:'centre',pixels:rect(554,400,145,91)},
 {id:'sat-language-parking',frame:'south',pixels:[[174,471],[338,471],[338,558],[166,558]]},
 {id:'sat-law-south-parking',frame:'south',pixels:rect(393,818,269,76)},
 {id:'sat-economics-south-parking',frame:'south',pixels:rect(867,585,250,48)}
];
export const SATELLITE_LAWNS=lawns.map(a=>({...a,points:ring(a.frame,a.pixels)}));
export const SATELLITE_PARKINGS=parkings.map(a=>({...a,points:ring(a.frame,a.pixels)}));
export function applySatelliteLayout(source){
 if(source.satelliteLayout)return source;
 const buildings=source.buildings.map(b=>({...b}));
 for(const t of traces){const points=ring(t.frame,t.pixels),open=points.slice(0,-1);buildings.push({id:t.id,name:t.name,points,center:[open.reduce((n,p)=>n+p[0],0)/open.length,open.reduce((n,p)=>n+p[1],0)/open.length],height:t.height,tags:{building:t.type??'university','source:geometry':'user aerial reference 2026-10-26'},satelliteRoof:t.roof});}
 // Visible building outlines traced in the same frame as the junctions.
 const science=buildings.find(b=>b.id==='286070805');
 if(science)science.points=ring('north',[[231,555],[286,555],[286,544],[307,544],[307,555],[472,555],[472,544],[492,544],[492,555],[549,555],[549,626],[457,626],[457,644],[411,644],[411,626],[231,626]]);
 const museum=buildings.find(b=>b.id==='471697017');
 if(museum)museum.points=ring('north',[[876,489],[876,599],[958,599],[958,420],[982,420],[982,389],[952,389],[952,382],[884,382],[884,489]]);
 const labels={'369681559':'제주흑우연구센터','471377429':'언어교육원','471377428':'법과정책연구원'};
 for(const b of buildings)if(labels[b.id])b.name=labels[b.id];
 const replacement=new Map(SATELLITE_LAWNS.map(a=>[a.id,a]));
 // Recompute anchors after outline changes, so foundations sample the building.
 for(const id of ['286070805','471697017']){
  const b=buildings.find(b=>b.id===id);if(!b)continue;let area=0,x=0,z=0;
  for(let i=1;i<b.points.length;i++){const a=b.points[i-1],c=b.points[i],cross=a[0]*c[1]-c[0]*a[1];area+=cross;x+=(a[0]+c[0])*cross;z+=(a[1]+c[1])*cross;}
  b.center=[x/(3*area),z/(3*area)];
 }
 const areas=source.areas.map(a=>replacement.has(a.id)?{...a,points:replacement.get(a.id).points,tags:{...a.tags,'surface:appearance':'dry_meadow'}}:a);
 for(const a of SATELLITE_LAWNS.filter(a=>!source.areas.some(b=>b.id===a.id)))areas.push({id:a.id,points:a.points,tags:{landuse:'grass','surface:appearance':'dry_meadow'}});
 for(const a of SATELLITE_PARKINGS)areas.push({id:a.id,points:a.points,tags:{amenity:'parking','source:geometry':'user aerial reference'}});
 const roads=[...source.roads];
 const addRoad=(id,frame,pixels,width=5)=>roads.push({id,name:'',points:pixels.map(p=>satellitePoint(frame,p)),tags:{highway:'service',width:String(width),'source:geometry':'user aerial reference'}});
 addRoad('sat-gym-east-access','centre',[[640,485],[640,746],[377,746],[377,661],[342,657]],4.5);
 addRoad('sat-pharmacy-access','centre',[[217,167],[247,179],[327,297]],5);
 addRoad('sat-law-access','south',[[269,926],[348,926],[391,850],[659,850]],5);
 return {...source,buildings,areas,roads,satelliteLayout:{version:'satellite-r32',referenceDate:'2026-10-26',referenceFrames:frames,addedBuildingIds:traces.map(t=>t.id),correctedBuildingIds:['471697017','286070805'],tracedLawns:SATELLITE_LAWNS.length,tracedParkingAreas:SATELLITE_PARKINGS.length,source:'Three aerial screenshots supplied by the user; independent tracing, no photo texture',horizontalAccuracy:'visual alignment to existing OSM junctions; not surveyed',verticalAccuracy:'existing coarse elevation source; overhead images do not determine elevations'}};
}
