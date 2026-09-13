import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine } from '../helpers/load-engine.js';
let E, W, G, store, original, fail;
const clone = x => JSON.parse(JSON.stringify(x));
const slot = (id, name = 'Pikachu') => ({ id, name, build: { m: ['Thunderbolt','Quick Attack','Thunder Wave','Protect'], a: 'Static', n: 'Timid', i: 'None', evs: {hp:0,atk:0,def:0,spa:0,spd:0,spe:0} } });
before(async () => {
  E = await loadEngine(); W = E.window; original = clone(W.StoryMode.state);
  store = new Map();
  Object.defineProperty(W,'localStorage',{configurable:true,value:{
    getItem:k=>store.get(k) ?? null,
    setItem:(k,v)=>{if(fail?.(k,v))throw new Error('Quota exceeded');store.set(k,String(v));},
    removeItem:k=>store.delete(k),clear:()=>store.clear(),
  }});
  W.eval(readFileSync(new URL('../../game-upgrades.js',import.meta.url),'utf8'));
  G = W.GameUpgrades;
});
after(()=>E.teardown());
beforeEach(()=>{
  E.reset(); G.close(); store.clear(); fail=null; W.__storyRestoreReady=false; W.__storyExternalSave=false; W.__storySaveError=null; G.saveResult(true);
  W.__storyTest.sm={...clone(original),active:true,eventIndex:0,badges:0,gold:10000,team:[slot('first')],pcBox:[slot('second','Eevee'),slot('third','Bulbasaur')]};
});

test('Notebook and practice are deterministic, keyboard-dismissable and preserve progress',()=>{
  const before=JSON.stringify(W.StoryMode.state);
  for(const tab of ['next','team','story','rules']) G.openNotebook(tab);
  G.openPractice();
  const buttons=[...W.document.querySelectorAll('.upgrade-dialog button')];
  buttons.find(b=>b.textContent==='It is four times effective').click();
  assert.match(W.document.querySelector('.upgrade-feedback').textContent,/Correct/);
  assert.equal(JSON.stringify(W.StoryMode.state),before);
  W.document.querySelector('.upgrade-overlay').dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(W.document.querySelector('.upgrade-dialog'),null);
});

test('save failures retain the success timestamp and expose recoverable in-memory progress',()=>{
  assert.equal(W.StoryMode.upgrades.save(),true);
  const saved=store.get('pbs_story_save'), timestamp=W.StoryMode.state._lastSave;
  W.StoryMode.state.gold=11111;
  fail=k=>k==='pbs_story_save';
  assert.equal(W.StoryMode.upgrades.save(),false);
  assert.equal(store.get('pbs_story_save'),saved);
  assert.equal(W.StoryMode.state._lastSave,timestamp);
  assert.ok(W.document.getElementById('upgrade-save-alert'));
  assert.equal(G.makeBackup().entries.pbs_story_save.gold,11111);
  fail=null; assert.equal(W.StoryMode.upgrades.save(),true);
  assert.equal(W.document.getElementById('upgrade-save-alert'),null);
});

test('a save from another tab cannot be silently overwritten by stale progress',()=>{
  W.StoryMode.upgrades.save();
  const fresh=JSON.parse(store.get('pbs_story_save'));fresh.gold=1234;
  store.set('pbs_story_save',JSON.stringify(fresh));
  W.dispatchEvent(new W.StorageEvent('storage',{key:'pbs_story_save',newValue:JSON.stringify(fresh)}));
  assert.equal(W.StoryMode.upgrades.save(),false);
  assert.equal(JSON.parse(store.get('pbs_story_save')).gold,1234);
  assert.ok(W.document.getElementById('upgrade-save-alert'));
});

test('complete backups include collection and settings but exclude connection tokens',()=>{
  store.set('pbs_story_meta',JSON.stringify({achievements:{test:1}}));
  store.set('pbs_settings',JSON.stringify({musicVolume:0.2}));
  store.set('online_host_token','private');
  const backup=G.makeBackup();
  assert.deepEqual(Object.keys(backup.entries).sort(),['pbs_settings','pbs_story_meta','pbs_story_save']);
  assert.equal(backup.entries.pbs_story_meta.achievements.test,1);
  assert.equal(JSON.stringify(backup).includes('private'),false);
  assert.doesNotThrow(()=>G.validateBackup(backup));
});

test('invalid imports reject malformed progress, storage, moves and prototype keys',()=>{
  for(const change of [b=>b.entries.pbs_story_save.eventIndex=999,
    b=>b.entries.pbs_story_save.team[0].build.m=[42],b=>b.entries.pbs_story_save.pcBox={},
    b=>b.entries.pbs_settings=[],b=>b.entries.secret={},b=>b.entries.pbs_story_save.gold=-1]) {
    const backup=G.makeBackup();change(backup);assert.throws(()=>G.validateBackup(backup));
  }
  assert.throws(()=>G.validateBackup(JSON.parse('{"__proto__":{"polluted":true}}')));
  assert.equal({}.polluted,undefined);
});

test('partial import failure rolls every written key back',()=>{
  W.StoryMode.upgrades.save();store.set('pbs_settings','{"musicVolume":0.7}');
  const before=new Map(store), backup=G.makeBackup();backup.entries.pbs_story_save.gold=123;
  let failed=false;
  fail=k=>{if(k==='pbs_settings'&&!failed){failed=true;return true;}return false;};
  assert.throws(()=>G.restoreBackup(backup),/retained for recovery/);
  assert.deepEqual(store,before);
  assert.equal(W.__storyRestoreReady,false);
});

test('restore cannot replace an active battle or be overwritten by the previous in-memory run',()=>{
  const backup=G.makeBackup();backup.entries.pbs_story_save.gold=4321;
  Object.assign(E.engine.state,{pActive:{},fActive:{},isOver:false});
  assert.throws(()=>G.restoreBackup(backup),/Finish the battle/);
  E.engine.state.isOver=true;
  assert.equal(G.restoreBackup(backup),true);
  assert.equal(W.StoryMode.upgrades.save(),false);
  assert.equal(JSON.parse(store.get('pbs_story_save')).gold,4321);
  assert.equal(G.makeBackup().entries.pbs_story_save.gold,4321);
});

test('favorite protection works in both party and storage',async()=>{
  let prompts=0;W.showGameConfirm=async()=>{prompts++;return true;};W.showGameAlert=()=>{};
  assert.equal(W.StoryMode.upgrades.favorite('second'),true);
  await W.StoryMode.pcRelease('second'); await W.StoryMode.pcSell('second');
  assert.equal(prompts,0);assert.equal(W.StoryMode.state.pcBox.length,2);
  G.openNotebook('team');assert.match(W.document.querySelector('.upgrade-dialog').textContent,/Protect partners in storage/);
  assert.equal(W.StoryMode.upgrades.favorite('second'),false);
});

test('delayed release and duplicate sale confirmations resolve stable identities only',async()=>{
  const resolvers=[];W.showGameConfirm=()=>new Promise(r=>resolvers.push(r));
  const release=W.StoryMode.pcRelease('second');
  W.StoryMode.state.pcBox.reverse();resolvers.shift()(true);await release;
  assert.deepEqual(clone(W.StoryMode.state.pcBox.map(m=>m.id)),['third']);
  const first=W.StoryMode.pcSell('third'),second=W.StoryMode.pcSell('third');
  resolvers.shift()(true);await first;
  const gold=W.StoryMode.state.gold;resolvers.shift()(true);await second;
  assert.equal(W.StoryMode.state.gold,gold);assert.equal(W.StoryMode.state.pcBox.length,0);
});

test('early EV purchase and vitamin entry points do not bypass facility gates',async()=>{
  const state=W.StoryMode.state;state.inventory={vitamin:1};
  const before=JSON.stringify({gold:state.gold,team:state.team,inventory:state.inventory});
  await W.StoryMode.evTrainerApplyPreset(0,'physical-fast');
  await W.StoryMode.evTrainerApplyPresetWithVitamin(0,'physical-fast');
  assert.equal(JSON.stringify({gold:state.gold,team:state.team,inventory:state.inventory}),before);
});

test('untimed camp activities complete or cancel exactly once',()=>{
  const outcomes=[];G.campActivity({name:'Camp'},v=>outcomes.push(v));
  const button=[...W.document.querySelectorAll('.upgrade-dialog button')].find(b=>b.textContent==='Spend time together');
  button.click();button.click();assert.deepEqual(outcomes,[true]);
  G.campActivity({name:'Camp'},v=>outcomes.push(v));
  W.document.querySelector('.upgrade-overlay').dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.deepEqual(outcomes,[true,false]);assert.equal(W.document.querySelector('.upgrade-dialog'),null);
});

test('interrupted import recovery runs before game settings and save hydration',()=>{
  const html=readFileSync(new URL('../../battle.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('<script src="game-upgrades.js"')<html.indexOf("const _pbsEarly"));
  store.set('pbs_restore_pending',JSON.stringify({pbs_story_save:'{"gold":10}',pbs_settings:null}));
  store.set('pbs_story_save','{"gold":100}');store.set('pbs_settings','{}');
  W.eval(readFileSync(new URL('../../game-upgrades.js',import.meta.url),'utf8'));
  assert.equal(store.get('pbs_story_save'),'{"gold":10}');assert.equal(store.has('pbs_settings'),false);
  assert.equal(store.has('pbs_restore_pending'),false);
});
