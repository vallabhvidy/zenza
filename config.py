import os
from typing import Literal
class Settings:
    WORKER_STRATEGY: Literal["docker", "subprocess", "local"] = os.getenv(
        "WORKER_STRATEGY", "docker"
    )
settings = Settings()