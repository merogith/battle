/* global settings, state */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

// Exercise the real Arena UI and native simulator with two isolated players.
// The in-memory transport stands in for the existing Supabase RPC contract.
const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Use a loopback dev server');
const endpoint = new URL('./online-room-mock', url).href;
const pivot = process.env.BATTLE_TEST_ROOM_PIVOT === '1';
const reconnect = process.env.BATTLE_TEST_ROOM_RECONNECT === '1';
const series = process.env.BATTLE_TEST_ROOM_SERIES === '1';
const hostPivot = pivot && process.env.BATTLE_TEST_ROOM_PIVOT_ROLE === 'host';
const swapDevices = process.env.BATTLE_TEST_ROOM_SWAP_DEVICES === '1';
const expireReplacement = process.env.BATTLE_TEST_ROOM_REPLACEMENT_TIMEOUT === '1';
const parallelDraft = process.env.BATTLE_TEST_ROOM_PARALLEL_DRAFT === '1';
const expireDraft = process.env.BATTLE_TEST_ROOM_DRAFT_TIMEOUT === '1';
const recoverDraft = process.env.BATTLE_TEST_ROOM_DRAFT_RECOVERY === '1';
const hostRules = process.env.BATTLE_TEST_ROOM_HOST_RULES === '1';
const setupTimeout = process.env.BATTLE_TEST_ROOM_SETUP_TIMEOUT === '1';
const departure = process.env.BATTLE_TEST_ROOM_DEPARTURE || '';
const latencyMs = Number(process.env.BATTLE_TEST_ROOM_LATENCY_MS || 0);
const out = process.env.BATTLE_TEST_ROOM_SHOTS;
assert.ok([pivot, reconnect, series].filter(Boolean).length <= 1, 'Choose a single room fixture');
assert.ok(!expireReplacement || pivot, 'The expiration fixture requires a replacement request');
assert.ok(!parallelDraft || pivot, 'The parallel fixture requires the fixed two-member draft pools');
assert.ok(!expireDraft || parallelDraft, 'The draft expiration fixture follows the parallel opening picks');
assert.ok(!recoverDraft || (pivot && !parallelDraft), 'The recovery fixture requires a sequenced two-member draft');
assert.ok(!hostRules || (!pivot && !reconnect), 'Opposed room rules use a normal or best-of-three draft');
assert.ok(Number.isFinite(latencyMs) && latencyMs >= 0 && latencyMs <= 1000);
assert.ok(!departure || /^(host|guest)-(run|settings|back|draft|replacement|series|rejected|reconnect)$/.test(departure) || departure === 'host-waiting');
if (out) await mkdir(out, { recursive: true });
const partySize = hostRules && !series ? 6 : pivot ? 2 : 1;
const timed = pivot || reconnect;
let room;
let draftFixtureRound = 0;
const publishedTurns = [];
let rejectNextGuestDraft = false;
let blockGuestReads = false;
let rejectDeparture = departure.endsWith('-rejected');
let departureWrites = 0;
let heldRoomRequest;

function holdRoomRequest(name) {
  const hold = { name, entered: false };
  hold.wait = new Promise(resolve => { hold.release = resolve; });
  heldRoomRequest = hold;
  return hold;
}

const entry = (name, a, m) => ({ name, build: { a, m, n: 'Hardy', i: 'No Item' } });

function patchRoom(patch) {
  room.data = { ...room.data, ...patch, seq: room.data.seq + 1 };
}

function execute(request) {
  if (request.kind === 'read') {
    const field = request.column;
    return { data: room?.[field] === request.value ? room : null };
  }
  const { args, name } = request;
  if (name === 'try_create_pvp_room') {
    room = { id: 'local-room', code: args.p_code, data: args.p_data };
    return { data: { ok: true, id: room.id, host_token: 'local-host-token' } };
  }
  if (name === 'try_join_pvp_room') {
    if (room?.id !== args.p_room_id || room.data.guest_joined) return { data: { ok: false } };
    patchRoom({ guest_joined: true, guest_display_name: args.p_guest_name });
    return { data: { ok: true, data: room.data, guest_token: 'local-guest-token' } };
  }
  if (name === 'pvp_push_data') {
    if (room?.id !== args.p_room_id || !['local-host-token', 'local-guest-token'].includes(args.p_token)) {
      return { data: { ok: false } };
    }
    const patch = args.p_patch;
    if (patch.p1_departure || patch.p2_departure) {
      departureWrites++;
      if (rejectDeparture) {
        rejectDeparture = false;
        return { data: { ok: false, error: 'mock_departure_rejected' } };
      }
    }
    if ((pivot || reconnect || series || hostRules) && patch.phase === 'draft' && patch.p1_pool && draftFixtureRound !== room.data.round_number) {
      const bulky = [entry('Snorlax', 'Immunity', ['Tackle', 'Amnesia'])];
      if (pivot) bulky.push(entry('Lapras', 'Water Absorb', ['Water Gun']));
      const other = reconnect ? [entry('Chansey', 'Natural Cure', ['Tackle', 'Growl'])]
        : [entry('Scizor', 'Swarm', ['U-turn', 'Protect']), entry('Chansey', 'Natural Cure', ['Tackle'])];
      if (series) {
        patch.p1_pool = [entry('Garchomp', 'Rough Skin', ['Earthquake'])];
        patch.p2_pool = [entry('Magnemite', 'Magnet Pull', ['Thunder Shock'])];
      } else if (hostRules) {
        // Keep the real rule-filtered pools and choose two legal, bulky leads so
        // the settings fixture reaches a full turn without a random first-turn KO or pivot.
        const { p1_pool: p1, p2_pool: p2 } = args.p_patch;
        const guestLead = entry('Lapras', 'Water Absorb', ['Water Gun']);
        patch.p1_pool = [...bulky, ...p1.filter(member => member.name !== bulky[0].name)];
        patch.p2_pool = [guestLead, ...p2.filter(member => member.name !== guestLead.name)];
      } else [patch.p1_pool, patch.p2_pool] = hostPivot ? [other, bulky] : [bulky, other];
      draftFixtureRound = room.data.round_number;
    }
    if (patch.battle?.resolved_turn) publishedTurns.push(patch.battle.resolved_turn);
    patchRoom(patch);
    return { data: { ok: true, data: room.data } };
  }
  return { data: { ok: false, error: 'unrecognized_mock_rpc' } };
}

function installTransport(endpoint) {
  const invoke = payload => fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) }).then(result => result.json());
  let transport;
  window.__roomTransport = {
    drop: () => transport.pause(),
    subscribeAgain: () => transport.status('SUBSCRIBED'),
    catchUp: row => transport.deliver(row),
    restore: () => transport.resume(),
  };
  function from() {
    let column, value;
    const read = () => invoke({ kind: 'read', column, value });
    return {
      select() { return this; },
      eq(key, expected) { column = key; value = expected; return this; },
      maybeSingle: read,
      single: read,
    };
  }
  window.supabase = { createClient: () => ({
    from,
    rpc: (name, args) => invoke({ kind: 'rpc', name, args }),
    channel(name) {
      let listener;
      let timer;
      let paused = false;
      return {
        on(_event, _filter, callback) { listener = callback; return this; },
        subscribe(callback) {
          let seen = 0;
          let reading = false;
          transport = {
            pause() { paused = true; callback('CHANNEL_ERROR'); },
            status: callback,
            resume() { paused = false; },
            deliver(row) { listener({ new: row }); },
          };
          timer = setInterval(async () => {
            if (reading || paused) return;
            reading = true;
            try {
              const { data } = await from().eq('id', name.slice('room-'.length)).single();
              if (!paused && data?.data?.seq > seen) {
                seen = data.data.seq;
                listener({ new: data });
              }
            } finally {
              reading = false;
            }
          }, 60);
          callback('SUBSCRIBED');
          return this;
        },
        stop() { clearInterval(timer); },
      };
    },
    removeChannel(channel) { channel.stop(); },
  }) };
}

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const failures = [];
const fight = page => page.locator('#command-menu [data-cmd="fight"]');
const mode = (page, label) => page.locator('.home-friends').getByRole('button', { name: label });

async function markMotion(peer) {
  await peer.evaluate(() => {
    const probe = { received: [], played: [], skipOnNextCue: false, skipped: 0, handledSeq: 0 };
    window.__roomProbe = probe;
    const apply = window.onOnlineRoomData;
    window.onOnlineRoomData = async (row, ...args) => {
      await apply(row, ...args);
      probe.handledSeq = row.seq;
    };
    const present = window.presentOnlineBattleMotion;
    window.presentOnlineBattleMotion = (cues, round, revision) => {
      probe.received.push({ round, revision, cues });
      return present(cues, round, revision);
    };
    const create = window.BattleMotion.createRun;
    window.BattleMotion.createRun = (screen, options) => {
      const run = create(screen, options);
      const play = run.play;
      run.play = (profile, cue) => {
        probe.played.push({ revision: state._onlineNativeRevision - 1, move: profile.id, outcome: cue.outcome });
        const result = play(profile, cue);
        if (probe.skipOnNextCue && run.usable()) {
          probe.skipOnNextCue = false;
          const select = document.getElementById('setting-battle-speed');
          select.value = 'instant';
          select.dispatchEvent(new Event('change', { bubbles: true }));
          if (!run.usable()) probe.skipped++;
        }
        return result;
      };
      return run;
    };
  });
}

const diagnostics = page => page.evaluate(() => window.__roomProbe);

async function waitForRoom(predicate) {
  const deadline = Date.now() + 8000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'the expected room update was not published');
    await new Promise(resolve => setTimeout(resolve, 35));
  }
}

async function openPlayer(options, side) {
  const context = await browser.newContext({ ...options, serviceWorkers: 'block' });
  await context.addInitScript(installTransport, endpoint);
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.fallback() : route.abort());
  await context.route(endpoint, async route => {
    if (latencyMs) await new Promise(resolve => setTimeout(resolve, latencyMs));
    const request = route.request().postDataJSON();
    if (heldRoomRequest && request.name === heldRoomRequest.name) {
      const hold = heldRoomRequest;
      heldRoomRequest = null;
      hold.entered = true;
      await hold.wait;
    }
    if (side === 'guest') {
      if (blockGuestReads && request.kind === 'read') {
        return route.fulfill({ json: { data: null, error: { message: 'Mock head read unavailable' } } });
      }
      if (rejectNextGuestDraft && request.name === 'pvp_push_data' && request.args.p_patch.p2_draft) {
        rejectNextGuestDraft = false;
        return route.fulfill({ json: { data: { ok: false, error: 'mock_draft_rejected' } } });
      }
    }
    await route.fulfill({ json: execute(request) });
  });
  await context.route(new URL('./online-config.js', url).href, route => route.fulfill({
    contentType: 'text/javascript',
    body: 'window.__PBS_SUPABASE_URL = location.origin; window.__PBS_SUPABASE_ANON_KEY = "local-room-test-publishable-key";',
  }));
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first().click();
  const settings = page.locator('#modal-settings');
  await settings.getByRole('combobox', { name: 'Battle speed', exact: true }).selectOption(reconnect ? 'normal' : 'instant');
  if (reconnect || (hostRules && side === 'guest')) await page.locator('#sw-animations').check();
  else await page.locator('#sw-animations').uncheck();
  await settings.getByRole('button', { name: 'Close settings' }).click();
  if (await page.locator('#menu-more-play').getAttribute('open') === null) {
    await page.locator('#menu-more-play-summary').click();
  }
  await page.locator('.home-friends > summary').click();
  return page;
}

async function selectRoomRulePreferences(page, host) {
  await page.locator('#menu-customize-toggle').click();
  await page.getByRole('radio', { name: /Custom/ }).click();
  await page.locator('#party-size-select').selectOption(String(host ? partySize : 3));
  const generations = host ? [1, 4] : [9];
  for (let gen = 1; gen <= 9; gen++) {
    await page.locator(`#draft-gen-cb-${gen}`).setChecked(generations.includes(gen));
  }
  for (const rule of ['mech-mega-cb', 'mech-dyna-cb', 'mech-tera-cb', 'mech-classic-cb']) {
    await page.locator(`#${rule}`).setChecked(!host);
  }
  for (const rule of ['mech-z-cb', 'mech-weather-cb', 'mech-terrain-cb']) {
    await page.locator(`#${rule}`).setChecked(host);
  }
  await page.locator('#menu-customize-toggle').click();
}

const roomPrefs = (page, fromStorage = false) => page.evaluate(fromStorage => {
  const prefs = fromStorage ? JSON.parse(localStorage.getItem('pbs_settings')) : settings;
  const { partySize, mechanics, randomWeather, randomTerrain, classicMode, draftGens, animations } = prefs;
  return { partySize, mechanics, randomWeather, randomTerrain, classicMode, draftGens, animations };
}, fromStorage);

async function assertPendingRoomForm(page, form, hold) {
  const id = await form.getAttribute('id');
  await page.waitForFunction(id => document.getElementById(id)?.querySelector('[data-room-cancel]')?.disabled, id, { timeout: 30000 });
  await waitForRoom(() => hold.entered);
  assert.equal(await form.getAttribute('aria-busy'), 'true');
  await page.keyboard.press('Escape');
  assert.ok(await form.isVisible(), 'Escape keeps a pending room request on its form');
}

roomPlaythrough: try {
  const desktop = { viewport: { width: 1366, height: 900 } };
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const host = await openPlayer(swapDevices ? phone : desktop);
  const guest = await openPlayer(swapDevices ? desktop : phone, 'guest');
  const hostPress = locator => swapDevices ? locator.tap() : locator.click();
  const guestPress = locator => swapDevices ? locator.click() : locator.tap();
  const leavingGuest = departure.startsWith('guest-');
  const leaving = leavingGuest ? guest : host;
  const remaining = leavingGuest ? host : guest;
  const leavePress = leavingGuest ? guestPress : hostPress;
  const leaveCase = departure.split('-')[1];
  async function verifyDeparture(where = leaveCase) {
    const confirm = leaving.locator('#modal-game-confirm');
    const quit = async () => {
      if (where === 'series') {
        await leavePress(leaving.locator('#modal-end-screen').getByRole('button', { name: 'Return to Main Menu' }));
        return;
      }
      if (where === 'back') await leaving.evaluate(() => history.back());
      else if (where === 'settings' || where === 'draft' || where === 'replacement') {
        if (where === 'replacement') {
          await leavePress(leaving.locator('#modal-party').getByRole('button', { name: 'Forfeit match', exact: true }));
        } else {
          await leavePress(leaving.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first());
          await leavePress(leaving.locator('#settings-exit-btn'));
        }
      } else await leavePress(leaving.locator('#command-menu [data-cmd="run"]'));
      await leavePress(confirm.getByRole('button', { name: 'OK', exact: true }));
    };
    const roomSeq = room.data.seq;
    const resolved = room.data.battle.resolved_turn;
    const oldScores = [room.data.p1_wins, room.data.p2_wins];
    if (where === 'reconnect') await remaining.evaluate(() => window.__roomTransport.drop());
    if (where === 'rejected') {
      await quit();
      await leaving.getByText('Could not leave the room. Check your connection and try again.').waitFor();
      assert.equal(room.data.seq, roomSeq);
      assert.equal(room.data.phase, 'battle');
      assert.ok(await remaining.locator('#modal-end-screen').isHidden());
      await leavePress(leaving.locator('#modal-game-alert button').last());
    }
    await quit();
    const player = leavingGuest ? 2 : 1;
    const winner = 3 - player;
    await waitForRoom(() => room.data[`p${player}_departure`]);
    if (where === 'reconnect') {
      assert.ok(await remaining.locator('#modal-end-screen').isHidden());
      await remaining.evaluate(() => {
        window.__roomTransport.restore();
        window.__roomTransport.subscribeAgain();
      });
    }
    const result = remaining.locator('#modal-end-screen');
    await result.getByRole('heading', { name: where === 'draft' ? 'Room closed' : 'You win by forfeit' }).waitFor();
    assert.ok(await result.evaluate(el => el.contains(document.activeElement)));
    assert.equal(room.data.phase, 'done');
    assert.equal(room.data.battle.resolved_turn, resolved, 'departure never resolves an extra simulator turn');
    assert.equal(room.data.battle_turn_deadline_iso, null);
    assert.equal(room.data.draft_deadline_iso, null);
    if (!['draft', 'series'].includes(where)) oldScores[winner - 1]++;
    assert.deepEqual([room.data.p1_wins, room.data.p2_wins], oldScores);
    assert.equal(await remaining.evaluate(() => window.OnlineBattle.myTurn(state)), false);
    assert.ok(await result.locator('#btn-online-rematch').isHidden());
    assert.ok(await result.locator('#online-rematch-waiting').isHidden());
    if (['settings', 'back', 'draft', 'series', 'replacement'].includes(where)) await leaving.locator('#screen-menu').waitFor();
    else await leaving.getByRole('heading', { name: 'Match forfeited' }).waitFor();
    assert.equal(departureWrites, where === 'rejected' ? 2 : 1);
    assert.deepEqual(failures, []);
    console.log(`Online ${departure}: matching terminal room receipt, scores, focus, turn lock and exit confirmed.`);
  }
  const screenshot = (peer, key) => out ? peer.screenshot({ path: join(out, key + '.png') }) : Promise.resolve();
  if (hostRules) await Promise.all([selectRoomRulePreferences(host, true), selectRoomRulePreferences(guest, false)]);
  else {
    await host.locator('#menu-customize-toggle').click();
    await host.getByRole('radio', { name: /Custom/ }).click();
    await host.locator('#party-size-select').selectOption(String(partySize));
    await host.locator('#menu-customize-toggle').click();
  }
  const hostPrefs = hostRules ? await roomPrefs(host) : null;
  const guestPrefs = hostRules ? await roomPrefs(guest) : null;
  const savedGuestPrefs = hostRules ? await roomPrefs(guest, true) : null;
  const assertHostRules = async () => {
    assert.equal(hostPrefs.partySize, partySize);
    assert.equal(guestPrefs.partySize, 3);
    assert.notDeepEqual(guestPrefs.mechanics, hostPrefs.mechanics);
    assert.deepEqual(guestPrefs.draftGens, [9]);
    assert.deepEqual(await guest.evaluate(() => state.enabledGens), [1, 4]);
    assert.deepEqual(await roomPrefs(guest), { ...hostPrefs, draftGens: guestPrefs.draftGens, animations: guestPrefs.animations });
    assert.equal(await guest.locator('#party-size-select').inputValue(), '3', 'the guest’s hidden local options are preserved');
  };
  await mode(host, /Host online/i).click();
  const hostForm = host.locator('#modal-online-host');
  if (timed) await hostForm.getByLabel('Time limit').selectOption('fast');
  if (series) {
    await hostForm.getByLabel('Match format').selectOption('3');
    await hostForm.getByLabel('Display name').fill('Test Host');
  }
  const create = hostForm.getByRole('button', { name: 'Create room', exact: true });
  if (setupTimeout) {
    await host.evaluate(() => {
      const load = window.OnlineBattle.ensureSdk;
      window.OnlineBattle.ensureSdk = () => {
        window.OnlineBattle.ensureSdk = load;
        return new Promise(resolve => { window.releaseRoomPreparation = resolve; });
      };
    });
    await create.click();
    await host.waitForFunction(() => typeof window.releaseRoomPreparation === 'function');
    await hostForm.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.ok(await hostForm.isHidden(), 'preparation can be cancelled before any room request');
    await mode(host, /Host online/i).click();
    await host.evaluate(() => window.releaseRoomPreparation(true));
    await host.waitForFunction(() => document.getElementById('online-host-create').disabled === false);
    assert.equal(await hostForm.getAttribute('aria-busy'), null);
    assert.equal(room, undefined);

    const noReply = holdRoomRequest('try_create_pvp_room');
    await create.click();
    await assertPendingRoomForm(host, hostForm, noReply);
    await hostForm.getByRole('status').getByText(/room request timed out/i).waitFor({ timeout: 17000 });
    assert.equal(await create.isEnabled(), true);
    assert.equal(await hostForm.getByRole('button', { name: 'Cancel', exact: true }).isEnabled(), true);
    noReply.release();
    await waitForRoom(() => Boolean(room));
    assert.equal(await host.evaluate(() => window.OnlineBattle.isActive()), false, 'late room reply cannot claim a timed out request');
    await host.keyboard.press('Escape');
    assert.ok(await hostForm.isHidden(), 'Escape is available once the room request finishes');
    await mode(host, /Host online/i).click();
  }
  const hostReply = holdRoomRequest('try_create_pvp_room');
  await create.click();
  await assertPendingRoomForm(host, hostForm, hostReply);
  await host.evaluate(() => history.back());
  await host.waitForFunction(() => history.state?.pbs === 'modal-pop');
  assert.ok(await hostForm.isVisible(), 'browser Back stays in the form while a room can be created');
  hostReply.release();
  await host.locator('#screen-draft').waitFor({ state: 'visible', timeout: 30000 });
  assert.ok(room?.code);

  if (leaveCase === 'waiting') {
    await hostPress(host.getByRole('button', { name: 'Close room' }));
    await hostPress(host.locator('#modal-game-confirm').getByRole('button', { name: 'OK', exact: true }));
    await host.locator('#screen-menu').waitFor();
    await guestPress(mode(guest, /Join online/i));
    const join = guest.locator('#modal-online-pvp');
    await join.getByLabel('Room code').fill(room.code);
    await guestPress(join.getByRole('button', { name: 'Join', exact: true }));
    await join.getByText('This room has closed. Ask for a new code.').waitFor();
    assert.equal(room.data.guest_joined, false);
    assert.equal(room.data.phase, 'done');
    assert.equal(departureWrites, 1);
    assert.deepEqual(failures, []);
    console.log('Online host-waiting: cancelling the invitation rejected late joins with the old code.');
    break roomPlaythrough;
  }

  await guestPress(mode(guest, /Join online/i));
  const form = guest.locator('#modal-online-pvp');
  await form.getByLabel('Room code').fill(room.code);
  const guestReply = holdRoomRequest('try_join_pvp_room');
  await guestPress(form.getByRole('button', { name: 'Join', exact: true }));
  await assertPendingRoomForm(guest, form, guestReply);
  guestReply.release();
  await guest.locator('#screen-draft').waitFor({ state: 'visible' });
  await host.waitForFunction(() => window.OnlineBattle.canUseNativeBattle());
  if (leaveCase === 'draft') {
    await verifyDeparture();
    break roomPlaythrough;
  }
  if (hostRules) {
    await assertHostRules();
    if (partySize === 1) assert.ok(await guest.locator('#draft-party-bar').isHidden());
    else assert.equal(await guest.locator('#draft-pick-progress').textContent(), `(0/${partySize})`);
    await guestPress(guest.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first());
    const guestSettings = guest.locator('#modal-settings');
    await guestSettings.getByRole('combobox', { name: 'Battle speed', exact: true }).selectOption('fast');
    assert.deepEqual(await roomPrefs(guest, true), savedGuestPrefs, 'a settings save during the match preserves local rule preferences');
    await guestSettings.getByRole('combobox', { name: 'Battle speed', exact: true }).selectOption('instant');
    await guestPress(guestSettings.getByRole('button', { name: 'Close settings' }));
    await screenshot(guest, 'guest-host-rules');
  }
  const draftChoice = (page, name) => {
    const cards = page.locator('#draft-grid .draft-card img');
    return name ? page.locator('#draft-grid .draft-card').getByRole('img', { name, exact: true }) : cards.first();
  };
  const pick = (page, name) => draftChoice(page, name).click();
  const hostDraft = hostPivot ? ['Scizor', 'Chansey'] : ['Snorlax', 'Lapras'];
  const guestDraft = hostPivot ? ['Snorlax', 'Lapras'] : ['Scizor', 'Chansey'];
  const waitForDraft = (page, player, size) => page.waitForFunction(([player, size]) =>
    state[`p${player}Draft`].length === size, [player, size]);
  if (hostRules && !series) {
    for (let size = 1; size <= partySize; size++) {
      await Promise.all([pick(host), pick(guest)]);
      await Promise.all([waitForDraft(host, 1, size), waitForDraft(guest, 2, size)]);
    }
    assert.equal(room.data.p1_draft.length, 6);
    assert.equal(room.data.p2_draft.length, 6);
  } else if (parallelDraft) {
    await Promise.all([pick(host, hostDraft[0]), pick(guest, guestDraft[0])]);
    await waitForRoom(() => room.data.p1_draft.length === 1 && room.data.p2_draft.length === 1);
    await Promise.all([waitForDraft(host, 1, 1), waitForDraft(guest, 2, 1)]);
    assert.deepEqual(room.data.p1_draft.map(mon => mon.name), hostDraft.slice(0, 1));
    assert.deepEqual(room.data.p2_draft.map(mon => mon.name), guestDraft.slice(0, 1));
    await Promise.all([screenshot(host, 'host-parallel-draft'), screenshot(guest, 'guest-parallel-draft')]);
    await guestPress(guest.getByRole('button', { name: `Remove ${guestDraft[0]} from team` }));
    await waitForDraft(guest, 2, 0);
    assert.deepEqual(room.data.p1_draft.map(mon => mon.name), hostDraft.slice(0, 1));
    assert.deepEqual(room.data.p2_draft, []);
    await pick(guest, guestDraft[0]);
    await waitForDraft(guest, 2, 1);
    if (expireDraft) {
      const deadlineBeforePick = room.data.draft_deadline_iso;
      await pick(host, hostDraft[1]);
      await waitForRoom(() => room.data.p1_draft.length === 2 && room.data.draft_deadline_iso !== deadlineBeforePick);
      patchRoom({ draft_deadline_iso: new Date(Date.now() + 1200).toISOString() });
    } else await Promise.all([pick(host, hostDraft[1]), pick(guest, guestDraft[1])]);
    await waitForRoom(() => room.data.p1_draft.length >= 2 && room.data.p2_draft.length >= 2);
    assert.deepEqual(room.data.p1_draft.map(mon => mon.name), hostDraft);
    assert.deepEqual(room.data.p2_draft.map(mon => mon.name), guestDraft);
  } else {
    await pick(host, pivot || reconnect ? hostDraft[0] : null);
    if (pivot) {
      await waitForDraft(host, 1, 1);
      await pick(host, hostDraft[1]);
    }
    await waitForDraft(guest, 1, partySize);
    if (recoverDraft) {
      const choice = draftChoice(guest, guestDraft[0]);
      await guest.evaluate(() => window.__roomTransport.drop());
      await choice.evaluate(img => { img.dataset.retryFixture = 'same-card'; });
      rejectNextGuestDraft = true;
      blockGuestReads = true;
      await guestPress(choice);
      await guest.locator('#toast-host').getByText('Your draft change could not be saved. Try again.').waitFor();
      assert.equal(await choice.getAttribute('data-retry-fixture'), 'same-card');
      assert.deepEqual(room.data.p2_draft, []);
      await screenshot(guest, 'guest-draft-rejected');
      await guestPress(choice);
      await waitForDraft(guest, 2, 1);
      assert.deepEqual(room.data.p2_draft.map(row => row.name), guestDraft.slice(0, 1));
      assert.equal(await guest.evaluate(() => window.OnlineBattle.isDraftWritePending()), false);
      await screenshot(guest, 'guest-draft-recovered');
      blockGuestReads = false;
      await guest.evaluate(() => {
        window.__roomTransport.subscribeAgain();
        window.__roomTransport.restore();
      });
    } else await pick(guest, pivot ? guestDraft[0] : reconnect ? 'Chansey' : null);
    if (pivot) {
      await waitForDraft(guest, 2, 1);
      await pick(guest, guestDraft[1]);
    }
  }

  for (const peer of [host, guest]) {
    await peer.waitForFunction(() => state.battleEngine === 'showdown' && state._onlineNativeRevision === 1 && !state.isLocked);
    await fight(peer).waitFor();
  }
  assert.equal(room.data.battle.engine, 'showdown');
  if (hostRules) {
    await assertHostRules();
    assert.equal(await guest.locator('#screen-battle').getAttribute('data-party-size'), String(partySize));
  }
  assert.equal(await host.evaluate(() => window.OnlineBattle.myTurn(state)), true);
  assert.equal(await guest.evaluate(() => window.OnlineBattle.myTurn(state)), false);
  if (pivot) {
    const expectedLeads = hostPivot ? ['Scizor', 'Snorlax'] : ['Snorlax', 'Scizor'];
    for (const peer of [host, guest]) {
      const leads = await peer.evaluate(() => [state.pActive.name, state.fActive.name]);
      assert.deepEqual(leads, expectedLeads, 'both trainers lead with their first draft pick');
    }
  }
  const move = (peer, name) => {
    const choices = peer.locator('#move-menu .battle-btn-move:enabled');
    const press = peer === host ? hostPress : guestPress;
    return press(name ? choices.filter({ hasText: name }) : choices.first());
  };
  if (reconnect) await Promise.all([markMotion(host), markMotion(guest)]);
  if (out) await Promise.all([screenshot(host, 'host-opening'), screenshot(guest, 'guest-opening')]);
  await hostPress(fight(host));
  await move(host, hostPivot ? 'U-turn' : pivot ? 'Tackle' : reconnect ? 'Amnesia' : null);
  await guest.waitForFunction(() => window.OnlineBattle.myTurn(state));
  if (departure && !['series', 'replacement'].includes(leaveCase)) {
    await verifyDeparture();
    break roomPlaythrough;
  }
  if (reconnect) {
    await host.waitForFunction(() => !window.OnlineBattle.myTurn(state));
    await guest.evaluate(() => window.__roomTransport.drop());
  }
  await guestPress(fight(guest));
  await move(guest, hostPivot ? 'Tackle' : pivot ? 'U-turn' : reconnect ? 'Growl' : null);

  if (series) {
    const rematch = host.getByRole('button', { name: /Start Round 2/ });
    const verifyRound = async round => {
      await waitForRoom(() => room.data.phase === 'done' && room.data.p1_wins === round);
      assert.equal(room.data.p2_wins, 0);
      for (const peer of [host, guest]) {
        await peer.locator('#modal-end-screen').waitFor();
        await peer.waitForFunction(score => document.querySelector('#online-p1-wins').textContent === String(score), round);
        assert.equal(await peer.evaluate(() => state.battleEngine), 'showdown');
      }
      await Promise.all([screenshot(host, `host-round-${round}`), screenshot(guest, `guest-round-${round}`)]);
    };
    await verifyRound(1);
    if (leaveCase === 'series') {
      await verifyDeparture();
      break roomPlaythrough;
    }
    await rematch.waitFor();
    assert.ok(await guest.locator('#online-rematch-waiting').isVisible());
    assert.ok(await guest.locator('#btn-online-rematch').isHidden());
    // Catch up from the stable draft row without seeing the transient rematch row.
    await guest.evaluate(() => window.__roomTransport.drop());
    await hostPress(rematch);
    await waitForRoom(() => room.data.phase === 'draft' && room.data.round_number === 2);
    await guest.evaluate(() => {
      window.__roomTransport.subscribeAgain();
      window.__roomTransport.restore();
    });
    for (const peer of [host, guest]) await peer.locator('#screen-draft').waitFor();
    if (hostRules) await assertHostRules();
    await pick(host, 'Garchomp');
    await waitForDraft(guest, 1, 1);
    await pick(guest, 'Magnemite');
    for (const peer of [host, guest]) {
      await peer.waitForFunction(() => state._onlineNativeRound === 2 && state._onlineNativeRevision === 1);
    }
    await hostPress(fight(host));
    await move(host, 'Earthquake');
    await guest.waitForFunction(() => window.OnlineBattle.myTurn(state));
    await guestPress(fight(guest));
    await move(guest, 'Thunder Shock');
    await verifyRound(2);
    for (const peer of [host, guest]) {
      assert.equal(await peer.locator('#online-match-result').textContent(), 'Test Host wins the match!');
      assert.ok(await peer.locator('#btn-online-rematch').isHidden());
    }
    assert.deepEqual(publishedTurns, [1, 1], 'each round resolves and scores exactly once');
  }

  if (pivot) {
    const actor = hostPivot ? host : guest;
    const opponent = hostPivot ? guest : host;
    const party = actor.locator('#modal-party');
    const replace = party.getByRole('button', { name: 'Switch', exact: true }).filter({ visible: true }).last();
    await replace.waitFor();
    await opponent.waitForFunction(() => state._onlineNativeRevision === 2 && !window.OnlineBattle.myTurn(state));
    assert.ok(await opponent.locator('#modal-party').isHidden(), 'only the actor can choose a replacement');
    assert.equal(await actor.evaluate(() => window.OnlineBattle.myTurn(state)), true);
    const deadline = room.data.battle_turn_deadline_iso;
    assert.ok(Date.parse(deadline) > Date.now() + 24_000, 'a replacement starts with a fresh Fast timer');
    for (const player of [actor, opponent]) {
      await player.waitForFunction(value => window.__onlineBattleDeadlineIso === value, deadline);
    }
    if (leaveCase === 'replacement') {
      await verifyDeparture();
      break roomPlaythrough;
    }
    await Promise.all([screenshot(actor, 'replacement-actor'), screenshot(opponent, 'replacement-waiting')]);
    if (expireReplacement) {
      // Move the shared deadline closer for this deterministic mock fixture.
      // The application still runs its ordinary timer and timeout path.
      patchRoom({ battle_turn_deadline_iso: new Date(Date.now() + 1200).toISOString() });
    } else {
      await (hostPivot ? hostPress(replace) : guestPress(replace));
    }
  }

  if (reconnect) {
    await waitForRoom(() => room.data.battle.resolved_turn === 1);
    const firstRevision = structuredClone(room);
    assert.ok(firstRevision.data.battle_turn_deadline_iso, 'the next-turn timer is published even while guest realtime is dropped');
    assert.equal(await guest.evaluate(() => state._onlineNativeRevision), 1);
    assert.equal((await diagnostics(guest)).received.length, 0);
    await guestPress(guest.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first());
    const settings = guest.locator('#modal-settings');
    await settings.getByRole('combobox', { name: 'Battle speed', exact: true }).waitFor();
    await guest.evaluate(() => {
      window.__roomProbe.skipOnNextCue = true;
      window.__roomTransport.subscribeAgain();
    });
    await guest.waitForFunction(() => state._onlineNativeRevision === 2 && window.__roomProbe.skipped === 1);
    assert.equal(await settings.getByRole('combobox', { name: 'Battle speed', exact: true }).inputValue(), 'instant');
    await guestPress(settings.getByRole('button', { name: 'Close settings' }));
    await fight(guest).waitFor();
    assert.equal((await diagnostics(guest)).played.length, 1, 'skip stops the rest of the caught-up turn’s motion');
    const beforeRetry = (await diagnostics(guest)).received;
    patchRoom({}); // same committed battle revision delivered under a later room sequence
    const duplicate = structuredClone(room);
    await guest.evaluate(([oldRow, duplicateRow]) => {
      window.__roomTransport.catchUp(oldRow);
      window.__roomTransport.catchUp(duplicateRow);
    }, [firstRevision, duplicate]);
    await guest.waitForFunction(seq => window.__roomProbe.handledSeq === seq, duplicate.data.seq);
    assert.deepEqual((await diagnostics(guest)).received, beforeRetry, 'replayed or republished rows cannot reissue a cue');
    assert.equal(room.data.battle_turn_deadline_iso, firstRevision.data.battle_turn_deadline_iso, 'skipping animation does not change the live timer');
    await guest.evaluate(() => window.__roomTransport.restore());

    await host.waitForFunction(() => window.OnlineBattle.myTurn(state));
    assert.equal(await guest.evaluate(() => window.OnlineBattle.myTurn(state)), false, 'guest waits for the host choice on the new request');
    await hostPress(fight(host));
    await move(host, 'Tackle');
    await guest.waitForFunction(() => window.OnlineBattle.myTurn(state), undefined, { timeout: 8000 });
    await guestPress(fight(guest));
    await move(guest, 'Tackle');
    await waitForRoom(() => room.data.battle.resolved_turn === 2);
    await guest.waitForFunction(() => state._onlineNativeRevision === 3 && window.__roomProbe.received.length === 2);
    assert.equal((await diagnostics(guest)).played.length, 1, 'Instant mode leaves the next legal request uninterrupted');
    await host.waitForFunction(() => window.__roomProbe.received.length === 2);
    const hostCues = (await diagnostics(host)).received;
    assert.deepEqual(hostCues.map(entry => entry.revision), [1, 2]);
    assert.deepEqual((await diagnostics(guest)).received, hostCues, 'each peer sees exactly the same public cues');
  }

  const revision = pivot || reconnect ? 3 : 2;
  for (const peer of [host, guest]) {
    await peer.waitForFunction(revision => state._onlineNativeRevision === revision && state.turnNumber >= 1, revision);
  }
  const getBoard = peer => peer.evaluate(() => [state.turnNumber, state.pActive.currentHp, state.fActive.currentHp, state.isOver, state.pActive.name, state.fActive.name]);
  assert.deepEqual(await getBoard(host), await getBoard(guest));
  assert.equal(room.data.battle.resolved_turn, revision - 1);
  assert.ok(room.data.battle.presentation.length > 0 && room.data.battle.presentation.length <= 3);
  for (const cue of room.data.battle.presentation) {
    assert.deepEqual(Object.keys(cue).sort(), ['from', 'move', 'outcome', 'to']);
    assert.ok(['p1', 'p2'].includes(cue.from) && ['p1', 'p2'].includes(cue.to));
  }
  if (pivot) {
    assert.equal((await getBoard(guest)).at(hostPivot ? -2 : -1), 'Chansey');
    assert.deepEqual(publishedTurns, [1, 2], 'replacement resolves once, including a fallback race');
  }
  if (out) await Promise.all([screenshot(host, 'host-resolved'), screenshot(guest, 'guest-resolved')]);
  assert.deepEqual(failures, []);
  if (hostRules) {
    if (series) await guestPress(guest.locator('#modal-end-screen').getByRole('button', { name: 'Return to Main Menu' }));
    else {
      await guestPress(guest.locator('#screen-battle').getByRole('button', { name: 'Settings', exact: true }));
      await guestPress(guest.locator('#settings-exit-btn'));
      await guestPress(guest.locator('#modal-game-confirm').getByRole('button', { name: 'OK' }));
    }
    await guest.locator('#screen-menu').waitFor();
    assert.deepEqual(await roomPrefs(guest), guestPrefs);
    assert.deepEqual(await roomPrefs(guest, true), savedGuestPrefs);
    console.log('Both seats used the host’s draft size and battle rules. The guest’s saved menu options and animation setting survived the room.');
  }
  if (recoverDraft) console.log('The same draft card retried after rejection and applied the RPC receipt while Realtime and head reads were unavailable.');
  if (parallelDraft) console.log('Simultaneous picks and a guest undo were committed independently.' +
    (expireDraft ? ' The host auto-drafted from the guest’s pool when the guest timed out.' : ''));
  console.log(pivot
    ? 'A native ' + (hostPivot ? 'host' : 'guest') + ' U-turn ' + (expireReplacement ? 'timed out to one replacement' : 'accepted its owner’s replacement') +
      ' and both peers received the same board. Mock latency ' + latencyMs + ' ms' + (swapDevices ? ', phone host.' : ', phone guest.')
    : reconnect ? 'Realtime catch-up, duplicate deliveries, Skip animation, live turn availability, and the shared board passed.'
      : series ? 'A best-of-three room completed two native wins, redrafted between rounds, and displayed one shared final score.'
      : 'The desktop host and phone guest drafted, played a native Showdown turn, and received the same board.');
} finally {
  await browser.close();
}
