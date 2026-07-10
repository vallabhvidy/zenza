import resource
from abc import ABC, abstractmethod
from worker.containers.const import TIMEOUT, TCERROR
import subprocess
import tempfile
import os
import logging

logger = logging.getLogger("worker.container")

TIMEOUT_ERROR  = {"time": 0, "memory": 0, "status": "TLE"}
TESTCASE_ERROR = {"time": 0, "memory": 0, "status": "RE"}
TIME_COMMAND = ['/usr/bin/time', '-f', '%M', '-o', 'memory.txt']

def time_command(filename: str) -> list:
    return ['/usr/bin/time', '-f', '%M', '-o', filename]

class Container(ABC):
    timeout = 1.0
    def __init__(self, code):
        self.code = code
        self.command = []

    def run(self, testcase):
            
        tmp = tempfile.NamedTemporaryFile(delete=False)
        path = tmp.name
        tmp.close()

        command = time_command(path) + self.command

        start_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        try:
            subprocess.run(
                command,
                input=testcase,
                text=True,
                timeout=self.timeout,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True
            )

        except subprocess.TimeoutExpired:
            return TIMEOUT_ERROR

        except subprocess.CalledProcessError as e:
            return TESTCASE_ERROR

        end_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        cpu_time_in_ms = ((
            end_usage.ru_utime - start_usage.ru_utime
        ) + (
            end_usage.ru_stime - start_usage.ru_stime
        )) * 1000


        try:
            with open(path, 'r') as f:
                memory_in_kb = int(f.read().strip())
        except FileNotFoundError:
            memory_in_kb = end_usage.ru_maxrss

        os.remove(path)

        output = {
            'time': cpu_time_in_ms,
            'memory': memory_in_kb,
            'status': 'OK'
        }

        logger.info(f"time for testcase: {output['time']} ms")
        logger.info(f"memory for testcase: {output['memory']} KB")

        return output

    @abstractmethod
    def close(self):
        pass