'use strict';

// Renders public/icon-render.js (the hand sign icon) to PNG files:
//   public/app-icon.png  used by the tray, the windows and the pages
//   docs/icon.png        shown in the README
// Run with: npm run icon

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { app, BrowserWindow, nativeImage } = require('electron');
const { createDomainServer } = require('../src/server');

const root = path.join(__dirname, '..');
// Own profile folder, so this works while the overlay is open.
app.setPath('userData', path.join(os.tmpdir(), 'zasatsu-icon-render'));

app.whenReady().then(async () => {
  const server = createDomainServer({ port: 0, configFile: path.join(os.tmpdir(), 'zasatsu-icon-config.json') });
  const port = await server.listen();
  const win = new BrowserWindow({ show: false, width: 300, height: 300 });
  try {
    await win.loadURL(`http://127.0.0.1:${port}/icon.html`);
    const dataUrl = await win.webContents.executeJavaScript('window.renderIcon(512)');
    const big = nativeImage.createFromDataURL(dataUrl);
    const png = big.resize({ width: 256, height: 256, quality: 'best' }).toPNG();
    fs.writeFileSync(path.join(root, 'public', 'app-icon.png'), png);
    fs.writeFileSync(path.join(root, 'docs', 'icon.png'), png);
    console.log('Wrote public/app-icon.png and docs/icon.png');
  } finally {
    win.destroy();
    await server.close();
    app.quit();
  }
});
