# UI Polish Master Plan — "Player-Ready" Visual & Accessibility Update

> **Status:** APPROVED (maintainer, 2026-07-08) — see §Decisions. Phase A greenlit in full;
> Phase B type-ramp / badge-ink / 6-button-family consolidation approved with the enforced
> style-budget guard; two flagged product items resolved as "keep as-is". Implementation of
> Phase A begins on this branch.
>
> ### Decisions (maintainer, 2026-07-08)
> | Topic | Decision | Note |
> |---|---|---|
> | Phase A scope | **Do all ~30 fixes** | greenlit as one pass; inline copy/label sign-offs flagged in the diff |
> | Type scale (B3) | **10px floor + 8-step ramp** | smallest text grows; 82% already fits |
> | Type badges (B4) | **Dark ink on the 7 light types** | canonical colors unchanged, only text color |
> | First rival fight | **Keep as-is** | intended difficulty; NOT teaching arrows, NOT softening. The journey "four game-overs" finding is acknowledged and accepted. |
> | Button families (B5) | **Consolidate 94 → 6** | per-screen themes override `--btn-*` vars |
> | Rival banter ±5% | **Keep hidden gamble** | no tell, no first-duel flavor-cap — left unchanged |
> | PC card buttons (A16) | **Stack vertically** on narrow cards | not shortened labels; cards get taller |
> | Style-budget guard (B9) | **Yes — enforce in CI** | committed test fails on new drift |

> **Method (2026-07-08):** 22-agent audit — 9 visual screen-clusters driven in real headless
> Chromium at up to 7 viewports each (desktop 1440×900, laptop 1280×720, tablet 820×1180 ±
> landscape, phone 390×844 / 360×740 / 844×390, touch on/off), a no-harness **new-player
> journey playtest**, a CSS-system census, and a keyboard/screen-reader code audit — followed
> by adversarial verification: every P0/P1 was independently reproduced through the game's
> **real entry paths** and re-measured before it was allowed into this document. Programmatic
> checks (overflow, WCAG contrast, tap targets, font census) were cross-checked against
> screenshots to kill false positives.
> **Succeeds:** `docs/UX_ONBOARDING_REDESIGN_PLAN.md` (shipped 2026-07-04) — this plan IS its
> deferred Phase 4 ("One design system") plus everything the visual verification pass found.
> **Companions:** `docs/story-design/UI_VISUAL_SYSTEM_AUDIT.md` (icons/colors — Phase 2a-2d),
> `docs/story-design/VISUAL_ART_DIRECTION_REVIEW.md` (register/motion — v28),
> `docs/BATTLE_RESPONSIVE_LAYOUT_AUDIT.md` (arena/stack rebuild — confirmed shipped & sound).
> Line numbers are drift-tolerant — grep the quoted selector/symbol if a number has moved.

---

## 0. Executive summary

Six conclusions, ordered by importance:

1. **The redesign work of the last month genuinely landed.** The arena/stack battle rebuild
   killed the old "four layouts, eight mechanisms" mess (verified: one JS switch site, clean
   template per viewport). E5/E3/A7/modal-trap a11y items from the UX plan are shipped and
   verified. Desktop reads as a tidy, confident GBA-dark product. Wayfinding for a new player
   is *strong* — the journey agent never had to hunt for the next action.

2. **What's actually broken is concentrated at three seams**, not spread everywhere:
   **(a) phone-landscape / short viewports** — the player's own HP plate is 100% clipped in
   every landscape battle (P0), the summary modal loses its only close affordance (P0), the
   cold open / defeat screen / Fight Club / catch screens strand content or actions outside
   an unscrollable viewport; **(b) the pixel font meeting fixed-width boxes** — "Withdraw"
   paints into "Release" on every PC card, "Resisted" clips to "Resistec" on every summary
   matchup card, move names shatter into "Sola r…" on small phones, the POKéMON wordmark
   wraps mid-word on every portrait phone; **(c) newer flows that skipped the house
   patterns** — professor starter pick is keyboard-dead (P0 — Story mode cannot be started
   without a pointer), battle bag / Pits / minigames are onclick-div islands, sticky facility
   chrome is translucent so content double-exposes through it.

3. **The design-token system exists on paper but has ~0% adoption, and the codebase is
   drifting backward.** Since the 2026-07-04 census: inline styles 1347→1597, button classes
   66→~94, breakpoint widths 15→18, `font-size !important` 46→59, unique hexes flat at 859
   with 510 occurrences that literally spell out token values by hand (186× raw `#ffd54f` =
   `--accent`). New tokens shipped that PR (`--dur-*`, `--radius-*`, `--text-dim`) have 0-4
   uses each. **A sweep without an enforcement mechanism will decay again within a month.**

4. **A sub-10px text layer sits under the whole game** and is where "changing font sizes /
   unreadable" complaints come from: 98× 9px + 23 half-pixel sizes (blurry with a pixel
   typeface) carrying *real data* — type badges, difficulty descriptions (7.5px on the
   run-defining choice), stats, costs, dex numbers. Paired with white-on-type-color chips at
   2.0-3.1:1 contrast, this is the single largest readability lever.

5. **The two quick-play surfaces are a different styling era.** Draft, gauntlet swap,
   leaderboard, end screen are functional but speak pre-redesign chrome (hard #333 borders,
   bare yellow h2s, classless buttons) next to the story screens' modern card language.

6. **One product-level finding outranks all styling:** the first mandatory story battle
   (rival duel, party of 1) is lose-heavy for naive play — the journey agent lost in 2 moves,
   and a prior naive pass ate **four consecutive DEFEATED screens** within the first minutes.
   The funnel is excellent up to that wall. This is maintainer-owned balance; flagged, not
   prescribed.

**Recommendation in one line:** fix the ~30 verified mechanical breaks first (fast,
behavior-preserving, hugely visible), then run the token/type/button consolidation as ONE
enforced sweep with a style-budget guard test, then port the house interaction patterns onto
the flows that missed them — and decide separately on the first-fight difficulty.

---

## 1. Verified defect register

Everything below was reproduced through real entry paths and re-measured by an independent
verifier agent. Evidence screenshots exist for each (session scratchpad `rig/out/**` —
regenerate any of them with the rig, §6).

### 1.1 P0 — broken, ship-blocking

| # | Screen · viewport | Defect | Root cause anchor |
|---|---|---|---|
| P0-1 | Every battle mode · 844×390 (any `is-mobile` landscape) | **Player's own HP plate is 100% invisible all battle** — laid out at y=167 but its ancestor `.battle-bottom-stack` (y≥234) has `overflow:hidden` in the landscape-touch media block. You fight blind; foe plate renders fine. Found independently by 3 agents. | `battle.html:306-309` (`body.is-mobile #screen-battle .battle-bottom-stack{overflow:hidden}`) clipping `:4384` (arena `#battle-player-hud-row` absolute) |
| P0-2 | `modal-summary` (story) · 844×390 touch | **No touch way to close** — compact-landscape block hides `.sum-close-btn` whenever the reorder row is visible (always, in story), nav header also hidden, backdrop tap doesn't dismiss; only Esc closes. | `battle.html:723` (`.sum-reorder-row:not(.hidden) + .sum-close-btn{display:none}` inside `@media` at `:699`) |
| P0-3 | `screen-story-professor` · all | **Story mode cannot be started keyboard-only** — starter/gift cards are `div` + `onclick`, `tabIndex=-1`, no role; the accept button stays disabled until a card is clicked. The correct pattern already exists on draft cards (`:20232`). | `battle.html:56549/56566` (prof-pick-card creation/onclick) |

### 1.2 P1 — clearly broken visuals / a11y (all CONFIRMED)

**Front door & entry**
- **POKéMON wordmark wraps mid-word ("POKéM / ON")** on every portrait phone — 13vw clamp +
  4px letter-spacing exceeds 390px. `:8887-8895`.
- **Help modal opens scrolled to its own bottom** on phones — `_a11yFocusIntoModal` focuses
  the trailing "Got it!" button without `preventScroll`. `:16756` / `:10007`.
- **Trainer-create custom-gen grid ignores `hidden`** — `.story-create-gen-custom{display:grid}`
  defeats the UA `[hidden]` rule, so the grid is always visible and the active preset chip can
  silently contradict the checkboxes that actually seed the run. One-line fix. `:9128` vs `:49207`.
- **Difficulty-card copy is 7.5-8px** — the run-defining choice has the least readable text on
  the screen, on every viewport including desktop. `:9089`, `:9109`.
- **Trainer-create sticky footer permanently occludes 10 controls** at phone max-scroll
  (Dynamax/Tera/Classic/No-Item toggles) — no bottom spacer for the 94px footer. `:9166`.
- **City-0 cold open strands "Begin →" below an unscrollable fold** at 844×390; only an
  undocumented background tap advances. `:53056`.
- **Defeat screen clips heading above / actions below** an `overflow:hidden` flex-center at
  844×390. `:10626`.

**City hub & facilities**
- **Settings, Help, Run Info unreachable on phones** — `.story-hud-actions` (571px, no wrap,
  `flex-shrink:0`) overflows the 390px hub with `overflow-x:hidden`; verified untappable. `:2596`.
- **Desktop tips rail wraps into an invisible phantom column** — actionable suggestions render
  clipped outside the rail (`flex-wrap` not reset by the column override). `:3523` vs `:3381`.
- **Relic shop overflows ~23px off-screen on phones** — nowrap badge inflates grid min-content;
  Buy buttons and Manage tab clipped. `:64893-64907`, `:10240`, `:3593`.
- **Stone-shop "TRADE ITEM" badge clips off-card/viewport** on tablet/phoneL (same mechanism). `:64962`.
- **Casino coin-flip subtitle + odds line ≈1.3:1** on the gold felt (worst instance of ledger
  ISSUE-026); inactive tabs also sub-AA on the crimson carpet. `:6484`, `:6317`.
- **Tutor move-slot chips regressed to flat type colors** — later `.type-X` rules override the
  documented stripe-only chip design; slot numbers measure **1.01:1** (invisible). `:4329` vs `:1214`.
- **EV-Trainer cost badge overlaps the type badge and clips off-screen on every row** (phone);
  Colress shares it. `:76308`, `:767`.
- **Colress phone header collapses to a ~560px one-word-per-line column.** `:10307`.
- **Fan Club phone header is a text collision** — title renders through the stash label. `:10348-10356`.
- **Facility sticky chrome is translucent** — move cards, chips and BP/PP text read *through*
  the confirm bar / switcher on tutor-family screens; the most "broken-feeling" defect in the
  facility cluster. `:2069`, `:1625`.
- **Professor quote #aaa over the light lab banner** — near-unreadable on all viewports; the
  first NPC voice a player meets. `:10200`.

**PC / party / summary**
- **"Withdraw" paints 29px past its button and under "Release" on every PC card, every
  viewport.** 10px pixel text (~93px) in a 72px `flex:1` button. `:3728`, `:61834`.
- **"Resisted" clips to "Resistec" on every summary Matchups card** — `.sum-cov-label` fixed
  at 70px vs ~80px text. `:660`.

**Battle**
- **Tablet portrait: the log squeezes BAG/RUN into mid-label clipping** whenever it fills —
  content-first height sharing inside the fixed 250px `--battle-ui-h` budget. `:3964`, `:5065`, `:5097`.
- **Compact arena HUD gives names ~60px** — "Marowak" already truncates; identity loses to a
  static "130/130" and 3 balls. `:4049`, `:4115`.
- **Move names shatter on small phones** — `word-break:break-word` + `line-clamp:2` produces
  "Sola r…", "Flam eth…". `:4745-4748`.

**Camp / catch / endgame**
- **Catch & Safari screens hide every action below the fold at 844×390** — Safari shows *no*
  affordance at all (Run footer hidden in safari mode); no scroll cue. `:5513-5518`, `:64090`.
- **Camp sequence-game pads are blank color-only buttons** — no name, no symbol; red/green is
  the classic color-blind confusion pair in a pure color-recall game. `:59614`.
- **Fight Club overlay top is unreachable** — `align-items:center` + `overflow-y:auto` trap
  puts the title outside scroll range on phones. `:55269`.
- **Hall of Fame fires up to 5 simultaneous achievement toasts** that cover the ceremony text
  and the CONTINUE button (pointer-events:auto). `:44477`, `:7737`.
- **Battle bag is mouse-only** (item cells + heal targets are onclick-divs) — keyboard users
  cannot use any item in story battles. `:67435`, `:67460`. **The Pits picks likewise.** `:55292`.
- **Minigame overlays never receive focus** despite `role=dialog aria-modal=true` — SR-silent,
  no Tab containment, no Escape. `:42796`.

### 1.3 Notable P2 (selection — full register in `agent-state/ui-audit-2026-07-08/`)

Version tag paints above every modal at z-index 2147483646 (`:120`) · generic green "OK" on
destructive confirms (`:16814`) · "Auto (dete" clipped in Settings (`:9825`) · G1-G9 gens vs
G1-G4 grades naming collision (`:9672`) · Battle-Options toggle crams 3 cramped lines at every
viewport (`:7856`) · tablet-width mouse windows get the orphaned-portrait city layout
(`pointer:coarse` gate, `:8179`) · journal/errand overlays ghost the hub through 0.94-0.97
backdrops (`:43607`) · city guide quote box clips mid-line with no scroll cue (`:3520`) ·
2-line facility labels collapse their padding (`:3563`) · "Saved" toast covers the footer back
button on facility screens (`:7749` `:has()` rule misses them) · three price/CTA dialects
across four shops (`:64684` vs `:64969` vs `:64893`) · disabled roulette Spin melts into the
felt (`:7105`) · desktop roulette wastes its left half · Collection/PC tabs keep stale scroll
(`:49437`, `:61633`) · rival captions ellipsized to 4 chars at 8px on an empty desktop row
(`:61649`) · two different Pokédexes share one name with no scope label (`:61599` vs `:49565`) ·
party modal capped at 460px on a 1440px screen (`:8533`) · fainted row says "Status: OK" +
KO chip severs the Switch button (`:463`, `:22087`) · dead BAG command in Quick Battle
(`:21804`) · bare "T3" turn pill (`:21566`) · settings gear overlaps foe party balls in stack
(`:5112`) · stage badge floats mid-arena on tablet (`:21768`) · "Tap to expand log" hint is
itself clipped (`:8210`) · gauntlet draft indistinguishable from quick draft (`:19414`) ·
draft header flush against x=0 (`:9764`) · Crucible's 19 buttons keep all help in touch-dead
`title` attrs (`:62525`) · leaderboard modal shows a raw JS exception when Supabase is absent
(`:19559`) · camp sub-scenes drop the campfire backdrop (`:59105`) · bond hexagon spoke order
≠ meter order (`:59142`) · duplicate speaker labels on narrative overlays (`:42890`) · "First
Catch" quest toast fires on receiving the *starter* · professor selected-state has two
competing gold borders (`:439` vs `:3802`) · post-accept lab screen is 70% dead space with two
Back buttons · stray `Arial` in two battle-VFX glyphs (`:16061`) · 18 sprite `<img>` missing
`alt` · Team Tester ships unstyled dev chrome inside the story flow (`:10704`).

### 1.4 Fresh system census (2026-07-08, reproducible greps)

| Metric | 2026-07-04 plan | Today | Trend |
|---|---|---|---|
| Inline `style="` attrs | 1,347 | **1,597** | ⬆ +250 |
| Hex occurrences / unique / one-offs | ~3.4k / 856 / 487 | 3,460 / **859** / 493 | flat (no sweep ran) |
| Hexes that exactly equal an existing token | — | **510** (186× `#ffd54f`) | sweepable, zero risk |
| Distinct px font sizes (+half-pixel) | 37 | **37 + 23 half-px decls** | flat |
| `font-size … !important` | 46 | **59** | ⬆ |
| Button classes | 66 | **~94** | ⬆ +28 (tx-*, casino) |
| Breakpoint widths / @media blocks | 15 | **18 / 102** (incl. 719/720 + 768/769 seam pairs) | ⬆ |
| Unique box-shadows | — | **247** (pixel-bevel hand-copied ~45×, 6 colorways) | — |
| New-token adoption (`--dur-*`/`--radius-*`/`--text-dim`) | shipped | **4 / 2 / 0 uses** | dead on arrival |
| Typeface | 1 (Press Start 2P) | 1 (+2 stray `Arial` VFX sites) | ✅ genuinely consistent |

**Conclusion:** consolidation without enforcement decays. Phase B below pairs every sweep
with a committed guard test.

---

## 2. What the audit says is GOOD (protect in review — do not churn)

- **Arena/stack battle rebuild** — confirmed: the old tablet gap is gone; one switch site;
  phone portrait is the best-designed viewport in the game.
- **Wayfinding rail** — objective banner, SUGGESTED chips, reason-labeled disabled gates,
  NEW/FREE/REQUIRED pills. The journey agent: *"at no beat did I have to hunt."*
- **Defeat card** (best-designed screen in the funnel), **trainer-create IA** (numbered steps,
  collapsed Advanced, ★ Recommended), **City-0 cold open on portrait**, **city hub desktop**,
  **Crucible hub organization**, **casino art direction**, **camp countdown** (rules shown
  before the clock starts), **mart/dept card grid**, **Mentor's Auto-Build receipt**.
- **Shipped a11y plumbing** — 26/26 human screen labels, single global Escape handler, modal
  focus trap/restore, city re-render focus+scroll preservation, `role=log` battle narrative,
  exemplary move-button aria-labels, 31 reduced-motion CSS blocks + JS gates, gold
  `:focus-visible` ring, draft-card keyboard pattern (the house pattern to copy).
- **Quick Battle on-ramp** — 1 tap → fighting in ~4-5s.

---

## 3. The plan — four phases

Gate legend (per CLAUDE.md): **[BP]** behavior-preserving (direction approval only) ·
**[SIGN-OFF]** pixels/flow/copy change needing explicit approval · **[NUM]** maintainer-owned
numbers. Effort: S ≤half day · M 1-2 days · L multi-day.

### Phase A — "Nothing broken" (the 30 mechanical fixes; mostly [BP]) — ✅ SHIPPED 2026-07-08

**Status: implemented and verified on this branch.** All items below landed across 5 commits;
each fix was reproduced-then-confirmed in real headless Chromium (P0 player-plate, summary
close, prof keyboard; wordmark, help scroll, gen grid, difficulty copy, sticky footer,
overlay scroll-safety; HUD wrap, tips rail, shop overflow, tutor chip, PC vertical buttons,
Resisted label, move tiles, sequence pads; version tag, dead BAG, journal backdrop, turn
pill, fainted status, tab scroll, HoF toasts, professor quote, Ranger sprite). Full jsdom
suite green (1438/1438; one overlay z-token guard updated for the A9 scroll-safe change).
**Two items intentionally deferred to a focused battle/professor pass** (flagged inline):
A17b (arena compact HUD name-width — cosmetic truncation in the sensitive 211px landscape
card) and the A20 professor duplicate-back + post-accept dead-space (the quote-contrast part
shipped). Everything else is done.

Every item is a verified defect with a known one-to-few-line cause. Ordered by player impact:

| ID | Fix | Effort · Gate |
|---|---|---|
| A1 | P0-1 landscape player plate: scope the `overflow:hidden` to stack layout (or hoist the HUD row) | S · [BP] |
| A2 | P0-2 summary close: persistent × in `.sum-header` + backdrop-tap dismiss | S · [BP] |
| A3 | P0-3 prof pick keyboard: copy the 3-line draft-card pattern (`role`, `tabIndex`, keydown) — also to battle-bag items/targets, Pits picks, draft undraft slots | S-M · [BP] |
| A4 | Wordmark clamp so POKéMON never wraps (≤430px) | S · [BP] |
| A5 | Help modal: focus with `preventScroll` + `scrollTop=0` | S · [BP] |
| A6 | `[hidden]{display:none}` guard for the trainer-create gen grid | S · [BP] |
| A7 | Difficulty-card copy ≥10px + one-clause lines | S · [SIGN-OFF] (copy) |
| A8 | Sticky-footer bottom spacers (trainer-create; audit all `position:sticky` CTAs) | S · [BP] |
| A9 | Short-viewport overlay contract: `margin:auto` centering + `overflow-y:auto` on cold open, defeat screen, Fight Club, catch/safari stage clamp (`max-height:min(270px,36vh)`) | M · [BP] |
| A10 | City HUD wrap ≤600px (or kebab-collapse Run Info/Help/Settings) | S · [BP-ish] |
| A11 | Tips rail `flex-wrap:nowrap` (desktop phantom column) | S · [BP] |
| A12 | `min-width:0` + badge wrap on relic/stone shop rows | S · [BP] |
| A13 | Revert/scope the `.type-X` flat override poisoning tutor chips | S · [BP] (restores documented design) |
| A14 | Opaque sticky facility chrome (confirm bar, switcher, toolbar) + scroll-padding | S-M · [BP] |
| A15 | EV-Trainer/Colress cost-badge stack on ≤480px; Colress/FanClub phone header demotion (shared facility-header truncation rule) | M · [BP] |
| A16 | PC buttons: **stack Withdraw/Release vertically** on narrow cards (maintainer choice — keeps full labels, cards grow taller); `.sum-cov-label` min-width 84px ("Resisted") | S · [BP] |
| A17 | Battle: command grid `flex-shrink:0` priority over log (tablet); HUD name-first flex (min 90px); move-tile `hyphens:auto`, never break-word+clamp | M · [BP] |
| A18 | Sequence pads: glyphs (▲●■★) + aria-labels + non-opacity flash; fix "Previous/Next" labels in Dodge/Berry-Catch; minigame shell: focus-on-mount, Esc, ✕ Give up | S-M · [BP] |
| A19 | HoF: queue/collapse simultaneous achievement toasts; suppress while ceremony overlay is up | S · [BP] |
| A20 | Professor: quote on a scrim; single selected-card style; single Back affordance; fill post-accept dead space with the accepted mon card + next-step pointer | M · [SIGN-OFF] (visual) |
| A21 | Misc verified small fixes: settings-select width ("Auto (detect)"), version-tag z-index below scrim, confirm-dialog `confirmLabel`/danger variant, Saved-toast footer clearance `:has()` extension, scroll-reset on Collection/PC tab switch, fainted "Status: Fainted" + KO chip anchor, "Turn 3" pill label, disable dead BAG outside story, friendly leaderboard offline message, gauntlet draft mode chip, journal/errand opaque backdrops, missing `alt=""` on 18 sprites, party-size-select label, delete retired rotate-overlay, fix `Ranger` sprite 404 | M (batch) · [BP] + 3 tiny [SIGN-OFF] copy items |

**Exit test:** re-run the audit rig across all 7 viewports → zero `viewport-overflow-x`,
zero clipped-text hits on the fixed anchors, keyboard run of story start → first battle.

### Phase B — "One system" (the enforced consolidation) — B1–B4 + B9 ✅ SHIPPED 2026-07-08

**Status (this branch `claude/game-ui-ux-phase-b`, stacked on Phase A):** the entire
**player-visible** half of Phase B plus its enforcement shipped and is verified —
**B1** color-token adoption (~450 raw hexes → tokens, proven byte-identical computed styles
across 583 elements), **B2** gray-ramp contrast fix (286 gray text colors → `--text-muted`/
`--text-dim`; low-contrast findings → 0 on shop/settings), **B3** 10px type floor (132
sub-10px + 8 half-pixel sizes lifted; zero overflow regressions across menu/city/shop/tutor ×
desktop/phone/phoneS), **B4** accessible per-type badge ink (8 light types → dark text, now
6.06–9.15:1, all WCAG AA), and **B9** the `tests/suites/style-budget.test.js` guard that makes
it permanent (hard rules at 0: no sub-10px/half-px font, no raw gray text, no token-equal raw
hex, no Arial; ratchets: inline styles ≤1600, font-size !important ≤60, breakpoints ≤20).
Full jsdom suite green (1448/1448; three goldens regenerated for the intentional
color/size changes).

**Remaining (B5, B6, B7, B8) — pure-maintainability structural refactors, no player-visible
change — deferred to a focused follow-up.** These are the high-churn, multi-day items the
plan already rated `[SIGN-OFF]`/`L`; rushing a 94→6 button-class refactor or an 18→4 breakpoint
re-home on the 4 MB monolith risks silent regressions for zero visual payoff. Critically, **the
B9 ratchets already prevent these numbers from growing and create pressure to reduce them** —
so they can be driven down safely, incrementally, in their own reviewed pass rather than
gambled here. The per-item plan below is unchanged; treat B1–B4+B9 as done.

Order within the phase (B1–B4 + B9 complete):

1. **B1 Zero-risk mechanical session (an afternoon):** exact-hex→token sed (510 occurrences),
   `0.12s/0.15s`→`--dur-*` (99), round the 23 half-pixel font sizes. Headline numbers drop
   ~20% with **zero visual change**. [BP]
2. **B2 Gray ramp = the contrast fix:** `#666/#888/#999` → `--text-muted`, `#aaa/#bbb/#ccc` →
   `--text-dim` (186+163+ raw occurrences). This *is* the R5 WCAG wayfinding-text fix. [BP-ish]
3. **B3 Type ramp with a 10px floor:** 37 sizes → 8-step ramp (10/11/12/13/14/18/24/clamp-display);
   82% of declarations already sit in 9-14px so visual change is minimal; kill the 59
   `!important`s while resolving each underlying cascade conflict. Type badges move 9→10px.
   [SIGN-OFF] (pixels visibly change on the 8-9px layer — that's the point)
4. **B4 Per-type badge ink:** dark text on the 7 light type colors (Grass/Bug/Normal/Rock/
   Flying/Fire/Water/Psychic pairs measured 2.0-3.1:1) matching the treatment Electric/Ice
   already have; one accessible pair per type, consumed by `getTypeHTML` everywhere.
   [SIGN-OFF] (color change on a canonical element)
5. **B5 Button taxonomy 94 → 6 families** (`btn-cta / btn / btn-card / btn-chip / btn-tab /
   btn-icon`) + intent modifiers; per-screen *theme wrappers override custom props only*
   (casino keeps its felt-and-brass by overriding `--btn-*` vars, not by owning 10 classes).
   Census has the full mapping table. [SIGN-OFF] (direction), then [BP] per mapping
6. **B6 Breakpoint canon 18 → 4** (380/600/768/900; capability queries stay orthogonal); fix
   the 719/720 and 768/769 seam pairs; fold stray z-indexes (99999, 20000, 9990-9995, 8000)
   onto the `--sn-z-*` ladder. Drop the `pointer:coarse` gate on the city stack (the P2
   tablet-window bug falls out of this). [BP]
7. **B7 Bevel/radius/shadow tokens:** `--bevel-raised/-sunken` (+ per-theme hi/lo), 47 radii →
   3 tokens; 247 shadows → tokens + literal VFX exceptions. [BP]
8. **B8 Inline-style staged purge:** stage 1 classify the top-20 duplicated exact strings
   (~230 attrs, pure find/replace); stage 2 the static shell (435); stage 3 the top-10 JS
   hotspot renderers (`computeStatScales`, `rowHtml`, `buildStoryRunSummaryHtml`,
   `_catchRender`, …) as each screen gets its polish pass. [BP]
9. **B9 THE GUARD (non-negotiable recommendation):** a committed jsdom test
   (`tests/suites/style-budget.test.js`) asserting ceilings: inline styles ≤ current-after-sweep,
   unique hexes ≤ N, font sizes ∈ ramp, button classes ∈ taxonomy, breakpoints ∈ canon,
   no new `font-size !important`, no `Arial`. Every future PR that adds entropy fails CI
   with a message pointing at the token to use. This is what makes Phase B permanent. [BP]

### Phase C — flows & full keyboard/SR parity — ✅ SHIPPED 2026-07-09 (a11y-critical subset)

**Status (branch `claude/game-ux-phase-c`, off `main`):** the accessibility-critical work
shipped and is verified — **Story mode is now completable keyboard-only end to end**.
**C2** keyboard completion (battle bag items+targets, Pits picks, draft undraft, story
minigame overlays get focus+Tab-trap+restore, battle command menu focuses on turn 1 —
verified FIGHT focused → Enter opens moves → move tile focused). **C3** live regions
(catch outcomes + city-guide quote via aria-live with an aria-busy typewriter guard) +
first-boot reduced-motion seeding from the OS query. **C4** info-scent (Crucible's 19
title-only tips → visible sub-labels, contextual bag hint ×3, "this run"/"all-time" dex
scope labels). **C1** cold-open overlay keyboard access (focus Begin + Escape/Enter).
Full suite green 1458/1458; style-budget guard green. **Remaining:** the full E1
"one openOverlay() contract" migration (structural, no functional gap left) and minor camp
polish (backdrop continuity, bond-hex spoke order) — deferred like B5–B8.

Original per-item plan:

- **C1 Overlay registry (the deferred E1):** migrate the DIY fixed divs (cold open, arrival,
  recap, errands, journal, wander, daycare, Fight Club, HoF, camp shell, minigames) onto one
  `openOverlay()` contract: scrim (opaque for reading surfaces), `margin:auto` scroll-safe
  centering, focus-in/restore, Tab containment, Escape, z-token, ONE dismiss grammar
  ("Continue →" primary; background-tap as bonus not requirement). Phase A9/A18/A21 partial
  fixes fold into it. [BP-ish] L
- **C2 Keyboard completion:** after A3, verify story is finishable pointer-free end-to-end;
  add the battle-start `_battleFocusCommandMenu()` call (focus currently lands on `<body>`
  until turn 2); tooltip-borne info (moves/abilities/items) gets `tabindex` + focus-triggered
  tooltip (ledgered ISSUE-038/066). [BP] M
- **C3 Live-region gaps:** `aria-live` on catch outcomes (ISSUE-047) and city quote
  (ISSUE-062); seed `settings.animations` from `prefers-reduced-motion` on first boot
  (ISSUE-052); gate `MoveAnimEngine`/anime.js on it (ISSUE-055). [BP] S-M
- **C4 Info-scent fixes:** Crucible `title`-attr help → visible sub-labels; two Pokédexes get
  scope labels ("This run" / "All-time"); bag-modal contextual hint; camp sub-scenes keep the
  campfire backdrop; bond hex spoke order = meter order + vertex initials. [SIGN-OFF] (copy) M

### Phase D — cohesion & delight (opportunistic; each independently shippable)

- **D1 Quick-play era restyle:** draft / gauntlet swap / end screen adopt the story-era
  header/card/chrome language (biggest "one product" win; the end screen also earns a
  "Play again" CTA and a gauntlet streak recap). [SIGN-OFF] M-L
- **D2 Camp microgame pieces:** replace stock emoji (👄🧺🐱💣) with pixel/sprite pieces —
  the one place the art direction visibly breaks. [SIGN-OFF] M (asset work)
- **D3 Tablet/desktop space:** vertical-center the home menu on tall viewports; cap
  EV-Trainer stat-bar width; 3/6-column party grid at tablet; roulette desktop two-column
  rebalance; party modal 460→640px on ≥900px. [SIGN-OFF] (layout) M
- **D4 Shop grammar unification:** one card anatomy (price left, short "Buy") across
  mart/stone/relic, per-facility accent only. [SIGN-OFF] S-M
- **D5 First-five-minutes text pass:** collapse the 4 overlay styles / 4 dismiss verbs
  (mostly falls out of C1); drop duplicate speaker labels; move "Unstick"/seed debug copy out
  of the new-player funnel; retime the "First Catch" quest toast. [SIGN-OFF] (copy) S-M

### Flagged for maintainer — RESOLVED 2026-07-08

- **First rival fight difficulty** (journey P1): **keep as-is** — intended difficulty accepted;
  no softening, no arrow-teaching scene. (The playtest churn risk is acknowledged; retry is
  cheap and the defeat card is well-designed.)
- **Banter ±5% hidden gamble before that fight**: **keep as-is** — left an unlabeled roll.
- **Typewriter default** (VISUAL_ART_DIRECTION_REVIEW P2-8) — still open; not part of this plan.

---

## 4. Suggested sequencing & effort

| Phase | Wall-clock | Risk | Player-visible payoff |
|---|---|---|---|
| A | ~1 week | very low (each fix ≤ a few lines, rig-verified) | huge — every "it looks broken" moment |
| B | ~2 weeks | low-medium (B1-B2 zero-risk, B3-B5 need eyes) | "the game got cleaner" + permanence |
| C | ~1 week | low | full keyboard/SR playability, one overlay feel |
| D | opportunistic | per-item | cohesion, quick-play parity |

Every phase: deterministic jsdom tests for changed flows, full suite green, seeded RNG only,
CLAUDE.md sloppy-mode rules respected. Phases A and B are 90% behavior-preserving; the
sign-off items are individually small and listed inline.

## 5. Measurement

- Re-run the **audit rig** (§6) after each phase: `viewport-overflow-x = 0`,
  `text-clipped on fixed anchors = 0`, `low-contrast < 3:1 = 0`, tap targets ≥ 32px hard /
  44px goal, font sizes ∈ ramp.
- **Style-budget guard test** (B9) keeps census numbers monotonically non-increasing.
- Journey re-run: taps-to-first-battle unchanged (≤17), zero unreachable controls at 390×844
  and 844×390, story start→first win completable keyboard-only.

## 6. The audit rig (reusable tooling)

`scripts/debug/ui-rig/` — Playwright/Chromium harness used for this audit: drives every
screen via `StoryMode.*`/`__storyTest` (sm injection at any city, overlay dismissal),
screenshots at 7 canonical viewports, and runs programmatic checks (overflow, clipped text,
WCAG contrast, tap targets, font/button census). See its README for per-screen driver
recipes. Serve the repo (`python3 -m http.server 8787`) and run any script from that dir.
Full machine-readable findings: `agent-state/ui-audit-2026-07-08/findings.json`.
