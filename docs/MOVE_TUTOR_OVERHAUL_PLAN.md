# Move Tutor Overhaul — Investigation + Implementation Plan

> Status: **PLAN — awaiting maintainer sign-off on the decision points in §8.**
> Produced 2026-07-03 from a five-track deep investigation (staging/parity ·
> recommender · filters · UI/UX · edge-cases/saves). Every claim below was
> verified against code with line anchors. Implementation target: **one PR** on
> `claude/move-tutor-overhaul-81mlyr`, sequenced per §9.

---

## 1. How the system actually works today (verified baseline)

One Move Tutor facility (mode `'moves'` of the shared tutor screen, alongside
Dojo `'loadout'` and Nature Rater `'nature'`), staged **by city, never badges**:

| Stage | Cities | Move category allowed | Per-CITY BP cap (separate axis) |
|---|---|---|---|
| 0 Inner Strength | C0–C2 | Natural only (level-up + egg + transfer) | C0=40 · C1/C2=60 |
| 1 Unleashed | C3–C5 | **still Natural only** | C3/C4=80 · C5+=∞ |
| 2 Guru | C6+ | + Learnt (TM/HM/Tutor/TR/event) + Awakened (off-legal Smogon) | ∞ |

- Ladder: `NPC_STAGE_CITY.tutor = [0,3,6]` (`battle.html:65950`); stage derived
  live from `sm.eventIndex` (`_npcStage` :65968) — **never persisted**. Only
  `sm.npcStageSeen.tutor` (gift/intro high-water mark) is saved.
- Status / 0-BP moves always pass the BP axis (`:55653`, `:66688`) — the
  "status moves early" behavior is by design and stays.
- Prices are per move **tag**, not stage: Natural 1,000 / Learnt 2,500 /
  Awakened 5,000 (`_moveCostForStage` :65911). Heart Scale = cost waiver only,
  never a gate bypass (test-locked). Forgetting is free.
- Pool source of truth: `data/move-tags.json` (offline index, 1379+ species) →
  live `@pkmn/dex` fallback → Smogon `csvBuilds` (Awakened = CSV moves in no
  learnset bucket). Pre-evo learnsets are unioned; evolved learnsets are not
  (correct direction).
- **Foe/encounter parity is architectural**: story trainers gate through ONE
  chokepoint (`_storyGateFoeMovesByCity` :55681, called :57513), wild/Safari/
  roaming/Crucible-wild through ONE chokepoint (`enterCatchEncounter` :60628 →
  `_storyFilterBuildMovesForCity` :55708), plus a both-sides battle-time BP
  clamp (`_storyBattleBpCap` :27236). All gates guard on `sm.active`, so Quick
  Play/Gauntlet are untouched by design.
- **The overhaul invariant** (from `docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md` §2):
  edit shared definitions only; never introduce a player-only override.

Current save version is **28**; builds are deliberately never re-validated on
load (v28 comment :42437) — equipped moves always stay selectable
(`:66711–66713`). That invariant is what keeps old saves safe and **must be
preserved**.

---

## 2. Confirmed bugs (the "broken" list, ranked)

### BUG-1 — Filters: search fast-path ignores active filters ("the filters are broken")
The only genuinely broken filter interaction, reproduced live in jsdom.
Chip/sort changes take `_txMoveGridFastUpdate`, which keeps filtered-out cards
in the DOM as `[hidden]` (:69686). Typing in search then takes
`_txSearchFastUpdate` (:68301–68368) whose predicate is **search-only**
(:68329–68333) — it unhides any card matching the text, ignoring
`filter.moveTypes/moveCats`; the healing full render is skipped (:68393).
Worst case: **clearing the search unhides the entire grid while the filter
pill still shows active**. Repro: Garchomp, type filter "Normal" (6 cards) →
type "a" → 19 cards across 8 types; Status chip → type "e" → Earthquake/Stone
Edge visible under an active Status filter.
All 15 existing filter tests pass because they exercise controls in isolation
via the full-render path — composition of the two fast paths is untested.

### BUG-2 — Recommender counts doubles/VGC builds (the 1v1-singles mismatch)
`data/builds.csv` is 91% singles (15,787 vs 1,610 doubles rows) and every
build row carries `_category` (:11805–11806). Team **rolls** already filter
doubles by default (`allowDoublesBuilds:false` :12957, filter :12976–12981) so
"Tailwind / Follow Me roles don't pollute singles encounters" — but the
recommender's usage accumulator `_txAccumulateBuilds` (:66896–66950) has **no
`_category` check**. Doubles-staple species (Incineroar, Amoonguss, Torkoal…)
get Fake Out / Follow Me / Rage Powder / Trick Room sets inflating their
"recommended" moves; some of those moves literally fail in singles
(:25702–25712).

### BUG-3 — Professor gift paths: vestigial bypass + design residue (downgraded)
**Current design (confirmed in code): there is ONE Professor, at C0, who hands
out only the starter** — `shouldForceCityProfessor` (:38992) forces a visit
only for the C8 post-Gym-8 Mystery legendary gate; comments at :38734, :40001,
:50634, :50910 all state the Professor never recruits partners in later
cities. So the originally-flagged "C0–C5 gift bypass" is not reachable in the
shipped flow. What remains:
- The full-party swap/send-to-PC gift paths (`_mysteryDoSwap` :54095,
  `_mysterySendToPc` :54126) skip `_storyFilterBuildMovesForCity` — today
  reachable only at the C8 legendary (Guru → gate is a no-op), i.e. a
  **defense-in-depth gap**, not a live leak. Filter at gift-build creation
  anyway so any future gift path inherits the gate.
- **Old-design residue to remove** (maintainer directive): vestigial
  later-city professor-gift machinery and copy — the C1+ rows of the gift
  grade-mix table (:38733–38743, already commented "vestigial"), any
  remaining later-city professor gift affordances/copy, and doc language
  implying recurring professors (e.g. `PROGRESSION_CURVE_MASTER.md` row 6
  "No Professor (slot filled next city)"). Keep only: C0 starter pick + C8
  legendary gate.
- **C0 starter rule, formalized as "city cap + 20"**: today the starter is
  *fully exempt* from the pool filter (:55710) — it can hold any-category
  moves — with only a battle-time 60-BP clamp floor
  (`STORY_STARTER_BP_CAP_FLOOR` :55557, = C0 cap 40 + 20). Proposal (§8-Q9):
  keep the intended slight advantage but make it principled — the starter/C0
  gift passes the same Natural-category filter as everything else, with a BP
  allowance of **city cap + 20** (so 60 at C0), replacing the blanket
  exemption. Battle clamp floor stays as the safety net.

### BUG-4 — Evolution mints pre-Guru Learnt/Awakened moves
`_evoLabApplyEvolution` backfills empty slots from a fresh Smogon `makeBuild`
set and validates kept moves against the **full merged pool**
(`_tutorGetMergedMovePoolAsync` :63896–63920) with no stage/tag/BP filter.
Evolving at C2–C5 (Evolab opens C2) grants moves the tutor would refuse.

### BUG-5 — Crucible gym rematches get early-city movesets
Post-HoF `crucibleGymPick` re-enters the original gym row (:59543); the foe
gate keys on the row's city (:55684), so a GL1–GL5 rematch is re-capped to
Inner/Unleashed + 40–80 BP **while** `_storyBuildTierForEvent` forces T4 "so
rematches stay sharp" (:44656). The two intents conflict; post-game ladder
foes fight with C0-era moves.

### BUG-6 — Missing filter pills break the "always visible" invariant
`_txActiveFilterCount` counts tier selections (:68700) but
`_txActiveFiltersHtml` renders **no pill for the Stage/tier filter and none at
all for abilities** (:68796–68829), contradicting the stated invariant at
:66737. With the sheet collapsed on phone, an active Stage filter reads
"Filters (1)" with no visible/removable pill → "list is mysteriously short".

### BUG-7 — Cold-cache fall-open with no scheduled heal
When a species has empty learnset buckets, `_tutorGetStagedMovePoolAsync`
deliberately serves the FULL pool (:66670) and the acceptance set is seeded
from it (:70260–70267); the comment says "re-renders once warm" but nothing
schedules that re-render. Unknown-tag moves then price at the stage ceiling
via a fallthrough with a dead second branch (:66618–66623). Only
`data/move-tags.json` coverage keeps this theoretical today. (The
fetch-**error** path correctly fails safe.)

### Perf/UX defects (not correctness)
- **P-1** Accordion/pill toggles call `renderTutorTeam()` without `skipFetch`
  (:68422, :68440, :68482) → every open/close clears caches and re-awaits the
  staged pool per team member; no generation token guards overlapping renders;
  locked cards flicker unlocked during the window (teach path still fails
  safe).
- **P-2** Desktop `.tx-grid` scroll resets to top on every card pick (full
  innerHTML rebuild; switcher scroll + search caret are preserved, grid scroll
  is not) — same family as ledger ISSUE-011.
- **P-3** "★ Show all" renders the full legal movepool (150–250 cards ×8 nodes)
  in one pass, per open mon — heavy on low-end phones.
- **P-4** Sequential-teach slot hazard: after a teach, `_txState.moveSlot` is
  unchanged, so tapping the next suggestion **overwrites the move you just
  paid for** (:68560).

---

## 3. Recommender — why it "sometimes works, sometimes fails"

Two parallel scorers that don't share logic:

- **Path 1 — grid "Best for this mon" sort** (`_txScoreMove` :67554 →
  `_txMoveHeuristic` :67523): `pow × STAB(1.5) × acc`, matching-category boost
  ≤×1.5, +15 priority; status = fixed table (recovery 90 > boost 85 > hazards
  80 > support 70 > **everything else 30**). Blended with gen-weighted Smogon
  usage (`_txBlend` :67514: 65/35 pop/heur with species data).
- **Path 2 — "✨ Suggest a balanced set" panel** (`_txMoveRecsByPurpose`
  :67766–67865) ignores Path 1: ranks damaging moves **by usage; category only
  breaks ties** (:67787–67792); composition dual-type→2 STAB+1 coverage+flex;
  flex = status only if its usage beats the next damaging move.

Verified failure modes:

| # | Failure | Root cause |
|---|---|---|
| R1 | Special move suggested for physical attacker (and vice versa) | usage-first, category tie-break only (:67787) |
| R2 | Grid sort ranks high-BP wrong-category above right-category | heuristic only *boosts* matching category, never penalizes (:67535) |
| R3 | Doubles-only support moves recommended | BUG-2 |
| R4 | Panel silently absent for early/oddball mons | sparse suppression: <10 builds in evo chain → no panel (:67313, :69813) |
| R5 | Zero-usage mons never get status moves suggested | flex tie goes to damage (:67857) |
| R6 | 40-BP filler STAB forced over premium coverage at Inner | dual-STAB forced whenever both types have any damaging move (:67825) |
| R7 | "Coverage" = distinct type only, no type-chart value (:67835) | Normal-type "coverage" counts same as Ice on a Ground/Dragon killer |
| R8 | No ability awareness (Technician/Huge Power/-ate/Sheer Force) | neither scorer reads `mon.ability` |
| R9 | Category preference flips with -Atk nature | moves use built stats (:67772) while item recs use base stats (:67877) |
| R10 | Long-game 6v6 tools (hazards/pivot/Toxic-stall) overweighted for short story fights | raw OU-style usage, no format-fit layer |

Good news already in place: recs are fully deterministic (alphabetical final
tie-breaks, zero RNG), locked-move recommendation is fixed and test-locked,
equipped picks show as "✓ Equipped" (stability fix), and the recs candidate
pool already respects staging.

**There is no quick-apply today** — `story-tutor-fastpath.test.js` is a render
fast path, not an apply feature. Teaching is strictly one move at a time
(pick → sticky confirm bar → modal → gold).

---

## 4. UI/UX — responsive audit summary

The active `.tx-*` layer is mature (sticky pill bar, filter sheet, keyed
fast-paths) but has concrete gaps:

| # | Gap | Who it hits |
|---|---|---|
| U1 | 44px touch bumps keyed to `max-width:768 AND portrait` (:7264); landscape block actively shrinks chips to 36px (:1166); base chips ~26px | landscape phones, **all tablets** |
| U2 | Hover/`title`-only info (lock pills, tier badges, stage stripes, "sorted by usage", voucher note) unreachable on touch — tooltip fns gate on fine-pointer (:16160); a tap-tooltip variant `showMoveTooltipTap` (:16457) exists but is never wired to tutor surfaces (ledger ISSUE-058) | all touch devices, keyboard users |
| U3 | Card description clamps to 3 lines/2 on phone with a CSS comment promising "full text in confirm preview" — but the confirm bar doesn't show the description (:69324) | phones |
| U4 | Grid scroll reset + focus destroyed on every interaction (only search caret/switcher scroll restored :70283–70330) | desktop + keyboard |
| U5 | ~11 ad-hoc width breakpoints (340…900px) vs the battle screen's single container-query system; desktop runs in a 1280×720 scaled frame so `vw` caps drift (:154, :744) | maintainability |
| U6 | Sub-10px absolute px sizes in Press Start 2P (8/8.5/9/9.5px at :7512, :1727, :1030, :2101…); viewport pins `user-scalable=no` → not zoomable | small screens, accessibility |
| U7 | ~30 hardcoded one-off greys bypass `--text-muted/--text-dim` tokens; a few gold-on-dark values near the 4.5:1 line at tiny sizes | consistency/AA |
| U8 | ARIA: switcher + chip strip are `role="tablist"` with plain buttons (invalid composite) (:69553, :68779); lowercase region label (ISSUE-097) | screen readers |
| U9 | ~200–216px of sticky chrome on a 667px phone viewport (header + switcher + confirm bar + footer); footer "Back to City" duplicates the header ← | phones |
| U10 | Dead legacy layer: `.story-tutor-move-picker/-select/-filter/-apply` CSS (:815–857, :2143–2156) + `_tutorRefreshMoveDetailRow` (:66247) have no markup producer | dead weight |

---

## 5. Data / doc / copy drift (safe cleanups)

- `TUTOR_COST_MOVE = 1500` (:65899) is dead — never read. Heart Scale lexicon
  copy (:64389) still claims "1,500G" and "Earned from Gym Leaders" — both
  false (real sources: stage-up gifts, first-tutor tutorial, casino).
- `design/MASTER_09_tutor_dojo.csv` claims "All values VERIFIED MATCH code"
  but has the old ladder (tutor `[0,4,7]`, 3-tier dojo `[2,5,8]`, Learnt at
  L2). `docs/dojo-dex/README.md` tier table has the same stale model.
- `docs/PROGRESSION_CURVE_MASTER.md` header says variable-power moves are
  clamp-exempt; code ships `_STORY_VARPOW_CLAMP_EXEMPT = new Set([])` (:24788)
  and the clamp test asserts they ARE clamped.
- Stale in-code comments describing the old stage model at :45199, :55526,
  :70416.
- **Recurring-professor residue** (old design; current design = one Professor
  at C0, all later teammates from the wild): vestigial C1+ gift grade-mix
  rows (:38743), `PROGRESSION_CURVE_MASTER.md` "No Professor (slot filled
  next city)"-style row notes, and any later-city professor gift copy.
- `docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md`:9 says Eviolite→tier 1; the shipped
  test asserts tier 2.

---

## 6. Edge cases — options and recommended handling

Already **handled well** (verified, keep as-is): <4 moves/append, 4-move
replace, duplicate teach (silent no-op), second Hidden Power guard, pre-evo
learnset union, unlearn-to-0 blocked, insufficient gold, shown-vs-charged
price parity, locked-confirm, double-click re-entrancy locks, wild catch above
cap, stage regression impossible in-run, Quick Play/Gauntlet isolation.

Open ones, with options → recommendation:

| Case | Options | Recommended |
|---|---|---|
| **Gift-path bypass (BUG-3, vestigial)** | (a) filter in swap/PC paths; (b) filter at gift-build time + delete vestigial later-city gift machinery | **(b)** — filter once where the gift build is created (all exit paths inherit it; harmless at the C8 legendary since Guru is ungated), and remove the old recurring-professor residue per current design |
| **Starter/C0-gift exemption** | (a) keep blanket exemption + 60 clamp; (b) same category filter as everything, BP = city cap + 20 | **(b)** — the player keeps the intended head start (+20 BP) but can't spawn with off-category moves; clamp floor stays (§8-Q9) |
| **Evolution move leak (BUG-4)** | (a) treat as intended "evolution reward"; (b) gate backfill+validation to the current city's staged pool; (c) gate only the backfill, keep old moves | **(c)** — backfill from the staged pool (same filter as wild catches); *kept* moves stay untouched (equipped-passthrough invariant protects old saves). (a) is defensible but undermines the curve the overhaul exists to create → maintainer call, §8-Q3 |
| **Crucible rematch re-cap (BUG-5)** | (a) leave (historical replay flavor); (b) exempt post-HoF Crucible from the city gate (effective city = max(rowCity, C6)) | **(b)** — Crucible is the post-game challenge ladder; T4 builds with 40-BP moves is an accident, not flavor. §8-Q4 |
| **Cold-cache fall-open (BUG-7)** | (a) fail-closed to Natural-only; (b) keep fall-open but schedule the promised re-render + add a coverage test for move-tags.json | **(b)** — fail-closed would brick barren species; the fallback is deliberate, it just never heals. Add `_pbsInvalidateTxMeta`-style re-render hook + a build-time coverage assertion |
| **Regional forms union base-form learnset (over-offer)** | (a) accept (coarse but generous); (b) per-form learnset resolution | **(a) accept + document** — @pkmn/dex form handling is the long-term fix; low harm (over-offer, never under-offer), not worth PR risk |
| **`npcStageSeen.tutor` desync if ladder changes** | (a) no migration (stage-up gifts swallowed/duplicated); (b) `migrateStoryPreV29` resync per the v28 dojo precedent (:42441) | **(b)**, and explicitly decide whether the catch-up loop's Heart-Scale gifts should fire for mid-run saves (§8-Q5). **Only needed if §8-Q2 changes the ladder** |
| **Sequential-teach overwrite (P-4)** | (a) auto-advance `moveSlot` to next empty/non-recommended slot after teach; (b) clear pending slot and force re-pick | **(a)** — also what bulk-apply needs internally |
| **Sparse-species rec absence (R4)** | (a) keep suppression; (b) heuristic-only panel with a "based on stats" caption | **(b)** — the #1 "sometimes it just isn't there" complaint; deterministic, no data needed |
| **Bulk-apply mid-flow failures** (gold drops below sum, pool changes) | — | precheck sum + acceptSet per pick at confirm time inside the existing interaction lock; apply is all-or-nothing (validate all, then commit all) so a mid-list failure can't half-apply |

---

## 7. The plan — seven workstreams (one PR)

### WS-A · Filter & list correctness — *behavior-preserving bugfixes*
1. `_txSearchFastUpdate`: apply the full `_txApplyMoveFilters` predicate (or
   bail to full render when `_txActiveFilterCount(kind) > 0`); keep the
   count-pill/empty-state updates consistent. **(BUG-1)**
2. Add Stage/tier pills (+ abilities-kind pills) to `_txActiveFiltersHtml`;
   fix `showSort` to reflect the tier-bypass state. **(BUG-6)**
3. Pass `skipFetch` on accordion/pill toggles; add a render-generation token
   so a stale async render can't overwrite a newer one; kill the
   locked-cards-flicker window. **(P-1)**
4. Preserve `.tx-grid` scrollTop and re-focus the picked card across
   `renderTutorTeam` (extend the existing preservation block :70283–70320).
   **(P-2, U4)**
5. New tests: fast-path composition matrix (chip→search→clear-search,
   quick-chip→search), tier-pill presence, scroll/focus preservation, render
   generation (promote the repro scripts already written in scratchpad).

### WS-B · Gate integrity (player/foe parity) — *needs sign-off (game behavior)*
1. Gift builds: apply `_storyFilterBuildMovesForCity` at build creation so
   append/swap/PC paths all inherit it; formalize the starter/C0-gift rule as
   "same filter, BP cap = city cap + 20" (replaces the blanket exemption,
   keeps the 60-BP clamp floor); delete vestigial later-city professor-gift
   machinery + copy (one Professor at C0; C8 legendary gate is the only other
   professor-screen entry). **(BUG-3, §8-Q9)**
2. Evolution: backfill from the **staged** pool instead of the full merged
   pool; kept moves untouched. **(BUG-4, per §8-Q3)**
3. Crucible: effective gate city = `max(rowCity, GURU_CITY)` for crucible
   re-entries. **(BUG-5, per §8-Q4)**
4. Cold-cache: schedule the warm re-render; add a move-tags coverage test.
   **(BUG-7)**
5. New tests: gift-swap/PC gating, evolution backfill staging, crucible
   rematch pool, extend `story-enemy-move-gate.test.js`.
6. Guard: a parity test asserting every moveset-construction path routes
   through one of the two chokepoints (grep-based inventory assertion), so
   the next new path can't silently skip the gate.

### WS-C · Recommender quality — *needs sign-off (scoring = game behavior)*
1. **Singles filter**: skip `b._category === 'doubles'` rows in
   `_txAccumulateBuilds` (mirror of the roll-side filter; respects
   `allowDoublesBuilds` if the maintainer prefers symmetry). **(R3/BUG-2)**
2. **Category fit as a weight, not a tie-break**: `score = usage ×
   categoryFit` where fit derives from the Atk/SpA gap using **base stats**
   (consistent with item recs; fixes R1/R2/R9). Wrong-category penalty in
   `_txMoveHeuristic` too.
3. **Ability synergy table** (small, data-driven per CLAUDE.md: JSON under
   `data/`): Technician (≤60 BP bonus), Huge/Pure Power (force physical),
   -ate abilities (Normal moves re-typed), Sheer Force (flagged moves).
   **(R8)**
4. **Sparse fallback**: heuristic-driven panel with caption instead of
   suppression. **(R4)**
5. **Status-move path for zero-usage mons**: flex slot may take a
   heuristic-scored status move (recovery/boost first) when usage data is
   absent. **(R5)**
6. **Coverage scoring**: prefer coverage types that are super-effective vs
   the mon's worst matchups / not resisted alongside existing STAB, using
   `window.typeChart` (fixes R6/R7 — dual-STAB becomes preferred, not
   forced, when the second STAB is a 40-BP filler).
7. **Optional (Q6): short-battle fit** — mild down-weight for hazards/phaze/
   pivot/stall tags vs raw damage/setup, reflecting short 1v1-singles story
   fights vs 6v6 Smogon meta. Ships behind a single tunable constant table
   (maintainer-owned numbers).
8. Determinism preserved (no RNG); extend `story-tutor-rec-stability` +
   `story-tutor-move-suggest` with fixtures for each failure mode above
   (physical Garchomp must not get special picks; Incineroar must not get
   Fake Out/Follow Me pre-data-filter; sparse mon gets a panel).

### WS-D · Quick-apply moveset (the QoL headline) — *needs sign-off (gold flow)*
On the ✨ Suggest panel: **"Apply this set — N changes · X G"**.
1. Diff current moves vs suggested four; fill empty slots first, replace
   non-suggested moves, never touch already-suggested equipped moves.
2. Aggregate per-tag pricing with itemized confirm (one modal listing
   `move → price` rows + total; amber rows for anything locked = excluded).
3. All-or-nothing commit inside `_storyTryBeginInteraction`; per-pick
   acceptSet check + gold-sum precheck at confirm time; single save + single
   `renderTutorTeam` at the end.
4. Voucher line: "1 Heart Scale can cover the priciest move" (waiver applies
   to the most expensive eligible pick; never a gate bypass).
5. Auto-advance `moveSlot` after single teaches too. **(P-4)**
6. Implementation: extract a confirm-less core from `tutorChangeMove`
   (:70415) reused by single + bulk paths, so pricing/gating stays defined
   once (kills the four-way hand-mirroring risk).
7. New tests: bulk pricing sum, locked-pick exclusion, all-or-nothing on
   insufficient gold, voucher application, slot-fill order, save integrity.

### WS-E · Responsive UI/UX — *mostly behavior-preserving; visual diffs for review*
1. Re-key touch-target bumps to `(hover:none) and (pointer:coarse)` (pattern
   already at :797) instead of width+portrait; ensure ≥44px on chips, sort
   select, filters toggle; remove the landscape shrink. **(U1)**
2. Wire `showMoveTooltipTap` (coarse-pointer branch) into `title`-bearing
   tutor elements: lock pills, tier badges, stage stripes, sort-locked label,
   voucher note. Dents ledger ISSUE-058. **(U2)**
3. Show the full move description in the confirm bar (it's the promised
   overflow home for clamped card text). **(U3)**
4. ARIA: `role="tablist"` → `role="group"` + `aria-label` on switcher/chip
   strip; proper region label capitalization. **(U8)**
5. Typography/spacing pass: raise sub-10px sizes to the pixel-font-legible
   ramp, swap one-off greys to `--text-muted/--text-dim`, keep px units (app
   convention) but consolidate tutor breakpoints toward the existing ramp;
   verify the two duplicate quote-hiding blocks and drop the dead one. **(U5–U7)**
6. Phone chrome: un-stick the footer bar on the tutor screen (header ← makes
   it redundant); reclaims ~44px. **(U9)** *(visual change — flagged for
   review screenshots)*
7. Screenshot verification via `scripts/debug/story-screenshots.mjs`
   (`tutor-moves` shot id exists) at 360×640, 390×844 landscape, 834×1112,
   1280×720 before/after.
8. **Not in scope**: grid virtualization (P-3) — memo caches keep it
   acceptable; revisit only if the phone screenshots show jank.

### WS-F · Dead code & copy cleanup — *no sign-off needed (grep-verified 1:1)*
1. Delete dead legacy layer: `.story-tutor-move-picker/-select/-filter/-apply`
   CSS + desktop grid rule + `_tutorRefreshMoveDetailRow`. **(U10)**
2. Delete `TUTOR_COST_MOVE`; fix Heart Scale lexicon copy (price + sources).
3. Fix stale stage-model comments (:45199, :55526, :70416).
4. Update `design/MASTER_09_tutor_dojo.csv`, `docs/dojo-dex/README.md` tier
   table, `PROGRESSION_CURVE_MASTER.md` clamp-exemption line,
   `DOJO_TUTOR_RECOMMENDER_DESIGN.md` Eviolite note.

### WS-G · Saves & migration — *conditional*
- If §8-Q2 keeps the `[0,3,6]` ladder: **no migration, no SAVE_VER bump.**
  All other changes are read-live (prices, scoring, UI) or additive.
- If the ladder/tier count changes: `SAVE_VER → 29` +
  `migrateStoryPreV29` resyncing `sm.npcStageSeen.tutor` (copy the v28 dojo
  precedent :42441–42446, derive — don't hard-code — per ISSUE-109 lesson),
  with an explicit decision on catch-up Heart-Scale gifts (§8-Q5).
- Invariant kept everywhere: **no retroactive re-validation of equipped
  moves** on load; over-cap leaks remain guarded by the battle-time clamp.

---

## 8. Decision points needing maintainer sign-off

| # | Question | Options | My recommendation |
|---|---|---|---|
| Q1 | Recommender scoring changes (WS-C 1–6) | approve / trim | Approve all six; they fix verified failure modes and stay deterministic |
| Q2 | **Power curve: keep the 3-stage ladder `[0,3,6]` as-is?** Today the Unleashed step is only a BP-cap bump (no new category) — the mid-game "new toys" moment is thin | (a) keep as-is (zero save risk); (b) Unleashed additionally unlocks **Learnt status/utility moves** (Toxic, Will-O-Wisp, hazards…) at C3, full Learnt at Guru — a real mid-game build unlock without raw-damage inflation, foes follow automatically; (c) move Guru to C5 | **(b)** — best fit for "increasing power curve to unlock new moves and better builds"; costs a small gate change + tests; still no migration (ladder cities unchanged). (c) not recommended — flattens the late curve |
| Q3 | Evolution backfill: gate to staged pool? | gate / keep as "evolution reward" | **Gate** (WS-B-2); the leak undermines the curve and foe parity |
| Q4 | Crucible rematches: ungate to Guru? | ungate / keep historical caps | **Ungate** (WS-B-3) |
| Q5 | If Q2=(b) is taken with a new tier boundary meaning `npcStageSeen` semantics shift: should catch-up stage gifts fire for mid-run saves? | fire / suppress | **Suppress** (migration marks seen) — avoids free Heart Scale showers on load |
| Q6 | Short-battle usage adjustment (WS-C-7) | ship / defer | **Ship behind a tunable table** with neutral-ish defaults you can tune; it's the principled answer to the 6v6-vs-story-fights mismatch |
| Q7 | Phone footer un-stick (WS-E-6) | yes / no | Yes — biggest single space win on phones |
| Q8 | Doubles builds in recs: hard-skip or honor `allowDoublesBuilds`? | hard-skip / follow setting | **Follow the setting** (default off) — symmetric with rolls, zero new concepts |
| Q9 | Starter/C0 gift: replace the blanket pool-filter exemption with "same Natural filter, BP ≤ city cap + 20" (60 at C0)? | replace / keep exemption | **Replace** — matches the maintainer's stated intent ("slight advantage, like +20"), closes the last unprincipled gate hole; existing saves unaffected (equipped moves never re-validated) |

## 9. PR sequencing (single PR, reviewable commits)

1. WS-F dead-code/copy cleanup (pure deletions — shrinks every later diff)
2. WS-A filter correctness + tests
3. WS-B gate integrity + parity guard test
4. WS-C recommender (data filter → scoring → sparse fallback), fixture tests
5. WS-D quick-apply (extracted core first, then UI)
6. WS-E responsive pass + before/after screenshots
7. WS-G migration (only if Q2 requires) + docs refresh
8. Full suite run (`node --test`), story screenshot sweep, ledger findings
   filed for anything intentionally deferred (P-3 virtualization, per-form
   learnsets)

**Existing suites that must stay green:** story-tutor-staged-pool ·
story-enemy-move-gate · story-move-ceiling · story-move-bp-clamp ·
story-wild-catch-movecap · story-tutor-heartscale · story-tutor-move-price ·
story-tutor-locked-confirm · story-tutor-confirm-sticky ·
story-tutor-recs-panel · story-tutor-move-suggest · story-tutor-rec-stability
· story-tutor-suggest-staging · story-tutor-stage-filter · story-tutor-chips ·
story-tutor-sort · story-tutor-show-all-locks · story-tutor-fastpath ·
story-tutor-card-snapshot · hidden-power-mentor · story-dojo-item-recs ·
story-staged-npc.

## 10. Risk register

| Risk | Mitigation |
|---|---|
| Save corruption | No schema change unless Q2 alters ladder semantics; invariant "never re-validate equipped moves" preserved; migration follows v28 precedent |
| Player/foe drift | All gate edits go through the two shared chokepoints + shared classifiers only; new parity guard test |
| Four-way price/gate hand-mirroring (pool ↔ confirm bar ↔ gold path ↔ voucher path) | WS-D-6 extracts one shared core; tests lock each surface |
| Hidden Power coupling (stripped + injected + pinned 'learnt' in two spots each) | No pool-shape rewrite; hidden-power-mentor suite guards |
| Scoring regressions | Deterministic fixtures per failure mode; balance constants isolated in one maintainer-owned table |
| Visual regressions | Screenshot sweep at 4 form factors before/after |
