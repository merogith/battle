---
severity: P2
category: perf
anchor_symbol: _renderCrucible
current_line_hint: ~48084
file: battle.html
agents: [performance-profiler]
fingerprint: 38f68891607d
confidence: high
status: open
---

**Title**: _renderCrucible rebuilds a 17.7KB / 109-node innerHTML on every open + lead-collect + hard-mode toggle

**Evidence**:
```js
// _renderCrucible(): single innerHTML assign of a fully-rebuilt template literal.
// body.innerHTML = `...~17,700 chars, 109 element nodes...`
// Called from: enterCrucible(), toggleCrucibleHardMode() (every checkbox click),
// and bossCollectLead()->finish() (re-renders after each of 3 lead collects).
const png = (path) => `<img src="${path}?v=20260516" ... >`;       // 9 <img> built each call
const btn = (icon, label, onClick, accent, tip) => `<button ...>`; // 16+ buttons built each call
body.innerHTML = ` ... 17.7 KB string ... `;
```

**Repro**: `node /tmp/perf-ext.mjs` (custom bench) — `_renderCrucible` via `StoryMode.toggleCrucibleHardMode` measured median **29-31ms / call (jsdom, 3 runs)**, max 110ms; isolated `innerHTML` assign of the produced 17,691-char/109-node string = **29.5ms median** — i.e. the entire cost is the DOM parse, string concat is negligible. Production browser innerHTML parse is ~5-10x faster than jsdom, so estimate ~3-6ms real, but this is the single largest UI hotspot measured and it re-runs the FULL hub rebuild for trivial state changes (one checkbox).

**Blast radius**: Crucible (post-game super-hub). Toggling Hard Mode, collecting any of the 3 Caged-God leads, and every hub re-entry each trigger a full 109-node teardown+rebuild. On low-end mobile the innerHTML reparse is the likely source of a visible hitch when toggling Hard Mode.

**Fix sketch**: Split the static facility grid (buttons never change) from the dynamic bits (gold value, Hard-Mode checkbox state, Caged-God tracker). Render the static shell once; on toggle/collect, update only the changed nodes (checkbox `.checked`, the Caged-God `<div>`, the gold span) instead of reassigning the whole `body.innerHTML`.

**Verification**: Re-run the bench; a targeted-update path for `toggleCrucibleHardMode` should drop from ~30ms to <1ms (no full reparse). Confirm Crucible visuals unchanged.

---
severity: P3
category: perf
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48539
file: battle.html
agents: [performance-profiler]
fingerprint: ece351f805e0
confidence: high
status: open
---

**Title**: _bossArcRenderSection rebuilt in full inside every _renderCrucible re-render (adds ~6ms of the 30ms)

**Evidence**:
```js
// Inside _renderCrucible():
const cagedGodHtml = _bossArcRenderSection(true);   // builds the whole Caged-God tracker string
// _bossArcRenderSection concatenates the tracker panel + 3 lead-status rows + collect buttons
// every time, even when the trigger was an unrelated state change (e.g. Hard-Mode checkbox).
let html = '';
html += `<div ...The Caged God...>`;
html += `<div ...Broker Leads ${collectedCount}/3...>`;   // rebuilt each render
```

**Repro**: `node /tmp/perf-ext.mjs` — `_renderCrucible` with bossArc available = **30.4ms median**; with `sm.bossArc.available=false` (Caged-God section skipped) = **24.4ms median**. The Caged-God section accounts for ~**6ms** of the per-render cost and is rebuilt on every Crucible re-render including Hard-Mode toggles that don't touch the boss arc.

**Blast radius**: Coupled to the `_renderCrucible` hotspot above — same call sites. Once the boss arc is `available`, this ~6ms is paid on every hub interaction until the arc is cleared.

**Fix sketch**: Same remedy as the parent finding — extract the Caged-God tracker into its own container updated only when a lead is collected (`bossCollectLead`), not on every `_renderCrucible`. Memoize the produced string keyed on `(ledger,recording,key,cleared)` since it only changes on those 4 booleans.

**Verification**: After splitting, toggling Hard Mode should not re-invoke `_bossArcRenderSection`; bench the toggle path and confirm the ~6ms delta is gone.

---
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: ~26886
file: battle.html
agents: [performance-profiler]
fingerprint: f9d620301a1e
confidence: high
status: open
---

**Title**: parseMoveEffects per-move spread is 130x (stat-stage moves ~1.3ms vs 0.01ms median) — benign, multiple changeStage calls

**Evidence**:
```js
// Slowest moves are multi-stat setup moves; each changeStage() logs + recomputes.
if (move.name === "Shell Smash") { changeStage(attacker,'atk',2); changeStage(attacker,'spa',2); changeStage(attacker,'spe',2); changeStage(attacker,'def',-1); changeStage(attacker,'spd',-1); return; }
if (move.name === "Quiver Dance") { changeStage(attacker,'spa',1); changeStage(attacker,'spd',1); changeStage(attacker,'spe',1); return; }
// vs a damage move that early-returns before this block: ~0.008ms.
```

**Repro**: `node /tmp/perf-ext.mjs` — per-move median-of-5 across 954 moves: **median 0.0099ms**, slowest = Shell Smash **1.32ms**, then Coaching 1.26ms, Decorate 1.14ms, Acid Armor 0.86ms, Agility 0.80ms. variance slowest/median = **~133x** (mandate flags >10x as P3). Note: the median (0.01ms) is FAR under the 0.5ms-per-call target; the absolute outlier of 1.3ms slightly exceeds 0.5ms but includes the harness's `logMsg` capture overhead, and these moves are rare per turn (one setup move occasionally), so net engine impact is negligible.

**Blast radius**: None practical — turn loop median is 9.4ms with these moves in the mix. This is informational variance, not a pathological lookup.

**Fix sketch**: No action required for performance. If desired for tidiness, the long `if (move.name === ...)` stat-boost ladder (~40 string compares) could be replaced by a data table `STAT_BOOST_MOVES[name] = {atk:2,...}`, which also collapses the per-call branch cost — but this is a refactor/data-driven nicety, not a perf necessity.

**Verification**: A data-table dispatch would flatten the spread toward the median; bench would show slowest move dropping under ~0.1ms.

---
severity: P3
category: perf
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42021
file: battle.html
agents: [performance-profiler]
fingerprint: 9caf520a63bf
confidence: high
status: open
---

**Title**: bossMechanicsTurnTick per-turn cost is ~1.5us (foeParty.filter is NOT wasteful); only _showBossBanner DOM is non-trivial and fires ~5x/battle

**Evidence**:
```js
// faintPhase branch: the foeParty.filter only runs for UN-fired phases — once fired,
// the _bossMechanicsFired[firedKey] guard `continue`s BEFORE the filter.
const firedKey = 'faint_' + need;
if (stateRef._bossMechanicsFired && stateRef._bossMechanicsFired[firedKey]) continue; // short-circuit
const fainted = Array.isArray(stateRef.foeParty)
    ? stateRef.foeParty.filter(x => x && (x.currentHp | 0) <= 0).length : 0;          // O(party<=6)
```

**Repro**: `node /tmp/perf-ext.mjs` + `/tmp/perf-iso.mjs`. Measured (villain.magma.boss = fieldLock + 3 faintPhase, worst-case foe team):
- Steady-state per turn (phases fired, guard short-circuits): **0.0003ms (3 runs)**.
- Pure logic+filter, banner DOM disabled, all phases un-fired: **0.0015ms**.
- Isolated `foeParty.filter` at party size 6: **0.0001ms** (24: 0.0003ms; 100: 0.001ms).
- Worst-case WITH `_showBossBanner` firing every tick: **0.90-0.95ms** — but `_showBossBanner` does `document.createElement` + `appendChild` and only fires on an actual phase transition (~4-5 times across an entire boss battle), NOT every turn.

**Blast radius**: Boss battles only (villain Road-7 bosses, extra-track raids, Mystery Figure). Direct answer to the review question: walking `state._bossMechanics` + the `foeParty.filter` every tick is effectively free (single-digit microseconds at party<=6); the filter is well-guarded and not wasteful.

**Fix sketch**: No required change. Micro-nit only: `_storyBossMechanicsBattleInit` could precompute `state._bossFaintPhasesPending` so the steady-state walk skips already-fired entries entirely, but the win is sub-microsecond and not worth the added state. Leave as-is.

**Verification**: bench already confirms <2us/turn; no regression risk.

