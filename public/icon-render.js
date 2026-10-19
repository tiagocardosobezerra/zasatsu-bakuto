// The app icon: Hakari's Domain Expansion hand sign (public/hand-sign.svg,
// vectorised from a drawing) on the dark violet of the domain.
// `npm run icon` renders it to public/app-icon.png, which the tray, windows
// and pages use.
(() => {
  'use strict';

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
    ctx.beginPath();
    ctx.roundRect(1, 1, 62, 62, 14);
    const glow = ctx.createRadialGradient(32, 30, 4, 32, 32, 44);
    glow.addColorStop(0, '#4a2373');
    glow.addColorStop(0.55, '#1f1030');
    glow.addColorStop(1, '#0b0711');
    ctx.fillStyle = glow;
    ctx.fill();

    // 2. The hand sign, centred, with a soft light behind it so it reads at 16 px.
    ctx.save();
    ctx.shadowColor = 'rgba(255, 236, 200, 0.55)';
    ctx.shadowBlur = 5;
    ctx.drawImage(hands, 5, 4.6, 54, 54.6);
    ctx.restore();
  }

  window.renderIcon = async (size = 256) => {
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
