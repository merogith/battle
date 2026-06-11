---
severity: P2
category: data
anchor_symbol: _isBuildAbilityIllegal
current_line_hint: ~10536
file: data/species.json
agents: [data-integrity-auditor]
fingerprint: 6cd268a1ac66
confidence: high
status: fixed-main
---

**Title**: species.json Hisui formes are stale (gen8 snapshot) — Samurott-Hisui/Kleavor lack gen9 Sharpness, so every legal-tier build is dropped

**Evidence**:
```
// data/species.json
Samurott-Hisui (gen8): abilities {"0":"Torrent","H":"Shell Armor"}   // missing "Sharpness"
Kleavor        (gen8): abilities {"0":"Swarm","1":"Sheer Force","H":"Steadfast"} // missing "Sharpness"
// data/builds/gen9.json — Samurott-Hisui/ou ALL list ability "Sharpness" (12 sets); Kleavor/ru "Sharpness" (8 sets)
```
`_isBuildAbilityIllegal(name, ab)` (battle.html ~10536) cross-references `baseStats[name].abilities`. Because species.json keys these Hisui formes at their gen8 ability set, every gen9 OU/RU build that correctly lists Sharpness is tagged `_illegal` and filtered out of the default (`allowIllegal=false`) pool in `makeBuild` (~11068). These are STANDARD legal tiers (ou/ru), not hackmons — distinct from ISSUE-054's "intended" set.

**Repro**: `node` over data/builds/*.json + species.json: for Samurott-Hisui every standard build's `ability` ("Sharpness") fails `allowed.has()` against species.json's {Torrent, Shell Armor}; same for Kleavor. Both species end with legal=0, illegal=12 / illegal=8.

**Blast radius**: Story rolls (`rollTrainerTeam`→`makeBuild`) for these two species silently fall through the designed-build pool to the randbats cache or the last-resort Tackle/Growl/Leer build (~11126), so a foe Samurott-Hisui never gets its intended Smogon set. No crash. The same gen-staleness pattern affects Whirlipede (Speed Boost), Decidueye-Hisui (Scrappy), Growlithe-Hisui (Rock Head), Igglybuff (Competitive) — see the companion all-illegal finding.

**Fix sketch**: Add "Sharpness" to the ability list of Samurott-Hisui and Kleavor in data/species.json (gen9 ability slot), regenerating from a current dex if species.json is build-generated. Balance numbers stay user-owned; this is a data-correctness fix, not a curve change.

**Verification**: After the edit, `_isBuildAbilityIllegal("Samurott-Hisui","Sharpness")` returns false and a re-run of the all-illegal scan shows Samurott-Hisui/Kleavor with legal>0.

---
severity: P2
category: data
anchor_symbol: makeBuild
current_line_hint: ~11063
file: data/builds/gen9.json
agents: [data-integrity-auditor]
fingerprint: 1943fa0aafc9
confidence: high
status: open
---

**Title**: 14 species have their ENTIRE standard-tier build pool tagged illegal — designed sets are dropped, foe falls back to randbats/Tackle

**Evidence**:
```
// All standard builds illegal (legal=0) → pool emptied by makeBuild ~11068 when allowIllegal=false:
Samurott-Hisui(12) Kleavor(8) Decidueye-Hisui(4) Whirlipede(3) Growlithe-Hisui(3)
Banette-Mega(2) Necrozma-Ultra(2) Aerodactyl-Mega(1) Camerupt-Mega(1) Glalie-Mega(1)
Blastoise-Mega(1) Igglybuff(1) Ampharos-Mega(1) Sceptile-Mega(1)
// e.g. Whirlipede/zu wants "Speed Boost"; species.json Whirlipede = {Poison Point, Swarm, Quick Feet}
```
Three root causes: (A) species.json gen-staleness — Hisui formes missing gen9 abilities (Samurott-Hisui/Kleavor Sharpness); (B) Mega-forme builds list the PRE-mega base ability (Banette-Mega wants Frisk/Insomnia, but baseStats["Banette-Mega"]={Prankster}); (C) genuine Smogon-preset ability errors (Whirlipede never has Speed Boost; Igglybuff never has Competitive). ISSUE-054 lumps all 672 illegal pairs as "intended hackmons/mega"; this finding isolates the 14 where there is NO legal in-tier fallback, so the species is reduced to randbats/last-resort.

**Repro**: `node` scan of data/builds/*.json excluding EXOTIC_FORMAT_KEYS (battle.html ~11527) and doubles/vgc tiers, grouping per species: 14 species have legal=0 with illegal>0. Each then exercises makeBuild's randbats fallback (~11111) or the Tackle/Growl/Leer last resort (~11126).

**Blast radius**: Story-mode foe quality — any time `rollTrainerTeam` lands one of these 14 species, the player faces a randbats-quality or near-blank moveset instead of the curated tier set. Drifblim/Mimikyu/Marowak (raid bosses) are NOT affected — verified all 8 extra-raid bosses have legal>0 standard builds.

**Fix sketch**: (A) fix species.json abilities (see companion finding); (B) have `_isBuildAbilityIllegal` resolve a `-Mega`/`-Ultra` forme's legality against the BASE species' ability list (the mega ability is auto-granted on evolve, so the base-forme ability on the set is correct); (C) drop or correct the ~6 genuinely-wrong preset abilities in data/builds. Mega resolution is the highest-leverage single fix (covers 5 of the 14).

**Verification**: Re-run the all-illegal scan; the 14-species list shrinks to only any deliberately-retained CAP/exotic entries. Spot-check that a rolled Banette-Mega keeps its designed set instead of a randbats fallback.

---
severity: P3
category: data
anchor_symbol: _onBerryEaten
current_line_hint: ~25568
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: e8d49fac6605
confidence: high
status: wontfix-gen2-berries-not-loaded-by-gen9-engine-by-design
---

**Title**: 9 Gen-2-legacy "isBerry" items are dead data — no engine handler and never referenced by any build

**Evidence**:
```
// data/items.json entries with isBerry:true whose name string appears NOWHERE in battle.html:
Bitter Berry, Burnt Berry, Gold Berry, Ice Berry, Mint Berry,
Miracle Berry, Mystery Berry, PRZ Cure Berry, PSN Cure Berry
// These are the Gen-2 names later renamed (Gold Berry→Sitrus, Bitter Berry→Persim,
// PSN Cure Berry→Pecha, ...). The engine's berry logic is a hardcoded name switch
// (_onBerryEaten ~25568, residual/onEat sites ~25513-28460) keyed by the MODERN names.
```
68 of 77 `isBerry` items resolve to a real handler by exact-name match; these 9 do not. A scan of data/builds/*.json confirms ZERO build item slots reference any of the 9 — so they are unreachable dead data, not a live no-op (distinct from the 7 no-op abilities and 45 inert mega stones already filed).

**Repro**: collect `name` of every items.json entry with `isBerry:true`; grep each literal in battle.html (9 miss); then scan data/builds/*.json item fields for those 9 names (0 hits).

**Blast radius**: None today — unreachable via builds and shops. Latent only: a future dex/item browser or a "give held item" feature that surfaces items.json directly would hand the player an inert berry. Pure hygiene.

**Fix sketch**: Either prune the 9 Gen-2-legacy berry entries from data/items.json (they duplicate the modern-named berries that ARE handled), or add a one-line manifest noting Gen-2 berry aliases are intentionally retained as inert export rows. No engine change.

**Verification**: After pruning, `Object.values(items.json).filter(i=>i.isBerry).length` drops by 9 and every remaining isBerry name has a battle.html hit.

