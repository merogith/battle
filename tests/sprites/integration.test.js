// End-to-end integration: parse battle.html in jsdom, polyfill missing browser APIs,
// and verify every Mega / Primal / Gmax form resolves to a working local sprite path.

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..');
const require = createRequire(import.meta.url);

// jsdom is in the root node_modules; explicitly point Node's resolver at it.
process.env.NODE_PATH = path.join(ROOT, 'node_modules');
require('module').Module._initPaths();
const { JSDOM, VirtualConsole } = require('jsdom');

function loadGameWindow() {
  const html = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');
  // Strip external <script src> tags — we only want the inline sprite block to run.
  const stubbed = html.replace(/<script[^>]*src=[^>]*><\/script>/g, '');
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (err) => errors.push(err && err.message || String(err)));
  const dom = new JSDOM(stubbed, {
    url: 'http://localhost:5173/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      // Browser API polyfills jsdom lacks
      window.matchMedia = (q) => ({
        matches: false, addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
      });
      window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
      window.cancelAnimationFrame = clearTimeout;
      window.IntersectionObserver = class { constructor() {} observe() {} disconnect() {} unobserve() {} };
      window.ResizeObserver = class { constructor() {} observe() {} disconnect() {} unobserve() {} };
    },
  });
  return { dom, errors };
}

test('every Mega form resolves to a local sprite path', async () => {
  const { dom } = loadGameWindow();
  await new Promise((r) => setTimeout(r, 1500));
  const w = dom.window;
  // Pull the canonical lists out of the game itself.
  const megaForms = w.eval('Object.values(MEGA_FORM_NAMES)');
  // The single CAP that has no PokeAPI sprite — game falls through to Showdown URL.
  const expectedRemote = new Set(['Crucibelle-Mega']);
  for (const form of megaForms) {
    const url = w.eval(`getSprite(${JSON.stringify(form)}, false, false)`);
    w.eval('for (let k in _spriteCache) delete _spriteCache[k];');
    if (expectedRemote.has(form)) {
      assert.ok(url.startsWith('https://'), `expected remote URL for CAP form ${form}, got ${url}`);
    } else {
      assert.ok(url.startsWith('sprites/gen5ani/'), `expected local path for ${form}, got ${url}`);
      const onDisk = path.join(ROOT, url);
      assert.ok(fs.existsSync(onDisk), `${url} not on disk (file: ${onDisk})`);
    }
  }
  dom.window.close();
});

test('every Gmax form resolves to a local sprite path (front + shiny)', async () => {
  const { dom } = loadGameWindow();
  await new Promise((r) => setTimeout(r, 1500));
  const w = dom.window;
  const gmaxNames = w.eval('Array.from(GMAX_SPECIES)');
  for (const species of gmaxNames) {
    const form = `${species}-Gmax`;
    for (const shiny of [false, true]) {
      const url = w.eval(`getSprite(${JSON.stringify(form)}, ${shiny}, false)`);
      w.eval('for (let k in _spriteCache) delete _spriteCache[k];');
      const expectedDir = shiny ? 'gen5ani-shiny' : 'gen5ani';
      assert.ok(url.startsWith(`sprites/${expectedDir}/`), `expected ${expectedDir} path for ${form} shiny=${shiny}, got ${url}`);
      const onDisk = path.join(ROOT, url);
      assert.ok(fs.existsSync(onDisk), `${url} not on disk`);
    }
  }
  dom.window.close();
});

test('manifest counts match disk for all four sprite directories', async () => {
  const { dom } = loadGameWindow();
  await new Promise((r) => setTimeout(r, 1500));
  const w = dom.window;
  for (const d of ['gen5ani', 'gen5ani-shiny', 'gen5ani-back', 'gen5ani-back-shiny']) {
    const manifestSize = w.eval(`LOCAL_SPRITE_MANIFEST[${JSON.stringify(d)}].size`);
    const diskSize = fs.readdirSync(path.join(ROOT, 'sprites', d)).filter((f) => f.endsWith('.gif')).length;
    assert.strictEqual(manifestSize, diskSize, `manifest/disk mismatch for ${d}`);
  }
  dom.window.close();
});
