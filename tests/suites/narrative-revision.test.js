import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadEngine} from '../helpers/load-engine.js';
const E=await loadEngine();after(()=>E.teardown());
const revision=JSON.parse(fs.readFileSync(new URL('../../data/story/narrative-revision.json',import.meta.url),'utf8'));
const scenes=E.window.__narrationTest.STORY_SCENES;
test('all 18 optional story tracks load their revised opening and resolution',()=>{
  assert.equal(Object.keys(revision.scenes).length,36);
  for(const [key,patch]of Object.entries(revision.scenes)) {
    assert.equal(scenes[key].body,patch.body,key);
    for(const[phase,lines]of Object.entries(patch.phases))assert.deepEqual(Array.from(scenes[key].acts.find(a=>a.phase===phase).lines.slice(0,lines.length)),lines,key+' '+phase);
  }
});
test('applying the writing revision is idempotent and preserves every choice and callback condition',()=>{
  const contract=()=>JSON.stringify(Object.entries(scenes).map(([key,s])=>[key,s.acts?.filter(a=>a.choice||a.branches).map(a=>({choice:a.choice,branches:a.branches}))]));
  const before=contract(),all=JSON.stringify(scenes);
  E.window.StoryMode.applyNarrativeRevision(revision);
  assert.equal(contract(),before);assert.equal(JSON.stringify(scenes),all);
});
