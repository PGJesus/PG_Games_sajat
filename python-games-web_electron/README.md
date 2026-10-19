# Python Arcade

Three Python games in one web page (two cards in the first row, Snake full width below),
plus the same page as an Electron desktop app.

| Game | Type | Runs on |
|---|---|---|
| Tic-tac-toe | pygame | Pyodide (offline) · pygbag (online, optional) |
| Hangman | console (`print`/`input`) | Pyodide in a worker (offline) |
| Snake | pygame | Pyodide (offline) · pygbag (online, optional) |

## Browser version

```
python serve.py
```
Opens http://localhost:8000. Works with no internet.

Use `serve.py`, **not** `python -m http.server` and not double-clicking `index.html`:
- double-clicking (`file://`) — Pyodide won't load at all;
- `http.server` — the pygame games work, but Hangman can't, because `input()` needs two
  extra headers that only `serve.py` sends.

## Electron version

Needs Node.js. Run once **with internet** (downloads Electron, ~100 MB):
```
cd electron
npm install
```
Then, offline from now on:
```
npm start
```
It shows the same `web/` folder, so any change to the page or games appears in both versions.

## Optional: pygbag (online) versions

The small "Play with pygbag (online)" links under the pygame games need a build first:
```
pip install pygbag
python build_pygbag.py
```
pygbag needs internet to build *and* every time the game starts.

## Folder layout

```
serve.py            local server for the browser version
build_pygbag.py     builds web/pygbag/ (optional)
web/
  index.html  style.css  app.js     the page (click "Play" loads a game into its card)
  games/<game>/main.py              the games - also run on the desktop: python main.py
  runners/pygame.html               runs a pygame game on a <canvas>
  runners/console.html + console-worker.js   runs a console game, input() included
  pyodide/                          Python runtime + pygame-ce, bundled (~18 MB)
electron/
  main.js  package.json
```

## Writing your own games

**pygame:** make the loop `async` and end each frame with `await asyncio.sleep(1 / FPS)`
instead of `clock.tick(FPS)`; finish the file with `asyncio.run(main())`. Then add the
folder name to `GAMES` in `runners/pygame.html` and a card in `index.html`.

**console:** nothing special, plain `print()` and `input()`. Add the name to `GAMES` in
`runners/console.html`. Not available in the browser: `os.system("cls")`, `msvcrt`,
`keyboard`, and files on your real disk.

Versions are pinned: Pyodide 0.27.7 (Python 3.12), because Pyodide 0.28 no longer
ships pygame-ce. Tested in Chromium (so Chrome/Edge) and Electron. Safari likely can't
run Hangman, since it didn't support the `credentialless` header last I knew.
