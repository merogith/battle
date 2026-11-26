/* Local art and sound treatments. These profiles never participate in save or encounter logic. */
(function () {
    'use strict';

    const story = name => `sprites/backgrounds/story/${name}.webp`;
    const world = name => name ? `music/world/${name}.mp3` : '';
    const legacy = (name, extension = 'png') => `sprites/story/backgrounds/${name}.${extension}`;

    function scene(id, name, background, fallback, ambience, cue, focus = '50%') {
        return Object.freeze({ id, name, background, fallback, focus, ambience: world(ambience), cue: world(cue) });
    }

    const cities = [
        scene('pallet', 'Pallet Town', story('pallet-harbor'), legacy('city-0', 'svg'), 'coast-surf', 'harbor-rope'),
        scene('flintreach', 'Flintreach Town', story('flintreach-quarry'), legacy('city-1', 'svg'), 'quarry-air', 'flintreach-shift-bell', '42%'),
        scene('kettlestone', 'Kettlestone Town', story('kettlestone-workshop'), story('mineshaft-pass'), 'quarry-air', 'workshop-lift-latch'),
        scene('lindenbell', 'Lindenbell Town', story('recovery-school'), legacy('city-3', 'svg'), 'quarry-air', 'lindenbell-yard-bell'),
        scene('reedmarket', 'Reedmarket City', story('recovery-ranger'), legacy('gen3-forest'), 'wetlands-reeds', 'reedmarket-gate'),
        scene('glasswater', 'Glasswater City', story('recovery-lake'), legacy('gen3-sea'), 'wetlands-reeds', 'glasswater-shutter'),
        scene('brasslock', 'Brasslock City', story('recovery-yard'), legacy('gen3-villain'), 'freight-ventilation', 'brasslock-yard-relay'),
        scene('beaconrest', 'Beaconrest Town', story('recovery-highlands'), legacy('gen3-mountain'), 'highland-wind', 'beaconrest-contact'),
        scene('vespergate', 'Vespergate Town', story('cathedral-approach'), legacy('gen3-cavern'), 'highland-wind', 'vespergate-wick'),
        scene('pokemon-league', 'Pokémon League', story('recovery-league'), legacy('gen3-league'), 'league-room-tone', 'league-desk-reader'),
    ];

    const roads = [null,
        scene('breakwater', 'Breakwater Road', story('route1-unlit-signal'), legacy('gen3-forest'), 'coast-surf', 'harbor-rope'),
        scene('mineshaft', 'Mineshaft Pass', story('mineshaft-pass'), legacy('gen3-cave'), 'quarry-air', 'workshop-lift-latch'),
        scene('canopy', 'Canopy Mile', legacy('gen3-forest'), story('recovery-school'), 'quarry-air', 'lindenbell-yard-bell'),
        scene('warden', 'Warden’s Track', story('recovery-ranger'), legacy('gen3-forest'), 'wetlands-reeds', 'reedmarket-gate'),
        scene('lakeside', 'Lakeside Road', story('recovery-lake'), legacy('gen3-sea'), 'wetlands-reeds', 'glasswater-shutter'),
        scene('switchback', 'Switchback Road', story('recovery-yard'), legacy('gen3-mountain'), 'freight-ventilation', 'brasslock-yard-relay'),
        scene('highcountry', 'Highcountry Pass', story('recovery-highlands'), legacy('gen3-mountain'), 'highland-wind', 'beaconrest-contact'),
        scene('cathedral', 'Cathedral Approach', story('cathedral-approach'), legacy('gen3-cavern'), 'highland-wind', 'vespergate-wick'),
        scene('victory-road', 'Victory Road', story('victory-road'), legacy('gen3-league'), 'highland-wind', 'league-desk-reader'),
    ];

    const facilities = [
        scene('crucible', 'The Crucible', story('recovery-crucible'), story('recovery-league'), 'league-room-tone', 'league-desk-reader'),
        scene('professor-lab', 'Professor’s Lab', legacy('gen3-lab'), story('pallet-harbor')),
        scene('center-and-pc', 'Pokémon Center', story('recovery-clinic'), legacy('gen3-lab')),
        scene('underground', 'Underground', story('underground-counter'), legacy('gen3-mansion'), 'quarry-air', 'ui-metallatch'),
        scene('mart', 'Pokémart', legacy('shop-mart', 'svg'), story('field-bag')),
        scene('department-store', 'Department Store', legacy('shop-dept', 'svg'), story('field-bag')),
        scene('stones', 'Stones and Beyond', story('evolution-lab'), legacy('shop-mart', 'svg'), 'quarry-air'),
        scene('relic-hall', 'Relic Hall', story('field-journal'), legacy('gen3-cavern')),
        scene('cable-link', 'Cable Link Station', legacy('link-station', 'svg'), story('move-workshop')),
        scene('move-tutor', 'Move Tutor', story('move-workshop'), story('mentor-room')),
        scene('battle-mentor', 'Battle Mentor', story('mentor-room'), story('field-journal')),
        scene('battle-dojo', 'Battle Dojo', story('battle-dojo'), story('mentor-room')),
        scene('nature-rater', 'Nature Rater', story('nature-greenhouse'), story('mentor-room')),
        scene('ev-trainer', 'EV Trainer', story('battle-dojo'), story('mentor-room')),
        scene('evolution-tutor', 'Evolution Tutor', story('evolution-lab'), legacy('gen3-lab')),
        scene('colress', 'Power Up', story('recovery-highlands'), legacy('gen3-lab'), 'highland-wind', 'beaconrest-contact'),
        scene('fan-club', 'Pokémon Fan Club', story('kettlestone-workshop'), story('recovery-school')),
        scene('daycare-inn', 'Daycare Inn', story('daycare-warm-room'), story('recovery-clinic')),
        scene('fight-club', 'Fight Club', story('underground-counter'), legacy('gen3-cave'), 'quarry-air', 'ui-metallatch'),
        scene('casino', 'Poké Game Corner', story('game-corner'), legacy('shop-dept', 'svg'), 'wetlands-reeds'),
        scene('safari', 'Safari Zone', legacy('gen3-safari'), story('recovery-lake'), 'wetlands-reeds', 'reedmarket-gate'),
        scene('camp', 'Camp', story('camp-clearing'), story('route1-unlit-signal'), '', 'camp-ember', '62%'),
        scene('bag', 'Bag', story('field-bag'), ''),
        scene('pokedex', 'Pokédex', story('field-dex'), ''),
        scene('atlas-notebook-archive', 'Field Notebook', story('field-journal'), ''),
    ];
    const facilityMap = new Map(facilities.map(profile => [profile.id, profile]));
    const heard = new Set();

    function setAmbience(profile) {
        if (profile === null || profile?.ambience) window.AudioSystem?.setPlaceAmbience(profile?.ambience || '');
    }

    window.WorldPresentation = Object.freeze({
        city(index) { return Number.isInteger(index) ? cities[index] || null : null; },
        route(index) { return Number.isInteger(index) ? roads[index] || null : null; },
        facility(id) { return facilityMap.get(id) || null; },
        setAmbience,
        arrangeArt(image, profile) {
            if (!image || !profile?.background) return;
            image.style.objectPosition = `${profile.focus} center`;
            image.onerror = () => {
                const clear = () => {
                    image.onerror = null;
                    image.removeAttribute('src');
                };
                if (!profile.fallback) { clear(); return; }
                image.onerror = clear;
                image.src = profile.fallback;
            };
            image.src = profile.background;
        },
        arrive(profile, occurrenceId) {
            setAmbience(profile);
            if (!profile?.cue) return;
            if (occurrenceId != null) {
                const key = `${profile.id}:${occurrenceId}`;
                if (heard.has(key)) return;
                heard.add(key);
                if (heard.size > 64) heard.delete(heard.values().next().value);
            }
            window.AudioSystem?.playPlaceCue(profile.cue);
        },
        playCue(name) { window.AudioSystem?.playPlaceCue(world(name)); },
        reset() { heard.clear(); setAmbience(null); },
    });
})();
