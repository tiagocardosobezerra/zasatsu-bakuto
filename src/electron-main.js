'use strict';

// Desktop shell: runs the server in-process and shows the overlay in
// a transparent, click-through, always-on-top window over the primary
// display. Everything else (game, visuals) is shared with `ryoiki serve`.

const { app, BrowserWindow, Menu, Tray, nativeImage, screen, shell } = require('electron');
const { createDomainServer } = require('./server');
const path = require('node:path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let tray = null;
let win = null;
let domain = null;
let serverPort = null;

// The hand sign icon (public/app-icon.png, made by `npm run icon`), at 1x
// and 2x for crisp tray and window icons.
const ICON_FILE = path.join(__dirname, '..', 'public', 'app-icon.png');
function appIcon(size) {
  const source = nativeImage.createFromPath(ICON_FILE);
  const image = nativeImage.createEmpty();
  for (const scaleFactor of [1, 2]) {
    const n = size * scaleFactor;
    image.addRepresentation({ scaleFactor, buffer: source.resize({ width: n, height: n, quality: 'best' }).toPNG() });
  }
  return image;
}

// The overlay takes clicks only while the pointer is over a conversation
// line with a link. The page renews the request as the pointer moves; if
// renewals stop for any reason (the line vanished, the page hung), the
// overlay lets go by itself, so it can never block the rest of the screen.
const CLICK_HOLD_MS = 3000;
let releaseTimer = null;
function takeClicks(over) {
  if (!win || win.isDestroyed()) return;
  clearTimeout(releaseTimer);
  win.setIgnoreMouseEvents(!over, { forward: true });
  if (over) releaseTimer = setTimeout(() => takeClicks(false), CLICK_HOLD_MS);
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
  // Click-through, but the page still hears the pointer, so a conversation
  // line can take the click (see onPointer below).
  win.setIgnoreMouseEvents(true, { forward: true });
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
    icon: appIcon(32),
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
  en: { guide: 'How to play (guide)', lines: 'Conversation lines', off: 'Off', all: 'Unlimited', machines: 'Machines', shared: 'One for all', each: 'One per conversation', settings: 'Settings…', demo: 'Play demo', discreet: 'Discreet mode', layout: 'Layout', normal: 'Normal', compact: 'Compact', mini: 'Mini', mute: 'Mute', show: 'Show overlay', quit: 'Quit' },
  pt: { guide: 'Como jogar (guia)', lines: 'Linhas de conversa', off: 'Desligado', all: 'Ilimitado', machines: 'Máquinas', shared: 'Uma para todas', each: 'Uma por conversa', settings: 'Configurações…', demo: 'Tocar a demo', discreet: 'Modo discreto', layout: 'Formato', normal: 'Normal', compact: 'Compacto', mini: 'Mini', mute: 'Silenciar', show: 'Mostrar overlay', quit: 'Sair' },
};

function buildMenu() {
  const cfg = domain.config();
  const choice = cfg.translation && MENU_TEXT[cfg.translation] ? cfg.translation : app.getLocale().slice(0, 2);
  const t = MENU_TEXT[choice] || MENU_TEXT.en;
  const layoutItem = (value) => ({
    label: t[value],
    type: 'radio',
    checked: cfg.layout === value,
    click: () => domain.setConfig({ layout: value }),
  });
  // Same order as the settings page: quick switches, then the game, then
  // the machine on screen.
  return Menu.buildFromTemplate([
    { label: '坐殺博徒 · Idle Death Gamble', enabled: false },
    { type: 'separator' },
    { label: `遊び方 · ${t.guide}`, click: openGuide },
    { type: 'separator' },
    { label: t.discreet, type: 'checkbox', checked: cfg.discreet, click: (item) => domain.setConfig({ discreet: item.checked }) },
    { label: t.mute, type: 'checkbox', checked: cfg.muted, click: (item) => domain.setConfig({ muted: item.checked }) },
    { label: t.show, type: 'checkbox', checked: win.isVisible(), click: (item) => (item.checked ? win.showInactive() : win.hide()) },
    { type: 'separator' },
    {
      label: t.machines,
      submenu: ['shared', 'each'].map((m) => ({ label: t[m], type: 'radio', checked: cfg.machines === m, click: () => domain.setConfig({ machines: m }) })),
    },
    {
      label: t.lines,
      submenu: [0, 1, 2, 3, 'all'].map((n) => ({ label: n === 'all' ? t.all : n ? String(n) : t.off, type: 'radio', checked: cfg.lines === n, click: () => domain.setConfig({ lines: n }) })),
    },
    { label: t.layout, submenu: ['normal', 'compact', 'mini'].map(layoutItem) },
    { type: 'separator' },
    { label: t.settings, click: openSettings },
    { label: t.demo, click: () => domain.runDemo() },
    { type: 'separator' },
    { label: `領域解除 · ${t.quit}`, click: () => app.quit() },
  ]);
}

// Built fresh each time, so it always matches the current settings.
function showMenu() {
  tray.popUpContextMenu(buildMenu());
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();

  domain = createDomainServer({
    onOpenWindow: (name) => (name === 'guide' ? openGuide() : openSettings()),
    onQuit: () => app.quit(),
    onOpenLink: (link) => shell.openExternal(link),
    onPointer: takeClicks,
  });
  let port;
  try {
    port = await domain.listen();
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
});

app.on('window-all-closed', (e) => e.preventDefault());
app.on('before-quit', () => domain && domain.close());
