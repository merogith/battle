// Story narration system — structured scenes (event arc + interaction),
// the unified anti-stacking overlay queue, structured battle outros, and
// up-next/dispatch preview parity. Guards the unification foundation so a
// later session can't silently regress it.
//
// Surface under test: window.__narrationTest (exposed only under the jsdom
// harness). See battle.html `_playSceneActs` / `_renderNarrativeOverlay` /
// `_canonTrainerForUpcomingBattle`.

import { test, before } from 'node:test';
import assert from 'node:assert';
import { loadEngine } from '../helpers/load-engine.js';

let nt, document;

before(async () => {
  const { window } = await loadEngine();
  nt = window.__narrationTest;
  document = window.document;
  assert.ok(nt, 'window.__narrationTest must be exposed under the harness');
});

// ── Schema: the converted Team Rocket arc ───────────────────────────────────
test('rocket arc events carry the structured `acts` schema', () => {
  const S = nt.STORY_SCENES;
  for (const key of ['villain.rocket.event1', 'villain.rocket.event2',
                     'villain.rocket.event3', 'villain.rocket.event6',
                     'villain.rocket.ending']) {
    const sc = S[key];
    assert.ok(sc, `${key} exists`);
    assert.ok(Array.isArray(sc.acts) && sc.acts.length >= 2, `${key} has acts`);
    // Legacy flat body retained as a fallback for any unconverted path.
    assert.ok(typeof sc.body === 'string' && sc.body.length, `${key} keeps body`);
  }
});

test('rocket boss has a pre-fight arc AND a structured win outro', () => {
  const boss = nt.STORY_SCENES['villain.rocket.boss'];
  assert.ok(Array.isArray(boss.acts) && boss.acts.length, 'boss has pre-fight acts');
  assert.ok(boss.outro && Array.isArray(boss.outro.win) && boss.outro.win.length,
    'boss has outro.win');
  // The mechanic/spoiler markers stay only in the legacy body, not the acts.
  const actText = JSON.stringify(boss.acts);
  assert.ok(!/Phase 3 at 25%|CALLED IN/.test(actText),
    'pre-fight acts must not leak boss-mechanic telegraph text');
});

test('unconverted scenes stay legacy-flat (backward compatible)', () => {
  const magma = nt.STORY_SCENES['villain.magma.event1'];
  assert.ok(magma && typeof magma.body === 'string', 'legacy scene intact');
  assert.equal(magma.acts, undefined, 'unconverted scene has no acts');
});

// ── Branching text (cross-event callback) ───────────────────────────────────
test('event3 development branches on the event2 choice', () => {
  const dev = nt.STORY_SCENES['villain.rocket.event3'].acts
    .find(a => Array.isArray(a.branches));
  assert.ok(dev, 'event3 has a branching act');

  nt.sm = { storyChoices: { 'villain.rocket.driver': 'leaned' } };
  const leaned = nt.resolveActLines(dev).join(' ');
  assert.match(leaned, /thread pulled/i, 'leaned branch references the pulled thread');

  nt.sm = { storyChoices: { 'villain.rocket.driver': 'freed' } };
  const freed = nt.resolveActLines(dev).join(' ');
  assert.match(freed, /no thread to pull/i, 'freed branch references no thread');

  // No prior choice → the when-less default branch.
  nt.sm = { storyChoices: {} };
  const def = nt.resolveActLines(dev).join(' ');
  assert.ok(def.length && def !== leaned && def !== freed, 'default branch differs');
});

test('resolveActChoices maps a choice act onto the overlay contract', () => {
  const climax = nt.STORY_SCENES['villain.rocket.event2'].acts
    .find(a => a.choice);
  assert.ok(climax, 'event2 has a choice act');
  const choices = nt.resolveActChoices(climax);
  assert.equal(choices.length, 2, 'two options');
  for (const c of choices) {
    assert.equal(c.persistKey, 'villain.rocket.driver', 'persistKey propagated');
    assert.ok(typeof c.label === 'string' && c.label.length, 'has label');
    assert.ok(Array.isArray(c.reply) && c.reply.length, 'has reply lines');
    assert.ok(['leaned', 'freed'].includes(c.value), 'has a defined value');
  }
});

test('progress dots mark arc position, blank for single-act scenes', () => {
  assert.equal(nt.sceneProgressDots(0, 4), '●◦◦◦');
  assert.equal(nt.sceneProgressDots(2, 4), '◦◦●◦');
  assert.equal(nt.sceneProgressDots(3, 4), '◦◦◦●');
  assert.equal(nt.sceneProgressDots(0, 1), '');
});

// ── Anti-stacking overlay queue ─────────────────────────────────────────────
test('overlays serialize: a second request queues until the first dismisses', () => {
  nt.sm = { storyChoices: {} };
  assert.equal(nt.isNarrationLive(), false, 'clean stage to start');

  const ov1 = nt.renderNarrativeOverlay({ lines: ['first'], onDone: () => {} });
  assert.equal(ov1.parentNode, document.body, 'first overlay mounts immediately');
  assert.equal(nt.isNarrationLive(), true);
  assert.equal(nt.narrationQueueDepth(), 0);

  const ov2 = nt.renderNarrativeOverlay({ lines: ['second'], onDone: () => {} });
  assert.equal(ov2.parentNode, null, 'second overlay is NOT mounted (queued)');
  assert.equal(nt.narrationQueueDepth(), 1, 'second overlay is queued');

  // Dismiss the first → the second flushes in.
  ov1.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(ov1.parentNode, null, 'first overlay removed on dismiss');
  assert.equal(ov2.parentNode, document.body, 'queued overlay mounted after dismiss');
  assert.equal(nt.narrationQueueDepth(), 0);

  ov2.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(nt.isNarrationLive(), false, 'stage clear after both dismiss');
});

// ── Interactive choice persistence ──────────────────────────────────────────
test('picking a choice persists to sm.storyChoices for later callbacks', () => {
  nt.sm = { storyChoices: {} };
  const climax = nt.STORY_SCENES['villain.rocket.event2'].acts.find(a => a.choice);
  const choices = nt.resolveActChoices(climax);

  let doneFired = false;
  const ov = nt.renderNarrativeOverlay({
    lines: ['situation'], choices, metaKey: null, onDone: () => { doneFired = true; },
  });
  // Pick option 0 ("leaned").
  ov.querySelector('button[data-narr-choice-idx="0"]').click();
  assert.equal(nt.sm.storyChoices['villain.rocket.driver'], 'leaned',
    'choice value persisted under the act persistKey');

  // After a pick the choice row is replaced by a single Continue.
  const cont = ov.querySelector('button[data-narr-continue="1"]');
  assert.ok(cont, 'continue button replaces the choice row after a pick');
  cont.click();
  assert.equal(doneFired, true, 'onDone fires after the reply is dismissed');
  assert.equal(nt.isNarrationLive(), false);
});

// ── Structured battle outro ─────────────────────────────────────────────────
test('playPostBattleScene prefers the structured outro.win', () => {
  nt.sm = { storyChoices: {} };
  let done = false;
  const fired = nt.playPostBattleScene('villain.rocket.boss', () => { done = true; });
  assert.equal(fired, true, 'structured outro fired');
  const ov = document.querySelector('button[data-narr-continue="1"]');
  assert.ok(ov, 'an outro overlay mounted');
  // The aftermath text comes from outro.win, not the regex-scraped body.
  const body = document.querySelector('[data-narr-body="1"]');
  assert.match(body.textContent, /Cleanup money/i, 'outro renders authored aftermath');
  ov.click();
  assert.equal(done, true, 'outro onDone fires on dismiss');
});

// ── Preview/dispatch parity (the up-next desync fix) ─────────────────────────
test('BEAT_CANON_TRAINER maps the rocket boss to Giovanni', () => {
  assert.equal(nt.BEAT_CANON_TRAINER['villain.rocket.boss'], 'Giovanni');
});

test('up-next previews the canon boss the dispatcher will actually swap in', () => {
  const RAW = nt.STORY_EVENTS_RAW;
  let road7Battle = -1;
  for (let i = 0; i < RAW.length; i++) {
    if (nt.roadForArrayIdx(i) === 'road7' && RAW[i][1] === 'Battle') { road7Battle = i; break; }
  }
  assert.ok(road7Battle >= 0, 'found a road7 battle row');

  // Stand on road 7 with the rocket arc active and the main road-7 battle beat
  // already spent → the next active battle beat is the villain boss.
  nt.sm = {
    tracks: { villain: 'rocket', extra: null },
    storyEventsFired: { 'main.battle2': true },
    eventIndex: road7Battle,
    trainerAssignments: {},
  };
  const beat = nt.activeBattleBeatForCurrentRow();
  assert.equal(beat && beat.sceneKey, 'villain.rocket.boss',
    'rocket boss is the active battle beat');
  assert.equal(nt.canonTrainerForUpcomingBattle(), 'Giovanni',
    'canon resolver matches the dispatcher override');

  const up = nt.storyEventRowToUpNext(RAW[road7Battle]);
  assert.ok(up && /Giovanni/.test(up.text),
    `up-next should preview Giovanni, got: ${up && up.text}`);
});

test('canonTrainerForUpcomingBattle returns null when no boss beat is active', () => {
  nt.sm = { tracks: { villain: null, extra: null }, storyEventsFired: {}, eventIndex: 0 };
  assert.equal(nt.canonTrainerForUpcomingBattle(), null);
});
