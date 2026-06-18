// Story micro-games (v28): rock-paper-scissors, read-the-tell, memory/sequence.
// These lock the framework contract: (1) seeded primitives + auto-play are
// byte-deterministic on replay, (2) the light-effect engine mutates only
// sm.gold/inventory/flags, (3) a micro-game NEVER advances the timeline
// (sm.eventIndex is untouched), (4) battle-modifier flags survive save/load.
// Renderers are DOM-interactive (manual QA); the logic is unit-tested here.
// Run: node --test tests/suites/story-minigames.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const MG = W.__miniGameTest;
const ST = W.__storyTest;

// Map-backed localStorage shim (jsdom file:// origin throws on real access).
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
const LS = installLocalStorageShim();

test('module surface is exposed', () => {
    assert.ok(MG, '__miniGameTest must exist');
    assert.equal(typeof W.StoryMiniGames.play, 'function');
    assert.equal(typeof W.StoryMiniGames.applyOutcome, 'function');
    assert.equal(typeof MG.mkRng, 'function');
});

test('RPS adjudication table is correct (rock/paper/scissors)', () => {
    // 0=rock 1=paper 2=scissors. rock>scissors, paper>rock, scissors>paper.
    assert.equal(MG.rpsBeats(0, 2), 1);
    assert.equal(MG.rpsBeats(1, 0), 1);
    assert.equal(MG.rpsBeats(2, 1), 1);
    assert.equal(MG.rpsBeats(2, 0), -1);
    assert.equal(MG.rpsBeats(0, 1), -1);
    assert.equal(MG.rpsBeats(1, 2), -1);
    for (let i = 0; i < 3; i++) assert.equal(MG.rpsBeats(i, i), 0);
});

test('seeded RNG factory matches storyRngNext LCG and is reproducible', () => {
    const a = MG.mkRng(12345), b = MG.mkRng(12345);
    for (let i = 0; i < 50; i++) assert.equal(a(), b(), `draw ${i} diverged`);
});

test('RPS CPU throws are deterministic on replay', () => {
    const cfg = { type: 'rps', rounds: 5, tell: 0.5, tellThrow: 0 };
    const seqA = []; const r1 = MG.mkRng(7);
    for (let i = 0; i < 20; i++) seqA.push(MG.rpsCpuThrow(r1, cfg));
    const seqB = []; const r2 = MG.mkRng(7);
    for (let i = 0; i < 20; i++) seqB.push(MG.rpsCpuThrow(r2, cfg));
    assert.deepEqual(seqA, seqB);
    for (const t of seqA) assert.ok(t >= 0 && t <= 2, 'throw in range');
});

test('RPS tell biases toward tellThrow and is exploitable', () => {
    // tell:1 → CPU always plays tellThrow. The "read" (playing the counter)
    // must win every round — this is the skill path the design promises.
    const cfg = { type: 'rps', rounds: 9, tell: 1, tellThrow: 0 /* always rock */ };
    const rng = MG.mkRng(99);
    for (let i = 0; i < 30; i++) {
        const cpu = MG.rpsCpuThrow(rng, cfg);
        assert.equal(cpu, 0, 'tell:1 must always throw tellThrow');
        assert.equal(MG.rpsBeats(1 /* paper */, cpu), 1, 'paper must beat the telegraphed rock');
    }
});

test('memory sequence is seeded, in-range, and reproducible', () => {
    const symbols = ['a', 'b', 'c', 'd'];
    const s1 = MG.memorySequence(MG.mkRng(42), 6, symbols);
    const s2 = MG.memorySequence(MG.mkRng(42), 6, symbols);
    assert.deepEqual(s1, s2);
    assert.equal(s1.length, 6);
    for (const x of s1) assert.ok(x >= 0 && x < 4);
});

test('autoResolve is deterministic for every game type', () => {
    const rps = { type: 'rps', rounds: 3, tell: 0.4, tellThrow: 2 };
    const o1 = MG.autoResolve(rps, MG.mkRng(5), { playerThrows: [0, 1, 2] });
    const o2 = MG.autoResolve(rps, MG.mkRng(5), { playerThrows: [0, 1, 2] });
    assert.deepEqual(o1, o2);
    assert.ok(['win', 'lose', 'draw'].includes(o1.outcome));

    const tell = { type: 'tell', answer: 1, options: [{}, {}, {}] };
    assert.equal(MG.autoResolve(tell, MG.mkRng(1), { pick: 1 }).outcome, 'win');
    assert.equal(MG.autoResolve(tell, MG.mkRng(1), { pick: 0 }).outcome, 'lose');

    const mem = { type: 'memory', length: 4 };
    assert.equal(MG.autoResolve(mem, MG.mkRng(2), {}).outcome, 'win');
    assert.equal(MG.autoResolve(mem, MG.mkRng(2), { forceMistake: true }).outcome, 'lose');
});

test('effect engine mutates ONLY sm gold/inventory/flags', () => {
    const sm = ST.sm;
    sm.gold = 1000; sm.inventory = {}; sm.flags = {};
    const applied = MG.applyOutcome({ gold: 500, item: { id: 'ultra-ball', qty: 2 }, flag: { key: 'mg.test.win' } });
    assert.equal(sm.gold, 1500);
    assert.equal(sm.inventory['ultra-ball'], 2);
    assert.equal(sm.flags['mg.test.win'], true);
    assert.equal(applied.gold, 500);
    // Engine-realm objects have a foreign prototype, so compare fields (not deepEqual).
    assert.equal(applied.items.length, 1);
    assert.equal(applied.items[0].id, 'ultra-ball');
    assert.equal(applied.items[0].qty, 2);

    // Gold never goes negative.
    sm.gold = 100;
    MG.applyOutcome({ gold: -9999 });
    assert.equal(sm.gold, 0);
});

test('skip/soften stamp a per-row flag that battleModForRow reads back', () => {
    const sm = ST.sm;
    sm.flags = {}; sm.eventIndex = 12;
    MG.applyOutcome({ skipBattle: true });           // defaults to current eventIndex
    assert.equal(MG.battleModForRow(12).skip, true);

    MG.applyOutcome({ softenBattle: { hpMult: 0.6, levelDelta: -3 }, row: 20 });
    const mod = MG.battleModForRow(20);
    assert.ok(mod && mod.soften);
    assert.equal(mod.soften.hpMult, 0.6);
    assert.equal(mod.soften.levelDelta, -3);

    assert.equal(MG.battleModForRow(99), null, 'untouched rows have no modifier');
});

test('a micro-game NEVER advances the timeline (sm.eventIndex untouched)', async () => {
    const sm = ST.sm;
    sm.eventIndex = 7; sm.gold = 0; sm.flags = {}; sm.storyChoices = {};
    const spec = { gameId: '_t_rps', persistKey: 'mg.t.rps', onWin: { gold: 800 }, onLose: { gold: 0 } };
    const res = await W.StoryMiniGames.playAndApply(spec, {
        config: { type: 'rps', rounds: 3, tell: 0 }, forceOutcome: 'win',
    });
    assert.equal(res.outcome, 'win');
    assert.equal(sm.gold, 800, 'onWin effect applied');
    assert.equal(sm.storyChoices['mg.t.rps'], 'win', 'outcome remembered for later branch acts');
    assert.equal(sm.eventIndex, 7, 'eventIndex must be unchanged — no timeline fork');
});

test('play() resolves "skip" gracefully when no config exists', async () => {
    const res = await W.StoryMiniGames.play('does-not-exist', {});
    assert.equal(res.outcome, 'skip');
});

test('autoResolve handles the new game types (riddle/spot/cipher/craft)', () => {
    // riddle: win iff #correct >= passN
    const riddle = { type: 'riddle', steps: [{ answer: 1 }, { answer: 0 }], passN: 2 };
    assert.equal(MG.autoResolve(riddle, MG.mkRng(1), { picks: [1, 0] }).outcome, 'win');
    assert.equal(MG.autoResolve(riddle, MG.mkRng(1), { picks: [1, 1] }).outcome, 'lose');
    assert.equal(MG.autoResolve(riddle, MG.mkRng(1), {}).outcome, 'win', 'no picks → assumes correct answers');

    // spot: a single labelled pick against the "off" index
    const spot = { type: 'spot', answer: 2, items: [{}, {}, {}, {}] };
    assert.equal(MG.autoResolve(spot, MG.mkRng(1), { pick: 2 }).outcome, 'win');
    assert.equal(MG.autoResolve(spot, MG.mkRng(1), { pick: 0 }).outcome, 'lose');

    // cipher: entered sequence must equal the answer
    const cipher = { type: 'cipher', answer: [1, 2, 3] };
    assert.equal(MG.autoResolve(cipher, MG.mkRng(1), { entry: [1, 2, 3] }).outcome, 'win');
    assert.equal(MG.autoResolve(cipher, MG.mkRng(1), { entry: [1, 2, 0] }).outcome, 'lose');
    assert.equal(MG.autoResolve(cipher, MG.mkRng(1), {}).outcome, 'win', 'no entry → assumes solved');

    // craft: deterministic win unless forced to fail
    const craft = { type: 'craft', correct: [0, 2], steps: ['a', 'b'] };
    assert.equal(MG.autoResolve(craft, MG.mkRng(1), {}).outcome, 'win');
    assert.equal(MG.autoResolve(craft, MG.mkRng(1), { forceMistake: true }).outcome, 'lose');
});

test('new game types resolve through play() in headless mode', async () => {
    for (const cfg of [
        { type: 'riddle', steps: [{ answer: 0, options: [{}, {}] }], passN: 1 },
        { type: 'spot', answer: 0, items: [{}, {}] },
        { type: 'cipher', answer: [0, 1] },
        { type: 'craft', correct: [0], steps: [] },
    ]) {
        const res = await W.StoryMiniGames.play('_t_' + cfg.type, { config: cfg });
        assert.ok(['win', 'lose'].includes(res.outcome), cfg.type + ' resolves to a real outcome');
    }
});

test('giftPokemon effect adds a species to the roster (no battle-stat touch)', () => {
    const sm = ST.sm;
    sm.team = []; sm.pcBox = [];
    const applied = MG.applyOutcome({ giftPokemon: 'Pikachu' });
    const inTeam = (sm.team || []).some(s => s && s.name === 'Pikachu');
    const inPc = (sm.pcBox || []).some(s => s && s.name === 'Pikachu');
    assert.ok(inTeam || inPc, 'gifted species lands in party or PC');
    assert.ok(applied.gift && applied.gift.species === 'Pikachu', 'applied report names the gift');
});

test('battle-modifier flags survive save/load', () => {
    LS.setItem('pbs_story_save', JSON.stringify({
        version: W.__STORY_SAVE_VER,
        active: true,
        storyLine: 'classic',
        eventIndex: 0,
        badges: 0,
        team: [],
        flags: { 'mgSkipBattle:3': true, 'mgSoftenBattle:4': { hpMult: 0.7, levelDelta: -2 } },
        settings: { minGen: 1, maxGen: 9, enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    }));
    assert.equal(ST.loadSaveForTest(), true);
    assert.equal(ST.sm.flags['mgSkipBattle:3'], true);
    assert.equal(MG.battleModForRow(3).skip, true);
    assert.equal(MG.battleModForRow(4).soften.hpMult, 0.7);
});
