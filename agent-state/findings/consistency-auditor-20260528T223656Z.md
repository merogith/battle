---
severity: P1
category: inconsistency
anchor_symbol: startBattle
current_line_hint: ~16806
file: battle.html
agents: [consistency-auditor]
fingerprint: d9a014e94e28
confidence: high
status: open
---

**Title**: Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init

**Evidence**:
```js
// startBattle() at script-top scope (line 16663). 69 lines above this, the
// CORRECT _smRef was already created (line 16737). Then it regresses:
try {
    const _beatKey = sm && sm._activeBeatBattleKey;   // <-- bare 'sm': ReferenceError
    const _cfg = _beatKey && typeof BOSS_CONFIGS === 'object' && BOSS_CONFIGS[_beatKey];
    if (_cfg && Array.isArray(_cfg.mechanics) && _cfg.mechanics.length) { /* boss field locks, HP-threshold mechs */ }
} catch (e) { console.warn('[Story] BOSS_CONFIGS init failed:', e); }   // swallows the ReferenceError
```

**Repro**: `let sm` lives only inside the StoryMode IIFE (lines 29302–59694); `startBattle` is at script-top (16663). Reading bare `sm` at 16806 throws `ReferenceError: sm is not defined` on every story beat-boss battle. The enclosing try/catch (16805–16815) downgrades it to a single `console.warn`, so `_storyBossMechanicsBattleInit` never runs. This is the identical mistake the comment at line 16732 documents as already-fixed for `crucibleHardMode` — the same fix was not applied here.

**Blast radius**: Every BOSS_CONFIGS-driven story battle (beat bosses, raids, miniBosses). Field locks set move-1, HP-threshold mechanics, telegraphed immunity rounds — all skipped. `_activeBeatBattleKey` IS correctly set at line 46653 (inside the IIFE), so the feature is intended to fire; only the read site is broken.

**Fix sketch**: Replace bare `sm` at line 16806 with `_smRef` (already declared at 16737 in the same function), matching the documented script-top pattern.

**Verification**: Open any story beat-boss battle with a BOSS_CONFIGS entry; confirm `state._bossMechanics` is populated and the field-lock telegraph fires. A seeded story-flow test that enters a boss beat and asserts `_bossMechanics.length > 0` would catch the regression.

---
severity: P1
category: inconsistency
anchor_symbol: canMove
current_line_hint: ~26039
file: battle.html
agents: [consistency-auditor]
fingerprint: 4ac6708be8d3
confidence: high
status: open
---

**Title**: canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift

**Evidence**:
```js
// canMove(mon, moveName) — per-turn move gate. Thaw (just above) uses storyAwareRng();
const _thawRng = storyAwareRng();
if (_thawRng() < 0.2) { mon.status = null; /* thawed */ }
...
if (mon.status === "PAR" && Math.random() < 0.25) { /* fully paralyzed */ return false; }  // bare
...
else if (Math.random() < 0.3333) { /* hurt itself in confusion */ }                          // bare
```

**Repro**: Load a story run with a fixed `?seed=`, get a mon paralyzed/confused, replay the same seed — paralysis-skip and confusion self-hit outcomes diverge between runs because they read `Math.random()` instead of the seeded `window.storyRngNext`. The adjacent thaw roll (26035) is already seeded, proving the migration was partial.

**Blast radius**: Any seeded story battle involving PAR or confusion; shared-seed replays; daily-seed determinism. These are turn-order-deciding rolls, so divergence cascades through the whole battle.

**Fix sketch**: Route both rolls through `storyAwareRng()` (the helper at line 14499 already used by thaw two lines above), e.g. `const _rng = storyAwareRng();` then `_rng() < 0.25` / `_rng() < 0.3333`.

**Verification**: `tests/integration` seeded-replay assertion — same seed must produce identical PAR-skip / confusion-self-hit sequence across two runs.

---
severity: P1
category: inconsistency
anchor_symbol: parseMoveEffects
current_line_hint: ~26833
file: battle.html
agents: [consistency-auditor]
fingerprint: f57279301c3b
confidence: high
status: open
---

**Title**: parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift

**Evidence**:
```js
// parseMoveEffects() — core move-effect resolver. Generic secondary-effect gate:
const _secChance = (_sec.chance != null) ? _sec.chance : 100;
if (Math.random() * 100 >= _sg(_secChance)) continue;   // bare — every secondary status/flinch
// also: Tri Attack burn/par/frz pick (26805/26806), Stench flinch (26852), Bounce-par (26157),
// status-secondary at 26268. ~27 bare Math.random() calls live in the 24400–28700 battle band.
```

**Repro**: Seeded story battle, use any move with a secondary effect (e.g. Flamethrower 10% burn, Tri Attack, an Air Slash flinch). Replay the same seed — proc/no-proc differs because the roll is unseeded. Sibling code in the same region (cursed-pick at 25014, thaw at 26035) correctly uses the seeded path, confirming an incomplete migration.

**Blast radius**: All seeded story battles with secondary-effect moves, Tri Attack, Stench, Bounce. Roughly 27 bare Math.random() sites in the battle-resolution band (lines ~24400–28700) bypass the seeded RNG; this finding anchors the parseMoveEffects cluster (secondary-effect gate is the highest-frequency one).

**Fix sketch**: Introduce one `storyAwareRng()`-backed `_rng` at the top of `parseMoveEffects` and replace the in-loop `Math.random()` calls; audit the full 24400–28700 band so no battle-deciding roll stays on bare Math.random.

**Verification**: Seeded-replay integration test that fires a fixed sequence of secondary-effect moves and asserts identical proc outcomes across two runs of the same seed.

---
severity: P2
category: refactor
anchor_symbol: reportWinIfConfigured
current_line_hint: ~585
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: b45637efa253
confidence: medium
status: open
---

**Title**: online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8×

**Evidence**:
```js
// Repeated near-verbatim at lines 585, 610, 661, 690, 723, 761 (and variants at 265, 417):
const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
if (rowErr || !row || row.data == null) { console.warn('[OnlinePvP] <tag> fetch', rowErr); return; }
const prev = row.data;
```

**Repro**: `grep -nE "from\('pvp_rooms'\).select\('data'\).eq\('id', roomId\)" online-pvp.js` → 8+ structurally identical blocks differing only in the console.warn tag and single() vs maybeSingle().

**Blast radius**: Maintenance risk — any change to the room-fetch contract (column name, error shape, retry policy) must be edited in 8 places; easy to miss one and create inconsistent error handling across the PvP sync paths.

**Fix sketch**: Extract a single `async fetchRoomData(tag)` helper returning `{ prev }` or `null` (logging the tagged warn on failure), and call it from each site.

**Verification**: PvP smoke test (host + guest turn exchange) still completes; no behavioral change expected — pure consolidation.

---
severity: P3
category: inconsistency
anchor_symbol: MOVE_SFX_MAP
current_line_hint: ~15
file: move-sfx-map.js
agents: [consistency-auditor]
fingerprint: 6d3450d7cd4d
confidence: high
status: open
---

**Title**: 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX

**Evidence**:
```js
// move-sfx-map.js line 15 — space form, NEVER matched (no move is named this):
'All Out Pummeling': ['…PRSFX- All Out Pummeling1.wav', '…2.wav', '…3.wav'],
// line 776 — hyphen form (the canonical name) points at generic Counter SFX:
'All-Out Pummeling': ['…PRSFX- Counter1.wav', '…PRSFX- Counter2.wav'],
```

**Repro**: Canonical move name is `'All-Out Pummeling'` (battle.html:14031, 15160; move-anim-map.js:17). `AudioSystem.playMoveSound` does a direct `MOVE_SFX_MAP[move.name]` lookup (battle.html:11788) with no hyphen normalization, so the space-form line-15 entry is unreachable dead data, and the move resolves to the line-776 entry — the dedicated Pummeling .wav files are orphaned and the Z-move plays Counter SFX.

**Blast radius**: Cosmetic audio only — the Fighting Z-move uses placeholder Counter SFX instead of its three dedicated clips. No gameplay effect.

**Fix sketch**: Delete the dead `'All Out Pummeling'` (space) key and point `'All-Out Pummeling'` at the three dedicated Pummeling .wav files. Audit other hyphen/space mismatches between the two map files while here (e.g. confirm 'Savage Spin-Out' matches).

**Verification**: Use the Fighting-type Z-move in battle; confirm the dedicated Pummeling SFX play rather than Counter.

---
severity: P3
category: dx
anchor_symbol: loadGameData
current_line_hint: ~10153
file: battle.html
agents: [consistency-auditor]
fingerprint: 8ba77baaea7f
confidence: high
status: open
---

**Title**: Unguarded 'dex probe Pikachu' console.log left in the data-load path

**Evidence**:
```js
if (n === 0) {
    try {
        const probe = D.species.get('Pikachu');
        ...
        console.log('[SpriteScale] dex probe Pikachu', { id, heightmOnClass: ... });   // unguarded
    } catch (e) { console.log('[SpriteScale] dex probe failed', e); }
}
```

**Repro**: Load battle.html with a normal (non-debug) session and open the console — `[SpriteScale] dex probe Pikachu …` prints on every page load. Unlike the neighboring SpriteScale logs (10143, 10147) it is NOT gated behind `window.__DEBUG_SPRITE_SCALE` / `__DEBUG_LOADS`.

**Blast radius**: Console noise on every load; leftover developer probe shipped to production. No functional impact.

**Fix sketch**: Gate the probe behind `window.__DEBUG_SPRITE_SCALE` (matching the surrounding logs) or remove the `n === 0` probe block.

**Verification**: Reload without any `__DEBUG_*` flag set; confirm no `dex probe` line appears.

---
severity: P3
category: inconsistency
anchor_symbol: LEADER_VICTORY_LINES
current_line_hint: ~32045
file: battle.html
agents: [consistency-auditor]
fingerprint: 81701f439dcc
confidence: medium
status: open
---

**Title**: 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool

**Evidence**:
```js
// LEADER_VICTORY_LINES has 71 named leaders (+ LEADER_BADGE_REFLECTIONS, fully paired).
// TRAINER_QUOTES_BY_NAME only carries intro pools for ~11 of them (Brock, Misty, Lt. Surge,
// Erika, Koga, Sabrina, Blaine, Giovanni, Cynthia, Clair, Wallace…). The other 60
// (Falkner, Bugsy, Whitney, Roark, Milo, Nessa, Katy, Iono, Grusha, …) fall through to the
// generic 6-line TRAINER_QUOTES['Gym Leader'] pool. Hau has a CHAMPION_VICTORY_LINES entry
// but no TRAINER_QUOTES_BY_NAME intro pool.
```

**Repro**: Fight e.g. Leader "Iono" or "Grusha" in story mode — the badge-handover line is fully personalized, but the pre-battle intro is the generic "Enough talk. Show me the badge fight." class line. Asymmetric voicing within the same encounter.

**Blast radius**: Fanservice / polish only — not a bug (the role-pool fallback is intentional and correct). Elite Four are fully symmetric; this gap is leaders-only plus Hau.

**Fix sketch**: Add 2–3 per-name intro lines to TRAINER_QUOTES_BY_NAME for the 60 leaders that already have victory lines (and Hau), so intro and outro voicing match. Lower-priority content task, not a code fix.

**Verification**: Spot-check 3–4 of the previously-bare leaders in story mode and confirm a name-specific intro now appears.

