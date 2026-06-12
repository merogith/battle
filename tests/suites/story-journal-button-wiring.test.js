// Regression guard: the city "📓 Journal" action button (and every other city
// action chip wired to window.StoryMode.*) must resolve to a real function on
// the StoryMode export. The Journal button regressed because enterJournal() was
// only exposed on the test-only window.__storyTest object and window.enterJournal,
// never on window.StoryMode — so onclick="window.StoryMode.enterJournal()" threw
// "is not a function" and the button did nothing ("not clicking at all").
// Run: node --test tests/suites/story-journal-button-wiring.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const win = eng.window;
const doc = win.document;
const SM = win.StoryMode;

test('StoryMode.enterJournal is exposed and callable', () => {
  assert.equal(typeof SM.enterJournal, 'function', 'window.StoryMode.enterJournal must be a function');
  assert.doesNotThrow(() => SM.enterJournal(), 'enterJournal opens the journal overlay without throwing');
  assert.ok(doc.querySelector('.story-journal-overlay'), 'journal overlay appended to DOM');
});

test('every city-action button onclick that targets StoryMode.* resolves to a function', () => {
  // Render a city action strip (city row 1) and walk every button's onclick.
  win.__renderCityActionsForTest(1);
  const btns = [...doc.querySelectorAll('#story-action-buttons button')];
  assert.ok(btns.length > 0, 'city action strip rendered some buttons');

  // The Journal button must be present and wired to enterJournal.
  const journalBtn = btns.find(b => /Journal/.test(b.textContent || ''));
  assert.ok(journalBtn, 'Journal button present in the city action strip');
  assert.match(journalBtn.getAttribute('onclick') || '', /window\.StoryMode\.enterJournal\(\)/);

  // No enabled button may call window.StoryMode.<method>() where <method> is missing.
  const missing = [];
  for (const b of btns) {
    if (b.disabled) continue;
    const oc = b.getAttribute('onclick') || '';
    const re = /window\.StoryMode\.([A-Za-z0-9_$]+)\s*\(/g;
    let m;
    while ((m = re.exec(oc))) {
      const name = m[1];
      if (typeof SM[name] !== 'function') missing.push(`${name} (onclick: ${oc})`);
    }
  }
  assert.deepEqual(missing, [], 'all StoryMode.* targets on city buttons resolve to functions');
});
