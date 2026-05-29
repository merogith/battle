---
severity: P3
category: data
anchor_symbol: missingno
current_line_hint: ~10313
file: data/species.json
agents: [data-integrity-auditor]
fingerprint: d24d3edfe5d0
confidence: high
status: open
---

**Title**: species.json missingno has invalid type "Bird" (not in type-chart.json)

**Evidence**:
```json
"missingno": { "num": 0, "name": "MissingNo.", "types": ["Bird","Normal"], ... }
```

**Repro**: `node -e` over data/species.json gen9 — only species with an out-of-chart type. "Bird" is not one of the 18 modern types in data/type-chart.json.

**Blast radius**: None at runtime. The loader at battle.html:10313 filters `s.num <= 0` before computing type effectiveness, and missingno has num=0, so "Bird" never reaches the type chart. Purely a latent data anomaly.

**Fix sketch**: Either drop the missingno joke entry or change its primary type to a real type (e.g. "Normal","Flying"). No engine code change needed.

**Verification**: Re-run the type cross-check; confirm 0 species reference an out-of-chart type.

---
severity: P3
category: data
anchor_symbol: customMegaStones
current_line_hint: ~10353
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 43c2934a4f98
confidence: high
status: open
---

**Title**: 19 custom (isNonstandard) mega stones in items.json lack tooltip desc

**Evidence**:
```json
"absolitez": {"name":"Absolite Z","megaStone":...,"isNonstandard":...} // no shortDesc/desc
```

**Repro**: scan items.json gen9 for entries with neither shortDesc nor desc — all 19 are fan-made mega stones (Absolite Z, Baxcalibrite, Heatranite, Magearnite, Raichunite X/Y, Zeraorite, etc.), all flagged isNonstandard.

**Blast radius**: Cosmetic only. battle.html:10355 builds tooltipDict from item.shortDesc||desc; these items get no hover tooltip. They are non-standard so unlikely to appear on canonical sets.

**Fix sketch**: Add a one-line shortDesc to each, or accept the gap since they are isNonstandard.

**Verification**: Re-scan; confirm desc-less item count drops to 0 (or that all remaining are intentionally isNonstandard).

---
severity: P3
category: data
anchor_symbol: legacyGen2Berries
current_line_hint: ~36199
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 2dfaa260dfa1
confidence: medium
status: open
---

**Title**: 10 legacy Gen2 berries in items.json have no engine handler/reference

**Evidence**:
```
Unreferenced berries: Berry, Bitter Berry, Burnt Berry, Gold Berry, Ice Berry,
Mint Berry, Miracle Berry, Mystery Berry, PRZ Cure Berry, PSN Cure Berry
```

**Repro**: For each items.json gen9 entry with isBerry:true, grep its name as a quoted literal in battle.html. 67/77 are referenced; these 10 are not.

**Blast radius**: None for modern play. These are pre-Gen3 berries (renamed to Oran/Lum/Aspear/etc. in Gen3) and do not appear on the modern (Gen9) roster the engine actually serves. Dead data only.

**Fix sketch**: Optionally prune from items.json gen9, or leave as harmless legacy entries. No handler needed because they cannot be assigned in modern sets.

**Verification**: Confirm no build/shop/set references any of the 10 names.

