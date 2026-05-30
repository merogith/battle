# Poké Center — Design Brainstorm (make it meaningful, simple, fun)

**Prompt from user:** make Poké Centers a useful, meaningful, fun mechanic — simply, without
overwhelming the player. Understand the game flow + existing design first.

**Status:** brainstorm / design doc. No code changed. Numbers flagged `[maxwell]`; flow/clear-rule
flagged `[pasteur]`; UI/visibility/wiring is `[general]`.

---

## 1. Why the Center feels pointless today (root cause, not symptom)

It's a **storage screen wearing a hospital sign.** `enterPokemonCenter` (battle.html:47348-47376)
does only: mark seen → one-time Full Restore gift → open PC storage tab → play a chime →
queue the Nurse tutorial. No service. No reason to make a trip.

The deeper cause is a **philosophy collision** already in the codebase:

| Source | Says |
|---|---|
| `STORY_MODE_FLOW.md:34` (canon) | "Full-heal between every battle. **Attrition is removed.**" |
| `STORY_MODE_FLOW.md:179` | "**No heal function on the Center** — full-heal between battles is universal." |
| `STORY_MODE_FLOW.md §15e` (v20) | Re-adds **Fatigue**: every non-iconic fight +1 stack to the whole party, −1%/stack, cap 3. |
| Fatigue intro modal (battle.html:43463) | "A short stay at a **Pokémon Center** restores HP, PP, status, **and clears Fatigue.**" |

So the game **deleted HP attrition on purpose** (Center healing is genuinely moot — battles
auto-heal), then **re-introduced one persistent resource (Fatigue)** and **told the player the
Center clears it** — but never wired that. The Center's only possible job is the one thing the
game *doesn't* auto-resolve: **Fatigue.** Honoring the modal's existing promise is the
**consistent** fix, not a reversal of the no-attrition rule (which is about HP).

## 2. What Fatigue actually is (harness-verified)

- `build.tired` 0-3 per mon; −1%/stack to atk/def/spa/spd/spe **and starting HP** (maxHp
  untouched), applied in `buildPokemon` (14824-14838). Accumulates 0→1→2→3 across consecutive
  non-iconic fights; iconic fights (gym/elite/champion/rival/boss/pit) wipe it on entry+exit.
- **Three defects:** (1) **invisible** — no pip/HUD/summary anywhere; `_tiredAtBattleStart`
  (14837) is written but read nowhere; (2) **imperceptible** — ~3% at max is inside damage
  variance; (3) **false-promise** — the Center doesn't clear it despite the modal.

## 3. Design goal

In a game where HP auto-heals, the Center must service **what the game leaves persistent
(Fatigue)** — visibly, with a simple action, opt-in so non-grinders never feel friction.
Make the Center *the rest stop you choose to use*, not a vestigial hospital.

## 4. Industry patterns that fit (between-battle relief that creates a decision, not a tax)

- **Darkest Dungeon (Stress + town relief for gold):** a prominent meter + relief that competes
  with gear spending. → the Center "Rest" fee competing with shop/tutor gold.
- **Roguelike campfire (Slay the Spire):** relief is a *choice node* (rest vs upgrade), not an
  automatic event. → make clearing fatigue an explicit player action at the Center.
- **XCOM "Tired" / rest bonus:** a named, roster-flagged status with a risk/tempo choice.
- **Mainline Pokémon:** the anti-grind friction *is* the round-trip to the Center + PP/item burn,
  made legible by visible bars. This game removed that — so visibility is the missing half.

Common thread: visible state + perceptible consequence + relief that costs something.

## 5. Concepts (pick a direction)

### Concept A — "The Rest Stop" — RECOMMENDED CORE (simple, low risk)
Keep the 0-3/−1% model. Make it visible + make the promise true.
- **A1 [general]** Fatigue pips (◓◓◓) on the city party-list rows + summary screen (reads `build.tired`).
- **A2 [general]** Revive `_tiredAtBattleStart` (14837) as a "Worn −X%" chip on the battle HUD nameplate.
- **A3 [general, needs sign-off]** Add a **"Rest"** action to `enterPokemonCenter` (47348) that
  calls `_storyFullHealPartySlots()` (already clears `tired`, 43402). Free.
- **A4 [general]** Fix the modal copy (43463) so it matches the real loop.
- **Pros:** tiny, safe, no schema change, fixes both unambiguous defects (invisibility +
  false-promise), delivers the anti-grind nudge purely via visibility. **Fun = a meter you reset.**
- **Cons:** still passive (no cost trade-off). Player may ask "why does it matter if it's free?"
- **Sign-off:** A3 (a heal verb at the Center) touches the pasteur "no Center heal" line —
  courtesy heads-up; A1/A2/A4 are pure general.

### Concept B — "Rest is a Choice" — the depth payoff
A, plus: Rest costs a small **gold fee [maxwell]**; Fatigue auto-clears ONLY on iconic fights
and at the Center (not implicitly), so staying worn becomes a real push-on-vs-rest tempo
decision; **per-stack magnitude bumped to be felt [maxwell]** (target max ~−6-10%). Optional
mid-route consumable to clear one stack.
- **Pros:** the actual *interesting decision* the system lacks; proven Darkest-Dungeon loop;
  still guarantees clean story fights. **Fun = managing your grind budget.**
- **Cons:** reintroduces a little of the friction line 34 removed — must tune light.
- **Sign-off:** user + **pasteur** (clear-rule in afterBattleReturn/enterPokemonCenter) +
  **maxwell** (fee + magnitude).

### Concept C — "Well-Rested" carrot (optional flavor on A/B)
Resting at 0 fatigue grants a small one-fight buff (rest bonus). Makes the Center a reward, not
just penalty-removal.
- **Cons:** can tip into grindy/overwhelming; adds a buff system to track. Lowest priority.

### Concept D — null option: delete Fatigue
If you'd rather keep zero friction, remove the apply path + modal + dead field. Listed for
completeness; contradicts the "enhance it" brief.

## 6. Recommendation

**Ship Concept A now** (visible foundation + honest Center), **designed so Concept B can layer on**
with sign-off. A fixes the two real bugs immediately with general-session-safe work; B is the
design upgrade that makes the Center a genuine decision, gated on pasteur/maxwell.

**Smallest first slice (all general, A1/A2/A4 need no behavior sign-off):**
1. Fatigue pips on party list + summary (visibility).
2. "Worn −X%" HUD chip (revive 14837).
3. Honest modal copy.
4. Then, with your OK: the Center "Rest" button (A3).

## 6b. DESIGN VERDICT — is Fatigue good design? (user asked directly)

**No, not as built.** Against the bar for an attrition mechanic (visibility + perceptible
stakes + a player choice) fatigue scores zero of three:
1. Invisible (no pip/HUD/summary; `_tiredAtBattleStart` written-never-read).
2. Imperceptible (~3% sits inside the 15% damage-roll variance) — and the user has chosen to
   **keep magnitude subtle**, which permanently rules out fatigue ever being a *felt combat*
   mechanic. This constraint must drive the design.
3. No agency (auto-clears at next gym regardless of player action).
4. Punishment-only (invisible stick, no carrot).
5. Whole-party + unavoidable (can't rotate/play around it).
6. False-promise + clashes with the "attrition removed" pillar.

**Implication of "keep it subtle":** do NOT try to make the 3% debuff matter in battle — it
can't. Repurpose fatigue as **light visible texture**, not a strategic layer.

### Recommended design: "Freshness" (same tiny numbers, positive framing)
- Keep magnitude tiny (user's call). Numbers aren't the point.
- **Make it visible** — party-list pips + battle-nameplate chip. Fixes the cardinal sin,
  general-session, no balance change.
- **Reframe positively:** mons are **"Fresh"** by default; grinding makes them **"Worn"**; the
  Poké Center **Rest** restores Fresh. Identical mechanic, reads as upkeep/care not tax.
- **The Center gets one clear honest verb (Rest)** — the only persistent resource left to
  service in a full-heal game.

This is **Concept A**, and with subtle magnitude it is the correct ceiling. Deeper variants
(costed rest, felt magnitude, rest-bonus buff) are NOT recommended: they add friction the
"attrition removed" pillar rejects, or balance numbers the user vetoed, for a 3% effect that
shouldn't be a pillar.

### Explicitly do NOT:
- add a rest-bonus buff (new positive balance number, scope creep),
- make Rest cost gold (friction the no-attrition pillar rejects),
- bump magnitude (user vetoed).

## 6c. Late finding — "auto-heal between battles" is itself partly false

Harness-confirmed: once a mon is fatigued, each battle rebuilds it with
`currentHp = floor((1 − 0.01·stacks)·maxHp)` (14810 sets full, 14836 docks it). So a 3-stack
mon enters EVERY route fight at ~97% HP (e.g. 177/183), never full — contradicting both the
modal and the code comment at 47368 ("the party already heals between battles"). maxHp is the
only thing that stays species-full. **This strengthens the Center-Rest case:** there is a real,
small, persistent HP+fatigue residue between non-iconic fights that a Center Rest could
legitimately clear. (Magnitude stays subtle per the user's call — this is texture, not a cliff.)

## 7. Open questions for you
- Free Rest (A) or costed Rest as a real choice (B)?
- Should Fatigue be made *perceptible* (maxwell magnitude bump) or stay a gentle invisible-ish nudge?
- Is the courtesy pasteur heads-up enough for the "Center heals" line, or do you want a formal hand-off first?

*(Exploit-proofing pass on any new Center mechanic — interactions with retreat, build-mutating
facilities, PC/daycare, items — is running; results fold in before implementation.)*
