import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import policies from '../battle-move-profiles.js';

const moves = JSON.parse(readFileSync(new URL('../data/moves.json', import.meta.url), 'utf8'))[9];
const normalize = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');

// Compare the profile inputs to drawing. Color, sound, names, hit counts,
// outcomes, and notes that don't drive drawing are excluded from this audit.
export function motionSignature(profile, timing = true) {
  const fields = [profile.family, profile.target, profile.path, profile.shape, profile.pose, profile.impact, profile.count];
  if (timing) fields.push(profile.timing);
  return JSON.stringify(fields);
}

function inventory(entries, timing) {
  const profilesBySignature = new Map();
  for (const profile of entries) {
    const key = motionSignature(profile, timing);
    if (!profilesBySignature.has(key)) profilesBySignature.set(key, []);
    profilesBySignature.get(key).push(profile);
  }
  const shared = [...profilesBySignature.values()].filter(group => group.length > 1).map(group => {
    const sample = group[0];
    const concepts = new Set(group.map(entry => normalize(moves[entry.id]?.realMove || entry.id)));
    return {
      count: group.length,
      variantsOfOneMove: concepts.size === 1,
      family: sample.family, target: sample.target, path: sample.path, shape: sample.shape, pose: sample.pose,
      moves: group.map(entry => moves[entry.id]?.name || entry.id),
    };
  }).sort((a, b) => b.count - a.count || a.moves[0].localeCompare(b.moves[0]));
  return {
    signatures: profilesBySignature.size,
    sharedIds: shared.reduce((total, group) => total + group.count, 0),
    largestGroup: shared[0]?.count || 1,
    shared,
  };
}

export function auditMoveProfiles() {
  const entries = Object.keys(moves).map(id => policies.get(id));
  return {
    ids: entries.length,
    authored: entries.filter(profile => profile.authored).length,
    generated: entries.filter(profile => profile.source === 'generated').length,
    missing: entries.filter(profile => profile.source === 'fallback').map(profile => profile.id),
    motionAndTiming: inventory(entries, true),
    motionOnly: inventory(entries, false),
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const audit = auditMoveProfiles();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(audit, null, 2));
  } else {
    console.log(audit.ids + ' canonical IDs, ' + audit.authored + ' authored, ' + audit.generated + ' generated.');
    for (const [label, inventory] of Object.entries({ 'Motion plus rhythm': audit.motionAndTiming, 'Motion only': audit.motionOnly })) {
      console.log(label + ': ' + inventory.signatures + ' signatures, ' + inventory.sharedIds + ' IDs in shared groups.');
      for (const group of inventory.shared.slice(0, 6)) {
        console.log('  ' + group.count + (group.variantsOfOneMove ? ' (typed variants)' : '') + ' · ' + group.moves.join(', '));
      }
    }
    if (audit.missing.length) console.error('Missing pins: ' + audit.missing.join(', '));
  }
  if (audit.missing.length) process.exitCode = 1;
}
