// Regression for the P2 bug: pcRelease() lacked the `unsellable` guard that pcSell()
// has, so a bonded mon (boss-arc / gift partner, unsellable:true) sitting in the PC
// could be permanently RELEASED even though it can't be sold. Fixed by mirroring
// pcSell's guard — pcRelease now returns before the confirm for unsellable slots.
// Run: node --test tests/suites/story-pc-release-guard.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

test('pcRelease blocks a bonded mon before the confirm, but reaches it for a normal mon', async () => {
  const prevSm = ST.sm;
  const prevConfirm = eng.window.showGameConfirm;
  let confirmReached = false;
  eng.window.showGameConfirm = async () => { confirmReached = true; return false; };
  try {
    // Bonded (unsellable) PC mon — guard must return before showGameConfirm.
    ST.sm = {
      active: true,
      team: [{ name: 'Starter', id: 1 }],
      pcBox: [{ name: 'Mewtwo', id: 'bound1', unsellable: true, build: {} }],
      balls: { poke: 0, great: 0, ultra: 0, master: 0 },
    };
    confirmReached = false;
    await eng.window.StoryMode.pcRelease('bound1');
    assert.equal(confirmReached, false, 'bonded mon: guard returns before the confirm');
    assert.equal(ST.sm.pcBox.length, 1, 'bonded mon still in the PC');
    assert.equal(ST.sm.pcBox[0].id, 'bound1', 'the same bonded mon remains');

    // Normal PC mon — guard must NOT block; flow reaches the confirm (declined here).
    ST.sm = {
      active: true,
      team: [{ name: 'Starter', id: 1 }],
      pcBox: [{ name: 'Rattata', id: 'normal1', build: {} }],
      balls: { poke: 0, great: 0, ultra: 0, master: 0 },
    };
    confirmReached = false;
    await eng.window.StoryMode.pcRelease('normal1');
    assert.equal(confirmReached, true, 'normal mon: guard does not block; confirm is reached');
  } finally {
    eng.window.showGameConfirm = prevConfirm;
    ST.sm = prevSm;
  }
});
