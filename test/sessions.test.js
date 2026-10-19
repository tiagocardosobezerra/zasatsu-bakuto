'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessions, colorFor, ACTIVE_MS } = require('../src/sessions');
const { createMachine } = require('../src/machine');
const { createGame } = require('../src/game');
const { createDomainServer } = require('../src/server');
const { classify } = require('../src/classify');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sig = (session, kind, extra = {}) => ({ kind, session, label: session, ...extra });
const types = (events) => events.map((e) => e.type);
// Scripted randomness: values are consumed in order, then `fallback` repeats.
function rng(values, fallback = 0.5) {
  const queue = [...values];
  return () => (queue.length ? queue.shift() : fallback);
}

test('each conversation keeps its colour, name, state and last action', () => {
  const s = createSessions();
  s.note(sig('a', 'turn-start', { title: 'fix login' }));
  s.note(sig('b', 'tool-done', { title: 'add tests', detail: 'Edit app.js' }));
  const byId = Object.fromEntries(s.list().map((x) => [x.id, x]));
  assert.equal(byId.a.title, 'fix login');
  assert.equal(byId.b.detail, 'Edit app.js');
  assert.equal(byId.b.state, 'working');
  assert.equal(s.list()[0].id, 'b', 'most recent first');
  assert.match(colorFor('a'), /^#[0-9a-f]{6}$/);
  assert.equal(colorFor('a'), colorFor('a'));
});

test('states for the conversation lines', () => {
  const s = createSessions();
  s.note(sig('a', 'test-start'));
  assert.equal(s.list()[0].state, 'riichi');
  s.note(sig('a', 'attention'));
  assert.equal(s.list()[0].state, 'waiting');
  s.note(sig('a', 'turn-end'));
  assert.equal(s.list()[0].state, 'done');
});

test('one machine for every conversation: all of them spin the same reels and totals', () => {
  const m = createMachine({ game: createGame({ random: rng([], 0.99) }) });
  m.handle(sig('a', 'turn-start'));
  m.handle(sig('a', 'tool-done', { tool: 'Read' }));
  m.handle(sig('b', 'turn-start'));
  m.handle(sig('b', 'tool-done', { tool: 'Edit' }));
  assert.equal(m.game.snapshot().stats.spins, 2);
  assert.equal(m.game.snapshot().stats.domains, 1, 'one domain, not one per conversation');
});

test('the domain only closes when no conversation is still working', () => {
  const m = createMachine({ game: createGame({ random: rng([], 0.99) }) });
  m.handle(sig('a', 'turn-start'));
  m.handle(sig('b', 'turn-start'));
  assert.deepEqual(types(m.handle(sig('a', 'turn-end')).events), [], 'b still works');
  assert.equal(m.game.snapshot().domain, 'open');
  assert.ok(types(m.handle(sig('b', 'turn-end')).events).includes('collapse'));
  assert.equal(m.game.snapshot().domain, 'closed');
});

test('one test riichi at a time; tests from another conversation are reserve balls', () => {
  const m = createMachine({ game: createGame({ random: rng([], 0.99) }) });
  m.handle(sig('a', 'turn-start'));
  m.handle(sig('a', 'tool-done', { tool: 'Edit' }));
  assert.ok(types(m.handle(sig('a', 'test-start')).events).includes('riichi'));
  assert.deepEqual(types(m.handle(sig('b', 'test-start')).events), ['hold']);
  assert.deepEqual(types(m.handle(sig('b', 'test-end', { passed: false })).events), ['status'], "b's result does not decide a's riichi");
  assert.ok(types(m.handle(sig('a', 'test-end', { passed: false })).events).includes('miss'));
});

test('a conversation that leaves during its own riichi lets it expire; the domain stays for the others', () => {
  const m = createMachine({ game: createGame({ random: rng([], 0.99) }) });
  m.handle(sig('a', 'turn-start'));
  m.handle(sig('b', 'turn-start'));
  m.handle(sig('a', 'tool-done', { tool: 'Edit' }));
  m.handle(sig('a', 'test-start'));
  assert.deepEqual(types(m.handle(sig('a', 'turn-end')).events), ['miss']);
  assert.equal(m.game.snapshot().domain, 'open');
  assert.ok(types(m.handle(sig('b', 'test-start')).events).includes('riichi'), 'the next tests get their riichi');
});

test('a conversation silent for a long time no longer holds the domain open', () => {
  let t = 0;
  const sessions = createSessions({ now: () => t });
  const m = createMachine({ game: createGame({ random: rng([], 0.99), now: () => t }), sessions });
  m.handle(sig('a', 'turn-start'));
  t += ACTIVE_MS + 1000;
  m.handle(sig('b', 'turn-start'));
  assert.ok(types(m.handle(sig('b', 'turn-end')).events).includes('collapse'));
});

test('the prompt names the conversation when it has no title', () => {
  const c = classify({ hook_event_name: 'UserPromptSubmit', session_id: 'x', cwd: '/p/gestu', prompt: 'Ajuste o layout da aba Vender, as fontes estão grandes demais e quebrando' });
  assert.equal(c.label, 'gestu');
  assert.ok(c.title.startsWith('Ajuste o layout'));
  assert.ok(c.title.length <= 48);
  assert.equal(classify({ hook_event_name: 'UserPromptSubmit', session_id: 'x', session_title: 'Barra de lucro', prompt: 'oi' }).title, 'Barra de lucro');
});

test('events carry who sent them, and every conversation shows up in the lines', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-s-'));
  const seen = [];
  const domain = createDomainServer({ port: 0, configFile: path.join(dir, 'c.json'), onBroadcast: (m) => seen.push(m) });
  domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'b', cwd: '/p/beta', prompt: 'two' });
  domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'a', cwd: '/p/alpha', prompt: 'one' });
  domain.ingest({ hook_event_name: 'Notification', session_id: 'a', cwd: '/p/alpha', message: 'needs permission' });
  const attention = seen.find((m) => m.type === 'attention');
  assert.equal(attention.who.label, 'alpha');
  const last = seen.filter((m) => m.type === 'sessions').pop();
  assert.deepEqual(last.list.map((x) => x.label), ['alpha', 'beta']);
  assert.equal(last.list.find((x) => x.id === 'a').state, 'waiting');
});

test('totals and 確変 survive a restart; a domain in progress does not', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-save-'));
  const configFile = path.join(dir, 'c.json');
  const first = createDomainServer({ port: 0, configFile, makeGame: (saved) => createGame({ saved, random: rng([], 0.99) }) });
  first.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'a', cwd: '/p/alpha', prompt: 'one' });
  first.ingest({ hook_event_name: 'PostToolUse', session_id: 'a', cwd: '/p/alpha', tool_name: 'Read', tool_input: {} });
  const file = path.join(dir, 'machine.json');
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(saved.stats.spins, 1);
  saved.mode = 'increased';
  fs.writeFileSync(file, JSON.stringify(saved));
  const seen = [];
  const second = createDomainServer({ port: 0, configFile, onBroadcast: (m) => seen.push(m) });
  second.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'b', cwd: '/p/beta', prompt: 'two' });
  const expand = seen.find((m) => m.type === 'expand');
  assert.equal(expand.stats.spins, 1);
  assert.equal(expand.mode, 'increased');
  assert.equal(expand.odds, 24);
  assert.equal(expand.domain, 'open', 'a fresh domain, not the one from before');
});

test('one machine per conversation: each has its own totals; the screen follows the one you wrote to', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-each-'));
  const configFile = path.join(dir, 'c.json');
  fs.writeFileSync(configFile, JSON.stringify({ machines: 'each' }));
  const seen = [];
  const domain = createDomainServer({ port: 0, configFile, onBroadcast: (m) => seen.push(m) });
  const ev = (id, name, extra = {}) => ({ hook_event_name: name, session_id: id, cwd: `/p/${id}`, ...extra });
  domain.ingest(ev('a', 'UserPromptSubmit', { prompt: 'one' }));
  domain.ingest(ev('a', 'PostToolUse', { tool_name: 'Read', tool_input: {} }));
  domain.ingest(ev('b', 'UserPromptSubmit', { prompt: 'two' }));
  const hello = seen.filter((m) => m.type === 'hello').pop();
  assert.equal(hello.who.id, 'b', 'you wrote to b: the screen follows it');
  assert.equal(hello.stats.spins, 0, "b's own machine, not a's");
  domain.ingest(ev('a', 'Notification', { message: 'needs permission' }));
  const call = seen.filter((m) => m.type === 'call').pop();
  assert.equal(call.who.id, 'a', 'a is not on screen but still says it needs you');
});

test('switching between one machine and one per conversation updates the screen', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-switch-'));
  const seen = [];
  const domain = createDomainServer({ port: 0, configFile: path.join(dir, 'c.json'), onBroadcast: (m) => seen.push(m) });
  domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'a', cwd: '/p/a', prompt: 'one' });
  domain.ingest({ hook_event_name: 'PostToolUse', session_id: 'a', cwd: '/p/a', tool_name: 'Read', tool_input: {} });
  domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'b', cwd: '/p/b', prompt: 'two' });
  domain.ingest({ hook_event_name: 'PostToolUse', session_id: 'b', cwd: '/p/b', tool_name: 'Read', tool_input: {} });
  domain.setConfig({ machines: 'each' });
  let hello = seen.filter((m) => m.type === 'hello').pop();
  assert.equal(hello.stats.spins, 1, "b's own machine");
  domain.setConfig({ machines: 'shared' });
  hello = seen.filter((m) => m.type === 'hello').pop();
  assert.equal(hello.stats.spins, 2, 'the shared machine counts both');
});
