#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');

async function load() {
  const mod = await import(join(REPO, 'tests', 'helpers', 'load-engine.js'));
  return mod.loadEngine();
}

function median(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function iqr(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  return q3 - q1;
}
function bytesMb(n) { return (n / 1024 / 1024).toFixed(1); }

async function benchBoot() {
  const t0 = process.hrtime.bigint();
  const h = await load();
  const t1 = process.hrtime.bigint();
  return { harness: h, bootMs: Number(t1 - t0) / 1e6 };
}

async function benchTurn(harness, trials = 30) {
  const { mkMon, runTurn } = harness;
  const samples = [];
  const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Splash', 'Splash', 'Splash'] });
  const defender = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  for (let i = 0; i < trials; i++) {
    const t0 = process.hrtime.bigint();
    await runTurn({ playerMon: attacker, foeMon: defender, playerMoveSlot: 0, foeMoveSlot: 0 });
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0) / 1e6);
    defender.currentHp = defender.maxHp;
  }
  return samples;
}

async function benchParseMove(harness, trials = 200) {
  const { engine } = harness;
  const movesDB = engine.movesDB || {};
  const moveNames = Object.keys(movesDB).filter(n => movesDB[n] && typeof movesDB[n] === 'object').slice(0, trials);
  const samples = [];
  for (const name of moveNames) {
    const move = movesDB[name];
    if (!move) continue;
    const t0 = process.hrtime.bigint();
    try { engine.parseMoveEffects(move); } catch (e) { /* malformed entry skipped */ }
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0) / 1e6);
  }
  return samples;
}

async function benchMemoryGrowth(harness, turns = 60) {
  const { mkMon, runTurn } = harness;
  const attacker = mkMon({ species: 'Pikachu', moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Splash'] });
  const defender = mkMon({ species: 'Snorlax', moves: ['Body Slam', 'Splash', 'Splash', 'Splash'] });
  const samples = [];
  for (let i = 0; i < turns; i++) {
    await runTurn({ playerMon: attacker, foeMon: defender, playerMoveSlot: i % 4, foeMoveSlot: 0 });
    defender.currentHp = defender.maxHp; attacker.currentHp = attacker.maxHp;
    if (i % 10 === 0) {
      if (global.gc) global.gc();
      samples.push({ turn: i, heapMb: Number(bytesMb(process.memoryUsage().heapUsed)) });
    }
  }
  return samples;
}

function renderAsciiChart(samples, w = 40) {
  if (samples.length === 0) return '(no data)';
  const min = Math.min(...samples.map(s => s.heapMb));
  const max = Math.max(...samples.map(s => s.heapMb));
  const range = Math.max(max - min, 0.1);
  return samples.map(s => {
    const filled = Math.round(((s.heapMb - min) / range) * w);
    return `turn ${String(s.turn).padStart(3)} | ${'#'.repeat(filled).padEnd(w)} ${s.heapMb} MB`;
  }).join('\n');
}

function classify(median, target) {
  if (median <= target) return '✅ within target';
  if (median <= target * 2) return '⚠️  >1×';
  return '🚨 >2× over target';
}

async function main() {
  const out = [];
  const ts = new Date().toISOString();
  out.push('# Performance Benchmark Report');
  out.push('');
  out.push(`> Generated: ${ts}`);
  out.push('> Source: `node scripts/debug/perf-bench.mjs`');
  out.push('> Environment: jsdom (sleep short-circuited; production timing differs)');
  out.push('');

  process.stderr.write('[perf] booting engine...\n');
  const { harness, bootMs } = await benchBoot();
  out.push('## Engine boot');
  out.push('');
  out.push(`Cold start: **${bootMs.toFixed(0)} ms** (target: < 5000 ms in jsdom; first import dominated by JSDOM init + battle.html parse)`);
  out.push('');

  process.stderr.write('[perf] turn loop (30 trials)...\n');
  const turnSamples = await benchTurn(harness, 30);
  out.push('## Turn loop');
  out.push('');
  out.push('| Stat | ms |');
  out.push('|---|---|');
  out.push(`| Median | ${median(turnSamples).toFixed(2)} |`);
  out.push(`| IQR | ${iqr(turnSamples).toFixed(2)} |`);
  out.push(`| Min | ${Math.min(...turnSamples).toFixed(2)} |`);
  out.push(`| Max | ${Math.max(...turnSamples).toFixed(2)} |`);
  out.push('');
  out.push(`Target: < 50 ms (jsdom). Result: ${classify(median(turnSamples), 50)}`);
  out.push('');

  process.stderr.write('[perf] parseMoveEffects (200 moves)...\n');
  const parseSamples = await benchParseMove(harness, 200);
  out.push('## parseMoveEffects (per move)');
  out.push('');
  out.push('| Stat | ms |');
  out.push('|---|---|');
  out.push(`| Median | ${median(parseSamples).toFixed(3)} |`);
  out.push(`| IQR | ${iqr(parseSamples).toFixed(3)} |`);
  out.push(`| Max | ${Math.max(...parseSamples).toFixed(3)} |`);
  out.push('');
  out.push(`Target: < 0.5 ms per call. Result: ${classify(median(parseSamples), 0.5)}`);
  out.push('');

  process.stderr.write('[perf] memory growth (60 turns)...\n');
  const memSamples = await benchMemoryGrowth(harness, 60);
  out.push('## Memory growth across 60 turns');
  out.push('');
  out.push('```');
  out.push(renderAsciiChart(memSamples, 30));
  out.push('```');
  out.push('');
  const first = memSamples[0]?.heapMb ?? 0;
  const last = memSamples[memSamples.length - 1]?.heapMb ?? 0;
  out.push(`Heap delta: ${(last - first).toFixed(1)} MB over 60 turns. Linear growth = normal; quadratic = leak.`);
  out.push('');

  out.push('---');
  out.push('');
  out.push('Run with `--expose-gc` for cleaner memory measurements: `node --expose-gc scripts/debug/perf-bench.mjs`.');

  const reportsDir = join(REPO, 'tests', 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = join(reportsDir, 'perf.md');
  writeFileSync(outPath, out.join('\n'));
  process.stderr.write(`[perf] wrote ${outPath}\n`);
  if (harness.teardown) harness.teardown();
}

main().catch(err => {
  console.error('[perf] failed:', err);
  process.exit(1);
});
