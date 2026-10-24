// Three user-selected areas. Source geometry stays unchanged.
// Walking starts/camera framing are presentation choices, not measured entrances.
export const FOCUS_SCOPE={
 version:'focus-r19',
 buildingIds:['471297909','471297922','286237890','471697621'],
 roadIds:['286085067','286085053','93690444','471694209','471489721','93690429'],
 mapBounds:{minX:-245,maxX:165,minZ:-525,maxZ:355},
 sources:[
  'campus-data.json: original OSM coordinates and names',
  'https://counsel.jejunu.ac.kr/intro/map.htm?pc=true',
  'https://jejucoop.or.kr/service-store/'
 ]
};
export function resolveFocusStops(data,entrySpawn=data.spawn){
 const find=id=>{const b=data.buildings.find(b=>b.id===id);if(!b)throw Error('Missing focus building: '+id);return b;};
 const economics=find('471297909'),library=find('286237890'),student=find('471697621');
 return [
  {id:'gate',position:data.landmarks[0].position,walkPosition:entrySpawn,visitPosition:entrySpawn,walkYaw:Math.PI,camera:{yaw:.62,radius:79,pitch:.64}},
  {id:'library-route',position:[(economics.center[0]+library.center[0])/2,180],walkPosition:[-94,85],visitPosition:[-104,224],walkYaw:Math.PI,camera:{yaw:-.65,radius:220,pitch:.74},arrival:{position:[-104,224],yaw:Math.PI},buildingIds:[economics.id,'471297922',library.id]},
  {id:'student-hall',position:student.center,walkPosition:[-88,-9],visitPosition:[-88,-9],walkYaw:Math.PI/2,camera:{yaw:1.05,radius:100,pitch:.64},buildingIds:[student.id]}
 ];
}
