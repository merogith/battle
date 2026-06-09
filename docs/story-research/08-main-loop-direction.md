# 08 — Main Loop Arc: Locked Narrative Direction

*Continues the story-research dossier (`00`–`07`). Where `07 §1` proposed **options** for the
`main.*` time-loop spine, this file records the **decisions** taken with the maintainer and turns
them into per-scene direction the next session can build from.*

**Status: direction doc, not applied.** No `battle.html`, `STORY_SCENES`, dialogue JSON, or save
code is changed here. Per `CLAUDE.md`, story changes ship only with explicit sign-off; this captures
the *approved direction* so a later drafting pass can write prose against it. One small narrative-only
schema add is named in §7 — it, too, needs the normal sign-off before it's built.

---

## 1. The thesis — "An authorless trap with a human answer"

Every axis below was decided deliberately. They are mutually reinforcing; changing one breaks the others.

| Axis | Decision | What it means on the page |
|---|---|---|
| **Core** | Authorless trap **+** duty to the next traveler | Nobody built the loop. It just *is*, and it's old. The only agency is the gift forward. |
| **Escape** | **None, ever** | No true ending, no break, no out. The "ending" is never *escape* — only *what you do with the knowledge*. This is load-bearing. |
| **Reveal** | Gesture at replaying | The Mystery Figure is you; the proof is keyed to your own past play. The fourth wall *bends* toward the act of starting over — it never breaks. |
| **Tone** | **Dark content, calm register** | The house voice stays restrained/clinical; the *content* goes darker. The calm delivery makes graphic material land harder than exclamation would. |
| **Final choice** | **Remember vs Forget**, both costed | Remember: carry every loop's grief so the next you inherits the breadcrumbs. Forget: go free and blind, leave the next you nothing. |
| **Last beat** | **The choice authors the tone** | Remember → bittersweet (the gift mattered). Forget → cold (the camera stays on the cage). The player writes the ending's emotional key. |
| **Mechanics** | **Narrative only** | The "gift" the next loop inherits is text/diegetic, never a mechanical head-start (no free items, levels, or hints). |

The engine in one move: the game never lies about the cage, but it hands you the one freedom a trap
can't take — **what you make the next loop inherit.**

---

## 2. The cast of yous

There is no external villain and no separate "loop-master." Every figure that *knows* is **you** at a
different loop-depth:

- **The avatar** — this loop's you, walking the road.
- **The bench man** (`main.event1`) — **a past loop's you**, worn down; the one who stopped walking
  and now just sits and asks *"tell me how it ends this time."* He is the **remember-choice's endpoint
  made flesh**: a you who kept choosing to carry it until carrying it was all that was left. You
  **begin** each loop by meeting a worn you.
- **The Mystery Figure** (`main.mfReveal`, "It Was You") — the furthest you / **The First**, the origin
  of the loop. You **end** each loop confronting a you.

The road between the bench and the mask is the loop. This symmetry — *meet a you at both ends* — is the
arc's skeleton; the degradation tier (§4) is the bench man visibly accumulating that wear across runs.

> **Guard:** the bench man's identity is *implied and then confirmed at the reveal*, never stated up
> front. On a first pass he reads as a strange old man. The confirmation is the player realizing, in
> hindsight, that the bench man was always wearing their own future.

---

## 3. The breadcrumb — two-layer architecture

The dossier's `main.event2` conflates two jobs. We split them:

- **The PROOF** — what convinces *the player* this is a loop. Must be **impossible to author by anyone
  but the player.**
- **The GIFT** — the `main.loop.remember` sacrifice you choose to leave forward.

### Layer 1 — In-run diegetic wrongness (builds the *feeling*)

Within a single first playthrough, the loop is seeded by **qualitative wrongness**, never a counter:

- Negative space (`05 D26`): the town is always *slightly* too empty; an NPC references a conversation
  you don't remember having; a door is already unlocked.
- Restrained, calm-register — these are *noticed*, not announced. One per act, not wallpaper.
- These do **not** require cross-run tech; they work on run 1.

### Layer 2 — Cross-run residue (the undeniable PROOF)

The only breadcrumb that is **impossible to rationalize** is the player's *own past play, returned* —
because it can't be coincidence, dev flavor, or NPC knowledge:

- **The consequence of your *last run's ending choice* is visible in this run's world, before you
  understand why.** Chose *remember* last run → this run is a hair more haunted; the bench man's line
  lands like he's continuing a conversation. Chose *forget* → colder, cleaner, lonelier.
- The player notices the world responding to a decision made at the **end of a supposedly separate
  game.** Unrationalizable; authored by the player, not the dev; wires the proof straight into the
  capstone.
- Thematically exact: **replaying the game *is* the loop.** No escape, even at the meta layer.

> **Why not a tally / a future-self note / a name-knowing NPC?** A counter implies teleology (a finish
> line) and contradicts *no escape*. A predictive note becomes a gameplay hint (violates narrative-only)
> and is the most-worn loop trope. A name-knowing NPC makes the *NPC* the anomaly when the point is that
> **you** are. All three announce "THIS IS A LOOP" on first contact — failing the invisible-on-pass-1 test.

### First-run / loop-zero handling

On a player's very first run there is no prior choice, so Layer 2 is **null** — the run plays clean,
carried entirely by Layer 1. The residue only *exists* from the second playthrough on, which is the
intended payoff curve: the trap proves itself real for *the player* exactly when they reach for "new game."

---

## 4. The loop constant — three-tier model (80/20 anchor, `05 D29`)

1. **Static invariant (~20%)** — the **bench man's line** (`main.event1`), word-for-word every run:
   *"tell me how it ends this time."* A spoken-dialogue anchor is the subtlest possible (players don't
   instinctively treat dialogue as a clue), and the line already *is* the thesis statement.
2. **The drift (~80%)** — everything else mutates run to run; the existing `sm.tracks` 3-track system
   already supplies this variety.
3. **The creeping constant** — the craft move that separates a loop from a GIF: the bench man is always
   there, but **a little more worn each loop.** Something that should drift but doesn't / should be
   constant but subtly degrades. This is what makes repetition read as a *closing trap*, not a reset.

---

## 5. The fourth wall — diegetic "remembers across resets"

At `main.mfReveal`, the figure references that it remembers **what you keep doing** — starting over, the
road you keep walking again — in **fully in-world language.** It addresses your *persistence* without
ever naming *save*, *load*, *new game*, or the menu. The player feels seen; the fiction never cracks
(`05 D27`, the DDLC/NieR-E relocate-the-wall lever, kept diegetic).

> **Guard:** no menu-speak, no UI references. The figure "remembers across resets" the way a person
> remembers a recurring dream — from inside it.

---

## 6. The capstone — `main.loop.remember` (remember vs forget)

The ending is a choice with a **memory-vs-gift** cost currency, narrative only:

- **REMEMBER** — you carry every loop's grief, forever. The next you inherits the breadcrumbs (the
  world's residue, the bench man's recognition) — a real *narrative* head start, never a mechanical one.
  Cost: you bear the weight so a stranger (your next self) bears less. → **bittersweet** final beat: the
  gift mattered.
- **FORGET** — you're freed of the weight; the next you starts blind, no gift, fully alone. Cost: you
  spare yourself by abandoning a stranger. → **cold** final beat: the camera stays on the cage.

The **choice authors the final tone** — the game does not pre-decide whether the ending is warm or
bleak; the player does. And because escape is impossible, neither option is an *out*: both are ways of
*inhabiting* the trap. That is the whole emotional point.

---

## 7. Per-scene direction (mapped to real scene keys)

Resolve symbols fresh with the `anchor` skill — line numbers drift. Scene inventory from `06 §3`.

| Scene | Current | Locked direction |
|---|---|---|
| `main.event1` "How It Ends This Time" (Road 1) | Bench man, *"tell me how it ends this time"* | **The static anchor (§4-1).** Line stays word-for-word every run. He is a worn past-you (§2) — plant the resemblance, don't confirm. Apply the creeping-degradation tier: a touch more worn each loop. |
| `main.event2` "Welcome Back" (Road 3) | The sticker breadcrumb | **Demote from "the proof."** Keep as Layer-1 in-run wrongness only (calm, ignorable). The undeniable proof now lives in the cross-run residue (§3 Layer 2), not here. No tally. |
| `main.event3` / `main.battle1` (Road 5) | — | Layer-1 negative-space beat (§3): one thing *too* calm about something wrong. Restrained register. |
| `main.event4` / `main.battle2` (Road 7) | — | Mid-arc; one *new* loop fact surfaced (the one-piece-per-pass cadence, `05 D29`). |
| `main.event5` (Road 8) | — | Escalation rung; the wrongness the player first ignored starts to cohere. |
| `main.event6` (pre-E1) | — | The road tightening; the bench-man memory should echo here. |
| `main.event7` "He's Tired" (pre-Champion) | — | Strong existing beat — protect it. Reads forward to the bench man as a *you* who got tired. |
| `main.event8` "The Crown Isn't The Last Fight" (`fireAtEvent: Rival`) | — | Sets up that the crown is not the terminus — the loop has no terminus (no escape). |
| `main.event9` (post-HoF) | — | The hinge into the climax; the world's residue at its loudest before the mask. |
| `main.mfBattle` | The masked challenger fight | The furthest you / The First (§2). |
| `main.mfReveal` "It Was You" | *"you become me"* | **Add the diegetic replaying-gesture (§5).** Confirm the bench man was also you. One earned register-spike permitted here (dark content, calm voice). |
| `main.loop.run1` / `main.ending` (`main.loop.remember`) | forget / carry it forward | **The capstone (§6).** Sharpen the memory-vs-gift cost; the choice authors the final tone. Persist the outcome cross-run (§ below) so it becomes next run's proof. |

---

## The one build item (needs sign-off)

The cross-run residue (§3 Layer 2) is the *only* part that doesn't ride existing systems:

- `sm.storyChoices` is **per-run only**; the `main.loop.remember` outcome does **not** currently
  survive to the next run.
- `pbs_story_meta` (`readStoryMeta` / `writeStoryMeta`) already persists `completedRuns`, `pokedex`,
  `achievements`, `hofRecords`, etc. **A loop count already exists** (`completedRuns`) — we deliberately
  do **not** surface it as a tally (§3 rationale).
- **Add one additive, narrative-only field** to `_emptyStoryMeta()` — e.g. `lastLoopChoice: ''` —
  written at `main.ending`, read at the next run's cold open to select Layer-1 residue flavor. Additive
  meta fields are back-filled by `readStoryMeta`'s normalization, so **no `SAVE_VER` bump** is required.

---

## Guardrails (carry into any drafting pass)

- **Narrative only** — no mechanical effect from any breadcrumb, residue, or ending choice (the choice
  contract, `tests/suites/story-choice-contract.test.js`: ≤1 choice/scene, unique persistKey, never forks).
- **Classic-only story-tone lock** — do not revive the cut 8-tone layer
  (`tests/suites/story-tone-retirement.test.js`).
- **Save schema is safety-critical** — the meta field is additive; do not touch `migrateStoryPre*` or
  the per-run `SAVE_VER` chain for this.
- **Seeded RNG** — any run-to-run variation that's user-visible goes through `storyRngNext`, never bare
  `Math.random()`.
- **House voice survives the dial** — second-person present, horror-in-the-normalization, calm/clinical
  register. Explicit content is delivered *in that voice*; on the main track it is rationed to earned
  beats (`main.mfReveal`, the cost of remembering), never spectacle.
- **Anchor in what we own** (`05 D33`) — every breadcrumb lives in *our* systems (the sticker, the dex,
  the residue), never borrowed lore.
