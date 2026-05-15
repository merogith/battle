# Changelog

All notable user-visible changes land here. Sessions append entries under
`## Unreleased` and a date/branch heading.

## Unreleased — Catch & party balance 2026-05-15 (`claude/balance-pokemon-safari-zone-AMDkM`)

### Changed — Catch math is meaningfully tighter
- **Base catch rates lowered.** G1 5%→4%, G2 20%→12%, G3 40%→22%, G4 60%→35%.
  A maxed Ultra Ball on a G3 used to land 80% of the time and made wild
  captures feel like free gifts; it now lands ~44%, so the throw is a real
  decision. Master Ball is unchanged (still 100%) — it stays the special
  arc reward.
- **Per-grade flee rates.** Rarer mons are skittier. G1 55%, G2 40%,
  G3 28%, G4 20% (was a flat 25% across the board). A missed Ultra Ball
  on a G1 usually means it's gone — you bring your best ball on the first
  throw, not the fifth.

### Added — Safari Zone is actually different from a wild route
- **Safari Balls** are a session-only resource. Each Safari run grants
  25 Safari Balls; leftovers are forfeited at the gate (they never enter
  `sm.balls`, so they can't be hoarded for wild routes). Catch multiplier
  is 1.5× — between Great and Ultra. Your own Poké/Great/Ultra/Master
  Balls do NOT work inside the Safari Zone.
- **Bait** calms the wild Pokémon. Each bait stacks: catch chance × 0.70,
  flee chance × 0.55. Lower payoff, longer leash.
- **Throw Rock** angers the wild Pokémon. Each rock stacks: catch chance
  × 1.45, flee chance × 1.70. High risk, high reward — most G1 captures
  in Safari now happen after 2–3 rocks land you a quick clean throw before
  it bolts.
- Modifiers stack up to 3 each and reset between encounters.
- Safari encounter cap raised to 8 (from 6). Safari pool nudged slightly
  richer at G1 (8% from 5%) since catches there are now genuinely hard.
- Safari entry cost raised to 1,200G (from 800G) to reflect the 25-ball
  allotment + Bait/Rock toolkit. First visit per save still free.
- Per-encounter Skip + per-session Leave (forfeit balls) both surface
  directly on the encounter card so the player never gets cornered.

### Changed — Enemy party size, no more "weird"
- **Predictable role + badge curve.** Pre-v16 enemy party size mirrored
  the player's current team length (+1 after 4 badges), which meant the
  game changed difficulty silently when you released a mon or held two
  back at the PC. The new curve is fixed and readable:
  - Intro Rival: 1
  - Gym 1: 2 · Gym 2: 3 · Gym 3–4: 4 · Gym 5–6: 5 · Gym 7–8: 6
  - E1–E4 / Champion / Victory Road: 6
  - Rival (post-intro): 2 → 3 → 4 → 5 → 6 by badges (1/3/5/7)
  - Basic / Gym Trainer / Elite Trainer: 1 → 2 → 3 → 4 by badges
  - Soft floor: non-boss trainers cap at `playerTeam + 1` so a player
    still rebuilding their roster never walks into a 1v4 stomp.

### Added — Dynamic party swap on catch
- When you catch a Pokémon and your party is already full (6/6) but the
  PC has space, you now get a choice screen — **Send to PC** (the old
  default) or **pick a teammate to swap to PC**, putting the newcomer in
  that party slot. No more silent "it went to the PC" right when you
  wanted it on the field. Boss-arc catches (Subject Zero) still go
  straight to party — that story beat needs the mon in your hand.

### Notes
- PC code path audited end-to-end: deposit / withdraw / release / sell
  all guard against the last-mon, full-box, and missing-id edge cases.
  No changes were needed there.

## Unreleased — Progression pass 2026-05-15 (`claude/optimize-game-progression-91Yy0`)

### Added — Catch rewards
- **Partially-trained wild builds.** `makeWildBuild` no longer returns a
  Hardy/0-EV husk. Caught wilds now arrive with a curated positive nature
  (Adamant/Modest/Jolly/Timid/Bold/Calm picked from the species' base-stat
  profile) and a ~170 EV head-start (85 on the best offensive stat + 85
  speed, or 85 HP + 85 best-defensive for bulky shells). Held item stays
  None so Battle Dojo is still a real upgrade. Catches feel like a reward
  now — Tutor / EV Trainer / Stone Sage still matter for the last 30%.
- **Roaming sub-legendaries.** After Gym 5 and Gym 7 victories the next
  route surfaces a one-shot wild legendary (Articuno, Suicune, Latios,
  Tapu Koko, Chien-Pao, etc., gen-filtered, 50-species pool). 30% catch
  rate (no override — Master Ball still ∞ = 100%). Missed throw or Run
  = the Pokémon flees permanently. Roaming mons use the full `makeBuild`
  (not the wild build) — they're rare, they should feel ready.

### Added — Themed gym & elite gifts
- **`GYM_VICTORY_REWARDS` table.** Every gym leader / E1–E4 / Champion
  defeat hands a themed bundle on first clear: Gym 1 = 3 Poké Balls + 500G,
  Gym 2 = Rare Candy + 1000G, Gym 3 = 2 Great Balls + Vitamin, Gym 4 =
  Ultra Ball + Rare Candy, Gym 5 = 2 Great Balls + Vitamin + 1000G, Gym 6
  = 2 Ultra Balls + Rare Candy + 1500G, Gym 7 = Ultra Ball + Rare Candy
  + Vitamin, Gym 8 = 3 Ultra Balls + 2 Vitamin Packs. E1 = 2 Great Balls
  + Vitamin; E2 = Ultra Ball + Rare Candy; E3 = Ultra Ball + Vitamin;
  E4 = 2 Ultra Balls + Rare Candy; Champion = 2 Ultra Balls + Rare Candy
  + 2 Vitamin Packs. Old `staticDrops.ultraGl4` / `ultraE2` flags treated
  as "reward already taken" so legacy saves don't double-dip.

### Added — Pokédex milestone rewards
- **`POKEDEX_CAUGHT_MILESTONES`.** Catching 25 / 50 / 75 / 100 unique
  species fires bundle rewards: 25 = Ultra Ball + 2000G; 50 = 2 Ultra
  Balls + Vitamin; 75 = 2 Rare Candies + 5000G; 100 = 3 Ultra Balls +
  Rare Candy + Vitamin. (No 2nd Master Ball — that stays uniquely tied
  to the Caged God arc.) Checks fire inside `_catchHandleSuccess` so
  Safari, route wilds, Crucible wilds, and the boss arc all count.

### Added — Permanent-stat vouchers
- **🍬 Rare Candy = free Stone Sage evolution.** When the player has
  rareCandy in `sm.inventory`, the Stone Sage screen renders a "🍬 Rare
  Candy" button next to each gold-cost evolve button. One charge =
  bypass the gold cost (saves up to 16,000G on G2→G1). Nature, ability
  slot, EVs, item, Tera all still carry over. Repeat-use cost ramp still
  consumes a slot so paid follow-ups scale fairly.
- **💊 Vitamin Pack = free EV Trainer preset.** Same pattern on EV
  Trainer — a "💊 Vitamin" button on every preset, one charge =
  bypass 5,000G.
- Bag screen surfaces both as "Voucher" entries at the top of the bag
  (not sellable for gold; earned, not bought).
- City Tips strip surfaces unused vouchers as quick-launch chips
  ("🍬 N Rare Candies — free evolve" / "💊 N Vitamins — free EV preset").

### Changed — Enemy challenge curve
- **Aggressive late curve.** From 4 badges onward, every non-boss
  trainer fields one more Pokémon than the player's party
  (`min(player+1, 6)`). Intro Rival stays 1; Gym 6+/E1–E4/Champion/
  Victory Road stay forced 6. Pre-Gym-4 still matches party size.

### Fixed
- **Smart-quote syntax crash in trainer quote table.** Lines 22951–23006
  had U+2018/U+2019 smart quotes as string delimiters from a previous
  merge (`'Red': [...]`, `'Maxie': [...]`, every Veteran Gym Leader,
  every Team admin, etc.). The browser fails to parse them silently;
  the page would crash on first reference to those quotes. Normalized
  to ASCII apostrophes. Plumeria's "Salazzle—poison 'em!" line got an
  explicit `\'em!` escape since plain `'em` would close the string.

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

### Added — Round 3 (audit-and-fix loop)
- **One-time tips system** (`_storyShowOneTimeTip` + `pbs_story_meta.tipsShown`).
  Cross-run, so a tip seen in run 1 never re-fires. Wired to:
  Pokémon Center first-visit, Relic Annex first-visit, Battle Frontier
  first-visit, Crucible first-visit, first wild catch encounter,
  Pallet Town welcome, and post-HoF orientation listing the three
  endgame doors.
- **Mystery Figure per-identity outro epilogues** (7 trainers). Each
  rotates with the identity reveal in the post-defeat overlay —
  Cynthia hands you tea, N kneels by your lead Pokémon, Red tips his
  cap and is gone.
- **Caged God cage-unlock celebration.** Final lead now fires an
  alert pointing at the new "Enter the Cage — `<Boss>`" button.
- **Subject Zero capture epilogue.** Expanded from one line to a
  three-beat closer: cage shutting, sixty-years lore, unsellable bond.
- **Master Ball / Ultra Ball gift flavor rewrite** + explicit inventory
  chips. Elite-2 broker theft framing replaced with a League attendant
  "the way a treasure is given."
- **Wild Pokémon sprite on catch screen** (and boss HP-attrition phase).
  Screen was text-only before.
- **Catch wobble + flee + boss strike variety.** Each now picks from
  4-line pools so a string of misses doesn't read identical. Boss
  strikes also narrate per HP band — clean hits early, dread at <10%.
- **Relic Keeper voice** (5-line rotating barker on every Annex visit).
- **Crucible orientation tip** spelling out battle vs facility columns.
- **Caged God lead status sidebar** got its own labelled box with a
  3-of-3 counter and explicit Pokémon Center city locations.
- **Stone Sage level-up flavor.** Function used to return empty string
  for the most common evolution type (level-up). Added four rotating
  flavor lines so the screen always speaks.
- **Casino result variety** — 4 win and 4 loss flavor lines instead
  of a single repeating string.
- **Pallet Town welcome tip** — one-time, cross-run.

### Added — Trainer pool variety
- **9 new 2-type / type-coverage Basic Trainers** all charGen 1 with
  `pkmGens` 1–9: Ace Diver, Mountain Guide, Glacial Trekker, Reactor
  Tech, Tea Aroma, Mystic, Crooked Beat, Marsh Walker, Lab Rat.
  Together they add Ground, Ice, Steel, Fairy, Psychic, Dark coverage
  the original G1 set was missing. All reuse existing sprites.
- **8 thematic Elite Trainer variants** (`tag:'eldritch'`): Shadow Blue,
  Cursed Lance, Forsaken Cynthia, Eldritch N, Tarnished Steven, Pale
  Ghetsis, Hollow Cyrus, Silent Red. Reuse canonical champion sprites
  with darker pools; the `eldritch` tag lifts the gen-filter so a
  G1-only run can still meet a Hydreigon under an old champion's mask.
- **3 cursed Basic Trainer variants**: Cursed Vagrant, Scarred
  Brawler, Charred Acolyte.
- **`STORY_THEMED_BATTLES` map** marks four mid-run event ids
  (34, 42, 48, 58) as themed slots; pass 3 of `assignTrainers`
  consults it and prefers a tag-matched trainer when available.
- **Type-coverage filter fallback** — when a gym's preferredType
  yields zero trainers under the active gen filter, fall through to
  the full role pool. Before: a G1-only run hitting a Pryce gym
  silently fielded non-Ice trainers. After: Glacial Trekker covers Ice
  for any gen.
- **TRAINER_QUOTES_BY_NAME entries** for all 11 new thematic trainers
  so they don't fall back to the generic role pool.

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
- **No-Item Run mode** — battle bag disabled both sides, shops stay
  open, balls usable for catches. Compliant with spec.
- **PC last-mon protection** — `_pcTeamHasOnlyOneMon` blocks deposit
  when team would empty; UI disables button with reason.
- **Stone Sage carry-over** — fixed earlier this session to use the
  correct build keys (`n`, `a`) so nature and ability survive
  evolution.
