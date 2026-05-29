# Story features — placement, shops, flow, dialogue status

This doc ties **new systems** to the existing timeline in [`STORY_MODE_FLOW.md`](../STORY_MODE_FLOW.md) and [`battle.html`](../battle.html) (`STORY_EVENTS_RAW`, `POKEMART_ITEMS`, `DEPT_ITEMS`).

> ## 2026-05-28 — Cut sections removed
>
> Five spec systems were authored here but never shipped and are now **permanently de-scoped** (cut, not deferred):
> - §3 Black Market
> - §3.5 Illegal Dealer NPC
> - §6 Battle for Pokémon (wager)
> - §7 Pokémon Trader (City4 swap)
> - Full Itinerary scaffolding (`runItinerary`, `sm.itineraryProgress`)
>
> Verified absent from `battle.html` (0 code references). Past spec text lives in git history; the original design notes are preserved in `agent-state/findings/spec-drift-auditor-20260522T071407Z.md`.
>
> Section numbering preserved (§§1, 2, 4, 5, 8, 9, 10) so cross-doc anchors don't break.

---

## 1. Poké Balls (cheap, catch-mode only)

| Item | Price | Role |
|------|-------|------|
| Poké Ball | **200** | Default; fine for G3–G4 wild rolls |
| Great Ball | **300** | Mid tier |
| Ultra Ball | **500** | Best standard ball; keep farming affordable |
| Master Ball | **~2000–3000** (tune) | Guaranteed; still cheap vs old 50k — limit **1 per run** or **2** if too easy |

**Sold at:** Poké Mart **only when** `catchMode` is on (new rows beside legal items). **Not** in Department Store (keeps mart = consumables + balls).

**Inventory:** `sm.inventory.pokeball / greatBall / ultraBall / masterBall`; teach `enterShop('mart')` + bag + wild encounter UI to consume on throw.

---

## 2. PC Box — where and when

| Access | Rule |
|--------|------|
| **Every city hub** | Button: `PC Box` when `catchMode` **or** `sm.pcBox.length > 0` (so late toggles still work). |
| **Not** on route / in battle | Same pattern as Mart — city `renderCityActions` only. |

**Flow fit:** After any catch, if party is 6 and PC has space → auto-deposit; if **PC full + party full** → catch **fails** (already decided).

---

## 3. Black Market — DE-SCOPED, see banner above

## 3.5 Illegal Dealer NPC — DE-SCOPED, see banner above

---

## 4. Safari Zone (type-themed)

| Trigger | From **run itinerary** (not random %): e.g. after **badge 3** or **City3** segment |
|--------|----------------------------------|
| **Fee** | ~500G entry (tune) |
| **Twist** | **Type restriction** (e.g. only Fire / only Water / “cave” = Rock+Ground pool) — **good grade odds** (bias G2–G3 in pool) |
| **Mechanic** | Bait / Mud / Ball **or** quick-catch — pick one and stick to it for v1 |

Resolves **before** the next `STORY_EVENTS_RAW` battle on that segment.

---

## 5. Wild encounters

| Roll | **50% per route battle slot** (indices like 1–3, 8–10, …) when `catchMode` on |
|------|----------------------------------|
| Species | Grade from current event weights ∩ **enabled gens** |

Runs **before** trainer fight on that `proceedToNextBattle` hop. Order: **wild → trainer**.

---

## 6. Battle for Pokémon (wager) — DE-SCOPED, see banner above

## 7. Pokémon Trader — DE-SCOPED, see banner above

---

## 8. Flow checklist (integration issues to close)

| Issue | Mitigation |
|-------|------------|
| `proceedToNextBattle` order | Queue: **wild** → set `eventIndex` to route battle → `enterBattleEvent`. |
| Save mid-beat | (Itinerary/wager/trader state cut — nothing extra to persist here.) |
| Full PC + party | Wild catch fails (existing behavior). |
| `eventsOn` off | No safari; **catch + PC + balls** still work if `catchMode` on. |
| Mystery Figure / Rival | Unchanged vanilla flow; new buttons only add **parallel** actions on city screen. |
| Professor forced in City6–8 | PC does not replace Mystery gate; **legendary gate** still blocks route until visited. |

---

## 9. Dialogue & story — **readiness**

| Area | Status |
|------|--------|
| **STORY_EVENTS_RAW** | Drives cities/battles — **no** new dialogue there. |
| **Safari announcer** | Live (entry fee, type theme, rules reminder). |
| **Existing** | `TRAINER_QUOTES`, city guide, professor — already in game; extend, don't replace. |

---

## 10. Implementation order (status)

1. ✅ **SHIPPED** — Balls + inventory + mart + wild encounter + PC modal.
2. ✅ **SHIPPED** — Safari (type pool) + fee.
3. ✅ **SHIPPED** — Full dialogue fill per arc.
