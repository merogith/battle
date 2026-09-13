// Repeatable audit probes; the original 62202bde results are preserved separately. Does not change game code or real saves.
import { writeFileSync } from 'node:fs';
import { loadEngine } from '../../tests/helpers/load-engine.js';
import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { resolveBattle } from './story-sim/resolve-battle.mjs';

const E = await loadEngine();
const { window: w, engine, mkMon, reset } = E;
const findings = {};
const gen = new Generations(Dex).get(9);
findings.natureStatChecks = { comparisons:0, mismatches:[] };
for (const species of ['Pikachu','Charizard','Blissey','Shedinja']) {
  for (const nature of gen.natures) {
    for (const iv of [0,31]) for (const ev of [0,252]) {
      const ivs = Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(s=>[s,iv]));
      const evs = {hp:ev,atk:ev};
      const mon = mkMon({species,nature:nature.name,ivs,evs});
      for (const stat of ['hp','atk','def','spa','spd','spe']) {
        const expected = gen.stats.calc(stat,Dex.species.get(species).baseStats[stat],iv,evs[stat]||0,50,nature);
        const actual = stat==='hp'?mon.maxHp:mon.stats[stat];
        findings.natureStatChecks.comparisons++;
        if(actual!==expected) findings.natureStatChecks.mismatches.push({species,nature:nature.name,iv,ev,stat,actual,expected});
      }
    }
  }
}
findings.fixedGenderMismatches = [];
for (const sp of Dex.species.all()) {
  if (!sp.gender || !engine.baseStats?.[sp.name]) continue;
  const mon = mkMon({ species: sp.name });
  const expected = sp.gender === 'N' ? null : sp.gender;
  if (mon.gender !== expected) findings.fixedGenderMismatches.push({species:sp.name,expected,actual:mon.gender});
}
findings.genderExamples = ['Latias','Latios','Cresselia','Heatran','Tornadus','Gothitelle','Comfey'].map(species => {
  const sp = Dex.species.get(species);
  return { species, actual:mkMon({species}).gender, canonicalGender:sp.gender || sp.genderRatio };
});
function megaProbe(extra) {
  reset();
  const build = { m:['Tackle'], a:'Blaze', i:'Charizardite X', n:'Hardy', ...extra };
  const mon = engine.buildPokemon('Charizard', build);
  const foe = mkMon({species:'Snorlax',moves:['Splash']});
  engine.state.pActive = mon; engine.state.fActive = foe;
  engine.state.playerParty=[mon]; engine.state.foeParty=[foe];
  const before = {...mon.stats};
  w.activateMega(mon, true);
  const expected = engine.buildPokemon('Charizard-Mega-X', {...build, m:['Tackle']});
  return {extra,before,after:{...mon.stats},expectedSameBuild:{...expected.stats},hp:mon.maxHp};
}
findings.mega = [megaProbe({}),megaProbe({_storyStatMult:1.30}),megaProbe({expShareLevels:3}),megaProbe({bonus:{atk:10,def:10,spa:10,spd:10,spe:10}})];
findings.exports = { setMonForm:typeof w._setMonForm, save:typeof w.StoryMode.save };
if (typeof w._setMonForm === 'function') {
  const mon = engine.buildPokemon('Castform',{m:['Tackle'],a:'Forecast',n:'Hardy',_storyStatMult:1.3});
  const before = {hp:mon.maxHp,...mon.stats};
  w._setMonForm(mon,'Castform-Rainy');
  findings.forecast = {before,after:{hp:mon.maxHp,...mon.stats},retainedMultiplierMarker:mon._storyStatMult};
}
const ST = w.__storyTest;
findings.storyStructure = {rows:ST.STORY_EVENTS_RAW.length,battles:ST.STORY_EVENTS_RAW.filter(r=>r[1]==='Battle').length};
const p = mkMon({species:'Snorlax',moves:['Tackle'],ability:'Thick Fat'});
const f = mkMon({species:'Blissey',moves:['Splash'],ability:'Natural Cure'});
const fullHP = f.currentHp;
await resolveBattle(E,{mons:[p]},{mons:[f]},{maxTurns:1,seed:1});
const afterFirstAttempt = f.currentHp;
const freshPlayer = mkMon({species:'Snorlax',moves:['Tackle'],ability:'Thick Fat'});
await resolveBattle(E,{mons:[freshPlayer]},{mons:[f]},{maxTurns:0,seed:1});
findings.simRetry = {fullHP,afterFirstAttempt,startOfNextAttempt:f.currentHp};
writeFileSync(new URL('../../docs/review-evidence-2026-09-12/implementation-stat-probes.json', import.meta.url),JSON.stringify(findings,null,2)+'\n');
console.log(JSON.stringify(findings,null,2));
E.teardown();
