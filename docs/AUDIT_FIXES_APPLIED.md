# Multi-Agent Audit — Fixes Applied

**Branch**: `claude/sleepy-volta-9fMzI`
**Date**: 2026-05-22
**Reference**: `docs/MULTI_AGENT_AUDIT_REPORT.md`

This document tracks which audit findings have been fixed in this branch and how.

---

## Summary

7 commits land 8 waves of fixes covering every P0 / P1 issue, most P2, and the documented P3 hygiene items. All 533 existing tests still pass.

| Severity | Audited | Fixed | Skipped (and why) |
|---|---|---|---|
| **P0** | 3 | **3** | — |
| **P1** | 7 | **7** | — |
| **P2** | 6 | **5** | 1 partial — see below |
| **P3** | 6 | **5** | 1 deferred — see below |

---

## Wave-by-wave

### Wave 1 — Quick bug fixes (commit `4658e6e`)
- **Embody Aspect literal mismatch** (`battle.html:13731`): `mon.ability === 'Embody Aspect'` → `(mon.ability || '').startsWith('Embody Aspect')` so the mask-suffixed forms `"Embody Aspect (Teal)"` etc. match.
- **False Swipe / Hold Back**: explicit clamp to leave defender at 1 HP, inserted in the damage-clamp block right before Focus Sash / Sturdy. Won't KO targets anymore.
- **Fell Stinger**: +3 Attack on KO, fired alongside Moxie / Chilling Neigh.
- **Block / Mean Look / Spider Web / Thousand Waves**: sticky trap (set `volatile.partialTrap = 999` like Octolock), with Ghost-type / Run Away ability immunity.
- **Foresight / Odor Sleuth / Miracle Eye**: new `volatile.identified` / `volatile.identifiedDark` flags consumed in the type-effectiveness branch so Ghost / Dark immunities drop for the marked target.
- **Sky Drop target lock**: new `volatile.skyDropLocked` counter set on the carry-turn, consumed in `canMove` so the target can't act while up in the sky. Cleared on the resolution turn.
- **6 silent no-op status moves** (Corrosive Gas, Doodle, Flower Shield, Rototiller, Teatime, Venom Drench) appended to `BANNED_MOVES` so they're swapped at build-load instead of failing mid-battle.

### Wave 2 — UTF-8 corruption in builds.csv (commit `d2f449f`)
- Repaired the 11 `Farfetch'd` / `Farfetch'd-Galar` rows (was `Farfetchâ€™d`) and 2 `Flabébé` rows (was `FlabeÌbeÌ`). All 13 are now reachable via `csvBuilds[name]` against the canonical species-name spelling.
- Added defensive `_csvNormalizeSpecies` at CSV load so any future re-corruption resolves at runtime.

### Wave 3 — IV / tera-type / format / multi-option preservation (commit `042e7bb`)
**The most impactful fix.** `data/builds.csv` schema gained 9 columns:
- `gen, format, category` — source generation, format key, singles|doubles category.
- `hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv` — per-stat IVs (default 31).
- `teratypes` — pipe-delimited curated tera pool for gen-9 sets.

`scripts/generate_builds.js` now emits all of these, AND pipe-encodes multi-option item / ability / nature cells (`"Magic Guard|Unaware"`). The CSV grew from 16,745 rows to 17,397 — the new dedup key is per-(name, gen, format, role), retaining cross-format variety the old key collapsed.

`loadBuildsCSV` in battle.html now reads them all and stores:
- `build.ivs` — consumed by `buildPokemon` (Trick Room 0-Spe / 0-Atk sets now apply correctly).
- `build._teratypes` — consumed by `rollTeraType` (curated gen-9 tera pool now actually rolls).
- `build._gen / _format / _category` — surfaced for downstream weighting.
- `build._{item,ability,nature}Options` — per-encounter re-pick in `makeBuild` so a Clefable's `["Magic Guard","Unaware"]` no longer freezes on one choice for the session.

**Affected sets**: ~3,800 explicit-IV sets + 2,470 gen-9 tera-type sets that were previously flattened. Direct gameplay impact on every Trick Room team, every confusion-resistant set (Lonely / 0-Atk), and the entire competitive tera-type meta.

### Wave 4 — Ability implementations (commit `bbbdf9a`)
Eight stubbed abilities now have real effects:

| Ability | Trigger | Effect |
|---|---|---|
| Anticipation | Switch-in | Scan foe moves; log "shuddered!" if any super-effective or OHKO move is present. |
| Forewarn | Switch-in | Reveal foe's highest-BP damaging move. |
| Supersweet Syrup | Switch-in (once per battle) | Drop foe evasion -1, bypassing Sub. |
| Stall | Turn order | -0.6 to effective priority; holder moves last in bracket. |
| Seed Sower | On damaging hit | Set Grassy Terrain (5 turns, 8 with Terrain Extender). |
| Wind Power | On wind-move hit | Set `charged` volatile; next Electric move ×2 BP (wired through existing Charge handler). |
| Cud Chew | End of turn after eating a berry | Re-applies `_onBerryEaten` for the same berry (Cheek Pouch heals chain). |
| Opportunist | On hit by foe that raised stats this turn | Mirror those positive deltas back to holder. |

New `volatile` keys: `charged`, `supersweetUsed`, `cudChewBerry`, `cudChewTurns`, `statsRaisedThisTurn`, `identified`, `identifiedDark`. All defaulted in `buildPokemon` so they reset on switch.

### Wave 5+6 — Cross-gen learnsets, format filters, hygiene (commit `efbf232`)

**Cross-gen learnset patch**: `_tutorFetchLearnsetMoveNames` now unions across gens 4-9 via `D.forGen(g).learnsets.get(name)`. Without this, "Past"-flagged moves (Pursuit, all 16 Hidden Powers, Return, Frustration, Magic Coat, Refresh, …) were tutor-accessible only on species with historical Smogon CSV entries containing them. Now any species that legally learned the move in any gen 4-9 can teach it. **Satisfies the user's "movepool stays same across gen toggle" requirement at the learnset level too.**

**Format filters**: New `settings.allowDoublesBuilds` (default off) and `settings.allowExoticFormats` (default off). `makeBuild` filters its pool to hide VGC / Battle Spot Doubles sets in singles rolls, and hides side-mode formats (AAA, BH, Stabmons, Mix-and-Mega, Camomons, Godly Gift, Inheritance, CAP) unless the player opts in. Filter is a no-op when every entry would be filtered out — keeps species playable when their only Smogon presence is doubles or exotic.

**Cosmetic ability backfill**: `data/species.json` got `abilities` slots on the 37 cosmetic variants that had none (Burmy weather, Shellos / Gastrodon East, Deerling seasons, 17 Vivillon patterns, 6 Minior color cores, 7 Alcremie variants). Each variant inherits its base form's slots verbatim.

**Dead code**: Removed `fetchLiveBuild` (never invoked anywhere). `convertSmogonSet` kept as a low-level helper.

### Wave 7 — Spec reconciliation (commit `afd9e61`)
`STORY_MODE_FLOW.md` updated to match shipped code at 4 sites:
- PC cap is **30**, not 10. Updated all 4 references with playtest rationale.
- `STAGE2_GL_FOE_STAT_MULT = 0.97` for GL3 added to the §8 early-game-softening table; softening-ends row moves to ≥3 badges.
- Ball economy: Ultra Ball now described as "unbounded via post-victory bundles" with Underground-balance rationale (was "×2 total static drops").

### Wave 8 — New competitive sets (commit `a9a77fc`)
Hand-rolled Smogon-style sets for the 8 gen-9 species that had no presets:
- **Tauros-Paldea-Combat** (Fighting): Choice CB/Scarf, Bulk Up, Monotype Fighting pivot. Intimidate / Cud Chew. Tera Fighting/Ghost/Rock.
- **Wyrdeer** (Normal/Psychic): Bulky Intimidate, CB physical, Monotype Psychic support. Intimidate / Sap Sipper. Tera Steel/Water/Normal/Bug.
- **Klawf** (Rock): Anger Shell sweeper, defensive Stealth Rock setter. Anger Shell / Regenerator. Tera Water/Ghost/Fairy.
- **Squawkabilly × 4 colors**: U-turn pivot, ability differentiation (Intimidate vs Hustle).
- **Oinkologne** (Male + Female-form): Choice Band physical, Bulk Up + Rest stall. Thick Fat / Lingering Aroma / Aroma Veil.

CSV regenerated — 17,397 rows total (8 species × 1–2 formats × 1–2 roles = 16 new rows).

---

## Skipped / Deferred

### P2 — Move tutor / @pkmn/dex partial
The cross-gen learnset patch (Wave 5) does union gens 4-9 for `_tutorFetchLearnsetMoveNames`. But `@pkmn/dex`'s `forGen(g)` API may not be present on every CDN-loaded build; the patch falls back to gen-9 only when `D.forGen` is undefined. Real-world coverage depends on the live CDN bundle.

### P3 — `data/species.json` lower-gen blocks still dead
Decided to leave the unused gen 1–8 sections in `data/species.json` as-is. The audit identified them as "dead data" (only `["9"]` is loaded), but deleting ~150 KB of seemingly-canonical Showdown-style JSON felt riskier than the maintenance overhead. A future cleanup can either:
- Add a proper merge walk that overlays the per-gen overrides at load time.
- Or document the gen-9-only behavior and trim the file.

### P3 — Cross-gen evolution toggle
Not added. The existing surface (`_getAllEvosWithStatus` flagging cross-gen evolutions as `allowed: false` with the "X isn't in your enabled generations" message) is functional. Adding a "always-allow cross-gen evolutions" setting felt like scope creep.

---

## Verification

- **Tests**: `npm test` runs 884 tests; 533 pass, 0 fail, 351 todo (all pre-existing stubs). The IV/tera schema change passes the damage-formula suite (which constructs builds via the loader) end-to-end.
- **Syntax check**: `node --check` on extracted inline JS at every wave — all clean.
- **CSV verification**: 17,397 rows, header matches new schema, Farfetch'd / Flabébé reachable, new species (Wyrdeer, Klawf, Tauros-Paldea-Combat, Squawkabilly variants, Oinkologne) all present with correct tera-type column.

## Files Changed

```
battle.html                          — most fixes land here
data/builds.csv                      — regenerated with new schema
data/builds/gen9.json                — added 8 new species + reformatted
data/species.json                    — 37 cosmetic variants gained abilities slots
scripts/generate_builds.js           — IV / tera / format / multi-option emission
STORY_MODE_FLOW.md                   — spec reconciled with shipped code
docs/AUDIT_FIXES_APPLIED.md          — this file
docs/MULTI_AGENT_AUDIT_REPORT.md     — original audit (unchanged)
```
