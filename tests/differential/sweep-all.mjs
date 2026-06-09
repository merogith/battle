// Comprehensive differential SWEEP runner.
//
// Stage-2 of the Showdown-parity methodology (tests/differential/METHODOLOGY.md):
// take every scenario the generator emits (all moves / abilities / items), run it
// through BOTH engines, and produce a machine-readable divergence map + a human
// report + the FIDELITY scorecard. It does NOT decide what's a bug — that's the
// triage agent's job; this just surfaces and ranks the raw divergences.
//
// Two run shapes (chosen by each scenario's `mode`, set by generate-scenarios.mjs):
//   trace — one battle per engine; diffTraces() (boosts/status/faint/damage-range).
//   sweep — N seeds per engine; compare damage RANGES with the crit-proof min-skew
//           (reused from damage-sweep.mjs) so a sub-2.2× multiplier gap still shows.
//
// Standalone (not node:test): force-exits at the end because the jsdom engine
// harness keeps timers alive.
//
//   node tests/differential/sweep-all.mjs                 # full sweep
//   node tests/differential/sweep-all.mjs --kind move     # one entity kind
//   node tests/differential/sweep-all.mjs --filter thunder # name/id substring
//   node tests/differential/sweep-all.mjs --limit 50       # smoke
//   node tests/differential/sweep-all.mjs --shard 0/8      # partition 0 of 8
//   node tests/differential/sweep-all.mjs --seeds 6        # sweep seeds/engine
//
// Reference: @pkmn/sim (MIT). See docs/BATTLE_ENGINE_INVESTIGATION.md.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSuite } from './generate-scenarios.mjs';
import { runShowdownBattle } from './showdown-oracle.mjs';
import { runInhouseBattle } from './inhouse-oracle.mjs';
import { diffTraces } from './diff.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── args ────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { seeds: 8 };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--kind') a.kind = argv[++i];
    else if (t === '--filter') a.filter = argv[++i];
    else if (t === '--limit') a.limit = +argv[++i];
    else if (t === '--seeds') a.seeds = +argv[++i];
    else if (t === '--shard') { const [i0, n] = argv[++i].split('/'); a.shardIndex = +i0; a.shardTotal = +n; }
    else if (t === '--out') a.out = argv[++i];
    else if (t === '--no-report') a.noReport = true;
  }
  return a;
}
const ARGS = parseArgs(process.argv.slice(2));

// ── sweep range compare (crit-proof min-skew; adapted from damage-sweep.mjs) ──────
const SEEDS_IH = (n) => Array.from({ length: n }, (_, i) => i + 1);
const SEEDS_SD = (n) => Array.from({ length: n }, (_, i) => [i + 1, (i * 7 + 3) & 255, (i * 13 + 5) & 255, (i * 17 + 9) & 255]);

async function runSweep(scn, n) {
  const aMoves = scn.attackerMoves || [scn.move, 'Splash'];
  const dMoves = scn.defenderMoves || ['Splash', 'Splash'];
  const c1 = scn.choices1 || ['move 1'];
  const c2 = scn.choices2 || ['move 1'];
  const who = scn.measure === 'attacker' ? 'p1a' : 'p2a';
  const acc = { ih: { min: Infinity, max: 0, sum: 0, ko: false }, sd: { min: Infinity, max: 0, sum: 0, ko: false } };
  const tally = (g, last) => {
    const d = (last?.maxhp || 0) - (last?.hp || 0);
    if ((last?.hp | 0) <= 0) g.ko = true;
    g.min = Math.min(g.min, d); g.max = Math.max(g.max, d); g.sum += d;
  };
  for (const seed of SEEDS_IH(n)) {
    const r = await runInhouseBattle({ team1: [{ ...scn.attacker, moves: aMoves }], team2: [{ ...scn.defender, moves: dMoves }], choices1: c1, choices2: c2, seed });
    tally(acc.ih, r.turns[r.turns.length - 1]?.end?.[who]);
  }
  for (const seed of SEEDS_SD(n)) {
    const r = await runShowdownBattle({ team1: [{ ...scn.attacker, moves: aMoves }], team2: [{ ...scn.defender, moves: dMoves }], choices1: c1, choices2: c2, seed });
    tally(acc.sd, r.turns[r.turns.length - 1]?.end?.[who]);
  }
  const { ih, sd } = acc;
  const overlap = ih.min <= sd.max && sd.min <= ih.max;
  const loMin = Math.min(ih.min, sd.min), hiMin = Math.max(ih.min, sd.min);
  const minSkew = loMin > 0 ? hiMin / loMin : (hiMin > 0 ? Infinity : 1);
  const minDiverge = (hiMin - loMin) > 4 && minSkew > 1.20;
  const invalid = ih.ko || sd.ko;
  // both deal 0 over every seed → the probe never engaged this entity (no signal).
  const inert = ih.max === 0 && sd.max === 0;
  const flag = !invalid && !inert && (!overlap || minDiverge);
  return { ih: { min: ih.min, max: ih.max }, sd: { min: sd.min, max: sd.max }, overlap, minSkew, minDiverge, invalid, inert, flag };
}

// ── classify one scenario's outcome ──────────────────────────────────────────────
// Confidence mirrors diff.mjs: high = RNG-independent (boosts/faint/winner/disjoint
// ranges/effectiveness), medium = status presence, low = roll-band HP.
async function runOne(scn, n) {
  if (scn.mode === 'sweep') {
    const r = await runSweep(scn, n);
    let confidence = 'none', detail = '';
    if (r.invalid) { confidence = 'invalid'; detail = 'a mon fainted → range capped'; }
    else if (r.inert) { confidence = 'inert'; detail = 'both engines dealt 0 — probe did not engage'; }
    else if (r.flag) { confidence = 'high'; detail = `disjoint/min-skew ih[${r.ih.min}-${r.ih.max}] sd[${r.sd.min}-${r.sd.max}] (×${r.minSkew === Infinity ? '∞' : r.minSkew.toFixed(2)})`; }
    else { confidence = 'agree'; detail = `overlap ih[${r.ih.min}-${r.ih.max}] sd[${r.sd.min}-${r.sd.max}]`; }
    return { confidence, detail, sweep: r, divergences: r.flag ? [{ field: 'damage-range', showdown: `${r.sd.min}-${r.sd.max}`, inhouse: `${r.ih.min}-${r.ih.max}`, confidence: 'high' }] : [] };
  }
  // trace
  const sd = await runShowdownBattle(scn);
  const ih = await runInhouseBattle(scn);
  const d = diffTraces(sd, ih, scn);
  let confidence = 'agree', detail = '';
  if (d.counts.high > 0) { confidence = 'high'; detail = describe(d.divergences, 'high'); }
  else if (d.counts.medium > 0) { confidence = 'medium'; detail = describe(d.divergences, 'medium'); }
  else if (d.counts.low > 0) { confidence = 'low'; detail = describe(d.divergences, 'low'); }
  return { confidence, detail, counts: d.counts, divergences: d.divergences, sdWinner: sd.winner, ihWinner: ih.winner };
}
function describe(divs, conf) {
  return divs.filter((x) => x.confidence === conf).slice(0, 3)
    .map((x) => `T${x.turn ?? '-'} ${x.slot ?? ''} ${x.field}: sd=${x.showdown} ih=${x.inhouse}`).join(' | ');
}

// ── main ─────────────────────────────────────────────────────────────────────────
async function main() {
  const { scenarios, coverage, stats } = buildSuite({
    kind: ARGS.kind, filter: ARGS.filter, limit: ARGS.limit,
    shardIndex: ARGS.shardIndex, shardTotal: ARGS.shardTotal,
  });
  process.stderr.write(`Sweeping ${scenarios.length} scenarios (sweep seeds/engine: ${ARGS.seeds})…\n`);

  const results = [];
  let done = 0;
  for (const scn of scenarios) {
    let row;
    try {
      const r = await runOne(scn, ARGS.seeds);
      row = { id: scn.id, kind: scn.kind, entity: scn.entity, family: scn.family, mode: scn.mode, observability: scn.observability || (scn.mode === 'sweep' ? 'damage-range' : '-'), category: scn.category, desc: scn.desc, ...r };
    } catch (err) {
      row = { id: scn.id, kind: scn.kind, entity: scn.entity, family: scn.family, mode: scn.mode, confidence: 'error', detail: String(err && err.message).slice(0, 200), divergences: [] };
    }
    results.push(row);
    done++;
    if (done % 100 === 0 || done === scenarios.length) process.stderr.write(`  …${done}/${scenarios.length}\n`);
  }

  // ── write machine-readable results to --out (always; this is what shards merge) ──
  const outDir = ARGS.out || join(__dirname, 'sweep-out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), args: ARGS, stats, results }, null, 0));

  // Shard workers stop here — the orchestrator (sweep-sharded.mjs) merges + reports.
  if (ARGS.noReport) {
    process.stderr.write(`shard ${ARGS.shardIndex}/${ARGS.shardTotal}: ${results.length} results → ${outDir}/results.json\n`);
    process.exit(0);
  }

  writeReports(outDir, __dirname, { results, coverage, stats });
  const highs = results.filter((r) => r.confidence === 'high');
  process.stderr.write(`\nWrote SWEEP_REPORT.md, FIDELITY.md, and ${outDir}/{results,triage-shards}.json\n`);
  process.stderr.write(`HIGH ${highs.length} · MED ${results.filter((r) => r.confidence === 'medium').length} · inert ${results.filter((r) => r.confidence === 'inert').length} · err ${results.filter((r) => r.confidence === 'error').length}\n`);
  process.exit(0);
}

// Aggregate `results` and write triage-shards.json + SWEEP_REPORT.md + FIDELITY.md.
// Exported so the sharded orchestrator can merge per-shard results and report once.
export function writeReports(outDir, reportDir, { results, coverage, stats }) {
  mkdirSync(outDir, { recursive: true });
  // Persist the full merged results (the orchestrator calls writeReports directly, so
  // this is where the complete per-scenario data is written — not just triage-shards).
  writeFileSync(join(outDir, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), stats, results }, null, 0));
  const highs = results.filter((r) => r.confidence === 'high');
  const mediums = results.filter((r) => r.confidence === 'medium');
  const errors = results.filter((r) => r.confidence === 'error');
  const inerts = results.filter((r) => r.confidence === 'inert');
  const divergentEntities = new Set(highs.map((r) => `${r.kind}:${r.entity}`));

  // shard the HIGH-confidence divergences by setup-shape (kind+family) for agents
  const shards = {};
  for (const r of highs) {
    const key = `${r.kind}.${r.family || 'misc'}`;
    (shards[key] = shards[key] || []).push(r);
  }
  writeFileSync(join(outDir, 'triage-shards.json'), JSON.stringify(shards, null, 0));

  const date = new Date().toISOString().slice(0, 10);
  let md = `# Comprehensive Differential Sweep\n\n> Generated ${date} by \`sweep-all.mjs\`. Reference: **@pkmn/sim** (MIT). ` +
    `Subject: \`battle.html\` (headless). No game code changed — observe & diff only.\n\n`;
  md += `## Headline\n`;
  md += `- **Scenarios run:** ${results.length}\n`;
  md += `- **High-confidence divergences:** ${highs.length} (across ${divergentEntities.size} entities)\n`;
  md += `- **Medium (status-presence) divergences:** ${mediums.length}\n`;
  md += `- **Inert probes (no signal — entity not engaged):** ${inerts.length}\n`;
  md += `- **Harness errors:** ${errors.length}\n\n`;

  md += `## High-confidence divergences by shard (kind.family)\n\n| Shard | Count |\n|---|--:|\n`;
  for (const [k, v] of Object.entries(shards).sort((a, b) => b[1].length - a[1].length)) md += `| \`${k}\` | ${v.length} |\n`;

  md += `\n## High-confidence divergences (candidate findings)\n\n| Entity | Kind | Family | Scenario | Detail |\n|---|---|---|---|---|\n`;
  for (const r of highs.slice(0, 400)) {
    md += `| **${r.entity}** | ${r.kind} | ${r.family} | \`${r.id}\` | ${(r.detail || '').replace(/\|/g, '\\|').slice(0, 120)} |\n`;
  }
  if (highs.length > 400) md += `| … | | | | (+${highs.length - 400} more — see results.json) |\n`;

  if (errors.length) {
    md += `\n## Harness errors (${errors.length})\n\n| Scenario | Error |\n|---|---|\n`;
    for (const r of errors.slice(0, 60)) md += `| \`${r.id}\` | ${(r.detail || '').replace(/\|/g, '\\|')} |\n`;
  }
  writeFileSync(join(reportDir, 'SWEEP_REPORT.md'), md, 'utf8');

  // ── FIDELITY scorecard ──
  writeFidelity(join(reportDir, 'FIDELITY.md'), { date, results, coverage, stats, divergentEntities });
  return { highs: highs.length, mediums: mediums.length, inerts: inerts.length, errors: errors.length, divergentEntities: divergentEntities.size };
}

function writeFidelity(path, { date, results, coverage, stats, divergentEntities }) {
  const per = (kind) => {
    const probed = coverage.filter((c) => c.kind === kind && c.nProbes > 0).length;
    const total = coverage.filter((c) => c.kind === kind).length;
    const ran = new Set(results.filter((r) => r.kind === kind).map((r) => r.entity));
    const agree = new Set(results.filter((r) => r.kind === kind && (r.confidence === 'agree')).map((r) => r.entity));
    const diverge = new Set(results.filter((r) => r.kind === kind && r.confidence === 'high').map((r) => r.entity));
    return { total, probed, ran: ran.size, diverge: diverge.size, agreeOnly: [...agree].filter((e) => !diverge.has(e)).length };
  };
  let md = `# Engine Fidelity Scorecard\n\n> ${date} · auto-generated by \`sweep-all.mjs\`. ` +
    `"Fidelity" = how closely \`battle.html\` matches Pokémon Showdown (\`@pkmn/sim\`).\n\n`;
  md += `## Replica fidelity (lower divergence = closer replica)\n\n`;
  md += `| Kind | In data | Auto-probed | Probed entities run | Entities w/ HIGH divergence |\n|---|--:|--:|--:|--:|\n`;
  for (const kind of ['move', 'ability', 'item']) {
    const p = per(kind);
    md += `| ${kind} | ${p.total} | ${p.probed} | ${p.ran} | **${p.diverge}** |\n`;
  }
  md += `\n**Headline divergent entities: ${divergentEntities.size}.** This is the number the methodology drives toward zero (after subtracting intentional deviations + harness limitations).\n`;

  // backlog: entities routed out (need targeted probes) — the prioritized to-do.
  md += `\n## Unimplemented / not-yet-probed backlog\n\n`;
  md += `Entities the auto-sweep could not meaningfully probe (need a targeted probe or are out of scope). ` +
    `Per the findings policy, these are a backlog here rather than individual ledger findings.\n\n`;
  for (const route of ['needs-targeted', 'untestable', 'harness-untestable', 'banned-oos']) {
    const rows = coverage.filter((c) => c.route === route);
    if (!rows.length) continue;
    md += `- **${route}:** ${rows.length} (${rows.slice(0, 12).map((r) => r.entity).join(', ')}${rows.length > 12 ? ', …' : ''})\n`;
  }
  md += `\n## How to read this\n- Re-run: \`npm run test:differential:all\`. Deterministic (fixed seeds).\n` +
    `- Triage the HIGH divergences with the \`differential-triage-auditor\` agent (\`/differential-sweep\`).\n` +
    `- A HIGH divergence is a *candidate* bug; the agent classifies it (real-bug / rng / intentional / harness / unimplemented).\n`;
  writeFileSync(path, md, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
