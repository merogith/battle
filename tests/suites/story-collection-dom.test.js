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
