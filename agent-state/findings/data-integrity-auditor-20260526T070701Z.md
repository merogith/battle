---
severity: P1
category: data
anchor_symbol: fetchSmogonSetsForGen
current_line_hint: ~11590
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 41bbacf8009e
confidence: high
status: open
---

**Title**: Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative)

**Evidence**:
```js
// loadBuildsCSV() fetches data/builds.csv FIRST and populates csvBuilds.
// gen*.json is only read by the API fallback (file:// / fetch-fail path):
async function populateCsvBuildsFromAPI() { ...
  await Promise.all([4,5,6,7,8,9].map(g => fetchSmogonSetsForGen(g))); // 9954
// fetchSmogonSetsForGen(gen): fetch(`data/builds/gen${gen}.json`) // 11590
// The ONLY other reader is _loadTeraStats() (49851) — gen9.json teratypes only.
```

**Repro**: Serve over http(s)://, boot Story Mode. `data/builds.csv` (17,398 rows) loads into `csvBuilds`; `makeBuild`/`_storyDowngradeBuildForTier`/`resolveCsvBuildEntry` read only `csvBuilds`. The gen*.json files are never fetched for gameplay (only on CSV fetch failure, or for Tera-frequency UI from gen9.json).

**Blast radius**: The planned curve/tunables retune "leans heavily on builds/grades." EV tiers (`_storyDowngradeBuildForTier` 33606), grade pools (`buildGradePool` 32672), Nature Rater / Move Tutor / Dojo recommendations (all read `csvBuilds`). Editing `data/builds/gen*.json` to retune movesets/EVs/natures will have **zero gameplay effect** under normal serving — the change must land in `data/builds.csv` (or both, kept in sync).

**Fix sketch**: Designate `data/builds.csv` as the single source of truth for the retune and document it in REDESIGN_PLAN §8a touch-points; if gen*.json must persist as a mirror, add a codegen/CI check that regenerates it from the CSV so the two never drift.

**Verification**: After a retune edit, confirm the changed EV/nature/move appears in a live Story battle (csvBuilds path), not just in the JSON. Diff CSV vs JSON to confirm sync.

---
severity: P2
category: inconsistency
anchor_symbol: loadBuildsCSV
current_line_hint: ~9870
file: data/builds/gen5.json
agents: [data-integrity-auditor]
fingerprint: 0c28760f1056
confidence: high
status: open
---

**Title**: 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift)

**Evidence**:
```js
// loadBuildsCSV defaults a blank nature to 'Hardy' (neutral):
const natureRaw = _csvDecodeOptions(row.nature, 'Hardy');   // 9870
const naturePicked = _csvPickOption(natureRaw, 'Hardy');    // 9876
// builds.csv: 0 rows with blank nature. JSON mirror: 6 builds with no nature key:
//   gen5 Aron/vgc2012/Level 1 Sturdy, gen5 Solosis/vgc2012/FEAR,
//   gen8 Mewtwo/balancedhackmons/Sheer Force, gen9 Landorus/godlygift/Nasty Plot,
//   gen9 Great Tusk/ubersuu/Choice Scarf, gen9 Iron Treads/ubersuu/Booster Speed Lead
```

**Repro**: `node` over `data/builds/gen{5,8,9}.json` — these 6 build objects lack a `nature` field. The same sets in `data/builds.csv` carry a nature.

**Blast radius**: Low for gameplay (CSV is authoritative and supplies the nature; the JSON-fallback path defaults to Hardy). But it is a symptom of CSV↔JSON drift — relevant because the retune touches natures and may regenerate one representation. Hand-editing the JSON for the retune would inherit the gap.

**Fix sketch**: Regenerate `data/builds/gen*.json` from `data/builds.csv` so every set carries the CSV's nature; or backfill the 6 missing `nature` keys to match the CSV.

**Verification**: Re-run a JSON-vs-CSV field-coverage diff; expect 0 nature-less JSON builds.

---
severity: P2
category: data
anchor_symbol: POKEMART_ITEMS
current_line_hint: ~29934
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 4177b7fb1027
confidence: high
status: fixed-main
---

**Title**: Mart/Dept consumables (30 ids: potion, xAttack, sunOrb, evResetCharm…) are a self-contained namespace, NOT entries in items.json

**Evidence**:
```js
const POKEMART_ITEMS = [
  { id:'pokeBall', ..., kind:'ball', ballKey:'poke' },
  { id:'potion', ..., effect:'heal20' },   // <- effect handler inline, not in items.json
  ...
];
// Cross-ref: 30/32 mart+dept ids resolve via inline 'effect'/'kind'; only
// pokeBall + greatBall map to items.json. STONE_SHOP_ITEMS: 24/24 resolve.
```

**Repro**: Cross-reference `[...POKEMART_ITEMS, ...DEPT_ITEMS]` ids against `data/items.json` (normalized) — 30 ids (all consumables/orbs/X-items) are absent; they carry inline `effect`/`kind` handlers instead.

**Blast radius**: Documentation/clarity only — these are intentionally engine-defined consumables with inline handlers, so a literal "mart id must exist in items.json" check yields 30 false positives. items.json is the competitive held-item/berry/ball dataset, not the shop-consumable catalog. Held-item/berry/ball handler coverage (check #8) is satisfied: balls route through `ballKey`, and the only items.json-backed mart entries are the two balls.

**Fix sketch**: No code change needed. Note in the data-validator / REDESIGN docs that POKEMART_ITEMS/DEPT_ITEMS consumables are a distinct namespace from items.json so future audits don't flag them; if a unified registry is desired later, add a `source` tag.

**Verification**: N/A (informational). Confirm STONE_SHOP_ITEMS (24/24) and the two balls remain the only items.json-backed shop ids.

---
severity: P2
category: inconsistency
anchor_symbol: _isBuildAbilityIllegal
current_line_hint: ~9919
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 6a7b7ae22cca
confidence: medium
status: open
---

**Title**: Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives

**Evidence**:
```js
// loadBuildsCSV already gates illegal abilities at load — this IS the legality model:
if (Array.isArray(buildObj._abilityOptions)) {
  const legalAbilities = buildObj._abilityOptions.filter(a => !_isBuildAbilityIllegal(name, a));
  if (legalAbilities.length === 0) { buildObj._illegal = true; illegalCount++; }
} else if (_isBuildAbilityIllegal(name, buildObj.a)) { buildObj._illegal = true; illegalCount++; }
// 672 build species::ability "violations" vs species.json abilities; ~634 are
// free-ability metagames (almostanyability/balancedhackmons/purehackmons/1v1/mixandmega);
// the rest are mega-form abilities (e.g. Charizard/ou "Tough Claws" = charizardmegax).
```

**Repro**: Cross-ref each build's `ability` against `species.json[species].abilities`. 672 distinct pairs mismatch; filtering free-ability tiers leaves ~38, all mega/form-transition (verified: `charizardmegax` carries Tough Claws, `dianciemega` carries Magic Bounce, etc.).

**Blast radius**: None for gameplay — the engine flags these via `_isBuildAbilityIllegal` and gates them behind end-game opt-in (`allowIllegal`/`forceIllegal` in `makeBuild` 10297). Relevant to the retune only as a caveat: any new "legal moveset/ability" validation for the curve must (a) resolve mega/form abilities against the form key, and (b) treat hackmons/AAA tiers as legitimately ability-free, or it will produce ~672 phantom findings.

**Fix sketch**: If the retune adds an ability-legality gate, reuse `_isBuildAbilityIllegal` (which already encodes the mega/hackmons rules) rather than a raw species.json abilities check.

**Verification**: Confirm a standard-tier (ou/uu) non-mega build with an off-species ability does not exist (it doesn't); confirm flagged builds only surface in end-game `allowIllegal` flows.

