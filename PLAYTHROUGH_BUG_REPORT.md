# Story Mode — Browser Playthrough Bug Report

A real-browser, human-like automated playthrough of the **entire** Story Mode
timeline (67 events), driving the actual UI the way a player does. Complements
the jsdom code-audit in `BUG_REPORT.md` (BUG-001…028) — these findings are
**net-new** and do not overlap it. IDs use a `PT-` prefix to mark the distinct
(browser) methodology.

## Method
- **Harness:** `scripts/debug/story-playthrough.mjs` (committed, reusable).
- **Reproduce:** `node scripts/debug/story-playthrough.mjs --real-battles=4 --max-iters=140`
  (drives the first 4 battles by *clicking real moves* in the command menu;
  force-wins the rest via `StoryMode.onBattleEnd` so the run always completes).
- **Engine:** headless Chromium (Playwright) at phone-portrait viewport.
- **Checks per screen:** DOM text-scan for `undefined` / `NaN` / `[object Object]` /
  unrendered `${…}` / `Infinity` / `null`; same-origin broken-image scan; full-page
  screenshots; live console capture.
- **On the test environment (important):** the sandbox blocks outbound CDNs
  (`cdn.jsdelivr.net`, `play.pokemonshowdown.com`). This is **not merely noise to
  filter** — it faithfully reproduces the experience of **offline / firewalled /
  corporate-proxy / content-blocker / slow-connection** players, a real population.
  The two findings below are exactly the bugs that population hits and that an
  online-only tester would never see. Genuine network/cert noise
  (`ERR_CERT_*`, `net::ERR_*`, `supabase`, `online-pvp`, ServiceWorker, manifest,
  favicon) **is** filtered and is not reported.

## Executive summary
- **The online happy path is robust.** The full 67-event traversal completes:
  starter accepted, **8 badges**, City9 post-Hall-of-Fame hub reached, post-game
  phase entered. The DOM text-scan found **zero** content anomalies across the
  entire run — no `undefined`/`NaN`/`[object Object]`/unrendered template/`Infinity`/`null`.
- **PT-001 (Major):** the battle **turn loop** calls `anime.js` with no existence
  guard. When `anime.js` (CDN) is unavailable, **every damaging move and every
  switch** throws `anime is not defined` → `Turn skipped` → no damage is ever
  dealt → **the battle is unwinnable**. The developers already *documented and
  guarded this exact failure mode* at one spot (`startBattle`) but missed the
  entire turn-resolution path. Observed **188×** in one playthrough.
- **PT-002 (Minor):** the **local sprite bundle is incomplete in a scattered
  way** — several common base forms (caterpie, metapod, pidgeotto, jigglypuff, …,
  pumpkaboo) are remote-only even though their evolution neighbours are bundled.
  Offline / CDN-blocked players see broken sprites for them; online players are
  unaffected.
- **Investigated and ruled out (not bugs):** see the final section — uppercase-"é"
  rendering (empirically renders `POKÉ` correctly), screenshot overlay overlaps
  (harness artifact), the `<NAME> Sucks` rival taunt (intentional), and the gimmick
  `ZMOVE → STANDARD` warnings (intentional graceful degradation).

---

## Major

### PT-001 — Battle turn loop crashes (`anime is not defined`) when the anime.js CDN is unavailable; every move/switch is "Turn skipped"
- **Severity:** Major. (Online players on a fast connection are unaffected; but
  for **offline / firewalled / content-blocked / CDN-down / slow-connection**
  players it is battle-breaking — they cannot win, or even lose, a single battle.)
- **Area:** Battle engine — turn resolution / animation.
- **Steps to reproduce:**
  1. Make `anime.js` unreachable the way a real player can: go offline, block
     `cdn.jsdelivr.net` (corporate proxy / firewall / a content-blocker or privacy
     extension), or hit a jsdelivr outage. (The harness's sandbox does this
     automatically.)
  2. Open `battle.html`, start a story run, pick a starter, enter the first battle.
  3. The battle **starts fine** — the sprite-entrance animation is guarded, so
     sprites just snap in without the bounce.
  4. Select any **damaging** move (or switch Pokémon).
- **Expected:** Animations are cosmetic. If `anime.js` is unavailable, the move
  should still **resolve** (damage applied) without the flourish — exactly the way
  the sprite-entrance path already degrades.
- **Actual:** The battle log prints `<mon> used <move>!` and then
  `[Error: anime is not defined. Turn skipped.]`; the command menu reappears and
  the foe's HP is **unchanged**. Every subsequent damaging move/switch does the
  same. The foe never loses HP → **the battle cannot be won** (nor lost). It
  degrades *gracefully* — no hard soft-lock, input returns, the error is shown —
  but **no progress is possible**.
- **Evidence:**
  - `anime.js` is CDN-loaded: `battle.html:8242`
    `<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>`
    (blocking, no `async`/`defer`).
  - **Exactly one** of the ~120 `anime(` call sites is guarded with
    `typeof anime === 'function'`: `battle.html:16505` (sprite entrance in
    `startBattle`). Its own comment (`battle.html:16500–16503`) documents this
    failure mode verbatim: *"anime.js is CDN-loaded; if the request failed (slow /
    blocked / offline), skip the bounce… Without this guard a single network
    hiccup would throw ReferenceError… crash startBattle…"*.
  - The **turn-resolution path is unguarded**: `performAction` attacker-lunge
    `battle.html:22343`; switch-out animations `:20704` (player) and `:20723`
    (foe); `:21165`; hit-flash / screen-shake `:23769`, `:23784`, `:23788`,
    `:23801`. Stat-change arrows are unguarded too — `showStatArrow`
    `battle.html:13042`, reached via `changeStage` (`:27647`) ←
    `applySwitchInAbilities` (`:25301`) (e.g. Intimidate on switch-in, any stat
    boost/drop).
  - The throw is caught at `battle.html:20908` and logged to the battle log at
    `:20909` (`logMsg(\`[Error: ${…}. Turn skipped.]\`, 'dmg')`), then input is
    unlocked and the command menu re-shown (`:20910–20912`). That is why it
    *recovers* per-turn but never *progresses*.
  - Stack trace (from the run): `performAction (battle.html:22343)` ←
    `__runLockedPvPTurnResolution (:20842)` ← `playTurn (:20566)` ← `btn.onclick`.
  - **188 occurrences** of `Battle error: ReferenceError: anime is not defined` in
    a single 4-real-battle playthrough; each real battle exhausted its 50-turn cap
    with **zero** turns resolving. A separate `startBattle`-level catch also logged
    `[startBattle] applySwitchInAbilities: ReferenceError: anime is not defined` at
    `showStatArrow (:13042)` (this one is swallowed by `startBattle`'s try/catch, so
    the battle still starts — confirming the same root cause spans both paths).
  - Screenshot `screenshots/playthrough/042-battle-turn3.png`: the battle log shows
    `… used <move>!` / `[Error… anime is not defined. Turn skipped.]` repeating,
    with the foe at **full HP (107/107)** after multiple turns.
- **Suspected cause:** When the CDN-loaded `anime` global is hardened, only the
  single most-visible crash (sprite entrance at battle start) got a
  `typeof anime === 'function'` guard. The per-turn animation calls — which run far
  more often — were never given the same guard, so the *documented* "network
  hiccup" failure simply moved from `startBattle` into `performAction`.
- **Suggested fix:** Two options.
  - **Comprehensive (recommended):** install a no-op fallback immediately after the
    CDN `<script>` (so it only fills in when the CDN failed). The shim must cover
    the full API surface in use — `anime()` (returns `{finished}`), `anime.stagger`,
    `anime.remove`, `anime.timeline().add()` chaining — e.g.
    `window.anime = window.anime || (() => { const t = () => ({ finished: Promise.resolve(), add(){ return this; } }); const a = () => t(); a.stagger = () => 0; a.remove = () => {}; a.timeline = () => t(); return a; })();`.
    One place, covers all ~120 sites.
  - **Local (matches existing code):** wrap each turn-path call in
    `if (typeof anime === 'function') { … } else { await sleep(dur); }`, mirroring
    the guard at `:16505` and the `else await sleep(300)` fallbacks already present
    at `:20705` / `:20724`.

---

## Minor

### PT-002 — Incomplete local sprite bundle: common base forms are remote-only, so offline players see broken sprites
- **Severity:** Minor. (Online players unaffected — the CDN serves the missing
  sprites. Offline / firewalled / content-blocked players see broken images.)
- **Area:** Sprite asset bundle / `getSprite` fallback.
- **Steps to reproduce:**
  1. Block the sprite CDN (`play.pokemonshowdown.com`) — offline, firewall, or a
     content-blocker — or simply play offline after the first load.
  2. Encounter or own a remote-only common species — e.g. the harness rolled
     **Pumpkaboo** as a starter; early routes use Caterpie/Metapod.
  3. Observe a broken-image icon where the sprite should be.
- **Expected:** A bundled sprite, or a graceful same-origin placeholder.
- **Actual:** `handleSpriteError`'s fallback chain is **all-remote**, so when the
  CDN is blocked every fallback also fails and the `<img>` ends as a broken-image
  icon.
- **Evidence:**
  - `getSprite` / `handleSpriteError` (`battle.html:13156–13244`) choose local
    `sprites/<dir>/<sid>.gif` vs remote `play.pokemonshowdown.com/...` via
    `LOCAL_SPRITE_MANIFEST` (`battle.html:13100–13108`).
  - The `gen5ani` local set has **986** of ~1500+ species. The gaps are
    **scattered, not a clean cutoff** — neighbours are bundled but these common
    base/early forms are remote-only: `caterpie, metapod, pidgeotto, jigglypuff,
    poliwhirl, skrelp, feebas, boldore, bayleef, quilava, nidoran-f, nidoran-m,
    nidorina, nidorino, pumpkaboo`. For contrast, **bundled** neighbours include
    `butterfree, weedle, kakuna, beedrill, pidgey, pidgeot, poliwag, poliwrath,
    wigglytuff, milotic, meganium, typhlosion` (verified via
    `LOCAL_SPRITE_MANIFEST['gen5ani'].has(...)`).
  - The harness's broken-image scan **intentionally ignores** CDN failures as
    environment noise (`scripts/debug/story-playthrough.mjs:169–170` — "Only
    same-origin (local sprite) failures count"), which is why this does not appear
    as a "broken-image" finding for online play — it is an offline-only concern.
- **Suspected cause:** The manifest is generated (`scripts/build-sprite-manifest.mjs`)
  from whatever files exist under `sprites/gen5ani/`; the gaps mirror missing
  source files rather than a deliberate cutoff.
- **Suggested fix:** Either bundle the missing common base forms, or give
  `handleSpriteError` a **final same-origin placeholder** (a bundled "unknown"
  sprite) so offline players get a clean placeholder instead of a broken-image
  icon. Low priority — likely an intentional download-size tradeoff (partial
  bundle + CDN fallback); the value here is documenting that the gaps are
  scattered (so a "bundle the first N Pokédex entries" assumption is wrong).

---

## Investigated and ruled out (not game bugs)
- **Uppercase "é" → "POKé"** — *empirically disproven.* A Chromium probe rendering
  `Poké`/`Pokémon` under `text-transform:uppercase` produces **`POKÉ` / `POKÉMON`**
  correctly (modern Chromium uppercases `é → É` per Unicode). No bug. (This was a
  suspected finding; verifying in the real browser before reporting avoided a false
  positive.)
- **Overlapping overlays in some screenshots** — *harness artifact, not a game
  bug.* The harness advances story state **programmatically** (`onBattleEnd`, etc.),
  which leaves the intro cold-open "Continue →" overlay (`_showIntroRivalColdOpen`)
  undismissed; a real player who clicks "Continue →" never sees the overlap.
  (Latent robustness note, not player-facing: unlike the victory overlay, the intro
  cold-open has **no auto-close**, so it can orphan if state ever advances without a
  click. Low.)
- **`<PLAYER> Sucks` rival taunt** — *intentional design.* `_storyRivalTauntName`
  (`battle.html:43634`) deliberately renders the rival's trash-talk as
  "`<player name> Sucks`". Working as intended.
- **`[Gimmick] … rolled ZMOVE but build cannot support it — degrading to STANDARD`**
  (Cetoddle / Mantine / Mr. Mime-Galar in the run) — *intentional graceful
  degradation* when a randomly-rolled build can't support the rolled gimmick. Not a
  bug.
