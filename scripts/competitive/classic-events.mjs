import { explain } from './arena-simulation.mjs';

const sideOf = name => /^(p[12])(?:[a-z]?: |$)/.exec(name)?.[1] || null;

export function describeBattleLog(protocol, appearances, dex) {
  const [, tag, name = '', detail = '', target = '', message = '', metadata = ''] = protocol.split('|');
  if (tag === 'boss-phase') {
    let state = {};
    if (metadata) {
      try { state = JSON.parse(metadata); } catch { /* Old and malformed events still have readable text. */ }
    }
    return {
      kind: 'boss', text: message, tag, side: 'p2', subject: '', detail: target, targetSide: null,
      boss: { phase: name, banner: detail, effect: target, ...state },
    };
  }
  const side = sideOf(name);
  const subject = name.replace(/^p[12][a-z]?: /, '');
  const label = detail.replace(/^(ability|item|move): /, '');
  let event;
  if (tag === 'win') {
    event = { kind: 'result', text: `${subject} won the battle.` };
  } else {
    event = explain(protocol, appearances, dex);
  }
  if (!event) {
    const text = supplementalText(tag, subject, detail, label);
    if (!text) return null;
    event = { kind: 'effect', text };
  }
  return { ...event, tag, side, subject, detail, targetSide: sideOf(target) };
}

function supplementalText(tag, subject, detail, label) {
  switch (tag) {
  case '-ability': return label && `${subject}'s ${label} activated.`;
  case '-item': return label && `${subject} acquired ${label}.`;
  case '-enditem': return label && `${subject} lost ${label}.`;
  case '-start': return label && `${subject} gained ${label}.`;
  case '-end': return label && `${subject} lost ${label}.`;
  case '-activate': return label && `${subject}'s ${label} took effect.`;
  case '-block': return label && `${subject} blocked the move with ${label}.`;
  case '-prepare': return label && `${subject} prepared ${label}.`;
  case '-notarget': return `${subject}'s move had no target.`;
  case '-sidestart': return label && `${label} took effect.`;
  case '-sideend': return label && `${label} wore off.`;
  case '-fieldend': return subject && `${subject.replace(/^move: /, '')} ended.`;
  case '-formechange': return detail && `${subject} changed form.`;
  case '-zpower': return `${subject} drew on its Z-Power!`;
  case '-transform': return `${subject} transformed into ${detail.replace(/^p[12][a-z]?: /, '')}.`;
  default: return null;
  }
}
