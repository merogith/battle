import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function mockSupabaseClient() {
  const rooms = new Map();
  const subs = new Map();
  let _idSeq = 0;
  // Mirrors migration 005 RPC contracts: try_create_pvp_room mints host_token,
  // try_join_pvp_room mints guest_token, pvp_push_data validates the token.
  function rpc(name, params) {
    if (name === 'try_create_pvp_room') {
      const id = 'room-' + (++_idSeq);
      const host_token = 'host-' + Math.random().toString(36).slice(2, 14);
      const data = Object.assign({}, params.p_data, { host_token });
      rooms.set(id, { id, code: params.p_code, data });
      return Promise.resolve({ data: { ok: true, id, host_token, code: params.p_code }, error: null });
    }
    if (name === 'try_join_pvp_room') {
      const r = rooms.get(params.p_room_id);
      if (!r) return Promise.resolve({ data: { ok: false, error: 'not_found' }, error: null });
      if (r.data && r.data.guest_joined) return Promise.resolve({ data: { ok: false, error: 'full' }, error: null });
      const guest_token = 'guest-' + Math.random().toString(36).slice(2, 14);
      r.data = Object.assign({}, r.data, {
        guest_joined: true,
        guest_display_name: params.p_guest_name || 'Guest',
        guest_token,
        seq: ((r.data && r.data.seq) || 0) + 1,
      });
      return Promise.resolve({ data: { ok: true, data: r.data, guest_token }, error: null });
    }
    if (name === 'pvp_push_data') {
      const r = rooms.get(params.p_room_id);
      if (!r) return Promise.resolve({ data: { ok: false, error: 'not_found' }, error: null });
      const t = params.p_token;
      if (t !== r.data.host_token && t !== r.data.guest_token) {
        return Promise.resolve({ data: { ok: false, error: 'token_mismatch' }, error: null });
      }
      const seq = (r.data.seq || 0) + 1;
      r.data = Object.assign({}, r.data, params.p_patch, { seq });
      return Promise.resolve({ data: { ok: true, data: r.data }, error: null });
    }
    return Promise.resolve({ data: null, error: { code: 'unknown_rpc', message: name } });
  }
  return {
    rooms,
    rpc,
    from(table) {
      const builder = {
        select: () => {
          const p = Promise.resolve({ data: [...rooms.values()], error: null });
          p.eq = () => Promise.resolve({ data: [...rooms.values()], error: null });
          return p;
        },
        // INSERT/UPDATE/DELETE on pvp_rooms are blocked at the RLS layer in
        // production (migration 005). The mock keeps them present for any
        // legacy test that still exercises the helper shape.
        insert: (row) => {
          const r = Array.isArray(row) ? row[0] : row;
          rooms.set(r.id || r.code, r);
          return Promise.resolve({ data: [r], error: null });
        },
        update: (patch) => ({
          eq: (col, val) => {
            for (const r of rooms.values()) if (r[col] === val) Object.assign(r, patch);
            return Promise.resolve({ data: [...rooms.values()], error: null });
          },
        }),
        upsert: (row) => {
          const r = Array.isArray(row) ? row[0] : row;
          rooms.set(r.id || r.code, r);
          return Promise.resolve({ data: [r], error: null });
        },
      };
      return builder;
    },
    channel(name) {
      const handlers = [];
      const chan = {
        on(event, _filter, cb) { handlers.push({ event, cb }); return chan; },
        subscribe() { subs.set(name, handlers); return Promise.resolve('SUBSCRIBED'); },
        unsubscribe() { subs.delete(name); return Promise.resolve('CLOSED'); },
        send(payload) { for (const h of handlers) h.cb(payload); return Promise.resolve(); },
      };
      return chan;
    },
  };
}

test('pvp-stub: mock Supabase client supports insert + select round-trip', async () => {
  const c = mockSupabaseClient();
  await c.from('pvp_rooms').insert({ id: 'ABC123', code: 'ABC123', data: { team: [] } });
  const { data, error } = await c.from('pvp_rooms').select();
  assert.equal(error, null);
  assert.equal(data.length, 1);
  assert.equal(data[0].id, 'ABC123');
});

test('pvp-stub: sequence-number monotonicity is enforceable in code (regression for race at lastRemoteSeq check)', async () => {
  let lastSeq = -1;
  const incoming = [
    { seq: 1, payload: 'A' },
    { seq: 3, payload: 'C' },
    { seq: 2, payload: 'B' },
  ];
  const accepted = [];
  for (const msg of incoming) {
    if (msg.seq <= lastSeq) continue;
    accepted.push(msg);
    lastSeq = msg.seq;
  }
  assert.deepEqual(accepted.map(m => m.payload), ['A', 'C']);
  assert.equal(lastSeq, 3);
});

test('pvp-stub: queue serialization preserves order under concurrent enqueues', async () => {
  let chain = Promise.resolve();
  const log = [];
  function enqueue(label, ms) {
    chain = chain.then(async () => {
      await new Promise(r => setTimeout(r, ms));
      log.push(label);
    });
    return chain;
  }
  enqueue('A', 20);
  enqueue('B', 5);
  enqueue('C', 1);
  await chain;
  assert.deepEqual(log, ['A', 'B', 'C'], 'queue must preserve enqueue order regardless of per-item latency');
});

test('pvp-stub: silent .catch() swallows errors — regression test demonstrating the anti-pattern', async () => {
  let chain = Promise.resolve();
  let caughtUpstream = false;
  chain = chain.then(() => Promise.reject(new Error('boom'))).catch(() => {});
  chain = chain.then(() => { caughtUpstream = true; });
  await chain;
  assert.equal(caughtUpstream, true, 'after .catch() with empty handler, chain proceeds — error invisible');
});

test('pvp-stub: room code random-id collision resistance check (48-bit space sample)', () => {
  function code6() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  const seen = new Set();
  for (let i = 0; i < 1000; i++) seen.add(code6());
  assert.ok(seen.size >= 990, `1000 codes should produce ~1000 unique values (got ${seen.size})`);
});

test('pvp-stub: online-pvp.js source still uses queued pushData pattern', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  assert.match(src, /pushDataPromise|pushDataQueue|remoteRowQueue/, 'expected at least one queue token to remain in source');
});

test('pvp-stub: token architecture — try_create_pvp_room mints host_token (ISSUE-020)', async () => {
  const c = mockSupabaseClient();
  const { data, error } = await c.rpc('try_create_pvp_room', { p_code: 'ABC123', p_data: { phase: 'draft' } });
  assert.equal(error, null);
  assert.equal(data.ok, true);
  assert.ok(data.host_token && data.host_token.length > 12, 'host_token returned');
  assert.equal(data.code, 'ABC123');
});

test('pvp-stub: try_join_pvp_room mints guest_token distinct from host_token', async () => {
  const c = mockSupabaseClient();
  const create = await c.rpc('try_create_pvp_room', { p_code: 'ROOM01', p_data: {} });
  const join = await c.rpc('try_join_pvp_room', { p_room_id: create.data.id, p_guest_name: 'Alice' });
  assert.equal(join.data.ok, true);
  assert.ok(join.data.guest_token && join.data.guest_token.length > 12);
  assert.notEqual(join.data.guest_token, create.data.host_token);
  assert.equal(join.data.data.guest_joined, true);
});

test('pvp-stub: pvp_push_data accepts the host token', async () => {
  const c = mockSupabaseClient();
  const create = await c.rpc('try_create_pvp_room', { p_code: 'ROOM02', p_data: {} });
  const push = await c.rpc('pvp_push_data', {
    p_room_id: create.data.id,
    p_token: create.data.host_token,
    p_patch: { phase: 'battle' },
  });
  assert.equal(push.data.ok, true);
  assert.equal(push.data.data.phase, 'battle');
  assert.equal(push.data.data.seq, 1);
});

test('pvp-stub: pvp_push_data accepts the guest token', async () => {
  const c = mockSupabaseClient();
  const create = await c.rpc('try_create_pvp_room', { p_code: 'ROOM03', p_data: {} });
  const join = await c.rpc('try_join_pvp_room', { p_room_id: create.data.id, p_guest_name: 'Bob' });
  const push = await c.rpc('pvp_push_data', {
    p_room_id: create.data.id,
    p_token: join.data.guest_token,
    p_patch: { p2_pick: 'Charizard' },
  });
  assert.equal(push.data.ok, true);
  assert.equal(push.data.data.p2_pick, 'Charizard');
});

test('pvp-stub: pvp_push_data REJECTS an unknown token (ISSUE-020 regression)', async () => {
  const c = mockSupabaseClient();
  const create = await c.rpc('try_create_pvp_room', { p_code: 'ROOM04', p_data: {} });
  const push = await c.rpc('pvp_push_data', {
    p_room_id: create.data.id,
    p_token: 'attacker-token-not-issued',
    p_patch: { phase: 'attacker_controlled' },
  });
  assert.equal(push.data.ok, false);
  assert.equal(push.data.error, 'token_mismatch');
});

test('pvp-stub: online-pvp.js source uses try_create_pvp_room + pvp_push_data RPCs', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  assert.match(src, /sb\.rpc\(\s*['"]try_create_pvp_room['"]/, 'createRoom must call try_create_pvp_room');
  assert.match(src, /sb\.rpc\(\s*['"]pvp_push_data['"]/, 'pushData must call pvp_push_data');
  // No direct from('pvp_rooms').update() or .insert() remains
  assert.doesNotMatch(src, /from\(['"]pvp_rooms['"]\)\.update\(/);
  assert.doesNotMatch(src, /from\(['"]pvp_rooms['"]\)\.insert\(/);
});

test('pvp-stub: online-pvp.js source captures the host_token and guest_token in module state', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  assert.match(src, /roomToken/, 'module-level roomToken declared');
  assert.match(src, /roomToken\s*=\s*rpcRes\.host_token/, 'host_token captured from try_create_pvp_room');
  assert.match(src, /roomToken\s*=\s*jr\.guest_token/, 'guest_token captured from try_join_pvp_room');
});

test('pvp-stub: _pushDataImpl propagates write failures (ISSUE-019, post-005)', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  // After migration 005, _pushDataImpl calls pvp_push_data RPC instead of
  // direct UPDATE. The error contract is: RPC transport errors throw rpcErr;
  // RPC-level rejections (ok:false) throw an Error with the rejection reason.
  // Both must propagate so the caller's .catch can surface UI; pre-fix the
  // direct UPDATE pathway silently swallowed upErr.
  const start = src.indexOf('async _pushDataImpl');
  const end = src.indexOf('\n        }', start);
  const body = src.slice(start, end);
  assert.match(body, /pvp_push_data/, 'must use pvp_push_data RPC');
  assert.match(body, /throw\s+rpcErr/, 'RPC transport errors must re-throw');
  assert.match(body, /throw\s+new\s+Error\(\s*['"]pvp_push_data/, 'RPC-level rejection must throw with reason');
});

test('pvp-stub: _onRemoteRow does not bump lastRemoteSeq before handler succeeds (ISSUE-010)', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  // Locate the _onRemoteRow body
  const start = src.indexOf('_onRemoteRow(newRow)');
  const body = src.slice(start, start + 1200);
  // The order inside .then(async () => { ... }) must be:
  //   1. read incoming seq
  //   2. (await handler)
  //   3. lastRemoteSeq = incoming
  const lastSeqAssignIdx = body.indexOf('lastRemoteSeq =');
  const handlerAwaitIdx = body.search(/await\s+Promise\.(race|resolve)/);
  assert.ok(handlerAwaitIdx > 0, 'await on handler present');
  assert.ok(lastSeqAssignIdx > handlerAwaitIdx, 'lastRemoteSeq must be assigned AFTER the handler await; pre-fix it was before');
});

test('pvp-stub: _onRemoteRow races handler against a timeout (ISSUE-021)', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  const start = src.indexOf('_onRemoteRow(newRow)');
  const body = src.slice(start, start + 1200);
  assert.match(body, /Promise\.race\s*\(/, 'must use Promise.race against a timeout');
  assert.match(body, /onOnlineRoomData timeout/, 'must reject with a labeled timeout error');
});

test('pvp-stub: simulate the bumped-then-thrown anti-pattern is gone', async () => {
  // Reproduce a tiny version of the fixed _onRemoteRow:
  let lastSeq = 0;
  async function correctOnRemoteRow(d, handler) {
    const incoming = d.seq || 0;
    if (incoming <= lastSeq) return;
    const handlerP = Promise.resolve(handler(d));
    const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 50));
    await Promise.race([handlerP, timeoutP]);
    lastSeq = incoming;
  }
  // Throwing handler should leave lastSeq UNCHANGED so a retry can re-deliver
  await correctOnRemoteRow({ seq: 5 }, () => { throw new Error('boom'); }).catch(() => {});
  assert.equal(lastSeq, 0, 'thrown handler must not bump lastSeq');
  // Successful handler bumps it
  await correctOnRemoteRow({ seq: 5 }, () => {});
  assert.equal(lastSeq, 5, 'successful handler bumps lastSeq');
});
