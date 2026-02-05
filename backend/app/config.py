from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_key: str

    # Retell AI
    retell_api_key: str

    # LLM (at least one required)
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None

    # Application
    environment: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    def validate_llm_config(self) -> bool:
        """Ensure at least one LLM API key is configured."""
        return bool(self.anthropic_api_key or self.openai_api_key)


# Global settings instance
settings = Settings()
