# Brief 4 — Storytelling Systems & Tools

> Read `00-START-HERE.md` first. You own the engine capabilities the other 3 streams stand on.

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
- **Out:** authoring content (→ Briefs 1/2/3). You provide APIs + tiny usage examples; they fill them.

## Tasks
1. **Audit current tools.** `_storyScene` (choices / `goto` / `onPick`), `sm.storyChoices` (what's
   remembered today), the 3-track system (`sm.tracks`), `IntroQueue`, scene dedup
   (`scenesShown` / `_storyRunSceneMark`). What each can already do; the gaps. Anchors via `find-anchor`.
2. **Setup-beat hook.** A lightweight, **data-driven** mechanism to attach a pre-event
   motivation beat to any event **without touching `STORY_EVENTS_RAW` ordering** (e.g. keyed by
   event id/row). This is what makes Brief 1's connective tissue implementable. Define the data
   shape + the trigger point.
3. **Choice & consequence / story-state tool.** Standardize choices that **remember** (extend
   `sm.storyChoices`) so later scenes can branch on past behavior (e.g. how the rival was
   treated). Keep it **grounded-episodic-friendly** — small local callbacks, not a giant
   branching tree. Define the read/write API Brief 2 uses.
4. **Cinematic-trigger hook.** A reusable API to fire a pre-battle / pre-boss cinematic and
   per-event animations (consumed by Brief 3). Build on the existing overlay engine; keep it
   Promise-based like the existing scene/casino pattern.
5. **Data-driven content pipeline.** A `data/*.json` schema for event beats / dialogue /
   cinematics, loaded via the **early-`let` + `Object.assign`** pattern (respect the sloppy-mode
   hazard — no `'use strict'` in `battle.html`). Coordinate the dialogue schema with Brief 2.
6. **Save-schema + tests.** Exactly one `SAVE_VER` bump + `migrateStoryPreV*` (idempotent) if
   state is added; a deterministic jsdom test plan (`tests/helpers/load-engine.js`) per tool.

## Deliverable
`docs/story-design/story-immersion/storytelling-systems.md`:
- **Current state** + tool-gap analysis (with anchors).
- Each **tool's API** (setup-beat hook, choice/consequence + story-state, cinematic trigger,
  content schema) — with a **real tiny usage example** that Briefs 1/2/3 reference.
- The **save-schema impact** (migration sketch) and **test plan**.
- A **handshake table:** which API each other brief consumes.

## Guardrails (+ shared)
No behavior change without sign-off; saves sacred (one migration, never renumber, idempotent);
seeded RNG; mind the sloppy-mode hazard (declare `let`/`const`, mutate via `Object.assign` /
`push`, never bare-reassign a loader placeholder); leave deterministic tests. You are the
**foundation** — keep APIs small and stable.

## Definition of done
The other three streams can write their specs against your APIs without guessing, and the
maintainer can see exactly what (if anything) touches the save schema and how it's tested.
