'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { SCENARIOS } = require('../src/game');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');

function loadI18n(language) {
  const sandbox = { window: {}, navigator: { languages: [language], language } };
  vm.runInNewContext(read('i18n.js'), sandbox);
  return sandbox.window.FeverI18n;
}

test('translation follows the computer language, Japanese stays first', () => {
  const pt = loadI18n('pt-BR');
  assert.equal(pt.lang(), 'pt');
  assert.deepEqual({ ...pt.t('jackpot') }, { ja: '大当たり!!', tr: 'Jackpot!' });
  assert.equal(pt.t('consec', { n: 3 }).tr, 'Pseudo-consecutivo ×3');
  assert.equal(loadI18n('de-DE').lang(), 'en');
  assert.equal(loadI18n('ja-JP').lang(), null);
  const ja = loadI18n('ja-JP');
  assert.equal(ja.t('riichi').tr, '');
  pt.setLang('es');
  assert.equal(pt.t('miss').tr, 'Fallo…');
});

test('every key the overlay uses exists in every language', () => {
  const src = read('overlay.js');
  const keys = new Set();
  for (const re of [/\b(?:say|i18n\.t)\('([a-zA-Z0-9]+)'/g, /\bi18n\.put\([^,]+,\s*'([a-zA-Z0-9]+)'/g, /\bshowPop\('[a-z]+',\s*'([a-zA-Z0-9]+)'/g, /\bsetCabinet\([^,]+,\s*'([a-zA-Z0-9]+)'/g]) {
    for (const m of src.matchAll(re)) keys.add(m[1]);
  }
  for (const m of src.matchAll(/(?:badge|stage|key|fromKey|toKey): '([a-zA-Z0-9]+)'/g)) keys.add(m[1]);
  for (const m of src.matchAll(/\b(?:red|gold|rainbow): '([a-zA-Z0-9]+)'/g)) keys.add(m[1]);
  for (const id of Object.keys(SCENARIOS)) keys.add(id).add(`${id}Win`).add(`${id}Lose`);
  assert.ok(keys.size > 40, `found ${keys.size} keys`);
  const i18n = loadI18n('en');
  for (const lang of i18n.LANGS) {
    i18n.setLang(lang);
    for (const key of keys) {
      const { ja, tr } = i18n.t(key);
      assert.notEqual(ja, key, `missing key ${key}`);
      assert.ok(tr, `missing ${lang} for ${key}`);
    }
  }
});
