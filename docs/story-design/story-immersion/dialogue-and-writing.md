# Story Immersion — Stream 2: Dialogue & Writing

> **Type:** DESIGN PASS ONLY. No game code is changed by this stream. Every line of copy
> below is a *proposal* for maintainer sign-off, not a shipped string. Borderline lines are
> surfaced, not committed.
> **Scope:** Story mode, normal difficulty (per `CLAUDE.md`). Quick Play / Online PvP /
> Frontier copy is out of scope and only referenced for contrast.
> **Diacritic rule:** "Pokémon", "Poké Ball", "Pokédex", "Pokémart" in all *display* copy.
> (Internal action keys like `'Pokemart'` in `STORY_EVENTS_RAW` are code, not copy — leave them.)

---

## 0. A note on inputs (read this first)

This stream's task referenced two files as required reading:

- `docs/story-design/story-immersion-briefs/02-dialogue-and-writing.md` (the brief)
- `docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md` (the shared craft playbook)

**Neither exists in the repository** — not on `main`, not on the working branch, not in git
history, not in any open PR, and they were not attached to the task. Rather than fabricate
having read them, this spec was reconstructed from (a) the task description's explicit voice
target and deliverable list, and (b) a first-hand read of the *real* dialogue in `battle.html`
and `data/dialogue/*.json`. The craft principles in §3 are standard, defensible writing craft;
**if the shared `NARRATIVE-CRAFT.md` surfaces with house-specific conventions (terminology,
table formats, a different voice axis), §3 and the rewrite formats should be reconciled to it.**
Everything else — the audit, the rewrites, the choice taxonomy — is grounded in shipped lines
and stands on its own.

Anchors below are given as **symbol names** (find-anchor style), never line numbers, because
`battle.html` is ~61k lines and line numbers drift.

---

## 1. Current state — the audit

### 1.1 The central finding: quality is bimodal

The game already contains some of the best writing in the genre — and it's almost all
concentrated in *optional* content. The 198 structured scenes in `STORY_SCENES` (the 10 villain
arcs, 8 extra/horror arcs, and the 14-scene main spine) are terse, concrete, sensory, and willing
to sit in discomfort. `STORY_NARRATION_SYSTEM.md` confirms "**0 flat scenes remain**" there.

Representative exemplars (the bar — quote verbatim, anchor `STORY_SCENES`):

> **`STORY_SCENES['villain.skull.event1']`** — *"One of them holds the pose — arms out, scowl on,
> bandana low. He's also crying, the tears just rolling out over the scowl, neither expression
> winning. He picked the pose from somewhere. He didn't pick the crying. The crying was already
> there."*

> **`STORY_SCENES['villain.flare.event1']`** — *"He didn't wait for the answer. The sorting was
> never about the answer."*

> **`STORY_SCENES['main.mfReveal']`** — *"The face under it is yours. Older. Tired in a way that
> isn't about sleep. Scarred in places you aren't, yet."*

This is "grounded-coherent-classic, slightly edgier" already achieved. **The problem is that the
beats every player is guaranteed to hit — the spine — are a tier below this.** Story immersion
breaks not because the writing is bad, but because the *floor* (cold-opens, the mentor, the
Mystery climax intro, setup, barks) doesn't meet the *ceiling* the player occasionally glimpses
in the side content.

### 1.2 Offender A — one voice narrates the whole journey

`STORY_COLD_OPENS` routes nearly every spine milestone through **Prof. Oak**, same sprite, same
register. The beats and their anchors:

| Beat | Anchor | Speaker |
|---|---|---|
| After Badge 1 | `STORY_COLD_OPENS.classic_gym1` | Oak |
| Post-Gym-3 bench | `STORY_COLD_OPENS.classic_npc_r20` | Oak |
| Halfway (Badge 4) | `STORY_COLD_OPENS.classic_gym4` | Oak |
| Post-Gym-5 casino | `STORY_COLD_OPENS.classic_npc_r33` | Oak |
| Gate to City 8 | `STORY_COLD_OPENS.classic_npc_r48` | Oak |
| Pre-Gym-8 twist | `STORY_COLD_OPENS.classic_twist` | Oak |
| Before the Plateau | `STORY_COLD_OPENS.classic_gym8` | Oak |
| Champion's Hall | `STORY_COLD_OPENS.classic_champion` | Oak |
| Post-Hall-of-Fame | `_POSTHOF_EPILOGUE_BY_VARIANT.classic` | Oak |

Individually the lines are fine — *"Heal your team. Pick up Poké Balls. Walk."* is a clean Oak
beat. **In aggregate, the entire main road is one man's voice in one mood.** Two specific costs:

1. The code comment on the r20/r33/r48 family says these are *"3 mid-route NPC appearances… The NPC
   grows across appearances; the player recognizes them by the third scene."* But all three are
   Oak — the player *already* knows Oak, so the "recognize them by the third scene" payoff
   **can't land.** The design intent is defeated by the casting.
2. The genuinely strong beat — `classic_twist` (*"My first journey ended at this gym. I didn't win
   it. I went home. I became a professor."*) — is the best Oak line in the game and it's **buried**
   among seven other Oak monologues, so it reads as more-of-the-same instead of the gut-punch it is.

This is the highest-leverage fix in the stream: not rewriting Oak, but **re-casting** beats so the
spine has more than one throat. (See §6.)

### 1.3 Offender B — the Mystery climax intro is cryptic *and* spoilery at once

The post-Hall-of-Fame climax fight (event row 67) is gated by an intro that tries to be both a
mystery *and* the reveal:

> **`_MYSTERY67_BY_VARIANT.classic`** — *"A figure waits in the chamber the Champion vacated. / No
> herald, no announcement, no badge. Just the mask, the team, and the fight. / 'You're the one I
> came for. The chair will tell you the rest after.'"*

> **`MYSTERY_FIGURE_IDENTITIES.the_first.intros`** — *"You're going to win this one. The next one
> too. That's the problem." / "I am every version of you that didn't stop." / "The hall behind you
> has a portrait with my face — and yours." / "End this loop. Start the next."*

**Diagnosis.** The actual reveal scene — `STORY_SCENES['main.mfReveal']` ("It Was You") — is
*excellent* and lays the loop bare with full weight. But the intro above front-runs it: *"I am
every version of you that didn't stop"* and *"End this loop. Start the next."* half-state the twist
before the fight, so it's simultaneously **too vague** for a cold player (who is this? what loop?)
and **too revealing** for the reveal scene to still hit. The seeding that would make it legible
(*"Tell me how it ends this time"* in `STORY_SCENES['main.event1']`) lives in optional main-track
content the player may never have registered. The intro is doing three jobs (atmosphere, mystery,
exposition) and lands none cleanly.

### 1.4 Offender C — flat pool lines read as status readouts

The Elite Four and generic-rival pools in `data/dialogue/trainer-quotes.json` are serviceable but
flavorless next to the named-leader pools:

> **`TRAINER_QUOTES['E1']`** — *"First gate of four. Welcome to the league."*
> **`TRAINER_QUOTES['E4']`** — *"Last gate. The Champion's door is at my back."*
> **`TRAINER_QUOTES['Rival']`** — *"You again. Same road, same fight."*

Compare the *named* pools, which have real voice:

> **`LEADER_VICTORY_LINES['Whitney']`** — *"…I'm not crying! …Fine. Take the Plain Badge already."*
> **`CHAMPION_VICTORY_LINES['Blue']`** — *"Smell ya later… you actually did it."*

The Elite Four are the prestige wall of the whole run; their pre-fight voice is currently a
*counter* ("gate of four") rather than a threat or an identity. This is the easiest pool to lift.

### 1.5 Offender D — tutorial scenes are correct but read like a manual

`STORY_TUTORIAL_SCENES` onboarding is information-dense by necessity, but several entries spend a
characterful NPC on spec prose:

> **`STORY_TUTORIAL_SCENES.firstColress`** — *"One form per Pokémon — committing a mon means
> committing the held item slot too. A Mega Stone or Z-Crystal lives there. Dynamax and Tera leave
> the slot alone."*

Colress (a coldly curious scientist) is a gift of a voice, and the copy uses none of it. **Caveat
that governs every tutorial rewrite below:** clarity outranks edge here — a rewrite may not drop a
single mechanic. The fix is voice + economy *around* the facts, not fewer facts.

### 1.6 Offender E — barks have no variance layer

The battle log (`logMsg(...)`) is all hard-coded singletons:

> *"It's super effective!"* · *"It's not very effective…"* · *"A critical hit!"* · *"{name}
> fainted!"* · *"{attacker} used {move}!"* · *"But it failed!"* (the single most-repeated string
> in the file)

Two of these (*super effective*, *not very effective*) are load-bearing **state information** and
canon — leave them exactly. But the *terminal/emotional* beats (a faint, a flee, the last mon
going down) repeat identically every time, which flattens the moments that should land hardest.
See §8 for an engine-safe variance design that touches only the non-state lines.

### 1.7 Offender F — setup copy abandons its own voice

The Story-mode title tagline is the best single line in the onboarding:

> **`.story-tagline`** — *"A single-player road from Pallet Town to the Champion's seat — and
> whatever waits after the credits."*

Then the trainer-create form drops it entirely:

> **`#story-create`** — *"1 — Your trainer"* · placeholder *"Enter your name"* · *"Trainer look"* ·
> *"Advanced — mechanics & item rules"*

The player is promised a road and handed a settings panel. The fix (§7) keeps the form scannable
but lets the journey voice survive the first ten seconds of the game.

### 1.8 Two borderline lines — needs your call (do not ship without sign-off)

1. **The rival's display name is literally `"{PlayerName} Sucks"`** (`_storyRivalTauntName`). It's
   a faithful RBY in-joke, but it collides with earnest cold-open prose: the intro
   (`_STORY_INTRO_SCENES.classic`) reads *"someone's blocking the route gate. {rival}."* → renders
   as *"…the route gate. Mer Sucks."*, then *"They picked up their starter the same morning you
   did"* — sincere lines describing an entity named "Mer Sucks." **Options in §10.**
2. **Orphaned content:** `_shouldFireFirstSightingLore` gates on `tier === 'mature' / 'soft_pasta'
   / 'pasta'`, but the tone layer was cut and every run is `tier: 'classic'`, so the
   `_FIRST_SIGHTING_LORE` overlay **never fires.** This is a spec-drift / dead-content issue more
   than a writing one — flagging for the orchestrator (Stream 1 / spec-drift), not proposing a fix
   here.

---

## 2. What "good" already looks like (the reference set)

Before prescribing a voice, anchor it in lines the project already shipped and clearly endorses.
Every rewrite in this spec is calibrated to sit beside these without a seam:

- **Sensory grounding:** `CITY_ARRIVAL_LINES` — *"Sea salt, sawgrass, three houses and a lab."* /
  *"The last gym sits inside an old cathedral. Bells, candles, stained-glass Lugia."*
- **Edge through restraint:** `STORY_SCENES['villain.skull.event1']` — the crying grunt who
  *"picked the pose… didn't pick the crying."*
- **Subtext over statement:** `STORY_SCENES['main.ending']` — *"Run #1, the plate insists, though
  you both know the number is a mercy."*
- **Voice in a victory pool:** `LEADER_VICTORY_LINES['Volkner']` — *"…Finally. Something worth
  being shocked over. Beacon Badge."* (and the reflection pairs it: `LEADER_BADGE_REFLECTIONS['Volkner']`
  — *"Sunyshore's solar panels gleam. Finally, a match worth their charge."*)

These four lines *are* the house style. §3 just makes the rules explicit.

---

## 3. Voice & tone guide — "grounded-coherent-classic, slightly edgier"

### 3.1 The three words, defined

- **Grounded** — concrete nouns and real-world texture before abstraction. Quarry sirens, coffee,
  mud at a trailhead, a bench, a clipboard. No high-fantasy register, no "ancient evil," no
  prophecy-speak unless a character is *performing* it and we know it's a performance.
- **Coherent-classic** — the canonical Pokémon journey shape (mentor → rival → eight badges → the
  wall at the Plateau → what's after) played straight and kept internally consistent. We don't
  subvert the classic; we render it with adult attention. No tonal whiplash between a beat and the
  beat next to it.
- **Slightly edgier** — willing to name the uncomfortable thing (the loop's quiet despair, the
  rival's cold turn after a losing streak, a child crying behind a gang pose) **but the edge lives
  in subtext and specificity, never in shock.** If a line would feel at home in an edgelord
  creepypasta, it's over the line. The villain/extra arcs already mark the ceiling — match it,
  don't exceed it.

### 3.2 Craft rules (working set — reconcile with `NARRATIVE-CRAFT.md` if it surfaces)

1. **Specific beats generic.** "the casino" → "the slot floor"; "your team" → "your starter near
   the front."
2. **Show through behavior, not adjectives.** Don't write "he was menacing." Write what he does
   that you read as menace.
3. **Cut a third.** Most spine lines are 10–20% too long. Trailing clauses that restate the point
   are the first to go.
4. **One idea per line.** The overlay renders one `<p>` per array entry; respect that — each line
   should be a single landed beat, not a paragraph.
5. **Earn the abstraction.** Concrete image first, meaning second. `main.event1` does this: the old
   man on the bench *first*, then "this time, as if there were others."
6. **Narration is second-person present; character speech is quoted.** Keep the existing
   convention: narration *"A figure waits in the chamber…"*; speech *"'You're the one I came
   for.'"*
7. **Mechanics never ride in story beats.** Telegraphs and rules live in tutorial scenes and the
   battle UI, not in `STORY_COLD_OPENS` or `STORY_SCENES.acts` (the narration system explicitly
   strips boss-mechanic text out of pre-fight acts — hold that line).
8. **Punctuation carries voice.** The em-dash and the leading ellipsis are the house tells (Oak's
   measured pauses, a leader's reluctant respect). Keep them; don't sprinkle exclamation marks to
   manufacture energy.

### 3.3 Voice differentiation — give the spine more than one throat

The single most important guide in this doc. Each recurring speaker gets a distinct register so
the player can tell who's talking with the nameplate hidden:

| Speaker | Register | Tells | Never |
|---|---|---|---|
| **Prof. Oak / the professor** | Warm, measured, a little wistful. The mentor who *also lost once.* | Em-dash pauses; imperatives in threes (*"Heal. Restock. Walk."*); admits his own past | Hype, slang, exclamation spam |
| **The Rival** | Competitive, present-tense, escalates with the standing system | Short jabs; references the scoreboard; turns cold on the player's losing streak | Cartoon villainy; motiveless cruelty |
| **Gym Leaders** | One personality each, already in the pools — *protect their distinctness* | Hometown/biome references; trade-craft pride | Interchangeable "good battle!" filler |
| **Elite Four** | The wall. Quiet menace, certainty, room-by-room dread | Cold understatement; treat the player as the *next* in a long line | Counting ("gate of four") as personality |
| **The Mystery Figure / The First** | Tired, kind, certain-eroding. Dread, not exposition | Knows things he shouldn't; speaks in worn-down certainty | Riddles that *explain* the twist early |
| **Villain grunts (3-track)** | Already excellent — banal, specific, human-scaled menace | The ordinary cruelty of a sticker, a sage, a clipboard | Mwa-ha-ha; "destroy the world" |
| **World narrator (city/route)** | Sensory, terse, no speaker | Concrete nouns; two-line max | Editorializing; telling the player how to feel |
| **System / barks** | Functional first, flavor only where it can't confuse | Canon phrases stay canon | Flavor on state-critical lines |

---

## 4. Before / after — the worst offenders

> Format: **BEFORE** is the verbatim shipped line (anchor given). **AFTER** is the proposal.
> All AFTERs hold the diacritic rule and the one-idea-per-line array convention.

### 4.1 The Mystery climax intro (Offender B) — commit to dread, let the reveal reveal

**Anchor:** `_MYSTERY67_BY_VARIANT.classic` (pre-fight intro, row 67)

**BEFORE**
> A figure waits in the chamber the Champion vacated.
> No herald, no announcement, no badge. Just the mask, the team, and the fight.
> "You're the one I came for. The chair will tell you the rest after."

**AFTER**
> The Champion's chair is empty. Someone stands in front of it — in your colors, under a cap like yours.
> No badge, no name, no announcement. They send out six Pokémon, and you have met all six before.
> "I've done this before," they say. "You'll get the part that matters after. Not before. Never before."

*Why:* keeps the mystery total (no "loop," no "every version of you"), but seeds it honestly in
images the player can verify mid-fight — *your colors*, *a cap like yours*, *six you've met* (their
team mirrors the player's). The dread is "why does this stranger feel like me," which the reveal
scene then answers. Exposition moves out of the intro and stays in `main.mfReveal` where it earns
its weight.

**Anchor:** `MYSTERY_FIGURE_IDENTITIES.the_first.intros` (in-battle barks during the climax)

**BEFORE**
> "You're going to win this one. The next one too. That's the problem."
> "I am every version of you that didn't stop."
> "The hall behind you has a portrait with my face — and yours."
> "End this loop. Start the next."

**AFTER**
> "You're going to win this. You always do. That's the problem, not the prize."
> "Fight me like you mean it. I came a long way to lose this on purpose."
> "Don't look at the empty portrait behind me yet. After."
> "Good. Again. Harder."

*Why:* the first line is already strong — keep its spine, cut the explanation. The others trade the
stated twist ("every version of you," "end this loop") for *behavior that implies it* (came to lose
on purpose; the empty portrait; "again, harder" — a teacher's cadence). The reveal scene keeps the
exclusive right to say the words. Note `main.mfReveal` and `main.ending` stay **untouched** — they
are the bar; this only stops the intro from spoiling them.

### 4.2 Elite Four pools (Offender C) — make the wall feel like a wall

**Anchor:** `TRAINER_QUOTES['E1']`, `['E2']`, `['E3']`, `['E4']` in `data/dialogue/trainer-quotes.json`

**BEFORE (E1)**
> "First gate of four. Welcome to the league."
> "…So you made it past Victory Road. Most don't."
> "Big leagues now. No more rookie excuses."
> "First test of the chamber. Don't blink."

**AFTER (E1)**
> "Most challengers who reach this room are already finished. They just haven't been told."
> "…You climbed Victory Road. Good. The road was the easy part."
> "Four rooms stand between you and the chair. I'm the one you'll think you understand."
> "No rookie excuses past this door. Sit your six down across from mine."

**BEFORE (E4)**
> "Last gate. The Champion's door is at my back."
> "…This is the chamber most people lose in."
> "Past me there's only one fight left. Don't blow it."
> "No regrets. No excuses. Begin."

**AFTER (E4)**
> "The Champion's door is at my back. Nobody has walked through it past me in a long time."
> "…This is the room most people lose in. They never see it coming. It's quiet, like this."
> "One fight left after me. Make sure there's enough of your team left to win it."
> "No regrets. No excuses. Last door. Begin."

*Why:* preserves the structural fact (four rooms, the chair beyond E4) but renders it as menace and
certainty — the wall treats the player as the latest in a long line of the finished. Keeps the
ellipsis tell and the terse close.

**Anchor:** `TRAINER_QUOTES['Rival']` (generic rival pool — used when the standing-aware pools in
`pickRivalSecondaryIntroLine` don't fire)

**BEFORE** (sample)
> "You again. Same road, same fight."
> "I've been training since the last time."
> "Different team than last time. Adapt."

**AFTER**
> "There you are. I was starting to think you took the long way to dodge me."
> "I didn't stop training when you walked off. Hope you didn't either."
> "New team since last time. Read it fast or lose slow."

*Why:* same beats, more person. The rival should sound like someone who's been *thinking about you*
between fights — the standing system already does this beautifully in `pickRivalSecondaryIntroLine`;
the generic fallback should match that floor.

### 4.3 Tutorial density (Offender D) — voice + economy, zero mechanics lost

**Anchor:** `STORY_TUTORIAL_SCENES.firstColress`

**BEFORE** (4 dense lines)
> "Battle forms — Mega Evolution, Z-Moves, Dynamax, Terastallize. Each one bends the rules in a different direction."
> "You earn the right to use them gym by gym. The fifth gym opens the first door. I'll let you choose which form a given Pokémon carries into battle, and which signature move comes with it."
> "One form per Pokémon — committing a mon means committing the held item slot too. A Mega Stone or Z-Crystal lives there. Dynamax and Tera leave the slot alone."
> "The trade-off is always: spectacular swing, finite window. Read the fight before you spend the trick."

**AFTER** (same four facts, Colress's clinical fascination, tighter)
> "Battle forms. Mega, Z, Dynamax, Tera. Four ways to break the rules — each in a different direction. I find them *fascinating.*"
> "You unlock them like everything else here: one gym at a time. The fifth opens the first door. After that, you tell me which form a Pokémon carries, and which signature move comes with it."
> "One form per partner — and a Mega Stone or Z-Crystal moves into the held-item slot to do it. Dynamax and Tera don't ask for the slot. Choose accordingly."
> "Every form is the same bargain: a spectacular swing, a finite window. Spend it on a read, not a reflex. …I'll be watching which you choose."

*Mechanics audit (all four survive):* (1) the four forms exist; (2) gym-gated, fifth gym opens it,
player picks form + signature move; (3) one form per mon, Mega/Z eat the item slot, Dynamax/Tera
don't; (4) spectacular-but-finite, use on a read. **Nothing dropped** — only voiced and trimmed.
This is the template for re-voicing the rest of `STORY_TUTORIAL_SCENES`; apply the same
"facts-intact, voice-added, cut-a-third" pass to `firstCasino` and `firstFanClub` (the two other
4-line walls), and leave the already-tight ones (`firstMoveTutor` is good) alone.

### 4.4 The Oak monotony fix (Offender A) — re-cast, don't rewrite

Most `STORY_COLD_OPENS` Oak lines are individually fine; the fix is **casting**, covered as a beat
map in §6. The one *line-level* change: the recurring-stranger family (`classic_npc_r20/r33/r48`)
should move off Oak onto a **new recurring NPC** so the "recognize them by the third scene" design
works. Proposed character: a Veteran on a route bench, same sprite all three times, who remembers
the player.

**Anchor:** `STORY_COLD_OPENS.classic_npc_r20` (currently Oak)

**BEFORE** (Oak)
> "Just checking. The third gym usually marks where trainers either bloom or burn out. You look ready."
> "I brought sandwiches. Take one. Walking gyms back-to-back without food is the rookie mistake."
> "Heal at the next center. Keep your starter near the front. Walk on."

**AFTER** (new recurring Veteran — appearance 1 of 3, doesn't know you yet)
> A veteran's resting on the route bench, six worn balls on his belt, watching the road like he's read it before.
> "Third badge. This is the stretch where most of 'em quit and don't notice they quit. You're still walking. Noted."
> "Eat something. Heal at the next town. And keep your first partner up front — the one you started with. People forget that one when the team gets crowded."

*r33 (appearance 2 — starting to recognize you) and r48 (appearance 3 — "you again") would escalate
the familiarity, so the third hit lands as a reunion. Full three-beat copy in §6.2.*

---

## 5. The high-impact beats — the spine, voiced end to end

These are the beats every player hits, in order. For each: the anchor, the role it plays, and the
voice that should carry it. Where the shipped line is already strong, it's marked **keep**.

| # | Beat | Anchor | Voice | Status |
|---|---|---|---|---|
| 1 | Starter duel / first rival | `_STORY_INTRO_SCENES.classic` | Oak (mentor sets the road) | keep, see §5.1 |
| 2 | After Badge 1 | `STORY_COLD_OPENS.classic_gym1` | World narrator *or* Oak | keep |
| 3 | Mid-route stranger ×3 | `classic_npc_r20/r33/r48` | **New Veteran** (re-cast) | rewrite §6.2 |
| 4 | Halfway (Badge 4) | `STORY_COLD_OPENS.classic_gym4` | Oak (bookend) | keep |
| 5 | Pre-Gym-8 twist | `STORY_COLD_OPENS.classic_twist` | Oak (his best beat) | keep, now lands |
| 6 | Before the Plateau | `STORY_COLD_OPENS.classic_gym8` | Oak | keep |
| 7 | The Champion's Hall | `STORY_COLD_OPENS.classic_champion` | World narrator (Oak optional) | tighten §5.2 |
| 8 | Mystery climax intro | `_MYSTERY67_BY_VARIANT.classic` | The First (dread) | **rewrite §4.1** |
| 9 | The reveal | `STORY_SCENES['main.mfReveal']` | The First | **keep — the bar** |
| 10 | Hall of Fame card | `_VARIANT_HOF_CARD.classic` | World narrator | keep |
| 11 | The ending / Run #1 | `STORY_SCENES['main.ending']` | The First + the loop choice | **keep — the bar** |
| 12 | Post-HoF epilogue | `_POSTHOF_EPILOGUE_BY_VARIANT.classic` | Oak (final bookend) | keep |

### 5.1 The intro (beat 1) — keep, with the rival-name caveat

`_STORY_INTRO_SCENES.classic` is good and should stay verbatim — **conditional on resolving the
"{Player} Sucks" rival-name collision (§10).** If the taunt name stays, the intro should not weave
it into sincere prose; render the rival as "your rival" in narration and reserve the taunt name for
the battle HUD only. Proposed narration-safe variant:

> "Hold up — someone's blocking the route gate. Your rival got their starter the same morning you
> got yours."
> "Same hunger, same chance, same starting line. They won't let you out of Pallet without a fight."
> "Show them what your partner can do. From here, every road has a rival on it."

### 5.2 The Champion's Hall (beat 7) — trim to land

`STORY_COLD_OPENS.classic_champion` is close but the middle line softens it. Tightening:

**BEFORE**
> "There's a quiet hallway behind the Elite chamber. The chair at the end has the Champion in it. There's only ever one chair."
> "Whatever happens — that chair is the end of this part of your road."
> "Walk in. Six on the belt. No regrets."

**AFTER**
> "There's a quiet hallway behind the Elite chamber. One chair at the end of it. There's only ever one chair."
> "Whatever happens in that room is the end of this part of the road. The numbered part."
> "Six on the belt. Walk in."

*"The numbered part"* quietly plants the post-game (the unnumbered road, the loop) without spoiling
it — a seed the Mystery intro (§4.1) and reveal then collect.

---

## 6. The casting map — fixing Offender A structurally

### 6.1 Beat → voice assignment

Reserve Oak for **bookends and his one confession**; give the middle of the road other voices:

- **Oak keeps:** intro (1), Badge 1 (2, optional), Halfway (4), the twist (5), pre-Plateau (6),
  post-HoF epilogue (12). These are the mentor's natural punctuation — beginning, middle, the
  confession, the threshold, the return. Six beats, not nine.
- **World narrator (no speaker):** Champion's Hall (7), Hall of Fame card (10). Let the room speak.
- **New recurring Veteran:** the three mid-route benches (3). The whole point of a recurring face.
- **The First:** the climax intro (8) and everything past it.

Net effect: Oak goes from ~9 spine beats to ~6, the three "recurring stranger" beats finally have a
stranger, and `classic_twist` stops competing with six other Oak monologues for the same emotional
register.

### 6.2 The recurring Veteran — three beats that escalate

**Appearance 1 — `classic_npc_r20` (post-Gym-3): doesn't know you**
> A veteran's resting on the route bench, six worn balls on his belt, reading the road like he's walked it before.
> "Third badge. This is the stretch where most of 'em quit and don't notice they quit. You're still walking."
> "Eat something. Heal at the next town. Keep your first partner up front — people forget that one when the team gets crowded."

**Appearance 2 — `classic_npc_r33` (post-Gym-5, outside the casino): starting to place you**
> The same veteran, different bench, same six worn balls. He nods like he half-recognizes the road *and* you.
> "Five badges now. You came through here a couple gyms back — I remember the starter. It's bigger."
> "Don't let the slot floor in there teach you the wrong lesson about luck. The next gym's harder, not richer. Walk on."

**Appearance 3 — `classic_npc_r48` (gate to City 8): knows you**
> The veteran's already looking at you when you come up the road. No surprise left in it.
> "You again. Seven badges. I stopped betting against you somewhere around the fifth."
> "Last town before the Plateau. Take the long look back — six routes, the team you built, the calls you made. *That's* who walks into the eighth gym. Go on."

*Why it works:* identical sprite + "six worn balls" tell across all three; the relationship moves
stranger → familiar → kinship; the third beat delivers the same "look back at your journey" payload
the current Oak r48 does, but now it's *earned* by two prior meetings instead of asserted by a
mentor who's been everywhere.

---

## 7. Setup-beat copy — keep it scannable, give it the road's voice

**Principle:** the form must stay fast to scan and operate. So keep the numbered structure and the
functional labels, but (a) re-voice the *headers* and *prompts*, and (b) add a one-line voiced
**sub** under each section that carries the tagline's register. Don't bury controls under prose.

**Anchor:** `#story-create-*` (HTML) / `_tcState` (state) / the `.story-tagline` it should echo

| Element | BEFORE | AFTER |
|---|---|---|
| `.story-tagline` | "A single-player road from Pallet Town to the Champion's seat — and whatever waits after the credits." | **keep — the anchor voice** |
| `.story-create-title` | "New Adventure" | "New Adventure" *(keep — clean)* |
| Section 1 header | "1 — Your trainer" | "1 — Who's walking out of Pallet?" |
| Name placeholder | "Enter your name" | "What do they call you?" |
| Sprite label | "Trainer look" | "Pick a face for the road" |
| Section 2 header | "2 — Difficulty" | "2 — How hard a road?" |
| Diff sub (Very Easy) | "Foes −30% · More gold" | "Foes −30% · gold to spare · a gentle road" |
| Diff sub (Normal) | "Recommended" | "The intended road · recommended" |
| Diff sub (Very Hard) | "Foes +30% · Bragging rights" | "Foes +30% · no margin · bragging rights" *(keep the joke, extend the pattern)* |
| Section 3 header | "3 — Pokémon generations" | "3 — Which Pokémon walk the road with you?" |
| Advanced summary | "Advanced — mechanics & item rules" | "Advanced — bend the rules *(mechanics & items)*" |
| Begin button | "▶ Begin Adventure" | "▶ Begin Adventure" *(keep — good)* |

**New: a single setup-beat narration card** between confirm and the first scene, so the journey
*opens* on voice instead of a battle screen. One overlay, world-narrator register, player name +
starter interpolated:

> The lab door closes behind you. {starterName} shifts on your shoulder, not sure about the light yet.
> Pallet Town is three houses and a road out. You take the road.
> *(— {trainerName}'s journey begins —)*

---

## 8. Barks — a narrow, engine-safe variance layer

**Hard constraints (non-negotiable):**

1. **Never vary state-information lines.** *"It's super effective!"*, *"It's not very effective…"*,
   *"{name} is paralyzed! It can't move!"*, *"{name} fainted!"* (as a state event) — these tell the
   player what *happened*. They stay canon and singular. Players read the log to track the fight;
   flavor that obscures state is a bug.
2. **Vary only terminal/emotional, non-load-bearing beats**, and only as an *additive* line after
   the canonical one — never a replacement. The flavor rides *alongside* the fact.
3. **Deterministic.** Use `storyRngNext` (per `CLAUDE.md`), never bare `Math.random()`, so replays
   are stable.
4. This is a **schema + copy proposal**, not an engine change — Stream 4 / the maintainer owns
   whether/how it wires in.

**Where flavor is safe to add (additive second line only):**

- **The player's *last* Pokémon faints** (the run-defining moment, currently silent flavor-wise):
  pool of 3–4, e.g. *"The crowd goes quiet."* / *"That's the team. The road stops here unless you've
  got a comeback in you."*
- **A foe's last Pokémon faints (you win):** *"The fight's yours."* / *"Their corner goes still."*
- **You flee** (`runAway`, currently *"You fled!"*): *"You fled! The road will remember the
  shortcut."* / *"You fled! Not every fight is yours to take today."*
- **A crit that secures a KO:** *"A critical hit — and that's the one."*

**Proposed `barkPool` schema (aligns with §9):**
```jsonc
// data/dialogue/barks.json  (proposed — Stream 4 owns externalization)
{
  "playerLastFaint": ["The crowd goes quiet.", "..."],   // additive, after the canonical faint line
  "foeLastFaint":    ["The fight's yours.", "..."],
  "fledRoad":        ["The road will remember the shortcut.", "..."]
}
```
Rule encoded in the schema doc: a `barkPool` key may only attach to a **non-state** event, and its
line is appended, not substituted. *"But it failed!"* and the move/status/effectiveness lines are
explicitly **out of the bark layer** — they're engine voice and stay singular.

---

## 9. The data-driven dialogue schema (Stream 4 coordination)

### 9.1 Don't invent a schema — extend the one that already won

`STORY_SCENES` already has a clean, documented, test-locked schema
(`STORY_NARRATION_SYSTEM.md`, 27 integration tests). It is the spine; **do not fork it.** Its
shape, for reference:

```jsonc
"scene.key": {
  "title": "Steady chapter nameplate",
  "body":  "Legacy flat fallback (keep for back-compat)",
  "acts": [
    { "phase": "intro|development|climax|outro",
      "lines": ["one idea per line", "..."],
      // a later act can react to an earlier pick:
      "branches": [ { "when": { "key": "persistKey", "eq": "value" }, "lines": ["..."] },
                    { "lines": ["...default (when-less, last)..."] } ],
      // at most ONE choice per scene; never forks which beat fires next:
      "choice": { "persistKey": "ns.scene.key",
                  "options": [ { "label": "Plain-language action.", "value": "v", "reply": ["..."] } ] }
    }
  ],
  "outro": { "win": ["post-fight aftermath", "..."] }   // battle scenes only
}
```

### 9.2 Coordination asks for Stream 4 (data layer)

The remaining dialogue lives in **two inconsistent forms**: externalized JSON
(`data/dialogue/*.json`, extracted by `scripts/build/extract-dialogue-pools.mjs`) and in-code
consts (`STORY_COLD_OPENS`, `STORY_TUTORIAL_SCENES`, `_STORY_INTRO_SCENES`, `CITY_ARRIVAL_LINES`,
`MYSTERY_FIGURE_IDENTITIES`, rival pools). `STORY_NARRATION_SYSTEM.md` §6.2 *already* wants to fold
the in-code overlays onto the unified renderer. Stream 2 asks Stream 4 to own these four schema
moves, in priority order:

1. **Add a `speaker` block to the scene/overlay schema** — the single change that operationalizes
   §3.3's voice differentiation as data, not casting-by-`sprite:'Oak'`:
   ```jsonc
   "speaker": { "id": "the_first", "sprite": "Red", "nameplate": "The figure in the doorway",
                "voice": "dread" }   // voice = the register key from §3.3's table
   ```
   This makes the Oak-monotony fix (§6) a *data* edit (reassign `speaker.id`) instead of a code edit.
2. **Externalize the in-code pools** to `data/dialogue/` following the existing extract pattern, so
   copy review (this stream's recurring job) is a JSON diff, not a monolith diff. Targets:
   `cold-opens.json`, `tutorial-scenes.json`, `intro-scenes.json`, `city-arrival.json`,
   `mystery-figure.json`, `rival-pools.json`.
3. **Add the `barkPool` schema** from §8, with the "non-state, additive-only" rule encoded as a
   load-time validation (a bark key attached to a state event should fail the smoke test in
   `tests/smoke-dialogue-load.mjs`).
4. **Keep the choice contract byte-identical** — `persistKey` / `value` / `reply` / `branches.when`
   must not change shape; §11's choice taxonomy depends on it.

**Boundary:** Stream 2 owns the *words* and the *voice rules*; Stream 4 owns the *container and the
load path*. This doc supplies copy ready to drop into whatever container Stream 4 lands.

---

## 10. The 4 choice types in action

The engine already supports exactly one choice per scene that **persists** (`sm.storyChoices`) and
**never forks the path** (`STORY_NARRATION_SYSTEM.md`: *"never forks which beat/battle fires
next"*). That single, honest mechanic is enough to express four distinct *kinds* of choice — and
the game already ships real examples of each. The job of this stream is to name them, so future
copy is deliberate about which kind it's writing.

### Type 1 — FLAVOR (pure characterization; recorded, never read back)

The pick says something about **who the player is**; the world doesn't change and the scene doesn't
pretend it will. Used for moral/character grace notes.

**Real example — `STORY_SCENES['villain.skull.event1']`** (`persistKey: villain.skull.kids`)
> ▸ "Lose on purpose. Let them have a win." → *…you keep your shoes. They keep a story they'll tell for years.*
> ▸ "Win, but tell the crying one something true." → *He stops crying out of sheer confusion.*

Either way you keep your shoes and the kids are okay — nothing downstream branches. The choice is a
mirror, not a lever. **Write FLAVOR when the point is the player's character, not the world's
reaction.**

### Type 2 — CONSEQUENCE (persisted *and* read back by a later beat)

The pick is remembered and a **later scene visibly reacts** via `branches.when`. This is the only
type that touches anything beyond its own reply.

**Real example — `STORY_SCENES['villain.rocket.event2']`** (`persistKey: villain.rocket.driver`),
paid off later in `villain.rocket.event4` and the arc ending:
> ▸ "Lean on him." → value `leaned`
> ▸ "Let him drive." → value `freed`
> …a later act: `{ "when": { "key": "villain.rocket.driver", "eq": "freed" }, "lines": [ … ] }`

The world remembers. **Write CONSEQUENCE sparingly and always pay it off** — an unread `persistKey`
is a promise the game doesn't keep (and silently demotes the choice to FLAVOR). If you set a
`persistKey`, grep for a matching `when` before you call it consequence.

### Type 3 — ILLUSION (feels pivotal; converges on purpose; the convergence is the point)

Both options reach the same outcome, and the **reply text says so honestly** — the meaning is in
*what the convergence reveals*, not in a branch. This is the hardest type to write well and the
game already nails it.

**Real example — `STORY_SCENES['villain.flare.event1']`** (`persistKey: villain.flare.sticker`)
> ▸ "Peel it off. Hand it back." → *He takes it back… and presses it onto a passing stranger
> instead, who lights up at being chosen. The sticker was never the point.*
> ▸ "Leave it on. Move freely." → *The sticker works. That's the obscene part — it actually works.*

Whichever you pick, the sticker finds a wearer and the system rolls on. The illusion is *load-
bearing theme* (the sorting was never about your answer). **Write ILLUSION when the theme is
"your choice mattered less than you thought" — and let the reply admit it.** Never write an illusion
that *pretends* to branch and hopes the player won't notice; the honesty is the craft.

### Type 4 — NO BLIND (the rule, not a type: never present a choice the player can't read)

The standing constraint every choice obeys. A choice is **blind** when the player can't tell what
they're picking or can't see what it did — and the game must never do that. Four sub-rules:

1. **Labels state the action in plain language.** Ship: *"Peel it off. Hand it back."* /
   *"Leave it on. Move freely."* Never: *"Option A"* / *"Door B"* / *"???"*.
2. **The consequence is immediate and visible** — the `reply` shows what happened *now*, on the
   same screen. No choice defers its meaning to an invisible state change.
3. **No choice silently gates progression, rewards, or content.** The schema guarantees this
   (choices "never fork which beat/battle fires next"); copy must not *imply* it does either ("choose
   wisely — this is permanent") when it isn't.
4. **No hidden-information or timed choices.** The player reads, then decides. No countdown, no
   "you'll find out later if this was right."

**The capstone choice — `STORY_SCENES['main.ending']`** (`main.loop.remember`, *"Try not to
remember"* vs *"Remember. Carry it forward."*) is the model: two plain-language options, both
replies land immediately, neither gates anything, and it's the one moment the deterministic loop
hands authorship to the player. It's FLAVOR by type and NO-BLIND by construction — exactly right
for a final beat.

---

## 11. Borderline lines — needs your sign-off

| # | Line / system | Anchor | The tension | Options |
|---|---|---|---|---|
| 1 | Rival name "{Player} Sucks" | `_storyRivalTauntName` | Faithful RBY gag vs. collides with sincere cold-open prose | (a) keep gag, but render rival as "your rival" in *narration*, taunt-name only on battle HUD (§5.1); (b) drop the gag; (c) make it an opt-in toggle in setup |
| 2 | How edgy is "edgier"? | `STORY_SCENES` villain/extra arcs | Skull kid crying, the loop's despair — where's the ceiling? | Confirm the shipped villain/extra arcs ARE the ceiling and new copy may match but not exceed; or set a tighter bar |
| 3 | "The numbered part" seed (§5.2) | proposed `classic_champion` edit | Plants post-game existence pre-Champion | Approve the seed, or keep the Champion beat spoiler-free |
| 4 | Orphaned first-sighting lore | `_shouldFireFirstSightingLore` | Never fires post-tone-cut (tier gate) | Route to Stream 1 / spec-drift — not a copy fix |

---

## 12. Sign-off checklist (what "done" means for this stream)

- [ ] **Voice guide (§3) approved** — the three-word definition + the per-speaker register table.
- [ ] **Casting map (§6) approved** — Oak from ~9 spine beats → ~6; new recurring Veteran for the
      three mid-route benches; The First owns the climax.
- [ ] **Rewrites (§4, §5) approved line-by-line** — especially the Mystery intro (§4.1), since it
      changes what the climax *withholds*.
- [ ] **Setup copy (§7) approved** — confirm the form stays scannable with the voiced subs.
- [ ] **Bark layer (§8) scoped** — confirm the "non-state, additive-only" boundary before Stream 4
      wires anything.
- [ ] **Schema asks (§9.2) handed to Stream 4** — `speaker` block first; it turns §6 into a data edit.
- [ ] **Borderline lines (§11) ruled on** — the rival-name gag especially.

> Reminder: this is a **design pass**. Nothing here is in `battle.html`. On sign-off, the copy
> changes are JSON/const edits + (optionally) the §9 schema work — each of which is a separate,
> reviewable change with its own approval, per `CLAUDE.md`'s "no game-behavior change without
> sign-off" rule. Tone and copy are the maintainer's to approve; this stream surfaces and proposes.
