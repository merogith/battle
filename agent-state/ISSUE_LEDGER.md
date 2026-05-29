# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-05-29T17:51:08.520Z
> **Source**: `agent-state/findings/*.md` (61 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 2 |
| P1 | 13 |
| P2 | 19 |
| P3 | 27 |
| **Total** | **61** |

| Category | Count |
|---|---|
| a11y | 4 |
| balance | 2 |
| bug | 13 |
| data | 5 |
| dx | 7 |
| inconsistency | 18 |
| perf | 4 |
| refactor | 1 |
| security | 3 |
| test-gap | 4 |

## TOC

- [ISSUE-001] [P0] Per-room host/guest tokens are stored inside world-readable `data` jsonb — token auth is self-defeating — `pvp_push_data` (security)
- [ISSUE-002] [P0] `applyBattleLogHtml` regex sanitizer is bypassable — remote `battle_log_html` still reaches `innerHTML` — `sanitizeBattleLogHtml` (security)
- [ISSUE-003] [P1] Professor "Choose This Pokémon" pick cards are click-only divs — keyboard/SR users can't select a starter/team mon — `_buildProfPickCardElement` (a11y)
- [ISSUE-004] [P1] Master Ball consumed but Caged God rejected when party 6/6 + PC 30/30 — unique ball lost, no refund — `_catchHandleSuccess` (bug)
- [ISSUE-005] [P1] `lastRemoteSeq` is bumped on handler timeout, permanently skipping the timed-out remote update — `_onRemoteRow` (bug)
- [ISSUE-006] [P1] League foe boost now stacks ADDITIVELY with difficulty; spec §8/§15c documents multiplicative — `applyFoeDifficultyScaling` (inconsistency)
- [ISSUE-007] [P1] Fresh story run starts with 0 Poké Balls; spec promises 5 in three places — `balls` (inconsistency)
- [ISSUE-008] [P1] Sleep wakes & acts on the same turn (off-by-one): ~1/3 of sleeps cost the target 0 turns — `canMove` (bug)
- [ISSUE-009] [P1] canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift — `canMove` (inconsistency)
- [ISSUE-010] [P1] `cityIndexFromEventIndex` fed a ROW ID instead of array index → intro Rival (row 68) scales as City 9 (fully-evolved, hidden abilities, top items, T4) — `cityIndexFromEventIndex` (bug)
- [ISSUE-011] [P1] City-name lookup feeds an array index into a row-ID-keyed map → City 3 always shows "City 3" — `GYM_CITY_LEADER_EVENT` (bug)
- [ISSUE-012] [P1] parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift — `parseMoveEffects` (inconsistency)
- [ISSUE-013] [P1] `pushData` queue swallows write failures to `console.warn` and advances — local state silently diverges from Supabase — `pushData` (bug)
- [ISSUE-014] [P1] Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init — `startBattle` (inconsistency)
- [ISSUE-015] [P1] `startBattle` reads bare `sm` (ReferenceError) → story boss/raid BOSS_CONFIGS mechanics never init — `startBattle` (bug)
- [ISSUE-016] [P2] Cold-open / intro-rival narrative overlay is not a dialog — no role/aria-modal/label, no ESC, no focus management — `_renderNarrativeOverlay` (a11y)
- [ISSUE-017] [P2] Cluster of silent `.catch(console.warn)` sites hide real failures from the user — `applyHostMatchOptions` (bug)
- [ISSUE-018] [P2] Confusion self-hit ignores the confused mon's Atk/Def stat-stage boosts — `canMove` (bug)
- [ISSUE-019] [P2] STORY_FEATURES_INTEGRATION "shipped" sections gate balls/PC/wild on catchMode; no such setting exists — `catchMode` (inconsistency)
- [ISSUE-020] [P2] Regular ball consumed with no refund when a successful catch is rejected at party-full + PC-full — `catchThrow` (bug)
- [ISSUE-021] [P2] Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv — `convertSmogonSet` (data)
- [ISSUE-022] [P2] 351 it.todo() move tests cluster into 31 setup-shapes; 9 clusters retire 70% of the gap — `describe('Status moves')` (test-gap)
- [ISSUE-023] [P2] gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive) — `fetchSmogonSetsForGen` (data)
- [ISSUE-024] [P2] Early-game softening uses city-indexed [0.80,0.85,0.90]; spec §8/§15f names badge/event constants — `FOE_STAT_NERF_BY_CITY` (inconsistency)
- [ISSUE-025] [P2] loadGameData ~299 ms engine-only (>1.5× 200 ms boot target), dominated by parseCSV over the 2.56 MB builds.csv — `loadBuildsCSV` (perf)
- [ISSUE-026] [P2] v22 migration rolls fresh villain/extra tracks on mid-run saves → road-anchored intro beats silently never fire — `migrateStoryPreV22` (inconsistency)
- [ISSUE-027] [P2] openModal saves/restores trigger focus but never moves focus INTO the dialog, and no modal has a focus trap — `openModal` (a11y)
- [ISSUE-028] [P2] `pcRelease` lacks the `unsellable` guard `pcSell` has — the boss-arc capture (Subject Zero) can be permanently released — `pcRelease` (bug)
- [ISSUE-029] [P2] `pvp_rooms` SELECT remains `using(true)` — any anon client can scrape every live match's full state — `pvp_rooms_select` (security)
- [ISSUE-030] [P2] online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8× — `reportWinIfConfigured` (refactor)
- [ISSUE-031] [P2] Confusion duration is always 2-4 turns (engine uses floor(rng*3)+2), Showdown is 1-4 — `setConfusionDuration` (balance)
- [ISSUE-032] [P2] Wild grade curve is city-keyed STORY_WILD_GRADE_BY_CITY; spec names badge-keyed _WILD_GRADE_CURVE_BY_BADGES — `STORY_WILD_GRADE_BY_CITY` (inconsistency)
- [ISSUE-033] [P2] Coin multiplier inverts the difficulty curve — harder modes earn less gold against tougher foes — `storyDifficultyCoinMult` (balance)
- [ISSUE-034] [P2] G4-strip keys on party-size (partyEverReached2), not badges; contradicts spec's "most important refactor" — `storyStripGrade4IfPartyMature` (inconsistency)
- [ISSUE-035] [P3] Party-cap "full" check counts eggs (`sm.team.length`) while foe-sizing / sell guards count only fighters — `_catchHandleSuccess` (inconsistency)
- [ISSUE-036] [P3] Two near-duplicate global Escape keydown handlers both close the topmost modal — `_modalEscapeBound` (dx)
- [ISSUE-037] [P3] Catch-tutorial ball gate counts the Master Ball, which can never be thrown outside boss mode — `_shouldFireCatchTutorialBeforeBattle` (inconsistency)
- [ISSUE-038] [P3] Story tutorial overlay is a proper dialog but lacks a focus trap (Tab escapes to background) — `_showStoryTutorialScene` (a11y)
- [ISSUE-039] [P3] Comment claims foe sizing matches player team length, but code uses the badge curve — `_storyEnemyPartySize` (inconsistency)
- [ISSUE-040] [P3] Memory growth across 70 turns is non-leaking (flat ~104 MB post-GC) — prior "benign linear ~25 KB/turn" re-confirmed (no super-linear retention) — `benchMemoryGrowth` (perf)
- [ISSUE-041] [P3] perf-bench covers boot/turn/parseMove/memory but cannot benchmark rollTrainerTeam, makeWildBuild, or build power tiers (not exposed on window/__engine) — `benchParseMove` (dx)
- [ISSUE-042] [P3] Catch flee/wobble flavor messages use `Math.random()` instead of `storyRngNext()`, breaking seed determinism — `catchThrow` (bug)
- [ISSUE-043] [P3] CODEBASE_MAP guardrails grossly stale: claims 29,908 lines / CSS 16-4156; file is 60,040 lines — `CODEBASE_MAP` (dx)
- [ISSUE-044] [P3] A future-version save shows "Continue Run" but silently bounces to the menu with no explanation — `continueRun` (dx)
- [ISSUE-045] [P3] 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows — `convertSmogonSet` (data)
- [ISSUE-046] [P3] `deepClone` falls back to `JSON.parse(JSON.stringify(...))` which silently drops `Set`/`undefined` in cloned state — `deepClone` (bug)
- [ISSUE-047] [P3] 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool — `LEADER_VICTORY_LINES` (inconsistency)
- [ISSUE-048] [P3] `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html) — `loadBuildsCSV` (data)
- [ISSUE-049] [P3] Unguarded 'dex probe Pikachu' console.log left in the data-load path — `loadGameData` (dx)
- [ISSUE-050] [P3] Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read — `loadGameData` (data)
- [ISSUE-051] [P3] 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX — `MOVE_SFX_MAP` (inconsistency)
- [ISSUE-052] [P3] Mystery Figure roster collapsed to single 'the_first' (v22); STORY_NARRATIVE_VARIANTS still documents 9-identity cast — `MYSTERY_FIGURE_IDENTITIES` (inconsistency)
- [ISSUE-053] [P3] Damage formula folds all modifiers into one multiply + single floor (no per-step pokeRound) — `parseMoveEffects` (inconsistency)
- [ISSUE-054] [P3] parseMoveEffects per-move variance (308× raw) is GC/JIT jitter, NOT a pathological move — real per-move cost ~0.014 ms — `parseMoveEffects` (perf)
- [ISSUE-055] [P3] Turn-loop tail (p95 ~30 ms, max ~46 ms vs ~6–20 ms median) is GC/jsdom-timer jitter, not a localizable per-turn hot path — `playTurn` (perf)
- [ISSUE-056] [P3] STORY_FEATURES_INTEGRATION §4 lists Safari fee ~500G; code + canonical flow say 10,000G — `SAFARI_ENTRY_COST` (inconsistency)
- [ISSUE-057] [P3] SAVE_VER is 22 with v21/v22 migrations; spec + ANCHOR_INDEX + CODEBASE_MAP stop at 15-20 — `SAVE_VER` (dx)
- [ISSUE-058] [P3] 66 allAdjacentFoes damaging moves are it.todo but assertable as plain HP-drop in singles — `spread-damaging` (test-gap)
- [ISSUE-059] [P3] 46 volatile-status moves are it.todo but assert with one mon.volatile flag check — `status-volatile` (test-gap)
- [ISSUE-060] [P3] Doc battle.html:LINE anchors stale across specs (18/50 drifted) + several renamed symbols — `STORY_EVENTS_RAW` (dx)
- [ISSUE-061] [P3] 28 conditional-BP moves need per-move precondition tuning before damage assertion — `variable-power-conditional` (test-gap)

---

## <a id="ISSUE-001"></a> ISSUE-001: Per-room host/guest tokens are stored inside world-readable `data` jsonb — token auth is self-defeating

---
id: ISSUE-001
severity: P0
category: security
anchor_symbol: pvp_push_data
current_line_hint: ~67
file: supabase/migrations/005_online_pvp_room_tokens.sql
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0001
confidence: high
status: fixed-claude/focused-cori-sGNzn
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

## <a id="ISSUE-002"></a> ISSUE-002: `applyBattleLogHtml` regex sanitizer is bypassable — remote `battle_log_html` still reaches `innerHTML`

---
id: ISSUE-002
severity: P0
category: security
anchor_symbol: sanitizeBattleLogHtml
current_line_hint: ~234
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: a1c0ffee0002
confidence: high
status: fixed-claude/focused-cori-sGNzn
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

## <a id="ISSUE-003"></a> ISSUE-003: Professor "Choose This Pokémon" pick cards are click-only divs — keyboard/SR users can't select a starter/team mon

---
id: ISSUE-003
severity: P1
category: a11y
anchor_symbol: _buildProfPickCardElement
current_line_hint: ~45388
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a448d3578603
confidence: high
status: open
---

**Title**: Professor "Choose This Pokémon" pick cards are click-only divs — keyboard/SR users can't select a starter/team mon

**Evidence**:
```js
const card = document.createElement('div');
card.className = `draft-card prof-pick-card tier-${tier}`;
card.innerHTML = `...`;
card.onclick = (e) => { if (e.target.closest('button, .hover-text, .type-badge, .draft-card-moves')) return; profSelectChoice(idx); };
return card;
```

**Repro**: Story → reach a Professor pick (any city prof choice, multi-choice mode). Tab through the screen: focus lands on the per-card ℹ button, the Accept button (disabled until a card is picked), and Back — but never on the cards themselves. With keyboard/SR only you cannot select a choice, so Accept stays disabled and the required action is unreachable.

**Blast radius**: Every Professor team-add event (the main way the team grows mid-run). Note the regular draft (`renderDraft`) already sets `role="button"`, `tabIndex=0`, `aria-label`, and an Enter/Space keydown — the professor card is the un-migrated twin, so this is a fixable inconsistency, not new design.

**Fix sketch**: Mirror `renderDraft`: give the card `role="button"`, `tabIndex=0`, an `aria-label` (name + grade + "select for your team"), and an Enter/Space keydown that calls `profSelectChoice(idx)`. Keep the inner ℹ/hover-text exclusions.

**Verification**: Tab to a prof card, press Enter — Accept enables and `prof-pick-card-selected` highlights. Re-run with a screen reader to confirm the card announces as a button.

---

## <a id="ISSUE-004"></a> ISSUE-004: Master Ball consumed but Caged God rejected when party 6/6 + PC 30/30 — unique ball lost, no refund

---
id: ISSUE-004
severity: P1
category: bug
anchor_symbol: _catchHandleSuccess
current_line_hint: ~49754
file: battle.html
agents: [story-mode-investigator]
fingerprint: 56bafb53d258
confidence: medium
status: open
---

**Title**: Master Ball consumed but Caged God rejected when party 6/6 + PC 30/30 — unique ball lost, no refund

**Evidence**:
```js
// catchThrow consumes the ball BEFORE resolving outcome (~49647):
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;     // master decremented in bossMode
...
if (outcome === 'catch') { _catchHandleSuccess(enc, ballKey); return; }
// _catchHandleSuccess (~49754):
if (partyFull && pcFull) {
    _catchFinishWithMessage(`Your party (.../6) and PC (30/30) are full. Free a slot ... then try again.`);
    return;   // caught mon discarded; ball NOT refunded
}
```
The Master Ball can only be thrown in boss mode (locked otherwise) and is unique (1 per run). If the player reaches the Caged God with party at the badge cap (6) AND PC at 30/30, a successful Master Ball roll is rejected for lack of space and the ball is gone — the "try again" instruction is impossible because the unique ball is consumed.

**Repro**: Fill party to 6 and PC to 30 (active-catcher run), enter the Caged God, throw the Master Ball → message tells you to free a slot and retry, but `sm.balls.master` is now 0 and cannot be re-obtained.

**Blast radius**: Caged God boss arc capture (Subject Zero). The non-boss path is only a wasted regular ball (annoyance), but the boss path is a hard arc soft-lock of the marquee post-game reward.

**Fix sketch**: Move the `partyFull && pcFull` check BEFORE ball consumption (block the throw with the message while the ball is intact), or refund the ball when the success is rejected for space. For boss mode, prefer blocking the throw entirely until a slot exists.

**Verification**: Repro above no longer consumes the Master Ball; the player can free a slot and re-throw.

---

## <a id="ISSUE-005"></a> ISSUE-005: `lastRemoteSeq` is bumped on handler timeout, permanently skipping the timed-out remote update

---
id: ISSUE-005
severity: P1
category: bug
anchor_symbol: _onRemoteRow
current_line_hint: ~556
file: online-pvp.js
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

## <a id="ISSUE-006"></a> ISSUE-006: League foe boost now stacks ADDITIVELY with difficulty; spec §8/§15c documents multiplicative

---
id: ISSUE-006
severity: P1
category: inconsistency
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~14584
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 264442eab1b8
confidence: high
status: open
---

**Title**: League foe boost now stacks ADDITIVELY with difficulty; spec §8/§15c documents multiplicative

**Evidence**:
```js
// code (~14584): league boost is additive delta on top of difficulty mult
const lb = mon._leagueStatBonus;
const hpMult   = mult + (lb && lb.hp   ? lb.hp   : 0);
// comment: "stack ADDITIVELY (not multiplicatively). Stops the 1.30 x 1.40 = 1.82 cliff"
```

**Repro**: Inspect Champion HP on Hard. STORY_MODE_FLOW.md §8 says "applied **before** applyFoeDifficultyScaling, so the two stack **multiplicatively**. Champion HP on Hard ~= x1.30 x x1.15 = x1.495." §15c repeats the multiplicative model ("base x 1.40 x 1.30 x 1.15 = base x 2.09"). Code is additive.

**Blast radius**: Every E1-E4 / Champion / league Rival / post-HoF Mystery / Crucible-Hard fight scales differently than the spec's worked examples; any balance reasoning or QA derived from the spec's numbers is wrong. The spec's headline Champion-HP figures are unreachable in code.

**Fix sketch**: Update STORY_MODE_FLOW.md §8 and §15c to describe the additive stacking model that ships (and the cliff it intentionally removes), or change the code back to multiplicative if the spec is authoritative on intent.

**Verification**: Pick one foe, log `mon.maxHp` before/after `applyFoeDifficultyScaling` on Hard for E1; confirm it matches whichever model is declared canonical.

---

## <a id="ISSUE-007"></a> ISSUE-007: Fresh story run starts with 0 Poké Balls; spec promises 5 in three places

---
id: ISSUE-007
severity: P1
category: inconsistency
anchor_symbol: balls
current_line_hint: ~34902
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 3a000383b7a4
confidence: high
status: open
---

**Title**: Fresh story run starts with 0 Poké Balls; spec promises 5 in three places

**Evidence**:
```js
// fresh-state default block (~34902) AND _readStorylineFromUI fresh run (~38954):
balls: { poke: 0, great: 0, ultra: 0, master: 0 },
// only the v14->v15 migration grants 5 (so MIGRATED saves get 5, fresh runs get 0):
sm.balls = { poke: 5, great: 0, ultra: 0, master: 0 };   // line 34815
```

**Repro**: Start a brand-new story run (not a migrated save). `sm.balls.poke === 0`. Spec STORY_MODE_FLOW.md §1 ("Start the run with 5 PokéBalls"), §6 (PokéBall "+ 5 at run start"), and §10 (`balls: { poke: 5, ... }`) all promise 5.

**Blast radius**: Catch tutorial fires a guaranteed catch (no ball consumed), but the first real route wild after Gym 1 has no ball to throw until the player buys one at the Mart (300G) — a worse new-player experience than spec'd. Migrated saves vs. fresh runs diverge.

**Fix sketch**: Set `poke: 5` in both fresh-state default blocks (the `sm` defaults and the `_readStorylineFromUI` new-run path) to match the migration and the spec; or update the spec if 0 is intentional.

**Verification**: Open a fresh run, confirm `window.StoryMode.state.balls.poke === 5` before the first route encounter.

---

## <a id="ISSUE-008"></a> ISSUE-008: Sleep wakes & acts on the same turn (off-by-one): ~1/3 of sleeps cost the target 0 turns

---
id: ISSUE-008
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~26025
file: battle.html
agents: [battle-engine-debugger]
fingerprint: ae180cf0e424
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Sleep wakes & acts on the same turn (off-by-one): ~1/3 of sleeps cost the target 0 turns

**Evidence**:
```js
if (mon.status === "SLP") {
    mon.statusTurns++;                       // increment BEFORE the check
    let wakeThreshold = mon.sleepDuration || 2;
    if (mon.statusTurns >= wakeThreshold) { mon.status = null; ...; return true; } // wakes AND acts
```
`applyStatus` sets `mon.sleepDuration = Math.floor(Math.random()*3)+1` (range 1-3). With duration=1, the very first `canMove` call increments to 1, `1 >= 1` is true, the mon wakes and `return true` lets it act immediately — losing zero turns. For duration 2/3 it loses 1/2 turns. Showdown sleep always costs at least 1 lost turn (effective loss = duration), this engine loses `duration-1` (range 0-2).

**Repro**: `node scripts/debug/_repro/sleep.mjs` (seed Math.random to pin duration). Output:
`dur1 (r=0.0): {"dur":1,"turns":["WOKE+acted","awake-can-act"]}` — slept 0 turns.
`dur2 (r=0.4): {"turns":["slept(no action)","WOKE+acted",...]}` — slept 1 turn.

**Blast radius**: Every sleep-inducing move (Spore, Sleep Powder, Hypnosis, Sing, Lovely Kiss, Yawn, Rest). Spore/Hypnosis setup-fodder and stall lines are ~33% weaker than canon; Rest users wake a turn early. AI threat/setup math (getBestMove, aiThreatScore) assumes canonical sleep length.

**Fix sketch**: Either set `sleepDuration` to 2-4 (so effective loss is 1-3), or move the wake check so the mon cannot act on the turn it wakes when the counter first reaches the threshold (decrement-then-check with the act-on-wake semantics matching Showdown). Pick one and align with the HUD counter.

**Verification**: Re-run `scripts/debug/_repro/sleep.mjs`: duration=1 must show one `slept(no action)` before `WOKE+acted`. Add a node:test asserting a freshly-slept mon cannot act on its first turn.

---

## <a id="ISSUE-009"></a> ISSUE-009: canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift

---
id: ISSUE-009
severity: P1
category: inconsistency
anchor_symbol: canMove
current_line_hint: ~26039
file: battle.html
agents: [consistency-auditor]
fingerprint: 4ac6708be8d3
confidence: high
status: open
---

**Title**: canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift

**Evidence**:
```js
// canMove(mon, moveName) — per-turn move gate. Thaw (just above) uses storyAwareRng();
const _thawRng = storyAwareRng();
if (_thawRng() < 0.2) { mon.status = null; /* thawed */ }
...
if (mon.status === "PAR" && Math.random() < 0.25) { /* fully paralyzed */ return false; }  // bare
...
else if (Math.random() < 0.3333) { /* hurt itself in confusion */ }                          // bare
```

**Repro**: Load a story run with a fixed `?seed=`, get a mon paralyzed/confused, replay the same seed — paralysis-skip and confusion self-hit outcomes diverge between runs because they read `Math.random()` instead of the seeded `window.storyRngNext`. The adjacent thaw roll (26035) is already seeded, proving the migration was partial.

**Blast radius**: Any seeded story battle involving PAR or confusion; shared-seed replays; daily-seed determinism. These are turn-order-deciding rolls, so divergence cascades through the whole battle.

**Fix sketch**: Route both rolls through `storyAwareRng()` (the helper at line 14499 already used by thaw two lines above), e.g. `const _rng = storyAwareRng();` then `_rng() < 0.25` / `_rng() < 0.3333`.

**Verification**: `tests/integration` seeded-replay assertion — same seed must produce identical PAR-skip / confusion-self-hit sequence across two runs.

---

## <a id="ISSUE-010"></a> ISSUE-010: `cityIndexFromEventIndex` fed a ROW ID instead of array index → intro Rival (row 68) scales as City 9 (fully-evolved, hidden abilities, top items, T4)

---
id: ISSUE-010
severity: P1
category: bug
anchor_symbol: cityIndexFromEventIndex
current_line_hint: ~43528
file: battle.html
agents: [story-mode-investigator]
fingerprint: 527695359ad9
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: `cityIndexFromEventIndex` fed a ROW ID instead of array index → intro Rival (row 68) scales as City 9 (fully-evolved, hidden abilities, top items, T4)

**Evidence**:
```js
// cityIndexFromEventIndex walks STORY_EVENTS_RAW BY ARRAY INDEX:
function cityIndexFromEventIndex(ei) { for (let i = ei; i >= 0; i--) { const row = STORY_EVENTS_RAW[i]; ... } }
// But three foe-scaling consumers pass a ROW ID (ev[0]):
function _storyEvoStageCapForRow(rowIdx) { return _storyEvoStageCapForCity(cityIndexFromEventIndex(rowIdx)); } // ~35899
... _mechCity = cityIndexFromEventIndex(storyRowIdx);                                                          // ~36078
if (storyRowIdx != null && storyRowIdx >= 0 ...) _foeCity = cityIndexFromEventIndex(storyRowIdx);             // ~36854
// rollTrainerTeam / _applyStoryBuildPowerTier get storyRowIdx = ev[0] (ROW ID) from enterBattleEvent:
const [idx, type, event, ...] = ev;  rollTrainerTeam(trainer, partySize, gw, sg, event, idx);
```
The intro Rival is row ID **68**, but the array has only 68 entries (max index 67). `cityIndexFromEventIndex(68)` reads `STORY_EVENTS_RAW[68]` = undefined, then walks down to the deepest City → returns **City 9**. So for the intro Rival the evo-stage cap becomes "ALL stages" (fully evolved), `_foeCity >= 4` enables hidden abilities + the C7+ "best" held-item tier, and the power tier resolves at the top. The very first battle — a 1v1 starter duel meant to be gentle — sandbags a brand-new player. Any other row whose row ID ≠ array index (rows after the City-3 Rival insertion: IDs 12/39/40 are reordered) also resolves to the wrong city's caps.

**Repro**: `node scripts/debug/story-playthrough.mjs` and inspect the intro Rival's rolled team, or add a log to `_applyStoryBuildPowerTier` — `_foeCity` comes out 9 for row 68. The intro rival foe carries fully-evolved species with hidden abilities and tier-3 items.

**Blast radius**: Evo-stage cap, enemy mechanic-density city, and foe power tier (hidden abilities + held-item tier) for the intro Rival and any reordered row. This is the exact eventIndex-vs-rowID keying class flagged for this audit and the single most player-facing balance defect found.

**Fix sketch**: Convert row ID → array index before calling `cityIndexFromEventIndex` in the three foe-scaling consumers (e.g. `STORY_EVENTS_RAW.findIndex(r => (r[0]|0) === rowId)`), OR have these consumers take the array index directly. A boot assertion that `cityIndexFromEventIndex(arrayIdxOfIntroRival)` === 0 would catch regressions.

**Verification**: After fix, the intro Rival's evo cap = Basic only (City 0), `_foeCity` = 0 (no hidden abilities, no items), and the fight reads as the intended gentle 1v1.

---

## <a id="ISSUE-011"></a> ISSUE-011: City-name lookup feeds an array index into a row-ID-keyed map → City 3 always shows "City 3"

---
id: ISSUE-011
severity: P1
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~32514
file: battle.html
agents: [story-mode-investigator]
fingerprint: b46578ed397f
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: City-name lookup feeds an array index into a row-ID-keyed map → City 3 always shows "City 3"

**Evidence**:
```js
// GYM_CITY_LEADER_EVENT stores the ARRAY INDEX i:
for (let i = 0; i < STORY_EVENTS_RAW.length; i++) { ... out[gymNum] = i; }
// but trainerAssignments is keyed by ROW ID (row[0]) everywhere it's written (~37952, 37982).
// updateHUD (~42667) and getStoryDisplayTownNameForCityRow (~43552):
const leaderEvIdx = GYM_CITY_LEADER_EVENT[cityIdx];          // array index
const leaderName = sm.trainerAssignments && sm.trainerAssignments[leaderEvIdx]; // wrong key
cityName = (leaderName && GYM_LEADER_CITY_NAMES[leaderName]) || ('City ' + cityIdx);
```
For Gym Leader 3, arrayIndex=17 but rowId=18 (the City-3 Rival, row ID 12, sits at array index 18 and shifts everything after it). So `trainerAssignments[17]` resolves to the City-3 **Gym Trainer 1** (a generic trainer class name), which is never a key in `GYM_LEADER_CITY_NAMES` → falls through to the `'City 3'` fallback. Gyms 1,2,4-8 happen to have arrayIndex === rowId so they work by luck.

**Repro**: Start a run, reach City 3 (after Gym 2). HUD city label reads "City 3" instead of the themed leader-city name (Vermilion/etc.), while every other gym city shows its proper name.

**Blast radius**: HUD city label (`updateHUD`) and town-name display (`getStoryDisplayTownNameForCityRow`). Cosmetic but the exact eventIndex-vs-rowID keying class the spec warns about; any future timeline reorder that breaks arrayIndex===rowID for other gyms widens the breakage.

**Fix sketch**: Make `GYM_CITY_LEADER_EVENT` store the row ID (`out[gymNum] = STORY_EVENTS_RAW[i][0]`) so the two consumers' `trainerAssignments[...]` lookups key correctly; or change the two consumers to map array index → row id before lookup.

**Verification**: `node -e` parse confirms gym3 arrayIndex 17 ≠ rowId 18. After fix, City 3 HUD shows the leader-themed name. Add a boot assertion that every `GYM_CITY_LEADER_EVENT` value resolves to a `Gym Leader N` row.

---

## <a id="ISSUE-012"></a> ISSUE-012: parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift

---
id: ISSUE-012
severity: P1
category: inconsistency
anchor_symbol: parseMoveEffects
current_line_hint: ~26833
file: battle.html
agents: [consistency-auditor]
fingerprint: f57279301c3b
confidence: high
status: open
---

**Title**: parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift

**Evidence**:
```js
// parseMoveEffects() — core move-effect resolver. Generic secondary-effect gate:
const _secChance = (_sec.chance != null) ? _sec.chance : 100;
if (Math.random() * 100 >= _sg(_secChance)) continue;   // bare — every secondary status/flinch
// also: Tri Attack burn/par/frz pick (26805/26806), Stench flinch (26852), Bounce-par (26157),
// status-secondary at 26268. ~27 bare Math.random() calls live in the 24400–28700 battle band.
```

**Repro**: Seeded story battle, use any move with a secondary effect (e.g. Flamethrower 10% burn, Tri Attack, an Air Slash flinch). Replay the same seed — proc/no-proc differs because the roll is unseeded. Sibling code in the same region (cursed-pick at 25014, thaw at 26035) correctly uses the seeded path, confirming an incomplete migration.

**Blast radius**: All seeded story battles with secondary-effect moves, Tri Attack, Stench, Bounce. Roughly 27 bare Math.random() sites in the battle-resolution band (lines ~24400–28700) bypass the seeded RNG; this finding anchors the parseMoveEffects cluster (secondary-effect gate is the highest-frequency one).

**Fix sketch**: Introduce one `storyAwareRng()`-backed `_rng` at the top of `parseMoveEffects` and replace the in-loop `Math.random()` calls; audit the full 24400–28700 band so no battle-deciding roll stays on bare Math.random.

**Verification**: Seeded-replay integration test that fires a fixed sequence of secondary-effect moves and asserts identical proc outcomes across two runs of the same seed.

---

## <a id="ISSUE-013"></a> ISSUE-013: `pushData` queue swallows write failures to `console.warn` and advances — local state silently diverges from Supabase

---
id: ISSUE-013
severity: P1
category: bug
anchor_symbol: pushData
current_line_hint: ~503
file: online-pvp.js
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

## <a id="ISSUE-014"></a> ISSUE-014: Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init

---
id: ISSUE-014
severity: P1
category: inconsistency
anchor_symbol: startBattle
current_line_hint: ~16806
file: battle.html
agents: [consistency-auditor]
fingerprint: d9a014e94e28
confidence: high
status: open
---

**Title**: Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init

**Evidence**:
```js
// startBattle() at script-top scope (line 16663). 69 lines above this, the
// CORRECT _smRef was already created (line 16737). Then it regresses:
try {
    const _beatKey = sm && sm._activeBeatBattleKey;   // <-- bare 'sm': ReferenceError
    const _cfg = _beatKey && typeof BOSS_CONFIGS === 'object' && BOSS_CONFIGS[_beatKey];
    if (_cfg && Array.isArray(_cfg.mechanics) && _cfg.mechanics.length) { /* boss field locks, HP-threshold mechs */ }
} catch (e) { console.warn('[Story] BOSS_CONFIGS init failed:', e); }   // swallows the ReferenceError
```

**Repro**: `let sm` lives only inside the StoryMode IIFE (lines 29302–59694); `startBattle` is at script-top (16663). Reading bare `sm` at 16806 throws `ReferenceError: sm is not defined` on every story beat-boss battle. The enclosing try/catch (16805–16815) downgrades it to a single `console.warn`, so `_storyBossMechanicsBattleInit` never runs. This is the identical mistake the comment at line 16732 documents as already-fixed for `crucibleHardMode` — the same fix was not applied here.

**Blast radius**: Every BOSS_CONFIGS-driven story battle (beat bosses, raids, miniBosses). Field locks set move-1, HP-threshold mechanics, telegraphed immunity rounds — all skipped. `_activeBeatBattleKey` IS correctly set at line 46653 (inside the IIFE), so the feature is intended to fire; only the read site is broken.

**Fix sketch**: Replace bare `sm` at line 16806 with `_smRef` (already declared at 16737 in the same function), matching the documented script-top pattern.

**Verification**: Open any story beat-boss battle with a BOSS_CONFIGS entry; confirm `state._bossMechanics` is populated and the field-lock telegraph fires. A seeded story-flow test that enters a boss beat and asserts `_bossMechanics.length > 0` would catch the regression.

---

## <a id="ISSUE-015"></a> ISSUE-015: `startBattle` reads bare `sm` (ReferenceError) → story boss/raid BOSS_CONFIGS mechanics never init

---
id: ISSUE-015
severity: P1
category: bug
anchor_symbol: startBattle
current_line_hint: ~16806
file: battle.html
agents: [story-mode-investigator]
fingerprint: 621cdb8220ed
confidence: high
status: open
---

**Title**: `startBattle` reads bare `sm` (ReferenceError) → story boss/raid BOSS_CONFIGS mechanics never init

**Evidence**:
```js
// startBattle() is defined at ~16663, OUTSIDE the window.StoryMode IIFE (29302–59694)
// where `sm` is a closure local (declared ~34886). So this throws:
const _beatKey = sm && sm._activeBeatBattleKey;          // ReferenceError: sm is not defined
const _cfg = _beatKey && typeof BOSS_CONFIGS === 'object' && BOSS_CONFIGS[_beatKey];
// ... swallowed by:
} catch (e) { console.warn('[Story] BOSS_CONFIGS init failed:', e); }
```
There is no `window.sm =` assignment anywhere (only two defensive `window.sm` *reads* at ~13685/~18871, both of which see `undefined`). So the boss-mechanics init block is dead: field locks, HP-threshold phase changes, and immunity-round mechanics declared in `BOSS_CONFIGS` are never attached to story-beat boss / miniBoss / raid battles. `enterBattleEvent` (~46652) correctly stamps `sm._activeBeatBattleKey`, but `startBattle` can never read it.

**Repro**: `node scripts/debug/story-playthrough.mjs` — every battle logs `console.warning: [Story] BOSS_CONFIGS init failed: ReferenceError: sm is not defined at startBattle (battle.html:16806)`. Reach the Caged God / any villain boss beat: the boss fights as a vanilla mon with none of its scripted phase/field mechanics.

**Blast radius**: All 3-track boss/raid beats and the Caged God arc lose their signature mechanics. Normal trainer battles are unaffected (no `_activeBeatBattleKey`), so it degrades silently rather than crashing — which is why it shipped.

**Fix sketch**: Expose the story state to script-top scope (e.g. assign `window.sm = sm` inside the IIFE, or a `window.StoryMode._activeBeatKey()` accessor) and have `startBattle` read through that handle instead of bare `sm`.

**Verification**: Re-run `story-playthrough.mjs`; the warning disappears. Enter a boss beat and confirm `state._bossMechanics` is populated and `_storyBossMechanicsBattleInit` runs.

---

## <a id="ISSUE-016"></a> ISSUE-016: Cold-open / intro-rival narrative overlay is not a dialog — no role/aria-modal/label, no ESC, no focus management

---
id: ISSUE-016
severity: P2
category: a11y
anchor_symbol: _renderNarrativeOverlay
current_line_hint: ~46103
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c1383b391838
confidence: high
status: open
---

**Title**: Cold-open / intro-rival narrative overlay is not a dialog — no role/aria-modal/label, no ESC, no focus management

**Evidence**:
```js
const ov = document.createElement('div');
ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.94);z-index:9998;...';
if (toneClass) ov.classList.add(toneClass);
// ... innerHTML built, onclick wired, then:
document.body.appendChild(ov);   // no role/aria-modal/aria-label, no keydown, no focus()
```

**Repro**: Start a new story run. The intro-rival cold-open (and every per-variant narrative scene / cold-open routed through `_renderNarrativeOverlay`) appears as a fullscreen layer. A screen reader announces nothing; keyboard focus stays on whatever was behind it. Compare with `_showStoryTutorialScene`, `_renderVictoryOverlay`, the city-arrival overlay, and the Hall-of-Fame overlay — all of which set `role="dialog"`, `aria-modal`, `aria-label`, and ESC/focus.

**Blast radius**: The single most prominent narrative moment of every run plus all choice-prompt scenes. SR users get a silent screen; keyboard users must blind-Tab to the Continue button (which is never auto-focused) to advance.

**Fix sketch**: Copy the pattern already used by `_showStoryTutorialScene`: set `role="dialog"`, `aria-modal="true"`, `aria-label` from the scene name/banner, `tabIndex=-1`, add an Escape keydown that calls `dismiss()` (when no choices pending), and focus the Continue button after append.

**Verification**: Open the intro cold-open with a screen reader — it should announce as a dialog with the speaker name; press Escape to dismiss; Tab should land on Continue first.

---

## <a id="ISSUE-017"></a> ISSUE-017: Cluster of silent `.catch(console.warn)` sites hide real failures from the user

---
id: ISSUE-017
severity: P2
category: bug
anchor_symbol: applyHostMatchOptions
current_line_hint: ~322
file: online-pvp.js
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

## <a id="ISSUE-018"></a> ISSUE-018: Confusion self-hit ignores the confused mon's Atk/Def stat-stage boosts

---
id: ISSUE-018
severity: P2
category: bug
anchor_symbol: canMove
current_line_hint: ~26066
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 23079ed8b640
confidence: medium
status: open
---

**Title**: Confusion self-hit ignores the confused mon's Atk/Def stat-stage boosts

**Evidence**:
```js
let dmg = Math.floor((Math.floor(Math.floor(22 * 40 * (mon.stats.atk / mon.stats.def)) / 50) + 2));
```
Uses raw `mon.stats.atk` / `mon.stats.def` with no `getStageMult(mon.stages.atk/def)`. In Showdown the 40-BP typeless self-hit uses the confused Pokemon's current (boosted) Attack and Defense. A +6 Atk sweeper self-hits for far less than canon; a -Def mon self-hits for less than it should.

**Repro**: Swords Dance x3 a mon, confuse it, force self-hit (pin RNG < 0.3333). Self-hit damage matches the unboosted value, not the +6 Atk value.

**Blast radius**: Confusion damage on boosted/screened sweepers. Minor but a real divergence from canon damage.

**Fix sketch**: Multiply A and D by `getStageMult(mon.stages.atk)` and `getStageMult(mon.stages.def)` respectively in the self-hit damage line, mirroring the main damage block's stage handling.

**Verification**: Repro script comparing self-hit damage at +0 vs +6 Atk; the boosted case must be larger.

---

## <a id="ISSUE-019"></a> ISSUE-019: STORY_FEATURES_INTEGRATION "shipped" sections gate balls/PC/wild on catchMode; no such setting exists

---
id: ISSUE-019
severity: P2
category: inconsistency
anchor_symbol: catchMode
current_line_hint: n/a
file: battle.html
agents: [spec-drift-auditor]
fingerprint: c26048440b8d
confidence: high
status: open
---

**Title**: STORY_FEATURES_INTEGRATION "shipped" sections gate balls/PC/wild on catchMode; no such setting exists

**Evidence**:
```text
docs/STORY_FEATURES_INTEGRATION.md (sections marked "Shipped and live: §1, §2, §4"):
  §1 "Sold at Poké Mart only when catchMode is on"
  §2 "Button PC Box when catchMode or sm.pcBox.length > 0"
  §8 "catch + PC + balls still work if catchMode on"
grep catchMode battle.html -> 0 matches.
```

**Repro**: grep `catchMode` across battle.html returns nothing. Catching is gated by `sm.catchTutorialDone` (set after the intro rival), per STORY_MODE_FLOW.md §10 — there is no per-run catch toggle. The integration doc's live sections still describe a `catchMode` flag.

**Blast radius**: A reader following the integration doc looks for a non-existent setting to enable/disable catching; the de-scope status block at the top vouches §1/§2/§4 as "shipped and live" while their gating mechanism (`catchMode`) was never implemented. Prior audit (STORY_MODE_AUDIT.md §1) already noted "Catch mode is undefined in code" — still unreconciled in the integration doc.

**Fix sketch**: Update the §1/§2/§4 "shipped" copy in STORY_FEATURES_INTEGRATION.md to reference the real gate (`catchTutorialDone`, always-on catching), removing `catchMode` from the live sections.

**Verification**: grep `catchMode` -> 0; confirm PC button / mart ball rows gate on `catchTutorialDone` / `pcBox.length`.

---

## <a id="ISSUE-020"></a> ISSUE-020: Regular ball consumed with no refund when a successful catch is rejected at party-full + PC-full

---
id: ISSUE-020
severity: P2
category: bug
anchor_symbol: catchThrow
current_line_hint: ~49647
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8a7d99b90173
confidence: high
status: open
---

**Title**: Regular ball consumed with no refund when a successful catch is rejected at party-full + PC-full

**Evidence**:
```js
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // ~49647, before outcome
...
if (partyFull && pcFull) { _catchFinishWithMessage('... Free a slot ... then try again.'); return; }
```

**Repro**: Party at cap and PC at 30/30, throw an Ultra Ball at a wild and roll a success — the message asks you to free a slot, but the Ultra Ball is gone.

**Blast radius**: Route / Safari / Crucible wild catches at full storage. Pure economy loss; no soft-lock for regular balls.

**Fix sketch**: Same as the boss-mode finding — gate the throw on free space (party-or-PC) before decrementing, or refund on rejection.

**Verification**: Catch screen disables / blocks throws when party AND PC are full, surfacing the "free a slot" message without spending a ball.

---

## <a id="ISSUE-021"></a> ISSUE-021: Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv

---
id: ISSUE-021
severity: P2
category: data
anchor_symbol: convertSmogonSet
current_line_hint: ~12211
file: data/builds/gen8.json
agents: [data-integrity-auditor]
fingerprint: 364230245444
confidence: high
status: open
---

**Title**: Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv

**Evidence**:
```js
// data/builds/gen8.json — Mewtwo/balancedhackmons/Sheer Force
{"moves":["Nasty Plot","Psychic","Blue Flare",["Strength Sap","Ice Beam"]],
 "ability":"Sheer Force","item":"Life Orb","ivs":{"atk":0},
 "evs":{"hp":252,"def":252,"spa":252,"spd":252,"spe":252}}  // sum = 1260 (cap is 510)
// convertSmogonSet (battle.html:12245) passes evs straight through — no total clamp.
```

**Repro**: `node -e 'const d=require("./data/builds/gen8.json");const e=d.Mewtwo.balancedhackmons["Sheer Force"].evs;console.log(Object.values(e).reduce((a,b)=>a+b,0))'` → 1260. Authoritative source has none: scan of `data/builds.csv` yields 0 rows with EV total >510 (counts: gen5=1, gen6=3, gen7=47, gen8=125, gen9=37; total 213 in the mirror, 0 in CSV).

**Blast radius**: `data/builds/gen*.json` is the offline fallback consumed by `fetchSmogonSetsForGen` → `populateCsvBuildsFromAPI` when `builds.csv` can't be fetched (e.g. file:// protocol). On that path `convertSmogonSet` does not validate EV totals, so a Pokémon can be built with 1260 EVs, producing stats no legal Pokémon can reach. The CSV (primary path) is clean, so this only bites the fallback.

**Fix sketch**: Regenerate the gen*.json mirror from the same pipeline that produced builds.csv (they have drifted), or add a total-EV clamp/normalization in `convertSmogonSet`. Treat the CSV as the single source of truth and make the JSON a derived artifact.

**Verification**: After regeneration, `node` scan over all `data/builds/gen*.json` for `sum(evs) > 510` returns 0, matching the CSV.

---

## <a id="ISSUE-022"></a> ISSUE-022: 351 it.todo() move tests cluster into 31 setup-shapes; 9 clusters retire 70% of the gap

---
id: ISSUE-022
severity: P2
category: test-gap
anchor_symbol: describe('Status moves')
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: 187e8bbb9b4b
confidence: high
status: open
---

**Title**: 351 it.todo() move tests cluster into 31 setup-shapes; 9 clusters retire 70% of the gap

**Evidence**:
```text
status.test.js   210 todo   special.test.js  74 todo   physical.test.js  67 todo   TOTAL 351
Verified: grep -cE "it\.todo\(" on each file. Every TODO move resolved in data/moves.json (0 not-found).
Harness primitives confirmed live: mon.stages{atk..eva}, mon.status (slp/par/brn/psn/tox),
mon.currentHp/maxHp, mon.volatile{confusion,taunt,leechSeed,aquaRing,stockpile,perishCount,...},
state.weather, state.trickRoom, state.pSide/fSide{reflect,lightScreen,spikes,...}. Seed 0 forces
secondary effects (Power-Up Punch -> atk +1). Spread (allAdjacentFoes) moves hit the lone foe and drop HP.
```

**Repro**: `for f in tests/moves/by-category/{status,special,physical}.test.js; do grep -cE "it\.todo\(" $f; done` -> 210, 74, 67. Probe harness with `node --test` against `tests/helpers/load-engine.js` (mkMon/runTurn).

**Blast radius**: Move-coverage confidence. 516 of 867 generated tests already auto-assert; these 351 are the long tail of preconditioned mechanics. Clustering by setup-shape (not by file/category) lets one harness primitive retire a whole batch.

**Fix sketch**: Convert clusters in cheapest-first order. The full setup-shape taxonomy table (cluster id, count, representative moves, shared harness setup, effort/value) is below. Orchestrator drives `/fix-todo-test <cluster-id>` one cluster per invocation, writing to `tests/moves/by-category/_drafts/<id>.test.js` (never editing the generated files).

**Verification**: After each cluster draft, `node --test tests/moves/by-category/_drafts/<id>.test.js` must pass; a failing assertion is a candidate engine bug, not a bad test.


## Setup-shape cluster taxonomy (all 351 TODOs, 31 clusters)

Effort = harness work to build the precondition + assert. Value = TODOs retired per unit effort.

| Cluster id | Count | Files | Shared harness setup | Assert | Effort | Value |
|---|---|---|---|---|---|---|
| spread-damaging | 66 | sp:50 ph:17 (subset of spread-target) | none (spread move hits lone foe in singles); seed 0 for secondaries | defender.currentHp dropped; + secondary status/boost/volatile where declared | LOW | **HIGHEST** |
| status-volatile | 46 | st:46 | runTurn the move | target/self mon.volatile.<flag> set (confusion, taunt, leechSeed, protect, aquaRing, stockpile, perishCount, ingrain, magnetRise, encore, disable, focusEnergy, destinyBond...) | LOW | **HIGH** |
| variable-power-conditional | 28 | sp:5 ph:23 | build precondition (weight/speed ratio, user burned/asleep, prior turn, HP%) then compare BP/damage | damage scales with condition (Low Kick/Gyro Ball/Heavy Slam by weight; Facade x2 when brn; Reversal/Flail at low HP; Return/Frustration friendship; Fake Out/First Impression turn 1) | MED-HIGH | MED |
| self-heal | 18 | st:18 | pre-damage the user (set currentHp < maxHp), runTurn | user.currentHp increases toward maxHp (Recover/Roost/Wish/Synthesis weather-scaled/Rest -> slp+full) | LOW-MED | **HIGH** |
| charge | 17 | st:1 sp:5 ph:11 | run turn 1 (charge), assert mon.volatile.charging set; turn 2 deals damage (Power Herb / seed for skip) | turn1 no damage + charging flag; turn2 HP drop (Solar Beam, Fly, Dig, Phantom Force, Sky Drop...) | MED | MED |
| side-condition | 15 | st:15 | runTurn the move | state.pSide/fSide flag set (reflect, lightScreen, auroraVeil, safeguard, mist, tailwind, lightScreen turns; Quick/Wide/Crafty/Mat protect-side) | LOW | **HIGH** |
| field-effect | 14 | st:14 | runTurn the move | state.<field> set (trickRoom, magicRoom, wonderRoom, gravity; Haze clears stages; Perish Song sets perishCount on all; Mud/Water Sport) | LOW-MED | MED |
| ally-target | 12 | st:12 | SKIP in singles harness (target adjacentAlly/allies/adjacentAllyOrSelf) | leave as todo OR assert no-op/self path (Howl self atk+1; Helping Hand needs doubles) | (skip) | LOW |
| move-copy-call | 12 | st:12 | give user the copy move + a known move to copy; runTurn | called move's effect fires (Metronome/Assist/Copycat/Sleep Talk/Mirror Move/Mimic/Sketch); some need 2 actors | HIGH | LOW |
| status-infliction | 12 | st:12 | runTurn on healthy foe (seed 0 to land accuracy) | defender.status === expected (Toxic->TOX, Thunder Wave->par, Will-O-Wisp->brn, Spore/Sleep Powder/Hypnosis->slp, Poison Powder->psn) | LOW | **HIGH** |
| fixed-damage | 10 | sp:7 ph:3 | runTurn; compute expected | exact HP loss (Dragon Rage=40, Sonic Boom=20, Night Shade/Seismic Toss=level, Super Fang=half, Psywave var, Endeavor->match, Final Gambit->user HP) | LOW-MED | MED |
| stat-swap-copy | 9 | st:9 | pre-set attacker/defender stages, runTurn | stages/stats swapped or copied (Psych Up copies foe stages; Power/Guard Swap; Heart Swap; Speed Swap; Topsy-Turvy inverts; Pain Split averages HP) | MED | MED |
| type-change | 8 | st:8 | runTurn | mon.type1/type2 changed (Soak->Water, Conversion->move type, Camouflage->terrain, Forest's Curse/Trick-or-Treat add type, Reflect Type) | LOW-MED | MED |
| ability-manipulation | 8 | st:8 | give defender a known ability, runTurn | mon.ability changed (Skill Swap exchanges, Role Play copies, Worry Seed->Insomnia, Simple Beam->Simple, Entrainment, Gastro Acid suppresses, Doodle) | MED | LOW |
| item-manipulation | 8 | st:5 ph:2,sp | give items, runTurn | mon.item moved/removed (Trick/Switcheroo swap, Bestow gives, Recycle restores, Fling throws+effect, Natural Gift type from berry, Stuff Cheeks) | MED | LOW |
| weather-set | 6 | st:6 | runTurn | state.weather === expected + weatherTurns (Rain Dance, Sunny Day, Sandstorm, Hail, Snowscape, Chilly Reception switches) | LOW | **HIGH** |
| switch-pivot | 5 | st:5 | needs >1 party mon to observe switch | tricky in singles; Teleport/Parting Shot pivot, Baton Pass carries stages, Healing/Lunar/Revival need bench | HIGH | LOW |
| counter-like | 5 | sp:1 ph:4 | foe must hit user first (priority/order), then move returns damage | Counter=2x phys taken, Mirror Coat=2x spec, Metal Burst/Comeuppance=1.5x, Bide stores 2 turns | HIGH | LOW |
| terrain-set | 4 | st:4 | runTurn | state terrain field set (Electric/Grassy/Misty/Psychic Terrain) | LOW | MED |
| hazard-set | 4 | st:4 | runTurn | state.fSide flag/count (spikes, toxicSpikes layers, stealthRock, stickyWeb) | LOW | MED |
| signature-ohko | 4 | sp:1 ph:3 | runTurn with seed forcing accuracy roll | defender.currentHp === 0 (Sheer Cold, Fissure, Horn Drill, Guillotine) | LOW-MED | MED |
| trapping | 3 | st:3 | runTurn | defender.volatile.partialTrap/trapped set (Mean Look, Block, Spider Web) | LOW | MED |
| turn-order | 2 | st:2 | needs doubles to observe (After You, Quash) | skip in singles | (skip) | LOW |
| hazard-clear | 2 | st:2 | pre-set hazards on side, runTurn | hazards cleared (Defog also drops screens; Tidy Up clears+boosts) | LOW-MED | MED |
| transform-form | 2 | st:2 | runTurn (Transform copies foe; Psycho Shift moves user status to foe) | user stats/moves/type match foe (Transform); foe gains user's status (Psycho Shift) | MED | LOW |
| force-switch | 2 | st:2 | needs foe bench to observe forced switch (Roar, Whirlwind) | tricky in singles; assert log/fail-on-single | MED | LOW |
| self-type-removal | 2 | sp:1 ph:1 | user must be the move's type; runTurn | user loses that type after (Burn Up removes Fire, Double Shock removes Electric) + deals damage | MED | LOW |
| delayed-damage | 2 | sp:2 | runTurn turn 1 (no immediate dmg), advance 2 turns | damage lands turn 3 (Future Sight, Doom Desire) via state.fSide futureSight | MED | LOW |
| damaging-special-handling | 2 | ph:2 | set terrain then runTurn | Ice Spinner/Steel Roller remove terrain + deal damage | MED | LOW |
| status-boost-misc | 1 | st:1 | doubles ally-target (Decorate +2 atk/+2 spa to ally) | skip in singles | (skip) | LOW |
| secondary-volatile | 1 | sp:1 | Snore needs user asleep | user.status=slp, runTurn, foe HP drop + flinch chance | MED | LOW |

### Recommended execution order (cheapest setup -> most expensive)

1. **spread-damaging (66)** — zero precondition; reuse the existing damaging-move template.
2. **status-volatile (46)** — single runTurn, assert one `mon.volatile.<flag>`.
3. **status-infliction (12) + side-condition (15) + weather-set (6) + terrain-set (4) + hazard-set (4)** — all single-runTurn state assertions; batch as one "single-turn-state" pass (41) but split to respect the 25-40 limit (e.g. side+weather+terrain+hazard = 29; status-infliction separate).
4. **self-heal (18)** — one extra setup line (pre-damage user).
5. **fixed-damage (10) + signature-ohko (4) + trapping (3) + hazard-clear (2)** — exact-value / pre-state asserts.
6. **type-change (8) + stat-swap-copy (9) + field-effect (14)** — moderate state setup.
7. **charge (17)** — two-turn sequencing.
8. **variable-power-conditional (28)** — per-move precondition tuning; split into 2 batches.
9. **counter-like (5) + delayed-damage (2) + transform-form (2) + move-copy-call (12) + ability/item-manipulation (16)** — multi-actor / multi-turn; lowest value.
10. **SKIP clusters (doubles-only): ally-target (12), turn-order (2), force-switch (2), switch-pivot (5), status-boost-misc Decorate (1)** — singles harness cannot construct the precondition; leave as todo per the anti-pattern rule rather than write placeholder assertions.

Net: clusters 1-3 retire **143 TODOs (41%)** with near-zero new harness machinery. Adding self-heal + step-5 reaches **180 (51%)**. ~22 TODOs are honestly unbuildable in a singles harness and should stay todo.

---

## <a id="ISSUE-023"></a> ISSUE-023: gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive)

---
id: ISSUE-023
severity: P2
category: data
anchor_symbol: fetchSmogonSetsForGen
current_line_hint: ~12169
file: data/builds/gen4.json
agents: [data-integrity-auditor]
fingerprint: 51f176d8cb95
confidence: high
status: open
---

**Title**: gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive)

**Evidence**:
```js
// data/builds/gen4.json — Quagsire/pu/Defensive
{"moves":[["Toxic","Curse"],"Recover","Earthquake","Waterfall"],
 "ability":"Water Absorb","item":"Leftovers","nature":"Impish",
 "evs":{"hp":252,"def":200,"spd":56},"teratypes":"Water"}  // Tera is Gen 9 only
```

**Repro**: `node -e 'const d=require("./data/builds/gen4.json");console.log(d.Quagsire.pu.Defensive.teratypes)'` → `Water`. Terastallization did not exist before Gen 9. The authoritative CSV row `Quagsire,regular,4,pu,...` has an empty `teratypes` column (and a different tag), so the mirror entry does not even correspond to the CSV row.

**Blast radius**: Low/cosmetic. `convertSmogonSet` will pass the stray `teratypes` into `_teratypes`, so a Gen-4 Quagsire in the fallback path could be offered a Tera type, which is a mechanic that should not exist in a Gen-4 context. Symptom of the mirror being regenerated from a different/newer pass than the CSV.

**Fix sketch**: Regenerate the mirror from the CSV (single source of truth); the generator should drop `teratypes` for any build whose `gen < 9`.

**Verification**: `node` scan over `data/builds/gen[4-8].json` for any build carrying `teratypes`/`teraType` returns 0.

---

## <a id="ISSUE-024"></a> ISSUE-024: Early-game softening uses city-indexed [0.80,0.85,0.90]; spec §8/§15f names badge/event constants

---
id: ISSUE-024
severity: P2
category: inconsistency
anchor_symbol: FOE_STAT_NERF_BY_CITY
current_line_hint: ~14493
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 02e46f6ff336
confidence: high
status: open
---

**Title**: Early-game softening uses city-indexed [0.80,0.85,0.90]; spec §8/§15f names badge/event constants

**Evidence**:
```js
const FOE_STAT_NERF_BY_CITY = [0.80, 0.85, 0.90]; // index = city; City >=3 -> 1.0
// _earlyGameFoeStatMult() keys on nearest preceding City row index, returns this array.
```

**Repro**: STORY_MODE_FLOW.md §8/§15f describe `PRE_GYM1_FOE_STAT_MULT = 0.82`, `EARLY_GL_FOE_STAT_MULT = 0.95` (GL1/GL2), `EARLY_GAME_FOE_STAT_MULT = 0.92`, `STAGE2_GL_FOE_STAT_MULT = 0.97` (GL3) — keyed on badges + event type with a per-Gym-Leader exemption. None of those four constants exist (grep = 0). Shipped values and keying model (city index, no GL exemption, ends at City 3) differ entirely.

**Blast radius**: The spec's entire §8 "Early-game softening" table and §15f "Anti-bricking" table are fictional vs. code; GL1/GL2 are softened to 0.85/0.90 of their *city* (not the spec'd 0.95), and GL3 gets no special STAGE2 multiplier. Anyone tuning the early curve from the spec edits constants that do not exist.

**Fix sketch**: Rewrite STORY_MODE_FLOW.md §8 and §15f to document `FOE_STAT_NERF_BY_CITY` and the city-indexed model (and the separate `_stageGatedFoeStatMult` event-keyed curve), or refactor the code to the named-constant badge/event model the spec describes.

**Verification**: Confirm the doc's named constants resolve via find-anchor; or confirm the spec table matches `FOE_STAT_NERF_BY_CITY` + `_stageGatedFoeStatMult` output for GL1/GL2/GL3.

---

## <a id="ISSUE-025"></a> ISSUE-025: loadGameData ~299 ms engine-only (>1.5× 200 ms boot target), dominated by parseCSV over the 2.56 MB builds.csv

---
id: ISSUE-025
severity: P2
category: perf
anchor_symbol: loadBuildsCSV
current_line_hint: ~10429
file: battle.html
agents: [performance-profiler]
fingerprint: 7b1c4e9a2d50
confidence: high
status: open
---

**Title**: loadGameData ~299 ms engine-only (>1.5× 200 ms boot target), dominated by parseCSV over the 2.56 MB builds.csv

**Evidence**:
```js
async function loadBuildsCSV() {
    const text = await fetch('data/builds.csv').then(r => r.text()); // 2.56 MB
    const rows = parseCSV(text, ',');                                // 17,397 rows
    for (const row of rows) { /* per-row object construction + option decode */ }
}
```
Measured (jsdom, seeded RNG=0, 5 boots): loadGameData engine-only = first-data-fetch → `__testReady` resolve. Samples: 301, 299, 291, 312, 294 ms → **median 299 ms** (min 291, max 312). Target: < 200 ms. Phase attribution: `parseCSV(builds.csv)` alone = **106.2 ms** for 17,397 rows; JSON file-read+parse total ≈ 90 ms (builds gen9.json 14.4 ms parse + species/moves ≈ 30 ms); the remaining ~100 ms is the `loadBuildsCSV` per-row object/option-decode loop. fetchRandbatsForGen is ~0 ms (cached). The builds CSV pipeline is the single largest synchronous boot cost.

**Repro**: `node scripts/debug/perf-bench.mjs` (reports boot ms); for engine-only attribution, instrument `window.fetch` first-`data/` call → `await window.__testReady` resolution. `parseCSV` is reachable: `window.parseCSV(readFileSync('data/builds.csv','utf8'), ',')` measures ~106 ms.

**Blast radius**: Every cold start in every browser (GH Pages static deploy has no warm cache on first visit). loadGameData blocks the "Loading…" overlay; in a real browser this 299 ms jsdom figure scales up (slower JSON/CSV parse on mobile). builds.csv is 2.56 MB — also the largest network transfer at boot. ~1.5× over target, so P2 (not >2× ⇒ not a hard P0/P1 boot blocker), but it is a genuine regression vs the stated 200 ms target and the dominant attributable phase.

**Fix sketch**: Ship builds as a pre-parsed JSON (or a compact columnar format) instead of re-parsing a 2.56 MB CSV at every boot — moves the 106 ms parse + row-construction off the critical path. Alternatively defer loadBuildsCSV until first build is needed (lazy) so the engine becomes interactive before the CSV finishes, or gzip + stream-parse.

**Verification**: Re-run boot attribution; confirm the parseCSV phase drops below ~20 ms and loadGameData median falls under 200 ms while `makeBuild`/draft pools still resolve (existing draft/story tests stay green).

---

## <a id="ISSUE-026"></a> ISSUE-026: v22 migration rolls fresh villain/extra tracks on mid-run saves → road-anchored intro beats silently never fire

---
id: ISSUE-026
severity: P2
category: inconsistency
anchor_symbol: migrateStoryPreV22
current_line_hint: ~34660
file: battle.html
agents: [story-mode-investigator]
fingerprint: c40dff087d5b
confidence: medium
status: open
---

**Title**: v22 migration rolls fresh villain/extra tracks on mid-run saves → road-anchored intro beats silently never fire

**Evidence**:
```js
function migrateStoryPreV22() {
    if (!sm.tracks ...) sm.tracks = { main:'classic_v2', villain:null, extra:null };
    if (!sm.tracks.villain) sm.tracks.villain = _pickTrack(VILLAIN_TRACKS);
    if (!sm.tracks.extra)   sm.tracks.extra   = _pickTrack(EXTRA_TRACKS);
    if (!sm.storyEventsFired ...) sm.storyEventsFired = {};   // empty
}
```
The dispatcher (`_activeBattleBeatForCurrentRow`, ~41805) only fires beats whose `roadAnchor === currentRoad` and that are not in `storyEventsFired`. A v21 save migrated at, say, City 5 gets a brand-new villain track with an empty fired-ledger, but every beat anchored to roads 1–5 is behind the player and will never be reached — so the villain arc's intro/reveal beats are silently skipped and the track first surfaces mid-arc (or not at all). The migration comment calls this "acceptable — additive," but the player-facing result is an incoherent villain storyline on any migrated save.

**Repro**: Load a v21 save sitting at City 5+, advance — villain track beats anchored to earlier roads never play; the first villain beat the player sees is whatever is anchored to a future road.

**Blast radius**: Narrative coherence of the 3-track system for all pre-v22 saves (the majority of existing players at ship time).

**Fix sketch**: On migration of a mid-run save, either stamp all road-anchored beats for already-passed roads as fired (so the dispatcher doesn't expect them) AND surface a one-shot "the road ahead has changed" catch-up note, or pin villain/extra to null until the next fresh run.

**Verification**: Migrate a City-5 v21 save; confirm no orphaned villain reveal is expected and the arc reads coherently from the player's current road.

---

## <a id="ISSUE-027"></a> ISSUE-027: openModal saves/restores trigger focus but never moves focus INTO the dialog, and no modal has a focus trap

---
id: ISSUE-027
severity: P2
category: a11y
anchor_symbol: openModal
current_line_hint: ~13586
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: aedce7c75c51
confidence: high
status: open
---

**Title**: openModal saves/restores trigger focus but never moves focus INTO the dialog, and no modal has a focus trap

**Evidence**:
```js
window.openModal = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try { const prev = document.activeElement;
        if (prev && prev !== document.body) window._modalFocusStack.set(id, prev); } catch (e) {}
    el.classList.remove('hidden');   // dialog shown; focus stays on the trigger button outside it
};
```

**Repro**: Open Settings, Help, Story Bag, Story Party, or any `.modal` from a button. Focus remains on the trigger (outside the now-`aria-modal` dialog). Tab keeps cycling through the background page behind the overlay — nothing constrains focus to the modal. SR users are told a modal is open but their reading cursor is still on the page.

**Blast radius**: All ~17 `.modal` overlays. They correctly declare `role="dialog"`/`aria-modal="true"` and restore focus on close, but the open path is half-finished: no focus-in, no trap. Same trap gap exists on the fullscreen overlays (`_showStoryTutorialScene`, victory, HoF) which focus a button but still let Tab leave.

**Fix sketch**: In `openModal`, after un-hiding, focus the first focusable element inside `el` (or `el` itself with `tabIndex=-1`). Add a shared focus-trap keydown (Tab/Shift+Tab wrap within the modal) keyed off the topmost open `.modal`.

**Verification**: Open Settings, confirm focus lands inside the sheet; Tab repeatedly and confirm focus never reaches background controls; close and confirm focus returns to the gear button.

---

## <a id="ISSUE-028"></a> ISSUE-028: `pcRelease` lacks the `unsellable` guard `pcSell` has — the boss-arc capture (Subject Zero) can be permanently released

---
id: ISSUE-028
severity: P2
category: bug
anchor_symbol: pcRelease
current_line_hint: ~48624
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4939480dbc5f
confidence: high
status: open
---

**Title**: `pcRelease` lacks the `unsellable` guard `pcSell` has — the boss-arc capture (Subject Zero) can be permanently released

**Evidence**:
```js
async function pcSell(monId) { ...
    if (!slot || slot.unsellable === true || slot.isEgg) return;   // guards unsellable
}
async function pcRelease(monId) { ...
    if (!found || found.where !== 'pc') return;                    // NO unsellable guard
    const ok = await window.showGameConfirm('Release ' + name + '? ...');
    if (!ok) return;
    sm.pcBox.splice(found.index, 1);                               // gone forever
}
```
Subject Zero (the Caged God capture) is stamped `unsellable:true` and, when caught with a full party, is pushed to the PC (`_catchHandleSuccess` ~49778). `pcSell` refuses to sell it, but `pcRelease` will release it. The spec (STORY_MODE_FLOW.md §"Underground": "Unsellable: starter, current last party mon, the boss-arc capture") intends the capture to be permanent.

**Repro**: Catch the Caged God with a full party so it lands in the PC, open PC → Release on Subject Zero → confirm. It's gone, with no re-acquisition path.

**Blast radius**: PC release path; loses the unique post-game reward. Gated by a confirm dialog so not a silent loss, but the intended hard lock is absent.

**Fix sketch**: Add `if (found.slot && found.slot.unsellable === true) return;` (with a toast) to `pcRelease`, mirroring `pcSell`.

**Verification**: Releasing Subject Zero from the PC is blocked with a "story-locked" message.

---

## <a id="ISSUE-029"></a> ISSUE-029: `pvp_rooms` SELECT remains `using(true)` — any anon client can scrape every live match's full state

---
id: ISSUE-029
severity: P2
category: security
anchor_symbol: pvp_rooms_select
current_line_hint: ~47
file: supabase/migrations/004_online_pvp_rls_tighten.sql
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

## <a id="ISSUE-030"></a> ISSUE-030: online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8×

---
id: ISSUE-030
severity: P2
category: refactor
anchor_symbol: reportWinIfConfigured
current_line_hint: ~585
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: b45637efa253
confidence: medium
status: open
---

**Title**: online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8×

**Evidence**:
```js
// Repeated near-verbatim at lines 585, 610, 661, 690, 723, 761 (and variants at 265, 417):
const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
if (rowErr || !row || row.data == null) { console.warn('[OnlinePvP] <tag> fetch', rowErr); return; }
const prev = row.data;
```

**Repro**: `grep -nE "from\('pvp_rooms'\).select\('data'\).eq\('id', roomId\)" online-pvp.js` → 8+ structurally identical blocks differing only in the console.warn tag and single() vs maybeSingle().

**Blast radius**: Maintenance risk — any change to the room-fetch contract (column name, error shape, retry policy) must be edited in 8 places; easy to miss one and create inconsistent error handling across the PvP sync paths.

**Fix sketch**: Extract a single `async fetchRoomData(tag)` helper returning `{ prev }` or `null` (logging the tagged warn on failure), and call it from each site.

**Verification**: PvP smoke test (host + guest turn exchange) still completes; no behavioral change expected — pure consolidation.

---

## <a id="ISSUE-031"></a> ISSUE-031: Confusion duration is always 2-4 turns (engine uses floor(rng*3)+2), Showdown is 1-4

---
id: ISSUE-031
severity: P2
category: balance
anchor_symbol: setConfusionDuration
current_line_hint: ~26817
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b13dc1abcb62
confidence: medium
status: open
---

**Title**: Confusion duration is always 2-4 turns (engine uses floor(rng*3)+2), Showdown is 1-4

**Evidence**:
```js
defender.volatile.confusion = Math.floor(_confRng()*3)+2;   // 2,3,4 — never 1
```
Every confusion-set site (Confuse Ray ~26817, Swagger ~26983, Flatter ~26989, fatigue ~21405, secondary ~27368, G-Max ~24776/24840) uses `floor(rng*3)+2`. canMove decrements then checks, so the holder is exposed for 2-4 move attempts; canon is 1-4 (minimum one exposed attempt).

**Repro**: Confuse Ray a target repeatedly across seeds; observed confusion counter is always in {2,3,4}, never 1. Compare to Showdown's 1-4.

**Blast radius**: Confusion-based stall/disruption (Confuse Ray, Swagger, Flatter) is slightly stronger than canon (no 1-turn rolls). Affects balance, not correctness-breaking.

**Fix sketch**: Change to `Math.floor(rng*4)+1` (1-4) at all confusion-set sites to match Showdown, keeping the decrement-then-check loop.

**Verification**: Statistical check over many seeds that the rolled duration spans {1,2,3,4}.

---

## <a id="ISSUE-032"></a> ISSUE-032: Wild grade curve is city-keyed STORY_WILD_GRADE_BY_CITY; spec names badge-keyed _WILD_GRADE_CURVE_BY_BADGES

---
id: ISSUE-032
severity: P2
category: inconsistency
anchor_symbol: STORY_WILD_GRADE_BY_CITY
current_line_hint: ~48903
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4b355ba97b85
confidence: high
status: open
---

**Title**: Wild grade curve is city-keyed STORY_WILD_GRADE_BY_CITY; spec names badge-keyed _WILD_GRADE_CURVE_BY_BADGES

**Evidence**:
```js
const STORY_WILD_GRADE_BY_CITY = [
    { g1:0,g2:0,g3:0,g4:100 }, // C0 ... keyed on arrived CITY index (0-7)
    ...
];
function _wildGradeWeightsForCity(city) { ... }
```

**Repro**: STORY_MODE_FLOW.md §3, §13(M2), §15f, §15g all reference `_WILD_GRADE_CURVE_BY_BADGES` "keyed on `sm.badges` (0-8)" as the wild grade source. grep = 0 matches; it does not exist. The shipped table is `STORY_WILD_GRADE_BY_CITY` keyed on city index. §15g's "G2 leak ramp" table (badges 6/7/8 -> g2 3/5/8) also does not match the city table (C5 g2:10, C6 g2:15, C7 g2:20).

**Blast radius**: Any reader trying to tune wild rarity from the spec edits a non-existent badge-keyed constant; the actual curve advances on city arrival, not badge count, so a player who is under-badged for their city sees richer wilds than the badge model implies. Spec's §3/§15f/§15g wild tables are all fictional.

**Fix sketch**: Update §3/§13/§15f/§15g to document `STORY_WILD_GRADE_BY_CITY` / `_wildGradeWeightsForCity` and the city-keyed model, or introduce the badge-keyed constant the spec describes.

**Verification**: find-anchor `_WILD_GRADE_CURVE_BY_BADGES` -> still missing; confirm `_wildGradeWeightsForCity` is the live path from `rollWildEncounter`.

---

## <a id="ISSUE-033"></a> ISSUE-033: Coin multiplier inverts the difficulty curve — harder modes earn less gold against tougher foes

---
id: ISSUE-033
severity: P2
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~31904
file: battle.html
agents: [story-mode-investigator]
fingerprint: 87f7a13f57dd
confidence: high
status: open
---

**Title**: Coin multiplier inverts the difficulty curve — harder modes earn less gold against tougher foes

**Evidence**:
```js
function storyDifficultyCoinMult() {
    if (diff === 'normal')    return 1.30;
    if (diff === 'easy')      return 1.50;
    if (diff === 'veryeasy')  return 1.60;
    if (diff === 'hard')      return 1.00;   // +15% foe stats, LEAST coins above hard
    if (diff === 'challenge') return 1.10;   // +30% foe stats, still below normal
}
```
The prior audit's "Hard pays ×0.92" was floored to parity, but the curve still inverts: Very Easy earns 1.60× while Very Hard earns 1.10× — i.e. the easier you play (weaker foes via the 14580 stat mult: veryeasy 0.70 … challenge 1.30) the *more* gold you get, against the same fixed shop / Colress / Link prices. Hard/Challenge players face the toughest foes with the thinnest economy and no compensating reward.

**Repro**: Compare total gold earned on a Very Easy vs Very Hard run to the same city; Very Hard is ~30% poorer while fighting +30%-stat foes.

**Blast radius**: Whole-run economy on Hard/Challenge; affects shop access, Colress gimmick swaps, Link upgrades, Stone/EV training affordability.

**Fix sketch**: Flatten or invert the coin curve so harder modes pay >= 1.30× (e.g. hard 1.30, challenge 1.45), or fold the difficulty into a single reward+threat formula instead of two opposed knobs.

**Verification**: Re-tabulate per-difficulty cumulative gold at City 6; harder tiers should not earn less than Normal.

---

## <a id="ISSUE-034"></a> ISSUE-034: G4-strip keys on party-size (partyEverReached2), not badges; contradicts spec's "most important refactor"

---
id: ISSUE-034
severity: P2
category: inconsistency
anchor_symbol: storyStripGrade4IfPartyMature
current_line_hint: ~35699
file: battle.html
agents: [spec-drift-auditor]
fingerprint: c199cd9db37a
confidence: high
status: open
---

**Title**: G4-strip keys on party-size (partyEverReached2), not badges; contradicts spec's "most important refactor"

**Evidence**:
```js
function storyStripGrade4IfPartyMature(gw) {
    if (!gw || !sm || !sm.active) return gw;
    const len = Array.isArray(sm.team) ? sm.team.length : 0;
    if (len >= 2) sm.partyEverReached2 = true;
    if (!sm.partyEverReached2) return gw;   // gate is party-size-ever, NOT badges
```

**Repro**: STORY_MODE_FLOW.md §12 ("keys the strip on `sm.badges < 1`") and §15f ("now gated on `badges < 2`") both say badges. §12/B2 calls moving difficulty signals off `sm.team.length` to `sm.badges` "the single most important refactor." Code still keys on team length (latched via `partyEverReached2`), never reads `sm.badges` here.

**Blast radius**: A player who beats the intro rival 1v1 but never reaches a 2-mon party (declines catch tutorial fill / immediately deposits) keeps the G4 ramp regardless of badge count; the latch fixes the PC-deposit exploit but the gate is still party-derived, not the monotonic badge clock the spec mandates. Wild/foe grade rolls diverge from the documented badge thresholds.

**Fix sketch**: Re-key the strip on `sm.badges` per spec (§12 says `< 1`, §15f says `< 2` — reconcile which), or update both spec sections to document the `partyEverReached2` latch model that ships.

**Verification**: Set `sm.badges = 0`, `sm.team.length = 2`; confirm whether the strip fires (badge model: no; current code: yes).

---

## <a id="ISSUE-035"></a> ISSUE-035: Party-cap "full" check counts eggs (`sm.team.length`) while foe-sizing / sell guards count only fighters

---
id: ISSUE-035
severity: P3
category: inconsistency
anchor_symbol: _catchHandleSuccess
current_line_hint: ~49751
file: battle.html
agents: [story-mode-investigator]
fingerprint: c6add40f42ff
confidence: medium
status: open
---

**Title**: Party-cap "full" check counts eggs (`sm.team.length`) while foe-sizing / sell guards count only fighters

**Evidence**:
```js
// _catchHandleSuccess (~49751) and renderCityActions (~42717) — eggs count toward the cap:
const partyFull = (sm.team || []).length >= maxParty;
const hasTeamRoom = sm.team.length < _partyCap;
// but foe sizing and sell guards exclude eggs:
function _storyCountFighters() { return (sm.team || []).filter(s => s && !s.isEgg).length; }
```
A daycare egg occupies a party slot for the catch / Professor "team room" check, so a player at 2 badges (cap 4) holding 3 fighters + 1 egg is treated as "party full" — a caught mon is forced to the PC and the Professor button hides, even though the player can only field 3 fighters. Foe sizing (`_storyEnemyPartySize`) and the sell/daycare guards meanwhile use the fighter count, so the player faces a badge-curve-sized foe team they can't fully match.

**Repro**: Get an egg into the party (daycare), then catch / visit Professor while `fighters + eggs == cap` — the new partner is shunted to PC / the Professor disappears though a fightable slot is effectively open.

**Blast radius**: Catch destination and Professor visibility when an egg is carried; mild fairness/clarity issue, no soft-lock.

**Fix sketch**: Decide one rule — either count eggs toward the active cap everywhere (and size foes off `sm.team.length`), or exclude eggs from the cap check (use `_storyCountFighters()` in `_catchHandleSuccess` / `renderCityActions`).

**Verification**: With an egg in party at sub-cap fighter count, a catch fields normally and the Professor stays visible.

---

## <a id="ISSUE-036"></a> ISSUE-036: Two near-duplicate global Escape keydown handlers both close the topmost modal

---
id: ISSUE-036
severity: P3
category: dx
anchor_symbol: _modalEscapeBound
current_line_hint: ~13649
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3aee2ffaaeaa
confidence: high
status: open
---

**Title**: Two near-duplicate global Escape keydown handlers both close the topmost modal

**Evidence**:
```js
if (!window.__pbsGlobalEscBound) { window.__pbsGlobalEscBound = true;
    document.addEventListener('keydown', function (e) { /* close topmost .modal:not(.hidden) */ }); }
// ...40 lines later...
if (!window._modalEscapeBound) { window._modalEscapeBound = true;
    document.addEventListener('keydown', function(e) { /* also close topmost .modal:not(.hidden) */ }); }
```

**Repro**: Read battle.html ~13610 and ~13649 — two separate guard flags register two document-level Escape listeners with overlapping logic (the second adds a game-confirm Promise carve-out; the first adds a `data-no-escape` carve-out). Both fire on every Escape.

**Blast radius**: Behavior is currently correct (both call closeModal, double-close is idempotent), but the two handlers respect different opt-out conventions (`data-no-escape` vs game-confirm), so a future modal that sets `data-no-escape` will still be closed by the second handler. Maintenance/drift hazard.

**Fix sketch**: Merge into one Escape handler that honors both the game-confirm Promise resolver and `data-no-escape`, behind a single guard flag.

**Verification**: Add `data-no-escape="true"` to a test modal, press Escape — it should stay open. Confirm game-confirm still resolves false on Escape.

---

## <a id="ISSUE-037"></a> ISSUE-037: Catch-tutorial ball gate counts the Master Ball, which can never be thrown outside boss mode

---
id: ISSUE-037
severity: P3
category: inconsistency
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~46048
file: battle.html
agents: [story-mode-investigator]
fingerprint: ba4c93ea58e7
confidence: medium
status: open
---

**Title**: Catch-tutorial ball gate counts the Master Ball, which can never be thrown outside boss mode

**Evidence**:
```js
const totalBalls = (balls.poke|0) + (balls.great|0) + (balls.ultra|0) + (balls.master|0);
if (totalBalls <= 0) return false;
```
The tutorial only requires "at least one ball," but counts the Master Ball — which is `masterLocked` and refused (`catchThrow` ~49641) anywhere but the Caged God. A player whose only ball is the Master Ball would have the tutorial fire with no throwable ball. Not reachable in normal flow (the v15 starter kit grants 5 Poké Balls and the Master Ball arrives post-HoF), but the gate is logically wrong.

**Repro**: Force `sm.balls = {poke:0,great:0,ultra:0,master:1}` pre-tutorial; tutorial fires but no ball can be thrown.

**Blast radius**: Catch tutorial only; latent.

**Fix sketch**: Exclude `master` from the tutorial's `totalBalls` (count only poke/great/ultra).

**Verification**: With only a Master Ball, the tutorial defers instead of firing.

---

## <a id="ISSUE-038"></a> ISSUE-038: Story tutorial overlay is a proper dialog but lacks a focus trap (Tab escapes to background)

---
id: ISSUE-038
severity: P3
category: a11y
anchor_symbol: _showStoryTutorialScene
current_line_hint: ~40327
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3d270f248237
confidence: medium
status: open
---

**Title**: Story tutorial overlay is a proper dialog but lacks a focus trap (Tab escapes to background)

**Evidence**:
```js
ov.setAttribute('role', 'dialog');
ov.setAttribute('aria-modal', 'true');
ov.setAttribute('aria-label', npcName || nameplate || 'Story Tutorial');
ov.tabIndex = -1;
// ... focuses Continue button on append, ESC/Enter dismiss — but no Tab trap
```

**Repro**: Trigger any STORY_TUTORIAL_SCENES overlay (e.g. firstWild catch tutorial). It correctly announces as a dialog and focuses Continue, but pressing Tab moves focus to background controls behind the dim layer instead of staying on the single Continue button.

**Blast radius**: All tutorial scenes. Lower impact than the narrative-overlay finding because the dialog semantics + Continue focus + ESC are already present; only the trap is missing. The same shared trap from the `openModal` finding would resolve this.

**Fix sketch**: Reuse the shared focus-trap helper proposed for `openModal` on the tutorial overlay (and the other fullscreen `role="dialog"` overlays) so Tab/Shift+Tab cannot leave while it is open.

**Verification**: Open a tutorial scene, press Tab several times, confirm focus stays on Continue (or cycles only within the overlay).

---

## <a id="ISSUE-039"></a> ISSUE-039: Comment claims foe sizing matches player team length, but code uses the badge curve

---
id: ISSUE-039
severity: P3
category: inconsistency
anchor_symbol: _storyEnemyPartySize
current_line_hint: ~45744
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5af7ce667724
confidence: high
status: open
---

**Title**: Comment claims foe sizing matches player team length, but code uses the badge curve

**Evidence**:
```js
// Comment (~45744): "Foe sizing matches player team length (see `_storyEnemyPartySize`)
//                     so the two stay locked together on the same progression clock."
// Actual _storyEnemyPartySize (~45720):
const badges = (sm && (sm.badges | 0)) || 0;
const badgeCurve = Math.min(6, 2 + badges);   // NOT player team length
return Math.max(floor, badgeCurve);
```
The function was deliberately changed (note at ~45708) to use the badge curve `min(6, 2+badges)` rather than player team length — which matches the canonical spec. But the adjacent comment block still says foe sizing tracks player team length, directly contradicting both the code and the pre-fix note a few lines above. A maintainer reading this will be misled about how non-catcher under-sizing works.

**Repro**: Read `battle.html` ~45708–45746; the two comments disagree on the foe-sizing rule.

**Blast radius**: Documentation only; no runtime impact. Risk is a future "fix" that re-introduces the under-sizing bug the note warns about.

**Fix sketch**: Update the ~45744 comment to state foe sizing follows the badge curve (player team length only matters for the intro Rival exception).

**Verification**: Comment matches `_storyEnemyPartySize` behavior.

---

## <a id="ISSUE-040"></a> ISSUE-040: Memory growth across 70 turns is non-leaking (flat ~104 MB post-GC) — prior "benign linear ~25 KB/turn" re-confirmed (no super-linear retention)

---
id: ISSUE-040
severity: P3
category: perf
anchor_symbol: benchMemoryGrowth
current_line_hint: ~78
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: a05e7c14d3b9
confidence: high
status: open
---

**Title**: Memory growth across 70 turns is non-leaking (flat ~104 MB post-GC) — prior "benign linear ~25 KB/turn" re-confirmed (no super-linear retention)

**Evidence**:
70-turn story-style replay (seed=0, `--expose-gc`, gc() before each sample):
```
turn  20  103.69 MB
turn  30  104.07 MB
turn  40  103.99 MB
turn  50  104.33 MB
turn  60  104.69 MB
```
Post-GC heap is **flat at ~104 MB** (turns 0/10 read ~212 MB pre-the-first-effective-GC, then settle). Linear regression over post-settle samples is essentially flat/slightly negative; no quadratic or unbounded term. The runTurn harness `reset()`s state each turn (no cross-turn accumulation), and no retained-reference growth is observed. Refutes a leak; confirms prior conclusion.

**Repro**: `node --expose-gc scripts/debug/perf-bench.mjs` (memory section) or 70-turn loop sampling `process.memoryUsage().heapUsed` every 10 turns after `global.gc()`.

**Blast radius**: None — informational. A real long story run (~68 events) would not accumulate battle-state heap per the measured pattern. (Caveat: the harness `reset()`s state every turn, so a per-turn leak inside `playTurn` would be masked; sprite/asset caches that live outside `state` — flagged historically as an unbounded sprite-prefetch cache — are not exercised by this jsdom turn loop and are out of scope here.)

**Fix sketch**: No action. Keep the `--expose-gc` + pre-sample `gc()` so the report doesn't show the misleading 212 MB pre-GC boot heap as turn-0 baseline; consider dropping the first two samples (pre-first-GC) from the chart.

**Verification**: Re-run; post-GC samples stay flat (~±1 MB) across 70 turns; slope ≈ 0 KB/turn.

---

## <a id="ISSUE-041"></a> ISSUE-041: perf-bench covers boot/turn/parseMove/memory but cannot benchmark rollTrainerTeam, makeWildBuild, or build power tiers (not exposed on window/__engine)

---
id: ISSUE-041
severity: P3
category: dx
anchor_symbol: benchParseMove
current_line_hint: ~55
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: 9d33b6e8c1a4
confidence: high
status: open
---

**Title**: perf-bench covers boot/turn/parseMove/memory but cannot benchmark rollTrainerTeam, makeWildBuild, or build power tiers (not exposed on window/__engine)

**Evidence**:
The mandate lists `rollTrainerTeam` (target <50 ms), `makeBuild`/`makeWildBuild` across T1–T4, but perf-bench.mjs has no harness for them and they are unreachable:
```
window.makeBuild       -> function   (reachable)
window.makeWildBuild   -> undefined  (inner-scope; NOT on window)
window.rollTrainerTeam -> undefined  (inner-scope; NOT on window)
engine.rollTrainerTeam -> undefined  (not in window.__engine export)
```
`window.__engine` (battle.html ~60001) exports parseMoveEffects/buildPokemon/AI internals but not the build/trainer roll functions. So 3 of the 6 mandated benchmarks have zero coverage. What IS measurable: `window.makeBuild` across 10 species × 20 trials = median 0.035 ms, max 4.465 ms (warm) — fast and flat, well within "flat across tiers", but tiers (T1–T4) can't be exercised because `STORY_BUILD_TIER` gating runs through `assignTrainers`/`rollTrainerTeam`, which aren't exposed.

Note: the previously-reported parseMoveEffects single-arg bug is **already fixed** (commit ad2f541) — the current bench calls the correct 5-arg signature `parseMoveEffects(attacker, defender, move, true)` and measures real parse time. Verified the old single-arg form still throws (`TypeError: Cannot read properties of undefined (reading 'effectStr')`), so the fix is load-bearing. This finding is the residual coverage gap, not the (closed) arg-count bug.

**Repro**: In the jsdom harness, `typeof window.rollTrainerTeam === 'undefined'` and `typeof window.makeWildBuild === 'undefined'`; grep `window.__engine = {` at battle.html ~60001 shows neither is exported.

**Blast radius**: DX/test-coverage only. rollTrainerTeam runs once per story battle (~68 events in a full run) and pulls the build power-tier hooks (`STORY_BUILD_TIER`, `_applyTrainerGradeMatrix`, per-slot `makeBuild`); it is the most plausible mid-game hitch yet has no perf guard rail. A regression there would ship unnoticed.

**Fix sketch**: Add `rollTrainerTeam`, `makeWildBuild`, `makeDesignedBuild` to the `window.__engine` test-harness export (alongside the existing AI internals) and add bench functions that roll 10 distinct trainer specs and build across the T1–T4 tiers. Read-only finding — no edit performed.

**Verification**: After exposure, `node scripts/debug/perf-bench.mjs` reports rollTrainerTeam median < 50 ms and makeBuild/makeWildBuild flat across T1–T4.

---

## <a id="ISSUE-042"></a> ISSUE-042: Catch flee/wobble flavor messages use `Math.random()` instead of `storyRngNext()`, breaking seed determinism

---
id: ISSUE-042
severity: P3
category: bug
anchor_symbol: catchThrow
current_line_hint: ~49701
file: battle.html
agents: [story-mode-investigator]
fingerprint: 0681a2dce375
confidence: high
status: open
---

**Title**: Catch flee/wobble flavor messages use `Math.random()` instead of `storyRngNext()`, breaking seed determinism

**Evidence**:
```js
fleeMessage = fleeMsgs[Math.floor(Math.random() * fleeMsgs.length)];
...
_catchState.message = wobbleMsgs[Math.floor(Math.random() * wobbleMsgs.length)];
```
The catch/flee *outcome* correctly uses `storyRngNext()`, but the displayed flavor line is picked with bare `Math.random()`. Cosmetic only, but violates the "seed determines everything" contract for shared-seed / daily-seed replays.

**Repro**: Run the same seed twice through a missed catch; the flavor string differs between runs.

**Blast radius**: Catch screen text only; no mechanical drift.

**Fix sketch**: Route both message picks through `storyRngNext()` when `sm.active`.

**Verification**: Same seed produces identical catch-screen flavor text across runs.

---

## <a id="ISSUE-043"></a> ISSUE-043: CODEBASE_MAP guardrails grossly stale: claims 29,908 lines / CSS 16-4156; file is 60,040 lines

---
id: ISSUE-043
severity: P3
category: dx
anchor_symbol: CODEBASE_MAP
current_line_hint: n/a
file: agent-state/CODEBASE_MAP.md
agents: [spec-drift-auditor]
fingerprint: ae3dcf22fd06
confidence: high
status: open
---

**Title**: CODEBASE_MAP guardrails grossly stale: claims 29,908 lines / CSS 16-4156; file is 60,040 lines

**Evidence**:
```text
CODEBASE_MAP.md: "battle.html — 29,908 lines"; "CSS | 16 - 4156"; "SAVE_VER = 15";
"STORY_EVENTS_RAW (68 rows) | ~22638"; "Safari (entry 2,500G ...)" then "800G entry"
Actual: 60,040 lines; SAVE_VER 22; STORY_EVENTS_RAW @ 29828; SAFARI_ENTRY_COST 10000.
```

**Repro**: `wc -l battle.html` -> 60040 (CODEBASE_MAP says 29,908 — file has grown >100%). Every line number in its anchor table is ~2x low. The "CSS = lines 16-4156" load-bearing guardrail is wrong (file doubled). The header even warns the table is stale and points to ANCHOR_INDEX.md, but the prose body (line counts, Safari cost, SAVE_VER, implementation-status section) is also stale and unmarked.

**Blast radius**: Any agent that reads CODEBASE_MAP for orientation (it's the documented first-read in HANDOFF "Resume protocol") gets a wrong size, wrong CSS bounds, wrong SAVE_VER, and contradictory Safari numbers. ANCHOR_INDEX.md is the fresh source but is far less complete.

**Fix sketch**: Regenerate CODEBASE_MAP's line counts and prose (size, CSS bounds, SAVE_VER, Safari cost, M0-M6 status) from current code, or demote it to a pure prose/architecture doc and delete all numeric anchors in favor of ANCHOR_INDEX.md.

**Verification**: CODEBASE_MAP line-count matches `wc -l battle.html`; CSS bound and SAVE_VER match grep.

---

## <a id="ISSUE-044"></a> ISSUE-044: A future-version save shows "Continue Run" but silently bounces to the menu with no explanation

---
id: ISSUE-044
severity: P3
category: dx
anchor_symbol: continueRun
current_line_hint: ~38992
file: battle.html
agents: [story-mode-investigator]
fingerprint: 89b458f3ac60
confidence: medium
status: open
---

**Title**: A future-version save shows "Continue Run" but silently bounces to the menu with no explanation

**Evidence**:
```js
function hasSave() { return !!localStorage.getItem(SAVE_KEY); }   // presence only
function load() { ... if (!d || d.version < 2 || d.version > SAVE_VER) return false; ... }
function continueRun() { if (!load()) { showMenu(true); return; } ... }  // silent bounce
```
`hasSave()` (which gates the Continue Run button) only checks presence, but `load()` rejects any save whose `version > SAVE_VER`. So a save written by a newer build (e.g. after a deploy/rollback, or a shared save) shows the Continue button, and clicking it silently returns to the menu with no toast or alert — the player can't tell the run still exists.

**Repro**: Set `pbs_story_save` to a JSON with `version: 99`. The menu shows "Continue Run"; clicking it does nothing visible.

**Blast radius**: Menu UX on version downgrade / cross-build saves. No data loss (the save is not cleared), but the failure is invisible.

**Fix sketch**: When `load()` fails on a future version, surface a toast ("This save was made by a newer version") and/or hide the Continue button when the stored `version > SAVE_VER`.

**Verification**: Future-version save either hides Continue or shows an explanatory message.

---

## <a id="ISSUE-045"></a> ISSUE-045: 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows

---
id: ISSUE-045
severity: P3
category: data
anchor_symbol: convertSmogonSet
current_line_hint: ~12238
file: data/builds/gen5.json
agents: [data-integrity-auditor]
fingerprint: d5fa11ffea9f
confidence: high
status: open
---

**Title**: 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows

**Evidence**:
```js
// data/builds/gen5.json — Aron/vgc2012/Level 1 Sturdy (no "nature" key)
{"moves":["Endeavor","Toxic","Sleep Talk","Protect"],"item":"Berry Juice"}
// also: Solosis/vgc2012/FEAR, gen8 Mewtwo/balancedhackmons/Sheer Force,
// gen9 Landorus/godlygift, Great Tusk/ubersuu, Iron Treads/ubersuu
```

**Repro**: `node -e 'const d=require("./data/builds/gen5.json");console.log("nature" in d.Aron.vgc2012["Level 1 Sturdy"])'` → false. CSV scan (`nature` is column 8) shows 0 blank-nature rows across 17397 rows.

**Blast radius**: Low. The fallback consumer `convertSmogonSet` (battle.html:12238) defaults a missing nature to `'Hardy'`, so the build still loads — but Hardy is neutral, silently dropping the intended nature (e.g. the Aron set is a Level-1 FEAR set whose nature is irrelevant, but Great Tusk/Iron Treads scarf sets lose their speed/offense nature). Only on the offline fallback path.

**Fix sketch**: Regenerate the mirror from the CSV pipeline (same root cause as the EV-total drift) so every build carries the CSV's nature, or have the generator emit the CSV default (`Hardy`) explicitly rather than omitting the key.

**Verification**: `node` scan over `data/builds/gen*.json` for builds lacking a `nature` key returns 0.

---

## <a id="ISSUE-046"></a> ISSUE-046: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` which silently drops `Set`/`undefined` in cloned state

---
id: ISSUE-046
severity: P3
category: bug
anchor_symbol: deepClone
current_line_hint: ~72
file: online-pvp.js
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

---

## <a id="ISSUE-047"></a> ISSUE-047: 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool

---
id: ISSUE-047
severity: P3
category: inconsistency
anchor_symbol: LEADER_VICTORY_LINES
current_line_hint: ~32045
file: battle.html
agents: [consistency-auditor]
fingerprint: 81701f439dcc
confidence: medium
status: open
---

**Title**: 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool

**Evidence**:
```js
// LEADER_VICTORY_LINES has 71 named leaders (+ LEADER_BADGE_REFLECTIONS, fully paired).
// TRAINER_QUOTES_BY_NAME only carries intro pools for ~11 of them (Brock, Misty, Lt. Surge,
// Erika, Koga, Sabrina, Blaine, Giovanni, Cynthia, Clair, Wallace…). The other 60
// (Falkner, Bugsy, Whitney, Roark, Milo, Nessa, Katy, Iono, Grusha, …) fall through to the
// generic 6-line TRAINER_QUOTES['Gym Leader'] pool. Hau has a CHAMPION_VICTORY_LINES entry
// but no TRAINER_QUOTES_BY_NAME intro pool.
```

**Repro**: Fight e.g. Leader "Iono" or "Grusha" in story mode — the badge-handover line is fully personalized, but the pre-battle intro is the generic "Enough talk. Show me the badge fight." class line. Asymmetric voicing within the same encounter.

**Blast radius**: Fanservice / polish only — not a bug (the role-pool fallback is intentional and correct). Elite Four are fully symmetric; this gap is leaders-only plus Hau.

**Fix sketch**: Add 2–3 per-name intro lines to TRAINER_QUOTES_BY_NAME for the 60 leaders that already have victory lines (and Hau), so intro and outro voicing match. Lower-priority content task, not a code fix.

**Verification**: Spot-check 3–4 of the previously-bare leaders in story mode and confirm a name-specific intro now appears.

---

## <a id="ISSUE-048"></a> ISSUE-048: `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html)

---
id: ISSUE-048
severity: P3
category: data
anchor_symbol: loadBuildsCSV
current_line_hint: ~10454
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: a937264b3e0e
confidence: medium
status: open
---

**Title**: `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html)

**Evidence**:
```js
// battle.html:10454 (loadBuildsCSV) — the only declaration of the sentinel
i: !itemPicked ? '' : itemPicked === 'No Item' ? 'NO_ITEM' : itemPicked,
// data/items.json has no key "noitem" and no entry whose name === "No Item".
```

**Repro**: `node -e 'const i=require("./data/items.json")["9"];console.log(Object.keys(i).some(k=>k==="noitem")||Object.values(i).some(e=>e&&e.name==="No Item"))'` → false. The CSV uses the literal `No Item` in the `item` column; the engine special-cases it to `NO_ITEM` at load and the data-validator skips it. It works today, but the empty-held-item enum is defined implicitly in three places (CSV value `No Item`, runtime token `NO_ITEM`, display fallback) with no canonical declaration.

**Blast radius**: Low. No current bug — the string is handled. Risk is drift: a new code path that reads `mon.item` and looks it up in `items.json` (e.g. a new tooltip or shop screen) would miss the sentinel and either render nothing or crash, since `items.json` cannot resolve it. Same class of implicit-enum fragility as a missing reference.

**Fix sketch**: Document the empty-held-item sentinel contract in one place (constant + comment), or add a synthetic `No Item` / `NO_ITEM` entry to items.json (or a shared constants module) so every consumer resolves it identically. Read-only finding — no data edit performed.

**Verification**: Grep shows a single canonical definition of the empty-item sentinel; any `items.json` lookup of `mon.item` resolves for the empty slot without a special-case branch.

---

## <a id="ISSUE-049"></a> ISSUE-049: Unguarded 'dex probe Pikachu' console.log left in the data-load path

---
id: ISSUE-049
severity: P3
category: dx
anchor_symbol: loadGameData
current_line_hint: ~10153
file: battle.html
agents: [consistency-auditor]
fingerprint: 8ba77baaea7f
confidence: high
status: open
---

**Title**: Unguarded 'dex probe Pikachu' console.log left in the data-load path

**Evidence**:
```js
if (n === 0) {
    try {
        const probe = D.species.get('Pikachu');
        ...
        console.log('[SpriteScale] dex probe Pikachu', { id, heightmOnClass: ... });   // unguarded
    } catch (e) { console.log('[SpriteScale] dex probe failed', e); }
}
```

**Repro**: Load battle.html with a normal (non-debug) session and open the console — `[SpriteScale] dex probe Pikachu …` prints on every page load. Unlike the neighboring SpriteScale logs (10143, 10147) it is NOT gated behind `window.__DEBUG_SPRITE_SCALE` / `__DEBUG_LOADS`.

**Blast radius**: Console noise on every load; leftover developer probe shipped to production. No functional impact.

**Fix sketch**: Gate the probe behind `window.__DEBUG_SPRITE_SCALE` (matching the surrounding logs) or remove the `n === 0` probe block.

**Verification**: Reload without any `__DEBUG_*` flag set; confirm no `dex probe` line appears.

---

## <a id="ISSUE-050"></a> ISSUE-050: Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read

---
id: ISSUE-050
severity: P3
category: data
anchor_symbol: loadGameData
current_line_hint: ~10173
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 0bb12c949196
confidence: high
status: open
---

**Title**: Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read

**Evidence**:
```js
const speciesJSON  = speciesJSONOrig['9'] || {};   // gens 1-8 discarded
const movesJSON    = movesJSONOrig['9']   || {};
const naturesJSON  = naturesJSONOrig['9'] || {};
const itemsJSON    = itemsJSONOrig['9']   || {};
const abilitiesJSON= abilitiesJSONOrig['9']|| {};
```

**Repro**: `node -e 'for(const f of ["moves","species","abilities","items"]){const o=require("./data/"+f+".json");const g9=new Set(Object.keys(o["9"]));let older=0;for(const g of Object.keys(o)){if(g==="9")continue;older+=Object.keys(o[g]).length;}console.log(f,older)}'` → moves 1253, species 504, abilities 463, items 606 older-gen entries. Every older-gen key also exists in gen 9, so these are Pokémon-Showdown per-gen override deltas (e.g. Bide `type:"???"` in gen 1/4), not distinct content — and the gen-9-only loader never applies them.

**Blast radius**: None functionally (the engine is intentionally a single-gen-9 dex), but ~2.8k dead delta entries inflate the four large JSON payloads (~1.9 MB combined) that load on every boot, and they invite future confusion ("why is my gen-4 Bide edit ignored?"). Pure dead-data / payload bloat.

**Fix sketch**: Either strip the non-`"9"` gen blocks from the shipped JSON (smaller boot payload) or, if multi-gen support is planned, wire a per-gen merge that actually applies `inherit:true` deltas. Document that the runtime is gen-9-only.

**Verification**: Boot-time payload shrinks; `Object.keys(JSON)` of each shipped data file is `["9"]` only (if stripped), or the loader demonstrably reads the chosen gen block (if multi-gen is added).

---

## <a id="ISSUE-051"></a> ISSUE-051: 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX

---
id: ISSUE-051
severity: P3
category: inconsistency
anchor_symbol: MOVE_SFX_MAP
current_line_hint: ~15
file: move-sfx-map.js
agents: [consistency-auditor]
fingerprint: 6d3450d7cd4d
confidence: high
status: open
---

**Title**: 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX

**Evidence**:
```js
// move-sfx-map.js line 15 — space form, NEVER matched (no move is named this):
'All Out Pummeling': ['…PRSFX- All Out Pummeling1.wav', '…2.wav', '…3.wav'],
// line 776 — hyphen form (the canonical name) points at generic Counter SFX:
'All-Out Pummeling': ['…PRSFX- Counter1.wav', '…PRSFX- Counter2.wav'],
```

**Repro**: Canonical move name is `'All-Out Pummeling'` (battle.html:14031, 15160; move-anim-map.js:17). `AudioSystem.playMoveSound` does a direct `MOVE_SFX_MAP[move.name]` lookup (battle.html:11788) with no hyphen normalization, so the space-form line-15 entry is unreachable dead data, and the move resolves to the line-776 entry — the dedicated Pummeling .wav files are orphaned and the Z-move plays Counter SFX.

**Blast radius**: Cosmetic audio only — the Fighting Z-move uses placeholder Counter SFX instead of its three dedicated clips. No gameplay effect.

**Fix sketch**: Delete the dead `'All Out Pummeling'` (space) key and point `'All-Out Pummeling'` at the three dedicated Pummeling .wav files. Audit other hyphen/space mismatches between the two map files while here (e.g. confirm 'Savage Spin-Out' matches).

**Verification**: Use the Fighting-type Z-move in battle; confirm the dedicated Pummeling SFX play rather than Counter.

---

## <a id="ISSUE-052"></a> ISSUE-052: Mystery Figure roster collapsed to single 'the_first' (v22); STORY_NARRATIVE_VARIANTS still documents 9-identity cast

---
id: ISSUE-052
severity: P3
category: inconsistency
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~32538
file: battle.html
agents: [spec-drift-auditor]
fingerprint: e72599329786
confidence: medium
status: open
---

**Title**: Mystery Figure roster collapsed to single 'the_first' (v22); STORY_NARRATIVE_VARIANTS still documents 9-identity cast

**Evidence**:
```js
// v22 3-track collapse: the 7 trainer-cameo identities + 2 variant-exclusive
// identities (9 total: cyrus, ghetsis, ...) are retired in favor of The First.
const MYSTERY_FIGURE_IDENTITIES = { the_first: { sprite: 'Red', reveal: 'The First', ... } };
```

**Repro**: docs/STORY_NARRATIVE_VARIANTS.md (line ~618, `battle.html:26426`) and the prior design refer to `MYSTERY_FIGURE_IDENTITIES` as a rotating multi-identity cast. Code now has exactly one identity (`the_first`); the comment explicitly says the 9-identity cast was "retired" per STORY_3TRACK_IMPL_PLAN.md decision 5.

**Blast radius**: Narrative-variants doc describes mystery-figure rotation that no longer occurs; a writer extending the cast from that doc would re-introduce retired identities. Anchor `battle.html:26426` also stale (now ~32538).

**Fix sketch**: Add a note to STORY_NARRATIVE_VARIANTS.md that the multi-identity roster was collapsed to `the_first` in v22, or revive the roster if rotation is still intended.

**Verification**: Confirm `MYSTERY_FIGURE_IDENTITIES` has one key; cross-check STORY_3TRACK_IMPL_PLAN.md decision 5.

---

## <a id="ISSUE-053"></a> ISSUE-053: Damage formula folds all modifiers into one multiply + single floor (no per-step pokeRound)

---
id: ISSUE-053
severity: P3
category: inconsistency
anchor_symbol: parseMoveEffects
current_line_hint: ~23640
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b0a0252096e0
confidence: low
status: open
---

**Title**: Damage formula folds all modifiers into one multiply + single floor (no per-step pokeRound)

**Evidence**:
```js
let modifier = stab * typeEff * crit * rng * lifeOrb;   // ...then many more *= mods...
let damage = Math.floor((Math.floor(Math.floor(22 * basePower * (A / D)) / 50) + 2) * modifier);
```
Showdown applies STAB, type, crit, burn, item, and the 0.85-1.0 roll as discrete chained `pokeRound`/floor steps, re-flooring after each. This engine multiplies them together and floors once. Result drifts by ±1-2 HP versus Showdown in some matchups (documented as "COMPETITIVE FIX" so likely intentional). Immunity (typeEff===0) is correctly short-circuited to 0 at line 23631 before the `Math.max(1, ...)`, so the classic "immune -> 1 damage" bug is NOT present.

**Repro**: `node --test tests/suites/damage-formula.test.js` passes (tests accept ranges). Precise per-roll comparison vs Showdown calc would show occasional ±1.

**Blast radius**: Sub-HP-point damage drift; can shift a borderline OHKO/2HKO in rare cases. Low impact at Lv50 ranges.

**Fix sketch**: If exact Showdown parity is desired, re-floor after each modifier group (pokeRound). Otherwise document as an accepted deviation in tests/reports/deviations.md.

**Verification**: Cross-check a set of known Showdown damage rolls against engine output for borderline KOs.

---

## <a id="ISSUE-054"></a> ISSUE-054: parseMoveEffects per-move variance (308× raw) is GC/JIT jitter, NOT a pathological move — real per-move cost ~0.014 ms

---
id: ISSUE-054
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: ~26076
file: battle.html
agents: [performance-profiler]
fingerprint: 4f7a0c2b9e18
confidence: high
status: open
---

**Title**: parseMoveEffects per-move variance (308× raw) is GC/JIT jitter, NOT a pathological move — real per-move cost ~0.014 ms

**Evidence**:
First-pass over 100 distinct moves (lightly warmed): median 0.018 ms, max 2.96 ms ("Bulk Up"), p95 1.46 ms → 308× max/min ratio. But when the apparent "slow" moves are warmed 20× and measured individually they collapse to steady state:
```
Bulk Up        warmed median 0.0137 ms
Bulldoze       warmed median 0.0164 ms
Acid Spray     warmed median 0.0162 ms
Aromatic Mist  warmed median 0.0122 ms
```
Fully warmed (5 passes) over 100 moves: median **0.0141 ms**, but the "slowest" call moves to a *different* move each run (Bulk Up → Aromatic Mist), and the residual ~128× ratio rides whichever call a GC pause lands on. The variance is measurement noise (JIT first-call + GC), not an intrinsic hot move. The prior run's "315× variance → slow move doing something pathological" is **refuted**.

**Repro**: Warm each suspect move 20× then time 50 calls → steady-state ~0.013–0.016 ms; the "slow" label does not stick to any move across runs.

**Blast radius**: None at runtime. Real per-move parse is ~0.014 ms median, **35× under** the 0.5 ms target; parseMoveEffects is not a hot path. The only artifact is in the bench report (raw max/IQR look alarming pre-warm-up).

**Fix sketch**: No engine change. In benchParseMove, add a warm-up pass (loop the move set 3–5× before the measured loop) so the reported median/max reflect steady state, matching what the turn-loop bench already does for JIT. Optionally `--expose-gc` between samples.

**Verification**: Re-run with warm-up; confirm max collapses toward median (~0.02 ms) and no move is a stable outlier.

---

## <a id="ISSUE-055"></a> ISSUE-055: Turn-loop tail (p95 ~30 ms, max ~46 ms vs ~6–20 ms median) is GC/jsdom-timer jitter, not a localizable per-turn hot path

---
id: ISSUE-055
severity: P3
category: perf
anchor_symbol: playTurn
current_line_hint: ~23826
file: battle.html
agents: [performance-profiler]
fingerprint: c2a8f0341e77
confidence: high
status: open
---

**Title**: Turn-loop tail (p95 ~30 ms, max ~46 ms vs ~6–20 ms median) is GC/jsdom-timer jitter, not a localizable per-turn hot path

**Evidence**:
Measured (jsdom, seed=0). Per-move-slot, 40 trials each, Pikachu vs Snorlax:
- slot 0 Thunderbolt: med 6.06, p95 33.65, max 35.73 ms
- slot 1 Quick Attack: med 18.20, p95 32.65, max 32.89 ms
- slot 2 Iron Tail: med 5.95, p95 29.68, max 32.94 ms
- slot 3 Splash: med 13.09, p95 20.11, max 21.25 ms

The ~30 ms tail appears on EVERY slot regardless of move complexity (Splash, a no-op, tails as hard as Thunderbolt). A fixed Thunderbolt×120 run: med 19.87, p95 23.45, max 37.46, with **zero turns exceeding 2× median**. The prior run's "~50 ms median / 78–84 ms max, 5× median" reproduces only as a heavy *tail*, not a localizable code path — it tracks GC pauses and jsdom `setTimeout`-backed microtask scheduling, not a specific move/branch.

**Repro**: `node --expose-gc scripts/debug/perf-bench.mjs`; or per-slot harness timing `runTurn` across 40 trials per slot — observe the tail is slot-independent.

**Blast radius**: jsdom measurement only. Production turn timing is governed by `settings.animations` + the real `sleep` (line ~12327), which the harness short-circuits to `Promise.resolve()` — so this jsdom tail does NOT correspond to player-visible input lag. Median (6–20 ms) and even max (≤46 ms) stay under the 50 ms jsdom target. No production regression.

**Fix sketch**: No code fix warranted. For cleaner CI signal, run the turn-loop bench under `--expose-gc` with a forced `global.gc()` between trials and report median+IQR (already done) rather than max, since max is dominated by GC landing. Optionally pin trial count higher to stabilize p95.

**Verification**: Re-run turn-loop bench with `--expose-gc`; confirm max tightens toward p95 and no single move slot is a consistent outlier.

---

## <a id="ISSUE-056"></a> ISSUE-056: STORY_FEATURES_INTEGRATION §4 lists Safari fee ~500G; code + canonical flow say 10,000G

---
id: ISSUE-056
severity: P3
category: inconsistency
anchor_symbol: SAFARI_ENTRY_COST
current_line_hint: ~47912
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 44622866c38b
confidence: high
status: open
---

**Title**: STORY_FEATURES_INTEGRATION §4 lists Safari fee ~500G; code + canonical flow say 10,000G

**Evidence**:
```js
const SAFARI_ENTRY_COST = 10000;   // battle.html:47912
```

**Repro**: docs/STORY_FEATURES_INTEGRATION.md §4 (a "Shipped and live" section): "Fee ~500G entry (tune)". STORY_MODE_FLOW.md §4 says `SAFARI_ENTRY_COST (10,000G)`, which matches code. The integration doc is 20x off. (Also note: the stale CODEBASE_MAP.md says "entry 2,500G" then "800G" — both also wrong.)

**Blast radius**: Cosmetic doc drift only; the canonical flow and code agree at 10,000G. Misleads anyone reading the integration doc for the live number.

**Fix sketch**: Update STORY_FEATURES_INTEGRATION.md §4 to 10,000G (or point it at STORY_MODE_FLOW.md §4 as canonical).

**Verification**: One-line grep diff: doc says 10,000G matching `SAFARI_ENTRY_COST`.

---

## <a id="ISSUE-057"></a> ISSUE-057: SAVE_VER is 22 with v21/v22 migrations; spec + ANCHOR_INDEX + CODEBASE_MAP stop at 15-20

---
id: ISSUE-057
severity: P3
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~34133
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5614d348ca6e
confidence: high
status: open
---

**Title**: SAVE_VER is 22 with v21/v22 migrations; spec + ANCHOR_INDEX + CODEBASE_MAP stop at 15-20

**Evidence**:
```js
const SAVE_VER = 22;   // battle.html:34133
// migrations present: PreV8, PreV15, PreV16, PreV17, (V18 = diacritic-only), PreV19, PreV20, PreV21, PreV22
```

**Repro**: `agent-state/ANCHOR_INDEX.md` lists only `migrateStoryPreV15` and implies `SAVE_VER = 15`; `agent-state/CODEBASE_MAP.md` says `SAVE_VER = 15`. STORY_MODE_FLOW.md's deepest migration sections describe v19/v20 (§15b, §15f-15h) and never mention v21 (`relative egg-hatch`) or v22 (`3-track`). No spec section documents the v21/v22 schema changes.

**Blast radius**: Migration-completeness audits (required check #3) cannot map v21/v22 to a documented pre-migration schema; an agent trusting the docs would think v15 is current and mis-handle 7 newer save versions. Note v18 is intentionally a diacritic-only content migration (`migrateStoryTrainerDiacriticsPreV18`), not a schema gap — that part is fine.

**Fix sketch**: Add v21 (relative egg-hatch) and v22 (3-track collapse) schema sections to STORY_MODE_FLOW.md; refresh CODEBASE_MAP.md's `SAVE_VER` line.

**Verification**: Spec lists a migration subsection for each of v15-v22; CODEBASE_MAP shows `SAVE_VER = 22`.

---

## <a id="ISSUE-058"></a> ISSUE-058: 66 allAdjacentFoes damaging moves are it.todo but assertable as plain HP-drop in singles

---
id: ISSUE-058
severity: P3
category: test-gap
anchor_symbol: spread-damaging
file: tests/moves/by-category/special.test.js
agents: [test-coverage-filler]
fingerprint: adc6cc9a5517
confidence: high
status: open
---

**Title**: 66 allAdjacentFoes damaging moves are it.todo but assertable as plain HP-drop in singles

**Evidence**:
```js
// generate-move-tests.js marks target:'allAdjacentFoes'/'allAdjacent' as todo (needs doubles),
// but the singles harness applies the move to the single foe and HP drops:
await runTurn({ playerMon: atk, foeMon: def }); // Earthquake: def.currentHp 145 -> 115
assert.ok(def.currentHp < before); // passes today
```

**Repro**: Probe harness ran Earthquake (spread Ground move) in singles: defender HP fell 145->115. 32 of these 66 also have a declared `secondary` (14 status, 12 boost, 4 volatile) that fires with seed 0.

**Blast radius**: Largest single cluster (66/351). Examples: Surf, Blizzard, Heat Wave, Hyper Voice, Rock Slide, Earthquake, Explosion, Discharge (par), Lava Plume (brn), Muddy Water, Sludge Wave (psn), Bulldoze (spe drop).

**Fix sketch**: `/fix-todo-test spread-damaging` -> draft asserting defender HP drop for all 66, plus secondary status/boost/volatile assertion (seed 0) for the 32 that declare one. Spread mechanics (0.75x in doubles) are NOT assertable in singles — note that limitation, don't fake it.

**Verification**: `node --test tests/moves/by-category/_drafts/spread-damaging.test.js` all green.

---

## <a id="ISSUE-059"></a> ISSUE-059: 46 volatile-status moves are it.todo but assert with one mon.volatile flag check

---
id: ISSUE-059
severity: P3
category: test-gap
anchor_symbol: status-volatile
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: 9ea53f271f71
confidence: high
status: open
---

**Title**: 46 volatile-status moves are it.todo but assert with one mon.volatile flag check

**Evidence**:
```js
// Confuse Ray probe:
await runTurn({ playerMon: atk, foeMon: def });
// def.volatile.confusion === 1  (and taunt, leechSeed, aquaRing, stockpile, protect,
// perishCount, ingrain, encore, disable, focusEnergy, destinyBond all live on mon.volatile)
```

**Repro**: Probe set Confuse Ray -> `def.volatile.confusion === 1`. `mon.volatile` exposes ~80 flags covering this entire cluster.

**Blast radius**: 46 status moves: Confuse Ray, Taunt, Leech Seed, Substitute, Protect/Detect/King's Shield/Spiky Shield/Baneful Bunker/Obstruct/Silk Trap/Burning Bulwark, Encore, Disable, Aqua Ring, Ingrain, Magnet Rise, Stockpile, Focus Energy, Destiny Bond, Yawn, Torment, Embargo, Foresight, Nightmare, Endure, Follow Me/Rage Powder/Spotlight, etc.

**Fix sketch**: `/fix-todo-test status-volatile` -> draft mapping each move to its expected `mon.volatile.<flag>` (target vs self). Protect-family: assert the volatile is set after use AND that a follow-up move is blocked. Yawn/Nightmare/Leech Seed: assert the flag; defer multi-turn tick to a separate pass.

**Verification**: `node --test tests/moves/by-category/_drafts/status-volatile.test.js` all green.

---

## <a id="ISSUE-060"></a> ISSUE-060: Doc battle.html:LINE anchors stale across specs (18/50 drifted) + several renamed symbols

---
id: ISSUE-060
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29828
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 6321f44e5d84
confidence: high
status: open
---

**Title**: Doc battle.html:LINE anchors stale across specs (18/50 drifted) + several renamed symbols

**Evidence**:
```text
STORY_MODE_FLOW.md:53  battle.html:21273  STORY_EVENTS_RAW  -> now 29828
STORY_MODE_FLOW.md:123 battle.html:28560  catchRate tables  -> _CATCH_RATE_BY_GRADE @ 48669
STORY_MODE_FLOW.md:584 battle.html:34883  makeWildBuild     -> now 49061
NARRATIVE_VARIANTS:612 battle.html:30566  STORY_BEATS       -> now 39046
NARRATIVE_VARIANTS:619 battle.html:33069  _showIntroRivalColdOpen -> now 46455
```

**Repro**: `node scripts/debug/spec-drift.mjs` -> "18/50 battle.html:LINE references appear to have drifted." All 50 refs were written against a ~21k-30k file; battle.html is now 60,040 lines so virtually every numeric anchor is wrong. Symbols still exist; only line numbers drifted (expected) — but the spec text presents them as current.

Separately, several spec function-name anchors are RENAMED in code (feature present, doc name wrong): `_WILD_GRADE_CURVE_BY_BADGES` -> `STORY_WILD_GRADE_BY_CITY`; `_storyMaxSigGradeForGw` -> `_storySigGradeCeiling`; `_daycareHatch` -> `_daycareRunSecret`/`_daycareRollHatchSpecies`; `enterStoneEmporium` -> `enterStoneShop`; `_seedFanClubAcrossCities` (no equivalent; Fan Club seeded inline in renderCityActions). Representative sample of 5 listed above.

**Blast radius**: Low individually (symbols resolve via find-anchor) but high in aggregate: the spec's "jump to battle.html:LINE" affordance (§intro) is non-functional, and the renamed-symbol cases can make a reader believe a feature is missing when it ships under a new name.

**Fix sketch**: Run `npm run debug:spec-drift` and bulk-update the docs' line numbers (or strip them in favor of symbol names per the spec's own anchor-drift note). Fix the 5 renamed-symbol anchors above so find-anchor resolves them.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs after update; the 5 renamed symbols resolve via `symbol-index.mjs --lookup`.

---

## <a id="ISSUE-061"></a> ISSUE-061: 28 conditional-BP moves need per-move precondition tuning before damage assertion

---
id: ISSUE-061
severity: P3
category: test-gap
anchor_symbol: variable-power-conditional
file: tests/moves/by-category/physical.test.js
agents: [test-coverage-filler]
fingerprint: 668afcfbc625
confidence: medium
status: open
---

**Title**: 28 conditional-BP moves need per-move precondition tuning before damage assertion

**Evidence**:
```text
Low Kick/Grass Knot -> defender weight; Heat Crash/Heavy Slam -> weight ratio;
Gyro Ball/Electro Ball -> speed ratio; Facade -> 2x when user brn/par/psn;
Reversal/Flail -> user HP%; Return/Frustration -> friendship; Fake Out/First
Impression -> only turn 1; Sucker Punch/Upper Hand -> foe must attack.
```

**Repro**: data/moves.json declares no fixed basePower for these (`basePowerCallback`); damage must be compared against a constructed condition rather than asserted as a constant.

**Blast radius**: 28 moves split sp:5 / ph:23. Highest-effort damaging cluster; several preconditions (turn-1 Fake Out, foe-attacks Sucker Punch) overlap counter-like setup.

**Fix sketch**: Split into two `/fix-todo-test` batches (weight/speed-scaled vs status/HP/turn-scaled). For each, build two scenarios bracketing the condition and assert damage ordering (low vs high), not absolute BP. Leave any move whose condition can't be built in singles as todo.

**Verification**: `node --test tests/moves/by-category/_drafts/variable-power-conditional-*.test.js` green; assertions compare relative damage across the two bracketed scenarios.

---
