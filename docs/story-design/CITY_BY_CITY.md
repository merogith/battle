# Story Mode — City-by-City Design & Early-Game Patch

Patch branch `claude/early-game-pacing-patch` (on top of #42 / PR #163). Goal: the
instruments are good but **poorly placed** — fix placement, pacing, and clarity.
Enemy power curve is fine; do **not** touch enemy stats here.

---

## A. Cross-cutting fixes (apply everywhere)

| # | Fix | Root cause (verified) | Action |
|---|---|---|---|
| 1 | **Professor offers only basics** | Cap is applied in the pick loop (battle.html:41033) but the grade-weight+cap dance skews/falls-back; G3 pool is mostly first-evos that fail the stage-0 cap → fallback (41035) can leak a non-basic | Rebuild the C0/C1 professor pool **explicitly**: stage-0 (unevolved) only, **equal G3/G4**, non-legendary. Cap professor to **≤ stage-1 always** (never Stage 2, any city). |
| 2 | **Wild = base forms only, always** | `_storyEvoStageCapForCity` rises (C6+ → stage-2) and is shared with wilds | Give wilds a **dedicated stage-0-only** cap (independent of the rising enemy/player cap). |
| 3 | **Facility NEW/visited state** | `_withNew` (39163) + `_markFacilitySeen` *look* correct (mart/tutor mark via computed keys); needs live re-verification — likely the build under test predates the fix, or a render-refresh gap | Build a **reliable behavioral test** (render C0 → visit mart → render C2, assert no NEW) and fix whatever it surfaces. |
| 4 | **Tutors always available** | City 1's action list literally omits them: `City1 = ['Professor','Pokemart','Gym Battle']` | Splice **Move Tutor + Nature Rater into every city** (like Fan Club is spliced), staged in *capability* not existence. |
| 5 | **IV system** (not corrupted, 3 spec gaps) | wild flat 0–31 (44606); enemy bands too wide (T3=18–28); special rolls random (41068) | Wild: **rising cap** by badges. Enemy: **rising mean ± small jitter**. Special/legendary: **always 31**. Player: random (keep). |
| 6 | **Menu order** (every city) | `_emit` order | **must-required (top) → Party → Poké Center → Train (tutors) → Shops → Link/Bag/Artifacts (bottom).** Rare/one-time sits high. Train stays above Shops. |
| 7 | **Required first-time intros** | only some facilities gate | Bag, Party, Fan Club **+ every first-time element** get a one-time intro → then visited/unvisited → later a renamed staged revisit. |
| 8 | **Egg hatch animation** | text-only reveal today | Add a minimal hatch animation (egg wiggle → crack → sprite pop), in the spirit of the catch/evolution anims. |

## B. Staged-NPC capability ladders (naming locked to "same base name + changing tag")

- **Evolution Sage** — *Awakening* (Stage-1 evos) → *Stones* → *Ascension* (Stage-2 evos). **3 layers, staged across cities (see §C).**
- **Battle Dojo** — *White Belt* (abilities) → *Black Belt* (Hidden) → *Grandmaster* (Awakened). *(confirm if already implemented)*
- **Move Tutor** — *Heart Scale* (egg + learnable moves) → *TM Expert* (TMs/HMs/all). Pricing: 1,500 → 2,500.
- **Items** — *Poké Mart* (Lv1: berries/basics, 500) → *Super Mart* (decent, 1,000) → *Department Store* (Lv2: best/all, 2,500). Mart & Dept cycle; Dept anchors important cities (C6/C8/League).
- Each new stage = revisit + fresh intro + **1 free use**. Nature Rater & EV Trainer: **no staging**.

## C. Per-city table (current → target)

| City | Current facilities | Target changes |
|---|---|---|
| **C0 starter** | Professor, Mart, Move Tutor, Nature Rater, Center, Relic Annex, (Artifact Hall #42), Party, Bag | Professor → **stage-0 basics, equal G3/G4**. **Artifact Hall mandatory intro, relics default OFF + guidance** (re-verify it lands). Bag/Party/Fan-Club intros. Menu order. |
| **C1 gym 1** | Professor, Mart, Gym | **+ Move Tutor + Nature Rater** (fix). **+ Evolution Sage L1 — Stage-1 evos** (move earlier; today evo debuts C2). |
| **C2 gym 2** | Link, Evo Tutor, Stone Shop, Mart, Move Tutor, Gym, (Daycare #42) | **Evolution Sage L2 — Stones** lands here. + Nature Rater (splice). |
| **C3 gym 3** | + Nature Rater | (tutors already; ensure staged tags) |
| **C4 gym 4** | + Safari, Battle Dojo, EV Trainer, (Daycare) | Dojo *White→Black Belt* upgrade beat. |
| **C5 gym 5** | + Poké Casino | **Evolution Sage L3 — Stage-2 evos** (one city before enemies field G2 @ Gym6). ← *placement decision* |
| **C6 gym 6** | Link, Evo, Stone, **Dept Store**, tutors, Dojo, EV, Colress, (Daycare→Fight Club) | Move Tutor *TM Expert* upgrade; Dept Store anchor. |
| **C7 gym 7** | + Mart back | — |
| **C8 gym 8** | Mart + Dept | Dept Store anchor (everything). |
| **C9 league / endgame** | everything + Enter League; Crucible post-HoF | The "do-anything" hub — every service at top stage; Fight Club farm. |

## D. Open placement decisions (for sign-off)
1. **Stage-2 evolution layer city** — C5 (recommended; one city before Gym6 G2) vs C6.
2. **Per-city visit-before-use strictness** — light (open = visited, usable) vs strict (must visit before use) vs upgrade-only re-intro.
3. **Intro scope for utility items** (Bag/Party) — blocking required intro vs lightweight one-time tooltip.

(Implementation order after sign-off: §A1–A6 fixes → §C placements → staged ladders → egg anim → reliable verify harness + auto-win playthrough.)

---

## E. SHIPPED (PR #165, branch `…-finish`, v1.2.1, full suite 1012/0-fail)
Professor basics-only · tutors always-on (every city) · wilds base-only + rising IV cap · enemy rising-mean IVs · special=31 · evolution 3-layer (Stage-1 C1 / Stones C2 / Stage-2 C4) · menu order · required intros (Bag C0, Party+Fan Club C1) · bag shows Poké Balls + trimmed voucher/vitamin text · Pokémart 5-ball gift + Center Full Restore · egg-hatch animation · **disputed items (Artifact Hall, NEW/visited) proven working via `tests/verify-early-game.mjs`.**

## F. Staged-NPC capability ladders — SHIPPED (branch `…-NeTyO`, tests in `story-staged-npc.test.js`)
**Shared mechanic (city-anchored, tunable):** `NPC_STAGE_CITY[key]` = the first city index of each tier (keyed on the *arrived* city, same basis as the evo gate). `_npcStage(key)` / `_npcStageName(key)` resolve the current tier; the city-screen chip **renames** by tier (`Move Tutor — Heart Scale/TM Expert`, `Battle Dojo — White/Black Belt · Grandmaster`, `Stone Sage — Awakening/Stones/Ascension`). On first reaching a higher tier (`enterTutor`/`enterEvolutionLab` → `_npcStageUpCheck`), a **one-time intro** fires and the NPC hands over **1 free use** (a voucher), tracked in `sm.npcStageSeen`.

- **Battle Dojo** `[4,6,8]` (cumulative): **abilities** natural → +Hidden (Black Belt) → +Awakened (Grandmaster); **items** berries → +decent → +all. Gated in `_txRenderLoadoutEditor` via `_dojoItemTier` + the Hidden/`_opAbilitiesForMon` city gate. Gifts: Ability Capsule (BB), Ability Capsule + Emblem of Honor (GM).
- **Move Tutor** `[0,4]`: Heart Scale tier = own competitive + **egg/level-up** learnset (method codes `E`/`L` read from the loaded `@pkmn/dex` learnsets); TM Expert opens the full learnset. **Holding a Heart Scale overrides the gate** ("learn any move"); the gold path is guarded so a TM-tier move below TM Expert can only be taught with a Heart Scale (no gold leak). Falls back to the full competitive pool when the dex bundle is unavailable. Gift at TM Expert: 1 Heart Scale.
- **Stone Sage** `[2,3,4]`: capability is the player evo-stage cap; the ladder adds the **rename + intro + free Stonewise Token** per tier (Stones, Ascension).
- **Voucher rule:** vouchers grant full capability regardless of stage (Heart Scale = any move) — per "vouchers can be used for anything."

**Still open (needs sign-off):** item **shop tiers** (Mart L1 → Super Mart → Dept L2) — deferred because it overlaps the existing Poké Mart / Department Store split; needs a decision before touching the economy. **In-browser-only verification:** the real learnset method split, the rendered Dojo picker filtering, the stage-up alert, and the gold-path reroute (the headless harness stubs `@pkmn/dex` and has no DOM picker).
