// Showdown reference oracle for the differential battle harness.
//
// Drives @pkmn/sim (the MIT-licensed, auto-synced port of Pokémon Showdown's
// simulator) through a SCRIPTED singles battle and returns a normalized,
// RNG-robust, per-turn trace that can be diffed against the in-house engine's
// trace (see inhouse-oracle.mjs + diff.mjs).
//
// Stage 0 of the oracle-led plan (docs/BATTLE_ENGINE_INVESTIGATION.md): this is
// a TEST-ONLY dependency. It does not run in the shipped game.
//
// @pkmn/sim is MIT — Copyright (c) 2011-2026 Guangcong Luo and other
// contributors (Pokémon Showdown); Copyright (c) 2020-2026 pkmn contributors.

import { BattleStreams, Teams } from '@pkmn/sim';

const SLOTS = ['p1a', 'p2a']; // singles

// Build a Showdown PokemonSet from the harness-neutral spec shape (see scenarios.mjs).
export function toShowdownSet(spec) {
  return {
    name: spec.name || spec.species,
    species: spec.species,
    item: spec.item || '',
    ability: spec.ability || '',
    moves: (spec.moves || []).slice(0, 4),
    nature: spec.nature || 'Hardy',
    gender: spec.gender || 'N',
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...(spec.evs || {}) },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...(spec.ivs || {}) },
    level: spec.level || 50,
    shiny: !!spec.shiny,
    happiness: spec.happiness == null ? 255 : spec.happiness,
    teraType: spec.teraType || undefined,
  };
}

function parseHP(token) {
  // "155/207", "155/207 brn", "0 fnt"
  const m = String(token).trim().match(/^(\d+)\/(\d+)/);
  if (m) return { hp: +m[1], maxhp: +m[2] };
  if (/\bfnt\b/.test(token) || /^0\b/.test(token)) return { hp: 0, maxhp: null };
  return { hp: null, maxhp: null };
}

const slotOf = (ref) => String(ref).slice(0, 3); // "p1a: Pikachu" -> "p1a"

// Parse the omniscient protocol log into a per-turn normalized trace.
function parseProtocol(log) {
  const cur = {
    p1a: { hp: null, maxhp: null, status: '', boosts: {} },
    p2a: { hp: null, maxhp: null, status: '', boosts: {} },
  };
  const turns = [];
  let turn = null; // current turn record
  let curAction = null; // action being annotated by following -lines

  const ensureTurn = (n) => {
    turn = { n, actions: [], end: null };
    turns.push(turn);
    curAction = null;
  };
  const snapshotEnd = () => {
    if (turn) turn.end = JSON.parse(JSON.stringify(cur));
  };

  for (const rawLine of log.split('\n')) {
    if (!rawLine.startsWith('|')) continue;
    const parts = rawLine.slice(1).split('|');
    const tag = parts[0];
    switch (tag) {
      case 'turn': {
        snapshotEnd();
        ensureTurn(+parts[1]);
        break;
      }
      case 'switch':
      case 'drag': {
        const slot = slotOf(parts[1]);
        const { hp, maxhp } = parseHP(parts[3] || '');
        cur[slot] = { hp, maxhp, status: '', boosts: {} }; // switch clears boosts/volatiles
        if (turn) turn.actions.push({ kind: 'switch', slot, detail: parts[2] });
        break;
      }
      case 'move': {
        const slot = slotOf(parts[1]);
        curAction = {
          kind: 'move', slot, move: parts[2], target: parts[3] ? slotOf(parts[3]) : null,
          missed: rawLine.includes('|[miss]'), notarget: rawLine.includes('|[notarget]'),
          crit: false, eff: 'neutral', immune: false, failed: false, prepared: false,
          status: null, boosts: {}, damage: 0, heal: 0,
        };
        if (turn) turn.actions.push(curAction);
        break;
      }
      case 'cant': {
        const slot = slotOf(parts[1]);
        if (turn) turn.actions.push({ kind: 'cant', slot, reason: parts[2], move: parts[3] || null });
        curAction = null;
        break;
      }
      case '-prepare': { if (curAction) curAction.prepared = true; break; }
      case '-miss': { if (curAction) curAction.missed = true; break; }
      case '-fail': { if (curAction) curAction.failed = true; break; }
      case '-immune': { if (curAction) curAction.immune = true; if (curAction) curAction.eff = 'immune'; break; }
      case '-crit': { if (curAction) curAction.crit = true; break; }
      case '-supereffective': { if (curAction) curAction.eff = 'super'; break; }
      case '-resisted': { if (curAction) curAction.eff = 'resist'; break; }
      case '-damage': {
        const slot = slotOf(parts[1]);
        const before = cur[slot].hp;
        const { hp, maxhp } = parseHP(parts[2] || '');
        if (hp != null) cur[slot].hp = hp;
        if (maxhp != null) cur[slot].maxhp = maxhp;
        if (/\bfnt\b/.test(parts[2] || '')) cur[slot].hp = 0;
        // attribute damage to the current move if it landed on its target
        if (curAction && before != null && cur[slot].hp != null && slot !== curAction.slot) {
          curAction.damage += Math.max(0, before - cur[slot].hp);
        }
        break;
      }
      case '-heal': {
        const slot = slotOf(parts[1]);
        const before = cur[slot].hp;
        const { hp, maxhp } = parseHP(parts[2] || '');
        if (hp != null) cur[slot].hp = hp;
        if (maxhp != null) cur[slot].maxhp = maxhp;
        if (curAction && before != null && cur[slot].hp != null && slot === curAction.slot) {
          curAction.heal += Math.max(0, cur[slot].hp - before);
        }
        break;
      }
      case '-sethp': {
        const slot = slotOf(parts[1]);
        const { hp, maxhp } = parseHP(parts[2] || '');
        if (hp != null) cur[slot].hp = hp;
        if (maxhp != null) cur[slot].maxhp = maxhp;
        break;
      }
      case '-status': {
        const slot = slotOf(parts[1]);
        cur[slot].status = parts[2];
        if (curAction) curAction.status = parts[2];
        break;
      }
      case '-curestatus': {
        const slot = slotOf(parts[1]);
        cur[slot].status = '';
        break;
      }
      case '-boost': {
        const slot = slotOf(parts[1]);
        const stat = parts[2]; const amt = +parts[3];
        cur[slot].boosts[stat] = (cur[slot].boosts[stat] || 0) + amt;
        if (curAction) curAction.boosts[stat] = (curAction.boosts[stat] || 0) + amt;
        break;
      }
      case '-unboost': {
        const slot = slotOf(parts[1]);
        const stat = parts[2]; const amt = +parts[3];
        cur[slot].boosts[stat] = (cur[slot].boosts[stat] || 0) - amt;
        if (curAction) curAction.boosts[stat] = (curAction.boosts[stat] || 0) - amt;
        break;
      }
      case '-setboost': {
        const slot = slotOf(parts[1]);
        cur[slot].boosts[parts[2]] = +parts[3];
        break;
      }
      case 'faint': {
        const slot = slotOf(parts[1]);
        cur[slot].hp = 0;
        if (turn) turn.actions.push({ kind: 'faint', slot });
        break;
      }
      default: break;
    }
  }
  snapshotEnd();
  return turns;
}

// Drive one side's choices as its request stream emits them.
async function driveSide(stream, choices) {
  let i = 0;
  for await (const chunk of stream) {
    for (const line of chunk.split('\n')) {
      if (line.startsWith('|error|')) { try { void stream.write('default'); } catch (e) {} continue; }
      if (!line.startsWith('|request|')) continue;
      let req;
      try { req = JSON.parse(line.slice('|request|'.length) || '{}'); } catch (e) { req = {}; }
      if (req.wait) continue;
      if (req.teamPreview) { void stream.write('default'); continue; }
      if (req.forceSwitch) { void stream.write('default'); continue; }
      if (req.active) {
        const choice = (i < choices.length) ? choices[i] : 'default';
        i++;
        void stream.write(choice);
      }
    }
  }
}

/**
 * Run a scripted singles battle in Showdown.
 * @param {{team1, team2, choices1?, choices2?, gen?, seed?, level?}} opts
 *   team1/team2: array of neutral specs (1+ mons; index 0 leads).
 *   choices1/choices2: arrays like ['move 1','move 2','switch 2',...] (1-indexed).
 *   seed: 4-number array (gen5-style), default [1,2,3,4].
 * @returns {Promise<{turns, winner, raw}>}
 */
export async function runShowdownBattle(opts) {
  const { team1, team2, choices1 = [], choices2 = [], gen = 9, seed = [1, 2, 3, 4] } = opts;
  const formatid = `gen${gen}customgame`;

  const stream = new BattleStreams.BattleStream();
  const streams = BattleStreams.getPlayerStreams(stream);

  const d1 = driveSide(streams.p1, choices1);
  const d2 = driveSide(streams.p2, choices2);

  let raw = '';
  const collect = (async () => { for await (const c of streams.omniscient) raw += c; })();

  const packed1 = Teams.pack(team1.map(toShowdownSet));
  const packed2 = Teams.pack(team2.map(toShowdownSet));

  void streams.omniscient.write(
    `>start {"formatid":"${formatid}","seed":${JSON.stringify(seed)}}\n` +
    `>player p1 {"name":"P1","team":"${packed1}"}\n` +
    `>player p2 {"name":"P2","team":"${packed2}"}`);

  await Promise.all([collect, d1, d2]);

  // The per-side drivers keep answering with 'default' past the script, so the
  // sim plays to completion. The in-house oracle, by contrast, stops at the end
  // of the script. To keep `winner` comparable, only report a winner if the
  // battle actually concluded WITHIN the scripted turn window; otherwise null.
  const nTurns = Math.max(choices1.length, choices2.length, 1);
  const allTurns = parseProtocol(raw);
  const turns = allTurns.filter(t => t.n <= nTurns);
  const concludedWithinScript = allTurns.length <= nTurns;
  const winnerLine = raw.split('\n').find(l => l.startsWith('|win|'));
  const winner = (concludedWithinScript && winnerLine) ? winnerLine.slice('|win|'.length) : null;
  return { turns, winner, raw, slots: SLOTS };
}
