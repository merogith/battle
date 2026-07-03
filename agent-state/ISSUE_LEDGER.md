# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-07-03T15:17:10.171Z
> **Source**: `agent-state/findings/*.md` (179 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 7 |
| P2 | 59 |
| P3 | 109 |
| **Total** | **179** |

| Category | Count |
|---|---|
| a11y | 8 |
| balance | 1 |
| bug | 19 |
| contrast | 2 |
| data | 10 |
| dx | 29 |
| engine-fidelity | 1 |
| inconsistency | 73 |
| perf | 17 |
| refactor | 17 |
| test-gap | 2 |

## TOC

- [ISSUE-001] [P1] "Up next" preview computed from a different model than the dispatcher — ignores all story beats — `_storyComputeUpNext` (inconsistency)
- [ISSUE-002] [P1] Measured curve violates the "regular<player, gym slightly-above, E4 EQUAL" intent — GL1-2 are 0.67-0.83× the player, gyms overshoot to 1.5×, E4 is ~1.70× (not equal) — `applyFoeDifficultyScaling` (balance)
- [ISSUE-003] [P1] Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative) — `fetchSmogonSetsForGen` (data)
- [ISSUE-004] [P1] The save-migration chain (most save-sensitive code) has no exercisable test path — only migratePreV22/26/27 are exposed — `migrateStoryPreV15` (dx)
- [ISSUE-005] [P1] Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6 — `slotsUnlocked` (inconsistency)
- [ISSUE-006] [P1] Three mutually-incompatible story-narrative designs coexist; no doc is the single canon — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-007] [P1] Cosmetic animation RNG consumes the seeded story stream — replay drift vector — `storyRngNext` (bug)
- [ISSUE-008] [P2] Extra-track raid HP comment says miniRaid=(party-2)×, raid=(party-1)× base HP, but a separate ×1.3 _bossStatMult also multiplies maxHp — true HP is ~5.2×/6.5× at party 6 — `_bossHpScaleForKind` (inconsistency)
- [ISSUE-009] [P2] Early-game softening from FLOW §8/§15f (named constants) fully removed; replaced by unified per-city FOE_POWER_CURVE — `_earlyGameFoeStatMult` (inconsistency)
- [ISSUE-010] [P2] Challenge foe stat mult is 1.40 in code but FLOW §8 table still says 1.30 — `_foeDifficultyMult` (inconsistency)
- [ISSUE-011] [P2] Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives — `_isBuildAbilityIllegal` (inconsistency)
- [ISSUE-012] [P2] PC deposit/withdraw/release resets scroll to top via full innerHTML rewrite — `_pcRefresh` (dx)
- [ISSUE-013] [P2] Underground claims "Starters … aren't for sale" but starters are sellable (unsellable flag stripped) — `_pcRenderUndergroundTab` (inconsistency)
- [ISSUE-014] [P2] Villain-arc regular battles share 7 generic `tag:'villain'` grunts — never themed to the run's actual track (3 tracks have no matching grunt at all) — `_pickThemedTrainerForRole` (inconsistency)
- [ISSUE-015] [P2] ~12 parallel event-presentation paths with 3 z-index layers and no single registry — `_renderNarrativeOverlay` (refactor)
- [ISSUE-016] [P2] Safari grade weights are a badge-keyed curve; FLOW §4 still specs the retired flat g1:3/g2:22/g3:50/g4:25 — `_SAFARI_GRADE_CURVE_BY_BADGES` (data)
- [ISSUE-017] [P2] WANDER_AROUND_SPEC says "not yet implemented" but Wander Around shipped at SAVE_VER 23 — `_showWanderScreen` (inconsistency)
- [ISSUE-018] [P2] Boss field-lock sets _bossWeatherLocked/_bossTerrainLocked but nothing reads them; weather decay path (20611/20617) ignores the lock — `_storyBossMechanicsBattleInit` (inconsistency)
- [ISSUE-019] [P2] In-catch "Up next" says "trainer/wild" but a battle-kind beat scene fires between catch and fight — `_storyComputeUpNext` (bug)
- [ISSUE-020] [P2] Curve doc's endgame league-boost layer no longer exists — shipped flat overrides are far below documented values — `_storyEnemyStatMult` (inconsistency)
- [ISSUE-021] [P2] FLOW §3 says wild grade is "keyed on sm.badges" via `_WILD_GRADE_CURVE_BY_BADGES`; shipped code keys it on city — `_wildGradeWeightsForCity` (inconsistency)
- [ISSUE-022] [P2] Mystery Figure HP boost is 1.35 in code but 1.50 in both balance docs (canonical-curve drift) — `applyStoryLeagueFoeStatBoost` (inconsistency)
- [ISSUE-023] [P2] Team Yell villain track has no themed sprites — boss Piers falls back to generic Roughneck, mini-boss Marnie renders as Gladion — `BEAT_CANON_TRAINER` (data)
- [ISSUE-024] [P2] `battle`-kind beats (main.battle1/battle2) launch a generic trainer, not a themed one — no canon override — `BEAT_CANON_TRAINER` (inconsistency)
- [ISSUE-025] [P2] buyArtifact has no interaction lock; double-submit safety rests solely on confirm-modal z-order — `buyArtifact` (bug)
- [ISSUE-026] [P2] Casino subtitle cream text on light-gold/rose panels fails WCAG AA contrast — `casino-game-subtitle` (contrast)
- [ISSUE-027] [P2] catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone — `catch-system.test` (dx)
- [ISSUE-028] [P2] PC-cap integration test asserts cap 10 (stale) and passes only via false-positive regex match — `catch-system.test` (dx)
- [ISSUE-029] [P2] autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report — `classify` (dx)
- [ISSUE-030] [P2] Relic vs Artifact used interchangeably for one object across label/key/fn/state — `enterArtifactShop` (inconsistency)
- [ISSUE-031] [P2] Facility debut cities disagree 3 ways (code FACILITY_DEBUT_CITY vs both balance docs vs in-code comments) — `FACILITY_DEBUT_CITY` (inconsistency)
- [ISSUE-032] [P2] Early-game softening is a per-CITY table in code, not the per-event named constants both balance docs describe — `FOE_STAT_NERF_BY_CITY` (inconsistency)
- [ISSUE-033] [P2] Migration chain is sound but unobservable — no boot-time shadow validation — `load` (dx)
- [ISSUE-034] [P2] No save migration coerces stale `sm.mysteryIdentity`; pre-v22 saves render degraded MF reveal until the fight — `load` (bug)
- [ISSUE-035] [P2] 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift) — `loadBuildsCSV` (inconsistency)
- [ISSUE-036] [P2] ~438 KB of non-gen-9 layers in core data JSONs are dead — engine reads only `['9']` — `loadGameData` (data)
- [ISSUE-037] [P2] Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table — `loadGameData` (perf)
- [ISSUE-038] [P2] `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call — `logMsg` (perf)
- [ISSUE-039] [P2] 14 species have their ENTIRE standard-tier build pool tagged illegal — designed sets are dropped, foe falls back to randbats/Tackle — `makeBuild` (data)
- [ISSUE-040] [P2] All damage modifiers collapsed into one multiply + single floor — Showdown floors per modifier (multi-HP drift) — `parseMoveEffects-modifier-pipeline` (inconsistency)
- [ISSUE-041] [P2] Multi-hit moves reuse one damage roll & one crit check for every hit (no per-hit independence) — `performAction` (bug)
- [ISSUE-042] [P2] OHKO moves use the generic accuracy gate — affected by evasion/accuracy stages, Compound Eyes, Gravity; no higher-level auto-fail — `performAction` (bug)
- [ISSUE-043] [P2] End-of-turn residuals always resolve player-active-first, not in Speed order — `playTurn` (bug)
- [ISSUE-044] [P2] Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off — `playTurn` (perf)
- [ISSUE-045] [P2] Catch screen result/throw text has no aria-live; outcomes silent to screen readers — `renderCatchScreen` (a11y)
- [ISSUE-046] [P2] safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc — `safari-zone.test` (dx)
- [ISSUE-047] [P2] 957 empty catch(e){} blocks swallow errors silently across battle.html — `save` (dx)
- [ISSUE-048] [P2] STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21 — `SAVE_VER` (inconsistency)
- [ISSUE-049] [P2] sellItem trusts caller-supplied sellPrice instead of re-deriving from the catalog — `sellItem` (bug)
- [ISSUE-050] [P2] settings.animations defaults to true and is never seeded from prefers-reduced-motion — `settings-animations-init` (a11y)
- [ISSUE-051] [P2] Snow Warning maps to Hail (gen-8) instead of gen-9 Snow — `setWeatherFromAbility` (engine-fidelity)
- [ISSUE-052] [P2] showGameConfirm overwrites a pending _gameConfirmResolve, orphaning the first awaiter — `showGameConfirm` (bug)
- [ISSUE-053] [P2] Per-leader victory flavor now exists, but 56 leaders lack TRAINER_QUOTES_BY_NAME/LEADER_VICTORY_LINES entries and fall to a generic "You received the <Badge>!" line — `showVictoryOverlay` (inconsistency)
- [ISSUE-054] [P2] pSide/fSide side-state literal duplicated 20x in two divergent variants (6-key vs 13-key) — `startPvpBattle` (inconsistency)
- [ISSUE-055] [P2] Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots — `STORY_EVENTS_RAW` (refactor)
- [ISSUE-056] [P2] row[0] (row id) diverges from array index at 25 of 67 rows — a permanent footgun for any code mixing the two — `STORY_EVENTS_RAW` (refactor)
- [ISSUE-057] [P2] Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none — `STORY_FACILITY_QUOTES` (inconsistency)
- [ISSUE-058] [P2] Surviving canonical specs + code link to docs deleted in the cleanup (dangling references) — `STORY_MODE_FLOW` (inconsistency)
- [ISSUE-059] [P2] Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers — `story-dialog-text` (a11y)
- [ISSUE-060] [P2] Verbatim gold-HUD markup re-inlined 11× — the "re-inlined block 25 times" anti-pattern CLAUDE.md warns about — `story-gold-icon` (refactor)
- [ISSUE-061] [P2] 351 it.todo() stubs across 3 move-category test files — cluster enumeration — `tests/moves/by-category` (test-gap)
- [ISSUE-062] [P2] 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool — `TRAINER_QUOTES_BY_NAME` (inconsistency)
- [ISSUE-063] [P2] Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing — `type-badge` (a11y)
- [ISSUE-064] [P2] Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim — `updateBattleUI` (perf)
- [ISSUE-065] [P2] Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle — `updateBattleUI` (perf)
- [ISSUE-066] [P2] STORY_3TRACK_IMPL_PLAN reads as a forward plan but is mostly SHIPPED — only PR-1 marked done — `VILLAIN_STORY_BEATS` (inconsistency)
- [ISSUE-067] [P3] Heal phase (+25% maxHp) can push a raid boss back ABOVE the HP threshold the player just crossed — `_applyBossPhaseEffect` (inconsistency)
- [ISSUE-068] [P3] Dual story-vs-Frontier path in `_applyStoryBuildPowerTier` is mutually exclusive and safe — legacy branch is NOT removable (in-scope MF needs it) — `_applyStoryBuildPowerTier` (inconsistency)
- [ISSUE-069] [P3] Solo-raid HP is 6.5× base, not the documented (maxParty-1)=5× — stat-mult and HP-scale compound on HP — `_bossHpScaleForKind` (inconsistency)
- [ISSUE-070] [P3] Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent — `_catchHandleSuccess` (inconsistency)
- [ISSUE-071] [P3] "Free" badge wording inconsistent — "1st Free" vs "Free" vs "Claimed" vs "Locked" — `_costBadge` (inconsistency)
- [ISSUE-072] [P3] _eggBuildFor has an ungated makeBuild fallback that would surface unlocked-mechanic gimmicks on a hatchling (dead today, latent) — `_eggBuildFor` (bug)
- [ISSUE-073] [P3] Dead CSS selector #story-pc-tab-journal-btn — no such tab button exists in the Poké Center — `_pcRefresh` (dx)
- [ISSUE-074] [P3] FLOW §8 documents _EARLY_ROUTE_FODDER_CLASSES allowlist as live; code REMOVED it (now grade-pipeline only) — `_pickEarlyRouteBasicTrainer` (inconsistency)
- [ISSUE-075] [P3] Variant roll + Mystery identity use bare `Math.random()` at run construction — non-deterministic across seeded replays — `_pickRandomStorylineVariant` (bug)
- [ISSUE-076] [P3] Stale RNG comments: wild-species pick is NOT freed from the seed; site count off by 55 — `_pickWildSpeciesRandom` (inconsistency)
- [ISSUE-077] [P3] Stale battle.html comments claim deleted tone scripts are "PRESERVED-BUT-DORMANT" and revivable by restoring one call — `_readStorylineFromUI` (dx)
- [ISSUE-078] [P3] Casino debits floor gold at Math.max(0, gold-bet), which would silently mask a future bet-validation regression — `_refreshCasinoGoldPill` (dx)
- [ISSUE-079] [P3] "Reveal lands inside first ~10 minutes" comment is wrong — first villain beat is post-Gym-2 (road2) — `_ROAD_BY_ARRAY_IDX` (inconsistency)
- [ISSUE-080] [P3] Safari grade weights are a per-badge curve in code, but STORY_MODE_FLOW.md §4 still specs the old flat g1:3/g2:22/g3:50/g4:25 — `_SAFARI_GRADE_CURVE_BY_BADGES` (inconsistency)
- [ISSUE-081] [P3] Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25 — `_safariGradeWeightsForBadges` (inconsistency)
- [ISSUE-082] [P3] Safari grade weights diverge from the canonical spec (`g1:3/g2:22/g3:50/g4:25`) — code is a badge-staged curve; spec is stale — `_safariGradeWeightsForBadges` (data)
- [ISSUE-083] [P3] FLOW §15b says Fan Club is seeded into STORY_EVENTS_RAW via _seedFanClubAcrossCities() — fn does not exist — `_seedFanClubAcrossCities` (inconsistency)
- [ISSUE-084] [P3] Post-HoF orientation tip frames the Mystery Figure as un-fought, but the row-67 climax already unmasked it — `_showOrientationTipThenCity` (inconsistency)
- [ISSUE-085] [P3] bossMechanicsTurnTick per-turn cost is ~1.5us (foeParty.filter is NOT wasteful); only _showBossBanner DOM is non-trivial and fires ~5x/battle — `_storyBossMechanicsTurnTick` (perf)
- [ISSUE-086] [P3] `_storyBuildTierForEvent` Basic-Trainer branch has a dead `b>=5` arm — route fodder jumps T2→T4 at post-game with no T3 step (half-applied curve edit) — `_storyBuildTierForEvent` (bug)
- [ISSUE-087] [P3] "wild < gym staff" ladder is violated — Basic Trainer and Gym Trainer 1 share the SAME tier at every badge count — `_storyBuildTierForEvent` (inconsistency)
- [ISSUE-088] [P3] _storyEnemyMechKeys header comment claims "GL7 onwards each newly unlocked mechanic enters the pool" but unlock is all-4-at-once at badges≥6 — `_storyEnemyMechKeys` (inconsistency)
- [ISSUE-089] [P3] Dead code: 13 unreferenced tutor/transformation/EV UI helpers (_tx*/_tutor*/_ev*) — `_txAbilityCmp` (refactor)
- [ISSUE-090] [P3] `_validateTrainerData` logs a success `console.log` on every boot (ungated) — `_validateTrainerData` (dx)
- [ISSUE-091] [P3] Wild grade keyed on CITY (STORY_WILD_GRADE_BY_CITY), not badges — spec §3/§15f say _WILD_GRADE_CURVE_BY_BADGES (which does not exist) — `_wildGradeWeightsForCity` (inconsistency)
- [ISSUE-092] [P3] Diacritics: 1262 bare "Pokemon" in Showdown-derived desc strings shown in tooltips — `abilities.json` (inconsistency)
- [ISSUE-093] [P3] items.json defines 93 mega stones but the engine recognizes only 51 — 45 non-canonical stones are inert data — `ALL_MEGA_STONES` (data)
- [ISSUE-094] [P3] Magma/Aqua bosses flash the same telegraph banner twice in the first two turns — `BOSS_CONFIGS` (inconsistency)
- [ISSUE-095] [P3] `BOSS_MECHANICS` stub object is dead (never called); its "engine wiring is a no-op" comment is now false — `BOSS_MECHANICS` (dx)
- [ISSUE-096] [P3] `BOSS_MECHANICS` registry (`~42172`) is dead — pushes to `battle._mechanics`, which is never read — `BOSS_MECHANICS` (refactor)
- [ISSUE-097] [P3] buyItem cheap-consumable path is unguarded but synchronous; only the confirm-gated branch can interleave — `buyItem` (inconsistency)
- [ISSUE-098] [P3] Dead code: 5 misc data/UI helpers in battle.html + mergeData in online-pvp.js — `calculateTier` (refactor)
- [ISSUE-099] [P3] Roulette doc comment promises a color-row payout the code never pays — `casinoRoulSpin` (inconsistency)
- [ISSUE-100] [P3] Integration test asserts stale "PC cap of 10" and never checks the real PC_BOX_CAP=30 — `catch-system.test.js` (dx)
- [ISSUE-101] [P3] catchUnlocked field is fully gone (not written, not in sm defaults); FLOW §10 still documents it as a reserved/legacy field — `catchUnlocked` (inconsistency)
- [ISSUE-102] [P3] CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion — `CHAMPION_VICTORY_LINES` (inconsistency)
- [ISSUE-103] [P3] Duplicated logic: dev-seed blocks, weather/terrain rollers, and inline mon-id generation — `crucibleGymPick` (refactor)
- [ISSUE-104] [P3] ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss — `ELITE_VICTORY_LINES` (inconsistency)
- [ISSUE-105] [P3] Leech Seed drain is processed AFTER burn/poison/toxic damage (canon order is before) — `endOfTurnEffects` (bug)
- [ISSUE-106] [P3] Ungated console.log: SpriteScale dex probe logs to every player console on enrich miss — `enrichBaseStatsHeightsFromDex` (dx)
- [ISSUE-107] [P3] Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene — `enterArtifactShop` (inconsistency)
- [ISSUE-108] [P3] enterArtifactShop and enterShop lack the _storyTryBeginInteraction guard used by other facility entries — `enterArtifactShop` (dx)
- [ISSUE-109] [P3] Story facility regions use weak lowercase aria-labels ("story pokemoncenter", "story link") — `enterPokemonCenter` (dx)
- [ISSUE-110] [P3] Professor flavor quote uses bare Math.random(), breaking seeded replay determinism — `enterProfessor` (bug)
- [ISSUE-111] [P3] Facility name spelled "PokéMart" (2 sites) vs "Pokémart" (14 sites) in UI — `enterShop` (inconsistency)
- [ISSUE-112] [P3] Item spelled "Pokéball" in horror-arc lore vs "Poké Ball" everywhere else — `enterShop` (inconsistency)
- [ISSUE-113] [P3] data/builds/gen*.json (3.9 MB) duplicates builds.csv 1:1 behind a fallback that can't realistically fire — `fetchSmogonSetsForGen` (data)
- [ISSUE-114] [P3] Foe stat curve keeps climbing post-Gym-4 (City7 1.08, City8 1.10); FLOW §8 says softening ends and foes sit at 1.00 from ≥3 badges — `FOE_POWER_CURVE` (inconsistency)
- [ISSUE-115] [P3] Wave-2 TODO re-enumeration: 35 stubs remain (not 351); 7 are obsolete duplicates of manual/ coverage — `generate-move-tests` (test-gap)
- [ISSUE-116] [P3] Rival phase enum skips 1 (EARLY rival returns phase 2), leaving a dead phase-1 dialogue pool — `getRivalEncounterPhase` (inconsistency)
- [ISSUE-117] [P3] Two disjoint "beat" systems — row-id `STORY_BEATS` (cold-opens) vs sceneKey `*_STORY_BEATS` (3-track) — `getStoryBeatForRow` (refactor)
- [ISSUE-118] [P3] Dead code: 10 unreferenced story-mode helpers; getTrainerQuote survives only in a test — `getTrainerQuote` (refactor)
- [ISSUE-119] [P3] 135 gen-9 species entries + 45 "Future" fan items are unreachable dead entries — `loadGameData` (data)
- [ISSUE-120] [P3] Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression — `loadGameData` (perf)
- [ISSUE-121] [P3] data-validator checks the fallback dataset against the wrong layer union — never validates builds.csv — `loadJsonByGen` (inconsistency)
- [ISSUE-122] [P3] Button label patterns inconsistent — Professor uses verb+noun, all others noun-only; Evolution facility has 3 names — `makeActionBtn` (inconsistency)
- [ISSUE-123] [P3] Empty-state copy varies across facilities for the same "no party member" condition — `makeActionBtn` (inconsistency)
- [ISSUE-124] [P3] 7 build abilities (Telepathy/Mountaineer/Friend Guard/Healer/Pickup/Rebound/Symbiosis) are silent no-ops the engine never implements — `makeBuild` (data)
- [ISSUE-125] [P3] `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median — `makeBuild` (perf)
- [ISSUE-126] [P3] Catch-tutorial migration hard-codes intro-rival index (>1) instead of deriving it — `migrateStoryPreV16` (inconsistency)
- [ISSUE-127] [P3] catchTutorialDone migration hardcodes eventIndex>1 instead of deriving the intro-rival row — `migrateStoryPreV16` (dx)
- [ISSUE-128] [P3] catchTutorialDone migration hard-codes `eventIndex > 1` instead of deriving the intro-rival array index — `migrateStoryPreV16` (dx)
- [ISSUE-129] [P3] migrateStoryPreV16 marks catchTutorialDone for any pre-v16 save at eventIndex>1, dropping the tutorial for a save sitting on the first route battle — `migrateStoryPreV16` (bug)
- [ISSUE-130] [P3] STORY_MODE_FLOW §14d describes Mystery Figure's 7-identity flow + Caged God repurpose; code has only the_first — `MYSTERY_FIGURE_IDENTITIES` (inconsistency)
- [ISSUE-131] [P3] Mystery Figure rotating-cast scaffolding is now vestigial — collapsed to a single hard-locked identity "the_first" — `MYSTERY_FIGURE_IDENTITIES` (refactor)
- [ISSUE-132] [P3] Fresh runs start with 0 Poké Balls; spec §1/§10 say 5 (only migrated saves get 5) — `newStoryRun` (inconsistency)
- [ISSUE-133] [P3] `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot — `parseCSV` (perf)
- [ISSUE-134] [P3] `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median — `parseMoveEffects` (perf)
- [ISSUE-135] [P3] `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers — `parseMoveEffects` (perf)
- [ISSUE-136] [P3] `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms) — `parseMoveEffects` (perf)
- [ISSUE-137] [P3] parseMoveEffects per-move spread is 130x (stat-stage moves ~1.3ms vs 0.01ms median) — benign, multiple changeStage calls — `parseMoveEffects` (perf)
- [ISSUE-138] [P3] Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan — `parseMoveEffects-changeStage-tooltipScan` (perf)
- [ISSUE-139] [P3] Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median) — `parseMoveEffects-sets-warm` (perf)
- [ISSUE-140] [P3] Several status moves have no observable effect in the battle engine — `Power Shift` (bug)
- [ISSUE-141] [P3] Mystery-mode Accept has no double-submit guard (re-renders swap picker on repeat clicks) — `profAccept` (bug)
- [ISSUE-142] [P3] Dead `'Cyrus'` Mystery-Figure sprite fallbacks remain after the identity was collapsed to a single value ('the_first' / Red) — `renderCityActions` (refactor)
- [ISSUE-143] [P3] Rival phase-4 standing pools have only 2 lines each (other variants have 3) — `rivalStandingPrimaryQuotePool` (inconsistency)
- [ISSUE-144] [P3] `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work — `rollTrainerTeam` (perf)
- [ISSUE-145] [P3] Safari runs 10 encounters / 10 balls; FLOW one-screen summary §1 still says "up to 6 per run" — `SAFARI_MAX_ENCOUNTERS` (inconsistency)
- [ISSUE-146] [P3] Safari flee-risk surfaced in color (orange #ff7043) and small 10px text only — `safariActionRow` (contrast)
- [ISSUE-147] [P3] FLOW's own 2026-06-17 reconciliation banner has drifted — cites SAVE_VER 27; shipped is 28, migrateStoryPreV28 undocumented — `SAVE_VER` (inconsistency)
- [ISSUE-148] [P3] SAVE_VER is 27; STORY_MODE_FLOW pins it at 15/17 across §10/§17 — `SAVE_VER` (inconsistency)
- [ISSUE-149] [P3] End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk — `selectPartyMember` (inconsistency)
- [ISSUE-150] [P3] Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng — `showBattleIntro` (inconsistency)
- [ISSUE-151] [P3] Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it — `showMoves` (a11y)
- [ISSUE-152] [P3] Magic numbers: uncommented ms delays and thresholds concentrated in overlay/anim timing — `showVictoryOverlay` (dx)
- [ISSUE-153] [P3] Doc battle.html:LINE anchors are stale (23/43 drifted across the spec docs) — `spec-drift-doc-anchors` (dx)
- [ISSUE-154] [P3] Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-155] [P3] Doc `battle.html:LINE` anchors stale — 18/50 references drifted (cluster) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-156] [P3] Doc `battle.html:LINE` anchors stale in surviving specs — 24/44 drifted (post-cleanup cluster; updates ISSUE-330) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-157] [P3] Doc `battle.html:LINE` anchors still drifting — 21/37 stale in today's sweep (cluster; updates ISSUE-136) — `STORY_EVENTS_RAW` (dx)
- [ISSUE-158] [P3] STORY_MODE_FLOW §4 still specs the flat Safari weights g1:3/g2:22/g3:50/g4:25; live code is a badge curve (_SAFARI_GRADE_CURVE_BY_BADGES) — `STORY_EVENTS_RAW` (inconsistency)
- [ISSUE-159] [P3] `STORY_IV_TIER_RANGES` is dead — superseded by `STORY_IV_TIER_CENTER`, zero consumers — `STORY_IV_TIER_RANGES` (refactor)
- [ISSUE-160] [P3] THREE story IV tables coexist — `STORY_IV_TIER_RANGES` is fully dead; `STORY_IV_TIER_CENTER` is Frontier-only; only `STORY_IV_CITY_*` is the live story curve — `STORY_IV_TIER_RANGES` (inconsistency)
- [ISSUE-161] [P3] Three live FLOW sections (outside removed §9) still cite the excised "Subject Zero" as shipped behavior — `STORY_MODE_FLOW` (inconsistency)
- [ISSUE-162] [P3] Doc line anchors stale across 4 specs (still drifting post-v24; cluster) — `STORY_NARRATIVE_VARIANTS` (dx)
- [ISSUE-163] [P3] STORY_THEMED_BATTLES is keyed by row-id and resolves correctly only because row-id≈array-index in the 7–58 band (fragile) — `STORY_THEMED_BATTLES` (refactor)
- [ISSUE-164] [P3] Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance — `STORY_TUTORIAL_SCENES` (dx)
- [ISSUE-165] [P3] Catch ball buttons lack accessible name reading the success %; bare-icon img alt empty — `story-catch-ball` (a11y)
- [ISSUE-166] [P3] Dead CSS selector for a #story-pc-tab-journal-btn that has no markup or handler — `story-pc-tab-journal-btn` (refactor)
- [ISSUE-167] [P3] Pokémon Center tab buttons not exposed as a tablist (no role=tab/tabpanel) — `story-pc-tab-storage-btn` (a11y)
- [ISSUE-168] [P3] Dead CSS: ~72 style-block classes with no static or template-built reference — `story-tutor-move-slot` (refactor)
- [ISSUE-169] [P3] Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope — `storyAwareRng` (inconsistency)
- [ISSUE-170] [P3] `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites — `storyAwareRng` (dx)
- [ISSUE-171] [P3] FLOW §8 post-retune residue — Challenge coin mult 1.10 vs shipped 0.90; Champion-on-Hard example uses 1.30 vs shipped 1.23 — `storyDifficultyCoinMult` (inconsistency)
- [ISSUE-172] [P3] FLOW contradicts itself on the tone layer — header says "kept dormant in code, reversible"; §16 says removed; §17 still teaches multi-variant workflow — `STORYLINE_VARIANTS` (inconsistency)
- [ISSUE-173] [P3] `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean — `storyRngNext` (perf)
- [ISSUE-174] [P3] Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time — `updateUI` (a11y)
- [ISSUE-175] [P3] `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block — `wildSeenByEventIdx` (dx)
- [ISSUE-176] [P4] VERIFIED OK — boss/raid reward double-grant across the two call sites is structurally prevented — `_activeBattleBeatForCurrentRow` (bug)
- [ISSUE-177] [P4] `_bossWeatherLocked` / `_bossTerrainLocked` flags are set but never read — field "lock" is opening-state only — `_storyBossMechanicsBattleInit` (refactor)
- [ISSUE-178] [P4] VERIFIED OK — extra-arc raid "laid to rest, no catch" lock is enforced structurally — `enterCatchEncounter` (bug)
- [ISSUE-179] [P4] Three redundant RNG-routing mechanisms; confusion self-hit relies solely on the global Math.random patch while siblings use storyAwareRng() — `storyAwareRng` (inconsistency)

---

## <a id="ISSUE-001"></a> ISSUE-001: "Up next" preview computed from a different model than the dispatcher — ignores all story beats

---
id: ISSUE-001
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

## <a id="ISSUE-002"></a> ISSUE-002: Measured curve violates the "regular<player, gym slightly-above, E4 EQUAL" intent — GL1-2 are 0.67-0.83× the player, gyms overshoot to 1.5×, E4 is ~1.70× (not equal)

---
id: ISSUE-002
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

## <a id="ISSUE-003"></a> ISSUE-003: Retune risk: `data/builds/gen*.json` is a fallback mirror, not the live build source (`data/builds.csv` is authoritative)

---
id: ISSUE-003
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

## <a id="ISSUE-004"></a> ISSUE-004: The save-migration chain (most save-sensitive code) has no exercisable test path — only migratePreV22/26/27 are exposed

---
id: ISSUE-004
severity: P1
category: dx
anchor_symbol: migrateStoryPreV15
current_line_hint: ~40654
file: battle.html
agents: [story-mode-investigator]
fingerprint: 61dc1db61b77
confidence: high
status: open
---

**Title**: The save-migration chain (most save-sensitive code) has no exercisable test path — only migratePreV22/26/27 are exposed

**Evidence**:
```js
// __storyTest exposes only: migratePreV22, migratePreV26, migratePreV27 (+ migrateStoryPreV25).
// migrateStoryPreV15 (grants starting balls, strips hardcore, assigns stable ids,
// derives postHofMysteryClimaxDone), V16, V17, V19, V20, V21, V24 have NO handle.
// The chain runs only inside load(), and load() early-returns in jsdom
// ("localStorage is not available for opaque origins"), so a pre-v15 round-trip
// is untestable in the harness.
```

**Repro**: In the jsdom harness, `window.__storyTest` lacks `migrateStoryPreV15`; stuffing a v14 save into localStorage throws on opaque origin, so `load()` never runs the chain.

**Blast radius**: A regression in any pre-v25 migration (e.g. v15 ball grant, hardcore→normal, id stamping) ships silently — CLAUDE.md flags saves as the single most sensitive area.

**Fix sketch**: Expose `migrateStoryPreV15..V24` on the `__storyTest` surface (mirroring V22/26/27) so a unit test can craft a synthetic old-shape `sm`, run the chain, and assert the post-conditions.

**Verification**: A new test crafts a v14 `sm`, calls the chain, asserts balls={poke:5,...}, difficulty='normal', team[].id set, no bossArc.

---

## <a id="ISSUE-005"></a> ISSUE-005: Mechanics-unlock docs still describe one-per-gym drip; code now unlocks all four at Colress/City 6

---
id: ISSUE-005
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

## <a id="ISSUE-006"></a> ISSUE-006: Three mutually-incompatible story-narrative designs coexist; no doc is the single canon

---
id: ISSUE-006
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

## <a id="ISSUE-007"></a> ISSUE-007: Cosmetic animation RNG consumes the seeded story stream — replay drift vector

---
id: ISSUE-007
severity: P1
category: bug
anchor_symbol: storyRngNext
current_line_hint: ~42864
file: battle.html
agents: [consistency-auditor]
fingerprint: 53957c71e739
confidence: medium
status: open
---

**Title**: Cosmetic animation RNG consumes the seeded story stream — replay drift vector

**Evidence**:
```js
14527:  if (typeof anime !== 'function') return;   // whole type-anim path skipped when anime.js absent
14680:  el.style.left = (30 + Math.random()*40) + '%';   // ~90 cosmetic Math.random calls per animated battle
42864:  Math.random = function () {
42865:      if (typeof sm !== 'undefined' && sm && sm.active === true && sm.runSeed != null) {
42866:          return storyRngNext();
```

**Repro**: Run a seeded story battle twice: once with vendor/anime.js loaded, once with it blocked (offline / vendor fetch failure). The type-anim generators (battle.html ~14670-15400, confetti 33005-33270, sparkles 41778) call Math.random ~5-90 times per move; the global patch at 42864 routes ALL of these through storyRngNext during an active seeded run, so the two replays consume different counts of the seeded stream and every subsequent gameplay roll (accuracy, crit, damage, catch) diverges.

**Blast radius**: Story replay determinism (scripts/debug/story-replay.mjs), transcript byte-identity promised by the comment at 42853-42862, any prefers-reduced-motion or animation-skip path that conditionally skips particle spawns.

**Fix sketch**: Make cosmetic/particle call sites use _nativeMathRandom (or a dedicated cosmetic RNG) so they never touch the seeded stream; alternatively expose a cosmeticRandom() helper and sweep the typeAnims/confetti/sparkle generators.

**Verification**: Seeded replay with anime.js stubbed out vs loaded produces byte-identical battle transcripts.

---

## <a id="ISSUE-008"></a> ISSUE-008: Extra-track raid HP comment says miniRaid=(party-2)×, raid=(party-1)× base HP, but a separate ×1.3 _bossStatMult also multiplies maxHp — true HP is ~5.2×/6.5× at party 6

---
id: ISSUE-008
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

## <a id="ISSUE-009"></a> ISSUE-009: Early-game softening from FLOW §8/§15f (named constants) fully removed; replaced by unified per-city FOE_POWER_CURVE

---
id: ISSUE-009
severity: P2
category: inconsistency
anchor_symbol: _earlyGameFoeStatMult
current_line_hint: ~38266
file: battle.html
agents: [story-mode-investigator]
fingerprint: 48812b28d717
confidence: high
status: open
---

**Title**: Early-game softening from FLOW §8/§15f (named constants) fully removed; replaced by unified per-city FOE_POWER_CURVE

**Evidence**:
```js
// STORY_MODE_FLOW.md §8 / §15f document PRE_GYM1_FOE_STAT_MULT=0.82,
// EARLY_GL_FOE_STAT_MULT=0.95, STAGE2_GL_FOE_STAT_MULT=0.97,
// _earlyGameFoeStatMult(), _isPreGym1NerfedBattle(), _stageGatedFoeStatMult().
// grep for ALL of these in battle.html → 0 hits. Replaced by:
const FOE_POWER_CURVE = Object.freeze([0.80,0.85,0.90,0.95,1.00,1.03,1.05,1.08,1.10,1.15]); // city 0..9
```

**Repro**: `grep -nE 'PRE_GYM1_FOE_STAT_MULT|EARLY_GL_FOE_STAT_MULT|_earlyGameFoeStatMult|_isPreGym1NerfedBattle|_stageGatedFoeStatMult' battle.html` → 0 hits.

**Blast radius**: Spec §8 implementation note still warns about the `window.STORY_EVENTS_RAW` re-export trap for a function that no longer exists. Anyone tuning early-game difficulty by the doc edits dead constants.

**Fix sketch**: Rewrite FLOW §8 and §15f anti-bricking tables to describe the live `FOE_POWER_CURVE` × `_foeDifficultyMult` model and delete the dead-constant warnings. The behavior change itself (no per-event GL softening; smooth city curve instead) is maintainer-owned — flag for sign-off, don't re-add.

**Verification**: After doc rewrite, every constant named in §8/§15f resolves to a live symbol.

---

## <a id="ISSUE-010"></a> ISSUE-010: Challenge foe stat mult is 1.40 in code but FLOW §8 table still says 1.30

---
id: ISSUE-010
severity: P2
category: inconsistency
anchor_symbol: _foeDifficultyMult
current_line_hint: ~38294
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2c4f98469141
confidence: high
status: open
---

**Title**: Challenge foe stat mult is 1.40 in code but FLOW §8 table still says 1.30

**Evidence**:
```js
case 'challenge': return 1.40; // "Very Hard" — widened 1.30→1.40 (2026-06-15)
// STORY_MODE_FLOW.md §8: "| Challenge (Very Hard) | 1.30 | 1.10 |"
```

**Repro**: Compare `_foeDifficultyMult('challenge')` (1.40) with FLOW §8's stat-mult column (1.30).

**Blast radius**: Doc-vs-code balance drift; coin mult also moved (Hard floored to 1.00 vs §8 "1.00 (floored from 0.92)" which is consistent, but challenge coin is 1.10 in both — only the stat cell is stale).

**Fix sketch**: Update the §8 table Challenge stat cell to 1.40 (the in-code value is maintainer-ratified 2026-06-15).

**Verification**: §8 table matches `_foeDifficultyMult` for all five tiers.

---

## <a id="ISSUE-011"></a> ISSUE-011: Build "illegal-ability" pairs (672) are intended (hackmons/AAA + mega-form abilities); a naive legality check false-positives

---
id: ISSUE-011
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

## <a id="ISSUE-012"></a> ISSUE-012: PC deposit/withdraw/release resets scroll to top via full innerHTML rewrite

---
id: ISSUE-012
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

## <a id="ISSUE-013"></a> ISSUE-013: Underground claims "Starters … aren't for sale" but starters are sellable (unsellable flag stripped)

---
id: ISSUE-013
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

## <a id="ISSUE-014"></a> ISSUE-014: Villain-arc regular battles share 7 generic `tag:'villain'` grunts — never themed to the run's actual track (3 tracks have no matching grunt at all)

---
id: ISSUE-014
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

## <a id="ISSUE-015"></a> ISSUE-015: ~12 parallel event-presentation paths with 3 z-index layers and no single registry

---
id: ISSUE-015
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

## <a id="ISSUE-016"></a> ISSUE-016: Safari grade weights are a badge-keyed curve; FLOW §4 still specs the retired flat g1:3/g2:22/g3:50/g4:25

---
id: ISSUE-016
severity: P2
category: data
anchor_symbol: _SAFARI_GRADE_CURVE_BY_BADGES
current_line_hint: ~56506
file: battle.html
agents: [story-mode-investigator]
fingerprint: eefd4056fd47
confidence: high
status: open
---

**Title**: Safari grade weights are a badge-keyed curve; FLOW §4 still specs the retired flat g1:3/g2:22/g3:50/g4:25

**Evidence**:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
  4:{g1:0,g2:5,g3:60,g4:35}, 5:{g1:0,g2:15,...}, ... 8:{g1:2,g2:45,g3:45,g4:8}
};
// FLOW §4: "SAFARI_GRADE_WEIGHTS g1:3 / g2:22 / g3:50 / g4:25"
```

**Repro**: Compare `_safariGradeWeightsForBadges()` output to FLOW §4. (§15g documents the curve correctly; §4 is stale.)

**Blast radius**: Doc drift only. Matches ledger ISSUE-065/066/067.

**Fix sketch**: Replace the §4 flat-weights line with a pointer to §15g's `_SAFARI_GRADE_CURVE_BY_BADGES` table.

**Verification**: §4 no longer cites static weights.

---

## <a id="ISSUE-017"></a> ISSUE-017: WANDER_AROUND_SPEC says "not yet implemented" but Wander Around shipped at SAVE_VER 23

---
id: ISSUE-017
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

## <a id="ISSUE-018"></a> ISSUE-018: Boss field-lock sets _bossWeatherLocked/_bossTerrainLocked but nothing reads them; weather decay path (20611/20617) ignores the lock

---
id: ISSUE-018
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

## <a id="ISSUE-019"></a> ISSUE-019: In-catch "Up next" says "trainer/wild" but a battle-kind beat scene fires between catch and fight

---
id: ISSUE-019
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

## <a id="ISSUE-020"></a> ISSUE-020: Curve doc's endgame league-boost layer no longer exists — shipped flat overrides are far below documented values

---
id: ISSUE-020
severity: P2
category: inconsistency
anchor_symbol: _storyEnemyStatMult
current_line_hint: ~39464
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5d3db08bada3
confidence: high
status: open
---

**Title**: Curve doc's endgame league-boost layer no longer exists — shipped flat overrides are far below documented values

**Evidence**:
```js
// battle.html ~39472 (shipped, single layer, stamped at build time):
if (e === 'Mystery Figure') return 1.30;
if (e === 'Rival' && row === STORY_RIVAL_ROW_LEAGUE) return 1.26;
if (e === 'Champion') return 1.23;
if (e === 'E1') return 1.14;  // E2 1.16, E3 1.18, E4 1.20
// docs/PROGRESSION_CURVE_MASTER.md §1 rows 60–67: "1.15 ×1.22ᴸ" (E1–E4),
// "1.20 ×1.40ᴸ" (Champion/Rival), "1.20 ×1.50ᴸ" (Mystery Figure); footnote ᴸ:
// "applyStoryLeagueFoeStatBoost stacks multiplicatively on top of the stage-gated mult"
```

**Repro**: `grep -n "_stageGatedFoeStatMult" battle.html` → 0 definitions (doc §2 line 237 cites it at ~13199). `applyStoryLeagueFoeStatBoost` (battle.html:42811) is now gated on `sm.frontier.active` — a no-op for timeline fights. Compare docs/PROGRESSION_CURVE_MASTER.md lines 169–181/237/343 against `_storyEnemyStatMult` (battle.html:39464).

**Blast radius**: docs/PROGRESSION_CURVE_MASTER.md is the maintainer-owned balance canon (CLAUDE.md). Documented effective endgame difficulty (E4 1.15×1.22=1.40, Champion 1.68, MF 1.80) is 17–38% above shipped (1.20 / 1.23 / 1.30). Any balance retune reasoned from the doc's §1 Foe× column or §2 stack table will target the wrong numbers. The doc's 2026-06 banner discloses the §2d softening deletion and FOE_POWER_CURVE[5]=1.03, but NOT the league-boost removal — and the §1 table body still shows Foe× 1.00 for C5 rows (29–31) vs FOE_POWER_CURVE[5]=1.03. Supersedes the code side of ISSUE-002/ISSUE-020 (both measured against the now-deleted boost path). FLOW §8 (STORY_MODE_FLOW.md:233) correctly describes the new single-layer model, so the two canonical docs now disagree with each other as well.

**Fix sketch**: Re-synthesize the §0 stage table, §1 Foe× column, §2 stack table (line 237) and footnote ᴸ around `_storyEnemyStatMult`'s flat overrides, or extend the 2026-06 banner to mark those sections historical like §2d.

**Verification**: Every multiplier in the doc's endgame rows matches `_storyEnemyStatMult` return values; `grep -c "1\.22ᴸ\|×1\.40ᴸ\|×1\.50ᴸ" docs/PROGRESSION_CURVE_MASTER.md` → 0 or annotated-historical.

---

## <a id="ISSUE-021"></a> ISSUE-021: FLOW §3 says wild grade is "keyed on sm.badges" via `_WILD_GRADE_CURVE_BY_BADGES`; shipped code keys it on city

---
id: ISSUE-021
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

## <a id="ISSUE-022"></a> ISSUE-022: Mystery Figure HP boost is 1.35 in code but 1.50 in both balance docs (canonical-curve drift)

---
id: ISSUE-022
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

## <a id="ISSUE-023"></a> ISSUE-023: Team Yell villain track has no themed sprites — boss Piers falls back to generic Roughneck, mini-boss Marnie renders as Gladion

---
id: ISSUE-023
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

## <a id="ISSUE-024"></a> ISSUE-024: `battle`-kind beats (main.battle1/battle2) launch a generic trainer, not a themed one — no canon override

---
id: ISSUE-024
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

## <a id="ISSUE-025"></a> ISSUE-025: buyArtifact has no interaction lock; double-submit safety rests solely on confirm-modal z-order

---
id: ISSUE-025
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

## <a id="ISSUE-026"></a> ISSUE-026: Casino subtitle cream text on light-gold/rose panels fails WCAG AA contrast

---
id: ISSUE-026
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

## <a id="ISSUE-027"></a> ISSUE-027: catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone

---
id: ISSUE-027
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

## <a id="ISSUE-028"></a> ISSUE-028: PC-cap integration test asserts cap 10 (stale) and passes only via false-positive regex match

---
id: ISSUE-028
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

## <a id="ISSUE-029"></a> ISSUE-029: autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report

---
id: ISSUE-029
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

## <a id="ISSUE-030"></a> ISSUE-030: Relic vs Artifact used interchangeably for one object across label/key/fn/state

---
id: ISSUE-030
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

## <a id="ISSUE-031"></a> ISSUE-031: Facility debut cities disagree 3 ways (code FACILITY_DEBUT_CITY vs both balance docs vs in-code comments)

---
id: ISSUE-031
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

## <a id="ISSUE-032"></a> ISSUE-032: Early-game softening is a per-CITY table in code, not the per-event named constants both balance docs describe

---
id: ISSUE-032
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

## <a id="ISSUE-033"></a> ISSUE-033: Migration chain is sound but unobservable — no boot-time shadow validation

---
id: ISSUE-033
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

## <a id="ISSUE-034"></a> ISSUE-034: No save migration coerces stale `sm.mysteryIdentity`; pre-v22 saves render degraded MF reveal until the fight

---
id: ISSUE-034
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

## <a id="ISSUE-035"></a> ISSUE-035: 6 builds in the gen*.json mirror omit `nature`; the CSV source has natures for all 17,398 rows (mirror drift)

---
id: ISSUE-035
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

## <a id="ISSUE-036"></a> ISSUE-036: ~438 KB of non-gen-9 layers in core data JSONs are dead — engine reads only `['9']`

---
id: ISSUE-036
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

## <a id="ISSUE-037"></a> ISSUE-037: Engine-only `loadGameData` parse is ~308 ms (isolated from JSDOM), >1.5× the 200 ms boot target and scales with every new data table

---
id: ISSUE-037
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

## <a id="ISSUE-038"></a> ISSUE-038: `logMsg` runs an O(903-keys) `Object.keys(tooltipDict)` scan on every log line — 0.32 ms median, 13.9 ms max per call

---
id: ISSUE-038
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

## <a id="ISSUE-039"></a> ISSUE-039: 14 species have their ENTIRE standard-tier build pool tagged illegal — designed sets are dropped, foe falls back to randbats/Tackle

---
id: ISSUE-039
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

## <a id="ISSUE-040"></a> ISSUE-040: All damage modifiers collapsed into one multiply + single floor — Showdown floors per modifier (multi-HP drift)

---
id: ISSUE-040
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

## <a id="ISSUE-041"></a> ISSUE-041: Multi-hit moves reuse one damage roll & one crit check for every hit (no per-hit independence)

---
id: ISSUE-041
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

## <a id="ISSUE-042"></a> ISSUE-042: OHKO moves use the generic accuracy gate — affected by evasion/accuracy stages, Compound Eyes, Gravity; no higher-level auto-fail

---
id: ISSUE-042
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

## <a id="ISSUE-043"></a> ISSUE-043: End-of-turn residuals always resolve player-active-first, not in Speed order

---
id: ISSUE-043
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

## <a id="ISSUE-044"></a> ISSUE-044: Turn-loop median **23–38 ms / p95 35–53 ms / max 46–58 ms** in jsdom — production with `settings.animations=true` adds bounded `sleep()` delays on top, but the jsdom number IS the production floor when animations are off

---
id: ISSUE-044
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

## <a id="ISSUE-045"></a> ISSUE-045: Catch screen result/throw text has no aria-live; outcomes silent to screen readers

---
id: ISSUE-045
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

## <a id="ISSUE-046"></a> ISSUE-046: safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc

---
id: ISSUE-046
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

## <a id="ISSUE-047"></a> ISSUE-047: 957 empty catch(e){} blocks swallow errors silently across battle.html

---
id: ISSUE-047
severity: P2
category: dx
anchor_symbol: save
file: battle.html
agents: [consistency-auditor]
fingerprint: faf7b4c6b420
confidence: high
status: open
---

**Title**: 957 empty catch(e){} blocks swallow errors silently across battle.html

**Evidence**:
```js
grep -cE 'catch\s*\(\s*\w+\s*\)\s*\{\s*\}' battle.html → 957 ; example 51686/50731: } catch (e) {}
```

**Repro**: grep -nE 'catch\\s*\\(\\s*\\w+\\s*\\)\\s*\\{\\s*\\}' battle.html | wc -l → 957 (online-pvp.js → 0).

**Blast radius**: Every subsystem: story flow, save/load, catch flow, PC ops. Real regressions (e.g. a renamed function inside a try) fail silently instead of surfacing during development, which is how flow-ordering bugs hide in a 72k-line file.

**Fix sketch**: Not a sweep-fix candidate at this size. Adopt a _swallow(e, tag) helper that logs under a window.__DEBUG flag, use it for NEW code, and convert existing blocks opportunistically when a region is touched.

**Verification**: Lint rule / grep budget in CI: count must not grow.

---

## <a id="ISSUE-048"></a> ISSUE-048: STORY_MODE_FLOW pins SAVE_VER at 15/17; shipped SAVE_VER is 21

---
id: ISSUE-048
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

## <a id="ISSUE-049"></a> ISSUE-049: sellItem trusts caller-supplied sellPrice instead of re-deriving from the catalog

---
id: ISSUE-049
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

## <a id="ISSUE-050"></a> ISSUE-050: settings.animations defaults to true and is never seeded from prefers-reduced-motion

---
id: ISSUE-050
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

## <a id="ISSUE-051"></a> ISSUE-051: Snow Warning maps to Hail (gen-8) instead of gen-9 Snow

---
id: ISSUE-051
severity: P2
category: engine-fidelity
anchor_symbol: setWeatherFromAbility
current_line_hint: ~10967
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 67e11d6f4653
confidence: high
status: open
---

**Title**: Snow Warning maps to Hail (gen-8) instead of gen-9 Snow

**Evidence**:
```js
'Snow Warning':{ weather: 'Hail',      setter: null         },
// ...
if (mon.ability === "Snow Warning") {
    logMsg(`${mon.name}'s Snow Warning whipped up a hailstorm!`, 'info');
```

**Repro**: jsdom harness — switch in an Abomasnow; weather becomes Hail (chip damage every EoT). @pkmn/sim gen-9 sets Snow: no chip damage, Ice-types get x1.5 Def (boost also unimplemented here).

**Blast radius**: Ice Body, Slush Rush, Aurora Veil setup, Blizzard accuracy, build-roll logic (the Aurora Veil Snowscape injection at ~12838), all Hail-only checks in stat calc and end-of-turn.

**Fix sketch**: Add a distinct 'Snow' weather path (no chip, Ice x1.5 Def in physical D calc), make Hail-synergy abilities/moves accept both, then re-map Snow Warning + Snowscape/Chilly Reception to Snow.

**Verification**: Differential probe Snow Warning teams vs @pkmn/sim — EoT HP deltas vanish; new test asserting no chip + Def boost under Snow.

---

## <a id="ISSUE-052"></a> ISSUE-052: showGameConfirm overwrites a pending _gameConfirmResolve, orphaning the first awaiter

---
id: ISSUE-052
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

## <a id="ISSUE-053"></a> ISSUE-053: Per-leader victory flavor now exists, but 56 leaders lack TRAINER_QUOTES_BY_NAME/LEADER_VICTORY_LINES entries and fall to a generic "You received the <Badge>!" line

---
id: ISSUE-053
severity: P2
category: inconsistency
anchor_symbol: showVictoryOverlay
current_line_hint: ~55542
file: battle.html
agents: [story-mode-investigator]
fingerprint: 14bb789f2b16
confidence: high
status: open
---

**Title**: Per-leader victory flavor now exists, but 56 leaders lack TRAINER_QUOTES_BY_NAME/LEADER_VICTORY_LINES entries and fall to a generic "You received the <Badge>!" line

**Evidence**:
```js
const _leaderLookup = (LEADER_VICTORY_LINES[_trainerName] || LEADER_VICTORY_LINES[_baseTrainerName] || '');
const line = _leaderLookup ? `${speakerName}: ${_leaderLookup}` : `You received the ${_badgeName}!`;
// With GL union-pool (any leader can fill any slot), most leaders have no line.
```

**Repro**: Beat a gym whose assigned leader has no `LEADER_VICTORY_LINES` entry → generic badge line.

**Blast radius**: Fanservice/polish. Prior-audit "generic You received a Gym Badge!" is improved (now names the badge), but the per-leader voice is sparse. Overlaps ledger ISSUE-051.

**Fix sketch**: Extend `LEADER_VICTORY_LINES`/`LEADER_BADGE_REFLECTIONS` coverage toward the full 64-leader union pool, prioritizing the canonical 8.

**Verification**: Every leader that can fill a GL slot has at least a victory line.

---

## <a id="ISSUE-054"></a> ISSUE-054: pSide/fSide side-state literal duplicated 20x in two divergent variants (6-key vs 13-key)

---
id: ISSUE-054
severity: P2
category: inconsistency
anchor_symbol: startPvpBattle
current_line_hint: ~18760
file: battle.html
agents: [consistency-auditor]
fingerprint: 43267bbe216b
confidence: high
status: open
---

**Title**: pSide/fSide side-state literal duplicated 20x in two divergent variants (6-key vs 13-key)

**Evidence**:
```js
18417: pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0, tailwind: 0, luckychant: 0 },
18760: state = { mode: 'pvp', ... pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 }, ... };
```

**Repro**: grep -n "stealthRock: false, toxicSpikes: 0" battle.html → 20 hits. Lines 16776, 18389, 18760, 18820 (both PvP initializers) use the SHORT 6-key variant missing auroraVeil/wishHp/wishTurns/safeguard/mist/tailwind/luckychant; lines 18417/18418, 19717/19718, and the three quick-start initializers at 19763/19815/19873 use the FULL 13-key variant.

**Blast radius**: Online PvP battles start with side-state objects missing 7 keys the engine reads/writes (Aurora Veil, Wish, Safeguard, Mist, Tailwind, Lucky Chant). Works today only because undefined is falsy and assignment creates the key, but any arithmetic like pSide.wishTurns-- on the short variant yields NaN, and the duplication guarantees future drift.

**Fix sketch**: Extract a makeSideState() helper (and a makeFreshBattleState(mode) helper for the whole 15-line state literal, which is itself duplicated at 16776/18389/18760/18820/19717/19763/19815/19873) and use it at all 20 sites.

**Verification**: grep count for the literal drops to 1; tests/suites/online-pvp-security.test.js + quickplay-modes.test.js still pass; a PvP battle using Tailwind/Wish behaves identically.

---

## <a id="ISSUE-055"></a> ISSUE-055: Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots

---
id: ISSUE-055
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

## <a id="ISSUE-056"></a> ISSUE-056: row[0] (row id) diverges from array index at 25 of 67 rows — a permanent footgun for any code mixing the two

---
id: ISSUE-056
severity: P2
category: refactor
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~33037
file: battle.html
agents: [story-mode-investigator]
fingerprint: c9860c1bea48
confidence: high
status: open
---

**Title**: row[0] (row id) diverges from array index at 25 of 67 rows — a permanent footgun for any code mixing the two

**Evidence**:
```js
// row ids in order: 0,68,1,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,12,20,...,39,40,...,55,...
// 25 positions where row[0] !== arrayIndex (Rival rows 68/12/39 and the 40/55 shuffles).
// sm.eventIndex is an ARRAY INDEX; sm.trainerAssignments is keyed by ROW ID;
// GYM_CITY_LEADER_EVENT stores ARRAY INDICES; STORY_THEMED_BATTLES is keyed by ROW ID.
```

**Repro**: `node -e` over STORY_EVENTS_RAW shows 25 id≠index positions (see investigation log).

**Blast radius**: Catch-tutorial gate, theme resolution, leader-name resolution (49286 comment documents a past City-3 bug from exactly this), and any future timeline edit. Several call sites already carry defensive id↔index conversion comments.

**Fix sketch**: Add a boot-time `_STORY_ROWID_TO_IDX` map + a one-line invariant doc at the array head ("row[0] is a stable id, NOT the array index; eventIndex is the array index"). Consider deriving all id-keyed lookups through the map.

**Verification**: A documented helper exists; grep for raw `STORY_EVENTS_RAW[<rowid-var>]` indexing finds none.

---

## <a id="ISSUE-057"></a> ISSUE-057: Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none

---
id: ISSUE-057
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

## <a id="ISSUE-058"></a> ISSUE-058: Surviving canonical specs + code link to docs deleted in the cleanup (dangling references)

---
id: ISSUE-058
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

## <a id="ISSUE-059"></a> ISSUE-059: Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers

---
id: ISSUE-059
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

## <a id="ISSUE-060"></a> ISSUE-060: Verbatim gold-HUD markup re-inlined 11× — the "re-inlined block 25 times" anti-pattern CLAUDE.md warns about

---
id: ISSUE-060
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

## <a id="ISSUE-061"></a> ISSUE-061: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

---
id: ISSUE-061
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

## <a id="ISSUE-062"></a> ISSUE-062: 56 Gym Leaders have no entry in `TRAINER_QUOTES_BY_NAME` — fall through to generic 6-line `Gym Leader` pool

---
id: ISSUE-062
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

## <a id="ISSUE-063"></a> ISSUE-063: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

---
id: ISSUE-063
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

## <a id="ISSUE-064"></a> ISSUE-064: Long story replay shows steady, non-plateauing heap growth (~22–67 KB/turn, R²=0.99 over 250 battles) driven by per-turn / per-distinct-foe DOM scaffolding that GC + reset() do not reclaim

---
id: ISSUE-064
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

## <a id="ISSUE-065"></a> ISSUE-065: Long story replay shows linear (non-quadratic) heap + DOM-node growth that does not plateau — ~0.275 MB and ~52 sprite-container nodes retained per battle

---
id: ISSUE-065
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

## <a id="ISSUE-066"></a> ISSUE-066: STORY_3TRACK_IMPL_PLAN reads as a forward plan but is mostly SHIPPED — only PR-1 marked done

---
id: ISSUE-066
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

## <a id="ISSUE-067"></a> ISSUE-067: Heal phase (+25% maxHp) can push a raid boss back ABOVE the HP threshold the player just crossed

---
id: ISSUE-067
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

## <a id="ISSUE-068"></a> ISSUE-068: Dual story-vs-Frontier path in `_applyStoryBuildPowerTier` is mutually exclusive and safe — legacy branch is NOT removable (in-scope MF needs it)

---
id: ISSUE-068
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

## <a id="ISSUE-069"></a> ISSUE-069: Solo-raid HP is 6.5× base, not the documented (maxParty-1)=5× — stat-mult and HP-scale compound on HP

---
id: ISSUE-069
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

## <a id="ISSUE-070"></a> ISSUE-070: Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent

---
id: ISSUE-070
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

## <a id="ISSUE-071"></a> ISSUE-071: "Free" badge wording inconsistent — "1st Free" vs "Free" vs "Claimed" vs "Locked"

---
id: ISSUE-071
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

## <a id="ISSUE-072"></a> ISSUE-072: _eggBuildFor has an ungated makeBuild fallback that would surface unlocked-mechanic gimmicks on a hatchling (dead today, latent)

---
id: ISSUE-072
severity: P3
category: bug
anchor_symbol: _eggBuildFor
current_line_hint: ~49479
file: battle.html
agents: [story-mode-investigator]
fingerprint: 358b23b1c70f
confidence: medium
status: open
---

**Title**: _eggBuildFor has an ungated makeBuild fallback that would surface unlocked-mechanic gimmicks on a hatchling (dead today, latent)

**Evidence**:
```js
function _eggBuildFor(species) {
    let b = null;
    try {
        if (typeof makeWildBuild === 'function') b = makeWildBuild(species);  // gated
        else if (typeof makeBuild === 'function') b = makeBuild(species);     // UNGATED
    } catch (e) {...}
```

**Repro**: The `else` branch is unreachable (`makeWildBuild` always defined), but if `makeWildBuild` ever throws/returns null the catch is hit, not the else — so it is currently dead. Still a latent gate-leak if refactored.

**Blast radius**: Player-side gimmick gate integrity. Low — branch is presently unreachable.

**Fix sketch**: Wrap the fallback in `_withStoryPlayerGimmickGate(() => makeBuild(species))` to keep the gate invariant true on every player-mon path.

**Verification**: Every player-mon build site (egg, wild, prof, roaming, link-except-cable) routes through the gate or makeWildBuild.

---

## <a id="ISSUE-073"></a> ISSUE-073: Dead CSS selector #story-pc-tab-journal-btn — no such tab button exists in the Poké Center

---
id: ISSUE-073
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

## <a id="ISSUE-074"></a> ISSUE-074: FLOW §8 documents _EARLY_ROUTE_FODDER_CLASSES allowlist as live; code REMOVED it (now grade-pipeline only)

---
id: ISSUE-074
severity: P3
category: inconsistency
anchor_symbol: _pickEarlyRouteBasicTrainer
current_line_hint: ~44542
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 7153d5811421
confidence: high
status: open
---

**Title**: FLOW §8 documents _EARLY_ROUTE_FODDER_CLASSES allowlist as live; code REMOVED it (now grade-pipeline only)

**Evidence**:
```
battle.html ~44542:
// _pickEarlyRouteBasicTrainer + _EARLY_ROUTE_FODDER_CLASSES REMOVED: the pre-Gym-1
// Basic Trainer fight (like every Basic/Gym Trainer fight) is GENERATED at battle
// entry by _generateBasicTrainer, which never consulted this curated assignment — so
// the "easy Youngster/Rattata" curation here was dead. The early fight stays fair via
// the grade pipeline (UNTRAINED build tier + the City 0-1 G4 grade ceiling) ...

vs FLOW §8 line 220: "The pre-Gym-1 Basic Trainer slot (event idx 2 ...) is locked
to a tight 'fodder class' allowlist (_EARLY_ROUTE_FODDER_CLASSES): Youngster, Lass,
Bug Catcher, Hiker, Fisherman ..."
```

**Repro**: `grep -nE '_EARLY_ROUTE_FODDER_CLASSES|_pickEarlyRouteBasicTrainer' battle.html` → only the REMOVED-comment line; no live definition.

**Blast radius**: Doc-only, but misleading for any early-game balance work. FLOW §8 spends a full paragraph enumerating the allowlist and exclusions (Dragon Tamer / Hex Maniac / Black Belt etc.) as a live anti-premium guard. That guard no longer exists — early-fight fairness now rests solely on the UNTRAINED build tier + City 0-1 G4 grade ceiling. A reader could assume Route-1 trainer-class filtering is still active when it is not. Also note: FLOW §8 anchors this to "event idx 2", but idx 2 is absent from STORY_EVENTS_RAW (rows jump 1→3); the pre-Gym-1 route fight is the idx-1 Basic Trainer.

**Fix sketch**: Remove or historicize the §8 line-220 paragraph: state that the early Basic Trainer is generated by `_generateBasicTrainer` with no class allowlist, and that fairness comes from the UNTRAINED build tier + the City 0-1 G4 grade ceiling. Correct the "event idx 2" reference (the row is idx 1; idx 2 does not exist).

**Verification**: `grep -c _EARLY_ROUTE_FODDER_CLASSES STORY_MODE_FLOW.md` → 0; §8 no longer claims a live fodder-class allowlist.

---

## <a id="ISSUE-075"></a> ISSUE-075: Variant roll + Mystery identity use bare `Math.random()` at run construction — non-deterministic across seeded replays

---
id: ISSUE-075
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

## <a id="ISSUE-076"></a> ISSUE-076: Stale RNG comments: wild-species pick is NOT freed from the seed; site count off by 55

---
id: ISSUE-076
severity: P3
category: inconsistency
anchor_symbol: _pickWildSpeciesRandom
current_line_hint: ~60558
file: battle.html
agents: [consistency-auditor]
fingerprint: 378344130d79
confidence: high
status: open
---

**Title**: Stale RNG comments: wild-species pick is NOT freed from the seed; site count off by 55

**Evidence**:
```js
60556: * weights themselves still drive the tier mix; only the actual species pick is freed from the seeded sequence. */
60563: let r = Math.random() * total;   // but Math.random is globally patched to storyRngNext when sm.active && runSeed != null (42864)
42854: // Math.random() in the engine (262 sites across battle.html) routes   // actual count today: 207
```

**Repro**: _pickWildSpeciesRandom only runs during an active story run, where the global Math.random patch (42863-42869) makes every call seeded — so the header comment\u2019s claim that the species pick is "freed from the seeded sequence" is false. Also grep -c "Math.random()" battle.html → 207, not the 262 the determinism comment states.

**Blast radius**: Misleads the next session about replay semantics of wild encounters — exactly the class of doc drift the determinism comment exists to prevent.

**Fix sketch**: Either honor the stated intent (call _nativeMathRandom explicitly) or fix the comment to say the pick is seeded; refresh the 262 count or drop it.

**Verification**: Comment matches behavior; seeded story replay produces identical wild species (current actual behavior).

---

## <a id="ISSUE-077"></a> ISSUE-077: Stale battle.html comments claim deleted tone scripts are "PRESERVED-BUT-DORMANT" and revivable by restoring one call

---
id: ISSUE-077
severity: P3
category: dx
anchor_symbol: _readStorylineFromUI
current_line_hint: ~48182
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 07dd76b0e7a1
confidence: high
status: open
---

**Title**: Stale battle.html comments claim deleted tone scripts are "PRESERVED-BUT-DORMANT" and revivable by restoring one call

**Evidence**:
```js
// ~46820: "Tone scripts stay in STORYLINE_VARIANTS for a possible future fold-in."
// ~47636: "The tone-prefixed entries (secondsun_ / bonekeepers_ / … / static_) are
//          PRESERVED-BUT-DORMANT — not live bugs."
// ~48194: "Tone scripts + _pickRandomStorylineVariant() are preserved for a
//          future fold-in — to revive rolling, restore the call below."
if (_tcState.storyline === 'surprise_me') return 'classic'; // was: _pickRandomStorylineVariant()
```

**Repro**: `grep -nE "function _pickRandomStorylineVariant|secondsun_" battle.html` → no definitions/entries (comment mentions only). The Stage A/B cut (CLAUDE.md) deleted the 7 variant entries, ~56 tone cold-opens, and `_pickRandomStorylineVariant()`.

**Blast radius**: Comments only — zero runtime impact — but they directly contradict CLAUDE.md's "Revive via git history (no longer a one-line roll restore)". A future session following "restore the call below" ships a ReferenceError at run creation; `_tcState.storyline: 'surprise_me' // always random per spec` (~46709) similarly describes retired behavior.

**Fix sketch**: Rewrite the three comment blocks to say the tone data/code was deleted 2026-06 and revival is via git history; drop the "restore the call below" instruction.

**Verification**: `grep -n "PRESERVED-BUT-DORMANT\|preserved for a" battle.html` → 0 hits; comments match CLAUDE.md's cut description.

---

## <a id="ISSUE-078"></a> ISSUE-078: Casino debits floor gold at Math.max(0, gold-bet), which would silently mask a future bet-validation regression

---
id: ISSUE-078
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

## <a id="ISSUE-079"></a> ISSUE-079: "Reveal lands inside first ~10 minutes" comment is wrong — first villain beat is post-Gym-2 (road2)

---
id: ISSUE-079
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

## <a id="ISSUE-080"></a> ISSUE-080: Safari grade weights are a per-badge curve in code, but STORY_MODE_FLOW.md §4 still specs the old flat g1:3/g2:22/g3:50/g4:25

---
id: ISSUE-080
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

## <a id="ISSUE-081"></a> ISSUE-081: Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25

---
id: ISSUE-081
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

## <a id="ISSUE-082"></a> ISSUE-082: Safari grade weights diverge from the canonical spec (`g1:3/g2:22/g3:50/g4:25`) — code is a badge-staged curve; spec is stale

---
id: ISSUE-082
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

## <a id="ISSUE-083"></a> ISSUE-083: FLOW §15b says Fan Club is seeded into STORY_EVENTS_RAW via _seedFanClubAcrossCities() — fn does not exist

---
id: ISSUE-083
severity: P3
category: inconsistency
anchor_symbol: _seedFanClubAcrossCities
current_line_hint: ~48652
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 82253fa135e5
confidence: high
status: open
---

**Title**: FLOW §15b says Fan Club is seeded into STORY_EVENTS_RAW via _seedFanClubAcrossCities() — fn does not exist

**Evidence**:
```
STORY_MODE_FLOW.md §15b (line 650-652):
"Auto-inserted into each STORY_EVENTS_RAW City row's actions array at module
 init via _seedFanClubAcrossCities() — no per-row edits needed."

grep -c _seedFanClubAcrossCities battle.html  → 0
Live mechanism (battle.html ~48652, inside renderCityActions):
  _push('train', makeActionBtn('💖 Pokémon Fan Club','fanclub',
        'window.StoryMode.enterFanClub()','training', ...));
```

**Repro**: `node scripts/debug/symbol-index.mjs --lookup _seedFanClubAcrossCities` → not in index; `grep -c _seedFanClubAcrossCities battle.html` → 0.

**Blast radius**: Doc-only. The Fan Club button IS reachable (rendered per-city by renderCityActions), so the feature is live — but a maintainer following §15b would look for a non-existent init-time array mutation and could wrongly add a STORY_EVENTS_RAW edit. The actions array of City rows is NOT mutated for the Fan Club; the button is injected at render time.

**Fix sketch**: Update FLOW §15b to describe the live path: the Fan Club button is appended in `renderCityActions` (training column) for every city, not seeded into `STORY_EVENTS_RAW` at module init. Drop the `_seedFanClubAcrossCities()` name.

**Verification**: FLOW §15b names `renderCityActions` / `enterFanClub`; no doc references `_seedFanClubAcrossCities`.

---

## <a id="ISSUE-084"></a> ISSUE-084: Post-HoF orientation tip frames the Mystery Figure as un-fought, but the row-67 climax already unmasked it

---
id: ISSUE-084
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

## <a id="ISSUE-085"></a> ISSUE-085: bossMechanicsTurnTick per-turn cost is ~1.5us (foeParty.filter is NOT wasteful); only _showBossBanner DOM is non-trivial and fires ~5x/battle

---
id: ISSUE-085
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

## <a id="ISSUE-086"></a> ISSUE-086: `_storyBuildTierForEvent` Basic-Trainer branch has a dead `b>=5` arm — route fodder jumps T2→T4 at post-game with no T3 step (half-applied curve edit)

---
id: ISSUE-086
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

## <a id="ISSUE-087"></a> ISSUE-087: "wild < gym staff" ladder is violated — Basic Trainer and Gym Trainer 1 share the SAME tier at every badge count

---
id: ISSUE-087
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

## <a id="ISSUE-088"></a> ISSUE-088: _storyEnemyMechKeys header comment claims "GL7 onwards each newly unlocked mechanic enters the pool" but unlock is all-4-at-once at badges≥6

---
id: ISSUE-088
severity: P3
category: inconsistency
anchor_symbol: _storyEnemyMechKeys
current_line_hint: ~41885
file: battle.html
agents: [story-mode-investigator]
fingerprint: e48cee00b68e
confidence: high
status: open
---

**Title**: _storyEnemyMechKeys header comment claims "GL7 onwards each newly unlocked mechanic enters the pool" but unlock is all-4-at-once at badges≥6

**Evidence**:
```js
// comment: "GL6 boss ... STANDARD only, and from GL7 onwards each newly unlocked
//  mechanic enters the enemy candidate pool."
// actual unlock site (onBattleEnd ~55194): const slotsUnlocked = badges < 6 ? 0 : 4;
//  → all four mechanics unlock together at Colress / City-6 clear, not dripped GL7+.
```

**Repro**: Read the comment at `_storyEnemyMechKeys` vs the `slotsUnlocked = badges<6?0:4` grant.

**Blast radius**: Documentation only — gate logic is correct (filters on `sm.unlockedGimmicks`). Matches ledger ISSUE-004 (docs still describe one-per-gym drip).

**Fix sketch**: Update the comment to "from the GL6/Colress clear, all four enabled mechanics unlock together and enter the enemy pool."

**Verification**: Comment matches the `badges < 6 ? 0 : 4` unlock rule.

---

## <a id="ISSUE-089"></a> ISSUE-089: Dead code: 13 unreferenced tutor/transformation/EV UI helpers (_tx*/_tutor*/_ev*)

---
id: ISSUE-089
severity: P3
category: refactor
anchor_symbol: _txAbilityCmp
current_line_hint: ~67721
file: battle.html
agents: [consistency-auditor]
fingerprint: 8bf21c3e8106
confidence: high
status: open
---

**Title**: Dead code: 13 unreferenced tutor/transformation/EV UI helpers (_tx*/_tutor*/_ev*)

**Evidence**:
```js
battle.html:66247 _tutorRefreshMoveDetailRow; 66267 _tutorEquippedDescHtml; 67721 _txAbilityCmp; 68006 _txNatureRecsByPurpose; 68071 _txEvPresetRecsByPurpose; 68121 _txStripPicks; 68139 _txStripHtml; 68155 _txMoveEffectShort; 68176 _tutorFillMoveSelect; 69510 _txApplyNatureFilters; 71304 _evTotal; 71350 _evTrainerTopSpreadKeys; 71493 _evSpreadShortLine — 0 call sites
```

**Repro**: For each name: grep -c "<name>" across battle.html, online-pvp.js, move-*-map.js, index.html, sw.js, tests/, scripts/ → exactly 1 hit (the declaration). No window.* export, no dynamic string lookup (grep for bracket-lookup patterns → 0).

**Blast radius**: None at runtime — pure dead weight (~500 lines) in the Move Tutor / Transformation / EV-trainer UI region, left behind by earlier redesigns of those panels.

**Fix sketch**: Behavior-preserving deletion (grep-verified). Per CLAUDE.md this class of refactor needs direction-level approval before the sweep, not diff-level.

**Verification**: grep for each name → 0 hits; jsdom harness boots; tutor/EV screens render in a story run.

---

## <a id="ISSUE-090"></a> ISSUE-090: `_validateTrainerData` logs a success `console.log` on every boot (ungated)

---
id: ISSUE-090
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

## <a id="ISSUE-091"></a> ISSUE-091: Wild grade keyed on CITY (STORY_WILD_GRADE_BY_CITY), not badges — spec §3/§15f say _WILD_GRADE_CURVE_BY_BADGES (which does not exist)

---
id: ISSUE-091
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

## <a id="ISSUE-092"></a> ISSUE-092: Diacritics: 1262 bare "Pokemon" in Showdown-derived desc strings shown in tooltips

---
id: ISSUE-092
severity: P3
category: inconsistency
anchor_symbol: abilities.json
file: data/abilities.json
agents: [consistency-auditor]
fingerprint: 9ea1cf875766
confidence: high
status: open
---

**Title**: Diacritics: 1262 bare "Pokemon" in Showdown-derived desc strings shown in tooltips

**Evidence**:
```js
data/abilities.json: 714 bare "Pokemon"; data/moves.json: 413; data/items.json: 135 — all in UI-facing desc/shortDesc strings (e.g. "1/3 chance of infatuating Pokemon of the opposite gender...")
```

**Repro**: grep -c "\\bPokemon\\b" data/abilities.json data/moves.json data/items.json. battle.html itself is clean: its 20 remaining hits are comments plus the intentional bare→diacritic normalization map at 42336-42339; all dialogue JSON under data/dialogue/ is clean (0 hits).

**Blast radius**: Ability/move/item tooltips and info panels render "Pokemon" while every hand-written UI string says "Pokémon" — visible register mismatch on the same screen.

**Fix sketch**: One-time normalization pass over the three JSON files (or replace at display time in the tooltip renderer to survive future Showdown data refreshes).

**Verification**: grep → 0 in the three files (or renderer test asserting the display substitution).

---

## <a id="ISSUE-093"></a> ISSUE-093: items.json defines 93 mega stones but the engine recognizes only 51 — 45 non-canonical stones are inert data

---
id: ISSUE-093
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

## <a id="ISSUE-094"></a> ISSUE-094: Magma/Aqua bosses flash the same telegraph banner twice in the first two turns

---
id: ISSUE-094
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

## <a id="ISSUE-095"></a> ISSUE-095: `BOSS_MECHANICS` stub object is dead (never called); its "engine wiring is a no-op" comment is now false

---
id: ISSUE-095
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

## <a id="ISSUE-096"></a> ISSUE-096: `BOSS_MECHANICS` registry (`~42172`) is dead — pushes to `battle._mechanics`, which is never read

---
id: ISSUE-096
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

## <a id="ISSUE-097"></a> ISSUE-097: buyItem cheap-consumable path is unguarded but synchronous; only the confirm-gated branch can interleave

---
id: ISSUE-097
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

## <a id="ISSUE-098"></a> ISSUE-098: Dead code: 5 misc data/UI helpers in battle.html + mergeData in online-pvp.js

---
id: ISSUE-098
severity: P3
category: refactor
anchor_symbol: calculateTier
current_line_hint: ~16896
file: battle.html
agents: [consistency-auditor]
fingerprint: ac343772de7d
confidence: high
status: open
---

**Title**: Dead code: 5 misc data/UI helpers in battle.html + mergeData in online-pvp.js

**Evidence**:
```js
battle.html:10907 getTooltipKeysSorted; 14362 smogonKey; 16531 getStatColorClass; 16896 calculateTier; 16997 calculatePoolTiers; online-pvp.js:67 mergeData — 0 call sites
```

**Repro**: Same grep protocol: exactly 1 hit each across all shipped files, tests/ and scripts/. mergeData (online-pvp.js:67) is a 4-line deepClone+assign wrapper superseded by direct Object.assign at the pushData call sites.

**Blast radius**: None at runtime; calculateTier/calculatePoolTiers are leftovers from a pre-grade tiering system and can mislead readers hunting for the live grade logic (getMonGrade).

**Fix sketch**: Delete after direction approval; grep-verified 1:1.

**Verification**: grep → 0 hits each; engine harness boots; online PvP suite green.

---

## <a id="ISSUE-099"></a> ISSUE-099: Roulette doc comment promises a color-row payout the code never pays

---
id: ISSUE-099
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

## <a id="ISSUE-100"></a> ISSUE-100: Integration test asserts stale "PC cap of 10" and never checks the real PC_BOX_CAP=30

---
id: ISSUE-100
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

## <a id="ISSUE-101"></a> ISSUE-101: catchUnlocked field is fully gone (not written, not in sm defaults); FLOW §10 still documents it as a reserved/legacy field

---
id: ISSUE-101
severity: P3
category: inconsistency
anchor_symbol: catchUnlocked
current_line_hint: n/a
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7bfd9b611d8f
confidence: high
status: open
---

**Title**: catchUnlocked field is fully gone (not written, not in sm defaults); FLOW §10 still documents it as a reserved/legacy field

**Evidence**:
```js
// grep catchUnlocked battle.html → 0 hits.
// FLOW §10: "catchUnlocked: false  // ⚠ RESERVED/LEGACY — written but never read"
// migrateStoryPreV15 no longer sets it (the spec'd line was dropped).
```

**Repro**: `grep -n catchUnlocked battle.html` → nothing.

**Blast radius**: Harmless (the live gate is `sm.catchTutorialDone`). Pure doc/schema drift; a forward-imported save from an even older build that reads `catchUnlocked` would get `undefined` (falsy), which is the intended default anyway.

**Fix sketch**: Remove the `catchUnlocked` row from FLOW §10's schema block.

**Verification**: §10 schema lists only live fields.

---

## <a id="ISSUE-102"></a> ISSUE-102: CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion

---
id: ISSUE-102
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

## <a id="ISSUE-103"></a> ISSUE-103: Duplicated logic: dev-seed blocks, weather/terrain rollers, and inline mon-id generation

---
id: ISSUE-103
severity: P3
category: refactor
anchor_symbol: crucibleGymPick
current_line_hint: ~50191
file: battle.html
agents: [consistency-auditor]
fingerprint: dc0057c364fe
confidence: medium
status: open
---

**Title**: Duplicated logic: dev-seed blocks, weather/terrain rollers, and inline mon-id generation

**Evidence**:
```js
50191/50358 + 50289/50414: duplicated dev-seed blocks (sm.badges = 8; if (sm.runSeed == null ...) sm.runSeed = 0xDEADBEEF; sm._strngState = null; if (!sm.settings) sm.settings = {...}; enabledGens backfill) ; 23796+23812: rollRandomWeather/rollRandomTerrain identical except table ; 8 sites: id: 'm_' + Math.random().toString(36).slice(2, 10)
```

**Repro**: Scripted 8-line duplicate-window scan over battle.html: 10 groups. Largest: the story debug seeders (devStoryJump / City8 / testmega, ~20 significant lines duplicated twice each around 50191/50358 and 50289/50414); rollRandomWeather vs rollRandomTerrain (23790-23820) differ only in the option table and message map; the mon-id literal appears 8x (40460, 42639, 42672, 48365, 53630, 54047, 54095, 54126, 59395, 63208, 63248).

**Blast radius**: Dev helpers drift apart silently (one seeder gets a new settings key, the twin does not); mon-id format changes would need an 11-site sweep.

**Fix sketch**: Extract _devSeedBaseline(), _rollRandomField(tableKind), and newMonId() helpers.

**Verification**: Duplicate-window scan groups drop; devStoryJump/testmega still seed identical state.

---

## <a id="ISSUE-104"></a> ISSUE-104: ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss

---
id: ISSUE-104
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

## <a id="ISSUE-105"></a> ISSUE-105: Leech Seed drain is processed AFTER burn/poison/toxic damage (canon order is before)

---
id: ISSUE-105
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

## <a id="ISSUE-106"></a> ISSUE-106: Ungated console.log: SpriteScale dex probe logs to every player console on enrich miss

---
id: ISSUE-106
severity: P3
category: dx
anchor_symbol: enrichBaseStatsHeightsFromDex
current_line_hint: ~11210
file: battle.html
agents: [consistency-auditor]
fingerprint: b999bdcd6db9
confidence: high
status: open
---

**Title**: Ungated console.log: SpriteScale dex probe logs to every player console on enrich miss

**Evidence**:
```js
11210: console.log('[SpriteScale] dex probe Pikachu', { id, heightmOnClass: ..., weightkg: ... });
11211: } catch (e) { console.log('[SpriteScale] dex probe failed', e); }
```

**Repro**: Load with a dex whose species lack heightm (n === 0 branch in enrichBaseStatsHeightsFromDex) — the Pikachu probe logs unconditionally. All ~26 other console.log sites in battle.html are correctly gated behind window.__DEBUG_* flags or live inside explicit dev commands (devStoryJump, testmega, __devRevealFoeTeam).

**Blast radius**: Console noise only.

**Fix sketch**: Gate the probe behind window.__DEBUG_SPRITE_SCALE like its siblings at 11190/16595.

**Verification**: grep for ungated console.log in the SpriteScale region → 0.

---

## <a id="ISSUE-107"></a> ISSUE-107: Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene

---
id: ISSUE-107
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

## <a id="ISSUE-108"></a> ISSUE-108: enterArtifactShop and enterShop lack the _storyTryBeginInteraction guard used by other facility entries

---
id: ISSUE-108
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

## <a id="ISSUE-109"></a> ISSUE-109: Story facility regions use weak lowercase aria-labels ("story pokemoncenter", "story link")

---
id: ISSUE-109
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

## <a id="ISSUE-110"></a> ISSUE-110: Professor flavor quote uses bare Math.random(), breaking seeded replay determinism

---
id: ISSUE-110
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

## <a id="ISSUE-111"></a> ISSUE-111: Facility name spelled "PokéMart" (2 sites) vs "Pokémart" (14 sites) in UI

---
id: ISSUE-111
severity: P3
category: inconsistency
anchor_symbol: enterShop
current_line_hint: ~56718
file: battle.html
agents: [consistency-auditor]
fingerprint: 57060fcc6914
confidence: high
status: open
---

**Title**: Facility name spelled "PokéMart" (2 sites) vs "Pokémart" (14 sites) in UI

**Evidence**:
```js
// 56718:  ${btn(fico('mart'), 'PokéMart', "window.StoryMode.enterShop('mart')", ...)}
// 58109:  ...restock at any city PokéMart.</div>
// vs 14 other user-visible sites using 'Pokémart':
//   9619 (shop header), 12375 (help text), 48600 (action btn label), 58670, 61714, ...
```

**Repro**: `grep -oE "PokéMart" battle.html` → 2 hits; `grep -oE "Pokémart" battle.html` → 14 hits. The shop header (line 9619) the player sees on entry reads "Pokémart"; the city-menu button that opens it (56718) reads "PokéMart". Internal action-id 'Pokemart' (no diacritic, ~24 sites) is a key, not user-visible — leave it.

**Blast radius**: Story-mode city menu + out-of-balls battle prompt. Cosmetic only; no logic depends on the label text.

**Fix sketch**: Normalize the two "PokéMart" string literals (56718, 58109) to "Pokémart" to match the canonical shop header and the rest of the UI.

**Verification**: `grep -oE "PokéMart" battle.html` → 0 hits after the edit.

---

## <a id="ISSUE-112"></a> ISSUE-112: Item spelled "Pokéball" in horror-arc lore vs "Poké Ball" everywhere else

---
id: ISSUE-112
severity: P3
category: inconsistency
anchor_symbol: enterShop
current_line_hint: ~35050
file: battle.html
agents: [consistency-auditor]
fingerprint: 2a8d10acc624
confidence: high
status: open
---

**Title**: Item spelled "Pokéball" in horror-arc lore vs "Poké Ball" everywhere else

**Evidence**:
```js
// 35050: "A folded photograph in a Pokéball box ... The Pokéball is empty."
// 35053: "A folded photograph inside a Pokéball box ..."
// 35152: "A diary on the route, locked in a Pokéball case."
// 35155: "...locked inside a Pokéball case..."
// vs canonical "Poké Ball"/"Poké Balls" (40 user-visible sites, e.g. 12375, 55751, 56718, 58109)
```

**Repro**: `grep -oE "Pokéball" battle.html` → 5 hits (all in extra/horror-arc STORY lore body strings); `grep -cE "Poké Ball"` → 24 + 16 "Poké Balls". The 'Vivillon-Pokeball' sprite IDs (no diacritic) are form keys, not prose — leave them.

**Blast radius**: Extra-arc (horror) story lore overlays only. Cosmetic.

**Fix sketch**: Replace "Pokéball" → "Poké Ball" in the four lore strings (lines 35050/35053/35152/35155) to match the game-wide spelling.

**Verification**: `grep -oE "Pokéball" battle.html` → 0 hits after the edit.

---

## <a id="ISSUE-113"></a> ISSUE-113: data/builds/gen*.json (3.9 MB) duplicates builds.csv 1:1 behind a fallback that can't realistically fire

---
id: ISSUE-113
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

## <a id="ISSUE-114"></a> ISSUE-114: Foe stat curve keeps climbing post-Gym-4 (City7 1.08, City8 1.10); FLOW §8 says softening ends and foes sit at 1.00 from ≥3 badges

---
id: ISSUE-114
severity: P3
category: inconsistency
anchor_symbol: FOE_POWER_CURVE
current_line_hint: ~38265
file: battle.html
agents: [story-mode-investigator]
fingerprint: 95312ca59a5b
confidence: high
status: open
---

**Title**: Foe stat curve keeps climbing post-Gym-4 (City7 1.08, City8 1.10); FLOW §8 says softening ends and foes sit at 1.00 from ≥3 badges

**Evidence**:
```js
const FOE_POWER_CURVE = [0.80,0.85,0.90,0.95,1.00,1.03,1.05,1.08,1.10,1.15]; // city 0..9
// FLOW §8: "| ≥ 3 badges | every fight | 1.00 — softening ends |"
```

**Repro**: `_storyEnemyStatMult('Gym Trainer 1', 7, ...)` → 1.08, not 1.00.

**Blast radius**: Doc-vs-code balance drift; the new model is a smooth city ramp rather than a flat 1.00 plateau. Maintainer-owned numbers.

**Fix sketch**: Update FLOW §8 to describe the city-indexed `FOE_POWER_CURVE` (0.80→1.15) instead of the flat-after-3-badges model.

**Verification**: §8 narrative matches the frozen curve array.

---

## <a id="ISSUE-115"></a> ISSUE-115: Wave-2 TODO re-enumeration: 35 stubs remain (not 351); 7 are obsolete duplicates of manual/ coverage

---
id: ISSUE-115
severity: P3
category: test-gap
anchor_symbol: generate-move-tests
current_line_hint: ~65
file: tests/audit/generate-move-tests.js
agents: [test-coverage-filler]
fingerprint: 288c20292150
confidence: high
status: open
---

**Title**: Wave-2 TODO re-enumeration: 35 stubs remain (not 351); 7 are obsolete duplicates of manual/ coverage

**Evidence**:
```text
grep -cE "^\s*it\.todo\(" tests/moves/by-category/*.test.js
  status.test.js: 35   special.test.js: 0   physical.test.js: 0
File headers still read "TODO (manual fill-in required): 210 / 75 / 67" (=352) but
those counts include the 175/75/67 moves now covered by pointer comments
("covered by a manual test (see by-category/manual/)") -> misleading header label.
```

**Repro**: `grep -nE "it\.todo\(" tests/moves/by-category/{status,special,physical}.test.js` on HEAD (6fd838d).

## Research: current TODO enumeration + setup-shape clusters

The "~351 todos" figure in the Wave-2 brief is the *generation-time* count baked into
the file headers. The Wave-1 fill pass (handoff docs 01–03) already converted the
physical/special todos and ~175 status todos into 26 promoted files under
`tests/moves/by-category/manual/` (306 tests). What remains on HEAD is exactly the
generator's `DEFERRED` set: **35 `it.todo` stubs, all in `status.test.js`**.

### Cluster breakdown (by setup shape, ordered cheapest -> most expensive)

| # | Cluster id | Setup shape | Count | Members | Effort |
|---|-----------|-------------|-------|---------|--------|
| 1 | `covered-elsewhere-obsolete` | none — real tests already exist in `manual/` | 7 | Crafty Shield, Mat Block, Powder, Electrify, Nightmare, Laser Focus (all in `manual/unimplemented-six.test.js`, implemented Wave-2 Batch-2), Decorate (`manual/fidelity-high-fixes.test.js`) | Trivial: move these 7 out of the generator's DEFERRED "unimplemented" comment block into manual-covered set + regenerate. No new tests. |
| 2 | `field-flag-single-turn` | use move, assert field/volatile flag in 1v1 harness (work on HEAD per ISSUE-139 re-verify) | 3 | Ion Deluge, Fairy Lock, Dark Void (assert species gate: correctly fails for non-Darkrai; optionally sleeps from Darkrai) | Low: 1 turn each, direct state assert |
| 3 | `item-swap-precondition` | give both mons held items, run turn, assert bidirectional swap (engine fix landed: ledger "Trick / Switcheroo swap one-directional" = fixed-main) | 2 | Trick, Switcheroo | Low |
| 4 | `prior-move-context` | foe uses a move turn 1, user's move turn 2 references it | 1 | Disable (assert foe's last move is disabled / unusable) | Low-medium: 2-turn `window.playTurn` choreography |
| 5 | `consumed-item-precondition` | user holds a berry, drops below trigger HP so it is eaten, later turn restores it | 1 | Recycle | Medium: multi-turn HP choreography (template: `manual/misc-status.test.js`) |
| 6 | `faint-switch-heal` | 2-mon party; user faints via own move; assert incoming switch-in fully healed (+PP for Lunar Dance); unblocked by the Parting Shot `state.pTeam`->`state.playerParty` fix | 2 | Healing Wish, Lunar Dance | Medium: party + forced-switch choreography (template: `manual/switch-pivot.test.js`) |
| 7 | `ally-target-doubles` | needs an ally slot — no observable effect in the 1v1 harness | 16 | Heal Pulse, Floral Healing, After You, Ally Switch, Aromatic Mist, Coaching, Dragon Cheer, Flower Shield, Follow Me, Gear Up, Helping Hand, Magnetic Flux, Quash, Rage Powder, Rototiller, Spotlight | Blocked: requires a doubles harness (out of active scope — Story is 1v1) or a maintainer decision to retitle as permanent `[doubles-only]` todos per handoff 03 Bucket C |
| 8 | `banned-unreachable` | moves banned / not story-reachable and intentionally unimplemented (ISSUE-139) | 3 | Corrosive Gas, Venom Drench, Doodle | Decision-only: leave as permanent todos or drop from the generated skeleton; no test value until implemented |

Totals: 35 stubs = 7 obsolete + 7 fillable-now (clusters 2–4) + 3 medium choreography (5–6) + 16 doubles-blocked + 3 banned. Realistic fill ceiling without a doubles harness or maintainer decisions: **10 stubs** (clusters 2–6), one fix-mode invocation.

### Obsolete / stale items (no test work needed)

1. The 7 `covered-elsewhere-obsolete` stubs above — behavior already asserted in `manual/`; the DEFERRED comment "unimplemented (no handler)" in `tests/audit/generate-move-tests.js:~66` is stale post-Batch-2.
2. Header comment "TODO (manual fill-in required): N" in all three generated files counts manual-covered moves too; relabel on next regeneration.
3. ISSUE-139's "STILL UNIMPLEMENTED (Tier 3)" list (Crafty Shield, Mat Block, Powder, Electrify, Nightmare, Laser Focus) is stale for the same reason — those six now have handlers + regression tests; the finding can be narrowed to the banned trio.

### Recommended execution order (fix mode)

1. Cluster 1 (generator hygiene, regenerate, -7 todos)
2. Clusters 2+3+4 in one draft file (-6)
3. Clusters 5+6 in one draft file (-3)
4. Clusters 7+8: present the Bucket-C decision to the maintainer (retitle vs doubles harness); encode outcome in the generator so the remaining todos are self-documenting.

**Blast radius**: test suite only; no game behavior. Stale DEFERRED/ISSUE-139 text risks a future agent re-investigating already-fixed moves.

**Fix sketch**: Update the generator's DEFERRED set + header label, regenerate the three files, then fill clusters 2–6 as drafts; put the doubles-only/banned decision to the maintainer.

**Verification**: `node --test --test-concurrency=4 'tests/moves/**/*.test.js'` -> 0 fail, and `# todo` reflects only the agreed doubles-only/banned set (~19) or fewer.

---

## <a id="ISSUE-116"></a> ISSUE-116: Rival phase enum skips 1 (EARLY rival returns phase 2), leaving a dead phase-1 dialogue pool

---
id: ISSUE-116
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

## <a id="ISSUE-117"></a> ISSUE-117: Two disjoint "beat" systems — row-id `STORY_BEATS` (cold-opens) vs sceneKey `*_STORY_BEATS` (3-track)

---
id: ISSUE-117
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

## <a id="ISSUE-118"></a> ISSUE-118: Dead code: 10 unreferenced story-mode helpers; getTrainerQuote survives only in a test

---
id: ISSUE-118
severity: P3
category: refactor
anchor_symbol: getTrainerQuote
current_line_hint: ~39651
file: battle.html
agents: [consistency-auditor]
fingerprint: 35c6ab72ff61
confidence: high
status: open
---

**Title**: Dead code: 10 unreferenced story-mode helpers; getTrainerQuote survives only in a test

**Evidence**:
```js
battle.html:39583 storyFirstBattleIndexAfter; 39651 getTrainerQuote; 44165 _rivalScoreAttackTypeVsParty; 44637 _storyBuildTierLabel; 46714 _trainerPrettyName; 51821 _storyEventIsIconicFight; 55590 _storyDefaultMoveRanker; 59951 _wildSlotsRemainingForBattle; 61320 _storyShuffle; 65982 _hasHeartScale — 0 call sites in shipped code
```

**Repro**: Same grep protocol as the _tx* cluster: 1 hit each (the declaration). Exception: getTrainerQuote has 8 references in tests/smoke-dialogue-load.mjs — the smoke test exercises a function no shipped code path calls; the live path is getTrainerQuoteForBattle (39663, called from 57681).

**Blast radius**: None at runtime. The test coverage on getTrainerQuote gives false confidence — it can pass while the real dialogue path regresses.

**Fix sketch**: Delete the 10 helpers (grep-verified 1:1 removal, needs direction approval per CLAUDE.md); repoint smoke-dialogue-load.mjs at getTrainerQuoteForBattle.

**Verification**: grep → 0 hits each; smoke-dialogue-load.mjs green against getTrainerQuoteForBattle.

---

## <a id="ISSUE-119"></a> ISSUE-119: 135 gen-9 species entries + 45 "Future" fan items are unreachable dead entries

---
id: ISSUE-119
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

## <a id="ISSUE-120"></a> ISSUE-120: Cold boot is ~3.0 s in jsdom (5-process median 3009 ms) — within the harness's relaxed 5 s self-target but 15× the mandate's 200 ms; a target-mismatch to resolve, not a regression

---
id: ISSUE-120
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

## <a id="ISSUE-121"></a> ISSUE-121: data-validator checks the fallback dataset against the wrong layer union — never validates builds.csv

---
id: ISSUE-121
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

---

## <a id="ISSUE-122"></a> ISSUE-122: Button label patterns inconsistent — Professor uses verb+noun, all others noun-only; Evolution facility has 3 names

---
id: ISSUE-122
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

## <a id="ISSUE-123"></a> ISSUE-123: Empty-state copy varies across facilities for the same "no party member" condition

---
id: ISSUE-123
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

## <a id="ISSUE-124"></a> ISSUE-124: 7 build abilities (Telepathy/Mountaineer/Friend Guard/Healer/Pickup/Rebound/Symbiosis) are silent no-ops the engine never implements

---
id: ISSUE-124
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

## <a id="ISSUE-125"></a> ISSUE-125: `makeBuild` is flat across power tiers (T1-T4 spread <0.04 ms median) — confirms no per-tier pathology; baseline 0.045 ms median

---
id: ISSUE-125
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

## <a id="ISSUE-126"></a> ISSUE-126: Catch-tutorial migration hard-codes intro-rival index (>1) instead of deriving it

---
id: ISSUE-126
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

## <a id="ISSUE-127"></a> ISSUE-127: catchTutorialDone migration hardcodes eventIndex>1 instead of deriving the intro-rival row

---
id: ISSUE-127
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

## <a id="ISSUE-128"></a> ISSUE-128: catchTutorialDone migration hard-codes `eventIndex > 1` instead of deriving the intro-rival array index

---
id: ISSUE-128
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

## <a id="ISSUE-129"></a> ISSUE-129: migrateStoryPreV16 marks catchTutorialDone for any pre-v16 save at eventIndex>1, dropping the tutorial for a save sitting on the first route battle

---
id: ISSUE-129
severity: P3
category: bug
anchor_symbol: migrateStoryPreV16
current_line_hint: ~40690
file: battle.html
agents: [story-mode-investigator]
fingerprint: f815c8179eae
confidence: medium
status: open
---

**Title**: migrateStoryPreV16 marks catchTutorialDone for any pre-v16 save at eventIndex>1, dropping the tutorial for a save sitting on the first route battle

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1;  // intro rival is array idx 1
    }
}
// A pre-v16 save at eventIndex===2 (about to fight the first Basic Trainer,
// never having seen the tutorial) gets marked done → tutorial never fires,
// 2nd party slot never auto-filled.
```

**Repro**: Pre-v16 save with eventIndex 2 and a 1-mon team → loads with catchTutorialDone=true, no tutorial.

**Blast radius**: One-time onboarding for the narrow set of pre-v16 saves paused exactly on the first post-rival route. Cosmetic (player can still catch normally).

**Fix sketch**: Acceptable as documented; if tightening, gate on `(sm.team||[]).length >= 2 || eventIndex > 1` so a lean-team pre-v16 save still gets the tutorial.

**Verification**: A v15 save at eventIndex 2 with 1 mon still fires the tutorial on next route.

---

## <a id="ISSUE-130"></a> ISSUE-130: STORY_MODE_FLOW §14d describes Mystery Figure's 7-identity flow + Caged God repurpose; code has only the_first

---
id: ISSUE-130
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

## <a id="ISSUE-131"></a> ISSUE-131: Mystery Figure rotating-cast scaffolding is now vestigial — collapsed to a single hard-locked identity "the_first"

---
id: ISSUE-131
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

## <a id="ISSUE-132"></a> ISSUE-132: Fresh runs start with 0 Poké Balls; spec §1/§10 say 5 (only migrated saves get 5)

---
id: ISSUE-132
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

## <a id="ISSUE-133"></a> ISSUE-133: `parseCSV` of `data/builds.csv` (2.6 MB, 17,397 rows) blocks the main thread for **180 ms median** during boot

---
id: ISSUE-133
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

## <a id="ISSUE-134"></a> ISSUE-134: `parseMoveEffects` per-move latency varies by ~315× between fastest and slowest moves; outliers are 25–250× the median

---
id: ISSUE-134
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

## <a id="ISSUE-135"></a> ISSUE-135: `parseMoveEffects` per-move latency varies ~257× (median 0.012 ms, slowest 3.19 ms) — multi-stat-boost / "dance" moves are the outliers

---
id: ISSUE-135
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

## <a id="ISSUE-136"></a> ISSUE-136: `parseMoveEffects` re-allocates 19 constant `Set` literals on every call and pays a 2–14 ms one-time JIT cost on first touch of each branch (warm cost is fine at ~0.01 ms)

---
id: ISSUE-136
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

## <a id="ISSUE-137"></a> ISSUE-137: parseMoveEffects per-move spread is 130x (stat-stage moves ~1.3ms vs 0.01ms median) — benign, multiple changeStage calls

---
id: ISSUE-137
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

## <a id="ISSUE-138"></a> ISSUE-138: Stat-change status moves (Decorate, Coaching, Baby-Doll Eyes, Calm Mind) are 50–100× slower than damage moves — `changeStage` calls `logMsg` 1–3× per stat tick, each hitting the 903-key tooltipDict scan

---
id: ISSUE-138
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

## <a id="ISSUE-139"></a> ISSUE-139: Hand-quantification of parseMoveEffects Set-literal churn — 18 `new Set([...])` per call, 13 μs of pure allocation per call (≈70% of warm 18 μs median)

---
id: ISSUE-139
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

## <a id="ISSUE-140"></a> ISSUE-140: Several status moves have no observable effect in the battle engine

---
id: ISSUE-140
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

**Progress** (P3 re-verification on HEAD, branch claude/inspiring-shannon-MP5aq):
  - FIXED this pass: Power Shift (Atk<->Def swap), Purify (cure + 50% heal), Nature Power
    (terrain dispatch -> Tri Attack), Copycat / Mirror Move / Me First (now route through
    performAction so damaging copies land), Parting Shot (guard read the never-assigned
    `state.pTeam`; now `state.playerParty` — also unblocks Healing Wish / Lunar Dance).
    Each has a regression test under by-category/manual/.
  - WORK ON HEAD (finding had drifted, no fix needed): Ion Deluge, Disable, Fairy Lock.
  - BANNED / not story-reachable: Corrosive Gas, Venom Drench, Doodle.
  - STILL UNIMPLEMENTED (Tier 3, outside this pass's approved scope) — keeps this finding open:
    Crafty Shield, Mat Block, Powder, Electrify, Nightmare, Laser Focus.

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

## <a id="ISSUE-141"></a> ISSUE-141: Mystery-mode Accept has no double-submit guard (re-renders swap picker on repeat clicks)

---
id: ISSUE-141
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

## <a id="ISSUE-142"></a> ISSUE-142: Dead `'Cyrus'` Mystery-Figure sprite fallbacks remain after the identity was collapsed to a single value ('the_first' / Red)

---
id: ISSUE-142
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

## <a id="ISSUE-143"></a> ISSUE-143: Rival phase-4 standing pools have only 2 lines each (other variants have 3)

---
id: ISSUE-143
severity: P3
category: inconsistency
anchor_symbol: rivalStandingPrimaryQuotePool
current_line_hint: ~39625
file: battle.html
agents: [consistency-auditor]
fingerprint: b1d501c75641
confidence: high
status: open
---

**Title**: Rival phase-4 standing pools have only 2 lines each (other variants have 3)

**Evidence**:
```js
39625: if (rivalChamp && phase === 4) return ['I took the crown last time...','The Hall can write both names...'];  // 2 lines
39631: if (phase === 4) return ['You took the crown off my head...','Champion or challenger, one win flips the story...'];  // 2 lines
```

**Repro**: Read rivalStandingPrimaryQuotePool (39615-39637): the streak and last-winner variants all carry 3 lines; the two phase-4 crown variants carry 2, so post-HoF rematches repeat rival openers ~1.5x sooner than any other phase.

**Blast radius**: Post-game rival rematches only; pure flavor. Everything else in the dialogue-pool audit is healthy: TRAINER_QUOTES_BY_NAME covers 105 names incl. all leaders/E4/champions with >=2 lines, LEADER_VICTORY_LINES is per-leader and wired into showVictoryOverlay (58328) — the prior-audit generic-badge-line issue is fixed.

**Fix sketch**: Add one line to each phase-4 variant (fanservice opportunity: reference the specific Hall of Fame team).

**Verification**: Each return array in rivalStandingPrimaryQuotePool has >=3 entries.

---

## <a id="ISSUE-144"></a> ISSUE-144: `rollTrainerTeam` cold-call is **1.63 ms median (max 3.22 ms)**; well under the 50 ms target but worth recording as the deep-dive baseline before the upcoming difficulty-curve work

---
id: ISSUE-144
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

## <a id="ISSUE-145"></a> ISSUE-145: Safari runs 10 encounters / 10 balls; FLOW one-screen summary §1 still says "up to 6 per run"

---
id: ISSUE-145
severity: P3
category: inconsistency
anchor_symbol: SAFARI_MAX_ENCOUNTERS
current_line_hint: ~56496
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5898780a2ef2
confidence: high
status: open
---

**Title**: Safari runs 10 encounters / 10 balls; FLOW one-screen summary §1 still says "up to 6 per run"

**Evidence**:
```js
const SAFARI_MAX_ENCOUNTERS = 10;  let SAFARI_BALLS_PER_SESSION = 10;
// FLOW §1: "Continuous random encounters up to 6 per run"
// (FLOW §4 detail table correctly says 10 — only the §1 summary lags.)
```

**Repro**: Compare `SAFARI_MAX_ENCOUNTERS` to FLOW §1 vs §4.

**Blast radius**: Doc inconsistency between §1 and §4 of the same spec.

**Fix sketch**: Change the §1 summary row from "6 per run" to "10 per run" to match §4 and code.

**Verification**: §1 and §4 agree on encounter count.

---

## <a id="ISSUE-146"></a> ISSUE-146: Safari flee-risk surfaced in color (orange #ff7043) and small 10px text only

---
id: ISSUE-146
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

## <a id="ISSUE-147"></a> ISSUE-147: FLOW's own 2026-06-17 reconciliation banner has drifted — cites SAVE_VER 27; shipped is 28, migrateStoryPreV28 undocumented

---
id: ISSUE-147
severity: P3
category: inconsistency
anchor_symbol: SAVE_VER
current_line_hint: ~41804
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 0aabdb291f2c
confidence: high
status: open
---

**Title**: FLOW's own 2026-06-17 reconciliation banner has drifted — cites SAVE_VER 27; shipped is 28, migrateStoryPreV28 undocumented

**Evidence**:
```text
STORY_MODE_FLOW.md:27-28 "Shipped value is **`SAVE_VER = 27`** (`battle.html:39874`).
  The migration chain runs through `migrateStoryPreV27`."
battle.html:41804  const SAVE_VER = 28;
battle.html:42441  function migrateStoryPreV28() {  // npcStageSeen.dojo back-fill +
                                                    // build.starter flag propagation
```

**Repro**: `grep -n "SAVE_VER = " battle.html` vs STORY_MODE_FLOW.md lines 27–28. The v28 migration (dojo NPC stage back-fill; `slot.build.starter = true` propagation, from the build-gen/early-ceiling branch) appears in no spec doc.

**Blast radius**: Doc-only, but this banner is the block ISSUE-044/129 were resolved INTO — the "code is authoritative, here is the shipped value" paragraph is now itself stale, which erodes trust in the whole reconciliation block. Save-schema documentation (CLAUDE.md sensitive area) lags the shipped chain by one version.

**Fix sketch**: Bump the banner to SAVE_VER 28 and add a one-line §10 note describing what migrateStoryPreV28 back-fills (and what pre-28 saves lack).

**Verification**: Banner value equals `window.__STORY_SAVE_VER`; each `migrateStoryPreV*` in code has a matching doc line.

---

## <a id="ISSUE-148"></a> ISSUE-148: SAVE_VER is 27; STORY_MODE_FLOW pins it at 15/17 across §10/§17

---
id: ISSUE-148
severity: P3
category: inconsistency
anchor_symbol: SAVE_VER
current_line_hint: ~39874
file: battle.html
agents: [story-mode-investigator]
fingerprint: 20d45cb20dfa
confidence: high
status: open
---

**Title**: SAVE_VER is 27; STORY_MODE_FLOW pins it at 15/17 across §10/§17

**Evidence**:
```js
const SAVE_VER = 27;
// FLOW §10: "Bump SAVE_VER from 14 to 15." §17: "SAVE_VER bumped 16 → 17."
```

**Repro**: `grep -n 'const SAVE_VER' battle.html` → 27; FLOW §10/§17 cite 15/17.

**Blast radius**: Doc staleness only (matches ledger ISSUE-040). The migration chain itself is complete and correctly version-gated (`_loadedVer < N`).

**Fix sketch**: Add a "current SAVE_VER = 27" note near §10 and stop re-pinning specific numbers in milestone prose.

**Verification**: Doc references the live constant rather than a frozen value.

---

## <a id="ISSUE-149"></a> ISSUE-149: End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk

---
id: ISSUE-149
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

## <a id="ISSUE-150"></a> ISSUE-150: Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng

---
id: ISSUE-150
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

## <a id="ISSUE-151"></a> ISSUE-151: Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it

---
id: ISSUE-151
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

## <a id="ISSUE-152"></a> ISSUE-152: Magic numbers: uncommented ms delays and thresholds concentrated in overlay/anim timing

---
id: ISSUE-152
severity: P3
category: dx
anchor_symbol: showVictoryOverlay
current_line_hint: ~58277
file: battle.html
agents: [consistency-auditor]
fingerprint: 739dc0f82834
confidence: low
status: open
---

**Title**: Magic numbers: uncommented ms delays and thresholds concentrated in overlay/anim timing

**Evidence**:
```js
75 setTimeout/setInterval sites with hardcoded 3-4 digit ms delays; ~300 uncommented numeric literals >= 1000 outside CSS/colors (sample: 42820 hpM = Math.min(3.00, 1.50 + (round - 1) * 0.075))
```

**Repro**: grep -nE '(setTimeout|setInterval)\\([^,]+,\\s*[0-9]{3,}\\)' battle.html | wc -l → 75. Worst offenders are overlay/animation timing chains (showVictoryOverlay region, type-anim generators 14670-15400, confetti 33260s) where sibling delays must stay in sync but nothing names them.

**Blast radius**: Timing tweaks require hunting paired literals; no functional bug.

**Fix sketch**: Summary finding only (per audit protocol). Introduce named timing consts opportunistically when a region is touched.

**Verification**: n/a — tracking item.

---

## <a id="ISSUE-153"></a> ISSUE-153: Doc battle.html:LINE anchors are stale (23/43 drifted across the spec docs)

---
id: ISSUE-153
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

## <a id="ISSUE-154"></a> ISSUE-154: Doc line anchors stale — 18/50 `battle.html:LINE` refs in design docs no longer resolve (clustered)

---
id: ISSUE-154
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

## <a id="ISSUE-155"></a> ISSUE-155: Doc `battle.html:LINE` anchors stale — 18/50 references drifted (cluster)

---
id: ISSUE-155
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

## <a id="ISSUE-156"></a> ISSUE-156: Doc `battle.html:LINE` anchors stale in surviving specs — 24/44 drifted (post-cleanup cluster; updates ISSUE-330)

---
id: ISSUE-156
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

## <a id="ISSUE-157"></a> ISSUE-157: Doc `battle.html:LINE` anchors still drifting — 21/37 stale in today's sweep (cluster; updates ISSUE-136)

---
id: ISSUE-157
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~34178
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 23c3dc3dfa40
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors still drifting — 21/37 stale in today's sweep (cluster; updates ISSUE-136)

**Evidence**:
```text
2026-07-03 spec-drift.mjs: 21/37 refs drifted. Representative:
  STORY_MODE_FLOW.md:28    migrateStoryPreV27  39874 → 42420
  STORY_MODE_FLOW.md:32    FOE_POWER_CURVE     38265 → 39463
  STORY_MODE_FLOW.md:92    STORY_EVENTS_RAW    21273 → 34178
  STORY_MODE_FLOW.md:38    _SAFARI_GRADE_CURVE_BY_BADGES 56506 → 59304
  docs/EVOLUTION_FLOW_REBUILD.md:184 enterEvolutionLab 42603 → 63514
```

**Repro**: `node scripts/debug/spec-drift.mjs` → tests/reports/spec-drift.md (scanned STORY_MODE_FLOW.md, docs/PROGRESSION_CURVE_MASTER.md, docs/EVOLUTION_FLOW_REBUILD.md).

**Blast radius**: All symbols still resolve (no dead references) — pure line-number rot, drift magnitude now ~2.5–21k lines since the docs were written. Same cluster as ISSUE-133/134/135/136; re-measured because two branches landed since the last count (24/44 → 21/37 after doc cleanup).

**Fix sketch**: Replace raw line numbers in docs with symbol-only references (the find-anchor convention), or regenerate them from agent-state/symbol-index.json in a doc pass.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs (or docs carry no bare line numbers).

---

## <a id="ISSUE-158"></a> ISSUE-158: STORY_MODE_FLOW §4 still specs the flat Safari weights g1:3/g2:22/g3:50/g4:25; live code is a badge curve (_SAFARI_GRADE_CURVE_BY_BADGES)

---
id: ISSUE-158
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

## <a id="ISSUE-159"></a> ISSUE-159: `STORY_IV_TIER_RANGES` is dead — superseded by `STORY_IV_TIER_CENTER`, zero consumers

---
id: ISSUE-159
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

## <a id="ISSUE-160"></a> ISSUE-160: THREE story IV tables coexist — `STORY_IV_TIER_RANGES` is fully dead; `STORY_IV_TIER_CENTER` is Frontier-only; only `STORY_IV_CITY_*` is the live story curve

---
id: ISSUE-160
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

## <a id="ISSUE-161"></a> ISSUE-161: Three live FLOW sections (outside removed §9) still cite the excised "Subject Zero" as shipped behavior

---
id: ISSUE-161
severity: P3
category: inconsistency
anchor_symbol: STORY_MODE_FLOW
current_line_hint: ~213
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 9b3ef90aad20
confidence: high
status: open
---

**Title**: Three live FLOW sections (outside removed §9) still cite the excised "Subject Zero" as shipped behavior

**Evidence**:
```text
STORY_MODE_FLOW.md:213  (§7 Underground, live) "Unsellable: starter, current last
  party mon, the boss-arc capture (\"Subject Zero\")."
STORY_MODE_FLOW.md:646  (§15b enemy IVs, live) "Subject Zero (boss-arc catch) —
  overrides to perfect {31,31,31,31,31,31} before commit"
STORY_MODE_FLOW.md:1321 (Crucible Daycare tone, live) "Subject Zero is doing very
  well, apparently"
```

**Repro**: `grep -n "Subject Zero" STORY_MODE_FLOW.md battle.html` — 0 code hits (the Caged God arc was EXCISED v24; only `sm.bossArc` survives in two migrations). §9 is correctly banner-marked REMOVED, but these three references live in sections describing shipped systems with no removal marker.

**Blast radius**: Doc-only. Distinct from ISSUE-113 (§14d Caged God repurpose) and ISSUE-012 (Underground starter-sellable claim): these are the remaining Subject Zero leftovers in *live* sections, which read as current unsellable/IV/flavor rules that the code cannot exhibit.

**Fix sketch**: Strike or footnote the three references as removed-with-§9 (e.g. "(removed v24 with the boss arc)").

**Verification**: `grep -n "Subject Zero" STORY_MODE_FLOW.md` matches only §9's REMOVED block and explicit historical notes.

---

## <a id="ISSUE-162"></a> ISSUE-162: Doc line anchors stale across 4 specs (still drifting post-v24; cluster)

---
id: ISSUE-162
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

## <a id="ISSUE-163"></a> ISSUE-163: STORY_THEMED_BATTLES is keyed by row-id and resolves correctly only because row-id≈array-index in the 7–58 band (fragile)

---
id: ISSUE-163
severity: P3
category: refactor
anchor_symbol: STORY_THEMED_BATTLES
current_line_hint: ~38319
file: battle.html
agents: [story-mode-investigator]
fingerprint: 15d76d8da1e7
confidence: medium
status: open
---

**Title**: STORY_THEMED_BATTLES is keyed by row-id and resolves correctly only because row-id≈array-index in the 7–58 band (fragile)

**Evidence**:
```js
// assignTrainers Pass 3: const [idx, type, event] = ev;  // idx = ev[0] = ROW ID
// const theme = _resolveThemeForBattleRow(idx);  // STORY_THEMED_BATTLES[idx]
// keys {7,14,20,26,33,34,41,42,48,49,56,58} are ROW IDS; they happen to equal
// array indices in this band, but the timeline diverges at ids 68/12/39/40.
```

**Repro**: Add/move a Rival-style out-of-order row in the 7–58 band; theme lookups silently mis-target.

**Blast radius**: Mid-game themed flavor (cursed/multitype/villain/eldritch). A timeline reorder would misalign themes with no error.

**Fix sketch**: Document the contract explicitly (keys are row-ids) at the table, and add a boot-time assert that every `STORY_THEMED_BATTLES` key matches a Battle row's `row[0]`.

**Verification**: Boot assertion passes; a deliberately-renumbered row trips it.

---

## <a id="ISSUE-164"></a> ISSUE-164: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

---
id: ISSUE-164
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

## <a id="ISSUE-165"></a> ISSUE-165: Catch ball buttons lack accessible name reading the success %; bare-icon img alt empty

---
id: ISSUE-165
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

## <a id="ISSUE-166"></a> ISSUE-166: Dead CSS selector for a #story-pc-tab-journal-btn that has no markup or handler

---
id: ISSUE-166
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

## <a id="ISSUE-167"></a> ISSUE-167: Pokémon Center tab buttons not exposed as a tablist (no role=tab/tabpanel)

---
id: ISSUE-167
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

## <a id="ISSUE-168"></a> ISSUE-168: Dead CSS: ~72 style-block classes with no static or template-built reference

---
id: ISSUE-168
severity: P3
category: refactor
anchor_symbol: story-tutor-move-slot
current_line_hint: ~810
file: battle.html
agents: [consistency-auditor]
fingerprint: 214045f153e7
confidence: medium
status: open
---

**Title**: Dead CSS: ~72 style-block classes with no static or template-built reference

**Evidence**:
```js
Verified-dead CSS classes (defined in <style>, zero references in markup/JS incl. template-built prefixes): title-text menu-gauntlet-row menu-gauntlet-main menu-gauntlet-lb prof-pick-header prof-full-summary-btn prof-summary-icon-btn move-btn-eff-bottom sum-note--info story-tutor-apply-move story-tutor-move-slot story-tutor-move-filter story-tutor-move-picker-footer story-tutor-current-equip story-tutor-afford-warn tx-chip--cat-Physical tx-chip-row--leading tx-slot-row--single tx-slot-label tx-slot-meta tx-slot-empty tx-stat-spe tx-card-price tx-pill--rec tx-pill--nature-up tx-icon-img tx-chips-row tx-chip-strip-end tx-stat-fill--down story-hof-plaque story-hof-team-slot story-link-mon-header badge-icon gimmick-mega move-tile-eff anim-attack anim-attack-foe anim-damage anim-shake anim-faint anim-switch-in anim-switch-out storyfx-stage-banner anim-lunge-player anim-lunge-foe anim-hit-overlay stat-arrow story-facility-grid--phone-1col move-btn menu-title menu-sub menu-pool-line menu-story-row menu-story-btn menu-collection-row menu-collection-btn menu-collection-icon menu-collection-text menu-collection-sub story-master-ball-glow story-master-ball-pulse badge-pulse story-tutorial-enter-1..4 story-settings-panel story-settings-heading story-settings-gen-row story-settings-gen-label story-settings-gen-btn gauntlet-score-display story-create-portrait-name
```

**Repro**: Scripted scan: extract .class selectors from <style> blocks, search remaining battle.html + online-pvp.js + move-*-map.js for delimited usage, then re-check every dash-prefix against template construction (e.g. battle-tint-${type}, ach-row--rank + rank, pdex-gen-tab${...} were correctly excluded as live).

**Blast radius**: None at runtime — CSS weight and reader confusion only. The anim-* block (5068-5074, 7053-7057) and menu-* / story-tutor-* / tx-* clusters mirror the dead JS helpers from the same removed redesigns.

**Fix sketch**: Delete selectors in cluster-sized sweeps after direction approval; keep the scan script as a guard.

**Verification**: Re-run the scan → 0; visual smoke of menu, battle, tutor, PC, settings screens.

---

## <a id="ISSUE-169"></a> ISSUE-169: Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope

---
id: ISSUE-169
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

## <a id="ISSUE-170"></a> ISSUE-170: `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites

---
id: ISSUE-170
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

## <a id="ISSUE-171"></a> ISSUE-171: FLOW §8 post-retune residue — Challenge coin mult 1.10 vs shipped 0.90; Champion-on-Hard example uses 1.30 vs shipped 1.23

---
id: ISSUE-171
severity: P3
category: inconsistency
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~38697
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 89c9bc7ef111
confidence: high
status: open
---

**Title**: FLOW §8 post-retune residue — Challenge coin mult 1.10 vs shipped 0.90; Champion-on-Hard example uses 1.30 vs shipped 1.23

**Evidence**:
```js
// STORY_MODE_FLOW.md:231 → "| Challenge (Very Hard) | 1.30 | 1.10 |"
// STORY_MODE_FLOW.md:233 → "Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495"
// battle.html ~38706 (shipped):
if (diff === 'challenge') return 0.90;   // coin mult — kaizo taxed BELOW Hard
// battle.html ~39477: if (e === 'Champion') return 1.23;  // not 1.30 (1.30 is MF)
```

**Repro**: Compare STORY_MODE_FLOW.md §8 table (lines 226–233) with `storyDifficultyCoinMult` (battle.html:38697) and `_storyEnemyStatMult` (battle.html:39464).

**Blast radius**: Doc-only, but §8 is the difficulty-mode reference. The 2026-06 coin retune (C 1.10→0.90, per PROGRESSION_CURVE_MASTER line 256) never reached FLOW; the worked Hard-Champion example borrows the Mystery Figure's 1.30. ISSUE-009 covers only the 1.30→1.40 stat-mult cell in the same table — these two cells are additional drift.

**Fix sketch**: Update the §8 coin-mult column (Challenge → 0.90) and recompute the worked example with Champion's shipped 1.23 (≈×1.41 on Hard).

**Verification**: FLOW §8 numbers match `storyDifficultyCoinMult` / `_foeDifficultyMult` / `_storyEnemyStatMult` returns.

---

## <a id="ISSUE-172"></a> ISSUE-172: FLOW contradicts itself on the tone layer — header says "kept dormant in code, reversible"; §16 says removed; §17 still teaches multi-variant workflow

---
id: ISSUE-172
severity: P3
category: inconsistency
anchor_symbol: STORYLINE_VARIANTS
current_line_hint: ~48142
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 220fc44e75a8
confidence: high
status: open
---

**Title**: FLOW contradicts itself on the tone layer — header says "kept dormant in code, reversible"; §16 says removed; §17 still teaches multi-variant workflow

**Evidence**:
```text
STORY_MODE_FLOW.md:15  "> - The 8-tone storyline layer was RETIRED to `classic`
                        (kept dormant in code, reversible)."
STORY_MODE_FLOW.md:1142 "was CUT (2026-06) — removed from code + docs; see git history"
STORY_MODE_FLOW.md:1209 "Add a storyline variant | Add an entry to STORYLINE_VARIANTS …
                        (the registry already supports it)"
STORY_MODE_FLOW.md:1224 "### Storyline variants — Pokémon adapt to the ruleset" (full section)
```

**Repro**: `grep -n "kept dormant in code" STORY_MODE_FLOW.md` vs `grep -n "removed from code" STORY_MODE_FLOW.md`. Code truth: `STORYLINE_VARIANTS` (battle.html:48142) is a single-`classic`-entry table; the 7 tone variants, `surprise_me` entry, and `_pickRandomStorylineVariant()` were deleted (Stage A/B, CLAUDE.md "Excised vs retired").

**Blast radius**: Doc-only, but the header banner is the doc's authoritative status block — "kept dormant in code, reversible" tells a future session a one-line restore is possible when revival now requires git archaeology. §17's "Add a storyline variant" recipe and the "adapt-to-ruleset" section (lines 1200–1266) describe an extension workflow for a registry that intentionally no longer carries variants. Related to ISSUE-053 (dangling doc refs) but this is the internal status contradiction, new since the 2026-06 cut.

**Fix sketch**: Align line 15 with §16's CUT wording; collapse §17's variant-authoring guidance to a "single classic entry; revive via git history" note.

**Verification**: FLOW contains one consistent status ("CUT, revive via git history") and no live-tense multi-variant authoring instructions.

---

## <a id="ISSUE-173"></a> ISSUE-173: `storyRngNext` / per-engine-entry `rng` ternary accessor is **0.0003 ms (300 ns) per call** — no closure allocation penalty, accessor pattern is clean

---
id: ISSUE-173
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

## <a id="ISSUE-174"></a> ISSUE-174: Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time

---
id: ISSUE-174
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

## <a id="ISSUE-175"></a> ISSUE-175: `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block

---
id: ISSUE-175
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

## <a id="ISSUE-176"></a> ISSUE-176: VERIFIED OK — boss/raid reward double-grant across the two call sites is structurally prevented

---
id: ISSUE-176
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

## <a id="ISSUE-177"></a> ISSUE-177: `_bossWeatherLocked` / `_bossTerrainLocked` flags are set but never read — field "lock" is opening-state only

---
id: ISSUE-177
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

## <a id="ISSUE-178"></a> ISSUE-178: VERIFIED OK — extra-arc raid "laid to rest, no catch" lock is enforced structurally

---
id: ISSUE-178
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

## <a id="ISSUE-179"></a> ISSUE-179: Three redundant RNG-routing mechanisms; confusion self-hit relies solely on the global Math.random patch while siblings use storyAwareRng()

---
id: ISSUE-179
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

## Retired / Resolved

_311 finding(s) marked fixed / wontfix / duplicate / obsolete — excluded from the active counts above._

- [fixed-claude/relaxed-bell-2X3Ys] Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog — `__pbsGlobalEscBound` (P3/a11y)
- [fixed-claude/gifted-fermat-yfnqq5] Turn-resolution catch masks any in-loop throw as "[Error: …. Turn skipped.]" — both moves abandoned, real bugs hidden (PT-001) — `__runLockedPvPTurnResolution` (P2/bug)
- [wontfix-descoped] Lead→city mapping duplicated (`_BOSS_LEAD_CITIES` const vs inline `_leadCity` literal) — `_BOSS_LEAD_CITIES` (P3/inconsistency)
- [fixed-claude/cagedgod-excision] Caged God uses three names for one entity (Specimen 0001 / Subject Zero / Subject 0001) without a stated rule — `_bossArcCheckCageUnlock` (P3/inconsistency)
- [fixed-claude/cagedgod-excision] Boss arc soft-locks if enabled gens contain no legendary — cage unlocks but can never be entered — `_bossArcCheckCageUnlock` (P1/bug)
- [fixed-claude/cagedgod-excision] ~250-line Caged God boss arc is dead code (unreachable) but still fully shipped — `_bossArcRenderSection` (P2/refactor)
- [fixed-claude/cagedgod-excision] _bossArcRenderSection rebuilt in full inside every _renderCrucible re-render (adds ~6ms of the 30ms) — `_bossArcRenderSection` (P3/perf)
- [fixed-claude/cagedgod-excision] Caged God lead spec (§9 "visit Cities 2/5/8") contradicts shipped Crucible-hub collection; §14b omits the arc — `_bossArcRenderSection` (P2/inconsistency)
- [fixed-claude/cagedgod-excision] Post-game lead "hunt" collapses to 3 buttons on one Crucible screen — no travel, no gating — `_bossArcRenderSection` (P2/design)
- [fixed-claude/cagedgod-excision] Non-hub Caged God render path is effectively dead post-HoF (player can never be at City 2/5/8) — `_bossArcRenderSection` (P3/design)
- [fixed-main] Entire Caged God boss-arc subsystem is dead code after v24 removal — `_bossArcRenderSection` (P3/refactor)
- [fixed-main] Two parallel story-flow engines coexist — new "unified" engine built but never wired (P2/P3 never done) — `_buildUnifiedStoryEvents` (P2/refactor)
- [fixed-main] Dormant "unified flow engine" is now triple-orphaned — live dispatch is a 3rd design that leapfrogged it — `_buildUnifiedStoryEvents` (P2/refactor)
- [fixed-claude/full-debug-inconsistency-fclrlu] Casino prize roller (_casinoRollPrize / _randPick) uses Math.random for vitamin/voucher drops — `_casinoRollPrize` (P1/bug)
- [fixed-main] CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists — `_catchHandleSuccess` (P3/bug)
- [fixed-claude/gifted-fermat-yfnqq5] Regular wild encounter with zero balls shows greyed buttons but no "out of balls" message — `_catchRender` (P3/dx)
- [fixed-main] Variant Champion / rival dialogue narratively routes player to the dead broker + cage — `_CHAMPION_DIALOGUE_BY_VARIANT` (P3/inconsistency)
- [fixed-main] Variants are rolled every run (not forced classic) — so variant Champion/post-HoF lines pointing at the dead broker/cage DO fire — `_CHAMPION_DIALOGUE_BY_VARIANT` (P2/inconsistency)
- [fixed-claude/gifted-fermat-yfnqq5] Colress Signature-Z silently overwrites the last move; confirm warns only about item/gimmick — `_colressConfirm` (P2/inconsistency)
- [fixed-main] Nature Rater cost badge shows "2000+" but TUTOR_COST_NATURE is a flat 2000 — `_costBadge` (P2/inconsistency)
- [wontfix-out-of-scope-crucible] Crucible League Run + Random Gym Rematch use row ids as array indices — wrong opponents (skips E1, runs into Rival; can launch City3) — `_CRUCIBLE_LEAGUE_ROWS` (P0/bug)
- [wontfix-out-of-scope-crucible] Crucible row constants are STORY_EVENTS_RAW *row-ids*, not array indices — `_crucibleBattleSetup` assigns them straight to `sm.eventIndex` — `_crucibleBattleSetup` (P1/bug)
- [fixed-main] Two early-game foe-softening systems STACK multiplicatively — C0 foe is 64% of base, not the documented ~80% — `_earlyGameFoeStatMult` (P1/inconsistency)
- [wontfix-out-of-scope-pvp] 7 duplicated `select('data').eq('id', roomId).single()` fetch+error blocks in online-pvp.js — `_hostRunResolution` (P2/refactor)
- [fixed-main] species.json Hisui formes are stale (gen8 snapshot) — Samurott-Hisui/Kleavor lack gen9 Sharpness, so every legal-tier build is dropped — `_isBuildAbilityIllegal` (P2/data)
- [fixed-claude/sharp-keller-eZEDN] Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics — `_makePlayerLinkBuild` (P2/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it — `_maybeShowSaveToast` (P2/a11y)
- [wontfix-gen2-berries-not-loaded-by-gen9-engine-by-design] 9 Gen-2-legacy "isBerry" items are dead data — no engine handler and never referenced by any build — `_onBerryEaten` (P3/data)
- [fixed-claude/sharp-keller-eZEDN] "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10) — `_pcRefresh` (P2/inconsistency)
- [fixed-main] Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface — `_pcRenderRivalJournalTab` (P2/refactor)
- [fixed-main] `_pendingProfRoll` (singular) only ever assigned null — dead variable shadowing live `_pendingProfRolls` — `_pendingProfRoll` (P3/refactor)
- [fixed-main] Inert `_permBoostsRead`/`_permBoostTotal` stubs (+ window export) have zero callers — fully dead — `_permBoostsRead` (P3/refactor)
- [fixed-claude/sharp-keller-eZEDN] `_pickCityQuoteLine` deliberately uses bare `Math.random` — drift across save reloads — `_pickCityQuoteLine` (P3/inconsistency)
- [fixed-claude/cagedgod-excision] League-road narrative "clumping" — 6 story beats fire back-to-back before the Champion (the audit §4 flow bug, still unfixed in the live path) — `_playStoryBeatQueue` (P3/inconsistency)
- [fixed-main] Sprite preloading is unbounded — each `getSprite()` call adds a `new Image()` to a global cache with no eviction; a long story run can preload 1000+ images — `_preloadedImages` (P3/perf)
- [wontfix-out-of-scope-crucible] _renderCrucible rebuilds a 17.7KB / 109-node innerHTML on every open + lead-collect + hard-mode toggle — `_renderCrucible` (P2/perf)
- [fixed-claude/cagedgod-excision] Crucible "Pokémon Center" facility re-renders the Caged God section a second time (below the Underground sell list) — `_renderCrucible` (P3/design)
- [wontfix-out-of-scope-crucible] Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies — `_renderFrontierHub` (P2/inconsistency)
- [fixed-main] Grade badge prefix differs between prof pick cards (G#) and swap slots (T#) — `_renderProfChoices` (P3/inconsistency)
- [fixed-claude/cagedgod-excision] Entire MAIN finale (twist + ending) spoils before E1 — 6 league event-beats drain at once — `_resolveActiveRoadBeats` (P1/bug)
- [fixed-main] Villain-track "ending" event fires before the villain boss fight (road7 event-kind drains first) — `_resolveActiveRoadBeats` (P1/bug)
- [fixed-main] Road beat clumping: 2 beats/road (villain road7 = 3, league = 7) play back-to-back, breaking pacing — `_resolveActiveRoadBeats` (P2/balance)
- [fixed-claude/gifted-fermat-yfnqq5] Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve — `_SAFARI_GRADE_CURVE_BY_BADGES` (P3/inconsistency)
- [fixed-main] CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock — `_shouldFireCatchTutorialBeforeBattle` (P3/bug)
- [fixed-main] Catch-tutorial gate comment claims "starting kit gives 5 balls" — fresh-run kit is actually 0 — `_shouldFireCatchTutorialBeforeBattle` (P2/dx)
- [fixed-claude/sharp-keller-eZEDN] Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC — `_showStoryTutorialScene` (P2/a11y)
- [fixed-claude/full-debug-inconsistency-fclrlu] Casino Slots reel symbols rolled with Math.random(), breaking seeded determinism — `_slotsPickSymbol` (P1/bug)
- [fixed-main] Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3) — `_stageGatedFoeStatMult` (P2/inconsistency)
- [fixed-main] CORRECTION to prior audit: storyline variant is rolled randomly every run, NOT forced to 'classic' — `_storyActiveVariant` (P3/dx)
- [fixed-main] Boss immunity-round off-by-one: activation sets _bossImmuneTurns then decrements it in the SAME tick, so turns:1 grants 0 immune turns — `_storyBossMechanicsTurnTick` (P1/bug)
- [fixed-main] Boss HP-threshold "surge" (_bossSurgeTurns, +25% damage) has zero damage-path consumers — phase is banner-only — `_storyBossMechanicsTurnTick` (P1/bug)
- [fixed-main] Boss surge/immunity timers live on the active foe mon — lost on switch, stale on bench — `_storyBossMechanicsTurnTick` (P2/bug)
- [fixed-main] Single `_bossPendingTelegraph` slot drops a phase when two mechanics telegraph on the same turn (mfBattle) — `_storyBossMechanicsTurnTick` (P2/bug)
- [fixed-main] faintPhase counts the active foe as "fainted" mid-tick if it is at 0 HP before the swap — `_storyBossMechanicsTurnTick` (P3/bug)
- [fixed-main] Shipped BOSS_CONFIGS uses surge/immunity/heal phases, not the EXPANSION_PLAN "multi-form transformation" — `_storyBossMechanicsTurnTick` (P2/inconsistency)
- [fixed-claude/gifted-fermat-yfnqq5] Redundant tier branches in `_storyBuildTierForEvent` (dead duplicate conditions) — `_storyBuildTierForEvent` (P3/refactor)
- [fixed-claude/gifted-fermat-yfnqq5] Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment — `_storyBuildTierForEvent` (P3/balance)
- [fixed-claude/sharp-keller-eZEDN] `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save — `_storyEnemyMechKeys` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve — `_storyEnemyPartySize` (P2/balance)
- [fixed-main] Foe stats pass through FOUR stacking multipliers on the live path (band × early × stage-gated × diff+league); band & stage-gated & league each triple-special-case Champion/Mystery — `_storyEnemyStatMult` (P1/inconsistency)
- [fixed-claude/cagedgod-excision] Caged God removal (v24) is incomplete — residual content/help-text/achievements still reference the cut arc — `_storyEnsureMysteryIdentity` (P2/inconsistency)
- [fixed-main] Mystery Figure sprite is now `Red` (the_first); the `'Cyrus'` fallback at enterBattleEvent is dead — `_storyEnsureMysteryIdentity` (P3/inconsistency)
- [fixed-main] "Up next" trainer name is the pre-override name — boss beats relabel the trainer after the preview — `_storyEventRowToUpNext` (P1/inconsistency)
- [fixed-main] rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only) — `_storyEvoStageCapForRow` (P2/bug)
- [fixed] Late-game enemy weak-mon floor + endgame gold over-accumulation (2026-06 balance pass) — IMPLEMENTED — `_storyFillerGradeFloorForRow` (P1/balance)
- [fixed-claude/cagedgod-excision] Master Ball granted by BOTH villain-boss victory and post-HoF Caged God, vs spec "1 per run" — `_storyGrantTrackEndReward` (P2/inconsistency)
- [fixed-main] Villain-boss Master Ball grant has no fire-once guard; unique-ball guarantee can break — `_storyGrantTrackEndReward` (P1/bug)
- [fixed-claude/relaxed-bell-2X3Ys] `_storyGrantTrackEndReward` has no internal idempotency guard — re-call double-grants Master Ball — `_storyGrantTrackEndReward` (P2/bug)
- [fixed-main] Stale comment on `_storyGrantTrackEndReward` — claims scene-queue piggy-back that is structurally impossible — `_storyGrantTrackEndReward` (P3/dx)
- [fixed-main] Two Master Ball sources collide — villain-track boss (Road 7, pre-HoF) + post-HoF broker = 2 per run — `_storyGrantTrackEndReward` (P1/balance)
- [fixed-main] Extra-track raid EXP-Share reward + boss BOSS_MECHANICS are partly data-only — engine wiring deferred (mechanics are no-ops that only record) — `_storyGrantTrackEndReward` (P3/dx)
- [fixed-main] Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front — `_storyHatchRevealScene` (P2/a11y)
- [fixed-main] CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches — `_storyMaxPartySize` (P3/bug)
- [fixed-claude/sharp-keller-eZEDN] `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays — `_storyPickMysteryIdentity` (P2/bug)
- [fixed-main] Legacy storyline picker is dead UI — hidden DOM + uncalled renderer + unreachable card handlers, superseded by sm.tracks — `_tcRenderStorylineGrid` (P3/refactor)
- [fixed-main] Road event-beats fire before in-city Gym Trainer / Gym Leader fights, not only on the route — `_tryFireRoadStoryBeats` (P1/bug)
- [fixed-main] CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead — `_txMetaCache` (P2/inconsistency)
- [wontfix-descoped] Variant rival quote pools are uneven — several phases have a single line; many phases absent — `_VARIANT_RIVAL_QUOTES` (P3/refactor)
- [fixed-main] `_variantMysteryOutro` is dead — `_MYSTERY_OUTRO_BY_VARIANT` keyed only by retired identities, never matches `the_first` — `_variantMysteryOutro` (P2/bug)
- [fixed-main] All ~30 per-variant Mystery-Figure outros are dead — keyed by retired identities, never match `the_first` — `_variantMysteryOutro` (P2/inconsistency)
- [fixed-main] Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks — `_withStoryPlayerGimmickGate` (P1/inconsistency)
- [fixed-main] CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path — `_withStoryPlayerGimmickGate` (P3/bug)
- [fixed-claude/ecstatic-gauss-RY5hA] aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock — `aiDecision` (P1/bug)
- [fixed-claude/gifted-fermat-yfnqq5] Anomaly seeds are keyed by row ID but several land on mismatched event types vs their prose — `ANOMALY_SEEDS` (P3/data)
- [fixed-main] Latent state-bleed: artifact battle-flags reset is behind an empty-artifacts early-return (same init-inside-guard shape as the fixed boss-bleed) — `applyArtifactBattleEffects` (P3/bug)
- [fixed-claude/sharp-keller-eZEDN] `applyBattleLogHtml` injects raw `battle_log_html` from the room row into the DOM — XSS sink fed by world-writable Supabase row — `applyBattleLogHtml` (P0/security)
- [wontfix-ratified-memo9-difficulty-blind-ai-is-the-product] Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall — `applyFoeDifficultyScaling` (P1/balance)
- [fixed-claude/sharp-keller-eZEDN] `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented — `applyFoeDifficultyScaling` (P3/dx)
- [fixed-main] Spec §8 says league boost stacks multiplicatively with difficulty; code now stacks additively (the cliff was fixed) — `applyFoeDifficultyScaling` (P3/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc) — `applyStatus` (P1/bug)
- [fixed-main] applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null — `applyStatus` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] League foe stat boost stacks multiplicatively despite comment claiming additive merge — `applyStoryLeagueFoeStatBoost` (P1/bug)
- [fixed-main] Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY — `applyStoryLeagueFoeStatBoost` (P3/inconsistency)
- [fixed-claude/gracious-goodall-QFuQF] Dual-mega stone (Charizard/Mewtwo X vs Y) picked with bare Math.random — breaks seeded replay — `assignGimmickToBuild` (P2/bug)
- [wontfix-not-a-bug-noise-dominated-growth-as-flagged-by-agent] Memory growth is benign (linear, ~25 KB/turn, R² = 0.712 — noise-dominated) and **does not indicate a leak**; the mandate's "60 turn / quadratic = P1" threshold is not hit — `benchMemoryGrowth` (P2/perf)
- [fixed-claude/sharp-keller-eZEDN] `perf-bench.mjs` calls `parseMoveEffects(move)` with the wrong arg-count; the reported 1.4 ms "median" is the cost of a thrown `TypeError`, not real per-move parsing — `benchParseMove` (P2/perf)
- [fixed-claude/sharp-keller-eZEDN] Turn-loop max latency is **78–84 ms** with IQR 12 ms — within the harness target (50 ms median is OK) but max is 5× the median, indicating a per-turn outlier path — `benchTurn` (P2/perf)
- [wontfix-DE-SCOPED-permanent] Black Market shop from STORY_FEATURES_INTEGRATION.md §3 is still entirely unimplemented — `BLACK_MARKET_ITEMS` (P1/inconsistency)
- [fixed-main] Three conflicting "canon" docs for the boss/endgame arc; code matches none cleanly — `BOSS_CONFIGS` (P1/inconsistency)
- [fixed-claude/cagedgod-excision] Caged God "Key" lead has zero cost — spec says it should demand strongest mon or steep gold — `bossCollectLead` (P2/design)
- [fixed-main] Dead `build.tired` fatigue field still written/backfilled at 5 sites, read in zero gameplay paths — `build.tired` (P3/refactor)
- [fixed-claude/gifted-fermat-yfnqq5] Extra-raid stat scaling compounds `_storyStatMult` × `_bossStatMult` × `_bossHpScale`; the doc comment omits `_storyStatMult` — `buildPokemon` (P3/inconsistency)
- [fixed-claude/gracious-goodall-QFuQF] Achievements caged_god / r_caged_god are permanently unobtainable — `caged_god` (P3/data)
- [fixed-claude/sharp-keller-eZEDN] `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays) — `canMove` (P1/bug)
- [fixed-main] Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn) — `canMove` (P1/bug)
- [fixed-main] Sleep off-by-one: sleepDuration=1 wakes and attacks on its first turn (0 turns lost); effective sleep is 0-2 turns not 1-3 — `canMove` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] `canMove` paralysis fizzle uses bare `Math.random()` while sibling freeze thaw uses `storyRngNext` — `canMove` (P1/bug)
- [fixed-claude/full-debug-inconsistency-fclrlu] Casino Coin Flip outcome uses Math.random(), not seeded storyRngNext() — `casinoFlipSpin` (P1/bug)
- [fixed-claude/full-debug-inconsistency-fclrlu] Casino Roulette winning cell chosen with Math.random(), not seeded RNG — `casinoRoulSpin` (P1/bug)
- [fixed-main] Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code — `catchMode` (P1/inconsistency)
- [fixed-claude/cagedgod-excision] The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it) — `catchThrow` (P1/bug)
- [fixed-claude/cagedgod-excision] Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge — `catchThrow` (P1/bug)
- [fixed-claude/cagedgod-excision] Unique Master Ball is spendable on any regular wild → Caged God capture becomes a 1%-per-throw grind — `catchThrow` (P2/bug)
- [fixed-main] `sm.catchUnlocked` is written 3× but never read; spec §10 says it gates wild-route prompts — `catchUnlocked` (P2/inconsistency)
- [fixed-main] `sm.settings.catchMode` toggle never implemented; catch shipped as always-on, 3 specs still gate on it — `catchUnlocked` (P2/inconsistency)
- [wontfix-sm.catchUnlocked-reserved-for-future-toggle-feature] `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere — `catchUnlocked` (P3/dx)
- [fixed-main] sm.catchUnlocked written by defaults + v15 migration + newStoryRun but read nowhere (live gate is sm.catchTutorialDone) — `catchUnlocked` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it — `CHANGELOG` (P3/inconsistency)
- [fixed-claude/funny-clarke-EnGMv] Toxic (badly-poison) counter `statusTurns` is not reset on switch-out — `clearVolatileOnSwitch` (P1/bug)
- [fixed-claude/inspiring-shannon-MP5aq] Comeuppance reflects 0 damage in all cases (twin Metal Burst works) — `Comeuppance` (P2/bug)
- [fixed-claude/cagedgod-excision] Single Master Ball is a free consumable — spending it pre-cage leaves boss arc as a 1%-per-throw grind — `continuePostGame` (P2/design)
- [fixed-claude/cagedgod-excision] Pre-boss-arc post-HoF saves may never receive the Master Ball / boss arc if parked at a city row on load — `continuePostGame` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] `createRoom` hardcodes Postgres SQLSTATE `23505` for unique-violation detection — defensive `.includes('duplicate')` fallback exists but the magic number is undocumented — `createRoom_23505` (P3/refactor)
- [wontfix-out-of-scope-crucible] Crucible rematch pickers use bare Math.random — breaks the seeded-replay contract for post-game — `crucibleGymPick` (P3/design)
- [wontfix-out-of-scope-crucible] Crucible League Run skips E1 and ends on the Rival — `_CRUCIBLE_LEAGUE_ROWS` are off-by-one row-ids — `crucibleLeagueRun` (P1/bug)
- [wontfix-out-of-scope-crucible] Crucible "Mystery Figure" rematch uses out-of-bounds index 67 (array length is 67, max idx 66) — `crucibleMysteryFight` (P2/bug)
- [wontfix-out-of-scope-crucible] Crucible "Mystery Figure" button is dead — STORY_POST_HOF_MYSTERY_ROW (67) is out of bounds as an array index — `crucibleMysteryFight` (P0/bug)
- [wontfix-out-of-scope-crucible] Crucible "Rival Rematch" targets the Hall of Fame row (array idx 65), not the league rival — `crucibleRivalFight` (P2/bug)
- [wontfix-out-of-scope-crucible] Crucible "Rival Rematch" targets the Hall of Fame row — STORY_LEAGUE_RIVAL_ROW (65) is a row id, not the array index (64) — `crucibleRivalFight` (P0/bug)
- [fixed-claude/inspiring-shannon-MP5aq] Crush Grip doesn't scale with target HP (constant ~2 dmg); siblings do — `Crush Grip` (P2/bug)
- [wontfix-out-of-scope-pvp] `deepClone` falls back to `JSON.parse(JSON.stringify(...))` — silently drops Set/Map/Date/undefined/circular refs across the entire snapshot pipeline — `deepClone` (P2/refactor)
- [fixed-main] Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines — `DESIGN_CONSISTENCY_CHECKLIST.md` (P2/dx)
- [fixed-claude/sharp-keller-eZEDN] Malva (Kalos E1) has a victory line but no intro pool in `TRAINER_QUOTES_BY_NAME` — `ELITE_VICTORY_LINES` (P2/inconsistency)
- [fixed-claude/funny-clarke-EnGMv] Leech Seed end-of-turn drain ignores Magic Guard (holder loses HP, seeder heals) — `endOfTurnEffects` (P2/bug)
- [fixed-claude/funny-clarke-EnGMv] Partial-trap (Bind / Fire Spin / Whirlpool / Sand Tomb) end-of-turn damage ignores Magic Guard — `endOfTurnEffects` (P2/bug)
- [fixed-main] proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state) — `enterBattleEvent` (P1/bug)
- [fixed-claude/cagedgod-excision] Post-HoF Crucible hub button gated on dead `bossArc.available` — never renders — `enterCity` (P1/bug)
- [fixed-main] City0 welcome tip says the Underground "buys … never your starter" but starters are sellable — `enterCity` (P3/inconsistency)
- [wontfix-out-of-scope-crucible] Crucible sub-sections improve wayfinding but the orientation tip + "Mystery vs Caged God" disambiguation still lean on long alert text — `enterCrucible` (P3/design)
- [fixed-main] PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6 — `enterDaycare` (P2/refactor)
- [fixed-main] Poké Center never clears Fatigue, yet the in-game bulletin tells players a Center stay clears it — `enterPokemonCenter` (P2/bug)
- [fixed-main] Poké Center chip sits in "Heal & Team" section with a "Free" badge but performs no heal interaction — `enterPokemonCenter` (P3/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate` — `enterProfessor` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool — `enterProfessor` (P3/bug)
- [fixed-claude/gifted-fermat-yfnqq5] Empty-choices Professor path shows status but renders no body buttons — `enterProfessor` (P3/bug)
- [fixed-claude/sharp-keller-eZEDN] Validator reports 6925 "CSV alternative" occurrences but every build file uses arrays — false positive — `expandCommaAlternatives` (P2/dx)
- [fixed-main] Exp Share Voucher item (3TRACK_IMPL_PLAN PR-5) never shipped; `sm.inventory.expShareVoucher` is dead init — `expShareVoucher` (P3/inconsistency)
- [fixed-main] `expShareVoucher:0` inventory field is dead — no reader, no writer; extra-raid reward grants vitamins instead — `expShareVoucher` (P3/data)
- [fixed-main] Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map — `FACILITY_DEBUT_CITY` (P3/data)
- [wontfix-out-of-scope-crucible] Crucible-reachable Frontier surrender uses raw window.confirm — drops fullscreen, breaks modal convention — `frontierSurrender` (P3/dx)
- [wontfix-out-of-scope-crucible] Gauntlet score readout is a plain div with no live region — score changes are silent to SR — `gauntlet-score` (P3/a11y)
- [wontfix-ratified-memo9-sleep-mechanics-showdown-faithful] No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk) — `getBestMove` (P2/balance)
- [fixed-claude/ecstatic-gauss-RY5hA] Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever — `getBestMove` (P1/bug)
- [fixed-claude/ecstatic-gauss-RY5hA] AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores — `getBestMove` (P1/bug)
- [fixed-claude/gifted-fermat-yfnqq5] When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status — `getBestMove` (P2/inconsistency)
- [fixed-main] Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior — `getDownStatusLabel` (P3/inconsistency)
- [fixed-claude/funny-clarke-EnGMv] Salac Berry grants a phantom 1.5x Speed while merely held at <=25% HP (not consumed) — `getEffectiveSpeed` (P2/bug)
- [fixed-main] Sprite preload cache `_preloadedImages` is still an unbounded Object with no eviction — every distinct (name, shiny, back) pins an Image() for the session — `getSprite` (P3/perf)
- [fixed-main] City-3 HUD/route name falls back to "City 3" — GYM_CITY_LEADER_EVENT array-index keys trainerAssignments (row-id keyed) — `getStoryDisplayTownNameForCityRow` (P2/bug)
- [fixed-claude/gifted-fermat-yfnqq5] Featured Mega/Ultra stones (bought one-per-city at 5x/3x) are sellable from the bag at half list price — `getStoryFeaturedItems` (P3/dx)
- [wontfix-out-of-scope-pvp] 36 references to 18 distinct `global.__*` variables across `online-pvp.js` — the PvP module mutates host-side state through ad-hoc globals instead of a single observable — `global_state_coupling` (P2/refactor)
- [fixed-claude/inspiring-shannon-MP5aq] Grass Whistle never puts the target to sleep — `Grass Whistle` (P3/bug)
- [fixed-main] CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3) — `GYM_CITY_LEADER_EVENT` (P3/bug)
- [fixed-main] City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID — `GYM_CITY_LEADER_EVENT` (P2/bug)
- [fixed-claude/gracious-goodall-QFuQF] In-game Help "Catching" section still points players to the cut Caged God arc — `helpText` (P2/inconsistency)
- [wontfix-DE-SCOPED-permanent] Illegal Dealer NPC encounter (STORY_FEATURES_INTEGRATION.md §3.5) still missing — `illegalDealer` (P1/inconsistency)
- [wontfix-isPokeball-flag-future-use-forward-compat] `isPokeball` flag set on 28 items but never read by the engine — dead metadata — `isPokeball` (P3/data)
- [fixed-main] City-8 legendary Mystery gate is bypassed if party has < 6 members — `isPreLeagueLegendaryMysteryGate` (P1/bug)
- [fixed-claude/relaxed-bell-2X3Ys] City-8 "Required" legendary handoff silently downgrades to a normal Professor gift when the party is below cap — `isPreLeagueLegendaryMysteryGate` (P2/inconsistency)
- [wontfix-gen2-berries-not-loaded-by-gen9-engine-by-design] 9 legacy gen2 berries (Bitter, Burnt, Gold, Ice, Mint, Miracle, Mystery, PRZ Cure, PSN Cure) have no engine handler — `items.json` (P3/data)
- [wontfix-DE-SCOPED-permanent] Full Itinerary scaffolding (STORY_FEATURES_INTEGRATION.md §10) still entirely unimplemented — `itineraryProgress` (P1/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] `lastRemoteSeq` is updated *before* the remote handler runs — a thrown handler still bumps the watermark, so the failed update is permanently skipped — `lastRemoteSeq` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13 — `load` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer` — `load` (P3/bug)
- [fixed-main] CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss — `load` (P3/bug)
- [fixed-main] Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win — `load` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] Engine cold-boot is 2.88 s in jsdom — within the harness target (5 s) but **14× the mandate's 200 ms target** — `loadEngine` (P3/perf)
- [fixed-main] Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed — `loadEngine` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] `console.log` cluster in battle.html — debug noise in shipped code — `loadGameData` (P3/dx)
- [fixed-main] Grade badge prefix differs — `G{tier}` on draft cards vs `T{grade}` on swap/daycare slots — `makeActionBtn` (P3/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17) — `migrateStoryPreV15` (P3/dx)
- [fixed-main] Save-migration integration test never exercises the migrate chain (vacuous pass) — `migrateStoryPreV15` (P1/dx)
- [fixed-main] Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object — `migrateStoryPreV15` (P3/bug)
- [fixed-main] Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean — `migrateStoryPreV15` (P2/bug)
- [fixed-main] v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it — `migrateStoryTrainerAssignmentsPreV14` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby — `modal-dialog-roles` (P2/a11y)
- [fixed-claude/sharp-keller-eZEDN] Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users — `modal-escape-key` (P2/a11y)
- [fixed-claude/sharp-keller-eZEDN] Online Host/Join form labels are not programmatically associated with their inputs — `modal-online-host` (P3/a11y)
- [wontfix-descoped] CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus) — `MYSTERY_FIGURE_IDENTITIES` (P3/inconsistency)
- [fixed-main] `mysteryBias` per-variant config is orphaned — seeds weights for retired MF identities, never read — `MYSTERY_FIGURE_IDENTITIES` (P3/data)
- [fixed-main] A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in) — `online-host-format` (P3/a11y)
- [fixed-claude/relaxed-bell-2X3Ys] Modals restore focus on close but never move focus INTO the dialog on open — `openModal` (P2/a11y)
- [fixed-main] Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it) — `parseMoveEffects` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] Many `parseMoveEffects` branches still use bare `Math.random()` — seeded story replays drift — `parseMoveEffects` (P1/bug)
- [fixed-claude/intelligent-einstein-8ji8nj] Data-driven boost block returns early, bypassing named-branch extra effects (Memento self-faint, Toxic Thread poison) — `parseMoveEffects` (P1/bug)
- [fixed-claude/intelligent-einstein-8ji8nj] Precondition moves unimplemented — deal damage that should fail (Dream Eater, Thunderclap, Synchronoise) — `parseMoveEffects` (P2/bug)
- [wontfix-corner-case-common-path-matches-showdown-by-the-hp] Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor — `parseMoveEffects-burn-modifier` (P3/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites — `parseMoveEffects-damage-core` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] Damage formula divides un-truncated (fractional) A/D — Showdown floors atk/def stats first (±1 HP) — `parseMoveEffects-damage-formula` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] Damage roll is continuous `0.85+rand*0.15` — never reaches 100%, so max-roll damage is unreachable — `parseMoveEffects-damage-roll` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] Burn halving & Ice Scales key off `move.cat`, not `_effectiveCat` — wrong for Photon Geyser / Shell Side Arm — `parseMoveEffects-effectiveCat-burn` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()` — `parseMoveEffects-on-contact-abilities` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] Contact-ability procs (Static / Poison Point / Flame Body / Cute Charm / Poison Touch / Toxic Chain / Cursed Body) all bare `Math.random()` — `parseMoveEffects-onhit-abilities` (P1/bug)
- [wontfix-ratified-pc-box-cap-30] PC_BOX_CAP is 30 in code but the canonical spec says 10 — `PC_BOX_CAP` (P1/inconsistency)
- [fixed-main] In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30 — `PC_BOX_CAP` (P2/inconsistency)
- [fixed-main] Pokémon Center storage rows are mouse-only clickable divs (no keyboard access) — `pcRenderStorage` (P2/a11y)
- [wontfix-DE-SCOPED-permanent] Battle for Pokémon wager system (STORY_FEATURES_INTEGRATION.md §6) still missing — `pendingWager` (P1/inconsistency)
- [fixed-claude/funny-clarke-EnGMv] Fire-type damaging moves do not thaw a frozen target (only flag-marked moves thaw) — `performAction` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] HP-restore berry (Sitrus/Oran) eaten mid-hit suppresses Berserk / Wimp Out / Anger Shell HP-cross — `performAction` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] Multi-hit contact moves skip all on-contact abilities/items (Rough Skin, Iron Barbs, Rocky Helmet, Static, etc.) — `performAction` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] Multi-hit moves skip the Shield Dust / Sheer Force / Covert Cloak / Substitute secondary gate — `performAction` (P1/bug)
- [fixed-main] Solar Beam bad-weather power halving is dead code — checks `"SolarBeam"` (no space) which never matches — `performAction` (P1/bug)
- [fixed-claude/funny-clarke-EnGMv] 2-5 multi-hit distribution is 33/33/17/17, not the modern 35/35/15/15 — `performAction` (P2/bug)
- [fixed-claude/pensive-tesla-GbCMy] Future Sight / Doom Desire resolve one turn too early (set to 2 turns; spec & Showdown require a 2-turn delay = 3) — `performAction` (P1/bug)
- [fixed-main] "Vitamin" names three distinct systems — IV items, casino prize, EV voucher — `PERM_BOOST_ITEMS` (P2/inconsistency)
- [fixed-main] Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30 — `playStoryTutorial` (P2/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()` — `playTurn` (P1/bug)
- [fixed-claude/gifted-fermat-yfnqq5] End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals — `playTurn` (P1/bug)
- [fixed-main] 29 of 31 mart/dept catalog items (potion, superPotion, X items, orbs, etc.) have no entry in `data/items.json` — `POKEMART_ITEMS` (P2/data)
- [fixed-main] Mart/Dept consumables (30 ids: potion, xAttack, sunOrb, evResetCharm…) are a self-contained namespace, NOT entries in items.json — `POKEMART_ITEMS` (P2/data)
- [fixed-claude/sharp-keller-eZEDN] 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded — `prefers-reduced-motion` (P3/a11y)
- [fixed-claude/gifted-fermat-yfnqq5] proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces — `proceedToNextBattle` (P3/bug)
- [fixed-claude/gifted-fermat-yfnqq5] proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces — `proceedToNextBattle` (P3/inconsistency)
- [fixed-main] `_storyBattleEntryBusy` can latch true on a cold-open / beat-scene continuation throw → soft-locks "Enter Gym / Continue Route" — `proceedToNextBattle` (P2/bug)
- [wontfix-ratified-memo2-flat-weak-start-by-design] City-0 starter pick is drawn from a pure-G4 (weakest tier) pool — `PROF_ROLLS` (P2/balance)
- [fixed-main] Mystery swap picker mislabels BST grade as "Power tier (1-4)" — `profAccept` (P2/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] `pushData` queue keeps advancing after a write fails — `_pushDataImpl` errors are swallowed to `console.warn`, leaving local state diverged from Supabase — `pushDataQueue` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] `pvp_rooms` SELECT policy is `using (true)` — anyone with the public key can scrape every live match's full draft + battle state — `pvp_rooms_select` (P1/security)
- [fixed-claude/sharp-keller-eZEDN] Permissive RLS (`using (true)` for UPDATE/DELETE/INSERT) lets any anon client clobber/wipe any PvP room — `pvp_rooms_update` (P0/security)
- [wontfix-room-code-is-addressing-not-secret-tokens-protect-writes] Room codes use `Math.random()` over 32 chars × 6 positions — 30 bits, birthday collision at ~30K concurrent rooms, retry-on-23505 saves correctness but not enumeration cost — `randomCode` (P3/bug)
- [fixed-main] README calls catch / PC / Underground / Safari / boss-arc "upcoming"; all are shipped — `README` (P2/inconsistency)
- [fixed-main] README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming" — `README.md` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] `remoteRowQueue` has no timeout — a hung `onOnlineRoomData` (e.g., a UI promise that never resolves) freezes ALL future remote updates — `remoteRowQueue` (P1/bug)
- [fixed-main] Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic) — `renderCityActions` (P1/inconsistency)
- [fixed-claude/sharp-keller-eZEDN] City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation — `renderCityActions` (P2/bug)
- [fixed-main] Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic) — `renderCityActions` (P2/bug)
- [fixed-main] Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale — `renderCityActions` (P3/balance)
- [fixed-main] Rival-gate tip labelled "Heal …" deep-links to the Poké Center, which performs no heal — `renderCityActions` (P3/dx)
- [wontfix-out-of-scope-crucible] Post-HoF Crucible super-hub is unreachable — city button gated on dead bossArc state — `renderCityActions` (P0/bug)
- [wontfix-out-of-scope-a11y-nonstory] Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon — `renderDraft` (P1/a11y)
- [fixed-claude/sharp-keller-eZEDN] Party count chip shows "(N/6)" regardless of the actual badge-driven cap — `renderTeamPanel` (P3/bug)
- [fixed-claude/sharp-keller-eZEDN] `No Item` sentinel string used in 11 build slots is absent from `data/items.json` — `resolveCsvBuildEntry` (P1/data)
- [fixed-claude/funny-clarke-EnGMv] ISSUE-038 is marked fixed but `No Item` is still absent from items.json and 11 build slots still reference it — `resolveCsvBuildEntry` (P2/inconsistency)
- [fixed-main] Battle log (#battle-log) only cleared on returnToHome, not at battle start; previous fight's lines bleed in — `returnToHome` (P1/bug)
- [fixed-main] CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive) — `RIVAL_ATTACK_TYPE_DECAY` (P3/balance)
- [fixed-claude/sharp-keller-eZEDN] Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros` — `rollMysteryFigureFinalBossTeam` (P3/bug)
- [fixed-claude/gifted-fermat-yfnqq5] Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded — `rollMysteryFigureFinalBossTeam` (P3/inconsistency)
- [fixed-main] `_trainerPoolCache` is an unbounded Map (keyed on type+gens) with no eviction — Fight Club draft / story-pool variety will grow it without limit — `rollTrainerTeam` (P2/perf)
- [fixed-main] Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4 — `SAFARI_ENTRY_COST` (P2/inconsistency)
- [fixed-claude/inspiring-shannon-MP5aq] Move-test generator strips apostrophes, and the engine silently runs unknown move names as a 187-dmg fallback — `safeName` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load — `SAVE_VER` (P2/dx)
- [fixed-main] `SAVE_VER = 23` but migration dispatch stops at `_loadedVer < 22` — no numbered v23 step — `SAVE_VER` (P4/dx)
- [fixed-claude/relaxed-bell-2X3Ys] SAVE_VER=23 but migration chain stops at `_loadedVer < 22` — no migrateStoryPreV23, no boot shadow-validation — `SAVE_VER` (P3/dx)
- [fixed-main] SAVE_VER=23 but migration chain stops at PreV22 — no migrateStoryPreV23 step (v23 added wanderByEventIdx, back-filled unconditionally) — `SAVE_VER` (P2/dx)
- [fixed-claude/sharp-keller-eZEDN] All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"` — `screen-landmarks` (P3/a11y)
- [fixed-claude/sharp-keller-eZEDN] Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play — `seedDebugMysteryLegendGate` (P3/bug)
- [fixed-main] Pending Healing Wish / Lunar Dance flags bleed into next battle and auto-heal its lead — `selectPartyMember` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] 6 silent `catch (e) {}` blocks in online-pvp.js swallow all errors without logging — `setBattleLogHtml` (P2/dx)
- [fixed-claude/sharp-keller-eZEDN] Display names accepted up to 24 chars with zero sanitization — flow into innerText today, but one careless innerHTML downstream becomes XSS — `setDisplayName` (P2/security)
- [fixed-main] Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off — `settings.megaOn` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate — `shouldForceCityProfessor` (P3/refactor)
- [fixed-claude/sharp-keller-eZEDN] `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()` — `shouldForceCityProfessor` (P3/dx)
- [fixed-main] Anomaly seeds fire via low-z `showGameAlert` on the same tick as the row's flow — can paint behind/over other overlays — `showGameAlert` (P2/inconsistency)
- [fixed-claude/relaxed-bell-2X3Ys] anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all — `showMoveEffect` (P2/a11y)
- [fixed-claude/relaxed-bell-2X3Ys] showScreen() does no focus management on story-screen transitions — focus is orphaned — `showScreen` (P1/a11y)
- [fixed-claude/sharp-keller-eZEDN] Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored — `showVictoryOverlay` (P2/a11y)
- [fixed-claude/gifted-fermat-yfnqq5] Victory overlay auto-dismisses after 6s regardless of how much narrative it stacks — the biggest story beats can vanish before they're read — `showVictoryOverlay` (P3/dx)
- [fixed-claude/cagedgod-excision] Subject Zero stored to PC (party-full at cage) shows "Subject Zero" nickname but is never auto-fielded — easy to miss the capstone mon — `showVictoryOverlay` (P3/inconsistency)
- [fixed-claude/gifted-fermat-yfnqq5] Inconsistent auto-dismiss across scene types — victory 6s timeout vs beat scenes never auto-dismiss — `showVictoryOverlay` (P3/inconsistency)
- [fixed-claude/cagedgod-excision] Boss-mechanic hookup reads window.StoryMode.{BOSS_CONFIGS,bossMechanics*} but those live on test-only __storyTest — boss arc still dead in prod — `startBattle` (P1/bug)
- [fixed-main] Boss/raid mechanics state never reset; bleeds into next ordinary Story fight — `startBattle` (P1/bug)
- [fixed-main] Fresh run starts with 0 Poké Balls; skipping the optional City-0 Mart silently no-ops the catch tutorial — `startNewRun` (P2/bug)
- [fixed-main] Fresh run starts with 0 PokéBalls (spec says 5 at run start); 5 are gifted at first Mart instead — `startNewRun` (P1/inconsistency)
- [fixed-main] Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds — `startNewRun` (P3/bug)
- [fixed-claude/collection-ui-achievements-update-4j31fc] 8 "Replayability" achievements were defined but never unlocked (dead trophies) — `STORY_ACHIEVEMENTS` (P2/bug)
- [fixed-claude/cagedgod-excision] Achievements `caged_god` / `r_caged_god` are permanently unobtainable (dead arc) — `STORY_ACHIEVEMENTS` (P2/inconsistency)
- [fixed-claude/gracious-goodall-QFuQF] Caged God achievements (caged_god, r_caged_god) are permanently unearnable after v24 arc cut — `STORY_ACHIEVEMENTS` (P2/inconsistency)
- [fixed-claude/cagedgod-excision] Row-67 `STORY_BEATS` still tags `'cagedGod'` + coldOpen `mystery67` — stale cut-arc residue in the live beat map — `STORY_BEATS` (P3/dx)
- [wontfix-internal-keys-stable-not-user-facing] Internal action keys use `Pokemon` (no diacritic) while UI labels use `Pokémon` — `STORY_EVENTS_RAW` (P3/inconsistency)
- [fixed-main] STORY_MODE_FLOW says timeline is "68 rows"; STORY_EVENTS_RAW actually has 67 rows — `STORY_EVENTS_RAW` (P2/inconsistency)
- [fixed-main] Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do") — `STORY_EVENTS_RAW` (P3/balance)
- [fixed-main] STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows" — `STORY_EVENTS_RAW` (P3/data)
- [fixed-main] STORY_EVENTS_RAW resolves to 67 rows in harness vs 68 stated in spec/mandate — `STORY_EVENTS_RAW` (P3/data)
- [fixed-claude/relaxed-bell-2X3Ys] Timeline is 67 rows; STORY_MODE_FLOW.md (and this update's brief) still say "68 rows" — `STORY_EVENTS_RAW` (P3/inconsistency)
- [fixed-claude/optimistic-ptolemy-g3COo] De-scoped features (Black Market, Illegal Dealer, Trader, Wager, full Itinerary) still presented as active spec — precise doc-edit list — `STORY_FEATURES_INTEGRATION` (P2/dx)
- [fixed-main] docs/STORY_MODE_AUDIT.md is stale — most of its flagged issues are now fixed (SAVE_VER 14→22) — `STORY_MODE_AUDIT` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] 6+ stale `battle.html:LINE` refs in STORY_MODE_CATCH_INTEGRATION_RISK.md (avg drift ~9000 lines) — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (P3/dx)
- [fixed-main] Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix" — `STORY_MODE_CATCH_INTEGRATION_RISK.md` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] 9 of 10 `battle.html:LINE` refs in STORY_MODE_FLOW.md are stale (avg drift ~7000 lines) — `STORY_MODE_FLOW.md` (P3/dx)
- [fixed-claude/sharp-keller-eZEDN] STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30 — `STORY_MODE_FLOW.md` (P3/data)
- [fixed-claude/sharp-keller-eZEDN] 5+ stale `battle.html:LINE` refs in STORY_NARRATIVE_VARIANTS.md (variant-system anchors moved 3-5k lines) — `STORY_NARRATIVE_VARIANTS.md` (P3/dx)
- [fixed-main] Spec/mandate says timeline is "68 rows"; STORY_EVENTS_RAW has 67 (array idx 0–66), and rowId 68 is the intro Rival at array idx 1 — `STORY_RIVAL_ROW_INTRO` (P3/inconsistency)
- [wontfix-out-of-scope-crucible] Crucible & Catch headers use empty spacer spans instead of a back control; no escape from Crucible header — `story-crucible-header` (P3/a11y)
- [wontfix-descoped] Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast — `story-dialog-nameplate` (P2/a11y)
- [fixed-claude/collection-ui-achievements-update-4j31fc] Pokédex counts strip updates live (seen/caught) but is not an aria-live region — `story-pc-pokedex-strip` (P3/a11y)
- [fixed-claude/sharp-keller-eZEDN] Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline — `story-shop-buy-btn` (P3/a11y)
- [fixed-claude/sharp-keller-eZEDN] Tutorial overlay's four-stage entrance animation has no reduced-motion fallback — `story-tutorial-overlay` (P3/a11y)
- [fixed-claude/sharp-keller-eZEDN] Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile — `storyCatchMasterPulse` (P3/a11y)
- [fixed-main] CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10 — `storyDifficultyCoinMult` (P3/balance)
- [wontfix-ratified-memo1-hard-parity-by-design] Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry — `storyDifficultyCoinMult` (P3/balance)
- [fixed-claude/cagedgod-excision] Help screen still advertises the cut Caged God / Subject Zero / Master-Ball quest — `storyHelpText` (P2/inconsistency)
- [fixed-main] STORY_NARRATIVE_VARIANTS.md presents a cut 8-variant design as "canonical" (future-prompt-rebuild trap) — `STORYLINE_VARIANTS` (P2/inconsistency)
- [fixed-main] Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays — `storyRngNext` (P1/inconsistency)
- [fixed-main] Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded — `storyRngNext` (P2/inconsistency)
- [wontfix-DE-SCOPED-permanent] Pokémon Trader (STORY_FEATURES_INTEGRATION.md §7) at City4 still missing — `traderOfferByCity` (P1/inconsistency)
- [fixed-claude/collection-ui-achievements-update-4j31fc] E4 Lance and Champion Lance shared a byte-identical signature roster (copy-paste dup) — `TRAINER_DATA` (P2/data)
- [fixed-main] Trick / Switcheroo swap is one-directional — the user's item is destroyed — `Trick` (P2/bug)
- [fixed-claude/sharp-keller-eZEDN] Speed-tie resolution + Quick Claw + lock-turn duration all use bare `Math.random()` in the turn loop — `turn-resolution` (P1/bug)
- [fixed-claude/sharp-keller-eZEDN] `???` type used by gen1 `bide` and gen4 `curse` is not defined in `typeChart` — `typeChart` (P1/data)
- [fixed-claude/inspiring-shannon-MP5aq] Upper Hand / Shell Trap don't enforce their precondition gate — `Upper Hand` (P3/bug)
- [fixed-main] EVOLUTION_FLOW_REBUILD.md header says "Status: Plan — review before implementation" but the system fully shipped — `VOUCHER_KEYS` (P2/inconsistency)
