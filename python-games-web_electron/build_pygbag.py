"""Build the online (pygbag) versions of the pygame games.

Run once, with internet:   python build_pygbag.py
Needs pygbag:              pip install pygbag

pygbag downloads its page template while building, and the built game loads
its Python runtime from pygame-web.github.io every time it starts. So these
versions only work online - the normal "Play" buttons are the offline ones.
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GAMES = ["tictactoe", "snake"]

try:
    import pygbag  # noqa: F401
except ImportError:
    sys.exit("pygbag is not installed. Run:  pip install pygbag")

for game in GAMES:
    src = ROOT / "web" / "games" / game
    dest = ROOT / "web" / "pygbag" / game
    print(f"\n=== Building {game} ===")
    try:
        # Offline, pygbag can hang waiting for its template server - give up after 5 min.
        ok = subprocess.run([sys.executable, "-m", "pygbag", "--build", str(src)], timeout=300).returncode == 0
    except subprocess.TimeoutExpired:
        ok = False
    built = src / "build" / "web"
    if not ok or not (built / "index.html").exists():
        sys.exit(f"Build of {game} failed (no internet? pygbag needs it to build).")
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(built, dest)
    shutil.rmtree(src / "build")          # keep the games folder clean
    print(f"OK -> {dest}")

print("\nDone. Start the page with:  python serve.py")
