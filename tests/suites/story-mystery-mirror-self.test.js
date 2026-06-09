// Mystery Figure — true mirror-self ("beat yourself") climax.
//
// At Hall-of-Fame entry the WINNING party is deep-cloned, full builds and all,
// into sm.hofPartySnapshot (_storyRecordHallOfFame). The post-HoF Mystery Figure
// fields that snapshot verbatim (rollMysteryFigureFinalBossTeam) — a pure 1:1
// copy with only the existing +30% Mystery stat mult layered on downstream. The
// climax sprite is the player's own avatar (_mysteryFigureSpriteFile), with the
// trainer-profile `.png` stripped so getTrainerSprite's append doesn't double it.
//
// These tests lock:
//   (a) the snapshot is an exact, DETACHED clone of the winning builds,
//   (b) the team builder returns exact, detached clones of the snapshot (no pad,
//       no foe/player stamp fields),
//   (c) the figure's sprite resolves to the player's avatar with a single .png,
//   (d) old saves with no snapshot fall back to the legacy live-team mirror path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

// The engine clones builds with the jsdom realm's structuredClone, so cloned
// arrays/objects carry jsdom's prototypes. deepStrictEqual treats those as
// "same structure but not reference-equal" against a Node-realm literal — so
// normalize any engine-produced value into the Node realm before comparing.
const plain = (x) => JSON.parse(JSON.stringify(x));

// A known, distinctive winning party: real species (baseStats lookups in the HoF
// recorder must resolve) with hand-set builds we can byte-check after the clone.
function seedWinningTeam() {
  const team = [
    {
      name: 'Pikachu',
      nickname: 'Sparky',
      build: {
        i: 'Light Ball', a: 'Static', n: 'Timid',
        m: ['Thunderbolt', 'Volt Switch', 'Surf', 'Nasty Plot'],
        evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
        ivs: { atk: 0 },
        gimmick: 'TERA', teraType: 'Electric',
        _isShiny: true, _gender: 'M',
      },
    },
    {
      name: 'Charizard',
      nickname: '',
      build: {
        i: 'Charizardite Y', a: 'Blaze', n: 'Modest',
        m: ['Flamethrower', 'Air Slash', 'Solar Beam', 'Roost'],
        evs: { hp: 4, spa: 252, spe: 252 },
        ivs: {},
        gimmick: 'MEGA', teraType: null,
        _isShiny: false, _gender: 'F',
      },
    },
    // A daycare egg occupies a party slot but can't fight — it must be excluded
    // from the mirror snapshot (matches the battle draft's !t.isEgg filter).
    { name: 'Egg', nickname: '', isEgg: true, eggSpecies: 'Larvitar', build: { m: [], evs: {} } },
  ];
  ST.sm.active = true;
  ST.sm._hofCountedThisRun = false;
  ST.sm.trainerProfile = { name: 'Meric', sprite: 'Red.png' };
  ST.sm.team = team;
  return team;
}

test('(a) HoF entry deep-clones the winning party into sm.hofPartySnapshot', () => {
  const team = seedWinningTeam();
  ST.sm.hofPartySnapshot = null;

  ST.recordHallOfFame();

  const snap = ST.sm.hofPartySnapshot;
  assert.ok(Array.isArray(snap), 'snapshot should be an array');
  assert.equal(snap.length, 2, 'snapshot mirrors the 2 fighters — the egg slot is excluded');
  assert.ok(snap.every(s => !s.isEgg && s.name !== 'Egg'), 'no egg slot leaks into the snapshot');

  // Exact build fidelity (the whole point — not a STANDARD re-roll).
  assert.equal(snap[0].name, 'Pikachu');
  assert.equal(snap[0].nickname, 'Sparky');
  assert.deepEqual(plain(snap[0].build.m), ['Thunderbolt', 'Volt Switch', 'Surf', 'Nasty Plot']);
  assert.equal(snap[0].build.i, 'Light Ball');
  assert.equal(snap[0].build.a, 'Static');
  assert.equal(snap[0].build.n, 'Timid');
  assert.deepEqual(plain(snap[0].build.evs), { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 });
  assert.equal(snap[0].build.gimmick, 'TERA');
  assert.equal(snap[0].build.teraType, 'Electric');
  assert.equal(snap[0].build._isShiny, true);
  assert.equal(snap[1].name, 'Charizard');
  assert.equal(snap[1].build.gimmick, 'MEGA');
  assert.equal(snap[1].build.teraType, null);

  // DETACHED clone: mutating the snapshot must not reach back into the live team.
  snap[0].build.m.push('Extrasensory');
  snap[0].build.i = 'TAMPERED';
  assert.deepEqual(plain(team[0].build.m), ['Thunderbolt', 'Volt Switch', 'Surf', 'Nasty Plot'],
    'live team moves untouched by snapshot mutation');
  assert.equal(team[0].build.i, 'Light Ball', 'live team item untouched by snapshot mutation');
});

test('(b) Mystery Figure fields the snapshot verbatim — exact, detached, unpadded', () => {
  seedWinningTeam();
  ST.sm.hofPartySnapshot = null;
  ST.recordHallOfFame();
  const snap = ST.sm.hofPartySnapshot;

  const picks = ST.rollMysteryFigure(6, [1]);

  // Pure 1:1: exactly the snapshot's count (NOT padded to 6, no stronger-lead dup).
  assert.equal(picks.length, snap.length, 'no padding — exactly the HoF party size');

  for (let i = 0; i < snap.length; i++) {
    assert.equal(picks[i].name, snap[i].name, `pick ${i} species matches snapshot`);
    assert.deepEqual(plain(picks[i].build.m), plain(snap[i].build.m), `pick ${i} keeps the real moveset`);
    assert.equal(picks[i].build.i, snap[i].build.i, `pick ${i} keeps the real item`);
    assert.equal(picks[i].build.a, snap[i].build.a, `pick ${i} keeps the real ability`);
    assert.equal(picks[i].build.n, snap[i].build.n, `pick ${i} keeps the real nature`);
    assert.equal(picks[i].build.gimmick, snap[i].build.gimmick, `pick ${i} keeps the real gimmick`);
    assert.equal(picks[i].build.teraType, snap[i].build.teraType, `pick ${i} keeps the real tera type`);
    // The +30% buff is stamped at battle entry, not baked into the rolled build.
    assert.equal(picks[i].build._storyStatMult, undefined, `pick ${i} carries no foe stat stamp`);
    assert.equal(picks[i].build._relationshipStatMult, undefined, `pick ${i} carries no player camp buff`);
  }

  // DETACHED clone: mutating a returned build must not corrupt the saved snapshot
  // (matters for flee / reload / Crucible-encore replays that re-roll the team).
  picks[0].build.m.push('Fake Out');
  assert.deepEqual(plain(ST.sm.hofPartySnapshot[0].build.m), ['Thunderbolt', 'Volt Switch', 'Surf', 'Nasty Plot'],
    'saved snapshot untouched by a mutation to a rolled build');
});

test('(c) the figure wears the player avatar — single .png, profile fallback', () => {
  // Stored profile sprites carry a trailing .png (the trainer-create pool does).
  ST.sm.trainerProfile = { name: 'Meric', sprite: 'Red.png' };
  assert.equal(ST.mysteryFigureSpriteFile(), 'Red', 'trailing .png stripped');
  assert.equal(
    ST.getTrainerSprite({ spriteFile: ST.mysteryFigureSpriteFile() }),
    'sprites/trainers/Red.png',
    'resolves to exactly one .png — no Red.png.png',
  );

  // A class-sprite avatar round-trips the same way.
  ST.sm.trainerProfile = { name: 'Meric', sprite: 'Cooltrainer~F.png' };
  assert.equal(ST.mysteryFigureSpriteFile(), 'Cooltrainer~F');
  assert.equal(
    ST.getTrainerSprite({ spriteFile: ST.mysteryFigureSpriteFile() }),
    'sprites/trainers/Cooltrainer~F.png',
  );

  // No profile → fall back to the identity sprite ('Red'), still a clean path.
  ST.sm.trainerProfile = null;
  assert.equal(ST.mysteryFigureSpriteFile(), 'Red', 'no-profile fallback is the identity sprite');
  assert.equal(
    ST.getTrainerSprite({ spriteFile: ST.mysteryFigureSpriteFile() }),
    'sprites/trainers/Red.png',
  );
  // Restore a profile so later state is sane.
  ST.sm.trainerProfile = { name: 'Meric', sprite: 'Red.png' };
});

test("(e) the mfReveal scene portrait is the player's own avatar (the unmask)", () => {
  // The real reveal is the main.mfReveal scene (the victory-overlay branch is
  // bypassed for the Mystery Figure via the crucibleBattleSource early-return).
  // _fireMysteryRevealThenEnding stamps the scene's sprite with the player's
  // avatar so "the face under the cap is yours" shows your actual face.
  ST.sm.active = true;
  ST.sm.mysteryIdentity = 'the_first';
  ST.sm.storyEventsFired = {};                       // not yet revealed (avoid dedup early-return)
  ST.sm.trainerProfile = { name: 'Meric', sprite: 'Hilda.png' };
  assert.doesNotThrow(() => { ST.fireMysteryRevealThenEnding(() => {}); });
  const stem = ST.STORY_SCENES['main.mfReveal'].sprite;
  assert.equal(stem, 'Hilda', 'reveal scene sprite = player avatar stem (.png stripped)');
  assert.equal(ST.getTrainerSprite({ spriteFile: stem }), 'sprites/trainers/Hilda.png',
    'reveal portrait resolves to the player avatar with a single .png');
});

test('(d) old saves with no snapshot fall back to the legacy live-team mirror', () => {
  ST.sm.active = true;
  ST.sm.hofPartySnapshot = null; // simulate a pre-feature save that already reached HoF
  ST.sm.team = [{ name: 'Bulbasaur', nickname: '', build: { m: [], evs: {} } }];

  let picks;
  assert.doesNotThrow(() => { picks = ST.rollMysteryFigure(6, [1]); },
    'legacy mirror path must not crash on a snapshot-less save');
  assert.ok(Array.isArray(picks) && picks.length > 0, 'legacy path still returns a team');
  // Legacy path mirrors the lead + pads to the requested party size.
  assert.equal(picks.length, 6, 'legacy mirror fills the full 6-slot boss party');
});
