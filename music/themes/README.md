# Battle themes — drop-in guide

Story trainer battles swap the continuous field BGM for a mood-appropriate
battle theme, then restore the field track (with a short victory fanfare on a
win) when the fight ends. Wild / casual battles are left on the field BGM.

The mood slots are **already wired** in `AudioSystem` (`BATTLE_THEMES`). Only
content ships today: one dramatic track (`boss_climax.mp3`) covers every major
fight, and ordinary trainers intentionally stay on the field BGM. Adding
per-tier tracks is a drop-in — no code edit to the monolith required.

## Slots

| Mood key  | Fires for                                             | Ships today          |
|-----------|-------------------------------------------------------|----------------------|
| `trainer` | Route / gym filler trainers                           | *(empty → field BGM)*|
| `leader`  | Gym Leaders                                            | `boss_climax.mp3`    |
| `rival`   | Rival battles                                          | `boss_climax.mp3`    |
| `elite`   | Elite Four / Victory Road                              | `boss_climax.mp3`    |
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
     boss:    ['music/themes/champion.mp3'],
   });
   ```

   Both mutate the live `BATTLE_THEMES` object in place. `addBattleTheme`
   ignores unknown moods and duplicate files; `setBattleThemes` only touches the
   five known keys.

3. Alternatively, edit the `BATTLE_THEMES` literal in `battle.html` directly
   (search for `const BATTLE_THEMES`) — the arrays accept multiple files per
   mood and one is chosen per fight.

## Format notes

- Prefer seamless-looping `.mp3`; keep files reasonably small (the field tracks
  are ~0.6–1.8 MB) so first paint and the pre-battle duck stay snappy.
- Missing or blocked files fall back to the field BGM automatically — a bad path
  never leaves a battle silent.
- Music honours the Settings → Music toggle and volume, and never plays under
  the test harness.
