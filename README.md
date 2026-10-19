<p align="center">
  <img src="docs/icon.png" width="128" alt="Ícone do Zasatsu Bakuto: o sinal de mão da Expansão de Domínio do Hakari">
</p>

<h1 align="center">Zasatsu Bakuto (坐殺博徒)</h1>

<p align="center"><b>Português</b> | <a href="README.en.md">English</a></p>

<p align="center">
  <b>A Expansão de Domínio do Kinji Hakari, Idle Death Gamble, jogada pelo seu agente de IA.</b><br>
  Uma pequena máquina de pachinko no canto da tela que mostra o que o Claude Code está fazendo, sem você precisar olhar o terminal.
</p>

---

## Por que usar

Quando um agente de IA trabalha por vários minutos, você acaba fazendo uma de duas coisas: fica encarando o terminal, ou vai fazer outra coisa e esquece de voltar. O Zasatsu Bakuto resolve as duas. Ele transforma a atividade do agente numa máquina de pachinko que você lê com o canto do olho:

| O que aparece na máquina | O que significa |
| --- | --- |
| Rolos girando, portas de shutter, bolas de reserva | O agente está trabalhando (editando arquivos, lendo, rodando comandos) |
| **リーチ (Riichi)** | O agente está rodando seus testes agora |
| **大当り (JACKPOT)** | Os testes passaram |
| **ハズレ (Errou)** | Os testes falharam |
| **×2 / ×3 / ×4** | Uma ferramenta falhou e o agente está se recuperando |
| **YOUR TURN**, com o nome da conversa | O agente está esperando sua permissão ou sua resposta |
| O domínio fecha | O agente terminou a vez dele |
| Uma linha por conversa em andamento | Projeto, nome, o que cada conversa está fazendo e a última ação; acende a de quem acabou de agir |

Assim você lê documentação, responde o chat ou pega um café, e mesmo assim sabe **quando os testes passam, quando algo quebra e quando o agente precisa de você**. E como cada rodada de testes é uma aposta de 1/239 com as regras do próprio Hakari, esperar o agente vira diversão em vez de tempo morto.

O que ele não faz:

- Nunca bloqueia, atrasa ou muda o agente. Ele só escuta os hooks oficiais do Claude Code, de forma assíncrona.
- Não envia nada para lugar nenhum. Tudo roda em `127.0.0.1`. Sem telemetria, sem conta. Para os links das conversas, ele lê no seu PC só o ID de cada conversa nos arquivos do app do Claude.
- Não atrapalha: o overlay deixa o clique passar, e existe um **modo discreto** (pequeno, sem som, translúcido) para o computador do trabalho.

## Destaques

- **Fiel ao mangá.** As regras vêm da folha de regras do CR私鉄純愛列車 que o Hakari mostra no capítulo 183 e das lutas dos capítulos 182 a 190: chance de 1/239, 疑似連, avisos 緑 < 赤 < 金 < 虹, os quatro cenários de riichi, 確変/時短, 潜伏確変 e a rodada de jackpot de 4:11 com técnica reversa automática. A tabela completa está [mais abaixo](#as-regras-do-domínio).
- **Japonês primeiro, com tradução embaixo de cada linha** no idioma do seu computador (Português ou English), até nas onomatopeias, no estilo scanlation.
- **Três tamanhos**: Normal, Compacto e Mini (cerca de 230 px de largura, uma linha de status).
- **Uma máquina para todas as conversas**: qualquer conversa do Claude Code gira os mesmos rolos e soma no mesmo placar, e cada conversa em andamento ganha uma linha na máquina. A lista cresce e diminui sozinha, e clicar numa linha (↗) abre aquela conversa no app do Claude. Só uma リーチ por vez, e o domínio só fecha quando todas param. O placar e o 確変 ficam salvos quando você fecha o app. Se preferir, dá para ter uma máquina por conversa.
- **Sons de pachinko sintetizados** (キュイン, chuva de bolinhas, batida do shutter, fanfarra) e um locutor japonês opcional. Todo som e imagem pode ser trocado por arquivos seus.
- **Guia embutido** (bandeja → 遊び方 · guia) que explica o jogo passo a passo, com glossário.
- **Aberto para outras IAs**: Claude Code vem pronto; qualquer outro agente liga por uma API local simples ([como](#funciona-com-outras-ias)).
- **Funciona no OBS** como browser source, para quem faz live.

> Projeto de fã. Sem vínculo com Jujutsu Kaisen, Gege Akutami, Shueisha ou MAPPA. Não inclui nenhuma arte ou música oficial: tudo é desenhado em CSS e os sons são sintetizados.

## Começo rápido

Você precisa do [Node.js](https://nodejs.org) 20 ou mais novo e do [Claude Code](https://claude.com/claude-code).

```bash
git clone https://github.com/tiagocardosobezerra/zasatsu-bakuto.git
cd zasatsu-bakuto
npm install
node bin/ryoiki.js install     # adiciona os hooks em ~/.claude/settings.json (guarda um backup)
node bin/ryoiki.js tenkai      # 領域展開: abre o domínio (overlay + ícone na bandeja)
node bin/ryoiki.js demo        # assiste uma sessão de exemplo
```

Depois abra uma nova sessão do Claude Code e trabalhe normalmente. A máquina acorda no seu primeiro prompt.

Quer o comando curto? Rode `npm link` uma vez dentro da pasta. A partir daí é só conjurar:

```bash
ryoiki tenkai
```

| Comando | No mangá | O que faz |
| --- | --- | --- |
| `ryoiki tenkai` | **領域展開** Ryōiki Tenkai, Expansão de Domínio | Abre o domínio: overlay e ícone na bandeja |
| `ryoiki kaijo` | **領域解除** Ryōiki Kaijo, desfazer o domínio | Fecha o domínio |
| `ryoiki install` / `ryoiki uninstall` | | Liga ou desliga os hooks do Claude Code |
| `ryoiki demo` | | Toca uma sessão de exemplo |
| `ryoiki guide` | **遊び方** como jogar | Abre o guia com glossário |
| `ryoiki settings` | | Abre as configurações |
| `ryoiki status` | | Diz se o domínio está aberto |
| `ryoiki serve` | | Só o servidor, para o OBS |

- `ryoiki uninstall` remove só os hooks deste projeto e não mexe no resto das suas configurações.
- `--settings .claude/settings.json` instala os hooks em um projeto só, em vez de no global.
- O npm 11 pode pedir para você aprovar o script de instalação do Electron: `npm install-scripts approve electron`.

## Funciona com outras IAs?

**Hoje, o suporte pronto é para o Claude Code**: o `ryoiki install` liga tudo sozinho. Mas a máquina não depende do Claude. Ela só escuta uma API local, e **qualquer agente ou ferramenta que consiga rodar um comando ou fazer uma requisição HTTP quando algo acontece** pode jogar.

| Ferramenta | Situação |
| --- | --- |
| **Claude Code** (terminal, app desktop, extensões de IDE) | ✅ Suporte pronto, instalação automática com `ryoiki install` |
| Codex CLI, Gemini CLI, Cursor, GitHub Copilot, Aider e outros | 🔌 Ainda sem adaptador pronto. Dá para ligar pela API abaixo se a ferramenta tiver hooks, scripts de evento ou notificações |
| Seus próprios scripts, CI, agentes caseiros | 🔌 Pela API abaixo |

### Como ligar outra IA

Mande um JSON por `POST` para `http://127.0.0.1:4111/event` a cada evento do agente. O formato é o mesmo dos hooks do Claude Code:

| `hook_event_name` | Quando mandar | Na máquina |
| --- | --- | --- |
| `UserPromptSubmit` | Você mandou um pedido ao agente | Abre a Expansão de Domínio |
| `PreToolUse` | O agente vai usar uma ferramenta | Gira; se o comando for de teste, entra em リーチ |
| `PostToolUse` | A ferramenta terminou | Efeito de aviso; se for teste, o resultado decide jackpot ou ハズレ |
| `PostToolUseFailure` | A ferramenta falhou | 疑似連 (×2, ×3, ×4) |
| `Notification` | O agente precisa de você | YOUR TURN |
| `Stop` | O agente terminou a vez | O domínio fecha |

Campos que a máquina usa: `session_id` (separa as conversas), `cwd` (vira o nome do projeto), `prompt` (vira o título), `tool_name`, `tool_input.command` (comandos de teste como `npm test` ou `pytest` viram リーチ) e `tool_response.stdout` (resumos como `12 passed` ou `1 failed` decidem o resultado).

Exemplo com `curl` (macOS, Linux, Git Bash):

```bash
curl -X POST http://127.0.0.1:4111/event -H "Content-Type: application/json" \
  -d '{"hook_event_name":"UserPromptSubmit","session_id":"meu-agente","cwd":"/projetos/app","prompt":"Corrigir o login"}'

curl -X POST http://127.0.0.1:4111/event -H "Content-Type: application/json" \
  -d '{"hook_event_name":"PostToolUse","session_id":"meu-agente","cwd":"/projetos/app","tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":{"stdout":"12 passed"}}'
```

O mesmo no PowerShell:

```powershell
$evento = @{ hook_event_name = 'Notification'; session_id = 'meu-agente'; cwd = 'C:\projetos\app' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4111/event -ContentType 'application/json' -Body $evento
```

Um adaptador para uma IA nova é só um script que traduz os eventos dela para esse JSON. Se você fizer um, abra um pull request: ele entra na lista acima.

## As regras do domínio

As regras vêm da folha de regras que o Hakari mostra no capítulo 183 (*CR私鉄純愛列車*: リーチアクション, ゲームフロー, 予告演出, チャンスアップ) e das lutas dos capítulos 182 a 190. Os eventos dos hooks do agente são a luta.

| Regra do domínio (fonte) | O que dispara |
| --- | --- |
| **領域展開** Expansão de Domínio; o acerto garantido transfere as regras (cap. 182, 187) | Você manda um prompt, ou o agente age sem domínio aberto |
| Cada giro sorteia o jackpot em **約1/239** (folha de regras) | Cada ferramenta que termina |
| Avisos 予告演出 (folha de regras): portas de **シャッター** | Edit / Write |
| **保留玉** bolas de reserva; bola maior, chance maior | Qualquer outra ferramenta (Read, Grep, Bash…) |
| **疑似連** pseudo-consecutivo: refaz a sequência e reverte o dano, mostrado como ×2, ×3, ×4 (folha de regras, cap. 187) | Uma ferramenta que falha e o agente se recupera |
| O 疑似連 tem alto risco de falhar fora do 確変 (cap. 187) | Igual; pode falhar e não contar |
| Cores **緑 < 赤 < 金**; **arco-íris (虹色) ou a 4ª vez (×4) confirmam o jackpot** (folha de regras) | Cor sorteada por efeito, puxando para dourado e arco-íris quando o sorteio já foi ganho |
| O **riichi** só acontece depois de pelo menos um efeito, e revela dois dos três números (folha de regras, cap. 183) | Uma rodada de testes (`npm test`, `pytest`, `go test`, `cargo test`…), ou um sorteio de 1/239 ganho |
| リーチアクション (folha de regras): 交通系ICカードリーチ ★☆☆, 座席争奪通勤リーチ ★★☆, うっかり特快便意我慢リーチ ★★☆, 華金終電リーチ ★★★ ("mais de 80% quando acontece") | A máquina escolhe o cenário a partir do resultado já decidido, como um pachinko de verdade |
| チャンスアップ (folha de regras): **夢背景** fundo da Yume, **天ノ川カットイン** cut-in do Amanokawa, **群予告** aviso em grupo (qualquer coisa que não seja trem = confirmado) | Aparecem durante o riichi, mais quando o resultado é vitória |
| **ハズレ**: o cenário volta ao começo (cap. 183) | Testes vermelhos (sempre), ou testes verdes quando o cenário falha |
| **大当り**: o domínio some; energia amaldiçoada infinita por **4:11**, a duração de *Admiring You*; técnica reversa totalmente automática (cap. 186 a 189) | Testes verdes com cenário vencedor |
| Bônus de energia amaldiçoada durante a rodada (cap. 186) | Ferramentas usadas durante a rodada |
| Sem domínio durante a rodada; ele é aberto de novo quando a rodada acaba (cap. 186, 189) | O agente ainda está trabalhando quando os 4:11 terminam |
| Fluxo do jogo (folha de regras): 通常 → 大当たり → **確変** ou **時短**; **確変突入率 約75%** | Todo jackpot |
| **Trinca ímpar → 確変** probabilidade aumentada, até o próximo jackpot (cap. 187) | 1, 3, 5, 7 |
| **Trinca par → 時短** giros rápidos por **70 ou 30 giros**, depois volta ao 通常 (folha de regras, cap. 187) | 2, 4, 6 |
| **潜伏確変** probabilidade escondida: parece giro rápido, mas é probabilidade aumentada (cap. 189) | Às vezes, depois de um jackpot par |
| O domínio fecha (領域解除), o 連チャン zera | O agente termina a vez sem jackpot |
| **YOUR TURN** | O agente pede permissão ou uma resposta |

Onde as fontes não dizem nada, a máquina completa, e avisa:

- Os números 3 (Yume, 夢) e 4 (Hiro, 空) trazem os personagens mostrados no capítulo 183; os outros números ficam com o resto do elenco de *Private Pure Love Train*, com os nomes em kanji como na lista da wiki. Os rolos usam de 1 a 7.
- As legendas dos cenários (em japonês, com tradução) são uma redação nossa das condições de vitória.
- A probabilidade aumentada sorteia em 1/24; o 疑似連 falha metade das vezes fora dela (10% dentro); o 潜伏確変 vem em 25% dos jackpots pares; as taxas das chance-ups são nossas. O mangá não dá números para isso.
- A wiki descreve a garantia como "quatro efeitos consecutivos"; a folha de regras diz "4回目" e o pachinko conta o 疑似連 a partir do ×2, então a máquina confirma no ×4 (três repetições). O painel do capítulo 187 mostra ×3 depois de duas repetições.
- A história do Seat Struggle Riichi nunca foi mostrada, então as falas dele são inventadas. O aviso em grupo usa corações como "não é trem".
- A wiki diz que o número de giros possíveis cai a cada jackpot perdido, sem dizer quanto. A máquina não limita giros; o domínio acaba quando a vez do agente acaba.
- Ligar eventos do agente a eventos da luta (testes = riichi, falhas = 疑似連) é escolha deste projeto.

O resultado dos testes é lido do payload do hook: um Bash que falha é vermelho, e os resumos dos test runners (`12 passed`, `1 failed`, `test result: ok`, TAP, Go, pytest, unittest…) decidem o resto.

## Configurações

Clique com o botão direito no ícone da bandeja → **Configurações…** (ou dois cliques nele), ou rode `ryoiki settings`. As mudanças valem na hora e ficam salvas em `~/.zasatsu-bakuto/config.json`. O placar e o modo da máquina ficam em `~/.zasatsu-bakuto/machine.json`.

- **Modo discreto** (também no menu da bandeja): máquina mini, sem som, nada em tela cheia, um pouco transparente. Ele fica por cima das suas configurações sem mudar nenhuma; desligou, tudo volta. Feito para o computador do trabalho.
- **Máquinas** (também no menu da bandeja): **Uma para todas** (padrão), em que toda conversa gira a mesma máquina e o placar fica salvo, ou **Uma por conversa**, em que cada conversa tem a sua e a tela segue a última em que você escreveu.
- **Linhas de conversa** (também no menu da bandeja): uma linha por conversa em andamento, até 1, 2 ou 3, ou **Ilimitado** (padrão), que vai crescendo até o limite da tela e mostra "mais N conversas" no que não couber.
- **Na tela**: layout (**Normal**, **Compacto** sem lâmpadas e contadores, **Mini** só com a tela e uma linha de status, cerca de 230 px), canto, tamanho (30 a 200%), opacidade, escurecer quando parada. A máquina nunca passa de uns 60% da altura da tela.
- **O que aparece**: Expansão de Domínio em tela cheia / na máquina / desligada; jackpot em tela cheia / na máquina / desligado; título, lâmpadas, linha de 保留/疑似連, ferramenta atual, contadores.
- **Som**: silenciar tudo, volume, sons da máquina, locutor japonês, suas músicas.
- **Prévias**: toca a Expansão de Domínio, um jackpot garantido ou a demo completa.
- **Idioma**: o japonês fica na tela; uma tradução pequena vai embaixo no idioma do computador (Português ou English), ou o que você escolher, ou só japonês. Todo texto em japonês tem tradução, até as onomatopeias do mangá (ドン!! *BUM!!*, ゴゴゴ *tremor*), no estilo scanlation. A página de configurações e o menu da bandeja seguem o mesmo idioma.

## Som

O app não traz gravações de máquinas reais (elas pertencem aos fabricantes). Em vez disso, ele sintetiza os sons que marcam um salão de pachinko: o **キュイン** subindo quando aparece um efeito dourado ou arco-íris, a chuva de bolinhas de aço do pagamento, uma fanfarra de metais no jackpot e a batida pesada da porta de shutter.

- Todo evento pode usar um arquivo seu (veja abaixo); se você tem sons de máquinas reais, pode usá-los.
- **Locutor japonês** (ligado por padrão): anuncia リーチ!, 大当たり! e 確定! com uma voz japonesa instalada no computador. No Windows: Configurações → Hora e idioma → Fala → Adicionar vozes → Japonês. Sem voz japonesa ele fica quieto; a página de configurações mostra qual voz encontrou.

## Movimento

- **Expansão de Domínio → Inteligente** (padrão): tela cheia na primeira vez e de novo depois de 10 minutos parado, na máquina nas outras vezes. O domínio do mangá abre em menos de 0,2 s; uma abertura de 3,6 s em tela cheia a cada prompt cansa rápido.
- **Movimento → Seguir o sistema** (padrão): se o sistema operacional pede menos movimento, os efeitos de tela cheia aparecem na máquina e tremidas, giros e flashes param. A página de configurações avisa quando isso está acontecendo; escolha **Completo** para ver tudo mesmo assim.
- Nada pisca forte: as linhas de velocidade giram devagar e os flashes ficam em torno de 1 Hz.

## Detalhes

- Quando a máquina fica parada, ela roda uma **デモ画面** como uma máquina real sem ninguém jogando, mostrando o elenco nos rolos devagar.
- A rodada abre com o Hakari chamando a música (音楽、スタート!!, cap. 187); um segundo jackpot seguido ganha o grito de **連チャン**.
- Um efeito dourado ou arco-íris acende a borda da tela (先読み) antes de tudo; a contagem do 疑似連 fica no canto da tela como ×2/×3/×4, igual ao painel do capítulo 187.

## Suas artes e músicas

O app não traz imagens nem músicas da obra. Se você tem arquivos que quer usar, coloque em `~/.zasatsu-bakuto/custom/` (ou defina `ZASATSU_CUSTOM_DIR`). Os arquivos são reconhecidos pelo nome; vale `.png .jpg .webp .gif` para imagens e `.mp3 .ogg .wav .m4a` para áudio:

| Nome do arquivo | Usado para |
| --- | --- |
| `round.mp3` | Toca do jackpot até o fim da rodada de 4:11 (por exemplo, a música tema) |
| `intro.png` | Arte de fundo atrás do 坐殺博徒 |
| `jackpot.png` | Arte na tela do jackpot |
| `reel-1.png` … `reel-7.png` | Arte de cada número dos rolos |
| `expand`, `riichi`, `kyuin`, `door`, `ball`, `consec`, `kakutei`, `jackpot`, `miss`, `heal` (`.mp3/.ogg/.wav`) | Troca o som embutido daquele evento |

Esses arquivos ficam na sua máquina; o app só entrega eles para o seu próprio overlay em `127.0.0.1`. Você é responsável por ter os direitos sobre eles.

## Para quem faz live

```bash
ryoiki serve
```

Adicione `http://127.0.0.1:4111/` como browser source no OBS (fundo transparente). As opções vão na query string:

- `?pos=br|bl|tr|tl`: canto (padrão `br`)
- `?scale=1.5`: tamanho
- `?mute`: sem som
- `?intro=full|compact|off` e `?jackpot=full|compact|off`: sobrescrevem as configurações para essa source
- `?opacity=0.8`
- `?lang=pt|en|ja`: idioma da tradução para essa source
- `?layout=normal|compact|mini`
- `?preview`: fundo escuro e um botão de demo, para testar num navegador comum

## Como funciona

```
Claude Code ──hook (async)──▶ src/hook.js ──POST /event──▶ servidor (127.0.0.1:4111)
                                                              │ classify → game
                                                              ▼
                                         overlay(s) ◀── SSE /stream
                                         (janela Electron, OBS, navegador)
```

- `src/classify.js` transforma o payload bruto do hook num sinal pequeno (`tool-done`, `test-start`, `test-end`, `attention`, …). Para suportar outro agente, escreva um adaptador que mande payloads no mesmo formato.
- `src/game.js` decide o resultado no servidor, então todo overlay mostra os mesmos rolos.
- `public/` é toda a camada visual: HTML/CSS/JS puro. Temas são o próximo passo natural.
- `src/hook.js` sempre sai com código 0, não imprime nada e desiste depois de 1,5 s. Os hooks são registrados com `"async": true`.

## Desenvolvimento

```bash
npm install
npm test            # node:test, sem dependências extras
npm run serve       # depois abra http://127.0.0.1:4111/?preview
npm start           # overlay Electron
```

## Próximos passos

- Pacotes de tema (rolos, sons e tela do jackpot são todos trocáveis)
- Adaptadores: Codex CLI, Gemini CLI, Cursor, Aider
- Pacote no npm, para `npx zasatsu-bakuto` funcionar sem clonar
- Card de fim de dia para compartilhar: giros, jackpots, melhor sequência

## Licença

MIT
