#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build_standalone.sh — Build Compta Expert as a standalone desktop app
# Produces: backend/dist/ComptaExpert/  (Linux/Mac)
#           backend/dist/ComptaExpert.app (Mac bundle)
#
# Requirements:
#   - Node.js 18+  (for the frontend build)
#   - Python 3.11+ (for the backend)
#   - pip install pyinstaller (inside your venv)
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Compta Expert — Standalone Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Build the React frontend ─────────────────────────────────────────
echo ""
echo "▶ Step 1/3 — Building React frontend (standalone mode)..."
cd frontend
npm install --silent
npm run build:standalone
echo "  ✓ Frontend built → frontend/dist/"
cd ..

# ── Step 2: Install Python dependencies ──────────────────────────────────────
echo ""
echo "▶ Step 2/3 — Installing Python dependencies..."
cd backend
pip install -q -r requirements.txt
pip install -q pyinstaller
echo "  ✓ Python deps installed"

# ── Step 3: Run PyInstaller ───────────────────────────────────────────────────
echo ""
echo "▶ Step 3/3 — Packaging with PyInstaller..."
pyinstaller compta_expert.spec --noconfirm --clean
echo "  ✓ App packaged → backend/dist/ComptaExpert/"
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build complete!"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  App bundle: backend/dist/ComptaExpert.app"
    echo "  To run:     open backend/dist/ComptaExpert.app"
else
    echo "  Executable: backend/dist/ComptaExpert/ComptaExpert"
    echo "  To run:     ./backend/dist/ComptaExpert/ComptaExpert"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
