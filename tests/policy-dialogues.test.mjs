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
 const s=createConversation('voice');chooseConversation(s,1);advanceConversation(s);
 const resumed=createConversation('voice',{node:s.node,index:s.index});assert.equal(resumed.node,'where');assert.equal(resumed.index,1);
 const replay=createConversation('voice',{node:'bye',index:1,completed:true});assert.equal(replay.node,'hello');assert.equal(replay.index,0);
 assert.equal(createConversation('festival',{node:'hello',index:1}).index,1);
 assert.equal(chooseConversation(replay,-1),false);assert.equal(chooseConversation(replay,.5),false);
});
test('damaged or unavailable local storage does not prevent a conversation',()=>{
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};
 const fresh=readConversations(broken);assert.equal(fresh.voice.completed,false);assert.equal(saveConversations(broken,fresh),false);
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 storage.setItem(CONVERSATION_SAVE_KEY,'{bad');assert.deepEqual(readConversations(storage),fresh);
 storage.setItem(CONVERSATION_SAVE_KEY,JSON.stringify({voice:{node:'toString',index:999},memory:{node:'listen',index:-3}}));
 const repaired=readConversations(storage);assert.equal(repaired.voice.node,'hello');assert.equal(repaired.memory.index,0);
 assert.equal(saveConversations(storage,repaired),true);assert.deepEqual(readConversations(storage),repaired);
});

test('each policy has one unique script and escalator proposal does not promise a completed installation',()=>{
 assert.equal(new Set(POLICY_DIALOGUES.map(q=>q.policy)).size,POLICY_DIALOGUES.length);assert.equal(new Set(POLICY_DIALOGUES.map(q=>q.id)).size,POLICY_DIALOGUES.length);
 const script=POLICY_DIALOGUES.find(q=>q.id==='escalator');assert.ok(script);const lines=Object.values(script.nodes).flatMap(n=>n.lines).join(' ');assert.match(lines,/구상|기획|계획/);assert.match(lines,/계단/);assert.equal(script.source,null);
});

test('NPC names use the policy category and preserve the existing conversation/save identifiers',()=>{
 const expected={memory:'제주4·3/기억',festival:'문화/대동제',voice:'소통',escalator:'시설/교통',bookcamp:'문화/대동제',sports:'문화/대동제',accessibility:'인권/평등',interview:'교육취업',scholarship:'교육취업',reading:'시설/교통',bus:'시설/교통',tumbler:'그린환경'};
 for(const q of POLICY_DIALOGUES){assert.equal(q.category,expected[q.id]);assert.equal(q.name,'숨결 · '+expected[q.id]);assert.equal(createConversation(q.id).script.id,q.id);}
});

test('campus activities are optional conversation endings with valid map destinations and policies remain unique',()=>{
 assert.equal(POLICY_DIALOGUES.length,12);assert.equal(ALL_DIALOGUES.length,18);assert.equal(new Set(ALL_DIALOGUES.map(q=>q.id)).size,18);const policies=new Set(POLICY_DIALOGUES.map(q=>q.id));let photo=0,map=0;
 for(const q of ALL_DIALOGUES)for(const node of Object.values(q.nodes))if(node.action){assert.equal(q.kind,'campus');assert.equal(node.end,true);if(node.action.kind==='photo')photo++;else {assert.equal(node.action.kind,'map');assert(policies.has(node.action.target));map++;}}
 assert(photo>=4&&map>=4);
});
