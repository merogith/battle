import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const game = await loadEngine();
const { window, engine } = game;
const { document } = window;

after(() => game.teardown());

test('the first rival tutorial gives an immediate action and a fallback', () => {
    let continued = 0;
    assert.equal(window.StoryMode.playTutorial('firstTrainerBattle', () => { continued++; }), true);
    const tutorial = document.querySelector('.story-tutorial-overlay');
    const lines = tutorial.querySelectorAll('.story-dialog-text');
    assert.equal(lines.length, 2);
    assert.match(lines[0].textContent, /Fight.*move’s info/);
    assert.match(lines[1].textContent, /▲.*hits harder.*▼.*less damage.*⊘.*immune/);
    assert.match(lines[1].textContent, /abilities and moves change the matchup/);
    tutorial.querySelector('.story-tutorial-continue').click();
    assert.equal(continued, 1);
    assert.equal(document.querySelector('.story-tutorial-overlay'), null);
});

test('Fight labels matchup markers as basic type chart information', () => {
    game.reset();
    const player = game.mkMon({ species: 'Mew', moves: ['Thunderbolt', 'Flamethrower', 'Earthquake', 'Protect'] });
    const foe = game.mkMon({ species: 'Charizard' });
    Object.assign(engine.state, { mode: 'story', pActive: player, fActive: foe, playerParty: [player], foeParty: [foe] });

    document.querySelector('#command-menu [data-cmd="fight"]').click();
    const [strong, resisted, immune, status] = document.querySelectorAll('#move-menu .battle-btn-move');
    for (const [button, icon, label, matchup] of [
        [strong, '▲', 'Super eff.', 'super effective'],
        [resisted, '▼', 'Resisted', 'resisted'],
        [immune, '⊘', 'Immune', 'immune'],
    ]) {
        const marker = button.querySelector('.move-tile-matchup');
        assert.equal(marker.querySelector('[aria-hidden="true"]').textContent, icon);
        assert.equal(marker.querySelector('.move-tile-matchup-label').textContent, label);
        assert.equal(marker.title, `Basic type chart: ${matchup}`);
        assert.ok(button.getAttribute('aria-label').includes(`basic type chart: ${matchup}`));
    }
    assert.equal(status.querySelector('.move-tile-matchup'), null);
    assert.doesNotMatch(status.getAttribute('aria-label'), /basic type chart/i);

    player.moves[0] = game.mkMon({ species: 'Mew', moves: ['Tackle'] }).moves[0];
    window.showMoves();
    const neutral = document.querySelector('#move-menu .battle-btn-move');
    assert.equal(neutral.querySelector('.move-tile-matchup'), null);
    assert.match(neutral.getAttribute('aria-label'), /basic type chart: neutral/);
});

test('a variable-power move has the same basic immunity marker as other attacks', () => {
    game.reset();
    const player = game.mkMon({ species: 'Mew', moves: ['Electro Ball'] });
    const foe = game.mkMon({ species: 'Sandile' });
    Object.assign(engine.state, { mode: 'story', pActive: player, fActive: foe, playerParty: [player], foeParty: [foe] });
    window.showMoves();
    const attack = document.querySelector('#move-menu .battle-btn-move');
    const info = document.querySelector('#move-menu .move-info-hit');
    assert.equal(attack.querySelector('.move-tile-matchup [aria-hidden="true"]').textContent, '⊘');
    assert.equal(attack.querySelector('.move-tile-matchup-label').textContent, 'Immune');
    assert.equal(info.parentElement, attack.parentElement);
    assert.equal(attack.contains(info), false);
    const pp = player.moves[0].pp;
    info.click();
    assert.match(document.querySelector('#move-tooltip').textContent, /Basic type chart: immune/);
    document.querySelector('#move-tooltip .move-tip-close').click();
    assert.equal(player.moves[0].pp, pp);
    assert.equal(document.querySelector('#move-menu').classList.contains('hidden'), false);
});
