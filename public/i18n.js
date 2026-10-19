// Japanese text stays the star of the show; a small translation line goes
// under it in the computer's language (or the one picked in Settings).
// To add a language, add its code to LANGS and one entry per key.
(() => {
  'use strict';

  const LANGS = ['en', 'pt'];

  // key: [japanese, { en, pt }]
  const T = {
    tickerStart: ['エージェント待機中', { en: 'Run "ryoiki install", then open Claude Code', pt: 'Rode "ryoiki install" e abra o Claude Code' }],
    reconnecting: ['再接続中…', { en: 'Reconnecting…', pt: 'Reconectando…' }],
    previewDemo: ['▶ 領域展開', { en: 'Play the demo session', pt: 'Tocar a sessão de demonstração' }],
    previewNote: ['プレビュー', { en: 'Preview. In the desktop overlay and in OBS the background is transparent.', pt: 'Prévia. No overlay da área de trabalho e no OBS o fundo é transparente.' }],
    ready: ['スタンバイ', { en: 'Standing by', pt: 'Aguardando' }],
    expand: ['領域展開', { en: 'Domain Expansion', pt: 'Expansão de Domínio' }],
    expandFull: ['領域展開 坐殺博徒', { en: 'Domain Expansion: Idle Death Gamble', pt: 'Expansão de Domínio: Idle Death Gamble' }],
    sureHit: ['必中効果 · ルールの伝達', { en: 'Sure-hit effect: the rules are transferred', pt: 'Acerto garantido: as regras são transmitidas' }],
    riichi: ['リーチ!!', { en: 'Riichi! One number to go', pt: 'Riichi! Falta um número' }],
    riichiLottery: ['リーチ!! 1/239', { en: 'The 1/239 lottery hit: riichi!', pt: 'Ganhou o sorteio 1/239: riichi!' }],
    jackpot: ['大当たり!!', { en: 'Jackpot!', pt: 'Jackpot!' }],
    jackpotWord: ['大当たり', { en: 'JACKPOT', pt: 'JACKPOT' }],
    miss: ['ハズレ…', { en: 'Miss…', pt: 'Errou…' }],
    testsRed: ['ハズレ… テスト失敗', { en: 'Miss: tests are red', pt: 'Errou: testes vermelhos' }],
    timeUp: ['時間切れ', { en: 'Time up', pt: 'Tempo esgotado' }],
    reset: ['最初の舞台へ', { en: 'Back to the starting stage', pt: 'De volta ao estágio inicial' }],
    chance: ['チャンス!', { en: 'Chance!', pt: 'Chance!' }],
    hot: ['激アツ!!', { en: 'Red hot!', pt: 'Quentíssimo!' }],
    kakutei: ['確定!!!', { en: 'Guaranteed!', pt: 'Garantido!' }],
    kakuteiShort: ['確定', { en: 'Guaranteed', pt: 'Garantido' }],
    consec: ['疑似連 ×{n}', { en: 'Pseudo-consecutive ×{n}', pt: 'Pseudo-consecutivo ×{n}' }],
    consecFail: ['疑似連 失敗', { en: 'Pseudo-consecutive failed', pt: 'Pseudo-consecutivo falhou' }],
    consec4: ['4回目!! 確定', { en: '4th time! Jackpot guaranteed', pt: '4ª vez! Jackpot garantido' }],
    consec4Banner: ['疑似連×4 確定!!', { en: '×4: guaranteed!', pt: '×4: garantido!' }],
    group: ['群予告', { en: 'Group notice', pt: 'Aviso em grupo' }],
    groupOther: ['電車じゃない!? 確定!!', { en: 'Not trains!? Guaranteed!', pt: 'Não são trens!? Garantido!' }],
    yume: ['夢背景!!', { en: 'Yume background!', pt: 'Fundo da Yume!' }],
    cutinTitle: ['天ノ川カットイン', { en: 'Amanokawa cut-in', pt: 'Entrada da Amanokawa' }],
    cutinLine: ['先輩が助太刀!!', { en: 'Senpai jumps in to help!', pt: 'A senpai veio ajudar!' }],
    heal: ['自動反転術式', { en: 'Automatic Reverse Cursed Technique', pt: 'Técnica Amaldiçoada Reversa automática' }],
    healBanner: ['反転術式', { en: 'Reverse Cursed Technique', pt: 'Técnica Reversa' }],
    bonus: ['呪力ボーナス!!', { en: 'Cursed energy bonus!', pt: 'Bônus de energia amaldiçoada!' }],
    unlimited: ['呪力無制限', { en: 'Unlimited cursed energy', pt: 'Energia amaldiçoada ilimitada' }],
    roundEnd: ['呪力 復帰', { en: 'Cursed energy back to normal', pt: 'Energia volta ao normal' }],
    collapse: ['領域解除', { en: 'Domain closed', pt: 'Domínio desfeito' }],
    jitanEnd: ['時短終了 · 通常', { en: 'Faster spins over: normal', pt: 'Fim dos giros rápidos: normal' }],
    yourTurnFrom: ['あなたの番 · {who}', { en: 'Your turn · {who}', pt: 'Sua vez · {who}' }],
    whoNone: ['会話待ち', { en: 'Waiting for a conversation', pt: 'Aguardando uma conversa' }],
    usageSession: ['セッション', { en: 'Session', pt: 'Sessão' }],
    usageWeek: ['週間', { en: 'Week', pt: 'Semana' }],
    usageResets: ['リセット {t}', { en: 'resets in {t}', pt: 'renova em {t}' }],
    usageResetsOn: ['リセット {t}', { en: 'resets {t}', pt: 'renova {t}' }],
    moreConv: ['他 {n} 件', { en: '{n} more conversations', pt: 'mais {n} conversas' }],
    openConv: ['会話を開く', { en: 'Open this conversation in Claude', pt: 'Abrir esta conversa no Claude' }],
    stIdle: ['待機', { en: 'idle', pt: 'parada' }],
    stWorking: ['作業中', { en: 'working', pt: 'trabalhando' }],
    stRiichi: ['リーチ', { en: 'riichi (tests running)', pt: 'riichi (testes rodando)' }],
    stWaiting: ['あなたの番', { en: 'waiting for you', pt: 'esperando você' }],
    stDone: ['終了', { en: 'done', pt: 'terminou' }],
    stRound: ['大当たり中', { en: 'jackpot round', pt: 'rodada do jackpot' }],
    yourTurn: ['あなたの番', { en: 'Your turn', pt: 'Sua vez' }],
    done: ['ターン終了', { en: 'Turn over', pt: 'Turno encerrado' }],
    modeNormal: ['通常 1/{odds}', { en: 'Normal', pt: 'Normal' }],
    modeIncreased: ['確変 1/{odds}', { en: 'Increased odds', pt: 'Chance aumentada' }],
    modeFaster: ['時短 1/{odds}', { en: 'Faster spins', pt: 'Giros rápidos' }],
    modeFasterLeft: ['時短 残{n} · 1/{odds}', { en: '{n} fast spins left', pt: 'Faltam {n} giros rápidos' }],
    domainOpen: ['領域展開中', { en: 'Domain open', pt: 'Domínio aberto' }],
    domainRound: ['大当たり中', { en: 'Jackpot round', pt: 'Rodada do jackpot' }],
    domainClosed: ['領域 未展開', { en: 'No domain', pt: 'Sem domínio' }],
    feverIncreased: ['確変突入!!', { en: 'Increased probability!', pt: 'Probabilidade aumentada!' }],
    feverFaster: ['時短突入', { en: 'Faster spins', pt: 'Giros rápidos' }],
    feverHidden: ['潜伏確変!!', { en: 'Hidden probability!', pt: 'Probabilidade oculta!' }],
    feverRound: ['呪力無制限 4:11 · 自動反転術式', { en: 'Unlimited cursed energy for 4:11 · automatic reverse cursed technique', pt: 'Energia amaldiçoada ilimitada por 4:11 · técnica reversa automática' }],
    hold: ['保留', { en: 'Reserve', pt: 'Reserva' }],
    consecLabel: ['疑似連', { en: 'Pseudo-consec. · ×4 = guaranteed', pt: 'Pseudo-consec. · ×4 = garantido' }],
    riichiCall: ['リーチ!!', { en: 'Riichi!', pt: 'Riichi!' }],
    yumeTag: ['夢背景', { en: 'Yume background', pt: 'Fundo da Yume' }],
    bestLabel: ['最高演出', { en: 'Best effect', pt: 'Melhor efeito' }],
    spins: ['回転', { en: 'Spins', pt: 'Giros' }],
    jackpots: ['大当たり', { en: 'Jackpots', pt: 'Jackpots' }],
    renchan: ['連チャン', { en: 'Streak', pt: 'Sequência' }],
    domains: ['領域', { en: 'Domains', pt: 'Domínios' }],
    expectation: ['期待度', { en: 'Expectation', pt: 'Expectativa' }],
    line: ['私鉄純愛線', { en: 'Pure Love Line', pt: 'Linha do Amor Puro' }],
    stageNormal: ['通常ステージ', { en: 'Starting stage', pt: 'Estágio inicial' }],
    stageIncreased: ['確変ステージ', { en: 'Increased probability stage', pt: 'Estágio de probabilidade aumentada' }],
    stageFaster: ['時短ステージ', { en: 'Faster spins stage', pt: 'Estágio de giros rápidos' }],
    // Riichi scenarios (names from the rule sheet)
    transit: ['交通系ICカードリーチ', { en: 'Transit Card Riichi', pt: 'Riichi do Cartão de Transporte' }],
    seat: ['座席争奪通勤リーチ', { en: 'Seat Struggle Riichi', pt: 'Riichi da Disputa pelo Assento' }],
    potty: ['うっかり特快便意我慢リーチ', { en: 'Potty Emergency Riichi', pt: 'Riichi da Emergência no Banheiro' }],
    final: ['華金終電リーチ', { en: 'Friday Night Final Train Riichi', pt: 'Riichi do Último Trem de Sexta' }],
    transitWin: ['夕輝、改札を通過! 定時に出社!', { en: 'Yuki made it through the gate on time!', pt: 'Yuki passou pela catraca a tempo!' }],
    transitLose: ['残高不足… 夕輝、遅刻確定', { en: 'Card declined… Yuki is late for work.', pt: 'Saldo insuficiente… Yuki vai se atrasar.' }],
    seatWin: ['夕輝、座席ゲット!', { en: 'Yuki got the last seat!', pt: 'Yuki pegou o último assento!' }],
    seatLose: ['座席を取られた…', { en: 'Someone else took the seat…', pt: 'Pegaram o assento…' }],
    pottyWin: ['空、新百合ヶ丘まで間に合った!', { en: 'Hiro reached Shin-Yurigaoka in time!', pt: 'Hiro chegou a Shin-Yurigaoka a tempo!' }],
    pottyLose: ['空、間に合わず…', { en: 'Hiro did not make it…', pt: 'Hiro não aguentou…' }],
    finalWin: ['夢は終電に乗らなかった!', { en: 'Yume did not board the final train!', pt: 'Yume não embarcou no último trem!' }],
    finalLose: ['夢は終電に乗ってしまった…', { en: 'Yume boarded the final train…', pt: 'Yume embarcou no último trem…' }],
    tease: ['……', { en: '…', pt: '…' }],
    colorGreen: ['緑', { en: 'Green', pt: 'Verde' }],
    colorRed: ['赤', { en: 'Red', pt: 'Vermelho' }],
    colorGold: ['金', { en: 'Gold', pt: 'Dourado' }],
    colorRainbow: ['虹', { en: 'Rainbow', pt: 'Arco-íris' }],
    bestNone: ['—', { en: 'No effect yet', pt: 'Nenhum efeito' }],
    // Everything else on screen
    crHint: ['CR機: カードリーダー対応のパチンコ台 (確変あり)', { en: 'CR machine: card-reader pachinko, the kind allowed to have increased probability (確変)', pt: 'Máquina CR: pachinko de cartão (card reader), o tipo que pode ter probabilidade aumentada (確変)' }],
    titleName: ['私鉄純愛列車', { en: 'Private Pure Love Train', pt: 'Trem do Amor Puro' }],
    introVer: ['CR 私鉄純愛列車 Ver. 1/239', { en: 'Private Pure Love Train · jackpot 1 in 239', pt: 'Trem do Amor Puro · jackpot 1 em 239' }],
    odds: ['1/239', { en: 'Jackpot odds: 1 in 239', pt: 'Chance de jackpot: 1 em 239' }],
    sfxDo: ['ドッ', { en: 'THOOM', pt: 'TUM' }],
    sfxDon: ['ドン!!', { en: 'BOOM!!', pt: 'BUM!!' }],
    sfxDododo: ['ドドドド', { en: 'DOOM DOOM', pt: 'TUM TUM' }],
    sfxGogo: ['ゴゴゴ', { en: 'rumble', pt: 'tremor' }],
    shutter: ['シャッター', { en: 'Shutter doors', pt: 'Portas' }],
    expectationStars: ['期待度 {stars}', { en: 'Expectation {stars}', pt: 'Expectativa {stars}' }],
    holdHint: ['保留玉: 緑 < 赤 < 金', { en: 'Reserve balls: green < red < gold', pt: 'Bolas de reserva: verde < vermelho < dourado' }],
    consecHint: ['疑似連: ×4で確定', { en: 'Pseudo-consecutive: reaching ×4 guarantees the jackpot', pt: 'Pseudo-consecutivo: chegar a ×4 garante o jackpot' }],
    consecChips: ['×4で確定', { en: '×4 = guaranteed', pt: '×4 = garantido' }],
    bestHint: ['今のステージの最高演出', { en: 'Best effect on this stage', pt: 'Melhor efeito deste estágio' }],
    placeGate: ['改札', { en: 'Ticket gate', pt: 'Catraca' }],
    placeSeat: ['空席', { en: 'Empty seat', pt: 'Assento vago' }],
    placeShinYuri: ['新百合ヶ丘', { en: 'Shin-Yurigaoka', pt: 'Shin-Yurigaoka' }],
    nameYuki: ['夕輝', { en: 'Yuki', pt: 'Yuki' }],
    nameYume: ['夢', { en: 'Yume', pt: 'Yume' }],
    nameHiro: ['空', { en: 'Hiro', pt: 'Hiro' }],
    roundSong: ['♪ Admiring You ♪ 自動反転術式 ♪ 不死身 ♪', { en: 'Admiring You · automatic reverse cursed technique · unkillable', pt: 'Admiring You · técnica reversa automática · imortal' }],
    musicStart: ['音楽、スタート!!', { en: 'Music, start!', pt: 'Música, começa!' }],
    demo: ['デモ中', { en: 'Demo', pt: 'Demonstração' }],
    renchan2: ['{n}連チャン!!', { en: '{n} jackpots in a row!', pt: '{n} jackpots seguidos!' }],
  };

  let lang = 'en';

  // choice: auto | en | pt | es | ja (Japanese only)
  function setLang(choice) {
    if (choice === 'ja' || choice === 'off') {
      lang = null;
      return;
    }
    if (LANGS.includes(choice)) {
      lang = choice;
      return;
    }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const code = nav.slice(0, 2).toLowerCase();
    lang = code === 'ja' ? null : LANGS.includes(code) ? code : 'en';
  }

  function fill(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : ''));
  }

  function t(key, vars) {
    const entry = T[key];
    if (!entry) return { ja: key, tr: '' };
    return { ja: fill(entry[0], vars), tr: lang ? fill(entry[1][lang], vars) : '' };
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Fill an element with Japanese and, when a language is on, its translation.
  function put(el, key, vars) {
    const { ja, tr } = t(key, vars);
    el.innerHTML = `<span class="ja">${esc(ja)}</span>${tr ? `<span class="tr">${esc(tr)}</span>` : ''}`;
    el.dataset.key = key;
  }

  // The rules dumped into the opponent's head, with translations.
  const RULES = [
    ['「坐殺博徒」は実在のパチンコ台をモデルにした領域だ', { en: 'Idle Death Gamble is a domain modelled on a real pachinko machine', pt: 'Idle Death Gamble é um domínio baseado numa máquina de pachinko real' }],
    ['図柄を3つ揃えれば大当たり', { en: 'Line up three symbols for the jackpot', pt: 'Alinhe três símbolos para o jackpot' }],
    ['大当たり確率 約1/239 · 確変突入率 約75%', { en: 'Jackpot about 1/239 · increased probability about 75%', pt: 'Jackpot cerca de 1/239 · probabilidade aumentada ~75%' }],
    ['一回以上演出を発生させたらリーチに発展', { en: 'One effect or more develops into riichi', pt: 'Um efeito ou mais vira riichi' }],
    ['虹色や4回目はそれだけで大当たりが確定', { en: 'Rainbow, or the 4th time, guarantees the jackpot', pt: 'Arco-íris, ou a 4ª vez, garante o jackpot' }],
    ['華金終電リーチは期待度80%超え', { en: 'Friday Night Final Train riichi: over 80%', pt: 'Riichi do Último Trem de Sexta: mais de 80%' }],
    ['群予告: 電車以外なら大当たり確定', { en: 'Group notice: anything but trains is guaranteed', pt: 'Aviso em grupo: se não forem trens, é garantido' }],
    ['大当たり: 呪力無制限 4分11秒', { en: 'Jackpot: unlimited cursed energy for 4:11', pt: 'Jackpot: energia amaldiçoada ilimitada por 4:11' }],
  ];
  function rulesText() {
    return RULES.map(([ja, tr]) => (lang ? `${ja}（${tr[lang]}）` : ja)).join('　');
  }

  setLang('auto');
  window.DomainI18n = { t, put, setLang, rulesText, lang: () => lang, LANGS };
})();
