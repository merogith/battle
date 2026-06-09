# Pokémon Bonding — the 6-path relationship system (FINALIZED)

> Part of the [Camp System spec](./README.md). **Design decisions are now locked**
> (maintainer review, 2026-06-03); remaining items are tuning knobs. Balance
> numbers stay [MAINTAINER]-owned. Anchors symbol-first (`find-anchor`).

---

## 1. Concept

Each party Pokémon has **six relationship paths** you build up at camp through
**six dedicated mini-games (one per path)**. The vibe is a simplified Tamagotchi
pet-sim; the payoff is a **small** per-stat buff. Two creative layers give it
character: **Temperament** (every Pokémon likes some paths and resists others)
and **Titles** (your bond *shape* names the Pokémon). The mini-games themselves
are in [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md); this doc defines the paths,
earning, temperament, titles, the buff, the data, and the battle hook.

---

## 2. The six paths → six stats (LOCKED: clean bijection)

There are exactly six battle stats (`hp/atk/def/spa/spd/spe`) and six paths, so
each path masters into **one** stat:

| Path | Tone | Action / vibe | Masters → stat |
|------|------|----------------|----------------|
| **Praise** | 😊 good | cheer, hype them up after a win | **`atk`** |
| **Nurture** | 😊 good | feed, groom, find their favourite treat | **`spa`** |
| **Discipline** | 😠 cruel | strict drills, push them | **`def`** |
| **Intimidate** | 😠 cruel | cold stare, withhold, spook | **`spd`** |
| **Mimicry** | 🤪 weird | tickle, copy/mirror each other | **`spe`** |
| **Devotion** | 💀 romance | romanticize, dote, whisper | **`hp`** |

Mapping is **data-driven** (`data/camp/relationship-paths.json`) and freely
repointable. Good→offense, cruel→defense, weird→speed, romance→tank-together.

---

## 3. Earning — the action-count model (LOCKED)

Per the maintainer: *"6 mini-games to 6 actions you can do in camp with any
Pokémon in your party, as many as you want. On average a Pokémon needs the action
that gives a stat ~10 times, ± the Pokémon's preferences."*

- Each path has a per-Pokémon **action counter**: `slot.bonds[path]` (integer,
  starts 0). Each **successful** mini-game of that path = **+1** (or **+2** on the
  Pokémon's Nature-favourite path — see §4).
- A path is **mastered** (its +5% turns on) when the counter reaches that
  Pokémon's **threshold** for the path:
  `threshold = round(BASE_ACTIONS × tempMult)`, `BASE_ACTIONS = 5` **[MAINTAINER]**.
- `tempMult` is **FLAT 1.0 for every path**, so the threshold is **5 reps** for all.
  Nature variance lives in the **win value** instead (§4): the favourite path earns
  **×2 per win**, so it masters in **3 wins** rather than 5. The variance only ever
  *helps* — nothing is slower than 5.
- **No per-camp cap** — do as many actions as you like, on any party member, any
  time you're camped. The "grind" is the *total rep count across the team*, not a
  daily limit.

**Scale of the commitment** (defaults): one path on any Pokémon = **5**
mini-games (**3** if it's that Pokémon's favourite); a full party of six ≈
**6 stats × 6 mons × 5 = 180 mini-games** to 100% everything (a little less, since
each Pokémon's favourite is faster). Mastering a *favourite* path is quick;
mastering *everything on everyone* is a long-haul, opt-in goal — the "some play"
the maintainer asked for, paced by effort rather than by a timer.

---

## 4. Temperament (creative layer 1 — favourite ×2)

> **Status [MAINTAINER]:** temperament is **one-directional** — it only ever makes
> bonding *faster*, never slower. It is applied as a **×2 win value** on the single
> favourite path (not as a threshold multiplier — those stay flat at 1.0). So the
> favourite masters in 3 wins, everything else in 5; nothing exceeds 5.

Every Pokémon **bonds faster with the path it's naturally inclined to**, so each
Pokémon feels a little individual without making any path a slog.

**Default source = the Pokémon's Nature** (reuses existing data — builds carry a
nature `n` whose `nMults` raise one stat and lower another in `buildPokemon`):

- The path whose stat the Nature **raises** (+10%) is the **favourite** →
  **×2 per win** (`CAMP_FAVORED_GAIN = 2`). Implemented in `campBondGain()`.
- Every other path (and **all** paths on a **neutral nature**) is plain **×1**.
- The Nature-**lowered** stat is **not** penalised — there is no "resisted" path
  any more; variance only ever helps (keeps the cap at a flat 5).
- **HP/Devotion is never the favourite** — no Nature touches HP.

*Example:* an **Adamant** Pokémon (+Atk) has **Praise as its favourite** — each
Praise win counts double, so it masters Praise in 3 wins instead of 5. This is
**data-free** (derived from the nature's existing stat bias).

> **Knob [MAINTAINER]:** the favourite source — Nature (default), a per-species
> table, or a per-Pokémon roll — and `CAMP_FAVORED_GAIN` (the ×2). Externalize to
> `data/camp/relationship-paths.json` later.

The edgier tone (§ tone in minigames) can key off temperament: a Pokémon you bond
with on its **favourite** path lights up extra.

---

## 5. Titles (creative layer 2 — LOCKED, cosmetic)

A Pokémon's **bond shape** (which paths it has mastered) earns it a **title** —
pure flavour, no mechanics, leaning into the edgy tone. First match wins
(most-specific first); data-driven in `data/camp/titles.json`:

| Title | Condition |
|-------|-----------|
| **Soulbonded** | all 6 paths mastered |
| **the Obsession** | Devotion + any cruel path mastered (creepy combo) |
| **the Adored** | Devotion + Nurture mastered |
| **the Hardened** | both cruel paths (Discipline + Intimidate) mastered |
| **the Beloved** | both good paths (Praise + Nurture) mastered |
| **the Mirror** | Mimicry mastered |
| *(none)* | otherwise |

Shown on the summary card / camp party panel (§9). The table is the maintainer's
to flavour/extend.

---

## 6. The buff (LOCKED: +5% per mastered path, small)

- A **mastered** path grants **+5%** to its stat. Below threshold: nothing
  (binary at-master, matching "*when maxed*").
- **Aggregate:** all six mastered ⇒ +5% to each stat ⇒ a Pokémon ~5% stronger
  overall — **≈ one step of `FOE_POWER_CURVE`** (whose steps are 5%). Per stat at
  Lv50 that's a point or two: "a reason, not a power spike."
- Temperament changes only *how many reps* to get there, **never the buff size**,
  so balance footprint is fixed regardless of personality. Titles/hexagon are
  cosmetic. → The whole creative system stays balance-tiny.
- **Curve fit:** still sanity-check a fully-bonded team against
  `docs/PROGRESSION_CURVE_MASTER.md` (it shifts effective difficulty ~one step).
  **Sign-off before it ships live** (it goes live in PR D — see roadmap).

---

## 7. Data model & save schema

**Per-Pokémon, on the party/box slot** (slots persist via `sm.team` / `sm.pcBox`):

```js
slot.bonds = {            // action COUNTERS (0..threshold); absent on eggs
  praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0,
};
// derived at read time, not stored:
//   threshold(path) = 5 (flat; tempMult vestigial at 1.0)
//   gain(path)      = 2 on the Nature-favourite path (campBondGain), else 1
//   mastered(path)  = slot.bonds[path] >= threshold(path)
//   title(slot)     = first matching rule over the mastered set
```

Counters travel with the Pokémon (PC box, evolution — the slot is mutated in
place by `evolutionScene.onCommit`, so bonds survive; verify in the evolve path).

**Migration — single bump `SAVE_VER` 24 → 25** (`migrateStoryPreV25`), mirror the
`migrateStoryPreV21` egg-field loop:

```js
function migrateStoryPreV25() {
  const D = () => ({ praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 });
  for (const arr of [sm.team, sm.pcBox]) {
    if (!Array.isArray(arr)) continue;
    for (const s of arr) { if (s && !s.isEgg && (!s.bonds || typeof s.bonds!=='object')) s.bonds = D(); }
  }
  // + camp-flow fields (sm.campByEventIdx, sm.campReturnPoint) — see CAMP_FLOW §7
}
// load(): if (d.version < 25) migrateStoryPreV25();
```

**Data files** (loaded via early-`let` + `Object.assign`, per `CLAUDE.md`):
`data/camp/relationship-paths.json` (path → {tone, stat, buff, baseActions,
tempMults}), `data/camp/titles.json` (title rules).

---

## 8. Battle integration (mirror the foe multiplier — unchanged)

Foes scale via a single `build._storyStatMult` applied in `buildPokemon`
(≈`15310-15323`). Players use the **same hook** with a **player-only per-stat
object**, stamped only on player builds (presence == player guard):

1. **Compute** (pure, testable):
   ```js
   function relationshipStatMult(slot) {
     const m = { hp:1, atk:1, def:1, spa:1, spd:1, spe:1 };
     for (const [pid, def] of Object.entries(RELATIONSHIP_PATHS))
       if ((slot.bonds?.[pid]|0) >= bondThreshold(pid, slot)) m[def.stat] *= (1 + def.buff);
     return m;
   }
   ```
2. **Stamp** at battle entry, per player slot: `build._relationshipStatMult =
   relationshipStatMult(slot)`. **TODO:** locate the player-team build-prep site
   (player analogue of the foe stamp ≈`48361`; team launches via `launchBattle`).
3. **Apply** in `buildPokemon`, symmetric to the foe block, guarded by presence:
   ```js
   if (build && build._relationshipStatMult) {
     const rm = build._relationshipStatMult;
     mon.maxHp = Math.max(1, Math.floor(mon.maxHp * (rm.hp||1)));
     for (const k of ['atk','def','spa','spd','spe'])
       mon.stats[k] = Math.max(1, Math.floor(mon.stats[k] * (rm[k]||1)));
   }
   ```

Flows into damage/speed/HP exactly like the foe path, zero foe risk. **Damage/
stat behaviour change → explicit sign-off before the diff ships.**

---

## 9. UI & feedback

- **Bond hexagon (creative layer 3):** a 6-spoke radar on each Pokémon's camp
  card, each spoke = `bonds[path] / threshold(path)` (full spoke = mastered),
  spokes tone-coloured (good=green, cruel=red, weird=violet, romance=pink). Shows
  your relationship's *shape* at a glance.
- **Title** shown under the Pokémon's name on the card / summary.
- **Mastering a path** fires a small spotlight-tier reveal ("Praise mastered —
  +5% Attack!"); earning a **title** fires a bigger one. Reuse the casino
  "victory-card" lane / `_storyScene` — see [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md).

---

## 10. Edge cases

- **Eggs:** no `bonds` until hatch (init defaults on hatch).
- **Evolution:** counters persist (same slot); Nature is unchanged by evolution,
  so temperament is stable. Verify in the evolve path.
- **PC box:** carries bonds; can't be tended (you camp with your party) and the
  buff is inert until back in the party. OK for v1.
- **Backfire (cruel/romance overdo):** a botched mini-game = **+0** (a sulk
  reaction), never a decrement, so play never *loses* progress. Knob: allow small
  setback for the edgier tone — default off.

---

## 11. Test plan (leave-behind)

- **Pure:** `relationshipStatMult` — a mastered path → its stat ×1.05, others 1;
  empty → all 1; all mastered → all 1.05.
- **Threshold:** a flat **5** reps for every path/nature (temperament multipliers
  all 1.0).
- **Temperament (favourite ×2):** the Nature-raised stat's path is the favourite
  (`campBondFavoredPath`) and earns ×2 per win (`campBondGain`) → masters in 3
  wins; neutral nature → no favourite; HP/Devotion is never the favourite.
- **Integration (jsdom):** player mon with `discipline` at threshold → built
  `def === floor(base×1.05)`, others unchanged; foe unaffected; `devotion`
  mastered → `maxHp` scaled.
- **Title rules:** mastered-set → expected title (priority order).
- **Migration:** pre-V25 save gains default `bonds`; eggs don't; idempotent.
- **Dormant guard:** all counters 0 ⇒ built stats byte-identical to pre-feature.

---

## 12. Decisions

**Locked:** path→stat bijection (§2) · +5%/path, binary at-master (§6) ·
unlimited actions per camp, flat 5-rep threshold with a ×2 win value on each
Pokémon's Nature-favourite path (§3/§4) · creative layers §5/§9 · edgier tone
with copy sign-off (minigames doc).

**Remaining knobs [MAINTAINER] (tuning, in data):** `BASE_ACTIONS` (5) ·
`CAMP_FAVORED_GAIN` (×2 on the favourite) · favourite source (Nature default) ·
whether Devotion/HP gets like-resist · whether backfire can decrement · title
copy/rules · aggregate cap if +5%×6 proves too strong on the curve.
