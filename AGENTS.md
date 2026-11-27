# Battle repository guidance

For requests covering all screens, a location, or a gameplay system, begin with the [game reference](docs/game-reference/README.md). Treat examples in the request as examples of the scope. Resolve the scope before choosing files to edit.

- Run `npm run audit:game -- --check` and use `npm run audit:game -- --scope city` (or `story`, `field-tools`, `activities`, `battles`, `app`, `progression`, `mobile`, `design`, `all`, or a feature ID). Append `--json` to get all entries and control records.
- Open the matching guides. In each feature, follow real entry points, child views, first and subsequent visits, and changes to saves, rewards or rosters. For city work include side doors, tutors, Department Store, Bag, Journal, storage, and recurring or late-world services in that scope.
- Update the relevant guide and [scope map](docs/game-reference/scopes.json) when a view, registry ID, service, control or interaction changes ownership, reachability, or expected behavior. Link repeatable checks and update affected rows in the [coverage register](docs/PLAYTEST_COVERAGE_REGISTER.csv).
- Keep the player worklist and evidence with the build tested. A registry check, a checkpoint, a complete route, and play on a physical device establish different results. Follow the [playtesting plan](docs/FULL_SCALE_PLAYTEST_PLAN.md) for claims about complete coverage.
