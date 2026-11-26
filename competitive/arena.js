import { ArenaBattleClient } from './arena-client.js';

const client = new ArenaBattleClient();
const $ = id => document.getElementById(id);
const statusNames = { brn: 'Burned', frz: 'Frozen', par: 'Paralyzed', psn: 'Poisoned', tox: 'Badly poisoned', slp: 'Asleep' };
const matchMessages = {
  preview: 'Choose your lead',
  move: 'Choose an action',
  replace: 'Send in a Pokémon',
  wait: 'Waiting for the opponent',
  ended: 'Battle complete',
};
const results = { win: 'You win', loss: 'Arena AI wins', draw: 'Match drawn' };
const modernRoster = [$('setup-player').textContent, $('setup-opponent').textContent];
const historicalRoster = ['Snorlax, Starmie, Gengar', 'Alakazam, Zapdos, Rhydon'];
const modernReserves = ['Primarina, Kingambit, Rillaboom', 'Iron Valiant, Ting-Lu, Cinderace'];
const historicalReserves = ['Tauros, Exeggutor, Jolteon', 'Lapras, Chansey, Dragonite'];
const stadiumFormat = 'gen8battlestadiumsingles';
let view;
let busy = false;
let matchEpoch = 0;
let activeMotion;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const pacing = { normal: 1, fast: .5, instant: 0 };
const motionBreaks = new Set(['move', 'switch', 'drag', 'replace', 'cant', 'turn', 'win', 'tie']);
const settingsKey = 'pbs_settings';

function sharedSettings() {
  try { return JSON.parse(localStorage.getItem(settingsKey) || '{}') || {}; }
  catch { return {}; }
}

const speed = $('arena-speed');
const initialSettings = sharedSettings();
speed.value = Object.hasOwn(pacing, initialSettings.battleSpeed) ? initialSettings.battleSpeed : 'normal';
const motionRate = () => document.hidden || motionPreference.matches || initialSettings.animations === false ? 0 : pacing[speed.value];
const stopMotion = () => activeMotion?.stop();
speed.addEventListener('change', () => {
  try { localStorage.setItem(settingsKey, JSON.stringify({ ...sharedSettings(), battleSpeed: speed.value })); }
  catch { /* Settings remain usable for this session. */ }
  if (!motionRate()) stopMotion();
});
motionPreference.addEventListener('change', () => { if (!motionRate()) stopMotion(); });
$('arena-skip-motion').addEventListener('click', stopMotion);
window.addEventListener('pagehide', stopMotion);

function element(tag, options = {}) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text) node.textContent = options.text;
  return node;
}

function combatant(root, label, reverse) {
  const stage = element('div', { className: 'sprite-stage' });
  const image = element('img');
  image.alt = '';
  image.decoding = 'async';
  const placeholder = element('p', { className: 'sprite-placeholder' });
  const spriteDir = reverse ? 'gen5ani-back' : 'gen5ani';
  const fallback = '../sprites/placeholder.svg';
  let sprite = '';
  const revealReadySprite = () => {
    if (!sprite || image.currentSrc !== image.src || !image.naturalWidth) return;
    image.hidden = false;
    placeholder.hidden = true;
  };
  image.addEventListener('load', revealReadySprite);
  image.addEventListener('error', () => {
    if (!sprite) return;
    const requested = image.getAttribute('src');
    if (reverse && requested === `../sprites/${spriteDir}/${sprite}.gif`) {
      image.src = `../sprites/gen5ani/${sprite}.gif`;
    } else if (requested !== fallback) {
      image.src = fallback;
    }
  });
  stage.append(image, placeholder);
  const card = element('div', { className: 'combatant-card' });
  const name = element('p', { className: 'combatant-name' });
  const detail = element('div', { className: 'combatant-sub' });
  const health = element('div', { className: 'health' });
  const meter = element('meter');
  meter.min = 0;
  meter.max = 100;
  meter.low = 25;
  meter.high = 50;
  meter.optimum = 75;
  meter.setAttribute('aria-label', `${label} Pokémon HP`);
  const value = element('span');
  health.append(meter, value);
  card.append(element('p', { className: 'combatant-label', text: label }), name, detail, health);
  root.append(stage, card);
  return (team, phase) => {
    const mon = team.find(member => member.active && !member.fainted);
    const preview = phase === 'preview';
    const emptyLabel = phase === 'ended' ? (team.every(member => member.fainted) ? 'Team fainted' : 'Battle complete') : 'No active Pokémon';
    root.dataset.occupied = String(Boolean(mon));
    name.textContent = mon?.name || (preview ? 'Team preview' : emptyLabel);
    placeholder.textContent = mon?.name || (preview ? 'Awaiting lead' : '');
    const nextSprite = mon?.sprite || '';
    if (sprite !== nextSprite || !nextSprite) {
      image.hidden = true;
      placeholder.hidden = false;
      sprite = nextSprite;
      if (sprite) {
        image.src = `../sprites/${spriteDir}/${sprite}.gif`;
        revealReadySprite();
      } else {
        image.removeAttribute('src');
      }
    }
    health.hidden = !mon;
    meter.value = mon?.hpPercent ?? 0;
    value.textContent = `${meter.value}%`;
    const tags = (mon?.types || []).map(type => {
      const tag = element('span', { className: 'type-tag', text: type });
      tag.dataset.type = type.toLowerCase();
      return tag;
    });
    const status = mon?.fainted ? 'Fainted' : statusNames[mon?.status];
    if (status) tags.push(element('span', { className: 'combatant-status', text: status }));
    if (mon?.sizeForm) tags.push(element('span', { text: mon.sizeForm }));
    if (mon?.disguise) tags.push(element('span', { text: `Disguised as ${mon.disguise}` }));
    detail.replaceChildren(...tags);
  };
}

const showPlayer = combatant($('player-active'), 'Your side', true);
const showOpponent = combatant($('opponent-active'), 'Arena AI', false);
const arenaSide = side => $(side === 'p1' ? 'player-active' : 'opponent-active');

function logItem(event) {
  const item = element('li', { text: event.text });
  item.dataset.kind = event.kind;
  return item;
}

function drawPublicEvent(event) {
  if (event.text) {
    const log = $('battle-log');
    log.append(logItem(event));
    log.scrollTop = log.scrollHeight;
  }
  if (!event.side) return;
  const drawSide = event.side === 'p1' ? showPlayer : showOpponent;
  if (event.appearance) drawSide([event.appearance], 'move');
  else if (event.tag === 'faint') drawSide([], 'replace');
  else if (typeof event.hpPercent === 'number') {
    const root = arenaSide(event.side);
    root.querySelector('meter').value = event.hpPercent;
    root.querySelector('.health span').textContent = `${event.hpPercent}%`;
  }
}

async function playPresentation(next, owner) {
  const { BattleMotion, BattleMoveProfiles } = window;
  const events = next.presentation;
  if (!motionRate() || !BattleMotion || !BattleMoveProfiles || next.error || next.requestId === view?.requestId
    || !events?.some(event => event.tag === 'move' && event.side)) return;
  const valid = () => owner === matchEpoch && !$('match').hidden;
  const run = BattleMotion.createRun(document.querySelector('.battlefield'), { rate: motionRate, valid });
  activeMotion = run;
  const caption = $('arena-motion-caption');
  const skip = $('arena-skip-motion');
  skip.hidden = false;
  if ($('actions').contains(document.activeElement)) skip.focus({ preventScroll: true });
  $('reset').disabled = false;
  const anchor = side => {
    const stage = arenaSide(side).querySelector('.sprite-stage');
    return stage.querySelector('img:not([hidden])') || stage;
  };
  let cursor = 0;
  const renderThrough = last => {
    while (valid() && cursor <= last) drawPublicEvent(events[cursor++]);
  };
  try {
    while (valid() && run.usable() && cursor < events.length) {
      const move = events[cursor];
      if (move.tag !== 'move' || !move.side || !move.name) { renderThrough(cursor); continue; }
      const profile = BattleMoveProfiles.get(move.name, move.facts);
      const targetSide = ['self', 'ally', 'ally-side'].includes(profile.target) ? move.side
        : move.targetSide || (move.side === 'p1' ? 'p2' : 'p1');
      const start = cursor + 1;
      let end = start;
      while (end < events.length && !motionBreaks.has(events[end].tag)) end++;
      const effects = events.slice(start, end);
      const cues = effects.map(event => event.tag === '-heal' && event.protocol.split('|')[4]?.startsWith('[from] ')
        ? { ...event, tag: 'residual' } : event);
      const impact = BattleMotion.analyzeMove(cues, targetSide, profile.category);
      const from = anchor(move.side), to = anchor(targetSide);
      const hit = effects.length ? start + impact.index : start - 1;
      renderThrough(cursor);
      caption.textContent = move.text;
      await run.play(profile, { from, to, outcome: impact.outcome, onImpact: () => renderThrough(hit) });
      if (run.usable() && impact.hitIndices.length > 1) {
        const extraBeat = { ...profile, pose: 'still', timing: { windup: 0, travel: 0, impact: 60, settle: 0 } };
        for (const index of impact.hitIndices.filter(index => start + index > hit)) {
          if (!run.usable()) break;
          await run.play(extraBeat, { from, to, outcome: effects[index].tag === '-damage' ? 'hit' : 'decoy',
            onImpact: () => renderThrough(start + index) });
        }
      }
      if (run.usable()) renderThrough(end - 1);
    }
  } finally {
    run.stop();
    if (activeMotion === run) {
      activeMotion = null;
      skip.hidden = true;
      caption.textContent = '';
    }
  }
}

function announceError(id, message) {
  const box = $(id);
  box.hidden = !message;
  box.textContent = message || '';
}

function announceTeamError(message) {
  $('team-text').setAttribute('aria-invalid', String(Boolean(message)));
  $('team-text').setAttribute('aria-describedby', message ? 'team-import-help team-import-error' : 'team-import-help');
  announceError('team-import-error', message);
}

function actionButton(kind, slot, title, detail) {
  const button = element('button', { className: `action-button ${kind === 'move' ? 'move' : 'switch'}` });
  button.type = 'button';
  button.dataset.kind = kind;
  button.dataset.slot = String(slot);
  const hint = element('small');
  hint.append(...(Array.isArray(detail) ? detail : [detail]));
  button.append(element('strong', { text: title }), hint);
  const requestId = view.requestId;
  button.addEventListener('click', () => {
    void choose({ requestId, kind, slot, transform: kind === 'move' && $('battle-form-toggle').checked });
  });
  return button;
}

function roster(id, team) {
  $(id).replaceChildren(...team.map(mon => {
    const details = mon.fainted ? ' · Fainted' : mon.hpPercent === null ? '' : ` · ${mon.hpPercent}%`;
    const slot = element('li', { text: `${mon.name}${details}` });
    slot.dataset.active = String(mon.active);
    slot.dataset.fainted = String(mon.fainted);
    return slot;
  }));
}

function displayedMoves() {
  if (view?.phase !== 'move') return [];
  const transform = $('battle-form-toggle').checked;
  const requiresVariant = transform && ['zmove', 'dynamax'].includes(view.battleForm?.kind);
  return view.moves.map(move => ({
    ...move,
    ...(transform ? move.variant : null),
    disabled: requiresVariant ? !move.variant || move.variant.disabled : move.disabled,
  }));
}

function renderMoves() {
  $('moves').replaceChildren(...displayedMoves().map(move => {
    const detail = move.type ? [
      element('span', { className: 'move-button-type', text: move.type }),
      element('span', { className: 'move-button-category', text: move.category }),
    ] : move.effect;
    if (move.type && typeof move.pp === 'number') detail.push(element('span', { className: 'move-button-pp', text: `${move.pp}/${move.maxPp} PP` }));
    if (move.type && move.source) detail.push(element('span', { className: 'move-button-source', text: move.source }));
    const button = actionButton('move', move.slot, move.name, detail);
    if (move.type) button.dataset.type = move.type.toLowerCase();
    button.disabled = move.disabled;
    return button;
  }));
}

function openMoveGuide() {
  if (busy || view?.phase !== 'move') return;
  const guide = $('move-guide');
  const form = $('battle-form-toggle').checked ? view.battleForm : null;
  const formText = form?.kind === 'mega' ? `Mega Evolution · ${form.species}` : form?.label;
  $('move-guide-form').textContent = formText || '';
  $('move-guide-form').hidden = !formText;
  $('move-guide-weather').textContent = view.weather ? `Current weather · ${view.weather}` : '';
  $('move-guide-weather').hidden = !view.weather;
  $('move-guide-list').replaceChildren(...displayedMoves().map(move => {
    const card = element('section', { className: 'move-guide-card' });
    const summary = element('p', { className: 'move-guide-meta' });
    if (move.type) {
      const type = element('span', { className: 'type-tag', text: move.type });
      type.dataset.type = move.type.toLowerCase();
      summary.append(type, element('span', { text: move.category }));
    }
    const weather = view.weather?.toLowerCase();
    if (move.weatherPower) summary.append(element('span', { text: `Power ${move.weatherPower} in ${weather}` }));
    if (typeof move.power === 'number') summary.append(element('span', { text: `Base power ${move.power}` }));
    else if (move.power) summary.append(element('span', { text: move.power === 'Varies' ? 'Variable power' : move.power }));
    let accuracy = move.accuracy === true ? 'No accuracy check' : move.accuracy === null ? '' : `Accuracy ${move.accuracy}%`;
    if (move.weatherAccuracy === true || typeof move.weatherAccuracy === 'number') {
      summary.append(element('span', { text: move.weatherAccuracy === true ? `No accuracy check in ${weather}` : `Accuracy ${move.weatherAccuracy}% in ${weather}` }));
      accuracy = `Base accuracy ${move.accuracy}%`;
    }
    if (accuracy) summary.append(element('span', { text: accuracy }));
    if (move.disabled) summary.append(element('span', { text: 'Unavailable this turn' }));
    card.append(element('h3', { text: move.name }));
    if (summary.childElementCount) card.append(summary);
    if (move.source) card.append(element('p', { className: 'move-guide-effect', text: `From ${move.source}` }));
    if (move.effect) card.append(element('p', { className: 'move-guide-effect', text: move.effect }));
    return card;
  }));
  guide.showModal();
}

function draw(next, focus = true) {
  const sendOut = next.turn > 0 && (!view || view.phase === 'preview');
  view = next;
  $('setup').hidden = true;
  const match = $('match');
  match.hidden = false;
  match.dataset.sendOut = String(sendOut);
  match.dataset.motion = String(motionRate() > 0);
  match.dataset.result = next.result || '';
  match.dataset.weather = next.weather?.toLowerCase() || '';
  $('format-label').textContent = `${next.formatLabel}${next.format.endsWith('ou') ? ` · ${next.teamSize}v${next.teamSize}` : ''}`;
  $('match-seed').textContent = `Seed ${next.seed}`;
  $('field-weather').textContent = next.weather || '';
  $('field-weather').hidden = !next.weather;
  $('engine-note').textContent = `Powered by Pokémon Showdown · @pkmn/sim ${next.engineVersion}`;
  $('turn').textContent = next.turn ? `Turn ${next.turn}` : 'Team preview';
  $('actions').dataset.phase = next.phase;
  $('request-heading').textContent = results[next.result] || matchMessages[next.phase];
  announceError('battle-error', next.error);
  showPlayer(next.player, next.phase);
  showOpponent(next.opponent, next.phase);
  roster('player-team', next.player);
  roster('opponent-team', next.opponent);
  $('battle-form-option').hidden = next.phase !== 'move' || !next.battleForm;
  $('battle-form-toggle').disabled = false;
  $('battle-form-toggle').checked = false;
  $('battle-form-label').textContent = next.battleForm?.label || '';
  $('inspect-moves').hidden = next.phase !== 'move' || !next.moves.length;
  renderMoves();
  const kind = next.phase === 'preview' ? 'lead' : 'switch';
  const switches = next.phase === 'ended' ? [] : next.switches;
  $('switches').replaceChildren(...switches.map(slot => {
    const mon = next.player[slot];
    return actionButton(kind, slot, mon.name, kind === 'lead' ? `Lead · ${mon.types.join(' / ')}` : `Switch · ${mon.hpPercent}% HP`);
  }));
  $('result').hidden = !next.result;
  if (next.result) {
    const turns = next.turn;
    const left = next.player.filter(member => !member.fainted).length;
    const right = next.opponent.filter(member => !member.fainted).length;
    $('result-text').textContent = `${turns} turn${turns === 1 ? '' : 's'} · Pokémon left: you ${left}, Arena AI ${right}.`;
    $('request-heading').setAttribute('aria-describedby', 'result-text');
  } else {
    $('result-text').textContent = '';
    $('request-heading').removeAttribute('aria-describedby');
  }
  $('download-replay').hidden = !next.replay;
  $('reset').hidden = next.phase === 'ended';
  const log = $('battle-log');
  log.replaceChildren(...next.events.map(logItem));
  log.scrollTop = log.scrollHeight;
  if (focus) $('request-heading').focus({ preventScroll: true });
}

async function choose(action) {
  if (busy) return;
  const owner = matchEpoch;
  busy = true;
  $('actions').setAttribute('aria-busy', 'true');
  $('battle-form-toggle').disabled = true;
  $('inspect-moves').disabled = true;
  $('actions').querySelectorAll('.action-button').forEach(button => { button.disabled = true; });
  $('reset').disabled = true;
  try {
    const next = await client.choose(action);
    if (owner !== matchEpoch) return;
    try { await playPresentation(next, owner); }
    catch { /* A missing effect cannot block the simulator's confirmed result. */ }
    if (owner === matchEpoch) draw(next);
  } catch (error) {
    if (owner !== matchEpoch) return;
    draw(view, false);
    announceError('battle-error', error.message);
  } finally {
    if (owner === matchEpoch) unlockActions();
  }
}

function unlockActions() {
  busy = false;
  $('reset').disabled = false;
  $('inspect-moves').disabled = false;
  $('actions').removeAttribute('aria-busy');
}

$('setup-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  $('start').disabled = true;
  $('format').disabled = true;
  $('team-size').disabled = true;
  const teamText = $('team-text');
  teamText.disabled = true;
  $('loading').hidden = false;
  announceTeamError();
  announceError('setup-error');
  let errorTarget;
  const input = $('seed');
  const seed = input.value ? input.valueAsNumber : crypto.getRandomValues(new Uint32Array(1))[0];
  try {
    const format = $('format').value;
    const teamSize = format === stadiumFormat ? 3 : Number($('team-size').value);
    draw(await client.start({ seed, format, teamSize, teamText: teamText.value }));
  } catch (error) {
    if (error.invalidTeam) {
      $('team-import').open = true;
      announceTeamError(error.message);
      errorTarget = teamText;
    } else {
      announceError('setup-error', error.message);
      errorTarget = $('start');
    }
  } finally {
    busy = false;
    $('loading').hidden = true;
    $('start').disabled = false;
    $('format').disabled = false;
    $('team-size').disabled = false;
    teamText.disabled = false;
    errorTarget?.focus();
  }
});

function updateSetup() {
  const format = $('format');
  const stadium = format.value === stadiumFormat;
  const size = stadium ? 3 : Number($('team-size').value);
  const [player, opponent] = format.value === 'gen9ou' ? modernRoster : historicalRoster;
  const [playerReserve, opponentReserve] = format.value === 'gen9ou' ? modernReserves : historicalReserves;
  $('setup-player').textContent = $('team-text').value.trim() ? 'Imported team · Checked at start' : `${player}${size === 6 ? `, ${playerReserve}` : ''}`;
  $('setup-opponent').textContent = `${opponent}${size === 6 ? `, ${opponentReserve}` : ''}`;
  $('setup-intro').textContent = `${size}-on-${size} against the CPU with Showdown rules.`;
  $('team-import-help').textContent = `Paste ${size === 6 ? 'six' : 'three'} Pokémon from a Showdown export. Leave this blank to play with the preset.`;
  $('format-label').textContent = `${format.selectedOptions[0].textContent}${stadium ? '' : ` · ${size}v${size}`}`;
  $('format-rules').hidden = !stadium;
  $('team-size-choice').hidden = stadium;
  announceTeamError();
  announceError('setup-error');
}

$('format').addEventListener('change', updateSetup);
$('team-size').addEventListener('change', updateSetup);
$('team-text').addEventListener('input', updateSetup);
$('battle-form-toggle').addEventListener('change', renderMoves);
$('inspect-moves').addEventListener('click', openMoveGuide);
$('move-guide').addEventListener('close', () => $('inspect-moves').focus({ preventScroll: true }));

$('download-replay').addEventListener('click', () => {
  if (!view?.replay) return;
  const file = new Blob([JSON.stringify(view.replay, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = element('a');
  link.href = url;
  link.download = `arena-${view.format}-${view.seed}${view.teamSize === 6 ? '-6v6' : ''}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function reset() {
  if (busy && !activeMotion) return;
  matchEpoch++;
  stopMotion();
  activeMotion = null;
  $('arena-motion-caption').textContent = '';
  $('arena-skip-motion').hidden = true;
  unlockActions();
  client.close();
  view = null;
  $('setup').hidden = false;
  $('match').hidden = true;
  announceTeamError();
  announceError('setup-error');
  $('start').focus();
}
$('reset').addEventListener('click', reset);
$('play-again').addEventListener('click', reset);
