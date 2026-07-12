// Shared Playwright audit rig for battle.html UI/UX audit.
// Usage from any script:  import { launch, VIEWPORTS, snap, runChecks, bootStory } from './audit-lib.mjs'
import { chromium } from 'playwright';

export const URL = 'http://127.0.0.1:8787/battle.html';
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop:  { width: 1280, height: 720 },
  tablet:  { width: 820,  height: 1180 },   // iPad Air portrait — the known "tablet gap"
  tabletL: { width: 1180, height: 820 },
  phone:   { width: 390,  height: 844 },    // iPhone 14
  phoneS:  { width: 360,  height: 740 },    // small Android
  phoneL:  { width: 844,  height: 390 },    // phone landscape
};

export async function launch(viewport = VIEWPORTS.desktop, { touch = false, harness = true } = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const ctx = await browser.newContext({
    viewport,
    hasTouch: touch,
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  // harness=true exposes window.__storyTest (sm getter/setter + facility entry fns) and
  // makes sleeps instant — static layout is unchanged; fades/particles are suppressed.
  // Pass harness=false for a pure player-eye view (menu/draft/battle reachable via UI).
  if (harness) await page.addInitScript(() => { window.__testHarness = true; });
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // Wait for app boot (loading overlay gone / menu screen present)
  await page.waitForSelector('#screen-menu', { state: 'attached', timeout: 30000 });
  await page.waitForFunction(() => {
    const o = document.getElementById('app-loading-overlay');
    return !o || o.classList.contains('hidden') || getComputedStyle(o).display === 'none' || o.style.display === 'none';
  }, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);
  return { browser, ctx, page };
}

// Inject a minimal-but-valid story save state directly (uses window.__storyTest sm setter),
// then re-render. Pass eventIndex to position along the timeline; overrides merge into sm.
export async function bootStory(page, { eventIndex = 3, overrides = {} } = {}) {
  await page.evaluate(({ eventIndex, overrides }) => {
    const ST = window.__storyTest;
    const INTROS = { mart:1,tutor:1,nature:1,evolab:1,stoneShop:1,link:1,fanclub:1,dept:1,casino:1,dojo:1,evtrainer:1,colress:1,artifacts:1,safari:1,center:1,relic:1,bag:1,party:1 };
    ST.sm = Object.assign({
      active: true, badges: 1, gold: 4500, runSeed: 7,
      team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 } } }],
      settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
      eventIndex, trainerAssignments: {}, inventory: {},
      facilityIntros: { ...INTROS }, facilitiesSeen: { ...INTROS },
      profUsed: {0:true,1:true,2:true}, npcStageSeen: { tutor:9, evolab:9, dojo:9 },
      gymCleared: {}, rivalEncounterLog: [], trainerName: 'Tester', storyLine: 'classic',
    }, overrides);
  }, { eventIndex, overrides });
}

export async function visibleScreens(page) {
  return page.evaluate(() => [...document.querySelectorAll('.screen:not(.hidden),.modal:not(.hidden)')].map(e => e.id));
}

// Click through DIY fixed overlays (cold open, recap, arrival cards, tutorial scenes…)
// until `expectId` (screen or modal id) is the visible surface, or maxClicks reached.
// Returns {ok, clicked:[labels]} — inspect `clicked` to know which scenes fired.
export async function dismissOverlays(page, expectId, maxClicks = 12) {
  const clicked = [];
  for (let i = 0; i < maxClicks; i++) {
    const res = await page.evaluate((expectId) => {
      const vis = [...document.querySelectorAll('.screen:not(.hidden),.modal:not(.hidden)')].map(e => e.id);
      // an overlay is a direct body child, fixed, visible, above screens
      const overlays = [...document.body.children].filter(e => {
        if (e.id && /^screen-|^modal-/.test(e.id)) return false;
        const s = getComputedStyle(e);
        return (s.position === 'fixed' || s.position === 'absolute') && e.offsetHeight > 40 && s.display !== 'none' && s.visibility !== 'hidden';
      });
      const top = overlays[overlays.length - 1];
      if (top) {
        const btn = [...top.querySelectorAll('button, [role="button"]')].find(b => b.offsetHeight > 0);
        if (btn) { const t = (btn.textContent || '').trim(); btn.click(); return { state: 'clicked', label: t }; }
        // click the overlay itself (some dismiss on background click)
        top.click(); return { state: 'clicked', label: '(overlay bg)' };
      }
      if (!expectId || vis.includes(expectId)) return { state: 'done', vis };
      return { state: 'waiting', vis };
    }, expectId);
    if (res.state === 'clicked') { clicked.push(res.label); await page.waitForTimeout(350); continue; }
    if (res.state === 'done') return { ok: true, clicked, visible: res.vis };
    await page.waitForTimeout(350);
    if (res.state === 'waiting' && i > 3) return { ok: false, clicked, visible: res.vis };
  }
  return { ok: false, clicked };
}

export async function snap(page, outPath) {
  await page.screenshot({ path: outPath, fullPage: false });
}

// Programmatic UI checks on the CURRENTLY VISIBLE screen. Returns JSON-able report.
export async function runChecks(page, screenName) {
  return await page.evaluate((screenName) => {
    const vw = innerWidth, vh = innerHeight;
    const report = { screen: screenName, viewport: `${vw}x${vh}`, issues: [], fontSizes: {}, fontFamilies: {}, buttonClasses: {} };
    const push = (type, sel, detail) => report.issues.push({ type, sel, detail });
    const cssPath = (el) => {
      const bits = [];
      for (let n = el; n && n.nodeType === 1 && bits.length < 4; n = n.parentElement) {
        let b = n.tagName.toLowerCase();
        if (n.id) { bits.unshift(b + '#' + n.id); break; }
        const cls = String(n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        if (cls) b += '.' + cls;
        bits.unshift(b);
      }
      return bits.join('>');
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity || '1') > 0.05;
    };
    // luminance/contrast helpers
    const parse = (c) => { const m = c.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
    const lum = ([r,g,b]) => { const f = v => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
    const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0.6) return c; } return [16,18,26,1]; };
    const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };

    // body horizontal scroll
    if (document.documentElement.scrollWidth > vw + 2 || document.body.scrollWidth > vw + 2)
      push('page-hscroll', 'body', `scrollWidth ${document.body.scrollWidth} > viewport ${vw}`);

    const els = [...document.querySelectorAll('body *')].filter(visible);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      // element poking out of viewport horizontally
      if (r.right > vw + 4 && r.width < vw * 2) push('viewport-overflow-x', cssPath(el), `right=${Math.round(r.right)} vw=${vw}`);
      // clipped text (scrollWidth > clientWidth, overflow hidden, no ellipsis)
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (hasText && el.scrollWidth > el.clientWidth + 3 && s.overflowX !== 'visible' && s.textOverflow !== 'ellipsis')
        push('text-clipped-x', cssPath(el), `sw=${el.scrollWidth} cw=${el.clientWidth} text="${el.textContent.trim().slice(0,60)}"`);
      if (hasText && el.scrollHeight > el.clientHeight + 6 && /hidden|clip/.test(s.overflowY))
        push('text-clipped-y', cssPath(el), `sh=${el.scrollHeight} ch=${el.clientHeight} text="${el.textContent.trim().slice(0,60)}"`);
      // font inventory
      if (hasText) {
        report.fontSizes[s.fontSize] = (report.fontSizes[s.fontSize] || 0) + 1;
        const fam = s.fontFamily.split(',')[0].replace(/["']/g, '');
        report.fontFamilies[fam] = (report.fontFamilies[fam] || 0) + 1;
        // tiny text
        if (parseFloat(s.fontSize) < 10) push('tiny-font', cssPath(el), `${s.fontSize} "${el.textContent.trim().slice(0,40)}"`);
        // contrast (only leaf-ish text nodes)
        const fg = parse(s.color);
        if (fg && fg[3] > 0.4) {
          const ratio = contrast(fg.slice(0,3), bgOf(el).slice(0,3));
          const px = parseFloat(s.fontSize), bold = parseInt(s.fontWeight, 10) >= 700;
          const large = px >= 24 || (px >= 18.66 && bold);
          const min = large ? 3 : 4.5;
          if (ratio < min && !el.closest('[disabled],[aria-disabled="true"],.disabled'))
            push('low-contrast', cssPath(el), `ratio=${ratio.toFixed(2)} fs=${s.fontSize} color=${s.color} text="${el.textContent.trim().slice(0,40)}"`);
        }
      }
      // small tap targets on interactive elements
      if (el.matches('button, a, [role="button"], input, select, [onclick], [tabindex]:not([tabindex="-1"])')) {
        if ((r.width < 32 || r.height < 32) && r.width > 2)
          push('small-tap-target', cssPath(el), `${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,30)}"`);
        if (el.tagName === 'BUTTON') {
          const cls = String(el.className).trim().split(/\s+/)[0] || '(none)';
          report.buttonClasses[cls] = (report.buttonClasses[cls] || 0) + 1;
        }
        // focusable without accessible name
        const name = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || (el.labels && el.labels.length);
        if (!name && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') push('no-accessible-name', cssPath(el), el.outerHTML.slice(0, 120));
      }
    }
    // overlap detection between sibling interactive elements (misalignment signal)
    const btns = els.filter(e => e.matches('button, [role="button"]'));
    for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
      const a = btns[i].getBoundingClientRect(), b = btns[j].getBoundingClientRect();
      if (btns[i].contains(btns[j]) || btns[j].contains(btns[i])) continue;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 6 && oy > 6) { push('overlap', cssPath(btns[i]) + ' ~ ' + cssPath(btns[j]), `${Math.round(ox)}x${Math.round(oy)}px overlap`); break; }
    }
    // dedupe by type+sel
    const seen = new Set();
    report.issues = report.issues.filter(i => { const k = i.type + '|' + i.sel; if (seen.has(k)) return false; seen.add(k); return true; });
    return report;
  }, screenName);
}
