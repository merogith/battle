---
severity: P2
category: security
anchor_symbol: toggleEnemyPool
current_line_hint: ~19245
file: battle.html
agents: [pvp-concurrency-hunter]
fingerprint: 181f526c1a75
confidence: high
status: open
---

**Title**: Draft-card innerHTML renders remote-controlled Pokémon name / teraType — XSS + JS-injection past the log sanitizer

**Evidence**:
```js
// battle.html toggleEnemyPool ~19245 (also renderDraft ~19204) — draftItem comes
// straight from d.p1_pool/d.p2_pool via mergeOnlineDraftFromPayload ({name,build}).
row.innerHTML = `... ${tempMon.name} ${getTypeHTML(...)} ...`;   // name unescaped
// ~19242 teraType injected raw into an inline onclick JS string:
`...onmousemove="...window.showTeraTooltip('${draftItem.build.teraType}','${tempMon.type1}',...)">...`
```

**Repro**: Join a room (valid guest_token), then call `pvp_push_data` with a
`p2_pool` entry `{name:"<img src=x onerror=alert(document.cookie)>", build:{teraType:"');alert(1)//"}}`.
When the opponent opens Inspect Foe (or renders their draft grid), the name runs
via `innerHTML` and the teraType breaks out of the inline `onclick` string.
`buildPokemon` accepts any name (unknown → default stats), so the payload survives.

**Blast radius**: Every peer-facing draft surface — enemy-pool modal
(`enemy-pool-grid`), own draft grid (`draft-grid`), draft party slots (~19117).
`OnlineBattle.sanitizeBattleLogHtml` only guards `#battle-log`; the entire draft
render path is unsanitized. `setDisplayName` strips `<>` for names but pool
`name`/`build` fields have no such gate.

**Fix sketch**: Escape all remote-sourced interpolations in the draft renderers
(textContent for names, or an HTML-escape helper), and stop injecting `teraType`
into inline `on*` handler strings — use `data-*` + `encodeURIComponent` like the
sibling attributes already do. Optionally allowlist pool `name` against the real
species table on ingest in `mergeOnlineDraftFromPayload`.

**Verification**: Push a crafted pool entry from a second client; confirm the
opponent's Inspect Foe shows the literal text and fires no script; existing
online-pvp-security.test.js still green.

---
severity: P2
category: bug
anchor_symbol: pushDraftState
current_line_hint: ~503
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 135bbb72a0cc
confidence: high
status: open
---

**Title**: Parallel-draft lost update — pushDraftState clobbers the peer's concurrently-drafted arrays via shallow jsonb merge

**Evidence**:
```js
async pushDraftState(state) {
    const patch = {
        p1_pool: ..., p2_pool: ..., p1_draft: ..., p2_draft: ...  // ALL FOUR, from local state
    };
    await this.pushData(patch);   // server RPC does new_data = cur || patch (shallow)
}
```

**Repro**: In an online (parallel) draft both peers pick from their own pools in
the same window. Guest picks → `pvp_push_data({p2_draft:[...]})` lands on the
server. Before that UPDATE is applied locally on the host, the host picks and
calls `pushDraftState`, whose patch still carries the host's STALE `p2_pool`/
`p2_draft`. `pvp_push_data`'s `cur || patch` top-level merge overwrites the
server's fresh `p2_draft` with the host's stale copy → the guest's pick is
reverted. Symmetric in the other direction (guest clobbers `p1_draft`).

**Blast radius**: Two events whose ordering matters — peer's `pvp_push_data`
(draft) vs the local `pushDraftState` built on not-yet-merged peer state. Causes
dropped/duplicated picks, draft-count desync, and can stall the "both drafts
complete" trigger (host never sees `p2_draft.length === n`).

**Fix sketch**: Each peer should only write the arrays it owns — host sends
`p1_pool`/`p1_draft`, guest sends `p2_pool`/`p2_draft` — so the shallow merge
can't cross-clobber. Alternatively push per-pick deltas server-side, or add a
draft-side seq/CAS in `pvp_push_data`.

**Verification**: Script two clients drafting simultaneously; confirm both
six-mon drafts survive and the battle-start trigger fires exactly once.

---
severity: P3
category: perf
anchor_symbol: dispose
current_line_hint: ~576
file: online-pvp.js
agents: [pvp-concurrency-hunter]
fingerprint: 7f0a0b2a2a94
confidence: medium
status: open
---

**Title**: dispose() removes the channel but never closes the Supabase client — realtime socket + no disconnect teardown leak across a session

**Evidence**:
```js
let client = null;               // module global, set once in getClient()
...
dispose() {
    if (channel && sb) { try { sb.removeChannel(channel); } catch (e) {} }
    channel = null; roomId = null; ...   // `client` is NEVER reset
}
```

**Blast radius**: `dispose()` (called only from `returnToHome`) tears down the
channel + the two 250ms watchdog intervals, but the cached `client` — and its
open Realtime websocket — persists for the whole page session. There is also no
opponent-disconnect / idle teardown: if a peer abandons a live room, the other
side keeps its channel subscribed and both `setInterval` watchdogs firing until
the user manually returns home. Not a runaway leak (single client, timers idle
via early-return), but a lingering socket + timers per match.

**Fix sketch**: On `dispose()`, after `removeChannel`, call
`client.removeAllChannels()`/`client.realtime.disconnect()` (or null `client` so
the next room mints a fresh one). Optionally add a presence/heartbeat so an
abandoned room tears down its channel + watchdogs without a manual return.

**Verification**: After returnToHome, confirm no lingering `pvp_rooms` realtime
subscription in the Supabase client and both watchdog interval handles are null.

