export class ArenaBattleClient {
  constructor(onMatchLost) {
    this.worker = null;
    this.nextId = 0;
    this.pending = new Map();
    this.onMatchLost = onMatchLost;
  }

  start(options) {
    this.worker ||= this.createWorker();
    return this.send('start', options);
  }

  choose(action) { return this.send('choose', action); }

  send(method, payload) {
    if (!this.worker) return Promise.reject(new Error('The battle engine stopped. Start a new match to retry.'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.loseMatch(new Error('The battle engine did not respond. Start a new match to retry.'));
      }, 25000);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.worker.postMessage({ id, method, payload });
      } catch (error) {
        this.loseMatch(error);
      }
    });
  }

  createWorker() {
    const worker = new Worker(new URL('./showdown-worker.js', import.meta.url), { type: 'module', name: 'arena-showdown' });
    worker.addEventListener('message', ({ data }) => {
      if (this.worker !== worker) return;
      const waiting = this.pending.get(data?.id);
      if (!waiting) return;
      this.pending.delete(data.id);
      clearTimeout(waiting.timer);
      if (data.error) {
        const error = new Error(data.error);
        error.invalidTeam = Boolean(data.invalidTeam);
        waiting.reject(error);
      }
      else waiting.resolve(data.view);
    });
    worker.addEventListener('error', event => {
      event.preventDefault();
      if (this.worker === worker) this.loseMatch(new Error('The Showdown engine stopped. Check your connection or try using the full offline game.'));
    });
    worker.addEventListener('messageerror', () => {
      if (this.worker === worker) this.loseMatch(new Error('The battle engine sent an unreadable response. Start a new match to retry.'));
    });
    return worker;
  }

  loseMatch(error) {
    this.close(error);
    this.onMatchLost?.(error);
  }

  close(error = new Error('The match was closed.')) {
    this.worker?.terminate();
    this.worker = null;
    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    this.pending.clear();
  }
}
