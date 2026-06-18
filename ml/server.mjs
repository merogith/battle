// ml/server.mjs — the Node<->Python bridge.
//
// A line-oriented JSON-RPC server over stdin/stdout. Python (ml/env.py) spawns
// this process and exchanges one JSON object per line:
//
//   <- {"cmd":"reset","seed":0,"partySize":3}
//   -> {"ok":true,"observation":[...],"mask":[...],"obsDim":54,"actionDim":9}
//   <- {"cmd":"step","action":2}
//   -> {"ok":true,"observation":[...],"reward":0.31,"done":false,"mask":[...],"info":{...}}
//   <- {"cmd":"close"}
//
// Why stdin/stdout instead of a socket: zero config, no ports, works on every
// OS, and the OS pipes are plenty fast for one env per process (run N processes
// in parallel for throughput — that's exactly what a vectorized Gym env does).
//
// IMPORTANT: the engine is chatty on boot (it logs gen-filter notices to
// stdout). We must keep the PROTOCOL channel clean, so we only ever write JSON
// to the real stdout via `respond()` AFTER boot, and we route the engine's
// console.* to stderr. Anything the engine prints during boot goes to stderr.

import { createHost } from './engine-host.mjs';

// Keep stdout PRISTINE for the JSON line protocol. Two sources would otherwise
// contaminate it: (1) the engine's console.* chatter, (2) node:test's TAP
// reporter ("TAP version 13" + a summary at exit) — load-engine.js imports
// node:test for its cleanup hook, which activates that reporter. We capture the
// real stdout writer, then swallow EVERY other write to process.stdout so only
// send() (below) can emit on the protocol channel. Engine console.* -> stderr.
const rawStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, enc, cb) => {
  // Drop anything not emitted through send(); route to stderr for debugging.
  try { process.stderr.write(typeof chunk === 'string' ? chunk : chunk); } catch (e) {}
  if (typeof enc === 'function') enc();
  else if (typeof cb === 'function') cb();
  return true;
};
for (const k of ['log', 'info', 'warn', 'error', 'debug']) {
  console[k] = (...a) => process.stderr.write('[engine] ' + a.map(String).join(' ') + '\n');
}

function send(obj) {
  rawStdoutWrite(JSON.stringify(obj) + '\n');
}

async function main() {
  const host = await createHost();
  // Announce readiness with the space dimensions so Python can build its spaces.
  send({ ok: true, event: 'ready', obsDim: host.OBS_DIM, actionDim: host.ACTION_DIM });

  // forced replacements during a step: pick the highest-HP live bench mon.
  const switchChooser = (indices) => {
    const s = host.state();
    let best = indices[0];
    let bestHp = -1;
    for (const i of indices) {
      const m = s.playerParty[i];
      const hp = m ? m.currentHp / (m.maxHp || 1) : 0;
      if (hp > bestHp) { bestHp = hp; best = i; }
    }
    return best;
  };

  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch (e) { send({ ok: false, error: 'bad-json' }); continue; }
      try {
        if (msg.cmd === 'reset') {
          const obs = await host.reset({
            seed: msg.seed >>> 0,
            partySize: msg.partySize || 3,
            aiProfile: msg.aiProfile || 'balanced',
          });
          send({ ok: true, observation: obs, mask: host.legalActions(), obsDim: host.OBS_DIM, actionDim: host.ACTION_DIM });
        } else if (msg.cmd === 'step') {
          const r = await host.step(msg.action | 0, { switchChooser });
          send({ ok: true, observation: r.observation, reward: r.reward, done: r.done, mask: host.legalActions(), info: r.info });
        } else if (msg.cmd === 'close') {
          send({ ok: true, event: 'bye' });
          process.exit(0);
        } else {
          send({ ok: false, error: 'unknown-cmd:' + msg.cmd });
        }
      } catch (e) {
        send({ ok: false, error: String(e && e.message ? e.message : e) });
      }
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

main().catch((e) => {
  process.stderr.write('[server] fatal: ' + (e && e.stack ? e.stack : e) + '\n');
  process.exit(1);
});
