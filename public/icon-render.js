// The app icon: Hakari's Domain Expansion hand sign (public/hand-sign.svg,
// vectorised from a drawing) over a cursed-energy glow with black flames,
// and a red 秤 seal (the kanji of Hakari's name). `npm run icon` renders it
// to public/app-icon.png, which the tray, windows and pages use.
(() => {
  'use strict';

  const BRUSH = '"Yuji Boku", "Yu Mincho", "Hiragino Mincho ProN", serif';

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

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function draw(ctx, hands) {
    // 1. Tile: the inside of the domain, dark with a violet glow.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(1, 1, 62, 62, 14);
    const glow = ctx.createRadialGradient(32, 30, 4, 32, 32, 44);
    glow.addColorStop(0, '#4a2373');
    glow.addColorStop(0.55, '#1f1030');
    glow.addColorStop(1, '#0b0711');
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.clip();

    // 2. Black cursed-energy flames with a violet edge, rising from the bottom.
    const flames = [[6, 66, 26, 7, -3], [17, 66, 19, 6, -1], [47, 66, 19, 6, 1], [58, 66, 26, 7, 3], [32, 66, 12, 9, 0]];
    ctx.save();
    ctx.shadowColor = '#a274ff';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#8b5cf6';
    for (const f of flames) { flame(ctx, ...f); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#0b0711';
    for (const [cx, base, h, w, lean] of flames) { flame(ctx, cx, base, h - 2.2, w - 1.5, lean); ctx.fill(); }

    // 3. The hand sign, with a soft light behind it so it reads at 16 px.
    ctx.save();
    ctx.shadowColor = 'rgba(255, 236, 200, 0.55)';
    ctx.shadowBlur = 5;
    ctx.drawImage(hands, 5, 4, 54, 54.6);
    ctx.restore();
    ctx.restore();

    // 4. Red seal: 秤, Hakari's name, in the empty bottom-right corner.
    ctx.save();
    ctx.translate(53.5, 53.5);
    ctx.rotate(-0.14);
    ctx.beginPath();
    ctx.roundRect(-7, -7, 14, 14, 2.2);
    ctx.fillStyle = '#c4002b';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff3e6';
    ctx.stroke();
    ctx.fillStyle = '#fff3e6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `11px ${BRUSH}`;
    ctx.fillText('秤', 0, 0.8);
    ctx.restore();
  }

  window.renderIcon = async (size = 256) => {
    try {
      await Promise.race([document.fonts.load('20px "Yuji Boku"', '秤'), new Promise((r) => setTimeout(r, 2500))]);
    } catch {
      /* system fonts are fine */
    }
    const hands = await loadImage('hand-sign.svg');
    const canvas = document.getElementById('c');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.scale(size / 64, size / 64);
    draw(ctx, hands);
    ctx.restore();
    return canvas.toDataURL('image/png');
  };
})();
