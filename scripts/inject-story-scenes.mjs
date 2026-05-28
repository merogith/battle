// Splices the output of `build-story-scenes.mjs` into battle.html alongside
// the v22 track pools + reward-tier consts. Idempotent — re-running replaces
// the existing injected block. Run after editing the CSV + re-running the
// build script.
//
// Usage: node scripts/inject-story-scenes.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BATTLE = join(ROOT, 'battle.html');
const GENERATED = join(ROOT, 'scripts', 'build', 'story-scenes.generated.js');

const battle = readFileSync(BATTLE, 'utf8');
const generated = readFileSync(GENERATED, 'utf8');
const prose = generated.split('\n').slice(3).join('\n');  // drop the 3 banner-comment lines

const BEGIN = '        // ─── BEGIN 3-track story content (v22+) — AUTO-INJECTED ─────────';
const END   = '        // ─── END   3-track story content (v22+) — AUTO-INJECTED ─────────';

const REWARD_BLOCK = `
        // Reward tier wiring — consumed by PR-4 (reward delivery + base-gold
        // nerf). Big = Gym/Rival, Mid = Ace Trainer, Low = Basic, Apex = Champion.
        // goldFrac scales the Gym-Leader gold table for the current city;
        // vouchers/vitamins given as [min, max] or flat number (rolled per battle).
        const STORY_REWARD_TIERS = {
            flavor: { goldFrac: 0.05, vouchers: 0,      vitamins: 0,      items: [] },
            low:    { goldFrac: 0.80, vouchers: [0, 1], vitamins: 0,      items: [] },
            mid:    { goldFrac: 1.00, vouchers: [1, 2], vitamins: 1,      items: [] },
            big:    { goldFrac: 1.00, vouchers: [3, 5], vitamins: [2, 3], items: ['voucher_artifact'] },
            apex:   { goldFrac: 1.00, vouchers: 5,      vitamins: 3,      items: ['voucher_artifact'] },
        };
        const STORY_KIND_TO_TIER = {
            event:       'flavor',
            battle:      'low',
            miniBoss:    'mid',
            miniRaid:    'mid',
            boss:        'big',
            raid:        'big',
            mysteryBoss: 'apex',
        };
        // Compensates the new event-battle gold inflow; PR-4 applies this to the
        // basic-trainer reward path so total run gold stays neutral vs. baseline.
        const STORY_BASE_TRAINER_GOLD_MULT = 0.82;
`;

const NEW_BLOCK = `${BEGIN}
        // Three structural beat tables + the scene-prose object, plus the
        // reward-tier const. Generated from docs/story-design/story-core-structure.csv.
        // Re-run scripts/build-story-scenes.mjs then this script to refresh.
${prose}${REWARD_BLOCK}${END}`;

let out;
if (battle.includes(BEGIN) && battle.includes(END)) {
    // Idempotent replace.
    const re = new RegExp(escapeRegExp(BEGIN) + '[\\s\\S]*?' + escapeRegExp(END));
    out = battle.replace(re, NEW_BLOCK);
    if (out === battle) throw new Error('Replace produced no change.');
    console.log('Replaced existing injected block.');
} else {
    // First-time insert: after the _pickTrack helper, before STORY_MAIN_PATH_BATTLE_COUNT.
    const ANCHOR = `            return pool[(rng() * pool.length) | 0];
        }

        const STORY_MAIN_PATH_BATTLE_COUNT = STORY_EVENTS_RAW.reduce(function (acc, row) {`;
    if (!battle.includes(ANCHOR)) {
        console.error('Anchor not found. Has the _pickTrack helper drifted? Look for the line `return pool[(rng() * pool.length) | 0];` followed by `const STORY_MAIN_PATH_BATTLE_COUNT`.');
        process.exit(1);
    }
    const REPLACEMENT = `            return pool[(rng() * pool.length) | 0];
        }

${NEW_BLOCK}

        const STORY_MAIN_PATH_BATTLE_COUNT = STORY_EVENTS_RAW.reduce(function (acc, row) {`;
    out = battle.replace(ANCHOR, REPLACEMENT);
    console.log('First-time injection.');
}

writeFileSync(BATTLE, out, 'utf8');
const delta = out.length - battle.length;
console.log(`battle.html: ${battle.length} -> ${out.length} bytes (${delta > 0 ? '+' : ''}${delta})`);

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
