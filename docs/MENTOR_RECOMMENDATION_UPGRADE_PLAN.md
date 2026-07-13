# Battle Mentor & Recommenders — Investigation + Upgrade Plan (proposal)

> **Status: PROPOSAL — needs maintainer sign-off.** Scoring / EV / nature / item
> recommendations are game behavior per `CLAUDE.md` approval rules, so nothing here
> ships until the §6 decision list is answered. Every change proposed is
> **player-scorer-only** (the `_tx*` recommenders and the Mentor are never on any
> foe/roll path — verified call sites), **deterministic** (no `Math.random()`), and
> **additive** (no `SAVE_VER` bump). Line anchors verified on `battle.html` at the
> time of writing; numbers drift — search the symbol.
>
> Produced from a deep read of the recommender stack (move / item / ability / nature /
> EV + Fast-Build + Battle Mentor), the progression curve (`PROGRESSION_CURVE_MASTER.md`),
> and the battle-driven EV economy. Builds **on top of** the shipped
> `DOJO_TUTOR_RECOMMENDER_DESIGN.md`, `MOVE_TUTOR_OVERHAUL_PLAN.md`, and
> `FAST_BUILD_TUTOR_DELTA_PLAN.md` — it does not undo any of them.

---

## 0. TL;DR — the one core mismatch

The recommender stack is **very good at one thing and blind to another.**

- **What it does (well):** for a single species in a vacuum, it picks a
  competitively-correct set — Smogon usage blended with base-stat role heuristics,
  category-fit weighting, ability→move synergy, type-chart coverage value,
  competitive-move floors, and a short-battle down-weight. This is mature and
  well-tested (20/20 mentor/fast-build suites green).

- **What it is blind to:** the **game the player is actually playing.** No recommender
  reads *who you're about to fight*, *your other five party members*, *where you are
  in the battle-EV economy*, or *the difficulty you picked*. It optimizes "the correct
  competitive set" — not "the set that beats the next gym."

For a flat-Level-50, short-battle, **type-themed-gym** PvE campaign with a
battle-driven EV faucet, "beat the game easier" ≠ "competitively optimal." The single
highest-leverage upgrade is to make the recommender **game-context-aware**, staged so
each new layer of awareness switches on exactly as the story reveals the information —
mirroring how the facilities themselves unlock.

---

## 1. How it works today (verified baseline)

### 1.1 The recommender surfaces
Four per-facility panels + one aggregator, all sharing the `_tx*` scoring core:

| Surface | Entry | Recommender fn | Anchor |
|---|---|---|---|
| Move Tutor "✨ Suggest a set" | `enterTutor('moves')` | `_txMoveRecsByPurpose` | `battle.html:71594` |
| Battle Dojo "Best items" | `enterTutor('loadout')` | `_txItemRecsByPurpose` | `71747` |
| Battle Dojo "Best abilities" | `enterTutor('loadout')` | `_txAbilityRecsByPurpose` | `71828` |
| Nature Rater "Recommended" | `enterTutor('nature')` | `_txNatureRecsByPurpose` | `71880` |
| EV Trainer "Recommended · role" | EV Trainer | `_txEvPresetRecsByPurpose` / `_evTrainerRecPreset` | `71957` / `70534` |
| **⚡ Battle Mentor (Auto-Build)** | `enterMentor()` | `_txBuildFastBuildPlan` | `74277` / `74915` |

The Mentor is the headline: a City-0 NPC that runs Auto-Build per party mon, adapting
to what's unlocked (`renderMentorTeam` `74327`), composing all the per-facility
recommenders into one itemized, voucher-aware, all-or-nothing apply.

### 1.2 The single source of truth for "what is this mon"
`_txRoleForBase(base)` (`12658`) → `{ token, coarse, physical, off, focusStats … }`.
One classifier now feeds the foe roller (`_designedInferRole`/`_designedCoarseRole`),
the item recs, the post-battle EV-focus picker (`_pickBattleEVStats` `63874`), and the
surfaced role chip (`_txMonRole` `70497`). `_txBestArchetypeFor` (`70513`) picks the
single highest-weight eligible archetype → recommended nature + EV spread. This
consistency is a real strength — keep it.

### 1.3 The scoring core
- Moves: `_txMoveHeuristic` (`71339`) = pow × STAB × acc × category-fit ×
  ability-synergy (`_txAbilityMoveFactor` `71276`) × short-battle-fit
  (`_txShortBattleFactor` `71270`), status via a fixed table + competitive-move floor
  (`_txCompetitiveTag` `71330`, `data/competitive-moves.json`, 46 moves). Blended with
  Smogon usage via `_txBlend` (`71243`).
- Coverage value: `_txCoverageValue` (`71306`) — counts single defending types that
  resist every STAB (≤1×) but take SE from the candidate. Type-chart aware.
- Items/abilities/natures: analogous heuristic ⊕ usage blends.

### 1.4 The battle-driven EV economy (fully mapped)
- **Faucet:** `_grantBattleEVs` (`63888`) after every trainer win → `EV_GAIN_ACTIVE`
  (`63817`) = **REGULAR 9 · ACE 14 · BOSS 18**, granted to the **whole team**, capped
  510, round-robin into the mon's focus stats.
- **Steering:** `build.evTrainFocus` (a 2-stat array) set via the party summary picker
  (`setEvTrainFocus` `56501`); absent → auto = `_pickBattleEVStats` = `focusStats`.
- **EV Trainer facility:** debuts C4. **Reshuffle-only C4–C6** (re-point already-earned
  EVs, 1000G, `evTrainerRedistribute` `76905`); **full "buy any spread" only at C7+**
  (`_evTrainerIsFullMode` `76720`, `EVTRAINER_COST` 5000G).
- **Wild baseline:** `makeWildBuild` ships ~170 curated EVs (~70% built).
- **Foe ramp:** EV cap by build tier T1 0 → T2 220 → T3 420 → T4 510.

The Mentor's EV component honors this: locked EV Trainer → set `evTrainFocus` only;
full mode → buy the whole spread (`_txBuildFastBuildPlan` `74972–74987`).

### 1.5 Progression staging (already correct, reuse it)
`NPC_STAGE_CITY` (`69579`) + `FACILITY_DEBUT_CITY` gate everything by **arrived city**.
Mentor banner already lists "auto-tuning available now: moves · items · abilities · …"
per city (`74337–74343`). The staging skeleton the upgrade needs already exists.

---

## 2. The issues (ranked, grounded)

### I-1 · No matchup / opponent awareness — **the headline gap**
Nothing in any recommender reads who you're about to fight. Verified: a grep for
`gymType|nextGym|upcomingFoe|typeTheme|…` across the recommender region returns
**zero** hits. `_txCoverageValue` (`71306`) rewards coverage vs *abstract* single
defending types your STAB can't hit — never vs the **type-themed gym you're walking
into**. The data to do better already exists and is deterministic:
`preferredTypeBeforeGymBattle` (`56186`) + `sm.trainerAssignments` +
`parseTrainerTypes` resolve the **upcoming gym leader's type** in advance.

**Failure example:** a Water starter approaching the Grass gym gets a coverage move
scored purely on abstract type-chart breadth; the recommender has no reason to surface
the Ice/Flying/Fire/Poison move that trivializes that specific gym, and may instead
suggest a "broad" coverage type that does nothing there. This is the exact lever that
turns a wall into a walkover — and it's unused.

### I-2 · Per-mon only, never team-level — **the Mentor's missing half**
`renderMentorTeam` (`74344`) is a `sm.team.map(...)` that calls
`_txBuildFastBuildPlan(idx)` on each mon **in isolation.** There is no cross-mon
analysis anywhere. The Mentor cannot see:
- a **shared team weakness** (e.g. 4 of 6 mons weak to Ground),
- **no hazard removal** on a team that keeps eating Stealth Rock,
- **redundant coverage** (three mons all carrying Earthquake),
- **no speed control / no priority** heading into the endgame.

The facility is literally called "Battle **Mentor**" and renders the whole team — it is
the natural home for team-level advice and gives none. In a themed-gym game the #1 way
a mid-tier player loses is an unaddressed team-wide weakness, and the system is silent
on it.

### I-3 · The battle-EV faucet is under-taught and under-leveraged
- **Never taught.** The Mentor intro (`50688`) says *"I'll tune it to a competitive
  set … no menus to learn"* and never mentions EVs/IVs. `PROGRESSION_CURVE_MASTER.md`
  §3.1 F1 already flags this as the biggest onboarding gap: "the whole curve runs on
  EV/IV/grade, yet the player is never told." The Mentor is the ideal teacher and
  isn't one.
- **The C4–C6 middle is wasted.** During the reshuffle window the mon has passively
  banked 9–18 EV/fight, but the Mentor's EV logic is binary: locked → focus-only;
  full → buy-full (`74972–74987`). It never offers to **reshuffle earned EVs toward the
  goal shape** (the cheap `evTrainerRedistribute` path), and never shows progress
  ("168/510 → goal 252 Atk / 252 Spe"). The free faucet the player is already filling
  is left unguided precisely when gold is tightest (curve doc R2/R3).
- **Auto-focus is coarse.** `focusStats` for a wall is `['hp', defStat]` where
  `defStat` is the mon's *higher* defense (`12676`) — a mixed wall trains one side and
  ignores the other; the choice never considers the incoming threat or what's already
  trained.

### I-4 · "Recommended" is competitive, never "easy-mode" — no difficulty sensitivity
No recommender reads the story difficulty (verified: grep for `difficulty|aiProfile`
across the `_tx*`/Mentor region = **empty**). The EV spread is always the archetype's
sharp competitive shape (`max_offense_speed` = 252 off / 252 Spe for any attacker,
`_designedEvSpread` `12886`); the nature is always the offensive archetype nature. But
the player who most needs a mentor is the one *getting one-shot* — for them a
bulk-leaning variant of the same archetype (survive one more hit) is what "beats the
game easier." The Mentor's own promise ("a competitive set") is subtly the wrong
promise for its core audience.

### I-5 · Ability recs are set-agnostic (soft)
`_txAbilityRecsByPurpose` (`71828`) scores candidates on `_txScoreAbility` (heuristic ⊕
usage) **without reading the mon's actual moves.** `_txAbilityMoveFactor` (the
Technician-≤60 / Huge-Power / -ate / Adaptability synergy) is applied to *move* scoring
but there is no *move→ability* check when recommending an ability. Usage usually
correlates, so this rarely misfires hard — but it can recommend Technician to a mon
running no ≤60 BP moves, or Sheer Force with nothing to boost.

### I-6 · Cost/value blindness in the per-facility panels (soft)
Fast-Build itemizes costs, but the standalone panels present a "best" pick with no
gold-ROI framing (e.g. an Awakened ability is 5000G and unlocks at C8). On the tight
mid-game economy, "highest win-value **per gold**" is a better ordering for
beat-the-game than abstract best. Low priority — flag only.

### I-7 · Minor staleness / naming (cosmetic, but in a sensitive table)
- `_DOJO_ITEM_TIER1` comment (`69654`) self-contradicts: opens "type-boosters +
  Eviolite," then says "Eviolite is Tier-2, NOT Tier-1." The code is correct (only
  type-boosters are tier 1); the first sentence is stale.
- `_txItemRecsByPurpose` infers `nfe` from `availItems.includes('Eviolite')` (`71762`).
  Since Eviolite is tier-2-gated out at White Belt, every NFE mon reads as
  fully-evolved for item logic there. Harmless today (Eviolite is unavailable at White
  Belt anyway) but the variable name misleads and any future tier-1 NFE item breaks it.

---

## 3. The upgrade — four progression-staged "lenses"

The unifying idea: **each new piece of game context the story reveals switches on a new
lens of the recommender**, exactly as facilities already unlock. The Mentor "gets
smarter as you do." Layer 0 (today's species-intrinsic competitive rec) stays as the
floor; the lenses re-weight its candidate lists and add surfacing.

### Lens A — Matchup lens (fixes I-1) · *turns on at every gym approach*
- New read-only helper `_upcomingGymType(eventIndex)` generalizing
  `preferredTypeBeforeGymBattle` (`56186`) to return the next gym leader's type(s) from
  any point (walk forward to the next `Gym Leader` row, resolve via
  `sm.trainerAssignments` → `parseTrainerTypes`).
- **Coverage & defensive-tech re-weight:** in `_txMoveRecsByPurpose`'s coverage step
  and `_txItemRecsByPurpose`'s resist-berry slot, add a bias toward move types that are
  SE against the upcoming theme, and resist berries / defensive tech vs the type the
  theme *hits you with*. Purely a re-weight of existing candidates — no new moves/items.
- **Honest teaching in the reason string:** "Carries Ice — the next gym leans
  Dragon/Ground." The rationale doubles as the type-matchup lesson the onboarding never
  gives.
- Foe-neutral (player scorer only), deterministic, no data added.

### Lens B — Team lens (fixes I-2) · *the Mentor's headline new feature*
- New read-only `_txTeamReport()` over `sm.team`: shared weaknesses (types ≥⅓ of the
  team is weak to, via `typeChart`), coverage the team lacks vs the current grade era,
  presence/absence of hazard-removal / speed-control / priority (reuse
  `data/competitive-moves.json` classes), and redundant coverage.
- **"Team Report" banner** above the per-mon cards in `renderMentorTeam`:
  "⚠ 4 of your 6 are weak to Ground — a Flying-type or Levitate answer would help" /
  "No hazard removal — Stealth Rock chips you every switch."
- **Gap-fill bias:** when a mon *can* patch a flagged team gap, its Auto-Build prefers
  the coverage move / ability (e.g. Levitate) that does so, with the reason naming the
  gap. Additive UI + one analysis function; no foe impact, no save change.

### Lens C — EV-economy lens (fixes I-3) · *stages with the EV Trainer*
- **Teach it:** one added Mentor intro line + a codex-style tooltip explaining the
  battle-EV faucet (9/14/18 per win, whole team, 510 cap, steerable focus). Closes the
  curve doc's F1 at the facility that acts on it.
- **Show progress:** per-mon "EVs 168/510 → goal 252 Atk / 252 Spe" on the Mentor/EV
  cards.
- **Use the reshuffle window (C4–C6):** add a middle EV mode to Fast-Build — when the
  EV Trainer is in reshuffle mode and the mon's earned EVs are mis-shaped, offer
  `evTrainerRedistribute` toward the goal shape (cheap) instead of the binary
  focus-only/buy-full. Turns the free faucet into a guided path.
- **Smarter auto-focus:** mixed walls split focus across both defenses; `focusStats`
  considers what's already trained so it stops pumping a capped stat.

### Lens D — Difficulty lens (fixes I-4) · *reads the run's difficulty*
- Recommenders read the story difficulty. On Very Easy / Easy (and optionally an
  auto-detected "losing streak"), bias EV/nature/item toward the **bulk variant** of
  the same archetype (e.g. `bulk_offense` spread + a defensive nature surfaced
  alongside) so the beat-the-game audience gets forgiving sets. On Hard / Challenge,
  keep the sharp competitive set unchanged.
- Reframe the Mentor's promise: "a set tuned to beat what's ahead" (not "a competitive
  set").
- Ships behind a single maintainer-owned tunable (the bulk-bias strength per
  difficulty).

---

## 4. Implementation map (all player-scorer-only)

| Lens | New/edited | Anchor | Foe impact |
|---|---|---|---|
| A | `_upcomingGymType(eventIdx)` (new, generalizes `preferredTypeBeforeGymBattle`) | `56186` | none |
| A | re-weight in `_txMoveRecsByPurpose` coverage step | `71688–71707` | none (player scorer) |
| A | re-weight resist-berry / def-tech in `_txItemRecsByPurpose` | `71810–71817` | none |
| B | `_txTeamReport()` (new, read-only) | near `70497` | none |
| B | Team banner + gap-fill bias in `renderMentorTeam` / plan | `74344` / `74915` | none |
| C | Mentor intro + codex tooltip | `50685` | none |
| C | reshuffle-toward-goal EV mode in `_txBuildFastBuildPlan` | `74969–74987` | none |
| C | smarter `focusStats` in `_txRoleForBase` (display/suggest only — the grant keeps its own tie-break) | `12674–12680` | **verify**: `_txRoleForBase.token/coarse` must stay byte-identical (foe rolls read them); only `focusStats` — a player-only value — changes |
| D | difficulty read + bulk-bias table | `_txBestArchetypeFor` `70513`, `_designedEvSpread` consumer | none (player picks its own archetype path, separate from `_designedPickArchetype`) |

**Critical invariant:** `_txRoleForBase`'s `token`/`coarse` are consumed by the foe
roller. Lens C must touch **only** `focusStats` (player-side display/suggestion), never
`token`/`coarse`. A guard test asserts foe rolls are unchanged.

---

## 5. Fits-the-progression (which lens is live where)

| City / stage | Facilities live | Lenses active | Mentor can now say |
|---|---|---|---|
| C0–C1 (moves only) | Move Tutor, Party | A (move coverage vs Gym 1 theme), D | "Gym 1 leans X — this STAB/coverage handles it" |
| C2–C3 | + Stone Sage / Cable Link | A, B (team weaknesses), D | "Your team shares an X weakness" |
| C4–C6 | + Dojo, EV Trainer (reshuffle) | A, B, C (teach + reshuffle-to-goal), D | "Reshuffle your earned EVs toward 252/252" |
| C7+ | + Colress, EV Trainer (full) | A, B, C (full spread), D | "Buy the finished spread; team gap Y remains" |

Every lens degrades gracefully when its data isn't available yet (no upcoming gym → A
is a no-op; solo team → B is a no-op), so nothing bricks and staging is automatic.

---

## 6. Decision list — needs maintainer sign-off

| # | Question | Options | Recommendation |
|---|---|---|---|
| Q1 | Build Lens A (matchup-aware coverage/def-tech)? | ship / trim to reason-string-only / skip | **Ship** — highest beat-the-game leverage; data already exists; foe-neutral |
| Q2 | Build Lens B (team report + gap-fill)? | full (banner + bias) / banner-only / skip | **Full** — it's the Mentor's missing half |
| Q3 | Lens C — teach EVs + reshuffle-to-goal in C4–C6? | yes / teach-only / skip | **Yes** — turns the free faucet into a guided path, closes F1 |
| Q4 | Lens D — difficulty-biased "easy-mode" sets? | ship behind tunable / VE-E only / skip | **Ship behind a tunable**, VE/E bulk-bias only; N+ unchanged |
| Q5 | Reframe Mentor copy from "competitive set" → "set tuned to beat what's ahead"? | yes / keep | **Yes** — matches the audience |
| Q6 | Smarter mixed-wall `focusStats` (both defenses)? | yes / keep single-side | **Yes** — pure player-side improvement (guard foe-roll parity) |
| Q7 | Fix I-7 staleness (`_DOJO_ITEM_TIER1` comment, `nfe` naming)? | yes | **Yes** — cosmetic, no sign-off strictly needed |

## 7. Test plan (deterministic, jsdom harness)

- `story-mentor-matchup` — with a stubbed upcoming Grass gym, a Water mon's rec
  surfaces an SE coverage type; foe rolls unchanged.
- `story-mentor-team-report` — a team with 4 Ground-weak mons flags the shared
  weakness; a team with no spinner/Defog flags hazard-removal absence.
- `story-mentor-ev-economy` — reshuffle-to-goal offered in C4–C6, full spread at C7+;
  progress string correct; mixed-wall focus splits both defenses.
- `story-mentor-difficulty` — VE/E biases toward the bulk spread; N+ returns the sharp
  spread byte-for-byte.
- **Parity guard** — `_txRoleForBase.token/coarse` and every foe roll are byte-identical
  before/after (only `focusStats` and player-scorer outputs move).
- Full `tests/suites` battery stays green; **no `SAVE_VER` bump** (all additive /
  read-live).

## 8. Risk register

| Risk | Mitigation |
|---|---|
| Foe drift via `_txRoleForBase` | Touch only `focusStats`; parity guard test on token/coarse + foe rolls |
| Over-fitting recs to one gym (tunnel vision) | Lens A is a *bias*, not a filter — it re-weights, never removes STAB/general coverage |
| Difficulty bias annoying skilled players | D is VE/E only by default, behind a tunable; N+ untouched |
| Scope creep | Four independent lenses; each ships + tests alone in the §6 order |
| Save safety | No schema change; `evTrainFocus` already in schema; equipped-move invariant untouched |
