---
severity: P1
category: inconsistency
anchor_symbol: storyRngNext
current_line_hint: ~24081
file: battle.html
agents: [consistency-auditor]
fingerprint: 80dcfb8449c7
confidence: high
status: fixed-main
---

**Title**: Reaper's Toll uses bare IIFE-private `storyRngNext` — guard always false, breaks seeded replays

**Evidence**:
```js
// lines 24081 / 24089 / 24139 / 24147 (outside StoryMode IIFE)
const cursed = foeSurvivors[Math.floor((typeof storyRngNext !== 'undefined' ? storyRngNext() : Math.random()) * foeSurvivors.length)];
```

**Repro**: `storyRngNext` is declared only at line 31874 inside the StoryMode IIFE (no bare export). At battle-engine scope `typeof storyRngNext` is always `'undefined'`, so all four Reaper's Toll sites silently fall through to `Math.random()` even in a seeded story battle.

**Blast radius**: Same RNG-replay-drift class as the 11 `sm` sites already fixed. The "cursed survivor" pick diverges between an original story run and its seeded replay; story-replay.mjs determinism checks will not catch it because the branch never enters the seeded path.

**Fix sketch**: Use the script-top idiom already used 16x elsewhere: `(s && s.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random` (or route through the new `storyAwareRng()` helper).

**Verification**: grep `typeof storyRngNext` in battle.html returns 0 outside-IIFE hits; replay a Reaper's Toll battle twice with same seed and confirm identical survivor weakened.

---
severity: P1
category: inconsistency
anchor_symbol: _withStoryPlayerGimmickGate
current_line_hint: ~11376
file: battle.html
agents: [consistency-auditor]
fingerprint: 416fa2aaed61
confidence: high
status: fixed-main
---

**Title**: Player gimmick gate reads bare IIFE-private `sm` — always sees zero unlocked gimmicks

**Evidence**:
```js
// line 11376, inside _withStoryPlayerGimmickGate (script-top, before the IIFE)
window._pbsStoryUnlockedGimmicks = (typeof sm !== 'undefined' && sm && Array.isArray(sm.unlockedGimmicks)) ? sm.unlockedGimmicks : [];
```

**Repro**: `sm` is private to the StoryMode IIFE (declared line 31724). `typeof sm` is always `'undefined'` here, so the ternary always yields `[]`. Every player-side acquisition path wrapped by this gate (incl. Cable Link per STORY_MODE_FLOW §15d) therefore sees an empty unlocked-gimmick list.

**Blast radius**: Mega / Z / Dynamax / Tera silently never roll on player-side acquisitions in story mode, even after the player has unlocked them. Not a crash (typeof-guarded) — a silent gameplay regression of the same scope-leak class.

**Fix sketch**: Read the live state via the public getter: `const sm = (window.StoryMode && window.StoryMode.state) || null;` then use it, matching the pattern at lines 13858+.

**Verification**: In a story run with mega unlocked, confirm `window._pbsStoryUnlockedGimmicks` includes `'mega'` during a player build roll.

---
severity: P2
category: inconsistency
anchor_symbol: storyRngNext
current_line_hint: ~10482
file: battle.html
agents: [consistency-auditor]
fingerprint: 294ac88b95dd
confidence: high
status: fixed-main
---

**Title**: Cosmetic-skin roll references bare `sm` AND bare `storyRngNext` — double scope leak, never seeded

**Evidence**:
```js
// line 10482 (outside IIFE, in makeBuild cosmetic-forme path)
const rng = (typeof sm === 'object' && sm && sm.active && typeof storyRngNext === 'function') ? storyRngNext : Math.random;
```

**Repro**: Both `sm` and `storyRngNext` are IIFE-private. `typeof sm === 'object'` is always false here, so the cosmetic-forme roll always uses `Math.random()`.

**Blast radius**: Cosmetic forme assignment (1.5% chance) is non-deterministic across seeded replays. Lower stakes than combat RNG (purely cosmetic) but same root cause; fix together with the other leaks.

**Fix sketch**: Mirror line 13854-13855: read `window.StoryMode.state` for active-ness and use `window.storyRngNext`.

**Verification**: grep confirms no bare `storyRngNext`/`sm` in makeBuild; cosmetic forme reproduces under a fixed seed.

---
severity: P2
category: inconsistency
anchor_symbol: _txMetaCache
current_line_hint: ~9897
file: battle.html
agents: [consistency-auditor]
fingerprint: 092d23ae6973
confidence: high
status: fixed-main
---

**Title**: CSV-load cache invalidation pokes IIFE-private `_txMetaCache`/`_txGlobalMetaCached` — invalidation is dead

**Evidence**:
```js
// lines 9897-9898 and 9949-9950 (after builds.csv / API load, script-top scope)
try { if (typeof _txMetaCache !== 'undefined') _txMetaCache.clear(); } catch (e) {}
try { _txGlobalMetaCached = null; } catch (e) {}
```

**Repro**: `_txMetaCache` (47641) and `_txGlobalMetaCached` (47642) are declared inside the StoryMode IIFE with no `window.` export. `typeof _txMetaCache` is always `'undefined'` so `.clear()` never runs; the bare assignment to `_txGlobalMetaCached` throws ReferenceError that the bare `try/catch` silently swallows.

**Blast radius**: The tutor / dojo / nature-rater meta caches are never invalidated when builds.csv finishes loading, so any screen rendered before the CSV resolved keeps serving stale/empty popularity stats for the session. Same scope-leak class; the assignment site is the dangerous (throwing) variant, masked by an empty catch.

**Fix sketch**: Either expose an invalidator (e.g. `window.StoryMode.invalidateMetaCaches()`) called from the CSV loader, or move the cache invalidation logic inside the IIFE.

**Verification**: After lazy CSV load, confirm a tutor screen reflects the freshly-loaded sets rather than the pre-load baseline.

