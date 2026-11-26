import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { loadEngine } from '../helpers/load-engine.js';

const engine = await loadEngine();
const { window } = engine;
const story = window.__storyTest;
const rows = story.STORY_EVENTS_RAW;
const leaderIndex = number => rows.findIndex(row => row[2] === `Gym Leader ${number}`);
const leaderId = number => rows[leaderIndex(number)][0];

after(() => engine.teardown());

function setup({ badges = 1, trainerAssignments = {} } = {}) {
    story.sm = { ...story.sm, active: true, runSeed: 23, badges, trainerAssignments, gold: 5000,
        eventIndex: leaderIndex(badges) + 1, team: [], pcBox: [], inventory: {}, scenesShown: {} };
    window.__victoryInputArmMs = 0;
}

function notebook() {
    const container = window.document.createElement('div');
    container.innerHTML = story.journalRenderHTML();
    return container.querySelector('.story-badge-case');
}

function reward(gymNumber, trainerName) {
    const options = { result: { id: 'fixture', trainerName } };
    story.showVictoryOverlay('VICTORY!', 500, true, () => {}, `Gym Leader ${gymNumber}`, leaderId(gymNumber), [], options);
    return window.document.querySelector('[data-story-result-id="fixture"]');
}

test('a visiting Water leader awards the same named emblem on the victory card and in the Notebook', () => {
    setup({ trainerAssignments: { [leaderId(1)]: 'Misty', [leaderId(2)]: 'Brock' } });
    // A previous trainer may be in memory just after a resume. The saved result owns the badge.
    story.sm.currentTrainerData = { name: 'Brock' };
    const card = reward(1, 'Misty');
    const emblem = card.querySelector('.gym-badge-art');
    assert.equal(emblem.dataset.gymType, 'Water');
    assert.ok(emblem.querySelector('path'), 'the Water medal uses the drop silhouette in Gym 1');
    assert.equal(card.querySelector('.story-victory-badge-name').textContent, 'Cascade Badge');
    assert.match(card.querySelector('.story-victory-v2-milestone').textContent, /Misty · Water/);

    const list = notebook();
    assert.equal(list.children.length, 8);
    assert.equal(list.getAttribute('aria-label'), '1 of 8 gym badges earned');
    assert.equal(list.children[0].querySelector('.gym-badge-art').outerHTML, emblem.outerHTML);
    assert.match(list.children[0].textContent, /Cascade Badge.*Misty · Water/);
    assert.match(list.children[1].textContent, /Badge 2.*Locked/);
    assert.doesNotMatch(list.textContent, /Brock|Boulder Badge/, 'locked slots preserve the next badge reveal');
    assert.equal(list.children[1].querySelector('svg').style.opacity, '0.55');
    card.querySelector('.story-victory-v2-continue').click();
});

test('the town, both Gym lobby rounds and the earned badge agree on the leader’s primary type', () => {
    const gym = 5;
    const index = leaderIndex(gym);
    assert.notEqual(leaderId(3), leaderIndex(3), 'Gym 3 exercises the row-ID lookup');
    setup({ badges: gym, trainerAssignments: { [leaderId(3)]: 'Misty', [leaderId(gym)]: 'Iono' } });
    assert.equal(story.preferredTypeBeforeGymBattle(leaderIndex(3) - 1), 'Water');
    const visitor = story.gymVisitor(gym);
    assert.equal(visitor.name, 'Iono');
    assert.equal(visitor.type, 'Electric');
    const lobby = [index - 2, index - 1];
    assert.deepEqual(lobby.map(i => rows[i][2]), ['Gym Trainer 1', 'Gym Trainer 2']);
    assert.deepEqual(lobby.map(i => story.preferredTypeBeforeGymBattle(i)), ['Electric', 'Electric']);
    assert.equal(story.preferredTypeBeforeGymBattle(index), null);
    assert.match(notebook().children[gym - 1].textContent, /Electric Badge.*Iono · Electric/);
});

test('every leader in the run pool has named badge art in their gym type', () => {
    for (const { name, type, role } of story.getTrainerData()) {
        if (!/^Gym Leader [1-8]$/.test(role)) continue;
        setup({ trainerAssignments: { [leaderId(1)]: name } });
        const [cell] = notebook().children;
        const label = cell.querySelector('span:not(.gym-badge-art)').textContent;
        assert.match(label, /^.+ Badge$/, name);
        assert.notEqual(label, 'Gym Badge', name);
        assert.equal(cell.querySelector('.gym-badge-art').dataset.gymType, type.split('/')[0], name);
    }
});

test('older saves without a trainer assignment keep their earned badge count and a neutral emblem', () => {
    setup({ badges: 2 });
    const list = notebook();
    assert.equal(list.querySelectorAll('.is-earned').length, 2);
    assert.equal(list.children[0].textContent, 'Badge 1');
    assert.equal(list.children[0].querySelector('.gym-badge-art').hasAttribute('data-gym-type'), false);
});

test('a legacy or invalid upcoming assignment resolves the same leader for town, lobby and battle', () => {
    const gym = 5;
    const index = leaderIndex(gym);
    const id = leaderId(gym);
    const event = rows[index][2];
    for (const trainerAssignments of [{ [id]: 'Hiker' }, {}]) {
        setup({ badges: gym - 1, trainerAssignments });
        const visitor = story.gymVisitor(gym);
        assert.ok(visitor?.name && visitor?.type);
        assert.equal(story.preferredTypeBeforeGymBattle(index - 2), visitor.type);
        assert.equal(story.preferredTypeBeforeGymBattle(index - 1), visitor.type);
        const trainer = story.scheduledStoryTrainer(event, id, [1, 9]);
        assert.equal(trainer.name, visitor.name);
        assert.equal(trainer.type.split('/')[0], visitor.type);
        assert.equal(story.scheduledStoryTrainer(event, id, [1, 9]).name, trainer.name);
    }
});
