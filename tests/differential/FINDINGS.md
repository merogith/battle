# Differential Oracle — Findings Log

> What the Showdown differential harness (`@pkmn/sim`, MIT) established about the
> in-house engine, as of the Stage 0 / expanded-map pass. Regenerate the evidence
> with `npm run test:differential` (writes `DIVERGENCE_REPORT.md` +
> `DAMAGE_SWEEP_REPORT.md`). **No engine code has been changed yet.**

## Coverage
**69 probes** — 50 categorical scenarios (`scenarios.mjs`) + 19 damage-modifier
sweeps (`damage-sweep.mjs`) — across: two-turn/semi-invulnerable, type/ability/item
immunities & absorbs, ability-ignoring (Mold Breaker, Scrappy), status application
& immunities, stat-change moves, fixed-damage, Protect/Substitute, survival
(Sturdy/Focus Sash), Speed Boost, switch-in hooks (Intimidate, Stealth Rock), and
the full multiplier layer (Choice items, Life Orb, type items, Expert Belt, Tinted
Lens, Huge Power, Adaptability, Technician, Thick Fat, Multiscale, Mold Breaker,
weather, screens, terrain).

## Real divergences from Showdown (candidate fixes)

| # | Finding | Root cause | Location | Catchable by | Severity |
|---|---|---|---|---|---|
| 1 | **Self-target / field moves "miss" vs a semi-invulnerable foe** (Fly/Dig/Dive/Bounce/Phantom Force/Shadow Force/Sky Drop) — the reported Fly bug | invuln check lacks the `move.cat !== "Status" \|\| !SELF_TARGETING_STATUS.has(name)` guard | `battle.html:23087-23110` | differential (boosts) | High |
| 2 | **Speed Boost off-by-one** — a lead skips its end-of-turn-1 boost (in-house 0/1/2 vs Showdown 1/2/3) | gated on `turnCount > 0`, and `turnCount++` (battle.html:21682) runs *after* `endOfTurnEffects` (21676) | `battle.html:28706` | differential (boosts) | Low–Med |
| 3 | **Gravity does not prevent Fly/Bounce** — they charge & go airborne under Gravity | two-turn block has no `state.gravity` precondition | `battle.html:22611-22667` | direct assertion (legality, not differential) | Med |

Findings #1 and #3 are the original catalogue (#1, #2). **Finding #2 (Speed Boost)
is new — surfaced by the oracle, not the hand audit.**

## Confirmed CORRECT (broad agreement with Showdown — do not re-investigate)
Damage formula & flooring · STAB · type chart incl. **Freeze-Dry vs Water** ·
type immunities (EQ vs Flying/Levitate, TBolt vs Ground) · ability absorbs
(Volt/Water Absorb, Flash Fire, Sap Sipper) · Ghost immunities (Normal & Fighting) ·
**Air Balloon**, ability-ignoring (**Mold Breaker** vs Levitate/Thick Fat,
**Scrappy** vs Ghost) · status application + **status immunities** (burn vs Fire,
para vs Electric/Ground) · stat-change moves · **fixed-damage** (Seismic Toss,
Night Shade, Dragon Rage, Sonic Boom) · Toxic ramp · multi-hit · **Protect** &
**Substitute** · **Sturdy** & **Focus Sash** · **Intimidate** & **Stealth Rock**
on switch-in · the full multiplier layer (Choice Band/Specs, Life Orb, type items,
**Expert Belt**, **Tinted Lens**, **Huge Power**, **Adaptability**, **Technician**,
**Thick Fat**, **Multiscale**, **weather** ×1.5/×0.5, **Reflect/Light Screen**,
**Electric/Grassy Terrain**).

**Bottom line:** across ~70 probes the engine matches Showdown *everywhere* except
the three findings above. The correctness floor is high — the gap was coverage and
proof, not pervasive wrongness — which supports converging the in-house engine
against the oracle rather than replacing it.

## Harness-fidelity issues found & fixed during the build
The oracle is only as trustworthy as the harness; two false "divergences" were
traced to the harness and fixed (be skeptical of findings):

1. **Held-item effects suppressed.** The in-house oracle's battle `state` omitted
   field flags, leaving `state.magicRoom` `undefined` → `_defItemActive`
   (`battle.html:23574`) false → *all* held items disabled. Surfaced as a false
   "Air Balloon" divergence. Fixed by initializing the full neutral field-state
   (`inhouse-oracle.mjs`, mirroring `battle.html:17317-17321`).
2. **Asymmetric damage accounting.** The sweep measured in-house damage as net
   end-of-turn HP but Showdown as raw move damage, so Grassy Terrain's end-of-turn
   heal made in-house look ~1/16 lower. Fixed by measuring both as net HP drop
   (`damage-sweep.mjs`).

## Next step (not yet done — awaiting direction)
Stage 1 fixes, each oracle-verified before commit: the self-target guard (#1),
the Gravity gate (#3, + a direct legality test), and the Speed Boost ordering (#2).
When a fix lands, flip the corresponding scenario's `expect` to `match` and update
`oracle.test.js`.
