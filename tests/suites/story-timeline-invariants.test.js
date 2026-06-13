// END-TO-END story-timeline enemy-team audit. Walks the WHOLE story mode (every Battle row
// in STORY_EVENTS_RAW) through the real assignTrainers + rollTrainerTeam pipeline via the
// headless _simulateStoryRunTeams engine, across several generation-lock settings and seeds,
// and asserts the hard invariants that define a correct enemy roster at every stage:
//
//   1. Known species   — every rolled mon resolves in baseStats (no typo'd / phantom name).
//   2. Gen-legal       — every mon's gen is in the run's enabled gens (no gen leak).
//   3. Legendary gate  — actual legendaries/mythicals appear ONLY on E1-E4 / Champion /
//                        Mystery (never on Basic / Gym Trainer / Gym Leader / Rival / Elite).
//   4. Grade ceiling   — no mon stronger than the city's early grade ceiling (no early spike).
//   5. Evo-stage cap   — no mon more evolved than the city allows (no early over-evolution).
//   6. Team size       — every battle fields exactly its rolled party size (no empty/short team).
//
// A failure here is a real bug (the message pinpoints gens+seed+event+city+species). Soft /
// design observations (type coherence, variety, grade progression) live in the report script
// scripts/debug/story-team-sweep.mjs, not here.
//
// Run: node --test tests/suites/story-timeline-invariants.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const S = eng.window.__storyTest;
const R = eng.window.__rivalTest;
const baseStats = R.baseStats;

const grade = (n) => R.getMonGrade(n, R.getBST(n));
const isLeg = (n) => !!(baseStats[n] && baseStats[n].legendary);
const evoStage = (n) => S.storyEvoStageOf(n);
// Legendaries are allowed ONLY on these top-tier fights (mirrors _allowLegendaryFiller).
const legendaryAllowed = (ev) => /^E[1-4]$/.test(ev) || ev === 'Champion' || ev === 'Mystery Figure';

// Per-trainer-NAME authored-signature index (a name may span roles — e.g. "Brock" the leader
// vs "Veteran Brock" — so we union by exact name). One intentional carve-out the legendary
// invariant must respect: an AUTHORED legendary signature (Veteran Lt. Surge's Zapdos, an
// eldritch Cursed Lance's Giratina, a Champion's ace) is the trainer's IDENTITY, not a random
// filler pull, so it's allowed wherever it's authored. The filler/synthetic legendary strip
// only ever touches RANDOM picks. Eldritch trainers are NO LONGER special — they follow the
// gen lock and filler rules of their role, so they get no blanket exemption here.
const TRAINER_BY_NAME = new Map();
for (const t of R.TRAINER_DATA) {
  if (!t || !t.name) continue;
  const cur = TRAINER_BY_NAME.get(t.name) || { sigs: new Set() };
  for (const s of (t.sigs || [])) cur.sigs.add(s);
  TRAINER_BY_NAME.set(t.name, cur);
}
const isAuthoredSig = (name, mon) => !!(TRAINER_BY_NAME.get(name) && TRAINER_BY_NAME.get(name).sigs.has(mon));

// A representative spread of generation locks: all-gens, three single-gen runs (each forces the
// fallback chain hard), and two multi-gen subsets. Two seeds each keeps the sweep deterministic
// but covers RNG variety without blowing up CI time.
const GEN_SETTINGS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1],
  [3],
  [5],
  [3, 7],
  [8, 9],
];
const SEEDS = [7, 99];

test('story timeline: every enemy mon obeys gen / legendary / grade-ceiling / evo-stage / known-species / size invariants', () => {
  const violations = [];
  let battlesChecked = 0, monsChecked = 0;

  for (const gens of GEN_SETTINGS) {
    const genSet = new Set(gens);
    for (const seed of SEEDS) {
      const res = S.simulateStoryRunTeams({ seed, enabledGens: gens, difficulty: 'normal', partySize: 6 });
      assert.equal(res.error, null, `sim threw for gens=[${gens}] seed=${seed}: ${res.error}`);
      assert.ok(res.rows.length > 0, `sim produced no battles for gens=[${gens}] seed=${seed}`);

      for (const r of res.rows) {
        battlesChecked++;
        const tag = `[gens=${gens.join('')} seed=${seed}] ${r.eventName}#${r.eid} city${r.cityIndex} (${r.trainer}/${r.trainerType})`;
        if (!Array.isArray(r.team) || r.team.length !== r.partySize) {
          violations.push(`${tag}: team size ${r.team ? r.team.length : 'none'} != expected ${r.partySize}`);
        }
        const ceiling = S.storyEnemyGradeCeilingForRow(r.eid); // strongest grade NUMBER allowed (1=G1…4=G4)
        const evoCap = S.storyEvoStageCapForRow(r.eid);
        const legOK = legendaryAllowed(r.eventName);
        for (const slot of (r.team || [])) {
          monsChecked++;
          const n = slot && slot.name;
          const b = baseStats[n];
          if (!b) { violations.push(`${tag}: unknown species "${n}"`); continue; }
          // EVERY trainer (eldritch included now) must be gen-legal.
          if (!genSet.has(b.gen)) violations.push(`${tag}: OFF-GEN ${n} (gen ${b.gen})`);
          // legendary is a LEAK only when it's a random filler pick on a non-top-tier trainer —
          // an authored ace is allowed wherever it's authored.
          if (!legOK && isLeg(n) && !isAuthoredSig(r.trainer, n)) violations.push(`${tag}: LEGENDARY ${n} leaked onto a non-E4/Champion trainer (not an authored ace)`);
          if (grade(n) < ceiling) violations.push(`${tag}: ${n} is G${grade(n)} — stronger than the city ceiling G${ceiling}`);
          if (evoStage(n) > evoCap) violations.push(`${tag}: ${n} evo-stage ${evoStage(n)} exceeds the city cap ${evoCap}`);
        }
      }
    }
  }

  assert.ok(battlesChecked > 100, `swept a full set of battles (got ${battlesChecked})`);
  assert.equal(
    violations.length, 0,
    `\nFound ${violations.length} invariant violation(s) across ${battlesChecked} battles / ${monsChecked} mons:\n` +
    violations.slice(0, 50).join('\n') + (violations.length > 50 ? `\n…and ${violations.length - 50} more` : '')
  );
});
