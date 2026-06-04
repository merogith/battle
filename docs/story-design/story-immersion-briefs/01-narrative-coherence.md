# Brief 1 — Narrative Coherence & Causality

> You own the "why is this happening" backbone: per-event motivation, correct encounter
> framing, and the pass that kills the "out of nowhere" feeling. **This file is self-contained
> — you can run it in a clean chat with no other context.**

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
4. **Four parallel streams** (you own **Stream 1**):
   1. **Narrative Coherence & Causality** *(you)* — why each event happens; per-event
      motivation; encounter-framing matrix; kills "out of nowhere".
   2. **Dialogue & Writing** — clear, voiced, high-impact copy; rewrite confusing lines; voice guide.
   3. **Visual & Cinematic** — scenes, sprites, animation, pre-boss cinematics; fix the raid intro.
   4. **Storytelling Systems & Tools** — engine hooks the others need: setup-beat hook,
      choice/consequence, cinematic trigger, content schema.
   *How they relate:* Stream 4 is the foundation (provides hooks); **you (Stream 1) define what
   each event needs**; Streams 2 & 3 supply the words and the visuals. All four are written **in
   parallel as specs**; the dependency only bites at implementation time.

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
Make **every story event feel motivated and relevant.** Kill the "out of nowhere" feeling
by giving each event strong **local** setup — the player should always know **who, why, now,
and what's at stake** before a thing happens. Per the locked spine: **grounded episodic** —
local motivation per event, **no overarching-mystery retrofit.**

## The problem you own
Today the timeline (`STORY_EVENTS_RAW`) is mechanically `City → Battle → Battle → …`. Events
fire with no setup beat, so they read as arbitrary. Some are mis-framed (raids present as
trainer battles). Recurring characters (rival, professor, Mystery Figure) are under-used as
connective glue.

## Scope
- **In:** per-event motivation/causality; the setup-beat pattern; the encounter-framing
  matrix; light recurring-character throughlines; the prioritized coherence gap list.
- **Out:** writing the actual lines (→ Stream 2); building visuals (→ Stream 3); building engine
  tools (→ Stream 4); restructuring/reordering the timeline or premise (locked out by scope).

## Tasks
1. **Audit the timeline & intros.** Map `STORY_EVENTS_RAW` and the intro paths (cold-opens
   `STORY_COLD_OPENS`, the battle-intro path, `IntroQueue`, city-arrival scenes,
   `getStoryBeatForRow`). Anchors via `find-anchor`.
2. **Per-event "coherence card."** For each event fill: **WHO** (who's involved), **WHY**
   (motivation/cause), **NOW** (why here/now in the journey), **STAKES** (what's at risk),
   **NEXT** (how it sets up what follows). Mark which fields are **missing in-game today**.
3. **Prioritized gap list.** The 10–15 worst "out of nowhere / doesn't make sense /
   mis-framed" offenders, each with an anchor + a one-line diagnosis. Explicitly include the
   **raid → trainer-intro mismatch** and any other encounter-type mis-framings.
4. **Connective-tissue pattern.** A small, repeatable **setup beat** (a line or two / a short
   scene) that runs *before* an event and answers who/why/now/stakes. Keep it **light and
   local** (grounded-episodic). Specify *where* it hooks in so Stream 4 can build the hook
   **without touching timeline ordering**.
5. **Encounter-framing matrix.** Each encounter type → correct framing: **gym, trainer, rival,
   mini-raid, raid, boss, wild, legendary**. Define what each must communicate before battle.
   Specify the raid fix conceptually (raids = wild/raid framing, no trainer).
6. **Recurring-character glue (light).** When the rival / professor / Mystery Figure should
   reappear to remind the player of context and stitch events together — as **local
   callbacks**, not a grand arc.

## Deliverable
`docs/story-design/story-immersion/narrative-coherence.md`:
- **Current state** + the prioritized gap list (with anchors).
- The full **per-event coherence-card table**.
- The **setup-beat pattern** (definition + where it hooks).
- The **encounter-framing matrix**.
- **Real samples:** before/after coherence for the **5 worst offenders** — the current "out of
  nowhere" moment vs your reframed setup (concept + intended beat; Stream 2 writes final words).
- A short **handoff list:** what Stream 2 must write, Stream 3 must show, Stream 4 must build.

## Guardrails (stream-specific — the shared ones above also apply)
Reframe-and-connect only — **do not reorder or renumber `STORY_EVENTS_RAW`** (saves). Flag any
flow-ordering bug. You're producing a spec; no behavior change without sign-off.

## Definition of done
A maintainer can read your spec and know, for every event, *why it happens and what the player
should understand* — and exactly what the other three streams must produce to deliver it.
