# Story Narration System — unified visual + narrative language

> **Status:** ROLLOUT COMPLETE — all 198 story scenes converted to the structured
> schema (10 villain arcs + the 14-scene main spine + 8 extra arcs; **0 flat scenes
> remain**). The render/interaction pipeline is verified end-to-end in jsdom (26
> tests). This doc is the contract every story scene is built on. The *remaining*
> unification work — folding the **other** overlays (`_storyScene`, tutorials,
> cold-opens, banners) onto this one renderer — is still open; see §6. Pairs with
> `docs/STORY_OVERHAUL_PLAN.md` §3–§4.

## 0. Why this exists

Story narration had accreted **~19 parallel presentation paths** across **5
z-index layers** with no shared registry — `_renderNarrativeOverlay`,
`_storyScene`, `_showStoryTutorialScene`, `showBattleIntro`, `showVictoryOverlay`,
`showGameAlert`, toasts, banners, … — so boxes looked different, overlays could
stack, and story **events** were flat `{title, body}` text with **no arc and no
interaction**, even though the overlay engine already supported choices.

This system unifies all of that onto **one visual language** and gives story
events a **fixed, solid structure** (intro → development → climax → outro) plus
**player interaction** (choices with self-contained consequences).

## 1. The one visual language (design tokens)

Single source of truth, in the CSS `:root` block (search `--sn-`):

| Token | Value | Use |
|---|---|---|
| `--sn-gold` / `--sn-gold-deep` | `#ffd54f` / `#ffb300` | nameplate gradient / accent |
| `--sn-frame` | `#555` | 2px dialog frame |
| `--sn-box-hi` / `--sn-box-lo` | `#1e2030` / `#12141e` | dialog box gradient |
| `--sn-muted` | `#8b9bb4` | progress dots / sub-labels |

**z-index scale** (deliberate layering, low → high). Use these, never ad-hoc
literals:

| Token | Value | Layer |
|---|---|---|
| `--sn-z-scrim` | 1200 | modal alert / confirm |
| `--sn-z-battle-banner` | 9000 | in-battle gimmick banner |
| `--sn-z-overlay` | 9998 | **story narrative overlay (canonical)** |
| `--sn-z-spotlight` | 9999 | victory card / boss banner |
| `--sn-z-toast` | 10001 | toasts (ride above overlays) |

The canonical renderer is **`_renderNarrativeOverlay`** — the gold-nameplate
`.story-dialog-*` box. It is the single overlay every narration path should fold
onto. It already supports: `sprite`, `nameplate`, `banner` (+ `bannerClass`),
`lines`, `choices`, `continueLabel`, `metaKey` (per-run dedupe), `onDone`.

## 2. Anti-stacking overlay queue

`_renderNarrativeOverlay` now serializes: only one overlay is live at a time; a
second request **queues** and mounts when the first dismisses. Sequential flows
(the act sequencer, cold-open chains) are unaffected because each overlay has
already dismissed before the next is requested — the queue only engages when
overlays genuinely overlap (the historical bug). Introspection for tests:
`__narrationTest.narrationQueueDepth()` / `.isNarrationLive()`.

## 3. The structured scene schema

A `STORY_SCENES[key]` entry stays **backward compatible**: a bare
`{ title, body }` renders exactly as before. To upgrade a scene, add an `acts`
array (and, for battles, an `outro`). Everything is declarative data.

```js
"villain.rocket.event2": {
  title: "He Just Drives",          // steady chapter nameplate across all acts
  body:  "…",                        // legacy flat fallback — keep it
  acts: [
    { phase: "intro",       lines: ["…", "…"] },
    { phase: "development", lines: ["…"] },
    { phase: "climax",
      lines: ["The situation, framed for a decision."],
      choice: {                       // ONE choice per scene, self-contained
        persistKey: "villain.rocket.driver",
        options: [
          { label: "Lean on him.",      value: "leaned", reply: ["…consequence text…"] },
          { label: "Let him drive.",    value: "freed",  reply: ["…other consequence…"] }
        ]
      }
    },
    { phase: "outro",
      branches: [                     // react to an EARLIER choice
        { when: { key: "villain.rocket.driver", eq: "freed" }, lines: ["…"] },
        { lines: ["…default (no/other choice)…"] }   // when-less = default, put last
      ]
    }
  ]
}
```

Battle scenes additionally carry a structured aftermath that supersedes the old
regex-scraped `STORY_POST_SCENES`:

```js
"villain.rocket.boss": {
  title: "Giovanni",
  body:  "…",                 // legacy (may still hold "Post-fight - …" markers)
  acts:  [ /* pre-fight intro arc — NO boss-mechanic telegraph text here */ ],
  outro: { win: ["…aftermath line…", "…"] }
}
```

### Rules

- **`phase`** is documentation only (the renderer shows progress dots, not a
  gamey "CLIMAX" caption). Keep it for legibility.
- **One `choice` per scene.** The pick swaps in its `reply` (the self-contained
  consequence) and is remembered in `sm.storyChoices[persistKey]`. It **never**
  forks which beat/battle fires next — fully-forked timelines are out of scope.
- **`branches`** is how a *later* beat reacts to an *earlier* choice. First
  matching `when:{key,eq}` wins; the when-less entry is the default (put it last).
- **Battle `acts`** render as the pre-fight scene; **`outro.win`** as the
  post-fight aftermath. Keep boss-mechanic telegraphs (e.g. "Phase 3 at 25%")
  **out** of the acts — mechanics are a separate system and out of scope here.

### Rendering pipeline

```
event beat  → _tryFireRoadStoryBeats → _playStoryBeatQueue → _playStoryBeatScene
battle beat → enterBattleEvent (pre) → _playStoryBeatScene          (acts ⇒ pre-fight)
            → onBattleEnd (win)      → _playPostBattleScene          (outro.win)
                                   ↘ _playSceneActs ⇒ _renderNarrativeOverlay (per act)
```

`_playStoryBeatScene` auto-detects `acts` and routes to `_playSceneActs`; flat
scenes keep the legacy single-overlay render. No call sites changed.

## 4. Preview / dispatch parity (a FLOW fix)

The "up next" pill used to show the rolled trainer while the battle showed the
canon character (Giovanni, Proton, …), because `BEAT_CANON_TRAINER` swaps the
trainer in `enterBattleEvent` *after* the preview was computed.
`_canonTrainerForUpcomingBattle()` now resolves the canon name from the **same**
source the dispatcher uses (`_activeBattleBeatForCurrentRow` + `BEAT_CANON_TRAINER`),
so label == reality. Used by `_storyEventRowToUpNext` for the imminent battle.

## 5. What's converted

**Everything — all 198 scenes, 0 flat remaining:**

- **10 villain arcs** (rocket, magma, aqua, galactic, plasma, flare, skull, yell,
  macroCosmos, star) — every event, both mid-battles, the mini-boss, and the boss.
  One interactive choice + a cross-scene branch payoff per arc; structured
  boss/admin `outro.win`; roster (`Lead - …`) and boss-mechanic telegraph text
  stripped out of the pre-fight acts (kept only on the legacy `body`).
- **The 14-scene main spine** — loop foreshadowing → the "it was you all along /
  The First" reveal (a full multi-act build) → the Run #1 ending (with a
  remember-vs-forget choice). The established loop canon is preserved exactly.
- **8 extra (horror) arcs** (cubone, yamask, hypno, phantump, mimikyu, drifloon,
  parasect, mewtwo) — event spines, both mid-raids, the climactic raid `outro.win`,
  one choice + an ending branch each, tone matched per arc.

The **Team Rocket** arc is still the clearest reference: `event2` (choice →
`villain.rocket.driver`) pays off in `event4` and `ending`; `boss` shows pre-fight
acts + `outro.win`. Every other arc follows the same shape.

## 6. Roadmap to finish the unification

1. ~~**Convert the remaining scenes** to `acts`.~~ **DONE** — all 198 scenes
   (10 villain arcs · the main spine · 8 extra arcs) converted against this schema,
   guarded by `tests/integration/story-narration-system.test.js`.
2. **Fold the other overlays onto `_renderNarrativeOverlay` + the tokens**:
   `_storyScene` (Daycare/Fight Club), `_showStoryTutorialScene`,
   `_showIntroRivalColdOpen`, the legendary-sighting cinematic, boss banners.
   Each migration deletes a bespoke style block.
3. ~~**Route the overlays onto the z-scale**~~ **z-index tokens DONE.**
   Every story-overlay z-index literal now resolves through `var(--sn-z-*)` —
   scrim (`.modal`), battle-banner (`.gimmick-banner`), overlay (city-arrival /
   city0 cold-open / wander / tutorial / evolution / legendary-sighting /
   `_storyScene` Daycare–Fight-Club engine / daycare drop-off), spotlight (boss
   banner / battle intro / victory card / first-sighting / Hall-of-Fame), toast
   (`#toast-host` + the save pill). The two formerly off-scale narrative overlays
   (`_storyScene` z10000, `_daycareOpenDropOff` z9990) were folded onto the
   overlay tier — they live in the city hub and never co-occur with the
   spotlight-tier battle cards, so stacking is unchanged in practice. Token
   consumers went 1 → 18; no ad-hoc literal ≥ 1200 remains in a story narrative
   path. Guarded by `tests/suites/overlay-zindex-tokens.test.js` and a
   live-overlay DOM check in the integration suite. **Still pending:** the casino
   banners (`.casino-prize-banner` z9100, `.casino-jackpot-overlay` z9000) are in
   active scope but off-scale — a small follow-up once their tier is chosen.
   **Out of scope:** the Frontier/Pits overlays.
4. **Battle wrapper**: give every boss/raid a structured `outro` (retire the
   regex `STORY_POST_SCENES` once all are converted).

## 7. Test surface

`window.__narrationTest` (jsdom harness only) exposes the schema resolvers
(`resolveActLines`, `resolveActChoices`, `sceneProgressDots`), the overlay
(`renderNarrativeOverlay`, queue introspection), the scene players
(`playStoryBeatScene`, `playPostBattleScene`), and the parity helpers
(`canonTrainerForUpcomingBattle`, `storyEventRowToUpNext`,
`activeBattleBeatForCurrentRow`, `roadForArrayIdx`). See
`tests/integration/story-narration-system.test.js` — **27 tests**, including
**end-to-end DOM** tests that drive a scene through the live overlay (acts →
choice → persistence → reply swap → cleared overlay → cross-scene branch), a
completion invariant (every scene has `acts` **and** a legacy `body`), and a
live-overlay z-tier check (the canonical overlay carries `var(--sn-z-overlay)`,
never a literal). The z-index token contract itself is locked source-level in
`tests/suites/overlay-zindex-tokens.test.js` — **6 tests** (tokens defined,
scale strictly ascending, every migrated overlay on its token).
