# Brief 4 — Storytelling Systems & Tools

> You own the engine capabilities the other three streams stand on: the setup-beat hook,
> choice/consequence, the cinematic trigger, and the data-driven content pipeline. **This file
> is self-contained — you can run it in a clean chat with no other context.**

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
4. **Four parallel streams** (you own **Stream 4**):
   1. **Narrative Coherence & Causality** — why each event happens; per-event motivation;
      encounter-framing matrix; kills "out of nowhere".
   2. **Dialogue & Writing** — clear, voiced, high-impact copy; rewrite confusing lines; voice guide.
   3. **Visual & Cinematic** — scenes, sprites, animation, pre-boss cinematics; fix the raid intro.
   4. **Storytelling Systems & Tools** *(you)* — engine hooks the others need: setup-beat hook,
      choice/consequence, cinematic trigger, content schema.
   *How they relate:* **you (Stream 4) are the foundation** (provide the hooks); Stream 1 defines
   *what* each event needs; Streams 2 & 3 supply the words and the visuals. All four are written
   **in parallel as specs**; the dependency only bites at implementation time — your APIs land first.

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
- **Design to the Craft Playbook** in `docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md`
  (foldback · C&C · flags/callbacks · chunking / "no dead nodes" · barks · resonance; **events =
  bottlenecks, camp = the diamond**) — the shared contract all four streams build on. You build
  the engine behind most of it; read it first.

**First task (before any design):** do a **read-only audit** of your lane in the current code
(use `find-anchor`). Open your spec with a short **"current state"** section + a prioritized
problem list with anchors. Ground everything in what's actually there — no generic advice.

---

## Mission
Build the **tools** that make higher-impact dialogue and richer storytelling *possible*: a way
to attach setup beats to events, choices with remembered consequences, a cinematic-trigger
hook, and a data-driven content pipeline — all without destabilizing saves or the battle engine.

## The problem you own
The other streams need hooks that don't exist cleanly yet: no light, data-driven way to inject
a per-event setup beat; choices don't reliably remember consequences for later callbacks;
cinematics aren't a reusable trigger. You make those real.

## Scope
- **In:** the setup-beat hook; the choice/consequence + story-state tool; the cinematic-trigger
  API; the data-driven content schema; the save-schema impact (one migration); the test plan.
- **Out:** authoring content (→ Streams 1/2/3). You provide APIs + tiny usage examples; they fill them.

## Tasks
1. **Audit current tools.** `_storyScene` (choices / `goto` / `onPick`), `sm.storyChoices` (what's
   remembered today), the 3-track system (`sm.tracks`), `IntroQueue`, scene dedup
   (`scenesShown` / `_storyRunSceneMark`). What each can already do; the gaps. Anchors via `find-anchor`.
2. **Setup-beat hook.** A lightweight, **data-driven** mechanism to attach a pre-event
   motivation beat to any event **without touching `STORY_EVENTS_RAW` ordering** (e.g. keyed by
   event id/row). This is what makes Stream 1's connective tissue implementable. Define the data
   shape + the trigger point.
3. **Choice & consequence / story-state tool.** Standardize choices that **remember** (extend
   `sm.storyChoices`) so later scenes can branch on past behavior (e.g. how the rival was
   treated). Keep it **grounded-episodic-friendly** — small local callbacks, not a giant
   branching tree. Define the read/write API Stream 2 uses.
4. **Cinematic-trigger hook.** A reusable API to fire a pre-battle / pre-boss cinematic and
   per-event animations (consumed by Stream 3). Build on the existing overlay engine; keep it
   Promise-based like the existing scene/casino pattern.
5. **Data-driven content pipeline.** A `data/*.json` schema for event beats / dialogue /
   cinematics, loaded via the **early-`let` + `Object.assign`** pattern (respect the sloppy-mode
   hazard — no `'use strict'` in `battle.html`). Coordinate the dialogue schema with Stream 2.
6. **Save-schema + tests.** Exactly one `SAVE_VER` bump + `migrateStoryPreV*` (idempotent) if
   state is added; a deterministic jsdom test plan (`tests/helpers/load-engine.js`) per tool.

## Deliverable
`docs/story-design/story-immersion/storytelling-systems.md`:
- **Current state** + tool-gap analysis (with anchors).
- Each **tool's API** (setup-beat hook, choice/consequence + story-state, cinematic trigger,
  content schema) — with a **real tiny usage example** that Streams 1/2/3 reference.
- The **save-schema impact** (migration sketch) and **test plan**.
- A **handshake table:** which API each other stream consumes.

## Guardrails (stream-specific — the shared ones above also apply)
No behavior change without sign-off; saves sacred (one migration, never renumber, idempotent);
seeded RNG; mind the sloppy-mode hazard (declare `let`/`const`, mutate via `Object.assign` /
`push`, never bare-reassign a loader placeholder); leave deterministic tests. You are the
**foundation** — keep APIs small and stable.

## Definition of done
The other three streams can write their specs against your APIs without guessing, and the
maintainer can see exactly what (if anything) touches the save schema and how it's tested.
