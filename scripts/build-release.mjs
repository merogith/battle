// Build an allowlisted, hash-verified Pages artifact. Development and test files never ship.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  verify: { type: 'boolean' },
  'out-dir': { type: 'string' },
} });
const { verify, 'out-dir': outputDirectory } = values;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = outputDirectory === undefined ? path.join(root, 'dist') : path.resolve(root, outputDirectory);
const source = verify ? out : root;
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'offline-assets.json'), 'utf8'));
const allowed = /^(?:battle\.html|battle-(?:motion|move-profiles|encounter-profiles)\.js|index\.html|manifest\.webmanifest|online-(?:config|pvp)\.js|move-(?:anim|sfx)-map\.js|game-update\.js|game-upgrades\.(?:js|css)|sw\.js|competitive\/(?:index\.html|arena\.css|arena\.js|arena-client\.js|showdown-worker\.js|classic-simulation\.js|showdown-engine\.js|THIRD_PARTY_NOTICES\.txt)|(?:sprites|music|data|fonts|icons|vendor)\/[^\0]+)$/;
const publishedFiles = new Set();
const metadata = { version: manifest.version, digest: manifest.digest, files: manifest.fileCount };
let totalBytes = 0;

for (const file of manifest.files) {
  const relative = decodeURI(file.u);
  if (!allowed.test(relative) || relative.split('/').includes('..')) {
    throw new Error(`Unapproved release path: ${relative}`);
  }
  if (publishedFiles.has(relative)) throw new Error(`Duplicate release path: ${relative}`);
  publishedFiles.add(relative);
  const bytes = fs.readFileSync(path.join(source, relative));
  totalBytes += bytes.length;
  const hash = crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 16);
  if (hash !== file.h || bytes.length !== file.b) {
    const hint = verify ? 'Rebuild and re-test the artifact.' : 'Run npm run offline:manifest.';
    throw new Error(`Stale release manifest: ${relative}. ${hint}`);
  }
}

if (publishedFiles.size !== manifest.fileCount) throw new Error('Invalid release manifest file count');
if (totalBytes !== manifest.totalBytes) throw new Error('Invalid release manifest byte count');
const digest = crypto.createHash('sha1')
  .update(manifest.files.map(file => `${file.u}:${file.h}`).join('\n')).digest('hex').slice(0, 16);
if (digest !== manifest.digest) throw new Error('Invalid release manifest digest');
const worker = fs.readFileSync(path.join(source, 'sw.js'), 'utf8');
const workerVersion = worker.match(/const CACHE_VERSION = '([^']+)';/)?.[1];
if (!publishedFiles.has('sw.js') || !workerVersion || workerVersion !== manifest.version) {
  throw new Error('Service worker version does not match the release manifest');
}
const supplementalFiles = ['offline-assets.json', 'ATTRIBUTION.md', 'LICENSE', '.nojekyll'].filter(name =>
  fs.existsSync(path.join(root, name)));
if (verify) {
  const actual = JSON.parse(fs.readFileSync(path.join(out, 'release.json'), 'utf8'));
  if (Object.keys(metadata).some(key => actual[key] !== metadata[key])) {
    throw new Error('The tested release metadata does not match its manifest');
  }
  for (const name of supplementalFiles) {
    if (!fs.existsSync(path.join(out, name))) throw new Error(`Missing release file: ${name}`);
  }
  const expectedFiles = new Set([...publishedFiles, ...supplementalFiles, 'release.json']);
  for (const relative of fs.readdirSync(out, { recursive: true })) {
    if (!fs.statSync(path.join(out, relative)).isDirectory() && !expectedFiles.has(relative.split(path.sep).join('/'))) {
      throw new Error(`Unexpected file in the tested artifact: ${relative}`);
    }
  }
} else {
  if (outputDirectory === undefined) fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out);
  for (const relative of publishedFiles) {
    const target = path.join(out, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relative), target);
  }
  for (const name of supplementalFiles) {
    fs.copyFileSync(path.join(root, name), path.join(out, name));
  }
  fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify(metadata, null, 2) + '\n');
}
console.log(`Verified ${manifest.fileCount} files; Pages artifact: ${path.relative(root, out)}/ (${manifest.version})`);
