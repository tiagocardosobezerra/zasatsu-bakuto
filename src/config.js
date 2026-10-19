'use strict';

// User settings, stored in ~/.agent-fever/config.json (or $FEVER_HOME).
// Unknown keys and out-of-range values are dropped, so a bad file never
// breaks the overlay.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = process.env.FEVER_HOME || path.join(os.homedir(), '.agent-fever');
const CONFIG_FILE = path.join(HOME, 'config.json');

const DEFAULTS = {
  position: 'br', // br | bl | tr | tl
  scale: 1, // 0.3 - 2
  layout: 'normal', // normal | compact | mini
  opacity: 1, // 0.3 - 1
  intro: 'smart', // smart | full | compact | off: the Domain Expansion
  jackpot: 'full', // full | compact | off: the 大当たり screen
  idleDim: true,
  muted: false,
  discreet: false, // one switch for work: mini, silent, nothing full screen
  show: { crest: true, lamps: true, indicators: true, ticker: true, stats: true },
  sound: { volume: 0.6, effects: true, music: true, voice: true },
  translation: 'auto', // auto | en | pt | es | ja (Japanese only)
  follow: 'auto', // auto, or the id of the conversation to show
  motion: 'auto', // auto (follow the system) | full | reduced
};

const ENUMS = {
  position: ['br', 'bl', 'tr', 'tl'],
  intro: ['smart', 'full', 'compact', 'off'],
  jackpot: ['full', 'compact', 'off'],
  translation: ['auto', 'en', 'pt', 'es', 'ja'],
  motion: ['auto', 'full', 'reduced'],
  layout: ['normal', 'compact', 'mini'],
};
const RANGES = { scale: [0.3, 2], opacity: [0.3, 1], volume: [0, 1] };

function clean(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = structuredClone(DEFAULTS);
  for (const key of Object.keys(ENUMS)) if (ENUMS[key].includes(src[key])) out[key] = src[key];
  for (const key of ['scale', 'opacity']) {
    const n = Number(src[key]);
    if (Number.isFinite(n)) out[key] = Math.min(RANGES[key][1], Math.max(RANGES[key][0], n));
  }
  for (const key of ['idleDim', 'muted', 'discreet']) if (typeof src[key] === 'boolean') out[key] = src[key];
  if (typeof src.follow === 'string' && src.follow.length > 0 && src.follow.length <= 128) out.follow = src.follow;
  for (const key of Object.keys(DEFAULTS.show)) {
    if (src.show && typeof src.show[key] === 'boolean') out.show[key] = src.show[key];
  }
  if (src.sound) {
    const v = Number(src.sound.volume);
    if (Number.isFinite(v)) out.sound.volume = Math.min(1, Math.max(0, v));
    for (const key of ['effects', 'music', 'voice']) if (typeof src.sound[key] === 'boolean') out.sound[key] = src.sound[key];
  }
  return out;
}

// Shallow merge of a patch, one level deep for `show` and `sound`.
function merge(current, patch) {
  const p = patch && typeof patch === 'object' ? patch : {};
  return clean({
    ...current,
    ...p,
    show: { ...current.show, ...(p.show || {}) },
    sound: { ...current.sound, ...(p.sound || {}) },
  });
}

function load(file = CONFIG_FILE) {
  try {
    return clean(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return clean({});
  }
}

function save(config, file = CONFIG_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

module.exports = { DEFAULTS, HOME, CONFIG_FILE, clean, merge, load, save };
