export class ArenaBattleClient {
  constructor() {
    this.worker = null;
    this.nextId = 0;
    this.pending = new Map();
  }

  start(options) { return this.send('start', options); }
  choose(action) { return this.send('choose', action); }

  send(method, payload) {
    this.worker ||= this.createWorker();
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.close(new Error('The battle engine did not respond. Start a new match to retry.'));
      }, 25000);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.worker.postMessage({ id, method, payload });
      } catch (error) {
        this.close(error);
      }
    });
  }

  createWorker() {
    const worker = new Worker(new URL('./showdown-worker.js', import.meta.url), { type: 'module', name: 'arena-showdown' });
    worker.addEventListener('message', ({ data }) => {
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
    worker.addEventListener('error', () => {
      this.close(new Error('Could not load the Showdown engine. Connect once or download the full offline game.'));
    });
    worker.addEventListener('messageerror', () => {
      this.close(new Error('The battle engine sent an unreadable response.'));
    });
    return worker;
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
