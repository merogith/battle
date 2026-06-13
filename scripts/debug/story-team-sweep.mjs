// Story-mode enemy-team sweep REPORT generator.
//
// Walks the entire story timeline (every Battle row) through the real assignTrainers +
// rollTrainerTeam pipeline — via the headless _simulateStoryRunTeams engine — across several
// generation-lock settings, and writes a human-readable markdown report of EVERY stage's enemy
// team plus a "design observations" digest (legendaries, eldritch gen-bypass, gym-trainer type
// coherence, grade progression, duplicates, fallback-sentinel leaks).
//
// This is a DIAGNOSTIC, not a test — the hard invariants are asserted in
// tests/suites/story-timeline-invariants.test.js. Use this to eyeball balance / variety / theme.
//
// Run:  node --max-old-space-size=4096 scripts/debug/story-team-sweep.mjs [seed]
// Out:  agent-state/story-team-sweep.md   (and a short digest to stdout)

import { loadEngine } from '../../tests/helpers/load-engine.js';
import fs from 'fs';

const SEED = (process.argv[2] && /^\d+$/.test(process.argv[2])) ? (parseInt(process.argv[2], 10) >>> 0) : 12345;
const GEN_SETTINGS = [
  { label: 'ALL GENS', gens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { label: 'GEN 1 ONLY', gens: [1] },
  { label: 'GEN 3 ONLY', gens: [3] },
  { label: 'GEN 5 ONLY', gens: [5] },
  { label: 'GEN 9 ONLY', gens: [9] },
  { label: 'GEN 1+2 (Johto-era)', gens: [1, 2] },
];

const eng = await loadEngine();
const S = eng.window.__storyTest;
const R = eng.window.__rivalTest;
const baseStats = R.baseStats;
const grade = (n) => R.getMonGrade(n, R.getBST(n));
const genOf = (n) => baseStats[n] ? baseStats[n].gen : '?';
const isLeg = (n) => !!(baseStats[n] && baseStats[n].legendary);
const typesOf = (n) => { const b = baseStats[n] || {}; return [b.t1, b.t2].filter(Boolean); };

const TRAINER_BY_NAME = new Map();
for (const t of R.TRAINER_DATA) {
  if (!t || !t.name) continue;
  const cur = TRAINER_BY_NAME.get(t.name) || { tags: new Set(), sigs: new Set() };
  if (t.tag) cur.tags.add(t.tag);
  for (const s of (t.sigs || [])) cur.sigs.add(s);
  TRAINER_BY_NAME.set(t.name, cur);
}
const tagOf = (name) => { const e = TRAINER_BY_NAME.get(name); return e && e.tags.size ? [...e.tags].join(',') : ''; };
const isEldritch = (name) => { const e = TRAINER_BY_NAME.get(name); return !!(e && e.tags.has('eldritch')); };
const authored = (name, mon) => { const e = TRAINER_BY_NAME.get(name); return !!(e && e.sigs.has(mon)); };

const out = [];
const digest = { legendaries: [], eldritchOffGen: [], dups: [], rattataLeak: [], shortTeams: [], cityGrade: {} };

out.push(`# Story-mode enemy-team sweep — seed ${SEED}`);
out.push(`Generated ${new Date().toISOString()} · normal difficulty · party size 6\n`);

for (const setting of GEN_SETTINGS) {
  const res = S.simulateStoryRunTeams({ seed: SEED, enabledGens: setting.gens, difficulty: 'normal', partySize: 6 });
  out.push(`\n## ${setting.label}  (gens ${setting.gens.join(',')})`);
  if (res.error) { out.push(`> ERROR: ${res.error}`); continue; }
  out.push(`${res.rows.length} battles\n`);
  for (const r of res.rows) {
    const tg = tagOf(r.trainer);
    const head = `**#${r.eid} · ${r.eventName}** — ${r.trainer}${tg ? ` _(${tg})_` : ''} · ${r.trainerType} · city ${r.cityIndex} · badges ${r.badges}`;
    const mons = (r.team || []).map(s => {
      const n = s.name;
      const flags = [];
      if (isLeg(n)) flags.push(authored(r.trainer, n) ? 'LEG·ace' : 'LEG·FILLER');
      const gm = s.build && s.build.gimmick && s.build.gimmick !== 'STANDARD' ? s.build.gimmick : '';
      if (gm) flags.push(gm);
      return `${n}·G${grade(n)}·g${genOf(n)}${flags.length ? `·${flags.join('·')}` : ''}`;
    });
    out.push(`- ${head}\n  - ${mons.join('  |  ')}`);

    // ---- digest collection (use ALL-GENS + single-gen runs alike) ----
    const teamNames = (r.team || []).map(s => s.name);
    // legendaries on non-E4/Champion (note authored vs filler)
    const topTier = /^E[1-4]$/.test(r.eventName) || r.eventName === 'Champion' || r.eventName === 'Mystery Figure';
    for (const n of teamNames) {
      if (isLeg(n) && !topTier) {
        // Classify: eldritch trainers + authored aces are intended; anything else is a real leak.
        const kind = isEldritch(r.trainer) ? '(eldritch — intended)' : authored(r.trainer, n) ? '(authored ace)' : '(FILLER LEAK!)';
        digest.legendaries.push(`[${setting.label}] ${r.eventName} ${r.trainer}: ${n} ${kind}`);
      }
      if (!setting.gens.includes(genOf(n)) && isEldritch(r.trainer)) digest.eldritchOffGen.push(`[${setting.label}] ${r.trainer}: ${n} (gen ${genOf(n)})`);
    }
    // duplicates not explained by authored multiset
    const counts = {};
    for (const n of teamNames) counts[n] = (counts[n] || 0) + 1;
    for (const [n, c] of Object.entries(counts)) if (c > 1 && !authored(r.trainer, n)) digest.dups.push(`[${setting.label}] ${r.eventName} ${r.trainer}: ${n} ×${c}`);
    // Rattata sentinel on a non-Normal trainer = pool exhaustion
    if (teamNames.includes('Rattata') && !String(r.trainerType).includes('Normal')) digest.rattataLeak.push(`[${setting.label}] ${r.eventName} ${r.trainer} (${r.trainerType})`);
    if ((r.team || []).length !== r.partySize) digest.shortTeams.push(`[${setting.label}] ${r.eventName} ${r.trainer}: ${r.team ? r.team.length : 0}/${r.partySize}`);
    // grade progression (ALL-GENS only, to avoid narrow-pool skew)
    if (setting.label === 'ALL GENS' && /Gym Leader|Basic Trainer|Gym Trainer|Elite Trainer|Rival/.test(r.eventName)) {
      const avg = teamNames.reduce((a, n) => a + grade(n), 0) / Math.max(1, teamNames.length);
      (digest.cityGrade[r.cityIndex] = digest.cityGrade[r.cityIndex] || []).push(avg);
    }
  }
}

// ---- digest section ----
out.push(`\n\n# Design observations digest`);
const dedup = (a) => [...new Set(a)];
out.push(`\n## Legendaries on non-E4/Champion trainers`);
out.push(dedup(digest.legendaries).length ? dedup(digest.legendaries).map(x => `- ${x}`).join('\n') : '- none');
out.push(`\n## Eldritch trainers fielding off-gen mons (intended "out of this world", but ignores the player's gen lock)`);
out.push(dedup(digest.eldritchOffGen).length ? dedup(digest.eldritchOffGen).slice(0, 40).map(x => `- ${x}`).join('\n') : '- none');
out.push(`\n## Unexpected duplicate species (not an authored multiset like Lance's Dragonites)`);
out.push(dedup(digest.dups).length ? dedup(digest.dups).map(x => `- ${x}`).join('\n') : '- none');
out.push(`\n## Fallback-sentinel (Rattata on a non-Normal trainer = pool exhaustion)`);
out.push(dedup(digest.rattataLeak).length ? dedup(digest.rattataLeak).map(x => `- ${x}`).join('\n') : '- none');
out.push(`\n## Short / empty teams`);
out.push(dedup(digest.shortTeams).length ? dedup(digest.shortTeams).map(x => `- ${x}`).join('\n') : '- none');
out.push(`\n## Grade progression by city (ALL-GENS, avg team grade — should trend toward G1 as city rises)`);
for (const c of Object.keys(digest.cityGrade).sort((a, b) => a - b)) {
  const arr = digest.cityGrade[c];
  const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  out.push(`- city ${c}: avg G${avg}  (${arr.length} teams)`);
}

fs.mkdirSync('agent-state', { recursive: true });
fs.writeFileSync('agent-state/story-team-sweep.md', out.join('\n') + '\n');

// stdout digest
console.log('SWEEP DONE → agent-state/story-team-sweep.md');
console.log('legendaries(non-E4/Champ):', dedup(digest.legendaries).length, '| eldritch off-gen:', dedup(digest.eldritchOffGen).length, '| dups:', dedup(digest.dups).length, '| rattata-leak:', dedup(digest.rattataLeak).length, '| short-teams:', dedup(digest.shortTeams).length);
const fillerLeaks = dedup(digest.legendaries).filter(x => x.includes('FILLER LEAK'));
console.log('FILLER legendary leaks (bugs):', fillerLeaks.length, fillerLeaks.slice(0, 10).join(' ;; '));
