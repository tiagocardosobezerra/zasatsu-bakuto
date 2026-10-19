// The app icon, drawn with real brush lettering: Hakari's slot machine
// wrapped in black cursed-energy flames, 坐殺博徒 on the marquee and a red
// 秤 seal (the kanji of Hakari's name). The desktop app renders it once at
// start; src/icon.js keeps a plain fallback for when this is not available.
(() => {
  'use strict';

  const BRUSH = '"Yuji Boku", "Yu Mincho", "Hiragino Mincho ProN", serif';
  const BLOCK = '"Dela Gothic One", Impact, "Arial Black", sans-serif';

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  // A flame tongue from (cx, base) up to its tip, leaning a little.
  function flame(ctx, cx, base, height, width, lean) {
    const tipX = cx + lean;
    const tipY = base - height;
    ctx.beginPath();
    ctx.moveTo(cx - width, base);
    ctx.bezierCurveTo(cx - width, base - height * 0.45, tipX - width * 0.25, tipY + height * 0.35, tipX, tipY);
    ctx.bezierCurveTo(tipX + width * 0.2, tipY + height * 0.4, cx + width, base - height * 0.4, cx + width, base);
    ctx.closePath();
  }

  function draw(ctx) {
    // 1. Cursed energy: black flames with a violet edge, as the manga draws it.
    const flames = [
      [9, 34, 31, 6.5, -6], [18, 22, 22, 6.5, -2], [28, 20, 20, 6.5, 1], [38, 20, 20.5, 6.5, 2],
      [48, 22, 21, 6.5, 4], [56, 34, 26, 6, 5], [5, 62, 36, 5.5, -4], [60, 62, 34, 5.5, 4],
      [32, 64, 14, 30, 0],
    ];
    ctx.save();
    ctx.shadowColor = '#9b6bff';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#8b5cf6';
    for (const f of flames) { flame(ctx, ...f); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#0d0914';
    for (const [cx, base, h, w, lean] of flames) { flame(ctx, cx, base, h - 2.4, w - 1.6, lean); ctx.fill(); }

    // The machine sits a little smaller inside the flames.
    ctx.save();
    ctx.translate(5, 8.5);
    ctx.scale(0.84, 0.84);

    // 2. Lever with its red knob
    ctx.fillStyle = '#6b7280';
    roundRect(ctx, 51, 34, 8, 6, 2); ctx.fill();
    ctx.fillStyle = '#c3c9d2';
    roundRect(ctx, 54.5, 17, 3.2, 20, 1.6); ctx.fill();
    ctx.beginPath(); ctx.arc(56.1, 14, 4.6, 0, Math.PI * 2);
    ctx.fillStyle = '#120a18'; ctx.fill();
    ctx.beginPath(); ctx.arc(56.1, 14, 3.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2d55'; ctx.fill();
    ctx.beginPath(); ctx.arc(55, 12.8, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();

    // 3. Cabinet: dark, with Hakari's pink pachinko trim
    const body = ctx.createLinearGradient(0, 16, 0, 62);
    body.addColorStop(0, '#33204a');
    body.addColorStop(1, '#140c1e');
    roundRect(ctx, 8.5, 15.5, 44, 46, 7);
    ctx.fillStyle = body; ctx.fill();
    ctx.lineWidth = 2.6; ctx.strokeStyle = '#ff4d9a'; ctx.stroke();

    // 4. Marquee with the domain's name
    const gold = ctx.createLinearGradient(0, 5, 0, 21);
    gold.addColorStop(0, '#fff3b0');
    gold.addColorStop(0.45, '#ffd23f');
    gold.addColorStop(1, '#c99700');
    roundRect(ctx, 5.5, 4.5, 50, 16.5, 5);
    ctx.fillStyle = gold; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#120a18'; ctx.stroke();
    ctx.fillStyle = '#120a18';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `11px ${BRUSH}`;
    ctx.fillText('坐殺博徒', 30.5, 13.4, 46);

    // 5. Window with 7 7 7
    roundRect(ctx, 12.5, 24.5, 36, 18, 3);
    ctx.fillStyle = '#07070a'; ctx.fill();
    for (const x of [14.5, 26, 37.5]) {
      roundRect(ctx, x, 26.5, 9.5, 14, 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.fillStyle = '#e01b2f';
      ctx.font = `13px ${BLOCK}`;
      ctx.fillText('7', x + 4.75, 34);
    }

    // 6. Payout tray
    roundRect(ctx, 17, 46.5, 27, 5.5, 2.75);
    ctx.fillStyle = '#ff4d9a'; ctx.fill();
    roundRect(ctx, 19, 48, 23, 2.5, 1.25);
    ctx.fillStyle = '#120a18'; ctx.fill();

    ctx.restore();

    // 7. Red seal: 秤, Hakari's name
    ctx.save();
    ctx.translate(49, 51.5);
    ctx.rotate(-0.14);
    roundRect(ctx, -9.5, -9.5, 19, 19, 3);
    ctx.fillStyle = '#c4002b'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#fff3e6'; ctx.stroke();
    ctx.fillStyle = '#fff3e6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `15px ${BRUSH}`;
    ctx.fillText('秤', 0, 0.8);
    ctx.restore();
  }

  window.renderIcon = async (size = 256) => {
    try {
      await Promise.race([
        Promise.all([document.fonts.load(`20px "Yuji Boku"`, '坐殺博徒秤'), document.fonts.load(`20px "Dela Gothic One"`, '7')]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {
      /* system fonts are fine */
    }
    const canvas = document.getElementById('c');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.scale(size / 64, size / 64);
    draw(ctx);
    ctx.restore();
    return canvas.toDataURL('image/png');
  };
})();
