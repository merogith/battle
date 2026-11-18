import { Dex, Pokemon, extractChannelMessages, toID } from '@pkmn/sim';
import { createClassicBattle, restoreClassicBattle, classicFormsFor } from './classic-format.mjs';
import { attachClassicScenarioRules } from './classic-scenario-rules.mjs';
import { describeBattleLog } from './classic-events.mjs';
import { applyBagField, applyBagVolatiles, attachClassicBagRules, canUseBagTeleporter, chooseBagTeleporterSwitch } from './classic-bag-rules.mjs';
import { attachClassicBossRules, classicBossView } from './classic-boss-rules.mjs';
import { noteStoryBossChoice, plannedStoryBossMove, validateStoryBossProfile as validateAuthoredBossProfile } from './classic-story-boss.mjs';

export function validateStoryBossProfile(profile) {
  validateAuthoredBossProfile(profile, Dex);
}

const ENGINE_VERSION = '0.10.9';
const SNAPSHOT_VERSION = 1;
const SIDE_IDS = ['p1', 'p2'];
const STATS = ['atk', 'def', 'spa', 'spd', 'spe'];
const BOOST_NAMES = { atk: 'atk', def: 'def', spa: 'spa', spd: 'spd', spe: 'spe', accuracy: 'acc', evasion: 'eva' };
const FORCED_MOVES = new Set(['struggle', 'recharge', 'fight']);
const STATUS_IDS = new Set(['brn', 'frz', 'par', 'psn', 'slp', 'tox']);
const FORM_OPTION = { MEGA: 'mega', ZMOVE: 'zmove', DYNAMAX: 'dynamax', GMAXDYNAMAX: 'dynamax' };

export class ClassicChoiceError extends Error {}

function boundedInteger(value, fallback, minimum, maximum) {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.trunc(value))) : fallback;
}

function teamSet(mon) {
  const build = mon.buildData || {};
  const species = Dex.species.get(mon._baseName || mon.name);
  if (!species.exists) throw new Error(`The simulator does not recognize ${mon.name}.`);
  const moves = mon.moves.map(move => move.name);
  if (!moves.length || moves.length > 4) throw new Error(`${mon.name} needs one to four moves.`);
  for (const move of moves) {
    if (!Dex.moves.get(move).exists) throw new Error(`The simulator does not recognize ${move}.`);
  }
  // Older saves and generated Story opponents both use textual empty items.
  const item = !mon.item || ['none', 'noitem'].includes(toID(mon.item)) ? '' : mon.item;
  if (item && !Dex.items.get(item).exists) throw new Error(`The simulator does not recognize ${item}.`);
  const ability = !mon.ability || mon.ability === 'None' ? '' : mon.ability;
  if (ability && !Dex.abilities.get(ability).exists) throw new Error(`The simulator does not recognize ${ability}.`);
  const level = boundedInteger(mon.level, 50 + boundedInteger(build.expShareLevels, 0, 0, 3), 1, 100);
  return {
    species: species.name, name: species.name, item, ability, moves, level,
    gender: mon.gender || 'N', shiny: Boolean(mon.isShiny), nature: mon.nature || build.n || 'Hardy',
    evs: build.evs || {}, ivs: build.ivs || {},
    happiness: moves.some(move => toID(move) === 'frustration') ? 0 : 255,
    teraType: build.teraType || undefined,
    gigantamax: build.gimmick === 'GMAXDYNAMAX',
  };
}

function applyStatusSnapshot(pokemon, mon) {
  const requested = toID(mon.status);
  const status = STATUS_IDS.has(requested) ? requested : '';
  if (pokemon.status === status) return;
  pokemon.status = status;
  const statusState = pokemon.battle.initEffectState(status ? { id: status, target: pokemon } : {});
  if (status === 'tox') statusState.stage = boundedInteger(mon.statusTurns, 0, 0, 15);
  if (status === 'slp') {
    statusState.startTime = 1 + boundedInteger(mon.sleepDuration, 2, 1, 7);
    statusState.time = Math.max(1, statusState.startTime - boundedInteger(mon.statusTurns, 0, 0, 7));
  }
  pokemon.statusState = statusState;
}

function applyMovePp(pokemon, moves) {
  for (const [index, move] of moves.entries()) {
    const slot = pokemon.moveSlots[index];
    if (slot?.id !== toID(Dex.moves.get(move.name).id)) continue;
    slot.maxpp = boundedInteger(move.maxPp, slot.maxpp, 1, 999);
    slot.pp = boundedInteger(move.pp, slot.pp, 0, slot.maxpp);
  }
}

function applyBattleStats(pokemon, source, projectFormStats) {
  pokemon.classicSpecies = pokemon.species.id;
  pokemon.classicStats = {};
  pokemon.classicStatScale = {};
  for (const key of STATS) {
    const actual = boundedInteger(source.stats?.[key], pokemon.storedStats[key], 1, 65535);
    pokemon.classicStats[key] = actual;
    pokemon.classicStatScale[key] = actual / pokemon.storedStats[key];
    pokemon.storedStats[key] = actual;
    pokemon.baseStoredStats[key] = actual;
  }
  const types = [source.type1, source.type2].filter(type => type && Dex.types.get(type).exists);
  if (types.length && types.join('/') !== pokemon.getTypes().join('/')) {
    pokemon.classicStartingTypes = types;
    pokemon.setType(types, true);
  }
  pokemon.speed = pokemon.storedStats.spe;
  pokemon.maxhp = boundedInteger(source.maxHp, pokemon.maxhp, 1, 65535);
  pokemon.baseMaxhp = pokemon.maxhp;
  if (projectFormStats && source.buildData) {
    const dex = pokemon.battle.dex;
    const baseSpecies = dex.species.get(pokemon.species.baseSpecies);
    // Cache detached numbers so resuming the battle does not need to rebuild its team.
    pokemon.classicFormStats = { [pokemon.classicSpecies]: { maxHp: pokemon.maxhp } };
    for (const name of [baseSpecies.name, ...(baseSpecies.otherFormes || [])]) {
      const form = dex.species.get(name);
      if (form.exists && form.id !== pokemon.classicSpecies) {
        const { stats, maxHp } = projectFormStats(source, form.name, form.baseStats);
        pokemon.classicFormStats[form.id] = { stats: { ...stats }, maxHp };
      }
    }
  }
  pokemon.hp = boundedInteger(source.currentHp, pokemon.maxhp, 0, pokemon.maxhp);
  if (pokemon.hp === 0) {
    pokemon.fainted = true;
    pokemon.status = 'fnt';
    pokemon.side.pokemonLeft--;
  } else {
    applyStatusSnapshot(pokemon, source);
  }
  for (const [native, classic] of Object.entries(BOOST_NAMES)) {
    pokemon.boosts[native] = boundedInteger(source.stages?.[classic], pokemon.boosts[native], -6, 6);
  }
  applyMovePp(pokemon, source.moves);
  attachStatProjection(pokemon);
}

function attachStatProjection(pokemon) {
  pokemon.setSpecies = function (rawSpecies, source, isTransform) {
    const species = Pokemon.prototype.setSpecies.call(this, rawSpecies, source, isTransform);
    if (!species || isTransform) return species;
    const originalSpecies = species.id === this.classicSpecies;
    const projected = originalSpecies ? this.classicStats : this.classicFormStats?.[species.id]?.stats;
    for (const key of STATS) {
      const value = projected ? boundedInteger(projected[key], this.storedStats[key], 1, 65535)
        : Math.max(1, Math.floor(this.storedStats[key] * this.classicStatScale[key]));
      this.storedStats[key] = value;
      this.baseStoredStats[key] = value;
      if (this.modifiedStats) this.modifiedStats[key] = value;
    }
    if (originalSpecies && this.classicStartingTypes) this.setType(this.classicStartingTypes, true);
    this.speed = this.storedStats.spe;
    return species;
  };
  pokemon.updateMaxHp = function () {
    const projected = this.classicFormStats?.[this.species.id];
    if (!projected) return Pokemon.prototype.updateMaxHp.call(this);

    // Use the campaign's maximum with Showdown's HP deficit and Dynamax semantics.
    const newBaseMaxHp = boundedInteger(projected.maxHp, this.baseMaxhp, 1, 65535);
    if (newBaseMaxHp === this.baseMaxhp) return;
    const newMaxHp = this.volatiles.dynamax ? newBaseMaxHp * 2 : newBaseMaxHp;
    this.hp = this.hp <= 0 ? 0 : Math.max(1, newMaxHp - (this.maxhp - this.hp));
    this.baseMaxhp = newBaseMaxHp;
    this.maxhp = newMaxHp;
    if (this.hp) this.battle.add('-heal', this, this.getHealth, '[silent]');
  };
}

function moveDisplayName(id, name, hiddenPowerType) {
  return id === 'hiddenpower' ? `Hidden Power ${hiddenPowerType}` : name;
}

function requestView(battle, side) {
  const request = side.activeRequest;
  const empty = { phase: 'wait', moves: [], switches: [], forms: [], formDetails: [], trapped: false };
  if (battle.ended) return { ...empty, phase: 'ended' };
  if (!request || request.wait || side.isChoiceDone()) return empty;
  const active = request.active?.[0];
  const pokemon = side.active[0];
  const phase = request.forceSwitch?.some(Boolean) ? 'replace' : 'move';
  const moves = (active?.moves || []).map((entry, slot) => {
    const name = moveDisplayName(entry.id, entry.move, pokemon.hpType);
    const info = battle.dex.moves.get(entry.id === 'hiddenpower' ? name : entry.id);
    let partyMoveSlot = pokemon.moveSlots[slot]?.id === entry.id ? slot : pokemon.moveSlots.findIndex(move => move.id === entry.id);
    if (partyMoveSlot < 0) partyMoveSlot = null;
    const owned = partyMoveSlot === null ? null : pokemon.moveSlots[partyMoveSlot];
    const forced = FORCED_MOVES.has(entry.id) || entry.pp === undefined;
    const max = active.maxMoves?.maxMoves?.[slot];
    const zMove = active.canZMove?.[slot]?.move || null;
    const maxMove = max?.move ? battle.dex.moves.get(max.move).name : null;
    return {
      slot, partyMoveSlot, id: entry.id, name, pp: entry.pp ?? owned?.pp ?? null,
      maxPp: entry.maxpp ?? owned?.maxpp ?? null, forced,
      type: info.type, category: info.category, power: info.basePower, accuracy: info.accuracy,
      priority: info.priority, target: entry.target || info.target,
      disabled: pokemon.volatiles.dynamax && max ? Boolean(max.disabled) : Boolean(entry.disabled),
      zMove, maxMove, maxDisabled: Boolean(max?.disabled),
    };
  });
  const switches = active?.trapped ? [] : side.pokemon
    .filter(mon => mon.hp > 0 && !side.active.includes(mon))
    .map(mon => mon.classicSlot)
    .sort((first, second) => first - second);
  const formDetails = active ? classicFormsFor(battle, side, active, pokemon) : [];
  return {
    ...empty, phase, moves, switches, forms: formDetails.map(form => form.kind), formDetails,
    trapped: active?.trapped === true,
    bagTeleporter: canUseBagTeleporter(battle, side),
    bagTeleporterUsed: side.classicBagTeleporterUsed === true,
  };
}

function monView(pokemon) {
  const { battle, statusState, volatiles } = pokemon;
  const healthStatus = STATUS_IDS.has(pokemon.status) ? pokemon.status.toUpperCase() : null;
  const stages = Object.fromEntries(Object.entries(BOOST_NAMES).map(([native, classic]) => [classic, pokemon.boosts[native]]));
  const ability = battle.dex.abilities.get(pokemon.ability);
  const item = battle.dex.items.get(pokemon.item);
  const substitute = volatiles.substitute;
  const dynamax = volatiles.dynamax;
  const transformed = pokemon.transformed;
  const appearance = pokemon.illusion || pokemon;
  return {
    slot: pokemon.classicSlot, name: pokemon.species.name, species: pokemon.species.id, displayName: appearance.species.name,
    sprite: appearance.species.spriteid, disguise: pokemon.illusion ? appearance.species.name : null,
    types: pokemon.getTypes(), baseTypes: pokemon.species.types, ability: ability.exists ? ability.name : null,
    item: item.exists ? item.name : null, stats: { ...pokemon.storedStats }, stages,
    hp: pokemon.hp, maxHp: pokemon.maxhp, baseMaxHp: pokemon.baseMaxhp, status: healthStatus,
    statusTurns: healthStatus === 'TOX' ? statusState.stage || 0
      : healthStatus === 'SLP' ? statusState.startTime - statusState.time : 0,
    sleepDuration: healthStatus === 'SLP' ? statusState.startTime - 1 : 0,
    active: pokemon.isActive, fainted: pokemon.fainted, transformed, megaEvolved: Boolean(pokemon.species.isMega),
    turnCount: pokemon.activeTurns, fakeOutOk: pokemon.activeMoveActions === 0,
    itemConsumed: Boolean(volatiles.unburden || (pokemon.lastItem && !pokemon.item)),
    dynamaxed: Boolean(dynamax), dynamaxTurns: dynamax ? Math.max(0, 3 - dynamax.turns) : 0,
    teraActivated: Boolean(pokemon.terastallized), teraType: pokemon.terastallized || pokemon.teraType || null,
    formUsage: { ...(pokemon.classicFormsUsed || {}) },
    moves: pokemon.moveSlots.map(move => ({
      id: move.id, name: moveDisplayName(move.id, move.move, pokemon.hpType),
      pp: move.pp, maxPp: move.maxpp, disabled: Boolean(move.disabled),
    })),
    baseMoves: pokemon.baseMoveSlots.map(move => ({
      id: move.id, name: moveDisplayName(move.id, move.move, pokemon.baseHpType), pp: move.pp, maxPp: move.maxpp,
    })),
    volatile: {
      sub: substitute?.hp || 0,
      leechSeed: Boolean(volatiles.leechseed), focusEnergy: pokemon.classicBagFocus || Boolean(volatiles.focusenergy),
      bagRegen: pokemon.classicBagRegen ? { ...pokemon.classicBagRegen } : null,
      confusion: volatiles.confusion?.time || 0, perishCount: (volatiles.perishsong?.duration || 0) - 1,
      aquaRing: Boolean(volatiles.aquaring), ingrain: Boolean(volatiles.ingrain),
      taunt: volatiles.taunt?.duration || 0, yawnTurns: volatiles.yawn?.duration || 0,
      magnetRise: volatiles.magnetrise?.duration || 0, encore: volatiles.encore?.duration || 0,
      disabled: volatiles.disable ? battle.dex.moves.get(volatiles.disable.move).name : null,
      disabledTurns: volatiles.disable?.duration || 0,
      encoreMove: volatiles.encore ? battle.dex.moves.get(volatiles.encore.move).name : null,
      choiceLock: volatiles.choicelock ? battle.dex.moves.get(volatiles.choicelock.move).name : null,
      charging: volatiles.twoturnmove ? battle.dex.moves.get(volatiles.twoturnmove.move).name : null,
      recharge: Boolean(volatiles.mustrecharge), torment: Boolean(volatiles.torment),
      healBlock: volatiles.healblock?.duration || 0, throatChop: volatiles.throatchop?.duration || 0,
      abilityGastroAcid: Boolean(volatiles.gastroacid), embargo: volatiles.embargo?.duration || 0,
      protect: Boolean(volatiles.protect), partialTrap: volatiles.partiallytrapped?.duration || 0,
      trapped: pokemon.trapped === true, lastMoveUsed: pokemon.lastMove?.name || null,
    },
  };
}

function fieldView(battle) {
  const field = battle.field;
  return {
    weather: field.weather || null, weatherTurns: field.weatherState.duration ?? 0,
    terrain: field.terrain || null, terrainTurns: field.terrainState.duration ?? 0,
    trickRoom: field.pseudoWeather.trickroom?.duration || 0, magicRoom: field.pseudoWeather.magicroom?.duration || 0,
    wonderRoom: field.pseudoWeather.wonderroom?.duration || 0, gravity: field.pseudoWeather.gravity?.duration || 0,
  };
}

function sideView(side) {
  const conditions = side.sideConditions;
  return {
    stealthRock: Boolean(conditions.stealthrock), stickyWeb: Boolean(conditions.stickyweb),
    spikes: conditions.spikes?.layers || 0, toxicSpikes: conditions.toxicspikes?.layers || 0,
    reflect: conditions.reflect?.duration || 0, lightScreen: conditions.lightscreen?.duration || 0,
    auroraVeil: conditions.auroraveil?.duration || 0, tailwind: conditions.tailwind?.duration || 0,
    safeguard: conditions.safeguard?.duration || 0, mist: conditions.mist?.duration || 0,
    formUsage: { ...(side.classicFormsUsed || {}) },
  };
}

function honorCarriedFaints(battle) {
  if (battle.sides.every(side => side.pokemon.every(pokemon => !pokemon.fainted))) return;
  // Native setup normally starts with all party members healthy. Trainer modes
  // may carry bench KOs into a new fight, so count only healthy members at entry.
  const format = Object.assign(Object.create(Object.getPrototypeOf(battle.format)), battle.format);
  const onBattleStart = format.onBattleStart;
  format.onBattleStart = function () {
    for (const side of this.sides) side.pokemonLeft = side.pokemon.filter(pokemon => !pokemon.fainted).length;
    onBattleStart?.call(this);
  };
  battle.format = format;
}

export class ClassicSimulation {
  constructor({ playerParty, foeParty, seed, leadSlots = [0, 0], rules = {}, projectFormStats }) {
    const parties = [playerParty, foeParty];
    if (parties.some(party => !Array.isArray(party) || party.length < 1 || party.length > 24)) {
      throw new Error('A battle needs one to 24 Pokémon on each party.');
    }
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid battle seed.');
    this.seed = seed;
    this.rules = structuredClone(rules);
    this.logCursor = 0;
    this.events = [];
    this.eventSequence = 0;
    this.appearances = new Map();
    this.requestId = 0;
    this.battle = createClassicBattle({
      seed: `gen5,${seed.toString(16).padStart(8, '0')}50424131`,
      p1: { name: 'Player 1', team: playerParty.map(teamSet) },
      p2: { name: 'Player 2', team: foeParty.map(teamSet) },
    }, this.rules);
    if (this.battle.requestState !== 'teampreview') throw new Error('The battle rules must allow roster setup before the initial switch.');
    for (const [index, side] of this.battle.sides.entries()) {
      for (const [slot, pokemon] of side.pokemon.entries()) {
        const source = parties[index][slot];
        pokemon.classicSlot = slot;
        const buildForm = source.buildData?.gimmick;
        pokemon.classicForm = this.rules.mechanics?.[FORM_OPTION[buildForm]] === false ? null : buildForm || null;
        pokemon.classicTeraType = this.rules.mechanics?.tera === false ? null : source.buildData?.teraType || null;
        applyBattleStats(pokemon, source, projectFormStats);
      }
    }
    attachClassicScenarioRules(this.battle, this.rules);
    attachClassicBossRules(this.battle, this.rules);
    if (this.rules.allowPass) attachClassicBagRules(this.battle);
    honorCarriedFaints(this.battle);
    for (const [index, id] of SIDE_IDS.entries()) {
      const party = this.battle.getSide(id).pokemon;
      const lead = party[leadSlots[index]]?.hp > 0 ? leadSlots[index] : party.findIndex(mon => mon.hp > 0);
      if (lead < 0 || !this.battle.choose(id, `team ${lead + 1}`)) {
        throw new Error('Each side needs a playable lead Pokémon.');
      }
    }
    this.collectEvents();
  }

  collectEvents() {
    const lines = this.battle.log.slice(this.logCursor).join('\n');
    this.logCursor = this.battle.log.length;
    for (const protocol of extractChannelMessages(lines, [0])[0]) {
      const event = describeBattleLog(protocol, this.appearances, this.battle.dex);
      if (event) {
        this.events.push({ ...event, protocol, index: this.eventSequence++ });
      }
    }
    if (this.events.length > 300) this.events.splice(0, this.events.length - 300);
  }

  view() {
    const battle = this.battle;
    const requests = { p1: requestView(battle, battle.p1), p2: requestView(battle, battle.p2) };
    const winner = battle.ended ? SIDE_IDS.find(id => battle.getSide(id).name === battle.winner) || null : null;
    const readParty = side => side.pokemon.map(monView).sort((first, second) => first.slot - second.slot);
    return {
      engine: '@pkmn/sim', engineVersion: ENGINE_VERSION, seed: this.seed, requestId: this.requestId,
      turn: battle.turn, phase: battle.ended ? 'ended' : battle.requestState === 'switch' ? 'replace' : 'move',
      winner, requests, player: readParty(battle.p1), foe: readParty(battle.p2),
      field: fieldView(battle), sides: { p1: sideView(battle.p1), p2: sideView(battle.p2) },
      boss: classicBossView(battle),
      events: [...this.events],
    };
  }

  choose(id, action) {
    if (!SIDE_IDS.includes(id) || !action) throw new ClassicChoiceError('Choose an available action.');
    if (action.requestId !== undefined && action.requestId !== this.requestId) {
      throw new ClassicChoiceError('That battle choice is out of date.');
    }
    const battle = this.battle;
    const side = battle.getSide(id);
    const request = requestView(battle, side);
    const ownRequest = side.activeRequest;
    if (action.kind === 'bag-teleport') {
      if (!this.rules.allowPass || id !== 'p1' || !chooseBagTeleporterSwitch(battle, side, action.slot)) {
        throw new ClassicChoiceError('The Emergency Teleporter requires a trapped Pokémon and a valid teammate.');
      }
    } else if (action.kind === 'pass' && this.rules.allowPass && request.phase === 'move') {
      side.choice.actions.push({ choice: 'pass' });
      if (battle.allChoicesDone()) battle.commitChoices();
    } else {
      const command = this.command(side, request, action);
      const bossPhase = command && id === 'p2' && this.rules.boss?.profile ? noteStoryBossChoice(battle, request, action) : null;
      if (!command || !battle.choose(id, command)) {
        if (bossPhase) {
          delete bossPhase.committed;
          bossPhase.status = 'pending';
        }
        throw new ClassicChoiceError(side.choice.error || 'Choose an available action.');
      }
    }
    if (side.activeRequest !== ownRequest) this.requestId++;
    this.collectEvents();
    return this.view();
  }

  plannedBossMove(request) {
    return plannedStoryBossMove(this.battle, request);
  }

  command(side, request, action) {
    if (action.kind === 'switch' && request.switches.includes(action.slot) && !action.transform) {
      return `switch ${side.pokemon.findIndex(mon => mon.classicSlot === action.slot) + 1}`;
    }
    if (action.kind !== 'move' || request.phase !== 'move') return null;
    const move = action.slot === null && request.moves.length === 1 && request.moves[0].forced
      ? request.moves[0] : request.moves.find(candidate => candidate.slot === action.slot);
    const transform = action.transform || null;
    if (!move || (transform && !request.forms.includes(transform))) return null;
    if (transform === 'dynamax' || (move.maxMove && side.active[0].volatiles.dynamax)) {
      if (!move.maxMove || move.maxDisabled) return null;
    } else if (transform === 'zmove' ? !move.zMove : move.disabled) {
      return null;
    }
    return `move ${move.slot + 1}${transform ? ` ${transform}` : ''}`;
  }

  applyPartyState(id, party, field) {
    if (!this.rules.allowPass || !SIDE_IDS.includes(id) || !Array.isArray(party) || this.battle.ended) {
      throw new ClassicChoiceError('This battle cannot apply a party item.');
    }
    const side = this.battle.getSide(id);
    for (const pokemon of side.pokemon) {
      const source = party[pokemon.classicSlot];
      if (!source) continue;
      const hp = boundedInteger(source.currentHp, pokemon.hp, pokemon.fainted ? 0 : 1, pokemon.maxhp);
      if (pokemon.fainted && hp > 0 && pokemon.isActive) {
        throw new ClassicChoiceError('Choose a teammate before reviving the fainted lead.');
      }
    }
    for (const pokemon of side.pokemon) {
      const source = party[pokemon.classicSlot];
      if (!source) continue;
      pokemon.hp = boundedInteger(source.currentHp, pokemon.hp, pokemon.fainted ? 0 : 1, pokemon.maxhp);
      if (pokemon.fainted && pokemon.hp > 0) {
        pokemon.fainted = false;
        pokemon.faintQueued = false;
        pokemon.switchFlag = false;
        side.pokemonLeft++;
      }
      if (pokemon.fainted) continue;
      applyStatusSnapshot(pokemon, source);
      if (Array.isArray(source.moves)) applyMovePp(pokemon, source.moves);
      applyBagVolatiles(pokemon, source.volatile);
      for (const [native, classic] of Object.entries(BOOST_NAMES)) {
        pokemon.boosts[native] = boundedInteger(source.stages?.[classic], pokemon.boosts[native], -6, 6);
      }
    }
    applyBagField(this.battle, side, field);
    // Cure, PP restorers, and revives can change the legal move or switch list.
    // Recompute requests while keeping choices already accepted from the other side.
    const requests = this.battle.getRequests(this.battle.requestState);
    for (const [index, member] of this.battle.sides.entries()) member.activeRequest = requests[index];
    this.collectEvents();
    return this.view();
  }

  snapshot() {
    return JSON.parse(JSON.stringify({
      version: SNAPSHOT_VERSION, engineVersion: ENGINE_VERSION, seed: this.seed, rules: this.rules,
      requestId: this.requestId, battle: this.battle.toJSON(),
    }));
  }

  static fromSnapshot(snapshot) {
    if (snapshot?.version !== SNAPSHOT_VERSION || snapshot.engineVersion !== ENGINE_VERSION) {
      throw new Error('This battle snapshot uses a different simulator version.');
    }
    const session = Object.create(ClassicSimulation.prototype);
    session.seed = snapshot.seed;
    session.rules = structuredClone(snapshot.rules);
    session.requestId = snapshot.requestId;
    session.events = [];
    session.logCursor = 0;
    session.eventSequence = 0;
    session.appearances = new Map();
    session.battle = restoreClassicBattle(snapshot.battle);
    for (const side of session.battle.sides) for (const pokemon of side.pokemon) attachStatProjection(pokemon);
    attachClassicScenarioRules(session.battle, session.rules);
    attachClassicBossRules(session.battle, session.rules);
    if (session.rules.allowPass) attachClassicBagRules(session.battle);
    session.collectEvents();
    return session;
  }
}
