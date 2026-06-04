# Brief 3 — Visual & Cinematic

> You own scenes, sprites, animation, cinematics, and correct encounter framing — including the
> raid trainer-intro fix. **This file is self-contained — you can run it in a clean chat with no
> other context.**

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
4. **Four parallel streams** (you own **Stream 3**):
   1. **Narrative Coherence & Causality** — why each event happens; per-event motivation;
      encounter-framing matrix; kills "out of nowhere".
   2. **Dialogue & Writing** — clear, voiced, high-impact copy; rewrite confusing lines; voice guide.
   3. **Visual & Cinematic** *(you)* — scenes, sprites, animation, pre-boss cinematics; fix the
      raid intro.
   4. **Storytelling Systems & Tools** — engine hooks the others need: setup-beat hook,
      choice/consequence, cinematic trigger, content schema.
   *How they relate:* Stream 4 is the foundation (provides hooks); Stream 1 defines *what* each
   event needs; Stream 2 supplies the words and **you (Stream 3) supply the visuals**. All four
   are written **in parallel as specs**; the dependency only bites at implementation time.

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
Strengthen narration with **visual beats, animations, and cinematics**, and make **encounter
framing correct and clean** — every encounter type *looks* like what it is.

## The problem you own
Presentation is flat and some encounters are mis-framed. Concretely: **mini-raids and regular
raids show a trainer appearing before the battle**, but raids are wild Pokémon — that's
confusing and wrong. Boss fights have no build-up. Events lack visual setup.

## Scope
- **In:** the encounter-framing matrix (visual side) incl. the **raid trainer-intro removal**;
  **pre-boss cinematics**; a per-event visual-beat catalogue; an asset/reuse plan; building on
  the existing narration overlay + the camp `EVENT_CINEMATICS.md` POC.
- **Out:** the words (→ Stream 2); *why* events happen (→ Stream 1); the underlying
  cinematic-trigger API (→ Stream 4, which you consume).

## Tasks
1. **Audit current presentation.** The narration overlay (`_renderNarrativeOverlay`,
   `_storyScene`), `StoryFx`/SFX vocabulary, sprite + `bg_<type>` background assets, and
   existing cinematics (the legendary-sighting fold; the camp cinematics spec at
   `docs/story-design/camp/EVENT_CINEMATICS.md`). What's reusable. Anchors via `find-anchor`.
2. **Fix encounter framing.** Locate where the **raid** path shows a trainer reveal and specify
   the change so **mini-raids + regular raids use wild/raid framing (no trainer)**. Produce the
   **visual framing matrix:** gym / trainer / rival / mini-raid / raid / boss / wild / legendary
   → its correct visual intro. (Pairs with Stream 1's matrix.)
3. **Pre-boss cinematics.** Design a reusable **build-up cinematic** before boss battles (define
   the "boss" set with Stream 1). Specify the template — frames, timing, SFX — on the existing engine.
4. **Per-event visual-beat catalogue.** Small animations / scene visuals per event type (city
   arrival, rival appears, gym, route, legendary, mastery/title reveals) — extend the
   `EVENT_CINEMATICS.md` POC; reuse the overlay engine.
5. **Asset & reuse plan.** What existing sprites/backgrounds to reuse; where a cheap effect
   (CSS/transform, sprite recombination, portrait/emotion framing) buys the most immersion
   **without bloating** the 4 MB file or adding heavy art.

## Deliverable
`docs/story-design/story-immersion/visual-and-cinematic.md`:
- **Current state** + reusable-engine inventory (with anchors).
- The **visual framing matrix** + the **raid-fix plan** (the exact mechanism / where to change).
- The **pre-boss cinematic template**.
- The **per-event visual-beat catalogue**.
- **Real samples:** described/mocked frames (ASCII layout or step-by-step frame description)
  for the pre-boss cinematic + 2–3 event beats, so the maintainer can picture them.
- The **asset/reuse plan**.

## Guardrails (stream-specific — the shared ones above also apply)
Reuse the existing overlay/scene engine; seeded RNG (`storyRngNext`) for any variance; keep
changes behavior-preserving where you can and **flag the raid-framing change for sign-off** (it
alters an encounter's presentation). No asset bloat.

## Definition of done
The maintainer can approve the raid fix, a pre-boss cinematic, and a catalogue of per-event
visual beats — each described concretely enough to implement on the existing engine.
