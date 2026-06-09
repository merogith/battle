# TASK-01 — Navigable Nodes & Camps  → ⚠ SUPERSEDED

> **This task is superseded.** When it was written (2026-06-08, early) the camp/back-nav
> design hadn't been located. It has since been found: a **complete, maintainer-approved
> design package** lives at **[`../../camp/`](../../camp/)** (decisions D1–D10 locked
> 2026-06-03; second pass 2026-06-08 in [`camp/DECISIONS_2026-06-08.md`](../../camp/DECISIONS_2026-06-08.md)).
>
> **Do not implement from this file.** Use the `camp/` spec — it is richer, grounded to
> live anchors, and ships its own [`IMPLEMENTATION_ROADMAP.md`](../../camp/IMPLEMENTATION_ROADMAP.md)
> (PRs A–F).

---

## How the camp spec covers (and exceeds) this task

| This task's idea | Where it lives in `camp/` |
|---|---|
| "Go back to city OR push forward" pace stops | `CAMP_FLOW.md` §5 (free round-trip, D7) |
| Camp / rest-stop as a between-events buffer | `CAMP_FLOW.md` §1–4 (the buffer + hub, D6/D8) |
| Camp after every node | `CAMP_FLOW.md` §2 (all non-city→city transitions, D8) |
| Minigames | `CAMP_MINIGAMES.md` (18 micro-games) + `CAMP_MINIGAMES_PALETTE.md` |
| "New small mechanics" (bond → stat) | `BONDING_RELATIONSHIPS.md` (6 paths → +5%/stat) |
| Camp cinematics | `EVENT_CINEMATICS.md` |
| Save schema | one `SAVE_VER` 24→25 bump, specced in the roadmap §4 |

## What this task got that the camp spec did NOT originally have
Two deltas from the 2026-06-08 maintainer pass, now captured in
[`camp/DECISIONS_2026-06-08.md`](../../camp/DECISIONS_2026-06-08.md):
- **Fishing** micro-game → **Devotion path (→ HP)**.
- **PC-box access at camp** → **deferred to v2** (v1 = party-sort only).

## The one piece NOT in the camp spec: NAV-2 (choose-which-city)
The camp spec's back-nav (D7) is a **round-trip to the *immediately* previous city**.
The older `STORY_FLOW_AUDIT.md §8e NAV-2` idea — letting the player choose *which* prior
city to return to — is **not** in the camp spec and is a possible later enhancement. Flag it
for v2 if wanted; the data exists (`lastStoryCityEventIndexAtOrBefore`, `cityIndexFromEventIndex`).
