/**
 * Mirror named-NPC trainer PNGs from Pokémon Showdown into sprites/trainers/.
 * Source: https://play.pokemonshowdown.com/sprites/trainers/<slug>.png
 * Run: node scripts/mirror-showdown-trainers.mjs  (or `npm run mirror-trainers`)
 *
 * Only mirrors a curated list of iconic NPCs referenced by name in
 * TRAINER_DATA. Skips files that already exist locally — re-running is safe.
 *
 * Each target has one or more candidate Showdown slugs. The script tries
 * each slug in order and takes the first one that returns a PNG. Missing
 * sprites are reported at the end so you can either patch the slug list,
 * remove the row from TRAINER_DATA, or accept the `onerror` blank-portrait
 * fallback in story battles.
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

// { local: target filename on disk, slugs: ordered list of Showdown slugs to try }.
// local must match the `spriteFile` field on the corresponding TRAINER_DATA row.
const TARGETS = [
  // Kalos villains (Gen 6)
  { local: 'Lysandre',  slugs: ['lysandre'] },
  { local: 'Mable',     slugs: ['mable'] },
  { local: 'Aliana',    slugs: ['aliana'] },
  { local: 'Celosia',   slugs: ['celosia'] },
  // Kalos players + friends + prof (Gen 6)
  { local: 'Calem',     slugs: ['calem'] },
  { local: 'Serena',    slugs: ['serena'] },
  { local: 'Trevor',    slugs: ['trevor'] },
  { local: 'Shauna',    slugs: ['shauna'] },
  { local: 'Sycamore',  slugs: ['sycamore', 'professor-sycamore'] },
  // Unova / B2W2 (Gen 5)
  { local: 'Nate',      slugs: ['nate', 'nate-gen5'] },
  { local: 'Rosa',      slugs: ['rosa', 'rosa-gen5'] },
  { local: 'Hugh',      slugs: ['hugh'] },
  // Galar (Gen 8)
  { local: 'Bede',      slugs: ['bede'] },
  { local: 'Sonia',     slugs: ['sonia'] },
  { local: 'Magnolia',  slugs: ['magnolia', 'professor-magnolia'] },
  { local: 'Rose',      slugs: ['rose', 'chairman-rose'] },
  { local: 'Oleana',    slugs: ['oleana'] },
  // Paldea (Gen 9)
  { local: 'Penny',     slugs: ['penny'] },
  { local: 'Arven',     slugs: ['arven'] },
  { local: 'Florian',   slugs: ['florian'] },
  { local: 'Juliana',   slugs: ['juliana'] },
  // Misc iconic (cross-gen NPCs)
  { local: 'Looker',    slugs: ['looker'] },
  { local: 'Wes',       slugs: ['wes', 'wes-colosseum'] },
  // Galar Isle of Armor + Crown Tundra (Gen 8)
  { local: 'Klara',     slugs: ['klara'] },
  { local: 'Avery',     slugs: ['avery'] },
  { local: 'Mustard',   slugs: ['mustard'] },
  { local: 'Peony',     slugs: ['peony'] },
  // Legends Arceus (Gen 8 Hisui)
  { local: 'Volo',      slugs: ['volo'] },
  { local: 'Adaman',    slugs: ['adaman'] },
  { local: 'Irida',     slugs: ['irida'] },
  // Indigo Disk DLC (Gen 9)
  { local: 'Drayton',   slugs: ['drayton'] },
  { local: 'Carmine',   slugs: ['carmine'] },
  { local: 'Kieran',    slugs: ['kieran'] },
  { local: 'Briar',     slugs: ['briar'] },
  { local: 'Crispin',   slugs: ['crispin'] },
  { local: 'Amarys',    slugs: ['amarys'] },
  { local: 'Lacey',     slugs: ['lacey'] },
  // Paldea Team Star (Gen 9)
  { local: 'Mela',      slugs: ['mela'] },
  { local: 'Eri',       slugs: ['eri'] },
  { local: 'Giacomo',   slugs: ['giacomo'] },
  { local: 'Ortega',    slugs: ['ortega'] },
  { local: 'Atticus',   slugs: ['atticus'] },
  // Unova B2W2 (Gen 5)
  { local: 'Roxie',     slugs: ['roxie'] },
  { local: 'Marlon',    slugs: ['marlon'] },
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

async function tryDownload(target) {
  for (const slug of target.slugs) {
    const url = `${BASE}${slug}.png`;
    try {
      const buf = await fetchBuffer(url);
      if (buf && buf.length >= 50) return { slug, buf };
    } catch (e) {
      // Try next slug.
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0, skip = 0, fail = 0;
  const failed = [];
  for (const target of TARGETS) {
    const dest = path.join(OUT, `${target.local}.png`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 50) {
      skip++;
      console.log(`  skip   ${target.local} (already exists)`);
      continue;
    }
    process.stdout.write(`  fetch  ${target.local} … `);
    const result = await tryDownload(target);
    if (result) {
      fs.writeFileSync(dest, result.buf);
      console.log(`${result.buf.length} bytes (from "${result.slug}")`);
      ok++;
    } else {
      console.log(`FAIL (tried: ${target.slugs.join(', ')})`);
      failed.push(target);
      fail++;
    }
  }
  console.log(`\nDone. downloaded=${ok} skipped=${skip} failed=${fail}`);
  if (failed.length) {
    console.log('\nNot found on Showdown. Options:');
    console.log('  (a) Edit TARGETS in this script with a corrected slug and re-run.');
    console.log('  (b) Remove the matching TRAINER_DATA row from battle.html.');
    console.log('  (c) Leave as-is — story battles render the trainer with an');
    console.log('      empty portrait (onerror handler hides the broken image).');
    console.log('\nFailed targets:');
    failed.forEach((t) => console.log(`  - ${t.local}  (tried: ${t.slugs.join(', ')})`));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
