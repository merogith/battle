# Story Immersion Initiative — Agent Brief Set (START HERE)

Shared context for **4 parallel agents**. Each agent: read this file first, then your
assigned brief. Each brief is self-contained — you can hand them out independently.

## The game
A single-page Pokémon-style battle sim (`battle.html`, ~61k-line monolith —
HTML + CSS + JS in one file). **Active scope: Story Mode (normal difficulty) only.**
Design canon lives in `STORY_MODE_FLOW.md`; project rules in `CLAUDE.md` (read it).

## The problem we're solving
Maintainer's words: *"the stories feel so out of nowhere… each story event [needs] to
feel more relevant… stronger reasoning to the player — what / why / when / how / who.
Story feels confusing and much of the dialogue doesn't make sense."* Plus: presentation
is flat, and some encounters are **mis-framed** (e.g. raids show a **trainer** intro even
though raids are wild Pokémon, not trainer battles).

**Goal:** make story events, battles, and sequencing **coherent, vivid, and immersive** —
every event clearly motivated (who / why / now / stakes), dialogue clear and voiced,
presentation strong, framing correct.

## Locked design decisions (maintainer, 2026-06-03)
1. **Scope = Reframe + connect** (NOT a premise overhaul). Keep the event lineup; add the
   missing connective tissue, fix mismatched framing, polish dialogue + visuals. Do **not**
   restructure the timeline or rewrite the premise.
2. **Spine = Grounded episodic.** Events stay fairly standalone; the fix is **strong LOCAL
   motivation per event** (clear who / why / now). **No single overarching-mystery retrofit.**
   Light recurring-character glue is welcome; a grand arc is not.
3. **Output = Spec + real samples.** Each agent delivers a **design/plan Markdown with
   concrete examples baked in** (before/after rewrites, mockups, API usage, fix lists) for
   maintainer review **before any code ships**.
4. **4 parallel streams** (below).

## The 4 briefs
| # | Stream | File | Owns |
|---|--------|------|------|
| 1 | Narrative Coherence & Causality | `01-narrative-coherence.md` | Why each event happens; per-event motivation; encounter-framing matrix; kills "out of nowhere" |
| 2 | Dialogue & Writing | `02-dialogue-and-writing.md` | Clear, voiced, high-impact copy; rewrite confusing lines; voice guide |
| 3 | Visual & Cinematic | `03-visual-and-cinematic.md` | Scenes, sprites, animation, pre-boss cinematics; fix the raid intro; per-event visual beats |
| 4 | Storytelling Systems & Tools | `04-storytelling-systems.md` | Engine tools the others need: setup-beat hook, choice/consequence, cinematic hook, content schema |

**How they relate:** Stream 4 (Systems) is the foundation — it provides the hooks. Stream 1
(Coherence) defines *what* each event needs. Streams 2 (Writing) and 3 (Visual) supply *the
words* and *the visuals*. All four are written **in parallel as design specs**; the
dependency only bites at implementation time (Systems' APIs land first).

## Shared guardrails (all 4 — from `CLAUDE.md`)
- **Out of scope — do not touch:** Online PvP (`online-pvp.js`), Quick Play, Battle Frontier /
  Gauntlet. Don't revive cut systems (Black Market, the Caged God boss arc, the 8 tone-variants
  — **classic storyline only**).
- **No game-behavior change ships without maintainer sign-off** (damage, status, AI, balance,
  RNG semantics, any mechanic). Behavior-preserving refactors need direction approval only.
  **Flow-ordering bugs MUST be flagged** even if the maintainer "owns" the flow.
- **Saves are sacred:** never renumber `STORY_EVENTS_RAW`; schema changes go through one
  `SAVE_VER` bump + a `migrateStoryPreV*` (idempotent). Read `STORY_MODE_FLOW.md` before
  touching flow.
- **Engineering:** seeded RNG (`storyRngNext`) for anything user-visible — never bare
  `Math.random`. Data-driven content under `data/*.json`, loaded via the early-`let` +
  `Object.assign` pattern (mind the sloppy-mode hazard — `battle.html` has no `'use strict'`).
  Helpers over duplication. Leave a deterministic jsdom test (`tests/helpers/load-engine.js`).
- **Anchors:** resolve symbols → `file:line` with the **`find-anchor` / `anchor` skill**
  (drift-tolerant). Do **not** hardcode line numbers in your spec.
- **There is a parallel Camp System spec** under `docs/story-design/camp/` (esp.
  `EVENT_CINEMATICS.md`) — align with it, don't duplicate it.
- **Deliverable for every stream:** a Markdown spec at
  `docs/story-design/story-immersion/<your-stream>.md`, with **real samples**, ready for review.

## First task for every agent
Before designing, do a **read-only audit** of your lane in the current code (use
`find-anchor`). Open your spec with a short **"current state"** section + a prioritized
problem list with anchors. Ground everything in what's actually there — no generic advice.
