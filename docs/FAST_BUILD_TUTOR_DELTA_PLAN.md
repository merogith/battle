# Fast-Build + Role/Nature/EV/Competitive-Move Delta — Plan (proposal)

> **Status: PROPOSAL — pending maintainer sign-off** (touches scoring, gold flow,
> and role thresholds → game behavior per CLAUDE.md approval rules).
>
> Built **on top of** `claude/pokemon-smogon-info-gaps-hc160y` (the big tutor/dojo
> overhaul: filters, recommender quality, item tiers, moves quick-apply, responsive
> UI, sparse-mon coverage). This branch adds only the four pieces that overhaul did
> **not** cover. Every line anchor below was verified on that branch's `battle.html`;
> numbers drift — search the symbol.

---

## 0. Why this exists (the four gaps)

The overhaul made the tutor's *per-facility* recommenders good. What's still missing:

1. **No player-facing role.** The engine knows each mon's role (`_designedInferRole`,
   `_designedCoarseRole` — base-stats → PHYS_SWEEPER / SPEC_WALL / …) but only uses it
   to roll **foe** teams. The player never sees "this mon is a Physical Sweeper," so the
   recs feel arbitrary. Worse: **three** base-stat role heuristics disagree
   (`_designedInferRole` 12256, the item-rec inline profile 70016, `_pickBattleEVStats`
   62307), so item recs and EV picks can classify the same mon differently.

2. **Elite utility moves read as filler.** `_txMoveHeuristic` (69611) scores unknown
   Status moves **30** (filler). Verified: **Parting Shot, Teleport, Baton Pass,
   Shed Tail** are absent from every status list → 30 → never recommended. The task
   explicitly wants Parting Shot / Tailwind / best STAB / hazards / recovery flagged as
   *suitable* even when Smogon usage is thin.

3. **Nature & EV recs aren't role-anchored or surfaced as a spread.** Nature recs exist
   (`_txNatureRecsByPurpose` 70144) but aren't tied to the canonical role; the EV Trainer
   recommends *presets* (`_txEvPresetRecsByPurpose` 70209) but never shows a single
   "recommended spread for this mon's role," and doesn't connect to `evTrainFocus`.

4. **No unified build.** Quick-apply (`tutorApplyRecommendedSet` 72824 /
   `_txBuildApplySetPlan` 72786) is **moves-only**. There's no one action that sets
   moves + item + ability + nature + EVs together, aware of what's already equipped.

**Key architectural fact that makes this cheap:** every applier and cost already exists
and shares one scaffold — `_storyTryBeginInteraction → gate → _storyConfirmTutorChange
→ sm.gold -= cost + _storyTrackSpend → write mon.build.* → save() → renderTutorTeam(true)`.
Appliers: `tutorChangeItem` (72907), `tutorChangeAbility` (72949), `tutorChangeNature`
(72983), `evTrainerApplyPreset` (74475), plus the move path. Fast-Build **composes** them.
The `_txMoveHeuristic`/`_txScoreMove` scorers are **player-tutor-only** (call sites 69667,
69991, 71630/71638 — no foe/roll path), so scoring changes here have **zero foe impact**.

---

## 1. Feature 1 — Canonical role + surfacing

**New helper `_txMonRole(monName, mon)`** (near the tutor profile code ~68835). Returns
`{ token, coarse, physical, label, why, focusStats }`, reusing the *engine* functions:

```
const token   = window._designedInferRole(monName);      // PHYS_SWEEPER … (base stats)
const coarse  = window._designedCoarseRole(monName);      // 'wall' | 'attacker' (HP-aware)
```

`label` = pretty string ("Physical Sweeper", "Special Wall", "Bulky Attacker",
"Physical Pivot" when the legal pool has a pivot move). `why` = the driving stats
("Atk 130 · Spe 102"). `focusStats` = the 2 stats to EV-train for this role (feeds
Feature 3). One source of truth.

**Surfacing:** a role chip on the open mon's card in all three tutor modes — e.g.
`⚔ Physical Sweeper` — with a tap-tooltip (`showMoveTooltipTap`, already wired on this
branch) showing `why`. Purely additive to the header render (`_txRenderMoveEditor` /
`_txRenderLoadoutEditor` / `_txRenderNatureEditor`).

**Reconciliation (decision Q3):** point `_txItemRecsByPurpose`'s inline profile (70016)
at `_txMonRole` so item recs and the surfaced role agree. `_pickBattleEVStats` (62307,
post-battle EV grant) either aligns too or stays (it answers a slightly different
question — which 2 stats to *train*, not the archetype). Recommend align both to
`_txMonRole.focusStats` for consistency.

---

## 2. Feature 2 — Competitive move tagging

**New data file `data/competitive-moves.json`** (data-driven per CLAUDE.md), a curated
map `move → { class, note }` for high-value singleton/utility moves that thin Smogon data
hides. Classes + examples:

- `pivot` — U-turn, Volt Switch, Flip Turn, **Parting Shot**, **Teleport**, **Baton Pass**,
  **Shed Tail**, Chilly Reception, Flip Turn
- `speed-control` — **Tailwind**, Trick Room, Thunder Wave, Sticky Web
- `hazard` / `hazard-removal` — Stealth Rock, Spikes, Toxic Spikes · Defog, Rapid Spin, Court Change
- `recovery` — Recover, Roost, Slack Off, Wish, Morning Sun … (already scored well; kept for the tag)
- `setup` — Swords Dance, Nasty Plot, Dragon Dance, Calm Mind, Shell Smash …
- `status` — Will-O-Wisp, Toxic, Spore, Sleep Powder, Nuzzle
- `disruption` — Knock Off, Trick, Encore, Taunt, Haze, Clear Smog
- `team-support` — Heal Bell, Aromatherapy, Healing Wish, Revival Blessing, Memento

**Two effects:**
1. **Scoring floor (behavior — sign-off):** in `_txMoveHeuristic` the unknown-status `30`
   fallback becomes a **table lookup** — a competitive-tagged move gets a class-based floor
   (pivot/speed-control/disruption ≈ 72, status ≈ 70, team-support ≈ 74) so Parting Shot /
   Teleport / Baton Pass stop reading as filler. Damaging tagged moves (U-turn, Knock Off)
   already score on power; the tag only adds the badge. Floors are a single maintainer-owned
   table.
2. **Visible "★ Suitable" badge (cosmetic):** any legal move in the mon's pool that's
   competitive-tagged **and** relevant to its role/typing gets a badge in the grid + a
   short note ("Pivot: switch out and drop the foe's Atk & SpA") — even at 0% usage.
   Best-STAB is flagged via the existing power×STAB path (no data needed).

Still deterministic, no RNG. Foe-neutral (player scorer only).

---

## 3. Feature 3 — Nature & EV-spread recommendations

**Best-fit archetype, deterministically** (not the weighted-random `_designedPickArchetype`
the foe roller uses): pick the highest-weight eligible archetype for the mon → gives
`nature{phys/spec}` and `evShape`.

- **Nature:** top nature rec = `arche.nature[physical?'phys':'spec']`, surfaced as
  `✓ Recommended: Adamant — max Attack, keep Speed` in the Nature screen (enhances
  `_txNatureRecsByPurpose`, keeps the other purpose slots).
- **EV spread:** compute `_designedEvSpread(arche.evShape, base)` (12430) and surface it in
  the EV Trainer as a first-class **"Recommended for this role: 252 Atk / 252 Spe / 4 HP"**
  card (ahead of the generic presets). Reuses the existing `evTrainerApplyPreset` write path.
  *Fast-Build applies this full spread only once the EV Trainer is unlocked (Q4); before
  unlock it sets `evTrainFocus` only.*
- **evTrainFocus tie-in:** show "Train these from battles: Atk · Spe" (`focusStats` from
  Feature 1) with a one-tap set via the existing `setEvTrainFocus` (55050) — connecting the
  recommendation to the already-merged battle-EV-focus feature.

No new balance numbers — spreads/natures come from the existing archetype data.

---

## 4. Feature 4 — Unified Fast-Build (the headline)

**Planner `_txBuildFastBuildPlan(teamIdx)`** — pure, no state change, mirrors
`_txBuildApplySetPlan`'s shape. Composes the existing recommenders, **diffing against the
current build so it only charges for changes**, and **gates each component to the current
city + what's unlocked**:

| Component | Source (top rec) | Cost fn | Gate |
|---|---|---|---|
| Moves | `_txBuildApplySetPlan` steps (already staged/priced) | `_moveCostForStage` | tutor stage / BP |
| Item | `_txItemRecsByPurpose`[0] ≠ `build.i` | `_itemCostForTier` (67940) | `_dojoItemTier ≤ _npcStage('dojo')+1` |
| Ability | `_txAbilityRecsByPurpose`[0] ≠ `build.a` | `_abilityCostForMon` (68157) | `_dojoAbilityUnlockStage ≤ _npcStage('dojo')` |
| Nature | archetype nature ≠ `build.n` | `TUTOR_COST_NATURE` (2000) | nature facility unlocked |
| EVs | `_designedEvSpread` ≠ `build.evs` | `EVTRAINER_COST` (5000) | EV Trainer unlocked |

Returns `{ moveSteps, item, ability, nature, evs, evFocus, parts[], total, locked[] }`.
Components whose facility isn't unlocked yet appear in `locked[]` (shown greyed, not
charged) — so Fast-Build **works at any stage**, applying only what the city allows.

**Commit `tutorApplyFastBuild(teamIdx)`** — one interaction lock, **all-or-nothing**:
one itemized confirm modal (`Item → 1,000G · Ability → 2,000G · Nature → 2,000G ·
EVs → 5,000G · 3 moves → 4,500G · Total 14,500G`), one `sm.gold -=`, one `_storyTrackSpend`,
writes `mon.build.{i,a,n,evs,m}` + optional `evTrainFocus`, single `save()` +
`renderTutorTeam(true)` + `renderTeamPanel()`. Gold-precheck at confirm time; a mid-list
failure can't half-apply.

**UI:** a headline `⚡ Auto-Build (best set)` button on the open mon's card (all tutor
modes), showing `N changes · X G`. Understands current state: if the mon already matches
every rec, the button reads `✓ Already optimized`. Copy frames it as the in-game
"Battle Sensei auto-tunes your Pokémon" affordance (the "NPC" ask, as flavor — no separate
screen for v1).

---

## 5. Decisions — LOCKED (maintainer sign-off 2026-07-06)

| # | Question | Decision |
|---|---|---|
| Q1 | Fast-Build gold model | **One all-or-nothing charge** summing existing per-facility costs. No new prices. |
| Q2 | Vouchers in Fast-Build | **Voucher chooser in the confirm.** The player picks *which* vouchers and *how many* to spend for a discount (each voucher waives one component's — or one move's — gold cost). Not auto-consumed; explicit opt-in per voucher. |
| Q3 | Role reconciliation | **Unify all three** — item-rec profile (70016) + EV-focus picker (62307) both read `_txMonRole`. |
| Q4 | EV behavior | **Gate-dependent.** If the **EV Trainer facility is unlocked** (late game) → write the full role-optimal spread. **Before unlock** → set `evTrainFocus` only, leave current EVs. (EV component is "focus-only" while locked, "full spread" once unlocked.) |
| Q5 | Competitive floors | **Approved** as a maintainer-owned table (pivot/speed-control ≈72, team-support ≈74, status ≈70). Player-only, zero foe impact. |
| Q6 | Per-facility gating | **Yes** — Fast-Build only applies components whose facility is unlocked at the current city; the rest show greyed in `locked[]`. Nothing bypasses staging. |

### Voucher chooser (Q2) — model
Inventory voucher → facility mapping (all appliers already exist):
Heart Scale → move (`tutorChangeMoveWithVoucher` 73044) · Mint → nature (73125) ·
Ability Capsule → ability (73114) · EV Voucher/vitamin → EVs (`evTrainerApplyPresetWithVitamin`
74503) · Emblem of Honor → item (73090). The Fast-Build confirm lists each *changed* component
that has a matching voucher in `sm.inventory`, with a stepper (0..min(owned, applicable)); a
Heart Scale stepper can waive up to N of the move steps (priciest first). Selected vouchers are
consumed on commit and subtracted from the gold total; the modal live-updates
`vouchers spent · gold total`.

## 6. Tests (deterministic, jsdom harness)

- `story-tutor-role-label` — `_txMonRole` returns the right token/label/focus for phys
  sweeper / spec wall / bulky attacker / pivot fixtures; item-rec profile agrees.
- `story-tutor-competitive-tag` — Parting Shot / Teleport / Baton Pass score above filler
  and carry the badge; Tailwind flagged; a non-utility Status move stays filler.
- `story-tutor-nature-ev-rec` — recommended nature = archetype nature; recommended EV
  spread = `_designedEvSpread` for the fixture's role; evFocus surfaced.
- `story-tutor-fast-build` — plan diffs vs current (only changes charged), sums costs
  correctly, respects locked facilities, all-or-nothing on insufficient gold, single save;
  "already optimized" no-op path.
- Full suite (`node --test`) stays green; no `SAVE_VER` bump (all additive / read-live;
  `evTrainFocus` already in the schema).

## 7. Sequencing (reviewable commits, one branch)

1. `_txMonRole` + reconcile profiles + role chip (Feature 1) + tests
2. `data/competitive-moves.json` + scoring floor + badge (Feature 2) + tests
3. Nature/EV role-anchored recs + surfacing (Feature 3) + tests
4. `_txBuildFastBuildPlan` + `tutorApplyFastBuild` + Auto-Build button (Feature 4) + tests
5. Full suite + story screenshots (`tutor-moves`, `dojo`, `nature`, `ev-trainer`) + docs
