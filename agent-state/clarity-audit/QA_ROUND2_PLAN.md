# Story Mode — QA Round 2 (new-player pass) — Findings & Plan

> 2026-05-29. Method: real-browser playthrough (Chromium, full C0→post-HoF, 90 shots,
> 0 non-anime runtime errors), jsdom test suite (**897 pass / 0 fail / 351 todo**),
> data validator (**0 findings**), and three parallel read-only agents
> (story-flow, a11y/UX, battle-engine) with deterministic repros.

## Code health (verified good)
- 897 tests green; data integrity clean (17,397 builds).
- Battle agent ruled out (with repros): damage formula, STAB/crit/burn, type-immunity→0,
  poison/toxic, turn order/Trick Room/Pursuit, AI never picks 0-dmg into immunity.
- **RNG drift is RESOLVED** — a global `Math.random` override (`battle.html:35127`) makes
  same-seed battles byte-identical when `sm.active && runSeed != null`. Many old P1 ledger
  RNG items are stale.
- Pre-HoF: the single objective line is correct & reachable across all 18 city rows ×
  states; Relics merge is behavior-neutral; no-levels teaching line is correct.

## Bugs / weak spots (prioritized)

### P1 — BOSS_CONFIGS hookup is broken; all 19 story bosses fight as vanilla
My clarity-pass reroute points `startBattle` (`16832`) + turn-tick (`20775`) at
`window.StoryMode.{BOSS_CONFIGS,bossMechanicsBattleInit,bossMechanicsTurnTick}` — **those
keys exist only on the test-only `window.__storyTest` (`37603-37610`, gated by
`__testHarness`), not on the production `StoryMode` return (`59565`, which has only
`state`).** So `_cfg` is always undefined → mechanics never attach (silent no-op; was a
caught ReferenceError before). 10 villain climaxes + 8 raids + Mystery Figure = vanilla.
**Plus 3 latent defects** if hookup is fixed: immunity-round off-by-one (set=1 then
decrement same tick → 0 immune turns), HP-threshold "surge" has no damage consumer
(banner-only), weather/terrain field-locks set but never read.

### P1 — Post-HoF, the objective line points at the wrong thing (my consolidation gap)
After winning, City9 objective = "Enter the Pokémon League" (re-runs E1→Champion); City0 =
"🏁 Rival — starter duel" (which launches a 6v6 because party is now 6 — `_storyEnemyPartySize`
`45810`). The real post-game hub (🧨 The Crucible) is one button among ~19, never the
objective. Neither the objective block (`43257`) nor the gym/league/route buttons (`42997`)
check `sm.bossArc.available`. Not a hard soft-lock (league replay loops via HoF→`continuePostGame`)
but it's exactly the "objective points wrong" failure the clarity pass was meant to kill.

### P1 — Sleep off-by-one (~1/3 of sleeps cost 0 turns)
`canMove` (`26058`) does `statusTurns++` then `>= sleepDuration` and wakes **and moves** the
same turn; with the 1–3 roll, `sleepDuration=1` is a complete no-op. Player-facing
("my Spore did nothing"). Corroborates an existing ledger finding.

### P1 — (a11y) The intro cold-open overlay isn't a dialog — blocks keyboard/SR at the first moment
`_renderNarrativeOverlay` (`46196`) — the very first thing a new run shows — has no
`role=dialog`/`aria-modal`/focus/ESC, unlike its tutorial twin `_showStoryTutorialScene`
which does it right. `_storyScene` (`43747`) has the same gap. Keyboard/SR users land behind
the overlay.

### P2 — Overlay system has no mutual-exclusion (two scenes co-render)
Visual pass caught the EV-Trainer `firstEVTrainer` tutorial rendering **on top of** the
Relics screen, and faint text-behind-title on transitions. Queued tutorials
(`_enqueueIntroTutorial`) + cold-opens + scenes fire on timers without a one-at-a-time guard.

### P2 — PT-001: turn-loop has no `anime` guard → offline battles unwinnable + masks throws
`startBattle` guards `anime`, but the turn-resolution path doesn't; with the CDN blocked
every move throws → caught at `21100` as "Turn skipped" → no damage, 50-turn stall. Also
hides any real wrong-result/softlock behind the same generic catch.

### P2 — Master Ball double-grant (lore/balance)
Villain-track Road-7 boss grants a Master Ball (`41917`) **and** the post-HoF broker grants
the "unique" one (`53543`) → 2 before the Caged God (needs 1). Not exploitable (Master Ball
locked out of non-boss catches), but undercuts the "one key" lore.

### P2 — City0 forces a brand-new player through an **empty** Bag before the first fight
`bag` is a City0 forced-intro (`FACILITY_DEBUT_CITY` + `_isFacilityRequiredHere` null-label →
implicit-required), so Continue Route is gated on opening an empty Bag — friction, no payoff.

### P2/P3 — a11y polish on the just-shipped code
Relics Browse/Manage tabs lack `role=tab`/`aria-selected` + the disabled Browse reason is
only in `title` (not announced); relic tabs + "Suggested" label are < 44px tall and the
label (`#8a9bb0` @0.75 opacity ≈ 3.5:1) fails AA.

### P3 — misc
Move-tile `aria-label` omits type-effectiveness (`18769`); trainer-create radio grids lack
roving-tabindex/arrow keys; battle hotkeys disabled on any `isMobile` (strands tablet+keyboard);
"POKéMON GENERATIONS" — `é` doesn't uppercase under `text-transform`.

## Plan

**Tier 0 — engineering / clarity / a11y (no gameplay change; safe to do directly):**
1. Post-HoF objective → point at the Crucible (and Caged God when leads pending) instead of
   falling through to league/route; stop the objective ever pointing at the intro rival post-HoF.
2. PT-001: guard the turn-resolution `anime` calls (mirror the `startBattle` guard) so battles
   resolve without animations, and stop masking real throws as "Turn skipped".
3. Overlays: give `_renderNarrativeOverlay` + `_storyScene` the dialog/focus/ESC scaffolding
   their tutorial twin already has; add a one-overlay-at-a-time guard.
4. a11y polish on shipped code: relic tab roles/labels + `min-height:44px` + "Suggested" contrast.
5. `é` cosmetic; move-tile effectiveness in aria-label.
6. Correct the BOSS_CONFIGS code/comment honesty regardless of the design call below.

**Tier 1 — design / gameplay calls (need maintainer decision — see questions):**
- A. **Boss mechanics**: activate (expose on `StoryMode` + fix the 3 mechanic bugs → 19 bosses
  finally get phase mechanics, a balance-affecting change) vs. leave dormant & just make the
  code honest (bosses stay vanilla as shipped).
- B. **Sleep off-by-one fix** (makes sleep cost the intended turns — small battle-feel change).
- C. **Master Ball double-grant** (swap villain-boss reward to Ultra Balls, keep Master Ball
  unique to the Caged God).
- D. **City0 empty-Bag forced intro** (drop it / keep it).
