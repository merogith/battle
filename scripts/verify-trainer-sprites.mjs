/**
 * Verifies every TRAINER_DATA row resolves to an existing PNG on disk.
 * Run from project root: node scripts/verify-trainer-sprites.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'battle.html');
const trainerDir = path.join(root, '..', 'new assets', 'Trainerlist');

function sanitize(name) {
  return String(name).replace(/\s+/g, '_').replace(/[().\/]/g, '');
}

function parseSpriteMap(src) {
  const map = {};
  const m = src.match(/const SPRITE_MAP = \{([\s\S]*?)\n\s*\};/);
  if (!m) return map;
  const re = /'((?:\\'|[^'])*)'\s*:\s*'((?:\\'|[^'])*)'/g;
  let mm;
  while ((mm = re.exec(m[1]))) {
    map[mm[1].replace(/\\'/g, "'")] = mm[2].replace(/\\'/g, "'");
  }
  return map;
}

const html = fs.readFileSync(htmlPath, 'utf8');
const SPRITE_MAP = parseSpriteMap(html);
const tdStart = html.indexOf('const TRAINER_DATA = [');
const tdEnd = html.indexOf('const STORY_EVENTS_RAW', tdStart);
const block = html.slice(tdStart, tdEnd);
const lines = block.split('\n');

const missing = [];
const seenFiles = new Set();

for (const line of lines) {
  const nm = line.match(/name:'((?:\\'|[^'])*)'/);
  if (!nm) continue;
  const name = nm[1].replace(/\\'/g, "'");
  const sf = line.match(/spriteFile:'((?:\\'|[^'])*)'/);
  const spriteFile = sf ? sf[1].replace(/\\'/g, "'") : '';
  const file = spriteFile || SPRITE_MAP[name] || sanitize(name);
  const fp = path.join(trainerDir, `${file}.png`);
  seenFiles.add(file);
  if (!fs.existsSync(fp)) {
    missing.push({ name, file, path: fp });
  }
}

const listPath = path.join(root, 'trainerlist_files.txt');
const onDisk = fs.existsSync(listPath)
  ? fs.readFileSync(listPath, 'utf8').trim().split(/\r?\n/).filter(Boolean)
  : [];

const orphanBasenames = onDisk.filter((b) => !seenFiles.has(b));

console.log('Trainerlist dir:', trainerDir);
console.log('TRAINER_DATA rows parsed (with name:):', lines.filter((l) => /name:'/.test(l)).length);
console.log('Resolved sprite files missing on disk:', missing.length);
if (missing.length) {
  console.log('First 25 missing:');
  missing.slice(0, 25).forEach((m) => console.log(' ', m.name, '→', m.file));
  process.exitCode = 1;
} else {
  console.log('All trainer rows resolve to existing PNGs.');
}

if (orphanBasenames.length) {
  console.log('PNG files with no TRAINER_DATA row (informational):', orphanBasenames.length);
}
