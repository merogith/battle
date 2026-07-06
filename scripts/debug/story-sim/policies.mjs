// Player-Agent policies for the Story Simulator (§2.4a of the strategy doc).
//
// Three investment levels of ONE shared prep->fight->adapt agent. Every difficulty statement
// then has a floor (casual), an intended path (recommended), and a ceiling (optimal). These are
// pure config consumed by the agent's prep/train/catch/adapt loop — no engine coupling here.
//
// Weights are relative priorities inside the gold budget; `reserveFrac` is the fraction of gold
// the policy refuses to spend (a buffer). `catch.*` drive coverage catching. `train.*` drive the
// EV/tutor/evolution investment. `adapt.retries` caps re-prep loops after a loss.

export const POLICIES = {
  // Lower bound on investment: starter + tutorial partner, minimal shopping, evolve only when
  // free/forced, no EV training, no tutor moves, rarely catches. "Can a low-effort player clear?"
  casual: {
    id: 'casual',
    playerSkill: 'hard', // battle skill is held constant across policies; only PREP differs
    reserveFrac: 0.5,
    train: {
      evTrain: false, tutorMoves: false, buyVitamins: false,
      evolve: 'freeOnly',          // only evolutions with no gold cost / auto
      buyHealItems: 'minimal',     // a few potions
      useGimmicks: true,           // gimmicks are free once unlocked; a casual player still taps them
      evTargetFrac: 0.0,           // fraction of the city EV band to aim for
    },
    catch: { mode: 'rare', coverageOnly: false, safariTrips: 0, ballBudgetFrac: 0.0 },
    adapt: { retries: 1, reprepOnLoss: false },
  },

  // The intended path: follows the game's own recommenders (EV presets via _evTrainerRecPreset,
  // tutor recommender, evolve on schedule), spends gold roughly as the economy expects.
  // "Is the designed path smooth?" — the primary balance signal.
  recommended: {
    id: 'recommended',
    playerSkill: 'hard',
    reserveFrac: 0.2,
    train: {
      evTrain: true, tutorMoves: true, buyVitamins: true,
      evolve: 'onSchedule',        // evolve when affordable and stage-appropriate
      buyHealItems: 'standard',
      useGimmicks: true,
      evTargetFrac: 0.75,          // aim for ~3/4 of the city EV band (recommended presets)
    },
    catch: { mode: 'opportunistic', coverageOnly: true, safariTrips: 1, ballBudgetFrac: 0.1 },
    adapt: { retries: 2, reprepOnLoss: true },
  },

  // Upper bound on investment: best builds, evolve ASAP, strongest legal moves per city cap,
  // max EV/IV within the city band, chases coverage catches + the villain-track legendary.
  // "Is it too hard even for a tryhard?"
  optimal: {
    id: 'optimal',
    playerSkill: 'hard',
    reserveFrac: 0.05,
    train: {
      evTrain: true, tutorMoves: true, buyVitamins: true,
      evolve: 'asap',
      buyHealItems: 'stocked',
      useGimmicks: true,
      evTargetFrac: 1.0,           // full city EV band
    },
    catch: { mode: 'aggressive', coverageOnly: false, safariTrips: 2, ballBudgetFrac: 0.25 },
    adapt: { retries: 3, reprepOnLoss: true },
  },
};

export const POLICY_IDS = Object.keys(POLICIES);

export function getPolicy(id) {
  const p = POLICIES[id];
  if (!p) throw new Error(`unknown policy: ${id} (have ${POLICY_IDS.join(', ')})`);
  return p;
}
