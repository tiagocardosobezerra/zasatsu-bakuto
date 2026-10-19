'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createLinks } = require('../src/links');
const { createDomainServer } = require('../src/server');

function fakeAppDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-links-'));
  const nested = path.join(dir, 'account', 'org');
  fs.mkdirSync(nested, { recursive: true });
  const write = (name, data) => fs.writeFileSync(path.join(nested, name), typeof data === 'string' ? data : JSON.stringify(data));
  write('local_aaa-1.json', { sessionId: 'local_aaa-1', cliSessionId: 'cli-a', title: 'x' });
  write('local_bbb-2.json', { sessionId: 'local_bbb-2', cliSessionId: 'cli-b', isArchived: true });
  write('local_bad.json', '{ not json');
  write('local_evil.json', { sessionId: 'javascript:alert(1)', cliSessionId: 'cli-evil' });
  write('notes.json', { sessionId: 'local_ccc', cliSessionId: 'cli-c' });
  return dir;
}

test('a Claude Code session id maps to its claude:// link in the desktop app', () => {
  const links = createLinks({ dirs: [fakeAppDir(), path.join(os.tmpdir(), 'zb-missing-dir')] });
  assert.equal(links.linkFor('cli-a'), 'claude://code/continue?session=local_aaa-1');
  assert.equal(links.linkFor('cli-b'), null, 'archived');
  assert.equal(links.linkFor('cli-evil'), null, 'only local_ ids');
  assert.equal(links.linkFor('cli-c'), null, 'only local_*.json files');
  assert.equal(links.linkFor('cli-terminal'), null, 'a conversation the app does not know');
  assert.equal(links.linkFor(undefined), null);
});

test('clicking a conversation line opens it; unknown ids and other web pages cannot', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-open-'));
  const opened = [];
  const pointer = [];
  const seen = [];
  const domain = createDomainServer({
    port: 0,
    configFile: path.join(dir, 'c.json'),
    links: createLinks({ dirs: [fakeAppDir()] }),
    onOpenLink: (link) => opened.push(link),
    onPointer: (over) => pointer.push(over),
    onBroadcast: (m) => seen.push(m),
  });
  const port = await domain.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'cli-a', cwd: '/p/alpha', prompt: 'one' });
    domain.ingest({ hook_event_name: 'UserPromptSubmit', session_id: 'cli-terminal', cwd: '/p/beta', prompt: 'two' });
    const list = seen.filter((m) => m.type === 'sessions').pop().list;
    assert.equal(list.find((s) => s.id === 'cli-a').link, true);
    assert.equal(list.find((s) => s.id === 'cli-terminal').link, false);

    assert.equal((await fetch(`${base}/open?session=cli-a`, { method: 'POST' })).status, 204);
    assert.deepEqual(opened, ['claude://code/continue?session=local_aaa-1']);
    assert.equal((await fetch(`${base}/open?session=cli-terminal`, { method: 'POST' })).status, 404);
    assert.equal((await fetch(`${base}/open?session=cli-a`, { method: 'POST', headers: { Origin: 'https://example.com' } })).status, 403);
    assert.equal(opened.length, 1);

    await fetch(`${base}/pointer?over=1`, { method: 'POST' });
    await fetch(`${base}/pointer?over=0`, { method: 'POST' });
    assert.deepEqual(pointer, [true, false]);
  } finally {
    await domain.close();
  }
});
