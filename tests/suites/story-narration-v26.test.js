// Narration overhaul (v26): guards for the travel / visual / interaction layer.
// Covers the SAVE_VER 26 migration (additive + routeShown resume back-fill), the
// sceneKey→backdrop resolver, the route flavor table, the route interstitial
// fire-once logic, courier errands (idempotent accept→complete + reward once),
// the objective thread line, and the read-only adventure journal.
// Run: node --test tests/suites/story-narration-v26.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

function installLocalStorageShim() {
    const store = new Map();
    const shim = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)); },
        removeItem: (k) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i) => [...store.keys()][i] ?? null,
        get length() { return store.size; },
    };
    Object.defineProperty(W, 'localStorage', { value: shim, configurable: true });
    return shim;
}
const LS = installLocalStorageShim();

const VALID_SCENES = ['cave', 'forest', 'safari', 'mountain', 'cavern', 'villain', 'mansion', 'league', 'sea', 'lab'];

function plantSave(extra) {
    LS.setItem('pbs_story_save', JSON.stringify(Object.assign({
        version: 25,
        active: true,
        storyLine: 'classic',
        eventIndex: 0,
        badges: 0,
        team: [{ species: 'Bulbasaur', level: 5 }],
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        settings: { minGen: 1, maxGen: 9, enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    }, extra || {})));
}

// ── Schema / migration ────────────────────────────────────────────────────
test('SAVE_VER is at least 26 (v27 bumped it for the Vibe Exchange)', () => {
    assert.ok(W.__STORY_SAVE_VER >= 26);
});

test('migrateStoryPreV26 seeds the new additive fields', () => {
    plantSave({ version: 25, eventIndex: 0 });
    W.__storyLoad();
    const sm = ST.sm;
    assert.equal(typeof sm.errands, 'object');
    assert.equal(typeof sm.npcsMet, 'object');
    assert.equal(typeof sm.journalSeen, 'object');
    assert.equal(typeof sm.routeShown, 'object');
    assert.equal(sm.version, W.__STORY_SAVE_VER);
});

test('migration back-fills routeShown for battle rows at/behind eventIndex (no stale interstitial on resume)', () => {
    // Find a battle row well into the run, plant a save sitting on it.
    const RAW = ST.STORY_EVENTS_RAW;
    let battleIdx = -1;
    for (let i = 0; i < RAW.length; i++) { if (RAW[i] && RAW[i][1] === 'Battle') { battleIdx = i; } if (battleIdx >= 0 && i > 12) break; }
    assert.ok(battleIdx > 0, 'found a battle row');
    plantSave({ version: 25, eventIndex: battleIdx });
    W.__storyLoad();
    const sm = ST.sm;
    // Every battle row at/behind eventIndex must be stamped seen.
    for (let i = 0; i <= battleIdx; i++) {
        if (RAW[i] && RAW[i][1] === 'Battle') {
            assert.equal(sm.routeShown[i], true, `routeShown[${i}] back-filled`);
        }
    }
});

// ── Scene backdrop resolver ─────────────────────────────────────────────────
test('_backdropKeyForScene resolves every villain + extra arc to a real scene key', () => {
    const villain = ST.VILLAIN_STORY_BEATS;
    const extra = ST.EXTRA_STORY_BEATS;
    for (const arc of Object.keys(villain)) {
        for (const slot of Object.values(villain[arc])) {
            if (!slot || slot.kind !== 'event') continue;
            const key = ST.backdropKeyForScene(slot.sceneKey, slot);
            assert.ok(VALID_SCENES.includes(key), `villain ${slot.sceneKey} → '${key}' is a valid scene`);
        }
    }
    for (const arc of Object.keys(extra)) {
        for (const slot of Object.values(extra[arc])) {
            if (!slot || slot.kind !== 'event') continue;
            const key = ST.backdropKeyForScene(slot.sceneKey, slot);
            assert.ok(VALID_SCENES.includes(key), `extra ${slot.sceneKey} → '${key}' is a valid scene`);
        }
    }
});

test('_backdropKeyForScene returns empty for an unknown key (keeps flat black)', () => {
    assert.equal(ST.backdropKeyForScene('totally.unknown.key', null), '');
});

// ── Route flavor table ──────────────────────────────────────────────────────
test('ROUTE_LINES covers every city→next segment with a valid scene', () => {
    // city0to1 .. city7to8 plus approachToLeague.
    for (let f = 0; f <= 7; f++) {
        const rl = ST.routeLinesFor(f, f + 1);
        assert.ok(rl, `route city${f}to${f + 1} exists`);
        assert.ok(rl.name && rl.scene && Array.isArray(rl.setOut) && Array.isArray(rl.arrive), `route city${f}to${f + 1} shaped`);
        assert.ok(VALID_SCENES.includes(rl.scene), `route city${f}to${f + 1} scene '${rl.scene}' valid`);
    }
    const league = ST.routeLinesFor(8, 9);
    assert.ok(league && league.name === 'Victory Road' && league.scene === 'league');
});

// ── Route interstitial fire-once ────────────────────────────────────────────
test('_maybeShowRouteInterstitial fires once per cross-city battle, not on resume', () => {
    const RAW = ST.STORY_EVENTS_RAW;
    // First battle row that genuinely opens a city→next-city route (per the
    // engine's own resolver), excluding the intro-rival starter duel.
    let idx = -1;
    for (let i = 1; i < RAW.length; i++) {
        const cur = RAW[i];
        if (!cur || cur[1] !== 'Battle') continue;
        // Skip the intro-rival starter duel (the interstitial deliberately
        // doesn't fire there) — find a normal trainer route-opener.
        if (String(cur[2] || '') === 'Rival') continue;
        if (ST.routeCitiesForBattle(i)) { idx = i; break; }
    }
    assert.ok(idx > 0, 'found a route-opening battle row');
    plantSave({ version: 25, eventIndex: idx });
    W.__storyLoad();
    const sm = ST.sm;
    // The migration back-fills routeShown up to eventIndex — clear this one so we
    // can exercise the live fire path as if freshly arriving.
    delete sm.routeShown[idx];
    sm.eventIndex = idx;
    const fired1 = ST.maybeShowRouteInterstitial(RAW[idx], () => {});
    assert.equal(fired1, true, 'fires the first time');
    assert.equal(sm.routeShown[idx], true, 'stamped before render');
    const fired2 = ST.maybeShowRouteInterstitial(RAW[idx], () => {});
    assert.equal(fired2, false, 'does not replay once stamped (resume-safe)');
});

// ── Courier errands ─────────────────────────────────────────────────────────
test('errand accept→complete is idempotent and grants the reward exactly once', () => {
    plantSave({ version: 25, eventIndex: 0 });
    W.__storyLoad();
    const sm = ST.sm;
    const errs = ST.STORY_ERRANDS;
    assert.ok(errs.length, 'errand defs loaded');
    const goldErr = errs.find(e => e.reward && typeof e.reward.gold === 'number');
    assert.ok(goldErr, 'a gold-reward errand exists');
    const startGold = sm.gold | 0;

    assert.equal(ST.acceptErrand(goldErr.id), true, 'accept succeeds');
    assert.equal(sm.errands[goldErr.id].state, 'active');
    assert.equal(ST.acceptErrand(goldErr.id), false, 'double-accept is a no-op');

    assert.equal(ST.completeErrand(goldErr.id), true, 'complete succeeds');
    assert.equal(sm.errands[goldErr.id].state, 'done');
    assert.equal(sm.gold | 0, startGold + (goldErr.reward.gold | 0), 'reward granted once');
    assert.equal(ST.completeErrand(goldErr.id), false, 'double-complete is a no-op');
    assert.equal(sm.gold | 0, startGold + (goldErr.reward.gold | 0), 'no second grant');
    // NPC recorded.
    assert.ok(sm.npcsMet[goldErr.npc.id], 'npc recorded on accept');
});

// ── Objective line + journal ────────────────────────────────────────────────
test('_storyThreadObjectiveLine reflects badge count + threads, deterministically', () => {
    plantSave({ version: 25, eventIndex: 0, badges: 3 });
    W.__storyLoad();
    const line = ST.storyThreadObjectiveLine();
    assert.match(line, /Badge 3\/8/);
    // Same inputs → same output.
    assert.equal(line, ST.storyThreadObjectiveLine());
    // P0.7: thread status is phrased ("Rumors of Team Aqua on the road"),
    // never the raw debug-flag form ("Aqua: stirring").
    assert.ok(!/:\s*(stirring|unfolding|resolved)/.test(line),
      `no raw status words in the subline: "${line}"`);
});

test('_journalRenderHTML lists badges + threads without mutating sm', () => {
    plantSave({ version: 25, eventIndex: 0, badges: 2 });
    W.__storyLoad();
    const sm = ST.sm;
    const before = JSON.stringify({ e: sm.errands, n: sm.npcsMet, f: sm.storyEventsFired });
    const html = ST.journalRenderHTML();
    assert.match(html, /Badges/);
    assert.match(html, /2 \/ 8/);
    // The 2026-06 3-track redesign labels the stories Main / Villain · / Mystery ·
    // (replacing the old "<arc> thread" heading). The Main spine is static, so it
    // always renders.
    assert.match(html, /Main Story/);
    assert.equal(JSON.stringify({ e: sm.errands, n: sm.npcsMet, f: sm.storyEventsFired }), before, 'journal render did not mutate sm');
});

// ── Branching encounters (label index over the EXISTING authored choices) ────
test('STORY_CHOICE_LABELS indexes every authored act.choice persistKey', () => {
    const labels = ST.STORY_CHOICE_LABELS;
    const scenes = ST.STORY_SCENES;
    // Collect every authored choice persistKey from STORY_SCENES.
    const authored = new Set();
    for (const sk in scenes) {
        const sc = scenes[sk];
        if (!sc || !Array.isArray(sc.acts)) continue;
        for (const act of sc.acts) {
            if (act && act.choice && act.choice.persistKey) authored.add(act.choice.persistKey);
        }
    }
    assert.ok(authored.size > 0, 'the scenes ship authored choices');
    for (const pk of authored) {
        assert.ok(labels[pk], `choice label registered for ${pk}`);
        assert.ok(labels[pk].prompt, `label ${pk} has a prompt`);
        assert.ok(Object.keys(labels[pk].options).length > 0, `label ${pk} has option text`);
    }
});

test('the branch engine resolves an authored consequence from a prior pick', () => {
    plantSave({ version: 25, eventIndex: 0 });
    W.__storyLoad();
    const sm = ST.sm;
    const scenes = ST.STORY_SCENES;
    // Find any scene act that branches on a choice key, plus that key's pick values.
    let branchAct = null, key = null, eqValues = [];
    for (const sk in scenes) {
        const sc = scenes[sk];
        if (!sc || !Array.isArray(sc.acts)) continue;
        for (const act of sc.acts) {
            if (act && Array.isArray(act.branches)) {
                const withWhen = act.branches.find(b => b && b.when && b.when.key);
                if (withWhen) { branchAct = act; key = withWhen.when.key; eqValues = act.branches.filter(b => b && b.when).map(b => b.when.eq); break; }
            }
        }
        if (branchAct) break;
    }
    assert.ok(branchAct && key, 'found an authored branch act');
    if (!sm.storyChoices) sm.storyChoices = {};
    // A matching pick yields that branch's lines; clearing yields the default.
    sm.storyChoices[key] = eqValues[0];
    const picked = ST.resolveActLines(branchAct);
    delete sm.storyChoices[key];
    const def = ST.resolveActLines(branchAct);
    assert.ok(Array.isArray(picked) && picked.length, 'branch resolves lines for a pick');
    assert.ok(Array.isArray(def), 'default branch resolves (when-less) lines');
    assert.notDeepEqual(picked, def, 'the pick changes the rendered lines');
});

// ── Recap ───────────────────────────────────────────────────────────────────
test('_storyRecapLines summarizes fired thread beats (and is empty on a fresh run)', () => {
    plantSave({ version: 25, eventIndex: 0 });
    W.__storyLoad();
    const sm = ST.sm;
    sm.storyEventsFired = {};
    assert.equal(ST.storyRecapLines().length, 0, 'no recap on a fresh run');
    // Mark a rocket beat fired → recap should mention the Rocket thread.
    const beats = ST.VILLAIN_STORY_BEATS['rocket'];
    const firstEvent = Object.values(beats).find(b => b && b.kind === 'event');
    sm.storyEventsFired[firstEvent.sceneKey] = true;
    const lines = ST.storyRecapLines();
    assert.ok(lines.length >= 1, 'recap has content');
    assert.ok(lines.join(' ').match(/Rocket/), 'recap names the Rocket thread');
});
