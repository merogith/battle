# `data/builds/` — fallback mirror of `data/builds.csv`

> **Source of truth: `data/builds.csv`.** The `gen{4..9}.json` files in this
> directory are a *fallback mirror* used only when the CSV fetch fails
> (file:// boot, offline-cache miss) plus one read of `gen9.json` for Tera
> usage stats. Gameplay reads `csvBuilds` populated from `builds.csv`.

If you want to retune movesets / EVs / natures, **edit `data/builds.csv`**
— the gen JSON files have no gameplay effect under normal serving. They
exist as a defensive fallback so the game still has competitive sets if
the CSV fails to load.

If you change the CSV, regenerate this mirror (or accept the drift —
falls only matter on the offline fallback path).

This was filed as ISSUE-016 in `agent-state/ISSUE_LEDGER.md` (P1, data,
"Retune risk"). The note here is the agreed mitigation; a regen script
+ CI sync check is the longer-term option if the mirror starts drifting.
