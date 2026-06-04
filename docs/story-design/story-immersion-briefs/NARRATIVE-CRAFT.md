# Narrative Craft Playbook — shared appendix for the Story Immersion brief set

> **Read this with your stream brief.** It's the common vocabulary + rules every stream
> designs to, so the four specs cohere instead of drifting. Grounded in the maintainer's
> direction (2026-06-03/04) and standard narrative-design practice, **mapped to THIS game**
> (not generic theory). If you were dispatched outside the repo, make sure you also have this file.

## 0. The disease we're curing
Story mode is a **flat node chain**. Events fire with no setup (*"out of nowhere"*), there are
no real choices (*no agency*), nothing remembers what you did (*no callbacks*), and pacing is a
run of dead "Continue" clicks (*"next-next-next go"*). The cure is **four layers added without
touching the event timeline.**

## 1. Architecture — events are Bottlenecks, camp is the Diamond
This is the single most important idea; everything else hangs off it.

- `STORY_EVENTS_RAW` **cannot be renumbered** (re-pointing `sm.eventIndex` = save corruption).
  In foldback terms, **every story event is a fixed Bottleneck.** That's a feature: foldback
  structure is *built around* immovable bottlenecks.
- **Camp already sits between every pair of events** (Camp System spec: forced once per
  transition, 1-tap "Break camp"). That makes camp the **Diamond** — the chamber where choices
  branch out and **fold back** before the next fixed event.

```
Event N            CAMP (the diamond)                 Event N+1
(bottleneck)  ──▶  setup beat · choices · state  ──▶  (bottleneck)
 fixed              callbacks · barks                  fixed
```

> **The rule:** all new agency, memory, and motivation live in **(a) the camp diamond** and
> **(b) the pre-event setup beat / cold-open**. **Never** in timeline edits. This is what lets us
> add a full C&C narrative layer with **zero save risk.**

## 2. The four layers (+ resonance)
1. **Establishing node** (the setup beat) — a short *who / why / now / stakes* scene before an
   event. Lives at **camp's end** by default, or the **battle cold-open** for city/major beats.
   Kills "out of nowhere." *(Stream 1 defines them; Stream 2 writes them; Stream 3 shows them.)*
2. **Foldback choices** — one **real** branching choice per diamond that folds back by the next
   event, plus cheap **flavor choices** for roleplay. *(Stream 1 maps where; Stream 2 writes;
   Stream 4 builds the engine.)*
3. **State + callbacks** — **flags** + small **affinity variables** that later scenes read.
   Reuse the existing per-Pokémon affinity model (`slot.bonds`); add a light **rival affinity**.
   *(Stream 4 owns the store + API.)*
4. **Chunking + barks** — the **"no dead nodes"** rule (§5) + short triggered one-liners.
   *(Stream 2 writes; Stream 4 hooks the bark trigger.)*
5. **Resonance** (sparingly) — 2–3 spots where the *format* matches the feeling (a 5-second
   timed choice at a high-pressure beat). A spike, not a gimmick.

## 3. Choices — the taxonomy & where each goes
| Type | Effect | Use in this game | Frequency |
|---|---|---|---|
| **Flavor** | changes the reply, not the plot | rival banter, NPC chatter, camp reactions (polite / cocky / cold) | common — cheap voice |
| **Consequence (C&C)** | sets a **flag** → pays off via a later **callback** | spare vs humiliate the rival; a route/fossil pick | a few per run |
| **Illusion** | options converge; you feel responsible | the forced loss to the Mystery Figure; a Pokémon you can't save | 1–2, dramatic only |
| **Blind** | no basis to choose | **avoid** — it removes agency | ~never |

> **The C&C contract:** every *consequence* choice **must** set a flag **and** have at least one
> later callback. **No orphan flags** (a flag nothing ever reads is a cut corner, not a choice).

## 4. State model (the memory) — keep it small
- **Flags** = booleans (`rivalHumiliated = true`). **Variables** = small numbers
  (`rivalRespect`, an affinity score). **Gating** = locking a line/branch behind a flag (**hard
  gate** = needs exact flag/item) or a threshold (**soft gate** = `rivalRespect > 1`).
  **Callback** = text that references an earlier choice ("after you walked off on me…").
- **Map to our save:** a small story-state object + reuse `slot.bonds`. **v1 scope is locked:
  flags + ONE rival-affinity number** — *not* a multi-NPC web. Grounded-episodic means small,
  local callbacks, not a branching tree. (Stream 4: rides one save migration, never renumbers.)

## 5. Pacing — the "no dead nodes" rule
**Every node must do one of three things:** (a) advance understanding, (b) offer a choice
(flavor or real), or (c) deliver a bark/reaction. A node that is just "click Continue, no new
information" is the bug behind *"next-next-next."* Cut it or merge it.
- **Chunking:** break walls of text into beats the player *earns* by clicking — but each click
  must pay off per the rule above.
- **Barks:** short, triggered one-liners outside the menu (battle crit / KO / low-HP; camp
  proximity). Cheapest possible voice + impact. They are a **behavior addition → maintainer
  sign-off** before they ship.

## 6. Ludonarrative resonance — 2–3 times, no more
The mechanic of *how you read* matches the story. Primary tool here: a **timed choice** (a
~5-second ring) at a peak beat (the rival's big moment, the Mystery-Figure reveal) to make the
player *feel* the pressure. Timed input alters behavior → **sign-off.** Reserve for genuine peaks.

## 7. How every stream shows its work — the before/after method
Don't give generic advice. For each fix: **quote the current flat moment (with a `find-anchor`
anchor)**, then show the **reframed beat sequence** (establishing node → choice(s) → bottleneck
→ consequence → later callback). Concrete enough that the maintainer can picture and approve it.

## 8. What's LOCKED (design within these)
- **Reframe + connect, grounded-episodic, classic storyline only, edgier tone** with maintainer
  copy sign-off. No premise overhaul, no overarching-mystery retrofit, no revived tone-variants.
- **Setup beat lives at camp by default**; cold-open for city/major beats.
- **Story-state v1 = flags + one rival-affinity number.**
- **"No dead nodes."** **Blind choices banned.** **Illusion-of-choice only at dramatic beats.**
- **Behavior changes need sign-off** (barks, timed choices, anything touching stats/RNG/flow).
- **Saves sacred:** new state rides **one** `migrateStoryPreV*`; **never renumber**
  `STORY_EVENTS_RAW`. Flag any flow-ordering bug.

## 9. Per-stream handles
- **Stream 1 (Coherence):** the establishing nodes; the per-event foldback map; *which* choices
  exist and what they gate. The "what."
- **Stream 2 (Dialogue):** the words — choice copy, barks, voice; the before/after rewrites.
- **Stream 3 (Visual):** the impact layer — visuals for setup nodes, choice reactions, barks,
  pre-boss cinematics; correct encounter framing.
- **Stream 4 (Systems):** the engine — the flag/affinity store, the choice→callback API, the
  bark hook, the cinematic trigger, one save migration, the tests.

## 10. Glossary
**Bottleneck** — a fixed event all players pass through (our `STORY_EVENTS_RAW` rows). ·
**Diamond / foldback** — choices that branch then re-merge before the next bottleneck (our
camp). · **Flag** — a boolean memory switch. · **Variable** — a tracked number (affinity). ·
**Gating** — hard (exact flag/item) or soft (threshold) lock on content. · **Callback** — text
referencing an earlier choice. · **Bark** — a short triggered one-liner outside the menu. ·
**Chunking** — splitting text into earned, paced beats. · **Resonance** — read-mechanic matching
the story's feeling.
