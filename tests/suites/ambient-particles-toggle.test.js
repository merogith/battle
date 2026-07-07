// Ambient-particles settings toggle (visual-polish PR).
//
// settings.ambientParticles existed and persisted but had no settings-modal
// switch — it could only be turned off programmatically or via reduced motion.
// This adds the missing UI switch, wires it into the modal sync list, and gives
// applySettingSwitch a branch that applies the change live (tears down the
// active particle layer on disable, re-arms battle weather on enable).
//
// Source-level guard (reads battle.html as text).
//
// Run: node --test tests/suites/ambient-particles-toggle.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'battle.html'),
  'utf8'
);

test('the settings modal exposes an Ambient particles switch bound to the setting', () => {
  assert.ok(/id="sw-ambient-particles"/.test(HTML), 'the sw-ambient-particles switch must exist');
  assert.ok(/applySettingSwitch\('ambientParticles'/.test(HTML),
    'the switch must call applySettingSwitch with the ambientParticles key');
});

test('the switch is registered in the modal sync list so it reflects saved state', () => {
  assert.ok(/\['sw-ambient-particles',\s*'ambientParticles'\]/.test(HTML),
    'sync list must map sw-ambient-particles -> ambientParticles');
});

test('applySettingSwitch has an ambientParticles branch that persists + applies live', () => {
  const i = HTML.indexOf("if (key === 'ambientParticles')");
  assert.ok(i !== -1, 'applySettingSwitch must handle the ambientParticles key');
  const branch = HTML.slice(i, i + 500);
  assert.ok(/settings\.ambientParticles\s*=\s*on/.test(branch), 'branch must set the setting');
  assert.ok(/persistMiscSettings\(\)/.test(branch), 'branch must persist');
  assert.ok(/FxParticles\.clearAll\(\)/.test(branch), 'branch must tear down the live layer on disable');
});
