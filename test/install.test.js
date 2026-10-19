'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, uninstall, MARKER } = require('../src/install');

function tempSettings(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fever-'));
  const file = path.join(dir, 'settings.json');
  if (content !== undefined) fs.writeFileSync(file, JSON.stringify(content));
  return file;
}
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const feverCount = (settings) =>
  Object.values(settings.hooks || {}).flat().flatMap((g) => g.hooks).filter((h) => h.command.includes(MARKER)).length;

const existing = {
  model: 'opus',
  hooks: {
    PostToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command: 'prettier --write' }] }],
  },
};

test('install keeps other settings and hooks, and is idempotent', () => {
  const file = tempSettings(existing);
  const { backupPath } = install({ settingsPath: file });
  install({ settingsPath: file });
  const settings = read(file);
  assert.equal(settings.model, 'opus');
  assert.equal(settings.hooks.PostToolUse[0].hooks[0].command, 'prettier --write');
  assert.equal(feverCount(settings), 7);
  assert.equal(settings.hooks.Stop[0].matcher, undefined);
  assert.equal(settings.hooks.PreToolUse[0].matcher, '*');
  assert.equal(settings.hooks.PreToolUse[0].hooks[0].async, true);
  assert.ok(fs.existsSync(backupPath));
});

test('uninstall removes only our hooks', () => {
  const file = tempSettings(existing);
  install({ settingsPath: file });
  assert.equal(uninstall({ settingsPath: file }).removed, 7);
  assert.deepEqual(read(file), existing);
});

test('install creates a missing settings file', () => {
  const file = tempSettings();
  install({ settingsPath: file });
  assert.equal(feverCount(read(file)), 7);
});

test('install refuses to touch invalid JSON', () => {
  const file = tempSettings();
  fs.writeFileSync(file, '{ nope');
  assert.throws(() => install({ settingsPath: file }), /not valid JSON/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{ nope');
});

test('hooks from before the rename (--agent-fever) are replaced, not doubled', () => {
  const legacy = { type: 'command', command: 'node "/old/src/hook.js" --agent-fever', async: true };
  const file = tempSettings({ hooks: { Stop: [{ hooks: [legacy] }], PreToolUse: [{ matcher: '*', hooks: [legacy] }] } });
  install({ settingsPath: file });
  const all = Object.values(read(file).hooks).flat().flatMap((g) => g.hooks);
  assert.equal(all.filter((h) => h.command.includes('--agent-fever')).length, 0);
  assert.equal(feverCount(read(file)), 7);
  assert.equal(uninstall({ settingsPath: file }).removed, 7);
  assert.equal(read(file).hooks, undefined);
});
