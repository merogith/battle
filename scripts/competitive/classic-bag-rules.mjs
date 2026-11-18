import { classicTerrainId, classicWeatherId } from './classic-scenario-rules.mjs';

const installedBagRules = new WeakSet();

export function attachClassicBagRules(battle) {
  if (installedBagRules.has(battle)) return;
  installedBagRules.add(battle);
  const findHandlers = battle.findBattleEventHandlers;
  battle.findBattleEventHandlers = function (name, key, pokemon) {
    const handlers = findHandlers.call(this, name, key, pokemon);
    if (name === 'onResidual' && pokemon?.classicBagRegen) {
      const handler = this.resolvePriority({
        effect: this.format, callback: tickRegen, state: this.formatData, end: null, effectHolder: pokemon,
      }, name);
      // Run after native major status damage. Scenario effects can retain
      // their own handler orders alongside the potion's independent timer.
      handler.order = 10;
      handlers.push(handler);
    }
    return handlers;
  };
  const format = Object.assign(Object.create(Object.getPrototypeOf(battle.format)), battle.format);
  const originalCrit = format.onModifyCritRatio;
  format.onModifyCritRatio = function (ratio, pokemon, ...args) {
    const updated = originalCrit?.call(this, ratio, pokemon, ...args) ?? ratio;
    return updated + Math.max(0, (pokemon.classicBagFocus || 0) - (pokemon.volatiles.focusenergy ? 2 : 0));
  };
  battle.format = format;
  for (const side of battle.sides) for (const pokemon of side.pokemon) {
    const clearVolatile = pokemon.clearVolatile;
    pokemon.clearVolatile = function (...args) {
      delete this.classicBagRegen;
      delete this.classicBagFocus;
      return clearVolatile.apply(this, args);
    };
  }
}

function tickRegen(pokemon) {
  const regen = pokemon.classicBagRegen;
  if (!regen || pokemon.hp <= 0) return;
  const healed = pokemon.heal(Math.max(1, Math.floor(pokemon.maxhp * regen.pct)));
  if (healed) this.add('-heal', pokemon, pokemon.getHealth, '[from] item: Potion');
  regen.turns--;
  if (regen.turns <= 0) delete pokemon.classicBagRegen;
}

export function applyBagVolatiles(pokemon, volatile = {}) {
  const regen = volatile.bagRegen;
  if (regen?.pct > 0 && regen.turns > 0) {
    pokemon.classicBagRegen = { pct: Math.min(1, regen.pct), turns: Math.min(32, Math.trunc(regen.turns)) };
  }
  if (typeof volatile.focusEnergy === 'number' && volatile.focusEnergy > 0) {
    pokemon.classicBagFocus = Math.min(6, Math.trunc(volatile.focusEnergy));
  }
  if (volatile.choiceLock === null) pokemon.removeVolatile('choicelock');
}

export function canUseBagTeleporter(battle, side) {
  const outgoing = side.active[0];
  return installedBagRules.has(battle) && side.id === 'p1' && side.requestState === 'move'
    && !side.isChoiceDone() && !side.classicBagTeleporterUsed
    && !!outgoing?.trapped && !outgoing.getLockedMove()
    && side.pokemon.some(pokemon => pokemon.hp > 0 && !pokemon.isActive);
}

export function chooseBagTeleporterSwitch(battle, side, slot) {
  if (!canUseBagTeleporter(battle, side)) return false;
  const outgoing = side.active[0];
  const targetIndex = side.pokemon.findIndex(pokemon => pokemon.classicSlot === slot && pokemon.hp > 0 && !pokemon.isActive);
  if (targetIndex < 0) return false;

  // Only waive trapping for validation of this switch. Native switch-in effects
  // and new trapping conditions still apply to the incoming Pokémon.
  const trapped = outgoing.trapped;
  outgoing.trapped = false;
  try {
    if (!battle.choose(side.id, `switch ${targetIndex + 1}`)) return false;
    side.classicBagTeleporterUsed = true;
    return true;
  } finally {
    if (outgoing.isActive && !outgoing.fainted) outgoing.trapped = trapped;
  }
}

export function applyBagField(battle, side, snapshot) {
  if (!snapshot) return;
  const field = battle.field;
  const source = side.active[0];
  const weather = classicWeatherId(snapshot.weather);
  if ('weather' in snapshot && (!snapshot.weather || weather)) {
    if (!weather) {
      if (field.weather) field.clearWeather();
    } else {
      if (field.weather !== weather && !field.setWeather(weather, source, battle.format)) {
        field.clearWeather();
        field.setWeather(weather, source, battle.format);
      }
      if (field.weather === weather && snapshot.weatherTurns > 0) field.weatherState.duration = snapshot.weatherTurns;
    }
  }
  const terrain = classicTerrainId(snapshot.terrain);
  if ('terrain' in snapshot) {
    if (!terrain) {
      if (field.terrain) field.clearTerrain();
    } else if (battle.dex.conditions.get(terrain).exists) {
      if (field.terrain !== terrain) field.setTerrain(terrain, source, battle.format);
      if (field.terrain === terrain && snapshot.terrainTurns > 0) field.terrainState.duration = snapshot.terrainTurns;
    }
  }
  const turns = snapshot.mist?.[side.n];
  if (Number.isFinite(turns) && turns > 0) {
    if (!side.sideConditions.mist) side.addSideCondition('mist', source, battle.format);
    if (side.sideConditions.mist) side.sideConditions.mist.duration = turns;
  }
}
