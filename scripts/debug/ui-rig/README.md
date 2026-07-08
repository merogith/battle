# battle.html visual-audit rig — driver cookbook

Playwright/Chromium harness used for the 2026-07-08 full UI/UX audit (see
`docs/UI_POLISH_MASTER_PLAN.md`; machine-readable findings in
`agent-state/ui-audit-2026-07-08/findings.json`).

Setup: serve the repo root — `python3 -m http.server 8787 --bind 127.0.0.1` — then write
audit scripts next to `audit-lib.mjs` and run them from this dir (`node yourscript.mjs`;
playwright resolves from the repo's node_modules). In the Claude remote environment,
Chromium must be launched via the lib (it pins `executablePath:/opt/pw-browsers/chromium`);
on a normal machine edit `launch()` to use the default install. Screenshots go to a
gitignored `out/` dir here.

Server already running: `http://127.0.0.1:8787/battle.html` (do NOT start another).
Rig dir: `<this dir>`
(`node_modules` is symlinked here; run scripts FROM this dir: `cd <rigdir> && node yourscript.mjs`).
Chromium must be launched via the lib (it pins `executablePath:/opt/pw-browsers/chromium`).

```js
import { launch, VIEWPORTS, snap, runChecks, bootStory, dismissOverlays, visibleScreens } from './audit-lib.mjs';
const { browser, page } = await launch(VIEWPORTS.phone, { touch: true });   // one viewport at a time
...
await browser.close();   // ALWAYS close; run viewports SEQUENTIALLY (only 4 cores on this box)
```

- `launch(viewport, {touch, harness})` — `harness:true` (default) sets `window.__testHarness`
  BEFORE load → exposes `window.__storyTest` (incl. `sm` get/set) + instant sleeps.
  Static layout is unchanged; screen-fade + some particles are suppressed. Use
  `harness:false` only for the pure player-eye journey.
- `bootStory(page, { eventIndex, overrides })` — injects a valid `sm`. Useful overrides:
  `badges`, `gold`, bigger `team` arrays, `atCrucible:true`, `inventory`, `pc`, `eventIndex`
  (index into `window.__storyTest.STORY_EVENTS_RAW`; rows are arrays, `r[1]` is the kind:
  'City' | 'Trainer' | 'Route' | …). After mutating `sm` call the relevant `enter*()` again.
- `dismissOverlays(page, 'screen-story-city')` — clicks through DIY fixed overlays
  (cold open, recap, arrival, tutorial scenes) until the given screen/modal id is visible.
  Record `clicked` labels — those overlays are THEMSELVES audit surfaces: screenshot BEFORE
  dismissing when your cluster covers them.
- A `modal-game-alert` often pops alongside (welcome tips). Close:
  `page.evaluate(() => window.closeModal('modal-game-alert'))` — or audit it first.
- `runChecks(page, name)` → JSON: page-hscroll / viewport-overflow-x / text-clipped-x|y /
  tiny-font / low-contrast / small-tap-target / no-accessible-name / overlap + font & button
  census. TRIAGE its output against the screenshot — some "overlap" hits are sticky footers
  over scroll content (fine) vs true collisions (bug). Trust the screenshot over the checker.

## Getting to each surface (all via page.evaluate)

- Home menu: default after `launch()`. Panels: Battle Options is on-screen; Settings:
  `window.openSettings()`; Help: `window.showHelp()`; modals close via `window.closeModal(id)`.
- Quick battle: `window.settings.quickTeamSource='random'; window.startQuickBattle()` →
  `screen-battle` in ~2s. Draft: set `'draft'` instead → `screen-draft`.
  In battle: command menu is `#command-menu`; move menu opens via the FIGHT button
  (`#command-menu button` click); party modal `modal-party`; summary `modal-summary`.
- Story menu: `window.StoryMode.showMenu()` → `screen-story-menu`.
  New-run char creation: `window.StoryMode.openTrainerCreate()` → `screen-story-trainercreate`.
- Story city hub: `bootStory(page,{eventIndex:0})` then `window.StoryMode.enterCity()` +
  `dismissOverlays(page,'screen-story-city')`. Higher cities: pick a later 'City' row index
  from `STORY_EVENTS_RAW` and set `badges` accordingly (city N ≈ badges N).
- Facilities (each after bootStory + enterCity): `StoryMode.enterShop() / enterTutor() /
  enterMentor() / enterPokemonCenter() / enterProfessor() / enterEvolutionLab() /
  enterEVTrainer() / enterFanClub() / enterColress() / enterLink() / enterCasino() /
  enterStoneShop() / enterArtifactHall() / enterArtifactShop() / enterDaycare() /
  enterSafariZone() / openCollection() / openTeamTester() / openCityBag() / openRunSummary() /
  openPartyModal()`. Screen ids mostly `screen-story-<name>`.
  Casino tabs: `StoryMode.casinoSwitchTab('slots'|'roulette'|'flip')`.
- Camp / wander / journal (test surface): `window.__storyTest.enterCamp()`,
  `__storyTest.showWanderScreen()`, `__storyTest.enterJournal()`.
- Wild catch: `__storyTest.catchRender` exists but state setup is intricate — easier: in a
  story battle vs a wild row, or read code around `catchState`. Best effort.
- Crucible: `bootStory` with `overrides:{atCrucible:true, postHofMysteryClimaxDone:true}`-ish
  then `StoryMode.enterCrucible()`. Frontier: `StoryMode.enterFrontierHub()`. Pits: `enterPits()`.
- Game over: `showScreen` is not global — force with
  `document.querySelectorAll('.screen,.modal').forEach(e=>e.classList.add('hidden'));
   document.getElementById('screen-story-gameover').classList.remove('hidden')` — but PREFER the
  real path (lose a battle / `StoryMode.retryFromGameOver` sites) so the content is populated.
  A screen force-shown without its render call may be EMPTY — that's a rig artifact, NOT a bug.
  Only report what you can reproduce through a real entry function.
- Online PvP UI: `modal-online-pvp` via the menu button (`#menu-other-modes-wrap` area) —
  audit the modal markup/layout only; no network calls will succeed (no Supabase here).

## Ground rules for findings

- Every finding: screen id + viewport + what's wrong + WHY it matters + screenshot filename
  + code anchor (selector or `battle.html` symbol/line via grep) + suggested fix direction.
- Save screenshots to `<rigdir>/out/<your-agent-name>/…png`, names like
  `<screen>-<viewport>[-state].png`.
- Cross-check against KNOWN backlog before reporting as new (you'll get the list in your
  prompt): F1 type-scale, F3 gold/hex, F4 buttons, F6 breakpoints, F7 44px targets, E1 overlay
  migration are ALREADY-KNOWN systemic items — still note per-screen instances briefly (they
  calibrate the sweep) but tag them `known-systemic`, and spend your depth on NEW issues.
- Tag each finding: `new` | `known-systemic` | `regression`.
- Severity: P0 blocks/traps or unreadable · P1 clearly broken visuals/a11y · P2 polish.
