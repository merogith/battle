# Save, randomness, and replay implementation specification

[Build runbook](../NORTH_ROAD_BUILD_RUNBOOK.md) · [Campaign content](CAMPAIGN.md) · [Combat rules](COMBAT.md) · [Release verification](RELEASE.md)

## 1. State ownership

Current Story save schema is version 28. The active slot is `pbs_story_save`, career state lives in `pbs_story_meta`, and the Field Archive already has its own normalized version and run records inside career state. Backups already bundle active run, career, settings and accessibility preferences. Keep these storage and backup entry names. Add optional fields with explicit defaults. A schema version bump becomes necessary only if older readers could load new fields into an invalid or unsafe gameplay state. In that case, implement and test an ordered migration before authoring records in the new shape. [Story load and save](../../battle.html:47717) · [Archive normalization](../../data/story/adventure-progress.js) · [Backup handling](../../game-upgrades.js:245)

| State | Source of truth | New release behavior |
| --- | --- | --- |
| Road choice | `sm.storyChoices["road.discovery.N"]` | Reuse the exact key and existing three values. Derive visible outcome from the key and city index. No additional progress flag for seeing the board. |
| Chapter choice and discovery | Existing `adventure.chapter-…` and `adventure.secret.…` keys in `sm.storyChoices` | Read choices only from the current run for world consequences. Archive replay reads the selected recorded run. Choices and disclosures stay separate. |
| Story seed and current deterministic state | `sm.runSeed`, `sm._strngState` and existing per-battle seed and retry cursor | Add no sampling to text, UI or cosmetic branches. Capture state before any new committed selection. Keep ordinary battle, camping, casino and encounter seed policies intact. |
| Encounter lock | Relevant `sm.currentEnemyLock` and existing per-scenario lock state | Optional authored profile snapshot or stable ID/revision and deterministic inputs. Attach only to the matching lock. Persist before the first cinematic so pre-fight reload cannot change the boss. |
| Original partner | Stored starter flag and immutable party slot ID where available | Capture an optional validated visual memory when the actual starter is accepted. Track that slot’s evolutions and nickname for the moment when it appears live. Keep the first accepted record for cases in which the Pokémon later leaves. |
| Ending selection | Existing `sm.storyChoices["main.loop.remember"]` and the career record | Save the choice and its optional `loopChoiceCommittedAt` together. Reconcile career flags and the existing achievement when the run resumes. The career `lastLoopChoiceAt` records which choice supplies the next opening so an older saved choice can add its flag without replacing a newer answer. |
| Defeat advice | Existing committed defeat for the active `eventIndex` | When the next action needs to survive refresh, keep one bounded public observation with the defeat. Resolve available advice again using the current party, target history, stage and resources. |
| Career keepsakes | Derived from committed archive records when available | Add stable read-only render IDs. If a genuinely new earned fact needs persistence, validate and merge it individually. Derive ordinary scene availability from already recorded facts. |
| Seeded Frontier attempt | A separate optional object under `sm.frontier` | Preserve the existing regular streak and leaderboard. Record the challenge revision, initial roster snapshot and one active step. Store accomplishment cosmetically in career. |

Keeping render data out of the save avoids tying older journeys to revised copy, changing filenames and art ranges. Store stable keys and proved identity when they affect progression. Derive current names and variants on demand. Renderers in the town, party, Pokédex and archive have no access to mutation helpers. UI focus and animation state stay transient.

## 2. Proposed new record shapes

These are data contracts to implement under the existing structures. Confirm exact member IDs and formats against the current slot and lock constructors, including test fixtures. Limit strings and array lengths. Keep canonical species IDs or existing canonical names accepted by the Dex. Ignore unknown cosmetic skin IDs, sanitize text, and resolve art from the bundled catalog.

| Record | Fields | Validation and missing data |
| --- | --- | --- |
| `sm.starterMemory` | `{ slotId, speciesAtGift, nicknameAtGift, shinyAtGift }` | Accept only the actual starter slot ID and known species. When the live marked slot can be found in team or PC, show its current name, species and artwork. Otherwise show the memory with a contextual caption. On older runs, backfill from one unambiguous marked slot, or show a neutral portrait frame. |
| Encounter lock’s `bossProfile` | Scoped to the existing row/encounter key with profile ID, revision and frozen options as specified in the combat appendix | Must agree with the saved scenario and roster. Never silently apply an authored rule to an old lock. Preserve the prior builder for legacy retries. |
| `sm.defeatObservation` | `{ eventIndex, encounterId, turn, kind, actor, move, cause }` using bounded public event data | Write alongside the existing defeat and pre-battle inventory restore reference. Bind to the active matching defeat or validated handoff. Clear on retry, win, or handoff completion. For missing or stale records, offer neutral preparation. |
| `sm.frontier.challenge` | `{ id, revision, seed, runGens, mechanics, roster, round, status, lastCommittedResult }` | Status is `ready`, `in-progress`, `cleared`, or `ended`. Round is 1–3. Use a validated immutable build snapshot. The existing standard Frontier fields remain independent. Define `lastCommittedResult` with round and outcome ID for deduplication. |
| Career `frontierChallengeRecords` | Map by challenge ID plus revision to best completed round and earned finish date | Union by stable entry key. Keep the higher round. For ties, preserve the existing verified record and earliest earned cosmetic when present. A room result, imported normal streak or replay opening does not write this field. |

When an old or restored run loads, normalize new fields from the parsed source, including missing values, before reading from the live object. The current load code applies fields to the existing state object. Explicit defaults are therefore essential to avoid carrying a new field from the run that was previously loaded in the tab. Start a new run with clean per-run defaults. Keep already earned archive and career records. Extend read and export paths before introducing a writer.

### When an action becomes durable

1. Resolve the active run and inspect the existing interaction lock. A second click, external writer or pending restore can make it invalid. On a blocked action, keep the player on the same surface with a clear next step.
2. Snapshot only the values the action can change. Include RNG and counters for consuming operations, existing staged receipt, relevant item/money, choice and awarded flags.
3. Apply one logical mutation, then call the current run save. Check the return before showing success. Structure the saved receipt to support the next view after root navigation or refresh.
4. If saving fails, restore the snapshot and display an actionable retry or official backup route. Keep the result or transaction unavailable until it can be saved. Respect conflict and restore locks so one tab cannot overwrite a newer slot.
5. Record a career update after the active run succeeds. Reconcile only a proved event when career save is interrupted. Use transaction identity or derived, monotonic merge so refreshing a settled receipt cannot pay it again.
6. Present animation, narration, sound, achievement or a result card from committed state. These steps perform no random rolls or further grants. They may be skipped by the player and can be reconstructed when a committed receipt remains.

Follow the current supported battle resume contract. Ordinary Story bouts reload from their documented encounter/retry boundary with a locked roster and seed. A partially displayed animation is not a native battle checkpoint. The new boss must reproduce the same decisions after retry. A campaign clear, entered choice, spent wager, paid Safari ticket, or accepted catch must retain the corresponding committed result.

## 3. Deterministic boundaries

| Operation | Sampling boundary | Verify |
| --- | --- | --- |
| Choose an eligible anomaly track | Once at the existing track assignment, after filtering a stable ordered catalog | Same seed and settings produce the same track and continuation. UI and translations consume no draws. A legacy assigned invalid arc remains recoverable by the migration policy. |
| Open an authored raid | Freeze exact roster, build, opening conditions, profile revision, input seed and existing story scenario identity | First viewing, reload before Battle, loss and Retry show equal species, legal set, tip, art and first turn for identical inputs. |
| Enter a Scout habitat | Reuse the normal route opportunity and roll only when the current player accepts a search | Entering the hub or opening the Pokédex does not roll an encounter. Route outcomes alone do not grant unobserved captures, sightings or achievements. |
| Start a seeded Frontier challenge | Freeze eligible roster and rules with the catalog seed and revision. Use its own seed stream | In the same challenge revision with the same allowed generations, mechanics and build snapshot, opponents and starts repeat. Ordinary travel RNG and standard Frontier standings stay unchanged. |
| Present a clue, caption, or portrait | No gameplay sampling | CPU speed, accessibility mode, dialogue skipping and locale cannot change outcomes. |

Add fixtures for page reload before choice, after commit but before reply, after preview, after the award and after exiting. Check repeat opens, another tab claiming the save, insufficient quota, deleted web cache with valid save, restored archive with matching and conflicting run IDs, and art unavailable offline. Comparisons omit save timestamp and presentation-only fields. Compare recorded identity, choice, inventory, money, RNG, profile revision, remaining encounters and reward rights, as applicable.

## 4. Replay content and how to earn it

The Field Archive already supports replaying recorded choices and discoveries by originating run. Continue to use that behavior. Map secondary town consequences to the choice and chapter in the original record. Read-only archive time cannot grant a current journey an award, unlock a road, affect a habitat or change a conversation. Ensure the repaired lamp in the existing afterword reads correctly even if the current run chose Pass.

| Entry | Earn trigger | Where it shows |
| --- | --- | --- |
| **Survey Rubbing** | One saved `listen` in Open Circle Chapter 1 | In the existing Notebook/Field Archive as an inspectable image and caption. |
| **Pass Lantern** | One saved `act` in Chapter 7 | On the existing story record card or Camp keepsake slot. |
| **Keeper’s Spare Copy** | Existing cross-run afterword rule from the Field Archive | Preserve the shipped link and its current conditions. Allow the earned afterword to supply one optional physical note in the Crucible. |
| **Two accounts in the gallery** | Existing career proof of both Remember and Forget | Use the existing achievement and true saved outcomes. The new presentation can place two matched plates in the gallery. Avoid another award for the same condition. |
| **Frontier stamps** | One completion of an eligible challenge revision | A cosmetic completion card with the challenge name, revision and round result in the existing Frontier results. |

Use the existing `readStoryMeta` → normalize → write and restore merge flow. In the archive, preserve the first committed choice per chapter and run ID. Refuse to merge different seeds as one run. A newly synthesized cosmetic uses evidence already valid in the archive. A replay record remains available if an optional image is missing, with caption and fallback panel.

## 5. First offline Frontier challenge set

Place a simple **Seed challenges** section inside the existing Battle Frontier. Offer three static catalog cards under the normal entry. Use the player’s actual eligible party snapshot at entry. Existing standard rounds, economy, record interface and unlock remain available.

| Stable ID | Display | Seed | Three opponent goals | Finish reward |
| --- | --- | --- | --- | --- |
| `frontier-quarry` | Quarry Trials | `0x4e520101` | Bulky opening, speed and switch test, balanced closer | Quarry crest |
| `frontier-lakeside` | Lakeside Circuit | `0x4e520102` | Mixed offensive opening, status and recovery test, weather-capable closer when the run supports it | Glasswater ferry stamp |
| `frontier-plateau` | Plateau Three | `0x4e520103` | Balanced opener, counterplay against a setup build, strong but legal stage-appropriate ace | Plateau matchbook |

Run version 1 with three consecutive native singles bouts. Use the current late-stage legality and availability helpers and a deterministic weighted roster selection per round. Re-use the available Frontier roster and format settings for the run. Show the seeded theme and the player’s enabled generations before confirmation. Provide a legal ordinary team when a theme has no eligible specialist. An empty fighter pool blocks that specific challenge with an actionable explanation. No special raid phases, experience, story rewards or ladder uploads here.

**Inputs and recovery**

- Use only actual usable party members. Present the frozen lineup before confirming. Keep the snapshot for those three rounds even if the player changes their current party outside the mode. Existing training, economy, story party state and standard Frontier remain separate.
- Offer **Resume**, **Review rules** and **End challenge** after visiting the Frontier. Ending requires the existing game’s confirmation pattern and preserves already earned finishes. Restore the prepared current round after an interrupted battle under the same locked rules. A loss records its round once and returns to the Frontier.
- Between rounds present one clear action. A double confirmation or reload cannot create a second battle or apply completion twice. A finished challenge writes the cosmetic record after saving the final result and reconciles a delayed career write on reopen.
- Display the shareable challenge ID and revision alongside settings in the existing summary. Offline users can enter and finish the available catalog without a daily reset or live timer. Compare different roster/setting combinations only with their rule labels visible. Version new generation or selection behavior and retain the old description for archived records.

**Launch checks** include all cards, repeated same seed, same party across restart, single-generation fallback, mechanics off, loss with no award, restart, double-tap final result, import overlapping achievements, offline reopen, ordinary Frontier eligibility, and repeated runs without any gold, item or combat-stat benefit from the new records.
