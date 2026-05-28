#!/usr/bin/env node
// One-shot: replace 7 inline dialogue-pool const literals in battle.html with
// `let X = {};` placeholders, and inject a parallel fetch into loadGameData()
// that populates them at boot.
//
// Idempotent — on re-run, detects the already-rewired form and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const SRC = path.join(REPO, 'battle.html');

const POOLS = [
  // [const-name, json-path, default-literal]
  ['LEADER_VICTORY_LINES',      'data/dialogue/leader-victory-lines.json',      '{}'],
  ['LEADER_BADGE_REFLECTIONS',  'data/dialogue/leader-badge-reflections.json',  '{}'],
  ['ELITE_VICTORY_LINES',       'data/dialogue/elite-victory-lines.json',       '{}'],
  ['CHAMPION_VICTORY_LINES',    'data/dialogue/champion-victory-lines.json',    '{}'],
  ['TRAINER_QUOTES',            'data/dialogue/trainer-quotes.json',            '{}'],
  ['TRAINER_QUOTES_BY_NAME',    'data/dialogue/trainer-quotes-by-name.json',    '{}'],
  ['CITY_GUIDE_QUOTES',         'data/dialogue/city-guide-quotes.json',         '[]'],
];

const MARKER_START = '// === DIALOGUE POOLS — loaded from data/dialogue/*.json by loadGameData() ===';
const MARKER_END   = '// === END DIALOGUE POOLS ===';

const LOADER_MARKER_START = '            // === DIALOGUE POOLS LOAD ===';
const LOADER_MARKER_END   = '            // === END DIALOGUE POOLS LOAD ===';

function findConstBlock(src, name) {
  const startRe = new RegExp(`(^\\s*)const\\s+${name}\\s*=\\s*([\\{\\[])`, 'm');
  const m = src.match(startRe);
  if (!m) return null;
  const lineStart = src.lastIndexOf('\n', m.index) + 1;
  const startIdx = m.index + m[0].length - 1; // index of the opening brace
  const open = src[startIdx];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = null, prev = '';
  let i = startIdx;
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
  // include trailing semicolon + newline
  const semiMatch = src.slice(i).match(/^\s*;[^\n]*\n/);
  if (!semiMatch) throw new Error(`${name}: no terminating semicolon`);
  const end = i + semiMatch[0].length;
  return { lineStart, end, indent: m[1] };
}

function rewriteConsts(src) {
  // Skip if already rewired (look for a `let LEADER_VICTORY_LINES = {};` form)
  if (/^\s*let\s+LEADER_VICTORY_LINES\s*=\s*\{\s*\};\s*$/m.test(src)) {
    return { src, skipped: true };
  }
  let out = src;
  // Locate first pool to anchor the joined-block insertion
  const first = findConstBlock(out, POOLS[0][0]);
  if (!first) throw new Error('cannot locate LEADER_VICTORY_LINES — already rewired or missing?');
  const indent = first.indent;
  // Replace each pool's full block individually, preserving file order.
  // Build replacements in source order (POOLS array order matches file order).
  // Apply from the BOTTOM up so earlier offsets stay valid.
  const blocks = POOLS.map(([name, , def]) => {
    const b = findConstBlock(out, name);
    if (!b) throw new Error(`cannot locate ${name}`);
    return { name, def, ...b };
  });
  blocks.sort((a, b) => b.lineStart - a.lineStart);
  for (const b of blocks) {
    const replacement = `${indent}let ${b.name} = ${b.def};\n`;
    out = out.slice(0, b.lineStart) + replacement + out.slice(b.end);
  }
  return { src: out, skipped: false };
}

function injectLoader(src) {
  if (src.includes(LOADER_MARKER_START)) {
    return { src, skipped: true };
  }
  // Find the end of the existing primary `Promise.all([...])` block inside
  // loadGameData. Anchor: `]);` right after `fetch('data/abilities.json')`.
  const anchor = src.indexOf("fetch('data/abilities.json').then(r => r.json())");
  if (anchor === -1) throw new Error('cannot locate primary Promise.all anchor');
  // Walk forward to the next `]);` after the anchor.
  const close = src.indexOf(']);', anchor);
  if (close === -1) throw new Error('cannot find closing ]); for primary Promise.all');
  // After that, walk to the next `\n` to know where to insert.
  const nl = src.indexOf('\n', close);
  const block = [
    '',
    LOADER_MARKER_START,
    "                _setLoadingText('Loading dialogue (5/5)…');",
    '                try {',
    '                    const [_lvl, _lbr, _eel, _cvl, _tq, _tqbn, _cgq] = await Promise.all([',
    ...POOLS.map(([_, json], i, arr) =>
      `                        fetch('${json}').then(r => r.json())${i === arr.length - 1 ? '' : ','}`
    ),
    '                    ]);',
    '                    LEADER_VICTORY_LINES     = _lvl  || {};',
    '                    LEADER_BADGE_REFLECTIONS = _lbr  || {};',
    '                    ELITE_VICTORY_LINES      = _eel  || {};',
    '                    CHAMPION_VICTORY_LINES   = _cvl  || {};',
    '                    TRAINER_QUOTES           = _tq   || {};',
    '                    TRAINER_QUOTES_BY_NAME   = _tqbn || {};',
    '                    CITY_GUIDE_QUOTES        = _cgq  || [];',
    '                } catch (e) {',
    "                    console.error('[dialogue] load failed:', e);",
    '                }',
    LOADER_MARKER_END,
  ].join('\n');
  return { src: src.slice(0, nl) + block + src.slice(nl), skipped: false };
}

function main() {
  let src = fs.readFileSync(SRC, 'utf8');
  const r1 = rewriteConsts(src);
  src = r1.src;
  const r2 = injectLoader(src);
  src = r2.src;
  if (r1.skipped && r2.skipped) {
    console.log('[rewire-dialogue-pools] already rewired — no changes');
    return;
  }
  fs.writeFileSync(SRC, src);
  console.log('[rewire-dialogue-pools] rewired',
    r1.skipped ? '(consts already let)' : '7 consts → let',
    '+',
    r2.skipped ? '(loader already injected)' : 'injected loader hook');
}

main();
