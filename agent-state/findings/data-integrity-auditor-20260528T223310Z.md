---
severity: P3
category: data
anchor_symbol: makeBuild
current_line_hint: ~10868
file: data/builds/gen5.json
agents: [data-integrity-auditor]
fingerprint: 7a62964308d8
confidence: high
status: open
---

**Title**: 7 build abilities (Telepathy/Mountaineer/Friend Guard/Healer/Pickup/Rebound/Symbiosis) are silent no-ops the engine never implements

**Evidence**:
```json
// data/builds/gen5.json — Wobbuffet/ou/"Death Fodder"
"ability": "Telepathy"
// data/builds/gen4.json — Syclant/cap/"Choice Band"
"ability": "Mountaineer"
```
These 7 ability names exist in `data/abilities.json` but their literal strings appear **nowhere** in `battle.html` (verified by full-text search) — no `mon.ability === "..."`, no lookup-map key, no `.includes()`. The engine loads only gen9 builds, and when `makeBuild` rolls one of these slots the ability is a cosmetic label with zero mechanical effect.

**Repro**: `node -e` over `data/builds/*.json` collecting `ability` values, then grep each literal in `battle.html`: Telepathy (23 builds), Mountaineer (16), Friend Guard (6), Healer (5), Pickup (2), Rebound (2), Symbiosis (2) — 56 build-slots total, 0 hits each in the engine.

**Blast radius**: Low. Telepathy/Friend Guard/Healer/Symbiosis are doubles-only (inert in this singles engine anyway); Mountaineer/Rebound are CAP-only (Rock/Ground switch-in immunity and a Magic-Bounce clone — genuinely missing on Syclant/Colossoil CAP sets); Pickup is field-only. No crash; the mon just battles as if abilityless for that trait. Contrast with the otherwise-thorough 275-ability coverage (Rock Head, Shield Dust, type-resist berries, etc. are all handled via maps).

**Fix sketch**: Either (a) implement the two competitively-relevant ones (Mountaineer switch-in immunity in the type-immunity path near `abilityImmunity`; Rebound alongside `Magic Bounce`) and accept the doubles-only ones as inert, or (b) document these as known-inert and have `makeBuild`/the tutor pool prefer an implemented co-slot ability when one exists. No data edit required.

**Verification**: After (a), a Syclant holding Mountaineer takes 0 from a switch-in Stealth Rock / first Ground or Rock hit; grep `battle.html` for "Mountaineer" and "Rebound" returns engine hits. After (b), rolled builds never surface an unimplemented ability when a legal implemented alternative exists.

---
severity: P3
category: data
anchor_symbol: ALL_MEGA_STONES
current_line_hint: ~10667
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 47fd5985be47
confidence: high
status: open
---

**Title**: items.json defines 93 mega stones but the engine recognizes only 51 — 45 non-canonical stones are inert data

**Evidence**:
```js
// battle.html ~10667 — engine's authoritative mega-stone set (51 canonical + orbs/rusted)
const ALL_MEGA_STONES = new Set(['Red Orb','Blue Orb','Rusted Sword','Rusted Shield','Venusaurite', ... 'Crucibellite']);
// data/items.json carries 93 isMegaStone items, incl. fan/CAP stones with no MEGA_FORM_NAMES entry:
// Greninjite, Dragoninite, Heatranite, Magearnite, Zygardite, Raichunite X/Y, Absolite Z, ...
```

**Repro**: Collect `name` of every `items.json` entry with `megaStone:true` (93) and diff against the `ALL_MEGA_STONES`/`MEGA_FORM_NAMES` literals in `battle.html` (51 + 2 orbs + 2 rusted). 45 stones have no engine entry. None of the 45 appear in any `data/builds/*.json` item slot (verified), so they are currently unreachable.

**Blast radius**: None today — `_buildGimmickFromItem`-style logic gates MEGA on `isMegaStone(item) && MEGA_FORM_NAMES[item]` (battle.html ~12142), so an unrecognized stone never assigns a MEGA gimmick, and no build references one. Risk is latent: any future feature that grants/sells items.json mega stones (or a dex/item browser) would hand the player a stone that silently can't mega-evolve.

**Fix sketch**: Either prune the 45 non-canonical `megaStone` flags from `data/items.json` to match the engine's supported set, or (if these are intentionally retained as a Smogon/CAP export) add a comment/manifest noting that only the 51 in `ALL_MEGA_STONES` are functional and keep the gimmick gate as the single source of truth. No engine change needed.

**Verification**: `Object.values(items.json).filter(i=>i.megaStone).length` equals `ALL_MEGA_STONES.size` minus orbs/rusted (option A); or the gate at ~12142 demonstrably blocks an unmapped stone (option B) — confirm a mon given "Greninjite" never shows a MEGA badge.

---
severity: P2
category: inconsistency
anchor_symbol: resolveCsvBuildEntry
current_line_hint: ~10440
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 76a92ca8e149
confidence: high
status: open
---

**Title**: ISSUE-038 is marked fixed but `No Item` is still absent from items.json and 11 build slots still reference it

**Evidence**:
```js
// scripts/debug/data-validator.mjs ~119 — the validator only passes because it skips the sentinel:
if (field === 'item' && alt === 'No Item') continue;
// data/items.json still has NO entry named "No Item" (verified); 11 build slots still use it:
// gen8 (6): Vileplume/nu, Ninjask/pu, Giratina/godlygift, Gourgeist-Super/pu, Palossand/nu, ...
// gen9 (5): ...
```
The ledger records `ISSUE-038` with `status: fixed-claude/sharp-keller-eZEDN`, but the underlying data was never changed: items.json has no `No Item` entry and the 11 `data/builds/gen{8,9}.json` slots still carry `"No Item"` in their item arrays.

**Repro**: `node` scan of `data/builds/*.json` finds 11 slots whose `item` array includes `"No Item"` (gen8:6, gen9:5); a scan of `data/items.json` for `name === "No Item"` returns nothing. `node scripts/debug/data-validator.mjs` reports 0 findings only because line ~119 special-cases the sentinel.

**Blast radius**: Same as ISSUE-038 (combat works via the `'No Item'`→empty-slot sentinel fallthrough; only tooltip/`itemsJSON[norm('No Item')]` lookups get `undefined`). The new fact is the **status drift**: the issue is closed in the ledger while the data fix is absent, so anyone trusting the ledger believes this is resolved. Either the fix branch was never merged or it took option (b) (encode as absence) without migrating the 11 slots.

**Fix sketch**: Re-open ISSUE-038 (or land its intended fix) — add a placeholder `No Item` entry to `data/items.json`, OR migrate the 11 build slots to `null`/omit the alternative. Then drop the special-case skip at data-validator.mjs ~119 so the validator actually guards the invariant going forward.

**Verification**: After the fix, `data/items.json` has a `No Item` entry (or the 11 slots no longer contain `"No Item"`), and removing the validator's line ~119 skip still yields 0 missing-item findings.

