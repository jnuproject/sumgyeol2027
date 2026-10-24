import json,math,xml.etree.ElementTree as E
D=json.load(open('dist/campus-data.json'));R=E.parse('source-data/ara-campus.osm').getroot();N={n.attrib['id']:(float(n.attrib['lat']),float(n.attrib['lon'])) for n in R.findall('node')};W={w.attrib['id']:w for w in R.findall('way')};lat0,lon0=D['origin'];rad=math.pi/180
maximum=0
for f in D['buildings']+D['roads']+D['areas']:
 refs=[n.attrib['ref'] for n in W[f['id']].findall('nd')];assert len(refs)==len(f['points'])
 for ref,p in zip(refs,f['points']):
  lat,lon=N[ref];expected=[6378137*(lon-lon0)*rad*math.cos(lat0*rad),-6378137*(lat-lat0)*rad];maximum=max(maximum,math.dist(expected,p));assert math.dist(expected,p)<.001
# Topology preserves each original way's vertex sequence and shared nodes.
land=D['landmarks'];report={'allSourceVerticesPreserved':True,'maxRoundingErrorMetres':maximum,'buildingCount':len(D['buildings']),'roadWayCount':len(D['roads']),'campusBoundarySource':'OSM way 369649909','gateOSMNode':'4655302248','gateToMuseumCenterMetres':math.dist(land[0]['position'],land[1]['buildingCenter']),'gateToMainBuildingCenterMetres':math.dist(land[0]['position'],land[2]['buildingCenter']),'directions':'Museum southeast of entrance; main building farther south/southeast. North is -z.','visualVerification':'Not completed: cloud preview connection unavailable; hosted site private login gate.'}
json.dump(report,open('source-data/validation.json','w'),ensure_ascii=False,indent=2);print(json.dumps(report,ensure_ascii=False,indent=2))
