# Story Flow — Full Audit & Single-Engine Redesign

> **Status:** AUDIT / DESIGN ONLY — no code changed. Produced for the maintainer's
> "one story flow engine" debug session. Goal: replace the current multi-system
> tangle with **one** data-driven event engine where adding / changing / removing
> an event is a single declarative edit.

---

## 0. TL;DR

The story flow is driven by **two design eras running at the same time**, plus a
scatter of one-off subsystems. There is **no single engine**:

| Layer | Count | Examples |
|---|---|---|
| Dispatch functions | **17** | `processNextEvent`, `enterBattleEvent`, `_tryFireRoadStoryBeats`, `_runStoryColdOpen`, `_activeBattleBeatForCurrentRow`, `_runFirstStoryInterrupt` … |
| Data tables | **12** | `STORY_EVENTS_RAW`, `MAIN/VILLAIN/EXTRA_STORY_BEATS`, `STORY_SCENES`, `STORY_BEATS`, `STORY_COLD_OPENS`, `STORYLINE_VARIANTS`, `STORY_BATTLE_INTERRUPTS`, `ANOMALY_SEEDS` … |
| "Seen / fired" dedup maps in `sm` | **10** | `scenesShown`, `facilityIntros`, **`facilitiesSeen`** (dup!), `storyEventsFired`, `tipsShown`, `npcStageSeen`, `storyMilestoneTips`, `citiesArrived`, `profUsed`, `_trackRewardGranted` |

**This directly produces the bugs you hit:** story dialogue dumping before gyms,
arc endings before their boss fight, double intros (catch-tutorial + wild),
duplicated facility tooltips (Pokécenter/Mart), and a story that reads flat.

**Target:** ONE engine — one event registry, one dispatcher, one dedup store —
modeled on the *one good pattern already in the code* (`STORY_BATTLE_INTERRUPTS`:
*"adding a pre-battle scene = one append; `enterBattleEvent` doesn't change"*).

---

## 1. The current machine (inventory)

### 1a. Two eras, both wired

**OLD era — pre-3-track "8 storyline variants"** (the design you suspected):
- `STORYLINE_VARIANTS` — 8 variants: `classic, secondsun, bonekeepers, projectmewtwo, hypnos, deadraticate, lavender, static`.
- `STORY_COLD_OPENS` — **85** cold-open scenes (gymN / champion / npc per variant).
- `STORY_BEATS` — per-row metadata (`rowId → {kind, coldOpen}`).
- `getStoryBeatForRow` → merges derived + `STORY_BEATS` + `variant.beatOverrides`.
- `_runStoryColdOpen` / `_showIntroRivalColdOpen` — fire cold-opens before battles.
- **The variant picker was removed.** `sm.storyLine` is hard-set to `'classic'`
  (3 sites: 35076/35122/35684). So **7 of 8 variants never run** — ~**75 of the
  85 cold-opens are dead code**. Only `classic_*` (8) + shared `introRival`/`mystery67` fire.

**NEW era — 3-track system:**
- `MAIN_STORY_BEATS` + `VILLAIN_STORY_BEATS` + `EXTRA_STORY_BEATS` — beat tables (sceneKey/roadAnchor/kind).
- `STORY_SCENES` — beat prose (title/body).
- `_resolveActiveRoadBeats` + `_tryFireRoadStoryBeats` — event-kind beats fire on travel.
- `_activeBattleBeatForCurrentRow` — battle/boss/raid beats inject pre-battle.
- `ANOMALY_SEEDS`, `BEAT_CANON_TRAINER`, `BOSS_CONFIGS`, `STORY_POST_SCENES`.

Both eras fire in the **same run**, with no coordinator deciding order.

### 1b. The dispatch chain a single Battle row actually runs

```
processNextEvent(ev)
 ├─ _tryFireAnomalySeed(ev)            (tip; non-blocking)            [NEW]
 ├─ _tryFireRoadStoryBeats(ev)         (DUMPS all road event beats)   [NEW]
 └─ enterBattleEvent(ev)
      ├─ _runStoryColdOpen(beat)       (old classic cold-open)        [OLD]
      ├─ _runFirstStoryInterrupt()     (catch tutorial / wild / roam) [SHARED]
      ├─ _activeBattleBeatForCurrentRow() → _playStoryBeatScene       [NEW]
      └─ VS-intro dialogue                                            [SHARED]
```

Five independent scene sources, four dedup stores, no shared ordering.

### 1c. Dedup fragmentation (the "double intro / dup tooltip" root)

10 separate maps each answer "have I shown this?" — managed by different code:
`facilityIntros` **and** `facilitiesSeen` are two maps for the *same* concept
(facility first-visit), which is exactly the Pokécenter/Mart double-tooltip you saw.
Catch-tutorial chains into a wild encounter (`chainAfter:true`) and each renders
its own intro overlay → the "wild catch + catch tutorial" double intro.

---

## 2. What fires when — live trace (evidence)

Deterministic dispatch sim (villain=Rocket, extra=Cubone), reproduced via the jsdom
harness:

```
[ 7] Basic Trainer  road1   SCENES: main.event1 + extra.cubone.event1
[19] Rival          road3   SCENES: main.event2 + villain.rocket.event2 + extra.cubone.event3
[36] Gym Trainer 1  road5   >>INJECT extra.cubone.miniRaid2   (Gym-6 APPROACH)
[48] Elite Trainer  road7   SCENES: main.event4 + villain.rocket.event6 + villain.rocket.ending + extra.cubone.ending
[49] Elite Trainer  road7   >>INJECT villain.rocket.boss(boss)
[59] (before E1)    league  SCENES: main.event6+7+8+9 + main.mfReveal + main.ending   (SIX back-to-back)
```

The coarse anchor `roadN` spans **post-Gym-N hub + City N+1 + Gym N+1 approach**
(`currentGym` only increments at the gym-leader row), so roadN content lands in the
*next* city, right before the next gym.

---

## 3. The bugs (hard list)

| # | Bug | Where | Why |
|---|---|---|---|
| **B1** | Two uncoordinated narrative systems fire together | old cold-opens + new 3-track | never reconciled across eras |
| **B2** | Beat **clumping** — 2–6 scenes dumped at one battle, not spread | `_resolveActiveRoadBeats` returns *all* unfired beats for a road | dumps at the road's first battle row |
| **B3** | **Ending before climax** — `villain.*.ending` plays before `villain.*.boss` | endings are *event* beats (dump), boss is a *battle* beat (inject) | two dispatch paths, no ordering |
| **B4** | **Story battle before the gym** — miniRaid/boss injected onto "Gym Trainer" approach rows | `_activeBattleBeatForCurrentRow` injects on any road battle | gym approach is tagged `roadN` |
| **B5** | Coarse anchoring — `roadN` covers 3 zones | `_ROAD_BY_ARRAY_IDX` | increments at leader row, not city arrival |
| **B6** | **Dead variant system** — 7/8 variants, ~75 dead cold-opens | `STORYLINE_VARIANTS` / `STORY_COLD_OPENS` | picker removed, `storyLine='classic'` |
| **B7** | **Dedup fragmentation** — 10 maps; `facilityIntros` vs `facilitiesSeen` duplicate | scattered across subsystems | no single dedup store |
| **B8** | **Double intro** — catch tutorial chains into a wild, each shows an intro | `STORY_BATTLE_INTERRUPTS` chain | `chainAfter:true` + per-step overlays |
| **B9** | Placeholder nameplates ("Villain Story Event 1") + raw stage-directions ("Phase 3 at 25%…") in player prose | `STORY_SCENES` bodies / titles | CSV source shown verbatim |
| **B10** | League **mega-clump** — 6 scenes before E1 | road=`league` collects all remaining | same dump bug at the finale |

---

## 4. The single engine (target design)

### 4a. Principles
1. **One ordered registry** of events (data) + **one resolver** + **one overlay player** + **one dedup store**.
2. **Declarative entries** — emulate `STORY_BATTLE_INTERRUPTS` (the one clean pattern already here).
3. **Precise slots**, not coarse `roadN` — events attach to an exact, named slot.
4. **No index coupling** — entries keyed by `id`, never by array position.

### 4b. Data model — one registry
```js
// ONE table. Each entry is self-describing. Add/remove = edit this array.
const STORY_EVENTS = [
  { id:'villain.rocket.event1',
    slot:'road1.b',                 // precise slot (see 4c)
    when: s => s.tracks.villain==='rocket',
    kind:'scene',                   // scene | battle | tip | gift | facilityIntro
    once:'run',                     // run | career  (dedup scope)
    title:'Stay in Your Lane',
    body:'A Rocket grunt is buying a Slowpoke tail off a kid…' },

  { id:'villain.rocket.boss',
    slot:'road7.climax', when:/*…*/, kind:'battle',
    canonTrainer:'Giovanni', bossConfig:'villain.rocket.boss',
    pre:'…', aftermath:'He wires you 1,000,000G…' },   // aftermath fires AFTER the win
];
```

### 4c. Slot model (replaces `roadN`)
Named, ordered slots per segment so content lands exactly where intended and the
dispatcher walks them in order:
```
cityN.hub → roadN.a → roadN.b → cityN+1.arrive → cityN+1.preGym → gymN+1.leader
```
Gym-leader and gym-approach are **reserved** slots — story battles can't inject there.

### 4d. The dispatcher (one function)
```
advanceStory():
  slot = currentSlot(sm)
  queue = STORY_EVENTS.filter(e => e.slot===slot && e.when(sm) && !seen(e.id))
                      .sort(byPriority)            // spine → villain → extra, climax→aftermath
  if queue: play ONE → mark seen(e.id) → (re-enter on dismiss)   // SPREAD, not dump
  else: run the row (city / battle / hof)
```
- **Spread** (one per slot) fixes B2/B10.
- **`aftermath` fires post-win** fixes B3.
- **reserved gym slots** fix B4.
- **one `seen()` store** fixes B7/B8.

### 4e. Add / change / remove (the workflow you asked for)
- **Add an event:** append one object to `STORY_EVENTS`. Done — dispatcher slots it.
- **Change when/where:** edit its `slot` / `when`.
- **Remove:** delete the object. No dangling dedup (the `seen` store is keyed by live ids), no index to renumber.

---

## 5. Migration plan (safe, phased, test-backed)

- **P0 — Lock behavior.** Promote the dispatch sim into a golden flow-order test; write the full slot map (every current beat → its intended slot).
- **P1 — Build the engine.** Add `STORY_EVENTS` + `advanceStory()` + one `seen()` store, *re-expressing current beats* — no behavior change yet (test stays green).
- **P2 — Absorb the strays.** Fold classic spine cold-opens, facility intros, catch/wild, tips, anomaly seeds into `STORY_EVENTS`; route all dedup through `seen()`.
- **P3 — Delete the old era.** Remove the 7 dead variants, `STORY_COLD_OPENS`/`STORY_BEATS`/`getStoryBeatForRow`/`_runStoryColdOpen`, and the duplicate `facilitiesSeen`.
- **P4 — Fix ordering.** Apply spread + aftermath-after-climax + reserved gym slots + precise anchors.
- **P5 — Verify.** Flow-order assertions + a full autopilot playtest per track.

Phases P1–P3 are behavior-preserving (test-guarded). P4 is the intended behavior
change. The dedup consolidation in P2/P3 touches the save schema → **SAVE_VER bump +
migration (pasteur)**; story-timeline + prose are pasteur's lane — I'll do the engine
+ wiring on your direction and route prose/schema decisions accordingly.

---

## 6. Decisions — RESOLVED (maintainer, this session)

1. **Cut the 8-variant concept entirely.** ✅ Keep only the `classic` spine as the
   single canon main track (alongside the 3-track villain/extra system); delete the
   other 7 variants + their ~75 unreachable cold-opens.
2. **Dedup store:** ✅ Best practice — **one `sm.flowSeen{}` ledger behind a single
   `seen()/markSeen()` API**, scoped to the "one-shot shown" concern (fold in
   `scenesShown`, `facilityIntros`, `facilitiesSeen`, `tipsShown`, `npcStageSeen`,
   `storyMilestoneTips`, `storyEventsFired`, `_trackRewardGranted`). Leave
   `profUsed` / `citiesArrived` (distinct domain state) as-is. Needs SAVE_VER bump +
   migration (pasteur).
3. **Slot granularity:** named slots (§4c). *(default — confirm at P4 if you want row-id anchoring instead.)*
4. **Salvage dead-variant prose?** — deferred to the P3 deletion step (decide per-scene then).

Build proceeds **P0 → P1** now; before/after flow trace shown at each phase.
