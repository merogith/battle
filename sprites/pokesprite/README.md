# PokéSprite assets (vendored)

Subset of [msikma/pokesprite](https://github.com/msikma/pokesprite) PNG icons
used by the story-mode catch / Safari / shop UIs.

**License:** MIT (see `UPSTREAM_LICENSE.md` in this folder for the full
upstream notice).

**Why vendored:** the Safari / wild-catch screens previously rendered ball
options as text + colored border. PokéSprite's 32×32 PNGs match the gen-5
sprite aesthetic the rest of the game uses, and vendoring keeps the
build offline-safe.

## Files

| Path | Source | Use |
|---|---|---|
| `balls/poke.png`        | `items/ball/poke.png`            | Catch screen — Poké Ball |
| `balls/great.png`       | `items/ball/great.png`           | Catch screen — Great Ball |
| `balls/ultra.png`       | `items/ball/ultra.png`           | Catch screen — Ultra Ball |
| `balls/master.png`      | `items/ball/master.png`          | Catch screen — Master Ball |
| `balls/safari.png`      | `items/ball/safari.png`          | Catch screen — Safari Zone |
| `items/oran-berry.png`  | `items/berry/oran.png`           | Safari — Bait action |
| `items/hard-stone.png`  | `items/hold-item/hard-stone.png` | Safari — Throw Rock action |
| `items/rare-candy.png`  | `items/medicine/rare-candy.png`  | Bag / Evo Lab / City tip |
| `items/protein.png`     | `items/medicine/protein.png`     | Bag / EV Trainer / City tip |

## Updating

Re-pull from upstream `master`:

```sh
for ball in poke great ultra master safari; do
  curl -s -o "sprites/pokesprite/balls/${ball}.png" \
    "https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/${ball}.png"
done
curl -s -o "sprites/pokesprite/items/oran-berry.png" \
  "https://raw.githubusercontent.com/msikma/pokesprite/master/items/berry/oran.png"
curl -s -o "sprites/pokesprite/items/hard-stone.png" \
  "https://raw.githubusercontent.com/msikma/pokesprite/master/items/hold-item/hard-stone.png"
curl -s -o "sprites/pokesprite/items/rare-candy.png" \
  "https://raw.githubusercontent.com/msikma/pokesprite/master/items/medicine/rare-candy.png"
curl -s -o "sprites/pokesprite/items/protein.png" \
  "https://raw.githubusercontent.com/msikma/pokesprite/master/items/medicine/protein.png"
```

Refresh `UPSTREAM_LICENSE.md` from
`https://raw.githubusercontent.com/msikma/pokesprite/master/license.md`
whenever the upstream notice changes.
