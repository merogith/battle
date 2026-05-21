# Story Expansion System — Plan

Two-layer architecture for story mode. Replaces the current "8 prose-skin
variants over a shared pipeline + a tacked-on post-HoF Caged God arc"
with a clean **CORE pipeline + EXPANSION layer** model.

This doc supersedes the boss/legendary sections of `STORY_MODE_FLOW.md`
and `docs/STORY_NARRATIVE_VARIANTS.md` where they conflict. Decisions
recorded here are confirmed with the user; "open" items are flagged at
the bottom.

---

## 0. Decisions locked (from brainstorm pass)

| # | Topic | Decision |
|---|---|---|
| 1 | Boss aftermath | **No catch** — boss vanishes on KO. Reward is token + consumable drops only. |
| 2 | Boss loss | Wipe = **retry from the same beat with full heal**. No gold penalty, no progress loss. |
| 3 | Boss danger profile | **Shield phases at HP thresholds** (not multi-action). Boss is single-action; gains 1 turn of damage immunity + stat-change clear at each threshold. |
| 4 | Themed trainer integration | Beats 3 / 6 **replace the existing row's trainer roll**. No new fight rows. |
| 5 | NG+ expansion | **Re-roll random** per new run ("Surprise Me" semantics). Explicit picker still available. |
| 6 | Token scope | **Strict narrative gate only**. No shop / battle effects. |
| 7 | Pre-boss state | **Auto full-heal** (matches universal game rule). |
| 8 | Boss species reveal | **Hidden on the picker**. Mini-boss revealed at Beat 3 dialogue, big boss at Beat 6 dialogue. |
| 9 | Post-HoF Mystery Figure | **Stays a trainer fight**. Raid mechanic does not enter the CORE flow. |
| 10 | Difficulty × raid stacking | Final raid stat multiplier **capped at ×1.5**. Hard / Challenge stack until cap. |

Two follow-up details remain open from these:
- **Shield-phase behavior** during the shielded turn — does the boss attack (more punishing) or stand still (more puzzle-like)?
- **Picker teaser content** — what does the hidden-boss picker card actually show (tier label + tagline only? type hint? theme phrase)?

Both flagged in §9.

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
| 7 | **Post-Gym-7 / pre-Gym-8** (City 7 hub) | Dialogue + **big boss battle** (6v1 raid) | **Big boss** | Receives **Token B** + consumable drop |
| 8 | Just before Gym 8 (City 8 pre-Gym-8 hub) | Dialogue (deliver Token B → ending scene of the expansion) | — | Consumes Token B |

After Beat 8 the expansion is over. The player walks into Gym 8 →
legendary wild → league with the CORE flow untouched.

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

## 3. Boss battle mechanic (6v1 raid)

Used by Beat 4 (mini-boss) and Beat 7 (big boss). New mechanic — not
in the codebase today.

### 3.1 Shape

- **Player brings their full party** (up to 6 mons, badge-curve capped).
- **Boss is a single Pokemon** with inflated HP and buffed stats.
- **Player wins** when the boss is KO'd.
- **Player loses** when all party mons are fainted.
- **No catch** — bosses are story creatures. Reward is the token + drop,
  not a captured mon. (Open Q1.)

### 3.2 Stat scaling

| Tier | HP multiplier | Stat multiplier | Level lock | Shield phases |
|---|---|---|---|---|
| Mini-boss (Beat 4) | ×6 | ×1.25 across Atk / SpA / Spe | Lvl 50 (clamped — does not scale with party power) | **1 shield phase at 50% HP** — boss becomes damage-immune for 1 turn and clears its stat-stage changes (both player-inflicted drops and boss-cast boosts). |
| Big boss (Beat 7) | ×9 | ×1.35 across Atk / SpA / Spe | Lvl 65 (clamped) | **3 shield phases at 75% / 50% / 25% HP** — same mechanic, fires three times across the fight. |

Defensive stats stay at species baseline — the boss is dangerous because
it hits hard, has shield turns that punish stat-stacking strategies, and
forces the player through multiple HP gates without single-shot KO routes.
Difficulty mode (Hard / Challenge) stacks on top, capped at ×1.5 final
stat multiplier per Q10.

### 3.3 Implementation surface

- New `state.bossMode = 'mini' | 'big' | null` flag on battle entry.
- HP / stat multipliers applied as a post-build scaler analogous to
  `applyFoeDifficultyScaling` (`battle.html:8999–9019`). Final stat
  multiplier `min(rawMultiplier, 1.5)` per Q10.
- **Shield phase tracker**: `state.bossShields = [0.5]` (mini) or
  `[0.75, 0.5, 0.25]` (big). On boss HP crossing a threshold:
  - Set `state.bossShieldActive = true` for the next turn cycle.
  - During shield: damage moves resolve as 0 with a `"<Boss> shielded the attack!"` log line; status moves miss; entry hazards / weather still apply.
  - On shield clear: boss's stat-stage changes reset to 0 (both player-inflicted drops and boss-cast boosts).
  - Threshold is consumed on first cross — re-rising past it via heal moves (Recover, Slack Off) does **not** re-arm a shield.
  - Boss continues to attack normally during the shielded turn — single action per turn, no multi-action (Q3 open sub-q (a)).
- **Wipe handler**: on player party KO during a boss fight, restore party to full HP / PP / no status and rewind to the city hub the beat fires from. No gold penalty, no progress loss (Q2).
- **No catch path** on boss KO — boss vanishes after victory (Q1).
- The post-HoF Mystery Figure battle stays as a trainer fight (Q9 — CORE finale unaltered by raid mechanic).

### 3.4 UI

- Battle header shows boss name + a thick HP bar with a tier badge
  ("RAID — MINI" / "RAID — BIG").
- Boss HP bar has segment ticks (e.g. ×9 HP → 9 visible segments) so
  the player can read progress against the inflated pool.
- No new screen — uses the existing battle UI with the raid badge
  overlay.

---

## 4. Quest item economy (hybrid: token + consumable)

### 4.1 Tokens (narrative MacGuffins)

- Live in a new **Key Items** inventory tab. Cannot be used in battle.
- Token A drops at Beat 4 mini-boss → consumed at Beat 5 dialogue.
- Token B drops at Beat 7 big boss → consumed at Beat 8 dialogue.
- Token names are expansion-specific (e.g. `bone_keepers` Token A =
  "Skull Fragment"; `project_mewtwo` Token A = "Lab Keycard").
- Save schema: `sm.expansionTokens = { tokenA: true, tokenB: false }`.
  Cleared per run, never carried in NG+.

### 4.2 Consumable drops

- Each boss also drops 1–2 standard consumables on victory.
- Drops use the existing item system — no new item types.

| Boss | Token | Consumable drops |
|---|---|---|
| Mini-boss (Beat 4) | Token A | 2× Revive |
| Big boss (Beat 7) | Token B | 2× Max Revive + 1× Full Restore |

Consumables ride existing inventory; available in next battle's bag.

### 4.3 Why hybrid

Pure tokens are too dry (boss feels unrewarding). Pure battle items
create power creep per expansion (every expansion balances differently).
Hybrid: token gates progress, consumable is a small material reward
that scales with the run's difficulty curve. Master Ball is **not** a
boss reward in this system — that idea was tied to the deleted Caged
God arc.

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
      4: { coldOpen: 'classic_b4', battle: { kind: 'miniBoss', species: 'Snorlax', level: 50, multiplier: { hp: 6, stat: 1.25, shields: [0.5] } }, drop: { token: 'tokenA', items: ['revive', 'revive'] } },
      5: { coldOpen: 'classic_b5', consumesToken: 'tokenA' },
      6: { coldOpen: 'classic_b6', battle: { kind: 'eliteTrainer', spec: {...} } },
      7: { coldOpen: 'classic_b7', battle: { kind: 'bigBoss', species: 'Dragonite', level: 65, multiplier: { hp: 9, stat: 1.35, shields: [0.75, 0.5, 0.25] } }, drop: { token: 'tokenB', items: ['maxRevive', 'maxRevive', 'fullRestore'] } },
      8: { coldOpen: 'classic_b8', consumesToken: 'tokenB' },
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

### Phase A — Engine: raid boss mechanic (~550 LOC)

- Add `state.bossMode = 'mini' | 'big' | null` flag.
- Implement HP / stat multipliers as a post-build scaler (mirrors
  `applyStoryLeagueFoeStatBoost`). Cap final stat multiplier at ×1.5
  per Q10.
- **Shield phase tracker** per §3.3: `state.bossShields[]` thresholds,
  `state.bossShieldActive` per-turn flag. Damage / status suppression
  during shield. Stat-stage reset on shield clear. Threshold
  consumption on first cross (no re-arm on heal).
- **Wipe handler**: on player KO during a boss battle, restore party to
  full + rewind to the beat's city hub. No catch path on boss KO —
  boss vanishes (Q1, Q2).
- Battle UI: tier badge ("RAID — MINI" / "RAID — BIG"), segmented HP
  bar (mini = 2 segments split at 50%; big = 4 segments split at
  25 / 50 / 75%), shield-active overlay (flash + log line).
- Tests: damage formula at boss multipliers; shield-turn behavior
  (damage = 0, status miss, stat clear); HP-crossing threshold
  consumption (no re-arm on heal); player wipe → restore + rewind;
  no catch path on boss KO.

### Phase B — Engine: expansion registry + beat dispatcher (~250 LOC)

- Extend `STORYLINE_VARIANTS` → `EXPANSIONS` schema with `beats`.
- Beat dispatcher: `_fireExpansionBeat(beatNum)` invoked from
  `enterCity` / hub render / `proceedToNextBattle`.
- Save schema v18: add `sm.expansion = { id, beatsDone, tokens }`.
- Migration: old `sm.storyLine` → `sm.expansion.id`; `beatsDone` /
  `tokens` default false; old `sm.bossArc` dropped.

### Phase C — Engine: Caged God / roaming removal (~150 LOC)

- Delete `_BOSS_LEAD_FLAVOR` + `_BOSS_LEAD_FLAVOR_BY_VARIANT`.
- Delete broker City 2 / 5 / 8 lead events.
- Delete mid-game `roamingLegendary` queue triggers (Gym 5 / Gym 7).
- Repurpose `roamingLegendary` interrupt → single post-Gym-8 slot
  (gated behind `sm.eventIndex === gym8Row + 1`).
- Save migration: drop `sm.bossArc`; reset `sm.roamingLegendary`.
- **Legendary wild detailed spec — pending from user.**

### Phase D — Content: quest items + tokens UI (~120 LOC)

- New inventory tab: **Key Items**.
- `sm.expansion.tokens` drives the tab's contents.
- Dialogue beats 5 / 8 gate-check the token; if missing, the beat
  cannot fire (defensive — shouldn't happen since prior beat sets it).
- Consumable drops use existing inventory writes — no new items.

### Phase E — Content: per-expansion battles (Beats 3 / 4 / 6 / 7) (~1,000 LOC)

For each of the 8 expansions:

- **Beat 3 (special trainer)**: 1 themed trainer spec (sprite + ace + 1–2
  filler mons). Uses existing trainer roller with overrides.
- **Beat 4 (mini-boss)**: 1 species pick + level 50 + multipliers per §3.2.
- **Beat 6 (elite trainer)**: 1 themed elite trainer spec (3–4 mons,
  one ace).
- **Beat 7 (big boss)**: 1 species pick + level 65 + multipliers per §3.2.

Total: 32 new battle specs (4 per expansion × 8). All ride on existing
roller / battle infra; only the spec data is new.

### Phase F — Content: per-expansion dialogue (Beats 1 / 2 / 5 / 8) (~800 LOC)

For each expansion:

- **Beat 1 (intro)**: 6–10 line cold-open scene.
- **Beat 2 (developing)**: 6–10 line scene.
- **Beat 5 (deliver Token A)**: 5–8 line scene.
- **Beat 8 (ending)**: 8–12 line scene (longest, wraps the arc).

Total: 32 new dialogue scenes. Many can reuse existing variant prose
from `docs/STORY_NARRATIVE_VARIANTS.md` — Beats 1/2 borrow from current
`introRival` + Gym 1 victory overlays; Beat 8 borrows from the
deleted Caged God epilogue lines.

### Phase G — UI: expansion picker copy (~40 LOC)

- Trainer-create screen "Storyline" → "Expansion".
- Per-expansion card shows boss species pair (e.g. "Snorlax → Dragonite")
  + a one-line tagline + tier badge.
- "Surprise Me" stays.

### Phase H — Tests + CHANGELOG (~150 LOC)

- Headless test: each expansion fires 8 beats in order, no skips.
- Headless test: token persistence across save/load.
- Headless test: raid boss damage formula + multi-action behavior.
- CHANGELOG entry.

---

## 8. Estimated total

| Phase | LOC | Risk |
|---|---|---|
| A — Raid mechanic | ~550 | High — new battle path, shield-phase tracker + wipe rewind |
| B — Registry + dispatcher | ~250 | Medium — save migration v18 |
| C — Caged God removal | ~150 | Low — pure deletion + post-Gym-8 relocation |
| D — Tokens UI | ~120 | Low |
| E — Per-expansion battles | ~1,000 | Medium — 32 specs, balance per tier |
| F — Per-expansion dialogue | ~800 | Low — content work, no logic |
| G — Picker copy | ~40 | Low |
| H — Tests + CHANGELOG | ~150 | Low |
| **Total** | **~3,050 LOC** | — |

A → B → C must land in order. D + E + F + G can land in parallel after B.
H runs against every phase as it merges.

---

## 9. Open questions for next pass

1. **Post-Gym-8 Legendary Wild — full spec.** User flagged "update
   soon" in the brainstorm pass. Need to know before Phase C lands:
   - Single throw, escape on miss? Or repeatable until caught?
   - Species rolls from a pool, or fixed per expansion?
   - Master Ball gate, or any ball?
   - Skippable, or forced (must engage before league)?

2. **Shield-phase behavior during the shielded turn.** Sub-question
   from Q3 in the brainstorm:
   - (a) Boss continues to attack normally during shield turn (more
         punishing; player loses tempo). **Current plan.**
   - (b) Boss stands still during shield turn (more puzzle-like;
         player gets a free set-up turn).
   Either is implementable. (a) reads as a "boss shrugged off your
   attack and is still threatening"; (b) reads as a "boss reset and
   you have a moment to recover".

3. **Picker teaser content for hidden-boss expansions.** Sub-question
   from Q8 in the brainstorm:
   - Current plan: tier label + tone tagline only. No boss
     species / type / silhouette shown.
   - Alternatives: theme phrase ("rooted in grief", "born of code"),
     type indicator without species, or full silhouette reveal.
   The "hidden until pre-beat dialogue" decision means the player
   walks in without team-building info — which fits surprise but
   may frustrate min-maxers.

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
- `battle.html:39004–39159` — Caged God / `_BOSS_LEAD_FLAVOR` (deleted
  by Phase C).
- `battle.html:37141` — `roamingLegendary` (repurposed by Phase C).

---

*This plan is the deliverable for the brainstorm pass. No code changed.
Phase A can begin once Open Questions 1–5 are answered.*
