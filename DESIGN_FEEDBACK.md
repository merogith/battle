# Story Mode — Design Feedback

Cross-cutting notes from a full playtest pass. Bugs (broken / unintended) are in BUG_REPORT.md; this file is opinions, balance critique, and concrete proposals.

Findings are kept in **separate sections by topic** — no opinions mixed into the bug list and no bug fixes pretending to be design suggestions.

---

## 1. Balance & Gameplay

### 1.1 Difficulty curve is smooth but flat mid-run

The four-tier build power system (`STORY_BUILD_TIER` T1→T4) and the stage-gated stat multiplier (`_stageGatedFoeStatMult`, `battle.html:13199`) ramp the late game well. But **Gym 4 → Gym 6 sits on a plateau**:
- All foes in that stretch use a flat `1.0×` stat mult.
- Build tier mostly lives at T3 in that window.
- Wild encounters on routes 4–6 share rosters with route 3, so the visual variety is high but the actual threat doesn't change.

**Fix:** Add a mid-stage `1.025×` bump at GL5 and `1.05×` at the post-GL5 rival. Layer one new mechanic per region — held-item swaps at GL5, screen-setters at GL6, weather-rule rotation at GL7 — so the *texture* of fights changes even when the stats don't.

### 1.2 Difficulty preset spread is too narrow

- veryeasy: 0.70× foe stats / 1.60× coin
- easy: 0.85× / 1.50×
- normal: 1.00× / 1.30×
- hard: 1.15× / 1.00×
- challenge: 1.30× / 1.10×

Challenge is only 30% above normal. Players who hit a brick wall on Hard or Challenge will toggle down to Easy and the fights become trivial. **Recommend a hard split:**
- normal = 1.00× / 1.30× (baseline)
- hard = 1.20× / 1.00× (+5%)
- challenge = 1.45× / 1.20× (+15%, with the gold bonus restored to compensate for losses)
- Or couple difficulty to AI depth (1-ply lookahead on normal, 2-ply on hard, 3-ply on challenge).

### 1.3 Late-game economy is too tight

GL6+ payouts (~7,500 g) barely cover one Max Revive + 2 Hyper Potions + a Great Ball. Niche items (Weather Orbs at 1,000 g each, X-Specials, Choice items in dept store) get skipped because the player can't afford to *experiment*. Players never learn whether Weather Orb-based teams are good because they never test them.

**Fix:** Either drop city 6–9 consumable prices 30%, or bump Champion / E4 payouts to ~12,000 g and post-HoF rematch rewards to ~10,000 g. Players should leave the league with a meaningful war chest, not break even.

### 1.4 Dominant strategies / dead mechanics

- **Dominant:** The walkthrough harness completes the game with literally no items used and no strategic decisions — just gym-tier "any decent type matchup wins" play. That's a sign that mid-game battles don't reward team-building.
- **Dead-ish:** Weather Orbs (no AI uses weather, so manual-set Sunny Day teams have no opposing pressure to plan against), Casino (post-recon: didn't surface as story-critical anywhere), Pokémon Fan Club (vitamin-IV booster — but vitamins are also sold in marts, so the Fan Club is just a flavored mart with extra clicks).
- **Underused:** EV Trainer (paywalled at 5000g — by the time the player can afford to experiment freely they've already won). Move tutor (the build CSV already provides competitive movesets; only late-game players engaging the Battle Dojo bother with tutoring).

### 1.5 Stalling battles

Real-engine 6v6 stress fights stall for 50+ turns at high HP. The AI doesn't pick KO-range shots preferentially and has no "battle is dragging — go aggressive" heuristic. See BUG-004 — there's a fix path. The design implication: even with the engine fix, the **player** should also have an explicit "force end / surrender" option in the battle menu for cases where they realize they're outmatched. Currently surrender is buried in the post-battle screen.

### 1.6 Tier band feels right for trainers, wrong for wilds

`makeWildBuild` stamps T1 on every wild Pokémon for parity. That means **a wild Tauros in Route 7 is mechanically weaker than the Pikachu the player got from the professor in City 0**, even though the dex / lore framing says Route 7 wilds should be tougher.

**Fix:** Either bump wild builds by route stage (`+1 tier per 2 badges`) or rename the tier system internally so the implication is clearer — wilds are "untrained because they haven't been trained yet," not "weak by design."

---

## 2. Story & Narrative

### 2.1 Rival arc is narratively dynamic but mechanically static

The four rival encounters (phases 0/2/3/4) play scripted lines that *imply* awareness of progression. But the lines are **keyed by phase, not by actual record**. A player who has lost every rival match still hears "Mid-journey check-in — different roster, sharper picks" instead of "Three losses and you're still chasing me."

This is the single biggest narrative immersion break — it tells the player "your choices don't matter to the story."

**Fix:** Add `RIVAL_AHEAD_QUOTES` / `RIVAL_BEHIND_QUOTES` / `RIVAL_EVEN_QUOTES`, pick by `sm.rivalStanding[phase].diff` sign. Reuse the existing variant dialogue infrastructure.

### 2.2 Mystery Figure climax has setup gaps

8 identities (Cyrus, Ghetsis, Cynthia, Steven, N, Red, Lance + 2 variant-exclusive) are pinned at run start and revealed at the post-HoF Mystery battle. The reveal IS dramatic. But there's **no narrative seeding** in cities 4–7 to make the identity *feel earned* when it appears.

Compare to canon: Red's silent encounter on Mt. Silver is iconic *because* the lore book-ended it for chapters. Here, the player has zero hints; Cynthia might as well be a slot-machine result.

**Fix:** After Gym 4, seed two oblique references in random city dialogue keyed to the chosen identity. For example, "A traveler at the gate spoke of a woman who never breaks eye contact — she said your name and walked on" for Cynthia. The hint pool is small (~3 lines × 8 identities = 24 lines total) and reuses `CITY_GUIDE_QUOTES` mechanics.

### 2.3 Post-HoF returns to City 9 are silent

After clearing Champion + Mystery, returning to City 9 hubs the player into Crucible / Boss Arc / Frontier. The cities themselves don't acknowledge the victory. Professor doesn't say "Welcome back, Champion." Guides don't change banter.

**Fix:** Add a `POST_HOF_CITY_QUOTES` pool keyed by `sm.gymCleared[8]`. One line per facility ("the league still talks about you", "they retire the badge if no one rivals it in five years") is enough to make the world feel alive after the credits.

### 2.4 Dialogue repetition risk

- `RIVAL_PROGRESS_PRIMARY_QUOTES` has only 5 lines — 4 rival fights will see at least 1 repeat per run.
- `TRAINER_QUOTES` Basic Trainer pool: 6 lines for ~12 mid-game basic fights → expect to see each line twice.
- Gym Leader victory flavor is per-leader (28 leaders, 1 line each — `LEADER_VICTORY_LINES` at `:28223`) which IS personalized. Good.

**Fix:** Add 3–5 more lines to each rival phase and Basic Trainer pool. Cheap polish.

### 2.5 Storyline variants are thin

- `classic`: base.
- `second_sun`: rival 1 badge ahead, slightly amber tone-class on UI.
- `radio_silence`: dark/creepy tone, Buried Alive identity for Mystery Figure, cold-open sprite swaps.
- `crimson_clade`: underdeveloped in shipped code (per agent recon).

A player who replays through all four sees ~15–20 unique lines per variant and the same 67 events in the same order. **Replayability is mostly cosmetic.**

**Fix:** Either commit to deeper branching — give `radio_silence` a fifth gym leader replaced with a horror-theme custom encounter — or rename the variants as "Difficulty Tones" rather than "Storylines" so the marketing doesn't oversell. Cosmetic-plus is fine; cosmetic-plus pretending to be branching is a trust drain.

### 2.6 Onboarding teaches actions, not theory

`STORY_TUTORIAL_SCENES` (`:34791`) gates 8 just-in-time scenes (first-trainer, first-wild, first-mart, first-safari, first-power-up). Each covers PP / type / crit / catch odds / item budgeting.

What's NOT taught:
- EV / IV system. Player runs through the whole game without knowing why one mon hits harder than another with the same level.
- Type matchup *as a network* — single super-effective pings get mentioned, but not "fast Ground beats Electric beats Flying beats Bug beats Psychic" web-thinking.
- Hard mode's specific changes (stat mult? AI depth? gold rate?).
- Difference between "Crucible" and "Battle Frontier" (see UI section).

**Fix:** Add a "Mechanics Codex" entry under the existing Pokédex/Collection screen — pure-text explainer for each system, surfaced from the relevant tutor screen with a "Learn more" link.

### 2.7 Mystery Figure variant outros land well

`_variantChampionDialogue`, `_variantMysteryOutro` (lines `:28502, :28553`) ship variant-specific outros. They're written with character voice. Keep the pattern; extend it to rival arcs (see 2.1).

---

## 3. UI

### 3.1 Battle menu / shop / PC buttons lack `aria-label`s

Critical interactive elements (FIGHT/BAG/SWITCH, party slots, shop buy buttons) have no aria labels. A screen reader user can't tell FIGHT from BAG.

**Fix:** Add `aria-label` to all `.battle-menu-btn`, `.party-slot`, and shop list buttons. Lines `:3004-3042` (battle menu) and `:7860+` (shop UI) per recon.

### 3.2 Low-contrast secondary text

- `.stat-mini-label { color: #888; }` at `:412` on a `#1a1a1a` surface ≈ 3.0:1 ratio. Fails WCAG AA for small text.
- `.sum-detail-lbl { color: #888; }` at `:559`.
- `#rotate-overlay p { color: #aaa; }` at `:3350`.
- Tooltip help text `color: #aaa` at small font sizes (lines `:9975, :10005, :10037`).

**Fix:** Push `#888` → `#bbbbbb`, `#aaa` → `#e0e0e0`. Single-pass CSS edit.

### 3.3 No "always show numeric HP" accessibility toggle

HP is communicated via colored bar (green / yellow / red) only. Colorblind players (especially deuteranopia, ~7% of male players) can't tell low-HP red from full-HP green.

**Fix:** Settings → Accessibility → "Always show numeric HP". Implementation: replace bar fill % with `${cur}/${max}` text overlay when enabled.

### 3.4 No predicted-damage / hit-chance display

Move tiles show PP and Accuracy (good), but not predicted damage for the current matchup or final hit chance after accuracy/evasion stages. The information the AI uses to pick moves is hidden from the player.

**Fix:** Add `[dmg ~38–46 / ~92% hit]` next to move name on the tile when the player is on Easy / Normal. Hide on Hard / Challenge as a difficulty toggle.

### 3.5 Hover affordance inconsistency

Battle command buttons and story action buttons have clear `:hover` states. Party slots (`:425`) and summary tabs (`:529`) have very subtle ones (border darkens by one shade). PC/Tutor inline selects have none.

**Fix:** Standardize on one hover treatment (e.g., `outline: 2px solid var(--accent);` on focus + 1.05× scale on hover) and apply via a `.is-tappable` utility class.

### 3.6 First-time terminology hits a wall

"Crucible" / "Frontier" / "EV" / "IV" / "Nature" / "Gimmick" / "Tier" — none are explained at first encounter. A new player sees "Battle Dojo" and has no idea why they'd visit it.

**Fix:** Per-screen first-visit toast: "Move Tutor — teach new moves from this Pokémon's learnset for a gold cost." One sentence, one time. Persist a `sm.firstVisit.tutor = true` flag.

### 3.7 Save / load UX has no recovery affordances

Save corruption silently nukes the run (BUG-005). No export / import. No "view current save JSON" devtool for power users.

**Fix:** Settings → "Export save" button that copies `pbs_story_save` to clipboard. "Import save" that pastes back. Reduces "lost run" support load.

### 3.8 Forced landscape with no fallback

`#rotate-overlay` (`:7387`) hard-locks portrait. The game refuses to render in portrait at all on phones <768px wide.

**Fix:** At minimum, allow read-only screens (collection, settings, Pokédex) in portrait. Battle / shop can still require landscape.

### 3.9 Pokémon Fan Club is a flavored Pokémart with extra steps

The Fan Club sells vitamins. Vitamins are also in regular Pokémarts. The Fan Club differs only in flavor.

**Fix:** Either give Fan Club a unique vendor (e.g., Bottle Caps for hyper-training IVs, or a per-mon mood meter), or fold it into the regular shop and rename it to a flavor item ("the local trainer hangout").

---

## 4. UX

### 4.1 Boot loading has no progress feedback

2–5 second boot with a spinner saying "Loading Pokédex & moves…". Player has no idea if it's hung. See BUG-015.

**Fix:** Stage the message: "Loading species (1/4)…", "Loading moves (2/4)…", "Loading builds (3/4)…", "Initializing UI (4/4)…".

### 4.2 Save throttle masks confirmation

Auto-save runs every ~3 s but the "Saved" toast is suppressed until `sm.active`. Early gameplay actions (picking a starter, naming the trainer) don't show confirmation. The player has no feedback that their progress is persisted.

**Fix:** Show one confirmation toast on the first save of a run, regardless of `sm.active`.

### 4.3 Battle Frontier ladder is opaque

Frontier runs are endless ladder. Mid-run, no UI shows what battle number the player is on or what the current best is.

**Fix:** Persistent `Frontier 12 / Best 18` overlay. Surrender button shows "End at battle 12 (best: 18)" so the player understands the trade.

### 4.4 No "skip dialogue" affordance during cold-opens

Players replaying the game watch the same intro every time. With ~4–6 cold-open scenes per run, this stacks up.

**Fix:** Settings → "Skip seen cold-opens" toggle. Track shown scenes in `sm.meta.shownColdOpens`.

### 4.5 Difficulty preset lacks explanation in the picker

The setup screen lets the player pick veryeasy → challenge but doesn't describe what changes. Player picks "Hard" and discovers organically that foe stats went up. They don't know AI didn't change.

**Fix:** Tooltip on each preset listing the deltas: "Hard: foes have +15% stats, gold rewards −30%, AI unchanged." Transparency wins.

### 4.6 Error messages dump raw exceptions

"Could not create online room: " + `e.message` (`:14626`) prints internal JS errors like "Cannot read property 'xyz' of undefined" to the player.

**Fix:** Catch internal errors at the boundary, log to console, show "Online room failed — please retry. (Code: ONLINE-001)". The code lets support correlate, the wording doesn't terrify.

### 4.7 No quick-restart from game-over screen

Player loses a story battle, takes the gold-retreat option. The game returns to City. To re-roll the same fight, the player has to navigate back to the route. Friction.

**Fix:** Game-over screen → "Retry this battle (cost: 200 g)" button right next to "Retreat to city".

### 4.8 No surrender mid-battle

Once a battle starts, there's no way to surrender. The player can only swap, run (some battles), or play through. For obviously-lost fights this adds wasted turns.

**Fix:** Battle menu → "Concede" with a 2-tap confirmation. Pays full retreat fee.

---

## 5. Performance & Optimization

### 5.1 Boot loads 1380 species + 954 moves + 583 items + 314 abilities up front

All data is fetched and parsed regardless of which gens the player has enabled. For users on slow connections / older devices this is wasteful.

**Fix:** Split `species.json` into per-gen chunks; load only enabled gens at boot, lazy-load others when the player toggles them on. Same for `moves.json`. Could halve boot time for gen 1–3-only players.

### 5.2 `battle.html` is 48,473 lines (3.2 MB raw)

The entire game is one HTML file with one `<script>` tag. The browser parses 3 MB of JS on every page load, even when the player only wants to check the settings.

**Fix:** Split the file into:
- `index.html` (menu only)
- `battle-engine.js` (combat, lazy-loaded when entering a battle)
- `story-mode.js` (lazy-loaded when entering story mode)
- `data-loader.js` (lazy-loaded)

This is multi-week work but pays off for every player going forward.

### 5.3 Confusion/trap/thaw/harvest RNG migration is incomplete

48 of 295 `Math.random` calls were migrated to `storyRngNext`. The rest still run unseeded mid-battle (BUG-003). Fixing them in one pass is straightforward — define `const __rng = (sm && sm.active) ? storyRngNext : Math.random` at engine entry and replace `Math.random()` throughout. **First fix BUG-002** so the references resolve.

### 5.4 jsdom harness boots cleanly in ~3.5s — fast enough for CI

Add `npm test:e2e` script running `story-walkthrough.mjs + story-combat.mjs + story-variants.mjs` and wire into CI. The three together complete in <30s and catch the IIFE-scope class of bugs immediately if a regression introduces another `_loadOpAbilities` situation.

### 5.5 SAVE_VER migration chain runs every load

If the player has SAVE_VER=15 saved, every load runs `migrateStoryPreV16, V17, V18, V19` in sequence. Linear cost; fine. But: there's no consolidation — once a save is at SAVE_VER=19, the old migrations are dead code (still parsed but never called from a fresh save).

**Fix:** Document a deprecation policy. After 6 months at v19 stable, drop migrations < v17.

---

## 6. Upgrade / Feature ideas (prioritized)

These are concrete proposals beyond "fix the bug list". Ranked by impact-per-cost.

### P0 — Ship-blocking (do before any 1.0 stamp)

1. **Fix BUG-001 + BUG-002 (IIFE scope)** — Move `storyRngNext`, `_loadOpAbilities`, `_opAbilitiesCache` out of the IIFE or expose them on `window`. Two-line fix per identifier. **Highest priority.**
2. **Fix BUG-005 (save corruption)** — Add `pbs_story_save.broken` backup and "Copy save to clipboard" recovery affordance.
3. **Fix BUG-003 (RNG hygiene)** — Migrate the remaining ~247 `Math.random` calls to `storyRngNext` when `sm.active`. Eight-hour mechanical pass once BUG-002 is fixed.

### P1 — Visible polish (low risk, high perceived value)

4. **Add rival win/loss-aware dialogue** (BUG-010). New string pools + a 3-line picker change. Players will feel the rival actually rivals them.
5. **Mystery Figure foreshadow lines** (BUG-011). 24 lines total. Adds zero mechanics cost; turns a random reveal into a payoff.
6. **Post-HoF dialogue acknowledgment** (2.3). One line per facility per city.
7. **Loading progress staging** (BUG-015). Five-string change.
8. **Mechanics codex** (2.6). One-screen text page accessible from settings + tutor screens.
9. **Accessibility pass:** aria-labels on battle/shop/PC buttons (3.1), color-contrast bumps (3.2), numeric-HP toggle (3.3).

### P2 — Replayability deepening (medium risk, large impact)

10. **Storyline variant differentiation** — `radio_silence` should swap a gym leader for a horror-theme custom encounter; `second_sun` should swap one Elite Four member for a sun-team specialist. Without this, variants are cosmetic.
11. **Mid-game pacing fix** (BUG-012) — `1.025×` GL5, `1.05×` post-GL5 rival, plus introduce one new mechanic per region.
12. **Difficulty preset transparency** (4.5) — tooltip with deltas + AI-depth coupling.
13. **Surrender mid-battle** (4.8) — battle menu button + confirmation flow.
14. **Save export / import** (3.7) — clipboard-based.

### P3 — Engine modernization (multi-week)

15. **Split `battle.html` into modules** (5.2). Pays back forever.
16. **Per-gen data lazy-load** (5.1). Halves first-paint for filtered runs.
17. **AI deepening** (4.5 + BUG-004) — 2-ply lookahead for Hard, KO-shot priority bonus.
18. **Per-trainer-class personality** (per agent-state HANDOFF.md Phase B notes) — Hiker always Rock, Veteran always T3+, etc.
19. **Move-quality scaling for build tier** (HANDOFF.md Phase B) — T1 mons use level-up moves only, T2 level-up + TMs, T3+ full Smogon pool.

### P4 — Stretch / experimental

20. **Inspector tier badge on foe summary card** — `build.powerTier` is already stamped, just unsurface it. Helps players understand the curve.
21. **Daily seed mode** — one seed per UTC day, leaderboard for clear-time. Reuses the existing `runSeed` infrastructure. Free competitive content.
22. **Replay system** — record `storyRngNext` calls per turn, replay to reconstruct a run. Massive QA value too (capture player crashes and replay them).
23. **Speedrun mode** — auto-skip all dialogue, condensed shop/screens. Gates open with a timer.
24. **Variant-mixing** — Run with classic Storyline but radio_silence Mystery Figure. Increases replay variance with zero new content cost.

---

## 7. Quick-win checklist (a single afternoon)

If you have one afternoon and want maximum visible improvement:

1. Fix BUG-001 (`_loadOpAbilities`). Move declaration out of IIFE OR expose via `window.StoryMode._loadOpAbilities`. (~10 minutes)
2. Fix BUG-002 (`storyRngNext`). Same. (~10 minutes)
3. Bump three CSS color values: `#888`→`#bbb`, `#aaa`→`#e0e0e0`. (~5 minutes)
4. Add aria-labels to 3 button classes: `.battle-menu-btn`, `.party-slot`, `.shop-buy-btn`. (~15 minutes)
5. Stage the boot loading text (BUG-015). (~10 minutes)
6. Add export-save / import-save buttons to settings. (~30 minutes)
7. Add "skip seen cold-opens" toggle. (~20 minutes)
8. Add 3 more lines to each rival phase pool. (~15 minutes)
9. Add a single first-visit toast to the Crucible button. (~10 minutes)

Total: ~2 hours. Visible delta: large.
