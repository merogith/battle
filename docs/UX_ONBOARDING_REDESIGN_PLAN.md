# UX / Onboarding / Flow & Pacing — Full Investigation & Redesign Plan

> **Status:** PROPOSAL — nothing here ships without maintainer sign-off (per CLAUDE.md approval
> rules). Behavior-preserving items are marked; everything else needs an explicit ✅ from the
> maintainer before implementation.
>
> **Trigger:** playtest feedback — players enjoy the game but "sometimes feel confused or lost
> in menus"; UI/UX described as "a bit confusing and buggy".
>
> **Method:** six parallel deep audits of `battle.html` + `docs/` + the issue ledger —
> (1) navigation/IA map of all 26 screens & modals, (2) story-mode first-session onboarding &
> pacing walkthrough, (3) in-battle UI clarity, (4) visual design system, (5) accessibility /
> focus / contrast, (6) external research on game-onboarding & menu-UX best practice (Hodent
> GDC, NN/g, platform standards, Hearthstone/Slay-the-Spire/Showdown case studies).
> Line numbers are drift-tolerant — search the quoted symbol/selector if a number has moved.
>
> **Related docs (do not redo their work):** `docs/BATTLE_RESPONSIVE_LAYOUT_AUDIT.md`
> (battle layout mechanics — already rebuilt), `docs/story-design/UI_VISUAL_SYSTEM_AUDIT.md`
> (icon/color/chrome pass — has a deferred backlog this plan resumes),
> `docs/story-design/VISUAL_ART_DIRECTION_REVIEW.md`, `agent-state/ISSUE_LEDGER.md`.

---

## 0. Executive summary — why players feel lost

The testers' complaint decomposes into **five root causes**, each independently verified:

| # | Root cause | One-line evidence |
|---|---|---|
| R1 | **No safe way out, anywhere.** Story mode has no non-destructive exit; the draft screen has no cancel; the Crucible has no back button; the one universal escape hatch is a red "Forfeit & Exit" buried under the Developer section of the Settings modal — and it means four different things in four modes. Browser Back instantly kills the app (zero history integration). | battle.html:9605, 9832, 10061, 17502, 65388; grep `popstate\|pushState` = 0 hits |
| R2 | **Over-taught, front-loaded opening.** ~10–12 sequential reading surfaces and 5 mandatory facility stops before the first battle; 13 of ~17 facilities debut in Cities 0–2; advanced systems (Relics, Hidden Power, IVs) are forced before fundamentals (EVs wait until City 7). NG+ replays the entire forced tour. | `FACILITY_DEBUT_CITY` :34258, Leave-City gate :50965, `STORY_TUTORIAL_SCENES` :47795 |
| R3 | **No persistent "you are here" point.** Focus drops to `<body>` on every battle-turn menu swap and every city-hub re-render (which also wipes scroll position); three parallel overlay systems (`.modal`, full screens, DIY fixed divs) with different dismiss rules; two duplicate global Escape handlers close two stacked modals per keypress. | :19690/:21970 (no focus), `renderCityActions` :50617, ISSUE-014, :15996+:16097 |
| R4 | **The battle screen under-communicates and occasionally locks up.** RUN forfeits instantly with no confirm; effectiveness arrows ignore ability immunities (show green ▲, move does nothing); disabled moves give no reason; bench HP / stat stages are hover-tooltip-only (touch players never see them); speed is binary (1 s/line or 10 ms); stuck-turn states are common enough that the code ships a 30 s watchdog + two recovery consoles. | `runAway` :20706, `getMoveEffectiveness` :28878, :21903, :20609, `sleep` :14490, watchdog :24601 |
| R5 | **The visual system exists but isn't enforced.** ~65 good design tokens, one typeface, coherent GBA-dark language — bypassed by 1,347 inline styles, 856 hex colors (487 one-offs), 37 font sizes, 66 button classes, 15 breakpoints. Wayfinding text is the *least* legible text in the game (hardcoded `#666` ≈ 3.4:1, fails WCAG AA). | `:root` :43, contrast sites :47388/:52240 etc. |

**The single most important reframe:** testers are not under-guided — the good guidance systems
(gold objective bar, IntroQueue, defeat card, arrival recaps) already exist and work. They are
**drowned out** by the forced tour, the missing exits, and the focus/overlay chaos. The redesign
is mostly *subtraction and unification*, not new systems.

---

## 1. Evidence base (full findings by audit)

### 1.1 Navigation / information architecture

**Structure is sound where it exists:** quick-play is hub-and-spoke (menu → draft → battle →
end-screen → menu); story is two-level hub-and-spoke (story-menu → city hub → 15 facility
spokes, each returning via `enterCity()`), with sectioned city buttons, Required/New/✓ pills,
and disabled-with-reason gating (`renderCityActions` :50617–51330). The gaps are all at the
*edges* of the graph:

1. **Story has no non-destructive exit.** City HUD offers Collection / **Abandon** (destructive)
   / Run Info / ? / gear (:9832–9838). `returnToHome()` (:17502) during a run returns to the
   city, not the menu; mid-battle it forfeits **as a loss**. There is no "save & quit to menu"
   anywhere. Since the game auto-saves, this is pure UI absence.
2. **"Forfeit & Exit" is one button with four meanings** (:9605, bottom of the Settings modal,
   below a Developer `<details>`): cancel-draft, quit-quickplay, quit-gauntlet
   (auto-submits the leaderboard!), story-forfeit-as-loss. Wrong label for three of them.
3. **screen-draft has no cancel** (:9473–9500) — entering Gauntlet / Local PvP / draft-mode
   Quick Battle is a one-way door except via (2). The online waiting overlay (:9487) has no
   Cancel either.
4. **The Crucible has no exit at all** — the header back slot is an empty spacer (:10061),
   `_renderCrucible` (:59468) renders zero back/leave buttons. Combined with (1), the post-game
   hub is an inescapable room.
5. **"← Back to City" lies in the post-game** — all 13 facility backs call `enterCity()`, which
   silently redirects to the Crucible when `sm.atCrucible` (:50483). Only the Frontier's label
   was corrected (:10076).
6. **Zero browser-history integration** — no `popstate`/`pushState`/`beforeunload` anywhere.
   Browser/gesture Back = instant app exit, losing quickplay/draft/battle state, no guard.
   On mobile PWA this is the #1 accidental-exit trigger.
7. **Two duplicate global Escape handlers** (`__pbsGlobalEscBound` :15996, `_modalEscapeBound`
   :16097; a third summary-specific at :21106) — neither stops propagation, so one Escape
   closes **two** stacked modals.
8. **Three back-button vocabularies:** facilities = icon "←" top-left + "← Back to City"
   footer; trainercreate/collection = "← Back" top-left only; story-menu = a stacked
   "← Back to Main Menu" item; tester = "← Main menu"; quickplay = none. Professor and
   Crucible/catch break the facility pattern.
9. **Three overlay grammars for peer content:** Bag/Party = `.modal`s; Journal / Daycare /
   Fight Club = hand-rolled `position:fixed` divs outside the modal system (Escape-immune,
   raw z-index 9990–9995, exits flavor-labelled "⚰ CRAWL HOME"); everything else = full
   screens. Extends ledger ISSUE-014 (~12 presentation paths).
10. **Home screen order buries play buttons under configuration** — hero → Battle Options
    toggle + dense panel (:9364–9435: 9 gen + 4 grade checkboxes, 4 gimmick toggles, 4 more
    toggles, 2 selects, party-size select) → *then* the 6-tile mode grid (:9436+). The
    "Leaderboard" tile is a modal masquerading as a mode.

### 1.2 Story onboarding & pacing

**First-session walkthrough (friction in bold):**
menu → story menu (**tagline renders a literal `\'`**, :9797) → trainer create (good defaults;
**difficulty copy is jargon** — "pay +60%", "semi-Kaizo", :10449–10467) → City-0 cold open
(good) → **five forced facility stops** (Professor, Mart, Move Tutor, Relics, Bag — Leave-City
gate :50965–50981, `FACILITY_DEBUT_CITY` :34258) each with a 2–4-paragraph monologue → rival
cold open → Oak battle tutorial → VS screen → **first battle ≈ a dozen reading surfaces deep**
→ excellent scripted catch tutorial (guaranteed catch, :48313) → **Camp appears unannounced**
(:57212) → **Hidden Power Mentor fires before Gym 1** (:50519) → City 1 = **five more forced
stops** (natures, PC, held items/abilities, party, **IVs + vitamins**) → City 2 arrival chains
two tutorial scenes *before the hub renders* (:50583) plus four more debut facilities.

**Key structural findings:**
- **Relics is the heaviest early decision** (a permanent both-sides rule for the whole run)
  and the **only facility with no tutorial scene** (no entry in `STORY_TUTORIAL_SCENES`
  :47795; only teaching is the shop header :10321) — yet it's forced at City 0.
- **Stat-system teaching is out of order:** Hidden Power (route 0→1) and IVs (City 1) precede
  EVs (City 7) by six cities.
- **The teaching channel is clobberable:** alert-walls go through `showGameAlert` (:16069),
  a single shared modal with no queue; the code itself documents the clobber hazard (:53684).
  The `IntroQueue` (:50055) already solved sequencing — alerts just don't use it.
- **NG+ replays everything:** `sm.facilityIntros` / `sm.scenesShown` are per-run (:42697,
  :47454); run-2 players re-sit ~20 monologues and every Leave-City gate. A comment at
  :41880 claims tips are once-per-player; the code is once-per-run — one of them is wrong.
- **Already excellent, must preserve:** the gold objective bar (:51222 — single derived
  "what next" with deep links), the catch tutorial, IntroQueue's dedupe/dismiss/focus
  handling, welcome vouchers (every lecture ends with a hands-on gift), the defeat card
  (:58077 — names the killer, recap, three recovery paths, seed copy), "Previously…" session
  recap (:41389), and the hidden-until-first-beat track reveal (:34305). **The opening should
  look more like the mid-game, not the other way around.**

### 1.3 Battle UI clarity

- **RUN forfeits instantly** — one click/keypress (`R` is a global shortcut), no confirm
  (`runAway` :20706); in Story it's a loss + gold slice, in Gauntlet it ends the entire run.
  (Gauntlet surrender elsewhere *does* confirm, :59644.)
- **Stuck-UI states are endemic by the code's own admission:** 30 s lock watchdog (:24601),
  `__forceBattleContinue` (:24409), `__recoverBattleSoftLock` (:24545), comments naming the
  player symptom ("click KO move → nothing happens → frozen", :23917). Worst live case: the
  `playTurn` `isLocked` early-return (:23858) leaves the player menu-less for up to 30 s.
  Root cause: turn/UI state smeared across `isLocked` + `pendingEoT` + hidden-classes +
  `_storyBagPassAfterItem` — the watchdog treats symptoms.
- **The effectiveness hint lies:** `getMoveEffectiveness` (:28878) is type-chart-only —
  Earthquake vs Levitate shows green ▲, then does nothing, unexplained.
- **12 different disable causes render identically** as 0.25-opacity with no reason label
  (:21903–21925). Locked-move/recharge turns auto-submit on a 600–700 ms timer (:21803,
  :22135) — reads as "the game moved without me".
- **Touch players are information-starved:** bench HP/status (:20609), stat-stage detail
  (:20666), and name-hover stat sheets are `title`/hover-only (ledger ISSUE-058 family);
  type badges truncate to 4 chars ("Figh/Psyc", :21781); mobile log collapses to a 2–5-line
  peek with a 9 px hint exactly when the result line matters (:7973–7976).
- **Speed is binary:** `sleep` (:14490) = 1000 ms or 10 ms via `settings.animations`; ~139
  hard-coded `await sleep(1000)` lines; `gimmickAnimSpeed` (:12950) covers only 4 animations.
- **Missing entirely:** turn counter (a 200-turn draw rule exists at :24008 that players
  can't anticipate), damage numbers, whose-turn banner for hot-seat PvP, sleep/freeze turn
  hints. `#weather-indicator` (:10557) is a dead element.

### 1.4 Visual design system

Language is coherent (single Press-Start-2P face, GBA-dark palette, tokenized narration
layer, 26 reduced-motion blocks, transitions clustering on .12/.15 s). Enforcement is not:

| Metric | Value |
|---|---|
| Inline `style="` attributes | **1,347** (≈400 in static screen markup :9000–11000; hotspots `enterCamp` ~:56000, `evoLabEvolve` ~:64000, egg flow ~:52000) |
| Distinct hex colors | **856** (487 one-offs; two competing golds `--accent #ffd54f` vs `#ffd700`) |
| Distinct px font sizes | **37** (incl. half-pixels) + 26 clamp/em; ~46 `font-size … !important` |
| Button classes | **66** across ≥8 parallel families |
| `--radius-*` adoption | ~3 uses vs ~450 raw `border-radius` |
| Width breakpoints | **15** distinct |
| z-index values | 37 distinct; raw 8000/9999/99999 beside the `--sn-z-*` pyramid |

Prior work: `UI_VISUAL_SYSTEM_AUDIT.md` already shipped stages 2a–2d and left an explicit
deferred backlog (⚙→SVG, button-family consolidation, daycare overlay→screen, card DRY).
**Resume that backlog; don't restart the audit.**

### 1.5 Accessibility (and where it doubles as everyone's UX)

Strong baseline to preserve: global `:focus-visible` ring (:85), modal focus trap + restore +
ESC (:16028/:15984/:16041), `showScreen` focus delivery (:65304), documented battle shortcuts
(:16780 + `data-shortcut` chips), reduced-motion catch-all (:8013), HP never color-only,
toast host `aria-live` (:9339). Residual gaps:

1. **[hurts everyone] No focus management in the battle turn loop** — menu swaps at :19690 /
   :21970 / :21963 never call `.focus()`; focus silently falls to `<body>` every turn. Only 15
   `.focus()` calls exist in 61k lines and none is in the loop.
2. **[hurts everyone] City-hub re-renders wipe focus + scroll** — `renderCityActions` (:50617)
   innerHTML-rebuilds the whole action column mid-screen (re-invoked at :52064, :53327).
3. **[hurts everyone] DIY overlays have no Tab containment** — the story-tutorial overlay
   (:48053) does dialog/ESC/focus right but Tab walks into the live screen behind it; its
   global Enter handler (:48088) dismisses even when focus is on a background control.
4. **[hurts everyone] Wayfinding text fails contrast** — hardcoded `#666` ≈ 3.4:1 on the empty
   -state/hint strings (:47388, :52240, :52242, :21444…); `#777` ≈ 4.4:1 (:7894); disabled
   text is also `#666` (:53525) so disabled vs muted-enabled is indistinguishable. The token
   `--text-muted #9aa0aa` (≈7:1) exists and is simply bypassed.
5. Sub-44 px touch targets on the *information* affordances (`.hover-text` 28 px :441,
   `.sum-mode-btn` 36 px :600, mobile `.icon-btn` 36 px :419).
6. [a11y-only] Tooltip content has zero keyboard path (:16728, :19200, :21527); screen-region
   `aria-label`s are machine fragments ("story evtrainer"); the mobile log-peek expander is a
   bare div click handler (:10767).

### 1.6 External research (what best practice actually says)

Full sourced brief lives in the investigation transcript; the load-bearing principles:

- **Teach in context, by doing; never punish during learning** (Hodent, GDC 2016 — strong
  evidence). Rank mechanics against the game's pillars; teach at minimum depth, in order.
- **The first-session funnel leaks hardest at the tutorial** (GameAnalytics telemetry: ~30%
  tutorial completion is common; first meaningful action should land inside ~60 s).
- **The 3-click rule is false** (NN/g): players abandon when a click doesn't visibly advance
  them, not at click #3. Fix *scent* (titles, labelled backs, breadcrumbs), not depth.
- **One primary action per screenful** (conversion-consistent); modals only for single-step
  focused decisions, never nested, never auto-opened on arrival (NN/g).
- **Progressive disclosure measurably improves learnability and error rate** (NN/g). One
  objective at a time in a persistent location; markers for *where*, journal for *why*.
- **Hick's law:** the Battle Options panel is a textbook violation for newcomers — default
  everything, preset-ify ("Casual / Standard / Custom"), collapse the rest.
- **Showdown is a warning, not a model** (expert-first clutter tolerated by pre-committed
  users); **Slay the Spire is the model** — externalize hidden state (intents ≈ effectiveness
  badges/status explanations) instead of writing tutorials.
- **Pokémon mainline gets staging right and delivery wrong** — keep badge-staged unlocks,
  make each teaching beat one skippable line. Badge-gated obedience = progressive disclosure
  enforced by mechanics; with a flat-Lv50 curve, **gate systems, not levels**.
- **Dark-UI specifics** (WCAG + NN/g): ≥4.5:1 body text, desaturate accents that vibrate,
  more whitespace — dense dark UIs read as "confusing" via saturation/spacing before layout.
- **Touch:** 44 pt/48 dp targets, ≥8 px gaps (platform standards).
- **PWA arrivals are zero-commitment:** playable in one or two taps, no settings wall;
  defer the install prompt to a post-victory high (web.dev guidance).
- Treat as *hypotheses*, not requirements: 30–90 s reward-cadence numbers, "minimal guidance
  = engagement", specific unlock-day schedules.

---

## 2. The redesign — proposals by theme, ranked by leverage

Legend: **[BP]** = behavior-preserving (direction-approval only per CLAUDE.md) ·
**[SIGN-OFF]** = game-behavior/flow change, needs explicit maintainer approval ·
**[NUM]** = touches maintainer-owned numbers/schedules.
Effort: S (≤half day) / M (1–2 days) / L (multi-day).

### Theme A — Escape hatches & wayfinding (fixes R1; highest leverage per effort)

| ID | Proposal | Effort | Gate |
|---|---|---|---|
| A1 | **"Save & Quit to Menu" in the story city HUD** (and Crucible). The run auto-saves; this is a button + `showMenu()` call. Relabel "Abandon" → "Delete Run" and move it into Run Info to de-fang the destructive action. | S | [SIGN-OFF] (flow) |
| A2 | **Split "Forfeit & Exit" into per-context actions with honest labels:** draft → "Cancel Draft"; quickplay/gauntlet battle → "Forfeit Battle" (confirm, states consequences: gauntlet ends run + submits score); story battle → "Forfeit (counts as a loss)" confirm. Move out from under the Developer block. | S–M | [SIGN-OFF] |
| A3 | **Cancel/back on screen-draft header + Cancel on the online waiting overlay** (host can already share the code; cancel deletes the room). | S | [SIGN-OFF] |
| A4 | **Crucible header back button** ("← Story Menu" or A1's Save & Quit) in the empty spacer slot (:10061). | S | [SIGN-OFF] |
| A5 | **Context-aware back labels:** facility footer/header backs read "← Back to City" or "← Back to The Crucible" from `sm.atCrucible` — one helper, 13 call sites. | S | [BP-ish] (label only) |
| A6 | **Minimal browser-history integration:** push one history entry per logical screen; `popstate` routes through `showScreen`/`enterCity`; `beforeunload` guard only during an active battle/draft. This makes phone back-gestures navigate instead of exit. | M | [SIGN-OFF] |
| A7 | **Unify Escape:** delete one of the two duplicate global handlers, keep the `data-no-escape` opt-out, ensure one Escape = one layer. | S | [BP] |
| A8 | **One back-button grammar everywhere:** icon "←" top-left (44 px) + labelled footer back on scrolling screens; Professor gets the missing footer back; tester/collection/trainercreate adopt the same classes. | S–M | [BP-ish] |

### Theme B — Onboarding & pacing (fixes R2)

| ID | Proposal | Effort | Gate |
|---|---|---|---|
| B1 | **Cut the City-0 Leave-City gate to Professor + Mart.** Move Tutor, Relics, Bag become lazy intros — their existing scenes fire on first *voluntary* open (the scene system already supports this; only the gate forces the tour). City 1 required set: Pokémon Center + Gym only; Nature/Dojo/FanClub → lazy. City 2: drop the two pre-hub chained scenes; all four debuts lazy. | M | [SIGN-OFF][NUM] (`FACILITY_DEBUT_CITY` schedule is maintainer-owned) |
| B2 | **Defer the advanced-stat trio:** Relics debut → City 3+ (or keep C0 but *optional* + give it the tutorial scene it uniquely lacks); Hidden Power Mentor → post-Gym-2; Fan Club IV/vitamin lecture → after EV Trainer exists, or move EV teaching earlier. Principle: fundamentals before exotica. | S–M | [SIGN-OFF][NUM] |
| B3 | **Route all teaching through IntroQueue** — retire direct `showGameAlert` walls for tutorials (`welcome`, `what-is-a-gym`, `prof-overview-v3`, voucher grants) so nothing clobbers (:53684's own warning). One queue, one dismiss grammar. | M | [BP-ish] (ordering visible) |
| B4 | **Trim every tutorial scene to ≤2 short paragraphs + one action** (ISSUE-142). The voucher gift *is* the lesson — keep it, cut prose. Add "Skip intro" affordance on scenes. | M | [SIGN-OFF] (dialogue content) |
| B5 | **NG+ fast-track:** persist a `profile.seenIntros` set (outside `sm`) — run 2+ still gets vouchers but skips monologues and Leave-City gates; a "Replay tutorials" toggle in settings for those who want them. Fix the :41880 comment/behavior contradiction as part of this. | M | [SIGN-OFF] |
| B6 | **Rewrite difficulty-card copy in player language** ("Foes hit ~30% softer · best prices" instead of "pay +60%"; explain or drop "Kaizo" at first-run). | S | [SIGN-OFF] (copy) |
| B7 | **Fix the `\'` literal in the story-menu tagline** (:9797). | S | [BP] |
| B8 | **Instrument the funnel locally** (localStorage counters: load → mode chosen → first battle → first turn → first win; no backend needed) so pacing changes are measurable against the tester complaint. | S | [BP] |

### Theme C — Battle-screen clarity & trust (fixes R4)

| ID | Proposal | Effort | Gate |
|---|---|---|---|
| C1 | **Confirm on RUN** (`showGameConfirm`) stating the consequence per mode; keep double-press-R as power-user bypass. | S | [SIGN-OFF] |
| C2 | **Restore the command menu in the `playTurn` locked-guard** (:23858) instead of leaving the player menu-less for the watchdog. Longer term: collapse `isLocked`/`pendingEoT`/class-toggles into one turn-phase enum so the watchdog/recovery consoles become dead code. | S / L | [BP] / [SIGN-OFF] |
| C3 | **Ability-aware effectiveness hint** — fold *revealed* foe-ability immunities into the arrow, or suffix the tooltip "(type only)". Never show a plain green ▲ into a known immunity. | M | [SIGN-OFF] (info-reveal semantics) |
| C4 | **Disabled-move reason tag** — the disable site already knows which of the 12 causes applies (:21903); render it in the tile meta ("Taunted", "Choice-locked", "No PP"). | S–M | [BP-ish] |
| C5 | **Battle-speed setting** (1×/2×/instant) as a multiplier inside the single `sleep` helper (:14490) + fold `gimmickAnimSpeed` into it. | S | [SIGN-OFF] |
| C6 | **Touch parity for state info:** mini HP bars inside party balls; tap on stat-stage badge / bench ball opens the existing summary; un-truncate type names on ≥arena layouts; make the log-peek expander a real button (`role`, `tabindex`, `aria-expanded`, visible chevron). | M | [SIGN-OFF] (visual) |
| C7 | **Turn counter + hot-seat "Player 2's turn" persistent banner**; surface the 200-turn draw rule when near. Remove dead `#weather-indicator`. | S | [SIGN-OFF] |
| C8 | **Locked-move/recharge turns:** replace the 600–700 ms auto-fire with an explicit one-button "Continue (Outrage)" tile so the game never appears to move by itself. | S–M | [SIGN-OFF] |

### Theme D — Home screen & first 60 seconds (fixes R1/R2 at the front door)

| ID | Proposal | Effort | Gate |
|---|---|---|---|
| D1 | **One primary action.** Returning player: "▶ Continue — <TrainerName>, City N" as the hero (deep-link via existing save); new player: Story hero + a "⚡ Jump In" quick-battle that starts instantly with smart defaults. Mode grid demoted visually to a secondary tier; Leaderboard restyled as a link, not a mode tile. | M | [SIGN-OFF] |
| D2 | **Preset-ify Battle Options:** "Casual / Standard / Competitive / Custom…" chips; the current 20-control panel becomes the Custom drawer. Persist as today (`settings.*`). | M | [SIGN-OFF] |
| D3 | **Defer the PWA install nudge** to post-first-win / post-badge moment (web.dev pattern); keep the quiet menu entry. | S | [SIGN-OFF] |

### Theme E — Overlay/focus unification (fixes R3; mostly plumbing)

| ID | Proposal | Effort | Gate |
|---|---|---|---|
| E1 | **One overlay contract.** Migrate the DIY fixed divs (Journal :41339, Daycare :52213, Fight Club :52613, arrival/cold-open/HoF as feasible) onto the `.modal` system (or a shared `openOverlay()` that provides scrim, Tab trap, Escape, focus restore, z-token). Resumes ledger ISSUE-014 and the UI_VISUAL_SYSTEM_AUDIT deferred item. | L | [BP-ish] |
| E2 | **Focus continuity in the turn loop:** after each menu swap/re-show, `.focus()` the first enabled command/move button (mirrors `showScreen`'s own rationale, :65307). | S | [BP] |
| E3 | **Preserve focus + scroll across `renderCityActions` re-renders** (remember `activeElement.id` + `scrollTop`, restore after rebuild) — also fixes the PC variant already ledgered as ISSUE-011. | S–M | [BP] |
| E4 | **Tab containment + scoped Enter for the story-tutorial overlay** (:48053, :48088). | S | [BP] |
| E5 | **Human names for screen `aria-label`s** ("Pokémon Center", not "story pokemoncenter") — 26 strings. | S | [BP] |

### Theme F — Visual system enforcement (fixes R5; "cleaner, efficient, elegant")

Resume the `UI_VISUAL_SYSTEM_AUDIT.md` deferred backlog plus the audit's new metrics:

| ID | Proposal | Effort | Gate |
|---|---|---|---|
| F1 | **Type scale:** 37 px sizes → ~9-step `--fs-*` ramp; delete half-pixel sizes and the ~46 `!important`s. | M | [BP] |
| F2 | **Contrast sweep:** replace hardcoded `#666`/`#777` hint text with `--text-muted` (#9aa0aa, ≈7:1); give disabled state a distinct treatment (opacity + italic) so muted ≠ disabled. *The wayfinding strings become the most readable text, not the least.* | S | [BP-ish] |
| F3 | **Gold unification** (`#ffd700` → `--accent`) + sweep the top ~40 hexes into existing semantic tokens; triage only the top-100 one-offs. | M | [SIGN-OFF] (pixels change) |
| F4 | **Button consolidation:** 66 classes → ~4 base families + modifiers (the "2c-deferred" item). | L | [SIGN-OFF] |
| F5 | **Inline-style strip, static screens first:** the ~18 identical `screen-story-*` root inline styles (:9819–10143) → the already-present `.story-screen-root` class; then `enterCamp`/`evoLabEvolve`/egg hotspots. | M | [BP] |
| F6 | **Breakpoint canon:** 15 widths → 4 (e.g. 380/600/768/900), documented beside `--game-design-w`; fold stray z-indexes into `--sn-z-*`; add `--dur-fast/--dur-med` motion tokens (transitions already cluster there). | M | [BP] |
| F7 | **Touch-target sweep** to ≥44 px on info affordances (`.hover-text`, `.sum-mode-btn`, mobile `.icon-btn`) with ≥8 px gaps. | S–M | [SIGN-OFF] (layout) |

---

## 3. What NOT to change (verified good — protect in review)

- The **gold objective bar** (:51222) — authoritative, deep-linking, already advertised. Every
  proposal above routes *through* it; nothing replaces it.
- The **scripted catch tutorial** (:48313) — best-paced beat in the game.
- **IntroQueue** (:50055) — the sequencing/dedupe/dismiss/focus pattern to *generalize*, not rebuild.
- The **defeat card** (:58077) — fail-state legibility is already solved.
- **City hub structure** — sectioned actions, Required/New/✓ pills, disabled-with-reason gating.
- **Welcome-voucher pattern** — every lesson ends with a gift that exercises the mechanic.
- **A11y plumbing:** `:focus-visible` ring, modal trap/restore, `showScreen` focus delivery,
  documented battle shortcuts, reduced-motion coverage, HP-never-color-only.
- The battle **field-condition pill row** (tabbable, tooltipped) and the arena grid layout
  (per `BATTLE_RESPONSIVE_LAYOUT_AUDIT.md` — already rebuilt, do not redo).
- Mid-game progressive disclosure (session recap, arrival bookends, hidden-until-first-beat
  tracks) — the target aesthetic for the *opening*.

---

## 4. Suggested phasing

- **Phase 1 — "Never trapped, never robbed" (S items, ~1 week):** A1–A5, A7, C1, C2-small,
  C5, B6, B7, E2–E4, F2. Kills the two worst tester experiences (no exit; accidental
  forfeit/lock) with almost no balance surface.
- **Phase 2 — "Calm opening" (B-theme):** B1–B5, B8, D1–D3. This is the pacing overhaul;
  needs the `FACILITY_DEBUT_CITY` decision (maintainer-owned) first.
- **Phase 3 — "Readable battles":** C3, C4, C6–C8, E5, A6, A8.
- **Phase 4 — "One design system" (F-theme + E1):** resume the visual backlog; largest but
  lowest-risk (mostly behavior-preserving sweeps with grep-verifiable 1:1 edits).
- Every phase: deterministic jsdom tests for the changed flows (harness:
  `tests/helpers/load-engine.js`), full suite green, no `Math.random()` in anything
  user-visible (use `storyRngNext`), respect the sloppy-mode global rules from CLAUDE.md.

**Measurement:** B8's local funnel counters + a re-test with the same playtest group; success =
time-to-first-battle under ~3 min of *play* (not reading), zero "how do I get out" reports,
and no watchdog firings in normal sessions.

---

## 5. Decisions needed from the maintainer (blocking items)

1. **`FACILITY_DEBUT_CITY` schedule** (B1/B2) — which facilities stay *required* in Cities 0–2
   vs lazy-intro; where Relics debuts. (Also ties into STORY_OVERHAUL_PLAN §6.1.)
2. **Save & Quit semantics** (A1) — plain "quit to menu" (run auto-saves) acceptable? Any
   anti-scum concern mid-battle (recommend: quitting mid-battle still = forfeit, but *labelled*)?
3. **Gauntlet forfeit → leaderboard auto-submit** (A2) — keep or make submission opt-in on quit?
4. **Effectiveness-hint information policy** (C3) — should hints reflect revealed abilities,
   all abilities, or stay type-only-but-labelled?
5. **Battle speed tiers** (C5) — which multipliers (1×/2×/instant?) and default.
6. **Home-screen "Jump In"** (D1) — instant random-team quick battle as the new-player default:
   yes/no.
7. **NG+ skip** (B5) — skip monologues only, or also skip Leave-City gates?
8. **Copy rewrites** (B4/B6) — I can draft all replacement text for batch review, or the
   maintainer writes it; which?
