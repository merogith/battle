import { Battle } from '@pkmn/sim';

const FORM_BY_BUILD = {
  MEGA: 'mega',
  ZMOVE: 'zmove',
  DYNAMAX: 'dynamax',
  GMAXDYNAMAX: 'dynamax',
};
const FORM_BUDGETS = new Set(['shared', 'per-form', 'per-pokemon']);
const installedForms = Symbol('installedForms');

function allowed(pokemon, form) {
  if (!pokemon || pokemon.fainted || pokemon.classicFormsUsed?.[form]) return false;
  if (form === 'terastallize') {
    if (!pokemon.classicTeraType || pokemon.terastallized) return false;
  } else if (FORM_BY_BUILD[pokemon.classicForm] !== form) {
    return false;
  }
  const budget = pokemon.battle.classicFormBudget;
  const used = pokemon.side.classicFormsUsed;
  if (budget === 'per-pokemon' || !used) return true;
  return budget === 'shared' ? !Object.values(used).some(Boolean) : !used[form];
}

function useForm(pokemon, form) {
  (pokemon.classicFormsUsed ??= {})[form] = true;
  (pokemon.side.classicFormsUsed ??= {})[form] = true;
}

function replaceMethod(object, key, wrap) {
  const original = object[key];
  Object.defineProperty(object, key, {
    value: wrap(original),
    configurable: true,
  });
}

function canDynamax(pokemon) {
  if (!allowed(pokemon, 'dynamax') || pokemon.volatiles.dynamax) return false;
  const { species, illusion } = pokemon;
  return !species.isMega && !species.isPrimal && species.forme !== 'Ultra' &&
    !species.cannotDynamax && !illusion?.species.cannotDynamax;
}

function withFreshZFlag(side, operation) {
  // The native flag tracks when runMove actually enters its Z-powered branch.
  // Classic tracks consumed forms per Pokémon as well as per side.
  const previous = side.zMoveUsed;
  side.zMoveUsed = false;
  try {
    return operation();
  } finally {
    side.zMoveUsed = previous || side.zMoveUsed;
  }
}

function refreshForms(battle) {
  for (const side of battle.sides) {
    for (const pokemon of side.pokemon) {
      const tera = battle.dex.types.get(pokemon.species.forceTeraType || pokemon.classicTeraType);
      if (allowed(pokemon, 'terastallize') && tera.exists) {
        pokemon.teraType = tera.name;
        pokemon.canTerastallize = tera.name;
      } else {
        pokemon.canTerastallize = null;
      }
      const canMega = allowed(pokemon, 'mega');
      pokemon.canMegaEvo = canMega ? battle.actions.canMegaEvo(pokemon) : null;
      pokemon.canUltraBurst = canMega ? battle.actions.canUltraBurst(pokemon) : null;
      if (canMega && !pokemon.canMegaEvo && pokemon.baseSpecies.id === 'rayquaza' &&
          pokemon.baseMoves.includes('dragonascent') && !pokemon.getItem().zMove) {
        pokemon.canMegaEvo = 'Rayquaza-Mega';
      }
      if (!pokemon.volatiles.dynamax) pokemon.gigantamax = pokemon.classicForm === 'GMAXDYNAMAX';
    }
  }
}

function installForms(battle, budget) {
  if (battle[installedForms]) return battle;
  if (!FORM_BUDGETS.has(budget)) throw new Error(`Invalid Classic form budget: ${budget}`);
  if (battle.gen !== 9 || battle.gameType !== 'singles') {
    throw new Error('Classic form rules require the Gen 9 singles simulator.');
  }
  battle.classicFormBudget = budget;
  battle[installedForms] = true;

  for (const side of battle.sides) {
    replaceMethod(side, 'canDynamaxNow', () => function () {
      return canDynamax(this.active[0]);
    });
    for (const pokemon of side.pokemon) {
      replaceMethod(pokemon, 'getDynamaxRequest', original => function (skipChecks) {
        if (!skipChecks && !canDynamax(this)) return undefined;
        return original.call(this, true);
      });
    }
  }

  replaceMethod(battle, 'getRequests', original => function (requestState) {
    refreshForms(this);
    return original.call(this, requestState);
  });

  const actions = battle.actions;
  replaceMethod(actions, 'getZMove', original => function (move, pokemon, skipChecks) {
    if (!allowed(pokemon, 'zmove')) return undefined;
    return withFreshZFlag(pokemon.side, () => original.call(this, move, pokemon, skipChecks));
  });
  replaceMethod(actions, 'canZMove', original => function (pokemon) {
    if (!allowed(pokemon, 'zmove')) return undefined;
    return withFreshZFlag(pokemon.side, () => original.call(this, pokemon));
  });
  replaceMethod(actions, 'runMove', original => function (move, pokemon, targetLoc, options) {
    if (!options?.zMove) return original.call(this, move, pokemon, targetLoc, options);
    if (!allowed(pokemon, 'zmove')) return undefined;
    return withFreshZFlag(pokemon.side, () => {
      const result = original.call(this, move, pokemon, targetLoc, options);
      if (pokemon.side.zMoveUsed) useForm(pokemon, 'zmove');
      return result;
    });
  });

  replaceMethod(actions, 'runMegaEvo', original => function (pokemon) {
    if (!allowed(pokemon, 'mega')) return false;
    const species = pokemon.baseSpecies;
    const result = original.call(this, pokemon);
    if (pokemon.baseSpecies !== species) useForm(pokemon, 'mega');
    return result;
  });
  replaceMethod(actions, 'terastallize', original => function (pokemon) {
    if (!allowed(pokemon, 'terastallize')) return;
    original.call(this, pokemon);
    if (pokemon.terastallized) useForm(pokemon, 'terastallize');
  });
  replaceMethod(battle, 'runAction', original => function (action) {
    if (action.choice !== 'runDynamax') return original.call(this, action);
    if (!canDynamax(action.pokemon)) return false;
    const result = original.call(this, action);
    if (action.pokemon.volatiles.dynamax) useForm(action.pokemon, 'dynamax');
    return result;
  });
  refreshForms(battle);
  return battle;
}

export function createClassicBattle(options, { formBudget = 'per-form' } = {}) {
  return installForms(new Battle({ ...options, formatid: options.formatid || 'gen9customgame' }), formBudget);
}

export function restoreClassicBattle(snapshot) {
  const battle = Battle.fromJSON(snapshot);
  installForms(battle, battle.classicFormBudget);
  if (battle.requestState) {
    const requests = battle.getRequests(battle.requestState);
    for (const [index, side] of battle.sides.entries()) {
      if (side.activeRequest) side.activeRequest = requests[index];
    }
  }
  return battle;
}

export function classicFormsFor(battle, side, request = side.activeRequest, pokemon = side.active[0]) {
  const active = request?.active ? request.active[0] : request;
  if (!active || !pokemon || pokemon.side !== side || pokemon.battle !== battle) return [];
  const forms = [];
  if (active.canMegaEvo && allowed(pokemon, 'mega')) forms.push({ kind: 'mega' });
  if (active.canUltraBurst && allowed(pokemon, 'mega')) forms.push({ kind: 'ultra' });
  if (active.canZMove && allowed(pokemon, 'zmove')) forms.push({ kind: 'zmove', moves: active.canZMove });
  if (active.canDynamax && allowed(pokemon, 'dynamax')) forms.push({ kind: 'dynamax', moves: active.maxMoves?.maxMoves });
  if (active.canTerastallize && allowed(pokemon, 'terastallize')) {
    forms.push({ kind: 'terastallize', type: active.canTerastallize });
  }
  return forms;
}
