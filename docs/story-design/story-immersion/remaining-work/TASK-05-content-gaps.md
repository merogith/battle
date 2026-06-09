# TASK-05 — Content Gaps

> Two loose authoring leftovers that didn't fit the wiring streams. Grouped because both
> are "author the missing content," but they're independent — do them separately.
>
> **Bundles:** §4.5 `_RAID_LORE` authoring · D3(b) canon mirror foe for `main.battle2`.

---

## 5a — `_RAID_LORE` authoring (Stream 3 §4.5)

### Goal
Complete the raid lore table that the shipped raid frame (§4 / H3-1) reads from, so every
raid's intro card has its own lore line drawn from existing prose.

### Status
- ✅ The raid **frame** ships and reads `_RAID_LORE` (`battle.html:48010`).
- 🟡 §4.5 says the lore is "to author, draw from existing prose." **Audit coverage first:**
  the table may be partial across the 8 extra arcs × {miniRaid, miniRaid2, raid}.

### Steps
1. Enumerate the raid roster (Stream 3 Appendix B — 8 arcs) and diff against `_RAID_LORE`
   keys to find gaps.
2. For each missing entry, draw a 1–2 line lore beat from the arc's existing
   `STORY_SCENES` prose (don't invent new canon — relocate/condense).
3. Voice = the raid frame's non-trainer register (it's an apex wild, not a person).

### Anchors
| Symbol | Line | Role |
|---|---|---|
| `_RAID_LORE` | `48010` | The table to complete |
| (Stream 3 Appendix B) | `visual-and-cinematic.md` | Raid roster (8 arcs) |
| `STORY_SCENES` | (anchor) | Source prose to draw from |

### Sign-off
- Light — content authoring in an existing register. Show the drafted lines.

---

## 5b — D3(b): canon mirror foe for `main.battle2`

### Goal
Give the `main.battle2` beat an **actual canon mirror team** so the prose's "near-self"
promise is delivered mechanically, not just softened away.

### Status
- ✅ Stream 2 already **softened the prose** (D3(a)): `main.battle2` no longer over-promises
  a literal slot-for-slot mirror. That's the shipped stop-gap.
- 🔴 D3(b) — the *real* fix — is open: `BEAT_CANON_TRAINER` has **no `main.battle2` entry**,
  so the beat launches a generic route trainer. Building a canon mirror foe would let the
  prose go back to the full "matched, slot for slot" framing.

### Steps
1. Specify a mirror team for `main.battle2` (a "step ahead of you" near-self — reaching for
   the same answers). This is a **team-design / balance** decision.
2. Add the `main.battle2` entry to `BEAT_CANON_TRAINER` (sprite + signature + team).
3. If built, restore the stronger prose framing in `STORY_SCENES["main.battle2"]`.

### Anchors
| Symbol | Line | Role |
|---|---|---|
| `BEAT_CANON_TRAINER` | (getter `38795`; const via anchor) | Add a `main.battle2` entry |
| `MAIN_STORY_BEATS` | `30919` | The beat (sceneKey `main.battle2`) |
| `STORY_SCENES["main.battle2"]` | `33401` | Prose (softened by D3(a); restore if 5b ships) |

### Sign-off
- **🚩 Balance sign-off** — the mirror team is user-owned numbers (build tier, moveset,
  item, EV/IV). Extract & propose; maintainer picks. Coordinate with TASK-03 3b
  (substitution bridges) since both touch `BEAT_CANON_TRAINER`.

### Test plan (jsdom)
- `BEAT_CANON_TRAINER['main.battle2']` resolves to the canon mirror (not a generic trainer).
- The launched battle fields the specified team deterministically (seeded).
- If prose restored: the scene no longer reads as an unkept promise (content guard).
