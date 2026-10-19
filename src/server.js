'use strict';

// Local event bus. Hooks POST raw payloads to /event, overlays subscribe to
// /stream (Server-Sent Events). Bound to 127.0.0.1 only.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { classify } = require('./classify');
const { createGame } = require('./game');
const { createSessions } = require('./sessions');
const { demoScript, previewScript, seeded, DEMO_SEED } = require('./demo');
const settings = require('./config');
const { env } = require('./env');
const { iconPNG } = require('./icon');

const DEFAULT_PORT = Number(env('PORT')) || 4111;
const MAX_BODY = 5 * 1024 * 1024;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
// Your own art and music: ~/.zasatsu-bakuto/custom (or $ZASATSU_CUSTOM_DIR),
// then a custom/ folder next to the code (git-ignored). The first one wins
// when both have a file with the same name.
const CUSTOM_DIRS = [env('CUSTOM_DIR') || path.join(settings.HOME, 'custom'), path.join(__dirname, '..', 'custom')];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const MAX_CONFIG_BODY = 64 * 1024;
// Media people may add to the custom folder.
const CUSTOM_MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
};

// name -> full path of every usable file in the custom folders.
function customFiles(dirs = CUSTOM_DIRS) {
  const found = new Map();
  for (const dir of dirs) {
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (CUSTOM_MIME[path.extname(name).toLowerCase()] && !found.has(name)) found.set(name, path.join(dir, name));
    }
  }
  return found;
}

function createFeverServer({
  port = DEFAULT_PORT,
  log = () => {},
  configFile = settings.CONFIG_FILE,
  onBroadcast = () => {},
  onOpenWindow = null, // set by the desktop app: opens its settings / guide window
  onQuit = () => process.exit(0), // "ryoiki kaijo"; the desktop app quits Electron instead
  sessions = createSessions(),
} = {}) {
  const clients = new Set();
  let config = settings.load(configFile);
  sessions.follow(config.follow);
  // Shown when no conversation has talked to us yet.
  const idleGame = createGame();
  // The desktop app renders the brush-lettered icon and hands it over here.
  let brushIcon = null;

  function broadcast(message) {
    onBroadcast(message);
    const data = `data: ${JSON.stringify(message)}\n\n`;
    for (const res of clients) res.write(data);
  }

  const resolveTimers = new Set();
  // While the demo plays it gets its own seeded machine; real hook events
  // still reach the real machine but are not shown until the demo ends.
  let demoGame = null;
  const followedGame = () => (sessions.followed() ? sessions.followed().game : idleGame);
  const shown = () => demoGame || followedGame();

  // Who an event belongs to, for the overlay's identity line.
  const whoOf = (s) => (s ? { id: s.id, label: s.label, title: s.title, color: s.color } : null);

  function sessionsMessage() {
    const f = sessions.followed();
    return { type: 'sessions', followed: f ? f.id : null, pinned: sessions.pinned(), list: sessions.list() };
  }

  function hello() {
    return { ...shown().snapshot(), config, who: demoGame ? null : whoOf(sessions.followed()), sessions: sessionsMessage() };
  }

  // Resolve timers fire later; they always emit through the game that asked.
  function emit(events, source = shown(), who = null) {
    if (source !== shown()) return events;
    for (const e of events) {
      log(`${e.type.padEnd(9)} ${e.label}${e.detail ? ` · ${e.detail}` : ''}`);
      broadcast(who ? { ...e, who } : e);
      if (e.resolveIn) {
        const timer = setTimeout(() => {
          resolveTimers.delete(timer);
          emit(source.resolve(e.token), source, who);
        }, e.resolveIn);
        resolveTimers.add(timer);
      }
    }
    return events;
  }

  function ingest(payload) {
    const signal = classify(payload);
    if (!signal) return [];
    const { session, events, switched } = sessions.ingest(signal);
    const who = whoOf(session);
    if (switched && !demoGame) broadcast({ ...hello(), type: 'hello' });
    if (session === sessions.followed()) emit(events, session.game, who);
    // A conversation that is not on screen still gets to say it needs you.
    if (session !== sessions.followed() || demoGame) {
      for (const e of events) if (e.type === 'attention') broadcast({ type: 'call', who, detail: e.detail });
    }
    broadcast(sessionsMessage());
    return events;
  }

  const ticker = setInterval(() => {
    let changed = false;
    for (const { session, events } of sessions.tick()) {
      changed = true;
      emit(events, session.game, whoOf(session));
    }
    if (changed) broadcast(sessionsMessage());
    if (demoGame) emit(demoGame.tick(), demoGame);
  }, 1000);
  ticker.unref();

  // Plays a scripted session on its own machine, then hands the overlay
  // back to the real one.
  let demoTimers = [];
  function play(machine, steps, tailMs) {
    demoTimers.forEach(clearTimeout);
    demoGame = machine;
    broadcast({ ...machine.snapshot(), config, who: null, sessions: sessionsMessage() });
    demoTimers = steps.map(({ delay, payload }) => setTimeout(() => emit(machine.handle(classify(payload)), machine), delay));
    const end = steps[steps.length - 1].delay + tailMs;
    demoTimers.push(setTimeout(() => {
      demoGame = null;
      broadcast({ ...hello(), type: 'hello' });
    }, end));
  }

  function runDemo() {
    play(createGame({ random: seeded(DEMO_SEED) }), demoScript(), 4000);
  }

  // Short previews for the settings page: the Domain Expansion, or a
  // guaranteed jackpot.
  function runPreview(kind) {
    const machine = createGame({ random: () => 0.99, pickSymbol: () => 7 });
    play(machine, previewScript(kind), kind === 'jackpot' ? 9000 : 4000);
  }

  function setConfig(patch) {
    config = settings.merge(config, patch);
    try {
      settings.save(config, configFile);
    } catch (err) {
      log(`could not save settings: ${err.message}`);
    }
    broadcast({ type: 'config', config });
    if (patch && 'follow' in patch) {
      sessions.follow(config.follow);
      if (!demoGame) broadcast({ ...hello(), type: 'hello' });
      broadcast(sessionsMessage());
    }
    return config;
  }

  // Requests from web pages other than our own are refused: a random site
  // must not be able to drive the overlay. Hooks send no Origin header.
  function foreign(req) {
    const origin = req.headers.origin;
    if (!origin) return false;
    try {
      const { hostname } = new URL(origin);
      return hostname !== '127.0.0.1' && hostname !== 'localhost';
    } catch {
      return true;
    }
  }

  function readJson(req, limit, done) {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) req.destroy();
      else chunks.push(chunk);
    });
    req.on('end', () => {
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      } catch {
        body = undefined;
      }
      done(body);
    });
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && foreign(req)) return res.writeHead(403).end();

    if (req.method === 'POST' && url.pathname === '/event') {
      return readJson(req, MAX_BODY, (body) => {
        if (!body) return res.writeHead(400).end();
        ingest(body);
        res.writeHead(204).end();
      });
    }

    if (req.method === 'POST' && url.pathname === '/demo') {
      runDemo();
      return res.writeHead(204).end();
    }

    if (req.method === 'POST' && url.pathname === '/window') {
      const name = url.searchParams.get('name');
      if (!['settings', 'guide'].includes(name)) return res.writeHead(400).end();
      if (!onOpenWindow) return res.writeHead(404).end();
      onOpenWindow(name);
      return res.writeHead(204).end();
    }

    if (req.method === 'POST' && url.pathname === '/quit') {
      res.writeHead(204).end();
      return setTimeout(onQuit, 50);
    }

    if (req.method === 'POST' && url.pathname === '/preview') {
      const kind = url.searchParams.get('kind');
      if (!['expand', 'jackpot'].includes(kind)) return res.writeHead(400).end();
      runPreview(kind);
      return res.writeHead(204).end();
    }

    if (url.pathname === '/config') {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(config));
      }
      if (req.method === 'POST') {
        return readJson(req, MAX_CONFIG_BODY, (body) => {
          if (!body) return res.writeHead(400).end();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(setConfig(body)));
        });
      }
    }

    if (req.method === 'GET' && url.pathname === '/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`data: ${JSON.stringify(hello())}\n\n`);
      clients.add(res);
      const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);
      req.on('close', () => {
        clearInterval(keepAlive);
        clients.delete(res);
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/custom/manifest.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ files: [...customFiles().keys()], dir: CUSTOM_DIRS[0], dirs: CUSTOM_DIRS }));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/custom/')) {
      const name = path.basename(decodeURIComponent(url.pathname.slice('/custom/'.length)));
      const file = customFiles().get(name);
      if (!file) return res.writeHead(404).end();
      res.writeHead(200, { 'Content-Type': CUSTOM_MIME[path.extname(name).toLowerCase()] });
      return fs.createReadStream(file).pipe(res);
    }

    if (req.method === 'GET' && url.pathname === '/icon.png') {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
      return res.end(brushIcon || iconPNG(64));
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ app: 'zasatsu-bakuto', clients: clients.size }));
    }

    if (req.method === 'GET') {
      const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const full = path.join(PUBLIC_DIR, file);
      if (!full.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
        return res.writeHead(404).end();
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
      return fs.createReadStream(full).pipe(res);
    }

    res.writeHead(405).end();
  });

  return {
    server,
    ingest,
    runDemo,
    runPreview,
    setConfig,
    setIcon: (png) => { brushIcon = png; },
    sessions: () => sessionsMessage(),
    config: () => config,
    listen: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server.address().port));
      }),
    close: () =>
      new Promise((resolve) => {
        demoTimers.forEach(clearTimeout);
        resolveTimers.forEach(clearTimeout);
        clearInterval(ticker);
        for (const res of clients) res.end();
        server.close(() => resolve());
      }),
  };
}

module.exports = { createFeverServer, customFiles, DEFAULT_PORT };
