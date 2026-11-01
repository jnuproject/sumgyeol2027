import {EXTRA_POLICY_DIALOGUES} from './policy-encounters.js?v=dialogue-r57';
import {CAMPUS_DIALOGUES} from './campus-dialogues.js?v=dialogue-r57';
export {CAMPUS_DIALOGUES};
// Conversational adaptations of supplied policy plans; proposals are not live services.
export const POLICY_DIALOGUES=[
 {"id":"memory","category":"제주4·3/기억","name":"숨결 · 제주4·3/기억","place":"정문 보도","color":"#c46d81","topic":"이 길에 있는 4·3의 기억","policy":"제주대 4·3 평화길","summary":"캠퍼스의 추모공간을 하나의 길로 잇고, 짧은 오디오 가이드와 함께 일상에서 4·3을 기억하는 구상.","source":"https://docs.google.com/document/d/1qlYzuaXI4mRgDaOc3JZ5vBsnUvU3q24We7K8dfq6oZw/edit?tab=t.dnxbswcvr9h",nodes:{
  hello:{"lines":["안녕, 산책 중이야? 혹시 학교 안에 4·3을 기억하는 공간들이 있다는 거 알고 있었어?"],"choices":[{"text":"어디에 있어?","next":"places"},{"text":"들어는 봤는데 잘 모르겠어.","next":"quiet"}]},
  quiet:{"lines":["매일 다니는 학교인데도 그냥 지나치기 쉽더라. 흩어져 있는 공간들을 한 길로 이어보려고 해."],"next":"guide"},
  places:{"lines":["학교 곳곳에 있는 추모공간들을 이어서 걸을 수 있게 하려는 거야. 수업 가는 길에도 들러볼 수 있도록."],"next":"guide"},
  guide:{"lines":["정책 이름은 「제주대 4·3 평화길」이야. 장소마다 QR을 두고 짧은 오디오 설명을 들을 수 있게 준비하려고 해."],"choices":[{"text":"설명을 들으면 더 잘 알 수 있겠다.","next":"listen"},{"text":"같이 걷는 행사도 열어?","next":"walk"}]},
  listen:{"lines":["응. 그 장소가 어떤 의미인지 알고 걸으면 다르게 느껴질 것 같아. 설명은 관련 전문기관의 검수를 받아서 만들려고 해."],"next":"bye"},
  walk:{"lines":["4·3 주간에 걷기나 러닝 프로그램도 함께 열려고 해. 순위를 겨루기보다는 장소의 의미를 알아가는 데 초점을 두고."],"next":"bye"},
  bye:{"lines":["아직 준비 중이라 길의 안전이나 접근성도 살펴야 해. 관심 가져줘서 고마워. 산책 잘 다녀와."],"end":true}
 }},
 {"id":"festival","category":"문화/대동제","name":"숨결 · 문화/대동제","place":"경상대 앞 보행로","color":"#4897ad","topic":"시험 끝나면 뭐 하지?","policy":"숨플페","summary":"낮에는 체험 부스와 휴식 공간, 밤에는 참여형 시상식·토크·공연으로 한 해를 함께 마무리하는 연말제 구상.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.7a683j9zwd6d",nodes:{
  hello:{"lines":["시험 끝나면 뭐 할 거야? 나는 친구들이랑 놀고 싶은데.","막상 끝나면 다들 바로 집에 가더라."],"choices":[{"text":"일단 푹 자고 싶어.","next":"rest"},{"text":"학교에서 다 같이 놀면 좋겠는데.","next":"friends"}]},
  rest:{"lines":["그럼 편한 의자에 앉아서 영상 보고, 간식 먹으면서 쉬는 건 어때? 잠깐 들렀다 가도 되고."],"next":"plan"},
  friends:{"lines":["게임 부스나 포토존도 있으면 좋겠다. 친구들이랑 부스를 직접 열어봐도 재밌을 것 같고."],"next":"plan"},
  plan:{"lines":["그래서 연말제 「숨플페」를 준비하려고 해. 낮에는 부스를 돌아보거나 쉬고, 밤에는 공연이랑 토크를 즐기는 거야."],"choices":[{"text":"부스 돌아다니면 재밌겠다.","next":"invitation"},{"text":"밤에는 또 뭐 해?","next":"night"}]},
  invitation:{"lines":["부스에서 스탬프를 모으면 초대장을 받는 방식도 생각하고 있어. 초대장 번호로 밤에 경품 추첨도 하고."],"next":"night"},
  night:{"lines":["가볍게 참여할 수 있는 시상식도 열고, 중간중간 토크랑 공연을 넣으려고 해. 친구들이랑 한 해를 마무리하는 자리로."],"choices":[{"text":"시험 끝나고 가면 딱 좋겠다.","next":"bye"},{"text":"나도 부스 열어보고 싶어.","next":"booth"}]},
  booth:{"lines":["좋지! 기획안에도 부스 운영팀을 모집하는 내용이 있어. 네가 좋아하는 걸로 친구들이랑 준비해보면 재밌겠다."],"next":"bye"},
  bye:{"lines":["아직 기획 중이지만, 시험 끝나고 같이 놀 자리가 생기면 좋겠어. 얘기 들어줘서 고마워!"],"end":true}
 }},
 {"id":"voice","category":"소통","name":"숨결 · 소통","place":"학생회관 앞 숨결 부스","color":"#7b83b5","topic":"건의한 뒤에는 어떻게 될까?","policy":"JNU상생협의회","summary":"학우들의 요구를 모아 학교 본부와 정기적으로 논의하고, 이행 상황과 진행 과정을 점검해 공유하는 소통 구조 구상.","source":"https://docs.google.com/document/d/1RNuE4E4FGFz-o-oba5O2mbU9xEljBUsJaJsBGs9wzh0/edit?tab=t.u3vqo54dd2a",nodes:{
  hello:{"lines":["안녕! 학교 다니면서 바뀌었으면 하는 거 있어? 아까도 여기서 그 얘기 하고 있었어."],"choices":[{"text":"건의해도 잘 안 바뀌는 것 같아.","next":"doubt"},{"text":"내 의견이 어디까지 전달되는지 모르겠어.","next":"where"}]},
  doubt:{"lines":["그렇게 느낄 만해. 학생회가 들었다고 바로 바꿀 수 있는 건 아니더라. 예산이나 시설 문제는 학교 본부와 얘기해야 하니까."],"next":"council"},
  where:{"lines":["맞아. 의견을 냈으면 누가 검토하고 있는지도 알아야지.","지금 어디까지 진행됐는지 볼 수 없으면 답답하잖아."],"next":"council"},
  council:{"lines":["그래서 「JNU상생협의회」를 만들려고 해. 학우들의 요구를 모아서 학교 본부와 정기적으로 논의하는 자리야.","먼저 실무 협의에서 예산이나 행정 문제를 확인하고, 학생 대표와 본부가 함께 얘기하는 거지."],"choices":[{"text":"회의만 하고 끝나면 어떡해?","next":"followup"},{"text":"우리도 회의 내용을 볼 수 있어?","next":"public"}]},
  followup:{"lines":["그 뒤에 실제로 진행됐는지 확인하는 것까지 포함했어. 진행 상황을 학우들에게 알리고, 해결 안 된 건 다음 회의에서 다시 다루려고 해."],"next":"bye"},
  public:{"lines":["응. 일반 학우도 지켜볼 수 있는 공개 회의와 진행 과정 공유를 계획하고 있어. 내가 낸 의견이 어떻게 다뤄지는지 볼 수 있게."],"next":"bye"},
  bye:{"lines":["아직 기획안이지만, 건의하고 나서 어떻게 됐는지 몰라 답답한 일은 줄이고 싶어. 얘기해줘서 고마워."],"end":true}
 }},
 {"id":"escalator","category":"시설/교통","name":"숨결 · 시설/교통","place":"중앙도서관 오르막 입구","color":"#008dcc","topic":"도서관까지 올라가려니까…","policy":"학내 에스컬레이터 설치","summary":"중앙도서관으로 올라가는 계단에 에스컬레이터를 설치해 자주 오가는 길의 이동 부담을 줄이려는 구상.","source":null,nodes:{
  hello:{"lines":["휴, 도서관 올라갈 때마다 여기서 한 번 쉬게 되네. 너도 올라가는 길이야?"],"choices":[{"text":"응. 가방 무거운 날은 더 힘들어.","next":"why"},{"text":"옆에 있는 건 에스컬레이터야?","next":"plan"}]},
  why:{"lines":["맞아. 책까지 들고 오면 더 그렇지. 그래서 이 계단에 에스컬레이터를 설치하려고 해."],"next":"plan"},
  plan:{"lines":["응. 「학내 에스컬레이터 설치」 정책을 게임에서 미리 보여준 거야. 실제로 설치된 건 아니야.","일반 계단도 옆에 남겨서 편한 쪽으로 오갈 수 있게 생각하고 있어."],"choices":[{"text":"계단도 계속 쓸 수 있는 거네.","next":"stairs"},{"text":"매일 다니는 사람은 편해지겠다.","next":"daily"}]},
  stairs:{"lines":["응. 계단으로 가고 싶을 땐 그대로 다니면 돼. 올라가는 방법을 하나 더 만드는 거지."],"next":"bye"},
  daily:{"lines":["그렇지. 특히 짐이 많거나 자주 오가는 날에는 도움이 될 것 같아."],"next":"bye"},
  bye:{"lines":["아직 설치 구상이라 학교와 더 논의해야 해. 조금만 쉬었다 가자. 도서관까지 같이 힘내보자!"],"end":true}
 }},
 ...EXTRA_POLICY_DIALOGUES
];
export const ALL_DIALOGUES=[...POLICY_DIALOGUES,...CAMPUS_DIALOGUES];
export const CONVERSATION_SAVE_KEY='JejuCampusWalk.sumgyeol.conversations.v1';
export function createConversation(id,saved){
 const script=ALL_DIALOGUES.find(n=>n.id===id);if(!script)throw Error('Unknown NPC');
 const node=Object.hasOwn(script.nodes,saved?.node)&&!saved?.completed?saved.node:'hello';
 const index=Number.isInteger(saved?.index)?Math.max(0,Math.min(saved.index,script.nodes[node].lines.length-1)):0;
 return {script,node,index:saved?.completed?0:index,reply:''};
}
export const conversationNode=session=>session.script.nodes[session.node];
export function advanceConversation(session){
 const node=conversationNode(session);
 if(session.index<node.lines.length-1){session.index++;return true;}
 if(node.next){session.node=node.next;session.index=0;session.reply='';return true;}
 return false;
}
export function chooseConversation(session,index){
 const node=conversationNode(session),choice=node.choices?.[index];
 if(session.index!==node.lines.length-1||!Number.isInteger(index)||!choice)return false;
 session.node=choice.next;session.index=0;session.reply=choice.text;return true;
}
export function readConversations(storage){
 let saved;try{saved=JSON.parse(storage?.getItem(CONVERSATION_SAVE_KEY)||'{}');}catch{}
 return Object.fromEntries(ALL_DIALOGUES.map(q=>{const value=saved?.[q.id],session=createConversation(q.id,value);return[q.id,{node:session.node,index:session.index,completed:value?.completed===true}];}));
}
export function saveConversations(storage,records){try{storage.setItem(CONVERSATION_SAVE_KEY,JSON.stringify(records));return true;}catch{return false;}}
