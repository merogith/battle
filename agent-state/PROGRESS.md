# PROGRESS

## Current phase
Phase 1 in progress. SETTINGS_MATRIX.md written. Findings 005–011 logged from direct code reads. Grade table reconciled. EVL Late-Evo verified on static check (live @pkmn/dex lookup).

## Last completed action
- Created `agent-state/`
- Read `package.json`, `README.md`, top-level layout, data file schemas
- Spot-read `STORY_MODE_FLOW.md` (EMPTY — finding logged)
- Inspected `data/builds/gen9.json` shape (Smogon-style sets per species per tier per gen)
- Dispatched two parallel discovery agents:
  - `a9501e4d1bbebf11c` — battle-engine + data map of `battle.html`
  - `a68e6a53a949d0a79` — story-mode flow / grades / save shape map

## Next 5 actions
1. Wait for both Explore agents; assemble `CODEBASE_MAP.md` from their output
2. Run baseline test/smoke (note: no test framework; `npm start` is the dev server)
3. Begin Phase 1: write `STORY_MAP.md`, `COVERAGE.md`, `SETTINGS_MATRIX.md` skeletons
4. Dispatch Phase 2 specialist audits (parallel, read-only) — prioritize: GEN toggle regression, EVL Late-Evo matrix, SETTINGS_MATRIX toggle list, MOV/ABI/ITM coverage spot checks
5. Begin `FINDINGS.md`

## Notes / early findings (pre-formal)
- `STORY_MODE_FLOW.md` is 0 bytes — referenced by README/docs as canonical. **Likely BLOCKER for docs / GDC axis.**
- Data files are Showdown-style gen-overlayed JSON (top-level key = gen number, `inherit: true`). This means *some* gen-shape behavior is data-baked, not a runtime filter. Spec says gen toggle is **species-only** filter — need to verify the engine isn't accidentally applying gen-N item/move descriptions.
- No formal test framework in `package.json`. Will need to either propose one or use scripted in-browser harnesses. For now: track this as a constraint, not a blocker.
- `battle.html` is 28,775 lines + ~2MB. All audits must be Grep/Read-targeted, never full reads.
