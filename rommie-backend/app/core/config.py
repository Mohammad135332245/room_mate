"""Application settings, loaded from the environment."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    PROJECT_NAME: str = "RoomieMA"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "dev"  # dev | test | prod
    DEBUG: bool = True

    # --- Database ---
    # Postgres in every real environment; sqlite+aiosqlite is handy for tests.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/roomiema"
    DB_ECHO: bool = False

    # --- Auth ---
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # --- CORS ---
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
    )

    # --- Integrations (optional; features degrade gracefully when unset) ---
    CLOUDINARY_URL: str | None = None
    BREVO_API_KEY: str | None = None
    EMAIL_FROM: str = "no-reply@roomiema.ma"
    EMAIL_FROM_NAME: str = "RoomieMA"
    FRONTEND_URL: str = "http://localhost:5173"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value):
        
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_prod(self) -> bool:
        return self.ENVIRONMENT == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
