# Localhost URL for testing

## URL

**http://localhost:5173/battle.html**

**KO / faint / hazard debug sandbox:** `http://localhost:5173/battle.html?kobugtest=1` (or `battle.html#kobugtest` — or Settings → *Developer / Story tools* → **Debug: KO / hazard test**). Puts **Stealth Rock** on your side, **Blissey** + two **Shedinja**; let the foe KO Blissey, then test forced switch chains.

The dev server prints this on startup (`scripts/dev-server.cjs`; `PORT` defaults to `5173`).

## How to run

From the project folder:

```bash
npm start
```

That runs `node scripts/dev-server.cjs` (see `package.json`).

## Optional: different port

**cmd.exe:**

```bat
set PORT=8080 && npm start
```

**PowerShell:**

```powershell
$env:PORT = 8080; npm start
```

Then open `http://localhost:8080/battle.html`.

## Story Mode saves (local browser only)

Story runs are stored in **one** browser `localStorage` key: `pbs_story_save`. There is **no cloud sync**; clearing site data or using another browser/device does not carry the run over.

- **Bag and money** are part of that save. Using a story battle item writes the updated inventory to storage immediately (so the save always reflects the last persisted state).
- **Party HP, status, PP, and consumed held items** are fully restored between battles on every difficulty. Mart consumables (potions, X-items, orbs) matter only within a single battle.
- **General settings** (for example toggles under the main Settings screen) live in separate storage from the story run and are not the same object as `pbs_story_save`.
- See `STORY_MODE_FLOW.md` for the working spec of the upcoming catch / PC / Underground / Safari / boss-arc systems.

## Alternative (no server)

You can open `battle.html` directly in the browser (`file://`), but some features (fetch to APIs, certain CORS cases) behave better over `http://localhost`, so prefer `npm start` when testing online/PvP-related behavior.
