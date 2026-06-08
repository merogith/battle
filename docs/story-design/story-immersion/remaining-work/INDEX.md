# Story Immersion — Remaining Work (Stream 4 + leftovers)

> **Entry point for the next session.** The 4-Stream "Story Immersion" effort shipped
> Streams 1–3 (audit, dialogue, cinematics) to branch `claude/wonderful-curie-0j17on`
> (PRs #241–#250, all merged). This folder captures **everything that did NOT ship** —
> almost all of it the never-written **Stream 4 (Reactivity / engine wiring)** plus a
> couple of partials from Stream 3.
>
> **Anchors verified 2026-06-08** against `battle.html` on `claude/wonderful-curie-0j17on`.
> Symbol names are durable; line numbers drift — re-resolve with the `anchor` skill or
> `node scripts/debug/symbol-index.mjs --lookup <symbol>`.

---

## The 4 streams, recapped

| Stream | Lane | Status |
|---|---|---|
| 1 | Narrative Coherence & Causality (audit) | ✅ Done — G-series flow bugs fixed (G1/G2/G3/G4/G9) |
| 2 | Dialogue & Writing / Voice | ✅ Done — copy + decisions shipped; handed 6 wiring items down |
| 3 | Visual & Cinematic / Presentation | 🟡 Mostly done — impact layer partial (TASK-04), H3-2 + raid lore open |
| 4 | Reactivity & Player Agency / world-state, save, sequencing | 🔴 **No doc was ever written.** The other 3 streams piled their wiring here. Almost entirely unbuilt. |

Streams 1–3 **designed and decorated** the between-fight layer (pacing, prose, cinematics).
Stream 4 is the **structural engine that was supposed to carry it** — and it's the gap.

---

## The task files (grouped)

| File | Tasks bundled | Sign-off? | Save bump? | Size |
|---|---|---|---|---|
| **TASK-01** — Navigable Nodes & Camps | H4-3 slot dispatcher · §2.4 camp/diamond inversion · NAV-1/NAV-2 back-forward nav | ✅ flow change | ✅ SAVE_VER | 🔴 Large (the foundation) |
| **TASK-02** — Arrival & Rest-Stop Reactivity | H4-4 last-road-context · H2-5 arrival lines (copy ready) · H3-2 diegetic anomaly surface | 🟡 light | ❌ | 🟢 Contained — **best first slice** |
| **TASK-03** — Dialogue Data Wiring | bark wiring · H2-3 substitution bridges (copy ready) · 7c pool externalization · 7b speaker schema | 🟡 behavior-preserving | ❌ | 🟢 Mostly mechanical |
| **TASK-04** — Battle Impact Layer | §6.1 hit grading · §6.2 hit-stop · §6.3 screen-shake wiring | ✅ game-feel/visual | ❌ | 🟡 Medium |
| **TASK-05** — Content Gaps | §4.5 `_RAID_LORE` authoring · D3(b) canon mirror foe (`main.battle2`) | 🟡 D3(b) is balance | ❌ | 🟢 Authoring |

---

## Dependency graph (do these in order)

```
TASK-02 (arrival/rest-stop surface) ─┐
TASK-03 (dialogue data wiring)       ─┤→  all four are INDEPENDENT, can ship in any order
TASK-04 (impact layer)               ─┤    (no save-schema risk, contained diffs)
TASK-05 (content gaps)               ─┘

TASK-01 (slot dispatcher + nav) ──── the BIG one; gated on STORY_OVERHAUL_PLAN.md Phase E.
                                     H3-2's diegetic surface (TASK-02) is the surface
                                     TASK-01's "diamonds" will reuse, so doing TASK-02
                                     first de-risks TASK-01. Needs maintainer sign-off
                                     (flow change) + SAVE_VER bump + migration.
```

**Recommended order:** TASK-02 → TASK-03 → TASK-04 → TASK-05 (the contained wins), then
TASK-01 as its own scoped effort with a proposed diff + sign-off (per `CLAUDE.md`: it
changes story flow + save schema).

---

## Source docs (the "what/why" behind each task)

- `../narrative-coherence.md` — Stream 1; §6 handoff list (H2-/H3-/H4-), §2.4 camp/diamond.
- `../dialogue-and-writing-CONCLUSION.md` — Stream 2; §B (H2-3 copy), §C (H2-5 copy), §E (Stream-4 handoffs).
- `../visual-and-cinematic.md` — Stream 3; §6 impact layer, §4.5 raid lore, H3-2.
- `../../../STORY_OVERHAUL_PLAN.md` — §4 single event model + Phase E (the TASK-01 machine).
- `../../STORY_FLOW_AUDIT.md` — §7a node-based flow, §8e NAV-1/NAV-2 (TASK-01 nav half).

## Ground rules (from `CLAUDE.md`)

- No game-behavior change ships without sign-off (TASK-01, TASK-04, D3(b) in TASK-05).
- Every change leaves a deterministic jsdom test (`tests/helpers/load-engine.js`).
- Seeded `storyRngNext` for every user-visible roll — never `Math.random()`.
- Sloppy-mode hazard: mutate module-level placeholders via `Object.assign`/`push`, never `X = fetched`.
