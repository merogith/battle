# Camp Micro-games — Resonant Palette (mechanic-adaptation backlog)

> Companion to [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md). Adapts best-practice micro-game
> *mechanics* to the Pokémon camp, organized so each game's **feel echoes the stat it builds**
> and its **theme echoes the attachment style.** This is a **palette / idea backlog** — the
> locked v1 set is the 18 in `CAMP_MINIGAMES §2`; the maintainer picks which of these ship and
> tunes the vibe + copy. **Content/config only — no item economy; the reward is always the
> bonding +1.** Seeded (`storyRngNext`), data-driven, edgier tone with copy sign-off. Original
> content, genre inspiration only (no IP lift — `CAMP_MINIGAMES §3`).

---

## 1. The vibe principle — *double resonance*
Every micro-game should answer **both** coherence axes at once. That's the "vibe":

- **Stat resonance (how it plays).** The *mechanic family* mirrors the stat it masters — Attack
  = land the decisive hit, Defense = hold the line, Speed = be quick, etc. (ludonarrative
  resonance — the verb *is* the stat).
- **Attachment resonance (how it feels).** The *theme + tone* mirror the relationship path —
  Praise is triumphant, Intimidate is cold, Devotion is intimate-and-edgy.

Choose mechanics that satisfy **both**. A timing-strike themed as a tender caress would be
*off-vibe*; a timing-strike themed as a hype-up high-five is *on-vibe* for Praise→Attack.

## 2. Path × mechanic-family map
| Path | → Stat | Mechanic family (stat resonance) | Vibe (attachment resonance) |
|---|---|---|---|
| **Praise** | `atk` | **Timing & Precision** — one-shot strikes | triumphant, percussive |
| **Discipline** | `def` | **Rapid Input + Block** — endurance / guard | grueling, strict |
| **Mimicry** | `spe` | **Observation & Memory** — quick read / mirror | playful, mischievous |
| **Intimidate** | `spd` | **Reflex & Evasion + "Do Nothing"** — willpower | cold, tense, unsettling |
| **Nurture** | `spa` | **Physics / Finesse + Catching** — gentle skill | warm, careful, tender |
| **Devotion** | `hp` | **Finesse / Balance + Stamina** — linger / endure | intimate, slow, edgy-romance |

## 3. Per-path palette (themed adaptations of the 30)
Primitives marked **†** are *new* (see §4); the rest already exist in `CAMP_MINIGAMES §5`.

**Praise → `atk` · Timing & Precision** — *triumphant, percussive*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **High Five!** | Single-Beat Strike | slap its paw as it swings up | `tapTiming` |
| **Hype Chant!** | Sequence Tap | match the 3–4-beat victory chant | `sequence` |
| **Charge Up!** | The Release | hold the cheer, let it rip at peak roar | `holdRelease` |

**Discipline → `def` · Rapid Input + Block** — *grueling, strict*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Laps!** | Button Masher | outpace the decaying stamina bar | `mash` |
| **March!** | Pumping Action | alternate L-R to hold the drill cadence | `mash` (alt) |
| **Brace!** | Shield Block | raise the guard onto the incoming pad | `block` **†** |

**Mimicry → `spe` · Observation & Memory** — *playful, mischievous*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Copy!** | Flash Memory | reproduce the gesture flashed for 1 s | `sequence` |
| **Pose!** | Pattern Matcher | pick the silhouette that matches its pose | `pickMatch` |
| **Keep Up!** | Shell Game | track it as it darts between cover | `track` |

**Intimidate → `spd` · Reflex/Evasion + Do Nothing** — *cold, tense, unsettling*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Don't Blink!** | The "Do Nothing" | a staring contest — *any* input = flinch = fail | `restraint` |
| **Flinch Test!** | Quick Dodge | it feints; react only on the real lunge | `dodge` **†** |
| **Cold Read!** | Anomaly Hunt | spot the one tell in the crowd before it bolts | `pickMatch` (find-odd) |

**Nurture → `spa` · Finesse + Catching** — *warm, careful, tender*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Berry Toss!** | Catching Basket | catch the berries it lobs back to you | `catch` **†** |
| **Feed!** | Trajectory Toss | arc its favourite treat into its mouth (angle+power) | `lobAim` **†** |
| **Groom!** | The Steady Hand | clean the delicate spot without slipping | `steady` **†** |

**Devotion → `hp` · Balance + linger** — *intimate, slow, edgy-romance*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Hold Close!** | Balancing Act | counter the tip as it leans its weight into you | `balance` **†** |
| **Caress…** | The Steady Hand | a slow trace; touch a boundary and the moment breaks | `steady` **†** |
| **Linger…** | The Release | hold the gaze, release — maybe a beat too long *(the edgy note)* | `holdRelease` |

## 4. Toolkit expansion (the new primitives implied)
Each is "one small, individually-tested function returning a **Promise<boolean>**"
(`CAMP_MINIGAMES §5`) — expansion is a few functions + data, **never a refactor**:

`block` **†** (move a defensive hitbox onto an incoming direction) · `dodge` **†** (single
directional evade on the real tell) · `catch` **†** (slide a catch-zone to collect good / avoid
bad) · `lobAim` **†** (set an angle + power for a parabolic toss) · `steady` **†** (micro-moves;
touching the boundary fails) · `balance` **†** (continuous correction to hold an angle upright).

That takes the toolkit from **9 → ~15** primitives, each reused across multiple games/paths. The
remaining categories in the source list (navigation/maze, platformer, crank/spin, intercept,
gauge-stopper, quick-math) are a **further backlog** if more variety is ever wanted.

## 5. Staged ("Party") format
A path's *signature* game can chain **2–3 of these as quick stages** (Mario-Party-style), each
stage one primitive, clear all → the normal **+1**:

```jsonc
// e.g. a Nurture signature game, themed gather→cook→feed (FLAVOR, not an economy):
{ "name":"Picnic!", "stages":[
    {"primitive":"tapTiming","theme":"forage the right berries"},
    {"primitive":"sequence","theme":"stir the cook-pot in order"},
    {"primitive":"lobAim","theme":"serve it into their mouth"} ],
  "copy":"…", "art":"…" }
```

Keep each stage WarioWare-short so the whole thing stays **≈ 4–6 s and skippable-fast**. No new
engine — a staged game is just `{ stages:[{primitive,config}], copy, art }` over the existing
toolkit.

## 6. Guardrails (same as the core doc)
Seeded · data-driven · **pass/fail → +1** · **no item economy / no crafting** (gather & cook are
*flavor themes*, not a resource loop — [`CAMP_BAG.md`](./CAMP_BAG.md) §7) · edgier tone with
**maintainer copy sign-off** · original content (no IP lift). The maintainer picks the shipping
set, maps games into the `actions.games[]` pools (`CAMP_MINIGAMES §8`), and tunes the vibe/copy.
