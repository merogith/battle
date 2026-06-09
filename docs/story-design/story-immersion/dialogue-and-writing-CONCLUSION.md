# Story Immersion — Stream 2: Conclusion & Handoff

> Companion to `dialogue-and-writing.md` (the design spec). That doc is the **what/why**;
> this is the **execution record + what remains**. Steps 1–6 + the CI fix shipped via
> **PR #241** (branch `claude/stream2-impl`, merged to `main`). The remainder — 7a, 7d, the
> D1/D2/D3 prose, and this doc — ships via the **follow-up PR** on branch
> `claude/gifted-galileo-wHy8a`.
> **Scope of this doc:** maintainer chose *"spec step 7 + unblocked prose"* — so the
> self-contained items are **shipped**, the Stream-3/4-wiring-dependent prose is **authored
> here as ready copy**, and three items that need a narrative-canon call are **posed in §D**.

---

## A. What shipped

All copy is maintainer-approved (spec §11/§12, "go with your recommendations"). The
**PR #241** rows are merged to `main`; the **follow-up PR** rows are this branch.

| Step | Offender / ask | Change | Where | Guard |
|---|---|---|---|---|
| 1 | C | E4 + generic-rival pools re-voiced | PR #241 | `smoke-dialogue-load` |
| 2 | F | Trainer-create setup form re-voiced | PR #241 | harness DOM read-back |
| 3 | A | Cold-opens recast → recurring **Veteran** + world-narrator Hall | PR #241 | `story-coldopen-casting` (5) |
| 4 | B | Mystery climax intro re-cut → dread, not exposition | PR #241 | `story-mystery-intro` (3) |
| 5 | D | Tutorial walls re-voiced (Colress/Casino/Fan Club), mechanics intact | PR #241 | `story-tutorial-revoice` (4) |
| 6 | §11.1 | Rival-name → "your rival" in narration; gag stays on HUD | PR #241 | `story-rival-name` (3) |
| — | CI | `the_first` canonical-hook assertion → §4.1 re-cut | PR #241 | (fixed the lone failing test) |
| 7d | §9.2 #4 | Choice-contract guard (persistKey/options/branches; no path-fork) | follow-up PR | `story-choice-contract` (4) |
| 7a | §8 | Bark variance layer — `data/dialogue/barks.json` + schema rule | follow-up PR | `story-barks-schema` (4) |
| D1–3 | §D | Loop prose: Oak loop-blind · mfReveal breadcrumb · battle2 mirror softened | follow-up PR | `story-loop-prose` (3) |

**Test posture:** 8 guard suites (drift-tolerant, content-matched) + the fixed
`story-mf-the-first-v22`. Full local suite green on the rebased branch (see PR body for the
exact count).

---

## B. H2-3 — substitution bridge lines *(ready copy; wiring = Stream 3/4)*

**From** `narrative-coherence.md` §6 H2-3. **Contract:** when `BEAT_CANON_TRAINER` swaps a
scheduled road battle for a canon villain (in `enterBattleEvent`), one bridge line tells the
player *why the scheduled fight is now this person* — so the named villain doesn't appear as
an unexplained reskin. **Render home is Stream 3/4** (the same encounter-intro hook as H3-1);
this supplies the words. **Proposed shape:** `data/dialogue/substitution-bridges.json`, keyed
by sceneKey (mirrors `BEAT_CANON_TRAINER`), one line each.

**Bosses (Road-7 climax — the org's head takes the field):**

| sceneKey | Canon | Bridge line |
|---|---|---|
| `villain.rocket.boss` | Giovanni | "This was supposed to be one more road fight. Then the grunts cleared out, and Giovanni took the field himself." |
| `villain.magma.boss` | Maxie | "The next trainer on the road never showed. Maxie did — Magma doesn't send a stranger to finish its own work." |
| `villain.aqua.boss` | Archie | "No scheduled challenger here. Just Archie, and the tide he brought with him." |
| `villain.galactic.boss` | Cyrus | "The road's roster meant nothing to him. Cyrus was always going to be standing here." |
| `villain.plasma.boss` | Ghetsis | "The expected fight dissolves. Ghetsis prefers to arrange who you face — and he arranged himself." |
| `villain.skull.boss` | Guzma | "Forget whoever the road lined up. Guzma kicked the door in and took the slot." |
| `villain.yell.boss` | Piers | "The booked act cancelled. Piers is closing the show himself tonight." |
| `villain.flare.boss` | Lysandre | "The trainer the road promised isn't coming. Lysandre arranged this meeting personally." |
| `villain.macroCosmos.boss` | Rose | "No ordinary challenger. Rose cleared his calendar — and yours — for this." |
| `villain.star.boss` | Penny | "The scheduled fight blinks out like a dropped feed. Penny logged in instead." |

**Admins (Road-6 mini-boss — the lieutenant steps in):**

| sceneKey | Canon | Bridge line |
|---|---|---|
| `villain.rocket.miniBoss` | Proton | "The road's next trainer steps aside. Proton doesn't ask twice." |
| `villain.magma.miniBoss` | Tabitha | "Not the challenger you expected — Tabitha, clearing the way for Maxie." |
| `villain.aqua.miniBoss` | Shelly | "The slot's been reassigned. Shelly is here on Archie's orders." |
| `villain.galactic.miniBoss` | Mars | "The scheduled fight is scrubbed. Mars took it for Team Galactic." |
| `villain.plasma.miniBoss` | Saturn | "No road trainer here — Saturn, holding the line for Cyrus." |
| `villain.flare.miniBoss` | Bryony | "The expected face is gone. Bryony runs Lysandre's errands, and you're one." |
| `villain.skull.miniBoss` | Plumeria | "Forget the roster. Plumeria looks after the Skull kids — and she's looking at you." |
| `villain.yell.miniBoss` | Marnie | "The booked fight's off. Marnie steps up for Spikemuth." |
| `villain.macroCosmos.miniBoss` | Oleana | "The challenger withdrew. Oleana manages Rose's problems. You qualify." |
| `villain.star.miniBoss` | Giacomo | "The feed cuts to Giacomo. Star sets its own schedule." |

*Voice note:* world-narrator, one line, names the villain + the swap. No boss-mechanic
telegraph (that stays in `BOSS_CONFIGS`/the banner per spec craft-rule 7).

---

## C. H2-5 — city-arrival acknowledge lines *(ready copy; wiring = Stream 4 H4-4)*

**From** `narrative-coherence.md` §6 H2-5. **Contract:** on arriving in a city, acknowledge the
villain/extra lead the player *just* encountered on the prior segment, so arrival reacts to the
road instead of resetting. **Render home is Stream 4 H4-4** (feed `_showCityArrivalScreen` a
"last-road-context" input); this supplies the words. **Proposed shape:** extend the arrival data
with a `byPriorArc` map (arc id → line), appended under the existing `CITY_ARRIVAL_LINES`.

**Villain orgs (complete set):**

| Arc | Acknowledge line |
|---|---|
| rocket | "Word on the street: Rocket grunts cleared out of the last route in a hurry. You'd know why." |
| magma | "Ash on the wind from the hills behind you. Magma was busy back there." |
| aqua | "The harbor talk is all storms and Aqua divers. You met some." |
| galactic | "People here heard Galactic worked the last road. They look at you differently for having walked it." |
| plasma | "A Plasma sermon still rings in your ears from the road in." |
| skull | "Fresh Skull tags on the underpass into town. You passed the kids who sprayed them." |
| yell | "Team Yell's chants faded a mile back. The quiet here is louder for it." |
| flare | "Someone on the last road tried to sort you. Flare's stickers don't wash off the memory." |
| macroCosmos | "The corporate banners thin out past the last checkpoint. Macro Cosmos was thick back there." |
| star | "The streams are still buzzing about Star's last stunt on the road behind you." |

**Extra (horror) arcs — exemplar + completion note:**

| Arc | Acknowledge line |
|---|---|
| cubone | "The town keeps its lights on tonight. Something on the road behind you didn't want to be alone." |

> The other 7 extra arcs (`yamask`, `hypno`, `phantump`, `mimikyu`, `drifloon`, `parasect`,
> `mewtwo`) want one line each in this register — best authored alongside the H4-4 wiring so each
> line matches the exact lead the player saw. The pattern above is the template.

---

## D. Three items — RESOLVED (maintainer chose all three recommendations)

> **Decided 2026-06-08:** "go with all 3 recs." All three are now **implemented** on
> `claude/stream2-impl`, each guarded by `tests/suites/story-loop-prose.test.js`.

### D1 — H2-1: Does Oak know about the loop? — ✓ *loop invisible to him*
**Implemented** in `STORY_SCENES["main.event1"]` (climax): a narrator contrast — the professor
saw you off "like it was the first time. For him, it was," set against the loop-aware bench old
man. No new Oak speech.
The bridge between Oak (the warm mentor) and the deterministic loop The First reveals. Pick one:
- **Oak knows, and won't say** — a quiet, chosen complicity; his warmth carries a hidden grief.
  Seed (e.g. in `classic_twist`): *"I went home once, at this gym. …Some roads you walk more than once. Don't think about that too hard."*
- **The loop is invisible to Oak** *(recommended)* — he's as unaware as the world; The First's
  knowledge stays singular and lonelier. Seed: no new Oak line; instead one `main.event*` beat
  notes *"the professor doesn't remember saying this before. You're not sure you do either."*

*Recommendation:* invisible-to-Oak — keeps the mentor uncomplicated and makes The First's burden
unique. But "Oak knows" is the more poignant option if you want the weight on him.

### D2 — H2-2: Breadcrumb call-back in `main.mfReveal` — ✓ *added (additive)*
**Implemented** in `STORY_SCENES["main.mfReveal"]` (climax act): The First names the four
`ANOMALY_SEEDS` payoffs — the Welcome-Back sticker (row 7), the handwriting in your Pokédex
(rows 14/49), and the trainer who said to tell him hi (row 30) — *"so you'll remember to leave
them."* The reveal's signature line ("The face under it is yours. Older.") is untouched; the
call-back is appended, so the act count stays 4 and the bar still holds.

### D3 — H2-4: The `main.battle1/2` "mirror" promise — ✓ *prose softened*
`main.battle1` was already a clean loop-aware veteran beat ("You Always Lose This One"). The
over-promise was in `main.battle2` ("matched, slot for slot… the same blueprint as your own"),
which the engine can't deliver (no canon mirror team — `BEAT_CANON_TRAINER` has no
`main.battle2`). **Implemented (a):** softened to "built the way yours is built, reaching for the
same answers a step ahead of you" — keeps the near-self dread, drops the unkept literal claim.
Building an actual canon mirror foe **(b)** remains a Stream-3/4 enhancement.

---

## E. Handoff — Stream 4 (data/engine) and Stream 3 (presentation)

| Item | Owner | Note |
|---|---|---|
| **7b** `speaker` block in the scene/overlay schema | Stream 4 | Turns §6 casting into data (`speaker.id`/`voice`). §6 already shipped as code, so this is future-proofing — low priority. |
| **7c** Externalize in-code pools → `data/dialogue/` | Stream 4 | `cold-opens` / `tutorial-scenes` / `intro-scenes` / `mystery-figure` / `rival-pools` via `extract-dialogue-pools.mjs` (add to its POOLS list). Behavior-preserving; makes copy review a JSON diff. |
| **Bark wiring** | Stream 4 | Consume `data/dialogue/barks.json`: append a seeded (`storyRngNext`) pick *after* the canonical log line on the 4 non-state events. The schema guard already locks the boundary. |
| **H2-3 render** | Stream 3/4 | The substitution bridge hook (with H3-1's raid/encounter frame). Copy ready in §B. |
| **H2-5 render** | Stream 4 | H4-4 last-road-context input to `_showCityArrivalScreen`. Copy ready in §C. |

---

## F. Stream 2 status

- **Spec (`dialogue-and-writing.md`) §12 checklist:** all design items approved and, where
  self-contained, **implemented** (PR #241).
- **Step 7:** `7a` (barks data+schema) and `7d` (choice guard) **shipped**; `7b`/`7c` handed to
  Stream 4 (§E).
- **Stream-1 prose handoffs:** `H2-1`/`H2-2`/`H2-4` **implemented** (§D — maintainer chose all
  three recs); `H2-3` and `H2-5` **authored** (§B/§C, ready copy, render-wiring handed to
  Streams 3/4).
- **Net:** Stream 2 is **done** — every authored-copy and narrative-decision obligation is
  shipped. What remains is purely engine wiring owned by Streams 3/4 (§E): the `speaker` block,
  pool externalization, bark wiring, and the H2-3/H2-5 render hooks (+ the optional canon
  mirror-foe for D3).
