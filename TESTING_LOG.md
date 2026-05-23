# Story Mode — Testing Log

**Branch:** `claude/gifted-turing-GM7uW`
**Date:** 2026-05-22
**Tester:** Claude (Senior QA / game design consultant pass)

## Phase 0 — Recon

### Engine / entry point
- Plain HTML + JS (no build step). 48,473-line monolith: `battle.html`. All gameplay lives in one `<script>` block (lines 8587–48471). Some sibling JS modules (`move-anim-map.js`, `move-sfx-map.js`, `online-pvp.js`) but story mode logic is entirely in `battle.html`.
- Dev server: `node scripts/dev-server.cjs` → http://localhost:5173/battle.html. Serves static files.
- Save format: `localStorage['pbs_story_save']` JSON, `SAVE_VER = 19` with chained migrations.
- Existing tooling:
  - `tests/story-walkthrough.mjs` — jsdom-based headless run that drives `window.StoryMode` through all 67 events and auto-wins each battle via `onBattleEnd(true, ...)`. **Already in repo**; lets us beat the game in ~10 s.
  - `tests/story-combat.mjs` — boots jsdom and runs **real** turn-by-turn battles via the engine. Tests with no `sm.active` flag (i.e., not story-mode RNG path).
  - `tests/story-variants.mjs` — boots 9 different setups (5 difficulties × 4 storylines) and runs the walkthrough.
  - `npm test` — node `--test` suites for damage formula and STAB/type/immunity invariants. ~533 tests, 351 todo, 0 fail.
- Dev flags / cheat URLs: `?kobugtest=1`, `?testmega=1`, `?debugMystery=1`, `?storychampionweak=1`, `?testmoves=1`, `?testbattle=charge6`, `?spritescaledebug=1`, `?championtest=cynthia|steven`, plus Settings → Developer / Story tools panel (`#screen-story-debug` buttons).
- Seedable RNG: `storyRngNext` (LCG seeded from `sm.runSeed`). But **only ~16 of ~300 mid-battle Math.random call sites actually use it** — major determinism gap (see BUG-002).

### Chosen control method
Drove the game through the **existing headless jsdom harness** (`tests/story-walkthrough.mjs`) — option (a). This works out of the box and exercises every screen, shop, facility, PC tab, Safari, Crucible, Frontier, and the post-HoF Mystery Figure climax in a few seconds. Real combat math is covered separately by `tests/story-combat.mjs` and the `npm test` damage / type suites.

Where the harness wasn't sufficient (e.g., to verify that a function is actually unreachable in scope, or to probe specific battle code paths), I dropped to:
- Code-level static analysis with grep + brace-tracking + a tiny acorn-free bisect that compares `Object.keys(window)` against the set of `function` declarations in `battle.html` (revealed the IIFE-scope bug, see BUG-001).
- Targeted jsdom probes (`window.eval(...)`) for identifier reachability across the IIFE boundary.

## Phase 1 — Full story-mode run

### Headless main-story run (clean save, normal difficulty, all gens)
- **Result: cleared.** Reached post-HoF City9 hub with `badges=8`, `gold=174,545`, `teamLen=6`, `pcLen=0`, all 6 mons named (e.g., Watchog, Ninjask, Araquanid, Plusle, Wormadam-Trash, Eldegoss — the harness fills team via Professor gifts).
- **Iterations:** ~31 city/battle cycles. Walkthrough exits cleanly when `sm.gymCleared[8] === true` and the hub re-shows.
- **Auto-win mechanism:** harness calls `window.StoryMode.onBattleEnd(true, ...)` directly with a stub `currentTrainerData`. Skips engine combat, exercises the city/battle state machine and victory overlays. No engine path was actually run in this phase.
- **Post-HoF Mystery climax fired** via `continuePostGame` → `onBattleEnd(true, 'Mystery cleared', '')`. `postHofMysteryClimaxDone=true`, `bossArc.available=true`, `balls.master=1` granted.
- **Crucible + Frontier hubs entered, surrender + frontier-run loops all reached** without crashing.

### Variant matrix run (`tests/story-variants.mjs`)
- All 9 combos completed (veryeasy/easy/normal/hard/challenge × classic; normal × second_sun/radio_silence/crimson_clade).
- Same single boot-time error in every run: `[Data] ReferenceError: _loadOpAbilities is not defined` (see BUG-001).
- No state corruption between runs; the harness re-initializes cleanly each pass.

### Real-combat run (`tests/story-combat.mjs`)
- 5 engine battles played turn-by-turn (1v1, 2v2, 6v6, stress, hazards). No story-mode flag set so the RNG-scope bug doesn't trigger.
- **Three 6-mon stress battles hit the 50-turn-same-pair stall detector** (`Charizard vs Squirtle` etc.). No turn cap in the harness; engine has a 200-turn safety net at `battle.html:19133` per agent recon, but real fights at full HP between mid-tier mons can sit there for 50+ turns when AI doesn't pick a KO option.

### Probes I ran past the harness
- **Identifier reachability probe** (`window.eval('typeof X')` for ~25 functions). Bisected the boundary: every function declared **inside the `window.StoryMode = (function(){...})()` IIFE** (lines 27449–48183) is unreachable from anything outside it. The IIFE returns a public-method object; private helpers stay private. But ~12 outside-the-IIFE call sites still reference them lexically. **Confirmed bug class — see BUG-001 (`_loadOpAbilities`) and BUG-002 (`storyRngNext`).**
- **Math.random vs storyRngNext census** in the battle engine: 295 bare `Math.random()` calls vs 48 `storyRngNext` references (and most of those are gated behind `(sm && sm.active) ? storyRngNext : Math.random` which crashes when the condition is true, see above).
- **Save migration audit**: SAVE_VER=19, migrations `migrateStoryPreV2 … migrateStoryPreV19` present; `newStoryRun` initializes pcBox, balls, pokedex, catchUnlocked, bossArc, rivalStanding. No obvious schema gaps.
- **Gym victory flavor**: confirmed personalized per leader (lines 28199–28295 `LEADER_BADGE_NAMES`, `LEADER_VICTORY_LINES`, `LEADER_BADGE_REFLECTIONS` — all 8 generations covered). Earlier `agent-state/CODEBASE_MAP.md` note that this was generic is now stale.
- **Damage formula suite** (`npm test`): 533/533 passing. 4 internal sub-test warnings about STAB ratio < 1.5× on Body Press / Salt Cure / Sizzly Slide / Vacuum Wave — see BUG-007.

### Workarounds used
- **None blocked the run.** The `_loadOpAbilities` boot error is caught by the data-load promise chain and the game proceeds (with OP "Awaken" abilities silently disabled).
- For combat-stall battles in `story-combat.mjs` I let them break at 50 turns; that's a test detector, not a game-side cap.
- For the `storyRngNext` outside-IIFE bug I did NOT trigger a live crash — the headless walkthrough auto-wins, never exercising those engine branches. A real player using locked moves (Outrage / Thrash) in a story battle would crash. See BUG-002.

### Edge cases I poked
- PC overflow: cap 10 enforced (per harness `edge.pc.overflow` check, didn't fire). Inspection confirms `pcDeposit` blocks ≥10.
- Selling last team mon: blocked. Starter has `unsellable` flag.
- Spend gold past balance: guarded; `Math.max(0, ...)` in shop code.
- Save corruption: load throws → silently returns false; **no player-facing message** (UX gap, see DESIGN_FEEDBACK.md).
- Invalid eventIndex: clamped in processNextEvent.
- Empty team + proceedToNextBattle: blocked by alert.

### What I did NOT exercise live
- An actual real-time combat playthrough in a real browser. The harness is headless; visual UI (animations, sprite atlases, sfx) is mocked. UI / mobile / accessibility findings below are code-only.
- An actual `storyRngNext` crash. Diagnosis is from static reachability proof. A live repro would require running a story-mode battle that fires `finalizeLockingAndRollout` confusion-from-fatigue, `_thawRng`, secondary-confuse, Swagger/Flatter, Harvest, or a G-Max status branch.

### Net result
**Main story is beatable** end-to-end via the harness with one consistent boot-time error and zero blockers in the auto-win path. There is one **latent Critical-class crash** in real story combat (BUG-002), plus a sizeable list of Major / Minor issues that a real human tester would notice — see BUG_REPORT.md and DESIGN_FEEDBACK.md.
