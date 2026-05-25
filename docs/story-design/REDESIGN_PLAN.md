# Story Mode — Redesign & Balance Plan

**Status:** research complete (5-lane audit, all findings verified against live code). This is the **design + balance proposal** for review. No game code (`battle.html`) is changed yet — per the agreed sequence: research → data map → balance → **feedback** → implement. The editable data map lives beside this file as `docs/story-design/*.csv` (regenerate the extracted ones with `node scripts/gen-story-design-csv.mjs`).

This doc is the single source of truth for the redesign decisions. Edit it / the CSVs to steer.

---

## 1. Design charter (locked)

- **Tone:** clean, kid-safe Pokémon surface; dark dystopian-satire iceberg underneath (technocrat autocracy, elite impunity, Sade's transgressive energy, creepypasta/leaker texture). Satire aimed at systems & archetypes, not libel of living private individuals.
- **Run shape:** fixed city/gym/event skeleton, randomized contents (roguelike). Battle + training kept accessible ("modern FireRed").
- **Training = an earned reward curve:** catch → battle → upgrade → evolve → upgrade → EV-train → IV-train (Fight Club) → Safari boosts. Player power spikes are *earned unlocks*; enemy difficulty steps up to meet each.
- **Mandatory intros are universal:** every new facility/event gates "Leave City" until its one-time intro is seen.

## 2. Service-availability taxonomy

| Pattern | Services |
|---|---|
| **Always-on** (RNG-negators) | Pokemart, Fan Club, PC/Center, **Move Tutor**, **Nature Rater**, **Artifact store + enable/disable** |
| **Permanent after debut** | Link (C2), Stone Shop (C2), Stone Sage (C2), Safari (C4), Battle Dojo (C4), EV Trainer (C4), Colress (C6) |
| **Cyclic (come & go)** | Casino (C5, C9), Department Store (C6, C8, C9) |
| **One-time** | Daycare egg (facility at C2/C4/C6; one egg per run) |
| **One-time → returns at League/endgame** | Fight Club (C6 one-time event → repeatable C9 pre-E4 + endgame) |

**Charter fixes (clear — will apply):** Move Tutor currently skips C1; Nature Rater skips C1–C2; the Artifact store isn't in any city's action list. All three are "always-on RNG-negators" → add to every city. (See `story-service-availability.csv` for the current gaps.)

## 3. Egg / Daycare redesign

- Daycare **facility appears at C2, C4, and C6** (debut C2, early but not the starter town). Mandatory first-time intro at C2.
- **One static egg per run** — grab it at any of those visits. Drop off any non-starter/non-bound mon → receive an **egg**; the **parent is permanently lost** (keep the existing dark beat).
- Hatch species locked at drop-off: shares ≥1 parent type, **one grade stronger** (keep `_daycareRollHatchSpecies`).
- **Hatch timing is relative: pickup-city + 2** (a C2 egg hatches at **C4**, a C4 egg at C6, etc.). Replaces the fixed badge-7 gate.
- The **C6 daycare visit also reveals the Fight Club** (the matron's secret).

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

Curve shape: **player-favorable early/mid, one sharp wall at GL8.** (Full numbers in `story-tunables.csv`.)

- Enemy tier→EV: T1=0, T2=220, T3=420, **T4=510**. IV bands T1 0–15 … **T4 26–31**.
- Player reaches **510 EV at C4** (EV Trainer); enemies hit **T4 only at GL8** → player is EV-ahead ~4 gyms.
- **GL8 quad-spike** (the wall): tier T3→T4, IV floor 18→26, first G1 ace, new gimmick slot, *and* the legendary gate — all in one fight.
- **IV is the lag axis:** catch IVs 0–31 (avg ~15.5); vitamins +3, cap 31, slow. **The C2/C4/C6 Fight Clubs are the intended IV catch-up** — a player who sweeps them reaches IV 36 before GL7/8/E4, clearing the T4 floor. Risk: they're hard + (early ones) one-time, so a player who loses/skips arrives under-IV'd.
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
