// Guard: heal presentation (C3) is PURELY VISUAL. Berry auto-heals (and the new damage
// number) used to be log-only; they now get a +N / -N floating popup, an HP-bar glow, and
// the restore chime, so a heal reads as its own moment. The heal MECHANICS — who heals, the
// trigger threshold, the amount, item consumption — must be byte-identical. Locks: a Sitrus
// berry still fires + heals + is consumed after a sub-50% hit, and (source) _presentHeal
// never mutates HP and _checkBerriesAfterDamage stays synchronous.
// Run: node --test tests/suites/battle-heal-pacing.test.js

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');
const count = (re) => (SRC.match(re) || []).length;
const bodyOf = (name) => {
    const i = SRC.indexOf('function ' + name);
    if (i < 0) return '';
    const next = SRC.indexOf('\n        function ', i + 1);
    return SRC.slice(i, next < 0 ? i + 4000 : next);
};

let E;
before(async () => { E = await loadEngine(); });

describe('berry heal mechanics are unchanged by the visual presentation', () => {
    it('a Sitrus Berry still fires, heals 1/4 maxHP, and is consumed after a sub-50% hit', async () => {
        const { engine, mkMon, reset, window } = E;
        reset();
        const splash = ['Splash', 'Splash', 'Splash', 'Splash'];
        const defender = mkMon({ species: 'Snorlax', ability: 'None', moves: splash });
        const foe = mkMon({ species: 'Pikachu', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
        defender.maxHp = 200; defender.currentHp = 104;   // 52% — one Tackle drops it under 50%
        defender.item = 'Sitrus Berry'; defender.itemConsumed = false;
        defender.stats.spe = 1; foe.stats.spe = 999;       // foe strikes first
        engine.state.mode = 'pve';
        engine.state.playerParty = [defender]; engine.state.foeParty = [foe];
        engine.state.pActive = defender; engine.state.fActive = foe;
        engine.state.isOver = false; engine.state.isLocked = false;
        engine.setForcedFoeMoveSlot(0);                    // foe uses Tackle

        await window.playTurn(0, null);                    // defender Splashes; foe Tackles

        assert.equal(defender.item, null, 'Sitrus Berry consumed');
        assert.equal(defender.itemConsumed, true, 'itemConsumed flag set');
        // Sitrus restores floor(maxHp/4) = 50; post-hit HP was < 100, so the heal lifts it
        // back above the post-hit value and it survives.
        assert.ok(defender.currentHp > 0, 'defender survived');
        assert.ok(defender.currentHp >= 100, `Sitrus lifted HP back toward half (got ${defender.currentHp}/200)`);
    });
});

describe('source: the presentation is additive and never touches mechanics', () => {
    it('_presentHeal is defined once and never mutates currentHp / item', () => {
        assert.equal(count(/function _presentHeal\s*\(/g), 1, 'one shared heal-presentation helper');
        const b = bodyOf('_presentHeal');
        assert.ok(!/currentHp\s*[-+]?=/.test(b), '_presentHeal never writes HP');
        assert.ok(!/\.item\s*=/.test(b), '_presentHeal never changes the held item');
        assert.match(b, /showBattlePopup\('\+' \+ amount, 'popup-heal'/, 'green +N popup');
        assert.match(b, /playUiSfx\('restore'/, 'restore chime');
        assert.match(b, /hp-heal-pulse/, 'HP-bar glow');
    });

    it('_presentHeal is wired into the berry auto-heals (Sitrus / Oran / Berry Juice / flavor)', () => {
        const b = bodyOf('_checkBerriesAfterDamage');
        assert.ok((b.match(/_presentHeal\(mon, act\)/g) || []).length >= 3,
            'heal presentation called alongside the berry heals');
        // Mechanics untouched: still synchronous (no await introduced that would reorder
        // the Berserk/Anger-Shell HP snapshot at the call site).
        assert.ok(!/async function _checkBerriesAfterDamage/.test(SRC), '_checkBerriesAfterDamage stays synchronous');
        assert.ok(!/await _checkBerriesAfterDamage/.test(SRC), 'call site is not awaited (ordering preserved)');
    });

    it('floating damage numbers are added on the single-hit and multi-hit paths', () => {
        assert.ok(count(/showBattlePopup\('-' \+ actualDamage, 'popup-dmg', !isPlayer\)/g) >= 2,
            'a -N damage popup on both damage paths');
        assert.match(SRC, /\.popup-dmg \{[^}]*color:/, '.popup-dmg styled');
        assert.match(SRC, /\.popup-heal \{[^}]*color:/, '.popup-heal styled');
    });
});
