import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Dex } from '@pkmn/sim';

for (const catalog of ['species', 'moves', 'items', 'abilities']) {
  test(`every shipped ${catalog} entry resolves in the pinned battle engine`, () => {
    const entries = JSON.parse(readFileSync(new URL(`../../data/${catalog}.json`, import.meta.url), 'utf8'));
    const names = new Set(Object.values(entries)
      .flatMap(generation => Object.entries(generation).map(([id, entry]) => entry.name || id)));
    assert.ok(names.size > 0);
    const missing = [...names].filter(name => !Dex[catalog].get(name).exists);
    assert.deepEqual(missing, []);
  });
}
