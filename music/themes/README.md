# Battle themes — drop-in guide

Story trainer battles swap the continuous field BGM for a mood-appropriate
battle theme, then restore the field track (with a short victory fanfare on a
win) when the fight ends. Wild / casual battles are left on the field BGM.

`AudioSystem` selects a theme by encounter role. Ordinary trainers stay on the
field music. Rival battles, Gym Leaders, League fights, raids, and Story climaxes
each have their own theme.

## Slots

| Mood key  | Fires for                                             | Ships today          |
|-----------|-------------------------------------------------------|----------------------|
| `trainer` | Route / gym filler trainers                           | *(empty → field BGM)*|
| `leader`  | Gym Leaders                                            | `gym-bout.mp3`       |
| `rival`   | Rival battles                                          | `rival-pursuit.mp3`  |
| `elite`   | Elite Four / Victory Road                              | `league-chamber.mp3` |
| `raid`    | Story raids and their earlier confrontations          | `raid-omen.mp3`      |
| `boss`    | Champion / Mystery Figure / climax fights             | `boss_climax.mp3`    |

An empty list skips the swap entirely (no duck, no theme, no victory fanfare) —
that's why filler `trainer` fights keep the calm field rotation.

`victory.mp3` is the short win sting; the three `../background/background*.mp3`
files are the field rotation.

## Dropping in your own tracks

1. Put looping combat tracks (`.mp3`) in this folder, e.g. `leader.mp3`,
   `rival.mp3`, `champion.mp3`.
2. Register them at runtime — from the browser console, or a small script you
   load after the page. No edit to `battle.html` is needed:

   ```js
   // Append one file to a mood (stacks with what's already there):
   AudioSystem.addBattleTheme('leader', 'music/themes/leader.mp3');

   // Or replace whole mood lists at once:
   AudioSystem.setBattleThemes({
     trainer: ['music/themes/trainer.mp3'],
     leader:  ['music/themes/leader.mp3'],
     rival:   ['music/themes/rival.mp3'],
     elite:   ['music/themes/elite.mp3'],
     raid:    ['music/themes/raid.mp3'],
     boss:    ['music/themes/champion.mp3'],
   });
   ```

   Both mutate the live `BATTLE_THEMES` object in place. `addBattleTheme`
   ignores unknown moods and duplicate files; `setBattleThemes` only touches the
   registered mood keys.

3. Alternatively, edit the `BATTLE_THEMES` literal in `battle.html` directly
   (search for `const BATTLE_THEMES`) — the arrays accept multiple files per
   mood and one is chosen per fight.

## No files? Turn on generative music

If you don't want to source any track files, enable **Settings → Generative music
(chiptune)**. That runs `ChiptuneEngine` — an original procedural music engine that
composes background music live (scales + chord progressions via the Web Audio API,
no sample files). It has a distinct mood per screen and battle
(menu, town, route, battle, rival, Gym Leader, Elite Four, raid, boss, victory,
Safari, casino, and Crucible). Turn it off to go back to the bundled tracks. Both
options honour the Music toggle and volume and pause when the game is hidden.

The two systems are complementary: drop in real tracks for curated fidelity, or flip
on the generative engine for always-on, zero-file music.

## Format notes

- Prefer seamless-looping `.mp3`; keep files reasonably small (the field tracks
  are ~0.6–1.8 MB) so first paint and the pre-battle duck stay snappy.
- A missing theme falls back to the field music. If the browser requires a
  gesture, the next click, tap, or keypress resumes the current scene's music.
- Music honours the Settings → Music toggle and volume, and never plays under
  the test harness.
