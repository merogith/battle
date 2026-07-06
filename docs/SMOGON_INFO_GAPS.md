# Smogon Info Gaps — Investigation & Optimization Paths (single-battle viability)

> Scope: where the Smogon-sourced build data (`data/builds/gen{4..9}.json` → `data/builds.csv`
> → runtime `csvBuilds`) is thin or absent, what the game does about it today, and how to make
> **every** Pokémon surface a **single-battle-viable** recommendation — for both the foe roller
> and the player-facing recommendation UI (Move Tutor / Battle Dojo / Nature Rater / Colress).
>
> **Status: IMPLEMENTED (2026-07, maintainer-approved "do all").** Paths A, B, C, D, E shipped,
> plus a follow-on fix (D2) the deeper investigation surfaced. Guard test:
> `tests/suites/smogon-info-gaps.test.js`. See "What shipped" at the bottom.

## TL;DR

Coverage is actually **strong** — the headline "many Pokémon have no Smogon info" is mostly false.
The real problems are narrow and specific:

1. **Coverage:** 1,079 / 1,156 Pokémon in the builds data have ≥1 standard-singles set. Only **7
   real draftable species** have *zero* usable singles sets after the default doubles/exotic filter.
2. **The one real defect (headline):** the player-facing recommendation meta counts **exotic-format**
   sets (GodlyGift / StabMons / AAA / Mix-and-Mega / …) that the foe roller deliberately **excludes**.
   ~25 meta-relevant species (Kingambit, Flutter Mane, Magearna, Zamazenta, Iron Hands, Regieleki,
   Calyrex-Ice, Ogerpon formes, Ursaluna-Bloodmoon, …) therefore show **confident ★ recommendations
   built from sets that are illegal/nonsensical in standard singles**, instead of the honest
   "no competitive data — showing all options" banner + heuristic-synthesized set they should show.
3. **Format weighting blind spots:** 5 real singles formats are missing from `_SMOGON_FORMAT_POWER`
   (`nationaldexag`, `monotype`, `battlestadiumsingles`, `battlespotsingles`, `nationaldexmonotype`).
   Mostly harmless (they co-exist with recognised sets), except `nationaldexag` is under-rated.
4. **Offline fragility:** the `randbats` safety net is fetched live from `data.pkmn.cc` and only gen-9
   is pre-warmed. Offline, a zero-data species degrades to the last-resort `Tackle/Growl/Leer/Quick
   Attack` junk build.
5. **Thin variety:** 73 species have exactly **one** usable singles set — no roll/draft variety.

---

## How the data flows (map)

```
data/builds/gen{4..9}.json   (pkmn.cc "sets" snapshots — one bucket per Smogon format/tier)
        │  scripts/generate_builds.js   (tag each set: regular|weather|mega|z-attack|tera)
        ▼
data/builds.csv
        │  loadBuildsCSV()  battle.html:11910   → csvBuilds[name][tag] = [buildObj...]
        │     buildObj keeps _format, _category, _illegal, archetype, _*Options
        ├─────────────────────────────► FOE ROLLER: makeBuild()  battle.html:12597
        │                                  _filterBuildPool()  :13132  (drops doubles+exotic by default)
        │                                  _pickSetByPower()   :12572  (story power-weighting)
        │                                  → designed build (:12479) → randbats (:12694) → last-resort (:12709)
        └─────────────────────────────► PLAYER RECS: _tx* engine  battle.html:68855+
                                           _txAccumulateBuilds()  :68902  (usage meta)
                                           _txStarredPool()       :69307  (★ recommendations)
                                           Move Tutor / Dojo / Nature Rater / Colress
```

The two consumers apply **different** filters to the same `csvBuilds` — that asymmetry is the core bug (see G2).

---

## The gaps, quantified

### G1 — True set-availability gap: only 7 real species (LOW)

Union across all gens, after the default singles filter (drop `doubles` + `EXOTIC_FORMAT_KEYS`):

| Cohort | Count |
|---|---|
| Pokémon in builds data (all forms) | 1,156 |
| Have ≥1 standard-singles set | 1,079 |
| Zero usable singles sets — **all** (incl. Mega/Gmax/Primal formes & CAP fakemons) | 77 |
| Zero usable singles sets — **real draftable** species | **7** |

The 7: `Greninja-Ash`, `Greninja-Bond`, `Zygarde-Complete`, `Darmanitan-Zen`, `Marill`,
`Eevee-Starter`, `Pikachu-Starter` — all edge formes. Mega/Gmax/Primal names are excluded
from the draft pool anyway (handled as base + gimmick); CAP fakemons (`Aurumoth`, `Colossoil`, …) are
not real species.

**Deeper finding (this is the real severity):** these 7 do *not* fall to the Tackle-junk build —
`resolveCsvBuildEntry` / `_designedCsvMovePool` fall back to their **only** stored set, which is
exotic. So at runtime they roll **illegal-in-singles movesets** — Ash-Greninja with Urshifu's
`Surging Strikes` / `Wicked Blow` + Maushold's `Flower Trick` (a balancedhackmons "Sniper" set with
5×252 EVs); Zen Darmanitan / Complete Zygarde with Marshadow's `Spectral Thief` + Zygarde's
`Core Enforcer`; the Let's-Go starters with `Sparkly Swirl` / `Zippy Zap`. Viable-looking, but
nonsense — exactly the "not polished for singles" symptom. Fixed by D + D2 below.

### G2 — Recommendation meta counts exotic sets the roller excludes (HEADLINE / MEDIUM-HIGH)

- The foe roller drops exotic-format builds by default: `_filterBuildPool` (`battle.html:13132`) →
  `_isExoticFormat` (`:13125`) over `EXOTIC_FORMAT_KEYS` (`:13120`), gated on
  `settings.allowExoticFormats` (default **false**, `:13116`).
- The recommendation meta does **not**. `_txAccumulateBuilds` (`battle.html:68902`) excludes only
  `b._illegal` and `b._category === 'doubles'` — it **never** checks `_isExoticFormat(b._format)`.
  So GodlyGift/StabMons/AAA/Mix-and-Mega/Inheritance/Camomons sets are counted as real singles usage.
- **Consequence:** for a species whose data is dominated by exotic sets, those sets can push it over
  the sparse threshold (`_TX_SPARSE_BUILD_THRESHOLD = 10`, `:69089`), which **hides** the honest
  "no/limited competitive data" banner (`_txSparseBannerHtml`, `:71049`) and shows **confident ★
  recommendations** — StabMons coverage moves, GodlyGift EV/nature spreads built around borrowed
  base stats, Mix-and-Mega stones the mon can't legally hold, etc. This is *worse than showing no
  data*, and it contradicts the roller, which excludes exactly those sets.
- Partial existing mitigation: AAA/BH sets whose **ability** is illegal for the species are flagged
  `_illegal` at load (`:11976`) and dropped. Moves, items, natures and EVs from otherwise-legal
  exotic sets are **not** filtered.

**Blast radius (real, non-fakemon species):**

- **Pushed over the sparse gate purely by exotic sets** (banner wrongly hidden): 39 entries, ~25 real
  meta species incl. `Kingambit`, `Flutter Mane`, `Zamazenta`(std 7 / exotic 19), `Regigigas`,
  `Solgaleo`, `Ogerpon-Hearthflame`, `Ursaluna-Bloodmoon`, `Baxcalibur`, `Kleavor`, `Tinkaton`,
  `Sinistcha`, `Raichu-Alola`, `Weezing-Galar`, `Slowbro-Galar`, `Zacian-Crowned`.
- **Recs ≥50 % exotic-sourced** (materially polluted): incl. `Magearna` (12/15), `Iron Hands` (11/12),
  `Regieleki` (11/11), `Calyrex-Ice` (10/10), `Palafin`, `Gouging Fire`, `Deoxys`, `Iron Bundle`,
  `Necrozma-Dawn-Wings`, `Palkia-Origin`.

### G3 — Format power-weighting blind spots (LOW)

`_SMOGON_FORMAT_POWER` (`battle.html:12551`) recognises ~16 tiers; unknown formats score neutral 0.5
(`_smogonSetPower`, `:12562`). Missing **singles** formats and their mon-entry counts:

| Format | Entries | Should score ≈ |
|---|---|---|
| `monotype` | 303 | 0.60 (type-locked teams; viable but off-standard) |
| `battlestadiumsingles` | 191 | 0.60 (Lv50 flat, restricted) |
| `nationaldexmonotype` | 151 | 0.60 |
| `battlespotsingles` | 108 | 0.60 |
| `nationaldexag` | 41 | ~1.00 (Anything Goes = strongest — currently under-rated at 0.5) |

Only **1** real species (`Gouging Fire`) is *entirely* weighting-blind (its sole usable set is
`battlestadiumsingles`), so this is mis-weighting, not a hole — but `nationaldexag` at 0.5 means AG
threats can roll under-powered on late-game story stages.

### G4 — Randbats safety net is online-only + gen-9-only (MEDIUM)

- `fetchRandbatsForGen` (`battle.html:14513`) fetches `https://data.pkmn.cc/randbats/genNrandombattle.json`;
  no local copy is committed. Boot pre-warms **only gen 9** (`:11735`).
- The `makeBuild` randbats fallback (`:12694`) loops gens 9→4 but only gen 9 is populated in practice.
- **Offline**, `_randbatsCache` is `{}`, so a species with no CSV set and an empty designed pool falls
  straight to the last-resort `['Tackle','Growl','Leer','Quick Attack']`, zero EVs, Hardy build
  (`:12709`) — the only genuine "garbage" outcome, identical across Story / Quick Play / Gauntlet.

### G5 — Thin variety: 73 single-set species (LOW)

73 real species have exactly one usable singles set (e.g. `Beldum`, `Braixen`, `Dudunsparce`,
`Falinks`, `Cursola`, `Dialga-Origin`). They always roll the same build; `smartDraftPool` and story
power-weighting have nothing to choose from. Not a viability problem — a *variety/polish* one.

---

## What already works (so we don't over-build)

- **Designed-build engine** runs in **every** mode (~30 % at default `csvBuildMix = 0.7`): the
  data-driven **archetype** engine in Story (`makeDesignedBuild` archetype branch, `:12497`) and the
  **legacy role-config** engine elsewhere (`:12520`). Both produce legal, role-coherent, single-battle
  sets from base stats + the evo-line's pooled legal moves — *provided that pool has ≥3 moves*.
- **Heuristic recommendation synthesis** already exists for truly-sparse species: `_txMoveHeuristic`
  / `_txItemHeuristic` / `_txNatureHeuristic` / `_txAbilityHeuristic` (`:69611`–`69777`) and the
  "✨ Suggest a balanced set" builder `_txMoveRecsByPurpose` (`:69860`) synthesise a legal STAB /
  coverage / status set with an honest "no competitive usage data" caption. The empty-data path is
  **graceful**; only the *thin-exotic* path (G2) is misleading.

---

## What shipped

All changes live in `battle.html` unless noted; guard test `tests/suites/smogon-info-gaps.test.js`.

### A — Exotic sets excluded from the recommendation meta *(fixes G2)*

`_txAccumulateBuilds` (`battle.html:68926`) now skips `_isExoticFormat(b._format)` sets unless
`settings.allowExoticFormats`, mirroring the existing `_category === 'doubles'` guard and the roller's
`_filterBuildPool` policy. The ~25 contaminated species drop below the sparse gate and show the honest
"no/limited competitive data" banner + heuristic-synthesized singles set instead of confident recs
sourced from GodlyGift / StabMons / AAA. `_format` was already stored on every build object, and the
existing `_pbsInvalidateTxMeta()` call after `loadBuildsCSV` rebuilds the cache after settings load, so
no extra wiring was needed. Verified live: 14 species flip `sparse` when the setting is toggled
(Zamazenta, Palafin, Flutter Mane, Scream Tail, …); Garchomp's ability usage tightened from 94.5 % →
95.4 % (exotic noise removed) — the tutor-card snapshot baseline was regenerated to match.

### B — `_SMOGON_FORMAT_POWER` recognises 5 more singles formats *(fixes G3)*

Added to the frozen table (`battle.html:12559`): `nationaldexag: 1.00`, `monotype`/`nationaldexmonotype`/
`battlestadiumsingles`/`battlespotsingles`: `0.60`. Fixes the `nationaldexag` under-rating and gives the
monotype / Battle Stadium/Spot sets deliberate (not accidental-neutral) weighting. *Balance numbers —
tune in that table.*

### C — Offline-safe randbats mechanism *(fixes G4)*

`fetchRandbatsForGen` (`battle.html:14513`) now tries a local `data/randbats/genN.json` snapshot first,
then falls back to the live pkmn.cc API (same local-then-API shape as `fetchSmogonSetsForGen`). Behaviour
is unchanged wherever the snapshot isn't present. `scripts/fetch-randbats.mjs` bakes the snapshot.
**Data step deferred:** this session's egress policy blocks `data.pkmn.cc` (403), so the snapshot file
itself is not committed — run `node scripts/fetch-randbats.mjs [--all]` on a machine/CI with pkmn.cc
access and commit `data/randbats/`.

### D — Curated single-battle floor for the no-clean-set formes *(fixes G1 tail)*

`_CURATED_SINGLES_SETS` (`battle.html:12606`) hand-authors one legal singles set for each of the 7 formes.
`makeBuild` prefers it whenever a species has **no clean** (non-exotic, non-doubles, non-illegal) set in
its resolved pool — which is exactly these formes, since `_filterBuildPool` otherwise falls back to their
exotic set. It's a *floor*, not a draft entry: `getDraftPool` reads `csvBuilds` keys, not this table, so
draftability is unchanged. Result: Ash-Greninja now rolls Hydro Pump / Dark Pulse / Water Shuriken /
Ice Beam + Battle Bond instead of the illegal Sniper hackmons set.

### D2 — Designed-build move pool respects the exotic/doubles policy *(follow-on, the crucial one)*

The investigation showed D alone was insufficient: `_designedCsvMovePool` (`battle.html:12267`) seeded the
designed engine's legal-move pool from **all** csv sets including exotic ones, so ~30–50 % of the time the
"designed" foe re-introduced the exact illegal moves (Spectral Thief, Surging Strikes, Sparkly Swirl…).
It now skips exotic/doubles sets under the same policy. For an exotic-only species the pool goes empty →
`makeDesignedBuild` bails (its `<3` guard) → the curated floor (D) takes over. Net: across CSV **and**
designed paths, the 7 formes never roll another species' signature move (locked by the guard test).

### E — Variety pad for single-set species *(fixes G5)*

`makeBuild` (`battle.html:12643`) raises the designed-build probability to ≥50 % for a species whose
usable standard pool is ≤1 set, so it isn't frozen to one identical build every roll. Pure variety — it
changes neither which sets exist nor their power, only how often the (already-legal) designed alternate
appears.

## Follow-ups left open

- **Commit the randbats snapshot** (C's data half) from a network-allowed environment.
- **G5 tail:** 73 single-set species now get designed variety, but a maintainer could still curate a
  second Smogon-style set for the most-played of them if more flavour is wanted.
- Balance numbers in B (`0.60` mid-tier) are first-pass — retune to taste.
