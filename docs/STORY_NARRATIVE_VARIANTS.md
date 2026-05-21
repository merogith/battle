# Story Narrative Variants — Design Spec

This is the canonical design for the **8-storyline system** layered over the existing
68-row story timeline (`STORY_EVENTS_RAW`). Each new run rolls (or the player picks)
one of 8 narrative variants. The variant doesn't change the battle pipeline — it
re-skins the prose, cold-opens, broker dialogue, Mystery Figure identity, and the
legendary "sighting" cinematic, so the same fight beats land with very different
weight.

The system reuses everything the codebase already has:

* `STORYLINE_VARIANTS` (one-entry table → eight entries)
* `STORY_COLD_OPENS` (cold-open dispatcher already wired)
* `STORY_BEATS[rowId].coldOpen` (per-row scene hook)
* `MYSTERY_FIGURE_IDENTITIES` (per-variant identity bias)
* `_BOSS_LEAD_FLAVOR` (per-variant broker line override)
* `roamingLegendary` interrupt (new sighting cinematic in front of the catch screen)
* `enterCatchEncounter` (new first-sighting lore overlay on darker variants)
* Existing trainer sprites, type-themed menu backgrounds, SFX library

No new save schema. `sm.storyLine` already exists at v17. No new battle mechanics.
No new item types. No new species data. **Pure additive narrative.**

---

## 1. The four tiers, eight variants

Each variant has a *tier* (tone ceiling), a *defaultTone* (used for in-game accent
colors / subtle visual cues), and 4–6 stable plot beats that fire at fixed rows
of `STORY_EVENTS_RAW`.

| Tier            | Variant id           | Title                       | One-line pitch                                                                 |
|---              |---                   |---                          |---                                                                              |
| Classic         | `classic`            | The Champion's Road         | Standard journey — mentor, rival, eight badges, the wall in the Plateau.        |
| Classic         | `second_sun`         | The Second Sun              | You are the second-best trainer out of Pallet. The journey is catching up.      |
| Mature canon    | `bone_keepers`       | Bone Keepers                | A trainer's road through a region that buries its dead and remembers them.      |
| Mature canon    | `project_mewtwo`     | Project Subject Zero        | Your starter has a barcode. The lab on Cinnabar never closed.                   |
| Soft creepypasta| `hypnos_lullaby`     | Hypno's Lullaby             | Children have been disappearing across every gym town. So has a Hypno.          |
| Soft creepypasta| `dead_raticate`      | The Empty Slot              | Your rival has six Pokémon. After Lavender Town, they have five.                |
| Full creepypasta| `lavender_frequency` | Lavender Frequency          | The radio in every Pokémart plays the same tune. Some players hear it different.|
| Full creepypasta| `static`             | STATIC                      | Your save was already played. The cartridge remembers. The cartridge is angry.  |

**Random roll**: on new run, if the player picks `Surprise Me`, the engine rolls
one of the eight uniformly. The chosen variant is shown on the run-setup confirm
modal (no hidden surprise — the player knows what tone they're walking into).
**Explicit pick**: the player can choose any variant by name from the trainer-create
screen, with a "tone warning" on the two pasta-tier variants.

**Stability**: `sm.storyLine` is locked once the run starts. The variant cannot be
changed mid-run — that would break beat dedupe (`tipsShown[metaKey]`). NG+ on the
same save offers a re-roll.

---

## 2. Plot beats per variant

Every variant fires cold-opens at six **stable beats**:

| Beat            | Event row(s)            | Existing trigger                | Narrative purpose                          |
|---              |---                      |---                              |---                                          |
| Intro           | 68 (intro rival)        | introRival cold-open            | Set tone in the first 30 seconds            |
| Gym 1 victory   | 5 (Gym Leader 1)        | first gym beat (new)            | Confirm the variant's first plot hook       |
| Mid pivot       | 24 (Gym Leader 4)       | gym 4 beat (new)                | Halfway turn — stakes deepen                |
| Pre-League      | 53 (Gym Leader 8)       | gym 8 beat (new)                | Late escalation                             |
| Champion        | 64 (Champion)           | champion beat (new)             | The climax framing                          |
| Caged God       | (post-HoF / boss arc)   | bossCollectLead + bossEnterCage | Per-variant epilogue                        |

Plus two **dynamic** scenes:

* **Roaming legendary sighting** — fires once per roaming spawn (the Gym 8
  victory queues this on the route from City 8 to the League city). The route
  appearance overlay carries per-variant framing and per-species lore (e.g.
  Suicune as a north wind that purifies grief, Mewtwo as a barcoded escapee).
* **Mystery Figure intro/outro** — `MYSTERY_FIGURE_IDENTITIES` already has 7
  identities; the variant biases which identity rolls and overlays additional
  lines on the existing intros/outro.

---

## 3. Variant detail

### 3.1 Classic — `classic` ("The Champion's Road")

The journey we already ship. Mentor Professor, rival from Pallet, eight badges,
Indigo-style Plateau. This is the default and the warm baseline against which
all other variants read.

**Intro**: rival blocks the route gate, starter duel.
**Gym 1 victory**: badge ceremony — Professor's voice on the city PA.
**Mid pivot (Gym 4)**: route narration about how far Pallet feels.
**Pre-League (Gym 8)**: the road has run out of cities; what's left is the climb.
**Champion**: a quiet hallway. The Champion's chair. The crown.
**Caged God** (post-HoF): the broker hands you a Master Ball. "One last thing."

**Roaming legendary**: framed as a *sighting* — a once-in-a-decade wild appearance.
**Mystery Figure bias**: any of the seven identities, fully random.

Tone words: confident, warm, traditional, *Pokémon novel*.

---

### 3.2 Classic — `second_sun` ("The Second Sun")

You and your rival picked up your starters the same morning. They were already
better. Every gym you reach, they cleared a day before. The journey is honest
work — you'll meet them at the top, and you'll be ready.

**Intro**: you lose the starter duel. Professor steps in: "First and second are
real differences. They don't last forever." Lucky Egg is gifted by Oak. Lost
fight is canon; you continue.
**Gym 1 victory**: you finally beat a leader the same week your rival did.
**Mid pivot (Gym 4)**: the gym's wall has a fresh badge plaque with your rival's
name on top of yours.
**Pre-League (Gym 8)**: the rival has skipped town to train alone in Victory Road.
**Champion**: the Champion *is* your rival. The shared starter morning was always
heading here.
**Caged God**: the rival hands you the key. "You earned this one. Mine first."

**Roaming legendary**: rival usually sees them first — the route NPC tells you
"your friend was here, asking after a glow on the ridge."
**Mystery Figure bias**: the rival's "Eldritch" / cursed-self identity overlay
(uses cursed trainer sprite from `TRAINER_QUOTES_BY_NAME`).

Tone words: humble, determined, bittersweet, *the long road*.

---

### 3.3 Mature canon — `bone_keepers` ("Bone Keepers")

Lavender Town is real. Marowak's death at the hands of Team Rocket is canon
(Gen 1/2 Pokédex). This variant treats City 4 as a graveyard town and threads
the journey with quiet grief — restraint over horror.

**Intro**: Professor asks if you're sure you want to leave. "The road north
passes the tower." Doesn't elaborate.
**Gym 1 victory**: badge ceremony interrupted by a funeral procession on the
adjacent street. No one acknowledges it.
**Mid pivot (Gym 4)**: City 4 *is* the tower town. The City Guide says "every
trainer who comes here leaves something behind." Cubone Pokédex line surfaces
on first-sighting in the catch screen.
**Pre-League (Gym 8)**: a Marowak watches you from the route hilltop. It
doesn't move. It doesn't attack. The City Guide later says "it's been waiting
for someone since I was a kid."
**Champion**: the Champion's chamber is darker than the others. The Champion
mentions a Pokémon they never had time to bury.
**Caged God**: not a legendary — a singular Marowak in a chained tomb. Broker:
"It wants peace. Master Ball gives it peace."

**Roaming legendary** (when one rolls): always framed as a guardian of the
dead. Suicune purifies grief. Lugia carries the lost.
**Mystery Figure bias**: 60% `cyrus` (cold) or new identity `ex_rocket` —
"Rocket grunt who never left the tower". Quiet, gaunt, no theatrics.
**Lavender first-sighting lore** for Cubone, Yamask, Marowak, Drifloon, Phantump.

Tone words: grief, restraint, *the unspoken*, the long memory.

---

### 3.4 Mature canon — `project_mewtwo` ("Project Subject Zero")

The Cinnabar lab from canon never closed. The Professor at City 0 used to
work there. Your starter has a stat slip and a barcode. The Caged God arc
is no longer subtext — it's the spine.

**Intro**: Professor's hand shakes when they hand you the starter. They almost
say something, then don't.
**Gym 1 victory**: a lab assistant on the route stops you. "0001 sends regards."
Hands you a Quick Ball. Walks away.
**Mid pivot (Gym 4)**: a chain-link fence around the Safari Zone has a torn
research badge on it. "Project: 0001 / Cinnabar Annex". Date is two years ago.
**Pre-League (Gym 8)**: Colress (or City 6 Colress's lab proxy) reveals he was
the lab's last director. He gives you the broker's address.
**Champion**: the Champion is the lab's first volunteer. They lost. They became
"useful to the project". They want you to win — to break the cycle.
**Caged God**: literal Subject Zero. Master Ball. The forced 1% catch rate
*is* the rigged experiment.

**Roaming legendary**: always appears bandaged or scarred. Brief telepathy
fragment: "RUN". You can't.
**Mystery Figure bias**: 70% `cyrus` or new identity `dr_proxy` — "the Director
who got out". Briefcase, lab coat, broken smile.
**First-sighting lore** for Mewtwo, Porygon, Voltorb (made by science),
Magnemite (artificial), Genesect (revived weapon).

Tone words: scientific dread, *we made this*, complicity, the door we shouldn't
have opened.

---

### 3.5 Soft creepypasta — `hypnos_lullaby` ("Hypno's Lullaby")

Children have been going missing in every gym town. A Hypno has been spotted
at every route. The investigation isn't yours — but you're a witness.

**Intro**: rival mentions their kid sister is missing. They're going to find
her. You're going to the gym. Both real journeys start the same morning.
**Gym 1 victory**: the news plays on a radio at the gym lobby. Three more
children missing. The newscaster sounds tired.
**Mid pivot (Gym 4)**: a Hypno is sighted at the Safari Zone gate. The
warden is shaken. He didn't sell you a ticket — "find your friend's sister
first."
**Pre-League (Gym 8)**: rival catches up. Sister still missing. They join you
on the route. (Narrative — no team merge.)
**Champion**: the Plateau hall has children's drawings on the walls. They are
*all* of a Hypno. The Champion doesn't comment.
**Caged God**: not Hypno — the children's last shared dream. A psychic-type
legendary. The broker's voice cracks when describing it.

**Roaming legendary**: bias toward Psychic types (Mewtwo, Mew, Cresselia,
Tapu Lele). Each appears with hypnotic afterimages.
**Mystery Figure bias**: 50% `n` (psychic empathy), 50% new identity
`pendulum_man` — "the one we don't talk about". Pendulum sprite (uses an
existing item icon).
**First-sighting lore** for Hypno, Drowzee, Munna, Cresselia, Mew.

Tone words: hypnotic, *the smiling man*, slow dread, lullaby.

---

### 3.6 Soft creepypasta — `dead_raticate` ("The Empty Slot")

This is the Gary's-dead-Raticate theory built into a journey. Your rival has
six Pokémon at every encounter — including a clearly loved Raticate. After
Lavender Town, the Raticate is gone. The empty slot stays empty.

**Intro**: rival's intro animation shows six sprites on their party belt.
**Gym 1 victory**: rival shows up post-fight, brags about their Raticate
sweep at the same gym.
**Mid pivot (Gym 4)**: you visit Lavender Town's tower. A figure is hunched
by a fresh stone. They don't turn around. It's your rival.
**Rival mid-fight (row 12)**: rival's team renders five sprites + one grayed
slot. They don't mention it. You don't either.
**Pre-League (Gym 8)**: rival's intro line is one word: "Let's go."
**Champion**: rival's victory line is silence.
**Caged God**: the broker has a stuffed Raticate on the shelf. "Came in with
a kid who couldn't keep going." Hands you the leads.

**Roaming legendary**: framed as something the rival wanted to catch and
couldn't bring themselves to.
**Mystery Figure bias**: 80% rival's "Pale" / cursed variant — gaunt, blank,
the friend who broke.
**First-sighting lore** for Raticate, Rattata (the friend's bond),
Marowak (the one who lost), Honedge (a partner's keepsake).

Tone words: grief without ceremony, *the friend who broke*, the empty slot.

---

### 3.7 Full creepypasta — `lavender_frequency` ("Lavender Frequency")

The first variant that bends the frame. The screen has subtle visual glitches
on cold-opens — slight color shifts, a dimmer dialog box, the radio NPC in
the mart plays the Lavender Town theme at unusual moments.

**Intro**: rival's name flickers in the dialog (`displayRival` overlay
applies a CSS jitter class). They look at you and ask, "wait, have we
done this before?"
**Gym 1 victory**: the Leader hands you the badge and pauses: "you've got
the same look as the last one."
**Mid pivot (Gym 4)**: City Guide says "you weren't supposed to come back
here." Walks off. You hear the Lavender theme from a Pokémart radio two
streets over.
**Pre-League (Gym 8)**: the Champion's plaque on the wall has *your* name
on it, weathered. Below yours is a clean empty plate.
**Champion**: the Champion takes their cap off. It's you. The fight starts
anyway.
**Caged God** ("BURIED ALIVE"): a half-buried figure in the corner of the
catch screen. A trainer who never left.

**Roaming legendary**: always titled "?????" until caught. Catching it
shows the species name.
**Mystery Figure bias**: 100% new identity `buried_alive` — half-buried
sprite (uses ground-type aesthetic). One line of dialogue: "You shouldn't
be here."
**Visual treatment**: cold-opens carry a `.story-tone-frequency` CSS class
adding hue-shift filter + scanline overlay. Existing `danger.wav` plays
on cold-open dismiss.

Tone words: wrong, *you weren't supposed to come back*, the radio knows
something you don't.

---

### 3.8 Full creepypasta — `static` ("STATIC")

The save remembers. Cold-opens use literal save-file framing — "LOADED FROM
FILE B" headers, intentionally corrupted text (e.g. `???? ??? ??????`).
The starter's species is occasionally rendered with replacement-char glyphs.
This is the most aggressive variant; the tone warning calls it out.

**Intro**: the rival's name renders as `?????`. Dialog: "i ??n't kno? ?ou
?ut t?e fi?? ?as ?ou."
**Gym 1 victory**: badge text reads "ALREADY EARNED". Inventory shows
nothing was added — but `sm.gold` increases anyway.
**Mid pivot (Gym 4)**: starter speaks in a flickered overlay: "WHY DID YOU
ABANDON ME". One line, then it's gone.
**Pre-League (Gym 8)**: the gym is empty. No leader, no trainers, no
audience. A "Glitch" mon (rendered as `MissingNo`) waits. *Battle UI:
rolls a normal Gym Leader 8 fight.* The win line: "YOU'VE BEEN HERE
BEFORE."
**Champion**: the Champion's name is your save profile name. The Champion's
team is your party from save state at the time of intro.
**Caged God** ("?? Subject ???"): a corrupted legendary entry. After catch,
the Pokédex shows the real species name.

**Roaming legendary**: name rendered with one letter glitched. After catch,
species lore appears as a Pokédex "corrupted entry recovered" reveal.
**Mystery Figure bias**: 100% new identity `cartridge_self` — your trainer
sprite with inverted colors. One dialog line: "??? ?? ???? ?ime."
**Visual treatment**: cold-opens carry a `.story-tone-static` CSS class
adding text shake animation, occasional character replacement, dim color
ramp.

Tone words: glitched, *the cartridge remembers*, you are the haunt.

---

## 4. Cold-open scene helper

To keep cold-opens DRY across 8 variants × 4–6 beats each, introduce a single
shared renderer:

```js
function _renderNarrativeOverlay({ nameplate, sprite, name, lines,
                                   accentColor, toneClass, sfx, onDone }) {
    // Builds the standard story-dialog overlay (mirrors _showIntroRivalColdOpen
    // but with configurable accent color, sfx hook, and tone CSS class).
}
```

Every per-variant scene is a 5–10 line literal object — pure content.
The bus (`_runStoryColdOpen`) already handles dedupe via `tipsShown[metaKey]`,
so each scene fires exactly once per save.

---

## 5. Roaming legendary sighting

`battle.html:30916–30943` already queues a `pending` roaming legendary after
the gym 8 victory. Today the player gets:

* `showGameAlert(...)` toast: "📡 Sightings report: a wild Lugia..."
* Walks onto the catch screen with the message "A roaming Lugia! One throw —
  catch or it's gone forever."

The new flow inserts a cinematic **before** the catch screen:

```
Roaming queued (existing alert) 
  → next route fires `roamingLegendary` interrupt
  → NEW: `_showRoamingLegendarySighting(name, variantId, onDone)` overlay
       (variant + species lore, sfx: shine.wav, fade-in)
  → onDone → existing enterCatchEncounter(...)
```

The sighting overlay carries:

* A **dark animated background** (uses existing `bg_psychic.png` or
  type-matched battle BG; legendary's type drives the choice via
  `baseStats[name].types[0]`)
* A **sprite of the legendary** (front sprite at 192×192, drop-shadow)
* Per-variant **narrator block** (3 lines)
* Per-species **lore quote** (2 lines from a `_LEGENDARY_LORE` table —
  ~30 entries, one per sub-legendary in `SUB_LEGENDARY_POOL`)
* A **continue button** that drops into the existing catch screen unchanged

This is the *single biggest perceived improvement* — the user explicitly
called it out. It uses zero new assets.

---

## 6. Caged God broker leads

`battle.html:34439–34448` currently fires the broker leads via
`window.alert(flav.title + '\n\n' + flav.body)`. Replace with the same
overlay renderer used for cold-opens. Each variant gets a 3-line broker
voice override:

* `classic`: weary trader, terse.
* `bone_keepers`: speaks of "the ones who never asked to wear the skull".
* `project_mewtwo`: lab survivor, paranoid.
* `lavender_frequency`: doesn't blink. Mentions "the last buyer".
* `static`: lines are partially corrupted.

The 3 leads (Ledger / Recording / Key) stay structurally identical — only
the prose changes. Plot beat order is **stable**: ledger at City 2,
recording at City 5, key at City 8.

---

## 7. Mystery Figure per-variant bias

Today, `_storyEnsureMysteryIdentity` picks uniformly from 7 identities.
The new flow:

```js
function _storyPickMysteryIdentity() {
    const variant = STORYLINE_VARIANTS[sm.storyLine] || STORYLINE_VARIANTS.classic;
    const biasMap = variant.mysteryBias || null;
    if (biasMap) {
        // Weighted roll using biasMap: { identityKey: weight, ... }
        // If a variant-only identity (e.g. 'buried_alive') is keyed and
        // the identity table has the entry, it can win.
    }
    // Fall through to uniform random over MYSTERY_FIGURE_IDENTITIES keys.
}
```

Two new identities are added for the pasta variants:

* `buried_alive` (sprite: existing trainer sprite re-used + tone overlay) —
  Lavender Frequency exclusive.
* `cartridge_self` (sprite: the player's trainer sprite, inverted) —
  STATIC exclusive.

Both reuse existing sprite infrastructure (no new art).

---

## 8. First-sighting Pokédex lore

On `enterCatchEncounter`, if:

* Variant tier is `mature` or higher (`mature` / `soft_pasta` / `pasta`),
* And species hasn't been seen this save (`sm.pokedex.seen` check),
* And the species has a lore entry in `_FIRST_SIGHTING_LORE`,

…fire a one-time overlay **after** the encounter's slide-in, **before** the
first ball throw. The overlay reads a 2-line in-world quote and dismisses on
click. Dedupe via `tipsShown['firstsighting-' + speciesName]`.

Lore lines are written **once** (not per-variant) but only surface on
mature+ variants, keeping the classic tier untouched. Sample entries:

* **Cubone**: "It wears its mother's skull. The crying never quite stops."
* **Yamask**: "It carries a mask that was once its face. It looks at it sometimes, and weeps."
* **Drifloon**: "Children's stories warn against grabbing its string. Some children don't come back."
* **Hypno**: "Lavender Town keeps a missing-persons board. Three of them last saw a pendulum."
* **Litwick**: "Its flame is small and warm. It is fed by the life of whoever stands closest."
* **Phantump**: "Each one was a child who lost the road home. The tree took the rest."
* **Mewtwo**: "The lab notes call it 0002. There was a 0001."
* **Porygon**: "Code can be killed. They wrote it that way on purpose."

15–20 entries total. Each is a one-time read, drawn from real Pokédex
darkness — not invented horror.

---

## 9. Run-setup UI

A new picker in the trainer-create screen between **Difficulty** and
**Pokémon generations** (insertion point at `battle.html:6925`). The picker
shows:

```
3 — Storyline                                    [Surprise me]
──────────────────────────────────────────────────────────────
[ The Champion's Road ]  Classic — the standard journey.
[ The Second Sun     ]  Classic — you start second-best.
[ Bone Keepers       ]  Mature — a region that remembers.
[ Project Subject Zero] Mature — the lab on Cinnabar never closed.
[ Hypno's Lullaby    ]  Pasta (soft) — children have been disappearing.
[ The Empty Slot     ]  Pasta (soft) — your rival has six. Then five.
[ Lavender Frequency ]  Pasta (full) — visual tone warning.
[ STATIC             ]  Pasta (full) — visual tone warning.
[ Surprise Me        ]  Roll one at run start.
```

Cards mirror the existing `.story-create-diff-card` style. Two-line cards
(title + tagline). Pasta-tier cards carry a subtle warning glyph.

`Surprise Me` rolls on `confirmTrainerAndStart` and shows the chosen
storyline name + tone in a one-line confirmation banner before the trainer
sprite slide.

---

## 10. CSS tone classes (subtle, optional)

Each variant maps to a CSS tone class applied to its cold-open overlay:

| Variant              | Class                       | Visual delta vs. classic                            |
|---                   |---                          |---                                                  |
| classic              | (none / `.story-tone-warm`)  | Current look.                                        |
| second_sun           | `.story-tone-amber`         | Warm amber accent on dialog nameplate.              |
| bone_keepers         | `.story-tone-ash`           | Cool gray, slight desaturation.                     |
| project_mewtwo       | `.story-tone-cold`          | Teal/cyan accent, slight scanline.                  |
| hypnos_lullaby       | `.story-tone-purple`        | Purple accent, subtle gentle pulse.                 |
| dead_raticate        | `.story-tone-mourning`      | Muted gray with one slot of color (gray + amber).  |
| lavender_frequency   | `.story-tone-frequency`     | Hue shift, scanline overlay, dimmer dialog.         |
| static               | `.story-tone-static`        | Text-shake animation, occasional char replacement.  |

All effects are CSS-only — no JS animation library required. The classes
graceful-degrade if a variant has no override (falls back to the standard
look).

---

## 11. Plot-beat content tables

Each variant has a `beatOverrides` map keyed by event-row id. Each entry
sets `coldOpen: '<sceneKey>'`. The scenes live in `STORY_COLD_OPENS`. So
the data layout is:

```js
const STORYLINE_VARIANTS = {
    classic: {
        id: 'classic',
        label: 'The Champion\'s Road',
        tier: 'classic',
        toneClass: '',
        description: 'Standard journey.',
        beatOverrides: {
            68: { coldOpen: 'introRival' },          // existing
            5:  { coldOpen: 'classicGym1' },
            24: { coldOpen: 'classicGym4' },
            53: { coldOpen: 'classicGym8' },
            64: { coldOpen: 'classicChampion' },
        },
        legendaryFrame: 'classic',                    // for sighting overlay
        brokerVoice: 'classic',                       // for Caged God leads
        mysteryBias: { /* uniform */ },
    },
    // ...
};
```

`STORY_COLD_OPENS` grows from 1 entry to ~33 entries (intro × 8 + gym1 × 8 +
gym4 × 8 + gym8 × 8 + champion × 8 — minus shared scenes where two variants
reuse a base, e.g. `classic` and `second_sun` share the intro slot
with different scene content).

The content is pure text + sprite refs. No JS logic in scenes.

---

## 12. Phasing

The whole system ships as one branch (`claude/pokemon-mature-storyline-Xk3ut`)
because the 8 variants are co-dependent — partial coverage would let the
player roll a variant with missing scenes. Internal phasing for diff review:

| Phase | Scope                                                           | LOC est. |
|---    |---                                                              |---       |
| A     | CSS tone classes + narrative overlay helper                    | ~120     |
| B     | STORYLINE_VARIANTS table (8 entries with metadata)              | ~100     |
| C     | STORY_COLD_OPENS scenes (intro + 4 per variant = ~33 entries)    | ~600     |
| D     | STORY_BEATS wiring (variant beatOverrides → cold opens)         | ~80      |
| E     | Roaming legendary sighting cinematic (+ lore table)             | ~250     |
| F     | Caged God broker overlay (replaces alert)                       | ~120     |
| G     | Mystery Figure variant identities (`buried_alive`, `cartridge_self`) | ~80 |
| H     | First-sighting Pokédex lore (15 entries + dispatcher)           | ~150     |
| I     | Run-setup UI: storyline picker card grid                        | ~180     |
| J     | CHANGELOG entry                                                  | ~40      |

Total: ~1,700 LOC, almost entirely new content + small dispatch helpers.

---

## 13. What we are NOT changing

To keep the change cleanly additive and reviewable:

* **`STORY_EVENTS_RAW`** is untouched (no new rows, no reordering).
* **Battle pipeline** (`startBattle`, `rollTrainerTeam`, `enterCatchEncounter`)
  is untouched. The new helpers are called from existing hooks.
* **Save schema** is untouched. `sm.storyLine` already exists at v17.
* **Difficulty / generation / mechanics tables** are untouched.
* **Existing 14 tutorial scenes** keep their copy. Tutorials are mechanic
  intros, not narrative — they stay neutral across variants.
* **Existing 7 Mystery Figure identities** keep their dialogue. The two new
  pasta-tier identities are additions, not replacements.

The variant system is a **prose-and-sprite layer over a static engine**. The
player can pick their tone without forking the game.

---

## 14. Open items (deferred to next pass)

* **Per-variant battle BGM**: each variant could swap `music/themes/` track
  on cold-opens. Deferred — adds complexity, and audio mixing is finicky.
* **Per-variant rival sprite**: `dead_raticate` could use a single specific
  rival sprite (the "broken friend"); `static` could invert the player's
  sprite. Deferred — the sprite roller is fine for now.
* **NG+ variant re-roll**: today the variant is locked per save. NG+ would
  benefit from "play through every variant" tracking. Deferred to a meta
  pass.
* **Achievement: One of Eight**: clear the game on each variant. Deferred —
  achievements live in a different table and a single pass over all 8 takes
  a lot of playtime.
* **Crucible / Frontier flavor per variant**: post-HoF endless content reads
  as variant-neutral today. Could deepen per variant later.

---

## 15. References

* `STORY_MODE_FLOW.md` §17 (event registry & storyline architecture)
* `battle.html:30566` — `STORY_BEATS`
* `battle.html:30592` — `STORY_COLD_OPENS`
* `battle.html:30815` — `STORYLINE_VARIANTS` (this is the table we are
  growing from 1 → 8)
* `battle.html:30916` — `roamingLegendary` interrupt
* `battle.html:34337` — Caged God boss arc
* `battle.html:26426` — `MYSTERY_FIGURE_IDENTITIES`
* `battle.html:33069` — `_showIntroRivalColdOpen` (renderer pattern we
  generalize into `_renderNarrativeOverlay`)
