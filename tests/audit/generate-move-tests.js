#!/usr/bin/env node
// Generate per-move skeleton tests from /tests/reports/coverage.csv.
// Output: tests/moves/by-category/{physical,special,status}.test.js
//
// Each move gets an `it()` block. For trivial cases we auto-fill the assertion:
//   - Status moves with declared `boosts` -> assert target stat stage delta
//   - Damaging moves -> assert HP dropped (delegates to runTurn)
// Otherwise the test is marked `it.todo()` for manual fill-in.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAllMoves } from '../helpers/load-moves.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'moves', 'by-category');

function safeName(s) {
  return s.replace(/[`"']/g, '');
}

// Moves with non-trivial preconditions - generate as it.todo() so they show up
// in the report but don't fail. See /tests/reports/deviations.md.
const NEEDS_MANUAL_SETUP = new Set([
  // Charge moves
  'Solar Beam', 'Solar Blade', 'Sky Attack', 'Razor Wind', 'Skull Bash',
  'Bounce', 'Dig', 'Dive', 'Fly', 'Phantom Force', 'Shadow Force',
  'Geomancy', 'Meteor Beam', 'Electro Shot', 'Freeze Shock', 'Ice Burn', 'Sky Drop',
  // User-type preconditions
  'Burn Up', 'Double Shock', 'Snore',
  // Delayed damage
  'Future Sight', 'Doom Desire',
  // Need terrain
  'Steel Roller', 'Ice Spinner',
  // Need prior context
  'Counter', 'Mirror Coat', 'Metal Burst', 'Bide', 'Last Resort',
  'Fake Out', 'First Impression', 'Sucker Punch', 'Upper Hand', 'Pursuit',
  'Revenge', 'Avalanche', 'Assurance', 'Focus Punch', 'Beat Up',
  // Variable damage
  'Magnitude', 'Crush Grip', 'Wring Out', 'Hard Press', 'Low Kick', 'Grass Knot',
  'Heat Crash', 'Heavy Slam', 'Electro Ball', 'Gyro Ball', 'Reversal', 'Flail',
  'Endeavor', 'Final Gambit',
  // OHKO
  'Sheer Cold', 'Fissure', 'Horn Drill', 'Guillotine',
  // Ally-targeting status moves with target: normal in JSON but ally semantics in engine
  'Decorate',
]);

function buildAssertionLines(move) {
  // Returns { setup, assert, isTodo } — the assertion body and whether it's a todo.
  if (NEEDS_MANUAL_SETUP.has(move.name)) {
    return { setup: '', assert: '', isTodo: true };
  }
  // Ally / multi-foe targets require a doubles harness; mark as todo.
  if (move.target === 'adjacentAlly' || move.target === 'allyTeam'
      || move.target === 'allies' || move.target === 'allAdjacentFoes'
      || move.target === 'allAdjacent') {
    return { setup: '', assert: '', isTodo: true };
  }
  if (move.category === 'Status') {
    if (move.boosts && Object.keys(move.boosts).length > 0) {
      const stat = Object.keys(move.boosts)[0];
      const delta = move.boosts[stat];
      const engineKey = stat === 'accuracy' ? 'acc' : (stat === 'evasion' ? 'eva' : stat);
      const isSelf = move.target === 'self';
      const recipient = isSelf ? 'attacker' : 'defender';
      return {
        setup: ``,
        assert: `assert.equal(${recipient}.stages.${engineKey}, ${delta}, '${stat} stage should be ${delta}');`,
        isTodo: false,
      };
    }
    // Status move without boosts: skeleton only
    return { setup: '', assert: '', isTodo: true };
  }
  if (move.basePower > 0) {
    return {
      setup: `    const beforeHp = defender.currentHp;`,
      assert: `assert.ok(defender.currentHp < beforeHp, '${safeName(move.name)} should reduce defender HP');`,
      isTodo: false,
    };
  }
  return { setup: '', assert: '', isTodo: true };
}

function buildItBlock(move) {
  const { setup, assert: assertLine, isTodo } = buildAssertionLines(move);
  const name = safeName(move.name);
  const moveLit = `'${name.replace(/'/g, "\\'")}'`;

  if (isTodo) {
    return `  it.todo(${moveLit} + ' [${move.basePower || 0} BP ${move.type || '?'} ${move.category || '?'}]', async () => {
    // TODO: assert ${move.name}'s declared behavior
  });`;
  }
  return `  it(${moveLit} + ' [${move.basePower || 0} BP ${move.type || '?'} ${move.category || '?'}]', async () => {
    const attacker = mkMon({ species: 'Mew', ability: 'None', moves: [${moveLit}, 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
${setup}
    await runTurn({ playerMon: attacker, foeMon: defender });
    ${assertLine}
  });`;
}

function buildFile(category, moves) {
  const blocks = moves.map(buildItBlock).join('\n\n');
  const todoCount = moves.filter((m) => buildAssertionLines(m).isTodo).length;
  return `// Auto-generated per-move skeleton tests. Regenerate via:
//   node tests/audit/generate-move-tests.js
//
// Category: ${category}
// Total moves: ${moves.length}
// Auto-asserted: ${moves.length - todoCount}
// TODO (manual fill-in required): ${todoCount}

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('${category} moves', () => {
  // Reuse the cached engine instance across all 'it' blocks in this file.
  ${blocks}
});
`;
}

async function main() {
  const moves = await loadAllMoves();
  // Drop Z-moves and G-Max moves from skeleton generation - they need gimmick activation
  const filtered = moves.filter((m) => !m.isZ && !m.isMax
    && !m.name.startsWith('G-Max ') && !m.name.startsWith('Max '));

  const byCat = { Physical: [], Special: [], Status: [] };
  for (const m of filtered) {
    const cat = m.category || 'Status';
    if (byCat[cat]) byCat[cat].push(m); else byCat.Status.push(m);
  }

  await mkdir(OUT_DIR, { recursive: true });
  for (const cat of ['Physical', 'Special', 'Status']) {
    const lower = cat.toLowerCase();
    const content = buildFile(cat, byCat[cat]);
    await writeFile(join(OUT_DIR, `${lower}.test.js`), content);
    const auto = byCat[cat].filter((m) => !buildAssertionLines(m).isTodo).length;
    const todo = byCat[cat].length - auto;
    console.log(`${cat.padEnd(8)} ${String(byCat[cat].length).padStart(4)} moves  (${auto} auto, ${todo} todo)`);
  }
  console.log(`\nWrote to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('generate failed:', err);
  process.exit(1);
});
