---
severity: P2
category: perf
anchor_symbol: loadGameData
current_line_hint: ~9636
file: battle.html
agents: [performance-profiler]
fingerprint: 7819dea5a498
confidence: high
status: open
---

**Title**: Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table

**Evidence**:
```js
// battle.html:9636 — JSON.parse of 5 tables in parallel, then per-key transform loops
const [speciesJSON, movesJSON, naturesJSON, itemsJSON, abilitiesJSON] = await Promise.all([
    fetch('data/species.json').then(r => r.json()),   // 1380 species → baseStats[]
    fetch('data/moves.json').then(r => r.json()),      // 954 moves → movesDB[]
    fetch('data/natures.json').then(r => r.json()),
    fetch('data/items.json').then(r => r.json()),
    fetch('data/abilities.json').then(r => r.json())]);
// …then await loadBuildsCSV() at battle.html:9743 parses the 2.6 MB data/builds.csv
```
Measured (jsdom, warm fetch stub serving from memory so disk I/O is excluded — this is pure parse+transform, separated from JSDOM document construction as the charter requested): re-invoking `window.loadGameData()` 5×: **median 308 ms, IQR 5.9 ms** (samples 308/314/396/306/308). The full jsdom cold boot is ~3–4 s but is dominated by JSDOM parsing the 3.6 MB monolith; this 308 ms is the slice the engine itself owns and the slice that grows when data tables are added.

**Repro**: `node --expose-gc` → `loadEngine()` → time `await window.loadGameData()` 5×; median ~308 ms. (`/tmp/final.mjs` in this session.)

**Blast radius**: This is the production boot floor minus JSDOM overhead — a real browser still pays the JSON.parse + 1380/954-key transform loops + 2.6 MB CSV parse behind the splash. It is **linear in table size**, so the redesign's egg tables, Fight Club rosters, and expanded story-pool each add directly to it. Distinct from the prior cold-boot finding (which measured the ~3 s full JSDOM boot + target mismatch); this isolates the engine's own parse budget.

**Fix sketch**: Defer the non-critical tables out of the boot path — `loadBuildsCSV()` (2.6 MB) and `op-abilities.json` are only needed at first draft/encounter, not at splash; parse them lazily on first use. Keep species/moves eager. Re-measure to confirm the eager slice stays < 200 ms as tables grow.

**Verification**: Re-time isolated `loadGameData()` after deferring the CSV; confirm the eager path is < 200 ms and that adding a redesign data table does not move it.

---
severity: P2
category: perf
anchor_symbol: updateBattleUI
current_line_hint: ~16854
file: battle.html
agents: [performance-profiler]
fingerprint: 3dc9c4ece2e7
confidence: medium
status: open
---

**Title**: Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle

**Evidence**: Story-style replay (roll fresh team → build 6 foes → run a turn each), jsdom `--expose-gc`, `settings.animations=false`:
```
200 battles: heap 88.8 → 145.3 MB   slope 0.275 MB/battle   R²=0.983
  first-half slope 0.329  ≈  second-half slope 0.214  (slope does NOT increase → LINEAR, not a quadratic leak)
DOM nodes: 1168 → 11520  (+51.76 nodes/battle, dead-linear)
Top growers over 30 battles: #player-sprite-container +93, #foe-sprite-container +60, #screen-battle +13
```
The sub/protect overlays at battle.html:16854–16876 are correctly guarded (querySelector + `.remove()` on clear) so they are NOT the leak; the retained nodes are per-battle sprite/UI scaffolding in the two sprite containers that battle teardown does not reclaim.

**Repro**: `node --expose-gc` replay over 200 battles sampling `process.memoryUsage().heapUsed` + `document.querySelectorAll('*').length` every 20 battles (`/tmp/memlong.mjs`, `/tmp/domsrc.mjs` this session).

**Blast radius**: This is the "will it scale over a long session" signal. It is **linear, not quadratic**, so it is a P2 (steady drip), not a P1 (algorithmic leak). HONESTY CAVEAT: a meaningful share of the jsdom number is harness-shaped — the anime.js stub means animation-completion callbacks that normally call `el.remove()` on effect/overlay nodes never fire, and the move-effect / stat-arrow / pokéball append paths (battle.html:12599, 12627, 16066) are all gated on `settings.animations` (false in tests), so the per-battle DOM retention measured here overstates a real browser where those timers run. The browser-relevant slice (per-distinct-foe sprite scaffolding) needs a Playwright run with animations ON to size precisely.

**Fix sketch**: Audit battle teardown to ensure swapping/ending a battle removes the prior battler's appended sprite/effect nodes from `#player-sprite-container` / `#foe-sprite-container`. Re-measure in headless Chromium (Playwright) with `settings.animations=true` to separate genuine retention from the anime-stub artifact before sizing the fix.

**Verification**: In a Playwright session with animations on, run 100+ battles and confirm `document.querySelectorAll('*').length` and JS heap plateau (slope → 0) rather than climbing linearly.

---
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: ~25463
file: battle.html
agents: [performance-profiler]
fingerprint: ba0eda6f97e7
confidence: high
status: open
---

**Title**: `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms)

**Evidence**:
```js
// battle.html:25463, 25471, 25481, 25482 … — 19 `new Set([...])` literals rebuilt PER CALL inside the
// async parseMoveEffects body (a ~1100-line function), e.g.:
const powderMoves = new Set(["Sleep Powder","Spore","Stun Spore","Poison Powder",...]);
const _selfTargetMoves = new Set(["Swords Dance","Nasty Plot","Calm Mind", /* ~60 names */ ]);
```
Measured (954 moves, valid attacker/defender): **warm median 0.0147 ms/call, max-after-warmup ~0.01 ms — every move is fast once JIT-compiled.** The apparent "variance" is purely cold-path: the FIRST touch of the stat-boost / multi-branch path costs Shell Smash 14.2 ms, Decorate/Coaching ~2.3 ms, then drops to ~0.01 ms on repeat (`/tmp/coldpath.mjs`, `/tmp/setalloc.mjs` this session). This corrects the prior "257× per-call variance" read — it is JIT warmup of a megamorphic function, not a pathological per-call algorithm.

**Repro**: `engine.parseMoveEffects(atk, def, movesDB[name], true)` — measure first call vs. repeated calls per move; first-touch of stat-boost moves spikes, warm calls are flat.

**Blast radius**: Not user-perceptible today (warm ~0.01 ms ≪ 0.5 ms target; first-touch spikes are one-time and hidden behind boot/first-turn). The concern is forward-looking: 19 fresh `Set` allocations per call is avoidable GC churn that grows as more named-move handlers are added, and a 1100-line megamorphic async function is a deopt risk the redesign will amplify.

**Fix sketch**: Hoist the 19 constant `Set` literals to module scope (build once) instead of re-allocating per call. Optionally split the named-move handlers into a lookup table so the function is not one megamorphic body — this reduces both the cold-path JIT cost and per-call allocation.

**Verification**: After hoisting the Sets, confirm warm per-call time is unchanged (~0.01 ms) and that a heap-allocation profile shows zero `Set` allocations inside `parseMoveEffects` per call.

