---
severity: P2
category: perf
anchor_symbol: rollTrainerTeam
file: battle.html
current_line_hint: 33916
agents: [performance-profiler]
fingerprint: 67d442f2bbd6
confidence: high
status: fixed-main
---

**Title**: `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit

**Evidence**:
```js
// battle.html:33916 — module-level, never cleared
const _trainerPoolCache = new Map();
// rollTrainerTeam builds T={1,2,3,4} partitions over ~1380 species per novel key:
//   const _poolKey = (isMixed?'mixed':types.sort().join('+')) + '|' + gensSorted.join(',');
//   let T = _trainerPoolCache.get(_poolKey); if (!T) { ...full baseStats scan...; _trainerPoolCache.set(_poolKey, T); }
```
Measured (jsdom, `--expose-gc`): rolling 30 trainer types × 511 distinct gen-subset combos (15,330 calls → up to ~15k distinct keys) grew heap +13.4 MB and the cache is never freed. Each entry is a 4-bucket partition of up to ~1380 species names.

**Repro**: `node --expose-gc` driving `window.__storyTest.rollTrainerTeam(trainer, 6, gw, gensSubset, 'Basic Trainer', 20)` across many (type, gens) pairs; heap climbs monotonically with distinct-key count.

**Blast radius**: Today the active-gens list is fixed per run, so only ~38 type-themes × 1 gen-combo are ever keyed → cache is tiny and warm rolls are fast (median **0.34 ms**, cold cache-miss **0.84 ms**, max 1.68 ms — both far under the 50 ms target). The risk is the planned **Fight Club gauntlet + expanded story-pool**: if those call `rollTrainerTeam` with varied gen filters / synthetic trainer types per draft, distinct keys multiply and the Map grows unbounded across a long session. This is the "won't scale with new systems" flag, not a current regression.

**Fix sketch**: Bound `_trainerPoolCache` with a small LRU (e.g. 64 entries) or clear it on run-start / gen-setting change. The partition is cheap to rebuild (cold miss is < 1 ms), so eviction costs nothing perceptible.

**Verification**: After bounding, drive 15k+ distinct-key rolls and confirm `_trainerPoolCache.size` plateaus at the cap and heap delta stays flat.

---
severity: P2
category: perf
anchor_symbol: updateBattleUI
file: battle.html
current_line_hint: 16788
agents: [performance-profiler]
fingerprint: 3e3792c97f56
confidence: medium
status: open
---

**Title**: Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim

**Evidence**: Full story-style replay (roll fresh team + build foes + run turns per battle), jsdom with `--expose-gc`:
```
68 battles  / 408 turns:  heap 85.7 -> 112.2 MB  (+26.5 MB, ~67 KB/turn, ~399 KB/battle)
250 battles/~1500 turns:  heap 85.7 -> 171.2 MB  (+85 MB, R²=0.995)
  first-half slope 0.362 MB/battle  ≈  second-half slope 0.335 MB/battle  (slope does NOT decay)
After loop, reset() + global.gc(): 112.2 -> 112.5 MB (NO drop → retained in detached DOM/closures, not live state)
DOM node count climbed 1210 -> 4365 over 68 battles (player-sprite-container alone: 0 -> ~1415 descendants)
```
Same-mon turn loop in isolation grows only ~22 KB/turn (matches the prior baseline) and sprite-container stays at 9 descendants — the extra growth tracks **distinct foe species** (new sprite `<img>` + per-mon UI scaffolding), not turn count alone.

**Repro**: `node --expose-gc` replay calling `__storyTest.rollTrainerTeam` → `mkMon(slot)` → `runTurn` for ~68 battles, sampling `process.memoryUsage().heapUsed` every 10 battles.

**Blast radius**: This is the headline "will it scale" signal for the redesign. It is **linear, not quadratic** (no algorithmic leak), so it is not a P1 — but it does **not plateau**, so a session spanning a full story + post-game + the planned Fight Club gauntlet (hundreds of battles) trends to hundreds of MB on the JS heap, before counting the separate `_preloadedImages` image-decoder pool. IMPORTANT HONESTY CAVEAT: a large share of the jsdom number is inflated by the harness's anime.js stub — animation-completion callbacks that normally call `el.remove()` on effect/overlay nodes never fire, and `showBattlePopup`/MoveAnimEngine are gated on `settings.animations` (false in tests), so the measured per-turn DOM retention overstates a real browser where those timers/callbacks run. The real, browser-relevant slice is the per-distinct-foe sprite/UI scaffolding + the `_preloadedImages` cache (separate finding).

**Fix sketch**: Audit the per-foe sprite/overlay creation in the battle-UI refresh (sub/protect overlays at battle.html:16788–16808 are guarded; the unbounded growth is new `<img>`/effect nodes per distinct foe). Ensure swapping a battler tears down the prior battler's sprite nodes. Re-measure in a real headless browser (Playwright) with `settings.animations` true to separate the genuine retention from the anime-stub artifact before sizing the fix.

**Verification**: In a Playwright session with animations on, run 100+ battles and confirm `document.querySelectorAll('*').length` and JS heap plateau (slope → 0) rather than climbing linearly.

---
severity: P3
category: perf
anchor_symbol: getSprite
file: battle.html
current_line_hint: 12726
agents: [performance-profiler]
fingerprint: 92e4f7817cc9
confidence: medium
status: fixed-main
---

**Title**: Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session

**Evidence**:
```js
// battle.html:12616
const _preloadedImages = {};
// battle.html:12726
if (!_preloadedImages[url]) {
    let img = new Image(); img.src = url; _preloadedImages[url] = img;
}
```
(Lines drifted from the prior profiler's 11983/12036 cite; the unbounded pattern is unchanged.) This cache lives in the browser image-decoder pool, NOT the V8 heap, so it does not appear in `process.memoryUsage()` — the jsdom memory benchmark above cannot see it, which is exactly why it needs to be called out separately at this review gate.

**Repro**: `grep -n _preloadedImages battle.html` shows one declaration + one assignment-in-loop; no eviction logic. A full story sees 100–300 unique mons; × shiny/back variants → 500+ cached Images on a long save.

**Blast radius**: Forward-looking, and amplified by the redesign: a **daycare with per-run egg state** plus the **Fight Club gauntlet** will surface many more distinct species per session (eggs hatch new mons; gauntlet draws wide rosters). At ~5–50 KB per Showdown GIF, 500+ entries ≈ 10–25 MB of pinned image data — a real OOM contributor on low-RAM mobile.

**Fix sketch**: Convert `_preloadedImages` to a bounded LRU (~100 entries) or drop the explicit `new Image()` preload entirely — appended `<img src>` elements are cached by the browser automatically, so the Image() instances duplicate the cache.

**Verification**: In a long browser session, confirm `Object.keys(_preloadedImages).length` plateaus at the cap instead of growing monotonically.

---
severity: P3
category: perf
anchor_symbol: parseMoveEffects
file: battle.html
current_line_hint: 25255
agents: [performance-profiler]
fingerprint: 45d50d234dfb
confidence: high
status: open
---

**Title**: `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers

**Evidence**: 954 distinct moves, valid attacker (Pikachu) + defender (Snorlax), `await engine.parseMoveEffects(atk, def, move, true)`:
```
median = 0.0124 ms   iqr = 0.0063   max = 3.190 ms   (n=954)
slowest: 3.19 Feather Dance | 1.53 Clangorous Soul | 1.50 Coaching | 1.47 Extreme Evoboost
         1.47 Decorate | 1.46 Calm Mind | 1.45 Coil | 1.44 Shell Smash
fastest: ~0.010 ms  (Harden, Sharpen, Hidden Power Water)
variance ratio (slowest / median) ≈ 257×
```
The mandate's >10× variance threshold is exceeded. Every outlier is a stat-stage move that runs a multi-stat boost loop with per-stage logMsg/UI sequencing.

**Repro**: drive `engine.parseMoveEffects(atk, def, movesDB[name], true)` for every move and sort by time. Median is ~40× under the 0.5 ms target; only the boost-loop subset spikes.

**Blast radius**: At sub-millisecond medians the spikes are invisible in jsdom, but Calm Mind / Bulk Up / Shell Smash / Clangorous Soul are heavily used in trainer setup sets, and in a real browser the per-stage UI work pays layout/paint cost the harness doesn't model — so the relative spike could grow on-device. Not user-perceptible today (worst case 3.2 ms).

**Fix sketch**: For multi-stat-boost moves, batch the UI/log update once after all stages resolve instead of per-stage (`changeStage` appears to drive a logMsg/updateUI per stat). Profile Feather Dance / Clangorous Soul specifically.

**Verification**: Re-run the per-move sort; expect the slow moves to drop sub-millisecond and the variance ratio below ~20×.

---
severity: P3
category: perf
anchor_symbol: loadGameData
file: battle.html
current_line_hint: 9583
agents: [performance-profiler]
fingerprint: 56169fe009c6
confidence: high
status: open
---

**Title**: Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression

**Evidence**: 5 fresh node processes: 3270, 3018, 2934, 3009, 3034 ms → median **3009 ms**. Dominated by JSDOM parsing ~48k lines of inlined battle.html + `loadGameData` synchronously parsing species.json (1380), moves.json (954), items.json, abilities.json, and builds.csv. The mandate (performance-profiler) sets < 200 ms; `perf-bench.mjs` self-reports against a relaxed < 5000 ms.

**Repro**: `time node -e 'import("./tests/helpers/load-engine.js").then(m=>m.loadEngine())'` ≈ 3 s, repeatable.

**Blast radius**: jsdom boot is mostly fixed-cost (document construction + JSON.parse) and is hidden behind a splash in production (~1.5–2 s real browser). Not user-facing. The redesign adds more eager data (egg tables, gauntlet rosters, story-pool) — every new JSON table parsed at boot adds to this synchronous path, so the boot budget is worth watching. Flagging as a target-clarity issue + a budget to protect.

**Fix sketch**: Either update the mandate to a realistic jsdom target (< 5 s) / production target (< 2.5 s), or add lazy/on-demand parsing to `loadGameData` (e.g. defer the ~748 illegal/end-game build rows and any new redesign tables until first use) so boot stays flat as data grows.

**Verification**: Re-measure 5-process median; confirm it stays under whichever target the project ratifies, and that adding redesign data tables does not push it past budget.

