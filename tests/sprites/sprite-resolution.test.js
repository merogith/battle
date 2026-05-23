// Tests for getSprite() / toShowdownSpriteId() / handleSpriteError() —
// the sprite resolution layer in battle.html.

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..');
const HTML = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');

function extractSpriteSection() {
  const startMarker = 'const _spriteCache = {};';
  const startIdx = HTML.indexOf(startMarker);
  assert.ok(startIdx >= 0, 'cannot find _spriteCache declaration');
  const handleStart = HTML.indexOf('function handleSpriteError(img)', startIdx);
  let depth = 0;
  let i = HTML.indexOf('{', handleStart);
  for (; i < HTML.length; i++) {
    if (HTML[i] === '{') depth++;
    else if (HTML[i] === '}') {
      depth--;
      if (depth === 0) return HTML.slice(startIdx, i + 1);
    }
  }
  throw new Error('could not find end of handleSpriteError');
}

function makeContext(baseStats = {}) {
  const sandbox = {
    baseStats,
    Image: class { constructor() {} set src(_) {} },
    console,
  };
  const ctx = vm.createContext(sandbox);
  const out = vm.runInContext(
    extractSpriteSection() +
    '\n; ({ getSprite, handleSpriteError, toShowdownSpriteId, LOCAL_SPRITE_MANIFEST, FORM_DEX_IDS, SPRITE_ID_ALIASES, _spriteCache });',
    ctx,
  );
  return out;
}

test('slug normalization handles common edge cases', () => {
  const { toShowdownSpriteId } = makeContext();
  assert.strictEqual(toShowdownSpriteId('Charizard-Mega-X'), 'charizard-megax');
  assert.strictEqual(toShowdownSpriteId('Mewtwo-Mega-Y'), 'mewtwo-megay');
  assert.strictEqual(toShowdownSpriteId('Tapu Koko'), 'tapukoko');
  assert.strictEqual(toShowdownSpriteId('Mr. Mime'), 'mrmime');
  assert.strictEqual(toShowdownSpriteId('Farfetch’d'), 'farfetchd');
  assert.strictEqual(toShowdownSpriteId('Flabébé'), 'flabebe');
  assert.strictEqual(toShowdownSpriteId('Eternatus-Gmax'), 'eternatus-eternamax');
});

test('mega sprites resolve to local paths', () => {
  const s = makeContext();
  const cases = [
    ['Venusaur-Mega', false, false, 'sprites/gen5ani/venusaur-mega.gif'],
    ['Charizard-Mega-X', false, false, 'sprites/gen5ani/charizard-megax.gif'],
    ['Charizard-Mega-X', true, false, 'sprites/gen5ani-shiny/charizard-megax.gif'],
    ['Charizard-Mega-X', false, true, 'sprites/gen5ani-back/charizard-megax.gif'],
    ['Charizard-Mega-X', true, true, 'sprites/gen5ani-back-shiny/charizard-megax.gif'],
    ['Mewtwo-Mega-X', false, false, 'sprites/gen5ani/mewtwo-megax.gif'],
    ['Mewtwo-Mega-Y', false, false, 'sprites/gen5ani/mewtwo-megay.gif'],
    ['Rayquaza-Mega', false, false, 'sprites/gen5ani/rayquaza-mega.gif'],
    ['Groudon-Primal', false, false, 'sprites/gen5ani/groudon-primal.gif'],
    ['Kyogre-Primal', false, false, 'sprites/gen5ani/kyogre-primal.gif'],
  ];
  for (const [name, shiny, back, expected] of cases) {
    Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
    assert.strictEqual(s.getSprite(name, shiny, back), expected, `${name} shiny=${shiny} back=${back}`);
  }
});

test('gmax sprites resolve to local paths', () => {
  const s = makeContext();
  const cases = [
    ['Pikachu-Gmax', false, false, 'sprites/gen5ani/pikachu-gmax.gif'],
    ['Pikachu-Gmax', true, false, 'sprites/gen5ani-shiny/pikachu-gmax.gif'],
    ['Charizard-Gmax', false, false, 'sprites/gen5ani/charizard-gmax.gif'],
    ['Snorlax-Gmax', false, false, 'sprites/gen5ani/snorlax-gmax.gif'],
    ['Eevee-Gmax', false, false, 'sprites/gen5ani/eevee-gmax.gif'],
    ['Eternatus-Gmax', false, false, 'sprites/gen5ani/eternatus-eternamax.gif'],
    ['Eternatus-Eternamax', false, false, 'sprites/gen5ani/eternatus-eternamax.gif'],
    ['Urshifu-Rapid-Strike-Gmax', false, false, 'sprites/gen5ani/urshifu-rapidstrike-gmax.gif'],
    ['Toxtricity-Low-Key-Gmax', false, false, 'sprites/gen5ani/toxtricity-lowkey-gmax.gif'],
  ];
  for (const [name, shiny, back, expected] of cases) {
    Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
    assert.strictEqual(s.getSprite(name, shiny, back), expected, `${name} shiny=${shiny} back=${back}`);
  }
});

test('base species sprites resolve to local when present', () => {
  const s = makeContext();
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  assert.strictEqual(s.getSprite('Charizard', false, false), 'sprites/gen5ani/charizard.gif');
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  assert.strictEqual(s.getSprite('Pikachu', false, false), 'sprites/gen5ani/pikachu.gif');
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  assert.strictEqual(s.getSprite('Mr. Mime', false, false), 'sprites/gen5ani/mrmime.gif');
});

test('base species back sprites fall through to Showdown URL (not bundled locally)', () => {
  const s = makeContext();
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  const url = s.getSprite('Charizard', false, true);
  assert.ok(url.startsWith('https://play.pokemonshowdown.com/sprites/gen5ani-back/'), `expected Showdown URL, got ${url}`);
});

test('unknown species falls through to Showdown URL', () => {
  const s = makeContext();
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  const url = s.getSprite('NoSuchPokemon', false, false);
  assert.ok(url.startsWith('https://play.pokemonshowdown.com/sprites/gen5ani/'), `expected Showdown URL, got ${url}`);
});

test('FORM_DEX_IDS covers every Mega/Primal/Gmax form in MEGA_FORM_NAMES and GMAX_SPECIES', () => {
  const s = makeContext();
  const ids = s.FORM_DEX_IDS;
  const megaPairs = [...HTML.matchAll(/"([^"]+?)"\s*:\s*"([^"]+(?:-Mega(?:-[XY])?|-Primal))"/g)];
  for (const [, , form] of megaPairs) {
    const slug = s.toShowdownSpriteId(form);
    if (slug === 'crucibelle-mega') continue;
    assert.ok(ids[slug] > 0, `FORM_DEX_IDS missing entry for ${form} (slug=${slug})`);
  }
  const gmaxSet = HTML.match(/const GMAX_SPECIES = new Set\(\[([\s\S]*?)\]\);/)[1];
  const speciesList = [...gmaxSet.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  for (const sp of speciesList) {
    const slug = s.toShowdownSpriteId(`${sp}-Gmax`);
    if (slug === 'eternatus-gmax') continue;
    assert.ok(ids[slug] > 0, `FORM_DEX_IDS missing entry for ${sp}-Gmax (slug=${slug})`);
  }
});

test('LOCAL_SPRITE_MANIFEST matches sprites on disk', () => {
  const s = makeContext();
  const dirs = ['gen5ani', 'gen5ani-shiny', 'gen5ani-back', 'gen5ani-back-shiny'];
  for (const d of dirs) {
    const onDisk = fs.readdirSync(path.join(ROOT, 'sprites', d))
      .filter(f => f.endsWith('.gif'))
      .map(f => f.slice(0, -4));
    const inManifest = s.LOCAL_SPRITE_MANIFEST[d];
    assert.ok(inManifest, `manifest missing directory ${d}`);
    assert.strictEqual(inManifest.size, onDisk.length, `manifest count mismatch for ${d}`);
    for (const slug of onDisk) {
      assert.ok(inManifest.has(slug), `manifest missing ${d}/${slug}`);
    }
  }
});

test('handleSpriteError falls back from local → Showdown → PokeAPI form-id and terminates', () => {
  const s = makeContext({
    'Charizard-Mega-X': { dex: 6 },
    'Charizard': { dex: 6 },
  });
  const img = {
    src: 'sprites/gen5ani/charizard-megax.gif',
    alt: 'Charizard-Mega-X',
    dataset: { shiny: 'false', back: 'false' },
  };
  const expected = [
    /pokemonshowdown\.com\/sprites\/gen5ani\/charizard-megax\.gif/,
    /\/xyani\/charizard-megax\.gif/,
    /\/sprites\/ani\/charizard-megax\.gif/,
    /PokeAPI.+?\/other\/showdown\/10034\.gif/,
    /\/sprites\/gen5\/charizard-megax\.png/,
    /PokeAPI.+?\/sprites\/pokemon\/10034\.png/,
    /\/sprites\/gen5\/charizard\.png/, // base species terminus
  ];
  for (const re of expected) {
    s.handleSpriteError(img);
    assert.match(img.src, re);
  }
  // Chain must terminate at base species static — no further mutation.
  const terminus = img.src;
  s.handleSpriteError(img);
  assert.strictEqual(img.src, terminus, 'chain should terminate at base species static');
});

test('handleSpriteError uses correct form-dex ID for shiny back variants', () => {
  const s = makeContext({});
  const img = {
    src: 'https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu-gmax.gif',
    alt: 'Pikachu-Gmax',
    dataset: { shiny: 'true', back: 'true' },
  };
  s.handleSpriteError(img);
  assert.match(img.src, /\/other\/showdown\/back\/shiny\/10199\.gif/);
});
