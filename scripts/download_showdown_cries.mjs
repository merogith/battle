/**
 * One-off: mirror https://play.pokemonshowdown.com/audio/cries/*.mp3 into music/cries/
 * Run: node scripts/download_showdown_cries.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'music', 'cries');
const BASE = 'https://play.pokemonshowdown.com/audio/cries/';

const UA = { 'User-Agent': 'PBS-cry-mirror/1.0' };

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: UA }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchText(new URL(res.headers.location, url).href));
      }
      const ch = [];
      res.on('data', (c) => ch.push(c));
      res.on('end', () => resolve(Buffer.concat(ch).toString('utf8')));
    });
    req.on('error', reject);
  });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: UA }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchBuffer(new URL(res.headers.location, url).href));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const ch = [];
      res.on('data', (c) => ch.push(c));
      res.on('end', () => resolve(Buffer.concat(ch)));
    }).on('error', reject);
  });
}

function extractMp3Urls(html) {
  const set = new Set();
  const re = /href="([^"]+\.mp3)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const base = path.basename(m[1].split('?')[0]);
    if (/^[a-z0-9-]+\.mp3$/i.test(base)) set.add(base.toLowerCase());
  }
  return [...set].sort();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const html = await fetchText(BASE);
  const files = extractMp3Urls(html);
  if (files.length < 100) {
    console.error('Expected many mp3 names; got', files.length, '- index parse may have failed.');
  }
  let ok = 0;
  let skip = 0;
  let fail = 0;
  const missed = [];
  for (const name of files) {
    const dest = path.join(OUT, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      skip++;
      continue;
    }
    const url = BASE + name;
    try {
      const buf = await fetchBuffer(url);
      fs.writeFileSync(dest, buf);
      ok++;
    } catch (e) {
      missed.push(name);
      fail++;
    }
    if ((ok + skip + fail) % 200 === 0) {
      process.stdout.write(`\r  ${ok + skip + fail}/${files.length} ...`);
    }
  }
  console.log(`\nDone. downloaded=${ok} skipped=${skip} failed=${fail}`);
  if (missed.length) {
    const p = path.join(ROOT, 'music', 'cries', '_missed.txt');
    fs.writeFileSync(p, missed.join('\n') + '\n', 'utf8');
    console.log('Wrote', p);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
