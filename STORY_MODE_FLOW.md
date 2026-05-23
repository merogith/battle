# Story Mode — Canonical Design Spec

This is the **working spec** for the new story-mode flow: catching, the PC, the
Underground (corrupted Centers), wild routes, the Safari Zone, and the post-Champion
boss arc ("The Caged God").

It supersedes prior recommendations in `docs/STORY_MODE_DESIGN_DECISIONS.md` where
they conflict. Conflicts are noted inline so old context isn't silently
contradicted.

**Code anchors** below use `battle.html:LINE` so each subsystem can be jumped to
directly. All line numbers are against the current main file at the time of
writing — they will drift as work proceeds.

---

## 1. One-screen summary

| System | Decision |
|---|---|
| Map | Linear city pipeline (existing `STORY_EVENTS_RAW`, 68 rows, unchanged). **Route nodes** appear as virtual interrupts between cities (strategy A — no new timeline rows). |
| Wild | Forced encounter per route node. Single mon, weaker grade pool than adjacent battles. |
| Safari Zone | Story-unlocked location. First visit free; subsequent visits cost gold. Continuous random encounters up to 6 per run. Mons can flee on missed throws. Better grade mix than wild routes. |
| Catch | Pure minigame — no fight, no HP, no status. `chance = species.catchRate × ballMult`. Mons can flee. |
| Balls | PokéBall 1.0×, Great 1.5×, Ultra 2.0×, Master ∞. Start the run with 5 PokéBalls. |
| Ball sources | PokéMart sells PokéBalls (every city). Department Store sells Great Balls (existing City6/City8). Ultra Balls scatter through gym/Elite/Champion victory bundles and Frontier milestones (substantially more than the original "×2 total" draft; the loosened economy hooks into Underground gold-sink balance). Master Ball ×1 from the boss arc. |
| Caught state | Full HP / full PP / no status. |
| HP between battles | **Full-heal between every battle.** Attrition is removed; mart consumables matter only within a single battle. |
| Difficulty modes | Keep `veryeasy / easy / normal / hard / challenge`. **Remove `hardcore`.** |
| PC | Pure storage. Flat array, **cap 30** (raised from the original draft's 10 after playtest — active-catching runs hit 10 mid-game). Catch fails with an explicit message when party 6/6 and PC 30/30 — player must sell or release first. Stable `id` per mon. |
| Underground | Built into every Pokémon Center hub button. Always visible. Sells your mons for gold (price scales with grade). Cannot sell your last party mon, the starter, or the boss-arc capture. |
| Pokémon Center button | New city hub action. Contains PC + Underground. No heal function (battles auto-heal). |
| Foe sizing | **Badge curve**: `min(6, 2 + badges)` for everyone except story finales (always 6) and the intro rival (pure player-match for a 1v1 starter duel). So foes = 2 pre-Gym-1, 3 post-Gym-1, …, 6 from post-Gym-4 on. |
| Player party cap | **Same badge curve**: `min(6, 2 + badges)`. Catch tutorial fills slot 2 right after intro rival (cap = 2). Each gym victory unlocks one more slot up to 6 at four badges. Catches and Professor gifts above the cap overflow to PC — the player can always *catch*, they just can't *field* past the cap until the next badge unlocks. |
| Expected sequence (non-catcher) | Intro rival 1v1 → catch tutorial → cap 2 (2v2) → GL1 2v2 → **(badge 1, cap 3)** → leave the post-gym hub → route wild → arrive at next city → Pro available → GL2 3v3 → **(badge 2, cap 4)** → next route wild → next city's Pro → GL3 4v4 → **(badge 3, cap 5)** → GL4 5v5 → **(badge 4, cap 6)** → GL5+ / E4 / Champion 6v6. A wild-catcher fills the cap immediately on the route; foes still follow the badge curve, so over-catching means PC overflow, never a foe mismatch. |
| Professor visibility | Each city's Professor (cities 0–5 by action list; cities 6–8 via `shouldForceCityProfessor`) appears **only at pre-gym hubs, and only while the player's active party is below the current cap**. So pre-Gym-1 with a full 2/2 party, no Pro button. After Gym 1 (cap → 3), the post-gym hub of City 1 is intentionally Pro-less — the badge unlocks the slot, but the player walks the route (with its wild-encounter beat) and meets the next Professor at City 2's pre-gym hub. Post-gym hubs still keep the Pokémon Center (PC swap-in for any mon already stored) so the new slot isn't dead until the route. Lone exception: City-8 post-Gym-8 legendary gate (Mystery Figure), which stays visible at 6/6 because the swap is required to enter Victory Road. |
| Rival adaptation | Read live `sm.team` at battle entry. **Do not** filter `wild:true` mons. |
| Intro rival | Special-cased to pure player-match (1v1 starter duel). The catch tutorial fires *after* this fight. |
| Catch tutorial | After the intro rival victory, a one-time static event fires before the next battle: a random Grade-4 wild from the player's enabled gens (`buildGradePool(gens, 4)`, excluding species already on the team) appears, 100% catch on first throw, no flee, with a tutorial overlay (FireRed/Emerald-style). Same Grade-4 pool the next route wild will draw from, so the tutorial mon tiers with the route. Marked done via `sm.catchTutorialDone`. Fills the 2nd slot exactly at the 0-badge cap of 2. |
| Pokédex | Seen + Caught. Persisted cross-run in a separate `pbs_story_meta` localStorage key. |
| NG+ carryover | Pokédex + achievements + run-clear marks. PC empties between runs. |

---

## 2. Map model

The existing `STORY_EVENTS_RAW` array (`battle.html:21273–21341`) stays as-is.
Cities (rows of `type: 'City'`) and Battles (rows of `type: 'Battle'`) keep
their indices, contents, and grade weights.

**Route nodes** are inserted at runtime by `proceedToNextBattle`
(`battle.html:24593`), not in the timeline. When the player is leaving a city
and the next event is a Battle in a different city, the engine pauses, runs a
wild-encounter screen, then advances to the next Battle row.

Implementation strategy = strategy A from
`docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §5`:

- Save the story state on entry.
- Run the wild-encounter screen as a save/restore-wrapped interrupt.
- Promote any catch from `state.pendingCatch` into `sm.team` (or `sm.pcBox`) on
  exit.
- Restore on cancel.
- `sm.eventIndex` is **not** advanced by route nodes.

Trade-off: keeps `eventIndex` semantics clean; needs the save/restore wrapper.

---

## 3. Wild encounters (route nodes)

| Aspect | Value |
|---|---|
| When | **`STORY_WILDS_PER_ROUTE_NODE` (= 2)** wilds per route node, fired back-to-back between consecutive Battles that cross a city boundary. Each wild rolls independently from the grade curve below, so the pair is usually two different species. Forced — no skip (Run still ends the current encounter; the next one fires after). |
| Where | Virtual screen, not a timeline row. The same `screen-story-catch` screen renders both wilds; on resolution of the first, the interrupt chain re-runs and the second slides in. |
| Pool grade | Driven by a dedicated **wild grade curve keyed on `sm.badges`** (0–8, see `_WILD_GRADE_CURVE_BY_BADGES`). Independent of the upcoming trainer's `gradeWeights` — wilds reflect the route's biology, not the next fight's lineup. Each tier sits one step behind the contemporaneous trainer roll, so wilds are intentionally inferior to Professor picks and to the foe ahead. |
| Pool species | Filtered by `sm.settings.enabledGens`, same as trainer rolls. The two toggles (grade curve + enabled gens) are the **only** inputs to the wild roll. |
| Build | Rough build per the prior audit's A4 — 4 random level-up moves, no held item, default ability, neutral nature, no EVs. Tagged `wild: true`. |
| Player options | Throw (any ball type from inventory) or Run. |
| Flee | Foe may flee on a missed throw (per-species flee chance; baseline 25%). |
| Capture state | Full HP / full PP / no status. |
| Counter | `sm.wildSeenByEventIdx[battleIdx]` — increments on each fire. Legacy `true` (pre-multi-wild saves) reads as 1, so a save mid-route just gets the remaining slot rather than re-firing a wild that was already cleared. Roaming legendary fires consume *all* slots at once. |
| If party + PC are both full | Capture fails with explicit modal. The remaining wild slot still fires after; the player can Run to move on. |

---

## 4. Safari Zone

The Safari Zone replicates the canonical gameplay loop (no battles, only Safari Balls work, Bait/Rock as asymmetric levers, every turn the wild may flee) and adapts the numbers to story mode's 6-encounter / 15-ball session shape.

| Aspect | Value |
|---|---|
| Unlock | City 4 ("Wilderness town") action button — both pre- and post-Gym-4 hub rows carry it. |
| Location | City 4 only in the main timeline. Post-HoF access is via the Crucible (which also exposes the same screen). |
| Cost | First entry free. Subsequent entries cost `SAFARI_ENTRY_COST` (10,000G). |
| Encounters | Continuous random encounters up to `SAFARI_MAX_ENCOUNTERS` (6 per session). Each encounter is a single mon. |
| Pool grade | `SAFARI_GRADE_WEIGHTS` g1:3 / g2:22 / g3:50 / g4:25 — tightened to make Safari a "spend money for a real chance" trip rather than a guaranteed haul. |
| Balls | Safari-session pool only (`SAFARI_BALLS_PER_SESSION` = 15). The player's PokéBall stack does **not** apply inside; leftover Safari Balls are forfeited on exit. Safari Ball multiplier `SAFARI_BALL_MULT` = 1.35× (between Poké and Great). |
| Bait/Rock | Bait `SAFARI_BAIT_CATCH_MULT` 0.70× catch / `SAFARI_BAIT_FLEE_MULT` 0.55× post-miss flee. Rock `SAFARI_ROCK_CATCH_MULT` 1.65× catch / `SAFARI_ROCK_FLEE_MULT` 1.70× post-miss flee. Stack up to 3× each; reset between encounters. |
| Flee — on missed throw | Per-grade flee rate (G1 55% → G4 20%), modulated by bait/rock stacks. |
| Flee — per turn (Bait/Rock) | Each Bait/Rock action also rolls a flee check at the end of the turn — canonical Safari tension. Bait turn flee = `0.20×` of the post-miss formula (gentle, typically 1–6% per turn). Rock turn flee = `0.55×` of the post-miss formula (20–40% per turn, scales fast with stacks). Hard-capped at `SAFARI_TURN_FLEE_CAP` = 45%. |
| Exit | After 6 encounters, when balls run out, or via "Leave Safari" button. Caught mons enter party/PC; uncaught are gone. End-of-session messages are PA-style ("Ding-dong! Your Safari Zone game is over!"). |

---

## 5. Catch minigame

A single screen, used by both wild route encounters and Safari encounters.

```
chance = species.catchRate × ballMult
if (Math.random() < chance) → caught
else → mon may flee (species.fleeRate, default 0.25)
       otherwise stays for another throw
```

Species `catchRate` is derived from grade. G1 is the strongest tier (pseudo + legendary in `getMonGrade`) and is therefore the **hardest** to catch; G4 is the weakest tier and is the easiest. Live values (`battle.html:28560–28561`, after the post-Safari rebalance pass):

| Grade | Base catch rate (PokéBall) | Flee chance on a miss |
|---|---|---|
| G1 (strongest) | 0.12 | 0.40 |
| G2 | 0.22 | 0.28 |
| G3 | 0.35 | 0.20 |
| G4 (weakest) | 0.50 | 0.12 |

Ball multipliers: PokéBall 1.0×, Great 1.5×, Ultra 2.0×, Master ∞ (`Infinity`).

Master Ball is `Infinity` — guaranteed catch. No special-case code.

Safari Ball is its own session-scoped multiplier (`SAFARI_BALL_MULT = 1.35×`, sitting between Poké and Great with a slight lean toward Great) and is not part of `sm.balls`. Bait and Rock modify the catch/flee math multiplicatively inside a Safari encounter and reset between encounters.

---

## 6. Balls and economy

| Ball | Multiplier | Source | Cap |
|---|---|---|---|
| PokéBall | 1.0× | PokéMart (300G ea, unlimited) + 5 at run start | — |
| Great Ball | 1.5× | Department Store (existing City6/City8) (1000G ea) | — |
| Ultra Ball | 2.0× | Gym Leader / Elite Four / Champion victory bundles + Battle Frontier milestones (was: ×2 static drops in the original spec; widened after the Underground/Crucible economy landed and a tight ball supply stopped paying out) | unbounded |
| Master Ball | ∞ | Boss arc reward (Underground broker) | 1 per run |

Money flows already in the game:

- **Sources**: trainer victories (1200–7500G), retreat penalties unchanged, post-HoF Mystery Figure boss (12000G).
- **Sinks**: existing mart/dept items, the new ball purchases, Safari entry, Tutor / Colress / Link Station / EV Trainer fees.
- **New source**: Underground sells (per grade — see §8).

The Underground + Safari combination forms a self-balancing loop: catch extras, sell weak ones, fund Safari for stronger pulls. The economy must be tuned so that pure Safari spam does **not** net-positive gold (G1/G2 wild catches sell for less than a PokéBall costs to make Safari spam unprofitable).

Initial peg (G1 is the strongest tier per the existing `getMonGrade` convention — `data/species.json` G1 includes pseudo + legendary):

| Sale | Grade | Gold |
|---|---|---|
| Sell G1 mon | 1800 |
| Sell G2 mon | 450 |
| Sell G3 mon | 250 |
| Sell G4 mon | 60 |

(Originally tightened from 2500/700/150/30 to 1800/400/100/20 to keep *keeping* mons the rewarding play; then rebalanced from 1800/400/100/20 to 1800/450/250/60 so route catches are worth selling for catch-light players. Safari spam still loses money — typical 6-encounter session pulls ~1,758G expected, far less than the 10,000G entry, even before catch-rate failures. See `_PC_UNDERGROUND_PRICE_BY_GRADE`.)

---

## 7. Pokémon Center hub button (new)

Every city gets a new hub action: **"Pokémon Center"**. Tapping it opens a screen with two tabs:

- **PC Storage** — Deposit, withdraw, release. **Capacity 30** — raised from the original draft's 10 after playtest (active wild-catching runs hit 10 by mid-game and the cap stopped being a meaningful decision lever; 30 keeps the Underground's "sell or store" choice live without forcing premature releases). At ≥ 27/30 the screen shows a "PC almost full" warning banner; at 30/30 a new wild catch fails outright with a clear modal telling the player to sell or release first.
- **Underground** — Sell mons for gold. Dark visual theme. Per-grade price table above. Unsellable: starter, current last party mon, the boss-arc capture ("Subject Zero").

Selling shows a confirmation modal (`"Sold to the Underground. Gone for good."`) with no take-back.

No heal function on the Center — full-heal between battles is universal.

---

## 8. Difficulty modes (after hardcore removal)

The five surviving modes use these values (`battle.html:8999–9019` for stat mult, `~22267` for coin mult). These have drifted from earlier drafts of this spec; the table below reflects what actually runs:

| Mode | Foe stat mult | Coin mult |
|---|---|---|
| Very Easy | 0.70 | 1.60 |
| Easy | 0.85 | 1.50 |
| Normal | 1.00 | 1.30 |
| Hard | 1.15 | 1.00 (floored from 0.92) |
| Challenge (Very Hard) | 1.30 | 1.10 |

Note: `applyStoryLeagueFoeStatBoost` (E1–E4 / Champion / league Rival / post-HoF Mystery) is applied **before** `applyFoeDifficultyScaling`, so the two stack multiplicatively. Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495.

**Early-game softening:** `_earlyGameFoeStatMult()` applies a tiered post-build stat multiplier through the first two gyms so RNG can't brick a fresh save:

| Phase | Event | Multiplier (constant) |
|---|---|---|
| 0 badges | non-GL fights (intro rival, route trainer, Gym Trainer 1) | `PRE_GYM1_FOE_STAT_MULT` = 0.82 |
| 0 badges | **Gym Leader 1** | `EARLY_GL_FOE_STAT_MULT` = 0.95 (every slot, gentle so the gym still gates) |
| 1 badge | route fights between GL1 and GL2 | `EARLY_GAME_FOE_STAT_MULT` = 0.92 |
| 1 badge | **Gym Leader 2** | `EARLY_GL_FOE_STAT_MULT` = 0.95 |
| 2 badges | route fights between GL2 and GL3 | `EARLY_GAME_FOE_STAT_MULT` = 0.92 |
| 2 badges | **Gym Leader 3** | `STAGE2_GL_FOE_STAT_MULT` = 0.97 (Stage 2 entry — added after the original spec to smooth the GL2→GL3 difficulty cliff) |
| ≥ 3 badges | every fight | 1.00 — softening ends |

The "gym leader's signature ace stays the identity" guarantee is enforced through **composition**, not stat exemption: `rollTrainerTeam`'s `gwForFiller` shifts non-signature fillers one tier weaker on the grade roll while signature aces stay in the row's canonical grade. A flat 5% stat softening on top keeps GL1/GL2 winnable without changing who the leader fields. Set any constant to `1.0` to disable that tier's softening.

In addition, `applyDifficultyToGradeWeights` shifts a small slice of g1 (×0.92) and g2 (×0.96) mass down to g3 universally, so opponents are slightly less likely to high-roll a top-tier mon. Gym Leader teams shift another ~20% of g1 → g2 and ~15% of g2 → g3 for the non-signature pickThematic call only — the leader's signature picks stay at the original tier, the rest of the team eases up.

The pre-Gym-1 Basic Trainer slot (event idx 2, the lone route fight between intro rival and City 1) is locked to a tight "fodder class" allowlist (`_EARLY_ROUTE_FODDER_CLASSES`): Youngster, Lass, Bug Catcher, Hiker, Fisherman plus their 2-type filler analogs (Lab Rat, Mountain Guide, Ace Diver, Tea Aroma, Glacial Trekker, Marsh Walker). Dragon Tamer, Hex Maniac, Black Belt, Bird Keeper, Reactor Tech, Mystic, and Crooked Beat are excluded — even at G4-only their type pools (Dratini, Pidgeotto, Beldum, Abra, Sneasel, etc.) read as premium for a Route-1 fight. Villain / cursed / multitype / eldritch tagged variants are also excluded, same as before.

**Implementation note:** `_earlyGameFoeStatMult` and `_isPreGym1NerfedBattle` live at script top-level, *outside* the `window.StoryMode = (function() {…})()` IIFE that wraps every story-mode helper. To look up the current row, they reach in via `window.STORY_EVENTS_RAW` (re-exported next to the array's definition). Without that re-export, `typeof STORY_EVENTS_RAW` resolves to `'undefined'` from the top-level scope and the softening silently no-ops — which is the state the prior `PRE_GYM1_FOE_STAT_MULT = 0.85` ship was in before the early-game-curve pass.

The `hardcore` value is removed entirely. Existing saves on `hardcore` migrate to `normal`.

All five modes use **full-heal between battles**. The HC-only persistence code at `battle.html:24739–24750` becomes dead and is removed in M0.

---

## 9. Boss arc — "The Caged God"

Triggered post-Champion. Row 67 (`Mystery Figure`) in `STORY_EVENTS_RAW` is the post-HoF Mystery Figure climax — `continuePostGame()` (`battle.html:30702`) routes the player through row 67 once on first post-HoF reentry (mask-drop + identity reveal, single fight), then snaps `sm.eventIndex` back to the last visited city so the Crucible / Caged God doors are visible at every subsequent city visit. The Caged God arc itself is triggered separately, via the Underground broker handing the player a Master Ball after the Mystery Figure climax; Mystery Figure also remains reachable as the Crucible's "Mystery" encore on every later run. (See §14d.)

### Trigger and leads

After the Hall of Fame transition, the Underground broker hands the player the Master Ball. To find the cage, the player must visit **three corrupted Pokémon Centers** in any order. Each visit unlocks a flavor lead via dialogue — no fight, no minigame.

| Lead | Where | Content |
|---|---|---|
| 1 | Center A | The ledger — broker reveals the specimen is "Grade 1" |
| 2 | Center B | The recording — wax-cylinder audio log of the keepers, panicked |
| 3 | Center C | The key — broker won't sell it; demands the player's strongest mon (or a steep gold price) |

After all three are collected, a hidden route node appears on the map: **The Cage**.

### Boss fight

Standard battle UI. Player's full party vs. a single mon.

- **Species**: randomly chosen at boss-arc-unlock from the pool returned by `speciesDexIsLegendaryTier(sp)` (`battle.html:5407`, `8826`) — the existing Sub-Legendary + Restricted Legendary set in `data/species.json`. Filtered by `sm.settings.enabledGens`. Locked once chosen.
- **HP**: ~10× the species' normal max HP.
- **Speed**: high.
- **Moveset**: limited but punishing rhythm (Splash × 2 → strong attack → Splash × 2 → strong attack …). Reuses the species' canonical moves; the rhythm is what's tuned.
- **Unique mechanic**: if the species has an unusual move/ability in the data (e.g., Mewtwo's Pressure, Lugia's Multiscale), it's enabled.

### Catch step

When the boss's HP hits 0 it does **not** faint. The screen darkens. Catch minigame opens with `species.catchRate` overridden to **0.01**:

- PokéBall (1.0×) = 1% per throw
- Great (1.5×) = 1.5%
- Ultra (2.0×) = 2%
- **Master (∞) = 100%** ← intended path

Flee chance is low so a stubborn player can grind PokéBalls, but the Master Ball is the obvious solution.

### Reward

Caught: enters the player's roster as **"Subject Zero"** with a unique flag. Stats bumped toward the species' real BST. `unsellable: true`. Game declares the post-game over.

---

## 10. Schema changes (M0 deliverable)

```js
// Add to sm defaults at battle.html:22191
pcBox:        [],                                        // flat, cap 30 (PC_BOX_CAP)
balls:        { poke: 5, great: 0, ultra: 0, master: 0 }, // starting balls
pokedex:      { seen: [], caught: [] },                   // per-run; cross-run lives in pbs_story_meta
catchUnlocked: false,                                     // toggles wild-route prompts; flipped on after first wild route entry or starter
postHofMysteryClimaxDone: false,                          // post-HoF row-67 climax fire-once flag
```

Plus a stable `id: string` on every mon (in `sm.team` and `sm.pcBox`), generated at creation time. Existing mons in `sm.team` get IDs assigned by the v14→v15 migration.

Bump `SAVE_VER` from 14 to 15. Add:

```js
function migrateStoryPreV15() {
    // 1. New fields with defaults
    if (!Array.isArray(sm.pcBox)) sm.pcBox = [];
    if (!sm.balls || typeof sm.balls !== 'object') sm.balls = { poke: 5, great: 0, ultra: 0, master: 0 };
    if (!sm.pokedex || typeof sm.pokedex !== 'object') sm.pokedex = { seen: [], caught: [] };
    if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;
    // Post-HoF Mystery Figure climax flag — pre-existing post-HoF saves skip the
    // new beat (treat them as already-done).
    if (typeof sm.postHofMysteryClimaxDone !== 'boolean') {
        sm.postHofMysteryClimaxDone = !!(sm.bossArc && sm.bossArc.available);
    }
    // 2. Hardcore → normal
    if (sm.storyDifficulty === 'hardcore') sm.storyDifficulty = 'normal';
    // 3. Stable IDs on existing team
    for (const slot of (sm.team || [])) {
        if (slot && !slot.id) slot.id = 'm_' + (Math.random().toString(36).slice(2, 10));
    }
}
```

`SAVE_KEY` (`pbs_story_save`) stays the same. A separate `SAVE_KEY_META` = `'pbs_story_meta'` is introduced for cross-run carryover (later milestone).

---

## 11. Removing hardcore (M0)

Touchpoints across `battle.html`:

| Line | What | Action |
|---|---|---|
| 4612 | `<option value="hardcore">Hardcore</option>` in main settings | Delete |
| 4947 | `<option value="hardcore">Hardcore</option>` in run setup | Delete |
| 21372 | `if (diff === 'hardcore') return 1.30;` in coin mult | Delete branch |
| 22411 | Whitelist of difficulty values for restoring saved difficulty | Drop `'hardcore'` from the list |
| 23697–23701 | `partyHurt` hub indicator gated on hardcore | Delete — full-heal between battles makes `partyHurt` always false |
| 23844 | `if ((sm.storyDifficulty || 'normal') === 'hardcore')` branch | Delete branch |
| 23980 | `difficultyHasRetreatFee` includes `'hardcore'` | Drop from the list (or refactor to a helper) |
| 23995 | `if (… === 'hardcore') return;` skip retreat fee | Delete branch |
| 24739–24750 | HC-only HP/PP persistence on battle init | Delete the whole block — full-heal is universal |
| 24866 | Post-battle save: `const isHardcore = sm.storyDifficulty === 'hardcore';` + write paths | Delete |
| 24947 | Same as above, defeat side | Delete |
| 25036 | Heal-on-loss skip in hardcore | Delete branch (heal-on-loss happens unconditionally per full-heal) |
| 26270 | Stat-mult comment "hardcore mirrors normal" | Remove from comment |
| 26345 | Display name map | Drop `'hardcore'` key |
| 26383 | Foe-mult description string | Delete the `'hardcore'` line |

Net effect: hardcore stops being selectable; existing hardcore saves migrate to normal on load; HP persistence is removed; full-heal becomes universal.

---

## 12. Party-size as difficulty signal (M0)

Per the prior audit's "single most important rule"
(`docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §8`), every place that keys
difficulty off `sm.team.length` must move to `sm.badges` (the monotonic
progression clock the player can't undo) so depositing a mon to PC can't
re-introduce easier grade rolls mid-game.

Live implementation in `battle.html`: `storyStripGrade4IfPartyMature`
keys the strip on `sm.badges < 1` — pre-Gym-1 routes keep the G4 ramp,
and from Gym 1 onward the G4 floor lifts unconditionally regardless of
PC deposits or release decisions.

---

## 13. Implementation phases

Each phase is shippable on its own and leaves the game playable.

### M0 — Schema + hardcore removal (~1 day)
- Bump `SAVE_VER` to 15.
- Add new save fields (`pcBox`, `balls`, `pokedex`, `catchUnlocked`).
- Migrate v14 saves: assign stable IDs, set defaults, hardcore → normal.
- Remove `hardcore` from difficulty UI + all branches (see §11).
- `storyStripGrade4IfPartyMature` gates the strip on `sm.badges < 1`
  (pre-Gym-1 keeps the G4 ramp; Gym 1 onward lifts the floor).

After M0: existing game still plays normally; new fields exist but are unused; hardcore players migrate cleanly.

### M1 — Pokémon Center hub + PC + Underground (~1–2 days)
- New screen `#screen-story-pokemoncenter`.
- City hub button: "Pokémon Center" — visible on every city row in `STORY_EVENTS_RAW`.
- PC tab: deposit / withdraw / release flow.
- Underground tab: sell flow with grade-priced gold rewards.
- Stable IDs propagate; Tutor / Colress / Link / EV access PC mons (withdraw + tutor + deposit).

After M1: catching has a destination; no catching yet.

### M2 — Catch minigame + balls + wild routes (~2–3 days)
- New screen `#screen-story-catch` (used by both wild and Safari).
- `PokéBall`, `Great Ball`, `Ultra Ball`, `Master Ball` added to `sm.balls`.
- PokéMart sells PokéBalls (300G each); Department Store sells Great Balls (1000G each) — new rows in `POKEMART_ITEMS` / `DEPT_ITEMS`.
- `proceedToNextBattle` (line 24593) inserts a route-node interrupt between consecutive Battles that cross a city boundary.
- Wild route flow: roll species via the badge-keyed wild grade curve (`_WILD_GRADE_CURVE_BY_BADGES`) filtered by `enabledGens` — no dependency on the upcoming trainer; open catch screen; throw/run; on catch → `state.pendingCatch`; on exit → promote to `sm.team` or `sm.pcBox`.
- Caught mon flagged `wild: true`; rough build via new `makeWildBuild` helper.

After M2: full catch loop is live.

### M3 — Safari Zone (~1–2 days)
- New screen `#screen-story-safari`.
- City action button on Safari-eligible cities (TBD after Gym N).
- First entry free; subsequent entries deduct gold.
- Up to 6 continuous encounters per run; richer grade pool than wild routes.
- Same catch minigame.

### M4 — Boss arc (~2–3 days)
- Repurpose row 67 (post-HoF Mystery Figure) as the boss-arc trigger.
- Underground broker hands player the Master Ball + first lead.
- 3 corrupted-Center leads (talk-only).
- Hidden route node ("The Cage") appears after all leads collected.
- Boss fight against random legendary, 10× HP, themed moveset.
- Post-defeat catch step with forced 1% catch override.
- Caught = "Subject Zero", unsellable, post-game over.

### M5 — Polish + Ultra Ball gifts (~1 day)
- 2 Ultra Balls dropped at static story events (placeholders: post-Gym 4 trainer, post-E2 broker).
- Tutorial `oneTimeTip` for each new system (first wild, first throw, first catch, first deposit, first sale, first Safari, first boss lead).
- Pokédex screen with seen + caught counts.
- Balance pass: trainer payouts, ball prices, Underground sale prices.

---

## 14. Conflicts with prior design docs (explicit)

This spec overrides these prior recommendations:

| Prior doc | Prior recommendation | New decision | Why |
|---|---|---|---|
| `STORY_MODE_DESIGN_DECISIONS.md` C2 | HP-based catch formula | Pure grade × ball | Simpler; no in-battle catching anyway |
| C3 | Captured = preserve HP/status | Full HP / full PP / no status | No-fight minigame; nothing to preserve |
| C4 | Foe fights to KO | Foe may flee on miss | Catch is a minigame, not a battle |
| C5 | Wild 50% pre-trainer in same slot | Wild forced on dedicated route nodes | Cleaner separation; no in-slot conflict |
| D1 | PC = stasis | PC = pure storage (heal moot) | Full-heal between battles makes hospital/stasis distinction irrelevant |
| E1 | Hardcore catch policy via stasis | Hardcore removed entirely | Simplifies the design space |
| F2 | `noItemRun` strips balls in trainer | Balls are not in trainer-fight bag at all | Catch is a separate screen; balls aren't battle items |
| Catch placement (C1) | Throw replaces Run in wild | Catch is a separate screen, accessed only via wild/Safari/boss-arc flows | No in-battle UI changes |

These remain valid from the prior docs:

- **A1**: Stable `id` on every mon
- **A2**: Flat-array PC, cap **30** (revised down from the prior audit's 60, then raised from a 10-draft after playtest — this is a battle-focused story mode, but 10 forced too-frequent releases)
- **A3**: Pokédex seen + caught, cross-run
- **A4**: Rough wild builds (not full competitive)
- **A5**: Extend slot in place with optional new fields
- **B1**: Foe matches with per-event minimum (specific minimums in §1 above)
- **B2**: Drop `sm.team.length` as a difficulty signal — single most important refactor
- **B4**: Rivals avoid your species; basic trainers don't
- **F3**: `oneTimeTip(key, body)` helper, one-line tips per new system
- **G1**: NG+ carryover scope = Pokédex + achievements + marks; PC empties
- **G2**: v15 single migration per-run; separate `pbs_story_meta` for cross-run

---

## 14b. The Crucible — endgame super-hub + Battle Frontier (M6)

After Hall of Fame, every city's recover section shows a new action button:
**🧨 The Crucible — All facilities + Battle Frontier**. It enters a post-game
screen that consolidates every system the player has met, plus a new endless
ladder mode.

### The Crucible screen

Two button grids in one screen:

- **Battles**: ⛓ Battle Frontier · 🥷 Mystery Figure · 🌀 Rival Rematch ·
  🏛️ League Run (E1→Champion in sequence) · 🥊 Random Gym Rematch · 🌿 Wild Encounter.
- **Facilities**: 🏥 Pokémon Center · 🦒 Safari Zone · 🛒 PokéMart · 🏬 Department Store ·
  ✨ Relic Annex · 📖 Move Tutor · 📛 Nature Rater · 🥋 Battle Dojo · 🏋️ EV Trainer ·
  🧪 Colress · 🔌 Link Station · 🎰 Poké Casino.

While `sm.atCrucible === true`, `enterCity()` short-circuits to `enterCrucible()`,
so every "Back to City" button across facilities preserves the Crucible context.
"Leave The Crucible" returns the player to the last visited city.

### Battle Frontier

Endless ladder of 6-on-6 battles. Each round scales:

- **Stat boost** (foe mons only, via `applyStoryLeagueFoeStatBoost`):
  HP × `min(2.50, 1.35 + (round−1) × 0.05)`,
  bulk/speed × `min(1.80, 1.20 + (round−1) × 0.03)`.
  Round 1 starts at the post-HoF Mystery Figure boost; caps at +250% HP.
- **Grade pool** sharpens by round band:
  rounds 1–2: 20/40/40/0,
  3–4: 35/45/20/0,
  5–6: 55/35/10/0,
  7–8: 75/25/0/0,
  9+: 100/0/0/0.
- **Mechanics scaling** (gimmick rolls per round band) — deferred to a polish pass.

A loss ends the streak. Final streak inserts into `sm.frontier.highscores`,
sorted desc, capped at 10 entries (date stamped). Surrender at any time to lock
in the current streak. New runs start at round 1.

### Crucible-sourced battle flow

A new flag `sm.crucibleBattleSource` (values: `frontier` / `mystery` / `rival` /
`league` / `gym`) tells `onBattleEnd` to bypass the normal victory overlay /
game-over screen and route back to the right hub. `_handleCrucibleBattleEnd`
syncs the team, fires the source-specific outcome (frontier streak update,
league next-stage chain, simple return-to-Crucible for others), then drops a
`sm._crucibleBattleJustEnded` breadcrumb so `afterBattleReturn` short-circuits
and `processNextEvent` does not advance the main timeline.

---

## 14d. Mystery Figure vs Professor (post-v16)

After wild catching arrived, the old "team is full → Mystery Figure swap"
branch turned the Professor's lab visits into Mystery encounters too
often, blurring two distinct mechanics. The split is now:

- **Professor** — every city's curated lab visit. Always the Professor
  flow (button label "Professor — Lab Companion"). When the player's
  active party is at the badge-based cap, the Professor still gives a
  gift, but framed as a "swap with a party member" (the displaced mon
  goes to PC). No Mystery Figure branding in this path.
- **Mystery Figure** — reserved for actual story-mystery events:
  - **City 8 post-Gym 8 legendary gate** (`isPreLeagueLegendaryMysteryGate`)
    — required swap-in legendary before Victory Road.
  - **Post-HoF Mystery Figure battle** (row 67 in `STORY_EVENTS_RAW`)
    — final masked challenger, repurposed for the Caged God arc.
  - **Crucible Mystery encore** — post-game replay button.

The shared backend (`enterProfessor`, `_profMysteryMode`,
`_profLegendaryMysteryMode`) still drives both flows so we don't
fork the screen rendering, but the *labels and copy* now keep them
mentally distinct.

---

## 14c. City specialties (M-balance)

Each city in `STORY_EVENTS_RAW` now has a one-line specialty banner in the city
hub (rendered above the NPC quote) so the player can tell at a glance *why this
city is on the route*. The banners are content-only, sourced from
`CITY_SPECIALTY_BLURBS` and surfaced via `_cityBlurbFor(cityIdx)` in
`renderCityActions`. They mirror each city's facility loadout:

| City | Identity |
|---|---|
| 0 — Pallet | Hometown — starter, Link, every basic tutor. |
| 1 — Gym 1 | Training town — Battle Dojo + EV Trainer. |
| 2 — Gym 2 | Move-craft town — Move Tutor + Battle Dojo. |
| 3 — Gym 3 | Academy town — Move Tutor + Nature Rater. |
| 4 — Gym 4 | **Wilderness town — Safari Zone gate.** |
| 5 — Gym 5 | **Resort town — Poké Casino + tutors.** |
| 6 — Gym 6 | Metropolis — first Department Store + first Colress. |
| 7 — Gym 7 | Champion's road — every tutor and Pokémart still in stock. |
| 8 — Gym 8 | Final-gym town — Pokémart + Department Store + Battle Dojo + EV Trainer for last polish. |
| 9 — League | Pokémon League — every facility under one roof (Pokémart + Department Store), so a player who entered the league low on PokéBalls is never stranded. |

City 4 and City 5 are the "one-time mid-game events": Safari Zone and Poké Casino
respectively. Both remain accessible post-HoF via the Crucible (§14b), but the
main timeline restricts them to a single city each so they feel like a
destination rather than a ubiquitous facility.

City 8 gained Battle Dojo + EV Trainer in this pass — the player cannot
backtrack, so without these the only late-game item/ability/EV polish was at
City 6 or City 7 (or City 9 post-HoF). The League run between Gym 8 and the
Elite Four was previously a dead-zone for team optimization.

---

## 14e. Internal action-key conventions (no diacritic)

Hub action arrays in `STORY_EVENTS_RAW` use the ASCII keys `'Pokemart'`,
`'Pokemon League'`, etc. (no diacritic). These are *internal* lookup keys
matched by `renderCityActions` to the visible button labels, which DO carry
the diacritic. Do not "fix" the ASCII forms; they keep code paths matching
trainer-class sprite IDs (e.g. `Pokemon Breeder` sprites) and old-save
backwards-compat alongside the user-facing "Pokémart" / "Pokémon League"
copy emitted by the renderer.

---

## 15. Open items (not blocking M0)

Things that need decisions before later milestones but don't block schema work:

- **Safari city placement** — currently City 4 only; revisit if playtesting shows the single-city window is too tight.
- **Ultra Ball drop events** — which two static beats. Placeholder: post-Gym 4 trainer, post-E2 broker.
- **Sub-Legendary vs. Restricted Legendary balance for the boss arc pool** — exact filter rule to keep the random selection feeling appropriate.
- **First-clear vs. NG+ behavior of the boss arc** — does the legendary re-roll on NG+ or stay fixed?
- **Underground sale price scaling per save day** — flat per-grade vs. mild diminishing returns to discourage farm loops.

---

## 15b. IV training via vitamins + Pokémon Fan Club (v19+)

Pre-v19 every Pokémon resolved as 31 IVs and vitamins stacked a separate
`permBoosts` flat-stat layer (+1 per use, cap +10 per stat). v19 collapsed
both into a single layer: **vitamins train IVs directly**, +3 per use, cap
31. Random IV rolls are now visible identity for the player's mons and
tier-scaled identity for enemy trainers.

### Player IV rolls

Every player-side Pokémon — starter, professor gift, wild catch, Crucible
mystery offer — calls `_rollRandomIVs()` to populate `build.ivs` with six
independent 0-31 rolls. Hook points:

- `makeWildBuild` (`battle.html:34883` area) — wild catches and the
  starter partner.
- Professor pick loop in `enterProfessor` — calls `_ensureBuildIVs` after
  `makeBuild` for each rolled choice.
- Subject Zero (boss-arc catch) — overrides to perfect `{31,31,31,31,31,31}`
  before commit, since the lore is "synthetic apex specimen".

`_ensureBuildIVs(build, ivs)` only sets the IV map if no explicit spread
is present, so Smogon imports that ship intentional 0-stat IVs (Trick
Room sweepers, Foul Play offload sets) are preserved.

### Enemy IV rolls (tier-scaled)

`_applyStoryBuildPowerTier(team, eventType, storyRowIdx, sigNames)` now
takes an extra `sigNames` Set and stamps `build.ivs` per slot:

| Tier | Range | Ace bonus |
|---|---|---|
| T1 Untrained | 0-15 | top quartile (~12-15) |
| T2 Novice | 10-22 | top quartile (~19-22) |
| T3 Competent | 18-28 | top quartile (~26-28) |
| T4 Tournament | 26-31 | top quartile (~30-31) |

`STORY_IV_TIER_RANGES` lives next to `_rollTieredIVs`. `rollTrainerTeam`
passes `_origSigs` through as the 4th arg so identity mons get the boost.
The Mystery Figure boss caller passes nothing — every slot rolls
uniformly within T4.

### Vitamins (`PERM_BOOST_ITEMS`)

Six items, drop-only, never sold. Each application calls
`applyPermBoost(vitaminId, source, idx)` which:

1. Reads the mon's current `ivs[stat]` (default 31 if missing).
2. If at 31, no-ops (picker dims the row).
3. Else sets `ivs[stat] = min(31, cur + 3)`, decrements inventory, saves.
4. If more vitamins of that type remain, re-opens the picker; else
   returns to the City Bag.

Constants (`battle.html:26648` area):
- `IV_VITAMIN_STEP` (= 3) — per-application IV gain
- `IV_MAX` (= 31) — natural cap
- `PERM_BOOST_CAP` — legacy alias kept at 31 for older callers
- `PERM_BOOST_ITEMS` — `[{ id, name, stat, desc }, ...]`

`_permBoostsRead` / `window._permBoostsRead` retained as zero-returning
stubs so any older call site that hadn't been audited yet adds nothing
to the stat formula.

### Pokémon Fan Club facility

Recurring action available in every city. Auto-inserted into each
`STORY_EVENTS_RAW` City row's actions array at module init via
`_seedFanClubAcrossCities()` — no per-row edits needed.

* **City button** (`window.StoryMode.enterFanClub`) — green-soft badge
  showing "Gift" on first visit, "Free" thereafter. Sits in the training
  column next to EV Trainer / Move Tutor.
* **Screen** (`#screen-story-fanclub`) — Gentleman portrait, roster of
  party cards. Each card shows sprite + name + nature + EV total + six
  per-stat IV rows with colored progress bars and a `+3 (×N)` apply
  button. Bag stash (live vitamin counts per stat) lives in the header.
* **First-visit gift** — `sm.fanClubGiftClaimed` flag, single source of
  truth across cities. On first enter, +1 of each vitamin is added to
  inventory; tutorial scene `firstFanClub` plays with the Chairman line
  about IVs.
* **Color tiers** on the IV bars: red <10, amber 10-20, green 21-30,
  gold 31.

### Save migration (v18 → v19)

`migrateStoryPreV19()` runs once at load if `sm.version < 19`:

1. Grandfathers every mon's IVs: missing → `{31×6}`; partial → fills
   missing keys to 31, leaves existing values alone.
2. Refunds any leftover `permBoosts[stat]` as vitamins in
   `sm.inventory` (1 permBoost point → 1 vitamin of matching stat).
3. Deletes `build.permBoosts`. Combat power preserved; vitamin budget
   refreshed for re-spending on freshly-caught wilds.

### Carry-through

| Action | Carry IVs? |
|---|---|
| Stone Sage evolution | yes — `evoBuild.ivs = { ...old.ivs }` |
| Cable Link Rebuild | yes — snapshot + restore |
| Cable Link Reroll / Upgrade | no — new species, fresh roll |
| PC deposit / withdraw | yes — lives on the build, not the slot |
| Underground sale | irrelevant — mon is gone |

---

## 15c. Crucible Hard Mode (v18+)

Single boolean `sm.crucibleHardMode`, toggled by a checkbox at the top
of the Crucible Battles grid (`_renderCrucible`). Applies +30% foe
HP / bulk / speed plus a gimmick-frequency bump on every
Crucible-sourced battle: Mystery Figure, Rival Rematch, League Run,
Random Gym Rematch, Battle Frontier, and the Crucible Wild Encounter.

| Layer | Where | Multiplier |
|---|---|---|
| Per-event boss boost | `applyStoryLeagueFoeStatBoost` — fires for E1-4 / Champion / Mystery / league Rival | 1.22-1.50 HP |
| Hard Mode | `crucibleApplyHardModeToFoes` — fires after the boss boost in `startBattle` | × 1.30 HP/bulk/speed |
| Difficulty mode | `applyFoeDifficultyScaling` — applies last | × 0.70-1.30 |

Champion rematch HP on Hard Mode + hard difficulty:
`base × 1.40 × 1.30 × 1.15 = base × 2.09`.

Random Gym Rematch falls outside the boss-boost filter, so the dedicated
`crucibleApplyHardModeToFoes` (window-scoped) applies the +30% directly.
Guarded by `mon._crucibleHardApplied` so re-entry can't double-stack.

Gimmick frequency bumps are baked into `_perMonMechChance`:
- Frontier band base + 0.15 absolute when Hard
- All other Crucible rematches + 0.20 absolute

---

## 15d. Cable Link build tier (v18+)

Pre-overhaul, Cable Link Reroll / Upgrade / Rebuild all called
`makeBuild(name)` directly, producing Tournament-tier (T4) builds at
every action regardless of which one the player paid for. The trainer
build pipeline runs `_applyStoryBuildPowerTier` to downgrade builds per
event tier, so player Cable Link teams were structurally stronger than
any same-grade foe team.

Post-overhaul, the new `_makePlayerLinkBuild(name, tierTag)` helper
applies tier-appropriate downgrade:

| Action | Tier | EV cap | Notes |
|---|---|---|---|
| Reroll (cheap, same grade) | COMPETENT (T3) | 420 / 510 | Tutor / Dojo / EV Trainer still add polish |
| Upgrade (premium, one grade up) | TOURNAMENT (T4) | 510 | Full polish included — the priciest option |
| Rebuild (same species, new build) | COMPETENT (T3) | 420 / 510 | Carries perm-boost vitamins through the rebuild |

The shared helper preserves the existing player gimmick gating
(`_pbsStoryUsePlayerGimmickGate`) — Cable Link only rolls gimmicks the
player has unlocked via gym victories.

---

## 15e. Frontier & boss curve retune (v18+)

| Curve | Old | New |
|---|---|---|
| E1-E4 HP boost | 1.20 | 1.22 |
| Champion / league Rival HP | 1.30 | 1.40 |
| Mystery Figure HP | 1.35 | 1.50 |
| Frontier HP per round | 1.35 + 0.05/r (cap 2.50) | 1.50 + 0.075/r (cap 3.00) |
| Frontier bulk/speed per round | 1.20 + 0.03/r (cap 1.80) | 1.25 + 0.045/r (cap 2.00) |
| Mech frequency per round band | flat per event-type | round-tiered: 25% / 45% / 70% / 90% / 100% |

A Frontier round-1 fight is now slightly *harder* than the post-HoF
Mystery climax used to be. Round 10 caps the Frontier curve near a
Caged-God-tier wall — the player is expected to be carrying
perm-boost vitamins and Cable Link Upgrades into the late ladder.

---

## 15f. Grade-to-Gym progression overhaul (v18+)

A controlled-pacing rewrite of the gym power curve, anti-bricking, NPC
placement, and end-game build mechanics. The goal: a clear "real Pokémon
progression vibe" with four explicit stages, each with its own grade
era and unlock set. Veterans can still rush early game; new players get
a Fire-Red-baseline ramp through Stage 2.

### Four explicit stages

| Stage | Era | Gyms | gradeWeights (filler) | Sig pool | Foe stat mult | Player gear unlocks |
|---|---|---|---|---|---|---|
| **1 — G4 Era** | Foundation | Pre-G1 → G2 | G4-dominant (`{g3:25, g4:75}` GL1, `{g3:50, g4:50}` GL2) | G3 ace | 1.00 | Starter (G4 basic), Move Tutor, Evo Sage (cheap), Nature Rater |
| **2 — G3 Era** | Transition + Core | G3 → G5 | G3-dominant (`{g3:75, g4:25}` GL3, `{g3:100}` GL4-5) | G3 | 1.00 | + EV Trainer @ City 4, Battle Dojo @ City 4 |
| **3 — G2 Era** | Optimization | G6 → G8 | G3 filler with G2 sig (GL6) → 50/50 G2/G3 (GL7) → pure G2 (GL8) | G2 (GL6-7), **G1 ace exception** at GL8 | 1.05 (G6), 1.10 (G8) | + Department Store, Colress |
| **4 — G1 Era** | Endgame | E4 → Mystery | G1/G2 mix (E1 30/70 → E4 70/30), Champion 80/20, Mystery 100/0 | G1 | 1.15 (E4), 1.20 (Champion+) | + Crucible / Frontier |

Sigs are *composition-locked*: `rollTrainerTeam`'s signature roll picks
from the gym leader's curated `sigs` list at the canonical grade,
filler grades drop one tier via `gwForFiller`. So GL6 reads as
"G3 team with a G2 ace" without an ad-hoc weight override.

### Starter and Professor gifts — "match the era"

- Starter (City 0) is rolled from `PROF_ROLLS[0] = {g4:100}` — G4
  basics only. Player gets a Bulbasaur, not an Ivysaur; investing in
  Evolution Sage and EV/Move Tutors is the *only* path to G3+ on the
  starter line.
- Per-city Professor gifts (`PROF_ROLLS`) now match the contemporary
  era exactly (no longer one tier above). The match-era table:
  City 0–1 pure G4; City 2 transition (30/70 G3/G4); Cities 3–5 pure
  G3; City 6 transition (30/70 G2/G3); Cities 7–8 climbing G2; City 9
  legendary pool.
- `_storyBuildTierForProfessor` matches the gym tier curve (UNTRAINED
  pre-G2, NOVICE in G3 era, COMPETENT in G2 era, TOURNAMENT in G1
  era).

### Wild route encounters — strict G3 cap

- `_WILD_GRADE_CURVE_BY_BADGES` rewritten: G1/G2 are forbidden in
  wilds except for a 5% G2 leak from badge 6 onward. Safari Zone is
  the *only* path to mid- and high-tier catches.
- Multi-wild routes use `STORY_WILDS_PER_ROUTE_NODE` (= 2, see §3)
  + the `wildSeenByEventIdx` counter + the `chainAfter: true` flag
  on the `wildRoute` interrupt. After each catch screen resolves,
  `_runFirstStoryInterrupt` re-enters `enterBattleEvent` to let the
  chain re-evaluate; the predicate ends the loop when the counter
  hits the constant. (Original brief asked for "2–3"; playtest
  settled at 2 — one wild felt thin, three+ dragged route pacing.
  Tunable via the constant.)
- Player can Run from any individual encounter; the next wild on
  the route still fires, then the trainer battle starts.

### Anti-bricking — softening extends through Gym 3

| Phase | Multiplier |
|---|---|
| Pre-Gym 1 non-GL | 0.82× (`PRE_GYM1_FOE_STAT_MULT`) |
| GL1 / GL2 | 0.95× (`EARLY_GL_FOE_STAT_MULT`) |
| Routes badges 1–2 (non-GL) | 0.92× (`EARLY_GAME_FOE_STAT_MULT`) |
| **GL3 (Stage 2 entry)** | **0.97× (`STAGE2_GL_FOE_STAT_MULT`)** |
| ≥ Gym 4 (Stage 2 core) | 1.00× (softening ends) |

The G4 strip in `storyStripGrade4IfPartyMature` is now gated on
`badges < 2` (was `< 1`) so Stage 1 properly extends through Gym 2
without G4 mass getting silently lifted into G3.

### Stage-gated late-game foe stat mult

`_stageGatedFoeStatMult` is a second multiplier layered into
`applyFoeDifficultyScaling`. The brief asks for "regular Fire Red
difficulty through the Stage 2 unlock" and "slightly harder than Fire
Red" from Stage 3 onward. Curve:

- Stages 1–2 (badges 0–4 / GLs 1–5) → 1.00 (true FR feel)
- Stage 3 entry (G6, badge 5) → 1.05
- Gym 8 / late Stage 3 → 1.10
- E1–E4 → 1.15
- Champion / Mystery Figure → 1.20

Crucible / Frontier opt out (`atCrucible`, `sm.frontier.active`) so
their own stat-boost stacks don't double-dip.

### NPC placement changes

| NPC | Was | Now |
|---|---|---|
| Professor | All cities, era + 1 tier | All cities, **match era exactly** |
| Starter pool | G3-leaning | **G4 basics only** |
| Move Tutor | All cities, full pool | unchanged |
| Nature Rater | All cities | unchanged |
| Evolution Sage | All cities | unchanged |
| **EV Trainer** | City 1 | **City 4 first** (paired with Stage 2 entry) |
| **Battle Dojo** | Cities 1–3 + 6–8 | **City 4 first** (paired with Stage 2 entry) |
| PokéMart / Dept Store | unchanged | unchanged |
| Safari Zone | City 4 only | unchanged |

EV Trainer + Battle Dojo cluster at City 4 so the player crossing into
Stage 2 has a single "now you're optimizing" hub. Earlier cities
intentionally have *no* held-item or EV-shaping facility — the team
fights with what the Professor gave them and what wilds they caught.

### Enemy build tier — stage-aligned

`_storyBuildTierForEvent` now mirrors the gym index directly:

| Stage / Gym | Basic Trainer | Gym Trainer | Gym Leader |
|---|---|---|---|
| Stage 1 (Pre-G1, G1, G2) | T1 | T1 | T1 (ace T2 via composition) |
| Stage 2 (G3, G4, G5) | T2 | T2 | T2 (ace T3 via composition) |
| Stage 3 (G6, G7, G8) | T3 | T3 | T3/T4 (T4 ace at GL8) |
| Stage 4 (E4 → Mystery) | T3/T4 | T4 | T4 |

Builds in the same fight share a tier — the *signature ace* gets its
power-up through grade composition, not via a per-mon tier hack.

### Illegal Smogon builds — auto-detected, end-game injection

Background: the Smogon builds CSV (`data/builds.csv`) silently mixes
in presets from fan-made side modes ("Almost Any Ability", "all
abilities free") — Pokémon with abilities they can't legally have
(Aerodactyl with Tough Claws, Altaria with Pixilate, Aegislash with
Prankster, etc.). These presets are inherently stronger.

- **Detection** (`_isBuildAbilityIllegal`): cross-reference each
  build's `ability` field against `baseStats[name].abilities` at CSV
  load time. Builds with abilities outside the species' canonical
  list are tagged `build._illegal = true`. Detection runs in both
  `loadBuildsCSV` and the `populateCsvBuildsFromAPI` fallback.
- **Default pool behavior**: `makeBuild` filters illegal builds out
  of all pools by default. Pre-E4 fights see only legal presets.
- **End-game injection** (`_storyInjectIllegalBuilds`): after a
  trainer team is rolled, non-signature slots are re-rolled with
  `{ allowIllegal: true, forceIllegal: true }` until the event's
  illegal count is met. Signature aces are protected — a leader's
  identity mon never morphs into an illegal preset.

Distribution (`_storyIllegalCountForEvent`):

| Event | Illegal slots |
|---|---|
| E1–E4 trainers | 1 |
| Champion | 2 |
| League Rival (post-G8) | 2 |
| Mystery Figure | 3 |
| Frontier rounds 2-3 | 1 |
| Frontier rounds 4-6 | 2 |
| Frontier rounds 7+ | 3 |

A species that has no illegal preset in its pool falls back to a
legal build (the injection silently no-ops for that slot). The
fallback is rare in practice — the CSV carries illegal presets for
most species that surface in late-game rolls.

### Rollout

Fresh runs only — no schema migration. The new gradeWeights /
PROF_ROLLS / wild curve / build tier are static tables, so existing
saves automatically pick up the new tuning on their next battle.
`SAVE_VER` is **not** bumped.

---

## 15g. Signature grade ceiling + gym leader union pool (v19)

A balance + replayability pass tightening the foe-roll pipeline. Two
concrete bugs motivated it:

- **Aerodactyl on Gym Trainer 1.** `rollTrainerTeam`'s sig pool was
  filtered only by enabled gen, not by the row's `gradeWeights`. So
  `Sky-Steel Ranger` (a `tag:'multitype'` Basic Trainer with sigs
  `['Skarmory','Corviknight','Empoleon','Aerodactyl','Doduo']` — four
  G2s + one G4) could land as Gym Trainer 1 against any Flying or
  Steel GL1, rolling Aerodactyl at sigP 0.65 even though the row's
  weights were `{g3:10, g4:90}`. Same risk surface for every
  multitype / villain / cursed / eldritch Basic Trainer.
- **Legendaries on pre-G7 Elite Trainers.** Veteran trainers
  (`Veteran Lt. Surge` with `Zapdos`, `Brandon` with
  `Articuno/Moltres/Zapdos`) rolled with the full sig pool at every
  Elite Trainer slot from row 34 (post-GL5) onward.

### Strict signature grade-cap

`_storyMaxSigGradeForGw(gwIn)` returns the lowest grade number (=
strongest tier) with non-zero weight in the row's `gradeWeights`
(after difficulty + progress + G4-strip transforms). So GL1
`{g3:25, g4:75}` → ceiling `G3`; GL8 `{g2:100}` → ceiling `G2`;
Champion `{g1:80, g2:20}` → ceiling `G1`.

`_filterSigsByGradeCeiling(sigs, ceiling)` drops every sig whose
grade is below the ceiling. Hooked into `rollTrainerTeam` right
after the existing gen filter:

```js
const _exemptFromSigCap = (_isEldritch
    || _evtStr === 'Mystery Figure'
    || _evtStr === 'Champion'
    || /^E[1-4]$/.test(_evtStr)
    || _evtStr === 'Rival');
if (!_exemptFromSigCap) {
    const _ceiling = _storyMaxSigGradeForGw(gwIn);
    S = _filterSigsByGradeCeiling(S, _ceiling);
    if (/^Gym Leader\s*\d$/.test(_evtStr)) {
        S = _topUpGymLeaderSigsForCeiling(trainer, S, _ceiling, genSet);
    }
}
```

Boss events (`Rival` / `E1-E4` / `Champion` / `Mystery Figure`) and
`tag:'eldritch'` trainers stay exempt — their gradeWeights already
authorize the top tiers, and Eldritch trainers are designed to
ambush the player with out-of-this-world species.

### Gym Leader union pool

`selectTrainerForRole` now accepts any `Gym Leader N` row for any
`Gym Leader X` slot:

```js
const isGymLeaderSlot = /^gym leader\s*\d$/.test(rk);
// …
if (isGymLeaderSlot) return /^gym leader\s*\d$/.test(tr);
```

`assignTrainers` Pass 1 still uses `usedBaseNames` to keep each
leader unique per run, so the pool is "8 of the 64 possible
leaders, one per slot." Misty (canonical GL2) can roll as GL1, GL5,
or GL8 across different runs. The build-tier and sig-rate
calculations key off the **event type** (`Gym Leader 5`), not the
trainer's canonical role, so all existing curves still apply
without modification.

`findTrainerDataByName` already falls through to a name-only match
when the exact role lookup misses, so a Misty assigned to a GL5
slot resolves correctly at battle time.

### Top-up for emptied sig pools

When a leader's grade-capped sig pool falls below 3 entries
(`_GL_SIG_TOPUP_MIN`), `_topUpGymLeaderSigsForCeiling` fills it
from a type-matched global pool at the row's ceiling grade. So
Misty-as-GL8 (G2 ceiling) keeps Lapras (her only G2 sig) and gains
type-matched G2 partners — reads as "veteran Misty with a stronger
Water roster" rather than "Lapras + 5 generic filler."

Blaine-as-GL3 (G3 ceiling) drops his entire sig pool
(`Arcanine/Rapidash/Magmar/Ninetales/Magmortar` are all G2/G1) but
gains type-matched G3 Fire from the top-up — Growlithe / Monferno
/ Charmeleon / Vulpix — so the leader still reads as Fire-flavored
even when none of his canonical sigs survive.

### Tag-gate for Basic Trainer slot assignment

`selectTrainerForRole` for `isBasicLike` now excludes
`tag:'multitype'`, `tag:'villain'`, `tag:'cursed'`, and
`tag:'eldritch'` trainers from normal type-matched slots:

```js
if (isBasicLike) {
    if (tr !== 'basic trainer') return false;
    if (t.tag === 'multitype' || t.tag === 'villain' ||
        t.tag === 'cursed' || t.tag === 'eldritch') return false;
    return true;
}
```

Themed slots (rows 7/14/20/26/33/34/41/42/48/49/56/58) go through
`_pickThemedTrainerForRole`, which still accepts tagged trainers
by design. So the flavor beats are preserved while route Hikers
and Gym Trainer 1/2s stop pulling from the high-sig flavor pool.

### Safari Zone — badge-keyed grade curve

Replaced static `SAFARI_GRADE_WEIGHTS = {g1:3, g2:22, g3:50, g4:25}`
with `_SAFARI_GRADE_CURVE_BY_BADGES`:

| Badges | g1 | g2 | g3 | g4 |
|---|---|---|---|---|
| 3 (first unlock at City 4) | 0 | 5 | 60 | 35 |
| 4 | 0 | 15 | 60 | 25 |
| 5 | 0 | 25 | 60 | 15 |
| 6 | 1 | 35 | 54 | 10 |
| 7 | 2 | 45 | 45 | 8 |
| 8+ (post-game / Crucible) | 5 | 50 | 40 | 5 |

Safari is the "Stage 2/3 G2-catch path" first, with a small G1
chance only from Gym 6 onward. Players who unlock Safari at
City 4 no longer have a 17%-per-session chance at Zapdos.

### Wild route G2 leak ramp

`_WILD_GRADE_CURVE_BY_BADGES` G2 entries replaced flat 5% with a
ramp:

| Badges | g2 | g3 |
|---|---|---|
| 6 | 3 | 97 |
| 7 | 5 | 95 |
| 8 | 8 | 92 |

Gives the player a clearer "wilds get slightly better as you go"
beat without undermining Safari's identity as the primary G2/G1
path.

### Audit flag

`?balanceAudit=1[&auditTrials=N]` walks `STORY_EVENTS_RAW`, rolls
each row's trainer team (N times, default 1), and dumps a console
table with: trainer name, badges-before, gradeWeights, sig
ceiling, raw vs capped sig pool, and sample team rolls. Flags any
non-exempt row where a sig survived the cap above its ceiling.
Also reachable from DevTools via
`window.StoryMode.debugBalanceAudit({trials:N, gens:[…], difficulty:'…'})`.

### Rollout

Fresh runs and live runs both pick up the new tuning at the next
battle — all changes are to static tables and roll-time helpers,
no `SAVE_VER` bump, no migration. `sm.trainerAssignments` is
re-evaluated lazily as the player advances, so an in-flight run
gets new leader picks for unvisited slots.

---

## 16. References

- `docs/STORY_MODE_AUDIT.md` — full 6-agent audit of current story mode (~400 lines)
- `docs/STORY_MODE_DESIGN_DECISIONS.md` — prior 22-decision table; this spec overrides where §14 lists conflicts
- `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md` — risk analysis of catch/PC integration; strategy A is the chosen wild-encounter approach
- `docs/STORY_FEATURES_INTEGRATION.md` — earlier high-level mechanic outlines; this spec is the canonical replacement
- `README.md` — top-level project README; references this file

---

## 17. Event registry & storyline architecture (v17)

Story mode is built around `STORY_EVENTS_RAW` — a flat array of timeline rows
(Cities, Battles, Hall of Fame). The dispatcher `processNextEvent` reads
`sm.eventIndex`, branches on the row's type, and hands off to `enterCity`,
`enterBattleEvent`, or `showHallOfFame`.

To keep each beat editable in isolation — and to let later passes deepen
specific battles without touching the dispatcher — v17 introduces a
**declarative event registry** layered on top of `STORY_EVENTS_RAW`.

### Registries (battle.html, all just above `// ── MAIN EVENT LOOP ───`)

| Registry | Type | Purpose |
|---|---|---|
| `STORY_BEATS` | `{ rowId → beat }` | Per-row metadata: `kind`, `gymNumber`, `eliteNumber`, `tags`, optional `coldOpen`. Rows not listed fall back to `_deriveDefaultBeat(ev)`. |
| `STORY_COLD_OPENS` | `{ tag → scene }` | One-shot pre-battle scenes. Each scene declares a `metaKey` and a `run(ev, onDone)` overlay. Cross-run-deduped via `pbs_story_meta.tipsShown[metaKey]`. |
| `STORY_BATTLE_INTERRUPTS` | `Array<interrupt>` | Pre-battle catch screens (catch tutorial, roaming legendary, wild route). Each entry has `prepare(battleIdx, ev) → { encounter, options, markWildSeenOnPrepare } \| null`. First non-null wins. |
| `STORYLINE_VARIANTS` | `{ id → variant }` | Storyline picks. Each variant can override any beat (`beatOverrides[rowId] = { …partial… }`) and set a `defaultTone`. The active variant is `sm.storyLine` (default `'classic'`). |

### Bus helpers

- `getStoryBeatForRow(rowId, ev?)` — returns the merged beat:
  `_deriveDefaultBeat(ev) ← STORY_BEATS[rowId] ← variant.beatOverrides[rowId]`.
  Stamps `_variantId` on the result so downstream code can branch on variant.
- `_runStoryColdOpen(beat, ev, onPlayed)` — fires the beat's cold-open if it
  hasn't played this save; stamps the meta key on dismiss; returns `true` when
  the scene actually played. Otherwise returns `false` and does **not** invoke
  `onPlayed`.
- `_runFirstStoryInterrupt(battleIdx, ev, onComplete)` — walks
  `STORY_BATTLE_INTERRUPTS`; the first interrupt whose `prepare` returns a
  non-null encounter opens the catch screen and short-circuits. Returns
  `true` when an interrupt fired.

### Dispatcher (refactored `enterBattleEvent`)

```js
function enterBattleEvent(ev, _wildAlreadyChecked, _coldOpenChecked) {
    const _beat = getStoryBeatForRow(ev[0] | 0, ev);

    if (!_coldOpenChecked) {
        const fired = _runStoryColdOpen(_beat, ev,
            () => enterBattleEvent(ev, _wildAlreadyChecked, true));
        if (fired) return;
    }
    if (!_wildAlreadyChecked) {
        const fired = _runFirstStoryInterrupt(sm.eventIndex, ev,
            () => enterBattleEvent(ev, true));
        if (fired) return;
    }
    // …trainer/team setup unchanged…
}
```

### Adding new content (the common cases)

| You want to… | Where to edit |
|---|---|
| Give a specific row a one-shot cold-open scene | `STORY_COLD_OPENS` (new entry) + `STORY_BEATS[rowId].coldOpen = '<key>'` |
| Insert a new pre-battle catch screen (e.g. seasonal event) | Append one entry to `STORY_BATTLE_INTERRUPTS` |
| Add a storyline variant | Add an entry to `STORYLINE_VARIANTS` with `beatOverrides` for the rows it retunes; surface it in the run-setup UI later (the registry already supports it) |
| Tag a row for downstream lookup (e.g. dialogue branching) | `STORY_BEATS[rowId].tags = [...]` |
| Deepen a single gym leader's victory speech | Edit `LEADER_VICTORY_LINES` (existing table). The bus does not own prose. |

### What stays in the existing content tables

The registry intentionally does **not** absorb dialogue prose. Trainer
quotes (`TRAINER_QUOTES`, `TRAINER_QUOTES_BY_NAME`, `RIVAL_PROGRESS_PRIMARY_QUOTES`),
victory lines (`LEADER_VICTORY_LINES`, `ELITE_VICTORY_LINES`,
`CHAMPION_VICTORY_LINES`), city flavor (`CITY_SPECIALTY_BLURBS`,
`CITY_GUIDE_QUOTES`, `CITY_PROFESSOR_QUOTES`), and victory bundles
(`GYM_VICTORY_REWARDS`) remain the source of truth for content. The
registry only controls **which** beat is firing and **which** orchestration
hooks (cold-open, interrupts, variant overrides) apply.

### Storyline variants — Pokémon adapt to the ruleset

A variant changes narrative framing — beat tags, cold-opens, optional
prose hooks (later milestone) — but never bypasses the existing rollers.
Trainer team rolls go through `rollTrainerTeam(trainer, partySize,
gradeWeights, sm.settings.enabledGens, event, idx)`; wild encounters go
through `rollWildEncounter(ev[3], storySettingsGens())`. Both consume
`sm.settings.enabledGens` and the row's `gradeWeights` directly, so a
variant can re-skin the rival without breaking the curve: Pokémon adapt
to whatever generations and grade thresholds the run was started with.

This is the **adapt-to-ruleset** contract: static narrative beats + flexible
species rolls. The variant decides the words on screen; the rollers decide
the Pokémon, always within the player's enabled gens and the row's grade
weights.

### Save schema

- `sm.storyLine: string` (default `'classic'`) — added in v17. Locked for the
  duration of the run; chosen at run start by `_readStorylineFromUI()`.
- `migrateStoryPreV17` — sets `sm.storyLine = 'classic'` on v16 saves so the
  bus always has a valid variant to read.
- `SAVE_VER` bumped 16 → 17.

### Public inspection surface

```js
window.StoryMode.getStoryBeat(rowId);        // merged beat for that row
window.StoryMode.getActiveStoryline();       // current variant object
window.StoryMode.listStorylines();           // available variant ids
```

Read-only — handy in DevTools when adding new beats / variants.

### Anchors in `battle.html`

- `STORY_BEATS` / `STORY_COLD_OPENS` / `STORYLINE_VARIANTS` — top of the
  "STORY MODE — EVENT REGISTRY" section, just above `// ── MAIN EVENT LOOP ───`.
- `STORY_BATTLE_INTERRUPTS` / `_runFirstStoryInterrupt` / `_runStoryColdOpen`
  — same section, immediately after the variant helpers.
- `enterBattleEvent` (~line 27509) — three-line dispatch now: resolve beat
  → dispatch cold-open → dispatch interrupts → run the trainer fight setup
  (unchanged).

---

## §15g — Evolution gating & onboarding (2026-05-22)

See [`docs/EVOLUTION_FLOW_REBUILD.md`](docs/EVOLUTION_FLOW_REBUILD.md) for
the full design. Quick reference:

- **City 0–1**: no Cable Link, no Stone Sage. Stone evolutions and trade
  evolutions are simply not on the menu yet.
- **City 2 entry** plays a chained intro: Bill (Cable Link, grants
  `linkDiscount50` voucher) → Stonewise Granny (Stone Sage, grants
  `stoneToken` voucher).
- **Stone Emporium** (new facility) appears in the action list of every
  city from City 2 onwards. Sells 10 stones + 14 trade items at 500G
  each with a confirm-on-buy dialog. `stoneToken` redeems for one free
  stone of choice.
- **Stone Sage** now consumes a stone from `sm.inventory.<id>` on
  stone-evolutions and an item from `sm.inventory.<id>` on held-item
  trade evos. Trade-evos additionally require
  `_isFacilitySeen(cityIdx, 'link')` to be true in the current city
  (enter + exit Cable Link is enough).
- **Facility intro gate**: `sm.facilityIntros[key]` flips true the first
  time the player enters any facility in a run. On the
  `FACILITY_DEBUT_CITY[key]` city, the Leave-City button stays disabled
  with a friendly "Visit X first" hint and the facility shows a red
  pulsing **🔴 Required** badge until the player has tapped it once.
- **Per-facility welcome vouchers**: each existing first-visit tutorial
  grants a one-shot themed reward on Continue (Poké Ball at Mart,
  Potion at Center, Heart Scale at Move Tutor, etc.) — sized to one
  free use of that facility.
- Anchors: `STONE_SHOP_ITEMS` near `DEPT_ITEMS`; `STONE_NAME_TO_ID` +
  `TRADE_ITEM_NAME_TO_ID` near `EVO_STONE_REQ`; `FACILITY_DEBUT_CITY`
  right after `STORY_EVENTS_RAW`; `_isFacilityRequiredHere` /
  `_pendingFacilityIntrosHere` next to `_markFacilitySeen`; Bill /
  Granny / Emporium Keeper scenes in `STORY_TUTORIAL_SCENES`;
  half-price voucher UI in the link card render block.
