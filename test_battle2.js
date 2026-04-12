const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('battle.html', 'utf8');
const dom = new JSDOM(html, {
    runScripts: "dangerously",
    beforeParse(window) {
        window.matchMedia = window.matchMedia || function () {
            return {
                matches: false,
                addListener: function () { },
                removeListener: function () { }
            };
        };
        window.scrollTo = () => { };
    }
});
const window = dom.window;

// Stub out UI / async helpers so tests run instantly
window.sleep = () => Promise.resolve();
window.playPokeballAnimation = () => Promise.resolve();
window.logMsg = (msg) => console.log(`[LOG] ${msg}`);
window.updateUI = () => { };

// ── helpers ────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function assert(condition, message) {
    if (!condition) {
        console.error(`[FAIL] ${message}`);
        failed++;
    } else {
        console.log(`[PASS] ${message}`);
        passed++;
    }
}

// ── main test flow ─────────────────────────────────────────────────────────
setTimeout(async () => {
    try {
        console.log("--- BATTLE ENGINE TEST (test_battle2) ---");

        // Expose the engine's internal 'state' object (declared with `let` in the
        // script closure) to window.state so we can mutate it directly.
        window.eval(`
            window.state    = state;
            window.settings = settings;
        `);

        // Disable animations within the engine's own settings object
        window.settings.animations = false;
        window.settings.classicMode = false;

        // Build test Pokémon via the real engine function
        let pActive = window.buildPokemon("Ditto",   { m: ["Transform"],                            i: "Choice Scarf", id: "ditto1",   _gender: "null" });
        let fActive = window.buildPokemon("Snorlax", { m: ["Body Slam", "Super Fang", "Gyro Ball"], i: "Leftovers",    id: "snorlax1", _gender: "M" });

        // Patch the real internal state with our test scenario.
        // Because window.state IS state (by reference), performAction will see these.
        Object.assign(window.state, {
            playerParty:  [pActive],
            foeParty:     [fActive],
            pActive:      pActive,
            fActive:      fActive,
            score:        1,
            mode:         'gauntlet',
            minGen: 1, maxGen: 8,
            turnNumber:   1,
            weather:      null, weatherTurns: 0,
            terrain:      null, terrainTurns: 0,
            trickRoom:    0,
            pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 },
            fSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 },
            p1Action: null, p2Action: null,
            p1GimmickIntent: null, p2GimmickIntent: null,
            isOver: false, isLocked: false,
        });

        // ── TEST: Transform ─────────────────────────────────────────────────
        console.log("\n--- TESTING Transform ---");
        await window.performAction(true, pActive.moves[0]);

        let afterTransform = window.state.pActive;
        assert(afterTransform.transformedInto === fActive.name,
            `Ditto.transformedInto === "${fActive.name}" after Transform`);
        assert(afterTransform.type1 === fActive.type1,
            `Ditto type1 matches Snorlax type1 ("${fActive.type1}") after Transform`);
        assert(afterTransform.moves.length > 0,
            'Ditto has moves (copied from Snorlax) after Transform');
        assert(afterTransform.moves.every(m => m.pp <= 5),
            'Copied moves have Transform-PP cap (≤5)');

        // ── TEST: Super Fang (variable-damage) ──────────────────────────────
        // Use Super Fang from the foe (Snorlax) side against pActive (Ditto/Snorlax)
        console.log("\n--- TESTING Super Fang (Variable Damage) ---");
        let startHp     = window.state.pActive.currentHp;
        let expectedDmg = Math.floor(startHp / 2);

        // performAction(false, ...) means fActive (Snorlax) attacks pActive (Ditto)
        await window.performAction(false, fActive.moves[1]);

        let actualDmg = startHp - window.state.pActive.currentHp;
        console.log(`  Super Fang Damage: dealt ${actualDmg}, expected ~${expectedDmg}`);
        // Super Fang deals exactly floor(currentHp / 2) — allow ±1 for rounding edge cases
        assert(actualDmg >= expectedDmg - 1 && actualDmg <= expectedDmg + 1,
            `Super Fang dealt ~50% of target HP (${actualDmg} ≈ ${expectedDmg})`);

        // ── TEST: Gauntlet Reset ─────────────────────────────────────────────
        console.log("\n--- TESTING Gauntlet Reset ---");
        window.state.score++;

        // Simulate the rebuild loop used in nextGauntletRound
        window.state.playerParty.forEach((m, i) => {
            let bn = m._baseName || m.name;
            window.state.playerParty[i] = window.buildPokemon(bn, m.buildData);
        });

        let resetP = window.state.playerParty[0];
        assert(!resetP.transformedInto,
            'Rebuilt Ditto has no transformedInto after Gauntlet Reset');
        assert(resetP.currentHp === resetP.maxHp,
            'Rebuilt Ditto has full HP after Gauntlet Reset');
        assert(resetP.name === 'Ditto' || (resetP._baseName || '').includes('Ditto'),
            'Rebuilt Pokémon is back to Ditto base');
        console.log(`  Reset Player: ${resetP.name}, TransformedInto: ${resetP.transformedInto || 'none'}, HP: ${resetP.currentHp}/${resetP.maxHp}`);

        console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
        if (failed > 0) process.exit(1);

    } catch (e) {
        console.error("Uncaught error:", e);
        process.exit(1);
    }
}, 1000); // Give jsdom time to parse everything
