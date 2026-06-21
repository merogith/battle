// Online matchmaking client (migration 007) — exercises OnlineBattle's
// startMatchmaking / poll / cancel against a mock Supabase client. Verifies the
// immediate-match path (caller becomes host), the waiting→matched path (caller
// becomes guest), cancel auth, and the stable accountless device id.
// Run: node --test tests/suites/online-matchmaking.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = readFileSync(join(ROOT, 'online-pvp.js'), 'utf8');

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
            const ch = { name, _cb: null, on() { return ch; }, subscribe(cb) { ch._cb = cb || null; channels.push(ch); return ch; } };
            return ch;
        },
        removeChannel() { return Promise.resolve(); }
    };
    return client;
}

function loadOnlineBattle(mock) {
    const dom = new JSDOM('<!doctype html><html><body><div id="battle-log"></div></body></html>', { url: 'https://localhost/' });
    const w = dom.window;
    w.__PBS_SUPABASE_URL = 'https://example.supabase.co';
    w.__PBS_SUPABASE_ANON_KEY = 'sb_publishable_0123456789abcdefghijklmnop';
    w.supabase = { createClient: () => mock };
    const fn = new Function('window', 'globalThis', SRC + '\nreturn window.OnlineBattle;');
    return { OB: fn(w, w), dom, w };
}

const seededRoom = () => Promise.resolve({
    data: { id: 'room9', code: 'MMABCDEF', data: { seq: 1, phase: 'draft', p1_draft: [{}], p2_draft: [{}] }, updated_at: '' },
    error: null
});
const tick = () => new Promise((r) => setTimeout(r, 0));

test('startMatchmaking: immediate claim makes the caller host', async () => {
    const mock = makeMockClient({
        rpc: (fn) => {
            if (fn === 'pvp_matchmake_enqueue') {
                return Promise.resolve({ data: { ok: true, matched: true, room_id: 'room9', role: 1, token: 'tok-host' }, error: null });
            }
            return Promise.resolve({ data: { ok: true }, error: null });
        },
        single: seededRoom
    });
    const { OB } = loadOnlineBattle(mock);
    let matched = null;
    await OB.startMatchmaking({ kind: 'menu', bucket: 100, teamPayload: [{ name: 'Pikachu' }], onMatched: (m) => { matched = m; } });
    await tick();

    assert.ok(matched, 'onMatched fired');
    assert.equal(matched.role, 1, 'caller is host');
    assert.equal(OB.isHost(), true);
    assert.equal(OB.isActive(), true);
    assert.equal(OB.isMatchmaking(), false, 'search cleared after match');
});

test('startMatchmaking: waiting then poll-match makes the caller guest', async () => {
    let pollRes = { ok: true, matched: false, status: 'waiting' };
    const mock = makeMockClient({
        rpc: (fn) => {
            if (fn === 'pvp_matchmake_enqueue') return Promise.resolve({ data: { ok: true, matched: false, queue_id: 'q1' }, error: null });
            if (fn === 'pvp_matchmake_poll') return Promise.resolve({ data: pollRes, error: null });
            return Promise.resolve({ data: { ok: true }, error: null });
        },
        single: seededRoom
    });
    const { OB } = loadOnlineBattle(mock);
    let waiting = false;
    let matched = null;
    // Large pollMs so the internal ticker doesn't fire during the test.
    await OB.startMatchmaking({ kind: 'crucible', bucket: 250, teamPayload: [{ name: 'Snorlax' }], pollMs: 100000,
        onWaiting: () => { waiting = true; }, onMatched: (m) => { matched = m; } });

    assert.equal(waiting, true, 'onWaiting fired');
    assert.equal(OB.isMatchmaking(), true, 'still searching');

    // Opponent appears: next poll resolves matched as guest.
    pollRes = { ok: true, matched: true, room_id: 'room9', role: 2, token: 'tok-guest' };
    await OB._matchmakePoll(3, { onMatched: (m) => { matched = m; } });
    await tick();

    assert.ok(matched, 'onMatched fired after poll');
    assert.equal(matched.role, 2, 'caller is guest');
    assert.equal(OB.isHost(), false);
    assert.equal(OB.isActive(), true);
    assert.equal(OB.isMatchmaking(), false, 'search cleared after match');
});

test('cancelMatchmaking calls the cancel RPC and stops searching', async () => {
    const mock = makeMockClient({
        rpc: (fn) => {
            if (fn === 'pvp_matchmake_enqueue') return Promise.resolve({ data: { ok: true, matched: false, queue_id: 'q1' }, error: null });
            return Promise.resolve({ data: { ok: true }, error: null });
        }
    });
    const { OB } = loadOnlineBattle(mock);
    await OB.startMatchmaking({ kind: 'menu', bucket: 1, teamPayload: [{}], pollMs: 100000 });
    assert.equal(OB.isMatchmaking(), true);

    const wasActive = OB.cancelMatchmaking();
    assert.equal(wasActive, true);
    assert.equal(OB.isMatchmaking(), false);
    assert.ok(mock._calls.rpc.some((c) => c.fn === 'pvp_matchmake_cancel'), 'cancel RPC was called');
});

test('getDeviceId is stable across calls (accountless identity)', () => {
    const { OB } = loadOnlineBattle(makeMockClient());
    const a = OB.getDeviceId();
    const b = OB.getDeviceId();
    assert.equal(a, b, 'same device id returned');
    assert.ok(a && a.length > 8, 'non-trivial id');
});

test('startMatchmaking surfaces an enqueue error via onError', async () => {
    const mock = makeMockClient({
        rpc: (fn) => {
            if (fn === 'pvp_matchmake_enqueue') return Promise.resolve({ data: { ok: false, error: 'bad_kind' }, error: null });
            return Promise.resolve({ data: { ok: true }, error: null });
        }
    });
    const { OB } = loadOnlineBattle(mock);
    let err = null;
    await OB.startMatchmaking({ kind: 'bogus', bucket: 0, teamPayload: [{}], onError: (e) => { err = e; } });
    assert.ok(err, 'onError fired');
    assert.equal(OB.isMatchmaking(), false);
});
