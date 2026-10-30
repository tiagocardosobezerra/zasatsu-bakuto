#!/usr/bin/env node
'use strict';

// Claude Code hook entry point. Forwards the hook payload to the local
// server and gets out of the way: it never prints, never blocks and
// always exits 0, even when the server is not running.

const http = require('node:http');

const port = Number(process.env.ZASATSU_PORT || process.env.FEVER_PORT) || 4111;
// The machine only reads the end of a tool's output (classify.js reads the
// last 20 000 characters), so a huge test log is cut here: it would
// otherwise be refused for its size and the riichi would never end.
const KEEP_CHARS = 20000;
const chunks = [];

const done = () => process.exit(0);
setTimeout(done, 1500).unref();

function trimmed(raw) {
  if (raw.length <= 2 * KEEP_CHARS) return raw;
  try {
    const payload = JSON.parse(raw.toString('utf8'));
    for (const key of ['tool_response', 'tool_input', 'error']) {
      const value = payload[key];
      if (typeof value === 'string' && value.length > KEEP_CHARS) payload[key] = value.slice(-KEEP_CHARS);
      if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) if (typeof v === 'string' && v.length > KEEP_CHARS) value[k] = v.slice(-KEEP_CHARS);
      }
    }
    return Buffer.from(JSON.stringify(payload));
  } catch {
    return raw;
  }
}

process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('error', done);
process.stdin.on('end', () => {
  const body = trimmed(Buffer.concat(chunks));
  const req = http.request(
    {
      host: '127.0.0.1',
      port,
      path: '/event',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
      timeout: 1000,
    },
    (res) => {
      res.resume();
      res.on('end', done);
    },
  );
  req.on('error', done);
  req.on('timeout', () => req.destroy());
  req.end(body);
});
