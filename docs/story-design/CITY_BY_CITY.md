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
