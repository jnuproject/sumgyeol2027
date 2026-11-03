import {EXTRA_POLICY_DIALOGUES} from './policy-encounters.js?v=policy-r68';
import {CAMPUS_DIALOGUES} from './campus-dialogues.js?v=roster-r62';
export {CAMPUS_DIALOGUES};
// Names/categories follow the owner's final roster. Policy claims follow the supplied plans.
export const POLICY_DIALOGUES=[
{"id":"memory","category":"제주4.3/기억","name":"숨결 · 제주4.3/기억","place":"정문 보도","color":"#c46d81","topic":"이 길에 있는 4·3의 기억","policy":"캠퍼스 내 ‘제주4.3 평화길’ 조성","summary":"캠퍼스에 4·3 추모공간을 조성·연결하고, QR 오디오 가이드와 4·3 주간 걷기·러닝 프로그램을 연계하는 계획.","source":"https://docs.google.com/document/d/1qlYzuaXI4mRgDaOc3JZ5vBsnUvU3q24We7K8dfq6oZw/edit","nodes":{"hello":{"lines":["안녕, 산책 중이야? 학교 안에 4·3을 기억하며 걸을 수 있는 길을 만들려는 이야기를 들려줄까?"],"choices":[{"text":"어디에 있어?","next":"places"},{"text":"들어는 봤는데 잘 모르겠어.","next":"quiet"}]},"quiet":{"lines":["추모공간을 조성하고, 그 공간들을 하나의 길로 이어보려고 해. 평소에도 걸으며 4·3을 기억할 수 있도록."],"next":"guide"},"places":{"lines":["동백정원과 야외음악당 옆길, 박물관 등 주요 공간에 추모공간을 조성하고 연결하려는 계획이야. 실제 경로는 현장 점검과 협의를 거쳐 정하려고 해."],"next":"guide"},"guide":{"lines":["「캠퍼스 내 제주4.3 평화길 조성」을 추진하려고 해. 장소마다 QR을 두고 짧은 오디오 설명을 들을 수 있게 준비하는 거야."],"choices":[{"text":"설명을 들으면 더 잘 알 수 있겠다.","next":"listen"},{"text":"같이 걷는 행사도 열어?","next":"walk"}]},"listen":{"lines":["응. 그 장소가 어떤 의미인지 알고 걸으면 다르게 느껴질 것 같아. 설명은 관련 전문기관의 검수를 받아서 만들려고 해."],"next":"bye"},"walk":{"lines":["4·3 주간에 걷기나 러닝 프로그램도 함께 열려고 해. 순위를 겨루기보다는 장소의 의미를 알아가는 데 초점을 두고."],"next":"bye"},"bye":{"lines":["아직 준비 중이라 길의 안전이나 접근성도 살펴야 해. 관심 가져줘서 고마워. 산책 잘 다녀와."],"end":true}},"sourceSection":"캠퍼스 내 ‘제주대 4·3 평화길’ 조성 및 4.3km 러닝 챌린지 + 캠퍼스 오디오 가이드 맵","sourceNote":"2026-11-03 제공 기획안 본문 대조. 정책명·카테고리는 사용자의 최종 메타버스 목록을 우선하며, 설명은 해당 원문 정책의 추진안이다."},
{"id":"festival","anchor":[-191,-10],"category":"문화/대동제","name":"숨결 · 문화/대동제","place":"대운동장 부스 거리","color":"#4897ad","topic":"시험 끝나면 뭐 하지?","policy":"JNU 연말숨플페","summary":"옴팡밭~야외음악당의 부스·휴식 공간, 초대장·경품 추첨, 야간 참여형 시상식·토크·공연으로 한 해를 마무리하는 연말제 계획.","source":"https://docs.google.com/document/d/1gdfJDxj2j50kj7joslDJeW3YYY_NRPychDD2pErMM_4/edit","nodes":{"hello":{"lines":["시험 끝나면 뭐 할 거야? 나는 친구들이랑 놀고 싶은데.","막상 끝나면 다들 바로 집에 가더라."],"choices":[{"text":"일단 푹 자고 싶어.","next":"rest"},{"text":"학교에서 다 같이 놀면 좋겠는데.","next":"friends"}]},"rest":{"lines":["그럼 편한 의자에 앉아서 영상 보고, 간식 먹으면서 쉬는 건 어때? 잠깐 들렀다 가도 되고."],"next":"plan"},"friends":{"lines":["게임 부스나 포토존도 있으면 좋겠다. 친구들이랑 부스를 직접 열어봐도 재밌을 것 같고."],"next":"plan"},"plan":{"lines":["「JNU 연말숨플페」는 옴팡밭에서 야외음악당까지 부스를 연결하고, 부스·휴식 공간에서 야간 시상식·토크·공연으로 이어지는 연말제 계획이야.","지금 둘러보는 운동장의 대동제와는 별개의 행사야."],"choices":[{"text":"부스 돌아다니면 재밌겠다.","next":"invitation"},{"text":"밤에는 또 뭐 해?","next":"night"}]},"invitation":{"lines":["부스에서 스탬프를 모으면 초대장을 받는 방식도 생각하고 있어. 초대장 번호로 밤에 경품 추첨도 하고."],"next":"night"},"night":{"lines":["베스트 드레서처럼 학우들이 참여하는 시상식 사이에 토크와 공연을 넣는 구상이야. 총학생회 활동 영상과 메시지 작성도 함께 준비해 한 해를 돌아보려고 해."],"choices":[{"text":"시험 끝나고 가면 딱 좋겠다.","next":"bye"},{"text":"나도 부스 열어보고 싶어.","next":"booth"}]},"booth":{"lines":["좋지! 기획안에도 부스 운영팀을 모집하는 내용이 있어. 네가 좋아하는 걸로 친구들이랑 준비해보면 재밌겠다."],"next":"bye"},"bye":{"lines":["아직 기획 중이지만, 시험 끝나고 같이 놀 자리가 생기면 좋겠어. 얘기 들어줘서 고마워!"],"end":true}},"sourceSection":"숨플페","sourceNote":"2026-11-03 제공 기획안 본문 대조. 정책명·카테고리는 사용자의 최종 메타버스 목록을 우선하며, 설명은 해당 원문 정책의 추진안이다."},
{"id":"outreach","category":"소통","name":"숨결 · 소통","policy":"찾아가는 총학생회 부스","place":"학생회관 앞 숨결 부스","anchor":[-97,-18],"color":"#268fab","topic":"지나가는 길에 잠깐 얘기할래?","summary":"유동 인구가 많은 곳과 행사 현장에서 공유우산 즉석 대여·길거리 신문고 투표·팝업 이벤트를 운영하고 결과와 후속 조치를 공유하는 계획.","source":"https://docs.google.com/document/d/1S6U8Z2qC_jgUYqV4znknPQt1WBf_zaqgnIQo4EYd-AU/edit","sourceNote":"2026-11-03 제공 기획안 본문 대조. 정책명·카테고리는 사용자의 최종 메타버스 목록을 우선하며, 설명은 해당 원문 정책의 추진안이다.","nodes":{"hello":{"lines":["안녕! 학교 다니면서 불편했던 거 있어? 지나가는 길에 잠깐 얘기하고 가도 돼."],"choices":[{"text":"이런 작은 얘기도 해도 돼?","next":"first"},{"text":"학생회 찾아가기는 좀 어렵더라.","next":"second"}]},"first":{"lines":["그럼. 매일 겪는 작은 불편부터 듣고 싶어."],"next":"plan"},"second":{"lines":["맞아. 일부러 찾아가서 말하려면 망설여질 때도 있지."],"next":"plan"},"plan":{"lines":["「찾아가는 총학생회 부스」는 학우들이 많은 곳이나 행사 현장으로 직접 찾아가는 정책이야. 상황에 맞춰 즉석 대여소, 길거리 신문고 투표, 팝업 이벤트를 운영하려고 해."],"choices":[{"text":"부스에서 뭘 할 수 있어?","next":"detailA"},{"text":"언제 어디로 오는지 어떻게 알아?","next":"detailB"}]},"detailA":{"lines":["갑자기 비가 오면 공유우산을 빌려주고, 의견이 필요한 사안은 보드판과 스티커로 현장 투표를 하는 식이야.","통합체전이나 대동제에서는 사업 안내·의견 수렴·굿즈와 참여 이벤트를 상황에 맞춰 구성하려고 해. 투표 결과와 후속 조치도 공개하는 계획이야."],"next":"bye"},"detailB":{"lines":["우천 상황이나 행사 일정에 맞춰 운영 여부를 정하고, 부스 위치와 운영시간은 총학생회 공식 SNS로 미리 안내하는 계획이야."],"next":"bye"},"bye":{"lines":["학교에서 마주쳤을 때 편하게 말을 걸 수 있으면 좋겠어. 얘기 들어줘서 고마워!"],"end":true}},"sourceSection":"찾아가는 총학생회 부스"},
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
