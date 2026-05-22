# Multi-Agent Audit Report — Pokemon Battle Game

**Date**: 2026-05-22
**Branch**: `claude/sleepy-volta-9fMzI`
**Scope**: Species coverage, abilities, learnsets, Smogon builds, story-mode implementation.
**Method**: 5 parallel investigation agents (4 completed, 1 hit session-limit and was finished in-process).

---

## Executive Summary

The game is a remarkably ambitious single-file (`battle.html`, 48,416 lines, 3.2 MB) Pokémon engine with Gen 1-9 coverage via toggleable generations and Smogon Showdown-style competitive builds. The data layer is **near-complete**, but several real bugs and data-loss bugs in the build-loading path materially affect what the game actually does versus what the data says.

**Top issues to fix (ranked):**

| # | Severity | Issue | Location |
|---|---|---|---|
| 1 | **P0** | **IV data is silently lost** for ~3,800 build sets (Trick Room / 0-Atk sets reset to 31/31/31/31/31/31). | `battle.html:9308-9341` (`loadBuildsCSV`); CSV schema has no IV columns. |
| 2 | **P0** | **Tera-type curation is dropped** for 2,470 gen-9 sets — game rolls random tera type even when Smogon specifies one. | `battle.html:9308`, `battle.html:10805-10818` (`rollTeraType`). |
| 3 | **P1** | **Farfetch'd / Flabébé builds unreachable** due to UTF-8 corruption (`Farfetchâ€™d`, mojibake) in `data/builds.csv`. Apostrophe / accent encoding. | `data/builds.csv` rows for Farfetch'd, Farfetch'd-Galar, Flabébé. |
| 4 | **P1** | **PC_BOX_CAP = 30 vs spec'd 10** — spec drifted; either spec or code is wrong. | `battle.html:38560`. |
| 5 | **P1** | **False Swipe doesn't preserve 1 HP** — it can KO targets. No explicit handler in code. | `battle.html` (no occurrence; falls through to vanilla damage). |
| 6 | **P1** | **Fell Stinger doesn't grant +3 Atk on KO** — no handler. | `battle.html` (no occurrence). |
| 7 | **P1** | **Doubles VGC builds in singles pools** — VGC sets with Follow Me / Wide Guard get rolled for singles encounters. No filter. | `battle.html:9308-9352`. |
| 8 | **P1** | **Format mixing without weights** — OU mons may roll AAA/Stabmons/Hackmons/Mix-and-Mega builds, equally weighted. | `battle.html:9308-9352`. |
| 9 | **P1** | **Embody Aspect literal mismatch** — `mon.ability === 'Embody Aspect'` never matches data (`"Embody Aspect (Teal)"` etc.); works only via Ogerpon name regex fallback. | `battle.html:13731`. |
| 10 | **P2** | **9 stubbed abilities used in real builds** (Telepathy, Anticipation, Forewarn, Pickup, Mountaineer, Friend Guard, Healer, Symbiosis, Rebound) — Pokémon get an ability with NO effect. | data has them; `battle.html` has no `ability === "X"` check. |
| 11 | **P2** | **10 gen-9 abilities not implemented** that *do* affect singles play: Hospitality, Supersweet Syrup, Wind Power, Cud Chew, Costar, Commander, Seed Sower, Opportunist, Stall. | None in `battle.html`. |
| 12 | **P2** | **6 status moves silently no-op**: Corrosive Gas, Doodle, Flower Shield, Rototiller, Teatime, Venom Drench. | `tests/reports/coverage.md`. |
| 13 | **P2** | **96 "Past"-flagged moves** (gen 4-7 era like Pursuit, Hidden Power) excluded by `@pkmn/dex` gen-9 default. Only species with historical CSV entries containing them retain access. | `battle.html:44435-44461`. |
| 14 | **P2** | **Multi-option abilities collapse at load** — Clefable's `["Magic Guard","Unaware"]` picks ONE at load and is frozen for the session. | `battle.html:9373-9375`, `scripts/generate_builds.js:51-58`. |
| 15 | **P2** | **Sky Drop doesn't lock the target** — only the carrier's two-turn phase works. | `battle.html:15772`, `:20320`. |
| 16 | **P3** | **species.json lower-gen sections (`"1"`–`"8"`) are dead data** — only `["9"]` is read. ~150 KB of unused JSON. | `battle.html:9094-9119`. |
| 17 | **P3** | **Gen-9 species missing builds**: Tauros-Paldea-Combat, Wyrdeer, Klawf, Squawkabilly (all colors), Oinkologne (M/F). Fall back to ancestor / randbats builds. | `data/builds/gen9.json` missing entries. |
| 18 | **P3** | **Cross-gen evolution UX friction** — Primeape (gen 1) → Annihilape (gen 9) blocked if gen 9 disabled. User-visible message exists but evolutionary path is silently truncated. | `battle.html:42552-42575`. |
| 19 | **P3** | **Mega/Primal/Gmax forms tagged to base-species gen** — Charizard-Mega-X gen=1, Kyogre-Primal gen=3. Cosmetic; works because forms are never drafted directly. | `battle.html:9105-9111`. |
| 20 | **P3** | **37 cosmetic-variant species missing `abilities` slot** — Vivillon patterns, Minior colors, Alcremie variants, Burmy weather, Deerling seasons, Shellos-East. | `data/species.json`. |
| 21 | **P3** | **Ball rewards exceed spec** — spec says "Ultra Ball ×2 total" but code grants ~12+ Ultra Balls across GL4/6/7/8/E2-4/Champion/Frontier. Spec drifted. | `battle.html:37268-37398`. |
| 22 | **P4** | **`fetchLiveBuild` is dead code** — defined but never invoked. Conflict with the active CSV path. | `battle.html:10966-10993`. |

---

# Part 1 — Pokémon Species & Generation Toggle

## Species Coverage

- **`data/species.json`** is gen-keyed but only `["9"]` is consumed by the runtime loader (`battle.html:9094-9119`). All other top-level keys (`"1"`, `"2"`, `"4"`–`"8"`) are dead data carried from Pokémon Showdown's mod format. Gen 3 has no top-level key at all.
- `["9"]` contains **1,515 entries** covering the full National Dex through Pecharunt (#1025) plus regional forms, megas, primals, Gmax, alt forms, Tera forms.
- **No missing dex numbers** between 1 and 1025.
- Form coverage: 21 Alolan, 20 Galarian, 16 Hisuian, 4 Paldean, 96 Mega, 2 Primal, 34 Gmax, all Rotom appliances, Deoxys forms, Therian trio, Necrozma trio, Calyrex steeds, all Ogerpon mask + Tera variants, Terapagos forms.

## Generation Toggle Mechanics

- **Core functions** (all clean): `getGenFromDexNum` (`battle.html:8907-8911`), `rangeToEnabledGens` (`:8913-8919`), `normalizeEnabledGens` (`:8920-8924`), `getDraftPool` (`:9412-9439`), `buildGradePool` (`:31217-31232`).
- **Regional form gen bump**: `battle.html:9108-9111` correctly bumps `-Alola` → gen 7, `-Galar`/`-Hisui` → gen 8, `-Paldea` → gen 9.
- **User's "movepool stays same" requirement**: ✅ **CORRECTLY IMPLEMENTED**. The tutor / learnset pool (`_tutorFetchLearnsetMoveNames`, `_tutorGetMergedMovePoolAsync` at `battle.html:44435-44468`) **never consults `enabledGens`**. Toggles only affect species draftability, not movepool.

## Issues

1. **Lower-gen species.json sections are dead data** — `battle.html:9104` iterates only `speciesJSONOrig['9']`. If a contributor adds a gen-1 `inherit:true` override, it is silently ignored. ~150 KB of unread JSON.
2. **Mega/Primal/Gmax gen tagging** — Charizard-Mega-X is tagged gen 1 (base Charizard's gen), Kyogre-Primal is gen 3. Works because Mega/Gmax forms are filtered from draft pools (`battle.html:9415-9418`), but any future "list mons by gen" feature would mistake them for original-gen entries.
3. **Cross-gen evolution gating** — `_getAllEvosWithStatus` (`:42552-42575`) flags evolution targets as `allowed: genSet.has(b.gen)`. Player with gen 9 disabled cannot evolve Primeape → Annihilape. User-facing message exists ("...isn't in your enabled generations") but the entire evo path can be silently truncated.
4. **Cosmetic-variant abilities missing** — 37 entries (Vivillon patterns, Minior colors, Alcremie variants, Burmy/Deerling seasons, Shellos-East) have no `abilities` slot. Battle engine likely falls back to base form, but this is implicit.

## Suggested Fixes

- Either merge lower-gen `inherit:true` overrides into the runtime `baseStats` map (proper Showdown-style mod), or **delete the unused keys** from `data/species.json` (saves ~150 KB).
- Add competitive builds for: **Tauros-Paldea-Combat** (Fighting, Intimidate), **Wyrdeer** (Intimidate support), **Klawf** (Anger Shell SR setter), **Oinkologne** M/F, **Squawkabilly** color variants — currently they fall back to ancestor builds.
- Optional: bump Mega/Primal/Gmax gen tags or add a cross-gen evolution toggle setting.

---

# Part 2 — Abilities

## Data & Implementation Coverage

| Metric | Value |
|---|---|
| Total distinct abilities in `data/abilities.json` (gen-9) | **313** |
| Distinct abilities referenced in Smogon builds (gen4-9) | **218** |
| Abilities with `ability === "X"` references in `battle.html` | **271** |
| Code coverage of data | **86.6%** (271/313) |
| "Stubbed" abilities (in data, no code) | **42** |
| Stubbed abilities **used in real builds** | **9** ⚠ |
| Build-ability ↔ data mismatch | **0** ✅ |
| Build-species ↔ species.json mismatch | **0 non-CAP** ✅ (39 CAP species in builds have no species data — fall through correctly) |

The engine loads only the gen-9 ability map at runtime (`battle.html:9153` — `abilitiesJSON = abilitiesJSONOrig['9']`), making this **gen-9 monolithic**: builds from gen 3-7 receive the gen-9 interpretation of their abilities. The lower-gen override blocks in `data/abilities.json` are not consulted.

## Critical Issues

### Embody Aspect literal mismatch (P1)
`battle.html:13731` reads `mon.ability === 'Embody Aspect'`. But species.json stores Ogerpon's hidden ability as `"Embody Aspect (Teal)"`, `"Embody Aspect (Wellspring)"`, `"Embody Aspect (Hearthflame)"`, `"Embody Aspect (Cornerstone)"`. The literal check **never matches**. The effect still fires due to the `/^Ogerpon/.test(mon.name)` regex fallback in the same line, but a maintainer editing the species data with the canonical bare name will see the check fail.

**Fix:** change to `(mon.ability || '').startsWith('Embody Aspect')`.

### Stubbed abilities used in real builds (P2)
Pokémon with these abilities currently have **no effect** at all:

| Ability | Build Uses | Sample Species |
|---|---|---|
| Telepathy | 23 | Wobbuffet, Musharna, Gardevoir, Florges |
| Anticipation | 12 | Ferrothorn (HA), Croagunk |
| Forewarn | 10 | Jynx, Smoochum |
| Pickup | 2 | Pachirisu, Dedenne |

(Plus doubles/CAP-only: Friend Guard, Healer, Symbiosis, Mountaineer, Rebound — defensible omissions in a singles engine.)

### Gen-9 abilities with NO implementation (P2)
Singles-relevant abilities present in data but no code:
- **Hospitality** (Sinistcha)
- **Supersweet Syrup** (Hydrapple)
- **Wind Power** (Kilowattrel)
- **Seed Sower** (Arboliva)
- **Cud Chew** (Farigiraf)
- **Opportunist** (Espathra)
- **Stall** (Sableye, priority drop)

### 677 illegal (species, ability) build pairs (works as intended)
The CSV merges fan-made "Almost Any Ability" and "Hackmons" formats where Pokémon can hold illegal abilities (Alakazam + Sheer Force, Mawile + Huge Power, Snorlax + Poison Heal, Scizor + Flash Fire, Heracross + Skill Link, ...). `_isBuildAbilityIllegal` (`battle.html:9295-9306`) detects these and **opts them out of normal draft pools**, surfacing them only in end-game story-mode opt-in via `_storyInjectIllegalBuilds()` (`:32172-32219`). This is a deliberate difficulty knob, not a legality bypass.

## Suggested Fixes

1. **`battle.html:13731`**: `mon.ability === 'Embody Aspect'` → `(mon.ability || '').startsWith('Embody Aspect')`.
2. Add **minimal stubs** with on-switch info text for **Anticipation, Forewarn, Stall (priority)**, and the on-hit setters **Seed Sower** (sets Grassy Terrain), **Supersweet Syrup** (one-time evasion drop on switch-in), **Wind Power** (sets charged flag on wind-move hit).
3. **Backfill `abilities` slot** for the 37 cosmetic-variant species in `data/species.json` (one-line copy from base form each).

## Key File References (Abilities)

| Subsystem | Anchor |
|---|---|
| Ability data load (gen-9 only) | `battle.html:9094-9160` |
| Illegal-build heuristic | `battle.html:9280-9304` |
| Illegal injection (story difficulty) | `battle.html:32146-32219` |
| Intimidate impl | `battle.html:23731-23753` |
| Embody Aspect impl (with bug) | `battle.html:13729-13753` |
| Protosynthesis/Quark Drive | `battle.html:23890-23900` |
| Tough Claws / Sharpness | `:17677-17680`, `:21731-21738` |
| Toxic Chain | `:22478-22479` |
| Good as Gold | `:24295-24297` |
| Earth Eater | `:20928-20933` |
| Purifying Salt | `:17566`, `:21839-21840` |
| Mummy / Lingering Aroma | `:22647-22660` |

---

# Part 3 — Moves & Learnsets

## Move Data

| Metric | Value |
|---|---|
| Total distinct move IDs in `data/moves.json` | **954** (gen-9 superset; gens 1-8 hold overrides only) |
| Moves used in Smogon builds (gen4-9) | **699** |
| Build-move ↔ data mismatch | **0** ✅ |
| Moves with explicit `name === "X"` branch | 796 (83.4%) |
| Moves handled data-driven (boosts/secondary/multihit) | 90 (9.4%) |
| Damage-only moves (BP > 0, no extras) | 62 (6.5%) |
| **Truly unhandled (silent no-op)** | **6** (Corrosive Gas, Doodle, Flower Shield, Rototiller, Teatime, Venom Drench) |

## Learnset System

The game uses **`@pkmn/dex` from CDN** for learnsets (loaded async via dynamic `<script>` tags in `battle.html:10034-10051`). The merged tutor pool (`_tutorGetMergedMovePoolAsync`, `:44463`) unions:

1. **Synchronous CSV side** — every move appearing in any Smogon build for the species or its base/changesFrom/prevo (`_tutorGetPoolForMon`, `:44318`).
2. **Async @pkmn/dex side** — `D.learnsets.get(name).learnset` keys for self + base + changesFrom + full prevo chain (`_tutorSpeciesKeysForLearnset`, `:44393`).

**This is gen-AGNOSTIC at the toggle level** ✅ — no consultation of `enabledGens`. The user's "movepool stays same" requirement is satisfied at the toggle level.

**However**, `@pkmn/dex`'s default Dex is **gen-9 only**. Moves removed in gen 8/9 (Pursuit, Hidden Power × 16 variants, Return, Frustration, Refresh, Magic Coat, Snatch, Wring Out, Lovely Kiss, etc.) are flagged `isNonstandard: "Past"` and **excluded** from the gen-9 learnset. The **96 such moves** that appear in gen 4-7 Smogon builds remain accessible only via the CSV side — a Pokémon with no historical Smogon build using a "Past" move cannot teach it.

## Critical Move Bugs

### False Swipe doesn't preserve 1 HP (P1)
No handler in `battle.html`. False Swipe is treated as a vanilla 40 BP Normal attack and will KO targets. This is canonical catching utility — broken.

**Fix:** in the damage clamp block near `battle.html:21100` (where Sturdy/Focus Sash live), add: `if (move.name === "False Swipe" && damage >= defender.currentHp) damage = defender.currentHp - 1;`

### Fell Stinger no +3 Atk on KO (P1)
No handler. Falls through to default damage. **Fix:** in the post-damage / on-KO hook around `:22000-22400`, branch on `move.name === "Fell Stinger" && defender.currentHp <= 0` and call `changeStage(attacker, 'atk', 3)`.

### Sky Drop doesn't lock target (P2)
Only the user's two-turn airborne phase is modeled (`battle.html:15772`, `:20320`). The carried Pokémon should also vanish and lose its turn. **Fix:** set `defender.volatile.skyDropTarget = attacker` on use and gate `canMove` on it.

### Block / Mean Look / Spider Web missing trap logic (P2)
Status moves listed in builds with no explicit `name ===` branch — likely silent no-ops. **Fix:** set `defender.volatile.trapped = true`.

### Foresight / Odor Sleuth no impl (P3)
No removal of Ghost-type immunity to Normal/Fighting moves. ~20 builds list them.

### `@pkmn/dex` gen-9 cuts 96 legacy moves (P2)
Tutor side won't expose Pursuit / Hidden Power / Return / Frustration for species without a historical Smogon CSV row using them.
**Fix:** In `_tutorFetchLearnsetMoveNames` (`battle.html:44443`), loop over `[4,5,6,7,8,9]` calling `Dex.forGen(g).learnsets.get(name)` and union all results — `@pkmn/dex` supports this.

## Implemented Mechanics (Spot-Check Confirmed)

✅ U-turn, Volt Switch, Flip Turn, Parting Shot, Baton Pass; ✅ Stealth Rock, Spikes, Toxic Spikes, Sticky Web, Defog, Rapid Spin, Mortal Spin, Tidy Up; ✅ Toxic / Thunder Wave / Will-O-Wisp / Glare / Spore / Sleep Powder / Yawn; ✅ Taunt, Encore, Disable, Imprison, Heal Block, Embargo, Wonder Room, Magic Room, Trick Room, Trick/Switcheroo, Magic Coat; ✅ Belly Drum, Shell Smash, Geomancy, Acupressure; ✅ All recovery moves via `_recoveryMoves` Set; ✅ Sucker Punch, Last Resort, Fake Out, First Impression, Pursuit; ✅ Fly/Bounce/Dig/Dive/Solar Beam/Solar Blade/Sky Drop/Skull Bash/Sky Attack/Meteor Beam/Razor Wind/Electro Shot/Freeze Shock/Ice Burn; ✅ Future Sight, Doom Desire; ✅ Counter, Mirror Coat, Metal Burst, Comeuppance, Endeavor, Final Gambit; ✅ Body Press, Foul Play; ✅ Knock Off + 1.5× BP; ✅ Tera Blast, Tera Starstorm, Last Respects, Rage Fist, Salt Cure, Glaive Rush, Headlong Rush, Stone Axe, Ceaseless Edge, Revival Blessing, Grassy Glide priority, Burning Bulwark, Silk Trap.

## Z-moves / Max moves / Tera Blast

- **Z-moves**: implemented via `buildZMove` (`battle.html:13833`); signature Z-moves keyed in `SIGNATURE_Z` / `SIGNATURE_Z_MOVE_NAMES`. Gated by `settings.mechanics.zmove`.
- **Dynamax / G-Max**: implemented via `buildMaxMove` (`:13932`); G-Max signature secondary effects table at `:13896`.
- **Tera Blast**: implemented at `:20196`. Becomes user's Tera type, switches category to Physical if Atk > SpA, with a 60 BP floor for the type. Stellar path supported.

## Suggested Fixes (Moves)

1. Add False Swipe / Fell Stinger handlers.
2. Add the 6 unhandled status moves to `BANNED_MOVES` (`battle.html:8953`) — only Doodle is competitively notable; rest are spread-only VGC.
3. Patch `_tutorFetchLearnsetMoveNames` to union learnsets across all gens via `Dex.forGen(g)` so "Past"-flagged moves stay accessible.
4. Implement Block / Mean Look / Spider Web trap volatile.
5. Implement Foresight / Odor Sleuth ghost-immunity strip.
6. Fill in the 351 `it.todo` test stubs in `tests/moves/by-category/*.test.js` to lock in regression coverage.

---

# Part 4 — Smogon Builds Integration

## Inventory

| Gen | Species w/ builds | Build roles | Format keys |
|-----|---|---|---|
| 4 | 493 | 1,603 | 11 |
| 5 | 638 | 2,391 | 15 |
| 6 | 729 | 2,899 | 23 |
| 7 | 830 | 2,779 | 22 |
| 8 | 623 | 3,447 | 31 |
| 9 | 653 | 4,262 | 32 |
| **Total** | **1,147 unique species** | **17,381 roles** | **55 unique formats** |

55 format keys span: standard tiers (ou, uu, ru, nu, pu, lc, zu, ubers, monotype, nfe, doublesou, anythinggoes, 1v1, cap), side modes (almostanyability, balancedhackmons, purehackmons, mixandmega, stabmons, godlygift, inheritance, partnersincrime, camomons, letsgoou, dreamworldou, middlecup, ubersuu), national-dex variants (nationaldex, nationaldexag, nationaldexmonotype, nationaldexru, nationaldexuu, nationaldexubers, nationaldexdoubles), VGC 2009-2025, BSS, BSD, Battle Spot Singles/Doubles/Triples, BDSP OU.

## Loading & Selection

**Primary load** (`battle.html:9308-9352`, `loadBuildsCSV`):
- Reads `data/builds.csv` (1.88 MB, 16,745 rows).
- **All six gens, all 55 formats are merged** into ONE per-species pool with NO format/gen distinguisher.
- Each build is tagged into ONE of 5 gimmick buckets: regular / weather / mega / z-attack / tera (`scripts/generate_builds.js:tagBuild`).

**Build selection** (`battle.html:9699-9923`, `makeBuild`):
1. With probability `1 - settings.csvBuildMix` (default 0.7 CSV / 0.3 designed), use procedurally-generated `makeDesignedBuild` (uses CSV move pool but custom EVs/items).
2. Roll gimmick (random pick: MEGA/ZMOVE/DYNAMAX/GMAXDYNAMAX/TERA/STANDARD per `settings.mechanics`).
3. Select pool by gimmick tag; fall back to regular+weather.
4. Filter illegal builds unless opt-in.
5. Resolve multi-option moves (`"A/B"`) per roll.

## Critical Issues

### P0 — IV data silently lost
`data/builds.csv` has no IV columns. The build generator (`scripts/generate_builds.js`) doesn't emit them, and `loadBuildsCSV` doesn't read them. ~3,800 sets with explicit IVs (Trick Room sets with `spe: 0`, Foul Play resistant sets with `atk: 0`, Gyro Ball sets) **flatten to 31/31/31/31/31/31**.

Gen 9 alone: 1,278/4,262 sets ship explicit IVs (~30%). All silently lost on the primary path.

**Fix:** Add `iv_hp,iv_atk,iv_def,iv_spa,iv_spd,iv_spe` columns; update `generate_builds.js:119-167`; update `battle.html:9321-9333` to consume.

### P0 — Tera type curation dropped
2,470 / 4,262 gen-9 sets specify `teratypes: [...]` (over half of gen-9 sets!). The CSV doesn't carry the column. `rollTeraType` (`battle.html:10805-10818`) accepts a curated pool from `b._teratypes`, but only `convertSmogonSet` (`:11029`, fed only by the dead `fetchLiveBuild`) populates it. The active CSV path **completely ignores curated tera types** — the engine weighted-rolls instead.

**Fix:** Add `teratypes` column to CSV (pipe-delimited), carry through to `b._teratypes`.

### P1 — Farfetch'd / Flabébé unreachable
The CSV has UTF-8 mojibake on three species names: `Farfetchâ€™d`, `Farfetchâ€™d-Galar`, `FlabeÌ\x81beÌ\x81`. JSON has correct names. The `csvBuilds` lookup is name-equal (no normalization), so `csvBuilds["Farfetch'd"]` is empty and these species fall through to randbats / hardcoded Tackle/Growl/Leer/Quick Attack.

**Fix:** Re-run `generate_builds.js` with UTF-8 enforcement; verify with `python3 -c 'open("data/builds.csv","rb").read().decode("utf-8")'`.

### P1 — Format mixing without weights
A Garchomp pool equally weights OU + AAA + Stabmons + Mix-and-Mega + Inheritance + Camomons + Godly Gift + Camomons + every VGC year. Non-vanilla formats use illegal moves/abilities (detected by `_isBuildAbilityIllegal` and gated to end-game). But within "legal" formats, an OU Garchomp could roll a VGC 2024 build with Tailwind/Protect-heavy doubles support moves.

**Fix:** Add `gen`/`format` columns to CSV; expose a settings filter; default to standard tiers, hide side modes behind a toggle.

### P1 — Doubles VGC builds in singles
No filter separates doubles from singles. Pokémon may roll Battle Spot Doubles / VGC sets with Follow Me, Wide Guard, Helping Hand, Tailwind, Protect-heavy roles in singles matches. **Fix:** add `category: singles|doubles` column.

### P1 — Multi-option abilities collapse at load
When a build's `ability: ["Magic Guard","Unaware"]` loads, only the first is kept (CSV) or one random is picked at load (API). A Clefable that came up Magic Guard once stays Magic Guard forever in that session. **Fix:** Encode alternatives as `Ability A|Ability B` in CSV and pick per-encounter (like moves).

### P2 — Dead `fetchLiveBuild` path
`battle.html:10966-10993` defined but never invoked. Either wire to a "regen build" button or delete.

### P2 — Gen-9 species missing builds
Tauros-Paldea-Combat, Wyrdeer, all Squawkabilly variants, Klawf, Oinkologne (M+F), and a long tail of gen-9 mid-evos. The build fallback chain (`battle.html:9699-9792`) is robust — tries `csvBuilds[name]` → `csvBuilds[baseSpecies]` / `changesFrom` / `prevo` → randbats[9→4] → hardcoded `{Tackle, Growl, Leer, Quick Attack}` — but the inheritance is sub-optimal for newly-added species without a competitive role.

## Coverage Checks That Pass

✅ All 277 unique items in builds are in `data/items.json`.
✅ All 699 unique moves in builds are in `data/moves.json`.
✅ All 218 unique abilities in builds are in `data/abilities.json`.
✅ Z-Crystals (`Z_TYPE_MAP`, `Z_TYPE_MAP_VALUES`, `SIGNATURE_Z` at `battle.html:10676-10726`): full coverage of gen 7 signature crystals.
✅ Mega Stones (`MEGA_STONE_MAP`, `:10632-10672`): 47 species + Primal Reversion + Rayquaza Dragon Ascent path.
✅ All 25 natures present (`data/natures.json` + inline `natureModifiers` at `:9942`).
✅ EV cap (252 per stat, 510 total) enforced (`battle.html:13295-13297`).
✅ Lv50 stat formula correct (`buildPokemon` at `:13278-13336`).

## Key File References (Builds)

| Subsystem | Anchor |
|---|---|
| `loadBuildsCSV` (primary, drops IVs/teratypes) | `battle.html:9308-9352` |
| `populateCsvBuildsFromAPI` (fallback) | `battle.html:9356-9404` |
| `_isBuildAbilityIllegal` | `battle.html:9295-9306` |
| `getDraftPool` | `battle.html:9412-9439` |
| `speciesNamesForBuildLookup` / `resolveCsvBuildEntry` | `battle.html:9517-9550` |
| `makeBuild` | `battle.html:9699-9923` |
| Mega/Gmax/Z-crystal/Signature-Z tables | `battle.html:10632-10726` |
| `rollTeraType` (curated pool unused) | `battle.html:10805-10818` |
| `convertSmogonSet` (preserves IVs+tera; only fed by dead code) | `battle.html:11006-11030` |
| `buildPokemon` (stat math, EV/IV/nature) | `battle.html:13278-13417` |
| Build generator script | `scripts/generate_builds.js` |

---

# Part 5 — Story Mode (The Main Game)

## Spec Alignment Audit

The canonical spec is `STORY_MODE_FLOW.md` (1,188 lines). Cross-checked against actual code.

### ✅ Matches spec

| Subsystem | Spec | Code | Anchor |
|---|---|---|---|
| Catch math `chance = species.catchRate × ballMult` | — | `_CATCH_BALL_MULT`, `_CATCH_RATE_BY_GRADE`, `_CATCH_FLEE_BY_GRADE` | `battle.html:39584-39586` |
| Grade catch rates (G1=0.12, G2=0.22, G3=0.35, G4=0.50) | spec | exact match | `:39585` |
| Grade flee rates (G1=0.40, G2=0.28, G3=0.20, G4=0.12) | spec | exact match | `:39586` |
| Master Ball = `Infinity` | spec | exact | `:39584` |
| Ball multipliers (PokéBall 1.0, Great 1.5, Ultra 2.0) | spec | exact | `:39584` |
| Wilds per route node = 2 | spec | `STORY_WILDS_PER_ROUTE_NODE = 2` | `:39661` |
| Safari entry cost = 10,000G | spec | `SAFARI_ENTRY_COST = 10000` | `:38834` |
| Safari max encounters = 6 | spec | `SAFARI_MAX_ENCOUNTERS = 6` | `:38835` |
| Safari balls per session = 15 | spec | `SAFARI_BALLS_PER_SESSION = 15` | `:39604` |
| Safari ball mult = 1.35 | spec | `SAFARI_BALL_MULT = 1.35` | `:39603` |
| Safari Bait catch/flee mult = 0.70 / 0.55 | spec | exact | `:39610-39611` |
| Safari Rock catch/flee mult = 1.65 / 1.70 | spec | exact | `:39612-39613` |
| Safari turn-flee cap = 0.45 | spec | `SAFARI_TURN_FLEE_CAP = 0.45` | `:39626` |
| Bait/Rock turn-flee mults = 0.20 / 0.55 | spec | exact | `:39624-39625` |
| Underground prices 1800/450/250/60 | spec | `_PC_UNDERGROUND_PRICE_BY_GRADE` | `:38568` |
| PokéBall price 300G | spec | `POKEMART_ITEMS[0].price=300` | `:28877` |
| Great Ball price 1000G | spec | `POKEMART_ITEMS[*].price=1000` | `:28897` |
| Difficulty modes 5 (hardcore removed) | spec | veryeasy/easy/normal/hard/challenge | `:13238`, `:28083` |
| Foe stat mult 0.70/0.85/1.00/1.15/1.30 | spec | exact | `:13238-13241` |
| Coin mult 1.60/1.50/1.30/1.00/1.10 | spec | exact | `:28084-28091` |
| Hardcore → normal migration | spec | yes | `:30604` |
| Pre-Gym-1 foe stat mult = 0.82 | spec | `PRE_GYM1_FOE_STAT_MULT = 0.82` | `:13161` |
| Early-game (1 badge) foe mult = 0.92 | spec | `EARLY_GAME_FOE_STAT_MULT = 0.92` | `:13162` |
| Early GL (GL1/GL2) foe mult = 0.95 | spec | `EARLY_GL_FOE_STAT_MULT = 0.95` | `:13163` |
| Party cap `min(6, 2+badges)` | spec | `Math.max(2, Math.min(6, 2 + badges))` | `:37344` |
| Catch tutorial fires once per save | spec | `sm.catchTutorialDone` | `:30619`, `:37510-37533` |
| Pokédex (seen + caught) | spec | `sm.pokedex = {seen, caught}` | `:30115-30150`, `:30594-30595` |
| Boss arc with 3 leads + cage + boss | spec | `sm.bossArc = { available, leads, cageUnlocked, boss, cleared }` | `:39360-39500` |
| Roaming legendary moved to Gym 8 | recent commit | `sm.roamingLegendary` | `:35336`, `:37439-37485` |
| Mid-battle form exclusion from rolls (`STORY_NONSTANDARD_FORMS`) | spec | implemented | `:31152-31185` |
| Smogon-build power tier (T1-T4) | post-spec | `STORY_BUILD_TIER` | `:31769`, `:31936-32000` |

### ❌ Spec drift / discrepancies

| Item | Spec | Code | Notes |
|---|---|---|---|
| **PC capacity** | **10** | **`PC_BOX_CAP = 30`** | `battle.html:38560`. Either spec or code is stale — code has 3× the spec. |
| **Ultra Ball ×2 total** | spec | reality: ~12+ across GL4/6/7/8/E2-4/Champion/Frontier rewards | `battle.html:37268-37398` — economy was loosened post-spec. |
| **Master Ball ×1 from boss arc** | spec | bundle at `:39261` grants `masterBall:0` — need to verify final reward location | likely fine but worth confirming. |
| **Wild grade per-grade flee G1=55%/G2=*/G3=*/G4=20%** | spec | safari flee uses `_CATCH_FLEE_BY_GRADE` from catch system (0.40/0.28/0.20/0.12) — distinct values from spec | spec table for Safari uses different numbers than catch screen; reconcile. |
| **STAGE2_GL_FOE_STAT_MULT = 0.97 (Gym Leader 3)** | NOT in spec | added in code | `:13164`, `:13185`. Newer softening tier not documented. |

### Subsystem-by-subsystem

**Map / event pipeline** ✅
- `STORY_EVENTS_RAW` at `battle.html:27969`. Cities + Battles + HoF rows. Route nodes are runtime interrupts via `_isFirstBattleOfNewRoute` (`:39648`).
- Multi-wild interrupt with `sm.wildSeenByEventIdx` (`:39669-39702`) — legacy `true` migration handled.

**Wild encounters** ✅
- `_WILD_GRADE_CURVE_BY_BADGES` referenced (`:35392`, `:36811`).
- Filtered by `sm.settings.enabledGens` per generation toggle.
- Tutorial mon at Grade 4 (curve forces g4:100 at 0 badges).

**Safari Zone** ✅
- All constants match spec exactly.
- Bait/Rock turn-flee math implemented (`:40694-40697`).
- 15-balls-per-session enforcement (`:38885`).
- Per-grade flee in `_SAFARI_GRADE_CURVE_BY_BADGES` (`:38842`).

**Catch minigame** ✅
- Formula at `:39581-39586` matches spec.
- 6/6 party + 30/30 (= PC cap mismatch!) full message at `:40484-40487`.

**Balls and economy** ⚠ (drift)
- Mart prices match.
- Ultra/Master ball distribution is more generous than spec.

**Pokémon Center hub** ⚠ (drift)
- PC tab works, BUT `PC_BOX_CAP = 30` ≠ spec's 10.
- Underground tab + sell prices match.
- Unsellable rules: present (starter, last-party-mon, boss-arc — but worth double-checking edge cases).

**Difficulty modes** ✅
- 5 modes, hardcore removed, hardcore→normal migration, all multipliers match.
- Bonus: STAGE2_GL_FOE_STAT_MULT = 0.97 for GL3 (extra softening, not in spec).

**Badge curve / party caps** ✅
- `min(6, 2+badges)` with floor 2 at `:37344`.

**Professor visibility, Rival, Intro Rival, catch tutorial** ✅
- Catch tutorial fires once per save, fills slot 2 at cap=2.
- Intro Rival special-cased.

**Pokédex** ✅
- `sm.pokedex = {seen, caught}` with arrays.
- `pbs_story_meta` localStorage referenced for cross-run carry.

**Boss arc** ✅
- `sm.bossArc` with leads (ledger/recording/key), cageUnlocked, boss (rolled legendary), cleared.
- Master Ball reward path present.

**Build power tier (NEW since spec)** ✅
- `STORY_BUILD_TIER` (UNTRAINED/NOVICE/COMPETENT/TOURNAMENT) at `:31769`.
- `_storyBuildTierForEvent` and `_storyBuildTierForProfessor` route trainer events to tiers.
- `_storyDowngradeBuildForTier` modulates EVs/items/abilities/moves at lower tiers.
- Catch tutorial Pidgey/Rattata uses `makeWildBuild` (T1) for tier parity.

## Critical Story-Mode Issues

1. **PC_BOX_CAP = 30 vs spec'd 10** — spec drifted or code is wrong. The 3× increase makes the Underground less of a meaningful sell decision (spec called PC tightness deliberate). Decide which is canonical.
2. **Safari flee numbers don't match spec table** — spec §4 has G1 55% / G2 / G3 / G4 20% per-grade flee for Safari, but `_CATCH_FLEE_BY_GRADE` ships 0.40/0.28/0.20/0.12. Either the catch screen reuses the wrong values for Safari, or the spec hasn't been updated to reflect the actual numbers.
3. **STAGE2_GL_FOE_STAT_MULT = 0.97 undocumented** — GL3 has additional softening that the spec doesn't mention. Update spec or remove.
4. **Ball economy drift** — Ultra Ball distribution is way more generous than spec. Either update spec or trim.

## Subsystem Status Summary

| Subsystem | Status |
|---|---|
| STORY_EVENTS_RAW + route nodes | ✅ Done |
| Pokémon Center + PC + Underground | ✅ Done (PC_BOX_CAP drift) |
| Catch screen + balls | ✅ Done |
| Safari Zone (bait/rock/turn-flee) | ✅ Done |
| Boss arc (Caged God) | ✅ Done |
| Battle Frontier (endless ladder) | ✅ Done |
| Crucible (post-HoF hub) | ✅ Done |
| Catch tutorial | ✅ Done |
| Pokédex + meta storage | ✅ Done |
| Difficulty modes (5, no hardcore) | ✅ Done |
| Badge/party cap curve | ✅ Done |
| Roaming legendary | ✅ Done (moved to Gym 8) |
| Mart per-city locks | ✅ Done (recent fix) |
| Build power tier system | ✅ Done (T1-T4) |
| Underground sell with restrictions | ✅ Done |
| Mid-battle form exclusion | ✅ Done |

---

# Cross-Cutting Recommendations

## Priority 0 (data loss; do first)
1. **Add IV columns** to `data/builds.csv` + `generate_builds.js`; consume in `loadBuildsCSV`. Affects ~3,800 sets.
2. **Add tera-type column** to `data/builds.csv` + `generate_builds.js`; populate `b._teratypes` so `rollTeraType` uses curated pool. Affects 2,470 gen-9 sets.
3. **Fix Farfetch'd / Flabébé UTF-8 corruption** in `data/builds.csv`. Re-regenerate with explicit UTF-8 enforcement.

## Priority 1 (correctness bugs)
4. **Embody Aspect literal mismatch** at `battle.html:13731` — `mon.ability === 'Embody Aspect'` → `(mon.ability || '').startsWith('Embody Aspect')`.
5. **False Swipe + Fell Stinger** — add explicit handlers.
6. **Doubles VGC build filter** — add `category` column, filter by battle mode.
7. **Format weighting** — add `format` column, allow toggling side modes.
8. **Multi-option ability per-encounter pick** — encode as `A|B` in CSV.
9. **PC_BOX_CAP reconcile** — decide if 10 or 30; update spec or code.

## Priority 2 (missing implementations)
10. **9 stubbed abilities used in builds** — at minimum add Anticipation, Forewarn (on-switch info text), Stall (priority drop).
11. **10 gen-9 ability stubs** — Hospitality, Supersweet Syrup, Wind Power, Seed Sower, Cud Chew, Opportunist (singles-relevant ones).
12. **Past-flagged moves** — patch `_tutorFetchLearnsetMoveNames` to union via `Dex.forGen(g)` for g in [4..9].
13. **6 unhandled status moves** — either implement or add to `BANNED_MOVES`.
14. **Block / Mean Look / Spider Web / Foresight / Odor Sleuth / Sky Drop target lock** — add handlers.
15. **Add competitive builds** for Tauros-Paldea-Combat, Wyrdeer, Klawf, Squawkabilly, Oinkologne.

## Priority 3 (hygiene)
16. **Delete dead `fetchLiveBuild`** path (`battle.html:10966-10993`).
17. **Either merge or delete** the unused `data/species.json` lower-gen blocks.
18. **Backfill `abilities` slot** on 37 cosmetic-variant species.
19. **Document build-power-tier and STAGE2_GL_FOE_STAT_MULT** in spec.
20. **Decide on cross-gen evolution** — toggle setting, or accept current friction.

## Test Coverage Gaps
- 351 `it.todo` stubs in `tests/moves/by-category/*.test.js` — generated but not filled in.
- No tests for ability implementations.
- No tests for the build-loader path (IV/tera/encoding bugs would be caught easily).

---

# Appendix — How the agents investigated

Five parallel investigation agents:

| Agent | Status | Scope |
|---|---|---|
| Species & generations | ✅ Completed | species.json coverage, gen toggle, form handling |
| Move learnsets | ✅ Completed | moves.json coverage, @pkmn/dex integration, competitive impls |
| Abilities | ✅ Completed | abilities.json coverage, code dispatch, stub list |
| Smogon builds | ✅ Completed | build inventory, selection logic, IV/tera loss |
| Story mode | ⚠ Hit session limit; finished by main agent | spec compliance audit |

All findings cross-referenced to `battle.html:LINE` so each issue is one click away from verification.
