export const importedGen9Team = `Pikachu @ Light Ball
Ability: Static
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Thunderbolt
- Volt Switch
- Surf
- Grass Knot

Gholdengo @ Choice Scarf
Ability: Good as Gold
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Make It Rain
- Shadow Ball
- Focus Blast
- Trick

Dragapult @ Heavy-Duty Boots
Ability: Infiltrator
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Draco Meteor
- Shadow Ball
- Will-O-Wisp
- U-turn`;

export const importedSixTeam = `${importedGen9Team}

Dragonite @ Lum Berry
Ability: Multiscale
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Dragon Dance
- Extreme Speed
- Earthquake
- Fire Punch

Kingambit @ Leftovers
Ability: Supreme Overlord
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Kowtow Cleave
- Iron Head
- Sucker Punch
- Swords Dance

Rotor (Rotom-Heat) @ Heavy-Duty Boots
Ability: Levitate
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Overheat
- Thunderbolt
- Volt Switch
- Will-O-Wisp`;

const historicalTeammates = `Starmie @ Leftovers
Ability: Natural Cure
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Surf
- Thunderbolt
- Ice Beam
- Recover

Snorlax @ Leftovers
Ability: Thick Fat
EVs: 252 HP / 4 Def / 252 SpD
Careful Nature
- Body Slam
- Earthquake
- Rest
- Amnesia`;

export const importedGen6Team = `Alakazam @ Alakazite
Ability: Magic Guard
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Psychic
- Recover
- Focus Blast
- Encore

${historicalTeammates}`;

export const importedGen7Team = `Jolteon @ Electrium Z
Ability: Volt Absorb
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Thunderbolt
- Volt Switch
- Shadow Ball
- Quick Attack

${historicalTeammates}`;

export const gigantamaxTeam = `${historicalTeammates.replace('Snorlax @ Leftovers', 'Snorlax @ Chesto Berry\nGigantamax: Yes')}

Gengar
Ability: Cursed Body
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Thunderbolt
- Psychic
- Confuse Ray
- Night Shade`;

export const teraDanceTeam = [
  `Flare (Oricorio) @ Heavy-Duty Boots
Ability: Dancer
Tera Type: Electric
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Revelation Dance
- Hurricane
- Roost
- U-turn`,
  ...importedGen9Team.split('\n\n').slice(1),
].join('\n\n');

export const disguiseTeam = [
  `Lens (Zoroark-Hisui) @ Heavy-Duty Boots
Ability: Illusion
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Hyper Voice
- Shadow Ball
- Flamethrower
- U-turn`,
  ...importedGen9Team.split('\n\n').slice(1),
].join('\n\n');

export const rainTeam = [
  `Downpour (Pelipper) @ Heavy-Duty Boots
Ability: Drizzle
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
- Weather Ball
- Hurricane
- U-turn
- Roost`,
  ...importedGen9Team.split('\n\n').slice(1),
].join('\n\n');

export const importedGen1Team = `Tauros
- Body Slam
- Hyper Beam
- Earthquake
- Blizzard

Snorlax
- Body Slam
- Earthquake
- Rest
- Hyper Beam

Starmie
- Surf
- Thunderbolt
- Thunder Wave
- Recover`;
