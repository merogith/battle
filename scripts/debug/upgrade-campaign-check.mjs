// A small reproducible campaign diagnostic, not a player win-rate estimate.
import { writeFileSync } from 'node:fs';
import { loadEngine } from '../../tests/helpers/load-engine.js';
import { runStory } from './story-sim/story-run.mjs';
import { checkRun } from './story-sim/invariants.mjs';
const E=await loadEngine(),runs=[];
try {
  for(const policy of ['casual','recommended','optimal'])for(const seed of [1,2]) {
    const run=await runStory(E,{seed,policy,difficulty:'normal',itemMode:'off'});
    run.invariantViolations=checkRun(run);runs.push(run);
    console.log(JSON.stringify({policy,seed,outcome:run.outcome,badges:run.badges,battles:run.battles,gold:run.gold,violations:run.invariantViolations.length}));
  }
  writeFileSync(new URL('../../docs/review-evidence-2026-09-12/implementation-campaign-check.json',import.meta.url),JSON.stringify({
    description:'Six diagnostic runs with corrected preparation and retries. Small sample; optional rewards and capture acquisition remain approximations.',runs,
  },null,2)+'\n');
  if(runs.some(r=>r.invariantViolations.length))process.exitCode=1;
} finally { E.teardown(); }
