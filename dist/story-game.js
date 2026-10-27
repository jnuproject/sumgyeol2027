import {isWalkingRoad,roadWidthAt} from './road-profile.js?v=ground-r44';
import {segmentDistance} from './navigation.js';
import {conversationShot} from './conversation-camera.js?v=ground-r44';
import * as THREE from './three.module.js';
import {POLICY_DIALOGUES,createConversation,conversationNode,advanceConversation,chooseConversation,readConversations,saveConversations} from './policy-dialogues.js?v=ground-r44';

export function createStoryGame({scene,data,avatar,player,camera,groundAt,safePosition,canStand,focusStops,showDialog,clearInput,toast,reducedMotion,onTalk=()=>{}}){
 const $=id=>document.getElementById(id);let storage;try{storage=localStorage;}catch{}
 const records=readConversations(storage),actors=[];let near=null,active=false,session=null,typing=0,line='',lastTracker='',lastPrompt='',saveNotified=false,speakingActor=null,conversationOrigin=null;
 const gate=focusStops[0].walkPosition;
 const anchors=[[gate[0],gate[1]+7],[-47,87.6],[focusStops[2].walkPosition[0],-18],[-111,116.8]];
 const tracker=$('hudRecord');tracker.setAttribute('aria-label','숨결과 나눈 이야기');
 const prompt=document.createElement('button');prompt.id='storyTalk';prompt.className='story-talk';prompt.hidden=true;document.body.append(prompt);
 const dialogue=document.createElement('dialog');dialogue.id='storyDialogue';dialogue.className='npc-dialogue';dialogue.setAttribute('aria-labelledby','npcName');
 dialogue.innerHTML=`<div class="npc-conversation"><div class="npc-top"><div class="npc-identity"><img src="assets/sumgyeol_symbol_blue.png" alt="" class="npc-symbol"><h2 id="npcName"></h2></div><button id="npcLeave" aria-label="대화 나가기">나중에 이야기하자 ×</button></div><p class="npc-player-reply" id="npcReply" hidden></p><div class="npc-line" id="npcLine" aria-hidden="true"></div><span class="npc-accessible-line" id="npcAccessible" role="status" aria-live="polite"></span><div id="npcChoices" class="npc-choices"></div><div class="npc-bottom"><span id="npcKeys">E / Space · 다음</span><button id="npcNext">계속 듣기 <span>▾</span></button></div></div>`;document.body.append(dialogue);
 const encounters=POLICY_DIALOGUES.map((q,i)=>({q,anchor:anchors[i],key:q.id}));
 function pedestrianAnchor(wish){
  for(const r of [0,.9,1.8,2.7,3.6,4.5])for(let i=0;i<(r?12:1);i++){
   const p=safePosition([wish[0]+Math.cos(i*Math.PI/6)*r,wish[1]+Math.sin(i*Math.PI/6)*r]);
   if(p&&Math.hypot(p[0]-wish[0],p[1]-wish[1])<6&&!data.roads.some(road=>!isWalkingRoad(road)&&road.points.some((b,j)=>j&&segmentDistance(...p,road.points[j-1],b)<roadWidthAt(road,...p)/2+.45)))return p;
  }return null;
 }
 for(const [i,encounter]of encounters.entries()){
  const q=encounter.name?{...encounter.q,name:encounter.name}:encounter.q,position=i<3?safePosition(encounter.anchor):pedestrianAnchor(encounter.anchor);if(!position){if(i<3)throw Error('No pedestrian NPC position');continue;}
  const companion=avatar.createCompanion(scene),group=companion.group;group.name=q.name;group.position.set(position[0],groundAt(...position),position[1]);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.8,.88,40),new THREE.MeshBasicMaterial({color:q.color,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.045;group.add(ring);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(80,80,76,0,Math.PI*2);ctx.fill();
  const h=105,w=h*avatar.symbolImage.width/avatar.symbolImage.height;ctx.drawImage(avatar.symbolImage,(160-w)/2,(160-h)/2,w,h);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.scale.set(.65,.65,1);label.position.y=2.25;group.add(label);
  actors.push({q,position,companion,group,label,ring,key:encounter.key,intro:encounter.intro});
 }
 const count=()=>POLICY_DIALOGUES.filter(q=>records[q.id].completed).length;
 function persist(){if(!saveConversations(storage,records)&&!saveNotified){saveNotified=true;toast('이번 대화 기록은 산책하는 동안 유지됩니다.');}}
 function remember(completed=false){if(!session)return;const old=records[session.script.id];records[session.script.id]={node:session.node,index:session.index,completed:old.completed||completed};persist();}
 function controls(){
  const node=conversationNode(session),ready=typing>=line.length,last=session.index===node.lines.length-1;
  $('npcChoices').hidden=!ready||!last||!node.choices;
  $('npcNext').hidden=ready&&last&&!!node.choices;
  $('npcNext').innerHTML=!ready?'한 번에 읽기 <span>▾</span>':last&&node.end?'또 보자 <span>→</span>':'계속 듣기 <span>▾</span>';
  $('npcKeys').textContent=ready&&last&&node.choices?'선택해서 답하기':'E / Space · 다음';
  if(ready&&last&&node.choices&&document.activeElement===$('npcNext'))$('npcChoices').querySelector('button')?.focus({preventScroll:true});
 }
 function renderLine(){
  const node=conversationNode(session);line=node.lines[session.index];typing=reducedMotion()?line.length:0;
  $('npcLine').textContent=reducedMotion()?line:'';$('npcAccessible').textContent=line;
  $('npcReply').textContent='나  “'+session.reply+'”';$('npcReply').hidden=!session.reply;
  $('npcChoices').replaceChildren(...(node.choices??[]).map((choice,i)=>{const b=document.createElement('button');b.innerHTML=`<span>${i+1}</span>`;b.append(document.createTextNode(choice.text));b.onclick=()=>choose(i);return b;}));
  controls();remember();if(dialogue.open&&!$('npcNext').hidden)$('npcNext').focus({preventScroll:true});
 }
 function choose(index){if(!session||typing<line.length)return;if(chooseConversation(session,index))renderLine();}
 function next(){
  if(!session)return;
  if(typing<line.length){typing=line.length;$('npcLine').textContent=line;controls();return;}
  const node=conversationNode(session);
  if(advanceConversation(session)){renderLine();return;}
  if(node.end){remember(true);dialogue.close();}
 }
 function begin(actor){
  if(!active||!actor||$('dialog').open||dialogue.open)return;
  onTalk();session=createConversation(actor.q.id,records[actor.q.id]);if(actor.intro&&session.node==='hello'){const node=session.script.nodes.hello;session.script={...session.script,nodes:{...session.script.nodes,hello:{...node,lines:[actor.intro,...node.lines.slice(1)]}}};}speakingActor=actor;conversationOrigin=player.position.toArray();clearInput();document.body.dataset.conversation='true';
  $('npcName').textContent=actor.q.name;dialogue.style.setProperty('--npc-color',actor.q.color);renderLine();dialogue.showModal();$('npcNext').focus({preventScroll:true});
 }
 $('npcLeave').onclick=()=>dialogue.close();$('npcNext').onclick=next;
 dialogue.addEventListener('close',()=>{remember();session=null;speakingActor=null;conversationOrigin=null;document.body.dataset.conversation='false';clearInput();$('world').focus({preventScroll:true});lastTracker='';});
 document.addEventListener('keydown',event=>{
  if(!dialogue.open){if(event.code==='KeyE'&&!event.repeat&&active&&near&&!$('dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)){event.preventDefault();begin(near);}return;}
  if(event.repeat)return;
  if(['KeyE','Space'].includes(event.code)&&event.target.tagName!=='A'){
   event.preventDefault();event.stopPropagation();
   if(typing>=line.length&&conversationNode(session).choices&&session.index===conversationNode(session).lines.length-1)return;
   next();
  }else if(/^Digit[1-3]$/.test(event.code)){event.preventDefault();choose(Number(event.code.slice(-1))-1);}
 });

 prompt.onclick=()=>begin(near);
 function journal(){
  showDialog('숨결과 나눈 이야기',`<p>길에서 만난 숨결과의 대화를 여기 남겨둘게요.</p><div class="npc-journal">${POLICY_DIALOGUES.map(q=>`<article><small>${q.place}</small><h3>${q.name}</h3>${records[q.id].completed?`<p>${q.summary}</p>${q.source?`<a href="${q.source}" target="_blank" rel="noopener">${q.policy} 기획안 ↗</a>`:`<small>${q.policy} 구상</small>`}`:'<p>아직 나누지 못한 이야기가 있어요. 캠퍼스에서 만나 말을 걸어보세요.</p>'}</article>`).join('')}</div>`);
 }
 tracker.onclick=journal;
 function update(dt,{mode,photo}){
  active=mode==='walk'&&!photo;near=null;
  if(session&&dialogue.open&&typing<line.length){const before=Math.floor(typing);typing=Math.min(line.length,typing+dt*36);if(before!==Math.floor(typing)||typing===line.length){$('npcLine').textContent=line.slice(0,Math.floor(typing));controls();}}
  for(const a of actors){
   const distance=Math.hypot(player.position.x-a.position[0],player.position.z-a.position[1]);
   a.group.visible=mode!=='welcome';if(distance<140)a.companion.update(Math.min(dt,.08));a.label.visible=distance<13&&active&&!dialogue.open&&!$('dialog').open;a.ring.visible=!a.booth&&distance<16&&active;
   const interaction=a.interactionPosition??a.position,interactionDistance=Math.hypot(player.position.x-interaction[0],player.position.z-interaction[1]);
   let reachable=active&&interactionDistance<(a.booth?2.8:4.8)&&Math.abs(player.position.y-a.group.position.y)<2.2;
   if(reachable)for(let k=1;k<5;k++){const t=k/5;if(!canStand(player.position.x*(1-t)+interaction[0]*t,player.position.z*(1-t)+interaction[1]*t))reachable=false;}
   if(reachable&&(!near||interactionDistance<near.distance))near={...a,distance:interactionDistance};
   if(distance<16)a.companion.body.rotation.y=Math.atan2(player.position.x-a.position[0],player.position.z-a.position[1]);

  }
  const ui=count();if(ui!==lastTracker){tracker.textContent=`나눈 이야기 · ${ui} / ${POLICY_DIALOGUES.length}`;lastTracker=ui;}
  prompt.hidden=!active||!near||dialogue.open||$('dialog').open;
  if(!prompt.hidden&&lastPrompt!==near.q.id){prompt.innerHTML=`<img src="assets/sumgyeol_symbol_blue.png" alt=""><kbd>E</kbd><b>말 걸기</b>`;lastPrompt=near.q.id;}
 }
 function cameraFrame(){if(!speakingActor||!dialogue.open)return null;return conversationShot(speakingActor.companion.facePosition(),conversationOrigin,{aspect:camera.aspect,canStand:speakingActor.booth?()=>true:canStand,groundAt});}
 function assignBoothActor(id,staff){
  const actor=actors.find(a=>a.q.id===id);if(!actor||!staff)return false;
  actor.group.removeFromParent();actor.companion=staff.person;actor.group=staff.person.group;actor.position=staff.position;actor.interactionPosition=staff.front;actor.booth=true;actor.key='student-hall-booth';
  actor.group.name=actor.q.name;actor.label.position.y=2.05;actor.label.scale.set(.50,.50,1);actor.group.add(actor.label,actor.ring);return true;
 }
 return {update,journal,cameraFrame,assignBoothActor,isTalking:()=>dialogue.open,drawMap(){},metadata:()=>({completed:count(),records,near:near?.q.id??null,conversation:session?{npc:session.script.id,node:session.node,line:session.index,face:speakingActor.companion.facePosition(),shot:cameraFrame()}:null,npcCount:actors.length,anchors:actors.map(a=>({id:a.q.id,encounter:a.key,npc:a.position,interaction:a.interactionPosition??a.position,booth:!!a.booth}))})};
}
