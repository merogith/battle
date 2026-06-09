# Story Research Dossier — Index

A research-and-recommendations dossier on what makes Pokémon narrative work — across canon
(games/anime/manga), the fan-horror "creepypasta" canon, acclaimed fan fiction, and fan theories —
mapped onto this game's three-track story system so the writing can be enriched in matching spirit.

**This dossier is documentation only.** No game code, `STORY_SCENES`, dialogue JSON, or story flow was
changed to produce it. Per `CLAUDE.md`, story changes ship only with explicit maintainer sign-off; the
enrichment file (`07`) is a set of *proposals*, not edits.

## Reading order

| # | File | What it is |
|---|---|---|
| 01 | [`01-canon-narrative.md`](01-canon-narrative.md) | Why acclaimed **canon** arcs work — N/Ghetsis, AZ/Lysandre, Cyrus, Hisui, Lavender/Marowak, Mewtwo's origin, Shadow Pokémon, dark anime episodes, the Adventures manga. *(41 sources)* |
| 02 | [`02-creepypasta-horror.md`](02-creepypasta-horror.md) | The **fan-horror** canon and the horror *mechanic* behind each — Lavender Town Syndrome, Lost Silver, Pokémon Black, Strangled Red, Buried Alive, Hypno's Lullaby, MissingNo., canon-dread species. Real vs. myth labeled. *(43 sources)* |
| 03 | [`03-fan-fiction-theories.md`](03-fan-fiction-theories.md) | Acclaimed **fanfic** + top **fan theories** + meta/loop gold standards (Undertale, DDLC, OMORI, NieR, Stanley Parable). The key reference for our time-loop arc. *(39 sources)* |
| 04 | [`04-villain-reception.md`](04-villain-reception.md) | **Villain reception**, team by team — what fans praise/criticize, tagged to our 10 villain arcs; patterns separating beloved from weak villains. *(56 sources)* |
| 05 | [`05-technique-toolkit.md`](05-technique-toolkit.md) | The distilled, reusable **craft library** (33 techniques) drawn from 01–04, with where each pays off in our build. |
| 06 | [`06-game-narration-map.md`](06-game-narration-map.md) | The **"what we have today"** map — 3-track architecture, scene schema, full scene inventory by arc, the 19 choices, ambient pools, house-voice spec, sensitive-system guardrails. |
| 07 | [`07-enrichment-recommendations.md`](07-enrichment-recommendations.md) | **The core deliverable** — research ↔ game, per villain arc (×10) / extra arc (×8) / main loop, with the +18 tone rubric and concrete polish opportunities tagged to `sceneKey`s. |

**New to this?** Read `06` (what we have) → `05` (the techniques) → `07` (what to do). Use `01`–`04` as
the cited evidence base behind `05`/`07`.

## How to use this during a later rewrite pass

1. Open `07` and pick an arc. Each recommendation names a toolkit technique (`A1`…`D33`) and a target
   `sceneKey`.
2. Follow the technique back to `05` for the craft note, and to `01`–`04` for the cited exemplar.
3. Confirm the target scene's current text and constraints in `06` (and re-resolve symbols with the
   `anchor` skill — line numbers drift).
4. Draft prose in the house voice (`06 §6`), honoring the **tone rubric** (`07`, "the +18 dial"):
   no ceiling, but explicitness serves cost/character and preserves the source's structure.
5. **Respect the guardrails** (`06 §7`): the choice contract (≤1 choice/scene, never fork, no mechanical
   effect), the classic-only story-tone lock, and the save schema. Get sign-off before applying.

## At a glance — the through-lines

- **Our biggest asset is the main loop arc.** It maps onto the best-studied meta-narrative craft
  (`03§6`, `05 D`); a few precise moves (one undeniable breadcrumb, the 80/20 anchor, addressing the
  player's persistence, a sacrifice-forward ending) are the highest-leverage polish in the whole game.
- **We already beat canon on villain interiority.** Fans' top complaint about canon villains is
  flatness / late-seeded threats (Flare, Rose, Yell); our leaders all *have* inner lives. Polish targets
  *pacing, menace, and explicit human cost* — not new schemes (`04`, `07§2`).
- **The extra pool is built on the strongest horror move there is** — real Pokédex lore taken literally
  (`05 B8`). The universal polish is to trust each entry all the way down and add one structural
  creepypasta mechanism per arc (`07§3`).
- **Restraint and real consequence beat manufactured shock** (`01`, `02`) — even with no tone ceiling,
  the *earned* dark beat out-hits the loud one.

## Provenance

Compiled June 2026. Research via fan-out web search with adversarial verification; ~179 cited sources
across `01`–`04`, each labeling **canon** vs **fan theory** vs **debunked myth** (or **real/in-game**
vs **myth/fabricated** vs **canon lore**). Game-side map (`06`) from direct source exploration of
`battle.html` and `data/dialogue/`.
