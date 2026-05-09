from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tcg_matchmaking"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"
    RECONNECT_CODE_PEPPER: str = "dev-reconnect-pepper-change-me"
    RELOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True

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
        if not self.ALLOWED_ORIGINS:
            self.ALLOWED_ORIGINS = [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        return self


settings = Settings()
