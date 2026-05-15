# Story Mode — Comprehensive Audit

A full-stack investigation of story mode in `battle.html` (~28k LOC) and supporting docs.
Six parallel agents covered (1) state/save/timeline, (2) trainers/AI/balance,
(3) shops/items/economy, (4) dialogue/narrative/Mystery Figure, (5) UI/UX/accessibility,
(6) special mechanics (catch / PC / wager / safari / itinerary / hardcore).

The structure mirrors the request:
**issues → inconsistencies → balance → fun → fanservice → replayability → accessibility → UX
→ UI → ease-of-play → competitive info → descriptions → guidance/clarity → dialogue
→ story engagement → Mystery Figure → richer gameplay.**

Every claim is anchored to `battle.html:LINE` so each finding can be jumped to directly.

---

## 0. Map of the system (so you can navigate)

| Layer | Where it lives | Entry points |
|-------|----------------|--------------|
| Run state (`sm` global) | `battle.html` ~22191–22340 | `newStoryRun`, `load`, `save`, `SAVE_KEY = pbs_story_save` |
| Timeline | `STORY_EVENTS_RAW` ~21273–21341 (68 rows) | `enterBattleEvent`, `proceedToNextBattle` (~24593) |
| Migrations | `migrateStory*PreV*` ~22052–22183 | `SAVE_VER = 14`, runs on `load` |
| Difficulty | ~8884–8900 (stat mult), ~21365–21372 (coin mult), ~24740 (HC persistence) | `sm.storyDifficulty` ∈ {veryeasy, easy, normal, hard, challenge, hardcore} |
| RNG | `storyRngNext` ~22286–22294 (LCG, seeded) | `sm.runSeed`, `sm._strngState` |
| Trainer roller | `rollTrainerTeam` ~22855, `rollMysteryFigureFinalBossTeam` ~23063 | Rival adapts via `_rivalScoreAttackTypeVsParty` ~22705 |
| Mystery Figure | `enterProfessor` ~24314, sprite hard-coded `Cyrus` ~24339, post-HoF row 67 | Gate: `isPreLeagueLegendaryMysteryGate` ~21483 |
| Rival | `setRivalStanding` ~22215, phase via `getRivalEncounterPhase` ~21703, sprite `pickStoryRivalSpriteFile` ~23199 | Standing: `rivalLastWinner`, `rivalChampionClaimed` |
| Shops | Mart `POKEMART_ITEMS` ~21528, Dept `DEPT_ITEMS` ~21542 + featured rotation ~25108–25230, Artifact ~25273–25327 | `enterShop`, `enterArtifactShop` |
| Facilities | Tutor ~26946, Colress ~27277, EV Trainer ~27585, Link ~25331–25709, Casino ~25420–25483 | Each priced; persistent across battles |
| Dialogue | `TRAINER_QUOTES` ~21768, `TRAINER_QUOTES_BY_NAME` ~21782, `CITY_PROFESSOR_QUOTES` ~21868, `CITY_GUIDE_QUOTES` ~21882, rival pools ~21743–21765 | `getTrainerQuoteForBattle` ~21814 |
| Retreat / game-over | `_storyCalcRetreatGoldFee` ~23983, `refreshStoryGameOverRetreatUI` ~24006, screen `#screen-story-gameover` ~4859 | `acceptRivalLossAndContinue` ~24918 |
| Dev tools | `?kobugtest=1`, `?debugMystery=1`, `?storychampionweak=1`, `?testmega=1`, plus Settings → Developer / Story tools | ~6264, ~23368, ~23474 |

**Spec-vs-code reality check:** `docs/STORY_FEATURES_INTEGRATION.md` describes seven major
mechanics (catch mode, balls, PC Box, Black Market, Illegal Dealer, Safari Zone, Wager,
Trader, full Itinerary). Of those, **zero are implemented in code** — every one is
0% complete. The README also references a `catchMode` user-facing setting that has no
shop/UI/box backing.

---

## 1. Bugs, inconsistencies, smells (cross-cutting)

These are the issues found in shipped, running code.

### Critical / functional

| # | File:line | Issue |
|---|-----------|-------|
| 1.1 | `battle.html:21852` | Rival's secondary intro line uses bare `Math.random()` instead of `storyRngNext()` — breaks the "seed determines everything" contract for replays / shared seeds. |
| 1.2 | `battle.html:22897` (rival rolling), `22737` (decay) | `RIVAL_ATTACK_TYPE_DECAY = ÷30` is too aggressive: after 1–2 picks the chosen type is effectively neutralized, so rivals **stop counter-picking** and feel "scattered" against monotype parties instead of oppressive. Recommend ÷10–15 or sub-linear decay. |
| 1.3 | `battle.html:21469` | `GYM_CITY_LEADER_EVENT = {1:5, 2:11, 3:18, …}` is a **hard-coded** map of timeline indices. Pre-V8 dropped 8 rows and pre-V9 inserted the intro Rival; if a future migration shifts a battle row, this map is silently wrong (gym hub label/sprite skews to the wrong leader). Should be derived from `STORY_EVENTS_RAW` at boot. |
| 1.4 | `battle.html:22317`, `22310` | `sm.currentEnemyLock.team` and other persisted blobs are **never schema-validated** on load — corrupted saves crash inside `launchBattle` instead of falling back gracefully. Add a try/catch around the lock that nukes it on parse failure. |
| 1.5 | `battle.html:24821, 24933` | `sm.eventIndex++` then `save()` then `processNextEvent()` — write-then-validate pattern: a corrupted index is persisted **before** clamping. Validate before write. |
| 1.6 | `battle.html:24740` (HC restore), `~24945` | Hardcore persistence applies only to the **player** team. After a Rival rematch the foe team is restored from the lock but the player's HP/PP are still where they left off — fine going in, but a Rival concede leaves the rivalry dialogue inconsistent because the foe state was never restored to "fresh" before display. |
| 1.7 | `battle.html:22208–22220` | `normalizeRivalStandingState` runs only on `load`, not on `newStoryRun`. A bad import or a deleted-and-reseeded run could carry stale `rivalChampionClaimed=true`. |
| 1.8 | `battle.html:23980 vs 24995` | Asymmetric difficulty checks: retreat-fee logic checks `!== 'easy'` and `!== 'veryeasy'`, but heal-on-loss checks `=== 'hardcore'`. Refactor to one helper (`difficultyAllowsHeal(d)` / `difficultyHasRetreatFee(d)`). |
| 1.9 | `battle.html:24314+` Mystery prof flow | Mystery Figure flow assumes the player has 6 mons; if the party is < 6 the mystery offer becomes "free add" with no prompt to remove anyone — the post-HoF mystery effectively **breaks** if the player completed the league with fewer than 6. |
| 1.10 | `battle.html:25420–25483` casino | The casino is a literal 50/50 coin flip — no slots, table game, or prize pool. The screen exists but the `STORY_MODE_FLOW.md` and feature docs imply more. |

### Design inconsistencies

- **Mart catalog forgets balls.** `POKEMART_ITEMS` (`battle.html:21528`) has potions, X items, restores — but no Poké/Great/Ultra/Master Ball, despite README and `STORY_FEATURES_INTEGRATION.md` §1 stating "balls when `catchMode` on". Catch mode is undefined in code.
- **Department Store is per-city sold-out** (`battle.html:25151`) but Mart is unlimited. There's no in-UI affordance for the player to learn which is which.
- **Rival quote pool is the only adaptive narrative.** Gym leaders, Elite Four, and Champion all draw from a static role pool (`battle.html:21768`); their per-name overrides exist (`21782`) but never react to state (no "first attempt vs. rematch", no "you came in with low HP" flavor).
- **Mystery Figure sprite is unconditionally `Cyrus`** (`battle.html:24339`). No story rationale, no rotation, no narrative about why it's that character.
- **Red has only three ellipsis lines** (`battle.html:21807`). Stylistic but breaks for screen readers and feels like missing content.
- **City6 professor button missing.** `CITY_PROFESSOR_SLOTS` (`~21903–21911`) assigns Clemont to City6, but no actions render the prof button on that hub.
- **City4 Trader spec'd at index 26 OR 29** (`STORY_FEATURES_INTEGRATION.md` §7) — the choice was never made and the feature is unimplemented either way.
- **`STORY_MODE_FLOW.md` (root)** is empty (zero bytes). The README points at it.

### Smells (low-severity but worth a sweep)

- Deeply nested async callbacks (`enterBattleEvent → showVictoryOverlay → processNextEvent`) make state mutation hard to reason about. A small state-machine wrapper would help.
- `confusion` (`18105`), `partial trap` (`17703`), `ice thaw` (`17673`), `harvest` (`20538`) all use `Math.random()` in mid-battle effects — when story is "seeded", these still drift. If determinism matters for daily seeds, route them through `storyRngNext`.
- Item sell price logic exists at 50% (`battle.html:25912`) but no UI exposes it.

---

## 2. Balance issues & balance upgrades

| # | File:line | Issue | Suggested upgrade |
|---|-----------|-------|-------------------|
| 2.1 | `21356–21372` | **Coin curve fights the difficulty curve.** Hard pays ×0.92, late-game progress mult tapers to ×1.00 — the hardest stretch (City6–8) earns the **least** while Colress (10k) and Link upgrades (14k+) spike. | Floor Hard at ×1.00; give Hardcore +30%–50% to compensate for no-heal attrition. |
| 2.2 | `8881–8901, 24740` | **Hardcore = persistence + normal stats + normal coins**, so the hardest mode is not actually rewarded — pure punishment. | Either bump HC coin multiplier, or unlock a HC-only banner / cosmetic on clear. |
| 2.3 | `22480` (`storyStripGrade4IfPartyMature`) | G4 floor only kicks in at 4+ mons. With 1–3 mons you fight 60–100% G4 trainers but face G3 Gym Leader 1 — a **gym is easier than the route**. | Trigger the G4 strip at 2+ mons. |
| 2.4 | `21378–21389` | **Starter pool is mostly G4** (City0: 70% G4, 30% G3). Players regularly lock into a weak starter for 5+ battles. | Floor the starter pool at G3 in City0–1; make G2 reachable by City2 unconditionally. |
| 2.5 | `22249–22272` | **League stat boost (E4 +20% HP, +15% bulks; Champion +30% HP, +15%/+15%) stacks multiplicatively on top of `storyDifficulty` mult.** Challenge difficulty against E1 = +56% HP vs. Normal = +20% — that's a 2.5× cliff. | Apply league boost as flat stat additions, or apply it inside the difficulty formula instead of on top. |
| 2.6 | `21337–21340` | **Mystery Figure (post-HoF, 12000G) gets the highest reward but the run is over** — money has nowhere to go. | Either: (a) give a permanent unlock per win (NG+ relic), or (b) move the reward into a new-run starting bonus. |
| 2.7 | `22876, 22517–22525` | **Signature-mon probability is hard-coded per trainer (5–50%)**, not tier-bounded. Youngster with `sigs:['Rattata']` rolls 2–3 Rattatas; feels degenerate. | Cap by tier: Basic ≤20%, Elite ≤60%, Gym/E4/Champion uncapped. |
| 2.8 | `20932–21050` E4 trainers | **No locked named E4** — Lance, Karen, Wallace etc. are not pinned to E1–E4 slots. Same role pool fills any slot. | Lock named bosses to E1–E4 with fixed sigs + custom quotes (fan-service double-up). |
| 2.9 | `21528` mart | **Mart never refreshes.** Same 12 items at every hub, full stock. No "premium consumables unlock at badge 4". | Tier-gate items: e.g., Full Restore unlocks badge 3, Max Revive badge 5. Creates economic curve. |
| 2.10 | `25331–25334` Link | **Link cost escalation is ×1.5 per use stored in `cityRerollsUsed`** but the counter is per-city, so global re-roll spam between cities stays cheap. | Track lifetime use too; add a soft cap or escalating "fatigue" message. |

---

## 3. Fun upgrades

Pure "make-it-feel-better" additions, ranked by ROI.

1. **Per-gym-leader victory callbacks.** `battle.html:24995` is a single generic "You received a Gym Badge!". Trivially extend with a `LEADER_VICTORY_LINES[name]` map (Brock: "Your defense is rock-solid…", Misty: "You really do have water under control", etc.). 2–3 hours of writing, ~15 lines of code.
2. **Elite-Four progression voice.** `24998` reads `"Elite ${n} passed—one step closer!"`. Replace with per-step escalation ("First gate broken. Three remain." → "Beyond lies the Champion."). Same hook, no schema change.
3. **Rival "losing-streak" line.** Track `sm.rivalConsecutiveLosses` (increment on rival win, reset on player win). Splice into `rivalStandingPrimaryQuotePool` (`battle.html:21743`): "Three losses in a row. You're slipping." Adds flavor without new screens.
4. **City names.** Right now the cities are `City0..City9`. The `CITY_GUIDE_QUOTES` already imply identities ("Waterfront or mountaintop — this city has both"). Give them real names + a one-line tagline shown in the hub header.
5. **Rival-tier rematch.** After a Rival win, offer a paid optional rematch in the next city with their party rerolled at +1 grade. Hooks cleanly into existing `currentEnemyLock`.
6. **End-of-route "today's headline".** Random one-liner from a small pool when entering a new city: weather, crowd notes, news of a wild legendary etc. Sets tone with no mechanical change.
7. **Casino slot machine + prize pool.** Casino currently is a literal coin flip (`25420–25483`). Add a 3-reel slot with a small prize pool (Rare Candy clone, +1 Link reroll voucher, type-themed orb). Makes the screen worth visiting.
8. **Battle-intro music sting per role.** Reuse existing music tracks in `music/`; pick a sting per `eventType` so Gym/E4/Champion/Rival each *sound* distinct.
9. **Confetti + sting on first-ever clear of each gym.** `storySpawnConfetti` exists (`22031`). Save `sm.firstClears = {gym1: true, …}`; only fire the celebratory confetti the first time per save.

---

## 4. Fanservice upgrades

Things that reward players who care about the lineage / lore of the games.

1. **Lock canonical E4 + Champion names.** Lance/Karen/Will/Bruno/Lorelei → E4 in some runs; Wallace/Steven/Cynthia/Iris/Diantha/Leon as Champion options. Today they exist in `TRAINER_QUOTES_BY_NAME` (`21782`) but aren't pinned to slots.
2. **Rival skin selection at run start.** `pickStoryRivalSpriteFile` (`23199`) already maps Hop→Barry, Marnie→Gladion etc. — surface this as a chooser in the run-setup screen.
3. **Starter homage roll.** When `City0` rolls starters, weight Bulbasaur/Charmander/Squirtle (and the other regional starter trios) higher than random base-60-BST mons.
4. **Mystery Figure as a rotating cameo.** Today it's always `Cyrus`. Rotate among iconic post-game bosses (Red, Cynthia, N, Steven, Leon, Marnie, Hop, etc.), with a one-line bark unique to each. Tie to a new field `sm.mysteryIdentity` rolled at run start (and pinned for the whole run).
5. **Gym TM rewards.** After each gym, drop the badge plus a flavor TM (Brock → Rock Tomb, Misty → Water Pulse). Implementable as a new `gymRewards` map consumed by `showVictoryOverlay`.
6. **Hall of Fame screen with party portrait grid.** Today the HoF row (66) just transitions; flesh it out with the team frozen as portraits + final seed + run number. (This is also the hook for replayability §6.)
7. **Trainer-class flavor item drops.** Rocket Grunt → Black Sludge; Bug Catcher → Silver Powder; cheap tag-ons that make trainer types feel unique.

---

## 5. Replayability upgrades

The biggest weakness of story mode today is "you finish once, run is over, gold is moot".

1. **NG+ counter.** On `processNextEvent → 'Hall of Fame'` (`23359`), bump `localStorage.story_completed_runs`; show "Run #N" in HUD (`23596`). Trivial.
2. **Daily seed mode.** Hash today's date + a salt → `sm.runSeed`. Add `?dailySeed=YYYY-MM-DD` URL handler at `23304`. No leaderboard required — players already swap seeds.
3. **Speedrun timer.** Start on first `enterBattleEvent` (`24593`), pause in cities, stop at HoF. Show in HUD; persist best time to localStorage.
4. **Starter-locked challenge runs.** Setting toggle: "monotype run", "no-evo run", "first-six-rolls-only" (already half-supported by the gen toggles + `noItemRun`).
5. **Achievement bar.** Track ~20 binary achievements: clear with monotype, clear hardcore, clear no-item-run, clear with one Pokémon, beat rival 4/4 times, etc. Show as a grid on the title screen. All localStorage; no backend.
6. **Rich post-HoF screen with seed-share.** Game already has `runSeed` in UI (`24856`); package it with the team list, badges, and total time as a copy-paste blob.
7. **Fixed-team draft mode.** Setting toggle: "no Professor / no Link / no Tutor" — the team you start with is the team you keep. Existing flags compose to ~half of this.

Effort matrix from the special-mechanics agent:
- NG+ flag + run counter: ~2 h (trivial)
- Daily seed handler: ~3 h
- Speedrun timer: ~3 h
- Achievement bar: ~1 day
- Rich post-HoF: ~half day

---

## 6. Accessibility (WCAG-ish)

| # | File:line | Issue | Fix |
|---|-----------|-------|-----|
| 6.1 | `battle.html:545` `.story-tutor-btn`, `1223` `.story-link-btn`, `1140` `.story-city-tip`, `803–823` HUD chips | Touch targets < 44 px on desktop CSS (mobile portrait is correct via `3175–3200`) | Add `min-height` to each: tutor/link 36 px, action 40 px, HUD chip 44 px. |
| 6.2 | `battle.html:24160` party card uses `role="button" tabindex="0"` but no `aria-label` and no Enter/Space handler | Screen-reader users can't tell what it does and keyboard users can't activate it | Add `aria-label="View ${mon.name} summary"` + `onkeydown` Enter/Space → click. |
| 6.3 | `battle.html:4319, 4392, 4411` modals | No focus trap; focus moves to body on close; no Esc handler | Wrap in helper that stores `document.activeElement` on open and restores on close; document-level Esc → closes top modal. |
| 6.4 | `battle.html:1156–1157` `.story-city-tip.urgent` | Color-only state indicator | Add a glyph / text prefix ("⚠ Urgent:"). |
| 6.5 | `battle.html:21807` Red's lines | Three ellipsis-only strings — silent for screen readers | Add `aria-label="Red is silent"` fallback on the dialogue node. |
| 6.6 | `battle.html:4606–4616` difficulty `<select>` | Differences are only in flavor text the user has to discover | Add `aria-describedby` summary: "Veryeasy −30% foe stats … Hardcore: normal stats but no healing." |
| 6.7 | `battle.html:4787` EV Trainer screen | "EVs" is jargon, never glossed | Add a 1-line subhead under the title: "Effort Values shape stat growth (max 252 per stat, 510 total)." |
| 6.8 | `battle.html:4884` Artifact Hall | No explanation of what artifacts are | Add a short intro paragraph. |
| 6.9 | `battle.html:27161` Ability tutor | Shows ability name only, no effect text (move tutor shows full effect) | Reuse the move tutor layout; add `getAbilityDescription` helper. |
| 6.10 | Status icons in battle | Emoji/unicode only; no `aria-label` | Add per-status `aria-label`. |

Reduced motion is otherwise honored (confetti gates on `prefers-reduced-motion`).

---

## 7. UX — improved screen-by-screen

| Screen | File:line | UX upgrade |
|--------|-----------|-----------|
| City hub | `4656`, `23667–23677` actions render | (a) Show the next event preview ("Next: Gym 4 — Erika"), (b) badge the action buttons by category (⚔ Gym, 👤 Rival, ❓ Mystery, 🛒 Shop), (c) display turn/time counters. |
| Mart / Dept | `4714`, `4729` | (a) Item-type filter chips (Heal / Status / X / Weather / Terrain), (b) explicit "sold out" tag per dept item using existing `sm.deptShopPurchasedByCity` data, (c) "Buy 6" bulk-buy button for restocks. |
| Tutor / Colress / EV / Link | `4745`, `4763`, `4787`, `4809` | (a) Persistent cost ribbon at top (today the cost is per-section), (b) gold-remaining live display in header, (c) ability descriptions inline. |
| Casino | `4827` | (a) Show running profit/loss, (b) limit max bet per spin to 10% of current gold (an opt-in safety toggle), (c) the slot game suggested in §3.7. |
| Game-over | `4859` | (a) "What you'd lose" preview before clicking Retreat (gold fee, current city), (b) one-click "Continue from auto-save" if applicable. |
| Settings | `4579–4640` | (a) Move dev tools behind a `details/summary` disclosure, (b) tooltip on each gen checkbox explaining what species it gates, (c) reset-to-defaults button. |

**Cross-cutting UX issues:**
- The `PC Box` button (when catch mode ships) needs a barker line first time the box gains a mon, paralleling the mart/colress barkers (`23667–23677`).
- Sell/vend logic exists at 50% (`25912`) but no UI surfaces it.
- After a layout shift on portrait, focus is not returned to the screen header; tab order restarts mid-screen (`3114–3160`).

---

## 8. UI — visual polish

- **Story HUD chips on portrait** (`3188–3191`) are 34 px tall — both a touch-target failure (§6) and visually anemic vs. the 44 px abandon button next to them. Bump to 44 px.
- **No loading skeleton when entering a battle.** A single dark-themed transition (already used by background swaps) would help mask the freeze when foe team rolls.
- **Mystery Figure draft cards** (`#screen-story-professor`, `4696`) have no visual cue when one card is a legendary — the only signal is the BST/grade badge. Add a faint glow / "Legendary" pill.
- **Gym-leader portraits in the hub use the same 135×135 frame as basic trainers** (`917–918`). Distinguish gyms with a typed border color (Rock=brown, Water=blue, etc.) — already have type tokens elsewhere.
- **Background manifest** (`21934, _storyBgManifest`) supports per-screen backgrounds but Black Market / Safari / Wager would all need new entries when they ship.
- **Confetti density** is fixed; could scale with milestone (badge 1 = 30 particles, Champion = 200).

---

## 9. Ease of play

- **No confirmation on irreversible actions.** Most critical: any future "Fence" / "Forged Pass" / Master Ball use. Today, no irreversible action prompts a dialog. Add a generic `confirmStoryAction(title, body)` helper.
- **Hardcore retreat fee is invisible until you click Retreat.** Show "Retreat: lose ~XG" inline on the game-over screen *before* the click.
- **Rival concede language is too long** (`24028`): "retry or retreat normally, or accept the loss, drop to 0G, and let the rivalry dialogue remember who won last." Split into bullets.
- **No undo on tutor purchases.** A "Last 3 actions" log + "Undo last" (free within same screen entry) would prevent angry mis-clicks.
- **Heal/restock affordances.** Today the player must remember to visit the mart in every city. Surface "Last restocked: 3 cities ago" in the HUD.
- **Auto-pause on background tab.** During battles, JS keeps running; freeze the timer and animations on `document.visibilitychange` hidden.

---

## 10. Better competitive information

The story battle UI hides information that competitive players (and curious newcomers) want.

| What's hidden | Where | Suggested reveal |
|---------------|-------|------------------|
| Foe ability | only revealed when ability fires | Show "???" pill with the ability slot once foe is on field; reveal real name once any in-battle source has revealed it (legitimate intel, no cheat). |
| Foe held item | revealed on Knock Off / Trick / consumed | Same "???" pill pattern. |
| Type matchup of a switch-in | not shown | Hover/tap the foe sprite → tooltip "Strong vs Water, Electric; Weak to Ground". |
| Speed comparison | not shown | Tiny ▲ / ▼ next to active mon names showing current relative speed. |
| Hazards on each side | shown via icons but no count | Add "×3" for Spikes layers etc. |
| Stat-stage chart | tap-to-show | Always show a compact `+1 Atk +2 Spe` strip under each mon. |
| Field timer (weather / terrain / TR) | shown via `#field-conditions` aria-live (`5016`) | Add countdown numbers, not just an icon. |
| Move PP per move | shown in select panel | Also show in pre-select tooltip during foe's turn so player can plan PP-stalling. |

For story-only context, also show:
- Current gradeWeights bucket the foe came from (debug toggle).
- Coin reward preview before pressing "Fight".

---

## 11. Improved descriptions

- **Items**: shop descriptions (`21528–21649`) are decent for mart but Mega/Ultra variants only append a single line — add "Ultra X Attack: same as X Attack but +4 stages instead of +2".
- **Artifacts** (`21572–21594`): all 21 have prose, but none state the *number* (e.g., "+50% Def/SpD" is correct; "+25% all damage" for Cursed Life Orb is correct; but Berserk Gene Vial says "+1 Atk/SpA, −1 Def/SpD" — clarify: "on entry, all battles, both sides").
- **Abilities**: zero in-game effect descriptions in the Tutor — high-impact addition (`27161`).
- **Moves**: tooltip in battle is good (`1588`), but Tutor doesn't show "Contact / Sound / Powder" tags that matter for ability interactions.
- **Difficulty**: each option needs one sentence inline (`4606–4616`).
- **Catch / PC / Wager / Safari / Black Market**: need first-time intro text when shipped (§13).

---

## 12. Better/extra guidance & clarity

A "first-time signposting" pass — every new system should explain itself once.

| Feature | Trigger | One-line intro to add |
|---------|---------|-----------------------|
| Catch mode | First wild encounter (when implemented) | "You can catch wild Pokémon. Use a Poké Ball; full PC + full party = catch fails." |
| PC Box | First time box has any mon | "PC Box stores extras when your party is full. Swap from any city hub." |
| Wager | First wager-eligible trainer | "This trainer wants to bet a Pokémon. Win → take their worst; lose → give your best. Decline to fight normally." |
| Safari Zone | First itinerary trigger | "Safari Zone — type-restricted catching. 500G entry. Resolves before the next battle." |
| Black Market | Unlock event | "Underground vendors. Unique stock; risky contracts. Stock changes per visit." |
| Hardcore difficulty | First time selected | "No healing between battles. No retreat fee, but no Pokémon Center either." |
| Hardcore concede | First Rival loss in HC | Show the **exact** consequence: "Concede → drops gold to 0, rival keeps the win. Retry → re-enter battle with current state." |
| Mystery Figure | First professor offer | "Mystery Figure — adds a partner to your party. Once per city; chooses for you if your party is full." |
| Legendary gate | City8 + 8 badges | "Legendary gate. Take a guaranteed legendary into the league; one party slot will be replaced." |
| Artifacts | First Artifact Shop | "Artifacts grant passive effects to **both** sides for the rest of the run. Pallet Town's first claim is free." |
| Link Station | First visit | Already covered. |
| Casino | First visit | Already covered. |

Pattern: small `oneTimeTip(key, body)` helper that writes `sm.tipsSeen[key] = true` and is a no-op if true.

---

## 13. Better dialogue

Concrete, hook-anchored writing tasks.

1. **Mystery Figure intro pool.** Add `MYSTERY_FIGURE_QUOTES` array; route `getTrainerQuoteForBattle` (`21814`) to use it for `eventType === 'Mystery Figure'`. 4–6 lines covering "I've crossed every region", "Your Pokédex is incomplete", "Finally, a worthy trainer", etc.
2. **Mystery Figure victory line.** Extend `showVictoryOverlay` (`24995`) with an `evn === 'Mystery Figure'` branch: "The mysterious trainer nods, then vanishes."
3. **Per-leader badge speech.** `LEADER_BADGE_LINES = { Brock:'…', Misty:'…', … }` keyed off `trainer.name`, slotted into `24995`.
4. **Per-Elite member intro.** Today E1–E4 are generic; named E4 (Lorelei/Bruno/Karen/Lance) deserves 2 lines each.
5. **Champion epilogue.** First clear vs. rematch differ; track `sm.hofClearedOnce` and switch the line at `25000`.
6. **Rival losing-streak / winning-streak lines** (§3.3).
7. **Itinerary beat intros** when each ships — a 2–3 line cutscene per beat (Safari announcer, Black Market shopkeeper, Wager NPC, Trader, Illegal Dealer).
8. **Professor flavor for the legendary gate** (`24336`): "A gate sealed by ancient trainers opens only at full strength."
9. **Tutor / EV / Colress / Link / Casino NPC barks** — Colress already has voice (`4774`), the rest are plain UI.

Total writing ≈ 200–300 lines for a complete pass; can ship incrementally without code churn beyond the dispatch hooks.

---

## 14. Deeper story engagement

Today the story is "go to next city, do the thing, repeat". Hooks that exist but are under-exploited:

- **`sm.itineraryProgress`** (spec'd) — once shipped, use it to weave a 3-act villain arc that spans Cities 3–8, with dialogue at every other hub. Use `STORY_SCRIPT` (still unwritten, see `STORY_FEATURES_INTEGRATION.md` §9).
- **Rival standing** is a perfect existing hook for emotional stakes — already tracks last winner + champion claim; expand to a full 4-state graph with arc-specific dialogue (rival-ahead-2, even, player-ahead-2, etc.).
- **Mystery Figure** is the natural endgame antagonist (§15) — a multi-encounter character rather than a one-shot.
- **Gym leaders dropping a one-liner about the city** (one per leader) ties the world together cheaply.
- **Safari / Trader / Wager NPCs** are perfect for one-off lore: a single 4-line exchange about the region's history when first met.
- **End-of-run "what your team became" recap** — names + nicknames + roles in chronological order.

---

## 15. Deeper Mystery Figure storyline

The Mystery Figure is the most under-developed major mechanic. Findings + ladder of upgrades:

**Status today (`battle.html:23063, 24314, 24339, 21483`):**
- Sprite: hard-coded `Cyrus`.
- Battle intro: falls back to `'Rival'` lookup — **no unique line**.
- Victory: no special case.
- Pre-League gate: forces Grade-1 legendary swap at City8 + 8 badges.
- Post-HoF row 67: optional super-boss, 12 000 G, no narrative.
- No identity, no hints, no reveal, no resolution.

**Three-layer upgrade plan, each independently shippable:**

**Layer 1 — Identity & voice (1–2 days writing + 50 LOC).**
- Roll a `sm.mysteryIdentity` at run start from a small pool: `["The Wanderer", "Cipher Z", "The Last Champion", "The Curator", "?????"]`.
- Pick sprite and color theme to match identity.
- Add 4–6 intro lines per identity in `MYSTERY_FIGURE_QUOTES_BY_IDENTITY[id]`.
- Victory line per identity.

**Layer 2 — Foreshadowing (3–4 days, depends on `STORY_SCRIPT`).**
- City3 onward, splice 1 line of mystery foreshadow into one random NPC bark per city (Professor, Guide, or trainer): "Some say a trainer beat every gym across every region…", "Last week a stranger rented every Mart in Saffron…".
- The accumulated hints subtly ramp.
- City8 legendary gate professor line ties the gate to the figure: "The figure walked through this gate alone, years ago."

**Layer 3 — Multi-act arc (1–2 weeks, requires Itinerary).**
- The Mystery Figure is encountered 3 times: (a) silent appearance on a route in City4 (no battle, just a pass-through scene), (b) Black Market vendor reveal in City6 (they're the dealer), (c) post-HoF battle.
- Player choices in (a) and (b) (talk / ignore / decline an offer) flavor the post-HoF dialogue.
- Beating Mystery Figure unlocks (i) a permanent NG+ relic — "Mark of the Wanderer" — that reduces every shop price by 5%, (ii) an alternate run-start option to play *as* the Mystery Figure (cosmetic).

This is the single highest-impact narrative investment available.

---

## 16. Richer gameplay

Mechanical depth that doesn't require new screens.

1. **Adaptive opponent switch logic for league fights.** Foes never voluntarily switch out; add a story-only "switch if incoming move is 4× resisted and bench has SE coverage" rule. Hooks into the existing AI in `parseMoveEffects` / battle loop.
2. **Foe team persistence between Rival rematches.** Use `sm.currentEnemyLock.team` to evolve the rival's roster across phases instead of rerolling.
3. **Trainer rematches.** Cache beaten trainers; allow paid rematch from the city, with re-rolled team at +1 grade.
4. **Held-item evolution.** Items that gain a property after N battles (e.g., a "Charged Crystal" that becomes a Z-Crystal at battle 10).
5. **Risk tokens.** Optional pre-battle modifier ("foe is 1.2× faster, you get 2× coins"). Stack across a city.
6. **Wild encounter fishing minigame** — when catch mode ships, a tiny risk/reward minigame (release the ball at the right time) gives crit-catch chance. Otherwise pure RNG.
7. **Egg from Trader.** When Trader ships, occasional offer of an egg slot that hatches over N battles into a random allowed mon.
8. **Daily / weekly bounty.** A single rotating bounty per real-world day ("KO 3 Dragon types this run") rewarding gold / NG+ tokens. Hooks into daily seed (§5.2).
9. **Rare encounter table per route.** Even outside catch mode, rolling a 1% rare opponent (Ace Trainer with a unique sig) adds variance.
10. **Type-themed Safari prize pool** — ties to §17.

---

## 17. Spec-only systems to actually ship (priority order)

`STORY_FEATURES_INTEGRATION.md` describes these — none exist in `battle.html`. Sequenced for max ROI, mirroring the doc's §10 order.

| Rank | System | Effort | Why this slot |
|------|--------|--------|---------------|
| 1 | **Catch mode + Poké Balls + PC Box** | ~3–5 days | Unlocks five other systems; mart needs new SKUs; PC needs hub button. |
| 2 | **Itinerary scaffolding** | ~3 days | All other beats hang off this; ordering rule `itinerary → wild → wager → trainer`. |
| 3 | **Black Market (multi-item shop)** | ~2 days | Big economic + flavor lift; unique SKUs only. |
| 4 | **Safari Zone** | ~2 days | Adds variety mid-game; depends on catch mode. |
| 5 | **Wager / Battle for Pokémon** | ~2 days | Strong narrative beats; needs the worst/best helpers. |
| 6 | **Pokémon Trader (City4)** | half-day | Smallest scope; quick win after Itinerary. |
| 7 | **Illegal Dealer NPC** | 1 day | Single-NPC contract loop; cheap once Black Market exists. |
| 8 | **Full dialogue authoring pass** | 1–2 weeks | Once hooks exist (per §13), fill in lines. |

For each, the audit cited the exact code hooks where the system would attach: `proceedToNextBattle` ordering (`24593`), `enterShop` for new shop variants (`23667–23677`), itinerary beat consumption inside `processNextEvent` (`23346–23360`).

---

## 18. Top-30 prioritized punch list

The 30 highest-ROI items from the entire audit, ordered by `(impact × frequency) / cost`.

1. Implement Catch mode + Poké Balls + PC Box (§17.1) — unblocks ~5 other systems.
2. Implement Itinerary scaffolding (§17.2).
3. Hard-code per-gym-leader victory lines (§3.1) — 3 hours.
4. Add Mystery Figure intro & victory lines (§13.1, §13.2) — 2 hours.
5. Lock named E4 + Champion to slots (§4.1) — 1 hour.
6. Floor Hard difficulty coin mult to ×1.00 (§2.1) — 5 min.
7. Add HC clear bonus / banner (§2.2) — 1 hour.
8. Trigger G4 strip at 2+ mons (§2.3) — 5 min.
9. Floor starter pool at G3 in City0 (§2.4) — 5 min.
10. Apply league boost flat instead of multiplicative (§2.5) — 1 hour.
11. Add NG+ counter (§5.1) — 2 hours.
12. Add daily seed mode (§5.2) — 3 hours.
13. Add speedrun timer (§5.3) — 3 hours.
14. Per-screen tap-target fix (§6.1) — 1 hour.
15. Modal focus trap + Esc handler (§6.3) — 2 hours.
16. Add `aria-label` + keyboard handler to story party card (§6.2) — 30 min.
17. Difficulty `<select>` description (§6.6) — 30 min.
18. Ability descriptions inline in Tutor (§6.9) — 2 hours.
19. Status icon `aria-label`s (§6.10) — 1 hour.
20. City hub: next-event preview chip (§7) — 2 hours.
21. Dept Store sold-out tag (§7) — 30 min.
22. "Buy 6" / bulk-buy in Mart (§7) — 2 hours.
23. Confirmation helper for irreversible actions (§9) — 2 hours.
24. Show retreat fee on game-over before click (§9) — 30 min.
25. Foe ability/item "???" pill that fills on reveal (§10) — half day.
26. Type-matchup tooltip on switch (§10) — 2 hours.
27. Per-screen one-time tip helper (§12) — half day.
28. Mystery Figure Layer 1: identity/voice (§15) — 1–2 days.
29. Adaptive opponent switch in league fights (§16.1) — 1 day.
30. Trainer rematches (§16.3) — 1 day.

---

## 19. Files & symbols index (quick jump)

- Run state: `battle.html` 22191–22340 — `sm.*`
- Timeline: `battle.html` 21273–21341 — `STORY_EVENTS_RAW`
- Migrations: `battle.html` 22049–22183 — `SAVE_VER`, `migrateStory*PreV*`
- RNG: `battle.html` 22286–22294 — `storyRngNext`
- Difficulty: `battle.html` 8881–8901 (stats), 21365–21372 (coins), 24740 (HC persistence)
- Trainer roller: `battle.html` 22855 — `rollTrainerTeam`
- Mystery Figure boss: `battle.html` 23063 — `rollMysteryFigureFinalBossTeam`
- Mystery prof flow: `battle.html` 24314 — `enterProfessor`
- Rival adapt: `battle.html` 22705 — `_rivalScoreAttackTypeVsParty`
- Rival sprite: `battle.html` 23199 — `pickStoryRivalSpriteFile`
- Rival standing: `battle.html` 22215 — `setRivalStanding`
- Mart catalog: `battle.html` 21528 — `POKEMART_ITEMS`
- Dept catalog: `battle.html` 21542, 21621–21649 — `DEPT_ITEMS`, `getStoryFeaturedItems`
- Artifact catalog: `battle.html` 21572–21594, 25273–25327
- Tutor: `battle.html` 26946 — `enterTutor`
- Colress: `battle.html` 27277 — `enterColress`
- EV Trainer: `battle.html` 27585 — `enterEVTrainer`
- Link Station: `battle.html` 25331–25709
- Casino: `battle.html` 25420–25483
- Retreat / game-over: `battle.html` 23983–24040, 24862–24941, screen `4859`
- Battle intro: `battle.html` 24688 — `showBattleIntro`
- Victory overlay: `battle.html` 24969 — `showVictoryOverlay`
- Quotes: `battle.html` 21768 (`TRAINER_QUOTES`), 21782 (`TRAINER_QUOTES_BY_NAME`), 21868 (`CITY_PROFESSOR_QUOTES`), 21882 (`CITY_GUIDE_QUOTES`)
- Dev tools: `battle.html` 6264 (`__storyChampionWeakTestUrlRequested`), 23368 (`seedDebugMysteryLegendGate`), 23474 (`seedStoryChampionWeakTestFromUrl`)

---

*Generated by parallel audit of `battle.html`, `docs/STORY_FEATURES_INTEGRATION.md`,
`README.md`, and the empty root `STORY_MODE_FLOW.md`. All findings cite real code; no
placeholders. No code modified — this document is the deliverable.*
