// Electron wrapper for the Python Arcade page.
//
// It shows the exact same files as the browser version (../web), so the
// design and games are identical. The page can't be opened as a plain file
// (file://) because Pyodide refuses to load that way, so this app serves the
// folder to itself on a private "app://" address - no web server, no network,
// and with the same two isolation headers serve.py sends (needed by input()).

const { app, BrowserWindow, protocol, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const WEB_DIR = path.resolve(__dirname, "..", "web");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".py": "text/plain; charset=utf-8",
  ".zip": "application/zip",
  ".whl": "application/octet-stream",
  ".apk": "application/octet-stream",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

// Must run before the app is ready: lets app:// behave like a real https site
// (fetch works, it counts as secure, so shared memory can be switched on).
protocol.registerSchemesAsPrivileged([{
  scheme: "app",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
}]);

async function serveFile(request) {
  const { pathname } = new URL(request.url);
  let relative = decodeURIComponent(pathname);
  if (relative.endsWith("/")) relative += "index.html";

  // Never serve anything outside the web folder (e.g. app://arcade/../../secret).
  const file = path.resolve(WEB_DIR, "." + relative);
  if (file !== WEB_DIR && !file.startsWith(WEB_DIR + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await fs.readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 1000,
    backgroundColor: "#0f1117",
    autoHideMenuBar: true,
    title: "Python Arcade",
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });

  // Links that leave the app open in the normal browser, not inside it.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("app://")) event.preventDefault();
  });

  win.loadURL("app://arcade/");
}

app.whenReady().then(() => {
  protocol.handle("app", serveFile);
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
