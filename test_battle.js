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

        // Test 1: Function Existence (damage runs inside performAction; no standalone calculateDamage)
        assert(typeof window.performAction === 'function', 'performAction is defined');

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
            stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0 },
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
            stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0 },
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

        // Test buildMaxMove: verify it produces a valid Max Move object
        const testMon = {
            name: "Blissey",
            level: 50,
            type1: "Normal", type2: null,
            maxHp: 200, currentHp: 200,
            stats: { atk: 30, def: 40, spa: 75, spd: 135, spe: 55 },
            stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0 },
            volatile: {},
            dynamaxed: true,
            buildData: { gimmick: 'DYNAMAX' },
            moves: []
        };
        const physMove = { name: "Body Slam", type: "Normal", cat: "Physical", pow: 85, acc: 100, pri: 0, pp: 15, maxPp: 15 };
        const specMove = { name: "Ice Beam",  type: "Ice",    cat: "Special",  pow: 90, acc: 100, pri: 0, pp: 10, maxPp: 10 };
        const statMove = { name: "Swords Dance", type: "Normal", cat: "Status", pow: 0, acc: 100, pri: 0, pp: 20, maxPp: 20 };

        const maxPhys = window.buildMaxMove(testMon, physMove, true);
        assert(typeof maxPhys === 'object' && maxPhys !== null, 'buildMaxMove returns an object for physical move');
        assert(maxPhys.isMaxMove === true, 'buildMaxMove marks Physical move as isMaxMove');
        assert(typeof maxPhys.pow === 'number' && maxPhys.pow > 0, 'buildMaxMove gives Physical Max Move a positive power');
        assert(maxPhys.type === 'Normal', 'buildMaxMove preserves type for Normal physical move (Max Strike)');

        const maxSpec = window.buildMaxMove(testMon, specMove, true);
        assert(maxSpec.isMaxMove === true, 'buildMaxMove marks Special move as isMaxMove');
        assert(typeof maxSpec.pow === 'number' && maxSpec.pow > 0, 'buildMaxMove gives Special Max Move a positive power');

        const maxStat = window.buildMaxMove(testMon, statMove, true);
        assert(maxStat.isMaxMove === true, 'buildMaxMove marks Status move as isMaxMove (Max Guard)');
        assert(maxStat.name === 'Max Guard', 'buildMaxMove converts Status move to Max Guard');

        // Test buildZMove: verify type-matched Z-Move produces boosted power
        const zMon = {
            name: "Charizard", level: 50,
            type1: "Fire", type2: "Flying",
            maxHp: 153, currentHp: 153,
            stats: { atk: 104, def: 78, spa: 159, spd: 115, spe: 100 },
            stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0 },
            volatile: {}, zMoveUsed: false,
            item: 'Firium Z', originalItem: 'Firium Z',
            buildData: { gimmick: 'ZMOVE', i: 'Firium Z' },
            moves: []
        };
        const fireMove = { name: "Flamethrower", type: "Fire", cat: "Special", pow: 90, acc: 100, pri: 0 };
        const zResult = window.buildZMove(zMon, fireMove);
        assert(typeof zResult === 'object' && zResult !== null, 'buildZMove returns an object');
        assert(zResult.isZMove === true, 'Matching Z-crystal produces a Z-Move');
        assert(typeof zResult.pow === 'number' && zResult.pow > fireMove.pow, 'Z-Move power exceeds base move power');
        assert(!String(zResult.name).includes('undefined'), 'Z-Move name contains no undefined');

        console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    } catch (e) {
        console.error("Test framework error: ", e);
    }
}

runTests();
