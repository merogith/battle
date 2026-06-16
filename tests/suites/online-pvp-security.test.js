// Online PvP hardening (2026-06): the battle log is synced over Supabase and
// re-injected into the DOM, and the room row is world-readable. These tests
// lock in the two client-side defenses:
//   1. sanitizeBattleLogHtml is an allowlist sanitizer that neutralizes XSS
//      payloads while preserving legitimate <span class>/<br> log markup.
//   2. simpleHash is deterministic + order-sensitive (used to detect a guest
//      applying a divergent host snapshot).
// online-pvp.js is a standalone IIFE (not loaded by the engine harness), so we
// evaluate it against a fresh jsdom window here.
// Run: node --test tests/suites/online-pvp-security.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, '..', '..', 'online-pvp.js'), 'utf8');

function loadOnlineBattle() {
    const dom = new JSDOM('<!doctype html><html><body><div id="battle-log"></div></body></html>');
    // online-pvp.js closes over `window`; run it with the jsdom window as both
    // window and globalThis so its IIFE picks up document/localStorage.
    const fn = new Function('window', 'globalThis', SRC + '\nreturn window.OnlineBattle;');
    return { OB: fn(dom.window, dom.window), dom };
}

test('sanitizeBattleLogHtml strips script/img-onerror/svg/js-href payloads', () => {
    const { OB } = loadOnlineBattle();
    const S = OB.sanitizeBattleLogHtml;
    const payloads = [
        '<img src=x onerror="alert(1)">',
        '<script>alert(1)</script>',
        '<svg/onload=alert(1)>',
        '<a href="javascript:alert(1)">x</a>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<div onclick="steal()">hi</div>',
    ];
    for (const p of payloads) {
        const out = S(p);
        assert.ok(!/onerror|onload|onclick|<script|<svg|<iframe|javascript:/i.test(out),
            'no live vector remains for: ' + p + ' => ' + out);
    }
});

test('sanitizeBattleLogHtml preserves legitimate log markup', () => {
    const { OB } = loadOnlineBattle();
    const S = OB.sanitizeBattleLogHtml;
    const good = '<div class="log-row"><span class="log-dmg">Hit for 40!</span><br>Foe fainted.</div>';
    const out = S(good);
    assert.match(out, /class="log-row"/);
    assert.match(out, /class="log-dmg"/);
    assert.match(out, /Hit for 40!/);
    assert.match(out, /<br\s*\/?>/);
});

test('sanitizeBattleLogHtml rejects a class-attribute breakout', () => {
    const { OB } = loadOnlineBattle();
    const S = OB.sanitizeBattleLogHtml;
    // A class value carrying a quote + handler must lose the class, keep text.
    const out = S('<span class="a&quot; onload=alert(1)">y</span>');
    assert.ok(!/onload/i.test(out), 'no handler survives: ' + out);
    assert.match(out, />?y<?/);
});

test('sanitizeBattleLogHtml handles non-string input', () => {
    const { OB } = loadOnlineBattle();
    const S = OB.sanitizeBattleLogHtml;
    assert.equal(S(null), '');
    assert.equal(S(undefined), '');
    assert.equal(S(42), '');
});

test('simpleHash is deterministic and order-sensitive', () => {
    const { OB } = loadOnlineBattle();
    const h = OB.simpleHash;
    assert.equal(h('abc'), h('abc'), 'same input -> same hash');
    assert.notEqual(h('abc'), h('acb'), 'order matters');
    assert.notEqual(h('{"seq":1}'), h('{"seq":2}'), 'content matters');
});
