# Event Cinematics — richer per-event animation & the sighting fold

> Part of the [Camp System spec](./README.md). Covers the maintainer's "add some
> animation / small cinematic / visual updates" ask across events, and threads in
> the **legendary-sighting structural fold** that was the next step of the §6
> narration-unification work (`../STORY_NARRATION_SYSTEM.md`). Anchors
> symbol-first.

---

## 1. Concept

Events currently begin/end fairly flatly. The maintainer wants each event *type*
to land with a small cinematic beat — a visual "this is a Thing happening" — which
also reinforces the camp **buffer** goal (clear boundaries between events). This
doc catalogues what to add and, critically, **what to build it on** so we get
consistency instead of N more bespoke overlays.

---

## 2. The substrate (already in the codebase — reuse, don't reinvent)

The research sweep mapped a complete toolkit:

- **`_renderNarrativeOverlay`** (≈`47655`) — the canonical one-shot story overlay:
  `lines / name / nameplate / sprite / banner / accent / choices / onDone /
  metaKey / sfx`. The unification target for bespoke overlays.
- **`_storyScene`** (≈`45003`) — multi-beat branching engine (`beats[]` with
  `id / html / options[{label, goto, onPick, danger}]`, `onDone`, `sceneId`). The
  substrate for multi-step cinematics and camp scenes.
- **`evolutionScene`** (≈`29847`) — a full **Promise-based** cinematic: animated
  sprite morph, white-flash commit (`onCommit` swaps data mid-flash),
  skip/cancel-confirm, SFX orchestration. The **gold-standard pattern** for a
  rich, awaitable, skippable cinematic.
- **Sighting overlays** — `_showRoamingLegendarySighting` (≈`47867`),
  `_showFirstSightingLoreOverlay` (≈`47952`), with data in `_LEGENDARY_LORE`
  (≈`47794`) and `_LEGENDARY_SIGHTING_FRAMES`.
- **`showBattleIntro`** (≈`48386`) — the VS splash (already a decent cinematic;
  role-themed accent, timed handoff to battle).
- **SFX/music:** `window.StoryFx.playSfx(name, vol)`, `window.AudioSystem.*`.
- **z-index scale (just shipped):** `--sn-z-*` tokens (scrim < battle-banner <
  overlay < spotlight < toast). **All new cinematics must use these tokens**, not
  ad-hoc literals — see `../STORY_NARRATION_SYSTEM.md` §6.

---

## 3. First deliverable — the legendary-sighting fold (POC) — **[MAINTAINER] D9**

This is the recommended **first implementation PR** of the whole effort: it
continues §6 (fold a bespoke overlay onto `_renderNarrativeOverlay`) *and* doubles
as the cinematics proof-of-concept, in a self-contained, low-risk area.

**Two steps, one PR:**

1. **Fold:** rewrite `_showFirstSightingLoreOverlay` and
   `_showRoamingLegendarySighting` to render through `_renderNarrativeOverlay`
   (passing `sprite`, `banner`, `accent`, lore `lines`, `onDone`), deleting their
   bespoke style blocks. Behaviour-preserving; lock with a DOM guard test
   (the overlay carries `--sn-z-*`, shows the lore lines, fires `onDone`).
2. **Enrich:** layer in a small animation pass borrowed from `evolutionScene` —
   a type-tinted background wash + a sprite "emerge" (fade/scale) + a `sparkle`→
   `danger` SFX beat on reveal. Keep it **skippable** and **reduced-motion-aware**
   (§6).

Shipping this first proves the "fold + enrich on the shared substrate" loop that
every later event-type cinematic will follow.

---

## 4. Per-event-type cinematic catalogue (prioritised)

Each is a *small* beat on the shared substrate. Priority is the suggested order;
all magnitudes/lengths are tunable and skippable.

| Pri | Event beat | Treatment | Build on |
|-----|-----------|-----------|----------|
| 1 | **Legendary sighting** | fold + emerge animation (the POC) | `_renderNarrativeOverlay` + `evolutionScene` motifs |
| 2 | **Camp arrival / break** | campfire backdrop, settle-in sprite, 1 short beat | `_storyScene` (see `CAMP_FLOW.md` §9) |
| 3 | **Bond path maxed** | spotlight "victory card": "Praise maxed — +5% Atk!" | spotlight-tier reveal / casino prize lane |
| 4 | **Wild appears** | quick sprite slide-in + cry before the encounter | `_renderNarrativeOverlay` + SFX |
| 5 | **Catch success** | ball-shake → burst → "caught!" flourish | existing catch flow + `sparkle`/`achv` |
| 6 | **Victory / item get** | brief banner polish (consistency pass) | existing banners on `--sn-z-*` |
| — | **Evolution** | already strong — leave as the reference | `evolutionScene` |
| — | **Battle VS intro** | already strong — minor consistency only | `showBattleIntro` |

v1 scope is **D9** — recommend Pri 1–3 (sighting fold, camp arrival, bond-maxed)
since 2 and 3 are required by the camp feature anyway; 4–6 are polish that can
follow.

---

## 5. Consistency rules (so this doesn't sprawl)

- **One substrate:** new cinematics go through `_renderNarrativeOverlay` /
  `_storyScene`, never a fresh hand-rolled fixed-position div.
- **Tokens, not literals:** z-index via `--sn-z-*`; reuse the existing accent
  palette and the `StoryFx` SFX vocabulary.
- **Awaitable + skippable:** rich beats return a Promise and honour a skip/cancel
  (copy `evolutionScene`'s skip-confirm). Never block the player in an
  unskippable animation.
- **Seeded variance:** any randomised flourish uses `storyRngNext`.

---

## 6. Performance & accessibility

- **Reduced motion:** respect `prefers-reduced-motion` — degrade emerge/morph
  animations to a simple cross-fade. (The accessibility auditor checks this; see
  `.claude/agents`.) Flag any new keyframe animation for a reduced-motion variant.
- **Skippable:** every cinematic must be tap/B-to-skip; long-press never required.
- **Budget:** keep added per-event time ≤ ~1.5s default; the buffer should feel
  like punctuation, not a cutscene.
- **No perf regression:** cinematics are DOM + CSS animation only; avoid
  per-frame JS. The perf profiler tracks turn-loop ms — keep cinematics off the
  battle hot path.

---

## 7. Relationship to the §6 narration work

The just-merged z-index tokenization (`../STORY_NARRATION_SYSTEM.md` §6 item 3)
was the prerequisite cleanup. The **structural folds** (item 2) and this
cinematics layer are the same effort viewed two ways: folding bespoke overlays
onto `_renderNarrativeOverlay` *is* what lets us add consistent animation cheaply.
The sighting fold (§3) is the first step of both. Continue logging fold progress
in `STORY_NARRATION_SYSTEM.md`.

---

## 8. Test plan (leave-behind)

- **Fold guard (jsdom):** the sighting overlay renders via the canonical path,
  carries a `--sn-z-*` token (no literal), shows the lore lines, and fires
  `onDone` on dismiss.
- **Skippable:** simulating a skip resolves the cinematic Promise and proceeds.
- **Reduced-motion:** with the media query forced, the rich animation path is not
  taken (assert the fallback class/branch).
- **Determinism:** seeded flourish variance reproduces.

---

## 9. Decisions for the maintainer (this doc)

- **D9** v1 cinematics scope (recommend Pri 1–3: sighting fold + camp arrival +
  bond-maxed reveal; defer wild/catch/victory polish).
- Animation intensity / lengths (defaults ≤ 1.5s, skippable) — your call.
