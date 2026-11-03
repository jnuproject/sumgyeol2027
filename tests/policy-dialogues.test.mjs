import test from 'node:test';
import assert from 'node:assert/strict';
import {POLICY_DIALOGUES,ALL_DIALOGUES,CONVERSATION_SAVE_KEY,createConversation,conversationNode,advanceConversation,chooseConversation,readConversations,saveConversations} from '../dist/policy-dialogues.js';
test('every conversation branch reaches a farewell and cannot skip an unanswered choice',()=>{
 for(const npc of ALL_DIALOGUES){
  const traverse=(s,depth=0)=>{
   assert.ok(depth<40,'no loops or orphaned branches');const node=conversationNode(s);
   assert.ok(node.lines.every(l=>typeof l==='string'&&l.length>0));
   while(s.index<node.lines.length-1){assert.equal(chooseConversation(s,0),false);assert.ok(advanceConversation(s));}
   if(node.choices){assert.equal(advanceConversation(s),false);for(let i=0;i<node.choices.length;i++){const branch={...s};assert.ok(chooseConversation(branch,i));assert.equal(branch.reply,node.choices[i].text);traverse(branch,depth+1);}}
   else if(node.next){assert.ok(advanceConversation(s));traverse(s,depth+1);}
   else {assert.equal(node.end,true);assert.equal(advanceConversation(s),false);}
  };
  traverse(createConversation(npc.id));
 }
});
test('partial conversations resume and completed stories can be replayed from the greeting',()=>{
 const s=createConversation('council');chooseConversation(s,1);advanceConversation(s);
 const resumed=createConversation('council',{node:s.node,index:s.index});assert.equal(resumed.node,'where');assert.equal(resumed.index,1);
 const replay=createConversation('council',{node:'bye',index:1,completed:true});assert.equal(replay.node,'hello');assert.equal(replay.index,0);
 assert.equal(createConversation('festival',{node:'hello',index:1}).index,1);
 assert.equal(chooseConversation(replay,-1),false);assert.equal(chooseConversation(replay,.5),false);
});
test('damaged or unavailable local storage does not prevent a conversation',()=>{
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};
 const fresh=readConversations(broken);assert.equal(fresh.council.completed,false);assert.equal(saveConversations(broken,fresh),false);
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 storage.setItem(CONVERSATION_SAVE_KEY,'{bad');assert.deepEqual(readConversations(storage),fresh);
 storage.setItem(CONVERSATION_SAVE_KEY,JSON.stringify({council:{node:'toString',index:999},memory:{node:'listen',index:-3}}));
 const repaired=readConversations(storage);assert.equal(repaired.council.node,'hello');assert.equal(repaired.memory.index,0);
 assert.equal(saveConversations(storage,repaired),true);assert.deepEqual(readConversations(storage),repaired);
});

test('the owner-approved roster has fourteen distinct policies and no retired topics',()=>{
 const expected={memory:['제주4·3/기억','캠퍼스 내 ‘제주4·3 평화길’ 조성'],festival:['문화/대동제','JNU 연말숨플페'],outreach:['소통','찾아가는 총학생회 부스'],lounge:['복지','중앙도서관 복합휴식 라운지 조성'],bookcamp:['문화/대동제','북캠핑 IN ARA'],sports:['문화/대동제','통합체전 내 부스 활성화'],'student-zone':['문화/대동제','대동제 재학생존 확대'],accessibility:['인권/평등','배리어프리 아라캠퍼스'],interview:['교육취업','교내 AI 면접 스튜디오 구축'],scholarship:['교육취업','내장학찾기'],fitness:['시설/교통','피트니스센터 운동기구 교체'],'public-tumbler':['그린환경','공공텀블러 사업'],council:['숨결','JNU 상생협의체'],'meal-price':['숨결','제주대학교 학식 단가인하']};
 assert.equal(POLICY_DIALOGUES.length,14);assert.equal(new Set(POLICY_DIALOGUES.map(q=>q.policy)).size,14);
 for(const q of POLICY_DIALOGUES){assert.deepEqual([q.category,q.policy],expected[q.id]);assert.equal(q.name,'숨결 · '+q.category);}
 for(const id of ['voice','bus','escalator','reading','tumbler'])assert.equal(ALL_DIALOGUES.some(q=>q.id===id),false);
 const storage={getItem:()=>JSON.stringify({voice:{completed:true},tumbler:{completed:true}})};const saved=readConversations(storage);assert.equal(saved.outreach.completed,false);assert.equal(saved['public-tumbler'].completed,false);
});

test('campus activities are optional conversation endings with valid map destinations and policies remain unique',()=>{
 assert.equal(POLICY_DIALOGUES.length,14);assert.equal(ALL_DIALOGUES.length,20);assert.equal(new Set(ALL_DIALOGUES.map(q=>q.id)).size,20);const policies=new Set(POLICY_DIALOGUES.map(q=>q.id));let photo=0,map=0;
 for(const q of ALL_DIALOGUES)for(const node of Object.values(q.nodes))if(node.action){assert.equal(q.kind,'campus');assert.equal(node.end,true);if(node.action.kind==='photo')photo++;else {assert.equal(node.action.kind,'map');assert(policies.has(node.action.target));map++;}}
 assert(photo>=4&&map>=4);
});
