# The Open Circle

Mara Venn is a field surveyor looking for her missing colleague Ivo. An open-circle stamp marks the route of a League-certified Recovery Service that records certain live passengers as cleared cargo. Each town has a person with a different stake in the trail. The investigation runs beside the badges and the existing villain and anomaly tracks. Its final witness statement belongs at the Crucible, where the player can revisit the story after the League.

## Design references

- Give the field investigation its own invitation, choices, and payoff alongside the badge route. Pokémon Scarlet and Violet uses distinct story threads with their own goals within one adventure. [The Pokémon Company](https://press.pokemon.com/en-NZ/NEW-CHARACTERS-POKEMON-AND-FEATURES-REVEALED-FOR-POKEMON-SCARLET-AND-P)
- Reward paying attention to local working details. Pokémon Legends Arceus uses research tasks to make knowledge of the world something players build. The field archive records evidence returned by scenes and the characters who supplied it. [Pokémon Legends Arceus gameplay](https://legends.arceus.pokemon.com/en-us/gameplay/)
- Put a physical clue in the scene before it matters. A broken bolt, a scratched seal, or an unexplained route code should invite a question the next chapter can answer. [Outer Wilds narrative design talk](https://www.gdcvault.com/play/1027008)
- Give returning players original reactions and new story material. A choice needs a response in the scene, and a later witness can react to what the player did. The archive uses consequences rather than repeated dialogue as the reason to replay. [Hades dialogue design at GDC](https://gdconf.com/article/dive-into-the-dialogue-of-hades-at-gdc-2021/)
- Check that the interaction produces the intended feeling. Inspecting the record offers a different kind of agency from protecting a witness. Keep choices grounded in those actions and let players advance text at their own pace. [Mechanics, Dynamics, Aesthetics](https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/) · [Xbox Accessibility Guideline 116](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/116)

## Chapter beats

| Stop | Scene purpose | What carries forward |
| --- | --- | --- |
| Gym 1 | Meet Mara at the field relay where a token sits inside a broken signal housing. | The player chooses to retain a rubbing or restore the signal. |
| Gym 2 | Follow the stamp into a working mine. | An ore-lift trace contradicts the official record. |
| Gym 3 | Meet a clerk who can connect the trail to a release ledger. | The player weighs the clerk's safety against taking a verifiable copy. |
| Gym 4 | Confirm where the live shipment went. | A signed witness log or a dispatch waybill points toward Lakeside. |
| Gym 5 | Search the Lakeside transfer site and talk with people who saw the load. | Evidence moves from paperwork to what happened at the shore. |
| Gym 6 | Trace the duplicate manifest across the transfer yard. | A local worker has a choice about how openly to help. |
| Gym 7 | Reach the highland relay and test the origin of a release signal. | A transmission connects the earlier records to the next witness. |
| Gym 8 | Read what was hidden at the edge of the cathedral route. | Matching records clarify who can testify and who still needs protection. |
| League | Give the player a chance to decide how evidence reaches the League. | Archive material and earlier choices change what can be proven. |
| Crucible | Give Ivo and the other witnesses an aftermath. | Replays preserve scenes, and earned archive entries add new epilogues. |

## Implementation and acceptance

1. Write ten original scenes in separate data files. Use the canonical city or Crucible location to attach each invitation so rolled trainers and existing battles keep their rules and progression.
2. Build one skippable, self-paced cinematic panel with portraits, readable captions, responsive artwork, and an accessible close action. Keep the invitation optional. Save a choice before showing its reaction, and keep replay read-only.
3. Retain the clue named by the chosen action. Hide each bonus scene until the player has the current clue and the listed earlier records. Trail hints should help a player decide what to investigate on another run. Earn career entries by doing something new, with opposing outcomes counted across distinct journeys.
4. Check the complete campaign path, a branch that misses evidence, choice and discovery persistence after reload, keyboard close, both phone orientations, and the final packaged asset manifest. Record which battles used controlled outcomes in the playtest.
