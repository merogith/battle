import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

// Pull the sanitizeBattleLogHtml function out of online-pvp.js by stubbing the
// IIFE's environment and running just the relevant chunk. We don't load the
// whole battle.html engine — this is a focused unit test on the sanitizer.
function loadSanitizer() {
  const src = readFileSync('online-pvp.js', 'utf8');
  const start = src.indexOf('function sanitizeBattleLogHtml');
  assert.ok(start > 0, 'sanitizeBattleLogHtml function present in online-pvp.js');
  const end = src.indexOf('\n    }\n', start) + 6;
  const fnSrc = src.slice(start, end);
  // eslint-disable-next-line no-new-func
  return new Function(`${fnSrc}\nreturn sanitizeBattleLogHtml;`)();
}

test('sanitize: passes through legitimate battle-log content', () => {
  const fn = loadSanitizer();
  const safe = '<span class="log-line">Charizard used <b>Flamethrower</b>!</span><br>It\'s super effective!<br>';
  assert.equal(fn(safe), safe);
});

test('sanitize: strips <script> tags and their content', () => {
  const fn = loadSanitizer();
  const out = fn('<span>before</span><script>alert("xss")</script><span>after</span>');
  assert.equal(out.includes('<script'), false);
  assert.equal(out.includes('alert('), false);
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
