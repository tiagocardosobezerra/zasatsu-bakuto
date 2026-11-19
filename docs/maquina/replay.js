// Project page only: replays a recording of "ryoiki demo" in place of the
// local server, so the real overlay runs in the browser with no install.
// The recording (demo.json) is the Server-Sent Events stream the server sent
// during one demo session; this file plays it back on the same clock.
(function () {
  'use strict';
  const GAP_MS = 4000;
  let recording = null;
  let timers = [];
  const sources = [];

  // A sample plan usage so the two pies show; real numbers come from the
  // Claude Code status line.
  function sampleUsage() {
    const now = Math.floor(Date.now() / 1000);
    return { type: 'usage', usage: { session: { used: 38, resetsAt: now + 2 * 3600 + 14 * 60 }, week: { used: 61, resetsAt: now + 3 * 86400 }, at: Date.now() } };
  }

  // The recording keeps absolute times (turn start, end of the 4:11 round);
  // shift them so they fall on today's clock.
  let base = 0;
  let shift = 0;
  function rebase(v) {
    if (Array.isArray(v)) return v.map(rebase);
    if (v && typeof v === 'object') {
      const out = {};
      for (const k in v) out[k] = rebase(v[k]);
      return out;
    }
    return typeof v === 'number' && v > 1.6e12 && v < 4e12 ? v + shift : v;
  }

  function deliver(data) {
    const msg = { data: JSON.stringify(rebase(data)) };
    for (const s of sources) if (s.onmessage) s.onmessage(msg);
  }

  function play() {
    timers.forEach(clearTimeout);
    timers = [];
    if (!recording) return;
    const last = recording[recording.length - 1].t;
    shift = Date.now() - base;
    for (const m of recording.slice(1)) timers.push(setTimeout(() => deliver(m.data), m.t));
    timers.push(setTimeout(() => deliver(sampleUsage()), 400));
    timers.push(setTimeout(play, last + GAP_MS));
  }

  class ReplaySource {
    constructor() {
      this.onmessage = null;
      this.onerror = null;
      sources.push(this);
      ready.then(() => {
        deliver(recording[0].data);
        deliver(sampleUsage());
        setTimeout(play, 900);
      });
    }
    close() {}
  }

  const ready = fetch('demo.json').then((r) => r.json()).then((list) => {
    recording = list;
    base = list[1].data.at - list[1].t;
    shift = Date.now() - base;
  });
  const realFetch = window.fetch.bind(window);
  const ok = () => Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
  window.fetch = function (url, opts) {
    const u = String(url);
    if (u === '/demo') { play(); return ok(); }
    if (u.startsWith('/')) return Promise.resolve(new Response('', { status: 404 }));
    return realFetch(url, opts);
  };
  window.EventSource = ReplaySource;

  // Inside the project page (?embed) the page has its own play button: hide
  // the preview bar and let the parent start the demo with sound.
  const query = new URLSearchParams(location.search);
  if (query.has('embed')) {
    // The overlay keeps the machine under 45% of the screen width and 60% of
    // its height, which is right for a desktop and tiny in a page frame.
    // ?fit=1.8 tells it the frame is that many times bigger.
    const fit = Math.min(3, Math.max(1, Number(query.get('fit')) || 1));
    if (fit > 1) {
      const root = () => document.documentElement;
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => root().clientWidth * fit });
      Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => root().clientHeight * fit });
    }
    document.addEventListener('DOMContentLoaded', () => {
      const bar = document.getElementById('preview-bar');
      if (bar) bar.style.display = 'none';
    });
    window.playWithSound = () => {
      const btn = document.getElementById('demo-btn');
      if (btn) btn.click();
    };
  }
})();
