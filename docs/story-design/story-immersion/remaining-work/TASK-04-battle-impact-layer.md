# TASK-04 — Battle Impact Layer (game-feel)

> Stream 3 shipped **multi-hit screen-shake/hit-sound parity** only. The rest of the §6
> impact layer is still **design-only**. Purely visual — no state/RNG/damage effect — but
> still needs game-feel sign-off (it's player-visible).
>
> **Bundles:** §6.1 hit grading · §6.2 hit-stop · §6.3 screen-shake wiring. One coherent
> "make hits feel like they land" feature.

---

## Goal

Make type-effectiveness and crits **visible on impact** — graded flash + screen-shake +
a tiny hit-stop — building on the `_battleHitShake` helper that already exists.

## Why it matters
Stream 3 §6: in-battle "game feel." A super-effective hit and a resisted hit currently look
identical except in the log. Grading the impact makes the battle read at a glance.

## Status today
- ✅ **Already shipped (do NOT redo):** `_battleHitShake('crit'|'super')` — the shared
  helper that shakes on crit/super-effective for BOTH single- and multi-hit paths, gated by
  `settings.animations` + reduced-motion, with `playHitSound` parity. (`battle.html:12687`.)
- 🔴 **Still design-only:** §6.1 hit grading tiers, §6.2 hit-stop, §6.3 wiring the dormant
  `.anim-shake` CSS.

## Sub-tasks

### 4a — §6.1 Hit grading
Replace the bare `anim-hit-flash` class-add (16 call sites, `battle.html:22550–24715`) with
one helper `_applyHitImpact(spriteEl, { effectiveness, crit, bossPhase })` that grades:

| Hit | Flash | Shake | Hit-stop | Sound |
|---|---|---|---|---|
| Normal / not very effective | hit-flash (0.4 s) | — | — | move sfx |
| Super-effective | hit-flash | soft shake | — | move sfx |
| Critical | hit-flash | hard shake | 90 ms | crit chime |
| Boss-phase trigger | hit-flash | hard | 120 ms | `danger` + boss banner |

Gate on `settings.animations`; **stop at flash when `StoryFx.isReducedMotion()`** (no shake/
hit-stop under reduced motion). Reuse `_battleHitShake` for the shake tier rather than
re-wiring shake from scratch.

### 4b — §6.2 Hit-stop (new primitive, tiny)
A `_hitStop(ms)` that briefly freezes the animation tick (90 ms crit / 120 ms boss-phase).
Reduced-motion bypasses it.

### 4c — §6.3 Screen-shake wiring
The §6.1 helper calls a `_screenShake('soft'|'hard')`. The dormant `.anim-shake` CSS exists
(`battle.html:4402`, `@keyframes shakeScreen`). Stream 3 deliberately **left `.anim-shake`
untouched** when shipping `_battleHitShake` (it used anime.js inline). Decide: either route
`_screenShake` through `_battleHitShake` (already proven, reduced-motion-aware) or finally
wire `.anim-shake`. **Prefer reusing `_battleHitShake`** — `.anim-shake` is otherwise dead
weight, and one shake path is better than two.

## Anchors (verified 2026-06-08)

| Symbol | Line | Role |
|---|---|---|
| `_battleHitShake(kind)` | `12687` | Shipped shake helper — reuse for the shake tier |
| `.anim-hit-flash` / `@keyframes hitFlash` | `4406` | Baseline flash to wrap in `_applyHitImpact` |
| `.anim-shake` / `@keyframes shakeScreen` | `4402` | Dormant CSS — reuse-or-retire decision |
| hit-flash call sites | `22550–24715` (16 sites) | Where to swap in `_applyHitImpact` |
| `StoryFx.isReducedMotion()` | (anchor) | The reduced-motion gate (must honor) |
| `settings.animations` | (anchor) | The animations master gate |

## Dependencies
- None. Independent of the other tasks. Reuses the already-shipped `_battleHitShake`.

## Sign-off needed
- **Game-feel sign-off** (visual behavior change). Propose the grading table + shake
  intensities; maintainer picks the feel. Confirm no double-shake when a hit is BOTH
  super-effective and crit.

## Test plan (jsdom)
- `_applyHitImpact` adds the right classes per tier (assert class list per
  effectiveness/crit combo); reduced-motion path adds flash only, no shake/hit-stop.
- No damage/RNG/state mutation in the impact path (snapshot battle state before/after).
- Single shake path: super+crit hit shakes once, not twice.
- `battle-hit-impact.test.js` (the parity guard) stays green.
