from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://canopy:canopy@localhost:5432/canopy"
    database_url_sync: str = "postgresql+psycopg2://canopy:canopy@localhost:5432/canopy"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    pairing_code_expire_minutes: int = 15

    model_config = {"env_prefix": "CANOPY_"}


settings = Settings()
