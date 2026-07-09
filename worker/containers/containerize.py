from worker.containers.python.python import PythonContainerDocker
from worker.containers.cpp.cpp import CppContainer

containers = {
    'cpp': CppContainer,
    'python': PythonContainerDocker
}