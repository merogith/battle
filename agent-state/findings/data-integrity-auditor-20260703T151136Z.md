---
severity: P2
category: data
anchor_symbol: loadGameData
current_line_hint: ~11344
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 29a5b1ba471b
confidence: high
status: open
---

**Title**: ~438 KB of non-gen-9 layers in core data JSONs are dead — engine reads only `['9']`

**Evidence**:
```js
const speciesJSON = speciesJSONOrig['9'] || {};   // battle.html ~11525
const movesJSON = movesJSONOrig['9'] || {};       // ~11556 — same pattern for
const naturesJSON = naturesJSONOrig['9'] || {};   // natures, items, abilities
```

**Repro**: `node -e` byte scan: moves.json 933 KB total, non-gen-9 layers = 297 KB / 1253 entries (31.8%); abilities.json 67 KB / 463 entries (35.2%); items.json 37 KB / 606 entries (18.9%); species.json 37 KB / 504 entries (5.1%). Gens 1–8 keys are a strict subset of the gen-9 layer for every reference the runtime resolves.

**Blast radius**: Boot critical path — all five files are fetched and `JSON.parse`d in `loadGameData` before the loading screen clears; ~21% of the parsed core-data payload is discarded immediately. No behavioral impact.

**Fix sketch**: Strip data files to the gen-9 layer (or ship gen9-only variants) via a build script; keep the multi-gen source in the repo if the Showdown-patch provenance is worth preserving.

**Verification**: After stripping, `node scripts/debug/data-validator.mjs` still passes and `tests/helpers/load-engine.js` boots with identical `baseStats`/`movesDB` counts (1380 species, 954 moves).

---
severity: P3
category: data
anchor_symbol: fetchSmogonSetsForGen
current_line_hint: ~14332
file: battle.html
agents: [data-integrity-auditor]
fingerprint: b02e0a066774
confidence: medium
status: open
---

**Title**: data/builds/gen*.json (3.9 MB) duplicates builds.csv 1:1 behind a fallback that can't realistically fire

**Evidence**:
```js
// fetchSmogonSetsForGen — only reached from populateCsvBuildsFromAPI, which only
// runs when fetch('data/builds.csv') fails:
let r = await fetch(`data/builds/gen${gen}.json`);
if (!r.ok) throw new Error('local not found');
// ... catch → https://data.pkmn.cc/sets/gen${gen}.json
```

**Repro**: Per-gen build counts are identical between the two encodings (CSV vs gen*.json): 1603/2391/2899/2779/3447/4278 = 17,397 total. builds.csv = 2.6 MB, data/builds/*.json = 3.9 MB.

**Blast radius**: Ship/repo weight only. The local-JSON fallback tier is reached only when the same-origin static fetch of builds.csv fails — a condition under which the same-origin static fetch of gen*.json almost certainly fails too (e.g. file:// blocks both), leaving the pkmn.cc API as the only real fallback. Regeneration drift between the two encodings would silently change fallback-path teams, though none exists today.

**Fix sketch**: Either drop data/builds/gen*.json and rely on the pkmn.cc API tier, or make the CSV a build artifact generated from the JSONs with a parity check in CI so they cannot drift.

**Verification**: Delete/relocate the JSONs, boot with builds.csv present (normal path unaffected), then boot with builds.csv renamed and confirm the API fallback still populates csvBuilds.

---
severity: P3
category: data
anchor_symbol: loadGameData
current_line_hint: ~11499
file: data/species.json
agents: [data-integrity-auditor]
fingerprint: 462ae197e38f
confidence: high
status: open
---

**Title**: 135 gen-9 species entries + 45 "Future" fan items are unreachable dead entries

**Evidence**:
```js
// loadGameData species loop guard:
if (!s || !s.baseStats || !s.num || s.num <= 0) continue;
```
135 gen-9 species entries fail this guard (cosmetic formes with no baseStats — burmysandy, shelloseast, deerlingsummer, vivillonicysnow…, plus MissingNo/CAP; ~32 KB). items.json carries 45 `isNonstandard:"Future"` fan entries (~8 KB) — mostly fan mega stones (absolitez, baxcalibrite, crabominite, heatranite); 19 of them lack desc/shortDesc so they can't even feed tooltipDict, and the `megaStone` field has 0 references in battle.html.

**Repro**: `node -e` scan of data/species.json['9'] with the loader guard → 135 skipped, 0 nonstandard species pass the guard (no gameplay leak); data/items.json['9'] filter `isNonstandard==="Future"` → 45.

**Blast radius**: None at runtime (entries are contained by the guard / tooltip-only item use). Pure payload + audit noise: dead entries make future cross-reference checks report against species that can never exist in `baseStats`.

**Fix sketch**: Prune the guard-failing species entries and Future items in the same gen-9-strip build step proposed for the layer cleanup, or mark them explicitly so audits can exclude them.

**Verification**: Post-prune boot shows identical `Object.keys(baseStats).length` (1380) and identical tooltipDict key count.

---
severity: P3
category: inconsistency
anchor_symbol: loadJsonByGen
current_line_hint: ~10
file: scripts/debug/data-validator.mjs
agents: [data-integrity-auditor]
fingerprint: e898b8a668ff
confidence: high
status: open
---

**Title**: data-validator checks the fallback dataset against the wrong layer union — never validates builds.csv

**Evidence**:
```js
function loadJsonByGen(filename) {
  // flattens ALL gen layers into one lookup:
  for (const gen of Object.keys(obj)) {
    for (const key of Object.keys(obj[gen])) { ... flat[norm] = {...}; }
```
Runtime consumes only layer `'9'` (`speciesJSONOrig['9']` etc.), so a reference satisfied only by a gen-1–8 key would pass validation yet miss at runtime. And `loadBuilds()` scans `data/builds/gen*.json` — the fallback source — while `data/builds.csv`, the primary source `loadBuildsCSV` actually consumes, is never validated.

**Repro**: Read scripts/debug/data-validator.mjs `loadJsonByGen`/`loadBuilds` vs battle.html `loadGameData`/`loadBuildsCSV`. (Independent re-validation of builds.csv against gen-9-only layers this run: clean — species/moves/abilities/items/natures all resolve, 0 EV violations, tera types valid — so this is a latent tooling gap, not a live data bug.)

**Blast radius**: The validator would miss exactly the class of regression it exists to catch if builds.csv is regenerated with a bad reference or a gen-9 entry is removed while a lower-gen patch key remains.

**Fix sketch**: Restrict reference targets to the `'9'` layer in `loadJsonByGen`, and add a builds.csv pass (same row parser as `loadBuildsCSV`: `/`-split move slots, `|`-split option fields, "No Item" sentinel).

**Verification**: Temporarily rename one gen-9 move key that also exists in a lower gen layer and confirm the updated validator flags builds referencing it; re-run on pristine data → 0 findings.

