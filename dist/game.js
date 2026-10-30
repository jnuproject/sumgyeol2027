import {createMultiplayerScene} from './multiplayer-scene.js?v=screen-r50';
import {createCampusHud} from './campus-hud.js?v=screen-r50';
import {createCampusLife} from './campus-life.js?v=screen-r50';
import {createStoryGame} from './story-game.js?v=screen-r50';
import {applyStudentHallReference} from './student-hall-garden.js?v=screen-r50';
import {applySatelliteLayout} from './satellite-layout.js?v=screen-r50';
import {simulationDelta,isTouchLayout,renderProfile,shouldClearPointerExit} from './mobile-performance.js?v=screen-r50';
import {createTouchInput} from './touch-input.js?v=screen-r50';
import {prepareCampusRoads} from './road-clearance.js?v=screen-r50';
import {createCampusReflections} from './reflection-probes.js?v=screen-r50';
import * as THREE from './three.module.js';
import { createCampus, makeAvatar } from './world.js?v=screen-r50';
import {isWalkingRoad} from './road-profile.js?v=screen-r50';
import { places } from './places.js?v=screen-r50';
import {FOCUS_SCOPE,resolveFocusStops,focusZoneLabel} from './focus-route.js?v=screen-r50';
import { walkable } from './navigation.js';
import {createCampusWalkArea,safeFocusPosition} from './walk-area.js?v=screen-r50';
import { advanceVertical, terrainCameraDistance, walkSpeed, advancePlanarMotion } from './movement.js?v=screen-r50';

const $=id=>document.getElementById(id);
const dialogOpen=()=>$('dialog').open||document.body.dataset.conversation==='true';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
function fail(error){
  console.error(error);
  $('loadingIndicator').hidden=true;
  $('error').hidden=false;
  $('errorMessage').textContent=location.protocol==='file:'?'로컬 웹 서버를 실행한 다음 http://127.0.0.1:8000 으로 열어주세요. 실행 방법은 README에 있습니다.':'WebGL을 지원하는 최신 브라우저에서 다시 시도해 주세요. 문제가 계속되면 화면 설정의 그래픽 품질을 낮춰주세요.';
  $('loadLabel').textContent='불러오기를 완료하지 못했어요';
}
$('retry').onclick=()=>location.reload();
try { await initialize(); } catch(error){ fail(error); }

async function initialize(){
  const mobileClient=isTouchLayout({coarse:matchMedia('(pointer: coarse)').matches,touches:navigator.maxTouchPoints,width:innerWidth,height:innerHeight});let quality='balanced',graphics=renderProfile({mobile:mobileClient,quality,pixelRatio:devicePixelRatio}),shadowCell=null,shadowRefreshes=0;const shadowAnchor=new THREE.Vector3();
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(graphics.pixelRatio);
  renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=graphics.shadows;renderer.shadowMap.autoUpdate=!graphics.staticShadows;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const response=await fetch('./campus-data.json?v=odbl-20261024-r15',{cache:'no-store'});
  if(!response.ok)throw Error('Map data could not be loaded');
  const data=prepareCampusRoads(applyStudentHallReference(applySatelliteLayout(await response.json())));
  const museumReview=new URLSearchParams(location.search).get('view')==='museum';
  const studentFrontReview=new URLSearchParams(location.search).get('view')==='student-front';
  const studentReview=new URLSearchParams(location.search).get('view')==='student';
  const lawnReview=new URLSearchParams(location.search).get('view')==='lawns'||studentReview;
  const linkedId=new URLSearchParams(location.search).get('place'),linkedBuilding=FOCUS_SCOPE.buildingIds.includes(linkedId)?data.buildings.find(b=>b.id===linkedId):null;
  let linkedWalkPending=Boolean(linkedBuilding);
  function linkedWalkStart(){
    if(!linkedWalkPending||!linkedBuilding)return null;linkedWalkPending=false;if(linkedBuilding.id==='471697621')return {position:focusStops[2].walkPosition,yaw:Math.PI/2};const b=linkedBuilding,side=['953564621','953546804'].includes(b.id)?'south':['741724817','964181122','471697621'].includes(b.id)?'east':'north';
    const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);return {position:side==='east'?[Math.max(...xs)+13,b.center[1]]:[(Math.min(...xs)+Math.max(...xs))/2,side==='south'?Math.max(...zs)+13:Math.min(...zs)-13],yaw:side==='east'?Math.PI/2:side==='south'?0:Math.PI};
  }
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b9e7fa');scene.fog=new THREE.Fog('#b9e7fa',250,1400);
  const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.12,2600);
  const ambient=new THREE.HemisphereLight('#e0f6ff','#a2ae8d',1.65);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff7df',2.0);sun.castShadow=true;sun.shadow.mapSize.set(graphics.shadowSize,graphics.shadowSize);
  Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:550});sun.shadow.normalBias=.035;sun.shadow.bias=-.00008;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#c8e9ff',.40);fill.position.set(100,80,-50);scene.add(fill);
  const campus=await createCampus(scene,data,{mobile:mobileClient}),avatar=await makeAvatar(scene);$('loadingStatus').textContent='빛과 그림자를 준비하고 있어요.';
  const {player,body,legs,arms}=avatar;player.visible=false;if(mobileClient)player.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  const groundAt=(x,z)=>(campus.walkHeightAt??campus.heightAt)(x,z);
  const terrainAt=(x,z)=>campus.heightAt(x,z);
  const walkArea=createCampusWalkArea(campus.bounds);
  function safeWalkStart(point){return safeFocusPosition(point,walkArea,(x,z)=>walkable(x,z,campus.walkCollisionPolygons??data.buildings)&&!campus.obstacles.some(p=>Math.hypot(x-p[0],z-p[1])<p[2]+.4));}

  let grounded=true,totalWalked=0,jumpCount=0,maxJumpClearance=0,blockedMoves=0;
  const groundNormal=new THREE.Vector3(),shadowNormal=new THREE.Vector3(0,0,1);
  const skyUniforms={top:{value:new THREE.Color('#69bde8')},bottom:{value:new THREE.Color('#b9e7fa')},sunDirection:{value:new THREE.Vector3(-.5,.65,-.4).normalize()}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(2100,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,toneMapped:false,uniforms:skyUniforms,vertexShader:'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDirection;
uniform vec3 top;uniform vec3 bottom;uniform vec3 sunDirection;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(23.7,9.2);a*=.5;}return v;}
void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.06,.65,d.y);vec3 c=mix(bottom,top,h);float glow=pow(max(dot(d,sunDirection),0.),160.);c+=vec3(.65,.55,.38)*glow;
vec2 cloudUV=d.xz/max(d.y+.16,.04)*1.4;float cloud=fbm(cloudUV);float shape=smoothstep(.52,.74,cloud)*smoothstep(.04,.22,d.y);c=mix(c,vec3(.94,.96,.97),shape*.42);
gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));
  sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);
  const skyDayTop=new THREE.Color('#69bde8'),skyDayBottom=new THREE.Color('#b9e7fa'),skyNightTop=new THREE.Color('#23394b'),skyNightBottom=new THREE.Color('#8f9294');

  const focusStops=resolveFocusStops(data,campus.entrySpawn??data.spawn);
  const locations=focusStops.map(p=>p.position);
  const focusLocations=focusStops.map(p=>p.visitPosition);
  const visitMarkers=focusLocations.map((p,i)=>{const group=new THREE.Group();group.position.set(p[0],groundAt(p[0],p[1])+.04,p[1]);const ring=new THREE.Mesh(new THREE.RingGeometry(2.5,2.7,48),new THREE.MeshBasicMaterial({color:'#00bfff',transparent:true,opacity:.8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;group.add(ring);scene.add(group);group.visible=false;return group;});
  const cameras=focusStops.map(p=>p.camera);
  $('navPlaces').disabled=true;$('navWalk').disabled=true;
  let overview=false;
  let mode='welcome',selected=0,night=false,elapsed=0;
  let yaw=.62,pitch=.64,distance=79,walkYaw=Math.PI,walkPitch=.16,walkDistance=14,verticalVelocity=0;
  let firstPerson=false,frameDuration=16.7,mobileQualityElapsed=0;
  let velocityX=0,velocityZ=0,touchX=0,touchY=0,runTouch=false,walkCycle=0;
  let drag=null,joystickPointer=null,frame=0,mapElapsed=0;
  const touchInput=createTouchInput();
  const touchLayout=()=>isTouchLayout({coarse:matchMedia('(pointer: coarse)').matches,touches:navigator.maxTouchPoints,width:innerWidth,height:innerHeight});
  function syncTouch(){joystickPointer=touchInput.state.movePointer;touchX=touchInput.state.x;touchY=touchInput.state.y;runTouch=touchInput.state.running;$('run').setAttribute('aria-pressed',String(runTouch));$('runLabel').textContent=runTouch?'걷기로':'달리기';}
  const pointers=new Map();let pinchDistance=null;
  const keys={},cameraFocus=new THREE.Vector3(-30,0,-419),desiredFocus=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),cameraDirection=new THREE.Vector3(),currentFocus=cameraFocus.clone();
  const raycaster=new THREE.Raycaster();
  const clock=new THREE.Clock();
  const buttons=[];let lastDialogTrigger=null;
  const colors={day:new THREE.Color('#b9e7fa'),night:new THREE.Color('#354d60')};
  const pins=places.map((place,i)=>{
    const pin=document.createElement('button');pin.className='hotspot';pin.innerHTML=`<span>${place.number}</span>${place.short}`;pin.setAttribute('aria-label',`${place.short} 둘러보기`);pin.onclick=()=>showPlace(i);$('hotspots').append(pin);return pin;
  });
  places.forEach((place,i)=>{
    const card=document.createElement('button');card.className='intro-card';card.disabled=true;card.innerHTML=`<span class="intro-number">${place.number}</span><span><b>${place.short}</b><small>${place.teaser}</small></span><span class="card-arrow">↗</span>`;card.onclick=()=>showPlace(i);$('introCards').append(card);buttons.push(card);
    const tab=document.createElement('button');tab.className='place-tab';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');tab.setAttribute('aria-controls','placeCard');tab.innerHTML=`<span>${place.number}</span>${place.short}`;tab.onclick=()=>showPlace(i);$('placeTabs').append(tab);
  });
  $('placeTabs').setAttribute('role','tablist');$('placeTabs').setAttribute('aria-label','산책 장소');
  $('placeCard').setAttribute('role','tabpanel');
  $('placeTabs').addEventListener('keydown',e=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
    e.preventDefault();const delta=e.key==='ArrowRight'?1:-1;const index=e.key==='Home'?0:e.key==='End'?2:(selected+delta+3)%3;
    showPlace(index);$('placeTabs').children[index].focus();
  });
  function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
  function clearInput(){touchInput.reset();syncTouch();for(const key of Object.keys(keys))keys[key]=false;touchX=touchY=0;runTouch=false;velocityX=velocityZ=0;drag=null;joystickPointer=null;pointers.clear();pinchDistance=null;$('knob').style.transform='';}
  function setMode(next){
    mode=next;document.body.dataset.mode=mode;campus.setOverview(overview);clearInput();
    const shadowRange=overview?480:85;Object.assign(sun.shadow.camera,{left:-shadowRange,right:shadowRange,top:shadowRange,bottom:-shadowRange,far:overview?1400:550});sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;shadowCell=null;
    $('welcome').hidden=mode!=='welcome';$('explorer').hidden=mode!=='explore';$('walking').hidden=mode!=='walk';
    for(const id of ['mapPanel','dock','sceneCaption'])$(id).hidden=mode==='welcome';
    $('touch').hidden=mode!=='walk';$('walkKeys').hidden=mode!=='walk';player.visible=mode==='walk';
    $('mapLegend').textContent=mode==='walk'?'내 위치 · 파란 점은 숨결':'살펴보는 장소';
    $('walkToggle').setAttribute('aria-pressed',String(mode==='walk'));
    $('dock').classList.remove('mobile-open');$('mobilePlaces').setAttribute('aria-expanded','false');body.visible=!firstPerson;avatar.shadow.visible=!firstPerson;hud.close({restore:false});resize();
  }
  function setNight(value){night=value;$('time').setAttribute('aria-pressed',String(night));$('timeLabel').textContent=night?'저녁':'맑음';$('sceneLabel').textContent=night?'저녁빛 아라캠퍼스':'맑은 아라캠퍼스';}
  function showPlace(index){
    overview=false;
    selected=(index+places.length)%places.length;const place=places[selected];setMode('explore');
    yaw=cameras[selected].yaw;pitch=cameras[selected].pitch;distance=cameras[selected].radius;
    $('placeCategory').textContent=place.category;$('placeNumber').textContent=place.number;$('placeTitle').textContent=place.title;
    $('placePlace').textContent=place.place;$('placeQuestion').textContent=place.question;$('placeIdea').textContent=place.description;
    $('visualNote').textContent=place.note;$('placeChecks').textContent=place.detail;$('placeCounter').innerHTML=`${place.number} <span>/ ${String(places.length).padStart(2,'0')}</span>`;
    $('walkHere').firstChild.textContent=place.walkLabel+' ';$('walkArrival').hidden=!focusStops[selected].arrival;$('walkArrival').textContent=place.arrivalLabel??'';$('walkAscent').hidden=!focusStops[selected].ascent;
    $('placeCard').scrollTop=0;$('placeCard').querySelector('details').open=false;
    [...$('placeTabs').children].forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===selected));tab.tabIndex=i===selected?0:-1;});
    pins.forEach((pin,i)=>pin.setAttribute('aria-current',String(i===selected)));
    snapCamera();
  }
  function startWalk(arrival=false){
    overview=false;
    if(mode==='welcome')selected=linkedBuilding?(linkedBuilding.id==='471697621'?2:1):0;
    const linked=arrival==='ascent'?focusStops[selected].ascent:arrival?focusStops[selected].arrival:linkedWalkStart();
    const start=linked?.position??((mode==='welcome'||selected===0)?(campus.entrySpawn??data.spawn):focusStops[selected].walkPosition);
    const position=safeWalkStart(start)??safeWalkStart(campus.entrySpawn??data.spawn);
    if(!position){toast('이 위치에서는 시작할 수 없어요. 정문에서 시작합니다.');throw Error('No safe walking start in selected area');}else player.position.set(position[0],groundAt(...position),position[1]);
    walkYaw=linked?.yaw??focusStops[selected].walkYaw;body.rotation.y=Math.atan2(-Math.sin(walkYaw),-Math.cos(walkYaw));walkPitch=.16;walkDistance=mobileClient?9:(focusStops[selected].walkDistance??14);verticalVelocity=0;grounded=true;setMode('walk');snapCamera();$('world').focus({preventScroll:true});
    if(touchLayout()){$('mapPanel').classList.add('collapsed');$('mapToggle').textContent='+';$('mapToggle').setAttribute('aria-expanded','false');$('mapToggle').setAttribute('aria-label','지도 펼치기');}

  }
  function resetPlayer(){const entry=campus.entrySpawn??data.spawn;const p=safeWalkStart(entry);if(!p)return;player.position.set(p[0],groundAt(...p),p[1]);verticalVelocity=0;grounded=true;clearInput();walkYaw=Math.PI;body.rotation.y=0;toast('정문으로 돌아왔어요.');}
  function goHome(){overview=false;setMode('welcome');setNight(false);snapCamera();}
  $('explore').onclick=()=>startWalk();$('walkIntro').onclick=()=>showPlace(0);$('walkHere').onclick=()=>startWalk();$('walkArrival').onclick=()=>startWalk(true);$('walkAscent').onclick=()=>startWalk('ascent');$('walkToggle').onclick=()=>mode==='walk'?showPlace(selected):startWalk();
  $('backToIdeas').onclick=()=>showPlace(selected);$('previous').onclick=()=>showPlace(selected-1);$('next').onclick=()=>showPlace(selected+1);
  $('navHome').onclick=()=>{$('welcome').scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});};$('navPlaces').onclick=()=>showPlace(0);$('navWalk').onclick=()=>startWalk();$('homeHelp').onclick=()=>$('help').click();
  $('campusOverview').onclick=()=>{overview=true;setMode('explore');$('explorer').hidden=true;distance=820;pitch=1.48;yaw=Math.PI;snapCamera();};
  $('mobilePlaces').onclick=()=>hud.toggle('places');
  $('touchPerspective').onclick=togglePerspective;
  $('home').onclick=goHome;$('back').onclick=goHome;$('time').onclick=()=>setNight(!night);
  function togglePerspective(){firstPerson=!firstPerson;body.visible=!firstPerson;avatar.shadow.visible=!firstPerson;$('perspective').textContent=firstPerson?'3인칭':'1인칭';$('perspective').setAttribute('aria-label',firstPerson?'3인칭 시점으로':'1인칭 시점으로');if(mode!=='walk')startWalk();snapCamera();}
  $('perspective').onclick=togglePerspective;
  $('mapToggle').onclick=()=>{if(mode==='walk'||mode==='explore'){hud.close();return;}const collapsed=$('mapPanel').classList.toggle('collapsed');$('mapToggle').textContent=collapsed?'+':'−';$('mapToggle').setAttribute('aria-expanded',String(!collapsed));$('mapToggle').setAttribute('aria-label',collapsed?'지도 펼치기':'지도 접기');};

  function showDialog(title,html){lastDialogTrigger=document.activeElement;hud.close();clearInput();$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialog').showModal();}
  $('closeDialog').onclick=()=>$('dialog').close();$('dialog').addEventListener('close',()=>{clearInput();if(lastDialogTrigger?.isConnected&&lastDialogTrigger.getClientRects().length)lastDialogTrigger.focus({preventScroll:true});else $('world').focus({preventScroll:true});});
  $('help').onclick=()=>showDialog('가볍게, 자유롭게 걸어요.',`<p><b>숨결과 이야기하기</b> 캠퍼스의 숨결 NPC에게 다가가 E 또는 말 걸기 버튼을 누르면 대화창이 열려요. 한 줄씩 이야기를 듣고, 답하고 싶은 말을 선택하세요. E·Space 또는 계속 듣기로 넘기고, Esc로 잠시 나갈 수 있어요. 대화 중에는 이동하지 않습니다.</p><p>화면에 보이는 캠퍼스를 자유롭게 돌아다닐 수 있어요. 정문·도서관·학생회관의 숨결 NPC를 찾아 이야기를 나눠보세요. 정문·도서관 오르막·학생회관 신관의 도장 지점 가까이 가면 산책 기록이 자동 저장됩니다. 아래 장소 버튼을 누르면 그곳을 둘러보거나 근처에서 걷기를 시작할 수 있습니다.</p><div class="key-row"><span>시점 회전</span><kbd>화면 드래그</kbd></div><div class="key-row"><span>확대 · 축소</span><kbd>휠 / 두 손가락</kbd></div><div class="key-row"><span>걷기</span><kbd>W A S D / 방향키</kbd></div><div class="key-row"><span>달리기 · 점프</span><kbd>Shift · Space</kbd></div><div class="key-row"><span>정문으로 돌아가기</span><kbd>R</kbd></div><div class="key-row"><span>사진 모드 / 돌아가기</span><kbd>P / Esc</kbd></div><p>휴대폰에서는 왼쪽 조이스틱으로 이동하고, 달리기 버튼을 한 번 누르면 달리기가 켜집니다. 다시 누르면 걷기로 돌아와요. 오른쪽 화면을 드래그해 주위를 둘러보고, 가까운 숨결의 말 걸기 버튼을 눌러보세요. 도장은 이 브라우저에만 저장됩니다.</p>`);
  $('settings').onclick=()=>{
    showDialog('나에게 맞는 화면',`<label for="quality">그래픽 품질</label><select id="quality"><option value="balanced">균형 · 기본 설정</option><option value="high">높음 · 선명한 그림자</option><option value="low">가볍게 · 그림자 끄기</option></select><p>화면이 느리면 ‘가볍게’를 선택해 주세요. 데이터나 지도 배치는 바뀌지 않습니다.</p><label><input id="gentle" type="checkbox" style="width:auto;margin-right:8px"> 카메라 전환을 즉시 적용</label><p class="privacy-note">운영체제의 동작 줄이기 설정도 따릅니다.</p>`);
    $('quality').value=quality;$('gentle').checked=instantCamera;$('gentle').onchange=()=>{instantCamera=$('gentle').checked;};
    $('quality').onchange=()=>{quality=$('quality').value;graphics=renderProfile({mobile:mobileClient,quality,pixelRatio:devicePixelRatio});renderer.setPixelRatio(graphics.pixelRatio);renderer.shadowMap.enabled=graphics.shadows;renderer.shadowMap.autoUpdate=!graphics.staticShadows;renderer.shadowMap.needsUpdate=true;shadowCell=null;sun.shadow.mapSize.set(graphics.shadowSize,graphics.shadowSize);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}scene.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.needsUpdate=true);}});resize();};
  };
  $('about').onclick=()=>showDialog('숨결에서 만나는 우리 캠퍼스',`<p><b>사진 기준 외관과 보도:</b> 학생회관의 창띠·입구·원형 계단실, 박물관 앞 붉은 보행로·안내석·현무암 좌석과 수목을 반영했습니다. 간선도로 보도는 5.8m로 넓혔습니다. <a href='?view=student-front'>학생회관 정면</a> · <a href='?view=museum'>박물관 앞</a></p><p><b>잔디광장 표현:</b> 주변과 같은 기존 초록 잔디를 사용하고, 잔디광장 둘레의 수목과 나무 그늘을 유지했습니다. <a href='?view=lawns'>잔디광장 확대 보기 ↗</a></p><p><b>첨부 위성사진 배치 보정:</b> 대운동장 트랙을 복원하고, 중앙 잔디광장과 야외음악당 잔디, 박물관 윤곽, 약학대학 2호관·우편취급국·온실·주차 공간을 사진에서 독립 재구성했습니다. 학교 전체 버튼은 사진과 비교하기 쉬운 항공 시점입니다. <a href='./satellite-layout.js' target='_blank' rel='noopener'>배치 근거 ↗</a></p><p><b>모바일 조작 보완:</b> 낮은 프레임에서 이동까지 느려지는 시간 처리와 터치 해제 문제를 수정했습니다. 기존 건물·수목을 유지하면서 렌더 호출과 그림자 부담을 줄였습니다. <a href="./mobile-performance-sources.json" target="_blank" rel="noopener">검증 범위 ↗</a></p><p><b>위성사진으로 조경 보정:</b> 빈 잔디와 가장자리 수목, 신관 연못 산책길, 경상대 뒤 숲과 도서관 동쪽 숲·주차 공간을 최근사진 화면과 대조해 독립 재구성했습니다. 개별 나무·길 치수는 추정이며 완전한 현장 복제는 아닙니다. 옷에는 기존 숨결 로고 원본을 가슴과 등에 넣었습니다. <a href="./landscape-sources.json" target="_blank" rel="noopener">관찰·적용·추정 내역 ↗</a></p><p><b>도로 경계 · 캐릭터 · 모바일 조작:</b> 건물 윤곽과 차도가 겹치는 부분을 검사해 차도 표시를 보정하고, 도로 안쪽으로 보이던 녹지와 정문 앞 표면 겹침을 수정했습니다. 보정 위치는 시각·기하 추정이며 실측이 아닙니다. 캐릭터는 Kenney의 CC0 모델을 하늘색 의상과 숨결 모티프로 수정했고 걷기·달리기·점프를 기존 충돌 제어에 연결했습니다. <a href="./avatar-sources.json" target="_blank" rel="noopener">에셋 출처·변경 기록 ↗</a></p><p><b>건물 전체 표시 및 항공사진 대조:</b> 학교 전체 건물 59개를 복원하고 경상대·도서관·신관의 녹색 옥상, 경상대 1호관의 태양광 배열과 도서관 옥상 구조물을 독자 재구성했습니다. <a href="./building-sources.json" target="_blank" rel="noopener">관찰·추정 기록 ↗</a></p><p><b>교내 간선도로 정정:</b> 정문부터 위쪽까지 왕복 4차선(방향별 2차선)으로 맞췄습니다. 사용자의 현장 확인을 반영했으며, 카카오맵 최근사진 스카이뷰를 직접 대조해 차도 폭을 약 18m로 보정했습니다. 지도에서 선택한 경계와 수목 가림에 오차가 있는 시각 추정값이며 실측 폭은 아닙니다. 경상대 앞 연결 도로도 동일 폭으로 이어지도록 보정하고, 일반 보도의 연속 목재 띠를 제거했습니다. <a href="./road-correction.json" target="_blank" rel="noopener">정정 내역 ↗</a></p><p><b>2026년 3월 모습으로 주변 환경 보강:</b> 정문 가로수·숲 하층, 작은 보도블록과 입체 연석, 경상대의 연속 관목·덩굴, 신관 앞 가지가 드러난 수목, 도서관 계단 옆의 두꺼운 관목을 재구성했습니다. 개별 위치와 치수는 추정이며, 10월 현장 실측은 아닙니다. <a href="./surroundings-sources.json" target="_blank" rel="noopener">이번 환경 보강의 관찰·추정 기록 ↗</a></p><p><b>정문 현재 모습 재확인:</b>2026년3월 촬영 로드뷰를 다시 관찰해 돌하르방 두 개와 예전 사진에서 추정한 기와형 지붕을 제거했습니다. 낮은 연결 보는 유지했습니다. 신관 데크·진입 계단과 창 분할도 보정했습니다. 게시일만 최신인 과거 사진은 이번 수정에 사용하지 않습니다. <a href="./identity-sources.json" target="_blank" rel="noopener">최신 관찰·철회·추정 기록 ↗</a></p><p>세 구역과 가까운 주변을 보강했습니다. 교내 차도 폭과 보도·수목 관계, 도서관 앞 정류장, 경상대의 현무암 경계, 신관 북쪽 연못과 난간을 대조했습니다. <a href="./periphery-sources.json" target="_blank" rel="noopener">주변 환경 관찰·추정 기록 ↗</a></p><p>경상대 1·2호관의 외벽·창·계단실, 중앙도서관 정면과 계단·차양·수목, 학생회관 신관의 타일·유리 계단실·낮은 마당과 진입 계단을 공개 로드뷰 관찰로 구체화했습니다. 오르막 계단의 단수·치수와 보정 고도는 추정입니다. <a href="./focus-detail-sources.json" target="_blank" rel="noopener">구체화 자료와 관찰/추정 구분 ↗</a></p><p>이번 산책의 중점 구역은 <b>정문 · 경상대에서 중앙도서관으로 올라가는 길 · 학생회관(신관)</b>입니다. 숨결 NPC와 일상의 고민을 나누며 서로 다른 정책 구상을 알아갑니다. 캠퍼스 친구들과 사진을 찍거나 다른 친구의 위치를 물어볼 수도 있습니다. 학교 전체 건물 59개와 지형·도로·녹지를 표시합니다. 아래 학교 전체 버튼에서 배치를 조망할 수 있습니다. 화면에 보이는 캠퍼스를 자유롭게 걸을 수 있습니다.</p><p>OpenStreetMap 원자료는 <b>건물 59개, 도로·보행로 91개, 구역 35개</b>입니다. 현재 장면에는 원자료의 건물 59개를 모두 표시합니다. 주요 건물은 개별 외관을 유지하고, 나머지는 실제 지도 윤곽과 기록된 층수 또는 추정 높이에 기반한 일반 외관입니다. 선택한 건물은 공개 로드뷰와 사진을 대조해 독자 모델링했습니다. 사진 시점과 다른 현재 상태 및 미관찰 면은 추정입니다.</p><p>나무·일반 건물의 창·도로 폭은 시각적 재구성입니다. 정문은2026년3월 촬영 카카오 로드뷰를 직접 이동·회전하며 관찰해 도로 옆 경비실, 중앙 차량관리 부스, 곡선 지붕과 볼라드·낮은 식재를 재구성했습니다. 개별 위치와 치수는 측량값이 아닙니다. 사진 기반 표면 재질은 제주 현장 자체를 촬영한 것은 아닙니다. 지형은 공개 AWS Terrain Tiles의 SRTM 기반 약 30m 고도 자료를 사용합니다. 운동장과 도서관·공학관·학생회관 마당에는 로드뷰에서 확인한 형태를 표현하기 위한 국소 정지면을 보정했으며, 그 높이와 전이 경사는 실측값이 아닙니다. 약 4m 타일 픽셀과 삼각형 보간이 현장 정밀도를 높이지는 않습니다. 보도·계단의 실측 고도는 아니며, 도로 폭과 미기록 건물 높이는 추정입니다.</p><p>바로 걸어보기: <a href="?place=286237890">중앙도서관</a> · <a href="?place=471297909">경상대학1호관</a> · <a href="?place=471297922">경상대학2호관</a> · <a href="?place=471697621">학생회관(신관)</a></p><p><a href="./campus-survey.json" target="_blank" rel="noopener">교내 로드뷰 관찰 구간과 적용·추정 내역 ↗</a><br><a href="./odbl-provenance.json" target="_blank" rel="noopener">추가한 ODbL 공개 지도 데이터와 변환 기록 ↗</a><br><a href="./provenance.json" target="_blank" rel="noopener">지도 원자료와 변환 출처 ↗</a><br><a href="./reference-expansion.json" target="_blank" rel="noopener">확장한 참고자료와 건물 식별 정정 ↗</a><br><a href="./roadview-observation.json" target="_blank" rel="noopener">로드뷰 관찰 구간과 추정 치수 ↗</a><br><a href="./visual-references.json" target="_blank" rel="noopener">정문·박물관·구본관 사진 참고 기록 ↗</a><br><a href="./campus-data.json" download>사용한 지도 데이터 내려받기 ↗</a><br><a href="./presentation-notes.json" target="_blank" rel="noopener">시각적 표현과 한계 ↗</a></p><p class="privacy-note">© OpenStreetMap contributors · ODbL 1.0<br>Terrain Tiles / Mapzen, hosted on AWS. SRTM data courtesy of the U.S. Geological Survey.<br><a href="./terrain-data/terrain.json" target="_blank" rel="noopener">고도 자료 범위·해상도·출처 ↗</a><br>Three.js · MIT · Pretendard · SIL OFL 1.1 · <a href="./assets/materials/sources.json" target="_blank" rel="noopener">Poly Haven 재질 · CC0</a>. 숨결의 캠퍼스 산책 프로토타입이며, 대학 공식 서비스는 아닙니다. 도장은 이 브라우저에만 저장됩니다.</p>`);
  const stories=createStoryGame({scene,data,avatar,player,camera,groundAt,safePosition:safeWalkStart,canStand:navigable,focusStops,showDialog,clearInput,toast,mobile:mobileClient,reducedMotion:()=>reducedMotion.matches,onTalk:()=>hud.close(),onActivity:action=>{
    if(action.kind==='map'){hud.toggle('map');return;}
    if(action.kind==='photo'){
      const a=action.actor.position,dx=player.position.x-a[0],dz=player.position.z-a[1],span=Math.hypot(dx,dz);
      photoFocus=new THREE.Vector3((player.position.x+a[0])/2,(player.position.y+groundAt(...a))/2+1.05,(player.position.z+a[1])/2);
      walkYaw=Math.atan2(dx,dz)+Math.PI/2;walkPitch=.18;walkDistance=Math.max(7,span*(camera.aspect<.8?2.2:1.3));setPhoto(true);snapCamera();
    }
  }});
  const campusLife=createCampusLife({scene,data,avatar,groundAt,canStand:navigable,obstacles:campus.obstacles,cameraCollisionMeshes:campus.cameraCollisionMeshes,mobile:mobileClient,anchors:stories.metadata().anchors.map(a=>a.npc)});
  const boothAttendant=campusLife.takeBoothAttendant('student-hall');if(boothAttendant)stories.assignBoothActor('voice',boothAttendant);
  const hud=createCampusHud({mode:()=>mode,hasPlaceCard:()=>mode==='explore'&&!overview,clearInput});
  $('hudRecord').onclick=()=>{hud.close();stories.journal();};
  const visitKey='JejuCampusWalk.focus.visited.v1';
  let saved=[];try{saved=JSON.parse(localStorage.getItem(visitKey)||'[]');}catch{}
  const visited=new Set(Array.isArray(saved)?saved.filter(id=>places.some(p=>p.id===id)):[]);
  places.forEach((place,i)=>{const stamp=document.createElement('div');stamp.id='stamp'+i;stamp.className='stamp';stamp.innerHTML=`<span>${place.number}</span>${place.short}`;$('stamps').append(stamp);});
  function updateStamps(){$('homeVisitCount').textContent=visited.size+'곳을 걸었어요';$('homeVisitRatio').textContent=visited.size+' / 3';$('homeStamps').replaceChildren(...places.map(place=>{const item=document.createElement('span');item.className=visited.has(place.id)?'visited':'';item.textContent=(visited.has(place.id)?'✓ ':'')+place.short;return item;}));places.forEach((place,i)=>{const stamp=$('stamp'+i);stamp.classList.toggle('done',visited.has(place.id));stamp.querySelector('span').textContent=visited.has(place.id)?'✓':place.number;stamp.setAttribute('aria-label',place.short+(visited.has(place.id)?' 방문 완료':' 아직 방문하지 않음'));});$('visitCount').textContent=`${visited.size} / 3 장소 발견`;}
  updateStamps();
  function checkVisits(){if(mode!=='walk'||photoActive)return;places.forEach((place,i)=>{if(!visited.has(place.id)&&Math.hypot(player.position.x-focusLocations[i][0],player.position.z-focusLocations[i][1])<9){visited.add(place.id);try{localStorage.setItem(visitKey,JSON.stringify([...visited]));}catch{}updateStamps();}});}
  let photoActive=false,photoFocus=null;
  function setPhoto(value){photoActive=value;if(!value)photoFocus=null;hud.close();clearInput();document.body.dataset.photo=String(value);$('photoTools').hidden=!value;if(value)toast('드래그와 휠로 마음에 드는 장면을 담아보세요.');else $('world').focus({preventScroll:true});}
  $('photo').onclick=()=>{if(mode==='welcome')showPlace(0);setPhoto(true);};$('closePhoto').onclick=()=>setPhoto(false);
  $('capturePhoto').onclick=()=>{renderer.render(scene,camera);$('world').toBlob(blob=>{if(!blob){toast('사진을 저장하지 못했어요. 다시 시도해 주세요.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='숨결-캠퍼스-산책.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('캠퍼스 사진을 저장했어요.');},'image/png');};

  function jump(){if(mode==='walk'&&!photoActive&&!dialogOpen()&&grounded){verticalVelocity=7;grounded=false;jumpCount++;}}
  addEventListener('keydown',event=>{
    if(!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)&&!dialogOpen()){if(!event.repeat&&['KeyM','KeyL'].includes(event.code)&&mode!=='welcome'){event.preventDefault();hud.toggle(event.code==='KeyM'?'map':'places');return;}if(event.code==='KeyV'&&mode==='walk'&&!event.repeat){togglePerspective();return;}if(event.code==='KeyP'&&mode!=='welcome'){setPhoto(!photoActive);return;}if(event.code==='Escape'&&photoActive){setPhoto(false);return;}}
    if(mode!=='walk'||photoActive||dialogOpen()||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
    if(event.target!==$('world')&&event.target!==document.body)return;
    keys[event.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(event.code==='Space'&&!event.repeat)jump();if(event.code==='KeyR'&&!event.repeat)resetPlayer();
  });
  addEventListener('keyup',event=>keys[event.code]=false);addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{clearInput();clock.getDelta();});
  $('world').addEventListener('pointerdown',event=>{
    if(mode==='welcome'||dialogOpen())return;
    if(event.pointerType==='touch'&&mode==='walk'&&event.clientX<innerWidth*.44)return;
    if(event.pointerType==='touch')event.preventDefault();
    $('world').focus({preventScroll:true});pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});$('world').setPointerCapture(event.pointerId);
    if(pointers.size===1)drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);drag=null;}
  });
  $('world').addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;if(event.pointerType==='touch')event.preventDefault();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){const [a,b]=[...pointers.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance){const factor=pinchDistance/Math.max(next,1);if(mode==='walk')walkDistance=THREE.MathUtils.clamp(walkDistance*factor,7,38);else distance=THREE.MathUtils.clamp(distance*factor,overview?120:30,overview?1900:[125,270,150][selected]);}pinchDistance=next;return;}
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(mode==='walk'){walkYaw-=dx*.005;walkPitch=THREE.MathUtils.clamp(walkPitch+dy*.004,.14,1.15);}else{yaw-=dx*.005;pitch=THREE.MathUtils.clamp(pitch+dy*.004,.22,1.3);}
    drag.x=event.clientX;drag.y=event.clientY;
  });
  function endPointer(event){pointers.delete(event.pointerId);pinchDistance=null;if(drag?.id===event.pointerId)drag=null;}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(event,endPointer);
  $('world').addEventListener('wheel',event=>{if(mode==='welcome'||dialogOpen())return;event.preventDefault();if(mode==='walk')walkDistance=THREE.MathUtils.clamp(walkDistance+event.deltaY*.025,7,38);else distance=THREE.MathUtils.clamp(distance+event.deltaY*.07,overview?120:30,overview?1900:[125,270,150][selected]);},{passive:false});
  function joyMove(event){if(event.pointerId!==touchInput.state.movePointer)return;event.preventDefault();const rect=$('joystick').getBoundingClientRect(),radius=Math.max(25,(rect.width-$('knob').offsetWidth)/2-5),x=(event.clientX-rect.left-rect.width/2)/radius,y=(event.clientY-rect.top-rect.height/2)/radius;touchInput.move(event.pointerId,x,-y);syncTouch();const n=Math.hypot(x,y),clamp=n>1?1/n:1;$('knob').style.transform=`translate(${x*clamp*radius}px,${y*clamp*radius}px)`;}
  $('joystick').onpointerdown=event=>{if(mode!=='walk'||dialogOpen()||!touchInput.beginMove(event.pointerId))return;event.preventDefault();$('joystick').setPointerCapture(event.pointerId);joyMove(event);};$('joystick').onpointermove=joyMove;
  function releaseTouch(event){touchInput.end(event.pointerId);syncTouch();if(joystickPointer===null)$('knob').style.transform='';}
  for(const event of ['pointerup','pointercancel','lostpointercapture']){$('joystick').addEventListener(event,releaseTouch);$('run').addEventListener(event,releaseTouch);}
  document.addEventListener('pointerup',releaseTouch);document.addEventListener('pointercancel',releaseTouch);document.addEventListener('touchcancel',clearInput,{passive:true});
  addEventListener('pointerout',event=>{if(shouldClearPointerExit(event))clearInput();});
  $('jump').onpointerdown=event=>{event.preventDefault();if(mode==='walk'&&!dialogOpen())jump();};
  $('run').onclick=event=>{event.preventDefault();if(mode==='walk'&&!dialogOpen()){touchInput.toggleRun();syncTouch();}};
  $('joystick').addEventListener('pointerleave',event=>{if(!event.buttons)releaseTouch(event);});

  const map=$('minimap').getContext('2d'),mapBase=document.createElement('canvas');mapBase.width=440;mapBase.height=440;
  const mapData=campus.visibleData??data;
  const base=mapBase.getContext('2d'),bounds=campus.bounds,mapBounds={...campus.bounds},scale=402/Math.max(mapBounds.maxX-mapBounds.minX,mapBounds.maxZ-mapBounds.minZ);
  const mapWidth=(mapBounds.maxX-mapBounds.minX)*scale,mapHeight=(mapBounds.maxZ-mapBounds.minZ)*scale;
  function mapPoint(x,z){return[(440-mapWidth)/2+(x-mapBounds.minX)*scale,(440-mapHeight)/2+(z-mapBounds.minZ)*scale];}
  base.fillStyle='#edf0e1';base.fillRect(0,0,440,440);
  function mapPolygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>{const q=mapPoint(...p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.closePath();ctx.fill();}
  // Use the same corrected layout for the scene and the campus map.
  for(const area of mapData.areas)mapPolygon(base,area.points,area.tags.amenity==='parking'?'#b8c0bc':area.tags.natural==='water'?'#a5c4bf':'#bfceb0');
  base.strokeStyle='#f7f6ec';base.lineWidth=2.5;base.lineJoin='round';
  for(const road of data.roads){base.lineWidth=isWalkingRoad(road)?1:2.8;base.strokeStyle=isWalkingRoad(road)?'#e1d7bf':'#f7f6ec';base.beginPath();road.points.forEach((p,i)=>{const q=mapPoint(...p);if(i)base.lineTo(...q);else base.moveTo(...q);});base.stroke();}
  for(const b of mapData.buildings)mapPolygon(base,b.points,FOCUS_SCOPE.buildingIds.includes(b.id)?'#008dcc':'#b4bfb1');
  base.strokeStyle='#008dcc';base.lineWidth=3;base.globalAlpha=.7;
  for(const road of data.roads.filter(r=>FOCUS_SCOPE.roadIds.includes(r.id))){base.beginPath();road.points.forEach((p,i)=>{const q=mapPoint(...p);i?base.lineTo(...q):base.moveTo(...q);});base.stroke();}base.globalAlpha=1;
  base.fillStyle='#e8eeec';


  function drawMap(){
    if($('mapPanel').hidden||$('mapPanel').classList.contains('collapsed'))return;
    map.drawImage(mapBase,0,0);
    (mode==='walk'?focusLocations:locations).forEach((p,i)=>{const [x,y]=mapPoint(...p);map.fillStyle=i===selected?'#006a99':'#00bfff';map.strokeStyle='#fffcf1';map.lineWidth=3;map.beginPath();map.arc(x,y,i===selected?10:7,0,Math.PI*2);map.fill();map.stroke();map.font='600 11px sans-serif';map.fillStyle='#fffdf0';map.textAlign='center';map.fillText(String(i+1),x,y+4);});
    stories.drawMap(map,mapPoint);
    if(mode==='walk'){
      const [x,y]=mapPoint(player.position.x,player.position.z);map.save();map.translate(x,y);map.rotate(-walkYaw);map.fillStyle='#006a99';map.strokeStyle='#fffdf0';map.lineWidth=3;map.beginPath();map.moveTo(0,-10);map.lineTo(-7,8);map.lineTo(0,4);map.lineTo(7,8);map.closePath();map.fill();map.stroke();map.restore();
    }
  }
  function navigable(x,z){return walkArea.contains(x,z)&&walkable(x,z,campus.walkCollisionPolygons??data.buildings)&&!campus.obstacles.some(p=>Math.hypot(x-p[0],z-p[1])<p[2]+.4);}
  function updatePlayer(dt){
    if(mode!=='walk')return;const active=!dialogOpen()&&!photoActive;
    let fx=active?Number(!!(keys.KeyD||keys.ArrowRight))-Number(!!(keys.KeyA||keys.ArrowLeft))+touchX:0;
    let fz=active?Number(!!(keys.KeyW||keys.ArrowUp))-Number(!!(keys.KeyS||keys.ArrowDown))+touchY:0;
    const length=Math.hypot(fx,fz);if(length>1){fx/=length;fz/=length;}const moving=length>.08;
    const speed=walkSpeed({touch:joystickPointer!==null,running:joystickPointer!==null?runTouch:!!(keys.ShiftLeft||keys.ShiftRight)});
    const targetX=moving?(fx*Math.cos(walkYaw)-fz*Math.sin(walkYaw))*speed:0;
    const targetZ=moving?(-fx*Math.sin(walkYaw)-fz*Math.cos(walkYaw))*speed:0;
    const motion=advancePlanarMotion({x:velocityX,z:velocityZ},{x:targetX,z:targetZ},dt,moving);velocityX=motion.x;velocityZ=motion.z;
    const substeps=Math.max(1,Math.ceil(Math.hypot(motion.dx,motion.dz)/.3));
    for(let i=0;i<substeps;i++){
      const previousX=player.position.x,previousZ=player.position.z;
      const nx=THREE.MathUtils.clamp(player.position.x+motion.dx/substeps,bounds.minX+.56,bounds.maxX-.56),nz=THREE.MathUtils.clamp(player.position.z+motion.dz/substeps,bounds.minZ+.56,bounds.maxZ-.56);
      if(navigable(nx,player.position.z))player.position.x=nx;else if(Math.abs(nx-previousX)>.0001)blockedMoves++;
      if(navigable(player.position.x,nz))player.position.z=nz;else if(Math.abs(nz-previousZ)>.0001)blockedMoves++;
      totalWalked+=Math.hypot(player.position.x-previousX,player.position.z-previousZ);
    }
    const carry=active&&grounded&&campus.conveyorAt?.(player.position.x,player.position.z);if(carry){const x=player.position.x+carry.x*dt,z=player.position.z+carry.z*dt;if(navigable(x,z)){player.position.x=x;player.position.z=z;}}
    const actualSpeed=Math.hypot(velocityX,velocityZ);walkCycle+=actualSpeed*dt*1.5;
    if(actualSpeed>.15){const target=Math.atan2(velocityX,velocityZ);const diff=Math.atan2(Math.sin(target-body.rotation.y),Math.cos(target-body.rotation.y));body.rotation.y+=diff*(1-Math.exp(-14*dt));}
    avatar.update?.(dt,{speed:actualSpeed,grounded,verticalVelocity,reducedMotion:reducedMotion.matches});
    const stride=Math.min(1,actualSpeed/7);legs.forEach((leg,i)=>leg.rotation.x=Math.sin(walkCycle+i*Math.PI)*.58*stride);arms.forEach((arm,i)=>arm.rotation.x=-Math.sin(walkCycle+i*Math.PI)*.42*stride);
    body.position.y=reducedMotion.matches?0:Math.abs(Math.sin(walkCycle))*.055*stride;
    const floor=groundAt(player.position.x,player.position.z);
    const vertical=advanceVertical({y:player.position.y,velocity:verticalVelocity,grounded},floor,dt);
    player.position.y=vertical.y;verticalVelocity=vertical.velocity;grounded=vertical.grounded;
    maxJumpClearance=Math.max(maxJumpClearance,player.position.y-floor);
    avatar.shadow.position.y=(floor-player.position.y)/player.scale.y+.025;
    const n=campus.terrain?.normalAt(player.position.x,player.position.z);
    if(n){groundNormal.set(n[0]??n.x,n[1]??n.y,n[2]??n.z);avatar.shadow.quaternion.setFromUnitVectors(shadowNormal,groundNormal.normalize());}
  }
  let instantCamera=reducedMotion.matches;
  function cameraGoal(){
    const conversation=mode==='walk'?stories.cameraFrame():null;
    if(conversation){desiredCamera.fromArray(conversation.position);desiredFocus.fromArray(conversation.target);return;}
    if(photoActive&&photoFocus){
      desiredFocus.copy(photoFocus);desiredCamera.copy(photoFocus).add(new THREE.Vector3(Math.sin(walkYaw)*Math.cos(walkPitch)*walkDistance,Math.sin(walkPitch)*walkDistance,Math.cos(walkYaw)*Math.cos(walkPitch)*walkDistance));
      desiredCamera.y=Math.max(desiredCamera.y,groundAt(desiredCamera.x,desiredCamera.z)+.8);body.rotation.y=Math.atan2(desiredCamera.x-player.position.x,desiredCamera.z-player.position.z);return;
    }
    if(mode==='welcome'){
      desiredFocus.set(-25,terrainAt(-25,-395)+4,-395);
      const angle=-.62+(reducedMotion.matches||instantCamera?0:Math.sin(elapsed*.045)*.08);
      const introDistance=205*Math.min(1.5,Math.max(1,1.05/camera.aspect));
      desiredCamera.set(desiredFocus.x+Math.sin(angle)*introDistance,desiredFocus.y+introDistance*.59,desiredFocus.z-Math.cos(angle)*introDistance);
    }else if(mode==='explore'){
      const responsiveDistance=distance*Math.min(2.5,Math.max(1,1.25/camera.aspect));
      const p=overview?(studentReview?[-124,-29]:lawnReview?[-28,-170]:[-70,-170]):museumReview&&selected===0?[-26,-418]:studentFrontReview&&selected===2?[-117.4,-13.7]:locations[selected];desiredFocus.set(p[0],terrainAt(...p)+(overview?0:museumReview&&selected===0?3.5:studentFrontReview&&selected===2?3.5:selected===1?5:1.5),p[1]);
      desiredCamera.copy(desiredFocus).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*responsiveDistance,Math.sin(pitch)*responsiveDistance,-Math.cos(yaw)*Math.cos(pitch)*responsiveDistance));
    }else{
      if(firstPerson){desiredCamera.copy(player.position);desiredCamera.y+=1.65;desiredFocus.copy(desiredCamera).add(new THREE.Vector3(-Math.sin(walkYaw)*10,-Math.sin(walkPitch-.16)*10,-Math.cos(walkYaw)*10));return;}
      desiredFocus.copy(player.position);desiredFocus.y+=1.45;
      cameraDirection.set(Math.sin(walkYaw)*Math.cos(walkPitch),Math.sin(walkPitch),Math.cos(walkYaw)*Math.cos(walkPitch));
      raycaster.set(desiredFocus,cameraDirection);raycaster.far=walkDistance;const hit=raycaster.intersectObjects(campus.cameraCollisionMeshes??campus.collisionMeshes,false)[0];
      const buildingDistance=hit?Math.max(2,hit.distance-.9):walkDistance;
      const allowed=terrainCameraDistance(desiredFocus,cameraDirection,buildingDistance,groundAt);desiredCamera.copy(desiredFocus).addScaledVector(cameraDirection,allowed);
      desiredCamera.y=Math.max(groundAt(desiredCamera.x,desiredCamera.z)+.65,desiredCamera.y);
    }
  }
  function snapCamera(){cameraGoal();camera.position.copy(desiredCamera);currentFocus.copy(desiredFocus);camera.lookAt(currentFocus);}
  function resize(){
    document.body.dataset.touch=String(touchLayout());
    camera.near=overview?40:mode==='walk'?.12:3;camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);
    if(mode==='walk'||overview){camera.clearViewOffset();}else if(innerWidth<761){camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*(mode==='welcome'?.23:.18),innerWidth,innerHeight);}else{camera.setViewOffset(innerWidth,innerHeight,-innerWidth*(mode==='welcome'?.16:.12),0,innerWidth,innerHeight);}
    camera.updateProjectionMatrix();
  }
  addEventListener('resize',()=>{clearInput();resize();});
  $('world').addEventListener('webglcontextlost',event=>{event.preventDefault();$('errorMessage').textContent='그래픽 연결이 잠시 끊어졌어요. 다시 시도하기를 눌러 주세요.';$('error').hidden=false;clearInput();});
  $('world').addEventListener('webglcontextrestored',()=>location.reload());
  const projection=new THREE.Vector3();
  function updatePins(){
    pins.forEach((pin,i)=>{
      if(overview||mode==='welcome'||mode==='walk'){pin.hidden=true;return;}
      const p=mode==='walk'?focusLocations[i]:locations[i];projection.set(p[0],terrainAt(...p)+(mode==='walk'?3.7:i===1?24:7),p[1]);const dist=camera.position.distanceTo(projection);projection.project(camera);
      const x=(projection.x*.5+.5)*innerWidth,y=(-projection.y*.5+.5)*innerHeight;
      const covered=innerWidth<761&&mode==='explore'&&y>innerHeight*.52;
      pin.hidden=projection.z>1||projection.z< -1||x<30||x>innerWidth-40||y<80||y>innerHeight-110||dist>500||covered;
      if(!pin.hidden)pin.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;
    });
  }
  const multiplayer=createMultiplayerScene({scene,avatar,player,camera,mobile:mobileClient});
  function tick(){
    requestAnimationFrame(tick);const rawDelta=clock.getDelta(),dt=simulationDelta(rawDelta);frameDuration=frameDuration*.95+Math.min(rawDelta,.25)*50;
    if(document.hidden||$('error').hidden===false)return;
    elapsed+=dt;campus.updateTransport?.(dt);updatePlayer(dt);multiplayer.update(dt,{mode,grounded});checkVisits();stories.update(dt,{mode,photo:photoActive,elapsed});campusLife.update(dt,{mode,focus:mode==='walk'?player.position:currentFocus,player:player.position});player.visible=mode==='walk'&&!stories.isTalking();cameraGoal();
    const blend=instantCamera?1:1-Math.exp(-(stories.isTalking()?5.5:mode==='walk'?9:3.5)*dt);
    camera.position.lerp(desiredCamera,blend);if(mode==='walk')camera.position.y=Math.max(camera.position.y,groundAt(camera.position.x,camera.position.z)+.45);currentFocus.lerp(desiredFocus,blend);camera.lookAt(currentFocus);
    sky.position.copy(camera.position);skyUniforms.top.value.lerp(night?skyNightTop:skyDayTop,1-Math.exp(-dt*2));skyUniforms.bottom.value.lerp(night?skyNightBottom:skyDayBottom,1-Math.exp(-dt*2));
    scene.background.lerp(night?colors.night:colors.day,1-Math.exp(-dt*2));scene.fog.color.copy(scene.background);scene.fog.near=overview?1600:mode==='explore'?350:190;scene.fog.far=overview?3600:mode==='explore'?1700:1100;
    const lightBlend=1-Math.exp(-dt*2);sun.intensity+=((night?.35:2.0)-sun.intensity)*lightBlend;ambient.intensity+=((night?.7:1.65)-ambient.intensity)*lightBlend;
    const anchor=graphics.staticShadows?shadowAnchor.set(Math.round(currentFocus.x/48)*48,Math.round(currentFocus.y/16)*16,Math.round(currentFocus.z/48)*48):currentFocus;
    const lightScale=overview?3.5:1;sun.position.set(anchor.x-100*lightScale,anchor.y+160*lightScale,anchor.z-70*lightScale);sun.target.position.copy(anchor);
    if(graphics.staticShadows){const key=[anchor.x,anchor.y,anchor.z].join(',');if(key!==shadowCell){renderer.shadowMap.needsUpdate=true;shadowCell=key;shadowRefreshes++;}}
    mobileQualityElapsed+=dt;if(mobileClient&&quality==='balanced'&&mobileQualityElapsed>=2){mobileQualityElapsed=0;if(frameDuration>45&&renderer.getPixelRatio()>.75){graphics.pixelRatio=Math.max(.75,renderer.getPixelRatio()-.1);renderer.setPixelRatio(graphics.pixelRatio);renderer.setSize(innerWidth,innerHeight);}}
    mapElapsed+=dt;if(mapElapsed>.1){drawMap();mapElapsed=0;if(mode==='walk'){let nearest=0;for(let i=1;i<focusLocations.length;i++)if(Math.hypot(player.position.x-focusLocations[i][0],player.position.z-focusLocations[i][1])<Math.hypot(player.position.x-focusLocations[nearest][0],player.position.z-focusLocations[nearest][1]))nearest=i;const named=data.buildings.filter(b=>b.name).reduce((best,b)=>{const d=Math.hypot(player.position.x-b.center[0],player.position.z-b.center[1]);return d<best.distance?{building:b,distance:d}:best;},{building:null,distance:55});$('nearPlace').textContent=focusZoneLabel(player.position.x,player.position.z)??(named.building?named.building.name+' 주변':places[nearest].place);}}
    visitMarkers.forEach((marker,i)=>{marker.visible=false;marker.children[0].material.color.set(visited.has(places[i].id)?'#66e1ff':'#00bfff');});
    reflections.update(mode==='walk'?player.position.x:currentFocus.x,mode==='walk'?player.position.z:currentFocus.z,{night,quality,dt});
    updatePins();renderer.render(scene,camera);frame++;
    if(frame%30===0){$('world').dataset.verification=JSON.stringify({version:'campus-screen-r50',hud:hud.metadata(),multiplayer:multiplayer.metadata(),campusLife:campusLife.metadata(),stories:stories.metadata(),museumForecourt:campus.museumForecourt,studentGarden:campus.studentGarden,cacheRevision:'screen-r50',meadowAppearance:'original-green-terrain-with-perimeter-trees-r34',satelliteLayout:data.satelliteLayout,sports:campus.sports,focusAreas:places.map(p=>p.id),selectedPlace:places[selected].id,areaCount:data.areas.length,parkingCount:data.areas.filter(a=>a.tags.amenity==='parking').length,mode,overview,perspective:firstPerson?'first':'third',position:player.position.toArray(),ground:groundAt(player.position.x,player.position.z),grounded,verticalVelocity,walked:totalWalked,jumps:jumpCount,maxJumpClearance,blockedMoves,camera:camera.position.toArray(),buildingCount:data.buildings.length,renderedBuildingIds:campus.renderedBuildingIds,renderedBuildingCount:campus.renderedBuildingIds.length,roadCount:data.roads.length,vehicleRoadCount:data.roads.filter(r=>!isWalkingRoad(r)).length,entrance:campus.observedEntrance,aerialBuildings:campus.aerialBuildingStats,aerialLandscape:campus.aerialLandscape,performance:{mobile:mobileClient,pixelRatio:renderer.getPixelRatio(),staticShadows:graphics.staticShadows,shadowSize:graphics.shadowSize,shadowRefreshes,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,batching:campus.mobileBatching},vegetationCounts:campus.vegetationStats.counts,roadClearance:campus.environmentStats.roadClearance,roadAlignment:data.renderRoadCorrections,avatar:avatar.metadata,touch:{layout:touchLayout(),movementHeld:joystickPointer!==null,runHeld:runTouch,cameraPointers:pointers.size},movement:{phoneWalk:9,phoneRun:20,speed:Math.hypot(velocityX,velocityZ)},walkArea:{restricted:false,boundaryVisible:false,inside:walkArea.contains(player.position.x,player.position.z)},surveyDetails:campus.observedDetails,periphery:campus.periphery,reflections:reflections.stats,focusDetails:campus.focusDetails,grading:campus.terrain?.metadata?.localObservedGrading,openData:data.openDataIntegration?.source??null,terrain:campus.terrain?.metadata?.source??'AWS Terrain Tiles',webgl:renderer.capabilities.isWebGL2?'WebGL2':'WebGL'});$('world').dataset.renderedFrames=String(frame);$('world').dataset.fps=(1000/frameDuration).toFixed(1);$('world').dataset.treeCount=String(campus.treeCount);$('world').dataset.drawCalls=String(renderer.info.render.calls);$('world').dataset.playerPosition=[player.position.x.toFixed(2),player.position.y.toFixed(2),player.position.z.toFixed(2)].join(',');}
  }
  if(new URLSearchParams(location.search).get('inspect')==='1'){$('world').addEventListener('pointerdown',e=>{if(!e.altKey)return;const rect=$('world').getBoundingClientRect(),picker=new THREE.Raycaster();picker.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=picker.intersectObjects(scene.children,true)[0];$('world').dataset.surfaceHit=JSON.stringify(hit?{name:hit.object.name,material:hit.object.material.name,color:hit.object.material.color?.getHexString(),position:hit.point.toArray()}:null);});}
  const reflections=createCampusReflections({renderer,scene,lightweight:mobileClient,heightAt:groundAt,anchors:[{name:'gate',position:campus.entrySpawn??data.spawn},{name:'economics',position:[-44,87.6]},{name:'library',position:[-104,224]},{name:'student-hall',position:[-87.8,-21]}],hidden:[player,...visitMarkers]});
  resize();snapCamera();tick();
  $('navPlaces').disabled=false;$('navWalk').disabled=false;
  $('loadLabel').textContent='산책 시작하기';$('explore').disabled=false;$('walkIntro').disabled=false;buttons.forEach(b=>b.disabled=false);document.body.dataset.ready='true';
  // Enter the world immediately; the card screen is an optional menu.
  startWalk();
  if(museumReview){showPlace(0);$('explorer').hidden=true;yaw=-Math.PI/2;pitch=.045;distance=48;snapCamera();}
  if(studentFrontReview){showPlace(2);yaw=.82;pitch=.055;distance=52;snapCamera();}
  if(lawnReview){$('campusOverview').click();distance=studentReview?150:285;snapCamera();}
  if(new URLSearchParams(location.search).get('view')==='outfit'){walkDistance=3;walkPitch=.17;snapCamera();}
  const review=new URLSearchParams(location.search).get('view');
  if(review==='campus-photo'){const a=stories.metadata().anchors.find(a=>a.id==='campus-photo');if(a){const p=safeWalkStart([a.npc[0]+2.8,a.npc[1]]);if(p){player.position.set(p[0],groundAt(...p),p[1]);walkYaw=Math.PI/2;walkDistance=7;walkPitch=.2;snapCamera();}}}
  if(review==='bookcamp'){const a=stories.metadata().anchors.find(a=>a.id==='bookcamp');if(a){const p=safeWalkStart([a.npc[0]+3,a.npc[1]]);if(p){player.position.set(p[0],groundAt(...p),p[1]);walkYaw=Math.PI/2;walkDistance=8;walkPitch=.2;snapCamera();}}}
  if(review==='escalator-top'){const p=safeWalkStart([-105.6,203.3]);if(p){player.position.set(p[0],groundAt(...p),p[1]);walkYaw=-.195;walkDistance=7;walkPitch=.36;snapCamera();}}
  if(review==='bench'){const p=safeWalkStart([-114.5,-27]);if(p){player.position.set(p[0],groundAt(...p),p[1]);walkYaw=Math.PI/2;walkDistance=4;walkPitch=.50;firstPerson=true;body.visible=false;avatar.shadow.visible=false;snapCamera();}}
  if(review==='escalator'||review==='booth'){const p=review==='escalator'?[-110.8,114]:boothAttendant?.front;if(p){player.position.set(p[0],groundAt(...p),p[1]);walkYaw=review==='escalator'?Math.PI:Math.PI/2;walkDistance=review==='escalator'?9:5.5;walkPitch=.20;snapCamera();}}
 if(review==='avenue'||review==='gate'){const z=review==='avenue'?-205:data.spawn[1]+88,main=data.roads.find(r=>r.id==='286085067');let x=data.spawn[0];for(let i=1;i<main.points.length;i++){const a=main.points[i-1],b=main.points[i];if(z>=Math.min(a[1],b[1])&&z<=Math.max(a[1],b[1])){x=a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]);break;}}const p=safeWalkStart([x+(review==='gate'?4.5:0),z]);if(p){player.position.set(p[0],groundAt(...p),p[1]);walkYaw=review==='avenue'?Math.PI:0;walkPitch=.34;walkDistance=mobileClient?10:38;snapCamera();}}
}
