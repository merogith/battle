# Kickoff brief — Story Overlay Unification (§6)

> **Paste this whole file as the first message to a fresh Claude Code session on
> the `merogith/battle` repo.** It is self-contained. Work on a new short-lived
> branch off `main` (e.g. `claude/overlay-unification`).

---

## Mission

Collapse the game's **~19 parallel story-overlay presentation paths** onto the
**one** canonical renderer (`_renderNarrativeOverlay`) + the `--sn-*` design
tokens + the `--sn-z-*` z-index scale.

This is **phase 2** of the Story Narration unification. **Phase 1 is DONE and on
`main`:** all 198 story scenes were converted to a structured/interactive schema
(4-act scenes, choices, branch payoffs, structured battle outros), verified
end-to-end. Phase 2 is the *plumbing* half: every other overlay still renders
through its own bespoke style block and an ad-hoc z-index, so boxes look
different and can paint behind/over each other.

**This is a behaviour-preserving refactor.** Same visuals, same flow, one engine
underneath. Not a redesign. Not a content change.

---

## Read first (≈10 min, in order)

1. **`CLAUDE.md`** — non-negotiable project rules. Key points for this job:
   - **Active scope = Story mode (normal) ONLY.** `online-pvp.js`, Quick Play, and
     Battle Frontier / Gauntlet ("Pits") are **permanently out of scope** — do not
     migrate their overlays; tag them out-of-scope if you touch them.
   - **Sloppy-mode hazard:** `battle.html` has no `'use strict'`. Never reassign a
     module-level placeholder (`X = fetched`); mutate (`Object.assign(X, …)` /
     `X.push(…)`). Bare assignment silently makes a window global.
   - **Approval rules:** behaviour-preserving refactors need sign-off on the
     *direction* before a sweep, and on any *user-visible* delta. No flow / balance
     / mechanic changes (those are out of scope here anyway).
   - Use seeded RNG (`storyRngNext`) for anything user-visible, never `Math.random()`.
2. **`docs/story-design/STORY_NARRATION_SYSTEM.md`** — THE contract you migrate
   onto. §1 (tokens + z-scale), §1–§2 (`_renderNarrativeOverlay` + the
   anti-stacking queue), §6 (this roadmap), §7 (the test surface). Source of truth.
3. **`tests/integration/story-narration-system.test.js`** — 26 tests incl. **two
   end-to-end DOM tests** that drive a scene through the live overlay. Your
   migrations extend this file with the same pattern.

> Line numbers below will drift (battle.html is ~58k lines and edited often).
> Resolve symbols with the repo's **`anchor`** skill (function/const name →
> `file:line`) instead of trusting the numbers.

---

## The canonical target (what everything folds onto)

- **Renderer:** `_renderNarrativeOverlay(opts)` (~`battle.html:47526`). One
  gold-nameplate `.story-dialog-*` overlay, **serialized** by an anti-stacking
  queue (only one live at a time; a second request queues). Supported `opts`:
  `sprite, name, nameplate, banner (+bannerClass), lines[], choices[],
  continueLabel, metaKey (per-run dedupe), accent, toneClass, sfx, onDone`.
  Choices persist to `sm.storyChoices[persistKey]`.
- **Design tokens:** CSS `:root`, search `--sn-` (~`battle.html:2170`).
- **z-index scale** (defined ~`battle.html:2170`, **use these, never literals**):

  | token | value | layer |
  |---|---|---|
  | `--sn-z-scrim` | 1200 | modal alert / confirm scrim |
  | `--sn-z-battle-banner` | 9000 | in-battle gimmick banner |
  | `--sn-z-overlay` | 9998 | **story narrative overlay (canonical)** |
  | `--sn-z-spotlight` | 9999 | victory card / boss banner |
  | `--sn-z-toast` | 10001 | toasts (ride above overlays) |

## Current state (measured — this is the problem)

`var(--sn-z…)` is referenced in **exactly one place** (the canonical overlay).
**Everything else is an ad-hoc z-index literal.** A sweep of `battle.html` shows
high literals at: `8000, 9000, 9100, 9990, 9998 (×several), 9999 (×7 in the
boss-banner block), 15000, 20000, 99999`, and one `2147483646`. These collide —
the historical "overlay paints behind/over the wrong thing" bug. Reproduce it
yourself: `grep -nE 'z-index:\s*[0-9]{4,}' battle.html`.

---

## Inventory — overlays to fold (resolve each with `anchor`)

**IN SCOPE (story-mode presentation):**

| function | ~line | what it is |
|---|---|---|
| `_storyScene` | 44920 | Daycare / Fight Club multi-beat scenes — **biggest fish** |
| `_showStoryTutorialScene` | 42060 | mechanics-unlock tutorials |
| `_runStoryColdOpen` | 42479 | run cold-opens |
| `_showIntroRivalColdOpen` | 47878 | rival intro cold-open |
| `_showFirstSightingLoreOverlay` | 47823 | legendary-sighting cinematic |
| `_showBossBanner` | 43115 | in-battle boss banner (z 9999 ×7) |
| `showGimmickBanner` | 15458 | in-battle gimmick banner (z 9000) |
| `showBattleIntro` | 48256 | pre-battle bookend |
| `showVictoryOverlay` | 48795 | post-battle victory card (spotlight tier) |
| `evolutionScene` | 29773 | evolution cinematic |
| `_storyHatchRevealScene` | 45293 | egg hatch reveal |
| `_daycareIdleScene` | 45258 | daycare idle scene |
| `_casinoShowPrizeBanner` | 52338 | casino prize banner |
| `_storyAchievementToast` | 37021 | achievement toast → `--sn-z-toast` |
| `_maybeShowSaveToast` | 37586 | save toast (currently **z 99999**) → `--sn-z-toast` |
| `_storyDispatchQueuedUnlockToasts` | 45059 | unlock toasts → `--sn-z-toast` |
| modal **alert / confirm** | grep it | scrim-tier modal; `--sn-z-scrim` is defined for it but find the consumer (no `showGameAlert` symbol by that name — locate the actual fn) |

**OUT OF SCOPE — do NOT migrate** (tag out-of-scope if you must touch): anything
in `online-pvp.js`; Quick Play paths; Battle Frontier / Gauntlet — the **`_pits*`**
overlays (`_pitsShowDraftOverlay` etc.) and `_colressVoucherBanner` are
Frontier/post-game ("Frontier / Pits", see ~`battle.html:48608`). Confirm against
`CLAUDE.md` before deciding any ambiguous one is in scope.

---

## Migration plan (one overlay per PR, lowest-risk first)

**Per-step recipe:**
1. Pick ONE overlay. Read it; identify its bespoke style block + z-index literal.
2. Map its content onto `_renderNarrativeOverlay` opts. If it genuinely needs
   something the renderer lacks, extend the renderer **minimally and generically**
   (most needs — sprite, banner, accent, sfx — already exist).
3. Replace the bespoke render with a `_renderNarrativeOverlay` call; **delete the
   now-dead style block** (grep the class names to confirm they're unused).
4. Put its layer on the correct `--sn-z-*` token (no literal).
5. Add/extend a DOM test in `story-narration-system.test.js`: the thing renders
   through the canonical overlay, lands on the right z-tier, dismisses cleanly,
   doesn't stack.
6. Verify the flow is **visually identical**. Get the maintainer's sign-off on the
   direction before the first sweep, and on any visible change.

**Suggested order (risk-ascending):**
1. **Toasts** (`_storyAchievementToast`, `_maybeShowSaveToast`,
   `_storyDispatchQueuedUnlockToasts`) → all on `--sn-z-toast`. Isolated, cleanest.
2. **z-index literal sweep** in story paths → tokens (mechanical, high value).
3. **Cold opens** (`_runStoryColdOpen`, `_showIntroRivalColdOpen`) + the
   **sighting cinematic**.
4. **Tutorial scenes** (`_showStoryTutorialScene`).
5. **`_storyScene`** (Daycare / Fight Club) — the largest bespoke block.
6. **Battle bookends/banners** (`showBattleIntro`, `showVictoryOverlay`,
   `_showBossBanner`, `showGimmickBanner`) — **most visible, do last, carefully.**

---

## How to verify

- `npm test` stays green. Baseline today: **1206 pass / 0 fail**, 26 narration
  tests. (First boot of the jsdom harness ~2.5s, cached after.)
- jsdom end-to-end: boot via `tests/helpers/load-engine.js`, reach
  `window.__narrationTest`, drive the migrated overlay. Copy the pattern of the two
  `e2e:` tests at the bottom of `story-narration-system.test.js` (find a
  `[data-narr-body]` body, click `[data-narr-continue]` / `[data-narr-choice-idx]`,
  assert content + `isNarrationLive()` / `narrationQueueDepth()` + no stacking).

## Definition of done (§6)

- Every **in-scope** story overlay renders through `_renderNarrativeOverlay`.
- `var(--sn-z*)` is the **only** source of high z-index in story paths — no ad-hoc
  literals ≥ 1200 remain in the migrated code.
- Each migration deleted its bespoke style block and left a deterministic test.
- `STORY_NARRATION_SYSTEM.md` §6 items checked off; the doc's status updated.
- Full suite green throughout.

## Your first actions

1. `npm test` — confirm the green baseline.
2. `grep -nE 'z-index:\s*[0-9]{4,}' battle.html` — see the literal landscape; map
   each high literal to a function and an intended `--sn-z-*` tier.
3. Read `_renderNarrativeOverlay` and `_storyScene` in full.
4. **Propose the migration order + the first PR (recommend: toasts) to the
   maintainer and get direction sign-off before editing.** Then execute one
   overlay per PR.
