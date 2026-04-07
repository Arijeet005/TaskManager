from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(
    env_file=("../.env", "../.env.local", ".env", ".env.local"),
    extra="ignore",
  )

  database_url: str = "sqlite:///./tasks.db"
  cors_origins: str = "*"


settings = Settings()
