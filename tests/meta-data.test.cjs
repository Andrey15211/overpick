/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const heroes = require('../src/data/heroes.json');
const meta = require('../src/data/meta.json');
const patches = require('../src/data/patches.json');

const VALID_TIERS = new Set(['S', 'A', 'B', 'C', 'D']);
const VALID_CHANGE_TYPES = new Set(['buff', 'nerf', 'rework', 'map', 'system']);
const ALLOWED_PORTRAIT_HOSTS = new Set([
  'd15f34w2p8l1cc.cloudfront.net',
  'blz-contentstack-images.akamaized.net',
]);
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_META_AGE_DAYS = 10;

function assertFiniteRate(value, label) {
  assert.equal(typeof value, 'number', `${label} must be a number`);
  assert.ok(Number.isFinite(value), `${label} must be finite`);
  assert.ok(value >= 0 && value <= 100, `${label} must be between 0 and 100`);
}

function dateOnlyUtcMs(isoDate) {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  assert.ok(match, `${isoDate} must be an ISO date`);

  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function todayUtcMs() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
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

test('meta tier colors are design-token references', () => {
  for (const tier of VALID_TIERS) {
    const tierInfo = meta.tiers[tier];

    assert.ok(tierInfo, `Missing tier info for ${tier}`);
    assert.equal(tierInfo.color, `var(--color-tier-${tier.toLowerCase()})`, `${tier}.color must use the tier token`);
    assert.equal(typeof tierInfo.description, 'string', `${tier}.description must be a string`);
    assert.ok(tierInfo.description.trim().length > 0, `${tier}.description must not be empty`);
  }
});

test('meta snapshot is fresh enough for weekly sync cadence', () => {
  const snapshotAgeDays = Math.floor((todayUtcMs() - dateOnlyUtcMs(meta.lastUpdated)) / DAY_MS);

  assert.ok(snapshotAgeDays >= -1, `meta.lastUpdated ${meta.lastUpdated} must not be more than one day in the future`);
  assert.ok(
    snapshotAgeDays <= MAX_META_AGE_DAYS,
    `meta.lastUpdated ${meta.lastUpdated} is ${snapshotAgeDays} days old; weekly sync should keep it under ${MAX_META_AGE_DAYS} days`,
  );
});

test('hero portraits use image hosts configured for next/image', () => {
  for (const hero of heroes) {
    assert.equal(typeof hero.portrait, 'string', `${hero.id}.portrait must be a string`);
    const url = new URL(hero.portrait);
    assert.equal(url.protocol, 'https:', `${hero.id}.portrait must use https`);
    assert.ok(ALLOWED_PORTRAIT_HOSTS.has(url.hostname), `${hero.id}.portrait uses unsupported host ${url.hostname}`);
  }
});

test('Season 3 new hero Shion is present with official role and meta data', () => {
  const shion = heroes.find((hero) => hero.id === 'shion');
  const shionMeta = meta.heroes.find((entry) => entry.heroId === 'shion');

  assert.ok(shion, 'Expected Shion in heroes.json');
  assert.equal(shion.nameRu, 'Сион');
  assert.equal(shion.role, 'Damage');
  assert.equal(shion.subrole, 'Flanker');
  assert.ok(shion.portrait.includes('/overwatch/'), 'Shion portrait should use a Blizzard hero portrait asset');

  assert.ok(shionMeta, 'Expected Shion in meta.json');
  assert.equal(shionMeta.tier, 'A');
  assert.ok(shionMeta.pickRate > 0, 'Shion pick rate should come from Blizzard Hero Statistics');
  assert.ok(shionMeta.whyMeta.includes('Сион'), 'Shion meta explanation should use the Russian official name');
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
