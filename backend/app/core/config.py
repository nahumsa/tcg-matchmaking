from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tcg_matchmaking"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"

    model_config = SettingsConfigDict(env_file=".env")

    @model_validator(mode="after")
    def validate_urls(self):
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                "postgresql://postgres:postgres@localhost:5432/tcg_matchmaking"
            )
        if not self.TEST_DATABASE_URL:
            self.TEST_DATABASE_URL = "sqlite:///./test.db"
        return self


settings = Settings()
