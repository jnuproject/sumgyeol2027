// Optional overlays share one slot. The world stays open until a tool is asked for.
export function createCampusHud({mode,hasPlaceCard,clearInput}){
 const $=id=>document.getElementById(id),panels={map:'mapPanel',places:'dock',more:'hudPanel'},buttons={map:'hudMap',places:'hudPlaces',more:'hudMore'};let current=null;
 function close({restore=true}={}){
  for(const id of Object.values(panels))$(id).hidden=true;
  $('dock').classList.remove('mobile-open');
  for(const id of Object.values(buttons))$(id).setAttribute('aria-expanded','false');
  document.body.dataset.hudPanel='none';current=null;
  if(restore)$('explorer').hidden=!hasPlaceCard();
 }
 function toggle(name){
  if(!panels[name]||!['walk','explore'].includes(mode()))return;
  const opening=current!==name;close();clearInput();if(!opening)return;
  current=name;document.body.dataset.hudPanel=name;$(panels[name]).hidden=false;$(buttons[name]).setAttribute('aria-expanded','true');$('explorer').hidden=true;
  if(name==='places')$('dock').classList.add('mobile-open');
  if(name==='map'){$('mapPanel').classList.remove('collapsed');$('mapToggle').textContent='×';$('mapToggle').setAttribute('aria-label','지도 닫기');$('mapToggle').setAttribute('aria-expanded','true');}
 }
 for(const [name,id]of Object.entries(buttons))$(id).onclick=()=>toggle(name);
 document.addEventListener('keydown',event=>{if(event.code==='Escape'&&current){const trigger=$(buttons[current]);close();clearInput();trigger.focus({preventScroll:true});}});
 document.addEventListener('pointerdown',event=>{if(current&&!event.target.closest('#mapPanel,#dock,#hudPanel,#hudMap,#hudPlaces,#hudMore'))close();});
 for(const [id,target]of Object.entries({hudHelp:'help',hudSettings:'settings',hudTime:'time',hudPhoto:'photo',hudPerspective:'perspective',hudAbout:'about'}))$(id).onclick=()=>{close();$(target).click();};
 $('hudCharacter').onclick=()=>{close();location.href='./mascot.html';};
 $('hudHome').onclick=()=>{close();$('home').click();};
 return {close,toggle,metadata:()=>({panel:current,openPanels:Object.values(panels).filter(id=>!$(id).hidden)})};
}
