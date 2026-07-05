# Mystery Figure Rework — Implementation Plan

> Status: **IMPLEMENTED (2026-07-04)** — maintainer answered the open questions
> (Q1: full grade-1 rolls from the enabled generations, full builds · Q2: narrative-only
> reward · Q4: both encounters retakeable · Q5: no balance compensation) and the work
> shipped on this branch. Deviations from the plan below, discovered during
> implementation:
> - **No SAVE_VER bump needed** — the new fields (`mfEncounter1`, `mfFinalResult`,
>   `mfFirstInBattle`, `mfFirstTeamLock`) are additive with `load()` back-fills, same
>   pattern as `hofPartySnapshot`. Old saves need no repair (the gate code is simply gone).
> - **Same-six retries** use a frozen `sm.mfFirstTeamLock` (the `currentEnemyLock`
>   pattern) instead of pure re-seeding — warm build caches consume the seeded RNG
>   stream unevenly, so re-rolls could drift mid-session.
> - **Final-encounter skippability** is the game-over **Accept the Loss** path (after an
>   attempt), not a pre-fight decline — matching the user's own flow description. The
>   mask stays on; the Crucible Mystery encore replays the fight and fires the reveal on
>   a later win.
> - The multiverse reveal already existed in `main.mfReveal`; Part B extended it with the
>   sorting/trial framing + first-encounter branches rather than rewriting it.
> Authoritative docs now live in `STORY_MODE_FLOW.md` (§9, §14d, §14e). This file is kept
> as the design record.
>
> Scope: replace the City-8 Mystery Figure legendary-gift visit with a proper **first
> encounter** (talk or fight, meant-to-lose-but-winnable, no punishment), rework the
> **final encounter** dialogue around the multiverse reveal ("the Mystery Figure is you
> from another universe") with result-dependent branching and a no-punishment loss path,
> and **deepen the roaming-legendary sighting** with extra animation + dialogue.

---

## 0. What the code does today (verified anchors)

| Piece | Where | Current behavior |
|---|---|---|
| City-8 visit ("the gift") | `isPreLeagueLegendaryMysteryGate` (battle.html:39003), `_profLegendaryMysteryMode` (53702, 53812–54080), gate blocking (50748–51067, 51324) | After Gym 8, a **forced** Mystery Figure visit reuses the Professor's lab screen to offer a **legendary swap-in**. The route to Victory Road is **blocked** until the swap is taken (`routeBlockedByMysteryGate`). |
| Legendary roll for the gift | `mysteryFigureRollsForBadges` (38987), `pickStoryLegendaryFromGens` (39008) | Grade-1 (legendary-tier) weighted roll for the gift choices. Both become dead code once the gift is removed. |
| Final encounter | Row 67 `[67,'Battle','Mystery Figure',{g1:100,…},5000,null]` (34251); team roll `rollMysteryFigureFinalBossTeam` (46258) | Post-HoF climax. **Already mirrors the player**: fields `sm.hofPartySnapshot` (the exact Hall-of-Fame six, verbatim builds) with the **+30% Mystery stat mult** (`_storyStatMultForEvent` → 1.30, 39471). |
| Boss mechanics on final | `BOSS_CONFIGS['main.mfBattle']` (49586, rolled variant 49637), attach path (19604–19627), `mystery` effect pool `['ward','regen','immunity']` + every-5-turn immunity round (11289–11293) | **Already attached** to the final fight. |
| Identity / reveal | `MYSTERY_FIGURE_IDENTITIES.the_first` (38947), `_mysteryFigureSpriteFile` (38979), reveal flow `_fireMysteryRevealThenEnding` (46194), scenes `main.mfBattle` / `main.mfReveal` / `main.ending` | Canon is already "The First — an older version of the player, looping back to lose on purpose". Mirror-self sprite in the climax; ambiguous sprite at City 8 to avoid spoiling. |
| Loss handling (story-wide) | Game-over screen (58160–58225): Retry (58256, inventory refunded), Return to Last City (58227, half-gold fee, free on ≤normal), rival-only Concede (58296, loses all gold) | Post-HoF MF loss routes here with the climax re-armed (58273+). |
| Dialogue choice engine | `choices:` in scene acts → `_resolveActChoices` (48979), outcomes remembered in `sm.storyChoices`, later acts branch via `_branchMatches` (48939) | Choice → branch infrastructure exists and is live. |
| Pits defeat overlay | `_pitsShowDefeatOverlay` (53043) | Existing "Retry / walk away, no punishment" loss pattern to copy for encounter 1. |
| Roaming legendary | Queue on Gym-8 win (54614), one-shot pre-battle interrupt (48449), cinematic `_showRoamingLegendarySighting` → shared `_showWildEncounterCinematic` (55307–55380), lore table `_LEGENDARY_LORE` (55229), CSS (2755–2786) | Single static overlay: fade-in, pulsing sprite, banner, 1 lore line, 2 fixed narrator lines, one button → catch screen (30% catch, guaranteed flee). |
| Save schema | `SAVE_VER = 24`, `migrateStoryPreV*` (~42496–42731) | New flags ⇒ bump to 25 + migration. |

Design bonus: the multiverse concept is a natural extension of existing canon — "The
First" already loses on purpose so the present player keeps levelling. We keep that and
widen it: *every run of the game is a universe; there are many Oaks, many Champions, many
of you. The one who arrives at the end is the you who kept winning — and it prunes the
ones who can't.*

---

## 1. Part A — City 8: remove the gift, add the First Encounter

### A1. Remove the legendary gift + gate (the "visit")

- Delete the `_profLegendaryMysteryMode` branch of the professor screen (53812–54080
  mystery paths) and the forced visit: `shouldForceCityProfessor` no longer returns true
  for City 8 (39001).
- Delete route blocking: `routeBlockedByMysteryGate` and its wiring (50748, 50756, 50995,
  51046–51067, 51324) — Victory Road is reachable with no Mystery stop.
- Dead code to remove (verified single-purpose): `mysteryFigureRollsForBadges`,
  `pickStoryLegendaryFromGens` (+ its `MYST_LEG_G1_NONLEGEND` guard), the
  `isPreLeagueLegendaryMysteryGate` exports (45981, 46134–46135).
- Repurpose the `seedDebugMysteryLegendGate` debug button (9589) to seed the new first
  encounter instead.
- **Balance note (maintainer-owned):** this removes a guaranteed legendary acquisition
  before Victory Road. The roaming legendary (Gym-8 reward) becomes the run's only free
  legendary shot, which also sharpens the Master-Ball sink story (CLAUDE.md already
  frames the Master Ball as "best saved for a roaming legendary"). Flagging per approval
  rules; no compensation proposed unless you want one.

### A2. New First Encounter scene (City 8, after Gym 8)

Presentation: a **city scene** (STORY_SCENES entry, e.g. `main.mfFirst`) that surfaces
once when entering City 8 with 8 badges — *offered, never forced*. The figure waits at
the city edge; the ambiguous identity sprite stays (no mirror-self spoiler, per 38944).

Structure (uses the existing act/choice engine):

1. **Approach acts** (2–3 acts): the figure sizes the player up. Tone: it has watched
   this road "more times than you'd believe". No multiverse reveal yet — only hints
   ("I've seen a hundred of you make it this far. Most don't make it past me later.").
2. **Choice act** — the fork the user asked for ("narrative or a battle depending on
   dialogue"):
   - **"Who are you?" / walk away** → 1–2 closing narrative acts, no battle.
     Records `sm.mfEncounter1 = 'declined'`.
   - **"Prove it." / accept the challenge** → battle (A3).
3. Either way the scene never blocks progression — after it resolves (or is declined)
   City 8 behaves normally. **Skippable without consequence**: no reward is gated on it,
   no fee, no flag other than the result marker.

### A3. First Encounter battle spec

- Off-timeline fight (like the Pits / gate flows — `sm.eventIndex` untouched), trainer
  data `role: 'Mystery Figure'`, label "??? Mystery Figure".
- **Team: 6 × Gen-1 (Kanto) species, legendary-tier weighted roll, seeded RNG**
  (`storyRngNext`), TOURNAMENT build tier — a "meant to lose, still winnable" wall for a
  pre-Victory-Road party. ⚠ **Open question Q1** below: "All gen 1 rolls" — Gen 1 =
  Kanto reading is recommended (it foreshadows "The First" = the first universe), but
  confirm vs. the alternative "grade-1 rolls from all gens".
- **+30% stat mult** — reuse the existing `_storyStatMult` stamp (same 1.30 the final
  fight uses; single constant, maintainer-owned).
- **No boss mechanics** on this one (user assigned boss mechanics to the final fight
  only). No illegal-build injection either — raw stats + tier carry the difficulty.
- Rewards: win pays nothing material (dialogue is the reward) — keeps "skippable without
  consequence" honest in both directions. (Maintainer call if a token gold/voucher is
  wanted.)

### A4. First Encounter loss/win flow — "like a rival match but without punishment"

Do **not** route a loss to the story game-over screen. Model on `_pitsShowDefeatOverlay`:

- **Loss overlay**: figure's post-loss line + two buttons:
  - **Continue** — heal party to pre-fight state (restore battle-bag snapshot, same
    refund mechanism as 58160–58171), record `sm.mfEncounter1 = 'lost'`, resume City 8.
    **No gold fee, no retreat, no warp.**
  - **Retry** — unlimited, same team re-fielded (deterministic re-roll from the same
    seed key so retries face the same six).
- **Win**: short aftermath acts (the figure is *pleased*, not beaten — "Good. Again.
  Harder." energy), record `sm.mfEncounter1 = 'won'`.
- Result vocabulary: `sm.mfEncounter1 ∈ null | 'declined' | 'lost' | 'won'`
  (null = legacy/never offered).

---

## 2. Part B — Final Encounter rework (row 67)

### B1. What stays (already matches the request)

- Mirror team: exact HoF party via `sm.hofPartySnapshot` — "challenges you with players
  team" ✅ (46258–46295).
- **+30% stat buff** ✅ (39471).
- **Boss battle mechanics** ✅ (`main.mfBattle` config + mystery effect pool).
- Mirror-self sprite + reveal flow ✅.

### B2. Dialogue rework — the multiverse reveal

Rewrite the row-67 scene (`_MYSTERY67_BY_VARIANT`, 55494/`main.mfBattle` pre-fight), the
intro pool (`MYSTERY_FIGURE_IDENTITIES.the_first.intros`, 38950), the reveal
(`main.mfReveal`) and the post-HoF epilogue hooks (`_POSTHOF_EPILOGUE_BY_VARIANT`):

- **Premise:** every game ever played generates a universe. Many Professor Oaks, many
  Champions, many of *you*. The Mystery Figure is you from another universe — the one
  that finished first ("The First"). It stands at the end of every road and challenges
  new champions **to eliminate the weak**: only the versions of you that can beat
  *themselves at their best* deserve to continue.
- **Test framing:** "this time it tries how good trainer you are" — the fight is
  explicitly an examination, fielding your own Hall-of-Fame six back at you.
- **Intro branches on `sm.mfEncounter1`** (the "depending on first encounter dialogue
  changes" requirement):
  - `'won'` — "You beat me once with borrowed thunder. Now beat *yourself*."
  - `'lost'` — "You fell at City 8 and stood back up. Show me that was growth, not luck."
  - `'declined'` — "You walked past me once. There's no walking past this."
  - `null` (legacy save) — neutral line (current tone).
- A **pre-fight decline choice** is added to the intro scene (skippability, see Part C).

### B3. Final-fight loss options (all no-punishment)

Extend the story game-over screen the way the rival concede button already does
(53290–53306, 10307) — a third, Mystery-only button:

1. **Accept the loss — "I need more training."** (new `acceptMysteryLossAndContinue`)
   - Marks the climax resolved (`sm.postHofMysteryClimaxDone = true`) with
     `sm.mfFinalResult = 'accepted_loss'`.
   - Routes into `_fireMysteryRevealThenEnding` with a **loss-variant reveal/epilogue**
     (the figure spares you: "Train. I'll be at the end of every road you ever walk.")
     → post-game/Crucible opens normally. **No gold loss** (unlike rival concede).
2. **Retry the fight** — existing Retry (58256) already re-arms the climax (58273+);
   inventory refund already works. Unchanged.
3. **Return to last city and retry later** — existing Return button; climax stays
   pending so the Crucible end-flow re-offers it. **Waive the retreat fee for this
   specific loss** (maintainer-owned number; recommended 0 to honor "without
   punishment").
- Win path unchanged: `sm.mfFinalResult = 'won'`, existing reveal → ending → Crucible.
- Ending/epilogue text alternates on `sm.mfFinalResult` × `sm.mfEncounter1` (small
  matrix: 2 final states × 4 first states, mostly shared lines with swapped key beats).

---

## 3. Part C — Skippability & "no coincidence" rules

Reading "skippable wothout coincidence" as: **both battles are deliberate opt-ins via
dialogue, never triggered accidentally, and skipping carries no penalty.**

- Encounter 1: choice act declines into narrative (A2). No gate, no fee, no lost reward.
- Final encounter: the intro scene gains a decline choice → plays the
  `accepted_loss`-style epilogue variant (labelled `'declined'` in `sm.mfFinalResult`)
  and marks the climax done, so the post-game still opens. The player can also re-arm it
  later from the Crucible (which already lists the Mystery Figure, 12747) if you want a
  "changed my mind" path — recommended: yes, via the existing Crucible re-fight surface.
- Guard: `_shouldFireRoamingBeforeBattle` already excludes Mystery rows (54646) — keep.

---

## 4. Part D — Roaming legendary: extra animation + deeper narrative

Current: one static overlay → catch screen. Upgrade (asset budget unchanged — existing
sprites, existing SFX keys, CSS only; all RNG via `storyRngNext`; respect
`prefers-reduced-motion` by collapsing to the current single-stage overlay):

1. **Two-stage cinematic** in `_showWildEncounterCinematic` (opt-in flag so raids keep
   current behavior):
   - **Stage 1 — Signs:** darkened route bg, the sprite rendered as a **silhouette**
     (`filter: brightness(0)` — same trick as `.vs-fighter-mystery`, 3057), slow drift
     animation, low `danger` SFX, 2 new narrator lines ("Something is pacing you beyond
     the treeline…"). Button: "Step closer →".
   - **Stage 2 — Reveal:** white flash (`storyLegendFlash` keyframe), silhouette lifts,
     **species cry plays** (roaming currently skips the cry raids get — add it), screen
     shake (reuse/add a small `storyShake` keyframe), sparkle burst via the existing
     confetti particle shell (2798) recolored gold, then the existing pulse + name +
     lore. Button: "Approach the legend →".
2. **Deeper dialogue:**
   - Extend `_LEGENDARY_LORE` entries from 1 line to a **lore line + a sighting line**
     (per-species second beat, e.g. Suicune: the water in your bottle goes clear). Fall
     back to the existing single line for unlisted species.
   - Replace the plain Gym-8 `showGameAlert` queue notice (54635) with a short 2-act
     narrator scene ("station chatter" — rangers reporting the sighting), same
     information, real staging.
   - **Outcome epilogues** (new, small): after the catch screen resolves, one line
     keyed to result — caught ("It stops fighting the ball almost immediately, as if
     it had already decided."), fled/missed ("The route is just a route again. It
     remembers you, though."). Hook: the catch flow already knows `roamingLabel`
     (60751, 60849) — fire a one-line overlay/toast on exit.
3. **Type-flavored staging:** tint Stage-1 vignette using the species' first type color
   and reuse `BOSS_FIELD_BY_TYPE`-style mapping for an ambience SFX pick (rain/spark/
   wind keys that already exist in StoryFx).

---

## 5. Save schema & migration

- New fields on new runs (defaults in the initial-state block ~42813/47607):
  `mfEncounter1: null`, `mfFinalResult: null`.
- `SAVE_VER` 24 → **25**; `migrateStoryPreV25`:
  - Back-fill both new fields to `null` (legacy-neutral dialogue branch).
  - Saves **standing at the City-8 gate** (city 8, ≥8 badges, gift not taken): nothing
    to repair — gate code is gone, route is open, the first-encounter scene offers
    itself on next city entry.
  - Saves **that already took the gifted legendary**: keep the mon (it's just a team
    member now); `mfEncounter1` stays `null`.
  - `postHofMysteryClimaxDone` semantics unchanged.
- Guard test extends `story-tone-retirement`-style coverage (see §6).

## 6. Docs & tests

- **STORY_MODE_FLOW.md** — rewrite the Mystery Figure sections (gate removal, first
  encounter, multiverse canon, loss matrix). **CLAUDE.md** — update the excised/active
  notes if wording references the C8 gift.
- New suite `tests/suites/mystery-figure-rework.test.js` (jsdom harness):
  1. City 8 + 8 badges → route NOT blocked; no forced professor visit.
  2. First-encounter choice: decline → `mfEncounter1='declined'`, no battle mounted.
  3. First-encounter battle: foe team is 6 mons, all Gen-1 (or grade-1 per Q1), all
     builds carry `_storyStatMult === 1.3`; deterministic under a fixed seed.
  4. Loss → Continue: no gold delta, inventory refunded, city re-entered, flag `'lost'`.
  5. Final intro line varies across all four `mfEncounter1` states.
  6. Final loss → Accept: `postHofMysteryClimaxDone` true, `mfFinalResult='accepted_loss'`,
     no gold delta, ending fires.
  7. Migration: v24 save at the gate loads clean, route open, flags back-filled.
  8. Roaming: reduced-motion collapses to single stage; outcome epilogue fires for
     caught + fled paths.
- Existing suites to re-run: story-tone-retirement, quickplay-modes (regression only).

## 7. Suggested PR slicing (each lands green + signed off)

1. **PR-1 — Gate removal + first encounter** (Parts A, save bump, migration, tests 1–4, 7).
2. **PR-2 — Final encounter dialogue + loss options** (Parts B, C; tests 5–6).
3. **PR-3 — Roaming legendary cinematic** (Part D; test 8). Independent of PR-1/2.

## 8. Open questions (need maintainer answers before coding)

- **Q1 — "All gen 1 rolls":** Gen 1 = **Kanto-only species** (recommended — foreshadows
  "The First" being from the first universe), or grade-1 (legendary-tier) rolls from all
  enabled gens? The +30% is unambiguous either way.
- **Q2 — First-encounter win reward:** strictly narrative (recommended), or a token
  material reward?
- **Q3 — Retreat fee waiver** on Mystery losses: waive for both fights (recommended per
  "without punishment"), or final only?
- **Q4 — Crucible re-offer** after declining/accepting loss at the final: allow a later
  rematch from the Crucible list (recommended), or lock the run's outcome?
- **Q5 — Legendary economy:** any compensation for the removed C8 legendary gift, or is
  the roaming legendary + Master Ball sink the intended sole source (recommended)?
