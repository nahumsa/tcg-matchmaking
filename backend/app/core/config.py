from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tcg_matchmaking"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"
    RECONNECT_CODE_PEPPER: str = "dev-reconnect-pepper-change-me"
    RELOGIN_RATE_LIMIT_ATTEMPTS: int = 10
    RELOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300

    model_config = SettingsConfigDict(env_file=".env")

    @model_validator(mode="after")
    def validate_urls(self):
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                "postgresql://postgres:postgres@localhost:5432/tcg_matchmaking"
            )
        if not self.TEST_DATABASE_URL:
            self.TEST_DATABASE_URL = "sqlite:///./test.db"
        if not self.RECONNECT_CODE_PEPPER:
            self.RECONNECT_CODE_PEPPER = "dev-reconnect-pepper-change-me"
        return self


settings = Settings()
