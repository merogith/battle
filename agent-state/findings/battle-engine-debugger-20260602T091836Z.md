---
severity: P2
category: bug
anchor_symbol: assignGimmickToBuild
current_line_hint: ~12450
file: battle.html
agents: [battle-engine-debugger]
fingerprint: ab9cb77f0970
confidence: high
status: fixed-claude/gracious-goodall-QFuQF
---

**Title**: Dual-mega stone (Charizard/Mewtwo X vs Y) picked with bare Math.random — breaks seeded replay

**Evidence**:
```js
// assignGimmickToBuild, MEGA branch (~12450)
let stone = MEGA_STONE_MAP[name];
if (Array.isArray(stone)) stone = stone[Math.floor(Math.random() * stone.length)]; // ← not seeded
```
`MEGA_STONE_MAP['Charizard'] = ['Charizardite X','Charizardite Y']` (same for Mewtwo). The
whole enemy-team roll is otherwise seeded through `_withEventSeededRng` / `storyRngNext` so a
battle reproduces across refresh/flee/revisit — but this one pick uses `Math.random()`, so the
X/Y outcome diverges between identical loads of the same seeded battle.

**Repro**: Story City 7+ with Mega unlocked + `megaOn`; face a Charizard signature (Blaine /
Leon / Red / Ash / Oak / Veteran Blaine pools). Refresh/flee+revisit the same seeded battle —
the foe can flip between Mega Charizard X and Y.

**Blast radius**: Not cosmetic — Charizard-Mega-X is Fire/Dragon, Tough Claws, physical; Mega-Y
is Fire/Flying, Drought, special. The foe's typing, ability, and threat profile change
non-deterministically, violating the static-roll reproducibility contract (CLAUDE.md: "use
seeded RNG everywhere user-visible; deterministic replays are part of the product"). Same code
path also affects Mewtwo X/Y (Mystery Figure / late aces).

**Fix sketch**: Use the seeded story stream for the array pick when a story run is active —
`(sm && sm.active && window.storyRngNext) ? window.storyRngNext : Math.random` — mirroring the
guard already used in rollTrainerTeam. One line; independent of the (descoped) signature
form-tagging feature.

**Verification**: Roll the same seeded City7+ Charizard-mega battle twice with the story RNG
reseeded between rolls; assert the chosen stone (X vs Y) is identical. Covered by the
trainer-rolls determinism pattern (`rollTrainerTeam: full build reproducible when BOTH rng
streams are reset`).
