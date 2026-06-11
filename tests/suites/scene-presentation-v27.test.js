// Scene presentation (P3) — guards for the upgraded scene/narration layer:
//   • _storyScene's new optional fields (backdropCss / backdropScene / cast /
//     fx) render, and their ABSENCE renders the legacy card unchanged (flat
//     black overlay, no cast row) with the options flow intact,
//   • the camp menu is a full night scene (sky gradient + fire glow + lead +
//     party cast) with its option labels byte-identical (the camp-*-v25
//     suites are the deeper canary),
//   • _renderNarrativeOverlay's revealLines stages lines one tap at a time
//     (and never dismisses past an unread beat); spriteSide builds the duo
//     framing; defaults keep the legacy column + full-text contract,
//   • the route interstitial casts the lead partner.
//   node --test tests/suites/scene-presentation-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E, W, ST, SER, doc;
before(async () => {
  E = await loadEngine();
  W = E.window;
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
  doc = W.document;
});

const MON = { name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } } };
function freshSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, eventIndex: 0, badges: 1, gold: 1000, runSeed: 9,
    team: [{ ...MON }, { ...MON, name: 'Eevee' }], settings: { enabledGens: [1] },
    scenesShown: {}, routeShown: {}, wanderByEventIdx: {}, campByEventIdx: {},
  }, extra);
  return ST.sm;
}
const clear = (id) => { const o = doc.getElementById(id); if (o) o.remove(); };

// ── Legacy default: no new fields → flat black, no cast, flow intact ────────
test('plain beats render the legacy card (no cast, flat backdrop) and the flow works', () => {
  freshSm();
  let finished = false;
  let picked = '';
  ST.storyScene([
    { id: 'a', title: 'First', html: '<div>one</div>', options: [
      { label: 'Go on', onPick: () => { picked = 'a'; }, goto: 'b' },
    ] },
    { id: 'b', title: 'Second', html: '<div>two</div>' },
  ], () => { finished = true; }, 'scene-test-1');

  const ov = doc.getElementById('scene-test-1');
  assert.ok(ov, 'overlay mounted');
  assert.equal(ov.style.background, 'rgba(0, 0, 0, 0.93)', 'legacy flat backdrop');
  assert.ok(!ov.querySelector('.story-scene-cast'), 'no cast row by default');
  assert.ok(ov.querySelector('.story-scene-card'), 'card rendered');

  ov.querySelector('[data-scene-opt="0"]').click();
  assert.equal(picked, 'a', 'onPick ran');
  assert.match(ov.textContent, /Second/, 'goto advanced to beat b');
  ov.querySelector('[data-scene-cont="1"]').click(); // last beat → finish
  assert.equal(finished, true, 'onDone fired');
  assert.ok(!doc.getElementById('scene-test-1'), 'overlay removed');
});

// ── New fields: cast + backdrop + fx ─────────────────────────────────────────
test('cast sprites, manifest backdrop, and fx classes render when declared', () => {
  freshSm();
  ST.storyScene([{
    title: 'Cast', html: '<div>x</div>',
    backdropScene: 'forest', fx: 'fire',
    cast: [{ mon: 'Pikachu', size: 112 }, { spriteFile: 'Oak', size: 44 }],
  }], null, 'scene-test-2');
  const ov = doc.getElementById('scene-test-2');
  const cast = ov.querySelector('.story-scene-cast');
  assert.ok(cast, 'cast row rendered');
  assert.ok(cast.classList.contains('scene-fx-fire'), 'fx class on the cast');
  assert.equal(cast.querySelectorAll('img.story-scene-cast-img').length, 2, 'both cast sprites');
  assert.match(ov.style.background, /gen3-forest\.png/, 'manifest scene image behind a gradient');
  clear('scene-test-2');
});

test('backdrop resets between beats (reused element cannot leak a scene)', () => {
  freshSm();
  ST.storyScene([
    { title: 'A', html: 'a', backdropScene: 'cave' },
    { title: 'B', html: 'b' },
  ], null, 'scene-test-3');
  const ov = doc.getElementById('scene-test-3');
  assert.match(ov.style.background, /gen3-cave\.png/, 'beat 1 backdrop');
  ov.querySelector('[data-scene-cont="1"]').click();
  assert.equal(ov.style.background, 'rgba(0, 0, 0, 0.93)', 'beat 2 falls back to flat black');
  ov.querySelector('[data-scene-cont="1"]').click(); // finish
});

// ── Camp: full night scene, labels unchanged ─────────────────────────────────
test('camp menu renders the night scene with the party cast; labels unchanged', () => {
  freshSm();
  ST.enterCamp(5, () => {});
  const ov = doc.getElementById('story-camp-scene');
  assert.ok(ov, 'camp scene mounted');
  assert.match(ov.style.background, /linear-gradient/, 'night-sky backdrop');
  const cast = ov.querySelector('.story-scene-cast');
  assert.ok(cast && cast.classList.contains('scene-fx-fire'), 'firelight cast row');
  assert.equal(cast.querySelectorAll('img').length, 2, 'lead + 1 partner cast');
  const labels = [...ov.querySelectorAll('[data-scene-opt]')].map(b => b.textContent);
  assert.ok(labels.includes('🔥  Spend time with your team'), 'bond option label byte-identical');
  assert.ok(labels.includes('▶▶  Break camp'), 'break-camp label byte-identical');
  clear('story-camp-scene');
});

// ── Narration overlay: defaults exact, duo framing, staged reveal ────────────
test('narration defaults: column layout, every line visible (full-text contract)', () => {
  ST.sm = { storyChoices: {} };
  const ov = ST.renderNarrativeOverlay({ lines: ['l1', 'l2'], onDone: () => {} });
  assert.ok(!ov.querySelector('.story-narr-duo'), 'no duo wrapper by default');
  assert.equal(ov.querySelectorAll('.story-narr-line-hidden').length, 0, 'no hidden lines by default');
  assert.match(ov.textContent, /l1/, 'line 1 in full text');
  assert.match(ov.textContent, /l2/, 'line 2 in full text');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

test('spriteSide builds the side-by-side speaker framing', () => {
  ST.sm = { storyChoices: {} };
  const ov = ST.renderNarrativeOverlay({ lines: ['x'], sprite: 'Oak', spriteSide: 'left', onDone: () => {} });
  const duo = ov.querySelector('.story-narr-duo');
  assert.ok(duo, 'duo wrapper rendered');
  assert.ok(duo.querySelector('img'), 'sprite inside the duo');
  assert.ok(duo.querySelector('.story-dialog-host'), 'dialog inside the duo');
  const ov2 = (ov.querySelector('button[data-narr-continue="1"]').click(),
    ST.renderNarrativeOverlay({ lines: ['x'], sprite: 'Oak', spriteSide: 'right', onDone: () => {} }));
  assert.ok(ov2.querySelector('.story-narr-duo-right'), 'right variant');
  ov2.querySelector('button[data-narr-continue="1"]').click();
});

test('revealLines stages lines per tap and never dismisses past an unread beat', () => {
  ST.sm = { storyChoices: {} };
  let done = false;
  const ov = ST.renderNarrativeOverlay({ lines: ['s1', 's2', 's3'], revealLines: true, onDone: () => { done = true; } });
  const hidden = () => ov.querySelectorAll('.story-narr-line-hidden').length;
  assert.equal(hidden(), 2, 'lines 2+3 staged');
  // Full-text contract still holds — hidden lines are in the DOM text.
  assert.match(ov.textContent, /s3/);
  const cont = ov.querySelector('button[data-narr-continue="1"]');
  cont.click();
  assert.equal(hidden(), 1, 'tap 1 reveals line 2');
  assert.equal(done, false, 'not dismissed');
  cont.click();
  assert.equal(hidden(), 0, 'tap 2 reveals line 3');
  assert.equal(done, false, 'still not dismissed');
  cont.click();
  assert.equal(done, true, 'final tap dismisses');
  assert.equal(ov.parentNode, null, 'overlay removed');
});

// ── Route interstitial casts the lead partner ────────────────────────────────
test('route departure card shows the lead partner sprite', () => {
  // Find a battle row the interstitial actually fires for.
  let fired = false;
  for (let i = 0; i < SER.length && !fired; i++) {
    const r = SER[i];
    if (!Array.isArray(r) || r[1] !== 'Battle') continue;
    freshSm({ eventIndex: i, routeShown: {} });
    fired = ST.maybeShowRouteInterstitial(r, () => {});
  }
  assert.ok(fired, 'an interstitial fired for some route');
  const body = doc.querySelector('[data-narr-body="1"]');
  assert.ok(body, 'departure overlay mounted');
  const ovRoot = body.closest('div[style*="fixed"]') || body.closest('body > div');
  const img = (ovRoot || doc).querySelector('img');
  assert.ok(img && img.getAttribute('src'), 'lead partner sprite rendered on the card');
  // Dismiss to keep the stage clean for other suites.
  const btn = (ovRoot || doc).querySelector('button[data-narr-continue="1"]');
  if (btn) btn.click();
});
