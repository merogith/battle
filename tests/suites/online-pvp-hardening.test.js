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
            const ch = { name, _cb: null, on() { return ch; }, subscribe(cb) { ch._cb = cb; channels.push(ch); return ch; } };
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
