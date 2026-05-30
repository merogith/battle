# Wander Around — route exploration spec (pasteur hand-off)

> **Status:** Design spec — **not yet implemented.** No `battle.html` / save-schema
> code has been touched on the originating branch (`claude/fervent-bohr-U8HXW`,
> general session). This document is a hand-off for the **pasteur** line, which
> owns story flow + save schema.
>
> **Provenance:** Designed from the user's `Design_Brainstormflowofstorymode.csv`
> (the per-road "Wander Around (max 3 times)" beat) plus a 2026-05-30 design Q&A.
> User decisions captured in that session are marked **[user-confirmed]** below.
>
> **Sign-off still required before code ships** (per `CLAUDE.md`): this changes
> story flow + RNG semantics and adds balance numbers. The numbers in §9 are
> *proposed defaults* the user owns and may retune.

---

## 1. Intent

After a route's scripted content (forced wild → story beats → trainer battles),
and **before arriving at the next city**, the player is offered an optional,
diminishing-returns chance to find *extra* wild Pokémon. It is the "do you want
to linger in the grass, or move on?" beat. The user's own framing: *"a **secondary
variation** of wild encounter should **reappear**."*

This is **additive** to the existing route wilds, not a replacement. **[user-confirmed: Augment]**

CSV per-road flow (row 26 of the brainstorm): `wild encounters → story dialogues
→ regular trainer battles → wander around → arrive city`. Wander Around is the
**last beat before "Arrive City."**

---

## 2. Player-facing behavior

When the wander beat fires, the player sees a two-choice prompt (not a forced
catch screen):

| Button | Label **[user-confirmed]** | Effect |
|---|---|---|
| Explore | **Search the Tall Grass** | Consumes one wander attempt; rolls for an encounter (§3). |
| Proceed | **Move On** | Ends wandering; advances to the next city. |

- The prompt **reappears** after each resolved encounter, so the player can keep
  searching until they either tap **Move On** or exhaust **3** attempts.
- On the 3rd attempt being spent, only **Move On** remains (Search is disabled).
- A "Search the Tall Grass" tap that finds nothing shows a brief "The grass is
  still." beat, then the prompt reappears (the tap is still spent — see §3).

Flavor note: canon hides encounter odds, so the button does **not** display the
live percentage. (Open decision O5 if the user wants it shown.)

---

## 3. Probability model **[user-confirmed 2026-05-30]**

The encounter chance **starts at 50% and only halves when an encounter is
generated.** A *miss* leaves the chance unchanged. Hard cap of **3 attempts** per
route.

> "Generated" = a wild appears. The halving is independent of the **catch
> outcome** — it triggers whether the player catches it, it flees, or the player
> runs. Getting the encounter is what weakens the next search.

| Attempt | All hits (lucky) | All misses (unlucky) |
|---|---|---|
| 1 | **50%** → encounter | **50%** → nothing |
| 2 | **25%** → encounter | **50%** → nothing |
| 3 | **12.5%** → encounter | **50%** → nothing |

This reconciles the two readings in the brainstorm CSV: "50/25/12.5" is the
all-hits path; "50/50/50" is the all-misses path — same rule.

**Worked examples — the user's two canonical scenarios (verbatim intent):**

- **A — encounter each time:** Attempt 1 @ **50%**, the try is consumed → a wild
  encounter, so the next chance is now **25%** → another encounter (2 spent), so
  the last try is **12.5%**. The rate steps down on *each* encounter.
- **B — miss, then hit:** Attempt 1 @ **50%** → **miss** (1 spent) → can retry,
  and because the first failed it is **still 50%** → 2nd try, this time an
  encounter happens → 1 try left at **25%**. A failed search never lowers the rate.

After all 3 tries are spent — no matter the outcomes — the player can only **Move On**
to the city.

Rules:
- **Every tap consumes one of the 3 attempts**, hit or miss.
- Rate for the next tap = `currentRate × 0.5` **only after a hit**; unchanged
  after a miss.
- State **resets per route** — a fresh route starts at 50% with 3 attempts. (Keyed
  by route, so this is automatic — §7.)
- Lowest reachable rate is 12.5% (3 hits in a row); the cap of 3 means a single
  route yields at most 3 wander encounters.

---

## 4. Placement in the route flow

**Augment model** — the existing forced wilds are untouched; Wander Around is a
**new, separate beat** at route exit:

```
Leave city
  → [forced wild ×N]        ← unchanged: `wildRoute` interrupt, route ENTRY
  → [story beats]
  → [trainer battle(s)]
  → [WANDER AROUND]          ← NEW: route EXIT, optional, up to 3 taps
  → Arrive at next city
```

Two distinct counters, fully independent:

| | Forced wilds (today) | Wander Around (new) |
|---|---|---|
| When | Before the **first** route battle | Before **arriving** at the next city |
| Forced? | Yes — no skip | No — opt-in |
| Budget | `STORY_WILDS_PER_ROUTE_NODE` (=2) | `WANDER_MAX_TAPS` (=3) |
| Counter | `sm.wildSeenByEventIdx[idx]` | `sm.wanderByEventIdx[idx]` (new) |

**Recommended hook (faithful to CSV ordering):** fire on the **route→city
arrival transition** — after the last route battle is won and *before*
`enterCity()` renders the new city. Gate it to **genuine new-city crossings**
(reuse the city-name comparison in `_isFirstBattleOfNewRoute`,
`battle.html:49052`, applied to the arrival side — i.e. the city being entered
differs from the city last left). In-city gym sequences (City→same-City) and
post-gym hubs get **no** wander beat.

> Alternative hook (simpler, but **off-spec ordering**): co-locate with the
> `wildRoute` interrupt at route entry, after the forced wilds. This is easier to
> wire but violates the CSV's "wander *after* the trainer battles" ordering. Flagged
> per `CLAUDE.md`'s flow-ordering rule; recommend the arrival-transition hook.

**Suppression — Wander Around must NOT fire when:**
- A **roaming legendary** is pending for this route (`_shouldFireRoamingBeforeBattle`,
  `battle.html:46210`). The CSV's Victory Road note is explicit: *"Roaming
  legendary (no wild encounter or wander around)."* The roaming interrupt already
  replaces standard wilds; wander follows the same suppression.
- The arrival is into the **Pokémon League** (E1–E4 / Champion / league Rival) —
  same exclusions as `_shouldFireWildBeforeBattle` (`battle.html:49100-49101`).
- The **intro rival** starter duel and the **Mystery Figure** boss arc
  (`battle.html:49091-49093`).

In short: wander attaches to exactly the routes that currently fire route wilds,
**minus** any route where a roaming legendary is pending.

---

## 5. Integration map (existing code)

The route-wild machinery already models almost everything wander needs; wander is
a **sibling interrupt** that reuses the encounter + seeding plumbing.

| Concern | Existing mechanism to reuse | Anchor (point-in-time) |
|---|---|---|
| Interrupt registration | `STORY_BATTLE_INTERRUPTS` array; add a `wanderRoute` entry with `chainAfter: true` so each tap re-enters the chain | `battle.html:41567` (`wildRoute`) |
| Encounter roll | `rollWildEncounter(storySettingsGens())` — same badge-keyed grade pool, so a wander mon tiers identically to the route's forced wild ("route biology") | `battle.html:49485` |
| Catch screen | The unified no-fight catch screen used by route nodes + Safari | `battle.html:48996` |
| Seeded RNG | `storyRngNext()` for the probability roll; `_withEventSeededRng(key, fn)` for the species roll | `battle.html:35087`, `41585` |
| Route detection | `_isFirstBattleOfNewRoute` (city-name comparison) | `battle.html:49052` |
| Arrival flow | `proceedToNextBattle` → `enterCity()` | `battle.html:46277` |
| Roaming suppression | `_shouldFireRoamingBeforeBattle`, `_ROAMING_TRIGGERS` | `battle.html:46210`, `46174` |
| Per-route counter pattern | `sm.wildSeenByEventIdx` + `_wildSeenCount` / `_markWildSeen` | `battle.html:49072`, `49115` |

> Anchors drift. Resolve fresh via `node scripts/debug/symbol-index.mjs --lookup <symbol>`
> or `agent-state/ANCHOR_INDEX.md`. The symbol name is the durable reference.

### Suggested control flow (pasteur to finalize)

```
on route→new-city arrival (and not suppressed per §4):
    st = sm.wanderByEventIdx[routeIdx]  ||  { taps: 0, hits: 0 }
    if st.taps >= WANDER_MAX_TAPS  → proceed to enterCity()      // exhausted
    render prompt: [Search the Tall Grass] [Move On]

  on "Move On":
      mark route's wander beat resolved (so it doesn't re-prompt); enterCity()

  on "Search the Tall Grass":
      rate = WANDER_BASE_RATE × (WANDER_RATE_DECAY ^ st.hits)     // 0.5, 0.25, 0.125
      hit  = storyRngNext()  <  rate                              // seeded; see §8
      st.taps += 1
      if hit:
          st.hits += 1
          enc = _withEventSeededRng(<wander encounter key>, () => rollWildEncounter(storySettingsGens()))
          → run catch screen (catch / flee / run all OK)
      else:
          → "The grass is still." beat
      save()                                                       // persist taps/hits
      re-render prompt (or auto-proceed if st.taps >= WANDER_MAX_TAPS)
```

`hits` (not `taps`) is the decay exponent, so misses don't lower the rate — this
is what makes the model match §3 exactly.

---

## 6. Relationship to the forced wilds

- `STORY_WILDS_PER_ROUTE_NODE` (=2, `battle.html:49070`) and its gate
  `_shouldFireWildBeforeBattle` are **unchanged**.
- Wander encounters are **not** counted against that cap and do **not** touch
  `sm.wildSeenByEventIdx`. They have their own counter (§7) and seed namespace (§8).
- Net haul on a lucky route = up to `2` forced + `3` wander = **5** wilds; on an
  unlucky/skip route = `2` forced + `0` wander. (Forced count is a tunable — O1.)

---

## 7. Save schema (pasteur-owned — SAVE_VER bump)

New per-route state, mirroring the existing `wildSeenByEventIdx` pattern:

```js
sm.wanderByEventIdx = {            // keyed by the route's arrival battleIdx (or city idx)
    "<routeIdx>": { taps: <0..3>, hits: <0..3> }
};
```

- `taps` — attempts spent (caps the loop at `WANDER_MAX_TAPS`).
- `hits` — encounters generated (drives the rate decay: `rate = base × decay^hits`).
- Absent key ⇒ fresh route (0 taps, 0 hits, rate 50%). **Per-route reset is automatic.**

**Schema bump:** `SAVE_VER` is currently **22** (`battle.html:34151`). Bump to **23**.
**Migration:** old saves simply lack `sm.wanderByEventIdx` → initialize to `{}`.
A save captured mid-route (already past the arrival point) reads as absent ⇒
gets a full fresh wander budget on the *next* eligible route; it will not retro-
inject a wander beat into a route the player has already left. No destructive
migration. (pasteur to confirm against the migration ladder in `loadStory`.)

---

## 8. RNG / determinism

Per `CLAUDE.md`, every user-visible roll uses seeded `storyRngNext`, never bare
`Math.random()`, so replays/reloads reproduce. Two sub-streams per tap, with a
namespace distinct from the forced-wild key (`800000 + idx*10 + n`,
`battle.html:41584`):

- **Find/no-find roll** (the 50%/25%/12.5% check), tap `t`:
  seed `900000 + routeIdx*10 + t`.
- **Species roll** (only when a hit occurs), hit index `h`:
  `_withEventSeededRng(910000 + routeIdx*10 + h, () => rollWildEncounter(...))`.

Because the seed keys are derived from persisted `taps`/`hits`, a reload mid-wander
reproduces both the next find/no-find outcome and the species. (Safari + Crucible
wilds stay deliberately unseeded — unchanged.)

---

## 9. Tunable constants (user-owned — proposed defaults)

Extract as named constants near `STORY_WILDS_PER_ROUTE_NODE` so the user can tune
in one place:

| Constant | Default | Meaning |
|---|---|---|
| `WANDER_MAX_TAPS` | `3` | Max "Search the Tall Grass" taps per route. |
| `WANDER_BASE_RATE` | `0.50` | Encounter chance on the first search. |
| `WANDER_RATE_DECAY` | `0.5` | Multiplier applied to the rate per **hit**. |
| `STORY_WILDS_PER_ROUTE_NODE` | `2` (unchanged) | Forced wilds before the route — see O1. |

All four are **balance numbers** → user sign-off before ship (`CLAUDE.md`).

---

## 10. UX & edge cases

- **Party 6/6 and PC full:** catching is impossible. Recommend disabling "Search
  the Tall Grass" with a hint ("No room — sell or release at a Pokémon Center
  first") rather than letting the player burn taps on un-catchable encounters.
  Mirrors the existing full-box modal (`STORY_MODE_FLOW.md §3`). (Confirm — O3.)
- **Flee / run:** inside a wander-triggered catch screen, flee-on-miss and the Run
  button behave exactly as a normal route wild. The encounter still counts as a
  **hit** (rate already halved when generated). The prompt reappears afterward.
- **Reload mid-wander:** `taps`/`hits` are persisted, so the player resumes with
  the correct remaining attempts and rate.
- **Accessibility:** the two-choice prompt must be keyboard-reachable and
  screen-reader labeled like other story choice screens; respect reduced-motion
  for the grass-rustle beat. (a11y auditor to verify post-impl.)
- **No double-prompt:** once "Move On" is chosen (or 3 taps spent), the route's
  wander beat must be marked resolved so re-entering `proceedToNextBattle` (e.g.
  after a black-out rematch) does not re-open it.

---

## 11. Open decisions (need user / pasteur call before code)

| # | Decision | Recommendation |
|---|---|---|
| O1 | How many **forced** wilds remain before the wander loop? Today 2. CSV shows ~2 scripted "Wild Encounter" beats/road, so 2 forced + 3 wander is consistent; 1 forced + 3 wander is a lighter mandatory beat. | Keep **2** (no behavior change to forced wilds). |
| O2 | Hook point — arrival-transition (faithful to CSV ordering) vs route-entry (simpler). | **Arrival-transition** (§4). |
| O3 | Disable Search when party+PC full, vs allow + fail-with-modal? | **Disable + hint.** |
| O4 | Does the rate decay floor at 12.5%, or keep halving if `WANDER_MAX_TAPS` is ever raised? | Floor is implicit at 3 taps; keep formula `base × decay^hits` (self-floors). |
| O5 | Show the live odds on the button, or hide (canon)? | **Hide.** |
| O6 | Confirm save migration slots cleanly into the v22→v23 ladder in `loadStory`. | pasteur to verify. |

---

## 12. Test plan (jsdom harness — `tests/helpers/load-engine.js`)

Deterministic tests to leave behind so the next session can't silently regress:

1. **Rate sequence — all hits:** seed so every find-roll passes → assert rates
   `0.50, 0.25, 0.125` and exactly 3 encounters generated.
2. **Rate sequence — all misses:** seed so every find-roll fails → assert rate
   stays `0.50` across all 3 taps, 0 encounters, loop ends at tap 3.
3. **Mixed:** hit, miss, hit → assert rate path `0.50 → 0.25 → 0.25` and 2
   encounters.
4. **Cap:** "Search the Tall Grass" disabled / no-ops after 3 taps.
5. **Suppression:** wander does **not** fire on roaming-legendary routes, league
   battles (E1–E4/Champion/league Rival), intro rival, Mystery Figure.
6. **Augment, not replace:** forced wilds still fire `STORY_WILDS_PER_ROUTE_NODE`
   times; wander counter is independent of `wildSeenByEventIdx`.
7. **Persistence/replay:** same seed + same taps/hits ⇒ identical find-roll
   outcomes and identical species; reload mid-wander resumes correctly.
8. **No re-prompt:** after "Move On", re-entering the arrival path does not
   re-open the wander prompt.

---

## 13. Anchor table (point-in-time — `battle.html`, 2026-05-30)

| Symbol | Line | Role |
|---|---|---|
| `STORY_EVENTS_RAW` | 30239 | Linear city/battle timeline |
| `SAVE_VER` (=22) | 34151 | Save schema version (bump → 23) |
| `storyRngNext` | 35087 | Seeded mulberry32 RNG |
| `STORY_BATTLE_INTERRUPTS` (`wildRoute`) | 41567 | Where to add the `wanderRoute` sibling |
| `_wildSeedKey` / `_withEventSeededRng` | 41584 | Seeded encounter rolls |
| `_ROAMING_TRIGGERS` | 46174 | Roaming legendary trigger table |
| `_shouldFireRoamingBeforeBattle` | 46210 | Roaming suppression gate |
| `proceedToNextBattle` | 46277 | Battle→city advance |
| `enterBattleEvent` | 46827 | Battle entry (interrupt chain host) |
| catch screen (unified) | 48996 | No-fight catch UI |
| `_isFirstBattleOfNewRoute` | 49052 | New-route (different-city) detector |
| `STORY_WILDS_PER_ROUTE_NODE` (=2) | 49070 | Forced wild count |
| `_wildSeenCount` / `_markWildSeen` | 49072 / 49115 | Per-route forced-wild counter |
| `_shouldFireWildBeforeBattle` | 49085 | Forced-wild gate (exclusions to mirror) |
| `rollWildEncounter` | 49485 | Grade-pool wild roller |
