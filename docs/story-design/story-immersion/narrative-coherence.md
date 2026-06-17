# Narrative Coherence & Causality — Story Immersion, Stream 1

> **Status:** DESIGN PASS ONLY — no game code changed, no `STORY_EVENTS_RAW` row
> reordered or renumbered. Everything below is a proposal for maintainer sign-off.
> Flow-ordering bugs are flagged (§7) per `CLAUDE.md` even though the maintainer
> owns the flow.
>
> **Scope:** the "why is this happening" backbone — the layer that kills the
> "out of nowhere" feeling. This stream owns **causality and framing**: *why this
> beat, why here, why now, what's at stake, what it sets up.* It does **not** own
> prose quality (the prose is already strong — see §0.4), engine/dispatch
> architecture (that's the `STORY_OVERHAUL_PLAN.md` Phase E lane), or balance.
>
> **Grounding:** every claim is anchored to a **symbol name** in `battle.html`,
> not a line number (the monolith drifts). Resolve any symbol with the
> `find-anchor` skill, e.g. `find-anchor _activeBattleBeatForCurrentRow`.
>
> **Brief-absence note:** the two upstream briefs this stream was told to read
> (`story-immersion-briefs/01-narrative-coherence.md`, `NARRATIVE-CRAFT.md`) do
> not exist in the tree, in git history, on any branch, or as attachments. This
> spec was produced from the inline charter + the actual code. The craft
> vocabulary used here ("camp = the diamond, events = bottlenecks", coherence
> cards, encounter-framing matrix) comes from that charter; if the briefs surface,
> reconcile terminology — the code-grounded findings are independent of it.

---

## 0. Current state — the narrative backbone as it actually runs

### 0.1 The timeline (`STORY_EVENTS_RAW`)

A flat array of `[eventIndex, type, name, gradeWeights, gold, cityActions]`. **Array
order is play order; `eventIndex` is a stable id, not a position** (row `68` plays
first, row `12` plays mid-game, row `67` plays last). Shape:

```
City0 → Rival(intro) → Basic → City1 → [Gym1 approach + Leader] → City1(return)
      → Basic ×2 → City2 → [Gym2] → … → City9(League) → E1–E4 → Champion
      → Rival(final) → Hall of Fame → Mystery Figure
```

Cities are the **hub** (player-paced, facility-rich, safe). Battles + Hall of Fame
are **forced rows**. Wild "route nodes" are inserted at runtime by
`proceedToNextBattle` when crossing a city boundary (per `STORY_MODE_FLOW.md §2–3`)
— they are *not* timeline rows.

### 0.2 Three narrative layers run concurrently in one playthrough

| Layer | Source | What it is | Fires via |
|---|---|---|---|
| **Main spine** ("The First" loop) | `MAIN_STORY_BEATS` → `STORY_SCENES["main.*"]` | The meta-story: foreshadow → "It was you all along" reveal → Run #1 choice. The backbone. | road event-beats + post-HoF climax flow |
| **Villain arc** (1 of 10, rolled) | `VILLAIN_STORY_BEATS[sm.tracks.villain]` → `STORY_SCENES["villain.*"]` | A moral-weight crime arc culminating in a named boss (`BEAT_CANON_TRAINER`). | road event-beats + battle injection |
| **Extra arc** (1 of 8, rolled) | `EXTRA_STORY_BEATS[sm.tracks.extra]` → `STORY_SCENES["extra.*"]` | A horror arc culminating in a legendary-tier **raid** (`_EXTRA_RAID_SPECIES`). | road event-beats + battle injection |
| **Classic milestones** | `STORYLINE_VARIANTS.classic.beatOverrides` → `STORY_COLD_OPENS` | Oak's grounded badge-milestone speeches ("After Badge One", "The Last Door"). Pinned to rows 7/20/26/33/48/53/56/64. | `_runStoryColdOpen` in `enterBattleEvent` |
| **Anomaly seeds** | `ANOMALY_SEEDS` | Four one-line loop breadcrumbs at rows 7/14/30/49. | `_tryFireAnomalySeed` (bare `showGameAlert`) |

The villain and extra tracks are **independently rolled** (`_pickTrack`), so any of
10×8 = 80 combinations runs together with the fixed main spine and the fixed Oak
milestones. Nothing coordinates the four layers' *content* — only their dispatch
order.

### 0.3 The dispatch chain (anchors)

```
processNextEvent
 ├─ _tryFireAnomalySeed(ev)            ANOMALY_SEEDS → showGameAlert (non-blocking)
 ├─ _tryFireRoadStoryBeats(ev)         _resolveActiveRoadBeats → _playStoryBeatQueue
 │                                     (DUMPS every unfired event-beat for the road)
 └─ enterBattleEvent(ev)
      ├─ _runStoryColdOpen(beat)       classic milestone cold-open (getStoryBeatForRow)
      ├─ _runFirstStoryInterrupt()     catch tutorial / wild route / roaming legend
      ├─ _activeBattleBeatForCurrentRow() → inject boss/miniBoss/raid/miniRaid scene,
      │                                     + BEAT_CANON_TRAINER swap (boss/miniBoss only)
      └─ showBattleIntro(trainer,…)    the VS splash (human-trainer card)
```

The road anchor is coarse: `_ROAD_BY_ARRAY_IDX` derives `roadN` = "everything between
Gym N (excl) and Gym N+1 (excl)", which spans **post-gym hub + next city + next-gym
approach** because `currentGym` only increments at the leader row. So "road N"
content lands in the *next* city's run-up, at the **first battle row** of that span.

### 0.4 What's good (do not touch)

- **Prose voice.** `STORY_SCENES` is literary, specific, and tonally controlled
  ("He reads your badges the way an auditor reads receipts."). The villain bosses
  each have a full `acts` arc + `outro.win` aftermath. The extra raids are
  fully-framed spirit encounters. The Oak milestones are grounded and warm.
- **The reveal lands.** `main.mfReveal` ("It Was You") → `main.ending` ("Run #1",
  remember-vs-forget choice) is a strong, self-contained climax.
- **Cross-scene payoff already exists.** `choice` → `sm.storyChoices[persistKey]` →
  later `branches` (e.g. `villain.flare.sticker`, `main.loop.remember`). The
  *machinery* for reactive causality is present and used.
- **The league finale is now correctly sequenced** (see §7, FIXED). `fireAtEvent` /
  `firePostHoF` gates in `_resolveActiveRoadBeats` mean main.event6/7/8 fire at
  E1/Champion/Rival respectively and event9/reveal/ending fire only post-HoF — the
  old "6 scenes dump at E1" finding is stale.

**The gap is not the words. It's the joins between them** — why a beat fires here,
why this fight is this fight, and whether the hub ever acknowledges the road.

---

## 1. Prioritized gap list (anchored)

Severity = impact on the "out of nowhere" feeling. **P0** = breaks the spell on a
flagship moment; **P1** = blurs causality on common beats; **P2** = a missed
opportunity for connective tissue. Items tagged **[FLOW-BUG]** are flagged for
sign-off per `CLAUDE.md` (the maintainer owns the flow but can't pre-spot ordering
defects in 61k lines).

| # | Sev | Gap | Anchor(s) | Why it reads as "out of nowhere" |
|---|---|---|---|---|
| **G1** | **P0** | **Raid → trainer-intro mismatch.** A `raid`/`miniRaid` plays a spirit/legendary scene, then the VS splash renders a generic **human trainer** (rolled name, sprite, trainer quote, "Basic Trainer" nameplate), then the foe is a lone legendary. | `_activeBattleBeatForCurrentRow`, `enterBattleEvent` (the `_isInsertKind` block), `BEAT_CANON_TRAINER` (no raid entry), `_rollExtraRaidBossTeam`, `showBattleIntro` | The intro layer is structurally blind to raids. The "VS Basic Trainer / 'You look tough!'" card directly contradicts the scene that just played. These are `STORY_KIND_TO_TIER` **big/mid** encounters — the arc's climax — getting the cheapest frame in the game. |
| **G2** | **P1** | **Road-opening clump.** Every unfired event-beat for a road dumps back-to-back at the road's **first battle row**: main spine + villain + extra + the Oak cold-open + (sometimes) an anomaly toast — up to 4–5 overlays before one Basic Trainer. | `_resolveActiveRoadBeats` (returns *all*), `_playStoryBeatQueue` (plays the whole queue), `_tryFireRoadStoryBeats` (fires on first non-City row) | Causality collapses: three unrelated threads + a mentor speech arrive in a stack with no connective framing, attached to a trivial fight. The player can't tell which thread is which or why now. |
| **G3** | **P1** | **Aftermath before climax. [FLOW-BUG]** `villain.*.ending` (an `event`, dumped) fires **before** `villain.*.boss` (a `battle`, injected) — both anchor `road7`. You read "Rocket dissolves on paper… you broke the company" *before* you fight Giovanni. | `VILLAIN_STORY_BEATS.*.ending` vs `.boss` (same `roadAnchor`), `_tryFireRoadStoryBeats` (dump) vs `_activeBattleBeatForCurrentRow` (inject) | The arc's resolution is spoiled and de-tensioned before its climax. Pure ordering: two dispatch paths, no shared sort. |
| **G4** | **P1** | **Unframed boss substitution. [FLOW-BUG]** `_activeBattleBeatForCurrentRow` overwrites whatever the next road battle is with the canon boss/mini-boss. On `road6` the first battle row is the **Rival** (eventIndex 39) → your rival silently becomes **Proton**. A `Basic Trainer` row silently becomes **Giovanni**. | `_activeBattleBeatForCurrentRow`, `enterBattleEvent` (`sm.trainerAssignments[ev[0]] = _canon`), `BEAT_CANON_TRAINER` | No in-fiction reason the scheduled fight changed identity. Worst on the Rival row: the rival-vs-boss collision is never acknowledged by either thread. |
| **G5** | **P2** | **The diamond is inert.** City arrival (`_showCityArrivalScreen` / `CITY_ARRIVAL_LINES`) is a static travel-brochure keyed only on city index. It never references the villain sermon you walked past, the raid you survived, or the loop-anomaly you noticed — and it never plants the next hook. | `enterCity`, `_showCityArrivalScreen`, `_cityArrivalLines`, `CITY_ARRIVAL_LINES`, `_cityBlurbFor` | The hub is the one wide, reflective space (the "diamond", §2) where threads should be acknowledged and the next beat set up. Today it's disconnected from everything the player just did — so every road beat arrives cold. |
| **G6** | **P2** | **Loop breadcrumbs land as system alerts.** The four `ANOMALY_SEEDS` — the literal evidence trail to the reveal — fire as bare `showGameAlert` modals mid-stride, with no narrator, no diegetic frame, no acknowledgment. | `_tryFireAnomalySeed`, `ANOMALY_SEEDS` | The most important connective tissue in the game ("a sentence in YOUR handwriting you don't remember writing") is presented like a save-confirmation popup. The payoff (`main.mfReveal`) never calls back to them. |
| **G7** | **P2** | **Two main voices, no bridge.** Oak's grounded milestones (`classic_gym*`) interleave with the surreal "The First" spine (`main.event*`) — often at the same row (row 7 fires `main.event1` *and* `classic_gym1`). Oak never reacts to the loop; the loop never reacts to Oak. | `STORYLINE_VARIANTS.classic.beatOverrides`, `MAIN_STORY_BEATS`, both via different dispatch paths | Tonal whiplash and a causal question the game never answers: does Oak know? The two layers feel authored by people who never met. |
| **G8** | **P2** | **`main.battle1`/`battle2` promise a themed fight, deliver a generic trainer.** The scene prose frames a specific encounter, but with no `BEAT_CANON_TRAINER` entry the injected fight is a rolled generic trainer (same class of mismatch as G1, lower tier). | `MAIN_STORY_BEATS.battle1/battle2`, `_activeBattleBeatForCurrentRow`, `BEAT_CANON_TRAINER` | Prose says "this is a moment"; the VS card says "this is filler." Mirror-image of G1 on the main spine. |
| **G9** | ~~P2~~ ✅ | **`STORY_SCENES.*.body` raw stage-directions — RESOLVED (verified + guarded).** `body` renders only via `_playStoryBeatScene`'s acts-less path; **every** scene with stage-directions in `body` (the raids) also has `acts`, so it's never shown — **0 leaking scenes of 204**. Locked so a future acts-less scene can't regress it. | `STORY_SCENES`, `_playStoryBeatScene` (acts-less render), `tests/suites/story-scene-prose-hygiene-g9.test.js` | ~~Latent leak~~ — confirmed non-leaking; the guard prevents regression. |

The **P0 (G1)** and the two **[FLOW-BUG]s (G3, G4)** are the priority; G2 is the
most pervasive day-to-day cause of the flat feeling.

> **Resolution status (2026-06-08):**
> - **G1 ✅ shipped** (PR #242) — `enterBattleEvent` routes solo-raid beats to a
>   wild-encounter cinematic (`_showRaidEncounterIntro` / `_showWildEncounterCinematic`),
>   gated on `_raidBossInfoForBeatKey` (the same predicate as the foe substitution, so the
>   card can never disagree with the foe). A latent sub-bug surfaced in review and was
>   fixed in the same PR: each arc's **second** `miniRaid` (`extra.<arc>.miniRaid2`) was
>   rolling a generic trainer team because the foe-roll regex rejected the `2` suffix —
>   now `(raid|miniRaid)\d*`. Guard: `tests/suites/story-raid-framing.test.js`.
> - **G3 + G4 ✅ shipped** (this work; see §7) — dispatch-ordering only, no timeline edit,
>   no `SAVE_VER` bump. Guards: `tests/suites/story-flow-order-g3g4.test.js` and the
>   updated golden in `tests/suites/story-flow-order-v23.test.js`.
> - **G2 ✅ shipped** (this work) — `_tryFireRoadStoryBeats` now paces **one setup beat per
>   row** (was: the whole road queue dumped onto the first battle) and continues straight to
>   the battle via the extracted `_dispatchCurrentRow`. Capacity-checked: every road has more
>   non-City rows than active event beats, so nothing strands. This is the surgical
>   de-clump; the fuller "diamond" model (setups move *into* city arrival, §2) is still open
>   as the larger direction (overlaps G5). Guard: `tests/suites/story-flow-pacing-g2.test.js`.
> - **Open:** G5–G9 remain design proposals.

---

## 2. The setup-beat pattern — camp is the diamond, events are the bottlenecks

### 2.1 The shape

Borrowing the craft metaphor: a journey alternates **diamonds** (wide, low-pressure,
player-controlled moments where attention can spread out) and **bottlenecks**
(narrow, forced, sequential moments everyone passes through). In this game:

| Role | Is | In code | Properties |
|---|---|---|---|
| **Diamond (camp)** | the **city hub** + the between-city **route-node / "rest stop"** space | `enterCity`, `_showCityArrivalScreen`, `_cityBlurbFor`, NPC quotes, `proceedToNextBattle` wild interrupt | wide, safe, player-paced, repeatable, has a *face* (City Guide; the Professor only at City 0) |
| **Bottleneck (event)** | the **forced battle** or **forced scene** | `enterBattleEvent`, `_tryFireRoadStoryBeats` → `_playStoryBeatScene` | narrow, mandatory, sequential, one-shot, high-attention |

The prose already *knows* this — most road scenes are explicitly set "at the Road N
**rest stop**" (`main.event2`, the broker/face-thief/balloon-board beats…). The rest
stop / hub **is** the diamond. The game just doesn't use it as one.

### 2.2 The rule

> **Every bottleneck payoff has a diamond setup ≤ 1 segment upstream.
> Every diamond does two jobs: acknowledge the last bottleneck, and plant the next.**

A beat that fires with no prior hook reads as "out of nowhere." A hub that ignores
what just happened wastes the only reflective space in the loop. The fix is *not*
more content — it's **moving existing content** so setups live in the diamond and
payoffs live in the bottleneck.

### 2.3 What's wrong today, in this vocabulary

Today **both setup and payoff pile into the bottleneck.** `_tryFireRoadStoryBeats`
dumps the road's scenes (the setups) at the same first-battle row where the
fight (the payoff) happens, and the diamond (`enterCity`) plays a generic brochure.
So the structure is inverted: the wide space is empty and the narrow space is
overloaded (that's G2 + G5 stated structurally).

### 2.4 The target hook map (design, no code)

For each road segment `roadN`, content should attach to slots in this order
(diamond → bottleneck → diamond):

```
cityN.arrive   (DIAMOND)  ── acknowledge last road + plant 1 hook   ← move setup scenes here
   ↓
cityN.hub      (DIAMOND)  ── facility loop; ambient NPC line echoes the hook
   ↓
roadN.restStop (DIAMOND)  ── 1 beat, framed as a rest-stop moment    ← the "rest stop" prose
   ↓
roadN.fight    (BOTTLENECK) ─ the payoff fight, framed by §3/§4      ← keep ONE thing here
   ↓
cityN+1.arrive (DIAMOND)  ── acknowledge that fight + plant next
```

Concretely this means: **spread** the per-road scene queue across the segment's
diamonds instead of dumping it at one bottleneck (resolves G2), and give
`_showCityArrivalScreen` an input for "what just happened" so it can do its
acknowledge-and-plant job (resolves G5/G6). The *content* already exists; this is a
placement spec, handed to the engine lane (Stream 3 / `STORY_OVERHAUL_PLAN.md`
Phase E) to wire.

> **Out of this stream's scope (by design):** the dispatcher rewrite that makes
> "spread" possible (one ordered slot registry) is the `STORY_OVERHAUL_PLAN.md §4`
> single-engine work. This stream specifies *which slot each beat wants* and *why*;
> it does not build the slot machine.

---

## 3. Per-event coherence cards (who / why / now / stakes / next)

Each card answers the five causality questions. **WHO** = who is present/fighting.
**WHY** = the in-world reason it exists. **NOW** = what makes it fire *at this point*
(the trigger / the player's just-completed action). **STAKES** = what is at risk or
on offer. **NEXT** = the hook it plants (the setup it owes a later payoff).

A coherent beat can fill all five. A beat that can't fill **NOW** is the "out of
nowhere" beat; a beat that can't fill **NEXT** is a dead end.

### 3.1 Main spine ("The First" loop) — the backbone

| Beat (`scene` / anchor) | WHO | WHY | NOW (trigger) | STAKES | NEXT (hook) |
|---|---|---|---|---|---|
| `main.event1` "How It Ends This Time" (road1) | old man on the path + you | first crack in the "normal journey" frame | first step past Gym 1, **badge still warm** — must land while momentum is high | your sense of a first-time journey | "*this time* / as if there were others" — the loop seed |
| `main.event2` "…small world" (road3) | rest-stop radio + clerk + you | the world starts repeating | mid-game, after the player has *built a routine* worth recognizing | your trust in your own memory | the "Welcome Back" sticker → ties to `ANOMALY_SEEDS[7]` |
| `main.event3` (road5) | you, alone with the evidence | déjà vu sharpens to dread | far enough in that déjà vu is *earned* | your composure | escalates toward the reveal |
| `main.battle1` (road5) | a "mirror" foe (see G8) | the loop tests you against a near-self | a road5 battle row | a fight that should *feel* personal | a near-self foreshadows `mfBattle` |
| `main.event4` (road7) | you + the thinning veil | the loop is almost legible | post-Gym-6, late enough to name it | naming the thing makes it real | direct lead-in to the league |
| `main.battle2` (road7) | a second mirror foe (G8) | second, harder self-test | a road7 battle row | escalating personal stakes | the final mirror = `mfBattle` |
| `main.event5` "almost at the Plateau" (road8) | you, at the threshold | the journey's "end" approaches | post-Gym-8, before the league | the illusion that the Plateau is the end | sets the false ending |
| `main.event6` (E1, `fireAtEvent`) | league context | the climb begins | **at E1 specifically** | the league gauntlet | builds toward the crown |
| `main.event7` (Champion, `fireAtEvent`) | Champion context | the "last fight" framing | **at Champion specifically** | the crown | "the crown isn't the last fight" |
| `main.event8` "Crown Isn't The Last Fight" (Rival, `fireAtEvent`) | Champion + your rival | the false ending is named false | **after the crown, at the final Rival** | your belief the story is over | the rival "looks smaller" — the real climax is coming |
| `main.event9` "Your Name, One Extra Digit" (`firePostHoF`) | the capped figure | the loop becomes visible | **after Hall of Fame** | your identity (the extra digit = a count) | the figure by the empty portrait |
| `main.mfBattle` "You're Going To Win This One" (`mysteryBoss`) | the figure (= your party + 1) | the loop made flesh | post-HoF climax flow | everything — this is the real final | "you'll win this one. The next one too. That's the problem." |
| `main.mfReveal` "It Was You" (`firePostHoF`) | The First (= older you) | **the payoff of every prior hook** | after winning `mfBattle` | the meaning of the whole run | the loop is explained; one choice remains |
| `main.ending` "Run #1" (`firePostHoF`) | The First + you | the door to the next loop | after the reveal | how you carry it forward | `main.loop.remember` choice — remember vs forget |

The spine's NOW column is **healthy** post-HoF (fireAtEvent/firePostHoF gating) but
**fragile road-side** (event1–5 ride the coarse `roadN` dump — they fire at a road's
first battle, not at a moment that earns them). That's G2 acting on the backbone.

### 3.2 Villain arc — the template (shown for `rocket`; identical shape for all 10)

All `VILLAIN_STORY_BEATS[*]` share one structure, so one template covers
rocket/magma/aqua/galactic/plasma/flare/skull/yell/macroCosmos/star.

| Beat | WHO | WHY | NOW | STAKES | NEXT |
|---|---|---|---|---|---|
| `event1` (road2) | a grunt being mundanely evil (Slowpoke-tail sale) | establish the arc's *texture* of harm | first road2 beat, after you have *one* badge of standing | your sense that small evils are someone's job | "stay in your lane" — you haven't earned the right to intervene yet |
| `event2` (road3) | the harm escalates; a complicit bystander | the harm has a supply chain | road3 | a chance to act | `villain.rocket.driver` **choice** → pays off in `event4` + `ending` |
| `event3` (road4) | the operation, closer | proximity raises pressure | road4 | exposure | sets up `battle1` |
| `battle1` (road4) | grunts | first direct confrontation | road4 battle row | first real resistance | escalation to the admin |
| `event4` (road5) | consequence of the `event2` choice | the world reacts to **you** | road5 | the cost of your earlier pick | `branches` on `villain.rocket.driver` |
| `battle2` (road5) | grunts, harder | the org notices you | road5 battle row | momentum | sets up the mini-boss |
| `event5` (road6) | the admin's shadow | the boss has a lieutenant | road6 | named opposition | introduces `miniBoss` |
| `miniBoss` "Proton" (road6, `BEAT_CANON_TRAINER`) | the admin | the lieutenant fight | road6 battle row | the admin's respect/fear | the boss is now reachable |
| `event6` (road7) | the approach to HQ | final confrontation framing | road7 | everything the arc built | sets up `boss` |
| `boss` "Giovanni" (road7, `BEAT_CANON_TRAINER`) | the boss | the arc's climax | road7 battle row | the arc's resolution | `outro.win` aftermath (1M G) |
| `ending` "Some Things Stop" (road7) | the world after | denouement | **must be AFTER `boss`** (see G3) | what your win did/didn't fix | references the extra-arc Marowak on the hill (latent cross-arc tie) |

> **NOW failures in this arc today:** `miniBoss` and `boss` fill NOW only by
> *hijacking an unrelated row* (G4) — the "now" is "the next road battle happened
> to exist," not "you tracked them here." And `ending`'s NOW is **broken** (G3 — it
> fires before `boss`). The card's NEXT for `event2` (the choice) is the arc's
> strongest causal thread and should be the model for the others.

### 3.3 Extra arc — the template (shown for `cubone`; identical shape for all 8)

| Beat | WHO | WHY | NOW | STAKES | NEXT |
|---|---|---|---|---|---|
| `event1` "The Mask Is Real Bone" (road1) | a child in a bone mask | establish the wrongness | first road1 beat | your willingness to notice | the unease that nobody else notices |
| `event2` (road2) | the broker buying skulls | the harm has a market | road2 | complicity | escalates the dread |
| `event3` (road3) | closer to the source | the pattern resolves | road3 | understanding | sets up the first raid |
| `event4` (road4) | the brink | the spirit stirs | road4 | confrontation | introduces `miniRaid` |
| `miniRaid` (road4, **legendary, no canon trainer**) | the grieving spirit (partial) | first supernatural confrontation | road4 battle row | being *witnessed* by grief | the spirit isn't done |
| `event5` (road5) | the toll mounts | the spirit escalates | road5 | your resolve | sets up `miniRaid2` |
| `miniRaid2` (road5, legendary) | the spirit, stronger | second confrontation | road5 battle row | the spirit's full attention | the true raid looms |
| `event6` (road6) | the reckoning's eve | final framing | road6 | the arc's meaning | introduces `raid` |
| `raid` "A Remembered Place" (road6, **legendary, no canon trainer**) | the Lavender Marowak | the arc's climax | road6 battle row | being understood / granting permission | `outro.win`: "permission for something you haven't done yet" |
| `ending` (road7) | the world after | denouement | road7 (after `raid`) | what you carry | closes the arc |

> **NOW failures in this arc today:** `miniRaid`/`miniRaid2`/`raid` are the **G1**
> beats. Their WHO (a lone grieving legendary) is contradicted at the bottleneck by
> a human-trainer VS card. Their NOW is "the next road battle existed" (same as G4).
> Everything else — WHY, STAKES, NEXT — is fully present in the prose and `outro`.

---

## 4. Encounter-framing matrix

The single most common "out of nowhere" hit is an encounter whose **frame**
(who announces it, what the intro card says, why it's happening) doesn't match what
the encounter **is**. Today one function — `showBattleIntro` — frames almost
everything as "a human trainer wants to battle," because it only receives the
**row's** `eventType`, never the beat's `kind`.

| Encounter | What it IS | Current frame | Frame defect | Intended frame (design) |
|---|---|---|---|---|
| **Wild (route node)** | a wild Pokémon, catchable | catch screen via `_runFirstStoryInterrupt` / `STORY_BATTLE_INTERRUPTS` | OK — distinct surface | keep; this one is right |
| **Catch tutorial** | first-wild teaching moment | catch screen + one tutorial (post-dedup) | OK (dedup fixed) | keep |
| **Basic Trainer** | a generic route trainer | `showBattleIntro`, "Basic Trainer" nameplate + quote | OK | keep; this is the baseline |
| **Gym Trainer** | gym warm-up | `showBattleIntro`, "Gym Trainer" | OK | keep |
| **Gym Leader 1–8** | the badge fight | `showBattleIntro` (gold accent) + classic cold-open at milestones | OK; well-served | keep; the Oak cold-opens are the model for "framed by a voice" |
| **Rival (4 phases)** | your recurring foil | `showBattleIntro` with phase tagline + secondary line | OK — *unless* a boss beat hijacks the row (G4) | keep — **but reserve the Rival row from boss injection** (§7) |
| **Elite Trainer / E1–E4 / Champion** | league gauntlet | `showBattleIntro` (purple/gold) + `main.event6/7/8` framing | OK — league is well-sequenced | keep |
| **Villain `battle1/2`** | grunt fights | `showBattleIntro` generic | acceptable (grunts *are* generic) | keep; optionally theme the grunt sprite (Stream 2) |
| **Villain `miniBoss` / `boss`** | the named admin / boss | `showBattleIntro` **after** `BEAT_CANON_TRAINER` swap → correct name/sprite + the injected scene | **mostly OK** — the *fight* is themed; the defect is G4 (it lands on an arbitrary/Rival row with no "you tracked them here") | keep the swap; **frame the row substitution** ("you followed the truck here") so the WHO change has a WHY |
| **Extra `miniRaid` / `raid`** | a **lone legendary-tier spirit** | `showBattleIntro` renders a **generic human trainer** (no canon entry) → then `_rollExtraRaidBossTeam` fields one legendary | **G1 — the headline defect.** Intro card ≠ encounter | **A raid needs a raid frame:** the injected scene *is* the intro (suppress the human-trainer VS card), the "nameplate" is the spirit, the foe sprite is the legendary, no trainer quote. The scene's `acts` already supply the intro lines. |
| **Main `battle1/2`** | a "mirror" self-test | generic trainer (G8) | prose promises a themed mirror; card delivers filler | **A mirror frame:** a near-self foe; if a canon mirror can't be built, the scene should not promise one (Stream 2 prose note) |
| **`mysteryBoss` (Mystery Figure)** | the loop made flesh | dedicated identity path (`_storyEnsureMysteryIdentity`) + purple accent | OK — special-cased correctly | keep; this is proof the engine *can* frame a non-trainer encounter |

**The matrix's thesis:** there are really **four** frame archetypes, but the code
only has one-and-a-half (trainer, plus the Mystery special-case). The missing two:

1. **Raid frame** — a wild legendary/spirit. Scene-as-intro, no human card. *(fixes G1)*
2. **Substitution frame** — a scheduled fight whose identity changed for a reason.
   The reason must be stated. *(fixes G4)*

`mysteryBoss` already proves archetype (1) is buildable; raids should reuse that
path. This is a **handoff to the engine/presentation lane** — this stream specifies
*what each archetype must convey*, below.

### 4.1 Frame contracts (what each archetype must convey — design, not code)

- **Trainer frame:** WHO (name + role), a line of voice, "VS". *(have it)*
- **Leader/league frame:** trainer frame + a mentor/stakes cold-open. *(have it)*
- **Raid frame:** the spirit's name/aspect, the scene's intro lines as the framing
  text, the legendary's silhouette, **no human sprite, no trainer quote, no "Basic
  Trainer" nameplate.** Mood = the arc's dread, not "battle starting."
- **Substitution frame:** a one-line diegetic bridge for *why this fight is now this
  person* ("The grunt at the gate wasn't a grunt." / "You followed the truck — it
  led here."), then the trainer frame for the canon character.

---

## 5. Before / after — the 5 worst offenders (real content)

These show the **framing/causality** change, not a prose rewrite (the prose is
good). "Before" is the live behavior, traced through the anchored dispatch. "After"
is the design proposal. No code here — placement + framing only.

### 5.1 G1 — Raid gets a trainer intro *(P0)*

**Before** (live trace, extra=cubone, road6 first battle after the villain mini-boss
has fired, eventIndex 41 `Basic Trainer`):

```
[scene] extra.cubone.raid "A Remembered Place"
        "The Lavender Marowak stands in the road — the mother every version of
         this story grieves… she will not let you past until you've understood
         what you've been walking over."
[VS]    showBattleIntro(trainer="<rolled Basic Trainer name>", eventType="Basic Trainer")
        ┌─ player sprite  VS  <random human trainer sprite> ─┐
        │  nameplate: "Basic Trainer"                        │
        │  "You look like you could give me a decent fight!" │   ← getTrainerQuoteForBattle
        └────────────────────────────────────────────────────┘
[fight] foe team = [ one Marowak, _bossStatMult 1.3 ]        ← _rollExtraRaidBossTeam
```

The grief-spirit scene is immediately undercut by a stranger's "let's battle!" card.

**After** (raid frame — §4.1; suppress the human VS card, scene *is* the intro):

```
[scene/intro] extra.cubone.raid acts → rendered as the encounter frame:
        nameplate: "The Lavender Marowak"   (the spirit, not "Basic Trainer")
        lines:     the scene's own intro/climax lines
        figure:    the Marowak silhouette    (no human sprite, no trainer quote)
        mood:      arc dread                  (not the generic VS jingle)
[fight] foe team = [ one Marowak, _bossStatMult 1.3 ]   ← unchanged
```

**Engine note (handoff):** `mysteryBoss` already renders a non-trainer encounter
(`isMysteryFinal` branch). The raid path should route through that archetype instead
of `showBattleIntro`'s trainer card. This stream owns the *contract* (what the frame
must say); the wiring is Stream 3 / Phase E.

### 5.2 G2 — Road-opening clump *(P1)*

**Before** (live trace, road1 first battle, eventIndex 7 `Basic Trainer`,
villain=rocket, extra=cubone):

```
processNextEvent(row 7)
 → _tryFireRoadStoryBeats: _resolveActiveRoadBeats('road1') = [ main.event1, extra.cubone.event1 ]
   [overlay 1] main.event1   "How It Ends This Time"   (loop foreshadow)
   [overlay 2] extra.cubone.event1 "The Mask Is Real Bone" (horror)
 → enterBattleEvent
   [overlay 3] _runStoryColdOpen(classic_gym1) "After Badge One"  (Oak, grounded)
   [overlay 4] showBattleIntro  "VS Basic Trainer"
   [fight]     a generic Basic Trainer
```

Four overlays — loop dread, body-horror, a warm mentor speech, and a filler fight —
arrive as an undifferentiated stack. (`ANOMALY_SEEDS[7]` also fires here as a 5th,
a bare toast — see 5.5.)

**After** (spread across the segment's diamonds per §2.4; *same content, moved*):

```
City1.arrive (DIAMOND)  → classic_gym1 "After Badge One"   (the mentor frames the badge)
road1.restStop (DIAMOND) → main.event1 "How It Ends This Time"  (the loop seed, at a rest stop — as written)
road1.fight (BOTTLENECK)  → showBattleIntro → the Basic Trainer  (ONE thing)
City2.arrive (DIAMOND)  → extra.cubone.event1  (the horror beat, on arrival in the next town)
```

Each beat now has room and a *reason to be there*. Nothing was written or deleted;
the queue was un-stacked. (Requires the slot dispatcher — Phase E. This spec
provides the target slot per beat in §3's anchors.)

### 5.3 G3 — Villain aftermath before the boss *(P1, FLOW-BUG)*

**Before** (live trace, road7, villain=rocket; the dump precedes the inject):

```
[row 48 Elite Trainer] _tryFireRoadStoryBeats dumps road7 events, including:
        villain.rocket.ending "Some Things Stop"
        "Rocket dissolves on paper within the week… You broke the company."
[row 49 Elite Trainer] _activeBattleBeatForCurrentRow injects:
        villain.rocket.boss "Giovanni"   ← the climax, AFTER its own aftermath
```

You are told you won before you fight.

**After** (ordering only — `ending` must sort after `boss`; no prose change):

```
… → villain.rocket.boss "Giovanni"  (climax) → outro.win (1,000,000 G)
    → villain.rocket.ending "Some Things Stop"  (denouement, now correctly last)
```

**Handoff:** this is a dispatch-ordering fix (event-dump vs battle-inject share no
sort). Flagged here; the fix lives in the engine lane. The *intended order* is the
deliverable: `event* < battle/boss/raid < ending` within an arc.

### 5.4 G4 — Unframed boss substitution (boss-on-Rival) *(P1, FLOW-BUG)*

**Before** (live trace, road6 first battle = the **Rival** row, eventIndex 39):

```
_activeBattleBeatForCurrentRow → villain.rocket.miniBoss (canon: Proton)
enterBattleEvent: sm.trainerAssignments[39] = "Proton"   ← the Rival row is overwritten
[scene] villain.rocket.miniBoss
[VS]    showBattleIntro(trainer="Proton", eventType="Rival")  ← phase tagline says "Rival"…
[fight] Proton                                                 …but the foe is Proton
```

Your scheduled rival encounter silently becomes a Rocket admin; neither the rival
thread nor the villain thread acknowledges the swap.

**After** (substitution frame — §4.1; a one-line diegetic bridge, plus reserve the
Rival row):

```
DESIGN: the Rival row (eventIndex 39) is a RESERVED slot — boss/mini-boss beats
        do not inject onto Rival / Gym-Leader / Gym-approach rows.
        → the mini-boss takes the next eligible Basic/Elite row instead.
FRAME:  on that row, a substitution bridge precedes the canon intro:
        "The 'trainer' blocking the route stop wasn't passing through. Proton
         has been waiting for you." → then the Proton trainer frame.
```

**Handoff:** "reserved slots" is engine work (Phase E §4c already proposes it). This
stream contributes the **reserved-row list** (Rival 12/39/65, all Gym Leaders, all
Gym-approach rows) and the **bridge-line contract**.

### 5.5 G5 + G6 — The inert diamond and the system-alert breadcrumbs *(P2)*

**Before** (live, arriving City 2 after a road full of events; then mid-road):

```
_showCityArrivalScreen(2):
  nameplate "City Guide"
  "Coffee, kettles, and a Move Tutor who claims to remember every move ever invented."
  "Trainers do not pass through this town by accident."
  → identical regardless of the villain sermon, the raid, or the loop-anomaly you just hit.

_tryFireAnomalySeed(row 7):
  showGameAlert("A new sticker on your map reads 'Welcome Back.' You don't remember peeling it.")
  → a bare modal, no narrator, mid-stride; main.mfReveal never calls back to it.
```

The one reflective space says nothing about your journey; the loop's evidence trail
pops like a save confirmation.

**After** (the diamond does its two jobs — acknowledge + plant — and absorbs the
breadcrumb; *content exists, it's re-homed*):

```
City2.arrive (DIAMOND), aware of "what just happened":
  base:        "Coffee, kettles, and a Move Tutor…"   (keep the city's identity line)
  acknowledge: + one line that reacts to the last road's lead beat
               (villain sermon → "Word here is someone's been preaching at the rest stops.")
  plant:       + the anomaly, woven in diegetically instead of a toast:
               "Your map has a new sticker. 'Welcome Back.' You don't remember peeling it."
```

**Handoff:** `_showCityArrivalScreen` needs a "last-road-context" input and an
anomaly slot. The *what-to-say* (the acknowledge line per villain/extra lead, the
re-homed anomaly text) is this stream's; the input plumbing is the engine lane. The
**mfReveal call-back** to the four seeds is a prose addition (Stream 2).

---

## 6. Handoff list for Streams 2 / 3 / 4

> **Charter note:** the brief that defines Streams 2–4 is missing (see header). The
> routing below is by **capability**, with my working inference of each stream's
> lane in brackets. Owners should claim/redirect — the *item* matters more than the
> guessed lane. All items are pre-grounded to anchors so the receiving stream
> doesn't re-audit.

### → Stream 2 *(inferred: Character & Voice / prose)*
- **H2-1 (from G7):** Write the **bridge between Oak and the loop**. Either Oak
  knows and won't say (a chosen ignorance), or the loop is invisible to him. Pick
  one and seed 1–2 lines. Anchors: `classic_gym*` in `STORY_COLD_OPENS`,
  `main.event*` in `STORY_SCENES`.
- **H2-2 (from G6):** Add a **call-back in `main.mfReveal`** to the four
  `ANOMALY_SEEDS` (the handwriting, the sticker, "Tell The First we said hi"). The
  payoff must name the breadcrumbs. Anchor: `STORY_SCENES["main.mfReveal"]`,
  `ANOMALY_SEEDS`.
- **H2-3 (from G4):** Write the **substitution bridge lines** (one per villain
  miniBoss/boss) for "why this scheduled fight is now this person." Contract in
  §4.1. Anchor: `BEAT_CANON_TRAINER`.
- **H2-4 (from G8):** Resolve `main.battle1/battle2`: either the prose stops
  promising a themed mirror, or a canon mirror foe is specified. Anchor:
  `STORY_SCENES["main.battle1"]`, `MAIN_STORY_BEATS`.
- **H2-5 (from G5):** Author the per-arrival **acknowledge lines** (one per
  villain-lead + extra-lead the player could have just seen). Anchor:
  `CITY_ARRIVAL_LINES`.

### → Stream 3 *(inferred: Presentation & Sensory framing / the encounter-intro UI)*
- **H3-1 (from G1, P0):** Build the **raid frame** — route `raid`/`miniRaid` through
  the non-trainer encounter intro (reuse the `isMysteryFinal` archetype in
  `showBattleIntro`) instead of the human-trainer card. Contract in §4.1. Anchors:
  `showBattleIntro`, `enterBattleEvent`, `_rollExtraRaidBossTeam`, `_EXTRA_RAID_SPECIES`.
- **H3-2 (from G6):** Replace the **bare `showGameAlert`** anomaly delivery with a
  diegetic surface (the arrival/rest-stop overlay, per §5.5). Anchor:
  `_tryFireAnomalySeed`.
- **H3-3 (from G2):** Presentation half of "spread" — ensure sequential diamond
  beats don't re-stack (the `_renderNarrativeOverlay` queue already serializes; verify
  for the new slots). Anchor: `_playStoryBeatQueue`, `_renderNarrativeOverlay`.

### → Stream 4 *(inferred: Reactivity & Player Agency / world-state, save, sequencing)*
- **H4-1 (from G3, FLOW-BUG):** Enforce intra-arc order `event* < battle/boss/raid <
  ending`. Anchors: `_tryFireRoadStoryBeats`, `_activeBattleBeatForCurrentRow`,
  `VILLAIN_STORY_BEATS.*.ending`.
- **H4-2 (from G4, FLOW-BUG):** **Reserved slots** — boss/mini-boss/raid beats never
  inject onto Rival / Gym-Leader / Gym-approach rows. Reserved-row list in §5.4.
  Anchor: `_activeBattleBeatForCurrentRow`, `_ROAD_BY_ARRAY_IDX`.
- **H4-3 (from G2/G5, the big one):** The **slot dispatcher** that makes §2.4's
  "spread setups into diamonds, one payoff per bottleneck" possible. This is
  `STORY_OVERHAUL_PLAN.md §4` (single event model + ordered slots). This stream
  supplies the **target slot per beat** (§3 anchors + §2.4 map); Stream 4 / Phase E
  builds the machine. Anchor: `_resolveActiveRoadBeats`, `_tryFireRoadStoryBeats`.
- **H4-4 (from G5):** Feed `_showCityArrivalScreen` a **"last-road-context"** input
  so arrival can acknowledge the prior segment. Anchor: `enterCity`,
  `_showCityArrivalScreen`.

### → Cross-cutting / maintainer
- **C-1 (from G9):** Scrub raw stage-directions out of `STORY_SCENES.*.body`
  (battle scenes) or guarantee no live path renders `body`. Latent prose leak.
- **C-2:** This stream did **not** reorder/renumber `STORY_EVENTS_RAW` (out of scope
  + save-migration risk). Two findings (H4-1, H4-2) are dispatch-ordering, not
  timeline edits — they need no `SAVE_VER` bump. The slot dispatcher (H4-3) *does*
  touch the dedup store and needs the `STORY_OVERHAUL_PLAN.md` Phase E migration.

---

## 7. Flow-ordering bugs — explicit flags (per CLAUDE.md)

`CLAUDE.md`: *"Flow-ordering bugs MUST be flagged even though the user owns the
flow."* Two confirmed, one corrected-as-stale, one watch-item:

- **🟢 FIXED — FLOW-BUG G3 (aftermath before climax).** `villain.*.ending` (event, dumped
  by `_tryFireRoadStoryBeats`) fired before `villain.*.boss` (battle, injected by
  `_activeBattleBeatForCurrentRow`) — both `roadAnchor:'road7'`. `eligible()` in
  `_resolveActiveRoadBeats` now defers a `villain.<arc>.ending` until `villain.<arc>.boss`
  is in `sm.storyEventsFired`; the ending then dumps at the next road7 row (idx51, just
  after the boss at idx49). Trace-verified; no timeline edit, no `SAVE_VER` bump.
- **🟢 FIXED — FLOW-BUG G4 (boss hijacks the Rival/arbitrary row).** `_activeBattleBeatForCurrentRow`
  injected the canon boss onto the first eligible road battle — on `road6` the **Rival**
  (eventIndex 39), which silently became the mini-boss (Proton). It now returns `null` on
  reserved rows (Rival / Gym Leader / Champion / E1-E4 / Mystery Figure / Victory Road), so
  the inject waits for the next generic row (the mini-boss moved to idx41). Trace-verified
  non-stranding across all 10×8 rolls. The in-fiction **substitution frame** — acknowledging
  the swap *when* it lands on a generic row — remains a Stream-2 prose item *(→ H2-3)*.
- **🟢 CORRECTED (was P0 in prior docs) — league finale no longer spoils before E1.**
  `STORY_FLOW_AUDIT.md §3 B10` and `STORY_OVERHAUL_PLAN.md §3` report the Mystery
  reveal + ending dumping at E1. **Stale.** `_resolveActiveRoadBeats` now gates league
  beats by `fireAtEvent` (event6→E1, event7→Champion, event8→Rival) and `firePostHoF`
  (event9/mfReveal/ending → post-HoF climax flow). Verified against live code. No
  action — noted so the prior P0 isn't re-opened.
- **🟢 CORRECTED — variants do not roll randomly.** `STORY_OVERHAUL_PLAN.md §3` says
  variants roll per-run; live code forces `sm.storyLine='classic'` (`_readStorylineFromUI`,
  guarded by `tests/suites/story-tone-retirement.test.js`). The classic milestone
  cold-opens are the only `STORYLINE_VARIANTS` content that fires. No dead variant
  dialogue is player-facing on this axis.
- **🟡 WATCH — `main.event5` vs `classic_gym8` co-fire.** Both target the post-Gym-8
  run-up (`road8` / row 56). Not a bug, but a G7 instance (two main voices at one
  segment). Folded into H2-1.

---

## 8. Summary — what this stream is asking for

1. ~~**Give raids a raid frame** (G1/H3-1)~~ — **✅ shipped (PR #242):** the flagship raid
   encounter now gets a wild-Pokémon cinematic instead of the cheapest trainer intro.
2. ~~**Fix the two ordering bugs** (G3/G4)~~ — **✅ shipped (this work):**
   aftermath-before-climax and boss-on-rival; both were sort/reservation, not timeline
   edits, so they were cheap and save-safe.
3. **Invert the diamond/bottleneck load** (G2/G5/§2) — **G2 ✅ shipped:** the road dump
   now paces one setup beat per fight instead of clumping the whole queue. Still open:
   spread setups *into* the hub (the diamond) and make arrival acknowledge-and-plant
   (G5) — *placement of existing content*.
4. **Re-home the loop breadcrumbs** (G6) and **bridge the two main voices** (G7) —
   small prose adds that turn parallel layers into one connected story.

The prose is already a strength. This stream's whole job is the **joins**: make every
beat answer *why here, why now,* and make the hub the place those answers live.
