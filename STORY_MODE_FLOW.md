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
| Foe sizing | **Matches the player's current team size.** Story finales (Champion / Victory Road / E1–4 / post-HoF Mystery Figure) always field 6. Gym Leaders carry a per-gym floor so the curve still climbs with badges: GL1–2 = 2, GL3–4 = 3, GL5–6 = 4, GL7 = 5, GL8 = 6. Rivals and regular trainers have no floor — pure player-matching. So a lean 3-mon player faces 3-mon trainers; a full 6-mon player faces 6-mon trainers; either way, fights stay even. |
| Expected sequence (non-catcher who accepts every Professor) | Intro rival 1v1 → catch tutorial → Basic trainer 2v2 → City 1 Prof → GL1 3v3 → City 2 Prof → GL2 4v4 → City 3 Prof → GL3 5v5 → City 4 Prof → GL4 6v6 → all subsequent battles 6v6. A wild-catcher fills slots faster, and foes match the larger team on the same fight. |
| Player party cap | Hard 6 (no badge-gated growth). The Professor in each of cities 0–5 hands you one Pokémon — so a player who never catches a wild still finishes the front half with a full team. Wild catches over 6 land in the PC. |
| Professor visibility | Each city's Professor (cities 0–5 by action list; cities 6–8 via `shouldForceCityProfessor`) appears **only while the player's active party is below 6**. Once the team is at 6, the Professor stops showing. The lone exception is the City-8 post-Gym-8 legendary gate (Mystery Figure), which stays visible at 6/6 because the swap is required to enter Victory Road. |
| Rival adaptation | Read live `sm.team` at battle entry. **Do not** filter `wild:true` mons — full-party-counts is the honest signal. Bringing a Magikarp pulls some counter-weight onto Water, but doesn't dominate against 5 other types. |
| Intro rival | Used to be hard-fixed to 1-on-1; now follows the player-matching formula with a rival floor of 2. The post-rival catch tutorial (below) guarantees the player has 2 mons before the next battle, so the *next* fight onward is always at least 2v2. |
| Catch tutorial | After the intro rival victory, a one-time static event fires before the next battle: a guaranteed Grade-4 friendly wild (from `STARTER_PARTNER_POOL`) appears, 100% catch on first throw, no flee, with a tutorial overlay (FireRed/Emerald-style). Marked done via `sm.catchTutorialDone`. Serves three purposes — teaches catching mechanics, adds story pacing between rival duel and Gym 1, and guarantees a 2-mon party so the first wild route + first gym are 2v2 minimum. |
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
| Pool grade | Current event's `gradeWeights` shifted one tier **weaker** (e.g., a slot weighted 0/0/30/70 G1/G2/G3/G4 produces a wild pool ~0/0/10/90). Wild encounters are intentionally inferior to Professor picks. |
| Pool species | Filtered by `sm.settings.enabledGens`, same as trainer rolls. |
| Build | Rough build per the prior audit's A4 — 4 random level-up moves, no held item, default ability, neutral nature, no EVs. Tagged `wild: true`. |
| Player options | Throw (any ball type from inventory) or Run. |
| Flee | Foe may flee on a missed throw (per-species flee chance; baseline 25%). |
| Capture state | Full HP / full PP / no status. |
| If party + PC are both full | Capture fails with explicit modal. |

---

## 4. Safari Zone

| Aspect | Value |
|---|---|
| Unlock | City 4 ("Wilderness town") action button — both pre- and post-Gym-4 hub rows carry it. |
| Location | City 4 only in the main timeline. Post-HoF access is via the Crucible (which also exposes the same screen). |
| Cost | First entry free. Subsequent entries cost `SAFARI_ENTRY_COST` (1,200G). |
| Encounters | Continuous random encounters up to `SAFARI_MAX_ENCOUNTERS` (8 per session). Each encounter is a single mon. |
| Pool grade | Richer than wild routes — `SAFARI_GRADE_WEIGHTS` g1:8 / g2:40 / g3:38 / g4:14. |
| Balls | Safari-session pool only (`SAFARI_BALLS_PER_SESSION` = 25). The player's PokéBall stack does **not** apply inside; leftover Safari Balls are forfeited on exit. |
| Mechanics | Bait (calm: lower catch, lower flee) and Rock (anger: higher catch, higher flee) stack within an encounter and reset between encounters. |
| Flee | Per-grade flee rate (G1 55% → G4 20%), modulated by bait/rock stacks. |
| Exit | After 8 encounters, when balls run out, or via "Leave Safari" button. Caught mons enter party/PC; uncaught are gone. |

---

## 5. Catch minigame

A single screen, used by both wild route encounters and Safari encounters.

```
chance = species.catchRate × ballMult
if (Math.random() < chance) → caught
else → mon may flee (species.fleeRate, default 0.25)
       otherwise stays for another throw
```

Species `catchRate` is derived from grade. G1 is the strongest tier (pseudo + legendary in `getMonGrade`) and is therefore the **hardest** to catch; G4 is the weakest tier and is the easiest:

| Grade | Base catch rate (PokéBall) |
|---|---|
| G1 (strongest) | 0.05 |
| G2 | 0.20 |
| G3 | 0.40 |
| G4 (weakest) | 0.60 |

Ball multipliers: PokéBall 1.0×, Great 1.5×, Ultra 2.0×, Master ∞ (`Infinity`).

Master Ball is `Infinity` — guaranteed catch. No special-case code.

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
| Sell G1 mon | 2500 |
| Sell G2 mon | 700 |
| Sell G3 mon | 150 |
| Sell G4 mon | 30 |

---

## 7. Pokémon Center hub button (new)

Every city gets a new hub action: **"Pokémon Center"**. Tapping it opens a screen with two tabs:

- **PC Storage** — Deposit, withdraw, release. **Capacity 10** — intentionally tight, since the run is battle-focused and the Underground is meant to drive sell decisions, not a long-term collection. At ≥ 8/10 the screen shows a "PC nearly full" warning banner; at 10/10 a new wild catch fails outright with a clear modal telling the player to sell or release first.
- **Underground** — Sell mons for gold. Dark visual theme. Per-grade price table above. Unsellable: starter, current last party mon, the boss-arc capture ("Subject Zero").

Selling shows a confirmation modal (`"Sold to the Underground. Gone for good."`) with no take-back.

No heal function on the Center — full-heal between battles is universal.

---

## 8. Difficulty modes (after hardcore removal)

The five surviving modes keep their existing values (`battle.html:21365–21372`, `26270`):

| Mode | Foe stat mult | Coin mult |
|---|---|---|
| Very Easy | 0.75 | 1.60 |
| Easy | 0.75 | 1.50 |
| Normal | 1.00 | 1.30 |
| Hard | 1.15 | 0.92 |
| Challenge (Very Hard) | 1.20 | 1.05 |

The `hardcore` value is removed entirely. Existing saves on `hardcore` migrate to `normal`.

All five modes use **full-heal between battles**. The HC-only persistence code at `battle.html:24739–24750` becomes dead and is removed in M0.

---

## 9. Boss arc — "The Caged God"

Triggered post-Champion. Replaces the existing post-HoF Mystery Figure (row 67 in `STORY_EVENTS_RAW`) — that row is repurposed as this arc.

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
pcBox:        [],                                        // flat, cap 60
balls:        { poke: 5, great: 0, ultra: 0, master: 0 }, // starting balls
pokedex:      { seen: [], caught: [] },                   // per-run; cross-run lives in pbs_story_meta
partyEverReached4: false,                                 // monotonic flag (interim until badges-based curve lands)
catchUnlocked: false,                                     // toggles wild-route prompts; flipped on after first wild route entry or starter
```

Plus a stable `id: string` on every mon (in `sm.team` and `sm.pcBox`), generated at creation time. Existing mons in `sm.team` get IDs assigned by the v14→v15 migration.

Bump `SAVE_VER` from 14 to 15. Add:

```js
function migrateStoryPreV15() {
    // 1. New fields with defaults
    if (!Array.isArray(sm.pcBox)) sm.pcBox = [];
    if (!sm.balls || typeof sm.balls !== 'object') sm.balls = { poke: 5, great: 0, ultra: 0, master: 0 };
    if (!sm.pokedex || typeof sm.pokedex !== 'object') sm.pokedex = { seen: [], caught: [] };
    if (typeof sm.partyEverReached4 !== 'boolean') sm.partyEverReached4 = (sm.team || []).length >= 4;
    if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;
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
difficulty off `sm.team.length` must move to `sm.badges` or a monotonic flag.

The primary offender is `storyStripGrade4IfPartyMature` at `battle.html:22480`,
which reads `sm.team.length >= 4`. With catch enabled, depositing a mon to PC
re-introduces G4 mid-game. Fix:

```js
// Before: keys off length
if (sm.team.length >= 4) { ...strip G4... }

// After: keys off monotonic flag, updated on every party growth
if (sm.partyEverReached4) { ...strip G4... }
```

`sm.partyEverReached4` is set to `true` the moment `sm.team.length` ever reaches 4 (in `makeBuild` insertion, catch flow, mystery swap, etc.). Once set, it never resets — so the G4 difficulty floor only advances monotonically.

This refactor is M0's largest single change but is mechanically simple — every `sm.team.length` read in difficulty-or-balance code is the audit's table at `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §2`.

---

## 13. Implementation phases

Each phase is shippable on its own and leaves the game playable.

### M0 — Schema + hardcore removal (~1 day)
- Bump `SAVE_VER` to 15.
- Add new save fields (`pcBox`, `balls`, `pokedex`, `partyEverReached4`, `catchUnlocked`).
- Migrate v14 saves: assign stable IDs, set defaults, hardcore → normal.
- Remove `hardcore` from difficulty UI + all branches (see §11).
- Refactor `storyStripGrade4IfPartyMature` to read `sm.partyEverReached4`.
- Add `sm.partyEverReached4 = true` set on every party mutation that reaches length 4.

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
- Wild route flow: roll species from current event's grade weights shifted one tier weaker; open catch screen; throw/run; on catch → `state.pendingCatch`; on exit → promote to `sm.team` or `sm.pcBox`.
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
| 7 — Gym 7 | Champion's road — every tutor, last Pokémart city. |
| 8 — Gym 8 | Final-gym town — Department Store + Battle Dojo + EV Trainer for last polish. |
| 9 — League | Pokémon League — every facility under one roof. |

City 4 and City 5 are the "one-time mid-game events": Safari Zone and Poké Casino
respectively. Both remain accessible post-HoF via the Crucible (§14b), but the
main timeline restricts them to a single city each so they feel like a
destination rather than a ubiquitous facility.

City 8 gained Battle Dojo + EV Trainer in this pass — the player cannot
backtrack, so without these the only late-game item/ability/EV polish was at
City 6 or City 7 (or City 9 post-HoF). The League run between Gym 8 and the
Elite Four was previously a dead-zone for team optimization.

---

## 15. Open items (not blocking M0)

Things that need decisions before later milestones but don't block schema work:

- **Safari city placement** — currently City 4 only; revisit if playtesting shows the single-city window is too tight.
- **Ultra Ball drop events** — which two static beats. Placeholder: post-Gym 4 trainer, post-E2 broker.
- **Sub-Legendary vs. Restricted Legendary balance for the boss arc pool** — exact filter rule to keep the random selection feeling appropriate.
- **First-clear vs. NG+ behavior of the boss arc** — does the legendary re-roll on NG+ or stay fixed?
- **Underground sale price scaling per save day** — flat per-grade vs. mild diminishing returns to discourage farm loops.

---

## 16. References

- `docs/STORY_MODE_AUDIT.md` — full 6-agent audit of current story mode (~400 lines)
- `docs/STORY_MODE_DESIGN_DECISIONS.md` — prior 22-decision table; this spec overrides where §14 lists conflicts
- `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md` — risk analysis of catch/PC integration; strategy A is the chosen wild-encounter approach
- `docs/STORY_FEATURES_INTEGRATION.md` — earlier high-level mechanic outlines; this spec is the canonical replacement
- `README.md` — top-level project README; references this file
