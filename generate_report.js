const fs = require('fs');

const html = fs.readFileSync('battle.html', 'utf8');

const abilitiesJsonRaw = JSON.parse(fs.readFileSync('./data/abilities.json', 'utf8'));
const itemsJsonRaw = JSON.parse(fs.readFileSync('./data/items.json', 'utf8'));
const movesJsonRaw = JSON.parse(fs.readFileSync('./data/moves.json', 'utf8'));

const abilities = abilitiesJsonRaw['9'] || abilitiesJsonRaw;
const items = itemsJsonRaw['9'] || itemsJsonRaw;
const moves = movesJsonRaw['9'] || movesJsonRaw;

function isHandled(name) {
    if (!name) return false;
    let n1 = name.replace(/[^A-Za-z0-9]/g, '');
    let n2 = name;
    return html.includes(`"${name}"`) || html.includes(`'${name}'`) || 
           html.includes(`"${n1}"`) || html.includes(`'${n1}'`);
}

let report = `# Pokémon Battle Engine - Mechanics Audit Report\n\n`;

// 1. ABILITIES
let missingAbilities = [];
let handledAbilities = [];
for (let key of Object.keys(abilities)) {
    if (key === 'inherit' || typeof abilities[key] !== 'object') continue;
    let a = abilities[key];
    if (!a.name || a.isNonstandard || a.isNonstandard === 'Past') continue;
    if (isHandled(a.name)) handledAbilities.push(a.name);
    else missingAbilities.push(a.name);
}
report += `## Abilities\nSupported (${handledAbilities.length}), Missing (${missingAbilities.length})\n\n`;
report += `### Hardest Missing Abilities to Implement\n`;
let complexAbilities = missingAbilities.filter(a => ['Illusion', 'Imposter', 'Drizzle', 'Drought', 'Sand Stream', 'Snow Warning', 'Transform', 'Trace', 'Intimidate', 'Magic Bounce'].includes(a));
if (complexAbilities.length === 0) complexAbilities = missingAbilities.slice(0, 10);
report += complexAbilities.map(a => `- ${a}`).join('\n') + `\n\n`;


// 2. ITEMS
let missingItems = [];
let handledItems = [];
for (let key of Object.keys(items)) {
    if (key === 'inherit' || typeof items[key] !== 'object') continue;
    let i = items[key];
    if (!i.name || i.isNonstandard) continue;
    // skip purely cosmetic or mega stones / z crystals if we handle them differently
    if (i.megaStone || i.zMove) continue; 
    
    if (isHandled(i.name)) handledItems.push(i.name);
    else missingItems.push(i.name);
}
report += `## Items\nSupported (${handledItems.length}), Missing (${missingItems.length})\n\n`;
report += `### Important Missing Items\n`;
let complexItems = missingItems.filter(i => i.includes('Choice') || i.includes('Vest') || i.includes('Orb') || i.includes('Berry') || i.includes('Leftovers'));
if(complexItems.length > 20) complexItems = complexItems.slice(0, 20);
report += complexItems.map(i => `- ${i}`).join('\n') + `\n\n`;

// 3. MOVES
let missingMoves = [];
let handledMoves = [];
let lockMoves = [];
let multiTurnMoves = [];
let forcedSwitchMoves = [];

for (let key of Object.keys(moves)) {
    if (key === 'inherit' || typeof moves[key] !== 'object') continue;
    let m = moves[key];
    if (!m.name || m.isNonstandard) continue;
    
    if (isHandled(m.name)) {
        handledMoves.push(m.name);
    } else {
        missingMoves.push(m.name);
    }
    
    if (m.flags && m.flags.recharge) multiTurnMoves.push(m.name);
    if (m.flags && m.flags.charge) multiTurnMoves.push(m.name);
    if (m.selfSwitch || m.forceSwitch) forcedSwitchMoves.push(m.name);
}

report += `## Moves\nSupported Edge-Cases (${handledMoves.length}), Unhandled Generic/Edge-Case (${missingMoves.length})\n\n`;
report += `### Complex Move Types\n`;
report += `- **Multi-turn / Recharge Moves (${multiTurnMoves.length})**: ${multiTurnMoves.slice(0,10).join(', ')}... (check engine lock state)\n`;
report += `- **Forced Switch Moves (${forcedSwitchMoves.length})**: ${forcedSwitchMoves.slice(0,10).join(', ')}... (needs UI prompt handling)\n`;

fs.writeFileSync('C:/Users/Meriç/.gemini/antigravity/brain/230e4b58-c242-4db6-a9ce-45ccefb961e3/artifacts/engine_audit_report.md', report);
console.log("Written engine_audit_report.md");
