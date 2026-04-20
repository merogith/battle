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
    let applyingRemote = false;
    let hostStartedBattle = false;
    let hostResolving = false;

    function configured() {
        const u = global.__PBS_SUPABASE_URL;
        const k = global.__PBS_SUPABASE_ANON_KEY;
        return u && k && !String(u).includes('YOUR_PROJECT') && k.length > 20;
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
        const base = prev && typeof prev === 'object' ? JSON.parse(JSON.stringify(prev)) : {};
        return Object.assign(base, patch);
    }

    async function fetchRoomByCode(code) {
        const sb = getClient();
        if (!sb) return { error: 'not_configured' };
        const c = String(code || '').trim().toUpperCase();
        if (c.length < 4) return { error: 'bad_code' };
        const { data, error } = await sb.from('pvp_rooms').select('*').eq('code', c).maybeSingle();
        if (error) return { error: error.message };
        if (!data) return { error: 'not_found' };
        return { room: data };
    }

    function deepClone(o) {
        return JSON.parse(JSON.stringify(o));
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
            revealedFoe: revealed,
            score: state.score,
            pendingEoT: !!state.pendingEoT
        };
        return JSON.stringify(snap);
    }

    function applyBattleSnapshot(state, jsonStr) {
        const o = JSON.parse(jsonStr);
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
        state.pActive = state.playerParty.find((m) => m.name === o.pActiveName) || state.playerParty[0];
        state.fActive = state.foeParty.find((m) => m.name === o.fActiveName) || state.foeParty[0];
        state.revealedFoe = new Set(o.revealedFoe || []);
        state.score = o.score || 0;
        state.pendingEoT = o.pendingEoT;
        state.p1Action = null;
        state.p2Action = null;
        state.currentPlayer = 1;
    }

    function simpleHash(str) {
        let h = 5381;
        for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
        return (h >>> 0).toString(16);
    }

    async function reportWinIfConfigured(winnerIsP1) {
        const sb = getClient();
        if (!sb || !roomId) return;
        try {
            const n = (global.localStorage.getItem(STORAGE_KEY) || '').trim() || 'Trainer';
            const { data: row } = await sb.from('pvp_rooms').select('data').eq('id', roomId).maybeSingle();
            const d = row && row.data ? row.data : {};
            const winnerName = winnerIsP1 ? (d.host_display_name || n) : (d.guest_display_name || n);
            if (!winnerName) return;
            const { data: ex } = await sb.from('pvp_leaderboard').select('wins').eq('name', winnerName).maybeSingle();
            const w = (ex && ex.wins) ? ex.wins + 1 : 1;
            await sb.from('pvp_leaderboard').upsert({ name: winnerName, wins: w, updated_at: new Date().toISOString() }, { onConflict: 'name' });
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

        applyHostMatchOptions(settings) {
            const sb = getClient();
            if (!sb || !roomId) return;
            sb.from('pvp_rooms').select('data').eq('id', roomId).maybeSingle().then(({ data: row }) => {
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
            });
        },

        async createRoom(matchOptions, enabledGens, poolPayload) {
            const sb = getClient();
            if (!sb) throw new Error('Supabase not configured');
            const eg = (enabledGens && enabledGens.length)
                ? [...new Set(enabledGens)].filter((g) => g >= 1 && g <= 9).sort((a, b) => a - b)
                : [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const minGen = Math.min(...eg);
            const maxGen = Math.max(...eg);
            roomCode = randomCode();
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
                p1_pool: poolPayload.p1_pool,
                p2_pool: poolPayload.p2_pool,
                p1_draft: [],
                p2_draft: [],
                draft_turn: 1,
                guest_joined: false,
                draft_deadline_iso: null,
                battle_turn_deadline_iso: null,
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
            const { data: row, error } = await sb.from('pvp_rooms').insert({ code: roomCode, data }).select('id').single();
            if (error) throw error;
            roomId = row.id;
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
            const data = mergeData(prev, { guest_joined: true, guest_display_name: nm, seq: (prev.seq || 0) + 1 });
            const { error } = await sb.from('pvp_rooms').update({ data, updated_at: new Date().toISOString() }).eq('id', roomId);
            if (error) throw error;
            lastRemoteSeq = data.seq;
            this._subscribe();
            const { data: rowFresh } = await sb.from('pvp_rooms').select('*').eq('id', roomId).single();
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
                try { sb.removeChannel(channel); } catch (e) {}
                channel = null;
            }
            channel = sb.channel('room-' + roomId)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pvp_rooms', filter: 'id=eq.' + roomId }, (payload) => {
                    this._onRemoteRow(payload.new);
                })
                .subscribe();
        },

        dispose() {
            const sb = getClient();
            if (channel && sb) {
                try { sb.removeChannel(channel); } catch (e) {}
            }
            channel = null;
            roomId = null;
            roomCode = null;
            role = null;
            lastRemoteSeq = 0;
            applyingRemote = false;
            hostStartedBattle = false;
            hostResolving = false;
            try {
                global.__hostOnlineBattleStarted = false;
                global.__guestLastResolved = 0;
                global.__guestBattleStartApplied = false;
                global.__onlineGuestJoined = false;
                global.__onlineHostDraftDeadlinePrimed = false;
                if (typeof global.clearOnlinePvPTimers === 'function') global.clearOnlinePvPTimers();
            } catch (e) {}
        },

        async pushData(patch) {
            const sb = getClient();
            if (!sb || !roomId) return;
            const { data: row } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
            const prev = row && row.data ? row.data : {};
            const seq = (prev.seq || 0) + 1;
            const data = mergeData(prev, patch);
            data.seq = seq;
            await sb.from('pvp_rooms').update({ data, updated_at: new Date().toISOString() }).eq('id', roomId);
        },

        _onRemoteRow(newRow) {
            if (!newRow || applyingRemote) return;
            const d = newRow.data || {};
            if ((d.seq || 0) <= lastRemoteSeq) return;
            lastRemoteSeq = d.seq || lastRemoteSeq + 1;
            applyingRemote = true;
            try {
                if (typeof global.onOnlineRoomData === 'function') {
                    global.onOnlineRoomData(d, { role, roomCode });
                }
            } finally {
                applyingRemote = false;
            }
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
                state.p1Action = action;
                state.currentPlayer = 2;
                const { data: row } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
                const prev = row && row.data ? row.data : {};
                const battle = Object.assign({}, prev.battle || {}, {
                    p1_pick: ser(action),
                    p1_gimmick: g1,
                    p2_pick: prev.battle && prev.battle.p2_pick,
                    p2_gimmick: prev.battle && prev.battle.p2_gimmick
                });
                const deadlineIso = typeof global.computeOnlineBattleTurnDeadlineIso === 'function' ? global.computeOnlineBattleTurnDeadlineIso(state) : null;
                await this.pushData({ battle, battle_turn_deadline_iso: deadlineIso });
                if (typeof global.logMsg === 'function') global.logMsg("Waiting for opponent…", 'info');
                document.getElementById('move-menu').classList.add('hidden');
                document.getElementById('command-menu').classList.remove('hidden');
                try { global.syncBattleActiveHighlight(); } catch (e) {}
                return;
            }

            state.p2Action = action;
            state.currentPlayer = 1;
            const { data: row } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
            const prev = row && row.data ? row.data : {};
            const battle = Object.assign({}, prev.battle || {}, {
                p2_pick: ser(action),
                p2_gimmick: g2,
                p1_pick: prev.battle && prev.battle.p1_pick,
                p1_gimmick: prev.battle && prev.battle.p1_gimmick
            });
            await this.pushData({ battle });
            /* Host runs resolution when guest's p2 pick arrives — see consumeRemoteForHost from onOnlineRoomData */
        },

        async consumeRemoteForHost(state, settings, d) {
            if (role !== 1 || !d || !d.battle) return;
            const b = d.battle;
            if (!b.p1_pick || !b.p2_pick) return;
            if (state.isLocked || hostResolving) return;
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
            const { data: row } = await getClient().from('pvp_rooms').select('data').eq('id', roomId).single();
            const prev = row && row.data ? row.data : {};
            const battle = Object.assign({}, prev.battle || {}, {
                p1_pick: null,
                p2_pick: null,
                p1_gimmick: null,
                p2_gimmick: null,
                resolved_turn: (prev.battle && prev.battle.pending_turn) || 1,
                pending_turn: ((prev.battle && prev.battle.pending_turn) || 1) + 1,
                state_blob: blob,
                state_hash: h
            });
            const nextDeadline = !state.isOver && typeof global.computeOnlineBattleTurnDeadlineIso === 'function'
                ? global.computeOnlineBattleTurnDeadlineIso(state)
                : null;
            await this.pushData({ battle, battle_turn_deadline_iso: nextDeadline });

            if (state.isOver) {
                await this.pushData({ phase: 'done', battle_turn_deadline_iso: null });
                const p1Alive = state.playerParty.some((m) => m.currentHp > 0);
                const fAlive = state.foeParty.some((m) => m.currentHp > 0);
                if (p1Alive && !fAlive) await reportWinIfConfigured(true);
                else if (fAlive && !p1Alive) await reportWinIfConfigured(false);
            }
        },

        async hostResolveGuestBattleTimeout(state, settings) {
            if (role !== 1 || !roomId) return;
            const sb = getClient();
            if (!sb) return;
            if (global.__onlineBattleDeadlineFiring) return;
            const { data: row } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
            if (!row || !row.data || !row.data.battle) return;
            const b = row.data.battle;
            if (!b.p1_pick || b.p2_pick || state.isLocked) return;
            if (state.currentPlayer !== 2) return;
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
            const blob = exportBattleSnapshot(state);
            const h = simpleHash(blob);
            const deadlineIso = typeof global.computeOnlineBattleTurnDeadlineIso === 'function' ? global.computeOnlineBattleTurnDeadlineIso(state) : null;
            await this.pushData({
                phase: 'battle',
                draft_deadline_iso: null,
                battle_turn_deadline_iso: deadlineIso,
                battle_start_blob: blob,
                battle_start_hash: h,
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
            });
            hostStartedBattle = true;
        },

        async guestApplyBattleStart(state, blob) {
            applyBattleSnapshot(state, blob);
            if (global.AudioSystem && typeof global.AudioSystem.startNewBattle === 'function') {
                try { global.AudioSystem.startNewBattle(); } catch (e) {}
            }
            document.getElementById('screen-draft').classList.add('hidden');
            document.getElementById('screen-battle').classList.remove('hidden');
            document.getElementById('gauntlet-score').classList.add('hidden');
            if (typeof global.updateUI === 'function') global.updateUI();
            document.getElementById('move-menu').classList.add('hidden');
            document.getElementById('command-menu').classList.remove('hidden');
            if (typeof global.applyBattleLogDockClass === 'function') global.applyBattleLogDockClass();
            try { global.syncBattleActiveHighlight(); } catch (e) {}
        },

        async guestApplyBattleBlob(state, d) {
            const b = d.battle || {};
            if (!b.state_blob) return;
            applyBattleSnapshot(state, b.state_blob);
            if (typeof global.updateUI === 'function') global.updateUI();
            state.isLocked = false;
            if (!state.isOver) {
                document.getElementById('command-menu').classList.remove('hidden');
            } else if (role === 2 && typeof global.showEndScreen === 'function') {
                const p1s = state.playerParty.some((m) => m.currentHp > 0);
                const p2s = state.foeParty.some((m) => m.currentHp > 0);
                if (!p1s && p2s) global.showEndScreen('VICTORY!', 'You won the online battle!', true);
                else if (p1s && !p2s) global.showEndScreen('DEFEAT', 'You lost the online battle.', false);
                else global.showEndScreen('DRAW', 'The battle ended in a draw.', false);
            }
            try { global.syncBattleActiveHighlight(); } catch (e) {}
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
        getDisplayName() {
            return (global.localStorage.getItem(STORAGE_KEY) || '').trim() || 'Trainer';
        },
        setDisplayName(n) {
            global.localStorage.setItem(STORAGE_KEY, String(n || '').trim().slice(0, 24) || 'Trainer');
        }
    };

    global.OnlineBattle = OnlineBattle;
    global.__onlinePvpConfigured = configured;
})(typeof window !== 'undefined' ? window : globalThis);
