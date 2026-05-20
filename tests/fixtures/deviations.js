// Programmatic skip lists for property tests.
// Human-readable rationale lives in /tests/reports/deviations.md.
// Each entry MUST be cross-referenced in that file before being added here.

export const skipMoves = {
  // Final Gambit damage = user's own HP; user faints. Not a normal damaging move.
  'damaging-nonzero': ['Final Gambit'],

  // These do not deal damage in the normal sense but report HP delta:
  // - Pain Split equalizes HP
  // - Endeavor sets target HP = user HP
  // - Final Gambit damage = user HP
  // The status-no-damage invariant treats them as ok-to-touch HP.
  'status-no-damage': ['Pain Split', 'Endeavor', 'Final Gambit'],

  // OHKO moves (Fissure, Horn Drill, Guillotine, Sheer Cold) deal full HP
  // when they hit but have low accuracy. Damaging-nonzero is fine. Damage
  // formula tests should not assert specific damage numbers for them.
  'damage-formula': ['Fissure', 'Horn Drill', 'Guillotine', 'Sheer Cold'],

  // Counter / Mirror Coat / Metal Burst depend on prior turn state. Property
  // tests cannot easily set up the prior-damage condition; skip from generic
  // damage assertions.
  'damaging-nonzero-no-context': ['Counter', 'Mirror Coat', 'Metal Burst', 'Bide'],
};

// Mechanics that intentionally diverge from VGC. Tests must NOT run with
// state.mode === 'story' or with these flags set unless explicitly testing them.
export const storyOnlyFlags = [
  '_glassCannonPact',
  '_typeAmplifierType',
];
