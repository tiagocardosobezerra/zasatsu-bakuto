'use strict';

// Local event bus. Hooks POST raw payloads to /event, overlays subscribe to
// /stream (Server-Sent Events). Bound to 127.0.0.1 only.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { classify } = require('./classify');
const { createGame } = require('./game');
const { createMachine } = require('./machine');
const { createLinks } = require('./links');
const { demoScript, previewScript, seeded, DEMO_SEED } = require('./demo');
const settings = require('./config');
const { env } = require('./env');

const DEFAULT_PORT = Number(env('PORT')) || 4111;
const MAX_BODY = 5 * 1024 * 1024;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CUSTOM_DIR = env('CUSTOM_DIR') || path.join(settings.HOME, 'custom');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const MAX_CONFIG_BODY = 64 * 1024;
// Media people may add to the custom folder.
const CUSTOM_MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
};

function customFiles() {
  try {
    return fs.readdirSync(CUSTOM_DIR).filter((name) => CUSTOM_MIME[path.extname(name).toLowerCase()]);
  } catch {
    return [];
  }
}

// Hands a claude:// link to the operating system (used by "ryoiki serve").
function openExternal(link) {
  const { spawn } = require('node:child_process');
  const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', link]] : [process.platform === 'darwin' ? 'open' : 'xdg-open', [link]];
  spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
}

// The machine saved by an earlier run, if any.
function readSaved(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function createDomainServer({
  port = DEFAULT_PORT,
  log = () => {},
  configFile = settings.CONFIG_FILE,
  machineFile = path.join(path.dirname(configFile), 'machine.json'),
  onBroadcast = () => {},
  onOpenWindow = null, // set by the desktop app: opens its settings / guide window
  onQuit = () => process.exit(0), // "ryoiki kaijo"; the desktop app quits Electron instead
  makeGame = (saved) => createGame({ saved }),
  links = createLinks(),
  onOpenLink = openExternal, // opens a claude:// link to a conversation
  onPointer = () => {}, // the desktop app lets clicks through while the pointer is over a line
} = {}) {
  const clients = new Set();
  let config = settings.load(configFile);
  // One machine for every conversation; its totals and 確変/時短 survive restarts.
  const machine = createMachine({ game: makeGame(readSaved(machineFile)) });
  const { sessions } = machine;
  let lastSaved = JSON.stringify(machine.game.saved());

  function persist() {
    const now = JSON.stringify(machine.game.saved());
    if (now === lastSaved) return;
    lastSaved = now;
    try {
      fs.mkdirSync(path.dirname(machineFile), { recursive: true });
      fs.writeFileSync(machineFile, `${now}\n`);
    } catch (err) {
      log(`could not save the machine: ${err.message}`);
    }
  }

  function broadcast(message) {
    onBroadcast(message);
    const data = `data: ${JSON.stringify(message)}\n\n`;
    for (const res of clients) res.write(data);
  }

  const resolveTimers = new Set();
  // While the demo plays it gets its own seeded machine; real hook events
  // still reach the real machine but are not shown until the demo ends.
  let demoGame = null;
  const shown = () => demoGame || machine.game;

  // Who an event came from, for the overlay's conversation lines.
  const whoOf = (s) => (s ? { id: s.id, label: s.label, title: s.title, color: s.color } : null);
  let lastWho = null;

  function sessionsMessage() {
    return { type: 'sessions', list: sessions.list().map((s) => ({ ...s, link: links.has(s.id) })) };
  }

  function hello() {
    return { ...shown().snapshot(), config, who: demoGame ? null : lastWho, sessions: sessionsMessage() };
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
          if (source === machine.game) persist();
        }, e.resolveIn);
        resolveTimers.add(timer);
      }
    }
    return events;
  }

  function ingest(payload) {
    const signal = classify(payload);
    if (!signal) return [];
    const { session, events } = machine.handle(signal);
    lastWho = whoOf(session);
    if (demoGame) {
      // The demo has the screen; a conversation that needs you still says so.
      for (const e of events) if (e.type === 'attention') broadcast({ type: 'call', who: lastWho, detail: e.detail });
    } else {
      emit(events, machine.game, lastWho);
    }
    persist();
    broadcast(sessionsMessage());
    return events;
  }

  const ticker = setInterval(() => {
    const events = machine.tick();
    if (events.length) {
      emit(events, machine.game, lastWho);
      persist();
      broadcast(sessionsMessage());
    }
    if (demoGame) emit(demoGame.tick(), demoGame);
  }, 1000);
  ticker.unref();

  // Plays a scripted session on its own machine, then hands the overlay
  // back to the real one.
  let demoTimers = [];
  function play(demo, steps, tailMs) {
    demoTimers.forEach(clearTimeout);
    demoGame = demo;
    broadcast({ ...demo.snapshot(), config, who: null, sessions: sessionsMessage() });
    demoTimers = steps.map(({ delay, payload }) => setTimeout(() => emit(demo.handle(classify(payload)), demo), delay));
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
    const demo = createGame({ random: () => 0.99, pickSymbol: () => 7 });
    play(demo, previewScript(kind), kind === 'jackpot' ? 9000 : 4000);
  }

  function setConfig(patch) {
    config = settings.merge(config, patch);
    try {
      settings.save(config, configFile);
    } catch (err) {
      log(`could not save settings: ${err.message}`);
    }
    broadcast({ type: 'config', config });
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

    // Click on a conversation line: open that conversation in the Claude app.
    if (req.method === 'POST' && url.pathname === '/open') {
      const link = links.linkFor(url.searchParams.get('session'));
      if (!link) return res.writeHead(404).end();
      onOpenLink(link);
      return res.writeHead(204).end();
    }

    if (req.method === 'POST' && url.pathname === '/pointer') {
      onPointer(url.searchParams.get('over') === '1');
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
      return res.end(JSON.stringify({ files: customFiles(), dir: CUSTOM_DIR }));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/custom/')) {
      const name = path.basename(decodeURIComponent(url.pathname.slice('/custom/'.length)));
      if (!customFiles().includes(name)) return res.writeHead(404).end();
      res.writeHead(200, { 'Content-Type': CUSTOM_MIME[path.extname(name).toLowerCase()] });
      return fs.createReadStream(path.join(CUSTOM_DIR, name)).pipe(res);
    }

    if (req.method === 'GET' && url.pathname === '/icon.png') {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
      return fs.createReadStream(path.join(PUBLIC_DIR, 'app-icon.png')).pipe(res);
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

module.exports = { createDomainServer, DEFAULT_PORT };
