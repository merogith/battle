#!/usr/bin/env node
/**
 * Upstream reference helper for Move Tutor / dex alignment.
 *
 * This project:
 * - Vendors Pokemon Showdown-shaped JSON under data/ (species, moves, abilities, …).
 * - Loads @pkmn/dex (+ learnsets) from jsDelivr in battle.html (PKMN_DEX_VER).
 *
 * Upstream sources (refresh data / learnsets manually as needed):
 * - https://github.com/smogon/pokemon-showdown — data/moves.ts, data/pokedex.ts,
 *   data/text/moves.ts, learnsets (see repo layout for your target gen).
 * - https://www.npmjs.com/package/@pkmn/dex — packaged dex + learnsets used at runtime.
 *
 * Usage:
 *   node scripts/sync-showdown-data.js
 *   node scripts/sync-showdown-data.js --dex-version
 *
 * --dex-version  Prints the latest @pkmn/dex version from npm; match PKMN_DEX_VER in battle.html
 *                and the jsDelivr URLs under build/learnsets.min.js and build/index.min.js.
 */

const REGISTRY_LATEST = 'https://registry.npmjs.org/@pkmn/dex/latest';

async function printLatestDexVersion() {
  const res = await fetch(REGISTRY_LATEST);
  if (!res.ok) throw new Error(`npm registry: ${res.status}`);
  const body = await res.json();
  const v = body && body.version;
  if (!v) throw new Error('No version in registry response');
  console.log(`@pkmn/dex latest: ${v}`);
  console.log(`Set PKMN_DEX_VER in battle.html to "${v}" if you upgrade.`);
  console.log(`Bundles: https://cdn.jsdelivr.net/npm/@pkmn/dex@${v}/build/learnsets.min.js`);
  console.log(`         https://cdn.jsdelivr.net/npm/@pkmn/dex@${v}/build/index.min.js`);
}

function printDocs() {
  console.log(`
Move Tutor / learnsets
----------------------
- battle.html merges CSV move pools with Dex.learnsets.get() after @pkmn/dex loads.
- Teachable moves are still restricted to names present in data/moves.json (implemented set).

Refreshing vendored JSON (data/*.json)
--------------------------------------
Regenerate or merge from the pokemon-showdown repo for your target generation.
This script does not rewrite data/*.json automatically (formats are TS modules upstream).

For runtime learnset freshness, bump PKMN_DEX_VER to match npm and test the game offline/online.
`);
}

async function main() {
  const wantVer = process.argv.includes('--dex-version');
  if (wantVer) {
    await printLatestDexVersion();
  } else {
    printDocs();
    console.log('Tip: run with --dex-version to print the latest @pkmn/dex npm version.\n');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
