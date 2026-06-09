# Comprehensive Differential Sweep

> Generated 2026-06-09 by `sweep-all.mjs`. Reference: **@pkmn/sim** (MIT). Subject: `battle.html` (headless). No game code changed — observe & diff only.

## Headline
- **Scenarios run:** 3070
- **High-confidence divergences:** 80 (across 74 entities)
- **Medium (status-presence) divergences:** 18
- **Inert probes (no signal — entity not engaged):** 3
- **Harness errors:** 0

## High-confidence divergences by shard (kind.family)

| Shard | Count |
|---|--:|
| `move.damaging` | 61 |
| `ability.ability-defensive` | 8 |
| `move.status` | 7 |
| `ability.ability-switchin` | 1 |
| `ability.ability-offensive` | 1 |
| `item.item-offensive` | 1 |
| `item.item-hold` | 1 |

## High-confidence divergences (candidate findings)

| Entity | Kind | Family | Scenario | Detail |
|---|---|---|---|---|
| **Barb Barrage** | move | damaging | `move-barbbarrage` | T1 p2a hp/damage: sd=234/267 (dmg~33) ih=267/267 (dmg~0) |
| **Bleakwind Storm** | move | damaging | `move-bleakwindstorm` | T1 p2a boost.spe: sd=-1 ih=0 |
| **Diamond Storm** | move | damaging | `move-diamondstorm` | T1 p1a boost.def: sd=2 ih=0 |
| **Muddy Water** | move | damaging | `move-muddywater` | T1 p2a boost.accuracy: sd=-1 ih=0 |
| **Parting Shot** | move | status | `move-partingshot` | T1 p2a boost.atk: sd=-1 ih=0 \| T1 p2a boost.spa: sd=-1 ih=0 |
| **Shadow Ball** | move | damaging | `move-shadowball` | T1 p2a boost.spd: sd=-1 ih=0 |
| **Silver Wind** | move | damaging | `move-silverwind` | T1 p1a boost.atk: sd=0 ih=1 \| T1 p1a boost.def: sd=0 ih=1 \| T1 p1a boost.spa: sd=0 ih=1 |
| **Stomp** | move | damaging | `move-stomp` | T1 p2a hp/damage: sd=207/267 (dmg~60) ih=267/267 (dmg~0) |
| **Twister** | move | damaging | `move-twister` | T1 p2a hp/damage: sd=243/267 (dmg~24) ih=267/267 (dmg~0) |
| **Disguise** | ability | ability-defensive | `abil-disguise-def-spec` | disjoint/min-skew ih[33-49] sd[45-75] (×1.36) |
| **Sand Spit** | ability | ability-defensive | `abil-sandspit-def-spec` | disjoint/min-skew ih[45-65] sd[61-91] (×1.36) |
| **Aura Wheel** | move | damaging | `move-aurawheel` | T1 p1a boost.spe: sd=0 ih=1 |
| **Dire Claw** | move | damaging | `move-direclaw` | T1 p2a hp/damage: sd=194/267 (dmg~73) ih=267/267 (dmg~0) |
| **Double Iron Bash** | move | damaging | `move-doubleironbash` | T1 p2a hp/damage: sd=156/267 (dmg~111) ih=267/267 (dmg~0) |
| **Poison Sting** | move | damaging | `move-poisonsting` | T1 p2a hp/damage: sd=234/267 (dmg~33) ih=267/267 (dmg~0) |
| **Searing Shot** | move | damaging | `move-searingshot` | T1 p2a hp/damage: sd=251/267 (dmg~16) ih=267/267 (dmg~0) |
| **Shadow Bone** | move | damaging | `move-shadowbone` | T1 p2a boost.def: sd=-1 ih=0 |
| **Triple Arrows** | move | damaging | `move-triplearrows` | T1 p2a boost.def: sd=-1 ih=0 |
| **Zing Zap** | move | damaging | `move-zingzap` | T1 p2a hp/damage: sd=194/267 (dmg~73) ih=267/267 (dmg~0) |
| **Moody** | ability | ability-switchin | `abil-moody-switchin` | T1 p1a boost.atk: sd=0 ih=2 \| T1 p1a boost.spa: sd=2 ih=-1 \| T1 p1a boost.spe: sd=-1 ih=0 |
| **Decorate** | move | status | `move-decorate` | T1 p2a boost.atk: sd=2 ih=0 \| T1 p2a boost.spa: sd=2 ih=0 |
| **Iron Head** | move | damaging | `move-ironhead` | T1 p2a hp/damage: sd=194/267 (dmg~73) ih=267/267 (dmg~0) |
| **Mud-Slap** | move | damaging | `move-mudslap` | T1 p2a hp/damage: sd=267/267 (dmg~0) ih=255/267 (dmg~12) |
| **Raging Bull** | move | damaging | `move-ragingbull` | T1 p2a hp/damage: sd=267/267 (dmg~0) ih=231/267 (dmg~36) |
| **Rock Smash** | move | damaging | `move-rocksmash` | T1 p2a boost.def: sd=-1 ih=0 |
| **Toxic Thread** | move | status | `move-toxicthread` | T1 p2a status: sd=psn ih=(none) |
| **Snow Warning** | ability | ability-offensive | `abil-snowwarning-atk` | disjoint/min-skew ih[20-20] sd[9-14] (×2.22) |
| **Bite** | move | damaging | `move-bite` | T1 p2a hp/damage: sd=212/267 (dmg~55) ih=267/267 (dmg~0) |
| **Crunch** | move | damaging | `move-crunch` | T1 p2a boost.def: sd=-1 ih=0 |
| **Headbutt** | move | damaging | `move-headbutt` | T1 p2a hp/damage: sd=203/267 (dmg~64) ih=267/267 (dmg~0) |
| **Heart Stamp** | move | damaging | `move-heartstamp` | T1 p2a hp/damage: sd=185/267 (dmg~82) ih=267/267 (dmg~0) |
| **Infernal Parade** | move | damaging | `move-infernalparade` | T1 p2a hp/damage: sd=190/202 (dmg~12) ih=202/202 (dmg~0) |
| **Iron Tail** | move | damaging | `move-irontail` | T1 p2a boost.def: sd=-1 ih=0 |
| **Lava Plume** | move | damaging | `move-lavaplume` | T1 p2a hp/damage: sd=251/267 (dmg~16) ih=267/267 (dmg~0) |
| **Meteor Mash** | move | damaging | `move-meteormash` | T1 p1a boost.atk: sd=1 ih=0 |
| **Needle Arm** | move | damaging | `move-needlearm` | T1 p2a hp/damage: sd=212/267 (dmg~55) ih=267/267 (dmg~0) |
| **Scald** | move | damaging | `move-scald` | T1 p2a hp/damage: sd=251/267 (dmg~16) ih=267/267 (dmg~0) |
| **Snow Warning** | ability | ability-defensive | `abil-snowwarning-def-phys` | disjoint/min-skew ih[90-103] sd[74-123] (×1.22) |
| **Tera Shell** | ability | ability-defensive | `abil-terashell-def-phys` | disjoint/min-skew ih[37-43] sd[74-123] (×2.00) |
| **Astonish** | move | damaging | `move-astonish` | T1 p2a hp/damage: sd=177/202 (dmg~25) ih=202/202 (dmg~0) |
| **Clanging Scales** | move | damaging | `move-clangingscales` | T1 p1a boost.def: sd=-1 ih=0 |
| **Crush Claw** | move | damaging | `move-crushclaw` | T1 p2a boost.def: sd=-1 ih=0 |
| **Giga Impact** | move | damaging | `move-gigaimpact` | T1 p2a hp/damage: sd=264/267 (dmg~3) ih=260/267 (dmg~7) |
| **Hyperspace Fury** | move | damaging | `move-hyperspacefury` | T1 p1a boost.def: sd=0 ih=-1 |
| **Luster Purge** | move | damaging | `move-lusterpurge` | T1 p2a boost.spd: sd=-1 ih=0 |
| **Metronome** | move | status | `move-metronome` | T1 p2a boost.spe: sd=0 ih=-1 |
| **Night Daze** | move | damaging | `move-nightdaze` | T1 p2a boost.accuracy: sd=-1 ih=0 |
| **Sludge** | move | damaging | `move-sludge` | T1 p2a hp/damage: sd=234/267 (dmg~33) ih=267/267 (dmg~0) |
| **Snow Warning** | ability | ability-defensive | `abil-snowwarning-def-spec` | disjoint/min-skew ih[61-81] sd[45-75] (×1.36) |
| **Tera Shell** | ability | ability-defensive | `abil-terashell-def-spec` | disjoint/min-skew ih[22-40] sd[45-75] (×2.05) |
| **Chatter** | move | damaging | `move-chatter` | T1 p2a hp/damage: sd=267/267 (dmg~0) ih=204/267 (dmg~63) |
| **Gigaton Hammer** | move | damaging | `move-gigatonhammer` | T1 p2a hp/damage: sd=255/267 (dmg~12) ih=239/267 (dmg~28) |
| **Headlong Rush** | move | damaging | `move-headlongrush` | T1 p1a boost.def: sd=-1 ih=-2 \| T1 p1a boost.spd: sd=-1 ih=-2 |
| **Liquidation** | move | damaging | `move-liquidation` | T1 p2a boost.def: sd=-1 ih=0 |
| **Mirror Shot** | move | damaging | `move-mirrorshot` | T1 p2a boost.accuracy: sd=-1 ih=0 |
| **Octazooka** | move | damaging | `move-octazooka` | T1 p2a boost.accuracy: sd=-1 ih=0 |
| **Poison Fang** | move | damaging | `move-poisonfang` | T1 p2a hp/damage: sd=251/267 (dmg~16) ih=267/267 (dmg~0) |
| **Seed Flare** | move | damaging | `move-seedflare` | T1 p2a boost.spd: sd=-2 ih=0 |
| **Sludge Bomb** | move | damaging | `move-sludgebomb` | T1 p2a hp/damage: sd=234/267 (dmg~33) ih=267/267 (dmg~0) |
| **Tri Attack** | move | damaging | `move-triattack` | T1 p2a hp/damage: sd=220/267 (dmg~47) ih=267/267 (dmg~0) |
| **Acupressure** | move | status | `move-acupressure` | T1 p1a boost.def: sd=0 ih=2 \| T1 p1a boost.spd: sd=2 ih=0 |
| **Bug Buzz** | move | damaging | `move-bugbuzz` | T1 p2a boost.spd: sd=0 ih=-1 |
| **Fiery Dance** | move | damaging | `move-fierydance` | T1 p1a boost.spa: sd=1 ih=0 |
| **Malignant Chain** | move | damaging | `move-malignantchain` | T1 p2a hp/damage: sd=251/267 (dmg~16) ih=267/267 (dmg~0) |
| **Mist Ball** | move | damaging | `move-mistball` | T1 p2a boost.spa: sd=-1 ih=0 |
| **Waterfall** | move | damaging | `move-waterfall` | T1 p2a hp/damage: sd=194/267 (dmg~73) ih=267/267 (dmg~0) |
| **Berserk Gene** | item | item-offensive | `item-berserkgene-atk` | disjoint/min-skew ih[9-9] sd[0-19] (×∞) |
| **Captivate** | move | status | `move-captivate` | T1 p2a boost.spa: sd=0 ih=-2 |
| **Dark Pulse** | move | damaging | `move-darkpulse` | T1 p2a hp/damage: sd=220/267 (dmg~47) ih=267/267 (dmg~0) |
| **Fiery Wrath** | move | damaging | `move-fierywrath` | T1 p2a hp/damage: sd=214/267 (dmg~53) ih=267/267 (dmg~0) |
| **Leaf Tornado** | move | damaging | `move-leaftornado` | T1 p2a boost.accuracy: sd=-1 ih=0 |
| **Memento** | move | status | `move-memento` | T1 p1a fainted: sd=true ih=false \| T- - winner: sd=P2 ih=null |
| **Photon Geyser** | move | damaging | `move-photongeyser` | T1 p2a hp/damage: sd=267/267 (dmg~0) ih=258/267 (dmg~9) |
| **Poison Jab** | move | damaging | `move-poisonjab` | T1 p2a hp/damage: sd=234/267 (dmg~33) ih=267/267 (dmg~0) |
| **Psystrike** | move | damaging | `move-psystrike` | T1 p2a hp/damage: sd=263/267 (dmg~4) ih=258/267 (dmg~9) |
| **Razor Shell** | move | damaging | `move-razorshell` | T1 p2a boost.def: sd=-1 ih=0 |
| **Shell Side Arm** | move | damaging | `move-shellsidearm` | T1 p2a hp/damage: sd=234/267 (dmg~33) ih=267/267 (dmg~0) |
| **Disguise** | ability | ability-defensive | `abil-disguise-def-phys` | disjoint/min-skew ih[33-33] sd[74-123] (×2.24) |
| **Sand Spit** | ability | ability-defensive | `abil-sandspit-def-phys` | disjoint/min-skew ih[74-87] sd[90-139] (×1.22) |
| **Berserk Gene** | item | item-hold | `item-berserkgene-hold` | T1 p1a boost.atk: sd=2 ih=0 \| T2 p1a boost.atk: sd=2 ih=0 |
