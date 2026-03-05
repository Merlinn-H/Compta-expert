from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://compta:compta_secret@localhost:5432/compta_expert"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRANKFURTER_API_URL: str = "https://api.frankfurter.app"

    class Config:
        env_file = ".env"


settings = Settings()
