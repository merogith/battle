# Story Mode — Player Journey Map & Flow Audit

> READ-ONLY deliverable. Active scope: **Story mode, normal difficulty.** `battle.html` was not modified.
> Generated 2026-05-30 by direct source read of `battle.html` (60,102 lines). Line numbers drift; the
> durable anchors are the symbol names and `STORY_EVENTS_RAW` **row ids** (column 0 of each row).
>
> **How to read the index columns.** `STORY_EVENTS_RAW` (`battle.html:30097`) is a 67-element array.
> Two different numbers identify each step and they do **not** match:
> - **arr** = the array position (0..66). This is `sm.eventIndex` — what advances +1 per battle won
>   (`onBattleEnd`, `battle.html:47125`).
> - **row id** = `row[0]`, the stable id used by `STORY_BEATS`, `STORYLINE_VARIANTS`, `STORY_RIVAL_ROW_*`,
>   `STORY_THEMED_BATTLES`, `ANOMALY_SEEDS`, `BEAT_CANON_TRAINER`. Row ids are out of order in the array
>   (e.g. the intro Rival is row **68** at arr **1**; the early Rival is row **12** at arr **19**).
>
> **Road anchors.** The 3-track villain/extra/main beats are pinned to "roads", computed at boot by
> `_ROAD_BY_ARRAY_IDX` (`battle.html:30097`→ logic at `41506`). **Road N = the stretch AFTER Gym Leader N
> (exclusive) up to Gym Leader N+1 (exclusive).** The pre-Gym-1 stretch is "Road 0" (anchor `null`, no
> track beats). Everything from E1 onward collapses to `league`. Because of this rule, **a road's beats
> fire on the post-gym hub + route, i.e. one city later than that gym's number** — see Flow Finding F1.

---

# PART 1 — THE MAP (every step, in play order)

## 0. New Game → first screen

**Entry:** `confirmTrainerAndStart` (`battle.html:38238`) → `startNewRun` (`battle.html:38748`).
On a fresh run the save is initialized with `eventIndex:0, badges:0, gold: 2000 + difficultyBonus`
(normal = +2,500 → **4,500 G**), empty `team:[]`, `balls:{poke:0,…}` (no balls yet), and:
- `storyLine` = the variant chosen in setup UI (`_readStorylineFromUI`) — one of 8: classic / second_sun /
  bone_keepers / project_mewtwo / hypnos_lullaby / dead_raticate / lavender_frequency / static
  (`STORYLINE_VARIANTS`, `battle.html:40280`).
- `tracks.villain` = `_pickTrack(VILLAIN_TRACKS)` and `tracks.extra` = `_pickTrack(EXTRA_TRACKS)`
  rolled **silently** at run start (`battle.html:38836`). 10 villain pools, 8 extra pools
  (`battle.html:30226`). Hidden until they reveal organically in-game (see below).
- `mysteryIdentity` = `_storyPickMysteryIdentity()` → always `'the_first'` under v22 (`battle.html:32625`).

`processNextEvent` (`battle.html:42234`) then routes to arr=0 (City0).

---

## CITY 0 — Pallet Town (`arr 0`, row `0`, type **City**, road `null`)

Actions literal: `Professor | Pokemart | Move Tutor | Leave City` (+ spliced always-on: Fan Club is
**not** added at C0 — Fan Club/Dojo/Nature/Evolab min-city is 1+, see `_seedAlwaysOnFacilitiesAcrossCities`
`battle.html:30186`). Display name forced to **"Pallet Town"** (`updateHUD`, `battle.html:42630`).

**One-time INTRODUCTIONS / overlays that fire here (in order):**
1. **City0 cold-open** (full-screen narrator) — `enterCity` `battle.html:42557`. Per-run-deduped
   (`scenesShown['city0-coldopen']`). Text: "Salt-air morning… the only road out of Pallet Town runs
   north… The starter on the bench has your name on it. Eight badges, an Elite Four, and a Champion…"
2. **`welcome` one-time tip** (cross-run, once per career) — `battle.html:42600`. Long orientation:
   scaling-to-party-size, cities heal you, PC + Underground, the 🎯 Next chip, "never your starter."
3. **Forced facility intros (block Leave City)** — `FACILITY_DEBUT_CITY` debuts at C0:
   `mart, tutor, relic, bag` (`battle.html:30174`). These are the `_pendingFacilityIntrosHere` set; the
   **Continue/Leave gate is locked** until each pending facility is tapped once
   (`routeBlockedByIntros`, `battle.html:42958`). Each plays its scene from `STORY_TUTORIAL_SCENES`:
   - `firstMart` (`battle.html:39998`) — Mart Clerk; **grants 5 Poké Balls** on Continue.
   - `firstMoveTutor` (`battle.html:40064`) — grants 1 Heart Scale.
   - Relics intro (`firstRelic`-equivalent; the `relic` key) — one-time tip `'relic'` (`battle.html:50423`).
   - Bag intro (`bag` key) — `battle.html:52881`.
4. **THE OBJECTIVE LINE** (single "what next" breadcrumb, `battle.html:43192`): with no starter yet and
   Professor pending → kicker **START**, label **"Pick your starter at the Lab"**, deep-links
   `enterProfessor()`.

**REQUIRED here:**
- **Visit the Professor and pick a starter** (`enterProfessor`, `battle.html:45187`). The Professor offers
  **3 choices**, all pure Grade-4 basics at C0 (`PROF_ROLLS[0] = {g4:100}`, `battle.html:32199`;
  stage cap Basic, `_professorEvoStageCapForCity`). This is the **gate to leave town**
  (`routeBlockedByProfessor`, `battle.html:42952`).
- Tap each pending facility intro (Mart, Move Tutor, Relics, Bag) — also gates Leave City.

**MAY do:** open Party (shows "Empty (Visit Professor)" until starter picked, still tappable);
sell nothing yet.

**Party cap here:** `_storyMaxPartySize()` = `max(2, min(6, 2+badges))` = **2** (0 badges)
(`battle.html:45775`).

---

## Pallet outskirts — Road 0 (pre-Gym-1; anchor `null`, NO track beats)

### `arr 1`, row **68** — **Battle: Rival (INTRO / Starter Duel)**, road `null`
- Beat: `STORY_BEATS[68] = {kind:'rival', tags:['introRival','phase0'], coldOpen:'introRival'}`
  (`battle.html:38913`). Phase 0 = **"Starter Duel"** (`RIVAL_PHASE_TAGLINES`, `battle.html:33205`).
- **COLD-OPEN: `introRival`** (`STORY_COLD_OPENS.introRival`, `battle.html:38939`) → `_showIntroRivalColdOpen`
  (`battle.html:46483`). Per-variant deduped. This is where the run's **rival is named & sprited**
  (`sm.runRivalSpriteFile`, `sm.trainerAssignments[68]`).
- Opponent: the assigned **Rival** trainer, **1 Pokémon** (intro rival forced to party size 1 in the
  curve; foe stat band = **−25%** narrative debuff floor, `_storyEnemyStatMult` row 68, `battle.html:33115`).
- **No wild prefix** (intro rival is wild-free, `_shouldFireWildBeforeBattle` excludes row 68,
  `battle.html:48832`). **No catch tutorial yet** (tutorial fires *after* this row, `battle.html:46063`).
- City0's Leave gate: `introRivalNeedsProf` (`battle.html:42701`) — the intro rival route stays blocked
  until the Professor (starter) is taken, then the route button reads **"⚔ Battle Your Rival"** (direct,
  no grass).

### `arr 2`, row **1** — **Battle: Basic Trainer**, road `null`
- **CATCH TUTORIAL fires here** (the first eligible battle after the intro rival):
  `_shouldFireCatchTutorialBeforeBattle` (`battle.html:46058`). It is **wild #1** of this route node.
  - `firstWild` scene (`STORY_TUTORIAL_SCENES.firstWild`, `battle.html:39971`) — "Catching 101", guaranteed
    catch / no flee, a random Grade-4 partner from enabled gens (`_pickStarterPartner`).
  - Chains into the normal **wildRoute interrupt** for **wild #2** (`STORY_WILDS_PER_ROUTE_NODE = 2`,
    `battle.html:48809`); `firstWildRoute` scene plays (`battle.html:39980`).
  - Purpose (`battle.html:46048`): guarantee the player leaves Pallet's outskirts with **2 mons** so Gym 1
    is at least 2v2.
- Then the **Basic Trainer** fight itself. Themed slot: row 7 (NOT this row) is the first themed battle;
  this row has no theme. Foe stat band ≈ C0 (−20%).

**Note — track reveals have NOT happened yet.** Road 0 carries no beats.

---

## CITY 1 — first gym town (`arr 3`, row `3`, **City**, road `null`)

Actions: `Professor | Pokemart | Move Tutor | Nature Rater | Gym Battle | Leave City` (+ spliced:
**Nature Rater, Fan Club, Battle Dojo** debut here; Evolution Tutor min-city is 2 so not yet).
City arrival overlay: `_showCityArrivalScreen(1)` fires once on first arrival (`enterCity` `battle.html:42586`).
Display name = the assigned GL1's city (`GYM_LEADER_CITY_NAMES`, e.g. "Pewter City").

**One-time INTRODUCTIONS here:**
- **`what-is-a-gym` tip** (cross-run) — fires because cityIdx 1, 0 badges, has Gym Battle action
  (`battle.html:42606`). **This is the canonical teach of the badge→party-cap link:** "party cap grows by
  one (2 + badges, capped at six after four badges)… the next Professor opens the bench… Foes scale
  1-for-1 with your party size — except the finals, who always field six… The gym lobby holds one or two
  deputies — Gym Trainers."
- **Forced facility intros (gate Leave City), in `_CITY_INTRO_PRIORITY` order** (`battle.html:43375`):
  `center, mart, professor, tutor, dojo, nature, …`. New-at-C1 per `FACILITY_DEBUT_CITY`:
  **center (Pokémon Center), nature (Nature Rater), party, fanclub** (`battle.html:30179`); plus `dojo`
  is seeded here. Scenes: `firstPokemonCenter` (grants 1 Potion), `firstNatureRater` (grants 1 Mint),
  `firstBattleDojo` (grants 1 Emblem of Honor), `firstFanClub` (grants one of each IV vitamin — **teaches
  IVs**), `firstTrainerBattle` is battle-side not here.
- **OBJECTIVE LINE:** Professor pending → "Meet the Professor — a new partner" (since team has room at
  cap 2; if already full → "Swap a partner with the Professor"). After Professor + intros done →
  "Enter the Gym".

**REQUIRED:** Visit Professor (gift = `PROF_ROLLS[1]` 80% G4 / 20% G3, Basic stage). Tap pending facility
intros. Then **Enter the Gym**.

**MAY do:** Nature Rater, Move Tutor, Dojo, Fan Club, Pokémon Center (PC/Underground), Party.

### `arr 4`, row **4** — **Battle: Gym Trainer 1**, road `null` (gym lobby; no wild prefix)
### `arr 5`, row **5** — **Battle: Gym Leader 1**, road `null`
- Beat `STORY_BEATS[5] = {kind:'gymLeader', gymNumber:1}` (`battle.html:38914`).
- **Cold-open: variant `*_gym1`** (mapped on row **7**, not 5 — see below). GL fights themselves carry no
  cold-open; the variant "after badge one" scene is anchored to the post-gym route row 7.
- **On victory** (`onBattleEnd`, `battle.html:47030`): `badges → 1`; `gymCleared[city1]=true`;
  **Daycare Inn unlocks** (`_daycareUnlockToastQueued`, `battle.html:47045`); party cap → **3** at next city.

---

## CITY 1 (post-gym hub) — `arr 6`, row `6`, **City**, road **road1**

Actions: `Pokemart | Move Tutor | Nature Rater | Leave City` (no Gym Battle, no Professor in literal).
**Professor is NOT force-injected on a post-gym hub** (`shouldForceCityProfessor` returns false on
`_isPostGymHubAtEventIdx`, `battle.html:32686`) — the new slot's partner is meant to come from the **next**
city's Professor. So the post-gym C1 hub has no required action; objective line falls to the next battle.

**Daycare Inn** now appears as an optional facility (`battle.html:43128`) — leave a mon, get an egg
(hatches ~2 towns later). Optional.

### Road1 begins here. **TRACK REVEALS — first beats fire.**
On the first **Battle** row of road1 (`arr 7`), `processNextEvent` runs `_tryFireRoadStoryBeats`
(`battle.html:42274` → `_resolveActiveRoadBeats`, `battle.html:41534`) BEFORE the battle. road1 carries:
- **`main.event1`** (`MAIN_STORY_BEATS`, road1, kind `event`) — the **main arc's first beat**.
- **`extra.<rolled>.event1`** (road1, kind `event`) — the **extra arc reveals here** (this is the "Road 1 =
  first extra beat" reveal, `battle.html:38833`).
These play as sequential narrative overlays (`_playStoryBeatQueue`) then re-enter `processNextEvent`.

### `arr 7`, row **7** — **Battle: Basic Trainer**, road **road1**
- **Wilds:** first battle of a new route → up to 2 route wilds fire first (`firstWildRoute` already seen).
- **COLD-OPEN: variant `*_gym1`** (`STORYLINE_VARIANTS[…].beatOverrides[7]`, `battle.html:40296`) — e.g.
  classic_gym1 "After Badge One" (Prof. Oak), per active variant. Fires here, AFTER GL1 (correct timing).
- **THEMED battle:** row 7 = `STORY_THEMED_BATTLES[7] = 'cursed'` (pool `['cursed','multitype']`,
  `battle.html:33146`) → "Something wrong on the road" tease. The Basic Trainer is reskinned cursed.
- **ANOMALY SEED:** `ANOMALY_SEEDS[7]` (`battle.html:41694`) "A new sticker on your map reads 'Welcome
  Back.'…" fires as a non-blocking tip (cross-run, once per career).

### `arr 8`, row **8** — **Battle: Basic Trainer**, road **road1** (back-to-back route fight, shares the route → no fresh wilds)

---

## CITY 2 (`arr 9`, row `9`, **City**, road **road1**) — facility unlock band

Actions: `Professor | Pokemart | Move Tutor | Nature Rater | Link Station | Evolution Tutor | Battle Dojo |
Gym Battle | Leave City`. City arrival overlay fires.

**One-time INTRODUCTIONS here (this is the big unlock city):**
- **Chained intros on first arrival** (`enterCity` cityIdx===2, `battle.html:42615`): `_enqueueIntroTutorial('firstCableLink')`
  then `firstStoneSage` — the player meets **Bill** (`firstCableLink`, grants Bill's Discount Card) and the
  **Stonewise Granny / Evolution Tutor** (`firstStoneSage`, grants Stonewise Token) BEFORE touching the hub.
- **Forced facility intros (gate Leave City):** new-at-C2 per `FACILITY_DEBUT_CITY`: **link, evolab**
  (`battle.html:30177`). `firstStoneShop` (Stones and Beyond) is part of the Evolution band too. Evolution
  Tutor is also seeded always-on from C2.
- `prof-overview-v2` tip — fires the first non-full Professor visit at cityIdx>0 (`battle.html:45204`):
  Professors vs wild, finals always field six, the **training-tier** system (Untrained→Tournament).

**REQUIRED:** Professor (gift `PROF_ROLLS[2]` 60% G4 / 40% G3, Basic stage). Pending intros (Cable Link,
Evolution Tutor). Then Enter the Gym.

**MAY do:** Cable Link (trade-evos), Evolution Tutor + Stones and Beyond (stone evos), Battle Dojo.

**CAGED-GOD LEAD #1 location (post-game only):** the **Ledger** lead lives in **City 2's Pokémon Center**
(`_BOSS_LEAD_CITIES`/`_bossArcRenderSection`, `battle.html:48574`) — not collectable until post-HoF.

### `arr 10`, row **10** — **Battle: Gym Trainer 1**, road **road1** (gym lobby)
### `arr 11`, row **11** — **Battle: Gym Leader 2**, road `null`
- Beat `{gymLeader, gymNumber:2}`. On victory: `badges → 2`; party cap → **4**.

---

## CITY 2 (post-gym hub) — `arr 12`, row `13`, **City**, road **road2**

Actions: `Pokemart | Move Tutor | Nature Rater | Link Station | Evolution Tutor | Battle Dojo | Leave City`
(no Professor — post-gym hub). No required action.

### Road2 begins. **TRACK REVEAL — villain arc reveals.**
On the first road2 battle (`arr 13`), `_tryFireRoadStoryBeats` fires:
- **`villain.<rolled>.event1`** (road2, kind `event`) — the **villain arc's first beat** (this is the
  "Road 2 = first villain beat" reveal, `battle.html:38834`). The villain track was rolled at run start;
  this is the player's first sight of it.
- (Main/extra have no road2 event beats; main.event2 is road3.)

### `arr 13`, row **14** — **Battle: Basic Trainer**, road **road2** — wilds fire (new route); **THEMED** `multitype` (`STORY_THEMED_BATTLES[14]`); **ANOMALY SEED[14]** "Your Pokédex updates — a sentence in YOUR handwriting…" (`battle.html:41695`).
### `arr 14`, row **15** — **Battle: Basic Trainer**, road **road2** (back-to-back)

---

## CITY 3 (`arr 15`, row `16`, **City**, road **road2**)

Actions: `Professor | Pokemart | Move Tutor | Nature Rater | Link Station | Evolution Tutor | Stone Shop |
Battle Dojo | Gym Battle` — **NOTE: no "Leave City" in the literal** (`battle.html:30113`). City arrival
overlay fires.

**One-time INTRODUCTIONS:** new-at-C3 per `FACILITY_DEBUT_CITY`: **stoneShop** (Stones and Beyond as a
gated chip — `firstStoneShop` may already be seen from the C2 evolution band). Professor `prof-overview`
already seen.

**REQUIRED:** Professor (gift `PROF_ROLLS[3]` 40% G4 / 60% G3 — **Stage-1 cap now**, `battle.html:32190`).
Enter the Gym. (Continue Route absent from literal — see Flow Finding F6.)

### `arr 16`, row **17** — **Battle: Gym Trainer 1**, road **road2** (gym lobby)
### `arr 17`, row **18** — **Battle: Gym Leader 3**, road `null`
- On victory: `badges → 3`; party cap → **5**.

---

## CITY 3 (post-gym hub) — `arr 18`, row `19`, **City**, road **road3** — **first post-gym RIVAL route**

Actions: `Pokemart | Move Tutor | Nature Rater | Link Station | Evolution Tutor | Stone Shop | Battle Dojo |
Leave City`.

The next battle is a **Rival** (`arr 19`, row 12) and it is a route rival → `rivalGateActive`
(`battle.html:42702`). Because a wild fires first, the route button reads **"🌿 Set Out — Your Rival Waits
on the Route"** (`battle.html:42976`), and the OBJECTIVE LINE shows the rival tease.

### Road3 begins. **Beats on road3:** `main.event2` (kind event), `villain.<rolled>.event2`,
`extra.<rolled>.event3` — all fire as a narrative queue on the first road3 battle (`arr 19`).

### `arr 19`, row **12** — **Battle: Rival (EARLY / "First Rematch")**, road **road3**
- Beat `STORY_BEATS[12] = {kind:'rival', tags:['midRival','phase2']}` (`battle.html:38922`).
  Phase 2 = "First Rematch" (`RIVAL_PHASE_TAGLINES[2]`). Tease: "tracked you down."
- **Wilds:** 2 route wilds fire before this rival (route from City 3) — that's why the button warns of grass.
- Opponent: the assigned Rival (same sprite/name as intro), team scaled to party size.

### `arr 20`, row **20** — **Battle: Basic Trainer**, road **road3** — **THEMED** `villain` ("Something
villainous"; `STORY_THEMED_BATTLES[20]`); **COLD-OPEN: variant `*_npc_r20`** (`beatOverrides[20]`,
`battle.html:40297`) e.g. classic_npc_r20. (No anomaly seed on row 20.)
### `arr 21`, row **21** — **Battle: Basic Trainer**, road **road3** (back-to-back)

---

## CITY 4 (`arr 22`, row `22`, **City**, road **road3**) — Department Store debuts

Actions add **Department Store** (`battle.html:30120`). When Dept Store present, the **Pokémart chip is
hidden** (folded into Dept Store, `battle.html:42680`). City arrival overlay fires.

**One-time INTRODUCTIONS:** new-at-C4 per `FACILITY_DEBUT_CITY`: **dept**. Scene `firstDept`
(`battle.html:40011`) — grants 1 Great Ball. (Gates Leave City.)

**REQUIRED:** Professor (gift `PROF_ROLLS[4]` — G2 tail opens: 20% G4 / 60% G3 / 20% G2; Stage-1 cap).
Dept Store intro. Enter the Gym.

### `arr 23`, row **23** — **Battle: Gym Trainer 1**, road **road3** (lobby)
### `arr 24`, row **24** — **Battle: Gym Leader 4**, road `null`
- On victory: `badges → 4`; party cap → **6** (cap maxes at 6 from 4 badges on; the `what-is-a-gym`
  tip's "capped at six after four badges"). Milestone toast "Four badges. Halfway up the mountain."
  (`battle.html:42772`). **GL4 victory reward** includes an Ultra Ball (`staticDrops.ultraGl4`).

---

## CITY 4 (post-gym hub) — `arr 25`, row `25`, **City**, road **road4**

Actions: …`Department Store | Leave City` (no Professor — post-gym hub).

### Road4 begins. **Beats on road4:** `villain.<rolled>.event3 + battle1`, `extra.<rolled>.event4 + miniRaid`.
(Main has no road4 beat.) The first road4 battle fires the event-kind beats; the **battle-kind beats**
(`villain.…battle1`, `extra.…miniRaid`) attach as **pre-battle scenes** inside `enterBattleEvent`
(`_activeBattleBeatForCurrentRow`, `battle.html:46679`) and, for boss/raid/miniBoss kinds, can **swap the
trainer to a canon villain** (`BEAT_CANON_TRAINER`, `battle.html:46690`).

### `arr 26`, row **26** — **Battle: Basic Trainer**, road **road4** — wilds fire (new route);
**COLD-OPEN: variant `*_gym4`** (`beatOverrides[26]`, `battle.html:40298`) e.g. classic_gym4 "The Halfway
Mark" (Prof. Oak). **Mid-game route find:** first Basic/Elite after badge 4 → +1 Vitamin Pack
(`battle.html:47070`).
### `arr 27`, row **27** — **Battle: Basic Trainer**, road **road4** (back-to-back)

---

## CITY 5 (`arr 28`, row `28`, **City**, road **road4**) — Safari Zone + Casino debut

Actions add **Safari Zone | Poké Casino** (`battle.html:30126`). City arrival overlay fires.

**One-time INTRODUCTIONS:** new-at-C5 per `FACILITY_DEBUT_CITY`: **casino, safari**. Scenes:
`firstCasino` (grants Lucky Chip 500G credit), `firstSafari`/`firstSafariCatch` (15 Safari Balls; Safari is
a self-contained session). These gate Leave City.

**REQUIRED:** Professor (gift `PROF_ROLLS[5]` 50% G3 / 50% G2; Stage-1 cap). Safari + Casino intros.
Enter the Gym.

**CAGED-GOD LEAD #2 location (post-game only):** the **Recording** lead lives in **City 5's Pokémon Center**
(`battle.html:48575`).

### `arr 29`, row **29** — **Battle: Gym Trainer 1**, road **road4** (lobby)
### `arr 30`, row **30** — **Battle: Gym Trainer 2**, road **road4** (lobby — **two** gym trainers from C5 on);
**ANOMALY SEED[30]** "An Elite Trainer says… 'Tell The First we said hi.'" (`battle.html:41696`) — note this
seed is keyed to a *Gym Trainer* row but its text says "Elite Trainer" (see Flow Finding F8).
### `arr 31`, row **31** — **Battle: Gym Leader 5**, road `null`
- On victory: `badges → 5`. **ALL FOUR battle gimmicks unlock at once** (mega/dmax/tera/z, gated `badges>=5`,
  `battle.html:47087`). **GL5 victory reward** grants a **Wishing Piece** with flavor *"carry this to Colress
  in the next city for a free first awakening"* (`GYM_VICTORY_REWARDS['Gym Leader 5']`, `battle.html:45708`).

---

## CITY 6 (post-gym-5 first visit) — `arr 35`, row `35`, **City**, road **road5**

> Note the array jump: after GL5 (`arr 31`) the post-gym City5 hub is `arr 32` (row 32), then road5
> battles `arr 33–34`, then **City6 first visit at `arr 35`**. City6 has no separate "pre-gym vs post-gym
> literal" until later; let me walk in array order.

### `arr 32`, row `32` — **City5 (post-gym hub)**, road **road5**
Actions: …`Safari Zone | Poké Casino | Leave City`. No Professor (post-gym). 
**Road5 begins. Beats on road5:** `main.event3 + main.battle1` (kind battle), `villain.…event4 + battle2`,
`extra.…event5 + miniRaid2`. The first road5 battle fires the event beats; battle/raid beats attach as
pre-battle scenes.

### `arr 33`, row **33** — **Battle: Basic Trainer**, road **road5** — wilds fire (new route);
**THEMED** `villain` ("Team operative arrives in force"; `STORY_THEMED_BATTLES[33]`); **COLD-OPEN: variant
`*_npc_r33`** OR `choice_r33` for mature/pasta variants (`beatOverrides[33]`, `battle.html:40299/40348`).
### `arr 34`, row **34** — **Battle: Elite Trainer**, road **road5** — **THEMED** `cursed` ("road sickness
deepens"; `STORY_THEMED_BATTLES[34]`). First **Elite Trainer** of the run (tougher than Basic).

### `arr 35`, row **35** — **CITY 6 (first visit)**, road **road5** — **Power Up (Colress) debuts**
Actions: `Pokemart | Move Tutor | Nature Rater | Link Station | Evolution Tutor | Stone Shop | Battle Dojo |
Power Up | Department Store | Gym Battle | Leave City`. **NOTE: City6's first-visit row has NO "Professor"
in the literal** — but `shouldForceCityProfessor` force-injects it (cityIdx 6 ≤ 6, `battle.html:32677`), so
the Professor still appears as required (this is the lab's **last appearance / goodbye**, `_isFinalProfCity`,
`battle.html:45236`). City arrival overlay fires.

**One-time INTRODUCTIONS:** new-at-C6 per `FACILITY_DEBUT_CITY`: **colress**. Scene `firstColress`
(`battle.html:40125`) — Battle Mechanics lab; if the player is **carrying the Wishing Piece** (from GL5),
the scene adds a free first-awakening line and **the first gimmick awakening is free**.

**REQUIRED:** Professor (gift `PROF_ROLLS[6]` 70% G2 / 30% G3 — **ALL stages cap now**, last lab gift).
Colress intro. Enter the Gym.

### `arr 36`, row **36** — **Battle: Gym Trainer 1** (lobby); `arr 37`, row **37** — **Battle: Gym Trainer 2** (lobby), both road **road5**
### `arr 38`, row **38** — **Battle: Gym Leader 6**, road `null`
- On victory: `badges → 6`. **Gym6 team snapshot taken** for Fight Club scaling (`sm.pits.gym6Snapshot`,
  `battle.html:47052`) and the **daycare matron's "secret" Fight Club** becomes available (badges≥6, surfaced
  via the daycare, `battle.html:43124`/`_pitsUnlockToastQueued`). GL6 purse jumps to 5,550.

---

## CITY 6 (post-gym hub) — `arr 39`, row `40`, **City**, road **road6** — **second post-gym RIVAL route**

Actions: `…Power Up | Department Store | Leave City` (no Professor — past C6 the lab is gone for good).
Next battle is a **Rival** (`arr 40`, row 39) on a route → "🌿 Set Out — Your Rival Waits on the Route."

### Road6 begins. **Beats on road6:** `villain.…event5 + miniBoss`, `extra.…event6 + raid` (the extra
arc's flagship **raid** with its Exp-Share-x6 reward, `_storyGrantTrackEndReward`, `battle.html:41770`).

### `arr 40`, row **39** — **Battle: Rival (MID / "On the Way Up")**, road **road6**
- Beat `STORY_BEATS[39] = {kind:'rival', tags:['phase3']}` (`battle.html:38923`). Phase 3 = "On the Way Up";
  tease "been training hard." Wilds fire first (route from City 6).

### `arr 41`, row **41** — **Battle: Basic Trainer**, road **road6** — **THEMED** `multitype`
(`STORY_THEMED_BATTLES[41]`).
### `arr 42`, row **42** — **Battle: Elite Trainer**, road **road6** — **THEMED** `eldritch` ("a familiar
silhouette in the fog"; `STORY_THEMED_BATTLES[42]`).

---

## CITY 7 (`arr 43`, row `43`, **City**, road **road6**) — EV Trainer debuts

Actions add **EV Trainer** (`battle.html:30141`). No Professor (past C6). City arrival overlay fires.

**One-time INTRODUCTIONS:** new-at-C7 per `FACILITY_DEBUT_CITY`: **evtrainer**. Scene `firstEVTrainer`
(`battle.html:40103`) — **teaches EVs** (252/252/4), grants 1 Vitamin Pack. Gates Leave City.

**REQUIRED:** EV Trainer intro. Enter the Gym. (No Professor here — the objective line goes straight to
the gym after the EV intro.)

### `arr 44`, row **44** — **Battle: Gym Trainer 1** (lobby); `arr 45`, row **45** — **Battle: Gym Trainer 2** (lobby), road **road6**
### `arr 46`, row **46** — **Battle: Gym Leader 7**, road `null`
- Beat `{gymLeader, gymNumber:7}`. On victory: `badges → 7`. **Daycare eggs come due** (hatch lazily on next
  city return, `battle.html:47056`). GL7 purse 5,800.

---

## CITY 7 (post-gym hub) — `arr 47`, row `47`, **City**, road **road7**

Actions: `…EV Trainer | Power Up | Leave City`. No required action.

### Road7 begins. **Beats on road7 (the arc climaxes):** `main.event4 + main.battle2` (kind battle),
`villain.…event6 + boss + ending` (the villain **boss** with its **Master Ball** reward,
`_storyGrantTrackEndReward` `villain.*.boss`, `battle.html:41756`), `extra.…ending`. These fire on the
road7 battles (event beats via `_tryFireRoadStoryBeats`; boss/battle beats as pre-battle scenes with canon
villain trainer swap).

### `arr 48`, row **48** — **Battle: Elite Trainer**, road **road7** — wilds fire (new route);
**THEMED** `cursed` (`STORY_THEMED_BATTLES[48]`); **COLD-OPEN: variant `*_npc_r48`** (`beatOverrides[48]`,
`battle.html:40300`).
### `arr 49`, row **49** — **Battle: Elite Trainer**, road **road7** — **THEMED** `veteran` ("an old face
walks back"; `STORY_THEMED_BATTLES[49]`); **ANOMALY SEED[49]** "Your starter's Pokédex entry now closes with
a single line… in YOUR handwriting." (`battle.html:41697`).

---

## CITY 8 (`arr 50`, row `50`, **City**, road **road7**) — last gym town

Actions: `…EV Trainer | Power Up | Gym Battle | Leave City`. No Professor (past C6 — but see the C8
legendary gate on the **post-gym** hub below). City arrival overlay fires.

**REQUIRED:** Enter the Gym. (No new facility debut at C8 first-visit; EV Trainer already met.)

**CAGED-GOD LEAD #3 location (post-game only):** the **Key** lead lives in **City 8's Pokémon Center**
(`battle.html:48576`).

### `arr 51`, row **51** — **Battle: Gym Trainer 1** (lobby); `arr 52`, row **52** — **Battle: Gym Trainer 2** (lobby), road **road7**
### `arr 53`, row **53** — **Battle: Gym Leader 8**, road `null`
- Beat `{gymLeader, gymNumber:8}`. **COLD-OPEN: variant `*_twist`** is mapped on row 53
  (`beatOverrides[53]`, `battle.html:40301`) — e.g. classic_twist; this is the variant's **big twist scene**,
  fired as the GL8 cold-open. On victory: `badges → 8`. Milestone toast "Eight badges. The Plateau gate
  opens." **Roaming legendary queued** (`_ROAMING_TRIGGERS['Gym Leader 8']='gym8'`, `battle.html:45985`):
  a wild sub-legendary will appear on the next route (Victory Road) — one throw, bring your best ball.

---

## CITY 8 (post-gym hub) — `arr 54`, row `55`, **City**, road **road8** — **THE LEGENDARY MYSTERY-FIGURE GATE**

Actions: `…EV Trainer | Power Up | Leave City`.

**This is the pre-League gate** (`isPreLeagueLegendaryMysteryGate`: cityIdx 8 && badges≥8,
`battle.html:32693`). With a full team at the cap, the Professor slot is **replaced by a masked "Mystery
Figure"** who hands the player a **legendary** (forced swap-in OR send-to-PC; can refuse). It is **required
to leave** (`routeBlockedByMysteryGate`, `battle.html:42946`).
- **One-time tip `legendary-gate`** (`battle.html:45213`): "no challenger walks the final gate without a
  legendary in hand… field it in place of a partner… or send it to the PC… Refuse it, and the gate stays
  shut."
- **OBJECTIVE LINE:** "Talk to the Mystery Figure" (kicker STORY, `battle.html:43195`), deep-links
  `enterProfessor()` (same entry point, mystery mode). Pre-fight framing in `enterProfessor`
  (`_profLegendaryMysteryMode`, `battle.html:45207`).
- Gift roll: `PROF_ROLLS` overridden to G1 legendaries (`pickStoryLegendaryFromGens`).

> **Naming collision worth knowing (4 distinct "Mystery" things):** this C8 gate "Mystery Figure" is NOT
> the post-HoF row-67 "Mystery Figure" (The First), NOT the Crucible "Mystery Figure" button, and NOT the
> Caged God. See Flow Finding F2.

### Road8 begins. **Beats on road8:** `main.event5` (kind event) only. Fires on the first road8 battle.

### `arr 55`, row **56** — **Battle: Elite Trainer**, road **road8** — **VICTORY ROAD begins.**
- The 3 Elite Trainers between City 8 and City 9 **are Victory Road** (`_shouldFireWildBeforeBattle`
  comment, `battle.html:48836`). Wilds still fire here (route), and **the roaming legendary from GL8 fires on
  this first VR route battle** (`_shouldFireRoamingBeforeBattle`, `battle.html:46020`). **THEMED** `villain`
  ("Team boss before the League"; `STORY_THEMED_BATTLES[56]`); **COLD-OPEN: variant `*_gym8`**
  (`beatOverrides[56]`, `battle.html:40302`) "Before the Plateau."
- The post-gym-8 hub's route button is framed as Victory Road (`battle.html:42981`); objective line may read
  **"Climb Victory Road"** / **"Pre-League Trainers"** (`battle.html:43204`).
### `arr 56`, row **57** — **Battle: Elite Trainer**, road **road8** (VR).
### `arr 57`, row **58** — **Battle: Elite Trainer**, road **road8** (VR) — **THEMED** `eldritch` ("the
curtain pulls back"; `STORY_THEMED_BATTLES[58]`).

---

## CITY 9 — Pokémon League (`arr 58`, row `59`, **City**, road **road8**) — the League hub

Actions: a full facility set + **Enter Pokémon League** (no Gym Battle, no Leave City)
(`battle.html:30156`). Display name forced to **"Pokémon League"**. City arrival overlay fires.
**Foes from here field SIX no matter your party** (the finals exception, taught in `prof-overview-v2`).

**REQUIRED:** Enter the Pokémon League (objective line "Enter the Pokémon League", `battle.html:43202`).
**MAY do:** any facility (Dept Store, Casino, Safari all reachable here too) for last-minute prep.

### League road = `league` anchor. **Beats on league (main arc finale):** `main.event6, event7, event8,
event9` (kind event), `main.mfBattle` (kind **mysteryBoss**), `main.mfReveal` (event), `main.ending` (event).
Event-kind beats fire via `_tryFireRoadStoryBeats` on the league battle rows. **`main.mfBattle` (mysteryBoss)
is EXCLUDED from the pre-battle attach** (`_activeBattleBeatForCurrentRow` excludes mysteryBoss,
`battle.html:41674`) — it is realized by the **row-67 post-HoF fight** instead, where `startBattle` detects
the Mystery Figure foe and applies `main.mfBattle` mechanics (`battle.html:16988`).

### `arr 59`, row **60** — **Battle: E1 (Elite Four #1)**, road `league` — no wilds (inside the stadium,
`battle.html:48839`). Cold-open: variant `*_champion` is mapped on row **64** (Champion), not E1. Purse 5,000.
### `arr 60`, row **61** — **Battle: E2 (Elite Four #2)** — GL4-legacy Ultra Ball reward (`staticDrops.ultraE2`).
### `arr 61`, row **62** — **Battle: E3 (Elite Four #3)**.
### `arr 62`, row **63** — **Battle: E4 (Elite Four #4)**.
> E1–E4 chain back-to-back (each win advances eventIndex +1 straight into the next; no city return between).

### `arr 63`, row **64** — **Battle: Champion**, road `league`
- Beat `STORY_BEATS[64] = {kind:'champion'}`. **COLD-OPEN: variant `*_champion`** (`beatOverrides[64]`,
  `battle.html:40303`) — "The Champion's Hall / The Last Door." Foe stat band = **+25%** (`_storyEnemyStatMult`
  Champion, `battle.html:33113`). Purse 7,500. On victory: **Champion team snapshot** taken
  (`sm.pits.championSnapshot`) and the **Crucible Fight Club** opens (`battle.html:47061`).

### `arr 64`, row **65** — **Battle: Rival (LEAGUE / "Title Match")**, road `league`
- Beat `STORY_BEATS[65] = {kind:'rival', tags:['leagueRival','phase4']}` (`battle.html:38924`).
  `STORY_RIVAL_ROW_LEAGUE = 65`. Phase 4 = "Title Match"; tease "title rematch — Hall of Fame." No wild
  prefix (league rival, `battle.html:48840`). On win, `sm.rivalChampionClaimed` set to player
  (`setRivalStanding`, `battle.html:34779`). Purse 7,200.

### `arr 65`, row **66** — **Hall of Fame**, road `league`
- `processNextEvent` → `showHallOfFame` (`battle.html:53313`). Records the clear (`recordStoryClearInMeta`),
  unlocks `first_hof`, the `r_no_death` achievement if zero losses, and a **per-variant Hall-of-Fame card**
  (one-shot narrative overlay). The HoF grid renders the team. **"Continue" → `continuePostGame`.**

---

# POST–HALL OF FAME (post-game arc)

**Dispatcher:** `continuePostGame` (`battle.html:53489`).

## Step P1 — `arr 66`, row **67** — **Battle: Mystery Figure (THE FIRST) — the post-HoF climax**

- On the **first** post-HoF Continue (`!sm.postHofMysteryClimaxDone`), the player is routed to row 67
  (`battle.html:53497`) as a **one-time climax fight** before the post-game hub opens.
- Beat `STORY_BEATS[67] = {kind:'mystery', tags:['postHoFMystery','cagedGod'], coldOpen:'mystery67'}`
  (`battle.html:38930`). **COLD-OPEN: `mystery67`**. Identity = **The First** (`mysteryIdentity='the_first'`,
  sprite Red, `MYSTERY_FIGURE_IDENTITIES.the_first`, `battle.html:32615`). This realizes the orphaned
  `main.mfBattle` (mysteryBoss) beat — `startBattle` applies its `hpThresholdPhase`+`immunityRound`
  mechanics (`battle.html:16988`, `41886`). Foe stat band = **+30%** (the run's hardest, `battle.html:33112`).
  Purse 12,000 (the curve's peak). Routed through the **crucible end-flow** (`crucibleBattleSource =
  'postHofMystery'`), not the normal timeline advance.
- **No route wild / no normal interrupts** (`_shouldFireWildBeforeBattle` & catch tutorial exclude Mystery
  Figure rows, `battle.html:48830`).

## Step P2 — first-clear rewards + orientation (after the row-67 fight)

Back in `continuePostGame` with the climax flag set (`battle.html:53516`):
- **Master Ball gift** + `bossArc.available = true`: broker hands a Master Ball, "Specimen 0001 has been
  held for decades. Visit the brokers in Cities 2, 5, and 8 to find it." (`battle.html:53520`).
- **Per-variant post-HoF epilogue** overlay (`_showVariantPostHofEpilogue`, `battle.html:32556`), then the
- **`postHof` orientation tip** (`battle.html:53533`): names the **three post-game doors** — 🧨 The Crucible,
  🔮 The Caged God (leads in PC of Cities 2/5/8), 🚪 The Mystery Figure (Crucible's Mystery button).
- Returns the player to the **last visited city** (`lastStoryCityEventIndexAtOrBefore`) as the post-game hub.

## Step P3 — Post-game hub (any visited city) — three doors

Every visited city now shows, in addition to its normal facilities:
- **🧨 The Crucible** (`battle.html:43150`, gated `bossArc.available`) → `enterCrucible`. The super-hub:
  every facility used on the road, **League rematches**, the **Battle Frontier** ladder (one-time `frontier`
  tip, `battle.html:48220`), and the **Mystery Figure** rematch button. (Frontier/Crucible are flagged
  **out-of-scope** per CLAUDE.md but are reachable from here.)
- **🔮 The Caged God** arc (`_bossArcRenderSection`, `battle.html:48553`):
  - **Collect 3 leads** from the Pokémon Centers of **City 2 (Ledger), City 5 (Recording), City 8 (Key)**
    (`bossCollectLead`, `battle.html:48607`; in the Crucible hub all three are pullable). Each plays a broker
    scene.
  - All 3 collected → **cage unlocks** (`_bossArcCheckCageUnlock`, `battle.html:48508`): a big alert fires,
    and a **"🔥 Enter the Cage — <legendary>"** button appears in **every Pokémon Center**.
  - **Boss fight: Subject Zero / Specimen 0001** (a rolled legendary, `_bossArcRollLegendary`). **Needs the
    Master Ball** (the one handed in P2). On capture → per-variant Subject-Zero epilogue
    (`_variantSubjectZeroEpilogue`, `battle.html:32458`); achievement `caged_god` / `r_caged_god`.
- **🚪 The Mystery Figure** — summoned from the Crucible's Mystery button (a repeatable masked rematch;
  the mask stays on until you win).

**NG+ / replays:** `welcomeBackRun<N>` tip on the menu (`battle.html:53627`); fresh runs re-roll seed +
tracks but keep the cross-run Pokédex / achievements / HoF records.

---

## Summary tables

### Required vs optional, per city (normal difficulty)

| City | Required to leave | Notable optional |
|---|---|---|
| C0 Pallet | Pick starter (Prof) + tap Mart/Tutor/Relics/Bag intros | — |
| C1 (pre-gym) | Prof + Center/Nature/Dojo/FanClub/Party intros + **Gym** | Move Tutor |
| C1 (post-gym) | nothing (route) | Daycare Inn (now unlocked) |
| C2 (pre-gym) | Prof + CableLink/EvoTutor/StoneShop intros + **Gym** | Battle Dojo |
| C2 (post-gym) | nothing (route) | Daycare |
| C3 (pre-gym) | Prof + **Gym** (literal has no "Leave City") | StoneShop |
| C3 (post-gym) | **Rival route** (set out) | — |
| C4 (pre-gym) | Prof + Dept Store intro + **Gym** | Casino@C5 not yet |
| C4 (post-gym) | nothing (route) | — |
| C5 (pre-gym) | Prof + Safari/Casino intros + **Gym** | Safari, Casino |
| C5 (post-gym) | nothing (route) | — |
| C6 (pre-gym) | Prof (forced; **last lab**) + Colress intro + **Gym** | Power Up/Colress (free awaken w/ Wishing Piece) |
| C6 (post-gym) | **Rival route** (set out) | Fight Club (secret, badges≥6) |
| C7 (pre-gym) | EV Trainer intro + **Gym** | — |
| C7 (post-gym) | nothing (route) | — |
| C8 (pre-gym) | **Gym** | — |
| C8 (post-gym) | **Talk to Mystery Figure (legendary gate)** → Victory Road | — |
| C9 League | **Enter Pokémon League** | last-minute Dept/Casino/Safari |

### Facility debut → intro scene → reward

| Facility | Debut city (`FACILITY_DEBUT_CITY`) | Intro scene | First-use gift |
|---|---|---|---|
| Pokémart | C0 | `firstMart` | 5 Poké Balls |
| Move Tutor | C0 | `firstMoveTutor` | 1 Heart Scale |
| Relics | C0 | (`relic` tip) | — |
| Bag | C0 | (`bag` intro) | — |
| Pokémon Center | C1 | `firstPokemonCenter` | 1 Potion |
| Nature Rater | C1 | `firstNatureRater` | 1 Mint |
| Battle Dojo | C1 | `firstBattleDojo` | 1 Emblem of Honor |
| Pokémon Fan Club | C1 | `firstFanClub` | 1 of each IV vitamin (teaches IVs) |
| Party | C1 | (`party` intro) | — |
| Cable Link (Bill) | C2 | `firstCableLink` | Bill's Discount Card |
| Evolution Tutor (Granny) | C2 | `firstStoneSage` | Stonewise Token |
| Stones and Beyond | C2/C3 | `firstStoneShop` | — |
| Department Store | C4 | `firstDept` | 1 Great Ball |
| Game Corner (Casino) | C5 | `firstCasino` | Lucky Chip (500G) |
| Safari Zone | C5 | `firstSafari` | 15 Safari Balls (session) |
| Power Up (Colress) | C6 | `firstColress` | free 1st awaken w/ Wishing Piece |
| EV Trainer | C7 | `firstEVTrainer` | 1 Vitamin Pack (teaches EVs) |

### Rival ladder

| arr | row | Phase | Tagline | Cold-open | Wilds first? |
|---|---|---|---|---|---|
| 1 | 68 | 0 | Starter Duel | `introRival` | no |
| 19 | 12 | 2 | First Rematch | (none) | yes (post-gym-3 route) |
| 40 | 39 | 3 | On the Way Up | (none) | yes (post-gym-6 route) |
| 64 | 65 | 4 | Title Match | (none) | no (inside League) |

---

# PART 2 — FLOW AUDIT (concrete problems)

> Findings are ordered by impact on "what do I do / what's happening / why." Each cites file:line.
> All are **in active scope (Story / normal)** unless tagged otherwise.

## F1 — Road-anchor numbering is off-by-a-city vs the gym it's named after (structural confusion, not player-facing yet)
`_ROAD_BY_ARRAY_IDX` defines **road N = AFTER Gym Leader N up to Gym Leader N+1** (`battle.html:41506`).
The setup comment promises *"first villain beat (Road 2) and first extra beat (Road 1) reveal the rolled
tracks"* (`battle.html:38833`) and the 3-track docs say the reveal lands *"inside the first ~10 minutes."*
But because of the road rule:
- **road1** (extra.event1 + main.event1) first fires on **arr 7** — the Basic Trainer AFTER Gym 1, i.e. the
  player has already cleared a full gym before the extra arc reveals. 
- **road2** (villain.event1) first fires on **arr 13** — AFTER Gym 2.

So the "villain reveal at Road 2" actually lands **after the second badge**, well past 10 minutes. This is
internally consistent (the code does what it says) but the **naming invites a maintainer to mis-place a beat**:
"Road 1" reads like "the road to Gym 1" (pre-Gym-1, arr 1–2), which is *Road 0* here and carries no beats.
Recommend documenting the off-by-one prominently or renaming roads to "post-gymN."

## F2 — FOUR distinct things are all called "Mystery Figure" (the single worst "what's happening" hazard)
The same name + icon (`story_mystery.png`) is reused for four mechanically different encounters:
1. **C8 pre-League legendary gate** — a masked NPC who *gifts a legendary* and gates Victory Road
   (`isPreLeagueLegendaryMysteryGate`, `battle.html:32693`; objective label "Talk to the Mystery Figure",
   `battle.html:43195`).
2. **Row-67 post-HoF climax fight** — "The First", a *boss battle* (`STORY_BEATS[67]`, `battle.html:38930`;
   `continuePostGame`, `battle.html:53497`).
3. **Crucible "Mystery Figure" button** — a *repeatable rematch* in the post-game super-hub
   (`postHof` tip, `battle.html:53534`).
4. The narrative **`main.mfBattle` / `main.mfReveal`** beats (`battle.html:30298`).
A new player who is *given a legendary* by "the Mystery Figure" at C8 and then *fights* "the Mystery Figure"
after the Hall of Fame has no way to know these are different events. The C8 gift-NPC in particular is not a
"figure of mystery" in the boss sense at all — it's the Professor entry point in disguise
(`enterProfessor` mystery mode, `battle.html:45207`). **Recommend renaming the C8 gate** (e.g. "The
Gatekeeper" / "Masked Patron") so "Mystery Figure" means exactly one thing (the post-HoF boss).

## F3 — A teaching/unlock beat is mistimed: all 4 gimmicks unlock at GL5, but the lab that equips them (Colress) is one city later (C6)
GL5 victory sets `unlockedGimmicks` to all four mechanics (`badges>=5`, `battle.html:47087`) and the GL5
reward flavor says *"carry this Wishing Piece to Colress in the **next city**"* (`battle.html:45709`). But
**Colress (Power Up) debuts at C6** (`FACILITY_DEBUT_CITY.colress = 6`, `battle.html:30178`). Between GL5 and
arriving at C6 the player holds an unlocked-but-unusable capability across the **City5 post-gym hub (arr 32)
and the entire road5 stretch (arr 33–34)** — there's no way to set a battle form, yet the unlock has fired.
This is the same RC-7 the prior `FINDINGS.md` flagged; it is still present. (Design intent is "carry it to
the next city," so the *gift* timing is fine — the issue is the *unlock toast / capability* arriving before
the only facility that can act on it.)

## F4 — Two cities require the Professor on the pre-gym visit but the Professor literal is missing, relying on force-injection (fragile + inconsistent)
City6's first-visit row (`arr 35`, row 35) has **no "Professor" in its actions literal** (`battle.html:30133`),
yet the Professor is required there (lab's goodbye). It only appears because `shouldForceCityProfessor`
injects it for cityIdx ≤ 6 (`battle.html:32677`). Likewise the always-on splicer adds tutors/dojo/fanclub
post-hoc. The result: **the data literal is no longer the source of truth for which facilities a city
shows** — three separate mechanisms (literal, `_seedAlwaysOnFacilitiesAcrossCities`, `shouldForceCityProfessor`)
combine. A maintainer reading `STORY_EVENTS_RAW` would wrongly conclude C6 has no Professor. Recommend either
listing Professor explicitly in the C6 literal or documenting the injection at the literal.

## F5 — "Continue Route" / "Leave City" is absent from the City 3 pre-gym literal (latent dead-end risk)
City3 first-visit (`arr 15`, row 16) actions are `…Battle Dojo | Gym Battle` with **no "Leave City"**
(`battle.html:30113`). Every other pre-gym city ends its action list with `Leave City`. Functionally the
player still leaves via the gym (Gym Battle → GL3 → auto-advance to the post-gym hub), so there's no actual
soft-lock. But it is an **inconsistency with C1, C2, C4, C5, C6, C7, C8** (all of which include "Leave City"
on the pre-gym visit), and if anyone ever lets a player skip the gym, C3 would be the one city with no manual
exit. Flagged as a data-consistency gap (per CLAUDE.md the user owns flow but can't pre-spot a missing array
element in 48k LOC).

## F6 — The objective line vs the actual leave-gate agree on order, but the *facility-intro* gate and the *Professor* gate are computed independently (residual RC-2)
The single objective line (`battle.html:43192`) prioritizes Professor → Gym → League/VR → facility intros →
next battle. The real Leave-City gate computes `routeBlockedByProfessor` first, *then* suppresses
`routeBlockedByIntros` when Professor is pending (`battle.html:42958`). These currently produce the same
"Professor first, then intros" order, so they agree — but they are still **two separate derivations of the
gate** rather than one. Any future change to one (e.g. making an intro hard-required before the Professor)
will silently desync the breadcrumb from the gate. This is the un-finished half of the prior audit's RC-2
("the objective and the gate are computed twice"). Low player impact today; structural risk.

## F7 — Track-end reward semantics: the extra-arc "raid" reward was redesigned but the design note admits a mismatch
`_storyGrantTrackEndReward` grants the villain boss a **Master Ball** and the extra raid an **Exp-Share /
6-vitamin bundle** (`battle.html:41756`–`41770`). The comment concedes the original "+6 distributable levels"
design *"couldn't land as designed"* because the game is flat-L100, and substitutes 6 random vitamins. This is
a documented compromise, not a bug, but it means **the villain boss (road7) and the post-HoF Master Ball
(P2) both hand a Master Ball** — a player who finished the villain arc reaches the Caged God already holding a
spare Master Ball, while the orientation tip (`battle.html:53520`) frames the post-HoF Master Ball as if it's
the player's first. Minor narrative redundancy / "why do I have two?" confusion.

## F8 — Anomaly seed text contradicts the row it's pinned to
`ANOMALY_SEEDS[30]` reads *"An **Elite Trainer** says, casually, mid-fight: 'Tell The First we said hi.'"*
(`battle.html:41696`), but **row 30 is a "Gym Trainer 2"** (`arr 30`, City5 gym lobby; `battle.html:30128`),
not an Elite Trainer. The seed fires as a tip on entering that row (`_tryFireAnomalySeed`, `battle.html:42273`),
so the flavor line names a trainer type the player isn't actually fighting. (The first Elite Trainer is row 34.)
Either re-pin the seed to an Elite Trainer row or soften the line to "a trainer."

## F9 — The intro Rival's "what's next" depends on a Professor gate that the rival's own framing doesn't mention
At C0 the intro-rival route button is blocked until the starter is taken (`introRivalNeedsProf`,
`battle.html:42701`), and the objective line correctly says "Pick your starter." But once the starter is
taken, the route button flips to **"⚔ Battle Your Rival"** with no intermediate "leave town" affordance, while
the City0 cold-open told the player "the only road out runs north." A brand-new player may not connect
"Battle Your Rival" with "this is how I leave Pallet." Minor; the objective line mitigates it. Consider
"Set out — your rival blocks the road north."

## F10 — Catch tutorial can silently reschedule, decoupling the lesson from its natural spot
`_shouldFireCatchTutorialBeforeBattle` (`battle.html:46058`) only fires when `team.length <
_storyMaxPartySize()` (cap 2 pre-Gym-1). If the player accepted the C0 Professor gift **and** caught nothing,
they're at 2/2 before the intro rival, so the catch tutorial **cannot fire at arr 2** and reschedules to "the
next eligible battle after the next badge raises the cap" (comment at `battle.html:46068`). That pushes
"Catching 101" all the way to the road1 stretch after Gym 1 — *after* the player has already walked a wild
route (arr 7's wilds) without the tutorial. So a player who engages with the Professor gift gets the catching
lesson **later than the first wild they actually meet**. The intent ("leave Pallet with 2 mons") still holds,
but the *teaching* can land out of order. Worth confirming this is intended.

## F11 — Out-of-scope reachability noted for awareness (not actionable)
The post-game **Crucible → Battle Frontier** ladder and **League rematches** are reachable from every city
post-HoF (`battle.html:43150`, `48220`). Per CLAUDE.md the Battle Frontier / Gauntlet ladder is **permanently
out of scope**; the `frontier` one-time tip and Crucible hub are in the Story path but their *contents* are
out-of-scope. Listed here only so the journey map is complete; no work item.

---

## Method note
Map built by walking `STORY_EVENTS_RAW` (`battle.html:30097`) and cross-referencing: `STORY_BEATS`
(`38912`), `STORYLINE_VARIANTS` (`40280`), `MAIN/VILLAIN/EXTRA_STORY_BEATS` (`30242`+), `_ROAD_BY_ARRAY_IDX`
(`41506`), `STORY_TUTORIAL_SCENES` (`39960`), `FACILITY_DEBUT_CITY` (`30174`), `_CITY_INTRO_PRIORITY`
(`43375`), `_storyShowOneTimeTip` call sites, `STORY_COLD_OPENS` (`38938`), `STORY_THEMED_BATTLES` (`33145`),
`ANOMALY_SEEDS` (`41693`), `enterProfessor` (`45187`), `renderCityActions` (`42668`), `enterBattleEvent`
(`46637`), `onBattleEnd` (`46924`), `continuePostGame` (`53489`), `_bossArc*` (`48488`+). Battle-engine
behavior was read, not executed; no jsdom run was required for a structural map. `battle.html` unchanged.
