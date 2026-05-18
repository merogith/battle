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
| Ball sources | PokéMart sells PokéBalls (every city). Department Store sells Great Balls (existing City6/City8). Ultra Ball ×2 are static story rewards. Master Ball ×1 from the boss arc. |
| Caught state | Full HP / full PP / no status. |
| HP between battles | **Full-heal between every battle.** Attrition is removed; mart consumables matter only within a single battle. |
| Difficulty modes | Keep `veryeasy / easy / normal / hard / challenge`. **Remove `hardcore`.** |
| PC | Pure storage. Flat array, **cap 10** (story is battle-focused, not a collection layer). Catch fails with an explicit message when party 6/6 and PC 10/10 — player must sell or release first. Stable `id` per mon. |
| Underground | Built into every Pokémon Center hub button. Always visible. Sells your mons for gold (price scales with grade). Cannot sell your last party mon, the starter, or the boss-arc capture. |
| Pokémon Center button | New city hub action. Contains PC + Underground. No heal function (battles auto-heal). |
| Foe sizing | **Badge curve**: `min(6, 2 + badges)` for everyone except story finales (always 6) and the intro rival (pure player-match for a 1v1 starter duel). So foes = 2 pre-Gym-1, 3 post-Gym-1, …, 6 from post-Gym-4 on. |
| Player party cap | **Same badge curve**: `min(6, 2 + badges)`. Catch tutorial fills slot 2 right after intro rival (cap = 2). Each gym victory unlocks one more slot up to 6 at four badges. Catches and Professor gifts above the cap overflow to PC — the player can always *catch*, they just can't *field* past the cap until the next badge unlocks. |
| Expected sequence (non-catcher) | Intro rival 1v1 → catch tutorial → cap 2 (2v2) → GL1 2v2 → **(badge 1, cap 3)** → leave the post-gym hub → route wild → arrive at next city → Pro available → GL2 3v3 → **(badge 2, cap 4)** → next route wild → next city's Pro → GL3 4v4 → **(badge 3, cap 5)** → GL4 5v5 → **(badge 4, cap 6)** → GL5+ / E4 / Champion 6v6. A wild-catcher fills the cap immediately on the route; foes still follow the badge curve, so over-catching means PC overflow, never a foe mismatch. |
| Professor visibility | Each city's Professor (cities 0–5 by action list; cities 6–8 via `shouldForceCityProfessor`) appears **only at pre-gym hubs, and only while the player's active party is below the current cap**. So pre-Gym-1 with a full 2/2 party, no Pro button. After Gym 1 (cap → 3), the post-gym hub of City 1 is intentionally Pro-less — the badge unlocks the slot, but the player walks the route (with its wild-encounter beat) and meets the next Professor at City 2's pre-gym hub. Post-gym hubs still keep the Pokémon Center (PC swap-in for any mon already stored) so the new slot isn't dead until the route. Lone exception: City-8 post-Gym-8 legendary gate (Mystery Figure), which stays visible at 6/6 because the swap is required to enter Victory Road. |
| Rival adaptation | Read live `sm.team` at battle entry. **Do not** filter `wild:true` mons. |
| Intro rival | Special-cased to pure player-match (1v1 starter duel). The catch tutorial fires *after* this fight. |
| Catch tutorial | After the intro rival victory, a one-time static event fires before the next battle: a guaranteed Grade-4 friendly wild (from `STARTER_PARTNER_POOL`) appears, 100% catch on first throw, no flee, with a tutorial overlay (FireRed/Emerald-style). Marked done via `sm.catchTutorialDone`. Fills the 2nd slot exactly at the 0-badge cap of 2. |
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
| When | Once per route node, between consecutive Battles that cross a city boundary. Forced — no skip. |
| Where | Virtual screen, not a timeline row. |
| Pool grade | Driven by a dedicated **wild grade curve keyed on `sm.badges`** (0–8, see `_WILD_GRADE_CURVE_BY_BADGES`). Independent of the upcoming trainer's `gradeWeights` — wilds reflect the route's biology, not the next fight's lineup. Each tier sits one step behind the contemporaneous trainer roll, so wilds are intentionally inferior to Professor picks and to the foe ahead. |
| Pool species | Filtered by `sm.settings.enabledGens`, same as trainer rolls. The two toggles (grade curve + enabled gens) are the **only** inputs to the wild roll. |
| Build | Rough build per the prior audit's A4 — 4 random level-up moves, no held item, default ability, neutral nature, no EVs. Tagged `wild: true`. |
| Player options | Throw (any ball type from inventory) or Run. |
| Flee | Foe may flee on a missed throw (per-species flee chance; baseline 25%). |
| Capture state | Full HP / full PP / no status. |
| If party + PC are both full | Capture fails with explicit modal. |

---

## 4. Safari Zone

The Safari Zone replicates the canonical gameplay loop (no battles, only Safari Balls work, Bait/Rock as asymmetric levers, every turn the wild may flee) and adapts the numbers to story mode's 6-encounter / 15-ball session shape.

| Aspect | Value |
|---|---|
| Unlock | City 4 ("Wilderness town") action button — both pre- and post-Gym-4 hub rows carry it. |
| Location | City 4 only in the main timeline. Post-HoF access is via the Crucible (which also exposes the same screen). |
| Cost | First entry free. Subsequent entries cost `SAFARI_ENTRY_COST` (2,500G). |
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
| G1 (strongest) | 0.04 | 0.55 |
| G2 | 0.12 | 0.40 |
| G3 | 0.22 | 0.28 |
| G4 (weakest) | 0.35 | 0.20 |

Ball multipliers: PokéBall 1.0×, Great 1.5×, Ultra 2.0×, Master ∞ (`Infinity`).

Master Ball is `Infinity` — guaranteed catch. No special-case code.

Safari Ball is its own session-scoped multiplier (`SAFARI_BALL_MULT = 1.35×`, sitting between Poké and Great with a slight lean toward Great) and is not part of `sm.balls`. Bait and Rock modify the catch/flee math multiplicatively inside a Safari encounter and reset between encounters.

---

## 6. Balls and economy

| Ball | Multiplier | Source | Cap |
|---|---|---|---|
| PokéBall | 1.0× | PokéMart (300G ea, unlimited) + 5 at run start | — |
| Great Ball | 1.5× | Department Store (existing City6/City8) (1000G ea) | — |
| Ultra Ball | 2.0× | Static story events (×2 total: mid-game + late-game) | 2 per run |
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

(Originally tightened from 2500/700/150/30 to 1800/400/100/20 to keep *keeping* mons the rewarding play; then rebalanced from 1800/400/100/20 to 1800/450/250/60 so route catches are worth selling for catch-light players. Safari spam still loses money — typical 6-encounter session pulls ~1,758G expected, less than the 2,500G entry, even before catch-rate failures. See `_PC_UNDERGROUND_PRICE_BY_GRADE`.)

---

## 7. Pokémon Center hub button (new)

Every city gets a new hub action: **"Pokémon Center"**. Tapping it opens a screen with two tabs:

- **PC Storage** — Deposit, withdraw, release. **Capacity 10** — intentionally tight, since the run is battle-focused and the Underground is meant to drive sell decisions, not a long-term collection. At ≥ 8/10 the screen shows a "PC nearly full" warning banner; at 10/10 a new wild catch fails outright with a clear modal telling the player to sell or release first.
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
| ≥ 2 badges | every fight | 1.00 — softening ends |

The "gym leader's signature ace stays the identity" guarantee is enforced through **composition**, not stat exemption: `rollTrainerTeam`'s `gwForFiller` shifts non-signature fillers one tier weaker on the grade roll while signature aces stay in the row's canonical grade. A flat 5% stat softening on top keeps GL1/GL2 winnable without changing who the leader fields. Set any constant to `1.0` to disable that tier's softening.

In addition, `applyDifficultyToGradeWeights` shifts a small slice of g1 (×0.92) and g2 (×0.96) mass down to g3 universally, so opponents are slightly less likely to high-roll a top-tier mon. Gym Leader teams shift another ~20% of g1 → g2 and ~15% of g2 → g3 for the non-signature pickThematic call only — the leader's signature picks stay at the original tier, the rest of the team eases up.

The pre-Gym-1 Basic Trainer slot (event idx 2, the lone route fight between intro rival and City 1) is locked to an *untagged* Basic Trainer class — Youngster, Bug Catcher, Lass, Hiker, Fisherman, Hex Maniac, Black Belt, Bird Keeper, Dragon Tamer, or one of the 2-type thematic fillers — so the first non-rival fight is never a villain / cursed / multitype variant.

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
pcBox:        [],                                        // flat, cap 10
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
- **A2**: Flat-array PC, cap **10** (revised down from the prior audit's 60 — this is a battle-focused story mode, not a collection roguelike)
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

## 15b. Permanent stat-boost vitamins (v18+)

Six earned-only items — **HP Up / Protein / Iron / Calcium / Zinc /
Carbos** — that add +1 to a single stat, capped at +10 per stat per mon.
Tracked at `mon.build.permBoosts[stat]`; additive after the EV-derived
stat in `buildPokemon` (`battle.html:11362`). Total max is +60 across all
six stats per mon.

Constants live at the top of the IIFE near `POKEMART_ITEMS`:

- `PERM_BOOST_CAP` (= 10) — per-stat cap per mon
- `PERM_BOOST_ITEMS` — array of `{ id, name, stat, desc }`
- `PERM_BOOST_IDS` — `Set` of ids for fast inclusion checks
- `PERM_BOOST_STAT_LABEL` — pretty-print map (`'spa' → 'Sp.Atk'`)

### Drop schedule

Distinct from the existing **Vitamin Pack voucher** (EV Trainer preset
waiver) — both coexist in inventory under their own ids and never
conflict. Drops are weighted toward "matching stat" per leader's combat
style, so a physical-leaning gym tends to drop Protein/Iron/Carbos and a
special-leaning gym drops Calcium/Zinc.

A perfect playthrough yields ~110 vitamins total — enough to fully boost
~1.8 mons (60 caps each) or partially invest across 4-5. The drop tuning
forces priority calls.

| Source | Vitamins |
|---|---|
| GL1-GL8 | 2-5 each |
| E1-E4 + Champion | 3-12 each |
| Pokédex 25 / 50 / 75 / 100 | 2 / 2 / 2 / 8 |
| Post-HoF Mystery Figure | 18 (3 of each) |
| Caged God boss arc | 30 (5 of each) |

`_storyGrantBundle` reads `hpUp` / `protein` / `iron` / `calcium` /
`zinc` / `carbos` keys from a reward bundle and adds them to
`sm.inventory` under the matching id.

### UI

Surfaced in the **City Bag** (`openCityBag`) as a new block between the
existing vouchers and the standard shop items. Each row has a **Use**
button that opens `openPermBoostPicker(vitaminId)` — a roster picker
showing party + PC mons with each mon's current `+N/+10` boost for the
relevant stat. Rows already at the cap are dimmed and not clickable.

`applyPermBoost(vitaminId, source, idx)` increments
`mon.build.permBoosts[stat]`, decrements inventory, saves, and re-opens
the picker if more vitamins of that type remain (so a player who earned
5 HP Ups can apply them all without modal bouncing).

### Carry-through

| Action | Carry permBoosts? |
|---|---|
| Stone Sage evolution | yes — same identity |
| Cable Link Rebuild | yes — same species |
| Cable Link Reroll / Upgrade | no — different species, fresh start |
| PC deposit / withdraw | yes — lives on the build, not on the slot |
| Underground sale | irrelevant — mon is gone |

Implementation: `_evoLabApplyEvolution` copies `old.permBoosts` into
`evoBuild.permBoosts`. `linkRebuild` snapshots the old permBoosts before
the new build and restores them. `linkReroll` / `linkUpgrade`
intentionally do not — the player is trading the mon away for a new
species.

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
