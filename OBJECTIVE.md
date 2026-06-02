# OBJECTIVE — what we're building and what "good" looks like

> **STATUS: DRAFT — needs the maintainer's correction.** Claude inferred this from the code and existing docs; the lines marked **[confirm]** are educated guesses about *your* vision. Once you correct them, this becomes the north-star every agent reads (via `CLAUDE.md`) before deciding *how* to build. Division of labor: `CLAUDE.md` = the rules & what's in scope; **this file = what we're aiming for and why.** Keep it to one page.

## In one sentence

A polished, single-player, **Pokémon-style story campaign** that runs entirely in the browser — no install, no server — and replays **deterministically** from a seed.

## Who it's for  **[confirm]**

A personal/passion project shared with fans of classic Pokémon battling who want a self-contained story run they can play in a browser tab. Not a commercial product; not multiplayer-first.

## The experience we're protecting (the "feel")

- **A journey with structure** — cities, gyms, a rival who adapts to your team, a mystery figure, a post-game. Each beat should feel intentional.
- **Fair-but-tuned difficulty** on a flat-Lv50, 3-axis curve: the challenge comes from team-building and type play, **not** from grinding levels. *(Balance numbers are maintainer-owned — see `docs/PROGRESSION_CURVE_MASTER.md`.)*
- **Determinism is a feature, not an accident** — the same seed always plays out identically, so runs are shareable and replays are trustworthy. This is why we use seeded RNG everywhere, never bare `Math.random()`.
- **Polish over scope** — the game is ~99% feature-complete. We refine what exists; we do not bolt on new systems.

## What "good / done" looks like

- A new player finishes the story without hitting a broken beat, a confusing gate, or a save that won't load.
- Every gym / rival / figure encounter feels deliberate — right level, right team, a line of flavor — with **no generic placeholders**.
- A returning player's old save still loads and migrates cleanly.
- Any change an agent makes can be **proven not to regress** anything (a test exists).

## What we are NOT building (scope guard — mirrors `CLAUDE.md`)

- ❌ Online PvP / Quick Play / Battle Frontier as *active work* (they exist in code but are out of scope).
- ❌ The five permanently-cut systems (Black Market, Illegal Dealer, wager battles, Trader, Itinerary scaffolding).
- ❌ New large systems. The default answer to "should we add X?" is **no** unless X directly serves the story-polish objective above.

## Current phase

Story-mode, normal-difficulty **polish**. Open work lives in `agent-state/ISSUE_LEDGER.md`; documentation hygiene in `agent-state/DOC_HEALTH_AUDIT.md`.

---
*To adopt: correct every **[confirm]** line (and anything else that's off), then change STATUS to `ADOPTED — <date>` and delete this footer.*
