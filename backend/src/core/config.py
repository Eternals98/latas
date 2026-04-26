from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    database_url: str = "sqlite:///./ventas.db"
    admin_username: str = "admin"
    admin_password: str = "partes2627"
    admin_jwt_secret: str = "change-me-admin-secret"
    admin_jwt_algorithm: str = "HS256"
    admin_jwt_ttl_seconds: int = 8 * 60 * 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
