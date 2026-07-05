/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIRS = ['src/app', 'src/components', 'src/data', 'src/styles'];
const RAW_COLOR_PATTERN = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i;
const TRANSITION_ALL_PATTERN = /transition(?:-property)?\s*:\s*all\b/i;
const OVERFLOW_X_HIDDEN_PATTERN = /overflow-x\s*:\s*hidden\b/i;
const REQUIRED_TOKEN_PREFIXES = [
  '--color-',
  '--font-',
  '--space-',
  '--text-',
  '--ease-',
  '--dur-',
  '--radius-',
  '--rule-',
];

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function readTextFiles() {
  return SOURCE_DIRS.flatMap((dir) => walkFiles(path.join(ROOT, dir)))
    .filter((filePath) => /\.(css|json)$/.test(filePath))
    .map((filePath) => ({
      filePath,
      relativePath: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
      text: fs.readFileSync(filePath, 'utf8'),
    }));
}

test('application styles and data use design tokens instead of raw colors', () => {
  const offenders = readTextFiles()
    .filter(({ text }) => RAW_COLOR_PATTERN.test(text))
    .map(({ relativePath }) => relativePath);

  assert.deepEqual(offenders, [], `Raw color literals belong in tokens.css only: ${offenders.join(', ')}`);
});

test('motion and responsive CSS avoid broad unsafe declarations', () => {
  const transitionOffenders = readTextFiles()
    .filter(({ text }) => TRANSITION_ALL_PATTERN.test(text))
    .map(({ relativePath }) => relativePath);
  const overflowOffenders = readTextFiles()
    .filter(({ text }) => OVERFLOW_X_HIDDEN_PATTERN.test(text))
    .map(({ relativePath }) => relativePath);

  assert.deepEqual(
    transitionOffenders,
    [],
    `Use explicit transition-property values instead of transition: all: ${transitionOffenders.join(', ')}`,
  );
  assert.deepEqual(
    overflowOffenders,
    [],
    `Use overflow-x: clip or layout fixes instead of hiding horizontal overflow: ${overflowOffenders.join(', ')}`,
  );
});

test('tokens.css remains the portable design-token source', () => {
  const tokenFile = fs.readFileSync(path.join(ROOT, 'tokens.css'), 'utf8');

  assert.ok(tokenFile.startsWith('/* Hallmark'), 'tokens.css must keep its Hallmark stamp as the first line');

  for (const prefix of REQUIRED_TOKEN_PREFIXES) {
    assert.ok(tokenFile.includes(prefix), `tokens.css must include ${prefix} tokens`);
  }
});
