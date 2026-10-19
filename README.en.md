<p align="center">
  <a href="README.md">🇧🇷 Português</a> · <b>🇺🇸 English</b>
</p>

<p align="center">
  <img src="docs/icon.png" width="128" alt="Zasatsu Bakuto icon: a slot machine with the 坐殺博徒 marquee">
</p>

<h1 align="center">Zasatsu Bakuto (坐殺博徒)</h1>

<p align="center">
  <b>Kinji Hakari's Domain Expansion, Idle Death Gamble, played by your AI coding agent.</b><br>
  A tiny pachinko machine in the corner of your screen that tells you what Claude Code is doing, without you having to look at the terminal.
</p>

---

## Why you would want this

When an AI agent works for minutes at a time, you end up doing one of two things: staring at the terminal, or switching away and forgetting to come back. Zasatsu Bakuto fixes both. It turns the agent's activity into a pachinko machine you can read from the corner of your eye:

| You see on the machine | It means |
| --- | --- |
| Reels spinning, shutter doors, reserve balls | The agent is working (editing files, reading, running commands) |
| **リーチ (Riichi)** | The agent is running your tests right now |
| **大当り (JACKPOT)** | The tests came back green |
| **ハズレ (Miss)** | The tests failed |
| **×2 / ×3 / ×4** | A tool call failed and the agent is recovering |
| **YOUR TURN**, with the conversation's name | The agent is waiting for your permission or your answer |
| Domain closes | The agent finished its turn |
| Coloured dots next to the name | Your other Claude Code conversations and what each one is doing |

So you can read docs, answer chat, or make coffee, and still know **when the tests pass, when something breaks, and when the agent needs you**. And because every test run is a gamble at 1/239 with Hakari's own rules, waiting for the agent becomes fun instead of dead time.

What it is not:

- It never blocks, slows or changes the agent. It only listens to Claude Code's official hooks, asynchronously.
- It sends nothing anywhere. Everything runs on `127.0.0.1`. No telemetry, no account.
- It does not get in your way: the overlay is click-through, and there is a **discreet mode** (small, silent, translucent) for the work computer.

## Highlights

- **Faithful to the manga.** The rules come from the CR私鉄純愛列車 rule sheet Hakari shows in chapter 183 and the fights in chapters 182–190: 1/239 odds, 疑似連, 緑 < 赤 < 金 < 虹 notices, the four riichi scenarios, 確変/時短, 潜伏確変 and the 4:11 jackpot round with automatic reverse cursed technique. The full table is [below](#the-rules-of-the-domain).
- **Japanese first, with a translation under every line** in your computer's language (English, Português, Español), down to the sound effects, scanlation style.
- **Three sizes**: Normal, Compact, and Mini (about 230 px wide, one status line).
- **Knows which conversation is which**: the machine shows the project and title of the conversation it follows, and dots for the others. Follow one automatically or pin one from the tray.
- **Synthesised pachinko sounds** (キュイン, ball clatter, shutter clank, fanfare) and an optional Japanese announcer. Every sound and image can be replaced with your own files.
- **Built-in guide** (tray → 遊び方 · guide) that explains the game step by step, with a glossary.
- **Open to other AIs**: Claude Code works out of the box; any other agent connects through a simple local API ([how](#does-it-work-with-other-ais)).
- **Works in OBS** as a browser source for streamers.

> Fan project. Not affiliated with Jujutsu Kaisen, Gege Akutami, Shueisha or MAPPA. It ships no official art or music: everything is drawn in CSS and the sounds are synthesised.

## Quick start

You need [Node.js](https://nodejs.org) 20 or newer and [Claude Code](https://claude.com/claude-code).

```bash
git clone https://github.com/tiagocardosobezerra/zasatsu-bakuto.git
cd zasatsu-bakuto
npm install
node bin/ryoiki.js install     # adds hooks to ~/.claude/settings.json (a backup is kept)
node bin/ryoiki.js tenkai      # 領域展開: open the domain (overlay + tray icon)
node bin/ryoiki.js demo        # watch a scripted session play out
```

Then open a new Claude Code session and get to work. The machine wakes up on your first prompt.

Want the short command? Run `npm link` once inside the folder. From then on, just cast it:

```bash
ryoiki tenkai
```

| Command | In the manga | What it does |
| --- | --- | --- |
| `ryoiki tenkai` | **領域展開** Ryōiki Tenkai, Domain Expansion | Opens the domain: overlay and tray icon |
| `ryoiki kaijo` | **領域解除** Ryōiki Kaijo, dispelling the domain | Closes the domain |
| `ryoiki install` / `ryoiki uninstall` | | Adds or removes the Claude Code hooks |
| `ryoiki demo` | | Plays a scripted session |
| `ryoiki guide` | **遊び方** how to play | Opens the guide and glossary |
| `ryoiki settings` | | Opens the settings |
| `ryoiki status` | | Tells you whether the domain is open |
| `ryoiki serve` | | Server only, for OBS |

- `ryoiki uninstall` removes only this project's hooks and leaves the rest of your settings alone.
- `--settings .claude/settings.json` installs the hooks for one project instead of globally.
- npm 11 may ask you to approve Electron's install script: `npm install-scripts approve electron`.

## Does it work with other AIs?

**Today, built-in support is for Claude Code**: `ryoiki install` wires everything up. But the machine does not depend on Claude. It only listens to a local API, and **any agent or tool that can run a command or make an HTTP request when something happens** can play.

| Tool | Status |
| --- | --- |
| **Claude Code** (terminal, desktop app, IDE extensions) | ✅ Built-in, installed automatically with `ryoiki install` |
| Codex CLI, Gemini CLI, Cursor, GitHub Copilot, Aider and others | 🔌 No ready-made adapter yet. Connect them through the API below if the tool has hooks, event scripts or notifications |
| Your own scripts, CI, home-made agents | 🔌 Through the API below |

### How to connect another AI

`POST` a JSON body to `http://127.0.0.1:4111/event` for each agent event. The shape is the same as Claude Code's hooks:

| `hook_event_name` | When to send it | On the machine |
| --- | --- | --- |
| `UserPromptSubmit` | You sent the agent a request | Opens the Domain Expansion |
| `PreToolUse` | The agent is about to use a tool | Spins; a test command starts a リーチ |
| `PostToolUse` | The tool finished | A notice effect; for tests, the result decides jackpot or ハズレ |
| `PostToolUseFailure` | The tool failed | 疑似連 (×2, ×3, ×4) |
| `Notification` | The agent needs you | YOUR TURN |
| `Stop` | The agent finished its turn | The domain closes |

Fields the machine reads: `session_id` (keeps conversations apart), `cwd` (becomes the project name), `prompt` (becomes the title), `tool_name`, `tool_input.command` (test commands such as `npm test` or `pytest` start a リーチ) and `tool_response.stdout` (summaries such as `12 passed` or `1 failed` decide the result).

Example with `curl` (macOS, Linux, Git Bash):

```bash
curl -X POST http://127.0.0.1:4111/event -H "Content-Type: application/json" \
  -d '{"hook_event_name":"UserPromptSubmit","session_id":"my-agent","cwd":"/projects/app","prompt":"Fix the login"}'

curl -X POST http://127.0.0.1:4111/event -H "Content-Type: application/json" \
  -d '{"hook_event_name":"PostToolUse","session_id":"my-agent","cwd":"/projects/app","tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":{"stdout":"12 passed"}}'
```

The same in PowerShell:

```powershell
$payload = @{ hook_event_name = 'Notification'; session_id = 'my-agent'; cwd = 'C:\projects\app' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4111/event -ContentType 'application/json' -Body $payload
```

An adapter for a new AI is just a script that turns its events into this JSON. If you write one, open a pull request and it joins the list above.

## The rules of the domain

The rules come from the rule sheet Hakari shows in chapter 183 (*CR私鉄純愛列車*: リーチアクション, ゲームフロー, 予告演出, チャンスアップ) and from the fights in chapters 182–190. The agent's hook events are the fight.

| Domain rule (source) | What triggers it |
| --- | --- |
| **領域展開** Domain Expansion; the sure-hit effect transfers the rules (ch. 182, 187) | You send a prompt, or the agent acts while no domain is open |
| Every spin draws the jackpot at **約1/239** (rule sheet) | Every finished tool call |
| Notice effects 予告演出 (rule sheet): **シャッター** shutter doors | Edit / Write |
| **保留玉** reserve balls; a bigger ball means a better chance | Any other tool (Read, Grep, Bash…) |
| **疑似連** pseudo-consecutive: redoes the sequence and reverts damage, shown as ×2, ×3, ×4 (rule sheet, ch. 187) | A failed tool call the agent recovers from |
| 疑似連 carries a high risk of failing outside 確変 (ch. 187) | Same; it can fail and not count |
| Colours **緑 < 赤 < 金**; **虹色 (rainbow) or the 4th time (×4) confirms the jackpot** (rule sheet) | Colour drawn per effect, skewed toward gold and rainbow when the lottery is already won |
| **Riichi** develops once at least one effect has played, and reveals two of the three numbers (rule sheet, ch. 183) | A test run (`npm test`, `pytest`, `go test`, `cargo test`…), or a won 1/239 lottery |
| リーチアクション (rule sheet): 交通系ICカードリーチ ★☆☆, 座席争奪通勤リーチ ★★☆, うっかり特快便意我慢リーチ ★★☆, 華金終電リーチ ★★★ ("over 80% once it develops") | The machine picks the scenario from the decided outcome, like a real pachinko machine |
| チャンスアップ (rule sheet): **夢背景** Yume background, **天ノ川カットイン** Amanokawa cut-in, **群予告** group notice (anything but trains = confirmed) | Shown during riichi, more often when the result is a win |
| **ハズレ**: the stage goes back to the start (ch. 183) | Red tests (always), or green tests when the scenario fails |
| **大当り**: the domain disappears; unlimited cursed energy for **4:11**, the length of *Admiring You*; fully automatic reverse cursed technique (ch. 186–189) | Green tests with a winning scenario |
| Cursed-energy bonuses during the round (ch. 186) | Tool calls during the round |
| No domain during the round; it is cast again when the round ends (ch. 186, 189) | The agent is still working when 4:11 ends |
| Game flow (rule sheet): 通常 → 大当たり → **確変** or **時短**; **確変突入率 約75%** | Every jackpot |
| **Odd triple → 確変** increased probability, until the next jackpot (ch. 187) | 1, 3, 5, 7 |
| **Even triple → 時短** faster spins for **70 or 30 spins**, then back to 通常 (rule sheet, ch. 187) | 2, 4, 6 |
| **潜伏確変** hidden probability: looks like faster spins, is increased probability (ch. 189) | Sometimes, after an even jackpot |
| Domain closes (領域解除), 連チャン resets | The agent finishes its turn without a jackpot |
| **YOUR TURN** | The agent asks for permission or input |

Where the sources are silent, the machine fills in, and says so:

- Numbers 3 (Yume, 夢) and 4 (Hiro, 空) carry the characters shown in chapter 183; the other numbers get the remaining characters of *Private Pure Love Train*, named in kanji as on the wiki's cast list. The reels use 1–7.
- Scenario captions (in Japanese, with translations) are our own wording of the win conditions.
- Increased probability draws at 1/24; a 疑似連 fails half the time outside it (10% inside); 潜伏確変 follows 25% of even jackpots; chance-up rates are ours. The manga gives no numbers for these.
- The wiki words the guarantee as "four consecutive effects"; the rule sheet says "4回目" and pachinko counts 疑似連 from ×2, so the machine confirms at ×4 (three redos). The chapter 187 panel shows ×3 after two redos.
- Seat Struggle Riichi's story was never shown, so its lines are made up. The group notice uses hearts as "not a train".
- The wiki says the number of possible spins drops with every missed jackpot, without saying how many. The machine does not limit spins; the domain ends when the agent's turn ends.
- Mapping agent events to fight events (tests = riichi, failures = 疑似連) is this project's own.

Test results are read from the hook payload: a failed Bash call is red, and test-runner summaries (`12 passed`, `1 failed`, `test result: ok`, TAP, Go, pytest, unittest…) decide the rest.

## Settings

Right-click the tray icon → **Settings…** (or double-click it), or run `ryoiki settings`. Changes apply right away and are saved in `~/.agent-fever/config.json`.

- **Discreet mode** (also in the tray menu): mini machine, no sound, nothing full screen, a bit transparent. It sits on top of your settings without changing them; switch it off and everything comes back. Made for work computers.
- **Machine**: layout (**Normal**, **Compact** without lamps and counters, **Mini** with just the screen and one status line, about 230 px wide), corner, size (30–200%), opacity, dim when idle. The machine never takes more than about 60% of the screen height.
- **What appears**: Domain Expansion full screen / on the machine / off; jackpot full screen / on the machine / off; title, lamps, 保留/疑似連 row, current tool, counters
- **Sound**: volume, machine sounds, your music files, mute everything
- **Previews**: play the Domain Expansion, a guaranteed jackpot, or the full demo
- **Language**: Japanese stays on screen; a small translation goes underneath in your computer's language (English, Português, Español), or pick one, or Japanese only. Every Japanese text has one, down to the manga sound effects (ドン!! *BOOM!!*, ゴゴゴ *rumble*), scanlation style. The settings page and tray menu follow the same language.

## Sound

Zasatsu Bakuto does not ship recordings from real machines (they belong to their makers). Instead it synthesises the sounds a pachinko hall is known for: the rising **キュイン** when a gold or rainbow effect appears, the steel-ball clatter of the payout, a brassy jackpot fanfare, the heavy shutter-door clank.

- Every event can be replaced with your own file (see below), so if you own real machine sounds you can use them.
- **Japanese announcer** (on by default): calls out リーチ!, 大当たり! and 確定! with a Japanese voice installed on the computer. Windows: Settings → Time & language → Speech → Add voices → Japanese. Without one it stays silent; the settings page says which voice it found.

## Motion

- **Domain Expansion → Smart** (default): full screen the first time and again after 10 quiet minutes, on the machine otherwise. The canon domain opens in under 0.2 s; a 3.6 s full-screen intro on every prompt gets old fast.
- **Motion → Follow the system** (default): if the operating system asks apps for less motion, full-screen effects show on the machine and shaking, spinning and flashing stop. The settings page says when this is happening; pick **Full** to see everything anyway.
- Nothing strobes: speed lines turn slowly, flashes stay around 1 Hz.

## Little things

- When the machine sits idle it plays a **デモ画面** like a real one nobody is sitting at, slowly showing the cast on the reels.
- The round opens with Hakari's call for the music (音楽、スタート!!, ch. 187); a second jackpot in a row gets its **連チャン** call.
- A gold or rainbow effect lights the screen edge (先読み) before anything else; the 疑似連 count sits in the corner of the screen as ×2/×3/×4, like the chapter 187 panel.

## Your own art and music

Zasatsu Bakuto ships no images or music from the series. If you own files you want to use, put them in `~/.agent-fever/custom/` (or set `FEVER_CUSTOM_DIR`). Files are picked up by name; any of `.png .jpg .webp .gif` for images and `.mp3 .ogg .wav .m4a` for audio:

| File name | Used for |
| --- | --- |
| `round.mp3` | Plays from the jackpot until the 4:11 round ends (for example the theme song) |
| `intro.png` | Background art behind 坐殺博徒 |
| `jackpot.png` | Art on the jackpot screen |
| `reel-1.png` … `reel-7.png` | Art on each reel number |
| `expand`, `riichi`, `kyuin`, `door`, `ball`, `consec`, `kakutei`, `jackpot`, `miss`, `heal` (`.mp3/.ogg/.wav`) | Replace the built-in sound for that event |

These files stay on your machine; the app only serves them to your own overlay on `127.0.0.1`. You are responsible for having the rights to them.

## Streaming

```bash
ryoiki serve
```

Add `http://127.0.0.1:4111/` as a browser source in OBS (transparent background). Options go in the query string:

- `?pos=br|bl|tr|tl`: corner (default `br`)
- `?scale=1.5`: size
- `?mute`: no sound
- `?intro=full|compact|off` and `?jackpot=full|compact|off`: override the settings for this source
- `?opacity=0.8`
- `?lang=pt|en|es|ja`: translation language for this source
- `?layout=normal|compact|mini`
- `?preview`: dark background and a demo button, for trying it in a normal browser

## How it works

```
Claude Code ──hook (async)──▶ src/hook.js ──POST /event──▶ server (127.0.0.1:4111)
                                                              │ classify → game
                                                              ▼
                                         overlay(s) ◀── SSE /stream
                                         (Electron window, OBS, browser)
```

- `src/classify.js` turns a raw hook payload into a small signal (`tool-done`, `test-start`, `test-end`, `attention`, …). To support another agent, write an adapter that sends payloads in the same shape.
- `src/game.js` decides the outcome on the server, so every overlay shows the same reels.
- `public/` is the whole visual layer: plain HTML/CSS/JS. Themes are the obvious next step.
- `src/hook.js` always exits 0, prints nothing and gives up after 1.5 s. Hooks are registered with `"async": true`.

## Develop

```bash
npm install
npm test            # node:test, no extra deps
npm run serve       # then open http://127.0.0.1:4111/?preview
npm start           # Electron overlay
```

## Roadmap

- Theme packs (the reels, sounds and fever screen are all swappable)
- Adapters: Codex CLI, Gemini CLI, Cursor, Aider
- npm package, so `npx zasatsu-bakuto` works without cloning
- Shareable end-of-day card: spins, jackpots, best streak

## License

MIT
