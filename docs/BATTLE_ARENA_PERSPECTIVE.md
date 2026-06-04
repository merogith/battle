# Battle Arena — background & perspective model

> Why the foe sometimes looked like it was *in the crowd*, how the fix works, and the knobs
> to tune it. Companion to `docs/BATTLE_RESPONSIVE_LAYOUT_AUDIT.md` (that one owns the
> responsive `arena`/`stack` layout; this one owns where the Pokémon stand in the scene).

## The scene is 2.5D: a photographic backdrop + two sprites that must stand on the pitch

Two background sets remain (`sprites/backgrounds/battle/{landscape,portrait}/bg_*.png`,
1536×1024), each a painted stadium:

- **`landscape/`** — used by the **arena** template on *every* landscape screen (desktop frame,
  laptop, phone/tablet landscape). Low player's-eye angle: the **pitch fills the bottom ~50%**
  as a flat plane, crowd + jumbotron behind it. Sprites stand on it naturally.
- **`portrait/`** — used by the **stack** template.

> A third set, `desktop/`, was **retired** (2026-06). It was a high/wide angle where the pitch
> was a shallow oval *ringed by crowd on all sides* — there was no good place to stand a sprite,
> which is what made the foe read as "in the crowd" on desktop. Desktop/laptop now use the same
> deep-field `landscape/` stadium as phone-landscape. Revive via git history if ever needed.

Reading a `landscape/` image top → bottom:

```
┌───────────────────────────┐  roof / lights
│        jumbotron          │  ~5–18%
│      stands / crowd       │  ~18–45%
│■■■ barrier + tunnel ■■■■■■■│  ~45–52%
│      PITCH (tiles)        │  ~52–100%  ← deep flat field, pokéball logo lower-centre
└───────────────────────────┘
```

So a sprite reads as "battling" when its **feet land in that bottom field band**.

## The bug we originally hit (historical — kept for the model)

Two independent systems decide where things sit, and they disagreed:

1. **Background** — `background-size: cover` anchored to the **bottom**
   (`background-position: center bottom calc(var(--battle-ui-h) - var(--arena-bg-shift-y))`).
   Bottom-anchored cover keeps the *pitch* (bottom of the image) near the command bar and crops
   the *crowd* (top) off-screen.
2. **Sprites** — absolutely positioned with their own offsets.

The **player** was bottom-anchored (correctly on the pitch). The **foe** was *top*-anchored
(`top: …`), which has no idea where the cropped pitch ended up — so it floated up into the
stands, and *drifted* as the container aspect changed (worst on the 4:3 iPad). On top of that,
`--arena-bg-shift-y` was a big `5cm`, which shoved the pitch **down behind the command bar**,
leaving only the *barrier wall* visible as "field" — so even a correctly-lowered foe landed on
the wall, not the tiles.

## The fix (placement only — no new art)

Two coupled changes, both keyed off the live container size so they hold from phone-landscape
to the 4K desktop frame (sizing is in CSS container-query units — see the layout audit):

1. **Reveal the pitch.** `arena` overrides `--arena-bg-shift-y: 0.8cm` (was `5cm`). The stadium
   art slides up so the tiles fill the lower arena instead of hiding behind the command bar.
2. **Stand both sprites on the pitch, bottom-anchored.** Foe and player are both measured up
   from the command bar; the foe sits a band **above** the player for near/far depth:
   - player feet: `bottom: var(--battle-ui-h) + clamp(34px, 7cqh, 94px)`  (front of field)
   - foe feet:    `bottom: var(--battle-ui-h) + clamp(40px, 21cqh, 240px)` (back of field)

   `stack` applies the same idea to its (taller) portrait field so the foe doesn't float up by
   the jumbotron on tall tablets: `bottom: var(--battle-ui-h) + clamp(56px, 20cqh, 300px)`.

### Why the aspect-dependence is fine

`cover` crops differently by shape, and that works *for* us:
- **16:9 (desktop):** the 3:2 image is width-driven, so it's tall → more crowd crops away → the
  pitch dominates. Reads as "down on the field."
- **4:3 (iPad landscape):** height-driven → the whole stadium height shows → more grandeur
  (jumbotron + crowd) with the pitch still in the lower band.

Both keep both Pokémon on the tiles; only how much *stadium* is visible changes — which is the
natural, expected behaviour of a stadium camera, not a bug.

## Knobs (all in `#screen-battle[data-battle-layout="arena"]` unless noted)

| Knob | Effect | Current |
|---|---|---|
| `--arena-bg-shift-y` | ↑ hides pitch behind the command bar; ↓ reveals more pitch | `0.8cm` (stack/base: `5cm`) |
| foe `#foe-sprite-container { bottom }` | how far **back** on the pitch the foe stands | `var(--battle-ui-h) + clamp(40px,21cqh,240px)` |
| player `#player-sprite-container { bottom }` | how far **forward** the player stands | `var(--battle-ui-h) + clamp(34px,7cqh,94px)` |
| `--sprite-foe-w` / `--sprite-player-w` | near/far size ratio (≈1.6× player) | container-unit `min()` |

Tuning rule of thumb: keep `foe.bottom > player.bottom` (depth), and keep the foe offset under
~½ the arena height so it never climbs past the barrier into the crowd.

Verify visually with `OUT=/tmp/shots TAG=x node scripts/debug/battle-layout-shots.mjs`
(set `VP=desktop-1280,ipad-landscape` to focus; `EXP_CSS='…'` to sweep values without editing
`battle.html`).

## If we want to push it further (not done — flagged for a future pass)

The placement fix gets us "both Pokémon clearly on the pitch" robustly. Beyond that, in rough
order of effort/payoff:

1. **Stronger platform discs.** Make the foe/player shadow ellipses a touch larger/denser so
   "standing here" is unmistakable. ~4 lines, low risk.
2. **A UI ground-plane.** Render a subtle elliptical floor highlight in the lower arena band,
   fully decoupling grounding from the bg art (closest to mainline Pokémon's explicit bases).
   Most robust; slightly changes the vibe.
3. **Backdrop + ground split / new art.** Author the stadiums as a far backdrop (sky/crowd) plus
   a separate, deeper ground plane — or simply repaint with a lower horizon / deeper pitch so
   there's more field to stage two Pokémon at distinct depths. Biggest payoff, art-dependent.

Recommendation: ship the placement fix (done); pick up #1 or #2 only if the foe still reads as
"placed on" rather than "standing in" the scene at the sizes you actually play.
