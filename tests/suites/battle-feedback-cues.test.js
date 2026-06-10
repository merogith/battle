// Guard: cheap battle feedback cues that punctuate previously log-only events. All are
// presentation-only (no state/RNG/damage change) and respect settings.animations /
// reduced motion / settings.soundEnabled.
//   B2 status-infliction blink · B3 low-HP audio cue · B4 entry-hazard flash
// Source-level locks (mirrors battle-hit-impact.test.js) — the helpers read module-scoped
// battle state that can't be driven from outside the engine.
// Run: node --test tests/suites/battle-feedback-cues.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(join(ROOT, 'battle.html'), 'utf8');
const count = (re) => (SRC.match(re) || []).length;
// Slice a function body from its declaration to the next top-level (8-space-indented)
// function — these battle functions are long, so a fixed window would truncate.
const bodyOf = (name) => {
    const i = SRC.indexOf('function ' + name);
    if (i < 0) return '';
    const next = SRC.indexOf('\n        function ', i + 1);
    return SRC.slice(i, next < 0 ? i + 8000 : next);
};

// ── B2 — status-infliction blink ───────────────────────────────────────────────
test('_battleStatusFlash is defined once and gated on animations + reduced motion', () => {
    assert.equal(count(/function _battleStatusFlash\s*\(/g), 1, 'one helper');
    const b = bodyOf('_battleStatusFlash');
    assert.match(b, /settings\.animations/, 'gated by settings.animations');
    assert.match(b, /isReducedMotion/, 'reduced motion skips the blink');
    assert.match(b, /anim-status-flash/, 'adds the status-flash class');
});

test('applyStatus punctuates the status: refresh badge + blink after the status log', () => {
    const b = bodyOf('applyStatus');
    // The blink + immediate updateUI come right after the canonical status log line.
    assert.match(b, /logMsg\(`\$\{mon\.name\} \$\{msgs\[status\]\}`, 'status'\);[\s\S]{0,400}_battleStatusFlash\(mon, status\)/,
        '_battleStatusFlash fires after the status is logged');
    assert.match(b, /if \(typeof updateUI === 'function'\) updateUI\(\)/, 'badge refreshes immediately');
});

test('the status-flash keyframe + class exist in CSS', () => {
    assert.match(SRC, /\.anim-status-flash\s*\{\s*animation:\s*statusFlash/, 'class wired to keyframe');
    assert.match(SRC, /@keyframes statusFlash/, 'keyframe defined');
});

// ── B3 — low-HP audio cue ───────────────────────────────────────────────────────
test("updateUI plays the lowHp cue once per crossing for the player's active mon", () => {
    const b = bodyOf('updateUI');
    assert.match(b, /mon === state\.pActive/, "scoped to the player's active mon");
    assert.match(b, /hpPct <= 10 && mon\.currentHp > 0/, 'only in the critical band, still alive (no beep on faint)');
    assert.match(b, /_lowHpBeeped/, 're-arm flag so it fires once per crossing');
    assert.match(b, /playUiSfx\('lowHp'/, 'plays the already-vendored lowHp beep');
});

test('the lowHp SFX is registered in the UI sound map', () => {
    assert.match(SRC, /lowHp:\s*'music\/ui_sfx\/low_hp\.wav'/, 'lowHp wav vendored + mapped');
});

// ── B4 — entry-hazard flash ─────────────────────────────────────────────────────
test('_battleEntryHazardFlash is defined once and gated on animations', () => {
    assert.equal(count(/function _battleEntryHazardFlash\s*\(/g), 1, 'one helper');
    const b = bodyOf('_battleEntryHazardFlash');
    assert.match(b, /settings\.animations/, 'gated by settings.animations');
    assert.match(b, /anim-hit-flash/, 'reuses the standard hit flash on the entering sprite');
    assert.match(b, /playHitSound/, 'plays a hit sound for the chip');
});

test('applyEntryHazards flashes the entering sprite when a hazard chips it', () => {
    const b = bodyOf('applyEntryHazards');
    assert.match(b, /_hazardDealtDmg = true/, 'tracks whether any hazard dealt damage');
    assert.match(b, /if \(_hazardDealtDmg\) _battleEntryHazardFlash\(isPlayer\)/, 'flashes once at the end');
    // The damage math itself is untouched — the flag is only set alongside existing logs.
    assert.ok(count(/_hazardDealtDmg = true/g) >= 3, 'set at stealth-rock, steelsurge, and spikes sites');
});
