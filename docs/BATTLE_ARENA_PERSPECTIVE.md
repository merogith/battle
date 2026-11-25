# Battle arena perspective

The battle screen uses a dedicated field, two grounded sprites, and an independent command dock. The near fighter sits to the lower left under warm light. The far fighter sits to the upper right under cooler light. The backdrop keeps the center and floor quiet so the sprites, status indicators, and move effects are legible.

## Stage layout

In the main game, the wide **arena** template places HP cards at opposite edges of the field. The portrait **stack** template puts the cards above and below the art. The field owns the background crop, floor shadows, weather, and move-effect canvas. The command dock keeps its height when opening the move picker.

Set the positions on the fighter containers in `battle.html`. The container units inside those rules measure the field itself.

| Layout | Player center and ground offset | Foe center and ground offset |
| --- | --- | --- |
| Arena | 38% across, 7% above the bottom | 64% across, 27% above the bottom |
| Short landscape | 38% across, 7% above the bottom | 59% across, 27% above the bottom |
| Stack | 30% across, 8% above the bottom | 73% across, 25% above the bottom |

The Competitive Arena uses the same neutral artwork and perspective in `competitive/arena.css`. Its controls and match log reflow independently when the view is too short to keep them underneath the field.

## Backdrop selection

The seven scenes live in `sprites/backgrounds/battle/{landscape,portrait}`. Neutral is the default. Story road trainers and rivals use a forest clearing. Raids and signature bosses use a ruined chamber. Gym Leaders and League opponents add a restrained type tint. An active terrain takes precedence when terrain backgrounds are enabled. When it expires, the encounter returns to its venue.

The floor sits close to the visual center of the source images so that even short landscape crops show enough ground. New scenes should keep their strongest lighting and highest detail near the edges and retain ample contrast behind both sprite anchors.

## References

- Pokémon Emerald's diagonal battler composition and compact HP cards. [Game Boy Advance screenshot](https://www.mobygames.com/game/17653/pokemon-emerald-version/screenshots/gameboy-advance/109703/)
- Pokémon Champions' hierarchy for HP and commands. [Official gameplay page](https://champions.pokemon.com/en-au/gameplay/)
- Octopath Traveler II's dark stage lighting and silhouette readability. [Square Enix screenshots](https://press.uk.square-enix.com/Octopath-Traveller-II/Focus/Octopath-Traveller-II-screenshots)
- Riot's guidance on preserving effect hierarchy through value and contrast. [Visual effects guide](https://www.riotgames.com/en/artedu/visual-effects)

Run `node tests/visual/battle-responsive.mjs` against the local server to verify the stage and controls across orientations, including simulated safe areas.
