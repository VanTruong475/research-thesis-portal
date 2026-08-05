from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Research Thesis Portal API"
    app_version: str = "0.1.0"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
