#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');
const { createFeverServer, DEFAULT_PORT } = require('../src/server');
const installer = require('../src/install');

const [command = 'help', ...rest] = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const option = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

const HELP = `
  ryoiki — 領域展開 · 坐殺博徒 (Zasatsu Bakuto, Idle Death Gamble)
  Kinji Hakari's domain, played by your AI coding agent.

  ryoiki tenkai       領域展開 Domain Expansion: open the overlay (tray icon, click-through)
  ryoiki kaijo        領域解除 close the domain: quit the overlay
  ryoiki install      add the hooks to ~/.claude/settings.json (backup is kept)
  ryoiki uninstall    remove the hooks
  ryoiki demo         play a scripted agent session on the open domain
  ryoiki guide        遊び方 how to play: what every effect on the machine means
  ryoiki settings     open the settings page (size, what appears, sound)
  ryoiki status       is the domain open?
  ryoiki serve        server only; add http://127.0.0.1:${DEFAULT_PORT}/ to OBS as a browser source

  options
    --settings <file> use another Claude Code settings file (e.g. .claude/settings.json)
    --foreground      keep "ryoiki tenkai" attached to this terminal
    FEVER_PORT=<n>    change the port (default ${DEFAULT_PORT})
`;

const NOT_OPEN = 'The domain is not open. Open it with "ryoiki tenkai" (or "ryoiki serve").';

async function isRunning() {
  try {
    const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/health`, { signal: AbortSignal.timeout(800) });
    return ['zasatsu-bakuto', 'agent-fever'].includes((await res.json()).app);
  } catch {
    return false;
  }
}

async function main() {
  switch (command) {
    case 'tenkai':
    case 'start': {
      if (await isRunning()) return console.log('領域展開 · The domain is already open.');
      let electron;
      try {
        electron = require('electron');
      } catch {
        console.error('Electron is missing. Run "npm install" in the zasatsu-bakuto folder, or use "ryoiki serve".');
        process.exit(1);
      }
      const main = path.join(__dirname, '..', 'src', 'electron-main.js');
      const foreground = flag('foreground');
      const child = spawn(electron, [main], {
        stdio: foreground ? 'inherit' : 'ignore',
        detached: !foreground,
        windowsHide: true,
      });
      if (!foreground) {
        child.unref();
        console.log('領域展開 坐殺博徒 · Domain Expansion: Idle Death Gamble. Look for the tray icon; try "ryoiki demo".');
      }
      return;
    }

    case 'kaijo':
    case 'stop': {
      if (!(await isRunning())) return console.log('The domain is already closed.');
      const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/quit`, { method: 'POST' }).catch(() => null);
      if (!res || !res.ok) {
        console.error('Could not close the domain. Quit it from the tray icon.');
        process.exit(1);
      }
      return console.log('領域解除 · The domain is closed.');
    }

    case 'serve': {
      const fever = createFeverServer({ log: (line) => console.log(line) });
      try {
        const port = await fever.listen();
        console.log(`Zasatsu Bakuto server on http://127.0.0.1:${port}/  (preview: http://127.0.0.1:${port}/?preview)`);
      } catch (err) {
        console.error(err.code === 'EADDRINUSE' ? `Port ${DEFAULT_PORT} is busy. Is the domain already open?` : err.message);
        process.exit(1);
      }
      return;
    }

    case 'demo': {
      if (!(await isRunning())) {
        console.error(NOT_OPEN);
        process.exit(1);
      }
      await fetch(`http://127.0.0.1:${DEFAULT_PORT}/demo`, { method: 'POST' });
      return console.log('Demo session playing (about 55 seconds).');
    }

    case 'install': {
      const result = installer.install({ settingsPath: option('settings') });
      console.log(`Hooks added to ${result.settingsPath}`);
      if (result.backupPath) console.log(`Backup: ${result.backupPath}`);
      return console.log('New Claude Code sessions will play the machine. Open the domain with "ryoiki tenkai".');
    }

    case 'uninstall': {
      const result = installer.uninstall({ settingsPath: option('settings') });
      return console.log(result.removed ? `Removed ${result.removed} hooks from ${result.settingsPath}` : 'No Zasatsu Bakuto hooks found.');
    }

    case 'settings':
    case 'guide': {
      const page = command === 'guide' ? 'guide.html' : 'settings.html';
      if (!(await isRunning())) {
        console.error(NOT_OPEN);
        process.exit(1);
      }
      // The desktop app opens its own window; with "ryoiki serve" use the browser.
      const res = await fetch(`http://127.0.0.1:${DEFAULT_PORT}/window?name=${command}`, { method: 'POST' }).catch(() => null);
      if (res && res.ok) return console.log(`Opened the ${command} window.`);
      const url = `http://127.0.0.1:${DEFAULT_PORT}/${page}`;
      const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]];
      spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
      return console.log(url);
    }

    case 'status':
      return console.log((await isRunning()) ? `領域展開 · The domain is open on port ${DEFAULT_PORT}.` : '領域解除 · The domain is closed.');

    default:
      return console.log(HELP);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
