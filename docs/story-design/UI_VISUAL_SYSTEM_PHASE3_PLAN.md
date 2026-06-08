# Story-Mode UI — Phase 3 Plan & Handoff

> **Purpose:** self-contained handoff so a fresh Claude session can pick up the
> story-mode visual-unification work cold. Read `CLAUDE.md` and
> `docs/story-design/UI_VISUAL_SYSTEM_AUDIT.md` first; this doc assumes both.
>
> **Status as of 2026-06-08:** Phase 2 shipped (8 commits) on branch
> `claude/intelligent-mendel-GQKa4`, open as **PR #237**. Branch is clean and
> in sync with origin. Nothing below is started yet.

---

## TL;DR — recommended order

1. **Merge PR #237.** Lock in the shipped Phase 2 wins; don't keep growing an
   already-approved PR. Start Phase 3 on a fresh branch off `main`.
2. **Phase 3A — Daycare visual unification.** Safe, visible, closes Phase 2.
   Presentation-only; **no egg-event / save-flow changes.**
3. **Phase 3B — Card consolidation (test-first).** The architectural payoff.
   Write a DOM-snapshot test **before** the refactor sweep.

Do **not** start 3B's sweep without (a) the snapshot test landed and (b)
maintainer sign-off on the *direction* (CLAUDE.md: refactors need direction
approval; every refactor leaves a deterministic test).

---

## What shipped in Phase 2 (context)

Canonical facility-icon system + category color + chrome cleanup + card type
badges. The pieces a Phase 3 session will reuse:

| Asset | Anchor (symbol — line drifts, grep the symbol) | What it does |
|---|---|---|
| `STORY_ACTION_ICON_URLS` | ~`battle.html:44700` | 30-entry collision-free facility→sprite map |
| `storyFacilityIconHtml(key, {size, cls})` | grep symbol | Single source for facility `<img>`/heart SVG. Pins inline size when `cls` is empty (the 166px fix) |
| `storyFacilityIconSrc(key)` | grep symbol | Resolves a key → sprite URL (for `innerHTML` swaps) |
| `storyHeartIconHtml()` | grep symbol (global) | Fan Club heart SVG |
| `--fac-quest / -recover / -shop / -train / -utility` | `:root` in CSS | 5-hue category palette |
| `.story-screen-head-title.fac-*` | CSS | Binds a facility title to its category hue |
| `icons/story/story_daycare.png` | file | Egg PNG (reproducible via `scripts/gen-daycare-egg.mjs`) |

**Rule of thumb the registry encodes:** a facility's icon = the item it
consumes (Move Tutor→Heart Scale, Nature Rater→Mint, Dojo→Muscle Band,
EV Trainer→Protein, Evo Tutor→Moon Stone, Casino→Amulet Coin, Safari→Safari
Ball, Fight Club→Black Belt). Daycare + Fan Club needed bespoke art.

---

## Guardrails (from CLAUDE.md — non-negotiable)

- **No game-behavior change without explicit sign-off** (damage, status, AI,
  ball math, type chart, RNG, balance numbers, any move/ability). Phase 3A/3B
  are *presentation/refactor* — keep them strictly behavior-preserving.
- **Story flow & saves are sensitive.** The Daycare egg-event flow
  (`dc.eggEventDone`, `_daycareRunSecret`, `sm.daycare`) is save-coupled. **3A
  touches none of it** — chrome/markup only.
- **Seeded RNG only** (`storyRngNext`), never `Math.random()`.
- **Sloppy-mode hazard:** `battle.html` has no `'use strict'`. Never `X =
  fetched` into a loader placeholder — mutate via `Object.assign`/`.push`.
- **Every refactor leaves a deterministic test** (jsdom harness via
  `tests/helpers/load-engine.js`).
- **Out of scope, do not touch:** `online-pvp.js`, Quick Play, Battle
  Frontier/Gauntlet.

---

## Phase 3A — Daycare visual unification  *(recommended first)*

### Why
The Daycare is the **only facility Phase 2 missed**. It renders as a bespoke
fixed overlay with its own green accent (`#aed581`), emoji headers, and inline
chrome — none of the `--fac-*` tokens or the icon registry. Unifying it closes
the "every facility looks like one system" goal. **Low risk: presentation
only.**

### Confirmed bug to fix here
The city-menu Daycare button (`battle.html:~44562`) label is `'🥚 Daycare
Inn'` **and** `makeActionBtn` now renders the registry egg icon → **double
egg**. Strip the emoji from the label (the icon carries it now) — same cleanup
already done for the other facilities in Phase 2.

### Anchors (grep the symbol; lines drift)
- `enterDaycare()` — `~45392` (entry router: endgame / secret / egg-event / idle)
- `_daycareOpenDropOff()` — `~45405` (builds `#story-daycare-overlay`)
- `_daycareRenderHTML()` — `~45419` (the big inline-styled string; `🥚 Daycare Inn` header, `#aed581`)
- `_daycareSlotRow()` — `~45442`
- `_daycareIdleScene()` — `~45517`
- `_daycareRunSecret()` — `~45532`  ← **DO NOT alter logic**
- overlay id: `story-daycare-overlay`; accent: `#aed581`

### Scope (presentation only)
1. **Strip the double-egg** in the city button label (`44562`).
2. **Swap emoji headers → registry icon.** Replace `🥚` in `_daycareRenderHTML`
   (and `_daycareIdleScene`) headers with
   `storyFacilityIconHtml('daycare', {size:18})` or the head-ico class, matching
   how interior titles render in Phase 2.
3. **Adopt a token, retire the magic hue.** Pick the Daycare's category —
   it's pushed under `recover` in the city menu (`_push('recover', ...)` at
   44562), so use `--fac-recover` (green, already `#81c784`). Replace the
   local `#aed581` accent var with `var(--fac-recover)` so it tracks the
   palette. (Keep contrast legible on the dark overlay — verify in browser.)
4. **Reuse shared chrome where the overlay duplicates it** — the header/footer
   gradient pattern Phase 2 standardized. Only where 1:1; the Daycare overlay
   is a centered modal, not a `screen-story-*` panel, so don't force it into
   the panel classes.

### Explicitly OUT of 3A (needs separate sign-off)
- Converting the overlay into a real `screen-story-daycare` panel (touches the
  one-time egg-event entry flow — sensitive). Defer.
- Any change to *when* the drop-off / idle / secret scenes fire.
- Entry SFX (behavior change).

### Acceptance
- Boot clean in jsdom (no parse/runtime errors) and Playwright (0 page errors).
- City Daycare button: one egg, not two.
- Daycare overlay header uses the registry egg icon; green tracks
  `--fac-recover`.
- Drop-off → egg → hatch flow byte-identical (don't exercise it in code; just
  confirm you changed no flow branch). Diff should be markup/CSS only.

---

## Phase 3B — Card consolidation  *(test-first; the architectural win)*

### Why
Five near-duplicate "mon card/row" shapes exist. CLAUDE.md calls this out
directly: *"the 'vibecode' pattern of re-inlining a 3-line block 25 times is
what we are trying to undo."* Collapsing them into **one tile renderer + one
stat-bar renderer** is the highest-leverage remaining cleanup. It is
**invisible to the player by design** — which is exactly why it needs a
snapshot test, not eyeballing.

### The five shapes (grep the symbol/class)
| Shape | Renderer / CSS anchor | Used by |
|---|---|---|
| Tutor collapsed row (**canonical**) | `_txRenderCollapsedMonHtml()` ~`59607` | Move Tutor; closest to the target shape |
| Fan Club card | `_fanClubMonCard()` ~`61469` | Fan Club roster (IV cells + vitamin buttons in expanded body) |
| PC box card | `.pc-card` CSS ~`3040` | PC / box screens |
| Link/trade row | `.story-link-mon` CSS ~`3143` | Link Cable trade |
| Party-review row | `.prr-*` / `#modal-story-party` CSS ~`7799` | Party reorder modal |

`.story-tutor-mon` CSS lives ~`723`. Each card has a **facility-specific
expanded body** (Fan Club = IV grid + vitamins; Link = trade tiers; etc.) —
those bodies stay; only the **collapsed tile + stat bar** unify.

### Sequence (do not skip step 1)
1. **Write the snapshot test first.** New file under `tests/` using the jsdom
   harness (`tests/helpers/load-engine.js`). For a fixed seed + fixed mon,
   render each of the 5 shapes and snapshot the produced HTML (normalize
   whitespace). This is the regression net the refactor rides on.
2. **Get direction sign-off** from the maintainer (one tile + one stat bar;
   target shape = the Tutor collapsed row). CLAUDE.md requires direction
   approval before a sweep.
3. **Extract `storyMonTile(mon, opts)`** from `_txRenderCollapsedMonHtml` (name
   + sprite + type badges via `baseStats[name].t1/.t2` + the collapsed meta
   row). One renderer, options for the per-facility trimmings.
4. **Extract `storyStatBar(...)`** — one stat-bar renderer (PC/Fan Club/party
   each hand-roll their own today).
5. **Migrate one caller at a time**, re-running the snapshot after each. Land
   each migration as its own commit so a regression bisects cleanly.
6. **Reconcile CSS last** — fold `.pc-card`/`.story-link-mon`/`.prr-*`/
   `.story-tutor-mon` into the shared tile class only where computed styles
   match; keep facility-specific overrides scoped.

### Acceptance
- Snapshot test green before and after (the diff *is* the proof of 1:1).
- jsdom + Playwright boot clean.
- No change to expanded bodies (IV grid, vitamins, trade tiers).

---

## Deferred / out-of-scope (with reasons)

| Item | Status | Reason |
|---|---|---|
| `.type-badge` double rule (base `3596` `border-radius:3px` vs `7958` `border-radius:0 !important`) | **Deferred — coupled to battle** | The `!important` at 7958 squares *all* badges, incl. the battle move-tile badge (`4009`, `border-radius:4px`). Un-squaring story badges would also restyle battle tiles → out-of-scope battle visual. Needs a scoped selector, not a global edit. |
| Daycare overlay → real `screen-story-daycare` | **Deferred — save-sensitive** | Touches the one-time egg-event entry flow. 3A does the *visual* part safely; the structural conversion is a separate, sign-off-gated task. |
| Universal facility entry SFX | **Deferred — behavior** | Audio-on-enter is a behavior change; needs sign-off. |
| Settings `⚙` → inline SVG | **Deferred — low value** | `story-hud-settings`/`battle-settings-btn` are 40×40; transition not scoped; cosmetic. |

---

## Start-here quickstart (fresh session)

```bash
# 1. fresh branch off main AFTER #237 merges
git checkout main && git pull origin main
git checkout -b claude/<new-branch>

# 2. confirm the monolith still boots headlessly (~2.5s first run, cached after)
node tests/helpers/load-engine.js   # or the harness entry the repo uses

# 3. find any anchor (lines drift; symbols don't)
grep -nE 'storyFacilityIconHtml|_daycareRenderHTML|_txRenderCollapsedMonHtml|_fanClubMonCard' battle.html
```

- **Visual verification:** Playwright + Chromium at `/opt/pw-browsers`. Drive to
  the city menu → facility to screenshot; assert `page.on('pageerror')` stays
  empty.
- **Icon-size sanity** (the 166px class of bug): measure rendered `<img>`
  `getBoundingClientRect()` — facility icons should be ~22–24px, never >40px.
- **Helpers to reuse, never re-inline:** `storyFacilityIconHtml`,
  `storyFacilityIconSrc`, `storyHeartIconHtml`, the `--fac-*` tokens,
  `baseStats[name].t1/.t2` for cheap type badges (do **not** call
  `buildPokemon()` just for a type badge).

---

## One-paragraph brief to paste into a new chat

> Continue the story-mode UI visual-unification work in `battle.html`. Phase 2
> (facility icon registry, `--fac-*` color palette, chrome cleanup, card type
> badges) shipped as PR #237 — merge it first. Then do **Phase 3A: Daycare
> visual unification** (presentation only — swap emoji→registry egg icon, fix
> the double-egg on the city button at ~44562, adopt `--fac-recover` in place
> of the bespoke `#aed581`; touch **no** egg-event/save flow). After that,
> **Phase 3B: card consolidation** — but write a jsdom DOM-snapshot test for
> the 5 card shapes (`_txRenderCollapsedMonHtml`, `_fanClubMonCard`, `.pc-card`,
> `.story-link-mon`, `.prr-*`) and get direction sign-off **before** the
> refactor sweep. Full plan: `docs/story-design/UI_VISUAL_SYSTEM_PHASE3_PLAN.md`.
> Guardrails in CLAUDE.md apply.
