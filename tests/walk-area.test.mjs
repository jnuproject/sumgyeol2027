import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createFocusWalkArea,safeFocusPosition} from '../dist/walk-area.js';
import {resolveFocusStops} from '../dist/focus-route.js';
import {walkable} from '../dist/navigation.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/campus-data.json',import.meta.url))),area=createFocusWalkArea(data);
test('all chosen starts, library landing and staircase remain inside the walking area',()=>{
 for(const stop of resolveFocusStops(data,[-67.135,-460.403]))for(const p of[stop.walkPosition,stop.visitPosition,...[stop.arrival,stop.ascent].filter(Boolean).map(p=>p.position)])assert.ok(area.contains(...p),JSON.stringify(p));
 for(const id of['286085067','471694209','471489721']){
  const r=data.roads.find(r=>r.id===id);
  for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],steps=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])*2);for(let s=0;s<=steps;s++)assert.ok(area.contains(a[0]+(b[0]-a[0])*s/steps,a[1]+(b[1]-a[1])*s/steps),id);}
 }
});
test('sports field, museum, digital library, dorms and engineering blocks are excluded',()=>{
 for(const id of['471697017','953564621','953546804','741724817','964181122']){
  const b=data.buildings.find(b=>b.id===id);assert.equal(area.containsRaw(...b.center),false,id);
 }
 for(const p of[[-235,-45],[-400,250],[300,-200],[-79,-510],[-79,400]])assert.equal(area.contains(...p),false,JSON.stringify(p));
 assert.equal(area.contains(NaN,0),false);assert.equal(area.contains(0,Infinity),false);
});
test('narrow corridors and junctions form one traversable component, without crossing buildings',()=>{
 const step=1,origin=[Math.floor(area.bounds.minX),Math.floor(area.bounds.minZ)],cols=Math.ceil(area.bounds.maxX-origin[0])+1,rows=Math.ceil(area.bounds.maxZ-origin[1])+1;
 const visited=new Uint8Array(cols*rows),queue=[];const stops=resolveFocusStops(data,[-67.135,-460.403]);
 const index=p=>Math.round(p[0]-origin[0])+Math.round(p[1]-origin[1])*cols;
 const start=index(stops[0].walkPosition);queue.push(start);visited[start]=1;
 for(let head=0;head<queue.length;head++){
  const n=queue[head],c=n%cols,r=Math.floor(n/cols);
  for(const [dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(nc<0||nc>=cols||nr<0||nr>=rows)continue;const next=nc+nr*cols;if(visited[next])continue;const x=origin[0]+nc,z=origin[1]+nr;if(!area.contains(x,z)||!walkable(x,z,data.buildings))continue;visited[next]=1;queue.push(next);}
 }
 for(const stop of stops)for(const p of[stop.walkPosition,stop.visitPosition,...[stop.arrival,stop.ascent].filter(Boolean).map(p=>p.position)])assert.equal(visited[index(p)],1,stop.id+' disconnected');
});
test('radius stops diagonal escape and safe-start recovery never places a player outside',()=>{
 const r=area.regions.find(r=>r.id==='gate');assert.equal(area.contains(r.maxX-.1,r.minZ+.1),false);
 for(const p of[[-67,-460],[-110,-470],[-145,250],[-89,-20]]){const safe=safeFocusPosition(p,area,(x,z)=>walkable(x,z,data.buildings));assert.ok(safe);assert.ok(area.contains(...safe));assert.ok(walkable(...safe,data.buildings));}
 const dorm=data.buildings.find(b=>b.id==='741724817');assert.equal(safeFocusPosition(dorm.center,area,()=>true),null);
 const outline=area.outline();assert.ok(outline.length>100);for(const edge of outline)for(const p of edge)for(const n of p)assert.ok(Number.isFinite(n));
});
