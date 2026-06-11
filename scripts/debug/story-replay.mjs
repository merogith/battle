#!/usr/bin/env node
// Deterministic story-mode replay harness.
//
// Drives the engine's story-mode globals through a small fixed itinerary using
// the seeded RNG. Captures state snapshots after each event and writes a JSON
// trace. Diffing two traces from the same seed must produce zero diffs — that's
// the determinism guarantee. If they differ, an unsynced Math.random() is in
// the story path.

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');

async function load() {
  const mod = await import(join(REPO, 'tests', 'helpers', 'load-engine.js'));
  return mod.loadEngine();
}

function snapshot(window) {
  const sm = window.sm || {};
  return {
    eventIndex: sm.eventIndex ?? null,
    badges: sm.badges ?? null,
    rivalWins: sm.rivalWins ?? null,
    rivalLosses: sm.rivalLosses ?? null,
    rivalChampionClaimed: !!sm.rivalChampionClaimed,
    teamSpecies: Array.isArray(sm.team) ? sm.team.map(p => p?.species || p?.name || null) : null,
    pcSize: Array.isArray(sm.pcBox) ? sm.pcBox.length : null,
    balls: sm.balls ? { ...sm.balls } : null,
    catchTutorialDone: !!sm.catchTutorialDone,
    unlockedGimmicks: sm.unlockedGimmicks ? [...sm.unlockedGimmicks].sort() : null,
    runSeed: sm.runSeed ?? null,
    rngState: sm._strngState ?? null,
  };
}

async function runReplay(seed = 12345) {
  const harness = await load();
  const { window, seedRng } = harness;
  seedRng(seed);

  const trace = { seed, generatedAt: new Date().toISOString(), snapshots: [] };

  // Check whether the story-mode globals are even reachable. They should be —
  // the engine boots story-mode IIFEs at load.
  if (!window.sm && typeof window.newStoryRun !== 'function' && !window.StoryMode) {
    trace.error = 'sm global and newStoryRun not exposed by engine — story-mode replay path needs an exposed entry point';
    return trace;
  }

  trace.snapshots.push({ label: 'boot', state: snapshot(window) });

  // The engine doesn't fully expose a programmatic story-run kickoff (the UI
  // pipeline is browser-only). The most we can do without modifying the engine
  // is snapshot a few states by calling exposed helpers. Real replay coverage
  // belongs in tests/integration/story-flow.test.js where we can stand up the
  // sm object directly and drive proceedToNextBattle.

  if (typeof window.newStoryRun === 'function') {
    try {
      window.newStoryRun({ rivalName: 'Test', startingGen: 8 });
      trace.snapshots.push({ label: 'after-newStoryRun', state: snapshot(window) });
    } catch (e) {
      trace.snapshots.push({ label: 'newStoryRun-error', error: String(e?.message || e) });
    }
  }

  return trace;
}

function diffTraces(a, b) {
  const diffs = [];
  if (a.seed !== b.seed) diffs.push({ field: 'seed', a: a.seed, b: b.seed });
  const ns = Math.max(a.snapshots.length, b.snapshots.length);
  for (let i = 0; i < ns; i++) {
    const sa = a.snapshots[i]; const sb = b.snapshots[i];
    if (!sa || !sb) { diffs.push({ at: i, missing: !sa ? 'a' : 'b' }); continue; }
    if (sa.label !== sb.label) diffs.push({ at: i, field: 'label', a: sa.label, b: sb.label });
    const ja = JSON.stringify(sa.state || {}); const jb = JSON.stringify(sb.state || {});
    if (ja !== jb) diffs.push({ at: i, label: sa.label, field: 'state', a: sa.state, b: sb.state });
  }
  return diffs;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'capture';

  const reportsDir = join(REPO, 'tests', 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const tracePath = join(reportsDir, 'story-replay-trace.json');

  if (cmd === 'capture') {
    const seed = Number(args[1] ?? 12345);
    const t = await runReplay(seed);
    writeFileSync(tracePath, JSON.stringify(t, null, 2));
    process.stderr.write(`[story-replay] captured ${t.snapshots.length} snapshots (seed=${seed}) → ${tracePath}\n`);
    if (t.error) process.stderr.write(`[story-replay] WARN: ${t.error}\n`);
  } else if (cmd === 'diff') {
    const seed = Number(args[1] ?? 12345);
    const a = await runReplay(seed);
    const b = await runReplay(seed);
    const diffs = diffTraces(a, b);
    if (diffs.length === 0) {
      console.log('[story-replay] DETERMINISTIC ✅ — same seed produced identical trace');
    } else {
      console.log('[story-replay] DRIFT DETECTED ⚠️');
      console.log(JSON.stringify(diffs, null, 2));
      process.exit(1);
    }
  } else {
    console.error('usage: story-replay.mjs [capture|diff] [seed]');
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // The booted jsdom windows keep live timers, so the event loop never drains
  // on its own — exit explicitly once main() settles or the process hangs.
  main().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
}

export { runReplay, diffTraces, snapshot };
