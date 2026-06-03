# Story Mode — Unified UI/UX Visual Design System

**Status:** Phase 0 (audit) + Phase 1 (proposal). No code changed yet — implementation is Phase 2, post-approval.
**Scope:** Story-mode facilities, city screens, facility interiors, shops, Pokémon cards, text styles. Battle-screen icons cross-referenced. (Quick Play / Online PvP / Frontier internals are out of scope per `CLAUDE.md`; touched only where they share story code.)

---

## Phase 0 — Audit & Issue Catalogue

### 0.1 The headline: one facility, up to **four** different icons

Story mode renders a facility's icon through **three independent code paths that have drifted**, plus a fourth (dialogue/toast emoji). Nothing forces them to agree:

| Surface | Where it lives | How the icon is chosen |
|---|---|---|
| **A — City menu** | `renderCityActions` → `makeActionBtn` (`battle.html:44708`) | `STORY_ACTION_ICON_URLS[key]` PNG map (`44670`). **The emoji in the label is stripped** by `storyActionStripLeadingDecor` (`44698`) and replaced by the mapped PNG. |
| **B — Crucible post-game hub** | `_renderCrucibleHub` inline `btn()` (`44900`-ish, refs at `49907`-`49935`) | Hand-written `png('icons/story/…')` **or a raw emoji**, chosen per-button. Independent of map A. |
| **C — Facility interior title** | `.story-screen-head-ico` in the static `screen-story-*` markup (`9145`-`9600`), or set dynamically (`_applyStoryTutorHeader` `56197`; `_storyRenderShopGrid` `51833`) | Hard-coded `src` per screen. Independent of A and B. |
| **D — Tips / toasts / dialogue** | tip rail (`44206`+), banners, dialogue choices | Raw emoji or item sprites, ad-hoc. |

Because A, B, C are three separate sources of truth, the same facility legitimately shows different art depending on where you look.

### 0.2 Cross-surface icon matrix (the drift, proven)

`Sxxx` = `icons/story/story_xxx.png`. Bold = disagreement across surfaces.

| Facility | A: City menu | B: Crucible hub | C: Interior title | Verdict |
|---|---|---|---|---|
| Pokémon Center | `Scenter` | `Scenter` | `Scenter` | ✅ consistent |
| Pokémart | `Smart` | `Smart` | `Smart` | ✅ consistent |
| Move Tutor | `Stutor` | `Stutor` | `Stutor` | ✅ (but collides — see 0.3) |
| Nature Rater | `Snature` | `Snature` | `Snature` | ✅ |
| **Evolution Tutor** | `Stutor` (evolab key) | **`Sprofessor`** (`49922`) | `Stutor` (`9375`) | ❌ Crucible shows the Professor icon |
| **Battle Frontier** | — | **`Svr`** (`49907`) | **`Sleague`** (`9324`) | ❌ menu ≠ interior |
| **Casino / Game Corner** | **`Sdept`** (casino→dept `44691`) | **🎰** (`49929`) | **🎰** (`9395`) | ❌ menu shows the Dept-Store icon |
| **Safari Zone** | **`Sroute`** (safari→route `44693`) | **🦒** (`49934`) | 🦒 text + `Sroute` static (`51055`/`9339`) | ❌ three different treatments |
| **Daycare** | **`Scenter`** (daycare→center `44695`) | n/a | **🥚** overlay (`45348`) | ❌ menu identical to Pokémon Center |
| Battle Dojo | `Sdojo` | `Sdojo` | `Sdojo` (`56211`) | ✅ (but collides) |
| EV Trainer | `Sdojo` | `Sdojo` | `Sdojo` (`9242`) | ✅ (but collides) |
| Fan Club | — (no city PNG; 💖 label) | n/a | **💖 only** (`9264`) | ❌ no icon at all |

### 0.3 Icon issue catalogue

**(a) Colliding icons — the canonical map reuses one PNG for unrelated facilities** (`STORY_ACTION_ICON_URLS`, `44670`). We have **17 distinct PNGs** for **~26 facility concepts**, so the map doubles up:

| Shared PNG | Facilities sharing it | Brief flags it? |
|---|---|---|
| `Scenter` | Pokémon Center **+ Daycare** | ✅ "daycare + Pokémon center share an icon" |
| `Stutor` | Move Tutor **+ Evolution Tutor** | ✅ "move tutor + evolution master share an icon" |
| `Sdojo` | Battle Dojo **+ EV Trainer** | (newly found) |
| `Sdept` | Department Store **+ Casino** | (newly found) |
| `Sroute` | Continue Route **+ Safari Zone** | (newly found) |
| `Svr` | Victory Road **+ The Crucible** | (newly found) |
| `Sgym` | Gym **+ Trainer Road + Fight Club** | (newly found) |
| `Sartifacts` | Relic shop + Relic Hall | OK — genuinely one merged facility ("Relics", two tabs; comment `44463`) |

**(b) Missing icons** — facilities with no dedicated PNG, forced to borrow or use an emoji: **Fan Club** (💖 only), **Daycare** (🥚 only; `_eggIconHTML` `45210` is also just the emoji), **Safari Zone** (borrows route), **EV Trainer** (borrows dojo), **Evolution Tutor** (borrows tutor), **Casino** (borrows dept / 🎰), **Fight Club** (borrows gym).

**(b2) Live defect — two city buttons render with NO icon.** `stoneShop` (💎, `44485`) and `fanclub` (💖) are **absent from `STORY_ACTION_ICON_URLS`** (`44670`-`44697`). `makeActionBtn` strips their label emoji, then `STORY_ACTION_ICON_URLS[key] || ''` yields empty → **blank icon slot** in the city menu. The strip step and the incomplete PNG map contradict each other.

**(c) Context-inconsistent icons** — see matrix 0.2: Evolution Tutor, Battle Frontier, Casino, Safari, Daycare each change icon by surface. Root cause is structural (three maps), not a one-off typo.

**(d) Emoji-as-icon, two behaviours** — In Surface A the label emoji (🛒🏬✨💎📖🥋🧬🥚🥊🦒🏥⚔🏆) is **stripped and discarded**, yet those emoji actually encode the *intended distinct* iconography that the colliding PNG map throws away. In Surfaces B/C/D the emoji is **live** (🎰 casino, 🦒 safari, 🥚 daycare, 🌀 rival, 💖 fan club, ⚙ settings, 📖 Pokédex). OS-font emoji render differently per device — which the codebase elsewhere explicitly rejects (see 0.8).

**(e) Disabled buttons bypass the map** — the gym/route/VR/TR disabled states hand-roll `<img src="icons/story/story_*.png">` (`44328`, `44356`-`44363`, `44405`, `44414`) instead of `makeActionBtn`, so they drift from the map independently.

**(f) PNG + unrelated-emoji combos** — the catch screen keeps `story_route.png` as its `head-ico` but the JS overwrites the header *text* to `🦒 Safari Zone` / `🎓 Catch Tutorial` / `🌿 Wild Encounter` (`51055`-`51057`), so a route PNG sits next to an unrelated emoji. The emoji should *drive the icon*, not the text.

**(g) Glyph overloading (same emoji, unrelated meanings)** — 🏆 used 5 ways (HoF tab `9778`, achievements `37055`/`37071`, Up-Next finale `50656`, career banner `55446`, casino stats `52439`); 📖 used 4 ways (Collection `9068`/`9088`/`9776`, **Move Tutor** label `44495`, Pokédex strip `9287`); 🎯 across Roulette/achievement/filter-chip; ★ heavily overloaded (Starter badge, STAB marker, Colress "Mega", "Big Win", achievement fallback). **Memorial** even uses two glyphs for itself — 📭 tab button (`9781`) vs 🕯 in-tab title (`41604`).

**(h) Sub-screen emoji sets are ad-hoc too** — Colress gimmick section headers mix metaphors (★ Mega / 💥 Dynamax / ⚡ Z-Move / ◆ Tera, `60823`-`60933`); Move/Dojo filter chips mix ⚡ STAB / 🗡 Damage / ✦ Status / 🎯 Type (`58863`-`58882`); the Collection tab strip is six entity emoji (📖🏅🏆⚔️⭐📭, `9776`-`9781`). A latent emoji fallback (`t.icon`) survives in the tip renderer (`44646`).

### 0.4 Color coding — no system

`--accent` is `#ffd54f` (gold). Facility **title color** is hard-coded inline `font-size:14px;color:<hex>` on all 16 `<h3>` titles; `.story-screen-head-title` sets no color/size and `.story-screen-head-text` has **no CSS rule at all**.

- **11 raw title-color values** for one role; only **3 of 14** facilities use the `var(--accent)` token (Professor, Mart, Center). Examples: Relics `#ce93d8`, Stone `#b39ddb`, Tutor `#ce93d8`, Colress `#ce93d8`, EV `#9ccc65`, Fan Club `#f8bbd0`, Crucible `#ffab40`, Frontier `#ff5722`, Catch `#aed581`, Link `#00e5ff`, Evolab `#a5d6a7`, Artifacts modal `#9c27b0`.
- Near-duplicate purples (`#ce93d8`/`#b39ddb`/`#9c27b0`) and greens (`#9ccc65`/`#aed581`/`#a5d6a7`) are used for adjacent facilities with **no systematic meaning**.
- **Shop color coding** is likewise ad-hoc: Mart/Dept `--accent` gold, Stone `#b39ddb`, Relics `#ce93d8`, Casino brass/red (its own 22-token scoped palette, `5335`).
- Inline **price** `<strong>` color varies per blurb: `#ffd700` vs `#b39ddb` vs `#ce93d8` vs `#aed581`. Gold amounts are styled 3 ways (`#ffd700 13px` headers, `#ffd700 11px` HUD, dark-on-brass casino).

### 0.5 Text styles — inline-everything, 5 button styles

- Facility title size (`14px`) is inline on all 16 `<h3>`; changing it is 16 edits. The title role is **not themeable through a class** today.
- **font-family specified 3 ways** for the same goal: `var(--battle-font)!important`, inherited via a mega-selector (`2148`-`2163` brute-forces font onto every `h1-h4/p/span/button/label` in 14 screen IDs), and bare `inherit`.
- Blurbs split `12px/#aaa` vs `11px/#888` with no rule; hints are `10px !important #9aa0aa`.
- **5 distinct button styles**: global `button` base, `.story-action-btn`, `.story-shop-back-btn`, `.story-footer-back-btn`, `.story-bag-close-btn` — plus casino's own chrome.
- **Dead inline code:** every facility header re-inlines `background:rgba(13,13,13,0.92);border-bottom:1px solid #333` and every footer re-inlines `rgba(10,10,14,0.85);border-top:1px solid #333`, but `.story-shop-header-row` (`2165`) and the footer selector (`2239`) override both with `!important`. **28 rows of misleading dead bytes.** The visible header is actually a `#1e2030→#12141e` gradient.
- **Casino is the only screen done "right"** — class-only header (`.story-shop-header-row.casino-header-row`), `.casino-header-title`, zero inline styles. It's the template to generalize. `artifacts` (`#0d0d0d`) and `tester` (`#111`) bypass the scaffold entirely (header background ends up sourced 4 different ways).

### 0.6 Shop / facility enter–exit flow

- **Enter:** city menu → `enterX()` → hide all screens → render → `showScreen('screen-story-…')` → `syncStorySceneBackground(bg-layer)`. Mart/Dept additionally play a door-bell SFX (`pbTrayBall`, `51817`); **no other facility plays an entry cue.**
- **Exit:** dual back — header `←` `.story-shop-back-btn` **and** footer `← Back to City` `.story-footer-back-btn`, both → `enterCity()`. Consistent across mart, artifact, stone, tutor, colress, evtrainer, fanclub, center, link, evolab, casino.
- **Outliers:**
  - **Daycare** is a `position:fixed` **overlay** appended to `<body>` (`45328`), exited via a bespoke **"Close"** button — not the screen scaffold, not a back-arrow.
  - **Catch / Safari** have no back-arrow and no footer; exit is a **"Run"** button (`9344`).
  - **Crucible** has no header back-arrow (just a spacer); footer → `leaveCrucible()`.
  - **Modals** (bag/party/artifact) exit via **"Close"**.
- **Shop card grids are not unified:** Mart/Dept share one 2-col card (`_renderShopCard` `51849`, good); Stone shop uses `repeat(auto-fill,minmax(220px,1fr))`; Relic shop is 1-col; Casino is bespoke. Four grid idioms.

### 0.7 Pokémon cards — three "dialects" + outliers

Good news: partial consolidation already exists. **`getTypeHTML(t1,t2)`** (`16966`) is the de-facto canonical type chip (11+ surfaces); `getSprite` (`13902`), `_pcCardHtml` (`49440`, drives PC party/box/sell), `renderSummaryHeader` (`18845`, shared with battle), and `_txRenderCollapsedMonHtml` (`59516`) are shared seeds.

Divergences to unify:
- **Three card families:** `story-tutor-mon` accordion rows (the 6 facilities), `pc-card` tiles (PC + sell), `prr-` party rows (party modal) — three implementations of the same idea.
- **`_txRenderCollapsedMonHtml` is shared in principle but only Move Tutor calls it;** Evo/Link/Colress/EVTrainer/FanClub each inline a near-identical copy.
- **Sprite-size drift:** facility header sprite is **40px** (Tutor/EV/Colress/FanClub), **42px** (Evo, `54092`), **48px** (Link, `53445`) for no reason.
- **Type-badge fragmentation:** `getTypeHTML` canonical, but ~7 bare-inline `type-badge` call sites + `.tx-chip--type` filter variant + type-colored buttons. `.type-badge` is defined **twice** — `border-radius:3px` (`3580`) then `0 !important` (`7942`).
- **Worst outliers:** the **wild catch screen** card (`51318`) uses no card class, not `getSprite`, and shows **no types**; the **Fan Club** card is the only `story-tutor-mon` header with **no types**. Four different stat-bar renderers coexist (`statBarHTML`, `tx-stat-row`, `renderSummaryStatBar`, Fan Club inline).

### 0.8 Battle-screen cross-reference (must follow the same system)

The battle screen already demonstrates the *target* philosophy — and it's the precedent to extend:
- **`moveCatBadgeHtml`** (`10287`) renders Physical/Special/Status as a single-source-of-truth **inline SVG** badge, with a comment that it *"Replaces the old `icons/categories/*.png` + ⚔/✦/◎ glyph split"* — i.e. the exact icon-unification we now need for facilities, already done once for move categories.
- **`uiSvgCheck` / `uiSvgX`** (`10296`-`10297`) replace OS-font ✓/✗ dingbats "so markers render identically across screens and devices."
- **Gap:** the **settings gear is a raw `⚙` emoji in 3 places** (`8664`, `9092`, `9792`) — OS-font-dependent, contradicting the above. Arrow back-buttons use the `&#8592;` entity (consistent).

### 0.9 Existing assets available for reuse

- **`sprites/items/` — 102 item icons** (the library the brief refers to). Includes thematically perfect matches: `muscle-band.png`, `black-belt.png`, `expert-belt.png`, `choice-band.png`, `protein.png`/`calcium.png`/`carbos.png`/`hp-up.png` (vitamins), `heart-scale.png`, `mint.png`, all evo stones (`fire/water/leaf/moon/sun/dawn/dusk/ice/shiny/thunder-stone`, `dragon-scale`, `dubious-disc`, `prism-scale`), `amulet-coin.png`.
- **`sprites/pokesprite/balls/` — `poke/great/ultra/master/safari.png`** (Safari ball is ideal for the Safari Zone).
- **`icons/story/` — 17 facility PNGs** (the current set).
- **`icons/story-gold-coin.svg`** (already used for gold pills).

---

## Phase 1 — Proposed unified visual language

Guiding principle (matching `moveCatBadgeHtml`): **one icon per facility, one registry, render identically across menu / title / on-click / toast.**

### 1.1 Icon system — a single facility-icon registry

Collapse Surfaces A/B/C into **one** lookup, e.g. `STORY_FACILITY_ICON[key] = { src, label, accent }`, consumed by `makeActionBtn`, the Crucible `btn()`, every interior title setter, and the tip rail. Resolve every collision by giving each facility a **unique** icon, preferring the in-file item-sprite library (the brief's "muscle band" idea):

| Facility | Today | Proposed (reuse-first) | Why |
|---|---|---|---|
| Battle Dojo | `Sdojo` | **`sprites/items/muscle-band.png`** | brief's own example; martial |
| EV Trainer | `Sdojo` (collide) | **`sprites/items/protein.png`** (or calcium/carbos) | vitamins = EVs |
| Move Tutor | `Stutor` | **`sprites/items/heart-scale.png`** | the tutor literally consumes Heart Scales |
| Evolution Tutor | `Stutor` (collide) | **an evo stone** (`moon-stone`/`dawn-stone`) or `dragon-scale` | evolution items |
| Nature Rater | `Snature` | keep `Snature` (or `mint.png`) | already unique |
| Safari Zone | `Sroute` (collide) | **`sprites/pokesprite/balls/safari.png`** | the Safari Ball |
| Casino | `Sdept` (collide) | **`sprites/items/amulet-coin.png`** or `story-gold-coin.svg` | coins |
| Fight Club | `Sgym` (collide) | **`sprites/items/black-belt.png`** | martial, distinct from dojo |
| Stone Shop | `hard-stone.png` | keep (already an item icon) | unique |
| The Crucible | `Svr` (collide) | keep `Svr` for Crucible, give **Victory Road** `Sroute`/new | resolve VR/Crucible clash |
| **Fan Club** | 💖 only | **NEEDS DECISION** (no perfect item icon) | see 1.2 |
| **Daycare** | `Scenter` (collide) | **NEEDS DECISION** (egg art; only 🥚 emoji exists) | see 1.2 |

That frees the colliding `Stutor`/`Sdojo`/`Sdept`/`Sroute`/`Scenter` to each map to exactly one facility.

### 1.2 Genuinely-missing icons — options to choose from

- **Fan Club** (friendship/affection theme, no item fits): (i) `sprites/items/silk-scarf.png`; (ii) a new generated **heart SVG** in the `moveCatBadgeHtml` style; (iii) an open-art pixel "membership ribbon/badge" (license-checked); (iv) keep 💖 but as an SVG.
- **Daycare** (egg theme, only emoji today): (i) add a small **egg PNG** to `icons/story/`; (ii) a generated **egg SVG**; (iii) reuse a Pokémon-egg sprite if one exists in `sprites/`.

### 1.3 Color coding

Introduce a per-facility accent token, `--fac-accent`, **defaulting to `--accent`**, set once per screen (class or `data-facility`), and grouped by category so color carries meaning:
- **Heal/utility** (Center, Daycare) · **Shop** (Mart, Dept, Stone, Relics) · **Train** (Tutor, Nature, Dojo, EV, Evo, Colress) · **Battle** (Gym, League, VR, Crucible, Frontier) · **Catch/Trade** (Catch, Safari, Link).
Collapse the near-duplicate purples/greens to one value per category. Title color + size move onto `.story-screen-head-title` (kill 16 inline `font-size:14px` + 11 magic hexes). One price/gold style (`--gold`).

### 1.4 Shop / facility flow

Generalize the **casino pattern** (class-only header, no inline) to all screens; strip the 28 dead inline header/footer backgrounds. Standardize: header `←` back + footer "Back to City" + a single entry cue (door SFX) for **every** facility. Convert the **Daycare overlay into a real `screen-story-daycare`** so it shares the scaffold and exit flow. Give Catch/Safari a consistent header.

### 1.5 Pokémon cards

Promote the existing seeds to mandatory: **`getTypeHTML` as the only type chip** (fold `.tx-chip--type` into a `variant` param; reconcile the double `.type-badge` rule); **all six facility headers call `_txRenderCollapsedMonHtml`** (forces 40px everywhere, adds types to Fan Club); pick one **tile** (`pc-card`) and one **row** (`story-tutor-mon`) shape; **bring the catch screen into the system** (real card + types). One stat-bar renderer.

### 1.6 Text styles

Define roles as classes/tokens: **Title / Blurb / Body / Hint / Label / Price / Button**. Title → `.story-screen-head-title` (size+color via `--fac-accent`); one blurb style; one button family (keep `.story-action-btn`, `.story-shop-back-btn`, footer; retire the 4th/5th). Extend `moveCatBadgeHtml`'s SVG approach to the settings gear (retire the `⚙` emoji).

---

## Decision points (questionnaire)

See the chat message accompanying this doc — six decisions, each with a recommendation, plus the two missing-icon (Fan Club, Daycare) choices.
