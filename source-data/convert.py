import xml.etree.ElementTree as E,json,math,hashlib
r=E.parse('source-data/ara-campus.osm').getroot(); nodes={n.attrib['id']:n for n in r.findall('node')}; ways={w.attrib['id']:w for w in r.findall('way')}
def tags(x):return {t.attrib['k']:t.attrib['v'] for t in x.findall('tag')}
origin=[33.455,126.562]; R=6378137; co=math.cos(math.radians(origin[0]))
def xy(lat,lon):return [round(R*math.radians(lon-origin[1])*co,3),round(-R*math.radians(lat-origin[0]),3)]
def geometry(w):return [xy(float(nodes[n.attrib['ref']].attrib['lat']),float(nodes[n.attrib['ref']].attrib['lon'])) for n in w.findall('nd')]
def inside(p,poly):
 x,y=p;c=False
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:c=not c
 return c
boundary=geometry(ways['369649909']); buildings=[];roads=[];areas=[]
for w in ways.values():
 t=tags(w);g=geometry(w);center=[sum(p[i] for p in g)/len(g) for i in [0,1]]
 if not any(inside(p,boundary) for p in g):continue
 common={'id':w.attrib['id'],'name':t.get('name:ko',t.get('name','')),'points':g,'tags':t}
 if 'building' in t and g[0]==g[-1]:
  h=float(t.get('height','0').replace('m','').strip() or 0); levels=float(t.get('building:levels',0));common.update(height=h or levels*3.5 or 10.5,heightSource='height' if h else 'levels × 3.5m' if levels else 'unknown: display 10.5m',center=center);buildings.append(common)
 elif 'highway' in t:roads.append(common)
 elif g[0]==g[-1] and (t.get('leisure') in ['pitch','track','park','garden'] or t.get('natural') in ['wood','water'] or t.get('landuse') in ['forest','grass']):areas.append(common)
gate=nodes['4655302248']; spawn=xy(float(gate.attrib['lat']),float(gate.attrib['lon']));landmarks=[{'name':'정문','id':'4655302248','position':spawn,'raw':[float(gate.attrib['lat']),float(gate.attrib['lon'])]}]
for name,id in [('박물관','471697017'),('본관 권역','471490497')]:
 b=next(b for b in buildings if b['id']==id); c=b['center']; nearest=min([p for road in roads for p in road['points']],key=lambda p:math.dist(p,c));landmarks.append({'name':name,'id':id,'position':nearest,'buildingCenter':c})
data={'origin':origin,'projection':'Local equirectangular, R=6378137; x=east, z=south, metres; no scale compression','boundary':boundary,'buildings':buildings,'roads':roads,'areas':areas,'landmarks':landmarks,'spawn':spawn}
json.dump(data,open('dist/campus-data.json','w'),ensure_ascii=False,separators=(',',':'))
manifest={'source':'OpenStreetMap API 0.6 map','url':'https://api.openstreetmap.org/api/0.6/map?bbox=126.553,33.447,126.572,33.463','retrieved':'2026-10-23','license':'ODbL 1.0','attribution':'© OpenStreetMap contributors','copyright':'https://www.openstreetmap.org/copyright','sha256':hashlib.sha256(open('source-data/ara-campus.osm','rb').read()).hexdigest(),'boundaryWay':369649909,'projection':data['projection'],'origin':origin,'counts':{'buildings':len(buildings),'roads':len(roads),'areas':len(areas)},'limitations':['OSM completeness and update times vary. Names are not guaranteed current.','Road widths rendered by category, not surveyed.','Building footprints and road vertices use source geometry unchanged.','Unrecorded building height shown as 10.5m; recorded levels use 3.5m per floor.','Ground is flat because source contains no terrain elevation.','No invented buildings, road connections, trees or gardens added.','Derived geometry covers mapped features intersecting campus boundary; not a certified survey.']}
json.dump(manifest,open('dist/provenance.json','w'),ensure_ascii=False,indent=2)
print(json.dumps(manifest,ensure_ascii=False,indent=2));print('landmarks',landmarks)
