# Handoff — 2026-05-15

## Current branch
`claude/polish-story-mode-battle-lT4sx` (pushed: no — needs `git push -u`).

## Commits this session (newest first)
1. `0250ded` story: extra Red lines and defensive currentEnemyLock validation
2. `553b2dc` story: cross-run "Career runs cleared" counter and richer Hall of Fame
3. `c27ddf7` story: replace user-facing 'Pokemon' with 'Pokémon'
4. `7c6fe63` story: per-leader badge name and victory voice across roles

## Phase plan vs. progress

| Phase | Status |
|---|---|
| Auto-discovery + codebase map | DONE (`agent-state/CODEBASE_MAP.md`) |
| Hardcore residue audit | CLEAN (only migration line remains) |
| Generation toggle leakage audit | CLEAN (species-only filter confirmed) |
| Eviolite Late-Evo rule | CLEAN (`sp.evos.length > 0`, gen-independent) |
| Settings toggle positive/negative | CLEAN |
| Build generator competence | MOSTLY CLEAN (move learnability unvalidated — Smogon CSVs assumed curated) |
| Per-leader/elite/champion victory voice | DONE |
| NG+ run counter | DONE (`pbs_story_meta`, simple) |
| Typography "Pokémon" diacritic | DONE for user-facing strings |
| Red voice | LIGHT POLISH (stage directions added; still mostly silent by design) |
| Defensive enemy-lock validation | DONE |
| CHANGELOG.md | DONE (Unreleased section, this session) |

## What's still open vs. DoD

The mission's full Definition of Done is broader than one session. Outstanding:

- **Per-encounter "first-clear" celebrations.** `sm.firstClears = {gym1: true, …}` only-on-first-time confetti was suggested in audit §3.9. Not done.
- **Casino slot machine.** Casino is still a literal coin flip (audit §1.10, §3.7). Big-ish, not done.
- **City6 Professor button** is intentionally hidden when team is full (Mystery Figure only fires at City8 gate). Behavior matches code, but `CITY_PROFESSOR_SLOTS` data suggests Clemont was meant to be available — data-vs-code inconsistency. Not blocking.
- **Daily seed handler** (audit §5.2). Not done.
- **Speedrun timer** (audit §5.3). Not done.
- **Achievement bar** (audit §5.5). Not done.
- **Real city names with taglines.** `GYM_LEADER_CITY_NAMES` exists and the hub label already swaps in real names per assigned leader, but the rest of the hub UI doesn't reuse it for scene-setting copy. Could extend.
- **Confusion / partial trap / ice thaw / harvest** use bare `Math.random` — story seed doesn't reproduce these. Intentional? Probably yes for cosmetic feel; deterministic combat would need a routing pass.
- **Battle frontier mechanics scaling** is deferred per spec §14b.
- **RELEASE_NOTES.md** — write when every DoD box passes.

## Resume protocol next session

1. Read `agent-state/CODEBASE_MAP.md` first.
2. Re-run a quick auto-discovery (file sizes, `git log --oneline -20`, `npm start` smoke).
3. `node --check` over the inline JS as a fast syntax gate (see procedure in CODEBASE_MAP).
4. Pick from the "still open" list. Smaller-first; confirm in browser before next item.

## Verification status
- `node --check` on extracted inline JS: clean.
- `node scripts/dev-server.cjs` serves `battle.html`: HTTP 200, ~2.06 MB.
- No automated test suite exists. Manual browser play required for UI flows.

## Files touched
- `battle.html` (data tables, save layer, Hall of Fame, victory overlay, story menu, typography)
- `agent-state/CODEBASE_MAP.md` (new)
- `agent-state/HANDOFF.md` (this file, new)
- `CHANGELOG.md` (new — Unreleased section)
