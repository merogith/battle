# Camp System — Decisions Addendum (2026-06-08 session)

> Companion to [`README.md`](./README.md) §5 (the 2026-06-03 maintainer review that
> locked D1–D10). This addendum records a **second maintainer pass (2026-06-08)** that
> (a) **re-confirmed** the locked flow decisions against a fresh description of the desired
> feel, and (b) **added two small deltas**. Nothing here overturns D1–D10 — it confirms and
> extends them. The spec docs remain the canon; this is the change-log on top.

---

## 1. Re-confirmations (locked decisions, restated against the new brief)

The maintainer re-described the desired feel; each maps onto an already-locked decision:

| Maintainer's words (2026-06-08) | Locked decision it confirms |
|---|---|
| "Camp / pace-stop **after every node/fight**" | **D8** — camp fires on all non-city→city route transitions |
| "Go back to city is **free, progress preserved**" | **D7** — free round-trip via `campReturnPoint` |
| "**Minigames only affect the relation** with Pokémon" (not loot) | Micro-games are pass/fail → +1 bond; **no item economy** (`CAMP_BAG.md` §7) |
| "Each relation gives **a single stat boost**" | **D1 + D2** — 6-path↔6-stat bijection, **+5%/path**, binary at-master |
| "**No heal** needed — battles already auto-heal" | Camp adds **no heal** (it was never in scope; confirmed not to add one) |
| "Save / checkpoint + sort party" | Camp hub: party sort (§6) + "Break camp" `save()` already act as the checkpoint |
| "**Cooking / crafting** minigame" | Already present — the **Feed!** micro-game (Nurture → SpA); `CAMP_MINIGAMES_PALETTE.md` covers gather/cook themes |

→ **No spec change required for any of the above.** The existing design already delivers them.

---

## 2. DELTA 1 — Fishing micro-game → **Devotion path (→ HP)**

**New.** A **Fishing** micro-game is added, framed as **quiet companionship** (sitting
together at the water, patience), and feeds the **Devotion** path (`devotion` → `hp`).

Rationale: it's the most natural fishing vibe, and HP/Devotion is **always-neutral**
temperament (no Nature touches HP, per `BONDING_RELATIONSHIPS.md` §4), so fishing is a calm,
predictable grind that never feels like a personality mismatch.

**Where it slots in (no engine change — content/data only):**

- `CAMP_MINIGAMES.md` §2 — extend the **Stargaze (Devotion → hp)** action pool from 3 to 4:
  `holdclose · whisper · gaze · **fish**`. Pools may be any size (§10 phasing note), so this
  is additive.
- `data/camp/actions.json` — `"stargaze": { "path":"devotion", "games":[...,"fish"] }`.
- `data/camp/microgames.json` — add a `fish` entry. Proposed primitive: **`holdRelease`**
  (cast/wait for the bite, strike in the green) or **`tapTiming`** (tap the instant the
  float dips) — primitive choice is a tuning knob, both already exist in the §5 toolkit.
- Copy/tone: edgy-calm, the "linger a beat too long" register the Devotion games use (D10).

**It still only feeds the bond** — fishing grants **+1 Devotion on success, no item/catch**,
consistent with "minigames only affect the relation." (If a fishing *encounter* minigame for
catching wilds is ever wanted, that's a **separate** feature from camp bonding — out of scope here.)

---

## 3. DELTA 2 — PC-box access at camp: **DEFERRED to v2** (confirms spec scope)

The maintainer considered adding party↔PC-box swap at camp and chose to **defer it to v2**.
This **matches the spec's current scope** (`BONDING_RELATIONSHIPS.md` §10: "PC box… can't be
tended… OK for v1"; `CAMP_FLOW.md` §6: party **reorder/lead only**).

→ **v1 camp hub stays:** Spend time with team · Sort party (reorder/lead) · Head back to
city · Break camp. **No box swap in v1.** Revisit in a later pass.

---

## 4. Net effect on the roadmap

- **PR D** (`IMPLEMENTATION_ROADMAP.md` §3) gains **one extra micro-game** (`fish`) in the
  Devotion pool. No new primitive required if it reuses `holdRelease`/`tapTiming`. No phase,
  risk, save, or sign-off change.
- All other PRs (A/B/C/E/F) unchanged.
- **Box swap** is explicitly **not** in any v1 PR — note for whoever picks up v2.

---

## 5. Provenance
Maintainer decisions captured live, 2026-06-08 session (questions + answers in the working
chat). Balance numbers remain **[MAINTAINER]**-owned per `CLAUDE.md`; this addendum changes
no balance value — `fish` inherits the same **+1 / +5%-at-master** economy as every other
micro-game.
