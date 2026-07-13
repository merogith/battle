// Phone UI/UX audit: walk every screen from game entry -> story completion at
// the three phone viewports, run overflow/clip/tap checks on each, screenshot.
// Usage: cd scripts/debug/ui-rig && node phone-audit.mjs [phone|phoneS|phoneL]
import { launch, VIEWPORTS, snap, runChecks, bootStory, dismissOverlays } from './audit-lib.mjs';
import { mkdirSync, writeFileSync } from 'fs';

const VP_NAME = process.argv[2] || 'phone';
const VP = VIEWPORTS[VP_NAME];
if (!VP) { console.error('bad viewport', VP_NAME); process.exit(1); }
const OUT = `./out/phone/${VP_NAME}`;
mkdirSync(OUT, { recursive: true });

const results = [];
let page, browser;

// Run checks + screenshot for the currently-visible surface.
async function audit(name) {
  try {
    await page.waitForTimeout(250);
    const rep = await runChecks(page, name);
    await snap(page, `${OUT}/${name}.png`);
    // keep only the phone-fit-relevant issue types + tap targets + tiny font
    const keep = rep.issues.filter(i => ['page-hscroll','viewport-overflow-x','text-clipped-x','text-clipped-y','tiny-font','small-tap-target','overlap'].includes(i.type));
    results.push({ name, viewport: rep.viewport, count: keep.length, issues: keep });
    const tag = keep.length ? `⚠ ${keep.length}` : 'ok';
    console.log(`  [${tag}] ${name}`);
  } catch (e) {
    results.push({ name, error: String(e).slice(0,200) });
    console.log(`  [ERR] ${name}: ${String(e).slice(0,120)}`);
  }
}

// safe evaluate wrapper
const ev = (fn, arg) => page.evaluate(fn, arg).catch(e => console.log('   ev-fail:', String(e).slice(0,100)));

// Enter a city and click through the arrival cold-open + wild-encounter so we land
// on the real city hub (screen-story-city), not the catch overlay.
async function reachCityHub() {
  await ev(() => window.StoryMode.enterCity());
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(300);
    const state = await ev(() => {
      const rb = document.getElementById('story-catch-run-btn');
      if (rb && rb.offsetHeight > 0) { rb.click(); return 'catch'; }
      const city = document.getElementById('screen-story-city');
      if (city && !city.classList.contains('hidden')) return 'city';
      // click any visible overlay button (cold open "Begin/Continue")
      const ov = [...document.body.children].filter(e => {
        if (e.id && /^screen-|^modal-/.test(e.id)) return false;
        const s = getComputedStyle(e);
        return (s.position === 'fixed' || s.position === 'absolute') && e.offsetHeight > 40 && s.display !== 'none';
      });
      const top = ov[ov.length - 1];
      if (top) { const b = [...top.querySelectorAll('button,[role=button]')].find(x => x.offsetHeight > 0); if (b) { b.click(); return 'overlay'; } top.click(); return 'overlay-bg'; }
      return 'idle';
    });
    if (state === 'city') return true;
    if (state === 'idle') return false;
  }
  return false;
}

async function main() {
  ({ browser, page } = await launch(VP, { touch: true }));
  console.log(`\n=== PHONE AUDIT @ ${VP_NAME} (${VP.width}x${VP.height}) ===`);

  // 1. HOME MENU
  await ev(() => window.closeModal && window.closeModal('modal-game-alert'));
  await audit('01-home-menu');

  // 2. SETTINGS
  await ev(() => window.openSettings());
  await audit('02-settings');
  await ev(() => window.closeModal('modal-settings'));

  // 3. HELP
  await ev(() => window.showHelp());
  await audit('03-help');
  await ev(() => window.closeModal('modal-help'));

  // 4. STORY MENU
  await ev(() => window.StoryMode.showMenu());
  await audit('04-story-menu');

  // 5. TRAINER CREATE
  await ev(() => window.StoryMode.openTrainerCreate());
  await audit('05-trainercreate');

  // 6. PROFESSOR (starter pick) — boot a fresh run at city 0
  await bootStory(page, { eventIndex: 0, overrides: { badges: 0, gold: 3000, profUsed: {} } });
  await ev(() => window.StoryMode.enterProfessor && window.StoryMode.enterProfessor());
  await audit('06-professor');

  // 7. CITY HUB (city 1) — proper hub, not the arrival catch
  await bootStory(page, { eventIndex: 3, overrides: { badges: 1, gold: 6000 } });
  await reachCityHub();
  await ev(() => window.closeModal && window.closeModal('modal-game-alert'));
  await audit('07-city-hub');

  // 7b. CATCH / WILD ENCOUNTER surface (real audit target)
  await bootStory(page, { eventIndex: 3, overrides: { badges: 1, gold: 6000 } });
  await ev(() => window.StoryMode.enterCity());
  await dismissOverlays(page, 'screen-story-catch', 6);
  await audit('07b-catch');

  // 8. FACILITIES — each after enterCity context is live
  const facilities = [
    ['08-shop', 'enterShop'],
    ['09-tutor', 'enterTutor'],
    ['10-mentor', 'enterMentor'],
    ['11-pokemoncenter', 'enterPokemonCenter'],
    ['12-evolab', 'enterEvolutionLab'],
    ['13-evtrainer', 'enterEVTrainer'],
    ['14-fanclub', 'enterFanClub'],
    ['15-colress', 'enterColress'],
    ['16-link', 'enterLink'],
    ['17-casino', 'enterCasino'],
    ['18-stone-shop', 'enterStoneShop'],
    ['19-artifacts', 'enterArtifactHall'],
    ['20-artifact-shop', 'enterArtifactShop'],
    ['21-daycare', 'enterDaycare'],
    ['22-safari', 'enterSafariZone'],
    ['23-collection', 'openCollection'],
  ];
  for (const [name, fn] of facilities) {
    await bootStory(page, { eventIndex: 3, overrides: { badges: 4, gold: 60000, pc: buildPC() } });
    // enter city context (no need to reach hub visually — facility fn shows its own screen)
    await ev(() => window.StoryMode.enterCity());
    await page.waitForTimeout(150);
    const ok = await page.evaluate((fn) => {
      try { if (window.StoryMode[fn]) { window.StoryMode[fn](); return true; } } catch(e){ return 'err:'+e.message; }
      return 'no-fn:'+fn;
    }, fn).catch(e => 'ev-err:'+String(e).slice(0,80));
    await page.waitForTimeout(250);
    if (ok === true) await audit(name);
    else { results.push({ name, skipped: ok }); console.log(`  [skip] ${name}: ${ok}`); }
  }

  // 24. CASINO tabs
  await bootStory(page, { eventIndex: 3, overrides: { badges: 4, gold: 60000 } });
  await ev(() => { window.StoryMode.enterCity(); window.StoryMode.enterCasino(); });
  for (const tab of ['slots','roulette','flip']) {
    await ev((t) => window.StoryMode.casinoSwitchTab && window.StoryMode.casinoSwitchTab(t), tab);
    await audit(`24-casino-${tab}`);
  }

  // 25. PARTY / BAG / RUN SUMMARY modals (story)
  await bootStory(page, { eventIndex: 3, overrides: { badges: 4, gold: 60000, team: buildTeam(4) } });
  await ev(() => window.StoryMode.enterCity());
  await ev(() => window.StoryMode.openPartyModal && window.StoryMode.openPartyModal());
  await audit('25-party-modal');
  await ev(() => window.closeModal && window.closeModal('modal-story-party'));
  await ev(() => window.StoryMode.openCityBag && window.StoryMode.openCityBag());
  await audit('26-city-bag');
  await ev(() => window.closeModal && window.closeModal('modal-story-bag'));
  await ev(() => window.StoryMode.openRunSummary && window.StoryMode.openRunSummary());
  await audit('27-run-summary');

  // 26. QUICK BATTLE -> battle screen + battle modals
  await ev(() => { try { settings.quickTeamSource='random'; } catch(e){} window.startQuickBattle(); });
  await page.waitForTimeout(3000);
  await ev(() => window.closeModal && window.closeModal('modal-game-alert'));
  await audit('28-battle');
  // open FIGHT move menu
  await ev(() => { const b=document.querySelector('#command-menu button'); if(b) b.click(); });
  await audit('29-battle-moves');
  // party modal in battle
  await ev(() => window.openPartyModal && window.openPartyModal());
  await audit('30-battle-party');
  await ev(() => window.closeModal && window.closeModal('modal-party'));

  // 27. CAMP / WANDER / JOURNAL test surfaces
  await bootStory(page, { eventIndex: 3, overrides: { badges: 2, gold: 6000, team: buildTeam(3) } });
  await ev(() => window.__storyTest.enterCamp && window.__storyTest.enterCamp());
  await audit('31-camp');
  await ev(() => window.__storyTest.showWanderScreen && window.__storyTest.showWanderScreen());
  await audit('32-wander');
  await ev(() => window.__storyTest.enterJournal && window.__storyTest.enterJournal());
  await audit('33-journal');

  // 28. CRUCIBLE / FRONTIER / PITS (post-game)
  await bootStory(page, { eventIndex: 3, overrides: { badges: 8, gold: 90000, atCrucible: true, postHofMysteryClimaxDone: true, team: buildTeam(6) } });
  await ev(() => window.StoryMode.enterCrucible && window.StoryMode.enterCrucible());
  await audit('34-crucible');
  await ev(() => window.StoryMode.enterFrontierHub && window.StoryMode.enterFrontierHub());
  await audit('35-frontier');

  // 29. GAME OVER (force but from a populated-ish state)
  await ev(() => {
    document.querySelectorAll('.screen,.modal').forEach(e=>e.classList.add('hidden'));
    const g=document.getElementById('screen-story-gameover'); if(g) g.classList.remove('hidden');
  });
  await audit('36-gameover');

  // 30. ONLINE PVP modal
  await ev(() => window.StoryMode && window.StoryMode.showMenu && window.StoryMode.showMenu());
  await ev(() => { const m=document.getElementById('modal-online-pvp'); if(m){ m.classList.remove('hidden'); } });
  await audit('37-online-pvp');

  writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  // summary
  const withIssues = results.filter(r => r.count > 0);
  const total = results.reduce((a,r)=>a+(r.count||0),0);
  console.log(`\n=== ${VP_NAME}: ${total} fit-issues across ${withIssues.length} surfaces ===`);
  await browser.close();
}

function buildTeam(n) {
  const mons = ['Pikachu','Charizard','Blastoise','Venusaur','Gengar','Alakazam'];
  return mons.slice(0,n).map(name => ({ name, level:50, hp:130, maxHp:130,
    build:{ m:['Thunderbolt','Quick Attack','Iron Tail','Volt Tackle'], i:'Light Ball', a:'Static', n:'Hardy', evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0} } }));
}
function buildPC() {
  return buildTeam(6).map(m => ({ ...m }));
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
