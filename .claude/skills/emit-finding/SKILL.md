---
name: emit-finding
description: Standardized finding emission. Computes the fingerprint, formats YAML frontmatter, writes the finding file under `agent-state/findings/<agent-name>-<timestamp>.md`. Every specialist sub-agent MUST use this to guarantee dedup-friendly output.
---

# emit-finding

## Why this skill exists

Findings get fed to `scripts/debug/issue-ledger.mjs`, which dedupes by fingerprint and sorts by severity. If two agents emit the same issue with different wording, the deduper merges them — but only if the fingerprint matches. The fingerprint is `SHA(kind + anchor_symbol + normalized_evidence)`. If you skip the fingerprint or write the YAML by hand, your finding either silently duplicates or fails to merge with another agent's report.

Use this skill for every finding. No exceptions.

## How to emit one finding

```bash
# Compute fingerprint
FP=$(node scripts/debug/fingerprint.mjs bug rollTrainerTeam "the evidence text or code excerpt that proves the issue")

# Compose the finding (multiple findings can go in one file — re-run the YAML block)
AGENT="story-mode-investigator"
TS=$(date -u +%Y%m%dT%H%M%SZ)
FILE="agent-state/findings/${AGENT}-${TS}.md"
mkdir -p agent-state/findings

cat > "$FILE" <<EOF
---
severity: P1
category: bug
anchor_symbol: rollTrainerTeam
current_line_hint: ~37609
file: battle.html
agents: [${AGENT}]
fingerprint: ${FP}
confidence: medium
status: open
---

**Title**: <one-sentence, ≤80 chars>

**Evidence**:
\`\`\`js
<≤8-line code excerpt>
\`\`\`

**Repro**: <command, URL+seed, or scenario>

**Blast radius**: <which other systems touch this>

**Fix sketch**: <1–3 sentences>

**Verification**: <how to confirm the fix>

EOF
```

## Appending multiple findings to one file

Just append more `---` … `---` blocks + body sections to the same file. The ledger parses each block independently.

## Required field reminder

See `agent-state/LEDGER_SCHEMA.md` for the full schema. Required: `severity`, `category`, `anchor_symbol`, `file`, `agents`, `fingerprint`, `confidence`, `status`. Optional: `current_line_hint`.

## Fingerprint normalization rules

`fingerprint.mjs` normalizes by collapsing whitespace and truncating to 4096 chars. **Use the actual offending code or text as evidence input** — quoting your *interpretation* of the bug will produce different fingerprints across agents and break dedup.

✅ Good: `node scripts/debug/fingerprint.mjs bug rollTrainerTeam "$(sed -n '37609,37614p' battle.html)"`
❌ Bad: `node scripts/debug/fingerprint.mjs bug rollTrainerTeam "rival might pick wrong type"`

## After emitting

Run `node scripts/debug/issue-ledger.mjs` to regenerate `agent-state/ISSUE_LEDGER.md`. The orchestrator does this automatically after fan-out completes; if you ran a single agent manually, run it yourself.

## Anti-patterns

- ❌ Skipping the fingerprint (dedup breaks).
- ❌ Hand-writing YAML in a non-standard order (parser is order-agnostic but consistency aids review).
- ❌ Filling `id` — the ledger assigns ids on dedup; agents must leave it blank.
- ❌ Setting `status` to anything other than `open` — status transitions happen against the ledger, not in findings.
- ❌ Embedding patches in `fix sketch` — keep it to 1–3 sentences of natural language.
