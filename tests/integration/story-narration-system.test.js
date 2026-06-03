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

test('legacy-flat scenes (no acts) still carry a renderable body', () => {
  // Self-adjusting: pick whatever scene is still unconverted, so this stays
  // green as the rollout converts more arcs.
  const S = nt.STORY_SCENES;
  const flatKey = Object.keys(S).find(k => S[k] && !S[k].acts);
  assert.ok(flatKey, 'a legacy-flat scene exists during rollout');
  const flat = S[flatKey];
  assert.ok(typeof flat.body === 'string' && flat.body.length, 'legacy scene has a body');
  assert.equal(flat.acts, undefined, 'legacy scene has no acts');
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

// ── Converted villain arcs (rollout) ────────────────────────────────────────
const CONVERTED_VILLAIN = ['rocket', 'magma', 'aqua', 'galactic', 'plasma', 'flare',
                          'skull', 'yell', 'macroCosmos', 'star'];
// All ten villain arcs are now fully structured: every event1..6 + ending + the
// three battles (battle1/battle2/miniBoss) + boss carry an `acts` arc.
const FULLY_CONVERTED = CONVERTED_VILLAIN;

test('fully converted arcs have event1-6 arcs', () => {
  const S = nt.STORY_SCENES;
  for (const track of FULLY_CONVERTED) {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const sc = S[`villain.${track}.event${n}`];
      assert.ok(sc && Array.isArray(sc.acts) && sc.acts.length,
        `villain.${track}.event${n} has acts`);
    }
  }
});

test('every converted arc has an ending arc + a boss with outro.win', () => {
  const S = nt.STORY_SCENES;
  for (const track of CONVERTED_VILLAIN) {
    const ending = S[`villain.${track}.ending`];
    assert.ok(ending && Array.isArray(ending.acts) && ending.acts.length,
      `villain.${track}.ending has acts`);
    const boss = S[`villain.${track}.boss`];
    assert.ok(boss && boss.outro && Array.isArray(boss.outro.win) && boss.outro.win.length,
      `villain.${track}.boss has outro.win`);
  }
});

test('every villain mid-battle (battle1/battle2/miniBoss) is structured', () => {
  const S = nt.STORY_SCENES;
  for (const track of CONVERTED_VILLAIN) {
    for (const beat of ['battle1', 'battle2', 'miniBoss']) {
      const sc = S[`villain.${track}.${beat}`];
      assert.ok(sc && Array.isArray(sc.acts) && sc.acts.length,
        `villain.${track}.${beat} has acts`);
      // Pre-fight acts must not leak roster meta or in-battle mechanic text.
      const text = sc.acts.flatMap(a => a.lines || []).join(' ');
      assert.ok(!/\bLead -|Phase (change|mechanic)|Field (locked|mechanic)|\bHP -|\+1 priority/i.test(text),
        `villain.${track}.${beat} acts are clean of roster/mechanic meta`);
    }
  }
});

test('each converted arc has exactly one persisted choice with a unique key', () => {
  const S = nt.STORY_SCENES;
  const seenKeys = new Set();
  for (const track of CONVERTED_VILLAIN) {
    let choiceCount = 0;
    let persistKey = null;
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (const act of (S[`villain.${track}.event${n}`].acts || [])) {
        if (act.choice) { choiceCount++; persistKey = act.choice.persistKey; }
      }
    }
    assert.equal(choiceCount, 1, `villain.${track} has exactly one choice`);
    assert.ok(persistKey && persistKey.startsWith(`villain.${track}.`),
      `villain.${track} choice key is namespaced`);
    assert.ok(!seenKeys.has(persistKey), `persistKey ${persistKey} is unique`);
    seenKeys.add(persistKey);
  }
});

test('arc choices drive a later branch payoff (magma / aqua / galactic)', () => {
  const S = nt.STORY_SCENES;
  // magma.water → event4 development branch reacts to "took".
  const magmaDev = S['villain.magma.event4'].acts.find(a => a.branches);
  nt.sm = { storyChoices: { 'villain.magma.water': 'took' } };
  assert.match(nt.resolveActLines(magmaDev).join(' '), /can't take this too/i);
  nt.sm = { storyChoices: {} };
  const magmaDefault = nt.resolveActLines(magmaDev).join(' ');
  assert.ok(magmaDefault.length && !/can't take this too/i.test(magmaDefault));

  // aqua.chart → event4 intro branch reacts to "warned".
  const aquaIntro = S['villain.aqua.event4'].acts.find(a => a.branches);
  nt.sm = { storyChoices: { 'villain.aqua.chart': 'warned' } };
  assert.match(nt.resolveActLines(aquaIntro).join(' '), /the one you warned/i);

  // galactic.keeper → ending branch distinguishes stayed vs told.
  const galDev = S['villain.galactic.ending'].acts.find(a => a.branches);
  nt.sm = { storyChoices: { 'villain.galactic.keeper': 'stayed' } };
  const stayed = nt.resolveActLines(galDev).join(' ');
  nt.sm = { storyChoices: { 'villain.galactic.keeper': 'told' } };
  const told = nt.resolveActLines(galDev).join(' ');
  assert.ok(stayed.length && told.length && stayed !== told,
    'galactic ending branches differ by keeper choice');
});

test('converted arc endings branch on their arc choice', () => {
  const S = nt.STORY_SCENES;
  const cases = [
    { key: 'villain.plasma.ending',      choice: 'villain.plasma.n',           a: 'uncaged',    b: 'ball' },
    { key: 'villain.flare.ending',       choice: 'villain.flare.sticker',      a: 'kept',       b: 'peeled' },
    { key: 'villain.skull.ending',       choice: 'villain.skull.kids',         a: 'gave',       b: 'straight' },
    { key: 'villain.yell.ending',        choice: 'villain.yell.proof',         a: 'leaked',     b: 'marnie' },
    { key: 'villain.macroCosmos.ending', choice: 'villain.macroCosmos.drone',  a: 'smashed',    b: 'ignored' },
    { key: 'villain.star.ending',        choice: 'villain.star.bullies',       a: 'confronted', b: 'walked' },
  ];
  for (const c of cases) {
    const branchAct = S[c.key].acts.find(a => a.branches);
    assert.ok(branchAct, `${c.key} has a branching act`);
    nt.sm = { storyChoices: { [c.choice]: c.a } };
    const a = nt.resolveActLines(branchAct).join(' ');
    nt.sm = { storyChoices: { [c.choice]: c.b } };
    const b = nt.resolveActLines(branchAct).join(' ');
    nt.sm = { storyChoices: {} };
    const def = nt.resolveActLines(branchAct).join(' ');
    assert.ok(a.length && b.length && a !== b, `${c.key}: branches differ`);
    assert.ok(def.length, `${c.key}: has a default branch`);
  }
});

// ── Main spine (the loop / Mystery Figure) ──────────────────────────────────
const MAIN_SCENES = ['event1', 'event2', 'event3', 'battle1', 'event4', 'battle2',
                     'event5', 'event6', 'event7', 'event8', 'event9', 'mfBattle',
                     'mfReveal', 'ending'];

test('every main-spine scene is structured', () => {
  const S = nt.STORY_SCENES;
  for (const k of MAIN_SCENES) {
    const sc = S[`main.${k}`];
    assert.ok(sc && Array.isArray(sc.acts) && sc.acts.length, `main.${k} has acts`);
  }
});

test('main-spine battles carry a win outro; the reveal is a full multi-act build', () => {
  const S = nt.STORY_SCENES;
  for (const k of ['battle1', 'battle2', 'mfBattle']) {
    const o = S[`main.${k}`].outro;
    assert.ok(o && Array.isArray(o.win) && o.win.length, `main.${k} has outro.win`);
  }
  assert.ok(S['main.mfReveal'].acts.length >= 4, 'mfReveal builds across >=4 acts');
});

test('the ending offers the loop choice (remember vs forget)', () => {
  const ending = nt.STORY_SCENES['main.ending'];
  const choiceAct = ending.acts.find(a => a.choice);
  assert.ok(choiceAct, 'ending has a choice act');
  assert.equal(choiceAct.choice.persistKey, 'main.loop.remember');
  const vals = choiceAct.choice.options.map(o => o.value).sort();
  assert.deepEqual(vals, ['forget', 'remember']);
  for (const o of choiceAct.choice.options) {
    assert.ok(Array.isArray(o.reply) && o.reply.length, `ending option ${o.value} has a reply`);
  }
});

// ── Extra (horror) arcs ─────────────────────────────────────────────────────
const CONVERTED_EXTRA = ['cubone', 'mewtwo', 'yamask', 'hypno', 'phantump',
                         'mimikyu', 'drifloon', 'parasect'];

test('converted extra arcs have structured events + a raid with outro.win', () => {
  const S = nt.STORY_SCENES;
  for (const track of CONVERTED_EXTRA) {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const sc = S[`extra.${track}.event${n}`];
      assert.ok(sc && Array.isArray(sc.acts) && sc.acts.length, `extra.${track}.event${n} has acts`);
    }
    const ending = S[`extra.${track}.ending`];
    assert.ok(ending && Array.isArray(ending.acts) && ending.acts.length, `extra.${track}.ending has acts`);
    const raid = S[`extra.${track}.raid`];
    assert.ok(raid && raid.outro && Array.isArray(raid.outro.win) && raid.outro.win.length,
      `extra.${track}.raid has outro.win`);
  }
});

test('extra-arc choices are unique and pay off in the ending', () => {
  const S = nt.STORY_SCENES;
  const cases = [
    { key: 'extra.cubone.burial',   a: 'accepted', b: 'declined' },
    { key: 'extra.mewtwo.drawing',  a: 'took',     b: 'left' },
    { key: 'extra.yamask.mirror',     a: 'looked',     b: 'away' },
    { key: 'extra.hypno.pendulum',    a: 'kept',       b: 'left' },
    { key: 'extra.phantump.song',     a: 'stopped',    b: 'sang' },
    { key: 'extra.mimikyu.seen',      a: 'seen',       b: 'away' },
    { key: 'extra.drifloon.crossing', a: 'intervened', b: 'trusted' },
    { key: 'extra.parasect.trainer',  a: 'stayed',     b: 'left' },
  ];
  for (const c of cases) {
    const track = c.key.split('.')[1];
    let choiceCount = 0;
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (const act of (S[`extra.${track}.event${n}`].acts || [])) if (act.choice) choiceCount++;
    }
    assert.equal(choiceCount, 1, `extra.${track} has exactly one choice`);
    const branchAct = S[`extra.${track}.ending`].acts.find(a => a.branches);
    assert.ok(branchAct, `extra.${track}.ending branches`);
    nt.sm = { storyChoices: { [c.key]: c.a } };
    const a = nt.resolveActLines(branchAct).join(' ');
    nt.sm = { storyChoices: { [c.key]: c.b } };
    const b = nt.resolveActLines(branchAct).join(' ');
    nt.sm = { storyChoices: {} };
    const def = nt.resolveActLines(branchAct).join(' ');
    assert.ok(a.length && b.length && a !== b && def.length, `extra.${track}: branches differ + default`);
  }
});
