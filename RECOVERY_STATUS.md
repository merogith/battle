# Incomplete upload — do not merge

Automated workspace maintenance removed the local checkout after an interrupted upload. This branch preserves the 65 changed files that reached GitHub. It is not the complete, tested upgrade.

Missing from the approved local commit:
- battle.html (the battle-engine, story integration and mechanics changes)
- offline-assets.json (the matching release manifest)
- docs/review-evidence-2026-09-12/implementation.patch
- docs/review-evidence-2026-09-12/final-tests.log
- docs/review-evidence-2026-09-12/implementation-campaign-check.json

The baseline versions of battle.html and offline-assets.json are still present. The added modules and revised workflows therefore must not be treated as an integrated release. Prior test reports describe the complete local snapshot, not this recovery branch.

Recovery identifiers:
- Original base commit: 62202bde7f43df0af00e4d037c5954736310c6c6
- Lost local commit: 4b5a3ca4a69a39518decd4b16a905e19ce31fa50
- Complete expected tree: 62e28880c55533a6522e4edc8c4794aa7b1a7776
- Missing battle.html blob: fefbff68359208aa5b3605f9ea8becf002dcd6e5
- Missing source patch blob: 2228d0fbf37ce623cc86414b9a4de4c9c993897b

Restoring the original implementation.patch would recover the source changes; the release manifest could then be regenerated and validation rerun. Until then, keep this branch unmerged.
