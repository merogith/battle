import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const gameOrigin = 'https://artifact.invalid/battle/';
const documents = ['index.html', 'battle.html', 'competitive/index.html'];
const appFiles = /^(?!vendor\/).+\.(?:js|html|css)$/;
const mediaPaths = /['"`]((?:\.\.?\/)*(?:sprites|music|data|fonts|icons|vendor|competitive)\/[^'"`$<>{}?\r\n]*\.(?:html|js|css|txt|svg|png|jpg|jpeg|webp|gif|mp3|m4a|ogg|wav|woff2?|ttf|json|csv|bin))['"`]/gi;
const compactArchive = 'sprites/compact-frames.bin';

export function offlinePack(relative) {
  if (relative === compactArchive) return 'compact';
  if (/^sprites\/gen5ani(?:-back)?(?:-shiny)?\//.test(relative)
      || /^music\/(?:battle_anims\/|background\/background[123]\.mp3$|themes\/Theme[134]\.mp3$)/.test(relative)) return 'full';
  return undefined;
}

function resolveReference(raw, from) {
  if (!raw || /[\$`{}'"]|^#|^javascript:/i.test(raw)) return null;
  const url = new URL(raw, new URL(from, gameOrigin));
  if (url.origin !== 'https://artifact.invalid') return null;
  if (!url.href.startsWith(gameOrigin)) throw new Error(`Release reference leaves the game: ${from} → ${raw}`);
  const prefix = new URL(gameOrigin).pathname;
  const relative = decodeURI(url.pathname.slice(prefix.length));
  return !relative || relative.endsWith('/') ? relative + 'index.html' : relative;
}

function matches(text, regex) {
  return [...text.matchAll(regex)].map(match => match[1]);
}

export function verifyReleaseGraph(directory, published) {
  const read = file => fs.readFileSync(path.join(directory, file), 'utf8');
  const existsInRelease = file => published.has(file) || file === 'offline-assets.json';
  const references = new Set();
  const issues = new Set();
  const requireReference = (raw, from, required = false) => {
    const target = resolveReference(raw, from);
    if (target === null) return;
    references.add(target);
    if (!existsInRelease(target)) issues.add(`Missing release dependency: ${from} → ${target}`);
    if (required && !shell.has(target) && !target.startsWith('data/') && !lazy.has(target)) {
      issues.add(`Missing offline boot dependency: ${from} → ${target}`);
    }
  };
  const worker = read('sw.js');
  const list = (name, regex) => {
    const declaration = worker.match(regex)?.[1];
    if (!declaration) throw new Error(`Missing service worker ${name} declaration`);
    return new Set(matches(declaration, /['"]([^'"]+)['"]/g));
  };
  const shell = list('shell', /const SHELL\s*=\s*\[([^\]]+)\]/);
  const lazy = list('lazy code', /const LAZY_CODE\s*=\s*new Set\(\[([^\]]+)\]\)/);
  for (const document of documents) requireReference(document, 'sw.js', true);
  for (const resource of [...shell, ...lazy]) requireReference(resource, 'sw.js');
  requireReference('manifest.webmanifest', 'index.html', true);

  for (const file of [...published].filter(file => appFiles.test(file))) {
    const code = read(file);
    if (file.endsWith('.html')) {
      const html = code.replace(/<!--[^]*?-->/g, '');
      for (const tag of html.matchAll(/<(script|link|a|img|source|audio|video|track)\b([^>]+)>/gi)) {
        for (const attribute of tag[2].matchAll(/\s(?:src|href|poster)\s*=\s*(['"])(.*?)\1/gi)) {
          const boot = tag[1] === 'script' || (tag[1] === 'link' && /\bstylesheet\b/.test(tag[2]));
          requireReference(attribute[2], file, boot);
        }
      }
    }
    if (!file.endsWith('.js')) {
      for (const resource of matches(code, /\burl\(\s*['"]?([^)'"]+)['"]?\s*\)/g)) {
        if (!/[\$`{}+]/.test(resource)) requireReference(resource.trim(), file);
      }
    }
    if (file.endsWith('.css')) {
      for (const resource of matches(code, /@import\s+['"]([^'"]+)['"]/g)) requireReference(resource, file, true);
      continue;
    }
    for (const resource of matches(code, /(?:\bfrom |\bimport\s*\(?\s*|\bnew (?:URL|Worker)\(\s*|\bimportScripts\(\s*|\.src\s*=\s*)['"]((?:\.\.?\/)*[a-zA-Z0-9_.\/-]+\.js)['"]/g)) {
      requireReference(resource, file, resource !== 'sw.js');
    }
    for (const resource of matches(code, mediaPaths)) {
      requireReference(resource, file.startsWith('data/') && !resource.startsWith('.') ? 'battle.html' : file);
    }
    if (file === 'battle.html') {
      for (const name of matches(code, /\b(?:required|optional)\('([a-z][\w/-]+)'[,)]/g)) {
        requireReference(`data/${name}.json`, file, true);
      }
    }
  }

  const webManifest = JSON.parse(read('manifest.webmanifest'));
  for (const target of [webManifest.start_url, ...(webManifest.icons || []).map(icon => icon.src)]) {
    requireReference(target, 'manifest.webmanifest');
  }
  const spriteManifest = 'sprites/manifest.json';
  requireReference(spriteManifest, 'battle.html');
  requireReference(compactArchive, 'sw.js');
  const spriteFiles = new Set();
  for (const [directory, entries] of Object.entries(JSON.parse(read(spriteManifest)))) {
    for (const sprite of entries) {
      const file = `sprites/${directory}/${sprite}.gif`;
      spriteFiles.add(file);
      requireReference(`${directory}/${sprite}.gif`, spriteManifest);
    }
  }
  if (published.has(compactArchive)) verifyCompactArchive(path.join(directory, compactArchive), spriteFiles);
  const presentation = 'world-presentation.js';
  const profileSource = read(presentation);
  const browser = Object.create(null);
  vm.runInNewContext(`const window = globalThis.window = Object.create(null);\n${profileSource}`, browser, {
    filename: presentation, timeout: 1000, contextCodeGeneration: { strings: false, wasm: false },
  });
  const world = browser.window.WorldPresentation;
  const facilities = matches(profileSource, /scene\('([^']+)',/g);
  for (const lookup of [world.city, world.route]) {
    for (let index = 0; index <= 9; index++) {
      const profile = lookup(index);
      if (profile) for (const key of ['background', 'fallback', 'ambience', 'cue']) requireReference(profile[key], presentation);
    }
  }
  for (const id of facilities) {
    const profile = world.facility(id);
    if (profile) for (const key of ['background', 'fallback', 'ambience', 'cue']) requireReference(profile[key], presentation);
  }
  if (issues.size) throw new Error([...issues].join('\n'));
  return references;
}

function verifyCompactArchive(filename, spriteFiles) {
  const file = fs.openSync(filename);
  try {
    const header = Buffer.alloc(4);
    const size = fs.fstatSync(file).size;
    if (fs.readSync(file, header, 0, header.length, 0) !== header.length) throw new Error('Compact sprite index is missing');
    const indexBytes = header.readUInt32BE(0);
    if (!indexBytes || indexBytes > 1024 * 1024 || indexBytes + header.length > size) throw new Error('Invalid compact sprite index');
    const json = Buffer.alloc(indexBytes);
    if (fs.readSync(file, json, 0, json.length, header.length) !== json.length) throw new Error('Incomplete compact sprite index');
    const entries = JSON.parse(json.toString());
    if (Object.keys(entries).length !== spriteFiles.size) throw new Error('Compact and full sprite counts differ');
    for (const sprite of spriteFiles) {
      const frame = entries[sprite];
      const [offset, bytes] = Array.isArray(frame) ? frame : [];
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(bytes) || bytes <= 0
          || header.length + indexBytes + offset + bytes > size) throw new Error(`Invalid compact sprite: ${sprite}`);
    }
  } finally {
    fs.closeSync(file);
  }
}
