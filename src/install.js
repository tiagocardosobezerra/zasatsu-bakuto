'use strict';

// Adds/removes our hooks in a Claude Code settings file. Leaves every
// other setting and hook alone; our entries are found by MARKER (or the
// marker used before the rename, so old installs are cleaned up too).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MARKER = '--zasatsu-bakuto';
const LEGACY_MARKERS = ['--agent-fever'];
const TOOL_EVENTS = ['PreToolUse', 'PostToolUse', 'PostToolUseFailure'];
const OTHER_EVENTS = ['SessionStart', 'UserPromptSubmit', 'Notification', 'Stop'];

function defaultSettingsPath() {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

function hookCommand() {
  const hook = path.join(__dirname, 'hook.js').replace(/\\/g, '/');
  return `node "${hook}" ${MARKER}`;
}

// The status line hands the machine the plan's usage limits. A status line
// you already had keeps working: it is wrapped, passed along as --then
// (base64 of the original setting), and put back on uninstall.
function statusLineCommand(original = null) {
  const script = path.join(__dirname, 'statusline.js').replace(/\\/g, '/');
  const then = original ? ` --then ${Buffer.from(JSON.stringify(original)).toString('base64')}` : '';
  return `node "${script}" ${MARKER}${then}`;
}

function isOurStatusLine(statusLine) {
  return Boolean(statusLine && typeof statusLine.command === 'string' && statusLine.command.includes(MARKER));
}

// The status line that was there before ours, if any.
function originalStatusLine(statusLine) {
  if (!isOurStatusLine(statusLine)) return statusLine || null;
  const m = statusLine.command.match(/--then ([A-Za-z0-9+/=]+)/);
  if (!m) return null;
  try {
    return JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function withOurStatusLine(settings) {
  const original = originalStatusLine(settings.statusLine);
  return { ...settings, statusLine: { ...(original || {}), type: 'command', command: statusLineCommand(original) } };
}

function withoutOurStatusLine(settings) {
  if (!isOurStatusLine(settings.statusLine)) return { settings, removed: false };
  const original = originalStatusLine(settings.statusLine);
  const next = { ...settings };
  if (original) next.statusLine = original;
  else delete next.statusLine;
  return { settings: next, removed: true };
}

function readSettings(settingsPath) {
  if (!fs.existsSync(settingsPath)) return { settings: {}, existed: false };
  const text = fs.readFileSync(settingsPath, 'utf8');
  if (!text.trim()) return { settings: {}, existed: true };
  try {
    return { settings: JSON.parse(text), existed: true };
  } catch {
    throw new Error(`${settingsPath} is not valid JSON. Fix it first; nothing was changed.`);
  }
}

function isOurHook(hook) {
  return hook && typeof hook.command === 'string' && [MARKER, ...LEGACY_MARKERS].some((m) => hook.command.includes(m));
}

// Returns a copy of `hooks` without our entries, plus how many were removed.
function stripOurHooks(hooks = {}) {
  let removed = 0;
  const out = {};
  for (const [event, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) {
      out[event] = groups;
      continue;
    }
    const kept = [];
    for (const group of groups) {
      const inner = Array.isArray(group && group.hooks) ? group.hooks : [];
      const rest = inner.filter((h) => !isOurHook(h));
      removed += inner.length - rest.length;
      if (rest.length || !inner.length) kept.push(rest.length === inner.length ? group : { ...group, hooks: rest });
    }
    if (kept.length) out[event] = kept;
  }
  return { hooks: out, removed };
}

function withOurHooks(settings, command = hookCommand()) {
  const { hooks } = stripOurHooks(settings.hooks);
  const handler = { type: 'command', command, async: true, timeout: 5 };
  for (const event of TOOL_EVENTS) (hooks[event] ||= []).push({ matcher: '*', hooks: [handler] });
  for (const event of OTHER_EVENTS) (hooks[event] ||= []).push({ hooks: [handler] });
  return { ...settings, hooks };
}

// Claude Code reads this file all the time: write a copy, then swap it in,
// so a crash or a full disk never leaves it half written.
function write(settingsPath, settings) {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  const tmp = `${settingsPath}.zasatsu-${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(settings, null, 2)}\n`);
  try {
    fs.renameSync(tmp, settingsPath);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

const ourHooksIn = (settings) =>
  Object.values(settings.hooks || {}).flat().flatMap((g) => (g && Array.isArray(g.hooks) ? g.hooks : [])).filter(isOurHook);

function install({ settingsPath = defaultSettingsPath() } = {}) {
  const { settings, existed } = readSettings(settingsPath);
  // The backup is the file as it was before Zasatsu Bakuto touched it:
  // installing again (after an update, say) keeps that one.
  let backupPath = null;
  if (existed) {
    backupPath = `${settingsPath}.zasatsu-bakuto-backup`;
    const clean = !ourHooksIn(settings).length && !isOurStatusLine(settings.statusLine);
    if (clean || !fs.existsSync(backupPath)) fs.copyFileSync(settingsPath, backupPath);
  }
  write(settingsPath, withOurStatusLine(withOurHooks(settings)));
  return { settingsPath, backupPath };
}

function uninstall({ settingsPath = defaultSettingsPath() } = {}) {
  const { settings, existed } = readSettings(settingsPath);
  if (!existed) return { settingsPath, removed: 0 };
  const { hooks, removed } = stripOurHooks(settings.hooks);
  let next = { ...settings, hooks };
  if (!Object.keys(hooks).length) delete next.hooks;
  const status = withoutOurStatusLine(next);
  next = status.settings;
  if (removed || status.removed) write(settingsPath, next);
  return { settingsPath, removed, statusLineRemoved: status.removed };
}

// What "ryoiki status" reports: are our hooks and status line there, and
// do they still point at files that exist (the folder may have moved)?
function inspect({ settingsPath = defaultSettingsPath() } = {}) {
  let settings;
  try {
    settings = readSettings(settingsPath).settings;
  } catch (err) {
    return { settingsPath, error: err.message };
  }
  const ours = ourHooksIn(settings);
  const statusLine = isOurStatusLine(settings.statusLine);
  const scripts = [...ours.map((h) => h.command), statusLine ? settings.statusLine.command : null]
    .filter(Boolean)
    .map((command) => (command.match(/node "([^"]+)"/) || [])[1])
    .filter(Boolean);
  const missing = [...new Set(scripts)].filter((file) => !fs.existsSync(file));
  const legacy = ours.filter((h) => LEGACY_MARKERS.some((m) => h.command.includes(m))).length;
  return { settingsPath, hooks: ours.length, expected: TOOL_EVENTS.length + OTHER_EVENTS.length, statusLine, missing, legacy };
}

module.exports = { install, uninstall, inspect, withOurHooks, stripOurHooks, hookCommand, statusLineCommand, withOurStatusLine, withoutOurStatusLine, MARKER, LEGACY_MARKERS };
