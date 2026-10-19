'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createFeverServer } = require('../src/server');
const { clean, merge, DEFAULTS } = require('../src/config');

test('settings drop unknown keys and clamp values', () => {
  const c = clean({ scale: 9, opacity: 0, intro: 'nope', jackpot: 'compact', evil: 1, show: { stats: false, x: 1 }, sound: { volume: 3, music: false } });
  assert.equal(c.scale, 2);
  assert.equal(c.opacity, 0.3);
  assert.equal(c.intro, DEFAULTS.intro);
  assert.equal(c.jackpot, 'compact');
  assert.equal(c.evil, undefined);
  assert.equal(c.show.stats, false);
  assert.equal(c.show.x, undefined);
  assert.deepEqual(c.sound, { volume: 1, effects: true, music: false, voice: true });
  assert.equal(merge(c, { show: { ticker: false } }).show.stats, false);
});

test('POST /config saves settings; other web pages are refused', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fever-cfg-'));
  const configFile = path.join(dir, 'config.json');
  const fever = createFeverServer({ port: 0, configFile });
  const port = await fever.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    const res = await fetch(`${base}/config`, { method: 'POST', body: JSON.stringify({ position: 'tl', sound: { volume: 0.3 } }) });
    const saved = await res.json();
    assert.equal(saved.position, 'tl');
    assert.equal(JSON.parse(fs.readFileSync(configFile, 'utf8')).sound.volume, 0.3);
    assert.equal((await (await fetch(`${base}/config`)).json()).position, 'tl');

    const evil = await fetch(`${base}/config`, { method: 'POST', headers: { Origin: 'https://example.com' }, body: '{"position":"br"}' });
    assert.equal(evil.status, 403);
    const own = await fetch(`${base}/config`, { method: 'POST', headers: { Origin: base }, body: '{"position":"br"}' });
    assert.equal(own.status, 200);
    assert.equal((await fetch(`${base}/preview?kind=bogus`, { method: 'POST' })).status, 400);
  } finally {
    await fever.close();
  }
});

test('layouts, discreet mode and the smaller size range are kept', () => {
  const c = clean({ layout: 'mini', discreet: true, scale: 0.3, intro: 'smart', motion: 'full' });
  assert.deepEqual([c.layout, c.discreet, c.scale, c.intro, c.motion], ['mini', true, 0.3, 'smart', 'full']);
  assert.equal(clean({ layout: 'huge', scale: 0.1 }).layout, 'normal');
  assert.equal(clean({ scale: 0.1 }).scale, 0.3);
});

test('POST /quit closes the domain ("ryoiki kaijo"); other web pages cannot', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fever-quit-'));
  let quits = 0;
  const fever = createFeverServer({ port: 0, configFile: path.join(dir, 'c.json'), onQuit: () => { quits += 1; } });
  const port = await fever.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    const evil = await fetch(`${base}/quit`, { method: 'POST', headers: { Origin: 'https://example.com' } });
    assert.equal(evil.status, 403);
    assert.equal((await fetch(`${base}/quit`, { method: 'POST' })).status, 204);
    await new Promise((r) => setTimeout(r, 120));
    assert.equal(quits, 1);
    assert.equal((await (await fetch(`${base}/health`)).json()).app, 'zasatsu-bakuto');
  } finally {
    await fever.close();
  }
});

test('custom files come from both folders; the first folder wins on a name clash', () => {
  const { customFiles } = require('../src/server');
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-ca-'));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-cb-'));
  fs.writeFileSync(path.join(a, 'round.mp3'), 'a');
  fs.writeFileSync(path.join(b, 'round.mp3'), 'b');
  fs.writeFileSync(path.join(b, 'intro.png'), 'b');
  fs.writeFileSync(path.join(b, 'notes.txt'), 'b');
  const found = customFiles([a, b, path.join(a, 'missing')]);
  assert.deepEqual([...found.keys()].sort(), ['intro.png', 'round.mp3']);
  assert.equal(found.get('round.mp3'), path.join(a, 'round.mp3'));
});
