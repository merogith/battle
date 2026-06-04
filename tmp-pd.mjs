import { loadEngine } from './tests/helpers/load-engine.js';
const eng = await loadEngine();
const w = eng.window || globalThis.window;
const pd = w.pokedex;
console.log('typeof pokedex:', typeof pd);
if (pd) {
  const keys = Object.keys(pd);
  console.log('entries:', keys.length, '| sample keys:', keys.slice(0,5).join(', '));
  for (const n of ['Pikachu','Nincada','Charizard']) {
    const e = pd[n];
    console.log(n+':', e ? JSON.stringify({type1:e.type1, type2:e.type2, t1:e.t1, t2:e.t2, types:e.types}) : 'MISSING');
  }
}
