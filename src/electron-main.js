'use strict';

// Desktop shell: runs the server in-process and shows the overlay in
// a transparent, click-through, always-on-top window over the primary
// display. Everything else (game, visuals) is shared with `ryoiki serve`.

const { app, BrowserWindow, Menu, Tray, nativeImage, screen } = require('electron');
const { createFeverServer } = require('./server');
const { drawIcon } = require('./icon');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let tray = null;
let win = null;
let fever = null;
let serverPort = null;

// The slot machine icon, at 1x and 2x for crisp tray and window icons.
function appIcon(size) {
  const image = nativeImage.createEmpty();
  for (const scaleFactor of [1, 2]) {
    const n = size * scaleFactor;
    const bitmap = nativeImage.createFromBitmap(drawIcon(n, 'bgra'), { width: n, height: n });
    image.addRepresentation({ scaleFactor, width: n, height: n, buffer: bitmap.toPNG() });
  }
  return image;
}

// Render the brush-lettered icon (public/icon-render.js) in a hidden window,
// then use it for the tray, the settings window and the pages' favicon.
let iconImage = null;
async function renderBrushIcon(port) {
  const w = new BrowserWindow({ show: false, width: 300, height: 300 });
  try {
    await w.loadURL(`http://127.0.0.1:${port}/icon.html`);
    const dataUrl = await w.webContents.executeJavaScript('window.renderIcon(256)');
    const big = nativeImage.createFromDataURL(dataUrl);
    if (big.isEmpty()) return;
    iconImage = big;
    fever.setIcon(big.resize({ width: 64, height: 64, quality: 'best' }).toPNG());
    const trayImage = nativeImage.createEmpty();
    for (const scaleFactor of [1, 2]) {
      const n = 16 * scaleFactor;
      trayImage.addRepresentation({ scaleFactor, buffer: big.resize({ width: n, height: n, quality: 'best' }).toPNG() });
    }
    tray.setImage(trayImage);
  } catch {
    /* keep the plain icon */
  } finally {
    w.destroy();
  }
}

function createOverlay(port) {
  const { bounds } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: { backgroundThrottling: false },
  });
  lockZoom(win);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadURL(`http://127.0.0.1:${port}/`);
}

// Chromium remembers zoom per host, and every window here is 127.0.0.1, so a
// stray Ctrl+wheel (or an old zoom) would blow every page up. Keep them at 100%.
function lockZoom(win) {
  const reset = () => {
    win.webContents.setZoomFactor(1);
    win.webContents.setVisualZoomLevelLimits(1, 1);
  };
  win.webContents.on('did-finish-load', reset);
  win.webContents.on('zoom-changed', reset);
}

// Windows keeps background apps from taking focus, so a window opened from
// the tray would land behind whatever you are using. Bring it to the front.
function bringToFront(win) {
  if (win.isMinimized()) win.restore();
  win.show();
  win.setAlwaysOnTop(true, 'floating');
  win.moveTop();
  app.focus({ steal: true });
  win.focus();
  setTimeout(() => !win.isDestroyed() && win.setAlwaysOnTop(false), 400);
}

// The settings page and the game guide open in their own normal windows.
const windows = {};
function openPage(name, page, title, size) {
  const existing = windows[name];
  if (existing && !existing.isDestroyed()) return bringToFront(existing);
  const win = new BrowserWindow({
    ...size,
    title,
    show: false,
    backgroundColor: '#120c17',
    autoHideMenuBar: true,
    icon: iconImage ? iconImage.resize({ width: 64, height: 64, quality: 'best' }) : appIcon(32),
  });
  windows[name] = win;
  lockZoom(win);
  win.once('ready-to-show', () => bringToFront(win));
  win.loadURL(`http://127.0.0.1:${serverPort}/${page}`);
  win.on('closed', () => { delete windows[name]; });
}
const openSettings = () => openPage('settings', 'settings.html', 'Idle Death Gamble · Settings', { width: 620, height: 840 });
const openGuide = () => openPage('guide', 'guide.html', 'Idle Death Gamble · 遊び方', { width: 760, height: 860 });

// Tray menu in the computer's language.
const MENU_TEXT = {
  en: { guide: 'How to play (guide)', follow: 'Follow conversation', auto: 'Automatic (last one you wrote to)', none: '—', settings: 'Settings…', demo: 'Play demo', discreet: 'Discreet mode', layout: 'Layout', normal: 'Normal', compact: 'Compact', mini: 'Mini', mute: 'Mute', show: 'Show overlay', quit: 'Quit' },
  pt: { guide: 'Como jogar (guia)', follow: 'Seguir conversa', auto: 'Automático (a última que você escreveu)', none: '—', settings: 'Configurações…', demo: 'Tocar a demo', discreet: 'Modo discreto', layout: 'Formato', normal: 'Normal', compact: 'Compacto', mini: 'Mini', mute: 'Silenciar', show: 'Mostrar overlay', quit: 'Sair' },
  es: { guide: 'Cómo jugar (guía)', follow: 'Seguir conversación', auto: 'Automático (la última a la que escribiste)', none: '—', settings: 'Ajustes…', demo: 'Reproducir la demo', discreet: 'Modo discreto', layout: 'Formato', normal: 'Normal', compact: 'Compacto', mini: 'Mini', mute: 'Silenciar', show: 'Mostrar overlay', quit: 'Salir' },
};

function buildMenu() {
  const cfg = fever.config();
  const choice = cfg.translation && MENU_TEXT[cfg.translation] ? cfg.translation : app.getLocale().slice(0, 2);
  const t = MENU_TEXT[choice] || MENU_TEXT.en;
  const layoutItem = (value) => ({
    label: t[value],
    type: 'radio',
    checked: cfg.layout === value,
    click: () => fever.setConfig({ layout: value }),
  });
  return Menu.buildFromTemplate([
    { label: '坐殺博徒 · Idle Death Gamble', enabled: false },
    { type: 'separator' },
    { label: `遊び方 · ${t.guide}`, click: openGuide },
    { type: 'separator' },
    { label: t.discreet, type: 'checkbox', checked: cfg.discreet, click: (item) => fever.setConfig({ discreet: item.checked }) },
    { label: t.layout, submenu: ['normal', 'compact', 'mini'].map(layoutItem) },
    { label: t.follow, submenu: followItems(cfg, t) },
    { label: t.mute, type: 'checkbox', checked: cfg.muted, click: (item) => fever.setConfig({ muted: item.checked }) },
    { label: t.show, type: 'checkbox', checked: win.isVisible(), click: (item) => (item.checked ? win.showInactive() : win.hide()) },
    { type: 'separator' },
    { label: t.settings, click: openSettings },
    { label: t.demo, click: () => fever.runDemo() },
    { type: 'separator' },
    { label: `領域解除 · ${t.quit}`, click: () => app.quit() },
  ]);
}

// Which conversation the machine shows: automatic, or one pinned.
function followItems(cfg, t) {
  const { list } = fever.sessions();
  const items = [{ label: t.auto, type: 'radio', checked: cfg.follow === 'auto', click: () => fever.setConfig({ follow: 'auto' }) }];
  if (list.length) items.push({ type: 'separator' });
  for (const s of list.slice(0, 12)) {
    const name = s.title ? `${s.label} · ${s.title}` : s.label;
    items.push({ label: name.length > 60 ? `${name.slice(0, 59)}…` : name, type: 'radio', checked: cfg.follow === s.id, click: () => fever.setConfig({ follow: s.id }) });
  }
  return items;
}

// Built fresh each time, so it always matches the current settings.
function showMenu() {
  tray.popUpContextMenu(buildMenu());
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();

  fever = createFeverServer({
    onOpenWindow: (name) => (name === 'guide' ? openGuide() : openSettings()),
    onQuit: () => app.quit(),
  });
  let port;
  try {
    port = await fever.listen();
  } catch (err) {
    console.error(err.code === 'EADDRINUSE' ? 'Port busy: is the domain already open?' : err);
    app.quit();
    return;
  }

  serverPort = port;
  createOverlay(port);
  tray = new Tray(appIcon(16));
  tray.setToolTip('Idle Death Gamble');
  tray.on('double-click', openSettings);
  tray.on('right-click', showMenu);
  tray.on('click', showMenu);
  renderBrushIcon(port);
});

app.on('window-all-closed', (e) => e.preventDefault());
app.on('before-quit', () => fever && fever.close());
