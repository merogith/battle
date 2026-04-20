import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'battle.html'), 'utf8');
const trainerDir = path.join(root, '..', 'new assets', 'Trainerlist');
const list = fs.readFileSync(path.join(root, 'trainerlist_files.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean);

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

const SPRITE_MAP = parseSpriteMap(html);
const tdStart = html.indexOf('const TRAINER_DATA = [');
const tdEnd = html.indexOf('const STORY_EVENTS_RAW', tdStart);
const block = html.slice(tdStart, tdEnd);
const lines = block.split('\n');
const bad = [];

for (const line of lines) {
  const nm = line.match(/name:'((?:\\'|[^'])*)'/);
  if (!nm) continue;
  const name = nm[1].replace(/\\'/g, "'");
  const sf = line.match(/spriteFile:'((?:\\'|[^'])*)'/);
  const spriteFile = sf ? sf[1].replace(/\\'/g, "'") : '';
  const file = spriteFile || SPRITE_MAP[name] || sanitize(name);
  const fp = path.join(trainerDir, `${file}.png`);
  if (!fs.existsSync(fp)) {
    const lower = file.toLowerCase();
    const guess = list.find((b) => b.toLowerCase() === lower)
      || list.find((b) => sanitize(b.replace(/~/g, ' ')) === file)
      || list.find((b) => b.replace(/_/g, '').toLowerCase() === file.replace(/_/g, '').toLowerCase());
    bad.push({ name, file, guess: guess || null });
  }
}

console.log(JSON.stringify(bad, null, 2));
