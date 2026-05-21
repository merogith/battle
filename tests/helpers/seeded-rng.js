// Deterministic PRNG (mulberry32) replacement for Math.random.
// The battle engine has ~282 Math.random() call sites, all uncached.
// Seeding before jsdom parses battle.html makes the entire engine deterministic.

let _state = 0;
let _forcedQueue = [];

export function seedRng(seed = 0) {
  _state = (seed | 0) >>> 0;
  _forcedQueue = [];
}

function _next() {
  _state = (_state + 0x6D2B79F5) >>> 0;
  let t = _state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextFloat() {
  if (_forcedQueue.length > 0) return _forcedQueue.shift();
  return _next();
}

export function setForcedRoll(v, n = 1) {
  for (let i = 0; i < n; i++) _forcedQueue.push(v);
}

export function clearForcedRoll() {
  _forcedQueue = [];
}

// Patch the Math.random on a given globalThis-like object (jsdom window or node global).
export function installMathRandom(target) {
  if (!target || !target.Math) return;
  target.Math.random = nextFloat;
}

seedRng(0);
