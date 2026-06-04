# Story Immersion Initiative — Dispatch Guide (START HERE)

This folder is a **ready-to-dispatch agent brief set** for making Story Mode coherent, vivid,
and immersive. Every payload file below is **fully self-contained** — it carries its own shared
context (the game, the problem, the locked design decisions, the guardrails), so it runs in a
**clean chat** with no prior conversation. Pick one of the two dispatch modes:

## Mode A — one agent, one chat (everything at once)
Send **`ALL-IN-ONE.md`**. It has the shared context once, then all four streams, and tells the
agent to produce all four deliverable specs (it'll work through them, foundation first). Best
when you want a single coherent pass and don't mind one long session.

## Mode B — split across clean chats (one stream each)
Send each of these to its **own** fresh chat — they don't depend on each other or on this file:

| Send this file | To an agent that owns | Produces |
|---|---|---|
| `01-narrative-coherence.md` | Narrative Coherence & Causality | `…/story-immersion/narrative-coherence.md` |
| `02-dialogue-and-writing.md` | Dialogue & Writing | `…/story-immersion/dialogue-and-writing.md` |
| `03-visual-and-cinematic.md` | Visual & Cinematic | `…/story-immersion/visual-and-cinematic.md` |
| `04-storytelling-systems.md` | Storytelling Systems & Tools | `…/story-immersion/storytelling-systems.md` |

(Deliverables land under `docs/story-design/story-immersion/`.) You can also send any subset —
e.g. just `04` first if you want the systems foundation specced before the rest.

## What every agent is told to do
- Treat this as a **design pass**: deliver a Markdown spec **with real samples baked in**
  (before/after rewrites, mocked frames, API + usage, fix lists) for **your review before any
  code ships**.
- **Reframe + connect, not a premise overhaul**; **grounded episodic** (strong local motivation
  per event, no overarching-mystery retrofit). These are locked — agents won't relitigate them.
- **Design to the shared Narrative Craft Playbook** (`NARRATIVE-CRAFT.md`) — foldback / C&C /
  flags+callbacks / chunking ("no dead nodes") / barks / resonance, with **events = bottlenecks,
  camp = the diamond**. Every payload points to it; it's the contract that keeps the four specs
  coherent. *(Agents read it from the repo; dispatching a brief outside this repo? Attach it too.)*
- Start with a **read-only audit** of their lane and open the spec with a "current state"
  section + a prioritized, anchored problem list. No generic advice.
- Respect the `CLAUDE.md` guardrails (out-of-scope areas, saves sacred, sign-off on behavior,
  seeded RNG, align with the Camp System spec).

## The four streams at a glance
1. **Narrative Coherence & Causality** — why each event happens; per-event motivation;
   encounter-framing matrix; kills "out of nowhere".
2. **Dialogue & Writing** — clear, voiced, high-impact copy; rewrite confusing lines; voice guide.
3. **Visual & Cinematic** — scenes, sprites, animation, pre-boss cinematics; fix the raid intro.
4. **Storytelling Systems & Tools** — the engine hooks the others stand on (setup-beat hook,
   choice/consequence, cinematic trigger, content schema). **Foundation — spec first.**

*How they relate:* Stream 4 provides the hooks; Stream 1 defines what each event needs; Streams
2 & 3 supply the words and the visuals. They're written in parallel as specs; the dependency
only bites at implementation time, when Stream 4's APIs land first.

> Note: this START-HERE file is the **human dispatch guide** — you don't need to send it to an
> agent. The agent payloads are `ALL-IN-ONE.md` (Mode A) or `01`–`04` (Mode B).
