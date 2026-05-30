---
severity: P2
category: data
anchor_symbol: convertSmogonSet
current_line_hint: ~12211
file: data/builds/gen8.json
agents: [data-integrity-auditor]
fingerprint: 364230245444
confidence: high
status: wontfix-claude/focused-cori-sGNzn (unused mirror data — verified the loader reads only the gen-9 key; these older-gen entries are never read)
---

**Title**: Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv

**Evidence**:
```js
// data/builds/gen8.json — Mewtwo/balancedhackmons/Sheer Force
{"moves":["Nasty Plot","Psychic","Blue Flare",["Strength Sap","Ice Beam"]],
 "ability":"Sheer Force","item":"Life Orb","ivs":{"atk":0},
 "evs":{"hp":252,"def":252,"spa":252,"spd":252,"spe":252}}  // sum = 1260 (cap is 510)
// convertSmogonSet (battle.html:12245) passes evs straight through — no total clamp.
```

**Repro**: `node -e 'const d=require("./data/builds/gen8.json");const e=d.Mewtwo.balancedhackmons["Sheer Force"].evs;console.log(Object.values(e).reduce((a,b)=>a+b,0))'` → 1260. Authoritative source has none: scan of `data/builds.csv` yields 0 rows with EV total >510 (counts: gen5=1, gen6=3, gen7=47, gen8=125, gen9=37; total 213 in the mirror, 0 in CSV).

**Blast radius**: `data/builds/gen*.json` is the offline fallback consumed by `fetchSmogonSetsForGen` → `populateCsvBuildsFromAPI` when `builds.csv` can't be fetched (e.g. file:// protocol). On that path `convertSmogonSet` does not validate EV totals, so a Pokémon can be built with 1260 EVs, producing stats no legal Pokémon can reach. The CSV (primary path) is clean, so this only bites the fallback.

**Fix sketch**: Regenerate the gen*.json mirror from the same pipeline that produced builds.csv (they have drifted), or add a total-EV clamp/normalization in `convertSmogonSet`. Treat the CSV as the single source of truth and make the JSON a derived artifact.

**Verification**: After regeneration, `node` scan over all `data/builds/gen*.json` for `sum(evs) > 510` returns 0, matching the CSV.

---
severity: P3
category: data
anchor_symbol: convertSmogonSet
current_line_hint: ~12238
file: data/builds/gen5.json
agents: [data-integrity-auditor]
fingerprint: d5fa11ffea9f
confidence: high
status: wontfix-claude/focused-cori-sGNzn (unused mirror data — verified the loader reads only the gen-9 key; these older-gen entries are never read)
---

**Title**: 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows

**Evidence**:
```js
// data/builds/gen5.json — Aron/vgc2012/Level 1 Sturdy (no "nature" key)
{"moves":["Endeavor","Toxic","Sleep Talk","Protect"],"item":"Berry Juice"}
// also: Solosis/vgc2012/FEAR, gen8 Mewtwo/balancedhackmons/Sheer Force,
// gen9 Landorus/godlygift, Great Tusk/ubersuu, Iron Treads/ubersuu
```

**Repro**: `node -e 'const d=require("./data/builds/gen5.json");console.log("nature" in d.Aron.vgc2012["Level 1 Sturdy"])'` → false. CSV scan (`nature` is column 8) shows 0 blank-nature rows across 17397 rows.

**Blast radius**: Low. The fallback consumer `convertSmogonSet` (battle.html:12238) defaults a missing nature to `'Hardy'`, so the build still loads — but Hardy is neutral, silently dropping the intended nature (e.g. the Aron set is a Level-1 FEAR set whose nature is irrelevant, but Great Tusk/Iron Treads scarf sets lose their speed/offense nature). Only on the offline fallback path.

**Fix sketch**: Regenerate the mirror from the CSV pipeline (same root cause as the EV-total drift) so every build carries the CSV's nature, or have the generator emit the CSV default (`Hardy`) explicitly rather than omitting the key.

**Verification**: `node` scan over `data/builds/gen*.json` for builds lacking a `nature` key returns 0.

---
severity: P2
category: data
anchor_symbol: fetchSmogonSetsForGen
current_line_hint: ~12169
file: data/builds/gen4.json
agents: [data-integrity-auditor]
fingerprint: 51f176d8cb95
confidence: high
status: wontfix-claude/focused-cori-sGNzn (unused mirror data — verified the loader reads only the gen-9 key; these older-gen entries are never read)
---

**Title**: gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive)

**Evidence**:
```js
// data/builds/gen4.json — Quagsire/pu/Defensive
{"moves":[["Toxic","Curse"],"Recover","Earthquake","Waterfall"],
 "ability":"Water Absorb","item":"Leftovers","nature":"Impish",
 "evs":{"hp":252,"def":200,"spd":56},"teratypes":"Water"}  // Tera is Gen 9 only
```

**Repro**: `node -e 'const d=require("./data/builds/gen4.json");console.log(d.Quagsire.pu.Defensive.teratypes)'` → `Water`. Terastallization did not exist before Gen 9. The authoritative CSV row `Quagsire,regular,4,pu,...` has an empty `teratypes` column (and a different tag), so the mirror entry does not even correspond to the CSV row.

**Blast radius**: Low/cosmetic. `convertSmogonSet` will pass the stray `teratypes` into `_teratypes`, so a Gen-4 Quagsire in the fallback path could be offered a Tera type, which is a mechanic that should not exist in a Gen-4 context. Symptom of the mirror being regenerated from a different/newer pass than the CSV.

**Fix sketch**: Regenerate the mirror from the CSV (single source of truth); the generator should drop `teratypes` for any build whose `gen < 9`.

**Verification**: `node` scan over `data/builds/gen[4-8].json` for any build carrying `teratypes`/`teraType` returns 0.

---
severity: P3
category: data
anchor_symbol: loadGameData
current_line_hint: ~10173
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 0bb12c949196
confidence: high
status: wontfix-claude/focused-cori-sGNzn (intended — gen-9-only loader by design; the ~2800 older-gen keys are vestigial Showdown-format mirror, not read)
---

**Title**: Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read

**Evidence**:
```js
const speciesJSON  = speciesJSONOrig['9'] || {};   // gens 1-8 discarded
const movesJSON    = movesJSONOrig['9']   || {};
const naturesJSON  = naturesJSONOrig['9'] || {};
const itemsJSON    = itemsJSONOrig['9']   || {};
const abilitiesJSON= abilitiesJSONOrig['9']|| {};
```

**Repro**: `node -e 'for(const f of ["moves","species","abilities","items"]){const o=require("./data/"+f+".json");const g9=new Set(Object.keys(o["9"]));let older=0;for(const g of Object.keys(o)){if(g==="9")continue;older+=Object.keys(o[g]).length;}console.log(f,older)}'` → moves 1253, species 504, abilities 463, items 606 older-gen entries. Every older-gen key also exists in gen 9, so these are Pokémon-Showdown per-gen override deltas (e.g. Bide `type:"???"` in gen 1/4), not distinct content — and the gen-9-only loader never applies them.

**Blast radius**: None functionally (the engine is intentionally a single-gen-9 dex), but ~2.8k dead delta entries inflate the four large JSON payloads (~1.9 MB combined) that load on every boot, and they invite future confusion ("why is my gen-4 Bide edit ignored?"). Pure dead-data / payload bloat.

**Fix sketch**: Either strip the non-`"9"` gen blocks from the shipped JSON (smaller boot payload) or, if multi-gen support is planned, wire a per-gen merge that actually applies `inherit:true` deltas. Document that the runtime is gen-9-only.

**Verification**: Boot-time payload shrinks; `Object.keys(JSON)` of each shipped data file is `["9"]` only (if stripped), or the loader demonstrably reads the chosen gen block (if multi-gen is added).

---
severity: P3
category: data
anchor_symbol: loadBuildsCSV
current_line_hint: ~10454
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: a937264b3e0e
confidence: medium
status: fixed-claude/focused-cori-sGNzn (documented the NO_ITEM sentinel contract at the declaration)
---

**Title**: `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html)

**Evidence**:
```js
// battle.html:10454 (loadBuildsCSV) — the only declaration of the sentinel
i: !itemPicked ? '' : itemPicked === 'No Item' ? 'NO_ITEM' : itemPicked,
// data/items.json has no key "noitem" and no entry whose name === "No Item".
```

**Repro**: `node -e 'const i=require("./data/items.json")["9"];console.log(Object.keys(i).some(k=>k==="noitem")||Object.values(i).some(e=>e&&e.name==="No Item"))'` → false. The CSV uses the literal `No Item` in the `item` column; the engine special-cases it to `NO_ITEM` at load and the data-validator skips it. It works today, but the empty-held-item enum is defined implicitly in three places (CSV value `No Item`, runtime token `NO_ITEM`, display fallback) with no canonical declaration.

**Blast radius**: Low. No current bug — the string is handled. Risk is drift: a new code path that reads `mon.item` and looks it up in `items.json` (e.g. a new tooltip or shop screen) would miss the sentinel and either render nothing or crash, since `items.json` cannot resolve it. Same class of implicit-enum fragility as a missing reference.

**Fix sketch**: Document the empty-held-item sentinel contract in one place (constant + comment), or add a synthetic `No Item` / `NO_ITEM` entry to items.json (or a shared constants module) so every consumer resolves it identically. Read-only finding — no data edit performed.

**Verification**: Grep shows a single canonical definition of the empty-item sentinel; any `items.json` lookup of `mon.item` resolves for the empty slot without a special-case branch.

