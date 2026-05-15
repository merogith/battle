# CODEBASE MAP — generated Phase 0

Sources: two Explore sub-agents (battle-engine `a9501e4d1bbebf11c`, story-mode `a68e6a53a949d0a79`).
All line numbers approximate at audit time — re-verify with Grep before editing.

## Stack

- Language: JavaScript (vanilla, inline in HTML)
- Framework: none — single-page HTML app
- Build: none — `npm start` runs `scripts/dev-server.cjs` on `:5173`
- Test: **none configured** (see FINDING-002)
- Runtime entry: `battle.html` (28,775 lines, ~2 MB), opened directly or via dev server

## Battle engine — `battle.html`

| Subsystem | Lines | Key symbols |
|---|---|---|
| State object | 8759 | `state` (mode, parties, weather, terrain, sides, turn) |
| Action queue | 13992–14050 | `state.p1Action / p2Action` |
| Turn resolution | 14107–14251 | priority → speed → Pursuit interception |
| Damage calc | 12738–17035 | `calcDamage(att, move, def, isPlayer)` |
| Base-power mods | 16284–16427 | weather/terrain/item BP |
| Stat-stage mults | 18261–18262 | `getStageMult`, `getAccEvaMult` |
| Type chart | 6195 | `typeChart` — 18×18 |
| Effectiveness | 16545–16560 | tera override, Delta Stream/Strong Winds |
| Crit | 16692–16707 | `Math.random()` vs critRatio |
| Pre-move checks | 14827–14949 | flinch / sleep / fpara / recharge / lock / taunt / encore / disable / torment / heal block / throat chop / imprison |
| Move-effect switch | 14951–21581 | per-move logic (status moves 19121–20600; hazards 20076–20363; utility 20650+) |
| End-of-turn residuals | 13617–21572 | burn / psn / Leech Seed / weather / terrain / hazards / items |
| Ability immunity | 12668–12714 | `abilityImmunity` |
| Ability damage mod | 12716–12790 | Adaptability, Tough Claws, Iron Fist |
| Contact-triggered abilities | 17366–17381 | Static, Poison Point, Flame Body, Rough Skin |
| Weather-dep abilities | 5890–5905 | `WEATHER_ABILITIES` |
| Effective speed | 14629–14632 | Swift Swim, Chloro, Scarf, Tailwind, TR |
| `applyStatus` | 20653 | Synchronize @ 20708 |
| Confusion roll | 14677–14681 | 50% self-hit |
| Status-immunity abilities | 18361–18446 | Comatose, Water Absorb, etc. |
| Weather setup | 9582–9586 | Rain/Sun/Sand/Hail/HarshSun/HeavyRain/StrongWinds |
| Terrain | 5165–5170 | grassy/electric/psychic/misty, 5-turn default |
| Screens (damage mod) | 16712–16718 | reflect / lightScreen / auroraVeil |
| Hazards | 18925–18964 | SR, Spikes, T-Spikes, Sticky Web |
| Trick Room / Tailwind / Safeguard | (state flags, used at 14629–14632) | |
| Item-active check | 12691 | `canHoldItem` (Embargo / Magic Room) |
| Choice / Life Orb mods | 8671–8701, 12741–12744 | |
| Eviolite (Late-Evo) | 8653–8689, 16161–16172 | `isNFE = build._fullEvolvedPath === false`; artifact blessing at 27180 |
| Item Clause enforcement | 9731–9740 | `enforceItemClause(pool)` |

## Data

| File | Size | Shape |
|---|---|---|
| `data/abilities.json` | 189 KB / 3.7k lines | `{gen: {abilityKey: {inherit?, desc, shortDesc, onResidualOrder?, flags?, ...}}}` |
| `data/items.json` | 196 KB / 6.2k lines | `{gen: {itemKey: {inherit?, onResidualOrder?, shortDesc?, ...}}}` |
| `data/moves.json` | 934 KB / 22k lines | `{gen: {moveKey: {inherit?, category, type, priority, accuracy, secondary, desc, ...}}}` |
| `data/species.json` | 738 KB / 32k lines | `{gen: {speciesKey: {inherit?, baseStats{hp,atk,def,spa,spd,spe}, ...}}}` |
| `data/natures.json` | 1.5 KB / 28 lines | `{gen: {natureKey: {name, plus?, minus?}}}` |
| `data/builds/gen{4..9}.json` | 12.9k lines total | `{species: {tier: {archetype: {moves[], item, nature, evs, ability?, teratypes?, ivs?}}}}` |

**Type chart in code, not data.** Modern chart hardcoded at `battle.html:6195` — confirms spec ("modern type chart regardless of gen toggle") at the data level.

**Gen toggle implication**: data is Showdown gen-overlay style; runtime must resolve to a chosen base (modern) regardless of gen toggle per spec. This needs a confirmation audit in Phase 4.

## Story

| Subsystem | File:Lines |
|---|---|
| Module entry `window.StoryMode` IIFE | battle.html:21588 (~6k-line span) |
| `STORY_EVENTS_RAW` (event/city sequence) | battle.html:22032–22100 (also @22354+) |
| Save template | battle.html:22953–22968 |
| `hasSave / isActive` | battle.html:23143–23148 |
| Menu/screen routing | battle.html:27016–27088 |
| `enterCity / renderCityActions` | battle.html:24323–24362, 22354+ |
| Event launch (`enterBattleEvent → launchBattle → showBattleIntro`) | battle.html:25388–25455 |
| Run summary modal | battle.html:27270–27350 |
| `TRAINER_QUOTES` (one-liner barks) | battle.html:22527–22595 |
| Battle intro renderer | battle.html:25455–25505 |
| Stone Sage / Evolution Tutor UI | battle.html:4838–4848 |
| Branched-evo shuffle | battle.html:5978 |
| Evo lookup | battle.html:26458–26524 |
| Evo Lab facility | battle.html:26476–26639 |
| Late-Evo removal on evolution | battle.html:26601–26609 |

Story Mode also reads gen toggles via mirrored UI at `battle.html:4590–4604` (`story-gen-*-cb`).

## Builds & competitive

| | |
|---|---|
| In-game build entry | `makeBuild(name, gimmickOpts)` @ battle.html:6001 |
| Draft pool / filter | `getDraftPool(enabledGens, grades)` @ battle.html:5860 |
| Gimmick roll | battle.html:6806–6846 |
| Tera-type roll | (in 6806–6846 block) |
| Smogon-set converter | battle.html:7024–7060 |
| Randbats converter | battle.html:7061–7140 |
| Build legality / clauses | item clause @ 9731–9740 (sleep/species clauses to be located) |
| External build generator script | `scripts/generate_builds.js` (produces `data/builds/gen*.json`) |
| Damage validation reference | **none in-tree** (FINDING to add: spec-vs-engine comparison) |

## Settings / toggles

| | |
|---|---|
| `settings` object | battle.html:6372 |
| `persistMiscSettings` (localStorage `pbs_battle_settings`) | battle.html:6389–6398 |
| Settings modal | battle.html:4322–4390 |
| Visual / audio toggle handlers | battle.html:7937–8014 |
| Gen checkboxes (draft) | battle.html:4211–4222 |
| Gen checkboxes (story-mode mirror) | battle.html:4590–4604 |
| Grade checkboxes | battle.html:4230–4234 |
| Mechanic toggles (Mega/Z/Dynamax/Tera) | battle.html:4237–4247 |
| Enabled-gen reader | `getDraftEnabledGensFromUI()` @ battle.html:9648 |
| Story-mode settings inside save | save template `settings:{}` @ 22953–22968 |

**Toggles needing positive+negative tests** (per Phase-1 SETTINGS_MATRIX, to write next):
- Sleep Clause
- Species Clause
- Item Clause (impl confirmed @ 9731–9740)
- Generation toggle (impl confirmed @ 9648 → pool filter)
- Eviolite Late-Evo (impl confirmed @ 8653–8689; `isNFE` flag from build metadata — **audit risk**: depends on build metadata correctness, not runtime species-graph lookup)
- Hidden Ability toggle (location TBD)
- Hardcore mode (`storyDifficulty === 'hardcore'`; HP/PP/status persistence)
- catchMode (per integration spec; partially implemented)
- megaOn / zOn / dynaOn / teraOn
- classicMode
- randomWeather / weatherAnimation / terrainBackground (cosmetic)
- aiProfile: 'aggro' | 'balanced' | 'stall'
- smartDraftPool, gauntletProgressiveDifficulty, storyBattleItems, pvpBattleItems, battleLogDock, displayMode

## Grade / tier / progression

| | |
|---|---|
| Grade definitions / `getMonGrade` | battle.html:8830–8900 |
| Grade curated overrides | battle.html:8832–8848 |
| Grade weights per difficulty | battle.html:23249–23555 |
| Difficulty coin mult | battle.html:22124–22131 |
| Grade curve `applyStoryProgressToGradeWeights` | battle.html:23258–23275 |

**Important**: the two discovery agents disagree slightly on G1/G2 thresholds:
- story-agent says G1 = legendaries / stage2-final ≥570 BST / basic-final ≥570
- engine-agent says G1 = BST ≥ 530 (OU tier)
The actual code at `battle.html:8830` must be the tiebreaker. Phase-1 GRADE_AUDIT needs to read it directly.

## Generation toggle — consumer list

- Draft pool filter — `getDraftPool` @ 5860
- Build lookup gating — inside `makeBuild` @ 6001+
- Story-mode mirror checkboxes — 4590–4604
- Save shape `settings.enabledGens` — 22953+

Per spec, NO consumers should be: type chart, damage formula, ability descriptions, item descriptions, move descriptions, move learnsets — modern data must apply universally. Phase-4 audit will Grep all reads of `enabledGens`, `gen`, `genNum`, `minGen`, `maxGen` and confirm none branch the engine on it.

## Battle AI

| | |
|---|---|
| AI profile | settings @ 6373 |
| Move selection | battle.html:13391–13640 |
| Move-validity gates | 12965–12979 |
| Switch logic | 13475–13639 |

## Shops / inventory

| | |
|---|---|
| Pokémart items table | `POKEMART_ITEMS` (data layer; location TBD via Grep) |
| Dept Store offer | `_ensureDeptItemOfferForCity()` @ 25882 |
| Artifact shop | `enterArtifactShop()` @ 26040 |
| Purchase logic | 25977–26039 |
| Battle bag UI | `openBattleBag()` @ 26676+ |
| City bag UI | `openCityBag()` @ 26676+ |
| Sell | `sellItem` @ 26860 |
| Black Market | **NOT IMPLEMENTED** (FINDING-004) |

## RNG

- Math.random() used directly — no global seeded PRNG visible.
- Fisher–Yates shuffle @ 5304–5318 (uses Math.random).
- Story Mode has `runSeed` in save and a seed input field @ 4623, plus `_strngState` in save — implies *some* seeding exists. Phase-2 RND audit: trace `runSeed` consumers; verify whether the in-battle calls use a seeded stream or `Math.random()`. **Suspected finding**: RNG reproducibility is partial.

## Tests

None configured. See FINDING-002. Phase-2 specialists requiring tests must propose adding a runner (vitest) before delivering verified results.

## Gaps / unknowns

- Sleep Clause / Species Clause: enforcement location not yet located. Grep next session.
- Hidden Ability toggle: not in the settings object enumerated above. Grep for `hidden ability` / `isHA` / `H` ability flag.
- `POKEMART_ITEMS` table line number.
- Reference damage calc: not in repo. Phase 2 DMG validator will need to either embed a port of the Smogon damage calc or build a fixture from known scenarios.
- `STORY_MODE_FLOW.md` is empty (FINDING-001) — the in-code `STORY_EVENTS_RAW` is the only source of truth.
- Reconciliation needed on grade BST thresholds (G1 ≥570 vs ≥530).

## Baseline test result

N/A — no test framework. `node scripts/dev-server.cjs` boots successfully (not run here; trust based on git-clean state and recent merged commits).
