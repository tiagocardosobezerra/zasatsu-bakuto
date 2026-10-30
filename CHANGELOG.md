# Changelog

## 0.2.0

The show no longer hides what you wanted to know.

### Real results, always on screen

* Green tests that lose the draw now say **"Miss, but the tests passed"** instead of a bare ハズレ, and every jackpot or miss carries the real result.
* Each conversation line shows its last tests (**✓ 12**, **✗ 1/12**, **?**), its last build, lint or type check (**build ✓**, **lint ✗**, **tsc ✓**) and, from 50%, how full its context window is (**ctx 82%**). The single line of the Mini layout shows them too.
* Test results are read from .NET, Maven and Gradle as well, the exit code decides first, and a test named "should FAIL gracefully" no longer turns a green run red.
* Words inside quotes or arguments are not commands: `git commit -m "make npm test pass"` no longer starts a riichi.

### Knowing when to look

* Each line shows how long its turn has run (⏱ 4m). A working conversation with no event for 5 minutes turns orange: long command, or stuck? After 15 minutes it stops claiming to work (Esc sends no Stop).
* System notification when an agent needs you, or goes silent, while the machine is discreet or hidden (new **notify** setting, on by default). A click opens the conversation in the Claude app.
* `ryoiki status` and the tray sum up the day: turns, tests, builds, and how long the agents waited for you (waits over 30 minutes count as you being away). Kept in `~/.zasatsu-bakuto/daily.json` for 14 days, served at `GET /stats`.

### Safer and steadier

* The server refuses host names other than `127.0.0.1` and `localhost` (DNS rebinding).
* `machine.json` is written at most once a second and flushed on quit; the sound log is only kept with `ZASATSU_SOUND_LOG=1`.
* `ryoiki install` writes `settings.json` through a temporary file, keeps the backup of the file as it was before Zasatsu Bakuto, and `ryoiki status` says when the hooks are missing or point at a folder that moved.
* The hook cuts huge tool output to its end, so a test log over 5 MB still ends the riichi.
* Windows notifications work from a copy run from the repository.
* The demo fills the lines with its own conversation; the guide matches what the machine does.
* Node 20 or newer; tests run on Linux, Windows and macOS in CI.

## 0.1.0

First release.
