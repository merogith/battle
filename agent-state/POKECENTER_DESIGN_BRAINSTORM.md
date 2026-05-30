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

## 6d. Exploit-proofing sweep — fatigue-clear is wired to the WRONG places

A new mechanic must account for these (the incentive gradient is currently backwards):

| # | Issue | Sev | Evidence |
|---|---|---|---|
| 1 | **Paid retreat clears ALL fatigue free on Normal** (fee = 0) — cheapest clear in the game | HIGH exploit | `_storyApplyRetreatToCity` 44579 → 43402; fee 0 at 43378/43382 |
| 2 | **Accrual is win-only; losing/fleeing/retreating clears** — optimizer is rewarded for throwing fights | MED asymmetry | stash in `if(won)` at 46895; else at 46914 |
| 3 | **Evolution silently wipes fatigue** (rebuild drops `tired`) — free launderer | MED bug | `_evoLabApplyEvolution` 52173/52264, no `tired` in whitelist |
| 4 | **Catch / professor-gift mons start `tired=undefined`** (eggs/pits init 0) — masked by `\|0` clamps | LOW latent | 49555 / 45326 vs 43563 / 43977 |
| 5 | start-HP debuff erased by one potion (maxHp untouched) | LOW no-op | 14836 vs 52574 |
| OK | PC deposit/withdraw preserves fatigue; migration/clamp robust | — | 48406-48428; 34468/35111 |

**Design implication:** fatigue-clear is bolted onto three incidental paths (iconic fights,
retreat, evolution) but NOT the Center the game tells players to use. A visible fatigue meter
(Concept A) would EXPOSE the retreat exploit — so making the Center the intended/legible clear
path AND tightening #1-#3 are the same job. Concretely, an exploit-safe Concept A should:
- make the Center the canonical Rest/clear (fixes #2 false-promise),
- gate retreat's fatigue-clear behind the actual *loss* recovery flow, not a launder (fixes #1),
- carry `tired` through evolution's build rebuild (fixes #3 — behavior-preserving),
- init `tired=0` on catch/gift builds (fixes #4 — behavior-preserving, consistency).
Items #3/#4 are pure-consistency general-session fixes; #1 touches retreat flow (pasteur courtesy).

## 6e. Navigation model — you CANNOT freely backtrack (corrects a common assumption)

Verified by direct read: the run is a **strict linear forward march** via `sm.eventIndex`.
The city hub has only forward actions (facilities + "Leave City"/"Continue Route", 30037+).
**No world map, no fly, no revisit-earlier-town affordance exists anywhere.**

"Return to a city" happens in only three involuntary cases:
1. **Game-over** (you LOST a battle) → button `story-gameover-btn-center` "Return to last city —
   heal & replan" (heals + clears fatigue; free on Normal). battle.html:9286, refresh at 44598.
2. **Boss-cage retreat** (`bossRetreatToCity`, 49380).
3. **Closing the game** (autosave warps to last city, 59258).

Retreat snaps to `lastStoryCityEventIndexAtOrBefore` (44583) = the city you JUST left, not an
arbitrary earlier one. So **the only free fatigue-clear-by-return requires LOSING a fight** —
a self-punishing path, not a casual launder. (This softens 6d#1: it's "lose on purpose," not
"round-trip anytime.")

### Design implication — the Gameboy "backtrack to heal" loop is NOT needed here
Classic games needed backtrack-to-Center because HP/PP attrition persisted. This game deleted
that (full-heal between battles, FLOW:34), so there is **no HP reason to ever go back**, and
fatigue auto-clears forward at the next gym. **Re-adding a backtrack-heal loop would re-introduce
exactly the tedium the design removed — do NOT.** Instead the Center should be a **forward-path
rest stop you pass through** in the hub you're already in: an opt-in "top off fatigue before the
road" convenience, never a mandatory round-trip.

### The honest fork this raises
If fatigue auto-clears at the next gym AND you can't backtrack, does fatigue earn its place?
- **Keep it** only if the Center becomes its visible forward management point (Concept A).
- Otherwise **delete it** (Concept D) — a 3% invisible tax with no interaction is better removed
  than left vestigial. This is now a real, defensible option, not just a completeness entry.

## 6f. TIMELINE PROOF — fatigue is nearly inert in the shipped run

Reconstructed the whole main timeline (`STORY_EVENTS_RAW`, rows 0-66) and simulated fatigue
against the real iconic/non-iconic rules. Routes between cities are SHORT: every inter-city
segment has only **2 non-iconic fights** (Basic/Elite), except the very last (City8→City9) which
has 3 Elite Trainers. Gym Trainers are iconic (clear on entry), so they reset fatigue mid-route.

**Results across the entire main story:**
- Fights that are ever FELT with tired>0: **9 total** (out of ~50). Eight of them at −1%, one at −2%.
- **Max debuff ever experienced in a real fight: −2%, exactly once** (the 3rd Elite before the League).
- **tired=3 is mathematically UNREACHABLE** in the shipped timeline — there is no 4-long
  non-iconic chain anywhere, so the cap-3 system and the modal's "up to 3 stacks" never happen.

**Conclusion:** fatigue is not just "subtle" — in the actual shipped run it is **effectively
inert**: a −1% nudge the player meets 8 times and a −2% nudge once, with no stack ever exceeding
2, all invisible. Combined with 6e (no backtrack; auto-clears at next gym), the mechanic does
essentially nothing the player can perceive, manage, or even reach the top of.

This makes the fork in 6e decisive: as shipped, fatigue does not earn its complexity. The two
honest paths are **(A)** make it visible AND give it a forward management point at the Center so
it becomes a real (if light) system — which likely also means letting routes be long enough that
tired can climb [maxwell/pasteur, timeline], or **(D)** delete it and give the Poké Center a
*different* reason to exist.

## 6g. If not fatigue — what SHOULD make the Poké Center matter?

Since HP auto-heals, fatigue is near-inert, and you can't backtrack, the Center needs a *forward*
purpose the player passes through. Candidate roles (all opt-in, low-friction, fit the no-attrition
philosophy) — for discussion, not yet speced:
- **Fatigue management hub** (Concept A/B) — only works if fatigue is first made to matter (6f).
- **PP / move-point restore** — VERIFIED MOOT: PP is re-initialized fresh from move data every
  battle build (`pp: md.pp, maxPp: md.pp`, battle.html:10107), so PP auto-refills like HP and does
  NOT persist. The classic Center PP-restore job services nothing here either.
- **Box/Daycare access + a light "rest" social beat** — lean into it as the *hub* facility
  (storage, Pokédex, Nurse flavor) rather than a mechanical service; make it the comfortable
  "home base" screen, honest about being convenience not necessity.
- **Status-cure / consumable vendor** niche distinct from the Mart.

Recommendation unchanged at the top level: **decide first whether fatigue lives or dies (6f fork).**
If it lives → Concept A (visible + Center forward-clear). If it dies → repurpose the Center around
PP/box/home-base, and remove the inert fatigue tax + its false-promise modal.

## 7. Open questions for you
- Free Rest (A) or costed Rest as a real choice (B)?
- Should Fatigue be made *perceptible* (maxwell magnitude bump) or stay a gentle invisible-ish nudge?
- Is the courtesy pasteur heads-up enough for the "Center heals" line, or do you want a formal hand-off first?

*(Exploit-proofing pass on any new Center mechanic — interactions with retreat, build-mutating
facilities, PC/daycare, items — is running; results fold in before implementation.)*
