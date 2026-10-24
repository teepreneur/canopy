from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://canopy:canopy@localhost:5432/canopy"
    database_url_sync: str = "postgresql+psycopg2://canopy:canopy@localhost:5432/canopy"
    redis_url: str | None = "redis://localhost:6379/0"
    secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    pairing_code_expire_minutes: int = 15

    model_config = {"env_prefix": "CANOPY_"}

    @model_validator(mode="after")
    def fix_driver_prefixes(self):
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            self.database_url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        sync_url = self.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        self.database_url_sync = sync_url
        return self


settings = Settings()
