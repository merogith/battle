// Facilities-before-gym flow + per-fight balance (PR: story-mode flow fixes).
// Covers:
//   • Item 1 — the gym/VR/pre-League challenge is gated behind pending facility
//     intros, so the player meets new/upgraded facilities BEFORE the gym.
//   • Item 2 — staged-NPC tier-ups (Dojo / Move Tutor / Evolution Tutor) are a
//     pending "must-see" intro that joins the same force-visit gate.
//   • Item 4 — post-victory reward lines render ON the victory card (no longer
//     buried behind the z-index overlay as a toast).
//   • Item 5 — per-fight EV is +50% (6 / 12) and the whole team gains the same.
//   • Item 6 — per-fight vitamin loot counts are +50% (round up).
//   node --test tests/suites/story-facility-before-gym.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const SER = ST.STORY_EVENTS_RAW;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const cityRowWith = (c, action) => {
  for (let i = 0; i < SER.length; i++) {
    const r = SER[i];
    if (!Array.isArray(r) || r[1] !== 'City' || r[2] !== 'City' + c) continue;
    if (action && !(Array.isArray(r[5]) && r[5].includes(action))) continue;
    return i;
  }
  return -1;
};

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0, gold: 4500,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } }],
    settings: { enabledGens: GENS.slice() }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {},
    profUsed: {}, npcStageSeen: {}, gymCleared: {},
  }, extra);
  return ST.sm;
}

// ── Item 5 — per-fight EV ────────────────────────────────────────────────────
test('EV gain: +50% (REGULAR 6 / BOSS 12) and the whole team gains the same', () => {
  assert.equal(ST.EV_GAIN_ACTIVE.REGULAR, 6, 'REGULAR EV is 6 (was 4, +50%)');
  assert.equal(ST.EV_GAIN_ACTIVE.BOSS, 12, 'BOSS EV is 12 (was 8, +50%)');
  const sum = (g) => g.hp + g.atk + g.def + g.spa + g.spd + g.spe;

  const team = [
    { name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
    { name: 'Snorlax', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
  ];
  setSm({ team });
  const reg = ST.grantBattleEVs('Basic Trainer', team, new Set([0])); // mon 0 active, mon 1 bench
  assert.ok(reg && reg.length === 2, 'every team member is trained, active and bench alike');
  for (const r of reg) assert.equal(sum(r.gained), 6, `${r.name} (active=${r.active}) gains 6 EVs — bench no longer halved`);

  const team2 = [
    { name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
    { name: 'Snorlax', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
  ];
  setSm({ team: team2 });
  const boss = ST.grantBattleEVs('Gym Leader 1', team2, new Set([0]));
  for (const r of boss) assert.equal(sum(r.gained), 12, `${r.name} gains 12 EVs on a boss fight`);
});

// ── Item 6 — per-fight vitamin loot ──────────────────────────────────────────
test('vitamin loot: per-fight counts are +50% (round up); leaders still bundle', () => {
  setSm({ badges: 0 });
  assert.equal(ST.storyTrainerLootVitamins('Basic Trainer'), 2, 'Basic 1→2');
  assert.equal(ST.storyTrainerLootVitamins('Gym Trainer 1'), 2, 'Gym Trainer 1→2');
  assert.equal(ST.storyTrainerLootVitamins('Elite Trainer'), 3, 'Elite 2→3');
  assert.equal(ST.storyTrainerLootVitamins('Rival'), 2, 'Rival before 1st badge 1→2');
  setSm({ badges: 1 });
  assert.equal(ST.storyTrainerLootVitamins('Rival'), 5, 'Rival after 1st badge 3→5');
  // Leaders / elites / bosses carry vitamins in the victory bundle, not here.
  assert.equal(ST.storyTrainerLootVitamins('Gym Leader 1'), 0);
  assert.equal(ST.storyTrainerLootVitamins('E1'), 0);
  assert.equal(ST.storyTrainerLootVitamins('Champion'), 0);
});

// ── Item 2 — staged tier-up is a pending must-see intro ───────────────────────
test('staged tier-up registers as a pending intro at the upgrade city', () => {
  setSm({ npcStageSeen: { tutor: 0, evolab: 0, dojo: 0 } });
  assert.equal(ST.isFacilityStageUpPendingHere(4, 'tutor'), true, 'Move Tutor → Expert pending at C4');
  assert.equal(ST.isFacilityStageUpPendingHere(4, 'evolab'), true, 'Evolution Tutor → Master pending at C4');
  assert.equal(ST.isFacilityStageUpPendingHere(4, 'dojo'), false, 'Dojo still White Belt at C4 — no tier-up');
  assert.equal(ST.isFacilityStageUpPendingHere(5, 'dojo'), true, 'Dojo → Black Belt pending at C5');
  assert.equal(ST.isFacilityStageUpPendingHere(8, 'dojo'), true, 'Dojo → Grandmaster pending at C8');

  setSm({ npcStageSeen: { tutor: 1 } });
  assert.equal(ST.isFacilityStageUpPendingHere(4, 'tutor'), false, 'already-seen tier does not re-fire');

  setSm({ npcStageSeen: {} });
  assert.equal(ST.isFacilityStageUpPendingHere(0, 'tutor'), false, 'debut stage 0 is not a tier-up (first-visit beat owns it)');
});

// ── Items 1 + 2 — gym is gated until new/upgraded facilities are seen ─────────
test('gym is gated behind facility tier-ups, then opens once they are seen', () => {
  const gymRow = cityRowWith(4, 'Gym Battle');
  assert.ok(gymRow >= 0, 'found a City4 gym row');

  // All first-time facilities already introduced; Professor satisfied; lower NPC
  // tiers seen — but the C4 Move Tutor / Evolution Tutor tier-ups are NOT yet seen.
  const introsAll = { mart:1, tutor:1, nature:1, evolab:1, stoneShop:1, link:1, fanclub:1, dept:1, casino:1, dojo:1, evtrainer:1, colress:1, artifacts:1, safari:1, center:1, relic:1, bag:1, party:1 };
  setSm({ eventIndex: gymRow, badges: 3, facilityIntros: { ...introsAll }, npcStageSeen: { tutor: 0, evolab: 0, dojo: 0 }, profUsed: { 4: true } });

  const gated = W.__renderCityActionsForTest(gymRow);
  assert.ok(/Enter the Gym <span[^>]*>\(Visit [^)]*first\)/.test(gated), 'gym is disabled with a "Visit … first" facility hint while tier-ups are pending');

  // Mark the C4 tier-ups seen → the gym opens.
  ST.sm.npcStageSeen = { tutor: 1, evolab: 1, dojo: 0 };
  const open = W.__renderCityActionsForTest(gymRow);
  assert.ok(!/Enter the Gym <span[^>]*>\(Visit [^)]*first\)/.test(open), 'gym no longer carries the facility gate once tier-ups are seen');
  assert.ok(/Enter the Gym/.test(open), 'gym button is still present (now enabled)');
});

// ── Item 4 — reward lines render on the victory card ──────────────────────────
test('victory card shows the reward lines (loot is no longer buried behind the overlay)', () => {
  setSm({ gold: 1711, badges: 4 });
  const rewardLines = ['💊 Loot: +2 Protein, +1 Iron', '🏋️ EV training · +6 EVs to each of your 3 Pokémon'];
  ST.showVictoryOverlay('VICTORY!', 1711, false, () => {}, 'Basic Trainer', 5, rewardLines);

  const ov = W.document.querySelector('div[role="dialog"][aria-label="VICTORY!"]');
  assert.ok(ov, 'victory overlay rendered');
  assert.ok(ov.innerHTML.includes('💊 Loot: +2 Protein, +1 Iron'), 'vitamin loot shows on the card');
  assert.ok(ov.innerHTML.includes('EV training'), 'EV training shows on the card');

  // Dismiss to clear the auto-close timer and detach the overlay.
  const btn = ov.querySelector('button');
  if (btn) btn.click();
  assert.ok(!W.document.querySelector('div[role="dialog"][aria-label="VICTORY!"]'), 'overlay removed on dismiss');
});
