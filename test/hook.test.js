'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createDomainServer } = require('../src/server');

const HOOK = path.join(__dirname, '..', 'src', 'hook.js');

function runHook(payload, port) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [HOOK], { env: { ...process.env, ZASATSU_PORT: String(port) } });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
    child.stdin.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
  });
}

test('a huge test log still ends the riichi: the hook keeps only its end', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-hook-'));
  const domain = createDomainServer({ port: 0, configFile: path.join(dir, 'c.json') });
  const port = await domain.listen();
  try {
    const base = { session_id: 'big', cwd: '/p/shop', tool_name: 'Bash', tool_input: { command: 'npm test' } };
    await runHook({ ...base, hook_event_name: 'PreToolUse' }, port);
    const log = `${'.'.repeat(6 * 1024 * 1024)}\nTests: 1 failed, 40 passed, 41 total\n`;
    const { code, out } = await runHook({ ...base, hook_event_name: 'PostToolUse', tool_response: { stdout: log, stderr: '' } }, port);
    assert.deepEqual([code, out], [0, ''], 'never prints, always exits 0');
    const line = domain.sessions().list.find((s) => s.id === 'big');
    assert.deepEqual(line.lastTest.summary, { passed: 40, failed: 1 });
    assert.equal(line.lastTest.passed, false);
  } finally {
    await domain.close();
  }
});

test('the hook exits 0 quietly when the domain is closed or the input is not JSON', async () => {
  const closed = await runHook({ hook_event_name: 'Stop' }, 1);
  assert.deepEqual([closed.code, closed.out], [0, '']);
  const junk = await runHook('{ not json', 1);
  assert.deepEqual([junk.code, junk.out], [0, '']);
});
