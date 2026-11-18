import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInhouseBattle } from './inhouse-oracle.mjs';
import { runShowdownBattle } from './showdown-oracle.mjs';

const mon = (species, ability, moves = ['Splash', 'Tackle'], item) => ({ species, ability, moves, item });
const magikarp = () => mon('Magikarp', 'Swift Swim');
const clefable = () => mon('Clefable', 'Magic Guard');
const blissey = () => mon('Blissey', 'Natural Cure');
const hippowdon = () => mon('Hippowdon', 'Sand Stream');
const torkoal = () => mon('Torkoal', 'Drought');
const turn1 = 'move 1';
const turn2 = 'move 2';
const select = (slots) => slots.map(slot => `switch ${slot}`);

async function compareTurns(team1, team2, choices1, choices2) {
  const scenario = { team1, team2, choices1, choices2 };
  const [arena, showdown] = await Promise.all([
    runInhouseBattle({ ...scenario, seed: 1 }),
    runShowdownBattle({ ...scenario, seed: [1, 2, 3, 4] }),
  ]);
  assert.equal(arena.turns.length, choices1.length);
  assert.equal(showdown.turns.length, choices1.length);
  const visible = ({ turns }) => turns.map(({ end }) => [end.p1a, end.p2a].map(active => ({
    hp: active.hp, status: active.status, speedBoost: active.boosts.spe || 0,
  })));
  assert.deepEqual(visible(arena), visible(showdown));
}

test('Magic Guard blocks hazard damage and allows the Sticky Web speed drop', async () => {
  const setter = mon('Shuckle', 'Sturdy', ['Stealth Rock', 'Sticky Web', 'Splash', 'Tackle']);
  await compareTurns([magikarp(), clefable()], [setter],
    [turn1, turn1, 'switch 2'], [turn1, turn2, 'move 3']);
});

test('Magic Guard allows Toxic Spikes to poison the holder', async () => {
  const setter = mon('Tentacruel', 'Clear Body', ['Toxic Spikes', 'Splash', 'Tackle']);
  await compareTurns([magikarp(), clefable()], [setter], [turn1, 'switch 2'], [turn1, turn2]);
});

test('Toxic Spikes are absorbed by a grounded Poison-type with Boots and survive a Flying switch-in', async () => {
  const setter = mon('Tentacruel', 'Clear Body', ['Toxic Spikes', 'Splash', 'Tackle']);
  const crobat = mon('Crobat', 'Inner Focus', ['Splash', 'Tackle'], 'Heavy-Duty Boots');
  const nidoran = mon('Nidoran-F', 'Poison Point', ['Splash', 'Tackle'], 'Heavy-Duty Boots');
  const snorlax = mon('Snorlax', 'Thick Fat');
  await compareTurns([magikarp(), crobat, nidoran, snorlax], [setter],
    [turn1, ...select([2, 3, 4])], [turn1, turn2, turn2, turn2]);
});

test('Gravity grounds a Flying switch-in for Spikes', async () => {
  const primer = mon('Starmie', 'Illuminate', ['Gravity', 'Splash', 'Tackle']);
  const setter = mon('Garchomp', 'Sand Veil', ['Spikes', 'Splash', 'Tackle']);
  await compareTurns([primer, mon('Crobat', 'Inner Focus')], [setter],
    [turn1, 'switch 2'], [turn1, turn2]);
});

test('An active Iron Ball grounds a Flying switch-in for Spikes', async () => {
  const setter = mon('Garchomp', 'Sand Veil', ['Spikes', 'Splash', 'Tackle']);
  const crobat = mon('Crobat', 'Inner Focus', ['Splash', 'Tackle'], 'Iron Ball');
  await compareTurns([magikarp(), crobat], [setter], [turn1, 'switch 2'], [turn1, turn2]);
});

test('Magic Room suppresses an Iron Ball when checking entry hazards', async () => {
  const primer = mon('Mr. Mime', 'Soundproof', ['Magic Room', 'Splash', 'Tackle']);
  const setter = mon('Garchomp', 'Sand Veil', ['Spikes', 'Splash', 'Tackle']);
  const crobat = mon('Crobat', 'Inner Focus', ['Splash', 'Tackle'], 'Iron Ball');
  await compareTurns([primer, crobat], [setter], [turn1, 'switch 2'], [turn1, turn2]);
});

test('Synchronize reflects Toxic as bad poison', async () => {
  const user = mon('Blissey', 'Natural Cure', ['Toxic', 'Splash']);
  await compareTurns([user], [mon('Mew', 'Synchronize')], [turn1], [turn1]);
});

test('Synchronize leaves its opponent alone when its own Toxic Orb triggers', async () => {
  const holder = mon('Mew', 'Synchronize', ['Safeguard', 'Splash', 'Tackle'], 'Toxic Orb');
  await compareTurns([holder], [blissey()], [turn1], [turn1]);
});

test('Toxic Spikes do not trigger Synchronize', async () => {
  const setter = mon('Smeargle', 'Technician', ['Toxic Spikes', 'Splash', 'Tackle']);
  await compareTurns([magikarp(), mon('Mew', 'Synchronize')], [setter], [turn1, 'switch 2'], [turn1, turn2]);
});

test('Sand Rush prevents sand chip on a non-Rock, Ground, or Steel Pokémon', async () => {
  await compareTurns([mon('Stoutland', 'Sand Rush')], [hippowdon()], [turn1], [turn1]);
});

test('Safety Goggles allow Solar Power damage in the sun', async () => {
  const holder = mon('Charizard', 'Solar Power', ['Splash', 'Tackle'], 'Safety Goggles');
  await compareTurns([holder], [torkoal()], [turn1], [turn1]);
});

test('Utility Umbrella protects Dry Skin from sunlight', async () => {
  const holder = mon('Heliolisk', 'Dry Skin', ['Splash', 'Tackle'], 'Utility Umbrella');
  await compareTurns([holder], [torkoal()], [turn1], [turn1]);
});

test('Ordinary Sand Stream expires before its fifth residual tick', async () => {
  await compareTurns([blissey()], [hippowdon()], Array(5).fill(turn1), Array(5).fill(turn1));
});

test('Grassy Terrain still heals the grounded holder on its expiration turn', async () => {
  const setter = mon('Blissey', 'Natural Cure', ['Grassy Terrain', 'Splash']);
  const attacker = mon('Chansey', 'Natural Cure', ['Seismic Toss', 'Splash']);
  await compareTurns([setter], [attacker], [turn1, turn2, turn2, turn2, turn2], Array(5).fill(turn1));
});

test('Bad poison damage uses the rounded one-sixteenth base before multiplying', async () => {
  const holder = mon('Mew', 'Synchronize', ['Splash', 'Tackle'], 'Toxic Orb');
  await compareTurns([holder], [blissey()], Array(3).fill(turn1), Array(3).fill(turn1));
});

test('Repeating Sandstorm does not refresh its active duration', async () => {
  const setter = mon('Garchomp', 'Sand Veil', ['Sandstorm', 'Splash']);
  await compareTurns([setter], [blissey()], [turn1, turn1, turn2, turn2, turn2, turn2], Array(6).fill(turn1));
});

test('Primordial Sea shields Kyogre from Fire despite the opponent entering with Drought', async () => {
  const kyogre = mon('Kyogre-Primal', 'Primordial Sea');
  const attacker = mon('Torkoal', 'Drought', ['Flamethrower', 'Splash']);
  await compareTurns([kyogre], [attacker], [turn1], [turn1]);
});

test('Cud Chew restores Sitrus HP once at the end of the following turn', async () => {
  const holder = mon('Farigiraf', 'Cud Chew', ['Splash', 'Tackle'], 'Sitrus Berry');
  const attacker = mon('Blissey', 'Natural Cure', ['Seismic Toss', 'Splash']);
  await compareTurns([holder], [attacker], Array(5).fill(turn1), [turn1, turn1, turn1, turn2, turn2]);
});

test('Unnerve blocks Rawst Berry immediately when burn is applied', async () => {
  const attacker = mon('Tyranitar', 'Unnerve', ['Will-O-Wisp', 'Splash']);
  const holder = mon('Blissey', 'Natural Cure', ['Splash', 'Tackle'], 'Rawst Berry');
  await compareTurns([attacker], [holder], [turn1], [turn1]);
});

test('Primordial Sea remains active when one of its two holders switches out', async () => {
  const kyogre = () => mon('Kyogre-Primal', 'Primordial Sea', ['Rest', 'Water Pulse']);
  const attacker = mon('Snorlax', 'Thick Fat', ['Flamethrower', 'Rest']);
  await compareTurns([kyogre(), attacker], [kyogre()], [turn1, 'switch 2', turn1], Array(3).fill(turn1));
});

test('Poison Heal leaves one toxic stage per turn when an opponent swaps away the ability', async () => {
  const holder = mon('Gliscor', 'Poison Heal', ['Splash', 'Tackle'], 'Toxic Orb');
  const swapper = mon('Bronzong', 'Levitate', ['Splash', 'Skill Swap']);
  await compareTurns([holder], [swapper], Array(5).fill(turn1), [turn1, turn1, turn1, turn2, turn1]);
});
