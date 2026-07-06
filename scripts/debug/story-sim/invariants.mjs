// Invariant assertions for a Story-Sim run record (Phase 7).
//
// The simulator exercises the real onBattleEnd/gate/save code across 67 rows x thousands of
// seeds, so it doubles as a bug-finder. checkRun() returns a list of violations; the run loop
// and the committed test both consume it. Violations are candidates for the ISSUE_LEDGER
// (via the emit-finding skill) — the sim reports them, the maintainer triages.

// Party-cap curve (mirror of _storyMaxPartySize): max(2, min(6, 2+badges)).
function maxParty(badges) { return Math.max(2, Math.min(6, 2 + (badges | 0))); }

const TERMINALS = /^(hof|failed@\d+|stall@\d+)$/;

// Check one run record. Returns [{ code, detail }].
export function checkRun(rec) {
  const v = [];
  const push = (code, detail) => v.push({ code, detail, seed: rec.seed, policy: rec.policy, difficulty: rec.difficulty, itemMode: rec.itemMode });

  if (!TERMINALS.test(rec.outcome)) push('bad-terminal', `outcome '${rec.outcome}' not a known terminal`);
  if ((rec.badges | 0) < 0 || (rec.badges | 0) > 8) push('badges-range', `badges ${rec.badges} out of [0,8]`);
  if ((rec.gold | 0) < 0) push('gold-negative', `final gold ${rec.gold} < 0`);

  const battles = (rec.stages || []).filter(s => s.kind === 'battle');
  let prevBadges = -1, prevPos = -1;
  for (const s of battles) {
    // eventIndex/pos monotonic non-decreasing.
    if (s.pos < prevPos) push('pos-regression', `pos ${s.pos} after ${prevPos}`);
    prevPos = s.pos;
    // badges monotonic non-decreasing.
    if (s.badgesBefore < prevBadges) push('badges-regression', `badgesBefore ${s.badgesBefore} after ${prevBadges} at pos ${s.pos}`);
    prevBadges = s.badgesBefore;
    // party cap respected.
    if (s.playerSize > maxParty(s.badgesBefore)) push('party-over-cap', `pos ${s.pos}: player ${s.playerSize} > cap ${maxParty(s.badgesBefore)} at ${s.badgesBefore} badges`);
    // foe size sane.
    if (s.foeSize < 1 || s.foeSize > 6) push('foe-size', `pos ${s.pos}: foe size ${s.foeSize}`);
    // non-empty, positive-power teams.
    if (!(s.pPower > 0)) push('player-power-zero', `pos ${s.pos}: pPower ${s.pPower}`);
    if (!(s.fPower > 0)) push('foe-power-zero', `pos ${s.pos}: fPower ${s.fPower}`);
    // foe stat multiplier positive.
    if (!(s.foeMult > 0)) push('foe-mult', `pos ${s.pos}: foeMult ${s.foeMult}`);
    // gold never negative mid-run.
    if (s.goldAfter < 0) push('gold-negative-mid', `pos ${s.pos}: goldAfter ${s.goldAfter}`);
    // engine threw during resolution — a real correctness bug.
    if (s.threw) push('engine-threw', `pos ${s.pos}: ${s.threw}`);
    // NOTE: a battle stall (s.stalled) is an AI/matchup signal (the 1-ply AI can't break an
    // unwinnable wall), not a correctness violation — the resolver caps it gracefully. Stalls are
    // recorded on the stage and surfaced as an aggregate stall-rate metric by analyze.mjs, not
    // flagged here.
  }

  // Won every battle up to the failure point (the run ends on first unrecovered loss).
  const firstLoss = battles.findIndex(s => !s.won);
  if (firstLoss >= 0 && firstLoss < battles.length - 1)
    push('continued-after-loss', `lost at stage ${firstLoss} (pos ${battles[firstLoss].pos}) but ran ${battles.length - 1 - firstLoss} more battles`);

  return v;
}

// Two run records from the same inputs must be byte-identical on the gameplay signature.
export function checkDeterminism(a, b) {
  const sig = (r) => JSON.stringify({
    outcome: r.outcome, reachedPos: r.reachedPos, badges: r.badges, gold: r.gold,
    team: r.finalTeam, wins: r.wins,
    stages: (r.stages || []).filter(s => s.kind === 'battle').map(s => [s.pos, s.won, s.turns, s.pFaints, s.fFaints, s.goldAwarded]),
  });
  return sig(a) === sig(b) ? [] : [{ code: 'nondeterministic', detail: `same inputs produced different results (seed ${a.seed})` }];
}
