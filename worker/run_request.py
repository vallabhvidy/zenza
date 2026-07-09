from dataclasses import dataclass
from worker.containers.base import Container
from shared.models.code import Code

@dataclass
class RunRequest:
    request_id: str
    container: Container
    code: Code
    active: bool
