"""Application configuration loaded from environment variables / .env file.

Environment variables are declared in .env.example. No secrets are hard-coded.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Weather-Based Farming Assistance System"
    api_prefix: str = "/api"

    # Security. Override via SECRET_KEY env var in production.
    secret_key: str = "change-this-random-secret-key-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # Database. Defaults to SQLite for instant local demo runs.
    # Set DATABASE_URL to a PostgreSQL URL for production:
    #   postgresql://user:password@localhost:5432/weather_farm
    database_url: str = "sqlite:///./farming.db"

    # Weather provider settings ("open-meteo" is free and keyless).
    weather_provider: str = "open-meteo"
    allow_weather_mock: bool = True
    weather_cache_seconds: int = 900

    # CORS. Comma-separated origins.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()