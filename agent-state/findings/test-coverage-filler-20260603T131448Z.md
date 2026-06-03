---
severity: P3
category: bug
anchor_symbol: Grass Whistle
current_line_hint: ~19082
file: battle.html
agents: [test-coverage-filler]
fingerprint: bac185d08e2a
confidence: high
status: open
---

**Title**: Grass Whistle never puts the target to sleep

**Evidence**:
```text
Grass Whistle appears only in sound-move sets (battle.html:19082 SUM_SOUND_MOVES, 19401, 19685, 23247);
there is no path that applies SLP for it. Sister sleep moves (Spore/Sleep Powder/Hypnosis/Sing/Lovely Kiss) all work.
```

**Repro**: jsdom harness, seed-sweep 0..59 (manual setup + seedRng(seed) + playTurn), Mew Grass Whistle vs Snorlax — d.status never becomes SLP. The same sweep lands every other sleeper within a few seeds.

**Blast radius**: Grass Whistle is a dead sleep move (55% acc; should sleep). Niche, low story impact.

**Fix sketch**: Wire Grass Whistle into the same sleep-application path as Sing / Grass Whistle's siblings (it is sound-based, so also check Soundproof immunity).

**Verification**: seed-sweep lands SLP within ~10 seeds (mirrors the Sing assertion in status-infliction draft).

---
severity: P3
category: dx
anchor_symbol: safeName
current_line_hint: ~18
file: tests/audit/generate-move-tests.js
agents: [test-coverage-filler]
fingerprint: 99aa9ad46225
confidence: high
status: open
---

**Title**: Move-test generator strips apostrophes, and the engine silently runs unknown move names as a 187-dmg fallback

**Evidence**:
```js
function safeName(s) { return s.replace(/[`"']/g, ''); }   // generate-move-tests.js:18
// -> it.todo('Kings Shield'), 'Lands Wrath', 'Natures Madness', 'Forests Curse'
// Filling a todo with the displayed (stripped) name tests a FALLBACK, not the move:
//   "Land's Wrath"=152 vs "Lands Wrath"=187 ; "Nature's Madness"=165 vs "Natures Madness"=187 ; "Forest's Curse"=0 vs 187
```

**Repro**: jsdom harness — `mkMon({moves:['Kings Shield',...]})` does not block (Body Slam connects 58) while `"King's Shield"` blocks (0). Any unknown move name resolves to a ~187-dmg default rather than erroring.

**Blast radius**: Test-only hazard, but a sneaky one: a mistyped/stripped move name passes a "deals damage" assertion against the wrong move. Bit two of this pass's own drafts before correction.

**Fix sketch**: Either don't strip apostrophes in safeName (only escape for the JS string literal), or make buildPokemon throw / warn on an unknown move name instead of falling back to a damaging default.

**Verification**: Generated todo titles match the canonical move names; an unknown move name throws in the harness.

