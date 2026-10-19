'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessions, colorFor } = require('../src/sessions');
const { createFeverServer } = require('../src/server');
const { classify } = require('../src/classify');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sig = (session, kind, extra = {}) => ({ kind, session, label: session, ...extra });

test('each conversation has its own machine, colour and name', () => {
  const s = createSessions();
  s.ingest(sig('a', 'turn-start', { title: 'fix login' }));
  s.ingest(sig('b', 'turn-start', { title: 'add tests' }));
  const byId = Object.fromEntries(s.list().map((x) => [x.id, x]));
  assert.equal(byId.a.title, 'fix login');
  assert.equal(byId.b.title, 'add tests');
  assert.notEqual(s.find('a').game, s.find('b').game);
  assert.match(colorFor('a'), /^#[0-9a-f]{6}$/);
  assert.equal(colorFor('a'), colorFor('a'));
});

test('auto follow moves to the conversation you just wrote to, not to background noise', () => {
  let t = 0;
  const s = createSessions({ now: () => t });
  assert.equal(s.ingest(sig('a', 'turn-start')).switched, true);
  t += 1000;
  assert.equal(s.ingest(sig('b', 'tool-done')).switched, false, 'b is busy but a is still active');
  assert.equal(s.followed().id, 'a');
  t += 1000;
  assert.equal(s.ingest(sig('b', 'turn-start')).switched, true, 'you wrote to b');
  t += 1000;
  s.ingest(sig('b', 'turn-end'));
  assert.equal(s.ingest(sig('a', 'tool-done')).switched, true, 'b is done, a is working');
});

test('a pinned conversation stays on screen', () => {
  const s = createSessions();
  s.ingest(sig('a', 'turn-start'));
  s.ingest(sig('b', 'turn-start'));
  s.follow('a');
  assert.equal(s.followed().id, 'a');
  s.ingest(sig('b', 'turn-start'));
  assert.equal(s.followed().id, 'a');
  s.follow('auto');
  assert.equal(s.pinned(), null);
});

test('states for the session dots', () => {
  const s = createSessions();
  s.ingest(sig('a', 'test-start'));
  assert.equal(s.list()[0].state, 'riichi');
  s.ingest(sig('a', 'attention'));
  assert.equal(s.list()[0].state, 'waiting');
  s.ingest(sig('a', 'turn-end'));
  assert.equal(s.list()[0].state, 'done');
});

test('the prompt names the conversation when it has no title', () => {
  const c = classify({ hook_event_name: 'UserPromptSubmit', session_id: 'x', cwd: '/p/gestu', prompt: 'Ajuste o layout da aba Vender, as fontes estão grandes demais e quebrando' });
  assert.equal(c.label, 'gestu');
  assert.ok(c.title.startsWith('Ajuste o layout'));
  assert.ok(c.title.length <= 48);
  assert.equal(classify({ hook_event_name: 'UserPromptSubmit', session_id: 'x', session_title: 'Barra de lucro', prompt: 'oi' }).title, 'Barra de lucro');
});

test('a conversation that is not on screen still announces it needs you', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fever-s-'));
  const seen = [];
  const fever = createFeverServer({ port: 0, configFile: path.join(dir, 'c.json'), onBroadcast: (m) => seen.push(m) });
  fever.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'a', cwd: '/p/alpha', prompt: 'one' });
  fever.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'b', cwd: '/p/beta', prompt: 'two' });
  fever.ingest({ hook_event_name: 'Notification', session_id: 'a', cwd: '/p/alpha', message: 'needs permission' });
  const call = seen.find((m) => m.type === 'call');
  assert.ok(call, 'call broadcast');
  assert.equal(call.who.label, 'alpha');
  const last = seen.filter((m) => m.type === 'sessions').pop();
  assert.equal(last.followed, 'b');
  assert.equal(last.list.find((x) => x.id === 'a').state, 'waiting');
});
