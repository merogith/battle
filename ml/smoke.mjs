// ml/smoke.mjs — Stage 1 acceptance test (pure Node, no Python required).
//
// Proves the two things the roadmap's Stage 1 promises:
//   1. A RANDOM agent can play full battles end-to-end (they terminate with a
//      winner, forced switches and all).
//   2. The SAME seed reproduces the SAME battle (determinism — the bedrock of
//      reproducible RL training).
//
// Run:  node ml/smoke.mjs
//       node ml/smoke.mjs --battles 20 --party 4

import { createHost } from './engine-host.mjs';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

// A deterministic "random" policy so a replay with the same seed is identical.
// (We must NOT use Math.random for the policy — Math.random is the engine's
// seeded battle RNG. We use our own tiny mulberry32 keyed off the episode seed.)
function makePolicy(seed) {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return (mask) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const legal = mask.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    return legal[Math.floor(r * legal.length)] ?? 0;
  };
}

async function playEpisode(host, { seed, partySize, maxTurns = 300 }) {
  await host.reset({ seed, partySize });
  const policy = makePolicy(seed);
  const switchChooser = (indices) => {
    // deterministic pick: lowest index (stable across replays)
    return indices[0];
  };
  let steps = 0;
  let totalReward = 0;
  while (!host.isOver() && steps < maxTurns) {
    const mask = host.legalActions();
    const action = policy(mask);
    const { reward, done } = await host.step(action, { switchChooser });
    totalReward += reward;
    steps++;
    if (done) break;
  }
  return {
    steps,
    over: host.isOver(),
    won: host.isOver() ? host.playerWon() : null,
    totalReward: Number(totalReward.toFixed(4)),
    finalTurn: host.state().turnNumber,
  };
}

async function main() {
  const battles = parseInt(arg('battles', '8'), 10);
  const partySize = parseInt(arg('party', '3'), 10);

  console.log(`[smoke] booting engine (jsdom)…`);
  const host = await createHost();
  console.log(`[smoke] OBS_DIM=${host.OBS_DIM} ACTION_DIM=${host.ACTION_DIM}`);

  // --- Test 1: random agent finishes full battles --------------------------
  let wins = 0;
  let incomplete = 0;
  const results = [];
  for (let i = 0; i < battles; i++) {
    const r = await playEpisode(host, { seed: 1000 + i, partySize });
    results.push(r);
    if (!r.over) incomplete++;
    if (r.won) wins++;
    console.log(
      `  battle ${String(i + 1).padStart(2)} | seed ${1000 + i} | ` +
        `${r.over ? (r.won ? 'WIN ' : 'loss') : 'UNFINISHED'} | ` +
        `steps ${String(r.steps).padStart(3)} | turn ${String(r.finalTurn).padStart(3)} | reward ${r.totalReward}`,
    );
  }
  console.log(
    `[smoke] random-agent win-rate vs real bot: ${wins}/${battles} ` +
      `(expected ~50% if random is no better/worse; lower if the bot is decent).`,
  );

  // --- Test 2: determinism (same seed -> identical outcome) ----------------
  const a = await playEpisode(host, { seed: 4242, partySize });
  const b = await playEpisode(host, { seed: 4242, partySize });
  const same =
    a.steps === b.steps &&
    a.won === b.won &&
    a.finalTurn === b.finalTurn &&
    a.totalReward === b.totalReward;

  console.log(
    `[smoke] determinism (seed 4242): ` +
      `A=(steps ${a.steps}, won ${a.won}, reward ${a.totalReward}) ` +
      `B=(steps ${b.steps}, won ${b.won}, reward ${b.totalReward}) -> ` +
      (same ? 'IDENTICAL ✓' : 'DIVERGED ✗'),
  );

  const ok = incomplete === 0 && same;
  console.log(`\n[smoke] RESULT: ${ok ? 'PASS ✓' : 'FAIL ✗'}` + (incomplete ? ` (${incomplete} battles did not finish)` : ''));
  host.window.close?.();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('[smoke] crashed:', e);
  process.exit(1);
});
