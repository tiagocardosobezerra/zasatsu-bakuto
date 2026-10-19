'use strict';

// One machine per conversation. Each Claude Code session gets its own game
// (its own domain, stage and riichi), a stable colour and a name, and the
// overlay shows the session it is following:
//   auto:   the conversation you last sent a message to; it moves on when
//           that one is done or has been quiet for a while, but never in
//           the middle of its 4:11 jackpot round
//   pinned: one session chosen in the tray menu

const { createGame } = require('./game');

const QUIET_MS = 2 * 60 * 1000; // a followed session this quiet can be left
const FORGET_MS = 3 * 60 * 60 * 1000; // sessions idle this long are dropped

// A stable, readable colour per session id.
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

function createSessions({ makeGame = () => createGame(), now = Date.now } = {}) {
  const map = new Map();
  let followed = null;
  let pinned = null;

  function summary(s) {
    const domain = s.game.snapshot().domain;
    const state = domain === 'round' && (s.state === 'working' || s.state === 'riichi') ? 'round' : s.state;
    return { id: s.id, label: s.label, title: s.title, color: s.color, state, lastAt: s.lastAt };
  }

  function get(signal) {
    let s = map.get(signal.session);
    if (!s) {
      s = { id: signal.session, label: signal.label, title: null, color: colorFor(signal.session), state: 'idle', lastAt: now(), game: makeGame() };
      map.set(s.id, s);
    }
    if (signal.label) s.label = signal.label;
    if (signal.title) s.title = signal.title;
    return s;
  }

  function prune() {
    for (const [id, s] of map) {
      if (id !== followed && id !== pinned && now() - s.lastAt > FORGET_MS) map.delete(id);
    }
  }

  // Decide whether the overlay should switch to session `s`.
  function considerFollow(s, signal) {
    if (pinned && map.has(pinned)) {
      if (followed === pinned) return false;
      followed = pinned;
      return true;
    }
    if (!followed || !map.has(followed)) {
      followed = s.id;
      return true;
    }
    if (followed === s.id) return false;
    const current = map.get(followed);
    // The jackpot round is the show: stay until its 4:11 is over.
    if (current.game.snapshot().domain === 'round') return false;
    const leave = signal.kind === 'turn-start' || current.state === 'done' || now() - current.lastAt > QUIET_MS;
    if (leave && signal.kind !== 'turn-end') {
      followed = s.id;
      return true;
    }
    return false;
  }

  function ingest(signal) {
    const s = get(signal);
    const events = s.game.handle(signal);
    if (STATE_BY_KIND[signal.kind]) s.state = STATE_BY_KIND[signal.kind];
    s.lastAt = now();
    const switched = considerFollow(s, signal);
    prune();
    return { session: s, events, switched };
  }

  function tick() {
    const out = [];
    for (const s of map.values()) {
      const events = s.game.tick();
      if (events.length) out.push({ session: s, events });
    }
    return out;
  }

  // 'auto', or a session id to pin. Returns true when the followed session changed.
  function follow(choice) {
    pinned = choice && choice !== 'auto' ? choice : null;
    if (pinned && map.has(pinned) && followed !== pinned) {
      followed = pinned;
      return true;
    }
    return false;
  }

  return {
    ingest,
    tick,
    follow,
    followed: () => (followed && map.get(followed)) || null,
    find: (id) => map.get(id) || null,
    list: () => [...map.values()].sort((a, b) => b.lastAt - a.lastAt).map(summary),
    pinned: () => pinned,
    summary,
  };
}

module.exports = { createSessions, colorFor };
