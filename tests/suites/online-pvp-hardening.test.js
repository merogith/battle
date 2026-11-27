// Online PvP hardening (2026-06): regression guards for the audit fixes —
//   P0-1  Gauntlet leaderboard renders wire display_name via textContent, not innerHTML.
//   P0-2  Host draft-complete trigger keys off the match_options contract, not local settings.
//   P1-5  A failed pre-write read/push rolls the local turn back instead of stranding the player.
//   P1-2  A Realtime reconnect after a drop re-syncs from head.
// online-pvp.js is a standalone IIFE; we evaluate it against a fresh jsdom window
// with a hand-rolled Supabase mock so the turn-sync paths run without a network.
// Run: node --test tests/suites/online-pvp-hardening.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = readFileSync(join(ROOT, 'online-pvp.js'), 'utf8');

// Minimal fluent Supabase mock. `opts.single` / `opts.maybeSingle` return the
// result of the next terminal read; `opts.rpc(fn,args)` handles RPC calls.
function makeMockClient(opts = {}) {
    const calls = { rpc: [] };
    const channels = [];
    const client = {
        _calls: calls,
        _channels: channels,
        from() {
            const b = {
                select() { return b; },
                eq() { return b; },
                insert() { return Promise.resolve({ data: null, error: null }); },
                single() { return opts.single ? opts.single() : Promise.resolve({ data: {}, error: null }); },
                maybeSingle() { return opts.maybeSingle ? opts.maybeSingle() : Promise.resolve({ data: {}, error: null }); }
            };
            return b;
        },
        rpc(fn, args) {
            calls.rpc.push({ fn, args });
            if (opts.rpc) return opts.rpc(fn, args);
            return Promise.resolve({ data: { ok: true }, error: null });
        },
        channel(name) {
            const ch = {
                name, _cb: null, _row: null,
                on(_event, _filter, callback) { ch._row = callback; return ch; },
                subscribe(cb) { ch._cb = cb; channels.push(ch); return ch; },
            };
            return ch;
        },
        removeChannel() { return Promise.resolve(); }
    };
    return client;
}

function loadOnlineBattle(mock) {
    // A real URL gives the window a non-opaque origin so localStorage works
    // (createRoom/joinRoom read the stored display name).
    const dom = new JSDOM('<!doctype html><html><body><div id="battle-log"></div></body></html>', { url: 'https://localhost/' });
    const w = dom.window;
    w.__PBS_SUPABASE_URL = 'https://example.supabase.co';
    w.__PBS_SUPABASE_ANON_KEY = 'sb_publishable_0123456789abcdefghijklmnop';
    w.supabase = { createClient: () => mock };
    const fn = new Function('window', 'globalThis', SRC + '\nreturn window.OnlineBattle;');
    return { OB: fn(w, w), dom, w };
}

const okCreate = (fn) => fn === 'try_create_pvp_room'
    ? Promise.resolve({ data: { ok: true, id: 'room1', host_token: 'tok-host' }, error: null })
    : null;

const tick = () => new Promise((r) => setTimeout(r, 0));

async function until(check, label) {
    for (let tries = 0; tries < 200; tries++) {
        if (check()) return;
        await tick();
    }
    assert.fail(label);
}

async function pairedBattle(t, nativeRequests = null) {
    const server = { row: null, staged: [], failNextResult: null, reports: 0, guestDisconnected: false };
    const clients = [];
    const read = () => Promise.resolve({ data: structuredClone(server.row), error: null });
    const write = (patch) => {
        server.row.data = { ...server.row.data, ...structuredClone(patch), seq: server.row.data.seq + 1 };
        for (const [index, peer] of clients.entries()) {
            if (index === 1 && server.guestDisconnected) continue;
            const update = { new: structuredClone(server.row) };
            queueMicrotask(() => peer._channels[0]?._row(update));
        }
    };
    for (let i = 0; i < 2; i++) {
        clients.push(makeMockClient({
            single: read, maybeSingle: read,
            async rpc(fn, args) {
                if (fn === 'try_create_pvp_room') {
                    server.row = { id: 'room1', code: args.p_code, data: args.p_data };
                    return { data: { ok: true, id: 'room1', host_token: 'token1' } };
                }
                if (fn === 'try_join_pvp_room') {
                    write({ guest_joined: true, guest_display_name: 'Guest' });
                    return { data: { ok: true, guest_token: 'token2', data: structuredClone(server.row.data) } };
                }
                if (fn === 'increment_pvp_leaderboard_win') {
                    server.reports++;
                    return { data: { ok: true } };
                }
                const patch = args.p_patch;
                if (patch.p1_departure || patch.p2_departure) {
                    server.departures ||= [];
                    server.departures.push(structuredClone(patch));
                    if (server.failDeparture) {
                        if (server.failDeparture === 'after commit') write(patch);
                        server.failDeparture = null;
                        return { data: null, error: { message: 'departure reply lost' } };
                    }
                    write(patch);
                    return { data: { ok: true, data: structuredClone(server.row.data) } };
                }
                if (patch.battle?.resolved_turn > (server.row.data.battle?.resolved_turn || 0)) {
                    server.staged.push(structuredClone(patch));
                    if (server.dropGuestAtResolution) server.guestDisconnected = true;
                    if (server.failNextResult) {
                        const commit = server.failNextResult === 'after commit';
                        server.failNextResult = null;
                        if (commit) write(patch);
                        return { data: null, error: { message: 'connection lost' } };
                    }
                }
                write(patch);
                return { data: { ok: true } };
            },
        }));
    }
    const host = loadOnlineBattle(clients[0]), guest = loadOnlineBattle(clients[1]);
    t.after(() => {
        host.OB.dispose();
        guest.OB.dispose();
        host.dom.window.close();
        guest.dom.window.close();
    });
    const pActive = { name: 'Pikachu', currentHp: 100, moves: [] };
    const fActive = { name: 'Eevee', currentHp: 100, moves: [] };
    const hostState = { mode: 'pvp', currentPlayer: 1, playerParty: [pActive], foeParty: [fActive], pActive, fActive, pSide: {}, fSide: {}, turnNumber: 0 };
    const guestState = { mode: 'pvp' };
    const pickedAction = { moveIndex: 0, switchIndex: null, aiMove: null };
    const guestRequests = [];

    host.w.onOnlineRoomData = d => host.OB.consumeRemoteForHost(hostState, {}, d);
    guest.w.updateMechanics = () => {};
    guest.w.updateOnlineBattleScoreOverlay = () => {};
    guest.w.updateOnlineEndScreenScore = () => {};
    guest.w.refreshNativeBattleUi = () => guestRequests.push(guestState.nativeRequests?.[1]?.phase);
    const script = readFileSync(join(ROOT, 'battle.html'), 'utf8');
    const start = script.indexOf('window.onOnlineRoomData = async function');
    const end = script.indexOf('\n        };', start) + '\n        };'.length;
    assert.ok(start >= 0 && end > start);
    new Function('window', 'state', 'settings', 'logMsg', 'syncBattleActiveHighlight', script.slice(start, end))(
        guest.w, guestState, {}, () => {}, () => {},
    );
    const room = await host.OB.createRoom({ partySize: 1 }, [1], { p1_pool: [], p2_pool: [] });
    await guest.OB.joinRoom(room.code, 'Guest');
    if (nativeRequests) {
        await until(() => host.OB.canUseNativeBattle(), 'host receives the guest engine protocol');
        assert.ok(guest.OB.canUseNativeBattle());
        hostState.battleEngine = 'showdown';
        hostState.nativeRequests = nativeRequests;
        hostState.currentPlayer = nativeRequests[0] ? 1 : 2;
        hostState.foeParty.push({ name: 'Pichu', currentHp: 100, moves: [] });
    }
    await host.OB.afterHostStartBattle(hostState);
    await until(() => guest.w.__guestBattleStartApplied, 'guest receives the opening snapshot');
    async function sendBothActions() {
        assert.ok(host.OB.myTurn(hostState));
        assert.ok(guest.OB.waitingOnOpponent(guestState));
        await host.OB.handlePvPPlayTurn(hostState, pickedAction, {});
        await until(() => guest.OB.myTurn(guestState), 'guest receives the host action');
        assert.ok(host.OB.waitingOnOpponent(hostState));
        await guest.OB.handlePvPPlayTurn(guestState, pickedAction, {});
    }
    return {
        host, guest, hostState, guestState, server, sendBothActions, guestRequests, write,
        hostChannel: clients[0]._channels[0], guestChannel: clients[1]._channels[0],
    };
}

for (const role of [1, 2]) {
    test(`player ${role} can forfeit a pending battle exactly once`, async t => {
        const { host, guest, hostState, guestState, server, write, guestChannel } = await pairedBattle(t);
        const quitter = role === 1 ? host : guest;
        const opponent = role === 1 ? guest : host;
        host.w.onOnlineRoomData = () => {};
        guest.w.onOnlineRoomData = () => {};
        const selected = { moveIndex: 0, switchIndex: null, aiMove: null };
        await host.OB.handlePvPPlayTurn(hostState, selected, {});
        server.guestDisconnected = true;
        server.failDeparture = 'after commit';
        const first = quitter.OB.requestDeparture();
        const duplicate = quitter.OB.requestDeparture();
        assert.equal(first, duplicate);
        assert.equal(await first, true, 'a dropped response is reconciled from the room head');
        assert.equal(server.departures.length, 1);
        assert.equal(server.row.data.phase, 'done');
        assert.equal(server.row.data[`p${3 - role}_wins`], 1);
        assert.equal(server.row.data.battle.resolved_turn, 0);
        // An already in-flight ordinary patch must not resurrect the room.
        write({ phase: 'battle', p1_wins: 0, p2_wins: 0 });
        guestChannel._cb('CHANNEL_ERROR');
        guestChannel._cb('SUBSCRIBED');
        await until(() => opponent.OB.getDeparture(), 'other player receives confirmed forfeit');
        assert.deepEqual(host.OB.getDeparture(), guest.OB.getDeparture());
        assert.equal(host.OB.getDeparture().winner, 3 - role);
        assert.equal(host.OB.myTurn(hostState), false);
        assert.equal(guest.OB.myTurn(guestState), false);
        assert.equal(await quitter.OB.requestDeparture(), true);
        assert.equal(server.departures.length, 1);
    });
}

test('a denied departure keeps the live room actionable before a retry', async t => {
    const { host, guest, hostState, server } = await pairedBattle(t);
    host.w.onOnlineRoomData = () => {};
    guest.w.onOnlineRoomData = () => {};
    server.failDeparture = 'before commit';
    assert.equal(await host.OB.requestDeparture(), false);
    assert.equal(server.row.data.phase, 'battle');
    assert.equal(host.OB.myTurn(hostState), true);
    assert.equal(guest.OB.getDeparture(), null);
    assert.equal(await host.OB.requestDeparture(), true);
    await until(() => guest.OB.getDeparture(), 'successful retry reaches the guest');
    assert.equal(guest.OB.getDeparture().winner, 2);
});

test('a confirmed departure wins the race against an in-progress simulator result', async t => {
    const { host, guest, hostState, server, sendBothActions } = await pairedBattle(t);
    let finishTurn;
    host.w.__runLockedPvPTurnResolution = async () => {
        await new Promise(resolve => { finishTurn = resolve; });
        hostState.isOver = true;
        hostState.pActive.currentHp = 0;
    };
    t.after(() => finishTurn?.());
    await sendBothActions();
    guest.w.onOnlineRoomData = () => {};
    await until(() => finishTurn, 'the host entered turn resolution');
    assert.ok(host.OB.isSettlingTurn());
    assert.equal(await guest.OB.requestDeparture(), true);
    await until(() => host.OB.getDeparture(), 'the host receives the surrender during resolution');
    finishTurn();
    await until(() => !host.OB.isSettlingTurn(), 'the pending resolution unwinds');
    assert.equal(server.row.data.battle.resolved_turn, 0);
    assert.deepEqual([server.row.data.p1_wins, server.row.data.p2_wins], [1, 0]);
    assert.equal(server.reports, 0);
});

test('two players recover an unpublished host turn through normal room reconnect', async t => {
    const { host, guest, hostState, guestState, server, sendBothActions, hostChannel } = await pairedBattle(t);
    host.w.__runLockedPvPTurnResolution = async () => {
        hostState.turnNumber++;
        hostState.fActive.currentHp -= 12;
        hostState.currentPlayer = 1;
    };
    server.failNextResult = 'before commit';
    await sendBothActions();
    await until(() => server.staged.length === 1, 'the first result write fails');
    assert.equal(hostState.turnNumber, 1);
    assert.equal(guestState.turnNumber, 0);
    assert.equal(server.row.data.battle.resolved_turn, 0);
    assert.equal(host.OB.isSettlingTurn(), true);
    hostChannel._cb('CHANNEL_ERROR', { message: 'connection interrupted' });
    hostChannel._cb('SUBSCRIBED');
    await until(() => guestState.turnNumber === 1, 'guest receives the published result');
    assert.equal(server.staged.length, 2);
    assert.equal(server.staged[0].battle.state_blob, server.staged[1].battle.state_blob);
    assert.equal(hostState.turnNumber, 1, 'the engine ran once');
    assert.equal(guestState.fActive.currentHp, 88);
    await until(() => !host.OB.isSettlingTurn(), 'host can start another turn after publishing');
    assert.ok(guest.OB.waitingOnOpponent(guestState));
    await sendBothActions();
    await until(() => guestState.turnNumber === 2, 'the next normal turn completes');
    assert.equal(guestState.fActive.currentHp, 76);
});

test('a lost final-write response keeps the final snapshot and score atomic', async t => {
    const { host, hostState, guestState, server, sendBothActions, hostChannel } = await pairedBattle(t);
    host.w.__runLockedPvPTurnResolution = async () => {
        hostState.turnNumber++;
        hostState.fActive.currentHp = 0;
        hostState.isOver = true;
    };
    server.failNextResult = 'after commit';
    await sendBothActions();
    await until(() => guestState.isOver, 'guest receives the terminal board');
    assert.equal(server.row.data.phase, 'done');
    assert.equal(server.row.data.p1_wins, 1);
    assert.equal(host.OB.isSettlingTurn(), true);
    hostChannel._cb('CHANNEL_ERROR', { message: 'response lost' });
    hostChannel._cb('SUBSCRIBED');
    await until(() => server.reports === 1, 'host confirms the committed result');
    assert.equal(server.staged.length, 1, 'an already-committed result is not rewritten');
    assert.equal(hostState.turnNumber, 1);
    assert.equal(host.w.__onlineP1Wins, 1);
    await until(() => !host.OB.isSettlingTurn(), 'host can start the next round only after confirming the result');
});

test('a reconnected guest accepts the saved result before opening its pending pick', async t => {
    const { host, guest, hostState, guestState, server, sendBothActions, guestChannel } = await pairedBattle(t);
    host.w.__runLockedPvPTurnResolution = async () => {
        hostState.turnNumber++;
        hostState.fActive.currentHp -= 12;
        hostState.currentPlayer = 1;
    };
    server.dropGuestAtResolution = true;
    await sendBothActions();
    await until(() => server.row.data.battle.resolved_turn === 1, 'first result commits while the guest is away');
    assert.equal(guestState.turnNumber, 0);
    guestChannel._cb('CHANNEL_ERROR', { message: 'guest disconnected' });
    const nextAction = { moveIndex: 1, switchIndex: null, aiMove: null };
    await host.OB.handlePvPPlayTurn(hostState, nextAction, {});
    assert.equal(server.row.data.battle.pending_turn, 2);
    assert.equal(server.row.data.battle.p1_pick.moveIndex, 1);
    server.guestDisconnected = false;
    guestChannel._cb('SUBSCRIBED');
    await until(() => guestState.turnNumber === 1, 'guest catches up to the completed turn');
    assert.ok(guest.OB.myTurn(guestState), 'the newer host pick is visible after applying the snapshot');
    assert.equal(guestState.fActive.currentHp, 88);
    await guest.OB.handlePvPPlayTurn(guestState, nextAction, {});
    await until(() => server.row.data.battle.resolved_turn === 2, 'the reconnected guest completes the next turn');
});

test('the native room sends a guest-only pivot choice and uses the engine winner', async t => {
    const move = { phase: 'move', moves: [{ slot: 0, name: 'U-turn' }], switches: [], forms: [] };
    const { host, guest, hostState, guestState, server, sendBothActions, guestRequests, write } = await pairedBattle(t, [move, move]);
    let resolutions = 0;
    host.w.__runLockedPvPTurnResolution = async () => {
        resolutions++;
        if (resolutions === 1) {
            assert.equal(hostState.p1Action.moveIndex, 0);
            assert.equal(hostState.p2Action.moveIndex, 0);
            hostState.turnNumber = 1;
            hostState.nativeRequests = [null, { phase: 'replace', moves: [], switches: [1], forms: [] }];
            hostState.currentPlayer = 2;
        } else {
            assert.equal(hostState.p1Action, null, 'a waiting side sends no action to the engine');
            assert.equal(hostState.p2Action.switchIndex, 1);
            hostState.fActive = hostState.foeParty[1];
            hostState.nativeRequests = [null, null];
            hostState.nativeWinner = 2;
            hostState.isOver = true;
        }
    };
    const endings = [];
    guest.w.showEndScreen = (...args) => endings.push(args);
    assert.equal(guestState.battleEngine, 'showdown');
    assert.equal(server.row.data.battle.engine, 'showdown');
    await sendBothActions();
    const firstGuestPick = structuredClone(server.row.data.native_p2_choice);
    await until(() => guestState._onlineNativeRevision === 2, 'guest receives the pivot request');
    assert.equal(guestState.turnNumber, 1);
    assert.ok(guest.OB.myTurn(guestState));
    assert.ok(host.OB.waitingOnOpponent(hostState));
    assert.equal(guestRequests.at(-1), 'replace');
    assert.equal(server.row.data.battle.p1_pick, null);
    assert.equal(server.row.data.battle.resolved_turn, 1);
    write({ native_p2_choice: firstGuestPick });
    await tick();
    assert.equal(resolutions, 1, 'a late choice belongs to the previous revision');
    await guest.OB.handlePvPPlayTurn(guestState, { moveIndex: null, switchIndex: 1 }, {});
    await until(() => guestState.isOver, 'guest receives the resolved replacement');
    assert.equal(guestState.turnNumber, 1, 'the replacement is a distinct decision within the same turn');
    assert.equal(guestState.fActive.name, 'Pichu');
    assert.equal(server.row.data.battle.resolved_turn, 2);
    assert.equal(server.row.data.p2_wins, 1, 'both sides still have HP, so scoring uses the Showdown outcome');
    assert.equal(endings.at(-1)?.[0], 'VICTORY!');
});

test('a timed-out native guest replacement rejects an older board and reconnects to the latest', async t => {
    const replace = { phase: 'replace', moves: [], switches: [1], forms: [] };
    const move = { phase: 'move', moves: [{ slot: 0, name: 'Tackle' }], switches: [], forms: [] };
    const { host, guest, hostState, guestState, server } = await pairedBattle(t, [null, replace]);
    let resolutions = 0;
    host.w._pvpBuildTimeoutAction = () => ({ moveIndex: null, switchIndex: 1 });
    host.w.__runLockedPvPTurnResolution = async () => {
        resolutions++;
        assert.equal(hostState.p1Action, null);
        assert.equal(hostState.p2Action.switchIndex, 1);
        hostState.fActive = hostState.foeParty[1];
        hostState.currentPlayer = 1;
        hostState.nativeRequests = [move, move];
    };
    server.dropGuestAtResolution = true;
    await host.OB.hostResolveGuestBattleTimeout(hostState, {});
    assert.equal(server.row.data.battle.pending_turn, 2);
    assert.equal(guestState._onlineNativeRevision, 1);
    assert.ok(guest.OB.myTurn(guestState));
    await guest.OB.handlePvPPlayTurn(guestState, { moveIndex: null, switchIndex: 1 }, {});
    await until(() => guestState._onlineNativeRevision === 2, 'stale choice sees the newer board');
    assert.equal(guestState.fActive.name, 'Pichu');
    assert.ok(guest.OB.waitingOnOpponent(guestState));
    assert.equal(resolutions, 1, 'the stale replacement must never run against the next decision');
    assert.equal(server.row.data.native_p2_choice, undefined);
});

test('the online service lazily loads one SDK for concurrent callers and retries a failed load', async () => {
    const mock = makeMockClient();
    const { OB, dom, w } = loadOnlineBattle(mock);
    try {
        delete w.supabase;
        let loads = 0;
        const append = w.document.head.appendChild.bind(w.document.head);
        w.document.head.appendChild = script => {
            append(script);
            const attempt = ++loads;
            queueMicrotask(() => {
                if (attempt === 1) script.onerror();
                else {
                    w.supabase = { createClient: () => mock };
                    script.onload();
                }
            });
            return script;
        };
        await assert.rejects(Promise.all([OB.getServiceClient(), OB.getServiceClient()]), /Could not load online services/);
        assert.equal(loads, 1);
        assert.equal(w.document.head.querySelectorAll('script').length, 0);
        assert.equal(await OB.getServiceClient(), mock);
        assert.equal(await OB.getServiceClient(), mock);
        assert.equal(loads, 2);
    } finally {
        dom.window.close();
    }
});

test('P1-5: failed pre-write read rolls the host turn back (P1 not stranded)', async () => {
    const mock = makeMockClient({
        rpc: (fn) => okCreate(fn) || Promise.resolve({ data: { ok: true }, error: null }),
        // The pre-write read inside handlePvPPlayTurn fails.
        single: () => Promise.resolve({ data: null, error: { message: 'network boom' } })
    });
    const { OB } = loadOnlineBattle(mock);
    await OB.createRoom({ partySize: 3 }, [1], { p1_pool: [], p2_pool: [] });
    assert.equal(OB.isHost(), true);

    const state = { mode: 'pvp', currentPlayer: 1, p1Action: null };
    await OB.handlePvPPlayTurn(state, { moveIndex: 0, switchIndex: null, aiMove: null }, {});

    assert.equal(state.currentPlayer, 1, 'currentPlayer restored to 1 after failed send');
    assert.equal(state.p1Action, null, 'p1Action rolled back to null after failed send');
});

test('P1-5: happy path still advances the turn and pushes the pick', async () => {
    const pushes = [];
    const mock = makeMockClient({
        rpc: (fn, args) => {
            if (fn === 'try_create_pvp_room') return okCreate(fn);
            if (fn === 'pvp_push_data') { pushes.push(args.p_patch); return Promise.resolve({ data: { ok: true }, error: null }); }
            return Promise.resolve({ data: { ok: true }, error: null });
        },
        // PostgREST returns the row; the jsonb column is row.data.
        single: () => Promise.resolve({ data: { data: { battle: { pending_turn: 1, p1_pick: null, p2_pick: null } } }, error: null })
    });
    const { OB } = loadOnlineBattle(mock);
    await OB.createRoom({ partySize: 3 }, [1], { p1_pool: [], p2_pool: [] });

    const state = { mode: 'pvp', currentPlayer: 1, p1Action: null };
    await OB.handlePvPPlayTurn(state, { moveIndex: 2, switchIndex: null, aiMove: null }, {});

    assert.equal(state.currentPlayer, 2, 'turn advanced to opponent on success');
    assert.equal(pushes.length, 1, 'exactly one pvp_push_data');
    assert.ok(pushes[0].battle && pushes[0].battle.p1_pick, 'pushed patch carries p1_pick');
    assert.equal(pushes[0].battle.p1_pick.moveIndex, 2);
});

test('P1-2: a Realtime reconnect after a drop re-syncs from head', async () => {
    const received = [];
    const mock = makeMockClient({
        rpc: (fn) => okCreate(fn) || Promise.resolve({ data: { ok: true }, error: null }),
        // _resyncFromHead reads the current row; hand back a newer seq so it replays.
        single: () => Promise.resolve({ data: { id: 'room1', code: 'ABCDEF', data: { seq: 7, phase: 'draft' }, updated_at: '' }, error: null })
    });
    const { OB, w } = loadOnlineBattle(mock);
    w.onOnlineRoomData = (d) => { received.push(d); };
    await OB.createRoom({ partySize: 3 }, [1], { p1_pool: [], p2_pool: [] });

    const ch = mock._channels[0];
    assert.ok(ch && typeof ch._cb === 'function', 'subscribe callback was registered');

    // Drop, then reconnect.
    ch._cb('CHANNEL_ERROR', { message: 'socket lost' });
    ch._cb('SUBSCRIBED');
    await tick();
    await tick();

    assert.equal(received.length, 1, 'reconnect triggered exactly one head replay');
    assert.equal(received[0].seq, 7, 'replayed the head row');
});

test('P1-2: a clean first SUBSCRIBE (no prior drop) does NOT refetch', async () => {
    const received = [];
    let singleCalls = 0;
    const mock = makeMockClient({
        rpc: (fn) => okCreate(fn) || Promise.resolve({ data: { ok: true }, error: null }),
        single: () => { singleCalls++; return Promise.resolve({ data: { id: 'room1', data: { seq: 7 } }, error: null }); }
    });
    const { OB, w } = loadOnlineBattle(mock);
    w.onOnlineRoomData = (d) => { received.push(d); };
    await OB.createRoom({ partySize: 3 }, [1], { p1_pool: [], p2_pool: [] });

    mock._channels[0]._cb('SUBSCRIBED');
    await tick();

    assert.equal(singleCalls, 0, 'no head refetch without a prior drop');
    assert.equal(received.length, 0);
});

// --- Source guards: the battle.html monolith fixes are not unit-drivable, so
// lock the corrected shape (and the absence of the vulnerable shape) here. ---

test('P0-1: leaderboard renders display_name via textContent, never innerHTML concat', () => {
    const html = readFileSync(join(ROOT, 'battle.html'), 'utf8');
    assert.doesNotMatch(
        html,
        /meta\.innerHTML\s*=\s*'<div[^']*'\s*\+\s*\(row\.display_name/,
        'vulnerable innerHTML concat of row.display_name must be gone'
    );
    assert.match(html, /nameEl\.textContent\s*=\s*row\.display_name/, 'display_name rendered as textContent');
});

test('P0-2: host draft-complete trigger reads partySize from the match_options contract', () => {
    const html = readFileSync(join(ROOT, 'battle.html'), 'utf8');
    assert.match(
        html,
        /const n = \(d\.match_options && d\.match_options\.partySize\) \|\| settings\.partySize;/,
        'draft-complete trigger must prefer the match_options contract'
    );
});

test('hardening symbols are present in online-pvp.js', () => {
    assert.match(SRC, /_resyncFromHead/, 'reconnect resync helper present');
    assert.match(SRC, /hostLastResolvedTurn/, 'resolution fence present');
    assert.match(SRC, /_restoreTurnUiAfterSendFailure/, 'send-failure UI restore present');
});
