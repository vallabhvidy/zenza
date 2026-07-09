from typing import Type
from shared.config import settings
from worker.containers.base import Container
from worker.containers.python.python import (
    PythonContainerDocker,
    PythonContainerSubprocess,
    PythonContainer
)
from worker.containers.cpp.cpp import CppContainer

WORKER_REGISTRY = {
    'python': {
        'docker': PythonContainerDocker,
        'subprocess': PythonContainerSubprocess,
        'local': PythonContainer
    },
    'cpp': {
        'docker': CppContainer,
        'subprocess': CppContainer,
        'local': CppContainer
    }
}

class WorkerFactory:
    def __init__(self, strategy: str = None):
        self.strategy = strategy or settings.WORKER_STRATEGY

    def get_container_class(self, language: str) -> Type[Container]:
        language = language.lower()
        strategy = self.strategy.lower()

        lang_configs = WORKER_REGISTRY.get(language)
        if not lang_configs:
            raise ValueError(f"Unsupported language: '{language}'")

        container_class = lang_configs.get(strategy) or lang_configs.get('local')
        if not container_class:
            raise ValueError(f"No runner found for language '{language}' with strategy '{strategy}'")

        return container_class

worker_factory = WorkerFactory()
