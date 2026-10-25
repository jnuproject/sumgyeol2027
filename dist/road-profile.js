// OSM road type is preserved. Widths without OSM width tags are visual estimates,
// revised after the user's confirmation that the campus network is mostly roads.
export const isWalkingRoad=road=>['footway','path','steps','pedestrian'].includes(road.tags.highway);
// User-confirmed total lane count: two uphill + two downhill throughout.
// Width is still a visual estimate, not a measured road survey.
export const MAIN_AVENUE_LANES=4;
export const MAIN_AVENUE_WIDTH=18;
export const isMainAvenueRoad=road=>['286085067','93690444'].includes(road.id);
export function roadWidth(road){
 const supplied=parseFloat(road.tags.width);if(supplied>0)return supplied;
 if(isMainAvenueRoad(road))return MAIN_AVENUE_WIDTH;
 if(road.tags.service==='parking_aisle')return 4.8;
 return {footway:2.5,path:2,steps:2,pedestrian:5,service:6.5,residential:7,unclassified:7,tertiary:9,secondary:12,primary:14}[road.tags.highway]??6.5;
}

// The former 17.5m-to-7.4m taper incorrectly reduced the internal road to two lanes.
export function roadWidthAt(road,x,z){
 // The mapped avenue is split into two OSM ways. Keep the broad section
 // through the economics junction, then narrow into the building access loop.
 if(road.id==='93690444'&&!road.tags.width){const t=Math.max(0,Math.min(1,(z-82.744)/(111.319-82.744)));return MAIN_AVENUE_WIDTH+(6.5-MAIN_AVENUE_WIDTH)*t;}
 return roadWidth(road);
}

export function roadRenderPoints(road){
 return road.points;
}

// The economics access loop has no surveyed continuous sidewalk. Keep the
// broad avenue sidewalk only up to its cross street, without paving over walls.
export const roadSidewalkWidthAt=(road,x,z)=>road.id==='286085067'||(road.id==='93690444'&&z<=82.744)?4.2:0;
