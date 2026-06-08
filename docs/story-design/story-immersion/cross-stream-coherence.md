# Story Immersion — Cross-Stream Coherence Report

> **Produced by Stream 4 (Storytelling Systems & Tools, the foundation owner)**, which is
> the only stream that has now read all four immersion specs + the Narrative Craft Playbook
> + the Camp System spec + the brief set. **Design review only — no code touched.** This is
> a coherence audit + a single consolidated decision list, so the maintainer's sign-off pass
> is one read instead of six.
>
> **Date:** 2026-06-04. **Anchors** resolved live against `battle.html`; re-resolve with
> `anchor`/`find-anchor` before editing.

---

## 0. TL;DR — the seams, ranked

| # | Seam | Sev | Streams | The decision it forces |
|---|---|---|---|---|
| **S1** | **`SAVE_VER 24→25` claimed by 3 efforts** (Camp, Immersion-S4, Overhaul Phase-E) | 🔴 **BLOCKER** | S4 + Camp + Overhaul | Unify into one v25 or sequence the version ladder; name one owner. |
| **S2** | **Two competing cinematic APIs** — both *new* (0 hits) | 🟠 HIGH | **S3 ↔ S4** | One registry + one trigger; Promise-facade vs callback. |
| **S3** | **Stream 1 routed dispatcher/sequencing work to "Stream 4"** — outside my brief | 🟠 MED-HIGH | S1 → S4/Overhaul | Who owns H4-1/2/3 (flow order, reserved slots, slot dispatcher)? It gates my setup-beat hook. |
| **S4** | **Two confirmed flow-ordering bugs** (G3 aftermath-before-boss, G4 boss-on-rival) | 🟡 MED (save-safe) | S1 (+S2/S3 copy/frame) | Approve the sort/reservation fixes. |
| **S5** | **`miniRaid2` silently fights a human team** (data bug surfaced by S3) | 🟡 MED (balance) | S3 | Fix the roller now (24 raids, 8 new bosses) or visual-only (16)? |
| **S6** | **Naming drift** — `rivalAffinity`/`rivalRespect`; cinematic table/fn names; stream labels | 🟢 LOW | all | Lock canonical names now (cheap). |

The full **consolidated decision list is §8.** Everything else (§7) already cohered — the
four specs agree on architecture, the schema, and the guardrails far more than they conflict.

---

## 1. Sources & stage (they are *not* all at the same maturity)

| Stream | Spec | Branch | Stage |
|---|---|---|---|
| 1 — Narrative Coherence & Causality | `narrative-coherence.md` | `compassionate-franklin` (+ **merged to `main`**) | design, anchored; flow bugs flagged |
| 2 — Dialogue & Writing | `dialogue-and-writing.md` | `gifted-galileo` | **maintainer-APPROVED 2026-06-04** (§11–12); copy locked, engine hand-off pending |
| 3 — Visual & Cinematic | `visual-and-cinematic.md` | `practical-wright` | design; raid-fix + scope flagged for sign-off |
| 4 — Storytelling Systems & Tools | `storytelling-systems.md` | `peaceful-mendel` *(this branch)* | design; reconciled |
| Camp System *(parallel initiative)* | `camp/*.md` | `camp-system-spec` | DRAFT, **unimplemented**; maintainer-reviewed 2026-06-03 |
| Overhaul Phase E *(parallel)* | `STORY_OVERHAUL_PLAN.md §4` | — | the single-event-model / dispatcher rebuild |

**Provenance caveat that explains most seams:** the brief set lived only on
`camp-system-spec`, so **every stream wrote blind to the others and to the briefs**, inferring
the roster (S1 called S4 "Reactivity & Player Agency"; S4 inferred S1 as "Main Spine"). The
conflicts below are the predictable cost of parallel blind authoring — all are reconcilable.

---

## 2. 🔴 S1 — The `SAVE_VER 24→25` pile-up (BLOCKER)

**Three independent efforts each mutate the save around v25.** Two unilateral `migrateStoryPreV25`
bodies = save corruption; a third is queued.

| Effort | Wants in v25 | Evidence |
|---|---|---|
| **Camp System** | `slot.bonds` (per-mon) + `sm.campByEventIdx` + `sm.campReturnPoint` | `camp/BONDING_RELATIONSHIPS.md §7` + `camp/CAMP_FLOW.md:167`; README §4: *"one `SAVE_VER` bump for the whole feature"* |
| **Immersion / Stream 4** | `sm.rivalAffinity` | this spec §5 |
| **Overhaul Phase E** | touches the **dedup store** (`storyEventsFired`/`_resolveActiveRoadBeats`) | S1 §6 C-2: H4-3 *"touches the dedup store and needs the Phase E migration"*; `_resolveActiveRoadBeats` confirmed live (3 hits) |

**Recommendation (mine):** **one unified `migrateStoryPreV25`, owned by Stream 4** (the craft
playbook puts the story-state store under S4, and `slot.bonds`+`rivalAffinity` are one coherent
affinity model). Camp contributes its field block; Phase-E's dedup change either folds in or
takes **v26** if it ships later. **Never two v25s.** If the three ship on different timelines,
sequence strictly (first = v25, next = v26, …) and mirror `migrateStoryPreV21`'s idempotent
shape. → **Decision D1.**

---

## 3. 🟠 S2 — Two cinematic APIs for the same (un-built) thing

Stream 3 and Stream 4 independently designed the cinematic layer. **Both are proposals — none
of the symbols exist yet** (verified: `PRE_BOSS_CINEMATICS`, `_showWildEncounterCinematic`,
`_playPreBossCinematic` → **0 hits**; my `STORY_CINEMATICS`/`_playCinematic` → 0 hits). So this
is "two designs for one new thing," not "abstraction vs shipped code."

| Axis | Stream 4 (§3.3) | Stream 3 (§4.3, §5.2) |
|---|---|---|
| Registry | `STORY_CINEMATICS[key]` (unified: sighting/raid/preboss) | **`PRE_BOSS_CINEMATICS[sceneKey]`** (bosses) + inline raid cfg |
| Trigger | `_playCinematic(key) → Promise` | `_showWildEncounterCinematic(opts)` + `_playPreBossCinematic(sceneKey,trainer,onDone)` — **callback** |
| Raid fix | `kind:"raid"`, framing flag | **concrete & grounded**: `_raidBossSpeciesForBeatKey` (DRY w/ `_rollExtraRaidBossTeam`), `enterBattleEvent` shim @48413, generalize `_showRoamingLegendarySighting`→`_showWildEncounterCinematic` |
| Pattern basis | my brief: *"Promise-based like scene/casino"* (`evolutionScene`) | matches existing callback overlays (`_renderNarrativeOverlay`, sighting) |

**Assessment.** Stream 3's mechanism is the **more concrete and better-grounded** (exact call
sites, the DRY predicate that makes label==reality, reuse-not-reinvent). My contribution is the
**unified Promise facade + single registry**. They are complementary, not contradictory.

**Recommendation (mine):** **converge — keep Stream 3's concrete implementations
(`_showWildEncounterCinematic`, `_playPreBossCinematic`) as the bodies, and make
`_playCinematic(key)` the thin Promise wrapper over them** (`new Promise(res => fn(...,res))`,
exactly as my §3.3 already does for the sighting). Unify the registry under **one** name
(recommend `STORY_CINEMATICS`, with `PRE_BOSS_CINEMATICS` folded in as the `kind:"preboss"`
rows). This gives Stream 3's grounded wiring + my brief's Promise/awaitable contract + one
table for authors. **I'll fold §3.3 to match Stream 3's mechanism once you confirm the
Promise-facade direction.** → **Decision D3.**

> Integration note: Stream 3 keys off `sm._activeBeatBattleKey` — **confirmed live (13 hits)**,
> so its shim is grounded. The shared "active battle beat key" is the clean seam between my
> trigger and its impls.

---

## 4. 🟠 S3 — "Stream 4" means two different things (scope/handshake mismatch)

Stream 1 (writing blind) inferred Stream 4 as *"Reactivity & Player Agency / world-state, save,
**sequencing**"* and routed it four items:

| S1 item | Ask | Reality |
|---|---|---|
| **H4-1** | enforce intra-arc order `event* < battle/boss/raid < ending` (fixes G3) | **dispatch sequencing — not in my brief** |
| **H4-2** | reserved slots: boss/raid never inject onto Rival/Gym rows (fixes G4) | dispatch sequencing — not in my brief |
| **H4-3** | the **slot dispatcher** (single event model, ordered slots) | **= Overhaul Plan §4 / Phase E** — a separate, larger effort |
| **H4-4** | feed `_showCityArrivalScreen` "last-road-context" | small; adjacent to my diamond-mount |

**My actual brief** (`04-storytelling-systems.md`) scopes Stream 4 as **engine hooks**:
setup-beat hook · choice/consequence · cinematic trigger · content schema · bark hook · one
migration. **It does *not* include the dispatcher/sequencer.** So H4-1/2/3 are **Overhaul Phase
E**, not Story-Immersion Stream 4.

**Why this matters (not cosmetic):** my **setup-beat hook depends on H4-3.** It only works if
setups can mount in the *diamond upstream* of their bottleneck — which is exactly the
"ordered-slots dispatcher" Phase E builds (my §6.2/§6.3 flagged this dependency). Until the slot
dispatcher exists, `_tryFireRoadStoryBeats` dumps setups into the same bottleneck row as the
payoff (S1 §2.3), so the setup-beat hook can't achieve its purpose.

**Recommendation (mine):** name an owner for H4-1/2/3 — **most naturally the Overhaul Phase-E
effort, not an Immersion stream** — and **sequence Phase E to land before (or with) the
setup-beat hook.** G3/G4 (H4-1/H4-2) are small sort/reservation fixes that can ship ahead
cheaply (§5). → **Decision D2.**

---

## 5. 🟡 S4/S5 — Flow & data bugs the audit surfaced (consolidated, grounded)

- **G3 [FLOW-BUG]** — `villain.*.ending` (event) fires **before** `villain.*.boss` (battle);
  both `roadAnchor:'road7'`. Fix = sort order, **no `SAVE_VER` bump.** (S1 §7 → H4-1.)
- **G4 [FLOW-BUG]** — `_activeBattleBeatForCurrentRow` injects the canon boss onto the first
  eligible road battle, which on `road6` is the **Rival row (eventIndex 39)** → the rival
  silently becomes a mini-boss/Proton. Fix = reserved slots + a bridge line (S1 H4-2 + **S2
  H2-3** copy + **S3** framing). Cross-stream, but save-safe.
- **S5 — `miniRaid2` silently fights a human team** (S3 §4.4): the live roller regex
  `(raid|miniRaid)$` rejects the `2`, so all 8 authored "evolved solo boss" `miniRaid2` beats
  fall back to `rollTrainerTeam`. `BOSS_CONFIGS`/`_populateExtraRaidConfigs`/`_EXTRA_RAID_SPECIES`
  all confirmed live. **Fixing it fields 8 new solo bosses w/ HP-threshold mechanics — a
  balance change.** → **Decision D5** (fix roller: 24 raids, or visual-only: 16).
- **✅ STALE — do NOT re-open "league finale spoils before E1."** `STORY_OVERHAUL_PLAN.md §3`
  reported this P0; S1 §7 verifies it's fixed (`fireAtEvent`/`firePostHoF` gating — **both
  confirmed live, 5 hits each**). My reconciled spec already drops it. Recorded so it isn't
  resurrected from the older doc.

---

## 6. 🟢 S6 — Naming & vocabulary drift (lock now, it's cheap)

| Concept | Variants in the wild | Recommend |
|---|---|---|
| Rival affinity scalar | `sm.rivalAffinity` (S4) · `rivalRespect` (Craft §4) | pick one before code; affects Collection→Rivalry copy (**D4**) |
| Cinematic registry / trigger | `STORY_CINEMATICS`/`_playCinematic` (S4) · `PRE_BOSS_CINEMATICS`/`_playPreBossCinematic`/`_showWildEncounterCinematic` (S3) | converge per **D3** |
| Stream labels | each stream inferred the others differently | adopt the brief's canonical four names (this report uses them) |
| Flag namespacing | `setup.*`/`seen.*` (S4) · ad-hoc keys in S1/S2 examples | adopt S4's namespaced `sm.flags` convention so callbacks stay greppable |

No two streams chose *contradictory* shapes for the **choice contract** — S2 §9.2 #4 and S4 §3.2
both insist `persistKey`/`value`/`reply`/`branches.when` stay byte-identical. That core is safe.

---

## 7. What already cohered (the good news — no action)

- **One schema, agreed.** All streams build on `STORY_SCENES` + `_renderNarrativeOverlay`; S2 §9.1
  explicitly says *"don't invent a schema — extend the one that already won."* My §3.4 extends it
  additively. No forks.
- **One architecture, agreed.** Every spec adopts **events = bottlenecks, camp = the diamond**,
  grounded-episodic, classic-only, no overarching-mystery retrofit.
- **Guardrails honored everywhere.** All four cite saves-sacred / never-renumber / seeded RNG /
  behavior-needs-sign-off. S3 explicitly touches no save schema; S1 explicitly renumbers nothing.
- **The handshake is bidirectional where it counts.** S2's four data-layer asks (speaker block,
  externalize pools, `barkPool`, byte-identical contract) are all answered in S4 §3.4/§3.5; S3's
  raid-frame + pre-boss needs map to S4 §3.3; S1's setup-beat need maps to S4 §3.1. The only
  *unmet* asks are the dispatcher items (S3 above), which were misrouted to S4.
- **Anchors are consistent across the Immersion specs** (all resolved mid-2026; S3 Appendix A and
  S4 Appendix A agree, e.g. `_showRoamingLegendarySighting:47964`). Only the **Camp docs drift**
  (they cite `~47655`/`~45003`/`~29847`); use the Immersion specs' current values.

---

## 8. CONSOLIDATED DECISION LIST (the single maintainer ask)

> **✅ Resolved 2026-06-04:** **D1** = unified v25, Stream 4 owns (Option A) · **D2** = Overhaul
> Phase E owns the dispatcher; flow bugs G3/G4 ship ahead · **D3** = Promise facade over Stream 3's
> cinematic bodies · **D4** = `rivalFriendship` · **D6** = Standard tuning (±12; win +1 / loss −2;
> choice ±1) + derive-from-history saves · **D7** = barks + cinematics + impact approved, timed
> "resonance" choice CUT. **D5 remains open** (raid scope — awaiting maintainer).
>
> Tagged `[BLOCKER]` (gates implementation), `[scope]`, `[api]`, `[balance]`, `[naming]`,
> `[sign-off]`. My recommendation in **bold**.

1. **D1 `[BLOCKER]` — the v25 version ladder.** Camp + Immersion(`rivalAffinity`) + Phase-E
   dedup all want v25. **→ One unified `migrateStoryPreV25`, owned by Stream 4** (Camp & Phase-E
   contribute field blocks); or strict sequencing v25→v26→… if timelines differ. Never two v25s.
2. **D2 `[scope]` — own H4-1/2/3 (flow order, reserved slots, slot dispatcher).** **→ Assign to
   Overhaul Phase E, not an Immersion stream**, and land it **before/with** the setup-beat hook
   (which depends on it). G3/G4 can ship ahead as cheap sort/reservation fixes.
3. **D3 `[api]` — converge the cinematic layer.** **→ Keep Stream 3's concrete
   `_showWildEncounterCinematic`/`_playPreBossCinematic` as bodies; make `_playCinematic` the
   Promise facade; one registry (`STORY_CINEMATICS`).** I'll refold S4 §3.3 on your nod.
4. **D4 `[naming]` — rival scalar name:** `sm.rivalAffinity` vs `rivalRespect`.
5. **D5 `[balance]` — `miniRaid2` scope:** (A) fix the roller → 24 raids + 8 evolved bosses w/
   HP-threshold mechanics (**S3-recommended**), or (B) visual-only for 16, log the data bug.
6. ~~**D6 `[balance]` — rival-friendship tuning.**~~ ✅ **RESOLVED: Standard** — range ±12, win +1 /
   loss −2, per-choice ±1 (±2 at pivots); existing saves **derive from history** (net wins−losses,
   clamped). *(S4 §9.)*
7. **D7 `[sign-off]` — behavior/presentation changes** (collated across streams): ✅ **approved to
   develop** — barks (S2/S4) · raid-framing + pre-boss cinematic (S3 §4–5) · hit-stop / screen-shake /
   portrait-emotion (S3 §6) · the friendship write in `setRivalStanding`. ❌ **CUT** — the
   timed/"resonance" choice (Craft §6). Each approved item still gets a diff before shipping.
8. **D8 `[note]` — Stream 2 is already signed off (2026-06-04).** Its copy decisions (incl. the
   §11.1 rival-name fix) are locked; only its **engine hand-off** (speaker/`barkPool`/pool
   externalization) is pending, and lands as part of Stream 4 §3.4/§3.5.

---

## Appendix — verification log (symbols the specs assume)

| Symbol (asserted by) | Hits | Verdict |
|---|---|---|
| `_activeBeatBattleKey` (S3 shim) | 13 | **real** — S3's raid shim is grounded |
| `fireAtEvent` / `firePostHoF` (S1 "league bug is stale") | 5 / 5 | **real** — confirms the old P0 is fixed |
| `ANOMALY_SEEDS` / `_tryFireAnomalySeed` (S1 H2-2/H3-2) | 3 / 3 | **real** |
| `_resolveActiveRoadBeats` (S1 H4-3) | 3 | **real** — the Phase-E dispatch surface |
| `BOSS_CONFIGS` / `_populateExtraRaidConfigs` / `_EXTRA_RAID_SPECIES` (S3) | 16 / 2 / 2 | **real** |
| `PRE_BOSS_CINEMATICS` / `_showWildEncounterCinematic` / `_playPreBossCinematic` (S3) | 0 / 0 / 0 | **new** — proposals (overlap S4's new `STORY_CINEMATICS`/`_playCinematic`) |
| `slot.bonds` (Craft "reuse existing") | 0 | **new** — Camp-owned future state, *not* shipped |
| Camp v25 fields `sm.campByEventIdx` / `sm.campReturnPoint` | (CAMP_FLOW §7) | Camp's half of the v25 body |
