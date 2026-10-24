import * as THREE from './three.module.js';
import { createCampus, makeAvatar } from './world.js?v=campus-r18';
import {isWalkingRoad} from './road-profile.js?v=campus-r18';
import { places } from './places.js?v=campus-r18';
import { walkable, safePosition } from './navigation.js';
import { advanceVertical, terrainCameraDistance } from './movement.js?v=campus-r18';

const $=id=>document.getElementById(id);
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
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.35:1.6));
  renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const response=await fetch('./campus-data.json?v=odbl-20261024-r15',{cache:'no-store'});
  if(!response.ok)throw Error('Map data could not be loaded');
  const data=await response.json();
  const linkedId=new URLSearchParams(location.search).get('place'),linkedBuilding=data.buildings.find(b=>b.id===linkedId);
  let linkedWalkPending=Boolean(linkedBuilding);
  function linkedWalkStart(){
    if(!linkedWalkPending||!linkedBuilding)return null;linkedWalkPending=false;const b=linkedBuilding,side=['953564621','953546804'].includes(b.id)?'south':['741724817','964181122','471697621'].includes(b.id)?'east':'north';
    const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);return {position:side==='east'?[Math.max(...xs)+13,b.center[1]]:[(Math.min(...xs)+Math.max(...xs))/2,side==='south'?Math.max(...zs)+13:Math.min(...zs)-13],yaw:side==='east'?Math.PI/2:side==='south'?0:Math.PI};
  }
  const scene=new THREE.Scene();scene.background=new THREE.Color('#c5d8e5');scene.fog=new THREE.Fog('#c5d8e5',220,1300);
  const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.12,2600);
  const ambient=new THREE.HemisphereLight('#d5e7f6','#817b6f',1.4);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff2dc',2.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:550});sun.shadow.normalBias=.035;sun.shadow.bias=-.00008;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#d0e1f0',.25);fill.position.set(100,80,-50);scene.add(fill);
  const campus=await createCampus(scene,data),avatar=makeAvatar(scene);$('loadingStatus').textContent='빛과 그림자를 준비하고 있어요.';
  const {player,body,legs,arms}=avatar;player.visible=false;
  const groundAt=(x,z)=>(campus.walkHeightAt??campus.heightAt)(x,z);
  const terrainAt=(x,z)=>campus.heightAt(x,z);
  let grounded=true,totalWalked=0,jumpCount=0,maxJumpClearance=0,blockedMoves=0;
  const groundNormal=new THREE.Vector3(),shadowNormal=new THREE.Vector3(0,0,1);
  const skyUniforms={top:{value:new THREE.Color('#6b9ec8')},bottom:{value:new THREE.Color('#d7e3e8')},sunDirection:{value:new THREE.Vector3(-.5,.65,-.4).normalize()}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(2100,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDirection;
uniform vec3 top;uniform vec3 bottom;uniform vec3 sunDirection;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(23.7,9.2);a*=.5;}return v;}
void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.06,.65,d.y);vec3 c=mix(bottom,top,h);float glow=pow(max(dot(d,sunDirection),0.),160.);c+=vec3(.65,.55,.38)*glow;
vec2 cloudUV=d.xz/max(d.y+.16,.04)*1.4;float cloud=fbm(cloudUV);float shape=smoothstep(.52,.74,cloud)*smoothstep(.04,.22,d.y);c=mix(c,vec3(.94,.96,.97),shape*.7);
gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));
  sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);
  const skyDayTop=new THREE.Color('#6b9ec8'),skyDayBottom=new THREE.Color('#d7e3e8'),skyNightTop=new THREE.Color('#23394b'),skyNightBottom=new THREE.Color('#8f9294');

  const locations=[data.landmarks[0].position,data.landmarks[1].buildingCenter,data.landmarks[2].buildingCenter];
  const focusLocations=[data.landmarks[0].position,data.landmarks[1].position,data.landmarks[2].position];
  const visitMarkers=focusLocations.map((p,i)=>{const group=new THREE.Group();group.position.set(p[0],groundAt(p[0],p[1])+.04,p[1]);const ring=new THREE.Mesh(new THREE.RingGeometry(2.5,2.7,48),new THREE.MeshBasicMaterial({color:'#00bfff',transparent:true,opacity:.8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;group.add(ring);scene.add(group);group.visible=false;return group;});
  const cameras=[{yaw:.62,radius:79,pitch:.64},{yaw:-.8,radius:100,pitch:.57},{yaw:2.7,radius:165,pitch:.62}];
  $('navPlaces').disabled=true;$('navWalk').disabled=true;
  let mode='welcome',selected=0,night=false,elapsed=0,quality='balanced';
  let yaw=.62,pitch=.64,distance=79,walkYaw=Math.PI,walkPitch=.16,walkDistance=14,verticalVelocity=0;
  let firstPerson=false,frameDuration=16.7;
  let velocityX=0,velocityZ=0,touchX=0,touchY=0,runTouch=false,walkCycle=0;
  let drag=null,joystickPointer=null,frame=0,mapElapsed=0;
  const pointers=new Map();let pinchDistance=null;
  const keys={},cameraFocus=new THREE.Vector3(-30,0,-419),desiredFocus=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),cameraDirection=new THREE.Vector3(),currentFocus=cameraFocus.clone();
  const raycaster=new THREE.Raycaster();
  const clock=new THREE.Clock();
  const buttons=[];let lastDialogTrigger=null;
  const colors={day:new THREE.Color('#c5d8e5'),night:new THREE.Color('#354d60')};
  const pins=places.map((place,i)=>{
    const pin=document.createElement('button');pin.className='hotspot';pin.innerHTML=`<span>${place.number}</span>${place.short}`;pin.setAttribute('aria-label',`${place.short} 둘러보기`);pin.onclick=()=>showPlace(i);$('hotspots').append(pin);return pin;
  });
  places.forEach((place,i)=>{
    const card=document.createElement('button');card.className='intro-card';card.disabled=true;card.innerHTML=`<span class="intro-number">${place.number}</span><span><b>${place.short}</b><small>${['산책의 첫 장면','자줏빛 벽 너머의 풍경','익숙한 길을 따라'][i]}</small></span><span class="card-arrow">↗</span>`;card.onclick=()=>showPlace(i);$('introCards').append(card);buttons.push(card);
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
  function clearInput(){for(const key of Object.keys(keys))keys[key]=false;touchX=touchY=0;runTouch=false;velocityX=velocityZ=0;drag=null;joystickPointer=null;pointers.clear();pinchDistance=null;$('knob').style.transform='';}
  function setMode(next){
    mode=next;document.body.dataset.mode=mode;clearInput();
    $('welcome').hidden=mode!=='welcome';$('explorer').hidden=mode!=='explore';$('walking').hidden=mode!=='walk';
    for(const id of ['mapPanel','dock','sceneCaption'])$(id).hidden=mode==='welcome';
    $('touch').hidden=mode!=='walk';$('walkKeys').hidden=mode!=='walk';player.visible=mode==='walk';
    $('mapLegend').textContent=mode==='walk'?'내 위치':'살펴보는 장소';
    $('walkToggle').setAttribute('aria-pressed',String(mode==='walk'));
    body.visible=!firstPerson;avatar.shadow.visible=!firstPerson;resize();
  }
  function setNight(value){night=value;$('time').setAttribute('aria-pressed',String(night));$('timeLabel').textContent=night?'저녁':'오후';$('sceneLabel').textContent=night?'저녁빛 아라캠퍼스':'오후의 아라캠퍼스';}
  function showPlace(index){
    selected=(index+places.length)%places.length;const place=places[selected];setMode('explore');
    yaw=cameras[selected].yaw;pitch=cameras[selected].pitch;distance=cameras[selected].radius;
    $('placeCategory').textContent=place.category;$('placeNumber').textContent=place.number;$('placeTitle').textContent=place.title;
    $('placePlace').textContent=place.place;$('placeQuestion').textContent=place.question;$('placeIdea').textContent=place.description;
    $('visualNote').textContent=place.note;$('placeChecks').textContent=place.detail;$('placeCounter').innerHTML=`${place.number} <span>/ 03</span>`;
    $('placeCard').scrollTop=0;$('placeCard').querySelector('details').open=false;
    [...$('placeTabs').children].forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===selected));tab.tabIndex=i===selected?0:-1;});
    pins.forEach((pin,i)=>pin.setAttribute('aria-current',String(i===selected)));
    snapCamera();
  }
  function startWalk(){
    if(mode==='welcome')selected=0;
    const linked=linkedWalkStart();
    const start=linked?.position??((mode==='welcome'||selected===0)?(campus.entrySpawn??data.spawn):focusLocations[selected]);
    const position=safePosition(start,data.buildings);
    if(!position){toast('이 위치에서는 시작할 수 없어요. 정문에서 시작합니다.');player.position.set(data.spawn[0],groundAt(...data.spawn),data.spawn[1]);}else player.position.set(position[0],groundAt(...position),position[1]);
    walkYaw=linked?.yaw??(selected===1?Math.PI/2:selected===2?-Math.PI/2:Math.PI);body.rotation.y=Math.atan2(-Math.sin(walkYaw),-Math.cos(walkYaw));walkPitch=.16;walkDistance=14;verticalVelocity=0;grounded=true;setMode('walk');snapCamera();$('world').focus({preventScroll:true});
    toast(matchMedia('(pointer: coarse)').matches?'왼쪽 조이스틱으로 이동하고 화면을 드래그해 보세요.':'WASD 이동 · 화면 드래그 · V로 1인칭 전환');
  }
  function resetPlayer(){const entry=campus.entrySpawn??data.spawn;const p=safePosition(entry,data.buildings)??entry;player.position.set(p[0],groundAt(...p),p[1]);verticalVelocity=0;grounded=true;clearInput();walkYaw=Math.PI;body.rotation.y=0;toast('정문으로 돌아왔어요.');}
  function goHome(){setMode('welcome');setNight(false);snapCamera();}
  $('explore').onclick=startWalk;$('walkIntro').onclick=()=>showPlace(0);$('walkHere').onclick=startWalk;$('walkToggle').onclick=()=>mode==='walk'?showPlace(selected):startWalk();
  $('backToIdeas').onclick=()=>showPlace(selected);$('previous').onclick=()=>showPlace(selected-1);$('next').onclick=()=>showPlace(selected+1);
  $('navHome').onclick=()=>{$('welcome').scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});};$('navPlaces').onclick=()=>showPlace(0);$('navWalk').onclick=startWalk;$('homeHelp').onclick=()=>$('help').click();
  $('home').onclick=goHome;$('back').onclick=goHome;$('time').onclick=()=>setNight(!night);
  function togglePerspective(){firstPerson=!firstPerson;body.visible=!firstPerson;avatar.shadow.visible=!firstPerson;$('perspective').textContent=firstPerson?'3인칭':'1인칭';$('perspective').setAttribute('aria-label',firstPerson?'3인칭 시점으로':'1인칭 시점으로');if(mode!=='walk')startWalk();snapCamera();}
  $('perspective').onclick=togglePerspective;
  $('mapToggle').onclick=()=>{const collapsed=$('mapPanel').classList.toggle('collapsed');$('mapToggle').textContent=collapsed?'+':'−';$('mapToggle').setAttribute('aria-expanded',String(!collapsed));$('mapToggle').setAttribute('aria-label',collapsed?'지도 펼치기':'지도 접기');};

  function showDialog(title,html){lastDialogTrigger=document.activeElement;clearInput();$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialog').showModal();}
  $('closeDialog').onclick=()=>$('dialog').close();$('dialog').addEventListener('close',()=>{clearInput();if(lastDialogTrigger?.isConnected)lastDialogTrigger.focus({preventScroll:true});});
  $('help').onclick=()=>showDialog('가볍게, 자유롭게 걸어요.',`<p>정문에서 시작해 캠퍼스를 자유롭게 걸어보세요. 세 장소의 도장 지점 가까이 가면 산책 기록이 자동 저장됩니다. 아래 장소 버튼을 누르면 그곳을 둘러보거나 근처에서 걷기를 시작할 수 있습니다.</p><div class="key-row"><span>시점 회전</span><kbd>화면 드래그</kbd></div><div class="key-row"><span>확대 · 축소</span><kbd>휠 / 두 손가락</kbd></div><div class="key-row"><span>걷기</span><kbd>W A S D / 방향키</kbd></div><div class="key-row"><span>달리기 · 점프</span><kbd>Shift · Space</kbd></div><div class="key-row"><span>정문으로 돌아가기</span><kbd>R</kbd></div><div class="key-row"><span>사진 모드 / 돌아가기</span><kbd>P / Esc</kbd></div><p>휴대폰에서는 왼쪽 조이스틱으로 이동하고, 화면 오른쪽을 드래그해 시점을 회전하세요. 도장은 이 브라우저에만 저장됩니다.</p>`);
  $('settings').onclick=()=>{
    showDialog('나에게 맞는 화면',`<label for="quality">그래픽 품질</label><select id="quality"><option value="balanced">균형 · 기본 설정</option><option value="high">높음 · 선명한 그림자</option><option value="low">가볍게 · 그림자 끄기</option></select><p>화면이 느리면 ‘가볍게’를 선택해 주세요. 데이터나 지도 배치는 바뀌지 않습니다.</p><label><input id="gentle" type="checkbox" style="width:auto;margin-right:8px"> 카메라 전환을 즉시 적용</label><p class="privacy-note">운영체제의 동작 줄이기 설정도 따릅니다.</p>`);
    $('quality').value=quality;$('gentle').checked=instantCamera;$('gentle').onchange=()=>{instantCamera=$('gentle').checked;};
    $('quality').onchange=()=>{quality=$('quality').value;renderer.setPixelRatio(quality==='low'?1:Math.min(devicePixelRatio,quality==='high'?2:1.6));renderer.shadowMap.enabled=quality!=='low';sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}scene.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.needsUpdate=true);}});resize();};
  };
  $('about').onclick=()=>showDialog('숨결에서 만나는 우리 캠퍼스',`<p>OpenStreetMap의 아라캠퍼스 경계와 <b>건물 59개, 도로·보행로 91개, 구역 35개</b>를 원래 좌표로 표시합니다. 정문·박물관과 대학본부·중앙도서관·학생회관·법학전문대학원·음악관·체육관은 사진·캠퍼스 안내도를 대조한 단순화 모델입니다. 사진 시점과 다른 현재 상태 및 미관찰 면은 추정입니다.</p><p>나무·일반 건물의 창·도로 폭은 시각적 재구성입니다. 정문은2026년3월 촬영 카카오 로드뷰를 직접 이동·회전하며 관찰해 도로 옆 경비실, 중앙 차량관리 부스, 곡선 지붕과 볼라드·낮은 식재를 재구성했습니다. 개별 위치와 치수는 측량값이 아닙니다. 사진 기반 표면 재질은 제주 현장 자체를 촬영한 것은 아닙니다. 지형은 공개 AWS Terrain Tiles의 SRTM 기반 약 30m 고도 자료를 사용합니다. 운동장과 도서관·공학관 마당에는 로드뷰에서 확인한 형태를 표현하기 위한 국소 정지면을 보정했으며, 그 높이와 전이 경사는 실측값이 아닙니다. 약 4m 타일 픽셀과 삼각형 보간이 현장 정밀도를 높이지는 않습니다. 보도·계단의 실측 고도는 아니며, 도로 폭과 미기록 건물 높이는 추정입니다.</p><p>바로 걸어보기: <a href="?place=286237890">중앙도서관</a> · <a href="?place=953564621">디지털도서관</a> · <a href="?place=953546804">공과대학1호관</a> · <a href="?place=741724817">생활관3호관</a> · <a href="?place=964181122">생활관6호관F동</a></p><p><a href="./campus-survey.json" target="_blank" rel="noopener">교내 로드뷰 관찰 구간과 적용·추정 내역 ↗</a><br><a href="./odbl-provenance.json" target="_blank" rel="noopener">추가한 ODbL 공개 지도 데이터와 변환 기록 ↗</a><br><a href="./provenance.json" target="_blank" rel="noopener">지도 원자료와 변환 출처 ↗</a><br><a href="./reference-expansion.json" target="_blank" rel="noopener">확장한 참고자료와 건물 식별 정정 ↗</a><br><a href="./roadview-observation.json" target="_blank" rel="noopener">로드뷰 관찰 구간과 추정 치수 ↗</a><br><a href="./visual-references.json" target="_blank" rel="noopener">정문·박물관·구본관 사진 참고 기록 ↗</a><br><a href="./campus-data.json" download>사용한 지도 데이터 내려받기 ↗</a><br><a href="./presentation-notes.json" target="_blank" rel="noopener">시각적 표현과 한계 ↗</a></p><p class="privacy-note">© OpenStreetMap contributors · ODbL 1.0<br>Terrain Tiles / Mapzen, hosted on AWS. SRTM data courtesy of the U.S. Geological Survey.<br><a href="./terrain-data/terrain.json" target="_blank" rel="noopener">고도 자료 범위·해상도·출처 ↗</a><br>Three.js · MIT · Pretendard · SIL OFL 1.1 · <a href="./assets/materials/sources.json" target="_blank" rel="noopener">Poly Haven 재질 · CC0</a>. 숨결의 캠퍼스 산책 프로토타입이며, 대학 공식 서비스는 아닙니다. 도장은 이 브라우저에만 저장됩니다.</p>`);
  const visitKey='JejuCampusWalk.visited.v1';
  let saved=[];try{saved=JSON.parse(localStorage.getItem(visitKey)||'[]');}catch{}
  const visited=new Set(Array.isArray(saved)?saved.filter(id=>places.some(p=>p.id===id)):[]);
  places.forEach((place,i)=>{const stamp=document.createElement('div');stamp.id='stamp'+i;stamp.className='stamp';stamp.innerHTML=`<span>${place.number}</span>${place.short}`;$('stamps').append(stamp);});
  function updateStamps(){$('homeVisitCount').textContent=visited.size+'곳을 걸었어요';$('homeVisitRatio').textContent=visited.size+' / 3';$('homeStamps').replaceChildren(...places.map(place=>{const item=document.createElement('span');item.className=visited.has(place.id)?'visited':'';item.textContent=(visited.has(place.id)?'✓ ':'')+place.short;return item;}));places.forEach((place,i)=>{const stamp=$('stamp'+i);stamp.classList.toggle('done',visited.has(place.id));stamp.querySelector('span').textContent=visited.has(place.id)?'✓':place.number;stamp.setAttribute('aria-label',place.short+(visited.has(place.id)?' 방문 완료':' 아직 방문하지 않음'));});$('visitCount').textContent=`${visited.size} / 3 장소 발견`;}
  updateStamps();
  function checkVisits(){if(mode!=='walk'||photoActive)return;places.forEach((place,i)=>{if(!visited.has(place.id)&&Math.hypot(player.position.x-focusLocations[i][0],player.position.z-focusLocations[i][1])<9){visited.add(place.id);try{localStorage.setItem(visitKey,JSON.stringify([...visited]));}catch{}updateStamps();toast(visited.size===3?'세 곳의 산책 도장을 모두 모았어요. 이제 나만의 길로!':place.short+' 도장을 발견했어요.');}});}
  let photoActive=false;
  function setPhoto(value){photoActive=value;clearInput();document.body.dataset.photo=String(value);$('photoTools').hidden=!value;if(value)toast('드래그와 휠로 마음에 드는 장면을 담아보세요.');else $('world').focus({preventScroll:true});}
  $('photo').onclick=()=>{if(mode==='welcome')showPlace(0);setPhoto(true);};$('closePhoto').onclick=()=>setPhoto(false);
  $('capturePhoto').onclick=()=>{renderer.render(scene,camera);$('world').toBlob(blob=>{if(!blob){toast('사진을 저장하지 못했어요. 다시 시도해 주세요.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='숨결-캠퍼스-산책.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('캠퍼스 사진을 저장했어요.');},'image/png');};

  function jump(){if(mode==='walk'&&!photoActive&&!$('dialog').open&&grounded){verticalVelocity=7;grounded=false;jumpCount++;}}
  addEventListener('keydown',event=>{
    if(!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)&&!$('dialog').open){if(event.code==='KeyV'&&mode==='walk'&&!event.repeat){togglePerspective();return;}if(event.code==='KeyP'&&mode!=='welcome'){setPhoto(!photoActive);return;}if(event.code==='Escape'&&photoActive){setPhoto(false);return;}}
    if(mode!=='walk'||photoActive||$('dialog').open||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
    if(event.target!==$('world')&&event.target!==document.body)return;
    keys[event.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(event.code==='Space'&&!event.repeat)jump();if(event.code==='KeyR'&&!event.repeat)resetPlayer();
  });
  addEventListener('keyup',event=>keys[event.code]=false);addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{clearInput();clock.getDelta();});
  $('world').addEventListener('pointerdown',event=>{
    if(mode==='welcome'||$('dialog').open)return;
    $('world').focus({preventScroll:true});pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});$('world').setPointerCapture(event.pointerId);
    if(pointers.size===1)drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);drag=null;}
  });
  $('world').addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){const [a,b]=[...pointers.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance){const factor=pinchDistance/Math.max(next,1);if(mode==='walk')walkDistance=THREE.MathUtils.clamp(walkDistance*factor,7,38);else distance=THREE.MathUtils.clamp(distance*factor,30,1200);}pinchDistance=next;return;}
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(mode==='walk'){walkYaw-=dx*.005;walkPitch=THREE.MathUtils.clamp(walkPitch+dy*.004,.14,1.15);}else{yaw-=dx*.005;pitch=THREE.MathUtils.clamp(pitch+dy*.004,.22,1.3);}
    drag.x=event.clientX;drag.y=event.clientY;
  });
  function endPointer(event){pointers.delete(event.pointerId);pinchDistance=null;if(drag?.id===event.pointerId)drag=null;}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(event,endPointer);
  $('world').addEventListener('wheel',event=>{if(mode==='welcome'||$('dialog').open)return;event.preventDefault();if(mode==='walk')walkDistance=THREE.MathUtils.clamp(walkDistance+event.deltaY*.025,7,38);else distance=THREE.MathUtils.clamp(distance+event.deltaY*.07,30,1200);},{passive:false});
  function joyMove(event){if(event.pointerId!==joystickPointer)return;const rect=$('joystick').getBoundingClientRect();let x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2;const length=Math.hypot(x,y);if(length>29){x*=29/length;y*=29/length;}touchX=x/29;touchY=-y/29;$('knob').style.transform=`translate(${x}px,${y}px)`;}
  $('joystick').onpointerdown=event=>{if(joystickPointer!==null)return;joystickPointer=event.pointerId;$('joystick').setPointerCapture(event.pointerId);joyMove(event);};$('joystick').onpointermove=joyMove;
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(event,()=>{joystickPointer=null;touchX=touchY=0;$('knob').style.transform='';});
  $('jump').onpointerdown=event=>{event.preventDefault();jump();};$('run').onpointerdown=event=>{event.preventDefault();runTouch=true;$('run').setPointerCapture(event.pointerId);};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$('run').addEventListener(event,()=>runTouch=false);

  const map=$('minimap').getContext('2d'),mapBase=document.createElement('canvas');mapBase.width=440;mapBase.height=440;
  const base=mapBase.getContext('2d'),bounds=campus.bounds,scale=402/Math.max(bounds.maxX-bounds.minX,bounds.maxZ-bounds.minZ);
  const mapWidth=(bounds.maxX-bounds.minX)*scale,mapHeight=(bounds.maxZ-bounds.minZ)*scale;
  function mapPoint(x,z){return[(440-mapWidth)/2+(x-bounds.minX)*scale,(440-mapHeight)/2+(z-bounds.minZ)*scale];}
  base.fillStyle='#edf0e1';base.fillRect(0,0,440,440);
  function mapPolygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>{const q=mapPoint(...p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.closePath();ctx.fill();}
  mapPolygon(base,data.boundary,'#d5dfc6');
  for(const area of data.areas)mapPolygon(base,area.points,area.tags.amenity==='parking'?'#b8c0bc':area.tags.natural==='water'?'#a5c4bf':'#bfceb0');
  base.strokeStyle='#f7f6ec';base.lineWidth=2.5;base.lineJoin='round';
  for(const road of data.roads){base.lineWidth=isWalkingRoad(road)?1:2.8;base.strokeStyle=isWalkingRoad(road)?'#e1d7bf':'#f7f6ec';base.beginPath();road.points.forEach((p,i)=>{const q=mapPoint(...p);if(i)base.lineTo(...q);else base.moveTo(...q);});base.stroke();}
  for(const b of data.buildings)mapPolygon(base,b.points,'#95aa91');
  function drawMap(){
    if($('mapPanel').hidden||$('mapPanel').classList.contains('collapsed'))return;
    map.drawImage(mapBase,0,0);
    (mode==='walk'?focusLocations:locations).forEach((p,i)=>{const [x,y]=mapPoint(...p);map.fillStyle=i===selected?'#006a99':'#00bfff';map.strokeStyle='#fffcf1';map.lineWidth=3;map.beginPath();map.arc(x,y,i===selected?10:7,0,Math.PI*2);map.fill();map.stroke();map.font='600 11px sans-serif';map.fillStyle='#fffdf0';map.textAlign='center';map.fillText(String(i+1),x,y+4);});
    if(mode==='walk'){
      const [x,y]=mapPoint(player.position.x,player.position.z);map.save();map.translate(x,y);map.rotate(-walkYaw);map.fillStyle='#006a99';map.strokeStyle='#fffdf0';map.lineWidth=3;map.beginPath();map.moveTo(0,-10);map.lineTo(-7,8);map.lineTo(0,4);map.lineTo(7,8);map.closePath();map.fill();map.stroke();map.restore();
    }
  }
  function navigable(x,z){return walkable(x,z,campus.walkCollisionPolygons??data.buildings)&&!campus.obstacles.some(p=>Math.hypot(x-p[0],z-p[1])<p[2]+.4);}
  function updatePlayer(dt){
    if(mode!=='walk')return;const active=!$('dialog').open&&!photoActive;
    let fx=active?Number(!!(keys.KeyD||keys.ArrowRight))-Number(!!(keys.KeyA||keys.ArrowLeft))+touchX:0;
    let fz=active?Number(!!(keys.KeyW||keys.ArrowUp))-Number(!!(keys.KeyS||keys.ArrowDown))+touchY:0;
    const length=Math.hypot(fx,fz);if(length>1){fx/=length;fz/=length;}const moving=length>.08;
    const speed=(keys.ShiftLeft||keys.ShiftRight||runTouch)?16:7;
    const targetX=moving?(fx*Math.cos(walkYaw)-fz*Math.sin(walkYaw))*speed:0;
    const targetZ=moving?(-fx*Math.sin(walkYaw)-fz*Math.cos(walkYaw))*speed:0;
    const damping=1-Math.exp(-(moving?12:20)*dt);velocityX+=(targetX-velocityX)*damping;velocityZ+=(targetZ-velocityZ)*damping;
    const substeps=Math.max(1,Math.ceil(Math.hypot(velocityX,velocityZ)*dt/.3));
    for(let i=0;i<substeps;i++){
      const previousX=player.position.x,previousZ=player.position.z;
      const nx=THREE.MathUtils.clamp(player.position.x+velocityX*dt/substeps,bounds.minX,bounds.maxX),nz=THREE.MathUtils.clamp(player.position.z+velocityZ*dt/substeps,bounds.minZ,bounds.maxZ);
      if(navigable(nx,player.position.z))player.position.x=nx;else if(Math.abs(nx-previousX)>.0001)blockedMoves++;
      if(navigable(player.position.x,nz))player.position.z=nz;else if(Math.abs(nz-previousZ)>.0001)blockedMoves++;
      totalWalked+=Math.hypot(player.position.x-previousX,player.position.z-previousZ);
    }
    const actualSpeed=Math.hypot(velocityX,velocityZ);walkCycle+=actualSpeed*dt*1.5;
    if(actualSpeed>.15){const target=Math.atan2(velocityX,velocityZ);const diff=Math.atan2(Math.sin(target-body.rotation.y),Math.cos(target-body.rotation.y));body.rotation.y+=diff*(1-Math.exp(-14*dt));}
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
    if(mode==='welcome'){
      desiredFocus.set(-25,terrainAt(-25,-395)+4,-395);
      const angle=-.62+(reducedMotion.matches||instantCamera?0:Math.sin(elapsed*.045)*.08);
      const introDistance=205*Math.min(1.5,Math.max(1,1.05/camera.aspect));
      desiredCamera.set(desiredFocus.x+Math.sin(angle)*introDistance,desiredFocus.y+introDistance*.59,desiredFocus.z-Math.cos(angle)*introDistance);
    }else if(mode==='explore'){
      const responsiveDistance=distance*Math.min(2.5,Math.max(1,1.25/camera.aspect));
      const p=locations[selected];desiredFocus.set(p[0],terrainAt(...p)+(selected===1?5:1.5),p[1]);
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
    camera.near=mode==='walk'?.12:3;camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);
    if(mode==='walk'){camera.clearViewOffset();}else if(innerWidth<761){camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*(mode==='welcome'?.23:.18),innerWidth,innerHeight);}else{camera.setViewOffset(innerWidth,innerHeight,-innerWidth*(mode==='welcome'?.16:.12),0,innerWidth,innerHeight);}
    camera.updateProjectionMatrix();
  }
  addEventListener('resize',resize);
  $('world').addEventListener('webglcontextlost',event=>{event.preventDefault();$('errorMessage').textContent='그래픽 연결이 잠시 끊어졌어요. 다시 시도하기를 눌러 주세요.';$('error').hidden=false;clearInput();});
  $('world').addEventListener('webglcontextrestored',()=>location.reload());
  const projection=new THREE.Vector3();
  function updatePins(){
    pins.forEach((pin,i)=>{
      if(mode==='welcome'||mode==='walk'){pin.hidden=true;return;}
      const p=mode==='walk'?focusLocations[i]:locations[i];projection.set(p[0],terrainAt(...p)+(mode==='walk'?3.7:i===1?24:7),p[1]);const dist=camera.position.distanceTo(projection);projection.project(camera);
      const x=(projection.x*.5+.5)*innerWidth,y=(-projection.y*.5+.5)*innerHeight;
      const covered=innerWidth<761&&mode==='explore'&&y>innerHeight*.52;
      pin.hidden=projection.z>1||projection.z< -1||x<30||x>innerWidth-40||y<80||y>innerHeight-110||dist>500||covered;
      if(!pin.hidden)pin.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;
    });
  }
  function tick(){
    requestAnimationFrame(tick);const rawDelta=clock.getDelta(),dt=Math.min(rawDelta,.04);frameDuration=frameDuration*.95+rawDelta*50;
    if(document.hidden||$('error').hidden===false)return;
    elapsed+=dt;updatePlayer(dt);checkVisits();cameraGoal();
    const blend=instantCamera&&mode!=='walk'?1:1-Math.exp(-(mode==='walk'?9:3.5)*dt);
    camera.position.lerp(desiredCamera,blend);if(mode==='walk')camera.position.y=Math.max(camera.position.y,groundAt(camera.position.x,camera.position.z)+.45);currentFocus.lerp(desiredFocus,blend);camera.lookAt(currentFocus);
    sky.position.copy(camera.position);skyUniforms.top.value.lerp(night?skyNightTop:skyDayTop,1-Math.exp(-dt*2));skyUniforms.bottom.value.lerp(night?skyNightBottom:skyDayBottom,1-Math.exp(-dt*2));
    scene.background.lerp(night?colors.night:colors.day,1-Math.exp(-dt*2));scene.fog.color.copy(scene.background);scene.fog.near=mode==='explore'?650:220;scene.fog.far=mode==='explore'?2800:1300;
    const lightBlend=1-Math.exp(-dt*2);sun.intensity+=((night?.35:2.6)-sun.intensity)*lightBlend;ambient.intensity+=((night?.7:1.4)-ambient.intensity)*lightBlend;
    sun.position.set(currentFocus.x-100,currentFocus.y+160,currentFocus.z-70);sun.target.position.copy(currentFocus);
    mapElapsed+=dt;if(mapElapsed>.1){drawMap();mapElapsed=0;if(mode==='walk'){let nearest=0;for(let i=1;i<focusLocations.length;i++)if(Math.hypot(player.position.x-focusLocations[i][0],player.position.z-focusLocations[i][1])<Math.hypot(player.position.x-focusLocations[nearest][0],player.position.z-focusLocations[nearest][1]))nearest=i;const named=data.buildings.filter(b=>b.name).reduce((best,b)=>{const d=Math.hypot(player.position.x-b.center[0],player.position.z-b.center[1]);return d<best.distance?{building:b,distance:d}:best;},{building:null,distance:55});$('nearPlace').textContent=named.building?named.building.name+' 주변':['정문 주변','박물관 주변','구본관 권역'][nearest];}}
    visitMarkers.forEach((marker,i)=>{marker.visible=false;marker.children[0].material.color.set(visited.has(places[i].id)?'#66e1ff':'#00bfff');});
    updatePins();renderer.render(scene,camera);frame++;
    if(frame%30===0){$('world').dataset.verification=JSON.stringify({version:'campus-r18',areaCount:data.areas.length,parkingCount:data.areas.filter(a=>a.tags.amenity==='parking').length,mode,perspective:firstPerson?'first':'third',position:player.position.toArray(),ground:groundAt(player.position.x,player.position.z),grounded,verticalVelocity,walked:totalWalked,jumps:jumpCount,maxJumpClearance,blockedMoves,camera:camera.position.toArray(),buildingCount:data.buildings.length,roadCount:data.roads.length,vehicleRoadCount:data.roads.filter(r=>!isWalkingRoad(r)).length,entrance:campus.observedEntrance,surveyDetails:campus.observedDetails,grading:campus.terrain?.metadata?.localObservedGrading,openData:data.openDataIntegration?.source??null,terrain:campus.terrain?.metadata?.source??'AWS Terrain Tiles',webgl:renderer.capabilities.isWebGL2?'WebGL2':'WebGL'});$('world').dataset.renderedFrames=String(frame);$('world').dataset.fps=(1000/frameDuration).toFixed(1);$('world').dataset.treeCount=String(campus.treeCount);$('world').dataset.drawCalls=String(renderer.info.render.calls);$('world').dataset.playerPosition=[player.position.x.toFixed(2),player.position.y.toFixed(2),player.position.z.toFixed(2)].join(',');}
  }
  resize();snapCamera();tick();
  $('navPlaces').disabled=false;$('navWalk').disabled=false;
  $('loadLabel').textContent='산책 시작하기';$('explore').disabled=false;$('walkIntro').disabled=false;buttons.forEach(b=>b.disabled=false);document.body.dataset.ready='true';
  // Enter the world immediately; the card screen is an optional menu.
  startWalk();
}
