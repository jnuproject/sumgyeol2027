import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {POLICY_DIALOGUES} from '../dist/policy-dialogues.js';
const source=JSON.parse(fs.readFileSync(new URL('../dist/policy-sources.json',import.meta.url),'utf8'));
const by=Object.fromEntries(POLICY_DIALOGUES.map(q=>[q.id,q]));
const dialogue=id=>Object.values(by[id].nodes).flatMap(n=>n.lines).join(' ');
test('every active policy has a matching source section, category and summary',()=>{
 assert.equal(source.policies.length,14);
 for(const q of POLICY_DIALOGUES){
  const match=source.policies.find(p=>p.id===q.id);assert(match);
  for(const key of ['policy','category','summary','source','sourceSection'])assert.equal(match[key],q[key]);
  assert.match(q.source,/^https:\/\/docs\.google\.com\/document\/d\//);assert(q.sourceSection);
  assert.doesNotMatch(dialogue(q.id),/목록에.*없|전달받은 목록|아직.*목록에.*정해/);
 }
});
test('shared tumbler and gym policies retain their actual operating constraints',()=>{
 const tumbler=dialogue('public-tumbler');
 for(const term of ['기증','학생회관 2층','QR','당일','300원','세척']){
  // The source's same-day rule is expressed conversationally in the dialogue.
  assert(tumbler.includes(term==='당일'?'사용한 날':term),term);
 }
 const gym=dialogue('fitness');for(const term of ['1:1','총 기구 수','설문','투표','방학'])assert(gym.includes(term));
});
test('student-zone policy includes all three zones and enrollee entry/no-show rules',()=>{
 const text=dialogue('student-zone');for(const term of ['세 구역','아라존','재학생 스탠딩존','재학생 전용 돗자리존','외부인 모두','학생증','종이 팔찌','노쇼','농구필드'])assert(text.includes(term),term);
});
test('planning conditions and separate events are not converted into guaranteed benefits',()=>{
 const meal=dialogue('meal-price');assert(meal.includes('조합원'));assert(meal.includes('협의'));assert(meal.includes('특정 금액으로 내린다고 확정한 건 아니야'));
 assert.doesNotMatch(meal,/2000원|2,000원|500원/);
 assert(dialogue('interview').includes('공간 배정과 예산·운영 주체는 협의'));
 assert(dialogue('festival').includes('대동제와는 별개의 행사'));
 assert(dialogue('lounge').includes('취식'));assert(dialogue('lounge').includes('파워냅존'));
 assert(dialogue('bookcamp').includes('선착순 사전 예약'));
 assert(dialogue('accessibility').includes('시각화재경보기'));
});
