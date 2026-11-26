/**
 * Online PvP: Supabase-backed room code, draft sync, host-authoritative battle snapshots.
 * Depends: global supabase from UMD bundle, window.__PBS_SUPABASE_* from online-config.js
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'pbs_online_display_name';
    const ENGINE_PROTOCOL = 1;
    const ROOM_RULE_KEYS = ['draftGrades', 'mechanics', 'classicMode', 'randomWeather', 'randomTerrain', 'partySize', 'pvpBattleItems'];

    let client = null;
    let roomId = null;
    let roomCode = null;
    let role = null; // 1 host (P1), 2 guest (P2)
    let channel = null;
    let lastRemoteSeq = 0;
    let pendingDraftWrite = null;
    let guestRules = null;
    let hostStartedBattle = false;
    let nativeRoomReady = false;
    let pushDataQueue = Promise.resolve();
    let remoteRowQueue = Promise.resolve();
    let hostResolving = false;
    // Highest battle turn the host has already resolved locally. Fences
    // consumeRemoteForHost / the guest-timeout path against re-resolving a turn
    // we already advanced past (a re-delivered row, or a timeout racing a real
    // pick). Reset to 0 at battle start (afterHostStartBattle) and in dispose().
    let hostLastResolvedTurn = 0;
    let hostPendingPublication = null;
    let hostPublicationTimer = null;
    const HOST_PUBLISH_RETRY_MS = [500, 1500, 3000];
    // Per-room caller token (ISSUE-020). Host receives this from
    // try_create_pvp_room; guest receives a different one from
    // try_join_pvp_room. All subsequent writes go through pvp_push_data
    // which validates the token server-side. Cleared in dispose().
    let roomToken = null;
    const inRoom = (id, token) => roomId === id && roomToken === token;

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

    function awaitRoomRequest(request, signal) {
        if (!signal) return request;
        const timeoutError = new Error('The room request timed out. Check your connection and try again.');
        if (signal.aborted) throw timeoutError;
        const pending = typeof request.abortSignal === 'function' ? request.abortSignal(signal) : request;
        return new Promise((resolve, reject) => {
            const onTimeout = () => reject(timeoutError);
            signal.addEventListener('abort', onTimeout, { once: true });
            Promise.resolve(pending).then(resolve, reject).finally(() => signal.removeEventListener('abort', onTimeout));
        });
    }

    async function fetchRoomByCode(code, signal) {
        const sb = getClient();
        if (!sb) return { error: 'not_configured' };
        const c = String(code || '').trim().toUpperCase();
        if (c.length < 4) return { error: 'bad_code' };
        // Explicit columns (not '*'): the token columns added in migration 006
        // are SELECT-revoked for anon, and the client never needs them.
        const { data, error } = await awaitRoomRequest(
            sb.from('pvp_rooms').select('id, code, data, updated_at').eq('code', c).maybeSingle(), signal);
        if (error) return { error: error.message };
        if (!data) return { error: 'not_found' };
        return { room: data };
    }

    function deepClone(o) {
        return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
    }

    function draftRows(rows) {
        return rows.map(({ name, build }) => ({ name, build }));
    }

    function supportsNativeEngine(room) {
        return room.host_engine_protocol === ENGINE_PROTOCOL && room.guest_engine_protocol === ENGINE_PROTOCOL;
    }

    function nativeChoiceKey(player) {
        return player === 1 ? 'native_p1_choice' : 'native_p2_choice';
    }

    function readNativeChoice(room, player) {
        const pick = room[nativeChoiceKey(player)];
        if (!pick || pick.revision !== room.battle.pending_turn || pick.round !== (room.round_number || 1)) return null;
        return pick.action ? pick : null;
    }

    // Native choices are written independently of the authoritative board and
    // carry its revision. A late request cannot overwrite a newer board.
    function withNativeChoices(room) {
        if (room.battle?.engine !== 'showdown') return room;
        const p1 = readNativeChoice(room, 1);
        const p2 = readNativeChoice(room, 2);
        return {
            ...room,
            battle: {
                ...room.battle,
                p1_pick: p1?.action || null,
                p2_pick: p2?.action || null,
                p1_gimmick: p1?.gimmick || null,
                p2_gimmick: p2?.gimmick || null
            }
        };
    }

    function nativeRequest(state, player) {
        return state.battleEngine === 'showdown' ? state.nativeRequests?.[player - 1] : null;
    }

    function encodeAction(action) {
        return {
            moveIndex: action.moveIndex,
            switchIndex: action.switchIndex,
            aiMoveName: action.aiMove?.name || null
        };
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
        if (role === 2 && guestRules?.settings !== settings) {
            guestRules = { settings, local: Object.fromEntries(ROOM_RULE_KEYS.map(key => [key, settings[key]])) };
        }
        for (const key of ROOM_RULE_KEYS) {
            if (match[key] !== undefined) settings[key] = deepClone(match[key]);
        }
        if (match.timer_preset !== undefined) {
            global.__onlineMatchTimerPreset = match.timer_preset === 'fast' || match.timer_preset === 'slow' ? match.timer_preset : 'none';
        }
        if (match.match_format !== undefined) {
            global.__onlineMatchFormat = (match.match_format === 3 || match.match_format === 5) ? match.match_format : 1;
        }
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
        if (state.battleEngine === 'showdown') {
            snap.battleEngine = 'showdown';
            snap.engineProtocol = ENGINE_PROTOCOL;
            snap.nativeRequests = state.nativeRequests || [null, null];
            snap.nativeWinner = state.nativeWinner ?? null;
            snap.onlineNativeRevision = state._onlineNativeRevision;
            snap.onlineNativeRound = state._onlineNativeRound;
        }
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
        if (!o || typeof o !== 'object') return false;
        if (o.battleEngine === 'showdown' &&
            (o.engineProtocol !== ENGINE_PROTOCOL || !Array.isArray(o.nativeRequests) || o.nativeRequests.length !== 2)) {
            return false;
        }
        state.battleEngine = o.battleEngine === 'showdown' ? 'showdown' : undefined;
        state.nativeRequests = state.battleEngine === 'showdown' ? o.nativeRequests : null;
        state.nativeWinner = state.battleEngine === 'showdown' ? o.nativeWinner : null;
        state._onlineNativeRevision = o.onlineNativeRevision;
        state._onlineNativeRound = o.onlineNativeRound;
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
        isSettlingTurn() {
            return role === 1 && (hostResolving || !!hostPendingPublication);
        },
        canUseNativeBattle() {
            return nativeRoomReady;
        },
        applyNativeChoiceState(state, room) {
            const battle = room.battle;
            if (state.battleEngine !== 'showdown' || battle?.engine !== 'showdown' || state.isOver ||
                state._onlineNativeRevision !== battle.pending_turn || state._onlineNativeRound !== (room.round_number || 1)) return;
            const next = [1, 2].find(player => nativeRequest(state, player) && !readNativeChoice(room, player)) || 0;
            if (next === state.currentPlayer) return;
            state.currentPlayer = next;
            global.refreshNativeBattleUi?.();
            global.syncBattleActiveHighlight?.();
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
            if (state.battleEngine === 'showdown') return cp === role && !!nativeRequest(state, role);
            return (cp === 1 && role === 1) || (cp === 2 && role === 2);
        },
        waitingOnOpponent(state) {
            return this.isActive() && state && state.mode === 'pvp' && !this.myTurn(state) && !state.isLocked;
        },

        // Lazily inject the Supabase UMD bundle. Returns Promise<boolean> (true once
        // global.supabase.createClient is available). Shared by rooms and leaderboard.
        ensureSdk() {
            if (typeof global.supabase?.createClient === 'function') return Promise.resolve(true);
            if (_sdkLoadPromise) return _sdkLoadPromise;
            const doc = global.document;
            if (!doc?.head) return Promise.resolve(false);
            _sdkLoadPromise = new Promise(resolve => {
                const script = doc.createElement('script');
                script.src = SUPABASE_SDK_URL;
                script.async = true;
                const timeout = global.setTimeout(() => finish(false), 10000);
                function finish(ok) {
                    global.clearTimeout(timeout);
                    script.onload = null;
                    script.onerror = null;
                    if (!ok) script.remove();
                    resolve(ok);
                }
                script.onload = () => finish(typeof global.supabase?.createClient === 'function');
                script.onerror = () => finish(false);
                try {
                    doc.head.appendChild(script);
                } catch (_) {
                    finish(false);
                }
            }).finally(() => { _sdkLoadPromise = null; });
            return _sdkLoadPromise;
        },

        async getServiceClient() {
            if (!configured()) throw new Error('The online service is unavailable.');
            if (!await this.ensureSdk()) throw new Error('Could not load online services. Check your connection and try again.');
            return getClient();
        },

        applyHostMatchOptions(settings) {
            const sb = getClient();
            if (!sb || !roomId) return;
            const id = roomId;
            const token = roomToken;
            sb.from('pvp_rooms').select('data').eq('id', id).maybeSingle().then(({ data: row, error }) => {
                if (!inRoom(id, token)) return;
                if (error) {
                    console.warn('[OnlinePvP] applyHostMatchOptions', error);
                    return;
                }
                const d = row && row.data ? row.data : {};
                if (d.match_options) applyMatchOptionsToSettings(d.match_options, settings);
            }).catch((e) => console.warn('[OnlinePvP] applyHostMatchOptions', e));
        },

        async createRoom(matchOptions, enabledGens, poolPayload, signal) {
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
                host_engine_protocol: ENGINE_PROTOCOL,
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
            let code;
            for (let attempt = 0; attempt < 8; attempt++) {
                code = randomCode();
                const { data: r, error: rpcErr } = await awaitRoomRequest(
                    sb.rpc('try_create_pvp_room', { p_code: code, p_data: data }), signal);
                if (rpcErr) { lastErr = rpcErr; throw rpcErr; }
                if (r && r.ok) { rpcRes = r; break; }
                if (r && r.error === 'duplicate_code') { lastErr = new Error('duplicate_code'); continue; }
                throw new Error('try_create_pvp_room: ' + ((r && r.error) || 'unknown'));
            }
            if (!rpcRes) throw lastErr || new Error('Could not create room (code collision).');
            roomId = rpcRes.id;
            roomCode = code;
            roomToken = rpcRes.host_token;
            role = 1;
            nativeRoomReady = false;
            lastRemoteSeq = seq;
            this._subscribe();
            return { roomId, code: roomCode };
        },

        async joinRoom(code, guestName, signal) {
            const sb = getClient();
            if (!sb) throw new Error('Supabase not configured');
            const r = await fetchRoomByCode(code, signal);
            if (r.error) throw new Error(r.error);
            const prev = r.room.data || {};
            if (prev.guest_joined) throw new Error('Room is full — another player already joined.');
            const nm = (guestName || '').trim() || 'Guest';
            global.localStorage.setItem(STORAGE_KEY, nm);
            const { data: jr, error: jrErr } = await awaitRoomRequest(
                sb.rpc('try_join_pvp_room', { p_room_id: r.room.id, p_guest_name: nm }), signal);
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
            roomId = r.room.id;
            roomCode = r.room.code;
            role = 2;
            roomToken = jr.guest_token || null;
            let joined = { ...r.room, data: jr.data || prev };
            if (prev.host_engine_protocol === ENGINE_PROTOCOL && !signal?.aborted) {
                try {
                    const negotiated = await this._pushDataImpl({ guest_engine_protocol: ENGINE_PROTOCOL }, undefined, signal);
                    if (negotiated) joined = { ...joined, data: negotiated };
                    nativeRoomReady = true;
                } catch (error) {
                    // The join succeeded even if the optional handshake did not.
                    nativeRoomReady = false;
                    console.warn('[OnlinePvP] engine negotiation', error);
                }
            }
            lastRemoteSeq = joined.data.seq ?? lastRemoteSeq;
            this._subscribe();
            if (!signal?.aborted) {
                try {
                    const { data: rowFresh, error: freshErr } = await awaitRoomRequest(
                        sb.from('pvp_rooms').select('id, code, data, updated_at').eq('id', roomId).single(), signal);
                    if (freshErr) console.warn('[OnlinePvP] joinRoom refresh', freshErr);
                    if (rowFresh) joined = rowFresh;
                } catch (error) {
                    console.warn('[OnlinePvP] joinRoom refresh', error);
                }
            }
            return joined;
        },

        async pushDraftState(state, extraTopLevel) {
            const patch = {
                phase: 'draft',
                p1_pool: draftRows(state.p1Pool),
                p2_pool: draftRows(state.p2Pool),
                p1_draft: draftRows(state.p1Draft),
                p2_draft: draftRows(state.p2Draft),
                draft_turn: state.draftTurn
            };
            if (extraTopLevel && typeof extraTopLevel === 'object') {
                Object.assign(patch, extraTopLevel);
            }
            await this.pushData(patch);
        },

        isDraftWritePending() {
            return pendingDraftWrite !== null;
        },

        async commitDraftSide(player, pool, draft) {
            if (pendingDraftWrite || ![1, 2].includes(player) || (player !== role && role !== 1)) return false;
            const id = roomId;
            const token = roomToken;
            const field = `p${player}_draft`;
            const write = { field, picks: draft.map(row => row.name) };
            pendingDraftWrite = write;
            try {
                // Both seats may pick at the same time. Only publish the side being edited.
                const saved = await this.pushData({ [`p${player}_pool`]: draftRows(pool), [field]: draftRows(draft) });
                if (!inRoom(id, token)) return false;
                // Apply the full merged RPC receipt through the same ordering gate as Realtime.
                if (Number.isSafeInteger(saved?.seq) && saved.seq > 0 && typeof saved.phase === 'string' &&
                    ['p1_pool', 'p2_pool', 'p1_draft', 'p2_draft'].every(key => Array.isArray(saved[key]))) {
                    await this._onRemoteRow({ data: saved });
                    if (pendingDraftWrite === write && lastRemoteSeq >= saved.seq) pendingDraftWrite = null;
                }
                if (pendingDraftWrite === write) await this._resyncFromHead();
                return inRoom(id, token);
            } catch (error) {
                if (pendingDraftWrite === write) pendingDraftWrite = null;
                console.warn('[OnlinePvP] draft save', error);
                global.showToast?.('Your draft change could not be saved. Try again.');
                return false;
            }
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
            const subscribedRoom = roomId;
            const subscribedToken = roomToken;
            let hadDrop = false;
            channel = sb.channel('room-' + roomId)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pvp_rooms', filter: 'id=eq.' + roomId }, (payload) => {
                    if (inRoom(subscribedRoom, subscribedToken)) this._onRemoteRow(payload.new);
                })
                .subscribe((status, err) => {
                    if (!inRoom(subscribedRoom, subscribedToken)) return;
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
            const id = roomId;
            const token = roomToken;
            try {
                const { data: row, error } = await sb.from('pvp_rooms').select('id, code, data, updated_at').eq('id', id).single();
                if (!inRoom(id, token)) return;
                if (error || !row) { console.warn('[OnlinePvP] resync fetch', error); return; }
                if (hostPendingPublication) {
                    const alreadyPublished = (row.data?.battle?.resolved_turn || 0) >= hostPendingPublication.patch.battle.resolved_turn;
                    await this._publishHostTurn(row.data);
                    if (!alreadyPublished) return; // do not apply the pre-publication row over the local turn
                }
                if (!inRoom(id, token)) return;
                this._onRemoteRow(row);
            } catch (e) {
                console.warn('[OnlinePvP] resync', e);
            }
        },

        dispose() {
            if (guestRules) Object.assign(guestRules.settings, guestRules.local);
            guestRules = null;
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
            pendingDraftWrite = null;
            pushDataQueue = Promise.resolve();
            remoteRowQueue = Promise.resolve();
            hostStartedBattle = false;
            nativeRoomReady = false;
            hostResolving = false;
            hostLastResolvedTurn = 0;
            if (hostPublicationTimer !== null) global.clearTimeout(hostPublicationTimer);
            hostPublicationTimer = null;
            hostPendingPublication = null;
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
            const id = roomId;
            const token = roomToken;
            const op = pushDataQueue.then(() => inRoom(id, token) && this._pushDataImpl(patch, existingData));
            pushDataQueue = op.catch((e) => {
                console.warn('[OnlinePvP] pushData queue', e);
            });
            return op;
        },

        async _pushDataImpl(patch, _existingData, signal) {
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
            const { data: result, error: rpcErr } = await awaitRoomRequest(sb.rpc('pvp_push_data', {
                p_room_id: roomId,
                p_token: roomToken,
                p_patch: patch,
            }), signal);
            if (rpcErr) {
                console.warn('[OnlinePvP] pushData RPC failed', rpcErr);
                throw rpcErr;
            }
            if (!result || !result.ok) {
                const err = (result && result.error) || 'unknown';
                console.warn('[OnlinePvP] pushData RPC rejected:', err);
                throw new Error('pvp_push_data: ' + err);
            }
            return result.data;
        },

        _onRemoteRow(newRow) {
            if (!newRow) return;
            const id = roomId;
            const token = roomToken;
            remoteRowQueue = remoteRowQueue
                .then(async () => {
                    if (!inRoom(id, token)) return;
                    const d = withNativeChoices(newRow.data || {});
                    const incoming = d.seq || 0;
                    if (incoming <= lastRemoteSeq) return;
                    if (pendingDraftWrite) {
                        const { field, picks } = pendingDraftWrite;
                        const saved = d[field];
                        if (d.phase !== 'draft' || (saved?.length === picks.length &&
                            picks.every((name, index) => saved[index]?.name === name))) pendingDraftWrite = null;
                    }
                    nativeRoomReady = supportsNativeEngine(d);
                    if (typeof global.onOnlineRoomData === 'function') {
                        // Race the handler against a 10s timeout so a hung
                        // promise from the UI layer can't freeze every future
                        // remote update. Also: do NOT bump lastRemoteSeq until
                        // the handler succeeds; pre-fix a thrown handler
                        // permanently skipped the sequence number.
                        const handlerP = Promise.resolve(global.onOnlineRoomData(d, { role, roomCode }));
                        let timeout;
                        const timeoutP = new Promise((_, rej) => {
                            timeout = global.setTimeout(() => rej(new Error('onOnlineRoomData timeout')), 10000);
                        });
                        try { await Promise.race([handlerP, timeoutP]); }
                        finally { global.clearTimeout(timeout); }
                    }
                    if (inRoom(id, token)) lastRemoteSeq = incoming || lastRemoteSeq + 1;
                })
                .catch((e) => console.warn('[OnlinePvP] onOnlineRoomData', e));
            return remoteRowQueue;
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

        async handleSelectDraft(state, settings, draftItem, selectDraftLocal, player = role) {
            if (global.__onlineGuestJoined) {
                const pool = state[`p${player}Pool`];
                const draft = state[`p${player}Draft`];
                if (!pool?.includes(draftItem) || draft?.length >= settings.partySize) return false;
                return this.commitDraftSide(player, pool.filter(row => row !== draftItem), [...draft, draftItem]);
            }
            selectDraftLocal(draftItem);
            await this.pushDraftState(state);
            return true;
        },

        async _handleNativePvPTurn(state, action) {
            if (!this.myTurn(state) || state.isOver || state.isLocked || !state._onlineNativeRevision) return;
            const id = roomId;
            const token = roomToken;
            const player = role;
            const revision = state._onlineNativeRevision;
            const round = state._onlineNativeRound;
            if (player === 1 && hostPendingPublication && !await this._publishHostTurn()) {
                if (inRoom(id, token)) global.refreshNativeBattleUi?.();
                return;
            }
            if (!inRoom(id, token) || !this.myTurn(state) || revision !== state._onlineNativeRevision ||
                round !== state._onlineNativeRound) return;
            const next = player === 1 && nativeRequest(state, 2) ? 2 : 0;
            const choice = {
                revision,
                round,
                action: encodeAction(action),
                gimmick: deepClone((player === 1 ? state.p1GimmickIntent : state.p2GimmickIntent) || null)
            };
            state.currentPlayer = next;
            const stillPicking = () => inRoom(id, token) && state._onlineNativeRevision === revision &&
                state._onlineNativeRound === round && state.currentPlayer === next;
            try {
                const { data: row, error } = await getClient().from('pvp_rooms').select('data').eq('id', id).single();
                if (!stillPicking()) return;
                if (error || !row?.data) throw error || new Error('Room is unavailable');
                const room = row.data;
                if (room.battle?.engine !== 'showdown' || room.battle.pending_turn !== revision ||
                    (room.round_number || 1) !== round) {
                    state.currentPlayer = player;
                    this._onRemoteRow(row);
                    return;
                }
                if (!readNativeChoice(room, player)) {
                    const patch = { [nativeChoiceKey(player)]: choice };
                    if (next === 2) {
                        patch.battle_turn_deadline_iso = global.computeOnlineBattleTurnDeadlineIso?.(state) || null;
                    }
                    await this.pushData(patch);
                }
                if (stillPicking()) {
                    const moveMenu = global.document?.getElementById('move-menu');
                    const cmdMenu = global.document?.getElementById('command-menu');
                    moveMenu?.classList.add('hidden');
                    cmdMenu?.classList.remove('hidden');
                    global.refreshNativeBattleUi?.();
                    global.syncBattleActiveHighlight?.();
                }
            } catch (error) {
                if (!stillPicking()) return;
                state.currentPlayer = player;
                this._restoreTurnUiAfterSendFailure();
                global.refreshNativeBattleUi?.();
                console.warn('[OnlinePvP] native choice', error);
            }
        },

        async handlePvPPlayTurn(state, action, settings) {
            const sb = getClient();
            if (!sb || !roomId) return;
            if (state.battleEngine === 'showdown') return this._handleNativePvPTurn(state, action);
            const id = roomId;
            const token = roomToken;
            const myR = role;
            if (myR === 1 && hostPendingPublication && !await this._publishHostTurn()) {
                if (inRoom(id, token)) this._restoreTurnUiAfterSendFailure();
                return;
            }
            if (!inRoom(id, token)) return;
            const cp = state.currentPlayer;
            if (cp === 1 && myR !== 1) return;
            if (cp === 2 && myR !== 2) return;

            const g1 = state.p1GimmickIntent ? deepClone(state.p1GimmickIntent) : null;
            const g2 = state.p2GimmickIntent ? deepClone(state.p2GimmickIntent) : null;

            if (cp === 1) {
                const prevAction = state.p1Action;
                const prevPlayer = state.currentPlayer;
                state.p1Action = action;
                state.currentPlayer = 2;
                const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', id).single();
                if (!inRoom(id, token)) return;
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
                    p1_pick: encodeAction(action),
                    p1_gimmick: g1,
                    p2_pick: prev.battle && prev.battle.p2_pick,
                    p2_gimmick: prev.battle && prev.battle.p2_gimmick
                });
                const deadlineIso = typeof global.computeOnlineBattleTurnDeadlineIso === 'function' ? global.computeOnlineBattleTurnDeadlineIso(state) : null;
                try {
                    await this.pushData({ battle, battle_turn_deadline_iso: deadlineIso }, prev);
                } catch (e) {
                    if (!inRoom(id, token)) return;
                    state.p1Action = prevAction;
                    state.currentPlayer = prevPlayer;
                    this._restoreTurnUiAfterSendFailure();
                    console.warn('[OnlinePvP] handlePvPPlayTurn (P1) push', e);
                    return;
                }
                if (!inRoom(id, token)) return;
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
            const { data: row2, error: row2Err } = await sb.from('pvp_rooms').select('data').eq('id', id).single();
            if (!inRoom(id, token)) return;
            if (row2Err || !row2 || row2.data == null) {
                state.p2Action = prevAction2;
                state.currentPlayer = prevPlayer2;
                this._restoreTurnUiAfterSendFailure();
                console.warn('[OnlinePvP] handlePvPPlayTurn (P2) fetch', row2Err);
                return;
            }
            const prev = row2.data;
            const battle = Object.assign({}, prev.battle || {}, {
                p2_pick: encodeAction(action),
                p2_gimmick: g2,
                p1_pick: prev.battle && prev.battle.p1_pick,
                p1_gimmick: prev.battle && prev.battle.p1_gimmick
            });
            try {
                await this.pushData({ battle }, prev);
            } catch (e) {
                if (!inRoom(id, token)) return;
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
            if (hostPendingPublication) return;
            const b = d.battle;
            if (b.engine === 'showdown') {
                if (state.battleEngine !== 'showdown' || b.pending_turn !== state._onlineNativeRevision ||
                    (d.round_number || 1) !== state._onlineNativeRound) return;
                const needsP1 = !!nativeRequest(state, 1);
                const needsP2 = !!nativeRequest(state, 2);
                if ((!needsP1 && !needsP2) || (needsP1 && !b.p1_pick) || (needsP2 && !b.p2_pick)) return;
            } else if (!b.p1_pick || !b.p2_pick) return;
            if (state.isLocked || hostResolving) return;
            // Fence: a re-delivered row (or a timeout that raced a real pick) can
            // still carry both picks for a turn the host already resolved+pushed.
            // Without this, the boolean `hostResolving` is the only guard and a
            // second distinct UPDATE could double-apply the same turn.
            const turn = (typeof b.pending_turn === 'number') ? b.pending_turn : null;
            if (turn !== null && turn <= hostLastResolvedTurn) return;
            hostResolving = true;
            const id = roomId;
            const token = roomToken;
            try {
                await this._hostRunResolution(state, d);
            } finally {
                if (inRoom(id, token)) hostResolving = false;
            }
        },

        async _hostRunResolution(state, room) {
            const id = roomId;
            const token = roomToken;
            const remoteBattle = room.battle;
            const deser = (p, isP1) => {
                if (!p) return null;
                const a = { moveIndex: p.moveIndex, switchIndex: p.switchIndex, aiMove: null };
                if (p.aiMoveName) {
                    const mon = isP1 ? state.pActive : state.fActive;
                    const mv = mon && mon.moves ? mon.moves.find((m) => m.name === p.aiMoveName) : null;
                    if (mv) a.aiMove = mv;
                }
                return a;
            };
            const native = remoteBattle.engine === 'showdown';
            state.p1Action = deser(native && !nativeRequest(state, 1) ? null : remoteBattle.p1_pick, true);
            state.p2Action = deser(native && !nativeRequest(state, 2) ? null : remoteBattle.p2_pick, false);
            if (remoteBattle.p1_gimmick !== undefined) state.p1GimmickIntent = remoteBattle.p1_gimmick;
            if (remoteBattle.p2_gimmick !== undefined) state.p2GimmickIntent = remoteBattle.p2_gimmick;

            if (typeof global.__runLockedPvPTurnResolution === 'function') {
                await global.__runLockedPvPTurnResolution();
            }
            if (!inRoom(id, token)) return;

            const resolvedTurn = remoteBattle.pending_turn || hostLastResolvedTurn + 1;
            if (native) state._onlineNativeRevision = resolvedTurn + 1;
            const blob = exportBattleSnapshot(state);
            const h = simpleHash(blob);
            hostLastResolvedTurn = resolvedTurn;
            const battle = Object.assign({}, remoteBattle, {
                p1_pick: null,
                p2_pick: null,
                p1_gimmick: null,
                p2_gimmick: null,
                resolved_turn: resolvedTurn,
                pending_turn: resolvedTurn + 1,
                state_blob: blob,
                state_hash: h,
                presentation: native ? global.consumeOnlineBattleMotion?.() || [] : []
            });
            const patch = { battle, battle_log_html: captureBattleLogHtml() };
            let winner = null;
            const round = room.round_number || 1;
            if (state.isOver) {
                const p1Alive = state.playerParty.some((m) => m.currentHp > 0);
                const fAlive = state.foeParty.some((m) => m.currentHp > 0);
                winner = native ? state.nativeWinner ?? null : p1Alive === fAlive ? null : (p1Alive ? 1 : 2);
                // Publish the final state and its score together. Replaying
                // the same write after a lost response keeps absolute scores.
                Object.assign(patch, {
                    phase: 'done',
                    p1_wins: (room.p1_wins || 0) + (winner === 1 ? 1 : 0),
                    p2_wins: (room.p2_wins || 0) + (winner === 2 ? 1 : 0),
                    round_number: round,
                });
            }
            global.__onlineBattleDeadlineIso = null;
            hostPendingPublication = { id, token, patch, state, round, winner, retries: 0, failed: false, sending: null };
            await this._publishHostTurn();
        },

        _publishHostTurn(head) {
            const turn = hostPendingPublication;
            if (!turn || !inRoom(turn.id, turn.token)) return Promise.resolve(true);
            if (turn.sending) return turn.sending;
            if (hostPublicationTimer !== null) global.clearTimeout(hostPublicationTimer);
            hostPublicationTimer = null;
            const publish = async () => {
                try {
                    let current = head;
                    if (!current && turn.failed) {
                        const { data: row, error } = await getClient().from('pvp_rooms').select('data').eq('id', turn.id).single();
                        if (error || !row?.data) throw error || new Error('Room is unavailable');
                        current = row.data;
                    }
                    if (hostPendingPublication !== turn || !inRoom(turn.id, turn.token)) return false;
                    const round = current?.round_number || turn.round;
                    if (round !== turn.round) {
                        hostPendingPublication = null;
                        return false;
                    }
                    const resolved = current?.battle?.resolved_turn || 0;
                    if (resolved < turn.patch.battle.resolved_turn) {
                        const deadline = !turn.state.isOver && typeof global.computeOnlineBattleTurnDeadlineIso === 'function'
                            ? global.computeOnlineBattleTurnDeadlineIso(turn.state) : null;
                        await this.pushData({ ...turn.patch, battle_turn_deadline_iso: deadline });
                        if (hostPendingPublication !== turn || !inRoom(turn.id, turn.token)) return false;
                        global.__onlineBattleDeadlineIso = deadline;
                    } else {
                        global.__onlineBattleDeadlineIso = current.battle_turn_deadline_iso || null;
                        if (current.battle.state_hash !== turn.patch.battle.state_hash) {
                            hostPendingPublication = null;
                            return false;
                        }
                    }
                    hostPendingPublication = null;
                    void global.presentOnlineBattleMotion?.(turn.patch.battle.presentation, turn.round, turn.patch.battle.resolved_turn);
                    if (turn.patch.phase === 'done') {
                        global.__onlineP1Wins = turn.patch.p1_wins;
                        global.__onlineP2Wins = turn.patch.p2_wins;
                        global.__onlineRoundNumber = turn.round;
                        global.updateOnlineEndScreenScore?.();
                        if (turn.winner) void reportWinIfConfigured(turn.winner === 1);
                    }
                    return true;
                } catch (error) {
                    if (hostPendingPublication !== turn || !inRoom(turn.id, turn.token)) return false;
                    if (!turn.failed) global.logMsg?.('Connection interrupted. Reconnecting to share the resolved turn…', 'info');
                    turn.failed = true;
                    const delay = HOST_PUBLISH_RETRY_MS[turn.retries++];
                    if (delay !== undefined) {
                        hostPublicationTimer = global.setTimeout(() => {
                            hostPublicationTimer = null;
                            void this._publishHostTurn();
                        }, delay);
                    }
                    console.warn('[OnlinePvP] publish resolved turn', error);
                    return false;
                } finally {
                    turn.sending = null;
                }
            };
            turn.sending = publish();
            return turn.sending;
        },

        async hostResolveGuestBattleTimeout(state, settings) {
            if (role !== 1 || !roomId || hostPendingPublication) return;
            const sb = getClient();
            if (!sb) return;
            if (global.__onlineBattleDeadlineFiring) return;
            const id = roomId;
            const token = roomToken;
            const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', id).single();
            if (!inRoom(id, token)) return;
            if (rowErr) console.warn('[OnlinePvP] hostResolveGuestBattleTimeout fetch', rowErr);
            if (!row || !row.data || !row.data.battle) return;
            const room = withNativeChoices(row.data);
            const b = room.battle;
            const hasHostPick = b.engine === 'showdown' ? !nativeRequest(state, 1) || b.p1_pick : b.p1_pick;
            if (!hasHostPick || b.p2_pick || state.isLocked) return;
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
                if (!action) return;
                const g2 = state.p2GimmickIntent ? deepClone(state.p2GimmickIntent) : null;
                const remoteBattle = {
                    ...b,
                    p1_pick: b.p1_pick,
                    p2_pick: encodeAction(action),
                    p1_gimmick: b.p1_gimmick,
                    p2_gimmick: g2
                };
                await this.consumeRemoteForHost(state, settings, { ...room, battle: remoteBattle });
            } catch (e) {
                console.warn('[OnlinePvP] hostResolveGuestBattleTimeout', e);
            } finally {
                global.__onlineBattleDeadlineFiring = false;
            }
        },

        async afterHostStartBattle(state) {
            if (!this.isHost() || !roomId) return;
            const id = roomId;
            const token = roomToken;
            // New battle (incl. rematch) resets pending_turn to 1, so clear the fence
            // or the first turn of a rematch would be skipped as "already resolved".
            hostLastResolvedTurn = 0;
            // Include latest display names + match format so guest stays in sync
            const { data: nameRow, error: nameErr } = await getClient().from('pvp_rooms').select('data').eq('id', id).single();
            if (!inRoom(id, token)) return;
            if (nameErr || !nameRow || nameRow.data == null) {
                console.warn('[OnlinePvP] afterHostStartBattle fetch', nameErr);
                return;
            }
            const nPrev = nameRow.data;
            const round = nPrev.round_number || 1;
            const native = state.battleEngine === 'showdown';
            if (native) {
                state._onlineNativeRevision = 1;
                state._onlineNativeRound = round;
            }
            const blob = exportBattleSnapshot(state);
            const h = simpleHash(blob);
            const deadlineIso = typeof global.computeOnlineBattleTurnDeadlineIso === 'function' ? global.computeOnlineBattleTurnDeadlineIso(state) : null;
            const battle_log_html = captureBattleLogHtml();
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
                round_number: round,
                battle: {
                    ...(native ? { engine: 'showdown' } : {}),
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
            if (inRoom(id, token)) hostStartedBattle = true;
        },

        async guestApplyBattleStart(state, roomData) {
            const blob = typeof roomData === 'string' ? roomData : (roomData && roomData.battle_start_blob);
            if (!blob) return false;
            // Sync display names from room data
            if (roomData && typeof roomData === 'object') {
                if (roomData.host_display_name) global.__onlineHostName = roomData.host_display_name;
                if (roomData.guest_display_name) global.__onlineGuestName = roomData.guest_display_name;
                if (typeof roomData.p1_wins === 'number') global.__onlineP1Wins = roomData.p1_wins;
                if (typeof roomData.p2_wins === 'number') global.__onlineP2Wins = roomData.p2_wins;
                if (typeof roomData.round_number === 'number') global.__onlineRoundNumber = roomData.round_number;
                if (roomData.match_options && roomData.match_options.match_format) global.__onlineMatchFormat = roomData.match_options.match_format;
            }
            if (!applyBattleSnapshot(state, blob)) return false;
            global.resetOnlineBattleMotion?.();
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
            if (state.battleEngine === 'showdown') global.refreshNativeBattleUi?.();
            try { global.syncBattleActiveHighlight(); } catch (e) { /* optional UI hook */ }
            return true;
        },

        async guestApplyBattleBlob(state, d) {
            const b = d.battle || {};
            if (!b.state_blob) return false;
            const previousRevision = state._onlineNativeRevision;
            if (!applyBattleSnapshot(state, b.state_blob)) return false;
            if (d && d.battle_log_html !== undefined) applyBattleLogHtml(d.battle_log_html);
            if (typeof global.updateUI === 'function') global.updateUI();
            state.isLocked = false;
            const cmdEnd = global.document && global.document.getElementById('command-menu');
            if (!state.isOver) {
                if (cmdEnd) cmdEnd.classList.remove('hidden');
                if (state.battleEngine === 'showdown') global.refreshNativeBattleUi?.();
            } else if (role === 2 && typeof global.showEndScreen === 'function') {
                const p1s = state.playerParty.some((m) => m.currentHp > 0);
                const p2s = state.foeParty.some((m) => m.currentHp > 0);
                const p1Name = global.__onlineHostName || 'Host';
                const p2Name = global.__onlineGuestName || 'Guest';
                const winner = state.battleEngine === 'showdown' ? state.nativeWinner : p1s === p2s ? null : p1s ? 1 : 2;
                if (winner === 2) global.showEndScreen('VICTORY!', `You (${p2Name}) won this round!`, true);
                else if (winner === 1) global.showEndScreen('DEFEAT', `${p1Name} won this round.`, false);
                else global.showEndScreen('DRAW', 'The round ended in a draw.', false);
            }
            try { global.syncBattleActiveHighlight(); } catch (e) { /* optional UI hook */ }
            if (b.resolved_turn === previousRevision) {
                void global.presentOnlineBattleMotion?.(b.presentation, d.round_number || 1, b.resolved_turn);
            }
            const localH = simpleHash(b.state_blob);
            if (b.state_hash && localH !== b.state_hash && typeof global.logMsg === 'function') {
                global.logMsg('[Online] State hash mismatch — applied host snapshot.', 'info');
            }
            return true;
        },

        buildMatchOptionsFromSettings,
        applyMatchOptionsToSettings,
        localBattleOptions(settings) {
            return guestRules?.settings === settings ? guestRules.local : settings;
        },
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
    global.addEventListener?.('online', () => {
        if (OnlineBattle.isActive()) void OnlineBattle._resyncFromHead();
    });
})(typeof window !== 'undefined' ? window : globalThis);
