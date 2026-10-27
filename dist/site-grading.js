// Observed local site grading. This is a visual reconstruction, not a survey.
// The original AWS raster remains unchanged on disk and supplies the height datum.
export function gradeObservedSportsField(xs,zs,sourceHeights,data){
 const pitch=data.areas?.find(a=>a.id==='286070859');
 if(!pitch)return {heights:sourceHeights,notes:[]};
 const cx=(Math.min(...pitch.points.map(p=>p[0]))+Math.max(...pitch.points.map(p=>p[0])))/2;
 const cz=(Math.min(...pitch.points.map(p=>p[1]))+Math.max(...pitch.points.map(p=>p[1])))/2;
 const samples=[];
 for(let row=0;row<zs.length;row++)for(let col=0;col<xs.length;col++)if(Math.abs(xs[col]-cx)<29&&Math.abs(zs[row]-cz)<45)samples.push(sourceHeights[row*xs.length+col]);
 samples.sort((a,b)=>a-b);const level=samples[Math.floor(samples.length/2)];
 if(!Number.isFinite(level))throw Error('Sports reference height unavailable');
 const heights=Float64Array.from(sourceHeights);let changed=0;
 for(let row=0;row<zs.length;row++)for(let col=0;col<xs.length;col++){
  const distance=Math.hypot(xs[col]-cx,Math.max(0,Math.abs(zs[row]-cz)-42.2));
  if(distance>=63)continue;
  const t=Math.max(0,Math.min(1,(63-distance)/15)),blend=t*t*(3-2*t),i=row*xs.length+col;
  heights[i]=heights[i]*(1-blend)+level*blend;changed++;
 }
 const notes=[{feature:'대운동장',source:'Kakao Roadview2026-03: field and track appear level',operation:'constant-height sports pad with15m blend to surrounding source terrain',referenceHeightMeters:level,referenceMethod:'median of existing source raster inside field; not surveyed field height',changedSamples:changed,dimensionsEstimated:true}];
 const pond=data.studentHallReference?data.areas.find(a=>a.id==='969694342'):null;
 const pondBounds=pond?[Math.min(...pond.points.map(p=>p[0]))-1,Math.max(...pond.points.map(p=>p[0]))+1,Math.min(...pond.points.map(p=>p[1]))-1,Math.max(...pond.points.map(p=>p[1]))+1]:[-163,-133,-76,-54];
 const pads=[
  {feature:'신관 북쪽 아라연 연못',bounds:pondBounds,reference:[-147,-65],blend:5,source:'OSM water outline: flat-water visual reconstruction; water elevation is not surveyed'},
  {feature:'경상대학1호관 건물 바닥',bounds:[-70,13,90,138],reference:[-30,86],offset:.6,blend:6,source:'Roadview2026-03; low planted bank at north facade, not a tall exposed foundation'},
  {feature:'학생회관 신관 앞 낮은 마당',bounds:[-171,data.renderRoadCorrections?.mainAvenue?-100:-91.8,-36,-5],reference:data.renderRoadCorrections?.mainAvenue?[-96.9,-21]:[-88.75,-21],offset:-.6,blend:2.5,source:'User aerial/entrance photos2026-10-26: compact half-round roadside deck and short stairs; courtyard depth0.6m estimated, not surveyed'},
  {feature:'중앙도서관 건물·전면 마당',bounds:[-141,-69,214,282],reference:[-104,224],blend:8,source:'Roadview2026-03'},
  {feature:'디지털도서관 건물·전면 마당',bounds:[-138,-68,291,346],reference:[-104,342],blend:8,source:'Roadview2022-03'},
  {feature:'공과대학1호관 건물·전면 마당',bounds:[263,378,-244,-188],reference:[320,-204],blend:10,source:'Roadview2026-03'}
 ];
 for(const pad of pads){
  const samples=[];for(let row=0;row<zs.length;row++)for(let col=0;col<xs.length;col++)if(Math.abs(xs[col]-pad.reference[0])<8&&Math.abs(zs[row]-pad.reference[1])<8)samples.push(sourceHeights[row*xs.length+col]);
  samples.sort((a,b)=>a-b);const elevation=samples[Math.floor(samples.length/2)]+(pad.offset??0);if(!Number.isFinite(elevation))throw Error('Court reference height missing');let count=0;
  for(let row=0;row<zs.length;row++)for(let col=0;col<xs.length;col++){
   const [minX,maxX,minZ,maxZ]=pad.bounds,distance=Math.hypot(Math.max(minX-xs[col],0,xs[col]-maxX),Math.max(minZ-zs[row],0,zs[row]-maxZ));if(distance>=pad.blend)continue;
   const t=1-distance/pad.blend,blend=t*t*(3-2*t),i=row*xs.length+col;heights[i]=heights[i]*(1-blend)+elevation*blend;count++;
  }
  notes.push({feature:pad.feature,source:pad.source,operation:'level building/court terrace with blended outside edges',referenceHeightMeters:elevation,referenceMethod:'median near courtyard in original coarse raster; not surveyed terrace elevation',changedSamples:count,dimensionsEstimated:true});
 }
 return {heights,notes};
}
