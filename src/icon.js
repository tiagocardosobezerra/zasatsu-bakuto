'use strict';

// The app icon: Hakari's slot machine wrapped in cursed energy, with 呪
// ("curse", the Ju of Jujutsu Kaisen) brushed on the marquee. Drawn in code
// (no binary assets) on a 32-unit grid and rasterised with 4x4
// supersampling, so it stays crisp at 16, 32 or 64 px. It nods to the
// series without using its logo.

const C = {
  ink: [14, 10, 22],
  body: [32, 22, 48],
  bodyLight: [58, 40, 86],
  trim: [255, 77, 154],
  gold: [255, 210, 63],
  goldDark: [201, 151, 0],
  glass: [8, 8, 10],
  reel: [255, 255, 255],
  seven: [224, 27, 47],
  steel: [184, 190, 200],
  steelDark: [107, 114, 128],
  knob: [255, 45, 85],
  white: [255, 255, 255],
  auraCore: [30, 20, 80],
};

// Cursed energy: cyan at the tips of the flames, violet at the base.
const aura = (x, y) => {
  const t = Math.min(1, Math.max(0, y / 32));
  return [Math.round(90 + 40 * t), Math.round(160 - 110 * t), 255];
};

const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
function nearSegment(x, y, ax, ay, bx, by, w) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= (w / 2) ** 2;
}
// A flame tongue: wide at the base (y0), pointed at the tip, gently curved.
function inFlame(x, y, cx, tipY, baseY, half, lean = 0) {
  if (y < tipY || y > baseY) return false;
  const t = (y - tipY) / (baseY - tipY); // 0 at the tip, 1 at the base
  const mid = cx + lean * (1 - t) ** 2;
  return Math.abs(x - mid) <= half * Math.sqrt(t);
}
// The machine is drawn a little smaller so the energy can wrap around it.
// Aura shapes use icon space; every other shape uses machine space.
const S = 0.8;
const OX = 2.4;
const OY = 5.6;

// Flame tongues rising over the marquee and licking up the sides.
const FLAMES = [
  [3.6, 1.2, 12, 2.6, -1.4], [8.4, 0.2, 9, 2.4, -0.6], [13.2, 0.8, 9, 2.4, 0.3],
  [18, 0.0, 9, 2.4, 0.7], [22.6, 1.4, 11, 2.4, 1.3],
  [1.2, 9.5, 30, 1.9, -1.4], [26.8, 16, 31, 2.0, 1.4],
];
const inAura = (x, y, grow) =>
  inRoundRect(x, y, 1.4 - grow, 5.2 - grow, 25.6 + grow, 31.4 + grow, 3.4) ||
  FLAMES.some(([cx, tip, base, half, lean]) => inFlame(x, y, cx, tip - grow, base, half + grow, lean));

// 呪 brushed in ink: 口 on the left, 兄 (口 over two legs) on the right.
const box = (x, y, x0, y0, x1, y1, w) =>
  x >= x0 - w / 2 && x <= x1 + w / 2 && y >= y0 - w / 2 && y <= y1 + w / 2 &&
  !(x > x0 + w / 2 && x < x1 - w / 2 && y > y0 + w / 2 && y < y1 - w / 2);
const W = 0.62;
const inJu = (x, y) =>
  box(x, y, 9.9, 4.7, 11.5, 7.0, W) ||
  box(x, y, 12.6, 3.5, 16.4, 5.5, W) ||
  nearSegment(x, y, 13.7, 5.6, 12.6, 8.2, W) ||
  nearSegment(x, y, 15.3, 5.6, 15.3, 7.9, W) ||
  nearSegment(x, y, 15.3, 7.9, 17.0, 7.9, W) ||
  nearSegment(x, y, 17.0, 7.9, 17.0, 7.1, W);

// Shapes painted bottom to top: [test(x, y), colour or colour(x, y)]
const REELS = [6, 11.6, 17.2];
const SHAPES = [
  // cursed energy
  [(x, y) => inAura(x, y, 0), aura, 'icon'],
  [(x, y) => inAura(x, y, -1.2), C.auraCore, 'icon'],
  // lever
  [(x, y) => inRoundRect(x, y, 26.4, 5, 28.2, 19, 0.8), C.steelDark],
  [(x, y) => inRoundRect(x, y, 26.8, 5, 27.8, 18.6, 0.5), C.steel],
  [(x, y) => inRoundRect(x, y, 24, 16, 28.4, 19.6, 1), C.steelDark],
  [(x, y) => inCircle(x, y, 27.3, 4.6, 2.9), C.ink],
  [(x, y) => inCircle(x, y, 27.3, 4.6, 2.3), C.knob],
  [(x, y) => inCircle(x, y, 26.5, 3.8, 0.8), C.white],
  // cabinet: dark, with Hakari's pink pachinko trim
  [(x, y) => inRoundRect(x, y, 1.6, 6.2, 25.4, 30.4, 3), C.trim],
  [(x, y) => inRoundRect(x, y, 2.5, 7.1, 24.5, 29.5, 2.2), C.body],
  [(x, y) => inRoundRect(x, y, 3.3, 8, 5.4, 28.4, 1), C.bodyLight],
  // marquee with 呪
  [(x, y) => inRoundRect(x, y, 3.4, 1.6, 23.6, 9.6, 2.2), C.ink],
  [(x, y) => inRoundRect(x, y, 4.4, 2.6, 22.6, 8.6, 1.6), C.gold],
  [(x, y) => inRoundRect(x, y, 4.4, 7.4, 22.6, 8.6, 1.6) && y > 7.4, C.goldDark],
  [(x, y) => inCircle(x, y, 6.6, 5.6, 0.9) || inCircle(x, y, 20.4, 5.6, 0.9), C.white],
  [inJu, C.ink],
  // window and reels
  [(x, y) => inRoundRect(x, y, 4.6, 11, 22.4, 21, 1.4), C.glass],
  [(x, y) => REELS.some((r) => inRoundRect(x, y, r, 12, r + 4.6, 20, 0.9)), C.reel],
  [(x, y) => REELS.some((r) => inRoundRect(x, y, r + 0.9, 13.2, r + 3.8, 14.6, 0.3)
    || nearSegment(x, y, r + 3.5, 14.2, r + 1.7, 18.9, 1.4)), C.seven],
  // payout tray
  [(x, y) => inRoundRect(x, y, 6.4, 22.6, 20.6, 25.6, 1.2), C.trim],
  [(x, y) => inRoundRect(x, y, 7.4, 23.4, 19.6, 24.8, 0.6), C.ink],
];

// Returns raw pixels for a size x size icon. order: 'rgba' or 'bgra'.
function drawIcon(size = 64, order = 'bgra') {
  const k = 32 / size;
  const N = 4; // supersamples per axis
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const x = (px + (sx + 0.5) / N) * k;
          const y = (py + (sy + 0.5) / N) * k;
          let colour = null;
          const mx = (x - OX) / S;
          const my = (y - OY) / S;
          for (const [test, c, space] of SHAPES) {
            const hit = space === 'icon' ? test(x, y) : test(mx, my);
            if (hit) colour = typeof c === 'function' ? c(x, y) : c;
          }
          if (colour) {
            r += colour[0];
            g += colour[1];
            b += colour[2];
            a += 1;
          }
        }
      }
      const i = (py * size + px) * 4;
      if (!a) continue;
      // straight (non-premultiplied) colour, coverage as alpha
      const [c0, c2] = order === 'bgra' ? [b / a, r / a] : [r / a, b / a];
      buf[i] = Math.round(c0);
      buf[i + 1] = Math.round(g / a);
      buf[i + 2] = Math.round(c2);
      buf[i + 3] = Math.round((a / (N * N)) * 255);
    }
  }
  return buf;
}

// Minimal PNG encoder, so the server can hand the icon to web pages.
const zlib = require('node:zlib');
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function iconPNG(size = 64) {
  const px = drawIcon(size, 'rgba');
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

module.exports = { drawIcon, iconPNG };
