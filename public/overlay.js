(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand7 = () => 1 + Math.floor(Math.random() * 7);
  const i18n = window.DomainI18n;

  const machine = $('machine');
  const lcd = $('lcd');
  const banner = $('banner');
  const ticker = $('ticker');
  const intro = $('intro');
  const fever = $('fever');
  const doors = $('doors');
  const pop = $('pop');
  const reels = [...document.querySelectorAll('#lcd .reel')];
  const holdEls = [...document.querySelectorAll('.holds i')];
  const consecEls = [...document.querySelectorAll('.consec i')];

  // The seven characters of Private Pure Love Train decorate the numbers.
  // Canon (ch. 183): 3 = Yume Asagiri, 4 = Hiro Kato. The rest are ours.
  const CAST = {
    1: ['夕輝', 'Yuki Yamaguchi 山口夕輝'],
    2: ['雨矢', 'Aya Saito 斎藤雨矢'],
    3: ['夢', 'Yume Asagiri 朝霧夢'],
    4: ['空', 'Hiro Kato 加藤空'],
    5: ['小百合', 'Sayuri Amanokawa 天ノ川小百合'],
    6: ['涼香', 'Suzuka Shimizu 清水涼香'],
    7: ['紗夜花', 'Sayaka Yamaguchi 山口紗夜花'],
  };

  // 期待度 from the rule sheet: lit stars out of three.
  const STARS = { 1: '★☆☆', 2: '★★☆', 3: '★★★' };
  // How each riichi scenario is staged. Win conditions follow the manga;
  // Seat Struggle's was never shown, so its lines are our own.
  const SCENES = {
    transit: { fromKey: 'nameYuki', toKey: 'placeGate', runner: '🏃' },
    seat: { fromKey: 'nameYuki', toKey: 'placeSeat', runner: '🏃' },
    potty: { fromKey: 'nameHiro', toKey: 'placeShinYuri', runner: '🚃' },
    final: { fromKey: 'nameYume', toKey: 'nameYuki', runner: '💗' },
  };
  const MODE_KEYS = {
    normal: { badge: 'modeNormal', stage: 'stageNormal' },
    increased: { badge: 'modeIncreased', stage: 'stageIncreased' },
    faster: { badge: 'modeFaster', stage: 'stageFaster' },
  };
  // Until the server says otherwise (src/game.js ODDS).
  const DEFAULT_ODDS = { normal: 239, increased: 24, faster: 239 };
  const COLOR_CALL = { red: 'chance', gold: 'hot', rainbow: 'kakutei' };

  // The sure-hit effect: the rules dumped into the opponent's head.
  const RULES = [
    '「坐殺博徒」は実在のパチンコ台をモデルにした領域だ',
    '図柄を3つ揃えれば大当たり',
    '大当たり確率 約1/239 · 確変突入率 約75%',
    '通常 → 大当たり → 確変 / 時短',
    '時短: 規定回数消化 70 or 30回転',
    '一回以上演出を発生させたらリーチに発展',
    '保留玉 · シャッター · 疑似連',
    '緑 < 赤 < 金',
    '虹色や4回目はそれだけで大当たりが確定',
    '交通系ICカードリーチ ★☆☆',
    '座席争奪通勤リーチ ★★☆',
    'うっかり特快便意我慢リーチ ★★☆',
    '華金終電リーチ ★★★ 期待度80%超え',
    'チャンスアップ: 夢背景 · 天ノ川カットイン · 群予告',
    '群予告: 電車以外なら大当たり確定',
    '大当たり: 呪力無制限 4分11秒 · 自動反転術式',
  ];

  for (const row of document.querySelectorAll('.lamps')) {
    for (let n = 0; n < 18; n++) {
      const lamp = document.createElement('i');
      lamp.style.setProperty('--n', String(n));
      row.appendChild(lamp);
    }
  }

  // ---------- Settings (server config; URL parameters win, for OBS) ----------
  let cfg = {
    position: 'br', scale: 1, layout: 'normal', opacity: 1, intro: 'smart', jackpot: 'full', idleDim: true, muted: false,
    show: { crest: true, lamps: true, indicators: true, ticker: true, stats: true },
    sound: { volume: 0.6, effects: true, music: true, voice: true },
    translation: 'auto',
    motion: 'auto',
  };

  // Discreet mode lays a quiet profile over the saved settings without
  // changing them, so switching it off brings everything back.
  function effective(c) {
    if (!c.discreet) return c;
    return {
      ...c,
      layout: 'mini',
      intro: 'off',
      jackpot: 'compact',
      muted: true,
      opacity: Math.min(c.opacity, 0.85),
      sound: { ...c.sound, voice: false, music: false },
    };
  }

  function applyConfig(next) {
    if (next) cfg = effective(next);
    i18n.setLang(params.get('lang') || cfg.translation || 'auto');
    document.body.classList.toggle('no-tr', !i18n.lang());
    document.body.classList.toggle('reduce', reduced());
    const layout = params.get('layout') || cfg.layout || 'normal';
    for (const l of ['normal', 'compact', 'mini']) document.body.classList.toggle(`layout-${l}`, l === layout);
    // 1, 2 or 3 lines, or 'all': as many as fit on the screen.
    const lines = params.has('lines') ? params.get('lines') : cfg.lines;
    linesWanted = lines === 'all' || lines === undefined || Number(lines) > 3 ? Infinity : Math.max(0, Number(lines) || 0);
    renderSessions();
    translateStatic();
    const pos = params.get('pos') || cfg.position;
    machine.dataset.pos = ['br', 'bl', 'tr', 'tl'].includes(pos) ? pos : 'br';
    const root = document.documentElement.style;
    root.setProperty('--hud-opacity', String(Number(params.get('opacity')) || cfg.opacity));
    for (const part of Object.keys(cfg.show)) document.body.classList.toggle(`hide-${part}`, !cfg.show[part]);
    root.setProperty('--scale', String(fitScale()));
    if (!cfg.idleDim) machine.classList.remove('idle');
    sound.muted = cfg.muted || params.has('mute') || !cfg.sound.effects || cfg.sound.volume === 0;
    sound.volume = cfg.sound.volume;
    sound.voiceOn = cfg.sound.voice !== false && !params.has('novoice');
    if (!musicOn()) ['round', 'expand'].forEach((k) => custom.stop(k));
    else {
      custom.setVolume(cfg.sound.volume);
      // Sound back on (discreet mode off, unmuted) in the middle of a round:
      // the round song picks up again for the time that is left.
      if (roundEndsAt && roundEndsAt > Date.now() && !custom.playing('round')) custom.play('round', { until: roundEndsAt });
    }
  }
  // The machine never takes more than ~60% of the screen height, so small
  // or scaled displays still have room to work.
  function fitScale() {
    const wanted = Number(params.get('scale')) || cfg.scale;
    // Conversation lines do not shrink the machine: they fill the space left.
    const natural = (machine.offsetHeight - $('conv-lines').offsetHeight) || 480;
    const width = machine.offsetWidth || 400;
    return Math.min(wanted, (innerHeight * 0.6) / natural, (innerWidth * 0.45) / width);
  }
  addEventListener('resize', () => document.documentElement.style.setProperty('--scale', String(fitScale())));

  // Less motion: chosen in Settings, or asked for by the system ("auto").
  const systemReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => {
    const m = params.get('motion') || cfg.motion || 'auto';
    return m === 'reduced' || (m === 'auto' && systemReduce.matches);
  };
  systemReduce.addEventListener('change', () => document.body.classList.toggle('reduce', reduced()));
  const SMART_GAP_MS = 10 * 60 * 1000;
  let lastFullIntro = 0;
  // smart: full screen for the first expansion, or after 10 quiet minutes;
  // on the machine otherwise.
  function introMode() {
    let mode = params.get('intro') || cfg.intro;
    if (mode === 'smart') mode = Date.now() - lastFullIntro > SMART_GAP_MS ? 'full' : 'compact';
    if (mode === 'full' && reduced()) mode = 'compact';
    if (mode === 'full') lastFullIntro = Date.now();
    return mode;
  }
  function jackpotMode() {
    const mode = params.get('jackpot') || cfg.jackpot;
    return mode === 'full' && reduced() ? 'compact' : mode;
  }
  const musicOn = () => !cfg.muted && !params.has('mute') && cfg.sound.music && cfg.sound.volume > 0;

  if (params.has('preview')) {
    document.body.classList.add('preview');
    $('preview-bar').hidden = false;
    $('demo-btn').addEventListener('click', () => {
      sound.unlock();
      fetch('/demo', { method: 'POST' });
    });
  }

  // ---------- Sound ----------
  // Synthesised in the spirit of a pachinko hall: steel-ball clatter, the
  // rising "kyuin" of a hot effect, a brassy jackpot fanfare. Every event
  // can be replaced by your own file in the custom folder (see README).
  const sound = {
    ctx: null,
    muted: false,
    volume: 0.6,
    noise: null,
    unlock() {
      if (!this.ctx) {
        try { this.ctx = new AudioContext(); } catch { return; }
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    ready() {
      if (this.muted) return false;
      this.unlock();
      return Boolean(this.ctx);
    },
    out(vol) {
      const gain = this.ctx.createGain();
      gain.gain.value = vol * this.volume * 1.25;
      gain.connect(this.ctx.destination);
      return gain;
    },
    tone(freq, dur, { type = 'square', vol = 0.04, at = 0, to, vibrato, filter } = {}) {
      if (!this.ready()) return;
      const t = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      if (vibrato) {
        const lfo = this.ctx.createOscillator();
        const depth = this.ctx.createGain();
        lfo.frequency.value = vibrato[0];
        depth.gain.value = vibrato[1];
        lfo.connect(depth).connect(osc.frequency);
        lfo.start(t);
        lfo.stop(t + dur + 0.05);
      }
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(1, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = osc.connect(env);
      if (filter) {
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = filter;
        node = node.connect(f);
      }
      node.connect(this.out(vol));
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },
    hiss(dur, { at = 0, vol = 0.05, type = 'bandpass', freq = 4000, q = 6 } = {}) {
      if (!this.ready()) return;
      const t = this.ctx.currentTime + at;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(1, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(env).connect(this.out(vol));
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.02);
    },
    // Your own file for this event, if there is one.
    file(name) {
      const url = custom.sound(name);
      if (!url || this.muted) return false;
      const a = new Audio(url);
      a.volume = this.volume;
      a.play().catch(() => {});
      return true;
    },

    // Steel balls rattling through the machine (じゃらじゃら).
    clatter(seconds, perSecond = 40, vol = 0.05) {
      const n = Math.round(seconds * perSecond);
      for (let i = 0; i < n; i++) {
        this.hiss(0.02 + Math.random() * 0.03, { at: Math.random() * seconds, vol: vol * (0.5 + Math.random()), freq: 3000 + Math.random() * 4000, q: 10 });
      }
    },
    tick() { this.hiss(0.012, { vol: 0.03, type: 'highpass', freq: 5000, q: 1 }); },
    clack() {
      this.hiss(0.04, { vol: 0.12, freq: 1800, q: 3 });
      this.tone(160, 0.07, { type: 'triangle', vol: 0.1, to: 80 });
    },
    // The rising "kyuin" a machine makes for a hot notice.
    kyuin(level = 1) {
      if (this.file('kyuin')) return;
      const top = 2400 + level * 400;
      this.tone(700, 0.32, { type: 'square', vol: 0.035, to: top, vibrato: [28, 40], filter: 5000 });
      this.tone(1050, 0.32, { type: 'sine', vol: 0.03, to: top * 1.5, at: 0.02 });
      this.tone(top, 0.35, { type: 'sine', vol: 0.025, at: 0.3, vibrato: [8, 30] });
    },
    expand() {
      if (this.file('expand')) return;
      this.tone(55, 2.2, { type: 'sine', vol: 0.4, to: 40 });
      this.hiss(1.6, { vol: 0.05, type: 'lowpass', freq: 600, q: 0.7, at: 0.05 });
      [880, 1175, 1568].forEach((f, i) => this.tone(f, 0.6, { type: 'sine', vol: 0.04, at: 1.3 + i * 0.12 }));
      this.tone(40, 0.5, { type: 'square', vol: 0.12, at: 2.95, to: 30, filter: 400 });
    },
    // Shutter doors: a heavy sliding clank (ガシャン).
    door(color) {
      if (this.file('door')) return;
      this.hiss(0.25, { vol: 0.06, type: 'lowpass', freq: 900, q: 0.8 });
      this.hiss(0.08, { vol: 0.12, freq: 1300, q: 4, at: 0.26 });
      this.tone(70, 0.18, { type: 'square', vol: 0.08, at: 0.26, filter: 300 });
      if (color === 'gold' || color === 'rainbow') this.kyuin(color === 'rainbow' ? 3 : 2);
    },
    // Reserve ball: a bright "chin", higher for hotter colours.
    ball(color) {
      if (this.file('ball')) return;
      const f = { green: 2093, red: 2637, gold: 3136, rainbow: 3520 }[color] || 2093;
      this.tone(f, 0.18, { type: 'sine', vol: 0.05 });
      this.tone(f * 2.01, 0.12, { type: 'sine', vol: 0.02 });
      if (color === 'gold' || color === 'rainbow') this.kyuin(color === 'rainbow' ? 3 : 2);
    },
    consec(n) {
      if (this.file('consec')) return;
      for (let i = 0; i < n; i++) this.tone(660 + i * 165, 0.1, { type: 'square', vol: 0.035, at: i * 0.1, filter: 3500 });
      this.hiss(0.15, { vol: 0.05, type: 'highpass', freq: 3000, q: 0.7, at: n * 0.1 });
    },
    riichi() {
      if (this.file('riichi')) return;
      this.kyuin(1);
      this.tone(196, 0.35, { type: 'sawtooth', vol: 0.06, at: 0.32, filter: 1200 });
      this.tone(294, 0.35, { type: 'sawtooth', vol: 0.05, at: 0.32, filter: 1200 });
    },
    tension() {
      this.tone(70, 0.18, { type: 'sine', vol: 0.32 });
      this.tone(70, 0.18, { type: 'sine', vol: 0.24, at: 0.22 });
    },
    swarm() { this.clatter(1.2, 18, 0.04); this.tone(520, 1.1, { type: 'triangle', vol: 0.03, to: 880 }); },
    cutin() {
      this.hiss(0.3, { vol: 0.07, type: 'highpass', freq: 2000, q: 0.7 });
      this.tone(90, 0.25, { type: 'square', vol: 0.1, at: 0.15, filter: 400 });
    },
    // Jackpot fanfare.
    jackpot() {
      if (this.file('jackpot')) return;
      const brass = (f, at, dur) => this.tone(f, dur, { type: 'sawtooth', vol: 0.045, at, filter: 2600 });
      [[523, 659, 784], [587, 740, 880], [659, 831, 988]].forEach((chord, i) => chord.forEach((f) => brass(f, i * 0.16, 0.16)));
      [523, 659, 784, 1047].forEach((f) => brass(f, 0.5, 1.4));
      for (let i = 0; i < 8; i++) this.tone(2637, 0.15, { type: 'sine', vol: 0.03, at: 0.6 + i * 0.18 });
    },
    // The barrier breaking: a crack, then glassy shards.
    shatter() {
      if (this.file('shatter')) return;
      this.hiss(0.08, { vol: 0.16, type: 'highpass', freq: 1800, q: 0.7 });
      this.tone(90, 0.3, { type: 'square', vol: 0.1, filter: 500 });
      for (let i = 0; i < 14; i++) {
        this.tone(2400 + Math.random() * 3200, 0.12 + Math.random() * 0.2, { type: 'sine', vol: 0.025, at: 0.04 + Math.random() * 0.5 });
      }
      this.hiss(0.6, { vol: 0.05, type: 'highpass', freq: 5000, q: 0.5, at: 0.05 });
    },
    miss() {
      if (this.file('miss')) return;
      this.tone(520, 0.7, { type: 'sine', vol: 0.09, to: 140, vibrato: [7, 25] });
    },
    heal() {
      if (this.file('heal')) return;
      [523, 784, 1047, 1568].forEach((f, i) => this.tone(f, 0.25, { type: 'sine', vol: 0.05, at: i * 0.06 }));
      this.hiss(0.5, { vol: 0.03, type: 'highpass', freq: 6000, q: 0.7 });
    },
    bonus() { this.tone(988, 0.07, { vol: 0.04, filter: 4000 }); this.tone(1319, 0.3, { vol: 0.04, at: 0.07, filter: 4000 }); this.clatter(0.6, 30, 0.035); },
    kakutei() {
      if (this.file('kakutei')) return;
      this.kyuin(3);
      for (let i = 0; i < 6; i++) this.tone(1568 + i * 220, 0.1, { type: 'square', vol: 0.035, at: 0.35 + i * 0.05, filter: 5000 });
    },
    chime() { this.tone(988, 0.3, { type: 'sine', vol: 0.08 }); this.tone(1319, 0.5, { type: 'sine', vol: 0.08, at: 0.16 }); },
    close() { this.tone(196, 0.9, { type: 'triangle', vol: 0.08, to: 98 }); },

    // Optional announcer, using a Japanese voice installed on the computer.
    voiceOn: true,
    jaVoice: null,
    say(text) {
      if (this.muted || !this.voiceOn || !('speechSynthesis' in window)) return;
      if (!this.jaVoice) this.jaVoice = speechSynthesis.getVoices().find((v) => /^ja/i.test(v.lang)) || null;
      if (!this.jaVoice) return;
      const u = new SpeechSynthesisUtterance(text);
      u.voice = this.jaVoice;
      u.lang = this.jaVoice.lang;
      u.rate = 1.15;
      u.pitch = 1.3;
      u.volume = Math.min(1, this.volume * 1.2);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    },
  };
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { sound.jaVoice = null; };

  // ---------- Your own art and music (~/.zasatsu-bakuto/custom) ----------
  // The app ships no official assets. People who own them can drop files in
  // the custom folder; see README.
  const AUDIO_EXT = /\.(mp3|ogg|wav|m4a)$/i;
  const custom = {
    images: new Map(), // base name -> url
    sounds: new Map(),
    audio: new Map(),
    async load() {
      try {
        const res = await fetch('/custom/manifest.json');
        const { files } = await res.json();
        for (const name of files) {
          const base = name.replace(/\.[^.]+$/, '').toLowerCase();
          const url = `/custom/${encodeURIComponent(name)}`;
          (AUDIO_EXT.test(name) ? this.sounds : this.images).set(base, url);
        }
      } catch {
        return;
      }
      const art = (id, key) => {
        const url = this.images.get(key);
        if (url) {
          $(id).style.backgroundImage = `url("${url}")`;
          $(id).classList.add('has');
        }
      };
      art('intro-art', 'intro');
      art('jackpot-art', 'jackpot');
      reels.forEach((r) => setSymbol(r, Number(r.dataset.s) || 7));
    },
    url(key) { return this.images.get(key); },
    sound(key) { return this.sounds.get(key); },
    // Music: the round song and the expansion theme.
    play(key, { until } = {}) {
      const url = this.sounds.get(key);
      if (!url || !musicOn()) return;
      this.stop(key);
      const a = new Audio(url);
      a.volume = cfg.sound.volume;
      // A song shorter than the round starts over, so the music lasts all 4:11.
      a.loop = Boolean(until);
      a.play().catch(() => {});
      this.audio.set(key, a);
      // Only stop this very song: a later round may have started another one.
      if (until) setTimeout(() => this.audio.get(key) === a && this.stop(key), Math.max(0, until - Date.now()));
    },
    playing(key) { return this.audio.has(key); },
    setVolume(v) { for (const a of this.audio.values()) a.volume = v; },
    stop(key) {
      const a = this.audio.get(key);
      if (a) a.pause();
      this.audio.delete(key);
    },
  };

  // ---------- Reels ----------
  function setSymbol(reel, s) {
    const art = custom.url(`reel-${s}`);
    reel.style.backgroundImage = art ? `url("${art}")` : '';
    reel.classList.toggle('has-art', Boolean(art));
    reel.dataset.s = String(s);
    reel.querySelector('.num').textContent = String(s);
    // Kanji name on the plate, romaji under it when translations are on.
    const who = reel.querySelector('.who');
    const romaji = CAST[s][1].split(' ')[0];
    who.innerHTML = '';
    const ja = document.createElement('span');
    ja.className = 'ja';
    ja.textContent = CAST[s][0];
    who.appendChild(ja);
    if (i18n.lang()) {
      const tr = document.createElement('span');
      tr.className = 'tr';
      tr.textContent = romaji;
      who.appendChild(tr);
    }
    reel.title = CAST[s][1];
  }
  reels.forEach((r) => setSymbol(r, 7));

  const spinners = new Map();
  function startSpin(reel, speed = 'fast') {
    stopTimer(reel);
    reel.classList.remove('land', 'spinning', 'slow', 'lit');
    reel.classList.add(speed === 'fast' ? 'spinning' : 'slow');
    const every = speed === 'fast' ? 55 : 170;
    spinners.set(reel, setInterval(() => {
      setSymbol(reel, rand7());
      if (speed === 'fast' && reel === reels[0]) sound.tick();
    }, every));
  }
  function stopTimer(reel) {
    clearInterval(spinners.get(reel));
    spinners.delete(reel);
  }
  function land(reel, s) {
    stopTimer(reel);
    reel.classList.remove('spinning', 'slow', 'land');
    setSymbol(reel, s);
    void reel.offsetWidth;
    reel.classList.add('land');
    sound.clack();
  }
  async function spinAll(symbols, { stopAt = 3 } = {}) {
    const faster = currentMode === 'faster';
    reels.forEach((r) => startSpin(r));
    await sleep(faster ? 220 : 420);
    for (let i = 0; i < stopAt; i++) {
      land(reels[i], symbols[i]);
      await sleep(faster ? 90 : 170);
    }
  }

  // ---------- Machine state ----------
  const MODES = ['riichi', 'hot', 'win', 'miss', 'attention', 'done', 'heal', 'expanding'];
  let cabinet = null;
  let currentMode = 'normal';
  let riichiOn = false;
  let tensionTimer = null;

  // text: an i18n key, '' to clear, or undefined to keep the banner.
  function setCabinet(next, text, vars) {
    machine.classList.remove(...MODES);
    void machine.offsetWidth;
    if (next) machine.classList.add(...next.split(' '));
    cabinet = next;
    if (text !== undefined) say(text, vars);
  }
  function say(key, vars) {
    if (!key) {
      banner.innerHTML = '';
      delete banner.dataset.key;
    } else {
      i18n.put(banner, key, vars);
    }
  }

  // Static labels; run again when the language changes.
  let lastMode = { mode: 'normal', jitanLeft: 0 };
  let lastDomain = 'closed';
  function translateStatic() {
    i18n.put($('stage-sign'), 'line');
    i18n.put($('lbl-hold'), 'hold');
    i18n.put($('lbl-consec'), 'consecLabel');
    i18n.put($('lbl-spins'), 'spins');
    i18n.put($('lbl-jackpots'), 'jackpots');
    i18n.put($('lbl-renchan'), 'renchan');
    i18n.put($('lbl-domains'), 'domains');
    i18n.put($('round-label'), 'unlimited');
    i18n.put($('intro-caption'), 'sureHit');
    $('intro-en').textContent = i18n.t('expandFull').tr;
    i18n.put($('fever-title'), 'jackpotWord');
    i18n.put($('cutin-title'), 'cutinTitle');
    i18n.put($('cutin-line'), 'cutinLine');
    i18n.put($('title-name'), 'titleName');
    i18n.put($('intro-ver'), 'introVer');
    i18n.put($('intro-odds'), 'odds');
    i18n.put($('sfx-do'), 'sfxDo');
    i18n.put($('sfx-don'), 'sfxDon');
    i18n.put($('sfx-card'), 'sfxDododo');
    document.querySelectorAll('.gogo').forEach((g) => i18n.put(g, 'sfxGogo'));
    i18n.put($('shutter-label'), 'shutter');
    i18n.put($('round-song'), 'roundSong');
    i18n.put($('lbl-best'), 'bestLabel');
    if (!ticker.dataset.live) i18n.put(ticker, 'tickerStart');
    i18n.put($('demo-btn'), 'previewDemo');
    i18n.put($('preview-note'), 'previewNote');
    i18n.put($('riichi-call'), 'riichiCall');
    i18n.put($('yume-tag'), 'yumeTag');
    i18n.put($('tate-tr'), 'expand');
    document.querySelectorAll('.reel').forEach((r) => setSymbol(r, Number(r.dataset.s) || 7));
    i18n.put($('demo-tag'), 'demo');
    $('rules').textContent = Array.from({ length: 8 }, () => i18n.rulesText()).join('　');
    const hint = (key) => { const { ja, tr } = i18n.t(key); return tr ? `${ja}\n${tr}` : ja; };
    document.querySelector('.holds').title = hint('holdHint');
    document.querySelector('.consec').title = hint('consecHint');
    $('best').title = hint('bestHint');
    document.querySelector('.title .cr').title = hint('crHint');
    if (banner.dataset.key) i18n.put(banner, banner.dataset.key, banner.dataset.vars ? JSON.parse(banner.dataset.vars) : undefined);
    applyMode(lastMode.mode, lastMode.jitanLeft, lastMode.odds);
    applyDomain(lastDomain);
    applyStage(lastStage);
    setWho();
    renderSessions(lastSessions);
  }

  function setScene(scene) {
    lcd.dataset.scene = scene;
    if (scene !== 'riichi') {
      lcd.classList.remove('playing', 'won', 'lost', 'yume');
      delete lcd.dataset.scenario;
      delete lcd.dataset.stars;
    }
  }

  // The badge names the mode and the jackpot odds that come with it.
  function applyMode(mode, jitanLeft, odds = DEFAULT_ODDS[mode] || 239) {
    currentMode = mode || 'normal';
    lastMode = { mode: currentMode, jitanLeft, odds };
    const keys = MODE_KEYS[currentMode] || MODE_KEYS.normal;
    const badge = $('mode');
    badge.dataset.mode = currentMode;
    if (currentMode === 'faster' && jitanLeft) i18n.put(badge, 'modeFasterLeft', { n: jitanLeft, odds });
    else i18n.put(badge, keys.badge, { odds });
    machine.dataset.mode = currentMode;
    lcd.dataset.mode = currentMode;
    i18n.put($('stage-sub'), keys.stage);
  }

  function applyDomain(domain) {
    lastDomain = domain;
    machine.dataset.domain = domain;
    i18n.put($('domain-state'), { open: 'domainOpen', round: 'domainRound', closed: 'domainClosed' }[domain] || 'domainClosed');
    if (lastSessions) renderSessions();
  }

  let lastStage = { holds: [], best: null, consecutive: 0, guaranteed: false };
  function applyStage(stage) {
    if (!stage) return;
    lastStage = stage;
    holdEls.forEach((el, i) => {
      const c = stage.holds[i];
      if (c && el.dataset.c !== c) {
        el.dataset.c = c;
        el.classList.remove('new');
        void el.offsetWidth;
        el.classList.add('new');
      } else if (!c) {
        delete el.dataset.c;
      }
    });
    // 疑似連: one redo shows x2, two x3, three x4 (confirmed).
    consecEls.forEach((el, i) => el.classList.toggle('on', i < stage.consecutive));
    // The ×N stamp in the corner of the screen, as in the chapter 187 panel.
    const stamp = $('xstamp');
    stamp.textContent = stage.consecutive ? `×${stage.consecutive + 1}` : '';
    stamp.classList.toggle('on', stage.consecutive > 0);
    stamp.classList.toggle('max', stage.consecutive >= 3);
    document.querySelector('.consec').classList.toggle('full', stage.consecutive >= 3);
    // Best effect so far this stage: what the chance looks like.
    const best = $('best');
    if (stage.guaranteed) {
      i18n.put(best, 'kakuteiShort');
      best.dataset.c = 'rainbow';
      best.classList.add('kakutei');
    } else {
      best.classList.remove('kakutei');
      const key = { green: 'colorGreen', red: 'colorRed', gold: 'colorGold', rainbow: 'colorRainbow' }[stage.best] || 'bestNone';
      i18n.put(best, key);
      if (stage.best) best.dataset.c = stage.best;
      else delete best.dataset.c;
    }
  }

  function updateStats(stats) {
    if (!stats) return;
    $('s-spins').textContent = String(stats.spins).padStart(3, '0');
    $('s-jackpots').textContent = String(stats.jackpots);
    $('s-renchan').textContent = String(stats.renchan);
    $('s-domains').textContent = String(stats.domains);
  }

  function showPop(kind, key, vars) {
    pop.dataset.kind = kind;
    i18n.put(pop, key, vars);
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
  }

  // Idle: the screen dims and plays デモ画面 like a machine nobody is
  // sitting at, slowly showing the cast on the reels.
  let idleTimer;
  let attract = null;
  function stopAttract() {
    clearInterval(attract);
    attract = null;
    lcd.classList.remove('attract');
  }
  function startAttract() {
    if (attract || reduced() || riichiOn || lcd.dataset.scene !== 'stage') return;
    lcd.classList.add('attract');
    let n = 0;
    attract = setInterval(() => {
      n = (n % 7) + 1;
      reels.forEach((r, i) => setSymbol(r, ((n + i * 2) % 7) + 1));
    }, 2600);
  }
  function wake() {
    machine.classList.remove('idle');
    stopAttract();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (cfg.idleDim) machine.classList.add('idle');
      startAttract();
    }, 90000);
  }

  // ---------- The conversations ----------
  // One machine plays for every conversation. Each active one gets a line:
  // its colour, project, title, what it is doing and its last action, so the
  // list grows and shrinks with the conversations in progress (up to the
  // "lines" setting). One that finished stays a little while, faded. The
  // line of the conversation that just acted lights up. With no active
  // conversation (or 0 lines) a single line names the last one to act.
  let currentWho = null;
  let lastSessions = null;
  let linesWanted = Infinity;
  const RECENT_MS = 2 * 60 * 1000; // a finished conversation keeps its line this long
  const ACTIVE_STATES = new Set(['working', 'riichi', 'waiting']);
  const STATE_KEYS = { idle: 'stIdle', working: 'stWorking', riichi: 'stRiichi', waiting: 'stWaiting', done: 'stDone', round: 'stRound' };

  function setWho(who) {
    if (who) currentWho = who;
    const w = currentWho;
    const dot = $('who-dot');
    if (!w) {
      dot.style.removeProperty('--c');
      $('who-label').textContent = '';
      i18n.put($('who-title'), 'whoNone');
    } else {
      dot.style.setProperty('--c', w.color);
      $('who-label').textContent = w.label;
      $('who-title').textContent = w.title ? `“${w.title}”` : '';
      machine.style.setProperty('--who', w.color);
    }
    markCurrent();
  }

  function markCurrent() {
    for (const li of $('conv-lines').children) li.classList.toggle('now', Boolean(currentWho) && li.dataset.id === currentWho.id);
  }

  function renderSessions(msg) {
    if (msg) lastSessions = msg;
    const now = Date.now();
    const list = (lastSessions ? lastSessions.list : []).filter((s) => ACTIVE_STATES.has(s.state) || now - s.lastAt < RECENT_MS);
    const box = $('conv-lines');
    const show = linesWanted > 0 && list.length > 0;
    if (pointerOver) setPointer(false);
    box.hidden = !show;
    $('who-row').hidden = show;
    box.innerHTML = '';
    if (!show) return;
    const inRound = machine.dataset.domain === 'round';
    for (const s of list.slice(0, linesWanted)) {
      const li = document.createElement('li');
      li.className = 'conv';
      li.dataset.id = s.id;
      const state = inRound && (s.state === 'working' || s.state === 'riichi') ? 'round' : s.state;
      li.dataset.state = state;
      li.style.setProperty('--c', s.color);
      const dot = document.createElement('i');
      dot.className = 'dot';
      const name = document.createElement('b');
      name.className = 'name';
      name.textContent = s.label;
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = s.title ? `“${s.title}”` : '';
      const chip = document.createElement('span');
      chip.className = 'st';
      i18n.put(chip, STATE_KEYS[state] || 'stIdle');
      const act = document.createElement('span');
      act.className = 'act';
      act.textContent = s.detail || '';
      li.append(dot, name, title, chip, act);
      if (s.link) {
        li.classList.add('linked');
        const { ja, tr } = i18n.t('openConv');
        li.title = tr ? `${ja} · ${tr}` : ja;
      }
      box.appendChild(li);
    }
    fitLines(list.length);
    markCurrent();
  }

  // Lines never push the machine off the screen: the last ones give way to
  // a "+N more" line.
  const SCREEN_MARGIN = 16;
  function fitLines(total) {
    const box = $('conv-lines');
    const fits = () => machine.getBoundingClientRect().height <= innerHeight - SCREEN_MARGIN * 2;
    let shown = box.children.length;
    if (shown >= total && fits()) return;
    const more = document.createElement('li');
    more.className = 'conv more';
    box.appendChild(more);
    i18n.put(more, 'moreConv', { n: total - shown });
    while (shown > 1 && !fits()) {
      box.removeChild(box.children[shown - 1]);
      shown -= 1;
      i18n.put(more, 'moreConv', { n: total - shown });
    }
  }

  // A line with a link opens its conversation in the Claude app. The desktop
  // overlay is click-through, so it asks to take clicks while the pointer is
  // over such a line.
  // Taking clicks is dangerous: the overlay covers the whole screen, so it
  // must let go as soon as the pointer is not on such a line. Every pointer
  // move anywhere re-checks; while over a line the request is renewed, and
  // the desktop app lets go by itself if renewals stop (see onPointer).
  const post = (url) => fetch(url, { method: 'POST' }).catch(() => {});
  const convLines = $('conv-lines');
  let pointerOver = false;
  let renewedAt = 0;
  function setPointer(over) {
    if (over && pointerOver && Date.now() - renewedAt < 1000) return;
    if (!over && !pointerOver) return;
    pointerOver = over;
    renewedAt = Date.now();
    post(`/pointer?over=${over ? 1 : 0}`);
  }
  const overLink = (target) => Boolean(target && target.closest && target.closest('.conv.linked')) && !document.body.classList.contains('fever-on');
  document.addEventListener('mousemove', (ev) => setPointer(overLink(ev.target)));
  document.addEventListener('mouseleave', () => setPointer(false));
  addEventListener('blur', () => setPointer(false));
  convLines.addEventListener('click', (ev) => {
    const li = ev.target.closest('.conv.linked');
    if (!li) return;
    li.classList.add('opening');
    setTimeout(() => li.classList.remove('opening'), 600);
    post(`/open?session=${encodeURIComponent(li.dataset.id)}`);
  });

  // Finished conversations leave the list after a while.
  setInterval(() => lastSessions && renderSessions(), 15000);

  // ---------- Round countdown (4:11) ----------
  let roundEndsAt = null;
  setInterval(() => {
    if (!roundEndsAt) return;
    const left = Math.max(0, roundEndsAt - Date.now());
    const s = Math.ceil(left / 1000);
    $('countdown').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 250);

  // ---------- 大当たり: the domain disappears ----------
  // Ch. 187: on a jackpot the domain disappears and the music starts. The
  // barrier breaks into shards; then cursed energy and music notes rise.
  function buildShards() {
    const box = $('shards');
    box.innerHTML = '';
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const j = () => (Math.random() - 0.5) * 0.18;
      const pt = (a, r) => `${50 + Math.cos(a) * r}% ${50 + Math.sin(a) * r}%`;
      const shard = document.createElement('i');
      shard.style.clipPath = `polygon(${50 + j() * 40}% ${50 + j() * 40}%, ${pt(a0 + j(), 160)}, ${pt(a1 + j(), 160)})`;
      const mid = (a0 + a1) / 2;
      shard.style.setProperty('--dx', `${Math.cos(mid) * (40 + Math.random() * 30)}vmax`);
      shard.style.setProperty('--dy', `${Math.sin(mid) * (40 + Math.random() * 30)}vmax`);
      shard.style.setProperty('--rot', `${(Math.random() - 0.5) * 90}deg`);
      shard.style.setProperty('--delay', `${Math.random() * 0.12}s`);
      box.appendChild(shard);
    }
  }

  // Cursed energy: thin flame tongues rising from the bottom of the screen.
  function buildAura() {
    const box = $('aura');
    box.innerHTML = '';
    for (let i = 0; i < 22; i++) {
      const f = document.createElement('i');
      f.style.left = `${(i / 22) * 100 + (Math.random() - 0.5) * 4}%`;
      f.style.height = `${25 + Math.random() * 35}vh`;
      f.style.width = `${3 + Math.random() * 4}vw`;
      f.style.setProperty('--delay', `${-Math.random() * 1.6}s`);
      f.style.setProperty('--dur', `${1.2 + Math.random() * 0.9}s`);
      box.appendChild(f);
    }
  }

  function buildNotes() {
    const box = $('notes');
    box.innerHTML = '';
    const glyphs = ['♪', '♫', '♬', '♩'];
    for (let i = 0; i < 18; i++) {
      const note = document.createElement('i');
      note.textContent = glyphs[i % glyphs.length];
      note.style.left = `${4 + Math.random() * 92}%`;
      note.style.setProperty('--delay', `${Math.random() * 1.8}s`);
      note.style.setProperty('--sway', `${(Math.random() - 0.5) * 80}px`);
      note.style.fontSize = `${18 + Math.random() * 26}px`;
      box.appendChild(note);
    }
  }

  function feverText(e) {
    if (e.hiddenRevealed) return { key: 'feverHidden', cls: 'hidden' };
    if (e.odd) return { key: 'feverIncreased', cls: '' };
    return { key: 'feverFaster', cls: 'faster' };
  }

  const FEVER_MS = 6200;
  const SHATTER_AT = 2300;
  function showFever(e) {
    const s = e.reels[0];
    document.querySelectorAll('#fever-reels .reel').forEach((r) => setSymbol(r, s));
    const { key, cls } = feverText(e);
    const sub = $('fever-sub');
    sub.className = `sub ${cls}`.trim();
    i18n.put(sub, key);
    i18n.put($('fever-sub2'), 'feverRound');
    $('fever-song').textContent = `${e.guaranteed ? '確定 · ' : ''}♪ Admiring You ♪`;
    buildShards();
    buildAura();
    buildNotes();
    fever.classList.remove('on', 'broken');
    void fever.offsetWidth;
    fever.classList.add('on');
    document.body.classList.add('fever-on');
    setPointer(false);
    // The domain holds while the cards line up, then breaks.
    setTimeout(() => {
      fever.classList.add('broken');
      sound.shatter();
    }, SHATTER_AT);
    setTimeout(() => {
      fever.classList.remove('on', 'broken');
      document.body.classList.remove('fever-on');
    }, FEVER_MS);
  }

  // ---------- Riichi helpers ----------
  function startTension() {
    clearInterval(tensionTimer);
    sound.tension();
    tensionTimer = setInterval(() => sound.tension(), 1100);
  }
  function stopTension() {
    clearInterval(tensionTimer);
    tensionTimer = null;
  }

  // 群予告: a swarm crosses the screen. Trains are normal; anything else
  // confirms the jackpot (rule sheet).
  async function groupNotice(kind) {
    const swarm = $('swarm');
    swarm.innerHTML = '';
    const glyph = kind === 'other' ? '💗' : '🚃';
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      s.textContent = glyph;
      s.style.setProperty('--y', `${8 + Math.random() * 70}%`);
      s.style.setProperty('--d', `${Math.random() * 0.6}s`);
      swarm.appendChild(s);
    }
    swarm.classList.remove('go');
    void swarm.offsetWidth;
    swarm.classList.add('go');
    say('group');
    sound.swarm();
    await sleep(1500);
    if (kind === 'other') {
      showPop('kakutei', 'groupOther');
      sound.kakutei();
      sound.say('確定');
      await sleep(900);
    }
  }

  // 天ノ川カットイン: senpai joins the riichi.
  function cutIn() {
    const el = $('cutin');
    el.classList.remove('go');
    void el.offsetWidth;
    el.classList.add('go');
    sound.cutin();
  }

  async function resolveRiichi(e, won) {
    stopTension();
    const wasPlaying = riichiOn;
    riichiOn = false;
    if (!wasPlaying) {
      // Overlay joined mid-riichi: play a short version.
      await spinAll(e.reels, { stopAt: 2 });
      showRiichi(e);
      await sleep(1200);
    }
    lcd.classList.remove('playing');
    if (e.scenario.id === 'final') {
      // The train leaves first; only then do we learn where Yume is (ch. 183).
      lcd.classList.add('lost');
      i18n.put($('riichi-result'), 'tease');
      await sleep(1500);
      lcd.classList.remove('lost');
    }
    lcd.classList.add(won ? 'won' : 'lost');
    i18n.put($('riichi-result'), `${e.scenario.id}${won ? 'Win' : 'Lose'}`);
    startSpin(reels[2], 'fast');
    await sleep(700);
    if (!won) {
      land(reels[2], e.reels[0]); // stop on the winning number for a heartbeat…
      await sleep(260);
    }
    land(reels[2], e.reels[2]); // …then slip one notch (or stay, on a win)
    if (won) reels.forEach((r) => r.classList.add('lit'));
    await sleep(500);
  }

  function showRiichi(e) {
    const scene = SCENES[e.scenario.id];
    lcd.classList.remove('won', 'lost');
    lcd.classList.toggle('yume', Boolean(e.chanceUps && e.chanceUps.yume));
    lcd.dataset.scenario = e.scenario.id;
    lcd.dataset.stars = String(e.scenario.stars);
    i18n.put($('riichi-jp'), e.scenario.id);
    i18n.put($('riichi-stars'), 'expectationStars', { stars: STARS[e.scenario.stars] });
    i18n.put($('track-from'), scene.fromKey);
    i18n.put($('track-to'), scene.toKey);
    $('runner').textContent = scene.runner;
    $('riichi-result').innerHTML = '';
    setScene('riichi');
    lcd.classList.add('playing');
  }

  async function expandCompact() {
    setCabinet('expanding', 'expand');
    showPop('expand', 'expandFull');
    sound.expand();
    await sleep(1600);
  }

  async function expandFull() {
    intro.classList.remove('on');
    void intro.offsetWidth;
    intro.classList.add('on');
    sound.expand();
    await sleep(3250);
  }

  // ---------- Event handlers ----------
  const handlers = {
    async expand(e) {
      applyMode(e.mode, e.jitanLeft, e.odds);
      const mode = introMode();
      if (mode === 'full') await expandFull();
      else if (mode === 'compact') await expandCompact();
      applyDomain('open');
      applyStage(e.stage);
      setScene('stage');
      setCabinet(null, 'expand');
      if (mode === 'full') {
        await sleep(350);
        intro.classList.remove('on');
      }
    },

    async spin(e) {
      applyMode(e.mode, e.jitanLeft, e.odds);
      if (riichiOn) return;
      const { kind, color } = e.indicator;
      setCabinet(null, e.stage.guaranteed ? 'kakuteiShort' : '');
      // 先読み: a hot effect lights the screen edge before anything else.
      if ((color === 'gold' || color === 'rainbow') && !e.indicator.failed) {
        lcd.dataset.hot = color;
        lcd.classList.remove('hotflash');
        void lcd.offsetWidth;
        lcd.classList.add('hotflash');
      }
      if (kind === 'door') {
        doors.dataset.color = color;
        doors.classList.remove('slam');
        void doors.offsetWidth;
        doors.classList.add('slam');
        sound.door(color);
        await sleep(560);
      } else if (kind === 'ball') {
        sound.ball(color);
      } else if (e.indicator.failed) {
        showPop('reset', 'consecFail');
        sound.miss();
      } else {
        const x = e.stage.consecutive + 1;
        showPop('consec', 'consec', { n: x });
        sound.consec(x);
      }
      applyStage(e.stage);
      await spinAll(e.reels);
      if (COLOR_CALL[color] && !e.indicator.failed) say(COLOR_CALL[color]);
      if (e.jitanEnded) showPop('close', 'jitanEnd');
      if (kind === 'consecutive' && !e.indicator.failed && e.stage.consecutive === 3) {
        showPop('kakutei', 'consec4');
        sound.kakutei();
        sound.say('確定');
        say('consec4Banner');
        await sleep(1000);
      }
    },

    async hold(e) {
      applyStage(e.stage);
      if (e.indicator.kind === 'ball') sound.ball(e.indicator.color);
    },

    async riichi(e) {
      applyStage(e.stage);
      setCabinet(null, '');
      const ups = e.chanceUps || {};
      if (ups.group) await groupNotice(ups.group);
      await spinAll(e.reels, { stopAt: 2 });
      sound.riichi();
      showRiichi(e);
      startSpin(reels[2], 'slow');
      riichiOn = true;
      const hot = e.scenario.stars === 3 || ups.yume || ups.amanokawa;
      setCabinet(hot ? 'riichi hot' : 'riichi', e.riichiKind === 'lottery' ? 'riichiLottery' : 'riichi');
      sound.say('リーチ');
      startTension();
      if (ups.yume) showPop('yume', 'yume');
      if (ups.amanokawa) {
        await sleep(1400);
        if (riichiOn) cutIn();
      }
    },

    async jackpot(e) {
      await resolveRiichi(e, true);
      setCabinet('win', 'jackpot');
      applyMode(e.mode, e.jitanLeft, e.odds);
      applyDomain('round');
      applyStage(e.stage);
      sound.jackpot();
      sound.say('大当たり');
      updateStats(e.stats);
      custom.play('round', { until: e.roundEndsAt });
      const mode = jackpotMode();
      if (mode === 'full') {
        showFever(e);
        await sleep(1800);
      } else {
        showPop('kakutei', mode === 'compact' ? feverText(e).key : 'jackpot');
        await sleep(1400);
      }
      roundEndsAt = e.roundEndsAt;
      setScene('round');
      if (mode === 'full') await sleep(FEVER_MS - 1800);
      // Ch. 187: Hakari calls for the music to start.
      showPop('kakutei', 'musicStart');
      await sleep(1300);
      if (e.stats && e.stats.renchan >= 2) {
        showPop('kakutei', 'renchan2', { n: e.stats.renchan });
        sound.kakutei();
        await sleep(1300);
      }
      setCabinet(null, 'unlimited');
    },

    async miss(e) {
      await resolveRiichi(e, false);
      sound.miss();
      const reason = { 'tests-red': 'testsRed', expired: 'timeUp' }[e.reason] || 'miss';
      setCabinet('miss', reason);
      await sleep(1600);
      setScene('stage');
      applyStage(e.stage);
      showPop('reset', 'reset');
      await sleep(700);
    },

    async heal() {
      setCabinet('heal', 'healBanner');
      showPop('heal', 'heal');
      sound.heal();
      await sleep(900);
      setCabinet(null, 'unlimited');
    },

    async bonus() {
      showPop('bonus', 'bonus');
      sound.bonus();
      await sleep(600);
    },

    async 'round-end'(e) {
      roundEndsAt = null;
      custom.stop('round');
      applyMode(e.mode, e.jitanLeft, e.odds);
      applyDomain('closed');
      setScene('stage');
      setCabinet(null, 'roundEnd');
      showPop('close', 'roundEnd');
      sound.close();
      await sleep(900);
    },

    async collapse(e) {
      applyDomain('closed');
      applyStage(e.stage);
      setScene('stage');
      showPop('close', 'collapse');
      sound.close();
      setCabinet(null, 'collapse');
      await sleep(700);
    },

    async attention() {
      setCabinet('attention', currentWho ? 'yourTurnFrom' : 'yourTurn', { who: currentWho ? currentWho.label : '' });
      sound.chime();
    },

    // Another conversation (not on screen) needs you.
    async call(e) {
      setCabinet('attention', 'yourTurnFrom', { who: e.who ? e.who.label : '' });
      showPop('kakutei', 'yourTurnFrom', { who: e.who ? e.who.label : '' });
      sound.chime();
      await sleep(1200);
    },

    async 'turn-end'() {
      if (cabinet === 'attention' || machine.dataset.domain === 'round') return;
      setCabinet('done', 'done');
    },
  };

  // ---------- Queue ----------
  const queue = [];
  let busy = false;
  async function pump() {
    if (busy) return;
    busy = true;
    while (queue.length) {
      const e = queue.shift();
      try {
        await handlers[e.type](e);
      } catch (err) {
        console.error(err);
      }
      updateStats(e.stats);
    }
    busy = false;
  }

  function hello(e) {
    applyConfig(e.config);
    if (e.who !== undefined) {
      currentWho = e.who;
      setWho(e.who);
    }
    if (e.sessions) renderSessions(e.sessions);
    updateStats(e.stats);
    applyMode(e.mode, e.jitanLeft, e.odds);
    applyDomain(e.domain);
    applyStage(e.stage);
    if (e.domain === 'round' && e.roundEndsAt) {
      roundEndsAt = e.roundEndsAt;
      // Back on a conversation that is mid-round (or the page reloaded): the music goes on.
      if (!custom.playing('round')) custom.play('round', { until: e.roundEndsAt });
      setScene('round');
      setCabinet(null, 'unlimited');
    } else {
      roundEndsAt = null;
      custom.stop('round');
      riichiOn = false;
      stopTension();
      setScene('stage');
      setCabinet(null, e.domain === 'open' ? 'expand' : 'ready');
    }
  }

  function receive(e) {
    if (e.type === 'hello') return hello(e);
    if (e.type === 'config') return applyConfig(e.config);
    if (e.type === 'sessions') return renderSessions(e);
    wake();
    if (e.label) $('domain-state').title = e.label;
    if (e.who) setWho(e.who);
    if (e.detail) {
      ticker.dataset.live = '1';
      ticker.textContent = e.detail;
    }
    if (e.type === 'status') {
      if (cabinet === 'attention' || cabinet === 'done') setCabinet(riichiOn ? 'riichi' : null, riichiOn ? 'riichi' : '');
      return;
    }
    if (!handlers[e.type]) return;
    if (e.type === 'spin') {
      // Under a burst of tool calls, drop queued plain green spins.
      for (let i = queue.length - 1; i >= 0; i--) {
        const q = queue[i];
        if (q.type === 'spin' && q.indicator.kind !== 'consecutive' && q.indicator.color === 'green') queue.splice(i, 1);
      }
    }
    queue.push(e);
    pump();
  }

  // ---------- Connection ----------
  const source = new EventSource('/stream');
  source.onmessage = (msg) => {
    try { receive(JSON.parse(msg.data)); } catch (err) { console.error(err); }
  };
  source.onerror = () => i18n.put($('domain-state'), 'reconnecting');
  applyConfig();
  applyMode('normal');
  applyDomain('closed');
  custom.load();
  wake();
})();
