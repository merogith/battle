# Camp Micro-games — Resonant Palette (mechanic-adaptation backlog)

> Companion to [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md). Adapts best-practice micro-game
> *mechanics* to the Pokémon camp so each game's **feel matches the stat it builds** and its
> **theme matches the attachment style.** Palette / idea backlog — the locked v1 set is the 18 in
> `CAMP_MINIGAMES §2`; the maintainer picks which of these ship and tunes the vibe + copy.
> **Content/config only — no item economy; the reward is always the bonding +1.** Seeded
> (`storyRngNext`), data-driven, edgier tone with copy sign-off. Original content, genre
> inspiration only (no IP lift — `CAMP_MINIGAMES §3`).

---

## 1. The vibe principle — *two axes* (the deep version)
The first cut mis-mapped feel. The fix: a game's *feel* is derived from the **stat**, on two
sub-dimensions; its *theme* is derived from the **path**. Get all three right and it's on-vibe.

**Axis A — Stat TEMPO (how fast it plays).** The defensive stats should feel slow, the offensive
stats bursty, Speed fastest:
- **Speed = FAST** (reflex, real-time, react-now)
- **Attack / Sp.Atk = BURST / in-between** (a charged, decisive moment — not frantic, not slow)
- **Defense / Sp.Def / HP = SLOW & SUSTAINED** (hold, withstand, endure)

**Axis B — Stat LENS (physical vs special vs vital — the Pokémon-native split).** This is the
payoff: the mapping isn't arbitrary, it mirrors Pokémon's own combat language.
- **Attack / Defense = PHYSICAL (body):** strike with contact · brace the body.
- **Sp.Atk / Sp.Def = SPECIAL (mind/energy):** channel/aim at range · withstand with will.
- **HP = VITAL:** sustain, endure, keep the rhythm of life going.

**Axis C — Path THEME/tone (how it feels):** Praise triumphant · Nurture tender · Discipline
grueling · Intimidate cold · Mimicry mischievous · Devotion intimate-edgy.

So each stat lands on a *distinct* feel: melee-burst (atk) vs ranged-aim (spa); body-hold (def)
vs mind-resist (spd); fast-agility (spe); sustained-vitality (hp).

## 2. The map (stat feel → path)
| Path | Stat | Tempo | Lens | Mechanic family | Vibe | Signature game |
|---|---|---|---|---|---|---|
| **Mimicry** | `spe` | **FAST** | agility | Reflex / Evasion + quick-copy | mischievous, darting | **Keep Up!** (track/dodge at speed) |
| **Praise** | `atk` | burst | physical — strike | Timing & Precision | triumphant, percussive | **High Five!** (strike on the beat) |
| **Nurture** | `spa` | controlled | special — ranged/aim | Aim / Trajectory + Catching | tender, warm | **Feed!** (arc the treat in) |
| **Discipline** | `def` | **SLOW** | physical — brace | Block / Hold / Endure | grueling, strict | **Brace!** (hold the guard) |
| **Intimidate** | `spd` | **SLOW** | special — mind | Restraint / "Do Nothing" / Withstand | cold, tense | **Don't Blink!** (any input = fail) |
| **Devotion** | `hp` | **SLOW-sustained** | vital — endure | Steady / Balance / sustained rhythm | intimate, edgy | **Linger…** (hold a beat too long) |

*Read it as a shape:* the two **offensive** paths are quick bursts (melee vs ranged), the three
**defensive/bulk** paths are slow holds (body vs mind vs vitality), and **Speed** is the one pure
fast lane. The physical/special split keeps each pair from feeling the same.

## 3. Per-path palette (retuned to tempo)
Primitives marked **†** are *new* (see §4); the rest exist in `CAMP_MINIGAMES §5`.

**Mimicry → `spe` · FAST · agility** — *mischievous, darting*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Keep Up!** | Sync / real-time track | match its darting movement live | `track` |
| **Quick Dodge!** | The Quick Dodge | it feints — evade only the real lunge | `dodge` **†** |
| **Copy!** | Flash Memory | reproduce the 1-second gesture, fast | `sequence` |

**Praise → `atk` · BURST · physical strike** — *triumphant, percussive*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **High Five!** | Single-Beat Strike | slap its paw as it swings up | `tapTiming` |
| **Combo!** | Sequence Tap | land 2–4 hits in rhythm | `sequence` |
| **Charge Up!** | The Release | hold the charge, unleash at peak roar | `holdRelease` |

**Nurture → `spa` · CONTROLLED · special / ranged** — *tender, warm*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Feed!** | Trajectory Toss | arc its favourite treat into its mouth (angle+power) | `lobAim` **†** |
| **Berry Toss!** | Catching Basket | catch the berries it lobs back | `catch` **†** |
| **Groom!** | The Steady Hand | clean the delicate spot, no slips | `steady` **†** |

**Discipline → `def` · SLOW · physical / brace** — *grueling, strict*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Brace!** | The Shield Block | raise and **hold** the guard onto the hit | `block` **†** |
| **Hold!** | Balancing / isometric | hold the stance; release in the green (overdo backfires) | `holdRelease` |
| **Plant!** | The Steady Hand (under load) | keep position against the push — don't break stance | `steady` **†** |

**Intimidate → `spd` · SLOW · special / mind** — *cold, tense, unsettling*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Don't Blink!** | The "Do Nothing" | a staring contest — *any* input = flinch = fail | `restraint` |
| **Withhold!** | The "Do Nothing" (tempted) | resist the puppy-eyes; don't give in | `restraint` |
| **Unmoved** | The Release (hold) | weather the tantrum — hold your ground, release when it yields | `holdRelease` |

**Devotion → `hp` · SLOW-SUSTAINED · vital / endure** — *intimate, edgy-romance*
| Game | Adapted mechanic | Pokémon theme | Primitive |
|---|---|---|---|
| **Linger…** | The Release | hold the gaze / embrace, let go a beat too long *(the edgy note)* | `holdRelease` |
| **Hold Close!** | The Balancing Act | counter its lean, **sustain** the embrace upright | `balance` **†** |
| **Pulse** | sustained rhythm | keep a slow breath / heartbeat rhythm going without dropping it | `tapTiming` (slow, sustained) |

## 4. Toolkit expansion (the new primitives implied)
Each is "one small, individually-tested function returning a **Promise<boolean>**"
(`CAMP_MINIGAMES §5`) — expansion is a few functions + data, **never a refactor**:

`dodge` **†** (single directional evade on the real tell) · `catch` **†** (slide a catch-zone to
collect good / avoid bad) · `lobAim` **†** (set angle + power for a parabolic toss) · `steady`
**†** (micro-moves; touching the boundary fails) · `block` **†** (move/hold a defensive hitbox
onto an incoming direction) · `balance` **†** (continuous correction to hold an angle upright).

That takes the toolkit **9 → ~15** primitives, each reused across multiple games/paths. Remaining
source categories (maze/navigation, platformer, crank/spin, intercept, gauge-stopper, quick-math)
are a **further backlog** if more variety is ever wanted.

## 5. Staged ("Party") format
A path's *signature* game can chain **2–3 quick stages** (Mario-Party-style), each stage one
primitive, clear all → the normal **+1**. Keep stages on-vibe for the stat (e.g. a Speed staged
game stays fast across all stages):

```jsonc
// a Nurture (spa, controlled/ranged) signature — themed gather→cook→serve (FLAVOR, not an economy):
{ "name":"Picnic!", "stages":[
    {"primitive":"tapTiming","theme":"forage the right berries"},
    {"primitive":"sequence","theme":"stir the cook-pot in order"},
    {"primitive":"lobAim","theme":"serve it into their mouth"} ],
  "copy":"…", "art":"…" }
```

≈ 4–6 s total, skippable-fast. No new engine — a staged game is just
`{ stages:[{primitive,config}], copy, art }` over the toolkit.

## 6. Reconciliation with the locked v1 set
The **path → action** assignments in `CAMP_MINIGAMES §2` are **unchanged** by this palette. A few
of the locked v1 games lean *against* the new tempo — most notably **Discipline's "March!"**
(`mash`, which reads *fast/frantic* for a stat that should feel **slow/defensive**). The maintainer
can swap those toward the slow-hold flavor (e.g. lead Discipline with **Brace! / Hold! / Plant!**)
— a **data choice** (pick a different primitive in the pool), **no engine impact**. Flagging it as
a tuning note rather than silently editing the finalized core.

## 7. Guardrails (same as the core doc)
Seeded · data-driven · **pass/fail → +1** · **no item economy / no crafting** (gather & cook are
*flavor themes*, not a resource loop — [`CAMP_BAG.md`](./CAMP_BAG.md) §7) · edgier tone with
**maintainer copy sign-off** · original content (no IP lift). The maintainer picks the shipping
set, maps games into the `actions.games[]` pools (`CAMP_MINIGAMES §8`), and tunes the vibe/copy.
