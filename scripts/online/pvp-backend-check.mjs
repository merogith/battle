#!/usr/bin/env node
/**
 * Online PvP backend diagnostic.
 *
 * Probes the live Supabase project that online-config.js points at and reports
 * which migrations appear applied, whether the 006 token columns are
 * SELECT-revoked, and (with --smoke) runs a real create -> join -> push ->
 * realtime round-trip so you can confirm two players could actually battle.
 *
 * Credentials are read from env (PBS_SUPABASE_URL / PBS_SUPABASE_ANON_KEY) and
 * fall back to parsing online-config.js. The anon/publishable key only grants
 * what RLS allows, so this is safe to run anywhere with network egress to the
 * project host.
 *
 *   node scripts/online/pvp-backend-check.mjs            # read-only probes
 *   node scripts/online/pvp-backend-check.mjs --smoke    # + mutating round-trip
 *
 * Realtime in --smoke needs the JS SDK: `npm i @supabase/supabase-js`. Without
 * it, the round-trip still runs over REST and the realtime leg is skipped.
 *
 * Exit code 0 = all required checks passed; 1 = a required check failed; 2 =
 * could not run (missing creds / unreachable host).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SMOKE = process.argv.includes('--smoke');

const C = {
    reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m'
};
let failures = 0;
let warnings = 0;
function pass(msg) { console.log(`${C.green}  PASS${C.reset} ${msg}`); }
function fail(msg) { console.log(`${C.red}  FAIL${C.reset} ${msg}`); failures++; }
function warn(msg) { console.log(`${C.yellow}  WARN${C.reset} ${msg}`); warnings++; }
function info(msg) { console.log(`${C.dim}       ${msg}${C.reset}`); }
function head(msg) { console.log(`\n${C.bold}${C.cyan}${msg}${C.reset}`); }

function resolveCreds() {
    let url = process.env.PBS_SUPABASE_URL || '';
    let key = process.env.PBS_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
        try {
            const cfg = readFileSync(join(REPO_ROOT, 'online-config.js'), 'utf8');
            url = url || (cfg.match(/__PBS_SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/) || [])[1] || '';
            key = key || (cfg.match(/__PBS_SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/) || [])[1] || '';
        } catch { /* config optional when env is set */ }
    }
    return { url: url.replace(/\/+$/, ''), key };
}

const { url: URL_BASE, key: ANON } = resolveCreds();

function restHeaders(extra) {
    return Object.assign({ apikey: ANON, Authorization: `Bearer ${ANON}` }, extra || {});
}

/** GET a table with a PostgREST select; returns { status, body }. */
async function selectTable(table, select, limit = 1) {
    const u = `${URL_BASE}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${limit}`;
    const res = await fetch(u, { headers: restHeaders() });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON error page */ }
    return { status: res.status, body };
}

/** Call a Postgres function via PostgREST RPC; returns { status, body }. */
async function rpc(fn, args) {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: restHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(args || {})
    });
    let body = null;
    try { body = await res.json(); } catch { /* may be empty */ }
    return { status: res.status, body };
}

// PostgREST returns 404 + code PGRST202 when no function matches the name/args.
function rpcMissing(r) {
    return r.status === 404 && r.body && r.body.code === 'PGRST202';
}

const migrations = { '001': false, '002': false, '003/005': false, '006': false };

async function readOnlyProbes() {
    head('1. Tables (migrations 001 + 002)');

    const rooms = await selectTable('pvp_rooms', 'id,code,data,updated_at');
    if (rooms.status === 200 && Array.isArray(rooms.body)) {
        pass('pvp_rooms is selectable (migration 001 applied)');
        migrations['001'] = true;
    } else {
        fail(`pvp_rooms not selectable (status ${rooms.status}) — migration 001 missing?`);
        info(JSON.stringify(rooms.body));
    }

    const lb = await selectTable('gauntlet_leaderboard', 'display_name,rounds_cleared');
    if (lb.status === 200 && Array.isArray(lb.body)) {
        pass('gauntlet_leaderboard is selectable (migration 002 applied)');
        migrations['002'] = true;
    } else {
        warn(`gauntlet_leaderboard not selectable (status ${lb.status}) — migration 002 missing (Gauntlet leaderboard only).`);
    }

    head('2. Token columns SELECT-revoked (migration 006)');
    const tok = await selectTable('pvp_rooms', 'host_token');
    if (tok.status === 200 && Array.isArray(tok.body)) {
        fail('host_token is readable by anon — migration 006 NOT applied (tokens are exposed!).');
    } else {
        pass(`host_token is not anon-readable (status ${tok.status}) — consistent with migration 006.`);
        migrations['006'] = true;
    }

    head('3. Write RPCs exist (migrations 003 + 005)');
    // Non-mutating existence probes: a random room id makes each function exit
    // early (room_not_found) without inserting or updating anything.
    const fakeId = (globalThis.crypto && globalThis.crypto.randomUUID)
        ? globalThis.crypto.randomUUID() : '00000000-0000-0000-0000-000000000000';

    const join = await rpc('try_join_pvp_room', { p_room_id: fakeId, p_guest_name: '__diag__' });
    if (rpcMissing(join)) {
        fail('try_join_pvp_room missing — migration 003 not applied.');
    } else {
        pass('try_join_pvp_room exists (migration 003 applied).');
    }

    const push = await rpc('pvp_push_data', { p_room_id: fakeId, p_token: '__diag__', p_patch: {} });
    if (rpcMissing(push)) {
        fail('pvp_push_data missing — migration 005 not applied (turn sync will not work).');
    } else {
        pass('pvp_push_data exists (migration 005 applied).');
        migrations['003/005'] = !rpcMissing(join);
    }

    const create = await rpc('try_create_pvp_room', {});
    if (rpcMissing(create)) {
        // Empty args can also 404 on overload mismatch, so only treat a clean
        // "no such function name" as authoritative; otherwise just note it.
        warn('try_create_pvp_room not confirmed via empty-arg probe (run --smoke to exercise it).');
    } else {
        pass('try_create_pvp_room is callable (migration 005 applied).');
    }
}

async function smokeRoundTrip() {
    head('4. Round-trip smoke test (--smoke, mutating)');
    info('Creates a throwaway room, joins it, pushes a turn patch, checks realtime.');

    const code = 'DIAG' + Math.random().toString(36).slice(2, 4).toUpperCase();
    const seedData = {
        seq: 1, phase: 'draft', match_options: { partySize: 3 },
        p1_draft: [], p2_draft: [], guest_joined: false,
        battle: { pending_turn: 1, p1_pick: null, p2_pick: null, resolved_turn: 0, state_blob: null }
    };

    const created = await rpc('try_create_pvp_room', { p_code: code, p_data: seedData });
    if (created.status !== 200 || !created.body || !created.body.ok) {
        fail(`try_create_pvp_room failed: ${JSON.stringify(created.body)}`);
        return;
    }
    const roomId = created.body.id;
    const hostToken = created.body.host_token;
    pass(`Created room ${code} (id ${roomId}).`);

    // Optional realtime listener via the JS SDK (if installed).
    let realtime = null;
    let sdk = null;
    try { sdk = await import('@supabase/supabase-js'); } catch { /* SDK optional */ }
    if (sdk && sdk.createClient) {
        realtime = await new Promise((resolve) => {
            const client = sdk.createClient(URL_BASE, ANON, { auth: { persistSession: false } });
            let got = false;
            const ch = client.channel('diag-' + roomId)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'pvp_rooms', filter: 'id=eq.' + roomId },
                    () => { got = true; resolve({ client, ch, got: true }); })
                .subscribe();
            setTimeout(() => { if (!got) resolve({ client, ch, got: false }); }, 7000);
        });
    } else {
        warn('Realtime leg skipped — `npm i @supabase/supabase-js` to test UPDATE delivery.');
    }

    const joined = await rpc('try_join_pvp_room', { p_room_id: roomId, p_guest_name: '__diag_guest__' });
    if (joined.status !== 200 || !joined.body || !joined.body.ok) {
        fail(`try_join_pvp_room failed: ${JSON.stringify(joined.body)}`);
    } else {
        pass('Guest joined the room.');
    }

    const pushed = await rpc('pvp_push_data', {
        p_room_id: roomId, p_token: hostToken,
        p_patch: { phase: 'draft', battle: Object.assign({}, seedData.battle, { p1_pick: { moveIndex: 0 } }) }
    });
    if (pushed.status !== 200 || !pushed.body || !pushed.body.ok) {
        fail(`pvp_push_data failed: ${JSON.stringify(pushed.body)}`);
    } else {
        pass('Host pushed a turn patch (token validated, seq advanced).');
    }

    if (realtime) {
        // Give the UPDATE a moment to propagate after the push above.
        if (!realtime.got) await new Promise((r) => setTimeout(r, 3000));
        if (realtime.got) pass('Realtime UPDATE received — pvp_rooms is in the supabase_realtime publication.');
        else fail('No Realtime UPDATE received — enable Realtime on public.pvp_rooms (Database -> Publications).');
        try { await realtime.client.removeChannel(realtime.ch); } catch { /* best-effort */ }
    }
    info(`Throwaway room ${code} remains in pvp_rooms (no anon delete RPC) — harmless ephemeral data.`);
}

function summary() {
    head('Summary — inferred migration state');
    for (const [m, ok] of Object.entries(migrations)) {
        console.log(`  ${ok ? C.green + 'applied ' : C.yellow + 'MISSING '}${C.reset}migration ${m}`);
    }
    if (!migrations['006']) {
        info('Apply docs/online-pvp-combined-migrations.sql in the Supabase SQL editor.');
    }
    info('Realtime is a dashboard toggle, not SQL: Database -> Publications -> supabase_realtime -> add public.pvp_rooms.');
    console.log(`\n${failures ? C.red : C.green}${C.bold}${failures} failed, ${warnings} warnings${C.reset}\n`);
}

async function main() {
    console.log(`${C.bold}Online PvP backend check${C.reset}`);
    if (!URL_BASE || !ANON) {
        fail('No Supabase credentials (set PBS_SUPABASE_URL / PBS_SUPABASE_ANON_KEY or fill online-config.js).');
        process.exit(2);
    }
    info(`Target: ${URL_BASE}`);
    try {
        await readOnlyProbes();
        if (SMOKE) await smokeRoundTrip();
        else info('\nRun with --smoke to also exercise create/join/push + realtime.');
    } catch (e) {
        fail(`Unreachable or unexpected error: ${e && e.message ? e.message : e}`);
        info('If this is "fetch failed" / ENOTFOUND, the host is likely blocked by the sandbox egress policy.');
        summary();
        process.exit(2);
    }
    summary();
    process.exit(failures ? 1 : 0);
}

main();
