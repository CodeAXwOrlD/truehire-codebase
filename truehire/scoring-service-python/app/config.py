import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8000
    environment: str = "development"
    database_url: str = ""
    service_shared_secret: str = "dev-shared-secret"
    service_signature_max_age_seconds: int = 60
    openai_api_key: str = ""
    groq_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_prod(self) -> bool:
        return self.environment.lower() == "production"


settings = Settings()
