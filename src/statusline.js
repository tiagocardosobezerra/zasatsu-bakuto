#!/usr/bin/env node
'use strict';

// Claude Code status line. Claude Code hands this command a JSON snapshot of
// the conversation, including the plan's usage limits (`rate_limits`: the
// 5-hour session and the 7-day week). This sends those limits to the
// machine, then prints the status line: the one you had before installing
// (passed as --then, base64), or a short one of our own.

const http = require('node:http');
const { spawn } = require('node:child_process');

const port = Number(process.env.ZASATSU_PORT || process.env.FEVER_PORT) || 4111;
const thenIndex = process.argv.indexOf('--then');
const original = thenIndex > 0 ? decode(process.argv[thenIndex + 1]) : null;

function decode(value) {
  try {
    return JSON.parse(Buffer.from(String(value), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

// A window as the machine wants it, or null.
function windowOf(w) {
  if (!w || typeof w.used_percentage !== 'number') return null;
  return { used: w.used_percentage, resetsAt: typeof w.resets_at === 'number' ? w.resets_at : null };
}

function postUsage(snapshot) {
  const limits = snapshot && snapshot.rate_limits;
  if (!limits) return Promise.resolve();
  const body = Buffer.from(JSON.stringify({
    session: windowOf(limits.five_hour),
    week: windowOf(limits.seven_day),
  }));
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: '/usage', method: 'POST', timeout: 800, headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } },
      (res) => { res.resume(); res.on('end', resolve); },
    );
    req.on('error', resolve);
    req.on('timeout', () => req.destroy());
    req.end(body);
  });
}

function ownLine(snapshot) {
  const limits = (snapshot && snapshot.rate_limits) || {};
  const pct = (w) => (w && typeof w.used_percentage === 'number' ? `${Math.round(w.used_percentage)}%` : '–');
  return `坐殺博徒 · 5h ${pct(limits.five_hour)} · 7d ${pct(limits.seven_day)}`;
}

// Runs the status line you had before, with the same input, and prints it.
function runOriginal(raw) {
  return new Promise((resolve) => {
    // On Windows, Git Bash sets SHELL; use it when it is a real file there,
    // so a bash status line keeps working. Otherwise the system shell.
    const sh = process.env.SHELL;
    const shell = process.platform === 'win32' && sh && require('node:fs').existsSync(sh) ? sh : true;
    let out = '';
    let child;
    try {
      child = spawn(original.command, { shell, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    } catch {
      resolve('');
      return;
    }
    const timer = setTimeout(() => child.kill(), 4000);
    child.stdout.on('data', (d) => (out += d));
    child.on('error', () => resolve(out));
    child.on('close', () => {
      clearTimeout(timer);
      resolve(out);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(raw);
  });
}

const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', async () => {
  const raw = Buffer.concat(chunks);
  let snapshot = null;
  try {
    snapshot = JSON.parse(raw.toString('utf8'));
  } catch {
    /* not JSON: still print a line */
  }
  // Leaves a note of the last call (when, and whether limits came), so
  // `ryoiki status` can tell whether Claude Code runs the status line.
  try {
    const os = require('node:os');
    const path = require('node:path');
    const home = process.env.ZASATSU_HOME || path.join(os.homedir(), '.zasatsu-bakuto');
    require('node:fs').writeFileSync(path.join(home, 'statusline-last.json'), JSON.stringify({ at: new Date().toISOString(), limits: Boolean(snapshot && snapshot.rate_limits) }));
  } catch {
    /* only a note */
  }
  const sent = postUsage(snapshot);
  const line = original && typeof original.command === 'string' ? await runOriginal(raw) : ownLine(snapshot);
  await sent;
  process.stdout.write(line);
  process.exit(0);
});
setTimeout(() => process.exit(0), 5000).unref();
