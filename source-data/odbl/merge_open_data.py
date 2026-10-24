#!/usr/bin/env python3
"""Independent ODbL dataset alignment/merge. Does not use SMASH application code.
Usage: python3 merge_open_data.py BASELINE SOURCE ALIGNMENT TERRAIN OUTPUT
The existing game footprint geometry and source road IDs are deliberately preserved.
"""
import json,math,sys,copy
from pathlib import Path

def segment_distance(p,a,b):
 dx,dz=b[0]-a[0],b[1]-a[1];den=dx*dx+dz*dz;t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/den)) if den else 0
 return math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t)

def close_ring(points):
 points=[list(p) for p in points]
 if points and points[0]!=points[-1]:points.append(points[0][:])
 return points

def clip_ring(points,bounds):
 ring=points[:-1] if points[0]==points[-1] else points[:]
 for axis,limit,keep_greater in [(0,bounds[0],True),(0,bounds[1],False),(1,bounds[2],True),(1,bounds[3],False)]:
  if not ring:break
  previous=ring[-1];result=[]
  for current in ring:
   pin=(previous[axis]>=limit) if keep_greater else (previous[axis]<=limit)
   cin=(current[axis]>=limit) if keep_greater else (current[axis]<=limit)
   if pin!=cin:
    t=(limit-previous[axis])/(current[axis]-previous[axis]);result.append([previous[k]+t*(current[k]-previous[k]) for k in [0,1]])
   if cin:result.append(current)
   previous=current
  ring=result
 return close_ring(ring) if len(ring)>2 else []

def merge(baseline,source,alignment,terrain_meta):
 result=copy.deepcopy(baseline);transform=lambda p:[round(p[0]*alignment['xScale']+alignment['xOffset'],3),round(p[1]*alignment['zScale']+alignment['zOffset'],3)]
 summary={'newBuildings':[],'newRoads':[],'newAreas':[],'unchangedBuildings':len(baseline['buildings']),'unchangedRoads':len(baseline['roads']),'excludedSourceData':['terrain grid and building ground heights','7000 generated tree placements','estimated heights on existing buildings']}
 old_ids={b['id'] for b in baseline['buildings']}
 for building in source['buildings']:
  ident=building['id'].split('/')[-1]
  if ident in old_ids:continue
  points=close_ring(list(map(transform,building['o'])));center=[sum(p[k] for p in points[:-1])/(len(points)-1) for k in [0,1]]
  result['buildings'].append({'id':ident,'name':building.get('n') or '', 'points':points,'tags':{'building':building.get('kind') or 'yes','name':building.get('n') or '', 'source:geometry':'SMASH-JEJU ODbL campus.json','source:osm_object':building['id']},'height':building['h'],'heightSource':'Source display estimate; levels absent; not measured','center':center,'odblSourceObject':building['id']})
  summary['newBuildings'].append({'id':ident,'name':building.get('n'),'heightEstimated':True})
 old_segments=[(r['points'][i-1],p) for r in baseline['roads'] for i,p in enumerate(r['points']) if i]
 old_vertices=[p for r in baseline['roads'] for p in r['points']]
 def snap(p):
  closest=min(old_vertices,key=lambda q:math.dist(p,q));return closest[:] if math.dist(p,closest)<.2 else p
 for index,road in enumerate(source['roads']):
  points=list(map(transform,road['p']));length=novel=0
  for a,b in zip(points,points[1:]):
   segment_length=math.dist(a,b);length+=segment_length;count=max(1,math.ceil(segment_length/4))
   for i in range(count):
    t=(i+.5)/count;p=[a[k]*(1-t)+b[k]*t for k in [0,1]]
    if min(segment_distance(p,c,d) for c,d in old_segments)>1:novel+=segment_length/count
  if novel<=2:continue
  ident=f'odbl-road-{index:03d}';points=list(map(snap,points))
  result['roads'].append({'id':ident,'name':road.get('n') or '', 'points':points,'tags':{'highway':road['k'],'source:geometry':'SMASH-JEJU ODbL campus.json','source:index':index},'odblSourceIndex':index})
  summary['newRoads'].append({'id':ident,'highway':road['k'],'lengthMeters':round(length,2),'novelMeters':round(novel,2)})
 lat,lon=baseline['origin'];r=6378137;rad=math.pi/180;xs=[(v-lon)*r*rad*math.cos(lat*rad) for v in terrain_meta['lonByColumn']];zs=[-(v-lat)*r*rad for v in terrain_meta['latByRow']];bounds=[min(xs)+1,max(xs)-1,min(zs)+1,max(zs)-1]
 for index,land in enumerate(source['lands']):
  points=close_ring(list(map(transform,land['r'][0])));distances=[]
  for area in baseline['areas']:
   ring=area['points'];distances.append(sum(min(segment_distance(p,ring[j-1],ring[j]) for j in range(1,len(ring))) for p in points[:-1])/(len(points)-1))
  # A clipped woodland polygon shares almost all of its edges with the existing
  # full OSM woodland. Keep the original instead of layering duplicates.
  if min(distances)<5:continue
  if len(land['r'])!=1:raise ValueError('Unexpected holes: require explicit support')
  points=clip_ring(points,bounds)
  if not points:continue
  kind=land['k'];tags={'leisure':'park'} if kind=='park' else {'natural':kind};tags.update({'source:geometry':'SMASH-JEJU ODbL campus.json','source:index':index})
  ident=f'odbl-land-{index:03d}';result['areas'].append({'id':ident,'name':'','points':points,'tags':tags,'odblSourceIndex':index});summary['newAreas'].append({'id':ident,'kind':kind,'clippedToTerrain':True})
 result['openDataIntegration']={'source':'SMASH-JEJU data/campus.json','license':'ODbL1.0','attribution':'© OpenStreetMap contributors','details':'./odbl-provenance.json','summary':summary}
 return result,summary

if __name__=='__main__':
 baseline,source,alignment,terrain_meta,output=map(Path,sys.argv[1:]);result,summary=merge(*[json.loads(p.read_text()) for p in [baseline,source,alignment,terrain_meta]])
 output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
 print(json.dumps(summary,ensure_ascii=False,indent=2))
