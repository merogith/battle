# Story Mode — Redesign & Balance Plan

**Status:** research complete (5-lane audit, all findings verified against live code). This is the **design + balance proposal** for review. No game code (`battle.html`) is changed yet — per the agreed sequence: research → data map → balance → **feedback** → implement. The editable data map lives beside this file as `docs/story-design/*.csv` (regenerate the extracted ones with `node scripts/gen-story-design-csv.mjs`).

This doc is the single source of truth for the redesign decisions. Edit it / the CSVs to steer.

---

## 1. Design charter (locked)

- **Tone:** clean, kid-safe Pokémon surface; dark dystopian-satire iceberg underneath (technocrat autocracy, elite impunity, Sade's transgressive energy, creepypasta/leaker texture). Satire aimed at systems & archetypes, not libel of living private individuals.
- **Run shape:** fixed city/gym/event skeleton, randomized contents (roguelike). Battle + training kept accessible ("modern FireRed").
- **Training = an earned reward curve:** catch → battle → upgrade → evolve → upgrade → EV-train → IV-train (Fight Club) → Safari boosts. Player power spikes are *earned unlocks*; enemy difficulty steps up to meet each.
- **Mandatory intros are universal:** every new facility/event gates "Leave City" until its one-time intro is seen.
- **Visual language:** Game Boy-era Pokémon look, *slightly* modernized — clean, crisp, minimal; simple readable animations over flashy effects. Favor free/open assets (see §8b).

## 2. Service-availability taxonomy

| Pattern | Services |
|---|---|
| **Always-on** (RNG-negators) | Pokemart, Fan Club, PC/Center, **Move Tutor**, **Nature Rater**, **Artifact store + enable/disable** |
| **Permanent after debut** | Link (C2), Stone Shop (C2), Stone Sage (C2), Safari (C4), Battle Dojo (C4), EV Trainer (C4), Colress (C6) |
| **Cyclic (come & go)** | Casino (C5, C9), Department Store (C6, C8, C9) |
| **One-time** | Daycare egg (facility at C2/C4/C6; one egg per run) |
| **One-time → returns at League/endgame** | Fight Club (C6 one-time event → repeatable C9 pre-E4 + endgame) |

**Charter fixes:** Move Tutor skips **C1**; Nature Rater skips **C1, C2, C4** (present only at 0,3,5–9). The **artifact store is the deeper gap** — it isn't a top-level action at all: *buy* (**Relic Annex** → `enterArtifactShop`) and *enable/disable* (**Artifact Hall** → `enterArtifactHall`) are **nested under the Department Store**, which is cyclic at **C6/C8/C9 only**, and the enable/disable switch is additionally **Colress-gated (C6+)**. Making artifacts "always-on" therefore means surfacing both as **top-level actions in every city** + ungating the switch — a bigger change than the Tutor/Rater fixes. (NB: the **"Power Up"** action in the city lists is **Colress** — the mechanic/mega unlock, C6+ — *not* the artifact store.)

## 3. Egg / Daycare redesign

- Daycare **facility appears at C2, C4, and C6** (debut C2, early but not the starter town). Mandatory first-time intro at C2.
- **One static egg per run** — grab it at any of those visits. Drop off any non-starter/non-bound mon → receive an **egg**; the **parent is permanently lost** (keep the existing dark beat).
- Hatch species locked at drop-off: shares ≥1 parent type, **one grade stronger** (keep `_daycareRollHatchSpecies`).
- **Hatch timing is relative: pickup-city + 2** (a C2 egg hatches at **C4**, a C4 egg at C6, etc.). Replaces the fixed badge-7 gate.
- The **C6 daycare visit also reveals the Fight Club** (the matron's secret).
- **Hatch — verified working today:** drop-off → next city-hub render (`renderCityActions` 38553 → `_pitsReleaseBondedOnCityReturn` 40284 → `_storyHatchEligibleEggs` 39542) → in-place hatch (party *or* PC) → reveal scene. Rework adds: **(a)** swap the `badges>=7` gate (`STORY_EGG_HATCH_BADGE`) for `currentCity ≥ pickupCity+2` (store `eggLaidAtCity`); **(b)** a **hatch animation** (egg wiggle → crack → sprite pop) in place of the text-only reveal (`_storyHatchRevealScene` 39815); **(c)** wire the dead **`_daycareHatchQueued` "egg stirring…" foreshadow toast** to fire one city before hatch (consumed at 39596 but never set today).

**Touch-points:** unlock gate `_daycareIsUnlocked()` / `sm.daycare.unlocked` (~39577, set at ~42313); egg slot stores `eggLaidAtCity`; hatch in `_storyHatchEligibleEggs` (39542) keyed on city delta not `STORY_EGG_HATCH_BADGE` (39513).

## 4. Fight Club redesign

- **Instances:** **one-time event at C6** (the matron's secret reveal → the dramatic/traumatic first gauntlet), then **repeatable** before the League (C9, pre-E4) and in the **endgame**.
- **Session:** **5 rounds**, a different trainer each round, all **3v3**, drafted:
  1. See the enemy trainer's **6**.
  2. Pick **your 3**.
  3. Enemy **counter-picks its best 3** vs your trio, by matchup score ("best scoring first").
- **Reward:** **+1 IV per round won, clamp +5, cap 36** — sweeping all 5 takes the team to **+5 / IV 36**, the one-time dramatic payoff. The cap (36) bounds total power; the repeatable League/endgame instances exist to bring **newly caught/evolved/hatched** mons up to the cap + earn gold.
- **Loss:** keep the existing free-Retry / Forfeit-permadeath tension.

**Touch-points (reuse existing systems):**
- Enemy-6 preview + pick interaction: the **draft pipeline** — `renderDraft` / `getFoeFullDraftPoolForInspect` / `toggleEnemyPool` (15113–15904) — already does "inspect the foe's six, pick N."
- Player pick-3: `_pitsTogglePick` (40014).
- **Enemy counter-pick (new):** a per-mon matchup scorer built on `_rivalCombinedEffVsMon` (33110) + `_rivalScoreAttackTypeVsParty` (33118) — score each of the enemy's 6 vs the player's locked trio, take the top 3.
- Roster roll → 6 mons, 5 rounds: extend `_pitsRollEnemyRoster` (39885).
- IV reward: +1/round, clamp +5, cap 36 (`buildPokemon` 14084; `_pitsResolveBracket` 40079).

## 5. Balance read & plan (verified numbers)

Curve shape: **player-favorable early/mid, one sharp wall at GL8.** (Summary below; the full city-by-city curve + the *accelerating-ramp* retune now live in **§8a** + `story-power-curve.csv`. **No level grind** — see §8a reframe.)

- Enemy tier→EV: T1=0, T2=220, T3=420, **T4=510**. IV bands T1 0–15 … **T4 26–31**.
- Player reaches **510 EV at C4** (EV Trainer); enemies hit **T4 only at GL8** → player is EV-ahead ~4 gyms.
- **GL8 quad-spike** (the wall): tier T3→T4, IV floor 18→26, first G1 ace, new gimmick slot, *and* the legendary gate — all in one fight.
- **IV is the lag axis:** catch IVs 0–31 (avg ~15.5); vitamins +3, cap 31, slow. **The C6 Fight Club is the intended IV catch-up** — a sweep grants +5 (→ IV 36) two gyms before the GL8 wall (City N = Gym N), clearing the T4 floor; the **repeatable pre-League (C9) instance** tops up anyone who missed it or caught/evolved late. Risk: it's hard + one-time at C6, so a player who loses/skips arrives under-IV'd (mitigated by the C9 repeat).
- **GL4–5 dead zone:** enemy static (T2 / g3:100 / 1.0×) exactly when the player unlocks the EV Trainer and spikes.

**Proposed tuning** (apply in `story-tunables.csv`, then code):
1. Soften the GL8 wall into a slope — nudge the GL6–7 IV floor up / make GL7 partial-T4 so 18→26 isn't a single jump.
2. Keep the Fight Club IV catch-up winnable, and ensure the pre-League repeatable lets under-36 mons reach the cap.
3. Small enemy EV/IV bump in the GL4–5 dead zone to meet the player's EV-Trainer spike.

## 6. Implementation notes

- **SAVE_VER bump + migration** required (current = 20): re-key the daycare unlock (Gym1 → C2), the egg hatch (badge-7 → laidCity+2), the Fight Club instances, and the new intro flags; grandfather in-progress saves.
- Timeline edits go **mirror → codegen** (Lane D): edit the CSV, regenerate the literal; never reorder rows by array index — use `eventId` as the durable key. (49 positional accesses + save-keyed assignments make naive reordering unsafe.)
- **Tests:** extend `tests/suites/story-evo-stage-gate.test.js`; add daycare-timing and Fight-Club draft/reward cases; keep the suite green.

## 7. Open knobs (not blockers — defaults chosen)

- Fight Club rounds: **5** (you floated 10).
- Repeatable Fight Club reward: bring under-36 mons toward the cap + gold — vs gold-only.
- **C6 hosts both** the final daycare visit and the Fight Club reveal — a deliberate dark-content convergence.

**Proposed implementation order (after sign-off):** (1) RNG-negator availability fixes → (2) daycare C2/C4/C6 + relative hatch + intro → (3) Fight Club gauntlet + draft (C6 + League + endgame) → (4) balance tuning. Each step behind tests + the SAVE_VER bump.

---

## 8. Next phases (captured, not yet specced)

### 8a. Power / enemy curve pass

**Reframe (verified):** Story Mode has **no level grind** — every mon (player, wild, enemy) is a fixed **Lv50** (`buildPokemon` 14096; in-game: "the build matters more than the level"). Difficulty rides on four axes — **grade** (BST tier G4→G1), **EV tier** (T1=0 / T2=220 / T3=420 / T4=510), **IV band**, **tools/gold** — plus a hidden **foe-stat multiplier** that ramps **0.82→1.20**. The current curve is in `story-power-curve.csv`.

**Current shape = lumpy, not accelerating:** soft–soft (GL1/2) → step (GL3) → **flat dead zone** (GL4/5) → double-step (GL6) → step (GL7) → **cliff** (GL8) → finale (E4). Confirmed problems:
- **GL8 wall (worse than we wrote):** five escalators land in one city — EV **T3→T4**, IV floor **18→26** (ace 29–31), forced gimmicks **2→3**, sub-trainers jump to **pure G2**, and the **post-G8 legendary gate** — while the GL8 purse (5950 G) barely funds one Colress awaken (7500 G). Sharpest single jump in the game.
- **GL4–5 dead zone:** GL4 and GL5 are **identical on every axis** (T2, IV 10–22) and the foe-stat mult **collapses to 1.0** (early softening expires at badge 3; stage-gate re-engages only at badge 5/GL6) — exactly when the player unlocks the **EV Trainer + Dojo + Safari at C4**. A 2-city power inversion.
- **Flat start:** GL1≡GL2 (both T1, IV 0–15, mult 0.95).
- **Wild ladder never escalates:** caps at **G3** (G2 only 3–8% post-G6, never G1). Safari (10 000 G) is the only G2/G1 path → wild catching is a dead tool by C6+, and wild power never tracks the enemy curve.

**Proposed retune → a smooth, *accelerating* ramp (small steps early, bigger steps late):**
1. **Un-flatten GL1→GL2** — small GL2 bump (IV floor +2 or mult 0.95→0.97).
2. **Fill GL4–5** — don't let the foe mult drop to 1.0; ramp it 1.0→1.03 and give GL5 a partial bump (IV floor +2 / small EV) so GL5 > GL4 and meets the player's C4 spike.
3. **Spread the GL8 wall across GL6–7–8** — ramp the IV floor **18→22→26** and make **GL7 partial-T4** (~465 EV) so neither jumps in one step; keep the gimmick ramp (1/2/3) and the legendary-gate flavor, but on pre-ramped stats it's a climax, not a cliff. Bump lategame gold or trim Colress/Dept cost so counters are affordable.
4. **Escalate wild grades lategame** — post-G6 wilds include more **G2** (~25%), post-G8 include **G1** (~15%), so catching stays relevant and wild power tracks enemy power (directly serves "wild matching enemy power").
5. **Professor:** gift tier already rises T1→T2→T3 and ends C6 — keep (confirm with you).

Touch-points: EV tier `_storyBuildTierForEvent` 33534; IV bands `STORY_IV_TIER_RANGES` 30060; gimmicks `_minGuaranteedMechsForEvent` 32961; foe mult `_stageGatedFoeStatMult` 13909 / `_earlyGameFoeStatMult`; wild grades `_WILD_GRADE_CURVE_BY_BADGES` 44128; grade ramp `applyStoryProgressToGradeWeights` 32728. Encode chosen values in `story-tunables.csv` after sign-off. (Also confirmed: **Professor** present **C0–C5** only; **Pokémart skips C6** — Dept Store covers it.)

### 8b. Visuals & animation pass
Aesthetic: **Game Boy-era Pokémon, slightly modernized — clean, crisp, minimal**; simple readable animations over flashy effects. First concrete items: the egg-hatch animation (§3), Fight Club draft transitions, and a sprite-set decision. Favor free/open assets:
- **itch.io** — indie tilesets / monster + trainer sprites for monster-taming games.
- **The Spriters Resource** — ripped 2D/3D sprites + UI from official games.
- **PokéAPI sprites** (GitHub) — front/back/shiny sprites, all gens.
- **Project Pokémon forums** — extracted 3DS/Switch models + hard-to-find assets.
- **PokeMiners** (GitHub) — mined GO graphics/audio.

(Licensing: official-game rips are fan-use; track provenance per asset before shipping.)
