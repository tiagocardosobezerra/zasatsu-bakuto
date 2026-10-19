# Prompt: animações do README do Zasatsu Bakuto

> **Como usar:** copie tudo a partir de "Você vai criar" e mande para a IA. Anexe junto dois arquivos do repositório:
>
> * `public/hand-sign.svg`: o sinal de mão, em vetor;
> * `docs/icon.png`: o ícone do app.

---

Você vai criar **duas animações em SVG** para o README de um projeto open source no GitHub, o **Zasatsu Bakuto**.

## Sobre o projeto

O Zasatsu Bakuto (坐殺博徒, *Idle Death Gamble*) é uma pequena máquina de pachinko que fica no canto da tela e joga sozinha enquanto o Claude Code, um agente de IA de programação, trabalha. Ela segue as regras da Expansão de Domínio do personagem Kinji Hakari, de Jujutsu Kaisen:

* cada ferramenta que o agente usa gira os rolos;
* rodar os testes vira リーチ (riichi);
* testes verdes podem dar o 大当たり (jackpot), que dura 4 minutos e 11 segundos;
* quando o agente precisa da pessoa, a máquina avisa com o nome da conversa.

A ideia que as animações precisam passar: **você para de encarar o terminal e também não esquece mais de voltar.**

## O que entregar

1. **`zasatsu-banner.svg`:** o banner do topo do README. Tem **48 segundos**, roda em loop e é dividido em **6 cenas**.
2. **`zasatsu-dominio.svg`:** a animação da seção "Como funciona por dentro". Tem **30 segundos**, roda em loop e mostra **4 passos**.

**Todo o texto é em português do Brasil.** Não faça versão em inglês.

## Regras técnicas (obrigatórias)

* **Tamanho:** `width="1280" height="640" viewBox="0 0 1280 640"`, com `role="img"` e um `aria-label` descrevendo a animação.
* **Só CSS, nenhum JavaScript.** O GitHub mostra o SVG dentro de uma tag `<img>`, onde script não roda. Toda a animação é feita com `@keyframes`.
* **Um relógio só.** Uma classe `.a` define:

  ```css
  animation-duration: 48s;              /* 30s no segundo arquivo */
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-delay: var(--d, 0s);
  animation-play-state: var(--ps, running);
  ```

  Cada elemento só escolhe o `animation-name`. O tempo de cada cena vira porcentagem desse relógio. Exemplo: 7 s em 48 s = `14.583%`.
* **Linha do tempo em comentário** no topo do CSS:

  ```css
  /* Linha do tempo: 48 s. Cena 1 0–7 · Cena 2 7–13 · Cena 3 13–22 · Cena 4 22–36 · Cena 5 36–43 · Cena 6 43–48 */
  ```

* **Layout em HTML** dentro de um `<foreignObject>` de 1280 × 640, com posições absolutas. Use `<div>` e `<span>` para textos, chips e listas.
* **Fontes embutidas** em base64 (woff), só com os caracteres usados:
  * **Inter** 400, 600 e 700, para o texto;
  * **Dela Gothic One**, para os efeitos sonoros (ドン!!, リーチ!!);
  * **Yuji Boku**, para os kanjis pincelados (坐殺博徒, 領域展開, 大当たり).

  Sem fonte embutida, o GitHub troca por uma fonte do sistema.
* **Loop sem corte:** tudo some entre 98,9% e 100% e reaparece no 0%.
* **Tamanho do arquivo:** até cerca de 250 KB cada.
* **Nada pisca rápido:** flashes de no máximo 1 quadro e piscadas lentas, de cerca de 1 Hz.

## Identidade visual

| Uso | Cor |
|---|---|
| Fundo (dentro do domínio) | Degradê de `#120a18` para `#1f1030`, com um brilho violeta `#4a2373` no centro |
| Grade de fundo | Linhas `rgba(139, 92, 246, .07)` a cada 40 px |
| Energia amaldiçoada | `#8b5cf6` |
| Rosa da máquina | `#ff7eb6` |
| Dourado (jackpot) | `#ffd23f` |
| Vermelho (リーチ, erro) | `#ff2d55` |
| Ciano (esperando você) | `#3be8ff` |
| Verde (trabalhando) | `#9ff0b8` |
| Creme (mãos) | `#f6efe2` |
| Texto principal | `#fbf4ff` |
| Texto secundário | `#a493b0` |

* **Símbolo:** use o sinal de mão do arquivo `hand-sign.svg` anexado. Copie os `<path>` dele para dentro do SVG.
* **Japonês sempre com tradução embaixo,** menor e mais clara. Por exemplo, `大当たり` com "Jackpot" embaixo.
* **Não use nenhuma arte oficial do anime ou do mangá.** Só o sinal de mão anexado, formas em CSS e tipografia.
* **Estilo:** escuro e elegante, com toques de mangá: explosões de tinta em forma de estrela, linhas de velocidade e efeitos sonoros em japonês. Nada de visual infantil.

---

## Animação 1: `zasatsu-banner.svg` (48 s)

O arco é: o agente trabalha e você não sabe o que acontece → o domínio abre → a máquina joga sozinha → o jackpot → a sua vez → a marca.

### Cena 1 · O problema (0 s a 7 s · 0% a 14,583%)

**Mensagem:** quem usa agente de IA conhece a situação. Ou fica olhando o terminal, ou sai e esquece de voltar.

**Layout:** a tela é dividida ao meio.

* **Esquerda (x 60 a 610, y 120 a 460): um terminal.**
  * Janela escura com o título `claude · zasatsu-bakuto`.
  * Linhas sobem sem parar: `● Read src/game.js`, `● Edit src/server.js`, `● Bash npm test`…
  * No canto, um cronômetro conta `00:12 … 03:47 … 04:11`, cada vez mais rápido.
* **Direita (x 670 a 1220, y 120 a 460): o navegador da pessoa, em outra janela.**
  * Janela clara com uma xícara de café desenhada em CSS.
  * Um aviso aparece apagado no canto, fica cinza e some sem ninguém ver.

**Movimento:**

* **0,3 a 1,3 s:** as linhas do terminal começam a subir em loop, com `translateY` em `steps()`, parecendo rolagem de texto.
* **0,3 a 2,7 s:** uma legenda é digitada à esquerda, com cursor piscando. Ao terminar, a palavra **encarando** fica vermelha e treme (±4 px, quatro vezes).
* **1,8 a 4,2 s:** uma segunda legenda é digitada à direita. A palavra **esquecer** fica vermelha e treme.
* **4,2 a 5 s:** o aviso aparece na janela da direita, fica cinza em 0,8 s e some.
* **6,6 a 7 s:** as duas janelas deslizam para o centro, encolhem para 90% e somem.

**Textos:**

* Legenda da esquerda: "Ficar **encarando** o terminal"
* Legenda da direita: "Ou sair e **esquecer** de voltar"
* Aviso: "Claude precisa da sua permissão"

### Cena 2 · 領域展開 (7 s a 13 s · 14,583% a 27,083%)

**Mensagem:** a resposta, em estilo de mangá. O Hakari faz o sinal e o domínio abre.

**Layout:** tela cheia, com o fundo violeta escuro e a grade aparecendo.

**Movimento:**

* **7 a 7,4 s:** um flash branco de 1 quadro, como um corte de página de mangá.
* **7,4 a 8,4 s:** o sinal de mão entra no centro (x 640, y 280, cerca de 300 px), de `scale(1.4)` e opacidade 0 para `scale(1)`. Atrás dele, uma explosão de tinta preta em forma de estrela, feita com `clip-path`.
* **8,4 a 9,4 s:** os kanjis **坐殺博徒** batem um a um embaixo do sinal (y 470, Yuji Boku de 96 px, degradê dourado). Cada um entra de `scale(1.6)` para `scale(1)`, com um tremor de 2 px.
* **9,4 a 10 s:** embaixo, em Inter de 20 px, aparece **領域展開 · Expansão de Domínio**.
* **10 a 12,4 s:** linhas de velocidade giram devagar atrás do sinal: um `conic-gradient` que gira 20° em 2,4 s, sem piscar.
* **10,6 a 12,4 s:** a legenda da cena aparece em y 580: "Cada ferramenta que o Claude usa vira um giro."
* **12,6 a 13 s:** tudo encolhe para o canto inferior direito, virando o ícone da máquina. É a ponte para a cena 3.

### Cena 3 · A máquina joga sozinha (13 s a 22 s · 27,083% a 45,833%)

**Mensagem:** a máquina traduz o trabalho do agente em efeitos que se entendem de relance.

**Layout:**

* **Direita (x 820 a 1200, y 60 a 600): a máquina**, uma versão simplificada do app, com 380 px de largura e moldura arredondada rosa:
  * no topo, o título **CR私鉄純愛列車**, em rosa, com o selo **通常 1/239** à direita;
  * duas linhas de conversa:
    * bolinha verde + **gestu** + "Ajustar layout da aba Vender" + **作業中 trabalhando**;
    * bolinha laranja + **api** + "Corrigir testes do checkout" + **作業中 trabalhando**;
  * uma tela com fundo de pôr do sol e três rolos brancos com números grandes;
  * embaixo, quatro bolinhas vazias: a linha de reserva, 保留.
* **Esquerda (x 80 a 740): três fichas de evento**, uma embaixo da outra, cada uma com uma seta até a máquina:

| Ficha | O que acontece na máquina | Legenda curta |
|---|---|---|
| `Edit src/vender.tsx` | Duas portas amarelas de シャッター fecham e abrem na tela | "Editou um arquivo → portas" |
| `Read src/theme.ts` | Uma bolinha de reserva acende verde e, meio segundo depois, vermelha | "Leu um arquivo → bola de reserva" |
| `Bash ✗ falhou` → `Bash ✓` | Aparece **×2**, depois **×3**, no canto da tela | "Falhou e se recuperou → 疑似連" |

**Movimento:**

* **13 a 14 s:** a máquina entra pela direita (`translateX(40px)` para 0) e as fichas aparecem.
* **14 a 16,5 s:** a ficha `Edit` acende em ciano. Uma linha tracejada corre até a máquina (`stroke-dashoffset`), as portas fecham e abrem com um tremor de 1 px, e a legenda aparece.
* **16,5 a 19 s:** a ficha `Read` acende. Uma bolinha voa até a linha de reserva, fica verde e depois troca para vermelho.
* **19 a 21,5 s:** a ficha `Bash` aparece vermelha com ✗ e vira ✓. A máquina mostra **×2** e depois **×3**, com 0,4 s entre eles.
* **Durante toda a cena:** os rolos giram, com `translateY` em `steps(7)`, sem nunca parar em três números iguais.
* **21,6 a 22 s:** as fichas somem, e a máquina vai para o centro.

**Legenda da cena (y 600):** "Você entende o que o agente faz com o canto do olho."

### Cena 4 · リーチ → 大当たり (22 s a 36 s · 45,833% a 75%)

**Mensagem:** o momento mais divertido. Testes rodando viram リーチ, e testes verdes viram o jackpot de 4:11.

**Layout:** a máquina cresce no centro, para cerca de 1,4 vez o tamanho. Acima dela fica uma ficha `Bash npm test`.

**Movimento:**

* **22 a 23 s:** a ficha `npm test` desce sobre a máquina. A linha da conversa **api** muda para **リーチ riichi (testes rodando)**, em vermelho, com a bolinha pulsando.
* **23 a 24,5 s:** **リーチ!!** estoura na tela em Dela Gothic One, sobre um balão de papel recortado em estrela. O primeiro e o segundo rolo param em **7** e **7**.
* **24,5 a 27,5 s:** aparece o nome do cenário, **華金終電リーチ ★★★**, com "Riichi do último trem de sexta" embaixo. As estrelas acendem uma a uma. O terceiro rolo gira cada vez mais devagar, mudando de `steps()` para `ease-out` em 3 s.
* **27,5 a 28,5 s:** uma ficha verde `✓ 12 passed` aparece sobre a ficha do teste.
* **28,5 s:** o terceiro rolo para em **7**. Flash branco de 1 quadro.
* **28,6 a 30 s:** **大当たり** bate na tela em Yuji Boku de 120 px, dourado, com "Jackpot" embaixo, menor. Ao fundo, uma explosão com **ドン!!**.
* **30 a 31,5 s:** o domínio quebra. O fundo violeta se parte em 8 cacos (polígonos com `clip-path`) que caem girando. Atrás deles, aparece um fundo dourado.
* **31,5 a 35,5 s:**
  * um contador **4:11** aparece embaixo e começa a descer (de 4:11 até 4:07, com `steps()`);
  * notas musicais ♪ sobem em fila dos dois lados;
  * aparece a legenda **呪力無制限 · Energia amaldiçoada infinita**;
  * a linha da conversa **api** vira **大当たり中 rodada do jackpot**, em dourado.
* **35,6 a 36 s:** fade para o violeta.

**Frase da cena:** "Testes verdes. 1 em 239. As regras do Hakari."

### Cena 5 · あなたの番 (36 s a 43 s · 75% a 89,583%)

**Mensagem:** o lado útil. Com várias conversas, a máquina diz quem precisa de você e leva até ela com um clique.

**Layout:** só a parte de cima da máquina, ampliada (x 340 a 940, y 120 a 440), com três linhas de conversa:

1. **gestu** "Ajustar layout da aba Vender" · **作業中 trabalhando**, em verde;
2. **api** "Corrigir testes do checkout" · **終了 terminou**, apagada;
3. **docs** "Revisar o README" · **作業中 trabalhando**, em verde.

**Movimento:**

* **36 a 37 s:** as linhas entram uma a uma, de cima para baixo, com 0,2 s entre elas.
* **37,5 a 38,5 s:** a linha **docs** muda para **あなたの番 esperando você**, em ciano. A bolinha ganha um anel ciano e pisca devagar, a 1 Hz. Em cima da máquina aparece o balão **あなたの番 · docs**.
* **38,5 a 40,5 s:** um cursor de mouse entra pela direita até a linha **docs**. A linha clareia, e o nome ganha sublinhado e uma setinha **↗**.
* **40,5 a 41 s:** clique: a linha pisca uma vez.
* **41 a 42,6 s:** por trás, sobe uma janelinha do app do Claude com o título "Revisar o README" e um pedido de permissão em destaque.
* **42,6 a 43 s:** fade.

**Textos da cena:**

* "Uma máquina para todas as conversas."
* "Quem precisa de você aparece na hora. Um clique e você está lá."

### Cena 6 · A marca (43 s a 48 s · 89,583% a 100%)

**Mensagem:** o fechamento, com logo, frase e selos.

**Layout:** centralizado, sobre o fundo violeta com a grade.

| Posição | O que aparece |
|---|---|
| y 200 | O ícone do app (o sinal de mão num quadrado arredondado), com 120 px |
| y 330 | **ZASATSU BAKUTO**, em Inter 700 de 64 px, creme, com espaçamento largo |
| y 380 | **坐殺博徒**, em Yuji Boku de 36 px, dourado |
| y 440 | A frase: "Seu agente trabalha. Você **joga**.", com "joga" em dourado |
| y 510 | Três selos lado a lado: "Hooks oficiais", "100% local", "Fiel ao mangá" |
| y 590 | Rodapé pequeno, em cinza: "Claude Code · Node.js · Electron · MIT" |

**Movimento:**

* **43 a 44 s:** o ícone entra de `scale(.8)` para `scale(1)`, com um brilho violeta que pulsa uma vez.
* **44 a 45 s:** o nome e o kanji aparecem.
* **45 a 46 s:** a frase aparece, e a palavra "joga" acende em dourado.
* **46 a 47,2 s:** os três selos entram um a um.
* **47,5 a 48 s:** tudo some, e o loop recomeça na cena 1.

---

## Animação 2: `zasatsu-dominio.svg` (30 s)

Ela mostra o caminho de um evento, do Claude Code até a máquina na tela.

**No topo (y 40 a 90):** uma faixa com os 4 passos lado a lado, ligados por uma barra de progresso. O passo atual fica claro e os outros ficam apagados. A faixa troca de passo junto com a animação.

**No centro:** um nó principal que emite ondas, como um sonar, e se liga aos outros nós por linhas que crescem.

**Elementos:**

* **Pílulas:** arredondadas, com borda de 1,5 px e um brilho suave.
  * Violeta: borda `#8b5cf6`, fundo `#1f1a3d`.
  * Ciano: borda `#3be8ff`, fundo `#0e2a36`.
  * Cinza: borda `#475569`, fundo `#141c2e`.
* **Selos de confirmação:** verde, com texto `#4ade80`, fundo `#0d2a1b` e borda `#22c55e`.

```css
/* Linha do tempo: 30 s. 1 O hook avisa 0–6 · 2 Vira sinal 6–13 · 3 A máquina decide 13–22 · 4 Aparece na tela 22–30 */
```

### Passo 1 · O hook avisa (0 s a 6 s · 0% a 20%)

* **Esquerda (x 120, y 330):** a pílula violeta **Claude Code**.
* **0,5 a 2 s:** dela sai uma pílula menor, `PostToolUse · Edit`, que anda até o centro.
* **Centro (x 640, y 330):** o nó **127.0.0.1:4111**, um círculo com o ícone do app.
* **2 a 4 s:** quando a pílula chega, o nó emite 2 anéis de onda que crescem e somem.
* **Embaixo do nó:** o selo verde **só no seu PC**.
* **Legenda:** "O Claude Code avisa a cada passo, sem esperar resposta."

### Passo 2 · Vira sinal (6 s a 13 s · 20% a 43,333%)

* **6 a 8 s:** em volta do nó central, três pílulas se abrem em leque, ligadas por linhas que crescem:
  * `tool-done`, ciano;
  * `test-start`, vermelha;
  * `attention`, ciano claro.
* **8 a 11 s:** cada pílula ganha um rótulo embaixo:
  * `tool-done` → "giro · 保留 / シャッター";
  * `test-start` → "リーチ";
  * `attention` → "あなたの番".
* **11 a 13 s:** uma pílula cinza `SessionStart` aparece e se apaga, com o rótulo "só registra". Ela mostra que nem todo evento gira a máquina.
* **Legenda:** "Cada evento vira um sinal que a máquina entende."

### Passo 3 · A máquina decide (13 s a 22 s · 43,333% a 73,333%)

* **13 a 15 s:** à direita do centro aparece o bloco **Uma máquina**, com o selo **通常 1/239**.
* **15 a 18 s:** três linhas coloridas entram no bloco, vindas de três bolinhas de conversa à esquerda: **gestu** (verde), **api** (laranja) e **docs** (azul). Mensagem: todas as conversas giram a mesma máquina.
* **18 a 20 s:** uma roleta pequena gira dentro do bloco e para em **7 7 7**. O selo troca para **確変 1/24**, em vermelho piscando devagar, com a etiqueta "trinca ímpar → chance aumentada".
* **20 a 22 s:** aparece o selo verde **placar salvo**, e o bloco ganha um ✓.
* **Legenda:** "Uma máquina só para todas as conversas. As regras do Hakari decidem cada giro."

### Passo 4 · Aparece na tela (22 s a 30 s · 73,333% a 100%)

* **22 a 24 s:** do bloco saem três linhas até três destinos à direita, todos com o rótulo `ao vivo`:
  * **Overlay**, com um ícone de bandeja;
  * **OBS**;
  * **Navegador**.
* **24 a 27 s:** no destino **Overlay** aparece a máquina pequena, com as linhas de conversa e os rolos em 7 7 7.
* **27 a 29 s:** a frase final aparece embaixo, centralizada: "**Escuta. Joga. Avisa.** Sem sair do seu PC."
* **29,6 a 30 s:** tudo some, e o loop recomeça.
* **Legenda:** "Cada giro chega ao overlay, ao OBS ou ao navegador na hora."

---

## Antes de entregar, confira

1. Os dois arquivos abrem direto no navegador e a animação roda sozinha, sem nenhum script.
2. Os tempos de cada cena batem com este roteiro, e as porcentagens estão certas (segundos ÷ duração × 100, com 3 casas).
3. O loop não tem corte visível entre o fim e o começo.
4. Todo texto está em português, e todo japonês tem a tradução embaixo.
5. As fontes estão embutidas, e cada arquivo tem até cerca de 250 KB.
6. Não há nenhuma arte oficial: só o sinal de mão anexado, CSS e tipografia.
