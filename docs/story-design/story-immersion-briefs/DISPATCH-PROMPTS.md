# Dispatch Prompts — copy-paste kickoffs for the Story Immersion initiative

**How to use**
- Run each stream in its **own fresh Claude Code session on the repo** (`merogith/battle`) — they
  audit `battle.html`, so they need repo access (web or CLI), **not** a plain chat.
- **Recommended: split** — four sessions, one per stream, in order **1 → 2 → 3 → 4** (or any order;
  they're parallel design specs).
- **Tip:** Stream 4 (Systems) is the *foundation* the other three reference. If you run sessions
  **sequentially**, doing 4 early helps the rest cite a real API; if you run them **in parallel**,
  just reconcile Stream 4's API at review. Order doesn't block.
- Optional: give each session its own branch (e.g. `claude/immersion-stream-1`). Deliverables are
  separate files, so they merge cleanly.
- The briefs are already in the repo, so attaching your downloaded copy is optional — paste the
  block and the agent reads the paths.

---

## ✅ RECOMMENDED — split: one prompt per chat (in order)

### Stream 1 — Narrative Coherence & Causality
```
You're running Stream 1 — Narrative Coherence & Causality — of the "Story Immersion" design
initiative for the Pokemon battle game (repo: merogith/battle). You own the "why is this
happening" backbone that kills the "out of nowhere" feeling.

Read these two files in full first (in the repo; attached too):
- docs/story-design/story-immersion-briefs/01-narrative-coherence.md  (your brief, self-contained)
- docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md          (the shared craft playbook)

Then execute the brief:
1. READ-ONLY audit of the timeline + intros (STORY_EVENTS_RAW, cold-opens, intro queue, city
   arrivals). Resolve symbols with find-anchor — never hardcode line numbers. Open with a
   "current state" + a prioritized, anchored gap list (include the raid->trainer-intro mismatch).
2. Produce docs/story-design/story-immersion/narrative-coherence.md — the per-event coherence-card
   table (who/why/now/stakes/next), the setup-beat pattern (+ where it hooks, per the playbook:
   camp = the diamond, events = bottlenecks), the encounter-framing matrix, and REAL before/after
   samples for the 5 worst offenders, plus a handoff list for Streams 2/3/4.
3. DESIGN PASS ONLY — do not change game code, do not reorder/renumber STORY_EVENTS_RAW. Propose
   for sign-off; flag any flow-ordering bug. Ground everything in the actual code.

Start with the audit and a short plan, then write the spec.
```

### Stream 2 — Dialogue & Writing
```
You're running Stream 2 — Dialogue & Writing — of the "Story Immersion" design initiative for the
Pokemon battle game (repo: merogith/battle). You own clear, voiced, high-impact words.

Read these two files in full first (in the repo; attached too):
- docs/story-design/story-immersion-briefs/02-dialogue-and-writing.md  (your brief, self-contained)
- docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md          (the shared craft playbook)

Then execute the brief:
1. READ-ONLY audit of current dialogue (cold-opens, trainer/rival/professor/Mystery-Figure lines,
   story beats). Quote representative offenders with anchors (find-anchor — no hardcoded lines) and
   diagnose why each is confusing or flat. Open with a "current state" section.
2. Produce docs/story-design/story-immersion/dialogue-and-writing.md — the voice/tone guide
   (grounded-coherent-classic, slightly edgier), REAL before/after rewrites for the worst offenders
   + setup-beat copy + the high-impact beats, the 4 choice types in action (flavor / consequence /
   illusion / NO blind), barks, and the data-driven dialogue schema (coordinate with Stream 4).
3. DESIGN PASS ONLY — do not change game code. The maintainer signs off on tone + copy; surface
   borderline lines, don't ship them. Keep "Pokemon" diacritic consistency. Ground in real lines.

Start with the audit and a short plan, then write the spec.
```

### Stream 3 — Visual & Cinematic
```
You're running Stream 3 — Visual & Cinematic — of the "Story Immersion" design initiative for the
Pokemon battle game (repo: merogith/battle). You own scenes, sprites, animation, cinematics, and
correct encounter framing, including the raid trainer-intro fix.

Read these two files in full first (in the repo; attached too):
- docs/story-design/story-immersion-briefs/03-visual-and-cinematic.md  (your brief, self-contained)
- docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md          (the shared craft playbook)

Then execute the brief:
1. READ-ONLY audit of presentation (the narration overlay / _storyScene, StoryFx SFX, sprite +
   bg_<type> assets — note pokesprite is vendored at sprites/pokesprite/ — and existing cinematics
   incl. docs/story-design/camp/EVENT_CINEMATICS.md). Resolve symbols with find-anchor. Open with a
   "current state" + reusable-engine inventory.
2. Produce docs/story-design/story-immersion/visual-and-cinematic.md — the visual framing matrix +
   the raid-fix plan (exact mechanism / where), a reusable pre-boss cinematic template, the
   per-event visual-beat catalogue + the "impact" layer (hit-stop, flash, portrait-emotion swap for
   recurring cast), with REAL mocked frames (ASCII/step-by-step). Reuse the existing engine; no new
   heavy art (respect the 4 MB file).
3. DESIGN PASS ONLY — flag the raid-framing change for sign-off (it alters presentation). Seeded RNG
   for any variance. Ground every point in the actual code.

Start with the audit and a short plan, then write the spec.
```

### Stream 4 — Storytelling Systems & Tools  *(the foundation — the other three build on its APIs)*
```
You're running Stream 4 — Storytelling Systems & Tools — of the "Story Immersion" design
initiative for the Pokemon battle game (repo: merogith/battle). You are the FOUNDATION: the
other three streams build on the APIs you spec.

Read these two files in full first (they're in the repo; attached too):
- docs/story-design/story-immersion-briefs/04-storytelling-systems.md  (your brief, self-contained)
- docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md          (the shared craft playbook)

Then execute the brief:
1. READ-ONLY audit of your lane in battle.html. Resolve every symbol with the find-anchor / anchor
   skill — never hardcode line numbers. Open the spec with a "current state" + tool-gap analysis.
2. Produce docs/story-design/story-immersion/storytelling-systems.md — a design spec with REAL,
   tiny usage examples for each tool (setup-beat hook, choice/consequence + story-state = flags +
   one rival-affinity number, cinematic trigger, content schema), the save-migration sketch, the
   test plan, and a handshake table of which API each other stream consumes.
3. DESIGN PASS ONLY — do not change game code. Propose; the maintainer signs off before anything
   ships. Saves are sacred (one migration, never renumber). Flag any flow-ordering/behavior issue.
   Ground every point in the actual code — no generic advice.

Start with the audit and a short plan, then write the spec.
```

---

## ◻ ALTERNATIVE — one agent, one chat (shallower, one voice)
```
You're running the FULL "Story Immersion" design initiative (all four streams) for the Pokemon
battle game (repo: merogith/battle).

Read these in full first (in the repo; attached too):
- docs/story-design/story-immersion-briefs/ALL-IN-ONE.md      (all four briefs + shared context)
- docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md (the shared craft playbook)

Produce FOUR deliverables under docs/story-design/story-immersion/ — one per stream
(storytelling-systems.md, narrative-coherence.md, dialogue-and-writing.md, visual-and-cinematic.md).
Work in the order 4 -> 1 -> 2 -> 3 (foundation first). For each: a READ-ONLY audit of that lane
(find-anchor; no hardcoded line numbers) -> a "current state" section -> the spec WITH REAL SAMPLES
(before/after rewrites, mocked frames, API + usage, fix lists). DESIGN PASS ONLY: no game-code
changes, propose for sign-off, saves sacred (never renumber), flag behavior/balance/flow issues,
ground everything in the actual code.

Start with Stream 4's audit and a short plan.
```
