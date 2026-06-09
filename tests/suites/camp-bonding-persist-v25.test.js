// Camp bonding — buff PERSISTS through in-battle stat recomputes (mega / form / Palafin /
// Transform-revert). Those sites rebuild mon.stats (and maybe maxHp) from base+EV+IV+nature and
// used to silently drop the player's earned +5% relationship buff. _reapplyRelationshipBuff
// (exposed as __storyTest.reapplyRelationshipBuff) restores it after any such recompute.
//
// See docs/story-design/camp/BONDING_RELATIONSHIPS.md. Locks: the buff survives a recompute,
// is a strict no-op for foes / dormant mons, and the HP branch preserves the current-HP fraction.
//
// Run: node --test tests/suites/camp-bonding-persist-v25.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

const freshBuild = (n = 'Hardy') => ({ n, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, evs: {} });

test('exposes reapplyRelationshipBuff on the test surface', () => {
    assert.equal(typeof ST.reapplyRelationshipBuff, 'function');
});

test('buff PERSISTS: a dropped combat-stat buff is restored after a recompute', () => {
    // discipline mastered → def ×1.05.
    const rm = { hp:1, atk:1, def:1.05, spa:1, spd:1, spe:1 };
    const base = ST.buildPokemon('Machop', freshBuild('Hardy'));
    const buffed = ST.buildPokemon('Machop', Object.assign(freshBuild('Hardy'), { _relationshipStatMult: rm }));
    assert.equal(buffed.stats.def, Math.floor(base.stats.def * 1.05), 'buff baked in at build time');
    assert.equal(buffed.stats.atk, base.stats.atk, 'unboosted stat untouched');

    // Simulate a form/mega recompute that rebuilt stats from base, wiping the buff.
    buffed.stats.def = base.stats.def;
    ST.reapplyRelationshipBuff(buffed, {});
    assert.equal(buffed.stats.def, Math.floor(base.stats.def * 1.05), 'def buff restored after recompute');
    assert.equal(buffed.stats.atk, base.stats.atk, 'still no phantom buff on atk');
});

test('no-op for foes / dormant: a mon with no _relationshipStatMult is untouched', () => {
    const foe = ST.buildPokemon('Machop', freshBuild('Hardy')); // never stamped
    const def0 = foe.stats.def, hp0 = foe.maxHp, cur0 = foe.currentHp;
    ST.reapplyRelationshipBuff(foe, { hp: true });
    assert.equal(foe.stats.def, def0, 'stats untouched');
    assert.equal(foe.maxHp, hp0, 'maxHp untouched');
    assert.equal(foe.currentHp, cur0, 'currentHp untouched');

    // An explicit all-1.0 (dormant) multiplier is also a no-op.
    const dormant = ST.buildPokemon('Machop', Object.assign(freshBuild('Hardy'), { _relationshipStatMult: { hp:1, atk:1, def:1, spa:1, spd:1, spe:1 } }));
    const ddef = dormant.stats.def, dhp = dormant.maxHp;
    ST.reapplyRelationshipBuff(dormant, { hp: true });
    assert.equal(dormant.stats.def, ddef, 'dormant → def unchanged');
    assert.equal(dormant.maxHp, dhp, 'dormant → maxHp unchanged');
});

test('HP branch: maxHp re-scales and the current-HP fraction is preserved', () => {
    // devotion mastered → hp ×1.05.
    const rm = { hp:1.05, atk:1, def:1, spa:1, spd:1, spe:1 };
    const base = ST.buildPokemon('Machop', freshBuild('Hardy'));
    const baseMax = base.maxHp;
    const buffed = ST.buildPokemon('Machop', Object.assign(freshBuild('Hardy'), { _relationshipStatMult: rm }));
    assert.equal(buffed.maxHp, Math.floor(baseMax * 1.05), 'hp buff baked in at build time');

    // Simulate a form recompute that rebuilt maxHp from base and left the mon at ~50% HP.
    buffed.maxHp = baseMax;
    buffed.currentHp = Math.floor(baseMax * 0.5);
    ST.reapplyRelationshipBuff(buffed, { hp: true });
    assert.equal(buffed.maxHp, Math.floor(baseMax * 1.05), 'maxHp re-scaled by the hp buff');
    assert.ok(Math.abs(buffed.currentHp / buffed.maxHp - 0.5) < 0.02, 'current-HP fraction preserved (~50%)');
});

test('HP branch is skipped when opts.hp is absent (mega keeps base HP)', () => {
    const rm = { hp:1.05, atk:1.05, def:1, spa:1, spd:1, spe:1 };
    const base = ST.buildPokemon('Machop', freshBuild('Hardy'));
    const buffed = ST.buildPokemon('Machop', Object.assign(freshBuild('Hardy'), { _relationshipStatMult: rm }));
    // Pretend a mega recompute reset atk + maxHp to base.
    buffed.stats.atk = base.stats.atk;
    buffed.maxHp = base.maxHp;
    buffed.currentHp = base.maxHp;
    ST.reapplyRelationshipBuff(buffed); // no opts → combat stats only
    assert.equal(buffed.stats.atk, Math.floor(base.stats.atk * 1.05), 'atk buff restored');
    assert.equal(buffed.maxHp, base.maxHp, 'maxHp left alone without opts.hp');
});
