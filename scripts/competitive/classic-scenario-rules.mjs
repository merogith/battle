import { applyClassicBossDamage } from './classic-boss-rules.mjs';

const activeScenarios = new WeakSet();

const WEATHER = {
  rain: 'raindance', raindance: 'raindance',
  sun: 'sunnyday', sunnyday: 'sunnyday',
  sand: 'sandstorm', sandstorm: 'sandstorm',
  snow: 'snowscape', snowscape: 'snowscape', hail: 'hail',
  heavyrain: 'primordialsea', primordialsea: 'primordialsea',
  harshsun: 'desolateland', desolateland: 'desolateland',
  strongwinds: 'deltastream', deltastream: 'deltastream',
};
const TERRAINS = new Set(['electricterrain', 'grassyterrain', 'psychicterrain', 'mistyterrain']);
const WEATHER_CYCLE = ['sunnyday', 'raindance', 'sandstorm', 'hail', ''];
const TERRAIN_CYCLE = ['grassyterrain', 'electricterrain', 'psychicterrain', 'mistyterrain', ''];
const ROOMS = ['trickroom', 'gravity', 'magicroom', 'wonderroom'];
const FLAT_DAMAGE = new Set(['seismictoss', 'nightshade', 'dragonrage', 'sonicboom', 'psywave']);
const PASSIVE_DAMAGE = new Set([
  'stealthrock', 'spikes', 'sandstorm', 'hail', 'blacksludge', 'leechseed',
  'brn', 'psn', 'tox', 'curse', 'nightmare', 'partiallytrapped', 'baddreams',
]);
const REFLECT_DAMAGE = new Set(['counter', 'mirrorcoat', 'metalburst', 'comeuppance']);

function affectsType(pokemon, type) {
  return type && pokemon?.hasType(type);
}

export function classicWeatherId(value) {
  const id = typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return WEATHER[id] || '';
}

export function classicTerrainId(value) {
  const id = typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const terrainId = id.endsWith('terrain') ? id : `${id}terrain`;
  return TERRAINS.has(terrainId) ? terrainId : '';
}

function installInitialField(format, scenario) {
  const onBattleStart = format.onBattleStart;
  format.onBattleStart = function () {
    onBattleStart?.call(this);
    const { weather, terrain, rooms } = scenario;
    const source = this.sides[0].pokemon[0];
    const weatherId = classicWeatherId(weather?.id);
    if (weatherId && this.field.setWeather(weatherId, source, format)) {
      this.field.weatherState.duration = weather.locked ? 0 : weather.turns;
    }
    const terrainId = classicTerrainId(terrain?.id);
    if (terrainId && this.field.setTerrain(terrainId, source, format)) {
      this.field.terrainState.duration = terrain.locked ? 0 : terrain.turns;
    }
    for (const room of ROOMS) {
      const turns = rooms?.[room];
      if (turns > 0 && this.field.addPseudoWeather(room, source, format)) {
        this.field.pseudoWeather[room].duration = turns;
      }
    }
  };
}

function installFieldCycles(battle, format, scenario) {
  const nativeFieldEvent = battle.fieldEvent;
  battle.fieldEvent = function (event, targets) {
    if (event !== 'Residual') return nativeFieldEvent.call(this, event, targets);
    const randomWeather = scenario.randomWeather && !scenario.weather?.locked && !this.classicBoss?.weatherLocked;
    const randomTerrain = scenario.randomTerrain && !scenario.terrain?.locked && !this.classicBoss?.terrainLocked;

    // A rotating field effect still applies during its last upkeep. Give that
    // effect the native residual pass, then roll the next field exactly once.
    const field = this.field;
    const expiringWeather = randomWeather && field.weatherState.duration === 1 ? field.weatherState : null;
    const expiringTerrain = randomTerrain && field.terrainState.duration === 1 ? field.terrainState : null;
    if (expiringWeather) expiringWeather.duration++;
    if (expiringTerrain) expiringTerrain.duration++;
    const result = nativeFieldEvent.call(this, event, targets);
    if (this.ended) return result;

    const source = this.sides.map(side => side.active[0]).find(pokemon => pokemon?.hp > 0)
      ?? this.getAllPokemon().find(pokemon => pokemon.hp > 0);
    if (!source) return result;
    if (randomWeather && (!field.weather || expiringWeather === field.weatherState)) {
      const next = this.sample(WEATHER_CYCLE.filter(id => !field.weather || id !== field.weather));
      if (field.weather) field.clearWeather();
      if (next && field.setWeather(next, source, format)) field.weatherState.duration = 5;
    }
    if (randomTerrain && (!field.terrain || expiringTerrain === field.terrainState)) {
      const next = this.sample(TERRAIN_CYCLE.filter(id => !field.terrain || id !== field.terrain));
      if (field.terrain) field.clearTerrain();
      if (next && field.setTerrain(next, source, format)) field.terrainState.duration = 5;
    }
    return result;
  };
}

function installPacingRules(format, scenario) {
  const capFor = pokemon => scenario.caps?.[pokemon.side.id]?.[pokemon.classicSlot] || Infinity;
  if (scenario.caps) {
    // Take the engine's resolved power, including variable-power moves, before
    // ordinary ability, held-item, and field multipliers are applied.
    format.onBasePowerPriority = 100;
    format.onBasePower = (power, source) => Math.min(power, capFor(source));
  }
  format.onModifyMove = (move, source) => {
    if (move.id === 'frustration' && scenario.fixedFrustration) {
      move.basePowerCallback = () => 102;
    }
    if (!FLAT_DAMAGE.has(move.id)) return;
    const cap = capFor(source);
    if (!Number.isFinite(cap)) return;
    if (move.damageCallback) {
      const nativeDamage = move.damageCallback;
      move.damageCallback = function (attacker, target) {
        const damage = nativeDamage.call(this, attacker, target);
        return typeof damage === 'number' ? Math.min(damage, cap) : damage;
      };
    } else if (move.damage === 'level') {
      move.damage = Math.min(source.level, cap);
    } else if (typeof move.damage === 'number') {
      move.damage = Math.min(move.damage, cap);
    }
  };
}

function installDamageRules(battle, scenario, bossRules) {
  const { glassCannon, typeAmplifier, banter } = scenario;
  if (!glassCannon && !typeAmplifier && !bossRules && !(banter > 0 && banter !== 1)) return;
  // Campaign multipliers apply per damaging hit after native damage modifiers.
  // Native fixed-damage moves bypass modifyDamage and keep their own rules.
  const nativeDamage = battle.actions.modifyDamage;
  battle.actions.modifyDamage = function (baseDamage, source, target, move, suppressMessages) {
    let damage = nativeDamage.call(this, baseDamage, source, target, move, suppressMessages);
    if (glassCannon) damage = Math.floor(damage * 1.25);
    if (bossRules) damage = applyClassicBossDamage(battle, damage, source, target, move);
    if (typeAmplifier && move.type === typeAmplifier) damage = Math.floor(damage * 1.3);
    if (typeAmplifier && target.hasType(typeAmplifier)) damage = Math.floor(damage * 1.15);
    if (source.side.id === 'p1' && banter > 0 && banter !== 1) damage = Math.floor(damage * banter);
    return Math.max(1, damage);
  };
}

function installAccuracyRules(format, scenario) {
  const { chaosAmulet, typeMagnetizer } = scenario;
  if (chaosAmulet) {
    format.onModifyCritRatio = ratio => ratio + 2;
  }
  format.onAccuracyPriority = -100;
  format.onAccuracy = (accuracy, target, source, move) => {
    if (move.category !== 'Status' && (affectsType(source, typeMagnetizer) || affectsType(target, typeMagnetizer))) {
      return true;
    }
    if (chaosAmulet && typeof accuracy === 'number') return Math.floor(accuracy * 0.9);
  };
}

function installStatRules(format, scenario) {
  const { typeNullifier, stagnationCore, evioliteBlessing, berserkerSerum } = scenario;
  if (typeNullifier || stagnationCore) {
    format.onTryBoost = function (boosts, target, source, effect) {
      // Berserker's Serum uses the format effect to identify its own boosts.
      if (effect === format) return;
      const nullifier = affectsType(target, typeNullifier);
      const opponent = source && source.side !== target.side;
      for (const [stat, change] of Object.entries(boosts)) {
        if ((change > 0 && (stagnationCore || nullifier)) || (change < 0 && stagnationCore && opponent)) {
          delete boosts[stat];
        }
      }
    };
  }
  if (evioliteBlessing) {
    format.onModifyDefPriority = 2;
    format.onModifySpDPriority = 2;
    format.onModifyDef = format.onModifySpD = function (_stat, pokemon) {
      if (pokemon.baseSpecies.nfe && !pokemon.hasItem('eviolite')) return this.chainModify(1.5);
    };
  }
  if (berserkerSerum) {
    format.onSwitchInPriority = -100;
    format.onSwitchIn = function (pokemon) {
      if (pokemon.hp > 0) this.boost({ atk: 1, spa: 1, def: -1, spd: -1 }, pokemon, pokemon, format);
    };
  }
}

function installIndirectDamageRules(format, scenario) {
  const { typeNullifier, heavyGravityHazardMult } = scenario;
  format.onDamagePriority = 20;
  format.onDamage = function (_damage, target, _source, effect) {
    if (effect.effectType !== 'Move' && PASSIVE_DAMAGE.has(effect.id) && affectsType(target, typeNullifier)) {
      this.add('-immune', target, '[from] Memory Disc');
      return false;
    }
    if (!(heavyGravityHazardMult > 1 && this.field.getPseudoWeather('gravity'))) return;
    if (effect.id === 'spikes' && effect.effectType !== 'Move') {
      const layers = target.side.sideConditions.spikes?.layers ?? 1;
      const fraction = [0, 1 / 8, 1 / 6, 1 / 4][layers];
      return Math.max(1, Math.floor(target.maxhp * fraction * heavyGravityHazardMult));
    }
    if (effect.id === 'stealthrock' || effect.id === 'gmaxsteelsurge') {
      const matchup = 2 ** target.runEffectiveness(this.dex.getActiveMove(effect.id));
      return Math.max(1, Math.floor(target.maxhp * matchup * heavyGravityHazardMult / 8));
    }
  };
}

function installRallyRules(format) {
  format.onFaint = function () {
    // The campaign's simultaneous-KO branch skips this effect.
    if (this.sides.every(side => !side.active[0]?.hp)) return;
    for (const side of this.sides) {
      const survivors = side.pokemon.filter(pokemon => pokemon.hp > 0 && !pokemon.fainted);
      if (!survivors.length) continue;
      for (const pokemon of survivors) {
        const heal = Math.min(pokemon.maxhp - pokemon.hp, Math.floor(pokemon.maxhp / 10));
        if (heal > 0) {
          pokemon.hp += heal;
          if (pokemon.isActive) this.add('-heal', pokemon, pokemon.getHealth, '[from] Reaper’s Toll');
        }
      }
      const cursed = this.sample(survivors);
      const before = cursed.boosts.spd;
      cursed.boosts.spd = Math.max(-6, before - 1);
      if (cursed.isActive && before !== cursed.boosts.spd) this.add('-unboost', cursed, 'spd', 1, '[from] Reaper’s Toll');
    }
  };
}

function installFangRules(battle, format) {
  // Substitute absorbs damage before the main HP path. Keep its loss with
  // Showdown's per-move total so multi-hit attacks heal once.
  const nativeHit = battle.actions.spreadMoveHit;
  battle.actions.spreadMoveHit = function (targets, source, move, ...rest) {
    const substitutes = targets.filter(Boolean).map(target => [target, target.volatiles.substitute?.hp ?? 0]);
    const result = nativeHit.call(this, targets, source, move, ...rest);
    for (const [target, before] of substitutes) {
      const lost = before - (target.volatiles.substitute?.hp ?? 0);
      if (lost > 0) move.classicFangSubDamage = (move.classicFangSubDamage || 0) + lost;
    }
    return result;
  };
  format.onAfterMoveSecondarySelfPriority = 100;
  function healFromMove(source, move) {
    if (!source.hp || !move || move.classicFangHealed || move.category === 'Status' ||
        FLAT_DAMAGE.has(move.id) || REFLECT_DAMAGE.has(move.id)) return;
    const landed = (move.totalDamage || 0) + (move.classicFangSubDamage || 0);
    if (!landed) return;
    move.classicFangHealed = true;
    const healed = Math.min(source.maxhp - source.hp, Math.max(1, Math.floor(landed / 10)));
    if (healed > 0) {
      source.hp += healed;
      this.add('-heal', source, source.getHealth, '[from] Crobat Fang Charm');
    }
  }
  format.onAfterMoveSecondarySelf = function (source, _target, move) {
    healFromMove.call(this, source, move);
  };
  const onDamage = format.onDamage;
  format.onDamage = function (damage, target, source, effect) {
    if (effect.id === 'recoil' && target === this.activePokemon) {
      healFromMove.call(this, target, this.activeMove);
    }
    return onDamage?.call(this, damage, target, source, effect);
  };
  format.onResidualOrder = 21;
  format.onResidual = function (pokemon) {
    if (pokemon.hp && !pokemon.hasAbility('magicguard')) {
      this.damage(Math.max(1, Math.floor(pokemon.maxhp / 16)), pokemon, pokemon, {
        id: 'crobatfangcharm', name: 'Crobat Fang Charm', fullname: 'Crobat Fang Charm', effectType: 'Condition',
      });
    }
  };
}

/**
 * Add a battle-local copy of the game's campaign rules to the pinned simulator.
 * Attach before team preview choices. A restored battle already has its field.
 */
export function attachClassicScenarioRules(battle, rules) {
  const scenario = rules?.scenario ?? (rules?.boss ? {} : null);
  if (!scenario || activeScenarios.has(battle)) return;
  activeScenarios.add(battle);

  const format = Object.assign(Object.create(Object.getPrototypeOf(battle.format)), battle.format);
  if (scenario.weather || scenario.terrain || scenario.rooms) installInitialField(format, scenario);
  if (scenario.randomWeather || scenario.randomTerrain) installFieldCycles(battle, format, scenario);
  if (scenario.caps || scenario.fixedFrustration) installPacingRules(format, scenario);
  installDamageRules(battle, scenario, rules.boss);
  if (scenario.chaosAmulet || scenario.typeMagnetizer) installAccuracyRules(format, scenario);
  installStatRules(format, scenario);
  if (scenario.typeNullifier || scenario.heavyGravityHazardMult > 1) installIndirectDamageRules(format, scenario);
  if (scenario.reapersToll) installRallyRules(format);
  if (scenario.vampiricFangs) installFangRules(battle, format);
  battle.format = format;
}
