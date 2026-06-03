# Brief 1 — Narrative Coherence & Causality

> Read `00-START-HERE.md` first. You own the "why is this happening" backbone.

## Mission
Make **every story event feel motivated and relevant.** Kill the "out of nowhere" feeling
by giving each event strong **local** setup — the player should always know **who, why, now,
and what's at stake** before a thing happens. Per the locked spine: **grounded episodic** —
local motivation per event, **no overarching-mystery retrofit**.

## The problem you own
Today the timeline (`STORY_EVENTS_RAW`) is mechanically `City → Battle → Battle → …`. Events
fire with no setup beat, so they read as arbitrary. Some are mis-framed (raids present as
trainer battles). Recurring characters (rival, professor, Mystery Figure) are under-used as
connective glue.

## Scope
- **In:** per-event motivation/causality; the setup-beat pattern; the encounter-framing
  matrix; light recurring-character throughlines; the prioritized coherence gap list.
- **Out:** writing the actual lines (→ Brief 2); building visuals (→ Brief 3); building engine
  tools (→ Brief 4); restructuring/reordering the timeline or premise (locked out by scope).

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
   local** (grounded-episodic). Specify *where* it hooks in so Brief 4 can build the hook
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
  nowhere" moment vs your reframed setup (concept + intended beat; Brief 2 writes final words).
- A short **handoff list:** what Brief 2 must write, Brief 3 must show, Brief 4 must build.

## Guardrails (+ shared)
Reframe-and-connect only — **do not reorder or renumber `STORY_EVENTS_RAW`** (saves). Flag any
flow-ordering bug. You're producing a spec; no behavior change without sign-off.

## Definition of done
A maintainer can read your spec and know, for every event, *why it happens and what the player
should understand* — and exactly what the other three streams must produce to deliver it.
