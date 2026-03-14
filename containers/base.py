import resource
from abc import ABC, abstractmethod


def stopwatch(run):
    def wrapper(self, *args, **kargs):
        start_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        result = run(self, *args, **kargs)

        end_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        cpu_time = (
            end_usage.ru_utime - start_usage.ru_utime
        ) + (
            end_usage.ru_stime - start_usage.ru_stime
        )

        return cpu_time if result is None else result
    
    return wrapper



class Container(ABC):
    @abstractmethod
    def __init__(self, code):
        pass

    @abstractmethod
    def run(self, testcase):
        pass

    @abstractmethod
    def close(self):
        pass