import subprocess

from base import Container, stopwatch

class PythonContainer(Container):
    def __init__(self, code):
        self.code = code
        pass

    @stopwatch
    def run(self, testcase: str):

        try:
            subprocess.run(
                ['python', '-c', self.code],
                input=testcase,
                text=True,
                timeout=3,
                stdout=subprocess.DEVNULL,
                check=True
            )

        except subprocess.TimeoutExpired:
            return -1

        except subprocess.CalledProcessError as e:
            return -1
    
    def close(self):
        return super().close()
    
