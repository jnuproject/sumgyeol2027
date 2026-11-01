// Fixed reactions only: no text, chat or persistent reaction history.
export const EMOTES=Object.freeze([
 {id:1,emoji:'👋',label:'안녕',motion:'wave'},
 {id:2,emoji:'❤️',label:'하트',motion:'heart'},
 {id:3,emoji:'🎉',label:'신나요',motion:'dance'},
 {id:4,emoji:'😂',label:'웃음',motion:'laugh'}
]);
export const EMOTE_MS=3000;
export const validEmote=id=>Number.isInteger(id)&&id>=0&&id<=4;
export function createEmoteState(now=()=>performance.now()){
 let id=0,seq=0,started=0,nextAt=0;
 return {
  play(value){const t=now();if(!validEmote(value)||!value||t<nextAt)return false;id=value;started=t;nextAt=t+EMOTE_MS;seq++;return true;},
  cancel(){if(id){id=0;seq++;}},
  sample(){const age=Math.max(0,now()-started);if(id&&age>=EMOTE_MS){id=0;seq++;}return {id,seq,age:id?age:0};},
  remaining:()=>Math.max(0,nextAt-now())
 };
}
export function remoteEmote(peer,now){
 const age=(peer.emoteAge??EMOTE_MS)+Math.max(0,now-peer.receivedAt)+(peer.transitMs??0);
 return validEmote(peer.emote)&&peer.emote>0&&age<EMOTE_MS?{id:peer.emote,age}: {id:0,age:0};
}
