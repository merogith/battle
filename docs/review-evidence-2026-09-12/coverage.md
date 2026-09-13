# Move Coverage Report

Generated: 2026-09-12T21:01:05.026Z

**Total moves in moves.json:** 954

**Engine named-branch references:** 822 (0 reference move names not in moves.json)

## Bucket Summary

| Bucket | Count | % |
|---|---:|---:|
| named-branch | 822 | 86.2% |
| data-driven | 82 | 8.6% |
| damaging-only | 50 | 5.2% |
| partially-handled | 0 | 0.0% |
| unhandled | 0 | 0.0% |

## Per-Generation Breakdown

| Gen | Total | named-branch | data-driven | damaging-only | partial | unhandled |
|---|---:|---:|---:|---:|---:|---:|
| 9 | 954 | 822 | 82 | 50 | 0 | 0 |

## How to Use This Report

- Bucket `unhandled` is the priority gap list: those moves silently do nothing.
- Bucket `partially-handled` needs either a code branch or a richer data schema.
- Bucket `damaging-only` is fine for vanilla attacks (Tackle, Pound) but may indicate missing secondaries on moves like Body Slam.
- Property tests in `/tests/property/` iterate over the CSV to find regressions.
