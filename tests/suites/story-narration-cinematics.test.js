// Narration cinematics (v30) — locks the presentation polish on the canonical
// story renderer (_renderNarrativeOverlay) so a later session can't silently
// regress it. All of these are CSS-class lifts added AFTER mount, so the
// synchronous text-content DOM contract the other narration suites assert is
// untouched — this suite proves both the new classes AND that contract.
//
//   1. Cinematic classes — overlay root gets .story-narr-root, the speaker img
//      gets .story-narr-sprite, the dialog host gets .story-narr-dialog-rise,
//      and a backdrop scene adds .story-narr-kenburns.
//   2. Advance cue — the iconic "▾" surfaces ONLY once the body is fully read:
//      shown for an instant scene, hidden while a choice is pending then shown
//      after a pick, hidden through staged revealLines until the final line.
//   3. Reduced-motion safety — a media block neutralizes every new motion class.
//   4. Hall of Fame hero moment — spotlight + cascade spread + triumph chime.
//
// Surface under test: window.__narrationTest + battle.html source, jsdom only.

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, '../../battle.html'), 'utf8');

let nt, window, document;

before(async () => {
  ({ window } = await loadEngine());
  nt = window.__narrationTest;
  document = window.document;
  assert.ok(nt, 'window.__narrationTest must be exposed under the harness');
});

beforeEach(() => {
  let guard = 0;
  do { nt.narrationForceClear(); } while ((nt.isNarrationLive() || nt.narrationQueueDepth() > 0) && ++guard < 50);
  nt.sm = { storyChoices: {} };
});

// ── 1. Cinematic classes are applied to the right nodes ──────────────────────
test('the overlay tags root / sprite / dialog with the cinematic classes', () => {
  const ov = nt.renderNarrativeOverlay({
    sceneKey: 'main.event1', spriteSrc: 'sprites/x.png',
    lines: ['Hello there.'], onDone: () => {},
  });
  assert.ok(ov.classList.contains('story-narr-root'), 'overlay root gets the base vignette class');
  const img = ov.querySelector('img');
  assert.ok(img && img.classList.contains('story-narr-sprite'), 'speaker sprite gets the entrance class');
  const host = ov.querySelector('.story-dialog-host');
  assert.ok(host && host.classList.contains('story-narr-dialog-rise'), 'dialog host gets the rise-in class');
  assert.ok(ov.querySelector('[data-narr-advance="1"]'), 'the advance-cue element is present');
  // The text-content contract still holds (no async strip).
  assert.ok((ov.textContent || '').includes('Hello there.'), 'full prose present synchronously');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

test('a caller spriteClass rides alongside .story-narr-sprite (cast emotions survive)', () => {
  const ov = nt.renderNarrativeOverlay({
    sceneKey: 'villain.rocket.boss', spriteSrc: 'sprites/x.png', spriteClass: 'cast-emotion cast-smug',
    lines: ['x'], onDone: () => {},
  });
  const img = ov.querySelector('img');
  assert.ok(img.classList.contains('story-narr-sprite'), 'entrance class added');
  assert.ok(img.classList.contains('cast-emotion'), 'caller emotion base class preserved');
  assert.ok(img.classList.contains('cast-smug'), 'caller emotion variant preserved');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

test('a backdrop scene adds the ken-burns drift class; a flat scene does not', () => {
  const withBd = nt.renderNarrativeOverlay({ backdropScene: 'forest', lines: ['x'], onDone: () => {} });
  assert.ok(withBd.classList.contains('story-narr-kenburns'), 'backdrop overlay drifts');
  withBd.querySelector('button[data-narr-continue="1"]').click();

  const flat = nt.renderNarrativeOverlay({ lines: ['x'], onDone: () => {} });
  assert.ok(!flat.classList.contains('story-narr-kenburns'), 'flat-black scene never gets ken-burns');
  flat.querySelector('button[data-narr-continue="1"]').click();
});

// ── 2. Advance cue surfaces only when the body is fully read ──────────────────
test('an instant scene surfaces the advance cue immediately', () => {
  const ov = nt.renderNarrativeOverlay({ sceneKey: 'main.event1', typewriter: false, lines: ['Done.'], onDone: () => {} });
  const cue = ov.querySelector('[data-narr-advance="1"]');
  assert.ok(cue && cue.classList.contains('show'), 'cue shown when text is already fully on screen');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

test('the advance cue stays hidden while a choice is pending, then shows after a pick', () => {
  const ov = nt.renderNarrativeOverlay({
    sceneKey: 'main.event1', lines: ['Pick one:'],
    choices: [{ label: 'A', reply: ['You chose A.'] }], onDone: () => {},
  });
  const cue = ov.querySelector('[data-narr-advance="1"]');
  assert.ok(cue && !cue.classList.contains('show'), 'cue hidden while the prompt is unanswered');
  ov.querySelector('button[data-narr-choice-idx="0"]').click();
  assert.ok(cue.classList.contains('show'), 'cue shown once the pick swaps in the single Continue');
  ov.querySelector('button[data-narr-continue="1"]').click();
});

test('staged revealLines keep the cue hidden until the final line is surfaced', () => {
  const ov = nt.renderNarrativeOverlay({
    sceneKey: 'main.event1', revealLines: true, typewriter: false,
    lines: ['one', 'two', 'three'], onDone: () => {},
  });
  const cue = ov.querySelector('[data-narr-advance="1"]');
  assert.ok(cue && !cue.classList.contains('show'), 'cue hidden with staged lines remaining');
  ov.click(); // surfaces "two" (one staged line still hidden)
  assert.ok(!cue.classList.contains('show'), 'still hidden — a staged line remains');
  ov.click(); // surfaces "three" (the last) → cue appears, overlay not yet dismissed
  assert.ok(cue.classList.contains('show'), 'cue shown once the final staged line is up');
  assert.equal(ov.parentNode, document.body, 'overlay not dismissed by the line that surfaced the cue');
  ov.click(); // now there is nothing left to surface → dismiss
  assert.equal(ov.parentNode, null, 'a further tap dismisses');
});

// ── 3. Reduced-motion neutralizes every new motion class ──────────────────────
test('a reduced-motion block disables the narration cinematics animations', () => {
  const block = SRC.match(/@media \(prefers-reduced-motion: reduce\) \{[^@]*?story-narr-kenburns[\s\S]*?\}\s*\}/);
  assert.ok(block, 'a reduced-motion block references the narration cinematics classes');
  const b = block[0];
  ['story-narr-sprite', 'story-narr-dialog-rise', 'story-narr-advance', 'story-narr-kenburns']
    .forEach(c => assert.ok(b.includes(c), `${c} is neutralized under reduced motion`));
  assert.match(b, /animation:\s*none\s*!important/, 'animations forced off');
  // The cue must still be display:block when .show is set (affordance survives) —
  // i.e. reduced motion kills the blink, not the arrow.
  assert.match(SRC, /\.story-narr-advance\.show \{ display: block; \}/, 'cue remains visible when shown');
});

test('the new narration keyframes are defined', () => {
  ['storyNarrSpriteIn', 'storyNarrDialogIn', 'storyNarrAdvanceBlink', 'storyNarrKenBurns']
    .forEach(k => assert.ok(SRC.includes('@keyframes ' + k), `@keyframes ${k} defined`));
});

// ── 4. Hall of Fame hero moment ──────────────────────────────────────────────
test('the Hall of Fame gets a spotlight, a wider confetti cascade, and a chime', () => {
  // Spotlight element + CSS + reduced-motion gate.
  assert.match(SRC, /spotlight\.className = 'story-hof-spotlight'/, 'spotlight element appended to the stage');
  assert.ok(SRC.includes('@keyframes storyHofSpotlightIn'), 'spotlight fade-in keyframe defined');
  assert.match(SRC, /\.story-hof-spotlight \{ animation: none; opacity: 1; \}/, 'spotlight reduced-motion safe');
  // Confetti spawned with the wider spread + the triumph chime on entry.
  assert.match(SRC, /storySpawnConfetti\(conf, 40, 1\.8\)/, 'HoF confetti uses the wider cascade window');
  assert.match(SRC, /StoryFx\.playSfx\('achv', 0\.7\)/, 'a triumph chime plays as the hall lights up');
  // The spread param is backward-compatible (older callers omit it).
  assert.match(SRC, /function storySpawnConfetti\(container, count, spreadSec\)/, 'spread param added');
});
