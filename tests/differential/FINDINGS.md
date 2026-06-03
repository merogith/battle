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

| # | Finding | Root cause | Location | Catchable by | Severity |
|---|---|---|---|---|---|
| 1 | **Self-target / field moves "miss" vs a semi-invulnerable foe** (Fly/Dig/Dive/Bounce/Phantom Force/Shadow Force/Sky Drop) — the reported Fly bug | invuln check lacks the `move.cat !== "Status" \|\| !SELF_TARGETING_STATUS.has(name)` guard | `battle.html:23087-23110` | differential (boosts) | High |
| 2 | **`turnCount` lags Showdown's `activeTurns` by one on turn 1** — `turnCount++` runs at END of turn (`battle.html:21682`) while Showdown increments at turn START. Two symptoms: (a) **Speed Boost** skips its end-of-T1 boost (in-house 0/1/2 vs Showdown 1/2/3); (b) **Stakeout** wrongly ×2 vs a turn-1 lead (in-house 2× Showdown on T1, equal on T2) | end-of-turn `turnCount++` timing vs the `turnCount===0` / `> 0` gates | `battle.html:28706` (Speed Boost), `:24149` (Stakeout) | differential (boosts + damage sweep) | Low–Med |
| 3 | **Gravity does not restrict Gravity-incompatible moves** — Fly/Bounce/Splash/Jump Kick/Magnet Rise still work under Gravity (Fly charges & goes airborne; Splash executes) | two-turn / move-lock block has no `state.gravity` precondition | `battle.html:22611-22667` | differential (corroborated: a Gravity-locked Splash made Showdown Struggle; in-house Splashed) | Med |
| 4 | **Facade does not bypass the burn Attack-drop** — a burned Facade nets ×2 (Facade) × ½ (burn) = ×1, i.e. **half** its real power (in-house burned≈unburned ratio ~1.0 vs Showdown ~2.0) | BP is doubled but the move isn't exempted from burn halving | `battle.html:23764` | differential (damage sweep) | Low–Med |

Findings #1 and #3 are the original hand-audit catalogue (#1, #2). **Finding #2
(the `turnCount` timing) is new — surfaced by the oracle, not the hand audit; the
Stakeout symptom was found in the order/timing round and confirms the root cause.**
Finding #3 was thought to need a bespoke legality test; the oracle corroborates it
directly.

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
5. **Input-layer move-locks not exercisable.** The harness drives turns with an
   explicit move slot (`playTurn(slot)`), which bypasses the input layer that
   auto-submits a forced action when a mon is locked. So **recharge** (Hyper Beam),
   **Outrage/Thrash** lock, **Encore**, **Disable**, **Choice-lock** and **Sky Drop**
   can't be tested here — the engine DOES set the lock (verified `volatile.recharge=true`
   after Hyper Beam; enforcement at `battle.html:19430-19441`); only the forced-move
   harness path skips it. Those scenarios were not added / were withdrawn.

## Next step (not yet done — awaiting direction)
Stage 1 fixes, each oracle-verified before commit: the self-target guard (#1), the
`turnCount` timing (#2 — fixes Speed Boost AND Stakeout), the Gravity move-restriction
(#3), and the Facade burn-exemption (#4). When a fix lands, flip the corresponding
scenario's `expect`/`expectDiverge` to agrees and update `oracle.test.js`.
