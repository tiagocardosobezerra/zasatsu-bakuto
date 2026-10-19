// 遊び方: how the domain plays, step by step, in the computer's language
// (or the one chosen in Settings). All text here is our own; the demos are
// small copies of the pieces on the machine.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // Visual examples, shared by every language.
  const DEMO = {
    expand: '<span class="burst">領域展開</span><span class="arrow">→</span><span class="reel c7">7</span><span class="reel c7">7</span><span class="reel c7">7</span>',
    spin: '<span class="reel c1">1</span><span class="reel c3">3</span><span class="reel c4">4</span><span class="arrow">·</span><b>1/239</b>',
    effects: '<span class="door g">緑</span><span class="door r">赤</span><span class="door y">金</span><span class="arrow">·</span><span class="ball g"></span><span class="ball r"></span><span class="ball y"></span><span class="ball w"></span><span class="arrow">·</span><span class="chip">×2</span><span class="chip">×3</span><span class="chip max">×4</span>',
    riichi: '<span class="burst">リーチ!!</span><span class="reel c3">3</span><span class="reel c3">3</span><span class="reel q">?</span><span class="stars">★★★</span>',
    result: '<span class="reel c3">3</span><span class="reel c3">3</span><span class="reel c4">4</span><span class="arrow">ハズレ</span><span class="arrow">/</span><span class="reel c3">3</span><span class="reel c3">3</span><span class="reel c3">3</span>',
    jackpot: '<span class="oatari">大当たり</span><span class="timer">4:11</span><span class="arrow">♪ Admiring You</span>',
    after: '<span class="reel c3">3</span><span class="arrow">→ 確変</span><span class="arrow">·</span><span class="reel c4">4</span><span class="arrow">→ 時短 70/30</span>',
    sessions: '<span class="dot work ca"></span><b>gestu</b><span class="arrow">“…”</span><span class="dot riichi cb"></span><span class="dot wait cc"></span><span class="dot done cd"></span>',
  };

  const TEXT = {
    pt: {
      title: 'Como jogar',
      sub: 'IDLE DEATH GAMBLE · COMO JOGAR',
      intro: 'A expansão de domínio do Kinji Hakari é uma máquina de pachinko: o CR私鉄純愛列車, com chance de 1 em 239. Aqui quem joga é o Claude: cada coisa que ele faz no seu código mexe na máquina. As regras seguem a folha que o Hakari mostra no capítulo 183 e as lutas dos capítulos 182–190.',
      when: 'Quando acontece',
      steps: [
        { jp: '領域展開', name: 'Expansão de Domínio', body: ['Você manda uma mensagem ao Claude e o domínio abre. No cânone, o efeito de acerto garantido não machuca: ele enfia as regras do jogo na cabeça do oponente — por isso a abertura mostra as regras passando.', 'Cada conversa do Claude tem a sua própria máquina.'], when: 'Você envia uma mensagem (ou o Claude começa a agir sem domínio aberto).' },
        { jp: '回転', name: 'Giros e o sorteio de 1/239', body: ['Cada ferramenta que o Claude termina é um giro. A cada giro, a máquina sorteia o jackpot com chance de 1 em 239 (1 em 24 em probabilidade aumentada).', 'Ganhar esse sorteio dispara um riichi que sempre acerta.'], when: 'Read, Edit, Bash, Grep… cada ferramenta concluída.' },
        { jp: '予告演出', name: 'Efeitos de aviso', body: ['Antes do riichi, a máquina mostra efeitos que dizem o quanto a chance está boa:', '<b>シャッター (portas)</b> — quando o Claude edita ou escreve um arquivo.', '<b>保留玉 (bolas de reserva)</b> — nas outras ferramentas.', '<b>疑似連 (pseudo-consecutivo)</b> — quando uma ferramenta falha e o Claude refaz: a sequência "volta no tempo" e desfaz o dano. Conta ×2, ×3, ×4. Fora da probabilidade aumentada ele tem alto risco de falhar.', 'Cores: verde < vermelho < dourado. <b>Arco-íris ou chegar ao ×4 garante o jackpot.</b>'], when: 'Edit/Write = portas · outras ferramentas = bolas · falha recuperada = 疑似連.' },
        { jp: 'リーチ', name: 'Riichi', body: ['Pelo menos um efeito precisa ter aparecido. Então dois dos três números travam iguais e o terceiro fica girando enquanto um dos quatro cenários do trem passa na tela:', '<b>交通系ICカードリーチ</b> ★☆☆ — o Yuki passa na catraca a tempo?', '<b>座席争奪通勤リーチ</b> ★★☆ — a disputa pelo assento.', '<b>うっかり特快便意我慢リーチ</b> ★★☆ — o Hiro aguenta até Shin-Yurigaoka?', '<b>華金終電リーチ</b> ★★★ — a Yume não embarca no último trem? Mais de 80% de chance.', 'Chance up: <b>夢背景</b> (fundo da Yume), <b>天ノ川カットイン</b> (a veterana Amanokawa entra) e <b>群予告</b> (um enxame; se não forem trens, é garantido).'], when: 'O Claude roda os testes (npm test, pytest, go test, cargo test…).' },
        { jp: '結果', name: 'Resultado', body: ['<b>Testes vermelhos sempre erram</b> (ハズレ): o terceiro número para no vencedor por um instante e escorrega. O estágio volta ao início, como no capítulo 183.', '<b>Testes verdes</b> acertam conforme a chance do cenário.'], when: 'Os testes terminam.' },
        { jp: '大当たり', name: 'Jackpot', body: ['O domínio se desfaz em pedaços e começa a música "Admiring You". Por 4 minutos e 11 segundos — a duração da música — a energia amaldiçoada é ilimitada.', 'Durante a rodada, toda falha é curada na hora pela técnica amaldiçoada reversa automática (反転術式), e às vezes vem bônus de energia.'], when: 'Testes verdes com cenário vencedor, ou o sorteio de 1/239.' },
        { jp: 'その後', name: 'Depois do jackpot', body: ['<b>Trio ímpar → 確変</b> (probabilidade aumentada) até o próximo jackpot. Isso acontece em cerca de 75% dos jackpots.', '<b>Trio par → 時短</b> (giros rápidos) por 70 ou 30 giros, depois volta ao normal. Às vezes é um <b>潜伏確変</b> escondido: parece giro rápido, mas a chance está aumentada — como no capítulo 189.', 'Quando a rodada acaba e o Claude ainda está trabalhando, o domínio abre de novo. Jackpots seguidos contam no 連チャン.'], when: 'Fim dos 4:11.' },
        { jp: '会話', name: 'Várias conversas', body: ['A linha embaixo do título diz qual conversa a máquina está mostrando: bolinha colorida, projeto e o nome da conversa.', 'As bolinhas à direita são as outras conversas: pulsando = trabalhando · anel vermelho = riichi · anel azul = esperando você · apagada = terminou.', 'Se outra conversa precisa de você, aparece <b>あなたの番 · nome</b>. Para fixar uma conversa: bandeja → Seguir conversa.'], when: 'Sempre que houver mais de uma conversa aberta.' },
      ],
      glossary: 'Glossário',
      foot: 'Regras conferidas na folha "CR私鉄純愛列車" do capítulo 183 e nos capítulos 182–190 de Jujutsu Kaisen. Onde o mangá não diz números, a máquina decide e o README explica.',
      terms: [['領域展開', 'ryōiki tenkai', 'Expansão de Domínio'], ['坐殺博徒', 'zasatsu bakuto', 'Idle Death Gamble, o domínio do Hakari'], ['大当たり', 'ōatari', 'jackpot'], ['リーチ', 'rīchi', 'riichi: falta um número'], ['保留玉', 'horyūdama', 'bola de reserva'], ['疑似連', 'gijiren', 'pseudo-consecutivo'], ['確変', 'kakuhen', 'probabilidade aumentada'], ['時短', 'jitan', 'giros rápidos'], ['潜伏確変', 'senpuku kakuhen', 'probabilidade oculta'], ['確定', 'kakutei', 'garantido'], ['激アツ', 'geki atsu', 'quentíssimo, chance alta'], ['ハズレ', 'hazure', 'errou'], ['連チャン', 'renchan', 'jackpots seguidos'], ['反転術式', 'hanten jutsushiki', 'técnica amaldiçoada reversa'], ['呪力', 'juryoku', 'energia amaldiçoada'], ['CR', 'shī āru', 'máquina de cartão, a que pode ter 確変']],
    },
    en: {
      title: 'How to play',
      sub: 'IDLE DEATH GAMBLE · HOW TO PLAY',
      intro: "Kinji Hakari's Domain Expansion is a pachinko machine: CR私鉄純愛列車, with a 1 in 239 chance. Here Claude is the one playing: everything it does in your code moves the machine. The rules follow the sheet Hakari shows in chapter 183 and the fights in chapters 182–190.",
      when: 'When it happens',
      steps: [
        { jp: '領域展開', name: 'Domain Expansion', body: ["You send Claude a message and the domain opens. In canon its sure-hit effect does no harm: it forces the game's rules into the opponent's head — which is why the opening shows the rules streaming past.", 'Each Claude conversation has its own machine.'], when: 'You send a message (or Claude acts while no domain is open).' },
        { jp: '回転', name: 'Spins and the 1/239 draw', body: ['Every tool Claude finishes is a spin. Each spin draws the jackpot at 1 in 239 (1 in 24 in increased probability).', 'Winning that draw starts a riichi that always hits.'], when: 'Read, Edit, Bash, Grep… every finished tool.' },
        { jp: '予告演出', name: 'Notice effects', body: ['Before the riichi, the machine shows effects that hint at how good the chance is:', '<b>シャッター (shutter doors)</b> — when Claude edits or writes a file.', '<b>保留玉 (reserve balls)</b> — for other tools.', '<b>疑似連 (pseudo-consecutive)</b> — when a tool fails and Claude redoes it: the sequence rewinds and undoes the damage. It counts ×2, ×3, ×4, and outside increased probability it often fails.', 'Colours: green < red < gold. <b>Rainbow, or reaching ×4, guarantees the jackpot.</b>'], when: 'Edit/Write = doors · other tools = balls · recovered failure = 疑似連.' },
        { jp: 'リーチ', name: 'Riichi', body: ['At least one effect must have appeared. Then two of the three numbers lock and the third keeps spinning while one of four train scenarios plays:', '<b>交通系ICカードリーチ</b> ★☆☆ — does Yuki get through the gate on time?', '<b>座席争奪通勤リーチ</b> ★★☆ — the fight for a seat.', '<b>うっかり特快便意我慢リーチ</b> ★★☆ — can Hiro hold it until Shin-Yurigaoka?', '<b>華金終電リーチ</b> ★★★ — does Yume stay off the final train? Over 80%.', 'Chance up: <b>夢背景</b> (Yume background), <b>天ノ川カットイン</b> (senpai Amanokawa jumps in) and <b>群予告</b> (a swarm; anything but trains is guaranteed).'], when: 'Claude runs the tests (npm test, pytest, go test, cargo test…).' },
        { jp: '結果', name: 'Result', body: ['<b>Red tests always miss</b> (ハズレ): the third number stops on the winner for a heartbeat and slips. The stage goes back to the start, as in chapter 183.', '<b>Green tests</b> hit with the scenario\'s chance.'], when: 'The tests finish.' },
        { jp: '大当たり', name: 'Jackpot', body: ['The domain breaks apart and "Admiring You" starts. For 4 minutes 11 seconds — the length of the song — cursed energy is unlimited.', 'During the round every failure is healed at once by the automatic reverse cursed technique (反転術式), and cursed-energy bonuses come now and then.'], when: 'Green tests with a winning scenario, or the 1/239 draw.' },
        { jp: 'その後', name: 'After the jackpot', body: ['<b>Odd triple → 確変</b> (increased probability) until the next jackpot. About 75% of jackpots.', '<b>Even triple → 時短</b> (faster spins) for 70 or 30 spins, then back to normal. Sometimes it is a hidden <b>潜伏確変</b>: it looks like faster spins but the odds are up — as in chapter 189.', 'When the round ends and Claude is still working, the domain opens again. Jackpots in a row count as 連チャン.'], when: 'The 4:11 ends.' },
        { jp: '会話', name: 'Several conversations', body: ['The line under the title says which conversation the machine is showing: a coloured dot, the project and the conversation\'s name.', 'The dots on the right are the other conversations: pulsing = working · red ring = riichi · blue ring = waiting for you · faded = done.', 'If another conversation needs you, <b>あなたの番 · name</b> appears. To pin one: tray → Follow conversation.'], when: 'Whenever more than one conversation is open.' },
      ],
      glossary: 'Glossary',
      foot: 'Rules checked against the "CR私鉄純愛列車" sheet in chapter 183 and chapters 182–190 of Jujutsu Kaisen. Where the manga gives no numbers, the machine decides and the README says so.',
      terms: [['領域展開', 'ryōiki tenkai', 'Domain Expansion'], ['坐殺博徒', 'zasatsu bakuto', "Idle Death Gamble, Hakari's domain"], ['大当たり', 'ōatari', 'jackpot'], ['リーチ', 'rīchi', 'riichi: one number to go'], ['保留玉', 'horyūdama', 'reserve ball'], ['疑似連', 'gijiren', 'pseudo-consecutive'], ['確変', 'kakuhen', 'increased probability'], ['時短', 'jitan', 'faster spins'], ['潜伏確変', 'senpuku kakuhen', 'hidden probability'], ['確定', 'kakutei', 'guaranteed'], ['激アツ', 'geki atsu', 'red hot, high chance'], ['ハズレ', 'hazure', 'miss'], ['連チャン', 'renchan', 'jackpots in a row'], ['反転術式', 'hanten jutsushiki', 'reverse cursed technique'], ['呪力', 'juryoku', 'cursed energy'], ['CR', 'shī āru', 'card-reader machine, the kind allowed 確変']],
    },
    es: {
      title: 'Cómo jugar',
      sub: 'IDLE DEATH GAMBLE · CÓMO JUGAR',
      intro: 'La expansión de dominio de Kinji Hakari es una máquina de pachinko: la CR私鉄純愛列車, con probabilidad de 1 en 239. Aquí juega Claude: todo lo que hace en tu código mueve la máquina. Las reglas siguen la hoja que Hakari muestra en el capítulo 183 y las peleas de los capítulos 182–190.',
      when: 'Cuándo pasa',
      steps: [
        { jp: '領域展開', name: 'Expansión de Dominio', body: ['Le envías un mensaje a Claude y el dominio se abre. En el canon su golpe seguro no hace daño: mete las reglas del juego en la cabeza del rival; por eso la apertura muestra las reglas pasando.', 'Cada conversación de Claude tiene su propia máquina.'], when: 'Envías un mensaje (o Claude actúa sin dominio abierto).' },
        { jp: '回転', name: 'Giros y el sorteo 1/239', body: ['Cada herramienta que Claude termina es un giro. Cada giro sortea el premio con probabilidad 1 en 239 (1 en 24 con probabilidad aumentada).', 'Ganar ese sorteo inicia un riichi que siempre acierta.'], when: 'Read, Edit, Bash, Grep… cada herramienta terminada.' },
        { jp: '予告演出', name: 'Efectos de aviso', body: ['Antes del riichi la máquina muestra efectos que indican qué tan buena es la probabilidad:', '<b>シャッター (puertas)</b>: cuando Claude edita o escribe un archivo.', '<b>保留玉 (bolas de reserva)</b>: en las demás herramientas.', '<b>疑似連 (pseudoconsecutivo)</b>: cuando una herramienta falla y Claude la rehace; la secuencia retrocede y deshace el daño. Cuenta ×2, ×3, ×4 y fuera de la probabilidad aumentada suele fallar.', 'Colores: verde < rojo < dorado. <b>Arcoíris, o llegar a ×4, garantiza el premio.</b>'], when: 'Edit/Write = puertas · otras herramientas = bolas · fallo recuperado = 疑似連.' },
        { jp: 'リーチ', name: 'Riichi', body: ['Debe haber aparecido al menos un efecto. Entonces dos de los tres números se fijan y el tercero sigue girando mientras pasa uno de cuatro escenarios del tren:', '<b>交通系ICカードリーチ</b> ★☆☆: ¿Yuki cruza el torniquete a tiempo?', '<b>座席争奪通勤リーチ</b> ★★☆: la lucha por el asiento.', '<b>うっかり特快便意我慢リーチ</b> ★★☆: ¿aguanta Hiro hasta Shin-Yurigaoka?', '<b>華金終電リーチ</b> ★★★: ¿Yume no sube al último tren? Más del 80%.', 'Chance up: <b>夢背景</b> (fondo de Yume), <b>天ノ川カットイン</b> (la senpai Amanokawa entra) y <b>群予告</b> (un enjambre; si no son trenes, está garantizado).'], when: 'Claude ejecuta los tests (npm test, pytest, go test, cargo test…).' },
        { jp: '結果', name: 'Resultado', body: ['<b>Los tests en rojo siempre fallan</b> (ハズレ): el tercer número se detiene en el ganador un instante y se desliza. La etapa vuelve al inicio, como en el capítulo 183.', '<b>Los tests en verde</b> aciertan según la probabilidad del escenario.'], when: 'Los tests terminan.' },
        { jp: '大当たり', name: 'Premio mayor', body: ['El dominio se rompe en pedazos y empieza "Admiring You". Durante 4 minutos y 11 segundos, la duración de la canción, la energía maldita es ilimitada.', 'Durante la ronda cada fallo se cura al instante con la técnica maldita inversa automática (反転術式), y a veces llegan bonos de energía.'], when: 'Tests en verde con escenario ganador, o el sorteo 1/239.' },
        { jp: 'その後', name: 'Después del premio', body: ['<b>Trío impar → 確変</b> (probabilidad aumentada) hasta el siguiente premio. Cerca del 75% de los premios.', '<b>Trío par → 時短</b> (giros rápidos) durante 70 o 30 giros, luego vuelve a lo normal. A veces es un <b>潜伏確変</b> oculto: parece giro rápido pero la probabilidad está aumentada, como en el capítulo 189.', 'Cuando termina la ronda y Claude sigue trabajando, el dominio se abre otra vez. Los premios seguidos cuentan como 連チャン.'], when: 'Terminan los 4:11.' },
        { jp: '会話', name: 'Varias conversaciones', body: ['La línea bajo el título dice qué conversación muestra la máquina: punto de color, proyecto y nombre de la conversación.', 'Los puntos de la derecha son las otras conversaciones: latiendo = trabajando · anillo rojo = riichi · anillo azul = esperándote · apagado = terminó.', 'Si otra conversación te necesita aparece <b>あなたの番 · nombre</b>. Para fijar una: bandeja → Seguir conversación.'], when: 'Siempre que haya más de una conversación abierta.' },
      ],
      glossary: 'Glosario',
      foot: 'Reglas comprobadas con la hoja "CR私鉄純愛列車" del capítulo 183 y los capítulos 182–190 de Jujutsu Kaisen. Donde el manga no da números, decide la máquina y el README lo explica.',
      terms: [['領域展開', 'ryōiki tenkai', 'Expansión de Dominio'], ['坐殺博徒', 'zasatsu bakuto', 'Idle Death Gamble, el dominio de Hakari'], ['大当たり', 'ōatari', 'premio mayor'], ['リーチ', 'rīchi', 'riichi: falta un número'], ['保留玉', 'horyūdama', 'bola de reserva'], ['疑似連', 'gijiren', 'pseudoconsecutivo'], ['確変', 'kakuhen', 'probabilidad aumentada'], ['時短', 'jitan', 'giros rápidos'], ['潜伏確変', 'senpuku kakuhen', 'probabilidad oculta'], ['確定', 'kakutei', 'garantizado'], ['激アツ', 'geki atsu', 'al rojo vivo, alta probabilidad'], ['ハズレ', 'hazure', 'fallo'], ['連チャン', 'renchan', 'premios seguidos'], ['反転術式', 'hanten jutsushiki', 'técnica maldita inversa'], ['呪力', 'juryoku', 'energía maldita'], ['CR', 'shī āru', 'máquina con lector de tarjeta, la que puede tener 確変']],
    },
  };

  const DEMO_KEYS = ['expand', 'spin', 'effects', 'riichi', 'result', 'jackpot', 'after', 'sessions'];

  function render(lang) {
    const t = TEXT[lang] || TEXT.en;
    document.documentElement.lang = TEXT[lang] ? lang : 'en';
    $('hero-sub').textContent = t.sub;
    document.title = `遊び方 · ${t.title}`;
    $('hero-intro').textContent = t.intro;
    const toc = $('toc');
    const steps = $('steps');
    toc.innerHTML = '';
    steps.innerHTML = '';
    t.steps.forEach((step, i) => {
      const id = `s${i + 1}`;
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.innerHTML = `<b>${i + 1}</b>`;
      a.append(step.name);
      toc.appendChild(a);
      const card = document.createElement('section');
      card.className = 'card';
      card.id = id;
      card.innerHTML = `
        <h2><span class="n">${i + 1}</span><span class="jp">${step.jp}</span><span class="tr"></span></h2>
        <div class="demo">${DEMO[DEMO_KEYS[i]]}</div>
        ${step.body.map((p) => `<p>${p}</p>`).join('')}
        <div class="trigger"><b></b><span></span></div>`;
      card.querySelector('h2 .tr').textContent = step.name;
      card.querySelector('.trigger b').textContent = `${t.when}:`;
      card.querySelector('.trigger span').textContent = step.when;
      steps.appendChild(card);
    });
    $('glossary-title').textContent = t.glossary;
    const tbody = $('glossary');
    tbody.innerHTML = '';
    for (const [jp, reading, meaning] of t.terms) {
      const tr = document.createElement('tr');
      for (const cell of [jp, reading, meaning]) {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    $('foot').textContent = t.foot;
  }

  // Same language choice as the overlay: Settings → Language, else the computer's.
  function pick(choice) {
    const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
    return TEXT[choice] ? choice : TEXT[nav] ? nav : 'en';
  }
  render(pick('auto'));
  fetch('/config').then((r) => r.json()).then((c) => render(pick(c.translation))).catch(() => {});
})();
