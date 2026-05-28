// Manual end-to-end PLAYTEST of the Daycare Inn → Egg → Fight Club arc.
// Not a unit test — it drives the real DOM start-to-finish like a player and
// prints the on-screen dialogue at every beat plus a PASS/FAIL checklist, so a
// human can read the whole sequence as it actually plays.
//
//   node tests/playtest-daycare-pits.mjs
//
import { loadEngine } from './helpers/load-engine.js';

const eng = await loadEngine();
const { window } = eng;
const SM = window.StoryMode;
const sm = SM.state;
const doc = window.document;

window.confirm = () => true;          // forfeit confirm → yes
window.alert = () => {};
let lastAlert = '';
window.showGameAlert = (m) => { lastAlert = String(m || ''); };
window.showToast = () => {};

const $ = (id) => doc.getElementById(id);
const flush = (ms = 360) => new Promise(r => setTimeout(r, ms));
const OVERLAYS = ['story-pits-overlay','story-pits-defeat-overlay','story-daycare-overlay',
  'story-daycare-scene','story-daycare-secret','story-daycare-idle','story-hatch-scene',
  'story-pits-win','story-pits-result','story-scene-overlay'];
const clearOverlays = () => OVERLAYS.forEach(id => { const e = $(id); if (e) e.remove(); });

// Visible text of an overlay, tags stripped, whitespace collapsed.
function vis(id) {
  const e = $(id);
  if (!e) return '(no overlay)';
  return (e.textContent || '').replace(/\s+/g, ' ').trim();
}
// Pretty-print a captured beat, wrapped.
function beat(label, idOrText) {
  const t = idOrText.startsWith('#') ? vis(idOrText.slice(1)) : idOrText;
  const wrapped = t.replace(/(.{1,92})(\s|$)/g, '$1\n      ').trimEnd();
  console.log(`\n  ▸ ${label}\n      ${wrapped}`);
}

let PASS = 0, FAIL = 0;
function check(desc, cond) {
  if (cond) { PASS++; console.log(`      ✓ ${desc}`); }
  else { FAIL++; console.log(`      ✗ FAIL: ${desc}`); }
}
function act(title) { console.log(`\n${'═'.repeat(78)}\n  ${title}\n${'═'.repeat(78)}`); }

function freshTeam(names) {
  return names.map((n, i) => ({
    name: n, id: 'mon_' + i + '_' + Math.random().toString(36).slice(2, 7),
    build: { m: ['Tackle','Tackle','Tackle','Tackle'], i:null, a:null, n:'Hardy',
      ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31}, evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
      bonus:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}, tired:0 },
  }));
}
function fresh(badges, { eggDone = false, unlocked = true, fightClub = false, champion = false, clubDone = false } = {}) {
  clearOverlays();
  sm.active = true; sm.badges = badges; sm.gold = 10000; sm.eventIndex = 38;
  sm.team = freshTeam(['Garchomp','Gengar','Lapras','Snorlax','Gardevoir','Tyranitar']);
  sm.pcBox = []; sm.flags = sm.flags || {};
  sm.daycare = { unlocked, eggEventDone: eggDone };
  sm.pits = {
    gym6Snapshot: { badges:6, teamSummary: sm.team.map(t => ({ name:t.name, grade:2, bst:600 })), seed:1, capturedAt:0 },
    championSnapshot: champion ? { badges:8, teamSummary: sm.team.map(t => ({ name:t.name, grade:2, bst:600 })), seed:2, capturedAt:0 } : null,
    winsThisVisit:0, bestStreak:0, payoutGold:0,
    fightClubUnlocked: fightClub, secretRevealed: fightClub, storyClubDone: clubDone,
  };
}

// ───────────────────────────────────────────────────────────────────────────
console.log('\n\n  P L A Y T E S T :  Daycare Inn → Egg → Fight Club  (full arc)\n');

// ════ ACT 1 — Daycare unlock + the egg drop-off (full dark-comedy branch) ════
act('ACT 1 — The Daycare Inn (Gym 1 unlock) → drop off a partner, walk out with an egg');
fresh(1, { eggDone:false, fightClub:false });
SM.enterDaycare();
check('drop-off picker renders at <6 badges with egg event pending', !!$('story-daycare-overlay'));
beat('Matron / the deal / the poster (drop-off picker)', '#story-daycare-overlay');
const snorlaxId = sm.team[3].id;
const dropBtn = $('story-daycare-overlay').querySelector(`[data-daycare-drop="${snorlaxId}"]`);
check('Snorlax has an enabled Drop Off button', !!dropBtn && !dropBtn.disabled);
dropBtn.click();
check('drop-off dialogue scene opens', !!$('story-daycare-scene'));
beat('Beat 1 — you hand Snorlax over, get an egg', '#story-daycare-scene');
$('story-daycare-scene').querySelector('[data-scene-cont]').click();      // → beat 2
beat('Beat 2 — "Something about how fast that curtain closed."', '#story-daycare-scene');
$('story-daycare-scene').querySelector('[data-scene-opt="0"]').click();   // "Wait—where's Snorlax going?" → q1
beat('q1 — "On a cruise. Lovely weather… Different career now."', '#story-daycare-scene');
$('story-daycare-scene').querySelector('[data-scene-opt="0"]').click();   // "A career? Doing what?" → q2
beat('q2 — "Island work. Private clientele… a plane, bald man, Persian…"', '#story-daycare-scene');
$('story-daycare-scene').querySelector('[data-scene-opt="0"]').click();   // "I'd like Snorlax back" → q3
beat('q3 — the smile stops meaning anything. "No." (the floorboards)', '#story-daycare-scene');
$('story-daycare-scene').querySelector('[data-scene-opt="0"]').click();   // "(take the egg and go)" → end
beat('end — "It\'ll hatch after your seventh badge."', '#story-daycare-scene');
$('story-daycare-scene').querySelector('[data-scene-cont]').click();      // close
const eggs1 = [...sm.team, ...sm.pcBox].filter(s => s && s.isEgg);
check('exactly one egg slot now exists', eggs1.length === 1);
check('the egg has a locked hatch species', !!(eggs1[0] && eggs1[0].eggSpecies));
check('Snorlax did NOT come back (gone for good)', ![...sm.team, ...sm.pcBox].some(s => s && !s.isEgg && s.name === 'Snorlax'));
check('team slot count unchanged (parent out, egg in)', sm.team.length === 6);

// ════ ACT 2 — carry the egg to Gym 7, it hatches in place on city return ════
act('ACT 2 — Carry the egg → it will NOT hatch early, hatches at Gym 7');
const eggId = eggs1[0].id;
sm.badges = 6;
check('at 6 badges the egg has not hatched', SM._hatchEligibleEggs().length === 0 && sm.team.some(s => s.id === eggId && s.isEgg));
check('egg is not counted as a fighter', SM._countFighters() === 5); // 5 real mons + 1 egg
sm.badges = 7;
// In the real game this fires automatically on the next city return:
//   renderCityActions → _pitsReleaseBondedOnCityReturn → _storyHatchEligibleEggs  (battle.html:36017)
// (enterCity's full hub render won't complete headlessly, so we call the same hatch fn the hook calls.)
const hatchedNames = SM._hatchEligibleEggs();
check('egg hatches at Gym 7', hatchedNames.length === 1);
const hatchedSlot = [...sm.team, ...sm.pcBox].find(s => s && s.id === eggId);
check('the egg slot is now a real (non-egg) Pokémon', !!hatchedSlot && !hatchedSlot.isEgg && !!hatchedSlot.build);
beat('Gym 7 — hatch reveal (auto-fires on city return; copy from source)',
  `The egg shudders, cracks, goes still — and a ${hatchedNames[0] || '<hatchling>'} blinks up at you. It shares the typing of the partner you left at the Inn. It will never ask where they went. You still might.`);

// ════ ACT 3 — the matron's secret unlocks the Fight Club (full branch) ════
act('ACT 3 — Six badges: the matron lets you in on the secret');
fresh(6, { eggDone:true, fightClub:false });
SM.enterDaycare();
check('secret scene renders at 6 badges (Fight Club still locked)', !!$('story-daycare-secret'));
beat('Beat 1 — "Six badges. Strong… Can I tell you a secret?"', '#story-daycare-secret');
$('story-daycare-secret').querySelector('[data-scene-opt="0"]').click();  // "Tell me" → tell
beat('tell — "There\'s a place. Down below… First rule…"', '#story-daycare-secret');
$('story-daycare-secret').querySelector('[data-scene-cont]').click();     // → That Night
beat('That Night — the red door, the cry that does not sound like winning', '#story-daycare-secret');
$('story-daycare-secret').querySelector('[data-scene-opt="0"]').click();  // "Go down the stairs" → down
beat('down — split lip, the question: "how much can you really know about your Pokémon…"', '#story-daycare-secret');
$('story-daycare-secret').querySelector('[data-scene-opt="0"]').click();  // "Step inside"
check('Fight Club unlocked after Step inside', sm.pits.fightClubUnlocked === true);
check('secret scene closed', !$('story-daycare-secret'));

// ════ ACT 4 — the Fight Club gauntlet: lock a trio, sweep all five (one-time payoff) ════
act('ACT 4 — Step into the ring: lock 3, 3v3 each round, sweep all five (one-time)');
fresh(6, { eggDone:true, fightClub:true });
const goldBefore = sm.gold;
SM.enterPits();
check('Fight Club selection overlay renders', !!$('story-pits-overlay'));
check('lists all six fighters to pick from', $('story-pits-overlay').querySelectorAll('[data-pits-pick]').length === 6);
beat('Selection screen — flavor / bracket / reward / price of quitting', '#story-pits-overlay');
const picks = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
for (const id of picks) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
const startBtn = $('story-pits-overlay').querySelector('#pits-start-btn');
check('START enabled once exactly 3 are picked', !!startBtn && !startBtn.disabled);
startBtn.click();
check('rolled a 5-round enemy gauntlet', sm.pits._enemyRoster && sm.pits._enemyRoster.length === 5);
check('round 1 opens with the draft reveal', !!$('story-pits-draft-overlay'));
check('the house fields six', sm.pits._enemyRoster[0].six.length === 6);
check('the house counter-picks exactly three', sm.pits._enemyRoster[0].picked.length === 3);
beat('Round-1 draft reveal — the house\'s six + its counter-picked three', '#story-pits-draft-overlay');
$('story-pits-draft-overlay').querySelector('#pits-draft-go').click();   // send the trio in
check('marked in-battle after sending them in', sm.pits._inBattle === true);
for (let i = 0; i < 5; i++) SM.onBattleEnd(true, 'Fight Club win', '');   // resolve fires synchronously on the 5th
check('in-battle cleared after 5 wins', sm.pits._inBattle === false);
check('gold paid out', sm.gold > goldBefore);
check('every team member got +10 to every stat', sm.team.every(s => ['hp','atk','def','spa','spd','spe'].every(k => s.build.bonus[k] === 10)));
check('NO mons released — you keep all six', sm.team.length === 6);
check('story club marked done', sm.pits.storyClubDone === true);
check('one-time: story club no longer available', SM._pitsStoryAvailable() === false);
await flush(330);
beat('WIN result — the boost + the single dark line', '#story-pits-win');

// ════ ACT 5 — lose, then CRAWL HOME: all three fighters die ════
act('ACT 5 — Lose a fight → Crawl Home → all three bracket fighters die');
fresh(6, { eggDone:true, fightClub:true });
SM.enterPits();
const ids5 = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
for (const id of ids5) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
const totalBefore5 = sm.team.length + sm.pcBox.length;
$('story-pits-overlay').querySelector('#pits-start-btn').click();
$('story-pits-draft-overlay').querySelector('#pits-draft-go').click();   // send the trio in
SM.onBattleEnd(false, 'Fight Club loss', '');
await flush(360);
check('defeat overlay renders on a loss', !!$('story-pits-defeat-overlay'));
beat('Defeat overlay — Step back in (free) vs Crawl home (death)', '#story-pits-defeat-overlay');
$('story-pits-defeat-overlay').querySelector('#pits-defeat-forfeit').click();
check('all three bracket fighters died (total -3)', (sm.team.length + sm.pcBox.length) === totalBefore5 - 3);
check('none of the three survive anywhere', ![...sm.team, ...sm.pcBox].some(s => ids5.includes(s.id)));
check('a forfeit does NOT consume the one-time club', sm.pits.storyClubDone === false);
beat('Forfeit toast', lastAlert || '(none)');

// ════ ACT 6 — lose, then STEP BACK IN: free retry, nobody dies ════
act('ACT 6 — Lose a fight → Step Back In → free retry, no deaths');
fresh(6, { eggDone:true, fightClub:true });
SM.enterPits();
const ids6 = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
for (const id of ids6) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
$('story-pits-overlay').querySelector('#pits-start-btn').click();
$('story-pits-draft-overlay').querySelector('#pits-draft-go').click();   // send the trio in
SM.onBattleEnd(false, 'Fight Club loss', '');
await flush(360);
$('story-pits-defeat-overlay').querySelector('#pits-defeat-retry').click();
check('retry re-armed the in-battle flag', sm.pits._inBattle === true);
check('bracket picks preserved across retry', !!(sm.pits._activePickIds && sm.pits._activePickIds.length === 3));
// During an active fight sm.team is intentionally just the 3 fighters; the full team is
// stashed in _teamBeforePit and restored on resolve. "Nobody died" = no permadeath.
check('no permadeath on retry (full team stashed, PC empty)', sm.pits._teamBeforePit.length === 6 && sm.pcBox.length === 0);

// ════ ACT 7 — endgame loop (post-Champion): money only, repeatable ════
act('ACT 7 — Post-Champion endgame: Inn shuttered, money-only repeatable loop');
fresh(8, { eggDone:true, fightClub:true, champion:true, clubDone:true });
check('endgame detected via championSnapshot', SM._pitsIsEndgame() === true);
SM.enterDaycare();
beat('Daycare Inn — shuttered', '#story-daycare-idle');
const goldBefore7 = sm.gold;
const bonusBefore7 = sm.team.map(s => ({ ...s.build.bonus }));
SM.enterPits();
check('endgame Fight Club is open', !!$('story-pits-overlay'));
beat('Endgame selection — money-only flavor', '#story-pits-overlay');
const picks7 = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
for (const id of picks7) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
$('story-pits-overlay').querySelector('#pits-start-btn').click();
$('story-pits-draft-overlay').querySelector('#pits-draft-go').click();   // send the trio in
for (let i = 0; i < 5; i++) SM.onBattleEnd(true, 'Fight Club win', '');
check('endgame win pays gold', sm.gold > goldBefore7);
check('endgame win grants NO permanent +1', sm.team.every((s, i) => ['hp','atk','def','spa','spd','spe'].every(k => (s.build.bonus[k]|0) === (bonusBefore7[i][k]|0))));
check('endgame club stays open (repeatable)', SM._pitsIsEndgame() === true);
await flush(330);
beat('Endgame WIN result — money + the numb dark line', '#story-pits-result');

// ───────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(78)}`);
console.log(`  PLAYTEST COMPLETE —  ${PASS} passed,  ${FAIL} failed`);
console.log(`${'═'.repeat(78)}\n`);
eng.teardown();
process.exit(FAIL ? 1 : 0);
