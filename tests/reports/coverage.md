# Move Coverage Report

Generated: 2026-05-21T20:23:55.733Z

**Total moves in moves.json:** 954

**Engine named-branch references:** 798 (0 reference move names not in moves.json)

## Bucket Summary

| Bucket | Count | % |
|---|---:|---:|
| named-branch | 798 | 83.6% |
| data-driven | 88 | 9.2% |
| damaging-only | 62 | 6.5% |
| partially-handled | 0 | 0.0% |
| unhandled | 6 | 0.6% |

## Per-Generation Breakdown

| Gen | Total | named-branch | data-driven | damaging-only | partial | unhandled |
|---|---:|---:|---:|---:|---:|---:|
| 9 | 954 | 798 | 88 | 62 | 0 | 6 |

## Unhandled Moves (6)

These moves have basePower=0 and no boosts/status/volatile/self/secondary/side condition/weather/terrain declared.
They likely do nothing in the engine. Add either a named branch in battle.html or appropriate data fields in moves.json.

- Corrosive Gas (gen 9)
- Doodle (gen 9)
- Flower Shield (gen 9)
- Rototiller (gen 9)
- Teatime (gen 9)
- Venom Drench (gen 9)

## How to Use This Report

- Bucket `unhandled` is the priority gap list: those moves silently do nothing.
- Bucket `partially-handled` needs either a code branch or a richer data schema.
- Bucket `damaging-only` is fine for vanilla attacks (Tackle, Pound) but may indicate missing secondaries on moves like Body Slam.
- Property tests in `/tests/property/` iterate over the CSV to find regressions.
