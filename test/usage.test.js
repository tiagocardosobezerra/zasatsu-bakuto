'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { install, uninstall } = require('../src/install');
const { createDomainServer } = require('../src/server');

const STATUSLINE = path.join(__dirname, '..', 'src', 'statusline.js');
const later = (h) => Math.floor(Date.now() / 1000) + h * 3600;

function tempSettings(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-sl-'));
  const file = path.join(dir, 'settings.json');
  if (content !== undefined) fs.writeFileSync(file, JSON.stringify(content));
  return file;
}
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function runStatusLine(args, input, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [STATUSLINE, ...args], { env: { ...process.env, ...env } });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('close', () => resolve(out));
    child.stdin.end(JSON.stringify(input));
  });
}

test('install adds our status line; uninstall removes it', () => {
  const file = tempSettings({ model: 'opus' });
  install({ settingsPath: file });
  assert.match(read(file).statusLine.command, /statusline\.js" --zasatsu-bakuto$/);
  uninstall({ settingsPath: file });
  assert.equal(read(file).statusLine, undefined);
  assert.equal(read(file).model, 'opus');
});

test('a status line you already had is kept, wrapped, and given back on uninstall', () => {
  const mine = { type: 'command', command: 'bash ~/.claude/my-line.sh', padding: 2 };
  const file = tempSettings({ statusLine: mine });
  install({ settingsPath: file });
  install({ settingsPath: file });
  const wrapped = read(file).statusLine;
  assert.match(wrapped.command, /--then /, 'yours runs inside ours');
  assert.equal(wrapped.padding, 2);
  assert.equal((wrapped.command.match(/--then/g) || []).length, 1, 'installing twice does not wrap twice');
  uninstall({ settingsPath: file });
  assert.deepEqual(read(file).statusLine, mine);
});

test('the status line sends the plan usage to the machine and prints a line', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-sl-srv-'));
  const seen = [];
  const domain = createDomainServer({ port: 0, configFile: path.join(dir, 'c.json'), onBroadcast: (m) => seen.push(m) });
  const port = await domain.listen();
  try {
    const input = { session_id: 'x', rate_limits: { five_hour: { used_percentage: 42.4, resets_at: later(2) }, seven_day: { used_percentage: 18, resets_at: later(80) } } };
    const out = await runStatusLine(['--zasatsu-bakuto'], input, { ZASATSU_PORT: String(port) });
    assert.equal(out, '坐殺博徒 · 5h 42% · 7d 18%');
    const usage = domain.usage();
    assert.equal(usage.session.used, 42.4);
    assert.equal(usage.week.used, 18);
    assert.ok(seen.some((m) => m.type === 'usage'));

    const original = Buffer.from(JSON.stringify({ type: 'command', command: 'node -e "process.stdout.write(\'minha linha\')"' })).toString('base64');
    const wrappedOut = await runStatusLine(['--zasatsu-bakuto', '--then', original], input, { ZASATSU_PORT: String(port), SHELL: '' });
    assert.equal(wrappedOut, 'minha linha', 'your own status line is what Claude Code shows');
  } finally {
    await domain.close();
  }
});

test('usage outside the plan limits, or already reset, is ignored', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-usage-'));
  const domain = createDomainServer({ port: 0, configFile: path.join(dir, 'c.json') });
  const port = await domain.listen();
  const post = (body, headers = {}) => fetch(`http://127.0.0.1:${port}/usage`, { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    assert.equal((await post({ session: { used: 'lots' } })).status, 400);
    assert.equal((await post({ session: { used: 50, resetsAt: Math.floor(Date.now() / 1000) - 60 } })).status, 400, 'that window already reset');
    assert.equal((await post({ week: { used: 30, resetsAt: later(10) } }, { Origin: 'https://example.com' })).status, 403);
    assert.equal((await post({ week: { used: 30, resetsAt: later(10) } })).status, 204);
    assert.deepEqual(domain.usage().session, null);
    assert.equal(domain.usage().week.used, 30);
  } finally {
    await domain.close();
  }
});
