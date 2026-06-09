# 07 — Enrichment Recommendations: Relating the Research to Our Stories

*Part of the story-research dossier — the core deliverable. This file maps the fan-favorite techniques
(`05`, sourced from `01`–`04`) onto our actual arcs (`06`), and names concrete polish opportunities
tagged to specific `sceneKey`s. **This is a recommendations/mapping document — no replacement prose is
written here, and no game code is touched in this pass** (per CLAUDE.md, story changes ship only with
explicit sign-off). Each item: the opportunity, the technique it borrows (`A1`…`D33` from `05`), and
the target scene.*

---

## How to read this

- **What works today is called out first** for each arc — the goal is to *polish*, not replace. Several
  of our arcs already execute beloved techniques better than canon does; those just need protecting.
- Each recommendation is a **direction**, sized small (one beat, one line, one branch), tagged with the
  toolkit technique and the exact `sceneKey`/persistKey.
- Items are marked **[core]** (the single highest-leverage polish for that arc), **[nice]** (secondary),
  or **[guard]** (something to protect from over-editing).

## The tone rubric (the +18 dial)

The user's directive: **no ceiling — dark, adult, +18, gore, explicit sexual or violent content are all
permitted, even encouraged where there's a chance to use them — *but the objective is to polish what's
there without damaging the narration, and to preserve the narrative structure and flow of the
inspirational sources.*** Operationalized:

1. **Explicitness must serve cost or character, never spectacle.** Spend graphic content on the *price*
   of an act (`05 C23` body-horror-as-cost), the way the manga spends petrification on heroism — not on
   gore for its own sake. The murdered-Marowak lesson (`02`): the *real* consequence out-hits the
   manufactured shock.
2. **Match register to layer, then push within it.**
   - **Main track** stays restrained literary — its power is the slow loop dread; explicitness here is
     almost always the *wrong* tool (`05 D30`).
   - **Villain pool** may go fully explicit on *human* cruelty (trafficking, abuse, violence, sexual
     coercion) where the arc's theme already points there — Rocket, Yell, Skull, Star, Plasma all have
     load-bearing adult cores that current scenes only imply.
   - **Extra pool (horror)** may go fully explicit on *body horror, death, the uncanny* — these arcs are
     built on canon Pokédex horror (`05 B8`); trust the entries all the way down.
3. **Preserve the source's *structure*, not just its shock.** When borrowing from a creepypasta or canon
   arc, copy the *mechanism* (e.g. Lost Silver's escalation ladder, Hypno's safe-container POV), not a
   set-piece. Damaging our pacing/voice to insert a famous scare is the failure mode to avoid.
4. **Our house voice survives the dial.** Second-person present, "horror in the normalization,"
   silence-as-content (`06 §6`). Explicit content is delivered *in that voice* — the calm, clinical
   register makes graphic material land harder than exclamation would.

---

## 1. The main loop arc — the highest-leverage target

Our `main.*` spine (the time-loop → Mystery Figure → "It Was You" reveal → remember/forget) is the most
*distinctive* thing we have and maps directly onto the best-studied meta-narrative craft (`03§6`, `05 D`).
It is also where a few precise moves pay off the most.

- **[core] Make one breadcrumb undeniable, and leave it unexplained until the reveal.** Right now the
  "Welcome Back" sticker (`main.event2`) and the unfamiliar handwriting are *suggestive*. Per the
  single-load-bearing-detail lever (`05 D25`, `[03§1]`), pick **one** breadcrumb and make it *impossible
  to rationalize* (a detail only a future self could have left), planted early, paid off in
  `main.mfReveal`. Don't explain it on first appearance — let it itch.
- **[core] Give the loop the 80/20 anchor + one-new-piece cadence** (`05 D29`). Decide the ~20% that is
  *identical* every run (a line, an object, the bench old man in `main.event1`) so repetition reads as
  intentional, and ensure each loop surfaces exactly one *new* fact. This is a design note for how
  `main.event1-9` should differ across `sm` run counts, not a single-scene edit.
- **[core] Let the Mystery Figure address the *player's* persistence, not just the character's**
  (`05 D27, B13`; DDLC/NieR/Ash-coma). `main.mfReveal` already says "you become me." The relocate-the-
  fourth-wall move is to have it reference *the act of replaying itself* — the save, the reset — so the
  reveal hits the player and the trainer at once. Stay diegetic (the figure "remembers across resets"),
  don't break into menu-speak.
- **[core] Make the ending choice a sacrifice-forward, with real cost** (`05 D31`; NieR Ending E). The
  `main.loop.remember` choice (forget / carry it forward) is thematically perfect; sharpen the *cost* —
  what the next traveler gains and what this self loses — so it reads as a gift to a stranger (your next
  self), not a flavor toggle.
- **[guard] Keep the reveal anchored in what we own** (`05 D33`; the Fuji/Amber retcon cautionary tale).
  The loop's proof should live in *our* systems (the sticker, the Pokédex handwriting, the rival journal),
  never in borrowed lore that could feel imported.
- **[nice] Diegetic-UI dread for the loop** (`05 B10`). The Pokédex "handwriting you didn't recognize"
  is already a save-as-narrative gesture; the rival journal (`06 §5`) and `sm.storyChoices` carried
  across runs could surface one "you did this last time" artifact.

---

## 2. Villain pool (10 arcs)

Each arc maps 1:1 to a canon team; we inherit both the canon's strengths and the fan critiques of it
(`04`). Our writing already fixes several canon failures (notably: our leaders all *have* interiority,
which is exactly what fans begged for). Polish targets the gaps.

### rocket (Giovanni) — grounded crime `[04§1]`
- **Works:** Giovanni's *"I built this. I will not apologize."* (`villain.rocket.boss`) nails the
  legible-syndicate register fans praise; the scratched-name belt (`villain.rocket.event6`) already does
  environmental storytelling (`05` N's-room move).
- **[core]** Push the *human* commodity horror explicit (`05 C23`, tone-rubric §2 villain). The
  Slowpoke-tail and clipped-tail-Rattata beats (`villain.rocket.event1/2`) imply trafficking; the dial
  permits naming the cruelty plainly (mutilation for profit, children as couriers) — in our clinical
  voice. Spend it on cost.
- **[nice]** Pay off `villain.rocket.driver` (lean / free) later (`05 D32`) — a returning consequence
  (the named drop-point raided, or the three Rattata seen again) in `event6`/`ending`.

### magma (Maxie) — eco-fundamentalism `[04§2]`
- **Works:** Maxie's *"I did the arithmetic of mercy… I never once did it on the people"* (`...boss`) is
  the interiority ORAS had to retrofit — we already have it `[guard]`.
- **[core]** Lean the **tragic-mirror** in (`05 A4`): the praying-to-a-Groudon-that-isn't-there beat
  (`villain.magma.event6`) is strong; add a figure who already paid for this faith (a drought widow, a
  burned settler) so the zealotry has a victim on screen, not just a doctrine.

### aqua (Archie) — romantic surrender `[04§2]`
- **Works:** *"I just opened the door"* (`event6`) + the hand-holding post-defeat (`boss`) is a genuinely
  novel villain beat — better than canon Archie `[guard]`.
- **[nice]** Tone-match the stakes (`05 A5`): one beat showing the flood's *human* cost (a drowned
  lower town) so the romance of surrender carries weight, not just melancholy.

### galactic (Cyrus) — cold nihilism `[04§3]`
- **Works:** *"Why are you smiling at me?"* (`boss`) is the anti-ham cold villain executed perfectly,
  and the self-refuting thesis is intact `[guard — protect from over-explaining]`.
- **[core]** Bring in **emotion-deletion-as-the-deepest-fear** (`05 C21`, the Shadow-Pokémon mirror):
  one beat where the *erasure* is shown done to a victim (a recruit gone flat, a Pokémon with a closed
  heart) so Cyrus's chosen numbness has an inflicted twin — the franchise's deepest horror, doubled.

### plasma (Ghetsis / N) — liberation-as-con `[04§4]`
- **Works:** The sage talking a child into abandoning its ball (`villain.plasma.event1`) and the
  heal-them-too-slowly menace (`...boss`, Ghetsis) are excellent.
- **[core]** This is our best home for the **full dual-villain reveal** (`05 A1`; the most-praised
  structure in the franchise). If the arc currently centers Ghetsis, seed a *sincere figurehead* (an
  N-analogue the player comes to care about) across `event1-5` whose belief is real, so the
  Ghetsis-mask-drop in `boss` recontextualizes the arc retroactively. Pay off `villain.plasma.n`
  (uncage / keep-in-ball) at the reveal (`05 D32`).
- **[guard]** Keep N partly *right* (`05 A2`) — the abused Pokémon prove his point; rebut by the player's
  bond, not a speech.

### flare (Lysandre) — aestheticized genocide `[04§5]`
- **Works:** The sorting-sticker caste beat (`villain.flare.event1`, with the peel/keep choice) is sharp.
- **[core] This arc inherits canon's *worst* problem — fix it deliberately** (`05 A5`): Flare fails when
  genocidal stakes meet joke grunts and a pitying cast. Ensure our grunts and our cast *treat the
  beauty-purge as the atrocity it is* — tone matching stakes. The dial permits explicit eugenicist
  cruelty (who gets sorted out, and what happens to them).
- **[nice]** Add the **tragic mirror** (`05 A4`, AZ): a long-lived figure who already fired this weapon
  once and grieves it, ignored by Lysandre.

### skull (Guzma) — broken kids `[04§6]`
- **Works:** The kids-demanding-your-shoes beat with the crying grunt (`villain.skull.event1`, throw/win
  choice) is the comedy-front/pathos combo fans love `[guard]`.
- **[core]** Add the **horror-core behind the comedy front** (`05 A7`; the Skull→Aether lesson): keep
  Guzma sympathetic, but seed a genuinely dangerous adult exploiting these kids (an Aether/Lusamine-shaped
  figure) so the arc has menace, not just heart. The dial permits the abuse to be explicit.

### yell ("The Brother" / Piers) — fandom as control `[04§7]`
- **Works:** *"I let them pay for it. I told myself it was for her"* (`villain.yell.boss`) already gives
  Yell the threat and interiority canon's filler Team Yell never had `[guard]`.
- **[core]** Lean explicit on the **control/coercion** theme (tone-rubric §2): the same crowd that
  shouts a girl down then buys tickets (`event...`) can be pushed into genuinely menacing parasocial
  ownership — stalking, the economy of exploitation around a performer. Pay off `villain.yell.proof`
  (leak / give-to-Marnie).

### macroCosmos (Rose) — PR over apology `[04§7]`
- **Works:** The apology-that-never-becomes-an-apology (`...boss`) is a smart read on Rose.
- **[core] Fix canon's signature failure — seed the real villain throughout** (`05 A5`; Rose was crammed
  into 15 minutes). Make Macro Cosmos *present* across `event1-6` (the brand everywhere, the drone in
  `villain.macroCosmos.event2` smash/ignore choice) so the climax isn't bolted on. This is a pacing/
  spread note across the arc's beats.

### star (Cassiopeia / Penny) — abused kids, found family `[04§8]`
- **Works:** The slid-over notebook (*"I hope you're better at being an adult than the last forty were"*,
  `...boss`) is the anti-bullying core done with heart `[guard]`.
- **[core]** Address canon's split-reception risk (`05 A7`; resonance-up/menace-down). Keep the heart,
  but give the bullying that *created* Team Star real teeth — the dial permits explicit depiction of the
  abuse and institutional neglect, so the found-family refuge is *earned against something*, not cozy.
  Pay off `villain.star.bullies` (confront / walk-past).

---

## 3. Extra pool (8 horror arcs)

These are already built on the strongest horror move in the toolkit — **real-Pokédex-lore-turned-literal**
(`05 B8`). The universal polish: *trust the entry all the way down* and apply one structural creepypasta
mechanism (`02`) per arc, in our restrained voice.

### cubone — grief / dead parent
- Already pure `05 B8` (the real-bone child mask). **[core]** Bring in **inherited grief made literal**
  (`05 C19`, the canon Marowak): the `extra.cubone.burial` choice (promise / decline to find one Cubone)
  can pay off with the orphaned child arriving as the mother passes (the canon Lavender beat). The dial
  permits the death explicit; spend it on the *weight*, not the wound.

### yamask — a soul carrying its old face
- Already `05 B8` (Black-dex: the mask "used to be its face when it was human"). **[core]** The mirror
  beat (`extra.yamask.mirror`, look / look-away) is the perfect home for the **second-person victim**
  (`05 B13`): the face that isn't yours can address *you*. The dial permits explicit body/identity horror.

### hypno — abducted children
- Built on the real FireRed entry (`02`). **[core]** Borrow Hypno's Lullaby's **safe-container POV**
  (`05 B14`): a sing-song line written from the abductor's first person, addressed to a child — the
  cozy form is the camouflage. The dial permits the grooming/consumption subtext explicit; keep it in
  the lullaby's calm meter.

### phantump — children lost in the woods
- Canon: spirits of dead lost children that lure *more* people to die (`02`). **[core]** Use the
  **self-replicating tragedy** structure (`05 B8/B15`): the assembly-song choice (`extra.phantump.song`)
  can reveal that answering the song is how the next child is taken — an unwinnable-by-kindness beat.

### mimikyu — unbearable loneliness
- Canon: dies if you look under the rag; dresses as Pikachu to be loved. **[core]** The "it wants to be
  seen" choice (`extra.mimikyu.seen`, meet-eyes / look-away) is the emotional inverse of horror — lean
  **love-as-relinquishment / the cost of being seen** (`05 C20`). Explicit isn't the tool here; *tenderness
  that costs* is (looking kills it; not looking abandons it).

### drifloon — child-snatching
- The single most literal `05 B8` (Sinnoh dex: "tugs the hands of children to steal them away";
  bursting spills a screaming soul). **[core]** The crossing choice (`extra.drifloon.crossing`,
  intervene / trust) is the home for **the unwinnable encounter** (`05 B15`) — the dial permits the
  abduction and the screaming-soul burst explicit.

### parasect — a puppeted corpse
- Canon body-horror (`05 B8`): the fungus drained and now controls the dead host. **[core]** The
  steering-driver beat (`extra.parasect.trainer`, stay / leave) is the home for **familiar-made-wrong +
  the question you can't unask** — the dial permits explicit Cordyceps body-horror (who is actually
  driving the trainer?).

### mewtwo — Project-0001 / Dr. Fuji / Amber
- Built on the Cinnabar journals + the (now de-canonized) Amber arc (`01§5`, `03§3`). **[core]** Use
  **found-document / epistolary horror** (`05 B10`, the Mansion diary): the lab patch, the bunk, the
  Mew drawing (`extra.mewtwo.event4`, take / leave) should let the player *reconstruct* the dead-daughter
  experiment from artifacts, not narration. **[guard]** Anchor it in *our* artifacts (`05 D33`) since the
  Amber lore itself was retconned in canon — own the reveal. The dial permits explicit experimentation/
  vivisection horror.

---

## 4. Choices — payoff within the existing contract

Our 19 choices are **narrative-only and never fork the path** — a deliberate, test-locked contract
(`06 §4`). The enrichment headroom is entirely in **reading them back more** (`05 D32`), which the
contract already permits via `when`/`branches`:

- **[core] Pay off recorded-but-never-read choices.** Several `persistKey`s are stamped and never
  referenced again (`06 §4`). Add later `branches` that acknowledge the earlier pick — e.g.
  `villain.rocket.driver` resurfacing in `villain.rocket.event6`/`ending`; `villain.plasma.n` at the
  Ghetsis reveal; `extra.cubone.burial` at that arc's `ending`. Cheapest, safest, highest-fidelity polish.
- **[guard] Do not add mechanical consequences or path forks** — that breaks
  `tests/suites/story-choice-contract.test.js`. Keep ≤1 choice/scene, unique persistKey, narrative-only.
- **[nice] The loop is the exception worth its weight:** `main.loop.remember` *should* be the one choice
  whose echo is felt most across runs (`05 D28/D31`) — read it back in subsequent loops' framing.

---

## 5. Ambient / pooled dialogue

- **[core] Thin pools repeat too fast** (`06 §5`): barks (~12) and city-guide (36) recycle within a
  single run. Expand both — barks especially are a low-risk home for **familiar-made-wrong** and the
  **death/faint vocabulary swap** (`05 B9/B11`) used *sparingly* (once per run, not as wallpaper).
- **[core] Determinism bug to flag** (not a story change, a correctness note): `_pickCityQuoteLine`
  (`06 §5`) uses bare `Math.random`, breaking seeded-replay parity. Routing it through `storyRngNext`
  is a clean, behavior-preserving fix — but per CLAUDE.md it's an RNG-semantics touch and needs sign-off.
- **[nice] Voice-consistency** (`06 §6`): keep the four voice layers distinct (ambient world-weary /
  story haunted / trainer system-confident / victory gracious). When pushing explicit content into the
  pools, keep it in the *ambient* register — overheard, not announced.
- **[nice] Negative space in city-guide** (`05 D26`): a couple of ambient lines that are *too* calm about
  something wrong (an empty house, a missing kid no one mentions) seed loop/extra dread cheaply.

---

## 6. Suggested priority order (if/when a rewrite pass is approved)

1. **Main loop arc** (§1) — highest distinctiveness, best-studied craft, smallest scenes.
2. **plasma dual-villain** + **flare tone-match** + **macroCosmos seeding** (§2) — these fix the exact
   failures fans cite in canon and we're positioned to beat canon on.
3. **Extra-pool choice payoffs + one structural mechanism per arc** (§3, §4) — high horror return,
   contract-safe.
4. **Thin ambient pools + the city-guide RNG flag** (§5) — low risk, broad coverage.
5. **Per-villain interiority/cost deepening** (rocket, skull, star, yell) — the explicit-where-earned work.

Every item above is a *proposal*. Nothing here is applied to `battle.html` or `STORY_SCENES`; a later
pass would take approved items, draft prose in our house voice, and respect the save schema, the choice
contract, and the classic-only story-tone lock.
