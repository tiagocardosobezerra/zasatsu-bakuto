# Roteiro das animações do Zasatsu Bakuto

Duas animações para o README, no mesmo formato das do Vegapunk:

| Arquivo | Onde aparece | Duração | Para que serve |
|---|---|---|---|
| `assets/zasatsu-banner.svg` (+ `-en.svg`) | Topo do README, logo abaixo dos selos | 48 s, em loop | Vender a ideia em 6 cenas: o problema, o domínio, a máquina trabalhando, o jackpot, a sua vez e a marca |
| `assets/zasatsu-dominio.svg` (+ `-en.svg`) | Seção "Como funciona por dentro" | 30 s, em loop | Mostrar o caminho de um evento, do Claude Code até a máquina, em 4 passos |

## Regras técnicas (iguais às do Vegapunk)

* **Formato:** SVG de **1280 × 640**, `viewBox="0 0 1280 640"`, com `role="img"` e `aria-label` no idioma do arquivo.
* **Só CSS, sem JavaScript.** O GitHub mostra o SVG dentro de `<img>`, onde script não roda. Toda a animação é `@keyframes`.
* **Um relógio só.** Uma classe `.a` define `animation-duration` igual à duração total (48 s ou 30 s), `animation-iteration-count: infinite` e `animation-fill-mode: both`. Cada elemento só escolhe o `animation-name`. Os tempos de cada cena viram porcentagens desse relógio, como `14.583%` para 7 s em 48 s.
* **Comentário com a linha do tempo** no topo do CSS, como no Vegapunk:
  `/* Linha do tempo: 48 s. Cena 1 0–7 · Cena 2 7–13 · Cena 3 13–22 · Cena 4 22–36 · Cena 5 36–43 · Cena 6 43–48 */`
* **Layout em HTML** dentro de um `<foreignObject>` de 1280 × 640, com posições absolutas. Fica mais fácil escrever texto, chips e listas.
* **Fontes embutidas** em base64 (woff), só com os caracteres usados:
  * **Inter** 400/600/700 para o texto;
  * **Dela Gothic One** para os efeitos sonoros (ドン!!, リーチ!!);
  * **Yuji Boku** para o kanji pincelado (坐殺博徒, 領域展開, 大当たり).
  Sem isso, o GitHub troca por uma fonte do sistema.
* **Loop limpo.** Tudo some entre 98,9% e 100% e reaparece no 0%. Quem estiver assistindo não vê o corte.
* **Tamanho:** até ~250 KB por arquivo. O banner do Vegapunk tem 222 KB.
* **Duas versões.** O arquivo em português e o `-en.svg` em inglês, com a mesma linha do tempo. Só os textos mudam.
* **Pausa opcional:** `animation-play-state: var(--ps, running)`, como no Vegapunk, para gerar quadros parados ao testar.

## Identidade visual

| Uso | Cor | Onde já aparece no app |
|---|---|---|
| Fundo (dentro do domínio) | `#120a18` → `#1f1030`, brilho violeta `#4a2373` no centro | Ícone e overlay |
| Grade de fundo | linhas `rgba(139, 92, 246, .07)` a cada 40 px | Igual à grade ciano do Vegapunk, em violeta |
| Energia amaldiçoada | `#8b5cf6` | Borda das chamas |
| Rosa da máquina (CR私鉄純愛列車) | `#ff7eb6` | Título e moldura |
| Dourado (jackpot, 金) | `#ffd23f` | Lâmpadas e 大当たり |
| Vermelho (リーチ, 赤, erro) | `#ff2d55` | Riichi e falhas |
| Ciano (あなたの番, 確変 que pisca) | `#3be8ff` | Linha de "esperando você" |
| Verde (作業中, 緑) | `#9ff0b8` | Linha de "trabalhando" |
| Creme (mãos) | `#f6efe2` | Sinal de mão |

* **Símbolo:** o sinal de mão de `public/hand-sign.svg`, que já é vetor. Basta colar o `<path>` dentro do SVG.
* **Japonês sempre com tradução embaixo**, menor, como no app: `大当たり` com "Jackpot" embaixo, `リーチ` com "Riichi".
* **Nada de arte oficial** da obra: só o nosso vetor, CSS e tipografia.

---

## Animação 1: o banner (48 s)

O roteiro segue o arco do banner do Vegapunk: **problema → pedido → solução → prova → marca.** Aqui o arco fica: o agente trabalha e você não sabe o que acontece → o domínio abre → a máquina joga sozinha → o jackpot → a sua vez → a marca.

### Cena 1 · O problema (0 s a 7 s · 0% a 14,583%)

**Ideia:** quem usa agente de IA conhece a situação. Ou você fica olhando o terminal, ou sai e esquece de voltar.

**Layout:** a tela é dividida ao meio, como os dois editores da cena 1 do Vegapunk.

* **Esquerda (x 60 a 610, y 120 a 460): "Terminal".**
  * Uma janela escura com o título `claude · zasatsu-bakuto`.
  * Linhas sobem sem parar: `● Read src/game.js`, `● Edit src/server.js`, `● Bash npm test`…
  * Um cronômetro no canto conta `00:12 … 03:47 … 04:11`, cada vez mais rápido.
* **Direita (x 670 a 1220, y 120 a 460): "Você, em outra janela".**
  * Uma janela clara de navegador com um café.
  * Um aviso aparece apagado no canto: `Claude precisa da sua permissão`.
  * Ninguém vê o aviso: ele fica cinza e some.

**Movimento:**

* **0,3 a 1,3 s:** as linhas do terminal começam a subir em loop. Use `translateY` com `steps()` para parecer rolagem de texto.
* **0,3 a 2,7 s:** uma legenda é digitada à esquerda, com cursor piscando, como as legendas `tyL`/`tyR` do Vegapunk: "Ficar encarando o terminal". Ao terminar, a palavra **encarando** fica vermelha e treme, como o `badL`.
* **1,8 a 4,2 s:** uma segunda legenda é digitada à direita: "Ou sair e esquecer de voltar". A palavra **esquecer** fica vermelha e treme.
* **4,2 a 5 s:** o aviso `precisa da sua permissão` aparece na janela da direita, fica cinza em 0,8 s e some.
* **6,6 a 7 s:** as duas janelas deslizam para o centro e encolhem para 90%, como `hL`/`hR`. Fade out.

**Textos:**

| PT | EN |
|---|---|
| Ficar **encarando** o terminal | **Staring** at the terminal |
| Ou sair e **esquecer** de voltar | Or walking away and **forgetting** to come back |
| Claude precisa da sua permissão | Claude needs your permission |

### Cena 2 · 領域展開 (7 s a 13 s · 14,583% a 27,083%)

**Ideia:** a resposta, em estilo de mangá. O Hakari faz o sinal e o domínio abre.

**Layout:** tela cheia, com o fundo violeta escuro e a grade de 40 px aparecendo (como o `gridbg`).

**Movimento:**

* **7 a 7,4 s:** um flash branco rápido de 1 quadro, como o corte de página do mangá.
* **7,4 a 8,4 s:** o sinal de mão entra no centro (x 640, y 280, cerca de 300 px), saindo de `scale(1.4)` e `opacity 0` para `scale(1)`. Atrás dele, uma explosão de tinta preta em `clip-path` de estrela (a mesma forma do `.burst` do guia).
* **8,4 a 9,4 s:** os kanjis **坐殺博徒** batem um a um embaixo do sinal (y 470, Yuji Boku de 96 px, dourado em degradê). Cada um entra com `scale(1.6) → 1` e um tremor de 2 px.
* **9,4 a 10 s:** embaixo, em Inter de 20 px, aparece **領域展開 · Expansão de Domínio**.
* **10 a 12,4 s:** linhas de velocidade giram devagar atrás do sinal (`conic-gradient`, rotação de 20° em 2,4 s, sem piscar).
* **10,6 a 12,4 s:** a legenda da cena aparece embaixo (y 580), como o balão `bubble` do Vegapunk.
* **12,6 a 13 s:** tudo encolhe para o canto inferior direito, virando o ícone da máquina. É a ponte para a cena 3.

**Textos:**

| PT | EN |
|---|---|
| 坐殺博徒 · Idle Death Gamble | 坐殺博徒 · Idle Death Gamble |
| 領域展開 · Expansão de Domínio | 領域展開 · Domain Expansion |
| Cada ferramenta que o Claude usa vira um giro. | Every tool Claude uses becomes a spin. |

### Cena 3 · A máquina joga sozinha (13 s a 22 s · 27,083% a 45,833%)

**Ideia:** mostrar que a máquina traduz o trabalho do agente. Cada ação vira um efeito que se entende de relance.

**Layout:**

* **Direita (x 820 a 1200, y 60 a 600):** a máquina, uma versão simplificada do overlay (380 px de largura):
  * título **CR私鉄純愛列車** com o selo **通常 1/239**;
  * duas linhas de conversa: `gestu · 作業中 trabalhando` e `api · 作業中 trabalhando`;
  * a tela do trem com os três rolos;
  * a linha de 保留 com as bolinhas.
* **Esquerda (x 80 a 740):** uma coluna de 3 "fichas" de evento, cada uma com uma seta para a máquina:

| Ficha (o que o Claude fez) | O que acontece na máquina | Legenda curta PT / EN |
|---|---|---|
| `Edit src/vender.tsx` | As portas de シャッター fecham e abrem na tela | Editou um arquivo → portas / Edited a file → shutter doors |
| `Read src/theme.ts` | Uma bola 保留 acende (verde, depois vermelha) | Leu um arquivo → bola de reserva / Read a file → reserve ball |
| `Bash ✗ falhou` → `Bash ✓` | Aparece **×2**, depois **×3** no canto da tela | Falhou e se recuperou → 疑似連 / Failed and recovered → 疑似連 |

**Movimento:**

* **13 a 14 s:** a máquina entra pela direita (`translateX(40px) → 0`) e a coluna de fichas aparece.
* **14 a 16,5 s:** a ficha `Edit` acende em ciano. Uma linha tracejada corre até a máquina (`stroke-dashoffset`), as portas fecham e abrem com um tremor de 1 px, e a legenda aparece.
* **16,5 a 19 s:** a ficha `Read` acende. Uma bolinha voa até a linha de 保留 e fica verde; meio segundo depois, troca para vermelho (緑 → 赤), mostrando que a cor sobe.
* **19 a 21,5 s:** a ficha `Bash` aparece vermelha com ✗, vira ✓ e a máquina mostra **×2**, depois **×3**, em 0,4 s cada.
* **Os rolos giram o tempo todo** desta cena, em `translateY` com `steps(7)`, sem parar em três iguais.
* **21,6 a 22 s:** as fichas somem; a máquina fica e vai para o centro.

**Legenda da cena (y 600):**

| PT | EN |
|---|---|
| Você entende o que o agente faz com o canto do olho. | You read what the agent is doing from the corner of your eye. |

### Cena 4 · リーチ → 大当たり (22 s a 36 s · 45,833% a 75%)

**Ideia:** o momento mais divertido, que é a assinatura do projeto. Testes rodando viram リーチ; testes verdes viram o jackpot de 4:11.

**Layout:** a máquina cresce no centro (cerca de 1,4×). Acima dela, uma ficha `Bash npm test`.

**Movimento:**

* **22 a 23 s:** a ficha `npm test` desce sobre a máquina. A linha da conversa `api` muda para **リーチ riichi (testes rodando)**, em vermelho, com a bolinha pulsando.
* **23 a 24,5 s:** **リーチ!!** estoura na tela em Dela Gothic One, com o fundo de papel recortado (o `.burst` do guia). O primeiro e o segundo rolo param em **7** e **7**.
* **24,5 a 27,5 s:** aparece o nome do cenário, **華金終電リーチ ★★★**, com "Riichi do último trem de sexta" embaixo. As estrelas acendem uma a uma. O terceiro rolo gira cada vez mais devagar: troca `steps()` por `ease-out` em 3 s.
* **27,5 a 28,5 s:** uma ficha `✓ 12 passed` aparece em verde sobre a ficha do teste.
* **28,5 s:** o terceiro rolo para em **7**. Flash branco de 1 quadro.
* **28,6 a 30 s:** **大当たり** bate na tela em Yuji Boku de 120 px, dourado. Embaixo, menor, "Jackpot". Ao fundo, a explosão **ドン!!**.
* **30 a 31,5 s:** o domínio quebra. O fundo violeta se parte em 8 cacos (`clip-path` de polígonos) que caem com rotação, como os `.shards` do overlay. Atrás, aparece um fundo dourado.
* **31,5 a 35,5 s:** um contador **4:11** aparece embaixo e começa a descer (`4:11 → 4:07`, em `steps()`). Notas musicais ♪ sobem em fila dos dois lados. Aparece a legenda **呪力無制限 · Energia amaldiçoada infinita**. A linha da conversa `api` vira **大当たり中 rodada do jackpot**, em dourado.
* **35,6 a 36 s:** fade para o violeta.

**Textos:**

| PT | EN |
|---|---|
| リーチ!! · Testes rodando | リーチ!! · Tests running |
| 華金終電リーチ ★★★ · Riichi do último trem de sexta | 華金終電リーチ ★★★ · Friday Night Final Train Riichi |
| 大当たり · Jackpot | 大当たり · Jackpot |
| 呪力無制限 4:11 · Energia amaldiçoada infinita | 呪力無制限 4:11 · Unlimited cursed energy |
| Testes verdes. 1 em 239. Regras do Hakari. | Green tests. 1 in 239. Hakari's rules. |

### Cena 5 · あなたの番 (36 s a 43 s · 75% a 89,583%)

**Ideia:** o lado útil. Com várias conversas, a máquina diz quem precisa de você e leva até ela com um clique.

**Layout:** só a parte de cima da máquina, ampliada (x 340 a 940, y 120 a 440), com três linhas de conversa:

1. `gestu “Ajustar layout da aba Vender” · 作業中 trabalhando`
2. `api “Corrigir testes do checkout” · 終了 terminou`, apagada
3. `docs “Revisar o README” · 作業中 trabalhando`

**Movimento:**

* **36 a 37 s:** as linhas entram uma a uma, de cima para baixo, com 0,2 s entre elas.
* **37,5 a 38,5 s:** a linha `docs` muda para **あなたの番 esperando você**. A bolinha ganha o anel ciano e pisca (o `sess-blink`, a 1 Hz). Em cima da máquina aparece o balão **あなたの番 · docs**.
* **38,5 a 40,5 s:** um cursor de mouse entra pela direita até a linha `docs`. A linha clareia e o nome ganha sublinhado e **↗**.
* **40,5 a 41 s:** clique: a linha pisca uma vez (o `conv-open`).
* **41 a 42,6 s:** uma janelinha do app do Claude sobe por trás com o título "Revisar o README" e o pedido de permissão em destaque. A legenda da cena aparece.
* **42,6 a 43 s:** fade.

**Textos:**

| PT | EN |
|---|---|
| Uma máquina para todas as conversas. | One machine for every conversation. |
| Quem precisa de você aparece na hora. Um clique e você está lá. | Whoever needs you shows up right away. One click and you are there. |

### Cena 6 · A marca (43 s a 48 s · 89,583% a 100%)

**Ideia:** o fechamento, igual ao do Vegapunk (logo, frase e três selos).

**Layout:** centralizado, com fundo violeta e a grade.

* **Centro, y 200:** o ícone do app (o sinal de mão no quadrado arredondado), com 120 px.
* **y 330:** **ZASATSU BAKUTO** em Inter 700, 64 px, com espaçamento largo, em creme.
* **y 380:** **坐殺博徒** em Yuji Boku, 36 px, dourado.
* **y 440:** a frase da marca.
* **y 510:** três selos lado a lado, no estilo dos chips do Vegapunk.
* **y 590:** a linha de rodapé, menor, em cinza.

**Movimento:**

* **43 a 44 s:** o ícone entra com `scale(.8) → 1` e um brilho violeta pulsando uma vez.
* **44 a 45 s:** o nome e o kanji aparecem, como o `logo` do Vegapunk.
* **45 a 46 s:** a frase aparece. A palavra-chave fica dourada.
* **46 a 47,2 s:** os três selos entram um a um, como o `tg6`/`bd6` do Vegapunk.
* **47,5 a 48 s:** fade de tudo; o loop recomeça na cena 1.

**Textos:**

| PT | EN |
|---|---|
| Seu agente trabalha. Você **joga**. | Your agent works. You **gamble**. |
| Hooks oficiais · 100% local · Fiel ao mangá | Official hooks · 100% local · Faithful to the manga |
| Claude Code · Node.js · Electron · MIT | Claude Code · Node.js · Electron · MIT |

---

## Animação 2: como funciona por dentro (30 s)

O formato segue o "sonar" do Vegapunk: **uma faixa de 4 passos no topo** e uma área central em que um nó emite ondas e se liga aos outros.

**Faixa do topo (y 40 a 90):** os 4 passos lado a lado, ligados por uma barra de progresso. O passo atual fica claro e os outros apagados, como o `st1..st4` e o `pg2..pg4` do Vegapunk.

```
/* Linha do tempo: 30 s. 1 O hook avisa 0–6 · 2 Vira sinal 6–13 · 3 A máquina decide 13–22 · 4 Aparece na tela 22–30 */
```

### Passo 1 · O hook avisa (0 s a 6 s · 0% a 20%)

* **Esquerda (x 120, y 330):** a pílula **Claude Code**, com borda violeta e brilho, no estilo `.vi` do Vegapunk.
* **0,5 a 2 s:** sai dela uma pílula menor, `PostToolUse · Edit`, que anda até o centro.
* **Centro (x 640, y 330):** o nó **127.0.0.1:4111**, um círculo com o ícone do app.
* **2 a 4 s:** ao chegar, o nó emite 2 anéis de onda, como o `.ring` do sonar.
* **Embaixo do nó:** o selo verde **só no seu PC**, como o `.seal` do Vegapunk.

| Legenda PT | Legenda EN |
|---|---|
| 1 · O hook avisa | 1 · The hook tells |
| O Claude Code avisa o Zasatsu a cada passo, sem esperar resposta. | Claude Code tells Zasatsu about every step, without waiting for an answer. |

### Passo 2 · Vira sinal (6 s a 13 s · 20% a 43,333%)

* **6 a 8 s:** em volta do nó central, três pílulas se abrem em leque, ligadas por linhas que crescem (o `.ln`):
  * `tool-done` em ciano;
  * `test-start` em vermelho;
  * `attention` em ciano claro.
* **8 a 11 s:** cada pílula ganha um rótulo embaixo, no estilo do `.why`:
  * `tool-done` → "giro · 保留 / シャッター";
  * `test-start` → "リーチ";
  * `attention` → "あなたの番".
* **11 a 13 s:** uma pílula cinza `SessionStart` aparece e se apaga, com o rótulo "só registra". Ela mostra que nem todo evento gira.

| Legenda PT | Legenda EN |
|---|---|
| 2 · Vira sinal | 2 · It becomes a signal |
| Cada evento vira um sinal que a máquina entende. | Every event becomes a signal the machine understands. |

### Passo 3 · A máquina decide (13 s a 22 s · 43,333% a 73,333%)

* **13 a 15 s:** à direita do centro aparece o bloco **Uma máquina**, com o selo **通常 1/239**.
* **15 a 18 s:** três linhas coloridas entram nele vindas de três bolinhas de conversa (`gestu`, `api`, `docs`), cada uma com a sua cor. Mensagem: todas as conversas giram a mesma máquina.
* **18 a 20 s:** uma roleta pequena gira dentro do bloco e para em **7 7 7**. O selo troca para **確変 1/24**, em vermelho piscando, com a etiqueta "trinca ímpar → chance aumentada".
* **20 a 22 s:** aparece um selo verde **salvo em machine.json**, e o bloco ganha um ✓.

| Legenda PT | Legenda EN |
|---|---|
| 3 · A máquina decide | 3 · The machine decides |
| Uma máquina só para todas as conversas. As regras do Hakari decidem cada giro. | One machine for every conversation. Hakari's rules decide every spin. |

### Passo 4 · Aparece na tela (22 s a 30 s · 73,333% a 100%)

* **22 a 24 s:** do bloco saem três linhas até três destinos à direita:
  * **Overlay** (o ícone da bandeja);
  * **OBS**;
  * **Navegador**.
  Todas são ligadas por `SSE /stream`.
* **24 a 27 s:** no destino **Overlay** aparece a máquina pequena, com as linhas de conversa e os rolos em 7 7 7.
* **27 a 29 s:** a frase final aparece embaixo, como "Acha o certo. Descarta o errado. Prova cada passo." no Vegapunk.
* **29,6 a 30 s:** fade e o loop recomeça.

| Legenda PT | Legenda EN |
|---|---|
| 4 · Aparece na tela | 4 · It shows on screen |
| Cada giro chega ao overlay, ao OBS ou ao navegador na hora. | Every spin reaches the overlay, OBS or a browser right away. |
| **Escuta. Joga. Avisa.** Sem sair do seu PC. | **Listens. Plays. Tells you.** Without leaving your computer. |

---

## Checklist de produção

1. Montar o banner em HTML num arquivo de rascunho, com as 6 cenas visíveis por botões, e acertar posições e textos.
2. Converter para SVG: o HTML vai dentro de `<foreignObject>` e o CSS vai num único `<style>` com a linha do tempo no topo.
3. Gerar os subsets das fontes só com os caracteres usados (por exemplo, com `pyftsubset`) e embutir em base64.
4. Calcular as porcentagens a partir dos segundos deste roteiro (segundos ÷ duração × 100, com 3 casas).
5. Conferir no navegador, quadro a quadro, com `--ps: paused` e `animation-delay` negativo.
6. Gerar o `-en.svg` trocando só os textos.
7. Publicar em `assets/`, colocar no README e conferir na página do GitHub: o GitHub serve o SVG por proxy e às vezes demora alguns minutos para atualizar o cache.
8. Conferir o tamanho final (até cerca de 250 KB por arquivo).
