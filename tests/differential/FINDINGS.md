# Differential Oracle — Findings Log

> What the Showdown differential harness (`@pkmn/sim`, MIT) established about the
> in-house engine, as of the Stage 0 / expanded-map pass. Regenerate the evidence
> with `npm run test:differential` (writes `DIVERGENCE_REPORT.md` +
> `DAMAGE_SWEEP_REPORT.md`). **No engine code has been changed yet.**

## Coverage
**~117 probes** — 64 categorical scenarios (`scenarios.mjs`) + 53 damage-modifier
sweeps (`damage-sweep.mjs`) — including an opt-in **move-order check** (priority,
speed, Trick Room) — across: two-turn/semi-invulnerable, type/ability/item
immunities & absorbs, ability-ignoring (Mold Breaker, Scrappy), status application
& immunities, self-status items (Flame/Toxic Orb), stat-change moves, fixed-damage,
Protect/Substitute, survival (Sturdy/Focus Sash), Speed Boost, switch-in hooks
(Intimidate, Stealth Rock), priority/field interactions (Prankster-vs-Dark, Psychic
Terrain priority-block, Gravity grounding, Weakness Policy), recoil, contact-punish
(Rough Skin, Rocky Helmet), Knock Off, multi-hit (Skill Link), Sandstorm chip & Rock
SpD, status-driven multipliers (Guts, Marvel Scale, burn), and the full multiplier
layer (Choice/Life-Orb/type/Expert-Belt/Tinted-Lens/Muscle-Band/Wise-Glasses items;
Huge Power, Adaptability, Technician, Sheer Force, Tough Claws, Iron Fist, Strong
Jaw, Mega Launcher, Reckless, Neuroforce, Thick Fat, Multiscale, Filter, Fur Coat,
Ice Scales, Heatproof, Fluffy, Dry Skin, Mold Breaker; weather, screens, terrain).

## Real divergences from Showdown (candidate fixes)

Stage 1 status: **4 of 4 fixed** (oracle-verified, 0 regressions).

| # | Status | Finding | Root cause | Location | Severity |
|---|---|---|---|---|---|
| 1 | ✅ **FIXED** | **Self-target / field moves "miss" vs a semi-invulnerable foe** (Fly/Dig/Dive/Bounce/Phantom Force/Shadow Force/Sky Drop) — the reported Fly bug | invuln check lacked the `move.cat !== "Status" \|\| !SELF_TARGETING_STATUS.has(name)` guard — **added**, mirroring the Protect guard | `battle.html` invuln check (~23099) | High |
| 2 | ✅ **FIXED** | **`turnCount` lagged Showdown's `activeTurns` by one on turn 1** — two symptoms: (a) **Speed Boost** skipped its end-of-T1 boost (in-house 0/1/2 vs Showdown 1/2/3); (b) **Stakeout** wrongly ×2 vs a turn-1 lead | the two gates read `turnCount` (incremented at END of turn) — **repointed** to a turn-start active snapshot (`state._turnStartActives`) that mirrors `activeTurns`: a lead counts on T1, a mid-turn switch-in does not. `turnCount` itself is unchanged, so the AI's `isFreshMatchup`/Dynamax window is **untouched** | `battle.html` Speed Boost gate + Stakeout gate + turn-start snapshot | Low–Med |
| 3 | ✅ **FIXED** | **Gravity did not restrict Gravity-incompatible moves** — Fly/Bounce/Splash/Jump Kick/Magnet Rise worked under Gravity | move-resolution had no `state.gravity` precondition — **added** a Gravity-banned set that fails the move before charge | `battle.html` (Gravity gate before the two-turn block) | Med |
| 4 | ✅ **FIXED** | **Facade did not bypass the burn Attack-drop** — a burned Facade netted ×2 (Facade) × ½ (burn) = ×1, half its real power | burn-halving wasn't exempted for Facade — **added** `&& move.name !== "Facade"` | `battle.html` burn-halving line (~24186) | Low–Med |

Findings #1 and #3 are the original hand-audit catalogue (#1, #2). **Finding #2
(the `turnCount` timing) is new — surfaced by the oracle, not the hand audit; the
Stakeout symptom was found in the order/timing round and confirms the root cause.**
Finding #3 was thought to need a bespoke legality test; the oracle corroborated it
and a direct test (`engine-fixes.test.js`) now locks the fix in.

**Fix verification:** #1 — the 5 `seminvuln-selfboost-*` scenarios flipped `diverge→match`
plus a fix-proof marker in `oracle.test.js`. #2 — `speed-boost-ramp` now agrees (lead 1/2/3),
a new `speed-boost-switchin` scenario proves a switched-in mon does NOT boost on entry,
the `ability-stakeout-lead` sweep now overlaps, and `engine-fixes.test.js` asserts Stakeout
×2 for a switch-in but not a lead. #3 & #4 — direct in-house assertions in `engine-fixes.test.js`
(differential play can't cleanly assert a move-legality fix, since Showdown substitutes a
default for the illegal choice). Oracle CI **22/22**, engine-fixes **3/3**, **0 false positives**.

## Confirmed CORRECT (broad agreement with Showdown — do not re-investigate)
Damage formula & flooring · STAB · type chart incl. **Freeze-Dry vs Water** ·
type immunities (EQ vs Flying/Levitate, TBolt vs Ground) · ability absorbs
(Volt/Water Absorb, Flash Fire, Sap Sipper) · Ghost immunities · **Air Balloon** ·
ability-ignoring (**Mold Breaker** vs Levitate/Thick Fat, **Scrappy** vs Ghost) ·
status application + **status immunities** · stat-change moves · **fixed-damage** ·
Toxic ramp · multi-hit · **Protect** & **Substitute** · **Sturdy** & **Focus Sash** ·
**Intimidate** & **Stealth Rock** on switch-in · **Prankster-vs-Dark** immunity ·
**Psychic Terrain** priority-block · **Gravity grounding** (Flying loses Ground
immunity) · **Weakness Policy** (+2 on super-effective) · **recoil** (Brave Bird
33%, Life Orb 10% — exact) · **contact-punish** (Rough Skin 1/8, Rocky Helmet 1/6 —
exact) · **Knock Off** ×1.5 vs item-holder · **Skill Link** 5-hit · **Flame/Toxic
Orb** self-status · **Sandstorm** chip + Rock ×1.5 SpD · **turn order** (faster-first), **priority** (Quick Attack lets the slower move
first), **Trick Room** (slower-first reversal), **Gale Wings** & **Triage** priority ·
**Analytic** ×1.3 (moving last) · **self-KO** (Explosion) · **Super Fang** (½ current
HP) · variable BP: **Hex**, **Acrobatics**, **Gyro Ball**, **Weather Ball**, **Stored
Power** · **Guts** ×1.5 (ignores burn drop) · **Marvel Scale** ×1.5 Def · **burn**
halves physical (the ±1 HP stage-order quirk does not shift the range) · the full
multiplier layer (Choice Band/Specs, Life Orb, type items, Expert
Belt, Tinted Lens, Muscle Band, Wise Glasses; Huge Power, Adaptability, Technician,
Sheer Force, Tough Claws, Iron Fist, Strong Jaw, Mega Launcher, Reckless,
Neuroforce, Thick Fat, Multiscale, Filter, Fur Coat, Ice Scales, Heatproof, Fluffy,
Dry Skin; weather ×1.5/×0.5, Reflect/Light Screen, Electric/Grassy Terrain).

**Bottom line:** across ~117 probes the engine matches Showdown *everywhere* except
the four findings above (Stakeout being a second face of #2). The correctness floor
is high — the gap was coverage and proof, not pervasive wrongness — which supports
converging the in-house engine against the oracle rather than replacing it.

## Harness-fidelity issues found & fixed during the build
The oracle is only as trustworthy as the harness; **four** apparent "divergences"
were traced to the harness/methodology, not the engine, and resolved. (Be skeptical
of findings — verify the harness before blaming the engine.)

1. **Held-item effects suppressed.** The in-house oracle's battle `state` omitted
   field flags, leaving `state.magicRoom` `undefined` → `_defItemActive` false →
   *all* held items disabled. Surfaced as a false "Air Balloon" divergence. Fixed by
   initializing the full neutral field-state (`inhouse-oracle.mjs`).
2. **Asymmetric damage accounting.** The sweep measured in-house damage as net
   end-of-turn HP but Showdown as raw move damage, so Grassy Terrain's end-of-turn
   heal made in-house look ~1/16 lower. Fixed by measuring both as net HP drop.
3. **Eviolite untestable headlessly (FALSE-POSITIVE caught).** With/without Eviolite
   was byte-identical in-house → looked like "Eviolite not implemented." It *is*
   implemented (`battle.html:23582`), but the NFE check reads
   `getPssDex().species.get(name).evos`, and the harness stubs `@pkmn/dex`
   (`load-engine.js:167-185`, CDN blocked) so `evos` is always empty → Eviolite
   no-ops *in the harness only*. The scenario was removed; **any `getPssDex`-dependent
   feature (evolution data) cannot be probed headlessly.**
4. **Crit-masked multiplier gaps (methodology hardening).** Range-overlap alone let
   an occasional Showdown crit inflate its max enough to overlap a genuinely shifted
   in-house range (this is what initially hid the Eviolite gap). Added a crit-proof
   **min-skew** check: over many seeds each engine's *minimum* is a no-crit low roll,
   so a >1.2× min-skew now flags a real multiplier gap regardless of crits
   (`damage-sweep.mjs`).
5. **Move-order probe counts the announce line, not the resolution (recharge
   re-checked).** A `checkOrder` probe flagged Hyper Beam's recharge turn as a
   divergence. On investigation this was **neither a bug nor an input-layer artifact**:
   recharge *is* enforced in the engine move path (`battle.html:22605`), and it fires
   headlessly — the T2 trace is `"Tauros used Hyper Beam! | Tauros must recharge!"` with
   **no damage dealt**. The probe was fooled because `"X used <move>!"` is logged *before*
   the recharge guard, so the order parser counted a mover that then fizzled. Takeaway:
   the `order` field counts move *announcements*; for moves that can fizzle after the
   announce (recharge, full-paralysis, flinch) it over-counts. The kept order scenarios
   (priority / Trick Room / Gale Wings / Triage) all resolve normally, so they're
   unaffected; the recharge scenario was withdrawn.

## Next step
**Stage 1 is complete — all four findings fixed, oracle-verified, CI-guarded** (oracle
22/22, engine-fixes 3/3, 0 false positives). #2 used the recommended targeted approach:
Speed Boost + Stakeout now read a turn-start active snapshot, so `turnCount` and the AI's
`isFreshMatchup`/Dynamax window are untouched. No open differential findings remain in
scope; re-run `npm run test:differential` (or the `tests/differential/*.test.js` CI gate)
to regenerate the evidence.
