# Story Mode — Player-Experience Clarity Audit (Findings)

> Generated 2026-05-28. Read-only investigation; no gameplay code changed yet.
> Method: ran the existing **`scripts/debug/story-playthrough.mjs`** harness (real
> headless Chromium, full C0→C9 + post-HoF timeline, 90 screenshots in
> `screenshots/playthrough/`, structured log in `agent-state/playthrough/`), then
> read the guidance code directly (`renderCityActions`, `STORY_TUTORIAL_SCENES`,
> `STORY_COLD_OPENS`) and cross-checked against `docs/PROGRESSION_CURVE_MASTER.md`
> §3.1 and `agent-state/ISSUE_LEDGER.md`. Line numbers drift — symbol names are the
> durable anchors.

---

## 1. The thesis holds

The tester complaint — *"hard to know what to do, when, what's happening, and why"* —
is **not** a missing-feature problem. The opposite: Story Mode has **three+ separate
guidance systems that each work in isolation but render on top of each other**, were
added at different times (v17→v20 accretion), and **partition the player's "what next"
differently**. The player isn't under-guided; they're **over-guided by mutually
inconsistent layers**, which reads as noise.

The single clearest evidence is the **City 0 (first screen a new player ever sees)** —
`screenshots/playthrough/007-city-City0.png`. On one phone screen it shows, top to
bottom:

| # | Element | Says | Source (`battle.html`) |
|---|---|---|---|
| 1 | Prof. Oak dialogue box | "Hometown… the only road that goes north." + flavor quote | `renderCityActions` 42783–42796 |
| 2 | Tip chip (urgent) | **"Required: Visit the Professor"** | 42820–42826 |
| 3 | Tip chip | **"Next: 🏁 Marnie — starter duel at the gate"** | 42837–42866 |
| 4 | Tip chip | **"Claim your free relic!"** | 42894–42896 |
| 5 | Briefing banner | **"🔴 Visit before leaving — IN THIS ORDER: 1. Pokémart 2. Move Tutor 3. Relic Annex 4. Artifact Hall 5. Bag"** | 43237–43247 |
| 6 | Section header | **"NEXT STEP (2)"** | `_emit('quest',…)` 43249 |
| 7 | Primary button | **"Professor — Pick Your Starter (FREE)"** | 42962–42965 |

Seven guidance affordances, **four of which are "what to do next" and disagree:**

- The **numbered "in this order" list (#5) does not contain the Professor** — yet the
  Professor is what's "Required" (#2) and the primary button (#7), and is the *actual*
  gate to leave town (`routeBlockedByProfessor`, 43002/43015). So the one list that
  claims to give the order omits step 1.
- **"NEXT STEP (2)"** — the `(2)` is a *button count* from `_emit`/`_sectionCount`
  (43224–43229), but it reads like "step 2 of N." There is no visible step 1.
- **"Required" (chip), "Next" (chip), "NEXT STEP" (section), and the numbered banner**
  are four names for overlapping ideas, rendered as four different widgets.
- Relic terms appear **three times in three sections**: "Claim your free relic" (tip) →
  "Relic Annex" (Shops, `enterArtifactShop`, 43117) → "Artifact Hall" (Connect & Bag,
  `enterArtifactHall`, 43158). They are two distinct facilities (Annex = *buy a
  permanent rule*; Hall = *toggle rules on/off*) but nothing on screen distinguishes them.

This same `renderCityActions` stack repeats in every city (C0–C9), so the noise is
constant, not just a first-screen problem.

---

## 2. Root causes (not symptoms)

**RC-1 — Three parallel "what-next" systems with no single source of truth.**
`renderCityActions` composes all of: (a) the **tip rail** ("Required:" + "Next:" chips,
42818–42941, capped at 4), (b) the **numbered briefing banner** ("Visit before leaving —
in this order", driven by `_pendingFacilityIntrosHere` 43396, 43237–43247), and (c) the
**"Next Step" button section** with its misleading `(N)` count. Each was a reasonable
local addition; together they contradict.

**RC-2 — The objective and the gate are computed twice, independently.** The visible
"order" (briefing banner = facility intros only) and the real leave-town gate
(`routeBlockedByProfessor` → then `routeBlockedByIntros`, 43002–43019) are derived
separately, so the banner can list items that are actually gated behind something it
doesn't mention (Professor on C0). "Why can't I leave?" has no single honest answer.

**RC-3 — Naming drift inside the guidance layer itself.** Same concept, different words
on the same screen: relic/artifact (×3), and "Required / Next / Next Step / in this
order" (×4). Violates the most basic consistency heuristic right where the player is
trying to orient.

**RC-4 — Narrative layers disagree with state.** The boot cold-open hardcodes a
**gendered** professor — *"The starter on **her** bench"* (42597) and *"the next
Professor opens **her** bench"* (42641) — while the professor is assigned per run by
`cityProfessorHubSlot` and is shown as e.g. **Prof. Oak** (male). A sibling line already
does it correctly: *"The starter on **the** bench"* (33849). The layers were written at
different times and never reconciled.

**RC-5 — Onboarding teaches *actions*, never *theory*.** 18 `STORY_TUTORIAL_SCENES`
(`firstTrainerBattle, firstWild, firstMart, firstColress, firstCableLink, firstStoneSage,
…`, 40094+) each teach *how to use a facility*. Nothing ever explains the axes the entire
game runs on — **EV/IV, the type-effectiveness network, what a difficulty setting changes,
or Crucible-vs-Frontier** (confirms PROGRESSION_CURVE_MASTER §3.1 F1). The player wins
without ever being told *why* one mon out-hits another. ("What's happening / why.")

**RC-6 — Transient overlays can stack / collide.** Empirically: in a between-city scene
(`060-city-City6.png`) a bright **"Continue →" renders on top of the three narrative
choice buttons**, partially covering them; during a transition (`086-…png`) two text
layers overlap ("MAIN STORY 6" + league prose bleeding behind the rival-scene title).
Corroborates ledger **ISSUE-015** (proceedToNextBattle re-entry stacks duplicate
cold-open overlays). "What's happening" is literally rendered twice at once.

**RC-7 — A teaching beat is mistimed (F2).** Gimmicks **unlock at GL5 / badge 5** but the
lab that explains & equips them (**Colress**) debuts a full city later at **C6**; the
player holds an unusable unlock for a stage. Minor but real.

### Secondary engineering noise observed (not clarity, but caught en route)
- **`[Story] BOSS_CONFIGS init failed: ReferenceError: sm is not defined`** fires on
  **every** battle start (`startBattle` 16806) — caught as a warning, IIFE-scope issue.
- **`anime is not defined`** on every move when the anime.js CDN is blocked (known
  PT-001, sandbox-only). Both are pre-existing; logged for the maintainer.

---

## 3. Best-practice framing (game design + Pokémon)

**General onboarding/wayfinding principles (industry):**
1. **One source of truth for "what next."** A single objective marker, never competing
   ones. (Quest-tracker design; Nielsen *visibility of system status* + *consistency*.)
2. **Progressive disclosure.** Show only the few choices that matter right now; let the
   rest recede until relevant.
3. **Just-in-time, one concept at a time**, then get out of the way (Portal/Nintendo).
4. **One primary action per screen** with clear visual hierarchy — biggest/brightest =
   the thing to do; everything else is quieter.
5. **Match between the system and the real world** — the reason you can't proceed should
   be the same everywhere it's stated.

**Pokémon-series conventions specifically:** the games guide with a **linear path +
gates**, **NPCs who tell you where to go** ("the Gym's just north"), **town/route names as
a mental map**, the **badge count as the progress clock**, and **one-time tutorial NPCs**
(catching tutorial, Mart intro). They almost never stack multiple objective UIs — "what
next" is usually *one* NPC line plus the open gate. Modern entries (SwSh/SV) added at most
a **single** one-line objective reminder.

**Convergent conclusion:** collapse to **one objective signal + one categorized facility
list + just-in-time one-liners**, and let **gating + the NPC line** carry the rest. This
is simultaneously the industry best practice (single source of truth, progressive
disclosure, minimal chrome) and the Pokémon-authentic pattern (NPC + linear path + badge
clock). It is also the *minimalist* direction the brief asks for.

---

## 4. Recommended direction (pending maintainer design calls)

1. **One objective line.** Replace the Required-chip + Next-chip + numbered banner +
   "Next Step (N)" with a **single, always-honest "▶ Next:" line** that names the one most
   important action and is the *same* source the leave-gate uses (kill RC-1/RC-2). Demote
   the rest of the tip rail to *optional* suggestions, visually quieter.
2. **Plain facility list.** Keep the categorized buttons (Heal & Team / Train / Shops /
   Connect & Bag) but drop the misleading "Next Step (N)" count and the duplicate banner.
   Facilities keep their existing "New / ✓ / Required" pills (those already work and agree
   with the gate).
3. **One name per concept.** Resolve relic/artifact and the objective vocabulary (RC-3).
4. **Reconcile narrative with state.** Make the intro professor line gender-neutral (or
   keyed to the assigned professor) (RC-4).
5. **Add the missing *theory* one-liners** (EV/IV, type network, difficulty, Crucible vs
   Frontier) as single just-in-time toasts — no heavy codex (RC-5), unless you want one.
6. **Fix the overlay collisions** (RC-6) and the `BOSS_CONFIGS` scope warning (pure
   engineering).

Items 4 & 6 and the `BOSS_CONFIGS` warning are **pure engineering / copy** and safe to do
directly. Items 1–3 and 5 are **design calls** — see the maintainer questions.

---

## 5. Resolution — what shipped (maintainer approved all recommended options)

Maintainer chose: single objective line · merge Relics into one facility · just-in-time
one-liners · do all buckets now + a Phase-3 review.

| Commit | Change | Verified |
|---|---|---|
| 1 | **Engine-scope boss hookup + neutral professor intro.** `startBattle`/turn-loop reached the StoryMode IIFE's `sm`/`BOSS_CONFIGS`/`_storyBossMechanics*` by bare name (always threw on every battle); rerouted through `window.StoryMode.*`. Intro copy "her bench" → "the bench" (RC-4). | jsdom smoke |
| 2 | **One objective line** replaces the 4 competing signals (RC-1/2/3). `renderCityActions` now renders a single `objective` (sourced from the same gate flags as the buttons) + quiet "Suggested" chips; dropped the numbered banner and the misleading "Next Step (N)" → "Story". | `__renderCityActionsForTest`: City0→[START] Pick your starter; post-starter→[NEW HERE] see Pokémart; gym→[NEXT] Enter the Gym. Visual confirm (screenshot). |
| 3 | **Relics merge** (RC-3). "Relic Annex" + "Artifact Hall" → one "Relics" hub entry everywhere, with a shared Browse/Manage tab bar; `artifacts` dropped from `FACILITY_DEBUT_CITY`; unified all copy. | probe: single button in relic + non-relic cities; both screens render tabs + "Relics" title; no stale strings leak. |
| 4 | **No-levels teaching** (RC-5). Added one line to the `firstTrainerBattle` scene: every battle is Lv50, strength = how a partner is built. | jsdom smoke |

### Two findings the prior reports overstated (corrected here)
- **RC-5 teaching gap is mostly already closed.** Contrary to `PROGRESSION_CURVE_MASTER §3.1 F1` / `DESIGN 2.6`, EV theory *is* taught (`firstEVTrainer` scene), IVs *are* taught (`firstFanClub`), difficulty *is* shown in the picker sub-labels + Run Info, and Crucible/Frontier each have one-time explainer tips. Those reports predate the tutorial-scene system. The minimalist-correct action was therefore **one** targeted line (the genuinely-uncovered no-levels rule), not a pile of redundant tips — which would re-add the very noise this pass removes.
- **RC-6 / ISSUE-015 is already guarded.** `proceedToNextBattle` has a `_storyBattleEntryBusy` re-entry guard (reset on city-return and on battle-open), so duplicate cold-open stacking can't wedge progression. The overlay overlap seen in screenshots was the automated harness force-advancing through scenes, not a player-reachable state. No overlay change made (avoids regression risk).
