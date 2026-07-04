// Boots battle.html headlessly via jsdom and returns engine handles for tests.
// Keep ONE instance per test file - jsdom boot is expensive (~5s with 36k LOC script).

import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import jsdomPkg from 'jsdom';
const { JSDOM } = jsdomPkg;
import { seedRng, installMathRandom, nextFloat } from './seeded-rng.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const BATTLE_HTML_PATH = join(ROOT, 'battle.html');

let _cachedEngine = null;

function stripExternalScripts(html) {
  // Remove every <script src="..."></script> with absolute URL. Inline scripts and
  // local src are preserved (online-config.js etc. are local but we replace those too
  // since they may make network calls).
  return html
    .replace(/<script\s+[^>]*src=["']https?:\/\/[^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']online-[^"']+\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']move-(sfx|anim)-map\.js["'][^>]*>\s*<\/script>/gi, '');
}

function makeFetchStub() {
  // Engine fetches data/*.json and data/builds.csv during loadGameData.
  // External hosts (data.pkmn.cc) are caught with try/error in the engine, so we reject.
  return async function fetchStub(url) {
    const u = String(url || '');
    if (/^https?:\/\//.test(u)) {
      return { ok: false, status: 599, text: async () => '', json: async () => ({}) };
    }
    // Strip leading slash if present
    const rel = u.replace(/^\.?\/?/, '');
    const filePath = join(ROOT, rel);
    if (!existsSync(filePath)) {
      return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
    }
    const body = readFileSync(filePath, 'utf8');
    return {
      ok: true,
      status: 200,
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  };
}

export async function loadEngine() {
  if (_cachedEngine) return _cachedEngine;

  const html = await readFile(BATTLE_HTML_PATH, 'utf8');
  const stripped = stripExternalScripts(html);

  const logs = [];

  const dom = new JSDOM(stripped, {
    url: `file://${BATTLE_HTML_PATH}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      // Mark the test harness so the bottom-of-script hook exposes window.__engine.
      window.__testHarness = true;

      // Seed RNG before any script runs.
      seedRng(0);
      installMathRandom(window);

      // Fetch stub (replaces the lookup the engine does).
      window.fetch = makeFetchStub();

      // Stub canvas - jsdom doesn't render but engine code may call getContext.
      const origGetContext = window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext = function () {
        return {
          fillRect: () => {}, clearRect: () => {}, getImageData: () => ({ data: [] }),
          putImageData: () => {}, createImageData: () => ({ data: [] }),
          setTransform: () => {}, drawImage: () => {}, save: () => {},
          fillText: () => {}, restore: () => {}, beginPath: () => {},
          moveTo: () => {}, lineTo: () => {}, closePath: () => {},
          stroke: () => {}, translate: () => {}, scale: () => {},
          rotate: () => {}, arc: () => {}, fill: () => {}, measureText: () => ({ width: 0 }),
          transform: () => {}, rect: () => {}, clip: () => {},
        };
      };

      // Stub media playback - engine inits AudioSystem at boot.
      window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      window.HTMLMediaElement.prototype.pause = function () {};

      // Stub anime.js (engine references window.anime + anime.stagger / .set / .remove / .timeline).
      const _animeFn = () => {
        const inst = {
          finished: Promise.resolve(), pause: () => {}, restart: () => {},
          play: () => {}, reverse: () => {}, seek: () => {}, add: () => inst,
        };
        return inst;
      };
      _animeFn.set = () => {};
      _animeFn.remove = () => {};
      _animeFn.running = [];
      _animeFn.stagger = (v) => v;
      _animeFn.timeline = () => ({ add: () => ({ add: () => ({}), finished: Promise.resolve() }), finished: Promise.resolve(), pause: () => {} });
      _animeFn.random = (a, b) => a;
      _animeFn.path = () => () => 0;
      _animeFn.setDashoffset = () => 0;
      _animeFn.bezier = () => () => 0;
      _animeFn.easings = {};
      _animeFn.suspendWhenDocumentHidden = false;
      window.anime = _animeFn;

      // Stub supabase (loaded externally; tests never use it).
      window.supabase = {
        createClient: () => ({
          from: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ data: [], error: null }),
            update: () => Promise.resolve({ data: [], error: null }),
          }),
          auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
        }),
      };

      // Stub service worker registration
      if (!window.navigator.serviceWorker) {
        Object.defineProperty(window.navigator, 'serviceWorker', {
          value: {
            register: () => Promise.resolve({ update: () => {} }),
            ready: Promise.resolve({}),
            addEventListener: () => {},
          },
          configurable: true,
        });
      }

      // Engine references AudioContext / matchMedia / various Web APIs; jsdom has most.
      if (!window.matchMedia) {
        window.matchMedia = () => ({
          matches: false, addEventListener: () => {}, removeEventListener: () => {},
          addListener: () => {}, removeListener: () => {},
        });
      }

      // Engine may call requestAnimationFrame. Route the shim through
      // window.setTimeout (jsdom-owned), NOT Node's global setTimeout: a
      // self-rescheduling RAF loop (e.g. a camp microgame render loop) on
      // Node timers survives window.close() and keeps `node --test` alive
      // forever after the suite finishes.
      window.requestAnimationFrame = (cb) => window.setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) => window.clearTimeout(id);

      // Suppress noisy console output from engine init
      const _origWarn = window.console.warn;
      const _origError = window.console.error;
      window.console.warn = (...args) => {
        if (process.env.TEST_VERBOSE) _origWarn.apply(window.console, args);
      };
      window.console.error = (...args) => {
        if (process.env.TEST_VERBOSE) _origError.apply(window.console, args);
      };

      // Engine error handlers must not crash the harness
      window.onerror = (msg, src, line, col, err) => {
        if (process.env.TEST_VERBOSE) console.error('[engine onerror]', msg, src, line, col);
        return true;
      };

      // Stub @pkmn/dex - engine guards every Dex.* lookup with try/catch, so a minimal shape suffices.
      window.pkmn = {
        dex: {
          Dex: {
            species: { get: () => null },
            moves: { get: () => null },
            learnsets: { get: async () => null },
            data: {},
          },
        },
      };

      // The engine loads @pkmn/dex by appending <script src="https://cdn..."> and gates loadGameData
      // on the load/error of those tags. Intercept createElement('script') so external src
      // fires onerror immediately, unblocking _dexReady.
      const origCreate = window.document.createElement.bind(window.document);
      window.document.createElement = function (tag, ...rest) {
        const el = origCreate(tag, ...rest);
        if (String(tag).toLowerCase() === 'script') {
          Object.defineProperty(el, 'src', {
            configurable: true,
            set(v) {
              this.setAttribute('src', v);
              // External CDN scripts AND the vendored @pkmn/dex bundles (vendor/*.js) are loaded
              // by appending a <script> and gating _dexReady on load/error. jsdom won't execute
              // them, so fire onerror immediately to unblock the gate (the engine guards every
              // Dex.* lookup, and window.pkmn is stubbed above).
              if (/^https?:\/\//.test(v) || /(^|\/)vendor\//.test(v)) {
                setTimeout(() => {
                  if (typeof this.onerror === 'function') this.onerror(new Error('test stub'));
                }, 0);
              }
            },
            get() { return this.getAttribute('src'); },
          });
        }
        return el;
      };

      // Capture engine console output via VirtualConsole if TEST_VERBOSE is set.
      // (jsdom passes window.console through; we suppressed warn/error above.)
    },
  });

  const window = dom.window;

  // Wait for the test-ready promise the harness hook exposed
  if (!window.__testReady) {
    throw new Error('battle.html did not expose __testReady - check that __testHarness was set before parse');
  }
  const engine = await window.__testReady;

  // After load: patch sleep to no-op so async battle code runs immediately
  window.sleep = () => Promise.resolve();

  // Capture logs for test assertions
  const origLogMsg = window.logMsg;
  window.logMsg = (text, channel = 'info') => {
    logs.push({ text, channel });
    return undefined;
  };

  // Stub AI / story-mode helpers so playTurn picks predictable foe actions.
  // Tests override these per-test via the engine.setForeMove / setForeAction helpers below.
  let _forcedFoeMoveSlot = 0;
  window.aiDecision = () => null;
  window.getBestMove = (foeMon /*, playerMon */) => {
    if (!foeMon || !Array.isArray(foeMon.moves)) return null;
    return foeMon.moves[_forcedFoeMoveSlot] || foeMon.moves[0];
  };
  window.aiChooseGimmick = () => null;
  window.tryFoeStoryBattleItem = () => false;
  // Engine references settings global for animation toggles, story flags, etc.
  if (!window.settings) {
    window.settings = {
      animations: false,
      storyBattleItems: false,
      moveSfx: false,
      catchAnims: false,
    };
  } else {
    window.settings.animations = false;
    window.settings.moveSfx = false;
  }

  // Reasonable damage-dummy partners: Splash slot index. Tests can override.
  engine.setForcedFoeMoveSlot = (idx) => { _forcedFoeMoveSlot = idx; };

  function reset() {
    logs.length = 0;
    seedRng(0);
    // Re-init battle state - mirrors the let state = {...} declaration at battle.html:12557.
    engine.state = {
      mode: 'pve', draftTurn: 1, score: 0,
      p1Pool: [], p2Pool: [], p1Draft: [], p2Draft: [],
      playerParty: [], foeParty: [],
      pActive: null, fActive: null,
      isOver: false, isLocked: false,
      weather: null, weatherTurns: 0, fieldLastMove: null,
      pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 },
      fSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 },
      currentPlayer: 1, p1Action: null, p2Action: null, turnNumber: 0,
    };
  }

  // Drive a single turn: player uses moves[playerMoveSlot], foe uses moves[foeMoveSlot].
  // Returns the captured log entries for this turn.
  async function runTurn({
    playerMon,
    foeMon,
    playerMoveSlot = 0,
    foeMoveSlot = 0,
    forcePlayerFast = true,
  } = {}) {
    if (!playerMon || !foeMon) throw new Error('runTurn: playerMon and foeMon required');
    reset();
    engine.state.pActive = playerMon;
    engine.state.fActive = foeMon;
    engine.state.playerParty = [playerMon];
    engine.state.foeParty = [foeMon];
    engine.state.mode = 'pve';
    engine.state.turnNumber = 0;
    engine.state.isOver = false;
    engine.state.isLocked = false;
    if (forcePlayerFast) {
      // Pin order: player always moves first. Useful for damage tests that don't want
      // the foe to attack/get a status off before our move resolves.
      playerMon.stats.spe = Math.max(playerMon.stats.spe || 0, 999);
    }
    engine.setForcedFoeMoveSlot(foeMoveSlot);
    const startLog = logs.length;
    await window.playTurn(playerMoveSlot, null);
    return logs.slice(startLog);
  }

  function mkMon({
    species,
    moves = ['Tackle', 'Tackle', 'Tackle', 'Tackle'],
    item = null,
    ability = null,
    nature = 'Hardy',
    ivs = null,
    evs = null,
    isShiny = false,
  } = {}) {
    if (!species) throw new Error('mkMon: species required');
    const build = {
      m: moves.slice(0, 4),
      i: item,
      a: ability,
      n: nature,
      ivs: ivs || { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
      evs: evs || { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
      _isShiny: isShiny,
    };
    while (build.m.length < 4) build.m.push('Tackle');
    return engine.buildPokemon(species, build);
  }

  function teardown() {
    try { dom.window.close(); } catch (e) {}
    _cachedEngine = null;
  }

  _cachedEngine = {
    window,
    engine,
    mkMon,
    reset,
    runTurn,
    teardown,
    logs,
    seedRng,
    nextFloat,
  };
  return _cachedEngine;
}

// Story facility pickers (Move Tutor / Battle Dojo / Nature Rater / EV Trainer /
// Colress / Link / Fan Club) now START all-closed: no Pokémon card is expanded on
// entry, so the player chooses which mon to edit. Tests that exercise the open
// picker must first tap a mon to expand it — this mirrors the real player action
// (clicking the collapsed `.story-tutor-mon-toggle` header). Poll for the header
// (the team list renders async after the move-pool fetch), click it, and return.
// Callers keep their existing "wait for .tx-grid" loop afterward, which now
// resolves because a mon is open. Pass a window or a document.
export async function openTutorMon(winOrDoc, idx = 0, { tries = 60, step = 25 } = {}) {
  const doc = (winOrDoc && winOrDoc.document) ? winOrDoc.document : winOrDoc;
  if (!doc || !doc.querySelector) throw new Error('openTutorMon: pass a window or document');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < tries; i++) {
    const tg = doc.querySelector(`.story-tutor-mon-toggle[data-team="${idx}"]`);
    if (tg) { tg.click(); return true; }
    await sleep(step);
  }
  return false;
}

// Global cleanup hook so node:test can exit when all tests in a file finish.
// Tests do not need to call this manually unless they spin up multiple engines.
import { after } from 'node:test';
after(() => {
  if (_cachedEngine) _cachedEngine.teardown();
});
