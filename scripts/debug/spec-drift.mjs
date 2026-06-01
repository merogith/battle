#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');
const SYMBOL_INDEX_PATH = join(REPO, 'agent-state', 'symbol-index.json');

const DOCS = [
  'STORY_MODE_FLOW.md',
  'docs/STORY_NARRATIVE_VARIANTS.md',
  'docs/PROGRESSION_CURVE_MASTER.md',
  'docs/EVOLUTION_FLOW_REBUILD.md',
  'README.md',
].filter((p) => existsSync(join(REPO, p)));

const ANCHOR_RE = /\bbattle\.html:(\d+)/g;
const SYM_NEAR_RE = /`([A-Za-z_$][\w$]*)`/g;

function loadSymbolIndex() {
  if (!existsSync(SYMBOL_INDEX_PATH)) return null;
  return JSON.parse(readFileSync(SYMBOL_INDEX_PATH, 'utf8'));
}

function analyzeDoc(docPath, index) {
  const text = readFileSync(join(REPO, docPath), 'utf8');
  const refs = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    ANCHOR_RE.lastIndex = 0;
    while ((m = ANCHOR_RE.exec(line)) !== null) {
      const claimedLine = Number(m[1]);
      const symbolMatches = [...line.matchAll(SYM_NEAR_RE)].map(x => x[1]);
      const candidates = symbolMatches.filter(s => index && index[s]);
      refs.push({
        docLine: i + 1,
        claimedLine,
        symbolHints: symbolMatches,
        knownSymbols: candidates,
        actualSymbolLines: candidates.flatMap(s => (index[s] || []).map(h => `${s}@${h.file}:${h.line}`)),
        textContext: line.trim().slice(0, 160),
      });
    }
  }
  return { docPath, refs };
}

function render(perDoc) {
  const ts = new Date().toISOString();
  const out = [];
  out.push('# Spec Drift Report');
  out.push('');
  out.push(`> Generated: ${ts}`);
  out.push('> Source: `node scripts/debug/spec-drift.mjs`');
  out.push('');
  out.push('Resolves every `battle.html:LINE` reference in the design docs against');
  out.push('the current symbol index. A reference is "drifted" if the claimed line');
  out.push('no longer matches a symbol mentioned near the reference.');
  out.push('');

  let totalRefs = 0, driftedRefs = 0;
  for (const { docPath, refs } of perDoc) {
    if (refs.length === 0) continue;
    out.push(`## ${docPath}`);
    out.push('');
    out.push('| Doc line | Claimed `battle.html:LINE` | Symbols hinted | Current location |');
    out.push('|---|---|---|---|');
    for (const r of refs) {
      totalRefs++;
      const symList = r.symbolHints.length === 0 ? '_(none)_' : r.symbolHints.map(s => `\`${s}\``).join(', ');
      const actual = r.knownSymbols.length === 0 ? '_no known symbol_' : r.actualSymbolLines.join('<br>');
      const drifted = r.knownSymbols.length > 0 && !r.actualSymbolLines.some(s => s.includes(`:${r.claimedLine}`));
      if (drifted) driftedRefs++;
      const flag = drifted ? ' ⚠️' : '';
      out.push(`| ${r.docLine} | ${r.claimedLine}${flag} | ${symList} | ${actual} |`);
    }
    out.push('');
  }
  out.push('---');
  out.push('');
  out.push(`**Summary**: ${driftedRefs}/${totalRefs} \`battle.html:LINE\` references appear to have drifted.`);
  if (driftedRefs > 0) {
    out.push('');
    out.push('Drift is expected as code grows; what matters is whether the *symbol* the doc references still exists.');
    out.push('Cluster the drifted refs into ONE finding ("Doc line anchors stale") with a representative sample.');
  }
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const index = loadSymbolIndex();
  if (!index) {
    console.error('[spec-drift] symbol-index.json missing — run `node scripts/debug/symbol-index.mjs` first.');
    process.exit(2);
  }
  const perDoc = [];
  for (const d of DOCS) {
    if (!existsSync(join(REPO, d))) continue;
    perDoc.push(analyzeDoc(d, index));
  }
  const md = render(perDoc);
  const reportsDir = join(REPO, 'tests', 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = join(reportsDir, 'spec-drift.md');
  writeFileSync(outPath, md);
  const totalRefs = perDoc.reduce((a, d) => a + d.refs.length, 0);
  console.log(`[spec-drift] wrote ${outPath} — scanned ${perDoc.length} docs, ${totalRefs} battle.html:LINE refs`);
}
