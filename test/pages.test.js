'use strict';

// Every page of the app must read fully in each language: the settings page,
// the guide (glossary included) and the overlay's own fixed text.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
const LANGS = ['en', 'pt', 'es'];

// Pulls the `const TEXT = {...};` table out of a page script.
function textTable(file) {
  const src = read(file);
  const start = src.indexOf('const TEXT = {');
  assert.ok(start >= 0, `${file} has a TEXT table`);
  let depth = 0;
  let end = start + 'const TEXT = '.length;
  for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    if (src[end] === '}' && --depth === 0) break;
  }
  return vm.runInNewContext(`(${src.slice(start + 'const TEXT = '.length, end + 1)})`);
}

test('settings page: every label exists in every language', () => {
  const html = read('settings.html');
  const js = read('settings.js');
  const keys = new Set();
  for (const m of html.matchAll(/data-t(?:-html|-label)?="([a-zA-Z]+)"/g)) keys.add(m[1]);
  for (const m of js.matchAll(/words\.([a-zA-Z]+)/g)) keys.add(m[1]);
  assert.ok(keys.size > 50, `${keys.size} keys`);
  const TEXT = textTable('settings.js');
  for (const lang of LANGS) {
    for (const key of keys) assert.ok(TEXT[lang][key], `settings: ${lang} is missing "${key}"`);
  }
});

test('guide: same steps and the whole glossary in every language', () => {
  const TEXT = textTable('guide.js');
  const ref = TEXT.en;
  for (const lang of LANGS) {
    const t = TEXT[lang];
    for (const key of ['title', 'sub', 'intro', 'when', 'glossary', 'foot']) assert.ok(t[key], `guide: ${lang} is missing ${key}`);
    assert.equal(t.steps.length, ref.steps.length, `guide: ${lang} steps`);
    t.steps.forEach((step, i) => {
      assert.equal(step.jp, ref.steps[i].jp);
      assert.ok(step.name && step.when && step.body.length, `guide: ${lang} step ${i + 1}`);
    });
    assert.equal(t.terms.length, ref.terms.length, `guide: ${lang} glossary length`);
    t.terms.forEach((term, i) => {
      assert.equal(term[0], ref.terms[i][0], 'same Japanese term');
      assert.ok(term[2], `guide: ${lang} glossary meaning for ${term[0]}`);
    });
  }
});

test('overlay: no fixed English text in the page itself', () => {
  const html = read('index.html');
  const body = html.slice(html.indexOf('<body>'), html.indexOf('<script src="overlay.js">'));
  const allowed = /^(Admiring You|CR|Ver\.|1\/239|\d+|[×♪\s·]+)$/;
  const texts = [...body.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean);
  for (const t of texts) {
    if (!/[A-Za-z]{3,}/.test(t)) continue;
    const words = t.replace(/[♪·]/g, ' ').split(/\s+/).filter((w) => /[A-Za-z]{3,}/.test(w));
    for (const w of words) assert.ok(/^(Admiring|You|Ver)$/.test(w) || allowed.test(w), `untranslated text in overlay: "${t}"`);
  }
});

test('smaller layouts never hide just the translation of something they show', () => {
  const css = read('overlay.css');
  const offenders = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    if (/layout-(compact|mini)/.test(selector) && /\.tr\b/.test(selector) && /display:\s*none/.test(m[2])) offenders.push(selector);
  }
  assert.deepEqual(offenders, []);
});
