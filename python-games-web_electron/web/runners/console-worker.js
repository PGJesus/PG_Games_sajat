// Runs a console Python game inside a Web Worker.
//
// Why a worker: Python's input() has to stop and wait for the player. The main
// page is never allowed to block like that, but a worker is - it can sleep on
// Atomics.wait() until the page writes the typed line into shared memory.
// Shared memory (SharedArrayBuffer) only exists on "cross-origin isolated"
// pages, which is why the site must be opened through serve.py / Electron.

importScripts("../pyodide/pyodide.js");

self.onmessage = async ({ data }) => {
  const { game, sab } = data;
  const ctrl = new Int32Array(sab, 0, 2);   // [0] = "line ready" flag, [1] = line length (-1 = EOF)
  const bytes = new Uint8Array(sab, 8);
  const decoder = new TextDecoder();
  const errDecoder = new TextDecoder();

  try {
    const pyodide = await loadPyodide({ indexURL: "../pyodide/" });

    pyodide.setStdout({ write: buf => { postMessage({ type: "out", text: decoder.decode(buf, { stream: true }) }); return buf.length; } });
    pyodide.setStderr({ write: buf => { postMessage({ type: "err", text: errDecoder.decode(buf, { stream: true }) }); return buf.length; } });

    // Every time Python calls input(), this runs: ask the page for a line,
    // then sleep until the page has written it into shared memory.
    pyodide.setStdin({
      stdin: () => {
        Atomics.store(ctrl, 0, 0);
        postMessage({ type: "stdin" });
        Atomics.wait(ctrl, 0, 0);
        const len = Atomics.load(ctrl, 1);
        if (len < 0) return null;                       // EOF -> Python raises EOFError
        return decoder.decode(bytes.slice(0, len));     // slice(): decode() can't read shared memory directly
      },
    });

    const code = await (await fetch(`../games/${game}/main.py`)).text();
    postMessage({ type: "ready" });
    pyodide.runPython(code);                            // __name__ == "__main__" here, like a real script
    postMessage({ type: "exit" });
  } catch (err) {
    postMessage({ type: "err", text: "\n" + String(err) + "\n" });
    postMessage({ type: "exit" });
  }
};
