---
severity: P0
category: security
anchor_symbol: pvp_push_data
file: supabase/migrations/005_online_pvp_room_tokens.sql
current_line_hint: ~67
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0001
confidence: high
status: open
---

**Title**: Per-room host/guest tokens are stored inside world-readable `data` jsonb — token auth is self-defeating

**Evidence**:
```sql
-- 005: tokens embedded in the same jsonb that SELECT exposes to everyone
host_token := encode(gen_random_bytes(24), 'hex');
merged := p_data || jsonb_build_object('host_token', host_token);
-- ... and SELECT policy (001/004) stays:
create policy "pvp_rooms_select" on public.pvp_rooms for select to anon, authenticated using (true);
```

**Repro**: With the public anon key from `online-config.js`, run `supabase.from('pvp_rooms').select('*')` (or subscribe to `postgres_changes`). Every row's `data.host_token` and `data.guest_token` are returned in plaintext. Pass a scraped token to `pvp_push_data(p_room_id, stolen_token, {...})` and you can clobber any live match's draft/battle state.

**Blast radius**: Defeats the entire migration-005 token scheme. The 004/005 comments claim "clients must use pvp_push_data with a valid token" as the access control, but the secret that gates that RPC is published to every anon reader via the always-open SELECT and via realtime UPDATE broadcasts (`_onRemoteRow` receives `payload.new` containing the tokens). Equivalent to the pre-004 "open UPDATE keyed on room id" — an attacker now needs the token, but the token is free. Affects every concurrent room. Combined with the bypassable battle-log sanitizer (separate finding), restores the remote-DOM script-injection path against peers.

**Fix sketch**: Move tokens out of `data` jsonb into dedicated columns and stop returning them via SELECT/realtime: either a separate `pvp_room_tokens` table with RLS `using(false)` (only the SECURITY DEFINER RPCs read it), or store a hash of the token and have the client keep the only plaintext copy. The `data` jsonb the client subscribes to must never contain the token.

**Verification**: `tests/integration/pvp-stub.test.js` — assert that the object returned by `fetchRoomByCode`/the realtime payload contains no `host_token`/`guest_token` key; assert `pvp_push_data` with a token read from a SELECT result is rejected.

## 

---
severity: P0
category: security
anchor_symbol: sanitizeBattleLogHtml
file: online-pvp.js
current_line_hint: ~234
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0002
confidence: high
status: open
---

**Title**: `applyBattleLogHtml` regex sanitizer is bypassable — remote `battle_log_html` still reaches `innerHTML`

**Evidence**:
```js
function applyBattleLogHtml(html) {
  const el = global.document.getElementById('battle-log');
  el.innerHTML = sanitizeBattleLogHtml(typeof html === 'string' ? html : '');
}
// sanitizeBattleLogHtml uses regex strip of <script>/on*=/javascript: only
```

**Repro**: `node` harness against `sanitizeBattleLogHtml` shows survivors: `<img src=\`x\`onerror=alert(1)>` (backtick-quoted attr — the `on*=` regex requires whitespace before `on`, none exists after a backtick) passes through unchanged; `<a href="jav&#x09;ascript:alert(1)">` (HTML-entity-encoded scheme) passes because the regex only matches literal `javascript:`. An attacker who knows a room id + token (see token-leak finding) writes `battle_log_html` via `pvp_push_data`; `guestApplyBattleStart`/`guestApplyBattleBlob` then call `applyBattleLogHtml` on the peer.

**Blast radius**: Script execution in the victim peer's page (full DOM/localStorage access, incl. display name + any site state). This is the prior P0 XSS — it is MITIGATED (regex blocklist added) but NOT closed; regex HTML sanitization is a known-broken approach. The two callers `guestApplyBattleStart` (line ~808) and `guestApplyBattleBlob` (line ~833) both feed remote data in.

**Fix sketch**: Stop trusting a regex blocklist. Either rebuild the battle log from structured data the host sends (text + a fixed enum of span classes) and construct DOM with `textContent`, or run the HTML through DOMPurify with an allowlist of tags/attrs. Never `innerHTML` attacker-influenceable strings.

**Verification**: Add the bypass vectors above to `tests/integration/pvp-stub.test.js`; assert no `onerror`/`onload`/`javascript:` survives and (better) that only allowlisted tags remain.

## 

---
severity: P1
category: bug
anchor_symbol: pushData
file: online-pvp.js
current_line_hint: ~503
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0003
confidence: high
status: open
---

**Title**: `pushData` queue swallows write failures to `console.warn` and advances — local state silently diverges from Supabase

**Evidence**:
```js
const op = pushDataQueue.then(() => this._pushDataImpl(patch, existingData));
pushDataQueue = op.catch((e) => { console.warn('[OnlinePvP] pushData queue', e); });
return op;
```

**Repro**: Force `pvp_push_data` to return `{ok:false}` (token_mismatch / data_too_large) or throw (network drop). `_pushDataImpl` throws; `op` rejects. The returned `op` lets a caller that `await`s see it, but most callers (`handleSelectDraft`, `_hostRunResolution`, `afterHostStartBattle`) `await this.pushData(...)` inside a larger `try`-less flow or ignore it, and `pushDataQueue` is reassigned to the swallowed `.catch` so the NEXT queued push proceeds as if the failed one had landed. The host's local `state` advanced (e.g. `currentPlayer` flipped, turn resolved) but Supabase did not — peers never receive the update and diverge permanently.

**Blast radius**: Every write path. The whole point of the comment at `_pushDataImpl` ("surface the write failure upstream") is undercut because the queue tail (`pushDataQueue`) is the swallowed promise, and no caller has retry/rollback. Desync is unrecoverable mid-match.

**Fix sketch**: On a failed push, signal the UI (surface an "online sync failed" state and pause local turn progression) rather than only `console.warn`; consider not advancing local `currentPlayer`/turn until the push resolves, or implement a bounded retry before declaring the room desynced.

**Verification**: `tests/integration/pvp-stub.test.js` — mock the RPC to reject once, assert a desync/error signal is raised and that local state was not advanced past the failed push.

## 

---
severity: P1
category: bug
anchor_symbol: _onRemoteRow
file: online-pvp.js
current_line_hint: ~556
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0004
confidence: medium
status: open
---

**Title**: `lastRemoteSeq` is bumped on handler timeout, permanently skipping the timed-out remote update

**Evidence**:
```js
const handlerP = Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error('onOnlineRoomData timeout')), 10000));
await Promise.race([handlerP, timeoutP]);
lastRemoteSeq = incoming || lastRemoteSeq + 1;   // only runs if race didn't reject
```

**Repro**: The thrown-handler case is fixed (a reject skips the `lastRemoteSeq=` line and the outer `.catch` logs it), so a later row with the same seq could still apply. BUT note the ordering subtlety: the timeout was ADDED to fix a hang, yet a real hang now rejects → `lastRemoteSeq` is NOT bumped (good), but the in-flight `handlerP` keeps running detached and may apply state out of order relative to the next queued row whose seq is now > the stalled one. Two events whose ordering matters: (a) the detached `handlerP` from the timed-out row finally resolving, (b) the next row's handler that already ran and bumped `lastRemoteSeq`. (a) can clobber (b)'s applied state with stale data.

**Blast radius**: Guest sees a turn briefly revert to an older snapshot when a slow handler completes after the next update already applied. Visual/state flicker; with the desync from the pushData finding, can wedge the match.

**Fix sketch**: When the timeout wins the race, also cancel/guard the detached handler (e.g. capture the seq and have the handler no-op if `lastRemoteSeq` has since advanced past it), or make `onOnlineRoomData` idempotent and re-fetch the latest row instead of applying the stale `d`.

**Verification**: In `tests/integration/pvp-stub.test.js`, make one handler hang past 10s, fire a newer row, then resolve the hung handler; assert final applied state equals the newer row.

## 

---
severity: P2
category: security
anchor_symbol: pvp_rooms_select
file: supabase/migrations/004_online_pvp_rls_tighten.sql
current_line_hint: ~47
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0005
confidence: high
status: open
---

**Title**: `pvp_rooms` SELECT remains `using(true)` — any anon client can scrape every live match's full state

**Evidence**:
```sql
create policy "pvp_rooms_select" on public.pvp_rooms for select
  to anon, authenticated using (true);
```

**Repro**: `supabase.from('pvp_rooms').select('*')` with the public anon key returns every room row: codes, display names, drafts, battle snapshots — and (per the token-leak finding) the tokens. The prior P0 "open UPDATE/DELETE/INSERT" is genuinely fixed (004 dropped DELETE; 005 set INSERT/UPDATE `using/with check (false)` and routes writes through token RPCs), so this SELECT gap is the remaining piece of that cluster and is P2 ON ITS OWN — but it becomes P0 because it also leaks the tokens (filed separately).

**Blast radius**: Spectator privacy leak (live match scraping, enumerate all active room codes, harvest display names). Independent of the token leak.

**Fix sketch**: Realtime postgres-changes can work with a filtered SELECT policy if you gate on a column the subscriber proves it knows (e.g. require the room id in the channel filter and add a SECURITY DEFINER read RPC for the join-by-code path). At minimum, exclude token columns from anything SELECT can reach (see token finding).

**Verification**: Attempt unfiltered `select('*')` with anon key in `tests/integration/pvp-stub.test.js` and assert it returns 0 rows / errors, while the room owner's filtered subscription still receives updates.

## 

---
severity: P2
category: bug
anchor_symbol: applyHostMatchOptions
file: online-pvp.js
current_line_hint: ~322
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0006
confidence: medium
status: open
---

**Title**: Cluster of silent `.catch(console.warn)` sites hide real failures from the user

**Evidence**:
```js
// line ~322 applyHostMatchOptions:  .catch((e) => console.warn(...))
// line ~503 pushData queue:         op.catch((e) => console.warn(...))
// line ~558 _onRemoteRow:           .catch((e) => console.warn(...))
// plus ~12 inline await sites that only console.warn on rowErr and return
```

**Repro**: Disconnect the network mid-match. Fetches/RPCs fail; the only signal is `console.warn` the player never sees; the UI proceeds as if everything synced. `applyHostMatchOptions` silently skips applying match options (guest may play with wrong format/timer). `_onRemoteRow`'s catch eats handler errors with no recovery.

**Blast radius**: Whole online layer fails open silently. The three trailing `.catch` sites plus the ~12 `if (rowErr) { console.warn(...); return; }` early-returns (e.g. `_hostRunResolution`, `afterHostStartBattle`, `handlePvPPlayTurn`, `reportWinIfConfigured`) all share the pattern: a server error becomes a no-op with no user feedback and no retry.

**Fix sketch**: Route online-layer failures to a single user-visible "connection lost / sync failed" banner with a retry/leave action; keep `console.warn` for diagnostics but stop treating warn as the terminal handler.

**Verification**: Mock each RPC/fetch to fail in `tests/integration/pvp-stub.test.js`; assert a user-facing error signal is emitted rather than a silent return.

## 

---
severity: P3
category: bug
anchor_symbol: deepClone
file: online-pvp.js
current_line_hint: ~72
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0007
confidence: low
status: open
---

**Title**: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` which silently drops `Set`/`undefined` in cloned state

**Evidence**:
```js
function deepClone(o) {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}
```

**Repro**: On engines without `structuredClone` (older WebViews), `deepClone(state.pSide)` etc. drops any `Set` (note `state.revealedFoe` is a `Set` — handled explicitly in `exportBattleSnapshot`, but `pSide`/`fSide`/gimmick intents are cloned blindly). A `Set` in a side object would serialize to `{}`.

**Blast radius**: Snapshot fidelity on legacy browsers only; `structuredClone` is widely available so this is latent. `structuredClone` itself throws on functions/DOM nodes — neither path clones cleanly if such values ever enter side state.

**Fix sketch**: Audit that `pSide`/`fSide`/`p1GimmickIntent`/`p2GimmickIntent` contain only JSON-safe + Set values; if Sets are possible, convert to arrays in `exportBattleSnapshot` like `revealedFoe`. Otherwise document the JSON-only contract.

**Verification**: Add an assertion in the snapshot round-trip test that re-imported side objects deep-equal the originals on both clone paths.
