// Run a few REAL battles end-to-end against story-mode trainer rolls to verify
// the engine actually resolves combat — not just the flow harness.

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
function record(severity, area, msg) {
  findings.push({ severity, area, msg });
}

function stripExternalScripts(html) {
  return html
    .replace(/<script\s+[^>]*src=["']https?:\/\/[^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']online-[^"']+\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']move-(sfx|anim)-map\.js["'][^>]*>\s*<\/script>/gi, '');
}

function makeFetchStub() {
  return async function fetchStub(url) {
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
    url: `file://${BATTLE_HTML_PATH}`,
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      window.__testHarness = true;
      window.fetch = makeFetchStub();
      window.HTMLCanvasElement.prototype.getContext = function () { return { fillRect:()=>{}, clearRect:()=>{}, getImageData:()=>({data:[]}), putImageData:()=>{}, createImageData:()=>({data:[]}), setTransform:()=>{}, drawImage:()=>{}, save:()=>{}, fillText:()=>{}, restore:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, closePath:()=>{}, stroke:()=>{}, translate:()=>{}, scale:()=>{}, rotate:()=>{}, arc:()=>{}, fill:()=>{}, measureText:()=>({width:0}), transform:()=>{}, rect:()=>{}, clip:()=>{} }; };
      window.HTMLMediaElement.prototype.play = () => Promise.resolve();
      window.HTMLMediaElement.prototype.pause = () => {};
      const _animeFn = () => ({ finished:Promise.resolve(), pause:()=>{}, restart:()=>{}, play:()=>{}, reverse:()=>{}, seek:()=>{}, add: function(){return this;} });
      _animeFn.set=()=>{}; _animeFn.remove=()=>{}; _animeFn.running=[];
      _animeFn.stagger = v=>v;
      _animeFn.timeline = () => ({ add: () => ({ add:()=>({}), finished:Promise.resolve() }), finished:Promise.resolve(), pause:()=>{} });
      _animeFn.random = a=>a; _animeFn.path = ()=>()=>0; _animeFn.setDashoffset=()=>0; _animeFn.bezier=()=>()=>0; _animeFn.easings={}; _animeFn.suspendWhenDocumentHidden=false;
      window.anime = _animeFn;
      window.supabase = { createClient: () => ({ from: () => ({ select: () => Promise.resolve({ data:[], error:null }), insert: () => Promise.resolve({ data:[], error:null }), update: () => Promise.resolve({ data:[], error:null }) }), auth: { getUser: () => Promise.resolve({ data:{user:null}, error:null }) } }) };
      if (!window.navigator.serviceWorker) Object.defineProperty(window.navigator, 'serviceWorker', { value: { register:()=>Promise.resolve({update:()=>{}}), ready:Promise.resolve({}), addEventListener:()=>{} }, configurable:true });
      if (!window.matchMedia) window.matchMedia = () => ({ matches:false, addEventListener:()=>{}, removeEventListener:()=>{}, addListener:()=>{}, removeListener:()=>{} });
      window.requestAnimationFrame = cb => setTimeout(cb, 0);
      window.cancelAnimationFrame = id => clearTimeout(id);
      window.console.warn = (...a) => { const m = a.map(x => typeof x==='string'?x:String(x)).join(' '); if (m.includes('localStorage')) return; record('warn', 'console.warn', m); };
      window.console.error = (...a) => { const m = a.map(x => typeof x==='string'?x:String(x)).join(' '); record('error', 'console.error', m); };
      window.onerror = (msg, src, line) => { record('error', 'onerror', `${msg} @ line ${line}`); return true; };
      window.pkmn = { dex: { Dex: { species:{get:()=>null}, moves:{get:()=>null}, learnsets:{get:async()=>null}, data:{} } } };
      const origCreate = window.document.createElement.bind(window.document);
      window.document.createElement = function (tag, ...rest) {
        const el = origCreate(tag, ...rest);
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
  const engine = await window.__testReady;
  window.sleep = () => Promise.resolve();
  return { window, engine, dom };
}

async function runRealBattle(window, engine, mons, foes) {
  // Build state with strong attacks. Simulate playTurn until isOver.
  const state = engine.state;
  state.mode = 'pve';
  state.playerParty = mons.slice();
  state.foeParty = foes.slice();
  state.pActive = mons[0];
  state.fActive = foes[0];
  state.p1Draft = mons.map(m => ({ name: m._baseName || m.name, build: m.buildData }));
  state.p2Draft = foes.map(m => ({ name: m._baseName || m.name, build: m.buildData }));
  state.isOver = false;
  state.isLocked = false;
  state.turnNumber = 0;
  state.weather = null; state.weatherTurns = 0;
  state.pSide = { stealthRock:false, toxicSpikes:0, spikes:0, stickyWeb:false, reflect:0, lightScreen:0, auroraVeil:0, wishHp:0, wishTurns:0, safeguard:0, mist:0, tailwind:0, luckychant:0 };
  state.fSide = { ...state.pSide };

  let turns = 0;
  let lastP = state.pActive && state.pActive.name;
  let lastF = state.fActive && state.fActive.name;
  let samePairCount = 0;
  while (!state.isOver && turns < 200) {
    turns++;
    try {
      // Pick a damaging move
      const moves = state.pActive && state.pActive.moves || [];
      let slot = 0;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i] && moves[i].pow > 0 && (moves[i].pp > 0)) { slot = i; break; }
      }
      await window.playTurn(slot, null);

      // Manually drive forced switches if engine waits on player choice
      if (!state.isOver) {
        if (state.pActive && state.pActive.currentHp <= 0) {
          // Find next alive in playerParty
          const next = state.playerParty.findIndex(m => m && m.currentHp > 0 && m !== state.pActive);
          if (next >= 0 && typeof window.handleForcedSwitch === 'function') {
            await window.handleForcedSwitch(1, next);
          } else if (next >= 0 && typeof window.processForcedSwitchSelection === 'function') {
            await window.processForcedSwitchSelection(1, next);
          }
        }
        if (state.fActive && state.fActive.currentHp <= 0) {
          const next = state.foeParty.findIndex(m => m && m.currentHp > 0 && m !== state.fActive);
          if (next >= 0 && typeof window.handleForcedSwitch === 'function') {
            await window.handleForcedSwitch(2, next);
          } else if (next >= 0 && typeof window.processForcedSwitchSelection === 'function') {
            await window.processForcedSwitchSelection(2, next);
          }
        }
      }

      // Stall detector
      const curP = state.pActive && state.pActive.name;
      const curF = state.fActive && state.fActive.name;
      if (curP === lastP && curF === lastF) samePairCount++;
      else { samePairCount = 0; lastP = curP; lastF = curF; }
      if (samePairCount > 50) {
        record('warn', 'battle.stall', `Same pair ${curP} vs ${curF} for 50 turns at turn ${turns}`);
        break;
      }
    } catch (e) {
      record('error', 'battle.playTurn', `turn=${turns} ${e.message}`);
      return { turns, err: e.message };
    }
  }
  // Final state snapshot for diagnostics
  const pAlive = state.playerParty.filter(m => m && m.currentHp > 0).length;
  const fAlive = state.foeParty.filter(m => m && m.currentHp > 0).length;
  return { turns, err: null, isOver: state.isOver, pAlive, fAlive };
}

(async () => {
  console.log('Booting...');
  const h = await boot();
  const { window, engine } = h;
  console.log('Boot complete.');

  // Build a player team with sane moves
  function mkMon(species, moves = ['Tackle','Quick Attack','Ember','Water Gun']) {
    return engine.buildPokemon(species, {
      m: moves, i:null, a:null, n:'Hardy',
      ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31},
      evs:{hp:85,atk:85,def:85,spa:85,spd:85,spe:85},
    });
  }

  // Real battle 1: 1v1 Tackle vs Splash
  console.log('\n--- Battle 1: simple 1v1 ---');
  let p = mkMon('Charmander');
  let f = mkMon('Magikarp', ['Splash','Splash','Splash','Splash']);
  let r = await runRealBattle(window, engine, [p], [f]);
  console.log(`  turns=${r.turns} isOver=${r.isOver} err=${r.err}`);
  if (r.err) record('error', 'battle1', r.err);
  if (!r.isOver) record('warn', 'battle1.noEnd', `did not end in 200 turns`);

  // Real battle 2: 2v2 with switching
  console.log('--- Battle 2: 2v2 ---');
  p = mkMon('Charizard');
  let p2 = mkMon('Blastoise');
  f = mkMon('Magikarp');
  let f2 = mkMon('Caterpie', ['Tackle','String Shot','Tackle','Tackle']);
  r = await runRealBattle(window, engine, [p, p2], [f, f2]);
  console.log(`  turns=${r.turns} isOver=${r.isOver} err=${r.err}`);
  if (r.err) record('error', 'battle2', r.err);

  // Real battle 3: 6v6 with full team
  console.log('--- Battle 3: 6v6 ---');
  const pTeam = ['Charizard','Blastoise','Venusaur','Pikachu','Snorlax','Gengar'].map(s => mkMon(s));
  const fTeam = ['Bulbasaur','Squirtle','Charmander','Pidgey','Rattata','Caterpie'].map(s => mkMon(s));
  r = await runRealBattle(window, engine, pTeam, fTeam);
  console.log(`  turns=${r.turns} isOver=${r.isOver} err=${r.err}`);
  if (r.err) record('error', 'battle3', r.err);

  // Real battle 4: stress with strong vs weak (test KO chains)
  console.log('--- Battle 4: stress 6v6 ---');
  const pTeam2 = ['Arceus','Mewtwo','Rayquaza','Dialga','Palkia','Giratina'].map(s => mkMon(s, ['Hyper Beam','Earthquake','Surf','Thunderbolt']));
  const fTeam2 = ['Caterpie','Weedle','Pidgey','Rattata','Magikarp','Sunkern'].map(s => mkMon(s));
  r = await runRealBattle(window, engine, pTeam2, fTeam2);
  console.log(`  turns=${r.turns} isOver=${r.isOver} err=${r.err}`);
  if (r.err) record('error', 'battle4', r.err);

  // Real battle 5: with hazards (Stealth Rock setter)
  console.log('--- Battle 5: hazards ---');
  const pTeam3 = ['Aerodactyl','Charizard'].map(s => mkMon(s, ['Stealth Rock','Earthquake','Rock Slide','Fire Blast']));
  const fTeam3 = ['Charizard','Pidgeot'].map(s => mkMon(s));
  r = await runRealBattle(window, engine, pTeam3, fTeam3);
  console.log(`  turns=${r.turns} isOver=${r.isOver} err=${r.err}`);
  if (r.err) record('error', 'battle5', r.err);

  // Summary
  console.log('\n========== COMBAT FINDINGS ==========');
  const groups = { error: [], warn: [], info: [] };
  for (const f of findings) (groups[f.severity] || []).push(f);
  console.log(`error: ${groups.error.length}`);
  console.log(`warn:  ${groups.warn.length}`);
  for (const f of groups.error) console.log(`  [${f.area}] ${f.msg}`);
  for (const f of groups.warn.slice(0, 20)) console.log(`  [${f.area}] ${f.msg}`);
  try { h.dom.window.close(); } catch (e) {}
  process.exit(0);
})();
