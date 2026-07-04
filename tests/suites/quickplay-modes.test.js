// Quick Play & Multiplayer re-exposure (2026-06): Quick Battle / Gauntlet /
// Local PvP / Online were hidden behind a "paused for development" panel. They
// are now a permanent, always-visible mode grid under the headline Story Mode
// button, with a Battle Options sheet (team source, bot difficulty, party size,
// gens, grades, gimmick toggles) and an instant Quick Battle path.
// These tests lock in: (1) the modes are not hidden, (2) the gimmick toggles
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

test('the mode grid is visible (not behind the old paused panel)', () => {
    const wrap = D.getElementById('menu-other-modes-wrap');
    assert.ok(wrap, 'mode wrap exists');
    assert.equal(wrap.hasAttribute('hidden'), false, 'mode wrap is not hidden');
    // All five play modes are reachable as tiles; the leaderboard was demoted
    // to a link row (UX 2026-07 — it's a lookup, not a play mode).
    for (const cls of ['--pve', '--gaunt', '--pvp', '--onlineh', '--onlinej']) {
        assert.ok(D.querySelector('.menu-mode-btn' + cls), 'mode button ' + cls + ' present');
    }
    assert.ok(D.querySelector('.menu-lb-link'), 'leaderboard link row present');
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
