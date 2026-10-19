# Zasatsu Bakuto

[Português](README.md) | **English**

**Your AI agent works. You follow along from the corner of your eye, on a pachinko machine with the rules of Hakari's Domain Expansion.**

![Node.js 20+](https://img.shields.io/badge/node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Electron](https://img.shields.io/badge/electron-33-47848F?style=flat-square&logo=electron&logoColor=white)
![Claude Code](https://img.shields.io/badge/Claude%20Code-official%20hooks-D97757?style=flat-square&logo=anthropic&logoColor=white)
![100% local](https://img.shields.io/badge/data-100%25%20local-2ea44f?style=flat-square)
![MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

<img width="100%" alt="Zasatsu Bakuto: the agent works, the domain opens, the machine spins with every tool and green tests hit the jackpot" src="assets/zasatsu-banner.svg" />

Zasatsu Bakuto (坐殺博徒, *Idle Death Gamble*) is a small pachinko machine that sits in the corner of your screen and plays by itself while Claude Code works. Every tool the agent uses spins the reels, running the tests becomes a リーチ, green tests can hit the 大当たり, and when the agent needs you the machine tells you, with the conversation's name. You stop staring at the terminal, and you stop forgetting to come back.

## What it does for you

* **Shows what the agent is doing, without you watching the terminal.** Editing a file closes the シャッター doors, reading or running a command lights a reserve ball, failing and recovering becomes ×2, ×3, ×4. You get it at a glance.
* **Tells you when tests pass or break.** Running `npm test`, `pytest`, `go test` or `cargo test` becomes a リーチ. Green tests can hit the 4:11 jackpot; red tests are a ハズレ.
* **Tells you when the agent needs you.** A request for permission or an answer shows as **あなたの番 · conversation name**, with a chime.
* **Follows every conversation at once.** Each conversation in progress gets a line with its project, name, what it is doing and its last action. The list grows and shrinks by itself, and clicking a line with ↗ opens that conversation in the Claude app.
* **Shows how much of your plan you have used.** Two pies on the machine: the 5-hour session and the week, with the time left until each resets.
* **Stays out of your way.** The overlay lets clicks through, never blocks or slows the agent, and has a **discreet mode** (small, silent, translucent) for the work computer.
* **Is faithful to the manga.** The rules come from the CR私鉄純愛列車 rule sheet Hakari shows in chapter 183 and the fights in chapters 182 to 190. Japanese always stays on screen, with a translation underneath in English or Portuguese.

## What it looks like

> **You:** fix the checkout tests
>
> **Claude:** reads the files, edits two of them and runs `npm test`.
>
> **The machine:** doors closing, reserve balls lighting up, リーチ!!, 華金終電リーチ ★★★… **大当たり.** The domain shatters, the music starts and a 4:11 countdown runs on screen. Meanwhile the `docs` conversation's line turns blue: **あなたの番, waiting for you.**

You knew the tests passed and that another conversation needed you, without opening a single window.

| On the machine | It means |
|---|---|
| Spinning reels, シャッター doors, 保留 reserve balls | The agent is working |
| **リーチ** | The agent is running your tests right now |
| **大当たり** | The tests passed |
| **ハズレ** | The tests failed |
| **×2 / ×3 / ×4** | A tool failed and the agent is recovering |
| **あなたの番 · name** | The agent is waiting for your permission or your answer |
| The domain closes | Every conversation finished its turn |

## Get started in 3 steps

You need [Node.js](https://nodejs.org) 20 or newer and [Claude Code](https://claude.com/claude-code).

### 1. Install

```bash
git clone https://github.com/tiagocardosobezerra/zasatsu-bakuto.git
cd zasatsu-bakuto
npm install
npm link
```

`npm link` creates the `ryoiki` command. npm 11 may ask you to approve Electron's install script: `npm install-scripts approve electron`.

### 2. Connect it to Claude Code

```bash
ryoiki install
```

Adds the hooks and the status line to `~/.claude/settings.json` and keeps a backup. If you already had a status line, it keeps showing as before; Zasatsu only reads the plan usage behind it and gives yours back on `ryoiki uninstall`. To connect a single project instead, use `ryoiki install --settings .claude/settings.json`.

### 3. Open the domain

```bash
ryoiki tenkai
```

**領域展開.** The machine appears in the corner of the screen and an icon shows up in the tray. Start a new Claude Code conversation and work as usual: the machine wakes up on your first prompt. To see everything working first, run `ryoiki demo`.

| Command | In the manga | What it does |
|---|---|---|
| `ryoiki tenkai` | **領域展開** Domain Expansion | Opens the domain: overlay and tray icon |
| `ryoiki kaijo` | **領域解除** Dispelling the domain | Closes the domain |
| `ryoiki install` / `ryoiki uninstall` | | Adds or removes the Claude Code hooks (only this project's) |
| `ryoiki demo` | | Plays a scripted session |
| `ryoiki guide` | **遊び方** How to play | Opens the guide and glossary |
| `ryoiki settings` | | Opens the settings |
| `ryoiki status` | | Tells you whether the domain is open |
| `ryoiki serve` | | Server only, for OBS |

## Going further

### Settings

Right-click the tray icon → **Settings…** (or double-click it), or run `ryoiki settings`. Changes apply right away and are saved in `~/.zasatsu-bakuto/config.json`. The machine's totals and mode are kept in `~/.zasatsu-bakuto/machine.json`.

* **Discreet mode:** mini machine, no sound, nothing full screen, a little translucent. Switch it off and everything comes back as it was.
* **Machines:** **One for all** (default), where every conversation spins the same machine and the totals are saved, or **One per conversation**, where each has its own and the screen follows the one you last wrote to.
* **Conversation lines:** one line per conversation in progress, up to 1, 2 or 3, or **Unlimited** (default), which grows up to the edge of the screen and shows "N more conversations" for the rest.
* **On screen:** layout (**Normal**, **Compact** or **Mini**), size, corner, opacity, **always on top** of other windows (on by default: it stays above windows and comes back to the front if one covers it, but never over the taskbar, the Start menu or the tray icons) and dimming when idle.
* **What appears:** Domain Expansion and jackpot full screen, on the machine only or off; motion; and each part of the machine.
* **Sound:** mute everything, volume, machine sounds, Japanese announcer and your music files.
* **Language:** Japanese stays on screen, with a translation underneath in English or Portuguese, following your computer, or Japanese only.

The tray menu has the most used shortcuts in the same order.

### Plan usage

Claude Code's status line receives your plan usage, and the machine shows it as two pies: **Session (5 h)** and **Week**, with how much is used and when it resets. The colour goes from green to gold (60%) and red (85%). It only shows on plans with limits (Pro, Max, Team); with an API key the row stays hidden. To hide it, switch off **Plan usage** in Settings → What appears.

### Sound and motion

The app ships no recordings of real machines. It synthesises the sounds of a pachinko parlour: the rising **キュイン** on a gold or rainbow effect, the rain of steel balls, the jackpot fanfare and the clank of the シャッター door. The **Japanese announcer** calls out リーチ!, 大当たり! and 確定! with a Japanese voice installed on the computer (on Windows: Settings → Time & language → Speech → Add voices → Japanese).

The **smart Domain Expansion** (default) opens full screen the first time and after 10 quiet minutes; otherwise it plays on the machine. If your system asks for less motion, effects stay on the machine and nothing shakes or flashes hard.

### Your own art and music

The app ships no images or music from the series. If you own files you want to use, put them in `~/.zasatsu-bakuto/custom/` (or set `ZASATSU_CUSTOM_DIR`). They stay on your machine, and you are responsible for having the rights to them.

<details>
<summary><strong>File names</strong></summary>

Any of `.png .jpg .webp .gif` for images and `.mp3 .ogg .wav .m4a` for audio.

| File name | Used for |
|---|---|
| `round.mp3` | Plays from the jackpot until the 4:11 round ends (and repeats if shorter) |
| `intro.png` | Background art behind 坐殺博徒 |
| `jackpot.png` | Art on the jackpot screen |
| `reel-1.png` … `reel-7.png` | Art on each reel number |
| `expand`, `riichi`, `kyuin`, `door`, `ball`, `consec`, `kakutei`, `jackpot`, `miss`, `heal` | Replace the built-in sound for that event |

</details>

### Streaming

Run `ryoiki serve` and add `http://127.0.0.1:4111/` as a browser source in OBS, with a transparent background.

<details>
<summary><strong>Browser source options</strong></summary>

| Option | What it does |
|---|---|
| `?pos=br\|bl\|tr\|tl` | Corner (default `br`) |
| `?scale=1.5` | Size |
| `?layout=normal\|compact\|mini` | Layout |
| `?lines=0\|1\|2\|3\|all` | Conversation lines |
| `?intro=full\|compact\|off`, `?jackpot=full\|compact\|off` | Override the settings for this source |
| `?opacity=0.8` | Opacity |
| `?lang=pt\|en\|ja` | Translation language |
| `?mute` | No sound |
| `?preview` | Dark background and a demo button, for trying it in a normal browser |

</details>

### Other AIs

Claude Code works out of the box, but the machine does not depend on it: it listens to a local API, and **any agent that can make an HTTP request when something happens** can play. Codex CLI, Gemini CLI, Cursor, GitHub Copilot and Aider have no ready-made adapter yet, but you can connect any of them through the API if the tool has hooks, event scripts or notifications.

<details>
<summary><strong>How to connect another AI</strong></summary>

`POST` a JSON body to `http://127.0.0.1:4111/event` for each agent event, shaped like Claude Code's hooks:

| `hook_event_name` | When to send it | On the machine |
|---|---|---|
| `UserPromptSubmit` | You sent the agent a request | Opens the Domain Expansion |
| `PreToolUse` | The agent is about to use a tool | Spins; a test command starts a リーチ |
| `PostToolUse` | The tool finished | A notice effect; for tests, the result decides |
| `PostToolUseFailure` | The tool failed | 疑似連 (×2, ×3, ×4) |
| `Notification` | The agent needs you | あなたの番 |
| `Stop` | The agent finished its turn | The domain closes |

Fields read: `session_id`, `cwd` (project name), `prompt` (title), `tool_name`, `tool_input.command` and `tool_response.stdout` (summaries such as `12 passed` or `1 failed`).

```bash
curl -X POST http://127.0.0.1:4111/event -H "Content-Type: application/json" \
  -d '{"hook_event_name":"PostToolUse","session_id":"my-agent","cwd":"/projects/app","tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":{"stdout":"12 passed"}}'
```

```powershell
$payload = @{ hook_event_name = 'Notification'; session_id = 'my-agent'; cwd = 'C:\projects\app' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4111/event -ContentType 'application/json' -Body $payload
```

An adapter is just a script that turns your AI's events into this JSON. If you write one, open a pull request.

</details>

## The rules of the domain

The agent's events are the fight. Each rule comes from the rule sheet Hakari shows in chapter 183 (*CR私鉄純愛列車*) or from the fights in chapters 182 to 190.

| Domain rule (source) | What triggers it |
|---|---|
| **領域展開**, the sure-hit effect transfers the rules (ch. 182, 187) | You send a prompt, or the agent acts while no domain is open |
| Every spin draws the jackpot at **約1/239** (rule sheet) | Every finished tool call |
| Notice effects 予告演出: **シャッター** doors and **保留玉** balls (rule sheet) | Edit/Write open the doors; other tools, the balls |
| **疑似連** redoes the sequence, ×2, ×3, ×4, and often fails outside 確変 (ch. 187) | A failed tool call the agent recovers from |
| Colours **緑 < 赤 < 金**; **虹色 or ×4 confirm the jackpot** (rule sheet) | The colour of each effect |
| **リーチ** only after an effect, with 4 scenarios: 交通系IC ★☆☆, 座席争奪 ★★☆, うっかり特快 ★★☆, 華金終電 ★★★ (rule sheet, ch. 183) | Tests running, or a won 1/239 draw |
| チャンスアップ: 夢背景, 天ノ川カットイン, 群予告 (rule sheet) | During the リーチ, more often when it will hit |
| **ハズレ** sends the stage back to the start (ch. 183) | Red tests, or a scenario that fails |
| **大当たり**: the domain disappears for **4:11** of unlimited cursed energy, the length of *Admiring You*, with automatic reverse cursed technique (ch. 186 to 189) | Green tests with a winning scenario |
| Odd triple → **確変** until the next jackpot; even → **時短** for 70 or 30 spins; **確変突入率 約75%**; sometimes **潜伏確変** (rule sheet, ch. 187, 189) | Every jackpot; the mode badge shows the current odds |
| **領域解除**, the 連チャン resets | Every conversation ends its turn without a jackpot |

<details>
<summary><strong>Where the sources are silent</strong></summary>

* Numbers 3 (Yume, 夢) and 4 (Hiro, 空) carry the characters from chapter 183; the other numbers get the rest of the *Private Pure Love Train* cast.
* Increased probability is 1/24; a 疑似連 fails half the time outside it (10% inside); 潜伏確変 follows 25% of even jackpots. The manga gives no numbers for these.
* The rule sheet says "4回目", and pachinko counts 疑似連 from ×2, so the machine confirms at ×4.
* Seat Struggle Riichi's story was never shown, so its lines are made up.
* Mapping agent events to fight events (tests = リーチ, failures = 疑似連) is this project's own choice.
* Test results come from the hook itself: a failed Bash call is red, and summaries such as `12 passed`, `1 failed` or `test result: ok` decide the rest.

</details>

## How it works inside

<img width="100%" alt="How it works inside: the hook tells, the event becomes a signal, the machine decides and the spin shows on screen" src="assets/zasatsu-dominio.svg" />

| Piece | What it does |
|---|---|
| **`ryoiki`** (`bin/ryoiki.js`) | The command line: `tenkai`, `kaijo`, `install`, `demo`, `guide`, `settings`, `status`, `serve` |
| **Hook** (`src/hook.js`) | Forwards every Claude Code event and leaves at once: never prints, never blocks, always exits 0 |
| **Classifier** (`src/classify.js`) | Turns the raw event into a signal (`tool-done`, `test-start`, `attention`…) and reads test results |
| **Game** (`src/game.js`) | Hakari's rules: the 1/239 draw, effects, リーチ, jackpot, 確変 and 時短 |
| **Machines** (`src/machine.js`, `src/each.js`) | One machine for every conversation, or one per conversation |
| **Conversations** (`src/sessions.js`, `src/links.js`) | The conversation lines and each one's link to the Claude app |
| **Server** (`src/server.js`) | Takes the events in, keeps the totals and streams everything to the screens |
| **Overlay** (`public/`) | The machine on screen, in plain HTML, CSS and JS, plus the guide and settings |
| **Desktop** (`src/electron-main.js`) | The transparent window that lets clicks through, and the tray icon |

Nothing leaves your computer: everything runs on `127.0.0.1`, with no telemetry and no account. For the conversation links, the app reads, on your computer, only each conversation's id from the Claude app's files.

To check your setup at any time:

```bash
npm test
ryoiki status
```

## Repository layout

```
zasatsu-bakuto/
├── bin/ryoiki.js          # Command line
├── src/                   # Hook, classifier, game, machines, server and desktop app
├── public/                # Overlay, guide, settings and icon
├── scripts/               # Renders the icon (npm run icon)
├── assets/                # README animations
├── docs/                  # README icon and the animation prompt
└── test/                  # Test suite (node:test)
```

## Develop

```bash
npm install
npm test            # node:test, no extra dependencies
npm run serve       # then open http://127.0.0.1:4111/?preview
npm start           # Electron overlay
npm run icon        # renders the icon again from public/icon-render.js
```

## Roadmap

* Theme packs: swappable reels, sounds and jackpot screen
* Adapters for Codex CLI, Gemini CLI, Cursor and Aider
* An npm package, so `npx zasatsu-bakuto` works without cloning

## Credits

**Creator:** Tiago Cardoso Bezerra | [tiagocardosobezerra](https://github.com/tiagocardosobezerra)

Named after Kinji Hakari's Domain Expansion in Jujutsu Kaisen, the sorcerer who turned a pachinko machine into a fighting technique and trusts his victory to luck.

## Thanks

* My wife **Júlia** and my children **Arthur** and **Aurora**, the safe harbour where I find peace, inspiration and the lightness I need every day.
* **Bruna Cardoso Bezerra** | [brunacbezerra](https://github.com/brunacbezerra), for teaching me everything I know about Claude Code.
* **You**, for using Zasatsu Bakuto!

## Notice

Fan project, not affiliated with Jujutsu Kaisen, Gege Akutami, Shueisha or MAPPA. It ships no official art or music: everything is drawn in CSS and the sounds are synthesised. Files you add to the `custom` folder stay on your machine, and you are responsible for having the rights to them.

## License

MIT License, see [LICENSE](LICENSE) for details.

---

<p align="center"><strong>Zasatsu Bakuto</strong>, your agent works. you gamble.</p>

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
