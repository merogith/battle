#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');

const TARGETS = [
  { file: 'battle.html', label: 'battle.html' },
  { file: 'online-pvp.js', label: 'online-pvp.js' },
  { file: 'move-anim-map.js', label: 'move-anim-map.js' },
  { file: 'move-sfx-map.js', label: 'move-sfx-map.js' },
];

const PATTERNS = [
  { name: 'function-decl',  re: /^[\t ]*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/ },
  { name: 'const-decl',     re: /^[\t ]*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/ },
  { name: 'method-decl',    re: /^[\t ]*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/ },
  { name: 'arrow-const',    re: /^[\t ]*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/ },
];

const SKIP_NAMES = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'do', 'return', 'function',
  'else', 'try', 'finally', 'with', 'typeof', 'new', 'in', 'of',
]);

function indexFile(absPath, label) {
  const text = readFileSync(absPath, 'utf8');
  const lines = text.split('\n');
  const symbols = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 400) continue;
    for (const { name: kind, re } of PATTERNS) {
      const m = line.match(re);
      if (m && m[1] && !SKIP_NAMES.has(m[1])) {
        const sym = m[1];
        if (!symbols.has(sym)) {
          symbols.set(sym, { file: label, line: i + 1, kind, snippet: line.trim().slice(0, 200) });
        }
      }
    }
  }
  return symbols;
}

function build() {
  const all = {};
  for (const { file, label } of TARGETS) {
    const abs = join(REPO, file);
    if (!existsSync(abs)) continue;
    const symbols = indexFile(abs, label);
    for (const [sym, meta] of symbols.entries()) {
      const key = sym;
      if (!all[key]) all[key] = [];
      all[key].push(meta);
    }
  }
  return all;
}

function writeOutputs(index) {
  const jsonPath = join(REPO, 'agent-state', 'symbol-index.json');
  const negCachePath = join(REPO, 'agent-state', 'symbol-negative-cache.json');
  writeFileSync(jsonPath, JSON.stringify(index, null, 2));
  if (!existsSync(negCachePath)) {
    writeFileSync(negCachePath, JSON.stringify({ misses: [] }, null, 2));
  }
  return { jsonPath, negCachePath, count: Object.keys(index).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === '--lookup' && args[1]) {
    const idx = JSON.parse(readFileSync(join(REPO, 'agent-state', 'symbol-index.json'), 'utf8'));
    const hits = idx[args[1]];
    if (!hits) {
      process.stderr.write(`not in index: ${args[1]}\n`);
      process.exit(3);
    }
    for (const h of hits) console.log(`${h.file}:${h.line}\t${h.kind}\t${h.snippet}`);
    process.exit(0);
  }
  const idx = build();
  const out = writeOutputs(idx);
  console.log(`[symbol-index] indexed ${out.count} unique symbols → ${out.jsonPath}`);
}

export { build as buildSymbolIndex, indexFile };
