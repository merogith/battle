// Trace differ for the differential battle harness.
//
// Compares an in-house trace against the Showdown reference trace (both in the
// normalized shape produced by the two oracle modules) and emits a list of
// divergences, each tagged with a confidence so the report can lead with the
// RNG-robust, high-signal findings.
//
// Confidence model (two engines have independent PRNG streams, so we cannot
// compare exact damage rolls / secondary procs across them):
//   high   - boosts, faint state, winner, charge/invulnerable behaviour.
//            RNG-independent for well-chosen scenarios; these are real bugs.
//   medium - status presence (could be a chance-secondary that simply rolled
//            differently; flagged but not treated as proof on its own).
//   low    - raw HP (damage-roll variance); only surfaced when the gap exceeds
//            the legitimate 85-100% roll band.

const BOOST_STATS = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];

// Legit cross-engine HP gap from the damage roll alone is up to 100/85 ≈ 1.176.
// Flag only when the in-house damage falls outside [showdown*0.80, showdown*1.20]
// (plus a small absolute floor for tiny hits).
const HP_REL_TOL = 0.20;
const HP_ABS_TOL = 3;

function hpFrac(snap) {
  if (!snap || snap.hp == null || !snap.maxhp) return null;
  return snap.hp / snap.maxhp;
}

export function diffTraces(showdown, inhouse, scenario = {}) {
  const divergences = [];
  const add = (d) => divergences.push(d);

  const nTurns = Math.min(showdown.turns.length, inhouse.turns.length);

  for (let i = 0; i < nTurns; i++) {
    const sT = showdown.turns[i];
    const hT = inhouse.turns[i];
    if (!sT?.end || !hT?.end) continue;

    for (const slot of ['p1a', 'p2a']) {
      const s = sT.end[slot];
      const h = hT.end[slot];
      if (!s || !h) continue;

      // --- boosts (HIGH) ---
      for (const stat of BOOST_STATS) {
        const sv = s.boosts[stat] || 0;
        const hv = h.boosts[stat] || 0;
        if (sv !== hv) {
          add({ turn: sT.n, slot, field: `boost.${stat}`, showdown: sv, inhouse: hv, confidence: 'high' });
        }
      }

      // --- faint state (HIGH) ---
      const sFnt = !!s.fainted || s.hp === 0;
      const hFnt = !!h.fainted || h.hp === 0;
      if (sFnt !== hFnt) {
        add({ turn: sT.n, slot, field: 'fainted', showdown: sFnt, inhouse: hFnt, confidence: 'high' });
      }

      // --- status (MEDIUM: may be a chance-secondary divergence) ---
      if ((s.status || '') !== (h.status || '')) {
        add({
          turn: sT.n, slot, field: 'status', showdown: s.status || '(none)', inhouse: h.status || '(none)',
          confidence: scenario.guaranteedStatus ? 'high' : 'medium',
        });
      }

      // --- HP / damage ---
      // Two engines roll independently, so a gap inside the 85-100% band (×1.18)
      // is expected. Beyond that we flag, escalating by how far past the band:
      //   both sides damaged but amounts differ by >2.2× -> almost certainly a
      //     type-effectiveness / immunity / formula bug (HIGH).
      //   one side took 0 (a hit-vs-miss difference) -> accuracy RNG (LOW).
      //   otherwise (crit / minor modifier / item) -> LOW.
      const sf = hpFrac(s);
      const hf = hpFrac(h);
      if (sf != null && hf != null && !sFnt && !hFnt) {
        const sDmg = Math.round((s.maxhp || 0) * (1 - sf));
        const hDmg = Math.round((h.maxhp || 0) * (1 - hf));
        const gap = Math.abs(sDmg - hDmg);
        if (gap > HP_ABS_TOL && gap > HP_REL_TOL * Math.max(sDmg, hDmg)) {
          let confidence = 'low';
          let note = 'beyond the 85-100% roll band';
          if (sDmg > 0 && hDmg > 0) {
            const ratio = Math.max(sDmg, hDmg) / Math.min(sDmg, hDmg);
            if (ratio > 2.2) { confidence = 'high'; note = `damage differs ×${ratio.toFixed(1)} — likely type/effectiveness/formula`; }
          }
          add({
            turn: sT.n, slot, field: 'hp/damage',
            showdown: `${s.hp}/${s.maxhp} (dmg~${sDmg})`, inhouse: `${h.hp}/${h.maxhp} (dmg~${hDmg})`,
            confidence, note,
          });
        }
      }
    }
  }

  // --- winner (HIGH) ---
  if (showdown.winner !== inhouse.winner) {
    add({ turn: '-', slot: '-', field: 'winner', showdown: showdown.winner, inhouse: inhouse.winner, confidence: 'high' });
  }

  // --- engine threw (HIGH) ---
  const threw = inhouse.turns.find(t => t.threw);
  if (threw) add({ turn: threw.n, slot: '-', field: 'engine-threw', showdown: '(ok)', inhouse: threw.logs.join(' '), confidence: 'high' });

  const byConf = (c) => divergences.filter(d => d.confidence === c).length;
  return {
    divergences,
    counts: { high: byConf('high'), medium: byConf('medium'), low: byConf('low'), total: divergences.length },
    turnsCompared: nTurns,
  };
}
