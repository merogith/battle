// Pre-merge DOM smoke for the collection screen (Phase 3.6 + regression guard).
// jsdom can't render pixels, but it CAN drive the real UI path: switch tabs via
// window.StoryMode.openCollection and confirm each tab body builds without throwing
// and produces non-trivial HTML. Verifies the new "Signatures" tab is wired end to
// end (button -> openCollection -> _renderCollectionBody -> _renderSignaturesTab).
// Run: node --test tests/suites/story-collection-dom.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const doc = eng.window.document;
const SM = eng.window.StoryMode;

test('collection screen exposes the Signatures tab button wired to openCollection', () => {
  const btn = doc.getElementById('collection-tab-sig');
  assert.ok(btn, 'collection-tab-sig button exists in the DOM');
  assert.match(btn.getAttribute('onclick') || '', /openCollection\('signatures'\)/, 'button calls openCollection(signatures)');
  assert.ok(SM && typeof SM.openCollection === 'function', 'StoryMode.openCollection is exposed');
});

test('every collection tab renders a non-empty body without throwing', () => {
  const body = doc.getElementById('collection-body');
  assert.ok(body, 'collection-body element exists');
  for (const tab of ['pokedex', 'achievements', 'hof', 'rival', 'signatures']) {
    assert.doesNotThrow(() => SM.openCollection(tab), `openCollection('${tab}') must not throw`);
    const html = body.innerHTML || '';
    assert.ok(html.length > 20, `${tab} tab produced HTML (${html.length} chars)`);
  }
});

test('Achievements tab renders the new Endgame Grind category', () => {
  SM.openCollection('achievements');
  const html = (doc.getElementById('collection-body').innerHTML) || '';
  assert.match(html, /Endgame Grind/, 'grind category section heading present');
  assert.match(html, /Replayability Trophies/, 'replay category still present');
});

test('collection a11y: tablist roving tabindex + live panel + pokedex strip live', () => {
  SM.openCollection('pokedex');
  const active = doc.getElementById('collection-tab-pokedex');
  const inactive = doc.getElementById('collection-tab-ach');
  assert.equal(active.getAttribute('tabindex'), '0', 'active tab is in the tab order');
  assert.equal(inactive.getAttribute('tabindex'), '-1', 'inactive tab is removed from the tab order');
  const body = doc.getElementById('collection-body');
  assert.equal(body.getAttribute('aria-live'), 'polite', 'panel announces tab content changes');
  assert.match(body.getAttribute('aria-label') || '', /pokedex/i, 'panel labels the active tab');
  // ISSUE-126: the Pokédex seen/caught strip in the PC screen is now a live region.
  const strip = doc.getElementById('story-pc-pokedex-strip');
  assert.ok(strip, 'pokedex strip exists');
  assert.equal(strip.getAttribute('aria-live'), 'polite', 'pokedex counts strip is aria-live');
});

test('keyboard nav cycles the collection tablist', () => {
  SM.openCollection('pokedex');
  assert.ok(typeof SM._collectionTabsKeydown === 'function', 'keydown handler exposed');
  SM._collectionTabsKeydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(doc.getElementById('collection-tab-ach').getAttribute('aria-selected'), 'true', 'ArrowRight moves to next tab');
  SM._collectionTabsKeydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(doc.getElementById('collection-tab-pokedex').getAttribute('aria-selected'), 'true', 'ArrowLeft moves back');
  SM._collectionTabsKeydown({ key: 'End', preventDefault() {} });
  assert.equal(doc.getElementById('collection-tab-memorial').getAttribute('aria-selected'), 'true', 'End jumps to last tab');
});

test('Signatures tab shows the registry summary + trainer blocks', () => {
  SM.openCollection('signatures');
  const html = (doc.getElementById('collection-body').innerHTML) || '';
  // Summary chips ("N/M trainers faced", "signatures encountered") + at least one
  // trainer block (sig-trainer) should be present even with an empty journal.
  assert.match(html, /trainers faced/i, 'summary chip present');
  assert.match(html, /signatures encountered/i, 'signature-count chip present');
  assert.match(html, /sig-trainer/, 'at least one trainer block rendered');
  // The active tab button is flagged selected.
  const btn = doc.getElementById('collection-tab-sig');
  assert.equal(btn.getAttribute('aria-selected'), 'true', 'Signatures tab marked active');
});
