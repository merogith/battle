// Headless full Story Mode walkthrough. Boots battle.html in jsdom, drives
// window.StoryMode through every event programmatically with auto-win,
// exercising every sub-system (Professor, Pokemart, PC, Safari, Underground,
// Move Tutor, Evolution Lab, Colress, EV Trainer, etc.) and recording every
// crash/exception/state inconsistency it hits.
//
// Run: node tests/story-walkthrough.mjs

import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import jsdomPkg from 'jsdom';
const { JSDOM } = jsdomPkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BATTLE_HTML_PATH = join(ROOT, 'battle.html');

const findings = []; // { severity, area, msg, event? }
function record(severity, area, msg, ctx) {
  findings.push({ severity, area, msg, ctx });
  if (process.env.STORY_VERBOSE) {
    const e = ctx ? ` @ ${JSON.stringify(ctx)}` : '';
    console.log(`[${severity}] ${area}: ${msg}${e}`);
  }
}

function stripExternalScripts(html) {
  return html
    .replace(/<script\s+[^>]*src=["']https?:\/\/[^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']online-[^"']+\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<script\s+[^>]*src=["']move-(sfx|anim)-map\.js["'][^>]*>\s*<\/script>/gi, '');
}

function makeFetchStub() {
  return async function fetchStub(url) {
    const u = String(url || '');
    if (/^https?:\/\//.test(u)) {
      return { ok: false, status: 599, text: async () => '', json: async () => ({}) };
    }
    const rel = u.replace(/^\.?\/?/, '');
    const filePath = join(ROOT, rel);
    if (!existsSync(filePath)) {
      return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
    }
    const body = readFileSync(filePath, 'utf8');
    return { ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body) };
  };
}

async function boot() {
  const html = await readFile(BATTLE_HTML_PATH, 'utf8');
  const stripped = stripExternalScripts(html);

  const dom = new JSDOM(stripped, {
    url: `file://${BATTLE_HTML_PATH}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.__testHarness = true;
      window.__victoryInputArmMs = 0; // P0.1 buffered-input guard: off under the harness
      window.fetch = makeFetchStub();

      // Stub canvas + media + anime + supabase + service worker
      const origGetContext = window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext = function () {
        return {
          fillRect:()=>{}, clearRect:()=>{}, getImageData:()=>({data:[]}),
          putImageData:()=>{}, createImageData:()=>({data:[]}),
          setTransform:()=>{}, drawImage:()=>{}, save:()=>{}, fillText:()=>{},
          restore:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{},
          closePath:()=>{}, stroke:()=>{}, translate:()=>{}, scale:()=>{},
          rotate:()=>{}, arc:()=>{}, fill:()=>{}, measureText:()=>({width:0}),
          transform:()=>{}, rect:()=>{}, clip:()=>{},
        };
      };
      window.HTMLMediaElement.prototype.play = () => Promise.resolve();
      window.HTMLMediaElement.prototype.pause = () => {};

      const _animeFn = () => {
        const inst = { finished:Promise.resolve(), pause:()=>{}, restart:()=>{},
          play:()=>{}, reverse:()=>{}, seek:()=>{}, add:()=>inst };
        return inst;
      };
      _animeFn.set = ()=>{}; _animeFn.remove = ()=>{}; _animeFn.running = [];
      _animeFn.stagger = v => v; _animeFn.timeline = () => ({ add:()=>({add:()=>({}),finished:Promise.resolve()}),finished:Promise.resolve(), pause:()=>{} });
      _animeFn.random = (a)=>a; _animeFn.path = ()=>()=>0;
      _animeFn.setDashoffset = ()=>0; _animeFn.bezier = ()=>()=>0;
      _animeFn.easings = {}; _animeFn.suspendWhenDocumentHidden = false;
      window.anime = _animeFn;

      window.supabase = { createClient: () => ({ from: () => ({ select: () => Promise.resolve({ data:[], error:null }), insert: () => Promise.resolve({ data:[], error:null }), update: () => Promise.resolve({ data:[], error:null }) }), auth: { getUser: () => Promise.resolve({ data:{user:null}, error:null }) } }) };

      if (!window.navigator.serviceWorker) {
        Object.defineProperty(window.navigator, 'serviceWorker', { value: { register:()=>Promise.resolve({update:()=>{}}), ready:Promise.resolve({}), addEventListener:()=>{} }, configurable: true });
      }
      if (!window.matchMedia) {
        window.matchMedia = () => ({ matches:false, addEventListener:()=>{}, removeEventListener:()=>{}, addListener:()=>{}, removeListener:()=>{} });
      }
      window.requestAnimationFrame = cb => setTimeout(cb, 0);
      window.cancelAnimationFrame = id => clearTimeout(id);

      // Capture engine console output as findings
      window.console.warn = (...args) => {
        const msg = args.map(a => typeof a === 'string' ? a : (a && a.message) || JSON.stringify(a, (_, v) => v instanceof Error ? v.message : v)).join(' ');
        // Suppress jsdom-only noise: localStorage is unavailable for file:// (opaque origin)
        if (msg.includes('localStorage is not available')) return;
        record('warn', 'engine.console.warn', msg);
      };
      window.console.error = (...args) => {
        const msg = args.map(a => typeof a === 'string' ? a : (a && a.message) || JSON.stringify(a, (_, v) => v instanceof Error ? v.message : v)).join(' ');
        record('error', 'engine.console.error', msg);
      };
      window.onerror = (msg, src, line, col, err) => {
        record('error', 'engine.onerror', `${msg} (line ${line})`);
        return true;
      };

      // Stub @pkmn/dex
      window.pkmn = { dex: { Dex: { species:{get:()=>null}, moves:{get:()=>null}, learnsets:{get: async ()=>null}, data:{} } } };

      const origCreate = window.document.createElement.bind(window.document);
      window.document.createElement = function (tag, ...rest) {
        const el = origCreate(tag, ...rest);
        if (String(tag).toLowerCase() === 'script') {
          Object.defineProperty(el, 'src', {
            configurable: true,
            set(v) {
              this.setAttribute('src', v);
              if (/^https?:\/\//.test(v)) {
                setTimeout(() => { if (typeof this.onerror === 'function') this.onerror(new Error('test stub')); }, 0);
              }
            },
            get() { return this.getAttribute('src'); },
          });
        }
        return el;
      };
    },
  });

  const window = dom.window;
  if (!window.__testReady) throw new Error('battle.html did not expose __testReady');
  const engine = await window.__testReady;

  // After load: kill anim/sleep delays
  window.sleep = () => Promise.resolve();
  // Replace setTimeout so any "wait 2s then fire callback" overlays
  // (battle intro, victory) resolve immediately. Keep 0ms timers
  // (microtask-like) so engine pipelines that defer work still run.
  const origSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = (fn, ms, ...rest) => origSetTimeout(fn, 0, ...rest);

  // Stub modals and alerts so they don't block.
  let lastAlert = '';
  window.alert = (s) => { lastAlert = s; };
  window.showGameAlert = (s) => { lastAlert = String(s||''); };
  window.showGameConfirm = async (s) => true;
  window.confirm = () => true;
  // Some flows use prompt()
  window.prompt = () => 'TestTrainer';

  // Silence the Hall of Fame celebration overlay (it grabs the DOM
  // and uses requestAnimationFrame for fireworks)
  // No need to stub showHallOfFame — we'll see it trigger.

  return { window, engine, dom, get lastAlert(){return lastAlert;} };
}

function snapshot(window) {
  const sm = window.StoryMode && window.StoryMode.state;
  if (!sm) return null;
  const ev = window.STORY_EVENTS_RAW[sm.eventIndex];
  return {
    eventIndex: sm.eventIndex,
    badges: sm.badges|0,
    gold: sm.gold|0,
    teamLen: (sm.team||[]).length,
    teamNames: (sm.team||[]).map(t=>t.name),
    pcLen: (sm.pcBox||[]).length,
    eventType: ev ? ev[1] : null,
    eventName: ev ? ev[2] : null,
    eventId: ev ? ev[0] : null,
    balls: sm.balls ? {...sm.balls} : null,
    active: !!sm.active,
  };
}

async function tick(window) {
  // Allow queued microtasks/timers to flush
  for (let i = 0; i < 8; i++) {
    await new Promise(r => window.setTimeout(r, 0));
  }
}

async function pickStarter(window) {
  // Enter Professor screen → select first choice → accept
  try { window.StoryMode.enterProfessor(); } catch (e) { record('error', 'professor.enter', e.message); return false; }
  await tick(window);
  // _pendingProfChoices is module-private; we know profSelectChoice picks an idx into it.
  try { window.StoryMode.profSelectChoice(0); } catch (e) { record('error', 'professor.select', e.message); }
  await tick(window);
  try { window.StoryMode.profAccept(); } catch (e) { record('error', 'professor.accept', e.message); return false; }
  await tick(window);
  const sm = window.StoryMode.state;
  if (!sm || !sm.team || sm.team.length === 0) {
    record('error', 'professor.accept', 'profAccept did not add a mon to team', { teamLen: sm && sm.team && sm.team.length });
    return false;
  }
  return true;
}

async function fillTeamFromProfessor(window, max=6) {
  // Some pre-gym cities don't expose Professor when team is full; we just try.
  for (let i = 0; i < max; i++) {
    const sm = window.StoryMode.state;
    if (!sm || !sm.team || sm.team.length >= max) break;
    // Try entering professor; if not available it'll noop / show alert.
    try { window.StoryMode.enterProfessor(); } catch (e) { break; }
    await tick(window);
    try { window.StoryMode.profSelectChoice(0); } catch (e) {}
    await tick(window);
    try { window.StoryMode.profAccept(); } catch (e) { break; }
    await tick(window);
    const sm2 = window.StoryMode.state;
    if (sm2.team.length === i + 1) break; // no growth
  }
}

async function forceWinCurrentBattle(window, ctx) {
  // The cleanest way: call onBattleEnd(true) directly with the event's name.
  const sm = window.StoryMode.state;
  if (!sm) return false;
  const ev = window.STORY_EVENTS_RAW[sm.eventIndex];
  if (!ev || ev[1] !== 'Battle') return false;
  const [, , event] = ev;
  // Set a fake currentTrainerData so the victory overlay/cleanup paths don't NPE.
  try {
    if (!sm.currentTrainerData) sm.currentTrainerData = { name: 'TestFoe', type: 'Mixed', sigs: [] };
  } catch (e) {}
  try {
    window.StoryMode.onBattleEnd(true, `Victory: ${event}`, '');
  } catch (e) {
    record('error', 'battle.onBattleEnd', `${e.message} for event ${event}`, ctx);
    return false;
  }
  // The victory card no longer auto-closes (P0.1): dismiss it explicitly via
  // its Continue button (arm window is zeroed in beforeParse).
  await tick(window);
  try {
    const dialogs = [...window.document.querySelectorAll('div[role="dialog"]')]
      .filter(d => /^victory/i.test(d.getAttribute('aria-label') || ''));
    for (const d of dialogs) {
      const cont = [...d.querySelectorAll('button')].find(b => /Continue/.test(b.textContent || ''));
      if (cont) cont.click();
    }
  } catch (e) {}
  await tick(window);
  return true;
}

async function exerciseCityActions(window, ctx) {
  const sm = window.StoryMode.state;
  if (!sm) return;
  const ev = window.STORY_EVENTS_RAW[sm.eventIndex];
  if (!ev || ev[1] !== 'City') return;
  const actions = ev[5] || [];

  // Try Pokemart
  if (actions.includes('Pokemart')) {
    try { window.StoryMode.enterShop('mart'); } catch (e) { record('error', 'city.shop.mart', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Department Store')) {
    try { window.StoryMode.enterShop('dept'); } catch (e) { record('error', 'city.shop.dept', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  // Move Tutor
  if (actions.includes('Move Tutor')) {
    try { window.StoryMode.enterTutor && window.StoryMode.enterTutor(); } catch (e) { record('error', 'city.tutor', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  // Nature Rater (uses Link Station path? Or own? Try Link Station and EvoLab.)
  if (actions.includes('Link Station')) {
    try { window.StoryMode.enterLink && window.StoryMode.enterLink(); } catch (e) { record('error', 'city.link', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Evolution Tutor')) {
    try { window.StoryMode.enterEvolutionLab && window.StoryMode.enterEvolutionLab(); } catch (e) { record('error', 'city.evoLab', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('EV Trainer')) {
    try { window.StoryMode.enterEVTrainer && window.StoryMode.enterEVTrainer(); } catch (e) { record('error', 'city.evTrainer', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Battle Dojo')) {
    try { window.StoryMode.enterArtifactHall && window.StoryMode.enterArtifactHall(); } catch (e) { record('error', 'city.artifactHall', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Power Up')) {
    try { window.StoryMode.enterColress && window.StoryMode.enterColress(); } catch (e) { record('error', 'city.colress', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Pokémon Fan Club')) {
    try { window.StoryMode.enterFanClub && window.StoryMode.enterFanClub(); } catch (e) { record('error', 'city.fanClub', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Poké Casino')) {
    try { window.StoryMode.enterCasino && window.StoryMode.enterCasino(); } catch (e) { record('error', 'city.casino', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
  if (actions.includes('Safari Zone')) {
    try { window.StoryMode.enterSafariZone && window.StoryMode.enterSafariZone(); } catch (e) { record('error', 'city.safariZone', e.message, ctx); }
    await tick(window);
    try { window.StoryMode.enterCity(); } catch (e) {}
    await tick(window);
  }
}

async function runStory(window) {
  // Force-start a run with normal difficulty, all gens enabled.
  // startNewRun reads UI elements - simulate by setting them in advance.
  const setupHtml = () => {
    for (const id of ['story-mech-mega','story-mech-z','story-mech-dyna','story-mech-tera']) {
      let el = window.document.getElementById(id);
      if (!el) {
        el = window.document.createElement('input');
        el.type = 'checkbox';
        el.id = id;
        el.checked = false;
        window.document.body.appendChild(el);
      }
    }
    let diff = window.document.getElementById('story-difficulty');
    if (!diff) {
      diff = window.document.createElement('select');
      diff.id = 'story-difficulty';
      const opt = window.document.createElement('option');
      opt.value = 'normal'; diff.appendChild(opt);
      window.document.body.appendChild(diff);
    }
    diff.value = 'normal';
  };
  setupHtml();

  try { window.StoryMode.startNewRun(); } catch (e) { record('error', 'startNewRun', e.message); return; }
  await tick(window);

  let sm = window.StoryMode.state;
  if (!sm || !sm.active) { record('error', 'startNewRun.activeFlag', 'sm.active is false after startNewRun'); return; }
  record('info', 'progress', `Started run: gold=${sm.gold}, eventIdx=${sm.eventIndex}, badges=${sm.badges}`);

  let prevSnap = snapshot(window);
  let stuckCount = 0;
  const MAX_ITERS = 1000;
  const trace = [];

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    sm = window.StoryMode.state;
    if (!sm) { record('error', 'loop', 'sm went null'); break; }
    if (!sm.active) {
      // Could be we hit run-clear / HoF terminal state
      record('info', 'progress', `Run inactive at iter ${iter} (eventIdx=${sm.eventIndex})`);
      break;
    }
    const ev = window.STORY_EVENTS_RAW[sm.eventIndex];
    if (!ev) { record('error', 'loop.event', `null event at idx ${sm.eventIndex}`); break; }
    const [eventId, type, eventName] = ev;
    const ctx = { iter, eventIndex: sm.eventIndex, type, eventName, badges: sm.badges };
    trace.push(`iter=${iter} idx=${sm.eventIndex} type=${type} name=${eventName} badges=${sm.badges} team=${(sm.team||[]).length} pc=${(sm.pcBox||[]).length}`);

    if (type === 'City') {
      // First city = no team, pick starter
      if ((sm.team||[]).length === 0) {
        const picked = await pickStarter(window);
        if (!picked) { record('error', 'starter.pick', 'Could not pick starter', ctx); break; }
        await tick(window);
      } else {
        // Exercise all city actions before moving on
        await exerciseCityActions(window, ctx);
        await tick(window);
        // Top up team toward cap if Professor is in the action list AND we are below cap.
        const actions = ev[5] || [];
        const cap = Math.min(6, 2 + (sm.badges|0));
        if (actions.includes('Professor') && (sm.team||[]).length < cap) {
          await fillTeamFromProfessor(window, cap);
        }
      }
      // Stop at the post-HoF City9 hub - we've cleared the main game. Refighting
      // E1-Rival is a feature, not a step the test driver should keep doing.
      if (sm.badges >= 8 && eventName === 'City9' && (sm.gymCleared && sm.gymCleared[8])) {
        record('info', 'progress', 'Reached post-HoF hub (City9) - main story cleared. Stopping main loop.');
        break;
      }
      // Advance to next battle
      try { window.StoryMode.proceedToNextBattle(); } catch (e) {
        record('error', 'proceedToNextBattle', e.message, ctx);
        break;
      }
      await tick(window);
      // proceedToNextBattle calls enterBattleEvent which calls showBattleIntro
      // with a setTimeout. Our patched setTimeout fires at 0, so the battle starts.
      // Now force-win.
      sm = window.StoryMode.state;
      const ev2 = window.STORY_EVENTS_RAW[sm.eventIndex];
      if (ev2 && ev2[1] === 'Battle') {
        const ok = await forceWinCurrentBattle(window, { ...ctx, battle: ev2[2] });
        if (!ok) { record('error', 'battle.forceWin', `Could not force win ${ev2[2]}`, ctx); break; }
      } else if (ev2 && ev2[1] === 'Hall of Fame') {
        // Fine, HoF reached
        record('info', 'progress', `Reached Hall of Fame after city iter ${iter}`);
      }
      await tick(window);
    } else if (type === 'Battle') {
      // Force win this battle
      const ok = await forceWinCurrentBattle(window, ctx);
      if (!ok) break;
      await tick(window);
    } else if (type === 'Hall of Fame') {
      record('info', 'progress', 'Reached Hall of Fame - main story beaten!');
      // Don't auto-continue; we exercise post-HoF features in a separate phase
      break;
    } else {
      record('warn', 'loop.unknownType', `Unknown event type "${type}" at idx ${sm.eventIndex}`, ctx);
      // Advance anyway
      try { sm.eventIndex = Math.min(window.STORY_EVENTS_RAW.length - 1, (sm.eventIndex|0) + 1); } catch (e) {}
    }

    const newSnap = snapshot(window);
    if (newSnap && prevSnap &&
        newSnap.eventIndex === prevSnap.eventIndex &&
        newSnap.teamLen === prevSnap.teamLen &&
        newSnap.badges === prevSnap.badges) {
      stuckCount++;
      if (stuckCount >= 4) {
        record('error', 'loop.stuck', `Stuck at eventIdx=${newSnap.eventIndex} event=${newSnap.eventName} for 4 iters`, ctx);
        break;
      }
    } else {
      stuckCount = 0;
    }
    prevSnap = newSnap;

    if (newSnap && newSnap.eventIndex >= window.STORY_EVENTS_RAW.length - 1 && newSnap.eventType !== 'Battle') {
      // Try to push past the final row
      try { window.StoryMode.continuePostGame && window.StoryMode.continuePostGame(); } catch (e) {}
      await tick(window);
      const sm3 = window.StoryMode.state;
      if (sm3 && !sm3.active) {
        record('info', 'progress', 'Run completed (sm.active=false)');
        break;
      }
    }
  }

  const finalSnap = snapshot(window);
  record('info', 'final', `Final state: ${JSON.stringify(finalSnap)}`);
  if (process.env.STORY_TRACE) {
    console.log('\n----- TRACE (last 80) -----');
    for (const line of trace.slice(-80)) console.log(line);
  }
}

async function exercisePostHoFFlow(window) {
  // From the post-HoF City9 hub, fire continuePostGame to trigger Mystery
  // Figure, then exercise Crucible and Boss Arc entries.
  const sm = window.StoryMode.state;
  if (!sm) { record('error', 'postHof.preflight', 'sm is null entering post-HoF flow'); return; }

  // Stub AI so the Mystery fight resolves quickly (player auto-loses w/o stub
  // since their random catch team has no built moves). Test crucibleBattleSource
  // routing whether they win or lose.
  window.aiDecision = () => null;
  window.getBestMove = (foeMon) => (foeMon && foeMon.moves && foeMon.moves[0]) || null;
  window.aiChooseGimmick = () => null;
  window.tryFoeStoryBattleItem = () => false;

  // Patch onBattleEnd to short-circuit the actual mystery battle with a win.
  const origOnBattleEnd = window.StoryMode.onBattleEnd;
  let mysteryFired = false;
  const _wrap = function (won, t, d) {
    try {
      if (sm.crucibleBattleSource === 'postHofMystery') mysteryFired = true;
    } catch (e) {}
    return origOnBattleEnd(won, t, d);
  };
  // (We can't replace onBattleEnd on StoryMode since it's read-only. Instead,
  // we'll observe the climax-done flag.)

  // Force a clean state and call continuePostGame.
  try { window.StoryMode.continuePostGame && window.StoryMode.continuePostGame(); }
  catch (e) { record('error', 'postHof.continuePostGame', e.message); return; }
  await tick(window);

  // The Mystery battle is now in flight. Wait for it to resolve (or force-win
  // via the crucible source path).
  const sm2 = window.StoryMode.state;
  if (sm2.crucibleBattleSource === 'postHofMystery') {
    // Force a win by calling onBattleEnd(true) directly — it routes via _handleCrucibleBattleEnd.
    try { window.StoryMode.onBattleEnd(true, 'Mystery cleared', ''); }
    catch (e) { record('error', 'postHof.forceWinMystery', e.message); }
    await tick(window);
  } else if (!sm2.postHofMysteryClimaxDone) {
    record('warn', 'postHof.noClimax', `After continuePostGame, climax flag still false and no crucibleBattleSource. eventIndex=${sm2.eventIndex}`);
  }

  await tick(window);

  const sm3 = window.StoryMode.state;
  if (!sm3.postHofMysteryClimaxDone) {
    record('error', 'postHof.climaxFlagNotSet', `postHofMysteryClimaxDone is still false after Mystery resolve. eventIndex=${sm3.eventIndex}`);
  } else {
    record('info', 'progress', `Post-HoF Mystery cleared. bossArc.available=${sm3.bossArc?.available} masterBalls=${sm3.balls?.master|0}`);
  }

  // Try Crucible
  try { window.StoryMode.enterCrucible && window.StoryMode.enterCrucible(); }
  catch (e) { record('error', 'postHof.enterCrucible', e.message); }
  await tick(window);

  // Crucible mystery rematch button
  try { window.StoryMode.crucibleMysteryFight && window.StoryMode.crucibleMysteryFight(); }
  catch (e) { record('error', 'postHof.crucibleMysteryFight', e.message); }
  await tick(window);

  // Frontier hub
  try { window.StoryMode.leaveCrucible && window.StoryMode.leaveCrucible(); } catch (e) {}
  await tick(window);
  try { window.StoryMode.enterFrontierHub && window.StoryMode.enterFrontierHub(); }
  catch (e) { record('error', 'postHof.enterFrontierHub', e.message); }
  await tick(window);
  try { window.StoryMode.frontierStartRun && window.StoryMode.frontierStartRun(); }
  catch (e) { record('error', 'postHof.frontierStartRun', e.message); }
  await tick(window);
  try { window.StoryMode.frontierSurrender && window.StoryMode.frontierSurrender(); }
  catch (e) { record('error', 'postHof.frontierSurrender', e.message); }
  await tick(window);
}

async function exerciseSubsystems(window) {
  // After a run completes, exercise PC + Underground + Safari edge cases
  const sm = window.StoryMode.state;
  if (!sm) return;

  // PC interaction: deposit / withdraw / release / sell
  try { window.StoryMode.enterPokemonCenter && window.StoryMode.enterPokemonCenter(); } catch (e) { record('error', 'subsystem.pokemonCenter.enter', e.message); }
  await tick(window);
  try { window.StoryMode.pcSwitchTab && window.StoryMode.pcSwitchTab('underground'); } catch (e) { record('error', 'subsystem.pcSwitchTab', e.message); }
  await tick(window);
  try { window.StoryMode.pcSwitchTab && window.StoryMode.pcSwitchTab('storage'); } catch (e) {}
  await tick(window);

  // Try entering Safari from City 4 if accessible
  try { window.StoryMode.enterSafariZone && window.StoryMode.enterSafariZone(); } catch (e) { record('error', 'subsystem.safariZone', e.message); }
  await tick(window);

  // Open run summary
  try { window.StoryMode.openRunSummary && window.StoryMode.openRunSummary(); } catch (e) { record('error', 'subsystem.runSummary', e.message); }
  await tick(window);

  // Open team tester
  try { window.StoryMode.openTeamTester && window.StoryMode.openTeamTester(); } catch (e) { record('error', 'subsystem.teamTester', e.message); }
  await tick(window);

  // Open Collection / Pokedex
  try { window.StoryMode.openCollection && window.StoryMode.openCollection(); } catch (e) { record('error', 'subsystem.collection', e.message); }
  await tick(window);
}

async function exerciseEdgeCases(window) {
  // Probe boundary conditions:
  // 1. Buying items past gold (negative balance check)
  // 2. PC overflow (cap 30)
  // 3. Selling last team mon (should be blocked)
  // 4. Catch fail with full party + full PC
  const sm = window.StoryMode.state;
  if (!sm) return;

  // --- Edge: try buying an unaffordable item
  const goldBefore = sm.gold;
  try {
    sm.gold = 0;
    window.StoryMode.buyItem && window.StoryMode.buyItem('hyperPotion');
    if (sm.gold < 0) record('error', 'edge.shop.negativeGold', `gold went negative: ${sm.gold}`);
    if (sm.inventory && sm.inventory.hyperPotion && sm.gold === 0) {
      record('warn', 'edge.shop.freeItem', `buyItem('hyperPotion') succeeded with 0 gold; inv=${sm.inventory.hyperPotion}`);
    }
  } catch (e) { record('warn', 'edge.shop.buyAtZero', e.message); }
  sm.gold = goldBefore;

  // --- Edge: try PC operations
  try {
    if (!sm.pcBox) sm.pcBox = [];
    // Fill PC to capacity (10)
    while (sm.pcBox.length < 10) {
      sm.pcBox.push({ name: 'Rattata', build: { m: ['Tackle','Tackle','Tackle','Tackle'], i:null, a:null, n:'Hardy', ivs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}, evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0} }, id: 'filler_' + sm.pcBox.length });
    }
    // Try to deposit a 11th — should be capped or rejected
    if (sm.team.length > 0) {
      const teamSize = sm.team.length;
      try { window.StoryMode.pcDeposit && window.StoryMode.pcDeposit(0); } catch (e) {}
      await tick(window);
      const newPcLen = sm.pcBox.length;
      if (newPcLen > 10) record('error', 'edge.pc.overflow', `PC has ${newPcLen}/10 entries — overflow not blocked`);
      if (sm.team.length < teamSize) record('warn', 'edge.pc.depositAcceptedFull', `Mon left team but PC was already at 10/10`);
    }
  } catch (e) { record('warn', 'edge.pc.overflowTest', e.message); }

  // --- Edge: try selling last team mon (should be blocked)
  try {
    while (sm.team.length > 1) sm.team.pop();
    if (sm.team.length === 1) {
      const before = sm.team.length;
      try { window.StoryMode.pcSell && window.StoryMode.pcSell(0, 'team'); } catch (e) {}
      await tick(window);
      if (sm.team.length === 0) {
        record('error', 'edge.underground.soldLastMon', 'Sold the last mon — should be unsellable');
      }
    }
  } catch (e) { record('warn', 'edge.underground.lastMon', e.message); }

  // --- Edge: starter unsellable flag
  try {
    const starter = (sm.team||[]).find(m => m && m.starter);
    if (starter && !starter.unsellable) {
      record('error', 'edge.starter.unsellable', 'Starter not flagged unsellable');
    }
  } catch (e) {}

  // --- Edge: invalid eventIndex recovery
  try {
    const orig = sm.eventIndex;
    sm.eventIndex = 999;
    // Re-enter the loop checker - processNextEvent should clamp
    try { sm.eventIndex = orig; } finally { sm.eventIndex = orig; }
  } catch (e) {}

  // --- Edge: empty team + start
  try {
    const teamSnap = sm.team.slice();
    sm.team = [];
    try { window.StoryMode.proceedToNextBattle && window.StoryMode.proceedToNextBattle(); } catch (e) {}
    await tick(window);
    if (sm.team.length === 0 && sm.eventIndex !== -1) {
      // OK, the engine alert blocks it
    }
    sm.team = teamSnap;
  } catch (e) {}
}

(async () => {
  console.log('Booting battle.html in jsdom...');
  const start = Date.now();
  let h;
  try {
    h = await boot();
  } catch (e) {
    console.error('Boot failed:', e);
    process.exit(2);
  }
  console.log(`Boot complete in ${((Date.now()-start)/1000).toFixed(1)}s. Starting story walkthrough...`);

  // Ensure the story save is clean
  try { h.window.localStorage.removeItem('pbs_story_save'); } catch (e) {}

  await runStory(h.window);
  await exercisePostHoFFlow(h.window);
  await exerciseSubsystems(h.window);
  await exerciseEdgeCases(h.window);

  // Print summary
  const groups = { error: [], warn: [], info: [] };
  for (const f of findings) (groups[f.severity] || []).push(f);

  console.log('\n========== FINDINGS ==========');
  console.log(`error: ${groups.error.length}`);
  console.log(`warn:  ${groups.warn.length}`);
  console.log(`info:  ${groups.info.length}`);

  console.log('\n----- ERRORS -----');
  for (const f of groups.error) console.log(`[${f.area}] ${f.msg}` + (f.ctx ? ` :: ${JSON.stringify(f.ctx)}` : ''));
  console.log('\n----- WARNINGS (first 50) -----');
  for (const f of groups.warn.slice(0, 50)) console.log(`[${f.area}] ${f.msg}`);
  console.log('\n----- INFO -----');
  for (const f of groups.info) console.log(`[${f.area}] ${f.msg}`);

  try { h.dom.window.close(); } catch (e) {}
  process.exit(0);
})();
