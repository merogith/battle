// Probe: trace Gen-1-only Rattata-sentinel / type-blind-fallback cases.
// For every non-Normal trainer that ends up fielding Rattata across N gen-1 seeds, report the
// trainer's declared type and how deep the Gen-1 species pool is for that type (by grade) — to
// confirm the cause is type-pool exhaustion in the narrow gen lock.
import { loadEngine } from '../../../tests/helpers/load-engine.js';

const N = parseInt(process.argv[2] || '60', 10);
const eng = await loadEngine();
const S = eng.window.__storyTest;
const R = eng.window.__rivalTest;
const baseStats = R.baseStats;
const gradeOf = (n) => R.getMonGrade(n, R.getBST(n));
const typesOf = (n) => { const b = baseStats[n] || {}; return [b.t1, b.t2].filter(Boolean); };

// Gen-1 species count by single type, split by grade — "how many filler options exist".
function gen1TypePool(type) {
  const byG = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const n of Object.keys(baseStats)) {
    const b = baseStats[n]; if (!b || b.gen !== 1 || b.legendary) continue;
    if (typesOf(n).includes(type)) { const g = gradeOf(n); if (byG[g] != null) byG[g]++; }
  }
  return byG;
}

const hits = new Map(); // `${trainer}|${type}|${event}` -> count
for (let i = 0; i < N; i++) {
  const res = S.simulateStoryRunTeams({ seed: (2000 + i) >>> 0, enabledGens: [1], difficulty: 'normal', partySize: 6, mechanics: {} });
  if (res.error) continue;
  for (const row of res.rows) {
    if (String(row.trainerType || '').includes('Normal')) continue;
    for (const slot of (row.team || [])) {
      if (slot.name === 'Rattata') {
        const k = `${row.trainer}|${row.trainerType}|${row.eventName}`;
        hits.set(k, (hits.get(k) || 0) + 1);
      }
    }
  }
}

const rows = [...hits.entries()].sort((a, b) => b[1] - a[1]);
console.log(`Gen-1-only Rattata on non-Normal trainers across ${N} seeds: ${rows.length} distinct (trainer,type,event)`);
console.log('count | trainer | declared type | event | gen-1 pool for primary type (G1/G2/G3/G4)');
const typePool = new Map();
for (const [k, c] of rows.slice(0, 40)) {
  const [trainer, type, event] = k.split('|');
  const primary = String(type).split('/')[0];
  if (!typePool.has(primary)) typePool.set(primary, gen1TypePool(primary));
  const p = typePool.get(primary);
  console.log(`${String(c).padStart(4)} | ${trainer} | ${type} | ${event} | ${p[1]}/${p[2]}/${p[3]}/${p[4]}`);
}
// summarize by declared primary type
const byType = new Map();
for (const [k, c] of rows) { const t = String(k.split('|')[1]).split('/')[0]; byType.set(t, (byType.get(t) || 0) + c); }
console.log('\nTotal Rattata-fallback occurrences by declared primary type:');
for (const [t, c] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  const p = typePool.get(t) || gen1TypePool(t);
  console.log(`  ${t.padEnd(9)} ${String(c).padStart(4)}   (gen-1 pool G1/G2/G3/G4 = ${p[1]}/${p[2]}/${p[3]}/${p[4]})`);
}
process.exit(0);
