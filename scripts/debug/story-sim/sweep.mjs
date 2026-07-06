// Sharded Story-Sim sweep runner (Phases 4+5).
//
//   node scripts/debug/story-sim/sweep.mjs --seeds 40 --difficulty normal,hard \
//        --policy casual,recommended,optimal --item off,on --out agent-state/story-sim
//
// Runs the matrix (seed x difficulty x policy x itemMode), resolving every battle of every run
// with the real engine, and writes two JSONL streams:
//   runs.jsonl   — one line per run (summary + agent telemetry + nested stages)
//   stages.jsonl — one line per battle stage (flattened, keyed by run) for easy aggregation
//
// Sharding: --shard i/N runs only the combos whose index % N === i. Mirrors the
// tests/differential/sweep-sharded.mjs fan-out; run N shards in parallel then concat the outputs.
//
// Determinism: each run seeds its own RNG streams (see story-run/agent), so a given
// (seed,difficulty,policy,item) reproduces byte-identically regardless of shard/order.

import { mkdirSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { loadEngine } from '../../../tests/helpers/load-engine.js';
import { runStory } from './story-run.mjs';

function parseArgs(argv) {
  const a = { seeds: 20, difficulty: 'normal', policy: 'recommended', item: 'off',
    gens: '1-9', out: 'agent-state/story-sim', shard: null, endpoint: 'mystery', quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const [k, vRaw] = argv[i].replace(/^--/, '').split('=');
    const v = vRaw !== undefined ? vRaw : argv[++i];
    if (k === 'seeds') a.seeds = Number(v);
    else if (k === 'quiet') a.quiet = true;
    else if (k in a) a[k] = v;
  }
  return a;
}
function list(s) { return String(s).split(',').map(x => x.trim()).filter(Boolean); }
function gensOf(spec) {
  const m = String(spec).match(/^(\d)-(\d)$/);
  if (m) { const out = []; for (let g = +m[1]; g <= +m[2]; g++) out.push(g); return out; }
  return list(spec).map(Number);
}

async function main() {
  const A = parseArgs(process.argv.slice(2));
  const diffs = list(A.difficulty), pols = list(A.policy), items = list(A.item);
  const gens = gensOf(A.gens);
  let shardI = 0, shardN = 1;
  if (A.shard) { const [i, n] = String(A.shard).split('/').map(Number); shardI = i; shardN = n || 1; }

  // Build the combo matrix.
  const combos = [];
  for (let seed = 1; seed <= A.seeds; seed++)
    for (const difficulty of diffs)
      for (const policy of pols)
        for (const itemMode of items)
          combos.push({ seed, difficulty, policy, itemMode });
  const mine = combos.filter((_, idx) => idx % shardN === shardI);

  mkdirSync(A.out, { recursive: true });
  const suffix = A.shard ? `.shard${shardI}` : '';
  const runsOut = createWriteStream(join(A.out, `runs${suffix}.jsonl`), { flags: 'w' });
  const stagesOut = createWriteStream(join(A.out, `stages${suffix}.jsonl`), { flags: 'w' });

  const _l = console.log; console.log = () => {};
  const E = await loadEngine();
  console.log = _l;

  const t0 = Date.now();
  let done = 0;
  for (const c of mine) {
    const rec = await runStory(E, { ...c, gens, endpoint: A.endpoint });
    const runKey = { seed: c.seed, difficulty: c.difficulty, policy: c.policy, itemMode: c.itemMode };
    // Per-stage lines (flattened).
    for (const s of rec.stages) {
      if (s.kind !== 'battle') continue;
      stagesOut.write(JSON.stringify({ ...runKey, ...s }) + '\n');
    }
    // Per-run summary line (keep stages nested too for convenience).
    runsOut.write(JSON.stringify(rec) + '\n');
    done++;
    if (!A.quiet && (done % 5 === 0 || done === mine.length)) {
      const ms = Date.now() - t0;
      _l(`[shard ${shardI}/${shardN}] ${done}/${mine.length}  ${(ms / done / 1000).toFixed(1)}s/run  last: ` +
        `s${c.seed} ${c.difficulty}/${c.policy}/${c.itemMode} -> ${rec.outcome} (${rec.wins}/${rec.battles}W, ${rec.badges}b)`);
    }
  }
  runsOut.end(); stagesOut.end();
  _l(`\n[shard ${shardI}/${shardN}] complete: ${done} runs in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${A.out}/runs${suffix}.jsonl`);
  E.teardown();
}

main().catch(e => { console.error('sweep crashed:', e); process.exit(1); });
