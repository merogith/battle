/**
 * Mirror named-NPC trainer PNGs from Pokémon Showdown into sprites/trainers/.
 * Source: https://play.pokemonshowdown.com/sprites/trainers/<lowercase>.png
 * Run: node scripts/mirror-showdown-trainers.mjs  (or `npm run mirror-trainers`)
 *
 * Only mirrors a curated list of iconic NPCs that are referenced by name in
 * TRAINER_DATA. Skips files that already exist locally — re-running is safe.
 * If a target is missing on Showdown, it logs a warning and continues.
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'sprites', 'trainers');
const BASE = 'https://play.pokemonshowdown.com/sprites/trainers/';
const UA = { 'User-Agent': 'PBS-trainer-mirror/1.0' };

// [remoteSlug, localBasename]. localBasename must match TRAINER_DATA.spriteFile.
// remoteSlug is the Showdown filename without `.png` — typically lowercase.
const TARGETS = [
  // Kalos villains (Gen 6)
  ['lysandre',  'Lysandre'],
  ['mable',     'Mable'],
  ['aliana',    'Aliana'],
  ['celosia',   'Celosia'],
  // Kalos players + friends + prof (Gen 6)
  ['calem',     'Calem'],
  ['serena',    'Serena'],
  ['trevor',    'Trevor'],
  ['shauna',    'Shauna'],
  ['sycamore',  'Sycamore'],
  // Unova / B2W2 players + rival (Gen 5)
  ['nate',      'Nate'],
  ['rosa',      'Rosa'],
  ['hugh',      'Hugh'],
  // Galar (Gen 8)
  ['bede',      'Bede'],
  ['sonia',     'Sonia'],
  ['magnolia',  'Magnolia'],
  ['rose',      'Rose'],
  ['oleana',    'Oleana'],
  // Paldea (Gen 9)
  ['penny',     'Penny'],
  ['arven',     'Arven'],
  ['florian',   'Florian'],
  ['juliana',   'Juliana'],
  // Misc iconic (cross-gen NPCs)
  ['looker',    'Looker'],
  ['wes',       'Wes'],
];

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: UA }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchBuffer(new URL(res.headers.location, url).href));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const ch = [];
      res.on('data', (c) => ch.push(c));
      res.on('end', () => resolve(Buffer.concat(ch)));
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0, skip = 0, fail = 0;
  const failed = [];
  for (const [remote, local] of TARGETS) {
    const dest = path.join(OUT, `${local}.png`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 50) {
      skip++;
      console.log(`  skip   ${local} (already exists)`);
      continue;
    }
    const url = `${BASE}${remote}.png`;
    process.stdout.write(`  fetch  ${remote} → ${local}.png … `);
    try {
      const buf = await fetchBuffer(url);
      if (!buf || buf.length < 50) throw new Error(`too small (${buf?.length ?? 0} bytes)`);
      fs.writeFileSync(dest, buf);
      console.log(`${buf.length} bytes`);
      ok++;
    } catch (e) {
      console.log(`FAIL (${e.message || e})`);
      failed.push(`${remote} → ${local}`);
      fail++;
    }
  }
  console.log(`\nDone. downloaded=${ok} skipped=${skip} failed=${fail}`);
  if (failed.length) {
    console.log('\nMissing on Showdown (TRAINER_DATA row will fall back to onerror):');
    failed.forEach((f) => console.log('  - ' + f));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
