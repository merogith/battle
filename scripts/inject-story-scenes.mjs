// Refresh the generated placement tables without changing the authored scenes
// or reward rules. Run scripts/build-story-scenes.mjs after editing the CSV.
import { readFileSync, writeFileSync } from 'node:fs';

const battlePath = new URL('../battle.html', import.meta.url);
const generatedPath = new URL('./build/story-scenes.generated.js', import.meta.url);
const battle = readFileSync(battlePath, 'utf8');
const generated = readFileSync(generatedPath, 'utf8');
const start = battle.match(/^        const MAIN_STORY_BEATS = /m)?.index;
const end = battle.indexOf('        // ─── END generated story beat tables ');
const firstTable = generated.indexOf('        const MAIN_STORY_BEATS = ');
if (start == null || end <= start || firstTable < 0) throw new Error('Story beat table boundaries are missing.');

// Refuse a stale artifact from the old generator, which contained archived prose.
const tables = generated.slice(firstTable);
if (tables.includes('const STORY_SCENES') || !tables.includes('const EXTRA_STORY_BEATS')) {
    throw new Error('Run node scripts/build-story-scenes.mjs to regenerate the beat tables.');
}
const out = battle.slice(0, start) + tables + '\n' + battle.slice(end);
if (out === battle) {
    console.log('Story beat tables are current.');
} else if (process.argv.includes('--check')) {
    throw new Error('Inline beat tables are out of date. Run node scripts/inject-story-scenes.mjs.');
} else {
    writeFileSync(battlePath, out, 'utf8');
    console.log('Updated inline story beat tables.');
}
