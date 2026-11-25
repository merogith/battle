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
const species = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/species.json'), 'utf8'))['9'])
  .filter(entry => entry.num > 0 && entry.baseStats);

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

function makeContext() {
  const sandbox = {
    console,
  };
  const ctx = vm.createContext(sandbox);
  const out = vm.runInContext(
    extractSpriteSection() +
    '\n; ({ getSprite, handleSpriteError, hasDistinctCosmeticSprite, toShowdownSpriteId, LOCAL_SPRITE_MANIFEST, FORM_DEX_IDS, _spriteCache });',
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

test('base species back sprites resolve to local when bundled', () => {
  // Back + back-shiny sprites for base species are now vendored locally (Q3:
  // full back-sprite coverage). getSprite must prefer the on-disk gif.
  const s = makeContext();
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  assert.strictEqual(s.getSprite('Charizard', false, true), 'sprites/gen5ani-back/charizard.gif');
  Object.keys(s._spriteCache).forEach(k => delete s._spriteCache[k]);
  assert.strictEqual(s.getSprite('Charizard', true, true), 'sprites/gen5ani-back-shiny/charizard.gif');
});

test('Own Tempo Rockruff uses its bundled artwork in every orientation', () => {
  const { getSprite } = makeContext();
  for (const shiny of [false, true]) for (const back of [false, true]) {
    const art = getSprite('Rockruff-Dusk', shiny, back);
    assert.strictEqual(art, getSprite('Rockruff', shiny, back));
    assert.ok(fs.existsSync(path.join(ROOT, art)), art);
  }
});

test('missing backs use the same local front art and preserve shiny coloring', () => {
  const s = makeContext();
  s.LOCAL_SPRITE_MANIFEST['gen5ani-back'].delete('charizard');
  s.LOCAL_SPRITE_MANIFEST['gen5ani-back-shiny'].delete('charizard');
  assert.strictEqual(s.getSprite('Charizard', false, true), 'sprites/gen5ani/charizard.gif');
  assert.strictEqual(s.getSprite('Charizard', true, true), 'sprites/gen5ani-shiny/charizard.gif');
});

test('an unknown form uses the local unavailable art instead of the base species', () => {
  const s = makeContext();
  for (const dir of Object.values(s.LOCAL_SPRITE_MANIFEST)) dir.delete('moltres-galar');
  assert.strictEqual(s.getSprite('Moltres-Galar', false, false), 'sprites/placeholder.svg');
  assert.strictEqual(s.getSprite('NoSuchPokemon', true, true), 'sprites/placeholder.svg');
});

test('only visible cosmetic differences can be offered as a rare skin', () => {
  const s = makeContext();
  assert.ok(s.hasDistinctCosmeticSprite('Pikachu', 'Pikachu-World'));
  assert.ok(!s.hasDistinctCosmeticSprite('Rockruff', 'Rockruff-Dusk'));
  assert.ok(!s.hasDistinctCosmeticSprite('Pikachu', 'Pikachu-Missing'));
});

test('every supported regional variant ships its own art for all four orientations', () => {
  const { getSprite, toShowdownSpriteId } = makeContext();
  const regional = species.filter(({ name }) => /-(?:Alola|Galar|Hisui|Paldea)(?:-|$)/.test(name));
  assert.ok(regional.length >= 50);
  for (const { name, baseSpecies } of regional) {
    const slug = toShowdownSpriteId(name);
    assert.notStrictEqual(slug, toShowdownSpriteId(baseSpecies), name);
    for (const [shiny, back, dir] of [
      [false, false, 'gen5ani'], [true, false, 'gen5ani-shiny'],
      [false, true, 'gen5ani-back'], [true, true, 'gen5ani-back-shiny'],
    ]) {
      const expected = `sprites/${dir}/${slug}.gif`;
      assert.strictEqual(getSprite(name, shiny, back), expected, name);
      assert.ok(fs.existsSync(path.join(ROOT, expected)), expected);
    }
  }
});

test('every selectable species or form resolves to a bundled path in every orientation', () => {
  const { getSprite } = makeContext();
  for (const { name } of species) {
    for (const back of [true, false]) {
      for (const shiny of [true, false]) {
        const localPath = getSprite(name, shiny, back);
        assert.match(localPath, /^sprites\//, name);
        assert.ok(fs.existsSync(path.join(ROOT, localPath)), localPath);
      }
    }
  }
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

test('a failed local image uses same-form art and leaves the shared resolver intact', () => {
  const s = makeContext();
  const expectedBack = s.getSprite('Charizard-Mega-X', true, true);
  const onerror = () => {};
  const img = {
    src: expectedBack,
    alt: 'Charizard',
    onerror,
  };
  for (const expected of [
    'sprites/gen5ani-shiny/charizard-megax.gif',
    'sprites/gen5ani/charizard-megax.gif',
    'sprites/placeholder.svg',
    'sprites/placeholder.svg',
  ]) {
    s.handleSpriteError(img);
    assert.strictEqual(img.src, expected);
  }
  assert.strictEqual(img.onerror, onerror);
  assert.strictEqual(s.getSprite('Charizard-Mega-X', true, true), expectedBack);
});

test('a stale error event leaves a new pending sprite alone', () => {
  const s = makeContext();
  const img = {
    src: 'https://example.test/sprites/gen5ani-back/charizard-megax.gif',
    currentSrc: 'https://example.test/sprites/gen5ani-back/charizard.gif',
    complete: false,
  };
  const pending = img.src;
  s.handleSpriteError(img);
  assert.strictEqual(img.src, pending);
});
