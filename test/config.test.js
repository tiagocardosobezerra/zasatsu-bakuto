'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { migrateHome } = require('../src/config');
const { env } = require('../src/env');

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'zb-home-'));

test('the old ~/.agent-fever folder moves to the new one, settings and custom files included', () => {
  const base = tempDir();
  const from = path.join(base, '.agent-fever');
  const to = path.join(base, '.zasatsu-bakuto');
  fs.mkdirSync(path.join(from, 'custom'), { recursive: true });
  fs.writeFileSync(path.join(from, 'config.json'), '{"layout":"mini"}');
  fs.writeFileSync(path.join(from, 'custom', 'round.mp3'), 'x');
  assert.equal(migrateHome(from, to), true);
  assert.equal(fs.readFileSync(path.join(to, 'config.json'), 'utf8'), '{"layout":"mini"}');
  assert.ok(fs.existsSync(path.join(to, 'custom', 'round.mp3')));
  assert.equal(migrateHome(from, to), false);
});

test('migration never overwrites a folder that already exists', () => {
  const base = tempDir();
  const from = path.join(base, 'old');
  const to = path.join(base, 'new');
  fs.mkdirSync(from);
  fs.mkdirSync(to);
  fs.writeFileSync(path.join(from, 'config.json'), '{"layout":"mini"}');
  fs.writeFileSync(path.join(to, 'config.json'), '{"layout":"compact"}');
  assert.equal(migrateHome(from, to), false);
  assert.equal(fs.readFileSync(path.join(to, 'config.json'), 'utf8'), '{"layout":"compact"}');
});

test('ZASATSU_* variables win; the old FEVER_* names still work', () => {
  const saved = { z: process.env.ZASATSU_PORT, f: process.env.FEVER_PORT };
  try {
    delete process.env.ZASATSU_PORT;
    process.env.FEVER_PORT = '5001';
    assert.equal(env('PORT'), '5001');
    process.env.ZASATSU_PORT = '5002';
    assert.equal(env('PORT'), '5002');
  } finally {
    for (const [k, v] of [['ZASATSU_PORT', saved.z], ['FEVER_PORT', saved.f]]) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
