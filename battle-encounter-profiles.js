(function () {
    'use strict';

    // Text and colors for public Story presentation. The router still owns which
    // encounter, trainer, roster and branches have actually been disclosed.
    const gyms = [
        null,
        {
            location: 'Flintreach Town', stage: 'circles', glow: '#795439', shadow: '#201814',
            rounds: [
                ['Relay training floor', '#ffc27b', 'The chalk stops where runoff has got under the mat.', 'The trainer leaves a dry towel on the bar for your partner.'],
                ['Inner chalk ring', '#ffd59d', 'A broken bell still has a rope. Someone has coiled it off the floor.', 'The trainer lifts the bar with both hands. Beyond it, somebody starts to sweep.'],
            ],
        },
        {
            location: 'Kettlestone Town', stage: 'shaft', glow: '#58625d', shadow: '#1b2523',
            rounds: [
                ['Lift landing', '#c2e0bd', 'The lift ticks past a floor whose number has been filed off.', 'The lift keeper props the gate open with a boot. You can hear people on the next landing.'],
                ['Lower shaft marker', '#ebc886', 'Under the work light, the ring shares its paint with an old depth line.', 'The keeper waits until your partner is aboard, then puts a hand on the lever.'],
            ],
        },
        {
            location: 'Lindenbell Town', stage: 'panes', glow: '#346f59', shadow: '#152920',
            rounds: [
                ['Academy practice panes', '#a4eac6', 'Somebody has counted practice turns in a fogged windowpane.', 'The trainer slides the damp practice sheet out of its holder. Ink has run into the next name.'],
                ['Survey court', '#d2ecaa', 'A map papered over another one. At the corners you can still see the old road.', 'A student lifts the match slate. The map stays hanging behind it.'],
            ],
        },
        {
            location: 'Reedmarket City', stage: 'dispatch', glow: '#465f72', shadow: '#16212c',
            rounds: [
                ['Duty desk annex', '#a9dce7', 'The radio calls for a patrol number the trainer has crossed off the board.', 'Somebody turns the volume down and brings a chair out for your team.'],
                ['Dispatch court', '#e2cb8b', 'The duty lamp shows through the doorway. Under it, the visitor book lies open.', 'A reply comes over the radio after the person who called has left.'],
            ],
        },
        {
            location: 'Glasswater City', stage: 'ripples', glow: '#356984', shadow: '#112735',
            rounds: [
                ['Lakefront gallery', '#8ce3f0', 'The payout bell rings. Out on the lake, a light goes off in answer.', 'The trainer slides the rail bolt back. From the stairs you can hear water below the floor.'],
                ['Backstage boards', '#cda9ef', 'Lake light moves through the gaps in the boards. One plank is still wet.', 'The attendant unhooks the rope. The knot has left a dark mark on the post.'],
                ['Upper lake court', '#c8f5d9', 'The ring looks white where it takes the light from the water.', 'The back doors open. The lake sounds much closer without the glass.'],
            ],
        },
        {
            location: 'Brasslock City', stage: 'shutters', glow: '#7f553e', shadow: '#271814',
            rounds: [
                ['Freight lights', '#f3b076', 'The first lamp catches a hand-painted wagon number that leads into the ring.', 'The outer lamps go one at a time. A worker leaves the next doorway lit.'],
                ['Shutter corridor', '#e1beac', 'The shutter cuts the crowd off halfway through a cheer.', 'The trainer knocks twice on the inside shutter. It lifts on the second knock.'],
                ['Inside freight court', '#ffd083', 'Somebody extended the freight markings to make the ring. The old arrows still point out.', 'The outside shutter lifts before the work light goes out. The cold gets in first.'],
            ],
        },
        {
            location: 'Beaconrest Town', stage: 'relay', glow: '#365b79', shadow: '#132332',
            rounds: [
                ['Wind ward', '#a3dbee', 'The windbreak has one pane left. A trainer waits in the strip it shelters.', 'The first relay light goes steady. Your partner picks the sheltered side of the steps.'],
                ['Relay steps', '#a4f1d2', 'Two short relay notes reach you through the lookout glass. Nobody puts on a headset.', 'The lookout waits for a break in the wind and opens the upper door.'],
                ['Signal court', '#f5df9e', 'The mast moves a little in its socket. You feel it in the floor.', 'The lookout turns a lamp down the road for you. Keep it in sight until the corner.'],
            ],
        },
        {
            location: 'Vespergate Town', stage: 'arches', glow: '#64527d', shadow: '#1c162c',
            rounds: [
                ['Bell entrance', '#dbb9ea', 'A bell rings once. The first trainer checks the rope before walking toward you.', 'The bell has stopped. The glass behind it is still moving.'],
                ['Inner glass', '#b7c8ff', 'When the second trainer shuts the door, their reflection stays on the other side a little longer.', 'The trainer leaves a hand against the glass until you reach the steps.'],
                ['Glass court', '#f2d5ac', 'The rope is still. Dust falls through the light as if somebody just rang the bell.', 'The outer door opens. The first thing you hear is traffic on the League road.'],
            ],
        },
    ];

    // Stable first column of STORY_EVENTS_RAW. A battle can keep this ID as the
    // collection grows, independent of its queue index or procedural trainer.
    const gymRows = new Map([
        [4, [1, 1]], [5, [1, 2]], [10, [2, 1]], [11, [2, 2]],
        [17, [3, 1]], [18, [3, 2]], [23, [4, 1]], [24, [4, 2]],
        [29, [5, 1]], [30, [5, 2]], [31, [5, 3]],
        [36, [6, 1]], [37, [6, 2]], [38, [6, 3]],
        [44, [7, 1]], [45, [7, 2]], [46, [7, 3]],
        [51, [8, 1]], [52, [8, 2]], [53, [8, 3]],
    ]);

    const roads = [
        [1, 'Breakwater Road', 'Sea wall', 'Sea grass bends along a strip of road just above the water.', 'harbor'],
        [2, 'Mineshaft Pass', 'Lift road', 'Ore grit collects where the path meets the old rail.', 'shaft'],
        [3, 'Canopy Mile', 'Grove crossing', 'The canopy opens just wide enough for two trainers to take their marks.', 'panes'],
        [4, 'Warden’s Track', 'Patrol lane', 'The duty board is out of sight here. A posted track marker catches the light.', 'dispatch'],
        [5, 'Lakeside Road', 'Boardwalk turn', 'A reed knocks against a post under the boardwalk.', 'ripples'],
        [6, 'Switchback Road', 'Public freight crossing', 'The crossing light swings above the public road.', 'shutters'],
        [7, 'Highcountry Pass', 'Wind shelf', 'The wind drops for a moment in the shelter of the rock.', 'relay'],
        [8, 'Cathedral Approach', 'Outer lantern path', 'The stone gets colder where the lantern path turns toward the chapel.', 'arches'],
    ];
    const roadRows = new Map([[1, 1], [7, 2], [8, 2], [14, 3], [15, 3], [20, 4], [21, 4], [26, 5], [27, 5],
        [33, 6], [34, 6], [41, 7], [42, 7], [48, 8], [49, 8]]);

    const features = new Map([
        [68, ['pallet-rival', 'Pallet Town', 'Lab forecourt', 'The boats are already out. Two fresh sets of footprints lead to the forecourt.', 'harbor', '#ffe4aa', '#665b72', '#182832']],
        [12, ['lindenbell-rival', 'Lindenbell Town', 'Academy steps', 'Late light stretches across the steps. Your rival has left room beside them.', 'panes', '#a4eac6', '#346f59', '#152920']],
        [39, ['brasslock-rival', 'Brasslock City', 'Freight square', 'The crossing bells stop. Your rival is still waiting on this side of the rails.', 'shutters', '#f5c6a0', '#7f553e', '#271814']],
        [56, ['victory-road-1', 'Victory Road', 'Lower ascent', 'Stone steps climb out of the mist. A trainer takes the wider side of the path.', 'ascent', '#a9dce7', '#435b76', '#171f33']],
        [57, ['victory-road-2', 'Victory Road', 'Waystation turn', 'One wall of the waystation cuts the wind. The path narrows above it.', 'ascent', '#c7b9e8', '#504369', '#1e172c']],
        [58, ['victory-road-3', 'Victory Road', 'Plateau stairs', 'The League lights are close enough to catch along the edge of the rail.', 'ascent', '#f8d09a', '#724f45', '#20182a']],
        [60, ['league-1', 'Pokémon League', 'First League chamber', 'The doors close on the noise of the intake hall.', 'dispatch', '#b0dae6', '#3e596e', '#18232e']],
        [61, ['league-2', 'Pokémon League', 'Second League chamber', 'A low beam draws a clear line across the floor of the next chamber.', 'panes', '#c6e6ac', '#456749', '#182a21']],
        [62, ['league-3', 'Pokémon League', 'Third League chamber', 'High windows leave thin slices of light across the ring.', 'arches', '#dcc0ef', '#62507a', '#21172c']],
        [63, ['league-4', 'Pokémon League', 'Fourth League chamber', 'The last chamber is quiet enough to hear the hall beyond it.', 'shutters', '#fad19a', '#755647', '#2b1d1c']],
        [64, ['champion', 'Pokémon League', 'Champion’s stage', 'The hall lights fade toward the edge, leaving the whole ring in view.', 'arena', '#ffdc92', '#776148', '#261e2a']],
        [65, ['league-rival', 'Pokémon League', 'Quiet side court', 'The stands have gone quiet. Your rival comes in through the side door.', 'arena', '#f3b697', '#744d58', '#261d2e']],
        [67, ['league-mystery', 'Pokémon League', 'Unmarked court', 'At the edge of the court, the light stops short of the waiting figure.', 'threshold', '#c8b7e9', '#534578', '#1b172a']],
    ]);
    const vespergateMystery = ['vespergate-mystery', 'Vespergate Town', 'Unmarked side entrance', 'The entrance lantern reaches the first step. Someone waits just beyond it.', 'threshold', '#d9c2ec', '#654f79', '#22172f'];
    const crucible = ['crucible', 'Crucible', 'Service entrance', 'Through the service door, the arena crowd is only a distant sound.', 'service', '#ffc891', '#75523b', '#251b19'];

    // Encounter directions are mood and observable staging. The actual foe,
    // signal, move and remaining time belong to the live engine and its log.
    const factionEncounters = new Map([
        ['rocket', {
            stage: 'shutters', palette: ['#ffc1a9', '#7a4544', '#26191c'],
            rounds: [
                ['Delivery stop', 'Side of the road', 'The truck idles over a patch of dry road. A trainer steps around its open door.', 'The door swings back. The road is clear again.'],
                ['Permit lane', 'Inspection line', 'A clean permit sleeve hangs at eye level beside a chain scuffed down to bare metal.', 'The chain sags far enough for you to pass.'],
                ['Back entrance', 'Service shutter', 'The shutter rises just high enough to let the corridor light out.', 'You hear the shutter’s motor die as you leave.', 'A single order cuts through the rattle of the shutter.'],
                ['Dispatch floor', 'Loading marks', 'Numbers are painted above each bay. At the far end, a trainer waits on the line.', 'The truck engines cut out one at a time.', 'The loading bay falls quiet between orders.'],
            ],
        }],
        ['magma', {
            stage: 'shaft', palette: ['#ffd09d', '#8b573e', '#291b19'],
            rounds: [
                ['Dry stream', 'Lower bank', 'Dust stirs around a line of stakes hammered into the streambed.', 'Dust settles in the prints leading away from the bank.'],
                ['Survey cut', 'Marked stone', 'A survey flag hangs over a groove where water used to run.', 'The flag slackens. The old groove is still visible.'],
                ['Survey shelter', 'Shade cloth', 'The shade cloth snaps against a pole. A trainer waits under the open side.', 'There’s room at the shelter to check your partner.', 'Dust hangs for a moment above the battle line.'],
                ['High survey platform', 'Upper workings', 'From the platform you can trace the old water line along the rock.', 'The quiet carries as far as the empty channel.', 'Heat wavers along the edge of the platform.'],
            ],
        }],
        ['aqua', {
            stage: 'ripples', palette: ['#9de9f2', '#376781', '#122633'],
            rounds: [
                ['Quay lane', 'Salt crossing', 'Salt dries white on the rails at the edge of the crossing.', 'Water slaps against the foot of the empty crossing.'],
                ['Water gauge', 'Quay corner', 'Someone has touched up the numbers above the stained waterline.', 'The numbers are still there when the quay falls quiet.'],
                ['Harbor wall', 'Lower landing', 'Rope creaks on the landing. A trainer moves between you and the far steps.', 'The rope loosens with the next rise of the water.', 'A hollow knock comes from beneath the landing.'],
                ['High-water court', 'Upper quay', 'The upper quay is ringed with paint where the levee meets the road.', 'A wave reaches the white paint and recedes.', 'Water gathers along the rim of the court.'],
            ],
        }],
        ['galactic', {
            stage: 'panes', palette: ['#cae4ff', '#506880', '#182333'],
            rounds: [
                ['Clock crossing', 'First mark', 'The road markers are set in equal intervals. One has been turned to face you.', 'You leave the marker facing the road.'],
                ['Numbered passage', 'Side entrance', 'Each door has a time written on it in the same square hand.', 'Through the open doorway, you can hear a clock ticking.'],
                ['Control threshold', 'Timing panel', 'The timing panel has a row of little lights. One flashes as you cross the seam.', 'The lights settle back into their old rhythm.', 'The panel skips a beat.'],
                ['Observation floor', 'Center mark', 'An empty clock case looks down onto the center of the floor.', 'The echo of a footstep is the first sound after the match.', 'The waiting room seems to hold its breath.'],
            ],
        }],
        ['plasma', {
            stage: 'arches', palette: ['#cbd9ff', '#53607c', '#1c2234'],
            rounds: [
                ['Roadside meeting', 'Bench by the lane', 'An unused bench faces the short stretch where the trainer is waiting.', 'You pause beside the bench with your partner.'],
                ['Stone corridor', 'Second landing', 'The corridor is narrow enough to hear each step from the landing.', 'Your partner’s footsteps are the next ones you hear.'],
                ['Witness court', 'Visitors’ entrance', 'The visitors’ door opens onto a court that feels too still for the hour.', 'The door stays ajar as the court empties.', 'The sound moves from one wall to the other.'],
                ['Assembly court', 'Chamber floor', 'A single light catches a chair at the far end of the chamber.', 'You wait long enough for your partner to cross the room beside you.', 'The light holds at the far end of the hall.'],
            ],
        }],
        ['flare', {
            stage: 'panes', palette: ['#ffc2b5', '#804c55', '#2a1a20'],
            rounds: [
                ['Display lane', 'Polished windows', 'The windows have been polished around the corners of their old approval stickers.', 'The old sticker corners catch the last light as you leave.'],
                ['Check lane', 'Glass turn', 'A lamp on the corner is bright enough to show every smudge on the glass.', 'The light stays on over an empty lane.'],
                ['Inspection floor', 'White frame', 'The court sits square inside a frame of white light.', 'Your reflection reaches the doorway before you do.', 'Light runs along the edges of the glass.'],
                ['Presentation court', 'Lighted floor', 'The outer walls disappear behind the light. Every seat faces the court.', 'Footsteps return to the corridor when the fight ends.', 'The center of the court grows stark in the light.'],
            ],
        }],
        ['skull', {
            stage: 'shutters', palette: ['#e9b9d6', '#6c4764', '#251b2d'],
            rounds: [
                ['Wall by the road', 'Chalk turn', 'A pattern has been drawn low enough on the wall for someone sitting on the curb.', 'The chalk runs down into the gutter.'],
                ['Side yard', 'Yard entrance', 'A mug near the doorway catches drops from the roof.', 'When the yard is quiet you can hear the next drop land.'],
                ['Back court', 'House steps', 'Someone has put a fresh towel on the rail beside the steps.', 'The towel is still folded when you leave.', 'The rail rattles as someone leans against it.'],
                ['Old house', 'Yard ring', 'The lights over the ring come from rooms that look lived in.', 'The house sounds like a house again.', 'One light flickers over the yard.'],
            ],
        }],
        ['yell', {
            stage: 'arena', palette: ['#ffc2e3', '#78475f', '#281a2c'],
            rounds: [
                ['Poster lane', 'Outside the venue', 'A torn corner of a show poster snaps in the wind as a trainer takes the lane.', 'You hear the poster settle against the wall.'],
                ['Queue rails', 'Side of the line', 'The rails for the queue have been pushed back just far enough to make room.', 'The empty line leaves you room to turn around.'],
                ['Service stage', 'Side curtains', 'The stage is all curtains from this side. A strip of light leaks under them.', 'The curtains settle as the footlights dim.', 'A bass note trembles in the curtains.'],
                ['Venue floor', 'Front lights', 'Footlights cut across the floor. You can make out the door through the gaps.', 'The front lights go down and the door light stays on.', 'The room answers with a low rumble.'],
            ],
        }],
        ['macroCosmos', {
            stage: 'dispatch', palette: ['#b1e7e3', '#386571', '#142734'],
            rounds: [
                ['Contract gate', 'Turnstile approach', 'The company sign is freshly wiped. The floor below still shows old wheel tracks.', 'You cross the old tracks on your way out.'],
                ['Transfer hall', 'Visitor line', 'A wall board lists the route by time. A thin strip of paper covers one entry.', 'The paper strip lifts in the draft from the door.'],
                ['Office approach', 'Indicator panel', 'The panel lights in sequence above the door to the court.', 'A light turns over to the corridor side.', 'The panel goes briefly dark.'],
                ['Operations floor', 'Control rail', 'The company name on the rail looks newer than the floor underneath it.', 'The room is quiet enough to hear the ventilation.', 'A warning light is reflected in the rail.'],
            ],
        }],
        ['star', {
            stage: 'relay', palette: ['#f9dca0', '#715f49', '#2a201b'],
            rounds: [
                ['Notice lane', 'Meeting point', 'The board only has space for one sheet. The lines down the side have been ruled by hand.', 'The meeting point is quiet when you pass it again.'],
                ['Side court', 'The long way in', 'A lamp has been turned to light the gap beside the fence.', 'The lamp still reaches all the way to the gap.'],
                ['Signal court', 'Speaker rail', 'A speaker crackles above the rail as the court clears.', 'The speaker cuts out. You can hear the ordinary road again.', 'The speaker gives one short burst.'],
                ['Gathering floor', 'Far end of the court', 'The far wall is crowded with tables stacked for later.', 'Someone pulls one table away from the wall.', 'The light reaches the whole court.'],
            ],
        }],
    ]);

    const anomalyEncounters = new Map([
        ['cubone', {
            stage: 'arches', palette: ['#f4cfab', '#755849', '#251c22'],
            rounds: [
                ['Cairn trail', 'Small marker', 'A narrow track stops at a ring of stones. One stone is wet on both sides.', 'The stones are still there when you turn back toward the road.', 'Its feet settle against the gravel.'],
                ['Memorial slope', 'Below the cairn', 'Fresh gravel spills from a place somebody has stood for a long time.', 'The gravel holds the last shape pressed into it.', 'It presses against the ground and holds its place.'],
                ['Hillside marker', 'Cairn clearing', 'Wind moves through the low grass. The place beside the cairn has been kept open.', 'You leave space around the cairn as you go.', 'The sand around the marker goes still.'],
            ],
        }],
        ['yamask', {
            stage: 'arches', palette: ['#f0dfa0', '#725b49', '#251e26'],
            rounds: [
                ['Relic path', 'Ledge light', 'The edge of a low ledge catches warm light from somewhere below.', 'You leave the ledge undisturbed.', 'The surface of the relic catches the light.'],
                ['Funerary passage', 'Inner wall', 'A narrow strip of glass reflects the door on the opposite side.', 'The reflection holds after the passage goes still.', 'A hard edge turns toward the next blow.'],
                ['Wake chamber', 'Low window', 'Light from a low window reaches just to the edge of the relic.', 'The place by the window stays undisturbed.', 'The relic comes between the light and the fight.'],
            ],
        }],
        ['hypno', {
            stage: 'dispatch', palette: ['#f3d9a0', '#725755', '#281e2b'],
            rounds: [
                ['Listening lane', 'Out of the wind', 'A thin note hangs just below the sound of leaves.', 'You wait until the road sounds like the road again.', 'The next note comes through on its own.'],
                ['Woodland turn', 'Repeated note', 'The same note reaches the bend from a little closer than before.', 'The pause leaves room to listen for your partner.', 'The pitch steadies.'],
                ['Still clearing', 'Quiet center', 'The trees cut off the wind. There is room here to hear how long a note lasts.', 'The silence holds until you take a step.', 'A separate tone rises through the quiet.'],
            ],
        }],
        ['phantump', {
            stage: 'panes', palette: ['#bce6bb', '#486b5a', '#172923'],
            rounds: [
                ['Roadside grove', 'Roots by the wall', 'A root has split the bottom stone of the wall. Its pale edge is fresh.', 'The road is easier to see from the far side of the wall.', 'The loose dirt moves over a root.'],
                ['Hollow grove', 'Lifted path', 'The path rises over the roots in places. Pebbles slip back into the gaps.', 'You find solid ground at the end of the rise.', 'A root makes a shallow ridge in the soil.'],
                ['Old grove', 'Behind the roots', 'The oldest roots leave just enough room to cross without touching the markers.', 'You step around the markers on your way out.', 'The roots stir where the ground is thinnest.'],
            ],
        }],
        ['mimikyu', {
            stage: 'threshold', palette: ['#efd2e3', '#72516d', '#2a1b2e'],
            rounds: [
                ['Empty seats', 'Edge of the light', 'A strip of cloth hangs just inside the light by the empty seats.', 'You give the edge of the light some space as you leave.', 'A seam parts where the cloth twists.'],
                ['Side stage', 'Under the curtain', 'The curtain has been drawn back with an uneven loop of thread.', 'The curtain drops back into place.', 'More cloth slides out of the loose thread.'],
                ['Audience room', 'Last row', 'One soft light reaches the foot of the empty row of seats.', 'The seats stay empty when the room goes quiet.', 'The costume gives way under the light.'],
            ],
        }],
        ['drifloon', {
            stage: 'relay', palette: ['#d9c7ff', '#605478', '#211b35'],
            rounds: [
                ['Wind path', 'By the post', 'A strip of cloth lifts before the grass starts to move.', 'The cloth falls back against the post.', 'The grass catches up with the wind.'],
                ['High windbreak', 'Open corner', 'The windbreak cuts off the draft until you reach its open corner.', 'The draft is weaker on the other side of the windbreak.', 'The gust carries through the opening.'],
                ['Sky ledge', 'Last tie point', 'A length of cord rattles against the last post on the ledge.', 'The cord stops rattling long enough to hear the road below.', 'The cord pulls straight in the rising air.'],
            ],
        }],
        ['parasect', {
            stage: 'shaft', palette: ['#f3ce9b', '#735642', '#291d1b'],
            rounds: [
                ['Road ditch', 'Soft earth', 'Crumbs of soil move down the edge of the ditch.', 'Fresh crumbs settle into the little tracks.', 'A small cloud rises above the earth.'],
                ['Underpass bed', 'Damp floor', 'The soil is soft near the ledge. Footprints hold water at the bottom.', 'You find the dry edge of the underpass.', 'A fine dust lifts where the floor moves.'],
                ['Low chamber', 'Mushroom bed', 'What looked like dry ground becomes a soft patch of earth under the light.', 'You find your old footprints before stepping outside.', 'The light catches a dusting of spores.'],
            ],
        }],
        ['mewtwo', {
            stage: 'panes', palette: ['#d9ccff', '#63557d', '#231d35'],
            rounds: [
                ['Lab passage', 'Field glass', 'The wall monitor is warm. Your partner’s reflection comes and goes in the glass.', 'A reflection follows you out into the passage.', 'The monitor fills with a band of static.'],
                ['Containment floor', 'Second pane', 'A clean edge on the glass catches a mark from the room behind it.', 'The pane holds the light as the room goes quiet.', 'The glass gives a thin hum.'],
                ['End of the lab', 'Archive glass', 'The numbers along the glass have been entered in more than one hand.', 'The last light goes out of the glass. You can see your partner beside you.', 'The monitor light runs across the glass.'],
            ],
        }],
    ]);

    const factionRounds = ['battle1', 'battle2', 'miniBoss', 'boss'];
    const anomalyRounds = ['miniRaid', 'miniRaid2', 'raid'];

    function fromStoryEncounterKey(key) {
        if (key === 'main.mfBattle') {
            return {
                ...profile(...features.get(67)),
                phaseLine: 'The air in the court goes still.',
                winLine: 'The light reaches a little farther across the court.',
            };
        }
        if (typeof key !== 'string') return null;
        const [track, family, beat, ...rest] = key.split('.');
        if (rest.length) return null;
        const isFaction = track === 'villain';
        if (!isFaction && track !== 'extra') return null;
        const encounter = (isFaction ? factionEncounters : anomalyEncounters).get(family);
        const round = (isFaction ? factionRounds : anomalyRounds).indexOf(beat);
        if (!encounter || round < 0) return null;
        const [location, caption, line, winLine, phaseLine] = encounter.rounds[round];
        const result = { ...profile(key, location, caption, line, encounter.stage, ...encounter.palette), winLine };
        if (phaseLine) result.phaseLine = phaseLine;
        return result;
    }

    function profile(id, location, caption, line, stage, accent, glow, shadow) {
        return { id, location, caption, line, stage, palette: { accent, glow, shadow } };
    }

    function gymProfile(cityNumber, round, kind, roadChoice) {
        const gym = gyms[cityNumber];
        if (!gym || !Number.isInteger(round) || round < 1 || round > gym.rounds.length) return null;
        const total = gym.rounds.length;
        const leader = round === total;
        if (kind && kind !== (leader ? 'gymLeader' : 'gymTrainer')) return null;
        const [caption, accent, baseLine, winLine] = gym.rounds[round - 1];
        const helpRelitLamp = cityNumber === 1 && leader && roadChoice === 'help';
        const line = helpRelitLamp ? 'Through the doorway you can still see Dena’s warning lamp above the shift board.' : baseLine;
        return {
            ...profile(`gym-${cityNumber}-${leader ? 'leader' : `trainer-${round}`}`, gym.location, caption, line, gym.stage, accent, gym.glow, gym.shadow),
            round, total, winLine,
        };
    }

    function roadProfile(number) {
        const [id, location, caption, line, stage] = roads[number - 1];
        const gym = gyms[number];
        return profile(`road-${id}`, location, caption, line, stage, gym.rounds[0][1], gym.glow, gym.shadow);
    }

    function resolve(context) {
        if (!context || context.mode !== 'story') return null;
        const { cityNumber, kind, round, rowId, roadChoice } = context;
        const gymRow = gymRows.get(rowId);
        if (gymRow) return gymProfile(gymRow[0], gymRow[1], kind, roadChoice);
        if (kind === 'gymTrainer' || kind === 'gymLeader') {
            if (!Number.isInteger(cityNumber)) return null;
            const step = kind === 'gymLeader' ? gyms[cityNumber]?.rounds.length : (round ?? 1);
            return gymProfile(cityNumber, step, kind, roadChoice);
        }
        if (kind === 'crucible') return profile(...crucible);
        if (kind === 'mystery' && cityNumber === 8 && rowId == null) return profile(...vespergateMystery);
        if (features.has(rowId)) return profile(...features.get(rowId));
        if (roadRows.has(rowId)) return roadProfile(roadRows.get(rowId));
        return null;
    }

    function fromStoryEvent(event) {
        if (!event) return null;
        const { rowId, eventType, cityNumber, roadChoice } = event;
        const inputs = { mode: 'story', rowId, cityNumber, roadChoice };
        const trainer = /^Gym Trainer(?: ([12]))?$/.exec(eventType);
        if (trainer) return resolve({ ...inputs, kind: 'gymTrainer', round: Number(trainer[1] || 1) });
        const leader = /^Gym Leader(?: ([1-8]))?$/.exec(eventType);
        if (leader) return resolve({ ...inputs, kind: 'gymLeader', cityNumber: leader[1] ? Number(leader[1]) : cityNumber });
        if (eventType === 'Mystery Figure') return resolve({ ...inputs, kind: 'mystery' });
        if (eventType === 'Crucible') return resolve({ ...inputs, kind: 'crucible' });
        return resolve(inputs);
    }

    window.BattleEncounterProfiles = Object.freeze({ resolve, fromStoryEvent, fromStoryEncounterKey });
})();
