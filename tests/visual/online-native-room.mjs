/* global state */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Exercise the real Arena UI and native simulator with two isolated players.
// The in-memory transport stands in for the existing Supabase RPC contract.
const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Use a loopback dev server');
const endpoint = new URL('./online-room-mock', url).href;
const pivot = process.env.BATTLE_TEST_ROOM_PIVOT === '1';
const partySize = pivot ? 2 : 1;
let room;
let pivotDraftReady = false;

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
    if (pivot && !pivotDraftReady && patch.phase === 'draft' && patch.p1_pool) {
      patch.p1_pool = [entry('Snorlax', 'Immunity', ['Tackle', 'Amnesia']), entry('Lapras', 'Water Absorb', ['Water Gun'])];
      patch.p2_pool = [entry('Scizor', 'Swarm', ['U-turn', 'Protect']), entry('Chansey', 'Natural Cure', ['Tackle'])];
      pivotDraftReady = true;
    }
    patchRoom(patch);
    return { data: { ok: true } };
  }
  return { data: { ok: false, error: 'unrecognized_mock_rpc' } };
}

function installTransport(endpoint) {
  const invoke = payload => fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) }).then(result => result.json());
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
      return {
        on(_event, _filter, callback) { listener = callback; return this; },
        subscribe(callback) {
          let seen = 0;
          let reading = false;
          timer = setInterval(async () => {
            if (reading) return;
            reading = true;
            try {
              const { data } = await from().eq('id', name.slice('room-'.length)).single();
              if (data?.data?.seq > seen) {
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
const mode = (page, label) => page.locator('.menu-mode-grid').getByRole('button', { name: label });

async function openPlayer(options) {
  const context = await browser.newContext({ ...options, serviceWorkers: 'block' });
  await context.addInitScript(installTransport, endpoint);
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.fallback() : route.abort());
  await context.route(endpoint, route => route.fulfill({ json: execute(route.request().postDataJSON()) }));
  await context.route(new URL('./online-config.js', url).href, route => route.fulfill({
    contentType: 'text/javascript',
    body: 'window.__PBS_SUPABASE_URL = location.origin; window.__PBS_SUPABASE_ANON_KEY = "local-room-test-publishable-key";',
  }));
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).first().click();
  const settings = page.locator('#modal-settings');
  await settings.getByRole('combobox', { name: 'Battle speed', exact: true }).selectOption('instant');
  await page.locator('#sw-animations').uncheck();
  await settings.getByRole('button', { name: 'Close settings' }).click();
  if (await page.locator('#menu-more-play').getAttribute('open') === null) {
    await page.locator('#menu-more-play-summary').click();
  }
  return page;
}

try {
  const host = await openPlayer({ viewport: { width: 1366, height: 900 } });
  const guest = await openPlayer({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await host.locator('#menu-customize-toggle').click();
  await host.getByRole('radio', { name: /Custom/ }).click();
  await host.locator('#party-size-select').selectOption(String(partySize));
  await host.locator('#menu-customize-toggle').click();
  await mode(host, /Online Host/i).click();
  await host.locator('#modal-online-host').getByRole('button', { name: 'Create room', exact: true }).click();
  await host.locator('#screen-draft').waitFor({ state: 'visible', timeout: 30000 });
  assert.ok(room?.code);

  await mode(guest, /Online Join/i).tap();
  const form = guest.locator('#modal-online-pvp');
  await form.getByLabel('Room code').fill(room.code);
  await form.getByRole('button', { name: 'Join', exact: true }).tap();
  await guest.locator('#screen-draft').waitFor({ state: 'visible' });
  await host.waitForFunction(() => window.OnlineBattle.canUseNativeBattle());
  const pick = (page, name) => {
    const cards = page.locator('#draft-grid .draft-card img');
    return (name ? page.locator('#draft-grid .draft-card').getByRole('img', { name, exact: true }) : cards.first()).click();
  };
  // The existing draft RPC updates the board after each draft pick.
  await pick(host, pivot ? 'Snorlax' : null);
  if (pivot) await pick(host, 'Lapras');
  await guest.waitForFunction(size => state.p1Draft.length === size, partySize);
  await pick(guest, pivot ? 'Scizor' : null);
  if (pivot) await pick(guest, 'Chansey');

  for (const peer of [host, guest]) {
    await peer.waitForFunction(() => state.battleEngine === 'showdown' && state._onlineNativeRevision === 1 && !state.isLocked);
    await fight(peer).waitFor();
  }
  assert.equal(room.data.battle.engine, 'showdown');
  const move = (peer, name) => {
    const choices = peer.locator('#move-menu .battle-btn-move:enabled');
    return (name ? choices.filter({ hasText: name }) : choices.first()).click();
  };
  await fight(host).click();
  await move(host, pivot ? 'Tackle' : null);
  await guest.waitForFunction(() => window.OnlineBattle.myTurn(state));
  await fight(guest).tap();
  await move(guest, pivot ? 'U-turn' : null);

  if (pivot) {
    const party = guest.locator('#modal-party');
    await party.getByRole('button', { name: 'Switch', exact: true }).filter({ visible: true }).last().tap();
    assert.ok(await host.locator('#modal-party').isHidden(), 'the host cannot choose the guest replacement');
  }

  for (const peer of [host, guest]) {
    await peer.waitForFunction(revision => state._onlineNativeRevision === revision && state.turnNumber >= 1, pivot ? 3 : 2);
  }
  const getBoard = peer => peer.evaluate(() => [state.turnNumber, state.pActive.currentHp, state.fActive.currentHp, state.isOver, state.fActive.name]);
  assert.deepEqual(await getBoard(host), await getBoard(guest));
  assert.equal(room.data.battle.resolved_turn, pivot ? 2 : 1);
  if (pivot) assert.equal((await getBoard(guest)).at(-1), 'Chansey');
  assert.deepEqual(failures, []);
  console.log(pivot
    ? 'The phone guest completed a native U-turn replacement and both peers received the same board.'
    : 'The desktop host and phone guest drafted, played a native Showdown turn, and received the same board.');
} finally {
  await browser.close();
}
