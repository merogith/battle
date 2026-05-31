# Story Mode Facility Overhaul — Implementation Plan

**Owner of this plan:** general-session (`claude/gallant-keller-ojSWi`)
**Date:** 2026-05-29
**Companion docs:** `agent-state/STORY_FACILITY_AUDIT.md` (findings + deep verification),
`agent-state/ISSUE_LEDGER.md` (282 findings).

This plan turns the 13-facility audit + 6 deep verifications + 3 design/pacing/consistency
dives into a sequenced, testable program. Nothing here is implemented yet — every
game-behavior change needs your sign-off (CLAUDE.md), and timeline/curve items need
pasteur/maxwell hand-off.

---

## 0. Ground rules

- **Scope:** Story mode, normal difficulty. PvP / Quick Play / Frontier excluded.
- **Ownership tags:** `[general]` = engine/UI/hygiene (this session can do). `[pasteur]` =
  timeline/ordering/save-schema (hand-off). `[maxwell]` = curve/balance numbers (hand-off).
- **Sign-off:** behavior-preserving refactors need direction approval before a sweep;
  any behavior change (fatigue, move-overwrite, RNG semantics, balance) needs diff approval.
- **Sustainability:** every fix lands with a jsdom regression test (`tests/helpers/load-engine.js`)
  so the next session can't silently regress it.
- **Sequencing principle:** build the design-system primitives FIRST, then migrate facilities
  onto them, so consistency/a11y/bug fixes ride on shared code instead of being re-applied N times.

---

## PHASE 0 — Design-system foundation `[general]`

*Goal: one set of primitives so every facility is consistent by construction. The system already
exists (`makeActionBtn`, `_costBadge`, `_facOpts`, `showScreen`, `openModal`, toast host); the
problem is selective bypass + missing primitives. Industry baseline: Nielsen consistency &
status visibility, WCAG 2.1 AA, uniform tap-targets/feedback.*

**Step 0.1 — Design tokens.** Promote the scattered per-facility hardcoded title hexes
(`#ce93d8`, `#aed581`, `#00e5ff`, …) and the recurring sub-AA `#888` muted text to CSS custom
properties: `--fac-accent` (per-facility), `--story-text-muted` (≥ `#9a9a9a` for AA at 11px),
`--story-bg-layer`, `--story-badge-*`. Single audit point for contrast.
*Test:* snapshot computed contrast ratios for the muted-text token in a jsdom check.

**Step 0.2 — Shared "transactional row" primitive.** Extract `makeChoiceRow(...)` (or extend
`makeActionBtn`) so the catch ball-buttons (battle.html:49201) and casino controls stop
hand-rolling inline `<button style=...>`. Carries the `cost` / `cant-afford` / `disabled`
tokens uniformly. *Cheap fixes (catch, casino) become one migration.*

**Step 0.3 — Shared empty-state component.** `storyEmptyState(icon, copy, ctaLabel, ctaOnclick)`.
Replace per-facility hand-written empties (professor "Nothing for you today…" 43821, Safari 47786,
"No party mons." 52827/52925, "No team data." 38613) with one voice/format.

**Step 0.4 — Shared resource pill.** One `.story-resource-pill` for gold (collapse the
`.casino-coin-pill` fork into it) + ball counts + vouchers. Add a gold pill to the Professor
screen (currently has none).

**Step 0.5 — Post-action focus & scroll restoration.** A wrapper used by every facility that
rebuilds `innerHTML` after a buy/teach/sell: capture `scrollTop` + a focus anchor before
re-render, restore after. Fixes the WCAG 2.4.3 focus-drop-to-`<body>` and the
scroll-resets-to-top annoyance across ALL facilities at once.

**Step 0.6 — Real modal focus trap.** Add Tab-cycle containment to `openModal` (battle.html:13715);
consolidate the two near-duplicate global ESC handlers (13739 + 13778) into one.

---

## PHASE 1 — Accessibility baseline (WCAG AA) `[general]`

*Most of these collapse onto Phase 0 primitives.*

- **1.1** Add `aria-live="polite"` to the catch outcome region (battle.html:9079 / `_catchRender`
  49155) — catch/flee/wobble/boss-HP currently silent to AT. (Casino already does this right.)
- **1.2** Make PC storage rows keyboard-operable (battle.html:47557/47595/47688/47616) —
  currently mouse-only `<div>`s; "view full build" has no `tabindex`/`role`/keydown.
- **1.3** PC tab strip + Pokédex counter: `role="tab"`/`aria-selected` (not color-only),
  `aria-live` on the seen/caught counter (battle.html:9026/9030).
- **1.4** Casino subtitle contrast (battle.html:~5635): cream `#fff5d0` on light flip/slots
  panels ≈ 1.3:1 → use a dark-on-light token.
- **1.5** Header back-button affordance for catch & crucible (currently `<span>` spacers);
  label icon-only buttons (ball buttons, relic toggle) with the relic/ball name.

---

## PHASE 2 — Cross-facility consistency (pure-text, low-risk) `[general]`

*All pure-copy except where noted; safe for general-session.*

- **2.1 Terminology — "Vitamin" collision.** Rename the EV-cost voucher to **"EV Voucher"**
  (or similar) so it stops colliding with IV `PERM_BOOST_ITEMS` and the casino "Vitamins (+1 IV)".
  (battle.html:32685/9196/59247; the code already flags the clash at 32690.) *Touches item
  display name — confirm no save-key dependency.*
- **2.2 "Relic" vs "Artifact".** Pick one player-facing word; give Relic Annex vs Artifact Hall
  distinct icons so they're not visually identical (battle.html:42922/42963/50172). Internal
  `artifact*` keys can stay (behavior-preserving) or be renamed in a separate refactor.
- **2.3 Grade-badge prefix.** Unify `G#` (professor pick) vs `T#` (swap/daycare) — same value,
  same CSS class, different letter (battle.html:16580/28634/43748/44749).
- **2.4 Cost-badge "+" suffix.** Drop the misleading "+" on flat costs (Nature Rater "2000+",
  battle.html:42956); audit Dojo "500+"/Evolab "1500+" for the same. Reserve "+" for genuinely
  staged costs (Move Tutor).
- **2.5 Button labels.** Give noun-only facility buttons a consistent treatment; fix the
  Evolution facility's 3 names ("Evolution Tutor" / "Evolution Teacher" / "Evolution Master",
  battle.html:42945) to one scheme.
- **2.6 Empty-party copy.** Fold the per-facility variants into one shared string (via 0.3).
- **2.7 Confirm copy.** Standardize destructive-action warnings; **add a move-loss warning to
  Colress Signature-Z** naming the dropped move (the *copy* is safe; the `build.m` overwrite
  logic itself is 2.7b, mechanics-adjacent → sign-off).
- **2.8 Dead code.** Confirm + remove dead CSS `#story-pc-tab-journal-btn` (battle.html:6659).
  (Note: `Cyrus` is NOT dead — retain.)

---

## PHASE 3 — Per-facility bug remediation, general-scope `[general]`

*Root-cause fixes that are squarely engine/UI. Each needs diff sign-off (behavior).*

- **3.1 `sellItem` hardening** (battle.html:52759). Root cause: trusts caller-supplied price,
  exported on `window.StoryMode`. Fix: drop the price param, re-derive `Math.floor(item.price/2)`
  internally from the catalog, mirror the `evResetCharm`/unsellable guards the UI implies; update
  the lone caller (52741). Console-only exploit today, but the correct hardened pattern (`pcSell`)
  already exists. *Test:* `sellItem('pokeBall', 9999999)` credits 150, not 9.999M.
- **3.2 `showGameConfirm` single-flight guard** (battle.html:13763). If `_gameConfirmResolve` is
  already pending, no-op/resolve-false the new call instead of orphaning the first promise.
- **3.3 Interaction-lock consistency pass.** Wrap the facilities that skip
  `_storyTryBeginInteraction` (Shop 49908, Artifact Shop 50164, Artifact Hall 44831, Fan Club
  58769, Colress apply funcs 58296-58389, Stone Shop buy/redeem 50298/50317) so double-submit
  safety doesn't depend on modal z-order. Pairs with 3.2.
- **3.4 Seeded-RNG compliance sweep** (CLAUDE.md mandate). Replace `Math.random()` with
  `storyRngNext()` in: **Casino** (50613 `_randPick`, 50617 `_casinoRollPrize`, 50830, 50954,
  51392 — prize roll writes durable save state), **Daycare/Pits** (43675 hatch, 43967/43970
  roster; remove the dead `seed` at 43887 or actually use it), **Safari** (47803 encounter id,
  49087/49496/49522/49536/49789 flavor), **Evolution** (51907 flavor), **Professor** (45024 flavor).
  *RNG-semantics change → sign-off.* *Test:* same seed → identical casino/hatch/safari sequence.
- **3.5 Colress Sig-Z move-overwrite** (battle.html:58362-58371). Route through the Move-Tutor
  replace-picker (let the player choose which move to drop) instead of silently overwriting slot 3.
  Pairs with the 2.7 warning copy. *Mechanics-adjacent → sign-off.*
- **3.6 Evolution free-evo data gap** (battle.html:51765/51778). Derive stone/trade requirements
  from `species.json` `evoItem`/`evoType` instead of the hardcoded `EVO_STONE_REQ`/`EVO_TRADE_REQ`
  tables (which miss Cloyster, Magnezone, Florges, Weavile, Gliscor, regional forms → they evolve
  free, bypassing the Stone Shop sink). *Data-driven refactor; verify against maxwell's intent.*
- **3.7 Egg-in-slot-0 blank screens** (Evolution 51973, Colress 58022, EV Trainer 59114). Default
  the open index to the first non-egg slot; add an "all eggs" empty-state (via 0.3).
- **3.8 Move-Tutor locked-card clickability** (battle.html:56649/57578). Mirror the item/ability
  card pattern: set `disabled`/`data-disabled` on above-tier move cards, and add the symmetric
  stage check in `tutorChangeMove` to close the cold-cache window.

---

## PHASE 4 — Pacing / flow `[pasteur]` / `[maxwell]` (hand-off)

*Reported for your prioritization; most touch timeline/curve ownership.*

- **4.1 Poké Center fatigue** `[general copy / maxwell behavior]` — DECISION NEEDED (see below).
  Either wire `enterPokemonCenter` (47348) to call `_storyFullHealPartySlots` (behavior), or
  correct the tutorial copy (43463) + Nurse dialogue (39989) to say fatigue clears only on iconic
  fights. Also the City8→League 3-Elite stretch fights at max fatigue (5b) — maxwell call.
- **4.2 Vitamin/EV-voucher debut** `[pasteur/maxwell]` — set `VOUCHER_DEBUT_CITY.vitamin` (45578)
  to 7 to match the EV Trainer's real debut; fix the stale City4 comment; re-check the
  `badges===4` midgame gift (46842).
- **4.3 City2 stone token vs City3 shop** `[pasteur]` — either add `'Stone Shop'` to City2 rows
  (30046/30049) or move `firstStoneSage`/token grant to City3; collapse the redundant double
  stone tutorial (`firstStoneSage` + `firstStoneShop`).
- **4.4 City6 Professor shadow** `[pasteur]` — add `'Professor'` to row 35 literal, OR a boot
  assertion that every pre-gym hub C0–C6 yields a Professor (guards `shouldForceCityProfessor`).
- **4.5 City3 row missing 'Leave City'** `[pasteur]` — cosmetic data fix (row 16, 30052).
- **4.6 Fight Club secret missable (City6-only)** `[pasteur]` — confirm intent; if unintended,
  widen the daycare `[2,4,6]` gate or add a later recovery nudge.
- **4.7 Facility cadence gaps** `[general/maxwell]` — Casino/Safari 4-city island, Relic Annex
  3-city pulses, Colress hidden when mechanics off (D1: also strands the Gym5 reward). Surface
  the Colress facility with an explanation when mechanics are off, or fall back the reward.

---

## PHASE 5 — Verified P1s `[pasteur]` (hand-off, highest correctness impact)

*All three reproduced; all in pasteur's timeline/save-schema domain. May overlap
`claude/peaceful-thompson-7y3Y3`'s boss rework — coordinate.*

- **5.1 Crucible row-id/array-index** (battle.html:~47908). One-line chokepoint:
  `sm.eventIndex = STORY_EVENTS_RAW.findIndex(r => r && r[0] === (id|0))`. Fixes League Run
  (skips E1, ends on Rival), Rival Rematch (opens Hall of Fame), MF rematch (OOB), Gym-3 (bounces).
  Rename the param to `targetRowId` + fix the misleading constants comment (47829).
- **5.2 City-8 legendary gate** (battle.html:42534/42801/44984). Decouple `legendMysteryGate` /
  `_profLegendaryMysteryMode` from `!hasTeamRoom`/`isFull`: fire on
  `_legendaryGateHere && !profUsedHere` regardless of party size; accept handler branches
  room→push vs full→existing swap-to-PC. Add a ≤5-party repro test (the debug seeder always
  fills to 6, which hid this).
- **5.3 Safari reload data-loss** (battle.html:47747-47763). Low-risk: defer
  `freeEntryUsed=true`/charge/`save()` until the first encounter commits. Full fix: persist
  `sm.safari.session` and rehydrate on `continueRun` (mirror the Fight-Club recovery pattern,
  which already works). Add a mid-session reload repro.

---

## Sequencing / dependency graph

```
Phase 0 (primitives) ──┬──► Phase 1 (a11y rides on 0.1/0.5/0.6)
                       ├──► Phase 2 (empty-state uses 0.3; labels independent)
                       └──► Phase 3 (catch/casino migration uses 0.2; focus uses 0.5)

Phase 3 is independent of 4/5 (engine vs timeline) and can land in parallel.
Phase 4 + 5 = pasteur/maxwell hand-off; sequence after their sign-off. 5.1/5.2/5.3
should coordinate with peaceful-thompson to avoid boss-arc merge conflicts.
```

**Recommended landing order (general-session):** 0.1 → 0.5 → 1.1/1.2 → 2.x (text, low-risk,
fast wins) → 0.2/0.3/0.4 → 3.1/3.2/3.3 (safety) → 3.4 (RNG) → 0.6 → remaining 3.x.
Each step = its own commit + regression test; nothing batched across ownership lines.

---

## Testing strategy

- jsdom harness regression per fix (deterministic, seeded).
- New suites: `tests/suites/facility-consistency.test.js` (every facility uses the shared
  scaffold/helpers), `tests/suites/facility-a11y.test.js` (aria-live present, focusable rows),
  `tests/suites/rng-determinism.test.js` (same seed → same casino/hatch/safari), plus targeted
  repros for 3.1, 5.1, 5.2, 5.3.
- Contrast token check in CI (Phase 0.1).

---

## Ownership & sign-off summary

| Phase | Owner | Gate |
|-------|-------|------|
| 0 Design system | general | direction approval (refactor sweep) |
| 1 A11y | general | direction approval |
| 2 Consistency (text) | general | low-risk; spot approval |
| 3 Bug remediation | general | **diff sign-off each** (behavior/RNG) |
| 4 Pacing | pasteur/maxwell | hand-off + user sign-off |
| 5 Verified P1s | pasteur | hand-off + user sign-off; coordinate w/ peaceful-thompson |
