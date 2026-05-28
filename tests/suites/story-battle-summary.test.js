// Phase 4.5 — in-battle stat tooltip surfaces EV total, IV avg, and the per-event
// story stat % symmetrically for player + enemy mons. The tooltip takes a `mon`
// object (so it's side-agnostic by construction); we just need to verify the
// new lines render when buildData + _storyStatMult are present.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

function makeMon(build) {
  return ST.buildPokemon('Garchomp', {
    m: ['Earthquake'], i: '', n: 'Hardy', a: 'Sand Veil',
    evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 0, spe: 4 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...(build || {}),
  });
}

test('tooltip shows EV total + IV avg from buildData', () => {
  const mon = makeMon();
  const html = ST.getStatTooltipHTML(mon);
  assert.match(html, /EV 508\/510/, 'EV total surfaces');
  assert.match(html, /IV avg 31\/31/, 'IV avg surfaces');
});

test('tooltip shows the per-event stat % when _storyStatMult is set', () => {
  const debufMon = makeMon({ _storyStatMult: 0.80 });
  const buffMon  = makeMon({ _storyStatMult: 1.30 });
  const baseMon  = makeMon();
  const htmlD = ST.getStatTooltipHTML(debufMon);
  const htmlB = ST.getStatTooltipHTML(buffMon);
  const htmlN = ST.getStatTooltipHTML(baseMon);
  assert.match(htmlD, /Story stat -20%/, 'debuff % visible');
  assert.match(htmlB, /Story stat \+30%/, 'buff % visible');
  assert.ok(!/Story stat/.test(htmlN), 'neutral mon has no Story stat line');
});

test('tooltip preserves stat-stage badges (atk +1 / spe -2)', () => {
  const mon = makeMon();
  mon.stages.atk = 1;
  mon.stages.spe = -2;
  const html = ST.getStatTooltipHTML(mon);
  assert.match(html, /Atk: \d+ <span[^>]*>\+1</, 'atk stage +1 chip');
  assert.match(html, /Spe: \d+ <span[^>]*>-2</, 'spe stage -2 chip');
});
