import { ArenaSimulation, ArenaTeamError } from './arena-simulation.mjs';

let match;
let epoch = 0;
self.addEventListener('message', ({ data }) => {
  const { id, method, payload } = data || {};
  if (!Number.isSafeInteger(id) || id < 1) return;
  try {
    if (method === 'start') {
      match = new ArenaSimulation(payload?.seed, ++epoch, payload?.format, payload?.teamText, payload?.teamSize);
      self.postMessage({ id, view: match.view() });
      return;
    }
    if (method === 'choose' && match) {
      self.postMessage({ id, view: match.choose(payload) });
      return;
    }
    self.postMessage({ id, error: 'Start a local match first.' });
  } catch (error) {
    self.postMessage({ id, error: error.message || 'The simulator could not continue this match.', invalidTeam: error instanceof ArenaTeamError });
  }
});
