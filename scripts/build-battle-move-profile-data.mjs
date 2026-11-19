import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const lookup = path => new URL(path, root);
const require = createRequire(import.meta.url);
const { readFlags, readIntent } = require('../battle-move-profiles.js');
const [data, legacy, browser] = await Promise.all(
  ['data/moves.json', 'move-anim-map.js', 'battle-move-profiles.js'].map(file => readFile(lookup(file), 'utf8'))
);
const moves = JSON.parse(data)['9'];
const presets = vm.runInNewContext(legacy + '\nMOVE_ANIM_MAP');
const rows = Object.entries(moves).sort(([a], [b]) => a.localeCompare(b)).map(([id, move]) => {
  const fields = [
    id, move.type, move.category, move.target, move.basePower || 0,
    move.priority || 0, readFlags(move), presets[move.name]?.s || '', readIntent(move, id),
    (move.realMove || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
  ];
  if (fields.some(field => String(field).includes('|'))) throw new Error('A move fact contains the field delimiter: ' + id);
  return '        ' + JSON.stringify(fields.join('|')) + ',';
});
const start = '        /* BEGIN GENERATED MOVE FACTS */';
const end = '        /* END GENERATED MOVE FACTS */';
const beginIndex = browser.indexOf(start);
const endIndex = browser.indexOf(end);
if (beginIndex < 0 || endIndex <= beginIndex) throw new Error('Move fact markers are missing or out of order.');
const next = browser.slice(0, beginIndex) + [start, ...rows, ''].join('\n') + browser.slice(endIndex);
if (process.argv.includes('--check')) {
  if (next !== browser) {
    console.error('Battle move facts are stale. Run node scripts/build-battle-move-profile-data.mjs.');
    process.exitCode = 1;
  }
} else {
  await writeFile(lookup('battle-move-profiles.js'), next);
  console.log('Packed ' + rows.length + ' canonical move records.');
}
