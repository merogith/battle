// Facilities-before-gym flow + per-fight balance (PR: story-mode flow fixes).
// Covers:
//   • Item 1 — the gym/VR/pre-League challenge is gated behind pending facility
//     intros, so the player meets new/upgraded facilities BEFORE the gym.
//   • Item 2 — staged-NPC tier-ups (Dojo / Move Tutor / Evolution Tutor) are a
//     pending "must-see" intro that joins the same force-visit gate.
//   • Item 4 — post-victory reward lines render ON the victory card (no longer
//     buried behind the z-index overlay as a toast).
//   • Item 5 — per-fight EV is buffed to 9 / 18 (a +50% general buff) and the whole team gains the same.
//   • Item 6 — per-fight vitamin loot counts get a +50% (round up) general buff.
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
test('EV gain: three tiers (REGULAR 9 / ACE 14 / BOSS 18) and the whole team gains the same', () => {
  assert.equal(ST.EV_GAIN_ACTIVE.REGULAR, 9, 'REGULAR EV is 9 (was 6, +50% general buff)');
  assert.equal(ST.EV_GAIN_ACTIVE.ACE, 14, 'ACE EV is 14 (middle tier — Elite/Ace trainers & miniBoss/miniRaid beats)');
  assert.equal(ST.EV_GAIN_ACTIVE.BOSS, 18, 'BOSS EV is 18 (was 12, +50% general buff)');
  const sum = (g) => g.hp + g.atk + g.def + g.spa + g.spd + g.spe;

  const team = [
    { name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
    { name: 'Snorlax', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
  ];
  setSm({ team });
  const reg = ST.grantBattleEVs('Basic Trainer', team, new Set([0])); // mon 0 active, mon 1 bench
  assert.ok(reg && reg.length === 2, 'every team member is trained, active and bench alike');
  for (const r of reg) assert.equal(sum(r.gained), 9, `${r.name} (active=${r.active}) gains 9 EVs — bench no longer halved`);

  const team2 = [
    { name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
    { name: 'Snorlax', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
  ];
  setSm({ team: team2 });
  const boss = ST.grantBattleEVs('Gym Leader 1', team2, new Set([0]));
  for (const r of boss) assert.equal(sum(r.gained), 18, `${r.name} gains 18 EVs on a boss fight`);

  const team3 = [
    { name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
    { name: 'Snorlax', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } },
  ];
  setSm({ team: team3 });
  const ace = ST.grantBattleEVs('Elite Trainer', team3, new Set([0]));
  for (const r of ace) assert.equal(sum(r.gained), 14, `${r.name} gains 14 EVs on an Elite (Ace) Trainer fight`);
});

// ── Item 6 — per-fight vitamin loot ──────────────────────────────────────────
test('vitamin loot: per-fight faucet is a flat 5 for non-boss ranks; leaders still bundle', () => {
  setSm({ badges: 0 });
  assert.equal(ST.storyTrainerLootVitamins('Basic Trainer'), 5, 'Basic = 5');
  assert.equal(ST.storyTrainerLootVitamins('Gym Trainer 1'), 5, 'Gym Trainer = 5');
  assert.equal(ST.storyTrainerLootVitamins('Elite Trainer'), 5, 'Elite = 5');
  assert.equal(ST.storyTrainerLootVitamins('Rival'), 5, 'Rival = 5 (flat, no badge ramp)');
  setSm({ badges: 1 });
  assert.equal(ST.storyTrainerLootVitamins('Rival'), 5, 'Rival = 5 regardless of badges (ramp removed)');
  // Bosses now drip 5 from the faucet too (vitamins no longer bundled).
  assert.equal(ST.storyTrainerLootVitamins('Gym Leader 1'), 5);
  assert.equal(ST.storyTrainerLootVitamins('E1'), 5);
  assert.equal(ST.storyTrainerLootVitamins('Champion'), 5);
});

// ── Loot + EV share one rank vocabulary (single classifier) ──────────────────
test('vitamin loot is keyed by the same rank classes as the EV curve', () => {
  // Both reward tables are keyed off _classifyTrainerEvent, so they must share
  // the same class set — guards against a future rank being added to one table
  // and forgotten in the other.
  assert.deepEqual(
    Object.keys(ST.VITAMIN_LOOT_BY_CLASS).sort(),
    Object.keys(ST.EV_GAIN_ACTIVE).sort(),
    'loot and EV tables share the same class keys (REGULAR/ACE/BOSS)'
  );
  assert.equal(ST.VITAMIN_LOOT_BY_CLASS.REGULAR, 5, 'REGULAR loot = 5 (Basic/Gym)');
  assert.equal(ST.VITAMIN_LOOT_BY_CLASS.ACE, 5, 'ACE loot = 5 (Elite)');
  assert.equal(ST.VITAMIN_LOOT_BY_CLASS.BOSS, 5, 'BOSS loot = 5 (bosses drip from the faucet)');
});

// ── 3-track beat EV upgrade — villain/extra boss trains like a Gym Leader ─────
test('beat EV: miniBoss/miniRaid beats grant ACE EV (14), boss-tier beats grant BOSS EV (18); battle falls through', () => {
  // The kind→class map upgrades narrative beats to match their rank.
  assert.equal(ST.BEAT_EV_CLASS.miniBoss, 'ACE', 'miniBoss beat pays the ACE middle tier');
  assert.equal(ST.BEAT_EV_CLASS.miniRaid, 'ACE', 'miniRaid beat pays the ACE middle tier');
  assert.equal(ST.BEAT_EV_CLASS.boss, 'BOSS');
  assert.equal(ST.BEAT_EV_CLASS.raid, 'BOSS');
  assert.equal(ST.BEAT_EV_CLASS.mysteryBoss, 'BOSS');
  assert.equal(ST.BEAT_EV_CLASS.battle, undefined, 'battle beat keeps the row class (REGULAR)');

  const sum = (g) => g.hp + g.atk + g.def + g.spa + g.spd + g.spe;
  // A villain boss beat lands on a Basic-Trainer row, but the BOSS override
  // trains the team like a Gym Leader (18) instead of a basic fight (9).
  const team = [{ name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } }];
  setSm({ team });
  const upgraded = ST.grantBattleEVs('Basic Trainer', team, new Set([0]), 'BOSS');
  for (const r of upgraded) assert.equal(sum(r.gained), 18, 'boss-beat override grants 18 EV on a Basic-Trainer row');

  // A miniBoss/miniRaid beat pays the ACE middle tier (14) regardless of the row.
  const teamAce = [{ name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } }];
  setSm({ team: teamAce });
  const aceBeat = ST.grantBattleEVs('Basic Trainer', teamAce, new Set([0]), 'ACE');
  for (const r of aceBeat) assert.equal(sum(r.gained), 14, 'miniBoss-beat override grants 14 EV on a Basic-Trainer row');

  // No override → the row's own class (Basic Trainer = REGULAR = 9).
  const team2 = [{ name: 'Pikachu', build: { evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } }];
  setSm({ team: team2 });
  const plain = ST.grantBattleEVs('Basic Trainer', team2, new Set([0]));
  for (const r of plain) assert.equal(sum(r.gained), 9, 'no override → basic-trainer EV (9)');
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
