from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Research Thesis Portal API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    app_debug: bool = True
    database_url: str = (
        "postgresql+asyncpg://thesis_user:replace-with-secure-password"
        "@localhost:5433/thesis_db"
    )
    test_database_url: str = (
        "postgresql+asyncpg://thesis_user:replace-with-secure-password"
        "@localhost:5433/thesis_test_db"
    )
    jwt_secret_key: str = "replace-with-a-secure-jwt-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
