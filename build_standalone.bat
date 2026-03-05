@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM build_standalone.bat — Build Compta Expert as a standalone Windows app
REM Produces: backend\dist\ComptaExpert\ComptaExpert.exe
REM
REM Requirements:
REM   - Node.js 18+  (node and npm must be on PATH)
REM   - Python 3.11+ (python must be on PATH)
REM   - pip install pyinstaller (inside your venv)
REM ─────────────────────────────────────────────────────────────────────────────

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Compta Expert — Standalone Build (Windows)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM ── Step 1: Build React frontend ─────────────────────────────────────────
echo.
echo ^> Step 1/3 — Building React frontend (standalone mode)...
cd frontend
call npm install --silent
if errorlevel 1 (echo ERROR: npm install failed & exit /b 1)
call npm run build:standalone
if errorlevel 1 (echo ERROR: frontend build failed & exit /b 1)
echo   OK Frontend built -^> frontend\dist\
cd ..

REM ── Step 2: Install Python dependencies ──────────────────────────────────
echo.
echo ^> Step 2/3 — Installing Python dependencies...
cd backend
pip install -q -r requirements.txt
if errorlevel 1 (echo ERROR: pip install failed & exit /b 1)
pip install -q pyinstaller
if errorlevel 1 (echo ERROR: pyinstaller install failed & exit /b 1)
echo   OK Python deps installed

REM ── Step 3: PyInstaller ──────────────────────────────────────────────────
echo.
echo ^> Step 3/3 — Packaging with PyInstaller...
pyinstaller compta_expert.spec --noconfirm --clean
if errorlevel 1 (echo ERROR: PyInstaller failed & exit /b 1)
echo   OK App packaged -^> backend\dist\ComptaExpert\
cd ..

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Build complete!
echo   Executable: backend\dist\ComptaExpert\ComptaExpert.exe
echo   To run:     double-click ComptaExpert.exe
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
