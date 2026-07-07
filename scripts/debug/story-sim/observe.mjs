// Content census — observe WHAT appears in the game start-to-end and how it scales.
//
//   node scripts/debug/story-sim/observe.mjs --seeds 200 --difficulty normal --gens 1-9 --out agent-state/story-sim/content
//
// For each seed it walks STORY_EVENTS_RAW and records every ENEMY team (faithfully rolled via
// rollFoeForRow) and every WILD encounter per city, WITHOUT resolving battles (so hundreds of
// seeds run cheaply). Each mon is annotated with grade / evolution-stage / BST / typing /
// signature-derived / theme-match, plus per-battle robustness fields (expected vs actual team
// size). Report via observe-report.mjs / gen-stress.mjs.
//
// Not a balance test — a "what is actually happening in the game" observability pass.

import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEngine } from '../../../tests/helpers/load-engine.js';
import { initRun, rollFoeForRow } from './story-run.mjs';
import { getPolicy } from './policies.mjs';
import { PlayerAgent } from './agent.mjs';

function parseArgs(argv) {
  const a = { seeds: 100, difficulty: 'normal', gens: '1-9', wildsPerCity: 8,
    policy: 'recommended', out: 'agent-state/story-sim/content' };
  for (let i = 0; i < argv.length; i++) {
    const [k, vRaw] = argv[i].replace(/^--/, '').split('=');
    const v = vRaw !== undefined ? vRaw : argv[++i];
    if (k === 'seeds' || k === 'wildsPerCity') a[k] = Number(v);
    else if (k in a) a[k] = v;
  }
  return a;
}
export function gensOf(spec) {
  const m = String(spec).match(/^(\d)-(\d)$/);
  if (m) { const out = []; for (let g = +m[1]; g <= +m[2]; g++) out.push(g); return out; }
  return String(spec).split(',').map(Number);
}
function roleOf(ev) {
  if (ev === 'Rival') return 'Rival';
  if (/^Gym Leader/.test(ev)) return 'Gym Leader';
  if (/^Gym Trainer/.test(ev)) return 'Gym Trainer';
  if (/^Basic Trainer/.test(ev)) return 'Basic Trainer';
  if (/^Elite Trainer/.test(ev)) return 'Elite Trainer';
  if (/^E[1-4]$/.test(ev)) return 'Elite Four';
  if (/Champion/.test(ev)) return 'Champion';
  if (/Mystery/.test(ev)) return 'Mystery Figure';
  return ev;
}

// Build a per-species metadata accessor bound to one engine (grade/bst/stage are name-based;
// typing needs a one-off build). Cache persists across seeds & gen configs.
export function makeMetaAccessor(E) {
  const S = E.window.__storySim, T = E.window.__storyTest, eng = E.engine;
  const baseStats = T.baseStats;
  const cache = new Map();
  function meta(name) {
    if (cache.has(name)) return cache.get(name);
    let grade = 4, bst = 0, stage = 0, t1 = null, t2 = null;
    try { bst = eng.getBST(name); } catch (e) {}
    try { grade = eng.getMonGrade(name, bst); } catch (e) {}
    try { stage = T.storyEvoStageOf(name); } catch (e) {}
    try { const m = S.buildPokemon(name, S.makeBuild(name)); t1 = m.type1 || null; t2 = m.type2 || null; } catch (e) {}
    const v = { grade, bst, stage, t1, t2 };
    cache.set(name, v); return v;
  }
  function prevoChain(name) { const out = []; let cur = name, g = 0; while (cur && g++ < 4) { const b = baseStats[cur]; if (!b || !b.prevo || !baseStats[b.prevo]) break; cur = b.prevo; out.push(cur); } return out; }
  function sigFamily(sigs) { const set = new Set(); for (const s of sigs || []) { set.add(s); for (const p of prevoChain(s)) set.add(p); } return set; }
  return { meta, sigFamily };
}
function parseThemeTypes(type) { return String(type || '').split(/[\/,]/).map(s => s.trim()).filter(Boolean); }

// Run the census for ONE seed, invoking onRecord(record) for each encounter. `tag` is written
// into every record (used by gen-stress to label the gen config). Reuses one engine.
export function censusSeed(E, seed, opts, onRecord) {
  const { difficulty = 'normal', gens = [1, 2, 3, 4, 5, 6, 7, 8, 9], wildsPerCity = 8, policy = 'recommended', tag = null, meta, sigFamily } = opts;
  const S = E.window.__storySim;
  const sm = initRun(E, { seed, difficulty, gens });
  const agent = new PlayerAgent(E, getPolicy(policy), { difficulty, runSeed: seed >>> 0 });
  agent.pickStarter(0);
  const raw = S.STORY_EVENTS_RAW;
  for (let pos = 0; pos < raw.length; pos++) {
    const ev = raw[pos];
    if (!ev) continue;
    const kind = ev[1];
    if (kind === 'City') {
      sm.eventIndex = pos; sm.badges = S.countGymBadgesBeforeStoryRow(pos);
      agent.doCity(pos);
      let city = -1; try { city = S.cityIndexForStoryRow(ev[0]); } catch (e) {}
      for (let k = 0; k < wildsPerCity; k++) {
        let w = null; try { w = E.window.__storyTest.rollWildEncounter(S.storySettingsGens()); } catch (e) {}
        const name = w && (w.name || w.species);
        if (!name) continue;
        const m = meta(name);
        onRecord({ tag, seed, kind: 'wild', pos, city, species: name, grade: m.grade, stage: m.stage, bst: m.bst, t1: m.t1, t2: m.t2 });
      }
      continue;
    }
    if (kind !== 'Battle') continue;
    agent.prepForBattle(pos, String(ev[2] || ''));
    let expectedSize = 0;
    try { expectedSize = S.storyEnemyPartySize(String(ev[2] || ''), Math.max(1, (sm.team || []).length), ev[0]); } catch (e) {}
    const rolled = rollFoeForRow(E, pos);
    if (!rolled) { onRecord({ tag, seed, kind: 'rollfail', pos, event: String(ev[2] || '') }); continue; }
    const eventName = rolled.eventName, role = roleOf(eventName);
    let city = -1; try { city = S.cityIndexForStoryRow(rolled.eid); } catch (e) {}
    const themeTypes = parseThemeTypes(rolled.trainer && rolled.trainer.type);
    const sigSet = sigFamily(rolled.trainer && rolled.trainer.sigs);
    const teamSize = rolled.foeSpecs.length;
    rolled.foeSpecs.forEach((spec, slot) => {
      const name = spec.name, m = meta(name);
      const matchesTheme = themeTypes.length ? (themeTypes.includes(m.t1) || themeTypes.includes(m.t2)) : null;
      onRecord({ tag, seed, kind: 'foe', pos, city, eid: rolled.eid, event: eventName, role,
        trainer: rolled.trainerName, theme: themeTypes.join('/') || null, foeMult: rolled.foeMult || 1,
        slot, species: name, grade: m.grade, stage: m.stage, bst: m.bst, t1: m.t1, t2: m.t2,
        isSig: sigSet.has(name), isAce: slot === 0, matchesTheme, teamSize, expectedSize });
    });
  }
}

async function main() {
  const A = parseArgs(process.argv.slice(2));
  const gens = gensOf(A.gens);
  mkdirSync(A.out, { recursive: true });
  const outPath = join(A.out, 'encounters.jsonl');
  writeFileSync(outPath, '');
  const _l = console.log; console.log = () => {};
  const E = await loadEngine();
  console.log = _l;
  const { meta, sigFamily } = makeMetaAccessor(E);
  const t0 = Date.now();
  let enc = 0;
  for (let seed = 1; seed <= A.seeds; seed++) {
    let buf = '';
    censusSeed(E, seed, { difficulty: A.difficulty, gens, wildsPerCity: A.wildsPerCity, policy: A.policy, tag: A.gens, meta, sigFamily },
      (r) => { buf += JSON.stringify(r) + '\n'; enc++; });
    appendFileSync(outPath, buf);
    if (seed % 20 === 0 || seed === A.seeds) _l(`[observe] ${seed}/${A.seeds} seeds, ${enc} encounters (${((Date.now() - t0) / seed).toFixed(0)}ms/seed)`);
  }
  _l(`\n[observe] done: ${enc} encounters across ${A.seeds} seeds -> ${outPath}`);
  E.teardown();
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error('observe crashed:', e); process.exit(1); });
