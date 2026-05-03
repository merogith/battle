# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a browser-based Pokémon Battle Simulator ("Pokémon Arena"). It's a single-page app served by a minimal Node.js static file server with zero npm dependencies.

### Running the dev server

```bash
export NVM_DIR="/home/ubuntu/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
node scripts/dev-server.cjs
```

The server starts at **http://localhost:5173/battle.html** (port configurable via `PORT` env var).

### Key notes

- **No npm dependencies**: `package.json` has no `dependencies` or `devDependencies`. No `npm install` needed.
- **No linter/test/build scripts**: The project has no ESLint, Prettier, TypeScript, or test framework configured. Validation is done by loading the app in a browser.
- **Node.js via nvm**: Node.js is installed at `/home/ubuntu/.nvm/versions/node/v22.22.2/`. Load it with `export NVM_DIR="/home/ubuntu/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"` before running any `node`/`npm` commands.
- **All game logic is in `battle.html`**: This is a ~1.6MB monolithic file. Use section markers (`// ===` and `<!-- =====`) to navigate subsystems.
- **External scripts**: `online-pvp.js`, `move-sfx-map.js`, `move-anim-map.js` are loaded alongside the inline JS.
- **Data files**: JSON data lives in `data/` (species, moves, items, abilities, natures, builds).
- **Supabase (online PvP)**: Uses a remote hosted Supabase instance; no local database needed.
- **No hot reload**: The dev server is a plain static file server. After editing files, manually refresh the browser.
