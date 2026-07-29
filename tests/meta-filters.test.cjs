/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const heroes = require('../src/data/heroes.json');
const meta = require('../src/data/meta.json');

const DEFAULT_FILTERS = {
  input: 'pc',
  gameMode: 'competitive',
  rankTier: 'all',
  map: 'all-maps',
  region: 'europe',
};

function loadMetaFiltersModule() {
  const sourcePath = path.join(__dirname, '..', 'src', 'data', 'metaFilters.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require(id) {
      if (id.startsWith('@/types/')) return {};
      return require(id);
    },
  };
  sandbox.exports = sandbox.module.exports;

  vm.runInNewContext(compiled.outputText, sandbox, { filename: sourcePath });
  return sandbox.module.exports;
}

const { computeFilteredMeta } = loadMetaFiltersModule();
const heroRoleById = new Map(heroes.map((hero) => [hero.id, hero.role]));

function compute(filters = {}) {
  return computeFilteredMeta(meta.heroes, heroRoleById, {
    ...DEFAULT_FILTERS,
    ...filters,
  });
}

function byHeroId(rows, heroId) {
  const row = rows.find((entry) => entry.heroId === heroId);
  assert.ok(row, `Expected computed meta row for ${heroId}`);
  return row;
}

test('computeFilteredMeta handles an empty meta snapshot', () => {
  const rows = computeFilteredMeta([], heroRoleById, DEFAULT_FILTERS);

  assert.ok(Array.isArray(rows));
  assert.equal(rows.length, 0);
});

test('computed meta scores are finite and sorted by final score', () => {
  const rows = compute();

  assert.equal(rows.length, meta.heroes.length);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    assert.ok(Number.isFinite(row.finalScore), `${row.heroId}.finalScore must be finite`);
    assert.ok(row.finalScore >= 0 && row.finalScore <= 1, `${row.heroId}.finalScore must stay in score range`);

    if (index > 0) {
      assert.ok(
        rows[index - 1].finalScore >= row.finalScore,
        `${rows[index - 1].heroId} should rank before ${row.heroId}`,
      );
    }
  }
});

test('Junker Queen keeps her expert signal while live tier may change', () => {
  const queen = byHeroId(compute(), 'junkerqueen');

  assert.equal(queen.signals.expertTier, 'B');
  assert.ok(['S', 'A', 'B', 'C', 'D'].includes(queen.tier));
  assert.equal(queen.sourceTier, queen.tier);
});

test('map filters move brawl specialists in the expected direction', () => {
  const kingsRowQueen = byHeroId(compute({ map: 'kings-row' }), 'junkerqueen');
  const circuitQueen = byHeroId(compute({ map: 'circuit-royal' }), 'junkerqueen');

  assert.ok(
    kingsRowQueen.finalScore > circuitQueen.finalScore,
    'Junker Queen should score higher on a brawl map than on a long-range map',
  );
});

test('Season 3 Shion keeps her expert signal in computed meta', () => {
  const shion = byHeroId(compute(), 'shion');

  assert.equal(heroRoleById.get(shion.heroId), 'Damage');
  assert.equal(shion.signals.expertTier, 'A');
  assert.ok(['S', 'A', 'B', 'C', 'D'].includes(shion.tier));
  assert.equal(shion.sourceTier, shion.tier);
});
