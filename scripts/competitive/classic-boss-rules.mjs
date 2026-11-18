import { attachStoryBossProfile, storyBossProfileView } from './classic-story-boss.mjs';

const attached = new WeakSet();

const EFFECT_LABELS = {
  surge: 'Power Up',
  immunity: 'Immune',
  stabBoost: 'STAB Amp',
  ward: 'Damage Down',
  shield: 'Barrier',
  regen: 'Regeneration',
  heal: 'Second Wind',
  cleanse: 'Cleanse',
};
const COUNTERS = {
  surge: 'surgeTurns', immunity: 'immuneTurns', stabBoost: 'stabBoostTurns', ward: 'wardTurns',
};
const WEATHER = {
  sun: 'sunnyday', rain: 'raindance', sandstorm: 'sandstorm', hail: 'hail', snow: 'snowscape',
};
const TERRAINS = new Set(['electric', 'grassy', 'misty', 'psychic']);
const FIELDS_BY_TYPE = {
  Fire: ['weather', 'Sun'],
  Water: ['weather', 'Rain'],
  Rock: ['weather', 'Sandstorm'],
  Ground: ['weather', 'Sandstorm'],
  Ice: ['weather', 'Hail'],
  Electric: ['terrain', 'Electric'],
  Grass: ['terrain', 'Grassy'],
  Psychic: ['terrain', 'Psychic'],
  Fairy: ['terrain', 'Misty'],
};

function turns(value, fallback) {
  return value > 0 && Number.isInteger(value) ? value : fallback;
}

function fraction(value, fallback) {
  return value > 0 && value <= 1 ? value : fallback;
}

function initialState() {
  return {
    lastTurn: 0,
    surgeTurns: 0, stabBoostTurns: 0, wardTurns: 0, immuneTurns: 0, shieldHp: 0, regen: null,
    weatherLocked: false, terrainLocked: false, fired: {}, pending: [],
  };
}

function validateMechanics(mechanics) {
  if (!Array.isArray(mechanics)) throw new Error('Boss rules require a phase list.');
  for (const phase of mechanics) {
    if (!phase) throw new Error('Missing boss phase.');
    if (phase.type === 'fieldLock') {
      const id = String(phase.value).toLowerCase();
      if (id === 'auto' || (phase.kind === 'weather' && Object.hasOwn(WEATHER, id)) ||
          (phase.kind === 'terrain' && TERRAINS.has(id))) continue;
    }
    if (phase.type === 'immunityRound') continue;
    if (['hpThresholdPhase', 'faintPhase'].includes(phase.type) &&
        Object.hasOwn(EFFECT_LABELS, phase.effect || 'surge')) continue;
    throw new Error(`Unsupported boss phase: ${phase.type || '(missing type)'} ${phase.effect || phase.value || ''}`.trim());
  }
}

function announce(battle, phase, banner, effect, text) {
  const plain = value => String(value || '').replace(/[|\r\n]/g, ' ');
  battle.add('boss-phase', phase, plain(banner), effect, plain(text));
}

function installFieldLocks(battle, mechanics) {
  const format = battle.format;
  const original = format.onBattleStart;
  format.onBattleStart = function () {
    original?.call(this);
    const bossLead = this.p2.pokemon[0];
    for (const mechanic of mechanics) {
      if (mechanic.type !== 'fieldLock') continue;
      const [kind, value] = mechanic.value === 'auto'
        ? FIELDS_BY_TYPE[bossLead.getTypes()[0]] || []
        : [mechanic.kind, mechanic.value];
      if (!kind) continue;
      const weather = kind === 'weather';
      const id = weather ? WEATHER[this.toID(value)] : `${this.toID(value)}terrain`;
      const apply = weather ? this.field.setWeather : this.field.setTerrain;
      if (this.field[kind] !== id && !apply.call(this.field, id, bossLead, format)) {
        throw new Error(`Unable to start the boss field ${value}.`);
      }
      this.field[`${kind}State`].duration = turns(mechanic.turns, 99);
      this.classicBoss[`${kind}Locked`] = true;
      announce(this, 'field', mechanic.banner || `${value.toUpperCase()} LOCKED`, kind,
        `The boss opens with ${value}${weather ? '' : ' Terrain'}.`);
    }
  };
}

function heal(battle, pokemon, amount, label) {
  const gained = Math.min(amount, pokemon.maxhp - pokemon.hp);
  if (gained > 0 && pokemon.hp > 0) {
    pokemon.hp += gained;
    battle.add('-heal', pokemon, pokemon.getHealth, `[from] ${label}`);
  }
}

function activate(battle, foe, phase) {
  const boss = battle.classicBoss;
  const { effect, magnitude } = phase;
  let text;
  switch (effect) {
  case 'surge':
    boss.surgeTurns = 3;
    text = `${foe.name} deals 25% more damage for 3 turns.`;
    break;
  case 'stabBoost':
    boss.stabBoostTurns = turns(magnitude, 3);
    text = `${foe.name}'s same-type attacks deal 20% more damage for ${boss.stabBoostTurns} turns.`;
    break;
  case 'ward':
    boss.wardTurns = turns(magnitude, 3);
    text = `${foe.name} takes 25% less damage from direct attacks for ${boss.wardTurns} turns.`;
    break;
  case 'immunity':
    boss.immuneTurns = turns(magnitude, 1);
    text = `${foe.name} is immune to damaging attacks for ${boss.immuneTurns} turn${boss.immuneTurns === 1 ? '' : 's'}. Status moves still work.`;
    break;
  case 'shield':
    boss.shieldHp = Math.floor(foe.maxhp * fraction(magnitude, 1 / 4));
    text = `${foe.name} raises a barrier with ${boss.shieldHp} HP.`;
    break;
  case 'regen':
    boss.regen = { turns: turns(magnitude?.turns, 3), pct: fraction(magnitude?.pct, 1 / 16) };
    text = `${foe.name} regenerates ${boss.regen.pct * 100}% of its HP each turn for ${boss.regen.turns} turns.`;
    break;
  case 'heal':
    heal(battle, foe, Math.floor(foe.maxhp * fraction(magnitude, 1 / 4)), EFFECT_LABELS.heal);
    text = `${foe.name} gets a second wind.`;
    break;
  case 'cleanse':
    if (['tox', 'brn', 'psn'].includes(foe.status)) foe.cureStatus();
    foe.removeVolatile('leechseed');
    foe.removeVolatile('partiallytrapped');
    text = `${foe.name} cleanses poison, burns, Leech Seed and trapping moves.`;
    break;
  }
  announce(battle, 'activate', phase.banner, effect, text);
}

function tickBoss(battle, mechanics) {
  const boss = battle.classicBoss;
  const foe = battle.p2.active[0];
  if (!foe?.hp || !battle.turn || boss.lastTurn === battle.turn) return;
  boss.lastTurn = battle.turn;
  for (const timer of Object.values(COUNTERS)) {
    if (boss[timer] > 0) boss[timer]--;
  }
  const pending = boss.pending.splice(0);
  for (const phase of pending) activate(battle, foe, phase);

  for (const phase of mechanics) {
    let firedKey;
    let effect = phase.effect || 'surge';
    let magnitude = phase.magnitude;
    if (phase.type === 'hpThresholdPhase') {
      const threshold = fraction(phase.at, 1 / 4);
      if (foe.hp > foe.maxhp * threshold) continue;
      firedKey = `hp_${threshold}`;
    } else if (phase.type === 'faintPhase') {
      const count = Math.max(0, phase.afterFaints | 0);
      if (battle.p2.pokemon.filter(pokemon => pokemon !== foe && !pokemon.hp).length < count) continue;
      firedKey = `faint_${count}`;
    } else if (phase.type === 'immunityRound') {
      const cadence = Math.max(2, phase.everyN | 0);
      if (battle.turn % cadence !== cadence - 1) continue;
      firedKey = `imm_${battle.turn}`;
      effect = 'immunity';
      magnitude = phase.turns;
    } else {
      continue;
    }
    if (boss.fired[firedKey]) continue;
    boss.fired[firedKey] = true;
    const banner = phase.banner || 'BOSS PHASE INCOMING';
    boss.pending.push({ banner, effect, magnitude });
    announce(battle, 'telegraph', banner, effect, `${foe.name} prepares ${EFFECT_LABELS[effect]} for next turn.`);
  }
}

function targetsBoss(target, source, move) {
  return target?.side.id === 'p2' && source?.side && source.side !== target.side &&
    move?.effectType === 'Move' && move.category !== 'Status';
}

// Included between Glass Cannon and the other campaign damage modifiers.
export function applyClassicBossDamage(battle, damage, source, target, move) {
  const boss = battle.classicBoss;
  if (!boss || !damage || move.category === 'Status') return damage;
  if (source.side.id === 'p2') {
    if (boss.surgeTurns > 0) damage = Math.floor(damage * 1.25);
    const sameType = move.type !== '???' && (move.forceSTAB || source.hasType(move.type) ||
      source.getTypes(false, true).includes(move.type) || move.stellarBoosted);
    if (boss.stabBoostTurns > 0 && sameType) damage = Math.floor(damage * 1.2);
  }
  if (target.side.id === 'p2' && boss.wardTurns > 0) damage = Math.max(1, Math.floor(damage * 0.75));
  return damage;
}

export function attachClassicBossRules(battle, rules) {
  if (!rules?.boss || attached.has(battle)) return;
  const { mechanics, profile } = rules.boss;
  if (!profile) validateMechanics(mechanics);
  attached.add(battle);
  if (!battle.classicBoss) {
    battle.classicBoss = initialState();
    if (rules.boss.fieldPrepared) {
      battle.classicBoss.weatherLocked = Boolean(rules.boss.weatherLocked);
      battle.classicBoss.terrainLocked = Boolean(rules.boss.terrainLocked);
    }
  }

  // Runtime callbacks are installed again after native snapshot restoration.
  Object.defineProperty(battle, 'events', { value: battle.events, writable: true, configurable: true, enumerable: false });
  if (profile) {
    battle.format = Object.assign(Object.create(Object.getPrototypeOf(battle.format)), battle.format);
    battle.classicBoss.profile = profile;
    attachStoryBossProfile(battle, profile);
    return;
  }
  if (!rules.boss.fieldPrepared && mechanics.some(phase => phase.type === 'fieldLock')) {
    battle.format = Object.assign(Object.create(Object.getPrototypeOf(battle.format)), battle.format);
    installFieldLocks(battle, mechanics);
  }
  const format = battle.format;
  battle.onEvent('BeforeTurn', format, 100, function () {
    tickBoss(this, mechanics);
  });
  battle.onEvent('TryHit', format, 50, function (target, source, move) {
    if (this.classicBoss.immuneTurns <= 0 || !targetsBoss(target, source, move)) return;
    this.add('-immune', target, '[from] Boss immunity');
    return null;
  });
  battle.onEvent('Damage', format, 50, function (damage, target, source, move) {
    const boss = this.classicBoss;
    if (boss.shieldHp <= 0 || damage <= 0 || !targetsBoss(target, source, move)) return;
    const absorption = Math.min(boss.shieldHp, damage);
    boss.shieldHp -= absorption;
    const breaking = boss.shieldHp === 0;
    announce(this, 'shield', breaking ? 'BARRIER SHATTERED' : '', 'shield',
      `${target.name}'s barrier absorbed ${absorption} damage.${breaking ? ' The barrier shattered.' : ''}`);
    return damage - absorption;
  });
  battle.onEvent('Residual', format, { order: 10 }, function (pokemon) {
    const boss = this.classicBoss;
    if (!boss.regen || pokemon !== this.p2.active[0] || !pokemon.hp) return;
    heal(this, pokemon, Math.max(1, Math.floor(pokemon.maxhp * boss.regen.pct)), EFFECT_LABELS.regen);
    if (--boss.regen.turns <= 0) boss.regen = null;
  });
}

export function classicBossView(battle) {
  const boss = battle.classicBoss;
  if (!boss) return null;
  return {
    surgeTurns: boss.surgeTurns, stabBoostTurns: boss.stabBoostTurns,
    wardTurns: boss.wardTurns, immuneTurns: boss.immuneTurns,
    shieldHp: boss.shieldHp, regen: boss.regen && { ...boss.regen },
    weatherLocked: boss.weatherLocked, terrainLocked: boss.terrainLocked,
    pending: boss.pending.map(({ banner, effect }) => ({ banner, effect })),
    ...(boss.profile ? storyBossProfileView(battle, boss.profile) : {}),
  };
}
