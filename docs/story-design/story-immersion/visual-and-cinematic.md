# Story Immersion · Stream 3 — Visual & Cinematic

> **Stream:** 3 of the Story Immersion design initiative — scenes, sprites, animation,
> cinematics, and correct encounter framing (incl. the raid trainer-intro fix).
> **Status (2026-06): SHIPPED.**
> - §4 raid trainer-intro fix + §4.4 **Option A** (miniRaid2) — ✅ `story-raid-framing.test.js` (merged, #242)
> - §5 pre-boss cinematic (canon villain bosses/admins + Mystery apex + **Champion**) — ✅ `story-preboss-cinematic.test.js`
> - §6.4 portrait-emotion + **rival sprite progression** (Blue→Blue-2→Blue-Champion) — ✅ `story-rival-progression.test.js`
> - §6 in-battle impact — ✅ multi-hit shake/hit-sound **parity** shipped (`battle-hit-impact.test.js`)
>
> **Still DESIGN-ONLY:** §6.1 graded hit tiers and §6.2 hit-stop (the existing per-hit
> pacing already covers most of the feel; deferred as lower-value). All variance uses
> seeded RNG (`storyRngNext`), never bare `Math.random()`.
> **Asset budget:** reuse the shipped engine + existing art only. No new heavy assets,
> no base64 inlined into the 4 MB `battle.html` — honored (the fix added zero art/CSS).

### ⚠ A note on inputs (read me first)

The dispatching brief named two source files —
`docs/story-design/story-immersion-briefs/03-visual-and-cinematic.md` (this stream's
brief) and `.../NARRATIVE-CRAFT.md` (the shared craft playbook) — plus
`docs/story-design/camp/EVENT_CINEMATICS.md`. **None of the three exist** in the repo,
git history, or any branch, and nothing was attached to the session. This spec is
therefore built from the **task statement + the actual code** (the overriding
instruction: *"ground every point in the actual code"*). The deliverable structure
(framing matrix · raid-fix · pre-boss template · per-event beat catalogue · impact
layer · mocked frames) is taken verbatim from the task. If a real brief surfaces, diff
it against §3–§7 before building.

The one shipped design doc that *does* cover this surface —
[`docs/story-design/STORY_NARRATION_SYSTEM.md`](../STORY_NARRATION_SYSTEM.md) — is the
contract this spec extends, not replaces.

---

## 1. Current state (audit)

Story presentation is **mature and well-factored** on the narration side and **uneven**
on the cinematic/encounter side. The good news: almost everything this stream wants
already exists as a reusable primitive. The work is *routing the right primitive to the
right moment*, not building new engines.

**What's already excellent**

- **One canonical narration overlay.** `_renderNarrativeOverlay` (`battle.html:47752`)
  is a single declarative renderer — sprite · nameplate · banner · lines · choices ·
  `metaKey` dedupe · `onDone` · `sfx` · `toneClass` — with an **anti-stacking queue**
  (`_narrationLive` / `_narrationQueue` / `_narrationMountNext`). All 198 story scenes
  render through it via the `STORY_SCENES[key].acts` schema. This is the spine the whole
  initiative leans on.
- **A real cinematic already ships.** `_showRoamingLegendarySighting`
  (`battle.html:47964`) is a full-screen Pokémon-encounter cinematic: type-driven
  background, glowing species sprite, per-species lore (`_LEGENDARY_LORE`, 60+ canon
  entries at `47891`), narrator dialog, and an "Approach the legend →" button. It is
  **the template the raids should have been using** (§4, §5).
- **A rich FX bus.** `window.StoryFx` (`battle.html:29754`) exposes encounter staging,
  ball-throw, an **evolution cinematic** (`evolutionScene`, silhouette → ray → morph →
  flash → reveal), `flashPulse`, `floatCoin`, Pokémon cries (`AudioSystem.playCry`), and
  `playSfx`. It already honors `prefers-reduced-motion` (caps waits to 80 ms).
- **z-index is tokenized.** Every story overlay resolves through `var(--sn-z-*)`
  (scrim 1200 · battle-banner 9000 · overlay 9998 · spotlight 9999 · toast 10001). New
  cinematics must use these tokens, never literals.
- **Reduced-motion discipline is real.** 19 `prefers-reduced-motion` guards in
  `battle.html`; the VS-splash and StoryFx both opt out of motion correctly.

**What's broken or missing (this stream's work)**

1. **Raids wear a stranger's face.** Extra-track raids fight ONE scaled wild boss
   Pokémon (Marowak, Hypno, Mewtwo…) but are introduced with the **trainer VS-splash**
   (`showBattleIntro`, `battle.html:48483`) — player sprite vs a *random human trainer*
   sprite, a "VS" glyph, and a generic trainer quote. The player reads "VS Bug Catcher,"
   then a lone spirit-Marowak walks on. This is the headline fix (§4).
2. **A second mini-raid silently fights the wrong thing.** `extra.<arc>.miniRaid2`
   ("The Same One, Evolved" — *authored* as a solo evolved boss) never substitutes its
   boss Pokémon because the team-roller regex excludes the `2` suffix. It fights a rolled
   trainer team today (§4.4). Data/balance bug, surfaced by the framing audit.
3. **No pre-boss cinematic.** Villain bosses (Giovanni…Penny) and the Mystery Figure get
   the same VS-splash as a route Bug Catcher — only the accent color and an extra line
   differ. There's no "the doors open" beat (§5).
4. **The impact layer is inconsistent.** The **single-hit** damage path already has good
   feel — anime.js hit-flash + recoil, `playHitSound(typeEff)`, and a crit/super-effective
   **screen-shake** (`battle.html:24923/24927`). But the **multi-hit** path only does the
   bare `anim-hit-flash` + popups — no shake, no hit sound — so multi-hit moves land flat.
   (The CSS `.anim-shake`/`shakeScreen` keyframe at `4650/4656` is a separate, genuinely
   *unused* artifact — the engine shakes via anime.js, not that class, so it's a red
   herring, not the wiring target.) No hit-stop; no portrait reaction for recurring cast
   (§6). ✅ **The multi-hit parity gap is now fixed** (see §6).
5. **`_storyScene` is still off-canon.** The Daycare/Fight-Club overlay
   (`battle.html:45100`) is a bespoke box, not folded onto `_renderNarrativeOverlay`
   (open item §6.2 of `STORY_NARRATION_SYSTEM.md`). Out of this stream's critical path,
   noted for the catalogue.

---

## 2. Reusable-engine inventory

The contract for this whole spec: **reuse these, build almost nothing.**

| Capability | Symbol / asset | Where | Reuse for |
|---|---|---|---|
| Canonical overlay (sprite·lines·choices·queue) | `_renderNarrativeOverlay` | `battle.html:47752` | every narrative beat; pre-boss template body |
| Scene schema (`acts`/`outro.win`) | `STORY_SCENES[key]` | `battle.html:~33000–34900` | per-event beat catalogue (§6) |
| **Pokémon-encounter cinematic** | `_showRoamingLegendarySighting` | `battle.html:47964` | **raid intro** (§4) + pre-boss (§5) |
| Cinematic shell CSS | `.story-legend-sighting*` | `battle.html:2498–2528` | raid/boss cinematic styling |
| Per-species lore (canon) | `_LEGENDARY_LORE` | `battle.html:47891` | raid lore lines |
| Trainer VS-splash | `showBattleIntro` | `battle.html:48483` | trainer fights only (NOT raids) |
| VS-splash CSS (slide/pop/flash) | `.vs-stage`/`.vs-flash`/`.vs-glyph` | `battle.html:2753–2770` | pre-boss "VS" beat (§5) |
| In-battle gimmick banner | `_showBossBanner` | `battle.html:43286` | boss-phase impact banner (§6) |
| Banner CSS | `.gimmick-banner` | `battle.html:4773` | — |
| FX bus (cries, sfx, flash) | `window.StoryFx` | `battle.html:29754` (API `30380`) | all motion/sound |
| Evolution cinematic | `StoryFx.evolutionScene` | `battle.html:29938` | reference for cinematic phasing |
| Encounter stage (boss tone exists) | `StoryFx.buildEncounterStage` | `battle.html:29793` | catch screen; raid sprite stage |
| Generic element flash | `StoryFx.flashPulse` | `battle.html:30089` | impact flash (§6) |
| Reduced-motion gate | `StoryFx.isReducedMotion()` | `battle.html:30381` | every new animation |
| In-battle hit flash (wired) | `.anim-hit-flash`/`hitFlash` | `battle.html:4654/4660` | impact layer baseline |
| Flinch shake (wired) | `.anim-flinch`/`flinchShake` | `battle.html:4846`, used `27098` | — |
| Faint anim (wired) | `.anim-faint`/`faintAnim` | `battle.html:4651/4657` | — |
| **Screen-shake (DEFINED, UNWIRED)** | `.anim-shake`/`shakeScreen` | `battle.html:4650/4656` | **wire for impact** (§6) |
| Battle sprite hooks | `#foe-sprite`, `#player-sprite` | `battle.html:9829/9836` | impact targets |
| In-battle BG (terrain) | `getBattleBgUrl(terrain,layout)` | `battle.html:9935` | 5 terrains × 3 layouts |
| Cinematic/menu BG (type) | `sprites/backgrounds/menu/menu_bg_<type>.png` | 18 types | raid/cinematic backdrops |
| Story scene BG | `sprites/story/backgrounds/gen3-*.png` | cave/forest/lab/league/mansion/mountain/safari/sea/villain | scene framing |
| Trainer art | `sprites/trainers/*.png` | 421 files | cast portraits |
| Raid roster | `_EXTRA_RAID_SPECIES` | `battle.html:43257` | raid species (§4) |
| Raid banners | `_populateExtraRaidConfigs` | `battle.html:43224` | raid cinematic banner text |
| Raid foe roll | `_rollExtraRaidBossTeam` | `battle.html:43265` | the predicate the intro must mirror |
| Canon-trainer map | `BEAT_CANON_TRAINER` | `battle.html:43157` | pre-boss cast identity (§5) |

**Background taxonomy (do not confuse the three sets):**

- **In-battle backdrop** — `sprites/backgrounds/battle/{desktop,portrait,landscape}/bg_<terrain>.png`,
  terrains `neutral · grassy · electric · psychic · misty` only (`BATTLE_BG_TERRAINS`,
  `battle.html:9932`). Driven by `state.terrain` via `refreshBattleBg` (`9945`).
- **Cinematic / menu backdrop** — `sprites/backgrounds/menu/menu_bg_<type>.png`, all 18
  types. This is what `_showRoamingLegendarySighting` uses for its type-themed wash.
- **Scene backdrop** — `sprites/story/backgrounds/gen3-*.png` + city SVGs, for narrative
  scenes (lab, league, mansion, mountain, sea, villain…).

---

## 3. The visual framing matrix

Every story encounter should declare **what kind of moment it is**, and the kind picks
the framing. Today only two framings exist (trainer VS-splash, legendary cinematic) and
raids are mis-bucketed. The matrix below is the contract.

| Encounter kind | Beat `kind` / source | Framing | Engine | Background | Foe portrait | Theme | Banner |
|---|---|---|---|---|---|---|---|
| Route trainer | `battle`, Basic/Gym Trainer | Trainer VS-splash | `showBattleIntro` | (none; → battle BG) | trainer sprite | `trainer` | — |
| Gym Leader | `Gym Leader N` | Trainer VS-splash (major) | `showBattleIntro` `vs-big` | — | leader sprite | `leader` | — |
| Rival | `Rival` | Trainer VS-splash + taunt line + phase tagline | `showBattleIntro` | — | rival sprite | `rival` | — |
| Villain mini-boss | `miniBoss` (canon) | Trainer VS-splash → **pre-boss cinematic** (§5) | `showBattleIntro` + new | scene BG (`gen3-villain`) | canon admin | `boss` | — |
| Villain boss | `boss` (canon) | **Pre-boss cinematic** → VS-splash | new template (§5) | `gen3-villain` | canon boss | `boss` | phase banners |
| **Raid (solo wild boss)** | `raid` / `miniRaid` / `miniRaid2` | **Pokémon raid cinematic** (NOT trainer) | `_showRaidEncounterIntro` (§4) | `menu_bg_<species-type>` | **species sprite** | `boss` | phase banners |
| Roaming legendary | `STORY_BATTLE_INTERRUPTS` | Legendary sighting cinematic | `_showRoamingLegendarySighting` | type BG | species sprite | (catch) | — |
| Wild / Safari catch | catch encounter | Encounter stage | `StoryFx.buildEncounterStage` | stage gradient | species sprite | (field) | — |
| Mystery Figure (apex) | `mysteryBoss` | **Pre-boss cinematic** (max) → VS-splash | new template (§5) | dark/league | masked face | `boss` | apex phase |
| Evolution | post-battle | Evolution cinematic | `StoryFx.evolutionScene` | full-screen | species silhouette→reveal | — | — |

**Reading the matrix:** the only structural change is the raid row — it must move from
the trainer column to the Pokémon column. The pre-boss cinematic (§5) is *additive* (a
new beat *before* the existing VS-splash for canon bosses), so it changes nothing about
how trainer fights resolve.

---

## 4. Raid trainer-intro fix  ⚠ SIGN-OFF

> ✅ **IMPLEMENTED (2026-06).** Both the framing change (§4.3) and **Option A** of the
> scope decision (§4.4) shipped. Symbols as built: `_raidBossInfoForBeatKey` (shared
> predicate), `_rollExtraRaidBossTeam` (now reads it), `_showWildEncounterCinematic`
> (the generalized shell), `_showRaidEncounterIntro`, `_RAID_LORE`, `_raidNarratorLines`,
> and the `_runEncounterIntro` shim in `enterBattleEvent`. Guarded by
> `tests/suites/story-raid-framing.test.js`. The §4.1–§4.5 text below is the as-designed
> record.

### 4.1 The bug, exactly

Extra-track raids are fights against **one** scaled legendary-tier Pokémon, not a
trainer team:

```
_EXTRA_RAID_SPECIES (battle.html:43257)
  cubone → Marowak    yamask → Yamask     hypno → Hypno       phantump → Trevenant
  mimikyu → Mimikyu   drifloon → Drifblim parasect → Parasect mewtwo → Mewtwo
```

The dispatch in `enterBattleEvent` (`battle.html:48278`) does this:

1. Resolves the in-flight beat, stamps `sm._activeBeatBattleKey` (`48320–48322`).
2. Plays the raid's narrative scene via `_playStoryBeatScene` — *correct* framing:
   *"The Lavender Marowak stands in the road…"* (scene data at `34509+`).
3. Re-enters, resolves a **trainer** for the natural row (`48356–48394`).
4. Calls **`showBattleIntro(trainer, event, …)`** (`48422` lock path / `48434` roll
   path) — the trainer VS-splash: `<img … src="${getTrainerSprite(trainer)}">`
   (`48520`), a "VS" glyph, a `roleLabel` ("Basic Trainer"), and a generic trainer quote.
5. *Inside* that intro's callback, the foe team is swapped to the solo boss via
   `_rollExtraRaidBossTeam(sm._activeBeatBattleKey)` (`48439`).

So the splash shows a **human trainer the player never fights**, immediately before a
lone spirit-Pokémon walks on. The narrative scene built dread; the VS-splash punctures it.

Why it slips through: raids have **no `BEAT_CANON_TRAINER` entry** (that map is villain
bosses/admins only, `43157`), and `miniRaid` isn't in the canon-override `_isInsertKind`
set (`48332`). So no trainer *identity* is forced — but the natural row's rolled trainer
is still what `showBattleIntro` paints.

### 4.2 Mocked frames — before vs after

**BEFORE (today): `extra.cubone.raid`**

```
   ── narrative scene (correct) ──────────────────────────────
   The Lavender Marowak stands in the road — the mother every
   version of this story grieves…                  [ Continue → ]

   ── THEN: trainer VS-splash (WRONG) ───────────────────────┐
   │   ╔═══╗            V S            ╔═══╗                  │
   │   ║you║  ◀slide                   ║ ?? ║  slide▶          │   z = --sn-z-spotlight
   │   ╚═══╝         (white flash)     ╚═══╝                  │
   │              [ Bug Catcher ]                             │   ← a random human
   │   ┌─────────────────────────────────────────────────┐   │
   │   │ Basic Trainer                                     │   │   ← wrong role label
   │   │ "You want past? Win first."                       │   │   ← generic quote
   │   └─────────────────────────────────────────────────┘   │
   │                Battle starting…                          │
   └──────────────────────────────────────────────────────────┘
   ── battle: a lone scaled Marowak walks on. ───────────────
```

**AFTER (proposed): `_showRaidEncounterIntro('Marowak', …)`** — reuses the
`.story-legend-sighting` shell:

```
   ── narrative scene (unchanged) ───────────────────────────
   The Lavender Marowak stands in the road…        [ Continue → ]

   ── THEN: raid cinematic (correct) ────────────────────────┐
   │  (bg: menu_bg_ground.png, 0.88 multiply wash)            │   z = --sn-z-overlay
   │                                                          │
   │       A   R E M E M B E R E D   P L A C E                │   ← banner (BOSS_CONFIGS)
   │                                                          │
   │                    ▓▓▓▓▓▓                                │   ← Marowak sprite, 192px
   │                   ▓ skull ▓        ◀ gold pulse glow      │      (getSprite, animated)
   │                    ▓▓▓▓▓▓                                │
   │                                                          │
   │                    Marowak                               │   ← name, 28px
   │     "It never stopped grieving. Now it grieves at you."  │   ← lore (italic gold)
   │   ┌──────────────────────────────────────────────────┐  │
   │   │ The Road                                          │  │   ← narrator nameplate
   │   │ She will not let you past until you've understood │  │
   │   │ what you've been walking over.                    │  │
   │   └──────────────────────────────────────────────────┘  │
   │                 [ Stand your ground → ]                  │
   └──────────────────────────────────────────────────────────┘
   ── battle: the same Marowak walks on. Framing kept faith. ─
```

SFX on mount: `StoryFx.playSfx('danger', 0.5)` + the species **cry**
(`AudioSystem.playCry('Marowak')`); on dismiss: `playSfx('shine', 0.6)` and the boss
battle theme. (The sighting cinematic already does sparkle+danger/shine — raids drop the
"sparkle" since it's a confrontation, not a wonder, and add the cry.)

### 4.3 The fix — exact mechanism / where

**Principle (this is the whole design):** *the intro framing must be driven by the same
predicate as the foe-team substitution.* If `_rollExtraRaidBossTeam` will field a solo
species, the intro shows that species. This makes label==reality structurally — the same
fix shape as the §4 preview/dispatch parity repair in `STORY_NARRATION_SYSTEM.md`.

**Step 1 — extract the predicate into one helper** (DRY; `_rollExtraRaidBossTeam` calls
it too, so they can never drift):

```js
// battle.html, beside _EXTRA_RAID_SPECIES (~43257)
// Single source of truth: which species (if any) a beat fields as a solo raid boss.
// Matches raid · miniRaid · miniRaid2 (see §4.4) — ONE regex, two callers.
function _raidBossSpeciesForBeatKey(sceneKey) {
    const m = /^extra\.([a-z0-9]+)\.(raid|miniRaid\d*)$/.exec(String(sceneKey || ''));
    return m ? (_EXTRA_RAID_SPECIES[m[1]] || null) : null;
}
```
Then `_rollExtraRaidBossTeam` (`43265`) resolves its species through this helper instead
of its private regex.

**Step 2 — branch the intro in `enterBattleEvent`.** Right after `partySize` is computed
(`battle.html:48413`), before the lock check, add a framing shim:

```js
// Encounter framing: solo-Pokémon raids use the Pokémon cinematic, never the
// trainer VS-splash. Gate on the SAME source as the foe-team swap so the two
// can't disagree about who walks onto the field.
const _raidIntroSpecies = _raidBossSpeciesForBeatKey(sm._activeBeatBattleKey);
const _runEncounterIntro = _raidIntroSpecies
    ? (cb) => _showRaidEncounterIntro(_raidIntroSpecies, sm._activeBeatBattleKey, cb)
    : (cb) => showBattleIntro(trainer, event, cb, idx);
```

Then replace the two `showBattleIntro(trainer, event, <cb>, idx)` calls (`48422`,
`48434`) with `_runEncounterIntro(<cb>)`. The callbacks are untouched — `startFight`
still receives the boss team rolled inside them.

**Step 3 — `_showRaidEncounterIntro`** is a thin sibling of the sighting cinematic. The
clean version **generalizes the existing function** rather than copy-pasting it:

```js
// Refactor _showRoamingLegendarySighting (47964) → _showWildEncounterCinematic(opts),
// where opts = { species, bannerText, loreText, narratorLines, nameplate, buttonLabel,
//               mountSfx:[...], dismissSfx:[...], cry:bool, theme:null|'boss', onDone }.
// The sighting becomes one caller (its current copy), the raid intro another:
function _showRaidEncounterIntro(species, sceneKey, onDone) {
    const arc = (/^extra\.([a-z0-9]+)\./.exec(sceneKey) || [])[1] || '';
    const cfg = (BOSS_CONFIGS[sceneKey] && BOSS_CONFIGS[sceneKey].mechanics[0]) || {};
    return _showWildEncounterCinematic({
        species,
        bannerText:   cfg.banner || 'A RAID HAS BEGUN',           // e.g. 'A REMEMBERED PLACE'
        loreText:     _RAID_LORE[arc] || _LEGENDARY_LORE[species] // §4.5
                      || '"It is not here to be caught. It is here to be answered."',
        narratorLines: _raidNarratorLines(sceneKey),             // pulled from scene acts
        nameplate:    'The Road',
        buttonLabel:  'Stand your ground →',
        cry: true, theme: 'boss',
        mountSfx:  [['danger', 0.5]],
        dismissSfx:[['shine', 0.6]],
        onDone,
    });
}
```

**Step 4 — theme.** `showBattleIntro` plays `AudioSystem.playBattleTheme(_storyBattleMoodFor(eventType))`;
for a raid attached to a "Basic Trainer" row that resolves to the *trainer* mood. The
cinematic must call `AudioSystem.playBattleTheme('boss')` explicitly so the music matches
the moment.

**Net code:** one helper extraction, one 6-line shim, two call-site swaps, and a
generalization of an existing function (no new overlay, no new CSS, no new art).

### 4.4 Scope decision — does this cover 16 raids or 24?  ✅ RESOLVED → Option A (24)

> Shipped Option A: the roller predicate became `(raid|miniRaid)\d*$`, so all **24** beats
> field their solo boss and get the cinematic. `_bossHpScaleForKind` reads the normalized
> `scaleKind` (`miniRaid2` → `miniRaid`), and `_populateExtraRaidConfigs` now keys
> `.miniRaid2`. The original analysis is kept below for the record.

There are **24** solo-raid beats (8 arcs × `miniRaid` + `miniRaid2` + `raid`). But before the fix:

```
extra.cubone.raid       → _rollExtraRaidBossTeam MATCH   → solo Marowak    ✓
extra.cubone.miniRaid    → MATCH                          → solo Marowak    ✓
extra.cubone.miniRaid2   → NO MATCH (regex (raid|miniRaid)$ rejects the "2")
                          → falls back to rollTrainerTeam → a HUMAN TEAM    ✗
```
(Verified with the live regex against all three keys.)

Yet `extra.cubone.miniRaid2` is authored unambiguously as a solo encounter — title
**"The Same One, Evolved"**, body *"A Marowak — the same Cubone, evolved. At 50% HP it
gains +1 priority on Bone Club…"* (`battle.html:34029`). All 8 `miniRaid2` beats follow
this pattern (a distinct, evolved solo boss with its own HP-threshold mechanics). **They
are silently fighting rolled trainer teams.** This is a data/balance bug independent of
the visual change, surfaced by the framing audit.

Step 1's regex (`miniRaid\d*`) fixes both at once: the `miniRaid2` boss is fielded AND
the cinematic covers it (because the framing mirrors the roller). **But fielding 8 new
solo bosses with custom mechanics is a balance change the maintainer owns.** Two options:

- **(A — recommended) Fix the roller + framing together.** `miniRaid2` fights its
  authored evolved boss and gets the raid cinematic. Honors the writing; one consistent
  rule. Needs balance sign-off on the 8 evolved-boss fights + their HP-threshold
  mechanics (currently only `.raid`/`.miniRaid` have `BOSS_CONFIGS` entries —
  `_populateExtraRaidConfigs` would need to also key `.miniRaid2`).
- **(B) Visual-only, narrow.** Leave the roller as-is (`miniRaid2` keeps fighting a
  trainer team) and gate the cinematic on `_rollExtraRaidBossTeam(...) != null`, so
  `miniRaid2` correctly *keeps* the trainer VS-splash (label==reality). Ships the
  presentation fix for 16 beats with zero balance change. Logs the `miniRaid2` data bug
  to the ledger for a separate decision.

Either way the **principle holds** (intro mirrors foe). The choice is purely *"fix the
underlying data bug now or later."* See §11 Q1.

### 4.5 Raid lore (`_RAID_LORE`) — to author, draw from existing prose

Each arc needs one italic lore line (the cinematic's emotional caption). These should be
**lifted/condensed from the scenes that already exist** (`extra.<arc>.raid` acts/body,
`battle.html:34509+`), so no new canon is invented — same rule `_LEGENDARY_LORE` follows.
Worked examples grounded in the shipped scene text:

| Arc → species | Banner (exists) | Lore line (condensed from shipped scene) |
|---|---|---|
| cubone → Marowak | A REMEMBERED PLACE | *"The mother every version of this story grieves. She fights to be witnessed, not to win."* |
| yamask → Yamask | THE WAKE | *"The first of the faceless to go looking for what it lost. To be remembered by it is to join the wake."* |
| hypno → Hypno | THE LULLABY | *"Not one Hypno — one Hypno with the weight of all of them behind its eyes."* |
| phantump → Trevenant | THE GROVE | *(condense from `extra.phantump.raid` acts)* |
| mimikyu → Mimikyu | THE AUDIENCE | *(condense from `extra.mimikyu.raid` acts)* |
| drifloon → Drifblim | THE CLIMB | *(condense from `extra.drifloon.raid` acts)* |
| parasect → Parasect | THE SOIL | *(condense from `extra.parasect.raid` acts)* |
| mewtwo → Mewtwo | THE LAB REMEMBERED | *(condense from `extra.mewtwo.raid` acts)* |

`miniRaid`/`miniRaid2` reuse the arc's lore (or a short variant); the **banner** already
differs per `BOSS_CONFIGS` tier, which is enough to read "this is the bigger one."

---

## 5. Reusable pre-boss cinematic template

> ✅ **IMPLEMENTED (2026-06).** Shipped as a single escalation overlay (not the 3-beat
> sketch below — one screen reads better and avoids click-fatigue after the existing
> narrative scene). `_playPreBossCinematic(key, trainer, onDone)` reuses
> `_renderNarrativeOverlay` (threshold banner + canon portrait w/ emotion + one framing
> line) and chains `onDone → showBattleIntro`. Wired via `_preBossCinematicKeyFor` in the
> `enterBattleEvent` shim for all 20 `BEAT_CANON_TRAINER` beats (boss + admin) + the
> Mystery apex **and the Champion** (`event === 'Champion'` → `main.champion`). Copy in
> `PRE_BOSS_CINEMATICS` (per-villain line + emotion; generic fallback). Guarded by
> `tests/suites/story-preboss-cinematic.test.js` + `story-rival-progression.test.js`. The 3-beat
> design below is the original sketch.

A new *additive* beat for **canon bosses** (villain bosses/admins via
`BEAT_CANON_TRAINER`, and the Mystery Figure). It plays **between** the narrative scene
and the existing trainer VS-splash — it does not replace the splash (trainer fights keep
their identity), it *escalates into* it. One parameterized template, driven by data, so
all 21 canon fights share one engine.

### 5.1 Shape — three beats, all from existing primitives

```
  ┌ BEAT 1: THRESHOLD ─────────────────────────────────────┐
  │  full-screen, scene BG (gen3-villain.png) at 0.9 wash   │  _renderNarrativeOverlay
  │                                                         │  (banner + lines, no sprite)
  │            ▸ THE DOORS OPEN                             │  bannerClass = boss tone
  │     "Past the last grunt, the room goes quiet."         │
  │                                  [ Continue → ]         │
  └─────────────────────────────────────────────────────────┘
  ┌ BEAT 2: THE FACE ──────────────────────────────────────┐
  │  canon sprite fades up centered, slow push (CSS scale)  │  _renderNarrativeOverlay
  │                  ╔═══════╗                              │  sprite = BEAT_CANON_TRAINER
  │                  ║GIOVANNI║   ◀ portrait-emotion: calm   │  name + nameplate + 1 line
  │                  ╚═══════╝                              │
  │      Giovanni                                           │
  │      "You've cost me a great deal. Let's see the bill." │
  │                                  [ Continue → ]         │
  └─────────────────────────────────────────────────────────┘
  ┌ BEAT 3: VS  (the EXISTING splash, unchanged) ──────────┐
  │   ╔═══╗          V S          ╔════════╗               │  showBattleIntro
  │   ║you║ ◀slide  (flash)  slide▶║GIOVANNI║               │  vs-big + boss theme
  │   ╚═══╝                        ╚════════╝               │
  │   ┌──────────────────────────────────────────────┐     │
  │   │ Gym Leader · (canon role)                      │     │
  │   │ "…"                                            │     │
  │   └──────────────────────────────────────────────┘     │
  └─────────────────────────────────────────────────────────┘
```

Beats 1–2 are just `_renderNarrativeOverlay` calls chained through its `onDone` (the
queue already serializes them). Beat 3 is the current code path. **Zero new overlay
engine.**

### 5.2 Data — one table, one player

```js
// PRE_BOSS_CINEMATICS[sceneKey] = { bg, threshold:[lines], face:{line, emotion}, sfx }
// Defaults derived from BEAT_CANON_TRAINER + the boss scene's acts when absent, so
// authoring is opt-in per boss but every canon boss gets at least a generic version.
function _playPreBossCinematic(sceneKey, trainer, onDone) {
    const c = PRE_BOSS_CINEMATICS[sceneKey] || _genericPreBoss(trainer);
    _renderNarrativeOverlay({ banner:'▸ '+c.bannerWord, bannerClass:'boss-cinematic-banner',
        lines:c.threshold, continueLabel:'Continue →', sfx:'danger',
        onDone:() => _renderNarrativeOverlay({
            sprite: trainer.spriteFile, name: trainer.name, nameplate: c.role,
            lines:[c.face.line], toneClass: _emotionTone(c.face.emotion),
            onDone }) });
}
```

Wired in `enterBattleEvent` beside the raid shim (§4.3): when
`BEAT_CANON_TRAINER[sm._activeBeatBattleKey]` exists, run `_playPreBossCinematic` whose
`onDone` is the existing `showBattleIntro` call. Trigger order:
**narrative scene → pre-boss cinematic → VS-splash → battle.**

### 5.3 Backgrounds — reuse, per track

- Villain bosses/admins → `sprites/story/backgrounds/gen3-villain.png` (the wash already
  used for villain scenes).
- Mystery Figure → `gen3-league.png` or the dark league wash; emotion = masked/obscured.
- Pull the type-tinted `menu_bg_<type>.png` for the **threshold** beat where a boss has a
  signature type (e.g., Maxie → `menu_bg_fire`), seeded only if you want subtle variety.

---

## 6. The impact layer

In-battle "game feel." All gated by `settings.animations` and `StoryFx.isReducedMotion()`.

> ✅ **SHIPPED — multi-hit parity (2026-06).** Closer reading corrected the §1 audit: the
> single-hit path *already* shakes the screen on crit / super-effective hits via anime.js
> (`24923/24927`) and plays `playHitSound`; the **multi-hit** path did neither, so multi-hit
> moves felt flat. The two inline single-hit shakes + the new multi-hit shake now route
> through one shared helper, **`_battleHitShake('crit'|'super')`** (defined beside
> `showBattlePopup`), which is gated by `settings.animations` **and now honors reduced
> motion** (the inline versions didn't); multi-hit also gained `playHitSound(typeEff)`.
> Purely visual — no state/RNG/damage effect. Guarded by `tests/suites/battle-hit-impact.test.js`.
> The dormant CSS `.anim-shake` was left untouched (it's unused dead weight, not the wiring
> target). **Still design-only below:** hit grading tiers (§6.1), hit-stop (§6.2), and
> portrait-emotion (§6.4) — 6.4 ships alongside the pre-boss cinematic (§5).

The original design (§6.1–§6.4) is kept below as the as-designed record.

### 6.1 Hit grading — make effectiveness *visible*

The damage path already adds `anim-hit-flash` to `#foe-sprite`/`#player-sprite` at
16 call sites (`battle.html:22550–24715`). Replace the bare class-add with one helper
that grades the hit:

```js
function _applyHitImpact(spriteEl, { effectiveness, crit, bossPhase }) {
    if (!settings.animations || !spriteEl) return;
    const reduced = window.StoryFx && StoryFx.isReducedMotion();
    spriteEl.classList.add('anim-hit-flash');                       // baseline (today)
    setTimeout(() => spriteEl.classList.remove('anim-hit-flash'), 400);
    if (reduced) return;                                           // motion stops here
    if (effectiveness > 1 || crit) {                              // super-effective / crit
        _screenShake(crit ? 'hard' : 'soft');                    // wire .anim-shake (6.3)
        if (crit) _hitStop(90);                                   // 6.2
    }
    if (bossPhase) StoryFx.playSfx('danger', 0.4);
}
```

| Hit | Flash | Shake | Hit-stop | Sound |
|---|---|---|---|---|
| Normal / not very effective | hit-flash (0.4 s) | — | — | (move sfx) |
| Super-effective | hit-flash | **soft** screen-shake | — | move sfx |
| Critical | hit-flash | **hard** screen-shake | **90 ms** | crit chime |
| Boss-phase trigger | hit-flash | hard | 120 ms | `danger` + `_showBossBanner` |

### 6.2 Hit-stop (NEW primitive, tiny)

Hit-stop = freeze the action ~80–120 ms on a heavy hit so the brain registers the weight.
There is no hit-stop today. It's a few lines and reuses the engine's `await`/`setTimeout`
idiom (the same pattern StoryFx animations use):

```js
// Pause the battle step queue briefly. The turn loop already yields between
// sub-steps; _hitStop inserts a single extra delay, capped to 0 under reduced motion.
function _hitStop(ms) {
    if (!settings.animations || (window.StoryFx && StoryFx.isReducedMotion())) return 0;
    return ms;   // returned to the awaiting step; the loop adds it to its inter-step wait
}
```

Mocked timeline (critical hit on the foe):

```
 t=0     move connects → #foe-sprite += anim-hit-flash, += anim-shake(hard)
 t=0     screen FREEZES (no HP tick, no log advance)         ◀ hit-stop 90 ms
 t=90    HP bar begins draining, "A critical hit!" prints
 t=400   anim-hit-flash clears; sprite settles
```

Implementation note: the cleanest insertion point is wherever the turn loop already
sleeps between animation and HP-tick; `_hitStop` returns an extra `ms` to fold into that
existing wait. **No new timing loop.**

### 6.3 Wire the dormant screen-shake

`@keyframes shakeScreen` and `.anim-shake` are defined (`battle.html:4650/4656`) but
**never added to any element.** Wire it to the battle stage container (the parent of the
sprites, e.g. `#screen-battle` or the battle field wrapper):

```js
function _screenShake(strength) {                // 'soft' | 'hard'
    if (!settings.animations || (window.StoryFx && StoryFx.isReducedMotion())) return;
    const stage = document.getElementById('screen-battle');
    if (!stage) return;
    const cls = strength === 'hard' ? 'anim-shake-hard' : 'anim-shake';
    stage.classList.remove('anim-shake','anim-shake-hard'); void stage.offsetWidth;
    stage.classList.add(cls);
    setTimeout(() => stage.classList.remove(cls), strength === 'hard' ? 520 : 400);
}
```
Add one CSS sibling `.anim-shake-hard` (larger translate, reuse the same keyframe family).
The existing `@media (prefers-reduced-motion)` block already neutralizes motion; add
`.anim-shake-hard` to it.

### 6.4 Portrait-emotion swap for recurring cast — CSS, not new art

> ✅ **IMPLEMENTED (2026-06).** The `.cast-*` CSS treatments + `_castEmotionClass(emotion)`
> shipped; `_renderNarrativeOverlay` gained `spriteClass`/`spriteSrc` (backward-compatible)
> so any overlay can tag its portrait. Driven by the pre-boss cinematic (§5). The **rival
> sprite progression** is also wired: `_rivalPhaseSpriteFile` swaps the rival's `spriteFile`
> by encounter phase (Blue → Blue-2 → Blue-Champion; Silver/Gladion/Hau → -2), so the whole
> downstream VS-splash shows the grown rival — no animation conflict, existing art only.
> Reduced motion disables the shake animations.

Recurring cast each ship a **single** sprite (`Giovanni.png`, `Blue.png`, `Oak.png`,
`Cyrus.png`…). The 4 MB budget forbids per-emotion art. So emotion is a **CSS treatment
on the one sprite**, applied in narration/cinematic overlays (and optionally the VS
foe-sprite):

| Emotion | CSS treatment (filter/transform) | Used by |
|---|---|---|
| `calm` | none (baseline) | first villain meeting |
| `angry` | `filter:saturate(1.4) contrast(1.1)` + soft `shakeScreen` once | boss phase 2 |
| `smug` | `transform:scale(1.04)` + warm `drop-shadow` | rival ahead on badges |
| `rattled` | `filter:brightness(0.92)` + 2 px jitter | rival behind / boss at 25% |
| `defeated` | `filter:grayscale(0.6) brightness(0.8)` + slump `translateY(6px)` | post-loss outro |
| `obscured` | `filter:brightness(0.3) contrast(1.5)` (silhouette-ish) | Mystery Figure pre-reveal |

```js
// One class per emotion on the overlay's sprite <img>. Reuses existing filter idiom
// (see .storyfx-mon.silhouette at battle.html:4971, which already does brightness(0)).
function _emotionTone(e){ return e ? ('cast-emotion cast-'+e) : ''; }
```

**Free wins from existing variant art** where it ships: `Blue.png` → `Blue-2.png` →
`Blue-Champion.png`, `Hilbert.png`/`Hilbert-2.png`, `Hilda.png`/`Hilda-2.png`,
`Red.png`/`Red-Title.png`. For the **rival** specifically (whose sprite is per-run
`sm.runRivalSpriteFile`), later phases can swap to the `-Champion`/`-2` variant if one
exists for the rolled identity — a genuine portrait change with **zero new art**. Seed
nothing here; phase is deterministic from badge count
(`getRivalEncounterPhase`, used at `48501`).

Mocked emotion progression (rival, no new files):

```
  Phase 1 (0–2 badges):  Blue.png            · smug      "Still using that thing?"
  Phase 2 (3–5 badges):  Blue.png   + jitter · rattled   "...When did you get good?"
  Phase 3 (6–8 badges):  Blue-2.png          · angry     "I don't lose to you."
  Post-HoF:              Blue-Champion.png    · calm      "...Alright. You earned it."
```

---

## 7. Per-event visual-beat catalogue

What framing each story beat gets. **Bold = changes this stream proposes;** the rest is
"keep as-is, confirmed correct." Driven by the matrix (§3).

### 7.1 Main spine

| Beat | Current | Proposed |
|---|---|---|
| City 0 cold-open / starter | cold-open overlay | keep |
| Intro rival (starter duel) | VS-splash, no wild prefix (`50381`) | keep |
| Gym Leaders 1–8 | VS-splash `vs-big`, leader theme | keep; **optional** pre-boss cinematic for GL8 only (escalation) — §11 Q3 |
| Rival (recurring) | VS-splash + taunt + tagline | keep; **add portrait-emotion progression** (§6.4) |
| Elite Four / Champion | VS-splash, elite/boss theme, 6-mon | keep; **add pre-boss cinematic** (Champion only) |
| "It was you all along" reveal | multi-act narrative | keep (already a cinematic build via acts) |
| Hall of Fame | spotlight card | keep |
| **Mystery Figure (apex)** | VS-splash, masked face | **add max pre-boss cinematic** (`obscured` emotion → reveal) |

### 7.2 Villain track (10 arcs × {event ×N, miniBoss, boss})

| Beat | Current | Proposed |
|---|---|---|
| `event*` | narrative scene (acts) | keep |
| `miniBoss` (canon admin) | VS-splash (canon trainer via `BEAT_CANON_TRAINER`) | **pre-boss cinematic** (§5) → VS-splash |
| `boss` (canon leader) | VS-splash (canon trainer) | **pre-boss cinematic (full)** → VS-splash; portrait-emotion at phase banners |

Boss phase banners already fire via `_showBossBanner` + `BOSS_CONFIGS` (`43193+`); §6.1
adds shake/sound to those triggers.

### 7.3 Extra track (8 horror arcs × {event ×N, miniRaid, miniRaid2, raid})  — **the core**

| Beat | Current | Proposed |
|---|---|---|
| `event*` | narrative scene (acts) | keep |
| **`miniRaid`** | **trainer VS-splash** → solo boss | **raid cinematic** → solo boss (§4) |
| **`miniRaid2`** | **trainer VS-splash → ROLLED TRAINER TEAM** (bug, §4.4) | **raid cinematic → solo evolved boss** (Option A) *or* keep trainer (Option B) |
| **`raid`** | **trainer VS-splash** → solo boss | **raid cinematic** → solo boss (§4) |
| `ending` | narrative scene + `outro.win` | keep |

### 7.4 Encounters & utility (no structural change)

| Surface | Engine | Note |
|---|---|---|
| Roaming legendary | `_showRoamingLegendarySighting` | already correct; becomes a caller of the generalized `_showWildEncounterCinematic` (§4.3) |
| Wild/Safari catch | `StoryFx.buildEncounterStage`/`encounterReveal`/`throwBall` | keep; `boss` tone exists if a future "catch the raid boss" beat wants it |
| Evolution | `StoryFx.evolutionScene` | keep |
| First-sighting lore | `_showFirstSightingLoreOverlay` (`48049`) | keep |
| Daycare / Fight Club | `_storyScene` (`45100`) | **fold onto `_renderNarrativeOverlay`** (carries `STORY_NARRATION_SYSTEM` §6.2 forward) — visual-consistency item, low priority |

---

## 8. Cross-cutting rules

1. **Seeded RNG only.** Any variance (which threshold line, which type-bg tint, idle
   sparkle timing) uses `storyRngNext` (CLAUDE.md), never `Math.random()`. The current
   `showBattleIntro` uses `Math.random` for the rival's *secondary* line (`48484`) and is
   explicitly documented as not advancing battle RNG — new code should prefer
   `storyRngNext` so replays stay deterministic; flag if a beat needs true per-view
   variety.
2. **Reduced motion is non-negotiable.** Every new animation gates on
   `StoryFx.isReducedMotion()` (it reads `prefers-reduced-motion`) and/or the existing
   `@media (prefers-reduced-motion: reduce)` block (extend it for `.anim-shake-hard`,
   `.cast-*`). Static fallbacks must still convey the beat (banner + lore read fine with
   zero motion — the sighting cinematic already proves this).
3. **z-index via tokens.** New overlays: cinematics on `--sn-z-overlay`, VS/boss splashes
   on `--sn-z-spotlight`, in-battle banners on `--sn-z-battle-banner`. Never a literal.
4. **Asset budget.** No new art into `battle.html`. Backgrounds/sprites already on disk
   (`menu_bg_<type>`, `gen3-*`, trainers, pokesprite). Emotion = CSS filters on shipped
   sprites. If a beat truly needs new art, flag it — don't inline it.
5. **One renderer per concern.** Cinematics reuse `_showWildEncounterCinematic`
   (generalized sighting) and `_renderNarrativeOverlay`. No third overlay style.

---

## 9. Implementation order (when sign-off lands)

1. **Raid fix (§4).** Extract `_raidBossSpeciesForBeatKey`; generalize sighting →
   `_showWildEncounterCinematic`; add `_showRaidEncounterIntro`; swap the two intro
   calls. Author `_RAID_LORE` (8 lines from existing scene text). *Highest player impact,
   smallest surface.*
2. **Resolve §4.4** per sign-off (roller regex `miniRaid\d*` + `BOSS_CONFIGS` for
   `miniRaid2`, or ledger it).
3. **Impact grading + hit-stop + screen-shake wiring (§6.1–6.3).** Pure game-feel, no
   data.
4. **Portrait-emotion (§6.4).** CSS classes + rival variant swap.
5. **Pre-boss cinematic (§5).** Additive; villain bosses → Champion → Mystery Figure.
6. **(Low) fold `_storyScene` onto the canonical overlay.**

Each step lands with a jsdom guard test (CLAUDE.md "sustainable" rule): e.g. *"raid beats
mount `.story-legend-sighting`, never `.vs-stage`"*, *"`_raidBossSpeciesForBeatKey`
matches all 24 keys"*, *"every new animation is suppressed under reduced motion."*

---

## 10. Risks / things to watch

- **Save/flow safety.** The fix lives in `enterBattleEvent` framing only — it does not
  touch `STORY_EVENTS_RAW`, `eventIndex`, `sm.trainerAssignments`, or the save schema.
  The canon-trainer override block (`48330`) is untouched (raids never had a canon
  trainer). Low save risk, but `enterBattleEvent` is sensitive — exercise the lock path
  (retry/revisit, `48421`) and roll path (`48434`) both.
- **Theme bleed.** Calling `playBattleTheme('boss')` in the cinematic must not
  double-fire with the splash. For raids the splash is *replaced*, so the cinematic is
  the only theme trigger — verify no later code re-triggers a trainer theme.
- **§4.4 Option A is a balance change** (8 new solo bosses with mechanics). Strictly
  maintainer-owned per CLAUDE.md ("balance numbers are user-owned"). Do not ship without
  explicit values/sign-off.
- **miniRaid2 mechanics gap.** Even under Option A, `_populateExtraRaidConfigs` only keys
  `.raid`/`.miniRaid`. `miniRaid2` would field a solo boss with *no* phase mechanics
  unless added. Author bodies describe per-`miniRaid2` mechanics — wire or omit per
  sign-off.

---

## 11. Sign-off checklist (DESIGN PASS — needs maintainer)

> Per CLAUDE.md: no game-behavior/presentation change ships without explicit sign-off,
> and balance numbers are maintainer-owned. This stream proposes; you approve.

- **Q1 — Raid framing (the headline).** ✅ APPROVED + IMPLEMENTED (2026-06). Trainer
  VS-splash replaced with the Pokémon raid cinematic for solo-mon raids. (§4.3)
- **Q2 — `miniRaid2` scope.** ✅ APPROVED — **Option A** IMPLEMENTED (2026-06). The roller
  now fields `miniRaid2`'s authored evolved boss (scaled like a miniRaid) and it gets the
  raid cinematic; `_populateExtraRaidConfigs` keys `.miniRaid2` too. (§4.4)
- **Q3 — Pre-boss cinematic.** ✅ APPROVED + IMPLEMENTED (2026-06) — all 20 canon
  villain bosses/admins + the Mystery apex + the Champion, as a single escalation overlay. (§5)
- **Q4 — Impact layer.** ✅ Partially shipped — multi-hit shake/hit-sound **parity**
  (the concrete gap). Graded tiers (§6.1) + hit-stop (§6.2) deferred as lower-value;
  the dormant CSS shake was a red herring (engine shakes via anime.js). (§6)
- **Q5 — Portrait-emotion.** ✅ APPROVED + IMPLEMENTED (2026-06) — CSS treatments wired
  into the pre-boss cinematic; rival sprite progression (Blue→Blue-2→Blue-Champion) wired. (§6.4)
- **Q6 — RNG variance.** Any beat where you want *per-view* variety (seeded) vs a fixed
  deterministic frame? Default: fixed/deterministic. (§8.1)

---

### Appendix A — symbol map (verified `file:line`, mid-2026)

```
_renderNarrativeOverlay ........ battle.html:47752     showBattleIntro ............... 48483
  narration queue .............. 47878 (_narrationLive)  _storyBattleMoodFor ......... 48474
_showRoamingLegendarySighting .. 47964               enterBattleEvent .............. 48278
  _LEGENDARY_LORE .............. 47891                 canon-trainer override ....... 48330
  _LEGENDARY_SIGHTING_FRAMES ... 47956                 intro call (lock path) ....... 48422
_showFirstSightingLoreOverlay .. 48049                 intro call (roll path) ....... 48434
window.StoryFx (IIFE) .......... 29754  (API 30380)    raid foe swap ................ 48439
  buildEncounterStage .......... 29793               _EXTRA_RAID_SPECIES ........... 43257
  encounterReveal / throwBall .. 29811 / 29836        _rollExtraRaidBossTeam ....... 43265
  evolutionScene ............... 29938                _bossHpScaleForKind .......... 43248
  flashPulse / floatCoin ....... 30089 / 30107        _populateExtraRaidConfigs .... 43224
_storyScene (legacy overlay) ... 45100                BEAT_CANON_TRAINER ........... 43157
_showBossBanner ................ 43286                BOSS_CONFIGS ................. 43187
getTrainerSprite ............... 36065               getBattleBgUrl / refreshBattleBg 9935 / 9945
_trainerSpritePath ............. 40952               BATTLE_BG_TERRAINS ........... 9932

CSS — .story-legend-sighting* 2498 · .vs-stage/.vs-flash 2753 · .story-dialog-* 2205/2222
      .gimmick-banner 4773 · .storyfx-stage/.storyfx-mon 4939 (boss tone 4954)
      .anim-hit-flash/hitFlash 4654/4660 · .anim-faint 4651 · .anim-shake/shakeScreen 4650/4656 (UNWIRED)
      .anim-flinch/flinchShake 4846 (used 27098) · #foe-sprite 9829 · #player-sprite 9836

Backgrounds — battle: sprites/backgrounds/battle/{desktop,portrait,landscape}/bg_<terrain>.png (5)
              cinematic/menu: sprites/backgrounds/menu/menu_bg_<type>.png (18)
              scene: sprites/story/backgrounds/gen3-*.png + city SVGs
```

### Appendix B — raid roster (8 arcs)

```
arc       species    banner (BOSS_CONFIGS)   miniRaid   miniRaid2 ("evolved")   raid
cubone    Marowak    A REMEMBERED PLACE      ✓ solo     ✓ solo (was bug)        ✓ solo
yamask    Yamask     THE WAKE                ✓ solo     ✓ solo (was bug)        ✓ solo
hypno     Hypno      THE LULLABY             ✓ solo     ✓ solo (was bug)        ✓ solo
phantump  Trevenant  THE GROVE               ✓ solo     ✓ solo (was bug)        ✓ solo
mimikyu   Mimikyu    THE AUDIENCE            ✓ solo     ✓ solo (was bug)        ✓ solo
drifloon  Drifblim   THE CLIMB               ✓ solo     ✓ solo (was bug)        ✓ solo
parasect  Parasect   THE SOIL                ✓ solo     ✓ solo (was bug)        ✓ solo
mewtwo    Mewtwo     THE LAB REMEMBERED      ✓ solo     ✓ solo (was bug)        ✓ solo
```
All 24 now field their solo boss and use the raid cinematic. `miniRaid2` previously fought
a rolled trainer team (the §4.4 regex bug) — fixed in the 2026-06 implementation.
