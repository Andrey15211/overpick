/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const heroes = require('../src/data/heroes.json');
const meta = require('../src/data/meta.json');

const VALID_TIERS = new Set(['S', 'A', 'B', 'C', 'D']);

test('each hero has exactly one meta tier entry', () => {
  const metaCounts = new Map();

  for (const entry of meta.heroes) {
    assert.ok(VALID_TIERS.has(entry.tier), `Invalid tier ${entry.tier} for ${entry.heroId}`);
    metaCounts.set(entry.heroId, (metaCounts.get(entry.heroId) ?? 0) + 1);
  }

  for (const hero of heroes) {
    assert.equal(metaCounts.get(hero.id), 1, `Expected exactly one meta entry for ${hero.id}`);
  }

  for (const [heroId, count] of metaCounts.entries()) {
    assert.ok(heroes.some((hero) => hero.id === heroId), `Unknown meta hero ${heroId}`);
    assert.equal(count, 1, `Duplicate meta entries found for ${heroId}`);
  }
});
