import {EXTRA_POLICY_DIALOGUES} from './policy-encounters.js?v=screen-r50';
import {CAMPUS_DIALOGUES} from './campus-dialogues.js?v=screen-r50';
export {CAMPUS_DIALOGUES};
// Narrative adaptations of the user's three populated planning-document tabs and the user's escalator policy image.
// These conversations describe proposals, not confirmed operating services.
export const POLICY_DIALOGUES=[
 {id:'memory',category:'제주4·3/기억',name:'숨결 · 제주4·3/기억',place:'정문 보도',color:'#c46d81',topic:'걸음에 담긴 기억',policy:'제주대 4·3 평화길',summary:'캠퍼스의 추모공간을 하나의 길로 잇고, 짧은 오디오 가이드와 함께 일상에서 4·3을 기억하는 구상.',source:'https://docs.google.com/document/d/1qlYzuaXI4mRgDaOc3JZ5vBsnUvU3q24We7K8dfq6oZw/edit?tab=t.dnxbswcvr9h',nodes:{
  hello:{lines:['안녕. 산책 중이야? 늘 지나던 길인데, 천천히 보면 다른 이야기가 보이더라.'],choices:[{text:'무슨 이야기?',next:'places'},{text:'오늘은 좀 조용히 걷고 싶었어.',next:'quiet'}]},
  quiet:{lines:['그런 날 있지. 나도 오늘은 그냥 풍경을 보면서 걷고 있었어.','캠퍼스 안의 기억 공간들을 한 길로 잇는다면, 이렇게 평소에 걷는 시간도 조금 달라질 것 같아서.'],next:'guide'},
  places:{lines:['학교 곳곳에 4·3을 기억하는 공간들을 잇는 길을 만들면 어떨까 생각하고 있어.','특정한 날에만 찾아가는 곳이 아니라, 수업 가는 길에도 잠깐 멈춰서 의미를 만날 수 있게.'],next:'guide'},
  guide:{lines:['우리가 기획하는 「제주대 4·3 평화길」이 그런 구상이야.','공간마다 짧은 오디오 이야기를 QR로 들을 수 있게 하면, 처음 온 사람도 왜 이곳에 서 있는지 알 수 있겠지.'],choices:[{text:'이야기를 들으며 걸으면 다르게 느껴지겠다.',next:'listen'},{text:'걷기 프로그램도 같이 하는 거야?',next:'walk'}]},
  listen:{lines:['응. 장소의 의미와 4·3의 이야기가 같이 전해졌으면 해.','오디오 내용은 관련 전문기관의 검수를 거쳐 만들려는 계획이야. 정확하게 전하는 게 중요하니까.'],next:'bye'},
  walk:{lines:['4·3 주간에는 걷기나 러닝 프로그램으로도 이어보려 해.','빨리 도착하거나 순위를 겨루는 것보다, 그 공간을 지나며 기억하는 시간이 중심이야.'],next:'bye'},
  bye:{lines:['아직 길과 프로그램을 구체화하는 단계야. 보행 안전과 접근성도 살피면서 준비해야 하고.','다음에 이 길을 걸을 때, 오늘 나눈 이야기가 잠깐 떠오르면 좋겠다. 천천히 걸어가!'],end:true}
 }},
 {id:'festival',category:'문화/대동제',name:'숨결 · 문화/대동제',place:'경상대 앞 보행로',color:'#4897ad',topic:'수업 끝나고 뭐 해?',policy:'숨플페',summary:'낮에는 체험 부스와 휴식 공간, 밤에는 참여형 시상식·토크·공연으로 한 해를 함께 마무리하는 연말제 구상.',source:'https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit?tab=t.7a683j9zwd6d',nodes:{
  hello:{lines:['아, 수업 끝났어? 나는 한 해가 끝날 때쯤 학교가 괜히 아쉽더라.','막상 시험이 끝나도 친구들이랑 다 같이 쉬고 놀 만한 시간이 별로 없는 것 같아서.'],choices:[{text:'나는 그냥 푹 쉬고 싶어.',next:'rest'},{text:'친구들이랑 학교에서 놀면 좋겠는데.',next:'friends'}]},
  rest:{lines:['그럼 빈백에 푹 앉아서 영상 보다가, 맛있는 거 하나 사 먹는 건 어때?','꼭 공연을 처음부터 끝까지 봐야 하는 게 아니라, 잠깐 들렀다 쉬어도 되는 공간이면 좋겠어.'],next:'plan'},
  friends:{lines:['게임 부스나 포토존에서 놀고, 한 해 동안 못 했던 얘기를 메시지로 남기는 거지.','학우들이 직접 운영하는 부스도 있으면, 구경하는 축제에서 같이 만드는 축제가 될 것 같아.'],next:'plan'},
  plan:{lines:['그래서 「숨플페」라는 연말제를 기획하고 있어. 낮에는 편히 머물고, 밤에는 다 같이 한 해를 마무리하는 거야.'],choices:[{text:'낮에 구경하다가 밤까지 있고 싶어.',next:'invitation'},{text:'밤에는 뭐 하는데?',next:'night'}]},
  invitation:{lines:['그 흐름을 이어주려고 부스 스탬프와 초대장을 연결하는 구상이 있어.','부스를 체험하고 받은 초대장의 응모번호를 밤의 경품 추첨에도 쓰는 방식이야.'],next:'night'},
  night:{lines:['누구나 가볍게 참여하는 시상식 사이에 토크와 공연을 넣어보려 해.','한 사람의 긴 공연만 보는 것보다, 다 같이 웃고 한 해를 돌아볼 수 있게.'],choices:[{text:'그런 연말이면 좀 덜 허전하겠다.',next:'bye'},{text:'나도 부스를 만들어보고 싶네.',next:'booth'}]},
  booth:{lines:['그런 학우들이 직접 참여할 수 있도록 부스 운영팀을 모집하는 내용도 기획안에 담겨 있어.','네가 좋아하는 걸 친구들이랑 나누는 자리가 되면 좋겠다.'],next:'bye'},
  bye:{lines:['아직 준비하는 계획이지만, 쉼이랑 참여가 함께 있는 연말을 만들어보려는 거야.','오늘도 고생했어. 잠깐 쉬었다 가!'],end:true}
 }},
 {id:'voice',category:'소통',name:'숨결 · 소통',place:'학생회관 앞 숨결 부스',color:'#7b83b5',topic:'건의한 다음에는?',policy:'JNU상생협의회',summary:'학우들의 요구를 모아 학교 본부와 정기적으로 논의하고, 이행 상황과 진행 과정을 점검해 공유하는 소통 구조 구상.',source:'https://docs.google.com/document/d/1RNuE4E4FGFz-o-oba5O2mbU9xEljBUsJaJsBGs9wzh0/edit?tab=t.u3vqo54dd2a',nodes:{
  hello:{lines:['안녕! 학생회관 가는 길이야? 아까 친구랑 학교에 바라는 점을 얘기하고 있었어.'],choices:[{text:'건의해도 그대로일 것 같던데…',next:'doubt'},{text:'내 의견이 어디까지 전해지는지 모르겠어.',next:'where'}]},
  doubt:{lines:['그렇게 느낄 수 있지. 학생회가 듣는 것만으로 해결되는 일도 아니니까.','시설이나 수업 같은 일은 학교 본부의 예산과 행정 결정이 필요한 경우가 있거든.'],next:'council'},
  where:{lines:['맞아. 누가 듣고, 어디서 논의하고, 그 뒤엔 어떻게 됐는지 보여야 하잖아.','그래서 한 번 의견을 전달하고 끝나는 방식보다 계속 이어지는 자리가 필요하다고 생각해.'],next:'council'},
  council:{lines:['우리가 기획하는 「JNU상생협의회」는 학우들의 요구를 모아 학교 본부와 정기적으로 논의하는 구조야.','먼저 실무 협의로 예산이나 행정적인 부분을 살피고, 학생 대표와 본부가 함께 얘기하는 자리를 만들려는 거지.'],choices:[{text:'그래도 회의만 하고 끝나면?',next:'followup'},{text:'일반 학우도 내용을 알 수 있어?',next:'public'}]},
  followup:{lines:['그다음이 중요해. 논의한 안건이 실제로 어떻게 진행되는지 다시 점검해야지.','이행 상황을 학우들과 공유하고, 더 논의할 일은 다음 자리로 이어가는 것까지 기획에 담고 있어.'],next:'bye'},
  public:{lines:['일반 학우가 지켜볼 수 있는 공개 회의와, 진행 과정·성과 공유를 구상하고 있어.','내가 낸 목소리가 어떻게 다뤄지는지 알 수 있어야, 소통이 계속될 수 있으니까.'],next:'bye'},
  bye:{lines:['아직 이런 구조를 만들기 위한 기획안이야. 듣는 데서 끝내지 않고, 논의와 점검까지 이어가자는 거지.','다음에 학교에 바라는 게 생기면 혼자만의 생각이라고 넘기지 않았으면 좋겠어. 얘기 나눠줘서 고마워!'],end:true}
 }},
 {id:'escalator',category:'시설/교통',name:'숨결 · 시설/교통',place:'중앙도서관 오르막 입구',color:'#008dcc',topic:'도서관 가는 길이 조금 가벼워진다면',policy:'학내 에스컬레이터 설치',summary:'중앙도서관으로 올라가는 계단에 에스컬레이터를 설치해 자주 오가는 길의 이동 부담을 줄이려는 구상.',source:null,nodes:{
  hello:{lines:['도서관 올라가는 길, 생각보다 숨차지? 책이 많은 날이면 더 힘들더라.'],choices:[{text:'자주 오르려니 은근히 힘들어.',next:'why'},{text:'여기에 에스컬레이터를 놓는다고?',next:'plan'}]},
  why:{lines:['매일 지나는 길의 부담이 쌓이니까, 이곳의 이동을 조금 가볍게 만들면 어떨까 생각했어.','그래서 중앙도서관으로 올라가는 계단에 에스컬레이터를 설치하는 정책을 이야기하고 있어.'],next:'plan'},
  plan:{lines:['지금 보이는 모습은 그 설치 구상을 미리 표현한 거야.','에스컬레이터와 일반 계단을 나란히 두어, 올라가는 방법을 고를 수 있게 했어.'],choices:[{text:'계단으로도 계속 다닐 수 있겠네.',next:'stairs'},{text:'매일 오가는 길이 좀 달라지겠다.',next:'daily'}]},
  stairs:{lines:['응. 에스컬레이터 옆의 일반 계단도 함께 이용하는 모습이야.','한 가지 방법만 남기는 대신, 이 길을 다니는 사람들의 이동을 조금 더 편하게 만들자는 거지.'],next:'bye'},
  daily:{lines:['맞아. 거창한 하루가 아니라, 도서관에 가고 다시 내려오는 평소의 시간이 조금 편해졌으면 해.'],next:'bye'},
  bye:{lines:['이 길을 자주 지나는 학우들에게 어떤 변화가 필요할지 같이 생각해보면 좋겠어. 조금 쉬었다 올라가!'],end:true}
 }}
,...EXTRA_POLICY_DIALOGUES
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
