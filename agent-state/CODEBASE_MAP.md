# Codebase Map — Polish session 2026-05-15

## Layout
- `battle.html` — 29,908 lines. Monolithic game (HTML + CSS + JS). All gameplay lives here.
- `data/` — JSON: `species.json` 32k lines, `moves.json` 22k, `items.json` 6k, `abilities.json` 3.7k, `natures.json`, `builds/gen[4-9].json`.
- `move-anim-map.js`, `move-sfx-map.js`, `online-pvp.js`, `online-config.js` — sibling modules.
- `scripts/dev-server.cjs` — `npm start` → `:5173/battle.html`.
- `docs/STORY_MODE_AUDIT.md` — 6-agent audit (~400 lines) from earlier pass.
- `docs/STORY_MODE_DESIGN_DECISIONS.md`, `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md` — prior plans.
- `STORY_MODE_FLOW.md` (root) — current canonical design spec, 470 lines.
- No test suite. No CI. `npm test` does not exist.

## Code anchors (battle.html line numbers)

Note: line numbers are drift-prone. The 2026-05-16 tier session
inserted ~150 LOC at ~24750 (rollTrainerTeam entry) plus a few hook
sites; numbers below are approximate post-edit.

| System | Lines |
|---|---|
| CSS | 16 – 4156 |
| HTML body / screens | 4170 – 5660 |
| Battle engine (damage, types, RNG, AI) | 5670 – 21100 |
| `makeBuild` factory (csvBuilds + designed-build mix) | 6269 |
| `makeDesignedBuild` + `_DESIGNED_ROLE_CONFIG` | 6139 – 6266 |
| `classifyArchetype` | 5851 |
| Damage formula | 16944 |
| Type chart | 6273 |
| AI decision | 13512, 12808 (`aiEstimateDmg`), 12869 (`aiThreatScore`) |
| Confusion/trap/thaw/harvest RNG (Math.random, not seeded) | 18034, 18099, 19118, 21371 |
| `STORY_EVENTS_RAW` (68 rows) | ~22638 |
| `GYM_LEADER_CITY_NAMES` | 22223 |
| Difficulty / coin mult | 21900 – 22000 |
| RNG (`storyRngNext`, seeded LCG) | ~24145 |
| `migrateStoryPreV15` (catch/PC/balls schema) | 23017 |
| `SAVE_VER = 15` | 22886 |
| `getCurrentCityDisplayName` | 24862 |
| `enterCity`, `renderCityActions` | ~24446, ~24600 |
| **Build power tier system** (`STORY_BUILD_TIER`, `_storyBuildTierForEvent`, `_storyDowngradeBuildForTier`, `_applyStoryBuildPowerTier`, `_storyBuildTierForProfessor`) | ~24750 (block immediately before `rollTrainerTeam`) |
| `rollTrainerTeam` + tier hook on both branches | 24938, 25067 |
| `rollMysteryFigureFinalBossTeam` + tier hook | 25156 |
| `enterProfessor` choice loop + tier hook | ~26865 |
| `_pickStarterPartner` (catch tutorial; now uses `makeWildBuild`) | ~26731 |
| `makeWildBuild` (T1 wild build, stamps `powerTier`) | ~28930 |
| `showVictoryOverlay` (badge flavor) | 25880 |
| PC Box (cap 10) | 25934 → 26110 |
| Safari (entry 2,500G, 6 encounters, 15 Safari Balls, 1.25× mult, weights g1:3/g2:22/g3:50/g4:25) | 26119 – 26170 |
| Crucible (post-HoF hub) | 26180 – 26250 |
| Battle Frontier (endless ladder) | 26280 – 26450 |
| Boss arc — Caged God | 26455 – 26630 |
| Catch screen + ball usage | 26760 – 26870 |
| Dialogue pools (`TRAINER_QUOTES`, `TRAINER_QUOTES_BY_NAME`, rival pools, city quotes) | 22602 – 22730 |

## Implementation status vs `STORY_MODE_FLOW.md`
- M0 schema (`pcBox`, `balls`, `pokedex`, `catchUnlocked`, hardcore removed) → **DONE**.
- M1 Pokémon Center + PC + Underground → **DONE** (`#screen-story-pokemoncenter`, PC cap 10, Underground sell).
- M2 Catch + balls + wild routes → **DONE** (`#screen-story-catch`, ball inventory, catch flow).
- M3 Safari Zone → **DONE** (800G entry, 6 encounters per run).
- M4 Boss arc — Caged God → **DONE** (`sm.bossArc`, three leads, Master Ball reward path).
- M5 Polish + Ultra Ball gifts → **mostly DONE** (Ultra Ball static rewards at lines 25700+ exist).
- M6 Crucible + Battle Frontier → **DONE** (post-HoF endless hub).

The spec is largely shipped. This session is **polish + audit**, not greenfield M*.

## Generation toggle
- `sm.settings.enabledGens` filter applied in roller paths. Audit pending: confirm no leakage into learnsets, abilities, items, type chart, or math.

## Known live concerns (from prior audit + my read)
1. **Per-gym-leader victory flavor missing.** `showVictoryOverlay` at line 25892 emits a single generic line "You received a Gym Badge!" for all 8 leaders. Big fanservice win, low risk.
2. **Cities themed by leader name only.** `getCurrentCityDisplayName` swaps in real city per assigned leader, but the rest of the hub UI doesn't reuse the name in scene-setting copy.
3. **Red has 3 ellipsis lines.** Intentional, but every selection lands silent. Worth a faint visual cue.
4. **"Pokemon" without diacritic** in user-facing strings at lines 6280, 6282, 6284, 6286, 6288, 6296, 6301 (Quick Play description), 22165, 22475, 24475 ("Pokemon League"), 8212 ("Draft 3 Pokemon"), 19767, etc.
5. **Confusion/trap/thaw/harvest** use bare `Math.random` mid-battle — drifts seeded story RNG.

## Coding conventions
- No comments unless WHY is non-obvious. Don't reformat unrelated code.
- All gameplay JS sits inside `<script>` inside battle.html. Edits land there.
- Function naming: camelCase. Module-style globals (`window.StoryMode.*`) where exposed.
- Per-feature commits, small reversible diffs.

## Workflow notes
- No tests to run. Verification by playing the game in browser (`npm start`).
- Branch: `claude/polish-story-mode-battle-lT4sx`.
- Commit one polish package at a time.
