# Story Expansion System — Plan

Two-layer architecture for story mode. Replaces the current "8 prose-skin
variants over a shared pipeline + a tacked-on post-HoF Caged God arc"
with a clean **CORE pipeline + EXPANSION layer** model.

This doc supersedes the boss/legendary sections of `STORY_MODE_FLOW.md`
and `docs/STORY_NARRATIVE_VARIANTS.md` where they conflict. Decisions
recorded here are confirmed with the user; "open" items are flagged at
the bottom.

---

## 0. Decisions locked (from brainstorm passes)

### 0.1 Original brainstorm (decisions 1–10)

| # | Topic | Decision |
|---|---|---|
| 1 | Boss aftermath | **No catch** — boss vanishes on KO. Reward is token + consumable drops + cosmetic lore prop (see #20). |
| 2 | Boss loss | Wipe = **retry from the same beat with full heal**. No gold penalty, no progress loss. |
| 3 | Boss danger profile | **Multi-form transformation at HP thresholds** (see §3). Boss is single-action across all phases; at each threshold, boss instantly morphs — new type pairing, ability, moveset, field layer. Replaces the earlier shield-phase draft. |
| 4 | Themed trainer integration | Beats 3 / 6 **replace the existing row's trainer roll**. No new fight rows. |
| 5 | NG+ expansion | **Re-roll random** per new run ("Surprise Me" semantics). Explicit picker still available. |
| 6 | Token scope | Token A = narrative gate. Token B = **trade gate** at Beat 8 → yields canonical Master Ball + closes expansion (see #25). No shop / battle effects. |
| 7 | Pre-boss state | **Auto full-heal** (matches universal game rule). |
| 8 | Boss species reveal | **Hidden on the picker**. Mini-boss revealed at Beat 3 dialogue, big boss at Beat 6 dialogue. Picker shows tier badge + thematic tagline only (no type/species hint). |
| 9 | Post-HoF Mystery Figure | **Stays a trainer fight**. Raid mechanic does not enter the CORE flow. |
| 10 | Difficulty × raid stacking | Final raid stat multiplier **capped at ×1.5**. Hard / Challenge stack until cap. |

### 0.2 Boss-design brainstorm (decisions 11–24)

| # | Topic | Decision |
|---|---|---|
| 11 | Raid shape | **6v1 with shared HP bar across multi-form transformation**. Mini = 2 forms (Phase 1 → Phase 3 at 33% HP). Big = 3 forms (Phase 1 → Phase 2 at 66% HP → Phase 3 at 33% HP). HP does not reset between phases. |
| 12 | Win-feel driver | **Puzzle mechanic** — boss isn't a wall, it's a problem to solve. Player wins when they read the type/ability/field cues and pick the right counter. Inflated HP forces multiple chip rounds; mechanic forces re-planning each phase. |
| 13 | Primary shape | **Transformation arc** — type pairing, ability, moveset, and field layer all change per phase. Boss species stays the same; presentation and mechanics shift. |
| 14 | Phase transition | **Instant morph** at HP threshold — no stun turn, no heal, no opportunity windows. Player keeps initiative; boss just changes mid-fight. Cinematic plays inline. |
| 15 | Roll vs. fixed | **Per-run roll** on: type pairing (2 of N from boss's canonical pool), ability (1 of 3 per phase from themed pool), moves (3 canon + 1 custom per phase). **Locked per boss**: mechanic, arc structure, custom signature moves (lore-named). Moves auto-retype to new pairing each phase (STAB always holds). |
| 16 | Field control | **One field layer per phase** to force re-planning: Phase 1 = weather, Phase 2 = terrain, Phase 3 = hazards. Player can clear/replace but boss re-applies on switch turn. |
| 17 | Arc shape | **Escalation: learn → pressure → desperate**. Phase 1 telegraphs the gimmick, Phase 2 dials it up, Phase 3 goes all-in. Mini-boss skips Phase 2 (compressed arc). |
| 18 | Mini vs. Big | **Mechanically distinct, theme-shared.** Mini and Big share expansion theme but use different gimmicks. Players who learn the mini's trick can't predict the big's. |
| 19 | Telegraph | **Triple-channel**: (a) dialogue hint from boss at transition, (b) animated first-turn ability/field reveal, (c) battle log line in plain English explaining the new mechanic. No hidden state. |
| 20 | Player agency | **Full item + switch access** in boss fights. No "no switching during phase X" gimmicks. Puzzle stays fair. |
| 21 | Cinematic scope | **Full cinematic per phase**: boss sprite palette/posture overlay (not full sprite swap), arena background swap (palette of new typing), music shift (filter on boss BGM), 2–3 in-fight dialogue lines. |
| 22 | NG+ scaling | **+1 mechanic layer per NG+, not larger HP pool**. Replay tests deeper puzzle-solving, not stamina. |
| 23 | Theme→mechanic mapping | **1:1 bespoke per boss**. Every boss's mechanic flows directly from expansion theme (Bone Keepers = death/rebirth, Echoes of Bill = digital corruption, etc.). No shared mechanic pool. |
| 24 | Species selection | **Hand-picked per expansion, fixed.** No alternatives, no NG+ rolls on species. See §5.2 table. |

### 0.3 Expansion closure brainstorm (decisions 25–28)

| # | Topic | Decision |
|---|---|---|
| 25 | Token B endpoint | **Token B is traded** at Beat 8 to a bespoke per-expansion NPC. Trade yields canonical Master Ball + closes expansion story. Replaces the prior "Token B consumed at Beat 8 dialogue" model. |
| 26 | Roaming legendary | **Core-game content, not expansion content.** Already implemented (line 37135+: `_ROAMING_TRIGGERS`, `_storyQueueRoamingFromVictory`, `_showRoamingLegendarySighting`). Per §5.3, mid-game triggers (Gym 5/7) are deleted; single post-Gym-8 trigger fires the wild legendary. Master Ball obtained in Beat 8 is used there. |
| 27 | Trade NPC | **Bespoke per expansion** (lore-named). Bone Keepers = "Grave Warden" (Lavender hub). Project Mewtwo = "The Broker" (existing dialogue). Etc. NPC appears only post-Beat-7, only for that expansion's run. |
| 28 | Expansion epilogue | **Closure screen + dialogue** after trade — per-expansion themed relief beat ("kids are safe, Drowzee is gone" for Hypno's Lullaby, etc.). Then player returns to CORE flow; the existing post-Gym-8 roaming legendary fires when player reaches Victory Road. |

---

## 1. Architecture

### 1.1 CORE pipeline (every run, identical)

```
City0 → wild → trainer → City1 → Gym 1 →
City1' → wild → trainer → City2 → Gym 2 →
... (×8) →
Gym 8 → Legendary Wild → League trainers → League city →
E1 → E2 → E3 → E4 → Champion → Rival → HoF →
Mystery Figure Battle → Mystery Figure Reveal
```

Notes on the CORE delta vs. today:

| Slot | Today | Target |
|---|---|---|
| Roaming legendary spawns | Mid-game after Gym 5 + Gym 7 | **Removed.** Single legendary wild encounter relocated to immediately after Gym 8. |
| "Caged God" boss arc | Post-HoF, gated by 3 broker leads + Master Ball; catch-only with 10× HP | **Removed entirely.** Boss content moves into expansions (mini-boss at Beat 4, big boss at Beat 7). |
| Mystery Figure reveal | Post-HoF Mystery Figure battle (row 67), identity rolls from `MYSTERY_FIGURE_IDENTITIES` (7 entries) | **Kept.** Stays as the CORE finale beat — "rival / professor / future-self" reveal. |
| Legendary wild details | Single-throw catch encounter | TBD — user will spec the post-Gym-8 legendary wild separately. |

### 1.2 EXPANSION layer (one rolls per run)

- One expansion per save. Locked at run start (matches current
  `sm.storyLine` semantics).
- All expansions use the **same 8-beat skeleton**, slotted at the
  **same trigger points** in the CORE timeline.
- Generation-agnostic for **key species**: an expansion's mini-boss,
  big boss, trainer aces, and quest mons appear at their canonical
  species regardless of `sm.settings.enabledGens` (e.g. a Drowzee
  expansion ships a Drowzee mini-boss even if Gen 1 is off).
- Expansions rewrite **NPC dialogue throughout the game** (keeps the
  current `tonClass` + variant prose layer already wired).
- "Surprise Me" picker stays for random roll; explicit pick stays for
  named selection.

---

## 2. The 8-beat expansion skeleton

| Beat | Slot in CORE | Content | Battle? | Item? |
|---|---|---|---|---|
| 1 | City 0 (pre-Gym-1, before intro rival) | Starting dialogue (introduces the expansion's hook) | — | — |
| 2 | City 1 (pre-Gym-1 hub) | Developing dialogue (deepens the hook, hints at the conflict) | — | — |
| 3 | City 2 area (route to Gym 2) | Dialogue + **special trainer battle** (themed 1v1 or 2v2 trainer) | Trainer | — |
| 4 | City 3 → City 4 area (post-Gym-3 / pre-Gym-4) | Dialogue + **mini-boss battle** (6v1 raid) | **Mini-boss** | Receives **Token A** + consumable drop |
| 5 | City 4 → City 5 area (post-Gym-4 / pre-Gym-5) | Dialogue (deliver Token A to the next NPC; new info / quest direction) | — | Consumes Token A |
| 6 | City 5 → City 6 area (post-Gym-5 / pre-Gym-6) | Dialogue + **elite trainer battle** (multi-mon, themed ace) | Elite trainer | — |
| 7 | **Post-Gym-7 / pre-Gym-8** (City 7 hub) | Dialogue + **big boss battle** (6v1 raid) | **Big boss** | Receives **Token B** + consumable drop + lore prop |
| 8 | Just before Gym 8 (City 8 pre-Gym-8 hub) | Bespoke NPC trade interaction + expansion epilogue (see §4.4) | — | **Trades Token B → Master Ball** + expansion marked complete |

After Beat 8 the expansion is over. The player walks into Gym 8 →
**post-Gym-8 roaming legendary wild** (existing system per §4.5, used
with the just-obtained Master Ball) → league with the CORE flow
untouched.

### 2.1 Beat → `STORY_EVENTS_RAW` row mapping

Concrete row IDs in `battle.html:27672+`:

| Beat | Row ID | Row context |
|---|---|---|
| 1 | row 0 (City0) | Fires on first entry to City0, before intro rival (row 68) |
| 2 | row 3 (City1 pre-Gym-1) | Fires on entry to pre-Gym-1 hub |
| 3 | row 8 or 14 (a Basic Trainer slot) | Replaces or augments a Basic Trainer fight to be themed |
| 4 | row 19 (City3 post-Gym-3) or row 22 (City4 pre-Gym-4) | Fires from City3/4 hub action |
| 5 | row 25 (City4 post-Gym-4) or row 28 (City5 pre-Gym-5) | Fires from City4/5 hub action |
| 6 | row 32 (City5 post-Gym-5) or row 42 (Elite Trainer near City6) | Replaces or augments an Elite Trainer fight |
| 7 | row 47 (City7 post-Gym-7) | Fires from City7 post-Gym-7 hub |
| 8 | row 50 (City8 pre-Gym-8) | Fires on entry to pre-Gym-8 hub, before Gym Trainer 1 |

Implementation: beats are **virtual interrupts** (same strategy A as
the route wild system in `STORY_MODE_FLOW.md §2`). They do not get new
`STORY_EVENTS_RAW` rows — they're invoked from existing
`enterCity` / hub render / `proceedToNextBattle` hooks.

---

## 3. Boss battle mechanic (6v1 raid — multi-form transformation puzzle)

Used by Beat 4 (mini-boss) and Beat 7 (big boss). New mechanic — not
in the codebase today. **Replaces the earlier shield-phase draft entirely.**
The shield model treated the boss as a wall; this model treats the boss
as a puzzle the player solves by reading cues and switching counters.

### 3.1 Shape (decisions 11, 14, 17)

- **Player brings their full party** (up to 6 mons, badge-curve capped).
- **Boss is a single Pokemon** with **shared HP bar across all forms** —
  HP does NOT reset at phase transitions.
- **Mini-boss = 2 forms** (Phase 1 → Phase 3 only — skips middle
  escalation; mini introduces a single mechanical hook then cranks it).
- **Big boss = 3 forms** (Phase 1 → Phase 2 → Phase 3 — full
  escalation: learn → pressure → desperate).
- **Form transitions are INSTANT** at HP thresholds (no stun, no heal,
  no free turn). Player keeps initiative; boss morphs and acts on the
  same turn cycle.
- **Player wins** when boss is KO'd in its final form.
- **Player loses** when all party mons are fainted.
- **No catch** — bosses are story creatures. Vanish on KO.

### 3.2 Stat scaling + phase thresholds

| Tier | HP multiplier | Stat multiplier | Level lock | Phase transitions |
|---|---|---|---|---|
| Mini-boss (Beat 4) | ×6 | ×1.25 Atk/SpA/Spe | Lvl 50 (clamped) | **Phase 1 → Phase 3 at 33% HP** (skip Phase 2 — compressed arc) |
| Big boss (Beat 7) | ×9 | ×1.35 Atk/SpA/Spe | Lvl 65 (clamped) | **Phase 1 → Phase 2 at 66% HP; Phase 2 → Phase 3 at 33% HP** |

Defensive stats stay at species baseline. Boss is dangerous because
(a) each phase shifts type matchups so a single-sweeper plan fails,
(b) field layer × ability × moveset combo punishes static comps,
(c) inflated HP forces multiple chip rounds. Final multiplier capped
at ×1.5 per decision #10.

### 3.3 The transformation (decisions 13, 15, 23)

At each phase transition, the boss's **type pairing**, **ability**,
**moveset**, and **field layer** all change. Boss SPECIES stays constant
(it's the same Marowak; it's just transformed).

| Slot | Source per run |
|---|---|
| Type pairing (2 types) | Rolled per run from boss's canonical themed pool (e.g. Marowak: Ground/Ghost/Fire/Rock — themed by expansion). 2-of-N roll, locked at run start. |
| Ability per phase (×3 for Big, ×2 for Mini) | Rolled per run from a themed 3-ability pool per phase. |
| Moves per phase | 3 canon moves (rolled from boss's level-up pool) + 1 **custom signature** (fixed per phase, lore-named). All moves **auto-retype** to the current phase's type pairing — STAB always holds. |
| Field layer per phase | Phase 1 = weather, Phase 2 = terrain, Phase 3 = hazards (decision #16). |

**Locked per boss** (never rolled): mechanic identity, arc structure,
custom signature move names + functions.
**Rolled per run**: type pairings, abilities, 3 canon moves per phase.

### 3.4 The "win-feel" — puzzle mechanic (decisions 12, 19, 20)

The boss isn't a wall to chip through. It's a **puzzle**. The player
wins by reading cues and switching the right mon with the right move.
The "I got it" moment comes mid-Phase-3 when the player figures out
the trick (e.g. *"Phase 3 weather neutralizes my fire mon — I need to
swap to ground and clear the weather first"*).

Three guardrails keep the puzzle fair:
- **Triple-channel telegraph** (decision #19): every phase transition
  fires (a) dialogue hint from boss, (b) animated first-turn ability/field
  reveal, (c) battle log line in plain English explaining the new
  mechanic. No hidden state.
- **Full agency** (decision #20): items + switch fully available
  throughout. No "no-switch turn" gimmicks. Puzzle stays solvable.
- **NG+ adds layers, not HP** (decision #22): NG+ adds +1 mechanic
  per phase (status spreader, immunity flicker, etc.), not a larger HP
  pool. Replay tests deeper puzzle-solving, not stamina.

### 3.5 Mini vs. Big design philosophy (decision #18)

Mini and Big share **expansion theme** but use **distinct mechanics**.
Mini = one-trick teacher. Big = full puzzle. Player who learned the
mini's hook can't predict the big's. Example for `bone_keepers`:

- **Mini (Cubone)** — Phase 1 = "bone storm" (add-spawn skeletons that
  respawn until parent dies); Phase 3 = "Marowak fury" (priority moves
  + crit boost). Theme: cycle of grief.
- **Big (Marowak)** — Phase 1 = stands guard, sets bone-spike hazards;
  Phase 2 = "death rattle" (status spread + Toxic priority); Phase 3 =
  "final mourning" (AoE damage that scales with foes' status conditions).
  Theme: protector becomes hunter.

### 3.6 Custom signature moves (decision #15)

Each phase has ONE custom signature move, lore-named per expansion +
boss. Mini = 2 custom moves total. Big = 3 custom moves total. They
replace one of the 4 canon slots in their phase's moveset.

Examples:
- **`bone_keepers` Marowak**: P1 *Bone Echo* (priority Whirlwind), P2
  *Death Rattle* (priority Toxic + spreads on switch-in), P3 *Final
  Mourning* (AoE damage scaling with active foes' status conditions).
- **`project_mewtwo` Mewtwo**: P1 *Cage Light* (SpA boost + foe Def
  drop), P2 *Lab Echo* (repeats foe's last move with priority), P3
  *Subject Zero* (full screen wipe + status reset).
- **`hypnos_lullaby` Hypno**: P1 *Lullaby Hum* (sleep on switch-in), P2
  *Dream Pendulum* (foes lose 1 PP per use of last move), P3 *Final
  Sleep* (party-wide perish if not switched).

### 3.7 Cinematic scope (decision #21)

Each phase transition plays a **full cinematic** beat:
- Boss sprite gets a palette shift + posture overlay (not full sprite
  swap — keep asset budget tight; reuses existing battle sprite art).
- Arena background swaps to a phase-themed backdrop (uses existing
  `bg_<type>.png` from the new type pairing).
- Music shifts (filter / EQ on the boss BGM — no new music tracks).
- 2–3 lines of in-fight dialogue from the boss.
- Battle log line explains the new ability + field effect + type
  change in plain English.

### 3.8 Implementation surface

- New `state.bossMode = 'mini' | 'big' | null` flag.
- New `state.bossPhase = 1 | 2 | 3` tracker.
- HP / stat multipliers applied as a post-build scaler analogous to
  `applyFoeDifficultyScaling` (`battle.html:8999–9019`). Final stat
  multiplier `min(rawMultiplier, 1.5)` per decision #10.
- **Phase transition handler**: on boss HP crossing a phase threshold:
  - Apply new type pairing (auto-retype boss moves so STAB holds).
  - Swap ability (clean up current ability triggers, apply new).
  - Replace movepool (boss forgets prior 4, gains new 4 + custom signature).
  - Clear/apply field layer (clear prior weather/terrain/hazards as
    appropriate; apply new).
  - Fire cinematic overlay (sprite palette + arena swap + music + dialogue).
- **Roll dispatcher per run** (decision #15): lock mechanic, arc, custom
  moves; roll types (2-of-N from canonical pool), abilities (1 of 3 per
  phase), 3 canon moves per phase.
- **Wipe handler**: on player party KO during boss fight, restore party
  to full HP / PP / no status and rewind to the city hub the beat fires
  from. No gold penalty, no progress loss (decision #2).
- **No catch path** on boss KO — boss vanishes after victory.
- Post-HoF Mystery Figure battle stays a trainer fight (decision #9).

### 3.9 UI

- Battle header shows boss name + a thick HP bar with tier badge
  ("RAID — MINI" / "RAID — BIG") and **phase indicator dots** (●○○ /
  ●●○ / ●●●).
- Boss HP bar has segment ticks (×6 / ×9 → 6 / 9 visible segments).
- Phase transition: arena fades, palette overlay applies to boss sprite,
  music filter sweeps in, dialogue + log line follow. ~3 seconds total.
- No new screen — extends the existing battle UI with raid + phase
  overlays.

---

## 4. Quest item economy (token + consumable + lore prop)

### 4.1 Tokens (narrative MacGuffins)

- Live in a new **Key Items** inventory tab. Cannot be used in battle.
- **Token A** drops at Beat 4 mini-boss → consumed at Beat 5 dialogue
  (narrative gate; opens path to City 6).
- **Token B** drops at Beat 7 big boss → **traded at Beat 8** to a
  bespoke per-expansion NPC. Trade yields canonical Master Ball + fires
  expansion epilogue. See §4.4 (decision #25).
- Token names are expansion-specific (e.g. `bone_keepers` Token A =
  "Skull Fragment", Token B = "Bone Crown"; `project_mewtwo` Token A =
  "Lab Keycard", Token B = "Magnetic Key").
- Save schema: `sm.expansionTokens = { tokenA: true, tokenB: false }`.
  Cleared per run, never carried in NG+.

### 4.2 Consumable drops

- Each boss also drops standard consumables on victory.
- Drops use the existing item system — no new item types.
- NG+ adds +1 consumable per drop tier.

| Boss | Token | Consumable drops | Cosmetic lore prop (decision #20) |
|---|---|---|---|
| Mini-boss (Beat 4) | Token A | 1× Max Revive + 1× Vitamin | 1× lore item — flavor only, unlocks 1 alt-dialogue with a specific NPC. E.g. `bone_keepers` = "Skull Shard"; `project_mewtwo` = "Lab Tag"; `hypnos_lullaby` = "Music Box". No battle effect. |
| Big boss (Beat 7) | Token B | 1× Max Revive + 1× Full Restore + 1× Vitamin | 1× lore item — flavor only. E.g. `bone_keepers` = "Bone Crown"; `project_mewtwo` = "Lab Coat"; `hypnos_lullaby` = "Broken Pendulum". |

Consumables ride existing inventory; available in next battle's bag.
Lore props persist across runs (saved to `sm.expansionLoreProps[]`)
but never affect battle or progression.

### 4.3 Why this shape

- **Token A** = pure narrative gate (consumed in dialogue — no battle
  effect). Keeps the mid-arc beat simple.
- **Token B** = trade gate (decision #25). Turns Beat 8 from a passive
  dialogue beat into an active player choice ("trade to finish the
  expansion"). Reward = canonical Master Ball, which the player then
  uses on the post-Gym-8 roaming legendary (existing CORE content).
- **Consumables** = small material reward that scales with the run's
  difficulty curve. No power-creep per expansion (every expansion
  drops the same item tiers).
- **Lore props** = cosmetic-only world-building. Cheap to write,
  high flavor density, zero balance cost.
- **Master Ball** is reintroduced as the Beat 8 trade reward. Originally
  tied to the deleted Caged God arc; now ties to the new expansion
  closure flow.

### 4.4 Beat 8 — trade-for-Master-Ball flow (decisions 25, 27, 28)

The closing beat of every expansion. Replaces the prior "Token B
consumed at Beat 8 dialogue" model.

**Setup**: Player has just beaten the big boss (Beat 7) post-Gym-7.
Token B is in their Key Items inventory. They walk into the Beat 8
hub (typically City 7 post-Gym-7, or City 8 pre-Gym-8 depending on
expansion).

**Flow**:
1. **NPC encounter** — a bespoke per-expansion NPC appears in the hub
   (decision #27). Examples:
   - `bone_keepers` → "Grave Warden" in Lavender hub
   - `project_mewtwo` → "The Broker" (existing dialogue thread; line 28161)
   - `hypnos_lullaby` → "The Tired Mother" who hired the player
   - `dead_raticate` → the player's own rival, post-Raticate-loss
   - `lavender_frequency` → "The Static-Voiced Operator"
   - `static` → the corrupted save file itself (4th-wall break)
2. **Dialogue beat** — NPC asks for the lore item (Token B). Player
   has a choice: trade or refuse. Refusing exits dialog; player can
   return later (no time gate).
3. **Trade confirmation** — player picks "Trade [Token B]". NPC takes
   the token (removed from inventory). Cinematic overlay plays — uses
   existing `story-dialog-host` UI, no new screens.
4. **Master Ball receipt** — canonical Master Ball added to player's
   bag. Uses standard `addItem('masterball', 1)` path.
5. **Expansion epilogue** (decision #28) — full-screen closure beat
   plays. Per-expansion themed dialogue captures relief / closure
   ("kids are safe now, Drowzee is gone" for `hypnos_lullaby`, etc.).
   Uses the existing `_showVariantPostHofEpilogue` overlay pattern
   (line 28358) but fires at Beat 8 instead of post-HoF. Per-variant
   copy table to be drafted in §6.
6. **Expansion marked complete** — `sm.expansionStoryComplete = true`
   in save. Beats 9+ (if any) are deleted; the player returns to the
   CORE flow at the same eventIndex.

### 4.5 Master Ball usage — handoff to CORE

The Master Ball obtained at Beat 8 is **not used in the expansion**.
It carries forward into the CORE post-Gym-8 roaming legendary
encounter (decision #26).

The roaming legendary system is already in code (line 37135+):
- `_ROAMING_TRIGGERS` — currently fires on Gym 5 + Gym 7 wins.
- `_storyQueueRoamingFromVictory()` — queues a wild legendary spawn.
- `_showRoamingLegendarySighting()` — fires a per-variant cinematic
  with themed copy already written for all 8 expansions (line 37409).
- `SUB_LEGENDARY_POOL` — pool of sub-legendaries scoped to enabled gens.

Per §5.3, the mid-game triggers (Gym 5 + Gym 7) are **deleted**;
replaced by a single **post-Gym-8 trigger** so the legendary fires
during Victory Road approach (after the player has the Master Ball).

The legendary encounter:
- Wild battle, single encounter, max IV roll.
- Uses canonical Gen 1 catch rates — Master Ball = 100% catch;
  regular balls work at canonical rate (3 for Mewtwo etc.). Master Ball
  is the convenience path, not a hard gate.
- Existing `_showRoamingLegendarySighting()` cinematic plays per the
  player's chosen expansion variant — themed copy already written.
- This is **CORE content**, not expansion content. Player has it
  regardless of which expansion they ran.

---

## 5. What we have today (current state)

### 5.1 Code anchors (current `battle.html`)

| System | Anchor | Notes |
|---|---|---|
| `STORY_EVENTS_RAW` (68 rows) | line 27672 | CORE timeline — unchanged by this plan |
| `STORYLINE_VARIANTS` (8 entries) | line 34711 | Becomes the expansion registry; entries get `beats[]` + `boss` + `tokens` |
| `STORY_BEATS` | line 33487 | Per-row beat dispatcher — extends to fire new expansion beats |
| `STORY_COLD_OPENS` | line 33513 | Scene dispatcher — grows by ~64 scenes (8 expansions × 8 beats) |
| `MYSTERY_FIGURE_IDENTITIES` | line 28408 | Stays as-is — drives the CORE Mystery Figure reveal |
| `_BOSS_LEAD_FLAVOR` + `_BOSS_LEAD_FLAVOR_BY_VARIANT` | line 39004 + 39014 | **Deleted** — Caged God removal |
| `roamingLegendary` interrupt | line 37141 | **Repurposed** — mid-game spawns deleted; one post-Gym-8 spawn becomes the CORE Legendary Wild slot |
| `STORY_WILDS_PER_ROUTE_NODE` | per `STORY_MODE_FLOW.md §3` | Unchanged — route wilds stay as the catch-loop sandbox |
| Trainer-create story picker | line 32935 | UI label changes from "Storyline" to "Expansion"; copy reflects the new structural role |

### 5.2 The 8 existing variants

Confirmed: refactor all 8 into expansions. Existing prose maps to
**Beats 1, 2, 5, 8** (the dialogue-only beats); each needs **4 new
content slots** added per variant (Beats 3, 4, 6, 7 — special
trainer + mini-boss + elite trainer + big boss).

Proposed boss species per expansion (draft — needs sign-off):

| Expansion | Tier | Mini-boss (Beat 4) | Big boss (Beat 7) | Notes |
|---|---|---|---|---|
| `classic` | Classic | Snorlax | Dragonite | Standard Pokemon-canon "obstacle + ace" pair |
| `second_sun` | Classic | Rival's Pidgeot | Rival's Charizard | Rival fights — uses existing rival sprite + signature mon |
| `bone_keepers` | Mature | Cubone (haunted) | Marowak (the chained guardian) | Matches the variant's grief/Lavender hook |
| `project_mewtwo` | Mature | Porygon-Z (escaped data) | Mewtwo (Subject Zero) | Matches the lab/escape hook |
| `hypnos_lullaby` | Soft pasta | Drowzee | Hypno | The titular boss is the big-boss climax |
| `dead_raticate` | Soft pasta | Rival's Raticate (gaunt) | Rival's full team's ghost | Big boss is a hex-mark mon; matches "empty slot" |
| `lavender_frequency` | Full pasta | Gengar (radio static) | "BURIED ALIVE" trainer's last partner — Cofagrigus | Matches the frequency/buried hook |
| `static` | Full pasta | Glitched Voltorb (renders as `MissingNo`) | Glitched legendary (rolls one of the legends, sprite scrambled) | Matches the cartridge-corruption hook |

These bypass the gen filter — see §6.3.

### 5.3 What gets deleted

- `_BOSS_LEAD_FLAVOR` + `_BOSS_LEAD_FLAVOR_BY_VARIANT` (line 39004+)
- `sm.bossArc` save field (entire object: `available`, `leads`,
  `cageUnlocked`, `boss`, `cleared`)
- `_BOSS_*` lead-collection events at Cities 2 / 5 / 8
- `bossMode: true` catch encounter (line 39665) — replaced by the new
  raid-mode battle system
- Mid-game roaming legendary spawn triggers after Gym 5 / Gym 7

### 5.4 What gets repurposed

- `roamingLegendary` interrupt → single post-Gym-8 legendary wild slot
- `STORYLINE_VARIANTS` table → expansion registry (adds `beats`,
  `bossSpecies`, `tokenNames` fields)

---

## 6. What we want (target state)

### 6.1 `STORYLINE_VARIANTS` schema (extended)

```js
const EXPANSIONS = {
  classic: {
    id: 'classic',
    label: "The Champion's Road",
    tier: 'classic',
    toneClass: '',
    description: '...',
    // NEW:
    beats: {
      1: { coldOpen: 'classic_b1' },
      2: { coldOpen: 'classic_b2' },
      3: { coldOpen: 'classic_b3', battle: { kind: 'trainer', spec: {...} } },
      4: { coldOpen: 'classic_b4', battle: { kind: 'miniBoss', species: 'Snorlax', level: 50, multiplier: { hp: 6, stat: 1.25 }, phases: [{ at: 1.00, types: ['Normal','Fairy'], ability: 'Thick Fat', moves: [...3 canon], custom: 'Belly Slumber', field: { weather: 'Rain' } }, { at: 0.33, types: ['Normal','Dragon'], ability: 'Gluttony', moves: [...3 canon], custom: 'Final Feast', field: { hazards: 'Sticky Web' } }] }, drop: { token: 'tokenA', items: ['maxRevive', 'vitamin'], loreProp: 'champions_napkin' } },
      5: { coldOpen: 'classic_b5', consumesToken: 'tokenA' },
      6: { coldOpen: 'classic_b6', battle: { kind: 'eliteTrainer', spec: {...} } },
      7: { coldOpen: 'classic_b7', battle: { kind: 'bigBoss', species: 'Dragonite', level: 65, multiplier: { hp: 9, stat: 1.35 }, phases: [{ at: 1.00, types: ['Dragon','Flying'], ability: 'Multiscale', moves: [...3 canon], custom: 'Champion Wing', field: { weather: 'Sun' } }, { at: 0.66, types: ['Dragon','Steel'], ability: 'Inner Focus', moves: [...3 canon], custom: 'Iron Roar', field: { terrain: 'Electric' } }, { at: 0.33, types: ['Dragon','Fire'], ability: 'Berserk', moves: [...3 canon], custom: 'Champion\'s Last', field: { hazards: 'Stealth Rock' } }] }, drop: { token: 'tokenB', items: ['maxRevive', 'fullRestore', 'vitamin'], loreProp: 'crown_shard' } },
      8: { coldOpen: 'classic_b8', tradesToken: 'tokenB', tradeNpc: 'classic_warden', yields: 'masterball', epilogue: 'classic_outro' },
    },
    tokenNames: { tokenA: 'Champion\'s Token', tokenB: 'Crown Shard' },
  },
  // ... 7 more
};
```

### 6.2 New save fields

```js
sm.expansion = {
  id: 'classic',              // locked at run start (was sm.storyLine)
  beatsDone: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false },
  tokens: { tokenA: false, tokenB: false },
};
```

Save migration: v18 — old `sm.storyLine` reads as `sm.expansion.id`,
beats all default to false (forward-progress only).

### 6.3 Generation-agnostic boss/species

New helper `_resolveExpansionSpecies(name)`:

- Looks up species in `BASE_STATS` directly.
- **Skips** the `sm.settings.enabledGens` filter.
- Used by all expansion battle slots (Beats 3 / 4 / 6 / 7) when
  resolving the boss / ace / quest mon.
- Wild/route/trainer pools still respect gen filters — only expansion
  key species bypass.

### 6.4 NPC dialogue rewrite scope

Stays as it is today via `STORY_COLD_OPENS` + `tonClass` overlays. The
new 8-beat structure absorbs the existing per-variant dialogue
overrides; beats 1, 2, 5, 8 are the natural slots for them.

---

## 7. What we need to do (implementation phases)

Each phase is reviewable on its own; phases A–C can ship before any
content is wired (engine work first), then D–F add per-expansion
content.

### Phase A — Engine: raid boss mechanic (~750 LOC)

- Add `state.bossMode = 'mini' | 'big' | null` flag + `state.bossPhase = 1 | 2 | 3` tracker.
- Implement HP / stat multipliers as a post-build scaler (mirrors
  `applyStoryLeagueFoeStatBoost`). Cap final stat multiplier at ×1.5
  per decision #10.
- **Per-run roll dispatcher** (decision #15): at boss-fight entry, roll
  type pairings (2-of-N from boss's canonical pool), abilities (1-of-3
  per phase), 3 canon moves per phase. Lock mechanic, arc, custom
  signatures. Seed = `sm.rngSeed` for replay parity.
- **Phase transition handler** per §3.8: on boss HP crossing a phase
  threshold (mini: 33%; big: 66% then 33%):
  - Apply new type pairing — auto-retype boss's existing moves so STAB
    follows the new types (no need to re-roll moves on retype only).
  - Swap ability — clean up current ability triggers (drop weather/aura
    if from ability), apply new ability's onSwitchIn effects.
  - Replace movepool — boss forgets prior 4, gains new 4 (3 canon + 1
    custom signature). PP reset per move.
  - Clear / apply field layer (Phase 1 weather → Phase 2 terrain → Phase
    3 hazards): clear all prior layers, apply new.
  - Fire cinematic overlay — sprite palette/posture, arena background
    swap, music filter sweep, 2–3 dialogue lines, 1 plain-English log
    line explaining the transformation.
- **Wipe handler**: on player KO during a boss battle, restore party to
  full + rewind to the beat's city hub. No catch path on boss KO —
  boss vanishes (decisions 1, 2).
- Battle UI: tier badge ("RAID — MINI" / "RAID — BIG"), segmented HP
  bar (mini = 2 segments split at 33%; big = 3 segments split at 66%
  and 33%), phase indicator dots (●○○ / ●●○ / ●●●), phase-transition
  cinematic overlay (~3s fade).
- Tests: damage formula at boss multipliers; phase threshold crossing
  (transformation fires once, idempotent); auto-retype keeps STAB;
  ability swap drops prior triggers; field layer clear+apply; player
  wipe → restore + rewind; no catch path on boss KO; per-run roll
  determinism under seed.

### Phase B — Engine: expansion registry + beat dispatcher (~250 LOC)

- Extend `STORYLINE_VARIANTS` → `EXPANSIONS` schema with `beats`.
- Beat dispatcher: `_fireExpansionBeat(beatNum)` invoked from
  `enterCity` / hub render / `proceedToNextBattle`.
- Save schema v18: add `sm.expansion = { id, beatsDone, tokens }`.
- Migration: old `sm.storyLine` → `sm.expansion.id`; `beatsDone` /
  `tokens` default false; old `sm.bossArc` dropped.

### Phase C — Engine: Caged God removal + roaming relocation (~150 LOC)

- Delete `_BOSS_LEAD_FLAVOR` + `_BOSS_LEAD_FLAVOR_BY_VARIANT`.
- Delete broker City 2 / 5 / 8 lead events.
- Delete mid-game `roamingLegendary` queue triggers (Gym 5 / Gym 7
  entries in `_ROAMING_TRIGGERS` at line 37135).
- Add single post-Gym-8 trigger to `_ROAMING_TRIGGERS` — fires the
  existing `_storyQueueRoamingFromVictory()` path on Gym 8 victory or
  on entry to the City 8 → Victory Road transition (whichever fires
  later — gates the wild encounter on the player reaching the league
  approach with Master Ball in hand).
- Save migration: drop `sm.bossArc`; reset `sm.roamingLegendary`.
- **No changes to `_showRoamingLegendarySighting()` or
  `SUB_LEGENDARY_POOL`** — per-variant copy and species pool already
  written (lines 37127–37475). Just the trigger row moves.

### Phase D — Content: quest items + tokens UI + trade flow (~180 LOC)

- New inventory tab: **Key Items** (decision #6).
- `sm.expansion.tokens` drives the tab's contents.
- **Token A** flow: drops at Beat 4 KO; consumed at Beat 5 dialogue
  (existing `consumesToken` schema at line 477).
- **Token B trade flow** (decision #25 — new at Beat 8):
  - Trade NPC interaction UI (reuses existing dialog host overlay).
  - Choice card: "Trade [Token B name]" / "Refuse — come back later".
  - Trade confirmation: removes Token B from `sm.expansion.tokens`;
    grants canonical Master Ball via `addItem('masterball', 1)`; sets
    `sm.expansionStoryComplete = true`.
  - Epilogue overlay: relocates existing `_showVariantPostHofEpilogue`
    (line 28358) from post-HoF firing to Beat 8 firing. Per-variant
    copy table `_POSTHOF_EPILOGUE_BY_VARIANT` (line 28280) is reused
    as-is — content already authored.
- **Lore prop drops** (decision #20): each boss KO grants a cosmetic
  Key Item per the table in §4.2. `sm.expansionLoreProps[]` array
  carries across runs (NG+ keeps the collection; cosmetic-only).
- Consumable drops use existing inventory writes — no new items.

### Phase E — Content: per-expansion battles (Beats 3 / 4 / 6 / 7) (~1,200 LOC)

For each of the 8 expansions:

- **Beat 3 (special trainer)**: 1 themed trainer spec (sprite + ace +
  1–2 filler mons). Uses existing trainer roller with overrides.
- **Beat 4 (mini-boss, 2-form)**: 1 species pick + level 50 +
  multipliers per §3.2 + **2 phase specs** (P1, P3): type pairings
  (rolled pool of N), 3-ability themed pool per phase, 3 canon moves
  per phase, 2 custom signature moves, field layers (P1 weather, P3
  hazards).
- **Beat 6 (elite trainer)**: 1 themed elite trainer spec (3–4 mons,
  one ace).
- **Beat 7 (big boss, 3-form)**: 1 species pick + level 65 +
  multipliers per §3.2 + **3 phase specs** (P1, P2, P3): same shape
  as mini, full arc, 3 custom signature moves, full field rotation
  (P1 weather → P2 terrain → P3 hazards).

Total: 32 new battle specs (4 per expansion × 8) + per-boss phase
specs (mini = 2 specs, big = 3 specs → 40 phase specs across 16
bosses). All ride on existing roller / battle infra; spec data + the
phase-transition handler (Phase A) are the only new code.

### Phase F — Content: per-expansion dialogue (Beats 1 / 2 / 5 / 8) (~1,000 LOC)

For each expansion:

- **Beat 1 (intro)**: 6–10 line cold-open scene.
- **Beat 2 (developing)**: 6–10 line scene.
- **Beat 5 (deliver Token A)**: 5–8 line scene.
- **Beat 8 (trade + epilogue)** — now multi-part per §4.4:
  - Bespoke NPC introduction (3–5 lines)
  - Trade interaction (2–4 lines, includes "trade / refuse" choice copy)
  - Master Ball receipt cinematic (existing item-pickup overlay)
  - Expansion epilogue overlay (8–12 line themed closure, fires once
    per save via the existing `_showVariantPostHofEpilogue` overlay
    pattern relocated to Beat 8)

Total: 32 new dialogue scenes + 8 bespoke NPC profiles. Many can reuse
existing variant prose from `docs/STORY_NARRATIVE_VARIANTS.md` — Beats
1/2 borrow from current `introRival` + Gym 1 victory overlays; Beat 8
epilogue borrows from the deleted Caged God epilogue lines (existing
`_POSTHOF_EPILOGUE_BY_VARIANT` at line 28280 — relocate to Beat 8 path).

### Phase G — UI: expansion picker copy (~60 LOC)

- Trainer-create screen "Storyline" → "Expansion".
- Per-expansion card shows: **tier badge** + **one-line thematic
  tagline** only (decision #8: bosses stay hidden until in-game reveal).
- No boss species, no type hint, no silhouette on the picker.
- Mini-boss species revealed at Beat 3 dialogue; big boss at Beat 6.
- "Surprise Me" stays.

### Phase H — Tests + CHANGELOG (~200 LOC)

- Headless test: each expansion fires 8 beats in order, no skips.
- Headless test: token persistence across save/load.
- Headless test: raid boss damage formula + multi-form phase
  transition behavior (type retype, ability swap, moveset replace,
  field layer apply, cinematic fires once per threshold cross).
- Headless test: Token B trade flow — refuse path leaves token intact;
  accept path consumes token, grants Master Ball, fires epilogue,
  sets `sm.expansionStoryComplete = true`.
- Headless test: post-Gym-8 roaming legendary fires once after the
  single trigger relocation (no fires on Gym 5/7 wins).
- CHANGELOG entry.

---

## 8. Estimated total

| Phase | LOC | Risk |
|---|---|---|
| A — Raid mechanic | ~750 | High — new battle path, multi-form transformation handler (type/ability/moveset/field swap per phase) + per-run roll dispatcher + wipe rewind |
| B — Registry + dispatcher | ~250 | Medium — save migration v18 |
| C — Caged God removal + roaming relocation | ~150 | Low — pure deletion + post-Gym-8 relocation |
| D — Tokens UI + trade flow | ~180 | Low — adds trade interaction UI + epilogue overlay relocation |
| E — Per-expansion battles | ~1,200 | Medium — 32 specs (8 expansions × 4 fights), per-phase movesets + custom signatures, balance per tier |
| F — Per-expansion dialogue | ~1,000 | Low — content work, no logic; includes 8 bespoke trade NPCs + epilogues |
| G — Picker copy | ~60 | Low |
| H — Tests + CHANGELOG | ~200 | Low |
| **Total** | **~3,840 LOC** | — |

A → B → C must land in order. D + E + F + G can land in parallel after B.
H runs against every phase as it merges.

---

## 9. Open questions for next pass

1. **Per-expansion boss mechanic specs.** Decisions 11–24 lock the
   FRAMEWORK; each of the 8 expansions still needs its concrete
   mechanic + custom-signature-move + field-layer sketch per phase.
   Drafted in §3.5 / §3.6: `bone_keepers`, `project_mewtwo`,
   `hypnos_lullaby`. Outstanding:
   - `classic` (Snorlax / Dragonite)
   - `second_sun` (Rival's Pidgeot / Charizard)
   - `dead_raticate` (gaunt Raticate / hex-mark ghost mon)
   - `lavender_frequency` (Gengar / Cofagrigus)
   - `static` (MissingNo. Voltorb / scrambled legendary)

2. **Per-expansion Beat 8 NPC + epilogue copy.** 8 scripts to write —
   bespoke NPC name + dialogue + trade exchange + closure epilogue
   matching the variant's tone (decisions 27, 28). Existing
   `project_mewtwo` broker copy at line 28161 is the reference style.

3. **Post-Gym-8 roaming legendary skip vs. force.** Decisions 26 & 28
   say the legendary fires from existing `_storyQueueRoamingFromVictory`
   infrastructure post-Gym-8, but one sub-detail is open:
   - **Forced engage** — player must enter the encounter before
     advancing to E1 (matches "this is the climax" intent).
   - **Skippable** — player can decline the cinematic and proceed
     directly; the legendary is still catchable on a later revisit.
   - **Current code default**: `_shouldFireRoamingBeforeBattle()`
     interrupts the next battle entry; player has one chance, no flee
     return. Force is the default. Open: do we soften this for Beat-8
     players who haven't picked up the Master Ball yet?

4. **NG+ mechanic-layer roster.** Decision #22 says NG+ adds +1
   mechanic layer per phase. Need a small library of "layer" effects:
   - Status spreader (auto-poison every 3rd turn)
   - Immunity flicker (random type immunity each turn)
   - Move echo (boss repeats last move with priority)
   - Hazard re-arm (entry hazards re-apply on switch-in)
   - Field stack (carry over the prior phase's field layer)
   Pick 5–8, distribute across NG+ tiers (NG+1 = +1 layer at Phase 3
   only; NG+3 = +1 layer per phase; etc.).

5. **Cinematic asset reuse map.** Decision #21 says no new sprite art /
   music tracks — palette overlays + filters only. Need a concrete
   mapping:
   - Sprite palette overlay → which CSS filter chain per type-pair?
   - Arena background → which existing `bg_<type>.png` for each pair?
   - Music filter → existing BGM × what EQ / pitch shift per phase?

6. **Phase indicator UI mock.** Decision #11 introduces phase dots
   (●○○ / ●●○ / ●●●). Need a small UI mock for the HP bar header
   layout — placement near the segmented HP bar, color rules per
   active phase, and accessibility (screen-reader label).

4. **Per-expansion music.** Deferred. Revisit when the visual tone
   classes are wired and we can judge whether they feel underdone
   without audio.

5. **Boss species roster.** §5.2 lists draft picks per variant
   (Snorlax → Dragonite for classic, Cubone → Marowak for
   bone_keepers, etc.). Needs explicit user sign-off before
   Phase E content work begins.

---

## 10. References

- `STORY_MODE_FLOW.md` — CORE pipeline spec (unchanged for cities,
  wilds, catch, PC, Safari). This plan supersedes its §16 Caged God
  section and §11 roaming-legendary mid-game spawns.
- `docs/STORY_NARRATIVE_VARIANTS.md` — current variant prose; mapped
  into Beats 1 / 2 / 5 / 8 by Phase F.
- `docs/STORY_MODE_DESIGN_DECISIONS.md` — A1 (stable id) + B1 (party
  size rules) remain in force.
- `battle.html:27672` — `STORY_EVENTS_RAW`.
- `battle.html:34711` — `STORYLINE_VARIANTS` (becomes `EXPANSIONS`).
- `battle.html:33487` — `STORY_BEATS`.
- `battle.html:33513` — `STORY_COLD_OPENS`.
- `battle.html:28408` — `MYSTERY_FIGURE_IDENTITIES` (kept).
- `battle.html:28280` — `_POSTHOF_EPILOGUE_BY_VARIANT` (relocated from
  post-HoF to Beat 8 by Phase D).
- `battle.html:28358` — `_showVariantPostHofEpilogue` overlay
  (relocated by Phase D).
- `battle.html:39004–39159` — Caged God / `_BOSS_LEAD_FLAVOR` (deleted
  by Phase C).
- `battle.html:37135` — `_ROAMING_TRIGGERS` (mid-game triggers deleted
  by Phase C; replaced by single post-Gym-8 trigger).
- `battle.html:37141` — `_storyEnsureRoamingState` + roaming legendary
  state (kept; trigger relocation only).
- `battle.html:37409` — `_LEGENDARY_SIGHTING_FRAMES` per-variant copy
  (kept as-is; already covers all 8 expansions).
- `battle.html:37425` — `_showRoamingLegendarySighting` cinematic
  (kept as-is).
- `battle.html:8999–9019` — `applyFoeDifficultyScaling` (Phase A
  scaler pattern).

---

*This plan is the deliverable for two brainstorm passes (decisions
1–28). No code changed. Phase A can begin once Open Questions 1–6 are
answered. Per-expansion content work (Phase E + F) can start in
parallel against decisions 11–28 once the framework lands.*
