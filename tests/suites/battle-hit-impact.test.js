// Guard: the in-battle "impact" layer is consistent across the single-hit AND multi-hit
// damage paths, and a hit that is BOTH critical AND super-effective reacts
// exactly ONCE. Both paths route the sprite reaction through the shared,
// tier-selecting _applyHitImpact dispatcher (which reuses _battleHitShake + adds a
// hit-stop on crit/boss-phase). Pure source check — locks parity + the single-shake fix.
// Run: node --test tests/suites/battle-hit-impact.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');

const count = (re) => (SRC.match(re) || []).length;
const bodyOf = (name) => {
    const i = SRC.indexOf('function ' + name);
    if (i < 0) return '';
    const next = SRC.indexOf('\n        function ', i + 1);
    return SRC.slice(i, next < 0 ? i + 4000 : next);
};

test('_battleHitShake and _applyHitImpact + _hitStop are each defined exactly once', () => {
    assert.equal(count(/function _battleHitShake\s*\(/g), 1, 'one shared shake helper');
    assert.equal(count(/function _applyHitImpact\s*\(/g), 1, 'one impact dispatcher');
    assert.equal(count(/function _hitStop\s*\(/g), 1, 'one hit-stop primitive');
});

test('both damage paths route impact through _applyHitImpact (single + multi hit)', () => {
    // The multi-hit path passes _anyHitCrit (any hit in the volley crit) since the
    // per-hit roll fix; the single-hit path still passes the formula-time crit.
    // Extra options after crit (e.g. isPlayerTarget/type for the hit-burst
    // particles) are allowed — the guard locks the routing + crit semantics only.
    assert.ok(count(/await _applyHitImpact\(\{ effectiveness: typeEff, crit: (?:crit > 1|_anyHitCrit)[^)]*\}\)/g) >= 2,
        'the single-hit and multi-hit telegraphs both call the dispatcher');
});

test('a crit + super-effective hit shakes ONCE, not twice (the double-shake fix)', () => {
    const b = bodyOf('_applyHitImpact');
    // The shake tiers are mutually exclusive (if / else if) so only one fires per hit.
    assert.match(b, /if \(o\.bossPhase\)[\s\S]{0,140}else if \(o\.crit\)[\s\S]{0,140}else if \(o\.effectiveness > 1\)/,
        'tiers are exclusive — boss > crit > super, never stacked');
    // _battleHitShake is now invoked ONLY from inside _applyHitImpact (no telegraph calls).
    const crit = /_battleHitShake\('crit', o\.isPlayerTarget\)/g;
    const superEffective = /_battleHitShake\('super', o\.isPlayerTarget\)/g;
    const inBodyCrit = (b.match(crit) || []).length;
    const inBodySuper = (b.match(superEffective) || []).length;
    assert.equal(count(crit), inBodyCrit, 'crit motion stays inside the dispatcher');
    assert.equal(count(superEffective), inBodySuper, 'super-effective motion stays inside the dispatcher');
    assert.equal(inBodyCrit, 2, 'the critical style is used for boss phases and critical hits');
    assert.equal(inBodySuper, 1, 'super shake fires from exactly one place');
});

test('_applyHitImpact honors animations + reduced motion (flash-only fallback)', () => {
    const b = bodyOf('_applyHitImpact');
    assert.match(b, /settings\.animations/, 'gated by settings.animations');
    assert.match(b, /isReducedMotion/, 'reduced motion → no shake / no hit-stop');
});

test('_hitStop is harness-aware and reduced-motion-bypassed', () => {
    const b = bodyOf('_hitStop');
    assert.match(b, /return sleep\(/, 'uses the harness-aware sleep (instant under tests)');
    assert.match(b, /isReducedMotion[\s\S]{0,40}return Promise\.resolve\(\)/, 'reduced motion bypasses the freeze');
    // crit (90ms) + boss-phase (120ms) hit-stop durations are wired at the call site.
    assert.match(bodyOf('_applyHitImpact'), /_hitStop\(120\)[\s\S]*_hitStop\(90\)/, 'boss 120ms / crit 90ms');
});

test('hit reactions use the battle rate and target sprite while leaving the HUD still', () => {
    const b = bodyOf('_battleHitShake');
    assert.match(b, /battleVisualRate\(\)/, 'gated by effective animation settings and speed');
    assert.match(b, /isPlayerTarget \? 'player-sprite' : 'foe-sprite'/, 'moves the confirmed target sprite');
    assert.doesNotMatch(b, /screen-battle/, 'the HUD remains still');
});

test('both damage paths still play the hit sound (parity)', () => {
    assert.ok(count(/AudioSystem\.playHitSound\(/g) >= 2,
        'playHitSound called on both single-hit and multi-hit paths');
});

test('the old inline single-hit shake calls remain removed (routed through the helper)', () => {
    assert.equal(count(/settings\.animations && screenEl\) anime\(/g), 0,
        'no inline screenEl shake remains');
});
