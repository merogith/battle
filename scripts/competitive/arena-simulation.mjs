import { Battle, extractChannelMessages, Teams, TeamValidator, toID } from '@pkmn/sim';

export const FORMAT = 'gen9ou';
export const DYNAMAX_FORMAT = 'gen8battlestadiumsingles';
export const ENGINE_VERSION = '0.10.9';
export class ArenaTeamError extends Error {}
const MAX_SEED = 0xffffffff;
const MAX_TEAM_TEXT = 12000;
const PLAYER = 'You';
const OPPONENT = 'Arena AI';
const OFFENSE = { spa: 252, spd: 4, spe: 252 };
const SPEED = { atk: 252, spd: 4, spe: 252 };
const DEFENSE = { hp: 252, def: 252, spd: 4 };
const BULK = { hp: 252, def: 4, spd: 252 };
const ATTACK = { hp: 252, atk: 252, spd: 4 };

const PLAYER_TEAM = [
  { species: 'Great Tusk', ability: 'Protosynthesis', item: 'Rocky Helmet', nature: 'Jolly', evs: SPEED, teraType: 'Water', moves: ['Headlong Rush', 'Rapid Spin', 'Knock Off', 'Stealth Rock'] },
  { species: 'Gholdengo', ability: 'Good as Gold', item: 'Choice Scarf', nature: 'Timid', evs: OFFENSE, teraType: 'Steel', moves: ['Make It Rain', 'Shadow Ball', 'Focus Blast', 'Trick'] },
  { species: 'Dragapult', ability: 'Infiltrator', item: 'Heavy-Duty Boots', nature: 'Timid', evs: OFFENSE, teraType: 'Dragon', moves: ['Draco Meteor', 'Shadow Ball', 'Will-O-Wisp', 'U-turn'] },
];
const OPPONENT_TEAM = [
  { species: 'Corviknight', ability: 'Mirror Armor', item: 'Leftovers', nature: 'Impish', evs: DEFENSE, teraType: 'Dragon', moves: ['Brave Bird', 'Roost', 'U-turn', 'Body Press'] },
  { species: 'Slowking-Galar', ability: 'Regenerator', item: 'Heavy-Duty Boots', nature: 'Sassy', evs: { hp: 252, spa: 4, spd: 252 }, teraType: 'Water', moves: ['Future Sight', 'Sludge Bomb', 'Flamethrower', 'Chilly Reception'] },
  { species: 'Meowscarada', ability: 'Protean', item: 'Choice Band', nature: 'Jolly', evs: SPEED, teraType: 'Grass', moves: ['Flower Trick', 'Knock Off', 'U-turn', 'Triple Axel'] },
];
const HISTORICAL_PLAYER = [
  { species: 'Snorlax', ability: 'Thick Fat', nature: 'Careful', evs: BULK, moves: ['Body Slam', 'Earthquake', 'Rest', 'Amnesia'] },
  { species: 'Starmie', ability: 'Natural Cure', nature: 'Timid', evs: OFFENSE, moves: ['Surf', 'Thunderbolt', 'Ice Beam', 'Recover'] },
  { species: 'Gengar', ability: 'Levitate', nature: 'Timid', evs: OFFENSE, moves: ['Thunderbolt', 'Psychic', 'Confuse Ray', 'Night Shade'] },
];
const HISTORICAL_OPPONENT = [
  { species: 'Alakazam', ability: 'Synchronize', nature: 'Timid', evs: OFFENSE, moves: ['Psychic', 'Recover', 'Seismic Toss', 'Reflect'] },
  { species: 'Zapdos', ability: 'Pressure', nature: 'Timid', evs: DEFENSE, moves: ['Thunderbolt', 'Drill Peck', 'Thunder Wave', 'Agility'] },
  { species: 'Rhydon', ability: 'Rock Head', nature: 'Adamant', evs: ATTACK, moves: ['Earthquake', 'Rock Slide', 'Body Slam', 'Substitute'] },
];
const PLAYER_RESERVES = [
  { species: 'Primarina', ability: 'Torrent', item: 'Leftovers', nature: 'Modest', evs: { hp: 252, spa: 252, spd: 4 }, teraType: 'Steel', moves: ['Moonblast', 'Surf', 'Psychic Noise', 'Encore'] },
  { species: 'Kingambit', ability: 'Supreme Overlord', item: 'Black Glasses', nature: 'Adamant', evs: ATTACK, teraType: 'Dark', moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'] },
  { species: 'Rillaboom', ability: 'Grassy Surge', item: 'Heavy-Duty Boots', nature: 'Adamant', evs: SPEED, teraType: 'Grass', moves: ['Wood Hammer', 'Grassy Glide', 'U-turn', 'Knock Off'] },
];
const OPPONENT_RESERVES = [
  { species: 'Iron Valiant', ability: 'Quark Drive', item: 'Booster Energy', nature: 'Naive', evs: { atk: 4, spa: 252, spe: 252 }, teraType: 'Electric', moves: ['Moonblast', 'Close Combat', 'Thunderbolt', 'Encore'] },
  { species: 'Ting-Lu', ability: 'Vessel of Ruin', item: 'Leftovers', nature: 'Careful', evs: BULK, teraType: 'Water', moves: ['Earthquake', 'Ruination', 'Stealth Rock', 'Whirlwind'] },
  { species: 'Cinderace', ability: 'Libero', item: 'Heavy-Duty Boots', nature: 'Jolly', evs: SPEED, teraType: 'Fire', moves: ['Pyro Ball', 'High Jump Kick', 'U-turn', 'Court Change'] },
];
const HISTORICAL_PLAYER_RESERVES = [
  { species: 'Tauros', ability: 'Intimidate', nature: 'Jolly', evs: SPEED, moves: ['Body Slam', 'Earthquake', 'Blizzard', 'Hyper Beam'] },
  { species: 'Exeggutor', ability: 'Chlorophyll', nature: 'Modest', evs: { hp: 252, spa: 252, spd: 4 }, moves: ['Psychic', 'Solar Beam', 'Leech Seed', 'Explosion'] },
  { species: 'Jolteon', ability: 'Volt Absorb', nature: 'Timid', evs: OFFENSE, moves: ['Thunderbolt', 'Pin Missile', 'Thunder Wave', 'Quick Attack'] },
];
const HISTORICAL_OPPONENT_RESERVES = [
  { species: 'Lapras', ability: 'Water Absorb', nature: 'Modest', evs: OFFENSE, moves: ['Ice Beam', 'Surf', 'Thunderbolt', 'Body Slam'] },
  { species: 'Chansey', ability: 'Natural Cure', nature: 'Calm', evs: DEFENSE, moves: ['Soft-Boiled', 'Body Slam', 'Thunderbolt', 'Ice Beam'] },
  { species: 'Dragonite', ability: 'Inner Focus', nature: 'Modest', evs: OFFENSE, moves: ['Body Slam', 'Thunderbolt', 'Ice Beam', 'Surf'] },
];

function legalTeam(format, generation, preset) {
  const team = preset.map(set => {
    const copy = { ...set, name: set.species, moves: [...set.moves], evs: { ...set.evs } };
    if (generation < 9) {
      if (generation >= 2 && (set.species === 'Snorlax' || set.species === 'Rhydon')) copy.item = 'Leftovers';
      if (generation >= 5 && set.species === 'Chansey') copy.item = 'Eviolite';
      if (generation >= 7 && set.species === 'Gengar') copy.ability = 'Cursed Body';
      if (format === DYNAMAX_FORMAT && set.species === 'Alakazam') copy.moves[2] = 'Focus Blast';
      if (generation < 3) {
        delete copy.ability;
        delete copy.nature;
        delete copy.evs;
      }
    }
    return copy;
  });
  const problems = TeamValidator.get(format).validateTeam(team);
  if (problems) throw new Error(`Invalid Arena roster: ${problems.join(' ')}`);
  return team;
}

function importedTeam(text, format, formatLabel, teamSize) {
  if (text === undefined) return null;
  if (typeof text !== 'string' || text.length > MAX_TEAM_TEXT) throw new ArenaTeamError('Paste a team of at most 12,000 characters.');
  const exportText = text.trim();
  if (!exportText) return null;
  if (exportText.startsWith('[') || exportText.includes('|') || (exportText.match(/^\s*===/gm) || []).length > 1) {
    throw new ArenaTeamError('Paste one team in Pokémon Showdown’s readable export format.');
  }
  const team = Teams.import(exportText);
  if (!team || team.length !== teamSize) {
    throw new ArenaTeamError(`Paste exactly ${teamSize === 3 ? 'three' : 'six'} Pokémon for a ${teamSize}-on-${teamSize} match.`);
  }
  const problems = TeamValidator.get(format).validateTeam(team);
  if (problems) throw new ArenaTeamError(`Your team has issues under ${formatLabel} rules.\n${problems.join('\n')}`);
  return team;
}

function seedWords(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) throw new Error('Enter a seed from 0 to 4294967295.');
  return `gen5,${seed.toString(16).padStart(8, '0')}50424131`;
}

function pokemonLabel(name, species) {
  if (!species) return name || 'Pokémon';
  const id = toID(name);
  return id && id !== species.id && id !== toID(species.baseSpecies) ? `${name} (${species.name})` : species.name;
}

function healthPercent(condition) {
  const match = /^([0-9]+)\/([0-9]+)/.exec(condition || '');
  return match ? Math.ceil(Number(match[1]) / Number(match[2]) * 100) : 0;
}

const WEATHER_NAMES = {
  raindance: 'Rain', primordialsea: 'Heavy rain', sunnyday: 'Sun', desolateland: 'Harsh sunlight',
  sandstorm: 'Sandstorm', hail: 'Hail', snowscape: 'Snow', deltastream: 'Strong winds',
};

export function explain(line, activeSpecies, dex) {
  const [, tag, name, detail, extra] = line.split('|');
  const ref = /^(p[12][a-z]?): (.+)$/.exec(name || '');
  const [, position, nickname] = ref || [];
  if (position && ['switch', 'drag', 'replace', 'detailschange', '-formechange'].includes(tag)) {
    const species = dex.species.get(detail.split(',')[0]);
    if (species.exists) activeSpecies.set(position, species);
  }
  if (position && tag === '-transform') {
    const target = activeSpecies.get(detail.split(':')[0]);
    if (target) activeSpecies.set(position, target);
  }
  const mon = pokemonLabel(nickname, activeSpecies.get(position));
  switch (tag) {
  case 'turn': return { kind: 'turn', text: `Turn ${name}` };
  case 'switch':
  case 'drag': return { kind: 'switch', text: `${mon} entered the field.` };
  case 'replace': return { kind: 'effect', text: `${mon} was revealed.` };
  case 'move': return { kind: 'move', text: `${mon} used ${detail}!` };
  case 'faint': return { kind: 'faint', text: `${mon} fainted.` };
  case 'cant': return { kind: 'effect', text: `${mon} could not move${detail ? ` (${detail.replace(/^move: /, '')})` : ''}.` };
  case '-damage': return { kind: 'damage', text: `${mon} dropped to ${healthPercent(detail)}% HP.` };
  case '-heal': return { kind: 'heal', text: `${mon} recovered to ${healthPercent(detail)}% HP.` };
  case '-status': return { kind: 'effect', text: `${mon} was affected by ${STATUS[detail] || detail}.` };
  case '-curestatus': return { kind: 'effect', text: `${mon} recovered from ${STATUS[detail] || detail}.` };
  case '-boost': return { kind: 'effect', text: `${mon} raised its ${STATS[detail] || detail}${Number(extra) > 1 ? ' sharply' : ''}.` };
  case '-unboost': return { kind: 'effect', text: `${mon} lost ${STATS[detail] || detail}${Number(extra) > 1 ? ' sharply' : ''}.` };
  case '-mega': return { kind: 'effect', text: `${nickname} Mega Evolved into ${mon}!` };
  case '-terastallize': return { kind: 'effect', text: `${mon} Terastallized into ${detail}!` };
  case '-start':
    return detail === 'Dynamax' ? { kind: 'effect', text: `${mon} ${extra === 'Gmax' ? 'Gigantamaxed' : 'Dynamaxed'}!` } : null;
  case '-end': return detail === 'Dynamax' ? { kind: 'effect', text: `${mon} returned to its normal size.` } : null;
  case '-fieldstart':
  case '-sidestart': return { kind: 'effect', text: `${(detail || name).replace(/^move: /, '')} took effect.` };
  case '-weather': {
    if (extra === '[upkeep]' || detail === '[upkeep]') return null;
    return { kind: 'effect', text: name === 'none' ? 'The weather cleared.' : `Weather changed to ${WEATHER_NAMES[toID(name)] || name}.` };
  }
  case '-immune': return { kind: 'effect', text: `${mon} was immune.` };
  case '-miss': return { kind: 'effect', text: `${mon} missed.` };
  case '-fail': return { kind: 'effect', text: `${mon}’s move failed.` };
  case '-supereffective': return { kind: 'effect', text: 'It was super effective.' };
  case '-resisted': return { kind: 'effect', text: 'It was not very effective.' };
  case '-crit': return { kind: 'effect', text: 'A critical hit!' };
  case '-hitcount': return { kind: 'effect', text: `Hit ${detail} times.` };
  case 'win': return { kind: 'result', text: name === PLAYER ? 'You won the battle.' : 'The Arena AI won the battle.' };
  case 'tie': return { kind: 'result', text: 'The battle ended in a draw.' };
  default: return null;
  }
}

const STATS = { atk: 'Attack', def: 'Defense', spa: 'Special Attack', spd: 'Special Defense', spe: 'Speed', accuracy: 'accuracy', evasion: 'evasion' };
const STATUS = { brn: 'burn', par: 'paralysis', slp: 'sleep', psn: 'poison', tox: 'bad poison', frz: 'freeze' };
const TURN_COMMANDS = {
  fight: 'Continue the turn while your Pokémon cannot select an attack.',
  recharge: 'Spend this turn recharging after the previous attack.',
};

const Z_STATUS = {
  heal: 'Fully restores the user’s HP.',
  healreplacement: 'Fully restores the next teammate’s HP when it enters this slot.',
  clearnegativeboost: 'Resets the user’s lowered stats.',
  redirect: 'Draws opposing moves to the user on this turn.',
  crit2: 'Raises the user’s critical-hit rate by two stages.',
  curse: 'Restores the user’s HP if Ghost-type, or raises Attack by one stage otherwise.',
};

function moveDetails(move) {
  const power = move.category === 'Status' ? null : move.damage || move.damageCallback ? 'Fixed damage'
    : move.basePowerCallback || !move.basePower ? 'Varies' : move.basePower;
  return { type: move.type, category: move.category, power, accuracy: move.accuracy ?? null, effect: move.shortDesc || move.desc || '' };
}

function withPublicWeather(details, move, dex, mon, weather) {
  const weatherBall = move.id === 'weatherball';
  if (!weather || (!weatherBall && !['thunder', 'hurricane', 'blizzard'].includes(move.id))) return details;
  if (mon.getAbility().suppressWeather && !mon.ignoringAbility()) return details;
  const ownUmbrella = mon.hasItem('utilityumbrella') && ['sunnyday', 'desolateland', 'raindance', 'primordialsea'].includes(weather);
  const effective = weatherBall && ownUmbrella ? '' : weather;

  // These move callbacks only need the publicly announced weather. Give them a
  // detached move and weather reader so previews cannot inspect the foe's set.
  const preview = dex.getActiveMove(move);
  const weatherReader = { effectiveWeather: () => effective };
  const field = { ...weatherReader, isWeather: names => [names].flat().includes(effective) };
  const context = { field, debug() {} };
  move.onModifyType?.call(context, preview, weatherReader);
  move.onModifyMove?.call(context, preview, weatherReader, weatherReader);
  return {
    ...details, type: preview.type, category: preview.category,
    weatherPower: preview.basePower !== move.basePower ? preview.basePower : null,
    weatherAccuracy: preview.accuracy !== move.accuracy ? preview.accuracy : null,
  };
}

function describeChoice(choice, battle, battleForm, weather) {
  if (Object.hasOwn(TURN_COMMANDS, choice.id)) {
    return { ...choice, type: null, category: null, power: null, accuracy: null, effect: TURN_COMMANDS[choice.id], variant: null };
  }
  const { dex, p1 } = battle;
  const mon = p1.active[0];
  const move = dex.moves.get(choice.id);
  let details = withPublicWeather(moveDetails(move), move, dex, mon, weather);
  let variant = null;
  if (move.id === 'hiddenpower') {
    details = { ...moveDetails(dex.moves.get(`Hidden Power ${mon.hpType}`)), power: mon.hpPower,
      effect: 'The user’s IVs determine the type and, before Gen 6, the base power.' };
  }
  if (move.id === 'revelationdance' || move.id === 'ivycudgel') {
    const current = dex.getActiveMove(move);
    move.onModifyType(current, mon);
    details.type = current.type;
    if (move.id === 'revelationdance' && battleForm?.kind === 'terastallize' && battleForm.type !== 'Stellar') {
      variant = { name: choice.name, ...details, type: battleForm.type };
    }
  }
  if (choice.zMove) {
    const zMove = battle.actions.getActiveZMove(move, mon);
    const boost = Object.entries(move.zMove?.boost || {}).map(([stat, stages]) => `${STATS[stat]} +${stages}`).join(', ');
    const zDetails = moveDetails(zMove);
    variant = { name: choice.zMove, ...zDetails, source: choice.name, disabled: false, weatherPower: null, weatherAccuracy: null };
    if (move.category === 'Status') {
      const extra = boost ? `Z-Power raises ${boost}.` : Z_STATUS[move.zMove?.effect];
      variant.effect = [details.effect, extra].filter(Boolean).join(' ');
    } else if (dex.moves.get(zMove.id).basePower === 1) {
      variant.effect = 'Deals reduced damage through Protect and similar moves.';
    }
  }
  if (choice.maxMove) {
    const maxMove = battle.actions.getActiveMaxMove(move, mon);
    const maxDetails = { ...moveDetails(maxMove), name: maxMove.name, source: choice.name, disabled: choice.maxMove.disabled,
      weatherPower: null, weatherAccuracy: null };
    if (mon.volatiles.dynamax) return { ...choice, ...maxDetails, variant: null };
    variant = maxDetails;
  }
  return { ...choice, ...details, variant };
}

function requestChoices(side, dex) {
  const request = side.activeRequest;
  if (!request || request.wait) return { phase: 'wait', moves: [], switches: [], teraType: null, battleForm: null };
  if (request.teamPreview) {
    return { phase: 'preview', moves: [], switches: request.side.pokemon.map((_, slot) => slot), teraType: null, battleForm: null };
  }
  const active = request.active?.[0];
  const moves = (active?.moves || []).map((entry, slot) => {
    const move = dex.moves.get(entry.id);
    return { slot, id: move.id, name: entry.move, type: move.type, category: move.category, pp: entry.pp, zMove: active.canZMove?.[slot]?.move || null,
      maxMove: active.maxMoves?.maxMoves?.[slot] || null,
      maxPp: entry.maxpp, disabled: Boolean(entry.disabled || entry.pp === 0) };
  });
  const switches = active?.trapped ? [] : request.side.pokemon.flatMap((mon, slot) =>
    (mon.active || mon.condition.endsWith(' fnt')) ? [] : [slot]);
  const teraType = active?.canTerastallize || null;
  let battleForm = null;
  if (active?.canMegaEvo) {
    battleForm = { kind: 'mega', label: 'Mega Evolve', species: dex.species.get(side.active[0].canMegaEvo).name };
  }
  if (active?.canZMove) battleForm = { kind: 'zmove', label: 'Use Z-Move' };
  if (active?.canDynamax) {
    battleForm = { kind: 'dynamax', label: active.maxMoves?.gigantamax ? 'Gigantamax' : 'Dynamax' };
  }
  if (teraType) battleForm = { kind: 'terastallize', label: `Tera ${teraType}`, type: teraType };
  return { phase: request.forceSwitch ? 'replace' : 'move', moves, switches, teraType, battleForm };
}

function ownedMon(mon, slot) {
  return { slot, name: pokemonLabel(mon.name, mon.species), sprite: mon.species.spriteid, types: mon.getTypes(), active: mon.isActive,
    fainted: mon.fainted, hpPercent: Math.ceil(mon.hp / mon.maxhp * 100), status: mon.status || null,
    sizeForm: mon.volatiles.dynamax ? (mon.gigantamax ? 'Gigantamax' : 'Dynamax') : null,
    disguise: mon.illusion ? pokemonLabel(mon.illusion.name, mon.illusion.species) : null };
}

function opponentMon(mon, activeSpecies) {
  if (mon.isActive) {
    const appeared = mon.illusion || mon;
    const species = activeSpecies || appeared.species;
    const types = mon.illusion && !mon.terastallized ? species.types : mon.getTypes();
    return { name: pokemonLabel(appeared.name, species), sprite: species.spriteid, types, active: true,
      fainted: mon.fainted, hpPercent: Math.ceil(mon.hp / mon.maxhp * 100), status: mon.status || null };
  }
  const base = mon.baseSpecies;
  return { name: base.name, sprite: base.spriteid, types: base.types, active: false,
    fainted: mon.fainted, hpPercent: mon.fainted ? 0 : null, status: null };
}

const presentationTags = new Set([
  'move', 'switch', 'drag', 'replace', 'faint', 'cant', 'turn', 'win', 'tie',
  '-damage', '-heal', '-status', '-curestatus', '-boost', '-unboost', '-miss', '-immune', '-fail',
  '-block', '-activate', '-start', '-prepare', '-notarget', '-sidestart', '-fieldstart', '-weather',
]);
const sideOf = value => /^(p[12])(?:[a-z]?: |$)/.exec(value || '')?.[1] ?? null;

function presentEvent(protocol, appearances, dex) {
  const [, tag, subject, detail, target] = protocol.split('|');
  if (!presentationTags.has(tag)) return null;
  const event = explain(protocol, appearances, dex);
  const side = sideOf(subject);
  const base = { tag, side, protocol, kind: event?.kind || 'effect', text: event?.text || '' };
  if (tag === 'move') {
    const move = dex.moves.get(detail);
    return { ...base, name: detail, targetSide: sideOf(target), facts: move.exists ? {
      category: move.category, type: move.type, target: move.target, basePower: move.basePower, priority: move.priority,
    } : null };
  }
  if (tag === '-damage' || tag === '-heal') return { ...base, hpPercent: healthPercent(detail) };
  if (tag === 'switch' || tag === 'drag' || tag === 'replace') {
    const species = dex.species.get(detail.split(',')[0]);
    return { ...base, appearance: species.exists ? {
      name: pokemonLabel(subject.replace(/^p[12][a-z]?: /, ''), species), sprite: species.spriteid, types: species.types,
      hpPercent: healthPercent(target), active: true, fainted: false, status: target?.split(' ')[1] || null,
    } : null };
  }
  return base;
}

export class ArenaSimulation {
  constructor(seed, epoch = 1, format = FORMAT, teamText, teamSize = 3) {
    const match = /^gen([1-9])ou$/.exec(format);
    if (!match && format !== DYNAMAX_FORMAT) throw new Error('Choose a supported OU format or Gen 8 Battle Stadium Singles.');
    if (teamSize !== 3 && (teamSize !== 6 || !match)) throw new Error('Choose three or six Pokémon for OU, or three for Battle Stadium.');
    this.format = format;
    this.generation = match ? Number(match[1]) : 8;
    this.formatLabel = format === DYNAMAX_FORMAT ? 'Gen 8 Battle Stadium Singles' : `Gen ${this.generation} OU`;
    this.teamSize = teamSize;
    this.seed = seed;
    this.epoch = epoch;
    this.requestNumber = 0;
    this.logCursor = 0;
    this.events = [];
    this.activeSpecies = new Map();
    this.publicAppearances = new Map();
    this.weather = '';
    this.choiceError = '';
    const modern = this.generation === 9;
    const playerPreset = modern ? PLAYER_TEAM : HISTORICAL_PLAYER;
    const opponentPreset = modern ? OPPONENT_TEAM : HISTORICAL_OPPONENT;
    const playerReserves = modern ? PLAYER_RESERVES : HISTORICAL_PLAYER_RESERVES;
    const opponentReserves = modern ? OPPONENT_RESERVES : HISTORICAL_OPPONENT_RESERVES;
    const playerTeam = importedTeam(teamText, format, this.formatLabel, teamSize)
      ?? legalTeam(format, this.generation, teamSize === 3 ? playerPreset : [...playerPreset, ...playerReserves]);
    const opponentTeam = legalTeam(format, this.generation, teamSize === 3 ? opponentPreset : [...opponentPreset, ...opponentReserves]);
    this.battle = new Battle({
      formatid: format, seed: seedWords(seed),
      send: (type, data) => {
        if (type !== 'sideupdate') return;
        const error = /^p1\n\|error\|([^\n]+)/.exec(data);
        if (error) this.choiceError = error[1].replace(/^\[[^\]]+\]\s*/, '');
      },
      p1: { name: PLAYER, team: playerTeam },
      p2: { name: OPPONENT, team: opponentTeam },
    });
    this.collectEvents();
  }

  collectEvents() {
    const slice = this.battle.log.slice(this.logCursor).join('\n');
    this.logCursor = this.battle.log.length;
    const channels = extractChannelMessages(slice, [0, 1]);
    this.presentation = channels[0].map(line => presentEvent(line, this.publicAppearances, this.battle.dex)).filter(Boolean);
    for (const line of channels[1]) {
      const weather = /^\|-weather\|([^|]+)/.exec(line);
      if (weather) {
        const id = toID(weather[1]);
        this.weather = Object.hasOwn(WEATHER_NAMES, id) ? id : '';
      }
      const event = explain(line, this.activeSpecies, this.battle.dex);
      if (event) this.events.push(event);
    }
  }

  view(error = null) {
    const { p1, p2, turn, ended, winner, dex } = this.battle;
    const choices = requestChoices(p1, dex);
    const moves = ended ? [] : choices.moves.map(choice => describeChoice(choice, this.battle, choices.battleForm, this.weather));
    return {
      format: this.format, formatLabel: this.formatLabel, teamSize: this.teamSize,
      generation: this.generation, engineVersion: ENGINE_VERSION, seed: this.seed, turn, error,
      requestId: `${this.epoch}:${this.requestNumber}`, weather: WEATHER_NAMES[this.weather] || null,
      ...choices, moves, phase: ended ? 'ended' : choices.phase,
      player: p1.pokemon.map(ownedMon), opponent: p2.pokemon.map(mon => opponentMon(mon, this.activeSpecies.get('p2a'))),
      events: this.events.slice(-100),
      presentation: this.presentation,
      result: ended ? (winner === PLAYER ? 'win' : winner === OPPONENT ? 'loss' : 'draw') : null,
      replay: ended ? { version: 1, engine: '@pkmn/sim', engineVersion: ENGINE_VERSION,
        format: this.format, teamSize: this.teamSize, seed: this.seed, inputLog: [...this.battle.inputLog] } : null,
    };
  }

  choose(action) {
    if (!action || action.requestId !== `${this.epoch}:${this.requestNumber}`) return this.view('That choice is out of date.');
    const { phase, moves, switches, battleForm } = requestChoices(this.battle.p1, this.battle.dex);
    const { kind, slot, transform } = action;
    if (this.battle.ended || !Number.isInteger(slot) || (transform !== undefined && typeof transform !== 'boolean')) {
      return this.view('Choose an available action.');
    }
    let command;
    if (kind === 'lead' && phase === 'preview' && switches.includes(slot) && !transform) command = `team ${slot + 1}`;
    if (kind === 'switch' && (phase === 'move' || phase === 'replace') && switches.includes(slot) && !transform) command = `switch ${slot + 1}`;
    const move = moves[slot];
    const effect = transform ? battleForm?.kind : null;
    const dynamaxed = this.battle.p1.active[0]?.volatiles.dynamax;
    const maxMove = (effect === 'dynamax' || dynamaxed) ? move?.maxMove : null;
    const canUseMove = effect === 'zmove' ? move?.zMove
      : maxMove ? !maxMove.disabled : effect !== 'dynamax' && move && !move.disabled;
    if (kind === 'move' && phase === 'move' && canUseMove && (!transform || effect)) {
      command = `move ${slot + 1}${effect ? ` ${effect}` : ''}`;
    }
    if (!command) return this.view('Choose an available action.');
    this.choiceError = '';
    if (!this.battle.choose('p1', command)) return this.view(this.choiceError || 'The simulator rejected that action.');
    this.requestNumber++;
    this.actForOpponent();
    this.collectEvents();
    return this.view();
  }

  actForOpponent() {
    const { p1, p2, dex } = this.battle;
    while (!this.battle.ended && !p2.isChoiceDone()) {
      const { phase, moves, switches, teraType, battleForm } = requestChoices(p2, dex);
      if (phase === 'wait') return;
      let command;
      if (phase === 'preview') command = `team ${switches[0] + 1}`;
      if (phase === 'replace') command = `switch ${switches[0] + 1}`;
      if (phase === 'move') {
        const target = p1.active[0];
        const active = p2.active[0];
        const targetTypes = target.illusion && !target.terastallized ? target.illusion.species.types : target.getTypes();
        const dynamax = battleForm?.kind === 'dynamax' && p2.pokemonLeft === 1 && moves.some(move => move.maxMove && !move.maxMove.disabled && move.category !== 'Status');
        const maxed = dynamax || active.volatiles.dynamax;
        const ranked = moves.filter(move => maxed && move.maxMove ? !move.maxMove.disabled : !move.disabled).map(move => {
          const base = dex.moves.get(move.id);
          const def = maxed && move.maxMove ? this.battle.actions.getActiveMaxMove(base, active) : base;
          const immune = def.category !== 'Status' && !dex.getImmunity(def.type, targetTypes);
          const mult = immune ? 0 : 2 ** dex.getEffectiveness(def.type, targetTypes);
          const stab = active.getTypes().includes(def.type) ? 1.5 : 1;
          const score = def.category === 'Status'
            ? (def.id === 'roost' && active.hp * 2 < active.maxhp ? 95 : 1)
            : (def.basePower || 45) * stab * mult * (Number(def.accuracy) / 100 || 1);
          return { ...move, score };
        }).sort((a, b) => b.score - a.score || a.slot - b.slot);
        const best = ranked[0];
        if (!best) throw new Error('The Arena AI had no legal move.');
        const transform = teraType && p2.pokemonLeft === 1 && best.category !== 'Status';
        command = `move ${best.slot + 1}${dynamax ? ' dynamax' : transform ? ' terastallize' : ''}`;
      }
      if (!command || !this.battle.choose('p2', command)) throw new Error('The Arena AI could not submit a legal action.');
      if (p1.activeRequest && !p1.activeRequest.wait && !p1.isChoiceDone()) return;
    }
  }
}
