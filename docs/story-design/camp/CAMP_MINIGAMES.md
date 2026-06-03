# Camp Minigames — the Tamagotchi interaction layer

> Part of the [Camp System spec](./README.md). These minigames are how the six
> [relationship paths](./BONDING_RELATIONSHIPS.md) gain points. Anchors
> symbol-first. Grounded in the minigame/scene research sweep.

---

## 1. Concept

In camp you can **spend time with each party Pokémon**. Each interaction is a
tiny, fast minigame whose score grants points to **one** relationship path. The
vibe is a "very simplified Tamagotchi" — feed, train, tease, dote — *some kind,
some cruel, some weird, some romantic*. Keep each interaction **≤ ~10 seconds**
and fully skippable; this is texture, not a wall.

- **Budget:** up to **D5 (default 3)** interactions per camp visit (see
  `BONDING_RELATIONSHIPS.md` §4).
- **Determinism:** all variance uses `storyRngNext` (≈`37609`) — never bare
  `Math.random` for anything that must replay (it's already routed during story
  runs, but call `storyRngNext` explicitly).

---

## 2. Four reusable templates (not six bespoke games)

Six paths map onto **four interaction templates** × content/tone. This keeps the
build to a few well-tested mechanics instead of six one-offs.

| Template | Mechanic | Feeds paths |
|----------|----------|-------------|
| **A · Timing Tap** | a marker sweeps a bar; tap in the sweet zone × N rounds; score = clean hits | **Praise** (hype them up), **Mimicry** (tickle on the beat) |
| **B · Sequence Repeat** | watch a short icon/sound pattern, repeat it (Simon-says); score = length matched | **Mimicry** (copy-cat) — and an alt for Praise |
| **C · Pick the Preference** | present 3–4 options; the Pokémon has a *stable hidden favourite*; right pick = big gain, wrong = small | **Nurture** (which food/treat?) |
| **D · Restraint Meter** | hold to fill a meter; release in the green; **overfilling backfires** (resentment → reduced/zero gain) | **Discipline** (push, don't break), **Intimidate** (hold the cold stare), **Devotion** (hold them close) |

> Template D's "backfire" is what makes the **cruel** paths feel cruel and risky
> (push too hard and they resent you) and the **romance** path feel intense
> (hold too long and it gets… weird). One mechanic, three tones via copy + tuning.

**Score → points:** `points = base + round(bonus × score01)` where `score01 ∈
[0,1]` from the minigame and `base`/`bonus` are per-template tuning (defaults
e.g. `base 8, bonus 7` → +8…+15). All in `data/camp/interactions.json`.

---

## 3. The interaction catalog (default copy)

Each entry: path · template · one-line fantasy. Final copy lives in data and is
the maintainer's to flavour.

- **Praise → Cheer Drill** (A): tap as they pull off tricks; nail the rhythm and
  they puff up with pride. → `atk`
- **Nurture → Feed & Groom** (C): offer berries/treats; learn what *this* one
  loves; brush its coat. → `spa`
- **Discipline → Hard Drill** (D): run them through strict reps — push to the
  edge of the green, not past it. → `def`
- **Intimidate → Cold Stare** (D): withhold the treat, hold the unblinking stare;
  don't crack (or overdo it). → `spd`
- **Mimicry → Copy-Cat** (B) / **Tickle** (A): mirror each other's moves until
  you're in sync (or tickle on-beat). → `spe`
- **Devotion → Stargaze / Whisper** (D): hold them close under the stars and
  whisper just a little too long. → `hp`

---

## 4. Per-Pokémon preference (flavour + Template C)

Template C (and small flavour elsewhere) needs a **stable** favourite per
Pokémon. Derive it deterministically from a **stable hash of `slot.id`** (not the
advancing `storyRngNext` stream, which would shift between visits):

```js
function campPreference(slot, optionCount) {
  // FNV-ish hash of the immutable slot.id → stable index
  let h = 2166136261;
  for (const c of String(slot.id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % optionCount;
}
```

So a given Pokémon *always* prefers the same berry — discoverable, consistent,
and replay-safe — while the *minigame outcome* variance still uses `storyRngNext`.

---

## 5. Anatomy of a camp minigame (build on the casino pattern)

Mirror the self-contained minigame pattern the research mapped:

- **Mount:** `_storyTryBeginInteraction()` → init ephemeral state → render into the
  camp screen → `… finally _storyEndInteraction()` (see `enterCasino` ≈`53255`).
- **Ephemeral state:** a single `_campUI` object (like `_casinoUI`) — *not*
  persisted; only the resulting bond points are written to `slot.bonds` + `save()`.
- **Animation:** model on `casinoSpin` (≈`29945`) — a function returning a
  **Promise** that resolves when the interaction's animation settles; `await` it,
  then award points. Use `window.StoryFx.playSfx(name, vol)` for feedback (the
  research lists a vocabulary: `sparkle`, `pbBounce1`, `achv`, `danger`, …).
- **Reward reveal:** on a path hitting **max**, show the celebratory card via the
  spotlight-tier reveal lane (the casino "victory card" / `_storyScene`) — see
  [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md).
- **Dismiss:** return to the camp menu (`showScreen('screen-story-camp')`),
  decrement the visit budget.

---

## 6. Data model

`data/camp/interactions.json` (loaded via the early-`let` + `Object.assign`
pattern per `CLAUDE.md`):

```jsonc
{
  "cheer_drill":  { "path": "praise",     "template": "timingTap",      "rounds": 4, "base": 8, "bonus": 7, "name": "Cheer Drill" },
  "feed_groom":   { "path": "nurture",    "template": "pickPreference", "options": ["Oran","Sitrus","Pecha","Leppa"], "base": 6, "bonus": 9, "name": "Feed & Groom" },
  "hard_drill":   { "path": "discipline", "template": "restraintMeter", "backfireAt": 0.92, "base": 8, "bonus": 7, "name": "Hard Drill" },
  "cold_stare":   { "path": "intimidate", "template": "restraintMeter", "backfireAt": 0.9,  "base": 8, "bonus": 7, "name": "Cold Stare" },
  "copy_cat":     { "path": "mimicry",    "template": "sequenceRepeat", "len": 4, "base": 8, "bonus": 7, "name": "Copy-Cat" },
  "stargaze":     { "path": "devotion",   "template": "restraintMeter", "backfireAt": 0.95, "base": 8, "bonus": 7, "name": "Stargaze" }
}
```

Templates are code (four functions); content/tuning is data.

---

## 7. Tone & content boundaries — **[MAINTAINER] D10 (new)**

The "cruel" and "creepy romance" framings are the maintainer's idea and give the
system its personality — but they need a **declared ceiling**. Recommendation:
play them as **cartoonish dark-comedy / Tamagotchi-weird**, never as genuine
distress or anything that reads as real animal cruelty or anything inappropriate.
Concretely:

- Cruel = *strictness / withholding / spookiness*, with the Pokémon reacting
  comically and the **backfire** modelling "you went too far, it sulks." Not
  injury, not fear-as-suffering.
- Romance/creepy = *obsessive affection played for laughs* ("you whispered for
  rather too long; it gives you a look"). Keep it about the trainer being a
  weirdo, not about the Pokémon.

The implementing agent should keep copy within this ceiling and surface anything
borderline for sign-off. **This is a content decision — flag it; don't guess.**

---

## 8. Test plan (leave-behind)

- **Pure scoring:** `score01 → points` is deterministic and clamped to
  `[base, base+bonus]`.
- **Backfire:** Template D past `backfireAt` yields ≤ 0 gain.
- **Preference stability:** `campPreference(slot)` is identical across calls for
  the same `slot.id`, varies across ids.
- **Determinism:** a full interaction with fixed `runSeed` reproduces points.
- **Budget:** the 4th interaction in a visit (default budget 3) is unavailable.
- **No bare RNG:** grep guard — camp code paths don't call `Math.random` directly
  for scored outcomes (use `storyRngNext`).

---

## 9. Decisions for the maintainer (this doc)

- **D5** (shared) interactions per camp visit — default 3.
- **D10** content-tone ceiling for the cruel / romance paths (recommend
  cartoonish dark-comedy; never genuine cruelty/inappropriate).
- Template tuning (rounds, base/bonus, backfire thresholds) — all data, your call.
