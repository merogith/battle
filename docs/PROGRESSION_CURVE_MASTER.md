# Story Mode — Progression Curve Master

> **Orchestration source of truth** for the strategic-progression-curve pass.
> Generated 2026-05-25. **Read-only synthesis — no gameplay code has been changed.**
> All numbers are verbatim from `battle.html` (now ~54,035 lines) and cited as
> `battle.html:LINE`, cross-checked against `STORY_MODE_FLOW.md` (canonical spec),
> `DESIGN_FEEDBACK.md`, `BUG_REPORT.md`, and `agent-state/ISSUE_LEDGER.md`.
> Line numbers drift; the symbol name is the durable anchor.

Deliverables, in order:
- **§1–§2** = Deliverable 1, the master design file (sequential timeline + every lever).
- **§3** = Deliverable 2, per-role diagnosis.
- **§4** = Deliverable 3, the synthesized curve plan with levers.
- **§5** = Deliverable 4, the decision list (also brought to the maintainer as multiple-choice).
- **§6** = stale-finding reconciliation.

---

## 0. The model in one screen — there are NO levels

Every Pokémon's stats are computed at **Level 50** — `buildPokemon`
(`battle.html:14096`) hard-codes the Lv50 formula (`… * 50 / 100) + 60` for HP,
`+ 5` for the other stats). The `mon.level || 100` fallbacks elsewhere are an
ability gate (Schooling needs level ≥ 20) and `level:100` in the HoF block is
display metadata — neither feeds the stat math. The level is **flat Lv50 for
every fight, the whole game**, so progression is **not** a level curve. It runs
on exactly **three axes**, all keyed off `sm.badges` (the monotonic clock the
player can't undo):

| Axis | What it is | Range | Driver |
|---|---|---|---|
| **A. Grade** | BST/evolution tier of the species rolled. **G4 = weakest, G1 = strongest** (pseudo+legendary). | G4→G1 | per-row `gradeWeights` + 3 transforms |
| **B. Build tier** | How "trained" the build is — EVs, IVs, nature, ability, item, moves. | T1 Untrained → T4 Tournament | `_storyBuildTierForEvent` |
| **C. Team size** | Foe & player party size. | 2 → 6 | `min(6, 2+badges)` |

A fourth, smaller axis is the **foe stat multiplier** (early-game softening +
stage-gated ramp + difficulty mode + league boost), applied post-build.

Four canonical **stages** (`STORY_EVENTS_RAW` header `battle.html:29001`):

| Stage | Era | Span | Build tier | Grade focus | Stage-gated foe mult |
|---|---|---|---|---|---|
| 1 | G4 Era (Foundation) | Pre-G1 → GL2 | T1 | G4 filler, G3 ace | 1.00 |
| 2 | G3 Era (Transition+Core) | GL3 → GL5 | T2 | G3 | 1.00 |
| 3 | G2 Era (Optimization) | GL6 → GL8 | T3 (T4 ace @GL8) | G2 (G1 ace @GL8) | 1.05 → 1.10 |
| 4 | G1 Era (Endgame) | E4 → Mystery | T4 | G1/G2 mix → G1 | 1.15 → 1.20 |

---

## 1. Master timeline (sequential, one row per element)

`STORY_EVENTS_RAW` (`battle.html:29008`). **67 rows** (array idx 0–66), **44 are Battle rows**.
Array order = play order (rowIds are NOT sequential — rivals are spliced in).

Columns: **idx** = array index · **rowId** = internal id · **B** = badges *before* this fight ·
**gradeWeights** = `{g1/g2/g3/g4}` % · **Tier** = build tier from `_storyBuildTierForEvent` ·
**Foe×** = early-soft / stage-gated stat mult (BEFORE difficulty mode & league boost) ·
**Cap** = party cap (both sides; finales force 6) · **Gmk** = gimmick slots unlocked ·
**Coins** = base payout (× difficulty × progress taper).

| idx | rowId | Type / name | City | B | gradeWeights | Tier | Foe× | Cap | Gmk | Coins | Unlock triggers fired here · reward→mechanic notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0 | **City0** Pallet | C0 | 0 | — | — | — | 2 | 0 | — | Facilities debut: Professor, Pokémart, Move Tutor, Nature Rater, Center, **Artifact (1st pick FREE)**. Start 5 Poké Balls + 2000G+diff bonus. |
| 1 | 68 | Battle · **Rival** (intro) | — | 0 | 0/0/0/100 | T1 | player-match | 1v1 | 0 | 2000 | `firstTrainerBattle` tutorial. Pure starter duel (size = player). |
| 2 | 1 | Battle · Basic Trainer | — | 0 | 0/0/0/100 | T1 | 0.82 | 2 | 0 | 1400 | **Catch tutorial** fires before this (`firstWild`, 100% catch, fills slot 2). |
| 3 | 3 | **City1** | C1 | 0 | — | — | — | 2 | 0 | — | Gym unlocked. |
| 4 | 4 | Battle · Gym Trainer 1 | C1 | 0 | 0/0/10/90 | T1 | 0.82 | 2 | 0 | 1850 | |
| 5 | 5 | Battle · **Gym Leader 1** | C1 | 0 | 0/0/25/75 | T1 | 0.95 | 2 | 0 | 2350 | **→ Badge 1** (cap→3). Unlocks **Daycare**. Bundle: 3 Poké Balls, vitamins, 500G. |
| 6 | 6 | City1 (post-gym) | C1 | 1 | — | — | — | 3 | 0 | — | No Professor (slot filled next city). |
| 7 | 7 | Battle · Basic Trainer | — | 1 | 0/0/25/75 | T1 | 0.92 | 3 | 0 | 1200 | THEMED: cursed. `firstWildRoute` on route between cities. |
| 8 | 8 | Battle · Basic Trainer | — | 1 | 0/0/35/65 | T1 | 0.92 | 3 | 0 | 1200 | |
| 9 | 9 | **City2** | C2 | 1 | — | — | — | 3 | 0 | — | Facilities debut: **Cable Link** (`firstCableLink`→`firstStoneSage`), **Evolution/Stone Sage**, **Stone Emporium**. Free Stonewise Token. |
| 10 | 10 | Battle · Gym Trainer 1 | C2 | 1 | 0/0/45/55 | T1 | 0.92 | 3 | 0 | 2100 | |
| 11 | 11 | Battle · **Gym Leader 2** | C2 | 1 | 0/0/50/50 | T1 | 0.95 | 3 | 0 | 2950 | **→ Badge 2** (cap→4). Bundle: Rare Candy, vitamins, 1000G. |
| 12 | 13 | City2 (post-gym) | C2 | 2 | — | — | — | 4 | 0 | — | |
| 13 | 14 | Battle · Basic Trainer | — | 2 | 0/0/65/35 | T2 | 0.92 | 4 | 0 | 1500 | THEMED: multitype. **Tier steps T1→T2 at 2 badges.** |
| 14 | 15 | Battle · Basic Trainer | — | 2 | 0/0/75/25 | T2 | 0.92 | 4 | 0 | 1500 | |
| 15 | 16 | **City3** | C3 | 2 | — | — | — | 4 | 0 | — | (Nature Rater themed here.) |
| 16 | 17 | Battle · Gym Trainer 1 | C3 | 2 | 0/0/80/20 | T2 | 0.92 | 4 | 0 | 2450 | |
| 17 | 18 | Battle · **Gym Leader 3** | C3 | 2 | 0/0/75/25 | T2 | 0.97 | 4 | 0 | 3550 | **→ Badge 3** (cap→5). **Softening ends after this.** Bundle: 2 Great Balls. |
| 18 | 19 | City3 (post-gym) | C3 | 3 | — | — | — | 5 | 0 | — | |
| 19 | 12 | Battle · **Rival** (phase 2) | — | 3 | 0/0/80/20 | T2 | 1.00 | 5 | 0 | 3500 | "First Rematch." |
| 20 | 20 | Battle · Basic Trainer | — | 3 | 0/0/90/10 | T2 | 1.00 | 5 | 0 | 1700 | THEMED: villain. |
| 21 | 21 | Battle · Basic Trainer | — | 3 | 0/0/95/5 | T2 | 1.00 | 5 | 0 | 1700 | |
| 22 | 22 | **City4** Wilderness | C4 | 3 | — | — | — | 5 | 0 | — | Facilities debut: **Safari Zone**, **Battle Dojo**, **EV Trainer**. |
| 23 | 23 | Battle · Gym Trainer 1 | C4 | 3 | 0/0/100/0 | T2 | 1.00 | 5 | 0 | 2800 | |
| 24 | 24 | Battle · **Gym Leader 4** | C4 | 3 | 0/0/100/0 | T2 | **1.00** | 5 | 0 | 3800 | **→ Badge 4** (cap→6, maxed). Bundle: **1st Ultra Ball**, **Ability Capsule** ↔ Dojo (C4). |
| 25 | 25 | City4 (post-gym) | C4 | 4 | — | — | — | 6 | 0 | — | |
| 26 | 26 | Battle · Basic Trainer | — | 4 | 0/0/100/0 | T2 | 1.00 | 6 | 0 | 2000 | THEMED: multitype. Mid-game Vitamin Pack find (1st Basic after 4 badges). |
| 27 | 27 | Battle · Basic Trainer | — | 4 | 0/0/100/0 | T2 | 1.00 | 6 | 0 | 2000 | |
| 28 | 28 | **City5** Resort | C5 | 4 | — | — | — | 6 | 0 | — | Facility debut: **Poké Casino**. |
| 29 | 29 | Battle · Gym Trainer 1 | C5 | 4 | 0/0/100/0 | T2 | 1.00 | 6 | 0 | 3050 | |
| 30 | 30 | Battle · Gym Trainer 2 | C5 | 4 | 0/5/95/0 | T2 | 1.00 | 6 | 0 | 3050 | |
| 31 | 31 | Battle · **Gym Leader 5** | C5 | 4 | 0/0/100/0 | **T2** | **1.00** | 6 | 0 | 4150 | **→ Badge 5 → FIRST GIMMICK SLOT.** Bundle: **Wishing Piece** ↔ Colress (next city). |
| 32 | 32 | City5 (post-gym) | C5 | 5 | — | — | — | 6 | 1 | — | |
| 33 | 33 | Battle · Basic Trainer | — | 5 | 0/0/100/0 | T2 | 1.05 | 6 | 1 | 2200 | THEMED: villain. **Stage 3 stat-mult begins (1.05).** |
| 34 | 34 | Battle · Elite Trainer | — | 5 | 0/15/85/0 | T3 | 1.05 | 6 | 1 | 2700 | THEMED: cursed. **G2 first appears (filler).** |
| 35 | 35 | **City6** Metropolis | C6 | 5 | — | — | — | 6 | 1 | — | Facilities debut: **Department Store** (Great Balls), **Colress** (equip gimmicks). |
| 36 | 36 | Battle · Gym Trainer 1 | C6 | 5 | 0/10/90/0 | T3 | 1.05 | 6 | 1 | 3300 | |
| 37 | 37 | Battle · Gym Trainer 2 | C6 | 5 | 0/15/85/0 | T3 | 1.05 | 6 | 1 | 3300 | |
| 38 | 38 | Battle · **Gym Leader 6** | C6 | 5 | 0/0/100/0¹ | T3 | 1.05 | 6 | 1 | 5550 | **→ Badge 6** (2 gimmick slots). **Enemy gimmicks first appear (GL6).** Gym6 snapshot→Fight Club. |
| 39 | 40 | City6 (post-gym) | C6 | 6 | — | — | — | 6 | 2 | — | |
| 40 | 39 | Battle · **Rival** (phase 3) | — | 6 | 0/50/50/0 | T3 | ~1.05 | 6 | 2 | 5400 | "On the Way Up." |
| 41 | 41 | Battle · Basic Trainer | — | 6 | 0/20/80/0 | T2 | ~1.05 | 6 | 2 | 2500 | THEMED: multitype. (Basic stays T2 — never T3.) |
| 42 | 42 | Battle · Elite Trainer | — | 6 | 0/40/60/0 | T3 | ~1.05 | 6 | 2 | 2900 | THEMED: eldritch (sig-cap exempt). |
| 43 | 43 | **City7** | C7 | 6 | — | — | — | 6 | 2 | — | |
| 44 | 44 | Battle · Gym Trainer 1 | C7 | 6 | 0/35/65/0 | T3 | ~1.08 | 6 | 2 | 3550 | |
| 45 | 45 | Battle · Gym Trainer 2 | C7 | 6 | 0/45/55/0 | T3 | ~1.08 | 6 | 2 | 3550 | |
| 46 | 46 | Battle · **Gym Leader 7** | C7 | 6 | 0/50/50/0 | T3 | ~1.08 | 6 | 2 | 5800 | **→ Badge 7** (3 gimmick slots). |
| 47 | 47 | City7 (post-gym) | C7 | 7 | — | — | — | 6 | 3 | — | |
| 48 | 48 | Battle · Elite Trainer | — | 7 | 0/70/30/0 | T3 | 1.10 | 6 | 3 | 3000 | THEMED: cursed. |
| 49 | 49 | Battle · Elite Trainer | — | 7 | 0/80/20/0 | T3 | 1.10 | 6 | 3 | 3000 | THEMED: veteran. |
| 50 | 50 | **City8** Final-gym | C8 | 7 | — | — | — | 6 | 3 | — | Dept Store, Dojo, EV Trainer (last polish before league). |
| 51 | 51 | Battle · Gym Trainer 1 | C8 | 7 | 0/85/15/0 | T3 | 1.10 | 6 | 3 | 3650 | |
| 52 | 52 | Battle · Gym Trainer 2 | C8 | 7 | 0/95/5/0 | T3 | 1.10 | 6 | 3 | 3650 | |
| 53 | 53 | Battle · **Gym Leader 8** | C8 | 7 | 0/100/0/0² | **T4** | 1.10 | 6 | 3 | 5950 | **→ Badge 8 → 4 gimmick slots.** GL8 tier spike (T4, G1 ace). **Mystery Figure legendary gate** (forced legendary swap-in @C8). Bundle: 3 Ultra Balls. |
| 54 | 55 | City8 (post-gym) | C8 | 8 | — | — | — | 6 | 4 | — | Legendary swap forced here before Victory Road. |
| 55 | 56 | Battle · Elite Trainer | — | 8 | 0/100/0/0 | T4 | ~1.12 | 6 | 4 | 4200 | THEMED: villain. **All trainers T4 from 8 badges.** |
| 56 | 57 | Battle · Elite Trainer | — | 8 | 10/90/0/0 | T4 | ~1.12 | 6 | 4 | 4800 | **G1 first appears.** |
| 57 | 58 | Battle · Elite Trainer | — | 8 | 20/80/0/0 | T4 | ~1.12 | 6 | 4 | 5200 | THEMED: eldritch. |
| 58 | 59 | **City9** League | C9 | 8 | — | — | — | 6 | 4 | — | All facilities under one roof. "Enter Pokémon League." |
| 59 | 60 | Battle · **E1** | — | 8 | 30/70/0/0 | T4 | 1.15 ×1.22ᴸ | 6 | 4 | 5000 | +1 illegal slot. Flat 5000G league purse. |
| 60 | 61 | Battle · **E2** | — | 8 | 40/60/0/0 | T4 | 1.15 ×1.22ᴸ | 6 | 4 | 5000 | +1 illegal. |
| 61 | 62 | Battle · **E3** | — | 8 | 55/45/0/0 | T4 | 1.15 ×1.22ᴸ | 6 | 4 | 5000 | +1 illegal. |
| 62 | 63 | Battle · **E4** | — | 8 | 70/30/0/0 | T4 | 1.15 ×1.22ᴸ | 6 | 4 | 5000 | +1 illegal. Bundle: 2 Ultra Balls. |
| 63 | 64 | Battle · **Champion** | — | 8 | 80/20/0/0 | T4 | 1.20 ×1.40ᴸ | 6 | 4 | 7500 | +2 illegal. |
| 64 | 65 | Battle · **Rival** (phase 4) | — | 8 | 75/25/0/0 | T4 | 1.20 ×1.40ᴸ | 6 | 4 | 7200 | "Title Match." +2 illegal. |
| 65 | 66 | **Hall of Fame** | — | 8 | — | — | — | — | 4 | 0 | HoF transition → unlocks Crucible / Frontier / Caged God. |
| 66 | 67 | Battle · **Mystery Figure** (Caged God) | — | 8 | 100/0/0/0 | T4 | 1.20 ×1.50ᴸ | 6 | **all** | 12000 | G1-only, all gimmicks forced, +3 illegal. Master Ball gifted at arc unlock. **Curve gold peak.** |

¹ GL6 filler is g3:100 in the raw table; its **ace** is pulled to G2 via the signature roll + `gwForFiller` tier-down (composition lock).
² GL8 g2:100 filler with a **G1 ace exception**.
ᴸ `applyStoryLeagueFoeStatBoost` stacks **multiplicatively** on top of the stage-gated mult (and difficulty mode stacks again). Champion HP on Hard ≈ ×1.20 × ×1.40 × ×1.15.

**Post-game (not in `STORY_EVENTS_RAW`):** Crucible super-hub · Battle Frontier (endless 6v6, +35%→+150% foe edge, **no gold/item reward**) · Caged God arc (3 leads in Cities 2/5/8 + Master Ball) · Fight Club/Pits (6+ badges, pays `max(1000, 0.5×nextGymPurse)`).

---

## 2. The lever tables — every tunable knob, current value + anchor

### 2a. Build tier parameters — `STORY_BUILD_TIER` (`battle.html:33298`)
| Param | T1 Untrained | T2 Novice | T3 Competent | T4 Tournament |
|---|---|---|---|---|
| EV cap (total) | **0** | **220** | **420** | 510 (full) |
| Nature | forced neutral | 35%→neutral | kept | kept |
| Ability | forced slot 0 | 25%→slot 0 | kept | kept |
| Item | flavor berry/none | elite→flavor swap | kept | kept |
| Moves | big downgrade (basic STAB) | small downgrade (screens/Trick only) | kept | kept |
| IV range | **0–15** | **10–22** | **18–28** | **26–31** |
| Ace IV (top quartile) | 12–15 | 19–22 | 26–28 | 30–31 |

Extra knob: post-Gym-4 EV nudge (`_storyMaybeNudgeFoeEVs` `33650`) — from `badges≥4`, T2/T3 foes get +20 EV in best 2 stats.

### 2b. Tier-by-event — `_storyBuildTierForEvent` (`battle.html:33482`)
| Event | Rule | Effective |
|---|---|---|
| Basic Trainer | b≥2→T2 else T1 (**never T3+**) | T1→T2 |
| Gym Trainer / Rival | b≥5→T3, b≥2→T2, else T1 | T1→T3 |
| Gym Leader N | N≥8→**T4**, N≥6→T3, N≥3→T2, else T1 | T1→T4 |
| E1–E4 / Champion / Victory Road / Mystery | always **T4** | T4 |
| anything @ badges≥8 | T4 | T4 |
| Professor gift | matches floor: b≥8→T4, b≥5→T3, b≥2→T2, else T1 (`_storyBuildTierForProfessor` `33540`) | |

### 2c. gradeWeights transforms (applied in order before use)
1. **Difficulty** `applyDifficultyToGradeWeights` (`32689`): easy g1×0.88/g4×1.12; hard g1×1.1/g4×0.9; challenge g1×1.18/g4×0.82. **Universal nerf:** 8% g1 + 4% g2 → g3.
2. **Progress** `applyStoryProgressToGradeWeights` (`32728`): bias `k` = 0.20 (post-GL2), 0.30 (GL4+), 0.40 (GL6+), +0.0048/row capped +0.14. Shifts mass toward G1.
3. **G4 strip** `storyStripGrade4IfPartyMature` (`32708`): once party ever ≥2 mons, **all g4→g3** (monotonic).

### 2d. Foe stat multipliers (post-build, multiplicative stack)
| Layer | Constant / fn | Value |
|---|---|---|
| Pre-Gym1 non-GL | `PRE_GYM1_FOE_STAT_MULT` | 0.82 |
| GL1 / GL2 | `EARLY_GL_FOE_STAT_MULT` | 0.95 |
| Routes badges 1–2 | `EARLY_GAME_FOE_STAT_MULT` | 0.92 |
| GL3 | `STAGE2_GL_FOE_STAT_MULT` | 0.97 |
| ≥3 badges | (softening ends) | 1.00 |
| Stage-gated | `_stageGatedFoeStatMult` (`~13199`) | 1.00 (st1–2) → 1.05 (G6) → 1.10 (G8) → 1.15 (E4) → 1.20 (Champ/Myst) |
| Difficulty mode | `applyFoeDifficultyScaling` | VE 0.70 / E 0.85 / N 1.00 / H 1.15 / C 1.30 |
| League boost | `applyStoryLeagueFoeStatBoost` | E1–4 ×1.22, Champ/Rival ×1.40, Mystery ×1.50 |

### 2e. Gimmick gate — single shared, badge-keyed (`battle.html:42146`) ✅ verified live
`slotsUnlocked = badges < 5 ? 0 : min(4, badges−4)`; order **mega → dmax → tera → z**.
- Badges 1–4 = 0 · GL5→1 · GL6→2 · GL7→3 · GL8→4.
- **Shared** by player **and** enemy/wild/professor (all read `sm.unlockedGimmicks`); NOT player-only.
- Enemy gimmicks first appear at **GL6** (unlock lands after the GL5 win).
- **Cable Link IS gated** (`_withStoryPlayerGimmickGate` `11419`, wraps the makeBuild at `43513`). Trade-evolution (Stone Sage + Metal Coat etc.) is a **separate gold-gate**, not a battle gimmick.
- Mystery Figure boss forces **all** on (`34282`). Colress (where you *equip*) debuts C6 — one gym after the first unlock.

### 2f. Party / foe size
- Player cap `_storyMaxPartySize` (`41091`): `clamp(2+badges, 2, 6)`.
- Foe size `_storyEnemyPartySize` (`41058`): `min(6, 2+badges)` + role floors; finales force 6; intro rival = player-match.

### 2g. Economy
- **Start gold:** 2000 + diff bonus (VE +19000, E +4000, N +2500, H +1000, C +1500).
- **Per-battle:** `floor(baseCoins × diffMult × cursedMult × progressMult)`. Coin mults: VE 1.60 / E 1.50 / N 1.30 / H 1.00 / C 1.10. Progress taper +15%→+0% across main path. **Wild routes & Frontier pay 0.**
- **Base coins:** see §1 (GL1 2350 → GL8 5950; E1–4 5000 flat; Champion 7500; Mystery 12000).
- **Underground sell:** G1 1800 / G2 450 / G3 250 / G4 60 (`42553`).
- **Shop prices:** Poké Ball 300, Great Ball 1000 (dept, C6+), Ultra/Master gift-only. Move Tutor 1500, Nature Rater 2000, Dojo 2000, **EV Trainer 5000**, **Colress 7500**, Stone Sage G3 1500/G2 6000/G1 16000, Cable Link 6000–22000. Safari entry 10000 (1st free). Artifacts 5000 (1st free).

### 2h. Reward→mechanic alignment (prevention is structural)
| Reward | First drop | Redeemer / mechanic | Aligned? |
|---|---|---|---|
| Ability Capsule | GL4 (badge 3→4) | Battle Dojo debuts **C4** | ✅ |
| Wishing Piece | GL5 (badge 4→5) | First gimmick slot @badge5; Colress @**C6** | ✅ |
| Ultra Ball | GL4 | catching live since C1 | ✅ |
| Master Ball | Caged God arc (post-HoF) | the one fight that needs it | ✅ |
| Vitamins (+3 IV) | drop-only, any time | applied anywhere | n/a |
| Great Ball | GL3 gift / dept C6 | — | ✅ |

### 2i. Facility debut cities — `FACILITY_DEBUT_CITY` (`battle.html:29085`)
C0: Professor, Mart, Move Tutor, Nature Rater, Center, Artifact ·
C2: Cable Link, Stone Sage, Stone Shop ·
C4: Safari, Battle Dojo, EV Trainer ·
C5: Casino · C6: Dept Store, Colress · (C8 repeats Dept/Dojo/EV) · Fan Club: every city.

### 2j. Wild & Safari grade curves (deliberately one step behind trainers)
**Wild** `_WILD_GRADE_CURVE_BY_BADGES` (`43920`): b0 g4:100 → b5 g3:100 → b8 g3:92/g2:8. **Never G1.**
**Safari** `_SAFARI_GRADE_CURVE_BY_BADGES` (`STORY_MODE_FLOW §15g`): b3 g3:60/g4:35 → b8 g2:50/g3:40/g1:5. The only path to G2/G1 catches.
**Wild build** `makeWildBuild` (`44083`): T1 move-downgrade + slot-0 ability + no item, BUT **random 0–31 IVs** + **~170 curated EVs** — a head-start over T1 trainers (~"70% battle-ready").

---

## 3. Per-role diagnosis (Deliverable 2)

Each role audited its domain against the North-Star ("slightly behind → parity →
demanding late → real challenge at league/post-league; tools & money track power").

### 3.1 Flow & Onboarding Analyst
- **F1 — Onboarding teaches *actions*, not *theory*.** 18 just-in-time scenes cover UI/catch/facility usage well, but the **EV/IV system, the type-effectiveness network, what difficulty actually changes, and Crucible-vs-Frontier** are never explained (`DESIGN 2.6`). The whole curve runs on EV/IV/grade, yet the player is never told that's the axis. **Biggest onboarding gap.**
- **F2 — The single most important teaching beat is mistimed.** Gimmicks **unlock at GL5** but the lab that explains/equips them (**Colress**) debuts **C6**, a full city later. `firstColress` papers over it verbally ("the fifth gym opens the first door"), but the player holds an unusable unlock for one stage. Minor but real.
- **F3 — PC prose says "ten slots"; real cap is 30** (`battle.html:36581` vs `42532`). Stale tutorial copy.
- **F4 — Onboarding ordering is otherwise clean:** intro-rival → catch tutorial → route wild → Gym 1 is a confident, well-paced first hour. No reordering needed.
- **F5 — `sm.catchUnlocked` is dead** (written, never read; live gate is `catchTutorialDone`). Harmless, but a latent trap for anyone editing the catch gate.

### 3.2 Balance & Build Engineer
- **B1 — Mid-game plateau GL4→GL6 (the headline finding, = BUG-012).** Across rows 24–38: foe mult is flat **1.00**, build tier is flat **T2** (GL4 & GL5), grade is flat **g3:100**. GL4, GL5 and GL5-area routes are mechanically near-identical — "same fight, different sprites." The first genuine step-up is GL6 (T3 + 1.05 + G2 ace + enemy gimmicks). **3–4 fights of dead air right where the player expects to feel the mid-game open up.**
- **B2 — Wild tier framing is now *inverted* from the old complaint.** `DESIGN 1.6` said wilds are too weak (T1). But post-v19, `makeWildBuild` adds **random 0–31 IVs + ~170 EVs** on top of T1 — so a fresh wild can out-stat a T1 *trainer* and rival the early Professor gift. The lever exists (`_WILD_GRADE_CURVE_BY_BADGES`) but the *grade* ceiling (G3 until badge 6) is what actually keeps wilds modest, not the tier. The system is sound; the **internal naming** ("Untrained") misleads.
- **B3 — GL8 tier spike is abrupt.** GL8 jumps Gym Leaders straight from T3 (GL6/GL7) to **T4** in one step, while also being the badge that opens the 4th gimmick slot and the legendary gate. Lots of "new" stacked on one fight — could read as a wall rather than a ramp.
- **B4 — Early softening makes the player *over-safe*, not "slightly behind."** The North-Star wants the player *slightly underpowered* early. Today enemies are **weakened** (0.82–0.97) through GL3 — anti-brick insurance that also removes the "I'm climbing from behind" feel the brief asks for. This is a genuine philosophy fork (see Decision 1).

### 3.3 Rewards & Economy Specialist
- **R1 — Alignment is correct for the BIG items but LEAKS on vouchers.** Ability Capsule↔Dojo (both C4), Wishing Piece↔gimmick-unlock↔Colress, Master Ball↔Caged God are correctly co-scheduled. **But the Vitamin Pack (EV Trainer voucher) drops at GL1/GL2/GL3 — Cities 1–3 — while the EV Trainer doesn't debut until City 4** (`FACILITY_DEBUT_CITY.evtrainer=4`), and Emblem of Honor (Dojo voucher) drops at GL3 before the Dojo (C4). Vouchers in `GYM_VICTORY_REWARDS` are hand-placed with **no `FACILITY_DEBUT_CITY` check** — confirmed from a maintainer playtest. This is the core defect behind the reward-system overhaul.
- **R2 — Late-game economy is too tight (= BUG-014).** GL6 nets ~7560G on Normal; one Max Revive (4000) + 2 Hyper Potions (2000) + Great Ball (1000) ≈ 7000G. Net ~560G/leader → the player can never build a war chest to *experiment* with Weather Orbs, Choice items, or the 5000G EV Trainer / 7500G Colress. Niche tools stay untested → "dominant strategy" feel.
- **R3 — Power facilities are paywalled past the point of usefulness.** EV Trainer (5000G) and Colress (7500G) are the two biggest power levers, but they debut at C4/C6 when the player is cash-starved. The free vouchers (Vitamin Pack, Wishing Piece) cover *one* use each — fine for onboarding, thin for mastery.
- **R4 — Frontier pays nothing.** Pure streak/score. Fine as designed, but combined with R2 it means post-HoF has no gold faucet except Mystery (12000, once) and Fight Club.

### 3.4 Progression & Pacing Designer
- **P1 — Macro shape today: easy-early → flat-mid → hard-late.** Softened start (player ahead), dead plateau GL4→GL6, then a clean ramp GL6→Mystery. The North-Star shape is **slightly-behind-early → parity → demanding-late**. The late half already matches; the **early and mid thirds do not**.
- **P2 — "Learn → enjoy the power → move on" is half-built.** Each facility/mechanic is introduced once (good), but there's rarely a *stage to enjoy it before the next thing*: gimmicks unlock at GL5 but can't be equipped till C6; the plateau (B1) is enjoy-time with nothing new to enjoy. The rhythm stalls exactly where it should crescendo.
- **P3 — Difficulty spread is narrow (= BUG-013).** Challenge is only +30% over Normal; a player who bricks on Hard drops to Easy (0.85) and trivializes everything. No middle ground, and difficulty changes *only* stats (not AI), so "Hard" is opaque.
- **P4 — Parity point is undefined/implicit.** Today the player crosses from "ahead" (softened) to "behind" (boosted) somewhere around GL4–GL6 by accident of two unrelated curves meeting. The brief wants this to be a **deliberate, named threshold** (Decision 1).

### 3.5 QA / Test Agent (read-only baseline)
- **Q1 — Harness is healthy:** jsdom boots ~2.9–3.5s; `story-walkthrough.mjs`, `story-combat.mjs`, `story-variants.mjs` exist and run <30s. Any tuning change can be regression-tested with `?balanceAudit=1[&auditTrials=N]` (`STORY_MODE_FLOW §15g`), which dumps per-row grade/tier/sig rolls.
- **Q2 — Known live caveat for tuning:** `applyStoryLeagueFoeStatBoost` stacks **multiplicatively** with difficulty (ISSUE-005) — any league/Champion number change is amplified by the difficulty mult, so test on all 5 modes.
- **Q3 — Stale findings cleared:** ISSUE-003 (gimmick gate) and ISSUE-035 (foe size) are **already fixed** in live code (see §6) — do not "re-fix" them.
- **Q4 — 6v6 stalls (BUG-004) still open:** mid/late tuning that adds bulk will *lengthen* stalls until the AI anti-stall heuristic (PR-B) lands. Sequence matters.

---

## 4. Synthesized curve plan with levers (Deliverable 3)

**Target shape (North-Star):** `slightly-behind ──▶ parity ──▶ demanding ──▶ league/post-league wall`,
with tools & money arriving in step, and a "learn → enjoy → advance" beat per stage.

Mapping the target to the exposed levers (each is a **knob already in code** — see §2):

| Curve segment | Today | Lever(s) to move | Direction (pending your decisions) |
|---|---|---|---|
| **Early (Pre-G1 → GL2)** | enemies softened 0.82–0.95 (player *ahead*) | `PRE_GYM1`/`EARLY_GL`/`EARLY_GAME` constants (§2d) | Decision 1: keep anti-brick vs lean "slightly behind." |
| **Parity point** | implicit ~GL4 | the badge where softening ends + stage-gate stays 1.00 | Decision 1: name it (GL3 / GL4 / GL5). |
| **Mid plateau (GL4→GL6)** | flat T2 / 1.00 / g3:100 | `_stageGatedFoeStatMult` + GL5 tier | Decision 3a: +1.025 @GL5, +1.05 @post-GL5 rival, and/or step GL5→T3. |
| **Gimmick "enjoy" window** | unlock GL5, equip C6, enemy use GL6 | gate offset between player-unlock and enemy-use | Decision 2: keep 1-gym grace / widen / narrow. |
| **Late (GL6→GL8)** | clean ramp 1.05→1.10, T3, G2 | (working as intended) | hold; smooth the GL8 T3→T4 spike if desired. |
| **League/post-league** | 1.15–1.20 × league boost, T4, illegal, all gimmicks | league-boost + difficulty spread | Decision 3b: widen Challenge to give endgame teeth. |
| **Economy track** | tight late (net ~560G/leader) | base coins (E4/Champ) **or** C6–9 consumable prices | Decision 3c: bump purses vs cut prices. |
| **Onboarding theory** | actions taught, theory not | new Mechanics Codex text screen (no mechanics change) | Decision 3d: add codex (low-risk). |

**Sequencing constraint (from QA):** any bulk-adding change should land **after** or **with** the AI anti-stall fix (PR-B), or 6v6 stalls worsen. Recommend tuning in this order once decisions land: (1) early-phase + parity (smallest, safest), (2) mid-plateau, (3) economy, (4) difficulty spread, (5) onboarding codex. Each is a contained, reversible constant/table edit, regression-tested via `?balanceAudit=1` + the three story `.mjs` suites.

**What I am NOT proposing to touch:** the reward→mechanic alignment (R1, already clean), the gimmick gate plumbing (verified working), the grade/transform pipeline, party-size curve, save schema. The North-Star is reachable by moving the **stat-mult constants, the GL5 tier, a few coin/price numbers, and adding one text screen** — no structural rewrites.

---

## 5. Decision list (Deliverable 4) — needs maintainer sign-off before any edit

Each is brought as multiple-choice + recommendation. **No gameplay change happens until these are answered.**

**D1 — Early-phase feel & parity point.** Where does "slightly underpowered" end and parity begin, and do we keep the anti-brick softening?
- (a) *Keep as-is* — soft early (0.82–0.97), parity ~GL4. Safest; least "behind" feel.
- (b) **[REC]** *Lighten softening, parity at GL4* — raise the early constants partway (e.g. 0.82→0.88, 0.92→0.95) so the player feels a mild climb without bricking.
- (c) *Remove softening, parity at GL5* — honest "behind early," highest brick risk for fresh saves.

**D2 — Gimmick gate: enemy grace + Link Cable exemption.** Gate stays at GL5. After it:
- (a) **[REC]** *Keep 1-gym player grace* (player GL5, enemies GL6) — current behavior; player enjoys the power one stage before facing it. Cable Link **stays gated**.
- (b) *Widen grace* — enemies don't use gimmicks until GL7/E4; player-favored.
- (c) *Make Link Cable the sole pre-gate exception* — let Cable Link surface gimmicks before GL5 (per your brief's wording), everything else gated. (Changes current code.)

**D3a — Mid-game plateau (GL4→GL6).**
- (a) **[REC]** *Stat nudge* — `1.025×` @GL5, `1.05×` @post-GL5 rival (BUG-012 proposal). Smallest, reversible.
- (b) *Tier step* — bump GL5 from T2→T3 so the leader visibly sharpens.
- (c) *Both* — stat nudge + GL5 T3.

**D3b — Difficulty spread (BUG-013).**
- (a) **[REC]** *Widen Challenge 1.30→1.40* + restore its coin bonus; leave others.
- (b) *Couple difficulty to AI depth* (1/2/3-ply) — bigger, needs PR-B first.
- (c) *Leave as-is.*

**D3c — Late economy (BUG-014).**
- (a) **[REC]** *Bump purses* — Champion 7500→~12000, E1–4 5000→~7000, post-HoF rematches ~10000.
- (b) *Cut prices* — −30% on C6–9 consumables.
- (c) *Leave as-is.*

**D3d — Onboarding theory (DESIGN 2.6).**
- (a) **[REC]** *Add a text-only Mechanics Codex* (EV/IV, type web, difficulty deltas, Crucible vs Frontier). Zero gameplay change.
- (b) *Defer.*

---

## 5b. Per-city build-curve pass — resolved decisions + status

Maintainer-approved direction for the enemy build curve (replaces the open questions in this section's preamble for the build-curve work specifically; D1–D3 above already shipped).

**Evolution-stage gate — D-EVO-1 (eras) + D-EVO-2 (player mirror) — ✅ IMPLEMENTED.**
"Replicate the FireRed curve, a bit on steroids": basic forms early, the first-evo jump right after Gym 1, finals mid-late behind some farming. Mapped onto the verified timeline with **no boundary invention** — the eras ride the existing facility + grade schedule:

| Evo era | Arrived city | Enemy / wild / player stages | Rides |
|---|---|---|---|
| Basic | C0–1 (incl. Route 0/1) | basic only | G4 foundation; Stone Sage doesn't exist yet |
| First-evo | C2–5 | basic + first evos | Stone Sage debuts C2; G3 era |
| Full | C6+ | all (incl. finals) | G2 era opens at GL6 |

- Keyed on `cityIndexFromEventIndex` (a route battle reports its **departing** city → the route *into* a city keeps the old cap, the city's gym + route *out* get the new one — exactly the requested route-timing rule).
- Helpers: `_storyEvoStageOf` (0/1/2 from `baseStats.prevo`), `_storyEvoStageCapForCity` (C≤1→0, C2–5→1, C6+→2), `_storyEvoStageCapForRow`, `_capGradePoolsByEvoStage` (fail-open if a pool empties).
- Touch points: `rollTrainerTeam` (local-copy cap on filler pool `T` + sig pool `S`, applied uniformly so the intro Rival is basic too — never mutates the shared `_trainerPoolCache`), `_pickWildSpeciesRandom` (route wilds via `sm.eventIndex`), `_getAllEvosWithStatus` (player Stone Sage: finals render `cityLocked` pre-C6; the existing `!allowed` guard in `evoLabEvolve` rejects them).
- Verified: jsdom probe — 1296 sampled enemy mons across all three eras + the Rival branch + route wilds = **0 cap violations**; player listing gates first-evo-allowed@C3, final-locked@C3/C5, both-unlocked@C6. Test handles added to the inert `__storyTest` harness block.

**Early-build content — Q1 — ⏳ PENDING.** Early enemies keep nature + level-up moves + **default ability + a basic berry**, **0 EVs** (vanilla-ish before the steroids). Ramps with the build tier (T1 simple → T4 full competitive).

**EV / IV ramp — Q2 — ⏳ PENDING.** Smooth per-gym EV budget 0 → 510 (~10 steps) + parallel IV ramp, replacing any hard step.

---

## 5c. Player-power vs enemy-power — the matched curve

**Maintainer balance target:** wilds are G4/G3; with full evolution the player "easily evolves into G2 (mostly), occasional G1"; the enemy fields G2 (mostly) with occasional G1 by stage (GL8 → G1). Player **estimated team power ≈ enemy power** at every stage. End-game (E4 / Champion / post-HoF) power is **liked as-is — no buff/nerf**, only consistency + "works as intended."

**Why this already holds — grade is a function of evo-stage × BST** (`_computeMonGrade` `13818`): stage0 basic → G4 (G3 if BST≥350) · stage1-mid → G3 · stage1-final → G3 (G2 if BST≥500) · **stage2-final → G2 (G1 if BST≥570)** · basic-final → G4/G3/G2/G1 by BST. So evolution *is* a grade lift, and the evo-stage gate (§5b) is the throttle that keeps the player's lift in lockstep with the enemy grade era:

| Stage | Wild catch (`_WILD_GRADE_CURVE_BY_BADGES`) | Evo gate reach | Player effective grade | Enemy (grade era · evo-stage) | Match |
|---|---|---|---|---|---|
| C0–1 · 0–1 badges | G4 100% → G3 15/G4 85 | none (Sage debuts C2) | **G4 basic** | G4 era · basic | ✓ |
| C2–5 · 1–4 badges | G3 35→100 / G4 65→0 | first evos | **G3** (+ gold-limited G2) | G3 era · first-evo | ✓ |
| C6–8 · 5–8 badges | G3 100 → G2 3–8% leak | all finals | **G2, occasional G1** | G2 era · all (G1 ace @GL8) | ✓ |

- **Wilds never give G1** and only leak 3–8% G2 post-G6 — Safari (10,000G, debuts mid) is the deliberate G2/G1 *catch* path. The player's G1 comes from evolving a BST≥570 pseudo (Dragonite/Tyranitar/Salamence) at C6+, mirroring the enemy's GL8/boss G1 aces.
- **Gold is the soft grade-cap on the player.** Stone Sage: G3 = 1,500 · G2 = 6,000 · G1 = 16,000. Early purses (~2.3–5k/leader) afford ~1 G2 evolution before C5 → at most one G2 powerhouse among G3s in the first-evo era. Healthy out-strategize headroom, not a curve break — and it is self-limiting without any extra gate.
- **Tools ramp realization** (so the player can *build to* their grade, not just reach it): Stone Sage + Cable Link **C2** (evolve / trade-evo) → Move Tutor / Nature Rater → EV Trainer + Battle Dojo + Ability Capsule **C4** (EVs, ability, held item) → **Colress C6** (full EV optimization). Backed by the reward overhaul's per-trainer vitamin drops (~120–150/run) so EV access doesn't bottleneck on the 5,000G EV-Trainer alone.
- **Caught-mon baseline** (`makeWildBuild`): ~170 EVs + curated nature + default ability + no item ≈ 70% built. The tool ladder above closes the last 30% — which is exactly the gap the enemy build-tier ramp (T1→T4) crosses on its side.

**Implication for the pending EV ramp (Q2):** the enemy per-gym EV budget must **track the player's EV-tool acquisition**, not lead it — ~0–170 EV early (matches the wild head-start, pre-EV-Trainer), ramping to a full 510 by C6+ (Colress + accumulated vitamins). A hard 252/252 enemy spread before C4 would put the enemy ahead of what the player can EV; the smooth ramp must mirror C2/C4/C6 tool unlocks.

**End-game consistency (verified):** at C6+ the evo cap is 2 → `_capGradePoolsByEvoStage` early-returns the pool unchanged, the S-cap and wild-cap are skipped, and the Stone Sage allows every evolution. Enemy/wild/player rolls from C6 onward are **bit-identical to pre-gate behavior** (the 113-test suite incl. `rollTrainerTeam` reproducibility stays green). E4/Champion/Mystery power is untouched by design.

**Open balance decision — first-evo-era G2 powerhouses.** The evo gate is stage-based, so a 2-stage line's G2 final (Gyarados, BST 540, one evolution) is reachable at C2–5 while the enemy is grade-capped to G3. Today the 6,000G cost limits this to ~1 mon. Options: **(a) keep gold-gated** (recommended — preserves out-strategize room, self-limiting), or **(b) add a grade cap to player evolution at C2–5** (defer all G2 evolutions to C6) for a stricter "mostly G3 until full-evo" match.

---

## 6. Stale-finding reconciliation

| Finding | Claim | Reality (verified) |
|---|---|---|
| ISSUE-003 (P1) | gimmick gate reads IIFE-private `sm` → always 0 unlocked | **FIXED.** `_withStoryPlayerGimmickGate` (`11419`) reads `window.StoryMode.state.unlockedGimmicks`. Gate works. |
| ISSUE-035 (P2) | foe size uses `team.length` not badge curve | **FIXED.** `_storyEnemyPartySize` (`41058`) uses `min(6, 2+badges)` + floors. |
| DESIGN 1.6 | wild builds too weak (T1) | **Stale.** Post-v19 wilds get 0–31 IV + ~170 EV head-start; grade ceiling (not tier) is the real limiter. |
| ISSUE-018 (P1) | PC_BOX_CAP 30 vs spec 10 | **Spec updated to 30**; code correct. Only the *tutorial prose* ("ten slots") is stale (F3). |
| ISSUE-005 (P1) | league boost stacks multiplicatively | **True & intended** per spec §8 — note when tuning league numbers. |
