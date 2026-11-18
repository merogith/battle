const CATEGORIES = new Set(['Physical', 'Special']);
const GUARDS = new Set(['categoryWard', 'nextHitWard']);
const CONDITIONAL_ATTACKS = new Set([
  'bide', 'burnup', 'comeuppance', 'counter', 'dreameater', 'fakeout', 'firstimpression',
  'fling', 'lastresort', 'metalburst', 'mirrorcoat', 'shelltrap', 'snore', 'suckerpunch', 'thunderclap',
]);

const inRange = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
const keyPattern = /^[a-z][a-z0-9.]*$/i;

export function validateStoryBossProfile(profile, dex) {
  if (profile?.schema !== 1 || !keyPattern.test(profile.sceneKey || '') ||
      !inRange(profile.revision, 1, 9999) || (profile.foeSlot !== null && !inRange(profile.foeSlot, 0, 23)) ||
      !Array.isArray(profile.phases) || !profile.phases.length || profile.phases.length > 4 ||
      (profile.openingWeather && !['rain', 'sun'].includes(profile.openingWeather))) {
    throw new Error('Invalid Story boss profile.');
  }
  const ids = new Set();
  for (const rule of profile.phases) {
    const { id, trigger, effect, cue } = rule || {};
    const triggerValid = trigger && (
      (trigger.kind === 'hpCross' && inRange(trigger.percent, 1, 99)) ||
      (trigger.kind === 'turn' && inRange(trigger.completed, 1, 199)) ||
      (trigger.kind === 'cadence' && inRange(trigger.every, 3, 100)) ||
      (trigger.kind === 'allyKo' && inRange(trigger.count, 1, 23)) ||
      ['firstHit', 'disguiseBreak'].includes(trigger.kind)
    );
    const validMoves = moves => Array.isArray(moves) && moves.length <= 8 &&
      moves.every(move => /^[a-z][a-z0-9]*$/.test(move) && (!dex || dex.moves.get(move).exists));
    const effectValid = effect && (
      (GUARDS.has(effect.kind) && inRange(effect.completedTurns, 1, 4) &&
        inRange(effect.reductionPercent, 1, 75) &&
        (effect.kind !== 'categoryWard' || CATEGORIES.has(effect.fallbackCategory))) ||
      (effect.kind === 'move' && validMoves(effect.moves) &&
        (!effect.followUp || validMoves(effect.followUp)) &&
        (!effect.when || ['rainDisplaced', 'noTrickRoom'].includes(effect.when)) &&
        (!effect.fallback || ['attack', 'status'].includes(effect.fallback))) ||
      effect.kind === 'cue'
    );
    if (!keyPattern.test(id || '') || ids.has(id) || !triggerValid || !effectValid ||
        typeof cue !== 'string' || !cue.trim() || cue.length > 80) {
      throw new Error(`Invalid Story boss phase: ${id || '(missing)'}.`);
    }
    ids.add(id);
  }
}

function actorSlot(pokemon) {
  return pokemon?.classicSlot ?? pokemon?.side?.pokemon.indexOf(pokemon) ?? -1;
}

function isOwner(pokemon, profile) {
  return pokemon?.hp > 0 && (profile.foeSlot === null || actorSlot(pokemon) === profile.foeSlot);
}

function directAttack(target, source, move) {
  return target?.side.id === 'p2' && source?.side.id === 'p1' && move?.effectType === 'Move' &&
    CATEGORIES.has(move.category) && !move.flags?.futuremove && !move.ohko;
}

function busted(pokemon) {
  return !!pokemon?.abilityState?.busted && ['mimikyubusted', 'mimikyubustedtotem'].includes(pokemon.species.id);
}

function emit(battle, stage, phase, text) {
  const plain = value => String(value || '').replace(/[|\r\n]/g, ' ');
  const meta = JSON.stringify({ id: phase.id, status: phase.status, ownerSlot: phase.ownerSlot,
    ...(phase.category ? { category: phase.category } : {}),
    ...(phase.moveId ? { moveId: phase.moveId } : {}),
    ...(phase.remainingTurns ? { remainingTurns: phase.remainingTurns } : {}) });
  battle.add('boss-phase', stage, plain(phase.cue), phase.kind, plain(text), meta.replace(/\|/g, '\\u007c'));
}

function selectedMove(battle, actor, moves, fallback) {
  if (battle.requestState !== 'move' || actor?.volatiles.dynamax) return null;
  const request = actor.side.activeRequest;
  const activeMoves = request?.active?.[0]?.moves;
  if (request?.wait || !activeMoves) return null;
  const available = activeMoves.filter(entry => !entry.disabled && entry.pp > 0);
  for (const move of moves) {
    const allowed = available.find(entry => entry.id === move);
    if (allowed) return allowed.id;
  }
  return available.find(entry => {
    const move = battle.dex.moves.get(entry.id);
    if (fallback === 'attack') return CATEGORIES.has(move.category) && move.basePower > 0 &&
      !move.flags?.futuremove && !move.flags?.charge && !move.flags?.recharge &&
      !CONDITIONAL_ATTACKS.has(move.id) && !['struggle', 'recharge', 'fight'].includes(move.id);
    return fallback === 'status' && move.category === 'Status' && !['splash', 'memento', 'healingwish', 'lunardance'].includes(move.id);
  })?.id || null;
}

function scriptAllowed(battle, when) {
  if (when === 'rainDisplaced') return !battle.field.isWeather('raindance');
  if (when === 'noTrickRoom') return !battle.field.getPseudoWeather('trickroom');
  return true;
}

function dismiss(battle, phase, stage, text) {
  phase.status = 'expired';
  emit(battle, stage, phase, text);
  battle.classicBoss.story.phases = battle.classicBoss.story.phases.filter(current => current !== phase);
}

function openTurn(battle, profile) {
  const story = battle.classicBoss.story;
  const actor = battle.p2.active[0];
  if (!isOwner(actor, profile) || story.turn?.number === battle.turn) return;
  const slot = actorSlot(actor);
  story.turn = { number: battle.turn, slot, hp: actor.hp, maxHp: actor.maxhp, busted: busted(actor), lastCategory: null };
  for (const phase of [...story.phases]) {
    if (phase.kind === 'move' || phase.status !== 'pending') continue;
    if (phase.ownerSlot !== slot) {
      dismiss(battle, phase, 'expire', 'The guard no longer applies.');
      continue;
    }
    phase.status = 'active';
    emit(battle, 'activate', phase, phase.category
      ? `${actor.name} braces against ${phase.category} attacks.`
      : `${actor.name} raises a guard against the next direct hit.`);
  }
}

function phaseTriggered(battle, rule, actor, turn) {
  const trigger = rule.trigger;
  const sameActor = turn?.slot === actorSlot(actor);
  switch (trigger.kind) {
  case 'hpCross':
    return sameActor && turn.hp * 100 > turn.maxHp * trigger.percent &&
      actor.hp * 100 <= actor.maxhp * trigger.percent;
  case 'firstHit':
    return sameActor && !!turn.lastCategory;
  case 'disguiseBreak':
    return sameActor && !turn.busted && busted(actor);
  case 'turn':
    return battle.turn === trigger.completed;
  case 'cadence':
    return (battle.turn + 1) % trigger.every === 0;
  case 'allyKo':
    return battle.p2.pokemon.filter(mon => mon.hp === 0).length >= trigger.count;
  }
}

function queueScript(battle, actor, rule, followUp) {
  const story = battle.classicBoss.story;
  if (story.phases.some(phase => phase.kind === 'move')) return;
  const { effect } = rule;
  if (!scriptAllowed(battle, effect.when)) return;
  const moveId = selectedMove(battle, actor, effect.moves, effect.fallback);
  if (!moveId) {
    emit(battle, 'cue', { id: rule.id, cue: rule.cue, kind: 'cue', ownerSlot: actorSlot(actor) },
      `${actor.name} continues with its usual tactics.`);
    return;
  }
  const phase = { id: rule.id, cue: rule.cue, kind: 'move', status: 'pending',
    ownerSlot: actorSlot(actor), moveId, ...(effect.when ? { when: effect.when } : {}), followUp };
  story.phases.push(phase);
  const move = battle.dex.moves.get(moveId);
  const hint = moveId === 'solarbeam' ? ' Strong sunlight can let it strike without charging.' : '';
  emit(battle, 'telegraph', phase, `${actor.name} is preparing to use ${move.name} next turn.${hint}`);
}

function queuePhase(battle, actor, rule, turn) {
  const story = battle.classicBoss.story;
  const { effect } = rule;
  const phase = { id: rule.id, cue: rule.cue, kind: effect.kind, status: 'pending', ownerSlot: actorSlot(actor) };
  if (effect.kind === 'move') {
    queueScript(battle, actor, rule, effect.followUp ? { moves: effect.followUp } :
      (rule.trigger.kind === 'cadence' ? { moves: [], fallback: 'status' } : null));
  } else if (effect.kind === 'cue') {
    emit(battle, 'cue', phase, rule.trigger.kind === 'disguiseBreak'
      ? `${actor.name}'s costume has come apart.` : `${actor.name} changes its stance.`);
  } else {
    const category = effect.kind === 'categoryWard' ? turn?.lastCategory || effect.fallbackCategory : null;
    Object.assign(phase, { category, remainingTurns: effect.completedTurns, reductionPercent: effect.reductionPercent });
    story.phases.push(phase);
    const turnText = `${effect.completedTurns} turn${effect.completedTurns === 1 ? '' : 's'}`;
    const detail = category
      ? `It takes ${effect.reductionPercent}% less damage from ${category} attacks for ${turnText}. Change category, prepare, or keep attacking.`
      : `It takes ${effect.reductionPercent}% less damage from the next direct hit. The guard lasts up to ${turnText}.`;
    emit(battle, 'telegraph', phase, `${actor.name} prepares a guard. ${detail}`);
  }
}

export function attachStoryBossProfile(battle, profile) {
  validateStoryBossProfile(profile, battle.dex);
  const story = battle.classicBoss.story ??= { turn: null, fired: {}, phases: [] };
  const format = battle.format;
  if (profile.openingWeather) {
    const onBattleStart = format.onBattleStart;
    format.onBattleStart = function () {
      onBattleStart?.call(this);
      const rain = profile.openingWeather === 'rain';
      const weather = rain ? 'raindance' : 'sunnyday';
      if (this.field.isWeather(weather) || this.field.setWeather(weather, this.p2.pokemon[0], format)) {
        this.field.weatherState.duration = 0;
        this.classicBoss.weatherLocked = true;
        emit(this, 'field', { id: 'openingWeather', cue: rain ? 'PRIMORDIAL RAIN' : 'PRIMAL HEAT',
          kind: 'weather', ownerSlot: actorSlot(this.p2.pokemon[0]) },
          rain ? 'The boss opens with rain.' : 'The boss opens with harsh sunlight.');
      }
    };
  }
  battle.onEvent('BeforeTurn', format, 100, function () {
    openTurn(this, profile);
  });
  battle.onEvent('Damage', format, 30, function (damage, target, source, move) {
    if (!(damage > 0) || !directAttack(target, source, move)) return;
    const ward = story.phases.find(phase => GUARDS.has(phase.kind) && phase.status === 'active' &&
      actorSlot(target) === phase.ownerSlot && (!phase.category || phase.category === move.category));
    if (ward) return Math.max(1, Math.floor(damage * (100 - ward.reductionPercent) / 100));
  });
  battle.onEvent('DamagingHit', format, 100, function (damage, target, source, move) {
    if (!(damage > 0) || !directAttack(target, source, move) || story.turn?.slot !== actorSlot(target)) return;
    story.turn.lastCategory = move.category;
    const ward = story.phases.find(phase => phase.kind === 'nextHitWard' && phase.status === 'active' &&
      phase.ownerSlot === actorSlot(target));
    if (ward) dismiss(this, ward, 'expire', `${target.name}'s ward is spent.`);
  });
  const endTurn = battle.endTurn;
  Object.defineProperty(battle, 'endTurn', {
    configurable: true,
    value() {
      const actor = this.p2.active[0];
      const finishedTurn = this.turn;
      const triggerTurn = story.turn;
      const available = finishedTurn && !this.ended && isOwner(actor, profile);
      const ready = available ? profile.phases.filter(rule =>
        (rule.trigger.kind === 'cadence' || !story.fired[rule.id]) && phaseTriggered(this, rule, actor, triggerTurn)) : [];
      const followUps = [];
      for (const phase of [...story.phases]) {
        if (phase.kind === 'move') {
          if (available && phase.committed && phase.followUp && phase.ownerSlot === actorSlot(actor)) {
            followUps.push({ id: `${phase.id}.recovery`, cue: 'RECOVERY TURN', effect: { kind: 'move', ...phase.followUp } });
          }
          if (!phase.committed && phase.status === 'pending') {
            dismiss(this, phase, 'interrupted', 'The announced move could not be made.');
          } else {
            story.phases = story.phases.filter(current => current !== phase);
          }
        } else if (phase.status === 'active' &&
            (!available || actorSlot(actor) !== phase.ownerSlot || --phase.remainingTurns <= 0)) {
          dismiss(this, phase, 'expire', 'The guard has worn off.');
        }
      }
      const result = endTurn.call(this);
      const next = this.p2.active[0];
      if (this.ended || !available || !isOwner(next, profile)) return result;
      for (const rule of ready) {
        story.fired[rule.id] = true;
        queuePhase(this, next, rule, triggerTurn);
      }
      for (const rule of followUps) queueScript(this, next, rule, null);
      return result;
    },
  });
}

export function plannedStoryBossMove(battle, request) {
  if (request.phase !== 'move' || battle.ended) return null;
  const phase = battle.classicBoss?.story?.phases.find(item => item.kind === 'move' && item.status === 'pending');
  const actor = battle.p2.active[0];
  if (!phase || actorSlot(actor) !== phase.ownerSlot || actor?.volatiles.dynamax || !scriptAllowed(battle, phase.when)) return null;
  return request.moves.find(move => move.id === phase.moveId && !move.disabled && !move.forced && move.pp !== 0) || null;
}

export function noteStoryBossChoice(battle, request, action) {
  const move = plannedStoryBossMove(battle, request);
  if (!move || action.kind !== 'move' || action.transform || action.slot !== move.slot) return;
  const phase = battle.classicBoss.story.phases.find(item => item.kind === 'move' && item.moveId === move.id);
  phase.committed = true;
  phase.status = 'active';
  return phase;
}

export function storyBossProfileView(battle, profile) {
  const phases = battle.ended ? [] : battle.classicBoss.story.phases.map(phase => ({
    id: phase.id, cue: phase.cue, kind: phase.kind, status: phase.status, ownerSlot: phase.ownerSlot,
    ...(phase.category ? { category: phase.category } : {}),
    ...(phase.moveId ? { moveId: phase.moveId, moveName: battle.dex.moves.get(phase.moveId).name } : {}),
    ...(phase.remainingTurns ? { remainingTurns: phase.remainingTurns, reductionPercent: phase.reductionPercent } : {}),
  }));
  return { profile: { sceneKey: profile.sceneKey, revision: profile.revision }, phases };
}
