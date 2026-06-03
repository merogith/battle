# Camp Flow — event buffering, the hub, navigation & save

> Part of the [Camp System spec](./README.md). Anchors symbol-first (resolve with
> `find-anchor`). Grounded in the story-flow + party-UI research sweeps.
> **Story flow & saves are a sensitive area — read `STORY_MODE_FLOW.md` first.**

---

## 1. Concept

Camp is two things at once:

1. **A buffer** — a short, recurring beat *between* route events so each event
   has "stronger boundaries" (the maintainer's core ask: reduce "what is
   happening" confusion).
2. **A hub** — while camped you can **bond** with your party
   ([minigames](./CAMP_MINIGAMES.md)), **sort your party**, and **return to the
   previous city**.

It must feel like the *same place* every time (a recognizable tent/fire), so it
reads as the seam between distinct happenings.

---

## 2. Route rhythm — where camp appears — **[MAINTAINER] D8**

Target flow (maintainer's diagram):

```
City → wild/catch → [CAMP] → Event 1 → [CAMP] → Event 2 → [CAMP] → Trainer → [CAMP] → tall grass → City
```

**Default rule:** a camp fires on **every route transition between two
non-terminal events** — i.e. after each Battle/encounter event, before the next
one — but **not** on `City → City` arrivals (cities are already strong
boundaries with their own arrival cinematics) and **not** immediately before a
city (you "arrive" at the city instead). The set of qualifying transitions is a
small predicate the maintainer can tune (D8): all route transitions vs only
some (e.g. skip the very first, or only between Battle events).

`STORY_EVENTS_RAW` event types are `City` / `Battle` / `Hall of Fame`. A camp
transition is "current event resolved, next event is a `Battle` (or
encounter)." Encounters (wild/catch/roaming) are sub-beats of `enterBattleEvent`,
so the natural camp point is the **event boundary**, not inside an encounter.

---

## 3. Integration — interpose, never renumber

> **Hard rule:** do **not** add `Camp` rows to `STORY_EVENTS_RAW`. `sm.eventIndex`
> indexes into that array; inserting rows re-points every in-flight save's
> `eventIndex` to the wrong event → **save corruption**. Camp lives in the
> *flow*, gated by a new `sm` field, exactly like the existing `Wander Around`
> feature (`sm.wanderByEventIdx`).

**Seam:** the player advances via `processNextEvent()` (≈`43501`, the dispatcher
that routes to `enterCity`/`enterBattleEvent`/`showHallOfFame`) and
`proceedToNextBattle()` (≈`47591`, the "Continue" handler that scans forward to
the next Battle row). Insert the camp check **between resolving event N and
dispatching event N+1**:

```js
// in the forward-advance path, before dispatching the next event:
const key = String(sm.eventIndex);          // transition keyed by destination index
if (campIsDueForTransition(sm.eventIndex) && !(sm.campByEventIdx[key]?.done)) {
  enterCamp(sm.eventIndex, /* resume: */ () => _dispatchEvent(sm.eventIndex));
  return;                                    // camp owns the screen until "Break camp"
}
_dispatchEvent(sm.eventIndex);               // existing routing
```

- `enterCamp(idx, resume)` mounts the camp hub (see §4); "Break camp → continue"
  sets `sm.campByEventIdx[key] = {done:true, ts:…}`, `save()`s, and calls
  `resume()`.
- Gating per transition (the `done` flag) makes camp fire **once** per boundary
  per run — re-entrancy-safe across save/reload, mirroring `wanderByEventIdx`.
- Respect the existing interaction lock: wrap mount in
  `_storyTryBeginInteraction()` / `_storyEndInteraction()` and mount via
  `showScreen('screen-story-camp')`, mirroring `enterCasino` (≈`53255`).

> **Flag for the maintainer (ordering bug class):** make sure camp fires *after*
> battle rewards/badge grants and saves, and *before* the next event's cold-open
> queue — so it doesn't split a reward sequence or pre-empt an intro. Validate
> against the `IntroQueue` flush order (≈`43422`).

---

## 4. The camp hub screen

A new screen `screen-story-camp` (built like `screen-story-casino`). Suggested
layout — a short **arrival scene** then a **menu**:

- **Arrival beat** (`_storyScene`, one short beat): "You set up camp. The fire
  catches. {leadMon} settles in." Keeps the buffer feel even on a fast skip.
- **Menu actions:**
  - **Spend time with your team** → the six bonding mini-games ([`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md)); **unlimited per visit**, any party member.
  - **Sort party** → camp party panel (§6).
  - **Head back to {previousCity}** → return-to-city (§5); hidden if none / at start.
  - **Break camp ▶▶** → sets the done flag, `save()`, resumes the route.

Camp is **brief by default** — the menu is opt-in depth, so players who just want
the buffer tap "Break camp." Pacing/forced-vs-skippable is **D6** (§8).

---

## 5. Return to the previous city — **[MAINTAINER] D7**

The timeline is forward-marching; there's no backtrack today. Precedent for
moving `eventIndex` *backward to a city* exists in the blackout path
(`lastStoryCityEventIndexAtOrBefore(sm.eventIndex)`, ≈`43530` / `46167`). Design
a **round-trip** that doesn't lose progress:

```js
// going back:
sm.campReturnPoint = { eventIndex: sm.eventIndex, fromKey: key };
sm.eventIndex = lastStoryCityEventIndexAtOrBefore(sm.eventIndex);
enterCity();                       // reuse existing hub
// returning (a "Back to the road" action in that city while campReturnPoint set):
sm.eventIndex = sm.campReturnPoint.eventIndex;
sm.campReturnPoint = null;
enterCamp(sm.eventIndex, …) or proceedToNextBattle();
```

**Decisions (D7):**
- **Cost?** Free round-trip (recommended — it's a QoL/heal/shop convenience) vs
  costs gold / a "day" / a small bond decay.
- **Re-arrival cinematics:** re-entering a city will try to replay arrival
  cold-opens. `citiesArrived` already gates first-arrival overlays per run, so a
  revisit should *not* replay them — **verify** and suppress the arrival scene on
  a `campReturnPoint` revisit (pass a `revisit:true` flag to `enterCity`).
- **What's available on revisit:** Poké Mart / heal / team swap yes; re-fighting
  the gym no (already cleared — `gymCleared` gates it).
- **Persistence:** `sm.campReturnPoint` must survive save/reload mid-trip so a
  player can quit while back in town and still return.

---

## 6. Party sorting

Reuse the existing party UI rather than inventing one. Research found a complete
reorder stack at `renderTeamPanel` (≈`46244`): drag-reorder via
`_installPartyDrag`, `moveInParty(idx, dir)`, `setPartyLead(idx)`,
`partyReorder(list, from, to)` (pure), summary via `openSummary(idx)`, and CSS
`.party-reorder-row` (≈`7763`), `.party-sort-btn` (≈`2956`).

**Plan:** add `renderCampPartyPanel()` that clones the `renderTeamPanel` layout,
reuses the same drag/move/lead actions and CSS, and adds a **bond strip** per row
(the six tone-coloured meters from `BONDING_RELATIONSHIPS.md` §9). Keep the
controls identical to the city party panel so it feels consistent. No new save
state — reorder mutates `sm.team` and `save()`s as today.

---

## 7. Save schema additions (the camp half of `migrateStoryPreV25`)

Add to the `sm` template (near the other story-progression fields, ≈`37476`):

```js
campByEventIdx: {},    // { [destEventIndex]: { done:true, ts } } — once-per-transition gate
campReturnPoint: null, // { eventIndex, fromKey } while visiting a prior city, else null
// (slot.bonds added per BONDING_RELATIONSHIPS §6 — same V25 bump)
```

Migration body (combined with the bonds loop from the bonding doc):

```js
function migrateStoryPreV25() {
  if (!sm.campByEventIdx || typeof sm.campByEventIdx !== 'object') sm.campByEventIdx = {};
  if (sm.campReturnPoint === undefined) sm.campReturnPoint = null;
  // …slot.bonds loop (see BONDING_RELATIONSHIPS §6)…
}
// load(): if (d.version < 25) migrateStoryPreV25();
```

One `SAVE_VER` bump (24 → 25) covers **all** camp + bonding state. Don't split.

---

## 8. Frequency, forcing & pacing — **[MAINTAINER] D6**

- **Forced vs skippable:** recommended — camp **screen is forced** the first time
  per transition (that's the buffer), but it opens on the menu with a prominent
  **"Break camp ▶▶"**, so one tap continues. The hub depth (bonding, backtrack)
  is opt-in. This delivers the cognitive boundary without grind.
- **Could become annoying** if every single transition forces a full scene — so
  keep the arrival beat to **one** short `_storyScene` beat, and let the done-flag
  make subsequent passes of the *same* transition (after a blackout retry)
  instant.
- **Alternative (D6):** fully skippable via a settings toggle ("Auto-skip camp"),
  for players who don't want it. Cheap to add; flag for decision.

---

## 9. Cinematic framing

The camp arrival/break beats are small cinematics — author them with `_storyScene`
and the animation infra catalogued in [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md).
A consistent campfire backdrop + a settling-in sprite sells "same place, between
things." Keep it short (sub-2s, skippable) so the buffer never becomes a wall.

---

## 10. Test plan (leave-behind)

- **Gating:** simulate resolving event N with `campIsDueForTransition` true →
  `enterCamp` called once; `sm.campByEventIdx[N].done` set; re-running the
  advance does **not** re-enter camp.
- **No-renumber guard:** assert `STORY_EVENTS_RAW.length` and known row ids are
  unchanged by the feature (a literal guard, like the z-index token guard test).
- **Round-trip:** set `campReturnPoint`, jump to prior city, return → `eventIndex`
  restored, `campReturnPoint` cleared, arrival cinematics suppressed on revisit.
- **Migration:** pre-V25 save gains `campByEventIdx{}` / `campReturnPoint:null`,
  idempotent.
- **Save/reload mid-trip:** persist with `campReturnPoint` set; reload; the
  "return to road" affordance still works.

---

## 11. Decisions (RESOLVED 2026-06-03)

- **D6 — LOCKED:** camp is **forced once per transition** with a prominent 1-tap
  **"Break camp ▶▶"** skip.
- **D7 — LOCKED:** return-to-city is a **free round-trip**; still suppress the
  revisit arrival cinematics (engineering detail, §5).
- **D8 — LOCKED:** a camp fires on **all non-city→city route transitions**.
- Bonding actions per camp are **unlimited** (see `BONDING_RELATIONSHIPS.md` §3).
