# Generated Coverage Map

> 2026-06-09 · `generate-scenarios.mjs` · reference data: @pkmn/dex gen 9 (MIT).

**Entities enumerated:** 1855 · **scenarios emitted:** 3070 (trace 1605 · sweep 1465)

## Per-kind routing

| Kind | Total | Probed | needs-targeted | untestable | banned/oos | harness-untestable |
|---|--:|--:|--:|--:|--:|--:|
| move | 954 | 762 | 52 | 24 | 116 | 0 |
| ability | 318 | 311 | 0 | 0 | 7 | 0 |
| item | 583 | 532 | 0 | 0 | 50 | 1 |

## Move families

| Family | Count |
|---|--:|
| damaging | 517 |
| status | 241 |
| - | 140 |
| variable-power | 24 |
| charge | 17 |
| counter | 5 |
| fixed-damage | 4 |
| ohko | 4 |
| delayed | 2 |

## Entities NOT auto-probed (routed out)

These need a curated targeted probe or are out of scope; listed so coverage is honest.


### needs-targeted (52)
- move: **Beat Up** — BP depends on prior state
- move: **Bide** — needs an incoming hit
- move: **Bounce** — two-turn charge move
- move: **Comeuppance** — needs an incoming hit
- move: **Counter** — needs an incoming hit
- move: **Crush Grip** — BP depends on prior state
- move: **Dig** — two-turn charge move
- move: **Dive** — two-turn charge move
- move: **Doom Desire** — delayed damage (2 turns)
- move: **Echoed Voice** — BP depends on prior state
- move: **Electro Ball** — BP depends on prior state
- move: **Electro Shot** — two-turn charge move
- move: **Endeavor** — BP depends on prior state
- move: **Final Gambit** — BP depends on prior state
- move: **Fissure** — OHKO (30% acc; outcome is faint-or-nothing)
- move: **Flail** — BP depends on prior state
- move: **Fly** — two-turn charge move
- move: **Freeze Shock** — two-turn charge move
- move: **Fury Cutter** — BP depends on prior state
- move: **Future Sight** — delayed damage (2 turns)
- move: **Geomancy** — two-turn charge move
- move: **Grass Knot** — BP depends on prior state
- move: **Guillotine** — OHKO (30% acc; outcome is faint-or-nothing)
- move: **Gyro Ball** — BP depends on prior state
- move: **Hard Press** — BP depends on prior state
- move: **Heat Crash** — BP depends on prior state
- move: **Heavy Slam** — BP depends on prior state
- move: **Horn Drill** — OHKO (30% acc; outcome is faint-or-nothing)
- move: **Ice Ball** — BP depends on prior state
- move: **Ice Burn** — two-turn charge move
- move: **Low Kick** — BP depends on prior state
- move: **Magnitude** — BP depends on prior state
- move: **Metal Burst** — needs an incoming hit
- move: **Meteor Beam** — two-turn charge move
- move: **Mirror Coat** — needs an incoming hit
- move: **Phantom Force** — two-turn charge move
- move: **Power Trip** — BP depends on prior state
- move: **Present** — BP depends on prior state
- move: **Punishment** — BP depends on prior state
- move: **Razor Wind** — two-turn charge move
- move: **Reversal** — BP depends on prior state
- move: **Rollout** — BP depends on prior state
- move: **Shadow Force** — two-turn charge move
- move: **Sheer Cold** — OHKO (30% acc; outcome is faint-or-nothing)
- move: **Skull Bash** — two-turn charge move
- move: **Sky Attack** — two-turn charge move
- move: **Sky Drop** — two-turn charge move
- move: **Solar Beam** — two-turn charge move
- move: **Solar Blade** — two-turn charge move
- move: **Stored Power** — BP depends on prior state
- move: **Trump Card** — BP depends on prior state
- move: **Wring Out** — BP depends on prior state

### untestable (24)
- move: **Aromatherapy** — ally/doubles target
- move: **Aromatic Mist** — ally/doubles target
- move: **Aurora Veil** — ally/doubles target
- move: **Coaching** — ally/doubles target
- move: **Crafty Shield** — ally/doubles target
- move: **Dragon Cheer** — ally/doubles target
- move: **Gear Up** — ally/doubles target
- move: **Happy Hour** — ally/doubles target
- move: **Heal Bell** — ally/doubles target
- move: **Helping Hand** — ally/doubles target
- move: **Howl** — ally/doubles target
- move: **Jungle Healing** — ally/doubles target
- move: **Life Dew** — ally/doubles target
- move: **Light Screen** — ally/doubles target
- move: **Lucky Chant** — ally/doubles target
- move: **Lunar Blessing** — ally/doubles target
- move: **Magnetic Flux** — ally/doubles target
- move: **Mat Block** — ally/doubles target
- move: **Mist** — ally/doubles target
- move: **Quick Guard** — ally/doubles target
- move: **Reflect** — ally/doubles target
- move: **Safeguard** — ally/doubles target
- move: **Tailwind** — ally/doubles target
- move: **Wide Guard** — ally/doubles target

### harness-untestable (1)
- item: **Eviolite** — evolution-data-dependent (jsdom stubs @pkmn/dex)

### banned-oos (173)
- move: **10,000,000 Volt Thunderbolt** — Z-move
- move: **Acid Downpour** — Z-move
- move: **All-Out Pummeling** — Z-move
- move: **Baddy Bad** — LGPE
- move: **Black Hole Eclipse** — Z-move
- move: **Blazing Torque** — Unobtainable
- move: **Bloom Doom** — Z-move
- move: **Bouncy Bubble** — LGPE
- move: **Breakneck Blitz** — Z-move
- move: **Burn Up** — Unobtainable
- move: **Buzzy Buzz** — LGPE
- move: **Catastropika** — Z-move
- move: **Clangorous Soulblaze** — Z-move
- move: **Combat Torque** — Unobtainable
- move: **Continental Crush** — Z-move
- move: **Corkscrew Crash** — Z-move
- move: **Corrosive Gas** — Unobtainable
- move: **Cut** — Unobtainable
- move: **Devastating Drake** — Z-move
- move: **Extreme Evoboost** — Z-move
- move: **Floaty Fall** — LGPE
- move: **Freezy Frost** — LGPE
- move: **Genesis Supernova** — Z-move
- move: **Gigavolt Havoc** — Z-move
- move: **Glitzy Glow** — LGPE
- move: **G-Max Befuddle** — Max move
- move: **G-Max Cannonade** — Max move
- move: **G-Max Centiferno** — Max move
- move: **G-Max Chi Strike** — Max move
- move: **G-Max Cuddle** — Max move
- move: **G-Max Depletion** — Max move
- move: **G-Max Drum Solo** — Max move
- move: **G-Max Finale** — Max move
- move: **G-Max Fireball** — Max move
- move: **G-Max Foam Burst** — Max move
- move: **G-Max Gold Rush** — Max move
- move: **G-Max Gravitas** — Max move
- move: **G-Max Hydrosnipe** — Max move
- move: **G-Max Malodor** — Max move
- move: **G-Max Meltdown** — Max move
- move: **G-Max One Blow** — Max move
- move: **G-Max Rapid Flow** — Max move
- move: **G-Max Replenish** — Max move
- move: **G-Max Resonance** — Max move
- move: **G-Max Sandblast** — Max move
- move: **G-Max Smite** — Max move
- move: **G-Max Snooze** — Max move
- move: **G-Max Steelsurge** — Max move
- move: **G-Max Stonesurge** — Max move
- move: **G-Max Stun Shock** — Max move
- move: **G-Max Sweetness** — Max move
- move: **G-Max Tartness** — Max move
- move: **G-Max Terror** — Max move
- move: **G-Max Vine Lash** — Max move
- move: **G-Max Volcalith** — Max move
- move: **G-Max Volt Crash** — Max move
- move: **G-Max Wildfire** — Max move
- move: **G-Max Wind Rage** — Max move
- move: **Guardian of Alola** — Z-move
- move: **Hold Back** — Unobtainable
- move: **Hold Hands** — Unobtainable
- move: **Hydro Vortex** — Z-move
- move: **Inferno Overdrive** — Z-move
- move: **Let's Snuggle Forever** — Z-move
- move: **Light That Burns the Sky** — Z-move
- move: **Magical Torque** — Unobtainable
- move: **Malicious Moonsault** — Z-move
- move: **Max Airstream** — Max move
- move: **Max Darkness** — Max move
- move: **Max Flare** — Max move
- move: **Max Flutterby** — Max move
- move: **Max Geyser** — Max move
- move: **Max Guard** — Max move
- move: **Max Hailstorm** — Max move
- move: **Max Knuckle** — Max move
- move: **Max Lightning** — Max move
- move: **Max Mindstorm** — Max move
- move: **Max Ooze** — Max move
- move: **Max Overgrowth** — Max move
- move: **Max Phantasm** — Max move
- … (+93 more)
