const fs = require('fs');

const html = fs.readFileSync('battle.html', 'utf8');

const abilitiesJsonRaw = JSON.parse(fs.readFileSync('./data/abilities.json', 'utf8'));
const itemsJsonRaw = JSON.parse(fs.readFileSync('./data/items.json', 'utf8'));
const movesJsonRaw = JSON.parse(fs.readFileSync('./data/moves.json', 'utf8'));

const abilitiesJson = abilitiesJsonRaw['9'] || abilitiesJsonRaw;
const itemsJson = itemsJsonRaw['9'] || itemsJsonRaw;
const movesJson = movesJsonRaw['9'] || movesJsonRaw;

let missingAbilities = [];
for (let key of Object.keys(abilitiesJson)) {
	if (key === 'inherit' || typeof abilitiesJson[key] !== 'object') continue;
    let name = abilitiesJson[key].name;
    if (!name) continue;
    if (!html.includes(`"${name}"`) && !html.includes(`'${name}'`)) {
        missingAbilities.push(name);
    }
}

let missingItems = [];
for (let key of Object.keys(itemsJson)) {
	if (key === 'inherit' || typeof itemsJson[key] !== 'object') continue;
    let name = itemsJson[key].name;
    if (!name) continue;
    if (!html.includes(`"${name}"`) && !html.includes(`'${name}'`)) {
        missingItems.push(name);
    }
}

let missingMoves = [];
for (let key of Object.keys(movesJson)) {
	if (key === 'inherit' || typeof movesJson[key] !== 'object') continue;
	let name = movesJson[key].name;
    if (!name) continue;
    if (!html.includes(`"${name}"`) && !html.includes(`'${name}'`)) {
        missingMoves.push(name);
    }
}

function summarize(arr, label) {
    console.log(`\n=== ${label} (Total unreferenced: ${arr.length}) ===`);
    console.log(arr.slice(0, 50).join(', ') + (arr.length > 50 ? ' ...' : ''));
}

console.log("Analyzing battle.html...");
summarize(missingAbilities, "Potentially Missing Abilities");
summarize(missingItems, "Potentially Missing Items");
summarize(missingMoves, "Potentially Missing Specific Move Handlers");
