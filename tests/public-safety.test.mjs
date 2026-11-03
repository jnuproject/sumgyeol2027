import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {POLICY_DIALOGUES,ALL_DIALOGUES} from '../dist/policy-dialogues.js';
import {renderConversationJournal} from '../dist/story-game.js';

test('completed policy journals retain all stories without internal source links',()=>{
 const records=Object.fromEntries(ALL_DIALOGUES.map(q=>[q.id,{completed:true}]));
 const html=renderConversationJournal(records);
 for(const q of POLICY_DIALOGUES){assert(html.includes(q.policy));assert(html.includes(q.summary));}
 assert.doesNotMatch(html,/<a\b|href\s*=|기획안|https?:\/\//i);
});

test('public assets and repository text contain no internal document links or personal home paths',()=>{
 const root=new URL('../',import.meta.url);
 const textExtensions=new Set(['.js','.mjs','.json','.html','.css','.md','.txt','.svg','.py','.yml','.yaml','.webmanifest']);
 const forbidden=/https?:\/\/(?:docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/|drive\.google\.com\/(?:drive|folders)\/|(?:www\.)?notion\.(?:so|site)\/)|\/Users\/[A-Za-z0-9_-]+\//i;
 function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.name==='.git')continue;
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())scan(file);
  else if(textExtensions.has(path.extname(file)))assert.doesNotMatch(fs.readFileSync(file,'utf8'),forbidden,path.relative(root.pathname,file));
 }}scan(root.pathname);
 for(const q of POLICY_DIALOGUES)for(const key of ['source','sourceSection','sourceNote'])assert.equal(key in q,false);
 const catalog=JSON.parse(fs.readFileSync(new URL('../dist/policy-sources.json',import.meta.url),'utf8'));
 assert.equal(catalog.sources,undefined);
 assert.equal(catalog.policies.length,14);
 for(const q of catalog.policies)assert.deepEqual(Object.keys(q).sort(),['category','id','policy','summary']);
});
