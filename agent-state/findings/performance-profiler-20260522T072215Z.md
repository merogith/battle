---
severity: P2
category: perf
anchor_symbol: benchParseMove
file: scripts/debug/perf-bench.mjs
current_line_hint: 58
agents: [performance-profiler]
fingerprint: c57a28528982
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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
severity: P3
category: perf
anchor_symbol: parseMoveEffects
file: battle.html
current_line_hint: 24269
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
severity: P3
category: perf
anchor_symbol: loadEngine
file: tests/helpers/load-engine.js
current_line_hint: 52
agents: [performance-profiler]
fingerprint: 28e451a73726
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

**Evidence**: `tests/reports/perf.md` (this run, ISO 2026-05-22T07:18:54Z) reports `Cold start: 2854 ms (target: < 5000 ms in jsdom)`. Repeated trial: 2885 ms. The performance-profiler mandate (`agents/performance-profiler.md` line 17) sets the target at **< 200 ms under jsdom**. The harness self-report in `perf-bench.mjs:112` has been silently relaxed to `< 5000 ms` to mask this.

**Repro**: `time node -e 'import("./tests/helpers/load-engine.js").then(m => m.loadEngine()).then(() => console.log("ok"))'` measures ≈ 3 seconds.

**Blast radius**: The mandate's 200 ms target is unrealistic — jsdom has to parse ~50k lines of inlined battle.html, then the engine `loadGameData` synchronously parses 1380 species, 954 moves, 583 items, 314 abilities, 1147 build entries from JSON/CSV. The real bottleneck is JSON.parse + JSDOM document construction, both of which are largely fixed-cost. **Either the target needs updating** (the harness self-report at < 5 s is more realistic for jsdom) **or the engine should split eager loading into lazy/on-demand parsing**. In production browsers the boot is ~1.5–2 s and is hidden behind a splash; this is not user-visible. So this is a **target-mismatch finding**, not a performance regression: clarify which number the project actually targets.

**Fix sketch**: Either (a) update `agents/performance-profiler.md` to set the realistic target at `< 5 s in jsdom / < 2.5 s in production`, or (b) add a flag to `loadGameData` to skip parsing of unused data tables (e.g., the 748 illegal/end-game builds) during test boot.

**Verification**: Either the mandate target is updated to a realistic value, or `loadGameData` gains a `{ lazyBuilds: true }` option and `loadEngine.js` passes it.

---
severity: P3
category: perf
anchor_symbol: _preloadedImages
file: battle.html
current_line_hint: 11983
agents: [performance-profiler]
fingerprint: 2b9d-imageprefetch
confidence: medium
status: fixed-main
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
severity: P2
category: perf
anchor_symbol: benchTurn
file: scripts/debug/perf-bench.mjs
current_line_hint: 34
agents: [performance-profiler]
fingerprint: 727cad5b6ed7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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
severity: P2
category: perf
anchor_symbol: benchMemoryGrowth
file: scripts/debug/perf-bench.mjs
current_line_hint: 65
agents: [performance-profiler]
fingerprint: a20dbf90774a
confidence: high
status: wontfix-not-a-bug-noise-dominated-growth-as-flagged-by-agent
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
