'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
function load() {
  const sandbox = { window: {}, navigator: { languages: ['pt-BR'], language: 'pt-BR' } };
  vm.runInNewContext(read('i18n.js'), sandbox);
  vm.runInNewContext(read('lines.js'), sandbox);
  return { lines: sandbox.window.DomainLines, i18n: sandbox.window.DomainI18n };
}

test('the turn timer reads at a glance', () => {
  const { lines } = load();
  assert.equal(lines.elapsed(20 * 1000), '<1m');
  assert.equal(lines.elapsed(4 * 60 * 1000), '4m');
  assert.equal(lines.elapsed(83 * 60 * 1000), '1h23');
  assert.equal(lines.elapsed(-5), '<1m', 'a clock a little off never shows a negative time');
});

test('a line shows the real test, check and context results', () => {
  const { lines } = load();
  // Arrays made inside the sandbox are copied out, so deepEqual compares values.
  const texts = (s) => Array.from(lines.chips(s), (c) => `${c.result}:${c.text}`);
  assert.deepEqual(texts({ lastTest: { passed: true, summary: { passed: 12, failed: 0 } } }), ['pass:✓ 12']);
  assert.deepEqual(texts({ lastTest: { passed: false, summary: { passed: 11, failed: 1 } } }), ['fail:✗ 1/12']);
  assert.deepEqual(texts({ lastTest: { passed: false, summary: null } }), ['fail:✗']);
  assert.deepEqual(texts({ lastTest: { passed: null } }), ['unknown:?']);
  assert.deepEqual(texts({ lastCheck: { type: 'types', passed: true } }), ['pass:tsc ✓']);
  assert.deepEqual(texts({ context: 49 }), [], 'context only shows once it matters');
  assert.deepEqual(texts({ context: 60 }), ['unknown:ctx 60%']);
  assert.deepEqual(texts({ context: 85, lastCheck: { type: 'build', passed: false } }), ['fail:build ✗', 'fail:ctx 85%']);
});

test('every chip has its tooltip in every language', () => {
  const { lines, i18n } = load();
  const all = [
    lines.testChip({ passed: true }), lines.testChip({ passed: false }), lines.testChip({ passed: null }),
    lines.checkChip({ type: 'lint', passed: true }), lines.checkChip({ type: 'lint', passed: false }), lines.contextChip(90),
  ];
  for (const lang of i18n.LANGS) {
    i18n.setLang(lang);
    for (const { key } of all) {
      const { ja, tr } = i18n.t(key);
      assert.notEqual(ja, key, `missing key ${key}`);
      assert.ok(tr, `missing ${lang} for ${key}`);
    }
    for (const key of ['testsGreenMiss', 'testsUnknown', 'stSilent']) assert.ok(i18n.t(key, { m: 5 }).tr, `missing ${lang} for ${key}`);
  }
});
