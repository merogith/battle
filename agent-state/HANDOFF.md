# Handoff — 2026-05-16 (build power tier session)

## Current branch
`claude/improve-build-generation-7AOc7` — pushed.

## Session goal
"Story mode build generation feels chaotic / too random. Scale build
power level (EVs, natures, items, abilities, moves) across the story
arc so pre-Gym-1 trainers feel like route trainers and the Elite Four /
Champion still feel like a wall." Phase A only — see CHANGELOG entry
for the full scoping note.

## What landed (`claude/improve-build-generation-7AOc7`)

### New: `_storyBuildTierForEvent` + `_storyDowngradeBuildForTier`

Inserted right before `rollTrainerTeam` (`battle.html` ~line 24752 in
the pre-edit file, the helpers are ~150 LOC). Public surface:

| Helper | Purpose |
|---|---|
| `STORY_BUILD_TIER` (frozen const) | `{ UNTRAINED:1, NOVICE:2, COMPETENT:3, TOURNAMENT:4 }` |
| `_storyBuildTierForEvent(eventType, storyRowIdx, badges)` | maps trainer event → tier |
| `_storyBuildTierForProfessor(cityIdx, badges)` | maps Professor city → tier |
| `_storyDowngradeBuildForTier(name, build, tier)` | mutates build in place; T4 is no-op |
| `_applyStoryBuildPowerTier(team, eventType, storyRowIdx)` | final-pass hook for trainer teams |

### Hook sites

1. `rollTrainerTeam` rival branch — wraps the `_applyEnemyGimmickDistribution` return with `_applyStoryBuildPowerTier`.
2. `rollTrainerTeam` standard branch — same wrap.
3. `rollMysteryFigureFinalBossTeam` — same wrap (always T4 because badges=8 in the try block).
4. `enterProfessor` choice loop — after `makeBuild(name)`, downgrade to `_storyBuildTierForProfessor(cityIdx, sm.badges)`. Legendary mystery-gate offer skipped (always T4).
5. `makeWildBuild` — stamps `build.powerTier = UNTRAINED` for inspector parity.
6. `_pickStarterPartner` — switched from `makeBuild` to `makeWildBuild` so the catch-tutorial Pidgey/Rattata sits in the same tier band as every other wild.

### Curve (the one-pager)

- Pre-Gym-1 Basic / Intro Rival / GT1: **T1**
- Gym Leader 1–2, mid Basic Trainer: **T2**
- Gym Leader 3–5, post-Gym-3 Rival, GT2 / Elite Trainer at 3+ badges: **T3**
- Gym Leader 6–8, all Elite Trainers at 6+ badges, E1–E4, Champion, Victory Road, post-HoF Mystery Figure, league Rival, Battle Frontier, all post-HoF rematches: **T4**

### Verification

- `node --check` on extracted inline JS (`/tmp/battle-inline.js` ≈ 27,600 lines): clean.
- `scripts/dev-server.cjs` serves `battle.html`: HTTP 200.
- Manual tier-curve walkthrough (`/tmp/test-tier.js`): every transition produces the expected T1→T4 ramp.
- Manual downgrade output (`/tmp/test-downgrade.js`): T4 Choice Band Garchomp at T1 → Hardy/Sand Veil/Sitrus Berry/0 EVs; at T2 → ~108 EV partial spread / Black Belt; at T3 → 80% EV spread retained.

## What's still open (phase B candidates, not done)

- **Move-quality scaling** — currently moves stay Smogon-quality at every
  tier. A T1 mon's pile of 4 top-BP moves is the only piece that still
  feels min-maxed. Replacing the strongest 1–2 with level-up filler
  needs per-species learnset data; held back to avoid breaking learnability.
- **Settings toggle** to disable the tier curve entirely. Current
  default is always-on. Add to story-setup advanced section if players
  prefer the old behavior.
- **Inspector tier badge** on foe summary / Professor pick cards.
  `build.powerTier` is set internally but not surfaced — visible signal
  is via the displayed nature / ability / item / EVs.
- **Per-trainer-class personality** — e.g. Hiker always fields Rock
  types, Bug Catcher always at T1 even mid-game, Veteran always T3+.
  Could layer on top of the tier-by-event mapping.
- **Move learnability audit** — prior session note says the Smogon
  CSVs are assumed curated but unvalidated; if a CSV row has an illegal
  move on a species, this session didn't catch it. Still open.

## Resume protocol next session

1. Read `agent-state/CODEBASE_MAP.md` first.
2. Re-run `git log --oneline -10`, `node scripts/dev-server.cjs` smoke.
3. If picking up Phase B move scaling: the legal-move pool is computed
   via `_tutorGetMergedMovePoolAsync` (~line 30390), reusable for
   per-tier move filtering. T1 should pick from level-up only, T2 from
   level-up + TMs, T3+ from the full Smogon pool.
4. If picking up the settings toggle: `sm.settings.buildPowerScaling`
   default true, gate `_applyStoryBuildPowerTier` and the Professor /
   wild hook on it.

## Files touched this session

- `battle.html` — new tier system + 6 hook sites
- `CHANGELOG.md` — Unreleased entry for the tier curve
- `agent-state/HANDOFF.md` — this file
- `agent-state/CODEBASE_MAP.md` — updated anchor lines below
