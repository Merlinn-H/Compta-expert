"""
Standalone launcher for Compta Expert.
This is the PyInstaller entry point.

What it does:
1. Sets STANDALONE=1 so FastAPI serves the React frontend as static files
2. Picks an available port (default 8000, fallback to any free port)
3. Starts uvicorn in a background thread
4. Opens the browser once the server is ready
5. Keeps running until the user closes the window / Ctrl+C
"""

import os
import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path

# ── Data directory: store the SQLite DB in a user-writable location ──────────
if sys.platform == "darwin":
    data_dir = Path.home() / "Library" / "Application Support" / "ComptaExpert"
elif sys.platform == "win32":
    data_dir = Path(os.environ.get("APPDATA", Path.home())) / "ComptaExpert"
else:
    data_dir = Path.home() / ".compta_expert"

data_dir.mkdir(parents=True, exist_ok=True)

os.environ["STANDALONE"] = "1"
os.environ["COMPTA_DATA_DIR"] = str(data_dir)
# Use SQLite stored in the data directory
os.environ.setdefault(
    "DATABASE_URL", f"sqlite:///{data_dir / 'compta_expert.db'}"
)
# Generate a stable secret key derived from the machine (stored in data dir)
secret_file = data_dir / ".secret_key"
if secret_file.exists():
    secret_key = secret_file.read_text().strip()
else:
    import secrets
    secret_key = secrets.token_hex(32)
    secret_file.write_text(secret_key)
os.environ.setdefault("SECRET_KEY", secret_key)


def _free_port(preferred: int = 8000) -> int:
    """Return `preferred` if available, otherwise any free port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", preferred)) != 0:
            return preferred
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


PORT = _free_port(8000)
os.environ["PORT"] = str(PORT)
URL = f"http://127.0.0.1:{PORT}"


def _wait_and_open():
    """Poll until the server is accepting connections, then open the browser."""
    for _ in range(40):  # up to 20 seconds
        time.sleep(0.5)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", PORT)) == 0:
                webbrowser.open(URL)
                return
    webbrowser.open(URL)  # open anyway


def _run_server():
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=PORT,
        log_level="warning",
    )


if __name__ == "__main__":
    print(f"Starting Compta Expert on {URL}")
    print(f"Data directory: {data_dir}")

    threading.Thread(target=_wait_and_open, daemon=True).start()
    _run_server()
