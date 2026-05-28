// AUTO-INGESTS docs/story-design/story-core-structure.csv into a JS literal
// for paste into battle.html. Re-run whenever the CSV changes.
//
// Usage: node scripts/build-story-scenes.mjs
// Writes: scripts/build/story-scenes.generated.js

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const csvPath = join(ROOT, 'docs', 'story-design', 'story-core-structure.csv');
const outDir  = join(ROOT, 'scripts', 'build');
const outPath = join(outDir, 'story-scenes.generated.js');

const VILLAIN_KEYS = ['rocket','magma','aqua','galactic','plasma','flare','skull','yell','macroCosmos','star'];
const EXTRA_KEYS   = ['cubone','yamask','hypno','phantump','mimikyu','drifloon','parasect','mewtwo'];

const csv = readFileSync(csvPath, 'utf8');
const lines = csv.split(/\r?\n/).filter(l => l.trim().length);
const rows = lines.slice(1).map(l => l.split(';'));

function mainSlotKey(label) {
    const lc = (label || '').trim();
    if (!lc) return null;
    if (/Mystery Figure Battle/i.test(lc))            return 'mfBattle';
    if (/Mystery Figure Reveal/i.test(lc))            return 'mfReveal';
    if (/^Main Story Battle (\d+)/i.test(lc))         return 'battle' + lc.match(/\d+/)[0];
    if (/^Main Story Event (\d+)/i.test(lc))          return 'event'  + lc.match(/\d+/)[0];
    if (/^Main Story (\d+)$/i.test(lc))               return 'event'  + lc.match(/\d+/)[0];
    if (/^Main Story Ending/i.test(lc))               return 'ending';
    return null;
}

function villainSlotKey(label) {
    const lc = (label || '').trim();
    if (!lc) return null;
    if (/^Villain Story Mini.?Boss/i.test(lc))        return 'miniBoss';
    if (/^Villain Story Boss/i.test(lc))              return 'boss';
    if (/^Villain Story Battle (\d+)/i.test(lc))      return 'battle' + lc.match(/\d+/)[0];
    if (/^Villain Story Event (\d+)/i.test(lc))       return 'event'  + lc.match(/\d+/)[0];
    if (/^Villain Story Ending/i.test(lc))            return 'ending';
    return null;
}

function extraSlotKey(label) {
    const lc = (label || '').trim();
    if (!lc) return null;
    if (/^Extra Story Mini Raid 2/i.test(lc))         return 'miniRaid2';
    if (/^Extra Story Mini Raid/i.test(lc))           return 'miniRaid';
    if (/^Extra Story Raid/i.test(lc))                return 'raid';
    if (/^Extra Story Event (\d+)/i.test(lc))         return 'event' + lc.match(/\d+/)[0];
    if (/^Extra Story Ending/i.test(lc))              return 'ending';
    return null;
}

function roadAnchor(s) {
    if (!s) return null;
    const ls = String(s).trim().toLowerCase();
    if (/^league/.test(ls)) return 'league';
    const m = ls.match(/^road (\d+)/);
    return m ? 'road' + m[1] : null;
}

function mainKind(slot) {
    if (slot && slot.startsWith('battle')) return 'battle';
    if (slot === 'mfBattle')               return 'mysteryBoss';
    return 'event';
}
function villainKind(slot) {
    if (slot && slot.startsWith('battle')) return 'battle';
    if (slot === 'miniBoss')               return 'miniBoss';
    if (slot === 'boss')                   return 'boss';
    return 'event';
}
function extraKind(slot) {
    if (slot === 'miniRaid' || slot === 'miniRaid2') return 'miniRaid';
    if (slot === 'raid')                              return 'raid';
    return 'event';
}

const mainBeats = {};
const villainBeats = Object.fromEntries(VILLAIN_KEYS.map(k => [k, {}]));
const extraBeats   = Object.fromEntries(EXTRA_KEYS.map(k => [k, {}]));
const scenes = {};

for (const row of rows) {
    const mainLabel = row[0], mainRoad = row[1], mainProse = row[3];
    const mainSlot = mainSlotKey(mainLabel);
    if (mainSlot) {
        const sceneKey = 'main.' + mainSlot;
        mainBeats[mainSlot] = { roadAnchor: roadAnchor(mainRoad), kind: mainKind(mainSlot), sceneKey };
        scenes[sceneKey] = { title: mainLabel.trim(), body: (mainProse || '').trim() };
    }

    const villainLabel = row[4], villainRoad = row[5];
    const villainSlot = villainSlotKey(villainLabel);
    if (villainSlot) {
        for (let i = 0; i < VILLAIN_KEYS.length; i++) {
            const track = VILLAIN_KEYS[i];
            const prose = row[7 + i];
            if (prose && prose.trim()) {
                const sceneKey = 'villain.' + track + '.' + villainSlot;
                villainBeats[track][villainSlot] = { roadAnchor: roadAnchor(villainRoad), kind: villainKind(villainSlot), sceneKey };
                scenes[sceneKey] = { title: villainLabel.trim(), body: prose.trim() };
            }
        }
    }

    const extraLabel = row[17], extraRoad = row[18];
    const extraSlot = extraSlotKey(extraLabel);
    if (extraSlot) {
        for (let i = 0; i < EXTRA_KEYS.length; i++) {
            const track = EXTRA_KEYS[i];
            const prose = row[20 + i];
            if (prose && prose.trim()) {
                const sceneKey = 'extra.' + track + '.' + extraSlot;
                extraBeats[track][extraSlot] = { roadAnchor: roadAnchor(extraRoad), kind: extraKind(extraSlot), sceneKey };
                scenes[sceneKey] = { title: extraLabel.trim(), body: prose.trim() };
            }
        }
    }
}

const villainCount = VILLAIN_KEYS.reduce((a, k) => a + Object.keys(villainBeats[k]).length, 0);
const extraCount   = EXTRA_KEYS.reduce((a, k) => a + Object.keys(extraBeats[k]).length, 0);

const banner = `// AUTO-GENERATED by scripts/build-story-scenes.mjs from docs/story-design/story-core-structure.csv
// Do not edit directly — edit the CSV and re-run the build script.
// Counts: main=${Object.keys(mainBeats).length}, villain=${villainCount}, extra=${extraCount}, scenes=${Object.keys(scenes).length}`;

const out = `${banner}

        const MAIN_STORY_BEATS = ${JSON.stringify(mainBeats, null, 12).replace(/\n/g, '\n        ')};

        const VILLAIN_STORY_BEATS = ${JSON.stringify(villainBeats, null, 12).replace(/\n/g, '\n        ')};

        const EXTRA_STORY_BEATS = ${JSON.stringify(extraBeats, null, 12).replace(/\n/g, '\n        ')};

        const STORY_SCENES = ${JSON.stringify(scenes, null, 12).replace(/\n/g, '\n        ')};
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`  main beats:    ${Object.keys(mainBeats).length}`);
console.log(`  villain beats: ${villainCount}  (${VILLAIN_KEYS.length} tracks × ~11 slots)`);
console.log(`  extra beats:   ${extraCount}  (${EXTRA_KEYS.length} tracks × ~10 slots)`);
console.log(`  scenes total:  ${Object.keys(scenes).length}`);
