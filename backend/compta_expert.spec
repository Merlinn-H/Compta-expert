# PyInstaller spec for Compta Expert standalone app
# Build with:  pyinstaller compta_expert.spec

import sys
from pathlib import Path

block_cipher = None

# Path to the project root (one level up from backend/)
PROJECT_ROOT = Path(SPECPATH).parent
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

a = Analysis(
    ["standalone_launcher.py"],
    pathex=[str(PROJECT_ROOT / "backend")],
    binaries=[],
    datas=[
        # Bundle the built React frontend as a single static directory
        (str(FRONTEND_DIST), "frontend_dist"),
    ],
    hiddenimports=[
        # SQLAlchemy — only SQLite needed for standalone (no psycopg2)
        "sqlalchemy.dialects.sqlite",
        "sqlalchemy.pool",
        # passlib bcrypt backend
        "passlib.handlers.bcrypt",
        "passlib.handlers.sha2_crypt",
        # PyJWT (replaces python-jose)
        "jwt",
        "jwt.algorithms",
        # slowapi / limits
        "slowapi",
        "limits",
        "limits.storage",
        "limits.strategies",
        # pydantic
        "pydantic.deprecated.class_validators",
        "pydantic_settings",
        # httpx
        "httpx",
        "httpx._transports.default",
        # reportlab (PDF generation)
        "reportlab",
        "reportlab.graphics",
        "reportlab.platypus",
        "reportlab.lib.pagesizes",
        "reportlab.lib.styles",
        "reportlab.lib.units",
        # uvicorn internals (subset — no websockets needed for standalone)
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        # fastapi / starlette
        "fastapi.staticfiles",
        "fastapi.responses",
        "starlette.staticfiles",
        "starlette.responses",
        # app modules
        "app.main",
        "app.api.auth",
        "app.api.transactions",
        "app.api.categories",
        "app.api.dashboard",
        "app.api.tax",
        "app.api.reports",
        "app.api.exchange_rates",
        "app.services.auth",
        "app.services.transaction",
        "app.services.dashboard",
        "app.services.exchange_rate",
        "app.services.tax_quebec",
        "app.services.tax_france",
        "app.services.reporting",
        "app.models.user",
        "app.models.transaction",
        "app.models.category",
        "app.models.tax_entry",
        "app.core.config",
        "app.core.security",
        "app.db.database",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    # Aggressively exclude things not needed in standalone mode
    excludes=[
        "tkinter", "test", "unittest",
        "pandas", "openpyxl", "alembic",
        "psycopg2", "psycopg2-binary",
        "matplotlib", "scipy", "numpy",
        "IPython", "jupyter",
        "setuptools", "pkg_resources",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="ComptaExpert",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,    # No terminal window on Windows/Mac
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon="icon.icns",  # Uncomment and add icon file for Mac
    # icon="icon.ico",  # Uncomment and add icon file for Windows
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="ComptaExpert",
)

# Mac: wrap in a .app bundle
if sys.platform == "darwin":
    app = BUNDLE(
        coll,
        name="ComptaExpert.app",
        icon=None,  # Replace with "icon.icns" if available
        bundle_identifier="com.compta-expert.app",
        info_plist={
            "CFBundleShortVersionString": "1.0.0",
            "CFBundleName": "Compta Expert",
            "NSHighResolutionCapable": True,
        },
    )
