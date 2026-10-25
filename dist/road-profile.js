// OSM road type is preserved. Widths without OSM width tags are visual estimates,
// revised after the user's confirmation that the campus network is mostly roads.
export const isWalkingRoad=road=>['footway','path','steps','pedestrian'].includes(road.tags.highway);
// User-confirmed total lane count: two uphill + two downhill throughout.
// Width is still a visual estimate, not a measured road survey.
export const MAIN_AVENUE_LANES=4;
export const MAIN_AVENUE_WIDTH=14.4;
export function roadWidth(road){
 const supplied=parseFloat(road.tags.width);if(supplied>0)return supplied;
 if(road.id==='286085067')return MAIN_AVENUE_WIDTH;
 if(road.tags.service==='parking_aisle')return 4.8;
 return {footway:2.5,path:2,steps:2,pedestrian:5,service:6.5,residential:7,unclassified:7,tertiary:9,secondary:12,primary:14}[road.tags.highway]??6.5;
}

// The former 17.5m-to-7.4m taper incorrectly reduced the internal road to two lanes.
export function roadWidthAt(road,x,z){
 return roadWidth(road);
}

export function roadRenderPoints(road){
 return road.points;
}
