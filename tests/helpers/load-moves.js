// Pure Node move loader - no jsdom dependency.
// Mirrors the merge-by-gen flattening from /tests/audit/coverage-report.js
// so property tests can iterate over all 954 moves without booting battle.html.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const MOVES_PATH = join(ROOT, 'data', 'moves.json');

let _cache = null;

function deriveDisplayName(id, def) {
  if (def.name) return def.name;
  return id.replace(/(^|[a-z])([A-Z])/g, '$1 $2')
           .replace(/\b\w/g, (c) => c.toUpperCase());
}

function flatten(byGen) {
  const merged = new Map();
  const gens = Object.keys(byGen).sort((a, b) => Number(a) - Number(b));
  for (const gen of gens) {
    for (const [id, def] of Object.entries(byGen[gen])) {
      const prior = merged.get(id) || {};
      merged.set(id, { ...prior, ...def, _gen: gen, _id: id });
    }
  }
  return merged;
}

export async function loadAllMoves() {
  if (_cache) return _cache;
  const text = await readFile(MOVES_PATH, 'utf8');
  const byGen = JSON.parse(text);
  const merged = flatten(byGen);
  const moves = [];
  for (const [id, def] of merged) {
    const name = deriveDisplayName(id, def);
    moves.push({
      id,
      name,
      gen: def._gen,
      basePower: def.basePower ?? 0,
      accuracy: def.accuracy === true ? true : (def.accuracy ?? 100),
      priority: def.priority ?? 0,
      type: def.type ?? null,
      category: def.category ?? null,
      target: def.target ?? null,
      pp: def.pp ?? null,
      flags: def.flags ?? {},
      boosts: def.boosts ?? null,
      self: def.self ?? null,
      secondary: def.secondary ?? null,
      secondaries: def.secondaries ?? null,
      status: def.status ?? null,
      volatileStatus: def.volatileStatus ?? null,
      multihit: def.multihit ?? null,
      drain: def.drain ?? null,
      recoil: def.recoil ?? null,
      sideCondition: def.sideCondition ?? null,
      weather: def.weather ?? null,
      terrain: def.terrain ?? null,
      isZ: !!def.isZ,
      isMax: !!def.isMax,
      _raw: def,
    });
  }
  moves.sort((a, b) => a.name.localeCompare(b.name));
  _cache = moves;
  return moves;
}

export async function getMoveByName(name) {
  const all = await loadAllMoves();
  return all.find((m) => m.name === name) || null;
}

export async function getMoveById(id) {
  const all = await loadAllMoves();
  return all.find((m) => m.id === id) || null;
}

export async function filterMoves(predicate) {
  const all = await loadAllMoves();
  return all.filter(predicate);
}
