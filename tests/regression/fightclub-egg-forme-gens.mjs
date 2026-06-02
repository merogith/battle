// Regression: Fight Club rosters and Daycare egg rewards must never field a
// forme entry (Inteleon-Gmax, Charizard-Mega-X, Kyogre-Primal) and must honor
// the run's enabled-gens toggle.
//
// baseStats is seeded from gen-9 randbats + @pkmn/dex, so it holds ~130 forme
// entries that are NOT draftable species. The egg roll (_daycareRollHatchSpecies)
// and the pits roster (_pitsRollTrainerSix) used to iterate Object.keys(baseStats)
// raw with Math.random(), leaking those formes and ignoring the gen toggle. Both
// now route through the shared isStoryRollExcluded + enabled-gens guards.
//
//   node tests/regression/fightclub-egg-forme-gens.mjs
//
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const { window } = eng;
const E = window.__engine;
const SM = window.StoryMode;
const sm = SM.state;
const doc = window.document;

window.confirm = () => true;
window.alert = () => {};
window.showGameAlert = () => {};
window.showToast = () => {};
window.save = window.save || (() => {});

const baseStats = E.baseStats;
const isExcluded = window.__rivalTest.isStoryRollExcluded; // harness-only seam (inner StoryMode scope)
const genOf = (name) => (baseStats[name] || {}).gen;
const gradeOf = (name) => E.getMonGrade(name, E.getBST(name));

let PASS = 0, FAIL = 0;
function check(desc, cond) {
  if (cond) { PASS++; console.log(`  ✓ ${desc}`); }
  else { FAIL++; console.log(`  ✗ FAIL: ${desc}`); }
}

// Minimal active run. eventIndex 38 ~ Gym-6 era (story Fight Club unlock window);
// 50 ~ City8 (endgame-adjacent) for the city-scaling check.
function setupRun(enabledGens, eventIndex = 38) {
  sm.active = true;
  sm.badges = 6;
  sm.gold = 10000;
  sm.eventIndex = eventIndex;
  sm.storyDifficulty = 'normal';
  sm.settings = { enabledGens: enabledGens.slice() };
  sm.partyEverReached2 = true;
  sm.team = ['Garchomp', 'Gengar', 'Lapras', 'Snorlax', 'Gardevoir', 'Tyranitar'].map((n, i) => ({
    name: n, id: 'mon_' + i,
    build: { m: ['Tackle','Tackle','Tackle','Tackle'], i:null, a:null, n:'Hardy',
      ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31}, evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
      bonus:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0} },
  }));
  sm.pcBox = [];
  sm.daycare = { unlocked: true, eggEventDone: false };
  sm.pits = {
    gym6Snapshot: { badges:6, teamSummary: sm.team.map(t => ({ name:t.name, grade:2, bst:600 })), seed:1, capturedAt:0 },
    championSnapshot: null, winsThisVisit:0, bestStreak:0, payoutGold:0,
    fightClubUnlocked: true, secretRevealed: true, storyClubDone: false,
  };
}

// ── Fight Club roster (all gens) ────────────────────────────────────────────
console.log('\nFight Club roster — all gens enabled');
setupRun([1,2,3,4,5,6,7,8,9]);
let leaks = [], rounds = 0, mons = 0;
for (let trial = 0; trial < 30; trial++) {
  const roster = SM._pitsRollEnemyRoster();
  for (const round of roster) {
    rounds++;
    for (const foe of round.six) {
      mons++;
      if (isExcluded(foe.name)) leaks.push(foe.name);
    }
  }
}
check(`rolled ${rounds} rounds / ${mons} foes across 30 brackets`, mons > 0);
check('no Fight Club foe is a forme entry (mega/gmax/primal)', leaks.length === 0);
if (leaks.length) console.log('    leaked:', [...new Set(leaks)].slice(0, 10));

// ── Fight Club roster (gen 1 only) honors the toggle ────────────────────────
console.log('\nFight Club roster — gen 1 only');
setupRun([1]);
let offGen = [];
for (let trial = 0; trial < 30; trial++) {
  for (const round of SM._pitsRollEnemyRoster()) {
    for (const foe of round.six) {
      if (genOf(foe.name) !== 1) offGen.push(`${foe.name}(g${genOf(foe.name)})`);
      if (isExcluded(foe.name)) offGen.push(`${foe.name}(forme)`);
    }
  }
}
check('every gen-1-only Fight Club foe is a gen-1, non-forme species', offGen.length === 0);
if (offGen.length) console.log('    off-toggle:', [...new Set(offGen)].slice(0, 10));

// ── Fight Club difficulty scales with city (guards the grade-collapse bug) ──
// The base grade weights MUST come from authored STORY_EVENTS_RAW rows. A flat
// synthetic base collapses every round to G3 (the ramp/matrix only multiply
// existing mass). Assert: City8 fields meaningfully stronger grades than City6,
// and rosters are not pinned to a single grade.
console.log('\nFight Club difficulty scales with current city');
function gradeProfile(eventIndex) {
  setupRun([1,2,3,4,5,6,7,8,9], eventIndex);
  const hist = { 1:0, 2:0, 3:0, 4:0 }; let n = 0;
  for (let t = 0; t < 20; t++) {
    for (const round of SM._pitsRollEnemyRoster()) {
      for (const foe of round.six) { hist[gradeOf(foe.name)]++; n++; }
    }
  }
  // mean grade NUMBER (lower = stronger); fraction that are G2-or-better.
  const mean = (hist[1]*1 + hist[2]*2 + hist[3]*3 + hist[4]*4) / n;
  const strongFrac = (hist[1] + hist[2]) / n;
  return { hist, mean, strongFrac };
}
const c6 = gradeProfile(38); // City6
const c8 = gradeProfile(50); // City8
console.log(`  City6: mean grade ${c6.mean.toFixed(2)}, G1+G2 ${(c6.strongFrac*100).toFixed(0)}%`);
console.log(`  City8: mean grade ${c8.mean.toFixed(2)}, G1+G2 ${(c8.strongFrac*100).toFixed(0)}%`);
check('City8 foes are stronger-grade on average than City6 (city scaling lives)', c8.mean < c6.mean - 0.1);
check('City8 fields substantial G1/G2 mass (no grade-collapse to all-G3)', c8.strongFrac > 0.25);

// ── Daycare egg reward (all gens) ───────────────────────────────────────────
// Drive the real drop-off so _daycareRollHatchSpecies runs end-to-end.
function rollEgg() {
  sm.daycare = { unlocked: true, eggEventDone: false };
  SM.enterDaycare();
  const ov = doc.getElementById('story-daycare-overlay');
  if (!ov) return null;
  const btn = ov.querySelector('[data-daycare-drop="mon_0"]'); // drop Garchomp
  if (!btn) return null;
  btn.click();
  const egg = (sm.team || []).find(s => s && s.isEgg) || (sm.pcBox || []).find(s => s && s.isEgg);
  // Clean overlays + reset for the next roll.
  ['story-daycare-overlay','story-daycare-scene','story-hatch-scene','story-scene-overlay']
    .forEach(id => { const e = doc.getElementById(id); if (e) e.remove(); });
  return egg ? egg.eggSpecies : null;
}

console.log('\nDaycare egg reward — all gens enabled');
let eggLeaks = [], eggCount = 0;
for (let trial = 0; trial < 25; trial++) {
  setupRun([1,2,3,4,5,6,7,8,9]);
  const sp = rollEgg();
  if (sp) { eggCount++; if (isExcluded(sp)) eggLeaks.push(sp); }
}
check(`hatched ${eggCount} eggs`, eggCount > 0);
check('no egg hatch species is a forme entry', eggLeaks.length === 0);
if (eggLeaks.length) console.log('    leaked:', [...new Set(eggLeaks)]);

console.log('\nDaycare egg reward — gen 1 only');
let eggOffGen = [], eggCount2 = 0;
for (let trial = 0; trial < 25; trial++) {
  setupRun([1]);
  const sp = rollEgg();
  if (sp) {
    eggCount2++;
    // Parent (Garchomp) is gen 4 and not gen-1-legal; the fallback returns the
    // parent only when NO gen-1 candidate exists, which should be rare. Assert the
    // hatch is gen-1 OR the parent passthrough — never a forme, never some other gen.
    if (sp !== 'Garchomp' && genOf(sp) !== 1) eggOffGen.push(`${sp}(g${genOf(sp)})`);
    if (isExcluded(sp)) eggOffGen.push(`${sp}(forme)`);
  }
}
check(`hatched ${eggCount2} eggs (gen-1 run)`, eggCount2 > 0);
check('every gen-1 egg hatch is gen-1 (or parent passthrough), never a forme', eggOffGen.length === 0);
if (eggOffGen.length) console.log('    off-toggle:', [...new Set(eggOffGen)]);

console.log(`\n${'='.repeat(50)}\n  ${PASS} passed, ${FAIL} failed\n${'='.repeat(50)}`);
eng.teardown();
process.exit(FAIL ? 1 : 0);
