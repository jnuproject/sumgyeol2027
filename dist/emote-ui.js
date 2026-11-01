import {EMOTES} from './emotes.js?v=emote-r59';
export function createEmoteUI({onPlay,onOpen=()=>{},available=()=>true,remaining=()=>0}){
 const root=document.createElement('div');root.id='emoteControls';root.hidden=true;
 const toggle=document.createElement('button');toggle.id='emoteToggle';toggle.type='button';toggle.setAttribute('aria-label','반응과 동작');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','emoteMenu');toggle.innerHTML='<span aria-hidden="true">☺</span><small>반응</small>';
 const menu=document.createElement('div');menu.id='emoteMenu';menu.hidden=true;menu.setAttribute('role','group');menu.setAttribute('aria-label','반응 선택');
 const buttons=EMOTES.map(e=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',e.label);b.innerHTML=`<span aria-hidden="true">${e.emoji}</span><small>${e.label}</small>`;b.onclick=()=>{if(available()&&onPlay(e.id)){close();document.getElementById('world')?.focus({preventScroll:true});}};menu.append(b);return b;});
 root.append(menu,toggle);document.body.append(root);
 function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}
 function open(){if(!available())return;onOpen();menu.hidden=false;toggle.setAttribute('aria-expanded','true');buttons[0].focus({preventScroll:true});}
 toggle.onclick=()=>menu.hidden?open():close();
 document.addEventListener('pointerdown',e=>{if(!root.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&!menu.hidden){close();toggle.focus();}if(e.code==='KeyG'&&!e.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&available()){e.preventDefault();menu.hidden?open():close();}});
 return {update(){const enabled=available();root.hidden=!enabled;if(!enabled||(document.body.dataset.hudPanel&&document.body.dataset.hudPanel!=='none'))close();const busy=remaining()>0;buttons.forEach(b=>b.disabled=busy);},close};
}
