import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'battle.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const gen = fs.readFileSync(path.join(__dirname, 'generated-trainer-rows.txt'), 'utf8');
const needle = `          { role:'Champion', name:'Red',           type:'Mixed', sigs:['Pikachu','Venusaur','Charizard','Blastoise','Snorlax'],               charGen:1, pkmGens:[1] },\n          { role:'Basic Trainer', name:'Team Rocket Grunt', type:'Poison', sigs:['Ekans','Rattata','Zubat','Koffing','Meowth'], charGen:1, pkmGens:[1,2] },`;
const insert = `          { role:'Champion', name:'Red',           type:'Mixed', sigs:['Pikachu','Venusaur','Charizard','Blastoise','Snorlax'],               charGen:1, pkmGens:[1] },\n` + gen + `          { role:'Basic Trainer', name:'Team Rocket Grunt', type:'Poison', sigs:['Ekans','Rattata','Zubat','Koffing','Meowth'], charGen:1, pkmGens:[1,2] },`;
if (!html.includes(needle)) throw new Error('needle not found');
fs.writeFileSync(htmlPath, html.replace(needle, insert));
console.log('Inserted', gen.trim().split('\n').length, 'trainer rows');
