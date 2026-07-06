# Smogon Info Gaps — Investigation & Optimization Paths (single-battle viability)

> Scope: where the Smogon-sourced build data (`data/builds/gen{4..9}.json` → `data/builds.csv`
> → runtime `csvBuilds`) is thin or absent, what the game does about it today, and how to make
> **every** Pokémon surface a **single-battle-viable** recommendation — for both the foe roller
> and the player-facing recommendation UI (Move Tutor / Battle Dojo / Nature Rater / Colress).
>
> Nothing here changes behaviour yet. Build selection and recommendation logic are game-behaviour
> per `CLAUDE.md` → **needs maintainer sign-off before implementing.** This doc is the proposal.

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
`Eevee-Starter`, `Pikachu-Starter` — all edge formes. Most (`Greninja-Ash`, `Zygarde-Complete`, …)
still appear in gen-9 randbats, so online they roll a viable set. Mega/Gmax/Primal names are excluded
from the draft pool anyway (handled as base + gimmick); CAP fakemons (`Aurumoth`, `Colossoil`, …) are
not real species.

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

## Optimization paths (proposed — pick which to implement)

Ordered by value ÷ risk. All are consistency/quality/polish, none invents new balance numbers except
where noted (maintainer-owned).

### Path A — Filter exotic sets out of the recommendation meta *(RECOMMENDED, fixes G2)*

Make `_txAccumulateBuilds` respect `settings.allowExoticFormats` exactly as the roller does, mirroring
the existing `_category === 'doubles'` guard:

```js
// battle.html:68918 area, inside the per-build loop
if (b._illegal) continue;
if (b._category === 'doubles' && !settings.allowDoublesBuilds) continue;   // (align w/ roller too)
if (!settings.allowExoticFormats && _isExoticFormat(b._format)) continue;   // NEW
```

- Loader already stores `_format` on every build object (`:11961`), so no data change needed.
- Effect: the ~25 contaminated species drop below the sparse gate and correctly show the honest banner
  + heuristic-synthesized single-battle set instead of illegal ★ recs. Recs become **consistent** with
  what the foe roller actually uses.
- Must also invalidate `_txMetaCache` when `allowExoticFormats` / `allowDoublesBuilds` toggles (call
  `window._pbsInvalidateTxMeta()` from the settings handler) so recs update live.
- Risk: low. It's a consistency fix, but it *does* change what the player sees → **sign-off required.**
- Test: add a suite asserting a known exotic-only species (e.g. `Regieleki` with exotic sets stripped)
  shows `sparse:true` and the "no competitive data" banner.

### Path B — Teach `_SMOGON_FORMAT_POWER` the 5 missing singles formats *(fixes G3)*

Add the numbers from G3's table (maintainer owns the exact values). One-line-per-format addition to the
frozen table at `:12551`. Fixes `nationaldexag` under-rating and gives `monotype`/BSS/BSpot deliberate
(rather than accidental-neutral) weighting. **Balance numbers → maintainer picks the values.**

### Path C — Commit a local randbats snapshot so the fallback is offline-safe *(fixes G4)*

Bake `data/randbats/gen9.json` (and optionally 4–8) into the repo and have `fetchRandbatsForGen` try the
local path first (same local-then-API pattern `fetchSmogonSetsForGen` already uses at `:14494`). Removes
the last-resort Tackle junk for every offline zero-data species. Pure data + loader change; the roller
logic is untouched. (Adds ~1–2 MB to the repo — confirm that's acceptable.)

### Path D — Guarantee a curated single-battle set for the 7 zero-data formes *(fixes G1 tail)*

For `Greninja-Ash`, `Greninja-Bond`, `Zygarde-Complete`, `Darmanitan-Zen`, `Marill`, `Eevee-Starter`,
`Pikachu-Starter`: either (a) rely on Path C's randbats (covers most), or (b) hand-author a single legal
"regular" set each so they never depend on the network. Small, safe, and makes the guarantee absolute.

### Path E — (Optional) Variety pad for single-set species *(G5, lowest priority)*

Let the designed-build engine contribute an alternate set for the 73 single-set species so drafts/rolls
aren't identical every time. The engine already exists; this is just widening its eligibility. Cosmetic.

---

## Recommended sequencing

1. **Path A** — highest value, closes the one genuinely misleading UX path, aligns recs with the roller.
2. **Path C** — removes the only true "garbage" foe outcome (offline).
3. **Path B** — cheap fidelity win once the maintainer picks the numbers.
4. **Path D / E** — completeness polish; optional.

Each ships with a jsdom guard test per the repo's sustainability rule.
