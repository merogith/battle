// Narration mount-lock release (P0.3) — the unified overlay queue's lock
// (`_narrationLive`) used to wedge permanently when a live overlay was torn
// down via raw `.remove()` instead of its own dismiss(): every later overlay
// queued invisibly, turning visible features (e.g. the city-hub errand offer)
// into silent no-ops. The fix tracks the mounted element and self-heals the
// lock once that element has left the DOM — while NEVER releasing early for
// a still-connected overlay (that would re-open the historical stacked-
// overlay bug the queue exists to prevent).
//
// Surface under test: window.__narrationTest (jsdom harness only).

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { loadEngine } from '../helpers/load-engine.js';

let nt, window, document;

before(async () => {
  ({ window } = await loadEngine());
  nt = window.__narrationTest;
  document = window.document;
  assert.ok(nt, 'window.__narrationTest must be exposed under the harness');
});

// Reset the stage between tests: clear lock + queue regardless of what the
// previous test left behind (force-clear pops one queued overlay per call).
beforeEach(() => {
  let guard = 0;
  do { nt.narrationForceClear(); } while ((nt.isNarrationLive() || nt.narrationQueueDepth() > 0) && ++guard < 50);
  nt.sm = { storyChoices: {} };
});

// ── The leak, minimally ─────────────────────────────────────────────────────
test('raw .remove() of a live overlay no longer wedges the lock', () => {
  const ov1 = nt.renderNarrativeOverlay({ lines: ['scene one'], onDone: () => {} });
  assert.equal(ov1.parentNode, document.body, 'first overlay mounts');
  assert.equal(nt.isNarrationLive(), true);

  // External teardown — no dismiss(), exactly the leak class the audit found.
  ov1.remove();
  assert.equal(nt.isNarrationLive(), false, 'lock self-heals once its element left the DOM');

  const ov2 = nt.renderNarrativeOverlay({ lines: ['scene two'], onDone: () => {} });
  assert.equal(ov2.parentNode, document.body, 'next overlay mounts instead of queueing forever');
  ov2.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(nt.isNarrationLive(), false, 'stage clear after dismiss');
});

// ── The user-visible symptom: errand offer silently no-ops ──────────────────
test('errand offer recovers after a wedged lock (was: silent no-op)', () => {
  nt.sm = { storyChoices: {}, errands: {}, badges: 0 };

  // Wedge the stage the way the bug did: live overlay removed raw.
  nt.renderNarrativeOverlay({ lines: ['stale scene'], onDone: () => {} }).remove();

  // City 1 always has the ledger delivery on a fresh save.
  let doneFired = false;
  const shown = window._showErrandOffer(1, () => { doneFired = true; });
  assert.equal(shown, true, 'an offer exists for city 1');

  const acceptBtn = document.querySelector('button[data-narr-choice-idx="0"]');
  assert.ok(acceptBtn, 'offer overlay actually mounted (the old bug queued it invisibly)');

  acceptBtn.click(); // "Take the job" → reply view
  const cont = document.querySelector('button[data-narr-continue="1"]');
  assert.ok(cont, 'reply view exposes Continue');
  cont.click();

  assert.equal(doneFired, true, 'offer onDone chain ran');
  assert.equal(nt.sm.errands.deliver_route_ledger.state, 'active', 'errand accepted');
  assert.equal(nt.isNarrationLive(), false, 'stage clear afterwards');
});

// ── No premature release: the queue contract is intact ──────────────────────
test('a still-connected overlay keeps the lock; second request queues', () => {
  const ov1 = nt.renderNarrativeOverlay({ lines: ['first'], onDone: () => {} });
  assert.equal(nt.isNarrationLive(), true, 'live while connected');

  const ov2 = nt.renderNarrativeOverlay({ lines: ['second'], onDone: () => {} });
  assert.equal(ov2.parentNode, null, 'second overlay queues behind the live one');
  assert.equal(nt.narrationQueueDepth(), 1);
  assert.equal(nt.isNarrationLive(), true, 'probing liveness must not release a connected overlay');

  ov1.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(ov2.parentNode, document.body, 'queued overlay flushes on dismiss');
  ov2.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(nt.isNarrationLive(), false);
});

// ── Explicit teardown for navigation seams ──────────────────────────────────
test('narrationForceClear removes the live overlay and flushes the queue', () => {
  const ov1 = nt.renderNarrativeOverlay({ lines: ['live'], onDone: () => {} });
  const ov2 = nt.renderNarrativeOverlay({ lines: ['pending'], onDone: () => {} });
  assert.equal(nt.narrationQueueDepth(), 1);

  nt.narrationForceClear();
  assert.equal(ov1.parentNode, null, 'live overlay removed');
  assert.equal(ov2.parentNode, document.body, 'pending overlay mounts (its onDone chain survives)');
  assert.equal(nt.narrationQueueDepth(), 0);

  ov2.querySelector('button[data-narr-continue="1"]').click();
  assert.equal(nt.isNarrationLive(), false, 'stage fully clear');
});
