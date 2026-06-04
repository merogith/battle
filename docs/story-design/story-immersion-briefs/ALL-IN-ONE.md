# Story Immersion Initiative — All Four Streams (single-agent edition)

> **Use this file when you want ONE agent to run the whole initiative in one clean chat.**
> It contains the shared context once, then all four stream briefs. If you'd rather split the
> work, hand out `01`–`04` instead — each of those is individually self-contained.
>
> **You (the agent) are doing ALL FOUR streams.** Produce **four separate deliverable docs**
> (paths listed under each stream). The work is substantial — you may tackle the streams
> sequentially in the order **4 → 1 → 2 → 3** (foundation first), but write each as its own
> standalone spec. Do the read-only audit step for each lane before designing it.

## Shared context

**The game.** A single-page Pokémon-style battle sim (`battle.html`, ~61k-line monolith —
HTML + CSS + JS in one file). **Active scope: Story Mode (normal difficulty) only.** Design
canon: `STORY_MODE_FLOW.md`. Project rules: `CLAUDE.md` (read it). You have the repo — use the
`find-anchor` / `anchor` skill to resolve symbols → `file:line` (drift-tolerant; never hardcode
line numbers in your specs).

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
4. **Four parallel streams** (all yours, in this run):
   1. **Narrative Coherence & Causality** — why each event happens; per-event motivation;
      encounter-framing matrix; kills "out of nowhere".
   2. **Dialogue & Writing** — clear, voiced, high-impact copy; rewrite confusing lines; voice guide.
   3. **Visual & Cinematic** — scenes, sprites, animation, pre-boss cinematics; fix the raid intro.
   4. **Storytelling Systems & Tools** — engine hooks the others need: setup-beat hook,
      choice/consequence, cinematic trigger, content schema.
   *How they relate:* Stream 4 is the foundation (provides hooks); Stream 1 defines *what* each
   event needs; Streams 2 & 3 supply the words and the visuals. Stream 4's APIs land first at
   implementation time, which is why you should spec it first.

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

**First task per stream (before any design):** do a **read-only audit** of that lane in the
current code (use `find-anchor`). Open each spec with a short **"current state"** section + a
prioritized problem list with anchors. Ground everything in what's actually there — no generic advice.

---

# Stream 1 — Narrative Coherence & Causality

**You own the "why is this happening" backbone.**

## Mission
Make **every story event feel motivated and relevant.** Kill the "out of nowhere" feeling by
giving each event strong **local** setup — the player should always know **who, why, now, and
what's at stake** before a thing happens. Grounded episodic — local motivation per event, **no
overarching-mystery retrofit.**

## The problem you own
Today the timeline (`STORY_EVENTS_RAW`) is mechanically `City → Battle → Battle → …`. Events
fire with no setup beat, so they read as arbitrary. Some are mis-framed (raids present as
trainer battles). Recurring characters (rival, professor, Mystery Figure) are under-used as
connective glue.

## Scope
- **In:** per-event motivation/causality; the setup-beat pattern; the encounter-framing matrix;
  light recurring-character throughlines; the prioritized coherence gap list.
- **Out:** writing the actual lines (→ Stream 2); building visuals (→ Stream 3); building engine
  tools (→ Stream 4); restructuring/reordering the timeline or premise (locked out by scope).

## Tasks
1. **Audit the timeline & intros.** Map `STORY_EVENTS_RAW` and the intro paths (cold-opens
   `STORY_COLD_OPENS`, the battle-intro path, `IntroQueue`, city-arrival scenes,
   `getStoryBeatForRow`). Anchors via `find-anchor`.
2. **Per-event "coherence card."** For each event fill: **WHO / WHY / NOW / STAKES / NEXT.** Mark
   which fields are **missing in-game today**.
3. **Prioritized gap list.** The 10–15 worst "out of nowhere / doesn't make sense / mis-framed"
   offenders, each with an anchor + a one-line diagnosis. Explicitly include the **raid →
   trainer-intro mismatch** and any other encounter-type mis-framings.
4. **Connective-tissue pattern.** A small, repeatable **setup beat** that runs *before* an event
   and answers who/why/now/stakes. Light and local. Specify *where* it hooks in so Stream 4 can
   build the hook **without touching timeline ordering**.
5. **Encounter-framing matrix.** Each encounter type → correct framing: **gym, trainer, rival,
   mini-raid, raid, boss, wild, legendary.** Specify the raid fix conceptually (raids =
   wild/raid framing, no trainer).
6. **Recurring-character glue (light).** When the rival / professor / Mystery Figure should
   reappear as **local callbacks**, not a grand arc.

## Deliverable → `docs/story-design/story-immersion/narrative-coherence.md`
Current state + prioritized gap list (anchors); the per-event coherence-card table; the
setup-beat pattern (+ where it hooks); the encounter-framing matrix; **real samples** —
before/after coherence for the **5 worst offenders**; a **handoff list** (what Streams 2/3/4
must produce).

## Stream guardrails
Reframe-and-connect only — **do not reorder or renumber `STORY_EVENTS_RAW`** (saves). Flag any
flow-ordering bug. Spec only; no behavior change without sign-off.

---

# Stream 2 — Dialogue & Writing

**You own clear, voiced, high-impact words.**

## Mission
Make the writing **clear and sensible** first, then **voiced and impactful**. Fix confusing
dialogue; give the narrator and recurring characters a consistent voice; write the actual lines
for the setup beats and the high-impact moments.

## The problem you own
*"Much of the dialogue doesn't make sense."* Lines fire without establishing who's speaking,
why, or what's at stake; voice is inconsistent; key moments don't land.

## Scope
- **In:** the voice/tone guide; rewriting confusing/flat lines; writing copy for Stream 1's
  setup beats; high-impact beat writing; meaningful dialogue choices (copy side); a data-driven
  home for dialogue.
- **Out:** deciding *which* events need setup or *why* (→ Stream 1); visual presentation (→
  Stream 3); building the choice engine (→ Stream 4).

## Tasks
1. **Audit current dialogue.** Sample cold-opens, trainer/rival/professor/Mystery-Figure lines,
   story beats. Quote representative offenders and diagnose *why* each is confusing or flat.
2. **Voice & tone guide.** Narrator voice + a short voice sheet per recurring character. Register:
   **grounded and coherent**, leaning **slightly edgier** (consistent with the camp tone) but
   **classic storyline only**. Maintainer signs off on tone.
3. **Clarity rewrite pass.** Using Stream 1's gap list, rewrite the worst offenders so each line
   establishes **who's speaking, why, and the stakes.** Clarity beats cleverness.
4. **Write the setup-beat copy.** Real lines for a representative set of events.
5. **High-impact moments.** Write the handful of beats that should hit hardest. Design **2–3
   meaningful dialogue choices** (copy + branches); Stream 4 provides the choice tool.
6. **Data-driven proposal.** Where dialogue is inline in `battle.html`, propose moving it to
   `data/*.json` pools; coordinate the schema with Stream 4.

## Deliverable → `docs/story-design/story-immersion/dialogue-and-writing.md`
Current state + diagnosed offenders (quoted, anchors); the voice/tone guide; **real samples** —
before/after rewrites for the 5 worst offenders + setup beats + high-impact beats + the choice
designs; the data-driven dialogue schema proposal (with Stream 4).

## Stream guardrails
Tone = grounded-coherent-classic, slightly edgier; **maintainer signs off on copy**. Keep
diacritic consistency ("Pokémon"). No behavior change without sign-off.

---

# Stream 3 — Visual & Cinematic

**You own scenes, sprites, animation, cinematics, and correct framing.**

## Mission
Strengthen narration with **visual beats, animations, and cinematics**, and make **encounter
framing correct and clean** — every encounter type *looks* like what it is.

## The problem you own
Presentation is flat and some encounters are mis-framed. Concretely: **mini-raids and regular
raids show a trainer appearing before the battle**, but raids are wild Pokémon — confusing and
wrong. Boss fights have no build-up. Events lack visual setup.

## Scope
- **In:** the encounter-framing matrix (visual side) incl. the **raid trainer-intro removal**;
  **pre-boss cinematics**; a per-event visual-beat catalogue; an asset/reuse plan; building on
  the existing narration overlay + the camp `EVENT_CINEMATICS.md` POC.
- **Out:** the words (→ Stream 2); *why* events happen (→ Stream 1); the underlying
  cinematic-trigger API (→ Stream 4, which you consume).

## Tasks
1. **Audit current presentation.** The narration overlay (`_renderNarrativeOverlay`,
   `_storyScene`), `StoryFx`/SFX vocabulary, sprite + `bg_<type>` backgrounds, existing
   cinematics (legendary-sighting fold; camp `EVENT_CINEMATICS.md`). What's reusable.
2. **Fix encounter framing.** Locate where the **raid** path shows a trainer reveal; specify the
   change so **mini-raids + regular raids use wild/raid framing (no trainer)**. Produce the
   **visual framing matrix** (gym/trainer/rival/mini-raid/raid/boss/wild/legendary).
3. **Pre-boss cinematics.** A reusable **build-up cinematic** before boss battles — template
   (frames, timing, SFX) on the existing engine.
4. **Per-event visual-beat catalogue.** Small animations / scene visuals per event type; extend
   the `EVENT_CINEMATICS.md` POC; reuse the overlay engine.
5. **Asset & reuse plan.** What to reuse; where a cheap effect buys the most immersion **without
   bloating** the 4 MB file.

## Deliverable → `docs/story-design/story-immersion/visual-and-cinematic.md`
Current state + reusable-engine inventory (anchors); the visual framing matrix + the **raid-fix
plan** (exact mechanism / where); the pre-boss cinematic template; the per-event visual-beat
catalogue; **real samples** — described/mocked frames for the pre-boss cinematic + 2–3 event
beats; the asset/reuse plan.

## Stream guardrails
Reuse the existing overlay/scene engine; seeded RNG for any variance; **flag the raid-framing
change for sign-off** (it alters an encounter's presentation). No asset bloat.

---

# Stream 4 — Storytelling Systems & Tools

**You own the engine capabilities the other three streams stand on. Spec this one first.**

## Mission
Build the **tools** that make richer storytelling possible: a way to attach setup beats to
events, choices with remembered consequences, a cinematic-trigger hook, and a data-driven
content pipeline — all without destabilizing saves or the battle engine.

## The problem you own
The other streams need hooks that don't exist cleanly yet: no light, data-driven way to inject a
per-event setup beat; choices don't reliably remember consequences; cinematics aren't a reusable
trigger. You make those real.

## Scope
- **In:** the setup-beat hook; the choice/consequence + story-state tool; the cinematic-trigger
  API; the data-driven content schema; the save-schema impact (one migration); the test plan.
- **Out:** authoring content (→ Streams 1/2/3). You provide APIs + tiny usage examples.

## Tasks
1. **Audit current tools.** `_storyScene` (choices / `goto` / `onPick`), `sm.storyChoices`, the
   3-track system (`sm.tracks`), `IntroQueue`, scene dedup (`scenesShown` /
   `_storyRunSceneMark`). What each can do; the gaps.
2. **Setup-beat hook.** A lightweight **data-driven** mechanism to attach a pre-event motivation
   beat to any event **without touching `STORY_EVENTS_RAW` ordering** (keyed by event id/row).
   Define the data shape + the trigger point.
3. **Choice & consequence / story-state tool.** Standardize choices that **remember** (extend
   `sm.storyChoices`) so later scenes can branch on past behavior. Grounded-episodic-friendly —
   small local callbacks. Define the read/write API.
4. **Cinematic-trigger hook.** A reusable API to fire pre-battle / pre-boss cinematics and
   per-event animations (consumed by Stream 3). Build on the overlay engine; Promise-based like
   the existing scene/casino pattern.
5. **Data-driven content pipeline.** A `data/*.json` schema for event beats / dialogue /
   cinematics, loaded via **early-`let` + `Object.assign`** (respect the sloppy-mode hazard).
6. **Save-schema + tests.** Exactly one `SAVE_VER` bump + idempotent `migrateStoryPreV*` if state
   is added; a deterministic jsdom test plan per tool.

## Deliverable → `docs/story-design/story-immersion/storytelling-systems.md`
Current state + tool-gap analysis (anchors); each tool's **API** with a **real tiny usage
example**; the **save-schema impact** (migration sketch) + **test plan**; a **handshake table**
(which API each other stream consumes).

## Stream guardrails
No behavior change without sign-off; saves sacred (one migration, never renumber, idempotent);
seeded RNG; mind the sloppy-mode hazard (declare `let`/`const`, mutate via `Object.assign` /
`push`, never bare-reassign a loader placeholder); leave deterministic tests. Keep APIs small
and stable — you are the foundation.
