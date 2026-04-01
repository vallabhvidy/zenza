from dataclasses import dataclass
from containers.base import Container
from models.code import Code

@dataclass
class RunRequest:
    request_id: str
    container: Container
    code: Code
    active: bool

