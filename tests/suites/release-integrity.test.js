import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8');
function worker(options={}) {
  const handlers={},stored=new Map(),responses=new Map();let activated=0,updates=0;
  const context=vm.createContext({crypto:crypto.webcrypto,Response,Uint8Array,URL,console,
    caches:{open:async()=>({put:async(k,v)=>{if(options.failWrite===k)throw Error('Quota');stored.set(k,v);},match:async k=>stored.get(k)}),keys:async()=>[],delete:async()=>true},
    fetch:async url=>{const body=responses.get(url);if(body===undefined)return new Response('',{status:404});return new Response(body);},
    self:{addEventListener:(kind,fn)=>handlers[kind]=fn,skipWaiting:()=>{activated++;},registration:{update:async()=>{updates++;}},clients:{claim:async()=>{},matchAll:async()=>[]}},
  });
  vm.runInContext(source,context);
  const shell=vm.runInContext('SHELL.slice()',context),version=vm.runInContext('CACHE_VERSION',context);
  const files=[...shell.filter(k=>k!=='./'),'data/moves.json'].map(u=>{
    const body='content:'+u;responses.set(u,body);return{u,h:crypto.createHash('sha1').update(body).digest('hex').slice(0,16),b:Buffer.byteLength(body)};
  });
  responses.set('offline-assets.json',JSON.stringify({version,files}));
  return {context,responses,stored,handlers,get activated(){return activated;},get updates(){return updates;},
    install:()=>new Promise((resolve,reject)=>handlers.install({waitUntil:p=>p.then(resolve,reject)}))};
}
test('a complete core installs with game data and a failed update cannot activate',async()=>{
  const good=worker();await good.install();assert.equal(good.activated,1);assert.ok(good.stored.has('data/moves.json'));
  for(const mode of ['missing','mismatch','quota']) {
    const bad=worker(mode==='quota'?{failWrite:'battle.html'}:{});
    if(mode==='missing')bad.responses.delete('game-upgrades.js');
    if(mode==='mismatch')bad.responses.set('data/moves.json','other release');
    await assert.rejects(bad.install());assert.equal(bad.activated,0,mode);
  }
});
test('navigation update checks cannot mutate the active core cache',async()=>{
  const w=worker();await w.install();const before=[...w.stored.keys()];
  w.responses.set('battle.html','new incompatible HTML');
  await vm.runInContext('revalidateShell()',w.context);
  assert.equal(w.updates,1);assert.deepEqual([...w.stored.keys()],before);
  assert.equal(await w.stored.get('battle.html').text(),'content:battle.html');
});
test('deployment is gated by reusable Quality and uploads only the built artifact',()=>{
  const deploy=fs.readFileSync(new URL('../../.github/workflows/static.yml',import.meta.url),'utf8');
  assert.match(deploy,/needs: quality/);assert.match(deploy,/path: 'dist'/);
  const quality=fs.readFileSync(new URL('../../.github/workflows/quality.yml',import.meta.url),'utf8');
  assert.match(quality,/run: npm ci\n/);assert.doesNotMatch(quality,/npm ci \|\|/);
});
