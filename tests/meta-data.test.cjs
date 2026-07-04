/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const heroes = require('../src/data/heroes.json');
const meta = require('../src/data/meta.json');
const patches = require('../src/data/patches.json');

const VALID_TIERS = new Set(['S', 'A', 'B', 'C', 'D']);
const VALID_CHANGE_TYPES = new Set(['buff', 'nerf', 'rework', 'map', 'system']);

function assertFiniteRate(value, label) {
  assert.equal(typeof value, 'number', `${label} must be a number`);
  assert.ok(Number.isFinite(value), `${label} must be finite`);
  assert.ok(value >= 0 && value <= 100, `${label} must be between 0 and 100`);
}

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

test('meta snapshot has current source and numeric rates', () => {
  assert.match(meta.lastUpdated, /^\d{4}-\d{2}-\d{2}$/, 'lastUpdated must be an ISO date');
  assert.ok(Array.isArray(meta.sources), 'sources must be an array');
  assert.ok(meta.sources.length > 0, 'sources must not be empty');
  assert.ok(
    meta.sources.some((source) => source.startsWith('Blizzard Hero Statistics:')),
    'sources must include the live Blizzard Hero Statistics crawl',
  );
  assert.equal(new Set(meta.sources).size, meta.sources.length, 'sources must not contain duplicates');

  for (const entry of meta.heroes) {
    assertFiniteRate(entry.pickRate, `${entry.heroId}.pickRate`);
    assertFiniteRate(entry.winRate, `${entry.heroId}.winRate`);
    assert.equal(typeof entry.whyMeta, 'string', `${entry.heroId}.whyMeta must be a string`);
    assert.ok(entry.whyMeta.includes(`${entry.tier}-тир`), `${entry.heroId}.whyMeta must mention its tier`);
  }
});

test('patch data references known heroes and valid change types', () => {
  const heroIds = new Set(heroes.map((hero) => hero.id));
  const patchIds = new Set();

  for (const patch of patches) {
    assert.equal(typeof patch.patchId, 'string', 'patchId must be a string');
    assert.ok(!patchIds.has(patch.patchId), `Duplicate patch id ${patch.patchId}`);
    patchIds.add(patch.patchId);
    assert.match(patch.date, /^\d{4}-\d{2}-\d{2}$/, `${patch.patchId}.date must be an ISO date`);
    assert.ok(Array.isArray(patch.changes), `${patch.patchId}.changes must be an array`);

    for (const change of patch.changes) {
      assert.ok(VALID_CHANGE_TYPES.has(change.type), `Invalid change type ${change.type} in ${patch.patchId}`);
      if (change.heroId) {
        assert.ok(heroIds.has(change.heroId), `Unknown hero ${change.heroId} in ${patch.patchId}`);
      }
      assert.equal(typeof change.description, 'string', `${patch.patchId} change description must be a string`);
      assert.ok(change.description.trim().length > 0, `${patch.patchId} change description must not be empty`);
    }
  }
});
