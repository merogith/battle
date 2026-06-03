# Battle Screen Responsiveness — Phase 0 Audit & Phase 1 Recommendation

> Scope: the `#screen-battle` layout in `battle.html`. Story-mode normal difficulty is the
> active product scope; this audit is UI/layout only. **No code is changed by this document.**
> Line numbers reference `battle.html` at the time of writing (drift-tolerant — search the
> quoted selector if a number has moved).

---

## TL;DR

The battle screen does **not** have one responsive layout. It has **four hard-coded layout
"modes"** selected by **eight overlapping mechanisms** whose thresholds do not agree. The
symptom the brief reports — "a different layout per viewport" — is mostly the **tablet gap**:
a JavaScript attribute picks a layout, but the CSS that *finishes* that layout is gated behind
`@media` thresholds (`≤768px`, `≤500px height`, `≤900px`, `≤1366px`) that tablets and large
iPads fall *between*. The result is a half-applied layout — the skeleton of one mode with the
details of another, or of none.

Three structural problems drive every inconsistency in the brief's table:

1. **Two sources of truth.** Layout is chosen *both* by the JS `data-battle-layout` attribute
   *and* independently by raw `@media (max-width…)` rules — with different breakpoints.
2. **An input/UA fork.** The same `data-battle-layout="landscape-touch"` renders two different
   ways depending on `body.is-mobile`, and `is-mobile` is itself viewport+UA+input-dependent.
3. **Dead and duplicated layout code.** A whole `ultrawide` mode (44 CSS rules) is never
   activated; the phone-landscape overlay is copy-pasted into two near-identical media blocks
   with tweaked constants, and a third band falls through both.

---

# PHASE 0 — Investigation

## 0.1 — Layout-logic map: the eight mechanisms that decide what you see

| # | Mechanism | Set where | Trigger / threshold | What it controls | Re-runs on resize? |
|---|-----------|-----------|---------------------|------------------|--------------------|
| 1 | `body.is-mobile` class | `applyDisplayMode()` L11861-11868; initial L9899-9903 | `displayMode` setting, else `_computeAutoIsMobile()` (L9884): UA regex **or** `maxTouchPoints>1 && MacIntel` **or** `(hover:none) and (pointer:coarse)` **or** `coarse && ≤1024px` **or** `innerWidth ≤ 900` | Master fork between desktop-frame and touch layouts; forks dozens of rules | ✅ (L10040) |
| 2 | `#screen-battle[data-battle-layout]` | `applyBattleLayoutMode()` L9910-9930 (set L9921) | `usePhoneBattleLayout = is-mobile \|\| innerWidth≤900 \|\| (landscape && innerHeight≤500)`; then `desktop` / `portrait` / `landscape-touch` | The primary skeleton (sprite sizes, HUD positions, log direction) | ✅ (L10035, L10056, L11866) |
| 3 | `body.layout-tablet-preset` | `applyLayoutPresetClasses()` L9904-9908 | `(min-width:700px) and (max-width:1100px)` | Additive sprite/UI sizing "bridge" over modes 2 (L4068-4086) | ✅ (L10034) |
| 4 | `#screen-battle.battle-log-dock` | `applyBattleLogDockClass()` L14168-14174 | `settings.battleLogDock && innerWidth≥768 && innerHeight≥560` | Re-docks the battle log to the side (L3704-3709) | ✅ (L14175) |
| 5 | `#screen-battle[data-party-size]` | `applyBattleLayoutMode()` L9922-9927 | party size 1–6 (content, not viewport) | 6v6 party-ball wrapping in tight cards — *legitimate content modifier* | ✅ |
| 6 | Desktop transform-scale | `applyDesktopGameScale()` L14095-14125 | not `is-mobile`; `scale = min(vw/1280, vh/720, 3)` | Scales the **fixed 1280×720 design frame** to fill the window | ✅ (L10036) |
| 7 | Raw `@media` battle rules | throughout CSS | `768/720/600/520/500/480/380/360/340px`, `orientation`, `hover/pointer`, height bands | Restyles the *same* elements modes 1-2 already styled — independently | n/a (CSS) |
| 8 | `body:not(.is-mobile)` vs `body.is-mobile` forks | throughout CSS | the `is-mobile` class from #1 | Same attribute → two renderings (esp. `landscape-touch`) | n/a (CSS) |

**Wiring note (redundant work):** on every `resize`, `applyBattleLayoutMode` runs twice — once
directly (L10035) and once inside `applyDisplayMode` (L11866) after `is-mobile` is re-toggled.
The first pass runs with a stale `is-mobile`. Net result converges, but it is wasted layout work.

## 0.2 — The four layout "modes" that actually exist

The doc comment at L25-33 only describes **three**. There are four in the CSS:

| Mode (`data-battle-layout`) | Model | Sizing | Ever set in JS? |
|---|---|---|---|
| `desktop` | **Fixed 1280×720 frame, transform-scaled** to viewport (L6). Absolute-positioned cards overlaid on the arena. | `--sprite-foe-w:188px`, `--sprite-player-w:310px`, `--battle-ui-h:280px` (L3188) | ✅ L9921 |
| `portrait` | **Full-viewport vertical stack.** Foe strip top → arena → bottom chrome (player strip + log + 2×2 grid). | fluid: `min(34vw,138px)` / `min(56vw,224px)`, `--battle-ui-h:clamp(330px,48dvh,410px)` (L3204) | ✅ L9921 |
| `landscape-touch` | **Full-viewport overlay.** HP cards floated into corners over the arena; log + grid in a short bottom bar. | `--battle-ui-h:clamp(180px,42dvh,230px)` (L3210); sprite sizes only set inside media blocks | ✅ L9921 |
| `ultrawide` | Clone of `desktop` with bigger sprites (L3197, +43 more rules) | `--sprite-foe-w:200px` etc. | ❌ **never** — dead code |

**`ultrawide` is dead.** `data-battle-layout` is only ever assigned `desktop`/`portrait`/
`landscape-touch` (single assignment, L9921). All 44 `[data-battle-layout="ultrawide"]` rules
are unreachable. The XL-desktop (4000px) screenshot is rendering as **`desktop`**, scaled by #6
and capped at `scale 3`.

## 0.3 — Element × layout map (where each piece lives, per mode)

| Element | `desktop` | `portrait` | `landscape-touch` (mobile) | `landscape-touch` (non-mobile) |
|---|---|---|---|---|
| **Settings gear** (`.battle-settings-btn`) | top-**left** (L4147) | top-**right** (default L4142) | top-**right** (default) | top-**left** (L4149) |
| **Foe HP card** (`#foe-stat-box`) | floating card **top-right**, 300px (L3341) | full-width **top strip** as part of `.battle-foe-head` flex column (L3453) | overlay **top-right**, ~210px — *but only inside the height-gated media blocks* (L4222, L4377) | floating card **top-right**, 300px (L3343) |
| **Field pills** (`#field-conditions`) | centered row **top-center** (L3525) | row under the foe strip (L3484) | abs top-left (base L3469) | abs top-left (base) |
| **Foe sprite** | back-of-arena, right-of-center, 184px (L3369) | `min(34vw,138px)`, upper area (L3430) | media-gated sizes (L4218, L4373) | base `var(--sprite-foe-w)` |
| **Player sprite** | foreground left, 310px (L3405) | `min(56vw,224px)`, feet tucked into HUD (L3440, L235) | media-gated | base |
| **Player HP card** (`#player-stat-box`) | floating card **bottom-left**, 300px (L3610, L3623) | full-width **strip** in bottom stack (L3600) | `position:fixed` **top-left** (L4239, L4391) | floating card **bottom-left**, 300px (L3625) |
| **Battle log** (`#battle-log`) | **right column** beside actions, `clamp(260px,24vw,340px)` (L3760) | **full-width**, above the grid (`flex-direction:column` L3665, L3693) | small box, bottom area (L271+, media) | right column (L3760) |
| **Action grid** (`#command-menu`) | 2×2, taller buttons `min-height:60px`, **left of log** (L3810, L3887) | 2×2 across the bottom | 2×2, compact | 2×2 |
| **Keyboard hints** (`.battle-cmd-btn::after`) | **shown** — `content: attr(data-shortcut)` (L3889) | hidden | hidden | hidden |

`.battle-foe-head` is `display:contents` by default (L3452) — its children (foe card + field
pills) lay out directly in `#screen-battle`. It only becomes a real flex container (the top
strip) in `portrait` (L3453). That is why the "enemy bar" is a top strip in portrait but a
floating corner card everywhere else.

## 0.4 — Breakpoint map (why the thresholds collide)

Battle-relevant switch points, by axis — **none of them line up**:

- **`is-mobile` / mode selection (JS):** `innerWidth ≤ 900`, `innerHeight ≤ 500` (landscape),
  plus input/UA heuristics.
- **`layout-tablet-preset` (JS):** `700–1100px`.
- **`battle-log-dock` (JS):** `≥768px && ≥560px`.
- **Raw `@media` battle CSS:** `≤768` (portrait refinements L4543; rotate/info L4161/4196),
  `≥768` (log dock L3704), short-landscape overlay `≤500h & ≤900w` (L4214), tablet-landscape
  overlay `600–1366w & 501–900h` (L4367), `≤600`, `≤520`, `≤480`, `≤380`, `≤360`, `≤340`.

Worked example — **iPad portrait (e.g. 820×1180, or 1024×1366):**
- `is-mobile` = **true** (coarse pointer ⇒ `_computeAutoIsMobile`), so `data-battle-layout` =
  **`portrait`**. ✔ skeleton chosen.
- But the **portrait refinements** live in `@media (max-width:768px) and (orientation:portrait)`
  (L4543: HP-bar height, font sizes, gear 36px, safe-area padding). At 820–1024px wide they
  **do not fire**. ✘ details missing.
- `layout-tablet-preset` (700–1100) *does* fire and rewrites sprite/`--battle-ui-h` sizing
  (L4073) — a third opinion on proportions.
- → A portrait stack with **desktop-default font sizes, full-size HP bars, and tablet-preset
  proportions**: visibly unlike phone portrait. This is the brief's "iPad portrait … different
  order/sizing".

Worked example — **iPad landscape:**
- `is-mobile` = true, not portrait ⇒ `data-battle-layout` = **`landscape-touch`**.
- The overlay positioning (foe card top-right, player card `fixed` top-left, sprites tucked)
  exists **only** inside `@media …(max-height:500px)…` (L4214) **and** a near-duplicate
  `@media …(min-height:501px) and (max-height:900px)…` (L4367).
- iPad Air landscape (1180×820, h≤900) → caught by the **second** block. ✔
- iPad Pro 12.9" landscape (1366×1024, **h>900**) → falls through **both** → bare
  `landscape-touch` with **no overlay positioning** → HP cards land wherever the base rules put
  them, log shrinks to a corner. This is the brief's "iPad landscape … log shoved into a small
  box bottom-right."

## 0.5 — Inconsistency catalogue

Mapped to the brief's table, plus what the code review surfaced:

| # | Inconsistency | Affected band | Root cause | Refs |
|---|---|---|---|---|
| C1 | **HP-bar placement changes** (top strip / overlaid corners / floating cards) | all | Foe/player cards positioned per-mode with no shared rule; `.battle-foe-head` switches `display:contents`↔`flex` | L3327, L3341, L3453, L3600, L3623 |
| C2 | **Message-log position/size changes** (right column / full-width / tiny corner) | all | Log direction forks on `is-mobile` (column) vs desktop (row), then again on `battle-log-dock`, then again inside height-gated media blocks | L3665, L3693, L3704, L3760 |
| C3 | **Settings-gear flips** top-right ↔ top-left | desktop & non-mobile-landscape vs rest | Explicit fork to dodge the top-right foe card (L4147-4151) | L4142, L4147 |
| C4 | **Keyboard hints (F/P/B/R) appear only on desktop** | desktop only | `::after{content:attr(data-shortcut)}` gated to `desktop`/`ultrawide` (L3889) — tied to *viewport*, not *input* | L3889 |
| C5 | **Tablet-portrait gap** — portrait skeleton without portrait refinements | iPad portrait 769–1024px | Mode uses `≤900` (or input); refinements use `≤768`; preset uses `700–1100` — three thresholds | L9917, L4543, L4073 |
| C6 | **Tablet-landscape gap** — `landscape-touch` with no overlay | iPad Pro landscape, h>900 | Overlay CSS only exists for `h≤500` and `501≤h≤900`; nothing above | L4214, L4367 |
| C7 | **Same attribute, two renderings** — `landscape-touch` | mobile vs non-mobile short window / forced display mode | `body.is-mobile` vs `body:not(.is-mobile)` fork | L3343, L3612, L4149 |
| C8 | **Dead `ultrawide` mode** — 44 rules never apply | n/a | Attribute never assigned `ultrawide` | L3197 + 43 |
| C9 | **Duplicated landscape overlay** — two near-identical media blocks, tweaked constants | maintenance hazard | Copy-paste instead of one fluid rule | L4214 vs L4367 |
| C10 | **Breakpoint sprawl** — battle elements restyled at ≥10 width thresholds + height bands | all | No breakpoint system; per-symptom `@media` accretion | §0.4 |
| C11 | **Redundant relayout** — `applyBattleLayoutMode` runs twice per resize (stale then fresh) | perf/correctness | Listener bound directly *and* via `applyDisplayMode` | L10035, L11866 |

---

# PHASE 1 — Recommendation: one responsive layout

## The model

Replace the four-mode / eight-mechanism tangle with **one fluid layout** built on **a single
source of truth** and **two reflow templates**:

1. **Single switch.** `data-battle-layout` (mechanism #2) becomes the *only* thing that decides
   structure. Every battle rule keys off the attribute. The raw `@media (max-width…)` battle
   rules (#7) and the `is-mobile` battle forks (#8) are **deleted** — `@media`/JS may *compute*
   the attribute, but must never restyle battle elements directly.

2. **Two templates, not four.**
   - **`arena`** — landscape **and** wide enough (desktop, laptop, tablet-landscape, phone-
     landscape). Both HP cards overlaid in fixed corners on the arena; log + actions in a bottom
     command bar. This merges today's `desktop` + `landscape-touch` (already 80% identical) and
     retires `ultrawide`.
   - **`stack`** — portrait or genuinely narrow. Foe strip top → arena → bottom command bar
     (player strip + log + actions). This is today's `portrait`, generalised to all narrow
     widths so tablets stop falling into a gap.
   - Tablet is **not** a third template — it just picks `arena` or `stack` by orientation+width,
     so there is no separate tablet code to drift (deletes #3 `layout-tablet-preset`).

3. **Fully fluid within each template.** Sizing via `clamp()` + `vw/dvh` + container space, not
   width-stepped `@media`. One template scales smoothly phone→iPad→4K. (One optional `arena`
   max-composition cap keeps pixel-art crisp on huge screens — see Q5.)

4. **Consistent element relationships, everywhere.** Foe = their side, player = your side, log
   and actions always together in one command bar, gear in one fixed corner, affordances
   (keyboard hints) driven by **input capability**, not screen size.

5. **CSS Grid shell.** `#screen-battle` becomes a grid with named areas
   (`arena`, `foe-hud`, `player-hud`, `command-bar`); the two templates are two
   `grid-template-areas`. This replaces ~all the absolute-position-per-mode CSS with two
   declarative maps — far less to keep in sync, and the natural home for "industry-standard,
   clean, consistent."

This is a **behaviour/UX change → requires your sign-off before Phase 2** (per CLAUDE.md). It
touches no battle-engine logic, saves, or balance numbers — CSS + the layout-selection JS only.

## The questionnaire (my recommendation in **bold**)

**Q1 — Breakpoint / template strategy**
- **(A) Two templates (`arena` / `stack`) by orientation+width, one source of truth, fluid
  within each. ✅ Recommended** — kills the tablet gap; least per-device code.
- (B) Three fixed device tiers (phone / tablet / desktop) at hard px widths — simpler to reason
  about but reintroduces tier seams and a tablet tier to maintain.
- (C) Keep many fine-grained breakpoints (status quo) — most flexible, least consistent.

**Q2 — HP-bar placement rule**
- **(A) Side-matched, consistent: foe anchored top-of-its-side, player bottom-of-its-side —
  overlaid corner cards in `arena`, edge strips in `stack`; same *relationship* everywhere.
  ✅ Recommended** — preserves the VGC framing already in the art, maximises arena.
- (B) Classic Pokémon: foe **top-left**, player **bottom-right** everywhere — frees the
  top-right corner for the gear (see Q4) but discards the current side-matched composition.
- (C) Always solid stacked bars (no overlay), foe above arena / player below, all sizes — most
  legible, least "game-like".

**Q3 — Message-log treatment**
- **(A) Always in the bottom command bar: log on one side, actions on the other in `arena`;
  log stacked directly above actions in `stack`. Never a floating corner box. ✅ Recommended.**
- (B) Keep the optional side-dock toggle as a desktop-only enhancement over (A).
- (C) Overlay the log semi-transparent on the arena (saves chrome height, harder to read).

**Q4 — Settings-gear fixed position**
- **(A) Fixed top-right everywhere; place the foe card so it never collides (foe card leads from
  the arena edge, gear floats clear). ✅ Recommended** — top-right is the conventional settings
  corner and matches story screens. *Note: cleanest if Q2≠A, since A puts the foe card top-right;
  if Q2=A I'll inset the gear/foe-card to coexist.*
- (B) Fixed top-left everywhere.
- (C) Keep device-dependent (status quo) — rejected: it's an inconsistency, not a feature.

**Q5 — Keyboard hints (F/P/B/R)**
- **(A) Show by input capability: `@media (hover:hover) and (pointer:fine)` (and/or on first key
  use), regardless of screen size. ✅ Recommended** — a keyboard-equipped tablet gets them; a
  touch 4K kiosk doesn't.
- (B) Desktop-only by viewport (status quo behaviour, just made deliberate).
- (C) Always show.
- (D) Never show.

*(Bonus, low-controversy, will fold into whichever answers you give unless you object: retire the
dead `ultrawide` block (C8) and the duplicated landscape media blocks (C9); fix the double
relayout (C11). These are 1:1 cleanups enabled by the new single-switch model.)*

---

# PHASE 2 — Implementation outline (only after approval)

1. Introduce the Grid shell + two `grid-template-areas` on `#screen-battle`, keyed off
   `data-battle-layout` collapsed to `arena` / `stack`.
2. Migrate each element (gear, foe/player HUD, sprites, field pills, log, action grid, hints)
   to the chosen consistent rule; delete the raw `@media` battle rules, the `is-mobile` battle
   forks, `ultrawide`, `layout-tablet-preset`, and the duplicated landscape blocks as each is
   superseded (grep-verified 1:1 where applicable).
3. Keep the desktop transform-scale (#6) only as far as Q5/Q1 decide (fixed-frame crispness vs
   fluid cap).
4. **Verification** across the brief's matrix — phone portrait/landscape (390×844 / 844×390),
   iPad portrait/landscape (incl. 12.9" 1024×1366), XL desktop (4000px) — by screenshot, plus a
   small deterministic jsdom test asserting `applyBattleLayoutMode()` resolves the right
   template attribute at representative `innerWidth/innerHeight/orientation` inputs (so the next
   session can't silently regress the switch).
5. Stay consistent with the separate **facility/UI icon design-system brief** (special/physical/
   status icons, arrows, gear) — this brief owns layout; that one owns the visual language.
