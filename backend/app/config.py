from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    retell_api_key: str
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"
    llm_provider: str = "anthropic"  # or "openai"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
