import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

// Pull the REAL sanitizeBattleLogHtml out of online-pvp.js by running its IIFE
// against a fresh jsdom window (same approach as online-pvp-security.test.js).
// An earlier version string-sliced just the function body out of the source,
// which dropped its module-level allowlist consts (_LOG_ALLOWED_TAGS /
// _LOG_CLASS_RE) and never provided global.document — so the DOM allowlist path
// silently fell back to stripping EVERY tag, and the "preserves safe markup"
// cases failed. Loading the actual OnlineBattle export exercises the shipping
// sanitizer, allowlist and all.
function loadSanitizer() {
  const src = readFileSync('online-pvp.js', 'utf8');
  const dom = new JSDOM('<!doctype html><html><body><div id="battle-log"></div></body></html>');
  // online-pvp.js closes over `window`; run it with the jsdom window as both
  // window and globalThis so its IIFE picks up document/localStorage + consts.
  // eslint-disable-next-line no-new-func
  const fn = new Function('window', 'globalThis', `${src}\nreturn window.OnlineBattle;`);
  const OB = fn(dom.window, dom.window);
  assert.ok(OB && typeof OB.sanitizeBattleLogHtml === 'function',
    'OnlineBattle.sanitizeBattleLogHtml is exported by online-pvp.js');
  return OB.sanitizeBattleLogHtml;
}

test('sanitize: passes through legitimate battle-log content', () => {
  const fn = loadSanitizer();
  const safe = '<span class="log-line">Charizard used <b>Flamethrower</b>!</span><br>It\'s super effective!<br>';
  assert.equal(fn(safe), safe);
});

test('sanitize: neutralizes <script> tags (no script element survives)', () => {
  const fn = loadSanitizer();
  const out = fn('<span>before</span><script>alert("xss")</script><span>after</span>');
  // <script> is not allowlisted, so it is replaced by its inert text content:
  // no <script> element survives to execute (the literal characters left behind
  // are harmless plain text — execution safety is proven by the innerHTML test
  // below and the sibling online-pvp-security suite).
  assert.equal(out.includes('<script'), false);
  assert.equal(out.includes('</script>'), false);
  assert.equal(out.includes('<span>before</span>'), true);
  assert.equal(out.includes('<span>after</span>'), true);
});

test('sanitize: strips on*= event handlers', () => {
  const fn = loadSanitizer();
  const out = fn('<span onclick="alert(1)" onmouseover=alert(2)>click</span>');
  assert.equal(out.includes('onclick'), false);
  assert.equal(out.includes('onmouseover'), false);
  assert.equal(out.includes('alert'), false);
  assert.equal(out.includes('<span'), true);
});

test('sanitize: blocks javascript: urls in href/src', () => {
  const fn = loadSanitizer();
  const out = fn('<a href="javascript:alert(1)">x</a><img src=javascript:alert(2)>');
  assert.equal(out.includes('javascript:'), false);
});

test('sanitize: strips <iframe>, <object>, <embed>, <style>', () => {
  const fn = loadSanitizer();
  for (const tag of ['iframe', 'object', 'embed', 'style']) {
    const out = fn(`<${tag} src="evil">content</${tag}>`);
    assert.equal(out.includes(`<${tag}`), false, `<${tag}> should be stripped`);
  }
});

test('sanitize: strips self-closing dangerous tags', () => {
  const fn = loadSanitizer();
  const out = fn('<link rel="stylesheet" href="evil.css"/><meta http-equiv="refresh" content="0;url=evil"/>');
  assert.equal(out.includes('<link'), false);
  assert.equal(out.includes('<meta'), false);
});

test('sanitize: strips style="" attribute (no expression() / url(javascript:))', () => {
  const fn = loadSanitizer();
  const out = fn('<span style="background:url(javascript:alert(1))">x</span>');
  assert.equal(out.includes('style='), false);
});

test('sanitize: returns empty string for non-string input', () => {
  const fn = loadSanitizer();
  assert.equal(fn(null), '');
  assert.equal(fn(undefined), '');
  assert.equal(fn(42), '');
  assert.equal(fn({}), '');
});

test('sanitize: injecting via innerHTML in jsdom does not execute scripts', () => {
  const fn = loadSanitizer();
  const dom = new JSDOM('<!doctype html><div id="battle-log"></div>');
  global.alertHit = false;
  dom.window.alertHit = false;
  // Try a battery of common XSS vectors
  const vectors = [
    '<script>window.alertHit=true</script>',
    '<img src=x onerror="window.alertHit=true">',
    '<svg onload="window.alertHit=true"></svg>',
    '<iframe src="javascript:window.alertHit=true"></iframe>',
    '<a href="javascript:window.alertHit=true">click</a>',
  ];
  for (const v of vectors) {
    const safe = fn(v);
    dom.window.document.getElementById('battle-log').innerHTML = safe;
    assert.equal(dom.window.alertHit, false, `vector "${v.slice(0, 40)}..." escaped sanitizer (produced: ${safe.slice(0, 60)})`);
  }
});
