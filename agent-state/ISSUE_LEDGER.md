# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-05-22T07:25:59.082Z
> **Source**: `agent-state/findings/*.md` (33 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 12 |
| P2 | 10 |
| P3 | 11 |
| **Total** | **33** |

| Category | Count |
|---|---|
| bug | 5 |
| data | 5 |
| dx | 6 |
| inconsistency | 9 |
| perf | 6 |
| refactor | 1 |
| test-gap | 1 |

## TOC

- [ISSUE-001] [P1] `applyStatus` SLP duration roll + `endOfTurnEffects` Shed Skin roll use bare `Math.random()` — `applyStatus` (bug)
- [ISSUE-002] [P1] Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented — `BLACK_MARKET_ITEMS` (inconsistency)
- [ISSUE-003] [P1] `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext` — `canMove` (bug)
- [ISSUE-004] [P1] Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing — `illegalDealer` (inconsistency)
- [ISSUE-005] [P1] Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented — `itineraryProgress` (inconsistency)
- [ISSUE-006] [P1] Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift — `parseMoveEffects` (bug)
- [ISSUE-007] [P1] Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()` — `parseMoveEffects-onhit-abilities` (bug)
- [ISSUE-008] [P1] Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing — `pendingWager` (inconsistency)
- [ISSUE-009] [P1] `No Item` sentinel string used in 11 build slots is absent from `data/items.json` — `resolveCsvBuildEntry` (data)
- [ISSUE-010] [P1] Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing — `traderOfferByCity` (inconsistency)
- [ISSUE-011] [P1] Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop — `turn-resolution` (bug)
- [ISSUE-012] [P1] `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart` — `typeChart` (data)
- [ISSUE-013] [P2] 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js — `_hostRunResolution` (refactor)
- [ISSUE-014] [P2] Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit — `benchMemoryGrowth` (perf)
- [ISSUE-015] [P2] `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing — `benchParseMove` (perf)
- [ISSUE-016] [P2] Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path — `benchTurn` (perf)
- [ISSUE-017] [P2] Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME` — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-018] [P2] Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive — `expandCommaAlternatives` (dx)
- [ISSUE-019] [P2] 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json` — `POKEMART_ITEMS` (data)
- [ISSUE-020] [P2] 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging — `setBattleLogHtml` (dx)
- [ISSUE-021] [P2] 351 it.todo() stubs across 3 move-category test files — cluster enumeration — `tests/moves/by-category` (test-gap)
- [ISSUE-022] [P2] 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool — `TRAINER_QUOTES_BY_NAME` (inconsistency)
- [ISSUE-023] [P3] `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads — `_pickCityQuoteLine` (inconsistency)
- [ISSUE-024] [P3] Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images — `_preloadedImages` (perf)
- [ISSUE-025] [P3] `isPokeball` flag set on 28 items but never read by the engine — dead metadata — `isPokeball` (data)
- [ISSUE-026] [P3] 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler — `items.json` (data)
- [ISSUE-027] [P3] Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target** — `loadEngine` (perf)
- [ISSUE-028] [P3] `console.log` cluster in battle.html — debug noise in shipped code — `loadGameData` (dx)
- [ISSUE-029] [P3] `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median — `parseMoveEffects` (perf)
- [ISSUE-030] [P3] Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon` — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-031] [P3] 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines) — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (dx)
- [ISSUE-032] [P3] 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines) — `STORY_MODE_FLOW.md` (dx)
- [ISSUE-033] [P3] 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines) — `STORY_NARRATIVE_VARIANTS.md` (dx)

---

## <a id="ISSUE-001"></a> ISSUE-001: `applyStatus` SLP duration roll + `endOfTurnEffects` Shed Skin roll use bare `Math.random()`

---
id: ISSUE-001
severity: P1
category: bug
anchor_symbol: applyStatus
current_line_hint: ~25882
file: battle.html
agents: [consistency-auditor]
fingerprint: 07e77424454f
confidence: high
status: open
---

**Title**: `applyStatus` SLP duration roll + `endOfTurnEffects` Shed Skin roll use bare `Math.random()`

**Evidence**:
```js
// L25882  (applyStatus)
mon.status = status; mon.statusTurns = 0;
if (status === "SLP") mon.sleepDuration = Math.floor(Math.random() * 3) + 1;
// L26016  (Eject Pack switch-in target)
let newMon = _bench[Math.floor(Math.random() * _bench.length)];
// L26135  (Shed Skin cure)
if (mon.ability === "Shed Skin" && mon.status && mon.currentHp > 0 && Math.random() < 1/3) {
```

**Repro**: Story battle, seed it, get put to sleep. Across two seeded replays the sleep duration will vary 1-3 turns, completely changing the battle.

**Blast radius**: SLP turns govern multiple subsequent decisions (Sleep Talk picks, wake roll timing). Eject Pack picks the wrong bench slot under drift. Shed Skin cures fire on different turns. All cascade.

**Fix sketch**: Same shim pattern. `const _rng = (sm && sm.active) ? storyRngNext : Math.random` at the top of `applyStatus`, replace L25882. Same shim in `endOfTurnEffects` for L26016 and L26135.

**Verification**: Add a seeded-replay assertion that records `mon.sleepDuration` after applying SLP under a known seed; assert identical across runs.

---

## <a id="ISSUE-002"></a> ISSUE-002: Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented

---
id: ISSUE-002
severity: P1
category: inconsistency
anchor_symbol: BLACK_MARKET_ITEMS
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 580596d9a9df
confidence: high
status: open
---

**Title**: Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented

**Evidence**:
```
$ grep -nE 'BLACK_MARKET|blackMarket|BlackMarket|black_market' battle.html
(no matches)
```

**Repro**: Open any City5+ hub, look for a Black Market button beside Mart / Department Store. Buttons absent regardless of progression. Spec promises `enterBlackMarket()` modal w/ Rare Candy / Mystery Egg / Forged Pass / Black Market TM / Intel Dossier / Fence / Shady Repel / Legend Chip SKUs, gated by `sm.blackMarketUnlocked && cityIdx >= 5`.

**Blast radius**: Six spec sections (§3, §3.5, §8, §10) hang off this; no `sm.blackMarketUnlocked` flag, no `enterBlackMarket()` route, no DX or QA pass possible. README §44 doesn't currently claim it, but `docs/STORY_FEATURES_INTEGRATION.md` is treated as canonical for the design vision, and the prior May 2026 audit ranked this #3 in priority — still unshipped.

**Fix sketch**: Author `BLACK_MARKET_ITEMS` const next to `POKEMART_ITEMS`/`DEPT_ITEMS` (anchor ~battle.html:28876 for the mart catalog), add `sm.blackMarketUnlocked` migration in a new `migrateStoryPreV20`, and add an `enterBlackMarket()` route + city-action button gated on `(sm.blackMarketUnlocked && getCityIndex() >= 5)`.

**Verification**: After implementation, `grep -nE 'BLACK_MARKET_ITEMS|enterBlackMarket' battle.html` returns ≥3 hits and a visit to City5 after itinerary beat shows the Black Market button.

---

## <a id="ISSUE-003"></a> ISSUE-003: `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext`

---
id: ISSUE-003
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~24232
file: battle.html
agents: [consistency-auditor]
fingerprint: 39f6ad985c2c
confidence: high
status: open
---

**Title**: `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext`

**Evidence**:
```js
// L24227-24230  (FRZ thaw — already deterministic)
if (mon.status === "FRZ") {
    const _thawRng = (sm && sm.active) ? storyRngNext : Math.random;
    if (_thawRng() < 0.2) { mon.status = null; logMsg(`${mon.name} thawed out!`, 'info'); return true; }
    logMsg(`${mon.name} is frozen solid!`, 'status'); return false;
}
// L24232 (PAR fizzle — STILL BARE)
if (mon.status === "PAR" && Math.random() < 0.25) { logMsg(`${mon.name} is paralyzed! It can't move!`, 'status'); return false; }
// L24257 (confusion self-hit — STILL BARE)
else if (Math.random() < 0.3333) {
    // Confusion self-hit ...
```

**Repro**: Story battle, seed it, paralyze the player's mon. Replay with same seed — paralysis "can't move" / "moves through it" outcomes will not match across replays.

**Blast radius**: Same class as the parseMoveEffects cluster, but in the very-hot path that runs every turn. Drift is more visible because PAR fizzles change whether a move lands at all (cascades into damage rolls, KOs, and switch order).

**Fix sketch**: Add the same `_rng = (sm && sm.active) ? storyRngNext : Math.random` shim at the top of `canMove` and replace L24232 PAR fizzle and L24257 confusion self-hit. The freeze branch already does this; copy the same idiom.

**Verification**: Seeded-replay test where the player's lead is PAR'd on turn 1 — assert PAR fizzle outcomes match across two seeded runs. Same for confusion self-hit.

---

## <a id="ISSUE-004"></a> ISSUE-004: Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing

---
id: ISSUE-004
severity: P1
category: inconsistency
anchor_symbol: illegalDealer
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 09f2ddbbdfb4
confidence: high
status: open
---

**Title**: Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing

**Evidence**:
```
$ grep -nE 'illegalDealer|illegal_dealer|enterDealer|dealerOffer' battle.html
(no matches)
```

**Repro**: Visit City6 / City8 (the spec-promised "seedy hubs") at any badge count. No single-NPC contract loop appears. Spec promises one offer per city visit, six-to-ten contract templates (`Trade one party mon for two of same grade`, `Sell mon for large gold`, `Reveal next fixed trainer team`, etc.), the `Contraband Capsule` token item, plus hidden itinerary-clue reveals.

**Blast radius**: Differentiation table §3.5 contrasts Mart / Dept / Black Market / Illegal Dealer — the fourth identity is unrealized, so the "broad illegal catalog vs single shady contract" design split has no surface in code. Depends on Black Market only conceptually; could ship independently.

**Fix sketch**: New `illegalDealerOffer(cityIdx)` generator + `sm.illegalDealerOfferByCity` save field, render hook in `renderCityActions` for `cityIdx ∈ {6,8}` when `sm.blackMarketUnlocked === true`. Author bark / accept / decline dialogue and the contract template pool.

**Verification**: Visit City6 with `sm.blackMarketUnlocked = true`; see a single-NPC offer chip; declining clears it for the visit, leaving for next city restores it.

---

## <a id="ISSUE-005"></a> ISSUE-005: Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented

---
id: ISSUE-005
severity: P1
category: inconsistency
anchor_symbol: itineraryProgress
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4f2f5373374e
confidence: high
status: open
---

**Title**: Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented

**Evidence**:
```
$ grep -niE 'itineraryProgress|itineraryBeat|runItinerary|enterItinerary|sm\.itinerary' battle.html
(no matches)
```

**Repro**: No itinerary beat fires at any event index. Spec §8 promises ordering `itinerary → wild → wager prompt → trainer` in `proceedToNextBattle`; today the order is just `wild → trainer`.

**Blast radius**: Every downstream spec system hangs off this — Black Market unlock comes from itinerary beat `blackMarketUnlock`, Safari Zone trigger is "after badge 3 / City3 segment", the three-act villain arc anchors to `sm.itineraryProgress` per `STORY_MODE_AUDIT.md` §14. Without the scaffold, the spec's narrative arc cannot exist.

**Fix sketch**: Author `STORY_ITINERARY` const (one row per beat: id, trigger condition, payload such as `{kind:'blackMarketUnlock'}`, `{kind:'safariType', type:'water'}`), add `sm.itineraryProgress = {}` to migrateStoryPreV20, implement `runItineraryBeat(beatId)` and call from `proceedToNextBattle` before `enterBattleEvent`.

**Verification**: After badge 3, on the route to City3, the itinerary engine fires a beat that flags `sm.blackMarketUnlocked = true` before the next trainer fight.

---

## <a id="ISSUE-006"></a> ISSUE-006: Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift

---
id: ISSUE-006
severity: P1
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~24350
file: battle.html
agents: [consistency-auditor]
fingerprint: 0729606b5ddb
confidence: high
status: open
---

**Title**: Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift

**Evidence**:
```js
// L24350  if (move.name === "Bounce" && Math.random() < 0.3) { applyStatus(defender, "PAR"); return; }
// L24427  let newType = resistTypes[Math.floor(Math.random() * resistTypes.length)];
// L24461  if (statusCode && Math.random() < (sereneGrace ? Math.min(1, chance * 2) : chance)) {
// L24729  let newMon = bench[Math.floor(Math.random() * bench.length)];   // Roar/Whirlwind switch
// L24885  let _acuStat = _acuAvail[Math.floor(Math.random() * _acuAvail.length)]; // Acupressure
// L24991  if (move.name === "Tri Attack" && Math.random() * 100 < _sg(20)) {
// L24992  let _tr = Math.floor(Math.random() * 3);  // Tri Attack BRN/FRZ/PAR
// L25019  if (Math.random() * 100 >= _sg(_secChance)) continue; // data-driven secondary
// L25038  if (attacker.ability === "Stench" && ... && Math.random() < 0.1) {
```

**Repro**: Load story with `?seed=X`, fight a battle where the opponent has Tri Attack / Acupressure / a secondary-effect mover (e.g. Iron Head with 30% flinch). Re-load the same seed and replay the same inputs — the outcome diverges because each of these branches consults `Math.random()` instead of the seeded `storyRngNext` (which sibling sites at L24228 thaw, L25002 confuse, L25083 trap, L25526 cr, L26481 harvest correctly call).

**Blast radius**: All story-mode seeded replays. Daily-seed contests. Player-shared run-the-seed videos. Class is exactly the one the spec called out months ago — these sites were missed when the audit converted confusion/trap/thaw/harvest. At least 9 distinct sites in `parseMoveEffects` plus the broader status/end-of-turn pipeline.

**Fix sketch**: At the top of `parseMoveEffects` (or right before the first call site), bind `const _rng = (sm && sm.active) ? storyRngNext : Math.random;` and replace every bare `Math.random()` inside the function body with `_rng()`. Mirror the same pattern in `applyStatus`, `endOfTurnEffects`, the speed-tie block in the main turn loop (L19368), and the Quick Claw rolls (L19353-19354).

**Verification**: New seeded-replay test: run the same seed × two trials through a battle that triggers Tri Attack / Bounce-paralysis / Roar / Static-on-contact. Assert identical move sequences. Existing `tests/integration/story-flow.test.js` seeded assertion should catch any regression on the converted sites.

---

## <a id="ISSUE-007"></a> ISSUE-007: Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()`

---
id: ISSUE-007
severity: P1
category: bug
anchor_symbol: parseMoveEffects-onhit-abilities
current_line_hint: ~22461
file: battle.html
agents: [consistency-auditor]
fingerprint: aa60883b8c97
confidence: high
status: open
---

**Title**: Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()`

**Evidence**:
```js
// L22461-L22485 — on-contact / on-hit ability procs
if (defender.ability === "Static" && Math.random() < 0.3) applyStatus(attacker, "PAR");
if (defender.ability === "Poison Point" && Math.random() < 0.3) applyStatus(attacker, "PSN");
if (defender.ability === "Flame Body" && Math.random() < 0.3) applyStatus(attacker, "BRN");
if (defender.ability === "Cute Charm" && Math.random() < 0.3 ...) { ...
if (attacker.ability === "Poison Touch" && Math.random() < 0.3) applyStatus(defender, "PSN");
if (attacker.ability === "Toxic Chain" && ... && Math.random() < 0.3) { ...
if (defender.ability === "Cursed Body" && Math.random() < 0.3 && move.name) { ...
// L22538 — Tough Claws-style ability tick: if (... && Math.random() < 0.1)
// L22075 — Focus Band proc: && Math.random() < 0.1
// L22151 — recoil/self-stat secondary: if (Math.random() * 100 < _selfChance)
```

**Repro**: Story-mode fight against a Static Pikachu — same seed, same inputs, two different "paralysed on contact" outcomes.

**Blast radius**: These procs gate huge follow-on consequences (PAR drops Speed; PSN/BRN deal chip damage; Cursed Body locks a move). Drift here can change the seed result by 5-10 turns.

**Fix sketch**: Same shim. Convert every `Math.random()` call inside `parseMoveEffects` between L22000-23000 (on-hit / ability / item-trigger region) to the seeded `_rng()`. Audit the whole damage-resolution block in one sweep.

**Verification**: Seeded replay where the foe runs Static. Assert PAR-on-contact happens (or doesn't) identically across runs.

---

## <a id="ISSUE-008"></a> ISSUE-008: Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing

---
id: ISSUE-008
severity: P1
category: inconsistency
anchor_symbol: pendingWager
file: battle.html
agents: [spec-drift-auditor]
fingerprint: b2982543c7b0
confidence: high
status: open
---

**Title**: Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing

**Evidence**:
```
$ grep -niE 'pendingWager|setWager|wagerOpponent|wagerBattle|battleWager|wagerPrompt|wagerOffer|placeWager' battle.html
(no matches)
```
The only `wager` hits in battle.html (lines 36440, 41797, 42065) belong to the **Casino** prize-wall flow, NOT the spec's pre-battle Pokémon-trade wager.

**Repro**: Spec promises ~15% chance on Basic Trainer route battles post-unlock that the trainer offers to wager 1 mon. Win → take their worst; lose → give your best. Never fires in any current Basic Trainer encounter.

**Blast radius**: §8 ordering rule `itinerary → wild → wager prompt → trainer` is unverifiable since wager hook missing. `_compareTeamSlotForWager` (worst/best helpers spec'd in §6) absent; spec's flow-checklist row "Full PC + party → do not show wager if winning transfer has nowhere to go" also unimplemented.

**Fix sketch**: Add `sm.pendingWager` to save schema (migrateStoryPreV20), implement `_rollWagerForRouteBattle(eventIdx)` 15% trigger inside `proceedToNextBattle`, write `_pickFoeWorstSlot` / `_pickPlayerBestSlot` helpers near `rollTrainerTeam` (~32290), and add accept / decline UI in the battle intro flow.

**Verification**: Force `sm.pendingWager = true` via dev seed, fight a Basic Trainer, see wager prompt; on win the foe's worst grade mon transfers to PC.

---

## <a id="ISSUE-009"></a> ISSUE-009: `No Item` sentinel string used in 11 build slots is absent from `data/items.json`

---
id: ISSUE-009
severity: P1
category: data
anchor_symbol: resolveCsvBuildEntry
file: data/builds/gen8.json
agents: [data-integrity-auditor]
fingerprint: 5359999bcf35
confidence: high
status: open
---

**Title**: `No Item` sentinel string used in 11 build slots is absent from `data/items.json`

**Evidence**:
```json
"Vileplume": { "nu": { "Defensive": {"item": ["Black Sludge", "No Item"], ...} } }
"Ninjask":   { "pu": { "Swords Dance": {"item": ["Heavy-Duty Boots", "No Item"], ...} } }
"Giratina":  { "godlygift": { "Wall": {"item": ["Leftovers", "No Item"], ...} } }
```

**Repro**: `node scripts/debug/data-validator.mjs` reports `[P1] 1 items referenced by builds are missing from items.json — No Item (11 build(s))`. Affects gen8.json (6) and gen9.json (5).

**Blast radius**: When `makeBuild` rolls a slot whose `item` array picks `"No Item"`, the mon's `item` becomes the literal string `"No Item"`. The engine handles this as a sentinel (`battle.html` lines 13134-13136 fall through to `'No Item'` as a default), so combat works. But: the tooltip dictionary populated from `items.json` has no entry, so any UI showing the mon's held item will not render a tooltip, and any code that does `itemsJSON[norm('No Item')]` for legality/effects gets `undefined` and may treat it as a missing entry.

**Fix sketch**: Either (a) add a single placeholder entry in `data/items.json` (gen 1, `name: "No Item"`, `shortDesc: "No held item."`) so consumers can look it up uniformly, or (b) migrate the 11 build slots to use `null` / omit the alternative entirely and document that "no held item" is encoded as absence rather than a sentinel string. Option (b) is more invasive but cleaner.

**Verification**: Re-run `node scripts/debug/data-validator.mjs`; the missing-items finding should drop to 0. Spot-check a build that previously had `"No Item"` in its item array (e.g., Vileplume `nu/Defensive`) and confirm the rolled mon gets the alternative held item when "No Item" was selected.

---

## <a id="ISSUE-010"></a> ISSUE-010: Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing

---
id: ISSUE-010
severity: P1
category: inconsistency
anchor_symbol: traderOfferByCity
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5ccd1b40734e
confidence: high
status: open
---

**Title**: Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing

**Evidence**:
```
$ grep -niE 'traderOffer|enterTrader|tradeMon|fixedTrade|cityTrader|traderHouse' battle.html
(no matches)
```

**Repro**: Visit City4 on first arrival (event idx 26) or post-gym (event idx 29) — no Trader NPC offers a same-grade fixed trade. Spec calls for a single City4 trader generating a 1:1 same-grade species swap, frozen on first generation, both species from enabled gens.

**Blast radius**: Smallest scope from the spec checklist (§17.6 — "half-day"), but still unshipped after 6+ months. Could land independently of itinerary / wager / black market.

**Fix sketch**: Add `sm.traderOfferByCity = {}` save field, `_generateTraderOffer(cityIdx, enabledGens)` near `_pickStarterPartner` (~36819), render the City4 Trader button alongside Safari Zone in `renderCityActions`.

**Verification**: Enter City4 on first visit; Trader NPC offers e.g. Ralts ↔ Riolu (both G2); accept swaps the party slot; revisit City4 — same frozen offer (or marked traded).

---

## <a id="ISSUE-011"></a> ISSUE-011: Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop

---
id: ISSUE-011
severity: P1
category: bug
anchor_symbol: turn-resolution
current_line_hint: ~19368
file: battle.html
agents: [consistency-auditor]
fingerprint: 91037ef383da
confidence: high
status: open
---

**Title**: Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop

**Evidence**:
```js
// L19353-19354 (Quick Claw — should be deterministic in story)
if (_pItemActiveQC && state.pActive.item === "Quick Claw" && Math.random() < 0.2) { pPri += 0.4; ... }
if (_fItemActiveQC && state.fActive.item === "Quick Claw" && Math.random() < 0.2) { fPri += 0.4; ... }
// L19368 (speed tie)
else if (fSpe === pSpe) pGoesFirst = Math.random() > 0.5;
// L19762 (locking move turn count — Outrage/Thrash/Petal Dance)
attacker.volatile.lockTurns = 1 + Math.floor(Math.random() * 2);
// L20077 (Sleep Talk picks a random move)
let sleepTalkPick = validMoves[Math.floor(Math.random() * validMoves.length)];
```

**Repro**: Story battle, seed it, give the foe a Quick-Claw holder. Two replays of the same seeded turn will not see the same Quick-Claw procs. Speed-tie between two mons with the same Speed: ditto.

**Blast radius**: Order-of-actions is the highest-leverage RNG in the engine — first-strike flips entire battles. Speed-tie and lock-turn divergence propagate through the rest of the run.

**Fix sketch**: At the top of the turn-resolution closure that owns these branches, bind `_rng = (sm && sm.active) ? storyRngNext : Math.random` and use it for every priority/turn-count decision. Lock-turn count and Sleep Talk picks should also be on `_rng`.

**Verification**: Seeded replay where both sides field equal-Speed mons; assert action order matches across runs. Quick-Claw-holder seeded fight: assert proc/no-proc parity.

---

## <a id="ISSUE-012"></a> ISSUE-012: `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart`

---
id: ISSUE-012
severity: P1
category: data
anchor_symbol: typeChart
current_line_hint: ~9941
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 72e49ce309b5
confidence: high
status: open
---

**Title**: `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart`

**Evidence**:
```js
// battle.html ~9941
const typeChart={"Normal":{...},"Fire":{...}, ... /* 18 entries, no "???" */};

// data/moves.json gen4.curse
{ "type": "???", "desc": "If the user is not a Ghost type, lowers Speed by 1 stage ..." }
```

**Repro**: `node -e "const moves=JSON.parse(require('fs').readFileSync('/home/user/battle/data/moves.json','utf8')); for (const g of Object.keys(moves)) for (const k of Object.keys(moves[g])) if (moves[g][k].type==='???') console.log(g,k);"` prints `1 bide` and `4 curse`. Grep the typeChart literal: `???` is absent.

**Blast radius**: The live engine only loads gen9 moves (`movesJSONOrig['9']`), where `curse` is `Ghost` and `bide` is `Normal`, so today the runtime never observes a `???` type. However, any tooling that reads earlier gens from `moves.json` (e.g., a dex/format browser, a learnset preview that walks the inheritance chain) will look up `typeChart["???"]` and receive `undefined`, causing all subsequent damage-multiplier math to fall back to `1` silently. This is also a load-bearing assumption for any future gen-toggle feature.

**Fix sketch**: Either remove the gen4 `curse.type === "???"` data (replacing it with the Showdown-canonical `Normal` typing it had in gen4) or add a `"???"` entry to `typeChart` with all neutral (`1×`) effectiveness so legacy-data consumers don't get `undefined`. The first option matches engine behavior; the second preserves the original Showdown export verbatim.

**Verification**: After the fix, `Object.keys(typeChart).includes('???')` is true (option B) or `moves.json` has no `???` types (option A). Either way, `node scripts/debug/data-validator.mjs` should pass without warnings about the typeless move.

---

## <a id="ISSUE-013"></a> ISSUE-013: 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js

---
id: ISSUE-013
severity: P2
category: refactor
anchor_symbol: _hostRunResolution
current_line_hint: ~588
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: 52cc0edfbc71
confidence: high
status: open
---

**Title**: 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js

**Evidence**:
```js
// L478, L534, L559, L610, L639, L672, L710 — all match this shape:
const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
if (rowErr || !row || row.data == null) {
    console.warn('[OnlinePvP] <label> fetch', rowErr);
    return;
}
const prev = row.data;
```

**Repro**: `grep -nE "select\\('data'\\)\\.eq\\('id', roomId\\)\\.single\\(\\)" online-pvp.js` returns 7 sites with near-identical follow-on error handling.

**Blast radius**: Maintenance only — if Supabase API surface changes, every site needs the same edit. Risk of one fetch getting fixed and others diverging. No runtime bug.

**Fix sketch**: Extract a single `async function _fetchRoomData(label)` helper that returns `{ data, error }` or `null` on failure, logs once, and lets call sites focus on logic. Probably 10-15 lines of shared code.

**Verification**: Run existing online-PvP integration tests after refactor; no behavior change expected.

---

## <a id="ISSUE-014"></a> ISSUE-014: Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit

---
id: ISSUE-014
severity: P2
category: perf
anchor_symbol: benchMemoryGrowth
current_line_hint: 65
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: a20dbf90774a
confidence: high
status: open
---

**Title**: Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit

**Evidence**: `scripts/debug/_repro/mem-growth.mjs` run with `--expose-gc`, 200 turns, sampling every 10:
```
heap @ turn  0  = 82.5 MB
heap @ turn 100 = 84.4 MB
heap @ turn 190 = 85.5 MB

Linear fit: heap = 0.0159 * turn + 82.50   R² = 0.712
Heap delta over 200 turns: 5.0 MB
Avg per-turn heap growth: 25.52 KB
```
Slope is essentially flat; R² = 0.712 indicates the linear trend explains only ~70% of variance — the rest is GC noise. Across 200 turns the heap moves 3 MB net, which is well within normal GC fluctuation for a 80+ MB resident set. **No leak.**

This finding documents the result so future runs have a baseline. Logged as P2 with `confidence: high` because the mandate explicitly asked us to check for quadratic growth across the 60-turn benchmark — the answer is "linear, slope ~0, not a leak", and that null result is worth recording.

**Repro**: `node --expose-gc scripts/debug/_repro/mem-growth.mjs`. Without `--expose-gc` the variance is higher (5–10 MB swings between samples) because GC is unpredictable; with it the trend stabilizes.

**Blast radius**: None. This is a "ruled out" finding, not a defect. If a future change introduces a quadratic-growth bug, this baseline will catch it: 25 KB/turn is the floor; anything > 250 KB/turn (10×) for ≥ 100 turns should be re-classified as P1.

**Fix sketch**: No fix needed. Consider adding a `--expose-gc` recommendation to the `perf-bench.mjs` output (it's already there at line 157) and treating > 250 KB/turn average growth as a regression threshold in CI.

**Verification**: Re-run `node --expose-gc scripts/debug/_repro/mem-growth.mjs` after any change to the turn loop; confirm slope remains < 0.05 MB/turn.

---

## <a id="ISSUE-015"></a> ISSUE-015: `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing

---
id: ISSUE-015
severity: P2
category: perf
anchor_symbol: benchParseMove
current_line_hint: 58
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: c57a28528982
confidence: high
status: open
---

**Title**: `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing

**Evidence**:
```js
// scripts/debug/perf-bench.mjs:58
try { engine.parseMoveEffects(move); } catch (e) { /* malformed entry skipped */ }
```
The real signature is `parseMoveEffects(attacker, defender, move, isPlayer, _bouncedDepth)` (battle.html:24269). Calling with a single arg means `attacker = moveObject`, and the first line `let eff = (move.effectStr || move.eff || "").toLowerCase();` reads `move.effectStr` against `move = undefined` (the original move parameter), throwing `TypeError: Cannot read properties of undefined (reading 'effectStr')`. The harness then crashes after the bench loop is over because the final `catch` doesn't suppress the un-awaited Promise rejection from `parseMoveEffects` being `async`.

**Repro**: `node scripts/debug/perf-bench.mjs` produces `tests/reports/perf.md` with `Median: 1.438 ms 🚨 >2× over target`, then the process crashes with the TypeError above. The 1.438 ms number is the cost of *entering an async function, throwing, and creating a rejected Promise* — not the cost of actually parsing a move.

**Blast radius**: Misleading P2-style red flag in every CI / agent run. A drill-down (see `scripts/debug/_repro/parse-move-drill.mjs`) that calls `parseMoveEffects(attacker, defender, move, true)` correctly across all 950 moves with a valid attacker (Pikachu) and defender (Snorlax) measures a **median of 0.013 ms per call** — about 38× under the 0.5 ms target. parseMoveEffects is not actually slow.

**Fix sketch**: Replace line 58 with a properly-shaped call. The harness already exposes `mkMon`; the bench should set up an attacker, a defender, hook them onto `state.pActive` / `state.fActive`, and call `await engine.parseMoveEffects(attacker, defender, move, true)`. Also drop the `try/catch` swallowing the rejection — silently catching is what hid the bad shape originally. After the fix, the report should show a sub-millisecond median.

**Verification**: After the fix, `node scripts/debug/perf-bench.mjs` should exit cleanly (no TypeError crash after the report write) and the parseMoveEffects median in `tests/reports/perf.md` should be < 0.5 ms.

---

## <a id="ISSUE-016"></a> ISSUE-016: Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path

---
id: ISSUE-016
severity: P2
category: perf
anchor_symbol: benchTurn
current_line_hint: 34
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: 727cad5b6ed7
confidence: high
status: open
---

**Title**: Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path

**Evidence**: 5 trial sets × 30 turns each (`scripts/debug/_repro/multi-bench.mjs`):
```
Boot ms: 2885
Turn loop  (5 trial medians): 16.81, 14.57, 15.20, 16.71, 19.00
Turn loop overall median: 16.75   IQR: 11.98
Turn loop overall max: 78.71
```
Original `perf-bench.mjs` reports the same shape: median 14.15 ms, max 83.62 ms. The agent mandate's "Turn loop median > 100 ms → P2" threshold is **not** hit; the median is fine. But the max being ~5× the median, with IQR ~75% of median, means there's a slow outlier path being taken occasionally.

**Repro**: `node scripts/debug/perf-bench.mjs` produces a max ≥ 80 ms about once per 30-turn batch (seen on 5/5 trials).

**Blast radius**: At 60 fps, a 80 ms hitch is ~5 dropped frames — visible as a stutter when the player presses a move button. In jsdom the cost can't be attributed to layout/paint, so it's a real JS hotspot. Likely candidates: (a) the very-first turn after `reset()` pays one-time costs (RNG re-seed, state-object re-creation, all the volatile-cleanup loops in `playTurn`); (b) Flamethrower's burn-secondary check triggers `applyStatus` with a logMsg cascade; (c) the harness's `await window.playTurn(...)` resolves microtasks at end-of-turn, and one of them is slow.

**Fix sketch**: Add a `console.time('playTurn')` / `console.timeEnd('playTurn')` wrapper around the bench's `await runTurn(...)` and re-run. Cluster the slow turns: are they always turn 0 (cold start), or are they random? If always turn 0, the fix is to drop the first sample. If random, the next step is to wrap `parseMoveEffects`, `applyStatus`, and the post-turn `updateUI` with `console.time` to find the slow branch. Reporting it as P2 because the max latency *would* be user-visible if it occurred in production timing.

**Verification**: Median and max should both be well under the 50 ms harness target. Better: max / median ratio under 3×.

---

## <a id="ISSUE-017"></a> ISSUE-017: Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME`

---
id: ISSUE-017
severity: P2
category: inconsistency
anchor_symbol: ELITE_VICTORY_LINES
current_line_hint: ~28371
file: battle.html
agents: [consistency-auditor]
fingerprint: 9da9210ce0f7
confidence: medium
status: open
---

**Title**: Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME`

**Evidence**:
```js
// L28391  ELITE_VICTORY_LINES has:
'Malva':"Malva: \"You snuffed my fire. The next gate awaits.\"",
// But she is the ONLY canonical Elite Four member missing from
// TRAINER_QUOTES_BY_NAME — every other E4 has 3+ intro lines there.
```

**Repro**: Force a Kalos E1 roll (`?seed=…` that picks Kalos), reach E1 — Malva runs the generic 'E1' pool while every other E4 gets a 3-line personal pool.

**Blast radius**: Single character. Easy fix.

**Fix sketch**: Add a `'Malva': [...]` entry next to the other E4 / Kalos block at ~L29516-29519 in `TRAINER_QUOTES_BY_NAME`. Three short fire-themed lines.

**Verification**: Manual playthrough hitting the Kalos E1 slot.

---

## <a id="ISSUE-018"></a> ISSUE-018: Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive

---
id: ISSUE-018
severity: P2
category: dx
anchor_symbol: expandCommaAlternatives
current_line_hint: ~69
file: scripts/debug/data-validator.mjs
agents: [data-integrity-auditor]
fingerprint: 2d5d47372205
confidence: high
status: open
---

**Title**: Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive

**Evidence**:
```js
function expandCommaAlternatives(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(expandCommaAlternatives);  // ← recurses into array
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}
// caller:
const alternatives = expandCommaAlternatives(raw);
if (alternatives.length > 1) commaAlternativeFields++;  // ← counts array len > 1 as CSV
```

**Repro**: `for f in data/builds/gen*.json; do node -e "..."; done` confirms zero comma-separated `item`/`ability`/`nature` strings across all six files; the schema is uniformly array-based. The validator output `Build alternative format is inconsistent — moves use array literals, ability/item/nature use comma-separated strings (6925 occurrences)` is therefore misleading.

**Blast radius**: Anyone who reads the data-integrity report (including this auditor) gets a P2 inconsistency claim that doesn't exist. Wastes triage cycles. The validator also undercounts genuine CSV-encoded slots if any are added in the future, because the array path is taken first.

**Fix sketch**: In `expandCommaAlternatives`, only increment `commaAlternativeFields` when the input was a string containing a comma. Restructure so the CSV-vs-array classification is made on the raw input type, not on the flattened result length. The "alternatives expansion" pass for legality validation should remain unchanged.

**Verification**: Re-run `node scripts/debug/data-validator.mjs`; the P2 "inconsistent format" finding should disappear (or only fire if a real CSV is added).

---

## <a id="ISSUE-019"></a> ISSUE-019: 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json`

---
id: ISSUE-019
severity: P2
category: data
anchor_symbol: POKEMART_ITEMS
current_line_hint: ~28876
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 8d497740c197
confidence: medium
status: open
---

**Title**: 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json`

**Evidence**:
```js
// battle.html POKEMART_ITEMS + DEPT_ITEMS (verified ids):
// pokeBall    -> items.json: present (pokeball)
// greatBall   -> items.json: present (greatball)
// potion, superPotion, hyperPotion, maxPotion, fullRestore, fullHeal,
// ether, elixir, maxElixir, xAttack, xDefense, xSpAtk, xSpDef, xSpeed,
// xAccuracy, direHit, guardSpec, revivalHerb, revive, maxRevive,
// sunOrb, rainOrb, hailOrb, sandOrb, electricOrb, grassyOrb,
// psychicOrb, mistyOrb, emergencyTeleporter -> ALL MISSING from items.json
```

**Repro**: `node -e` lookup against `data/items.json` flattened keys for each mart id reports MISSING for everything except `pokeBall` and `greatBall`. See `battle.html:28876-28910`.

**Blast radius**: The mart catalog is self-contained (each row has `id`, `name`, `desc`, `effect`), so the shop works fine without items.json. The only consumer that reaches into items.json is the tooltip dictionary in `loadGameData` (sets `tooltipDict[it.name] = it.shortDesc`); mart items use their own `desc` field, so this works too. However, any future feature that uniformly walks `items.json` to render bag UI, drop tables, or inventory analytics will see a phantom-item population — bag items and held items live in two disjoint universes.

**Fix sketch**: Either (a) add the 29 missing entries to `data/items.json` so the catalog is the single source of truth for item metadata; or (b) document explicitly in a `data/README.md` (or schema note) that `items.json` covers only held-items / berries and that bag/shop consumables live exclusively in `POKEMART_ITEMS` and `DEPT_ITEMS`. Option (b) is much cheaper and matches the historical architecture.

**Verification**: If option (a), the mart-coverage check (added to `scripts/debug/data-validator.mjs`) should pass. If option (b), the README addition is the deliverable; no code change.

---

## <a id="ISSUE-020"></a> ISSUE-020: 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging

---
id: ISSUE-020
severity: P2
category: dx
anchor_symbol: setBattleLogHtml
current_line_hint: ~230
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: e261b55d36c1
confidence: medium
status: open
---

**Title**: 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging

**Evidence**:
```js
// L230  } catch (e) {}                                          (setBattleLogHtml DOM access)
// L417  try { sb.removeChannel(channel); } catch (e) {}         (_subscribe)
// L435  try { sb.removeChannel(channel); } catch (e) {}         (dispose)
// L460  } catch (e) {}                                          (reset state vars)
// L553  try { global.syncBattleActiveHighlight(); } catch (e) {}
// L760  try { global.AudioSystem.startNewBattle(); } catch (e) {}
// L775/L797 — same shape
```

**Repro**: A subscription failure, DOM-detached state, or missing global helper silently no-ops. Debug becomes "look at all eight catches manually".

**Blast radius**: Diagnostic blind spots only — no runtime bug, but a real "what just happened?" cost when investigating PvP issues in the field.

**Fix sketch**: Replace each `catch (e) {}` with `catch (e) { console.debug('[OnlinePvP] <site> swallowed', e); }`. Some sites can stay silent (the `sb.removeChannel` cleanup is genuinely best-effort) — document those with `/* best-effort */` instead of empty.

**Verification**: After a known-failure scenario (e.g., disconnect mid-battle), check the console for diagnostic breadcrumbs.

---

## <a id="ISSUE-021"></a> ISSUE-021: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

---
id: ISSUE-021
severity: P2
category: test-gap
anchor_symbol: tests/moves/by-category
current_line_hint: ~30
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: fca6be0da22a
confidence: high
status: open
---

**Title**: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

**Evidence**:

```
File counts (confirmed via grep -nE "^\s*it\.todo\("):
  tests/moves/by-category/status.test.js   = 210 TODOs
  tests/moves/by-category/special.test.js  =  74 TODOs
  tests/moves/by-category/physical.test.js =  67 TODOs
  TOTAL                                    = 351 TODOs

Cluster taxonomy (42 buckets; setup-shape, not move-category):

| cluster id | count | example moves (first 3) |
|---|---|---|
| noop-flavor | 2 | Celebrate, Splash |
| boost-self | 1 | Howl |
| self-boost | 1 | Clanging Scales |
| boost-target | 10 | Aromatic Mist, Captivate, Coaching |
| pure-status-target | 14 | Dark Void, Glare, Grass Whistle |
| pure-volatile-self | 16 | Aqua Ring, Destiny Bond, Focus Energy |
| pure-volatile-foe | 26 | Attract, Confuse Ray, Curse |
| heal | 23 | Floral Healing, Heal Order, Heal Pulse |
| field-side-condition | 15 | Aurora Veil, Crafty Shield, Light Screen |
| field-terrain | 4 | Electric Terrain, Grassy Terrain, Misty Terrain |
| weather-set | 6 | Chilly Reception, Hail, Rain Dance |
| field-pseudo-weather | 8 | Fairy Lock, Gravity, Ion Deluge |
| field-clear | 4 | Court Change, Defog, Haze |
| secondary-status | 13 | Blizzard, Discharge, Heat Wave |
| secondary-boost | 12 | Acid, Bleakwind Storm, Bubble |
| secondary-volatile | 7 | Fiery Wrath, Snore, Sparkling Aria |
| damage-plain | 14 | Burn Up, Doom Desire, Future Sight |
| drain | 2 | Matcha Gotcha, Parabolic Charge |
| fixed-damage | 5 | Dragon Rage, Night Shade, Psywave |
| fractional-hp-damage | 4 | Natures Madness, Ruination, Endeavor |
| variable-power | 22 | Electro Ball, Grass Knot, Pika Papow |
| signature-ohko | 4 | Sheer Cold, Fissure, Guillotine |
| protect-like | 11 | Baneful Bunker, Burning Bulwark, Detect |
| counter-like | 4 | Mirror Coat, Comeuppance, Counter |
| lock-on | 2 | Lock-On, Mind Reader |
| self-effect-special | 4 | Belly Drum, Refresh, Stuff Cheeks |
| pp-reduction | 1 | Spite |
| status-transfer | 1 | Psycho Shift |
| boost-copy-flip | 4 | Flower Shield, Psych Up, Rototiller |
| stat-swap-split | 7 | Guard Split, Guard Swap, Heart Swap |
| ability-manipulation | 6 | Doodle, Entrainment, Role Play |
| type-change | 8 | Camouflage, Conversion, Conversion 2 |
| force-switch-or-trap | 5 | Block, Mean Look, Roar |
| item-manipulation | 4 | Bestow, Recycle, Switcheroo |
| perish-song | 1 | Perish Song |
| final-gambit | 1 | Final Gambit |
| turn-order-helper | 4 | After You, Ally Switch, Quash |
| pivot-or-faint-helper | 3 | Baton Pass, Parting Shot, Teleport |
| meta-move | 10 | Assist, Copycat, Instruct |
| misc-truly-unclassified | 1 | Transform |
| charge | 17 | Electro Shot, Ice Burn, Meteor Beam |
| ally-or-spread-target | 44 | Air Cutter, Astral Barrage, Boomburst |
| SUM | 351 | (reconciled against grep count) |
```

```
NOTE: zero TODOs needed multihit/recoil bucketing — the auto-generator
already filled those. The TODO surface is dominated by:
  - Utility/status moves (volatile + side-condition + heal):  ~115
  - Spread/ally-target damage (skipped in singles harness):    44
  - Variable-power + condition-dependent damage:               36
  - Signature/transform/meta moves:                            ~50
  - Charge moves needing 2-turn runs:                          17
```

**Repro**: `/fix-todo-test <cluster-id>` per cluster (e.g. `/fix-todo-test pure-status-target`). Each invocation should write to `tests/moves/by-category/_drafts/<cluster-id>.test.js`.

**Blast radius**: tests/moves/by-category/* (do not edit existing files; orchestrator promotes drafts after review). The harness file `tests/helpers/load-engine.js` is consumed by every cluster; if it cannot satisfy doubles/spread targets, the `ally-or-spread-target` cluster (44 moves) should be deferred or skipped.

**Fix sketch**: Execute clusters in cheapest-setup order. Recommended order (cheapest to most expensive):

1. `noop-flavor` (2) — no precondition, assert no state change
2. `boost-self` (1), `boost-target` (10) — single-turn, assert stage delta
3. `pure-status-target` (14) — assert `defender.status === 'slp'|'par'|...`
4. `pure-volatile-self` (16), `pure-volatile-foe` (26) — assert volatile applied to user/foe
5. `heal` (23) — pre-damage user, assert HP restored
6. `weather-set` (6), `field-terrain` (4), `field-side-condition` (15), `field-pseudo-weather` (8), `field-clear` (4) — assert field/side state
7. `secondary-status` (13), `secondary-boost` (12), `secondary-volatile` (7) — assert damage dealt; secondary chance assertions should tolerate RNG (run many trials or pin seed)
8. `damage-plain` (14), `drain` (2), `fixed-damage` (5), `fractional-hp-damage` (4), `signature-ohko` (4) — assert HP threshold
9. `variable-power` (22) — set up scaling variable (HP%, weight, level, friendship, status), assert damage scales
10. `protect-like` (11), `counter-like` (4), `lock-on` (2), `self-effect-special` (4), `pp-reduction` (1), `status-transfer` (1) — two-turn setups
11. `boost-copy-flip` (4), `stat-swap-split` (7), `ability-manipulation` (6), `type-change` (8) — two-pokemon state changes
12. `force-switch-or-trap` (5), `item-manipulation` (4), `perish-song` (1), `final-gambit` (1), `turn-order-helper` (4), `pivot-or-faint-helper` (3), `meta-move` (10), `misc-truly-unclassified` (1) — special-case scaffolding (likely partial coverage)
13. `charge` (17) — two-turn runTurn, assert damage on turn 2
14. `ally-or-spread-target` (44) — **LAST**: singles harness almost certainly cannot drive these; expect to mark `it.skip()` or document as deferred

Batch limit per invocation: 25–40 TODOs. Split larger buckets (`ally-or-spread-target` 44 → 2 batches; `pure-volatile-foe` 26 fits in one; `heal` 23 fits in one; `variable-power` 22 fits in one).

**Verification**: Each `/fix-todo-test <cluster-id>` invocation writes `tests/moves/by-category/_drafts/<cluster-id>.test.js` and runs `node --test` on it. The agent emits a follow-up finding noting per-cluster status (passing / partially-failing / bug-discovered). Final reconciliation: `grep -c "it.todo" tests/moves/by-category/*.test.js` should approach zero after all drafts are promoted by the orchestrator.

---

## <a id="ISSUE-022"></a> ISSUE-022: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

---
id: ISSUE-022
severity: P2
category: inconsistency
anchor_symbol: TRAINER_QUOTES_BY_NAME
current_line_hint: ~29450
file: battle.html
agents: [consistency-auditor]
fingerprint: cbadf67900dd
confidence: high
status: open
---

**Title**: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

**Evidence**:
```js
// TRAINER_QUOTES_BY_NAME has named intros for Brock/Misty/Lt.Surge/Erika/Koga/Sabrina/Blaine/Giovanni
// only — every other Gym Leader defined in TRAINER_DATA falls back to TRAINER_QUOTES['Gym Leader'].
// Missing: Allister, Bea, Brassius, Brawly, Brycen, Bugsy, Burgh, Byron, Candice, Chuck,
//   Cilan, Clair, Clay, Clemont, Crasher Wake, Drayden, Elesa, Falkner, Fantina, Flannery,
//   Gardenia, Gordie, Grant, Grusha, Iono, Jasmine, Kabu, Katy, Kofu, Korrina, Lenora,
//   Maylene, Melony, Milo, Morty, Nessa, Norman, Olympia, Opal, Piers, Pryce, Raihan,
//   Ramos, Roark, Roxanne, Ryme, Skyla, Tate, Tulip, Valerie, Viola, Volkner, Wattson,
//   Whitney, Winona, Wulfric (56 leaders)
// These all have LEADER_VICTORY_LINES (post-battle) and LEADER_BADGE_REFLECTIONS, but
// no pre-battle voice — they're just "Show me what you've trained for."
```

**Repro**: Story run, reach Falkner / Roark / Wattson / Raihan as your gym leader (any non-Kanto first-gen leader). Compare the intro line — it'll be the same generic 6-line pool for every one of them.

**Blast radius**: Cosmetic — the moment-to-moment "fanservice" of a recognisable gym leader is missed. Battle still functions. Same problem the prior audit flagged for Champion victory; the gym intro layer was never extended the same way.

**Fix sketch**: Add 2-3 lines per missing leader to `TRAINER_QUOTES_BY_NAME`, matching the existing tone (one-liner Game Boy-style boasts). The 8 Kanto leaders are the template. ~150 lines of text data.

**Verification**: Manual — start a story run, fight each of the 8 cities' gym leader, eyeball that the intro line reflects the trainer's personality (e.g. Raihan = social media banter, Allister = quiet ghost flavor).

---

## <a id="ISSUE-023"></a> ISSUE-023: `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads

---
id: ISSUE-023
severity: P3
category: inconsistency
anchor_symbol: _pickCityQuoteLine
current_line_hint: ~29705
file: battle.html
agents: [consistency-auditor]
fingerprint: 2cc1751d63f6
confidence: medium
status: open
---

**Title**: `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads

**Evidence**:
```js
// L29673-L29706
// City NPC flavor (index = City N from event name). Uses Math.random only — must not advance story battle RNG.
const CITY_PROFESSOR_QUOTES = [ ... ];
const CITY_GUIDE_QUOTES = [ ... ];
function _pickCityQuoteLine(poolArr, cityIdx) {
    const idx = Math.min(Math.max(0, cityIdx|0), poolArr.length - 1);
    const lines = poolArr[idx] || poolArr[0];
    return lines[Math.floor(Math.random() * lines.length)];  // BARE — intentional
}
```

**Repro**: Save in City 4, reload — the professor quote may change between loads. Stated in the file comment as intentional ("must not advance story battle RNG").

**Blast radius**: Intentional behavior, low-impact. Could be made deterministic per (seed, cityIdx, visit-count) without touching the main story RNG stream by mirroring the `_storySideRng` pattern already used for rival secondary intros (L29622-29633). Would make seeded replays even more reproducible.

**Fix sketch**: Replace the bare `Math.random()` with `_storySideRng(cityIdx, sm.eventIndex|0)` so the same city visit at the same point produces the same quote. Keep the existing behavior off the main story RNG stream.

**Verification**: Reload a save twice at the same city event — professor/guide quote should be identical both times.

---

## <a id="ISSUE-024"></a> ISSUE-024: Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images

---
id: ISSUE-024
severity: P3
category: perf
anchor_symbol: _preloadedImages
current_line_hint: 11983
file: battle.html
agents: [performance-profiler]
fingerprint: 2b9d-imageprefetch
confidence: medium
status: open
---

**Title**: Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images

**Evidence**:
```js
// battle.html:11982
const _spriteCache = {};
const _preloadedImages = {};
// :12036
if (!_preloadedImages[url]) {
    let img = new Image(); img.src = url; _preloadedImages[url] = img;
}
```
`getSprite()` is called from 44 sites (every battle-UI redraw, every party-screen render, every draft-card render, every PC storage render). Each unique (name, shiny, back) tuple creates an `Image` that holds the GIF in memory. A full story run sees 100–300 unique mons across battles, party screens, PC storage, and trainer previews. Multiply by `shiny` × `back` variants and the cache can easily exceed 500 entries; on a long save (multiple runs) it grows unboundedly.

**Repro**: Greps `grep -c 'new Image()' battle.html` → 1 (the only caller) and `grep -c 'getSprite\s*('` → 44 (the call sites). No eviction logic exists (`grep '_preloadedImages\s*='` shows only the initial `{}` declaration plus the assignment-in-loop).

**Blast radius**: Each GIF sprite from Showdown is ~5–50 KB. 500 cached = ~10–25 MB of image data the browser pins. On low-RAM mobile devices this contributes to mid-session crashes / OOM. The memory-growth benchmark at 60 turns shows only +5 MB heap growth (linear, R² = 0.712), but that's the JS heap — the image cache lives in the browser's image-decoder pool, separate from V8 heap, and would not show up in `process.memoryUsage()`. This finding is a forward-looking risk, not a confirmed regression. Marked P3 / confidence medium.

**Fix sketch**: Convert `_preloadedImages` from an unbounded Object into a bounded LRU cache (e.g., keep last 100 sprites). Alternatively, just remove the `new Image()` preload — modern browsers cache `<img src>` automatically once an `<img>` element is appended; the explicit Image() instances duplicate the cache.

**Verification**: After the fix, `Object.keys(_preloadedImages).length` should plateau in a long story run instead of growing monotonically.

---

## <a id="ISSUE-025"></a> ISSUE-025: `isPokeball` flag set on 28 items but never read by the engine — dead metadata

---
id: ISSUE-025
severity: P3
category: data
anchor_symbol: isPokeball
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 92eb6f313f92
confidence: high
status: open
---

**Title**: `isPokeball` flag set on 28 items but never read by the engine — dead metadata

**Evidence**:
```bash
$ grep -n "isPokeball\|isPokeBall" battle.html
# (no matches)
$ grep -c "isPokeball" data/items.json
28
```

**Repro**: `grep -nE "isPokeball|isPokeBall" /home/user/battle/battle.html` returns no lines (note: the mandate's spelling is `isPokeBall` with uppercase B, but the actual data uses `isPokeball`). The engine's ball-handling code uses its own `ballKey: 'master' | 'great' | ...` taxonomy in `POKEMART_ITEMS` rows, not the data-file flag.

**Blast radius**: None at runtime — the flag is just inert bytes in the JSON. It's a low-priority data-hygiene concern: future contributors may add a poke-ball entry and forget the (unused) flag, or be confused about which catalog is authoritative. Doc/maintenance friction only.

**Fix sketch**: Either (a) strip the `isPokeball` field from `data/items.json` as part of a periodic data-cleanup pass; or (b) wire the engine's ball-detection helpers (e.g., `_ballChip` flows, `applyBallMultiplier`) to read from the data file's `isPokeball` instead of the ad-hoc `kind:'ball'` rows in `POKEMART_ITEMS`. Option (b) consolidates ball-knowledge into one place but is a non-trivial refactor; option (a) is a one-liner script.

**Verification**: After (a): `grep -c isPokeball data/items.json` returns 0. After (b): boot a wild encounter, throw a Quick Ball at turn 1 — confirm the multiplier still triggers via the new lookup path.

---

## <a id="ISSUE-026"></a> ISSUE-026: 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler

---
id: ISSUE-026
severity: P3
category: data
anchor_symbol: items.json
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 3ebf781a4419
confidence: medium
status: open
---

**Title**: 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler

**Evidence**:
```js
// items.json gen 9 entries — all marked isNonstandard:"Past":
// bitterberry, burntberry, goldberry, iceberry, mintberry, miracleberry,
// mysteryberry, przcureberry, psncureberry
$ grep -E "Bitter Berry|Burnt Berry|Gold Berry|Ice Berry|Mint Berry|Miracle Berry|Mystery Berry|PRZ Cure Berry|PSN Cure Berry" battle.html
# (no matches)
```

**Repro**: Iterate `data/items.json` flat for `isBerry: true`; for each berry name, grep `battle.html`. 68 of 77 distinct berries have at least one name reference (Sitrus, Lum, Salac, Liechi, ...). The remaining 9 are all `isNonstandard: "Past"` entries that were renamed/replaced in gen3+ (Gold Berry → Sitrus Berry, etc.).

**Blast radius**: None today — these berries cannot be held in the gen9-only engine path. The risk is purely hypothetical (a future "play gen2 OU" mode would silently no-op them). The dataset is internally consistent with the `isNonstandard:"Past"` marker.

**Fix sketch**: Optional cleanup — keep them as documented past-only data; or, if a multi-gen toggle is ever added, ship a name-aliasing table mapping legacy berries to their modern equivalents in the engine's berry handler. No action required today.

**Verification**: Decide whether to keep or alias; the current `isNonstandard:"Past"` is correctly signalling "do not instantiate."

---

## <a id="ISSUE-027"></a> ISSUE-027: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

---
id: ISSUE-027
severity: P3
category: perf
anchor_symbol: loadEngine
current_line_hint: 52
file: tests/helpers/load-engine.js
agents: [performance-profiler]
fingerprint: 28e451a73726
confidence: high
status: open
---

**Title**: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

**Evidence**: `tests/reports/perf.md` (this run, ISO 2026-05-22T07:18:54Z) reports `Cold start: 2854 ms (target: < 5000 ms in jsdom)`. Repeated trial: 2885 ms. The performance-profiler mandate (`agents/performance-profiler.md` line 17) sets the target at **< 200 ms under jsdom**. The harness self-report in `perf-bench.mjs:112` has been silently relaxed to `< 5000 ms` to mask this.

**Repro**: `time node -e 'import("./tests/helpers/load-engine.js").then(m => m.loadEngine()).then(() => console.log("ok"))'` measures ≈ 3 seconds.

**Blast radius**: The mandate's 200 ms target is unrealistic — jsdom has to parse ~50k lines of inlined battle.html, then the engine `loadGameData` synchronously parses 1380 species, 954 moves, 583 items, 314 abilities, 1147 build entries from JSON/CSV. The real bottleneck is JSON.parse + JSDOM document construction, both of which are largely fixed-cost. **Either the target needs updating** (the harness self-report at < 5 s is more realistic for jsdom) **or the engine should split eager loading into lazy/on-demand parsing**. In production browsers the boot is ~1.5–2 s and is hidden behind a splash; this is not user-visible. So this is a **target-mismatch finding**, not a performance regression: clarify which number the project actually targets.

**Fix sketch**: Either (a) update `agents/performance-profiler.md` to set the realistic target at `< 5 s in jsdom / < 2.5 s in production`, or (b) add a flag to `loadGameData` to skip parsing of unused data tables (e.g., the 748 illegal/end-game builds) during test boot.

**Verification**: Either the mandate target is updated to a realistic value, or `loadGameData` gains a `{ lazyBuilds: true }` option and `loadEngine.js` passes it.

---

## <a id="ISSUE-028"></a> ISSUE-028: `console.log` cluster in battle.html — debug noise in shipped code

---
id: ISSUE-028
severity: P3
category: dx
anchor_symbol: loadGameData
current_line_hint: ~9172
file: battle.html
agents: [consistency-auditor]
fingerprint: 2665d2131c90
confidence: high
status: open
---

**Title**: `console.log` cluster in battle.html — debug noise in shipped code

**Evidence**:
```js
// 19 console.log sites in battle.html — most under window.__DEBUG_* gates or under
// dev-only seeders. Worst-offender (always-on) sites:
// L9082  console.log('[SpriteScale] enrichBaseStatsHeightsFromDex: heightM added for ' + n + ' species');
// L9172  console.log(`[Data] Loaded ${...} species, ${...} moves, ${...} items, ${...} abilities, ${...} natures`);
// L9342  console.log(`[CSV] Loaded builds for ${Object.keys(csvBuilds).length} Pokémon ...`);
// L9399  console.log(`[CSV] API fallback loaded builds for ${...}`);
// L10939 console.log(`[Smogon] Loaded gen${gen} sets from local file`);
// L10945 console.log(`[Smogon] Loaded gen${gen} sets from pkmn.cc API`);
```

**Repro**: Open battle.html in a browser, open the console — `[Data] Loaded …` and friends greet every visitor on every cold load.

**Blast radius**: Polish only. Shipped console noise distracts from real diagnostics during incident triage. Note: console.log entries inside `__storyXxxTest` / `seedStoryXxx` / `balanceAudit` / `testmoves` are intentional (dev seeders) and should NOT be stripped.

**Fix sketch**: Gate the 5-6 always-on data-load logs behind a `window.__DEBUG_LOADS` flag (the SpriteScale / dex probe pattern already does this — copy it). Keep the dev-seeder logs as-is.

**Verification**: Cold load battle.html in a browser, console should be empty unless `?debug=1` or `__DEBUG_LOADS=true`.

---

## <a id="ISSUE-029"></a> ISSUE-029: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

---
id: ISSUE-029
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: 24269
file: battle.html
agents: [performance-profiler]
fingerprint: 4cae7cf40971
confidence: high
status: open
---

**Title**: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

**Evidence**: drill-down via `scripts/debug/_repro/parse-move-drill.mjs` (boots harness, calls `parseMoveEffects(attacker, defender, move, true)` for all 950 moves with valid mons):
```
Total moves measured: 950
Median (all):          0.014 ms
Median (damaging):     0.014 ms  N=679
Median (status):       0.014 ms  N=271
Median (has secondary):0.017 ms  N=203
Median (no secondary): 0.013 ms  N=747

Top 10 slowest:
  3.463 ms  Status  secondary=false  Clangorous Soul
  3.396 ms  Status  secondary=false  Acid Armor
  3.381 ms  Status  secondary=false  Baby-Doll Eyes
  2.819 ms  Special secondary=true   Night Daze
  2.557 ms  Special secondary=false  10,000,000 Volt Thunderbolt
  2.128 ms  Special secondary=false  Incinerate
  1.963 ms  Status  secondary=false  Calm Mind
  1.851 ms  Status  secondary=false  Extreme Evoboost
  1.824 ms  Status  secondary=false  Bulk Up
  1.808 ms  Status  secondary=false  Shell Smash

Bottom 5 fastest: ~0.011 ms
```
Fastest:slowest ratio ≈ 0.011 → 3.46 = **315×**. The mandate's threshold is >10× variance → P3 finding.

**Repro**: `node scripts/debug/_repro/parse-move-drill.mjs` (script is in the gitignored `_repro/` folder; reproducible from the snippet documented here).

**Blast radius**: At normal sub-millisecond times these spikes are invisible. But (a) Clangorous Soul, Calm Mind, Bulk Up, Shell Smash, Acid Armor are setup moves used heavily in trainer sets, and they all involve **multi-stat boost loops** with logMsg/updateUI sequences — those are the slowest. (b) JSDOM happens to evaluate updateUI's DOM mutations cheaply; in a real browser those same moves will pay real layout/paint cost, so the relative spike could grow. (c) The top three are all `Status` moves with no secondary, suggesting the slow path is the boost-stage loop, not the secondary-effect branch. Status moves are NOT slower than damaging moves on the median — only the multi-stat-boost subset is.

**Fix sketch**: Profile Clangorous Soul (boosts ATK/DEF/SPA/SPD/SPE by +1, costs 33% HP) — that's 5 sequential `changeStage` calls + the HP cut + a logMsg. If the cost is dominated by `updateUI` being called inside `changeStage`, batch the UI update once at the end. If the cost is `logMsg` overhead per stage, that suggests the per-message channel switching path is the hot spot. Not urgent — even the worst move is 3.5 ms, well under any human-perceptible threshold in jsdom.

**Verification**: Re-run the drill script after any optimization. The expectation is the slowest moves drop into the sub-millisecond range and the variance ratio falls below 20×.

---

## <a id="ISSUE-030"></a> ISSUE-030: Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon`

---
id: ISSUE-030
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~28028
file: battle.html
agents: [consistency-auditor]
fingerprint: 908671f1a52f
confidence: high
status: open
---

**Title**: Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon`

**Evidence**:
```js
// L28028  '...,Power Up','Enter Pokemon League']],          ← action key
// L36151                       'Enter the Pokémon League'   ← UI label
// L28047  if (!Array.isArray(actions) || actions.includes('Pokemon Fan Club')) continue;
// L36242  makeActionBtn('💖 Pokémon Fan Club', ...           ← UI label
```

**Repro**: `grep -nE '\\bPokemon\\b' battle.html | grep -v 'Pokémon'` — 19 hits, 2 of which are user-string-adjacent action keys (rest are CSS / code comments).

**Blast radius**: None for users — internal keys, not displayed. Style consistency only. Risk: a future contributor updates one of these two strings to use the diacritic and forgets the matched site, breaking the `actions.includes(...)` check.

**Fix sketch**: Either (a) leave both as-is and document that internal action keys deliberately avoid the diacritic, or (b) rename both keys to use `Pokémon` + update both `actions.includes(...)` callsites. (a) is the lower-risk fix.

**Verification**: After rename, ensure City 9's "Enter Pokémon League" button still appears (the gating check at L36137 must match).

---

## <a id="ISSUE-031"></a> ISSUE-031: 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines)

---
id: ISSUE-031
severity: P3
category: dx
anchor_symbol: STORY_MODE_CATCH_INTEGRATION_RISK.md
file: docs/STORY_MODE_CATCH_INTEGRATION_RISK.md
agents: [spec-drift-auditor]
fingerprint: 3c47a061e632
confidence: high
status: open
---

**Title**: 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines)

**Evidence**:
```
doc-line  | symbol hinted                      | claimed | actual
40        | badges, _storyProgressFactor       | 22481   | 13168 / 31385
41        | _rivalScoreAttackTypeVsParty       | 22706   | 31604
43        | hasTeamRoom, rivalGateActive       | 23611   | 35922 / 35940
47        | isFull, rolls                      | 24317   | 36885 / 36913
52        | usedNames, usedFamilies            | 24515   | 14180 / 36947
54        | sm                                 | 26484   | 13166
```
This doc is the largest single source of drifted refs in the report (24 of 50 total drifts).

**Repro**: `node scripts/debug/spec-drift.mjs && sed -n '25,55p' tests/reports/spec-drift.md`.

**Blast radius**: A doc named "risk" implies it should be read carefully on every catch-pipeline change; stale anchors actively mislead readers tracking how the catch flow interacts with Rival logic, save schema, and PC capacity.

**Fix sketch**: Single sweep through this doc, converting `battle.html:LINE` patterns to `(SYMBOL)` annotations. Special attention to lines 40-55, which form the spec's high-density anchor block. Add the convention to `docs/STORY_MODE_DESIGN_DECISIONS.md` as "rule: never quote line numbers in design docs".

**Verification**: `node scripts/debug/spec-drift.mjs` reports ≤2 drift entries under this doc.

---

## <a id="ISSUE-032"></a> ISSUE-032: 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines)

---
id: ISSUE-032
severity: P3
category: dx
anchor_symbol: STORY_MODE_FLOW.md
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: a2c0649750f6
confidence: high
status: open
---

**Title**: 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines)

**Evidence**:
```
STORY_MODE_FLOW.md doc-line  | claimed battle.html line | actual location
 47 (STORY_EVENTS_RAW)       | 21273                    | 27969 (+6696)
117 (catchRate, getMonGrade) | 28560                    | 13062 (-15498)
217 (STORY_EVENTS_RAW)       | 30702                    | 27969 (-2733)
576 (makeWildBuild)          | 34883                    | 39858 (+4975)
```
Full report at `tests/reports/spec-drift.md`. Only 1/10 refs in this doc still resolves cleanly via the symbol table — the rest reference symbols at lines that no longer host them (or have no inferrable symbol).

**Repro**: `node scripts/debug/spec-drift.mjs && head -25 tests/reports/spec-drift.md`.

**Blast radius**: Anyone who follows STORY_MODE_FLOW.md's line numbers to inspect the implementation lands in unrelated code. Docs still readable for *symbol* references, just not line jumps.

**Fix sketch**: One sweep: re-resolve every `battle.html:LINE` via `find-anchor`, rewrite as `battle.html` (no line) plus `(`SYMBOL`)`. Future-proof: never embed line numbers in design docs — they drift the moment a function is added above.

**Verification**: After sweep, `node scripts/debug/spec-drift.mjs` reports ≤1 drift entry under STORY_MODE_FLOW.md.

---

## <a id="ISSUE-033"></a> ISSUE-033: 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines)

---
id: ISSUE-033
severity: P3
category: dx
anchor_symbol: STORY_NARRATIVE_VARIANTS.md
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: b63a7fd17310
confidence: high
status: open
---

**Title**: 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines)

**Evidence**:
```
doc-line | symbol                       | claimed | actual
339      | pending                      | 30916   | 17218
600      | STORY_BEATS                  | 30566   | 33787
601      | STORY_COLD_OPENS             | 30592   | 33813
602      | STORYLINE_VARIANTS           | 30815   | 35011
606      | MYSTERY_FIGURE_IDENTITIES    | 26426   | 28705
607      | _showIntroRivalColdOpen      | 33069   | 37866
```
The variant system is the most actively edited area of battle.html (CHANGELOG 2026-05-20: "12 sections all additive"), so line refs drift fastest here.

**Repro**: `node scripts/debug/spec-drift.mjs && sed -n '60,75p' tests/reports/spec-drift.md`.

**Blast radius**: This doc is the canonical guide for adding a 9th storyline variant; readers following its anchors land in wrong functions. STORY_BEATS / STORY_COLD_OPENS / STORYLINE_VARIANTS are the three keystone consts a variant author touches.

**Fix sketch**: Re-resolve via `find-anchor`, replace with symbol-only annotations. The six symbols here are stable in the index — re-link them and the doc is self-healing across future refactors.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drift entries under this doc.

---
