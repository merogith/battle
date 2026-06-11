---
severity: P2
category: engine-fidelity
anchor_symbol: setWeatherFromAbility
current_line_hint: ~10967
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 67e11d6f4653
confidence: high
status: open
---

**Title**: Snow Warning maps to Hail (gen-8) instead of gen-9 Snow

**Evidence**:
```js
'Snow Warning':{ weather: 'Hail',      setter: null         },
// ...
if (mon.ability === "Snow Warning") {
    logMsg(`${mon.name}'s Snow Warning whipped up a hailstorm!`, 'info');
```

**Repro**: jsdom harness — switch in an Abomasnow; weather becomes Hail (chip damage every EoT). @pkmn/sim gen-9 sets Snow: no chip damage, Ice-types get x1.5 Def (boost also unimplemented here).

**Blast radius**: Ice Body, Slush Rush, Aurora Veil setup, Blizzard accuracy, build-roll logic (the Aurora Veil Snowscape injection at ~12838), all Hail-only checks in stat calc and end-of-turn.

**Fix sketch**: Add a distinct 'Snow' weather path (no chip, Ice x1.5 Def in physical D calc), make Hail-synergy abilities/moves accept both, then re-map Snow Warning + Snowscape/Chilly Reception to Snow.

**Verification**: Differential probe Snow Warning teams vs @pkmn/sim — EoT HP deltas vanish; new test asserting no chip + Def boost under Snow.

