# Play-Test Report — Pokémon Arena (v1.2.1)

**Date:** 2026-05-26
**Branch:** `claude/dazzling-clarke-x2dZi`
**Tester method:** automated "autopilot" play-through in **real headless Chromium 141** (drives the live UI, screenshots every screen, captures runtime errors) + a deterministic **jsdom engine harness** + **4 specialist read-only auditors** (battle engine, story mode, accessibility/UX, performance).

This report combines hands-on play (what a tester clicks through and sees) with deep code-level audit (what only shows up under instrumentation). Each finding notes its **source** and **confidence**.

---

## 1. How it was tested

| Track | Tooling | What it covers |
|---|---|---|
| **Live play-through** | `scripts/debug/autopilot.mjs` → Chromium 141 (`/opt/pw-browsers/chromium-1194`, launched via `executablePath`) against the dev server | Real UI: boot, menus, settings, trainer creation, starter pick, city, battle start, facilities, Pokédex. 20 screenshots/run. |
| **Engine harness** | `tests/helpers/load-engine.js` (jsdom, seeded RNG) | Deterministic battle mechanics, story state, save migrations. |
| **Specialist audit** | 4 sub-agents → `agent-state/findings/*.md`, `agent-state/ISSUE_LEDGER.md` | Damage formula, status, AI, story timeline, a11y, perf. |

**Environment caveat (important for triage):** this sandbox blocks outbound HTTPS (TLS interception → `ERR_CERT_AUTHORITY_INVALID`). So everything the game pulls from a CDN — **anime.js, the Pokémon sprite fallback, @pkmn/dex, Supabase** — was unavailable, i.e. the run effectively tested the **offline / restricted-network** path. Most `ERR_CERT` console errors are *environment noise, not bugs*, but they also exposed real **offline-resilience** gaps (below). Pixel-level rendering was reviewed via screenshots, not pixel-diffing.

**Coverage reached:** Main menu → Settings → Story menu → New Adventure → trainer creation (name/difficulty/storyline/sprite) → cold-open intro → **Professor starter pick (got Wurmple)** → first battle (auto-resolved) → **Catch Tutorial (wild Gimmighoul)** → toured all 8 city facilities → Pokédex. Screenshots in `docs/playtest/`.

---

## 2. Verdict

The game is **in good shape and genuinely fun to navigate** — the retro UI is clean and readable, the early-game flow is coherent, and the **battle engine is mechanically correct** (damage, status %, turn order, AI targeting, RNG determinism all verified). Save migrations (v8→v21) round-trip cleanly. No crashes or hard soft-locks were hit in normal online play.

The issues worth fixing cluster into three buckets: **(a) one real catch soft-lock**, **(b) a recurring "row-id vs array-index" bug** in the story timeline, and **(c) offline/PWA resilience** (CDN-only anime.js + incomplete local sprites) — which matters because the app actively promotes "Add to Home Screen for a full-app experience."

---

## 3. Bugs & issues by severity

### P1 — High

**P1-1 · Master Ball is wasteable → post-game "Caged God" soft-lock**
*Source: story-mode audit (confirmed, jsdom repro).* `catchThrow` (`battle.html:~45155`) decrements the unique Master Ball like any ball; it's granted once post-HoF (`~48863`) and never re-granted. Throw it at a Crucible/roaming wild and the **Caged God** (forced `catchRate:0.01`, no guaranteed catch) becomes effectively uncatchable. **Fix:** make the Master Ball non-spendable except on the gated target, or re-grant it at the cage.

**P1-2 · Sleep wake-check off-by-one (mon can act the turn it's put to sleep)**
*Source: battle-engine audit (confirmed, deterministic repro).* `applyStatus` rolls `sleepDuration ∈ {1,2,3}`, but `canMove` (`battle.html:25408`) pre-increments `statusTurns` then wakes on `>=`, so a roll of 1 (~⅓ of sleeps) = **0 turns asleep — the mon attacks the same turn**. Effective lost-actions {0,1,2} vs the intended {1,2,3}. Repro: seed a battle, sleep the foe, it wakes *and* attacks turn 1.

**P1-3 (offline) · anime.js is CDN-only with no local fallback → battle controls may not appear offline**
*Source: live play (verified fact) + observed symptom (confidence: medium).* `battle.html:7852` loads anime.js **only** from `cdn.jsdelivr.net`; offline → `window.anime` is `undefined`. In the restricted-network run a story battle **initialized** (log showed "Wurmple sent out / Delibird sent out") **but the player input controls — the FIGHT command and the move menu — never became visible** (`#move-menu` stayed `hidden`/empty, `[data-cmd="fight"]` not visible), leaving the battle un-drivable by hand (`__devAutoWinBattle` still resolved it). This is consistent with an anime-gated intro-reveal step failing when anime is absent, but I could not fully isolate anime as the sole cause. **Fix + verify:** bundle anime.js locally (and/or guard every `anime(...)` call) so offline/PWA play works, then confirm controls appear.

### P2 — Medium

**P2-1 · Intro Rival fields fully-evolved Pokémon (should be basics-only)**
*Source: story-mode audit (confirmed).* `_storyEvoStageCapForRow` (`~33074`) passes a **row ID** into `cityIndexFromEventIndex`, which expects an **array index** — id 68 → "City 9" → evo cap 2 instead of 0. The very first rival fight can show fully-evolved mons. Part of the **row-id ≠ index** theme (see §6).

**P2-2 · City 3 always displays "City 3", never its themed name**
*Source: story-mode audit (confirmed).* `GYM_CITY_LEADER_EVENT` (`~39601`, `~38770`) returns an array index, but `sm.trainerAssignments` is row-ID-keyed; only GL3 mismatches (index 17 vs id 18), so the 3rd city/leader label falls back to the generic name.

**P2-3 · Battle Frontier hub understates real difficulty**
*Source: story-mode audit (confirmed).* `_renderFrontierHub` (`~43747`) advertises HP ×1.35→2.50 / bulk ×1.20→1.80, but `applyStoryLeagueFoeStatBoost` (`~32316`) actually applies ×1.50→3.00 / ×1.25→2.00. Round 21 shows ×2.35 but fights at ×3.00 — players walk in under-prepared.

**P2-4 · "Add to Home Screen" tip banner overlaps modal content / blocks the Settings button**
*Source: live play (confirmed in screenshot).* The persistent install tip is pinned to the bottom and **overlaps the bottom of the Settings modal** (hides the "PvP battle items" row), and in one run its overlay **prevented opening Settings (⚙) from the main menu** until dismissed. The dismiss (`#pwa-hint-dismiss`) also fired inconsistently between runs. **Fix:** reserve layout space for the tip or make it non-overlapping/auto-timeout.

**P2-5 · anime.js move-FX ignores `prefers-reduced-motion`**
*Source: a11y audit (confirmed).* `showMoveEffect` (`battle.html:12598`) gates the heaviest motion (particle bursts/beams/lunges) only on `settings.animations`, never on `prefers-reduced-motion`. The global CSS `*{animation-duration:1ms}` catch-all (L6694) only covers CSS keyframes, not anime.js's RAF inline-style animation. Root cause: `settings.animations` defaults to `true` and is never seeded from `prefers-reduced-motion` (`:10824`).

**P2-6 · `loadGameData` boot parse ~308 ms (target ~200 ms)**
*Source: perf audit (measured, median of 5+).* 2.6 MB `builds.csv` + `op-abilities.json` are parsed **eagerly at boot** (`battle.html:9636`, CSV at `:9743`). Defer to first use. (Live boot also showed a multi-second "Loading move sets" overlay on warm reload, and intermittent `"Failed to load data files! TypeError: Failed to fetch"` from a remote-first attempt that recovers via local fallback — noisy but non-fatal.)

**P2-7 · Linear heap/DOM growth across a long session (~0.275 MB/battle)**
*Source: perf audit (measured, R²=0.983 linear — a drip, not a runaway leak).* ~52 sprite-container nodes retained per battle (`battle.html:16854`). Caveat: partly harness-shaped (the anime stub's `.remove()` never fires); size the real slice with animations on.

### P3 — Low / polish

- **P3-1 · PC dialogue says "ten slots" but the cap is 30.** *(live play — confirmed in screenshot.)* Nurse Joy: *"Upstairs is the PC: ten slots of cold storage"*, while the UI shows **PC 0/30**. Stale dialogue text. (`06-poke-center.png`)
- **P3-2 · Mystery Figure climax has zero gimmicks if all 4 mechanics are disabled at run start.** *(story audit.)* `rollMysteryFigureFinalBossTeam` (`~34631`) — forced `_mechCtx` settings are dead-coded behind the `unlockedGimmicks` AND-gate.
- **P3-3 · Basic-Trainer build tier collapses to Gym-Trainer tier at Stage 2.** *(story audit.)* `_storyBuildTierForEvent` (`~33847`) — redundant `b>=2` branch should be UNTRAINED.
- **P3-4 · Eggs count against the catch/party cap but not foe-size matching.** *(story audit.)* `_catchHandleSuccess` (`~45261`) uses `_storyCountFighters()` for sizing but counts eggs as "full".
- **P3-5 · Incomplete local sprite set → broken Pokémon sprites offline.** *(live play — confirmed.)* `getSprite` is local-first with a Showdown/PokeAPI **CDN fallback** (`:12770–12772`); species without a bundled sprite show broken-image placeholders offline. Visible in the starter screen: **Wurmple & Bunnelby broken, Diglett OK** (`03-starter-select.png`).
- **P3-6 · `handleSpriteError is not defined` at boot.** *(live play.)* A static-HTML `<img onerror="handleSpriteError(this)">` can fire before the script that defines it (`:12785`) runs.
- **P3-7 · Non-deterministic story-start sequence.** *(live play.)* Across runs, the cold-open "Begin →" was sometimes absent and `StoryMode.state.active` sometimes read `false` even though events/gold advanced — the boot data-load race appears to bleed into the start flow.
- **P3-8 · Keyboard/SR polish.** *(a11y audit.)* Mobile move-info "i" is a click-only `<span role=button>` with no `tabindex`/`keydown` (`:18146`); status pill sets `role=status`+`aria-label` on a `<div>` at mutation time (`:16809`); `#gauntlet-score` has no `aria-live` (`:9010`).
- **P3-9 · `parseMoveEffects` re-allocates 19 `Set` literals per call.** *(perf audit — warm cost is fine ~0.01 ms; hoist to module scope.)* `:25463`.

---

## 4. What works well (a tester's "ship it" notes)

- **UI is clean, legible, and on-theme.** Settings, trainer creation, the Professor's lab, Nurse Joy, and the Safari warden all render crisply at phone-portrait (430 px). Difficulty (5 tiers) and storyline (8 options incl. "Mature"/"Pasta" horror routes) selection is rich and clear.
- **Battle engine is correct.** STAB applied once, type immunities → 0, crit 1.5×, burn halves physical only, paralysis 25%/−50% speed, poison ⅛, toxic n/16, priority brackets, Trick Room inversion, speed-tie coin-flip, Pursuit-on-switch — all match Showdown. AI zeroes immune moves and switch-scores the whole party (verified: picks Rock Slide over an immune Earthquake).
- **RNG is deterministic.** A global `Math.random` override (`:32403`) routes story rolls through a seeded LCG; same seed → identical trace.
- **Save system is solid.** v8→v21 migration chain round-trips party/PC/badges with no data loss or throw.
- **Catch / party / PC framing is coherent.** Party cap scales by badges (saw **1/2**, "next slot at badge"); PC cap 30; Safari Zone has a real bait/rock risk-reward loop.
- **Performance is healthy.** 5 ms steady-state turn loop; `parseMoveEffects` ~0.01 ms warm; `rollTrainerTeam` <1 ms; no runaway leak. Prior unbounded caches now have LRU eviction.
- **Accessibility has clearly improved** since earlier audits: global `:focus-visible`, a `prefers-reduced-motion` CSS catch-all, `aria-live` save toast, labeled battle command buttons in logical source order.

---

## 5. Visual / UI-UX evidence (`docs/playtest/`)

| File | Screen | Note |
|---|---|---|
| `01-main-menu.png` | Title / main menu | Shows the "Loading move sets" boot overlay + the install tip banner. |
| `02-trainer-create.png` | New Adventure | Trainer sprite, name field (required), 5 difficulty cards, 8 storylines. |
| `03-starter-select.png` | Professor's Lab | 3 graded starters w/ full builds — **Wurmple & Bunnelby sprites broken** (P3-5). |
| `04-catch-tutorial.png` | Catch tutorial | Wild Gimmighoul, ball odds (Poké 100%). Catch system reached. |
| `05-safari-zone.png` | Safari warden | Bait/rock mechanics, 3× stacking — nicely written. |
| `06-poke-center.png` | Pokémon Center | Party 1/2, PC 0/30 — **dialogue says "ten slots"** (P3-1). |

---

## 6. Root-cause theme worth a dedicated pass

Several story bugs (P2-1, P2-2, and latent ones) share one cause: **`STORY_EVENTS_RAW` row IDs are not array indices** (the intro Rival is array index 1 / id 68; rows are swapped). Multiple consumers conflate the two. A single helper that always converts row-id ↔ index (and an audit of every `cityIndexFromEventIndex` / `*FromEventIndex` caller) would retire this whole class.

---

## 7. Not covered / next steps for the autopilot

- **Hand-driven battle turns** were blocked by P1-3 (controls didn't appear offline). Re-test on a machine with internet (anime.js present) or after bundling it.
- **Catch throw, gym battles, evolution, training application, PvP** not yet automated — `proceedToNextBattle` marches the *battle* path but the autopilot doesn't yet throw balls at catch events (where it stalled, at the Gimmighoul tutorial) or drive gym arcs.
- Suggested autopilot v2: handle the catch tutorial (throw Poké Ball), drive a full gym, exercise a training facility end-to-end (EV trainer → verify EVs), and assert on-screen reward/badge deltas.

---

## 8. Recommended fix order

1. **P1-1** Master Ball soft-lock (data-loss risk for the post-game goal).
2. **P1-2** Sleep off-by-one (affects every battle with a sleep move).
3. **P1-3 / P3-5** Offline resilience: bundle anime.js + fill the local sprite set (the app sells itself as installable/offline).
4. **P2-1/P2-2 + §6** Row-id vs index pass.
5. **P2-3** Frontier difficulty display.
6. **P2-4** Tip-banner overlap.
7. The P2-5/P2-6/P2-7 + P3 polish list.

---

*Artifacts: live transcript & all 20 screenshots in `agent-state/playtest/` (gitignored, regenerable via `node scripts/debug/autopilot.mjs`); full finding files in `agent-state/findings/`; aggregated `agent-state/ISSUE_LEDGER.md`.*
