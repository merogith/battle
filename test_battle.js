const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('battle.html', 'utf8');
const dom = new JSDOM(html, { 
    runScripts: "dangerously",
    beforeParse(window) {
        window.matchMedia = window.matchMedia || function() {
            return {
                matches: false,
                addListener: function() {},
                removeListener: function() {}
            };
        };
        window.scrollTo = () => {};
    }
});
const window = dom.window;

// Disable actually sleeping / waiting to make tests instant
window.sleep = () => Promise.resolve();
window.playPokeballAnimation = () => Promise.resolve();

async function runTests() {
    let failed = 0;
    let passed = 0;
    function assert(condition, message) {
        if (!condition) {
            console.error(`[FAIL] ${message}`);
            failed++;
        } else {
            console.log(`[PASS] ${message}`);
            passed++;
        }
    }

    try {
        console.log('--- STARTING TESTS ---');

        // Test 1: Function Existence
        assert(typeof window.performAction === 'function', 'performAction is defined');
        assert(typeof window.calculateDamage === 'function', 'calculateDamage is defined');
        
        // Z-Move setup checking: Do we have the tables?
        assert(typeof window.buildZMove === 'function', 'buildZMove is defined');
        
        // Let's create a test harness object
        const attacker = {
            name: "Tester",
            level: 50,
            type1: "Normal",
            type2: null,
            maxHp: 100, currentHp: 100,
            stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
            stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0},
            volatile: {},
            moves: []
        };
        const defender = {
            name: "Target",
            level: 50,
            type1: "Normal",
            type2: null,
            maxHp: 100, currentHp: 100,
            stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
            stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0},
            volatile: {},
            moves: []
        };

        // If game setup needs it:
        window.state = window.state || {};
        window.state.pActive = attacker;
        window.state.fActive = defender;
        window.state.turnNumber = 1;
        window.state.weather = null;
        window.state.terrain = null;

        // Test Tooltips
        if (typeof window.getMoveTooltip === 'function') {
            const trMove = { name: "Trick Room", type: "Psychic", cat: "Status", pow: 0, acc: 100, pri: -7 };
            const qMove = { name: "Aqua Jet", type: "Water", cat: "Physical", pow: 40, acc: 100, pri: 1 };
            const tt1 = window.getMoveTooltip(trMove);
            const tt2 = window.getMoveTooltip(qMove);
            assert(!tt1.includes('undefined'), 'Trick Room tooltip parses cleanly');
            assert(!tt2.includes('undefined'), 'Aqua Jet tooltip parses cleanly');
        } else {
            console.warn("getMoveTooltip not found, skipping tooltip tests");
        }

        console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    } catch(e) {
        console.error("Test framework error: ", e);
    }
}

runTests();
