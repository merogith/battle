#!/usr/bin/env bash
# Run against the verified dist directory produced by npm run build:release.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
output="${BATTLE_CANDIDATE_OUT:-agent-state/playthrough/ci}"
port="${BATTLE_CANDIDATE_PORT:-5177}"
export BATTLE_TEST_URL="http://127.0.0.1:$port/dist/battle.html"
export BATTLE_EXPECT_STORY_ENGINE=showdown
export BATTLE_EXPECT_NATIVE_MODES=quick-vs-ai,quick-battle,battle-party,quick-draft,local-pvp,gauntlet
export BATTLE_TEST_STORY_BAG=1
unset BATTLE_CAMP_GAMES BATTLE_PLAYTEST_CASES BATTLE_PLAYTEST_PHASE BATTLE_SIDE_PHASE
mkdir -p "$output"

cp dist/release.json "$output/release.json"
git -c "safe.directory=$(pwd -P)" rev-parse --verify HEAD > "$output/source-commit.txt"
sha256sum dist/release.json dist/offline-assets.json dist/battle.html dist/sw.js \
  dist/competitive/classic-simulation.js dist/competitive/showdown-engine.js > "$output/package-sha256.txt"

PORT="$port" BATTLE_STATIC_COMPRESSION=1 node scripts/dev-server.cjs > "$output/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
curl --fail --silent --show-error --retry 10 --retry-connrefused "$BATTLE_TEST_URL" | cmp - dist/battle.html
if ! kill -0 "$server_pid" 2>/dev/null; then
  cat "$output/server.log" >&2
  exit 1
fi

failures=()
run_case() {
  local label="$1"
  shift
  if "$@" > "$output/$label.log" 2>&1; then
    printf 'PASS %s\n' "$label"
  else
    failures+=("$label")
    printf 'FAIL %s\n' "$label" >&2
    tail -n 35 "$output/$label.log" >&2
  fi
}

screenshots="${BATTLE_CANDIDATE_SCREENSHOTS:-all}"
story_args=(--seed="${STORY_SEED:-1}" --road-choice="${ROAD_CHOICE:-scout}" --chapters
  --screenshots="$screenshots" --out-dir="$output/campaign")
if [[ "${OFFLINE_PACK:-false}" == true ]]; then story_args+=(--offline-pack); fi
run_case campaign npm run playtest:player -- "${story_args[@]}"
if [[ "${BATTLE_CANDIDATE_MIXED:-false}" == true ]]; then
  run_case campaign-mixed npm run playtest:player -- --only=story --seed=77 \
    --road-choices=scout,help,pass,scout,help,pass,scout,help,pass --chapter-choice=act \
    --difficulty=hard --gens=1,2,4,7,9 --no-items \
    --chapters --viewport=820x1180 --screenshots="$screenshots" --out-dir="$output/campaign-mixed"
fi
run_case chapters-chromium env BATTLE_TEST_ENGINE=chromium BATTLE_PLAYTEST_OUT="$output/chapters-chromium" \
  node scripts/debug/player-chapters-playtest.mjs
run_case chapters-webkit env BATTLE_TEST_ENGINE=webkit BATTLE_PLAYTEST_OUT="$output/chapters-webkit" \
  node scripts/debug/player-chapters-playtest.mjs
run_case competitive env BATTLE_TEST_OFFLINE=1 BATTLE_COMPETITIVE_SHOTS="$output/competitive" \
  npm run test:competitive:browser
run_case competitive-motion node tests/visual/competitive-motion.mjs
run_case battle-motion-catalog node tests/visual/battle-motion-catalog.mjs
run_case native-room-mock env BATTLE_TEST_ROOM_PIVOT=1 node tests/visual/online-native-room.mjs
run_case native-room-reconnect env BATTLE_TEST_ROOM_RECONNECT=1 node tests/visual/online-native-room.mjs

for visual in deferred-startup classic-native-pivot story-retry-save story-exact-resume keyboard-navigation story-city-errands-and-bag \
  story-starter-parity story-cinematic-hierarchy story-boss-phases story-audio story-side-activities \
  story-first-gym-coach story-north-road-world story-signature-encounters story-gym-intermission story-dialogue battle-motion \
  story-raid-ordinary-win; do
  run_case "$visual" env BATTLE_PLAYTEST_OUT="$output/$visual" node "tests/visual/$visual.mjs"
done
run_case battle-motion-webkit env BATTLE_TEST_ENGINE=webkit node tests/visual/battle-motion.mjs
run_case battle-motion-firefox env BATTLE_TEST_ENGINE=firefox node tests/visual/battle-motion.mjs
run_case battle-responsive env BATTLE_MAIN_RES_SHOTS="$output/battle-responsive" node tests/visual/battle-responsive.mjs
run_case story-onboarding env BATTLE_ONBOARDING_OUT="$output/story-onboarding" node tests/visual/story-onboarding.mjs
run_case story-city-notifications env BATTLE_CITY_OUT="$output/story-city-notifications" node tests/visual/story-city-notifications.mjs
run_case story-collection-layout env BATTLE_COLLECTION_OUT="$output/story-collection-layout" node tests/visual/story-collection-layout.mjs
run_case story-milestone-actions env BATTLE_MILESTONE_SHOTS="$output/story-milestone-actions" node tests/visual/story-milestone-actions.mjs
run_case story-legendary-capture env BATTLE_TEST_SCREENSHOTS="$output/story-legendary-capture" node tests/visual/story-legendary-capture.mjs
run_case story-frontier-challenges env BATTLE_FRONTIER_OUT="$output/story-frontier-challenges" node tests/visual/story-frontier-challenges.mjs
run_case camp env BATTLE_PLAYTEST_OUT="$output/camp" node scripts/debug/player-camp-playtest.mjs
if [[ "${BATTLE_CANDIDATE_STATEFUL:-false}" == true ]]; then
  run_case stateful env BATTLE_PLAYTEST_OUT="$output/stateful" node scripts/debug/player-stateful-playtest.mjs
fi

for viewport in 320x568 568x260; do
  run_case "casino-$viewport" env BATTLE_CASINO_VIEWPORT="$viewport" BATTLE_PLAYTEST_OUT="$output/casino-$viewport" \
    node scripts/debug/player-casino-playtest.mjs
done

if (( ${#failures[@]} )); then
  printf 'Candidate failed: %s\n' "${failures[*]}" >&2
  exit 1
fi
sha256sum -c "$output/package-sha256.txt"
node scripts/build-release.mjs --verify | tee "$output/package-verification.log"
