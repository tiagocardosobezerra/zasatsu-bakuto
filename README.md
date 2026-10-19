# Zasatsu Bakuto

**Português** | [English](README.en.md)

**Seu agente de IA trabalha. Você acompanha pelo canto do olho, numa máquina de pachinko com as regras da Expansão de Domínio do Hakari.**

![Node.js 20+](https://img.shields.io/badge/node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Electron](https://img.shields.io/badge/electron-33-47848F?style=flat-square&logo=electron&logoColor=white)
![Claude Code](https://img.shields.io/badge/Claude%20Code-hooks%20oficiais-D97757?style=flat-square&logo=anthropic&logoColor=white)
![100% local](https://img.shields.io/badge/dados-100%25%20local-2ea44f?style=flat-square)
![MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue?style=flat-square)

<p align="center"><img width="160" alt="Ícone do Zasatsu Bakuto: o sinal de mão da Expansão de Domínio do Hakari" src="docs/icon.png" /></p>

O Zasatsu Bakuto (坐殺博徒, *Idle Death Gamble*) é uma pequena máquina de pachinko que fica no canto da tela e joga sozinha enquanto o Claude Code trabalha. Cada ferramenta que o agente usa gira os rolos, rodar os testes vira リーチ, testes verdes podem dar o 大当たり, e quando o agente precisa de você a máquina avisa com o nome da conversa. Você para de encarar o terminal e também não esquece mais de voltar.

## O que ele faz por você

* **Mostra o que o agente está fazendo, sem você olhar o terminal.** Editar arquivo fecha as portas de シャッター, ler ou rodar comando acende uma bola de reserva, falhar e se recuperar vira ×2, ×3, ×4. Dá para entender de relance.
* **Avisa quando os testes passam ou quebram.** Rodar `npm test`, `pytest`, `go test` ou `cargo test` vira リーチ. Teste verde pode dar o jackpot de 4:11; teste vermelho é ハズレ.
* **Diz quando o agente precisa de você.** Pedido de permissão ou de resposta aparece como **あなたの番 · nome da conversa**, com um toque de aviso.
* **Acompanha todas as conversas ao mesmo tempo.** Cada conversa em andamento ganha uma linha com o projeto, o nome, o que está fazendo e a última ação. A lista cresce e diminui sozinha, e um clique numa linha com ↗ abre aquela conversa no app do Claude.
* **Não atrapalha.** O overlay deixa o clique passar, nunca bloqueia nem atrasa o agente, e tem um **modo discreto** (pequeno, sem som, translúcido) para o computador do trabalho.
* **É fiel ao mangá.** As regras vêm da folha de regras do CR私鉄純愛列車 que o Hakari mostra no capítulo 183 e das lutas dos capítulos 182 a 190. O japonês fica sempre na tela, com tradução embaixo em português ou inglês.

## Como fica na prática

> **Você:** corrige os testes do checkout
>
> **Claude:** lê os arquivos, edita dois deles e roda `npm test`.
>
> **A máquina:** portas fechando, bolas de reserva acendendo, リーチ!!, 華金終電リーチ ★★★… **大当たり.** O domínio quebra, a música começa e um contador de 4:11 desce na tela. Do outro lado, a linha da conversa `docs` fica azul: **あなたの番, esperando você.**

Você soube que os testes passaram e que outra conversa precisava de você sem abrir nenhuma janela.

| O que aparece na máquina | O que significa |
|---|---|
| Rolos girando, portas de シャッター, bolas de reserva 保留 | O agente está trabalhando |
| **リーチ** | O agente está rodando seus testes agora |
| **大当たり** | Os testes passaram |
| **ハズレ** | Os testes falharam |
| **×2 / ×3 / ×4** | Uma ferramenta falhou e o agente está se recuperando |
| **あなたの番 · nome** | O agente está esperando sua permissão ou sua resposta |
| O domínio fecha | Todas as conversas terminaram a vez |

## Comece em 3 passos

Você precisa do [Node.js](https://nodejs.org) 20 ou mais novo e do [Claude Code](https://claude.com/claude-code).

### 1. Instale

```bash
git clone https://github.com/tiagocardosobezerra/zasatsu-bakuto.git
cd zasatsu-bakuto
npm install
npm link
```

O `npm link` cria o comando `ryoiki`. O npm 11 pode pedir para você aprovar o script de instalação do Electron: `npm install-scripts approve electron`.

### 2. Ligue no Claude Code

```bash
ryoiki install
```

Adiciona os hooks em `~/.claude/settings.json` e guarda um backup. Para ligar só num projeto, use `ryoiki install --settings .claude/settings.json`.

### 3. Abra o domínio

```bash
ryoiki tenkai
```

**領域展開.** A máquina aparece no canto da tela e um ícone surge na bandeja. Abra uma conversa nova no Claude Code e trabalhe normalmente: a máquina acorda no seu primeiro prompt. Para ver tudo funcionando antes, rode `ryoiki demo`.

| Comando | No mangá | O que faz |
|---|---|---|
| `ryoiki tenkai` | **領域展開** Expansão de Domínio | Abre o domínio: overlay e ícone na bandeja |
| `ryoiki kaijo` | **領域解除** Desfazer o domínio | Fecha o domínio |
| `ryoiki install` / `ryoiki uninstall` | | Liga ou desliga os hooks do Claude Code (só os deste projeto) |
| `ryoiki demo` | | Toca uma sessão de exemplo |
| `ryoiki guide` | **遊び方** Como jogar | Abre o guia com glossário |
| `ryoiki settings` | | Abre as configurações |
| `ryoiki status` | | Diz se o domínio está aberto |
| `ryoiki serve` | | Só o servidor, para o OBS |

## Para ir além

### Configurações

Clique com o botão direito no ícone da bandeja → **Configurações…** (ou dois cliques nele), ou rode `ryoiki settings`. As mudanças valem na hora e ficam salvas em `~/.zasatsu-bakuto/config.json`. O placar e o modo da máquina ficam em `~/.zasatsu-bakuto/machine.json`.

* **Modo discreto:** máquina mini, sem som, nada em tela cheia e um pouco transparente. Desligou, tudo volta como estava.
* **Máquinas:** **Uma para todas** (padrão), em que toda conversa gira a mesma máquina e o placar fica salvo, ou **Uma por conversa**, em que cada conversa tem a sua e a tela segue a última em que você escreveu.
* **Linhas de conversa:** uma linha por conversa em andamento, até 1, 2 ou 3, ou **Ilimitado** (padrão), que cresce até a borda da tela e mostra "mais N conversas" no que não couber.
* **Na tela:** formato (**Normal**, **Compacto** ou **Mini**), tamanho, canto, opacidade e escurecer quando parada.
* **O que aparece:** Expansão de Domínio e jackpot em tela cheia, só na máquina ou desligados; movimento; e cada parte da máquina.
* **Som:** silenciar tudo, volume, sons da máquina, locutor japonês e suas músicas.
* **Idioma:** o japonês fica na tela, com tradução embaixo em português ou inglês, conforme o computador, ou só japonês.

O menu da bandeja tem os atalhos mais usados na mesma ordem.

### Som e movimento

O app não traz gravações de máquinas reais. Ele sintetiza os sons de um salão de pachinko: o **キュイン** subindo num efeito dourado ou arco-íris, a chuva de bolinhas de aço, a fanfarra do jackpot e a batida da porta de シャッター. O **locutor japonês** anuncia リーチ!, 大当たり! e 確定! com uma voz japonesa instalada no computador (no Windows: Configurações → Hora e idioma → Fala → Adicionar vozes → Japonês).

A **Expansão de Domínio inteligente** (padrão) abre em tela cheia na primeira vez e depois de 10 minutos parado; nas outras vezes, só na máquina. Se o sistema pede menos movimento, os efeitos ficam na máquina e nada treme ou pisca forte.

### Suas artes e músicas

O app não traz imagens nem músicas da obra. Se você tem arquivos que quer usar, coloque em `~/.zasatsu-bakuto/custom/` (ou defina `ZASATSU_CUSTOM_DIR`). Eles ficam só na sua máquina, e você é responsável por ter os direitos sobre eles.

<details>
<summary><strong>Nomes dos arquivos</strong></summary>

Vale `.png .jpg .webp .gif` para imagens e `.mp3 .ogg .wav .m4a` para áudio.

| Nome do arquivo | Usado para |
|---|---|
| `round.mp3` | Toca do jackpot até o fim da rodada de 4:11 (e repete se for mais curto) |
| `intro.png` | Arte de fundo atrás do 坐殺博徒 |
| `jackpot.png` | Arte na tela do jackpot |
| `reel-1.png` … `reel-7.png` | Arte de cada número dos rolos |
| `expand`, `riichi`, `kyuin`, `door`, `ball`, `consec`, `kakutei`, `jackpot`, `miss`, `heal` | Troca o som embutido daquele evento |

</details>

### Para quem faz live

Rode `ryoiki serve` e adicione `http://127.0.0.1:4111/` como browser source no OBS, com fundo transparente.

<details>
<summary><strong>Opções da browser source</strong></summary>

| Opção | O que faz |
|---|---|
| `?pos=br\|bl\|tr\|tl` | Canto (padrão `br`) |
| `?scale=1.5` | Tamanho |
| `?layout=normal\|compact\|mini` | Formato |
| `?lines=0\|1\|2\|3\|all` | Linhas de conversa |
| `?intro=full\|compact\|off`, `?jackpot=full\|compact\|off` | Sobrescrevem as configurações para essa source |
| `?opacity=0.8` | Opacidade |
| `?lang=pt\|en\|ja` | Idioma da tradução |
| `?mute` | Sem som |
| `?preview` | Fundo escuro e botão de demo, para testar num navegador comum |

</details>

### Outras IAs

O Claude Code vem pronto, mas a máquina não depende dele: ela escuta uma API local, e **qualquer agente que consiga fazer uma requisição HTTP quando algo acontece** pode jogar. Codex CLI, Gemini CLI, Cursor, GitHub Copilot e Aider ainda não têm adaptador pronto, mas dá para ligar qualquer um deles pela API se a ferramenta tiver hooks, scripts de evento ou notificações.

<details>
<summary><strong>Como ligar outra IA</strong></summary>

Mande um JSON por `POST` para `http://127.0.0.1:4111/event` a cada evento do agente, no formato dos hooks do Claude Code:

| `hook_event_name` | Quando mandar | Na máquina |
|---|---|---|
| `UserPromptSubmit` | Você mandou um pedido ao agente | Abre a Expansão de Domínio |
| `PreToolUse` | O agente vai usar uma ferramenta | Gira; comando de teste entra em リーチ |
| `PostToolUse` | A ferramenta terminou | Efeito de aviso; se for teste, o resultado decide |
| `PostToolUseFailure` | A ferramenta falhou | 疑似連 (×2, ×3, ×4) |
| `Notification` | O agente precisa de você | あなたの番 |
| `Stop` | O agente terminou a vez | O domínio fecha |

Campos usados: `session_id`, `cwd` (nome do projeto), `prompt` (título), `tool_name`, `tool_input.command` e `tool_response.stdout` (resumos como `12 passed` ou `1 failed`).

```bash
curl -X POST http://127.0.0.1:4111/event -H "Content-Type: application/json" \
  -d '{"hook_event_name":"PostToolUse","session_id":"meu-agente","cwd":"/projetos/app","tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":{"stdout":"12 passed"}}'
```

```powershell
$evento = @{ hook_event_name = 'Notification'; session_id = 'meu-agente'; cwd = 'C:\projetos\app' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4111/event -ContentType 'application/json' -Body $evento
```

Um adaptador é só um script que traduz os eventos da sua IA para esse JSON. Se fizer um, abra um pull request.

</details>

## As regras do domínio

Os eventos do agente são a luta. Cada regra vem da folha de regras que o Hakari mostra no capítulo 183 (*CR私鉄純愛列車*) ou das lutas dos capítulos 182 a 190.

| Regra do domínio (fonte) | O que dispara |
|---|---|
| **領域展開**, o acerto garantido transfere as regras (cap. 182, 187) | Você manda um prompt, ou o agente age sem domínio aberto |
| Cada giro sorteia o jackpot em **約1/239** (folha de regras) | Cada ferramenta que termina |
| Avisos 予告演出: portas de **シャッター** e bolas **保留玉** (folha de regras) | Edit/Write abrem as portas; as outras ferramentas, as bolas |
| **疑似連** refaz a sequência, ×2, ×3, ×4, e falha muito fora do 確変 (cap. 187) | Uma ferramenta que falha e o agente se recupera |
| Cores **緑 < 赤 < 金**; **虹色 ou o ×4 confirmam o jackpot** (folha de regras) | A cor de cada efeito |
| **リーチ** só depois de um efeito, com 4 cenários: 交通系IC ★☆☆, 座席争奪 ★★☆, うっかり特快 ★★☆, 華金終電 ★★★ (folha de regras, cap. 183) | Testes rodando, ou um sorteio de 1/239 ganho |
| チャンスアップ: 夢背景, 天ノ川カットイン, 群予告 (folha de regras) | Durante a リーチ, mais quando vai dar certo |
| **ハズレ** volta o cenário ao começo (cap. 183) | Testes vermelhos, ou cenário que falha |
| **大当たり**: o domínio some e vêm **4:11** de energia amaldiçoada infinita, a duração de *Admiring You*, com técnica reversa automática (cap. 186 a 189) | Testes verdes com cenário vencedor |
| Trinca ímpar → **確変** até o próximo jackpot; par → **時短** por 70 ou 30 giros; **確変突入率 約75%**; às vezes **潜伏確変** (folha de regras, cap. 187, 189) | Todo jackpot; o selo do modo mostra a chance da vez |
| **領域解除**, o 連チャン zera | Todas as conversas terminam a vez sem jackpot |

<details>
<summary><strong>Onde as fontes não dizem nada</strong></summary>

* Os números 3 (Yume, 夢) e 4 (Hiro, 空) trazem os personagens do capítulo 183; os outros números ficam com o resto do elenco de *Private Pure Love Train*.
* A probabilidade aumentada é 1/24; o 疑似連 falha metade das vezes fora dela (10% dentro); o 潜伏確変 vem em 25% dos jackpots pares. O mangá não dá esses números.
* A folha de regras diz "4回目", e o pachinko conta o 疑似連 a partir do ×2, então a máquina confirma no ×4.
* A história do Seat Struggle Riichi nunca foi mostrada, então as falas dele são inventadas.
* Ligar eventos do agente a eventos da luta (testes = リーチ, falhas = 疑似連) é escolha deste projeto.
* O resultado dos testes vem do próprio hook: Bash que falha é vermelho, e resumos como `12 passed`, `1 failed` ou `test result: ok` decidem o resto.

</details>

## Como funciona por dentro

```
Claude Code ──hook (async)──▶ src/hook.js ──POST /event──▶ servidor (127.0.0.1:4111)
                                                              │ classifica → máquina
                                                              ▼
                                         overlay ◀── SSE /stream ──▶ OBS · navegador
```

| Peça | O que faz |
|---|---|
| **`ryoiki`** (`bin/ryoiki.js`) | A linha de comando: `tenkai`, `kaijo`, `install`, `demo`, `guide`, `settings`, `status`, `serve` |
| **Hook** (`src/hook.js`) | Repassa cada evento do Claude Code e sai na hora: nunca imprime, nunca bloqueia, sempre sai com código 0 |
| **Classificador** (`src/classify.js`) | Transforma o evento bruto num sinal (`tool-done`, `test-start`, `attention`…) e lê o resultado dos testes |
| **Jogo** (`src/game.js`) | As regras do Hakari: sorteio de 1/239, efeitos, リーチ, jackpot, 確変 e 時短 |
| **Máquinas** (`src/machine.js`, `src/each.js`) | Uma máquina para todas as conversas, ou uma por conversa |
| **Conversas** (`src/sessions.js`, `src/links.js`) | As linhas de conversa e o link de cada uma para o app do Claude |
| **Servidor** (`src/server.js`) | Recebe os eventos, guarda o placar e transmite tudo para as telas |
| **Overlay** (`public/`) | A máquina na tela, em HTML, CSS e JS puros, com o guia e as configurações |
| **Desktop** (`src/electron-main.js`) | A janela transparente que deixa o clique passar, e o ícone na bandeja |

Nada sai do seu PC: tudo roda em `127.0.0.1`, sem telemetria nem conta. Para os links das conversas, o app lê no seu computador só o ID de cada conversa nos arquivos do app do Claude.

Para conferir a instalação a qualquer momento:

```bash
npm test
ryoiki status
```

## Estrutura do repositório

```
zasatsu-bakuto/
├── bin/ryoiki.js          # Linha de comando
├── src/                   # Hook, classificador, jogo, máquinas, servidor e app desktop
├── public/                # Overlay, guia, configurações e ícone
├── scripts/               # Gera o ícone (npm run icon)
├── docs/                  # Ícone do README e prompt das animações
└── test/                  # Suíte de testes (node:test)
```

## Desenvolvimento

```bash
npm install
npm test            # node:test, sem dependências extras
npm run serve       # depois abra http://127.0.0.1:4111/?preview
npm start           # overlay Electron
npm run icon        # gera o ícone de novo a partir de public/icon-render.js
```

## Próximos passos

* Animações do README (veja o [prompt das animações](docs/roteiro-animacao.md))
* Pacotes de tema: rolos, sons e tela do jackpot trocáveis
* Adaptadores para Codex CLI, Gemini CLI, Cursor e Aider
* Pacote no npm, para `npx zasatsu-bakuto` funcionar sem clonar

## Créditos

**Criador:** Tiago Cardoso Bezerra | [tiagocardosobezerra](https://github.com/tiagocardosobezerra)

Batizado em homenagem à Expansão de Domínio de Kinji Hakari em Jujutsu Kaisen, o feiticeiro que transformou uma máquina de pachinko em técnica de combate e confia a vitória à sorte.

## Agradecimentos

* Minha esposa **Júlia** e meus filhos **Arthur** e **Aurora**, o porto seguro onde encontro paz, inspiração e a leveza de que preciso todos os dias.
* **Bruna Cardoso Bezerra** | [brunacbezerra](https://github.com/brunacbezerra), por me ensinar tudo o que sei sobre o Claude Code.
* **Você**, por usar o Zasatsu Bakuto!

## Aviso

Projeto de fã, sem vínculo com Jujutsu Kaisen, Gege Akutami, Shueisha ou MAPPA. Não inclui nenhuma arte ou música oficial: tudo é desenhado em CSS e os sons são sintetizados. Arquivos que você adicionar à pasta `custom` ficam só na sua máquina, e você é responsável por ter os direitos sobre eles.

## Licença

MIT License, veja [LICENSE](LICENSE) para detalhes.

---

<p align="center"><strong>Zasatsu Bakuto</strong>, seu agente trabalha. você joga.</p>

```
                                ▒▒░░░
                              ░▒██░▒▒░
                            ▒░███▒░▒░░
                          ▒▒████▒▒░░░▒
                        ░▒▒▒▒▒░░░░░░▒
                   ▒▒▒▒▒▒█████▒░░▒▒
                ▒▒▒█████████▒▒▒░
             ▒▒▒████████▒▒▒▒▒░░
           ▒▒███████▒░▒░░▒▒░░▒                                 ▒▒▒▒▒▒▒
          ▒████████▒░░▒░▒▒░░                                  ░▒██████▒░░▒
        ▓░██████▒▒░▒▒░▒▒▒▒░▒▒▒▒                              ░████████████▒▒
       ▒▒███████░▒▒░░▒▒░░░▒█████▒▒                          ░███████████████▒░
     ▒▒███████▒▒█▒▒█▒▒▒▒▒▒░░▒█████▒▒                      ▒▒████████████████░▒
    ░███████▒███████████░░░░░░█████▒                    ▒▒░███████████████▒░
   ▒████████████████████░▒▒░█▒█▒█▒░               ▒▒▒▒▒██████████████████░░
   ▒███████████████████▒░░░██▒█▒██░█▒▒        ▒▒▒███████████████████████░
  ▒███████████████████▒░░▒███▒██▒▒▒█▒▒      ▒▒███████████████████████▒▒▒
  ░█████████░█████████▒▒░███▒█▒▒███▒      ▒▒█████████████████████████░
 ▒██████████░█████████▒▒░█▒░▒█████░      ▒▒█████████████████████████▒░
 ▒█████████░█████████▒▒░░░▒▒█████▒       ░█████████████████████████▒░
 ▒████████▒▒██████████▒▒███████▒▒        ░██████████████████████▒█▒░
▒████████▒██████████████████▒▒▒          ░███████████████████████▒
░██████▒█████████████████▒▒              ░█████████████████████▒▒
▒████▒▒████████████████▒▒                ░████▒▒▒██████▒█████▒▒
▒██████████▒░▒█▒███▒▒▒▒                 ░█████▒▒████▒▒██████▒
░███████████░██░░                       ▒████▒▒████▒████░░▒░
░███████████▒▒▒░░                       ░████▒████▒████▒▒░░
░████████████░▒▒▒                       ░░▒▒▒████▒███▒░░░▒
▒▒▒██████████▒██▒                        ░░█████▒███▒░░▒
   ▒▒▒███████████▒                       ░█████▒███░▒░
      ▒▒▒▒▒██████▒                      ▒████▒▒███▒▒░
            ▒▒▒▒▒▒░                   ▒▒████▒███▒▒░░
                                     ░████▒▒███░░▒▒
                                    ░████▒███▒░▒░
                                   ▒▒█▒▒░████▒░░
                                   ░█▒▒▒███▒█▒░
                                    ░▒▒█▒▒░░░▒
                                    ░██▒▒░░▒
                                    ▒▒█▒░░
```
