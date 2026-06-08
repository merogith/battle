# TASK-02 — Arrival & Rest-Stop Reactivity Surface

> **The best first slice.** Contained, no save-schema change, and the prose copy is
> **already written** (Stream 2 authored it; it's just unwired). Makes city arrivals and
> the rest-stop react to what the player *just* did on the road, instead of resetting.
>
> **Bundles:** H4-4 (last-road-context input) · H2-5 (arrival acknowledge copy, ready) ·
> H3-2 (move anomaly delivery off bare `showGameAlert` onto a diegetic surface). All three
> touch the **same arrival/rest-stop overlay surface** — that's why they're grouped.

---

## Goal

When the player walks into a city, the arrival screen should **acknowledge the
villain/extra lead they just encountered** on the prior segment. And anomaly "seeds"
(the Welcome-Back sticker, the handwriting, etc.) should land on that **diegetic surface**
instead of a bare system alert.

## Why it matters

- Stream 1 §5.5 / G5: the diamond (arrival/hub) plays a generic brochure and **ignores
  what just happened** — "a hub that ignores what just happened wastes the only reflective
  space in the loop."
- Stream 1 H3-2 / G6: anomaly seeds are delivered via bare `showGameAlert`, which (per the
  flow audit NOTIF findings) paints *behind* overlays and reads as a system popup, not part
  of the world.

## Status today
- 🔴 H4-4 not wired: `_showCityArrivalScreen` gets no "last-road-context" input.
- ✅ H2-5 copy **ready** — `dialogue-and-writing-CONCLUSION.md §C` has the full villain set
  (10 arcs) + the `cubone` exemplar. **Author the remaining 7 extra arcs** (`yamask`,
  `hypno`, `phantump`, `mimikyu`, `drifloon`, `parasect`, `mewtwo`) in the same register
  while wiring (so each matches the exact lead the player saw).
- 🔴 H3-2 not done: `_tryFireAnomalySeed` still delivers via `window.showGameAlert`.

## Sub-tasks

### 2a — H4-4: last-road-context input
Feed `_showCityArrivalScreen` the arc/lead from the segment just completed (which
villain/extra track fired on `roadN`). Add a `byPriorArc` map (arc id → line) appended
under the existing `CITY_ARRIVAL_LINES`; arrival picks the line matching the prior arc,
falling back to the generic blurb when none.

### 2b — H2-5: arrival acknowledge copy
Drop the `§C` lines into the `byPriorArc` map. Complete the 7 missing extra-arc lines.
Voice: world-narrator, one line, acknowledges the road behind. No mechanics.

### 2c — H3-2: diegetic anomaly surface
Replace the bare `showGameAlert` in `_tryFireAnomalySeed` with the arrival/rest-stop
overlay (the diegetic surface, per §5.5). This is the same surface TASK-01's diamonds will
reuse — building it here de-risks TASK-01.

## Anchors (verified 2026-06-08)

| Symbol | Line | Role |
|---|---|---|
| `_showCityArrivalScreen` | `36384` | Arrival diamond — add last-road-context input |
| `enterCity` | `43814` | Calls the arrival screen; knows the prior segment |
| `CITY_ARRIVAL_LINES` | `36333` | Existing arrival copy — append `byPriorArc` here |
| `_tryFireAnomalySeed` | (getter `40184`; def via anchor) | Anomaly delivery — swap off `showGameAlert` |
| `window.showGameAlert` | `14092` | The bare alert to replace for anomalies |
| `_renderNarrativeOverlay` | (anchor) | Diegetic overlay renderer to route onto |

## Dependencies
- None blocking. Self-contained. Ship before TASK-01.
- The `byPriorArc` line picker needs to know which arc fired on the last road — read it
  from `sm.tracks` / the road-beat fired-state (already persisted).

## Sign-off needed
- Light. Copy is pre-approved (Stream 2). Confirm the H3-2 surface choice (rest-stop
  overlay vs. arrival card) if it affects timing.

## Test plan (jsdom)
- After a villain-arc road segment, arrival renders the matching `byPriorArc` line; after a
  no-arc segment, the generic blurb.
- Each of the 10 villain arcs + 8 extra arcs resolves a line (no missing-key fallthrough).
- `_tryFireAnomalySeed` no longer calls `window.showGameAlert`; the seed renders on the
  diegetic overlay and is visible above other layers (the NOTIF-1 z-order class of bug).
