// Sharded orchestrator for the comprehensive differential sweep.
//
// WHY: the in-house engine is driven through a single cached jsdom instance that
// accumulates state across battles, so a single-process run of all ~3k scenarios
// grows to >1.4 GB and GC-thrashes to a near-stall partway through. The fix is to
// run the sweep as several SHORTER worker processes (each ~total/N scenarios), each
// of which boots its own engine, runs its slice, writes results, and EXITS — so
// memory is reclaimed between slices. This orchestrator spawns the workers (with
// bounded concurrency), then merges their per-shard results and writes the reports
// once via sweep-all.mjs's exported `writeReports`.
//
//   node tests/differential/sweep-sharded.mjs            # 8 shards, 6 seeds, 2 at a time
//   node tests/differential/sweep-sharded.mjs --shards 12 --seeds 8 --concurrency 2

import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSuite } from './generate-scenarios.mjs';
import { writeReports } from './sweep-all.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = { shards: 8, seeds: 6, concurrency: 2 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--shards') a.shards = +argv[++i];
    else if (argv[i] === '--seeds') a.seeds = +argv[++i];
    else if (argv[i] === '--concurrency') a.concurrency = +argv[++i];
  }
  return a;
}
const ARGS = parseArgs(process.argv.slice(2));

const WORKER = join(__dirname, 'sweep-all.mjs');
const SHARD_DIR = join(__dirname, 'sweep-out', 'shards');

function runWorker(i, n) {
  const outDir = join(SHARD_DIR, `shard-${i}`);
  mkdirSync(outDir, { recursive: true });
  return new Promise((resolve, reject) => {
    const child = spawn('node', [WORKER, '--shard', `${i}/${n}`, '--seeds', String(ARGS.seeds), '--out', outDir, '--no-report'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let lastLine = '';
    child.stderr.on('data', (d) => {
      const lines = String(d).split('\n').filter(Boolean);
      lastLine = lines[lines.length - 1] || lastLine;
      // surface only the periodic progress counters, prefixed by shard.
      for (const l of lines) if (/\d+\/\d+/.test(l)) process.stderr.write(`  [shard ${i}] ${l.trim()}\n`);
    });
    child.on('close', (code) => {
      if (code === 0) resolve(join(outDir, 'results.json'));
      else reject(new Error(`shard ${i} exited ${code}: ${lastLine}`));
    });
  });
}

// Run all shards with bounded concurrency.
async function runPool(n, concurrency) {
  const files = new Array(n);
  let next = 0;
  async function worker() {
    while (next < n) {
      const i = next++;
      files[i] = await runWorker(i, n);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, n) }, worker));
  return files;
}

async function main() {
  const t0 = Date.now();
  // Full coverage/stats (engine-free) for the merged report; scenarios filtered per shard in the workers.
  const { coverage, stats } = buildSuite();
  process.stderr.write(`Sharded sweep: ${stats.scenarios} scenarios across ${ARGS.shards} shards ` +
    `(${ARGS.seeds} seeds, ${ARGS.concurrency} workers)…\n`);

  rmSync(SHARD_DIR, { recursive: true, force: true });
  const files = await runPool(ARGS.shards, ARGS.concurrency);

  // merge
  const results = [];
  for (const f of files) {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    results.push(...j.results);
  }

  const outDir = join(__dirname, 'sweep-out');
  const summary = writeReports(outDir, __dirname, { results, coverage, stats });
  rmSync(SHARD_DIR, { recursive: true, force: true });

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  process.stderr.write(`\nMerged ${results.length} results in ${mins} min.\n`);
  process.stderr.write(`HIGH ${summary.highs} (${summary.divergentEntities} entities) · MED ${summary.mediums} · inert ${summary.inerts} · err ${summary.errors}\n`);
  process.stderr.write(`Wrote SWEEP_REPORT.md, FIDELITY.md, sweep-out/{results,triage-shards}.json\n`);
  process.exit(0);
}

main();
