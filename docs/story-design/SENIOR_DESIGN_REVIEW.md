# Senior Design Review — Story Mode

**Source:** `STORY_MASTER.xlsx` (the auto-generated "Master Data & Design Bible," dumped from the live runtime) cross-verified against `battle.html` at **`SAVE_VER = 23`**.
**Reviewer stance:** senior game designer. Goal — protect the *spirit* of the game, surface every issue worth discussing, and recommend an industry-standard path.
**Scope:** Story Mode, normal difficulty (per `CLAUDE.md`). PvP / Quick Play / Frontier are out of scope and only noted for awareness.

> **Companion docs:** `DESIGN_FEEDBACK.md` already covers difficulty-curve texture, preset spread, UI/a11y, and onboarding well — **but it is stale** (it still describes the retired 8-storyline picker and the 8-identity Mystery Figure). Where this review and that doc overlap I defer to it; where they conflict, the *code* wins and I say so here.

---

## 0. Method & confidence

Everything below was checked against the monolith, not just read off the sheet. Two kinds of correction recur:

- **The sheet is one version stale** (generated at `SAVE_VER 22`; code is `23`). I re-verified the headline bugs against live code and corrected counts where the code has moved.
- **The design *docs* have drifted from the code.** This is itself a finding (§7).

Confidence tags: **[verified]** = I read the code; **[sheet]** = taken from the bible's own audit, not re-derived; **[judgment]** = my design opinion.

---

## 1. The spirit of the game — what we are protecting

Before any fix, the pillars, because several "bugs" are actually the spirit working and must not be "corrected" back to canon:

1. **Build-craft over grind.** Every mon fights at a fixed level; there is no XP and no level-up. Strength is *how a team is built* — nature, EVs, IVs, ability, moves, items, evolution stage. The entire economy and every facility (Move Tutor, Dojo, Nature Rater, EV Trainer, Evolution Lab, Cable Link, Colress) exists to let the player *tune* a team, not *level* it. **This is the core identity. Protect it.**
2. **Roguelike replayability.** Seeded RNG (`storyRngNext` LCG), per-run randomized gym leaders / rival / villain track / extra track, NG+ that carries the Pokédex + achievements but wipes the team. The run is the unit of play, not the save file.
3. **Catch as a clean minigame.** Catching is divorced from combat — pure `species.catchRate × ballMult`, with flee pressure. No HP-whittling. It is a *collection* loop, not a *combat* loop.
4. **Smooth, multi-axis difficulty.** Seven knobs (grade ceiling, build tier T1–T4, city stat-band, EV band, IV band, item tier, move-optimization gradient) all ramp together by city. No difficulty cliffs by design.
5. **A literary, melancholy meta-narrative.** The prose is genuinely good and unusually self-aware: *"From here, every road is a rival,"* the handwriting-you-don't-remember anomaly seeds, and the Mystery Figure who is *"every version of you that didn't stop."* The NG+ loop is the theme. This is the game's soul and its biggest differentiator from a generic fan-sim.

**Design consequence:** the bar for a "fix" is *does it serve build-craft, replayability, the clean catch loop, the smooth curve, and the loop-narrative?* Anything that doesn't is noise.

---

## 2. P0 — Immersion / correctness breakers (verified live)

These are live on essentially every run and visibly break the experience.

### 2.1 Story dialogue fires *inside* gym battles and on rival duels  `[verified]`
`_ROAD_BY_ARRAY_IDX` (`battle.html:41855`) only advances `currentGym` at the **Gym Leader** row (`:41865`). Every row between two leaders — the next city's *gym-approach trainers* (idx 10, 16, 23, 29/30, 36/37, 44/45, 51/52) and the **mid-run rival duels** (idx 19, 40) — inherits the *previous* road's anchor. So a road-N story/event beat is eligible to fire as an overlay right before a gym-approach trainer or a rival fight. **Result:** "a random event dialogue showed up in a gym battle." Gym Leader rows are safe (anchor = null); the *approach* is not.

- **Severity:** High. It's the kind of ordering bug `CLAUDE.md` says I *must* flag even though flow is pasteur's lane.
- **Recommendation:** Exclude Gym-Trainer / Gym-Leader / Rival rows from road-beat eligibility (anchor them `null` like the leader), **or** stop letting unfired road beats spill past the road's own trainer rows. Don't anchor a gym city's approach to the prior road. *(pasteur lane — flagged, not auto-shipped.)*

### 2.2 Villain "battle" beats play villain prose, then drop you onto a *generic* trainer  `[verified + sheet]`
The marquee feature — a rotating villain team (Rocket / Magma / Aqua / Galactic / Plasma / Flare / Skull / Yell / Macro Cosmos / Star), **rolled every run** (`:35455`) — is only ~20% wired:

- **Event** beats fire as narrative overlays. ✅ Live.
- **`villain.*.battle1/battle2`** beats are kind `"battle"`, which is *excluded* from `_isInsertKind`, and have **no `BEAT_CANON_TRAINER` entry** → the villain prose plays, then you fight an ordinary rolled trainer with no theming.
- **`villain.*.miniBoss`** (the admin: Proton/Tabitha/Shelly/Mars/…) entries exist in `BEAT_CANON_TRAINER` + `BOSS_CONFIGS` but **no miniBoss beat is authored** → the Road-6 admin fight *never fires*. Dead refs.
- Only the **Road-7 `villain.*.boss`** (Giovanni/Maxie/…) is a real themed fight.

So the villain arc is "lots of narration, one payoff fight." For a Pokémon game, confronting *Team X's themed mons* **is the genre promise.** This is the single biggest completeness gap.

- **Severity:** High (design completeness). **[judgment]**
- **Recommendation:** Wire themed villain encounters even minimally — when a `battle`/`miniBoss`/`raid` beat has no canon trainer, re-skin the rolled trainer to the villain's grunt pool + type + name so the *fight matches the prose*. Either author the miniBoss beats or delete the dead admin refs. *(pasteur lane.)*

### 2.3 The rival's identity is fractured three ways  `[verified + sheet]`
The rival is the emotional spine (cold-open *"every road is a rival"*; the MF reveal *"I am every version of you"*). Yet:

- **Nameplate** in battle reads `"<player> Sucks"` (`_storyRivalTauntName`).
- **Voice / journal / badge lookups** use a canon name (e.g. "Blue").
- **Sprite** is randomly drawn from all rival sprites (`pickStoryRivalSpriteFile :38043`, `runRivalSpriteFile :38144`) → the face ≠ the name in ~92% of runs `[sheet]`.

Three names/faces for one character undercuts the strongest narrative thread in the game.

- **Severity:** High narrative cost for low code cost. **[judgment]**
- **Recommendation:** Lock the sprite to the canon rival name; treat the "X Sucks" taunt as a *flavor overlay*, not the identity, and attribute aftermath lines to the canon name. *(pasteur lane.)*

### 2.4 Master Ball is double-granted on (almost) every run  `[verified]`
Two grant sites both fire on a normal completed run:
- `_storyGrantTrackEndReward` → `villain.*.boss` win → `sm.balls.master += 1` (`:42107`). The Road-7 boss *is* a real fight (see 2.2), and a villain track is **always rolled**, so this fires every run.
- Hall-of-Fame first clear → `sm.balls.master += 1` (`:54114`).

The in-code comment at `:42100` calls the Master Ball *"uniquely tied to the Caged God arc."* It isn't — the player nets **two**, and neither guards the other.

- **Severity:** Medium (economy/rarity — a Master Ball is supposed to feel singular). Balance number = **user-owned.** **[verified]**
- **Recommendation:** Pick one canonical source. My vote: keep the HoF→Caged-God Master Ball (it's thematically earned and gates the post-game capture); make the villain-boss reward something else (Ultra ×3, or a unique held item). *(Needs your sign-off — it's a balance number.)*

---

## 3. P1 — Systemic mismatches (one root cause each, many symptoms)

### 3.1 City flavor is decoupled from the rolled city  `[sheet, ~10 of 47 mismatches]`
A city's **name** follows its rolled leader (Misty → "Cerulean"), but its **guide quote / specialty blurb / arrival lines** are *fixed per city index*. So you routinely get "mining-quarry town" flavor (`C1`) fronting a Grass/Bug/Flying leader, a "Safari gate" blurb on `C4` when the Safari is on `C5`, a "Department Store" blurb on `C8` (which has none), an "EV Trainer" blurb on `C1` (debuts `C7`), and gendered guide lines ("SHE likes a crowd") that miss ~75% of the time.

This is **one systemic coupling bug**, not ten cosmetic ones. The half-coupled state *guarantees* mismatches.

- **Recommendation:** Decide the coupling direction and make it total:
  - **(A)** Drive flavor from the leader's *type/theme* (data-driven pools keyed to type, not index), so a Grass leader gets garden/greenhouse flavor wherever they roll; **or**
  - **(B)** Fix city names to index too, and keep flavor index-keyed.
  I recommend **(A)** — it preserves the per-run surprise and is the more "alive" world. Much of this lives in `data/dialogue/*.json` + the flavor arrays, which is **partly my lane** (data-driven text). I can prototype (A) for review. **[judgment]**

### 3.2 Seven replay achievements are defined but unreachable  `[verified — corrected from sheet's "9"]`
Definitions at `:34535-34550`. After re-grep, these have **no unlock path**: `r_hall_of_fame`, `r_champion_twice`, `r_monotype`, `r_challenge_clr`, `r_no_item`, `r_solo`, `r_three_runs`. (The sheet listed 9; `r_perfect_rival` `:47367` and `r_no_death` are now wired — sheet stale.) The bitter irony: **`r_hall_of_fame` — "defeat the Champion once" — is itself unreachable.** `noItemThisRun` is tracked (`:39179/:53466`) but never read.

- **Recommendation:** Wire the 7 from existing hooks (HoF, difficulty, party-composition check at champion win, lifetime run count). Low-risk, high "completeness" payoff. Mostly engine-side = **my lane** with sign-off. **[judgment]**

### 3.3 Determinism is a stated pillar the engine doesn't fully honor  `[verified + sheet]`
`CLAUDE.md`: *"Use seeded RNG everywhere user-visible … Deterministic replays are part of the product."* In practice, `Math.random` is monkey-patched to the seeded LCG when `sm.active` (`:35116`), so a clean linear playthrough is reproducible — **but** in-battle rolls (damage spread, crit, multi-hit, accuracy, paralysis/sleep/confusion, Quick Claw, speed-tie) advance the *shared* stream, not an event-seed, so a **mid-battle reload desyncs the transcript.** Wild species, casino, and daycare hatch are intentionally unseeded.

- **Recommendation:** Decide what "deterministic replay" *means* as a promise. Either (a) event-seed the in-battle stream so a reload reproduces, or (b) soften the pillar's wording to "deterministic per-event resolution, not mid-battle reload." This is **my lane** (engine correctness) and I'd want a deterministic test to lock it. **[judgment]**

---

## 4. P2 — The deeper design conversations (no single "right" answer — these need you)

### 4.1 What is gold *for*?  — the central economy question  `[judgment]`
With **full-heal between every battle** and **no attrition**, consumables (potions, revives, status heals) only matter *within* a single fight — and on Normal, with the smooth curve, most fights never need them (`DESIGN_FEEDBACK §1.4`: the walkthrough harness clears the game using *zero* items). So gold's only meaningful sink is **team optimization** (evolution 1.5–16k, Cable Link rerolls 6–14k, Nature 2k, EV 5k, ability swaps 2–5k, Safari 10k).

A full run pays out **~200k+ gold** (sum of the victory table + bundles + dex milestones + Caged God +10k). That funds deep optimization of six mons — *if the player engages*. A player who doesn't tune ends the run drowning in gold with nothing to buy, and the entire consumable shop is **vestigial**.

- **The conversation:** is the consumable economy meant to exist at all? Three coherent directions:
  - **(A) Lean in:** keep auto-heal but make a handful of *spike* fights (villain boss, champion, MF) genuinely demand items — give the shop a reason to exist.
  - **(B) Lean out:** accept that gold = optimization currency; trim the consumable shop to a few staples and stop pretending it's a survival economy.
  - **(C) Reintroduce light attrition** for one difficulty tier (Hard/Challenge) so items matter there.
  I lean **(B) + a touch of (A)** — commit to "gold buys mastery," and reserve item pressure for the 3–4 marquee fights. Either way, **decide and tune the payout/sink balance as a set** (balance numbers are yours).

### 4.2 Difficulty is elegant but *illegible*  `[judgment]`
Seven hidden knobs ramp together beautifully under the hood, but with no levels the player has **no single legible read** of "how strong is this foe vs me?" Build-craft games that succeed (TFT, Slay the Spire, modern roguelikes) still give the player a legible power signal. Right now the only visible tier is the per-mon Grade, and even that isn't surfaced as threat.

- **The conversation:** is opacity *intended* (mastery through feel) or a gap? `DESIGN_FEEDBACK §3.4` proposes predicted-damage on move tiles for Easy/Normal — I'd go further: a per-foe "threat" pip or a visible foe-tier label, hidden on Hard/Challenge. This is also the natural place to teach EV/IV (which the game never explains — `DESIGN_FEEDBACK §2.6`). **My lane (UI/a11y) with your call on philosophy.**

### 4.3 Pacing: ~65 forced battles, fixed level, auto-heal  `[judgment]`
~48 trainer fights + ~17 forced route wilds, all at Lv50 with full-heal and a smooth curve. The opening and the league are great; the **mid-game (C3–C6) risks monotony** — many near-identical "rolled trainer" fights with no attrition tension and no level-up dopamine to mark progress. (`DESIGN_FEEDBACK §1.1` flags the same plateau from the stat side.)

- **The conversation:** target run length and battle count. The villain fights (§2.2) *are* the mid-game variety injection the structure is crying out for — which is another reason to prioritize wiring them. Also consider: are 2 *forced, unskippable* wilds per route the right number, or should over-catchers be able to opt out after one? *(Curve/pacing = maxwell lane; wild count = shared.)*

### 4.4 Onboarding is front-loaded and theory-light  `[judgment]`
Debut cities gate "Leave City" behind tapping *every* facility intro (C0: Mart + Tutor + Bag + Relic; C1: PC + Party + Fan Club + Nature Rater + Dojo). That's a wall of one-shot modals before the player has a reason to care, and yet the systems that actually decide who wins — EV/IV/nature — are never *taught* (`DESIGN_FEEDBACK §2.6`).

- **Recommendation:** Stagger tutorials to point-of-need (show the Nature Rater intro the first time the player *opens* it, not as a leave-gate), and add a one-screen "Mechanics Codex" for EV/IV/nature/tier. **My lane (UX) with your sign-off on flow gating** (touches pasteur's intro queue).

---

## 5. P3 — Narrative & polish (cheap, high-felt-quality)

- **Mystery Figure has no seeding** `[sheet/§2.2 of DESIGN_FEEDBACK]`. The post-HoF reveal lands, but nothing in C4–C8 foreshadows it. The anomaly seeds (*"Tell The First we said hi"*) are *perfect* for this — there are 4 already authored; lean into them as the foreshadow track. **[judgment]**
- **Safari "first visit is tighter" beat never happens** `[sheet]`. Safari unlocks at C5 = 4 badges, but the `badges:3` (5% G2) curve row + its comment assume C4 — so the intended "your first Safari is harder" moment is dead; the player always hits the generous `badges:4` row. Either move the Safari to C4 or delete the dead row + fix the comment. **[verified via sheet anchor `:48128`]**
- **Daycare UI lies about hatch timing** `[sheet]`. Copy still says *"hatches after your seventh badge / Gym 7,"* but post-v21 the egg hatches at `pickup-city + 2`. Stale text. Trivial fix.
- **Dialogue pools are thin** (`DESIGN_FEEDBACK §2.4`): 5 rival-phase lines, 6 Basic-Trainer lines → repeats within a single run. Cheap to expand; lives in `data/dialogue/`. **My lane (data-driven text).**
- **Only 10/67 gym leaders have a named pre-battle taunt** `[sheet]`; the rest fall to a generic line. Content gap, not a bug.

---

## 6. Where the "bug" is actually the better design — do **not** revert these

A senior pass should also *defend* good decisions the audit flags as defects:

- **Mystery Figure mirrors your team instead of fielding its declared legendaries.** The sheet calls the declared sigs "dead." **Keep the mirror.** Fighting an optimally-built copy of yourself (with a stronger lead) is *thematically perfect* for a game whose villain is "every version of you that didn't stop." The fix is to **delete the dead `sigs` + the dead `"Cyrus"` fallback**, not to restore legendaries. **[judgment]**
- **Collapsing 8 storylines → one auto-rolled 3-track system.** `DESIGN_FEEDBACK §2.5` correctly noted the old variants were "cosmetic pretending to be branching." The 3-track collapse (1 main + 1 rolled villain + 1 rolled extra) is the *right* call — *if* the villain fights get wired (§2.2). Don't revive the picker.
- **Catch divorced from combat.** Clean and modern. Keep it.
- **Full-heal between battles.** Defensible — it shifts the game from attrition to build-craft. Just own the economy consequence (§4.1).

---

## 7. Documentation drift (a finding in itself)

The design docs no longer match the code, which is how mismatches breed:

- `DESIGN_FEEDBACK.md` describes **8 Mystery-Figure identities** and **selectable storyline variants** — both retired. Code: `_storyPickMysteryIdentity()` hardcodes `'the_first'` (`:32902`); tracks auto-roll (`:35455`).
- `STORY_MODE_FLOW.md` states `SAVE_VER 15` and "Master Ball ×1"; code is `SAVE_VER 23` with the double-grant.
- Spec says Safari unlocks at C4 / wild grade keys on `sm.badges`; code: Safari at C5, wild grade keyed on **city index**.

**Recommendation:** treat `STORY_MASTER.xlsx` as the **generated source of truth** (it's dumped from the runtime), and either regenerate the prose docs from it or stamp them "historical." Add a CI check that re-dumps the bible and diffs against the prose specs so drift surfaces automatically. **My lane (sustainability).**

---

## 8. Prioritized recommendation table

| # | Issue | Sev | Lane | Type | Suggested order |
|---|---|---|---|---|---|
| 2.2 | Villain battle/miniBoss/raid fights not themed | High | pasteur | Completeness | **1** |
| 2.1 | Road beats fire in gyms / on rivals | High | pasteur | Bug | **2** |
| 2.3 | Rival sprite ≠ name ≠ taunt | High | pasteur | Polish | **3** |
| 3.1 | City flavor decoupled from rolled city | Med | data/general | Systemic | **4** |
| 2.4 | Master Ball double-grant | Med | user-owned | Balance | **5** |
| 3.2 | 7 replay achievements unreachable | Med | general | Completeness | **6** |
| 4.1 | "What is gold for" — economy purpose | — | user-owned | Direction | discuss |
| 3.3 | In-battle determinism vs the pillar | Med | general | Engine | discuss |
| 4.2 | Difficulty legibility / EV-IV teaching | Med | general+user | UX | discuss |
| 5.x | MF seeding, Safari row, daycare text, dialogue pools | Low | data/general | Polish | batch |
| 6.x | Delete dead MF sigs / `"Cyrus"` fallback | Low | general | Cleanup | batch |

---

## 9. What I can do now vs. what needs you

**I can prepare immediately (low-risk, my lane, behavior-preserving or pure-content), pending your go-ahead:**
- Wire the 7 unreachable achievements from existing hooks (§3.2).
- Prototype data-driven city flavor keyed to leader type (§3.1, direction A).
- Delete dead code: MF `sigs` + `"Cyrus"` fallback; the dead Safari `badges:3` row + comment; fix the daycare hatch text (§5, §6).
- Expand the thin dialogue pools (§5).
- Add the doc-drift CI check (§7).

**Needs your decision first (balance / direction / cross-lane):**
- §2.4 Master Ball — which single source?
- §4.1 Economy — lean into or out of the consumable shop?
- §3.3 Determinism — real pillar (event-seed in-battle) or soften the claim?
- §2.1 / §2.2 / §2.3 — these are pasteur's story-flow lane; per `CLAUDE.md` I flag and prep diffs but don't ship without a hand-off.

*No game-behavior change has been made. This document is analysis only.*

---

# Part II — Review-session direction (working notes, subject to confirmation)

Captured live from the design discussion. These reflect the *designer's* (user's) stated
intent; numbers and structural forks still need final sign-off before any diff ships.

## II.0 Corrected diagnosis of the 3-track injection (supersedes §2.2 + the bible's Event-Flow sheet)

The code has moved past the spreadsheet. Actual current state:

| Beat kind | Canon trainer? | Insert-kind? | Result today |
|---|---|---|---|
| `villain.*.boss` (Road 7) | ✅ all 10 (`:42180`) | ✅ | **Themed fight** (Giovanni…) + phase mechanics. Works. |
| `villain.*.miniBoss` (Road 6) | ✅ all 10 (`:42191`) | ✅ | **Themed fight** (Proton…). Works. *(bible says "dead" — stale)* |
| `extra.*.raid` (Road 6) | ❌ none | ✅ | **BROKEN** — phase mechanics (`:42252`) attach to a *generic rolled trainer*. → "raid mechanics in a normal/gym fight." |
| `extra.*.miniRaid` | ❌ none | ❌ | Prose only; generic trainer; miniRaid mechanics may still attach by sceneKey. |
| `villain.*.battle1/2` | ❌ | ❌ | Generic trainer + villain prose. Not themed. |
| `main.mfBattle` (post-HoF) | n/a (isMysteryFinal dispatch) | n/a | **Themed mirror fight.** Works. |

Plus the eligibility leak (§2.1): `currentGym` only ticks at the Gym-Leader row (`:41865`), so
any unfired road beat — **including raid `BOSS_CONFIGS` mechanics** — can fire on the next
city's gym-approach trainers and on the mid-run rival duels. **This single bug produces both
reported symptoms:** "story dialogue in a gym" *and* "gym battle randomly spawns raid mechanics."

## II.1 Confirmed creative direction (from the designer)

- **Meta-frame:** every run = a different parallel universe (Pokémon games as a sci-fi multiverse);
  NG+ = the next universe. The player "always makes runs."
- **3 simultaneous arcs per run:**
  1. **MAIN / Mystery Figure** — *static* (same every run). "The First" is **you, from beyond
     universes**, who mastered everything and returns to test whether *this* you is ready for the
     "galactic level." The **mirror team is intentional and correct** — do not restore legendaries
     (confirms §6). Currently under-developed; wants a few battles + dialogues to carry it.
  2. **VILLAIN** — rolled from a pool, **locked at run start**, its own dialogue arc + regular
     battles + a boss (some mechanic triggers).
  3. **EXTRA** — rolled, locked at start. Dark/gore/creepy **retellings of fan creepypastas +
     reddit/4chan dark & meme stories**, each a unique arc of **mini raids + one main raid**.
- **Bosses/raids: keep SIMPLE for now** — vanilla, uniform, slightly nerfed, easy to test.
  Fancy per-boss mechanics are **out of scope** this pass.
- **"Caged God" is retired** — legacy name from an early draft. The post-game capture should fold
  into the MF frame, not an orphaned arc.
- **Master Ball:** exactly **one**, granted from a story line, **usable on anything** (no restriction).
  → remove the double-grant.
- **Naming:** rename the route **"Elite Trainer" → "Ace Trainer"** (rows 34/42/48/49/56–58). The
  current label collides with the **Elite Four**; the internal difficulty class is already
  "ACE/ELITE", so this aligns the UI to the model. Pure label/text — low risk.
- **Economy:** keep **auto-heal**; direction is **"gold = mastery" (lean out)**, but preserve
  item-relevance in marquee fights (foes use items there). Nerf **early-game movesets** so early
  healing items matter. **×2 price** on the strong consumables (Mega/Ultra featured items + Revive/
  Max Revive/Revival Herb) — they're too cheap to abuse for their power.
- **Pacing goal:** Game-Boy-Pokémon vibe, simplified. A **slow, weak start** ramping like a
  competitive-Pokémon onboarding pipeline — introduce one new mechanic per region, with **power
  spikes** → a "kaizo" late game. **No levels → build composition (moves, grade, evo stage, stats,
  EV/IV, items) is the entire pacing lever.** Overall scaling (weak→strong) is already liked.
- **Known pain:** early game too strong **because of moves**; build/move generation needs design
  attention; flow feels confusing/buggy; story doesn't "feel strong" yet.

## II.2 Proposal A — Move-driven pacing curve (the core lever)

The designer's instinct (gate to egg/learnt/transfer early) is the *right goal, wrong axis*:
move **category** doesn't control power (an egg move can be a 120-BP nuke). The power levers are
**BP cap + archetype + coverage count**, which the engine already has (`_storyDowngradeMovesForTier`,
`bpCap`, `_storyGateFoeMovesByCity`, the optimization gradient). Reframe them from a *smooth gradient*
into a **legible, spiky "one new capability per region"** budget, applied to **both** foes and
player-obtainable builds (so the player's *own* early team feels the slow start):

| Region | New capability (the "spike") | BP cap | Archetypes allowed |
|---|---|---|---|
| C0–C1 | STAB + 1 status. "Tackle & Growl" era. | ~60 | STAB only |
| C2 | **Coverage** (off-type damage) | 75 | +coverage |
| C3 | **Setup** (one boosting move) | 90 | +setup |
| C4 | **Hazards / Screens** (support) | 100 | +hazard/screen |
| C5 | **Priority + weather/terrain** | 110 | +priority/+field |
| C6 | **Recovery + 2nd setup** (bulk wars) | 120 | +recovery |
| C7+ | Full meta — no gate | full | all |

This simultaneously (a) fixes "early too OP due to moves," (b) delivers the "pipeline + power-spike
kaizo" feel, (c) gives each region a distinct *texture* (echoes `DESIGN_FEEDBACK §1.1`), and (d) is
legible — the player learns one tool per gym, like real Pokémon onboarding.
**Lane: maxwell (move-tag index / build tiers).** I can draft the archetype-by-city table as a
config for maxwell to own the numbers.

## II.3 Proposal B — Flow + 3-arc fix (the clarity lever)

1. **Eligibility gate (kills both symptoms):** road beats fire ONLY on genuine road-trainer rows —
   never Gym-Trainer / Gym-Leader / Rival rows. Anchor those `null` or filter them in
   `_resolveActiveRoadBeats` + the battle-entry hook. *(pasteur lane.)*
2. **Extra raids → solo Pokémon bosses, not trainers.** Give each `extra.*.raid` a raid *species*
   (Marowak for cubone, etc.) spawned as a solo boss (reuse the MF/forced-catch solo path), so the
   raid mechanics finally have a themed body. This is the structural fix for the extra track.
3. **Villain `battle1/2` → re-skinned grunts.** When no canon trainer, theme the rolled trainer to
   the villain's grunt pool + type + name (a real "Rocket Grunt"), so the fight matches the prose.
4. **Bosses simple for now:** gate the fancy `BOSS_CONFIGS` mechanics (faintPhase/weather-lock)
   behind a flag, default OFF this pass — run plain themed fights, slightly nerfed.
5. **Boss item-usage:** cap heal/revive to ~1, **telegraphed** (banner "SECOND WIND"), so it's a
   dramatic beat, not a stall (ties to `DESIGN_FEEDBACK §1.5`).
6. **Battle-intro contract:** one consistent format — **[themed name] + [affiliation] + [one line]**;
   lock the rival sprite to the canon name (§2.3). Fixes "battle introductions are confusing."

## II.4 Proposal C — Make the Mystery-Figure / main arc "feel strong"

1. **Anomaly seeds = the MF foreshadow spine.** They already exist ("Tell The First we said hi";
   handwriting you don't remember; the "Welcome Back" sticker). Stage ~5–6 across roads 1–8 as the
   main-track event beats, escalating from *unsettling* → *addressed to you.*
2. **Make NG+ tangible in the MF.** The save already persists `completedRuns` / `lastClearSeed` /
   HoF records — the narrative never uses them. On run N+1 the MF should *know*: "You've done this
   before. I remember even when you don't. How many times now?" The loop becomes both mechanic and
   story — the highest-leverage narrative move, using data that already exists.
3. **One mid-game wordless glimpse** (C5–C6): a figure with your silhouette across the route, gone
   when you approach (reuse the cold-open renderer; no fight). Earns the post-HoF reveal.
4. **Fold the post-game capture into the MF frame** (retire "Caged God"): after the mirror fight,
   the MF *grants* the reward ("you're ready") — unifies the post-game and gives the single
   Master Ball a thematic home.

## II.5 Updated recommendation order (this session)

1. **Flow gate** (II.3.1) — biggest clarity win, kills both reported symptoms. *(pasteur)*
2. **Extra raids → solo bosses** (II.3.2) + **villain grunt re-skin** (II.3.3). *(pasteur)*
3. **Move-curve table** (II.2) — the pacing core. *(maxwell — I draft config)*
4. **Boss simple-mode flag + heal cap** (II.3.4–5). *(pasteur/general)*
5. **Master Ball single-grant + usable-on-anything** (II.1). *(balance — quick)*
6. **Economy ×2 strong-item price** (II.1). *(balance — quick, confirm scope)*
7. **MF arc beats + NG+ awareness** (II.4). *(pasteur — content)*
8. **Retire "Caged God" naming** (II.1). *(cleanup)*

## II.6 Proposal D — Per-battle "encounter framing" contract (the clarity backbone)

**Designer intent:** every battle should be a *real* story beat, framed as a 5-part unit so the
player is never disoriented — Game-Boy-Pokémon vibe, "service to the player":

```
1. Story event        — sets the scene (why this fight exists)
2. Pre-battle dialogue — the opponent / situation speaks
3. BATTLE
4. End-battle dialogue — immediate reaction to the result
5. Aftermath event     — closes the beat AND hooks the next event/battle ("…the road bends toward X")
```

Each piece must be **real development**, not generic filler. This is the single best fix for
"why/what is happening" confusion — the player always knows where they are and what's next.

**Senior-designer refinement — tier it, don't wrap all 65 fights.** Real Pokémon games do *not*
wrap every route trainer; over-wrapping filler causes its own fatigue and dilutes the "real
development" mandate. Industry-standard framing is **tiered**:

| Battle tier | Framing | Examples |
|---|---|---|
| **Story-significant** | **Full 5-part bespoke arc** | Rival (×4), Gym Leaders, villain grunt/admin/boss, extra mini-raid/raid, Champion, Mystery Figure |
| **Filler / route** | **Lightweight**: 1 challenge line → battle → 1 defeat line (no forced event wrapper) | Basic / Ace / Gym-approach trainers |

The eligibility gate (II.3.1) is what makes this *read* clean: story beats land only on
story-significant rows, so a road trainer is obviously "just a road trainer" and a villain beat is
obviously a villain beat. The two proposals are one fix.

**Most of the data model already supports the 5-part shape** — cold-opens, pre-battle quote
priority (`getTrainerQuoteForBattle`), `LEADER/ELITE/CHAMPION_VICTORY_LINES`, and `STORY_POST_SCENES`
("Post-fight—…" aftermath auto-extracted). What's missing is (a) **completeness** (every
story-significant battle gets all 5, written as real development), (b) the **forward hook** in the
aftermath, and (c) the **eligibility gate** so they attach to the right fights. So this is mostly a
*content + wiring* job on existing rails, not a new system. *(pasteur lane — content + dispatch.)*

---

# Part III — Reconciliation with the `youthful-mendel-aTgzF` branch (merging soon)

Verified against `origin/claude/youthful-mendel-aTgzF` (strictly ahead of `main`). **Respected as
landed design — not re-litigated here:**

- **Master Ball — RESOLVED.** Branch keeps the **villain-boss Master Ball (1, from a story line)**
  and swaps the HoF first-clear second grant for a **trophy bundle** (`:46322`). Matches "one gift
  from a story line, usable on anything." §2.4 is closed; the bible's Mismatches row is marked FIXED.
- **Per-battle EV gain — NEW MECHANIC (respected).** Every trainer win trains the **whole team**:
  **REGULAR = 9 EV, BOSS = 18 EV** (3-track boss/raid beats pay BOSS via `BEAT_EV_CLASS`), targeted
  deterministically by species archetype, capped at 510. Values already include the +50% buff. This
  **partially answers §4 / the "no level-up dopamine" concern** — EVs now visibly accrue per battle
  and reinforce the weak-start→strong-end curve. **Owner: maxwell.** My move-curve proposal (II.2)
  must layer *on top of* this, not fight it.
- **"Vitamin Pack" → "EV Voucher"** rename (free-EV-preset token). Reflected in the bible.
- `SAVE_VER` 23.

**Excel bible updated** (`design/STORY_MASTER.xlsx`, re-verified vs SAVE_VER 23): added a
**"Battle EV Gain"** sheet; rewrote the **Ball Economy** Master row; marked the **Mismatches**
double-grant row **FIXED**; bumped **Save Schema** to v23.

---

# Part IV — Locked spec (the implementable core; numbers still maxwell/user-owned)

Decisions confirmed this session: **tiered encounter framing**; design locked before code (branches
merging). This part is precise enough to implement mechanically once the branch dust settles.

## IV.1 Battle-tier table (which rows get the full 5-part arc)

**Tier A — story-significant → full arc** *(event → pre-line → BATTLE → post-line → aftermath-hook)*:

| Row(s) (array idx) | Fight |
|---|---|
| 1 | Intro Rival |
| 5, 11, 17, 24, 31, 38, 46, 53 | Gym Leaders 1–8 |
| 19, 40 | Mid-run Rivals |
| 59, 60, 61, 62 | Elite Four |
| 63 | Champion |
| 64 | League Rival |
| 66 | Mystery Figure |
| *(injected)* | villain `boss` / `miniBoss` / `battle1-2`; extra `raid` / `miniRaid` |

**Tier B — filler → lightweight** *(1 challenge line → BATTLE → 1 defeat line; no event wrapper,
no beat eligibility)*: all Basic Trainers, all Gym-approach Trainers (Gym Trainer 1/2), all Ace
Trainers (the renamed "Elite Trainer" rows 34/42/48/49/55-57).

**Mapping to existing rails** (so this is wiring, not a new system):
- (1) event → a road **event beat** or **cold-open** (`STORY_COLD_OPENS` / `_resolveActiveRoadBeats`)
- (2) pre-line → `getTrainerQuoteForBattle`
- (3) battle → existing
- (4) post-line → `LEADER/ELITE/CHAMPION_VICTORY_LINES` / rival aftermath
- (5) aftermath-hook → `STORY_POST_SCENES` (already auto-extracts "Post-fight—…"); **add the forward
  hook sentence here** ("…the road bends toward the coast / the next badge / the figure in the mask").

## IV.2 Eligibility-gate rule (kills the flow confusion + the raid-mechanic leak)

A road/track beat is eligible to attach to timeline row `R` **iff** all hold:
1. `R.type === 'Battle'` **and** `R` is a **Tier-B road trainer** (Basic / Ace) — *never* a
   Gym-Trainer, Gym-Leader, or Rival row;
2. `R`'s road equals the beat's `roadAnchor`, where road is computed so a gym city's **approach
   rows do NOT inherit the previous road** (fix `_ROAD_BY_ARRAY_IDX` so the post-leader hub +
   gym-approach trainers reset to `null`/own-road, not carry `currentGym`);
3. the beat is unfired.

Tier-A fights instead receive their **own** scripted beat by row/sceneKey (no spillover). Net:
a road trainer is unmistakably a road trainer; a villain/raid beat only ever fires on its themed
encounter. **One rule fixes both "dialogue in a gym" and "raid mechanics in a gym."**

## IV.3 Arc theming (so the 3 arcs deliver, bosses stay simple)

- **Extra `raid` / `miniRaid` → SOLO Pokémon boss** (not a trainer). Add an `extra.*.raid → species`
  map (cubone→Marowak, hypno→Hypno, drifloon→Drifblim, mewtwo→Mewtwo, …); spawn via the solo-boss /
  forced-encounter path so the `BOSS_CONFIGS` HP-phase mechanics finally have a themed body.
- **Villain `battle1/2` → re-skinned grunt:** force the rolled trainer to the villain's grunt pool +
  primary type + name ("Team Rocket Grunt"), so prose matches the fight. *(Reuse the trainer roller;
  no new mechanics.)*
- **Boss gimmick tiers (LOCKED — graduated 0/2/3, not a flat on/off):** difficulty, reward, and
  gimmick count scale with the arc role. Gimmicks stay **small/basic** (a 1-turn immunity, a damage
  bump, a single heal) and **trigger off the boss's *own* Pokémon fainting**:

  | Arc role | Difficulty / reward | Gimmicks | Trigger |
  |---|---|---|---|
  | **Grunt** (`battle1/2`) | Ace-Trainer tier | **0** | — |
  | **Mini / admin** (`miniBoss` / `miniRaid`) | Gym-Leader tier | **2** | both arm after **2** of its Pokémon faint |
  | **Real boss** (`boss` / `raid`) | Gym-Leader tier | **3** | **1 active from turn 1**, +2 more after **2** of its Pokémon faint |

  This **replaces the earlier flat `STORY_SIMPLE_BOSSES` "all gimmicks off" idea** — the mechanics stay
  *simple*, but the count is now a deliberate **0 / 2 / 3** ladder keyed to arc role. (Difficulty numbers
  stay maxwell-owned; the mechanics themselves need the standard game-behavior sign-off before code.)
- **Boss item-usage cap:** in `buildFoeStoryInventoryForBattle`, cap heal/revive to **1**, used once
  with a telegraphed banner ("SECOND WIND") — a beat, not a stall.

## IV.4 Move-driven pacing curve (config-ready for maxwell)

Replace the smooth move gradient with a **legible per-region capability budget**, applied
**symmetrically to foes *and* player-obtainable builds** (so the player's own early team is weak →
the slow start is *felt*). Layers **on top of** the new EV curve (early = EV-poor + move-poor →
genuine slow start; late = EV-rich + full meta → kaizo spike).

```
STORY_MOVE_BUDGET_BY_CITY = [
  // city: { bpCap, allow: [archetypes] }    one NEW capability unlocks per region
  C0:{ bpCap:60,  allow:[STAB, status1] },                 // "Tackle & Growl"
  C1:{ bpCap:60,  allow:[STAB, status1] },
  C2:{ bpCap:75,  allow:[+coverage] },                     // spike: off-type damage
  C3:{ bpCap:90,  allow:[+setup1] },                       // spike: one boosting move
  C4:{ bpCap:100, allow:[+hazard/screen] },                // spike: team support
  C5:{ bpCap:110, allow:[+priority, +weather/terrain] },   // spike: tempo/field
  C6:{ bpCap:120, allow:[+recovery, +setup2] },            // spike: bulk wars
  C7+:{ bpCap:full, allow:[ALL] },                         // full meta
]
```

Implementation hooks that already exist: `_storyDowngradeMovesForTier` (bpCap + archetype strip),
`_storyGateFoeMovesByCity` (foe move-tag gate), and the optimization gradient. The *player* side
needs the same gate applied to professor-gift / wild / catch builds (`makeWildBuild`, gift roll) and
to the Move-Tutor "Inner Strength" pool — otherwise only foes feel the curve. **maxwell owns the
exact bpCaps / archetype lists;** I provide the table + wiring map. *Note:* the designer's earlier
"egg/learnt/transfer only" gate is the right instinct but the wrong axis — **power/archetype/count**
controls difficulty, not move *category*. This table supersedes it.

## IV.5 Resolved creative direction (locked this session)

Every open question below is now answered (user-owned design calls; the difficulty *numbers* stay
maxwell's to tune).

- **Arc cadence — LOCKED.** Villain arc = a **light 3-fight chain** (grunt → mini/admin → boss); the
  extra arc carries raid beats. A raid **inserts its own node** — it does *not* replace a route-trainer
  row. Pacing is **spread + ramped, not a fixed per-road rotation:** early cities/roads skew
  **tutorial**, then arcs **layer up and overlap** (several can develop at once) as the run advances,
  with **story bosses scaling alongside the EV/move curve** so mid/late bosses read as genuine walls.
  Arcs may share a road or not, as the pacing needs.
- **Aftermath-hook tone — LOCKED: serialized story-chaining, *not* a progression sign-post.** The
  forward hook advances the *storyline* by cause→effect, in **character voice**, **darker tone** —
  never "next: Cerulean Gym." Canonical shape: *grunt drops a letter → "I should take this to the
  professor" → next event: professor reads it, names the HQ → travel-to-HQ event → confrontation
  dialogue → battle intro ("stop, or I'll kill you" / "die trying") → outro ("you didn't find the
  leader today — next time, he finds you") → boss event.* Each beat seeds the next; the ordinary
  fights are the chain's links.
- **MF / NG+ awareness — LOCKED: escalating, loop-aware tally, wearier each cycle.** The Mystery Figure
  references prior runs with a line **keyed to run count** (the loop #N escalation), not a static haunt.
  The MF is canon **The First** — future-you, training the younger you by *losing on purpose* to outrun
  an apocalypse, who already "sounds less certain each cycle" (`main.mfReveal`, battle.html:32388). The
  escalation **deepens that exhaustion / loss of faith** as Run # climbs.
- **Arc loss handling — LOCKED: dark loss line, then win-to-progress.** Losing a *key* arc battle fires
  a creepy, character-voiced loss outro (tone intact), but the arc still gates on a win — one extra
  writing pass per beat, not a full branch.
- **Arc legibility — LOCKED: discover through play, NO tracker UI.** No case-file / journal; the story
  lives only in the beats as they fire. **Consequence:** the entire flow-legibility load now rests on the
  **aftermath-hook chaining** (IV.5) being unmistakable — every hook must make "what's next & why"
  obvious *in-fiction*, since there is no menu to check. This raises the writing bar on hooks; it does
  *not* reintroduce a tracker.
- **Loop scaling — LOCKED: same pool, reshuffled.** Every run draws the same arc library by seeded RNG;
  **no Run#-gated content** (nothing is ever "missed"). The **only** Run#-aware narrative element is The
  First's escalating weariness (above) — so the world resets *identically* each loop and only The First
  notices. **The sameness is the horror;** don't add NG+ content gates that would dilute it.
- **Difficulty feel — structure locked, numbers pending.** Gimmick ladder is set (IV.3); per-region
  move/EV stacking (IV.4) is maxwell's to confirm so "kaizo late game" lands without a mid-game wall.

## IV.6 Arc narrative model + dark-track creative charter

**Three concurrent storylines per run (LOCKED):** **main** (always) **+ 1 rolled villain arc + 1
rolled extra arc**, interleaved per IV.5's spread-and-ramp pacing.

**Serialized chaining is the connective tissue.** An arc is *not* a set of isolated fights — each
beat's aftermath-hook **seeds the next beat**, so a run reads as a single followable thread (event →
dialogue → battle → outro → next event). This is what turns "~65 battles" into "a story you walk
through," and it directly answers the maintainer's flow-confusion concern: at any moment there is a
clear *why am I fighting this* and *what comes next*.

**Dark-track creative charter (the extra arcs):**
- **Text-only** — no new visual gore; the prose carries it.
- **In-bounds:** grotesque, gore, deep, weird, creepy, raw, adult themes. The game is **+18** with no
  release constraints, so the ceiling is craft, not content policy.
- **The bar is *art, not edge*.** The goal is **thought-provoking and sarcastic/satiric** — Pokémon as
  the canvas for something grotesque-but-meaningful (the Lavender Town / Buried Alive lineage). Creepy
  *that makes you think*, never shock for shock's sake.
- **Treatment — LOCKED: satirical deconstruction.** Take the known creepypasta premise and twist it into
  commentary / subversion — *not* a faithful retelling, *not* generic mood-horror. Most original voice,
  least derivative, most "new."
- **Main-spine surface tone — LOCKED: clean, then gut-punch.** The *main* quest plays like a hopeful
  champion run with only faint unease (an odd line, a portrait that's almost yours) so The First reveal
  detonates as a true gut-punch — maximizing the iceberg payoff. (Distinct from the extra track, which is
  dark on contact.)
- Reconciles with the §1 charter: the recognizable Pokémon **surface** still frames the run; the extra
  track is the iceberg's dark water beneath it.

## IV.7 Arc capstone rewards (locked + revival of the cut EXP-Share gift)

Base arc reward = **lore/story only** (IV.5). On top of that, **two flagship capstones** — both already
have partial wiring in `_storyGrantTrackEndReward` (battle.html:42101):

- **Villain boss → Master Ball.** *Already shipped* (42105-42110). Keep as-is.
- **Extra raid → "EXP-Share gift": a 6-use distributable permanent buff.** This **revives the PR-5
  "EXP Share Voucher ×6"** that was cut (ledger **ISSUE-243**) because the game has **no per-mon level
  variable** — the original `mon.level += n` couldn't land, so the reward silently became *6 random
  vitamins* (the stand-in at 42119-42136). The maintainer's framing — *"like Fight Club +10 permanent
  stats, a late-game permanent buff"* — gives the correct, shippable implementation:
  - **6 "level-units," distributed across party/PC** with a **per-mon cap of 3 units** (≈ +3 levels'
    worth). The 3-cap means a full 6-unit spend **necessarily lands on ≥2 mons** (the maintainer's "pick
    2, not 1") — blocking a single-mon snowball. Over-cap units are **refunded**, not wasted. *(Strongest
    single outcome ≈ a "level-53," not "level-56.")*
  - Implement as a **permanent STAT layer, not a level increment** — reuse the existing **`permBoost`
    layer** (battle.html:34777, "flat +1..+10 permBoost") and the **Fight-Club persisted +stat bonus**
    (44839, "+2/stat/round, clamp +10"). This sidesteps the no-per-mon-level blocker that killed the
    original voucher. *"We already have most of the systems to handle it."*
  - **Reframes ISSUE-243** from "won't-fix / doc-only (replaced by vitamins)" to **"revive as a
    permBoost-based gift."**

**Reconciliation flags (for the next session):**
- **Not a violation of "no level grind."** It's a *bounded, earned, late-game* spike (6 units, one arc,
  like Fight Club's +10), not farmable — consistent with the §1 "earned-unlock" charter. Flagged so a
  future audit doesn't mistake it for re-opening level grinding.
- **Needs the standard game-behavior sign-off** (new mechanic) **+ a SAVE_VER bump** (new persisted
  wallet + per-mon buff field). Wallet/cap rules are **locked** (6 units, ≤3/mon, party+PC, refund over
  cap); only the **stats-per-unit magnitude** stays maxwell-owned.

## IV.8 Track treatments, voice & framing (locked)

The two secondary tracks get **different source-treatments and different voices** — the range is what
keeps a run from going one-note:

| Track | Source | Treatment | Voice |
|---|---|---|---|
| **Villain** | **Canon teams** (Rocket, Macro Cosmos, Team Star, …) | **Canon-faithful premise, dark/satiric retelling** — follow the team's *own* canon story beats, add twists + darker additions (e.g. "Team Rocket as a dark corporate"). Premises/story points track canon; the tone is ours. | **Satiric / sharp** — darkly comic; it bites. |
| **Extra** | **Creepypasta** (Lavender Town, Buried Alive, …) | **Satirical deconstruction** (IV.6) — twist / subvert the premise, *not* a faithful retell. | **Bleak / sincere** — grotesque horror, no comic relief. |

- **Satire targets (all four in scope, realized *through* the canon teams):** tech / techno-autocracy,
  influencer / clout culture, institutional rot, wellness / cult grift. Each canon team carries whichever
  fits its identity (Rocket → corporate/tech, Star → youth/cult, Macro Cosmos → corporate/institutional,
  …) — the satire is **distributed across the roster, not a single soapbox.**
- **Raid framing — LOCKED: victims / tragedies.** A solo-boss Pokémon is something **pitiable** —
  cursed, grieving, experimented-on (the Marowak-grief / Lavender lineage). The player fights something
  to *mourn*, not a monster to beat. (Reinforces why raids live in the extra/horror track.)
- **The apocalypse — LOCKED: never shown.** The First says the world ends; we **never depict it.** It
  stays a referenced absence (the warning; the Frontier's "welcome back, try not to remember too
  clearly"). Ambiguity > spectacle; reinforces the "sameness is the horror" lock (IV.5).

## IV.9 Surface characters & loop-seed calibration (locked)

- **Professor — LOCKED: morally gray, *not* evil; open to interpretation.** Stays a usable, warm-enough
  quest-hub (the letter→professor trust beat works), but is **never resolved as villain or saint** — the
  player reads their complicity/knowledge for themselves. Gray and unresolved, *not* a betrayal twist.
- **Rival — LOCKED: a tragic figure the system grinds down.** A striver who plays by the rules and loses
  anyway — the human cost of the dystopia, set against the player's looping persistence. (pasteur owns
  the canon character; this is the agreed direction.)
- **Player character — LOCKED: self-insert, minimal fixed identity.** Keep the protagonist a near-blank
  the player projects onto (own name/choices) so "you become The First" lands as personally as possible.
  The twist is about *you*.
- **Loop-seed calibration — LOCKED: deniable.** The PR-7 anomaly seeds ("Welcome Back" sticker,
  handwriting in your Pokédex, "tell The First we said hi") sit at **notice-but-rationalize** — itchy
  enough to pay off on the reveal, deniable enough to keep the surface clean. This **confirms** PR-7;
  don't escalate them into accumulating dread (the main-spine tone we set aside).

## IV.10 Arc delivery, pacing & resolution (locked)

- **Arc engagement — LOCKED: mix.** Key arc beats (grunt / admin / boss; raid beats) **auto-fire as the
  player travels** the road — no menu, unbroken chain (matches the no-tracker lock). Smaller atmosphere /
  flavor beats are **opt-in**. So every arc's *spine* is guaranteed; its *texture* is discoverable.
- **Villain arc pacing — LOCKED: spread across the run.** grunt **early-mid** → admin **mid** → boss
  **~Road 7**, so the arc breathes across the journey and its boss **scales into a late wall** (matches
  the spread+ramp pacing, IV.5). Extra-track raids likewise spread; the flagship raid lands late.
- **Extra-track source — LOCKED: lean on known lore, deconstructed.** Each extra arc starts from its
  Pokémon's famous dark reading — `cubone`/Marowak orphan-grief, `hypno` (Hypno's Lullaby), `parasect`
  (cordyceps), `mewtwo` (lab experiment), `phantump` (dead child), plus `yamask` / `mimikyu` /
  `drifloon` — then **twists / subverts** it (the IV.6 satirical-deconstruction treatment). Recognition
  + our spin.
- **Raid resolution — LOCKED: laid to rest, no catch.** Defeating a victim-raid is a **release** — the
  creature dies or moves on and the player mourns; it is **not** catchable. Pure pathos; keeps rewards
  lore-only (IV.7) and protects train-don't-catch. (The flagship extra raid still grants the EXP-Share
  gift on victory — but **handed over by a grateful NPC**, not dropped by the creature, which is never
  kept; see IV.12.)

## IV.11 Texture & voice calibration (locked)

- **Optional flavor beats — LOCKED: curated standalone vignettes.** A hand-authored pool of short,
  self-contained dark moments (a disturbing NPC, a roadside tableau, a wrong little scene) the player can
  stumble into, **independent of the rolled arcs** — deepening discover-through-play. Attach via the
  INTERRUPTS bus (never by array index, per §10/§6).
- **Villain register & humor — LOCKED: per-arc, matched to the canon source.** Don't impose one tone.
  Each team's admins/bosses take the register *and* humor level that fits **their own canon story** —
  banal-bureaucratic where that bites (corporate Rocket), charismatic or sympathetic where the canon
  team supports it. This is the IV.8 canon-faithful retelling applied to voice: **tone tracks the
  source**, it isn't uniform.
- **Beat text length — LOCKED: terse default, long when earned.** A few sharp sentences per beat for
  momentum; marquee beats (a boss, The First reveal, a raid's death) earn a longer / multi-page
  treatment.

## IV.12 Production decisions (locked)

- **MF final battle — LOCKED: a genuine hard wall.** The First fights all-out and you win because you've
  truly *grown* — the "loses to you forever" is his meta-sacrifice across loops, **not** a thrown match.
  (The prefight canon "You're going to win this one. The next one too. That's the problem." — he *knows*
  the outcome and still makes you earn it.) Difficulty *magnitude* is maxwell-owned; this locks the
  *intent*: a real late-game peak, never scripted-soft.
- **Dark / +18 content — LOCKED: always-on, no toggle.** One uncompromised vision; every run rolls its
  extra arc. No clean-mode switch, no opt-in / opt-out. "It's art; no concerns."
- **Reward assignment & delivery — LOCKED.** Two storylines, two capstones:
  - **Villain boss → Master Ball**, framed as **salvaged villain tech** (recovered directly from the
    defeated HQ — the shipped "among the spoils" line already lands this; *no code reassignment*).
  - **Extra raid → the EXP-Share gift**, delivered by a **grateful NPC as a thank-you** *after* the
    victim is laid to rest — explicitly **not** dropped by the creature (a victim isn't a loot piñata).
    In-fiction = a dead trainer's own EXP-Share, passed on ("use it better than they did").
- **Build process — LOCKED: plan here → hand off a build pack.** Design is frozen in this doc; execution
  goes to a fresh session via a build-prompt MD (`DARK_STORY_BUILD_HANDOFF.md`) + workbook sheets
  (`design/MASTER_11_dark_story_decisions.csv`, `design/MASTER_12_dark_story_build.csv`), built
  **vertical-slice-first** (one villain arc end-to-end before scaling to all 18). Sign-off gates +
  pasteur/maxwell hand-offs are enumerated in the build pack.
