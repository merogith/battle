// City-hub guidance overhaul (v30) — locks the three changes shipped together:
//   A. City-Guide quotes are state-tagged pools (generic / preGym / postGym /
//      rivalAhead) picked by a seeded, per-situation-stable, non-stream-draining
//      picker (_pickCityGuideQuote) — plus the two post-HoF League pools (JSON
//      entries 10/11) that were dead data under the old flat indexing.
//   B. The NEXT objective line: camp-return names its destination via the shared
//      _storyNextBattleLabelForRow builder (extracted so label and click can't
//      drift), and the post-game hub gets a fallback objective instead of none.
//   C. The SUGGESTED rail describes team gaps (held item / ability / moves /
//      neutral nature / EVs / can-evolve / evolved-new-moves); vouchers are
//      "— free with …" suffixes on the matching gap chip, never standalone
//      inventory chips.
//   node --test tests/suites/city-guidance-v30.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QUOTES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dialogue', 'city-guide-quotes.json'), 'utf8'));

let W, ST, SER;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
});

const INTROS_ALL = { mart: 1, tutor: 1, nature: 1, evolab: 1, stoneShop: 1, link: 1, fanclub: 1, dept: 1, casino: 1, dojo: 1, evtrainer: 1, colress: 1, artifacts: 1, safari: 1, center: 1, relic: 1, bag: 1, party: 1, daycare: 1, pits: 1 };
const PROF_ALL = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true };

// A fully-polished mon — triggers NO gap chip (item + ability + 4 moves +
// chosen nature + EVs, final-stage species so the evolve chip stays quiet).
const polishedMon = (id) => ({
  name: 'Gyarados', id,
  build: { m: ['Waterfall', 'Earthquake', 'Ice Fang', 'Dragon Dance'], i: 'Leftovers', a: 'Intimidate', n: 'Adamant', evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 } },
});

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 3, gold: 4500, runSeed: 7,
    team: [polishedMon('m0')],
    settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: { ...INTROS_ALL }, facilitiesSeen: { ...INTROS_ALL },
    profUsed: { ...PROF_ALL }, npcStageSeen: { tutor: 9, evolab: 9, dojo: 9 }, gymCleared: {}, rivalEncounterLog: [],
    newMovesPending: {}, cityGuideQuote: null,
  }, extra);
  return ST.sm;
}

function render(eventIndex) {
  const grid = W.__renderCityActionsForTest(eventIndex);
  assert.ok(!String(grid).startsWith('ERR:'), `render failed: ${grid}`);
  const rail = (W.document.getElementById('story-city-tips') || {}).innerHTML || '';
  const quote = (W.document.getElementById('story-city-quote') || {}).textContent || '';
  const objMatch = rail.match(/class="story-city-objective"[^>]*onclick="([^"]*)"[\s\S]*?obj-kicker">([^<]*)<[\s\S]*?obj-label">([^<]*)</);
  return { grid, rail, quote, obj: objMatch ? { click: objMatch[1], kicker: objMatch[2], label: objMatch[3] } : null };
}

const cityRowIdx = (pred) => SER.findIndex(r => Array.isArray(r) && r[1] === 'City' && pred(r));
const battleRowIdx = (pred) => SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && pred(r));
const poolLines = (entry) => ['generic', 'preGym', 'postGym', 'rivalAhead']
  .flatMap(k => Array.isArray(entry && entry[k]) ? entry[k] : []);

// ── A. Guide quote pools & picker ────────────────────────────────────────────

test('quotes JSON: every city entry ships a non-empty generic pool; gym cities carry preGym+postGym', () => {
  assert.ok(Array.isArray(QUOTES) && QUOTES.length >= 12, 'still ≥12 entries (smoke contract)');
  QUOTES.forEach((e, i) => {
    assert.ok(Array.isArray(e.generic) && e.generic.length >= 3, `entry ${i} has ≥3 generic lines`);
  });
  for (let c = 1; c <= 8; c++) {
    assert.ok(Array.isArray(QUOTES[c].preGym) && QUOTES[c].preGym.length >= 2, `gym city ${c} has preGym lines`);
    assert.ok(Array.isArray(QUOTES[c].postGym) && QUOTES[c].postGym.length >= 2, `gym city ${c} has postGym lines`);
  }
});

test('picker: pick is stable per situation and drawn from the city\'s pools', () => {
  setSm({});
  const a = ST.pickCityGuideQuote(2, { preGym: true });
  const b = ST.pickCityGuideQuote(2, { preGym: true });
  assert.equal(a, b, 'same state → same line (no per-render re-roll)');
  assert.ok(poolLines(QUOTES[2]).includes(a), 'line comes from the city-2 pools');
});

test('picker: seeded, not Math.random — identical run state reproduces the pick', () => {
  setSm({ runSeed: 1234, eventIndex: 9 });
  const a = ST.pickCityGuideQuote(2, { preGym: true });
  setSm({ runSeed: 1234, eventIndex: 9 }); // fresh sm, same seed/state
  const b = ST.pickCityGuideQuote(2, { preGym: true });
  assert.equal(a, b, 'same runSeed+row+badges → same line');
});

test('picker: state tags actually bias the pool (preGym lines show up across seeds)', () => {
  let tagged = 0;
  for (let seed = 1; seed <= 30; seed++) {
    setSm({ runSeed: seed });
    const line = ST.pickCityGuideQuote(1, { preGym: true });
    if (QUOTES[1].preGym.includes(line)) tagged++;
  }
  assert.ok(tagged >= 10, `preGym pool picked ${tagged}/30 times — the 2/3 bias collapsed`);
});

test('picker: badge change re-rolls and avoids echoing the previous line', () => {
  setSm({ badges: 0 });
  const first = ST.pickCityGuideQuote(1, { preGym: true });
  ST.sm.badges = 1; // situation moved on → new stateKey
  const second = ST.pickCityGuideQuote(1, { postGym: true });
  assert.notEqual(second, first, 'consecutive situations never echo the same line');
});

test('picker: post-HoF League pools (entries 10/11) are reachable at city 9', () => {
  setSm({ hofPartySnapshot: { team: [] }, postHofMysteryClimaxDone: false });
  const pending = ST.pickCityGuideQuote(9, {});
  assert.ok(QUOTES[10].generic.includes(pending), 'climax-pending pool (entry 10) serves city 9');
  setSm({ postHofMysteryClimaxDone: true });
  const done = ST.pickCityGuideQuote(9, {});
  assert.ok(QUOTES[11].generic.includes(done), 'crucible-open pool (entry 11) serves city 9');
});

test('rendered hub: quote box shows blurb + a pool line for the city\'s current state', () => {
  const g = cityRowIdx(r => String(r[2]) === 'City1' && r[5].includes('Gym Battle'));
  assert.ok(g >= 0, 'City1 gym row exists');
  setSm({ eventIndex: g });
  const { quote } = render(g);
  assert.match(quote, /^📍 /, 'city blurb leads the box');
  const line = quote.split('\n\n').pop();
  assert.ok(QUOTES[1].generic.concat(QUOTES[1].preGym).includes(line),
    `guide line is from city 1's generic∪preGym pools (got: ${line})`);
});

// ── B. NEXT objective ────────────────────────────────────────────────────────

test('camp-return objective names the destination fight via the shared label builder', () => {
  const g = cityRowIdx(r => String(r[2]) === 'City1' && r[5].includes('Gym Battle'));
  const dest = battleRowIdx(r => String(r[2]) === 'Basic Trainer');
  assert.ok(g >= 0 && dest >= 0, 'fixture rows exist');
  setSm({ eventIndex: g, campReturnPoint: { eventIndex: dest } });
  const { obj } = render(g);
  assert.ok(obj, 'objective rendered');
  assert.match(obj.label, /camp, then /, 'label walks through camp to the destination');
  const destLabel = ST.nextBattleLabelForRow(dest);
  assert.ok(destLabel && obj.label.endsWith(destLabel), `label ends with the builder's destination (${destLabel})`);
  assert.match(obj.click, /proceedToNextBattle/, 'click still restores the camp round-trip');
});

test('shared label builder: gym rows label as gyms, non-battle rows label empty', () => {
  setSm({});
  const gymRow = battleRowIdx(r => /^Gym Leader 1$/.test(String(r[2])));
  assert.ok(gymRow >= 0, 'Gym Leader 1 row exists');
  assert.match(ST.nextBattleLabelForRow(gymRow), /^Gym 1/, 'gym label');
  const cityRow = cityRowIdx(() => true);
  assert.equal(ST.nextBattleLabelForRow(cityRow), '', 'City row → empty (caller falls back)');
});

test('rival label never leaks the rolled identity', () => {
  setSm({});
  const rivalRow = battleRowIdx(r => String(r[2]) === 'Rival');
  const label = ST.nextBattleLabelForRow(rivalRow);
  assert.ok(label, 'rival row labels');
  for (const nm of ['Blue', 'Silver', 'Barry', 'Hugh', 'Hop', 'Bede', 'Nemona']) {
    assert.ok(!label.includes(nm), `label must not name ${nm}`);
  }
});

test('post-game hub: objective falls back to the Crucible / Mystery climax instead of vanishing', () => {
  // Past the last Battle row there is nothing to scan — the old chain rendered
  // NO objective at all. eventIndex beyond the timeline models the post-HoF hub.
  setSm({ eventIndex: SER.length, postHofMysteryClimaxDone: true });
  let out = render(SER.length);
  assert.ok(out.obj, 'post-game objective rendered');
  assert.match(out.obj.label, /Crucible/, 'crucible objective');
  assert.match(out.obj.click, /enterCrucible/, 'clicks into the Crucible');

  setSm({ eventIndex: SER.length, postHofMysteryClimaxDone: false, hofPartySnapshot: { team: [] } });
  out = render(SER.length);
  assert.ok(out.obj, 'climax-pending objective rendered');
  assert.match(out.obj.label, /Mystery Figure/, 'mystery-climax objective');
  assert.match(out.obj.click, /enterMysteryClimax/, 'clicks into the climax re-challenge');
});

// ── C. SUGGESTED rail ────────────────────────────────────────────────────────

const NATURE_CITY = () => cityRowIdx(r => String(r[2]) === 'City1' && r[5].includes('Nature Rater'));
const EVO_CITY = () => cityRowIdx(r => Array.isArray(r[5]) && r[5].includes('Evolution Tutor'));

test('neutral nature → gap chip; a held Mint becomes a suffix, never a standalone chip', () => {
  const c = NATURE_CITY();
  assert.ok(c >= 0, 'Nature Rater city exists');
  const mon = polishedMon('m0'); mon.build.n = 'Hardy';
  setSm({ eventIndex: c, team: [mon] });
  let { rail } = render(c);
  assert.match(rail, /1 Pokémon is still on a neutral nature/, 'nature gap chip present');
  assert.ok(!/free with your Mint/.test(rail), 'no Mint suffix without a Mint');

  setSm({ eventIndex: c, team: [mon], inventory: { mint: 2 } });
  ({ rail } = render(c));
  assert.match(rail, /still on a neutral nature — free with your Mint/, 'Mint rides the gap chip');
  assert.ok(!/Mints? — free nature change/.test(rail), 'old standalone Mint chip is gone');
});

test('voucher inventory with a polished team renders ZERO voucher chips', () => {
  const c = EVO_CITY();
  assert.ok(c >= 0, 'Evolution Tutor city exists');
  setSm({ eventIndex: c, team: [polishedMon('m0')], inventory: { mint: 3, rareCandy: 2, heartScale: 1, vitamin: 2, abilityCapsule: 1, emblemHonor: 1 } });
  const { rail } = render(c);
  for (const tell of ['free nature change', 'free evolution', 'free move swap', 'free dojo swap', 'free EV preset', 'EV Voucher', 'Rare Cand', 'Heart Scale', 'free with']) {
    assert.ok(!rail.includes(tell), `no voucher chip/suffix without a matching gap ("${tell}")`);
  }
});

test('missing held item + no ability → dojo chips with Emblem/Capsule suffixes', () => {
  const c = NATURE_CITY();
  const mon = polishedMon('m0'); mon.build.i = null; mon.build.a = 'None';
  setSm({ eventIndex: c, team: [mon], inventory: { emblemHonor: 1, abilityCapsule: 1 } });
  const { rail } = render(c);
  assert.match(rail, /1 Pokémon needs a held item — free with your Emblem of Honor/);
  assert.match(rail, /1 Pokémon has no ability set — free with your Ability Capsule/);
});

test('empty move slot → tutor chip with Heart Scale suffix', () => {
  const c = NATURE_CITY();
  const mon = polishedMon('m0'); mon.build.m = ['Waterfall'];
  setSm({ eventIndex: c, team: [mon], inventory: { heartScale: 2 } });
  const { rail } = render(c);
  assert.match(rail, /1 Pokémon has an empty move slot — free with a Heart Scale/);
});

test('evolvable teammate → need-gated evolve chip (Rare Candy as suffix only)', () => {
  const c = EVO_CITY();
  const mon = polishedMon('m0'); mon.name = 'Charmander';
  setSm({ eventIndex: c, team: [mon], inventory: { rareCandy: 1 } });
  const { rail } = render(c);
  assert.match(rail, /1 Pokémon can evolve — free with a Rare Candy/, 'evolve chip with suffix');
});

test('evolved-since-tutor breadcrumb renders and clears on the move screen', () => {
  const c = NATURE_CITY();
  setSm({ eventIndex: c, team: [polishedMon('m0')], newMovesPending: { m0: 1 } });
  let { rail } = render(c);
  assert.match(rail, /1 Pokémon evolved — new moves to learn/, 'breadcrumb chip present');
  // Opening the Move Tutor's move screen clears the flag for the party…
  W.StoryMode.enterTutor('moves');
  assert.ok(!ST.sm.newMovesPending.m0, 'flag cleared by the tutor visit');
  // …so the next hub render drops the chip.
  ({ rail } = render(c));
  assert.ok(!/new moves to learn/.test(rail), 'chip gone after the visit');
});
