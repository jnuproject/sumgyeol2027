// OSM road type is preserved. Widths without OSM width tags are visual estimates,
// revised after the user's confirmation that the campus network is mostly roads.
export const isWalkingRoad=road=>['footway','path','steps','pedestrian'].includes(road.tags.highway);
export function roadWidth(road){
 const supplied=parseFloat(road.tags.width);if(supplied>0)return supplied;
 if(road.id==='286085067')return 17.5;
 if(road.tags.service==='parking_aisle')return 4.8;
 return {footway:2.5,path:2,steps:2,pedestrian:5,service:6.5,residential:7,unclassified:7,tertiary:9,secondary:12,primary:14}[road.tags.highway]??6.5;
}
