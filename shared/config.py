import os
from typing import Literal

class Settings:
    WORKER_STRATEGY: Literal["docker", "subprocess", "local"] = os.getenv(
        "WORKER_STRATEGY", "local"
    )
    REDIS_URL: str | None = os.getenv("REDIS_URL")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))

settings = Settings()
