import { ArenaBattleClient } from './arena-client.js';

const client = new ArenaBattleClient();
const $ = id => document.getElementById(id);
const statusNames = { brn: 'Burned', frz: 'Frozen', par: 'Paralyzed', psn: 'Poisoned', tox: 'Badly poisoned', slp: 'Asleep' };
const matchMessages = {
  preview: ['Choose your lead', 'Your remaining Pokémon are available to switch in.'],
  move: ['Choose an action', 'Select a move or teammate to act.'],
  replace: ['Send in a Pokémon', 'Select a teammate to bring into battle.'],
  wait: ['Waiting for the opponent', ''],
  ended: ['Battle complete', ''],
};
const results = { win: 'You won the match.', loss: 'The Arena AI won the match.', draw: 'The match ended in a draw.' };
const modernRoster = [$('setup-player').textContent, $('setup-opponent').textContent];
const historicalRoster = ['Snorlax, Starmie, Gengar', 'Alakazam, Zapdos, Rhydon'];
const modernReserves = ['Primarina, Kingambit, Rillaboom', 'Iron Valiant, Ting-Lu, Cinderace'];
const historicalReserves = ['Tauros, Exeggutor, Jolteon', 'Lapras, Chansey, Dragonite'];
const stadiumFormat = 'gen8battlestadiumsingles';
let view;
let busy = false;

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
  const placeholder = element('p', { className: 'sprite-placeholder' });
  image.addEventListener('error', () => {
    image.hidden = true;
    placeholder.hidden = false;
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
    name.textContent = mon?.name || (preview ? 'Team preview' : emptyLabel);
    placeholder.textContent = mon?.name || (preview ? 'Awaiting lead' : '');
    if (!mon) {
      image.hidden = true;
      placeholder.hidden = false;
    } else {
      const src = `../sprites/${reverse ? 'gen5ani-back' : 'gen5ani'}/${mon.sprite}.gif`;
      const changed = image.getAttribute('src') !== src;
      if (changed) image.src = src;
      if (changed || (image.complete && image.naturalWidth > 0)) {
        image.hidden = false;
        placeholder.hidden = true;
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
    if (status) tags.push(element('span', { text: status }));
    if (mon?.sizeForm) tags.push(element('span', { text: mon.sizeForm }));
    if (mon?.disguise) tags.push(element('span', { text: `Disguised as ${mon.disguise}` }));
    detail.replaceChildren(...tags);
  };
}

const showPlayer = combatant($('player-active'), 'Your side', true);
const showOpponent = combatant($('opponent-active'), 'Arena AI', false);

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
    const pp = typeof move.pp === 'number' ? ` · ${move.pp}/${move.maxPp} PP` : '';
    const source = move.source ? `${move.source} · ` : '';
    const detail = move.type ? [`${source}${move.type}`, element('span', { className: 'move-button-category', text: ` · ${move.category}` }), pp] : move.effect;
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
  view = next;
  $('setup').hidden = true;
  $('match').hidden = false;
  $('format-label').textContent = `${next.formatLabel}${next.format.endsWith('ou') ? ` · ${next.teamSize}v${next.teamSize}` : ''}`;
  $('match-seed').textContent = `Seed ${next.seed}`;
  $('field-weather').textContent = next.weather || '';
  $('field-weather').hidden = !next.weather;
  $('engine-note').textContent = `Powered by Pokémon Showdown · @pkmn/sim ${next.engineVersion}`;
  $('turn').textContent = next.turn ? `Turn ${next.turn}` : 'Team preview';
  const [heading, instructions] = matchMessages[next.phase];
  $('actions').dataset.phase = next.phase;
  $('request-heading').textContent = heading;
  $('action-copy').textContent = instructions;
  $('action-copy').hidden = !instructions;
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
  $('result-text').textContent = results[next.result] || '';
  $('reset').hidden = next.phase === 'ended';
  const log = $('battle-log');
  log.replaceChildren(...next.events.map(event => {
    const item = element('li', { text: event.text });
    item.dataset.kind = event.kind;
    return item;
  }));
  log.scrollTop = log.scrollHeight;
  if (focus) $('request-heading').focus({ preventScroll: true });
}

async function choose(action) {
  if (busy) return;
  busy = true;
  $('actions').setAttribute('aria-busy', 'true');
  $('battle-form-toggle').disabled = true;
  $('inspect-moves').disabled = true;
  $('actions').querySelectorAll('.action-button').forEach(button => { button.disabled = true; });
  $('reset').disabled = true;
  try {
    draw(await client.choose(action));
  } catch (error) {
    draw(view, false);
    announceError('battle-error', error.message);
  } finally {
    busy = false;
    $('reset').disabled = false;
    $('inspect-moves').disabled = false;
    $('actions').removeAttribute('aria-busy');
  }
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
  $('setup-intro').textContent = `Play a ${size}-on-${size} battle against the Arena AI using Pokémon Showdown rules.`;
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
  if (busy) return;
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
