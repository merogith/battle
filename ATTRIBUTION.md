# Asset Attribution & Licensing

This is a **non-commercial fan project**. Pokémon and all related names, sprites,
audio, and imagery are **© Nintendo / The Pokémon Company / Creatures Inc. /
GAME FREAK Inc.** This project is not affiliated with or endorsed by any of them.

The "licenses" noted below cover each upstream project's **compilation, code, and
data** (and, for community-drawn art, the original artwork) — they do **not** clear
the underlying Pokémon intellectual property. Assets are used here on the
community-standard footing for fan games. Do not reuse any of this in a commercial
product.

If you are a rights holder and want something removed, please open an issue.

---

## Visual assets

| Asset set (in-repo path) | Upstream source | License of wrapper | Notes |
|---|---|---|---|
| Battle sprites — front/shiny (`sprites/gen5ani`, `sprites/gen5ani-shiny`) | Pokémon Showdown `ani` set, consumed via [PokeAPI/sprites](https://github.com/PokeAPI/sprites) | CC0 1.0 (compilation; art © TPC) | Community-made BW-style animations. |
| Battle sprites — back/back-shiny (`sprites/gen5ani-back`, `sprites/gen5ani-back-shiny`) | [PokeAPI/sprites](https://github.com/PokeAPI/sprites) `…/other/showdown/back[/shiny]/` | CC0 1.0 (compilation; art © TPC) | Vendored via `scripts/download-back-sprites.mjs`; dex-num resolved with `@pkmn/dex`. |
| Mega forme sprites — Legends: Z-A wave (the `*-mega*.gif` files added for the 2025 megas) | [PokeAPI/sprites](https://github.com/PokeAPI/sprites) — `…/other/showdown/` where an animated GIF exists, otherwise the 96×96 game sprite (`sprites/pokemon/…`) or the HOME render (`…/other/home/`) | CC0 1.0 (compilation; art © TPC) | Vendored via `scripts/download-za-mega-sprites.mjs`. Only nine of these formes have hand-animated BW-style GIFs upstream; the rest are static PNGs re-encoded to single-frame GIFs by `scripts/lib/png-gif.mjs` so they flow through the same manifest. |
| Trainer sprites (`sprites/trainers`) | Pokémon Showdown trainer sprites | "licensing being determined" (Smogon) | Fan/community resource. |
| Item icons (`sprites/items`) | Pokémon Showdown itemicons + [PokeAPI/sprites](https://github.com/PokeAPI/sprites) `sprites/items` | © TPC (fan-ripped) | Vendored via `scripts/download-item-icons.mjs`. |
| Item / ball icons (`sprites/pokesprite`) | [msikma/pokesprite](https://github.com/msikma/pokesprite) | **MIT** (code/data); sprite pixels © TPC | See `sprites/pokesprite/UPSTREAM_LICENSE.md`. |
| Battle & menu backgrounds (`sprites/backgrounds`) | Generated for this project (AI image generation) | Project-owned | Prompts in `sprites/backgrounds/battle/GEMINI_PROMPTS.md`. |
| Story scene backgrounds — original (`sprites/story/backgrounds/*.svg`) | Authored for this project | Project-owned | Hand-authored pixel/SVG scenes (lab, Crucible, Frontier, cities). |
| Story scene backgrounds — gen3 (`sprites/story/backgrounds/gen3-*.png`) | [pret/pokefirered](https://github.com/pret/pokefirered) `graphics/map_preview/*` | **No asset grant — ripped GameFreak graphics** | Assembled from gen3 tile-atlas + tilemap by `scripts/build-story-backgrounds.mjs`. Reference/placeholder footing (same as the Showdown sprites). |
| Story UI icons (`icons/story`) | Authored for this project | Project-owned | |
| UI font (`fonts/press-start-2p.woff2`) | [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (CodeMan38) | **SIL Open Font License 1.1** | See `fonts/OFL.txt`. |

## Audio assets

| Asset set (in-repo path) | Upstream source | License | Notes |
|---|---|---|---|
| Pokémon cries (`music/cries`) | Showdown / PokémonDB lineage | © TPC (fan-ripped) | Community-standard; not openly licensed. |
| Move SFX (`music/battle_anims`, `music/moves`) | Showdown move SFX | © TPC (fan-ripped) | |
| UI SFX (`music/ui_sfx`) | Project / mixed | see per-file where applicable | |
| Background & theme music (`music/background`, `music/themes/Theme*.mp3`) | Project-supplied | Project-managed | `background1–3` = field BGM; `Theme1–4` = character-creation ("new adventure") theme (random pick). Re-encoded to 128 kbps for size; see hygiene notes. |
| Battle boss theme (`music/themes/boss_climax.mp3`) | "A Night of Dizzy Spells" — **Eric Skiff** (*Resistor Anthems*), via [Tuxemon](https://github.com/Tuxemon/Tuxemon) | **CC-BY 3.0** | Used for major story battles (gym leaders, rival, Elite Four / Victory Road, Champion, Mystery Figure); ordinary route/gym trainers keep the field BGM. Attribution required — keep this credit. |
| Victory fanfare (`music/themes/victory.mp3`) | OpenGameArt "JRPG" collection (Yubatake / "yd"), via [Tuxemon](https://github.com/Tuxemon/Tuxemon) | **CC-BY 3.0** (verify per-track on OGA) | Played on a story battle win. Attribution required. |

## Data / tooling

| Dependency | License | Use |
|---|---|---|
| [@pkmn/dex](https://github.com/pkmn/ps) | MIT | Pokémon name → National Dex number mapping for sprite vendoring. |
| [PokeAPI/sprites](https://github.com/PokeAPI/sprites) | CC0 1.0 | Sprite source (compilation). |
| [anime.js](https://github.com/juliangarnier/anime) (`vendor/anime.min.js`) | MIT | Tween engine for per-move battle animations. |
| [tsParticles](https://github.com/tsparticles/tsparticles) slim bundle (`vendor/tsparticles.slim.min.js`) | MIT | Lazy-loaded ambient scene particles, particle weather, and celebration bursts (`window.FxParticles`). |
| [howler.js](https://github.com/goldfire/howler.js) (`vendor/howler.min.js`) | MIT | Vendored for a BGM crossfade layer; the `window.AudioBus` consumer was removed as dead code in 2026-07, so the lib is currently unused (retained for a future revival). |

---

*Underlying Pokémon imagery and audio remain the property of their respective
rights holders. This list is maintained on a best-effort basis as assets are
added; see the per-source `UPSTREAM_LICENSE.md` files where present.*
