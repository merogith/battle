/**
 * Mirror move category PNGs from Pokémon Showdown into icons/categories/.
 * Source: https://play.pokemonshowdown.com/sprites/categories/
 * Run: node scripts/mirror-showdown-category-icons.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'icons', 'categories');
const BASE = 'https://play.pokemonshowdown.com/sprites/categories/';

const FILES = ['Physical.png', 'Special.png', 'Status.png'];
const UA = { 'User-Agent': 'PBS-category-icons-mirror/1.0' };

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: UA }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(fetchBuffer(new URL(res.headers.location, url).href));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        }
        const ch = [];
        res.on('data', (c) => ch.push(c));
        res.on('end', () => resolve(Buffer.concat(ch)));
      })
      .on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of FILES) {
    const url = BASE + name;
    const dest = path.join(OUT, name);
    process.stdout.write(`${name} … `);
    try {
      const buf = await fetchBuffer(url);
      if (!buf || buf.length < 50) {
        console.error(`too small (${buf?.length ?? 0} bytes)`);
        process.exitCode = 1;
        continue;
      }
      fs.writeFileSync(dest, buf);
      console.log(`${buf.length} bytes → ${path.relative(ROOT, dest)}`);
    } catch (e) {
      console.error(e.message || e);
      process.exitCode = 1;
    }
  }
}

main();
