# Localhost URL for testing

## URL

**http://localhost:5173/battle.html**

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
- **Party HP, status, PP, and consumed held items between battles** are persisted on the save only when **Hardcore** difficulty is selected. On other difficulties, each new battle rebuilds your team at full health; only hardcore keeps attrition across fights.
- **General settings** (for example toggles under the main Settings screen) live in separate storage from the story run and are not the same object as `pbs_story_save`.

## Alternative (no server)

You can open `battle.html` directly in the browser (`file://`), but some features (fetch to APIs, certain CORS cases) behave better over `http://localhost`, so prefer `npm start` when testing online/PvP-related behavior.
