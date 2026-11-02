// OSM field anchor. Temporary event placement is a photo-informed game layout,
// not a surveyed map of any particular year's event.
export function festivalLayout(data){
 const field=data.areas?.find(a=>a.id==='286070859');if(!field)return null;
 const xs=field.points.map(p=>p[0]),zs=field.points.map(p=>p[1]);
 const center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2];
 const [cx,cz]=center;
 // West-side covered stand faces east across the infield.
 const stage=[cx-44,cz];
 return {center,stage,entry:[cx+49,cz-44],spawn:[cx+13,cz-3],
  // Route is south of the gym and north of the pond garden, then follows the track.
  connector:[[-97,-89],[-169,-89],[cx+49,cz-44],[cx+32,cz-44]],
  walkBox:{minX:cx-64,maxX:cx+57,minZ:cz-99,maxZ:cz+97},
  booths:Array.from({length:8},(_,i)=>({x:cx+46,z:cz-29+i*9.5,label:['숨결 안내소','귤빛 간식','동아리 마켓','오늘의 사진','함께 놀아요','시원한 쉼표','축제 기념품','초록 실천'][i]})),
  audience:Array.from({length:12},(_,i)=>({x:cx-11+(i%3)*10,z:cz+[-23,-13,13,23][Math.floor(i/3)]})),
  studentZone:{minX:cx-16,maxX:cx+23,minZ:cz-32,maxZ:cz+32,aisleHalfWidth:5},
  photo:[cx+28,cz+54],
  inferred:true,source:'https://appstagejeju.com/portfolio/?vid=21'};
}
