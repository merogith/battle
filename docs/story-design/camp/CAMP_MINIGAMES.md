# Camp Micro-games — 6 actions × 3 random games (18, WarioWare-style) (FINALIZED)

> Part of the [Camp System spec](./README.md). **Locked:** six bonding
> [actions](./BONDING_RELATIONSHIPS.md), and **each action rolls one of 3 random
> micro-games (18 total)** in the fast WarioWare *microgame* format, so the ~10
> reps to master a stat stay fresh. Usable on any party Pokémon, **unlimited per
> camp**; each success = **+1**. Tone is **edgier — maintainer signs off on copy.**
> Anchors symbol-first.

---

## 1. Concept

At camp you pick a party Pokémon and a **bonding action** (six of them, one per
relationship path). Performing an action launches a **random micro-game** from
that action's **pool of 3** — a quick (≈ 2–4 s), one-verb WarioWare-style game.
Win it → **+1** to that path's counter on that Pokémon; mastery (the +5% buff)
lands at the per-Pokémon threshold (`BONDING §3`).

- **3 micro-games per action × 6 actions = 18 micro-games.** The reps to master a
  stat (~10) draw a *varied* sequence instead of the same game ten times.
- **Random pick is seeded** (`storyRngNext`, ≈`37609`) → deterministic replays,
  fresh-feeling sessions.
- **Unlimited per camp**, any party member. Temperament changes the *threshold*
  (how many wins to master), never the per-win gain.

---

## 2. The 18 micro-games

Grouped by action (path → stat). Each is a single clear verb shown big on screen,
WarioWare-style. They're built from a small shared **input toolkit** (§5), so 18
games is *content*, not 18 engines.

| Action (path → stat) | Micro-game | Verb | Input primitive |
|---|---|---|---|
| **Cheer** (Praise → `atk`) | Clap! | tap on the beat | `tapTiming` |
| | Pump! | mash to fill the hype bar | `mash` |
| | Pose! | match the victory pose shown | `pickMatch` |
| **Feed & Groom** (Nurture → `spa`) | Feed! | drag their *favourite* treat to its mouth | `dragAim` |
| | Brush! | swipe to groom every spot | `swipeCover` |
| | Catch! | catch the berry it tosses back | `tapTiming` |
| **Drill** (Discipline → `def`) | Hold! | hold the stance, release in the green | `holdRelease` |
| | Block! | tap to block hits in rhythm | `tapTiming` |
| | March! | alternate-tap to keep the pace | `mash` (alternating) |
| **Cold Stare** (Intimidate → `spd`) | Don't Blink! | hold the stare; release before it curdles | `holdRelease` |
| | Loom! | creep closer, stop in the zone | `track` |
| | Withhold! | resist the puppy-eyes — **don't** tap the treat | `restraint` |
| **Mirror** (Mimicry → `spe`) | Copy! | repeat the gesture sequence | `sequence` |
| | Tickle! | tap the wiggling spots | `tapTiming` |
| | Sync! | match its movement in real time | `track` |
| **Stargaze** (Devotion → `hp`) | Hold Close! | a slow hold — linger, maybe a beat too long | `holdRelease` |
| | Whisper! | trace the heart/word shape | `dragAim` (trace) |
| | Gaze! | keep eye contact as it drifts | `track` |

Copy/art/difficulty are data; the verbs above are placeholders for the
maintainer's tone pass (§9).

---

## 3. WarioWare design ethos (genre, not IP)

- **Short & loud:** ≈ 2–4 s, one big instruction word, instant fail/clear. No
  tutorials — the verb *is* the tutorial.
- **Surprising:** the random pick from the 3-pool means you don't know which
  you'll get; optional **speed-up** as a Pokémon's bond climbs adds escalation.
- **Original content, genre inspiration only.** We emulate the *microgame format*
  (fast, quirky one-verb games) — we do **not** copy Nintendo's specific games,
  names, characters, or art. Keep all assets/copy original. *(Light legal hygiene
  — flag anything that drifts toward a recognizable lift for maintainer review.)*

---

## 4. Selection & scoring

```js
function campPickMicrogame(actionId) {
  const pool = CAMP_ACTIONS[actionId].games;        // 3 ids
  const r = (sm && sm.active) ? window.storyRngNext() : Math.random();
  return pool[Math.floor(r * pool.length)];          // seeded → deterministic
}
```

- **Win** the micro-game → **+1** to the action's path counter → `save()`.
- **Miss / botch** (e.g. overfilling `holdRelease`, tapping on `restraint`) →
  **+0** and a **reaction beat** (sulk / recoil — the edgy payoff). Never
  decrements by default (no losing progress); a small setback is a knob.
- Win/lose is **pass/fail**, not a graded score — keeps "~10 wins to master"
  legible. Temperament is applied to the **threshold**, not here.

---

## 5. The shared input toolkit (≈9 primitives → all 18)

`tapTiming` (tap in a sweet zone / on beat) · `mash` (rapid/alternating taps to
fill) · `holdRelease` (hold, release in green; overdo backfires) · `sequence`
(Simon-says repeat) · `dragAim` (drag/trace to a target) · `swipeCover` (swipe to
cover areas) · `track` (keep on a moving target) · `pickMatch` (choose the
matching option) · `restraint` (do **not** act when tempted).

Each primitive is one small, individually-tested function returning a
**Promise<boolean>** (won?). A micro-game = `{primitive, config, copy, art}`.
This is the casino-minigame pattern (`casinoSpin` ≈`29945` returns a Promise);
reuse it.

---

## 6. Anatomy (build on the casino pattern)

- **Mount:** `_storyTryBeginInteraction()` → init ephemeral `_campUI` (like
  `_casinoUI`, not persisted) → render into the camp screen → `… finally
  _storyEndInteraction()` (`enterCasino` ≈`53255`).
- **Run:** `campPickMicrogame(action)` → `await primitive(config)` (Promise) →
  award +1 on win. SFX via `window.StoryFx.playSfx` (`sparkle`, `pbBounce1`,
  `achv`, `danger`).
- **Persist:** `slot.bonds[path]++; save();`.
- **Mastery reveal:** crossing a threshold fires the spotlight reveal (+ a title
  reveal if a rule trips) — see [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md).
- **Return:** `showScreen('screen-story-camp')`.

---

## 7. Per-Pokémon favourite (the Feed! micro-game)

`Feed!` rewards offering the Pokémon's **stable favourite** treat — derive from a
hash of the immutable `slot.id` (not the advancing RNG stream), so it's
consistent across visits and replay-safe:

```js
function campFavourite(slot, n) {
  let h = 2166136261;
  for (const c of String(slot.id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % n;
}
```

---

## 8. Data model

Two data files (loaded via early-`let` + `Object.assign`, per `CLAUDE.md`):

```jsonc
// data/camp/actions.json — the 6 actions, each pointing at its 3-game pool
{
  "cheer":    { "path": "praise",     "games": ["clap","pump","pose"] },
  "feed":     { "path": "nurture",    "games": ["feed","brush","catch"] },
  "drill":    { "path": "discipline", "games": ["hold","block","march"] },
  "stare":    { "path": "intimidate", "games": ["dontblink","loom","withhold"] },
  "mirror":   { "path": "mimicry",    "games": ["copy","tickle","sync"] },
  "stargaze": { "path": "devotion",   "games": ["holdclose","whisper","gaze"] }
}
// data/camp/microgames.json — the 18 games, each a primitive + config + copy
{
  "clap":  { "primitive": "tapTiming", "rounds": 4, "name": "Clap!" },
  "pump":  { "primitive": "mash", "target": 20, "ms": 3000, "name": "Pump!" },
  "hold":  { "primitive": "holdRelease", "overdoAt": 0.92, "name": "Hold!" },
  "withhold": { "primitive": "restraint", "tempts": 3, "name": "Withhold!" }
  // …14 more…
}
```

Primitives are code (~9 functions); the 18 games + their tuning + copy are data —
so adding/retuning micro-games never touches the engine.

---

## 9. Tone — edgier, maintainer reviews copy (D10 = edgier)

Cruel (Drill, Cold Stare) and romance (Stargaze) lean weird/dark, *played with
intent*; the **overdo/botch** beat is the Pokémon recoiling or sulking —
unsettling, not graphic; the trainer is the weirdo. The **maintainer signs off on
the actual micro-game copy** before it ships; surface borderline lines rather than
shipping them.

---

## 10. Phasing note (so 18 isn't a wall)

Ship **1 micro-game per action first** (6 games — proves the loop, the toolkit,
the camp panel), then **expand each pool to 3** (the other 12) as content PRs.
The data shape (`actions.games[]`) already supports a pool of any size, so
expansion is data + a primitive or two, never a refactor. (Reflected in the
roadmap's PR D.)

---

## 10b. Micro-game palette & formats (maintainer)

The 18 locked games (§2) are v1; the **format extends without new engines** (a primitive + data).
The richer **resonant palette** — best-practice micro-game mechanics adapted so each game's *feel*
echoes its **stat** and its *theme* echoes the **attachment style**, plus the themed (gather/cook)
and **staged** (Mario-Party-style multi-beat) formats — lives in
[`CAMP_MINIGAMES_PALETTE.md`](./CAMP_MINIGAMES_PALETTE.md). All of it stays **content/config, not
mechanics:** seeded, data-driven, **pass/fail → +1, no item economy** (gather/cook are *flavor*,
not a bag loop — [`CAMP_BAG.md`](./CAMP_BAG.md) §7). The maintainer picks the shipping set + tunes the vibe.

---

## 11. Test plan (leave-behind)

- **Seeded pick:** `campPickMicrogame` with a fixed `runSeed` returns a
  reproducible game from the 3-pool; distribution covers all 3 over many seeds.
- **+1 on win, +0 on botch;** never negative (default knob).
- **`restraint` inverts:** acting = fail, waiting = win.
- **`holdRelease` overdo** past `overdoAt` → fail.
- **Favourite stability:** `campFavourite(slot)` stable per `slot.id`.
- **No bare RNG:** grep guard — scored camp paths use `storyRngNext`.
- **Unlimited:** no per-visit cap blocks repeated play.

---

## 12. Decisions

**Locked:** 6 actions × 3 random micro-games (**18**), WarioWare-style;
seeded pick; +1 per win; unlimited per camp; edgier tone with maintainer copy
sign-off; original content (genre inspiration, no Nintendo IP lift).
**Knobs [MAINTAINER]:** per-game difficulty/config · pool contents · optional
bond-climb speed-up · whether a botch can decrement (default no) · the copy.
