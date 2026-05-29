# Special Audit — Hallucination Patterns in `battle.html` / `online-pvp.js` / `move-*-map.js`

> **Generated**: 2026-05-28T16:54:37Z
> **Scope**: `battle.html` (56,363 lines), `online-pvp.js` (880 lines), `move-anim-map.js` (956 lines), `move-sfx-map.js` (988 lines)
> **Mode**: READ-ONLY hunt for AI-vibecoded scar tissue (phantom refs, dead branches, copy-paste artifacts, contradictions, etc).
> **Player flow in scope**: Story Mode Normal only; PvP / Gauntlet / Quick Play observed for style only.

---

## 1. Pattern Frequency Table (top 20)

| Rank | Pattern (taxonomy id from mandate) | Hits | Quick read |
|------|------------------------------------|------|------------|
| 1  | (12) Try-catch swallow — empty body `catch (e) {}` | **631** | One in every ~90 lines. Some legitimate (cleanup), many silently hide failure paths. |
| 2  | (3 / 7) Inline RNG copy-paste `(sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random` | **25** | Helper `storyAwareRng()` exists at L14362 and is called only **13×** elsewhere. AI re-invented the same inline pattern over and over instead of reaching for the helper. |
| 3  | (3) Bare `Math.random()` in deterministic-RNG zones | **272** | A bottomless source of replay drift. Many already noted in the ledger (ISSUE-006/009/011/025/026/027/028/031/043). |
| 4  | (7) Re-invented Fisher–Yates shuffle | **7+1** | One shared `shuffleInPlace` (L9713) + one `_storyShuffle` (L46888, **dead**) + 7 inline copies, each with its own RNG strategy. |
| 5  | (10 / 17) Defensive-but-broken patterns: `typeof window.X === 'function'` guards | **34** | Most have a matching `window.X = ...` definition — but the construct is itself a code smell, because a missed assignment silently disables the feature with no log. |
| 6  | (4) Big descriptive comments narrating "previously", "was", "originally" | **40+** | Documents past behavior. Useful for forensic reading, but ~10 contradict the line they describe (see §2.4). |
| 7  | (3) `Object.keys(MOVE_SFX_MAP)` vs `MOVE_ANIM_MAP` divergence | **31** orphans | 31 keys in SFX map that have no anim counterpart, **including two-name duplicates** (`'All Out Pummeling'` and `'All-Out Pummeling'`). The engine looks up by `move.name`; only `'All-Out Pummeling'` (hyphen) is reachable. |
| 8  | (3 / 18) Two systems doing the same job: `deepClone` defined separately in `battle.html` and `online-pvp.js` | 2 copies | Identical body (`structuredClone || JSON.parse(JSON.stringify(...))`). Plus the wider `deepClone` JSON-fallback caveat (ISSUE-066). |
| 9  | (3) Same function name defined twice with diverging bodies | 3 | `isContactMove` (L18810 vs L21807), `showMoveEffect` (L12998 vs L13022), `row` (L16746 vs L16804). The two `isContactMove`s actively diverge in behavior (see §2.1). |
| 10 | (10) Switch-in volatile re-init missing fields that initial creation has | 3 sites | `state.fActive.volatile = { ... }` at L24676 / L24678 / L24809 drop the fields `aquaRing`, `ingrain`, `embargo`, `truanting`, `roostType*`, `timesHit`, `moveHistory`, and add `octolock`, `boostedThisTurn` that are absent from the initial decl at L14571. (See §2.5.) |
| 11 | (2) Dead branches via constant-resolving condition | 2 | `pools[1]` in `pickRivalSecondaryIntroLine` at L31514 — `getRivalEncounterPhase` never returns 1; `pools[1]` only reachable through the `||` fallback. Plus `_VARIANT_RIVAL_QUOTES` phase-1 lines (5 variants). (See §2.6.) |
| 12 | (19) Off-by-one / row-id vs array-index confusion | known | `STORY_EVENTS_RAW` row IDs are 0,68,1,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,12,19… — not contiguous, not sorted. Every `[idx]` access that means "array position" while the value at `[idx][0]` is actually a row-ID is a latent bug. Three already in the ledger; surveying the live code I see no NEW sites past those. |
| 13 | (12) Save() errors swallowed | many | `try { save(); } catch (e) {}` pattern at >50 sites. A corrupted save = silent loss with no toast. ISSUE-022 noted the test gap; the runtime sites are pervasive. |
| 14 | (6) Stale spec comments | ~3 | `_SAFARI_GRADE_CURVE_BY_BADGES[3]` comment says "first unlock @ City 4" (ISSUE-118 already noted). RIVAL_PHASE_TAGLINES uses keys 0,2,3,4 (no 1) — fine in code but smells. The `safariGradeWeightsForBadges` "Pre-unlock (badges 0-2)" comment claims safari unlocks at 3 badges while the actual gate is City4 / 4 badges. |
| 15 | (3) `_storyShuffle` defined and **never called** | 1 | L46888 — pure dead code (only 1 grep hit, the definition itself). |
| 16 | (10) Same `ser` arrow defined twice in `online-pvp.js` | 1 | L574 inside `handlePvPPlayTurn`, L734 inside `hostResolveGuestBattleTimeout`. Byte-identical bodies, copy-paste. |
| 17 | (1) Phantom references for `_loadOpAbilities` | **fixed** | L10150 calls `window._loadOpAbilities`; L51260 now exposes it on `window`. Prior phantom-ref ISSUE is resolved. Tested: ✓ |
| 18 | (1) Phantom-look references for `storyRngNext` outside IIFE | **mostly-fixed** | The bare-name calls have been replaced with `typeof window.storyRngNext === 'function'` guards at ~25 sites. Two known stragglers (ISSUE-041, ISSUE-107) remain in the ledger. |
| 19 | (11) `parseMoveEffects` wrong-arity calls | **fixed in code** but bench still broken | perf-bench at `scripts/debug/perf-bench.mjs:73` still calls with 4 args where the engine accepts 5; this is intentional (5th is `_bouncedDepth` for recursion). The real bug ISSUE-061 was that the BENCH called with 1 arg — that's been fixed to 4 (correct). |
| 20 | (3) Mart/Dept item id namespace divergent from `items.json` | 30 ids | Already in the ledger as ISSUE-086/087. Hallmark of a system that was vibecoded without auditing the data table it was supposed to extend. |

---

## 2. Concrete examples (file:anchor + snippet + verdict)

### 2.1 — `isContactMove` defined twice, body divergent (HIGH-CONFIDENCE BUG)

**file**: `battle.html`  **anchors**: `isContactMove` (global L18810, shadow L21807)

`battle.html:L18810`:
```js
function isContactMove(mv, attacker) {
    if (!mv) return false;
    try { if (attacker && attacker.ability === "Long Reach") return false; } catch (e) {}
    // Punching Glove: punching moves do not make contact
    try {
        if (attacker && attacker.item === "Punching Glove" && isPunchMoveName(mv.name)
            && state.magicRoom === 0 && !(attacker.volatile && attacker.volatile.embargo > 0)
            && attacker.ability !== "Klutz") return false;
    } catch (e) {}
    if (mv.flags && mv.flags.contact) return true;
    const _nonContactPhys = new Set(["Earthquake","Magnitude","Bulldoze","Rock Slide","Rock Blast","Explosion","Self-Destruct","Hyper Voice","Surf","Muddy Water","Blizzard","Heat Wave","Sludge Wave","Discharge","Lava Plume","Icy Wind",...]);
    ...
}
```

`battle.html:L21807` (inside `parseMoveEffects`, shadows the global):
```js
function isContactMove(mv) {
    // Long Reach: user's moves are treated as non-contact (checked via closure attacker if available)
    try { if (typeof attacker !== 'undefined' && attacker && attacker.ability === "Long Reach") return false; } catch(e) {}
    if (mv.flags && mv.flags.contact) return true;
    const _nonContactPhys = new Set([...,"Discharge","Discharge",...]);  // <-- duplicate string!
    ...
}
```

**Verdict**: Classic copy-paste-then-mismatched-edit. The local shadow:
1. Drops the **Punching Glove** check entirely — so in-engine contact ability procs (Rocky Helmet, Static, Iron Barbs, …) still fire on punch moves from a Punching Glove holder when they should not.
2. Has a duplicated `"Discharge","Discharge"` in the non-contact Set (literal copy artifact).
3. Calls of `isContactMove(move)` from L22028 onward inside `parseMoveEffects` resolve to the local shadow, not the patched global.

**Pattern**: copy-paste artifact + half-edited substitution + divergent behavior across two same-named functions.

---

### 2.2 — 25 inline copies of the RNG-helper code

**file**: `battle.html`  **anchor**: `storyAwareRng`

The helper exists at L14362:
```js
function storyAwareRng() {
    const s = (window.StoryMode && window.StoryMode.state) || null;
    return (s && s.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
}
```

But there are **25** inline expressions of the form
```js
const rng = (sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
```
across the engine (e.g., L14364, L24791, L24799, L24849, L24857, L30691, L30734, L30752, L31439, L31450, L33600, L33902, L34539, L34677, L34812, L34885, L34916, L35340, L35521, L35557, L36... and more). And only **13** sites call the actual `storyAwareRng()`.

**Verdict**: Quintessential vibecoded copy-paste. The first one was written and AI just kept re-emitting that exact expression for every new RNG site instead of reaching for the helper. If you ever need to change the RNG selection policy (e.g., add a debug-only override), you have **38** code sites to touch.

**Pattern**: re-invented wheel + duplicate logic.

---

### 2.3 — `MOVE_SFX_MAP` has duplicate-key-by-different-spelling

**file**: `move-sfx-map.js`

`move-sfx-map.js:15`:
```js
'All Out Pummeling': ['music/battle_anims/PRSFX- All Out Pummeling1.wav', ...],
```

`move-sfx-map.js:776`:
```js
'All-Out Pummeling': ['music/battle_anims/PRSFX- Counter1.wav', 'music/battle_anims/PRSFX- Counter2.wav'],
```

The engine looks up by `move.name`. Canonical move name in `data/moves.json` is `'All-Out Pummeling'` (with hyphen). So:
- L15 (no hyphen) is **orphaned** — never resolves at runtime.
- L776 (with hyphen) is reachable BUT serves **Counter** SFX (clearly wrong / leftover from a Counter copy-paste).

**Verdict**: An AI generated the SFX-map by walking through the moves list and at some point its source list had two spellings; it emitted both. Then on the second pass it overrode the wrong one with Counter wavs without deleting the first.

`comm -13 anim-keys sfx-keys` shows **31 SFX-only keys** total — most are non-move IDs (`'Burn'`, `'Confused'`, `'Frozen'`, `'HailMove'`, `'Healing Pulse'`, `'Health Down'`, `'Health Up'`, `'LTBTS'`, `'Mirror Shatter'`, `'NeverEndingNightmare'`, `'Paralysis'`, `'Poison'`, `'Powder common'`, `'Pulse Evolution'`, `'Rainbow Field'`, `'Sand'`, `'Selfedestruct'` — note the typo, `'Shiny'`, `'SinisterArrowRaid'`, `'Sleep'`, `'Stat Down'`, `'Stat Up'`, `'Sunny'`, `'Trainer'`, `'Wind'`, `'Zpower'`, `'Horn Drill3_'` (trailing underscore — leftover from a CSV import), `'Glitch'`, `'FusionFlare'`, `'Mega Evolution'`, `'Rain'`).

Most of those non-canonical keys are probably orphan SFX from an asset pack that the engine never references. Worth a single sweep to audit which the engine actually hits.

**Pattern**: copy-paste artifact + AI-imagined alternative spellings + abandoned overlay entries.

---

### 2.4 — Switch-in volatile reset drops 9 fields that the initial creation set

**file**: `battle.html`  **anchors**: `mon.volatile = {...}` initialization

`battle.html:L14571` (initial create — `buildPokemon`):
```js
mon.volatile = { choiceLock: null, flinch: false, confusion: 0, sub: 0, ..., aquaRing: false, ingrain: false, stockpile: 0, futureSightTurns: 0, futureSightDmg: 0, futureSightName: '', lockMove: null, lockTurns: 0, rolloutCount: 0, defenseCurled: false, bideActive: false, bideDamage: 0, bideTurns: 0, proteanUsed: false, boostedByBoosterEnergy: false, disguiseBroken: false, lockOn: false, moveHistory: [], abilityGastroAcid: false, minimized: false, truanting: false, micleBerry: false, grudge: false, embargo: 0, roosting: false, roostType1: null, roostType2: null, timesHit: 0, statLoweredThisTurn: false, lastMoveFailed: false, hasMoved: false, identified: null, identifiedDark: false, supersweetUsed: false, charged: false, cudChewBerry: null, cudChewTurns: 0 };
```

`battle.html:L24676 / L24678 / L24809` (KO replacement / switch-in resets):
```js
state.fActive.volatile = { choiceLock: null, flinch: false, confusion: 0, sub: 0, ..., octolock: false, futureSightTurns: 0, futureSightDmg: 0, futureSightName: '', recharge: false, charging: null, lockMove: null, lockTurns: 0, boostedThisTurn: false };
```

**Diff**:
- Initial decl has these that the switch-in reset DROPS: `aquaRing`, `ingrain`, `stockpile`, `rolloutCount`, `defenseCurled`, `bideActive`, `bideDamage`, `bideTurns`, `proteanUsed`, `boostedByBoosterEnergy`, `disguiseBroken`, `lockOn`, `moveHistory`, `abilityGastroAcid`, `minimized`, `truanting`, `micleBerry`, `grudge`, `embargo`, `roosting`, `roostType1`, `roostType2`, `timesHit`, `statLoweredThisTurn`, `lastMoveFailed`, `hasMoved`, `identified`, `identifiedDark`, `supersweetUsed`, `charged`, `cudChewBerry`, `cudChewTurns`.
- Switch-in reset has these that the initial decl DROPS: `octolock`, `boostedThisTurn`.

Downstream code reads `mon.volatile.embargo > 0`, `mon.volatile.ingrain`, `mon.volatile.aquaRing`, etc. against the switch-in volatile, all of which are now `undefined`. `undefined > 0` is false, so functionally it manifests as "no embargo" / "no ingrain" — which happens to be the desired post-switch behavior, but it's **accidentally correct**, not designed. Anyone adding a new volatile field has to remember to update *three* literals.

Also: `octolock`, `boostedThisTurn`, `recharge`, `charging` are only initialized in the switch-in path, NOT in the freshly-created mon. So a never-switched Pokemon (game starts, mon active turn 1) has `undefined` for `boostedThisTurn`. Code at L27053 reads `if (defender.volatile.boostedThisTurn)` and `if (defender.volatile.boostedThisTurn) applyStatus(defender, "BRN");` — this happens to short-circuit on `undefined`, so still functionally correct. But any future code that says `delete mon.volatile.boostedThisTurn` or `mon.volatile.boostedThisTurn |= 0` will break.

**Verdict**: Two AI-generated literal blocks that have drifted apart over edits. There should be a single `makeVolatileState()` factory and all four sites should use it. If a future edit adds (say) `commanderActive: false` to the initial decl, the switch-in won't get it and downstream reads will read undefined silently.

**Pattern**: copy-paste artifact + drift + accidentally-correct behavior masking a contract violation.

---

### 2.5 — Phase-1 rival dialogue is dead code (engine never assigns phase 1)

**file**: `battle.html`  **anchors**: `getRivalEncounterPhase` (L31053), `pickRivalSecondaryIntroLine` (L31510), `_VARIANT_RIVAL_QUOTES` (L38667)

`battle.html:L31053`:
```js
function getRivalEncounterPhase(storyRowIdx) {
    const id = storyRowIdx | 0;
    if (id === STORY_RIVAL_ROW_INTRO)  return 0;  // row 68
    if (id === STORY_RIVAL_ROW_EARLY)  return 2;  // row 12
    if (id === STORY_RIVAL_ROW_MID)    return 3;  // row 39
    if (id === STORY_RIVAL_ROW_LEAGUE) return 4;  // row 65
    return null;
}
```

`battle.html:L31510`:
```js
function pickRivalSecondaryIntroLine(phase, badges) {
    const pools = {
        0: ['Starter versus starter...'],
        1: [`${b} badge on you. I built around it.`, 'Round two of our rivalry...', 'A fresh badge won\'t carry you through this one.'],  // <-- phase 1 entries
        2: [...],
        3: [...],
        4: [...]
    };
    const arr = pools[phase] || pools[1];  // <-- pools[1] is the fallback
    ...
}
```

The caller at L43735 only invokes this when `rivalPhase !== null && rivalPhase !== undefined`. So:
1. `getRivalEncounterPhase` never returns 1.
2. `pickRivalSecondaryIntroLine` is never called with phase=1.
3. `pools[1]` is only reachable if you somehow call with phase=anything-other-than-{0,2,3,4}, which the engine refuses to do.

→ The 3 phase-1 lines (which were probably the most-elaborate of the pool) are **dead**.

The same is true for `_VARIANT_RIVAL_QUOTES` phase-1 entries (in `second_sun`, `hypnos_lullaby` variants) — dead, never displayed.

**Verdict**: AI authored a 5-phase taxonomy (0,1,2,3,4) for one function and a 4-row taxonomy (0,2,3,4) for the other. The two never agreed. ISSUE-124 mentions sparse variant pools but doesn't call out that an entire phase is unreachable.

**Pattern**: dead branch + contradicting constants between two AI-authored systems.

---

### 2.6 — `ser()` helper duplicated in `online-pvp.js`

**file**: `online-pvp.js`  **anchors**: `handlePvPPlayTurn` (L566), `hostResolveGuestBattleTimeout` (L718)

L574 (inside `handlePvPPlayTurn`):
```js
const ser = (a) => ({
    moveIndex: a.moveIndex,
    switchIndex: a.switchIndex,
    aiMoveName: a.aiMove && a.aiMove.name ? a.aiMove.name : null
});
```

L734 (inside `hostResolveGuestBattleTimeout`):
```js
const ser = (a) => ({
    moveIndex: a.moveIndex,
    switchIndex: a.switchIndex,
    aiMoveName: a.aiMove && a.aiMove.name ? a.aiMove.name : null
});
```

**Verdict**: byte-identical copy-paste. Should be a module-level helper.

**Pattern**: copy-paste artifact.

---

### 2.7 — `deepClone` reinvented per-file

`battle.html:L9737`:
```js
function deepClone(o) {
    return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}
```

`online-pvp.js:L72`:
```js
function deepClone(o) {
    return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}
```

**Verdict**: byte-identical. AI re-wrote the same helper in each file rather than exposing one. Coupled with ISSUE-066 (the JSON fallback silently drops Set/Map/Date/undefined), both copies have the same bug — and any future fix needs to touch both.

**Pattern**: re-invented wheel + parallel-bug-surface.

---

### 2.8 — Inline Fisher–Yates with 3 different RNG strategies

Fisher–Yates appears 8 times:

| Line | Inside | RNG used |
|------|--------|----------|
| 9714 | `shuffleInPlace` (helper) | `Math.random()` (always — even in story) |
| 10565 | `_tutorSpeciesKeysForLearnset` | `Math.random()` |
| 11891 | `pickGimmickTag` | `Math.random()` |
| 15443 | type-cover swap | `Math.random()` |
| 34207 | candidate name dedup | `rng()` (the local hoisted ref, story-aware) |
| 34813 | illegal-build promote | `_shuf()` (story-aware) |
| 46889 | `_storyShuffle` (DEAD — never called) | `storyRngNext()` (bare!) |

The DEAD `_storyShuffle` uses **bare `storyRngNext()`** with no IIFE guard — which means if anyone ever DID call it from outside the StoryMode IIFE, it would `ReferenceError`. So this is also a phantom-ref-shaped helper: 0 callers, would-throw if called.

**Pattern**: re-invented wheel + dead code + buried RNG hazard.

---

### 2.9 — `STORY_EVENTS_RAW` row-ID layout (latent off-by-one source)

`battle.html:L29600`. The array IS NOT sorted by `row[0]`. The id sequence is:

`0, 68, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 12, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, ...`

That is, **row index 1 has id 68 (intro Rival), and the id 12 appears at array index 19** (post-City3 Rival). This is exactly the pattern that makes the rowId-vs-arrayIndex bug class so easy to introduce — any new `STORY_EVENTS_RAW[N]` lookup where N is computed from a row ID (e.g., from `sm.lastDefeatRowId`) instead of an array index will silently hit the wrong row.

ISSUE-055 / ISSUE-074 / ISSUE-101 / ISSUE-180 are in this family. **I did not find any new sites past those** during this sweep — the existing code is using `findIndex(row => row[0] === N)` correctly (L39389 etc.). Worth keeping a lint rule that any `STORY_EVENTS_RAW[expr]` expr must be an array index name (`evIdx`, `eventIndex`, `i`) and never a name containing the substring "Id" or "row".

**Pattern**: off-by-one source (latent, contained for now).

---

### 2.10 — Stale comment vs key drift in `_SAFARI_GRADE_CURVE_BY_BADGES`

`battle.html:L44778`:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
    3: { g1: 0, g2: 5,  g3: 60, g4: 35 },  // first unlock @ City 4
    ...
};
function _safariGradeWeightsForBadges() {
    const b = Math.max(0, Math.min(8, (sm && sm.badges) | 0));
    if (b < 3) return _SAFARI_GRADE_CURVE_BY_BADGES[3];  // pre-unlock floor
    return _SAFARI_GRADE_CURVE_BY_BADGES[b];
}
```

Safari unlocks at **City 4** which corresponds to **4 badges** (per `SAFARI_ENTRY_COST` gating and STORY_FEATURES_INTEGRATION.md §3). Yet the curve is keyed at **3 badges** with the comment claiming that key IS "first unlock @ City 4". One of {comment, key} is wrong. Reading the function: `b < 3` falls back to `[3]`, so `[3]` IS the floor curve — but the player actually FIRST hits Safari at badges=4, which uses `[4]`. So `[3]` is dead-code-as-floor — already noted ISSUE-118.

**Verdict**: stale spec text in comment + accidentally-dead first-tier in data + the curve label says "first unlock" but no player ever hits it.

**Pattern**: disagreeing comments and code + data-table off-by-one.

---

### 2.11 — `pActiveIndex` returns 0 when null — collapse with index 0

**file**: `online-pvp.js`  **anchor**: `exportBattleSnapshot` (L115)

`online-pvp.js:L147`:
```js
pActiveIndex: (() => {
    const arr = state.playerParty;
    if (!arr || !state.pActive) return 0;  // <-- sentinel 0 means "missing"
    const i = arr.indexOf(state.pActive);
    return i >= 0 ? i : 0;
})(),
```

And L199:
```js
if (pi >= 0 && pi < pp.length) state.pActive = pp[pi];  // <-- restores party[0]
else state.pActive = pp.find((m) => m && m.name === o.pActiveName) || pp[0];
```

If `state.pActive` is `null` at snapshot time (mid-switch animation), `pActiveIndex` exports as 0. The restore branch then sets `pActive = pp[0]` instead of leaving it null. This is a silent type/contract collapse: "no active mon" and "first mon" are indistinguishable in the serialized blob.

**Verdict**: a sentinel value that overlaps with a legitimate value. Should be `-1` or `null`.

**Pattern**: defensive-but-broken + ambiguous-sentinel.

---

### 2.12 — Mart catalog vs items.json namespace mismatch (≥29 ids)

Already in the ledger as ISSUE-086 + ISSUE-087. I include it here because it's textbook AI hallucination: the AI authored `POKEMART_ITEMS` and the consumable ids (`potion`, `superPotion`, `xAttack`, …) as if they were references INTO `items.json` — but only 2 of 31 of those ids actually exist there. The two systems are independent namespaces. Either (a) the AI invented the cross-reference relationship; or (b) it assumed `items.json` would later be expanded and emitted code without verifying. This is the **most archetypal vibecode bug** in the repo.

**Pattern**: imagined API + cross-system namespace hallucination.

---

### 2.13 — `_storyShuffle` is defined and never called (dead + phantom-shaped)

`battle.html:L46888`:
```js
function _storyShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(storyRngNext() * (i + 1));  // <-- bare storyRngNext()
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
}
```

- 0 callers anywhere in the codebase.
- Uses bare `storyRngNext()` — that symbol IS exported via `window.storyRngNext` from L32920, but the bare name only resolves inside the StoryMode IIFE. L46888 IS inside that IIFE (the IIFE closes at L56017), so this would actually work. But the absence of any caller means the function is pure dead code.

**Verdict**: AI generated a helper that was then never wired in. Probably written speculatively as part of "make all shuffles seed-aware" — and the patch landed everywhere else inline (see §2.8) instead of through this helper.

**Pattern**: dead code + unused-helper-after-pattern-changed-mid-refactor.

---

### 2.14 — `if (typeof window.X === 'function')` as a passive feature gate

`battle.html` has 34 of these guards. Each one is shaped:
```js
if (typeof window.X === 'function') window.X();
```

This is fine when X is genuinely optional (Online PvP timer is allowed to be absent during single-player). It's **a footgun** when X is a core feature — because if the assignment ever stops happening (refactor, IIFE re-order, name change), the feature silently dies and there's no log. The known instance was `_loadOpAbilities`: until BUG-002 fix, that line was the boot path silently disabling the entire Awakened-Ability picker for the player. Today that one is fixed, but the **pattern** is still present at every site listed.

Verdict pattern: if X is core, replace the `typeof` guard with a hard call + a thrown-then-logged error. If X is optional, add a `// optional: <feature description>` annotation.

**Pattern**: defensive-but-broken / passive-failure / no-observability.

---

### 2.15 — `console.log` debug noise in shipped paths (~15 sites)

ISSUE-147 noted this. The sites I see:

| Line | Source |
|------|--------|
| 9996, 10010, 10016, 10017, 10111 | Boot logs gated on `window.__DEBUG_*` (acceptable) |
| 10376, 10432, 12039, 12045 | More gated boot logs (acceptable) |
| 14010 | `[SpriteScale]` log gated on `__DEBUG_SPRITE_SCALE` (acceptable) |
| 35270 | `[TRAINER_DATA] validation: ...` — **ungated** in shipped path |
| 39415, 39492, 39539, 39616 | Debug-seed entry-point logs — gated on URL flag (acceptable) |
| 55879, 55881, 55986, 55993, 55994, 56012, 56293 | balanceAudit log block — only fires from the dev-tools console (acceptable) |

So there's exactly **one** spec-unannounced `console.log` left, at L35270, inside the `_validateTrainerData` ungated path. Worth a fix.

**Pattern**: leftover debug printf.

---

### 2.16 — `_pickCityQuoteLine` uses bare `Math.random()` deliberately

`battle.html:L31672`:
```js
if (Math.random() < variantBias) {
    return ovLines[Math.floor(Math.random() * ovLines.length)];
}
```

Already noted ISSUE-116. Worth re-flagging because the **deliberate** use of bare `Math.random` here makes the function inconsistent with its caller pool (`_storySideRng` is used for variant intros). If two replays at the same seed differ on which city-quote line was picked, this is the leak.

**Verdict**: an AI deliberately wrote a "should be seeded" branch unseeded. Same source pattern as ISSUE-057 (`_storyPickMysteryIdentity`).

**Pattern**: bare RNG in a seeded zone.

---

### 2.17 — `randomCode` in `online-pvp.js` uses bare `Math.random()`

`online-pvp.js:L49`:
```js
function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}
```

Already noted ISSUE-161 (30-bit entropy, collision-prone). Adding here because the **AI-archetypal** anti-pattern is: it knew about `getRandomValues` (a crypto-safe alternative) but didn't reach for it. The unique-constraint retry exists, but using `Math.random` as the entropy source for a public-shared join code is a vibecode tell.

**Pattern**: AI knows the easy API but doesn't reach for the right one for the use-case.

---

### 2.18 — `pools[phase] || pools[1]` fallback that nobody can reach

See §2.5. The fallback `|| pools[1]` is dead because every reachable phase has a defined pool. So it's a fallback for a state the engine has no way to produce.

**Verdict**: defensive coding for a contract that the caller already enforces. Belt and suspenders that no one will ever wear at the same time.

**Pattern**: dead branch via constant guard.

---

### 2.19 — `_validateTrainerData` runs at boot, logs unconditionally, and the validator's own success path emits `console.log`

`battle.html:L10159`:
```js
try { if (typeof window._validateTrainerData === 'function') window._validateTrainerData(); } catch (e) {}
```

`battle.html:L35270`:
```js
else console.log('[TRAINER_DATA] validation: all signatures resolve to known species.');
```

The `else` branch runs on every successful boot. So players who don't have devtools open get a console line on every page load. This is harmless but is exactly the kind of leftover that AI emits ("we should announce that validation passed") that adds boot noise without value.

**Pattern**: leftover debug printf.

---

### 2.20 — `parseMoveEffects` has a deep call-stack inside a try-less zone

The function is `async`. Several deep effect branches (After You / Quash / Lucky Chant at L26983/26989/26994; Final Gambit at L22844 with `// placeholder` literal in the source) have early-returns without status-effect cleanup. If any inner await ever throws, the turn-loop end-of-turn logic is bypassed — already noted ISSUE-032. Adding here because the **placeholder comment** `// placeholder; actual damage overridden below` (L22844) is itself a vibecode tell:

`battle.html:L22844`:
```js
if (move.name === "Final Gambit") basePower = 1; // placeholder; actual damage overridden below
```

The "placeholder" word survived from an early-draft pass and was never removed. The override IS done, so this is harmless — but the comment is the kind of thing AI leaves behind.

**Pattern**: placeholder text leaked into shipped code.

---

### 2.21 — `'After You'` and `'Quash'` named-but-not-implemented

`battle.html:L26983`:
```js
// === AFTER YOU: target moves next this turn (logged only — full reorder not implemented) ===
if (move.name === "After You") {
    logMsg(`${defender.name} will move next courtesy of After You!`, 'info'); return;
}

// === QUASH: target moves last this turn (logged only) ===
if (move.name === "Quash") {
    logMsg(`${defender.name}'s action was quashed!`, 'info'); return;
}
```

Both moves print flavor text but do not actually re-order the turn. The comment is honest about it, but a move with no mechanical effect in a battle simulator is a soft bug — the AI named the case to dispatch on the move name but didn't implement the gameplay logic. Either remove the moves from the legal pool, or implement the reorder.

**Pattern**: stub implementation with honest comment but no follow-up.

---

### 2.22 — Two near-identical `applyBattleSnapshot` snapshot keys, one with the `pActiveName` fallback

`online-pvp.js:L199-202`:
```js
if (pi >= 0 && pi < pp.length) state.pActive = pp[pi];
else state.pActive = pp.find((m) => m && m.name === o.pActiveName) || pp[0];
if (fi >= 0 && fi < fp.length) state.fActive = fp[fi];
else state.fActive = fp.find((m) => m && m.name === o.fActiveName) || fp[0];
```

Two near-identical 2-line blocks. The block is correct but a perfect refactor target (`_pickActive(pp, pi, o.pActiveName)`). The AI wrote it twice instead of factoring.

**Pattern**: 5+ line duplication; refactor opportunity.

---

### 2.23 — `Object.keys(MOVE_SFX_MAP)` orphan duplicate `'All Out Pummeling'`

Already covered in §2.3 — calling out specifically here because the SFX map has the EXACT same move name with two spellings AND the engine resolves only one. Total dead bytes shipped per session: ~25 (one line of dead lookup table).

**Pattern**: copy-paste + AI-imagined alternative spelling.

---

### 2.24 — Duplicate `row()` helper inside two test-only entrypoints

`battle.html:L16746` and `L16804`: both `window.startCharge6TestBattle` and `window.startKoBugTestBattle` declare a local `function row(name, moves) { … }` with byte-identical bodies. This is fine in isolation (each is private to its own scope) but is a clear AI copy-paste artifact when staring at the two functions side-by-side. Hoisting the helper to module scope would tighten them both.

**Pattern**: copy-paste artifact (low impact; private scope).

---

### 2.25 — `Discharge` listed twice in `_nonContactPhys` Set

Already cited in §2.1, calling out explicitly: `new Set([..., "Discharge","Discharge", ...])` in the local `isContactMove` shadow. `Set` dedups, so functionally a no-op. But the literal is unmistakably an AI-paste artifact.

**Pattern**: literal copy-paste residue.

---

### 2.26 — `volatile.choiceLock` set/cleared in 3 places with differing logic

`battle.html`: choiceLock set in 6 sites, cleared in 5 (search `choiceLock`). The clear paths use different logic (cleared on switch in some, on faint in others, on choice-item-strip in others). Not necessarily a bug — but the inconsistency is the AI-vibecoded pattern. ISSUE-004 calls out one of these in `aiDecision`.

**Pattern**: distributed-state with no central authority.

---

### 2.27 — `_storyEnsureBalls` / `_storyEnsureInventory` defensive helpers called from 6 sites

`battle.html:L42733, L42736, L42797, L42811, L42858, L42859, L47298, L47316, L47358, …`. The pattern is:
```js
if (!sm.balls || typeof sm.balls !== 'object') sm.balls = { poke:0, great:0, ultra:0, master:0 };
```
called repeatedly at every entry point that might touch `sm.balls`. This is a fine defensive style, but the multi-site repetition with the same hard-coded fallback shape is what an AI loves to emit instead of running ensure-once-at-load. ANY future addition of a ball type (Cherish, Dive, etc.) requires touching every literal.

**Verdict**: a defensive Russian doll — the fallback is correct but the duplication makes the data schema fragile to extension. Worth either (a) centralizing in a `defaultBalls()` factory or (b) running ensures only on save-load + new-run.

**Pattern**: re-invented defensive code at every consumer; data-schema fragility.

---

### 2.28 — `parseMoveEffects` `_bouncedDepth` parameter passed by callsite but documented as internal

`battle.html:L25853`:
```js
async function parseMoveEffects(attacker, defender, move, isPlayer, _bouncedDepth) {
```

`_bouncedDepth` is intended to prevent Magic Bounce → Magic Bounce infinite recursion. But the param has no JSDoc and its purpose is buried in a comment at L25869. Any vibecoded next-pass adding (say) a `_chargedDepth` would need to deduce the convention from that one comment.

Bonus: 4 of the 6 callsites pass only 4 args (omit `_bouncedDepth`); 1 passes 5 (`true` for re-entry); 1 passes 4 (Magic Bounce). JS silently fills the unspecified param with `undefined`, which `!_bouncedDepth` then reads as "not bounced" — correct, but the contract is fragile.

**Pattern**: implicit-by-omission contract.

---

### 2.29 — `STORY_EVENTS_RAW` length quoted in docs as 68, actual is 67

ISSUE-101 already exists. I confirm with a fresh count: `STORY_EVENTS_RAW.length === 67` (rows 0 through 66; row id 67 is "Mystery Figure" — but no row id 67 in the array; the actual final row id is index-of(67) in the data). Mandate/docs/STORY_MODE_FLOW still say 68. Off-by-one drift, well-noted.

**Pattern**: spec drift between code and docs.

---

### 2.30 — `_loadOpAbilities` was the previously-cited canonical phantom-ref bug — now FIXED

`battle.html:L10150`:
```js
if (typeof window._loadOpAbilities === 'function') await window._loadOpAbilities();
```

`battle.html:L51260`:
```js
try { window._loadOpAbilities = _loadOpAbilities; } catch (e) {}
```

`window._loadOpAbilities` is now wired. The `typeof` guard at L10150 plus the `try/catch` at L10151 (`catch (e) { console.warn('[OP] preload failed:', e); }`) makes the failure observable now. Older audits said this silently disabled Awakened picks; that's no longer true. **Confirmed FIXED — no longer a phantom-ref.**

I include it here so the ledger record stays accurate.

---

## 3. Style summary — vibecoding scar tissue paragraph

The codebase reads like it was written by an AI that **understood JavaScript syntax fully** but treated every callsite as an island: when it needed an RNG-selector, it re-emitted the exact `(sm && sm.active && typeof window.storyRngNext === 'function')` ternary 25 separate times instead of reaching for the `storyAwareRng()` helper that lives 50 lines above; when it needed a shuffle, it inlined Fisher-Yates 7+ times with 3 different RNG strategies; when it needed `deepClone` in `online-pvp.js`, it byte-copied the entire helper from `battle.html` rather than `import`ing it. The shadow `isContactMove` defined inside `parseMoveEffects` is the smoking gun: an AI on a later pass patched the **global** `isContactMove` to handle Punching Glove + Embargo, but never noticed that 13 callers inside `parseMoveEffects` resolve to a 200-line-later shadow that still has the pre-patch body (down to the literal `"Discharge","Discharge"` paste residue). Volatile-state object literals exhibit the same shape: the initial creation literal at L14571 carries 50+ fields; the switch-in reset literal at L24676/24678/24809 carries ~35 — and the **diff between them depends on which day the AI happened to touch which file**. The `Discharge`-duplicate, the `'All Out Pummeling'` vs `'All-Out Pummeling'` SFX-map twins, the `// placeholder; actual damage overridden below` comment that survived into ship, the `pools[1] || ...` fallback for a phase the engine can never produce — these are all **textual residue** from AI passes that didn't sweep their own footprints. The defensive `typeof window.X === 'function'` guards at 34 sites are a useful but worrying tell: every one of them is silently logging-nothing if `X` ever disappears, and there are no boot-time integrity assertions to catch a missing assignment. The error-suppression layer (631 empty `catch (e) {}` blocks) is the architectural equivalent — most of those catches are defensive against transient DOM races, but a significant fraction are silently eating save failures and ability-load errors. Finally, the **mart-vs-items.json namespace drift** is the most archetypal vibecode failure: the AI authored two systems that look like they reference each other but actually live in disjoint namespaces, and the cross-reference relationship existed only in the AI's head. The good news is that the codebase has clearly seen **forensic AI passes** (the `// BUG-NNN fix` markers, the descriptive comments around `storyRngNext`, the explicit IIFE-scope bridges), so the surface has been swept multiple times; the bad news is that those passes ALSO left their fingerprints (the deliberate phase-1 stub, the dead `_storyShuffle`, the duplicate `ser()`s in `online-pvp.js`). The pattern is consistent and the remedy is the same in every case: stop re-emitting, start re-using.

---

## 4. New findings (not in existing ledger)

Below: a short list of items I believe are **not** already in `ISSUE_LEDGER.md`. (Most of §2 is already in the ledger; these are the genuine new ones.)

### NEW-A: Local `isContactMove` shadow drops Punching Glove check
- **Severity**: P2 (silent functional divergence; affects ~12 in-engine contact checks)
- **Anchor**: `isContactMove` (L21807) vs `isContactMove` (L18810)
- **Pattern**: copy-paste artifact (taxonomy 3 + 14)
- **Evidence**: §2.1 above
- **Fix**: delete the local shadow; let `parseMoveEffects` use the global

### NEW-B: Switch-in volatile reset is a divergent literal from initial creation
- **Severity**: P3 (currently accidentally-correct; future-fragile)
- **Anchor**: `state.fActive.volatile = ...` (L24676/L24678/L24809) vs `mon.volatile = ...` (L14571)
- **Pattern**: copy-paste drift (taxonomy 3 + 10)
- **Evidence**: §2.4 above
- **Fix**: factor into `makeFreshVolatile()` and `makePostSwitchVolatile()`, with the latter calling the former.

### NEW-C: Phase 1 dialogue in `pickRivalSecondaryIntroLine` is unreachable
- **Severity**: P3 (dead content; 3 lines × 1 base + ~5 lines across variants)
- **Anchor**: `getRivalEncounterPhase` (L31053) vs `pickRivalSecondaryIntroLine` (L31510), `_VARIANT_RIVAL_QUOTES` (L38667)
- **Pattern**: contradicting constants between AI-authored taxonomies (taxonomy 5 + 14)
- **Evidence**: §2.5 above
- **Fix**: either add a phase-1 row id to the encounter ladder, or remove the phase-1 pools.

### NEW-D: `_storyShuffle` is defined and never called
- **Severity**: P3 (dead code; ~10 lines)
- **Anchor**: `_storyShuffle` (L46888)
- **Pattern**: dead code (taxonomy 4 + 7)
- **Evidence**: §2.13 above; grep count = 1 (the definition itself)
- **Fix**: delete; or make the inline Fisher–Yates at L34207/34813 use it.

### NEW-E: `ser` helper duplicated in two `online-pvp.js` methods
- **Severity**: P3 (refactor; no behavioral bug)
- **Anchor**: `handlePvPPlayTurn` (L574), `hostResolveGuestBattleTimeout` (L734)
- **Pattern**: copy-paste artifact (taxonomy 3)
- **Evidence**: §2.6 above
- **Fix**: hoist `ser` to module scope.

### NEW-F: SFX map has two-spelling duplicate `'All Out Pummeling'` / `'All-Out Pummeling'`
- **Severity**: P3 (dead bytes shipped + wrong-SFX for the reachable one)
- **Anchor**: `MOVE_SFX_MAP` (L15, L776)
- **Pattern**: imagined alternative spellings + abandoned overlay (taxonomy 3 + 8)
- **Evidence**: §2.3 above
- **Fix**: delete the no-hyphen entry; pick a real "All-Out Pummeling" SFX (currently Counter wavs, which is clearly wrong).

### NEW-G: `pActiveIndex` sentinel collapses null-active with index-0
- **Severity**: P3 (latent bug in snapshot/restore around mid-switch)
- **Anchor**: `exportBattleSnapshot` (L147), `applyBattleSnapshot` (L199)
- **Pattern**: defensive-but-broken sentinel (taxonomy 13)
- **Evidence**: §2.11 above
- **Fix**: use `-1` for "no active" and restore as null.

### NEW-H: Ungated `console.log` left in `_validateTrainerData` success path
- **Severity**: P3 (boot noise on every successful page load)
- **Anchor**: `_validateTrainerData` (~L35270)
- **Pattern**: leftover debug printf (taxonomy 10)
- **Evidence**: §2.15 above
- **Fix**: drop the `else console.log(...)` or gate on `__DEBUG_LOADS`.

### NEW-I: `// placeholder` text leaked into Final Gambit shipped path
- **Severity**: P3 (comment-only)
- **Anchor**: Final Gambit (L22844)
- **Pattern**: placeholder text in shipped code (taxonomy 10)
- **Evidence**: §2.20 above
- **Fix**: revise the comment to "Set BP=1 so the standard damage formula floor isn't tripped; final HP-loss is applied below."

### NEW-J: `After You` / `Quash` are dispatched but not mechanically implemented
- **Severity**: P3 (gameplay stub; affects PvE/PvP fights using those moves)
- **Anchor**: `parseMoveEffects` (L26983, L26989)
- **Pattern**: named-but-not-implemented stub (taxonomy 10 + 16)
- **Evidence**: §2.21 above
- **Fix**: either implement the turn-reorder, or strip the moves from the legal move pool.

---

## 5. PvP-side observations (style only, not for fixing)

- `online-pvp.js` is the cleanest file of the four: short (880 lines), single responsibility (Supabase wire), no IIFE nesting.
- That said, it carries the **same** AI fingerprints in miniature: reinvented `deepClone`, duplicate `ser()`, 7+ identical `select('data').eq('id', roomId).single()` fetch+error blocks (ISSUE-045 noted), 6 silent `catch (e) {}` blocks (ISSUE-096 noted), 36 references to 18 distinct `global.__*` host-side flags (ISSUE-073 noted).
- The XSS sink at `applyBattleLogHtml` (ISSUE-001) is the worst AI hallucination in the file: it ships `innerHTML = string` with no sanitization on top of a public-writable Supabase row. An AI wrote "okay the host sends rendered HTML to the guest" without ever stopping to ask "but what if the host is adversarial". That is the **most representative** AI safety failure I see anywhere in the repo.
- The bare `Math.random()` in `randomCode()` for 30-bit room codes (ISSUE-161) is the same pattern: "I needed a random short string, so I reached for the simplest thing" — without ever asking whether the simplest thing is right for the threat model.

---

## 6. Confidence levels

- **HIGH confidence** (verified via grep + read + cross-reference): NEW-A, NEW-D, NEW-E, NEW-F, NEW-H, NEW-I, NEW-J, §2.1, §2.2, §2.3, §2.5, §2.6, §2.7, §2.8, §2.10, §2.13, §2.15, §2.20, §2.21, §2.23, §2.25, §2.28, §2.30.
- **MEDIUM confidence** (the shape is clearly there; the EXACT runtime impact would need a tracer): NEW-B, NEW-C, NEW-G, §2.4, §2.11, §2.14, §2.26, §2.27.
- **LOW confidence** (style smell only, no bug demonstrated): §2.9 (latent only), §2.12 (known), §2.16 (known), §2.17 (known), §2.19 (cosmetic), §2.22 (refactor), §2.24 (refactor), §2.29 (doc drift, known).

---

## 7. Files referenced (absolute paths)

- `/home/user/battle/battle.html`
- `/home/user/battle/online-pvp.js`
- `/home/user/battle/move-anim-map.js`
- `/home/user/battle/move-sfx-map.js`
- `/home/user/battle/scripts/debug/perf-bench.mjs` (only at line 73 reference)

