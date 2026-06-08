# TASK-01 — Navigable Nodes & Camps (the slot dispatcher)

> **The foundation.** This is the structural engine Streams 1–3 designed around but never
> got. It makes routes feel like **navigable camps with go-back / go-forward pace stops**,
> and it's the prerequisite for the "spread setups into diamonds, one payoff per
> bottleneck" pacing the other streams asked for.
>
> **Bundles:** H4-3 (slot dispatcher) · §2.4 (camp/diamond inversion) · NAV-1 + NAV-2
> (voluntary back-nav). All four are one feature wearing three names.
>
> **🚩 Requires maintainer sign-off** (changes story flow + RNG ordering) **and a SAVE_VER
> bump + migration** (touches the dedup store). See `STORY_OVERHAUL_PLAN.md` §4 / Phase E.

---

## Goal

Replace the forward-only timeline + "die-to-return" with an **ordered list of pitstop
NODES** between two cities — trainer fight · wild · story scene · (optional) rest/branch —
where the player can **explicitly continue forward OR go back to the previous city** to
heal/shop/restock, instead of having to white out.

## Why it matters

- **The maintainer's headline ask** (`STORY_FLOW_AUDIT.md §7a`): "the player can CONTINUE
  forward or GO BACK to the previous city as an explicit choice — *not* lose a battle to
  get sent back. Today the only way back is to white out, which reads as weird/confusing."
- It's the **engine the camp/diamond pacing needs.** Stream 1 §2.4 spreads setup scenes
  across diamond slots (arrival → hub → rest-stop) and keeps one payoff per fight; that
  requires ordered slots, which only this dispatcher provides.
- Streams 1–3 are currently **decorating a structure that isn't navigable** — this closes
  the loop.

## Status today

- 🔴 **Not built.** `grep -niE 'voluntary|backNav|pitstop|flowNode|nodeResolver' battle.html`
  → 0 hits. The only path back to a prior city is loss → game-over → "Return to Last City".
- ✅ Already shipped (do NOT redo): H4-1/H4-2 dispatch-ordering (G3/G4) — villain `ending`
  defers past its `boss`; boss/raid beats no longer hijack Rival/Gym rows.
- ✅ G2 partial: `_tryFireRoadStoryBeats` now paces one setup beat per row (no clumping) —
  but the **full** "move setups upstream into the arrival/hub diamonds" is still §2.4 design.

## Sub-tasks

### 1a — Slot dispatcher (H4-3, "the big one")
Build the single ordered event-model from `STORY_OVERHAUL_PLAN.md §4`: every "thing that
happens" (city stop, road encounter, battle, beat, rest/branch) is a uniform declarative
node, resolved by **one** dispatcher in order. Today there are ~17 dispatch functions /
2 eras and ~10 dedup maps — collapse to one node resolver + one `flowSeen` ledger.
- Stream 1 supplies the **target slot per beat** (`narrative-coherence.md` §3 anchors + §2.4 map).
- This is **Phase E** in the overhaul plan; it touches the dedup store → needs the Phase E
  save migration.

### 1b — Camp/diamond inversion (§2.4)
With ordered slots in place, attach content per the diamond→bottleneck map:
`cityN.arrive → cityN.hub → roadN.restStop → roadN.fight → cityN+1.arrive`. Move existing
setup scenes upstream into the diamonds (don't write new content — relocate). G2 did the
"don't clump" half; this does the "setups live in the diamond" half.

### 1c — NAV-1: voluntary back-nav
Add a "Head back to {city}" affordance at route nodes. Reuse the existing retreat plumbing
**minus the loss framing + fee** — `_storyApplyRetreatToCity` already does the
state-mutation half (warp back, heal). Wrap it in a voluntary entry point exposed at the
node/hub, not just the game-over screen.

### 1d — NAV-2: choose-which-city back-nav
"Return to Last City" currently snaps to a fixed city. The data to pick a real target
already exists (`lastStoryCityEventIndexAtOrBefore`, `cityIndexFromEventIndex`). Let the
player choose which prior city to return to.

## Anchors (verified 2026-06-08)

| Symbol | Line | Role |
|---|---|---|
| `_resolveActiveRoadBeats` | (getter `40128`; def via anchor) | Road beat resolver — the queue to replace |
| `_tryFireRoadStoryBeats` | `42929` | Where road beats dump today (G2-paced) |
| `enterCity` | `43814` | City entry — diamond render host |
| `_showCityArrivalScreen` | `36384` | Arrival diamond surface |
| `proceedToNextBattle` | (anchor) | The lone forward button today |
| `_storyApplyRetreatToCity` | `46207` | Retreat state-mutation (reuse for NAV-1, minus loss/fee) |
| `_activeBattleBeatForCurrentRow` | (anchor) | Battle-beat injector (reserved-slot logic, H4-2 ✅) |
| `STORY_EVENTS_RAW` | (anchor) | Linear timeline — **do NOT reorder** (save-migration risk; C-2) |
| `SAVE_VER` (=24) | `36652` | Bump on the dedup-store migration |

## Dependencies & sequencing
- De-risk by doing **TASK-02 first** — its diegetic arrival/rest-stop surface is the
  surface the diamonds in 1b will reuse.
- Pairs with `STORY_OVERHAUL_PLAN.md` Phases E (sequencing) — read §4 target architecture
  before starting.

## Sign-off needed
- **Flow change** → proposed diff + maintainer approval before commit.
- **Balance/UX:** does back-nav cost anything (the docs say drop the fee for the voluntary
  path)? Confirm. Does it re-roll wilds on the way back? Maintainer call.

## Test plan (jsdom)
- Back-nav from a mid-route node returns to the chosen city with full party heal, no fee,
  no loss flagged; forward position preserved.
- Slot dispatcher resolves a known segment's nodes in the §2.4 order deterministically.
- Save round-trip across the SAVE_VER bump: old save (pre-dispatcher) migrates without
  losing flow position or dedup state.
- Re-entering a node after back-nav does not re-fire a resolved beat (no double-prompt).
