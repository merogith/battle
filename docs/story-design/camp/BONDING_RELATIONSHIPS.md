# Pokémon Bonding — the 6-path relationship system

> Part of the [Camp System spec](./README.md). **Draft — balance numbers are
> [MAINTAINER]-owned and unset.** Anchors are symbol-first (resolve with
> `find-anchor`). Grounded in the buff-mechanic + save-schema research sweeps.

---

## 1. Concept

Each party Pokémon has **six relationship paths** — the maintainer's brief:

> *"multiple ways to interact with your pokemon, some good some weird some
> cruel… a very simplified tomogochi addition… mostly minigame and pokemon
> bonding vibe."*

> *"each [of] 6 relation path… 2 good, 2 cruel, 1 creepy (romance), 1 weird
> (relation increases with tickling or imitating each other)… each relation path
> when maxed gives 5% boost to stat, like how enemies get % buff/debuff."*

The hook is emotional (a pet-sim layer that makes the team *yours*); the payoff
is a **small** mechanical nudge so there's a reason beyond flavour. The
interactions themselves live in [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md); this
doc defines the **paths, the buff, the data, and the battle hook.**

---

## 2. The six paths

There are exactly **six battle stats** (`hp/atk/def/spa/spd/spe`, confirmed in
`buildPokemon`) and **six paths** — so each path maxes into **one stat**. This
1:1 bijection is the clean resolution of the maintainer's (slightly
inconsistent) stat notes — see §3.

| Path | Tone | Vibe / sample interactions | Maxed → stat | Maintainer's rationale |
|------|------|----------------------------|--------------|------------------------|
| **Praise** | good | cheer, high-five, reward a win | **`atk`** | "motivated to do more" |
| **Nurture** | good | feed, groom, nap together | **`spa`** | "motivated to do more" |
| **Discipline** | cruel | strict drills, cold training | **`def`** | "toughens up" |
| **Intimidate** | cruel | scare, withhold, harsh tone | **`spd`** | "toughens up" (the other defense) |
| **Mimicry** | weird | tickle, copy each other, mirror-game | **`spe`** | "act together faster" |
| **Devotion** | romance/creepy | romanticize, whisper, obsessive care | **`hp`** | "tank hardships of life together" |

Path identity (id, display name, tone, copy, the interactions that feed it, and
its target stat) is **data-driven** → `data/camp/relationship-paths.json`. The
table above is the *default* mapping; the maintainer can repoint any path→stat
or rename freely without code changes (**D2**).

---

## 3. Reconciliation note (why this mapping) — **[MAINTAINER] D2**

The brief gave two lists that don't perfectly line up:

- **Path list:** 2 good, 2 cruel, **1 romance**, **1 weird**.
- **Stat list:** good→`atk`+`spa`, cruel→"spd and other defense", **weird→speed**,
  **weird→HP** (two "weird"s, no romance stat).

I reconciled to the **6-stat bijection** above: good→offense (`atk`/`spa`),
cruel→defenses (`def`/`spd`), the weird *Mimicry* path→`spe` ("act together
faster"), and the romance *Devotion* path→`hp` ("tank hardships of life
together" reads as devotion). This honours every thematic cue and uses each stat
exactly once. **If you'd rather** HP sit on a "weird" path and romance take a
different stat, just remap in the JSON — nothing in code assumes a specific
path→stat pairing.

---

## 4. Progression model

- Each path has a **bond bar**: `slot.bonds[pathId]`, an integer **0 → 100**
  (100 = "maxed", buff active). Stored per-Pokémon (§6).
- Camp interactions grant points to **one** path each (a minigame score →
  seeded points, e.g. **+8…+15**; tuning in the minigames doc).
- **Interaction budget per camp visit: 3 [MAINTAINER] D5.** You can't grind a
  path to max in one sitting — progress is paced across the many camps of a
  route journey.

**Pacing sanity check** (with defaults): ~12 pts/interaction ⇒ ~9 interactions
to max one path ⇒ ~3 focused camps per path ⇒ ~18 interactions (~6 camps) to max
all six paths on **one** Pokémon. A full story run produces many camps (one per
route transition — see `CAMP_FLOW.md`), so maxing a *favourite* is achievable
with intent, while fully bonding all six party members is a long-haul, opt-in
goal. Knobs (points/interaction, bar size, budget) are all [MAINTAINER].

---

## 5. The buff — **[MAINTAINER] D1, D4**

- **Default:** a path at max (100) grants **+5%** to its mapped stat. Below max:
  **no buff** (binary at-max, matching "*when maxed* gives 5%") — **D4**.
- **Aggregate:** all six paths maxed ⇒ +5% to each of the six stats ⇒ a Pokémon
  ~5% stronger overall, spread evenly. For scale, that's **≈ one step of
  `FOE_POWER_CURVE`** (whose steps are 5%: `[0.80, 0.85, 0.90, 0.95, 1.00, 1.00,
  1.05, 1.08, 1.10, 1.15]`). Per stat at Lv50 it's a point or two — "a reason,
  not a power spike," matching the brief's "very small, not game-changing."
- **Knobs (D1):** magnitude per path (5% default); whether to cap the *aggregate*
  (e.g. only the 2 highest paths' buffs apply); whether to go **gradual** instead
  of binary (D4: e.g. `+0.05 × bar/100`). The implementing agent exposes these in
  `data/camp/relationship-paths.json` / a tuning block and the maintainer picks.
- **Curve fit:** because this stacks on top of the existing player vs
  `FOE_POWER_CURVE` math, it must be sanity-checked against
  `docs/PROGRESSION_CURVE_MASTER.md`. A fully-bonded team shifts the effective
  difficulty down by ~one curve step; if that's unwanted, lower the % or cap the
  aggregate. **Flag for sign-off before shipping.**

---

## 6. Data model & save schema

**Per-Pokémon, on the party/box slot** (slots already persist via `sm.team` /
`sm.pcBox`; research confirmed slots are plain objects with `name`, `build`,
`id`, optional `shinyCaught`/`isEgg`):

```js
slot.bonds = {            // 0..100 each; absent on eggs until hatch
  praise: 0, nurture: 0,  // good   → atk, spa
  discipline: 0, intimidate: 0,  // cruel → def, spd
  mimicry: 0,             // weird  → spe
  devotion: 0,            // romance→ hp
};
```

Storing on the slot means bonds **travel with the Pokémon** into the PC box and
**survive evolution** (the slot object is mutated in place by
`evolutionScene`'s `onCommit`, so `slot.bonds` is preserved — call this out in
the evolution path). They are discarded naturally on release/trade.

**Migration (single bump `SAVE_VER` 24 → 25, `migrateStoryPreV25`)** — mirror
the `migrateStoryPreV21` egg-field loop:

```js
function migrateStoryPreV25() {
  const DEFAULT_BONDS = () => ({ praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 });
  for (const arr of [sm.team, sm.pcBox]) {
    if (!Array.isArray(arr)) continue;
    for (const slot of arr) {
      if (!slot || slot.isEgg) continue;
      if (!slot.bonds || typeof slot.bonds !== 'object') slot.bonds = DEFAULT_BONDS();
    }
  }
  // camp-flow fields (sm.campByEventIdx, sm.campReturnPoint) added here too — see CAMP_FLOW §7
}
// load(): if (d.version < 25) migrateStoryPreV25();
```

> **Sensitive area.** Saves migration must be exactly-once and idempotent. Read
> `STORY_MODE_FLOW.md` and the existing `migrateStoryPreV*` chain before writing
> this. Add a migration test (below).

**Data file** `data/camp/relationship-paths.json` (loaded via the early-`let` +
`Object.assign` pattern, per `CLAUDE.md` sloppy-mode rule):

```jsonc
{
  "praise":     { "tone": "good",    "stat": "atk", "name": "Praise",     "max": 100, "buff": 0.05 },
  "nurture":    { "tone": "good",    "stat": "spa", "name": "Nurture",    "max": 100, "buff": 0.05 },
  "discipline": { "tone": "cruel",   "stat": "def", "name": "Discipline", "max": 100, "buff": 0.05 },
  "intimidate": { "tone": "cruel",   "stat": "spd", "name": "Intimidate", "max": 100, "buff": 0.05 },
  "mimicry":    { "tone": "weird",   "stat": "spe", "name": "Mimicry",    "max": 100, "buff": 0.05 },
  "devotion":   { "tone": "romance", "stat": "hp",  "name": "Devotion",   "max": 100, "buff": 0.05 }
}
```

---

## 7. Battle integration (mirror the foe multiplier)

The research pinned the exact mechanic to copy. **Foes** get a single scalar
`build._storyStatMult` (set in `enterBattleEvent`, ≈`48361-48363`, as
`_storyEnemyStatMult × _foeDifficultyMult`), applied in **`buildPokemon`**
(≈`15310-15323`) to `maxHp` and every `stats[k]` for `k in
['atk','def','spa','spd','spe']`.

**Player relationship buffs** use the *same hook*, but as a **per-stat object**
that is only ever stamped on **player** builds (so presence == player guard,
exactly like `_storyStatMult` is only on foes):

1. **Compute** (pure, testable): `relationshipStatMult(bonds, pathDefs) → { hp, atk, def, spa, spd, spe }`, each `1.0` or `1.0 + buff` when that stat's path is at max.

   ```js
   function relationshipStatMult(bonds) {
     const m = { hp:1, atk:1, def:1, spa:1, spd:1, spe:1 };
     for (const [pid, def] of Object.entries(RELATIONSHIP_PATHS)) {
       if ((bonds?.[pid] | 0) >= def.max) m[def.stat] *= (1 + def.buff);
     }
     return m;
   }
   ```

2. **Stamp** at battle entry: for each player party slot, set
   `build._relationshipStatMult = relationshipStatMult(slot.bonds)`. **TODO for
   implementer:** locate the player-team build-prep site (the player-side analogue
   of the foe stamp at ≈`48361`; the team is launched via `launchBattle(...)`).
   This is the one anchor to nail during implementation.

3. **Apply** in `buildPokemon`, in a block symmetric to the foe one (right after
   it), guarded by field presence:

   ```js
   if (build && build._relationshipStatMult) {
     const rm = build._relationshipStatMult;
     mon.maxHp = Math.max(1, Math.floor(mon.maxHp * (rm.hp || 1)));
     for (const k of ['atk','def','spa','spd','spe'])
       mon.stats[k] = Math.max(1, Math.floor(mon.stats[k] * (rm[k] || 1)));
   }
   ```

This makes the buff flow correctly into damage, speed order, and HP — same as
the foe path — with **zero risk to foes** (they never carry the field). Order vs
the foe multiplier doesn't matter for player mons (they don't carry
`_storyStatMult`), but keep the player block *after* the foe block for clarity.

> This is a **damage/stat behaviour change** → needs explicit sign-off per
> `CLAUDE.md` before the diff ships.

---

## 8. Decay — **[MAINTAINER] D3**

Tamagotchi convention is upkeep (neglect → sad → decay). **Recommendation: OFF
(or very slow) for v1.** The buff is meant as a reward for engagement, not a
chore that punishes you for playing the actual game; aggressive decay would make
a maxed buff feel unreliable and nag the player. If wanted later: a small
per-camp or per-N-events decay on un-tended paths, exposed as a knob. Default
`decayPerCamp: 0`.

---

## 9. UI & feedback

- **In camp**, the party-sort panel (`CAMP_FLOW.md` §6) shows six tiny bond
  meters per Pokémon (tone-coloured: good=green, cruel=red, weird=violet,
  romance=pink). Reuse existing meter/badge CSS where possible.
- **Maxing a path** is a celebratory beat — reuse the spotlight-tier reveal
  pattern (the casino "victory card" lane / `_storyScene`) for a small "Praise
  maxed — +5% Attack!" card. Cross-link [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md).
- **In battle**, optionally surface a subtle "bonded" marker on buffed mons
  (out of scope for v1; note only).

---

## 10. Edge cases

- **Eggs:** no `bonds` until hatch; initialise to defaults on hatch.
- **Evolution:** bonds persist (same slot object) — verify in the evolve path.
- **PC box mons:** carry bonds but can't be tended (you camp with your party)
  and their buff is inert until they re-enter the party. Acceptable for v1.
- **Fainted/again:** bonds are persistent state, unaffected by faint/heal.
- **Buff + status/ability interactions:** none — this is a pure stat multiply at
  build time, identical to the foe path; no new battle-loop surface.

---

## 11. Test plan (leave-behind)

- **Unit:** `relationshipStatMult({praise:100})` → `{atk:1.05, …rest 1}`; empty
  bonds → all `1`; all-maxed → all `1.05`.
- **Integration (jsdom):** build a player mon with `discipline:100`; assert
  built `def === floor(baseDef × 1.05)` and other stats unchanged; build an
  identical foe and assert it is unaffected (no `_relationshipStatMult`).
- **HP path:** `devotion:100` → `maxHp === floor(base × 1.05)`.
- **Migration:** load a synthetic pre-V25 save with mons lacking `bonds`; assert
  every non-egg party/box slot gains default `bonds`, eggs don't, idempotent on
  re-run.
- **Determinism:** an interaction-point roll with a fixed `runSeed` reproduces.

---

## 12. Decisions for the maintainer (this doc)

- **D1** buff magnitude (default +5%/path) and whether to cap the aggregate.
- **D2** the path→stat mapping (default bijection in §2).
- **D3** decay on/off (default off).
- **D4** binary-at-max vs gradual buff (default binary).
- **D5** interactions per camp visit (default 3).
