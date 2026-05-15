# STORY_MAP — generated Phase 1 (story-mode Explore agent a68e6a53a949d0a79)

Source: `battle.html` + `docs/STORY_FEATURES_INTEGRATION.md`. All line numbers are approximate at audit time and must be re-verified before any code edit.

## 1. City / route sequence

Defined in `STORY_EVENTS_RAW` at `battle.html:22032–22100`.
Event tuple shape: `[id, type, label, gradeWeights{g1,g2,g3,g4}, rewardCoins, cityActions]`.
Types: `City`, `Battle`, `Hall of Fame`.

| Order | Location | Event ID | Badges before | Gym Leader event | Notable battles |
|---|---|---|---|---|---|
| 0 | City0 (Intro) | 0 | 0 | — | Rival (68, g4:100), Basic Trainer (g4:100) |
| 1 | City1 | 3 | 0 | GL1 (5) | g3–g4 mix |
| 2 | City2 | 9 | 1 | GL2 (11, g3:100) | g3–g4 |
| 3 | City3 | 16 | 2 | GL3 (18, g2:30/g3:70) | Rival (12) |
| 4 | City4 | 22 | 3 | GL4 (24, g2:50/g3:50) | — |
| 5 | City5 | 28 | 4 | GL5 (31, g2:70/g3:30) | — |
| 6 | City6 | 35 | 5 | GL6 (38, g2:90/g3:10) | Rival (39) |
| 7 | City7 | 43 | 6 | GL7 (46, g1:15/g2:85) | Elites begin |
| 8 | City8 | 50 | 7 | GL8 (53, g1:25/g2:75) | — |
| 9 | City9 (League) | 59 | 8 | — | E1–E4, Champion, Rival (65, g1:75/g2:25) |
| 10 | Post-game | 66–67 | 8 | — | Hall of Fame, Mystery Figure (g1:100) |

Rival sprite locked on first encounter via `sm.runRivalSpriteFile`.

## 2. Save state — `pbs_story_save`

Template at `battle.html:22953–22968`. Active keys:

`active, eventIndex, badges, gold, team, inventory, artifacts, activeArtifactType, trainerAssignments, currentTrainerData, settings{minGen,maxGen,enabledGens[],megaOn,zOn,dynaOn,teraOn,classicMode,noItemRun}, gymCleared, unlockedGimmicks, cityRerollsUsed, currentEnemyLock, artifactShopOffersByCity, artifactShopPurchasedByCity, artifactFreeClaimUsed, deptShopPurchasedByCity, storyDifficulty, runSeed, storyMilestoneTips{m4,m8}, storyRetryInventorySnapshot, runRivalSpriteFile, rivalLastWinner, rivalStanding, rivalChampionClaimed, _strngState, version`

**Spec'd but NOT IMPLEMENTED**: `blackMarketUnlocked`, `traderOfferByCity`, `safariZoneType`, `wagerPending/wagerPrompt`, `itineraryProgress`, `pcBox`.

## 3. Story-exclusive items / NPCs

Implemented:
- Artifacts (type amplifier/nullifier/magnetizer) — Department Store; `battle.html:22355`
- Stone Sage / Evolution Tutor — every city; `battle.html:4838–4848`. Free; preserves nature/ability/item/EVs; rerolls moveset; branched evos shuffled at `battle.html:5978`.
- EV Trainer (type presets) — `battle.html:28612+`
- Nature Rater, Professor (initial draft + city rerolls)

Spec'd, not built:
- Poké balls + catchMode shop rows
- Black Market (Rare Candy, Mystery Egg, Forged Pass, Black Market TM, Intel Dossier, Fence)
- Contraband Capsule / Illegal Dealer
- Safari Zone (type-restricted, 500G, post-badge-3)
- Battle-for-Pokémon wager
- Pokémon Trader (City4)
- Trade-evolution flow

## 4. Grade system

`getMonGrade()` at `battle.html:8830–8900`.

| Grade | Rule | Examples |
|---|---|---|
| G1 | Legendary / pseudo-legend / stage2-final ≥570 BST / basic-final ≥570 | Salamence, Gengar, Tyranitar |
| G2 | stage1-final ≥500 BST + curated overrides | Rhydon, Porygon2, Dusclops, Slaking, Archeops, NFE Eviolite users |
| G3 | stage1-mid / stage0 ≥350 / basic-final 380–569 | Graveler, Pupitar |
| G4 | stage0 <350 / basic-final <380 | Rattata, Magikarp, Pidgey |

Curated overrides at `battle.html:8832–8848`.

Progression curve `applyStoryProgressToGradeWeights` at `battle.html:23258–23275`:
- rows 0–11: k=0
- rows 12–24: k=0.20
- rows 25–38: k=0.30
- rows 39+: k=0.40 + 0.48% per row, capped 0.62

Difficulty multipliers `storyDifficultyCoinMult` at `battle.html:22124`: veryeasy 1.60 / easy 1.50 / normal 1.30 / challenge 1.05 / hard 0.92 / hardcore 1.30 (no-heal).

## 5. Dialogue

`TRAINER_QUOTES` at `battle.html:22527–22595`. Shape `{role: [lines]}`, used by `getTrainerQuote()` for pre-battle barks. No branching, no narrative beats authored. Spec calls for ~2–3k lines per chapter arc — currently stubbed.

## 6. Branching

Zero true narrative branches in shipped code. All player choices are cosmetic. Spec mentions villain-arc choices, unimplemented.

## 7. Key file:line references

| Topic | File | Lines |
|---|---|---|
| Story events | battle.html | 22032–22100 |
| Save template | battle.html | 22953–22968 |
| Grade calc | battle.html | 8830–8900 |
| Grade curve | battle.html | 23251–23275 |
| Difficulty mults | battle.html | 22124–22131 |
| Trainer quotes | battle.html | 22527–22595 |
| StoryMode init | battle.html | ~21588+ |
| Stone Sage UI | battle.html | 4838–4848 |

## Audit verdict

Story Mode is **mechanically feature-complete** (progression, grades, shops, tutors, save persistence) but **narratively stubbed** — branching, dialogue, and itinerary beats from `STORY_FEATURES_INTEGRATION.md` are unimplemented.
