# 06 — Game Narration Map: How Our Stories Actually Work

*Part of the story-research dossier. This file is the "what we have today" reference — the structural
map of every narration system in `battle.html`, so the enrichment recommendations (07) can target
exact `sceneKey`s and respect existing contracts. All line numbers are drift-prone; use the symbol
names with the `anchor` skill to re-resolve.*

---

## 1. The 3-track architecture

Story runs assemble narration from **three tracks**, stored on the save object `sm.tracks`:

| Track | Count | How chosen | Anchor |
|---|---|---|---|
| **main** | 1 (fixed: `classic_v2`) | always on | `MAIN_STORY_BEATS` @ `battle.html:31092` |
| **villain** | 1 of 10 | rolled once at run start, seeded | `VILLAIN_TRACKS` @ `battle.html:31076` |
| **extra** | 1 of 8 | rolled once at run start, seeded | `EXTRA_TRACKS` @ `battle.html:31078` |

- Selection: `_pickTrack(pool)` @ `~31080`, using seeded `storyRngNext` (deterministic per `sm.runSeed`).
  Tracks are locked for the whole run; there is no picker UI — they reveal themselves through their
  first beats (extra ≈ Road 1, villain ≈ Road 2).
- This yields **10 × 8 = 80 distinct villain+extra permutations** layered over the one fixed spine.
- Beats are anchored to logical "roads" (`road1`–`road8`, `league`), not raw timeline indices, via
  `_ROAD_BY_ARRAY_IDX` (precomputed at boot) over the 67-row `STORY_EVENTS_RAW` @ `~30945`.

### Beat resolution & pacing
- `_resolveActiveRoadBeats(road)` @ `~42906` — given the current road, returns the eligible beats
  from all three tracks (main → villain → extra priority), filtering out anything already in
  `sm.storyEventsFired[sceneKey]`. League beats can be pinned to a named battle via `fireAtEvent`
  (e.g. `"Rival"`, `"Champion"`); a villain `ending` is deferred until its `boss` has fired.
- `_tryFireRoadStoryBeats(ev)` @ `~43277` — called from `processNextEvent` @ `~43859`; fires **one
  beat per row** to prevent clumping, routing the dismissal back through `_dispatchCurrentRow`.
- `getStoryBeatForRow(rowId)` @ `~42664` — beat lookup by row.

---

## 2. Scene schema & rendering

Prose lives in **`STORY_SCENES`** @ `battle.html:32163` (~200+ entries; generated from
`docs/story-design/story-core-structure.csv`). Each entry is keyed by `sceneKey`
(`main.event1`, `villain.rocket.boss`, `extra.cubone.event2`, …) and shaped:

```js
"villain.rocket.event1": {
  title: "Stay In Your Lane",
  body:  "…short prose summary / fallback…",
  acts: [
    { phase: "intro",       lines: [ "…", "…" ] },
    { phase: "development", lines: [ … ], choice: { … } },   // ≤1 choice per scene
    { phase: "climax",      branches: [ { when:{key,eq}, lines:[…] }, { lines:[…] } ] },
    { phase: "outro",       lines: [ … ] }
  ],
  outro: { win: [ … ] }   // boss scenes only
}
```

- **Multi-act sequencer**: `_playStoryBeatScene(sceneKey, onDone)` @ `~43113` → `_playSceneActs` @
  `~43009`. It walks acts via `step(i)`, resolving each act's display text with `_resolveActLines`
  (static `lines` OR the first matching `branches` entry) and its buttons with `_resolveActChoices`.
- **Overlay renderer**: `_renderNarrativeOverlay` @ `~48089` — sprite + nameplate + line stack +
  click/auto-continue; renders choice buttons when present and swaps in the `reply` lines on pick.

---

## 3. Full scene inventory (by track)

### Main track (`MAIN_STORY_BEATS`, 13 beats) — the time-loop spine
- `main.event1` "How It Ends This Time" (Road 1; old man on bench, *"tell me how it ends this time"*)
- `main.event2` "Welcome Back" (Road 3; the sticker — a loop breadcrumb)
- `main.event3`, `main.battle1` (Road 5)
- `main.event4`, `main.battle2` (Road 7)
- `main.event5` (Road 8)
- League: `main.event6` (pre-E1), `main.event7` "He's Tired" (pre-Champion),
  `main.event8` "The Crown Isn't The Last Fight" (`fireAtEvent: Rival`), `main.event9` (post-HoF)
- Post-HoF climax: `main.mfBattle` @ `~35233`, `main.mfReveal` "It Was You" @ `~35250`,
  `main.loop.run1` / `main.ending` (the remember-vs-forget choice)

### Villain pool (`VILLAIN_STORY_BEATS`, 10 arcs × ~11 beats each)
Each arc = `event1`–`event6` + `miniBoss` + `boss` + `ending`, scattered Roads 2–7.

| Track | Canon analogue | Leader / boss scene | Throughline |
|---|---|---|---|
| `rocket` | Team Rocket | Giovanni — *"I built this. I will not apologize."* | normalized organized crime |
| `magma` | Team Magma | Maxie — *"I did the arithmetic of mercy."* | messianic eco-fundamentalism |
| `aqua` | Team Aqua | Archie — *"I just opened the door."* | romantic surrender to the flood |
| `galactic` | Team Galactic | Cyrus — *"Why are you smiling at me?"* | emotion-as-wound nihilism |
| `plasma` | Team Plasma | Ghetsis (+ N framing) | liberation-as-manipulation |
| `flare` | Team Flare | Lysandre | sorting/caste, beauty as cruelty |
| `skull` | Team Skull | Guzma | broken kids, gang as refuge |
| `yell` | Team Yell / Piers | "The Brother" — *"I told myself it was for her."* | fandom = control |
| `macroCosmos` | Macro Cosmos / Rose | Rose — apology that never lands | PR over apology |
| `star` | Team Star / Penny | Cassiopeia — slides the notebook over | a child doing adult care-work |

### Extra pool (`EXTRA_STORY_BEATS`, 8 arcs × ~10 beats each) — the horror layer
Each arc = `event1`–`event6` + mini-raids + `raid` + `ending`, Roads 1–7.

| Track | Species hook | Dread |
|---|---|---|
| `cubone` | wears a *real* child-sized bone mask | grief / a dead parent |
| `yamask` | a face that isn't yours in the mirror | a soul carrying its old human face |
| `hypno` | faded-yellow missing-poster, 3 years old | abducted children |
| `phantump` | the assembly song | children lost in the woods |
| `mimikyu` | the thing under the rag wants to be seen | unbearable loneliness |
| `drifloon` | the school crossing | child-snatching (canon Pokédex) |
| `parasect` | the steering driver | a corpse the fungus pilots |
| `mewtwo` | PROJECT-0001 patch, Dr. Fuji's bunk, the Mew drawing | genetic-experiment / dead daughter |

---

## 4. The choice system (19 choices, narrative-only)

- **Schema**: a `choice` object inside one act — `{ persistKey, options: [{ label, value, reply[] }] }`.
  Resolved by `_resolveActChoices` @ `~42987`; the pick is stamped to `sm.storyChoices[persistKey]`
  and auto-saved in `_renderNarrativeOverlay` @ `~48181`.
- **Read-back**: `_storyChoiceValue(key)` @ `~42966`; later acts branch via `branches:[{when:{key,eq},
  lines}]` (first match wins; keyless default fallback).
- **Hard contract** (`tests/suites/story-choice-contract.test.js`): **≤1 choice per scene, choices
  NEVER fork which beat fires next, every `persistKey` is unique, no mechanical effect** (no items,
  gold, team, flags, difficulty). They are pure narrative texture, "recorded — and sometimes read."

**The 19 choices** (persistKey → the fork):
- Villain (10): `villain.flare.sticker` (peel/keep), `villain.skull.kids` (throw/win-kindly),
  `villain.rocket.driver` (lean/free), `villain.magma.water` (drink/refuse),
  `villain.macroCosmos.drone` (smash/ignore), `villain.aqua.chart` (warn/source),
  `villain.plasma.n` (uncage/keep-in-ball), `villain.galactic.keeper` (answer-again/tell-the-truth),
  `villain.yell.proof` (leak/give-to-Marnie), `villain.star.bullies` (confront/walk-past).
- Extra (8): `extra.hypno.pendulum` (keep/leave), `extra.parasect.trainer` (stay/leave),
  `extra.yamask.mirror` (look/look-away), `extra.mimikyu.seen` (meet-eyes/look-away),
  `extra.drifloon.crossing` (intervene/trust), `extra.cubone.burial` (promise/decline),
  `extra.mewtwo.drawing` (take/leave), `extra.phantump.song` (2-option).
- Main (1): `main.loop.remember` (forget / carry it forward) — the thematic capstone choice.

> **Enrichment headroom**: many `persistKey`s are *recorded but never read again*. The contract
> already permits more `when`/`branches` payoffs in later scenes — the cheapest, safest enrichment.

---

## 5. Ambient / pooled dialogue (`data/dialogue/*.json`)

| File | Purpose | ~Count | Selection |
|---|---|---|---|
| `barks.json` | post-log flavor at faint/flee/crit | ~12 (4 events ×3-4) | `_emitBark` @ `~14793`, seeded; story-mode only |
| `trainer-quotes.json` | pre-battle by role | ~60 | `getTrainerQuoteForBattle` @ `~36309`, seeded |
| `trainer-quotes-by-name.json` | named trainers (+ "cursed/shadow" forms) | ~300+ | same; name → base → role → fallback |
| `city-guide-quotes.json` | ambient NPC, per city | 36 (12 ×3) | `_pickCityQuoteLine` @ `~36475`, **bare `Math.random`** |
| `leader-victory-lines.json` / `leader-badge-reflections.json` | post-badge | 60+ each | one per gym |
| `elite-victory-lines.json` / `champion-victory-lines.json` | post-fight | 30+ / 14 | once each |

- Rival pools are merged contextually by phase + win/loss streak: `mergeRivalQuotePools` @ `~36284`.
- **Thin pools** (barks ~12, city-guide 36) repeat fast within a single run — enrichment target.
- **Determinism note**: `_pickCityQuoteLine` uses bare `Math.random`, breaking seeded-replay parity
  with the rest of the system (flagged for 07; a fix would route it through `storyRngNext`).

---

## 6. The house voice (spec to preserve)

- **POV/tense**: second-person, present. *"You walk on."* Intimate, in-the-moment.
- **Register**: noir-literary, restrained. Implication over statement; the horror is in the
  *normalization*, not the gore (*"It's bone. A real one, child-sized… Nobody thinks this is strange.
  That's the part that follows you."*).
- **Devices**: objects-as-trauma (shoes, masks, posters, patches); doubling / loop motifs
  ("this time", "Welcome Back"); silence & ellipsis as content (Red's `"…"`); the one true sentence
  load-bearing inside a lie.
- **Voice layers** (keep distinct): ambient = world-weary & accepting; story scenes = haunted;
  trainer quotes = system-confident; victory lines = gracious, hierarchy briefly dissolved.
- **Sympathetic-systemic villainy**: antagonists believe their own case; evil is structural and wears
  politeness. The player is quietly framed as complicit.

---

## 7. Sensitive systems NOT to disturb (per CLAUDE.md)

- **Save schema** (`SAVE_VER`, `migrateStoryPreV*`) — adding read-back branches is fine; changing the
  shape of `sm.storyChoices` / `sm.tracks` / `sm.storyEventsFired` is not, without a migration.
- **Story-tone-retirement lock** — `sm.storyLine` is forced to `classic`; the 8-tone variant layer is
  CUT. Do not revive variant-keyed prose; new prose stays in the live `classic`/3-track shape.
- **Choice contract test** and **story flow ordering** — any new branch must keep ≤1 choice/scene and
  never fork the path. Flow-ordering changes must be flagged, never made casually.
