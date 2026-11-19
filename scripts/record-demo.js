'use strict';

// Records what the server streams during "ryoiki demo" into
// docs/maquina/demo.json, for the live machine on the project page.
// Runs against a throwaway settings folder and takes about 60 seconds.

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.ZASATSU_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'zasatsu-record-'));
const { createDomainServer } = require('../src/server');

const OUT = path.join(__dirname, '..', 'docs', 'maquina', 'demo.json');
const LENGTH_MS = 60000;

(async () => {
  const srv = createDomainServer({ port: 0, links: { linkFor: () => null, has: () => false }, onOpenLink() {} });
  const port = await srv.listen();
  const messages = [];
  let start = null;
  http.get({ host: '127.0.0.1', port, path: '/stream' }, (res) => {
    let buf = '';
    res.on('data', (chunk) => {
      buf += chunk;
      let end;
      while ((end = buf.indexOf('\n\n')) >= 0) {
        const line = buf.slice(0, end).split('\n').find((l) => l.startsWith('data: '));
        buf = buf.slice(end + 2);
        if (line) messages.push({ t: start === null ? 0 : Date.now() - start, data: JSON.parse(line.slice(6)) });
      }
    });
  });
  await new Promise((r) => setTimeout(r, 500));
  start = Date.now();
  srv.runDemo();
  await new Promise((r) => setTimeout(r, LENGTH_MS));
  fs.writeFileSync(OUT, JSON.stringify(messages));
  console.log(`${messages.length} messages written to docs/maquina/demo.json`);
  await srv.close();
  process.exit(0);
})();
