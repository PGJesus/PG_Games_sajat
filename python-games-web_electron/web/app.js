// Loads a game into its card only when "Play" is clicked.
// Each game runs in its own iframe, so every game gets its own Python
// runtime and pygame screen, and "Stop" frees that memory again.

const RUNTIME_URLS = {
  pyodide: game => `runners/pygame.html?game=${game}`,     // offline
  console: game => `runners/console.html?game=${game}`,    // offline
  pygbag:  game => `pygbag/${game}/index.html`,            // needs internet
};

document.querySelectorAll(".card").forEach(card => {
  const game = card.dataset.game;
  const stage = card.querySelector(".stage");
  const placeholder = card.querySelector(".placeholder");
  const stopBtn = card.querySelector(".stop");

  async function play(runtime) {
    const url = RUNTIME_URLS[runtime](game);

    // pygbag builds are made separately (build_pygbag.py), so check first.
    if (runtime === "pygbag") {
      const found = await fetch(url, { method: "HEAD" }).then(r => r.ok, () => false);
      if (!found) {
        showNotice(`The pygbag version isn't built yet. Run <code>python build_pygbag.py</code> once (needs internet).`);
        return;
      }
    }

    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = card.querySelector("h2").textContent;
    // Hand keyboard focus to the game as soon as it has loaded.
    frame.addEventListener("load", () => {
      frame.contentWindow.focus();
      frame.contentWindow.focusInput?.();
    });

    placeholder.hidden = true;
    stage.append(frame);
    stopBtn.hidden = false;
  }

  function stop() {
    stage.querySelector("iframe")?.remove();     // removing the iframe ends its Python
    placeholder.querySelector(".notice")?.remove();
    placeholder.hidden = false;
    stopBtn.hidden = true;
  }

  function showNotice(html) {
    placeholder.querySelector(".notice")?.remove();
    const p = document.createElement("p");
    p.className = "notice";
    p.innerHTML = html;
    placeholder.append(p);
  }

  placeholder.querySelectorAll("button[data-runtime]").forEach(btn =>
    btn.addEventListener("click", () => play(btn.dataset.runtime)));
  stopBtn.addEventListener("click", stop);
});
