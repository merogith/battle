// Differential harness — report runner.
//
// Runs every scenario through both engines, diffs the traces, and writes
// tests/differential/DIVERGENCE_REPORT.md. Standalone script (not node:test):
// it force-exits at the end because the jsdom engine harness keeps timers alive.
//
//   node tests/differential/run-report.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SCENARIOS } from './scenarios.mjs';
import { runShowdownBattle } from './showdown-oracle.mjs';
import { runInhouseBattle } from './inhouse-oracle.mjs';
import { diffTraces } from './diff.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function verdict(scn, counts) {
  if (scn.expect === 'diverge') {
    return counts.high > 0 ? { ok: true, label: '✅ bug caught' } : { ok: false, label: '⚠️ NOT caught' };
  }
  if (scn.expect === 'probe') {
    return counts.high > 0
      ? { ok: true, label: '🔍 divergence (investigate)' }
      : { ok: true, label: '🔍 no divergence' };
  }
  // expect match
  if (counts.high > 0) return { ok: false, label: '❌ FALSE POSITIVE' };
  return { ok: true, label: '✅ agrees' };
}

async function main() {
  const results = [];
  for (const scn of SCENARIOS) {
    let row;
    try {
      const [sd, ih] = [
        await runShowdownBattle(scn),
        await runInhouseBattle(scn),
      ];
      const d = diffTraces(sd, ih, scn);
      row = { scn, counts: d.counts, divergences: d.divergences, sdWinner: sd.winner, ihWinner: ih.winner, turns: d.turnsCompared };
    } catch (err) {
      row = { scn, counts: { high: 0, medium: 0, low: 0, total: 0 }, divergences: [], error: err && err.message };
    }
    row.verdict = row.error ? { ok: false, label: '💥 harness error' } : verdict(scn, row.counts);
    results.push(row);
    process.stderr.write(`  ${row.verdict.label.padEnd(18)} ${scn.id}\n`);
  }

  // ── build markdown ──
  const date = new Date().toISOString().slice(0, 10);
  const bugsCaught = results.filter(r => r.scn.expect === 'diverge' && r.verdict.ok).length;
  const bugsTotal = results.filter(r => r.scn.expect === 'diverge').length;
  const falsePos = results.filter(r => r.scn.expect === 'match' && !r.verdict.ok).length;
  const sanityTotal = results.filter(r => r.scn.expect === 'match').length;
  const probesWithDiv = results.filter(r => r.scn.expect === 'probe' && r.counts.high > 0).length;
  const probesTotal = results.filter(r => r.scn.expect === 'probe').length;

  // High-confidence disagreements on anything that was NOT a known bug = the new map.
  const findings = results.filter(r => !r.error && r.counts.high > 0 && r.scn.expect !== 'diverge');
  let findingsSection;
  if (findings.length) {
    findingsSection = `\n## 🔎 New divergences to investigate (${findings.length})\nHigh-confidence disagreements on should-match / exploratory scenarios — candidate bugs beyond the known catalogue.\n\n`;
    for (const r of findings) {
      findingsSection += `- **\`${r.scn.id}\`** (${r.scn.category}) — ${r.scn.desc}\n`;
      for (const d of r.divergences.filter(x => x.confidence === 'high').slice(0, 6)) {
        findingsSection += `  - T${d.turn} ${d.slot} \`${d.field}\`: Showdown=\`${d.showdown}\` vs in-house=\`${d.inhouse}\`${d.note ? ` — ${d.note}` : ''}\n`;
      }
    }
  } else {
    findingsSection = `\n## 🔎 New divergences to investigate\nNone — every should-match / exploratory scenario agreed with Showdown at high confidence.\n`;
  }

  let md = `# Differential Divergence Report

> Generated ${date} by \`tests/differential/run-report.mjs\`.
> Reference: **@pkmn/sim** (MIT, the auto-synced Pokémon Showdown simulator) ·
> Subject: the in-house engine in \`battle.html\` (driven headless via the jsdom harness).
> This is **Stage 0** of the oracle-led plan (\`docs/BATTLE_ENGINE_INVESTIGATION.md\`): no game
> code changed — the harness only *observes* both engines and diffs them.

## Headline
- **Known bugs confirmed by the oracle:** ${bugsCaught}/${bugsTotal}
- **Sanity scenarios in agreement:** ${sanityTotal - falsePos}/${sanityTotal}
- **False positives (high-confidence divergence on a should-match case):** ${falsePos} ${falsePos === 0 ? '✅' : '❌'}
- **Probes flagging a divergence to investigate:** ${probesWithDiv}/${probesTotal}

Confidence: **high** = boosts / faint / winner (RNG-independent — real divergences) ·
**medium** = status presence (may be a chance-secondary) · **low** = raw HP beyond the roll band.
${findingsSection}
## Summary
| Scenario | Category | Expect | HIGH | med | low | Verdict |
|---|---|---|---:|---:|---:|---|
`;
  for (const r of results) {
    md += `| \`${r.scn.id}\` | ${r.scn.category} | ${r.scn.expect} | ${r.counts.high} | ${r.counts.medium} | ${r.counts.low} | ${r.verdict.label} |\n`;
  }

  md += `\n## Details\n`;
  for (const r of results) {
    md += `\n### \`${r.scn.id}\` — ${r.verdict.label}\n`;
    md += `${r.scn.desc}\n\n`;
    if (r.scn.bug) md += `- **Maps to:** ${r.scn.bug}\n`;
    if (r.scn.note) md += `- **Note:** ${r.scn.note}\n`;
    md += `- Winner: Showdown=\`${r.sdWinner}\` · in-house=\`${r.ihWinner}\` · turns compared: ${r.turns ?? 0}\n`;
    if (r.error) { md += `- 💥 harness error: ${r.error}\n`; continue; }
    if (!r.divergences.length) { md += `- No divergences.\n`; continue; }
    md += `\n| Turn | Mon | Field | Showdown | In-house | Conf |\n|---|---|---|---|---|---|\n`;
    for (const d of r.divergences.slice(0, 40)) {
      md += `| ${d.turn} | ${d.slot} | ${d.field} | \`${d.showdown}\` | \`${d.inhouse}\` | ${d.confidence} |\n`;
    }
    if (r.divergences.length > 40) md += `| … | | (+${r.divergences.length - 40} more) | | | |\n`;
  }

  const out = join(__dirname, 'DIVERGENCE_REPORT.md');
  writeFileSync(out, md, 'utf8');
  process.stderr.write(`\nWrote ${out}\n`);
  process.stderr.write(`Bugs caught ${bugsCaught}/${bugsTotal} · sanity clean ${sanityTotal - falsePos}/${sanityTotal} · false positives ${falsePos}\n`);

  process.exit(falsePos === 0 ? 0 : 1);
}

main();
