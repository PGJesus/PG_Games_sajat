"""Serve the games page on http://localhost:8000 - works fully offline.

Use this instead of `python -m http.server`. It's the same thing plus two
headers that make the page "cross-origin isolated", which the hangman
console needs so Python's input() can wait for the player.

    python serve.py            # then open http://localhost:8000
    python serve.py 8080       # another port
"""
import http.server
import pathlib
import sys
import webbrowser

WEB_DIR = pathlib.Path(__file__).resolve().parent / "web"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".py": "text/plain; charset=utf-8",
        ".whl": "application/octet-stream",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        # "credentialless" (not "require-corp") so the online pygbag versions
        # can still load their runtime from pygame-web.github.io.
        self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    # 127.0.0.1 = only this computer can open it, nobody else on the network.
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://localhost:{PORT}/"
    print(f"Serving {WEB_DIR} at {url}  (Ctrl+C to stop)")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
