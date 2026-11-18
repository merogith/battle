# Art, audio, and cinematic production specification

[Build runbook](../NORTH_ROAD_BUILD_RUNBOOK.md) · [Campaign content](CAMPAIGN.md) · [Player experience](PLAYER_EXPERIENCE.md)

## 1. Production sequence

1. Assemble one representative crop, prop pair, and touch layout for the flood lamp scene. Assemble one raid entry and one active warning for Marowak. Use the existing storytelling and battle presentation components.
2. Compare the scenes at 320×568, 568×260 with larger text, 820×1180 and 1440×900. Check that a newcomer can describe the scene and its actionable clue in all views. Record original art drafts outside the shipping asset tree.
3. Approve the pilot art kit, then author each city’s landmark and one actual payoff prop. Validate the stable geography, original art rights and no missing-asset path before preparing the finale.
4. Build the finale from four reusable visual states. Compose and mix the motif in the pilot, then lock the final audio stems against the actual transitions.
5. Run the installed package and reduced-motion versions. Repair broken composition, clipping, hidden focus, surprising volume and any missing clue in mute. Compare added transfer and installed bytes with Work 01.

## 2. Visual language and asset list

Keep the world’s original stylized dark layouts and current pixel Pokémon display. Contrast a believable safe routine with one element that diverges. Conceive each stop from recognizable geometry before assigning a color palette. Navigation and interaction stay clean and legible regardless of the backdrop. For a photograph-like evidence inset, use its framing to tell the player it is a field record.

| Deliverable | Visual job | Reuse and production instruction |
| --- | --- | --- |
| **Pallet bench and partner** | Show the player an ordinary beginning to remember. | Reuse the existing harbor art and equipped starter sprite. Add an original small gallery sticker or hand-marked field label in the same corner of the composition. |
| **Flintreach lamp** | Make the road choice obvious on arrival and after the Gym. | Start with `route1-unlit-signal.webp` and one original lamp/noticeboard composition. Separate standing geometry from lit lamp, dispatch envelope and chalk mark. Draw one neutral state and two small overlays instead of three full renderings. |
| **Town landmark set** | Keep each region’s silhouette readable at a glance. | Use campaign place list to choose one specific hero landmark per hub. Prefer current art or a safe existing biome until the new crop is tested. Create no duplicate full backgrounds merely for an extra witness beat. |
| **Road and chapter props** | Make evidence and prior actions physical. | Produce a compact transparent prop sheet or small individual original art pieces: rubbing, receipt, waterproof field notebook, tag, weigh-slip, tackle box, blanket, relay sign, signed statement, dueling register entries. Stage one per active beat. |
| **Marowak and raid family kit** | Make the foe’s real identity, arena and phase legible. | Reuse existing encounter species sprites and map the background from the frozen legal roster and local story. Add a reusable threshold icon and one readable stance silhouette. A phase’s accent never supplies its only meaning. |
| **Witness portraits** | Help players remember who did what at which stop. | Retain approved portraits of Mara, Ivo, Nera, Ina and Orin. For an unnamed part the new writing makes persistent, create one original representative face plus a low-motion expression variation if it earns its space. |
| **League gallery** | Connect the real first partner, the world clue and the player’s avatar. | Reuse the existing League interior. Add an original cropped plate, readable sticker or mark, and neutral empty frame. Populate from the game’s chosen avatar and proven starter identity. |
| **Rare encounters** | Preserve the existing hierarchy from field sighting to earned capture. | Reuse the shipped moonlit legendary art and existing normal/rare result layout. Real patch art belongs to the correct origin and local manifest. New special art still works with muted sound and no motion. |

Use existing recognized file stems where reusing, and location-first names for new art. For example, proposed `flintreach-noticeboard.webp` and `flintreach-dispatch.webp` are descriptive enough to locate and review. Keep edits and sources separate. Record asset ID, author or original source, reference, usage permission, derivative or export details, ship path, compressed and installed bytes, and fallback in the existing attribution process. [Current asset attribution](../../ATTRIBUTION.md) · [Art direction](../story-design/VISUAL_ART_DIRECTION_REVIEW.md)

### Framing and file acceptance

- Start wide illustrations at about 1280 × 720 and measure the actual encoded WebP. Current story art ranges roughly 60–205 kB per image. First pilot target is ≤150 KiB per wide still and ≤40 KiB per small prop where visual quality allows. A second portrait crop is justified by a genuine missing subject at the smallest target, and should use a smaller local export.
- Keep key action in a center-safe region and leave a calm text zone. On narrow portraits use art above or behind the title at stable low contrast. In short landscape let text and action take priority over art. Small devices retain the button, focus indicator, and route label.
- Lazy-load optional artwork at the current scene or when the relevant cached availability is confirmed. Include verified release files in the asset manifest. Show a readable plain environment if a fetch fails or the player only has the lightweight scene treatment.
- Art marks the story’s physical state. Use text, alt or a short visible caption for evidence essential to choice. Decorative sprites and overlays should not repeat an already spoken name to assistive technology.
- Compare actual foreground bytes, warm/cold caching, decode time, contrast and cropped composition in both orientations before passing. Apply earlier app startup budgets as targets to validate, with the pilot adding no eager media load. [Delivery plan](../ARENA_OVERHAUL_PLAN.md#7-offline-play-installs-and-updates)

## 3. Storyboards and default copy

Timing values below are animation lengths for initial testing. Waiting for the player to advance has no time limit. Copy in quotes is a working original line and receives its final editing pass against chapter continuity.

| Scene | Staging | Essential copy and control |
| --- | --- | --- |
| **Unlit Signal, road** | Establish high road, flooded culvert and the unlit lamp. Show Iona watching the water and the dispatch in hand. | “The crew changes at dawn. This has to reach them dry.” Offer the existing Scout, Help and Pass decisions and show what each leads to. |
| **Flintreach, changed board** | Use the same landmark, date and geometry. Show chalk map, relit safe lamp and dispatch, or the neutral crew note by outcome. | Supply one short owned cue. Scout can open **Review Gym tip** where licensed by actual state. Help and Pass close back to the same hub objective. |
| **Marowak, entry** | Frozen real foe enters with the scene’s original memorial marker or botanical setting. Expose one ordinary behavior before the encounter starts. | “It digs in after a heavy hit.” Provide **Stand your ground** and make the phase explanation available in the current UI. No private build revealed. |
| **Marowak, threshold** | Quiet impact break and one short guard animation. Keep a stable guard pill with category and remaining native turns. | “Grave Guard · Physical resistance · 2 turns.” Substitute the resolved category. Tell the player what is known and which ordinary choices still apply. |
| **Rare successful catch** | Keep existing chosen Ball, species and destination. Celebratory accent follows the committed throw result. | Show Party or PC result, **View in Pokédex** and **Continue**. Settings can skip movement while preserving all three information pieces. |
| **Finale, face** | Held scene of the League room. On victory, show the actual silhouette resolving into the player’s avatar. | Preserve the signature reveal and a concise sentence establishing why the older trainer recognizes the player. Continue reads as a normal scene action. |
| **Finale, evidence** | Close-up on the earlier handwriting or sticker, with one small plausible variation from actual saved records. First runs use a neutral comparison. | Ground the clue with one short sentence or visual label. Keep the archived observation honest. The player can continue without owning a secret. |
| **Finale, portrait** | Hold quiet on the first partner and the plate. Use the actual live marked slot, saved memory, or empty frame. | Preserve **“the number is a mercy”** and the two established Remember/Forget buttons. Persist the choice before the reply. |
| **Finale, reply and return** | One restrained visual or original variation of the theme, then reveal the current Crucible gate. | The player gets the committed response, explicit next action and archive availability. Reload during the reply should show the same choice and outcome. |

Use `_renderNarrativeOverlay`, `_showRaidEncounterIntro`, `_showWildEncounterCinematic`, `_fireMysteryRevealThenEnding` and their existing responsive styles. Leave the accepted-loss story path masked. Earn the full cinematic when the later legitimate rematch satisfies existing rules. Ordinary player control, the battle command state, and saved state must exist independently of animation frames.

## 4. Audio and motion specification

Compose an original short four-note shape that can plausibly live in the region. Start with a restrained plucked or bell sound and a low wind bed. Echo the same relative phrase through the road relay, take music down for one beat when meeting The First, and resolve it in the gallery. Choose the actual motif by reducing ambiguous overlap with UI cues during mix review. The player’s own partner still uses the established species cry flow.

| Cue | Trigger | Duration and mix starting point | Accessibility and interruption |
| --- | --- | --- | --- |
| Partner greeting | Committed starter or the quiet final image | Within three seconds, original cue heard over lower playback bed | Muted music suppresses the motif. The visible partner and frame information remain. No duplicate start after a restored reply. |
| Flood lamp / field relay | Front of a relevant scene and after a genuine relight | One dry mechanical relight and a separate quiet radio texture. Both under two seconds. | Optional caption such as “The lamp comes back on.” Signal visuals and labels give the same essential evidence. |
| Raid tell and expiry | Native phase announcement, activation or actual end | One short distinct onset. Keep expiry softer. Rate-limit repeated identical cues from animation or log redraw. | A named icon and text persist for the real duration. Use no screen shake under reduced motion. Never delay a native turn waiting for audio. |
| Rare sighting and reward | Genuine sighting or committed capture | Use separate setup and resolution. Keep cry clear of the musical attack. | One captioned text channel. Settings Stop/Mute clears the playing and queued cues. |
| Gallery transition | Arrival at the final story choice | Short musical statement, quiet at the first choice. Test phone speaker balance against battle cues. | Respect browser audio gesture and muted/paused tracks. Resume history can render with no sound and still be complete. |

Route new cues through the existing AudioSystem and StoryFx ownership. One background music owner plays at a time. Existing generated and file modes keep their working volume and mute. Effects honor their own switch. Keep sound separate from persistence, gameplay RNG and deadlines. Test changing preferences during a cue, audio disabled from first launch, a suspended phone resumed mid-scene, warping speed/skip through a scene, and device audio focus loss.

Use fades, small transforms and layered stills. Honor reduced motion and the game’s own animation setting together. Instant mode promptly displays clear final presentation. Skip waits for a committed result if a real decision is in flight, then reaches its lawful interaction or restores visible controls. Give focus to the newly opened dialog, return it when closed, and announce the result once instead of the last several animation frames. [Current cinematic design and components](../story-design/story-immersion/visual-and-cinematic.md)

## 5. Final asset and scene acceptance

- Four key cinematics and one optional evidence scene fit at minimum viewport and larger text. All visible essential controls accept touch and keyboard, Escape returns focus, and speaker labels stay understandable.
- Each new landmark, prop, portrait and cue has a source, compressed export, fallback and budget entry. Disconnected browser and missing-asset fixtures preserve the whole action and the meaning of the clue.
- Mystery victory and accepted loss differ at the correct branch. Both true finale choices show the saved partner or neutral fallback, produce exactly one result, and survive reload at each committed step.
- At least one listener on phone speakers and one on headphones can explain which sound was a cue and which supported atmosphere. They also complete the scene with sound disabled.
- The new asset paths appear in the verified package manifest. Package hash and bytes are captured after the final media exports. [Verification](RELEASE.md)
