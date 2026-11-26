import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { MessageChannel } from 'node:worker_threads';
const source=fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8');
function worker(options={}) {
  const handlers={},cacheContents=new Map(),responses=new Map(),fetches=[];
  const scope='https://example.test/battle/';
  const requestKey=request=>typeof request==='string'?request:request.url.slice(scope.length);
  let activated=0,updates=0;
  const context=vm.createContext({crypto:crypto.webcrypto,Response,Headers,Uint8Array,URL,AbortController,TransformStream,MessageChannel,setTimeout,clearTimeout,setInterval,clearInterval,console,
    caches:{
      open:async name=>{
        if(options.failOpen)throw Error('Cache storage unavailable');
        if(!cacheContents.has(name))cacheContents.set(name,new Map());
        const entries=cacheContents.get(name);
        return {
          put:async(request,response)=>{
            const key=requestKey(request);
            if(options.failWrite===key)throw Error('Quota');
            entries.set(key,response.clone());
          },
          match:async request=>entries.get(requestKey(request))?.clone(),
          keys:async()=>[...entries.keys()].map(key=>({url:scope+key})),
          delete:async request=>entries.delete(requestKey(request)),
        };
      },
      match:async(request,{cacheName}={})=>cacheContents.get(cacheName)?.get(requestKey(request))?.clone(),
      keys:async()=>[...cacheContents.keys()],
      delete:async name=>cacheContents.delete(name),
    },
    fetch:async request=>{
      const key=requestKey(request);
      fetches.push(key);
      await options.beforeFetch?.(key);
      const body=responses.get(key);
      const response=body===undefined?new Response('',{status:404}):new Response(body);
      Object.defineProperty(response,'type',{value:'basic'});
      return response;
    },
    self:{
      addEventListener:(kind,fn)=>handlers[kind]=fn,skipWaiting:()=>{activated++;},
      location:{origin:'https://example.test'},
      registration:{scope,update:async()=>{updates++;}},
      clients:{claim:async()=>{},matchAll:async()=>options.clients||[]},
    },
  });
  vm.runInContext(source,context);
  const shell=vm.runInContext('SHELL.slice()',context),version=vm.runInContext('CACHE_VERSION',context);
  const files=[...shell.filter(k=>k!=='./'),'data/moves.json'].map(u=>{
    const body='content:'+u;responses.set(u,body);return{u,h:crypto.createHash('sha1').update(body).digest('hex').slice(0,16),b:Buffer.byteLength(body)};
  });
  for (const [url,body] of Object.entries(options.lazyAssets || {})) {
    files.push(mediaFile(url,body));
    responses.set(url,body);
  }
  responses.set('offline-assets.json',JSON.stringify({version,files}));
  const dispatch=kind=>new Promise((resolve,reject)=>handlers[kind]({waitUntil:p=>p.then(resolve,reject)}));
  return {
    context,responses,cacheContents,fetches,
    get stored(){return cacheContents.get(`${version}-shell`);},
    get activated(){return activated;},get updates(){return updates;},
    install:()=>dispatch('install'),
    activate:()=>dispatch('activate'),
    async message(message,postMessage,id,port){
      let pending;
      const responses=[];
      handlers.message({
        data:{batchId:'test',...message},
        source:{id,postMessage:postMessage||((response)=>responses.push(structuredClone(response)))},
        ports:port?[{postMessage:port}]:[],
        waitUntil:p=>{pending=p;},
      });
      await pending;
      return responses.at(-1);
    },
    async fetch(path,mode='cors',headers={}){
      let response;
      const pending=[];
      handlers.fetch({
        request:{url:scope+path,method:'GET',mode,headers:new Headers(headers)},
        respondWith:p=>{response=p;},
        waitUntil:p=>pending.push(p),
      });
      const result=await response;
      await Promise.all(pending);
      return result;
    },
  };
}
test('a complete core installs with game data and a failed update cannot activate',async()=>{
  const good=worker();await good.install();assert.equal(good.activated,0);assert.ok(good.stored.has('data/moves.json'));
  for(const mode of ['missing','mismatch','quota']) {
    const bad=worker(mode==='quota'?{failWrite:'battle.html'}:{});
    if(mode==='missing')bad.responses.delete('game-upgrades.js');
    if(mode==='mismatch')bad.responses.set('data/moves.json','other release');
    bad.cacheContents.set('battle-v4-shell',new Map([['battle.html',new Response('previous release')]]));
    await assert.rejects(bad.install());assert.equal(bad.activated,0,mode);
    assert.equal(bad.stored,undefined,mode);
    assert.equal(await bad.cacheContents.get('battle-v4-shell').get('battle.html').text(),'previous release');
  }
});
test('a verified update waits for a busy game tab and prepares every tab before activating', async () => {
  let busy = true;
  const prepared = [];
  const client = (id, name) => ({ id, url: 'https://example.test/battle/' + name, postMessage(message, [port] = []) {
    if (!port) return;
    if (message.type === 'PREPARE_GAME_UPDATE') prepared.push(id);
    port.postMessage(id !== 'other' || !busy);
    port.close();
  } });
  const w = worker({ clients: [client('title', 'index.html'), client('other', 'battle.html')] });
  const previous = 'battle-v4-shell';
  w.cacheContents.set(previous, new Map());
  await w.install();
  const apply = async () => {
    let ready;
    await w.message({ type: 'APPLY_GAME_UPDATE' }, null, 'title', value => { ready = value; });
    return ready;
  };
  assert.equal(await apply(), false);
  assert.equal(w.activated, 0);
  assert.deepEqual(prepared, []);
  assert.ok(w.cacheContents.has(previous));
  busy = false;
  assert.equal(await apply(), true);
  assert.equal(w.activated, 1);
  assert.deepEqual(prepared, ['title', 'other']);
  await w.activate();
  assert.equal(w.cacheContents.has(previous), false);
});
test('repair of an evicted core file reuses the installed pack and verifies the one missing file',async()=>{
  const track='music/repair.mp3', core='data/moves.json';
  const w=worker({lazyAssets:{[track]:'offline track'}});
  await w.install();
  const manifest={...JSON.parse(w.responses.get('offline-assets.json')),digest:'stored-release'};
  const sync={type:'SYNC_ASSETS',manifest,profile:'full'};
  assert.equal((await w.message(sync)).applied,true);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,true);
  w.stored.delete(core);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,false);
  const plan=await w.message({...sync,dryRun:true});
  assert.equal(plan.fetchCount,0);
  assert.equal(plan.shellReady,false);
  assert.equal(plan.complete,false);
  w.fetches.length=0;
  assert.equal((await w.message(sync)).applied,true);
  assert.deepEqual(w.fetches,['offline-assets.json',core]);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,true);
});
test('removing a pack preserves the core shell and refreshes other tabs',async()=>{
  const notifications=[];
  const client=id=>({id,postMessage:data=>notifications.push({id,data:structuredClone(data)})});
  const w=worker({clients:[client('first'),client('second')]});
  await w.install();
  w.cacheContents.set('battle-assets',new Map([['music/optional.mp3',new Response('track')]]));
  const runtime=vm.runInContext('RUNTIME_CACHE',w.context);
  w.cacheContents.set(runtime,new Map([['music/recent.mp3',new Response('recent track')]]));
  assert.equal((await w.message({type:'CLEAR_CACHE'},null,'first')).type,'CACHE_CLEARED');
  assert.deepEqual(notifications,[{id:'second',data:{type:'OFFLINE_PACK_REMOVED'}}]);
  assert.equal(w.cacheContents.has('battle-assets'),false);
  assert.equal(w.cacheContents.has(runtime),false);
  assert.equal(await (await w.fetch('battle.html','navigate')).text(),'content:battle.html');
});
test('navigation update checks cannot mutate the active core cache',async()=>{
  const w=worker();await w.install();const before=[...w.stored.keys()];
  w.responses.set('battle.html','new incompatible HTML');
  await vm.runInContext('revalidateShell()',w.context);
  assert.equal(w.updates,1);assert.deepEqual([...w.stored.keys()],before);
  assert.equal(await w.stored.get('battle.html').text(),'content:battle.html');
});
test('the competitive route serves its own offline HTML and unknown routes keep their HTTP status',async()=>{
  const w=worker();
  await w.install();
  assert.equal(await (await w.fetch('','navigate')).text(),'content:index.html');
  assert.equal(await (await w.fetch('competitive/','navigate')).text(),'content:competitive/index.html');
  assert.equal(await (await w.fetch('competitive/index.html?from=menu','navigate')).text(),'content:competitive/index.html');
  assert.equal((await w.fetch('not-a-route','navigate')).status,404);
  assert.ok(!w.stored.has('competitive/showdown-worker.js'));
});
test('a fresh offline shell includes the standard battle adapter and shared simulator',async()=>{
  const paths=['competitive/classic-simulation.js','competitive/showdown-engine.js'];
  const w=worker();
  await w.install();
  for(const path of paths){
    const fetches=w.fetches.filter(url=>url===path).length;
    assert.equal(fetches,1);
    w.responses.delete(path);
    w.cacheContents.set('battle-assets',new Map([[path,new Response('old release')]]));
    assert.equal(await (await w.fetch(path)).text(),`content:${path}`);
    assert.equal(w.fetches.filter(url=>url===path).length,fetches);
  }
  const wrong=worker();
  wrong.responses.set(paths[1],'different simulator');
  await assert.rejects(wrong.install(),/Release mismatch: competitive\/showdown-engine\.js/);
  assert.equal(wrong.activated,0);
});
test('lazy online code rejects stale media and prefers its verified runtime copy',async()=>{
  const path='competitive/showdown-worker.js';
  const w=worker({lazyAssets:{[path]:'new worker'}});
  await w.install();
  assert.ok(!w.fetches.includes(path),'bundle is lazy');
  w.cacheContents.set('battle-assets',new Map([[path,new Response('old worker')]]));
  assert.equal(await (await w.fetch(path)).text(),'new worker');
  assert.equal(w.fetches.filter(url=>url===path).length,1);
  w.responses.delete(path);
  assert.equal(await (await w.fetch(path)).text(),'new worker');
  assert.equal(w.fetches.filter(url=>url===path).length,1,'served from current runtime');
});
test('a verified optional copy of lazy code works offline and wrong network bytes cannot replace it',async()=>{
  const path='vendor/pkmn-dex-learnsets.min.js';
  const w=worker({lazyAssets:{[path]:'new bundle'}});
  await w.install();
  w.responses.set(path,'wrong release');
  const assets=new Map([[path,new Response('new bundle')]]);
  w.cacheContents.set('battle-assets',assets);
  assert.equal(await (await w.fetch(path)).text(),'new bundle');
  assert.ok(!w.fetches.includes(path));
  assets.delete(path);
  assert.equal((await w.fetch(path)).status,503);
  assert.ok(![...w.cacheContents.entries()].some(([name,cache])=>name.endsWith('-runtime') && cache.has(path)));
});
test('cached offline audio serves single byte ranges and reports unsatisfiable requests',async()=>{
  const w=worker();
  const path='music/background/short1.mp3';
  w.cacheContents.set('battle-assets',new Map([[path,new Response('abcdefg',{
    headers:{'Content-Type':'audio/mpeg',ETag:'"media-v1"'},
  })]]));
  for(const [range,header,body] of [
    ['bytes=0-1','bytes 0-1/7','ab'],
    ['bytes=4-','bytes 4-6/7','efg'],
    ['bytes=-2','bytes 5-6/7','fg'],
  ]){
    const response=await w.fetch(path,'cors',{Range:range});
    assert.equal(response.status,206);
    assert.equal(response.headers.get('Content-Range'),header);
    assert.equal(response.headers.get('Content-Length'),String(body.length));
    assert.equal(response.headers.get('Content-Type'),'audio/mpeg');
    assert.equal(await response.text(),body);
  }
  const missing=await w.fetch(path,'cors',{Range:'bytes=8-10'});
  assert.equal(missing.status,416);
  assert.equal(missing.headers.get('Content-Range'),'bytes */7');
  const stale=await w.fetch(path,'cors',{Range:'bytes=0-1','If-Range':'"media-v0"'});
  assert.equal(stale.status,200);
  assert.equal(await stale.text(),'abcdefg');
  assert.ok(!w.fetches.includes(path));
});
test('an updated shell reuses compatible media while changed downloads await their delta',async()=>{
  const changed='music/world/changed.mp3';
  const unchanged='music/world/unchanged.mp3';
  const w=worker({lazyAssets:{[changed]:'new track',[unchanged]:'identical track'}});
  await w.install();
  const record={release:'battle-v5-previous',files:[mediaFile(changed,'old track'),mediaFile(unchanged,'identical track')]};
  w.cacheContents.set('battle-assets',new Map([
    [changed,new Response('old track')], [unchanged,new Response('identical track')],
    ['__OFFLINE_MANIFEST__',new Response(JSON.stringify(record))],
  ]));
  assert.equal(await (await w.fetch(unchanged)).text(),'identical track');
  assert.equal(await (await w.fetch(changed)).text(),'new track');
  assert.ok(!w.fetches.includes(unchanged));
  assert.ok(w.fetches.includes(changed));
});
test('cache-busted location icons resolve from the verified download when offline',async()=>{
  const icons = ['story_center.png','story_gym.png','story_route.png'].map(name=>'icons/story/'+name);
  const w = worker({lazyAssets:Object.fromEntries(icons.map(path=>[path,'pack:'+path]))});
  await w.install();
  const manifest = JSON.parse(w.responses.get('offline-assets.json'));
  assert.equal((await w.message({type:'SYNC_ASSETS',manifest,profile:'full'})).applied,true);
  for (const path of icons) {
    assert.equal(await (await w.fetch(`${path}?v=20260516`)).text(),'pack:'+path);
    assert.ok(!w.fetches.includes(`${path}?v=20260516`));
    w.responses.set(`${path}?theme=night`,'variant artwork');
    assert.equal(await (await w.fetch(`${path}?theme=night`)).text(),'variant artwork');
  }
});
test('a new shell downloads only changed or missing core files',async()=>{
  const w=worker();
  const changed='data/moves.json';
  const unchanged='battle.html';
  w.cacheContents.set('battle-v4-shell',new Map([
    [changed,new Response('old content')],
    [unchanged,new Response(w.responses.get(unchanged))],
  ]));
  w.responses.delete(unchanged);
  await w.install();
  assert.equal(w.activated,0);
  assert.ok(w.fetches.includes(changed));
  assert.ok(!w.fetches.includes(unchanged));
  assert.equal(await w.stored.get(unchanged).text(),'content:battle.html');
  assert.equal(await w.stored.get(changed).text(),'content:data/moves.json');
});
test('activation preserves the offline download and unrelated origin caches',async()=>{
  const w=worker();
  await w.install();
  for(const name of ['battle-v4-shell','battle-v4-runtime','battle-assets','another-game-shell']){
    w.cacheContents.set(name,new Map());
  }
  await w.activate();
  assert.ok(w.stored);
  assert.ok(w.cacheContents.has('battle-assets'));
  assert.ok(w.cacheContents.has('another-game-shell'));
  assert.ok(!w.cacheContents.has('battle-v4-shell'));
  assert.ok(!w.cacheContents.has('battle-v4-runtime'));
});
test('successful network responses survive cache quota and availability failures',async()=>{
  for(const options of [{failWrite:'sprites/new.webp'},{failOpen:true}]){
    const w=worker(options);
    w.responses.set('sprites/new.webp','sprite');
    w.responses.set('battle.html','live page');
    assert.equal(await (await w.fetch('sprites/new.webp')).text(),'sprite');
    assert.equal(await (await w.fetch('battle.html','navigate')).text(),'live page');
  }
});
function mediaFile(u,body){
  return {u,h:crypto.createHash('sha1').update(body).digest('hex').slice(0,16),b:Buffer.byteLength(body)};
}
test('compact and full packs share gameplay files and use their own sprite payloads', async () => {
  const w = worker();
  const sprite = 'sprites/gen5ani/pikachu.gif';
  const common = 'music/cries/pikachu.mp3';
  const atlas = 'sprites/compact-frames.bin';
  const frame = 'RIFF WebP still';
  const index = JSON.stringify({ [sprite]: [0, frame.length] });
  const header = Buffer.alloc(4);
  header.writeUInt32BE(index.length);
  const archive = Buffer.concat([header, Buffer.from(index), Buffer.from(frame)]);
  const payloads = { [sprite]: 'GIF animation', [common]: 'shared cry', [atlas]: archive };
  for (const [key, body] of Object.entries(payloads)) w.responses.set(key, body);
  const manifest = { digest: 'release', files: [
    { ...mediaFile(sprite, payloads[sprite]), p: 'full' },
    mediaFile(common, payloads[common]),
    { ...mediaFile(atlas, archive), p: 'compact' },
  ] };
  const message = { type: 'SYNC_ASSETS', manifest };
  assert.equal((await w.message({ ...message, profile: 'compact' })).applied, true);
  assert.equal((await w.message({ type: 'CACHE_STATE' })).digest, 'release:compact');
  assert.deepEqual(w.fetches, [common, atlas]);
  const still = await w.fetch(sprite);
  assert.equal(still.headers.get('content-type'), 'image/webp');
  assert.equal(await still.text(), frame);
  const fullPlan = await w.message({ ...message, profile: 'full', dryRun: true });
  assert.equal(fullPlan.installedProfile, 'compact');
  assert.equal(fullPlan.fetchCount, 1);
  assert.equal(fullPlan.removeCount, 1);
  const switched = await w.message({ ...message, profile: 'full' });
  assert.equal(switched.applied, true);
  assert.equal((await w.message({ type: 'CACHE_STATE' })).profile, 'full');
  assert.equal(await (await w.fetch(sprite)).text(), payloads[sprite]);
  assert.deepEqual(w.fetches, [common, atlas, sprite]);
});
test('bulk offline download excludes the installed shell and removes its legacy duplicates',async()=>{
  const w=worker();
  await w.install();
  const shell=JSON.parse(w.responses.get('offline-assets.json'));
  const sprite=mediaFile('sprites/reserve.webp','reserve');
  w.responses.set(sprite.u,'reserve');
  w.cacheContents.set('battle-assets',new Map([['battle.html',new Response('old duplicate')]]));
  const payload={type:'SYNC_ASSETS',manifest:{files:[...shell.files,mediaFile('sw.js','worker'),sprite]}};
  const pending=await w.message({...payload,dryRun:true});
  assert.equal(pending.fetchCount,1);
  assert.equal(pending.removeCount,1);
  assert.equal(pending.bytes,sprite.b);
  w.fetches.length=0;
  const done=await w.message(payload);
  assert.equal(done.applied,true);
  assert.equal(done.removed,1);
  assert.deepEqual(w.fetches,[sprite.u]);
  assert.ok(w.stored.has('battle.html'));
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,true);
});
test('retry reuses partial downloads and applies removals only after the new assets are ready',async()=>{
  const w=worker();
  const first=mediaFile('sprites/first.webp','first');
  const second=mediaFile('sprites/second.webp','second');
  const existing=new Map([['sprites/retired.webp',new Response('retired')]]);
  w.cacheContents.set('battle-assets',existing);
  w.responses.set(first.u,'first');
  const sync={type:'SYNC_ASSETS',manifest:{files:[first,second]}};

  const incomplete=await w.message(sync);
  assert.equal(incomplete.done,1);
  assert.equal(incomplete.failed,1);
  assert.equal(incomplete.applied,false);
  assert.ok(existing.has('sprites/retired.webp'));
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,false);

  const plan=await w.message({...sync,dryRun:true});
  assert.equal(plan.fetchCount,1);
  assert.equal(plan.bytes,second.b);
  w.responses.set(second.u,'second');
  const updated=await w.message(sync);
  assert.equal(updated.applied,true);
  assert.equal(updated.removed,1);
  assert.equal(w.fetches.filter(path=>path===first.u).length,1);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,true);
  assert.equal((await w.message({type:'CACHE_STATE'})).cachedCount,2);

  existing.delete(first.u);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,false);
});
test('offline batches isolate large media and bound concurrent verification bytes',()=>{
  const {context}=worker();
  const result=vm.runInContext(`(() => {
    const sample=[1,61,54,7,7,7,1].map((mb,i)=>({u:'asset'+i,b:mb*1024*1024}));
    return [...offlineAssetBatches(sample)].map(batch=>batch.map(file=>file.u));
  })()`,context);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [
    ['asset0'], ['asset1'], ['asset2'], ['asset3','asset4'], ['asset5','asset6']
  ]);
});
test('long offline downloads yield with a verified checkpoint and honor a pause between slices',async()=>{
  const w=worker();
  const files=Array.from({length:30},(_, index)=>{
    const path=`sprites/example-${index}.webp`;
    const bytes=`sprite ${index}`;
    w.responses.set(path,bytes);
    return mediaFile(path,bytes);
  });
  vm.runInContext('let batchTime = 0; Date.now = () => batchTime += 45000;',w.context);
  const sync={type:'SYNC_ASSETS',manifest:{files,digest:'sliced-download'}};
  const initial=await w.message(sync);
  assert.equal(initial.status,'continuing');
  assert.equal(initial.done,12);
  assert.equal(initial.continuation,true);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,false);
  assert.equal((await w.message({type:'PAUSE_ASSETS'})).job.status,'paused');
  const paused=await w.message({...sync,continueJob:true});
  assert.equal(paused.paused,true);
  assert.equal(w.fetches.length,12);

  const resumed=await w.message(sync);
  assert.equal(resumed.continuation,true);
  const finished=await w.message({...sync,continueJob:true});
  assert.equal(finished.applied,true);
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,true);
  assert.equal(w.fetches.length,30);
  assert.equal(new Set(w.fetches).size,30);
});
test('a removed offline pack rejects another tab’s stale continuation until a player starts again',async()=>{
  const w=worker();
  const files=Array.from({length:13},(_, index)=>{
    const path=`sprites/example-${index}.webp`;
    const bytes=`sprite ${index}`;
    w.responses.set(path,bytes);
    return mediaFile(path,bytes);
  });
  vm.runInContext('let batchTime = 0; Date.now = () => batchTime += 45000;',w.context);
  const sync={type:'SYNC_ASSETS',manifest:{files,digest:'removed-download'}};
  assert.equal((await w.message({...sync,batchId:'tab-a'})).continuation,true);
  assert.equal(w.fetches.length,12);
  assert.equal((await w.message({type:'CLEAR_CACHE',batchId:'tab-b'})).failed,undefined);
  const stopped=await w.message({...sync,batchId:'tab-a',continueJob:true});
  assert.equal(stopped.cancelled,true);
  assert.equal(stopped.applied,false);
  assert.equal(w.fetches.length,12);
  assert.equal((await w.message({type:'CACHE_STATE'})).cachedCount,0);

  assert.equal((await w.message({...sync,batchId:'tab-b'})).continuation,true);
  assert.equal((await w.message({...sync,batchId:'tab-b',continueJob:true})).applied,true);
  assert.equal(w.fetches.length,25);
  const finished=await w.message({...sync,batchId:'tab-a',continueJob:true});
  assert.equal(finished.applied,true);
  assert.equal(finished.cancelled,false);
  assert.equal(w.fetches.length,25);
});
test('slow offline transfers extend the deadline when bytes arrive and abort on inactivity', async () => {
  const {context} = worker();
  const file = mediaFile('music/track.mp3', 'slow media');
  const timers = new Set();
  let stream, nextDeadline;
  context.setTimeout = (abort, milliseconds) => {
    assert.equal(milliseconds, 30000);
    timers.add(abort);
    nextDeadline?.();
    return abort;
  };
  context.clearTimeout = abort => timers.delete(abort);
  context.fetch = async (url, {signal}) => new Response(new ReadableStream({
    start(controller) {
      stream = controller;
      signal.addEventListener('abort', () => controller.error(signal.reason), {once:true});
    },
  }));
  const load = () => vm.runInContext(`fetchOfflineAsset(${JSON.stringify(file)})`, context);
  const downloading = load();
  const originalDeadline = [...timers][0];
  const renewed = new Promise(resolve => { nextDeadline = resolve; });
  stream.enqueue(new TextEncoder().encode('slow '));
  await renewed;
  assert.deepEqual(timers.size, 1);
  assert.equal(timers.has(originalDeadline), false);
  stream.enqueue(new TextEncoder().encode('media'));
  stream.close();
  assert.equal(await (await downloading).text(), 'slow media');
  assert.equal(timers.size, 0);

  const stalled = load();
  [...timers][0]();
  await assert.rejects(stalled, {name:'AbortError'});
  assert.equal(timers.size, 0);
});
test('a reopened tab can track, pause and resume an offline job after the initiating tab closes',async()=>{
  let batchStarted, unblockBatch;
  const started=new Promise(resolve=>{batchStarted=resolve;});
  const blocked=new Promise(resolve=>{unblockBatch=resolve;});
  const notifications=[];
  const w=worker({beforeFetch:async()=>{batchStarted();await blocked;},
    clients:[{postMessage:data=>notifications.push(structuredClone(data))}]});
  const files=Array.from({length:15},(_,i)=>{
    const body='body'+i;
    const file=mediaFile(`sprites/test-${i}.webp`,body);
    w.responses.set(file.u,body);
    return file;
  });
  const existing=new Map([['sprites/retired.webp',new Response('retired')]]);
  w.cacheContents.set('battle-assets',existing);
  const digest='release-digest';
  const payload={type:'SYNC_ASSETS',manifest:{digest,files}};
  const download=w.message(payload,()=>{throw new Error('The first tab closed');});
  await started;
  const attached=await w.message({...payload,dryRun:true});
  assert.equal(attached.job.status,'running');
  assert.equal(attached.job.total,15);
  assert.equal(attached.job.remainingBytes,files.reduce((sum,file)=>sum+file.b,0));
  assert.equal((await w.message(payload)).job.status,'running');
  assert.equal((await w.message({type:'PAUSE_ASSETS'})).job.status,'pausing');
  assert.equal((await w.message({type:'CLEAR_CACHE'})).busy,true);
  unblockBatch();
  await download;

  const outstanding=files.slice(12);
  assert.ok(existing.has('sprites/retired.webp'));
  const {job:paused}=await w.message({type:'SYNC_STATUS'});
  assert.equal(paused.status,'paused');
  assert.equal(paused.done,12);
  assert.equal(paused.remainingBytes,outstanding.reduce((sum,file)=>sum+file.b,0));
  assert.equal((await w.message({type:'CACHE_STATE'})).complete,false);
  assert.equal(notifications.length,0);
  const checkpoint=await existing.get('__OFFLINE_PROGRESS__').clone().json();
  assert.equal(checkpoint.paused,true);
  assert.equal(checkpoint.files.length,12);

  // The service worker can be terminated while no tab is open. Resume uses the saved plan.
  vm.runInContext('offlineJob = null',w.context);
  const plan=await w.message({...payload,dryRun:true});
  assert.equal(plan.resumable,true);
  assert.equal(plan.paused,true);
  assert.equal(plan.fetchCount,3);
  const resumed=await w.message(payload);
  assert.equal(resumed.applied,true);
  assert.equal(resumed.removed,1);
  assert.equal(resumed.remainingBytes,0);
  assert.deepEqual(w.fetches,files.map(file=>file.u));
  assert.equal((await w.message({...payload,dryRun:true})).complete,true);
  const cache=await w.message({type:'CACHE_STATE'});
  assert.equal(cache.complete,true);
  assert.equal(cache.digest,digest);
  assert.deepEqual(notifications,[{type:'OFFLINE_PACK_READY',digest,profile:'full'}]);
});
test('offline download UI does not record a failed sync as complete',async()=>{
  const html=fs.readFileSync(new URL('../../battle.html',import.meta.url),'utf8');
  const start=html.indexOf('const _offlineElement =');
  const end=html.indexOf('window.clearOfflineCache = async function',start);
  const nodes={'offline-dl-start':{},'offline-dl-size':{},'offline-dl-status':{},'offline-dl-bar-fill':{style:{}}};
  const settings={offlineDownload:{completed:true,digest:'old'}};
  const ctx=vm.createContext({
    window:{},document:{getElementById:id=>nodes[id]},settings,
    _offlineActiveSW:async()=>({}),_getOfflineManifest:async()=>({digest:'new'}),
    _swRequest:async()=>({done:1,failed:1,total:2,bytes:800,remainingBytes:600,applied:false}),persistMiscSettings:()=>{},
    _fmtBytes:()=>'<1 MB',
  });
  vm.runInContext(html.slice(start,end),ctx);
  await ctx.window.startOfflineDownload();
  assert.equal(settings.offlineDownload.completed,false);
  assert.equal(settings.offlineDownload.digest,null);
  assert.equal(nodes['offline-dl-start'].textContent,'Retry');
  assert.equal(nodes['offline-dl-bar-fill'].style.width,'25%');
  assert.equal(nodes['offline-dl-size'].textContent,'~<1 MB remaining · 1 file · 1 failed');
});
test('offline download UI continues checkpoints and bounds recovery from worker interruption',async()=>{
  const html=fs.readFileSync(new URL('../../battle.html',import.meta.url),'utf8');
  const start=html.indexOf('const _offlineElement =');
  const end=html.indexOf('window.clearOfflineCache = async function',start);
  for(const recovers of [true,false]){
    const nodes={'offline-dl-start':{},'offline-dl-size':{},'offline-dl-status':{},'offline-dl-bar-fill':{style:{}}};
    const settings={offlineDownload:{completed:false,digest:null}};
    const messages=[];
    const serviceWorker={};
    const ctx=vm.createContext({
      window:{},document:{getElementById:id=>nodes[id]},settings,persistMiscSettings:()=>{},
      _offlineActiveSW:async()=>serviceWorker,_getOfflineManifest:async()=>({digest:'new'}),
      _swRequest:async(_sw,message,_type,onProgress)=>{
        messages.push(message.continueJob);
        const job={done:1,failed:0,total:3,bytes:300,remainingBytes:200};
        onProgress(job);
        if(messages.length===1)return {...job,continuation:true,applied:false};
        if(recovers&&messages.length===3)return {...job,done:2,total:2,bytes:200,remainingBytes:0,applied:true};
        return null;
      },
      _fmtBytes:String,
    });
    vm.runInContext(html.slice(start,end),ctx);
    await ctx.window.startOfflineDownload();
    assert.deepEqual(messages,recovers?[false,true,true]:[false,true,true,true]);
    assert.equal(settings.offlineDownload.completed,recovers);
    assert.equal(nodes['offline-dl-start'].textContent,recovers?'Check for updates':'Retry');
  }
});
test('offline download UI clears readiness and refreshes when its checkpoint was removed',async()=>{
  const html=fs.readFileSync(new URL('../../battle.html',import.meta.url),'utf8');
  const start=html.indexOf('const _offlineElement =');
  const end=html.indexOf('window.clearOfflineCache = async function',start);
  const settings={offlineDownload:{completed:true,digest:'old'}};
  const ctx=vm.createContext({
    window:{},document:{getElementById:()=>null},settings,persistMiscSettings:()=>{},
    _offlineActiveSW:async()=>({}),_getOfflineManifest:async()=>({digest:'new'}),
    _swRequest:async()=>({cancelled:true,applied:false}),
  });
  vm.runInContext(html.slice(start,end),ctx);
  let refreshed=0;
  ctx.window.openDownloadOfflineFlow=async()=>{refreshed++;};
  await ctx.window.startOfflineDownload();
  assert.equal(settings.offlineDownload.completed,false);
  assert.equal(settings.offlineDownload.digest,null);
  assert.equal(refreshed,1);
});
test('a manual update distinguishes installation, safe waiting and a rejected install', async () => {
  const code = fs.readFileSync(new URL('../../game-update.js', import.meta.url), 'utf8');
  for (const finalState of ['activated', 'installed', 'redundant']) {
    const worker = Object.assign(new EventTarget(), { state: 'installing' });
    const registration = Object.assign(new EventTarget(), { active: {}, installing: null });
    let checks = 0;
    registration.update = async () => {
      checks++;
      registration.installing = worker;
      registration.dispatchEvent(new Event('updatefound'));
    };
    const window = {};
    const timer = (callback, ms) => ms === 3000 ? 0 : setTimeout(callback, ms);
    vm.runInNewContext(code, { window, navigator: { serviceWorker: { getRegistration: async () => registration } }, setTimeout:timer, clearTimeout });
    let installing;
    const installStarted = new Promise(resolve => { installing = resolve; });
    const result = window.checkForGameUpdate(installing);
    let settled = false;
    void result.then(() => { settled = true; }, () => { settled = true; });
    await installStarted;
    assert.equal(checks, 1);
    assert.equal(settled, false, 'an unverified worker cannot complete the update');
    worker.state = finalState;
    worker.dispatchEvent(new Event('statechange'));
    if (finalState === 'activated') assert.equal(await result, true);
    else if (finalState === 'installed') assert.equal(await result, 'waiting');
    else await assert.rejects(result, /could not be installed/);
  }
});

test('the first controller claim arms future updates without reloading a battle', () => {
  const html = fs.readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
  const start = html.indexOf("if ('serviceWorker' in navigator && location.protocol.startsWith('http'))");
  const handlers = {};
  const serviceWorker = {
    controller: null,
    addEventListener: (name, handler) => { handlers[name] = handler; },
  };
  const state = { pActive: {}, fActive: {}, isOver: false };
  const window = { addEventListener() {}, document: { getElementById: id => id === 'screen-menu' && state.isOver ? {classList:{contains:()=>false}} : null } };
  let reloads = 0;
  vm.runInNewContext(html.slice(start, html.indexOf('</script>', start)), {
    window, state, navigator: { serviceWorker }, _topAppDialog:()=>null, _offlineDownloadRun:false, _offlinePackRemoving:false,
    location: { protocol: 'https:', reload: () => { reloads++; } },
  });

  serviceWorker.controller = { version: 'initial' };
  handlers.controllerchange();
  assert.equal(window.__swReloadPending, undefined);
  assert.equal(reloads, 0);

  serviceWorker.controller = { version: 'update' };
  handlers.controllerchange();
  assert.equal(window.__swReloadPending, true);
  assert.equal(reloads, 0);

  state.isOver = true;
  window.__maybeSwReload();
  window.__maybeSwReload();
  assert.equal(reloads, 1);
});
test('a story update can park only when the requested native turn saves successfully', () => {
  const html = fs.readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
  const start = html.indexOf("if ('serviceWorker' in navigator && location.protocol.startsWith('http'))");
  const state = { mode:'story',pActive:{},fActive:{},nativeRequests:[{phase:'replace'}] };
  const engine = {};
  let canSave = false;
  const listeners = {};
  const document = {getElementById: id => id === 'screen-battle' ? {classList:{contains:()=>false}} : null};
  const window = {
    addEventListener:(type,listener)=>{listeners[type]=listener;}, document,
    StoryMode:{commitBattleTurn(value) { assert.equal(value,engine);return canSave; }},
  };
  const navigations = [];
  function blocksUnload() {
    let blocked = false;
    listeners.beforeunload({preventDefault:()=>{blocked=true;}});
    return blocked;
  }
  const context = vm.createContext({
    window,state,URL,document,history:{pushState() {}},nativeBattle:engine,nativeBattleOwner:state,
    navigator:{serviceWorker:{controller:{},addEventListener() {}}},
    _topAppDialog:()=>({id:'modal-settings'}),_offlineDownloadRun:false,_offlinePackRemoving:false,
    location:{protocol:'https:',href:'https://example.test/battle.html',replace:url=>navigations.push({url,blocked:blocksUnload()})},
  });
  vm.runInContext(html.slice(start,html.indexOf('</script>',start)),context);
  const historyStart = html.indexOf('(function _installHistoryIntegration()');
  vm.runInContext(html.slice(historyStart,html.indexOf('})();',historyStart)+5),context);
  assert.equal(window.gameUpdateCanApply(),false);
  assert.equal(blocksUnload(),true,'ordinary battle close prompts');
  window.__gameUpdateParkRequested = true;
  state.isLocked = true;
  assert.equal(window.gameUpdateCanApply(),false);
  state.isLocked = false;
  assert.equal(window.gameUpdateCanApply(),true);
  assert.equal(window.gameUpdateCanApply(true),false);
  canSave = true;
  assert.equal(window.gameUpdateCanApply(true),true);
  assert.equal(blocksUnload(),true,'saving in preparation does not waive the warning');
  window.finishPreparedGameUpdate();
  window.finishPreparedGameUpdate();
  assert.deepEqual(navigations,[{url:'https://example.test/battle.html?entry=continue',blocked:false}]);
  assert.equal(blocksUnload(),true,'the confirmed handoff grants one unload');
});
test('returning from a standard battle applies a pending worker update at the menu',async()=>{
  const html=fs.readFileSync(new URL('../../battle.html',import.meta.url),'utf8');
  const start=html.indexOf('window.returnToHome = async function()');
  const end=html.indexOf('// Context-aware exit',start);
  const state={mode:'pve',isOver:false};
  const visited=[];
  const nodes={'screen-menu':{classList:{remove:()=>visited.push('menu')}},
    'draft-grid':{},'battle-log':{},'draft-setup-status':{},'draft-inspect-foe':{},
    'menu-more-play':{},'menu-more-play-summary':{focus:()=>{}}};
  const window={__maybeSwReload:()=>{
    assert.equal(state.isOver,true);
    visited.push('update');
  }};
  const ctx=vm.createContext({
    window,state,document:{getElementById:id=>nodes[id],querySelectorAll:()=>[]},
    titleBattleSetupRevision:0,closeLocalBattleHandoff:()=>{},
    cancelNativeBattleMotion:()=>{},_isFullscreen:()=>false,_reenterFullscreenIfNeeded:()=>{},
  });
  vm.runInContext(html.slice(start,end),ctx);
  await window.returnToHome();
  assert.deepEqual(visited,['menu','update']);
});
test('Pages uses the artifact uploaded after reusable Quality and packaged browser tests',()=>{
  const deploy=fs.readFileSync(new URL('../../.github/workflows/static.yml',import.meta.url),'utf8');
  assert.match(deploy,/needs: \[quality, player\]/);
  assert.match(deploy,/player:\s+uses: \.\/\.github\/workflows\/player-playtest\.yml\s+with:\s+publish_artifact: true/);
  assert.doesNotMatch(deploy,/build-release|upload-pages-artifact/);
  const player=fs.readFileSync(new URL('../../.github/workflows/player-playtest.yml',import.meta.url),'utf8');
  assert.match(player,/workflow_call:\s+inputs:\s+publish_artifact:/);
  assert.match(player,/run: npm run build:release[\s\S]*run: bash scripts\/debug\/release-candidate-playtest\.sh[\s\S]*if: \$\{\{ success\(\) && inputs\.publish_artifact \}\}\s+uses: actions\/upload-pages-artifact@v3\s+with:\s+path: dist/);
  const quality=fs.readFileSync(new URL('../../.github/workflows/quality.yml',import.meta.url),'utf8');
  assert.match(quality,/run: npm ci\n/);assert.doesNotMatch(quality,/npm ci \|\|/);
});
