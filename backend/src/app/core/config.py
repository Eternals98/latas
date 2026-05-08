"""
Application configuration management.
Handles environment variables, settings, and dynamic configuration for different environments.
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

def _get_env_file() -> str:
    """Determines which .env file to load based on the APP_ENV environment variable."""
    env = os.getenv("APP_ENV", "local")
    if env == "production":
        return ".env.production"
    return ".env"

class Settings(BaseSettings):
    """
    Application settings model.
    Validates and stores all configuration parameters needed by the backend.
    """
    app_env: str = "local"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    database_url: str = ""
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwks_url: str = ""
    supabase_jwt_issuer: str = ""
    supabase_jwt_audience: str = "authenticated"
    supabase_jwks_cache_ttl_seconds: int = 300
    supabase_service_role_key: str = ""

    model_config = SettingsConfigDict(env_file=_get_env_file(), env_file_encoding="utf-8", extra="ignore")

# Global settings instance
settings = Settings()

def get_cors_origins() -> list[str]:
    """Parses the CORS origins string into a list of allowed origins."""
    return [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

def get_supabase_jwks_url() -> str:
    """Retrieves or constructs the Supabase JWKS URL for JWT verification."""
    if settings.supabase_jwks_url:
        return settings.supabase_jwks_url
    if settings.supabase_url:
        return f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return ""

def get_supabase_jwt_issuer() -> str:
    """Retrieves or constructs the Supabase JWT issuer URL."""
    if settings.supabase_jwt_issuer:
        return settings.supabase_jwt_issuer
    if settings.supabase_url:
        return f"{settings.supabase_url.rstrip('/')}/auth/v1"
    return ""
