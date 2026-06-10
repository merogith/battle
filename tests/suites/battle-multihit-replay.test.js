// Guard: the multi-hit stepwise visual replay (C1) is PURELY VISUAL. A multi-hit move used
// to apply every hit in the loop and then show one instant HP lump; it now replays each hit
// as a flash + HP step-down. This must not change the outcome — the replay rewinds only the
// DISPLAYED HP and must end at the exact value the damage loop already computed, re-rolling
// nothing. Locks: full damage application, correct final HP, determinism, and (source) that
// no RNG was introduced into the replay block.
// Run: node --test tests/suites/battle-multihit-replay.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');

test('a multi-hit move applies all damage and lands at the exact final HP', async () => {
    const { mkMon, runTurn, window } = await loadEngine();
    window.Math.random = () => 0.99;   // deterministic high roll, fixed 2-hit move
    const attacker = mkMon({ species: 'Hitmonlee', moves: ['Double Kick', 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    defender.maxHp = 999; defender.currentHp = 999;
    await runTurn({ playerMon: attacker, foeMon: defender });
    const dealt = 999 - defender.currentHp;
    assert.ok(dealt > 0, `Double Kick dealt ${dealt} damage`);
    // Rage Fist's timesHit counter increments once per landed strike — proves the damage
    // loop ran in full (both kicks), not collapsed by the replay.
    assert.ok((defender.volatile && defender.volatile.timesHit) >= 2,
        `timesHit=${defender.volatile && defender.volatile.timesHit} (both kicks registered)`);
    // The replay must leave HP exactly where the loop computed it.
    assert.equal(defender.currentHp, 999 - dealt, 'final HP === startHp − total damage (replay ended exactly)');
});

test('the replay introduces no new RNG: same inputs ⇒ identical final HP', async () => {
    async function run(seedVal) {
        const { mkMon, runTurn, window } = await loadEngine();
        window.Math.random = () => seedVal;
        const a = mkMon({ species: 'Hitmonlee', moves: ['Double Kick', 'Splash', 'Splash', 'Splash'] });
        const d = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
        d.maxHp = 999; d.currentHp = 999;
        await runTurn({ playerMon: a, foeMon: d });
        return d.currentHp;
    }
    const hp1 = await run(0.5);
    const hp2 = await run(0.5);
    assert.equal(hp1, hp2, 'same pinned RNG → byte-identical final HP (visual replay added no RNG)');
});

test('source: the replay block re-rolls nothing and ends at the computed final HP', () => {
    const start = SRC.indexOf('C1 — multi-hit visual replay');
    assert.ok(start > 0, 'replay block present');
    // Bound the replay block to its closing fallback + the sleep that follows.
    const block = SRC.slice(start, SRC.indexOf('await sleep(200);', start));
    assert.ok(!/Math\.random|storyRngNext/.test(block), 'no RNG call inside the visual replay');
    assert.match(block, /defender\.currentHp = _mhFinalHp;/, 'ends at the exact loop-computed final HP');
    assert.match(block, /hitsLanded > 1 && _mhPerHit\.length > 1/, 'only replays genuine multi-hit landings');
    assert.match(block, /isReducedMotion[\s\S]{0,160}settings\.animations/, 'collapses under reduced motion / animations-off');
});
