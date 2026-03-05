import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import auth, categories, dashboard, exchange_rates, reports, tax, transactions
from app.core.config import settings
from app.db.database import Base, engine

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Compta Expert API",
    description="Bilingual (FR/EN) accounting app for Quebec & France jurisdictions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(dashboard.router)
app.include_router(tax.router)
app.include_router(reports.router)
app.include_router(exchange_rates.router)


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── Standalone mode: serve the built React frontend ───────────────────────────
# API routes registered above always take priority. Everything else falls
# through to React's index.html so client-side routing works correctly.

def _find_static_dir() -> Path | None:
    """
    Locate the frontend dist/ directory whether we're running:
    - As a PyInstaller bundle  (sys._MEIPASS)
    - As a normal Python process from the project root
    """
    if hasattr(sys, "_MEIPASS"):
        candidate = Path(sys._MEIPASS) / "frontend_dist"
    else:
        candidate = Path(__file__).parent.parent.parent / "frontend" / "dist"
    return candidate if candidate.is_dir() else None


if settings.STANDALONE:
    static_dir = _find_static_dir()
    if static_dir:
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

        @app.get("/favicon.svg")
        def favicon():
            return FileResponse(str(static_dir / "favicon.svg"))

        # Catch-all: return index.html for every non-API path (React Router)
        @app.get("/{full_path:path}", include_in_schema=False)
        def spa_fallback(full_path: str):
            return FileResponse(str(static_dir / "index.html"))
    else:
        @app.get("/")
        def root_standalone():
            return {"status": "ok", "app": "Compta Expert", "version": "1.0.0",
                    "note": "standalone mode — run build_standalone first"}
else:
    @app.get("/")
    def root():
        return {"status": "ok", "app": "Compta Expert", "version": "1.0.0"}
