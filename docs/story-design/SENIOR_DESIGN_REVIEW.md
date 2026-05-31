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
