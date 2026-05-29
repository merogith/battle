import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

// Pull sanitizeBattleLogHtml out of online-pvp.js by slicing the IIFE-private
// function and running just it. The sanitizer now parses markup in an inert
// document, so it needs a `global.document` — we inject a jsdom one. We don't
// load the whole battle.html engine; this is a focused unit test on the sanitizer.
function loadSanitizer() {
  const src = readFileSync('online-pvp.js', 'utf8');
  const start = src.indexOf('function sanitizeBattleLogHtml');
  assert.ok(start > 0, 'sanitizeBattleLogHtml function present in online-pvp.js');
  const end = src.indexOf('\n    }\n', start) + 6;
  const fnSrc = src.slice(start, end);
  const dom = new JSDOM('<!doctype html><body></body>');
  const sandboxGlobal = { document: dom.window.document };
  // eslint-disable-next-line no-new-func
  return new Function('global', `${fnSrc}\nreturn sanitizeBattleLogHtml;`)(sandboxGlobal);
}

test('sanitize: preserves allowlisted tags + a validated class', () => {
  const fn = loadSanitizer();
  const out = fn('<span class="log-line">Charizard used <b>Flamethrower</b>!</span><br>Super effective!');
  assert.match(out, /<span class="log-line">/);
  assert.match(out, /<b>Flamethrower<\/b>/);
  assert.match(out, /<br>/);
  assert.match(out, /Super effective!/);
});

test('sanitize: keeps move-link class but drops its inline handlers/style', () => {
  const fn = loadSanitizer();
  const out = fn('<span class="log-move-link tip-move-cell" data-mn="Tackle" onclick="x()" style="color:red">Tackle</span>');
  assert.match(out, /class="log-move-link tip-move-cell"/); // class preserved (class-based CSS still works)
  assert.equal(/onclick/i.test(out), false);
  assert.equal(/data-mn/i.test(out), false);
  assert.equal(/style=/i.test(out), false);
  assert.match(out, /Tackle/);
});

test('sanitize: strips <script> tags AND their content', () => {
  const fn = loadSanitizer();
  const out = fn('<span>before</span><script>alert("xss")</script><span>after</span>');
  assert.equal(out.includes('<script'), false);
  assert.equal(out.includes('alert('), false); // raw-text content dropped too
  assert.equal(out.includes('before'), true);
  assert.equal(out.includes('after'), true);
});

test('sanitize: strips on*= event handlers', () => {
  const fn = loadSanitizer();
  const out = fn('<span onclick="alert(1)" onmouseover=alert(2)>click</span>');
  assert.equal(/onclick/i.test(out), false);
  assert.equal(/onmouseover/i.test(out), false);
  assert.equal(out.includes('alert'), false);
  assert.equal(out.includes('<span'), true); // span kept, handlers gone
});

test('sanitize: drops non-allowlisted tags (a/img) but keeps benign text', () => {
  const fn = loadSanitizer();
  const out = fn('<a href="javascript:alert(1)">link-text</a><img src=x onerror=alert(2)>tail');
  assert.equal(/<a\b/i.test(out), false);
  assert.equal(/<img/i.test(out), false);
  assert.equal(/javascript/i.test(out), false);
  assert.equal(/onerror/i.test(out), false);
  assert.match(out, /link-text/); // <a> dropped, its text survives
  assert.match(out, /tail/);
});

test('sanitize: strips dangerous tags (iframe/object/embed/style/svg)', () => {
  const fn = loadSanitizer();
  // The tag itself is always dropped.
  for (const tag of ['iframe', 'object', 'embed', 'style', 'svg']) {
    const out = fn(`<${tag} src="evil">content</${tag}>`);
    assert.equal(out.includes(`<${tag}`), false, `<${tag}> should be stripped`);
  }
  // For content-bearing variants (not void <embed>), the inner content drops too.
  for (const tag of ['iframe', 'object', 'style', 'svg']) {
    const out = fn(`<${tag}>SECRET_${tag}</${tag}>`);
    assert.equal(out.includes(`SECRET_${tag}`), false, `<${tag}> content should be dropped`);
  }
});

test('sanitize: strips self-closing dangerous tags', () => {
  const fn = loadSanitizer();
  const out = fn('<link rel="stylesheet" href="evil.css"/><meta http-equiv="refresh" content="0;url=evil"/>');
  assert.equal(out.includes('<link'), false);
  assert.equal(out.includes('<meta'), false);
});

test('sanitize: strips style="" attribute', () => {
  const fn = loadSanitizer();
  const out = fn('<span style="background:url(javascript:alert(1))">x</span>');
  assert.equal(out.includes('style='), false);
  assert.equal(out.includes('javascript'), false);
});

// --- The specific bypass vectors that defeated the old regex blocklist (ISSUE-002) ---

test('sanitize: BYPASS — backtick-quoted attribute (regex required whitespace before on*=)', () => {
  const fn = loadSanitizer();
  const out = fn('<img src=`x`onerror=alert(1)>');
  assert.equal(/onerror/i.test(out), false, 'backtick onerror must not survive');
  assert.equal(/<img/i.test(out), false, 'img must be dropped');
});

test('sanitize: BYPASS — HTML-entity-encoded javascript: scheme', () => {
  const fn = loadSanitizer();
  const out = fn('<a href="jav&#x09;ascript:alert(1)">x</a>');
  assert.equal(/<a\b/i.test(out), false);
  assert.equal(/javascript/i.test(out), false, 'entity-encoded scheme must not reconstitute');
});

test('sanitize: rejects an invalid class value', () => {
  const fn = loadSanitizer();
  const out = fn('<span class="ok" id="evil"><span class="x&quot; onload=&quot;y">z</span></span>');
  assert.equal(/\bid=/i.test(out), false);      // only class is ever copied
  assert.equal(/onload/i.test(out), false);
});

test('sanitize: returns empty string for non-string / empty input', () => {
  const fn = loadSanitizer();
  assert.equal(fn(null), '');
  assert.equal(fn(undefined), '');
  assert.equal(fn(42), '');
  assert.equal(fn({}), '');
  assert.equal(fn(''), '');
});

test('sanitize: injecting the sanitized output via innerHTML executes nothing', () => {
  const fn = loadSanitizer();
  const dom = new JSDOM('<!doctype html><div id="battle-log"></div>', { runScripts: 'dangerously' });
  dom.window.alertHit = false;
  const vectors = [
    '<script>window.alertHit=true</script>',
    '<img src=x onerror="window.alertHit=true">',
    '<img src=`x`onerror=window.alertHit=true>',
    '<svg onload="window.alertHit=true"></svg>',
    '<iframe src="javascript:window.alertHit=true"></iframe>',
    '<a href="javascript:window.alertHit=true">click</a>',
    '<a href="jav&#x09;ascript:window.alertHit=true">click</a>',
    '<body onload="window.alertHit=true">',
    '<details open ontoggle="window.alertHit=true">',
  ];
  for (const v of vectors) {
    const safe = fn(v);
    dom.window.document.getElementById('battle-log').innerHTML = safe;
    assert.equal(dom.window.alertHit, false, `vector "${v.slice(0, 40)}..." escaped sanitizer (produced: ${safe.slice(0, 60)})`);
  }
});
