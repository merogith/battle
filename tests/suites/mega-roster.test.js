// Guards the Mega Evolution roster end to end.
//
// The engine keeps four hand-maintained tables in battle.html — MEGA_STONE_MAP,
// MEGA_FORM_NAMES, MEGA_FORM_BY_SPECIES and ALL_MEGA_STONES — while the actual
// forme/stat/typing data lives in data/items.json + data/species.json. Nothing at
// runtime cross-checks the two, so a stone added to the data but not to the tables
// (or vice versa) is silently inert. These tests pin the tables to the data, and
// then prove a representative Legends: Z-A mega actually transforms in battle.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ITEMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'items.json'), 'utf8'))['9'];
const SPECIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'species.json'), 'utf8'))['9'];

// Primal reversion is stone-driven too but keyed off orbs, and Rayquaza is stoneless —
// both are covered by the generic table walk below via MEGA_STONE_MAP.
const STONE_PAIRS = []; // [stoneName, baseSpecies, megaForme]
for (const item of Object.values(ITEMS)) {
  if (!item.megaStone) continue;
  for (const [base, forme] of Object.entries(item.megaStone)) STONE_PAIRS.push([item.name, base, forme]);
}
// Crucibelle is a CAP (Create-A-Pokémon) mon with a negative National Dex number, so
// loadGameData skips it and no upstream sprite/dex row exists. It stays wired in the
// stone tables — it just can't participate in the data-backed assertions.
const CAP = new Set(['Crucibelle', 'Crucibelle-Mega']);
const DEX_PAIRS = STONE_PAIRS.filter(([, base, forme]) => !CAP.has(base) && !CAP.has(forme));

let w, mkMon, engine;
before(async () => { ({ window: w, mkMon, engine } = await loadEngine()); });

// activateMega repaints the HUD, so it needs a live battle state to walk. Minimal 1v1.
function stage(mon) {
  const foe = mkMon({ species: 'Rattata' });
  engine.state = {
    mode: 'pve', turnNumber: 0, isOver: false, isLocked: false,
    weather: null, weatherTurns: 0, magicRoom: 0, trickRoom: 0, gravity: 0,
    pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 },
    fSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 },
    playerParty: [mon], foeParty: [foe], pActive: mon, fActive: foe,
    currentPlayer: 1, p1Action: null, p2Action: null,
    p1GimmickIntent: null, p2GimmickIntent: null, revealedFoe: new Set(),
  };
  return mon;
}

const evalIn = (expr) => w.eval(expr);

describe('mega roster ↔ data parity', () => {
  it('data/items.json has mega stones to check', () => {
    assert.ok(STONE_PAIRS.length > 90, `expected the full stone roster, got ${STONE_PAIRS.length}`);
  });

  it('every mega stone in items.json is recognised by isMegaStone', () => {
    const missing = [...new Set(STONE_PAIRS.map(([s]) => s))]
      .filter((stone) => !evalIn(`isMegaStone(${JSON.stringify(stone)})`));
    assert.deepEqual(missing, [], `stones absent from ALL_MEGA_STONES: ${missing.join(', ')}`);
  });

  it('every mega stone is in BANNED_ITEMS so it never rolls as a neutral held item', () => {
    const missing = [...new Set(STONE_PAIRS.map(([s]) => s))]
      .filter((stone) => !evalIn(`BANNED_ITEMS.has(${JSON.stringify(stone)})`));
    assert.deepEqual(missing, [], `stones absent from BANNED_ITEMS: ${missing.join(', ')}`);
  });

  it('every (species, stone) pair resolves to the forme items.json names', () => {
    const bad = [];
    for (const [stone, base, forme] of STONE_PAIRS) {
      const got = evalIn(`megaFormFor(${JSON.stringify(base)}, ${JSON.stringify(stone)})`);
      if (got !== forme) bad.push(`${base} + ${stone} → ${got || '(nothing)'} (want ${forme})`);
    }
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  it('megaFormFor rejects a stone that belongs to another species', () => {
    assert.equal(evalIn(`megaFormFor('Latios', 'Latiasite')`), '');
    assert.equal(evalIn(`megaFormFor('Pikachu', 'Venusaurite')`), '');
    assert.equal(evalIn(`megaFormFor('Meowstic-F', 'Gengarite')`), '');
    // …but accepts the shared-stone formes.
    assert.equal(evalIn(`megaFormFor('Meowstic-F', 'Meowsticite')`), 'Meowstic-F-Mega');
    assert.equal(evalIn(`megaFormFor('Meowstic', 'Meowsticite')`), 'Meowstic-M-Mega');
  });

  it('every mega forme has battle stats loaded from species.json', () => {
    const missing = [];
    for (const [, , forme] of DEX_PAIRS) {
      if (!evalIn(`!!(baseStats[${JSON.stringify(forme)}] && baseStats[${JSON.stringify(forme)}].atk)`)) missing.push(forme);
    }
    assert.deepEqual(missing, [], `formes with no baseStats row: ${missing.join(', ')}`);
  });

  it('every mega base species is itself in the dex', () => {
    const missing = DEX_PAIRS
      .map(([, base]) => base)
      .filter((base) => !evalIn(`!!baseStats[${JSON.stringify(base)}]`));
    assert.deepEqual([...new Set(missing)], []);
  });

  it('MEGA_SPECIES covers every base species that owns a stone', () => {
    const missing = [...new Set(STONE_PAIRS.map(([, base]) => base))]
      .filter((base) => !evalIn(`MEGA_SPECIES.has(${JSON.stringify(base)})`));
    assert.deepEqual(missing, []);
  });
});

describe('mega formes stay out of the draft pool', () => {
  it('ALL_MEGA_FORM_NAMES contains every forme, including the shared-stone ones', () => {
    const missing = STONE_PAIRS
      .map(([, , forme]) => forme)
      .filter((forme) => !evalIn(`ALL_MEGA_FORM_NAMES.has(${JSON.stringify(forme)})`));
    assert.deepEqual([...new Set(missing)], []);
  });

  it('getDraftPool never offers a mega forme as a draftable species', () => {
    // Array.from re-homes the jsdom-realm array so deepEqual's prototype check passes.
    const pool = Array.from(evalIn('getDraftPool([1,2,3,4,5,6,7,8,9], null)'));
    const leaked = pool.filter((n) => /-Mega(-[A-Z])?$/.test(n) || /-Primal$/.test(n));
    assert.deepEqual(leaked, [], `mega formes leaked into the draft pool: ${leaked.join(', ')}`);
  });
});

describe('mega sprites', () => {
  const DIRS = ['gen5ani', 'gen5ani-shiny', 'gen5ani-back', 'gen5ani-back-shiny'];

  it('every mega forme has a FORM_DEX_IDS entry for the remote fallback', () => {
    const missing = [];
    for (const [, , forme] of DEX_PAIRS) {
      const slug = evalIn(`toShowdownSpriteId(${JSON.stringify(forme)})`);
      if (!evalIn(`FORM_DEX_IDS[${JSON.stringify(slug)}] > 0`)) missing.push(`${forme} (${slug})`);
    }
    assert.deepEqual([...new Set(missing)], []);
  });

  it('every mega forme ships front, back and both shiny sprites', () => {
    const missing = [];
    for (const [, , forme] of DEX_PAIRS) {
      const slug = evalIn(`toShowdownSpriteId(${JSON.stringify(forme)})`);
      for (const dir of DIRS) {
        if (!fs.existsSync(path.join(ROOT, 'sprites', dir, `${slug}.gif`))) missing.push(`${dir}/${slug}.gif`);
      }
    }
    assert.deepEqual([...new Set(missing)], []);
  });

  it('sprite slugs are unique — no two formes share a file', () => {
    const seen = new Map();
    for (const [, , forme] of STONE_PAIRS) {
      const slug = evalIn(`toShowdownSpriteId(${JSON.stringify(forme)})`);
      if (seen.has(slug) && seen.get(slug) !== forme) {
        assert.fail(`${forme} and ${seen.get(slug)} both map to sprite slug "${slug}"`);
      }
      seen.set(slug, forme);
    }
  });
});

describe('the build pipeline can equip every mega', () => {
  // rollGimmick → assignGimmickToBuild → validateGimmick is the path enemy teams take.
  // A species in MEGA_SPECIES whose stone never lands on the build would silently
  // degrade to STANDARD, so walk the whole roster rather than a sample.
  it('assignGimmickToBuild equips a legal stone for every mega species', () => {
    const bad = [];
    for (const base of new Set(STONE_PAIRS.map(([, b]) => b))) {
      const out = JSON.parse(evalIn(`(function(){
        const b = { m: ['Tackle','Tackle','Tackle','Tackle'], i: 'Leftovers' };
        assignGimmickToBuild(${JSON.stringify(base)}, b, 'MEGA');
        return JSON.stringify({ item: b.i, valid: !!validateGimmick(${JSON.stringify(base)}, b),
                                forme: megaFormFor(${JSON.stringify(base)}, b.i) });
      })()`));
      if (!out.valid || !out.forme) bad.push(`${base} → item=${out.item} valid=${out.valid} forme=${out.forme || '(none)'}`);
    }
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  it('Rayquaza still mega-evolves stonelessly via Dragon Ascent', () => {
    const out = JSON.parse(evalIn(`(function(){
      const b = { m: ['Tackle','Tackle','Tackle','Tackle'], i: 'Leftovers' };
      assignGimmickToBuild('Rayquaza', b, 'MEGA');
      return JSON.stringify({ moves: b.m, item: b.i, valid: !!validateGimmick('Rayquaza', b) });
    })()`));
    assert.ok(out.moves.includes('Dragon Ascent'), 'Dragon Ascent is injected');
    assert.ok(out.valid, 'the build validates without a stone');
  });
});

describe('activateMega applies real forme data', () => {
  // Dragonite-Mega is a Legends: Z-A forme: it did not exist before this roster pass,
  // so it proves the whole path (stone → forme → stats/typing/ability) end to end.
  it('Mega Dragonite gains its forme stats, typing and ability', async () => {
    const mon = stage(mkMon({ species: 'Dragonite', moves: ['Dragon Claw'], item: 'Dragoninite' }));
    const beforeSpa = mon.stats.spa;
    w.activateMega(mon, true);
    assert.equal(mon.name, 'Dragonite-Mega');
    assert.ok(mon.stats.spa > beforeSpa, `Sp.Atk should rise (${beforeSpa} → ${mon.stats.spa})`);
    const dexRow = SPECIES.dragonitemega;
    assert.ok(dexRow, 'species.json should carry Dragonite-Mega');
    assert.equal(mon.type1, dexRow.types[0]);
    assert.equal(mon.type2, dexRow.types[1] || '');
    assert.equal(mon.ability, dexRow.abilities['0']);
  });

  it('a stone from another species does not produce that species’ forme', async () => {
    const mon = stage(mkMon({ species: 'Latios', item: 'Latiasite' }));
    w.activateMega(mon, true);
    assert.notEqual(mon.name, 'Latias-Mega');
  });

  it('a shared stone resolves to the held forme, not the stone default', async () => {
    const meowsticF = stage(mkMon({ species: 'Meowstic-F', item: 'Meowsticite' }));
    w.activateMega(meowsticF, true);
    assert.equal(meowsticF.name, 'Meowstic-F-Mega');
  });

  it('a forme whose name does not extend its base species still mega-evolves', async () => {
    // Floette-Eternal → Floette-Mega has no shared name prefix; the old prefix check
    // rejected exactly this shape.
    const floette = stage(mkMon({ species: 'Floette-Eternal', item: 'Floettite' }));
    w.activateMega(floette, true);
    assert.equal(floette.name, 'Floette-Mega');
  });
});

describe('mega stone tooltips', () => {
  // 19 of the newer stones ship with no desc/shortDesc in the upstream Showdown export,
  // so loadGameData backfills them from MEGA_STONE_MAP. Without that they hover blank.
  it('every mega stone has tooltip text', () => {
    const blank = [...new Set(STONE_PAIRS.map(([s]) => s))]
      .filter((stone) => !evalIn(`!!(tooltipDict[${JSON.stringify(stone)}] || '').trim()`));
    assert.deepEqual(blank, [], `stones with no tooltip: ${blank.join(', ')}`);
  });

  it('the backfilled text names the species that can use the stone', () => {
    assert.match(evalIn(`tooltipDict['Baxcalibrite']`), /Baxcalibur/);
    assert.match(evalIn(`tooltipDict['Raichunite X']`), /Raichu/);
    // Upstream text is never overwritten.
    assert.match(evalIn(`tooltipDict['Venusaurite']`), /Venusaur/);
  });
});
