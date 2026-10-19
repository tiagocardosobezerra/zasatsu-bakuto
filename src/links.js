'use strict';

// Links from a conversation line to that conversation in the Claude desktop
// app. Hooks only know Claude Code's own session id; the desktop app keeps
// one small JSON file per conversation (claude-code-sessions/**/local_*.json)
// with its own id ("sessionId", local_…) and Claude Code's ("cliSessionId").
// Only those two fields are read, and only to build
// claude://code/continue?session=local_…, the link the app itself offers.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const LOCAL_ID = /^local_[A-Za-z0-9-]{1,64}$/;
const MAX_FILE = 2 * 1024 * 1024;
const RESCAN_MS = 5000;
const MAX_DEPTH = 4;

// Where the desktop app keeps its conversations on this computer.
function defaultDirs() {
  const home = os.homedir();
  const dirs = [];
  if (process.platform === 'win32') {
    const roaming = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    dirs.push(path.join(roaming, 'Claude', 'claude-code-sessions'));
    // The Microsoft Store version keeps its files in its package folder.
    const packages = path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'Packages');
    try {
      for (const name of fs.readdirSync(packages)) {
        if (name.startsWith('Claude_')) dirs.push(path.join(packages, name, 'LocalCache', 'Roaming', 'Claude', 'claude-code-sessions'));
      }
    } catch {
      /* no packages folder */
    }
  } else if (process.platform === 'darwin') {
    dirs.push(path.join(home, 'Library', 'Application Support', 'Claude', 'claude-code-sessions'));
  } else {
    dirs.push(path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'Claude', 'claude-code-sessions'));
  }
  return dirs;
}

function createLinks({ dirs = defaultDirs(), now = Date.now } = {}) {
  let byCli = new Map(); // Claude Code session id -> desktop app id
  let scannedAt = -Infinity;

  function walk(dir, depth, found) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth < MAX_DEPTH) walk(full, depth + 1, found);
      } else if (entry.isFile() && /^local_.*\.json$/.test(entry.name)) {
        try {
          if (fs.statSync(full).size > MAX_FILE) continue;
          const { sessionId, cliSessionId, isArchived } = JSON.parse(fs.readFileSync(full, 'utf8'));
          if (typeof cliSessionId === 'string' && LOCAL_ID.test(sessionId) && !isArchived) found.set(cliSessionId, sessionId);
        } catch {
          /* unreadable or being written: skip */
        }
      }
    }
  }

  function scan() {
    const found = new Map();
    for (const dir of dirs) walk(dir, 0, found);
    byCli = found;
    scannedAt = now();
  }

  // The link for a Claude Code session id, or null when the desktop app
  // does not know it (a conversation in a terminal, for example).
  function linkFor(cliId) {
    if (typeof cliId !== 'string' || !cliId) return null;
    if (!byCli.has(cliId) && now() - scannedAt > RESCAN_MS) scan();
    const local = byCli.get(cliId);
    return local ? `claude://code/continue?session=${encodeURIComponent(local)}` : null;
  }

  return { linkFor, has: (cliId) => linkFor(cliId) !== null };
}

module.exports = { createLinks, defaultDirs };
