# Visual Art-Direction Review — Story Mode

> **Lens:** lead graphic designer / art director.
> **Scope:** Story mode (normal difficulty) per `CLAUDE.md`. Quick Play / Online PvP /
> Frontier are out of scope (scanned for awareness only).
> **Status:** review + a first **production-polish** build (v28) landed on
> `claude/visual-design-review-xhfmw2`. See §5 for what shipped and §6 for the backlog.
> Companion docs: `UI_VISUAL_SYSTEM_AUDIT.md` (icons/color/text), `STORY_NARRATION_SYSTEM.md`
> (the overlay contract), `story-immersion/visual-and-cinematic.md` (the cinematic layer),
> `../BATTLE_RESPONSIVE_LAYOUT_AUDIT.md` (battle layout — already rebuilt).

---

## 1. The theme (what this game *is*, aesthetically)

A **GBA / Black-&-White-era Pokémon tribute**: one pixel typeface (`Press Start 2P`,
self-hosted, `battle.html:18`), `image-rendering: pixelated` everywhere, animated Gen-5
sprites, Game-Boy beveled inset-shadow buttons, the canonical 18-type colour palette, and a
**dark-only** theme (`color-scheme: dark`, `#0a0a0a`/`#000`).

Layered on top is a **darker, literary-horror narrative** — the time loop, "The First," the
mirror-self Mystery Figure, and eight grief/memory "horror raid" arcs. The main spine itself is
a dread crescendo ("How It Ends This Time" → "It Was You" → "Run #1").

**The central art-direction tension:** a *cute retro-arcade shell carrying a melancholy, uncanny
story.* The substrate is strong and internally consistent as "Pokémon-clone UI"; the gap is that
the visual layer rarely **modulates** to support the story's darker register. Most of the
opportunity is in **game-feel and narrative register**, not raw consistency.

---

## 2. Strengths (keep — do not churn)

- **Token system.** 65 CSS custom properties, semantically grouped: `--sn-*` (narration palette +
  z-index pyramid, `2225-2243`), `--fac-*` (5-category facility palette, `49-53`), `--gc-*`
  (22-token casino theme, `5470-5498`), `--battle-*` (4px spacing grid, radius, panel, `44-70`).
- **Single typeface discipline** — no serif/sans sprawl; sane monospace fallback; `font-display:swap`.
- **Canonical type palette** — all 18 types match official values; no reinterpretation.
- **One narration overlay** — `_renderNarrativeOverlay` (`~51201`) renders all 198 story scenes
  through one schema with an anti-stacking queue and a tokenised z-scale.
- **A shipped cinematic layer** — raid encounter cinematic, pre-boss cinematic, portrait-emotion
  (`.cast-*` filters, `2953-2958`), evolution scene, VS-splash. The *boss* moments are well-served.
- **Accessibility** — 21 `prefers-reduced-motion` guards, `focus-visible` gold ring, dark contrast.
- **Already-consolidated** — icon registry, `--fac-*` recolour, dead inline-chrome strip
  (Phase 2a–2d), and the **battle-responsive rebuild** (`arena`/`stack`, CSS Grid; do not redo).

Net: this is a **high-quality codebase visually**. The notes below are polish, not rescue.

---

## 3. Issues (prioritised through the game-feel lens)

### P0 — Game-feel lifts (high impact, low risk, on-theme) — **addressed in v28, §5**

1. **Narration overlays pop in/out.** `_renderNarrativeOverlay` appended `ov` with no opacity
   transition — every beat, cold-open, and tutorial hard-cut. The single biggest perceived-quality
   lever for near-zero risk.
2. **`toneClass` was plumbed but visually orphaned.** The overlay applied `toneClass` to its root,
   and a call site even passed `toneClass:'story-anomaly'` (`~46175`) — but **no `.story-anomaly`
   CSS rule existed**, and there was no per-register vocabulary. Professor, rival, villain, and the
   uncanny beats all rendered with the identical friendly gold nameplate.
3. **Backdrop coverage was uneven.** Villain/horror arcs had curated gen3 backdrops
   (`SCENE_BACKDROP_OVERRIDES`, `~38962`); the `main.*` spine fell back to a generic `'forest'`
   heuristic — the emotional spine read as placeholder next to the thematic arcs.
4. **The climax had no entrance.** The Hall of Fame (`showHallOfFame`, `~61033`) mounted instantly,
   while lesser beats (VS-splash, egg-hatch, legendary sighting) all had motion.

### P1 — Consistency polish — (5) addressed in v28; (6)(7) backlog

5. **Settings gear was a raw `⚙` emoji** in 3 chrome spots (`~8897/9325/10043`) — OS-font-dependent
   and off-pixel, contradicting the codebase's own inline-SVG doctrine (`moveCatBadgeHtml`,
   `uiSvgCheck`/`uiSvgX`).
6. **Status badges are text-only** (`BRN`/`PSN`…, `519-524`). A tiny inline-SVG glyph prefix would
   speed scanning and match the move-category SVG badges. *Backlog.*
7. **Party balls don't distinguish healthy vs low-HP alive mon.** Minor colour state. *Backlog.*

### P2 — Pacing (needs explicit sign-off — felt behaviour change)

8. **Typewriter reveal exists but is off by default** (`opts.typewriter`). Enabling it for narrative
   beats (not city chatter), behind a Settings toggle + reduced-motion, would restore reading tempo
   to a literary story. **Maintainer-owned** — propose, don't ship silently.

### Strategic (asset work, not code) — flagged, not built

9. **Mixed-provenance backdrop art.** Story scenes mix three visual languages — pixel `gen3-*`
   (ripped placeholders, per `ATTRIBUTION.md`), painterly AI battle stadiums, and flat SVG city
   scenes. They don't share a rendering grammar. Long-term: pick one language (the gen3 pixel set is
   most on-theme with the pixel font/sprites) or apply a unifying colour grade/wash so they read as
   one world.

### Out of this pass (documented elsewhere)

- Card-dialect consolidation, 5→3 button families, the double `.type-badge` rule, dead inline header
  CSS — the deferred **Phase 2d** backlog in `UI_VISUAL_SYSTEM_AUDIT.md` (low visible payoff, real
  regression risk).
- Battle-responsive unification — **already shipped** (`BATTLE_RESPONSIVE_LAYOUT_AUDIT.md` Phase 2).

---

## 4. The visual-narration consistency map (why it reads "uneven")

Five+ distinct screen templates share the pixel font but not a visual grammar: the cold-open
overlay (flat + optional backdrop + text), the city hub (portrait + quote + action grid), the Hall
of Fame (GBA sprite panel), facility interiors (SVG/gen3 backdrop + list), and the VS-splash. The
unification that *has* happened (one overlay engine, tokenised z-scale, one icon registry) is real
and load-bearing; the remaining unevenness is **register** (everything looks equally friendly) and
**motion** (beats cut instead of dissolve). v28 attacks both at the overlay layer, where the payoff
is widest for the least risk.

---

## 5. What shipped in v28 (this branch)

All in `battle.html`; every animation gates on `prefers-reduced-motion` / `StoryFx.isReducedMotion()`
and on the jsdom harness so the synchronous test contract is preserved. Guarded by
`tests/suites/visual-narration-polish.test.js`.

| # | Lift | Mechanism |
|---|------|-----------|
| 1 | **Overlay cross-fade** | `_narrFadeInOverlay` + a deferred fade-out in `_renderNarrativeOverlay`; logical queue release stays synchronous. Harness/reduced-motion keep the instant mount/remove. |
| 2 | **Per-register tone** | `_toneClassForScene(sceneKey)` derives `.narr-tone-villain` / `.narr-tone-anomaly` (and gives the orphaned `story-anomaly` a real look); CSS retints nameplate + frame + a faint root vignette only — never body text. Explicit `toneClass` still wins. |
| 3 | **Main-spine backdrops** | Curated `SCENE_BACKDROP_OVERRIDES` for the milestone `main.*` beats (empty-portrait → mansion, plateau/apex → league, the reveal → villain wash, the loop closes in the lab). Early road beats keep the `forest` default. |
| 4 | **Hall of Fame entrance** | CSS `storyHofPanelIn` (rise + fade) + staggered `storyHofCellIn` sprite roll-call; reduced-motion disables both. |
| 5 | **Settings gear → SVG** | `uiSvgGear` helper + inline SVG on the 3 chrome buttons (`currentColor`, ~1.25em to match the emoji's weight); adds a missing `aria-label`/`title` on the menu button. |

**Not shipped (sign-off / backlog):** typewriter-default (P2-8), status-badge SVG glyphs (P1-6),
party-ball low-HP state (P1-7), the strategic backdrop-grade pass (§3.9).

---

## 6. Recommended next passes (in priority order)

1. **Typewriter default for narrative beats** (P2-8) — behind a Settings toggle; get maintainer
   sign-off on the feel. Biggest remaining tempo lever.
2. **Status-badge + volatile-chip SVG glyphs** (P1-6) — extend the `moveCatBadgeHtml` doctrine to
   the in-battle status pills; faster scanning, fully on-theme.
3. **Wire the warm/rival tones** (`.narr-tone-warm` / `.narr-tone-rival` already exist) onto the
   Professor and rival dialogue call sites for explicit per-speaker identity.
4. **Backdrop-grade pass** (§3.9) — one colour wash that reconciles gen3 / AI / SVG backdrops into a
   single world; or commit to the gen3 pixel language story-wide.
5. **Phase 2d DRY** (card dialects, button families) — only when a dedicated, test-guarded refactor
   slot is available; low visible payoff.
