// PR-3b: IntroQueue sequencing + mart stacking-popup regression.
// Validates that multiple facility intros queue up and play one-at-a-time
// instead of stacking, and that the historical "5 Poké Balls + 1 Poké Ball"
// dual-firing on first mart entry is gone — the tutorial now owns the
// welcome gift (5 balls, one message).
// Run: node --test tests/suites/story-intro-queue-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const Q = ST.IntroQueue;

function nextTick(ms = 5) { return new Promise(r => setTimeout(r, ms)); }

test('IntroQueue.enqueue + flush runs items sequentially', async () => {
    Q._reset();
    const order = [];
    let resolveA, resolveB;
    const promiseA = new Promise(r => { resolveA = r; });
    const promiseB = new Promise(r => { resolveB = r; });

    Q.enqueue({
        priority: 50,
        run: (done) => { order.push('A-start'); promiseA.then(() => { order.push('A-done'); done(); }); }
    });
    Q.enqueue({
        priority: 50,
        run: (done) => { order.push('B-start'); promiseB.then(() => { order.push('B-done'); done(); }); }
    });

    // After a tick, A should be running but not yet done; B should not have started.
    await nextTick();
    assert.deepEqual(order.slice(), ['A-start']);

    // Resolve A; B should now start.
    resolveA();
    await nextTick();
    assert.deepEqual(order.slice(), ['A-start', 'A-done', 'B-start']);

    // Resolve B; queue should drain.
    resolveB();
    await nextTick();
    assert.deepEqual(order.slice(), ['A-start', 'A-done', 'B-start', 'B-done']);
});

test('IntroQueue sorts by priority descending on flush', async () => {
    Q._reset();
    const order = [];
    Q.enqueue({ priority: 10, run: (done) => { order.push('low');    done(); } });
    Q.enqueue({ priority: 50, run: (done) => { order.push('medium'); done(); } });
    Q.enqueue({ priority: 100, run: (done) => { order.push('high');  done(); } });
    await nextTick();
    assert.deepEqual(order, ['high', 'medium', 'low']);
});

test('IntroQueue preserves enqueue order within the same priority', async () => {
    Q._reset();
    const order = [];
    Q.enqueue({ priority: 50, run: (done) => { order.push('first');  done(); } });
    Q.enqueue({ priority: 50, run: (done) => { order.push('second'); done(); } });
    Q.enqueue({ priority: 50, run: (done) => { order.push('third');  done(); } });
    await nextTick();
    assert.deepEqual(order, ['first', 'second', 'third']);
});

test('IntroQueue.run() that throws still advances to next item', async () => {
    Q._reset();
    const order = [];
    Q.enqueue({ priority: 50, run: (done) => { order.push('a'); throw new Error('boom'); } });
    Q.enqueue({ priority: 50, run: (done) => { order.push('b'); done(); } });
    await nextTick();
    assert.deepEqual(order, ['a', 'b']);
});

test('IntroQueue.run() that calls done() twice does not double-advance', async () => {
    Q._reset();
    const order = [];
    Q.enqueue({ priority: 50, run: (done) => { order.push('a'); done(); done(); } });
    Q.enqueue({ priority: 50, run: (done) => { order.push('b'); done(); } });
    await nextTick();
    assert.deepEqual(order, ['a', 'b']);
});

test('INTRO_PRIORITY has the expected ranks', () => {
    const p = ST.INTRO_PRIORITY;
    assert.equal(p.facility_first_time, 100);
    assert.equal(p.market_giveaway,     60);
    assert.equal(p.npc_tip,             30);
    assert.equal(p.one_time_lesson,     10);
    // Priority ordering invariant: facility intros outrank greeters / tips.
    assert.ok(p.facility_first_time > p.market_giveaway);
    assert.ok(p.facility_first_time > p.npc_tip);
});

test('IntroQueue is exposed as a singleton (same reference each access)', () => {
    const a = ST.IntroQueue;
    const b = ST.IntroQueue;
    assert.equal(a, b);
});

const MART_TUTORIAL = 'tutorial-first-mart';
function tutorialFixture(t) {
    const previousRun = ST.sm;
    const previousAlert = W.showGameAlert;
    const previousStorage = Object.getOwnPropertyDescriptor(W, 'localStorage');
    const storage = new Map();
    const writes = [];
    let failNextSave = false;
    ST.sm = {
        ...previousRun,
        active: true,
        runSeed: 1001,
        eventIndex: 0,
        balls: { poke: 0, great: 0, ultra: 0, master: 0 },
        inventory: {},
        scenesShown: {},
        fanClubGiftClaimed: false,
        daycare: {},
        team: [],
        pcBox: [],
    };
    W.showGameAlert = () => {};
    Object.defineProperty(W, 'localStorage', {
        configurable: true,
        value: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => {
                if (key === 'pbs_story_save' && failNextSave) {
                    failNextSave = false;
                    throw new Error('Save unavailable');
                }
                storage.set(key, String(value));
                if (key === 'pbs_story_save') writes.push(JSON.parse(value));
            },
        },
    });
    t.after(() => {
        W.document.getElementById('story-daycare-scene')?.remove();
        ST.sm = previousRun;
        W.showGameAlert = previousAlert;
        Object.defineProperty(W, 'localStorage', previousStorage);
    });
    return { storage, writes, play: W.StoryMode.playTutorial, rejectNextSave: () => { failNextSave = true; } };
}

test('the Mart remains eligible until Continue and saves its five-ball gift once', t => {
    const { writes, play } = tutorialFixture(t);
    const completed = [];
    assert.equal(play('firstMart', () => completed.push('first')), true);
    assert.equal(play('firstMart', () => completed.push('repeat')), true);
    assert.equal(W.document.querySelectorAll('.story-tutorial-overlay').length, 1);
    assert.equal(ST.sm.scenesShown[MART_TUTORIAL], undefined);
    assert.equal(ST.sm.balls.poke, 0);
    assert.deepEqual(completed, []);
    assert.equal(writes.length, 0, 'an interrupted visit cannot be persisted as complete');

    const dismiss = W.document.querySelector('.story-tutorial-continue');
    dismiss.click();
    dismiss.click();
    assert.equal(play('firstMart'), false);
    assert.deepEqual(completed, ['first', 'repeat']);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].scenesShown[MART_TUTORIAL], true);
    assert.equal(writes[0].balls.poke, 5);
});

test('NG+ skips a previously read tutorial and persists its gift for the new run', t => {
    const { storage, writes, play } = tutorialFixture(t);
    storage.set('pbs_story_meta', JSON.stringify({ tutorialsSeen: { [MART_TUTORIAL]: true } }));
    assert.equal(play('firstMart'), false);
    assert.equal(W.document.querySelector('.story-tutorial-overlay'), null);
    assert.equal(play('firstMart'), false);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].scenesShown[MART_TUTORIAL], true);
    assert.equal(writes[0].balls.poke, 5);
});

test('a legacy completion remains completed even when its consumables were spent', t => {
    const { writes, play } = tutorialFixture(t);
    ST.sm.scenesShown[MART_TUTORIAL] = true;
    assert.equal(play('firstMart'), false);
    assert.equal(ST.sm.balls.poke, 0);
    assert.equal(writes.length, 0);
});

test('Center, Fan Club, Daycare, and Hidden Power persist their reward with completion', t => {
    const { writes, play } = tutorialFixture(t);
    const cases = [
        ['firstPokemonCenter', 'tutorial-first-pokemon-center', run => run.inventory.fullRestore === 1],
        ['firstFanClub', 'tutorial-first-fan-club', run => run.fanClubGiftClaimed && run.inventory.hpUp === 5],
        ['firstDaycare', 'tutorial-first-daycare', run =>
            run.daycare.freeEggClaimed && [...run.team, ...run.pcBox].filter(slot => slot.isEgg).length === 1],
        ['hiddenPowerMentor', 'tutorial-hidden-power-mentor', run => run.hiddenPowerUnlocked && run.hiddenPowerChoosePending],
    ];
    for (const [id, key, claimed] of cases) {
        const before = writes.length;
        assert.equal(play(id), true);
        W.document.querySelector('.story-tutorial-continue').click();
        assert.equal(writes.length, before + 1, `${id} has one complete save`);
        assert.equal(writes.at(-1).scenesShown[key], true);
        assert.ok(claimed(writes.at(-1)), `${id} gift is in that save`);
    }
});

test('Daycare can retry the same Egg after an interrupted welcome save', t => {
    const { writes, play, rejectNextSave } = tutorialFixture(t);
    const key = 'tutorial-first-daycare';
    const rng = ST.sm._strngState;
    rejectNextSave();
    assert.equal(play('firstDaycare'), true);
    W.document.querySelector('.story-tutorial-continue').click();
    assert.equal(writes.length, 0);
    assert.equal(ST.sm.scenesShown[key], undefined);
    assert.equal(ST.sm.daycare.freeEggClaimed, undefined);
    assert.equal(ST.sm.team.length + ST.sm.pcBox.length, 0);
    assert.equal(ST.sm._strngState, rng);
    assert.equal(W.document.getElementById('story-daycare-scene'), null);

    assert.equal(play('firstDaycare'), true);
    W.document.querySelector('.story-tutorial-continue').click();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].scenesShown[key], true);
    assert.equal([...writes[0].team, ...writes[0].pcBox].filter(slot => slot.isEgg).length, 1);
});

test('regression: enterShop no longer contains inline 5-ball toast block', async () => {
    // Source-level check: the old inline `sm.balls.poke = ... + 5` + toast was
    // removed; the welcome gift now lives in the firstMart tutorial scene.
    // We assert no enterShop-local code reads sm.flags._martBallGift any more.
    const battleHtmlText = await (await import('node:fs/promises')).readFile(
        new URL('../../battle.html', import.meta.url), 'utf8'
    );
    // The flag's stale presence anywhere is OK (a save-side migration may still
    // reference it for historical compatibility), but the inline shop-side
    // grant code must be gone.
    const enterShopStart = battleHtmlText.indexOf('function enterShop(type) {');
    assert.ok(enterShopStart > 0, 'enterShop function should still exist');
    const enterShopEnd = battleHtmlText.indexOf('function ', enterShopStart + 30);
    const enterShopBody = battleHtmlText.slice(enterShopStart, enterShopEnd);
    assert.equal(
        enterShopBody.includes("sm.balls.poke = (sm.balls.poke | 0) + 5"),
        false,
        'inline 5-ball grant should be deleted from enterShop'
    );
    assert.equal(
        enterShopBody.includes("'🛒 The clerk slides you 5 Poké Balls'"),
        false,
        'inline 5-ball toast should be deleted from enterShop'
    );
    // The IntroQueue.enqueue should be present in enterShop now.
    assert.ok(
        enterShopBody.includes('IntroQueue.enqueue'),
        'enterShop should route through IntroQueue'
    );
});

test('regression: firstMart tutorial scene grants 5 balls in onContinue (source check)', async () => {
    const battleHtmlText = await (await import('node:fs/promises')).readFile(
        new URL('../../battle.html', import.meta.url), 'utf8'
    );
    const idx = battleHtmlText.indexOf("firstMart: {");
    assert.ok(idx > 0, 'firstMart scene block should exist');
    const block = battleHtmlText.slice(idx, battleHtmlText.indexOf('firstDept: {', idx));
    assert.ok(
        block.includes("_storyGrantBundle({ pokeBall: 5 })"),
        'firstMart onContinue should grant 5 Poké Balls'
    );
    assert.match(block, /five Poké Balls/);
    assert.doesNotMatch(block, /showGameAlert/, 'the welcome itself explains the gift');
    assert.equal(
        block.includes("pokeBall: 1"),
        false,
        'firstMart should no longer grant only 1 ball'
    );
});
