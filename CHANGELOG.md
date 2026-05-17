# Changelog

All notable user-visible changes land here. Sessions append entries under
`## Unreleased` and a date/branch heading.

## Unreleased — Safari Zone authentic gameplay loop 2026-05-16 (`claude/safari-zone-gameplay-vxFOb`)

### Added — Per-turn flee on Bait/Rock (canonical Safari Zone tension)

- The wild Pokémon may now flee at the end of **any** turn — Bait or Rock
  turns included, not just after a missed throw. This is the core
  dilemma the real Safari Zone is built around: every rock improves your
  eventual catch chance, but the wild may bolt on the same turn you
  threw it. Without this, Bait/Rock were "free" actions that just
  stacked modifiers; with it, the bait/rock loop is a real bet.
- **Bait stays gentle.** Bait turn flee multiplier is `0.20×` the
  post-miss formula — typically 1–6% per turn. The Pokémon is occupied
  eating, so wandering off is unlikely but not impossible.
- **Rock is the real gamble.** Rock turn flee multiplier is `0.55×` —
  ~20–40% per turn, scaling fast with each rock stack. Capped at 45%
  (`SAFARI_TURN_FLEE_CAP`) so no single action ever auto-flees.
- The Bait and Rock buttons now surface their **per-turn flee chance**
  inline (e.g. `🪨 Rock — flee 28%`), so the gamble is legible at the
  point of decision — same affordance as the catch-% badge on the ball.
- Buttons disable at 3 stacks to make the cap obvious.

### Changed — Safari catch math slightly more forgiving overall

The new per-turn flee adds real session risk, so the catch side gets a
modest boost so a 6-encounter run still feels rewarding instead of
brutal:

- **Safari Ball multiplier `1.25× → 1.35×`.** The baseline (no
  bait/rock) Safari throw is now between Poké and Great rather than
  just above Poké. A G3 with a fresh Safari Ball is ~30% instead of
  ~28%.
- **Rock catch multiplier `1.45× → 1.65×`.** Stacking rocks is now
  genuinely powerful: a G3 after 2 rocks goes from ~58% to ~81% (and
  hits the catch-mult ×4 cap at ~88% with a third rock — G4 caps at
  100%). The trade-off is steep — 3 rocks means three per-turn flee
  rolls — but if you get there, the throw is essentially decided.
- Bait catch multiplier (`0.70×`) and flee multipliers
  (`0.55×` bait / `1.70×` rock) are unchanged — the strategic axes
  stay the same; only the levers got sharper.

### Added — Safari Zone flavor polish

- Dedicated **🦒 Safari Zone** header on the catch screen when inside a
  Safari run (was the generic "🌿 Wild Encounter"). Boss and tutorial
  flows get their own headers too. Restored on exit.
- **PA-style end-of-session announcements** replace the dry "session is
  over": `📣 "Ding-dong! Your Safari Zone game is over!"`, `📣 "Ding-dong!
  You're out of Safari Balls — game over!"`, and a warm
  `📣 "Thanks for visiting the Safari Zone! Come again soon."` on early
  exit. Same vibe as the canon games' warden voice.
- **Grade-keyed opening flavor** for each Safari encounter. G1 reads as
  "rare, alert, ready to bolt"; G4 reads as "ambling, friendly, curious".
  Replaces the same "Safari Pokémon appeared!" copy for every wild —
  the player now has an observation cue before picking Bait vs. Rock.
- Welcome modal expanded to spell out the per-turn flee rule so
  first-time visitors know "every turn the wild may flee" before they
  start clicking Rock.
- Tutorial tip rewritten to call out the per-turn flee and the
  bait-vs-rock gamble explicitly.

### Reason

The previous Safari Zone replicated most of the canon loop (session
balls, bait/rock asymmetry, encounter cap, exclusive Safari Ball) but
missed the single mechanic that makes the real Safari Zone *feel* like
a casino: the wild can flee on any turn, not just after a missed throw.
Without per-turn flee, the optimal play was always "stack 3 rocks
risk-free, throw once" — Bait/Rock were modifier sliders, not
decisions. Adding per-turn flee restores the real dilemma, and the
modest catch-rate boost (Safari Ball 1.35×, Rock catch 1.65×) keeps a
6-encounter session from collapsing into "everything fled, I caught
nothing".

## Unreleased — Story-mode investigation pass: cleanup, climax, casino 2026-05-16 (`claude/story-mode-investigation-lILFs`)

### Changed — Active party cap = `2 + badges`, foes match player team size 1:1

- `_storyMaxPartySize()` is the **badge curve** (`max(2, min(6, 2 + badges))`):
  starter slot is always available, the catch tutorial fills slot 2 right
  after the intro rival, and each gym badge unlocks one more slot up to 6
  at four badges. Catches and Professor gifts above the cap still succeed
  — they land in the PC, so a player can always *catch*, they just can't
  *field* more than the active cap until the next badge.
- `_storyEnemyPartySize()` is now **player-matching with per-role floors**.
  Foe size = player team length, but no smaller than:
    Basic / Gym Trainer / Elite Trainer = 1,
    Rival = 2,
    GL1–2 = 2, GL3–4 = 3, GL5–6 = 4, GL7 = 5, GL8 = 6.
  Story finales (Champion / E1–E4 / Victory Road / post-HoF Mystery Figure)
  still field a full 6 regardless. Intro rival stays a pure player-match
  (1v1 starter duel).
- Result: a player who runs lean fights lean trainers run-to-run; a
  player who builds full faces 6v6 trainer fights from Gym 5 onward.
  The cap and the foe-size formula stay locked on the same progression
  clock so every battle is a readable, fair fight regardless of how
  many wilds the player caught.
- Restored the city hub party label's "(next slot at N badges)" hint and
  the PC storage tab's "(next slot at badge N+1)" cap-hint that the
  earlier flat-6 pass had stripped.

### Changed — Post-HoF first reentry routes through Mystery Figure (row 67)

- Row 67 in `STORY_EVENTS_RAW` is no longer skipped on the way to the
  post-game hub. `continuePostGame()` snaps `sm.eventIndex` to row 67 and
  sets `sm.crucibleBattleSource = 'postHofMystery'` so the post-battle
  interceptor (`_handleCrucibleBattleEnd`) flips a new save flag
  `sm.postHofMysteryClimaxDone` and routes the player back into the
  existing Master-Ball / boss-arc / lastCity flow. Result: the Mystery
  Figure climax fires exactly once per save as a one-time mask-drop beat,
  then the Crucible / Caged God doors stay open at every later city visit.
- `processNextEvent` re-establishes the dispatch source if the player
  reloads while still standing on row 67 with the climax flag unset
  (e.g. tab closed mid-fight), so the climax can't loop into a save-
  killing dead-end.
- Migration: existing saves that already have `sm.bossArc.available`
  set are marked climax-done in v16 so they skip the new beat entirely.

### Changed — Poké Casino has three wager tables instead of one

- Same one-line core RNG (a single d10) but three modes layered on top:
  - **Coin Flip** — Heads/Tails, pays 1:1, 50% (parity of the roll).
  - **Color** — Red/Black, pays 1:2, 30% (roll 1–3 = Red, 8–10 = Black,
    4–7 = neither). Small house edge.
  - **Jackpot** — pick a number 1–10, pays 1:9, 10%. High-variance kicker.
- The bet chip row, the gold HUD, and the result line are unchanged;
  the screen body adds three labelled clusters so the player can read
  the odds at a glance before choosing.

### Fixed — Boss-arc legendary roll honors the run seed

- `_bossArcRollLegendary()` now picks the species through `storyRngNext`
  (when `sm.active`) instead of bare `Math.random()`. The chosen legendary
  is locked into the save once unlocked, so the same `runSeed` and
  generation toggle now reproduce the same Caged God across machines.

### Fixed — Pokémon Center entry uses the same interaction guard as siblings

- `enterPokemonCenter` now wraps in `_storyTryBeginInteraction()` /
  `_storyEndInteraction()` like every other facility entry. Closes a
  tap-spam race where the screen could re-enter mid-`save()`.

### Removed — Dead `partyEverReached2` / `partyEverReached4` flags

- Both flags were written in six places and never read anywhere; the
  CHANGELOG had described them as the G4-strip gate, but the actual
  gate in `storyStripGrade4IfPartyMature` is `sm.badges < 1`. Removed
  the writes and the schema-default entries; behavior is unchanged.

### Doc — Spec drift caught up

- `STORY_MODE_FLOW.md` catch-rate table updated to the live constants
  (G1 4% / G2 12% / G3 22% / G4 35%, per-grade flee 55/40/28/20) and
  notes Safari Ball at the live 1.25× multiplier.
- §9 (boss arc) rewritten to describe the new row-67-once flow.
- New §14e clarifies that internal action keys (`Pokemart`, `Pokemon
  League`, `Pokemon Breeder` sprite IDs) keep their ASCII form; only
  user-facing copy is renderered with the diacritic.
- `agent-state/CODEBASE_MAP.md` Safari row updated to the live
  2,500G entry / 15-ball / 1.25× / g1:3/g2:22/g3:50/g4:25 numbers.

### Misc

- Stale comment over `SAFARI_BALL_MULT` (called it "1.5×, between Great
  and Ultra") corrected to match the live value. (Note: the Safari Zone
  gameplay-loop branch superseding this PR bumps the same constant to
  1.35× and rewrites the comment again — see the entry at the top of
  this file.)

## Unreleased — Vitamin / EV-training balance pass 2026-05-16 (`claude/balance-vitamins-stats-PAaPn`)

### Added — Vitamin distribution fills the gym dead zones

- Gym Leaders 1, 2, 4, and 6 now each drop **+1 Vitamin Pack** as part
  of their reward bundle. Previously vitamins only began at Gym 3 and
  the curve had four gym victories with zero EV-investment access.
- **Mid-game route find** — first Basic/Elite Trainer cleared while
  holding exactly 4 badges drops 1 Vitamin Pack with a "found in the
  tall grass" flavor message. Gated by `sm.staticDrops.vitaminRouteMidgame`
  so it can only fire once per save.
- Per-run vitamin total rises from 9 guaranteed (gym/league only) to 14;
  up to 16 with a full Pokédex.

### Changed — UI surfaces the EV-training permanence rule

EVs were already permanent and traveled with the Pokémon through PC
deposit/withdraw, evolution, and tutor work — but nothing in the UI
told the player that. Players could release a fully trained Pokémon
without realizing the investment went with it.

- **Vitamin Pack tooltip** in the bag now explicitly states the
  investment stays with the mon forever, only lost on release or sale.
  Rewritten in plain language with a concrete example
  (+252 Atk / +252 Speed) and the 5,000G equivalence.
- **Buck quote pool** at the EV Trainer gains a permanence line.
- **PC Release confirm** appends "Its EV training will be lost too."
  when the slot has any non-zero EVs.
- **PC Underground Sell confirm** appends the same EV note when
  applicable, and the tab intro banner mentions the same.

### Added — EV Trainer onboarding & vitamin discoverability

The EV Trainer screen previously surfaced only a random Buck quote and
the per-mon preset cards — new players had no persistent answer to
"what is an EV?" and players carrying unused Vitamin Packs through
no-EV-Trainer cities (City 2, 3, 5) had no reminder beyond the bag tab.

- **Persistent info banner** at the top of the EV Trainer screen.
  Plain-language explainer (what EVs are, 252/510 cap, permanence rule)
  plus a live state line — pink "💊 N Vitamin Packs ready" call-out
  when the player has any, gold-cost reminder when they don't.
- **Clearer Vitamin button label** on each preset: "💊 Use Vitamin
  (N left)" replaces the more ambiguous "💊 Vitamin (N)" so mobile /
  touch users who can't see the hover tooltip still understand it's
  a consume action.
- **City tip in no-EV-Trainer cities** — quiet "💊 N Vitamin Packs
  saved — use at next EV Trainer" reminder. Clicks open the bag so the
  full tooltip is one tap away. Existing tip in EV-Trainer cities
  unchanged.

### Reason

The previous vitamin curve front-loaded the "leveling up" feel into the
middle and end of a run — early-game Pokémon could not be EV-trained
without a 5,000G/preset gold sink, so most starters fought their first
three gyms untrained. Filling Gyms 1/2/4/6 with one Vitamin Pack each
plus a single mid-game route find restores a steady "every gym = a real
power bump" cadence without changing caps, foe scaling, or the swap
mechanic. 252/510 caps remain the guardrail against runaway investment.

### Not changed (deliberate)

- Per-stat cap: 252. Total cap: 510. Untouched.
- EVs persist across party/PC swaps. The "swap loses investment" rule
  asked about during planning was **never implemented in code** — only
  release/sell loses the investment, and the UI now makes that explicit
  rather than introducing a new commitment penalty mid-game.
- Foe stat scaling (`applyStoryLeagueFoeStatBoost`, difficulty mult)
  unchanged. The +14 vitamin curve was tuned to fit inside the existing
  Champion +30% HP / +15% bulk league boost.

## Unreleased — Random wild encounters keyed on grade + gen toggles 2026-05-16 (`claude/random-wild-encounters-wNB0M`)

### Changed — Wild grade pool is now a standalone progression curve

- Route wilds previously inherited the next trainer's `gradeWeights`
  shifted one tier weaker, which meant the wild you fought right
  before a gym felt suspiciously like a preview of the gym leader's
  tier mix (and the curve had odd shoulders at rows where the
  trainer's grade jumped). Wild rolls now read a dedicated
  badge-keyed table (`_WILD_GRADE_CURVE_BY_BADGES`) that doesn't
  touch the trainer fight at all — the two inputs to a wild roll
  are **the player's badge count** and **the enabled-gen toggles**,
  full stop. Wilds reflect the route's biology, not the upcoming
  trainer's lineup.
- The new curve scales smoothly from 0 badges (all G4) to 8 badges
  (G1:20 / G2:70 / G3:10), and is tuned to sit roughly one tier
  behind the contemporaneous trainer roll at every step. Concrete
  early-/mid-/late-game shape:
  - 0 badges → G4 only.
  - 2 badges → G3:40 / G4:60.
  - 4 badges → G2:25 / G3:60 / G4:15.
  - 6 badges → G1:3 / G2:60 / G3:35 / G4:2.
  - 8 badges → G1:20 / G2:70 / G3:10.
- Species pick inside the chosen grade was already pure `Math.random`
  (not seeded story RNG), so reloads and rematches each surface a
  different species. That stays.
- The Crucible's wild encounter button now flows through the same
  `rollWildEncounter` path — at 8 badges (post-HoF) it resolves to
  the late-game curve above, replacing the hardcoded G1:10 / G2:30
  / G3:40 / G4:20 mix.

### Reason

The user spec for wild encounters is "random, based **only** on the
grade system and the toggled generation settings, balanced with a
fun challenging curve through story mode." The old derive-from-
trainer-then-shift formula technically used grades + gens, but the
trainer's row was a third hidden input that made the curve
non-monotonic across the timeline and coupled the wild experience
to the next fight's identity (gym-trainer vs. basic-trainer rows
could roll different wild pools at the same badge level). Pulling
the curve onto its own table — explicitly indexed by badges —
gives a single readable progression you can tune, keeps the wild
intentionally one tier behind the foe ahead, and frees the wild
roll from any awareness of the trainer fight it precedes.

## Unreleased — Simplify game modes (default = Classic, all mechanics on) 2026-05-16 (`claude/simplify-game-modes-vHlMS`)

### Changed — Battle menu defaults & hidden advanced toggles

- The main battle menu no longer exposes the four mechanic checkboxes
  (Mega / Z-Move / Dynamax / Tera) or the Classic ↔ Unlimited radio.
  All four mechanics are **always on**, and **Classic** (one use per
  team) is the only mode. This removes a confusing pre-battle decision
  most players ignored.
- The same toggles still exist in **Story setup**, but are now folded
  into a collapsible "Advanced (mechanics, mode, item rules)" section
  that ships closed. The **No Item Run** checkbox lives in the same
  section. Defaults: all mechanics on, Classic, item run normal.
- Online PvP inherits the new defaults via the host's `settings`
  (no contract change). Existing story saves keep whatever they were
  started with.

### Reason

Two independent knobs (which mechanics are legal, and whether each
one is once-per-team or once-per-mon) doubled the design surface for
no real benefit — the build planner and AI were both implicitly
balanced around "Classic + all on", and the toggles mostly created
confusing edge cases (e.g. "why is Mega greyed out?"). Hiding them
behind a story-only advanced section keeps the system available for
the few players who want it without making it the first thing
everyone sees.

## Unreleased — Post-rival catch tutorial (FireRed/Emerald-style) 2026-05-16 (`claude/balance-story-mode-Vf3Vj`)

### Added — Static "your first wild" catch tutorial

- Right after the intro rival victory, a one-time event interrupts the
  next battle: a friendly **Grade-4 wild** (drawn from a curated
  `STARTER_PARTNER_POOL` of generation-appropriate route fauna — Pidgey,
  Rattata, Lechonk, Skwovet, etc.) appears with a guaranteed catch
  (100% on first throw, no flee) and a richer "🎓 CATCH TUTORIAL" tip
  walking the player through ball multipliers and the percentage math.
- The Run button is hidden — this is a "must catch" event, modeled on
  the FireRed Weedle / Emerald Zigzagoon catching demos.
- Flagged via `sm.catchTutorialDone` so it fires exactly once per save.
- Net effect: the player leaves the intro-rival zone with **2 mons**
  guaranteed, so the first wild route, the next basic trainer, and
  Gym 1 are at least 2v2. No more 1v1 number-cheese opening.

### Reason

After yesterday's pass made foe size match player team size, a player
who skipped the pre-rival wild route ended up at Gym 1 with just
their starter — fighting 1v2 against the gym leader's role-floor of
2 mons. That felt off. The catch tutorial closes the loop: it
teaches the mechanic, adds flavor pacing between the intro rival and
Gym 1, and guarantees the player always has at least 2 mons by the
first gym — without forcing a partner directly into the starter
flow.



### Changed — Foes now match the player's team size

- Replaced the badge-curve foe sizing with **player-matching**: foe
  party size = player party size, with a small per-role floor so a
  1-mon trainer still feels like a real fight pre-Gym 1. Floors:
  trainers 1, rivals 2, GL1–2 = 2, GL3–4 = 3, GL5–6 = 4, GL7 = 5,
  GL8 = 6. Story finales (Champion + Elite Four + Victory Road +
  post-HoF Mystery Figure) still field a full 6 regardless.
- Net effect: a player who runs lean (1–3 mons) faces lean trainer
  parties; a player who builds full faces 6v6 trainer fights. Every
  battle stays a fair duel run-to-run, regardless of how many wilds
  the player caught.

### Changed — Party cap is back to a flat 6 (no badge gating)

- Removed the prior `1 + badges` cap. The new foe-matching makes the
  cap unnecessary — a runaway player team just gets a matching foe.
- Catches above 6 still go to the PC; the cap message still fires.

### Changed — Professor only appears until party reaches 6

- Each city's Professor (cities 0–5 directly, cities 6–8 via
  `shouldForceCityProfessor`) is now hidden once the player's active
  team is at 6/6. A player who never catches a single wild still
  ends the front half of the run with a full 6-mon team because the
  six pre-League Professors are exactly enough.
- The City-8 post-Gym-8 legendary gate (Mystery Figure swap) is the
  *one* exception — it stays visible at 6/6 because the swap is the
  required pre-Victory-Road story beat.

### Reason

Previous balance pass keyed the active party cap on badges, which
was too rigid: accepting the Professor's gift at City 1 (pre-Gym 1)
overflowed straight to PC because the cap was still 1. The new
model is cleaner: foes match player team size, so the player's
choice of how many mons to bring is honored as a strategic decision
rather than a balance liability. Professor still guarantees a path
to a full team for non-catchers.



### Changed — Party size is now a real progression mechanic

- **Active party cap = `1 + badges`** (cap 6 at five badges). With wild
  catching enabled, runs were ending with wildly different party sizes
  (1-mon purists vs 6-mon hoarders) which made foe scaling unreliable.
  The cap ties active party growth to the same badge clock the foe-size
  formula already uses — so 0-badge intro fights are reliably 2v2 (or
  1v2 with full heal), and Gym 5 onward is full 6v6 territory. Catches
  beyond the cap still succeed; they wait in the PC until you've earned
  more slots. Surfaced in the city hub party label, the PC, and the
  Professor's tip on first visit.
- **Intro rival no longer hardcoded to 1 mon.** It now follows the
  standard rival formula (2 at 0 badges). A player who caught their
  pre-fight wild fights a fair 2v2; a player who skipped fights 1v2
  with full heal between mons. Old hardcode pre-dated wild catching.

### Changed — Mystery Figure is no longer the "team is full" handler

- **Professor and Mystery Figure are distinct mechanics now.** The
  Professor's gift always works (via the new badge-gated cap, never
  overflowing). When you visit at the cap, the Professor offers a
  "Lab Companion swap" — pick a teammate to send to PC. The
  "Mystery Figure" branding is now reserved for actual story-mystery
  events: the City-8 post-Gym-8 legendary gate, the post-HoF Mystery
  Figure battle, and the Crucible's Mystery encore button.
- Side-effect: the "lab companion swap" UI uses Professor sprites and
  Professor quotes, not the Mystery Figure mask. The mechanic stays;
  the framing aligns with what the player is actually doing.

### Changed — Safari Zone tightened (was OP)

- **Entry 1,200 → 2,500G.** Old price made a Safari run consistently
  cheaper than a Link-Station upgrade for a G2, which collapsed the
  cost curve.
- **Pool weights G1:8/G2:40/G3:38/G4:14 → G1:3/G2:22/G3:50/G4:25.**
  Safari is no longer a free G1/G2 pipeline; it's a G3-leaning catch
  trip with a small G2/G1 chance.
- **Encounters per session 8 → 6.** Matches the original design spec.
- **Safari Balls per session 25 → 15.** You're not stockpiling.
- **Safari Ball catch multiplier 1.5× → 1.25×** (sits between Poké
  and Great instead of between Great and Ultra).

### Changed — Underground sell prices reduced

- **G1 2,500 → 1,800 / G2 700 → 400 / G3 150 → 100 / G4 30 → 20.**
  Old prices made "catch wilds, sell wilds" net positive enough to
  fund a full training pass on the same gold. The new curve makes
  *keeping* and training the catch the rewarding play; the Underground
  is for roster management (PC overflow, unwanted dupes), not gold
  farming.

### Added — Early-game thematic battles

- Added `STORY_THEMED_BATTLES` entries at event IDs **7** (cursed —
  "a vagrant on the back road"), **14** (multitype — first wanderer),
  and **20** (villain — first Team operative scouting). The mid-game
  thematic arc was previously empty for events 1–25; the early game
  now plants seeds the mid-game payoff resolves.
- Three new **cursed**-tagged Basic Trainers (Hollow Pilgrim, Mire
  Witness, Whisper Tracker) so the expanded thematic slots have a
  bigger pool to draw from. The cursed pool grew from 3 to 6 entries.

### Changed — City identity (forwarded from the city-identity pass)

- **Safari Zone is gated to City 4** ("Wilderness town"). Previously
  it surfaced on every city hub — including Pallet Town — which
  clashed with the design spec's "specific story event" intent.
  Crucible access is unchanged.
- **Poké Casino added to City 5** ("Resort town"). Stays in City 9
  (League) too — mid-game gets a coin-flip stop between Gyms 4 and 5,
  endgame keeps the existing hub.
- **Battle Dojo + EV Trainer added to City 8.** The player can't
  backtrack, and the prior loadout left a dead zone between Gym 8
  and the Elite Four for held-item / ability / EV polish.
- **One-line specialty banner per city** above the NPC quote, keyed
  by `CITY_SPECIALTY_BLURBS`. Drives home why each city matters.

### Reason

The story mode had picked up wild catching, the PC, the Safari Zone,
the Crucible, and a boss arc on top of mechanics that were balanced
for a simpler era. Cities felt interchangeable; Safari farmed cheaper
than upgrading; the Professor and the Mystery Figure read as the same
thing; the intro rival hardcode predated wild catching. This pass
threads the new mechanics through the existing balance curve, gives
each city a distinct identity, and reserves the Mystery Figure
branding for moments that actually carry the story's mystery.



### Changed — Cities now feel distinct instead of interchangeable

- **Safari Zone is gated to City 4** ("Wilderness town"). Previously it
  surfaced as a recover action on every city hub — including Pallet Town —
  which clashed with both the design spec ("specific story event")
  and the user expectation of it being a destination. Crucible access is
  unchanged, so post-HoF still lands you there with everything else.
- **Poké Casino added to City 5** ("Resort town"). Casino used to be
  League-only, which made mid-game gold management a single straight
  line. City 5 now hosts a coin-flip wager hub between Gyms 4 and 5
  — the mid-game gambler's stop — and the League's Casino stays in
  place for endgame.
- **Battle Dojo + EV Trainer added to City 8.** The player cannot
  backtrack, and the previous loadout left a dead zone between Gym 8
  and the Elite Four for held-item / ability / EV polish. With these
  added, the "Final-gym town" actually supports the last-mile team
  optimization its name implies.

### Added — One-line specialty banner per city

- Every city hub now prints a `📍`-prefixed identity line above the NPC
  quote (e.g. *"Wilderness town — the only Safari Zone gate in the
  region. Catch what you can while you're here."*). Drives home why
  the city exists on the route — surfaces what to do here, in one
  sentence, before any button is read.
- New constant `CITY_SPECIALTY_BLURBS` (10 entries, indexed by city)
  + `_cityBlurbFor(cityIdx)` helper; rendered by `renderCityActions`.

### Reason

The story mode had two latent identity problems: (1) Move Tutor and
Nature Rater spammed across 7–9 cities each made every mid-game hub feel
interchangeable, and (2) Safari Zone showed everywhere, which deflated
the design's "destination" vibe. This pass makes each city signal
its purpose at a glance and reserves Safari + Casino as the mid-game
flavor stops they were meant to be. Crucible (post-HoF super-hub)
still consolidates everything, so endgame access is preserved.

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
