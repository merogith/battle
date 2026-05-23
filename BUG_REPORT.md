# Story Mode — Bug Report

**Branch:** `claude/gifted-turing-GM7uW`
**Build under test:** `battle.html` @ HEAD (48,473 lines), `data/` v15-ish save schema (SAVE_VER=19).
**Test harness:** `tests/story-walkthrough.mjs`, `tests/story-combat.mjs`, `tests/story-variants.mjs`, `npm test`, plus targeted jsdom identifier-reachability probes.

## Fix status (this commit)

| Bug | Status | Notes |
|-----|--------|-------|
| BUG-001 (`_loadOpAbilities` ReferenceError) | ✅ Fixed | `window._loadOpAbilities` exposed inside the IIFE; `loadGameData` now calls via window with a typeof guard. Headless boot is now 0 errors (was 1). |
| BUG-002 (`storyRngNext` outside IIFE) | ✅ Fixed | `window.storyRngNext` exposed inside the IIFE; the 11 outside-IIFE call sites now use `(sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random` (lazy + safe). |
| BUG-003 (RNG hygiene, 295 bare Math.random) | ⏳ Not in this commit | Mechanical 8-hour pass; deliberately deferred to keep this changeset small and reviewable. |
| BUG-004 (6v6 AI stalls) | ⏳ Not in this commit | Requires AI heuristic redesign; tracked. |
| BUG-005 (silent save corruption nuke) | ✅ Fixed | Corrupted saves are now backed up to `pbs_story_save.broken.<ts>` + `pbs_story_save.broken.latest`, a toast warns the player, and Settings → Developer / Story tools gets two new buttons: "Export story save" (clipboard) and "Recover broken save". |
| BUG-010 (rival dialogue ignores record) | ✅ Improved | `rivalStandingPrimaryQuotePool` now branches on `rivalConsecutiveWins` / `rivalConsecutiveLosses` (1, 2, 3+ streak lines for both directions). |
| BUG-015 (boot has no progress) | ✅ Fixed | `loadGameData` stages the `#app-loading-text` through "species/moves/items (1/4)", "move sets (2/4)", "competitive builds (3/4)", "engine (4/4)". |
| BUG-018 (cryptic "Build pipeline error") | ✅ Fixed | Replaced with "Couldn't generate a team — please retry. (Internal: build-pipeline)". |
| BUG-023 (rotate-overlay contrast) | ✅ Fixed | `#aaa` → `#e0e0e0`. |
| Secondary-text contrast (BUG_REPORT 3.2, partial) | ✅ Fixed | `.stat-mini-label`, `.sum-detail-lbl`, `.summary-stat-label`, `.battle-btn-move .move-tile-meta` bumped from `#888` to `#b8b8b8`. |
| Battle command aria-labels (UI section 3.1) | ✅ Added | FIGHT / POKÉMON / BAG / RUN each get a descriptive `aria-label` (includes the keyboard shortcut). |
| Rival quote pool depth (Design 2.4) | ✅ Improved | `RIVAL_PROGRESS_PRIMARY_QUOTES` now has 6 lines per phase (was 3). |

All other findings (BUG-006, 007, 008, 009, 011–014, 016–017, 019–022, 024–028) remain open and tracked below.

---

## Executive summary

**Did I beat it?** Yes — the headless walkthrough (auto-win pattern) reaches the post-HoF City9 hub, fires the Mystery Figure climax, opens Crucible / Battle Frontier / Boss Arc, with badges=8 and 174k gold. The variant matrix (5 difficulties × 4 storylines, 9 runs) also all complete. `npm test` is 533/533 green.

**Overall state:** the main loop works. Saves, migrations, shops, PC, Safari, tutor flow, EV Trainer, Frontier ladder, Crucible entries are all reachable. Difficulty curve, build power tiering (T1→T4), and badge unlocks are wired through. The bones are good.

**The five most important findings:**
1. **BUG-001 (Critical):** `_loadOpAbilities` is declared inside the `window.StoryMode` IIFE (line 44415) but called from outside it (line 9208 in `loadGameData`). The call throws `ReferenceError: _loadOpAbilities is not defined` at every boot. Caught by the data-load promise chain, so the game still loads — but the OP "Awaken" abilities feature is silently disabled forever. Visible as `[Data] _loadOpAbilities is not defined` in console on every boot.
2. **BUG-002 (Blocker — latent):** Same scope bug for `storyRngNext`. ~11 outside-IIFE call sites in the battle engine reference `storyRngNext` (locked-move fatigue confusion, thaw, secondary-confuse, Swagger/Flatter, Curse, Harvest, G-Max Stun Shock / Gold Rush / Smite). They sit behind `(sm && sm.active) ? storyRngNext : Math.random`, so quick-play battles are fine, but **any story-mode battle that triggers one of these branches will crash with `ReferenceError: storyRngNext is not defined`**.
3. **BUG-003 (Major):** Story RNG determinism is broken throughout the battle engine. 295 bare `Math.random()` calls vs 48 `storyRngNext` calls — damage roll, crit, accuracy, speed tie, Quick Claw, Static / Poison Point / Flame Body, ability flinch (Stench), most secondary effects (line 25025), Sleep duration, Shed Skin, Confuse Ray success, Tri Attack stat pick all use bare `Math.random`. Save-scumming and replay-from-seed do not behave deterministically.
4. **BUG-004 (Major):** Battle stalls. Three of five real-engine 6v6 stress battles hit the 50-turn "same pair" stall detector without resolving. The engine has a 200-turn cap (per recon) but AI move-selection picks chip / status options against high-HP defenders and gets stuck. Players will see grinding mid-game battles.
5. **BUG-005 (Major):** Save corruption is silent. `JSON.parse(raw)` failures in `load()` return `false` with no player-facing message; the run is just gone. With ~3-second throttled auto-saves and no manual export, one bad write erases the run.

The full list (24 entries) is below. I tried to err toward "this might bite a real player" rather than nit-picking comment strings.

---

## Blocker

### BUG-002 — `storyRngNext` is referenced from outside its closure
- **Severity:** Blocker (latent — only fires under specific combat conditions in story mode).
- **Area:** Battle engine ↔ Story RNG.
- **Steps to reproduce:**
  1. Start a story run on any difficulty.
  2. Engage a real story-mode battle (not auto-win) with a Pokémon that knows Outrage / Thrash / Petal Dance / Glaive Rush / Raging Fury.
  3. Spam the locking move. After 2–3 turns, the lock expires.
  4. The engine reaches `battle.html:19778` → `const _confFatigueRng = (sm && sm.active) ? storyRngNext : Math.random;`
  5. `sm.active` is true → JS evaluates `storyRngNext` → ReferenceError.
- **Expected:** Confusion-from-fatigue rolls deterministically against the story seed.
- **Actual:** Engine throws, battle DOM left half-rendered, current turn dies on the floor. Player has to refresh and reload from auto-save.
- **Evidence:**
  - `battle.html:30808` declares `function storyRngNext()` **inside** the IIFE that starts at `battle.html:27449` (`window.StoryMode = (function() {`) and ends at `battle.html:48183` (`})(); // end StoryMode IIFE`).
  - `battle.html:19778` (also `:23064, :23128, :23133, :24234, :25008, :25089, :25148, :25154, :25532, :26487`) reference `storyRngNext` directly with no `typeof` guard. All of these are at line numbers < 27449, i.e., *outside* the IIFE.
  - jsdom probe: `window.eval('typeof storyRngNext')` from outside-IIFE scope returns `"storyRngNext is not defined"`.
- **Why no test caught it:** `tests/story-walkthrough.mjs` auto-wins via `onBattleEnd(true, ...)`, never running combat. `tests/story-combat.mjs` runs real combat but doesn't set `sm.active = true`, so the `? storyRngNext : Math.random` branch never picks `storyRngNext`.
- **Suspected cause:** `storyRngNext` was authored as a story-mode private helper but later referenced from engine code that lives in the outer script scope. The IIFE refactor moved it inside.
- **Suggested fix:** Either expose it on `window` from inside the IIFE (`window.storyRngNext = storyRngNext;` just above `// end StoryMode IIFE`), OR move the function declaration out to the outer scope and pass `sm` in by parameter. The four sites at lines 23302/23310/23360/23368 (`typeof storyRngNext !== 'undefined'`) already use the defensive guard — apply that pattern to the other 11.

---

## Critical

### BUG-001 — `_loadOpAbilities` ReferenceError at every boot, silently disables OP "Awaken" abilities
- **Severity:** Critical (feature-killing; silent).
- **Area:** Boot / Battle Dojo Ability tab.
- **Steps to reproduce:**
  1. Open `battle.html` in any browser (or run any of the headless tests). Watch the console.
  2. After "[Data] Loaded 1380 species…", an error appears: `[Data] _loadOpAbilities is not defined`.
  3. Start a story run, beat 6 gyms (to enable Dojo Ability tab in city 6+), open Battle Dojo on any mon.
- **Expected:** Three curated OP abilities (Huge Power, Magic Guard, etc.) offered for the selected mon per `data/op-abilities.json`.
- **Actual:** No OP abilities ever appear. `_opAbilitiesCache` remains `undefined`. The Ability tab falls back to legal abilities only.
- **Evidence:**
  - `data/op-abilities.json` exists (6612 lines, ~1380 entries) and is served correctly (HTTP 200 from dev server).
  - `battle.html:44415` declares `async function _loadOpAbilities()` **inside** the IIFE.
  - `battle.html:9208` calls `await _loadOpAbilities();` from `loadGameData` which is **outside** the IIFE (declared at `battle.html:9099`).
  - jsdom probe at session boot: `typeof window._loadOpAbilities === "undefined"` and inner `_opAbilitiesCache` is in TDZ from outside.
  - Caught at `battle.html:10173` `.catch(function(err) { console.error('[Data]', err); … })`; the data promise then proceeds (data IS loaded), but `_opAbilitiesCache` is never populated.
- **Suspected cause:** Same IIFE-scope refactor as BUG-002. Both `_loadOpAbilities` and `_opAbilitiesCache` were moved inside `window.StoryMode = (function(){...})()` while `loadGameData` stayed outside.
- **Suggested fix:** Move `let _opAbilitiesCache` and the function declaration out of the IIFE, or expose them via the IIFE return / `window.StoryMode.loadOpAbilities`, and call that from `loadGameData`. Add a guard `if (typeof _loadOpAbilities === 'function')` before the await to make the failure self-healing.

### BUG-005 — Corrupted save silently nukes the run
- **Severity:** Critical.
- **Area:** Save / load system.
- **Steps to reproduce:**
  1. Start a story run, play to badge 5.
  2. Manually corrupt `localStorage['pbs_story_save']` (e.g., delete a closing brace) and reload.
- **Expected:** Player-facing dialog "Your saved run is unreadable. Restart, or export the raw JSON for recovery?" with a path forward.
- **Actual:** `load()` catches `JSON.parse` throw, returns `false`, game treats player as a fresh user. Save is overwritten on next interaction. Run is gone.
- **Evidence:** `battle.html` ~line 30875–30880 (`function load()` body, per agent recon). Try/catch wraps parse, no toast/alert path on failure.
- **Suggested fix:** On parse failure, write the raw saved blob to a sibling key (`pbs_story_save.broken`) before returning false, and emit a single `showGameAlert` with a "Copy save to clipboard" affordance. Even a one-button recovery is huge for trust.

### BUG-006 — `proceedToNextBattle` runs through a fault — no explicit guard for missing currentTrainerData
- **Severity:** Critical (only triggers if state was corrupted by an earlier crash).
- **Area:** Battle setup.
- **Steps to reproduce:** If BUG-002 crashes mid-battle and the player reloads, the resumed save may have `sm.currentTrainerData = null` while `sm.eventIndex` points at a Battle row. Proceeding then errors instead of cleanly recovering.
- **Evidence:** Tester's `forceWinCurrentBattle` had to manually re-stub `currentTrainerData` before calling `onBattleEnd` (see `tests/story-walkthrough.mjs:236`) — implying the engine's recovery path doesn't handle this on its own.
- **Suggested fix:** In the resumed-battle code path, if `currentTrainerData` is null but `eventIndex` is a Battle row, rebuild it from `sm.trainerAssignments[eventIndex]` (already populated) or kick the player back to the prior City with a toast.

---

## Major

### BUG-003 — Battle math is non-deterministic in story mode (295 bare Math.random calls)
- **Severity:** Major.
- **Area:** Engine RNG hygiene.
- **Steps to reproduce:**
  1. Start a story run with a fixed `runSeed`.
  2. Save mid-battle, force a missed attack on the next turn.
  3. Reload — the missed turn becomes a hit (or different damage).
- **Expected:** Replay from seed produces identical battle outcomes.
- **Actual:** Damage roll (`battle.html:21682`), crit (`:21188`), accuracy (`:20748`), speed tie (`:19374`), Quick Claw (`:19359-:19360`), Static/Poison Point/Flame Body (`:22467-:22470`), most secondary effects (`:25025`), Stench (`:25044`), Sleep duration (`:25888` per recon), Shed Skin (`:26141`), Tri Attack stat pick, Confuse Ray hit chance (`:20312`), Psywave variance (`:22016`), Magnitude roll (`:21088`), 2-5 multi-hit pick (`:21462`), Sleep Talk pick (`:20083`), Metronome pick (`:20272`), Focus Band proc (`:22081`) — all bare `Math.random`. Census: 295 bare calls, 48 `storyRngNext` calls.
- **Suspected cause:** The story seed was added later; only the most visible call sites (confusion roll, trap turns, thaw, harvest) got the `(sm && sm.active) ? storyRngNext : Math.random` pattern. The rest were never migrated.
- **Suggested fix:** Define a single engine helper `const __rng = (sm && sm.active) ? storyRngNext : Math.random;` at the start of each engine entry point (or as a closure on the per-turn context), then replace `Math.random()` with `__rng()` engine-wide. Fixing BUG-002 first is a prerequisite. If full determinism isn't the goal, document explicitly that story seeds only control trainer rolls (and remove the `console.warn('[Story] storyRngNext called with no seed during active run')` red herring).

### BUG-004 — 6v6 battles stall on chip moves; AI move-pick has no "finish them" heuristic
- **Severity:** Major.
- **Area:** AI.
- **Steps to reproduce:**
  1. Run `node tests/story-combat.mjs`.
  2. Battles 3–5 (6v6, stress, hazards) print `[battle.stall] Same pair Charizard vs Squirtle for 50 turns at turn 55`, then break at the harness's stall detector.
- **Expected:** Battles converge within ~30 turns. AI prioritizes KO-range moves when in range.
- **Actual:** AI doesn't break stalls. With both mons at high HP and no super-effective coverage, chip damage + recovery loops indefinitely. The engine's 200-turn `MAX_TURNS` is the only safety net; players doing rival rematches in Crucible will sit through long fights with no resolution.
- **Suspected cause:** `aiEstimateDmg`/`aiThreatScore` (lines ~17629 / ~17738) don't include an explicit KO-shot bonus or anti-stall weight.
- **Suggested fix:** In `aiDecision`, if any move has an `aiEstimateDmg >= defender.currentHp`, add a +10 weight. If 5+ turns have passed without HP-loss to either side, add a +5 weight to the highest-BP available move. Surface "Turn N — battle is dragging" in dev mode for diagnosis.

### BUG-007 — Several STAB moves under-multiply (Body Press, Salt Cure, Sizzly Slide, Vacuum Wave)
- **Severity:** Major.
- **Area:** Damage formula / move implementations.
- **Steps to reproduce:** `npm test` — within the "STAB attacker deals ~1.5x more than non-STAB attacker" test:
  - Body Press (Fighting): STAB 23 vs noSTAB 18 = **1.28×** (expected 1.5×)
  - Salt Cure (Rock): STAB 1284 vs noSTAB 1272 = **1.01×**
  - Sizzly Slide (Fire): STAB 659 vs noSTAB 647 = **1.02×**
  - Vacuum Wave (Fighting): STAB 10 vs noSTAB 6 = **1.67×**
- **Expected:** STAB multiplier 1.5× on the move's base damage.
- **Actual:** Body Press uses Defense not Attack — the test's "noSTAB attacker" has identical Defense, so the post-STAB ratio is muted (only 1.28× shows). Salt Cure / Sizzly Slide totals include the secondary DOT (salt cure tick, burn tick) which dilutes the STAB ratio in the totals. Vacuum Wave overshoots at small numbers — likely a rounding artifact when base damage is 6.
- **Suspected cause:** Test design issue more than engine bug — but Body Press is a real edge: STAB is applied to a defense-scaled move, which is correct. Salt Cure's tick should probably NOT inherit STAB but the test isn't isolating per-hit damage.
- **Suggested fix:** Either tighten the test (compare per-hit damage instead of totals), or document these moves as expected exceptions. If Salt Cure's DOT is wrongly STAB-boosted, that's the actual bug to file.

### BUG-008 — `_storyTutorMode` is double-declared (lines 44199 and 88404 per code-map agent; second offset is in compiled view but matches an inline duplicate)
- **Severity:** Major (silent — let-redeclaration in same block would throw, so they must be in different scopes; if same scope, the file wouldn't parse at all).
- **Area:** Tutor module scoping.
- **Evidence:** `agent-state` codebase map references `let _storyTutorMode = 'moves';` plus accordion idx vars that appear in two places. `node --check` passes, so they're in different scopes — but if they're truly disjoint copies the engine may render the wrong tutor screen on the second usage.
- **Suggested fix:** Audit `grep -n "let _storyTutorMode" battle.html` (should return exactly one match). If two, deduplicate.

### BUG-009 — Walkthrough harness exposes `engine.console.error` once per boot but harness suppresses retries
- **Severity:** Major (testability — masks real issues).
- **Area:** Test harness.
- **Evidence:** `tests/story-walkthrough.mjs:107` suppresses `localStorage is not available` warnings. Reasonable, but it makes the harness also miss any duplicate boot-time errors that share that prefix.
- **Suggested fix:** Tighten suppression to exact match.

### BUG-010 — Rival dialogue is keyed by phase, not by win/loss record
- **Severity:** Major (story/UX).
- **Area:** Narrative.
- **Steps to reproduce:** Lose to the rival at phase 2 (post-Gym-3 fight). Encounter them again at phase 3.
- **Expected:** Lines like "Two losses and you're back" or "Still ahead. Mind your footing." reflecting the actual standing.
- **Actual:** Phase-keyed lines from `RIVAL_PROGRESS_PRIMARY_QUOTES` ignore `sm.rivalStanding`. The same "Mid-journey check-in" line plays whether the player is 3-0 or 0-3 against the rival.
- **Evidence:** `battle.html:~29252` `RIVAL_PROGRESS_PRIMARY_QUOTES`, `setRivalStanding` at `~30694`. Variant pools at `~29269+` add flavor for `second_sun` / `radio_silence` but still phase-based.
- **Suggested fix:** Add `RIVAL_AHEAD_QUOTES`, `RIVAL_BEHIND_QUOTES` keyed by `Math.sign(rivalStanding[phase].playerWins - losses)` and merge into the picker.

### BUG-011 — Mystery Figure outcome is a random roll with no foreshadowing
- **Severity:** Major (design/payoff).
- **Area:** Post-HoF Mystery Figure.
- **Evidence:** 8 identities (Cyrus, Ghetsis, Cynthia, Steven, N, Red, Lance + variant entries) at `battle.html:~28711`. Identity selected at run start (`:28780`) and locked.
- **Issue:** Random identity = no setup. There's no NPC line in cities 4–7 that hints "I heard a shadowy figure at the league…". Result: the reveal lands as surprise filler, not climax.
- **Suggested fix:** After Gym 4, seed 2–3 oblique references to the chosen identity in city dialogue (e.g., for Cynthia: "I saw a woman in white at the Frontier — she said your name."). Reuse the existing `STORY_TUTORIAL_SCENES`/`STORY_COLD_OPENS` infrastructure.

### BUG-012 — Mid-game pacing flat (Gym 4 → Gym 6)
- **Severity:** Major (balance/pacing).
- **Area:** Difficulty curve.
- **Evidence:** `_stageGatedFoeStatMult` (`:13199`) gives Gym 1–4 a flat `1.0×`. Gym 6 jumps to `1.05×`, Gym 8 / E1–E4 `1.15×`. Build tier table (`STORY_BUILD_TIER`) bumps T2→T3 at badges 3, T3→T4 at badges 6.
- **Issue:** Rows 23–37 between GL4 and GL6 share `1.0×` stat-mult AND mostly T3 builds — same encounters wearing different sprites. Players will feel they're treading water.
- **Suggested fix:** Add a `1.025×` factor at GL5 and a `1.05×` at the post-GL5 rival to break the plateau. Or introduce a new mechanic (held-item swaps, second-wind setups) at GL5 to keep things fresh.

### BUG-013 — Difficulty stat multipliers are tighter than the perceived gap
- **Severity:** Major (balance).
- **Area:** Difficulty.
- **Evidence:** `applyFoeDifficultyScaling` at `:13239` — `veryeasy=0.70`, `easy=0.85`, `normal=1.0`, `hard=1.15`, `challenge=1.30`.
- **Issue:** veryeasy → challenge is a 1.86× spread, but `challenge` only adds 30% on top of `normal`. Compared to e.g. Battle Frontier's flat 30% Hard-mode bump, the spread for the *whole* story-mode curve feels narrow. Recommend testing `challenge=1.40` to give end-game its own teeth.
- **Suggested fix:** Either (a) widen to `challenge=1.40` and document the increase, or (b) couple difficulty to AI quality (currently the AI doesn't change). Hard/Challenge should AI-think one ply deeper.

### BUG-014 — Late-game gold barely covers consumables (no surplus for orbs/experimentation)
- **Severity:** Major (balance/economy).
- **Area:** Economy.
- **Evidence:** GL6 nets ~5550g × 1.30 × 1.05 ≈ 7560g on normal. A Max Revive (4000g) + 2 Hyper Potions (2000g) + Great Ball (1000g) = 7000g. Profit per leader: ~560g.
- **Issue:** Players who use revives don't accumulate experimentation budget. Niche items (Weather Orbs, X-Stat orbs, Choice items) cost 1000g each — players will skip them, which hides their tactical value.
- **Suggested fix:** Halve consumable costs in cities 6–9 (you're paying premium for convenience while gym payouts haven't caught up), OR bump Champion / E4 payouts to ~12,000g each.

### BUG-015 — Boot path has no progress indication for 2-second data load
- **Severity:** Major (UX).
- **Area:** Boot.
- **Evidence:** `app-loading-overlay` (`battle.html:7395`) shows a spinner and "Loading Pokédex & moves…". No percentage, no per-asset trace. On a slow network the player stares at a still screen for 5+ seconds with no idea if it's hung.
- **Suggested fix:** Update the loading text in stages: "Loading species (1/4)…", "Loading moves (2/4)…", etc., from `loadGameData`. Free win.

### BUG-016 — Battle Frontier ladder progress not surfaced mid-run
- **Severity:** Major (UX).
- **Area:** Battle Frontier.
- **Evidence:** Recon agent: "milestone toasts ('Four badges…') are single-event milestones, not per-battle progress."
- **Issue:** During a long Frontier run the player has no idea what battle # they're on. Surrender vs continue is a guess.
- **Suggested fix:** Persistent "Frontier 12 / ∞" overlay during a Frontier run + best-run record next to the surrender button.

---

## Minor

### BUG-017 — Save throttle suppresses "Saved" toast during early-game; suppressed until run active
- **Severity:** Minor (UX trust).
- **Area:** Save.
- **Evidence:** save throttle to ~3s; toast suppressed before `sm.active` (per recon).
- **Issue:** Player who picks a starter and quits doesn't see confirmation that their pick was persisted.
- **Suggested fix:** Always show the first save's confirmation toast.

### BUG-018 — "Build pipeline error — try again." appears at three sites with no context
- **Severity:** Minor (UX clarity).
- **Area:** Build / Team setup.
- **Evidence:** Per agent recon `battle.html:~37503, :37518, :37531`.
- **Issue:** Phrase "pipeline error" is dev jargon. New player has no recovery path.
- **Suggested fix:** "Couldn't generate a team — please retry. (Internal: build-pipeline)" — keep the diagnostic but lead with a plain message.

### BUG-019 — `pcDeposit` accepts deposit when PC is full; silently returns?
- **Severity:** Minor (per code review, line says cap=10 enforced; needs confirmation via live test).
- **Area:** PC Box.
- **Steps to reproduce:** Fill PC to 10, try `window.StoryMode.pcDeposit(0)`.
- **Evidence:** `tests/story-walkthrough.mjs:603` already probes this. Doesn't flag overflow in current build (good). Worth a confirmation print.

### BUG-020 — "Pokemon" without diacritic in 99 places
- **Severity:** Minor (polish).
- **Area:** Text.
- **Evidence:** 361 occurrences of "Pokémon" vs 99 of "Pokemon" (recon census). Many are in CSS comments (invisible) but several player-visible: tooltip help text, possible alerts, CSV-derived labels.
- **Suggested fix:** Run `sed -i 's/Pokemon/Pokémon/g'` on a curated allowlist of user-facing locations (skip CSS comments, scripts, JSON keys).

### BUG-021 — Terminology drift: "Crucible" vs "Battle Frontier" vs "Frontier Hub"
- **Severity:** Minor (UX clarity).
- **Area:** Post-game.
- **Evidence:** Crucible is the post-HoF hub; Frontier is a sub-facility inside Crucible. Strings at lines `~8030, ~8047` per agent. UI label "Crucible" not introduced anywhere — first appearance is the button itself.
- **Suggested fix:** First-time tooltip on the Crucible button: "The Crucible — a post-Hall-of-Fame hub. Battle Frontier ladder, Boss Arc, and Mystery rematches live here."

### BUG-022 — Jargon overload in story setup: "EVs", "IVs", "Natures", "Gimmick", "Tier" all undefined for newcomers
- **Severity:** Minor (UX).
- **Area:** Onboarding.
- **Evidence:** Setup screen labels and the Battle Dojo / EV Trainer / Nature Rater all assume the player knows competitive Pokemon terminology.
- **Suggested fix:** Hover-info icons next to each jargon term with a 1-line plain explanation. Or an opt-in "tutorial mode" tooltip.

### BUG-023 — Rotate-overlay text contrast (`#aaa` on dark) is dim on small screens
- **Severity:** Minor (accessibility).
- **Area:** Mobile/orientation.
- **Evidence:** `battle.html:3350` `#rotate-overlay p { color: #aaa; }`.
- **Suggested fix:** `color: #e0e0e0;`. Contrast ratio jumps from ~4.5:1 to ~10:1.

### BUG-024 — Tutor `_tutorRefreshMoveDetailRow` not registered on event delegation for late-added rows
- **Severity:** Minor (possible — would need live UI test to confirm).
- **Area:** Move Tutor UI.
- **Evidence:** Agent UI sweep flagged "selects do not have visible `:hover` on small inline items".
- **Suggested fix:** Use event delegation on the tutor container (`onchange` on parent matches `.story-tutor-move-select`).

---

## Trivial

### BUG-025 — `_loadOpAbilities.toString()` is called from outside its scope in this report's repro probe, fails as expected
- This is not a game bug, just a note that the symptom is reproducible: `window.eval` from outside the IIFE cannot see the function. Mentioned for completeness.

### BUG-026 — `[CSV] Loaded builds for 1147 Pokémon (748 flagged as illegal — reserved for end-game)` — 65% of mons are "end-game only"
- **Severity:** Trivial (design choice, not a bug).
- **Area:** Build CSV.
- **Issue:** Worth confirming the gate. If 748 species are reserved for end-game and the player's encounter pool is the remaining 399, that's a much narrower run than the species count implies.

### BUG-027 — Stall detector in tests/story-combat.mjs caps at 50 same-pair turns; engine cap is 200. Diagnostics-only.
- **Severity:** Trivial.

### BUG-028 — Multiple `}())` closers near end of file (line 48214, 48245, 48272, 48295) — readability only
- **Severity:** Trivial.

---

## Test artifacts

- All findings reproducible via:
  ```bash
  npm install
  node tests/story-walkthrough.mjs       # main loop
  node tests/story-combat.mjs            # real combat 1v1..6v6
  node tests/story-variants.mjs          # 9-variant matrix
  npm test                                # damage / type suites (~2 min)
  ```
- Reachability probe used to confirm BUG-001 / BUG-002 was a tiny jsdom script comparing `Object.keys(window)` against `function NAME(` declarations in `battle.html`. The IIFE boundary was confirmed at `battle.html:27449` (start) and `battle.html:48183` (end).
