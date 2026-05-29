import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

// Regression guard for the cry-audio fallback chain (AudioSystem.playCry → cryCandidates).
//
// ~65 regional / alternate formes (Goodra-Hisui, Moltres-Galar, Darmanitan-Galar-Zen, …)
// ship WITHOUT their own music/cries/<id>.mp3 file — only the ~1200 base-species cries are
// vendored. Previously playCry hit a local 404 then a CDN URL, so in an offline build (and
// for any CDN that names cries differently) those formes were silent. cryCandidates() now
// walks toward the base species' local cry, which is guaranteed to exist, before the CDN.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const cryPath = (url) => join(ROOT, url); // url is a "music/cries/<id>.mp3" relative path

test('cryCandidates: base species resolves to its local cry first', async () => {
  const { engine } = await loadEngine();
  const list = engine.cryCandidates('Pikachu');
  assert.equal(list[0], 'music/cries/pikachu.mp3');
  assert.ok(existsSync(cryPath(list[0])), 'pikachu.mp3 is vendored');
});

test('cryCandidates: Goodra-Hisui falls back to the local base cry before the CDN', async () => {
  const { engine } = await loadEngine();
  const list = engine.cryCandidates('Goodra-Hisui');
  assert.equal(list[0], 'music/cries/goodra-hisui.mp3', 'exact forme cry tried first');
  assert.equal(list[1], 'music/cries/goodra.mp3', 'base species local cry is next');
  assert.ok(existsSync(cryPath(list[1])), 'base goodra.mp3 is vendored');
  // The single CDN entry must be dead-last (local-first), and never reached when base exists.
  const cdn = list.filter((u) => u.startsWith('http'));
  assert.equal(cdn.length, 1);
  assert.equal(list[list.length - 1], cdn[0]);
});

test('cryCandidates: multi-word forme (Darmanitan-Galar-Zen) strips down to the base', async () => {
  const { engine } = await loadEngine();
  const list = engine.cryCandidates('Darmanitan-Galar-Zen');
  assert.ok(list.includes('music/cries/darmanitan.mp3'), 'reaches base darmanitan cry');
  assert.ok(existsSync(cryPath('music/cries/darmanitan.mp3')));
});

test('cryCandidates: aliased base id (Mr. Mime-Galar → mrmime) resolves locally', async () => {
  const { engine } = await loadEngine();
  const list = engine.cryCandidates('Mr. Mime-Galar');
  assert.ok(list.includes('music/cries/mrmime.mp3'), 'reaches aliased mrmime cry');
  assert.ok(existsSync(cryPath('music/cries/mrmime.mp3')));
});

test('cryCandidates: gimmick suffixes share the base cry', async () => {
  const { engine } = await loadEngine();
  for (const name of ['Charizard-Mega-Y', 'Venusaur-Gmax', 'Groudon-Primal']) {
    const list = engine.cryCandidates(name);
    assert.ok(existsSync(cryPath(list[0])), `${name} first candidate ${list[0]} is vendored`);
  }
});

test('cryCandidates: CDN fallback uses hyphen-free Showdown cry id', async () => {
  const { engine } = await loadEngine();
  const cdn = engine.cryCandidates('Goodra-Hisui').find((u) => u.startsWith('http'));
  assert.equal(cdn, 'https://play.pokemonshowdown.com/audio/cries/goodrahisui.mp3');
});

// Class-wide guard: every forme whose exact cry is absent must reach a vendored local cry
// somewhere in its chain (i.e. the base-species fallback genuinely exists on disk).
test('cryCandidates: all known formes terminate at a vendored local cry', async () => {
  const { engine } = await loadEngine();
  const formes = [
    'Goodra-Hisui', 'Moltres-Galar', 'Articuno-Galar', 'Zapdos-Galar', 'Arcanine-Hisui',
    'Decidueye-Hisui', 'Typhlosion-Hisui', 'Samurott-Hisui', 'Sneasel-Hisui', 'Zorua-Hisui',
    'Vulpix-Alola', 'Ninetales-Alola', 'Raichu-Alola', 'Marowak-Alola', 'Meowth-Galar',
    'Slowbro-Galar', 'Slowking-Galar', 'Weezing-Galar', 'Wooper-Paldea', 'Necrozma-Ultra',
    'Greninja-Ash', 'Keldeo-Resolute', 'Meloetta-Pirouette', 'Giratina-Origin', 'Darmanitan-Galar-Zen',
  ];
  for (const name of formes) {
    const local = engine.cryCandidates(name).filter((u) => !u.startsWith('http'));
    const hit = local.find((u) => existsSync(cryPath(u)));
    assert.ok(hit, `${name} has no vendored local cry in its chain: ${local.join(', ')}`);
  }
});
