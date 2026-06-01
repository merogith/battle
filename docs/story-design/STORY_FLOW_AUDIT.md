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

---

## 7. Expanded scope + target navigation model (maintainer direction, this session)

The single engine owns **the whole between-fight layer**, not just story beats. New
requirements and the principle behind them:

### 7a. Node-based navigable flow — replaces the forward-only timeline + "die-to-return"
- The stretch between two cities becomes an ordered list of **pitstop NODES**:
  trainer fight · wild encounter · story scene · (optional) rest/branch.
- The player can **CONTINUE forward or GO BACK to the previous city** (heal, shop,
  restock) as an explicit choice — *not* "lose a battle to get sent back." Today the
  only way back is to white out, which reads as weird/confusing. **(bug → fix)**
- **Story points attach to ANY node**, not only battle rows ("story points anywhere").
- **More pitstops can be inserted** between fights (wild encounters + story events as
  first-class nodes) to pace and optimize the route.

### 7b. Isolation principle — "everything happening is on its own"
- Each node is **fully self-contained**. Entering a fight builds fresh battle state;
  leaving it tears that state down. Nothing persists across nodes except the player's
  **party · inventory · flow position**.
- One explicit **reset boundary** between nodes clears: boss/raid mechanics, battle
  log, weather/terrain/hazards, volatile status, stat stages, RNG sub-state.
  *(The engine specialist is confirming the current bleed — maintainer reports boss/raid
  mechanics and battle logs continue into the next fight.)* **(bug → fix)**

### 7c. One of each — collapse the duplicates
| Concern | Today | Target |
|---|---|---|
| Dispatch | 17 functions, 2 eras | **one** node resolver |
| Dedup | 10 maps | **one** `flowSeen` ledger |
| Notifications | 2–3 systems | **one** notification surface |
| Rewards | several grant paths + popups | **one** reward presenter |
| Intros | cold-open + beat-scene + VS-intro + double tutorial | **one** intro per encounter |

### 7d. Current-state catalog (in progress)
Two specialists are cataloging the exact current duplications (intro / notification /
reward systems), the between-battle state-bleed, and the loss-routing, so each
"collapse to one" has a precise **from → to**. Their findings merge into §3/§4 here,
then feed the P2′/P4 build.

---

## 8. Confirmed findings + prioritized fix roadmap (both specialists, this session)

### 8a. State isolation — fights are NOT self-contained (engine specialist, repro-backed)
Root cause: `state` is a **persistent module-level object** (battle.html:14682). The Story
path mutates it in place; `startBattle` resets only a fixed field list — anything off
that list bleeds into the next fight. (PvP/QuickPlay/Frontier build a fresh `state`, so
they're immune — Story-only bug.)
- **BLEED-1 (P1, game-breaking): boss/raid mechanics persist.** `_bossMechanics`,
  `_bossMechanicsFired`, `_bossPendingTelegraphs`, `_bossSurgeTurns`, `_bossImmuneTurns`,
  `_bossWeatherLocked`, `_bossTerrainLocked`, `_activeStoryBeatKey` are written only in the
  boss guard (17219-17228) and never reset. **Proven:** the next ordinary fight keeps the
  boss's surge (+25% foe dmg) and immunity round (damage clamped to 0) — repro: clean
  hit = 105 dmg, post-boss bled = **0 dmg** ("braces — the attack does no damage!").
- **BLEED-2 (P1): battle log persists.** `#battle-log` is cleared only in `returnToHome`
  (15237); the normal victory→next flow never clears it, so each fight's log stacks on the
  prior fight's lines.
- **BLEED-3 (P2): Healing Wish / Lunar Dance pending flags persist.** `_healingWish(Foe)`,
  `_lunarDance(Foe)` survive battle end → next fight's lead gets a free full-heal/status-clear.
- **FIX:** unconditional reset of these in `startBattle`'s reset block (~17148), mirroring
  how `_storyApplyArtifacts` already resets artifact flags each battle. Engine lane, contained.
- Verified NOT bleeding: weather/terrain/hazards/stat-stages/status/HP/PP/mega-dyna-tera.

### 8b. Intros/tutorials — 6 pre-battle layers, two double-fire (story specialist)
- **INTRO-1 (P1): the wild node fires 2 catch screens + 2 tutorials** — `catchTutorial`
  chains into `wildRoute` (`STORY_WILDS_PER_ROUTE_NODE=2`), distinct keys `firstWild` +
  `firstWildRoute` both play. → one tutorial per mechanic.
- **INTRO-2 (P2): the intro-rival fight stacks 3 overlays** (introRival cold-open +
  "Your First Fight" tutorial + VS splash). → one pre-fight overlay.
- **INTRO-3 (P2): catch-tutorial shows a framing message AND a redundant overlay** re-explaining the same mechanic.

### 8c. Notifications — ≈11 mechanisms; rewards invisible behind the victory card
- **NOTIF-1 (P1, user-visible): reward alerts render BEHIND the victory overlay**
  (`showGameAlert` z-1200 vs victory z-9999) — the Master Ball, EXP-Share and Pokédex
  milestone rewards are granted but **never announced**. → thread post-battle rewards onto
  the on-card `_victoryRewardLines`.
- **NOTIF-2 (P2): Pallet Town arrival fires two systems** (inline cold-open + welcome modal).
- 3 generic surfaces (`showGameAlert`, `showToast`, `_storyShowOneTimeTip`) + ~8 bespoke
  full-screen overlays, none sharing a base. → one overlay renderer behind the IntroQueue.

### 8d. Rewards — ~9 grant paths, 3 display channels
- All mutate via one `_storyGrantBundle` (wallet is healthy); only the **display** is split.
- **REWARD-1 (P2): `_storyAwardStoryBeatReward` is granted then discarded** (return value
  ignored at 47695) — shown nowhere.
- **REWARD-2 (P2): one `onBattleEnd` uses 3 channels** (on-card / silent / occluded alert).
- **REWARD-3 (P3): facility gifts double-announce** (in-scene prose + modal). → one on-card channel.

### 8e. Navigation — "die-to-return" confirmed
- **NAV-1 (P1, UX): no voluntary back-nav.** The hub has one forward button
  (`proceedToNextBattle`); "Back to City" reopens the *current* city only. The only mid-route
  hub re-entry is lose → game-over → "Return to Last City". → add a voluntary "Leave / go
  back" affordance through the existing `_storyApplyRetreatToCity` (minus loss framing + fee).
- **NAV-2 (P3): "Return to Last City" snaps to a fixed city,** not a chosen one. Data exists
  (`lastStoryCityEventIndexAtOrBefore`, `cityIndexFromEventIndex`) to build real back-nav.

### 8f. Prioritized roadmap
**Tier 1 — contained, high-impact bug fixes (each its own tested diff): ✅ DONE**
1. ✅ **State-bleed reset** (BLEED-1/2/3) — engine lane, repro-backed. *game-breaking.*
   `db1e8c6` — unconditional between-battle reset in `startBattle`;
   net `tests/suites/battle-state-isolation-v23.test.js`.
2. ✅ **Reward visibility** (NOTIF-1 + REWARD-1) — invisible loot the player earned.
   `86af9b7` — beat + track-end rewards threaded onto `_victoryRewardLines`,
   track reward granted `{silent}`; net `tests/suites/story-reward-visibility-v23.test.js`.
3. ✅ **Wild double-tutorial** (INTRO-1). `8dd1f14` — `_catchIntroSceneId` guard
   suppresses `firstWildRoute` after the catch tutorial;
   net `tests/suites/story-intro-tutorial-dedup-v23.test.js`. *Touches pasteur's
   intro/tutorial domain — implemented with owner go-ahead; pasteur to review.*

**Tier 2 — the single-engine consolidation (the refactor; P1 done):**
4. Story-flow engine live swap + fix (P2′/P4) — node model + one isolation boundary.
5. One notification surface · one reward channel · one intro per encounter.

**Tier 3 — navigation feature:**
6. Continue / go-back navigable pitstops (NAV-1/2) on the node-based map.
