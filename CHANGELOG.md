# Changelog

All notable user-visible changes land here. Sessions append entries under
`## Unreleased` and a date/branch heading.

## Unreleased — Polish session 2026-05-15 (`claude/polish-story-mode-battle-lT4sx`)

### Added — Voice & flavor
- **Per-leader / elite / champion victory voice.** `LEADER_VICTORY_LINES`,
  `LEADER_BADGE_NAMES`, `ELITE_VICTORY_LINES`, and `CHAMPION_VICTORY_LINES`
  tables drive the post-battle overlay. 70 gym leaders, 31 Elite Four, and
  11 Champions each get a bespoke one-liner that names the badge earned
  (e.g., "Brock: 'Your defense rivals stone. Take the Boulder Badge.'");
  unknown trainers fall back to the generic role line.
- **Per-facility NPC voice.** Move Tutor, Nature Rater, Battle Dojo,
  EV Trainer (Buck), Colress, Cable Link Station, and Poké Casino all open
  with a rotating in-character one-liner instead of bare titles. Lines
  lean into the darker-adult-pokemon tone — anonymous link strangers,
  croupier warnings about runs going bust, the dojo master remembering
  every fall.
- **Rotating Mystery Figure identity.** The masked stranger used to wear
  Cyrus's face every run. Now a single identity rolls at run start from
  seven candidates — Cyrus, Ghetsis, Cynthia, Steven, N, Red, Lance —
  and pins for the save. Each has a bespoke 4-line intro pool and the
  victory overlay drops the mask: "It was <Name> all along."
- **Red voice padding.** Red's ellipsis lines now mix in stage-direction
  parentheticals ("…(Pikachu sparks. Once.)") so the cameo reads as
  deliberate silence, not missing content.

### Added — Replayability & guidance
- **Cross-run career counter.** New `pbs_story_meta` localStorage key
  tracks `completedRuns`, `lastClearSeed`, and per-milestone
  `firstClears` across runs. Story menu shows "🏆 Career runs cleared:
  N · Last seed XXX"; Hall of Fame shows run number, difficulty, seed.
- **Career first-clear celebration.** The very first time a player ever
  clears any gym / elite / champion / rival / mystery across all their
  runs gets a "★ Career first ★" banner and 96-particle confetti pulse
  (normal milestone = 32 particles). Veterans see the normal beat;
  new players get the rush.
- **City "Next:" preview tip.** Every city Tips strip now opens with a
  "🎯 Next: <event>" chip — "Gym 3 — Lt. Surge", "Elite 2 — Karen",
  "Champion — Cynthia", "Mystery Figure (???)" — that clicks straight
  into the next battle.

### Added — Trainer-UI misclick guard
- **Confirmation prompts on every Pokémon-modifying click.** Move Tutor,
  Nature Rater, Battle Dojo (ability + item), EV Trainer preset,
  Colress (Mega/Dyna/Z/ZSig/Tera), Link Reroll/Upgrade/Rebuild, Artifact
  Annex, and Department-Store + ≥1500G shop purchases now open a confirm
  modal with the specific change, the cost, and the player's remaining
  gold after the transaction ("Apply Adamant nature (2,000G → 18,500G
  left)"). Stone Sage / PC Release / PC Sell already confirmed;
  no-op clicks (same value re-applied) short-circuit before the prompt.
- **Tutor button touch targets.** `.story-tutor-btn` bumped to 40px tall
  on phone portrait (was ~22px). Direct response to misclick reports.

### Added — Polish
- **Starter badge on team panel.** Team cards now render a "★ STARTER"
  pill on the starter and an "⛓ BOUND" pill on any other unsellable
  mon (Subject Zero, etc.) so players see at a glance why the
  Underground sell button is disabled on those rows.

### Changed
- **Typography polish.** User-facing "Pokemon" → "Pokémon" in Quick Play
  help, Tera card description, Sleeping Song log, League-city label,
  rival opening quote. Internal action keys and trainer-class sprite IDs
  (Pokemart, Pokemon Breeder, etc.) keep their ASCII form.
- **PAR status tense.** "is paralyzed!" → "was paralyzed!" so the
  status-application message table reads in the same past-tense voice
  as its peers (was poisoned / burned / etc.). Mid-turn "is paralyzed!
  It can't move!" stays present-tense (different context).

### Balance
- **G4 strip at 2 mons, not 4.** `storyStripGrade4IfPartyMature` now
  triggers off a new monotonic `partyEverReached2` flag. With the old
  threshold, early routes still rolled G4 trainers while Gym 1/2 was
  already pure G3 — the gym fight was easier than the road to it.
- **Rival decay /30 → /10.** `RIVAL_ATTACK_TYPE_DECAY` reduced so a
  dominant counter-type can land on two of the rival's six instead of
  collapsing after a single pick. Rivals now actually punish monotype
  parties.
- **Starter pool floor.** PROF_ROLLS for City0/City1 raised to 70% G3
  (was 30%/50%) so the Gym 1 (100% G3) wall isn't a brick wall.

### Fixed
- **Evolution carry-over uses correct build keys.** Stone Sage promised
  "Nature, ability slot, item, and EVs are kept," but the code read
  `old.nature` (never existed on a build — keys are single letters)
  and never read `old.a` at all. Nature was silently wiped; ability
  was always rerolled. Now reads `old.n` and `old.a` correctly.
- **Starter unsellable per spec.** Design spec §8 requires the starter
  to be bonded for life. Only the boss-arc capture was flagged. The
  first Pokémon any Professor gives now sets `starter: true` +
  `unsellable: true`; sell screen reads "Starter — bonded for life".
- **Pokédex.seen now populated.** `sm.pokedex.seen` was initialized
  but never written — only catches went into `pokedex.caught`. Every
  wild / Safari / boss encounter now stamps `seen` on entry.
- **Caged God ball-exhaustion escape.** The boss-arc catch screen hid
  the Run button to prevent flee, but a player who ran out of all four
  ball types had no exit (softlock to refresh). The screen now shows
  "↩ Retreat — bring more balls" only when total ball count is zero;
  the boss state (HP, lock) persists for the return trip.
- **`crucibleBattleSource` reset on load.** Closing the tab during a
  Crucible/Frontier fight persisted the transient flag without the foe
  team. Next main-timeline battle would then wrongly route through
  `_handleCrucibleBattleEnd`. `load()` now always clears it.
- **Corrupted enemy-lock recovery.** `load()` drops a malformed
  `sm.currentEnemyLock` (missing eventIdx, empty/non-array team, slot
  without name/build) so the engine rerolls a fresh team instead of
  crashing inside launchBattle.

### Audited (no code change required)
- **Generation toggle leakage.** Species-only filter confirmed; no
  leakage into learnsets, abilities, items, type chart, damage formula.
- **Eviolite Late-Evo rule.** Gated by `sp.evos.length > 0` from the
  dex — gen-independent. Compliant.
- **Hardcore difficulty removal.** Only the migration line remains.
- **Settings toggles** (animations / weather / terrain / music / SFX /
  Mega / Z-Move / Dynamax / Tera). All honor both on and off paths.
- **Damage formula, type chart, AI tier.** Gen 6+ universal rules; AI
  is heuristic with damage estimation + threat scoring + switch logic.
- **Safari Zone, catch flow, boss arc, Crucible, Frontier, PC,
  Underground.** Core mechanics verified: free-first-entry flag, 6-
  encounter pacing, grade-pool richness, caught-state hygiene, party/
  PC overflow, gen filter, ball economy, Frontier stat scaling
  (correctly applied via `applyStoryLeagueFoeStatBoost`), boss lead
  flavor consistency.
