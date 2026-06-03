# Brief 3 — Visual & Cinematic

> Read `00-START-HERE.md` first. You own scenes, sprites, animation, cinematics, and correct framing.

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
- **Out:** the words (→ Brief 2); *why* events happen (→ Brief 1); the underlying
  cinematic-trigger API (→ Brief 4, which you consume).

## Tasks
1. **Audit current presentation.** The narration overlay (`_renderNarrativeOverlay`,
   `_storyScene`), `StoryFx`/SFX vocabulary, sprite + `bg_<type>` background assets, and
   existing cinematics (the legendary-sighting fold; the camp cinematics spec at
   `docs/story-design/camp/EVENT_CINEMATICS.md`). What's reusable. Anchors via `find-anchor`.
2. **Fix encounter framing.** Locate where the **raid** path shows a trainer reveal and specify
   the change so **mini-raids + regular raids use wild/raid framing (no trainer)**. Produce the
   **visual framing matrix:** gym / trainer / rival / mini-raid / raid / boss / wild / legendary
   → its correct visual intro. (Pairs with Brief 1's matrix.)
3. **Pre-boss cinematics.** Design a reusable **build-up cinematic** before boss battles (define
   the "boss" set with Brief 1). Specify the template — frames, timing, SFX — on the existing engine.
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

## Guardrails (+ shared)
Reuse the existing overlay/scene engine; seeded RNG (`storyRngNext`) for any variance; keep
changes behavior-preserving where you can and **flag the raid-framing change for sign-off** (it
alters an encounter's presentation). No asset bloat.

## Definition of done
The maintainer can approve the raid fix, a pre-boss cinematic, and a catalogue of per-event
visual beats — each described concretely enough to implement on the existing engine.
