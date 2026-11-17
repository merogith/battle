# Showcase and supported scope

[Play in the browser](https://merogith.github.io/battle/battle.html) · [Engine and test commands](../tests/README.md) · [Asset attribution](../ATTRIBUTION.md)

## A short first visit

Open **Your first battle** on the main menu, then **Jump In**. This creates a random team and an opponent controlled by the bot. Choose Fight and one move, follow the log, and select a healthy replacement if your active Pokémon faints. Finish that match before exploring the broader modes. **Battle Options → Casual** provides Gen 1–2 teams without gimmicks; the party-size selector can shorten the match.

If a story run already exists, the main hero offers Continue instead. **Quick Battle** remains available below and does not replace the story save. Clear only demo/test browser data when testing save behavior; real story progress lives on that device.

## Choose a mode

| Entry | Experience | Requirements and boundaries |
| --- | --- | --- |
| Jump In / Quick Battle | A standalone local battle against the bot | No account. Random teams provide the fastest start; drafting and rules are optional. |
| Story Mode | Progression, collection and story battles | Saved in this browser. No cloud save; the entire campaign is broader than the short first-visit route. |
| Gauntlet | A survival ladder | A longer session than the first-match route. |
| Local PvP | Two players on one device | Both players use the same screen. |
| Online Host / Join | A match shared through a room code | Requires connectivity and a configured multiplayer service. Local engine checks do not establish service availability. |

This is a noncommercial fan simulator with intentional deviations and remaining edge cases. It does not claim complete Pokémon Showdown equivalence. See the tests README for implemented checks and deferred cases rather than interpreting the existence of differential tooling as complete coverage.

## Reproduce the local engine checks

```sh
npm ci
npm start
# Open the local URL printed by the server.
node --test tests/suites/damage-formula.test.js
npm run test:integration
```

Use a complete checkout for media/PWA checks: sparse checkouts can omit the files those checks assert. Damage tests cover range, STAB, effectiveness and immunity; integration and broader mechanics suites provide separate coverage. A passing damage check is not a certification of every move, story branch or online mode.

Before a release, exercise a full short match through the real interface: move selection, PP and HP updates, faint/forced replacement, outcome, and return to the menu. Also inspect the browser console and verify a story save survives returning from a separate quick battle.

## Historical development material

The generated September 2026 [issue ledger](../agent-state/ISSUE_LEDGER.md) and June 2026 [engine investigation](BATTLE_ENGINE_INVESTIGATION.md) preserve past observations and recommendations. Their counts, TODO totals and source-line references can become stale. They are not a current list of reproduced defects, and this guide does not assert that every historical finding has been fixed. Reproduce a finding against the current commit before changing its status.
