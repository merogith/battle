---
severity: P1
category: inconsistency
anchor_symbol: slotsUnlocked
current_line_hint: ~42749
file: battle.html
agents: [spec-drift-auditor]
fingerprint: b088e5373276
confidence: high
status: open
---

**Title**: Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6

**Evidence**:
```js
// battle.html ~42742 (also a mirror at ~38575 and dev-seeder at ~38702):
const slotsUnlocked = badges < 5 ? 0 : 4;          // ALL four at badges>=5
sm.unlockedGimmicks = order.slice(0, Math.min(slotsUnlocked, order.length));
// inline comment: "Previously these dripped one per gym (5->8) ... Unlock all
//                  four player battle mechanics together the moment ... Colress"
```
```text
docs/PROGRESSION_CURVE_MASTER.md:182 (marked "✅ verified live"):
  `slotsUnlocked = badges < 5 ? 0 : min(4, badges−4)`; order mega → dmax → tera → z.
:183  - Badges 1–4 = 0 · GL5→1 · GL6→2 · GL7→3 · GL8→4.
```

**Repro**: Win Gym 5 (badges→5) with all four mechanics enabled in run setup; `sm.unlockedGimmicks` is `['mega','dmax','tera','z']` immediately. The doc says only 1 slot should be open until GL8.

**Blast radius**: This is a doc-vs-code contradiction, not a code bug. Docs that must be updated to match the merged rule (`badges < 5 ? 0 : 4`):
- `docs/PROGRESSION_CURVE_MASTER.md` §2e line 182 (the `min(4, badges−4)` formula — and drop the "✅ verified live" tag, it is now false), line 183 (the `GL5→1 · GL6→2 · GL7→3 · GL8→4` enumeration), and line 181's stale anchor `battle.html:42146` (real sites are ~38575 and ~42749).
- `docs/PROGRESSION_CURVE_MASTER.md` master-timeline `Gmk` column: line 94 ("→ Badge 5 → FIRST GIMMICK SLOT"), line 95 (row idx 32 Gmk=1), line 96 (idx 33 Gmk=1), line 97 (idx 34 Gmk=1), line 101 (idx 38 "2 gimmick slots"), line 109 (idx 46 "3 gimmick slots"), line 116 (idx 53 "Badge 8 → 4 gimmick slots") — every `Gmk` cell for badges 5–7 should read 4, not 1/2/3.
- `docs/PROGRESSION_CURVE_MASTER.md` §3.1 F2 (line 230) and §3.3 line 204 still frame "gimmicks unlock at GL5 [singular] ... Colress debuts C6" — the count is now four-at-once, so the "holds one unusable unlock for one stage" framing should become "holds all four for one stage until Colress."
- `STORY_MODE_FLOW.md` §15d line 722-723 ("Cable Link only rolls gimmicks the player has unlocked **via gym victories**") reads as per-gym; soften to "unlocked at the Colress/Gym-5 gate."

Note also a minor code wart surfaced while verifying: the `?storychampionweak=1` dev seeder at ~38702 still uses `Math.min(8, order.length)` (stale `8`) instead of the `slotsUnlocked` rule; functionally equivalent for a maxed run (min(8,4)=4) but inconsistent with the two real sites.

This also OBSOLETES ledger `ISSUE-152` (P3, "DMax unlocks at Gym 5 instead of Gym 6 if Mega is off") — the new all-at-once rule means disabling a mechanic can no longer shift another's unlock gym. Verify-and-close, don't re-open.

**Fix sketch**: Docs-only. Update `PROGRESSION_CURVE_MASTER.md` §2e + the `Gmk` timeline column + §3.1 F2 to the "all four enabled gimmicks unlock together at badges>=5 (post-GL5), equippable at Colress/City 6" rule. Optionally clean the stale `8` in the dev seeder.

**Verification**: After doc edit, `grep -n "min(4, badges\|GL5→1\|FIRST GIMMICK SLOT" docs/PROGRESSION_CURVE_MASTER.md` returns nothing; the `Gmk` column shows 4 for every row with badges>=5.

---
severity: P2
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29240
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: e585e95483b0
confidence: high
status: fixed-main
---

**Title**: STORY_MODE_FLOW says timeline is "68 rows"; STORY_EVENTS_RAW actually has 67 rows

**Evidence**:
```js
// battle.html 29240-29311: STORY_EVENTS_RAW literal — 67 data rows (idx 0..66),
// last row idx 66 = [67,'Battle','Mystery Figure',...]. (3 of the 70 literal
// lines are comments at 29300-29302.)
```
```text
STORY_MODE_FLOW.md:27  "...existing `STORY_EVENTS_RAW`, 68 rows, unchanged..."
STORY_MODE_FLOW.md:53  "The existing `STORY_EVENTS_RAW` array ... stays as-is."
(by contrast docs/PROGRESSION_CURVE_MASTER.md:52 correctly says "67 rows (array idx 0–66)")
```

**Repro**: `awk 'NR>=29241 && NR<=29310' battle.html | grep -cE '^\s*\[\s*[0-9]+\s*,'` → 67.

**Blast radius**: Doc-only count drift. The arc itself is intact and matches spec: intro rival (idx 1) → 8 gyms → 2 rival rematches + league rival → E1–E4 → Champion → Hall of Fame (idx 65) → post-HoF Mystery Figure (idx 66). Only the row *count* in `STORY_MODE_FLOW.md` §1 (line 27) is wrong; the task brief inherited this stale "68-row" figure from the spec. `GYM_CITY_LEADER_EVENT` is now correctly DERIVED at boot from `STORY_EVENTS_RAW` (battle.html:29990, `buildGymCityLeaderMap()`), so the prior audit's §1.3 "hard-coded gym index map" concern is resolved — no derive-vs-hardcode mismatch remains.

**Fix sketch**: Change "68 rows" → "67 rows (idx 0–66)" in `STORY_MODE_FLOW.md` line 27.

**Verification**: Count matches `PROGRESSION_CURVE_MASTER.md`'s "67 rows".

---
severity: P2
category: inconsistency
anchor_symbol: SAVE_VER
current_line_hint: ~31502
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: fad1a278acb4
confidence: high
status: open
---

**Title**: STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21

**Evidence**:
```js
// battle.html:31502
const SAVE_VER = 21;
// migrations present & dispatched in load(): preV11..preV17, preV18 (diacritics),
// preV19, preV20, preV21 — no gaps.
```
```text
STORY_MODE_FLOW.md:279  "Bump `SAVE_VER` from 14 to 15. Add:"
STORY_MODE_FLOW.md:352  "- Bump `SAVE_VER` to 15."
STORY_MODE_FLOW.md:1176 "- `SAVE_VER` bumped 16 → 17."
```

**Repro**: `grep -nE 'SAVE_VER\s*=' battle.html` → `SAVE_VER = 21`.

**Blast radius**: Doc-only. These are milestone-history statements (M0 = v15, v17 registry, etc.), so they are not strictly "wrong" as historical notes — but a reader treating `STORY_MODE_FLOW.md` as the canonical current spec will assume v15/v17 is current. The `migrateStoryPreV15` body itself MATCHES spec §10 exactly (pcBox/balls/pokedex/catchUnlocked defaults, hardcore→normal, stable ids — verified line-by-line at battle.html:32153-32179), so check #3 (migration completeness) passes; only the *version number* the spec implies as "current" is stale. Note there is no `migrateStoryPreV18` by that literal name, but `migrateStoryTrainerDiacriticsPreV18` covers the `<18` slot (battle.html:32606) — not a gap.

**Fix sketch**: Add a one-line "current SAVE_VER is 21" note at the top of §10/§13, or annotate each bump as the milestone it shipped in, so the doc reads as layered history rather than current state.

**Verification**: Spec's stated current SAVE_VER equals `battle.html` `SAVE_VER`.

---
severity: P2
category: inconsistency
anchor_symbol: catchUnlocked
current_line_hint: ~32159
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 8566e89fd047
confidence: high
status: fixed-main
---

**Title**: `sm.catchUnlocked` is written 3× but never read; spec §10 says it gates wild-route prompts

**Evidence**:
```js
// battle.html — every occurrence is a WRITE; no read/condition anywhere:
32159:  if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;  // migration default
32244:  catchUnlocked: false,                                                // newStoryRun default
35749:  catchUnlocked: false,                                                // run-setup default
// (the older `sm.settings.catchMode` flag from STORY_FEATURES_INTEGRATION.md has 0 refs in code)
```
```text
STORY_MODE_FLOW.md:273  catchUnlocked: false,  // "toggles wild-route prompts; flipped on
                        // after first wild route entry or starter"
```

**Repro**: `grep -nE 'sm\.catchUnlocked' battle.html | grep -vE 'catchUnlocked\s*=[^=]'` → no read sites. The live gate for catch/route prompts is `sm.catchTutorialDone` instead.

**Blast radius**: A defined-but-unused save field. Spec §10 promises it "toggles wild-route prompts" and is "flipped on after first wild route entry or starter" — but in shipped code it stays `false` forever and nothing branches on it, so the documented behavior does not exist. Independently corroborated by `PROGRESSION_CURVE_MASTER.md` §3.1 F5 ("`sm.catchUnlocked` is dead — written, never read; live gate is `catchTutorialDone`"). Latent trap for anyone editing the catch gate per the spec.

**Fix sketch**: Either (a) update `STORY_MODE_FLOW.md` §10 to mark `catchUnlocked` as reserved/legacy and document `catchTutorialDone` as the real gate, or (b) wire the documented behavior. Given the de-scope direction, (a) is the lower-risk doc fix.

**Verification**: After fix, the spec field with a documented behavior either has a read site in code, or the spec marks it reserved.

---
severity: P2
category: dx
anchor_symbol: STORY_FEATURES_INTEGRATION
current_line_hint: n/a
file: docs/STORY_FEATURES_INTEGRATION.md
agents: [spec-drift-auditor]
fingerprint: 37c82575616a
confidence: high
status: fixed-claude/optimistic-ptolemy-g3COo
---

**Title**: De-scoped features (Black Market, Illegal Dealer, Trader, Wager, full Itinerary) still presented as active spec — precise doc-edit list

**Evidence**:
```text
Code presence check (battle.html):
  blackMarket / enterBlackMarket / "Black Market"        → 0 hits
  illegalDealer / "Illegal Dealer" / Contraband Capsule  → 0 hits
  traderOfferByCity / enterTrader / pokemonTrader        → 0 hits
  pendingWager / battleForPokemon / "Battle for Pokémon" → 0 (3 "wager" hits are all Casino flavor text)
  itineraryProgress / runItinerary / STORY_SCRIPT        → 0 hits
```

**Repro**: The greps above.

**Blast radius**: Per the product decision these five are CUT (not "not implemented" bugs). The docs that present them as live/planned spec need editing to mark them future/cut. Precise list (canonical home = `docs/STORY_FEATURES_INTEGRATION.md`):

`docs/STORY_FEATURES_INTEGRATION.md`:
- §3 Black Market — heading + body lines 33–54 (placement table 37–41, SKU table 44–51, `enterBlackMarket()` UI line 53).
- §3.5 Illegal Dealer NPC — heading + body lines 57–84 (placement 63–65, loop table 67–76, differentiation table 78–84).
- §6 Battle for Pokémon (wager) — heading + body lines 110–119; plus the ordering refs that name "wager": line 106, and §8 rows lines 135, 137, 138.
- §7 Pokémon Trader — heading + body lines 123–128 (the "idx 26 OR 29 — pick one" was never decided).
- Full Itinerary — it is woven through, not a single section: lines 39, 65, 75, 90, 106, 117, 135, 136 (the `runItinerary`/`itineraryProgress`/`storyScriptState` save-persist row), 138, 150, and the §10 implementation-order steps 165 (#2 `runItinerary`+arc stub) and 168/169 (#5 Wager, #6 Trader). Steps remaining as in-scope after de-scope: #1 balls/PC (shipped), #4 Safari (shipped), #7 dialogue.
- §9 readiness table rows that reference cut systems: line 150 (Itinerary beats), 151 (Black Market vendor), 152 (Illegal Dealer NPC), 154 (Trader NPC), 155 (Battle for Pokémon).

`docs/STORY_MODE_CATCH_INTEGRATION_RISK.md`:
- line 94 (Mystery Figure & Trader & Wager swap rule), line 140 (`itinerary → wild → wager → trainer` ordering), lines 147, 200, 202 (`runItinerary`/`maybeOfferWager` queue), line 229 (Egg from the Trader).

`docs/STORY_MODE_DESIGN_DECISIONS.md`:
- line 111 (wrap `src: 'professor'|'wild'|'trader'` — drop `'trader'`), lines 350/354/355/358 + 543 row D3 (PC "Fence at the Black Market" mechanic), line 579 (deriving city map under "wild, wager, safari" pressure).

`STORY_MODE_FLOW.md`:
- §16 References line 1074 calls `STORY_FEATURES_INTEGRATION.md` "the canonical replacement" — once that doc is marked future/cut, this pointer's framing should note the five cut systems.

NOT recommended for edit: `docs/STORY_MODE_AUDIT.md` references (lines 36, 70, 192, 236, 248–250, 273, 285, 289, 319–320, 338, 347–360, 369) — that audit is a point-in-time snapshot that already says "zero implemented" and lists them as backlog; it reads correctly as history. Leave it.

**Fix sketch**: Add a banner at the top of `docs/STORY_FEATURES_INTEGRATION.md` ("§3, §3.5, §6, §7 and the full-itinerary scaffolding are DE-SCOPED — not planned; retained for historical context") and strike/mark the per-section lines above. Then fix the cross-references in the other three docs.

**Verification**: After edits, no doc presents Black Market / Illegal Dealer / Trader / Wager / Itinerary as a planned-and-pending deliverable; each is explicitly tagged cut/future.

---
severity: P2
category: inconsistency
anchor_symbol: README
current_line_hint: n/a
file: README.md
agents: [spec-drift-auditor]
fingerprint: 61ee59240f4d
confidence: high
status: fixed-main
---

**Title**: README calls catch / PC / Underground / Safari / boss-arc "upcoming"; all are shipped

**Evidence**:
```text
README.md:44  "See `STORY_MODE_FLOW.md` for the working spec of the UPCOMING
              catch / PC / Underground / Safari / boss-arc systems."
```
```js
// All shipped in battle.html (samples):
//   #screen-story-catch (7 refs), enterSafari (4), SAFARI_MAX_ENCOUNTERS,
//   _bossArc* (15 refs), "Subject Zero" (23 refs), PC_BOX_CAP = 30,
//   _WILD_GRADE_CURVE_BY_BADGES, Crucible (67 refs), enterPits, enterDaycare.
//   SAVE_VER = 21 (the catch/PC schema landed at v15).
```

**Repro**: `grep -cE 'screen-story-catch|enterSafari|Subject Zero|PC_BOX_CAP' battle.html` → all non-zero.

**Blast radius**: README is the entry doc; "upcoming" implies these systems are unbuilt when they are fully in the live build. Misleads new contributors and undercuts the (now de-scoped) distinction. Task check #6 ("every feature mentioned in README must be reachable from UI"): the *only* forward-looking claim is this "upcoming" sentence — and the features it names ARE reachable; the word "upcoming" is the defect.

**Fix sketch**: Reword README line 44 to "See `STORY_MODE_FLOW.md` for the spec of the catch / PC / Underground / Safari / boss-arc systems (shipped)."

**Verification**: README no longer labels shipped systems as upcoming.

---
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29240
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 3aecea72ae27
confidence: high
status: open
---

**Title**: Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered)

**Evidence**:
```text
node scripts/debug/spec-drift.mjs → 18/50 battle.html:LINE refs drifted.
Representative examples (claimed line → symbol now lives at):
  STORY_MODE_FLOW.md:53   battle.html:21273  STORY_EVENTS_RAW   → now 29240
  STORY_MODE_FLOW.md:123  battle.html:28560  getMonGrade        → now 13893
  STORY_MODE_FLOW.md:584  battle.html:34883  makeWildBuild      → now 44684
  STORY_NARRATIVE_VARIANTS.md:612 battle.html:30566 STORY_BEATS  → now 35833
  PROGRESSION_CURVE_MASTER.md:181 battle.html:42146 (gimmick gate) → now ~42749/38575
```

**Repro**: `node scripts/debug/spec-drift.mjs` then read `tests/reports/spec-drift.md`.

**Blast radius**: Cosmetic — the docs themselves repeatedly warn "line numbers drift; the symbol name is the durable anchor," and the symbols still resolve via `find-anchor`. battle.html grew from ~28k LOC (when most anchors were written) to ~54.8k LOC. No behavioral impact; just stale jump-to references across `STORY_MODE_FLOW.md`, `STORY_MODE_CATCH_INTEGRATION_RISK.md`, `STORY_NARRATIVE_VARIANTS.md`, and `PROGRESSION_CURVE_MASTER.md`.

**Fix sketch**: Optional bulk refresh — re-run `node scripts/debug/symbol-index.mjs` and regenerate the `battle.html:LINE` anchors from symbol lookups, or simply accept drift since the symbol names are the contract. Lowest priority.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted (if a refresh pass is done).

