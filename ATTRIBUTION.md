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
| Additional battle forms — normal and shiny, front and back | [Smogon X/Y Sprite Project](https://www.smogon.com/forums/threads/x-y-sprite-project.3486712/) · [Smogon Sun/Moon Sprite Project](https://www.smogon.com/forums/threads/sun-moon-sprite-project.3577711/) · [Smogon Sprite Project, Gen 8 onward](https://www.smogon.com/forums/threads/smogon-sprite-project.3647722/) | Community artwork permitted for noncommercial reuse with project or artist credit | These community-drawn sprites use the [Showdown BW-style sprite collection](https://play.pokemonshowdown.com/sprites/gen5/). The original pixels and transparency are stored locally in single-frame GIFs for the full and compact offline packs. |
| Trainer sprites (`sprites/trainers`) | Pokémon Showdown trainer sprites | "licensing being determined" (Smogon) | Fan/community resource. |
| Item icons (`sprites/items`) | Pokémon Showdown itemicons + [PokeAPI/sprites](https://github.com/PokeAPI/sprites) `sprites/items` | © TPC (fan-ripped) | Vendored via `scripts/download-item-icons.mjs`. |
| Item / ball icons (`sprites/pokesprite`) | [msikma/pokesprite](https://github.com/msikma/pokesprite) | **MIT** (code/data); sprite pixels © TPC | See `sprites/pokesprite/UPSTREAM_LICENSE.md`. |
| Battle backgrounds (`sprites/backgrounds/battle/*/*.webp`) | Generated for this project with ImageGen | Original project artwork | Wide compositions and dedicated portrait crops of the night arena, terrain variations, forest road, and raid ruins. See [battle background art direction](sprites/backgrounds/battle/GEMINI_PROMPTS.md). |
| Menu backgrounds (`sprites/backgrounds/menu`) | Generated for this project (AI image generation) | Project-owned | Menu location and mood variations. |
| Story scene backgrounds — original (`sprites/story/backgrounds/*.svg`) | Authored for this project | Project-owned | Hand-authored pixel/SVG scenes (lab, Crucible, Frontier, cities). |
| Illustrated chapter backdrops (`sprites/backgrounds/story/*.webp`) | Generated for this project with ImageGen | Original project artwork | Pallet Harbor, Route 1, Mineshaft Pass, Cathedral Approach, Victory Road, and the Open Circle academy, ranger station, dock, yard, highlands, League, and Crucible scenes. |
| Flintreach noticeboard and Field Archive props (`sprites/backgrounds/story/road1-board-*.webp`, `archive-*.webp`) | Original ImageGen prop atlas for this project | Project artwork | Three states of the warning lamp board, survey rubbing, highland lamp and two archived dispatches. Exported as six 192 × 96 WebPs. |
| Story scene backgrounds — gen3 (`sprites/story/backgrounds/gen3-*.png`) | [pret/pokefirered](https://github.com/pret/pokefirered) `graphics/map_preview/*` | **No asset grant — ripped GameFreak graphics** | Assembled from gen3 tile-atlas + tilemap by `scripts/build-story-backgrounds.mjs`. Reference/placeholder footing (same as the Showdown sprites). |
| Story UI icons (`icons/story`) | Authored for this project | Project-owned | |
| Battle category marks and type labels (`battle.html`) | Authored inline for this project | Project-owned | Physical, Special, Status, and the combined Hybrid indicator use local shapes and text. |
| UI font (`fonts/press-start-2p.woff2`) | [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (CodeMan38) | **SIL Open Font License 1.1** | See `fonts/OFL.txt`. |

## Audio assets

| Asset set (in-repo path) | Upstream source | License | Notes |
|---|---|---|---|
| Pokémon cries (`music/cries`) | Showdown / PokémonDB lineage | © TPC (fan-ripped) | Community-standard; not openly licensed. |
| Move SFX (`music/battle_anims`, `music/moves`) | Showdown move SFX | © TPC (fan-ripped) | |
| UI SFX (`music/ui_sfx`) | Project / mixed | see per-file where applicable | |
| Background & theme music (`music/background`, `music/themes/Theme*.mp3`) | Project-supplied | Project-managed | `background1–3` = full field mixes. `short1–3` = two-minute excerpts encoded at 80 kbps. `Theme1–4` = character-creation themes. |
| Story motifs (`music/story/first-partner.mp3`, `field-relay.mp3`, `the-portrait.mp3`) | Original score synthesized for North Road | Project-owned | Four-note theme in three arrangements, rendered to 32 kHz MP3. Combined encoded size is 55,428 bytes. |
| Synthetic story dialogue (`music/voices`) | Original English lines generated locally with Flite 2.2, [CMU US Kal](https://github.com/festvox/flite/blob/v2.2/lang/cmu_us_kal/cmu_us_kal.c) | Flite's [Carnegie Mellon license](https://github.com/festvox/flite/blob/v2.2/COPYING) | Deliberately synthetic terminal and announcer roles. Band-limited and loudness-normalized. Thirteen 48 kbps mono MP3 clips total 257,516 bytes. Exact captions and roles are in `data/story/dialogue-lines.js`. |
| Battle boss theme (`music/themes/boss_climax.mp3`) | "A Night of Dizzy Spells" — **Eric Skiff** (*Resistor Anthems*), via [Tuxemon](https://github.com/Tuxemon/Tuxemon) | **CC-BY 3.0** | Used for major story battles (gym leaders, rival, Elite Four / Victory Road, Champion, Mystery Figure); ordinary route/gym trainers keep the field BGM. Attribution required — keep this credit. |
| Victory fanfare (`music/themes/victory.mp3`) | OpenGameArt "JRPG" collection (Yubatake / "yd"), via [Tuxemon](https://github.com/Tuxemon/Tuxemon) | **CC-BY 3.0** (verify per-track on OGA) | Played on a story battle win. Attribution required. |

## Data / tooling

| Dependency | License | Use |
|---|---|---|
| [@pkmn/dex](https://github.com/pkmn/ps) | MIT | Pokémon name → National Dex number mapping for sprite vendoring. |
| [Gen 9 Random Battle sets](https://data.pkmn.cc/randbats/gen9randombattle.json) | Pokémon Showdown data via pkmn.cc | Local fallback for species without a suitable competitive build, including offline play. Refresh with `node scripts/fetch-randbats.mjs 9`. |
| [PokeAPI/sprites](https://github.com/PokeAPI/sprites) | CC0 1.0 | Sprite source (compilation). |
| [anime.js](https://github.com/juliangarnier/anime) (`vendor/anime.min.js`) | MIT | Tween engine for per-move battle animations. |
| [tsParticles](https://github.com/tsparticles/tsparticles) slim bundle (`vendor/tsparticles.slim.min.js`) | MIT | Lazy-loaded ambient scene particles, particle weather, and celebration bursts (`window.FxParticles`). |
| [howler.js](https://github.com/goldfire/howler.js) (`vendor/howler.min.js`) | MIT | Vendored for a BGM crossfade layer; the `window.AudioBus` consumer was removed as dead code in 2026-07, so the lib is currently unused (retained for a future revival). |

---

*Underlying Pokémon imagery and audio remain the property of their respective
rights holders. This list is maintained on a best-effort basis as assets are
added; see the per-source `UPSTREAM_LICENSE.md` files where present.*
