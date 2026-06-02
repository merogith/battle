// ⚠️ DEPRECATED (2026-06) — ad-hoc diagnostic, NOT part of `npm test`.
// The 8-tone storyline layer it exercises has been RETIRED to 'classic' (see
// CLAUDE.md → "Excised vs retired"), and the variant ids below ('radio_silence',
// 'crimson_clade') never existed in the shipped STORYLINE_VARIANTS. Kept only as a
// boot-smoke pattern. The maintained tone coverage now lives in
// tests/suites/story-tone-retirement.test.js. Do not treat failures here as actionable.
//
// Test all 5 difficulty modes (veryeasy, easy, normal, hard, challenge) and
// the storyline variants to confirm starting state is right and no obvious
// crashes happen on entry.

import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import jsdomPkg from 'jsdom';
const { JSDOM } = jsdomPkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BATTLE_HTML_PATH = join(ROOT, 'battle.html');

const findings = [];
function record(severity, area, msg) { findings.push({ severity, area, msg }); }

function stripExternalScripts(html) {
  return html
    .replace(/<script\s+[^>]*src=["']https?:\/\/[^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']online-[^"']+\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']move-(sfx|anim)-map\.js["'][^>]*>\s*<\/script>/gi, '');
}
function makeFetchStub() {
  return async function (url) {
    const u = String(url || '');
    if (/^https?:\/\//.test(u)) return { ok:false, status:599, text: async()=>'', json: async()=>({}) };
    const rel = u.replace(/^\.?\/?/, '');
    const filePath = join(ROOT, rel);
    if (!existsSync(filePath)) return { ok:false, status:404, text: async()=>'', json: async()=>({}) };
    const body = readFileSync(filePath, 'utf8');
    return { ok:true, status:200, text: async()=>body, json: async()=>JSON.parse(body) };
  };
}
async function boot() {
  const html = await readFile(BATTLE_HTML_PATH, 'utf8');
  const stripped = stripExternalScripts(html);
  const dom = new JSDOM(stripped, {
    url: `file://${BATTLE_HTML_PATH}`, runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      window.__testHarness = true;
      window.fetch = makeFetchStub();
      window.HTMLCanvasElement.prototype.getContext = function () { return { fillRect:()=>{}, clearRect:()=>{}, getImageData:()=>({data:[]}), putImageData:()=>{}, createImageData:()=>({data:[]}), setTransform:()=>{}, drawImage:()=>{}, save:()=>{}, fillText:()=>{}, restore:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, closePath:()=>{}, stroke:()=>{}, translate:()=>{}, scale:()=>{}, rotate:()=>{}, arc:()=>{}, fill:()=>{}, measureText:()=>({width:0}), transform:()=>{}, rect:()=>{}, clip:()=>{} }; };
      window.HTMLMediaElement.prototype.play = () => Promise.resolve();
      window.HTMLMediaElement.prototype.pause = () => {};
      const _animeFn = () => ({ finished:Promise.resolve(), pause:()=>{}, restart:()=>{}, play:()=>{}, reverse:()=>{}, seek:()=>{}, add: function(){return this;} });
      Object.assign(_animeFn, { set:()=>{}, remove:()=>{}, running:[], stagger:v=>v, timeline:()=>({ add:()=>({add:()=>({}),finished:Promise.resolve()}),finished:Promise.resolve(),pause:()=>{}}), random:a=>a, path:()=>()=>0, setDashoffset:()=>0, bezier:()=>()=>0, easings:{}, suspendWhenDocumentHidden:false });
      window.anime = _animeFn;
      window.supabase = { createClient: () => ({ from: () => ({ select: () => Promise.resolve({ data:[], error:null }), insert: () => Promise.resolve({ data:[], error:null }), update: () => Promise.resolve({ data:[], error:null }) }), auth: { getUser: () => Promise.resolve({ data:{user:null}, error:null }) } }) };
      if (!window.navigator.serviceWorker) Object.defineProperty(window.navigator, 'serviceWorker', { value: { register:()=>Promise.resolve({update:()=>{}}), ready:Promise.resolve({}), addEventListener:()=>{} }, configurable:true });
      if (!window.matchMedia) window.matchMedia = () => ({ matches:false, addEventListener:()=>{}, removeEventListener:()=>{}, addListener:()=>{}, removeListener:()=>{} });
      window.requestAnimationFrame = cb => setTimeout(cb, 0);
      window.cancelAnimationFrame = id => clearTimeout(id);
      window.console.warn = (...a) => { const m = a.map(x => typeof x==='string'?x:String(x)).join(' '); if (m.includes('localStorage')) return; record('warn','warn', m); };
      window.console.error = (...a) => { const m = a.map(x => typeof x==='string'?x:String(x)).join(' '); record('error','error', m); };
      window.onerror = (msg, src, line) => { record('error', 'onerror', `${msg} @ ${line}`); return true; };
      window.pkmn = { dex: { Dex: { species:{get:()=>null}, moves:{get:()=>null}, learnsets:{get:async()=>null}, data:{} } } };
      const oc = window.document.createElement.bind(window.document);
      window.document.createElement = function (tag, ...rest) {
        const el = oc(tag, ...rest);
        if (String(tag).toLowerCase() === 'script') {
          Object.defineProperty(el, 'src', { configurable:true,
            set(v) { this.setAttribute('src', v); if (/^https?:\/\//.test(v)) setTimeout(() => { if (typeof this.onerror === 'function') this.onerror(new Error('test stub')); }, 0); },
            get() { return this.getAttribute('src'); }
          });
        }
        return el;
      };
    },
  });
  const window = dom.window;
  await window.__testReady;
  window.sleep = () => Promise.resolve();
  window.showGameAlert = () => {};
  window.showGameConfirm = async () => true;
  window.alert = () => {};
  return { window, dom };
}

function setStoryDifficulty(window, diff) {
  let el = window.document.getElementById('story-difficulty');
  if (!el) {
    el = window.document.createElement('select');
    el.id = 'story-difficulty';
    for (const d of ['veryeasy','easy','normal','hard','challenge']) {
      const opt = window.document.createElement('option');
      opt.value = d; el.appendChild(opt);
    }
    window.document.body.appendChild(el);
  }
  el.value = diff;
}

function setStoryline(window, line) {
  let el = window.document.getElementById('story-line-select');
  if (!el) {
    el = window.document.createElement('select');
    el.id = 'story-line-select';
    const opt = window.document.createElement('option');
    opt.value = line; el.appendChild(opt);
    window.document.body.appendChild(el);
  } else if (![...el.options].some(o => o.value === line)) {
    const opt = window.document.createElement('option');
    opt.value = line; el.appendChild(opt);
  }
  el.value = line;
}

async function runOneStart(window, diff, storyline) {
  setStoryDifficulty(window, diff);
  if (storyline) setStoryline(window, storyline);
  try { window.localStorage.removeItem && window.localStorage.removeItem('pbs_story_save'); } catch (e) {}
  const beforeFindings = findings.length;
  try { window.StoryMode.startNewRun(); }
  catch (e) { record('error', `start.${diff}.${storyline||'default'}`, e.message); return null; }
  const sm = window.StoryMode.state;
  if (!sm || !sm.active) {
    record('error', `start.${diff}`, 'sm.active is false after startNewRun');
    return null;
  }
  return {
    diff, storyline: storyline || sm.storyLine,
    gold: sm.gold, eventIndex: sm.eventIndex, badges: sm.badges,
    enabledGens: sm.settings && sm.settings.enabledGens,
    addedErrors: findings.slice(beforeFindings).filter(f => f.severity === 'error').length
  };
}

(async () => {
  console.log('Booting...');
  const h = await boot();
  console.log('Boot complete.');

  const results = [];
  for (const diff of ['veryeasy','easy','normal','hard','challenge']) {
    const r = await runOneStart(h.window, diff, null);
    if (r) results.push(r);
  }
  // Check a few storyline variants
  for (const sl of ['classic','second_sun','radio_silence','crimson_clade']) {
    const r = await runOneStart(h.window, 'normal', sl);
    if (r) results.push(r);
  }

  console.log('\nResults:');
  console.table(results);

  console.log('\nFindings:');
  console.log(`error: ${findings.filter(f => f.severity === 'error').length}`);
  console.log(`warn:  ${findings.filter(f => f.severity === 'warn').length}`);
  for (const f of findings.slice(0, 30)) console.log(`  [${f.severity}] ${f.area}: ${f.msg}`);

  try { h.dom.window.close(); } catch (e) {}
  process.exit(0);
})();
