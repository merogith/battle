import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

function button(window, label) {
  const action = [...window.document.querySelectorAll('#move-menu button')]
    .find(element => !element.disabled && element.textContent.includes(label));
  assert.ok(action, `Expected a usable ${label} button`);
  return action;
}

test('hotseat Fight submits both players’ forced actions through the normal turn queue', async () => {
  const { window, engine, mkMon, reset, logs } = await loadEngine();
  for (const forced of ['Struggle', 'Recharge', 'Use Outrage']) {
    reset();
    const first = mkMon({ species: 'Blissey', moves: ['Seismic Toss'] });
    const second = mkMon({ species: 'Dragonite', moves: ['Outrage'] });
    first.stats.spe = 500;
    first.stats.def = 500;
    if (forced === 'Struggle') second.moves.forEach(move => { move.pp = 0; });
    if (forced === 'Recharge') second.volatile.recharge = true;
    if (forced === 'Use Outrage') {
      second.volatile.lockMove = 'Outrage';
      second.volatile.lockTurns = 2;
      second.moves[0].pp = 0;
    }
    Object.assign(engine.state, {
      mode: 'pvp', playerParty: [first], foeParty: [second], pActive: first, fActive: second,
    });
    const startingPp = second.moves.map(move => move.pp);
    const logStart = logs.length;
    window.showMoves();
    assert.ok(button(window, 'Seismic Toss'));
    await window.playTurn(0, null);
    assert.equal(engine.state.currentPlayer, 2);
    window.showMoves();
    await button(window, forced).onclick();
    assert.equal(engine.state.turnNumber, 1, forced);
    assert.equal(engine.state.currentPlayer, 1, forced);
    const turnLog = logs.slice(logStart).map(entry => entry.text).join('\n');
    assert.match(turnLog, /Blissey used Seismic Toss/, forced);
    assert.match(turnLog, forced === 'Recharge' ? /Dragonite must recharge/ : new RegExp(`Dragonite used ${forced.replace('Use ', '')}`));
    assert.deepEqual(second.moves.map(move => move.pp), startingPp, forced);
    if (forced === 'Struggle') assert.match(turnLog, /recoil/);
    if (forced === 'Recharge') assert.equal(second.volatile.recharge, false);
  }
});

test('a scheduled recharge clears before other move blockers and needs no transmitted move object', async () => {
  const { window, engine, mkMon, reset, logs } = await loadEngine();
  reset();
  const first = mkMon({ species: 'Slaking', ability: 'Truant', item: 'Choice Band', moves: ['Giga Impact'] });
  const second = mkMon({ species: 'Sableye', ability: 'Prankster', moves: ['Taunt'] });
  first.buildData.gimmick = 'DYNAMAX';
  Object.assign(first.volatile, { recharge: true, truanting: true, choiceLock: 'Giga Impact', taunt: 2 });
  Object.assign(engine.state, {
    mode: 'pvp', playerParty: [first], foeParty: [second], pActive: first, fActive: second,
    p1Action: { moveIndex: null, switchIndex: null }, p2Action: { moveIndex: 0, switchIndex: null },
    p1GimmickIntent: { kind: 'DYNAMAX', slot: 0 },
  });
  const startingPp = first.moves[0].pp;
  const logStart = logs.length;
  await window.__runLockedPvPTurnResolution();
  assert.equal(first.volatile.recharge, false);
  assert.equal(first.volatile.truanting, false);
  assert.equal(first.moves[0].pp, startingPp);
  assert.ok(!first.dynamaxed);
  assert.ok(!engine.state.usedDyna);
  assert.match(logs.slice(logStart).map(entry => entry.text).join('\n'), /Slaking must recharge/);
});

test('Dynamax preserves the HP fraction and ends on a voluntary Party switch', async () => {
  const { window, engine, mkMon, reset } = await loadEngine();
  reset();
  const lead = mkMon({ species: 'Snorlax', moves: ['Splash'] });
  const bench = mkMon({ species: 'Pikachu', moves: ['Splash'] });
  const foe = mkMon({ species: 'Blissey', moves: ['Splash'] });
  lead.buildData.gimmick = 'DYNAMAX';
  lead.currentHp = 41;
  const originalMax = lead.maxHp;
  Object.assign(engine.state, {
    mode: 'pvp', playerParty: [lead, bench], foeParty: [foe], pActive: lead, fActive: foe,
    p1GimmickIntent: { kind: 'DYNAMAX', slot: 0 },
  });
  await window.playTurn(0, null);
  await window.playTurn(0, null);
  assert.equal(lead.dynamaxed, true);
  assert.equal(lead.maxHp, originalMax * 2);
  assert.equal(lead.currentHp, 82);

  lead.currentHp--;
  window.openParty(false);
  const card = [...window.document.querySelectorAll('#modal-party .party-slot')]
    .find(element => element.textContent.includes('Pikachu'));
  const replacement = card?.querySelector('.party-actions button:last-child');
  assert.ok(replacement);
  assert.equal(replacement.disabled, false);
  await window.selectPartyMember(1, false);
  assert.equal(engine.state.currentPlayer, 2);
  await window.playTurn(0, null);
  assert.equal(engine.state.pActive, bench);
  assert.equal(lead.dynamaxed, false);
  assert.equal(lead.maxHp, originalMax);
  assert.equal(lead.currentHp, 41);
  assert.equal(engine.state.usedDyna, true);
});

test('first-action attacks stay selectable and spend PP when they fail later', async () => {
  const { window, engine, mkMon, reset, logs } = await loadEngine();
  reset();
  const lead = mkMon({ species: 'Hitmontop', moves: ['Fake Out', 'First Impression', 'Splash'] });
  const foe = mkMon({ species: 'Blissey', moves: ['Splash'] });
  Object.assign(engine.state, { playerParty: [lead], foeParty: [foe], pActive: lead, fActive: foe });
  await window.playTurn(2, null);
  const start = logs.length;
  const initialHp = foe.currentHp;
  for (const name of ['Fake Out', 'First Impression']) {
    window.showMoves();
    const move = lead.moves.find(candidate => candidate.name === name);
    const initialPp = move.pp;
    button(window, name).click();
    for (let i = 0; i < 100 && engine.state.isLocked; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(engine.state.isLocked, false);
    assert.equal(move.pp, initialPp - 1);
    assert.equal(foe.currentHp, initialHp);
    assert.match(logs.slice(start).map(entry => entry.text).join('\n'), new RegExp(`${name} failed`));
  }
});

test('Dynamax still requires base PP and Assault Vest blocks Substitute and Max Guard', async () => {
  const { window, engine, mkMon, reset } = await loadEngine();
  reset();
  const lead = mkMon({ species: 'Snorlax', item: 'Assault Vest', moves: ['Body Slam', 'Substitute', 'Tackle', 'Earthquake'] });
  const foe = mkMon({ species: 'Blissey', moves: ['Splash'] });
  lead.moves[0].pp = 0;
  Object.assign(engine.state, { playerParty: [lead], foeParty: [foe], pActive: lead, fActive: foe });
  window.showMoves();
  const tiles = () => [...window.document.querySelectorAll('#move-menu .battle-btn-move')];
  assert.match(tiles()[1].getAttribute('aria-label'), /unavailable: Assault Vest/);
  lead.dynamaxed = true;
  window.showMoves();
  assert.match(tiles()[0].getAttribute('aria-label'), /PP 0\/.*unavailable: No PP/);
  assert.match(tiles()[1].getAttribute('aria-label'), /Max Guard.*unavailable: Assault Vest/);
  assert.equal(tiles()[2].disabled, false);
});
