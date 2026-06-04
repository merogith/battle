# Brief 2 — Dialogue & Writing

> You own clear, voiced, high-impact words: a voice guide, rewrites of confusing copy, and the
> lines for the setup beats and the biggest moments. **This file is self-contained — you can run
> it in a clean chat with no other context.**

## Shared context (same preamble in every brief)

**The game.** A single-page Pokémon-style battle sim (`battle.html`, ~61k-line monolith —
HTML + CSS + JS in one file). **Active scope: Story Mode (normal difficulty) only.** Design
canon: `STORY_MODE_FLOW.md`. Project rules: `CLAUDE.md` (read it). You have the repo — use the
`find-anchor` / `anchor` skill to resolve symbols → `file:line` (drift-tolerant; never hardcode
line numbers in your spec).

**The problem.** Maintainer's words: *"the stories feel so out of nowhere… each story event
[needs] to feel more relevant… stronger reasoning to the player — what / why / when / how /
who. Story feels confusing and much of the dialogue doesn't make sense."* Presentation is also
flat, and some encounters are **mis-framed** (e.g. raids show a **trainer** intro even though
raids are wild Pokémon). **Goal:** make story events, battles, and sequencing **coherent,
vivid, and immersive.**

**Locked design decisions (maintainer, 2026-06-03) — do not relitigate:**
1. **Reframe + connect, NOT a premise overhaul.** Keep the event lineup; add missing connective
   tissue, fix mismatched framing, polish dialogue + visuals. Do **not** restructure the
   timeline or rewrite the premise.
2. **Grounded episodic.** Events stay fairly standalone; the fix is strong **local** motivation
   per event (clear who / why / now / stakes). **No overarching-mystery retrofit.** Light
   recurring-character glue is welcome; a grand arc is not.
3. **Output = spec + real samples.** Deliver a design Markdown with **concrete examples baked
   in** (before/after rewrites, mockups, API usage, fix lists) for maintainer review **before
   any code ships**.
4. **Four parallel streams** (you own **Stream 2**):
   1. **Narrative Coherence & Causality** — why each event happens; per-event motivation;
      encounter-framing matrix; kills "out of nowhere".
   2. **Dialogue & Writing** *(you)* — clear, voiced, high-impact copy; rewrite confusing lines;
      voice guide.
   3. **Visual & Cinematic** — scenes, sprites, animation, pre-boss cinematics; fix the raid intro.
   4. **Storytelling Systems & Tools** — engine hooks the others need: setup-beat hook,
      choice/consequence, cinematic trigger, content schema.
   *How they relate:* Stream 4 is the foundation (provides hooks); Stream 1 defines *what* each
   event needs; **you (Stream 2) supply the words** and Stream 3 the visuals. All four are
   written **in parallel as specs**; the dependency only bites at implementation time.

**Shared guardrails (from `CLAUDE.md`):**
- **Out of scope — do not touch:** Online PvP (`online-pvp.js`), Quick Play, Battle Frontier /
  Gauntlet. Don't revive cut systems (Black Market, Caged God boss arc, the 8 tone-variants —
  **classic storyline only**).
- **No game-behavior change ships without maintainer sign-off** (damage, status, AI, balance,
  RNG semantics, any mechanic). **Flow-ordering bugs MUST be flagged** even if the maintainer
  "owns" the flow.
- **Saves are sacred:** never renumber `STORY_EVENTS_RAW`; schema changes go through one
  `SAVE_VER` bump + an idempotent `migrateStoryPreV*`. Read `STORY_MODE_FLOW.md` before touching flow.
- **Engineering:** seeded RNG (`storyRngNext`) for anything user-visible — never bare
  `Math.random`. Data-driven content under `data/*.json` via the early-`let` + `Object.assign`
  pattern (mind the sloppy-mode hazard — `battle.html` has no `'use strict'`). Helpers over
  duplication. Leave a deterministic jsdom test (`tests/helpers/load-engine.js`).
- **Align with the parallel Camp System spec** under `docs/story-design/camp/` (esp.
  `EVENT_CINEMATICS.md`) — don't duplicate it.

**First task (before any design):** do a **read-only audit** of your lane in the current code
(use `find-anchor`). Open your spec with a short **"current state"** section + a prioritized
problem list with anchors. Ground everything in what's actually there — no generic advice.

---

## Mission
Make the writing **clear and sensible** first, then **voiced and impactful**. Fix confusing
dialogue; give the narrator and recurring characters a consistent voice; write the actual
lines for the setup beats and the high-impact moments.

## The problem you own
*"Much of the dialogue doesn't make sense."* Lines fire without establishing who's speaking,
why, or what's at stake; voice is inconsistent; key moments don't land.

## Scope
- **In:** the voice/tone guide; rewriting confusing/flat lines; writing copy for Stream 1's
  setup beats; high-impact beat writing; meaningful dialogue choices (copy side); a
  data-driven home for dialogue.
- **Out:** deciding *which* events need setup or *why* (→ Stream 1); visual presentation
  (→ Stream 3); building the choice engine (→ Stream 4).

## Tasks
1. **Audit current dialogue.** Sample cold-opens, trainer/rival/professor/Mystery-Figure
   lines, story beats. Quote representative offenders and diagnose *why* each is confusing or
   flat. Anchors via `find-anchor`.
2. **Voice & tone guide.** Define the **narrator voice** + a short voice sheet per recurring
   character (rival, professor, Mystery Figure, generic trainers). Register: **grounded and
   coherent**, leaning **slightly edgier** (consistent with the camp tone choice) but
   **classic storyline only** — no revival of the cut tone-variants. Maintainer signs off on tone.
3. **Clarity rewrite pass.** Using Stream 1's gap list + coherence cards, rewrite the worst
   offenders so each line establishes **who's speaking, why, and the stakes.** Clarity beats
   cleverness.
4. **Write the setup-beat copy.** For Stream 1's setup-beat pattern, write the actual lines for
   a representative set of events (real samples).
5. **High-impact moments.** Pick the handful of beats that should hit hardest (a rival turn, a
   gym win, a Mystery-Figure reveal) and write them with weight. Design **2–3 meaningful
   dialogue choices** (copy + branches); Stream 4 provides the choice/consequence tool.
6. **Data-driven proposal.** Where dialogue is inline in `battle.html`, propose moving it to
   `data/*.json` pools (architecture preference); coordinate the schema with Stream 4.

## Deliverable
`docs/story-design/story-immersion/dialogue-and-writing.md`:
- **Current state** + diagnosed offenders (quoted, with anchors).
- The **voice/tone guide**.
- **Real samples:** before/after rewrites for a representative set (the 5 worst offenders from
  Stream 1 + a few setup beats), the high-impact beats, and the choice designs (with branches).
- The **data-driven dialogue schema** proposal (with Stream 4).

## Guardrails (stream-specific — the shared ones above also apply)
Tone = grounded-coherent-classic, slightly edgier; **maintainer signs off on copy** — surface
borderline lines, don't ship them. Keep spelling/diacritic consistency ("Pokémon"). No
behavior change without sign-off.

## Definition of done
Every sample line clearly answers who/why/stakes; the maintainer can approve a voice and a
batch of real rewrites that demonstrably fix the "doesn't make sense" problem.
