# Intentional Deviations From VGC

This file documents mechanics in the battle engine that deliberately deviate from
competitive Pokemon Showdown / VGC behavior. The audit and property tests load
this file and skip listed entries so that intentional design choices are not
flagged as bugs.

Format: each entry includes the affected move/ability/item, the engine location,
and the rationale.

## Story Mode Artifacts

These only apply when `state.mode === 'story'` and grant additional power scaling
that has no VGC analog.

### Glass Cannon Pact
- **Effect**: +25% damage to ALL attacks, both sides
- **Engine**: `battle.html:21476` (`if (state._glassCannonPact) damage = Math.floor(damage * 1.25);`)
- **Rationale**: Story-mode artifact that increases match volatility
- **Test impact**: damage-formula tests must check whether `state._glassCannonPact` is set; if so, expected values are scaled ×1.25

### Type Amplifier
- **Effect**: Attacks of the chosen type +30% damage; Pokemon of the chosen type take +15% damage
- **Engine**: `battle.html:21478-21481`
- **Rationale**: Story-mode artifact for type-themed runs
- **Test impact**: only active when `state.mode === 'story' && state._typeAmplifierType` set; tests run with story mode off by default

## Fixed-Damage Overrides

These are VGC-accurate but worth noting as exceptions to the standard damage formula.

### Final Gambit
- **Effect**: Damage equals attacker's current HP; attacker faints
- **Engine**: `battle.html:21483`
- **Note**: VGC-correct, but the property test `damaging-nonzero.test.js` must NOT expect normal damage scaling

### Night Shade / Seismic Toss
- **Effect**: Fixed damage = user's level (50 at Lv50)
- **Engine**: `battle.html:21485`
- **Note**: VGC-correct

### Dragon Rage
- **Effect**: Fixed 40 damage
- **Engine**: `battle.html:21487`
- **Note**: VGC-correct

### Sonic Boom
- **Effect**: Fixed 20 damage
- **Engine**: `battle.html:21488`
- **Note**: VGC-correct

### Super Fang / Nature's Madness / Ruination
- **Effect**: Halves target's current HP
- **Engine**: `battle.html:21490-21492`
- **Note**: VGC-correct

### Endeavor
- **Effect**: Sets target HP equal to user's HP; fails if user has more HP
- **Engine**: `battle.html:21494-21497`
- **Note**: VGC-correct

## Moves With Preconditions Property Tests Cannot Easily Fabricate

These moves are VGC-correct but require specific battle context that the property
tests don't replicate (skipped via `tests/fixtures/deviations.js`).

### Burn Up
- **Precondition**: User must be Fire type. Fails otherwise.
- **Note**: Engine-correct; tests use Mew (Psychic) attacker.

### Double Shock
- **Precondition**: User must be Electric type.
- **Note**: Engine-correct.

### Future Sight / Doom Desire
- **Precondition**: Damage is delayed 2 turns; first turn shows no HP change.
- **Note**: Engine-correct.

### Snore
- **Precondition**: User must be Asleep (status = SLP).
- **Note**: Engine-correct.

### Steel Roller / Ice Spinner
- **Precondition**: A terrain must be active for full effect; Steel Roller fails entirely if no terrain.
- **Note**: Engine-correct.

### Belch
- **Precondition**: User must have eaten a Berry this battle (`volatile.belchReady`).
- **Note**: Engine-correct after commit 8e139ae moved the failure gate to before damage application. The property test can't easily fabricate the berry-eaten state; the dedicated `tests/moves/by-category/special.test.js` Belch test covers both arms (no berry → no damage; `belchReady` → damage as expected).

### Counter / Mirror Coat / Metal Burst / Bide
- **Precondition**: Requires a Physical/Special hit from the opponent on this turn.
- **Note**: Engine-correct; tests can't easily set up the opponent's prior hit.

### Sucker Punch / Upper Hand / Revenge / Assurance / Avalanche
- **Precondition**: Requires opponent to be using or have used an attack.
- **Note**: Engine-correct.

### Fake Out
- **Precondition**: Must be used on user's first turn out (fakeOutOk = true).
- **Note**: Engine-correct, but property tests use `reset()` so fakeOutOk persists.

### Last Resort
- **Precondition**: All other moves in the user's moveset must have been used.
- **Note**: Engine-correct.

### Beat Up
- **Precondition**: Damage scales with party. Single-mon tests undercount.
- **Note**: Engine-correct.

### Magnitude
- **Effect**: Power is randomized 10-150 each use.
- **Note**: Engine-correct; on a Magnitude 4 roll, damage may be tiny.

### Pursuit
- **Precondition**: Damage doubles only when target switches.
- **Note**: Engine-correct.

## How To Add Entries

When a property test fails on a move that should NOT be checked against VGC:
1. Add an entry here with the move name, effect, engine location (file:line), rationale
2. Update the property test's opt-out array to skip the move by name
3. Cross-reference this file in the skip comment so future maintainers find the rationale

## Schema For Test Consumers

```js
// /tests/reports/deviations.md is human-prose; for programmatic skips, mirror
// the list in /tests/fixtures/deviations.js as:
export const skipMoves = {
  'damaging-nonzero': ['Final Gambit'],  // user faints, damage = own HP
  'status-no-damage': ['Pain Split', 'Endeavor', 'Final Gambit'],
  // ...
};
```
