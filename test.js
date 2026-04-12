#!/usr/bin/env node
/**
 * test.js — Unified test harness for the Pokémon battle engine.
 *
 * Runs each test script sequentially and reports a combined summary.
 * Usage:  node test.js
 */

const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = [
    { label: 'test_battle.js',        file: 'test_battle.js' },
    { label: 'test_battle2.js',       file: 'test_battle2.js' },
    { label: 'test_comprehensive.js', file: 'test_comprehensive.js' },
];

const SEP  = '─'.repeat(60);
const SEP2 = '═'.repeat(60);

let totalPassed = 0;
let totalFailed = 0;
let failedSuites = [];

console.log(SEP2);
console.log('  🧪  Pokémon Battle Engine — Test Harness');
console.log(SEP2);

for (const suite of SUITES) {
    console.log(`\n${SEP}`);
    console.log(`▶  Running: ${suite.label}`);
    console.log(SEP);

    const result = spawnSync(
        process.execPath,          // node binary
        [path.resolve(__dirname, suite.file)],
        { encoding: 'utf8', timeout: 30_000, cwd: __dirname }
    );

    const output = (result.stdout || '') + (result.stderr || '');
    process.stdout.write(output);

    // Parse PASS / FAIL counts from the suite output
    const passMatches = [...output.matchAll(/\[PASS\]/gi)];
    const failMatches = [...output.matchAll(/\[FAIL\]/gi)];
    const p = passMatches.length;
    const f = failMatches.length;
    totalPassed += p;
    totalFailed += f;

    if (result.status !== 0 || f > 0) {
        failedSuites.push(suite.label);
        console.log(`\n⚠  ${suite.label} exited with code ${result.status} — ${f} failure(s)`);
    } else {
        console.log(`\n✅  ${suite.label} — all ${p} assertion(s) passed`);
    }
}

console.log(`\n${SEP2}`);
console.log('  📊  Summary');
console.log(SEP2);
console.log(`  Passed : ${totalPassed}`);
console.log(`  Failed : ${totalFailed}`);

if (failedSuites.length > 0) {
    console.log(`\n  ❌ Failing suites:`);
    failedSuites.forEach(s => console.log(`     • ${s}`));
    process.exit(1);
} else {
    console.log('\n  ✅ All suites passed!');
}
