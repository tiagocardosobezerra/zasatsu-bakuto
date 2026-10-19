#!/usr/bin/env node
'use strict';

// Claude Code hook entry point. Forwards the hook payload to the local
// Fever server and gets out of the way: it never prints, never blocks and
// always exits 0, even when the server is not running.

const http = require('node:http');

const port = Number(process.env.ZASATSU_PORT || process.env.FEVER_PORT) || 4111;
const chunks = [];

const done = () => process.exit(0);
setTimeout(done, 1500).unref();

process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('error', done);
process.stdin.on('end', () => {
  const body = Buffer.concat(chunks);
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
