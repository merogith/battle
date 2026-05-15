# Changelog

All notable user-visible changes land here. Sessions append entries under
`## Unreleased` and a date/branch heading.

## Unreleased — Polish session 2026-05-15 (`claude/polish-story-mode-battle-lT4sx`)

### Added
- **Per-leader victory voice.** New `LEADER_VICTORY_LINES`, `LEADER_BADGE_NAMES`,
  `ELITE_VICTORY_LINES`, and `CHAMPION_VICTORY_LINES` tables drive the
  post-battle overlay. 70 gym leaders, 31 Elite Four members, and 11 Champions
  each get a bespoke one-liner that names the badge / token earned
  (e.g., "Brock: 'Your defense rivals stone. Take the Boulder Badge.'");
  unknown trainers fall back to the generic role line.
- **Cross-run career counter.** New `pbs_story_meta` localStorage key tracks
  `completedRuns` and `lastClearSeed` across Hall-of-Fame reaches. The Story
  Mode menu now displays "🏆 Career runs cleared: N · Last seed XXX" above
  the run-setup buttons, and the Hall of Fame panel shows the run number,
  difficulty, and seed of the current clear.
- **Red voice lines.** Red still mostly answers in ellipses but the pool now
  also rolls a handful of stage-direction parentheticals so screen readers
  have something to read and the cameo doesn't read as missing content.

### Changed
- **Typography polish.** User-facing "Pokemon" → "Pokémon" across the Quick
  Play / Draft / Battle help text, the Tera card description, the Sleeping
  Song log line, the Hall-of-Fame label for the League city, and the Rival's
  opening-route quote. Internal action keys (`'Pokemart'`, `'Enter Pokemon
  League'`) and trainer-class identifiers (`Pokemon Breeder` etc.) keep their
  ASCII form because gameplay code matches them by identity.

### Fixed
- **Corrupted enemy-lock recovery.** `load()` now drops a malformed
  `sm.currentEnemyLock` (missing `eventIdx`, empty/non-array `team`, or any
  slot missing `name`/`build`) and rerolls a fresh foe team instead of
  crashing inside `launchBattle`.

### Audited (no code change required)
- **Generation toggle leakage.** Confirmed `enabledGens` flows only through
  species-pool filtering: learnsets, abilities, items, type chart, and damage
  formula are universal. `pkmGens` on trainer rows is a hard species filter
  only.
- **Eviolite Late-Evo rule.** Eviolite eligibility is gated by `sp.evos.length > 0`
  from the dex, which honors evolutions from any generation regardless of the
  current gen toggle. Compliant.
- **Hardcore difficulty removal.** Fully cleaned up — only the migration line
  (`'hardcore' → 'normal'`) remains for legacy saves.
- **Settings toggles.** Battle animations, weather animation, terrain
  background, music, SFX, Mega, Z-Move, Dynamax, and Tera all honor both
  positive and negative paths cleanly.
- **Damage formula, type chart, AI tier.** Matches Gen 6+ universal rules;
  AI is heuristic with damage estimation + threat scoring + switch logic; no
  uncaught engine bugs surfaced during this pass.
