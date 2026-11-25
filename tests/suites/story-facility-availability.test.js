import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { Dex } from '@pkmn/dex';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const engine = await loadEngine();
const w = engine.window;
const story = w.StoryMode;
const state = w.__storyTest;
const host = () => w.document.getElementById('story-tutor-team');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
after(() => engine.teardown());

function prime(city) {
    Object.assign(state.sm, {
        active: true, runSeed: 29, gold: 25000, badges: Math.max(0, city - 1),
        eventIndex: state.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === `City${city}`),
        settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        npcStageSeen: { tutor: 2, dojo: 3 }, facilityIntros: { tutor: true, dojo: true }, trainerAssignments: {},
        inventory: { heartScale: 1, emblemHonor: 1, abilityCapsule: 1 },
        hpChooseGranted: true, hiddenPowerChoosePending: false, hiddenPowerUnlocked: city >= 3,
        team: [{ id: 'trainer-ace', name: 'Garchomp',
            build: { m: ['Dragon Claw'], n: 'Jolly', a: 'Sand Veil', hpType: 'Ice' } }],
    });
}

async function waitFor(predicate, label) {
    for (let i = 0; i < 80; i++) {
        if (predicate()) return;
        await pause(25);
    }
    assert.fail(label);
}

test('the City 5 action opens the chosen partner, exact move and first free slot', async () => {
    prime(4);
    story.enterTutor('moves', { partnerId: 'trainer-ace', move: 'Earthquake' });
    await waitFor(() => host().querySelector('.tx-card[data-card-value="Earthquake"]'), 'the locked move renders');
    const locked = host().querySelector('.tx-card[data-card-value="Earthquake"]');
    assert.equal(locked.disabled, true);
    assert.match(locked.querySelector('.tx-pill--locked').textContent, /Glasswater City/);
    prime(5);
    state.sm.team.unshift({ id: 'starter', name: 'Pikachu', build: { m: ['Thunder Shock'] } });
    story.enterTutor('moves', { partnerId: 'trainer-ace', move: 'Earthquake' });
    await waitFor(() => host().querySelector('.tx-card[data-card-value="Earthquake"]'), 'Earthquake card renders');
    const card = host().querySelector('.tx-card[data-card-value="Earthquake"]');
    assert.equal(card.disabled, false);
    assert.equal(host().querySelector('.story-tutor-mon-toggle[aria-expanded="true"]').dataset.team, '1');
    assert.equal(host().querySelector('.tx-search-input').value, 'Earthquake');
    assert.equal(host().querySelector('.tx-slot-chip[aria-pressed="true"]').dataset.slotIdx, '1');
    assert.deepEqual([...state.sm.team[1].build.m], ['Dragon Claw'], 'the shortcut makes no purchase');
    story.enterTutor('moves');
    await waitFor(() => host().querySelector('.story-tutor-mon-toggle'), 'Tutor returns to normal entry');
    assert.equal(host().querySelector('.story-tutor-mon-toggle[aria-expanded="true"]'), null);
    assert.equal(host().querySelector('.tx-search-input'), null);
});

test('Guru rejects out-of-species moves on both payment paths', async () => {
    prime(7);
    const mon = state.sm.team[0];
    const learnable = await state.tutorGetStagedMovePoolAsync(mon.name, mon.build.m);
    assert.ok(learnable.includes('Iron Head'));
    assert.ok(!learnable.includes('Spore'));
    const oldConfirm = w.showGameConfirm;
    const oldAlert = w.showGameAlert;
    let confirmations = 0;
    w.showGameConfirm = async () => { confirmations++; return true; };
    w.showGameAlert = () => {};
    try {
        await story.tutorChangeMove(0, 1, 'Spore');
        await story.tutorChangeMoveWithVoucher(0, 1, 'Spore');
        assert.equal(confirmations, 0);
        assert.deepEqual([...mon.build.m], ['Dragon Claw']);
        assert.equal(state.sm.gold, 25000);
        assert.equal(state.sm.inventory.heartScale, 1);
        await story.tutorChangeMoveWithVoucher(0, 1, 'Iron Head');
        assert.deepEqual([...mon.build.m], ['Dragon Claw', 'Iron Head']);
        assert.equal(state.sm.inventory.heartScale, undefined);
    } finally {
        w.showGameConfirm = oldConfirm;
        w.showGameAlert = oldAlert;
    }
});

test('item and ability vouchers obey the same roster and belt gates as gold', async () => {
    prime(1);
    const oldConfirm = w.showGameConfirm;
    const oldAlert = w.showGameAlert;
    let confirmations = 0;
    w.showGameConfirm = async () => { confirmations++; return true; };
    w.showGameAlert = () => {};
    try {
        await story.tutorChangeItemWithVoucher(0, 'Leftovers');
        await story.tutorChangeAbilityWithVoucher(0, 'Rough Skin');
        assert.equal(confirmations, 0);
        assert.equal(state.sm.inventory.emblemHonor, 1);
        assert.equal(state.sm.inventory.abilityCapsule, 1);
        prime(8);
        await story.tutorChangeItem(0, 'Missing Item');
        await story.tutorChangeAbility(0, 'Missing Ability');
        await story.tutorChangeItemWithVoucher(0, 'Missing Item');
        await story.tutorChangeAbilityWithVoucher(0, 'Missing Ability');
        assert.equal(confirmations, 0);
        assert.equal(state.sm.gold, 25000);
        await story.tutorChangeItemWithVoucher(0, 'Leftovers');
        await story.tutorChangeAbilityWithVoucher(0, 'Rough Skin');
        assert.equal(confirmations, 2);
        assert.equal(state.sm.team[0].build.i, 'Leftovers');
        assert.equal(state.sm.team[0].build.a, 'Rough Skin');
        assert.equal(state.sm.inventory.emblemHonor, undefined);
        assert.equal(state.sm.inventory.abilityCapsule, undefined);
    } finally {
        w.showGameConfirm = oldConfirm;
        w.showGameAlert = oldAlert;
    }
});

test('the Dojo unlocks abilities for the exact regional form', async () => {
    prime(4);
    state.sm.team[0].name = 'Samurott-Hisui';
    state.sm.team[0].build.a = 'Torrent';
    const oldPkmn = w.pkmn;
    w.pkmn = { ...oldPkmn, dex: { Dex } };
    try {
        story.enterTutor('loadout', { partnerId: 'trainer-ace', dojoTab: 'ability' });
        const shellArmor = host().querySelector('.tx-card[data-card-value="Shell Armor"]');
        const sharpness = host().querySelector('.tx-card[data-card-value="Sharpness"]');
        assert.ok(shellArmor, 'form-derived choice appears as a campaign option');
        assert.ok(sharpness, 'the exact form retains its own hidden ability');
        assert.equal(shellArmor.dataset.tier, 'awaken');
        assert.equal(shellArmor.disabled, true);
        assert.match(shellArmor.textContent, /Grandmaster/);
        assert.equal(sharpness.dataset.tier, 'hidden');
        assert.equal(sharpness.disabled, false);
    } finally {
        w.pkmn = oldPkmn;
    }
});

test('Dojo item search finds options outside the recommendation list and keeps category filters', async () => {
    prime(7);
    story.enterTutor('loadout');
    await openTutorMon(w);
    const recommended = host().querySelector('[data-filter-kind="recOnly"][data-filter-value="items"]');
    assert.equal(recommended.dataset.active, '1');
    const search = q => {
        const input = host().querySelector('.tx-search-input[data-kind="items"]');
        input.value = q;
        input.dispatchEvent(new w.Event('input', { bubbles: true }));
    };
    const kingsRock = () => host().querySelector(`.tx-card[data-card-value="King's Rock"]`);
    assert.equal(kingsRock(), null, 'precondition: omitted by recommendations');
    search('Kings Rock');
    await waitFor(() => kingsRock(), 'search finds the full pool and ignores punctuation');
    assert.equal(host().querySelector('.tx-count-pill').textContent, '1 item');
    host().querySelector('.tx-chip[data-filter-kind="itemCat"][data-filter-value="defensive"]').click();
    assert.equal(kingsRock(), null);
    assert.equal(host().querySelector('.tx-count-pill').textContent, '0 items');
    host().querySelector('[data-clear-filters="items"]').click();
    assert.equal(host().querySelector('.tx-search-input').value, '');
    assert.equal(host().querySelector('[data-filter-kind="recOnly"][data-filter-value="items"]').dataset.active, '1');
    assert.equal(kingsRock(), null);
});

test('a move type filter follows the chosen Hidden Power element', async () => {
    prime(7);
    story.enterTutor('moves', { partnerId: 'trainer-ace', move: 'Hidden Power' });
    const card = () => host().querySelector('.tx-card[data-card-value="Hidden Power"]');
    await waitFor(card, 'Hidden Power renders');
    assert.equal(card().querySelector('.type-badge').textContent.trim(), 'Ice');
    host().querySelector('[data-typemenu-toggle]').click();
    const type = value => host().querySelector(`.tx-typemenu-row [data-filter-value="${value}"]`);
    await waitFor(() => type('Ice'), 'Ice filter is available');
    type('Ice').click();
    assert.equal(card().hidden, false);
    type('Ice').click();
    type('Normal').click();
    assert.equal(card().hidden, true);
});
