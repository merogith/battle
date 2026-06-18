# `ml/` — Training an AI to play the battle engine (Stage 1)

This folder is **Stage 1** of the roadmap in
`/root/.claude/plans/how-hard-to-train-fizzy-pnueli.md`: the plumbing that lets a
machine-learning agent *play* the real battle engine. There is **no learning code
yet** — Stage 1 only proves that an agent can drive full battles, that the
opponent is the engine's genuine rule-based AI, and that battles are perfectly
reproducible (the bedrock of RL training).

Nothing here changes the game (`battle.html`). It only *reads* the engine state
and *calls* existing functions (`startQuickBattle`, `playTurn`,
`selectPartyMember`, and the real `getBestMove`/`aiDecision`).

## The big picture, in plain language

Reinforcement learning = let the AI play thousands of battles, reward it when
good things happen (deal damage, KO, win), and slowly nudge its habits toward
whatever wins. To do that, code needs to be able to (1) start a battle,
(2) make a move and see what happened, and (3) know who won. That "harness" is
what lives here. The actual learning brain (PPO) plugs in at Stage 2.

```
  Python (your RL brain)                Node (this engine)
  ┌─────────────────────┐   JSON over   ┌──────────────────────────┐
  │ env.py (Gymnasium)   │ ───stdin────▶ │ server.mjs               │
  │  - observation       │               │  └ engine-host.mjs       │
  │  - reward            │ ◀──stdout──── │      └ battle.html engine │
  │  - done / win        │               │         + REAL bot AI    │
  └─────────────────────┘               └──────────────────────────┘
```

## Files

| File | What it is |
|------|-----------|
| `engine-host.mjs` | The core. Boots the engine headlessly (reusing the test harness), **restores the real bot AI** as the opponent, and turns a battle into `reset()` / `step(action)` / `legalActions()` — the shape RL wants. |
| `smoke.mjs` | Stage 1 acceptance test, **pure Node (no Python)**. Plays random battles to completion and checks that the same seed reproduces the same battle. |
| `server.mjs` | The bridge. Wraps the host in a line-by-line JSON protocol over stdin/stdout so any language can drive it. |
| `env.py` | A standard **Gymnasium** environment that launches `server.mjs` and exposes it to Python RL libraries. Run directly for a random-agent demo. |
| `requirements.txt` | Python deps. |

## Try it

**1. Pure-Node smoke test (no Python needed):**

```bash
node ml/smoke.mjs --battles 8 --party 3
```

Expected: every battle finishes, the random agent *loses most of them* to the
real bot (that's the point — a random player should lose to a competent AI), and
the determinism check prints `IDENTICAL ✓`.

**2. Python Gymnasium bridge:**

```bash
pip install -r ml/requirements.txt
python ml/env.py
```

Runs a few random episodes through the full Python↔Node bridge.

## The action & observation space (Stage 1)

- **Action** — a single integer `0..8`:
  - `0–3` = use move slot 0–3
  - `4–8` = switch to the Nth live benched mon
  - Illegal actions are reported by `legalActions()` / `info["action_mask"]` so a
    learner can mask them; an illegal pick is also remapped to a safe move
    server-side, so nothing crashes.
- **Observation** — a 54-float vector: both active mons (HP%, status, stat
  stages, move power/PP), each side's bench (HP% + alive), and field (weather,
  turn). Deliberately small and readable for Stage 1.
- **Reward** — dense and simple: `+0.5 × foe HP lost − 0.5 × your HP lost` each
  turn, plus `+1` win / `−1` loss at the end. (Tune later; taper the shaping so
  it optimizes for *winning*, not *damage*.)

> Note: Stage 1 exposes the foe's bench HP (full observability) to make the
> plumbing easy to validate. A real game hides it — Stage 3 will mask it.

## What "good" looks like and what's next

Right now a **random** agent loses ~80–100% vs the bot. That's correct: it means
the opponent is real. **Stage 2** is the first time it actually *learns*:

```python
# Stage 2 sketch (after: pip install stable-baselines3 sb3-contrib)
from sb3_contrib import MaskablePPO
from ml.env import BattleEnv

env = BattleEnv(party_size=3)
model = MaskablePPO("MlpPolicy", env, verbose=1, tensorboard_log="ml/runs")
model.learn(total_timesteps=300_000)   # watch win-rate climb past 50%, then 70%+
model.save("ml/ppo_battle")
```

The full staged plan (scale up → self-play league → optional search) lives in the
plan file referenced at the top.
