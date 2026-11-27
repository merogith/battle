import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const verify = path.join(root, 'scripts/build-release.mjs');
const version = 'battle-v5-aaaaaaaaaaaa';
const document = '<link rel="stylesheet" href="home-menu.css">';
const stylesheet = 'body { background: url("sprites/placeholder.svg"); }';
const worker = `const CACHE_VERSION = '${version}';
const SHELL = ['./', 'index.html', 'battle.html', 'competitive/index.html', 'manifest.webmanifest', 'home-menu.css'];
const LAZY_CODE = new Set(['competitive/showdown-worker.js']);`;
const files = {
  'index.html': document,
  'battle.html': '',
  'competitive/index.html': '',
  'competitive/showdown-worker.js': '',
  'home-menu.css': stylesheet,
  'manifest.webmanifest': '{"start_url":"./"}',
  'sprites/manifest.json': '{}',
  'sprites/compact-frames.bin': '\0\0\0\x02{}',
  'sprites/placeholder.svg': '<svg/>',
  'world-presentation.js': 'window.WorldPresentation = { city(){}, route(){}, facility(){} };',
  'sw.js': worker,
};
const hash = contents => createHash('sha1').update(contents).digest('hex').slice(0, 16);

function packageFiles(directory, payload) {
  const entries = Object.entries(payload);
  for (const [relative, contents] of entries) {
    const target = path.join(directory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  for (const relative of ['ATTRIBUTION.md', 'LICENSE', '.nojekyll']) {
    if (fs.existsSync(path.join(root, relative))) fs.writeFileSync(path.join(directory, relative), '');
  }
  const listed = entries.map(([u, contents]) => ({
    u, h: hash(contents), b: Buffer.byteLength(contents), ...(u === 'sprites/compact-frames.bin' ? { p: 'compact' } : {}),
  }));
  const digest = hash(listed.map(file => `${file.u}:${file.h}`).join('\n'));
  const totalBytes = listed.reduce((n, file) => n + file.b, 0);
  fs.writeFileSync(path.join(directory, 'offline-assets.json'), JSON.stringify({
    version, digest, files: listed, fileCount: listed.length, totalBytes,
  }));
  fs.writeFileSync(path.join(directory, 'release.json'), JSON.stringify({ version, digest, files: listed.length }));
}

test('artifact verification rejects missing reachable CSS and artwork even with consistent hashes', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'release-closure-'));
  try {
    const variants = [
      ['complete', null, null],
      ['missing-style', 'home-menu.css', 'Missing release dependency: index.html → home-menu.css'],
      ['missing-art', 'sprites/placeholder.svg', 'Missing release dependency: home-menu.css → sprites/placeholder.svg'],
    ];
    for (const [kind, omitted, message] of variants) {
      const directory = path.join(base, kind);
      const payload = { ...files };
      if (omitted) delete payload[omitted];
      packageFiles(directory, payload);
      const result = spawnSync(process.execPath, [verify, '--verify', '--out-dir', directory], { encoding: 'utf8' });
      assert.equal(result.status, omitted ? 1 : 0, result.stderr);
      if (message) assert.ok(result.stderr.includes(message), result.stderr);
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
