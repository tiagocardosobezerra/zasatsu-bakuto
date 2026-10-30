'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createDaily, dayKey, KEEP_DAYS } = require('../src/daily');
const { createSessions, SILENT_MS, WAIT_CAP_MS } = require('../src/sessions');
const { createDomainServer } = require('../src/server');
const { classify } = require('../src/classify');

const DAY = 24 * 60 * 60 * 1000;
function clock(start = new Date(2026, 9, 30, 9).getTime()) {
  let t = start;
  const now = () => t;
  now.advance = (ms) => (t += ms);
  return now;
}
const sig = (kind, extra = {}) => ({ kind, session: 'a', label: 'shop', ...extra });

test('counts the day: turns, tests, builds and time waiting for you', () => {
  const now = clock();
  const daily = createDaily({ now });
  daily.note(sig('turn-start'));
  daily.note(sig('tool-done'));
  daily.note(sig('tool-fail', { check: { type: 'build', passed: false } }));
  daily.note(sig('test-end', { passed: true }));
  daily.note(sig('test-end', { passed: false }));
  daily.note(sig('attention'));
  daily.note(sig('turn-start'), 90 * 1000);
  const { today, week, date } = daily.report();
  assert.equal(date, dayKey(now()));
  assert.deepEqual(
    [today.turns, today.tools, today.toolFails, today.testsGreen, today.testsRed, today.checksRed, today.calls, today.waitMs, today.waits],
    [2, 4, 1, 1, 1, 1, 1, 90000, 1],
  );
  assert.equal(week.turns, 2);
});

test('keeps two weeks, sums the last seven days, and survives a restart', () => {
  const now = clock();
  const daily = createDaily({ now });
  for (let i = 0; i < KEEP_DAYS + 3; i++) {
    daily.note(sig('turn-start'));
    now.advance(DAY);
  }
  const saved = daily.saved();
  assert.equal(Object.keys(saved.days).length, KEEP_DAYS);
  const again = createDaily({ now, saved: JSON.parse(JSON.stringify(saved)) });
  assert.equal(again.report().today.turns, 0, 'a new day starts at zero');
  assert.equal(again.report().week.turns, 6, 'six past days plus today');
  const bad = createDaily({ now, saved: { days: { nope: { turns: 5 }, '2026-01-01': { turns: -1, evil: 9 } } } }).saved().days;
  assert.equal(bad.nope, undefined);
  assert.deepEqual([bad['2026-01-01'].turns, bad['2026-01-01'].evil], [0, undefined]);
});

test('the wait for you runs from "your turn" or the end of a turn to the next work, capped', () => {
  const now = clock();
  const sessions = createSessions({ now });
  sessions.note(sig('turn-start'));
  sessions.note(sig('attention'));
  now.advance(30 * 1000);
  assert.equal(sessions.note(sig('tool-done')).waited, 30 * 1000, 'a permission you granted');
  sessions.note(sig('turn-end'));
  now.advance(3 * 60 * 60 * 1000);
  assert.equal(sessions.note(sig('turn-start')).waited, WAIT_CAP_MS, 'a night away counts as the cap');
  assert.equal(sessions.note(sig('tool-done')).waited, 0);
});

test('a working conversation with no event for a while is marked silent; its turn time shows', () => {
  const now = clock();
  const sessions = createSessions({ now });
  sessions.note(sig('turn-start'));
  const started = now();
  now.advance(60 * 1000);
  sessions.note(sig('tool-start', { detail: 'Bash npm run build' }));
  assert.equal(sessions.list()[0].silent, false);
  assert.equal(sessions.list()[0].turnStartedAt, started);
  now.advance(SILENT_MS);
  assert.equal(sessions.list()[0].silent, true);
  assert.equal(sessions.silentIds(), 'a');
  sessions.note(sig('tool-done'));
  assert.equal(sessions.silentIds(), '');
  sessions.note(sig('turn-end'));
  now.advance(SILENT_MS);
  assert.deepEqual([sessions.list()[0].silent, sessions.list()[0].turnStartedAt], [false, null], 'a finished turn is not silent');
});

test('builds, linters and type checks keep their last result on the line', () => {
  const bash = (event, command) => ({ hook_event_name: event, session_id: 'a', cwd: '/p/shop', tool_name: 'Bash', tool_input: { command } });
  assert.deepEqual(classify(bash('PostToolUse', 'npm run build')).check, { type: 'build', passed: true });
  assert.deepEqual(classify(bash('PostToolUseFailure', 'npx tsc --noEmit')).check, { type: 'types', passed: false });
  assert.deepEqual(classify(bash('PostToolUse', 'npx eslint src')).check, { type: 'lint', passed: true });
  assert.equal(classify(bash('PostToolUse', 'npm test')).check, undefined, 'tests are the riichi, not a check');
  assert.equal(classify(bash('PostToolUse', 'git status')).check, undefined);
  const sessions = createSessions({ now: () => 5 });
  sessions.note(classify(bash('PostToolUseFailure', 'cargo clippy')));
  assert.deepEqual(sessions.list()[0].lastCheck, { type: 'lint', passed: false, at: 5 });
});

test('GET /stats reports the day; it is saved next to the machine', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-stats-'));
  const configFile = path.join(dir, 'c.json');
  const domain = createDomainServer({ port: 0, configFile });
  const port = await domain.listen();
  try {
    domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'a', cwd: '/p/alpha', prompt: 'one' });
    domain.ingest({ hook_event_name: 'PostToolUse', session_id: 'a', cwd: '/p/alpha', tool_name: 'Bash', tool_input: { command: 'npm test' }, tool_response: { stdout: '3 passed' } });
    const stats = await (await fetch(`http://127.0.0.1:${port}/stats`)).json();
    assert.deepEqual([stats.today.turns, stats.today.testsGreen], [1, 1]);
  } finally {
    await domain.close();
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'daily.json'), 'utf8')).days[dayKey(Date.now())].turns, 1);
});
