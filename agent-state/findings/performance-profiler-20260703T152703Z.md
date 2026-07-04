---
severity: P2
category: bug
anchor_symbol: loadEngine
current_line_hint: ~240
file: tests/helpers/load-engine.js
agents: [performance-profiler]
fingerprint: 05b53f56eb47
confidence: high
status: fixed-claude/bug-performance-investigation-8snuw9
---

**Title**: Harness `window.settings` override is a silent no-op — every jsdom test runs with `animations:true`

**Evidence**:
```js
// tests/helpers/load-engine.js (~240): believes it disables animations
window.settings.animations = false;   // creates/edits a SHADOW object
// battle.html:12944 — global LEXICAL binding; NO `window.settings =` mirror exists
let settings = { animations: true, musicEnabled: true, ... };
// Empirical proof (this session):
// window.settings.animations = false  |  window.eval('settings.animations') === true
// window.eval('settings') === window.settings  →  false
```

**Repro**: `node scratchpad/settingsproof.mjs` (session script) — after the harness override, `window.eval('settings.animations')` still returns `true`; turn loop with the believed-off state: median 29.15/27.62 ms, **+6.8 retained DOM nodes/turn**; after `window.eval('settings.animations=false')`: median 23.42/26.45 ms, **+0.0 nodes/turn**. This is the CLAUDE.md "sloppy-mode hazard" landing in the test harness itself: bare `let` at top level creates a global lexical binding that shadows any later `window.settings` property for all engine reads.

**Blast radius**: Every jsdom measurement and test since the harness was written: all perf-bench numbers (turn loop, memory growth) include full animation DOM churn; ISSUE-064 and ISSUE-065 (both open P2 "memory leaks") are artifacts of this bug (see companion finding); `tests/suites/foe-item-system.test.js:42` and `foe-item-threat-ai.test.js:55` set `window.settings.storyBattleItems = true` as a no-op (masked only because the engine default is already `true`). Tests using the `engine.settings` getter (e.g. quickplay-modes) are unaffected — that getter returns the real lexical object.

**Fix sketch**: In load-engine.js, mutate the real object via the exposed getter (`engine.settings.animations = false` after `__testReady`) instead of `window.settings`, and/or add a one-line `window.settings = settings` mirror in battle.html next to the declaration (canonical early-let pattern). Update the two foe-item suites to use `engine.settings`.

**Verification**: `window.eval('settings.animations')` returns `false` in the harness; re-run `node --expose-gc scripts/debug/perf-bench.mjs` — memory chart flattens and turn-loop median drops ~10-20%.

---
severity: P3
category: perf
anchor_symbol: MoveAnimEngine
current_line_hint: ~14669
file: battle.html
agents: [performance-profiler]
fingerprint: 1b97447ad152
confidence: high
status: open
---

**Title**: ISSUE-064/065 root-caused: "leak" = anime-`complete:` cleanup never firing under the harness stub; engine is leak-free

**Evidence**:
```js
// battle.html — all retained node classes clean up ONLY via anime completion:
complete: () => _cleanup(arcs, 0)      // typeAnims Flying (~14908) et al.
complete: () => arrows.forEach(a => a.remove())  // showStatArrow (~15484)
// load-engine.js anime stub returns {finished: Promise.resolve(), ...} and NEVER
// invokes complete → nodes appended into the sprite containers are never removed.
```
100-battle / 300-turn story-style replay (jsdom, `--expose-gc`), this session:
- Harness as-is (animations effectively ON, see companion finding): `#player-sprite-container` accumulated **912** anonymous particle divs (Flying-arc/type-anim `_spawn` output), `#foe-sprite-container` **174** stat-arrow divs, `#screen-battle` **184** `battle-popup` divs; heap slope 0.148→0.070 MB/battle.
- Genuine `settings.animations=false` via `window.eval`: DOM **dead flat 1210→1213 nodes**, heap 95.1→98.3 MB with **decaying** slope 0.060→0.008 MB/battle (plateau, not linear).
Negative results from the same instrumented run: event-listener adds = 12 total (removes 0 — all boot-time, none per-battle); live intervals = 0; no global array/Map/Set grew by >20 entries; `_spriteCache`/`_preloadedImages` capped at 23 (eviction fix holding).

**Repro**: `node --expose-gc scratchpad/memleak.mjs` (instrumented replay) vs `scratchpad/memclean.mjs` (same replay + `window.eval('settings.animations=false')`).

**Blast radius**: Ledger hygiene — ISSUE-064 and ISSUE-065 should be closed as harness artifacts (their "production leak" interpretation is unsupported: in production, real anime.js fires `complete` and the vendored `vendor/anime.min.js` makes load failure a deploy-breakage case, not a runtime one; with animations off the spawn paths return early). Residual real-browser confirmation with animations ON remains open but the jsdom evidence no longer supports a leak claim.

**Fix sketch**: No engine change needed. Either fix the harness settings override (companion finding) or make the anime stub invoke `complete` asynchronously so complete-based cleanups run under test. Then close ISSUE-064/065 with a pointer here.

**Verification**: After the harness fix, re-run the ISSUE-064/065 repro replays — DOM node count stays flat and heap plateaus (matches the genuine-off numbers above).

---
severity: P3
category: perf
anchor_symbol: loadGameData
current_line_hint: 11344
file: battle.html
agents: [performance-profiler]
fingerprint: 7c0ce911ca0d
confidence: medium
status: open
---

**Title**: jsdom cold boot drifted ~3.0s (May) → 5.5s median (n=5); warm loadGameData 308→387 ms — trend watch

**Evidence**:
```
Cold boot, 5 separate node processes (this session): 4691 / 5157 / 5523 / 5548 / 6772 ms
  → median 5523 ms, IQR ~860 ms; 4 of 5 runs exceed the bench's own relaxed 5000 ms jsdom target
Prior waves recorded 2880 ms (2026-05-22) and 3009 ms (2026-05-26) for the same measurement.
Warm isolated loadGameData re-run (5 trials, same page): median 387 ms (prior wave: 308 ms; mandate target 200 ms).
battle.html grew 4,800,766 → 5,086,819 bytes (+6%) between 2026-06-15 and 2026-07-03.
```

**Repro**: `for i in 1..5; do node scratchpad/boot-once.mjs; done` (times `loadEngine()` per fresh process); `window.eval('loadGameData()')` ×5 for the warm number.

**Blast radius**: Test-suite wall time (every suite pays the boot) and, proportionally, production first-load (loadGameData portion; the JSDOM-init portion is harness-only). Confidence is medium because repo git history starts 2026-06-11, so the May numbers cannot be re-run on today's machine — cross-session hardware variance cannot be excluded; the +6% file growth alone does not explain 1.8×.

**Fix sketch**: Record boot ms in a committed trend file (e.g. append to tests/reports/) so wave-over-wave drift is machine-attributable; if the 387 ms warm loadGameData needs to shrink, the known levers are the already-filed builds.csv parse (~180 ms) and dead non-gen-9 JSON layers (measured this session: only ~4.6 ms parse CPU — the dead-layer cost is transfer bytes, ~940 KB raw, not CPU).

**Verification**: Re-run the 5-process boot bench on a known-idle machine next wave and compare medians; trend file makes the comparison durable.
