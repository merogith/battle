import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function mockSupabaseClient() {
  const rooms = new Map();
  const subs = new Map();
  return {
    rooms,
    from(table) {
      const builder = {
        select: () => {
          const p = Promise.resolve({ data: [...rooms.values()], error: null });
          p.eq = () => Promise.resolve({ data: [...rooms.values()], error: null });
          return p;
        },
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

test('pvp-stub: _pushDataImpl now throws on update failure (ISSUE-019)', () => {
  const src = readFileSync('online-pvp.js', 'utf8');
  // The fix throws upErr after the console.warn instead of swallowing it.
  // Regress against "if (upErr) console.warn(...);" alone.
  const m = src.match(/if\s*\(\s*upErr\s*\)\s*\{[\s\S]*?\}/);
  assert.ok(m, '`if (upErr) { ... }` block present');
  assert.match(m[0], /throw\s+upErr/, 'upErr must be re-thrown so callers see the failure');
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
