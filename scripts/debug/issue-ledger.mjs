#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');
const FINDINGS_DIR = join(REPO, 'agent-state', 'findings');
const LEDGER_PATH = join(REPO, 'agent-state', 'ISSUE_LEDGER.md');

const SEV_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

function parseYamlBlock(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (/^-?\d+$/.test(v)) {
      v = Number(v);
    } else {
      v = v.replace(/^["']|["']$/g, '');
    }
    out[m[1]] = v;
  }
  return out;
}

function parseFindingFile(path, agentHint) {
  const raw = readFileSync(path, 'utf8');
  const blocks = [];
  const parts = raw.split(/^---\s*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const meta = parseYamlBlock(parts[i]);
    const body = (parts[i + 1] || '').trim();
    if (!meta.fingerprint && !meta.anchor_symbol) continue;
    if (!meta.agents || (Array.isArray(meta.agents) && meta.agents.length === 0)) {
      meta.agents = [agentHint];
    }
    if (typeof meta.agents === 'string') meta.agents = [meta.agents];
    blocks.push({ meta, body, sourceFile: path });
  }
  return blocks;
}

function collectFindings() {
  if (!existsSync(FINDINGS_DIR)) return [];
  const files = readdirSync(FINDINGS_DIR).filter(f => f.endsWith('.md') && f !== '.keep');
  const all = [];
  for (const f of files) {
    const agentHint = f.replace(/-\d{8}T\d{6}Z?.md$/, '').replace(/\.md$/, '');
    try {
      all.push(...parseFindingFile(join(FINDINGS_DIR, f), agentHint));
    } catch (e) {
      console.warn(`[ledger] skipping ${f}: ${e.message}`);
    }
  }
  return all;
}

function dedupe(blocks) {
  const byPrint = new Map();
  for (const b of blocks) {
    const fp = b.meta.fingerprint || `${b.meta.anchor_symbol}:${b.meta.file}`;
    const existing = byPrint.get(fp);
    if (!existing) {
      byPrint.set(fp, b);
    } else {
      const merged = new Set([...(existing.meta.agents || []), ...(b.meta.agents || [])]);
      existing.meta.agents = [...merged];
      if (merged.size >= 2 && existing.meta.confidence !== 'high') {
        existing.meta.confidence = 'high';
      }
    }
  }
  return [...byPrint.values()];
}

function assignIds(blocks) {
  blocks.sort((a, b) => {
    const sa = SEV_ORDER[a.meta.severity] ?? 9;
    const sb = SEV_ORDER[b.meta.severity] ?? 9;
    if (sa !== sb) return sa - sb;
    return String(a.meta.anchor_symbol || '').localeCompare(String(b.meta.anchor_symbol || ''));
  });
  blocks.forEach((b, i) => {
    b.meta.id = `ISSUE-${String(i + 1).padStart(3, '0')}`;
  });
}

function renderYaml(meta) {
  const lines = ['---'];
  const order = ['id', 'severity', 'category', 'anchor_symbol', 'current_line_hint', 'file', 'agents', 'fingerprint', 'confidence', 'status'];
  for (const k of order) {
    if (!(k in meta)) continue;
    let v = meta[k];
    if (Array.isArray(v)) v = `[${v.map(x => x).join(', ')}]`;
    lines.push(`${k}: ${v}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function render(blocks) {
  const ts = new Date().toISOString();
  const sevCounts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const b of blocks) sevCounts[b.meta.severity] = (sevCounts[b.meta.severity] || 0) + 1;
  const catCounts = {};
  for (const b of blocks) catCounts[b.meta.category] = (catCounts[b.meta.category] || 0) + 1;

  const out = [];
  out.push('# Issue Ledger — Pokemon Battle Arena');
  out.push('');
  out.push(`> **Generated**: ${ts}`);
  out.push(`> **Source**: \`agent-state/findings/*.md\` (${blocks.length === 0 ? 'empty' : `${blocks.length} unique findings after dedup`})`);
  out.push('> **Regenerate**: `node scripts/debug/issue-ledger.mjs`');
  out.push('> **Schema**: see `agent-state/LEDGER_SCHEMA.md`');
  out.push('');
  out.push('This file is **regenerated**, not hand-edited. To add an issue, drop a');
  out.push('finding file into `agent-state/findings/` and re-run the ledger. To update');
  out.push('status, edit the corresponding finding file and re-run.');
  out.push('');
  out.push('## Summary');
  out.push('');
  out.push('| Severity | Count |');
  out.push('|---|---|');
  for (const s of ['P0', 'P1', 'P2', 'P3']) out.push(`| ${s} | ${sevCounts[s] || 0} |`);
  out.push(`| **Total** | **${blocks.length}** |`);
  out.push('');
  out.push('| Category | Count |');
  out.push('|---|---|');
  const catKeys = Object.keys(catCounts).sort();
  if (catKeys.length === 0) {
    out.push('| _empty_ | 0 |');
  } else {
    for (const k of catKeys) out.push(`| ${k} | ${catCounts[k]} |`);
  }
  out.push('');
  out.push('## TOC');
  out.push('');
  if (blocks.length === 0) {
    out.push('_No findings yet. Run `/deep-debug`, `/story-audit`, or `/data-check` to populate._');
    out.push('');
    return out.join('\n');
  }
  for (const b of blocks) {
    const title = extractTitle(b.body) || b.meta.anchor_symbol || '(no title)';
    out.push(`- [${b.meta.id}] [${b.meta.severity}] ${title} — \`${b.meta.anchor_symbol}\` (${b.meta.category})`);
  }
  out.push('');
  out.push('---');
  out.push('');

  for (const b of blocks) {
    out.push(`## <a id="${b.meta.id}"></a> ${b.meta.id}: ${extractTitle(b.body) || b.meta.anchor_symbol}`);
    out.push('');
    out.push(renderYaml(b.meta));
    out.push('');
    out.push(b.body);
    out.push('');
    out.push('---');
    out.push('');
  }
  return out.join('\n');
}

function extractTitle(body) {
  const m = body.match(/\*\*Title\*\*:\s*(.+)/);
  return m ? m[1].trim() : null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const blocks = collectFindings();
  const deduped = dedupe(blocks);
  assignIds(deduped);
  const md = render(deduped);
  writeFileSync(LEDGER_PATH, md);
  console.log(`[issue-ledger] wrote ${LEDGER_PATH} — ${deduped.length} unique findings (${blocks.length} raw)`);
}

export { collectFindings, dedupe, assignIds, render };
