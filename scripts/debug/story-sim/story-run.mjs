// Full headless Story run: walk STORY_EVENTS_RAW, build a growing player team, resolve every
// battle with the real AI, advance the run, and collect telemetry.
//
// Faithfulness is anchored on the real internals exposed via window.__storySim (added to
// battle.html alongside __storyTest/__engine, test-only). Per Battle row it reproduces the
// enterBattleEvent sequence: beat-resolve -> trainer-swap -> _storyEnemyPartySize ->
// _withEventSeededRng(eid) roll (rival rolls live) -> stamp _storyStatMult -> buildPokemon ->
// resolve. Victory advance replicates onBattleEnd's state mutations (gold/badges/eventIndex)
// without its DOM overlay tail.
//
// The Player Agent (prep/train/catch/adapt) lives in agent.mjs; this module owns the run
// skeleton and the faithful foe/battle wiring.

import { loadEngine } from '../../../tests/helpers/load-engine.js';
import { resolveBattle, restoreRealAI } from './resolve-battle.mjs';
import { installShims, getSm } from './dom-shim.mjs';
import { getPolicy } from './policies.mjs';
import { PlayerAgent } from './agent.mjs';

const GYM_RE = /^Gym Leader [1-8]$/;
const BASE_START_GOLD = 2000;

function uint32(n) { return (n >>> 0); }

// --- Run init -------------------------------------------------------------------------------
// Set sm fields directly (confirmTrainerAndStart reads the DOM form, so we mirror startNewRun).
export function initRun(E, opts) {
  const { window } = E;
  const S = window.__storySim;
  if (!S) throw new Error('window.__storySim missing — battle.html test surface not loaded');
  installShims(E);
  restoreRealAI(E);

  const {
    seed = 1, difficulty = 'normal',
    gens = [1, 2, 3, 4, 5, 6, 7, 8, 9],
    mech = { megaOn: true, zOn: true, dynaOn: true, teraOn: true },
  } = opts;

  const sm = S.sm;
  sm.active = true;
  sm.runSeed = uint32(seed);
  sm._strngState = null;                 // storyRngNext lazily seeds from runSeed
  sm.eventIndex = 0;
  sm.badges = 0;
  sm.gold = BASE_START_GOLD + (S.storyStartingGoldBonus ? S.storyStartingGoldBonus(difficulty) : 0);
  sm.storyDifficulty = difficulty;
  sm.settings = {
    enabledGens: gens.slice(),
    minGen: Math.min(...gens), maxGen: Math.max(...gens),
    megaOn: mech.megaOn, zOn: mech.zOn, dynaOn: mech.dynaOn, teraOn: mech.teraOn,
    classicMode: true,
  };
  sm.team = [];
  sm.pcBox = sm.pcBox || [];
  sm.trainerAssignments = {};
  sm.storyEventsFired = {};
  sm.catchTutorialDone = true;           // suppress catch/roaming interrupt overlays (we model catching ourselves)
  sm.tracks = {
    main: 'classic_v2',
    villain: S.pickTrack ? S.pickTrack(S.VILLAIN_TRACKS) : 'rocket',
    extra: S.pickTrack ? S.pickTrack(S.EXTRA_TRACKS) : 'cubone',
  };
  sm.stats = sm.stats || { battlesLost: 0, rivalBattlesLost: 0 };
  sm.inventory = sm.inventory || {};
  sm.balls = sm.balls || { poke: 5, great: 0, ultra: 0, master: 0 };

  try { S.applyMechanicsToSettings(); } catch (e) {}
  try { S.assignTrainers(sm.settings.enabledGens); } catch (e) {}
  // Seed Math.random at run start so the agent's catching (rollWildEncounter uses bare
  // Math.random by design) is reproducible per seed AND order-independent across runs in a
  // shared engine process. Per-battle reseeds happen inside resolveBattle; between-battle
  // catches inherit the deterministic post-battle state.
  try { E.seedRng(uint32(seed) ^ 0x5eed1234); } catch (e) {}
  return sm;
}

// --- Faithful foe-team generation for a Battle row -----------------------------------------
// Reproduces enterBattleEvent's roll+stamp; returns { foeSpecs, trainerName, isRival, beatKey }.
function rollFoeForRow(E, pos) {
  const S = E.window.__storySim;
  const sm = S.sm;
  const raw = S.STORY_EVENTS_RAW;
  const ev = raw[pos];
  const eid = ev[0];
  const eventName = String(ev[2] || '');
  const gw = ev[3] || { g1: 0, g2: 0, g3: 50, g4: 50 };
  const coins = ev[4] || 0;
  const sg = S.storySettingsGens();

  sm.eventIndex = pos;
  sm.badges = S.countGymBadgesBeforeStoryRow(pos);

  const isRival = eventName === 'Rival';
  const playerLen = Math.max(1, (sm.team || []).length);
  const partySize = S.storyEnemyPartySize(eventName, playerLen, eid);

  // Beat resolution: may swap trainer identity to a canon boss, or (raid) replace the roll.
  let beatKey = null, raidTeam = null, trainerName = sm.trainerAssignments[eid];
  try {
    const beat = S.activeBattleBeatForCurrentRow();
    if (beat && beat.sceneKey) {
      beatKey = beat.sceneKey;
      const kind = beat.kind;
      if (kind === 'raid' || kind === 'miniRaid') {
        raidTeam = S.rollExtraRaidBossTeam(beat.sceneKey);
      } else if (kind === 'boss' || kind === 'miniBoss' || kind === 'mysteryBoss') {
        const canon = (S.BEAT_CANON_TRAINER || {})[beat.sceneKey];
        if (canon) trainerName = canon;
      } else if (kind === 'battle') {
        const grunt = (S.BEAT_FACTION_TRAINER || {})[beat.sceneKey];
        if (grunt) trainerName = grunt;
      }
    }
  } catch (e) {}

  if (raidTeam) return { foeSpecs: raidTeam, trainerName: '(raid)', isRival: false, beatKey, eventName, eid, coins };

  const trainer = (trainerName && S.findTrainerDataByName(trainerName, eventName))
    || S.selectTrainerForRole(eventName, sg, null, null);
  if (!trainer) return null;

  const avoid = (!isRival && S.storyCityFoeSeen) ? S.storyCityFoeSeen(eid) : null;
  const doRoll = () => S.rollTrainerTeam(trainer, partySize, gw, sg, eventName, eid, avoid);
  // Non-rival fights roll under the per-event seeded RNG; the rival rolls live (counters live team).
  let foeSpecs = isRival ? doRoll() : S.withEventSeededRng(eid, doRoll);

  // Stamp the foe stat multiplier (FOE_POWER_CURVE[city] * difficulty), skipping raid bosses.
  let city = -1; try { city = S.cityIndexForStoryRow(eid); } catch (e) {}
  const mult = S.storyEnemyStatMult(eventName, city, eid) * S.foeDifficultyMult(sm.storyDifficulty || 'normal');
  for (const s of foeSpecs) {
    if (!s || !s.build) continue;
    if (s.build._bossStatMult > 1 || s.build._bossHpScale > 1) continue;
    s.build._storyStatMult = mult;
  }
  return { foeSpecs, trainerName: trainer.name, isRival, beatKey, eventName, eid, coins, foeMult: mult };
}

// Replicate onBattleEnd's win-branch state mutations (minus the DOM overlay + processNextEvent).
function applyVictoryAdvance(E, pos, coins) {
  const S = E.window.__storySim;
  const sm = S.sm;
  const ev = S.STORY_EVENTS_RAW[pos];
  const event = String(ev[2] || '');
  let coinMult = S.storyDifficultyCoinMult();
  try { coinMult *= S.storyProgressCoinMultForEventIndex(pos); } catch (e) {}
  if (event === 'Basic Trainer') { try { coinMult *= E.window.__storyTest.STORY_BASE_TRAINER_GOLD_MULT; } catch (e) {} }
  const awarded = Math.floor((coins || 0) * coinMult);
  sm.gold += awarded;
  if (GYM_RE.test(event)) sm.badges = (sm.badges | 0) + 1;
  sm.currentEnemyLock = null;
  return awarded;
}

// --- Full run -------------------------------------------------------------------------------
export async function runStory(E, opts = {}) {
  const {
    seed = 1, difficulty = 'normal', policy: policyId = 'recommended',
    itemMode = 'off', gens, mech, endpoint = 'mystery', onStage = null,
  } = opts;
  const policy = getPolicy(policyId);
  const sm = initRun(E, { seed, difficulty, gens, mech });
  const S = E.window.__storySim;
  const raw = S.STORY_EVENTS_RAW;
  const agent = new PlayerAgent(E, policy, { difficulty, runSeed: uint32(seed) });

  // Starter + initial team fill.
  agent.pickStarter(sm.eventIndex);

  const stages = [];
  let outcome = 'hof';
  let reachedPos = 0, reachedName = '';

  for (let pos = 0; pos < raw.length; pos++) {
    const ev = raw[pos];
    if (!ev) continue;
    const kind = ev[1];
    const eventName = String(ev[2] || '');
    reachedPos = pos; reachedName = eventName;

    if (kind === 'City') {
      sm.eventIndex = pos;
      sm.badges = S.countGymBadgesBeforeStoryRow(pos);
      agent.doCity(pos);
      continue;
    }
    if (kind === 'Hall of Fame') {
      stages.push({ pos, event: 'Hall of Fame', kind: 'hof' });
      if (endpoint === 'hof') { outcome = 'hof'; break; }
      continue; // fall through to the post-HoF Mystery Figure row
    }
    if (kind !== 'Battle') continue;

    // Prep before the fight (grow team to cap, evolve, train, adapt-reset).
    agent.prepForBattle(pos, eventName);

    const rolled = rollFoeForRow(E, pos);
    if (!rolled) { stages.push({ pos, event: eventName, skipped: 'no-trainer' }); continue; }

    // Build both sides fresh (HP resets each battle regardless).
    const foeMons = rolled.foeSpecs.map(s => S.buildPokemon(s.name, s.build));
    let result = null, retries = 0;
    const maxRetries = policy.adapt.retries;
    for (;;) {
      const playerMons = agent.buildBattleTeam(pos, eventName);
      result = await resolveBattle(E, { mons: playerMons }, { mons: foeMons }, {
        seed: uint32(seed) ^ (pos * 2654435761),
        mode: 'story',
        foeStoryItems: itemMode === 'on',
        playerSkill: policy.playerSkill,
        storyContext: {
          active: true,
          storyDifficulty: difficulty,
          foeStoryInv: itemMode === 'on' ? (rolled.foeStoryInv || null) : null,
        },
      });
      if (result.winner === 'player') break;
      retries++;
      if (retries > maxRetries || !policy.adapt.reprepOnLoss) break;
      agent.adaptAfterLoss(pos, eventName, foeMons, result);
    }

    const won = result.winner === 'player';
    // Coin reward reads the shared global sm.storyDifficulty (which the per-turn player-skill pin
    // flips to 'hard'); force it back to the run difficulty so rewards are exact & deterministic.
    sm.storyDifficulty = difficulty;
    let goldAwarded = 0;
    if (won) goldAwarded = applyVictoryAdvance(E, pos, rolled.coins);
    else { sm.stats.battlesLost = (sm.stats.battlesLost | 0) + 1; }

    const stage = {
      pos, eid: rolled.eid, event: eventName, kind: 'battle',
      isRival: rolled.isRival, beatKey: rolled.beatKey || null,
      trainer: rolled.trainerName, badgesBefore: S.countGymBadgesBeforeStoryRow(pos),
      foeMult: rolled.foeMult || 1, foeSize: foeMons.length, playerSize: (sm.team || []).length,
      result: result.result, won, retries, turns: result.turns, stalled: result.stalled,
      pHpRemainingPct: result.pHpRemainingPct, pFaints: result.pFaints, fFaints: result.fFaints,
      goldBefore: sm.gold - goldAwarded, goldAfter: sm.gold, goldAwarded,
    };
    stages.push(stage);
    if (onStage) onStage(stage);

    if (won) {
      agent.postWin(pos, eventName);
    } else {
      outcome = `failed@${pos}`;
      break;
    }
  }

  return {
    seed, difficulty, policy: policyId, itemMode,
    outcome, reachedPos, reachedName,
    badges: sm.badges, gold: sm.gold,
    villain: sm.tracks && sm.tracks.villain, extra: sm.tracks && sm.tracks.extra,
    finalTeam: (sm.team || []).map(t => t.name),
    stages,
  };
}

// Convenience: boot + run one seed (for smoke).
export async function runOneSeed(opts = {}) {
  const _l = console.log; console.log = () => {};
  const E = await loadEngine();
  console.log = _l;
  const rec = await runStory(E, opts);
  return { E, rec };
}
