// The Player Agent — models a real player's prep -> fight -> adapt loop (§2.4a).
//
// Maintains persistent team builds and reconstructs battle instances for each attempt.
// Policies vary preparation and battle skill independently (playerSkill can override the latter).
// Evolution and Mentor purchases use the game's eligibility, prices and mutations; earned EVs
// come from the shared battle reward helper. Catch selection still approximates acquisition:
// balls, failed captures and all optional scene rewards are not yet modeled.

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
    this._openingComplete = false;
    this._wildBuilds = new Map();
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
  _makeStoryBuild(species, city, badges) {
    const S = this.S;
    const tier = S.storyBuildTierForProfessor(city, badges);
    const build = S.makeBuild(species);
    try {
      if (tier < S.STORY_BUILD_TIER.TOURNAMENT) S.storyDowngradeBuildForTier(species, build, tier);
    } catch (e) {}
    build.powerTier = tier;
    delete build._storyStatMult; // player builds are never foe-scaled
    return build;
  }

  // Pick a species to "catch" for the team. Coverage-aware for recommended/optimal, else random.
  _pickCatchSpecies(_city, _badges) {
    const S = this.S;
    const sg = S.storySettingsGens();
    // Use the real wild pool as the catch source (faithful to what's actually encounterable).
    let candidates = [];
    const tries = this.policy.catch.coverageOnly ? 6 : 2;
    for (let i = 0; i < tries; i++) {
      try {
        const w = this.T.rollWildEncounter ? this.T.rollWildEncounter(sg) : null;
        const name = w && (w.name || (w.build && w.species) || w.species);
        if (name) { candidates.push(name); if (w.build) this._wildBuilds.set(name, JSON.parse(JSON.stringify(w.build))); }
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
    const build = this._wildBuilds.get(species) || this._makeStoryBuild(species, city, badges);
    this._wildBuilds.delete(species);
    delete build._storyStatMult;
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

  }

  async doCity(pos) {
    // The Evo Lab / EV Trainer live in cities, so the full evolve+train pass happens once per
    // city visit (not before every route battle) — keeps the paid actions from thrashing.
    this._fillToCap(pos);
    await this._evolveAndTrain(pos);
  }

  prepForBattle(pos, _eventName) {
    // Between cities: only ensure the team is at its badge-cap size (a caught mon fills the slot).
    this._fillToCap(pos);
  }

  _fillToCap(pos) {
    if (!this._openingComplete) return;
    this._seedAgentRng(pos);
    const city = this._cityForRow(pos);
    const badges = this.S.countGymBadgesBeforeStoryRow(pos);
    const cap = this._maxParty();
    // Grow toward cap by catching (coverage-aware). casual catches sparingly.
    const catchBudget = this.policy.catch.mode === 'rare' ? 0
      : this.policy.catch.mode === 'opportunistic' ? 1 : 2;
    let added = 0;
    while (this.sm.team.length < cap && added < catchBudget) {
      const sp = this._pickCatchSpecies(city, badges);
      if (!sp) break;
      this._addMon(sp, city, badges);
      this._catchCount++; added++;
    }
  }

  async _evolveAndTrain(pos) {
    if (!this._openingComplete) return;
    this._seedAgentRng(pos + 500);
    const city = this._cityForRow(pos);
    if (this.policy.train.tutorMoves) await this.S.warmPreparation();
    for (let idx = 0; idx < this.sm.team.length; idx++) {
      const slot = this.sm.team[idx];
      if (this.policy.train.evolve !== 'freeOnly' && city >= 2) {
        // The real NPC decides stage, grade, generation and consumable eligibility.
        const options = this.S.evolutionOptions(slot.name).sort((a,b) => this._bst(b.name) - this._bst(a.name));
        const target = options[0];
        if (target && this._canSpend(target.cost)) {
          const beforeGold = this.sm.gold, beforeName = slot.name;
          await this.E.window.StoryMode.evoLabEvolve(slot.id, target.name);
          this._goldSpent += beforeGold - this.sm.gold;
          if (slot.name !== beforeName) this._evolveCount++;
        } else if (target) this._blockedEvolve++;
      }
      if (this.policy.train.tutorMoves) {
        const quote = this.S.preparationQuote(idx);
        if (quote && this._canSpend(quote.gold)) {
          const beforeGold = this.sm.gold;
          await this.S.prepare(idx);
          this._goldSpent += beforeGold - this.sm.gold;
          this._trainCost += beforeGold - this.sm.gold;
        } else if (quote) this._blockedTrain++;
      }
    }
  }

  // Build the actual battle team (fresh mons). Trim to party cap.
  buildBattleTeam(pos, _eventName) {
    const S = this.S;
    const cap = this._openingComplete ? this._maxParty() : 1;
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

  async adaptAfterLoss(pos, _eventName, _foeMons, _result) {
    this._adaptCount++;
    // Returning for preparation uses actual NPC prices and gates; no free stat grant.
    await this._evolveAndTrain(pos);
  }

  postWin(pos, eventName, beatKey) {
    this.S.awardBattleEVs(eventName, beatKey);
    this.completeOpening(pos);
  }

  completeOpening(pos) {
    if (!this._openingComplete) {
      this._openingComplete = true;
      const city = this._cityForRow(pos);
      const partner = this._pickCatchSpecies(city, 0);
      if (partner) this._addMon(partner, city, 0);
    }
  }

  telemetry() {
    return {
      goldSpent: this._goldSpent, blockedEvolve: this._blockedEvolve, blockedTrain: this._blockedTrain,
      trainCost: this._trainCost, catchCount: this._catchCount,
      evolveCount: this._evolveCount, adaptCount: this._adaptCount,
      teamTypes: [...this._typesSeen],
    };
  }
}
