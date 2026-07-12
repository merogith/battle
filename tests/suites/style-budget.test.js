// STYLE-BUDGET GUARD (Phase B9) — keeps the visual-system consolidation from decaying.
//
// The 2026-07-04 census found the design-token layer had ~0% adoption and was drifting
// BACKWARD (inline styles, button classes, breakpoints, font !importants all growing).
// Phase B swept raw values onto tokens, enforced a 10px type floor + accessible badge ink,
// and unified the grays. This test locks those wins as CI-enforced invariants: some are
// hard rules (never regress), others are non-increasing ratchets that later cleanup passes
// (B5–B8) will lower as they land.
//
// If a change here fails: don't bump the ceiling to make it pass — use the token/ramp the
// message points at. Ratchets may be LOWERED (never raised) when a cleanup pass removes usages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = fs.readFileSync(path.join(HERE, '..', '..', 'battle.html'), 'utf8');

const countAll = (re) => (HTML.match(re) || []).length;

// ── HARD RULES (must stay at 0) ──────────────────────────────────────────────

test('no sub-10px or half-pixel font-size (Press Start 2P renders those blurry / illegible)', () => {
  const sizes = [...HTML.matchAll(/font-size:\s*([0-9]+(?:\.[0-9]+)?)px/g)].map(m => parseFloat(m[1]));
  const bad = sizes.filter(v => v < 10 || v !== Math.round(v));
  assert.equal(bad.length, 0,
    `Found ${bad.length} font-size(s) below the 10px floor or with a half-pixel value ` +
    `(e.g. ${[...new Set(bad)].slice(0, 6).join('px, ')}px). Use an integer size ≥ 10px.`);
});

test('no raw gray TEXT colors — use --text-muted / --text-dim (WCAG wayfinding fix)', () => {
  const n = countAll(/color:\s*#(?:666|777|888|999|aaa|bbb|ccc)\b/g);
  assert.equal(n, 0,
    `Found ${n} hardcoded gray text color(s). Use var(--text-muted) (#666–#999) or ` +
    `var(--text-dim) (#aaa–#ccc) so wayfinding text stays ≥4.5:1.`);
});

test('no raw hex where a semantic token exists (color/background/border values)', () => {
  // These exact hexes ARE token values; writing them raw re-forks the palette.
  // Negative lookbehind for -/\w so this doesn't match custom-property *definitions*
  // (e.g. `--bg-color: #0a0a0a`, `--text-color: #e8e8e8`) — only real value uses.
  const n = countAll(/(?<![-\w])(?:color|background|background-color|border-color):\s*#(?:ffd54f|4caf50|f44336|ffc107|ce93d8|ffab40|81c784|29b6f6|9aa0aa|c0c4cc|e8e8e8|0a0a0a|161616|1e1e1e)\b/g);
  assert.equal(n, 0,
    `Found ${n} raw hex used as a CSS value that equals an existing :root token ` +
    `(#ffd54f=--accent, #4caf50=--hp-green, #ce93d8=--fac-train, …). Use the token.`);
});

test('single typeface — no Arial / sans-serif escape hatch (pixel font everywhere)', () => {
  const n = countAll(/font-family:[^;"'}]*\b[Aa]rial\b/g);
  assert.equal(n, 0, `Found ${n} Arial font-family site(s). Use var(--ui-font) / var(--battle-font).`);
});

// ── RATCHETS (non-increasing; lower these as B5–B8 land, never raise) ─────────

const CEILINGS = {
  inlineStyles:    { re: /style="/g,                         max: 1600, hint: 'inline style="…" attrs — class-ify duplicated idioms (B8)' },
  fontSizeImportant:{ re: /font-size:[^;"}]*!important/g,     max: 60,   hint: 'font-size …!important — resolve the cascade conflict instead (B3)' },
  breakpointWidths:{ re: null,                                max: 20,   hint: 'distinct @media width breakpoints — fold onto the 4-width canon (B6)',
                     count: () => new Set([...HTML.matchAll(/@media[^{]*\((?:max|min)-width:\s*(\d+)px/g)].map(m => m[1])).size },
};

for (const [name, spec] of Object.entries(CEILINGS)) {
  test(`ratchet: ${name} does not grow past ${spec.max}`, () => {
    const n = spec.count ? spec.count() : countAll(spec.re);
    assert.ok(n <= spec.max,
      `${name} = ${n}, exceeds ceiling ${spec.max}. ${spec.hint}. ` +
      `Do NOT raise the ceiling — reduce the count.`);
  });
}
