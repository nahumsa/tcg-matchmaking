from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tcg_matchmaking"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
