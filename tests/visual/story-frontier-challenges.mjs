/* global state */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const fixture = new URL(base);
fixture.searchParams.set('testmega', '1');
const output = process.env.BATTLE_FRONTIER_OUT ? resolve(process.env.BATTLE_FRONTIER_OUT) : null;
if (output) await mkdir(output, { recursive: true });
const screenshots = [];
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const context = await browser.newContext({ viewport: { width: 320, height: 620 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const errors = [];
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.on('pageerror', error => errors.push(error.message));
const frontier = page.locator('#screen-story-frontier');
const confirm = page.locator('#modal-game-confirm');
const alert = page.locator('#modal-game-alert');
const battle = page.locator('#screen-battle[data-battle-engine="showdown"]');
const fight = battle.locator('#command-menu [data-cmd="fight"]');
const move = battle.locator('#move-menu .battle-btn-move:enabled').first();
const run = (...fields) => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, window.StoryMode.state[key]])), fields);
const record = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_meta')).frontierChallengeRecords || {});
let blockDex = false;

async function closeAlert() {
    if (await alert.isVisible()) await alert.getByRole('button').click();
}

async function assertDexRetry() {
    await alert.waitFor();
    assert.match(await alert.innerText(), /Pokédex data for new seed challenges did not load.*Reload the game/s);
    await closeAlert();
}

async function capture(name) {
    if (!output) return;
    const file = name + '.png';
    await page.screenshot({ path: join(output, file), animations: 'disabled' });
    screenshots.push({ file, viewport: page.viewportSize() });
}

async function reopen() {
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
    await page.locator('.menu-btn-quickplay--continue').click();
    const crucible = page.locator('#screen-story-crucible');
    await frontier.or(crucible).filter({ visible: true }).first().waitFor();
    await closeAlert();
    if (await crucible.isVisible()) await crucible.getByRole('button', { name: /Battle Frontier/ }).click();
    await frontier.waitFor();
    await closeAlert();
}

async function choose(name, expectedId) {
    await frontier.getByRole('button', { name: `Choose ${name}`, exact: true }).click();
    assert.match(await confirm.innerText(), new RegExp(`${expectedId}/v1`));
    await confirm.getByRole('button', { name: 'OK', exact: true }).click();
    await frontier.getByRole('button', { name: 'Begin Round 1', exact: true }).waitFor();
    return (await run('frontier')).frontier.challenge;
}

async function begin(name) {
    await frontier.getByRole('button', { name, exact: true }).click();
    await battle.waitFor();
    await fight.waitFor();
}

async function playTurn() {
    const startingTurn = await page.evaluate(() => state.turnNumber);
    await fight.click();
    await move.click();
    await page.waitForFunction(previous => state.turnNumber > previous || state.isOver, startingTurn, { timeout: 6500 });
    await page.waitForFunction(() => !state.isLocked || state.isOver);
    return await page.evaluate(() => ({
        player: state.playerParty.map(mon => [mon.name, mon.currentHp, mon.status]),
        foe: state.foeParty.map(mon => [mon.name, mon.currentHp, mon.status]),
        turn: state.turnNumber,
    }));
}

try {
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== base.origin || (blockDex && url.pathname.endsWith('/vendor/pkmn-dex.min.js'))) return route.abort();
        return route.continue();
    });
    await page.goto(fixture.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#screen-story-city').waitFor({ timeout: 25000 });
    await page.evaluate(() => {
        const story = window.StoryMode;
        const run = story.state;
        Object.assign(run, { atCrucible: true, postHofMysteryClimaxDone: true, badges: 8, inventory: { potion: 12 }, _strngState: 1234 });
        run.settings = { ...run.settings, enabledGens: [1], minGen: 1, maxGen: 1, megaOn: false, teraOn: false, zOn: false, dynaOn: false };
        run.team = run.team.filter(slot => slot.name === 'Charizard').slice(0, 1);
        story.upgrades.save();
    });
    await reopen();
    assert.equal(await frontier.getByRole('heading', { name: 'Seed challenges' }).count(), 1);
    assert.equal(await frontier.getByRole('button', { name: 'Begin Battle Frontier' }).count(), 1);
    const safeguards = ['gold', 'inventory', 'badges', 'pokedex', 'artifacts', '_strngState'];
    const baseline = await run(...safeguards);
    const quarry = await choose('Quarry Trials', 'frontier-quarry');
    assert.deepEqual(quarry.runGens, [1]);
    assert.ok(Object.entries(quarry.mechanics).every(([key, value]) => key === 'classicMode' ? value : !value));
    assert.equal(quarry.roster[0].name, 'Charizard');
    assert.ok(quarry.opponents.every(team => team.length === 1));
    await frontier.getByRole('button', { name: 'Review rules' }).click();
    assert.match(await alert.innerText(), /Gen 1.*Transformations off/s);
    assert.match(await alert.innerText(), /Locked party: Charizard/);
    await closeAlert();
    assert.equal(await frontier.locator('.frontier-seeds').evaluate(element => element.scrollWidth <= element.clientWidth + 2), true);
    await capture('locked-party-portrait');
    await begin('Begin Round 1');
    assert.ok(await page.evaluate(() => state.nativeRequests[0].forms.length === 0 && state.mode === 'frontier-challenge'));
    const beforeTurn = await page.evaluate(() => window.StoryMode.state._strngState);
    const turn = await playTurn();
    assert.equal(await page.evaluate(() => window.StoryMode.state._strngState), beforeTurn);
    await page.evaluate(() => {
        // Simulate outside party/settings changes without touching the saved challenge.
        const story = window.StoryMode;
        story.state.team = [];
        story.state.settings.teraOn = true;
        story.upgrades.save();
    });
    blockDex = true;
    await reopen();
    assert.equal(await page.evaluate(() => !!window.pkmn?.dex?.Dex), false);
    assert.equal((await run('team')).team.length, 0);
    assert.deepEqual((await run('frontier')).frontier.challenge.roster, quarry.roster);
    await begin('Resume Round 1');
    assert.deepEqual(await playTurn(), turn);
    await capture('native-turn-after-reload');
    for (let round = 1; round <= 3; round++) {
        if (round > 1) await begin(`Begin Round ${round}`);
        if (round === 3) {
            await page.evaluate(() => {
                const write = Storage.prototype.setItem;
                window.restoreFrontierTestStorage = () => { Storage.prototype.setItem = write; };
                Storage.prototype.setItem = function(key, value) {
                    if (key === 'pbs_story_save') throw new DOMException('Fixture storage limit', 'QuotaExceededError');
                    return write.call(this, key, value);
                };
            });
        }
        assert.equal(await page.evaluate(() => window.__devAutoWinBattle()), true);
        await frontier.waitFor();
        if (round === 3) {
            assert.equal((await record())['frontier-quarry/v1'].bestRound, 2);
            assert.equal((await run('frontier')).frontier.challenge.status, 'in-progress');
            await page.evaluate(() => window.StoryMode.finishFrontierChallenge(true));
            assert.equal((await record())['frontier-quarry/v1'].bestRound, 2);
            await page.evaluate(() => window.restoreFrontierTestStorage());
            await closeAlert();
            await closeAlert();
            await frontier.getByRole('button', { name: 'Save result' }).click();
        }
    }
    assert.match(await frontier.locator('.frontier-seed-current').innerText(), /Quarry crest earned/);
    assert.ok((await record())['frontier-quarry/v1'].bestRound === 3);
    assert.deepEqual(await run(...safeguards), baseline);
    assert.equal((await run('frontier')).frontier.currentStreak, 0);
    assert.deepEqual((await run('frontier')).frontier.highscores, []);
    await capture('quarry-stamp-portrait');
    await page.evaluate(quarry => {
        const story = window.StoryMode;
        story.state.team = quarry.roster.map(slot => ({ ...slot, id: 'frontier-charizard' }));
        story.state.settings.teraOn = false;
        story.upgrades.save();
        const meta = JSON.parse(localStorage.getItem('pbs_story_meta'));
        delete meta.frontierChallengeRecords;
        localStorage.setItem('pbs_story_meta', JSON.stringify(meta));
    }, quarry);
    await frontier.getByRole('button', { name: 'Choose Lakeside Circuit', exact: true }).click();
    await assertDexRetry();
    assert.equal((await run('frontier')).frontier.challenge.id, 'frontier-quarry');
    blockDex = false;
    await reopen();
    assert.equal((await record())['frontier-quarry/v1'].bestRound, 3, 'a committed final receipt repairs a delayed career write');

    await frontier.getByRole('button', { name: 'Choose Quarry Trials', exact: true }).click();
    const savedDex = await page.evaluateHandle(() => window.pkmn);
    await page.evaluate(() => { delete window.pkmn; });
    await confirm.getByRole('button', { name: 'OK', exact: true }).click();
    await assertDexRetry();
    assert.equal((await run('frontier')).frontier.challenge.status, 'cleared');
    await page.evaluate(dex => { window.pkmn = dex; }, savedDex);
    await savedDex.dispose();

    const repeated = await choose('Quarry Trials', 'frontier-quarry');
    assert.deepEqual(repeated.opponents, quarry.opponents);
    await frontier.getByRole('button', { name: 'End challenge' }).click();
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal((await run('frontier')).frontier.challenge.status, 'ready');
    await frontier.getByRole('button', { name: 'End challenge' }).click();
    await confirm.getByRole('button', { name: 'OK', exact: true }).click();
    await frontier.getByRole('button', { name: 'Choose Lakeside Circuit' }).waitFor();
    await page.setViewportSize({ width: 844, height: 390 });
    await choose('Lakeside Circuit', 'frontier-lakeside');
    await capture('lakeside-landscape');
    await begin('Begin Round 1');
    assert.equal(await page.evaluate(() => window.__devLoseBattle()), true);
    await frontier.waitFor();
    assert.equal((await run('frontier')).frontier.challenge.lastCommittedResult.outcome, 'loss');
    assert.equal((await record())['frontier-lakeside/v1'], undefined);
    await page.setViewportSize({ width: 1280, height: 900 });
    await choose('Plateau Three', 'frontier-plateau');
    await begin('Begin Round 1');
    const settings = battle.getByRole('button', { name: 'Settings', exact: true });
    const forfeit = page.getByRole('button', { name: 'Forfeit Seed Challenge', exact: true });
    await settings.click();
    await forfeit.click();
    assert.match(await confirm.innerText(), /ends the current seed challenge/);
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await battle.waitFor();
    await settings.click();
    await forfeit.click();
    await confirm.getByRole('button', { name: 'OK', exact: true }).click();
    await frontier.waitFor();
    assert.equal((await run('frontier')).frontier.challenge.lastCommittedResult.outcome, 'loss');
    await frontier.getByRole('button', { name: 'Begin Battle Frontier', exact: true }).click();
    assert.ok((await run('frontier')).frontier.active);
    assert.equal((await record())['frontier-quarry/v1'].bestRound, 3);
    await begin('Begin Round 1');
    await page.evaluate(() => {
        const write = Storage.prototype.setItem;
        window.restoreFrontierTestStorage = () => { Storage.prototype.setItem = write; };
        Storage.prototype.setItem = function(key, value) {
            if (key === 'pbs_story_save') throw new DOMException('Fixture storage limit', 'QuotaExceededError');
            return write.call(this, key, value);
        };
    });
    assert.equal(await page.evaluate(() => window.__devAutoWinBattle()), true);
    await frontier.getByRole('heading', { name: 'Round result ready' }).waitFor();
    assert.equal((await run('frontier')).frontier.currentStreak, 0);
    assert.equal(await frontier.getByRole('button', { name: 'Begin Round 2', exact: true }).count(), 0);
    await page.evaluate(() => window.restoreFrontierTestStorage());
    await closeAlert();
    await frontier.getByRole('button', { name: 'Save result' }).click();
    await frontier.getByRole('heading', { name: 'Round 1 cleared', exact: true }).waitFor();
    assert.equal((await run('frontier')).frontier.currentStreak, 1);
    assert.ok(await frontier.getByRole('button', { name: 'Begin Round 2', exact: true }).isVisible());
    await capture('ladder-round-cleared');
    await frontier.getByRole('button', { name: /Surrender/ }).click();
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal((await run('frontier')).frontier.currentStreak, 1);
    await frontier.getByRole('button', { name: /Surrender/ }).click();
    await confirm.getByRole('button', { name: 'OK', exact: true }).click();
    await frontier.getByRole('heading', { name: 'Streak banked' }).waitFor();
    assert.match(await frontier.getByRole('status').filter({ hasText: 'Streak banked' }).innerText(), /New personal best/);
    assert.equal((await run('frontier')).frontier.highscores[0].streak, 1);
    await page.evaluate(() => {
        const backup = window.GameUpgrades.makeBackup();
        backup.entries.pbs_story_meta.frontierChallengeRecords = {
            'frontier-quarry/v1': { bestRound: 2 },
            'frontier-lakeside/v1': { bestRound: 1 },
        };
        window.GameUpgrades.restoreBackup(backup);
    });
    await reopen();
    assert.equal((await record())['frontier-quarry/v1'].bestRound, 3);
    assert.equal((await record())['frontier-lakeside/v1'].bestRound, 1);

    const crucible = page.locator('#screen-story-crucible');
    await frontier.locator('.story-shop-back-btn').click();
    await closeAlert();
    const leagueIntro = page.locator('.story-vs-intro [data-vs2-battle]');
    async function enterLeagueMatch(name) {
        await crucible.getByRole('button', { name }).click();
        await leagueIntro.or(battle).filter({ visible: true }).first().waitFor();
        if (await leagueIntro.isVisible()) await leagueIntro.click();
        await battle.waitFor();
        await fight.waitFor();
    }
    await enterLeagueMatch(/League Run \(E1/);
    assert.equal(await page.evaluate(() => window.__devAutoWinBattle()), true);
    await crucible.getByRole('heading', { name: 'League Run · 1 of 5 cleared' }).waitFor();
    await capture('league-intermission');
    const leagueBreak = await run('crucibleLeagueRun', 'gold', 'inventory');
    const checkpoint = leagueBreak.crucibleLeagueRun;
    assert.equal(checkpoint.phase, 'break');
    assert.equal(checkpoint.currentStage, 1);
    assert.ok(await crucible.getByRole('button', { name: /Continue League Run · 2\/5/ }).isVisible());
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
    await page.locator('.menu-btn-quickplay--continue').click();
    await crucible.waitFor();
    assert.deepEqual(await run('crucibleLeagueRun', 'gold', 'inventory'), leagueBreak, 'opening the saved break preserves the round and costs nothing');
    await enterLeagueMatch(/Continue League Run · 2\/5/);
    const row = await page.evaluate(() => window.STORY_EVENTS_RAW[window.StoryMode.state.eventIndex][0]);
    assert.equal(row, checkpoint.nextRowId);
    assert.equal(await page.evaluate(() => window.__devLoseBattle()), true);
    await crucible.getByRole('heading', { name: 'League Run ended' }).waitFor();
    assert.equal((await run('crucibleLeagueRun')).crucibleLeagueRun, null);
    assert.deepEqual(errors, []);
    const summary = 'All seed cards, single-generation rules, native turn replay with a missing Dex resource, safe new-entry rejection, final-save retry, duplicate result guard, career repair, forfeit, backup merge, the ordinary ladder and League intermission recovery passed.';
    if (output) await writeFile(join(output, 'report.json'), JSON.stringify({
        status: 'passed', summary, screenshots,
        fixture: 'A late save opens the facility. Native turns use actual battle controls. Developer outcomes exercise result settlement without replaying the full fights.',
    }, null, 2) + '\n');
    console.log(summary);
} catch (error) {
    console.error(await page.evaluate(() => typeof state === 'undefined' ? null : ({
        mode: state.mode, turn: state.turnNumber, isLocked: state.isLocked,
        log: document.getElementById('battle-log').innerText,
        requestedActions: state.nativeRequests,
    })));
    throw error;
} finally {
    await browser.close();
}
