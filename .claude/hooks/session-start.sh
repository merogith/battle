#!/bin/sh
# SessionStart hook — bootstraps the debug system for a fresh session.
# Idempotent. Designed to finish in <15s on a warm box.
set -e

cd "$(dirname "$0")/../.."

# 1. Install jsdom if missing (idempotent; skipped when node_modules/jsdom already present).
if [ ! -d node_modules/jsdom ]; then
  echo "[session-start] installing dependencies..."
  npm install --no-audit --no-fund --silent
fi

# 2. Refresh the symbol index (battle.html anchors drift on every insertion).
echo "[session-start] refreshing symbol index..."
node scripts/debug/symbol-index.mjs >/dev/null

# 3. Regenerate the anchor map (consumes the fresh symbol index).
node scripts/debug/anchor-map.mjs >/dev/null

# 4. Smoke-test the harness — proves jsdom + RNG + Dex stubs still work, ~3s.
echo "[session-start] smoke-testing jsdom harness..."
if ! node --test tests/property/smoke.test.js >/dev/null 2>&1; then
  echo "[session-start] WARNING: jsdom harness smoke test failed — run \`npm test -- tests/property/smoke.test.js\` to debug." >&2
fi

echo "[session-start] ready. Run /deep-debug, /story-audit, /perf-check, or /data-check."
