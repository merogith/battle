// Vibe Exchange (P2b) — engine foundation guards.
// The pre-battle exchange resolves via a Latin square (match → buff, one
// punishing mismatch → debuff, remainder neutral, Stoic always neutral) into
// a ±5% multiplier on the PLAYER side's damage dealt for that battle only.
// Picks accrue per-style counters; the leading track (lead ≥3, with
// hysteresis) is the run persona, which bends future foe-vibe odds (+10/20/30
// by tier). Persisted in sm.banterByRow / banterStats / banterPersona under
// SAVE_VER 27.
//   node --test tests/suites/banter-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let E, W, ST, SER;
before(async () => {
  E = await loadEngine();
  W = E.window;
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
});

function installLocalStorageShim() {
  const store = new Map();
  const shim = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(W, 'localStorage', { value: shim, configurable: true });
  return shim;
}

function freshSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, eventIndex: 0, badges: 0, gold: 1000, runSeed: 424242,
    team: [], settings: { enabledGens: [1] },
    banterByRow: {}, banterStats: { flirty: 0, positive: 0, negative: 0, stoic: 0 },
    banterPersona: { id: 'wildcard', tier: 0 },
  }, extra);
  return ST.sm;
}

// ── Resolution matrix (the Latin square) ─────────────────────────────────────
test('full pick × vibe matrix: match=buff, one debuff per style, stoic/silent neutral', () => {
  const M = (pick, vibe) => ST.banterResolve(pick, vibe);
  // match → buff
  for (const v of ['flirty', 'positive', 'negative']) assert.equal(M(v, v), 'buff', `${v} match`);
  // the three debuff cells
  assert.equal(M('flirty', 'positive'), 'debuff', 'flirting with the earnest one');
  assert.equal(M('positive', 'negative'), 'debuff', 'kindness fed to the narcissist');
  assert.equal(M('negative', 'flirty'), 'debuff', 'cruel rejection of a flirt');
  // the remaining cells are neutral
  assert.equal(M('flirty', 'negative'), 'neutral');
  assert.equal(M('positive', 'flirty'), 'neutral');
  assert.equal(M('negative', 'positive'), 'neutral');
  // stoic is ALWAYS the safe out; silent foes resolve nothing
  for (const v of ['flirty', 'positive', 'negative', 'silent']) assert.equal(M('stoic', v), 'neutral');
  for (const p of ['flirty', 'positive', 'negative']) assert.equal(M(p, 'silent'), 'neutral');
});

// jsdom objects live in another realm — normalize before deep comparisons.
const N = (o) => JSON.parse(JSON.stringify(o));

// ── Tiers ────────────────────────────────────────────────────────────────────
test('tier thresholds 4/10/18', () => {
  assert.deepEqual(N(ST.BANTER_TIER_THRESHOLDS), [4, 10, 18]);
  const tiers = [0, 3, 4, 9, 10, 17, 18, 40].map(n => ST.banterTierFor(n));
  assert.deepEqual(tiers, [0, 0, 1, 1, 2, 2, 3, 3]);
});

// ── Persona: acquire / Wildcard / hysteresis ─────────────────────────────────
test('persona acquisition needs a lead of 3; mixed play is the Wildcard', () => {
  freshSm({ banterStats: { flirty: 2, positive: 2, negative: 2, stoic: 0 } });
  assert.equal(ST.banterComputePersona().id, 'wildcard', 'even spread = Wildcard, not nothing');

  freshSm({ banterStats: { flirty: 5, positive: 2, negative: 0, stoic: 0 } });
  const p = ST.banterComputePersona();
  assert.equal(p.id, 'flirty', 'lead of 3 acquires');
  assert.equal(p.tier, 1, '5 picks = tier 1');
});

test('hysteresis: the persona holds until a challenger overtakes by 3', () => {
  // Flirty persona at 6; negative climbs to 7 (lead 1) — persona holds.
  freshSm({
    banterStats: { flirty: 6, positive: 0, negative: 7, stoic: 0 },
    banterPersona: { id: 'flirty', tier: 1 },
  });
  assert.equal(ST.banterComputePersona().id, 'flirty', 'no flip-flop at +1');
  // Negative reaches 9 (lead 3) — persona is stolen.
  ST.sm.banterStats.negative = 9;
  const p = ST.banterComputePersona();
  assert.equal(p.id, 'negative', 'overtaken by 3 → new persona');
  assert.equal(p.tier, 1, '9 picks = tier 1');
});

// ── Foe vibe roll: deterministic + persona mirroring ─────────────────────────
test('foe vibe roll is deterministic per (runSeed, row) and mirrors the persona', () => {
  freshSm();
  const a = ST.banterRollFoeVibe(12);
  const b = ST.banterRollFoeVibe(12);
  assert.equal(a, b, 'same seed + row → same vibe');
  assert.ok(['flirty', 'positive', 'negative', 'silent'].includes(a));

  const histogram = () => {
    const h = { flirty: 0, positive: 0, negative: 0, silent: 0 };
    for (let i = 0; i < 400; i++) h[ST.banterRollFoeVibe(i)]++;
    return h;
  };
  freshSm();
  const base = histogram();
  freshSm({ banterPersona: { id: 'flirty', tier: 3 } });
  const mirrored = histogram();
  assert.ok(mirrored.flirty > base.flirty + 20,
    `tier-3 flirty persona pulls flirty foes (${base.flirty} → ${mirrored.flirty})`);

  freshSm({ banterPersona: { id: 'stoic', tier: 3 } });
  const quiet = histogram();
  assert.ok(quiet.silent > base.silent + 20,
    `stoic persona attracts silent foes (${base.silent} → ${quiet.silent})`);
});

// ── Eligibility ──────────────────────────────────────────────────────────────
test('exchange offered on regular trainers/gym/rival; never on league/marquee rows', () => {
  freshSm();
  const idxOf = (pred) => SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && pred(String(r[2] || '')));
  assert.equal(ST.banterEligibleForRow(idxOf(e => e === 'Basic Trainer')), true, 'route trainer');
  assert.equal(ST.banterEligibleForRow(idxOf(e => /^Gym Leader/.test(e))), true, 'gym leader');
  assert.equal(ST.banterEligibleForRow(idxOf(e => e === 'Rival')), true, 'rival');
  assert.equal(ST.banterEligibleForRow(idxOf(e => /^E[1-4]$/.test(e))), false, 'elite four');
  assert.equal(ST.banterEligibleForRow(idxOf(e => e === 'Champion')), false, 'champion');
  assert.equal(ST.banterEligibleForRow(idxOf(e => e === 'Mystery Figure')), false, 'mystery figure');
  const cityIdx = SER.findIndex(r => Array.isArray(r) && r[1] === 'City');
  assert.equal(ST.banterEligibleForRow(cityIdx), false, 'city row');
});

// ── Recording + the battle multiplier ────────────────────────────────────────
test('recordExchange stamps the row, bumps the track, recomputes persona; mult follows', () => {
  const i = SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && String(r[2]) === 'Basic Trainer');
  const rowId = SER[i][0] | 0;
  freshSm({ eventIndex: i });

  const out = ST.banterRecordExchange(rowId, 'flirty', 'flirty');
  assert.equal(out, 'buff');
  assert.deepEqual(N(ST.sm.banterByRow[rowId]), { foeVibe: 'flirty', pick: 'flirty', outcome: 'buff' });
  assert.equal(ST.sm.banterStats.flirty, 1, 'track bumped');
  assert.equal(ST.storyBanterMultForCurrentBattle(), 1.05, 'buff → ×1.05 for THIS battle');

  // Retry/reload semantics: the record drives the mult — it is never re-rolled.
  ST.sm.banterByRow[rowId].outcome = 'debuff';
  assert.equal(ST.storyBanterMultForCurrentBattle(), 0.95, 'debuff → ×0.95');
  ST.sm.banterByRow[rowId].outcome = 'neutral';
  assert.equal(ST.storyBanterMultForCurrentBattle(), 1, 'neutral → ×1');
  delete ST.sm.banterByRow[rowId];
  assert.equal(ST.storyBanterMultForCurrentBattle(), 1, 'no exchange → ×1');
});

// ── Damage parity: player ±5% exactly; foe path untouched; story-only ────────
test('player damage scales ×1.05/×0.95/×1.00 by outcome; foe damage is byte-identical', async () => {
  const origRandom = W.Math.random;
  W.Math.random = () => 0.99; // pin roll, no crit
  try {
    const run = async (mode, banterMod) => {
      const player = E.mkMon({ species: 'Mew', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
      const foe = E.mkMon({ species: 'Sceptile', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
      E.reset();
      E.engine.state.pActive = player; E.engine.state.playerParty = [player];
      E.engine.state.fActive = foe; E.engine.state.foeParty = [foe];
      E.engine.state.mode = mode;
      E.engine.state.banterMod = banterMod;
      player.stats.spe = 999; // player moves first
      E.engine.setForcedFoeMoveSlot(0);
      const pHp = player.currentHp, fHp = foe.currentHp;
      await W.playTurn(0, null);
      return { playerDealt: fHp - foe.currentHp, foeDealt: pHp - player.currentHp };
    };

    const base = await run('story', 1);
    const buffed = await run('story', 1.05);
    const debuffed = await run('story', 0.95);
    assert.ok(base.playerDealt > 10, `sane baseline damage (${base.playerDealt})`);
    assert.equal(buffed.playerDealt, Math.max(1, Math.floor(base.playerDealt * 1.05)), 'buff = exactly ×1.05');
    assert.equal(debuffed.playerDealt, Math.max(1, Math.floor(base.playerDealt * 0.95)), 'debuff = exactly ×0.95');
    assert.equal(buffed.foeDealt, base.foeDealt, 'foe damage untouched by buff');
    assert.equal(debuffed.foeDealt, base.foeDealt, 'foe damage untouched by debuff');

    // Outside story mode the modifier is dead even if maliciously set.
    const pve = await run('pve', 1.05);
    assert.equal(pve.playerDealt, base.playerDealt, 'pve never reads banterMod');
  } finally {
    W.Math.random = origRandom;
  }
});

test('single application site, gated story + player side (source guard)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');
  assert.equal((src.match(/damage \* state\.banterMod/g) || []).length, 1, 'exactly one damage-path site');
  assert.ok(src.includes("state.mode === 'story' && isPlayer && state.banterMod"), 'site is story- and player-gated');
});

// ── Dialogue pools: schema + seeded selection ────────────────────────────────
test('banter-attitudes.json covers every cell with healthy pools', () => {
  const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dialogue', 'banter-attitudes.json'), 'utf8'));
  const pool = (arr, min, label) => {
    assert.ok(Array.isArray(arr) && arr.length >= min, `${label}: ≥${min} lines (got ${(arr || []).length})`);
    for (const s of arr) {
      assert.equal(typeof s, 'string');
      assert.ok(s.length > 0 && s.length <= 120, `${label}: line length sane ("${s.slice(0, 40)}…" = ${s.length})`);
    }
  };
  pool(J.openers, 10, 'openers');
  pool(J.openersGymLeader, 4, 'openersGymLeader');
  pool(J.openersRival, 4, 'openersRival');
  for (const vibe of ['flirty', 'positive', 'negative']) {
    for (const pick of ['flirty', 'positive', 'negative', 'stoic']) {
      pool(J.reactions[vibe][pick], 4, `reactions.${vibe}.${pick}`);
    }
    pool(J.reactionsT2[vibe][vibe], 3, `reactionsT2.${vibe} match cell`);
    pool(J.reactionsT3[vibe][vibe], 3, `reactionsT3.${vibe} match cell`);
    pool(J.postBattle[vibe].win, 3, `postBattle.${vibe}.win`);
    pool(J.postBattle[vibe].loss, 3, `postBattle.${vibe}.loss`);
  }
  for (const persona of ['flirty', 'positive', 'negative', 'stoic', 'wildcard']) {
    pool(J.repOpeners[persona], 4, `repOpeners.${persona}`);
  }
  for (const outcome of ['buff', 'debuff', 'neutral']) {
    pool(J.logBarks[outcome], 2, `logBarks.${outcome}`);
  }
});

test('line selection is seeded, tier-gates the match cell, and degrades safely', () => {
  const J = N(ST.BANTER_ATTITUDES);
  assert.ok(Array.isArray(J.openers) && J.openers.length >= 10, 'loader populated BANTER_ATTITUDES');

  freshSm();
  const a = ST.banterOpenerForRow(7, 'Basic Trainer');
  assert.equal(a, ST.banterOpenerForRow(7, 'Basic Trainer'), 'opener deterministic per row');
  assert.ok(J.openers.includes(a), 'opener drawn from the ambiguous pool');
  assert.ok(J.openersGymLeader.includes(ST.banterOpenerForRow(7, 'Gym Leader 3')), 'gym register');
  assert.ok(J.openersRival.includes(ST.banterOpenerForRow(7, 'Rival')), 'rival register');

  // Base reaction from the right cell; deeper pool only once the TRACK earns it.
  const r0 = ST.banterReactionLine(7, 'flirty', 'flirty');
  assert.ok(J.reactions.flirty.flirty.includes(r0), 'tier 0 match uses the base cell');
  ST.sm.banterStats.flirty = 10; // track tier 2
  const r2 = ST.banterReactionLine(7, 'flirty', 'flirty');
  assert.ok(J.reactionsT2.flirty.flirty.includes(r2), 'track tier 2 unlocks the deeper match pool');
  ST.sm.banterStats.flirty = 18; // track tier 3
  const r3 = ST.banterReactionLine(7, 'flirty', 'flirty');
  assert.ok(J.reactionsT3.flirty.flirty.includes(r3), 'track tier 3 unlocks the ceiling pool');
  assert.ok(J.reactions.flirty.stoic.includes(ST.banterReactionLine(7, 'flirty', 'stoic')), 'non-match cells never deepen');

  // Post-battle line keys off the recorded exchange; silent rows say nothing.
  freshSm();
  ST.sm.banterByRow[9] = { foeVibe: 'negative', pick: 'positive', outcome: 'debuff' };
  assert.ok(J.postBattle.negative.win.includes(ST.banterPostBattleLine(9, true)), 'win bucket');
  assert.ok(J.postBattle.negative.loss.includes(ST.banterPostBattleLine(9, false)), 'loss bucket');
  assert.equal(ST.banterPostBattleLine(404, true), '', 'no record → no line');
  assert.ok(J.logBarks.debuff.includes(ST.banterLogBark('debuff', 9)), 'log bark by outcome');
});

// ── Persistence: SAVE_VER 27 + migration round-trip ──────────────────────────
test('v25 save migrates to current SAVE_VER with banter fields seeded; banter data round-trips', () => {
  const LS = installLocalStorageShim();
  const plant = (extra) => LS.setItem('pbs_story_save', JSON.stringify(Object.assign({
    version: 25, active: true, storyLine: 'classic', eventIndex: 0, badges: 0,
    team: [{ species: 'Bulbasaur', level: 5 }],
    tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
    settings: { minGen: 1, maxGen: 9, enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  }, extra || {})));

  assert.equal(W.__STORY_SAVE_VER, 28, 'SAVE_VER bumped to 28 (1.6.0 dojo 4-tier / per-city cap)');

  // load() merges the parsed save onto the live sm (the early-let pattern),
  // so reset the in-memory banter fields to pristine zeros first — mirroring
  // a real boot, where the base sm literal supplies the defaults.
  freshSm();
  plant({ version: 25 });
  W.__storyLoad();
  let sm = ST.sm;
  assert.equal(sm.version, 28);
  assert.deepEqual(N(sm.banterStats), { flirty: 0, positive: 0, negative: 0, stoic: 0 });
  assert.deepEqual(N(sm.banterPersona), { id: 'wildcard', tier: 0 });
  assert.equal(typeof sm.banterByRow, 'object');

  // v26 → current seeds the same fields.
  freshSm();
  plant({ version: 26 });
  W.__storyLoad();
  assert.equal(ST.sm.version, 28);
  assert.deepEqual(N(ST.sm.banterPersona), { id: 'wildcard', tier: 0 });

  // v27 data survives a load untouched.
  freshSm();
  plant({
    version: 27,
    banterByRow: { 5: { foeVibe: 'negative', pick: 'negative', outcome: 'buff' } },
    banterStats: { flirty: 1, positive: 0, negative: 6, stoic: 2 },
    banterPersona: { id: 'negative', tier: 1 },
  });
  W.__storyLoad();
  sm = ST.sm;
  assert.deepEqual(N(sm.banterByRow[5]), { foeVibe: 'negative', pick: 'negative', outcome: 'buff' });
  assert.equal(sm.banterStats.negative, 6);
  assert.deepEqual(N(sm.banterPersona), { id: 'negative', tier: 1 });
});
