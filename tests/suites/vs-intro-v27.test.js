// P2a — VS intro dispatch: interactive Vibe Exchange on eligible story
// trainer rows (once per row), static Marquee Entry title cards for league
// fights, and the legacy timed splash for everything else (including the
// fallback when a marquee script is missing and the crucible guard).
//   node --test tests/suites/vs-intro-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E, W, ST, SER;
before(async () => {
  E = await loadEngine();
  W = E.window;
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
  W.__vsInputArmMs = 0; // buffered-input guard off under the harness
});

const tick = (ms = 8) => new Promise(r => setTimeout(r, ms));
const N = (o) => JSON.parse(JSON.stringify(o));
const TRAINER = { name: 'Picnicker Liz', spriteFile: 'Picnicker', type: 'Normal' };

function freshSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, eventIndex: 0, badges: 1, gold: 1000, runSeed: 424242,
    team: [], settings: { enabledGens: [1] },
    scenesShown: { 'tutorial-first-trainer-battle': true }, // skip the intro tutorial
    banterByRow: {}, banterStats: { flirty: 0, positive: 0, negative: 0, stoic: 0 },
    banterPersona: { id: 'wildcard', tier: 0 },
    crucibleBattleSource: null,
  }, extra);
  return ST.sm;
}

// An eligible Basic Trainer row whose seeded vibe roll is NOT silent.
function talkativeBasicRow() {
  freshSm();
  for (let i = 0; i < SER.length; i++) {
    const r = SER[i];
    if (!Array.isArray(r) || r[1] !== 'Battle' || String(r[2]) !== 'Basic Trainer') continue;
    if (!ST.banterEligibleForRow(i)) continue;
    if (ST.banterRollFoeVibe(i) !== 'silent') return { arrIdx: i, rowId: r[0] | 0 };
  }
  throw new Error('no talkative basic-trainer row under this seed');
}

function clearOverlays() {
  [...W.document.querySelectorAll('body > div')].forEach(d => {
    if (d.style && /fixed/.test(d.style.position || '')) { try { d.remove(); } catch (e) {} }
  });
}

// ── The interactive exchange, end to end ─────────────────────────────────────
test('eligible trainer row: exchange offers 4 picks, records, then launches', async () => {
  const { arrIdx, rowId } = talkativeBasicRow();
  const vibe = ST.banterRollFoeVibe(arrIdx);
  freshSm({ eventIndex: arrIdx });
  let launched = 0;
  ST.showBattleIntro(TRAINER, 'Basic Trainer', () => launched++, rowId);
  await tick();

  const picks = [...W.document.querySelectorAll('button[data-vs2-pick]')];
  assert.equal(picks.length, 4, 'four pick buttons');
  const opener = W.document.querySelector('[data-vs2-line="1"]').textContent.replace(/^"|"$/g, '');
  const B = N(ST.BANTER_ATTITUDES);
  assert.ok(B.openers.includes(opener), 'opener drawn from the ambiguous pool');

  const pickBtn = picks.find(b => b.getAttribute('data-vs2-pick') === 'positive');
  pickBtn.click();
  assert.equal(launched, 0, 'picking does not launch yet');
  const rec = N(ST.sm.banterByRow[rowId]);
  assert.equal(rec.pick, 'positive');
  assert.equal(rec.foeVibe, vibe, 'recorded vibe matches the seeded roll');
  assert.equal(rec.outcome, ST.banterResolve('positive', vibe), 'outcome follows the matrix');
  assert.equal(ST.sm.banterStats.positive, 1, 'track bumped');

  const reaction = W.document.querySelector('[data-vs2-line="1"]').textContent.replace(/^"|"$/g, '');
  assert.ok(B.reactions[vibe].positive.includes(reaction), 'reaction reveals the vibe from the right cell');
  const badge = W.document.querySelector('.vs2-outcome-badge');
  assert.ok(badge && badge.classList.contains(rec.outcome), 'outcome badge class matches');

  W.document.querySelector('button[data-vs2-battle="1"]').click();
  assert.equal(launched, 1, 'battle button launches');
  assert.ok(!W.document.querySelector('[data-vs2-battle]'), 'overlay removed');
});

// ── Once per row: a recorded exchange falls back to the splash ───────────────
test('a row with a recorded exchange shows the legacy splash (no re-banter)', async () => {
  const { arrIdx, rowId } = talkativeBasicRow();
  freshSm({ eventIndex: arrIdx, banterByRow: { [rowId]: { foeVibe: 'flirty', pick: 'stoic', outcome: 'neutral' } } });
  ST.showBattleIntro(TRAINER, 'Basic Trainer', () => {}, rowId);
  await tick();
  assert.ok(!W.document.querySelector('[data-vs2-picks]'), 'no exchange UI');
  assert.ok([...W.document.querySelectorAll('div')].some(d => /Battle starting…/.test(d.textContent || '')), 'legacy splash path');
  clearOverlays();
});

// ── Marquee entry ────────────────────────────────────────────────────────────
test('E1 gets the marquee title card; Continue launches', async () => {
  const e1 = SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && String(r[2]) === 'E1');
  assert.ok(e1 >= 0, 'timeline has E1');
  freshSm({ eventIndex: e1 });
  let launched = 0;
  ST.showBattleIntro({ name: 'Lorelei', spriteFile: 'Lorelei', type: 'Ice' }, 'E1', () => launched++, SER[e1][0] | 0);
  await tick();

  const name = W.document.querySelector('.vs-marquee-name');
  assert.ok(name && name.textContent === 'Lorelei', 'marquee shows the rolled trainer');
  const kicker = W.document.querySelector('.vs-marquee-kicker');
  assert.match(kicker.textContent, /ELITE FOUR/, 'kicker from marquee-entries.json');
  assert.ok(!W.document.querySelector('[data-vs2-picks]'), 'no exchange on league fights');

  W.document.querySelector('button[data-vs2-battle="1"]').click();
  assert.equal(launched, 1, 'Face them launches');
  assert.ok(!W.document.querySelector('.vs-marquee-name'), 'overlay removed');
});

test('a missing marquee script falls back to the legacy splash', async () => {
  const e1 = SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && String(r[2]) === 'E1');
  freshSm({ eventIndex: e1 });
  const MQ = W.MARQUEE_ENTRIES;
  const saved = MQ.E1;
  delete MQ.E1;
  try {
    ST.showBattleIntro({ name: 'Lorelei', spriteFile: 'Lorelei', type: 'Ice' }, 'E1', () => {}, SER[e1][0] | 0);
    await tick();
    assert.ok(!W.document.querySelector('.vs-marquee-name'), 'no marquee without a script');
    assert.ok([...W.document.querySelectorAll('div')].some(d => /Battle starting…/.test(d.textContent || '')), 'legacy splash fallback');
  } finally {
    MQ.E1 = saved;
    clearOverlays();
  }
});

// ── Defeat card (P2d): the victorious foe gets the last word ─────────────────
test('defeat card shows the foe parting line from the loss bucket', async () => {
  const { arrIdx, rowId } = talkativeBasicRow();
  const vibe = ST.banterRollFoeVibe(arrIdx);
  freshSm({
    eventIndex: arrIdx,
    banterByRow: { [rowId]: { foeVibe: vibe, pick: 'negative', outcome: 'neutral' } },
    currentTrainerData: { name: 'Picnicker Liz', type: 'Normal' },
    stats: { battlesLost: 0 }, inventory: {}, gymCleared: {}, trainerAssignments: {},
  });
  E.engine.state.mode = 'story';
  E.engine.state.playerParty = [];
  E.engine.state.foeParty = [];
  W.StoryMode.onBattleEnd(false, 'Defeat', '');
  await tick();

  const el = W.document.getElementById('story-gameover-banter');
  assert.ok(el && el.style.display !== 'none', 'parting line shown');
  const B = N(ST.BANTER_ATTITUDES);
  assert.ok(B.postBattle[vibe].loss.some(l => el.textContent.includes(l)), 'line from the loss bucket');
  assert.match(el.textContent, /^Picnicker Liz: /, 'attributed to the foe');

  // No exchange recorded → the line hides again.
  freshSm({ eventIndex: arrIdx, currentTrainerData: { name: 'Picnicker Liz', type: 'Normal' }, stats: { battlesLost: 0 }, inventory: {}, gymCleared: {}, trainerAssignments: {} });
  W.StoryMode.onBattleEnd(false, 'Defeat', '');
  await tick();
  assert.equal(W.document.getElementById('story-gameover-banter').style.display, 'none', 'hidden without a record');
  [...W.document.querySelectorAll('.screen,.modal')].forEach(s => s.classList.add('hidden'));
});

// ── Crucible guard ───────────────────────────────────────────────────────────
test('crucible-sourced fights never banter or marquee', async () => {
  const { arrIdx, rowId } = talkativeBasicRow();
  freshSm({ eventIndex: arrIdx, crucibleBattleSource: 'league' });
  ST.showBattleIntro(TRAINER, 'Basic Trainer', () => {}, rowId);
  await tick();
  assert.ok(!W.document.querySelector('[data-vs2-picks]'), 'no exchange UI for crucible re-fights');
  clearOverlays();
});
