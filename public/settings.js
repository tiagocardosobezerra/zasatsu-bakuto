(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const status = $('status');
  let config = null;

  // The page follows the same language choice as the overlay translation.
  const TEXT = {
    en: {
      windowTitle: 'Idle Death Gamble · Settings',
      settings: 'settings', game: 'Game', machine: 'On screen', corner: 'Corner', tl: 'Top left', tr: 'Top right', bl: 'Bottom left', br: 'Bottom right',
      size: 'Size', opacity: 'Opacity', idleDim: 'Dim after 90 s without activity', onTop: 'Always on top of other windows', notify: 'System notification when an agent needs you and the machine is discreet or hidden', appears: 'What appears',
      expansion: 'Domain Expansion 領域展開', jackpot: 'Jackpot 大当たり', full: 'Full screen', compact: 'On the machine', off: 'Off',
      showCrest: 'Title and mode', showLamps: 'Lamps', showIndicators: '保留 / 疑似連 row', showTicker: 'Current tool', showStats: 'Counters', showUsage: 'Plan usage (session and week)',
      language: 'Language', translation: 'Translation under the Japanese', langAuto: 'Computer language', langJa: 'Japanese only (日本語のみ)',
      sound: 'Sound', volume: 'Volume', effects: 'Machine sounds', music: 'Your music files (round / expansion)', muted: 'Mute everything',
      art: 'Your art and music', folder: 'Folder:',
      names: 'Images: <code>intro.png</code>, <code>jackpot.png</code>, <code>reel-1.png</code> … <code>reel-7.png</code>. Music: <code>round.mp3</code> (plays during 4:11). Sounds that replace the built-in ones: <code>expand</code>, <code>riichi</code>, <code>kyuin</code>, <code>door</code>, <code>ball</code>, <code>consec</code>, <code>kakutei</code>, <code>jackpot</code>, <code>miss</code>, <code>heal</code> (.mp3/.ogg/.wav). Reload the overlay after adding files.',
      smart: 'Smart', smartHint: '<b>Smart</b>: full screen the first time, and again after 10 quiet minutes; on the machine the rest of the time.',
      guideTitle: '遊び方 · How to play', guideHint: 'What every effect on the machine means, step by step.', guideOpen: 'Open the guide',
      discreet: 'Discreet mode', discreetHint: 'For work: mini machine, no sound, nothing full screen. Your other settings come back when you switch it off.',
      layout: 'Layout', layoutNormal: 'Normal', layoutCompact: 'Compact', layoutMini: 'Mini', lines: 'Conversation lines', linesHint: 'One line per conversation in progress, up to this many. Unlimited: as many as fit on the screen.', linesAll: 'Unlimited', machines: 'Machines', machinesShared: 'One for all', machinesEach: 'One per conversation', machinesHint: 'One for all: every conversation spins the same machine and adds to the same totals, saved when you close the app. One per conversation: each has its own machine, and the screen follows the one you last wrote to.',
      motion: 'Motion', motionAuto: 'Follow the system', motionFull: 'Full', motionReduced: 'Reduced', motionNote: 'Your system asks apps for less motion, so the full-screen effects show on the machine instead. Pick Full to see them anyway.',
      voice: 'Japanese announcer (リーチ! 大当たり!)', voiceMissing: 'No Japanese voice on this computer. Windows: Settings → Time & language → Speech → Add voices → Japanese.', voiceOk: 'Japanese voice found: ',
      previewExpand: 'Preview 領域展開', previewJackpot: 'Preview 大当たり', demo: 'Play the demo', reset: 'Reset to defaults',
      ready: 'Changes apply right away.', saved: 'Saved', saveFail: 'Could not save. Is the domain open (ryoiki tenkai)?', notRunning: 'The domain is not open. Run "ryoiki tenkai".',
      playing: 'Playing on the overlay…', demoPlaying: 'Demo playing on the overlay (about 55 s)…', noFiles: 'No files yet.',
    },
    pt: {
      windowTitle: 'Idle Death Gamble · Configurações',
      settings: 'configurações', game: 'Jogo', machine: 'Na tela', corner: 'Canto', tl: 'Superior esquerdo', tr: 'Superior direito', bl: 'Inferior esquerdo', br: 'Inferior direito',
      size: 'Tamanho', opacity: 'Opacidade', idleDim: 'Escurecer após 90 s sem atividade', onTop: 'Sempre na frente das outras janelas', notify: 'Notificação do sistema quando um agente precisar de você e a máquina estiver discreta ou escondida', appears: 'O que aparece',
      expansion: 'Expansão de Domínio 領域展開', jackpot: 'Jackpot 大当たり', full: 'Tela cheia', compact: 'Só na máquina', off: 'Desligado',
      showCrest: 'Título e modo', showLamps: 'Luzes', showIndicators: 'Linha 保留 / 疑似連', showTicker: 'Ferramenta atual', showStats: 'Contadores', showUsage: 'Uso do plano (sessão e semana)',
      language: 'Idioma', translation: 'Tradução embaixo do japonês', langAuto: 'Idioma do computador', langJa: 'Só japonês (日本語のみ)',
      sound: 'Som', volume: 'Volume', effects: 'Sons da máquina', music: 'Suas músicas (rodada / expansão)', muted: 'Silenciar tudo',
      art: 'Sua arte e música', folder: 'Pasta:',
      names: 'Imagens: <code>intro.png</code>, <code>jackpot.png</code>, <code>reel-1.png</code> … <code>reel-7.png</code>. Música: <code>round.mp3</code> (toca durante os 4:11). Sons que substituem os da máquina: <code>expand</code>, <code>riichi</code>, <code>kyuin</code>, <code>door</code>, <code>ball</code>, <code>consec</code>, <code>kakutei</code>, <code>jackpot</code>, <code>miss</code>, <code>heal</code> (.mp3/.ogg/.wav). Recarregue o overlay depois de adicionar arquivos.',
      smart: 'Inteligente', smartHint: '<b>Inteligente</b>: tela cheia na primeira vez e de novo depois de 10 minutos parado; nas outras, só na máquina.',
      guideTitle: '遊び方 · Como jogar', guideHint: 'O que cada efeito da máquina significa, passo a passo.', guideOpen: 'Abrir o guia',
      discreet: 'Modo discreto', discreetHint: 'Para o trabalho: máquina mini, sem som, nada em tela cheia. Suas outras configurações voltam quando você desligar.',
      layout: 'Formato', layoutNormal: 'Normal', layoutCompact: 'Compacto', layoutMini: 'Mini', lines: 'Linhas de conversa', linesHint: 'Uma linha por conversa em andamento, até este número. Ilimitado: quantas couberem na tela.', linesAll: 'Ilimitado', machines: 'Máquinas', machinesShared: 'Uma para todas', machinesEach: 'Uma por conversa', machinesHint: 'Uma para todas: toda conversa gira a mesma máquina e soma no mesmo placar, salvo quando você fecha o app. Uma por conversa: cada uma tem a sua máquina, e a tela segue a última conversa em que você escreveu.',
      motion: 'Movimento', motionAuto: 'Seguir o sistema', motionFull: 'Completo', motionReduced: 'Reduzido', motionNote: 'Seu sistema está pedindo menos movimento aos apps, por isso os efeitos de tela cheia aparecem só na máquina. Escolha Completo para vê-los mesmo assim.',
      voice: 'Locutor japonês (リーチ! 大当たり!)', voiceMissing: 'Nenhuma voz japonesa neste computador. Windows: Configurações → Hora e idioma → Fala → Adicionar vozes → Japonês.', voiceOk: 'Voz japonesa encontrada: ',
      previewExpand: 'Prévia 領域展開', previewJackpot: 'Prévia 大当たり', demo: 'Tocar a demo', reset: 'Restaurar padrão',
      ready: 'As mudanças valem na hora.', saved: 'Salvo', saveFail: 'Não foi possível salvar. O domínio está aberto (ryoiki tenkai)?', notRunning: 'O domínio não está aberto. Rode "ryoiki tenkai".',
      playing: 'Tocando no overlay…', demoPlaying: 'Demo tocando no overlay (uns 55 s)…', noFiles: 'Nenhum arquivo ainda.',
    },
  };
  let words = TEXT.en;

  function pickLanguage(choice) {
    const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
    const code = TEXT[choice] ? choice : nav;
    words = TEXT[code] || TEXT.en;
    document.documentElement.lang = TEXT[code] ? code : 'en';
    document.title = words.windowTitle;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = words[el.dataset.t]; });
    document.querySelectorAll('[data-t-html]').forEach((el) => { el.innerHTML = words[el.dataset.tHtml]; });
    document.querySelectorAll('[data-t-label]').forEach((el) => el.setAttribute('aria-label', words[el.dataset.tLabel]));
    document.querySelectorAll('.corners button').forEach((b) => { b.title = words[b.dataset.pos]; });
    showVoice();
  }

  // Tell people whether the announcer can actually speak.
  function showVoice() {
    if (!('speechSynthesis' in window)) return;
    const ja = speechSynthesis.getVoices().find((v) => /^ja/i.test(v.lang));
    $('voice-hint').textContent = ja ? `${words.voiceOk}${ja.name}` : words.voiceMissing;
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = showVoice;

  function say(text, kind = '') {
    status.textContent = text;
    status.className = `status ${kind}`.trim();
  }

  function render() {
    document.querySelectorAll('.corners button').forEach((b) => {
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(b.dataset.pos === config.position));
    });
    $('scale').value = Math.round(config.scale * 100);
    $('scale-out').value = `${Math.round(config.scale * 100)}%`;
    $('opacity').value = Math.round(config.opacity * 100);
    $('opacity-out').value = `${Math.round(config.opacity * 100)}%`;
    $('idleDim').checked = config.idleDim;
    $('onTop').checked = config.onTop !== false;
    $('notify').checked = config.notify !== false;
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(config[seg.dataset.key]))));
    });
    document.querySelectorAll('[data-show]').forEach((c) => { c.checked = config.show[c.dataset.show]; });
    $('volume').value = Math.round(config.sound.volume * 100);
    $('volume-out').value = `${Math.round(config.sound.volume * 100)}%`;
    $('effects').checked = config.sound.effects;
    $('music').checked = config.sound.music;
    $('muted').checked = config.muted;
    $('voice').checked = config.sound.voice !== false;
    $('discreet').checked = config.discreet;
    $('translation').value = config.translation;
    pickLanguage(config.translation);
    const systemReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('motion-hint').hidden = !(systemReduce && config.motion === 'auto');
    $('motion-hint').textContent = words.motionNote;
  }

  let pending = {};
  let timer = null;
  function save(patch) {
    for (const [k, v] of Object.entries(patch)) {
      pending[k] = v && typeof v === 'object' ? { ...(pending[k] || {}), ...v } : v;
    }
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const body = pending;
      pending = {};
      try {
        const res = await fetch('/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(res.status);
        config = await res.json();
        render();
        say(words.saved, 'ok');
      } catch {
        say(words.saveFail, 'err');
      }
    }, 150);
  }

  document.querySelectorAll('.corners button').forEach((b) => b.addEventListener('click', () => {
    config.position = b.dataset.pos;
    render();
    save({ position: b.dataset.pos });
  }));
  for (const id of ['scale', 'opacity']) {
    $(id).addEventListener('input', () => {
      $(`${id}-out`).value = `${$(id).value}%`;
      save({ [id]: Number($(id).value) / 100 });
    });
  }
  $('idleDim').addEventListener('change', () => save({ idleDim: $('idleDim').checked }));
  $('onTop').addEventListener('change', () => save({ onTop: $('onTop').checked }));
  $('notify').addEventListener('change', () => save({ notify: $('notify').checked }));
  document.querySelectorAll('.seg').forEach((seg) => seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const value = 'num' in seg.dataset && b.dataset.v !== 'all' ? Number(b.dataset.v) : b.dataset.v;
    config[seg.dataset.key] = value;
    render();
    save({ [seg.dataset.key]: value });
  })));
  document.querySelectorAll('[data-show]').forEach((c) => c.addEventListener('change', () => save({ show: { [c.dataset.show]: c.checked } })));
  $('volume').addEventListener('input', () => {
    $('volume-out').value = `${$('volume').value}%`;
    save({ sound: { volume: Number($('volume').value) / 100 } });
  });
  $('effects').addEventListener('change', () => save({ sound: { effects: $('effects').checked } }));
  $('music').addEventListener('change', () => save({ sound: { music: $('music').checked } }));
  $('muted').addEventListener('change', () => save({ muted: $('muted').checked }));
  $('discreet').addEventListener('change', () => save({ discreet: $('discreet').checked }));
  $('voice').addEventListener('change', () => save({ sound: { voice: $('voice').checked } }));
  $('translation').addEventListener('change', () => save({ translation: $('translation').value }));

  document.querySelectorAll('[data-preview]').forEach((b) => b.addEventListener('click', () => {
    fetch(`/preview?kind=${b.dataset.preview}`, { method: 'POST' });
    say(words.playing);
  }));
  // In the desktop app the guide opens in its own window; in a browser, here.
  $('open-guide').addEventListener('click', async () => {
    try {
      const r = await fetch('/window?name=guide', { method: 'POST' });
      if (r.ok) return;
    } catch {
      /* fall through */
    }
    location.href = 'guide.html';
  });
  $('demo').addEventListener('click', () => {
    fetch('/demo', { method: 'POST' });
    say(words.demoPlaying);
  });
  $('reset').addEventListener('click', () => {
    save({
      position: 'br', scale: 1, opacity: 1, intro: 'smart', jackpot: 'full', idleDim: true, onTop: true, notify: true, muted: false,
      show: { crest: true, lamps: true, indicators: true, ticker: true, stats: true, usage: true },
      sound: { volume: 0.6, effects: true, music: true, voice: true },
      motion: 'auto',
      translation: 'auto',
    });
  });

  async function load() {
    try {
      config = await (await fetch('/config')).json();
      render();
      say(words.ready);
    } catch {
      pickLanguage('auto');
      say(words.notRunning, 'err');
    }
    try {
      const { files, dir } = await (await fetch('/custom/manifest.json')).json();
      $('custom-dir').textContent = dir;
      const list = $('files');
      list.innerHTML = '';
      if (!files.length) {
        const li = document.createElement('li');
        li.className = 'none';
        li.textContent = words.noFiles;
        list.appendChild(li);
      }
      for (const f of files) {
        const li = document.createElement('li');
        li.textContent = f;
        list.appendChild(li);
      }
    } catch {
      /* the overlay works without custom files */
    }
  }
  load();
})();
