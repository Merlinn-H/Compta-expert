import os
from pathlib import Path

from pydantic_settings import BaseSettings


def _default_db_url() -> str:
    """
    Standalone mode (no Docker): use SQLite in the user's data directory.
    Docker / server mode: use PostgreSQL via DATABASE_URL env var.
    """
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    # Standalone: store DB next to the executable (or in CWD during dev)
    db_path = Path(os.environ.get("COMPTA_DATA_DIR", ".")) / "compta_expert.db"
    return f"sqlite:///{db_path}"


class Settings(BaseSettings):
    DATABASE_URL: str = _default_db_url()
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRANKFURTER_API_URL: str = "https://api.frankfurter.app"
    # When True: FastAPI serves the built React frontend as static files
    STANDALONE: bool = bool(os.environ.get("STANDALONE", ""))
    # Port used by the standalone launcher
    PORT: int = int(os.environ.get("PORT", "8000"))

    class Config:
        env_file = ".env"


settings = Settings()

