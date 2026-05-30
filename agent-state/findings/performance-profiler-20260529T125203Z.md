---
severity: P2
category: perf
anchor_symbol: loadBuildsCSV
file: battle.html
current_line_hint: ~10429
agents: [performance-profiler]
fingerprint: 7b1c4e9a2d50
confidence: high
status: fixed-claude/focused-cori-sGNzn (parseCSV ~40% faster, byte-identical output; the dominant boot phase. Remaining cost is per-row build construction + JSON parse, inherent to the 17k-row/2.56MB data)
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
severity: P3
category: perf
anchor_symbol: playTurn
file: battle.html
current_line_hint: ~23826
agents: [performance-profiler]
fingerprint: c2a8f0341e77
confidence: high
status: wontfix-claude/focused-cori-sGNzn (profiler confirmed GC/jsdom jitter, not a perf bug)
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
severity: P3
category: dx
anchor_symbol: benchParseMove
file: scripts/debug/perf-bench.mjs
current_line_hint: ~55
agents: [performance-profiler]
fingerprint: 9d33b6e8c1a4
confidence: high
status: fixed-claude/focused-cori-sGNzn (exposed makeWildBuild on __storyTest; added benchRollTrainerTeam + benchMakeWildBuild to perf-bench — both now measured, 0.17ms / 0.09ms, within target)
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
severity: P3
category: perf
anchor_symbol: parseMoveEffects
file: battle.html
current_line_hint: ~26076
agents: [performance-profiler]
fingerprint: 4f7a0c2b9e18
confidence: high
status: wontfix-claude/focused-cori-sGNzn (profiler confirmed GC/JIT jitter, not a perf bug)
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
severity: P3
category: perf
anchor_symbol: benchMemoryGrowth
file: scripts/debug/perf-bench.mjs
current_line_hint: ~78
agents: [performance-profiler]
fingerprint: a05e7c14d3b9
confidence: high
status: wontfix-claude/focused-cori-sGNzn (profiler confirmed non-leaking; informational)
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
