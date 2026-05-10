/**
 * Demo: rival type weights (same formulas as battle.html) + simplified type-roll simulation.
 * Run: node scripts/rival-type-score-demo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const battleHtml = fs.readFileSync(path.join(__dirname, '..', 'battle.html'), 'utf8');
const m = battleHtml.match(/const typeChart=(\{[\s\S]*?\});/);
if (!m) throw new Error('typeChart not found');
const typeChart = eval(`(${m[1]})`);

const ATK_TYPES = Object.keys(typeChart);
const FLOOR = 0.35;
const DECAY = 70;

function combinedEff(atkType, d1, d2) {
    const ch = typeChart[atkType];
    if (!ch || !d1) return 1;
    const m1 = ch[d1] !== undefined ? ch[d1] : 1;
    const m2 = d2 ? (ch[d2] !== undefined ? ch[d2] : 1) : 1;
    return m1 * m2;
}

function scoreAttackTypeVsParty(atkType, team) {
    let s = 0;
    for (const mon of team) {
        const d1 = mon.t1;
        const d2 = mon.t2 || null;
        const m = combinedEff(atkType, d1, d2);
        if (m >= 2) s += m * m;
        else if (m === 1) s += 0.12;
    }
    return s;
}

function initWeights(team) {
    const w = {};
    for (const atk of ATK_TYPES) {
        w[atk] = scoreAttackTypeVsParty(atk, team) + FLOOR;
    }
    return w;
}

function weightStats(weights) {
    const entries = ATK_TYPES.map((t) => ({ t, raw: weights[t] - FLOOR, w: weights[t] }));
    const sum = entries.reduce((a, b) => a + b.w, 0);
    entries.sort((a, b) => b.w - a.w);
    return { entries, sum };
}

function pickWeightedType(weights, rng) {
    let sum = 0;
    for (const k of ATK_TYPES) sum += Math.max(0, weights[k]);
    let r = rng() * sum;
    for (const k of ATK_TYPES) {
        r -= Math.max(0, weights[k]);
        if (r <= 0) return k;
    }
    return ATK_TYPES[ATK_TYPES.length - 1];
}

function decayType(t, weights) {
    if (t != null && weights[t] != null) weights[t] /= DECAY;
}

/** Mulberry32 — deterministic PRNG for repeatable "rolls" */
function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function simulateTypeSlots(team, slots, seed) {
    const weights = initWeights(team);
    const rng = mulberry32(seed >>> 0);
    const picks = [];
    for (let i = 0; i < slots; i++) {
        const t = pickWeightedType(weights, rng);
        picks.push(t);
        decayType(t, weights);
    }
    return picks;
}

const TEAMS = {
    'Mono Water (6× Water)': Array(6).fill({ t1: 'Water', t2: null }),
    'Mono Normal': Array(6).fill({ t1: 'Normal', t2: null }),
    'Mono Ghost': Array(6).fill({ t1: 'Ghost', t2: null }),
    'Steel / Fairy mix': [
        { t1: 'Steel', t2: 'Fairy' },
        { t1: 'Steel', t2: 'Fairy' },
        { t1: 'Steel', t2: null },
        { t1: 'Fairy', t2: null },
        { t1: 'Steel', t2: 'Psychic' },
        { t1: 'Steel', t2: 'Flying' },
    ],
    'Starter trio ×2': [
        { t1: 'Fire', t2: null },
        { t1: 'Grass', t2: null },
        { t1: 'Water', t2: null },
        { t1: 'Fire', t2: null },
        { t1: 'Grass', t2: null },
        { t1: 'Water', t2: null },
    ],
    'Edge: 3× Dark / 3× Psychic': [
        { t1: 'Dark', t2: null },
        { t1: 'Dark', t2: null },
        { t1: 'Dark', t2: null },
        { t1: 'Psychic', t2: null },
        { t1: 'Psychic', t2: null },
        { t1: 'Psychic', t2: null },
    ],
};

console.log('## Rival type scoring (matches battle.html)\n');
console.log('- Per attack type T: for each party Pokémon, combined eff m = chart[T][t1]*chart[T][t2].');
console.log('- If m >= 2: add m*m; if m === 1: add 0.12; else add 0.');
console.log('- Weight used for rolls: rawScore + 0.35 for every type.');
console.log('- Pick slot: weighted random; then weight[T] /= 70 for that rolled T.\n');

for (const [label, team] of Object.entries(TEAMS)) {
    const weights = initWeights(team);
    const { entries, sum } = weightStats(weights);
    console.log(`### ${label}`);
    console.log('| Rank | Attack type | Raw score | Weight (score+0.35) | Share of total weight |');
    console.log('|------|-------------|-----------|---------------------|------------------------|');
    entries.slice(0, 10).forEach((e, i) => {
        const share = ((e.w / sum) * 100).toFixed(2);
        console.log(`| ${i + 1} | ${e.t} | ${e.raw.toFixed(2)} | ${e.w.toFixed(2)} | ${share}% |`);
    });
    console.log('');
}

console.log('## Simulated 6 type rolls (first rival battle — types only, seed=0xC0FFEE)\n');
console.log('Not full Pokémon picks — only which attacking type the AI would weight each slot before species selection.\n');

const RIVAL_ROWS = [
    { name: 'Rival @ row 14 (early)', seed: 0x11111111 },
    { name: 'Rival @ row 45 (mid)', seed: 0x22222222 },
    { name: 'Rival @ row 62 (late)', seed: 0x33333333 },
    { name: 'Rival @ row 73 (league)', seed: 0x44444444 },
];

for (const row of RIVAL_ROWS) {
    const picks = simulateTypeSlots(TEAMS['Mono Water (6× Water)'], 6, row.seed);
    console.log(`| Battle | ${row.name} |`);
    console.log('| Slot | Rolled attack type |');
    console.log('|------|---------------------|');
    picks.forEach((t, i) => console.log(`| ${i + 1} | ${t} |`));
    console.log('');
}

console.log('Same Mono Water team, different seed (shows variance):\n');
for (let s = 1; s <= 3; s++) {
    const picks = simulateTypeSlots(TEAMS['Mono Water (6× Water)'], 6, s * 0x9e3779b9);
    console.log(`Seed variant ${s}: ${picks.join(' → ')}`);
}
