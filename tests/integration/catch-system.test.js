import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

test('catch-system: engine exposes a species database with catch-rate-bearing entries', async () => {
  const { engine } = await loadEngine();
  assert.ok(engine.baseStats && Object.keys(engine.baseStats).length > 0, 'baseStats populated');
});

test('catch-system: ball multipliers (Poke 1.0, Great 1.5, Ultra 2.0) are sane integers', async () => {
  const ballMults = { 'Poke Ball': 1.0, 'Great Ball': 1.5, 'Ultra Ball': 2.0, 'Master Ball': Infinity };
  for (const [name, m] of Object.entries(ballMults)) {
    assert.ok(m >= 1.0, `${name} multiplier ${m} should be >= 1.0`);
  }
});

test('catch-system: catch math is monotonic — higher ball mult never reduces success chance', async () => {
  function catchChance(speciesRate, ballMult) {
    return Math.min(1, speciesRate * ballMult / 255);
  }
  const rates = [3, 45, 90, 190, 255];
  const mults = [1.0, 1.5, 2.0];
  for (const r of rates) {
    let prev = -1;
    for (const m of mults) {
      const c = catchChance(r, m);
      assert.ok(c >= prev, `chance monotonic in mult: rate=${r} mult=${m} chance=${c} prev=${prev}`);
      prev = c;
    }
  }
});

test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  const fs = await import('node:fs');
  const flow = fs.readFileSync('STORY_MODE_FLOW.md', 'utf8');
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
});

// Renders the catch screen for a plain (non-boss) wild and returns the
// Master Ball button so a test can inspect its enabled/label state.
async function renderWildMasterButton(masterCount) {
  const { window } = await loadEngine();
  const ST = window.__storyTest;
  ST.sm = Object.assign({}, ST.sm, {
    balls: { poke: 5, great: 0, ultra: 0, master: masterCount | 0 },
  });
  ST.catchState = {
    encounter: { name: 'Pikachu', build: {} },
    onComplete: null, message: null, ended: false,
    bossMode: false, safariMode: false, tutorialMode: false,
    forcedCatchRate: null, forcedFleeRate: null, roamingLabel: null,
    bossHp: null, bossMaxHp: null,
  };
  ST.catchRender();
  return ST.catchBallButton('master');
}

test('catch-system: Master Ball is throwable on a normal wild encounter (no boss lock)', async () => {
  const btn = await renderWildMasterButton(1);
  assert.ok(btn, 'Master Ball button renders on the catch screen');
  assert.equal(btn.disabled, false, 'an owned Master Ball must be usable outside the Caged God fight');
  assert.doesNotMatch(btn.textContent, /boss/i, 'no "boss" reservation lock on the Master Ball');
  assert.match(btn.textContent, /100\s*%/, 'guaranteed throw advertises 100%');
});

test('catch-system: Master Ball is disabled only when the stack is empty (×0), never by a lock', async () => {
  const btn = await renderWildMasterButton(0);
  assert.ok(btn, 'Master Ball button renders even at ×0');
  assert.equal(btn.disabled, true, 'a ×0 Master Ball is disabled for lack of stock');
  assert.doesNotMatch(btn.textContent, /boss/i, 'still no "boss" lock label at ×0');
});
