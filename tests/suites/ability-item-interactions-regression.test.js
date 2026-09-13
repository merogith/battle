import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E;
before(async () => { E = await loadEngine(); });
after(() => E.teardown());

async function hit({ move = 'Tackle', ability = 'Pressure', targetAbility = 'Pressure', item = null,
  targetItem = null, targetSpecies = 'Mew', targetVolatile = {}, targetStatus = null, stages = {}, targetStages = {}, volatile = {}, status = null, field = {}, screens = {}, gender = null, targetGender = null, hp = null, rng = 0.99 } = {}) {
  E.reset();
  E.window.StoryMode.state.active = false;
  const a = E.mkMon({ species: 'Mew', moves: [move], ability, item });
  const d = E.mkMon({ species: targetSpecies, moves: ['Splash'], ability: targetAbility, item: targetItem });
  a.stats.spe = 999; a.status = status;
  a.gender=gender; d.gender=targetGender;
  if(hp!==null) {a.maxHp=400;a.currentHp=hp;}
  Object.assign(a.stages, stages); Object.assign(d.stages, targetStages);
  Object.assign(a.volatile, volatile); Object.assign(d.volatile, targetVolatile); d.status=targetStatus;
  d.maxHp = d.currentHp = 9999;
  const st = E.engine.state;
  Object.assign(st, { mode: 'pve', pActive: a, fActive: d, playerParty: [a], foeParty: [d],
    magicRoom: 0, wonderRoom: 0, weather: null, weatherTurns: 0, terrain: null, ...field });
  Object.assign(st.fSide, screens);
  E.window.Math.random = () => rng;
  try {
    await E.window.playTurn(0, null);
    return { events: st.battleEvents || [], calculated: st.battleEvents?.find(e=>e.kind==='calculation' && e.playerAttacking)?.damage, damage: 9999 - d.currentHp, attacker: a, defender: d };
  } finally { E.window.Math.random = E.nextFloat; }
}

test('Mold Breaker family bypasses the full defensive ability, including vulnerabilities', async () => {
  for (const ability of ['Mold Breaker', 'Teravolt', 'Turboblaze']) {
    for (const [targetAbility, move] of [['Fluffy','Ember'], ['Fluffy','Tackle'],
      ['Fur Coat','Tackle'], ['Fur Coat','Psyshock'], ['Punk Rock','Hyper Voice'], ['Dry Skin','Ember']]) {
      const baseline = await hit({ ability, move });
      const result = await hit({ ability, move, targetAbility });
      assert.equal(result.damage, baseline.damage, `${ability} vs ${targetAbility}, ${move}`);
    }
  }
});

test('Unaware ignores negative as well as positive offensive and defensive stages', async () => {
  for (const stage of [-4, 4]) {
    const defenseBase = await hit({ ability: 'Unaware' });
    assert.equal((await hit({ ability: 'Unaware', targetStages: { def: stage } })).damage, defenseBase.damage);
    const attackBase = await hit({ targetAbility: 'Unaware' });
    assert.equal((await hit({ targetAbility: 'Unaware', stages: { atk: stage } })).damage, attackBase.damage);
  }
  const baseline = await hit({ ability: 'Mold Breaker', stages: { atk: 2 } });
  assert.equal((await hit({ ability: 'Mold Breaker', targetAbility: 'Unaware', stages: { atk: 2 } })).damage, baseline.damage);
});

test('Psyshock uses Defense modifiers and ignores Assault Vest', async () => {
  const baseline = await hit({ move: 'Psyshock' });
  assert.equal((await hit({ move: 'Psyshock', targetItem: 'Assault Vest' })).damage, baseline.damage);
  const fur = await hit({ move: 'Psyshock', targetAbility: 'Fur Coat' });
  assert.ok(fur.damage < baseline.damage * 0.6, 'Fur Coat applies to Defense-targeting special moves');
});

test('Klutz suppresses offensive and defensive held-item multipliers', async () => {
  assert.equal((await hit({ ability: 'Klutz', item: 'Choice Band' })).damage,
    (await hit({ ability: 'Klutz' })).damage);
  assert.equal((await hit({ move: 'Swift', targetAbility: 'Klutz', targetItem: 'Assault Vest' })).damage,
    (await hit({ move: 'Swift', targetAbility: 'Klutz' })).damage);
});

test('Aurora Veil and the matching screen do not stack', async () => {
  for (const [move, screen] of [['Tackle','reflect'], ['Swift','lightScreen']]) {
    const single = await hit({ move, screens: { [screen]: 5 } });
    assert.equal((await hit({ move, screens: { [screen]: 5, auroraVeil: 5 } })).damage, single.damage);
  }
});

test('Electromorphosis and Charge use one doubling effect, consumed once', async () => {
  const charge = await hit({ move: 'Thunderbolt', volatile: { charge: 1 } });
  const electro = await hit({ move: 'Thunderbolt', ability: 'Electromorphosis', volatile: { electromorphosisCharged: true } });
  const both = await hit({ move: 'Thunderbolt', ability: 'Electromorphosis', volatile: { charge: 1, electromorphosisCharged: true } });
  assert.equal(electro.damage, charge.damage);
  assert.equal(both.damage, charge.damage);
  assert.equal(both.attacker.volatile.electromorphosisCharged, false);
  assert.equal(both.attacker.volatile.charge, 0);
});

test('Guts does not boost special moves', async () => {
  assert.equal((await hit({ move: 'Swift', ability: 'Guts', status: 'PSN' })).damage,
    (await hit({ move: 'Swift', ability: 'Guts' })).damage);
});


test('Sheer Force uses canonical secondary metadata, with no false bonuses or retained boosts', async () => {
  for (const move of ['Surf','Magical Leaf','Plasma Fists','Wing Attack','Submission']) {
    assert.equal((await hit({move,ability:'Sheer Force'})).damage,(await hit({move})).damage,move);
  }
  for (const move of ['Power-Up Punch','Acid Spray']) {
    const boosted=await hit({move,ability:'Sheer Force'}),plain=await hit({move});
    assert.ok(boosted.damage>plain.damage,move+' boosted');
    assert.equal(boosted.attacker.stages.atk,0,'self secondary suppressed');
    assert.equal(boosted.defender.stages.spd,0,'target secondary suppressed');
  }
});

test('Shield Dust and Covert Cloak block target secondaries, preserving self and primary effects', async () => {
  for (const protection of [{targetAbility:'Shield Dust'},{targetItem:'Covert Cloak'}]) {
    assert.equal((await hit({move:'Acid Spray',...protection})).defender.stages.spd,0);
    assert.equal((await hit({move:'Power-Up Punch',...protection})).attacker.stages.atk,1);
    assert.equal((await hit({move:'Clear Smog',targetStages:{atk:4},...protection})).defender.stages.atk,0);
    assert.equal(!!(await hit({move:'Salt Cure',...protection})).defender.volatile.saltCure,false);
  }
  assert.equal((await hit({move:'Acid Spray',ability:'Mold Breaker',targetAbility:'Shield Dust'})).defender.stages.spd,-2);
  assert.equal((await hit({move:'Acid Spray',targetAbility:'Klutz',targetItem:'Covert Cloak'})).defender.stages.spd,-2);
  assert.equal((await hit({move:'Acid Spray',targetItem:'Covert Cloak',field:{magicRoom:5}})).defender.stages.spd,-2);
});

test('a broken Substitute still blocks target effects and item removal on that hit',async()=>{
  const targetVolatile={sub:1};
  assert.equal((await hit({move:'Acid Spray',targetVolatile})).defender.stages.spd,0);
  assert.equal((await hit({move:'Clear Smog',targetStages:{atk:4},targetVolatile})).defender.stages.atk,4);
  assert.equal((await hit({move:'Power-Up Punch',targetVolatile})).attacker.stages.atk,1);
  assert.equal((await hit({move:'Knock Off',targetItem:'Leftovers',targetVolatile})).defender.item,'Leftovers');
});

test('Liquid Voice resolves before type effectiveness and absorbing abilities',async()=>{
  const ghost=await hit({move:'Hyper Voice',ability:'Liquid Voice',targetSpecies:'Gengar'});
  assert.ok(ghost.damage>0,'converted sound move hits Ghost');
  const absorb=await hit({move:'Hyper Voice',ability:'Liquid Voice',targetAbility:'Water Absorb'});
  assert.equal(absorb.damage,0);
  assert.equal((await hit({move:'Hyper Voice',ability:'Liquid Voice',field:{weather:'HarshSun',weatherTurns:5}})).damage,0);
});

test('converted Normal attacks respect their new immunity and Struggle remains typeless',async()=>{
  assert.equal((await hit({move:'Tackle',ability:'Galvanize',targetAbility:'Volt Absorb'})).damage,0);
  assert.equal((await hit({move:'Swift',ability:'Normalize',targetSpecies:'Gengar'})).damage,0);
  assert.equal((await hit({move:'Struggle',ability:'Normalize'})).damage,(await hit({move:'Struggle'})).damage);
});

test('source-stat overrides retain source physical modifiers',async()=>{
  for(const move of ['Body Press','Foul Play']) {
    const plain=await hit({move}),huge=await hit({move,ability:'Huge Power'});
    assert.ok(huge.damage>plain.damage*1.8,move+' Huge Power');
  }
});

test('Silk Scarf is applied once and Metal Powder affects Defense only',async()=>{
  const plain=await hit({move:'Swift'}),scarf=await hit({move:'Swift',item:'Silk Scarf'});
  assert.ok(scarf.damage>plain.damage && scarf.damage<plain.damage*1.3);
  assert.equal((await hit({move:'Swift',targetSpecies:'Ditto',targetItem:'Metal Powder'})).damage,
    (await hit({move:'Swift',targetSpecies:'Ditto'})).damage);
});

test('Snow and Grass Pelt apply to Defense, including Psyshock',async()=>{
  for(const move of ['Tackle','Psyshock']) {
    const plain=await hit({move,targetSpecies:'Glaceon'});
    assert.ok((await hit({move,targetSpecies:'Glaceon',field:{weather:'Snow',weatherTurns:5}})).damage<plain.damage);
    const grassy={terrain:'Grassy',terrainTurns:5};
    assert.ok((await hit({move,targetAbility:'Grass Pelt',field:grassy})).calculated<(await hit({move,field:grassy})).calculated);
  }
});

test('Captivate checks both genders and respects ability bypass',async()=>{
  for(const [gender,targetGender] of [[null,'F'],['M',null],['F','F']])
    assert.equal((await hit({move:'Captivate',gender,targetGender})).defender.stages.spa,0);
  assert.equal((await hit({move:'Captivate',gender:'M',targetGender:'F'})).defender.stages.spa,-2);
  assert.equal((await hit({move:'Captivate',gender:'M',targetGender:'F',targetAbility:'Oblivious'})).defender.stages.spa,0);
  assert.equal((await hit({move:'Captivate',gender:'M',targetGender:'F',targetAbility:'Oblivious',ability:'Mold Breaker'})).defender.stages.spa,-2);
});

test('Snowscape enables Aurora Veil, Ice Body and Slush Rush without hail chip',async()=>{
  const snow=await hit({move:'Snowscape'});
  assert.equal(E.engine.state.weather,'Snow');assert.equal(snow.damage,0);
  await hit({move:'Aurora Veil',field:{weather:'Snow',weatherTurns:5}});
  assert.ok(E.engine.state.pSide.auroraVeil>0);
  const ice=await hit({move:'Splash',ability:'Ice Body',hp:100,field:{weather:'Snow',weatherTurns:5}});
  assert.equal(ice.attacker.currentHp,125);
  ice.attacker.ability='Slush Rush';ice.attacker.stats.spe=100;
  assert.equal(E.window.getEffectiveSpeed(ice.attacker,'Snow'),200);
});

test('healing moves use their own recovery fraction and Jungle Healing cures status',async()=>{
  assert.equal((await hit({move:'Life Dew',hp:100})).attacker.currentHp,200);
  const jungle=await hit({move:'Jungle Healing',hp:100,status:'PSN'});
  assert.equal(jungle.attacker.currentHp,200);assert.equal(jungle.attacker.status,null);
  assert.equal((await hit({move:'Shore Up',hp:100,field:{weather:'Rain',weatherTurns:5}})).attacker.currentHp,300);
});

test('Sheer Force does not suppress contact abilities',async()=>{
  const r=await hit({move:'Power-Up Punch',ability:'Sheer Force',targetAbility:'Static',rng:0});
  assert.equal(r.attacker.status,'PAR');assert.equal(r.attacker.stages.atk,0);
});

test('a multi-hit attack continues into the target after breaking Substitute',async()=>{
  const r=await hit({move:'Double Hit',targetVolatile:{sub:1},rng:0.5});
  assert.ok(r.damage>0);assert.equal(r.defender.volatile.sub,0);
});

test('Klutz suppresses speed items except canonical training weights',async()=>{
  const {attacker}=await hit({ability:'Klutz'});attacker.stats.spe=100;
  for(const item of ['Choice Scarf','Quick Powder','Iron Ball']) {
    attacker.name='Ditto';attacker.item=item;
    assert.equal(E.window.getEffectiveSpeed(attacker,null),100,item);
  }
  for(const item of ['Macho Brace','Power Anklet','Power Band','Power Belt','Power Bracer','Power Lens','Power Weight']) {
    attacker.item=item;assert.equal(E.window.getEffectiveSpeed(attacker,null),50,item);
  }
  attacker.item='Ability Shield';assert.equal(E.window.hasAbilityShield(attacker),true);
});

test('primary self stat changes apply exactly once, including through Substitute and Sheer Force',async()=>{
  for(const options of [{},{targetVolatile:{sub:1}},{ability:'Sheer Force'}]) {
    for(const [move,expected] of [['Headlong Rush',{def:-1,spd:-1}],['Clanging Scales',{def:-1}],['Scale Shot',{def:-1,spe:1}]]) {
      const r=await hit({move,rng:0.5,...options});
      for(const [stat,value] of Object.entries(expected))assert.equal(r.attacker.stages[stat],value,move+' '+stat);
    }
  }
});

test('chance-effect sweep flags have working effects under a forced successful roll',async()=>{
  const moves=['Bolt Strike','Muddy Water','Sandsear Storm','Shadow Ball','Poison Sting','Shadow Bone','Steam Eruption','Smog','Thunder','Iron Tail','Lava Plume','Scald','Mirror Shot','Tri Attack','Scorching Sands','Shell Side Arm','Bleakwind Storm','Diamond Storm','Dragon Breath','Dire Claw','Moonblast','Nature Power','Searing Shot','Secret Power','Wildbolt Storm','Crunch','Infernal Parade','Lick','Meteor Mash','Blue Flare','Discharge','Force Palm','Night Daze','Sludge','Gunk Shot','Liquidation','Seed Flare','Sludge Bomb','Body Slam','Spark','Matcha Gotcha','Mud Bomb','Poison Jab','Springtide Storm','Twineedle'];
  for(const move of moves) {
    const r=await hit({move,rng:0});
    assert.ok(r.defender.status || Object.values(r.defender.stages).some(v=>v!==0) || Object.values(r.attacker.stages).some(v=>v!==0),move);
  }
});

test('Dire Claw and Secret Power respect secondary protection and terrain',async()=>{
  for(const move of ['Dire Claw','Secret Power'])for(const protection of [{ability:'Sheer Force'},{targetAbility:'Shield Dust'},{targetItem:'Covert Cloak'},{targetVolatile:{sub:1}}]) {
    assert.equal((await hit({move,rng:0,...protection})).defender.status,null,move);
  }
  for(const [terrain,stat] of [['Misty','spa'],['Psychic','spe']]) {
    const r=await hit({move:'Secret Power',rng:0,field:{terrain,terrainTurns:5}});
    assert.equal(r.defender.stages[stat],-1);assert.equal(r.defender.status,null);
  }
  const grass=await hit({move:'Secret Power',rng:0,field:{terrain:'Grassy',terrainTurns:5}});
  assert.ok(E.logs.some(e=>e.text?.includes('fell asleep')));
  assert.equal(grass.defender.stages.spa,0);
});
