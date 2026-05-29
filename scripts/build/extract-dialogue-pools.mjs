#!/usr/bin/env node
// One-shot: extract dialogue-pool consts from battle.html into data/dialogue/*.json.
// Idempotent — re-running overwrites the JSON files; do not re-run after manual
// edits to the JSON.
//
// Strategy: find each `const NAME = { ... };` (or `[ ... ];`) block, take the
// literal between the outer braces/brackets, wrap it in a fresh JS Function
// that returns it, and JSON.stringify the result. The const literal is plain
// JS object syntax with quoted string keys + string values — no functions, no
// references — so a synthetic Function eval is safe and faithful.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const SRC = path.join(REPO, 'battle.html');
const OUT_DIR = path.join(REPO, 'data', 'dialogue');

const POOLS = [
  // [const-name, output-file, type ('object' | 'array')]
  ['LEADER_VICTORY_LINES',      'leader-victory-lines.json',      'object'],
  ['LEADER_BADGE_REFLECTIONS',  'leader-badge-reflections.json',  'object'],
  ['ELITE_VICTORY_LINES',       'elite-victory-lines.json',       'object'],
  ['CHAMPION_VICTORY_LINES',    'champion-victory-lines.json',    'object'],
  ['TRAINER_QUOTES',            'trainer-quotes.json',            'object'],
  ['TRAINER_QUOTES_BY_NAME',    'trainer-quotes-by-name.json',    'object'],
  ['CITY_GUIDE_QUOTES',         'city-guide-quotes.json',         'array'],
];

function extractPool(src, name, kind) {
  // Match `const NAME = {` or `const NAME = [`, then balance braces/brackets.
  const startRe = new RegExp(`\\bconst\\s+${name}\\s*=\\s*([\\{\\[])`, 'm');
  const m = src.match(startRe);
  if (!m) throw new Error(`Could not find const ${name}`);
  const startIdx = m.index + m[0].length - 1; // index of the opening brace/bracket
  const open = src[startIdx];
  const close = open === '{' ? '}' : ']';
  // Balance — track open/close including nesting and string contents.
  let depth = 0;
  let i = startIdx;
  let inStr = null;
  let prev = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
    } else {
      if (c === '"' || c === "'") inStr = c;
      else if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    prev = c;
  }
  const literal = src.slice(startIdx, i);
  // Sanity check the closing semicolon exists right after.
  const rest = src.slice(i, i + 3);
  if (!rest.match(/^\s*;/)) {
    throw new Error(`${name} block did not terminate with ';' (got: ${JSON.stringify(rest)})`);
  }
  // Eval as a JS literal. Safe because no `${}`, no template, no references —
  // verified by checking the literal contains no backtick and no identifier-
  // followed-by-paren that would imply a function call.
  if (/`/.test(literal)) {
    throw new Error(`${name} literal contains backtick — unexpected, refusing to eval`);
  }
  const fn = new Function('return (' + literal + ');');
  const value = fn();
  const expectedShape = kind === 'object' ? 'object' : 'array';
  const actualShape = Array.isArray(value) ? 'array' : 'object';
  if (actualShape !== expectedShape) {
    throw new Error(`${name}: expected ${expectedShape}, got ${actualShape}`);
  }
  return value;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const src = fs.readFileSync(SRC, 'utf8');
  const report = [];
  for (const [name, file, kind] of POOLS) {
    const value = extractPool(src, name, kind);
    const outPath = path.join(OUT_DIR, file);
    fs.writeFileSync(outPath, JSON.stringify(value, null, 2) + '\n');
    const size = Array.isArray(value) ? value.length : Object.keys(value).length;
    report.push(`  ${name.padEnd(30)} → ${file.padEnd(36)} (${size} entries)`);
  }
  console.log('[extract-dialogue-pools] wrote', POOLS.length, 'files:');
  console.log(report.join('\n'));
}

main();
