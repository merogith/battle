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

// Disable sleeps for immediate testing
window.sleep = () => Promise.resolve();
window.playPokeballAnimation = () => Promise.resolve();
window.logMsg = (msg, type) => console.log(`[LOG] ${msg}`);
window.updateUI = () => {};

setTimeout(() => {
    try {
        console.log("--- BATTLE ENGINE TEST ---");
        
        let pActive = window.buildPokemon("Ditto", {m: ["Transform"], i: "Choice Scarf", id: "ditto1", _gender: "null"});
        let fActive = window.buildPokemon("Snorlax", {m: ["Body Slam", "Super Fang", "Gyro Ball"], i: "Leftovers", id: "snorlax1", _gender: "M"});
        
        window.state = {
            playerParty: [pActive],
            foeParty: [fActive],
            pActive: pActive,
            fActive: fActive,
            score: 1,
            mode: 'gauntlet',
            minGen: 1, maxGen: 8,
            pSide: {}, fSide: {}
        };
        window.settings = { partySize: 1, draftGrades: [1,2,3,4] };
        
        console.log("--- TESTING Transform ---");
        window.performAction(pActive, pActive.moves[0], fActive, false).then(() => {
            console.log("Ditto after Transform:", window.state.pActive.name, "transformedInto:", window.state.pActive.transformedInto);
            
            console.log("--- TESTING Super Fang (Variable Damage) ---");
            let startHp = window.state.pActive.currentHp;
            let expectedDamage = Math.floor(startHp / 2);
            window.performAction(fActive, fActive.moves[1], pActive, false).then(() => {
                let actualDamage = startHp - window.state.pActive.currentHp;
                console.log(`Super Fang Damage: ${actualDamage} (Expected: ${expectedDamage})`);
                
                console.log("--- TESTING Gauntlet Reset ---");
                // simulate next gauntlet round
                window.state.score++;
                window.state.playerParty.forEach((m, i) => {
                    let bn = m._baseName || m.name;
                    window.state.playerParty[i] = window.buildPokemon(bn, m.buildData);
                });
                
                let resetP = window.state.playerParty[0];
                console.log(`Reset Player: ${resetP.name}, TransformedInto: ${resetP.transformedInto}, HP: ${resetP.currentHp}`);
                process.exit(0);
            }).catch(e => console.error(e));
        }).catch(e => console.error(e));

    } catch (e) {
        console.error(e);
    }
}, 1000); // Give jsdom time to parse everything
