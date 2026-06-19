// Anti-AI tone guard (data/dialogue/* + data/* flavor). Added with the 2026-06
// "anti-AI tone" pass (see docs/story-design/story-immersion/dialogue-and-writing.md §12).
//
// The pools were rewritten to remove two machine "tells": TEMPLATE UNIFORMITY
// (a whole pool built on one skeleton with swapped nouns) and a MONOTONE narrator
// voice with repeated tics. This guard locks those regressions out — it does NOT
// judge prose quality, only that no single pattern re-dominates a pool. Thresholds
// are loose (set well clear of today's values) so legitimate edits won't trip them;
// they only fire if a pool collapses back toward one shape.
//
//   node --test tests/suites/dialogue-anti-template.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));
const values = (obj) => Object.entries(obj).filter(([k]) => !k.startsWith('_')).map(([, v]) => v);

// ── 1. Badge reflections: the original tell was "[City]'s [landmark]…" ×70 ──────
test('leader-badge-reflections: few entries open on a "<ProperNoun>\'s" possessive', () => {
  const lines = values(readJson('data', 'dialogue', 'leader-badge-reflections.json'));
  const possessive = lines.filter(l => /^"?…?\s*[A-Z][\w.]+(?:’s|'s|s’)\b/.test(l));
  const share = possessive.length / lines.length;
  assert.ok(share < 0.30,
    `${(share * 100).toFixed(0)}% of badge reflections open on a possessive proper noun ` +
    `(was the AI skeleton; budget <30%). Vary the openers.`);
});

test('leader-badge-reflections: no single first word dominates the openers', () => {
  const lines = values(readJson('data', 'dialogue', 'leader-badge-reflections.json'));
  const counts = {};
  for (const l of lines) {
    const m = l.match(/^"?…?\s*([A-Za-z]+)/);
    const w = (m ? m[1] : '').toLowerCase();
    counts[w] = (counts[w] || 0) + 1;
  }
  const top = Math.max(...Object.values(counts));
  const share = top / lines.length;
  assert.ok(share < 0.40,
    `one opener word covers ${(share * 100).toFixed(0)}% of badge reflections ` +
    `(budget <40%) — a monotone opener is creeping back in.`);
});

// ── 2. Elite victory: the tell was every line ending "Onward / next gate awaits" ─
test('elite-victory-lines: the "onward / next gate" ending does not dominate', () => {
  const lines = values(readJson('data', 'dialogue', 'elite-victory-lines.json'));
  const onward = lines.filter(l => /(Onward|Press on|Move on|next gate (awaits|.s yours))/i.test(l));
  const share = onward.length / lines.length;
  assert.ok(share < 0.25,
    `${(share * 100).toFixed(0)}% of elite lines end on the "onward/next gate" tic (budget <25%).`);
});

// ── 3. Leader victory: the tell was the "…Badge—[trailing]" em-dash handoff ──────
test('leader-victory-lines: the em-dash badge handoff stays rare', () => {
  const lines = values(readJson('data', 'dialogue', 'leader-victory-lines.json'));
  const dash = lines.filter(l => /[—–]/.test(l));
  const share = dash.length / lines.length;
  assert.ok(share < 0.20,
    `${(share * 100).toFixed(0)}% of leader victory lines use an em/en-dash (budget <20%) — ` +
    `the "Badge—" handoff template is returning.`);
});

// ── 4. Trailing-qualifier tic budget across every dialogue pool ──────────────────
test('dialogue pools: trailing-qualifier tics stay within a small budget', () => {
  const dir = path.join(ROOT, 'data', 'dialogue');
  const TIC = /(Most days|this once|, probably|, usually| for now)\.\s*"?\s*$/;
  let hits = [];
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.json'))) {
    const data = readJson('data', 'dialogue', f);
    for (const s of JSON.stringify(data).match(/"[^"]*"/g) || []) {
      if (TIC.test(s.slice(1, -1))) hits.push(`${f}: ${s}`);
    }
  }
  assert.ok(hits.length <= 2,
    `trailing-qualifier tics over budget (≤2):\n  ${hits.join('\n  ')}`);
});

// ── 5. Hollow hype: the Master Ball shortDesc must not regress to marketing-speak ─
test('items: Master Ball shortDesc carries no hollow hype', () => {
  const items = readJson('data', 'items.json');
  const desc = items.masterball && items.masterball.shortDesc || '';
  assert.ok(!/ultimate performance|the best ball/i.test(desc),
    `Master Ball shortDesc reads as hype: "${desc}"`);
});

// ── 6. Render contract: marquee lines fit the title card (≤110 chars, per _meta) ─
test('marquee-entries: every spoken line stays within the ~110-char card budget', () => {
  const mq = readJson('data', 'dialogue', 'marquee-entries.json');
  for (const [k, v] of Object.entries(mq)) {
    if (k.startsWith('_')) continue;
    for (const line of v.lines || []) {
      assert.ok(line.length <= 110, `${k}: line exceeds 110 chars (${line.length}): "${line}"`);
    }
  }
});
