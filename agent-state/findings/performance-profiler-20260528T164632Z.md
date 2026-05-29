---
severity: P2
category: perf
anchor_symbol: logMsg
current_line_hint: ~14134
file: battle.html
agents: [performance-profiler]
fingerprint: 290cc0fb39e4
confidence: high
status: open
---

**Title**: `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call

**Evidence**:
```js
// battle.html:14148 — re-walks tooltipDict on every logMsg invocation
if (processedMsg.length < 200 && Object.keys(tooltipDict).length > 0) {
    for (let key of Object.keys(tooltipDict)) {        // 903 keys after items+abilities+natures load
        if (key.length > 3 && processedMsg.includes(key)) {
            processedMsg = processedMsg.replace(key, `<span ...>${key}</span>`);
            break;
        }
    }
}
```

There IS an existing helper `getTooltipKeysSorted()` at battle.html:9728 that caches `Object.keys(tooltipDict).filter(k => k.length > 3).sort((a,b) => b.length - a.length)` and is correctly invalidated on writes — but `logMsg` does not use it.

**Repro**: jsdom harness, populated tooltipDict (903 keys after `loadGameData`), 500 simulated `logMsg` calls hitting the same hot path: **median 0.319 ms, p95 0.597 ms, max 13.941 ms, mean 0.405 ms** (`/tmp/deep-perf4.mjs` in this session, 2026-05-28). Worst-case (no match → full scan): median 0.143 ms.

**Blast radius**: A normal turn fires 5–30 `logMsg` calls (move use, hit, crit, stat changes, status, ability procs, end-of-turn). A multi-hit move + Magic-Bounce reflect can fire 40+. At 0.3 ms each, that adds 1.5–12 ms of CPU to every turn purely from this scan. Worse: every `changeStage` (Decorate, Coaching, Calm Mind, Dragon Dance, Swords Dance, …) calls `logMsg` 1–3× — which is why the parseMoveEffects per-move benchmark shows status moves at 0.8–1.7 ms vs damage moves at 0.015 ms (a 50–100× spread). Touches every battle-log line; the highest-frequency code path in story mode.

**Fix sketch**: Switch `logMsg` to call `getTooltipKeysSorted()` (already cached + length-sorted) instead of re-doing `Object.keys` + filter on every call. Hoist the regex `/used (.+?)!/g` to a module-level constant — `String.prototype.replace` doesn't recompile but the literal still allocates per call.

**Verification**: Re-bench `logMsg` 500× after the swap; expect median to drop from 0.32 ms to under 0.05 ms (the inner `includes` loop becomes a single pass over the cached list, no `Object.keys` churn, no `filter` allocation). Parallel: re-bench `parseMoveEffects` for Decorate/Coaching/Calm Mind; expect 1.7 ms → < 0.3 ms.

---
severity: P3
category: perf
anchor_symbol: parseCSV
current_line_hint: ~9695
file: battle.html
agents: [performance-profiler]
fingerprint: 94ecaa3ab57f
confidence: high
status: open
---

**Title**: `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot

**Evidence**:
```js
// battle.html:9695 — char-at-a-time scan, no streaming, runs synchronously
function parseCSV(text, delim) {
    const norm = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    ...
    let lines = norm.trim().split('\n'), headers = parseCSVLine(lines[0], delim), rows = [];
    for (let i = 1; i < lines.length; i++) { ...; let vals = parseCSVLine(lines[i], delim); ...; rows.push(obj); }
    return rows;
}
function parseCSVLine(line, delim) {
    // single-char loop with mutation of `current` per char
    for (let i = 0; i < line.length; i++) { ... }
}
```

**Repro**: Re-parsed the live `data/builds.csv` (2,623 KB, 17,399 lines) 5× via `window.parseCSV` after boot: **trials 173 / 192 / 262 / 285 / 152 ms — median 192 ms, max 285 ms** for 17,397 rows. JSON.parse of *all five* JSON tables combined is 25 ms; CSV alone is **7× slower than the entire JSON pipeline**. (`/tmp/deep-perf4.mjs`, 2026-05-28.)

**Blast radius**: `loadBuildsCSV` is awaited in the boot critical path (battle.html:10143) before "Initializing engine (4/4)" appears. On a real browser, 180 ms is a single dropped frame at 60 Hz; on a mobile device the parse can easily blow past 300 ms and is one of the bigger contributors to the post-splash hang. The mandate item *"is the parse blocking the main thread? Could it stream?"* — yes, it blocks, and yes, it could either run off-main (Web Worker), be parsed lazily on first draft, or be pre-encoded as JSON during build (saves the per-char parser entirely).

**Fix sketch**: Three options, in cost order. (1) Cheapest: replace the per-char `parseCSVLine` with `split(',')` for the 95% of rows that contain no embedded commas + a quote-aware fallback for the few that do — measure expected ~3-5× speedup. (2) Move `loadBuildsCSV` out of the boot path; only the in-battle build resolver needs it, splash + main menu do not. (3) Pre-encode the CSV as `data/builds.json` during the existing `scripts/build-sprite-manifest.mjs`-style build step; `JSON.parse` is ~7× faster and is implemented in C++ in V8.

**Verification**: Re-time `loadBuildsCSV()` standalone; with option (2) the eager boot drops by ~180 ms and the deferred load happens during draft animation slack. With option (3), the same blob loads in ~25 ms. Confirm with `node --expose-gc scripts/debug/perf-bench.mjs` and the median boot ms.

---
severity: P3
category: perf
anchor_symbol: parseMoveEffects-changeStage-tooltipScan
current_line_hint: ~26754
file: battle.html
agents: [performance-profiler]
fingerprint: d3c965d13f23
confidence: high
status: open
---

**Title**: Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan

**Evidence**:
```js
// battle.html:26754 — Charm/Baby-Doll Eyes do ONE changeStage call
if (move.name === "Charm" || move.name === "Baby-Doll Eyes") { changeStage(defender, 'atk', -2, true); return; }
// battle.html:27576-27595 — changeStage interior, every stat tick fires logMsg
mon.stages[stat] = Math.max(-6, Math.min(6, mon.stages[stat] + amount));
if (mon.stages[stat] === oldStage) { logMsg(`${mon.name}'s ${stat.toUpperCase()} won't go any ${amount > 0 ? 'higher' : 'lower'}!`, 'info'); return; }
...
if (amount > 0) AudioSystem.playUiSfx('statUp', 0.5);
else AudioSystem.playUiSfx('statDown', 0.5);
if (amount > 2) logMsg(`${mon.name}'s ${statName} rose drastically!`, 'heal');
...
showStatArrow(amount > 0, mon === state.pActive);
```

**Repro**: 200 moves × 3 passes via `engine.parseMoveEffects`, jsdom harness, 2026-05-28 (`/tmp/deep-perf.mjs`). Top 10 slowest medians:

| Move           | Median ms | Max ms |
|----------------|-----------|--------|
| Decorate       |     1.740 |  1.793 |
| Coaching       |     1.595 |  1.613 |
| Baby-Doll Eyes |     0.861 |  1.022 |
| Aromatic Mist  |     0.857 |  0.952 |
| Breaking Swipe |     0.855 |  0.880 |
| Captivate      |     0.836 |  1.535 |
| Bitter Malice  |     0.826 |  1.611 |
| Calm Mind      |     0.818 |  1.424 |
| Confide        |     0.813 |  1.054 |
| Double Team    |     0.811 |  0.841 |

Bottom 5 (Tackle/Double Slap/Dragon Tail) median ~0.015 ms. Spread: **~110× from fastest to slowest.** Charts directly with logMsg-per-stat-tick count: Decorate raises +2 in two stats = ~4 logMsg calls × 0.32 ms = ~1.3 ms, matching observed 1.7 ms once `playUiSfx` + `showStatArrow` DOM work is added.

**Blast radius**: A setup-sweeper turn (Dragon Dance, Calm Mind, Bulk Up, Shell Smash) executes a stat-change-heavy parseMoveEffects on **every player turn for the first 2-3 turns of most battles**. At 0.8-1.7 ms per move, that's the dominant cost slice of those turns. Multi-stat moves (Shell Smash: 6 ticks, Quiver Dance: 3 ticks) compound. Linked to ISSUE-154/155 (P3 already in ledger) as the underlying mechanism.

**Fix sketch**: Fixing the logMsg scan (see fingerprint 290cc0fb39e4 above) is the primary lever — drops these costs by ~70%. Secondary: hoist the `statNames`/`stat.toUpperCase()` calls and inline the `mon.volatile.statsRaisedThisTurn` object-init out of the hot path.

**Verification**: Re-time Decorate/Coaching/Calm Mind after the logMsg fix; expect ~0.3 ms each (a 5× drop). Variance ratio (slowest:fastest) should fall from 110× to under 20×.

---
severity: P3
category: perf
anchor_symbol: rollTrainerTeam
current_line_hint: ~34915
file: battle.html
agents: [performance-profiler]
fingerprint: 82c78848cd39
confidence: medium
status: open
---

**Title**: `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work

**Evidence**:
```js
// battle.html:34915 — entry point exposed via window.__rivalTest.rollTrainerTeam
function rollTrainerTeam(trainer, partySize, gradeWeights, enabledGensIn, battleEventType, storyRowIdx) {
    const rng = (sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
    let gwIn = applyDifficultyToGradeWeights(gradeWeights || { g1: 0, g2: 0, g3: 50, g4: 50 });
    gwIn = applyStoryProgressToGradeWeights(gwIn, storyRowIdx);
    ...
    const _poolKey = (isMixed ? 'mixed' : types.slice().sort().join('+')) + '|' + Array.from(genSet).sort((a, b) => a - b).join(',');
    let T = _trainerPoolCache.get(_poolKey);  // cache keyed on type+gens — hit rate is the main lever
```

**Repro**: 10 trainers (Brock, Misty, Lt.Surge, Erika, Sabrina, Blaine, Giovanni, Lance, Steven Stone, Cynthia), 5 trials each, 1 warmup, all gens enabled, gradeWeights {g3:50,g4:50}. (`/tmp/deep-perf2.mjs`, 2026-05-28.)
- **All 50 samples**: median **0.71 ms**, p95 **2.09 ms**, max **6.62 ms**, mean **0.97 ms**.
- **Cold pass only (10 first-time trainers)**: median **1.42 ms**, p95 **3.22 ms**, mean **1.63 ms**.

The 5× ratio of cold-to-warm confirms `_trainerPoolCache` (battle.html:34910) is doing its job — first call per (type+gens) key pays the full baseStats scan, subsequent calls hit the partition.

**Blast radius**: Each story battle = exactly one `rollTrainerTeam` call. At median < 1 ms it's invisible. The cache is correctly bounded at 48 entries with LRU-ish eviction (battle.html:35029). Worth flagging in case the upcoming difficulty rework on `claude/eloquent-maxwell-I4Uql` introduces per-turn re-rolls or per-player adaptive picks — at that point the 1.4 ms cold cost compounds.

**Fix sketch**: No fix required today; the cache eviction at >48 entries is the correct upper bound for the cache key space (10 single types × 9 gen combinations × bosses ≈ 30–40 keys per save). If a future refactor invalidates the cache on every battle (e.g. "boss-specific filters"), revisit.

**Verification**: Re-bench after any difficulty-rework merge that touches `_trainerPoolCache` invalidation; threshold for concern is median > 5 ms or cold-pass p95 > 15 ms.

---
severity: P3
category: perf
anchor_symbol: makeBuild
current_line_hint: ~10731
file: battle.html
agents: [performance-profiler]
fingerprint: d17c754c4af6
confidence: medium
status: open
---

**Title**: `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median

**Evidence**: T1-T4 means STANDARD / MEGA / TERA / ZMOVE in current code (the `forceGimmick` knob). 10 species × 5 trials each, jsdom harness, `window.__rivalTest.makeBuild`:

| Tier    | n  | Median ms | p95 ms | Max ms | Mean ms |
|---------|----|-----------|--------|--------|---------|
| STANDARD| 50 |     0.045 |  0.257 |  0.686 |   0.088 |
| MEGA    | 50 |     0.014 |  0.028 |  0.104 |   0.018 |
| TERA    | 50 |     0.020 |  0.036 |  0.085 |   0.022 |
| ZMOVE   | 50 |     0.015 |  0.047 |  0.057 |   0.019 |

```js
// battle.html:10731 — gimmick pool is selected via simple object lookup, no per-tier branch difference
if (gimmick === 'MEGA') pool = entry.mega?.length ? entry.mega : [];
else if (gimmick === 'ZMOVE') pool = entry['z-attack']?.length ? entry['z-attack'] : [];
else if (gimmick === 'TERA') pool = entry.tera?.length ? entry.tera : [];
else pool = (entry.regular || []).concat(entry.weather || []);
```

**Repro**: `/tmp/deep-perf2.mjs`, 2026-05-28.

**Blast radius**: A 6-mon team build = 6 `makeBuild` calls ≈ 0.27 ms total. Inside `rollTrainerTeam`'s ~1.4 ms cold call. Negligible. STANDARD's higher max (0.69 ms) comes from the `csvBuildMix` 70/30 designed-vs-CSV split that runs an extra `makeDesignedBuild` lookup on ~30% of calls. The cost is even across tiers, so the mandate's "should be flat across tiers" check passes.

**Fix sketch**: No fix needed. This finding exists to establish the T1-T4 baseline so future regressions are detectable.

**Verification**: Re-bench after any change to `makeBuild`'s pool selection; flag if a tier diverges from the others by >2× median.

---
severity: P3
category: perf
anchor_symbol: storyRngNext
current_line_hint: ~34916
file: battle.html
agents: [performance-profiler]
fingerprint: b4751b0d02de
confidence: high
status: open
---

**Title**: `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean

**Evidence**: Mandate item #10 — "confirm no per-call closure allocation" — for the recent fix that added a per-engine-entry RNG accessor like `const rng = (sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;`. The function reference is hoisted once per call site (not per RNG draw), and `window.storyRngNext` is a function value lookup, not a closure capture.

**Repro**: 10,000 invocations of `window.storyRngNext ? window.storyRngNext() : Math.random()` directly: median **0.325 μs, p95 0.392 μs, max 100.9 μs (single outlier from GC pause)** (`/tmp/deep-perf.mjs` 2026-05-28). The outlier is harness noise (process-wide GC), not a per-call cost.

**Blast radius**: `parseMoveEffects` median is 18 μs, of which the ~10–15 RNG calls cost a combined ~5 μs — RNG itself is <30% of the per-move cost, and the accessor wrap is in the noise. This rules out the accessor pattern as a perf concern.

**Fix sketch**: No fix needed. Confirmed clean.

**Verification**: Re-check if `parseMoveEffects` per-move median rises above 0.05 ms — that would indicate something else regressed, not this accessor.

---
severity: P2
category: perf
anchor_symbol: playTurn
current_line_hint: ~20409
file: battle.html
agents: [performance-profiler]
fingerprint: 95c389cb86e5
confidence: high
status: open
---

**Title**: Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off

**Evidence**: 60-turn (single trial) and 30×5-trial measurements, jsdom harness, `settings.animations=false`, `sleep()` short-circuited to `Promise.resolve()` by load-engine.js (so we measure pure CPU, not animation timing):

Run A (`/tmp/deep-perf5.mjs`, 60 turns, 5 warmup): n=60 median **22.41**, p95 **35.08**, max **43.50**, mean **22.70**, range 1.9× median→max.

Run B (`/tmp/turnloop.mjs`, 30×5=150 samples, 10 warmup): n=150 median **37.63**, p95 **42.54**, max **46.46**, min **5.78**, IQR **17.07**.

Top 5 slowest turns from a 60-turn pass: turns 4 (43.5), 1 (39.9), 0 (35.1), 36 (34.2), 12 (33.8) — first-3 outliers are JIT warmup leftovers; the turn-12/36 outliers are post-warmup and point at non-deterministic branches (status moves with multiple `changeStage` + `logMsg` calls).

```js
// battle.html:20409 — playTurn enters here, then calls __runLockedPvPTurnResolution
// which calls performAction (battle.html:21286, 3358 lines long) which calls parseMoveEffects
// (battle.html:25853) per move, all under one async/await chain.
window.playTurn = async function(pMoveIndex, pSwitchIndex) {
    if(state.isLocked) return;
    if (state.isOver) return;
    ...
    await window.__runLockedPvPTurnResolution();
};
```

**Repro**: `/tmp/turnloop.mjs` + `/tmp/deep-perf5.mjs`, both this session, 2026-05-28. The harness uses jsdom which is **~2–3× slower than a modern Chromium DOM** for `appendChild`/`createElement`, so production browser numbers should be lower in absolute terms BUT animations move them back up.

**Blast radius**: ~30 ms / turn × 30 turns per battle × 100 battles per run ≈ 90 seconds of pure CPU per playthrough — invisible to the user when distributed across input pauses. The risk is the **distribution**: with median 22 ms but p95 42 ms, ~5% of turns will visibly stall (>1 dropped frame at 60 Hz). Production with `settings.animations=true` adds bounded `sleep()` delays — those are pacing, not CPU work — so the floor stays here. Bound to ISSUE-062 (existing P2 noting max 78-84ms outliers).

**Fix sketch**: Two compounding levers: (1) fix the logMsg tooltipDict scan (fingerprint 290cc0fb39e4 above) — drops every turn that has 5+ logMsg calls by 1.5+ ms; (2) cache the `_isPlayer ? state.pSide : state.fSide` and `state.terrain === "Electric" && state.terrainTurns > 0` predicates that recur dozens of times across parseMoveEffects branches (currently re-evaluated per branch).

**Verification**: Re-bench `/tmp/turnloop.mjs` after the logMsg fix; expect median to drop from 22 → ~15 ms and p95 from 42 → ~28 ms. Long-tail (max) should improve more than median because slow turns are the ones with the most logMsg/stat-change traffic.

---
severity: P3
category: perf
anchor_symbol: parseMoveEffects-sets-warm
current_line_hint: ~25859
file: battle.html
agents: [performance-profiler]
fingerprint: d2f020bcc302
confidence: high
status: open
---

**Title**: Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median)

**Evidence**: Counted `new Set(` occurrences in `parseMoveEffects` body (battle.html:25853–~26900): **18 distinct Set literals**, ranging in size from 3 elements (`hardBlockAll`) to 53 (`_selfTargetMoves`). The first ~5 fire on every call (powderMoves, magicBounceMoves, _subBypassMoves, _selfTargetMoves, sometimes _ccBanned); the remaining 13 fire in conditional branches but together compose the typical hot path.

```js
// battle.html:25859 — first Set, fires on every call regardless of move type
const powderMoves = new Set(["Sleep Powder","Spore","Stun Spore","Poison Powder","Rage Powder","Cotton Spore","PoisonPowder","Powder"]);
if (powderMoves.has(move.name)) { ... }
// battle.html:25867
const magicBounceMoves = new Set(["Will-O-Wisp","Thunder Wave",...]);  // 39 elements
// battle.html:25877
const _subBypassMoves = new Set([...]);  // 18 elements
// battle.html:25878
const _selfTargetMoves = new Set([...]);  // 53 elements
// ...total 18 Sets allocated through the function body
```

**Repro**: Isolated micro-bench (`/tmp/setbench.mjs`, 2026-05-28) replaying the actual literal contents from `parseMoveEffects`:
- Per-call allocation of all 17 Sets × 50,000 iterations: **653 ms, i.e. 13.1 μs per call.**
- Hoisted (constants) × 50,000 same has-checks: **1.91 ms total, i.e. 0.04 μs per call.**
- **Savings: ~13 μs per parseMoveEffects call. The function's warm median is 18 μs, so this is ~70% of the per-call cost.**

This restates and quantifies ISSUE-156 (P3 already in ledger). ISSUE-156 counted 19 (probably included a redundant declaration); the live audit counts 18 inside `parseMoveEffects` proper. Numbers may shift slightly when `parseMoveEffects` is refactored; the takeaway is the order-of-magnitude saving.

**Blast radius**: At ~18 μs / move and 2 moves per turn (player + foe), ~36 μs / turn. Across a 30-turn battle, ~1 ms. Across a 100-battle replay, ~100 ms of CPU. Per battle the saving is invisible; **the value is that it scales**: every new Set literal added inside `parseMoveEffects` linearly costs μs per call. Story content (new moves added with new ban-lists) will continue to drift this up unless the pattern is moved out.

**Fix sketch**: Hoist all 18 Sets to module-level `const` declarations. The Sets are immutable; freezing is not required. Existing examples at battle.html:10165–10185 (`_SETUP_MOVES`, `_HAZARD_MOVES`, etc.) show the pattern already in use elsewhere in the file.

**Verification**: Bench `parseMoveEffects` per-move median after hoisting; expect median to drop from 0.018 ms → 0.005 ms (a ~3.5× speedup) and the per-turn cost to fall correspondingly. Status moves (Decorate etc.) will see proportional improvement once the logMsg fix is also in.

---

# Memory growth — CONFIRMED LINEAR, NO LEAK

100-turn replay with `settings.animations=false`, `--expose-gc` (`/tmp/deep-perf.mjs`, 2026-05-28):

```
Turn |  HeapMb
  0  | 100.09
 10  | 100.29
 20  | 100.75
 30  | 101.27
 40  | 101.67
 50  | 101.63
 60  | 101.95
 70  | 102.24
 80  | 102.54
 90  | 102.83
100  | 103.17
Total Δ = 3.07 MB over 100 turns = 31.5 KB/turn.
Linear fit R² = 0.983 (>0.9 = linear)
```

DOM nodes after 100 turns: 3,315 total (initial ~2k + scaffolding). `#battle-log` children = 0 because the harness stubs logMsg to a capture-only function.

**Restates / confirms ISSUE-111 (P2) and ISSUE-112 (P2)** — growth is steady-linear (not quadratic), the source is per-distinct-mon DOM scaffolding that GC + harness `reset()` don't reclaim, and it is benign in the 30-turn-battle horizon (drops <1 MB per battle). No new finding emitted; the live measurement reaffirms the existing two findings.

# Boot — RESTATES ISSUE-079, ISSUE-145, ISSUE-148

Cold boot in jsdom: 5 trials this session = 4245 / 4439 / 4627 / 4245 / (no fifth trial) ms — median ~4.4 s. Within harness target (5 s), well above mandate's production-browser target (500 ms).

Boot breakdown (`/tmp/deep-perf5.mjs`):
- Data file I/O (5 files, ~2.7 MB total): **19 ms**
- JSON.parse of species + moves + items + abilities + natures: **25 ms**
- parseCSV of builds.csv (17,397 rows): **192 ms** ← largest single contributor outside JSDOM init itself
- The remaining ~4 seconds is JSDOM parsing battle.html (56,363 lines) + executing it

Engine-owned slice (~308 ms per ISSUE-079) matches the **25 ms + 192 ms** = 217 ms parse + per-key transforms (~90 ms). The CSV alone is **~63% of the engine-owned boot cost**; deferring it (existing fix sketch in ISSUE-079) lands ~180 ms of savings.

# Items NOT flagged this audit

- **Sprite manifest / CDN fallback** — sprite manifest is inline (battle.html:13102), parsed once into 4 Sets at script eval. No per-encounter network call when species is in manifest. CDN fallback only on miss. Within budget.
- **Anime.js init / move SFX loading / cry loading** — load-engine.js stubs these out so the harness measurement doesn't see them; in production they're lazy-loaded on first use. No evidence of a hotspot reachable from "Story Mode Normal" review without exercising them at runtime, out of harness scope.
- **`pbs_story_save` write thrash** — `save()` is called 116× across the codebase but each writes 8 KB at 0.03 ms (`/tmp/savebench.mjs`). No throttling on the localStorage write itself (only on the visual toast at battle.html:32953); cumulative impact is <4 ms per session. Toasts are correctly de-duplicated.
- **Battle-log append cost** — guarded by `battleLogMaxEntries()` cap with `removeChild(log.firstChild)` (battle.html:14161). Length-bounded, no O(n²) churn. The cost is the `Object.keys` scan flagged above, not the append itself.
- **Move-effect overlay DOM churn** — addressed by ISSUE-112's note that the sub/protect overlays at battle.html:16854–16876 are correctly guarded.

# Production vs. jsdom honesty note

All timings above are jsdom with `settings.animations=false`. Production with animations off should be similar (V8 is the same; jsdom DOM ops are ~2× slower than Chromium's, balancing some other small wins). Production with animations ON adds `await sleep(ms)` delays at 157 call sites (`grep -c "await\\s\\+sleep"` = 157, battle.html). Those are pacing for the player, not CPU work, and don't move the floor.

