// The Player Agent — models a real player's prep -> fight -> adapt loop (§2.4a).
//
// Maintains the persistent player team as sm.team (spec list of {name, build, id}); battles
// rebuild the mons fresh each time via buildPokemon (HP resets anyway). The three policies
// (casual/recommended/optimal) vary only the PREP investment: how much the agent trains (EVs),
// tutors, evolves, catches for coverage, and re-preps after a loss. Battle skill is constant.
//
// Faithfulness: builds go through the real makeBuild + _storyBuildTierForProfessor +
// _storyDowngradeBuildForTier path (professor parity); EV training uses the real
// _distributeEVsToTotal toward the real _storyEvTotalForCity band. Player builds NEVER carry
// _storyStatMult (foe-only).

let _idCounter = 1;
function nextId() { return `sim_${_idCounter++}`; }

export class PlayerAgent {
  constructor(E, policy, opts = {}) {
    this.E = E;
    this.S = E.window.__storySim;
    this.T = E.window.__storyTest;
    this.engine = E.engine;
    this.policy = policy;
    this.difficulty = opts.difficulty || 'normal';
    this._runSeed = (opts.runSeed >>> 0) || 1;
    this._rngTick = 0;
    this._typesSeen = new Set();       // team offensive/defensive type coverage tracker
    this._trainCost = 0;               // cumulative gold spent on training (telemetry)
    this._catchCount = 0;
    this._evolveCount = 0;
    this._adaptCount = 0;
    this._goldSpent = 0;        // real gold deducted for evolution + training
    this._blockedEvolve = 0;    // evolutions the player wanted but couldn't afford (economy stress)
    this._blockedTrain = 0;
    this._evolveCost = (this.S && this.S.EVOLVE_COST_BY_TARGET) || { 1: 12000, 2: 6000, 3: 3000 };
    this._evPerMonCost = 500;   // vitamin-equivalent per trained mon per city (economy model)
    this._buildEvoForwardMap();
  }

  // Budget: never spend below the policy's gold reserve.
  _canSpend(cost) { return (this.sm.gold - Math.round(this.sm.gold * this.policy.reserveFrac)) >= cost; }
  _spend(cost) { this.sm.gold = Math.max(0, this.sm.gold - cost); this._goldSpent += cost; }
  _grade(name) { try { return this.engine.getMonGrade(name, this.engine.getBST(name)); } catch (e) { return 4; } }

  get sm() { return this.S.sm; }

  // Seed BOTH RNG streams deterministically before an agent decision, so the agent's stochastic
  // choices (catching via rollWildEncounter, makeBuild) are reproducible per run seed and do NOT
  // depend on how many RNG draws the interleaved battles consumed. Each call advances _rngTick so
  // successive prep phases get distinct-but-deterministic streams.
  _seedAgentRng(pos) {
    const s = (this._runSeed ^ ((pos | 0) * 2654435761) ^ (this._rngTick++ * 40503)) >>> 0;
    try { this.E.seedRng(s); } catch (e) {}
    try { this.sm._strngState = (s ^ 0x9E3779B9) >>> 0; } catch (e) {}
  }

  // --- evolution (headless-safe: _getEvoChainForward needs the stubbed Dex, so walk baseStats) --
  _buildEvoForwardMap() {
    this._evoFwd = new Map();          // prevoName -> [evolvedName, ...]
    const base = this.T && this.T.baseStats;
    if (!base) return;
    for (const name of Object.keys(base)) {
      const prevo = base[name] && base[name].prevo;
      if (prevo && base[prevo]) {
        if (!this._evoFwd.has(prevo)) this._evoFwd.set(prevo, []);
        this._evoFwd.get(prevo).push(name);
      }
    }
  }
  _bst(name) { try { return this.engine.getBST(name); } catch (e) { return 0; } }
  _stageOf(name) { try { return this.S.STORY_EVENTS_RAW && this.T.storyEvoStageOf ? this.T.storyEvoStageOf(name) : 0; } catch (e) { return 0; } }
  _playerEvoCap(city) { const c = city | 0; if (c <= 1) return 0; if (c <= 3) return 1; return 2; }
  // Evolve `name` forward as far as the stage cap allows, preferring the strongest in-gen branch.
  _evolveForward(name, capStage) {
    const sg = new Set(this.S.storySettingsGens ? this.S.storySettingsGens() : [1,2,3,4,5,6,7,8,9]);
    let cur = name, guard = 0;
    while (guard++ < 4) {
      if (this._stageOf(cur) >= capStage) break;
      const evos = this._evoFwd.get(cur);
      if (!evos || !evos.length) break;
      // prefer in-gen options, then highest BST
      const base = this.T.baseStats;
      let pool = evos.filter(n => base[n] && sg.has(base[n].gen));
      if (!pool.length) pool = evos.slice();
      pool.sort((a, b) => this._bst(b) - this._bst(a));
      const nextForm = pool[0];
      if (!nextForm || nextForm === cur) break;
      if (this._stageOf(nextForm) > capStage) break; // don't overshoot the cap
      cur = nextForm;
    }
    return cur;
  }

  // --- team helpers -------------------------------------------------------------------------
  _cityForRow(pos) { try { return this.S.cityIndexForStoryRow(this.S.STORY_EVENTS_RAW[pos][0]); } catch (e) { return 0; } }
  _maxParty() { try { return this.S.storyMaxPartySize(); } catch (e) { return Math.max(2, Math.min(6, 2 + (this.sm.badges | 0))); } }

  // Build a story-tier player build for a species at (city, badges), trained per policy.
  _makeStoryBuild(species, city, badges, opts = {}) {
    const S = this.S, T = this.T;
    const tier = S.storyBuildTierForProfessor(city, badges);
    const build = S.makeBuild(species);
    try {
      if (tier < S.STORY_BUILD_TIER.TOURNAMENT) S.storyDowngradeBuildForTier(species, build, tier);
    } catch (e) {}
    build.powerTier = tier;
    delete build._storyStatMult; // player builds are never foe-scaled
    // EV training toward the city band, scaled by policy investment (gated by the caller on gold).
    const doTrain = opts.train !== undefined ? opts.train : this.policy.train.evTrain;
    if (doTrain && this.policy.train.evTargetFrac > 0) {
      try {
        let band = 508;
        try { band = S.STORY_EVENTS_RAW && T && T.storyEvTotalForCity ? T.storyEvTotalForCity(city, 0) : 508; } catch (e) {}
        const total = Math.max(0, Math.min(508, Math.round(band * this.policy.train.evTargetFrac)));
        const base = (T && T.baseStats) ? T.baseStats[species] : null;
        if (base && T.distributeEVsToTotal) {
          T.distributeEVsToTotal(build, base, total);
          this._trainCost += Math.round(total * 2); // rough vitamin-equivalent spend, telemetry only
        }
      } catch (e) {}
    }
    return build;
  }

  // Pick a species to "catch" for the team. Coverage-aware for recommended/optimal, else random.
  _pickCatchSpecies(city, badges) {
    const S = this.S;
    const sg = S.storySettingsGens();
    // Use the real wild pool as the catch source (faithful to what's actually encounterable).
    let candidates = [];
    const tries = this.policy.catch.coverageOnly ? 6 : 2;
    for (let i = 0; i < tries; i++) {
      try {
        const w = this.T.rollWildEncounter ? this.T.rollWildEncounter(sg) : null;
        const name = w && (w.name || (w.build && w.species) || w.species);
        if (name) candidates.push(name);
      } catch (e) {}
    }
    if (!candidates.length) return null;
    if (!this.policy.catch.coverageOnly) return candidates[0];
    // Coverage: prefer a candidate whose types are new to the team.
    let best = candidates[0], bestNew = -1;
    for (const name of candidates) {
      try {
        const mon = S.buildPokemon(name, S.makeBuild(name));
        const t = [mon.type1, mon.type2].filter(Boolean);
        const nnew = t.filter(x => !this._typesSeen.has(x)).length;
        if (nnew > bestNew) { bestNew = nnew; best = name; }
      } catch (e) {}
    }
    return best;
  }

  _addMon(species, city, badges, { starter = false } = {}) {
    const S = this.S;
    const build = this._makeStoryBuild(species, city, badges);
    if (starter) build.starter = true;
    const slot = { name: species, build, id: nextId() };
    this.sm.team.push(slot);
    try {
      const mon = S.buildPokemon(species, build);
      if (mon.type1) this._typesSeen.add(mon.type1);
      if (mon.type2) this._typesSeen.add(mon.type2);
    } catch (e) {}
    return slot;
  }

  // --- lifecycle hooks called by story-run --------------------------------------------------
  pickStarter(pos) {
    this._seedAgentRng(pos);
    const city = this._cityForRow(pos), badges = 0;
    // Professor hands out a G4 basic; approximate with a wild-pool G4 pick, built at C0 tier.
    let species = this._pickCatchSpecies(city, badges) || 'Eevee';
    this._addMon(species, city, badges, { starter: true });
    // Catch-tutorial partner (normally auto-granted): a second mon so early fights aren't 1-mon.
    const partner = this._pickCatchSpecies(city, badges);
    if (partner) this._addMon(partner, city, badges);
  }

  doCity(pos) {
    // The Evo Lab / EV Trainer live in cities, so the full evolve+train pass happens once per
    // city visit (not before every route battle) — keeps the paid actions from thrashing.
    this._fillToCap(pos);
    this._evolveAndTrain(pos);
  }

  prepForBattle(pos, eventName) {
    // Between cities: only ensure the team is at its badge-cap size (a caught mon fills the slot).
    this._fillToCap(pos);
  }

  _fillToCap(pos) {
    this._seedAgentRng(pos);
    const city = this._cityForRow(pos);
    const badges = this.S.countGymBadgesBeforeStoryRow(pos);
    const cap = this._maxParty();
    // Grow toward cap by catching (coverage-aware). casual catches sparingly.
    const catchBudget = this.policy.catch.mode === 'rare' ? 0
      : this.policy.catch.mode === 'opportunistic' ? 1 : 2;
    let added = 0;
    while (this.sm.team.length < cap && added < catchBudget + (cap - this.sm.team.length)) {
      const sp = this._pickCatchSpecies(city, badges);
      if (!sp) break;
      this._addMon(sp, city, badges);
      this._catchCount++; added++;
    }
  }

  _evolveAndTrain(pos) {
    this._seedAgentRng(pos + 500);
    const city = this._cityForRow(pos);
    const badges = this.S.countGymBadgesBeforeStoryRow(pos);
    // Evolve team members forward to the city's player cap (the dominant power lever), gated on
    // gold (paid Evo-Lab action), then retrain EVs toward the tier. The evolve/train affordability
    // is what separates the policies once the economy binds.
    const evoCap = this._playerEvoCap(city);
    for (const slot of this.sm.team) {
      let species = slot.name;
      // Evolution is a paid Evo-Lab action (EVOLVE_COST_BY_TARGET) — gate it on gold. A
      // gold-starved player (casual) can't afford to evolve and stays weak; this is the core
      // economic feedback that separates the policies.
      const target = this._evolveForward(species, evoCap);
      if (target !== species) {
        const cost = this._evolveCost[this._grade(target)] || 3000;
        if (this._canSpend(cost)) { this._spend(cost); species = target; this._evolveCount++; }
        else { this._blockedEvolve++; }
      }
      const speciesChanged = species !== slot.name;
      // EV training is a paid EV-Trainer action — gate it on gold too.
      const wantTrain = this.policy.train.evTrain;
      const canTrain = wantTrain && this._canSpend(this._evPerMonCost);
      if (wantTrain && !canTrain) this._blockedTrain++;
      if (speciesChanged || canTrain) {
        try {
          const rebuilt = this._makeStoryBuild(species, city, badges, { train: canTrain });
          slot.name = species;
          if (speciesChanged) {
            slot.build = rebuilt;                 // full rebuild on evolution
          } else if (canTrain) {
            slot.build.evs = rebuilt.evs;         // refresh trainable parts in place
            slot.build.powerTier = rebuilt.powerTier;
            if (this.policy.train.tutorMoves && rebuilt.m) slot.build.m = rebuilt.m;
          }
          if (canTrain) this._spend(this._evPerMonCost);
        } catch (e) {}
      }
    }
  }

  // Build the actual battle team (fresh mons). Trim to party cap.
  buildBattleTeam(pos, eventName) {
    const S = this.S;
    const cap = this._maxParty();
    const specs = (this.sm.team || []).slice(0, cap);
    const mons = [];
    for (const s of specs) {
      try { mons.push(S.buildPokemon(s.name, s.build)); } catch (e) {}
    }
    if (!mons.length) {
      // Safety net: never field an empty team.
      const city = this._cityForRow(pos), badges = S.countGymBadgesBeforeStoryRow(pos);
      const sp = this._pickCatchSpecies(city, badges) || 'Rattata';
      this._addMon(sp, city, badges);
      mons.push(S.buildPokemon(sp, this.sm.team[this.sm.team.length - 1].build));
    }
    return mons;
  }

  adaptAfterLoss(pos, eventName, foeMons, result) {
    this._seedAgentRng(pos + 1000);
    this._adaptCount++;
    // Re-prep against the foe: bump training a notch and (optimal/recommended) catch a counter.
    const city = this._cityForRow(pos), badges = this.S.countGymBadgesBeforeStoryRow(pos);
    if (this.policy.catch.mode !== 'rare' && this.sm.team.length < this._maxParty()) {
      const sp = this._pickCatchSpecies(city, badges);
      if (sp) { this._addMon(sp, city, badges); this._catchCount++; }
    }
    // Nudge EV investment up on a loss (a real player min-maxes when stuck).
    for (const slot of this.sm.team) {
      try {
        const base = this.T.baseStats ? this.T.baseStats[slot.name] : null;
        if (base && this.T.distributeEVsToTotal) this.T.distributeEVsToTotal(slot.build, base, 508);
      } catch (e) {}
    }
  }

  postWin(pos, eventName) { /* team persists; evolutions/growth handled at next city */ }

  telemetry() {
    return {
      goldSpent: this._goldSpent, blockedEvolve: this._blockedEvolve, blockedTrain: this._blockedTrain,
      trainCost: this._trainCost, catchCount: this._catchCount,
      evolveCount: this._evolveCount, adaptCount: this._adaptCount,
      teamTypes: [...this._typesSeen],
    };
  }
}
