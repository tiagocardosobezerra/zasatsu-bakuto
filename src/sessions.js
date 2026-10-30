'use strict';

// The conversations playing the machine. There is one machine for all of
// them (see machine.js); this keeps what the overlay's conversation lines
// show: a stable colour, the project and title, what each one is doing,
// its last action, how long its turn has run, whether it went silent, its
// last real test and build/lint results and how full its context is.

const ACTIVE_MS = 15 * 60 * 1000; // a conversation silent this long no longer holds the domain open
const FORGET_MS = 3 * 60 * 60 * 1000; // conversations idle this long are dropped
const SILENT_MS = 5 * 60 * 1000; // a working conversation with no event this long may be stuck
const WAIT_CAP_MS = 60 * 60 * 1000; // a wait longer than this is you being away, counted as this

// A stable, readable colour per conversation id.
function colorFor(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const s = 0.75;
  const l = 0.62;
  const k = (n) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const STATE_BY_KIND = {
  'session-start': 'idle',
  'turn-start': 'working',
  'tool-start': 'working',
  'tool-done': 'working',
  'tool-fail': 'working',
  'test-start': 'riichi',
  'test-end': 'working',
  attention: 'waiting',
  'turn-end': 'done',
};
const BUSY = new Set(['working', 'riichi', 'waiting']);

function createSessions({ now = Date.now } = {}) {
  const map = new Map();
  let seq = 0; // orders conversations that act in the same millisecond

  function summary(s) {
    return {
      id: s.id,
      label: s.label,
      title: s.title,
      color: s.color,
      state: s.state,
      detail: s.detail,
      lastAt: s.lastAt,
      turnStartedAt: s.turnStartedAt || null,
      silent: silent(s),
      lastTest: s.lastTest || null,
      lastCheck: s.lastCheck || null,
      context: s.context ?? null,
    };
  }

  // Working, but nothing has happened for a while: a long command, or stuck.
  function silent(s) {
    return (s.state === 'working' || s.state === 'riichi') && now() - s.lastAt >= SILENT_MS;
  }

  // Records what a conversation just did and returns it.
  function note(signal) {
    let s = map.get(signal.session);
    if (!s) {
      s = { id: signal.session, label: signal.label, title: null, color: colorFor(signal.session), state: 'idle', detail: null, lastAt: now() };
      map.set(s.id, s);
    }
    if (signal.label) s.label = signal.label;
    if (signal.title) s.title = signal.title;
    // How long the agent sat waiting for you: from "your turn" (a permission
    // or a question) or the end of its turn, to when it works again.
    const working = STATE_BY_KIND[signal.kind] === 'working' || STATE_BY_KIND[signal.kind] === 'riichi';
    s.waited = 0;
    if (working && s.waitingSince) {
      s.waited = Math.min(now() - s.waitingSince, WAIT_CAP_MS);
      s.waitingSince = null;
    }
    if ((signal.kind === 'attention' || signal.kind === 'turn-end') && !s.waitingSince) s.waitingSince = now();
    if (signal.kind === 'turn-start' || (!s.turnStartedAt && STATE_BY_KIND[signal.kind] === 'working')) s.turnStartedAt = now();
    if (signal.kind === 'turn-end') s.turnStartedAt = null;
    if (STATE_BY_KIND[signal.kind]) s.state = STATE_BY_KIND[signal.kind];
    if (signal.detail && signal.kind !== 'attention') s.detail = signal.detail;
    // The last test run's real result, whatever the machine made of it: a
    // riichi can miss on green tests, and tests from a conversation that
    // does not own the riichi play no riichi at all.
    if (signal.kind === 'test-end') s.lastTest = { passed: signal.passed ?? null, summary: signal.summary || null, at: now() };
    if (signal.check) s.lastCheck = { ...signal.check, at: now() };
    s.lastAt = now();
    s.seq = ++seq;
    for (const [id, other] of map) if (now() - other.lastAt > FORGET_MS) map.delete(id);
    return s;
  }

  // Conversations still in the middle of a turn, other than `except`.
  function busy(except) {
    return [...map.values()].filter((s) => s.id !== except && BUSY.has(s.state) && now() - s.lastAt < ACTIVE_MS);
  }

  // The share of the context window in use, from the status line.
  function setContext(id, used) {
    const s = map.get(id);
    if (!s || !Number.isFinite(used)) return false;
    const next = Math.max(0, Math.min(100, Math.round(used)));
    if (s.context === next) return false;
    s.context = next;
    return true;
  }

  return {
    note,
    busy,
    setContext,
    silentIds: () => [...map.values()].filter(silent).map((s) => s.id).sort().join(','),
    find: (id) => map.get(id) || null,
    list: () => [...map.values()].sort((a, b) => b.lastAt - a.lastAt || b.seq - a.seq).map(summary),
    summary,
  };
}

module.exports = { createSessions, colorFor, ACTIVE_MS, SILENT_MS, WAIT_CAP_MS };
