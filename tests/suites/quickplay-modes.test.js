// Quick Play & Multiplayer re-exposure (2026-06): Quick Battle / Gauntlet /
// Local PvP / Online were hidden behind a "paused for development" panel. They
// are available in the Battles disclosure below Story Mode, with a
// Battle Options panel (team source, bot difficulty, party size,
// gens, grades, gimmick toggles) and an instant Quick Battle path.
// These tests lock in: (1) the modes share a discoverable entrance, (2) the gimmick toggles
// feed settings.mechanics, (3) startQuickBattle('random') builds a legal pve
// battle with no species overlap, and (4) the 'draft' option routes to the
// draft screen instead.
// Run: node --test tests/suites/quickplay-modes.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const D = W.document;

test('Battles groups distinct ways to play and keeps online and local play together', () => {
    const disclosure = D.getElementById('menu-more-play');
    const wrap = D.getElementById('menu-other-modes-wrap');
    assert.equal(disclosure.tagName, 'DETAILS');
    assert.match(disclosure.querySelector('summary').textContent, /^\s*Battles/);
    assert.equal(wrap.closest('details'), disclosure);
    assert.ok(disclosure.querySelector('#menu-customize-toggle'));
    for (const cls of ['--pve', '--gaunt', '--pvp', '--onlineh', '--onlinej']) {
        assert.ok(disclosure.querySelector('.menu-mode-btn' + cls), 'mode button ' + cls + ' present');
    }
    const friends = disclosure.querySelector('.home-friends');
    for (const cls of ['--pvp', '--onlineh', '--onlinej']) {
        assert.ok(friends.querySelector('.menu-mode-btn' + cls), 'friend mode ' + cls + ' present');
    }
    assert.ok(D.querySelector('.menu-lb-link'), 'leaderboard link row present');
    assert.ok(disclosure.querySelector('.menu-competitive-entry'), 'competitive link present');
});

test('Battle Options exposes the new toggles', () => {
    for (const id of ['quick-team-source', 'menu-ai-profile', 'mech-mega-cb',
        'mech-z-cb', 'mech-dyna-cb', 'mech-tera-cb', 'party-size-select']) {
        assert.ok(D.getElementById(id), 'control ' + id + ' present');
    }
});

test('gimmick toggles drive settings.mechanics via updateMechanics', () => {
    const mega = D.getElementById('mech-mega-cb');
    const tera = D.getElementById('mech-tera-cb');
    mega.checked = false; tera.checked = true;
    W.updateMechanics();
    assert.equal(eng.engine.settings.mechanics.mega, false, 'mega off applied');
    assert.equal(eng.engine.settings.mechanics.tera, true, 'tera on applied');
    // restore so later tests/files see defaults
    mega.checked = true; W.updateMechanics();
    assert.equal(eng.engine.settings.mechanics.mega, true, 'mega restored');
});

test('setMenuAiProfile keeps menu + settings selects in sync', () => {
    W.setMenuAiProfile('aggro');
    assert.equal(eng.engine.settings.aiProfile, 'aggro');
    const a = D.getElementById('setting-ai-profile');
    const b = D.getElementById('menu-ai-profile');
    if (a) assert.equal(a.value, 'aggro');
    if (b) assert.equal(b.value, 'aggro');
    W.setMenuAiProfile('balanced');
});

test('startQuickBattle("random") builds a legal pve battle, party size honoured, species clause', async () => {
    eng.engine.settings.quickTeamSource = 'random';
    eng.engine.settings.partySize = 3;
    await W.startQuickBattle();
    const s = eng.engine.state;
    assert.equal(s.mode, 'pve');
    assert.equal(s.playerParty.length, 3, 'player gets partySize mons');
    assert.equal(s.foeParty.length, 3, 'foe gets partySize mons');
    assert.ok(s.pActive && s.fActive, 'both actives set');
    const p = new Set(s.playerParty.map((m) => m.name));
    const f = new Set(s.foeParty.map((m) => m.name));
    for (const n of f) assert.equal(p.has(n), false, 'no species overlap: ' + n);
});

test('startQuickBattle respects a 1v1 party size (driven by the select)', async () => {
    eng.engine.settings.quickTeamSource = 'random';
    // party size's source of truth is the select (updateMechanics reads it),
    // so drive it the way a real player would.
    const sel = D.getElementById('party-size-select');
    sel.value = '1';
    await W.startQuickBattle();
    const s = eng.engine.state;
    assert.equal(s.playerParty.length, 1);
    assert.equal(s.foeParty.length, 1);
    sel.value = '3';
});

test('startQuickBattle("draft") routes to the draft screen, no auto teams', async () => {
    eng.engine.settings.quickTeamSource = 'draft';
    await W.startQuickBattle();
    const s = eng.engine.state;
    assert.equal(s.mode, 'pve');
    assert.equal(s.p1Draft.length, 0, 'draft not auto-filled');
    assert.equal(s.playerParty.length, 0, 'no party until drafted');
    const draftScreen = D.getElementById('screen-draft');
    assert.equal(draftScreen.classList.contains('hidden'), false, 'draft screen shown');
    eng.engine.settings.quickTeamSource = 'random';
});

test('Gauntlet waits on a draw, then restores the team without granting a win or swap', async () => {
    await W.startQuickBattle();
    const state = eng.engine.state;
    state.mode = 'gauntlet';
    state.score = 3;
    const roundParty = state.foeParty;
    state.playerParty.forEach(mon => { mon.currentHp = 0; });
    W.finishNativeBattle(null);
    const result = D.getElementById('modal-end-screen');
    const next = D.getElementById('btn-gauntlet-draw-continue');
    assert.ok(!result.classList.contains('hidden'));
    assert.match(D.getElementById('end-title').textContent, /Round 4 drawn/);
    assert.equal(D.activeElement, next);
    await new Promise(resolve => setTimeout(resolve, 2100));
    assert.equal(state.foeParty, roundParty, 'an unattended result never starts a round');
    await W.continueGauntletDraw();
    await W.continueGauntletDraw();
    assert.equal(state.score, 3);
    assert.equal(state.isOver, false);
    assert.ok(result.classList.contains('hidden'));
    assert.ok(D.getElementById('modal-gauntlet-swap').classList.contains('hidden'));
    assert.ok(state.playerParty.every(mon => mon.currentHp === mon.maxHp));
    assert.notEqual(state.foeParty, roundParty);
});

test('local multiplayer names the winner and offers the existing draft for another match', async () => {
    const state = eng.engine.state;
    state.mode = 'pvp';
    W.finishNativeBattle('p2');
    assert.equal(D.getElementById('end-title').textContent, 'Player 2 wins');
    const playAgain = D.getElementById('btn-play-again');
    assert.ok(!playAgain.classList.contains('hidden'));
    await W.playAgainFromEndScreen();
    assert.ok(!D.getElementById('screen-draft').classList.contains('hidden'));
    assert.equal(eng.engine.state.mode, 'pvp');
});
