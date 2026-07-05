/**
 * Online PvP: Supabase-backed room code, draft sync, host-authoritative battle snapshots.
 * Depends: global supabase from UMD bundle, window.__PBS_SUPABASE_* from online-config.js
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'pbs_online_display_name';

    let client = null;
    let roomId = null;
    let roomCode = null;
    let role = null; // 1 host (P1), 2 guest (P2)
    let channel = null;
    let lastRemoteSeq = 0;
    let hostStartedBattle = false;
    let pushDataQueue = Promise.resolve();
    let remoteRowQueue = Promise.resolve();
    let hostResolving = false;
    // Highest battle turn the host has already resolved locally. Fences
    // consumeRemoteForHost / the guest-timeout path against re-resolving a turn
    // we already advanced past (a re-delivered row, or a timeout racing a real
    // pick). Reset to 0 at battle start (afterHostStartBattle) and in dispose().
    let hostLastResolvedTurn = 0;
    // Per-room caller token (ISSUE-020). Host receives this from
    // try_create_pvp_room; guest receives a different one from
    // try_join_pvp_room. All subsequent writes go through pvp_push_data
    // which validates the token server-side. Cleared in dispose().
    let roomToken = null;

    // Supabase JS SDK is loaded lazily (only when Online PvP is actually entered) so the
    // offline/first-paint boot path carries no third-party script. Memoized: concurrent callers
    // share one load; a failed load resets so a later retry can re-attempt.
    let _sdkLoadPromise = null;
    const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

    function configured() {
        const u = global.__PBS_SUPABASE_URL;
        const k = global.__PBS_SUPABASE_ANON_KEY;
        const ks = k != null ? String(k) : '';
        if (!u || !k) return false;
        if (String(u).includes('YOUR_PROJECT')) return false;
        if (ks.includes('YOUR_ANON') || ks.includes('YOUR_PROJECT') || ks === 'YOUR_ANON_OR_PUBLISHABLE_KEY') return false;
        return ks.length > 20;
    }

    function getClient() {
        if (client) return client;
        if (!global.supabase || !global.supabase.createClient) {
            console.warn('[OnlinePvP] Supabase JS not loaded');
            return null;
        }
        if (!configured()) return null;
        client = global.supabase.createClient(global.__PBS_SUPABASE_URL, global.__PBS_SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        return client;
    }

    function randomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let s = '';
        for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    }

    function mergeData(prev, patch) {
        const base = prev && typeof prev === 'object' ? deepClone(prev) : {};
        return Object.assign(base, patch);
    }

    async function fetchRoomByCode(code) {
        const sb = getClient();
        if (!sb) return { error: 'not_configured' };
        const c = String(code || '').trim().toUpperCase();
        if (c.length < 4) return { error: 'bad_code' };
        // Explicit columns (not '*'): the token columns added in migration 006
        // are SELECT-revoked for anon, and the client never needs them.
        const { data, error } = await sb.from('pvp_rooms').select('id, code, data, updated_at').eq('code', c).maybeSingle();
        if (error) return { error: error.message };
        if (!data) return { error: 'not_found' };
        return { room: data };
    }

    function deepClone(o) {
        return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
    }

    /** Keys copied from host settings into match contract (guest must not use local settings). */
    function buildMatchOptionsFromSettings(settings) {
        if (!settings) return {};
        return {
            animations: !!settings.animations,
            musicEnabled: !!settings.musicEnabled,
            soundEnabled: !!settings.soundEnabled,
            weatherAnimation: !!settings.weatherAnimation,
            terrainBackground: !!settings.terrainBackground,
            draftGrades: Array.isArray(settings.draftGrades) ? deepClone(settings.draftGrades) : [1, 2, 3, 4],
            mechanics: settings.mechanics ? deepClone(settings.mechanics) : {},
            classicMode: !!settings.classicMode,
            randomWeather: !!settings.randomWeather,
            randomTerrain: !!settings.randomTerrain,
            partySize: settings.partySize,
            pvpBattleItems: !!settings.pvpBattleItems,
            battleLogDock: !!settings.battleLogDock,
            minGen: null,
            maxGen: null,
            timer_preset: (settings && settings.timer_preset) || 'none'
        };
    }

    function applyMatchOptionsToSettings(match, settings) {
        if (!match || !settings) return;
        Object.keys(match).forEach((k) => {
            if (k === 'minGen' || k === 'maxGen') return;
            if (k === 'timer_preset') {
                global.__onlineMatchTimerPreset = match.timer_preset === 'fast' || match.timer_preset === 'slow' ? match.timer_preset : 'none';
                return;
            }
            if (k === 'match_format') {
                global.__onlineMatchFormat = (match.match_format === 3 || match.match_format === 5) ? match.match_format : 1;
                return;
            }
            if (match[k] !== undefined) settings[k] = match[k];
        });
    }

    function exportBattleSnapshot(state) {
        const revealed = state.revealedFoe && state.revealedFoe instanceof Set
            ? Array.from(state.revealedFoe)
            : (Array.isArray(state.revealedFoe) ? state.revealedFoe : []);
        const snap = {
            turnNumber: state.turnNumber,
            isOver: !!state.isOver,
            isLocked: !!state.isLocked,
            weather: state.weather,
            weatherTurns: state.weatherTurns,
            terrain: state.terrain,
            terrainTurns: state.terrainTurns,
            trickRoom: state.trickRoom,
            gravity: state.gravity,
            magicRoom: state.magicRoom,
            wonderRoom: state.wonderRoom,
            pSide: deepClone(state.pSide),
            fSide: deepClone(state.fSide),
            usedMega: state.usedMega,
            usedZ: state.usedZ,
            usedDyna: state.usedDyna,
            usedTera: state.usedTera,
            fUsedMega: state.fUsedMega,
            fUsedZ: state.fUsedZ,
            fUsedDyna: state.fUsedDyna,
            fUsedTera: state.fUsedTera,
            p1GimmickIntent: state.p1GimmickIntent ? deepClone(state.p1GimmickIntent) : null,
            p2GimmickIntent: state.p2GimmickIntent ? deepClone(state.p2GimmickIntent) : null,
            playerParty: deepClone(state.playerParty),
            foeParty: deepClone(state.foeParty),
            pActiveName: state.pActive && state.pActive.name,
            fActiveName: state.fActive && state.fActive.name,
            pActiveIndex: (() => {
                const arr = state.playerParty;
                if (!arr || !state.pActive) return 0;
                const i = arr.indexOf(state.pActive);
                return i >= 0 ? i : 0;
            })(),
            fActiveIndex: (() => {
                const arr = state.foeParty;
                if (!arr || !state.fActive) return 0;
                const i = arr.indexOf(state.fActive);
                return i >= 0 ? i : 0;
            })(),
            revealedFoe: revealed,
            score: state.score,
            pendingEoT: !!state.pendingEoT,
            residualPhaseComplete: !!state.residualPhaseComplete,
            currentPlayer: (state.currentPlayer === 2 ? 2 : 1)
        };
        return JSON.stringify(snap);
    }

    function applyBattleSnapshot(state, jsonStr) {
        let o;
        try {
            o = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[OnlinePvP] applyBattleSnapshot invalid JSON', e);
            return false;
        }
        state.turnNumber = o.turnNumber;
        state.isOver = o.isOver;
        state.isLocked = o.isLocked;
        state.weather = o.weather;
        state.weatherTurns = o.weatherTurns;
        state.terrain = o.terrain;
        state.terrainTurns = o.terrainTurns;
        state.trickRoom = o.trickRoom;
        state.gravity = o.gravity;
        state.magicRoom = o.magicRoom;
        state.wonderRoom = o.wonderRoom;
        state.pSide = o.pSide;
        state.fSide = o.fSide;
        state.usedMega = o.usedMega; state.usedZ = o.usedZ; state.usedDyna = o.usedDyna; state.usedTera = o.usedTera;
        state.fUsedMega = o.fUsedMega; state.fUsedZ = o.fUsedZ; state.fUsedDyna = o.fUsedDyna; state.fUsedTera = o.fUsedTera;
        state.p1GimmickIntent = o.p1GimmickIntent;
        state.p2GimmickIntent = o.p2GimmickIntent;
        state.playerParty = o.playerParty;
        state.foeParty = o.foeParty;
        const pp = state.playerParty || [];
        const fp = state.foeParty || [];
        const pi = typeof o.pActiveIndex === 'number' ? o.pActiveIndex : -1;
        const fi = typeof o.fActiveIndex === 'number' ? o.fActiveIndex : -1;
        if (pi >= 0 && pi < pp.length) state.pActive = pp[pi];
        else state.pActive = pp.find((m) => m && m.name === o.pActiveName) || pp[0];
        if (fi >= 0 && fi < fp.length) state.fActive = fp[fi];
        else state.fActive = fp.find((m) => m && m.name === o.fActiveName) || fp[0];
        state.revealedFoe = new Set(o.revealedFoe || []);
        state.score = o.score || 0;
        state.pendingEoT = !!o.pendingEoT;
        state.residualPhaseComplete = !!o.residualPhaseComplete;
        state.p1Action = null;
        state.p2Action = null;
        state.currentPlayer = (typeof o.currentPlayer === 'number' && o.currentPlayer === 2) ? 2 : 1;
        return true;
    }

    function simpleHash(str) {
        let h = 5381;
        for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
        return (h >>> 0).toString(16);
    }

    function captureBattleLogHtml() {
        try {
            const el = global.document && global.document.getElementById('battle-log');
            return el ? el.innerHTML : '';
        } catch (e) {
            return '';
        }
    }

    // Sanitize HTML coming off the wire before injecting into the local battle log.
    // The server-side RLS lets any client with the room id update the `data` jsonb,
    // and the legacy `battle_log_html` field was originally set to innerHTML raw —
    // a peer that flips a single character of html could inject script into the
    // host's DOM. We block the common script-injection vectors below; legitimate
    // battle-log content is plain text + <br> + a small set of <span class="...">.
    // Allowlist sanitizer (replaces the old denylist of regex strips). The
    // legitimate battle log is plain text + <br> + a small set of
    // <span class="..."> / <div class="..."> / <b>/<i>/<strong>/<em>. We parse
    // the untrusted HTML into an INERT <template> (its content is a detached
    // DocumentFragment — scripts never run and <img>/<source> never fetch, so
    // even building the tree can't fire an onerror payload), then walk it and
    // keep only allowlisted tags, dropping every attribute except a class whose
    // value is a safe token list. Anything else collapses to its text content.
    const _LOG_ALLOWED_TAGS = { BR: 1, SPAN: 1, DIV: 1, B: 1, I: 1, STRONG: 1, EM: 1, SMALL: 1 };
    // Disallowed elements normally collapse to their plain text so a stray
    // formatting tag still shows its words. These carry script/style/markup as
    // their text content, so drop them (and their whole subtree) entirely
    // rather than surfacing that text in the battle log.
    const _LOG_DROP_SUBTREE = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, NOSCRIPT: 1, TEMPLATE: 1, LINK: 1, META: 1, TITLE: 1, HEAD: 1, SVG: 1, MATH: 1 };
    const _LOG_CLASS_RE = /^[\w \-]{0,160}$/;
    function sanitizeBattleLogHtml(raw) {
        if (typeof raw !== 'string') return '';
        const doc = global.document;
        // No DOM (defensive / non-browser): strip every tag, keep text.
        if (!doc || typeof doc.createElement !== 'function') {
            return raw.replace(/<[^>]*>/g, '');
        }
        let tpl;
        try { tpl = doc.createElement('template'); tpl.innerHTML = raw; }
        catch (e) { return raw.replace(/<[^>]*>/g, ''); }
        const root = tpl.content || tpl;
        const walk = (node) => {
            const kids = Array.prototype.slice.call(node.childNodes || []);
            for (const child of kids) {
                if (child.nodeType === 3) continue; // text node — safe
                if (child.nodeType === 1) {
                    if (!_LOG_ALLOWED_TAGS[child.tagName]) {
                        if (_LOG_DROP_SUBTREE[child.tagName]) {
                            // Dangerous container → drop the element and its subtree.
                            node.removeChild(child);
                        } else {
                            // Disallowed but benign → replace with its plain text.
                            node.replaceChild(doc.createTextNode(child.textContent || ''), child);
                        }
                        continue;
                    }
                    for (const attr of Array.prototype.slice.call(child.attributes || [])) {
                        const name = (attr.name || '').toLowerCase();
                        if (name === 'class' && _LOG_CLASS_RE.test(attr.value || '')) continue;
                        child.removeAttribute(attr.name);
                    }
                    walk(child);
                } else {
                    // Comments, processing instructions, etc. → drop entirely.
                    node.removeChild(child);
                }
            }
        };
        try { walk(root); } catch (e) { return raw.replace(/<[^>]*>/g, ''); }
        return tpl.innerHTML !== undefined ? tpl.innerHTML : (root.innerHTML || '');
    }

    function applyBattleLogHtml(html) {
        if (html === undefined || html === null) return;
        try {
            const el = global.document && global.document.getElementById('battle-log');
            if (!el) return;
            el.innerHTML = sanitizeBattleLogHtml(typeof html === 'string' ? html : '');
            el.scrollTop = el.scrollHeight;
        } catch (e) { console.debug('[OnlinePvP] applyBattleLogHtml swallowed', e); }
    }

    async function reportWinIfConfigured(winnerIsP1) {
        const sb = getClient();
        if (!sb || !roomId) return;
        try {
            const n = (global.localStorage.getItem(STORAGE_KEY) || '').trim() || 'Trainer';
            const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).maybeSingle();
            if (rowErr) {
                console.warn('[OnlinePvP] leaderboard room fetch', rowErr);
                return;
            }
            const d = row && row.data ? row.data : {};
            const winnerName = winnerIsP1 ? (d.host_display_name || n) : (d.guest_display_name || n);
            if (!winnerName) return;
            const { error: rpcErr } = await sb.rpc('increment_pvp_leaderboard_win', { p_name: winnerName });
            if (rpcErr) {
                console.warn('[OnlinePvP] leaderboard increment (run migration 003 if missing)', rpcErr);
            }
        } catch (e) {
            console.warn('[OnlinePvP] leaderboard skip', e);
        }
    }

    const OnlineBattle = {
        isActive() {
            return !!roomId && !!role;
        },
        isHost() {
            return role === 1;
        },
        getRole() {
            return role;
        },
        getCode() {
            return roomCode;
        },
        myTurn(state) {
            if (!this.isActive() || !state || state.mode !== 'pvp') return true;
            const cp = state.currentPlayer;
            return (cp === 1 && role === 1) || (cp === 2 && role === 2);
        },
        waitingOnOpponent(state) {
            return this.isActive() && state && state.mode === 'pvp' && !this.myTurn(state) && !state.isLocked;
        },

        // Lazily inject the Supabase UMD bundle. Returns Promise<boolean> (true once
        // global.supabase.createClient is available). Call before any room create/join.
        ensureSdk() {
            if (global.supabase && global.supabase.createClient) return Promise.resolve(true);
            if (_sdkLoadPromise) return _sdkLoadPromise;
            _sdkLoadPromise = new Promise((resolve) => {
                try {
                    const doc = global.document;
                    if (!doc || !doc.head) { resolve(false); return; }
                    const s = doc.createElement('script');
                    s.src = SUPABASE_SDK_URL;
                    s.async = true;
                    s.onload = () => {
                        const ok = !!(global.supabase && global.supabase.createClient);
                        if (!ok) _sdkLoadPromise = null;
                        resolve(ok);
                    };
                    s.onerror = () => { _sdkLoadPromise = null; resolve(false); };
                    doc.head.appendChild(s);
                } catch (e) {
                    _sdkLoadPromise = null;
                    resolve(false);
                }
            });
            return _sdkLoadPromise;
        },

        applyHostMatchOptions(settings) {
            const sb = getClient();
            if (!sb || !roomId) return;
            sb.from('pvp_rooms').select('data').eq('id', roomId).maybeSingle().then(({ data: row, error }) => {
                if (error) {
                    console.warn('[OnlinePvP] applyHostMatchOptions', error);
                    return;
                }
                const d = row && row.data ? row.data : {};
                if (d.match_options) applyMatchOptionsToSettings(d.match_options, settings);
                if (d.match_options && d.match_options.timer_preset !== undefined) {
                    global.__onlineMatchTimerPreset = d.match_options.timer_preset === 'fast' || d.match_options.timer_preset === 'slow' ? d.match_options.timer_preset : 'none';
                }
                if (Array.isArray(d.enabledGens) && d.enabledGens.length && typeof global.setDraftGenCheckboxes === 'function') {
                    global.setDraftGenCheckboxes(d.enabledGens);
                } else if (typeof d.minGen === 'number' && typeof d.maxGen === 'number' && typeof global.setDraftGenCheckboxes === 'function' && typeof global.rangeToEnabledGens === 'function') {
                    global.setDraftGenCheckboxes(global.rangeToEnabledGens(d.minGen, d.maxGen));
                }
            }).catch((e) => console.warn('[OnlinePvP] applyHostMatchOptions', e));
        },

        async createRoom(matchOptions, enabledGens, poolPayload) {
            const sb = getClient();
            if (!sb) throw new Error('Supabase not configured');
            const eg = (enabledGens && enabledGens.length)
                ? [...new Set(enabledGens)].filter((g) => g >= 1 && g <= 9).sort((a, b) => a - b)
                : [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const minGen = Math.min(...eg);
            const maxGen = Math.max(...eg);
            const hostName = (global.localStorage.getItem(STORAGE_KEY) || '').trim() || 'Host';
            const seq = 1;
            const data = {
                seq,
                phase: 'draft',
                match_options: matchOptions,
                enabledGens: eg,
                minGen,
                maxGen,
                host_display_name: hostName,
                guest_display_name: null,
                p1_pool: (poolPayload && poolPayload.p1_pool != null) ? poolPayload.p1_pool : [],
                p2_pool: (poolPayload && poolPayload.p2_pool != null) ? poolPayload.p2_pool : [],
                p1_draft: [],
                p2_draft: [],
                draft_turn: 1,
                guest_joined: false,
                draft_deadline_iso: null,
                battle_turn_deadline_iso: null,
                p1_wins: 0,
                p2_wins: 0,
                round_number: 1,
                battle: {
                    pending_turn: 1,
                    p1_pick: null,
                    p2_pick: null,
                    p1_gimmick: null,
                    p2_gimmick: null,
                    resolved_turn: 0,
                    state_blob: null,
                    state_hash: null
                }
            };
            // Mint the room via try_create_pvp_room RPC. The RPC generates
            // the host_token server-side and embeds it in `data` so the host
            // can prove ownership for subsequent pvp_push_data calls. Pre-fix
            // (migration 004 / direct INSERT) any anon client with the room
            // id could clobber the row's `data` jsonb. Retry on duplicate_code
            // matches the pre-fix collision behavior.
            let rpcRes = null;
            let lastErr = null;
            for (let attempt = 0; attempt < 8; attempt++) {
                roomCode = randomCode();
                const { data: r, error: rpcErr } = await sb.rpc('try_create_pvp_room', { p_code: roomCode, p_data: data });
                if (rpcErr) { lastErr = rpcErr; throw rpcErr; }
                if (r && r.ok) { rpcRes = r; break; }
                if (r && r.error === 'duplicate_code') { lastErr = new Error('duplicate_code'); continue; }
                throw new Error('try_create_pvp_room: ' + ((r && r.error) || 'unknown'));
            }
            if (!rpcRes) throw lastErr || new Error('Could not create room (code collision).');
            roomId = rpcRes.id;
            roomToken = rpcRes.host_token;
            role = 1;
            lastRemoteSeq = seq;
            this._subscribe();
            return { roomId, code: roomCode };
        },

        async joinRoom(code, guestName) {
            const sb = getClient();
            if (!sb) throw new Error('Supabase not configured');
            const r = await fetchRoomByCode(code);
            if (r.error) throw new Error(r.error);
            const prev = r.room.data || {};
            if (prev.guest_joined) throw new Error('Room is full — another player already joined.');
            roomId = r.room.id;
            roomCode = r.room.code;
            role = 2;
            const nm = (guestName || '').trim() || 'Guest';
            global.localStorage.setItem(STORAGE_KEY, nm);
            const { data: jr, error: jrErr } = await sb.rpc('try_join_pvp_room', { p_room_id: roomId, p_guest_name: nm });
            if (jrErr) throw jrErr;
            if (!jr || !jr.ok) {
                const code = jr && jr.error;
                if (code === 'full') throw new Error('Room is full — another player already joined.');
                if (code === 'not_found') throw new Error('Room not found.');
                throw new Error('Could not join room.');
            }
            // Capture the guest token (issued only to the joining client) for
            // subsequent pvp_push_data calls. The token is the only secret
            // bound to the guest's identity in this room.
            roomToken = jr.guest_token || null;
            lastRemoteSeq = (jr.data && jr.data.seq) != null ? jr.data.seq : lastRemoteSeq;
            this._subscribe();
            const { data: rowFresh, error: freshErr } = await sb.from('pvp_rooms').select('id, code, data, updated_at').eq('id', roomId).single();
            if (freshErr) console.warn('[OnlinePvP] joinRoom refresh', freshErr);
            return rowFresh || r.room;
        },

        async pushDraftState(state, extraTopLevel) {
            const patch = {
                phase: 'draft',
                p1_pool: state.p1Pool.map((x) => ({ name: x.name, build: x.build })),
                p2_pool: state.p2Pool.map((x) => ({ name: x.name, build: x.build })),
                p1_draft: state.p1Draft.map((x) => ({ name: x.name, build: x.build })),
                p2_draft: state.p2Draft.map((x) => ({ name: x.name, build: x.build })),
                draft_turn: state.draftTurn
            };
            if (extraTopLevel && typeof extraTopLevel === 'object') {
                Object.assign(patch, extraTopLevel);
            }
            await this.pushData(patch);
        },

        async refreshDraftDeadlineOnly() {
            const preset = global.__onlineMatchTimerPreset || 'none';
            if (!this.isHost()) return;
            if (preset === 'none') {
                await this.pushData({ draft_deadline_iso: null });
                return;
            }
            const sec = preset === 'fast' ? 30 : 60;
            await this.pushData({ draft_deadline_iso: new Date(Date.now() + sec * 1000).toISOString() });
        },

        _subscribe() {
            const sb = getClient();
            if (!sb || !roomId) return;
            if (channel) {
                try { sb.removeChannel(channel); } catch (e) { /* best-effort cleanup */ }
                channel = null;
            }
            let hadDrop = false;
            channel = sb.channel('room-' + roomId)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pvp_rooms', filter: 'id=eq.' + roomId }, (payload) => {
                    this._onRemoteRow(payload.new);
                })
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        // postgres_changes only streams UPDATEs from now on — any row
                        // change during an outage was missed, and because _onRemoteRow
                        // gates on seq monotonicity a later update can't backfill it.
                        // On a (re)subscribe that follows a drop, pull head once and
                        // replay it so a transient blip can't silently desync the match.
                        if (hadDrop) {
                            hadDrop = false;
                            this._resyncFromHead();
                        }
                        return;
                    }
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        hadDrop = true;
                        console.warn('[OnlinePvP] Realtime', status, err && err.message ? err.message : err);
                    }
                });
        },

        // One-shot catch-up read used after a Realtime reconnect. Feeds the current
        // row through the normal _onRemoteRow path, which is seq-gated and therefore
        // a no-op if we never actually fell behind.
        async _resyncFromHead() {
            const sb = getClient();
            if (!sb || !roomId) return;
            try {
                const { data: row, error } = await sb.from('pvp_rooms').select('id, code, data, updated_at').eq('id', roomId).single();
                if (error || !row) { console.warn('[OnlinePvP] resync fetch', error); return; }
                this._onRemoteRow(row);
            } catch (e) {
                console.warn('[OnlinePvP] resync', e);
            }
        },

        dispose() {
            const sb = getClient();
            if (channel && sb) {
                try { sb.removeChannel(channel); } catch (e) { /* best-effort cleanup */ }
            }
            channel = null;
            // removeChannel only unsubscribes the room channel — the cached client's
            // underlying Realtime websocket (and its heartbeat) stays open for the whole
            // session otherwise, leaking a live connection per match. Tear the socket down
            // and drop the cached client so the next room create/join builds a fresh one.
            try {
                if (sb) {
                    if (typeof sb.removeAllChannels === 'function') sb.removeAllChannels();
                    if (sb.realtime && typeof sb.realtime.disconnect === 'function') sb.realtime.disconnect();
                }
            } catch (e) { /* best-effort cleanup */ }
            client = null;
            roomId = null;
            roomCode = null;
            role = null;
            roomToken = null;
            lastRemoteSeq = 0;
            pushDataQueue = Promise.resolve();
            remoteRowQueue = Promise.resolve();
            hostStartedBattle = false;
            hostResolving = false;
            hostLastResolvedTurn = 0;
            try {
                global.__hostOnlineBattleStarted = false;
                global.__guestLastResolved = 0;
                global.__guestBattleStartApplied = false;
                global.__onlineGuestJoined = false;
                global.__onlineHostDraftDeadlinePrimed = false;
                global.__onlineP1Wins = 0;
                global.__onlineP2Wins = 0;
                global.__onlineRoundNumber = 1;
                global.__onlineMatchFormat = 1;
                global.__onlineGuestRematchApplied = 0;
                global.__onlineHostName = null;
                global.__onlineGuestName = null;
                if (typeof global.clearOnlinePvPTimers === 'function') global.clearOnlinePvPTimers();
            } catch (e) { console.debug('[OnlinePvP] dispose reset swallowed', e); }
        },

        pushData(patch, existingData) {
            const sb = getClient();
            if (!sb || !roomId) return Promise.resolve();
            const op = pushDataQueue.then(() => this._pushDataImpl(patch, existingData));
            pushDataQueue = op.catch((e) => {
                console.warn('[OnlinePvP] pushData queue', e);
            });
            return op;
        },

        async _pushDataImpl(patch, _existingData) {
            const sb = getClient();
            if (!sb || !roomId) return;
            if (!roomToken) {
                console.warn('[OnlinePvP] pushData: no roomToken — refusing to write');
                throw new Error('pushData: no roomToken');
            }
            // Server-side merge + seq increment + token validation via the
            // pvp_push_data RPC (migration 005). The `existingData` argument
            // is no longer used — server reads cur state with `for update`
            // lock so seq advances atomically even under concurrent writes.
            // Surface the write failure upstream so callers .catch can show
            // UI; pre-fix the queue advanced as if the write succeeded and
            // local state diverged from Supabase.
            const { data: result, error: rpcErr } = await sb.rpc('pvp_push_data', {
                p_room_id: roomId,
                p_token: roomToken,
                p_patch: patch,
            });
            if (rpcErr) {
                console.warn('[OnlinePvP] pushData RPC failed', rpcErr);
                throw rpcErr;
            }
            if (!result || !result.ok) {
                const err = (result && result.error) || 'unknown';
                console.warn('[OnlinePvP] pushData RPC rejected:', err);
                throw new Error('pvp_push_data: ' + err);
            }
        },

        _onRemoteRow(newRow) {
            if (!newRow) return;
            remoteRowQueue = remoteRowQueue
                .then(async () => {
                    const d = newRow.data || {};
                    const incoming = d.seq || 0;
                    if (incoming <= lastRemoteSeq) return;
                    if (typeof global.onOnlineRoomData === 'function') {
                        // Race the handler against a 10s timeout so a hung
                        // promise from the UI layer can't freeze every future
                        // remote update. Also: do NOT bump lastRemoteSeq until
                        // the handler succeeds; pre-fix a thrown handler
                        // permanently skipped the sequence number.
                        const handlerP = Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
                        const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error('onOnlineRoomData timeout')), 10000));
                        await Promise.race([handlerP, timeoutP]);
                    }
                    lastRemoteSeq = incoming || lastRemoteSeq + 1;
                })
                .catch((e) => console.warn('[OnlinePvP] onOnlineRoomData', e));
        },

        // Re-open the command menu and tell the player their move didn't send, so a
        // failed pre-write read or push doesn't leave them frozen with a hidden menu
        // and a turn that was "spent" locally but never reached the opponent.
        _restoreTurnUiAfterSendFailure() {
            try {
                if (typeof global.logMsg === 'function') {
                    global.logMsg("Couldn't send your move — connection issue. Try again.", 'info');
                }
                const moveMenu = global.document && global.document.getElementById('move-menu');
                const cmdMenu = global.document && global.document.getElementById('command-menu');
                if (moveMenu) moveMenu.classList.add('hidden');
                if (cmdMenu) cmdMenu.classList.remove('hidden');
                try { global.syncBattleActiveHighlight(); } catch (e) { /* optional UI hook */ }
            } catch (e) { /* best-effort UI restore */ }
        },

        async handleSelectDraft(state, settings, draftItem, selectDraftLocal) {
            selectDraftLocal(draftItem);
            await this.pushDraftState(state);
        },

        async handlePvPPlayTurn(state, action, settings) {
            const sb = getClient();
            if (!sb || !roomId) return;
            const myR = role;
            const cp = state.currentPlayer;
            if (cp === 1 && myR !== 1) return;
            if (cp === 2 && myR !== 2) return;

            const ser = (a) => ({
                moveIndex: a.moveIndex,
                switchIndex: a.switchIndex,
                aiMoveName: a.aiMove && a.aiMove.name ? a.aiMove.name : null
            });
            const g1 = state.p1GimmickIntent ? deepClone(state.p1GimmickIntent) : null;
            const g2 = state.p2GimmickIntent ? deepClone(state.p2GimmickIntent) : null;

            if (cp === 1) {
                const prevAction = state.p1Action;
                const prevPlayer = state.currentPlayer;
                state.p1Action = action;
                state.currentPlayer = 2;
                const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
                if (rowErr || !row || row.data == null) {
                    // Roll the local turn back so the player can retry instead of being
                    // stranded mid-turn with nothing sent to the opponent.
                    state.p1Action = prevAction;
                    state.currentPlayer = prevPlayer;
                    this._restoreTurnUiAfterSendFailure();
                    console.warn('[OnlinePvP] handlePvPPlayTurn (P1) fetch', rowErr);
                    return;
                }
                const prev = row.data;
                const battle = Object.assign({}, prev.battle || {}, {
                    p1_pick: ser(action),
                    p1_gimmick: g1,
                    p2_pick: prev.battle && prev.battle.p2_pick,
                    p2_gimmick: prev.battle && prev.battle.p2_gimmick
                });
                const deadlineIso = typeof global.computeOnlineBattleTurnDeadlineIso === 'function' ? global.computeOnlineBattleTurnDeadlineIso(state) : null;
                try {
                    await this.pushData({ battle, battle_turn_deadline_iso: deadlineIso }, prev);
                } catch (e) {
                    state.p1Action = prevAction;
                    state.currentPlayer = prevPlayer;
                    this._restoreTurnUiAfterSendFailure();
                    console.warn('[OnlinePvP] handlePvPPlayTurn (P1) push', e);
                    return;
                }
                if (typeof global.logMsg === 'function') global.logMsg("Waiting for opponent…", 'info');
                const moveMenu = global.document && global.document.getElementById('move-menu');
                const cmdMenu = global.document && global.document.getElementById('command-menu');
                if (moveMenu) moveMenu.classList.add('hidden');
                if (cmdMenu) cmdMenu.classList.remove('hidden');
                try { global.syncBattleActiveHighlight(); } catch (e) { /* optional UI hook */ }
                return;
            }

            const prevAction2 = state.p2Action;
            const prevPlayer2 = state.currentPlayer;
            state.p2Action = action;
            state.currentPlayer = 1;
            const { data: row2, error: row2Err } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
            if (row2Err || !row2 || row2.data == null) {
                state.p2Action = prevAction2;
                state.currentPlayer = prevPlayer2;
                this._restoreTurnUiAfterSendFailure();
                console.warn('[OnlinePvP] handlePvPPlayTurn (P2) fetch', row2Err);
                return;
            }
            const prev = row2.data;
            const battle = Object.assign({}, prev.battle || {}, {
                p2_pick: ser(action),
                p2_gimmick: g2,
                p1_pick: prev.battle && prev.battle.p1_pick,
                p1_gimmick: prev.battle && prev.battle.p1_gimmick
            });
            try {
                await this.pushData({ battle }, prev);
            } catch (e) {
                state.p2Action = prevAction2;
                state.currentPlayer = prevPlayer2;
                this._restoreTurnUiAfterSendFailure();
                console.warn('[OnlinePvP] handlePvPPlayTurn (P2) push', e);
                return;
            }
            /* Host runs resolution when guest's p2 pick arrives — see consumeRemoteForHost from onOnlineRoomData */
        },

        async consumeRemoteForHost(state, settings, d) {
            if (role !== 1 || !d || !d.battle) return;
            const b = d.battle;
            if (!b.p1_pick || !b.p2_pick) return;
            if (state.isLocked || hostResolving) return;
            // Fence: a re-delivered row (or a timeout that raced a real pick) can
            // still carry both picks for a turn the host already resolved+pushed.
            // Without this, the boolean `hostResolving` is the only guard and a
            // second distinct UPDATE could double-apply the same turn.
            const turn = (typeof b.pending_turn === 'number') ? b.pending_turn : null;
            if (turn !== null && turn <= hostLastResolvedTurn) return;
            hostResolving = true;
            try {
                await this._hostRunResolution(state, settings, b);
            } finally {
                hostResolving = false;
            }
        },

        async _hostRunResolution(state, settings, remoteBattle) {
            const deser = (p, party, isP1) => {
                if (!p) return null;
                const a = { moveIndex: p.moveIndex, switchIndex: p.switchIndex, aiMove: null };
                if (p.aiMoveName) {
                    const mon = isP1 ? state.pActive : state.fActive;
                    const mv = mon && mon.moves ? mon.moves.find((m) => m.name === p.aiMoveName) : null;
                    if (mv) a.aiMove = mv;
                }
                return a;
            };
            state.p1Action = deser(remoteBattle.p1_pick, state.playerParty, true);
            state.p2Action = deser(remoteBattle.p2_pick, state.foeParty, false);
            if (remoteBattle.p1_gimmick !== undefined) state.p1GimmickIntent = remoteBattle.p1_gimmick;
            if (remoteBattle.p2_gimmick !== undefined) state.p2GimmickIntent = remoteBattle.p2_gimmick;

            if (typeof global.__runLockedPvPTurnResolution === 'function') {
                await global.__runLockedPvPTurnResolution();
            }

            const blob = exportBattleSnapshot(state);
            const h = simpleHash(blob);
            const { data: row, error: rowErr } = await getClient().from('pvp_rooms').select('data').eq('id', roomId).single();
            if (rowErr || !row || row.data == null) {
                console.warn('[OnlinePvP] _hostRunResolution fetch', rowErr);
                return;
            }
            const prev = row.data;
            const resolvedTurn = (prev.battle && prev.battle.pending_turn) || 1;
            // Local battle state has already advanced (resolution ran above), so fence
            // this turn now — even if the push below fails we must not re-run resolution
            // for it, which would double-apply on already-advanced state.
            if (resolvedTurn > hostLastResolvedTurn) hostLastResolvedTurn = resolvedTurn;
            const battle = Object.assign({}, prev.battle || {}, {
                p1_pick: null,
                p2_pick: null,
                p1_gimmick: null,
                p2_gimmick: null,
                resolved_turn: resolvedTurn,
                pending_turn: resolvedTurn + 1,
                state_blob: blob,
                state_hash: h
            });
            const nextDeadline = !state.isOver && typeof global.computeOnlineBattleTurnDeadlineIso === 'function'
                ? global.computeOnlineBattleTurnDeadlineIso(state)
                : null;
            const battle_log_html = captureBattleLogHtml();
            try {
                await this.pushData({ battle, battle_turn_deadline_iso: nextDeadline, battle_log_html }, prev);
            } catch (e) {
                // The turn resolved locally on the host but the snapshot didn't reach the
                // opponent. Surface it rather than failing silently; the guest re-syncs on
                // its next Realtime reconnect (_resyncFromHead).
                console.warn('[OnlinePvP] _hostRunResolution push', e);
                if (typeof global.logMsg === 'function') {
                    global.logMsg('[Online] Connection issue — your opponent may not have received this turn.', 'info');
                }
                return;
            }

            if (state.isOver) {
                const p1Alive = state.playerParty.some((m) => m.currentHp > 0);
                const fAlive = state.foeParty.some((m) => m.currentHp > 0);
                const p1Won = p1Alive && !fAlive;
                const p2Won = fAlive && !p1Alive;

                // Pull current wins from room then increment
                const { data: winRow, error: winErr } = await getClient().from('pvp_rooms').select('data').eq('id', roomId).single();
                if (winErr || !winRow || winRow.data == null) {
                    console.warn('[OnlinePvP] _hostRunResolution win fetch', winErr);
                    return;
                }
                const winPrev = winRow.data;
                const p1Wins = (winPrev.p1_wins || 0) + (p1Won ? 1 : 0);
                const p2Wins = (winPrev.p2_wins || 0) + (p2Won ? 1 : 0);
                const roundNumber = winPrev.round_number || 1;

                // Expose to local globals immediately so the host's end screen can read them
                global.__onlineP1Wins = p1Wins;
                global.__onlineP2Wins = p2Wins;
                global.__onlineRoundNumber = roundNumber;

                await this.pushData({
                    phase: 'done',
                    battle_turn_deadline_iso: null,
                    battle_log_html: captureBattleLogHtml(),
                    p1_wins: p1Wins,
                    p2_wins: p2Wins,
                    round_number: roundNumber
                }, winPrev);
                if (p1Won) await reportWinIfConfigured(true);
                else if (p2Won) await reportWinIfConfigured(false);
            }
        },

        async hostResolveGuestBattleTimeout(state, settings) {
            if (role !== 1 || !roomId) return;
            const sb = getClient();
            if (!sb) return;
            if (global.__onlineBattleDeadlineFiring) return;
            const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
            if (rowErr) console.warn('[OnlinePvP] hostResolveGuestBattleTimeout fetch', rowErr);
            if (!row || !row.data || !row.data.battle) return;
            const b = row.data.battle;
            if (!b.p1_pick || b.p2_pick || state.isLocked) return;
            if (state.currentPlayer !== 2) return;
            if (hostResolving) return;
            // Same fence as consumeRemoteForHost: don't synthesize a timeout pick for a
            // turn the host already resolved (e.g. a real guest pick landed first).
            const timeoutTurn = (typeof b.pending_turn === 'number') ? b.pending_turn : null;
            if (timeoutTurn !== null && timeoutTurn <= hostLastResolvedTurn) return;
            if (typeof global._pvpBuildTimeoutAction !== 'function') return;
            global.__onlineBattleDeadlineFiring = true;
            try {
                if (typeof global.logMsg === 'function') global.logMsg("Time's up — AI chose Player 2's move.", 'info');
                const action = global._pvpBuildTimeoutAction();
                const ser = (a) => ({
                    moveIndex: a.moveIndex,
                    switchIndex: a.switchIndex,
                    aiMoveName: a.aiMove && a.aiMove.name ? a.aiMove.name : null
                });
                const g2 = state.p2GimmickIntent ? deepClone(state.p2GimmickIntent) : null;
                const remoteBattle = {
                    p1_pick: b.p1_pick,
                    p2_pick: ser(action),
                    p1_gimmick: b.p1_gimmick,
                    p2_gimmick: g2
                };
                await this._hostRunResolution(state, settings, remoteBattle);
            } catch (e) {
                console.warn('[OnlinePvP] hostResolveGuestBattleTimeout', e);
            } finally {
                global.__onlineBattleDeadlineFiring = false;
            }
        },

        async afterHostStartBattle(state) {
            if (!this.isHost() || !roomId) return;
            // New battle (incl. rematch) resets pending_turn to 1, so clear the fence
            // or the first turn of a rematch would be skipped as "already resolved".
            hostLastResolvedTurn = 0;
            const blob = exportBattleSnapshot(state);
            const h = simpleHash(blob);
            const deadlineIso = typeof global.computeOnlineBattleTurnDeadlineIso === 'function' ? global.computeOnlineBattleTurnDeadlineIso(state) : null;
            const battle_log_html = captureBattleLogHtml();
            // Include latest display names + match format so guest stays in sync
            const { data: nameRow, error: nameErr } = await getClient().from('pvp_rooms').select('data').eq('id', roomId).single();
            if (nameErr || !nameRow || nameRow.data == null) {
                console.warn('[OnlinePvP] afterHostStartBattle fetch', nameErr);
                return;
            }
            const nPrev = nameRow.data;
            await this.pushData({
                phase: 'battle',
                draft_deadline_iso: null,
                battle_turn_deadline_iso: deadlineIso,
                battle_start_blob: blob,
                battle_start_hash: h,
                battle_log_html,
                host_display_name: nPrev.host_display_name || (global.localStorage && global.localStorage.getItem('pbs_online_display_name')) || 'Host',
                guest_display_name: nPrev.guest_display_name,
                match_options: nPrev.match_options,
                p1_wins: nPrev.p1_wins || 0,
                p2_wins: nPrev.p2_wins || 0,
                round_number: nPrev.round_number || 1,
                battle: {
                    pending_turn: 1,
                    p1_pick: null,
                    p2_pick: null,
                    p1_gimmick: null,
                    p2_gimmick: null,
                    resolved_turn: 0,
                    state_blob: null,
                    state_hash: null
                }
            }, nPrev);
            hostStartedBattle = true;
        },

        async guestApplyBattleStart(state, roomData) {
            const blob = typeof roomData === 'string' ? roomData : (roomData && roomData.battle_start_blob);
            if (!blob) return;
            // Sync display names from room data
            if (roomData && typeof roomData === 'object') {
                if (roomData.host_display_name) global.__onlineHostName = roomData.host_display_name;
                if (roomData.guest_display_name) global.__onlineGuestName = roomData.guest_display_name;
                if (typeof roomData.p1_wins === 'number') global.__onlineP1Wins = roomData.p1_wins;
                if (typeof roomData.p2_wins === 'number') global.__onlineP2Wins = roomData.p2_wins;
                if (typeof roomData.round_number === 'number') global.__onlineRoundNumber = roomData.round_number;
                if (roomData.match_options && roomData.match_options.match_format) global.__onlineMatchFormat = roomData.match_options.match_format;
            }
            if (!applyBattleSnapshot(state, blob)) return;
            if (typeof roomData === 'object' && roomData && roomData.battle_log_html !== undefined) {
                applyBattleLogHtml(roomData.battle_log_html);
            }
            if (global.AudioSystem && typeof global.AudioSystem.startNewBattle === 'function') {
                try { global.AudioSystem.startNewBattle(); } catch (e) { /* optional audio hook */ }
            }
            const scrDraft = global.document && global.document.getElementById('screen-draft');
            const scrBattle = global.document && global.document.getElementById('screen-battle');
            const gScore = global.document && global.document.getElementById('gauntlet-score');
            if (scrDraft) scrDraft.classList.add('hidden');
            if (scrBattle) scrBattle.classList.remove('hidden');
            if (gScore) gScore.classList.add('hidden');
            if (typeof global.updateUI === 'function') global.updateUI();
            const moveMenuG = global.document && global.document.getElementById('move-menu');
            const cmdMenuG = global.document && global.document.getElementById('command-menu');
            if (moveMenuG) moveMenuG.classList.add('hidden');
            if (cmdMenuG) cmdMenuG.classList.remove('hidden');
            if (typeof global.applyBattleLogDockClass === 'function') global.applyBattleLogDockClass();
            if (typeof global.updateOnlineBattleScoreOverlay === 'function') global.updateOnlineBattleScoreOverlay();
            try { global.syncBattleActiveHighlight(); } catch (e) { /* optional UI hook */ }
        },

        async guestApplyBattleBlob(state, d) {
            const b = d.battle || {};
            if (!b.state_blob) return;
            if (!applyBattleSnapshot(state, b.state_blob)) return;
            if (d && d.battle_log_html !== undefined) applyBattleLogHtml(d.battle_log_html);
            if (typeof global.updateUI === 'function') global.updateUI();
            state.isLocked = false;
            const cmdEnd = global.document && global.document.getElementById('command-menu');
            if (!state.isOver) {
                if (cmdEnd) cmdEnd.classList.remove('hidden');
            } else if (role === 2 && typeof global.showEndScreen === 'function') {
                const p1s = state.playerParty.some((m) => m.currentHp > 0);
                const p2s = state.foeParty.some((m) => m.currentHp > 0);
                const p1Name = global.__onlineHostName || 'Host';
                const p2Name = global.__onlineGuestName || 'Guest';
                if (!p1s && p2s) global.showEndScreen('VICTORY!', `You (${p2Name}) won this round!`, true);
                else if (p1s && !p2s) global.showEndScreen('DEFEAT', `${p1Name} won this round.`, false);
                else global.showEndScreen('DRAW', 'The round ended in a draw.', false);
            }
            try { global.syncBattleActiveHighlight(); } catch (e) { /* optional UI hook */ }
            const localH = simpleHash(b.state_blob);
            if (b.state_hash && localH !== b.state_hash && typeof global.logMsg === 'function') {
                global.logMsg('[Online] State hash mismatch — applied host snapshot.', 'info');
            }
        },

        buildMatchOptionsFromSettings,
        applyMatchOptionsToSettings,
        exportBattleSnapshot,
        applyBattleSnapshot,
        simpleHash,
        sanitizeBattleLogHtml, // exposed for tests; pure allowlist sanitizer
        getDisplayName() {
            return (global.localStorage.getItem(STORAGE_KEY) || '').trim() || 'Trainer';
        },
        setDisplayName(n) {
            // Sanitize: strip HTML tags / control chars / leading-trailing
            // whitespace, then cap at 24. Pre-fix this just trimmed + sliced;
            // a craftedname like `<img src=x onerror=alert(1)>` survived and
            // would have been a latent XSS if any callsite ever switched
            // from innerText to innerHTML.
            const clean = String(n || '')
                .replace(/[<>]/g, '')             // strip angle brackets
                .replace(/[\x00-\x1f\x7f]/g, '')       // strip control chars + DEL
                .trim()
                .slice(0, 24);
            global.localStorage.setItem(STORAGE_KEY, clean || 'Trainer');
        }
    };

    global.OnlineBattle = OnlineBattle;
    global.__onlinePvpConfigured = configured;
})(typeof window !== 'undefined' ? window : globalThis);
