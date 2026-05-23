---
name: inspect-save
description: Parses a `pbs_story_save` localStorage JSON dump, validates against `SAVE_VER=15`, summarizes party / PC / badges / eventIndex / unlock state. Useful for reproducing bug reports that include a save export.
---

# inspect-save

## When to use

- A user reports a story-mode bug and shares their save JSON (from browser DevTools → Application → Local Storage → `pbs_story_save`).
- You need to construct a deterministic story scenario for repro.
- You're auditing save-migration logic (`migrateStoryPreV*` chain).

## How to use

### Inspect a save JSON file

```bash
node -e "
const fs = require('fs');
const sm = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
console.log('SAVE_VER:', sm.SAVE_VER ?? sm.saveVer ?? '(missing)');
console.log('eventIndex:', sm.eventIndex);
console.log('badges:', sm.badges);
console.log('team:', (sm.team || []).map(p => p?.species || p?.name).join(', '));
console.log('PC size:', (sm.pcBox || []).length);
console.log('balls:', sm.balls);
console.log('unlockedGimmicks:', sm.unlockedGimmicks);
console.log('rivalStanding:', { wins: sm.rivalWins, losses: sm.rivalLosses, champClaimed: sm.rivalChampionClaimed });
console.log('runSeed:', sm.runSeed);
console.log('catchTutorialDone:', sm.catchTutorialDone);
console.log('storyDifficulty:', sm.storyDifficulty);
console.log('settings.enabledGens:', sm.settings?.enabledGens);
console.log('settings.mechanics:', sm.settings?.mechanics);
" /path/to/save.json
```

### Validate against current SAVE_VER

The engine's `SAVE_VER` constant lives at `battle.html` (resolve via `find-anchor SAVE_VER`). Any save with a lower `SAVE_VER` should round-trip through the `migrateStoryPreV<N>` chain at load — if it doesn't, that's a finding.

### Repro: load a save in jsdom

```js
const harness = await loadEngine();
harness.engine.window.localStorage.setItem('pbs_story_save', JSON.stringify(saveData));
// Trigger the story-mode resume codepath via the engine's load function
// (find-anchor load → call harness.engine.window.<load function>())
```

## Output contract for findings

When reporting a save-related finding, include in the `Repro` field:
- `SAVE_VER` of the input save
- the eventIndex, badges, and party size
- a one-line summary of the save state's relevance to the bug

Don't embed the full save JSON in the finding — it's noisy. Link to a file in `agent-state/saves/` instead if needed.
