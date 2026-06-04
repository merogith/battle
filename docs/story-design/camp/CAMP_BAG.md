# Camp Bag — out-of-battle item access at camp (v1)

> Part of the [Camp System spec](./README.md). Adds a **Bag** action to the camp hub:
> **view the inventory + use items out of battle.** Reuses the existing story-bag UI and the
> already-persisted inventory — **save-neutral.** Anchors symbol-first (resolve with `find-anchor`;
> line numbers drift). **Story flow & saves are sensitive — read `STORY_MODE_FLOW.md` first.**

---

## 1. Concept & why
Camp today offers: bond (minigames) · sort party · return-to-city · break. Adding a **Bag** gives
the player **agency between events** (a reason to engage with camp beyond bonding) and a natural
home for items.

**v1 is view + out-of-battle use only** — and the bag is deliberately **not** an item-economy or
crafting system. (Gathering & cooking live in the **mini-games as flavor / staged micro-games**,
not as a resource loop that feeds the bag — see [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md) §10b.)
This is the maintainer's "add a bag to the camp site," scoped to the cheap, save-neutral slice.

## 2. What already exists — reuse, don't build
Three read-only facts (resolve exact anchors with `find-anchor`):

- **Inventory state (persists):** `sm.inventory` (a `{ itemId: count }` map — `potion`,
  `rareCandy`, `vitamin`, `heartScale`, `mint`, `abilityCapsule`, `wishingPiece`,
  `expShareVoucher`, …) and `sm.balls` (`{ poke, great, ultra, master }`).
- **Bag UI (exists):** `#modal-story-bag` modal + `#story-bag-grid` + `.story-bag-item` CSS, and
  an in-battle `openBag` command (gated by `settings.storyBattleItems`).
- **Item effects (exist):** items already resolve to effects when used in battle.

→ **Camp Bag = surface the SAME modal/grid from the camp hub in a "field" mode**, and wire the
existing item effects to an **out-of-battle target** (a party slot instead of a battle combatant).

## 3. The camp Bag action
- Add a **Bag** entry to the camp hub menu (`screen-story-camp`, [`CAMP_FLOW.md`](./CAMP_FLOW.md) §4).
- Opens `#modal-story-bag` in **field mode**: no battle context, so "use" targets a **chosen
  party Pokémon** (via the existing party/summary panel) and **consumes no turn.**
- **Field-usable (v1):** the consumables that already have out-of-combat meaning —
  heal (`potion`/revive), `rareCandy` (level up), `vitamin`, `mint` (nature), `heartScale`
  (relearn), `abilityCapsule`. Reuse each item's existing effect function; only the **target
  source** changes (party slot vs battle mon).
- **Hidden/greyed in field mode:** battle-only items (X-stat boosters; Poké Balls — nothing to
  catch at camp).

## 4. Behavior flag (needs sign-off)
Using items **outside battle** is a **behavior addition** → **maintainer sign-off before it
ships** (per `CLAUDE.md`). The implementing agent proposes the diff; the user approves.

## 5. ⚠ Balance flag — healing between every event (MAINTAINER decision)
**Camp fires between *every* non-city→city transition.** If full healing (potions/revives) is
freely usable at camp, **mid-route attrition disappears** — the difficulty curve assumes you
arrive at some fights partway worn. This is exactly the kind of balance call the maintainer owns.
Pick one:

- **A — Self-limiting (recommended):** healing items *are* field-usable, but you only have what
  you bought (finite `potion` stock); **no** free Center-style full heal at camp. Attrition still
  bites if the potion economy is tuned. *Why:* preserves the curve without a special rule.
- **B — Utility-only at camp:** field-use allows `rareCandy`/`vitamin`/`mint`/`heartScale`/
  `abilityCapsule` (progression/utility) but **not** healing/revives. *Why:* zero curve impact.
- **C — Free heal at camp:** camp doubles as a rest point. *Why:* max convenience but **flattens
  difficulty** — only if that's the intent.

Default to **A** unless the maintainer says otherwise. Sanity-check against
`docs/PROGRESSION_CURVE_MASTER.md`.

## 6. Save schema
**Save-neutral.** `sm.inventory` and `sm.balls` already persist; field-use mutates the same
counters and `save()`s as today. **No new `sm` fields, no migration.** (A future "field-use log"
would be an additive knob — default none.)

## 7. Scope fence
- **IN (v1):** a camp **Bag** action; **view** inventory; **field-use** of the already-defined
  consumables on a party Pokémon; reuse `#modal-story-bag`.
- **OUT (not this feature):** any **crafting / item economy.** Gathering & cooking are **mini-game
  themes** ([`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md) §10b), **not** a resource loop that feeds
  the bag — the bag never gains a crafting system. Held-item management, selling, and any new
  consumable *types* are independent later knobs (new item **data** on the existing `SAVE_VER`
  24→25 bump; no timeline change), decided separately.

## 8. Cinematic / UX
Keep it instant — open modal, pick item, pick target, apply, SFX (`window.StoryFx.playSfx`:
`sparkle` / `achv`) + a small toast, back to the camp hub. No scene, no wall. Consistent with the
"camp is brief by default" rule ([`CAMP_FLOW.md`](./CAMP_FLOW.md) §4).

## 9. Test plan (leave-behind)
- Camp **Bag** opens `#modal-story-bag` from `screen-story-camp` and closes back to the hub.
- Field-use of a `potion` on a damaged party member heals it; **no turn consumed**; `save()` called.
- Battle-only items are **hidden/greyed** in field mode.
- **Save-neutral:** no new `sm` fields; a pre-existing save opens the camp bag with no migration.
- The chosen §5 policy is enforced (e.g. option B → healing items are not field-usable at camp).

## 10. Decisions
- **LOCKED (maintainer, 2026-06-04):** v1 = **view + out-of-battle use**; reuse `#modal-story-bag`;
  **save-neutral**; the bag is **not** a crafting/economy system — gathering & cooking are
  **mini-game themes** (see [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md) §10b), not a bag loop.
- **Knobs [MAINTAINER]:** the §5 healing policy (default **A**, self-limiting) · which items are
  field-usable · whether any field-use carries a cost/limit.
