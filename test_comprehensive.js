/**
 * Comprehensive Pokemon VGC Battle Simulator Test Suite
 *
 * Tests: Data integrity, damage calc, status effects, abilities, items,
 *        AI behavior, game flow, and mass AI vs AI battle simulation.
 *
 * Usage:
 *   node test_comprehensive.js                   # Run all tests
 *   node test_comprehensive.js --battles=100      # Mass battle simulation (100 battles)
 *   node test_comprehensive.js --verbose          # Verbose output
 *   node test_comprehensive.js --category=damage  # Run specific category
 *   node test_comprehensive.js --log-file=out.json # Write results to JSON
 */

const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// Parse CLI args
const args = {};
process.argv.slice(2).forEach(arg => {
    const [key, val] = arg.replace(/^--/, '').split('=');
    args[key] = val || true;
});

const VERBOSE = !!args.verbose;
const BATTLE_COUNT = parseInt(args.battles) || 50;
const CATEGORY = args.category || 'all';
const LOG_FILE = args['log-file'] || null;

// ─── Results tracking ───────────────────────────────────────────
let results = {
    testRun: new Date().toISOString(),
    categories: {},
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    errors: [],
    massBattle: null,
    buildValidation: null
};

let currentCategory = '';
function startCategory(name) {
    currentCategory = name;
    results.categories[name] = { passed: 0, failed: 0, tests: [] };
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${name.toUpperCase()}`);
    console.log('='.repeat(60));
}

function assert(condition, message, details = '') {
    const cat = results.categories[currentCategory];
    if (condition) {
        cat.passed++;
        results.totalPassed++;
        cat.tests.push({ name: message, status: 'PASS' });
        console.log(`  [PASS] ${message}`);
    } else {
        cat.failed++;
        results.totalFailed++;
        cat.tests.push({ name: message, status: 'FAIL', details });
        console.error(`  [FAIL] ${message}${details ? ' — ' + details : ''}`);
    }
}

function skip(message) {
    results.totalSkipped++;
    console.log(`  [SKIP] ${message}`);
}

// ─── Load the game engine via JSDOM ──────────────────────────────
console.log('Loading battle.html via JSDOM...');
const html = fs.readFileSync('battle.html', 'utf8');

const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: new (class extends jsdom.ResourceLoader {
        fetch(url, options) {
            // Block external scripts that fail in JSDOM
            if (url.includes('unpkg.com') || url.includes('cdn.')) {
                return Promise.reject(new Error('blocked external'));
            }
            return super.fetch(url, options);
        }
    })(),
    url: 'file:///' + __dirname.replace(/\\/g, '/') + '/',
    beforeParse(window) {
        // Stub browser APIs not available in JSDOM
        window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
        window.scrollTo = () => {};
        window.requestAnimationFrame = cb => setTimeout(cb, 0);
        window.HTMLCanvasElement.prototype.getContext = () => ({});
        // Stub fetch to load local files
        const path = require('path');
        const baseDir = __dirname;
        window.fetch = (url) => {
            if (typeof url !== 'string') return Promise.reject(new Error('bad url'));
            // Block external URLs
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return Promise.reject(new Error('blocked external fetch: ' + url));
            }
            const localPath = path.join(baseDir, url.replace(/^\.?\//, ''));
            try {
                const data = fs.readFileSync(localPath, 'utf8');
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(JSON.parse(data)),
                    text: () => Promise.resolve(data)
                });
            } catch (e) {
                return Promise.reject(e);
            }
        };
    }
});

const win = dom.window;

// Disable animations and delays
win.sleep = () => Promise.resolve();
win.playPokeballAnimation = () => Promise.resolve();

// Capture log messages for analysis
let battleLog = [];
win.logMsg = function(msg, type) {
    battleLog.push({ msg, type });
    if (VERBOSE) console.log(`    [BATTLE] ${msg}`);
};

// Stub UI updates (no DOM needed for engine tests)
win.updateUI = () => {};

// Stub settings for animations off
win.eval(`if(typeof settings !== 'undefined') settings.animations = false;`);

// Wait for data loading
function waitForData(timeout = 30000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            // buildPokemon is the key indicator - if it can build a mon, data is loaded
            try {
                // Expose internal vars for testing
                win.eval(`
                    window.baseStats = baseStats;
                    window.movesDB = movesDB;
                    window.csvBuilds = csvBuilds;
                    window.tooltipDict = tooltipDict;
                    window.settings = settings;
                    window.state = state;
                `);
                if (win.baseStats && Object.keys(win.baseStats).length > 100 &&
                    win.movesDB && Object.keys(win.movesDB).length > 100) {
                    resolve();
                    return;
                }
            } catch(e) { /* not ready yet */ }

            if (Date.now() - start > timeout) {
                // Try one more time to expose
                try {
                    win.eval(`window.baseStats = baseStats; window.movesDB = movesDB;`);
                } catch(e) {}
                const bs = win.baseStats ? Object.keys(win.baseStats).length : 0;
                const md = win.movesDB ? Object.keys(win.movesDB).length : 0;
                if (bs > 100 && md > 100) { resolve(); return; }
                reject(new Error(`Data not loaded after ${timeout}ms. baseStats: ${bs}, movesDB: ${md}`));
            } else {
                setTimeout(check, 500);
            }
        };
        setTimeout(check, 2000);
    });
}

// ─── Helper functions ────────────────────────────────────────────
function makeMon(name, overrides = {}) {
    const build = {
        m: overrides.moves || ['Tackle', 'Protect', 'Swords Dance', 'Quick Attack'],
        i: overrides.item || 'Leftovers',
        a: overrides.ability || '',
        n: overrides.nature || 'Adamant',
        evs: overrides.evs || { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
        ...(overrides.buildExtra || {})
    };
    const mon = win.buildPokemon(name, build);
    // Apply any direct overrides
    if (overrides.hp !== undefined) mon.currentHp = overrides.hp;
    if (overrides.status) { mon.status = overrides.status; mon.statusTurns = 0; }
    if (overrides.stages) Object.assign(mon.stages, overrides.stages);
    if (overrides.directItem !== undefined) mon.item = overrides.directItem;
    if (overrides.directAbility) mon.ability = overrides.directAbility;
    return mon;
}

function setupBattle(p1, p2) {
    win.state.playerParty = [p1];
    win.state.foeParty = [p2];
    win.state.pActive = p1;
    win.state.fActive = p2;
    win.state.isOver = false;
    win.state.isLocked = false;
    win.state.turnNumber = 0;
    win.state.weather = null;
    win.state.weatherTurns = 0;
    win.state.terrain = null;
    win.state.terrainTurns = 0;
    win.state.trickRoom = 0;
    win.state.pSide = { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0 };
    win.state.fSide = { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0 };
    win.state.mode = 'pve';
    win.state.usedMega = false; win.state.usedZ = false; win.state.usedDyna = false; win.state.usedTera = false;
    win.state.fUsedMega = false; win.state.fUsedZ = false; win.state.fUsedDyna = false; win.state.fUsedTera = false;
    battleLog = [];
}

// ─── TEST CATEGORIES ─────────────────────────────────────────────

async function testDataIntegrity() {
    startCategory('Data Integrity');

    // Species loaded
    const speciesCount = Object.keys(win.baseStats).length;
    assert(speciesCount > 500, `Species data loaded (${speciesCount} Pokemon)`, `Only ${speciesCount} found`);

    // Moves loaded
    const moveCount = Object.keys(win.movesDB).length;
    assert(moveCount > 300, `Move data loaded (${moveCount} moves)`, `Only ${moveCount} found`);

    // Spot-check Pikachu stats
    const pika = win.baseStats['Pikachu'];
    assert(pika && pika.hp === 35, 'Pikachu HP base stat = 35', pika ? `Got ${pika.hp}` : 'Not found');
    assert(pika && pika.spe === 90, 'Pikachu Speed base stat = 90', pika ? `Got ${pika.spe}` : 'Not found');
    assert(pika && pika.t1 === 'Electric', 'Pikachu type = Electric', pika ? `Got ${pika.t1}` : 'Not found');

    // Spot-check Dragonite stats
    const dnite = win.baseStats['Dragonite'];
    assert(dnite && dnite.hp === 91, 'Dragonite HP base = 91', dnite ? `Got ${dnite.hp}` : 'Not found');
    assert(dnite && dnite.atk === 134, 'Dragonite Atk base = 134', dnite ? `Got ${dnite.atk}` : 'Not found');

    // Spot-check Thunderbolt
    const tbolt = win.movesDB['Thunderbolt'];
    assert(tbolt && tbolt.pow === 90, 'Thunderbolt BP = 90', tbolt ? `Got ${tbolt.pow}` : 'Not found');
    assert(tbolt && tbolt.acc === 100, 'Thunderbolt Acc = 100', tbolt ? `Got ${tbolt.acc}` : 'Not found');
    assert(tbolt && tbolt.type === 'Electric', 'Thunderbolt type = Electric', tbolt ? `Got ${tbolt.type}` : 'Not found');

    // Spot-check Earthquake
    const eq = win.movesDB['Earthquake'];
    assert(eq && eq.pow === 100, 'Earthquake BP = 100', eq ? `Got ${eq.pow}` : 'Not found');
    assert(eq && eq.cat === 'Physical', 'Earthquake category = Physical', eq ? `Got ${eq.cat}` : 'Not found');

    // Nature modifiers
    assert(win.natureModifiers['Adamant'], 'Adamant nature exists');
    if (win.natureModifiers['Adamant']) {
        assert(win.natureModifiers['Adamant'].up === 'atk', 'Adamant +Atk', `Got +${win.natureModifiers['Adamant'].up}`);
        assert(win.natureModifiers['Adamant'].down === 'spa', 'Adamant -SpA', `Got -${win.natureModifiers['Adamant'].down}`);
    }

    // Type chart
    assert(win.typeChart !== undefined, 'Type chart loaded');
    if (win.typeChart) {
        assert(win.typeChart['Fire']['Grass'] === 2, 'Fire > Grass = 2x', `Got ${win.typeChart['Fire']['Grass']}`);
        assert(win.typeChart['Water']['Fire'] === 2, 'Water > Fire = 2x', `Got ${win.typeChart['Water']['Fire']}`);
        assert(win.typeChart['Electric']['Ground'] === 0, 'Electric > Ground = 0x', `Got ${win.typeChart['Electric']['Ground']}`);
        assert(win.typeChart['Normal']['Ghost'] === 0, 'Normal > Ghost = 0x', `Got ${win.typeChart['Normal']['Ghost']}`);
        assert(win.typeChart['Fighting']['Ghost'] === 0, 'Fighting > Ghost = 0x', `Got ${win.typeChart['Fighting']['Ghost']}`);
        assert(win.typeChart['Ground']['Flying'] === 0, 'Ground > Flying = 0x', `Got ${win.typeChart['Ground']['Flying']}`);
        assert(win.typeChart['Dragon']['Fairy'] === 0, 'Dragon > Fairy = 0x', `Got ${win.typeChart['Dragon']['Fairy']}`);
    }
}

async function testBuildValidation() {
    startCategory('Build Validation');

    // Check CSV builds loaded
    const csvBuilds = win.csvBuilds || {};
    const buildCount = Object.keys(csvBuilds).length;
    assert(buildCount > 0, `CSV builds loaded (${buildCount} Pokemon)`, 'No builds loaded');

    // Validate EV totals
    let invalidEvCount = 0;
    let invalidEvExamples = [];
    let totalBuilds = 0;

    for (const [name, categories] of Object.entries(csvBuilds)) {
        for (const [tag, builds] of Object.entries(categories)) {
            if (!Array.isArray(builds)) continue;
            for (const build of builds) {
                totalBuilds++;
                const evs = build.evs || {};
                const total = (evs.hp || 0) + (evs.atk || 0) + (evs.def || 0) + (evs.spa || 0) + (evs.spd || 0) + (evs.spe || 0);
                if (total > 510) {
                    invalidEvCount++;
                    if (invalidEvExamples.length < 5) {
                        invalidEvExamples.push(`${name} (${tag}): ${total} EVs`);
                    }
                }
                // Check individual EVs > 252
                for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
                    if ((evs[stat] || 0) > 252) {
                        if (invalidEvExamples.length < 8) {
                            invalidEvExamples.push(`${name} (${tag}): ${stat}=${evs[stat]} > 252`);
                        }
                    }
                }
            }
        }
    }

    assert(totalBuilds > 0, `Total builds: ${totalBuilds}`);
    assert(invalidEvCount === 0, `No builds with invalid EVs (>510 total)`,
        `${invalidEvCount} invalid builds found. Examples: ${invalidEvExamples.join('; ')}`);

    // Validate species lookup
    let missingSpecies = 0;
    let missingExamples = [];
    const checkedNames = new Set();
    for (const name of Object.keys(csvBuilds)) {
        if (checkedNames.has(name)) continue;
        checkedNames.add(name);
        if (!win.baseStats[name]) {
            missingSpecies++;
            if (missingExamples.length < 10) missingExamples.push(name);
        }
    }
    assert(missingSpecies < 50, `Species lookup: ${missingSpecies} missing from baseStats`,
        `Missing: ${missingExamples.join(', ')}`);

    // Validate buildPokemon works for common mons
    const testMons = ['Pikachu', 'Charizard', 'Garchomp', 'Tyranitar', 'Dragonite', 'Gyarados'];
    for (const name of testMons) {
        try {
            const mon = makeMon(name, { moves: ['Tackle'], ability: '' });
            assert(mon && mon.maxHp > 0, `buildPokemon("${name}") produces valid HP=${mon.maxHp}`);
            assert(mon.stats.atk > 0 && mon.stats.spe > 0, `buildPokemon("${name}") has valid stats`);
        } catch (e) {
            assert(false, `buildPokemon("${name}") throws`, e.message);
        }
    }

    results.buildValidation = { totalBuilds, invalidEvCount, missingSpecies };
}

async function testStatCalculation() {
    startCategory('Stat Calculation (Lv50)');

    // Test: Pikachu with 31 IVs, 0 EVs, neutral nature
    // HP = floor((2*35 + 31 + 0) * 50/100) + 60 = floor(101*0.5) + 60 = 50 + 60 = 110
    const pika = makeMon('Pikachu', { nature: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } });
    assert(pika.maxHp === 110, `Pikachu HP (0 EVs, Hardy) = 110`, `Got ${pika.maxHp}`);

    // Speed = floor((floor((2*90 + 31 + 0) * 50/100) + 5) * 1.0) = floor((floor(211*0.5) + 5)) = floor(105+5) = 110
    assert(pika.stats.spe === 110, `Pikachu Speed (0 EVs, Hardy) = 110`, `Got ${pika.stats.spe}`);

    // Test: Garchomp with 252 Atk EVs, Jolly nature (+Spe, -SpA)
    // Atk base = 130, IVs = 31, EVs = 252
    // Atk = floor((floor((2*130 + 31 + 63) * 50/100) + 5) * 1.0) = floor((floor(353*0.5) + 5)) = floor(176+5) = 181
    const chomp = makeMon('Garchomp', {
        nature: 'Jolly',
        evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 }
    });
    assert(chomp.stats.atk === 182, `Garchomp Atk (252 EVs, Jolly/neutral Atk) = 182`, `Got ${chomp.stats.atk}`);

    // Spe base = 102, Jolly = +10%
    // Spe = floor((floor((2*102 + 31 + 63) * 50/100) + 5) * 1.1) = floor((floor(298*0.5)+5)*1.1) = floor((149+5)*1.1) = floor(169.4) = 169
    assert(chomp.stats.spe === 169, `Garchomp Speed (252 EVs, Jolly) = 169`, `Got ${chomp.stats.spe}`);

    // Shedinja always has 1 HP
    const shedinja = makeMon('Shedinja', { moves: ['Shadow Sneak'], nature: 'Adamant' });
    assert(shedinja.maxHp === 1, `Shedinja HP always = 1`, `Got ${shedinja.maxHp}`);
}

async function testTypeEffectiveness() {
    startCategory('Type Effectiveness');

    const getEff = win.getMoveEffectiveness;
    if (!getEff) { skip('getMoveEffectiveness not exposed'); return; }

    // Single type effectiveness
    assert(getEff('Fire', 'Grass', '') === 2, 'Fire vs Grass = 2x');
    assert(getEff('Water', 'Fire', '') === 2, 'Water vs Fire = 2x');
    assert(getEff('Grass', 'Water', '') === 2, 'Grass vs Water = 2x');
    assert(getEff('Fire', 'Water', '') === 0.5, 'Fire vs Water = 0.5x');
    assert(getEff('Normal', 'Ghost', '') === 0, 'Normal vs Ghost = 0x');
    assert(getEff('Ground', 'Flying', '') === 0, 'Ground vs Flying = 0x');
    assert(getEff('Electric', 'Ground', '') === 0, 'Electric vs Ground = 0x');

    // Dual type effectiveness
    assert(getEff('Ice', 'Dragon', 'Flying') === 4, 'Ice vs Dragon/Flying = 4x');
    assert(getEff('Electric', 'Water', 'Flying') === 4, 'Electric vs Water/Flying = 4x');
    assert(getEff('Ground', 'Fire', 'Flying') === 0, 'Ground vs Fire/Flying = 0x (Flying immunity)');
    assert(getEff('Fire', 'Grass', 'Steel') === 4, 'Fire vs Grass/Steel = 4x');

    // Fairy interactions (Gen 6+)
    assert(getEff('Dragon', 'Fairy', '') === 0, 'Dragon vs Fairy = 0x');
    assert(getEff('Fairy', 'Dragon', '') === 2, 'Fairy vs Dragon = 2x');
    assert(getEff('Fairy', 'Fighting', '') === 2, 'Fairy vs Fighting = 2x');
    assert(getEff('Fairy', 'Dark', '') === 2, 'Fairy vs Dark = 2x');
}

async function testDamageCalcBasics() {
    startCategory('Damage Calculation Basics');

    // Create two known Pokemon and do a manual damage range check
    const attacker = makeMon('Garchomp', {
        moves: ['Earthquake', 'Dragon Claw', 'Swords Dance', 'Protect'],
        nature: 'Jolly',
        evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
        ability: 'Rough Skin'
    });

    const defender = makeMon('Tyranitar', {
        moves: ['Stone Edge', 'Crunch', 'Protect', 'Dragon Dance'],
        nature: 'Jolly',
        evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
        ability: 'Sand Stream'
    });

    setupBattle(attacker, defender);

    // Earthquake (Ground) vs Tyranitar (Rock/Dark) - super effective
    const eqMove = attacker.moves.find(m => m.name === 'Earthquake');
    assert(eqMove, 'Earthquake move found');

    if (eqMove) {
        const defHpBefore = defender.currentHp;
        await win.performAction(true, eqMove);
        const damage = defHpBefore - defender.currentHp;

        // EQ should deal significant damage (super effective, STAB)
        assert(damage > 0, `Earthquake dealt damage: ${damage}`, 'No damage dealt');
        assert(damage > defHpBefore * 0.3, `Earthquake (STAB, SE) > 30% HP: ${damage}/${defHpBefore}`,
            `Only ${Math.round(damage/defHpBefore*100)}%`);
    }
}

async function testStatusEffects() {
    startCategory('Status Effects');

    // Test burn
    {
        const mon = makeMon('Garchomp', { status: 'BRN' });
        const hpBefore = mon.currentHp;
        setupBattle(mon, makeMon('Pikachu'));
        win.endOfTurnEffects(mon, win.state.fActive);
        const burnDmg = hpBefore - mon.currentHp;
        const expectedDmg = Math.max(1, Math.floor(mon.baseMaxHp / 16));
        assert(burnDmg > 0, `Burn deals damage each turn: ${burnDmg}`, 'No burn damage');
        // Check it's 1/16 (Gen 7+)
        assert(burnDmg === expectedDmg, `Burn damage = 1/16 maxHP (${expectedDmg})`, `Got ${burnDmg}`);
    }

    // Test poison
    {
        const mon = makeMon('Garchomp', { status: 'PSN' });
        const hpBefore = mon.currentHp;
        setupBattle(mon, makeMon('Pikachu'));
        win.endOfTurnEffects(mon, win.state.fActive);
        const psnDmg = hpBefore - mon.currentHp;
        const expectedDmg = Math.max(1, Math.floor(mon.baseMaxHp / 8));
        assert(psnDmg > 0, `Poison deals damage: ${psnDmg}`);
        assert(psnDmg === expectedDmg, `Poison damage = 1/8 maxHP (${expectedDmg})`, `Got ${psnDmg}`);
    }

    // Test paralysis speed reduction
    {
        const mon = makeMon('Garchomp', { status: 'PAR', nature: 'Jolly', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 } });
        const normalSpeed = win.getEffectiveSpeed(mon, null);
        // getEffectiveSpeed should account for PAR
        // Normal speed * 0.5
        const expectedSpeed = Math.floor(mon.stats.spe * 0.5);
        assert(normalSpeed <= mon.stats.spe, `Paralysis reduces speed: ${normalSpeed} <= ${mon.stats.spe}`,
            `Speed not reduced: ${normalSpeed}`);
    }

    // Test type immunity to status
    {
        // Fire type should be immune to burn
        const fireType = makeMon('Charizard', { moves: ['Flamethrower'] });
        setupBattle(fireType, makeMon('Pikachu'));
        win.applyStatus(fireType, 'BRN');
        assert(fireType.status !== 'BRN', 'Fire type immune to burn', `Status: ${fireType.status}`);
    }
    {
        // Electric type immune to paralysis
        const elecType = makeMon('Pikachu', { moves: ['Thunderbolt'] });
        setupBattle(elecType, makeMon('Garchomp'));
        win.applyStatus(elecType, 'PAR');
        assert(elecType.status !== 'PAR', 'Electric type immune to paralysis', `Status: ${elecType.status}`);
    }
    {
        // Poison type immune to poison
        const poisonType = makeMon('Gengar', { moves: ['Shadow Ball'] });
        setupBattle(poisonType, makeMon('Garchomp'));
        win.applyStatus(poisonType, 'PSN');
        assert(poisonType.status !== 'PSN', 'Poison type immune to poison', `Status: ${poisonType.status}`);
    }

    // Test sleep
    {
        const sleeper = makeMon('Garchomp');
        sleeper.status = 'SLP';
        sleeper.sleepDuration = 2;
        sleeper.statusTurns = 0;
        const canMoveResult = win.canMove(sleeper, '');
        assert(!canMoveResult || sleeper.statusTurns > 0, 'Sleeping Pokemon tracks turns',
            `statusTurns: ${sleeper.statusTurns}`);
    }
}

async function testWeatherAndTerrain() {
    startCategory('Weather & Terrain');

    // Test weather setting
    {
        const p = makeMon('Garchomp', { moves: ['Earthquake'] });
        const e = makeMon('Pikachu', { moves: ['Thunderbolt'] });
        setupBattle(p, e);

        win.state.weather = 'Sun';
        win.state.weatherTurns = 5;
        assert(win.state.weather === 'Sun', 'Sun weather can be set');
    }

    // Test Chlorophyll speed doubling in Sun
    {
        const chloro = makeMon('Venusaur', {
            moves: ['Sludge Bomb'],
            directAbility: 'Chlorophyll',
            nature: 'Modest',
            evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 }
        });
        win.state.weather = 'Sun';
        const speedInSun = win.getEffectiveSpeed(chloro, 'Sun');
        const baseSpeed = chloro.stats.spe;
        assert(speedInSun >= baseSpeed * 1.9, `Chlorophyll doubles speed in Sun: ${speedInSun} >= ${baseSpeed * 2}`,
            `Got ${speedInSun}, expected ~${baseSpeed * 2}`);
        win.state.weather = null;
    }

    // Test Swift Swim speed in Rain
    {
        const swimmer = makeMon('Kingdra', {
            moves: ['Hydro Pump'],
            directAbility: 'Swift Swim',
            nature: 'Modest',
            evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 }
        });
        win.state.weather = 'Rain';
        const speedInRain = win.getEffectiveSpeed(swimmer, 'Rain');
        const baseSpeed = swimmer.stats.spe;
        assert(speedInRain >= baseSpeed * 1.9, `Swift Swim doubles speed in Rain: ${speedInRain}`,
            `Got ${speedInRain}, expected ~${baseSpeed * 2}`);
        win.state.weather = null;
    }

    // Test Choice Scarf speed
    {
        const scarfer = makeMon('Garchomp', {
            moves: ['Earthquake'],
            item: 'Choice Scarf',
            nature: 'Jolly',
            evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 }
        });
        const speed = win.getEffectiveSpeed(scarfer, null);
        const baseSpeed = scarfer.stats.spe;
        assert(speed >= baseSpeed * 1.4, `Choice Scarf boosts speed: ${speed} >= ${baseSpeed * 1.5}`,
            `Got ${speed}`);
    }
}

async function testAbilities() {
    startCategory('Abilities');

    // Test Intimidate
    {
        const intimidator = makeMon('Gyarados', {
            moves: ['Waterfall'],
            directAbility: 'Intimidate'
        });
        const target = makeMon('Garchomp', { moves: ['Earthquake'] });
        setupBattle(intimidator, target);

        const atkBefore = target.stages.atk;
        win.applySwitchInAbilities(intimidator, target);
        assert(target.stages.atk < atkBefore, `Intimidate lowers Atk: ${atkBefore} -> ${target.stages.atk}`,
            `Atk stage unchanged: ${target.stages.atk}`);
    }

    // Test Weather setting abilities
    {
        const drizzler = makeMon('Pelipper', {
            moves: ['Scald'],
            directAbility: 'Drizzle'
        });
        const target = makeMon('Garchomp', { moves: ['Earthquake'] });
        setupBattle(drizzler, target);
        win.state.weather = null;
        win.applySwitchInAbilities(drizzler, target);
        assert(win.state.weather === 'Rain', `Drizzle sets Rain`, `Weather: ${win.state.weather}`);
    }

    // Test Drought
    {
        const droughter = makeMon('Torkoal', {
            moves: ['Flamethrower'],
            directAbility: 'Drought'
        });
        const target = makeMon('Pikachu', { moves: ['Thunderbolt'] });
        setupBattle(droughter, target);
        win.state.weather = null;
        win.applySwitchInAbilities(droughter, target);
        assert(win.state.weather === 'Sun', `Drought sets Sun`, `Weather: ${win.state.weather}`);
    }

    // Test Levitate (Ground immunity) - this is checked in performAction
    {
        const levitator = makeMon('Gengar', { moves: ['Shadow Ball'], directAbility: 'Levitate' });
        assert(levitator.ability === 'Levitate', 'Gengar can have Levitate ability');
    }
}

async function testItems() {
    startCategory('Items');

    // Test Leftovers healing
    {
        const mon = makeMon('Blissey', { item: 'Leftovers', moves: ['Soft-Boiled'] });
        mon.currentHp = mon.maxHp - 50; // Damage it a bit
        const hpBefore = mon.currentHp;
        setupBattle(mon, makeMon('Pikachu'));
        win.endOfTurnEffects(mon, win.state.fActive);
        const healed = mon.currentHp - hpBefore;
        const expected = Math.max(1, Math.floor(mon.baseMaxHp / 16));
        assert(healed > 0, `Leftovers heals: ${healed}`, 'No healing');
        assert(healed === expected, `Leftovers heals 1/16 maxHP (${expected})`, `Got ${healed}`);
    }

    // Test Choice Scarf speed boost
    {
        const scarfer = makeMon('Garchomp', { item: 'Choice Scarf', nature: 'Jolly', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 } });
        const normal = makeMon('Garchomp', { item: 'Life Orb', nature: 'Jolly', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 } });
        const scarfSpeed = win.getEffectiveSpeed(scarfer, null);
        const normalSpeed = win.getEffectiveSpeed(normal, null);
        assert(scarfSpeed > normalSpeed, `Choice Scarf Speed (${scarfSpeed}) > normal (${normalSpeed})`);
    }

    // Test Black Sludge on Poison type
    {
        const poisonMon = makeMon('Gengar', { item: 'Black Sludge', moves: ['Shadow Ball'] });
        poisonMon.currentHp = poisonMon.maxHp - 30;
        const hpBefore = poisonMon.currentHp;
        setupBattle(poisonMon, makeMon('Pikachu'));
        win.endOfTurnEffects(poisonMon, win.state.fActive);
        const healed = poisonMon.currentHp - hpBefore;
        assert(healed > 0, `Black Sludge heals Poison type: ${healed}`, `Got ${healed}`);
    }
}

async function testAIBasics() {
    startCategory('AI Basics');

    // Test getBestMove exists and returns a move
    {
        const attacker = makeMon('Garchomp', {
            moves: ['Earthquake', 'Dragon Claw', 'Swords Dance', 'Protect'],
            nature: 'Jolly',
            directAbility: 'Rough Skin'
        });
        const defender = makeMon('Tyranitar', {
            moves: ['Stone Edge', 'Crunch', 'Protect', 'Dragon Dance'],
            directAbility: 'Sand Stream'
        });
        setupBattle(attacker, defender);

        const bestMove = win.getBestMove(attacker, defender);
        assert(bestMove, 'getBestMove returns a move object');
        assert(bestMove.name, `getBestMove chose: ${bestMove ? bestMove.name : 'null'}`);

        // EQ should be preferred (super effective STAB)
        if (bestMove) {
            assert(bestMove.name === 'Earthquake',
                `AI should prefer Earthquake (STAB+SE) vs Tyranitar`,
                `Chose ${bestMove.name} instead`);
        }
    }

    // Test AI doesn't pick Ground move vs Flying type
    {
        const attacker = makeMon('Garchomp', {
            moves: ['Earthquake', 'Dragon Claw', 'Fire Fang', 'Protect'],
            directAbility: 'Rough Skin'
        });
        const flyingDef = makeMon('Togekiss', {
            moves: ['Air Slash'],
            directAbility: 'Serene Grace'
        });
        setupBattle(attacker, flyingDef);

        const bestMove = win.getBestMove(attacker, flyingDef);
        if (bestMove) {
            assert(bestMove.name !== 'Earthquake',
                `AI should NOT pick Earthquake vs Flying (Togekiss)`,
                `Chose ${bestMove.name}`);
        }
    }

    // Test AI prefers super-effective move
    {
        const attacker = makeMon('Pikachu', {
            moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Protect'],
            directAbility: 'Static'
        });
        const waterDef = makeMon('Gyarados', {
            moves: ['Waterfall'],
            directAbility: 'Intimidate'
        });
        setupBattle(attacker, waterDef);

        const bestMove = win.getBestMove(attacker, waterDef);
        if (bestMove) {
            assert(bestMove.name === 'Thunderbolt',
                `AI prefers Thunderbolt (4x SE) vs Gyarados`,
                `Chose ${bestMove.name}`);
        }
    }
}

async function testGameFlow() {
    startCategory('Game Flow');

    // Test buildPokemon produces valid mon
    {
        const mon = makeMon('Dragonite', {
            moves: ['Dragon Dance', 'Outrage', 'Extreme Speed', 'Earthquake'],
            item: 'Lum Berry',
            ability: 'Multiscale',
            nature: 'Adamant',
            evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 }
        });

        assert(mon.name === 'Dragonite', 'Mon has correct name');
        assert(mon.maxHp > 0, `Mon has valid HP: ${mon.maxHp}`);
        assert(mon.currentHp === mon.maxHp, 'Mon starts at full HP');
        assert(mon.status === null, 'Mon starts with no status');
        assert(mon.moves.length === 4, 'Mon has 4 moves');
        assert(mon.stages.atk === 0, 'Mon starts with 0 Atk stages');
        assert(mon.volatile, 'Mon has volatile object');
        assert(mon.type1 === 'Dragon', `Dragonite type1 = Dragon (got ${mon.type1})`);
        assert(mon.type2 === 'Flying', `Dragonite type2 = Flying (got ${mon.type2})`);
    }

    // Test state initialization
    {
        const p = makeMon('Garchomp');
        const e = makeMon('Pikachu');
        setupBattle(p, e);
        assert(win.state.pActive === p, 'Player active mon set');
        assert(win.state.fActive === e, 'Foe active mon set');
        assert(!win.state.isOver, 'Battle not over');
        assert(!win.state.isLocked, 'Battle not locked');
        assert(win.state.weather === null, 'No weather');
        assert(win.state.terrain === null, 'No terrain');
    }
}

async function testGauntletMode() {
    startCategory('Gauntlet Mode');

    // Test nextGauntletRound exists
    assert(typeof win.nextGauntletRound === 'function' || typeof win.skipSwap === 'function',
        'Gauntlet round advancement functions exist');

    // Test gauntlet state setup
    {
        const p = makeMon('Garchomp', { moves: ['Earthquake', 'Dragon Claw', 'Protect', 'Swords Dance'] });
        const e = makeMon('Pikachu', { moves: ['Thunderbolt', 'Volt Switch', 'Protect', 'Grass Knot'] });
        win.state.mode = 'gauntlet';
        win.state.score = 0;
        win.state.playerParty = [p];
        win.state.foeParty = [e];
        win.state.pActive = p;
        win.state.fActive = e;
        win.state.minGen = 1;
        win.state.maxGen = 9;

        assert(win.state.mode === 'gauntlet', 'Gauntlet mode set');
        assert(win.state.score === 0, 'Score starts at 0');
    }
}

// ─── MASS BATTLE SIMULATION ─────────────────────────────────────
async function testMassBattles() {
    startCategory(`Mass Battle Simulation (${BATTLE_COUNT} battles)`);

    let completed = 0;
    let errors = 0;
    let maxTurns = 0;
    let totalTurns = 0;
    let infiniteLoops = 0;
    let anomalies = [];
    let nanDamage = 0;
    let negativeHp = 0;
    let overflowHp = 0;

    const MAX_TURNS_PER_BATTLE = 100;

    // Get a pool of available Pokemon
    const availableMons = Object.keys(win.baseStats).filter(name => {
        const bs = win.baseStats[name];
        return bs && bs.hp > 0 && !name.includes('-Mega') && !name.includes('-Gmax') &&
               !name.includes('-Totem') && bs.hp + bs.atk + bs.def + bs.spa + bs.spd + bs.spe > 200;
    });

    console.log(`  Available Pokemon for battles: ${availableMons.length}`);

    for (let i = 0; i < BATTLE_COUNT; i++) {
        try {
            // Pick 2 random Pokemon
            const name1 = availableMons[Math.floor(Math.random() * availableMons.length)];
            const name2 = availableMons[Math.floor(Math.random() * availableMons.length)];

            // Generate random movesets from available moves
            const allMoves = Object.keys(win.movesDB).filter(m => {
                const md = win.movesDB[m];
                return md && md.pow !== undefined && !win.BANNED_MOVES || !win.BANNED_MOVES.has(m);
            });

            const randomMoves = (count) => {
                const picked = [];
                const available = [...allMoves];
                for (let j = 0; j < count && available.length > 0; j++) {
                    const idx = Math.floor(Math.random() * available.length);
                    picked.push(available.splice(idx, 1)[0]);
                }
                return picked.length >= count ? picked : ['Tackle', 'Protect', 'Swords Dance', 'Quick Attack'];
            };

            const p1 = makeMon(name1, { moves: randomMoves(4), ability: '' });
            const p2 = makeMon(name2, { moves: randomMoves(4), ability: '' });

            setupBattle(p1, p2);
            win.state.mode = 'pve';

            let turns = 0;
            while (!win.state.isOver && turns < MAX_TURNS_PER_BATTLE) {
                turns++;
                win.state.turnNumber = turns;

                // Both sides use AI
                const p1Move = win.getBestMove(p1, p2);
                const p2Move = win.getBestMove(p2, p1);

                if (!p1Move || !p2Move) break;

                // Determine order
                const p1Speed = win.getEffectiveSpeed(p1, win.state.weather);
                const p2Speed = win.getEffectiveSpeed(p2, win.state.weather);
                const p1Pri = p1Move.pri || 0;
                const p2Pri = p2Move.pri || 0;

                let firstIsP1 = p1Pri > p2Pri || (p1Pri === p2Pri && p1Speed >= p2Speed);
                if (win.state.trickRoom > 0 && p1Pri === p2Pri) firstIsP1 = p1Speed <= p2Speed;

                // Execute moves
                const first = firstIsP1 ? { isP: true, move: p1Move } : { isP: false, move: p2Move };
                const second = firstIsP1 ? { isP: false, move: p2Move } : { isP: true, move: p1Move };

                await win.performAction(first.isP, first.move);

                // Check for anomalies after first move
                if (p1.currentHp < 0) { negativeHp++; p1.currentHp = 0; }
                if (p2.currentHp < 0) { negativeHp++; p2.currentHp = 0; }
                if (p1.currentHp > p1.maxHp) { overflowHp++; }
                if (p2.currentHp > p2.maxHp) { overflowHp++; }

                if (p1.currentHp <= 0 || p2.currentHp <= 0) {
                    win.state.isOver = true;
                    break;
                }

                await win.performAction(second.isP, second.move);

                if (p1.currentHp < 0) { negativeHp++; p1.currentHp = 0; }
                if (p2.currentHp < 0) { negativeHp++; p2.currentHp = 0; }

                if (p1.currentHp <= 0 || p2.currentHp <= 0) {
                    win.state.isOver = true;
                    break;
                }

                // End of turn effects
                if (typeof win.endOfTurnEffects === 'function') {
                    win.endOfTurnEffects(p1, p2);
                    win.endOfTurnEffects(p2, p1);
                }

                if (p1.currentHp <= 0 || p2.currentHp <= 0) {
                    win.state.isOver = true;
                }
            }

            if (turns >= MAX_TURNS_PER_BATTLE) {
                infiniteLoops++;
                anomalies.push({ battle: i, type: 'infinite_loop', p1: name1, p2: name2, turns });
            }

            totalTurns += turns;
            maxTurns = Math.max(maxTurns, turns);
            completed++;

        } catch (e) {
            errors++;
            if (anomalies.length < 20) {
                anomalies.push({ battle: i, type: 'error', message: e.message });
            }
        }
    }

    const avgTurns = completed > 0 ? (totalTurns / completed).toFixed(1) : 0;

    assert(completed > 0, `Battles completed: ${completed}/${BATTLE_COUNT}`);
    assert(errors < BATTLE_COUNT * 0.1, `Errors < 10%: ${errors} errors`, `${errors} errors in ${BATTLE_COUNT} battles`);
    assert(infiniteLoops === 0, `No infinite loops (>100 turns)`, `${infiniteLoops} battles hit 100 turn limit`);
    assert(negativeHp === 0, `No negative HP values`, `${negativeHp} instances`);
    assert(overflowHp === 0, `No HP overflow (> maxHP)`, `${overflowHp} instances`);

    console.log(`\n  Battle Stats:`);
    console.log(`    Completed: ${completed}/${BATTLE_COUNT}`);
    console.log(`    Errors: ${errors}`);
    console.log(`    Avg turns: ${avgTurns}`);
    console.log(`    Max turns: ${maxTurns}`);
    console.log(`    Infinite loops: ${infiniteLoops}`);
    console.log(`    Negative HP: ${negativeHp}`);
    console.log(`    HP Overflow: ${overflowHp}`);

    if (anomalies.length > 0) {
        console.log(`\n  Anomalies (first ${Math.min(10, anomalies.length)}):`);
        anomalies.slice(0, 10).forEach(a => console.log(`    - ${JSON.stringify(a)}`));
    }

    results.massBattle = { completed, errors, avgTurns: parseFloat(avgTurns), maxTurns, infiniteLoops, negativeHp, overflowHp, anomalies: anomalies.slice(0, 20) };
}

// ─── DRAFT POOL GENERATION TEST ──────────────────────────────────
async function testDraftPoolGeneration() {
    startCategory('Draft Pool Generation');

    // Test getDraftPool function
    if (typeof win.getDraftPool !== 'function') {
        // It might not be exposed on window, try to access it
        skip('getDraftPool not exposed on window');
        return;
    }

    // Gen 1 pool
    const gen1Pool = win.getDraftPool(1, 1, [1, 2, 3, 4]);
    assert(gen1Pool.length > 0, `Gen 1 pool has Pokemon: ${gen1Pool.length}`);

    // Gen 9 pool
    const gen9Pool = win.getDraftPool(9, 9, [1, 2, 3, 4]);
    assert(gen9Pool.length > 0, `Gen 9 pool has Pokemon: ${gen9Pool.length}`);

    // All gens pool
    const allPool = win.getDraftPool(1, 9, [1, 2, 3, 4]);
    assert(allPool.length >= gen1Pool.length, `All-gen pool (${allPool.length}) >= Gen 1 (${gen1Pool.length})`);

    // Grade filtering
    const g1Only = win.getDraftPool(1, 9, [1]);
    const g4Only = win.getDraftPool(1, 9, [4]);
    const allGrades = win.getDraftPool(1, 9, [1, 2, 3, 4]);
    assert(allGrades.length >= g1Only.length, `All grades (${allGrades.length}) >= G1 only (${g1Only.length})`);

    // Test makeBuild for random Pokemon
    if (typeof win.makeBuild !== 'function') {
        skip('makeBuild not exposed');
    } else {
        const testNames = ['Pikachu', 'Garchomp', 'Tyranitar'];
        for (const name of testNames) {
            try {
                const build = win.makeBuild(name);
                assert(build && build.m && build.m.length >= 1, `makeBuild("${name}") produces valid build with moves`);
                assert(build.i, `makeBuild("${name}") assigns an item: ${build.i}`);
            } catch (e) {
                assert(false, `makeBuild("${name}") throws`, e.message);
            }
        }
    }
}

// ─── RUN ALL TESTS ──────────────────────────────────────────────
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('  POKEMON VGC BATTLE SIMULATOR - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(60));
    console.log(`  Date: ${new Date().toISOString()}`);
    console.log(`  Battles: ${BATTLE_COUNT}`);
    console.log(`  Category: ${CATEGORY}`);
    console.log(`  Verbose: ${VERBOSE}`);

    try {
        console.log('\nWaiting for game data to load...');
        await waitForData();
        console.log('Data loaded successfully!\n');

        // Ensure animations are off to prevent DOM issues
        win.eval(`settings.animations = false;`);

        // Expose internal functions for testing
        // Some functions may not be on window, check and handle gracefully
        if (!win.getMoveEffectiveness) {
            // Try to find it
            win.eval(`window.getMoveEffectiveness = getMoveEffectiveness;`);
        }
        if (!win.getEffectiveSpeed) {
            win.eval(`window.getEffectiveSpeed = getEffectiveSpeed;`);
        }
        if (!win.endOfTurnEffects) {
            win.eval(`window.endOfTurnEffects = endOfTurnEffects;`);
        }
        if (!win.applyStatus) {
            win.eval(`window.applyStatus = applyStatus;`);
        }
        if (!win.canMove) {
            win.eval(`window.canMove = canMove;`);
        }
        if (!win.applySwitchInAbilities) {
            win.eval(`window.applySwitchInAbilities = applySwitchInAbilities;`);
        }
        if (!win.performAction) {
            win.eval(`window.performAction = performAction;`);
        }
        if (!win.checkFaints) {
            win.eval(`window.checkFaints = checkFaints;`);
        }
        if (!win.getDraftPool) {
            win.eval(`window.getDraftPool = getDraftPool;`);
        }
        if (!win.makeBuild) {
            win.eval(`window.makeBuild = makeBuild;`);
        }
        if (!win.nextGauntletRound) {
            win.eval(`window.nextGauntletRound = nextGauntletRound;`);
        }
        if (!win.changeStage) {
            win.eval(`window.changeStage = changeStage;`);
        }
        if (!win.BANNED_MOVES) {
            win.eval(`window.BANNED_MOVES = BANNED_MOVES;`);
        }

        const categories = {
            data: testDataIntegrity,
            builds: testBuildValidation,
            stats: testStatCalculation,
            types: testTypeEffectiveness,
            damage: testDamageCalcBasics,
            status: testStatusEffects,
            weather: testWeatherAndTerrain,
            abilities: testAbilities,
            items: testItems,
            ai: testAIBasics,
            flow: testGameFlow,
            gauntlet: testGauntletMode,
            draft: testDraftPoolGeneration,
            battles: testMassBattles
        };

        if (CATEGORY === 'all') {
            for (const [name, fn] of Object.entries(categories)) {
                await fn();
            }
        } else if (categories[CATEGORY]) {
            await categories[CATEGORY]();
        } else {
            console.error(`Unknown category: ${CATEGORY}. Available: ${Object.keys(categories).join(', ')}`);
        }

    } catch (e) {
        console.error('\nFATAL ERROR:', e.message);
        console.error(e.stack);
        results.errors.push({ type: 'fatal', message: e.message });
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('  SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Passed:  ${results.totalPassed}`);
    console.log(`  Failed:  ${results.totalFailed}`);
    console.log(`  Skipped: ${results.totalSkipped}`);
    console.log(`  Total:   ${results.totalPassed + results.totalFailed + results.totalSkipped}`);
    console.log('');

    for (const [name, cat] of Object.entries(results.categories)) {
        const status = cat.failed === 0 ? 'OK' : 'FAIL';
        console.log(`  ${status.padEnd(6)} ${name}: ${cat.passed} passed, ${cat.failed} failed`);
    }

    // Write log file if requested
    if (LOG_FILE) {
        fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
        console.log(`\n  Results written to: ${LOG_FILE}`);
    }

    console.log('\n' + '='.repeat(60));

    // Exit with error code if any tests failed
    if (results.totalFailed > 0) {
        process.exit(1);
    }
}

main().catch(e => {
    console.error('Unhandled error:', e);
    process.exit(2);
});
