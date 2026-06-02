# Battle Dojo & Move Tutor — Recommender + Tier Design (proposal)

> Status: **IMPLEMENTED** (user approved "full retune + recommender"). The tier
> reassignments are balance (user-owned, overlapping maxwell's curve) and shipped with
> that approval. Decisions taken: type-boosters + Eviolite → tier 1; Heavy-Duty Boots +
> Assault Vest → tier 2; snowball items stay tier 3; belt unlocks stay C2/C5/C8; resist
> berry surfaces for any ≥2× worst weakness (4× preferred). Foe parity is automatic
> (§2) and covered by a regression test. See tests/suites/story-dojo-item-recs.test.js.
> NOTE: Eviolite → tier 1 means early NFE foes (Chansey/Porygon2/…) can keep Eviolite at
> White Belt via the mirror — flip it back to tier 2 (remove from `_DOJO_ITEM_TIER1`) if
> early fights feel too bulky.

## 1. Goals

1. Early Dojo stops feeling useless — every belt gives each role a genuinely good pick.
2. Recommendations are **profile-driven** (stat/typing/role), not hostage to sparse early
   Smogon item usage.
3. Each belt is a meaningful, *fun* power spike; snowball items stay gated to late belts.
4. **Foe parity is preserved automatically** (see §2) — foes pace with the player.

## 2. Foe mirror = automatic (the key architectural fact)

Every foe gate derives from ONE shared clock (`NPC_STAGE_CITY` via `_npcStageForCity`) and the
shared item classifier (`_dojoItemTier`):

| Foe gate | Derivation | Source file anchor |
|---|---|---|
| Foe **item** tier ceiling | `_storyFoeItemTier(city) = _npcStageForCity('dojo', city) + 1` | `_storyFoeItemTier` |
| Foe **item** classification | `_dojoItemTier(item) > foeItemTierCap → downgrade` | foe build gate (`_foeItemTierCap`) |
| Foe **hidden ability** | `_npcStageForCity('dojo', city) >= 1` | `_hiddenAllowedForFoes` |
| Foe **moves** | `_npcStageForCity('tutor', city)` | `_storyGateFoeMovesByCity` |

**Implication:** if we retune the *shared sources* — `_dojoItemTier`, `_DOJO_ITEM_BEST`,
`NPC_STAGE_CITY.dojo` — the foe side follows with **zero extra wiring**. The rule we must keep:
**never introduce a player-only tier override.** Edit the shared definitions and the mirror holds
(foes can never field an item the player couldn't yet hold).

Note: the gate only *downgrades* foe items over the cap; it never *adds* items. Foes still draw
their items from their Smogon build (gated), so adding e.g. type-boost items to the player pool
does NOT force them onto foes — it only raises what's legal at that belt for both sides.

## 3. Current state & problems (measured)

- Stage clock: `NPC_STAGE_CITY.dojo = [2, 5, 8]` → White Belt C2–4, Black Belt C5–7, Grandmaster C8+.
- `_dojoItemTier`: Berry→1; `_DOJO_ITEM_BEST` (13 items)→3; everything else→2.
- **White Belt is berries-only for three cities** — no Leftovers / Focus Sash / Eviolite /
  Rocky Helmet. Bulky mons have no real item; there is no consistent sustain pick.
- **Choice items, Life Orb, Heavy-Duty Boots, Assault Vest, Weakness Policy are ALL tier 3
  (C8+)** — most of the game has no Choice/LO/Boots/AV.
- The "Best items" panel runs a Choice/Leftovers heuristic over the unlocked pool, so at White
  Belt it bottoms out at two generic berries — measured: a physical **Garchomp** and a wall
  **Toxapex** both got `Oran Berry + Sitrus Berry`. No stat/typing/role awareness.

## 4. Proposed tier retune — "Foundation → Staples → Meta"

Keep **3 belts** (simplest; foe mirror stays clean). Re-grade items so each belt covers every
role and is a real step up, without unlocking snowball items early. **All numbers below are
proposals for your approval.**

### Tier 1 — White Belt (C2–4) · "Foundation"
- **All berries** (heal / status / pinch-stat / 18-type resist) — unchanged.
- **+ Eviolite** (only does anything on not-fully-evolved mons; early game is NFE-heavy; fair, no snowball).
- **+ Type-boost held items** (Charcoal, Dragon Fang, Soft Sand, Mystic Water, Magnet, Miracle
  Seed, Sharp Beak, Black Glasses, Spell Tag, Silk Scarf, …). +20% one type — mild, role-defining
  offense. *(These are NOT in the item pool today — adding them is part of this proposal, §6.)*

→ Now an offensive mon gets a STAB type-booster, an NFE mon gets Eviolite, a bulky/utility mon
gets Sitrus + resist berry — a complete, non-oppressive Foundation set for both player and foes.

### Tier 2 — Black Belt (C5–7) · "Staples"
- Current tier-2 staples (Leftovers, Focus Sash, Rocky Helmet, Expert Belt, Muscle Band, Wise
  Glasses, Black Sludge, Scope Lens, weather rocks, …) **plus promote from tier 3:**
  **Heavy-Duty Boots** and **Assault Vest** (these are defensive *staples*, not win-more).

→ Mid-game gets the competitive defensive baseline (Boots/AV/Leftovers/Sash). Foes get the same
ceiling → mid-game fights are appropriately meatier.

### Tier 3 — Grandmaster (C8+) · "Meta"
- The true snowball / win-more items only: **Choice Band / Specs / Scarf, Life Orb, Weakness
  Policy, Booster Energy, Loaded Dice, Covert Cloak, Clear Amulet, Light Ball, Thick Club**.

`_DOJO_ITEM_BEST` (tier 3) edits: **remove** Heavy-Duty Boots, Assault Vest (→ tier 2). **Add** a
new `_DOJO_ITEM_TIER1` set (type-boosters + Eviolite). Everything else stays tier 2 by default.

## 5. Recommender redesign (player UX — your Q1–Q3 answers)

Replace `_txItemRecsByPurpose` with a **profile-driven, tier-aware** picker.

**Mon profile** (stats + types): `isPhysical` (Atk≥SpA), `off`=max(Atk,SpA), `bulk`=HP+Def+SpD,
`sweeper` (high off & Spe≥~90), `frail`, `nfe`, `worstWeakness` (from `window.typeChart`, 4× first),
`stabTypes`.

**Four fixed role slots** (your Q2 = fixed roles), each picking the best *in-current-tier* candidate:

| Slot | White Belt | Black Belt | Grandmaster |
|---|---|---|---|
| **Primary** (archetype) | sweeper→Liechi/Petaya/Salac · bulky→Sitrus · offense→STAB type-booster | + Expert Belt / Muscle Band / Wise Glasses · Eviolite(NFE) | + Choice (stat-matched) / Life Orb |
| **Sustain** | Sitrus / Figy-line(50%) | Leftovers · Black Sludge(Poison) | + Heavy-Duty Boots |
| **Status insurance** | Lum / Chesto | (berries persist) | — |
| **Defensive-tech** | **resist berry vs worst weakness** (Q1 = yes) | Rocky Helmet / Focus Sash / Assault Vest | Covert Cloak / Clear Amulet |

Distinct items, capped at 4. Smogon usage breaks ties only (so Grandmaster stays meta-correct).

**Default grid sort (your Q3):** at White/Black Belt the item grid defaults to the heuristic
"Best for this mon"; at Grandmaster it defaults to "By usage %" (data reliable there).

**Example outputs:**
- Physical **Garchomp** @ White Belt → **Soft Sand · Sitrus · Lum · Yache Berry** (Ground booster /
  heal / status / Ice-resist for its 4× Ice weakness).
- **Toxapex** @ Black Belt → **Black Sludge · Rocky Helmet · Lum · resist berry**.

## 6. Supporting changes

- **Add type-boost items + Eviolite to the Dojo item pool** (`_tutorGetPoolForMon(...).items`) for
  every species, gated by the new tiers. (Today the pool is Smogon-derived, so these never appear.)
- **`_TX_ITEM_REC_FILL`** (the ★ Recommended curated fill): refresh per-tier lists to match the new
  tier-1 contents so the ★ grid view is never sparse/weak early.
- Resist-berry map: worst-weakness type → berry (Ice→Yache, Fire→Occa, Water→Passho, Electric→Wacan,
  Grass→Rindo, Ground→Shuca, Fighting→Chople, Dragon→Haban, Fairy→Roseli, …) — full 18-type table.

## 7. Files / functions to touch (implementation map)

- `_dojoItemTier`, `_DOJO_ITEM_BEST`, new `_DOJO_ITEM_TIER1` (tier map) — **shared/balance**.
- `NPC_STAGE_CITY.dojo` — only if we also move belt-unlock cities (not proposed; keep `[2,5,8]`).
- `_txItemRecsByPurpose` (rewrite), `_txItemHeuristic` (extend), resist-berry table — player UX.
- Item grid default sort (`_txState.sort.items` init by tier) — player UX.
- `_tutorGetPoolForMon` item list (add type-boosters/Eviolite) — shared (affects foe legality ceiling).
- `_TX_ITEM_REC_FILL` — player UX.
- **No foe-side code changes needed** — §2 derivation handles it. (Add a parity test asserting
  `_storyFoeItemTier`/foe gate still ≤ player tier at every city after the retune.)

## 8. Balance numbers needing your sign-off

1. Tier-1 additions: Eviolite + the type-boost item list (exact list).
2. Tier-3 demotions: Heavy-Duty Boots, Assault Vest → tier 2 (yes/no).
3. Keep belt-unlock cities at `[2,5,8]`? (recommended yes.)
4. Resist berry as a *default* slot vs only when the mon has a 4× weakness (recommended: include
   for any ≥2× worst weakness, prefer 4×).
