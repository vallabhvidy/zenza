import subprocess
import tempfile
import uuid
import os

from ..base import Container, stopwatch

class CppContainer(Container):
    def __init__(self, code: str):
        self.executable_file_name = str(uuid.uuid4())
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp') as f:
            f.write(code)
            f.flush()
            try:
                output = subprocess.run(
                    ['g++', f.name, '-o', self.executable_file_name],
                    capture_output=True,
                    text=True,
                    check=True
                )

            except subprocess.CalledProcessError as e:
                return 'Compilation Error'

        self.code = code

    @stopwatch
    def run(self, testcase):
        
        try:
            subprocess.run(
                [f'./{self.executable_file_name}'],
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
        os.remove(f'./{self.executable_file_name}')
        return super().close()